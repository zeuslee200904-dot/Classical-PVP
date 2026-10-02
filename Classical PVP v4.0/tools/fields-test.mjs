/* ============================================================
   tools/fields-test.mjs — 领域相关的走位与平衡性校验
   用法: node fields-test.mjs
   校验项：
     1. 玩家自己开领域后仍能正常接近敌人
     2. 站在敌方领域里仍能走位（减速倍率不再致命）
     3. AI 不会因为领域而无限逃避、永远无法接近
     4. 领域伤害整体下调后的实际数值
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const noop = () => { };
function EffectsStub() {
  this.list = []; this.numbers = []; this.shake = 0; this.flash = 0;
  this.clear = noop; this.update = noop; this.draw = noop; this.drawNumbers = noop;
  this.add = (p) => p; this.addNumber = noop; this.kick = noop; this.skillFx = noop;
  this.blockSpark = noop; this.hitBurst = noop; this.sparks = noop; this.ring = noop;
}
const ctxStub = new Proxy({}, { get: (t, k) => (typeof k === 'string' ? noop : undefined), set: () => true });
const canvas = { getContext: () => ctxStub, width: 960, height: 540 };
const win = {
  FX: { Effects: EffectsStub, drawText: noop, textWidth: () => 10, rr: noop, rnd: (a) => a, pickOne: () => '0' },
  Sprites: { draw: noop, frameName: () => 'idle0' },
  Chiptune: {
    sfx: noop, stopMusic: noop, resume: noop, toggleMute: () => false, setMuted: () => false, playing: false,
    playTrack: () => ({ title: 'stub' }), trackCount: () => 12, trackTitle: () => 'stub'
  },
  document: { createElement: () => ({ getContext: () => ctxStub }) },
  performance: { now: () => 0 }, requestAnimationFrame: noop
};
win.window = win;
const c = vm.createContext({
  window: win, console, Math, Object, Array, JSON, String, Number, Boolean,
  isNaN, parseInt, parseFloat, RegExp, Date
});
vm.runInContext(read('../js/characters.js'), c, { filename: 'characters.js' });
vm.runInContext(read('../js/ai.js'), c, { filename: 'ai.js' });       // 使用真实 AI
vm.runInContext(read('../js/game.js'), c, { filename: 'game.js' });

const GC = win.GameClass;
const BY = win.COMPOSER_BY_ID;
const K = win.GAME_CONST;
let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };

function newGame(team, enemyId) {
  const g = new GC(canvas);
  g.selSlots = team;
  g.startMatch();
  if (enemyId) {
    // 固定敌方首发角色，保证测试可复现
    const f = g.enemyTeam[0];
    f.c = BY[enemyId];
    f.maxHp = f.c.maxHp;
    f.hp = f.maxHp;
    f.cd = [0, 0, 0];
    g.enemyTeam = [f];
    g.playerTeam = [g.playerTeam[0]];
  }
  g.nextRound();
  g.phase = 'play';
  return g;
}

// ---------------------------------------------------------
console.log('== 1. 玩家开启领域后能否接近敌人 ==');
function approachTest(label, setup) {
  const g = newGame([15, 20, 21], 'vivaldi');    // 敌方维瓦尔第（Q/W 都是领域，最爱拉开距离）
  g.left.x = 210; g.right.x = 720;
  g.left.vx = 0; g.right.vx = 0;
  if (setup) setup(g);
  const x0 = g.left.x, e0 = g.right.x;
  const d0 = Math.abs(e0 - x0);
  const speeds = [];
  // 玩家持续向右推进（模拟按住 L），同时让 AI 正常行动
  for (let i = 0; i < 180; i++) {
    g.input.right = true;
    g.input.left = false;
    g.input.punch = false; g.input.kick = false; g.input.s1 = false;
    g.input.s2 = false; g.input.ult = false; g.input.block = false;
    g.ai.update(g.right, g.left);
    g.readPlayerInput(g.left, g.right);
    speeds.push(g.left.speedValue());
    g.stepFighter(g.left, g.right);
    g.stepFighter(g.right, g.left);
    g.separate(g.left, g.right);
    g.stepFields();
  }
  const d1 = Math.abs(g.right.x - g.left.x);
  const minSpeed = Math.min(...speeds);
  console.log(`  ${label.padEnd(20, ' ')} 距离 ${d0.toFixed(0)} → ${d1.toFixed(0)}（缩短 ${(d0 - d1).toFixed(0)}）` +
    `  最低移速 ${minSpeed.toFixed(2)}`);
  return { d0, d1, closed: d0 - d1, minSpeed };
}

const base = approachTest('无领域（基准）');
ck(base.closed > 250, '基准情况下玩家能迅速接近（缩短 ' + base.closed.toFixed(0) + '）');

const mine = approachTest('玩家自己开领域', (g) => {
  g.left.cd[1] = 0;
  g.useSkill(g.left, g.right, 1);
});
ck(mine.closed > base.closed * 0.7, '自己开领域后仍能接近（缩短 ' + mine.closed.toFixed(0) + ' ≥ 基准 70%）');

const their = approachTest('敌方开领域压制', (g) => {
  g.right.cd[1] = 0;
  g.useSkill(g.right, g.left, 1);      // 维瓦尔第「四季·冬」：强力减速
});
ck(their.minSpeed >= 1.4, '敌方领域内最低移速 ≥ 1.4（不会慢到走不动，实测 ' + their.minSpeed.toFixed(2) + '）');
ck(their.closed > base.closed * 0.55, '仍能推进（缩短 ' + their.closed.toFixed(0) + ' ≥ 基准 55%）');

// ---------------------------------------------------------
console.log('\n== 2. 领域减速的实际倍率 ==');
const g2 = newGame([15, 20, 21]);
const slowers = [];
for (const id of ['vivaldi', 'haydn', 'debussy', 'verdi', 'ravel']) {
  for (const sk of BY[id].skills) {
    if (sk.field && sk.field.slow) slowers.push({ who: BY[id].name, sk: sk.name, slow: sk.field.slow });
  }
}
const worst = Math.min(...slowers.map(s => s.slow));
console.log('  数据表中最低减速倍率 = ' + worst + '（' + slowers.filter(s => s.slow === worst).map(s => s.who + '/' + s.sk).join('、') + '）');
g2.right.x = g2.left.x + 60;
g2.left.cd[1] = 0;
g2.useSkill(g2.left, g2.right, 1);
for (let i = 0; i < 40; i++) g2.stepFields();
const appliedSlow = g2.right.slow ? g2.right.slow.power : null;
console.log('  实际施加到对手身上的减速倍率 = ' + appliedSlow +
  '（面板 ' + BY.haydn.skills[1].field.slow + '，下限 ' + (win.GAME_CONST.FIELD_SLOW_FLOOR) + '）');
ck(appliedSlow !== null && appliedSlow >= 0.5, '实际减速不低于 0.5（不会慢到走不动）');

// ---------------------------------------------------------
console.log('\n== 3. AI 不会因领域无限逃避 ==');
const g3 = newGame([15, 20, 21]);
g3.left.x = 300; g3.right.x = 620;
g3.left.cd[1] = 0;
g3.useSkill(g3.left, g3.right, 1);        // 玩家的领域盖住敌人
const decideCount = {};
let steps = 0, leaveSteps = 0;
const d0 = Math.abs(g3.right.x - g3.left.x);
for (let i = 0; i < 420; i++) {
  g3.ai.update(g3.right, g3.left);
  decideCount[g3.ai.decision] = (decideCount[g3.ai.decision] || 0) + 1;
  if (g3.ai.decision === 'leave') leaveSteps++;
  g3.readPlayerInput && (g3.input.right = true);
  g3.readPlayerInput(g3.left, g3.right);
  g3.stepFighter(g3.right, g3.left);
  g3.stepFighter(g3.left, g3.right);
  g3.separate(g3.left, g3.right);
  g3.stepFields();
  steps++;
  if (g3.fields.length === 0) break;
}
const leaveRate = leaveSteps / steps;
console.log('  AI 决策分布 ' + JSON.stringify(decideCount) + ' 逃避占比 ' + (leaveRate * 100).toFixed(0) + '%');
ck(leaveRate < 0.75, '逃避决策占比 < 75%（实测 ' + (leaveRate * 100).toFixed(0) + '%）');
const decisions = Object.keys(decideCount).filter(k => k !== 'leave' && k !== 'hold');
ck(decisions.length > 0, 'AI 在领域内仍会做出攻击/技能决策：' + decisions.join('/'));

// ---------------------------------------------------------
console.log('\n== 4. 领域伤害（微下调后）==');
const g4 = newGame([15, 20, 21]);
g4.left.x = 300; g4.right.x = 420;
g4.right.hp = 100000;
g4.left.cd[1] = 0;
g4.useSkill(g4.left, g4.right, 1);
const before = g4.right.hp;
let frames = 0;
while (g4.fields.length && frames < 1200) { g4.stepFields(); frames++; }
const total = before - g4.right.hp;
const spec = BY.haydn.skills[1].field;
const scale = win.GAME_CONST.FIELD_DAMAGE_SCALE;
const ticks = Math.floor(spec.dur * 60 / spec.tickEvery);
// 每次判定单独取整
const perTick = Math.round(spec.dps * scale * g4.left.damageMul());
const expected = perTick * ticks;
console.log(`  海顿「时钟交响曲」 面板 ${spec.dps}/次 × ${ticks} 次 = ${spec.dps * ticks}`);
console.log(`  实际每次伤害 = round(${spec.dps} × 缩放 ${scale} × 攻击倍率 ${g4.left.damageMul().toFixed(2)}) = ${perTick}`);
console.log(`  实测总伤害 ${total.toFixed(0)}；期望 ${perTick} × ${ticks} = ${expected}`);
ck(Math.abs(total - expected) <= 2, '领域伤害 = 面板 × 0.8 缩放 × 攻击倍率（v2.1 下调后）');
const oldTotal = Math.round(spec.dps * g4.left.damageMul()) * ticks;
console.log(`  对比下调前总伤害 ≈ ${oldTotal}（本次下调 ${(100 - total / oldTotal * 100).toFixed(0)}%）`);
ck(total < oldTotal, '总伤害确实低于下调前（' + total + ' < ' + oldTotal + '）');

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 领域相关校验通过'));
process.exitCode = fail ? 1 : 0;

/* ============================================================
   tools/ai-test.mjs — 敌方 AI 行为统计与回归测试
   统计 AI 在一整场对局中的：普攻次数 / 技能次数 / 终极技次数与时机
   用法: node ai-test.mjs
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const noop = () => { };
function EffectsStub() {
  this.list = []; this.shake = 0; this.flash = 0;
  this.clear = noop; this.update = noop; this.draw = noop; this.drawNumbers = noop;
  this.add = (p) => { this.list.push(p); return p; };
  this.addNumber = noop; this.kick = noop; this.skillFx = noop;
  this.blockSpark = noop; this.hitBurst = noop; this.sparks = noop; this.ring = noop;
}
const ctxStub = new Proxy({}, { get: (t, k) => (typeof k === 'string' ? noop : undefined), set: () => true });
const canvas = { getContext: () => ctxStub, width: 960, height: 540 };
const win = {
  FX: { Effects: EffectsStub, drawText: noop, textWidth: () => 10, rr: noop, rnd: (a) => a, pickOne: () => '0' },
  Sprites: { draw: noop, frameName: () => 'idle0' },
  Chiptune: {
    sfx: noop, stopMusic: noop, resume: noop, toggleMute: () => false, setMuted: () => false,
    playing: false, playTrack: () => ({ title: 'stub' }), trackCount: () => 12, trackTitle: () => 'stub'
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
vm.runInContext(read('../js/ai.js'), c, { filename: 'ai.js' });
vm.runInContext(read('../js/game.js'), c, { filename: 'game.js' });

const GC = win.GameClass, BY = win.COMPOSER_BY_ID;
let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };

/** 打一场只统计 AI 行为的假对局：玩家不还手，AI 攻击一个血量无限的木桩 */
function simulate(aiId, playerId, frames, opts) {
  opts = opts || {};
  const g = new GC(canvas);
  g.selSlots = [0, 1, 2];
  g.startMatch();
  const mk = (id) => {
    const f = new win.FighterClass(BY[id], 'x', 0);
    return f;
  };
  const ai = mk(aiId), player = mk(playerId);
  ai.side = 'left'; ai.x = 300;
  player.side = 'right'; player.x = opts.gap == null ? 360 : opts.gap;
  g.left = ai; g.right = player;
  g.playerTeam = [ai]; g.enemyTeam = [player];
  g.applyBonds([ai]);
  g.applyBonds([player]);
  g.ai.reset(ai);              // 与真实对局一致：每回合开始时重置 AI
  // v4.2：与引擎一致，正式开打时双方终极技带 6 秒初始冷却
  ai.cd[2] = Math.max(ai.cd[2], win.GAME_CONST.ULT_OPENING_CD);
  if (opts.noReset) g.ai.aggression = undefined;   // 反向测试：模拟忘记 reset
  g.phase = 'play';
  g.state = 'fight';
  g.t = 0;

  const count = { punch: 0, kick: 0, skills: [0, 0, 0], ultAt: [], firstUlt: -1, ultDist: [], ultEarly: [], landedBasic: 0, basicDamage: 0 };
  const realBasic = g.startBasic.bind(g);
  g.startBasic = function (me, kind) {
    if (me === ai) count[kind === 'punch' ? 'punch' : 'kick']++;
    return realBasic(me, kind);
  };
  const realSkill = g.useSkill.bind(g);
  g.useSkill = function (me, foe, slot) {
    if (me === ai) {
      count.skills[slot]++;
      if (slot === 2) {
        var dist = Math.abs(foe.x - me.x);
        count.ultAt.push(g.t);
        count.ultDist.push(Math.round(dist));
        if (count.firstUlt < 0) count.firstUlt = g.t;
      }
    }
    return realSkill(me, foe, slot);
  };

  for (let i = 0; i < frames; i++) {
    g.t++;
    g.playT = (g.playT || 0) + 1;
    // 玩家：站在原地不动、不还手（只当木桩），血量保持
    player.hp = player.maxHp;
    player.stun = 0;
    player.invuln = 0;
    player.blocking = false;
    player.dead = false;
    player.state = 'idle';
    ai.hp = Math.max(1, ai.hp);          // 不让 AI 因掉血改变性格
    if (opts.playerMoves) player.x = 300 + Math.round(180 + Math.sin(i / 55) * 160);
    else player.x = opts.gap == null ? 360 : opts.gap;
    g.ai.update(ai, player);
    g.stepFighter(ai, player);
    g.stepFighter(player, ai);
    // 统计 AI 普攻真正打中的次数（判定帧命中）
    g.separate(ai, player);
    if (player.hp < player.maxHp) {
      count.landedBasic++;
      count.basicDamage += player.maxHp - player.hp;
      player.hp = player.maxHp;
    }
  }
  count.aiX = Math.round(ai.x);
  return count;
}

const TEAM_IDS = ['beethoven', 'mozart', 'brahms', 'mahler', 'wagner', 'schumann'];
const ALL = win.COMPOSERS.map(c => c.id);

console.log('== 1. AI 是否会使用挥拳 / 踢腿 ==');
let totPunch = 0, totKick = 0, totSkill = 0;
const rows = [];
for (const id of ALL) {
  const r = simulate(id, 'mozart', 900);
  totPunch += r.punch; totKick += r.kick;
  totSkill += r.skills[0] + r.skills[1] + r.skills[2];
  rows.push({ id, name: BY[id].name, punch: r.punch, kick: r.kick, skill: r.skills[0] + r.skills[1] + r.skills[2] });
}
const noBasic = rows.filter(r => r.punch + r.kick === 0);
console.log('  50 位角色各打 15 秒：普攻合计 ' + (totPunch + totKick) + ' 次（挥拳 ' + totPunch + ' / 踢腿 ' + totKick + '），技能合计 ' + totSkill + ' 次');
console.log('  完全不出普攻的角色 = ' + (noBasic.length ? noBasic.map(r => r.name).join('、') : '无'));
ck(noBasic.length === 0, '每位角色都会使用挥拳或踢腿');
if (noBasic.length) console.log('    ❌ ' + noBasic.slice(0, 12).map(r => r.name + '(' + r.punch + '/' + r.kick + '/' + r.skill + ')').join(' '));
const avgBasic = (totPunch + totKick) / ALL.length;
console.log('  平均每位角色普攻 ' + avgBasic.toFixed(1) + ' 次 / 15 秒');
ck(avgBasic >= 6, '普攻频率足够高（平均 ≥ 6 次 / 15 秒）');

// 关键：挥拳踢腿必须真的打中（此前动作被移动代码覆盖，判定帧永远不出现）
const landRows = ALL.map(id => simulate(id, 'mozart', 900, { gap: 92 }));
const noLand = landRows.filter(r => r.landedBasic === 0);
const avgLand = landRows.reduce((s, r) => s + r.landedBasic, 0) / landRows.length;
const avgDmg = landRows.reduce((s, r) => s + r.basicDamage, 0) / landRows.length;
console.log('  贴身后普攻命中：平均 ' + avgLand.toFixed(1) + ' 次 / 15 秒，合计造成 ' + Math.round(avgDmg) + ' 点伤害');
console.log('  一次都没打中的角色 = ' + (noLand.length ? noLand.map(r => r.name).join('、') : '无'));
ck(noLand.length === 0, '每位角色的普攻都能真正命中并造成伤害');
// 阈值不能写死：v6.0 把全局 DAMAGE_SCALE 从 0.56 降到 0.51（为了把节奏拉回 v5.1 的水准），
// 同一套普攻的绝对伤害自然跟着降 9%。这里改成按"每次命中的平均伤害"判断——
// 那才是真正要守住的性质（普攻必须是有意义的输出手段），与全局乘区无关。
const dmgPerHit = avgDmg / Math.max(1, avgLand);
console.log('  平均每次普攻命中造成 ' + dmgPerHit.toFixed(1) + ' 点伤害');
ck(dmgPerHit > 6, '普攻每次命中都有可观伤害（平均 > 6 点 / 次，实测 ' + dmgPerHit.toFixed(1) + '）');

console.log('\n== 2. 开局 6 秒内是否会放终极技（v4.2）==');
const OPEN_CD = win.GAME_CONST.ULT_OPENING_CD;
let earlyUlt = [], ultFrames = [];
for (const id of ALL) {
  const r = simulate(id, 'mozart', 900, { gap: 150 });
  if (r.firstUlt >= 0) {
    ultFrames.push(r.firstUlt);
    if (r.firstUlt < OPEN_CD) earlyUlt.push(BY[id].name + '(交战第' + r.firstUlt + '帧)');
  }
}
const minUlt = ultFrames.length ? Math.min(...ultFrames) : -1;
console.log('  首个终极技最早出现在交战第 ' + minUlt + ' 帧（' + (minUlt / 60).toFixed(2) + ' 秒）');
console.log('  开局 ' + (OPEN_CD / 60) + ' 秒内就放终极技的角色 = ' + (earlyUlt.length ? earlyUlt.join('、') : '无'));
ck(earlyUlt.length === 0, '开局 ' + (OPEN_CD / 60) + ' 秒内（' + OPEN_CD + ' 帧）不会释放终极技');
ck(ultFrames.length > 10, '初始冷却结束后仍会正常使用终极技（' + ultFrames.length + '/' + ALL.length + ' 位角色）');
console.log('  首次大招时间：最早 ' + minUlt + ' 帧，最晚 ' + Math.max(...ultFrames) + ' 帧，中位 ' +
  ultFrames.slice().sort((a, b) => a - b)[ultFrames.length >> 1] + ' 帧');

console.log('\n== 3. 终极技的释放时机是否合理 ==');
// 记录“释放瞬间”的距离，才是真正有意义的判定（AI 会主动走近，起点远不代表放的时候远）
const AI = new win.AIController(new GC(canvas));
let waste = [], far = [], totalUlts = 0;
for (const id of ALL) {
  const r = simulate(id, 'mozart', 900, { gap: 460 });
  totalUlts += r.skills[2];
  for (let i = 0; i < r.ultDist.length; i++) {
    const dist = r.ultDist[i];
    const selfOnly = AI.isSelfOnlyUlt(BY[id].skills[2]);
    const cap = selfOnly ? 230 : 340;
    if (dist > cap) waste.push(BY[id].name + '(' + dist + 'px' + (selfOnly ? '/自我强化' : '') + ')');
    else if (dist > cap - 60) far.push(BY[id].name + '(' + dist + 'px)');
  }
}
console.log('  50 位角色共释放终极技 ' + totalUlts + ' 次');
console.log('  在无效距离（自我强化 >230px / 伤害型 >340px）放大的 = ' + (waste.length ? waste.join('、') : '无'));
ck(waste.length === 0, '不会在打不到的距离浪费终极技');
if (far.length) console.log('  （接近上限的：' + far.slice(0, 8).join('、') + '）');

console.log('\n== 4. 主动性与威胁性 ==');
const passive = simulate('beethoven', 'mozart', 900, { playerMoves: false });
const active = simulate('beethoven', 'mozart', 900, { playerMoves: true });
console.log('  木桩对手：普攻 ' + (passive.punch + passive.kick) + ' 次，技能 ' +
  (passive.skills[0] + passive.skills[1] + passive.skills[2]) + ' 次');
console.log('  移动对手：普攻 ' + (active.punch + active.kick) + ' 次，技能 ' +
  (active.skills[0] + active.skills[1] + active.skills[2]) + ' 次');
ck(passive.punch + passive.kick > 0, '面对木桩也会主动出拳');
ck(active.punch + active.kick > 0, '面对移动目标也会主动出拳');

console.log('\n== 5. 和声体系角色专项（此前开局必放大招）==');
const HARMONY = ['beethoven', 'mozart', 'brahms', 'mahler', 'wagner', 'schumann',
  'rachmaninoff', 'shostakovich', 'schoenberg', 'sibelius', 'scriabin', 'liszt'];
let hBad = [];
for (const id of HARMONY) {
  const r = simulate(id, 'mozart', 700, { gap: 150 });
  if (r.skills[2] > 0 && r.firstUlt < OPEN_CD) hBad.push(BY[id].name + '(交战第' + r.firstUlt + '帧)');
}
console.log('  和声角色在开局 6 秒内放大招的 = ' + (hBad.length ? hBad.join('、') : '无'));
ck(hBad.length === 0, '和声体系角色不再开局空放终极技');
const hStats = HARMONY.map(id => simulate(id, 'mozart', 900));
console.log('  和声角色普攻合计 = ' + hStats.reduce((s, r) => s + r.punch + r.kick, 0) +
  ' 次，终极技合计 = ' + hStats.reduce((s, r) => s + r.skills[2], 0) + ' 次');
ck(hStats.every(r => r.punch + r.kick > 0), '所有和声角色都会普攻');

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ AI 行为校验通过'));
process.exitCode = fail ? 1 : 0;

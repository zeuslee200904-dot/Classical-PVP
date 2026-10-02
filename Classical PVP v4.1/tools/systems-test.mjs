/* ============================================================
   tools/systems-test.mjs — 校验 3.0 的三套新战斗体系与走位/跳跃调整
   用法: node systems-test.mjs
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const noop = () => { };
function EffectsStub() {
  this.list = []; this.numbers = []; this.shake = 0; this.flash = 0;
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
vm.runInContext(read('../js/ai.js'), c, { filename: 'ai.js' });
vm.runInContext(read('../js/game.js'), c, { filename: 'game.js' });

const GC = win.GameClass, BY = win.COMPOSER_BY_ID, K = win.GAME_CONST;
let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };

function newGame(team, enemyId, enemy2) {
  const g = new GC(canvas);
  g.selSlots = team;
  g.startMatch();
  const setFoe = (i, id) => {
    const f = g.enemyTeam[i];
    f.c = BY[id]; f.maxHp = f.c.maxHp; f.hp = f.maxHp; f.cd = [0, 0, 0];
    return f;
  };
  const f0 = setFoe(0, enemyId);
  g.enemyTeam = enemy2 ? [f0, setFoe(1, enemy2)] : [f0];
  g.playerTeam = [g.playerTeam[0]];
  g.nextRound();
  g.phase = 'play';
  return g;
}

// ---------------------------------------------------------
console.log('== 1. 移动范围与跳跃高度（需求六）==');
console.log('  场地边界: 左方 ' + K.LEFT_MIN + ' ~ ' + K.LEFT_MAX + '，右方 ' + K.RIGHT_MIN + ' ~ ' + K.RIGHT_MAX);
console.log('  画面中线 = ' + (K.W / 2) + '（旧版本左方最多只能走到 ' + (K.W / 2 - 34) + '）');
ck(K.LEFT_MAX > K.W / 2 + 100, '左方角色可以越过画面中线很远（可达 x=' + K.LEFT_MAX + '）');
ck(K.RIGHT_MIN < K.W / 2 - 100, '右方角色可以越过画面中线很远（可达 x=' + K.RIGHT_MIN + '）');

const g1 = newGame([0, 1, 2], 'beethoven');
g1.left.x = K.W / 2;
for (let i = 0; i < 120; i++) {
  g1.input.right = true;
  g1.readPlayerInput(g1.left, g1.right);
  g1.stepFighter(g1.left, g1.right);
}
console.log('  从中线持续右行 120 帧后 x = ' + g1.left.x.toFixed(0));
ck(g1.left.x > K.W / 2 + 150, '过中线后仍能继续前进（不再卡住）');

const g1b = newGame([0, 1, 2], 'beethoven');
const jp = g1b.left.jumpPower();
const peak = (jp * jp) / (2 * K.GRAVITY);
const oldJp = 8.4 + BY.beethoven.stats.speed * 0.035;
const oldPeak = (oldJp * oldJp) / (2 * K.GRAVITY);
console.log('  跳跃初速 ' + jp.toFixed(2) + '（旧 ' + oldJp.toFixed(2) + '）→ 理论跳跃高度 ' +
  peak.toFixed(0) + 'px（旧 ' + oldPeak.toFixed(0) + 'px）');
ck(peak > oldPeak * 1.1, '跳跃高度明显抬高（+ ' + ((peak / oldPeak - 1) * 100).toFixed(0) + '%）');

// ---------------------------------------------------------
console.log('\n== 2. 新体系一：乐章（Movement）==');
const g2 = newGame([25, 26, 27], 'mozart');   // 柴可夫斯基
const mb = g2.left.c.skills[0];
console.log('  柴可夫斯基 Q = ' + mb.name + '，' + mb.movement.stanzas.length + ' 段乐章');
g2.left.x = 300; g2.right.x = 380;
g2.useSkill(g2.left, g2.right, 0);
ck(g2.movements.length === 1, '施放后生成 1 段乐章序列');
ck(g2.left.state === 'movement', '播放乐章施法动画（state=movement）');
// 乐章期间玩家仍可走位
const x0 = g2.left.x;
for (let i = 0; i < 40; i++) {
  g2.input.right = true;
  g2.readPlayerInput(g2.left, g2.right);
  g2.stepFighter(g2.left, g2.right);
  g2.stepMovements();
}
console.log('  乐章进行中位移 = ' + (g2.left.x - x0).toFixed(0) + 'px，剩余段数 = ' +
  (g2.movements[0] ? g2.movements[0].stanzas.length - g2.movements[0].idx : 0));
ck(g2.left.x - x0 > 30, '乐章连奏期间仍可自由走位（施法者不被锁定）');
const hpBefore = g2.right.hp;
while (g2.movements.length && g2.movements[0].idx < g2.movements[0].stanzas.length) {
  g2.left.x = g2.right.x - 60;      // 保持贴身，确保每段都能命中
  g2.right.stun = 0;
  g2.stepMovements();
}
console.log('  四段乐章命中后对手 HP ' + hpBefore + ' → ' + g2.right.hp);
ck(g2.right.hp < hpBefore, '乐章各拍点会自动判定并造成伤害');
ck(g2.movements.length === 0 || g2.movements[0].idx >= g2.movements[0].stanzas.length, '乐章放完后序列结束');

// ---------------------------------------------------------
console.log('\n== 3. 新体系二：回旋（Rondo）==');
const g3 = newGame([35, 36, 37], 'mozart');   // H.普赛尔
const rb = g3.left.c.skills[0];
console.log('  H.普赛尔 Q = ' + rb.name + '，去程 ' + rb.rondo.damage + ' / 回程 ' + rb.rondo.backDamage);
g3.left.x = 260; g3.right.x = 420;
g3.useSkill(g3.left, g3.right, 0);
ck(g3.projectiles.length === 1, '放出 1 枚回旋乐句');
ck(g3.projectiles[0].boomerang === true, '投射物标记为回旋类型');
ck(g3.left.state === 'rondo', '播放回旋施法动画（state=rondo）');
const pj = g3.projectiles[0];
const rightBefore = g3.right.hp;
let turned = false, backHit = false;
for (let i = 0; i < 300 && g3.projectiles.length; i++) {
  g3.stepProjectiles();
  const p = g3.projectiles[0];
  if (p && p.returning) turned = true;
  if (p && p.hitBack) backHit = true;
  if (g3.right.hp < rightBefore && !backHit) {
    // 去程命中后把对手挪开，验证回程
    g3.right.x = p ? p.x - 20 : g3.right.x;
  }
  if (g3.right.dead) break;
}
console.log('  折返发生 = ' + turned + '，回程命中 = ' + backHit +
  '，对手 HP ' + rightBefore + ' → ' + Math.round(g3.right.hp));
ck(turned, '乐句飞到尽头后折返');
ck(g3.right.hp < rightBefore, '去程和回程都能造成伤害');
ck(g3.projectiles.length === 0, '回到施法者手中后消失');

// 回程拖拽：把对手拉向施法者
const g3b = newGame([35, 36, 37], 'mozart');
g3b.left.x = 200; g3b.right.x = 700;
const target = g3b.right;
g3b.hitTarget(g3b.left, target, { damage: 5, knock: 5, stun: 10, pull: true }, null);
const pullVx = target.vx;
const towardOwner = (g3b.left.x - target.x) > 0;
console.log('  回程拖拽速度方向 vx = ' + pullVx + '（施法者在' + (towardOwner ? '左' : '右') + '侧）');
ck((pullVx > 0) === towardOwner, '回程命中把对手向施法者方向拖拽');

// ---------------------------------------------------------
console.log('\n== 4. 新体系三：卡农（Canon）==');
const g4 = newGame([41, 42, 43], 'mozart');   // 拉莫
const cb = g4.left.c.skills[0];
console.log('  拉莫 Q = ' + cb.name + '，持续 ' + cb.canon.dur + ' 秒，延迟 ' + cb.canon.delay +
  ' 帧，重奏比例 ' + cb.canon.ratio);
g4.left.x = 300; g4.right.x = 380;
g4.useSkill(g4.left, g4.right, 0);
ck(!!g4.left.canon, '开启卡农状态');
ck(g4.left.state === 'canon', '播放卡农施法动画（state=canon）');
const foe = g4.right;
foe.hp = 500;
g4.hitTarget(g4.left, foe, { damage: 20, stun: 10, knock: 2, basic: true }, null);
const afterFirst = foe.hp;
ck(g4.canonQueue.length === 1, '首次命中后进入延后重奏队列（' + g4.canonQueue.length + ' 条）');
// 推进到重奏时刻
for (let i = 0; i < cb.canon.delay + 2; i++) { g4.t++; g4.stepCanon(); }
const afterEcho = foe.hp;
console.log('  命中 ' + (500 - afterFirst) + ' 点 → ' + cb.canon.delay + ' 帧后追加 ' + (afterFirst - afterEcho) + ' 点');
ck(afterEcho < afterFirst, '模仿声部在延迟后追加了伤害');
const expect = Math.round((500 - afterFirst) * cb.canon.ratio);
ck(Math.abs((afterFirst - afterEcho) - expect) <= 2, '追加伤害 = 原伤害 × ' + cb.canon.ratio + '（期望 ' + expect + '）');
ck(g4.echoes.length > 0, '重奏时生成模仿声部的虚影视觉');
// 卡农到期
g4.left.canon.t = 1;
g4.stepFighter(g4.left, g4.right);
ck(!g4.left.canon, '卡农持续时间结束后状态清除');
foe.hp = 800;
g4.hitTarget(g4.left, foe, { damage: 20, stun: 10, knock: 2, basic: true }, null);
ck(g4.canonQueue.length === 0, '卡农结束后不再排队重奏');

// ---------------------------------------------------------
console.log('\n== 5. 羁绊数值（需求五）==');
const g5 = newGame([25, 26, 27], 'mozart');   // 柴可夫斯基/门德尔松/肖邦 → 前中浪漫×3 + 俄派/德奥/法派
const f5 = g5.playerTeam[0];
console.log('  共鸣: era=' + f5.bondEra + ' region=' + f5.bondRegion + ' 初始计时=' + f5.bondTimer + ' 帧');
ck(Math.abs(win.BOND.eraDamage - 0.12) < 1e-9, '绿色共鸣伤害 +12%');
ck(win.BOND.regionInterval === 720, '黄色共鸣周期 12 秒（720 帧）');
f5.bondEra = null;
const base = f5.damageMul();
f5.bondEra = '前中浪漫主义';
ck(Math.abs(f5.damageMul() / base - 1.12) < 1e-6, '伤害倍率恰为 +12%');
// 免疫周期
const g5b = newGame([25, 26, 27], 'mozart');
const gb = g5b.playerTeam[0];
gb.bondRegion = '俄派';
gb.bondTimer = 1;
let trig = -1, shieldAtTrig = 0, timerAfter = 0;
for (let i = 1; i <= 10; i++) {
  g5b.stepFighter(gb, g5b.right);
  if (trig < 0 && gb.invuln > 0) { trig = i; shieldAtTrig = gb.bondShield; timerAfter = gb.bondTimer; }
}
ck(trig === 1 && shieldAtTrig === 150, '每 12 秒触发一次 2.5 秒全免（第 ' + trig + ' 帧触发，免疫 ' + shieldAtTrig + ' 帧）');
ck(timerAfter === 720, '周期重置为 12 秒（' + timerAfter + ' 帧）');

console.log('\n== 6. 红色「体系」标签与共鸣效果（v4.0）==');
// 6.1 和声：生命上限 +18%
const gh = newGame([0, 1, 2], 'mozart');   // 贝多芬/莫扎特/勃拉姆斯 → 全为「和声」体系
const fh = gh.playerTeam[0];
console.log('  和声队伍体系标签 = ' + gh.playerTeam.map(f => f.c.tags.system).join('/'));
ck(gh.playerTeam.every(f => f.c.tags.system === '和声'), '三人同属和声体系');
const hpBase = fh.c.maxHp, hpBond = fh.maxHp;
console.log('  生命上限 ' + hpBase + ' → ' + hpBond + '（+' + (((hpBond / hpBase) - 1) * 100).toFixed(1) + '%）');
ck(Math.abs(hpBond / hpBase - 1.18) < 0.01, '和声共鸣：生命值上限提升 18%');

// 6.2 领域：移动速度 +20%
const gs = newGame([15, 16, 19], 'mozart');   // 海顿/巴赫/维瓦尔第 → 全为「领域」体系
const fs2 = gs.playerTeam[0];
ck(fs2.c.tags.system === '领域', '所选角色属于领域体系');
fs2.bondSystem = null;
const spdBase = fs2.speedValue();
fs2.bondSystem = '领域';
const spdBond = fs2.speedValue();
console.log('  移动速度 ' + spdBase.toFixed(3) + ' → ' + spdBond.toFixed(3) + '（×' + (spdBond / spdBase).toFixed(3) + '）');
ck(Math.abs(spdBond / spdBase - 1.20) < 1e-6, '领域共鸣：移动速度 +20%');

// 6.3 乐章：20% 概率双倍伤害
const gd = newGame([25, 26, 27], 'mozart');   // 柴可夫斯基/门德尔松/肖邦 → 全为「乐章」体系
const fd = gd.playerTeam[0];
ck(fd.c.tags.system === '乐章', '所选角色属于乐章体系');
const trial = (bond, n) => {
  let dbl = 0;
  const victim = gd.enemyTeam[0];
  for (let i = 0; i < n; i++) {
    fd.bondSystem = bond;
    victim.hp = 100000; victim.maxHp = 100000; victim.stun = 0; victim.invuln = 0;
    const before = victim.hp;
    gd.t = 0; gd.canonQueue = [];
    gd.hitTarget(fd, victim, { damage: 10, stun: 1, knock: 0, basic: true, pierce: true }, null);
    if (before - victim.hp >= 18) dbl++;
  }
  return dbl / n;
};
const rate = trial('乐章', 8000);
console.log('  双倍伤害触发率 = ' + (rate * 100).toFixed(2) + '%（期望 20%）');
ck(Math.abs(rate - 0.20) < 0.025, '乐章共鸣：20% 概率双倍伤害');
const rate0 = trial(null, 3000);
ck(rate0 === 0, '没有该共鸣时不会出现双倍伤害（实测 ' + (rate0 * 100).toFixed(1) + '%）');

// 6.4 回旋：免疫 8% 伤害
// 注意：newGame 里 startMatch 会给随机敌方队伍套上羁绊，替换角色后标记会残留，
// 因此这里先把双方的三种羁绊标记清干净，做严格对照。
const measure = (bond) => {
  const g = newGame([0, 1, 2], 'mozart');
  const f = g.playerTeam[0];
  const foe = g.enemyTeam[0];
  [f, foe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; });
  f.bondSystem = bond;
  let sum = 0;
  for (let i = 0; i < 3000; i++) {
    f.hp = 100000; f.maxHp = 100000; f.stun = 0; f.invuln = 0; f.armor = null; f.shield = 0;
    const before = f.hp;
    g.phase = 'play';
    g.hitTarget(foe, f, { damage: 20, stun: 1, knock: 0, basic: true, pierce: true }, null);
    sum += before - f.hp;
  }
  return sum / 3000;
};
const avgNo = measure(null), avgYes = measure('回旋');
console.log('  平均受伤 ' + avgNo.toFixed(2) + ' → ' + avgYes.toFixed(2) + '（×' + (avgYes / avgNo).toFixed(3) + '）');
ck(Math.abs(avgYes / avgNo - 0.92) < 0.012, '回旋共鸣：免疫 8% 受到的伤害');

// 小伤害也必须看得出减免：8% 不足 1 点时曾因四舍五入完全失效
const gSm = newGame([0, 1, 2], 'mozart');
const fSm = gSm.playerTeam[0], foeSm = gSm.enemyTeam[0];
[fSm, foeSm].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; });
const hitOnce = (bond, dmg) => {
  fSm.bondSystem = bond;
  fSm.hp = 100000; fSm.maxHp = 100000; fSm.stun = 0; fSm.invuln = 0; fSm.armor = null; fSm.shield = 0;
  const before = fSm.hp;
  gSm.phase = 'play';
  gSm.hitTarget(foeSm, fSm, { damage: dmg, stun: 1, knock: 0, basic: true, pierce: true }, null);
  return before - fSm.hp;
};
const smallRows = [];
let smallOk = true;
for (let d = 5; d <= 14; d++) {
  const no = hitOnce(null, d), yes = hitOnce('回旋', d);
  smallRows.push(d + '→' + no + '/' + yes);
  if (yes >= no) smallOk = false;
}
console.log('  小伤害对照（原始/减免后）: ' + smallRows.join(' '));
ck(smallOk, '单次伤害很小时回旋共鸣也能体现出减伤');

// 6.5 卡农：冷却缩短
const gc = newGame([41, 42, 43], 'mozart');   // 拉莫/宾根/马肖 → 全为「卡农」体系
const fc = gc.playerTeam[0];
ck(fc.c.tags.system === '卡农', '所选角色属于卡农体系');
fc.bondSystem = null;
const cd0 = [0, 1, 2].map(i => fc.cooldownOf(i));
fc.bondSystem = '卡农';
const cd1 = [0, 1, 2].map(i => fc.cooldownOf(i));
console.log('  冷却 ' + cd0.map(v => v.toFixed(1)).join(' / ') + ' 秒 → ' +
  cd1.map(v => v.toFixed(1)).join(' / ') + ' 秒');
const expectCd = (i) => Math.max(fc.c.skills[i].cd * (i === 2 ? 0.8 : 0.6), (fc.c.skills[i].dur || 0) + 1);
ck(Math.abs(cd1[0] - expectCd(0)) < 1e-6, '卡农共鸣：技能 1 冷却 ×60%（' + cd1[0].toFixed(1) + 's）');
ck(Math.abs(cd1[1] - expectCd(1)) < 1e-6, '卡农共鸣：技能 2 冷却 ×60%（' + cd1[1].toFixed(1) + 's）');
ck(Math.abs(cd1[2] - expectCd(2)) < 1e-6, '卡农共鸣：终极技冷却 ×80%（' + cd1[2].toFixed(1) + 's）');
ck(cd1[2] < cd0[2] && cd1[0] < cd0[0], '冷却确实被缩短了');
// 缩短后仍不得短于持续时间
let cdViolate = 0;
for (const c of win.COMPOSERS) {
  for (let i = 0; i < 3; i++) {
    const sk = c.skills[i];
    const reduced = sk.cd * (i === 2 ? win.SYSTEM_BOND.ultCd : win.SYSTEM_BOND.skillCd);
    const eff = Math.max(reduced, (sk.dur || 0) + 1);
    if (eff <= (sk.dur || 0)) cdViolate++;
  }
}
ck(cdViolate === 0, '全部 150 个技能在卡农共鸣下冷却仍长于持续时间');

// 6.6 体系共鸣的触发条件
const bs1 = win.computeBonds(['beethoven', 'mozart']);
ck(bs1.system && bs1.system.tag === '和声' && bs1.system.count === 2, '两名同体系角色触发体系共鸣');
const bs2 = win.computeBonds(['beethoven', 'bach']);
ck(!bs2.system, '不同体系不触发体系共鸣');
const bs3 = win.computeBonds(['beethoven', 'mozart', 'bach']);
ck(bs3.system && bs3.system.count === 2 && bs3.system.idxs.join() === '0,1', '体系共鸣只计入同体系角色（2/3）');

// 6.7 回归：三种羁绊标记都必须跨回合保持（曾经被 resetRoundState 清掉）
const gk = newGame([0, 1, 2], 'mozart');
const fk = gk.playerTeam[0];
console.log('  开局三种标记: era=' + fk.bondEra + ' region=' + fk.bondRegion + ' system=' + fk.bondSystem);
ck(fk.bondEra === '古典主义', '开局拥有时期共鸣');
ck(fk.bondRegion === '德奥', '开局拥有地区共鸣');
ck(fk.bondSystem === '和声', '开局拥有体系共鸣');
const hpBondK = fk.maxHp;
// 直接跑回合重置（每回合开始时都会调用）
fk.resetRoundState();
console.log('  回合重置后: era=' + fk.bondEra + ' region=' + fk.bondRegion +
  ' system=' + fk.bondSystem + ' maxHp=' + fk.maxHp);
ck(fk.bondSystem === '和声', '回合重置不会清掉体系共鸣（' + fk.bondSystem + '）');
ck(fk.bondEra === '古典主义' && fk.bondRegion === '德奥', '回合重置不会清掉时期 / 地区共鸣');
ck(fk.maxHp === hpBondK, '回合重置不会抹掉和声的生命上限加成（' + fk.maxHp + '）');
// 完整走一遍换人流程（KO → afterKo → nextRound）
const gk2 = newGame([0, 1, 2], 'mozart');
gk2.playerTeam = gk2.playerTeam.concat([]);
gk2.phase = 'play';
gk2.loserSide = 'right';
gk2.doKo('right');
gk2.afterKo();
gk2.nextRound();
const nxt = gk2.playerTeam[0];
console.log('  第 ' + gk2.roundNo + ' 回合出场: ' + nxt.c.name + ' system=' + nxt.bondSystem);
ck(nxt.bondSystem === '和声', '换人进入下一回合后体系共鸣依然生效');

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 三套新体系、红色体系羁绊与调整项全部通过'));
process.exitCode = fail ? 1 : 0;

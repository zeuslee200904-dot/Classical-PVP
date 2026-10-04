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
// 用真实物理推进一次完整起跳，量出离散积分的真实最高点
function apexRise(f, vy0) {
  let y = K.GROUND, vy = -vy0, top = y, air = 0;
  for (let i = 0; i < 120; i++) {
    vy += K.GRAVITY; y += vy; air++;
    if (y < top) top = y;
    if (y >= K.GROUND) break;
  }
  return { rise: K.GROUND - top, air };
}
const jp = g1b.left.jumpPower();
const now1 = apexRise(g1b.left, jp);
const old1 = apexRise(g1b.left, 9.4 + BY.beethoven.stats.speed * 0.038);   // v4.1 的公式
console.log('  跳跃初速 ' + jp.toFixed(2) + ' → 实测最高点 ' + now1.rise.toFixed(1) +
  'px（v4.1 为 ' + old1.rise.toFixed(1) + 'px，滞空 ' + old1.air + '→' + now1.air + ' 帧）');
ck(now1.rise > old1.rise * 1.5, '跳跃高度大幅抬高（+ ' + ((now1.rise / old1.rise - 1) * 100).toFixed(0) + '%）');
// 与投掷物判定盒比较：最高点必须越过标准的胸前高度投掷物（yOff -78 / 高 20）
const projBox = { w: 20, h: 20, cx: 500, cy: K.GROUND - 78 };
const fhBox = 106 * (g1b.left.c.sprite.height || 1);
const apexCy = (K.GROUND - now1.rise) - fhBox * 0.52;
const oldCy = (K.GROUND - old1.rise) - fhBox * 0.52;
const clears = (cy) => Math.abs(cy - projBox.cy) * 2 >= (fhBox + projBox.h);
console.log('  对贝多芬 Q（y=' + projBox.cy + '）：最高点判定盒中心 ' + apexCy.toFixed(1) +
  '，垂直间距×2 = ' + (Math.abs(apexCy - projBox.cy) * 2).toFixed(1) + '，需要 ≥ ' + (fhBox + projBox.h));
ck(clears(apexCy), '新跳跃最高点可以完全避开投掷物判定盒');
ck(!clears(oldCy), 'v4.1 的跳跃高度避不开（间距×2 = ' + (Math.abs(oldCy - projBox.cy) * 2).toFixed(1) + '）');

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
// 清掉随机敌方阵容可能残留的羁绊标记（回旋的 8% 减伤会干扰重奏伤害的对照）
[foe, g4.left].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.rondoShield = 0; x.rondoTimer = 1e9; });
foe.hp = 500;
g4.hitTarget(g4.left, foe, { damage: 20, stun: 10, knock: 2, basic: true }, null);
const afterFirst = foe.hp;
ck(g4.canonQueue.length === 1, '首次命中后进入延后重奏队列（' + g4.canonQueue.length + ' 条）');
// 推进到重奏时刻
for (let i = 0; i < cb.canon.delay + 2; i++) { g4.t++; g4.stepCanon(); }
const afterEcho = foe.hp;
console.log('  命中 ' + (500 - afterFirst) + ' 点 → ' + cb.canon.delay + ' 帧后追加 ' + (afterFirst - afterEcho) + ' 点');
ck(afterEcho < afterFirst, '模仿声部在延迟后追加了伤害');
// v4.2：重奏伤害派生自已结算的命中，不应再被全局伤害下调削减一次
const expect = Math.round((500 - afterFirst) * cb.canon.ratio);
ck((afterFirst - afterEcho) === expect, '追加伤害恰为原伤害 × ' + cb.canon.ratio + '（期望 ' + expect + '，实测 ' + (afterFirst - afterEcho) + '）');
ck(g4.echoes.length > 0, '重奏时生成模仿声部的虚影视觉');
// 卡农到期
g4.left.canon.t = 1;
g4.stepFighter(g4.left, g4.right);
ck(!g4.left.canon, '卡农持续时间结束后状态清除');
foe.hp = 800;
g4.hitTarget(g4.left, foe, { damage: 20, stun: 10, knock: 2, basic: true }, null);
ck(g4.canonQueue.length === 0, '卡农结束后不再排队重奏');

// ---------------------------------------------------------
console.log('\n== 5. 羁绊数值（v4.2）==');
const g5 = newGame([25, 26, 27], 'mozart');   // 柴可夫斯基/门德尔松/肖邦 → 前中浪漫×3 + 俄派/德奥/法派
const f5 = g5.playerTeam[0];
console.log('  共鸣: era=' + f5.bondEra + ' region=' + f5.bondRegion + ' 初始计时=' + f5.bondTimer + ' 帧');
ck(Math.abs(win.BOND.eraDamage - 0.12) < 1e-9, '绿色共鸣伤害 +12%');
// v4.2：黄色共鸣间隔由固定 12 秒改为 6~15 秒随机
ck(win.BOND.regionMin === 360 && win.BOND.regionMax === 900, '黄色共鸣随机区间为 6~15 秒（360~900 帧）');
let rLo = 1e9, rHi = -1e9;
for (let i = 0; i < 20000; i++) {
  const r = win.rollRegionInterval();
  rLo = Math.min(rLo, r); rHi = Math.max(rHi, r);
}
console.log('  20000 次掷点：最短 ' + (rLo / 60).toFixed(2) + ' 秒，最长 ' + (rHi / 60).toFixed(2) + ' 秒');
ck(rLo >= 360 && rHi <= 900, '随机间隔始终落在 6~15 秒之内');
ck(rHi - rLo > 500, '间隔确实在 6~15 秒之间浮动（跨度 ' + ((rHi - rLo) / 60).toFixed(1) + ' 秒）');
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
ck(trig === 1 && shieldAtTrig === 150, '计时归零即触发 2.5 秒全免（第 ' + trig + ' 帧触发，免疫 ' + shieldAtTrig + ' 帧）');
ck(timerAfter >= 360 && timerAfter <= 900, '下次间隔重新在 6~15 秒内随机（' + (timerAfter / 60).toFixed(2) + ' 秒）');

console.log('\n== 6. 红色「体系」标签与共鸣效果（v4.2）==');
// 6.1 和声：生命上限 +18% 且获得 7% 吸血
const gh = newGame([0, 1, 2], 'mozart');   // 贝多芬/莫扎特/勃拉姆斯 → 全为「和声」体系
const fh = gh.playerTeam[0];
console.log('  和声队伍体系标签 = ' + gh.playerTeam.map(f => f.c.tags.system).join('/'));
ck(gh.playerTeam.every(f => f.c.tags.system === '和声'), '三人同属和声体系');
const hpBase = fh.c.maxHp, hpBond = fh.maxHp;
console.log('  生命上限 ' + hpBase + ' → ' + hpBond + '（+' + (((hpBond / hpBase) - 1) * 100).toFixed(1) + '%）');
ck(Math.abs(hpBond / hpBase - 1.18) < 0.01, '和声共鸣：生命值上限提升 18%');
// 7% 吸血：用固定面板伤害测量回血量
const ghL = newGame([0, 1, 2], 'mozart');
const ah = ghL.playerTeam[0], vh = ghL.enemyTeam[0];
[vh].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.rondoShield = 0; x.rondoTimer = 1e9; });
ck(ah.bondSystem === '和声', '吸血测试的攻击方拥有和声共鸣');
const steal = (bond, panel) => {
  ah.bondSystem = bond;
  ah.hp = 500; ah.maxHp = 100000; ah.lifesteal = 0;
  vh.hp = 100000; vh.maxHp = 100000; vh.stun = 0; vh.invuln = 0; vh.armor = null; vh.shield = 0;
  ghL.phase = 'play';
  const d0 = vh.hp;
  ghL.hitTarget(ah, vh, { damage: panel, stun: 1, knock: 0, basic: true, pierce: true }, null);
  return { dealt: d0 - vh.hp, heal: ah.hp - 500 };
};
const s20 = steal('和声', 20), s0 = steal(null, 20);
const expectHeal = Math.max(1, Math.round(Math.round(20 * ah.damageMul() * K.DAMAGE_SCALE) * 0.07));
console.log('  面板 20：无共鸣回血 ' + s0.heal + '，和声共鸣造成 ' + s20.dealt + ' 伤害并回血 ' + s20.heal +
  '（期望 ' + expectHeal + '）');
ck(s0.heal === 0, '没有和声共鸣时不会吸血');
ck(s20.heal === expectHeal, '和声共鸣：按造成伤害的 7% 吸血');
const s2 = steal('和声', 3);
ck(s2.heal === 0, '过轻的命中（<5 点）不触发吸血，避免 1 点伤害回 1 点血（实测 ' + s2.heal + '）');

// 6.2 领域：移动速度 +30%
const gs = newGame([15, 16, 19], 'mozart');   // 海顿/巴赫/维瓦尔第 → 全为「领域」体系
const fs2 = gs.playerTeam[0];
ck(fs2.c.tags.system === '领域', '所选角色属于领域体系');
fs2.bondSystem = null;
const spdBase = fs2.speedValue();
fs2.bondSystem = '领域';
const spdBond = fs2.speedValue();
console.log('  移动速度 ' + spdBase.toFixed(3) + ' → ' + spdBond.toFixed(3) + '（×' + (spdBond / spdBase).toFixed(3) + '）');
ck(Math.abs(spdBond / spdBase - 1.30) < 1e-6, '领域共鸣：移动速度 +30%');

// 6.3 乐章：14% ×2 / 8% ×3 / 3% ×4（互斥）
const gd = newGame([25, 26, 27], 'mozart');   // 柴可夫斯基/门德尔松/肖邦 → 全为「乐章」体系
const fd = gd.playerTeam[0];
ck(fd.c.tags.system === '乐章', '所选角色属于乐章体系');
const PANEL = 100;
const baseD = Math.round(PANEL * fd.damageMul() * K.DAMAGE_SCALE);
const dist = { 1: 0, 2: 0, 3: 0, 4: 0, other: 0 };
const N = 60000;
const victim = gd.enemyTeam[0];
[victim].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.rondoShield = 0; x.rondoTimer = 1e9; });
for (let i = 0; i < N; i++) {
  fd.bondSystem = '乐章';
  victim.hp = 1000000; victim.maxHp = 1000000; victim.stun = 0; victim.invuln = 0;
  victim.armor = null; victim.shield = 0;
  gd.t = 0; gd.canonQueue = [];
  const before = victim.hp;
  gd.hitTarget(fd, victim, { damage: PANEL, stun: 1, knock: 0, basic: true, pierce: true }, null);
  const mul = (before - victim.hp) / baseD;
  const k = Math.round(mul);
  if (dist[k] === undefined) dist.other++; else if (Math.abs(mul - k) < 0.02) dist[k]++; else dist.other++;
}
const rate = (k) => dist[k] / N;
console.log('  基准伤害 ' + baseD + '；倍率分布：×1 ' + (rate(1) * 100).toFixed(2) + '%，×2 ' +
  (rate(2) * 100).toFixed(2) + '%，×3 ' + (rate(3) * 100).toFixed(2) + '%，×4 ' +
  (rate(4) * 100).toFixed(2) + '%' + (dist.other ? '，异常 ' + dist.other : ''));
ck(Math.abs(rate(2) - 0.14) < 0.012, '乐章共鸣：14% 概率 ×2 伤害');
ck(Math.abs(rate(3) - 0.08) < 0.010, '乐章共鸣：8% 概率 ×3 伤害');
ck(Math.abs(rate(4) - 0.03) < 0.006, '乐章共鸣：3% 概率 ×4 伤害');
ck(dist.other === 0, '三档互斥，不会出现非整数倍率');
ck(Math.abs(rate(1) - 0.75) < 0.012, '剩余 75% 为普通伤害');
// 无共鸣时绝不翻倍
let noBondMul = 0;
for (let i = 0; i < 8000; i++) {
  fd.bondSystem = null;
  victim.hp = 1000000; victim.maxHp = 1000000; victim.stun = 0; victim.invuln = 0;
  victim.armor = null; victim.shield = 0;
  const before = victim.hp;
  gd.hitTarget(fd, victim, { damage: PANEL, stun: 1, knock: 0, basic: true, pierce: true }, null);
  if (before - victim.hp !== baseD) noBondMul++;
}
ck(noBondMul === 0, '没有该共鸣时伤害恒为基准值（异常 ' + noBondMul + ' 次）');
// 领域型直接伤害（fieldDamage）也吃乐章倍率
const fdHit = () => {
  victim.hp = 1000000; victim.maxHp = 1000000; victim.invuln = 0; victim.armor = null; victim.shield = 0;
  const before = victim.hp;
  gd.fieldDamage(fd, victim, PANEL, { kindColor: '#fff' });
  return before - victim.hp;
};
let fdHigh = 0;
for (let i = 0; i < 20000; i++) { fd.bondSystem = '乐章'; if (fdHit() > baseD) fdHigh++; }
console.log('  领域类伤害触发倍率的比例 = ' + (fdHigh / 20000 * 100).toFixed(2) + '%（期望 25%）');
ck(Math.abs(fdHigh / 20000 - 0.25) < 0.02, '领域 / 卡农等直接伤害同样享受乐章倍率');

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
    // 用大面板伤害测量，避免 8% 被取整误差放大（小伤害的减免另有专门用例）
    g.hitTarget(foe, f, { damage: 1000, stun: 1, knock: 0, basic: true, pierce: true }, null);
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

// 6.4b v4.2：回旋反弹护盾 —— 每 7 秒 33% 概率展开 0.8 秒，反弹一次攻击的 50%
const gRo = newGame([0, 1, 2], 'mozart');
const rF = gRo.playerTeam[0], rFoe = gRo.enemyTeam[0];
[rF, rFoe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.rondoShield = 0; x.bondTimer = 1e9; });
ck(win.SYSTEM_BOND.rondoInterval === 420 && win.SYSTEM_BOND.rondoShield === 48 &&
  Math.abs(win.SYSTEM_BOND.rondoChance - 0.33) < 1e-9 && Math.abs(win.SYSTEM_BOND.rondoReflect - 0.5) < 1e-9,
  '反弹护盾参数：每 420 帧（7 秒）掷点、33% 概率、持续 48 帧（0.8 秒）、反弹 50%');
rF.bondSystem = '回旋';
const realRandom = Math.random;
// 保底：把随机数固定成“必定触发”
Math.random = () => 0.2;
rF.rondoTimer = 1;
gRo.stepFighter(rF, rFoe);
Math.random = realRandom;
console.log('  掷点成功 → rondoShield = ' + rF.rondoShield + ' 帧，下次计时 = ' + rF.rondoTimer + ' 帧');
ck(rF.rondoShield === 48, '触发后护盾持续 0.8 秒（48 帧）');
ck(rF.rondoTimer === 420, '触发后计时重置为 7 秒（420 帧）');
// 掷点失败
rF.rondoShield = 0; rF.rondoTimer = 1;
Math.random = () => 0.9;                       // 0.9 > 0.33 → 不触发
gRo.stepFighter(rF, rFoe);
Math.random = realRandom;
ck(rF.rondoShield === 0 && rF.rondoTimer === 420, '掷点失败则不展开护盾，但计时同样重置为 7 秒');
// 统计触发率
let okTrig = 0;
const TRIALS = 20000;
for (let i = 0; i < TRIALS; i++) {
  rF.rondoShield = 0; rF.rondoTimer = 1;
  gRo.stepFighter(rF, rFoe);
  if (rF.rondoShield > 0) okTrig++;
}
console.log('  触发率 = ' + (okTrig / TRIALS * 100).toFixed(2) + '%（期望 33%）');
ck(Math.abs(okTrig / TRIALS - 0.33) < 0.02, '护盾触发率接近 33%');

// 反弹结算：护盾期间挨打 → 自己不掉血，攻击者吃 50% 伤害
const gRb = newGame([0, 1, 2], 'mozart');
const bF = gRb.playerTeam[0], bFoe = gRb.enemyTeam[0];
[bF, bFoe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.invuln = 0; });
bF.bondSystem = '回旋';
bF.hp = 100000; bF.maxHp = 100000;
bFoe.hp = 100000; bFoe.maxHp = 100000;
bF.rondoShield = 48;
gRb.phase = 'play';
const rawBack = Math.round(Math.round(200 * bFoe.damageMul() * K.DAMAGE_SCALE) * 0.5);
const beforeV = bF.hp, beforeA = bFoe.hp;
gRb.hitTarget(bFoe, bF, { damage: 200, stun: 10, knock: 2, pierce: true }, null);
console.log('  护盾期间被打：自己 ' + (beforeV - bF.hp) + ' 伤害（应为 0），攻击者受到 ' +
  (beforeA - bFoe.hp) + ' 伤害（期望 ' + rawBack + '）');
ck(bF.hp === beforeV, '护盾完全抵消这次攻击');
ck(beforeA - bFoe.hp === rawBack, '攻击者受到原本伤害 50% 的反伤');
ck(bF.rondoShield === 0, '护盾被消耗（只反弹一次）');
// 第二次攻击正常生效
const hpAfterReflect = bF.hp;
gRb.hitTarget(bFoe, bF, { damage: 200, stun: 10, knock: 2, pierce: true }, null);
ck(bF.hp < hpAfterReflect, '护盾消耗后，后续攻击正常造成伤害（' + (hpAfterReflect - bF.hp) + ' 点）');
// 护盾到期
const gRx = newGame([0, 1, 2], 'mozart');
const xF = gRx.playerTeam[0], xFoe = gRx.enemyTeam[0];
[xF, xFoe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondTimer = 1e9; });
xF.bondSystem = '回旋';
xF.rondoShield = 3;
for (let i = 0; i < 3; i++) gRx.stepFighter(xF, xFoe);
ck(xF.rondoShield === 0, '护盾超过 0.8 秒后自动消失');
// 反伤可以 KO 攻击者
const gRk = newGame([0, 1, 2], 'mozart');
const kF = gRk.playerTeam[0], kFoe = gRk.enemyTeam[0];
[kF, kFoe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.invuln = 0; });
kF.bondSystem = '回旋'; kF.hp = 100000; kF.maxHp = 100000;
kF.rondoShield = 48;
kFoe.hp = 1;
gRk.phase = 'play';
gRk.hitTarget(kFoe, kF, { damage: 200, stun: 10, knock: 2, pierce: true }, null);
ck(kFoe.dead, '反弹伤害可以把攻击者直接打倒（KO 判定生效）');
// 攻击者处于无敌帧时，反伤被免疫
const gRi = newGame([0, 1, 2], 'mozart');
const iF = gRi.playerTeam[0], iFoe = gRi.enemyTeam[0];
[iF, iFoe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; });
iF.bondSystem = '回旋'; iF.hp = 100000; iF.maxHp = 100000; iF.rondoShield = 48;
iFoe.hp = 100000; iFoe.maxHp = 100000; iFoe.invuln = 60;
gRi.phase = 'play';
const iBefore = iFoe.hp;
gRi.hitTarget(iFoe, iF, { damage: 200, stun: 10, knock: 2, pierce: true }, null);
ck(iFoe.hp === iBefore, '攻击者处于无敌帧时不会吃到反伤（无敌优先）');

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

// ---------------------------------------------------------
// 6.8 v5.0 新增体系「循环」：每 7 秒回复 18% 已损失生命
// ---------------------------------------------------------
console.log('\n== 6.8 v5.0「循环」体系共鸣 ==');
{
  const gL = newGame([50, 51, 52], 'mozart');   // 韦伯恩 / 欣德米特 / 莫谢莱斯 → 全为「循环」
  const fL = gL.playerTeam[0];
  ck(fL.c.tags.system === '循环', fL.c.name + ' 属于循环体系');
  ck(fL.bondSystem === '循环', '三人同体系触发循环共鸣');
  ck(Math.abs(fL.loopTimer - win.SYSTEM_BOND.loopInterval) < 1e-9,
    '开局循环计时器 = ' + (fL.loopTimer / 60).toFixed(0) + ' 秒');

  // 掉血后测量「第一次回血」发生的帧数（每帧先递减再判定，所以是 420 帧一次）
  const foeL = gL.right;
  gL.phase = 'play';
  fL.hp = Math.round(fL.maxHp * 0.5);
  const lost = fL.maxHp - fL.hp;
  const hp0 = fL.hp;
  let ticks = 0;
  while (fL.hp === hp0 && ticks < 1200) { gL.stepFighter(fL, foeL); ticks++; }
  const gain = fL.hp - hp0;
  const expectGain = Math.max(1, Math.round(lost * win.SYSTEM_BOND.loopHealRatio));
  console.log('  受伤至 ' + hp0 + '/' + fL.maxHp + '（已损失 ' + lost + '），' +
    ticks + ' 帧后回复 ' + gain + ' 点');
  ck(ticks === win.SYSTEM_BOND.loopInterval, '每 7 秒触发一次（实测 ' + ticks + ' 帧）');
  ck(Math.abs(fL.loopTimer - win.SYSTEM_BOND.loopInterval) < 1e-9, '触发后计时器重置为 7 秒');

  // 第三个 7 秒：回复量应按「当时的已损失生命」重新计算（越回越少）
  const hp1 = fL.hp, lost1 = fL.maxHp - hp1;
  let ticks2 = 0;
  while (fL.hp === hp1 && ticks2 < 1200) { gL.stepFighter(fL, foeL); ticks2++; }
  const gain2 = fL.hp - hp1;
  const expect2 = Math.max(1, Math.round(lost1 * win.SYSTEM_BOND.loopHealRatio));
  console.log('  第二个周期：已损失 ' + lost1 + ' → 回复 ' + gain2 + ' 点（期望 ' + expect2 + '）');
  ck(gain2 === expect2, '每个周期按当时的已损失生命计算回复量');

  // 累计跑满三个周期：总量必须等于三次按当时损失计算的回复（不会一直按最初的大值回）
  const gL3b = newGame([50, 51, 52], 'mozart');
  gL3b.phase = 'play';
  const f3 = gL3b.playerTeam[0];
  f3.hp = Math.round(f3.maxHp * 0.5);
  let h = f3.hp, heals = 0, expectTotal = 0;
  for (let i = 0; i < 3 * win.SYSTEM_BOND.loopInterval; i++) {
    gL3b.stepFighter(f3, gL3b.right);
    if (f3.hp !== h) {
      expectTotal += Math.max(1, Math.round((f3.maxHp - h) * win.SYSTEM_BOND.loopHealRatio));
      h = f3.hp; heals++;
    }
  }
  console.log('  三个周期共回血 ' + heals + ' 次，合计 ' + (f3.hp - Math.round(f3.maxHp * 0.5)) +
    ' 点（逐次递减累计 ' + expectTotal + ' 点）');
  ck(heals === 3, '7 秒 ×3 正好触发 3 次');
  ck(f3.hp - Math.round(f3.maxHp * 0.5) === expectTotal, '回血总量与逐次计算一致（递减生效）');

  // 满血时不浪费（不回血、但仍重置计时）
  fL.hp = fL.maxHp;
  fL.loopTimer = 1;
  gL.stepFighter(fL, foeL);
  ck(fL.hp === fL.maxHp, '满血时不会溢出回血');
  ck(Math.abs(fL.loopTimer - win.SYSTEM_BOND.loopInterval) < 1e-9, '满血时计时器同样重置');

  // 非循环体系不回复
  const gL2 = newGame([0, 1, 2], 'mozart');    // 贝多芬/莫扎特/勃拉姆斯 → 和声
  const fL2 = gL2.playerTeam[0];
  fL2.hp = Math.round(fL2.maxHp * 0.5);
  const hpL2 = fL2.hp;
  for (let i = 0; i < 900; i++) gL2.stepFighter(fL2, gL2.right);
  ck(fL2.hp === hpL2, '和声体系不会触发循环回血（' + hpL2 + ' → ' + fL2.hp + '）');

  // 通过真实换人流程确认循环共鸣跨回合保留
  const gL3 = newGame([50, 51, 52], 'mozart');
  gL3.phase = 'play';
  gL3.loserSide = 'right';
  gL3.doKo('right');
  gL3.afterKo();
  gL3.nextRound();
  ck(gL3.playerTeam[0].bondSystem === '循环', '换人进入下一回合后循环共鸣依然生效');
}

// ---------------------------------------------------------
// 6.9 v5.0 新增体系「节拍」：普通攻击（挥拳 / 踢腿）攻速 +20%
// ---------------------------------------------------------
console.log('\n== 6.9 v5.0「节拍」体系共鸣 ==');
{
  const gB = newGame([61, 62, 63], 'mozart');   // 泰勒曼 / 塔利斯 / 佩罗坦 → 全为「节拍」
  const fB = gB.playerTeam[0];
  ck(fB.c.tags.system === '节拍', fB.c.name + ' 属于节拍体系');
  ck(fB.bondSystem === '节拍', '三人同体系触发节拍共鸣');
  ck(Math.abs(fB.basicSpeed - 1.2) < 1e-9, '节拍共鸣把 basicSpeed 设为 ' + fB.basicSpeed);

  // 逐帧推进量出「从出拳到收招」的帧数
  function basicFrames(g, f, kind, speed) {
    f.basicSpeed = speed;
    f.setAnim(kind, true);
    f.tickAcc = 0;
    f.hitUsed = false;
    let n = 0;
    while (f.state === kind && n < 200) { g.stepFighter(f, g.right); n++; }
    return n;
  }
  const punchSlow = basicFrames(gB, fB, 'punch', 1.0);
  const punchFast = basicFrames(gB, fB, 'punch', 1.2);
  const kickSlow = basicFrames(gB, fB, 'kick', 1.0);
  const kickFast = basicFrames(gB, fB, 'kick', 1.2);
  console.log('  挥拳 ' + punchSlow + ' 帧 → ' + punchFast + ' 帧；踢腿 ' +
    kickSlow + ' 帧 → ' + kickFast + ' 帧');
  const ratio = (slow, fast) => slow / fast;
  // 注意：帧数是整数，收招判定是「tick > maxTick」，所以加速后的实际帧数
  // 会被向上取整，比值略低于 1.20（实测挥拳 19.0%、踢腿 16.7%）。
  ck(ratio(punchSlow, punchFast) > 1.13 && ratio(punchSlow, punchFast) < 1.25,
    '挥拳整体耗时缩短约 20%（实测 ' + (ratio(punchSlow, punchFast) * 100 - 100).toFixed(1) + '%）');
  ck(ratio(kickSlow, kickFast) > 1.13 && ratio(kickSlow, kickFast) < 1.25,
    '踢腿整体耗时缩短约 20%（实测 ' + (ratio(kickSlow, kickFast) * 100 - 100).toFixed(1) + '%）');
  ck(ratio(punchSlow, punchFast) > 1.05 && ratio(kickSlow, kickFast) > 1.05,
    '两种普通攻击都确实变快了（不会因取整而失效）');

  // 判定帧（punch 5~14 / kick 7~18）的窗口也要跟着变长吗？——变短是对的，
  // 但整段攻击必须仍然存在有效判定帧，否则等于把攻击改废了。
  function activeFrames(g, f, kind, speed) {
    f.basicSpeed = speed;
    f.setAnim(kind, true);
    f.tickAcc = 0;
    f.hitUsed = false;
    let n = 0, seen = 0;
    while (f.state === kind && n < 200) {
      const t = f.tick;
      if (kind === 'punch' ? (t >= 5 && t <= 14) : (t >= 7 && t <= 18)) seen++;
      g.stepFighter(f, g.right);
      n++;
    }
    return seen;
  }
  ck(activeFrames(gB, fB, 'punch', 1.2) >= 8, '节拍攻速下挥拳仍有足够的有效判定帧');
  ck(activeFrames(gB, fB, 'kick', 1.2) >= 9, '节拍攻速下踢腿仍有足够的有效判定帧');

  // 节拍只影响拳脚，不影响技能冷却 / 移动速度
  fB.basicSpeed = 1.2;
  const spd = fB.speedValue();
  fB.basicSpeed = 1;
  ck(Math.abs(fB.speedValue() - spd) < 1e-9, '节拍共鸣不影响移动速度');
  fB.basicSpeed = 1.2;
  const cds = [0, 1, 2].map(i => fB.cooldownOf(i));
  fB.basicSpeed = 1;
  const cds2 = [0, 1, 2].map(i => fB.cooldownOf(i));
  ck(cds.join() === cds2.join(), '节拍共鸣不影响技能冷却');

  // 非节拍体系不会被误加攻速
  const gB2 = newGame([0, 1, 2], 'mozart');
  ck(gB2.playerTeam[0].basicSpeed === 1, '和声体系的 basicSpeed 保持为 1');
  // 换人后依然保留
  const gB3 = newGame([61, 62, 63], 'mozart');
  gB3.phase = 'play';
  gB3.loserSide = 'right';
  gB3.doKo('right');
  gB3.afterKo();
  gB3.nextRound();
  ck(Math.abs(gB3.playerTeam[0].basicSpeed - 1.2) < 1e-9, '换人进入下一回合后节拍共鸣依然生效');
}

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 三套新体系、红色体系羁绊与调整项全部通过'));
process.exitCode = fail ? 1 : 0;

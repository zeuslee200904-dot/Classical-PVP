/* ============================================================
   tools/combat-test.mjs — 用桩环境直接驱动战斗引擎，校验概率类规则
   用法: node combat-test.mjs
   校验项：
     1. 格挡时普通攻击 75% 完全免疫
     2. 格挡时技能伤害 60% 概率减免 20%~40%
     3. 不格挡时不吃任何减免
     4. 穿透/全屏技能无视格挡
     5. 绿色羁绊伤害 +15%
     6. 黄色羁绊每 20 秒免疫 2.5 秒
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// ---------- 桩环境 ----------
const noop = () => { };
function EffectsStub() {
  this.list = []; this.numbers = []; this.shake = 0; this.flash = 0; this.flashColor = '#fff';
  this.clear = noop; this.update = noop; this.draw = noop; this.drawNumbers = noop;
  this.add = (p) => { this.list.push(p); return p; };
  this.addNumber = noop; this.kick = noop; this.skillFx = noop; this.blockSpark = noop;
  this.hitBurst = noop; this.sparks = noop; this.ring = noop;
}
const fakeCtx = new Proxy({}, {
  get: (t, k) => (k === 'canvas' ? {} : (typeof k === 'string' ? noop : undefined)),
  set: () => true
});
const canvas = { getContext: () => fakeCtx, width: 960, height: 540 };

const win = {
  FX: { Effects: EffectsStub, drawText: noop, textWidth: () => 10, rr: noop, rnd: (a, b) => a, pickOne: () => '0' },
  Sprites: { draw: noop, frameName: () => 'idle0' },
  Chiptune: {
    sfx: noop, stopMusic: noop, resume: noop, toggleMute: () => false, setMuted: () => false, playing: false,
    playTrack: () => ({ title: 'stub' }), trackCount: () => 12, trackTitle: () => 'stub'
  },
  AIController: function () { this.reset = noop; this.update = noop; },
  document: { createElement: () => ({ getContext: () => fakeCtx }) },
  performance: { now: () => 0 },
  requestAnimationFrame: noop
};
win.window = win;
const ctx = vm.createContext({
  window: win, console, Math, Object, Array, JSON, String, Number, Boolean,
  isNaN, parseInt, parseFloat, RegExp, Date
});
vm.runInContext(read('../js/characters.js'), ctx, { filename: 'characters.js' });
vm.runInContext(read('../js/game.js'), ctx, { filename: 'game.js' });

const G = win.GameClass;
const BY = win.COMPOSER_BY_ID;
let fail = 0;
const ck = (ok, msg) => { if (ok) console.log('  ✓ ' + msg); else { console.log('  ✗ ' + msg); fail++; } };

// ---------- 构造一局 ----------
// 注意：startMatch 会给随机敌方队伍套上羁绊共鸣，敌方三人恰好同属「回旋」时
// 会带来 8% 减伤，污染伤害类对照测量，因此这里先把体系共鸣统一清掉；
// 绿色 / 黄色共鸣标记保留，供后面的羁绊用例使用。
function newGame(teamIds) {
  const g = new G(canvas);
  g.selSlots = teamIds;
  g.startMatch();
  g.nextRound();
  g.phase = 'play';
  g.playerTeam.concat(g.enemyTeam).forEach(f => {
    f.bondSystem = null;
    f.rondoShield = 0;
    f.rondoTimer = 1e9;
  });
  return g;
}

// v4.2：全局伤害下调系数（从引擎导出，避免测试里再抄一份数字）
const DSCALE = win.GAME_CONST.DAMAGE_SCALE;

const g = newGame([0, 1, 2]);      // 贝多芬 / 勃拉姆斯 / 李斯特（德奥）
const attacker = g.left;
const victim = g.right;

console.log('== 1. 格挡：普通攻击 75% 完全免疫 ==');
let immune = 0, hit = 0;
const N = 40000;
for (let i = 0; i < N; i++) {
  victim.hp = 1000;
  victim.blocking = true;
  victim.guardHit = 0;
  g.phase = 'play';
  g.hitTarget(attacker, victim, { damage: 10, basic: true, stun: 10, knock: 2 }, null);
  if (victim.hp === 1000) immune++; else hit++;
}
const immuneRate = immune / N;
console.log('  免疫 ' + immune + ' / 命中 ' + hit + ' → 免疫率 ' + (immuneRate * 100).toFixed(2) + '%');
ck(Math.abs(immuneRate - 0.75) < 0.02, '免疫率接近 75%（实测 ' + (immuneRate * 100).toFixed(2) + '%）');

console.log('\n== 2. 格挡：技能 60% 概率减免 20%~40% ==');
// 用大数值降低取整误差；基准伤害 = 面板伤害 × 攻击方伤害倍率 × v4.2 全局下调
const PANEL = 1000;
const baseDmg = Math.round(PANEL * attacker.damageMul() * DSCALE);
console.log('  攻击方倍率 ' + attacker.damageMul().toFixed(3) + ' × 下调 ' + DSCALE +
  ' → 基准伤害 ' + baseDmg);
let cut = 0, noCut = 0;
let minCut = 9, maxCut = 0;
const M = 40000;
for (let i = 0; i < M; i++) {
  victim.hp = 100000;
  victim.blocking = true;
  g.phase = 'play';
  g.hitTarget(attacker, victim, { damage: PANEL, stun: 10, knock: 2 }, null);
  const taken = 100000 - victim.hp;
  const cutFrac = 1 - taken / baseDmg;
  if (cutFrac <= 0.001) noCut++;
  else { cut++; minCut = Math.min(minCut, cutFrac); maxCut = Math.max(maxCut, cutFrac); }
}
const cutRate = cut / M;
console.log('  减免 ' + cut + ' / 未减免 ' + noCut + ' → 触发率 ' + (cutRate * 100).toFixed(2) + '%');
console.log('  实测减免幅度 ' + (minCut * 100).toFixed(2) + '% ~ ' + (maxCut * 100).toFixed(2) + '%');
ck(Math.abs(cutRate - 0.60) < 0.02, '触发率接近 60%（实测 ' + (cutRate * 100).toFixed(2) + '%）');
ck(minCut >= 0.195 && minCut <= 0.22, '最浅减免 ≈20%（实测 ' + (minCut * 100).toFixed(2) + '%）');
ck(maxCut <= 0.405 && maxCut >= 0.38, '最深减免 ≈40%（实测 ' + (maxCut * 100).toFixed(2) + '%）');

console.log('\n== 3. 不格挡时不享受任何减免 ==');
let untouched = 0, reduced = 0;
for (let i = 0; i < 20000; i++) {
  victim.hp = 100000;
  victim.blocking = false;
  g.phase = 'play';
  g.hitTarget(attacker, victim, { damage: PANEL, stun: 10, knock: 2 }, null);
  const taken = 100000 - victim.hp;
  if (taken >= baseDmg - 1) untouched++; else reduced++;
}
ck(reduced === 0, '未格挡时 20000 次命中均无减免（减免次数 ' + reduced + '）');

console.log('\n== 4. 穿透 / 全屏技能无视格挡 ==');
let pierced = 0;
for (let i = 0; i < 20000; i++) {
  victim.hp = 100000;
  victim.blocking = true;
  g.phase = 'play';
  g.hitTarget(attacker, victim, { damage: PANEL, pierce: true, stun: 10, knock: 2 }, null);
  if (100000 - victim.hp >= baseDmg - 1) pierced++;
}
let fs = 0;
for (let i = 0; i < 20000; i++) {
  victim.hp = 100000;
  victim.blocking = true;
  g.phase = 'play';
  g.hitTarget(attacker, victim, { damage: PANEL, fullScreen: true, stun: 10, knock: 2 }, null);
  if (100000 - victim.hp >= baseDmg - 1) fs++;
}
ck(pierced === 20000, '穿透技能 20000 次全部无视格挡');
ck(fs === 20000, '全屏技能 20000 次全部无视格挡');

console.log('\n== 5. 绿色（时期）羁绊：伤害 +12%（v3.0 调整）==');
const g2 = newGame([0, 2, 3]);   // 贝多芬/勃拉姆斯/马勒 → 仅德奥×3（黄），无时期共鸣
const f0 = g2.playerTeam[0];
console.log('  基线阵容共鸣: era=' + f0.bondEra + ' region=' + f0.bondRegion);
f0.bondEra = null;
const before = f0.damageMul();
f0.bondEra = '古典主义';
const after = f0.damageMul();
console.log('  无共鸣 ' + before.toFixed(4) + ' → 有共鸣 ' + after.toFixed(4) + '（比值 ' + (after / before).toFixed(4) + '）');
ck(Math.abs(after / before - 1.12) < 0.0001, '伤害倍率恰为 +12%');

console.log('\n== 6. 黄色（地区）羁绊：每 6~15 秒随机免疫 2.5 秒（v4.2）==');
const g3 = newGame([0, 1, 15]);  // 贝多芬/莫扎特/海顿 → 古典主义×3 + 德奥×3
const gb = g3.playerTeam[0];
console.log('  共鸣标记: era=' + gb.bondEra + ' region=' + gb.bondRegion + ' 初始计时=' + gb.bondTimer + ' 帧');
ck(gb.bondRegion === '德奥', '玩家获得地区共鸣');
// 间隔改为 6~15 秒随机：多掷几次看分布范围
let rmin = 1e9, rmax = -1e9;
for (let i = 0; i < 4000; i++) {
  const r = win.rollRegionInterval();
  if (r < rmin) rmin = r;
  if (r > rmax) rmax = r;
}
console.log('  随机间隔实测范围 ' + (rmin / 60).toFixed(2) + ' ~ ' + (rmax / 60).toFixed(2) + ' 秒');
ck(rmin >= 6 * 60 && rmax <= 15 * 60, '随机间隔落在 6~15 秒内');
ck(rmax - rmin > 8 * 60, '间隔确实在 6~15 秒之间大幅浮动（而非固定值）');
ck(win.BOND.regionInvuln === 150, '免疫时长仍为 2.5 秒（150 帧）');

const foe = g3.enemyTeam[0];
// 让计时器必然在这一帧触发，验证触发后的表现
gb.bondTimer = 1;
let triggeredAt = -1, shieldAtTrigger = 0, timerAfterTrigger = 0;
for (let f = 1; f <= 60; f++) {
  g3.stepFighter(gb, foe);
  if (triggeredAt < 0 && gb.invuln > 0) {
    triggeredAt = f; shieldAtTrigger = gb.bondShield; timerAfterTrigger = gb.bondTimer;
  }
}
console.log('  第 ' + triggeredAt + ' 帧触发免疫；触发瞬间免疫 ' + shieldAtTrigger +
  ' 帧，下次计时重置为 ' + (timerAfterTrigger / 60).toFixed(2) + ' 秒');
ck(triggeredAt === 1, '计时归零当帧立即触发免疫');
ck(shieldAtTrigger === 150, '免疫时长为 150 帧（2.5 秒）');
ck(timerAfterTrigger >= 6 * 60 && timerAfterTrigger <= 15 * 60, '下次间隔重新在 6~15 秒内随机');
// 免疫期内免疫全部伤害
gb.invuln = 150;
gb.hp = 500;
g3.phase = 'play';
g3.hitTarget(g3.enemyTeam[0], gb, { damage: 999, stun: 10, knock: 2 }, null);
ck(gb.hp === 500, '免疫期内伤害完全无效（HP 仍为 500）');

console.log('\n== 7. 羁绊只作用于共鸣角色 ==');
const g4 = newGame([20, 21, 12]);  // 德彪西/拉威尔/巴赫 → 晚期浪漫×2 + 法派×2；巴赫不参与
const members = g4.playerTeam.map(f => f.c.name + '[绿:' + (f.bondEra || '无') + ' 黄:' + (f.bondRegion || '无') + ']');
console.log('  ' + members.join('　'));
ck(g4.playerTeam[0].bondEra === '晚期浪漫主义' && g4.playerTeam[0].bondRegion === '法派', '德彪西获得双共鸣');
ck(g4.playerTeam[1].bondRegion === '法派', '拉威尔获得地区共鸣');
ck(g4.playerTeam[2].bondEra === null && g4.playerTeam[2].bondRegion === null, '巴赫（无同标签队友）不获得任何共鸣');

console.log('\n== 8. 领域与回声 ==');
const g5 = newGame([15, 20, 21]);
g5.phase = 'play';
g5.left.x = 300; g5.right.x = 500;
const sk = g5.left.c.skills;         // 海顿：Q=回声 W=领域
console.log('  海顿技能类型: ' + sk.map(s => s.key + '=' + s.type).join(' '));
g5.useSkill(g5.left, g5.right, 1);   // 领域
ck(g5.fields.length === 1, '释放领域后 fields=1');
ck(g5.left.state === 'field', '播放领域动画状态 field');
g5.useSkill(g5.left, g5.right, 0);   // 回声
ck(g5.echoes.length >= 1, '释放回声后 echoes=' + g5.echoes.length);
ck(g5.left.state === 'echo', '播放回声动画状态 echo');
// 领域叠加限制：同类型领域只保留一个
g5.left.cd[1] = 0;
g5.useSkill(g5.left, g5.right, 1);
ck(g5.fields.length === 1, '同类领域不叠加（仍为 ' + g5.fields.length + ' 个）');
// 领域伤害随时间生效
const tgt = g5.right;
tgt.hp = 500;
tgt.x = g5.fields[0] ? g5.fields[0].x : tgt.x;   // 站进领域里
let fieldFrames = 0;
while (g5.fields.length && fieldFrames < 900) { g5.stepFields(); fieldFrames++; }
ck(tgt.hp < 500, '领域对范围内的对手造成伤害（HP ' + Math.round(tgt.hp) + '，历时 ' + fieldFrames + ' 帧）');
ck(g5.fields.length === 0, '领域到期后自动消失（' + fieldFrames + ' 帧 ≈ ' + (fieldFrames / 60).toFixed(1) + ' 秒）');

// =========================================================
//  v4.2 新增校验
// =========================================================
console.log('\n== 9. v4.2：全体伤害统一下调 ==');
{
  const g9 = newGame([0, 1, 2]);
  const a9 = g9.left, v9 = g9.right;
  g9.phase = 'play';
  const m = a9.damageMul();
  console.log('  攻击方倍率 ' + m.toFixed(4) + '，全局下调系数 = ' + DSCALE);
  const expect = (panel) => Math.max(1, Math.round(panel * m * DSCALE));
  let okDmg = 0;
  const panels = [4, 7, 11, 20, 46];
  const actual = panels.map(p => {
    v9.hp = 100000; v9.maxHp = 100000; v9.invuln = 0; v9.armor = null; v9.shield = 0; v9.stun = 0;
    g9.hitTarget(a9, v9, { damage: p, stun: 1, knock: 0, basic: true, pierce: true }, null);
    return 100000 - v9.hp;
  });
  panels.forEach((p, i) => {
    if (actual[i] === expect(p)) okDmg++;
    console.log('    面板 ' + p + ' → 实测 ' + actual[i] + '（期望 ' + expect(p) + '）');
  });
  ck(okDmg === panels.length, '普通命中伤害 = round(面板 × 倍率 × ' + DSCALE + ')');
  // 领域 / 持续伤害同样下调
  const f9 = g9.left;
  v9.hp = 100000;
  const fdDmg = g9.fieldDamage(a9, v9, 30, { kindColor: '#fff' });
  ck(fdDmg === Math.round(30 * DSCALE), '领域类伤害同样只按下调后的数值结算（30 → ' + fdDmg + '）');
  void f9;
}

console.log('\n== 10. v4.2：开局 6 秒内不可使用终极技 ==');
{
  const g10 = newGame([0, 1, 2]);
  g10.phase = 'intro'; g10.phaseT = 105; g10.playT = 0;
  g10.left.cd = [0, 0, 0]; g10.right.cd = [0, 0, 0];
  g10.updateFight();     // 进入交战的第一帧：本帧末挂上初始冷却
  console.log('  开打瞬间 cd = [' + g10.left.cd.join(', ') + ']');
  ck(g10.phase === 'play', '倒计时结束进入交战');
  ck(g10.left.cd[2] === win.GAME_CONST.ULT_OPENING_CD && g10.right.cd[2] === win.GAME_CONST.ULT_OPENING_CD,
    '双方终极技均进入 ' + (win.GAME_CONST.ULT_OPENING_CD / 60) + ' 秒初始冷却（' + g10.left.cd[2] + ' 帧）');
  // 走真实输入路径：按住 E 也不会放出大招
  let fired = 0;
  for (let i = 0; i < 5; i++) {
    g10.input.ult = true;
    g10.wasDownPrev = {};
    const before = g10.left.cd[2];
    g10.readPlayerInput(g10.left, g10.right);
    if (g10.left.cd[2] > before) fired++;     // 冷却被重新写入 = 真的放了技能
  }
  ck(fired === 0, '冷却未走完时按 E 不会释放终极技');
  // 冷却走完（6 秒 = 360 帧）后即可释放
  for (let i = 1; i < 360; i++) g10.stepFighter(g10.left, g10.right);
  ck(g10.left.cd[2] === 1, '交战第 359 帧时冷却还剩 1 帧');
  g10.stepFighter(g10.left, g10.right);
  ck(g10.left.cd[2] === 0, '交战满 360 帧（6 秒）后冷却归零');
  g10.input.ult = true; g10.wasDownPrev = {};
  g10.readPlayerInput(g10.left, g10.right);
  ck(g10.left.cd[2] > 0, '冷却归零后可以正常释放终极技');
}

console.log('\n== 11. v4.2：跳跃最高点刚好能避开投掷类技能 ==');
{
  // 用真实物理推进一次完整起跳，返回最高点相对地面的高度
  function apexOf(g, f, oldJump) {
    const G0 = win.GAME_CONST;
    let y = G0.GROUND;
    let vy = -(oldJump ? (9.4 + f.c.stats.speed * 0.038) : f.jumpPower());
    let top = y, air = 0;
    for (let i = 0; i < 120; i++) {
      vy += G0.GRAVITY;
      y += vy;
      if (y < top) top = y;
      air++;
      if (y >= G0.GROUND) break;
    }
    return { rise: G0.GROUND - top, air };
  }
  const g11 = newGame([0, 1, 2]);
  const f11 = g11.left;
  const aNew = apexOf(g11, f11, false), aOld = apexOf(g11, f11, true);
  console.log('  旧跳跃最高点 ' + aOld.rise.toFixed(1) + ' px（滞空 ' + aOld.air + ' 帧）→ 新跳跃最高点 ' +
    aNew.rise.toFixed(1) + ' px（滞空 ' + aNew.air + ' 帧）');
  ck(aNew.rise > aOld.rise + 40, '跳跃高度明显提高（+' + (aNew.rise - aOld.rise).toFixed(1) + ' px）');
  ck(aNew.air >= 40 && aNew.air <= 80, '滞空时间仍在合理范围（' + aNew.air + ' 帧 ≈ ' + (aNew.air / 60).toFixed(2) + ' 秒）');

  // 端到端：投射物从固定距离飞来，改变“起跳时机”，统计能完全躲开的帧数窗口
  // 受害者统一固定为“速度最低（跳得最低）”的角色，结果可复现且是最坏情况
  const slowest = win.COMPOSERS.reduce((a, b) => (b.stats.speed < a.stats.speed ? b : a));
  console.log('  躲避方统一取速度最低的 ' + slowest.name + '（速度 ' + slowest.stats.speed + '，跳跃最高点最低）');
  const CN = win.COMPOSERS.length;   // 75（v5.0），不要写死数字
  function dodgeWindow(charIdx, slot, oldJump, dist) {
    const pr0 = win.COMPOSERS[charIdx].skills[slot].proj;
    const D = dist || 240;
    let best = 0;
    for (let delay = 0; delay <= 90; delay++) {
      const ids = [charIdx, (charIdx + 7) % CN, (charIdx + 13) % CN];
      const g = newGame(ids);
      const a = g.left, v = g.right;
      g.phase = 'play';
      a.x = 300; v.x = 620;
      v.c = slowest; v.maxHp = slowest.maxHp; v.hp = slowest.maxHp;
      // 按技能面板生成全部弹体（count / spacing 与实战一致）
      for (let i = 0; i < (pr0.count || 1); i++) g.spawnProjectile(a, pr0, 1, i, null);
      const mine = g.projectiles.slice(-(pr0.count || 1));
      mine.forEach(p => { p.x = v.x - D; p.delay = 0; });
      let vy = 0, airborne = false;
      const hp0 = v.hp;
      for (let i = 0; i < 150; i++) {
        g.t++;
        if (!airborne && i === delay) {
          vy = -(oldJump ? (9.4 + v.c.stats.speed * 0.038) : v.jumpPower());
          airborne = true; v.onGround = false;
        }
        if (airborne) {
          vy += win.GAME_CONST.GRAVITY;
          v.y += vy;
          if (v.y >= win.GAME_CONST.GROUND) { v.y = win.GAME_CONST.GROUND; vy = 0; v.onGround = true; airborne = false; }
        }
        // 弹体都飞过角色或消失后即可结束
        for (let k = 0; k < g.projectiles.length; k++) g.projectiles[k].x += 0;   // 仅保持引用
        g.stepProjectiles();
        if (!g.projectiles.length) break;
      }
      if (v.hp >= hp0) best++;
    }
    return best;
  }
  const wQ = dodgeWindow(0, 0, false);          // 贝多芬 Q（月华三重奏，单发 ×3 连射）
  const wQOld = dodgeWindow(0, 0, true);
  console.log('  贝多芬 Q 可躲开的起跳时机：v4.2 ' + wQ + ' 帧 / v4.1 ' + wQOld + ' 帧（共 91 种时机）');
  ck(wQ >= 5, 'v4.2 跳跃可以躲开贝多芬的 Q（存在 ' + wQ + " 帧的可操作时机窗口）");
  ck(wQOld === 0, 'v4.1 的跳跃高度完全躲不开（对照 ' + wQOld + ' 帧）');

  // 全角色普查：统计每个投掷技的“起跳时机窗口”帧数
  // 注意用 COMPOSERS.length 而不是写死的 50——v5.0 加了 25 位角色后，
  // 写死的取模会把新角色排除在普查之外（第一版就是这么漏掉 25 人的）。
  const chars = win.COMPOSERS;
  const table = [];
  for (let ci = 0; ci < CN; ci++) {
    for (let slot = 0; slot < 2; slot++) {
      const sk = chars[ci].skills[slot];
      if (!sk || sk.type !== 'projectile' || !sk.proj) continue;
      const cnt = sk.proj.count || 1;
      table.push({
        name: chars[ci].name + ' ' + sk.key, cnt,
        speed: sk.proj.speed, w: sk.proj.w,
        yOff: sk.proj.yOff == null ? -78 : sk.proj.yOff,
        low: !!sk.proj.low,
        win: dodgeWindow(ci, slot, false)
      });
    }
  }
  table.forEach(t => console.log('    ' + t.name + ' ×' + t.cnt + ' 速度' + t.speed + ' 宽' + t.w +
    ' y' + t.yOff + (t.low ? '(贴地)' : '') + ' → 可躲窗口 ' + t.win + ' 帧'));
  const okWin = table.filter(t => t.win >= 4).length;
  const zero = table.filter(t => t.win === 0);
  const minWin = Math.min(...table.map(t => t.win));
  console.log('  投掷技共 ' + table.length + ' 个：可躲窗口 ≥4 帧的有 ' + okWin +
    ' 个，平均 ' + (table.reduce((s, t) => s + t.win, 0) / table.length).toFixed(1) + ' 帧，最窄 ' + minWin + ' 帧');
  ck(okWin >= table.length * 0.8, '绝大多数投掷技（≥80%）都留有可操作的起跳时机（' +
    okWin + '/' + table.length + '）');
  ck(zero.length === 0, '没有任何投掷技是“怎么跳都躲不开”的' +
    (zero.length ? '（' + zero.map(t => t.name).join('、') + '）' : ''));
  // 跳跃高度不应高到连近战 / 多段技能的垂直判定都能躲掉（判定上限 150 / 160）
  ck(aNew.rise < 150, '跳跃最高点 ' + aNew.rise.toFixed(1) + ' px 仍低于多段技能的垂直判定上限 150px');
}

// ---------- 12. v5.0：设置栏的「对战音效」开关 ----------
console.log('\n== 12. v5.0 设置栏：对战音效开关 ==');
{
  // 用可记录的 Chiptune 桩，观察游戏是否真的把开关传给了音频引擎
  const calls = [];
  let sfxState = true;
  const chipt = {
    sfx: noop, stopMusic: noop, resume: noop, playing: false,
    toggleMute: () => false, setMuted: () => false,
    playTrack: () => ({ title: 'stub' }), trackCount: () => 12, trackTitle: () => 'stub',
    setSfxEnabled: (v) => { sfxState = v !== false; calls.push(sfxState); return sfxState; },
    sfxEnabled: () => sfxState,
    toggleSfx: () => { sfxState = !sfxState; calls.push(sfxState); return sfxState; }
  };
  const win2 = Object.assign({}, win, { Chiptune: chipt });
  win2.window = win2;
  const store = {};
  win2.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  };
  const ctx2 = vm.createContext({
    window: win2, console, Math, Object, Array, JSON, String, Number, Boolean,
    isNaN, parseInt, parseFloat, RegExp, Date
  });
  vm.runInContext(read('../js/characters.js'), ctx2, { filename: 'characters.js' });
  vm.runInContext(read('../js/game.js'), ctx2, { filename: 'game.js' });

  const G2 = win2.GameClass;
  const cv = { getContext: () => fakeCtx, width: 960, height: 540 };

  // (a) 默认开启，并且开局就同步给音频引擎
  const ga = new G2(cv);
  ck(ga.settings.sfx === true, '默认「对战音效」为开');
  ck(calls[calls.length - 1] === true, '构造游戏时把音效开关同步给音频引擎（' + calls[calls.length - 1] + '）');

  // (b) 打开设置 → 切到第 1 行 → 用方向键关掉
  ga.openSettings();
  ck(ga.state === 'settings', 'O 键可以打开设置面板');
  ga.input = { down: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.settingsIndex === 1, '按 ↓ 光标移到「对战音效」行（index=' + ga.settingsIndex + '）');
  ga.input = { right: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.settings.sfx === false, '方向键可以关掉对战音效');
  ck(calls[calls.length - 1] === false, '关闭后立即同步给音频引擎');
  ck(store['ccb_settings'] && JSON.parse(store['ccb_settings']).sfx === false, '开关状态写入 localStorage');

  // (c) 再按一次会打开
  ga.input = { left: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.settings.sfx === true, '再切一次会重新打开');

  // (d) 光标能走到「返回」并关闭面板（3 行可选，别越界）
  ga.settingsIndex = 1;
  ga.input = { down: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.settingsIndex === 2, '按 ↓ 可以走到「返回」行');
  ga.input = { down: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.settingsIndex === 0, '再按 ↓ 回到第一行（不会越界到 index=3）');
  ga.settingsIndex = 2;
  ga.input = { start: true }; ga.wasDown = {}; ga.wasDownPrev = {};
  ga.updateSettings();
  ck(ga.state !== 'settings', '在「返回」行按 Enter 关闭设置（state=' + ga.state + '）');

  // (e) 重开游戏时读取上次保存的开关
  ga.settingsIndex = 1;
  if (ga.settings.sfx !== false) {   // 确保处于「关」
    ga.input = { right: true }; ga.wasDown = {}; ga.wasDownPrev = {};
    ga.updateSettings();
  }
  const saved = JSON.parse(store['ccb_settings']);
  ck(saved.sfx === false, '保存的内容里 sfx=false');
  // 真正验证 loadSettings：新实例应读到 false 并同步给音频引擎
  const gc2 = new G2(cv);
  ck(gc2.settings.sfx === false, '新开一局会从 localStorage 读回「对战音效=关」');
  ck(calls[calls.length - 1] === false, '读回后同样同步给音频引擎（' + calls[calls.length - 1] + '）');
  // 旧存档（没有 sfx 字段）应默认为开
  store['ccb_settings'] = JSON.stringify({ muted: true });
  const gd = new G2(cv);
  ck(gd.settings.sfx === true, '旧存档（无 sfx 字段）默认对战音效为开');
  ck(gd.settings.muted === true, '旧存档里的静音设置仍然被读回');
}

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 全部战斗规则校验通过'));
process.exitCode = fail ? 1 : 0;

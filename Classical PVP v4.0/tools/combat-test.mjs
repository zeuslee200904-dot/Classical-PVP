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
function newGame(teamIds) {
  const g = new G(canvas);
  g.selSlots = teamIds;
  g.startMatch();
  g.nextRound();
  g.phase = 'play';
  return g;
}

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
// 用大数值降低取整误差；基准伤害 = 面板伤害 × 攻击方伤害倍率
const PANEL = 1000;
const baseDmg = Math.round(PANEL * attacker.damageMul());
console.log('  攻击方倍率 ' + attacker.damageMul().toFixed(3) + ' → 基准伤害 ' + baseDmg);
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

console.log('\n== 6. 黄色（地区）羁绊：每 12 秒免疫 2.5 秒（v3.0 调整）==');
const g3 = newGame([0, 1, 15]);  // 贝多芬/莫扎特/海顿 → 古典主义×3 + 德奥×3
const gb = g3.playerTeam[0];
console.log('  共鸣标记: era=' + gb.bondEra + ' region=' + gb.bondRegion + ' 初始计时=' + gb.bondTimer + ' 帧');
ck(gb.bondRegion === '德奥', '玩家获得地区共鸣');
ck(gb.bondTimer === 720, '初始计时为 12 秒（720 帧）');
const foe = g3.enemyTeam[0];
let triggeredAt = -1, shieldAtTrigger = 0, timerAfterTrigger = 0;
for (let f = 1; f <= 800; f++) {
  g3.stepFighter(gb, foe);
  if (triggeredAt < 0 && gb.invuln > 0) {
    triggeredAt = f; shieldAtTrigger = gb.bondShield; timerAfterTrigger = gb.bondTimer;
  }
}
console.log('  第 ' + triggeredAt + ' 帧触发免疫；触发瞬间免疫 ' + shieldAtTrigger + ' 帧，计时重置为 ' + timerAfterTrigger + ' 帧');
ck(triggeredAt === 720, '恰在第 720 帧（12 秒）触发');
ck(shieldAtTrigger === 150, '免疫时长为 150 帧（2.5 秒）');
ck(timerAfterTrigger === 720, '周期重置为 12 秒');
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

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 全部战斗规则校验通过'));
process.exitCode = fail ? 1 : 0;

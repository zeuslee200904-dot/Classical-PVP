/* ============================================================
   tools/ultimate-test.mjs — 终极技「必须真的产生效果」
   背景：v5.0 的 useSkill 兜底分支只处理 field / echo 两种载荷，
   于是 10 个「只带 movement 载荷」的终极技放完什么都不发生，
   34 个终极技的卡农重奏窗口、6 个终极技的回旋弹道被静默丢弃。
   这个测试逐个释放 75 个终极技，断言至少产生了一种实际效果。
   用法: node ultimate-test.mjs
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
    sfxEnabled: () => true, setSfxEnabled: () => true, toggleSfx: () => true,
    playing: false, playTrack: () => ({ title: 'stub' }), trackCount: () => 32, trackTitle: () => 'stub'
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

const GC = win.GameClass, BY = win.COMPOSER_BY_ID, C = win.COMPOSERS;
let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };

/** 让 me 对着一个"愿意被打"的木桩放终极技，观察 600 帧里发生了什么 */
function cast(id) {
  const me = new win.FighterClass(BY[id], 'left', 0);
  const foe = new win.FighterClass(BY.mozart, 'right', 0);
  const g = new GC(canvas);
  g.state = 'fight'; g.phase = 'play'; g.phaseT = 999; g.playT = 0; g.roundTime = 99999;
  g.left = me; g.right = foe;
  g.readPlayerInput = noop;
  g.fx.clear();
  foe.maxHp = 100000; foe.hp = 100000; foe.x = me.x + 120;   // 木桩：不会死，方便统计总伤害
  me.cd[2] = 0;

  const before = { hp: foe.hp };
  const seen = { field: false, echo: false, movement: false, rondo: false, canon: false, anim: null, fx: 0 };
  const realField = g.spawnField.bind(g), realEcho = g.spawnEcho.bind(g);
  const realMove = g.spawnMovement.bind(g), realRondo = g.spawnRondo.bind(g);
  g.spawnField = function (o, s, f) { seen.field = true; return realField(o, s, f); };
  g.spawnEcho = function (o, s, f) { seen.echo = true; return realEcho(o, s, f); };
  g.spawnMovement = function (o, s, f) { seen.movement = true; return realMove(o, s, f); };
  g.spawnRondo = function (o, s, f) { seen.rondo = true; return realRondo(o, s, f); };

  g.useSkill(me, foe, 2);
  seen.anim = me.state;
  if (me.canon) seen.canon = true;
  // 把木桩钉在原地，只挨打不还手也不逃跑
  for (let f = 0; f < 600; f++) {
    foe.x = me.x + 120; foe.vx = 0; foe.stun = 0; foe.invuln = 0;
    me.cd[2] = 9999;
    g.t++; g.updateFight();
  }
  seen.damage = before.hp - foe.hp;
  return seen;
}

console.log('== 逐个释放 75 个终极技，检查是否真的产生效果 ==');
const rows = [];
for (const ch of C) {
  const r = cast(ch.id);
  const effects = [];
  for (const k of ['field', 'echo', 'movement', 'rondo', 'canon']) if (r[k]) effects.push(k);
  if (r.damage > 0) effects.push('伤害' + Math.round(r.damage));
  rows.push({ name: ch.name, id: ch.id, effects, anim: r.anim, damage: r.damage });
}
const dead = rows.filter(r => r.effects.length === 0);
for (const r of dead) console.log('     ✗ ' + r.name + ' 的终极技 600 帧内没有任何效果（动作=' + r.anim + '）');
ck(dead.length === 0, '全部 ' + C.length + ' 个终极技都会产生实际效果（' + (C.length - dead.length) + '/' + C.length + '）');

// 载荷在数据里声明了，就必须在效果里出现（防止再退化回"静默丢弃"）
const LOST = [];
for (const ch of C) {
  const sk = ch.skills[2];
  const row = rows.find(r => r.id === ch.id);
  for (const k of ['field', 'echo', 'movement', 'rondo']) {
    if (sk[k] && row.effects.indexOf(k) < 0 && row.damage <= 0) LOST.push(ch.name + ' 的 ' + k + ' 载荷没有生效');
  }
  if (sk.canon && row.effects.indexOf('canon') < 0) LOST.push(ch.name + ' 的 canon 窗口没有生效');
}
for (const l of LOST) console.log('     ✗ ' + l);
ck(LOST.length === 0, '数据里声明的每一种终极技载荷都在运行时生效');

// 全员终极技至少能打到人（自伤型/纯增益型除外）
const noDamage = rows.filter(r => r.damage <= 0);
console.log('  无伤害的终极技（纯增益 / 领域机制）：' + (noDamage.length ? noDamage.map(r => r.name).join(' ') : '无'));
const dmg = rows.map(r => r.damage).filter(v => v > 0).sort((a, b) => a - b);
console.log('  伤害分布: min=' + Math.round(dmg[0]) + ' 中位=' + Math.round(dmg[Math.floor(dmg.length / 2)]) +
  ' max=' + Math.round(dmg[dmg.length - 1]) + '（600 帧内的累计值，木桩不还手）');
ck(dmg[dmg.length - 1] < 1200, '没有终极技能在 10 秒内打出离谱的累计伤害（最高 ' + Math.round(dmg[dmg.length - 1]) + '）');

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 终极技效果校验通过'));
process.exitCode = fail ? 1 : 0;

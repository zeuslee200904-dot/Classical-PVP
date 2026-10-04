/* ============================================================
   tools/sustain-test.mjs — 续航（回血 / 吸血 / 护盾 / 减伤）数值体检
   用法: node sustain-test.mjs

   背景：v4.2 把全体伤害下调 20% 之后，回复类数值没有同步调整，
        于是「回血速度 ≥ 挨打速度」的build出现了。v4.2.1 统一下调，
        这里做成可复现的体检，防止以后再次跑偏：

        第 1 节  静态计算每个角色的平均 / 峰值回血，设上限
        第 2 节  护盾速率、持续减伤幅度上限
        第 3 节  固定压力实跑（12 点/秒 挨打 20 秒，技能一好就放），
                 统计真实掉血量，确认没人能靠回血站住
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

// v4.2.1 的数值上限（依据：实测对局中每方对单一目标的输出约 9~12 点/秒）
const REF_DPS = 12;        // 参考挨打速度（点/秒）
const AVG_CAP = 6.0;       // 长期平均回血上限（点/秒）
const PEAK_CAP = 8.5;      // 持续回血的峰值速率上限（点/秒）
const SHIELD_CAP = 5.5;    // 护盾生成速率上限（护盾值 / 冷却）
const ARMOR_CAP = 0.25;    // 持续减伤的平均幅度上限（减伤比例 × 生效占比）

// ---------- 1. 静态回血体检 ----------
function healProfile(ch) {
  let avg = 0, peak = 0;
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const sk = ch.skills[i];
    const cd = Math.max(1, sk.cd || 1);
    if (sk.self && sk.self.heal) {
      const a = sk.self.heal / cd;
      avg += a;
      parts.push(sk.key + ' 自愈' + sk.self.heal + '(' + a.toFixed(1) + '/s)');
    }
    if (sk.field && sk.field.heal) {
      const perSec = sk.field.heal * 60 / (sk.field.tickEvery || 30);
      const dur = Math.min(sk.field.dur || 0, cd);
      const a = perSec * dur / cd;
      avg += a; peak += perSec;
      parts.push(sk.key + ' 领域回血' + perSec.toFixed(1) + '/s×' + (sk.field.dur || 0) + 's(' + a.toFixed(1) + '/s)');
    }
    if (sk.field && sk.field.drain && sk.field.dps) {
      const perTick = sk.field.dps * K.FIELD_DAMAGE_SCALE * 1.2 * K.DAMAGE_SCALE;
      const perSec = perTick * sk.field.drain * 60 / (sk.field.tickEvery || 30);
      const dur = Math.min(sk.field.dur || 0, cd);
      const a = perSec * dur / cd;
      avg += a; peak += perSec;
      parts.push(sk.key + ' 吸取' + perSec.toFixed(1) + '/s×' + (sk.field.dur || 0) + 's(' + a.toFixed(1) + '/s)');
    }
    if (sk.self && sk.self.lifesteal) {
      const dur = sk.self.lifestealDur || cd;
      const uptime = Math.min(dur, cd) / cd;
      const perSec = 9 * sk.self.lifesteal;
      avg += perSec * uptime; peak += perSec;
      parts.push(sk.key + ' 吸血' + Math.round(sk.self.lifesteal * 100) + '%(' + (perSec * uptime).toFixed(1) + '/s，' +
        (sk.self.lifestealDur ? '持续' + sk.self.lifestealDur + 's' : '永久') + ')');
    }
  }
  if (ch.tags && ch.tags.system === '和声') {
    avg += 9 * win.SYSTEM_BOND.lifesteal;
    peak += 9 * win.SYSTEM_BOND.lifesteal;
    parts.push('和声共鸣吸血7%(' + (9 * win.SYSTEM_BOND.lifesteal).toFixed(1) + '/s)');
  }
  return { avg, peak, parts };
}

// 同一施法者的“同类领域”只保留最新的一个（game.js spawnField 的去重规则），
// 因此同 kind 的两个回血领域不能叠加，静态估算里要按较大的那个算。
function sameKindNote(ch) {
  const kinds = {};
  for (const sk of ch.skills) {
    if (!sk.field) continue;
    const k = sk.field.kind;
    const perSec = sk.field.heal ? sk.field.heal * 60 / (sk.field.tickEvery || 30) : 0;
    if (!perSec) continue;
    kinds[k] = (kinds[k] || 0) + 1;
  }
  for (const k in kinds) {
    if (kinds[k] >= 2) return '（两个 ' + k + ' 类领域互相顶替，实际只有一个生效，平均取较大者）';
  }
  return '';
}

const rows = win.COMPOSERS.map(ch => ({ ch, ...healProfile(ch) }))
  .filter(r => r.avg > 0)
  .sort((a, b) => b.avg - a.avg);

console.log('== 1. 全体角色的回血能力（点/秒，参考挨打速度 ' + REF_DPS + '）==');
console.log('  角色            平均/秒  峰值/秒  来源');
for (const r of rows) {
  console.log('  ' + r.ch.name.padEnd(13, '　') + r.avg.toFixed(2).padStart(6) + r.peak.toFixed(1).padStart(8) +
    '   ' + r.parts.join('；') + sameKindNote(r.ch));
}
const over = rows.filter(r => r.avg > AVG_CAP);
const overPeak = rows.filter(r => r.peak > PEAK_CAP);
console.log('  平均回血最高 = ' + rows[0].ch.name + ' ' + rows[0].avg.toFixed(2) + '/s（上限 ' + AVG_CAP + '）');
console.log('  峰值回血最高 = ' + rows.slice().sort((a, b) => b.peak - a.peak)[0].ch.name + ' ' +
  rows.slice().sort((a, b) => b.peak - a.peak)[0].peak.toFixed(1) + '/s（上限 ' + PEAK_CAP + '）');
ck(over.length === 0, '没有角色能长期保持 > ' + AVG_CAP + ' 点/秒 的回血' +
  (over.length ? '（' + over.map(r => r.ch.name + ' ' + r.avg.toFixed(1)).join('、') + '）' : ''));
ck(overPeak.length === 0, '没有角色的峰值回血 > ' + PEAK_CAP + ' 点/秒' +
  (overPeak.length ? '（' + overPeak.map(r => r.ch.name + ' ' + r.peak.toFixed(1)).join('、') + '）' : ''));

// ---------- 2. 护盾与持续减伤 ----------
console.log('\n== 2. 护盾速率与持续减伤 ==');
let shieldWorst = { v: 0, n: '-' }, armorWorst = { v: 0, n: '-' };
const shieldRows = [], armorRows = [];
for (const ch of win.COMPOSERS) {
  let sRate = 0, aMit = 0;
  for (const sk of ch.skills) {
    const cd = Math.max(1, sk.cd || 1);
    if (sk.self && sk.self.shield) sRate += sk.self.shield / cd;
    if (sk.self && sk.self.armor) {
      aMit += sk.self.armor.power * Math.min(sk.self.armor.dur, cd) / cd;
    }
    if (sk.field && sk.field.armor) {
      aMit += sk.field.armor * Math.min(sk.field.dur || 0, cd) / cd;
    }
  }
  if (sRate > 0) shieldRows.push({ n: ch.name, v: sRate });
  if (aMit > 0) armorRows.push({ n: ch.name, v: aMit });
  if (sRate > shieldWorst.v) shieldWorst = { v: sRate, n: ch.name };
  if (aMit > armorWorst.v) armorWorst = { v: aMit, n: ch.name };
}
shieldRows.sort((a, b) => b.v - a.v);
armorRows.sort((a, b) => b.v - a.v);
console.log('  护盾生成速率（护盾/冷却）：' + (shieldRows.map(r => r.n + ' ' + r.v.toFixed(2) + '/s').join('，') || '无'));
console.log('  持续减伤平均幅度：' + (armorRows.map(r => r.n + ' ' + (r.v * 100).toFixed(1) + '%').join('，') || '无'));
ck(shieldWorst.v <= SHIELD_CAP, '没有角色的护盾生成速率 > ' + SHIELD_CAP + '/s（最高 ' + shieldWorst.n + ' ' + shieldWorst.v.toFixed(2) + '/s）');
ck(armorWorst.v <= ARMOR_CAP, '没有角色的持续减伤平均幅度 > ' + (ARMOR_CAP * 100) + '%（最高 ' + armorWorst.n +
  ' ' + (armorWorst.v * 100).toFixed(1) + '%）');
// 吸血必须有限时，且冷却长于持续时间（否则等于永久吸血）
let lsBad = [];
for (const ch of win.COMPOSERS) {
  for (const sk of ch.skills) {
    if (sk.self && sk.self.lifesteal && !sk.self.lifestealDur) lsBad.push(ch.name + ' ' + sk.key + '（无持续时间）');
    if (sk.self && sk.self.lifestealDur && sk.self.lifestealDur >= sk.cd) lsBad.push(ch.name + ' ' + sk.key + '（持续 ≥ 冷却）');
  }
}
ck(lsBad.length === 0, '所有吸血技能都有持续时间且冷却长于持续时间' + (lsBad.length ? '：' + lsBad.join('、') : ''));
// 机制层面也确认一次：吸血到期后必须真的失效
{
  const g = new GC(canvas);
  const sc = win.COMPOSERS.find(x => x.id === 'scriabin');
  g.selSlots = [sc.index, (sc.index + 7) % 50, (sc.index + 13) % 50];
  g.startMatch(); g.nextRound(); g.phase = 'play';
  const me = g.left, foe = g.right;
  me.c = sc; me.maxHp = sc.maxHp; me.hp = me.maxHp;
  [me, foe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; });
  g.useSkill(me, foe, 1);                        // W 狂喜之诗
  const dur = sc.skills[1].self.lifestealDur * 60;
  console.log('  斯克里亚宾 W 施放后：吸血 ' + Math.round(me.lifesteal * 100) + '%，剩余 ' +
    Math.round(me.lifestealT / 60) + ' 秒（期望 ' + (dur / 60) + ' 秒）');
  ck(me.lifesteal > 0 && me.lifestealT === dur, '吸血技能带上了持续时间');
  for (let i = 0; i < dur; i++) g.stepFighter(me, foe);
  ck(me.lifesteal === 0 && me.lifestealT < 0, '持续时间结束后吸血自动失效');
  // 和声共鸣的 7% 吸血不受技能吸血到期影响
  me.bondSystem = '和声';
  foe.hp = 100000; foe.maxHp = 100000; me.hp = 100; me.maxHp = 1000;
  g.phase = 'play';
  const before = me.hp;
  g.hitTarget(me, foe, { damage: 40, stun: 1, knock: 0, basic: true, pierce: true }, null);
  console.log('  技能吸血到期后，和声共鸣吸血仍然生效：+' + (me.hp - before));
  ck(me.hp > before, '和声共鸣的吸血与技能吸血互不影响');
}

// ---------- 3. 固定压力实跑 ----------
console.log('\n== 3. 固定压力实跑（' + REF_DPS + ' 点/秒 挨打，20 秒，技能一好就放）==');
const SECONDS = 20;
function pressureRun(ch) {
  const g = new GC(canvas);
  g.selSlots = [ch.index, (ch.index + 7) % 50, (ch.index + 13) % 50];
  g.startMatch();
  g.nextRound();
  g.phase = 'play';
  const me = g.left, foe = g.right;
  foe.c = BY.bach; foe.maxHp = foe.hp = 100000;
  [me, foe].forEach(x => { x.bondEra = null; x.bondRegion = null; x.bondSystem = null; x.bondTimer = 1e9; });
  if (ch.tags.system === '和声') me.bondSystem = '和声';    // 和声共鸣在实战里必然存在
  me.hp = me.maxHp = 100000;
  me.x = 300; foe.x = 450;                                  // 近身缠斗：领域也会罩住自己
  const perTick = REF_DPS / (60 / 30);
  let attempted = 0, hpLost = 0, healed = 0, lastHp = me.hp;
  const casts = [0, 0, 0];
  for (let f = 0; f < SECONDS * 60; f++) {
    g.t++;
    me.x = 300; foe.x = 450;                                // 固定距离，排除击退位移的干扰
    if (f % 12 === 0) {                                     // 最贪婪：三个技能冷却一好就全放
      for (let s = 0; s < 3; s++) {
        if (me.cd[s] <= 0) { g.useSkill(me, foe, s); casts[s]++; }
      }
    }
    if (f % 30 === 0) {
      attempted += perTick;
      g.hitTarget(foe, me, { damage: perTick, stun: 1, knock: 0, pierce: true }, null);
    }
    g.stepFighter(me, foe);
    // 领域 / 投射物 / 乐章 / 虚影都要推进，否则领域回血根本不会触发
    g.stepFields();
    g.stepProjectiles();
    g.stepMovements();
    g.stepEchoes();
    if (me.hp > lastHp) healed += me.hp - lastHp;
    lastHp = me.hp;
    me.stun = 0; me.dead = false; me.state = me.state === 'ko' ? 'idle' : me.state;
    foe.hp = 100000;
  }
  hpLost = attempted - healed;                              // 挨打 - 回血 = 真实掉血（护盾/减伤体现在其中）
  return { attempted, healed, hpLost, casts, ratio: hpLost / attempted };
}

const runs = win.COMPOSERS.map(ch => ({ ch, ...pressureRun(ch) }))
  .sort((a, b) => a.ratio - b.ratio);
console.log('  最能扛的前 6 名：');
for (const r of runs.slice(0, 6)) {
  console.log('    ' + r.ch.name.padEnd(13, '　') + ' 挨打 ' + r.attempted.toFixed(0) +
    '　回血 ' + r.healed.toFixed(0) + '　实际掉血 ' + r.hpLost.toFixed(0) +
    '（保留 ' + (r.ratio * 100).toFixed(0) + '%）　释放 [Q' + r.casts[0] + ' W' + r.casts[1] + ' E' + r.casts[2] + ']');
}
// 30 秒内每个技能的可用次数（用于判断“放不出来”还是“放了但没用”）
for (const name of ['沃恩·威廉斯', '德沃夏克', '维瓦尔第', 'J.海顿']) {
  const r = runs.find(x => x.ch.name === name);
  if (r) console.log('    ' + name.padEnd(13, '　') + ' 挨打 ' + r.attempted.toFixed(0) + '　回血 ' +
    r.healed.toFixed(0) + '（保留 ' + (r.ratio * 100).toFixed(0) + '%）　释放 [Q' + r.casts[0] + ' W' + r.casts[1] + ' E' + r.casts[2] + ']');
}
console.log('  最脆的前 3 名：' + runs.slice(-3).map(r => r.ch.name + ' ' + (r.ratio * 100).toFixed(0) + '%').join('，'));
const unkillable = runs.filter(r => r.hpLost <= 0);
ck(unkillable.length === 0, '没有任何角色能在持续挨打时把血回满' +
  (unkillable.length ? '（' + unkillable.map(r => r.ch.name).join('、') + '）' : ''));
const tooTanky = runs.filter(r => r.ratio < 0.5);
ck(tooTanky.length === 0, '所有角色在持续挨打时至少掉 50% 的伤害量' +
  (tooTanky.length ? '（' + tooTanky.map(r => r.ch.name + ' ' + (r.ratio * 100).toFixed(0) + '%').join('、') + '）' : ''));
console.log('  最能扛的 ' + runs[0].ch.name + ' 保留 ' + (runs[0].ratio * 100).toFixed(0) + '% 的伤害量');

console.log('\n' + (fail ? '❌ 共 ' + fail + ' 项未通过' : '✅ 续航数值体检通过'));
process.exitCode = fail ? 1 : 0;

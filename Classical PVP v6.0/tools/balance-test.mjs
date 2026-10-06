/* ============================================================
   tools/balance-test.mjs — 对局节奏与角色数值平衡测量（v5.1 起，v6.0 扩到 100 人）
   用法:
     node balance-test.mjs                 # 节奏 + 强度矩阵（默认规模）
     node balance-test.mjs pace            # 只测节奏（镜像对局 + 3v3 整场）
     node balance-test.mjs matrix [n]      # 强度矩阵（每人对 n 位固定对手）
     node balance-test.mjs all [n]
   环境变量:
     BT_SEED   随机种子（默认 20260501），保证结果可复现
     BT_CAP    单回合帧数上限（默认 3600 = 60 秒，与 ROUND_TIME 一致）
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
const ctx = vm.createContext({
  window: win, console, Math, Object, Array, JSON, String, Number, Boolean,
  isNaN, parseInt, parseFloat, RegExp, Date
});
vm.runInContext(read('../js/characters.js'), ctx, { filename: 'characters.js' });
vm.runInContext(read('../js/ai.js'), ctx, { filename: 'ai.js' });
vm.runInContext(read('../js/game.js'), ctx, { filename: 'game.js' });

const GC = win.GameClass, BY = win.COMPOSER_BY_ID, C = win.COMPOSERS;
const CONST = win.GAME_CONST;
const CAP = parseInt(process.env.BT_CAP || '3600', 10);

// ---------- 可复现随机数（覆盖 Math.random，让测量结果稳定可比） ----------
let seed = parseInt(process.env.BT_SEED || '20260501', 10) >>> 0;
const realRandom = Math.random;
function srnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
Math.random = srnd;
function reseed(v) { seed = (v >>> 0) || 1; Math.random = srnd; }

const S = { rounds: [], duels: 0 };

/** 皮尔逊相关系数 */
function corr(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxy / Math.sqrt(sxx * syy);
}

/** 建一局"直接开打"的对局骨架 */
function arena() {
  const g = new GC(canvas);
  g.state = 'fight';
  g.phase = 'play';
  g.phaseT = 999;          // 跳过开场倒计时
  g.playT = 0;
  g.roundTime = CAP;
  g.projectiles = []; g.fields = []; g.echoes = []; g.movements = []; g.canonQueue = [];
  g.left = null; g.right = null;
  g.readPlayerInput = noop;     // 左侧由第二个 AIController 接管
  g.fx.clear();
  return g;
}

/**
 * 单挑：双方都由 AI 驱动，返回本回合的量化数据
 * bondsA / bondsB：传入 3 人队伍 id 数组则计算羁绊共鸣（默认无羁绊）
 */
function duel(idA, idB, opts) {
  opts = opts || {};
  const g = arena();
  const L = new win.FighterClass(BY[idA], 'left', 0);
  const R = new win.FighterClass(BY[idB], 'right', 0);
  g.left = L; g.right = R;
  if (opts.teamA) g.applyBonds([L, ...opts.teamA.map((id, i) => new win.FighterClass(BY[id], 'left', i + 1))]);
  if (opts.teamB) g.applyBonds([R, ...opts.teamB.map((id, i) => new win.FighterClass(BY[id], 'right', i + 1))]);
  L.hp = L.maxHp; R.hp = R.maxHp;

  const aiL = new win.AIController(g), aiR = new win.AIController(g);
  aiL.reset(L); aiR.reset(R);
  g.ai = aiR;                                   // 右侧由 updateFight 内部驱动
  L.cd[2] = R.cd[2] = CONST.ULT_OPENING_CD;     // 与正式对局一致：开局 6 秒禁大招

  let dmgL = 0, dmgR = 0;
  let maxHitL = 0, maxHitR = 0;
  const bk = () => ({ basic: 0, skill: 0, field: 0, canon: 0 });
  const bl = bk(), br = bk();
  const realHit = g.hitTarget.bind(g);
  g.hitTarget = function (attacker, victim, hit, status) {
    const before = victim ? victim.hp : 0;
    const r = realHit(attacker, victim, hit, status);
    if (victim && victim.hp < before) {
      const d = before - victim.hp;
      const t = attacker === L ? bl : br;
      if (hit && hit.basic) t.basic += d; else t.skill += d;
      if (attacker === L) maxHitL = Math.max(maxHitL, d); else maxHitR = Math.max(maxHitR, d);
    }
    return r;
  };
  const realField = g.fieldDamage.bind(g);
  g.fieldDamage = function (attacker, victim, amount, fd) {
    const before = victim ? victim.hp : 0;
    const r = realField(attacker, victim, amount, fd);
    if (victim && victim.hp < before) {
      const d = before - victim.hp;
      // fd.scaled 表示这是卡农的"模仿声部"重奏（走的是同一个伤害入口）
      (attacker === L ? bl : br)[fd && fd.scaled ? 'canon' : 'field'] += d;
      if (attacker === L) maxHitL = Math.max(maxHitL, d); else maxHitR = Math.max(maxHitR, d);
    }
    return r;
  };
  let f = 0;
  while (f < CAP && g.phase === 'play') {
    const hL = L.hp, hR = R.hp;
    aiL.update(L, R);
    g.t++;                       // 与 Game.prototype.update 一致：AI 的开局保护与卡农重奏都依赖它
    g.updateFight();
    if (L.hp < hL) dmgR += hL - L.hp;
    if (R.hp < hR) dmgL += hR - R.hp;
    f++;
  }
  const ko = g.phase === 'ko';
  S.duels++;
  return {
    a: idA, b: idB, frames: f, kaput: ko,
    winner: ko ? (g.loserSide === 'left' ? idB : idA) : null,
    timeout: !ko,
    hpA: Math.max(0, L.hp), hpB: Math.max(0, R.hp),
    maxA: L.maxHp, maxB: R.maxHp,
    dmgA: dmgL, dmgB: dmgR,
    maxHitA: maxHitL, maxHitB: maxHitR,
    buckA: bl, buckB: br,
    dpsA: dmgL / (f / 60), dpsB: dmgR / (f / 60)
  };
}

/** 完整 3v3 对局（含羁绊、换人、回合间隙），返回整场节奏 */
function match3v3(teamA, teamB) {
  const g = new GC(canvas);
  g.playerTeam = teamA.map((id, i) => new win.FighterClass(BY[id], 'left', i));
  g.enemyTeam = teamB.map((id, i) => new win.FighterClass(BY[id], 'right', i));
  g.playerBonds = g.applyBonds(g.playerTeam);
  g.enemyBonds = g.applyBonds(g.enemyTeam);
  g.state = 'fight';
  g.fx.clear();

  const aiL = new win.AIController(g);
  g.readPlayerInput = noop;

  const roundFrames = [];
  const koOrder = [];
  let guard = 0;
  while (g.state !== 'result' && guard++ < 40) {
    // ---- 进入下一回合 ----
    g.nextRound();
    g.phase = 'play';              // 跳过开场倒计时（只测真实交战时长）
    g.phaseT = 999; g.playT = 0;
    g.left.cd[2] = g.right.cd[2] = CONST.ULT_OPENING_CD;
    aiL.reset(g.left);
    let f = 0;
    while (f < CAP && g.phase === 'play') {
      aiL.update(g.left, g.right);
      g.t++;
      g.updateFight();
      f++;
    }
    roundFrames.push(f);
    koOrder.push(g.left.hp > 0 ? g.left.c.id : g.right.c.id);
    // 回合间隙：直接推进到 afterKo 完成换人
    g.phase = 'ko'; g.koTimer = 999;
    g.updateFight();
    if (g.state === 'roundover') { g.t = 999; g.updateRoundOver(); }
  }
  const total = roundFrames.reduce((a, b) => a + b, 0);
  return {
    a: teamA.join('/'), b: teamB.join('/'),
    rounds: roundFrames, roundSec: roundFrames.map(x => +(x / 60).toFixed(1)),
    totalFrames: total, totalSec: +(total / 60).toFixed(1),
    winner: g.winSide || null, koOrder,
    timeouts: roundFrames.filter(x => x >= CAP).length
  };
}

// =========================================================
//  1. 节奏测量
// =========================================================
function paceReport() {
  console.log('== 1. 对局节奏：同角色镜像单挑（无羁绊，纯 DPS vs HP）==');
  console.log('   上限 ' + CAP + ' 帧 = ' + (CAP / 60) + ' 秒（与 ROUND_TIME 一致）');
  const rows = [];
  for (const c of C) {
    reseed(0x51a0 + c.id.length * 7);
    const r = duel(c.id, c.id);
    rows.push(r);
  }
  const fr = rows.map(r => r.frames);
  const avg = fr.reduce((a, b) => a + b, 0) / fr.length;
  const to = rows.filter(r => r.timeout).length;
  const srt = fr.slice().sort((a, b) => a - b);
  console.log('   场均击杀耗时  avg=' + (avg / 60).toFixed(1) + 's  ' +
    'min=' + (srt[0] / 60).toFixed(1) + 's  p25=' + (srt[Math.floor(srt.length * 0.25)] / 60).toFixed(1) + 's  ' +
    '中位=' + (srt[Math.floor(srt.length / 2)] / 60).toFixed(1) + 's  max=' + (srt[srt.length - 1] / 60).toFixed(1) + 's');
  console.log('   超时未分出胜负 = ' + to + ' / ' + rows.length);

  // 最快 / 最慢
  const bySpeed = rows.slice().sort((a, b) => a.frames - b.frames);
  console.log('   最快结束: ' + bySpeed.slice(0, 5).map(r => r.a + ' ' + (r.frames / 60).toFixed(1) + 's').join('  '));
  console.log('   最慢结束: ' + bySpeed.slice(-5).map(r => r.a + ' ' + (r.frames / 60).toFixed(1) + 's').join('  '));

  // 平均承受 DPS（用于回血数值标定）
  const dps = rows.map(r => r.dpsA).filter(v => isFinite(v) && v > 0);
  const avgDps = dps.reduce((a, b) => a + b, 0) / dps.length;
  console.log('   平均输出 DPS = ' + avgDps.toFixed(2) + ' 点/秒（受方视角承受 DPS）');
  console.log('   期望击杀耗时 = 平均HP ' + (C.reduce((a, c) => a + c.stats.hp, 0) / C.length).toFixed(1) +
    ' / ' + avgDps.toFixed(2) + ' = ' + ((C.reduce((a, c) => a + c.stats.hp, 0) / C.length) / avgDps).toFixed(1) + 's');
  return { avgFrames: avg, timeouts: to, avgDps, rows };
}

function pace3v3() {
  console.log('\n== 2. 对局节奏：完整 3v3 整场（含羁绊与换人）==');
  // 用固定抽样的队伍组合，覆盖 7 套体系
  const TEAMS = [
    ['beethoven', 'brahms', 'mahler'], ['mozart', 'haydn', 'hummel'], ['bach', 'handel', 'vivaldi'],
    ['webern', 'berg', 'messiaen'], ['telemann', 'tallis', 'perotin'],
    ['chopin', 'liszt', 'rachmaninoff'], ['debussy', 'ravel', 'satie'], ['tchaikovsky', 'rimsky', 'glinka'],
    ['prokofiev', 'shostakovich', 'khachaturian'], ['gershwin', 'joplin', 'kapustin'],
    ['corelli', 'pachelbel', 'bruch'], ['czerny', 'arensky', 'rubinstein']
  ];
  const out = [];
  for (let i = 0; i < TEAMS.length; i++) {
    reseed(0x7e00 + i * 131);
    const r = match3v3(TEAMS[i], TEAMS[(i + 5) % TEAMS.length]);
    out.push(r);
    console.log('   ' + r.a.padEnd(30) + ' vs ' + r.b.padEnd(30) +
      ' 回合=' + r.rounds.length + ' 每回合=' + r.roundSec.join('/') + 's 整场=' + r.totalSec + 's' +
      (r.timeouts ? ' ⚠超时' + r.timeouts : ''));
  }
  const avgTotal = out.reduce((a, b) => a + b.totalSec, 0) / out.length;
  const avgRound = out.reduce((a, b) => a + b.rounds.length, 0) / out.length;
  console.log('   → 平均整场 ' + avgTotal.toFixed(1) + 's，平均 ' + avgRound.toFixed(1) + ' 回合');
  return { avgTotal, avgRound, out };
}

// =========================================================
//  2. 角色强度矩阵
// =========================================================
function matrixReport(oppN) {
  console.log('\n== 3. 角色强度矩阵（每人 vs ' + oppN + ' 位固定对手）==');
  // 固定对手：按 HP 从低到高均匀抽取，代表不同属性档位
  const sorted = C.slice().sort((a, b) => a.stats.hp - b.stats.hp);
  const opps = [];
  for (let i = 0; i < oppN; i++) opps.push(sorted[Math.floor(i * sorted.length / oppN)].id);
  console.log('   对手池: ' + opps.map(id => BY[id].name).join(' '));

  const stat = {};
  for (const c of C) stat[c.id] = { win: 0, n: 0, frames: 0, dmg: 0, took: 0, kt: 0, winFrames: 0, winN: 0, burst: 0, b: { basic: 0, skill: 0, field: 0, canon: 0 } };
  const CIDX = new Map(C.map((c, i) => [c.id, i]));
  for (const c of C) {
    for (const o of opps) {
      // 每个对手打两局：自己站左侧 / 自己站右侧，消除先后手偏差
      for (const seat of [0, 1]) {
        const x = seat === 0 ? c.id : o, y = seat === 0 ? o : c.id;
        reseed(0x9e00 + CIDX.get(c.id) * 131 + CIDX.get(o) * 7919 + seat * 104729);
        const r = duel(x, y);
        const t = stat[c.id];
        const b = seat === 0 ? r.buckA : r.buckB;
        t.n++;
        if (r.winner === c.id) { t.win++; t.winFrames += r.frames; t.winN++; }
        t.frames += r.frames;
        t.dmg += (seat === 0 ? r.dmgA : r.dmgB);
        t.took += (seat === 0 ? r.dmgB : r.dmgA);
        t.burst = Math.max(t.burst, seat === 0 ? r.maxHitA : r.maxHitB);
        t.b.basic += b.basic; t.b.skill += b.skill; t.b.field += b.field; t.b.canon += b.canon;
        if (r.timeout) t.kt++;
      }
    }
  }
  const rows = C.map(c => {
    const t = stat[c.id];
    return {
      id: c.id, name: c.name, hp: c.stats.hp, power: c.stats.power, speed: c.stats.speed,
      wr: t.win / t.n, n: t.n, avgFrames: t.frames / t.n,
      dps: t.dmg / (t.frames / 60), taken: t.took / (t.frames / 60), kt: t.kt, burst: t.burst,
      basic: t.b.basic / t.n / (t.frames / t.n / 60),
      skill: t.b.skill / t.n / (t.frames / t.n / 60),
      field: t.b.field / t.n / (t.frames / t.n / 60),
      canon: t.b.canon / t.n / (t.frames / t.n / 60),
      winSec: t.winN ? t.winFrames / t.winN / 60 : null
    };
  }).sort((a, b) => b.wr - a.wr);

  const avgWr = rows.reduce((a, b) => a + b.wr, 0) / rows.length;
  const sd = Math.sqrt(rows.reduce((a, b) => a + (b.wr - avgWr) ** 2, 0) / rows.length);
  console.log('   全体平均胜率 = ' + (avgWr * 100).toFixed(1) + '%（理想 50%）  标准差 = ' + (sd * 100).toFixed(1) + ' 个百分点');
  const show = (r) => '     ' + r.name.padEnd(14) + ' 胜率' + (r.wr * 100).toFixed(0).padStart(3) + '%' +
    '  HP' + String(r.hp).padStart(3) + ' 力' + String(r.power).padStart(2) + ' 速' + String(r.speed).padStart(2) +
    '  输出' + r.dps.toFixed(1) + '(拳' + r.basic.toFixed(1) + '/技' + r.skill.toFixed(1) + '/场' + r.field.toFixed(1) + '/卡' + r.canon.toFixed(1) + ')' +
    '  承受' + r.taken.toFixed(1) + ' 击' + String(r.burst).padStart(3) +
    ' 均时' + (r.avgFrames / 60).toFixed(1) + 's';
  console.log('\n   —— 最强 10 ——');
  for (const r of rows.slice(0, 10)) console.log(show(r));
  console.log('   —— 最弱 10 ——');
  for (const r of rows.slice(-10)) console.log(show(r));

  // 极值告警
  const warn = rows.filter(r => r.wr >= 0.72 || r.wr <= 0.28);
  console.log('\n   胜率极值（≥72% 或 ≤28%）共 ' + warn.length + ' 人: ' + (warn.length ? warn.map(r => r.name + ' ' + (r.wr * 100).toFixed(0) + '%').join('  ') : '无'));
  const dpsS = rows.slice().sort((a, b) => b.dps - a.dps);
  console.log('   输出 DPS 最高: ' + dpsS.slice(0, 6).map(r => r.name + ' ' + r.dps.toFixed(1)).join('  '));
  console.log('   输出 DPS 最低: ' + dpsS.slice(-6).map(r => r.name + ' ' + r.dps.toFixed(1)).join('  '));
  const burstS = rows.slice().sort((a, b) => b.burst - a.burst);
  console.log('   最大单击最高: ' + burstS.slice(0, 6).map(r => r.name + ' ' + r.burst).join('  '));
  const avgDpsAll = rows.reduce((a, b) => a + b.dps, 0) / rows.length;
  console.log('   全体平均输出 DPS = ' + avgDpsAll.toFixed(2) + '/s  （最高/最低 = ' +
    (dpsS[0].dps / dpsS[dpsS.length - 1].dps).toFixed(2) + ' 倍）');
  const bkSum = rows.reduce((a, r) => ({ basic: a.basic + r.basic, skill: a.skill + r.skill, field: a.field + r.field, canon: a.canon + r.canon }), { basic: 0, skill: 0, field: 0, canon: 0 });
  const bkTot = bkSum.basic + bkSum.skill + bkSum.field + bkSum.canon;
  console.log('   伤害来源结构: 拳脚 ' + (bkSum.basic / bkTot * 100).toFixed(1) + '%  技能直击 ' +
    (bkSum.skill / bkTot * 100).toFixed(1) + '%  领域 ' + (bkSum.field / bkTot * 100).toFixed(1) +
    '%  卡农重奏 ' + (bkSum.canon / bkTot * 100).toFixed(1) + '%');
  const fieldShare = rows.map(r => ({ n: r.name, s: r.field / Math.max(0.01, r.dps), d: r.field, wr: r.wr }))
    .filter(x => x.s > 0.35).sort((a, b) => b.s - a.s);
  console.log('   领域伤害占比 >35% 的角色（' + fieldShare.length + ' 人）: ' +
    fieldShare.map(x => x.n + ' ' + (x.s * 100).toFixed(0) + '%').join('  '));
  console.log('   胜率与输出 DPS 相关系数 = ' + corr(rows.map(r => r.dps), rows.map(r => r.wr)).toFixed(3));
  console.log('\n   —— 完整胜率表（降序）——');
  for (let i = 0; i < rows.length; i += 3) {
    console.log('     ' + rows.slice(i, i + 3).map(r => (r.name + ' ' + (r.wr * 100).toFixed(0) + '%').padEnd(22)).join(''));
  }
  return { rows, avgWr, sd, avgDpsAll, warn };
}

// =========================================================
const mode = process.argv[2] || 'all';
const oppN = parseInt(process.argv[3] || '8', 10);
const result = { version: win.GAME_CONST.VERSION, mode, cap: CAP, seed: process.env.BT_SEED || '20260501' };
console.log('平衡测量  ' + result.version + '  角色数=' + C.length + '  种子=' + result.seed + '\n');
if (mode === 'pace' || mode === 'all') { result.pace = paceReport(); result.pace3v3 = pace3v3(); }
if (mode === 'matrix' || mode === 'all') { result.matrix = matrixReport(oppN); }

// 原始数据写到系统临时目录，避免把生成物留在项目里
const outFile = join(tmpdir(), 'ccb-balance.json');
writeFileSync(outFile, JSON.stringify(result, (k, v) => (v === Infinity ? null : v), 1));
console.log('\n原始数据 → ' + outFile + '   对局总数 = ' + S.duels);

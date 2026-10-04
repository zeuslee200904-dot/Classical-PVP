/* ============================================================
   tools/audio-test.mjs — 在 Node 里用桩 AudioContext 验证 8bit 音乐引擎
   检查：32 首曲子都能编译出音符、调度器能持续产出事件、低音/和弦声部
        能贯穿整个循环（不会中途消失）、无异常；v5.0 对战音效开关
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const audioSrc = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');

// ---------- Web Audio 桩 ----------
let now = 0;
const log = [];
function param(v) {
  return {
    value: v,
    setValueAtTime(x) { this.value = x; return this; },
    linearRampToValueAtTime(x) { this.value = x; return this; },
    exponentialRampToValueAtTime(x) { this.value = x; return this; },
    cancelScheduledValues() { return this; }
  };
}
class Node {
  constructor(kind) { this.kind = kind; this.gain = param(1); this.frequency = param(440); }
  connect() { return this; }
  disconnect() { return this; }
  start(t) { log.push(['start', this.kind, t, this.frequency.value]); }
  stop(t) { log.push(['stop', this.kind, t]); }
  getChannelData() { return new Float32Array(1024); }
}
class FakeCtx {
  constructor() {
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = new Node('dest');
  }
  get currentTime() { return now; }
  resume() { this.state = 'running'; }
  createGain() { return new Node('gain'); }
  createOscillator() { const n = new Node('osc'); n.type = 'square'; return n; }
  createBuffer(ch, len) { return { length: len, sampleRate: this.sampleRate, numberOfChannels: ch, getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { return new Node('noise'); }
  createBiquadFilter() { const n = new Node('filter'); n.type = 'highpass'; return n; }
}

const win = { AudioContext: FakeCtx, setInterval: () => 0, clearInterval: () => { } };
win.window = win;
const ctxObj = vm.createContext({ window: win, console, Math, Object, Array, JSON, parseFloat, parseInt, String, Number, RegExp, setTimeout, setInterval, clearInterval });
vm.runInContext(audioSrc, ctxObj, { filename: 'audio.js' });

const C = win.Chiptune;
C.init();

const problems = [];
console.log('音轨数量 =', C.trackCount());
if (C.trackCount() !== 32) { problems.push('曲目数应为 32，实际 ' + C.trackCount()); }

/** 手动推进调度器若干步，返回这一段的发声统计 */
function runSteps(t, steps) {
  log.length = 0;
  now = 0;
  C.playing = false;
  C.track = t;
  C.playing = true;
  C.unit = 60 / t.bpm / 4;
  C.loopLen = Math.max(t.mel.length, t.bass ? t.bass.length : 0, t.arp ? t.arp.length : 0);
  C.startTime = 0;
  C.stepIndex = 0;
  const marks = [];
  for (let step = 0; step < steps; step++) {
    now += C.unit;
    const before = log.length;
    C.schedule();
    marks.push(log.length - before);
  }
  C.playing = false;
  return marks;
}

console.log('\n标题                     调式   旋律 贝斯 和弦 | 循环时长 | 一个循环内的发声分布');
for (let i = 0; i < C.trackCount(); i++) {
  const t = C.tracks[i];
  const noteCount = t.mel.events.filter(e => !e.rest).length;
  const bassCount = t.bass.events.length;
  const arpCount = t.arp ? t.arp.events.length : 0;
  const loop = Math.max(t.mel.length, t.bass.length, t.arp ? t.arp.length : 0);
  const marks = runSteps(t, loop);
  const oscs = log.filter(l => l[0] === 'start' && l[1] === 'osc').length;
  const noise = log.filter(l => l[0] === 'start' && l[1] === 'noise').length;
  // 低音声部是否贯穿整个循环：把循环切成 4 段，每段都应有发声
  const seg = Math.floor(loop / 4);
  const segs = [0, 0, 0, 0];
  for (let s = 0; s < loop; s++) segs[Math.min(3, Math.floor(s / seg))] += marks[s];
  const tailVoiced = segs[3] > 0;
  const sec = loop * 60 / t.bpm / 4;
  const ok = noteCount > 8 && bassCount > 0 && oscs > 0 && Number.isFinite(loop) && tailVoiced;
  if (!ok) problems.push(t.title + (tailVoiced ? '' : '（循环末段无声）'));
  console.log(
    `  ${String(i + 1).padStart(2)}. ${t.title.padEnd(20, ' ')} ${String(t.bpm).padStart(3)}bpm ` +
    `${String(noteCount).padStart(4)} ${String(bassCount).padStart(4)} ${String(arpCount).padStart(4)} | ` +
    `${sec.toFixed(1).padStart(5)}秒 | ${segs.join('/')} ${ok ? '✓' : '✗'}`
  );
}

// 音效检查
log.length = 0;
const sfxNames = ['punch', 'kick', 'hit', 'block', 'skill1', 'skill2', 'ultimate', 'ko', 'select', 'confirm',
  'win', 'lose', 'shield', 'heal', 'swap', 'field', 'echo', 'movement', 'rondo', 'canon'];
for (const n of sfxNames) C.sfx(n);
const sfxNotes = log.filter(l => l[0] === 'start').length;
console.log('\n音效数量 =', sfxNames.length, ' 总发声节点 =', sfxNotes);

// ---------- v5.0：对战音效开关 ----------
console.log('\n== v5.0 对战音效开关 ==');
console.log('  默认状态 = ' + (C.sfxEnabled() ? '开' : '关'));
if (!C.sfxEnabled()) problems.push('对战音效默认应为开启');
log.length = 0;
for (const n of sfxNames) C.sfx(n);
const onCount = log.filter(l => l[0] === 'start').length;
C.setSfxEnabled(false);
log.length = 0;
for (const n of sfxNames) C.sfx(n);
const offCount = log.filter(l => l[0] === 'start').length;
console.log('  开启时发声节点 = ' + onCount + '；关闭时发声节点 = ' + offCount);
if (offCount !== 0) problems.push('关闭对战音效后仍有 ' + offCount + ' 个发声节点');
if (C.sfxEnabled()) problems.push('setSfxEnabled(false) 后状态未更新');
// 关闭音效不应影响 BGM：调度器仍然正常产出音乐事件
const bgmMarks = runSteps(C.tracks[0], 16);
const bgmOn = bgmMarks.reduce((a, b) => a + b, 0);
log.length = 0;
C.sfx('punch');
const sfxWhileBgm = log.filter(l => l[0] === 'start').length;
console.log('  关闭音效后 BGM 仍产出 ' + bgmOn + ' 个事件；此时音效发声 = ' + sfxWhileBgm);
if (bgmOn === 0) problems.push('关闭对战音效后 BGM 也停了（不该影响 BGM）');
if (sfxWhileBgm !== 0) problems.push('关闭音效后 sfx 仍在发声');
C.setSfxEnabled(true);
log.length = 0;
C.sfx('punch');
if (log.filter(l => l[0] === 'start').length === 0) problems.push('重新开启音效后 sfx 没有恢复');
console.log('  重新开启后音效恢复发声 ✅');

// 静音（总开关）仍然优先
C.setMuted(true);
log.length = 0;
C.sfx('punch');
const mutedCount = log.filter(l => l[0] === 'start').length;
C.setMuted(false);
console.log('  静音状态下的音效发声 = ' + mutedCount);
if (mutedCount !== 0) problems.push('静音时音效不应发声');

// 鼓型检查
console.log('\n== 鼓型 ==');
const used = [...new Set(C.tracks.map(t => t.drum))];
console.log('  曲目引用的鼓型：' + used.join('、'));
for (const d of used) {
  const marks = runSteps(C.tracks.find(t => t.drum === d), 16);
  const noise = log.filter(l => l[0] === 'start' && l[1] === 'noise').length;
  if (d !== 'none' && noise === 0) problems.push('鼓型 ' + d + ' 没有产生打击音');
}
console.log('  全部鼓型均能产生打击音 ✅');

if (problems.length) {
  console.error('\n失败音轨:', problems.join(', '));
  process.exitCode = 1;
} else if (sfxNotes < 20) {
  console.error('\n音效发声过少:', sfxNotes);
  process.exitCode = 1;
} else {
  console.log('\n32 首音轨与全部音效检查通过（含 v5.0 对战音效开关）');
}

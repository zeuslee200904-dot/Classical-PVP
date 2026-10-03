/* ============================================================
   audio.js — 8bit 芯片音乐 / 音效引擎
   纯 Web Audio API 手写方波・三角波・噪声，无外部资源
   ============================================================ */
(function (global) {
  'use strict';

  var AC = global.AudioContext || global.webkitAudioContext;

  // ---------- 基础工具 ----------
  function midi(name) {
    // "C4" -> 60 , "F#3" -> 54 , "Bb4" -> 70
    if (typeof name === 'number') return name;
    var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name);
    if (!m) return 60;
    var base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    var v = base[m[1].toUpperCase()];
    if (m[2] === '#') v += 1;
    if (m[2] === 'b') v -= 1;
    return v + (parseInt(m[3], 10) + 1) * 12;
  }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // 音名数组缩写：用于紧凑地书写旋律
  var NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d)$/;

  /**
   * 把紧凑谱子编译成事件表。
   * 谱子元素形式：
   *   "C4:4"        -> 音高 C4，时值 4 个单位（单位 = 1/4 拍 = 十六分音符）
   *   "R:2"         -> 休止 2 个单位
   *   "K:2"         -> 打击乐（噪声），时值 2
   *   ["C4","E4","G4", 4] -> 和弦，4 个单位
   */
  function compile(score) {
    var out = [], t = 0;
    for (var i = 0; i < score.length; i++) {
      var s = score[i], dur, pitch;
      if (Object.prototype.toString.call(s) === '[object Array]') {
        dur = s[s.length - 1];
        pitch = s.slice(0, s.length - 1);
      } else {
        var parts = String(s).split(':');
        pitch = parts[0];
        dur = parts.length > 1 ? parseFloat(parts[1]) : 2;
      }
      out.push({ t: t, d: dur, p: pitch, rest: pitch === 'R' || pitch === 'r' });
      t += dur;
    }
    return { events: out, length: t };
  }

  // ---------- 作曲家主题（8bit 改编）：v4.1 时 24 首，v5.0 扩充至 32 首 ----------
  // 每个主题：name(曲名) / bpm / wave / mel(旋律) / bass(贝斯) / drum(节奏型)
  // 可选：arp(和弦 / 分解和弦第三声部) / strum(和弦琶音间隔) / swing(摇摆量)
  var TRACKS = [];

  /** 一首曲子的循环长度 = 各声部最长的那个 */
  function trackLength(t) {
    var n = t.mel ? t.mel.length : 0;
    if (t.bass && t.bass.length > n) n = t.bass.length;
    if (t.arp && t.arp.length > n) n = t.arp.length;
    return n;
  }

  // 1. 贝多芬《第五交响曲“命运”》
  TRACKS.push({
    id: 'beethoven', title: '第五交响曲「命运」', bpm: 132, wave: 'square', duty: 0.5,
    mel: compile([
      'R:2', 'G4:1', 'G4:1', 'G4:1', 'Eb4:5', 'R:2', 'F4:1', 'F4:1', 'F4:1', 'D4:5',
      'R:2', 'G4:1', 'G4:1', 'G4:1', 'Eb4:5', 'R:2', 'F4:1', 'F4:1', 'F4:1', 'D4:4', 'R:3',
      'G4:3', 'G4:3', 'G4:3', 'Eb4:3', 'R:2', 'F4:3', 'F4:3', 'F4:3', 'D4:3',
      'R:2', 'G4:3', 'G4:3', 'Bb4:3', 'G4:3', 'Eb4:6', 'R:3', 'F4:3', 'F4:3', 'D4:3', 'C4:3', 'D4:8', 'R:4'
    ]),
    bass: compile([
      'C2:8', 'C2:8', 'C2:8', 'C2:8', 'Ab1:8', 'Ab1:8', 'G1:8', 'G1:8'
    ]),
    drum: 'march',
    arp: compile([['C4', 'Eb4', 'G4', 8], ['Ab3', 'C4', 'Eb4', 8], ['G3', 'B3', 'D4', 8], ['C4', 'Eb4', 'G4', 8]])
  });

  // 2. 莫扎特《土耳其进行曲》
  TRACKS.push({
    id: 'mozart', title: '土耳其进行曲', bpm: 126, wave: 'square', duty: 0.25,
    mel: compile([
      'B4:1', 'A4:1', 'G#4:1', 'A4:1', 'C5:2', 'R:2', 'D5:1', 'C5:1', 'B4:1', 'C5:1', 'E5:2', 'R:2',
      'F5:1', 'E5:1', 'D#5:1', 'E5:1', 'B5:2', 'A5:2', 'G#5:2', 'A5:2',
      'B5:1', 'A5:1', 'G#5:1', 'A5:1', 'C6:2', 'R:2', 'D6:1', 'C6:1', 'B5:1', 'C6:1', 'E6:3', 'R:1',
      'E5:1', 'E5:1', 'F5:1', 'G5:1', 'A5:2', 'B5:2', 'C6:2', 'D6:2',
      'E6:2', 'D6:2', 'C6:2', 'B5:2', 'A5:4', 'R:6',
      'A5:2', 'B5:2', 'C6:2', 'D6:2', 'E6:2', 'F6:2', 'E6:2', 'D6:2',
      'C6:2', 'B5:2', 'A5:2', 'G#5:2', 'A5:6', 'R:4'
    ]),
    bass: compile(['A2:4', 'A2:4', 'E2:4', 'E2:4', 'A2:4', 'A2:4', 'D3:4', 'E3:4', 'A2:4', 'A2:4', 'E2:4', 'E2:4']),
    drum: 'turk',
    arp: compile([['A3', 'C#4', 'E4', 4], ['A3', 'C#4', 'E4', 4], ['E3', 'G#3', 'B3', 4], ['E3', 'G#3', 'B3', 4]])
  });

  // 3. 勃拉姆斯《匈牙利舞曲第五号》
  TRACKS.push({
    id: 'brahms', title: '匈牙利舞曲 第五号', bpm: 138, wave: 'square', duty: 0.5,
    mel: compile([
      'F#5:3', 'A5:1', 'F#5:2', 'A5:2', 'F#5:3', 'A5:1', 'F#5:2', 'A5:2',
      'F#5:2', 'G5:2', 'A5:2', 'B5:2', 'A5:4', 'R:2', 'R:6',
      'G5:3', 'B5:1', 'G5:2', 'B5:2', 'G5:3', 'B5:1', 'G5:2', 'B5:2',
      'G5:2', 'A5:2', 'B5:2', 'C#6:2', 'B5:4', 'R:2', 'R:6',
      'A5:3', 'C#6:1', 'A5:2', 'C#6:2', 'D6:2', 'C#6:2', 'B5:2', 'A5:2',
      'G5:2', 'F#5:2', 'E5:2', 'D5:2', 'C#5:4', 'R:4'
    ]),
    bass: compile(['F#2:4', 'C#3:4', 'F#2:4', 'C#3:4', 'G2:4', 'D3:4', 'G2:4', 'D3:4', 'A2:4', 'E3:4', 'A2:4', 'C#3:4']),
    drum: 'dance',
    arp: compile([['F#3', 'A3', 'C#4', 4], ['F#3', 'A3', 'C#4', 4], ['G3', 'B3', 'D4', 4], ['A3', 'C#4', 'E4', 4]])
  });

  // 4. 马勒《第五交响曲 小柔板》
  TRACKS.push({
    id: 'mahler', title: '第五交响曲 小柔板', bpm: 66, wave: 'triangle', duty: 0.5,
    mel: compile([
      'Db5:6', 'C5:2', 'Bb4:4', 'Ab4:4', 'Gb4:8', 'F4:8',
      'Gb4:6', 'Ab4:2', 'Bb4:8', 'Ab4:8',
      'Db5:6', 'C5:2', 'Bb4:4', 'Ab4:4', 'Gb4:8', 'F4:8',
      'Eb4:6', 'F4:2', 'Gb4:8', 'F4:8', 'R:4'
    ]),
    bass: compile(['Db2:8', 'Ab2:8', 'Gb2:8', 'Db2:8', 'Ab2:8', 'Eb2:8']),
    drum: 'hymn',
    arp: compile([['C4', 'Eb4', 'G4', 8], ['Ab3', 'C4', 'Eb4', 8], ['Bb3', 'D4', 'F4', 8], ['C4', 'Eb4', 'G4', 8]])
  });

  // 5. 瓦格纳《女武神的骑行》
  TRACKS.push({
    id: 'wagner', title: '女武神的骑行', bpm: 108, wave: 'saw', duty: 0.5,
    mel: compile([
      'B4:4', 'B4:1', 'B4:1', 'D5:2', 'B4:2', 'F#5:4',
      'B4:4', 'B4:1', 'B4:1', 'D5:2', 'B4:2', 'F#5:4',
      'B4:4', 'B4:1', 'B4:1', 'D5:2', 'B4:2', 'F#5:2', 'E5:2',
      'D5:2', 'B4:2', 'D5:2', 'F#5:2', 'A5:4', 'F#5:4',
      'B5:4', 'A5:2', 'F#5:2', 'D5:2', 'B4:2', 'F#4:4',
      'B4:4', 'D5:4', 'F#5:8'
    ]),
    bass: compile(['B1:4', 'B1:4', 'F#1:4', 'B1:4', 'D2:4', 'B1:4', 'F#1:4', 'B1:4']),
    drum: 'ride',
    arp: compile([['B2', 'D3', 'F#3', 4], ['B2', 'D3', 'F#3', 4], ['E3', 'G3', 'B3', 4], ['F#3', 'A3', 'C#4', 4]])
  });

  // 6. 舒曼《童年情景·梦幻曲》
  TRACKS.push({
    id: 'schumann', title: '梦幻曲', bpm: 76, wave: 'triangle', duty: 0.5,
    mel: compile([
      'F4:3', 'A4:1', 'C5:4', 'A4:4', 'F4:4', 'A4:4',
      'C5:3', 'A4:1', 'F4:4', 'A4:4', 'C5:4', 'A4:4',
      'G4:3', 'Bb4:1', 'D5:4', 'Bb4:4', 'G4:4', 'Bb4:4',
      'D5:3', 'C5:1', 'A4:4', 'F4:4', 'C5:4', 'A4:4',
      'F4:8', 'R:8'
    ]),
    bass: compile(['F2:8', 'C3:8', 'F2:8', 'C3:8', 'G2:8', 'D3:8', 'C3:8', 'F2:8']),
    drum: 'lullaby',
    arp: compile([['F3', 'Ab3', 'C4', 8], ['Db3', 'F3', 'Ab3', 8], ['Eb3', 'G3', 'Bb3', 8], ['F3', 'Ab3', 'C4', 8]])
  });

  // 7. 拉赫玛尼诺夫《第二钢琴协奏曲》
  TRACKS.push({
    id: 'rachmaninoff', title: '第二钢琴协奏曲', bpm: 72, wave: 'triangle', duty: 0.5,
    mel: compile([
      'R:4', 'F4:8', 'C4:4', 'Ab4:8', 'F4:4',
      'C5:10', 'Bb4:2', 'Ab4:4', 'G4:8', 'F4:8',
      'Ab4:4', 'G4:4', 'F4:4', 'Eb4:4', 'Db4:8', 'C4:8',
      'F4:6', 'Eb4:2', 'Db4:8', 'C4:8', 'R:4'
    ]),
    bass: compile(['F1:8', 'C2:8', 'Ab1:8', 'Eb2:8', 'Db2:8', 'C2:8']),
    drum: 'hymn',
    arp: compile([['C3', 'Eb3', 'G3', 8], ['Ab2', 'C3', 'Eb3', 8], ['F2', 'Ab2', 'C3', 8], ['G2', 'B2', 'D3', 8]])
  });

  // 8. 肖斯塔科维奇《第二圆舞曲》
  TRACKS.push({
    id: 'shostakovich', title: '第二圆舞曲', bpm: 168, wave: 'square', duty: 0.25,
    mel: compile([
      'C5:2', 'C5:2', 'C5:2', 'Bb4:1', 'C5:1', 'C5:2', 'G4:4',
      'C5:2', 'C5:2', 'C5:2', 'Bb4:1', 'C5:1', 'C5:2', 'G4:4',
      'Eb5:2', 'Eb5:2', 'Eb5:2', 'D5:1', 'Eb5:1', 'Eb5:2', 'Bb4:4',
      'D5:2', 'C5:2', 'Bb4:2', 'A4:2', 'G4:2', 'F4:2', 'Eb4:2', 'D4:2',
      'C5:2', 'C5:2', 'C5:2', 'D5:1', 'Eb5:1', 'F5:2', 'Eb5:2', 'D5:2', 'C5:2',
      'Bb4:2', 'A4:2', 'G4:2', 'F4:2', 'Eb4:2', 'D4:2', 'C4:6', 'R:2'
    ]),
    bass: compile(['C2:2', 'G2:2', 'C3:2', 'C2:2', 'G2:2', 'C3:2', 'Ab1:2', 'Eb2:2', 'Ab2:2', 'G1:2', 'D2:2', 'G2:2']),
    drum: 'waltz',
    arp: compile([['C3', 'E3', 'G3', 4], ['G2', 'B2', 'D3', 4], ['A2', 'C3', 'E3', 4], ['E2', 'G#2', 'B2', 4]])
  });

  // 9. 勋伯格《升华之夜》
  TRACKS.push({
    id: 'schoenberg', title: '升华之夜', bpm: 84, wave: 'saw', duty: 0.5,
    mel: compile([
      'D4:2', 'F4:2', 'A4:2', 'C5:2', 'E5:4', 'D5:4',
      'C#5:2', 'E5:2', 'G5:2', 'Bb5:2', 'A5:4', 'G5:4',
      'F5:2', 'E5:2', 'D5:2', 'C#5:2', 'D5:6', 'R:2',
      'Bb4:2', 'A4:2', 'G4:2', 'F#4:2', 'G4:6', 'R:2',
      'D4:2', 'E4:2', 'F4:2', 'G4:2', 'A4:8', 'R:4'
    ]),
    bass: compile(['D2:8', 'A2:8', 'Bb1:8', 'F2:8', 'G1:8', 'D2:8']),
    drum: 'lullaby',
    arp: compile([['C3', 'E3', 'G#3', 8], ['C3', 'F3', 'A3', 8], ['B2', 'D3', 'F3', 8], ['C3', 'E3', 'G#3', 8]])
  });

  // 10. 西贝柳斯《芬兰颂》
  TRACKS.push({
    id: 'sibelius', title: '芬兰颂', bpm: 84, wave: 'square', duty: 0.5,
    mel: compile([
      'Ab4:2', 'Ab4:2', 'Ab4:4', 'Bb4:4', 'C5:8',
      'C5:2', 'C5:2', 'C5:4', 'Db5:4', 'Eb5:8',
      'Eb5:2', 'Eb5:2', 'Eb5:4', 'F5:4', 'Gb5:4', 'F5:4',
      'Eb5:4', 'Db5:4', 'C5:4', 'Bb4:4', 'Ab4:8',
      'C5:4', 'Db5:4', 'Eb5:8', 'Db5:4', 'C5:4', 'Bb4:8', 'Ab4:8'
    ]),
    bass: compile(['Ab1:8', 'Eb2:8', 'Ab1:8', 'Db2:8', 'Eb2:8', 'Ab1:8']),
    drum: 'hymn',
    arp: compile([['Ab2', 'C3', 'Eb3', 8], ['Db3', 'F3', 'Ab3', 8], ['Eb3', 'G3', 'Bb3', 8], ['Ab2', 'C3', 'Eb3', 8]])
  });

  // 11. 斯克里亚宾《练习曲 作品8之12》
  TRACKS.push({
    id: 'scriabin', title: '练习曲 作品8之12', bpm: 144, wave: 'square', duty: 0.5,
    mel: compile([
      'D#5:1', 'D#5:1', 'D#5:1', 'D#5:1', 'C#5:1', 'D#5:1', 'C#5:1', 'B4:1',
      'A#4:1', 'B4:1', 'C#5:1', 'D#5:1', 'F#5:2', 'F5:2',
      'D#5:1', 'D#5:1', 'D#5:1', 'D#5:1', 'C#5:1', 'D#5:1', 'C#5:1', 'B4:1',
      'A#4:1', 'B4:1', 'C#5:1', 'D#5:1', 'F#5:4',
      'G#5:2', 'F#5:2', 'F5:2', 'D#5:2', 'C#5:2', 'B4:2', 'A#4:2', 'G#4:2',
      'F#4:2', 'G#4:2', 'A#4:2', 'B4:2', 'C#5:4', 'D#5:4'
    ]),
    bass: compile(['D#2:4', 'A#2:4', 'D#2:4', 'A#2:4', 'B1:4', 'F#2:4', 'A#1:4', 'F2:4']),
    drum: 'storm',
    arp: compile([['D3', 'F3', 'A3', 4], ['D3', 'F3', 'A3', 4], ['Bb2', 'D3', 'F3', 4], ['C3', 'E3', 'G3', 4]])
  });

  // 12. 李斯特《钟》
  TRACKS.push({
    id: 'liszt', title: '钟', bpm: 152, wave: 'square', duty: 0.125,
    mel: compile([
      'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1',
      'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1',
      'D#6:2', 'D#6:2', 'C#6:2', 'B5:2', 'A#5:4', 'G#5:4',
      'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1', 'G#5:1',
      'D#6:2', 'C#6:2', 'B5:2', 'A#5:2', 'G#5:8',
      'C#6:2', 'D#6:2', 'F#6:4', 'F6:2', 'D#6:2', 'C#6:4', 'B5:4',
      'A#5:4', 'G#5:4', 'D#6:4', 'G#5:4'
    ]),
    bass: compile(['G#2:4', 'D#3:4', 'G#2:4', 'D#3:4', 'C#3:4', 'G#2:4', 'D#3:4', 'A#2:4']),
    drum: 'bell',
    arp: compile([['G#2', 'B#2', 'D#3', 4], ['G#2', 'C#3', 'E3', 4], ['C#3', 'F3', 'G#3', 4], ['D#3', 'G3', 'A#3', 4]])
  });

  // =========================================================
  //  v4.1 新增 12 首（加上前 12 首，当时共 24 首，随机播放）
  //  v5.0 再新增 8 首，全库共计 32 首
  // =========================================================

  // 13. J.S.巴赫《d 小调托卡塔与赋格》
  TRACKS.push({
    id: 'bach', title: 'd 小调托卡塔与赋格', bpm: 128, wave: 'square', duty: 0.5,
    mel: compile([
      'A5:1', 'G5:1', 'A5:2', 'R:1', 'G5:1', 'F5:1', 'E5:1', 'D5:1', 'C#5:1', 'D5:4',
      'D5:1', 'C5:1', 'D5:2', 'R:1', 'C5:1', 'Bb4:1', 'A4:1', 'G4:1', 'F#4:1', 'G4:4',
      'A4:2', 'D5:2', 'F5:2', 'A5:2', 'D6:2', 'A5:2', 'F5:2', 'D5:2',
      'C#5:2', 'E5:2', 'G5:2', 'Bb5:2', 'A5:2', 'G5:2', 'E5:2', 'C#5:2',
      'D5:4', 'F5:4', 'A5:4', 'D6:8'
    ]),
    bass: compile(['D2:8', 'D2:8', 'G1:8', 'A1:8', 'D2:8', 'D2:4', 'A1:4', 'D2:8']),
    arp: compile([['D4', 'F4', 'A4', 4], ['A3', 'D4', 'F4', 4], ['G3', 'Bb3', 'D4', 4],
      ['A3', 'C#4', 'E4', 4], ['D4', 'F4', 'A4', 4], ['D4', 'F4', 'A4', 4]]),
    drum: 'toccata'
  });

  // 14. 维瓦尔第《四季·春》
  TRACKS.push({
    id: 'vivaldi', title: '四季「春」', bpm: 138, wave: 'square', duty: 0.25,
    mel: compile([
      'E5:1', 'E5:1', 'E5:1', 'E5:1', 'E5:1', 'D#5:1', 'E5:2',
      'B4:1', 'C#5:1', 'D#5:1', 'E5:1', 'F#5:2', 'E5:2',
      'E5:1', 'E5:1', 'E5:1', 'E5:1', 'E5:1', 'D#5:1', 'E5:2',
      'B4:1', 'C#5:1', 'D#5:1', 'E5:1', 'F#5:2', 'E5:2',
      'G#5:2', 'F#5:2', 'E5:2', 'D#5:2', 'C#5:4', 'B4:4',
      'E5:2', 'F#5:2', 'G#5:2', 'A5:2', 'B5:4', 'G#5:4',
      'F#5:2', 'E5:2', 'D#5:2', 'C#5:2', 'B4:8'
    ]),
    bass: compile(['E2:4', 'E2:4', 'B1:4', 'B1:4', 'E2:4', 'E2:4', 'A2:4', 'B1:4',
      'C#3:4', 'A2:4', 'B1:4', 'B1:4']),
    arp: compile([['E4', 'G#4', 'B4', 4], ['B3', 'E4', 'G#4', 4], ['A3', 'C#4', 'E4', 4], ['B3', 'D#4', 'F#4', 4]]),
    drum: 'dance'
  });

  // 15. 亨德尔《水上音乐·角笛舞曲》
  TRACKS.push({
    id: 'handel', title: '水上音乐·角笛舞曲', bpm: 120, wave: 'square', duty: 0.5,
    mel: compile([
      'D5:3', 'A4:1', 'D5:2', 'F#5:2', 'A5:4', 'F#5:2', 'D5:2',
      'A4:3', 'B4:1', 'C#5:2', 'D5:2', 'E5:4', 'C#5:4',
      'D5:3', 'A4:1', 'D5:2', 'F#5:2', 'A5:4', 'D6:4',
      'C#6:2', 'B5:2', 'A5:2', 'G5:2', 'F#5:4', 'E5:4',
      'D5:2', 'E5:2', 'F#5:2', 'G5:2', 'A5:8'
    ]),
    bass: compile(['D2:4', 'A2:4', 'D2:4', 'A2:4', 'B1:4', 'G2:4', 'A2:4', 'D2:4',
      'D2:4', 'A2:4', 'D2:4', 'A2:4']),
    arp: compile([['D4', 'F#4', 'A4', 4], ['A3', 'D4', 'F#4', 4], ['G3', 'B3', 'D4', 4], ['A3', 'C#4', 'E4', 4]]),
    drum: 'march'
  });

  // 16. J.海顿《惊愕交响曲》第二乐章
  TRACKS.push({
    id: 'haydn', title: '惊愕交响曲', bpm: 108, wave: 'square', duty: 0.25,
    mel: compile([
      'C5:2', 'C5:2', 'E5:2', 'E5:2', 'G5:2', 'G5:2', 'E5:4',
      'F5:2', 'F5:2', 'D5:2', 'D5:2', 'B4:2', 'B4:2', 'G4:4',
      'C5:2', 'C5:2', 'E5:2', 'E5:2', 'G5:2', 'G5:2', 'E5:4',
      ['C5', 'E5', 'G5', 4], 'R:4',                                  // ← 惊愕的那一下
      'F5:2', 'F5:2', 'A5:2', 'A5:2', 'C6:2', 'C6:2', 'A5:4',
      'G5:2', 'G5:2', 'E5:2', 'E5:2', 'C5:4', 'R:2', 'R:2'
    ]),
    bass: compile(['C2:8', 'C2:8', 'G2:8', 'G2:8', 'C2:8', 'F2:8', 'G2:4', 'C2:8']),
    arp: compile([['C4', 'E4', 'G4', 4], ['C4', 'E4', 'G4', 4], ['G3', 'B3', 'D4', 4], ['G3', 'B3', 'D4', 4]]),
    drum: 'march'
  });

  // 17. 舒伯特《鳟鱼》
  TRACKS.push({
    id: 'schubert', title: '鳟鱼', bpm: 132, wave: 'square', duty: 0.25,
    mel: compile([
      'D5:2', 'D5:2', 'D5:2', 'D5:2', 'D5:2', 'C#5:2', 'B4:2', 'A4:2',
      'B4:2', 'B4:2', 'B4:2', 'B4:2', 'B4:2', 'A4:2', 'G4:2', 'F#4:2',
      'D5:2', 'D5:2', 'D5:2', 'D5:2', 'D5:2', 'C#5:2', 'B4:2', 'A4:2',
      'G4:2', 'A4:2', 'B4:2', 'C#5:2', 'D5:4', 'R:4',
      'F#5:2', 'F#5:2', 'E5:2', 'E5:2', 'D5:2', 'D5:2', 'C#5:4',
      'B4:2', 'C#5:2', 'D5:2', 'E5:2', 'D5:8'
    ]),
    bass: compile(['D2:4', 'A2:4', 'D2:4', 'A2:4', 'G2:4', 'D3:4', 'G2:4', 'A2:4',
      'D2:4', 'A2:4', 'G2:4', 'D3:4']),
    arp: compile([['D4', 'F#4', 'A4', 4], ['A3', 'D4', 'F#4', 4], ['G3', 'B3', 'D4', 4], ['A3', 'C#4', 'E4', 4]]),
    drum: 'dance'
  });

  // 18. 肖邦《幻想即兴曲》
  TRACKS.push({
    id: 'chopin', title: '幻想即兴曲', bpm: 152, wave: 'square', duty: 0.125,
    mel: compile([
      'G5:1', 'G5:1', 'G5:1', 'G5:1', 'F5:1', 'F5:1', 'F5:1', 'F5:1',
      'Eb5:1', 'Eb5:1', 'Eb5:1', 'Eb5:1', 'D5:1', 'D5:1', 'D5:1', 'D5:1',
      'G5:4', 'C6:2', 'B5:2', 'G5:2', 'Eb5:2', 'F5:4', 'G5:4',
      'Ab5:4', 'G5:2', 'F5:2', 'Eb5:2', 'D5:2', 'C5:4', 'D5:4',
      'Eb5:2', 'F5:2', 'G5:2', 'Ab5:2', 'Bb5:4', 'G5:4',
      'F5:2', 'Eb5:2', 'D5:2', 'C5:2', 'G5:8'
    ]),
    bass: compile(['C2:4', 'G2:4', 'Ab1:4', 'Eb2:4', 'F1:4', 'C2:4', 'G1:4', 'G1:4',
      'C2:4', 'Ab1:4', 'F1:4', 'G1:4']),
    arp: compile([['C4', 'Eb4', 'G4', 4], ['G3', 'C4', 'Eb4', 4], ['Ab3', 'C4', 'Eb4', 4], ['G3', 'B3', 'D4', 4]]),
    drum: 'storm'
  });

  // 19. 威尔第《茶花女·饮酒歌》
  TRACKS.push({
    id: 'verdi', title: '饮酒歌', bpm: 144, wave: 'square', duty: 0.5,
    mel: compile([
      'Bb4:2', 'D5:2', 'D5:2', 'D5:2', 'C5:2', 'Bb4:2', 'C5:6',
      'Bb4:2', 'D5:2', 'D5:2', 'D5:2', 'C5:2', 'Bb4:2', 'C5:6',
      'F5:2', 'F5:2', 'F5:2', 'Eb5:2', 'D5:2', 'C5:2', 'D5:6',
      'G5:2', 'F5:2', 'Eb5:2', 'D5:2', 'C5:2', 'Bb4:2', 'Bb4:6',
      'D5:2', 'Eb5:2', 'F5:2', 'G5:2', 'F5:4', 'D5:4', 'Bb4:8'
    ]),
    bass: compile(['Bb2:4', 'F2:4', 'Bb2:4', 'F2:4', 'Bb2:4', 'F2:4', 'Bb2:4', 'F2:4',
      'Eb3:4', 'Bb2:4', 'F2:4', 'Bb2:4']),
    arp: compile([['Bb3', 'D4', 'F4', 4], ['F3', 'A3', 'C4', 4], ['Bb3', 'D4', 'F4', 4], ['F3', 'A3', 'C4', 4]]),
    drum: 'waltz'
  });

  // 20. 格里格《在山魔王的宫殿里》
  TRACKS.push({
    id: 'grieg', title: '在山魔王的宫殿里', bpm: 126, wave: 'saw', duty: 0.5,
    mel: compile([
      'B4:1', 'C#5:1', 'D5:1', 'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'B5:1',
      'A5:1', 'G5:1', 'F#5:1', 'E5:1', 'D5:1', 'C#5:1', 'B4:2',
      'B4:1', 'C#5:1', 'D5:1', 'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'B5:1',
      'A5:1', 'G5:1', 'F#5:1', 'E5:1', 'D5:1', 'C#5:1', 'B4:2',
      'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'B5:1', 'C6:1', 'D6:1', 'E6:1',
      'D6:1', 'C6:1', 'B5:1', 'A5:1', 'G5:1', 'F#5:1', 'E5:2',
      'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'B5:1', 'C6:1', 'D6:1', 'E6:1',
      'D6:1', 'C6:1', 'B5:1', 'A5:1', 'G5:1', 'F#5:1', 'E5:2'
    ]),
    bass: compile(['B1:4', 'B1:4', 'B1:4', 'B1:4', 'E2:4', 'E2:4', 'B1:4', 'B1:4',
      'E2:4', 'E2:4', 'F#2:4', 'B1:4']),
    arp: compile([['B3', 'D4', 'F#4', 4], ['B3', 'D4', 'F#4', 4], ['E4', 'G4', 'B4', 4], ['F#4', 'A4', 'C5', 4]]),
    drum: 'gallop'
  });

  // 21. 柴可夫斯基《胡桃夹子·特列帕克舞曲》
  TRACKS.push({
    id: 'tchaikovsky', title: '胡桃夹子·特列帕克', bpm: 150, wave: 'square', duty: 0.5,
    mel: compile([
      'G4:1', 'B4:1', 'D5:1', 'G5:1', 'D5:1', 'B4:1', 'G4:2',
      'A4:1', 'C5:1', 'E5:1', 'A5:1', 'E5:1', 'C5:1', 'A4:2',
      'B4:1', 'D5:1', 'G5:1', 'B5:1', 'A5:1', 'G5:1', 'F#5:2',
      'G5:1', 'B5:1', 'D6:1', 'B5:1', 'G5:1', 'D5:1', 'B4:2',
      'C5:1', 'E5:1', 'G5:1', 'C6:1', 'B5:1', 'A5:1', 'G5:2',
      'F#5:1', 'A5:1', 'D6:1', 'A5:1', 'F#5:1', 'D5:1', 'G5:4'
    ]),
    bass: compile(['G2:2', 'D3:2', 'G2:2', 'D3:2', 'A2:2', 'E3:2', 'A2:2', 'E3:2',
      'G2:2', 'D3:2', 'G2:2', 'D3:2', 'C3:2', 'G2:2', 'D3:2', 'G2:2']),
    arp: compile([['G3', 'B3', 'D4', 2], ['D4', 'F#4', 'A4', 2], ['A3', 'C4', 'E4', 2], ['E4', 'G4', 'B4', 2]]),
    drum: 'ballet'
  });

  // 22. 德沃夏克《第九交响曲「自新大陆」》第二乐章
  TRACKS.push({
    id: 'dvorak', title: '自新大陆·念故乡', bpm: 72, wave: 'triangle', duty: 0.5,
    mel: compile([
      'D5:4', 'D5:2', 'E5:2', 'F#5:4', 'F#5:2', 'E5:2',
      'D5:4', 'D5:4', 'R:2', 'R:2',
      'G5:4', 'G5:2', 'F#5:2', 'E5:4', 'E5:2', 'D5:2',
      'B4:4', 'B4:4', 'R:2', 'R:2',
      'D5:4', 'D5:2', 'E5:2', 'F#5:4', 'A5:2', 'G5:2',
      'F#5:2', 'E5:2', 'D5:4', 'B4:4', 'D5:8'
    ]),
    bass: compile(['D2:8', 'A2:8', 'B1:8', 'G2:8', 'D2:8', 'A2:8', 'G2:8', 'D2:8']),
    arp: compile([['D4', 'F#4', 'A4', 8], ['A3', 'C#4', 'E4', 8], ['G3', 'B3', 'D4', 8], ['D4', 'F#4', 'A4', 8]]),
    drum: 'hymn'
  });

  // 23. 德彪西《月光》
  TRACKS.push({
    id: 'debussy', title: '月光', bpm: 66, wave: 'triangle', duty: 0.5,
    mel: compile([
      ['Ab4', 'C5', 4], ['Bb4', 'Db5', 4], ['Ab4', 'C5', 2], ['Gb4', 'Bb4', 2], ['F4', 'Ab4', 8],
      ['Gb4', 'Bb4', 4], ['Ab4', 'C5', 4], ['Gb4', 'Bb4', 2], ['F4', 'Ab4', 2], ['Eb4', 'Gb4', 8],
      ['F4', 'Ab4', 4], ['Gb4', 'Bb4', 4], ['F4', 'Ab4', 4], ['Eb4', 'Gb4', 4],
      'Db5:4', 'C5:4', 'Bb4:4', 'Ab4:8'
    ]),
    bass: compile(['Db2:8', 'Ab2:8', 'Gb2:8', 'Db2:8', 'Bb1:8', 'Eb2:8', 'Ab1:8', 'Db2:8']),
    arp: compile([['Db4', 'F4', 'Ab4', 8], ['Ab3', 'C4', 'Eb4', 8], ['Gb3', 'Bb3', 'Db4', 8], ['Db4', 'F4', 'Ab4', 8]]),
    drum: 'lullaby', strum: 0.05
  });

  // 24. 格什温《蓝色狂想曲》
  TRACKS.push({
    id: 'gershwin', title: '蓝色狂想曲', bpm: 116, wave: 'square', duty: 0.25, swing: 0.18,
    mel: compile([
      'R:2', 'C5:1', 'D5:1', 'Eb5:1', 'E5:1', 'F5:2', 'G5:2', 'F5:2', 'Eb5:2',
      'Eb5:3', 'G5:1', 'Bb5:2', 'Ab5:2', 'G5:2', 'F5:2', 'Eb5:4',
      'F5:3', 'Ab5:1', 'C6:2', 'Bb5:2', 'Ab5:2', 'G5:2', 'F5:4',
      'Eb5:3', 'G5:1', 'Bb5:2', 'C6:2', 'Bb5:2', 'Ab5:2', 'G5:4',
      'Bb5:2', 'Ab5:2', 'G5:2', 'F5:2', 'Eb5:4', 'D5:4',
      'Eb5:2', 'F5:2', 'G5:2', 'Bb5:2', 'Eb6:8'
    ]),
    bass: compile(['Eb2:4', 'Bb2:4', 'Ab2:4', 'Eb2:4', 'F2:4', 'C3:4', 'F2:4', 'Bb1:4',
      'Eb2:4', 'Ab2:4', 'Bb1:4', 'Eb2:4']),
    arp: compile([['Eb4', 'G4', 'Bb4', 4], ['Bb3', 'D4', 'F4', 4], ['Ab3', 'C4', 'Eb4', 4], ['Bb3', 'D4', 'F4', 4]]),
    drum: 'swing'
  });

  // =========================================================
  //  v5.0 新增 8 首（至此全库共 32 首，随机播放）
  //  新面孔：萨蒂 / 帕赫贝尔 / 科雷利 / 佩罗坦·塔利斯 /
  //          斯美塔那 / 里姆斯基-科萨科夫 / 车尔尼 / 韦伯恩
  // =========================================================

  // 25. 萨蒂《吉诺佩蒂第 1 号》——极简、缓慢，低音与和弦缓慢摇曳
  TRACKS.push({
    id: 'satie', title: '吉诺佩蒂第 1 号', bpm: 66, wave: 'triangle', duty: 0.5,
    mel: compile([
      // A 段：Gmaj7 与 Dmaj7 缓慢交替
      'F#5:4', 'A5:4', 'F#5:6', 'E5:2', 'D5:4', 'B4:4', 'A4:8',
      // B 段：临时转向降 B 大调，色彩转暗
      'D5:4', 'F5:4', 'D5:6', 'C5:2', 'Bb4:4', 'D5:4', 'C5:8',
      // A 段再现（旋律抬高一步）
      'F#5:4', 'A5:4', 'B5:6', 'A5:2', 'F#5:4', 'E5:4', 'D5:8',
      // C 段：Gm7 与 Dm7 的摇曳
      'D5:4', 'F5:4', 'G5:6', 'F5:2', 'D5:4', 'C5:4', 'Bb4:8',
      // 尾句：停在属音上，循环回主音
      'F#5:8', 'D5:8'
    ]),
    bass: compile([
      'G2:8', 'D2:8', 'G2:8', 'D2:8',
      'Bb2:8', 'Bb2:8', 'Bb2:8', 'F2:8',
      'G2:8', 'D2:8', 'G2:8', 'D2:8',
      'Bb2:8', 'G2:8', 'D2:8', 'Bb2:8',
      'G2:8', 'D2:8'
    ]),
    arp: compile([
      ['B3', 'D4', 'F#4', 4], ['B3', 'D4', 'A4', 4], ['F#3', 'A3', 'C#4', 4], ['A3', 'C#4', 'E4', 4],
      ['B3', 'D4', 'F#4', 4], ['D4', 'F#4', 'A4', 4], ['F#3', 'A3', 'C#4', 4], ['A3', 'C#4', 'E4', 4],
      ['D4', 'F4', 'Bb4', 4], ['F4', 'Bb4', 'D5', 4], ['D4', 'F4', 'Bb4', 4], ['F4', 'Bb4', 'D5', 4],
      ['D4', 'F4', 'Bb4', 4], ['F4', 'Bb4', 'D5', 4], ['C4', 'F4', 'A4', 4], ['F4', 'A4', 'C5', 4],
      ['B3', 'D4', 'F#4', 4], ['B3', 'D4', 'A4', 4], ['F#3', 'A3', 'C#4', 4], ['A3', 'C#4', 'E4', 4],
      ['B3', 'D4', 'F#4', 4], ['D4', 'F#4', 'A4', 4], ['F#3', 'A3', 'C#4', 4], ['A3', 'C#4', 'E4', 4],
      ['D4', 'F4', 'Bb4', 4], ['F4', 'Bb4', 'D5', 4], ['Bb3', 'D4', 'G4', 4], ['D4', 'G4', 'Bb4', 4],
      ['A3', 'D4', 'F4', 4], ['D4', 'F4', 'A4', 4], ['D4', 'F4', 'Bb4', 4], ['F4', 'Bb4', 'D5', 4],
      ['B3', 'D4', 'F#4', 4], ['B3', 'D4', 'A4', 4], ['F#3', 'A3', 'C#4', 4], ['A3', 'C#4', 'E4', 4]
    ]),
    drum: 'lullaby', strum: 0.04
  });

  // 26. 帕赫贝尔《D 大调卡农》——固定低音 + 数字低音 + 三声部轮转
  TRACKS.push({
    id: 'pachelbel', title: 'D 大调卡农', bpm: 92, wave: 'square', duty: 0.5,
    mel: compile([
      // 第一小提琴：主题呈示（F#5 起）
      'F#5:2', 'E5:2', 'D5:2', 'C#5:2', 'B4:2', 'A4:2', 'B4:2', 'C#5:2',
      'D5:2', 'C#5:2', 'B4:2', 'A4:2', 'G4:2', 'F#4:2', 'G4:2', 'E4:2',
      // 同一动机逐小节向下移位（卡农式模进）
      'D5:2', 'F#5:2', 'E5:2', 'C#5:2', 'D5:2', 'B4:2', 'C#5:2', 'A4:2',
      'B4:2', 'G4:2', 'A4:2', 'F#4:2', 'B4:2', 'G4:2', 'C#5:2', 'A4:2',
      // 主题回归并推向高音收束
      'F#5:2', 'E5:2', 'D5:2', 'C#5:2', 'B4:2', 'A4:2', 'B4:2', 'C#5:2',
      'D5:2', 'E5:2', 'F#5:2', 'D5:2', 'G5:4', 'A5:4'
    ]),
    bass: compile(['D2:4', 'A2:4', 'B2:4', 'F#2:4', 'G2:4', 'D2:4', 'G2:4', 'A2:4']),
    arp: compile([
      // 数字低音：八小节和弦循环（D-A-Bm-F#m-G-D-G-A）
      ['D3', 'F#3', 'A3', 4], ['A2', 'C#3', 'E3', 4], ['B2', 'D3', 'F#3', 4], ['F#2', 'A2', 'C#3', 4],
      ['G2', 'B2', 'D3', 4], ['D3', 'F#3', 'A3', 4], ['G2', 'B2', 'D3', 4], ['A2', 'C#3', 'E3', 4],
      // 第二小提琴：晚一个循环进入，低八度复述同一动机
      'F#4:2', 'E4:2', 'D4:2', 'C#4:2', 'B3:2', 'A3:2', 'B3:2', 'C#4:2',
      'D4:2', 'C#4:2', 'B3:2', 'A3:2', 'G3:2', 'F#3:2', 'G3:2', 'E3:2',
      'D4:2', 'F#4:2', 'E4:2', 'C#4:2', 'D4:2', 'B3:2', 'C#4:2', 'A3:2',
      'B3:2', 'G3:2', 'A3:2', 'F#3:2', 'B3:2', 'G3:2', 'C#4:2', 'A3:2'
    ]),
    drum: 'march'
  });

  // 27. 科雷利 / 泰勒曼风格的巴洛克协奏曲快板
  TRACKS.push({
    id: 'corelli', title: '巴洛克协奏曲 快板', bpm: 132, wave: 'square', duty: 0.25,
    mel: compile([
      // 主奏群：分解和弦 + 模进
      'D5:1', 'F#5:1', 'A5:2', 'A5:1', 'G5:1', 'F#5:2', 'E5:1', 'F#5:1', 'G5:2', 'F#5:1', 'E5:1', 'D5:2',
      'E5:1', 'G5:1', 'B5:2', 'B5:1', 'A5:1', 'G5:2', 'F#5:1', 'G5:1', 'A5:2', 'G5:1', 'F#5:1', 'E5:2',
      // 快速音阶跑句（D 大调音阶上下行）
      'D5:1', 'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'B5:1', 'C#6:1', 'D6:1',
      'C#6:1', 'B5:1', 'A5:1', 'G5:1', 'F#5:1', 'E5:1', 'D5:2',
      // 收束句
      'A5:1', 'G5:1', 'F#5:1', 'E5:1', 'D5:2', 'F#5:2', 'E5:1', 'F#5:1', 'G5:1', 'A5:1', 'D6:4'
    ]),
    bass: compile([
      'D2:2', 'A2:2', 'A2:2', 'E3:2', 'G2:2', 'D3:2', 'D2:2', 'A2:2',
      'E2:2', 'B2:2', 'B2:2', 'F#3:2', 'A2:2', 'E3:2', 'A2:2', 'C#3:2',
      'D2:2', 'A2:2', 'G2:2', 'D3:2', 'A2:2', 'E3:2', 'D2:2', 'F#2:2',
      'D2:2', 'A2:2', 'D2:2', 'F#2:2', 'A2:2', 'E3:2', 'D2:4'
    ]),
    arp: compile([
      ['D3', 'F#3', 'A3', 4], ['A2', 'C#3', 'E3', 4], ['G2', 'B2', 'D3', 4], ['D3', 'F#3', 'A3', 4],
      ['E3', 'G3', 'B3', 4], ['B2', 'D3', 'F#3', 4], ['A2', 'C#3', 'E3', 4], ['A2', 'C#3', 'E3', 4],
      ['D3', 'F#3', 'A3', 4], ['G2', 'B2', 'D3', 4], ['A2', 'C#3', 'E3', 4], ['D3', 'F#3', 'A3', 4],
      ['D3', 'F#3', 'A3', 4], ['D3', 'F#3', 'A3', 4], ['A2', 'C#3', 'E3', 4], ['D3', 'F#3', 'A3', 4]
    ]),
    drum: 'dance'
  });

  // 28. 佩罗坦 / 塔利斯风格的早期圣咏
  //     （奥尔加农：上声部 + 平行四度下声部 + 持续低音，多利亚调式，无强拍鼓点）
  TRACKS.push({
    id: 'tallis', title: '早期圣咏·奥尔加农', bpm: 60, wave: 'triangle', duty: 0.5,
    mel: compile([
      'D5:8', 'F5:4', 'E5:2', 'D5:2', 'C5:4', 'D5:2', 'E5:2', 'D5:4',
      'F5:8', 'E5:2', 'D5:2', 'C5:4', 'D5:4',
      'F5:4', 'G5:4', 'A5:8', 'G5:2', 'F5:2', 'E5:4', 'F5:4', 'E5:4', 'D5:16',
      'A5:4', 'G5:4', 'F5:4', 'E5:4', 'D5:4', 'C5:4', 'D5:8', 'F5:2', 'E5:2', 'D5:12'
    ]),
    bass: compile([
      'D2:16', 'D2:16', 'A2:16', 'D2:16', 'A2:16', 'D2:16', 'F2:16', 'A2:16', 'D2:16'
    ]),
    arp: compile([
      // 平行四度下声部（vox organalis），与上声部逐音同步
      'A4:8', 'C5:4', 'B4:2', 'A4:2', 'G4:4', 'A4:2', 'B4:2', 'A4:4',
      'C5:8', 'B4:2', 'A4:2', 'G4:4', 'A4:4',
      'C5:4', 'D5:4', 'E5:8', 'D5:2', 'C5:2', 'B4:4', 'C5:4', 'B4:4', 'A4:16',
      'E5:4', 'D5:4', 'C5:4', 'B4:4', 'A4:4', 'G4:4', 'A4:8', 'C5:2', 'B4:2', 'A4:12'
    ]),
    drum: 'none', strum: 0
  });

  // 29. 斯美塔那《伏尔塔瓦河》——上行河流主题，e 小调转 E 大调
  TRACKS.push({
    id: 'smetana', title: '伏尔塔瓦河', bpm: 108, wave: 'square', duty: 0.5,
    mel: compile([
      // e 小调：E-G-A 上行的河流主题
      'E5:2', 'G5:2', 'A5:4', 'G5:2', 'E5:2', 'D5:4',
      'E5:2', 'G5:2', 'A5:2', 'B5:2', 'A5:2', 'G5:2', 'E5:4',
      'D5:2', 'E5:2', 'G5:4', 'A5:2', 'G5:2', 'E5:4',
      'D5:2', 'C5:2', 'D5:2', 'E5:2', 'E5:8',
      // E 大调：同一主题的明亮变形
      'E5:2', 'G#5:2', 'A5:4', 'B5:2', 'A5:2', 'G#5:4',
      'A5:2', 'B5:2', 'C#6:2', 'B5:2', 'A5:2', 'G#5:2', 'E5:4',
      'F#5:2', 'E5:2', 'D#5:4', 'E5:2', 'F#5:2', 'G#5:4',
      'A5:2', 'B5:2', 'A5:2', 'G#5:2', 'E5:8'
    ]),
    bass: compile([
      'E2:2', 'B2:2', 'E3:2', 'B2:2', 'E2:2', 'B2:2', 'G2:2', 'B2:2',
      'A2:2', 'E3:2', 'A2:2', 'C3:2', 'E2:2', 'B2:2', 'G2:2', 'B2:2',
      'C2:2', 'G2:2', 'E3:2', 'G2:2', 'A2:2', 'E3:2', 'A2:2', 'C3:2',
      'A2:2', 'E3:2', 'A2:2', 'C3:2', 'E2:2', 'B2:2', 'E3:2', 'B2:2',
      'E2:2', 'B2:2', 'E3:2', 'B2:2', 'E2:2', 'B2:2', 'G#2:2', 'B2:2',
      'A2:2', 'E3:2', 'A2:2', 'C#3:2', 'E2:2', 'B2:2', 'G#2:2', 'B2:2',
      'B2:2', 'F#3:2', 'B2:2', 'D#3:2', 'E2:2', 'B2:2', 'G#2:2', 'B2:2',
      'A2:2', 'E3:2', 'A2:2', 'C#3:2', 'E2:2', 'B2:2', 'E3:2', 'B2:2'
    ]),
    arp: compile([
      ['E3', 'G3', 'B3', 8], ['E3', 'G3', 'B3', 8], ['A2', 'C3', 'E3', 8], ['E3', 'G3', 'B3', 8],
      ['C3', 'E3', 'G3', 8], ['A2', 'C3', 'E3', 8], ['A2', 'C3', 'E3', 8], ['E3', 'G3', 'B3', 8],
      ['E3', 'G#3', 'B3', 8], ['E3', 'G#3', 'B3', 8], ['A2', 'C#3', 'E3', 8], ['E3', 'G#3', 'B3', 8],
      ['B2', 'D#3', 'F#3', 8], ['E3', 'G#3', 'B3', 8], ['A2', 'C#3', 'E3', 8], ['E3', 'G#3', 'B3', 8]
    ]),
    drum: 'dance'
  });

  // 30. 里姆斯基-科萨科夫《野蜂飞舞》——极快的半音跑动
  TRACKS.push({
    id: 'bumblebee', title: '野蜂飞舞', bpm: 152, wave: 'square', duty: 0.125,
    mel: compile([
      // 半音下行（十六分音符）
      'A5:1', 'G#5:1', 'G5:1', 'F#5:1', 'F5:1', 'E5:1', 'D#5:1', 'D5:1',
      'C#5:1', 'C5:1', 'B4:1', 'A#4:1', 'A4:2', 'R:2',
      // 半音上行折返
      'A4:1', 'A#4:1', 'B4:1', 'C5:1', 'C#5:1', 'D5:1', 'D#5:1', 'E5:1',
      'F5:1', 'F#5:1', 'G5:1', 'G#5:1', 'A5:2', 'R:2',
      // 主题：野蜂般忽高忽低的折返
      'A5:2', 'C6:2', 'B5:2', 'A5:2', 'G#5:2', 'E5:2', 'F5:2', 'E5:2',
      'D#5:2', 'E5:2', 'C5:2', 'B4:2', 'A4:2', 'G#4:2', 'A4:4',
      // 高音区的半音漩涡
      'A5:1', 'B5:1', 'C6:1', 'C#6:1', 'D6:1', 'C#6:1', 'C6:1', 'B5:1',
      'A#5:1', 'A5:1', 'G#5:1', 'G5:1', 'F#5:2', 'R:2',
      // 半音下行收束回主音
      'F5:1', 'E5:1', 'D#5:1', 'D5:1', 'C#5:1', 'C5:1', 'B4:1', 'A#4:1',
      'A4:4', 'R:4'
    ]),
    bass: compile([
      'A1:4', 'E2:4', 'A1:4', 'E2:4', 'A1:4', 'E2:4', 'A1:4', 'E2:4',
      'F2:4', 'E2:4', 'D#2:4', 'E2:4', 'A1:4', 'E2:4', 'A1:4', 'E2:4',
      'A1:4', 'E2:4', 'A1:4', 'E2:4', 'F2:4', 'E2:4', 'A1:4', 'E2:4'
    ]),
    arp: compile([
      ['A3', 'C4', 'E4', 16], ['A3', 'C4', 'E4', 16], ['F3', 'A3', 'C4', 16],
      ['E3', 'G#3', 'B3', 16], ['A3', 'C4', 'E4', 16], ['A3', 'C4', 'E4', 16]
    ]),
    drum: 'storm'
  });

  // 31. 车尔尼练习曲——均匀的快速音阶 / 分解三度跑动
  TRACKS.push({
    id: 'czerny', title: '车尔尼练习曲', bpm: 144, wave: 'square', duty: 0.25,
    mel: compile([
      // 音阶上下行（C 大调）
      'C5:2', 'D5:2', 'E5:2', 'F5:2', 'G5:2', 'A5:2', 'B5:2', 'C6:2',
      'B5:2', 'A5:2', 'G5:2', 'F5:2', 'E5:2', 'D5:2', 'C5:2', 'B4:2',
      // 分解三度模进
      'C5:2', 'E5:2', 'D5:2', 'F5:2', 'E5:2', 'G5:2', 'F5:2', 'A5:2',
      'B4:2', 'D5:2', 'C5:2', 'E5:2', 'D5:2', 'F5:2', 'E5:2', 'G5:2',
      // 分解和弦下行 + 收束
      'C6:2', 'G5:2', 'E5:2', 'C5:2', 'G5:2', 'E5:2', 'C5:2', 'G4:2',
      'C5:2', 'E5:2', 'G5:2', 'C6:2', 'G5:2', 'E5:2', 'C5:4'
    ]),
    bass: compile([
      'C2:4', 'G2:4', 'C2:4', 'G2:4', 'G2:4', 'D3:4', 'G2:4', 'D3:4',
      'C2:4', 'G2:4', 'C2:4', 'G2:4', 'G2:4', 'D3:4', 'G2:4', 'B2:4',
      'C2:4', 'G2:4', 'C2:4', 'G2:4', 'C2:4', 'G2:4', 'C2:4', 'C2:4'
    ]),
    arp: compile([
      ['C4', 'E4', 'G4', 16], ['G3', 'B3', 'D4', 16], ['C4', 'E4', 'G4', 16],
      ['G3', 'B3', 'F4', 16], ['C4', 'E4', 'G4', 16], ['C4', 'E4', 'G4', 16]
    ]),
    drum: 'march'
  });

  // 32. 韦伯恩 / 梅西安风格的现代音响——不协和音程与碎片化节奏
  TRACKS.push({
    id: 'webern', title: '现代音响·碎片', bpm: 76, wave: 'square', duty: 0.125,
    mel: compile([
      // 点描式单音，时值刻意不规则（1/2/3/7 混用）
      'C5:1', 'R:1', 'F#5:1', 'R:1', 'B4:2', 'R:1', 'G#4:1', 'R:1',
      'E5:3', 'R:1', 'Bb4:1', 'A4:1', 'R:2', 'Eb5:1', 'R:3', 'D5:1', 'C#5:1', 'R:2', 'G4:7',
      // 上方的倒影式应答
      'Ab4:1', 'R:1', 'D5:1', 'R:1', 'A4:2', 'R:1', 'F5:1', 'R:1',
      'Db5:3', 'R:1', 'G5:1', 'F#5:1', 'R:2', 'C5:1', 'R:3', 'B4:1', 'Bb4:1', 'R:2', 'Eb4:7',
      // 三全音叠置的“音色点”，随后半音音簇下行
      ['C5', 'F#5', 2], 'R:2', ['B4', 'F5', 2], 'R:2',
      ['A4', 'Eb5', 2], 'R:2', ['G#4', 'D5', 2], 'R:2',
      'C5:1', 'B4:1', 'A#4:1', 'A4:1', 'R:4', ['F#4', 'C5', 8]
    ]),
    bass: compile([
      // 十二音集合式的低音基音序列（半音阶上行）
      'C2:8', 'Db2:8', 'D2:8', 'Eb2:8', 'E2:8', 'F2:8',
      'Gb2:8', 'G2:8', 'Ab2:8', 'A2:8', 'Bb2:8', 'B2:8'
    ]),
    arp: compile([
      // 高位三全音残响
      ['B4', 'F5', 16], ['Bb4', 'E5', 16], ['A4', 'Eb5', 16],
      ['Ab4', 'D5', 16], ['G4', 'C#5', 16], ['Gb4', 'C5', 16]
    ]),
    drum: 'none'
  });

  // ---------- 引擎 ----------
  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuf = null;
    this.muted = false;
    this.sfxOn = true;      // v5.0：对战音效开关
    this.track = null;
    this.playing = false;
    this.startTime = 0;
    this.stepIndex = 0;
    this.timer = null;
    this.lookahead = 0.35;
    this.volume = 0.9;
  }

  AudioEngine.prototype.init = function () {
    if (this.ctx || !AC) return this.ctx;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.30;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.42;
    this.sfxGain.connect(this.master);
    // 噪声缓冲（鼓组）
    var len = Math.floor(this.ctx.sampleRate * 0.5);
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return this.ctx;
  };

  AudioEngine.prototype.resume = function () {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  AudioEngine.prototype.setMuted = function (m) {
    this.muted = !!m;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  };
  AudioEngine.prototype.toggleMute = function () { return this.setMuted(!this.muted); };

  /**
   * v5.0：对战音效开关（与「静音」相互独立）
   * 静音 = 全部声音关掉；音效开关只作用于打击 / 技能 / 命中反馈，
   * BGM 照常播放。设置界面里可随时切换，选择会写进 ccb_settings。
   */
  AudioEngine.prototype.setSfxEnabled = function (on) {
    this.sfxOn = on !== false;
    if (this.ctx && this.sfxGain) {
      var g = this.sfxOn ? 0.42 : 0;
      this.sfxGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(g, this.ctx.currentTime);
    }
    return this.sfxOn;
  };
  AudioEngine.prototype.sfxEnabled = function () { return this.sfxOn !== false; };
  AudioEngine.prototype.toggleSfx = function () { return this.setSfxEnabled(!this.sfxEnabled()); };

  // ---------- 单音合成 ----------
  AudioEngine.prototype.tone = function (freq, dur, opt) {
    if (!this.ctx || this.muted) return;
    opt = opt || {};
    var ctx = this.ctx, now = opt.at || ctx.currentTime;
    var dest = opt.bus === 'sfx' ? this.sfxGain : this.musicGain;
    var g = ctx.createGain();
    var peak = (opt.gain == null ? 0.5 : opt.gain);
    var atk = opt.attack == null ? 0.005 : opt.attack;
    var rel = opt.release == null ? Math.min(0.09, dur * 0.5) : opt.release;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + atk);
    g.gain.setValueAtTime(peak, Math.max(now + atk, now + dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.02);

    var osc;
    var w = opt.wave || 'square';
    if (w === 'saw') {
      // 用周期波近似锯齿（8bit 常见的三角/锯齿感）
      osc = ctx.createOscillator();
      osc.type = 'sawtooth';
    } else {
      osc = ctx.createOscillator();
      osc.type = w === 'triangle' ? 'triangle' : 'square';
    }
    osc.frequency.setValueAtTime(freq, now);
    if (opt.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slideTo), now + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.05);
    return osc;
  };

  AudioEngine.prototype.drum = function (kind, at) {
    if (!this.ctx || this.muted) return;
    var ctx = this.ctx, now = at || ctx.currentTime;
    var dest = this.musicGain;
    if (kind === 'kick') {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, now);
      o.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      g.gain.setValueAtTime(0.55, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.2);
    } else {
      var src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      var f = ctx.createBiquadFilter();
      var gg = ctx.createGain();
      if (kind === 'snare') {
        f.type = 'highpass'; f.frequency.value = 1200;
        gg.gain.setValueAtTime(0.28, now);
        gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      } else if (kind === 'hat') {
        f.type = 'highpass'; f.frequency.value = 6000;
        gg.gain.setValueAtTime(0.12, now);
        gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      } else { // 'bell' / 通用打击
        f.type = 'bandpass'; f.frequency.value = 3200;
        gg.gain.setValueAtTime(0.2, now);
        gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      }
      src.connect(f); f.connect(gg); gg.connect(dest);
      src.start(now);
      src.stop(now + 0.3);
    }
  };

  var DRUM_PATTERNS = {
    march: [['kick', 0], ['snare', 4], ['kick', 8], ['snare', 12]],
    turk: [['kick', 0], ['hat', 2], ['snare', 4], ['hat', 6], ['kick', 8], ['hat', 10], ['snare', 12], ['hat', 14]],
    dance: [['kick', 0], ['snare', 4], ['kick', 6], ['snare', 10], ['kick', 12], ['snare', 14]],
    ride: [['kick', 0], ['kick', 3], ['snare', 6], ['kick', 9], ['snare', 12], ['kick', 15]],
    waltz: [['kick', 0], ['hat', 2], ['hat', 4], ['kick', 6], ['hat', 8], ['hat', 10]],
    hymn: [['kick', 0], ['snare', 8]],
    storm: [['kick', 0], ['kick', 3], ['snare', 6], ['kick', 9], ['snare', 12], ['kick', 14]],
    bell: [['kick', 0], ['hat', 4], ['snare', 8], ['hat', 12]],
    none: [],
    // ---- v4.1 新增鼓型 ----
    toccata: [['kick', 0], ['kick', 2], ['snare', 5], ['kick', 8], ['kick', 10], ['snare', 13]],
    gallop: [['kick', 0], ['kick', 1], ['snare', 4], ['kick', 6], ['kick', 7], ['snare', 10], ['kick', 12], ['kick', 13], ['snare', 15]],
    swing: [['kick', 0], ['hat', 3], ['snare', 6], ['hat', 9], ['kick', 10], ['hat', 13], ['snare', 14]],
    lullaby: [['kick', 0], ['hat', 8]],
    ballet: [['kick', 0], ['snare', 3], ['kick', 4], ['hat', 6], ['kick', 8], ['snare', 11], ['kick', 12], ['hat', 14]],
    procession: [['kick', 0], ['snare', 4], ['snare', 8], ['kick', 12], ['snare', 14]]
  };

  // ---------- 播放调度 ----------
  AudioEngine.prototype.playTrack = function (index, opts) {
    opts = opts || {};
    this.init();
    if (!this.ctx) return null;
    var track = TRACKS[index % TRACKS.length];
    if (this.playing && this.track === track && !opts.force) return track;
    this.stopMusic();
    this.track = track;
    this.playing = true;
    this.stepIndex = 0;
    this.unit = 60 / track.bpm / 4;   // 一个谱面单位 = 十六分音符
    // 循环长度取各声部的最长值，避免贝斯 / 和弦层尾部被截断或与旋律错位
    this.loopLen = trackLength(track);
    this.loopStart = 0;
    this.startTime = this.ctx.currentTime + 0.08;
    this.schedule();
    var self = this;
    this.timer = setInterval(function () { self.schedule(); }, 90);
    return track;
  };

  AudioEngine.prototype.schedule = function () {
    if (!this.playing || !this.ctx) return;
    var t = this.ctx.currentTime;
    var mel = this.track.mel;
    var bass = this.track.bass;
    var arp = this.track.arp;
    var total = this.loopLen || mel.length;
    // 摇摆：把每个单位里的后半拍稍微推后（爵士曲专用）
    var swing = this.track.swing || 0;
    while (this.startTime < t + this.lookahead) {
      var unit = this.unit, at = this.startTime, i;
      var swung = (swing && (this.stepIndex % 2 === 1)) ? unit * swing : 0;
      var when = at + swung;
      // 旋律（带轻微音量人性化，避免每轮循环都一模一样）
      for (i = 0; i < mel.events.length; i++) {
        var e = mel.events[i];
        if (e.rest) continue;
        if (Math.abs(e.t - this.stepIndex) < 0.0001) {
          var pitches = Object.prototype.toString.call(e.p) === '[object Array]' ? e.p : [e.p];
          for (var k = 0; k < pitches.length; k++) {
            var nm = NOTE_RE.exec(pitches[k]);
            this.tone(hz(nm ? midi(pitches[k]) : 60), e.d * unit * 0.92, {
              at: when + k * 0.012, wave: this.track.wave,
              gain: (this.track.wave === 'triangle' ? 0.34 : 0.22) * (0.9 + Math.random() * 0.18)
            });
          }
        }
      }
      // 贝斯（走根音）。
      // 用取模让和声层在自己长度范围内循环，而不是“放到一半就消失”：
      // 此前贝斯普遍比旋律短，导致每轮循环的后半段完全没有低音。
      var bassLen = bass.length || 1;
      for (i = 0; i < bass.events.length; i++) {
        var b = bass.events[i];
        if (Math.abs(b.t - (this.stepIndex % bassLen)) < 0.0001) {
          this.tone(hz(midi(b.p)), b.d * unit * 0.9, { at: when, wave: 'triangle', gain: 0.30 });
        }
      }
      // 和弦 / 分解和弦层（v4.1 新增的第三声部），同样循环播放
      if (arp) {
        var arpLen = arp.length || 1;
        for (i = 0; i < arp.events.length; i++) {
          var a = arp.events[i];
          if (Math.abs(a.t - (this.stepIndex % arpLen)) < 0.0001) {
            var ps = Object.prototype.toString.call(a.p) === '[object Array]' ? a.p : [a.p];
            var strum = this.track.strum == null ? 0.016 : this.track.strum;
            for (var m = 0; m < ps.length; m++) {
              this.tone(hz(midi(ps[m])), a.d * unit * 0.7, {
                at: when + m * strum, wave: 'triangle', gain: 0.105
              });
            }
          }
        }
      }
      // 鼓
      var dr = DRUM_PATTERNS[this.track.drum] || [];
      for (i = 0; i < dr.length; i++) {
        if (dr[i][1] === this.stepIndex % 16) this.drum(dr[i][0], when);
      }
      this.startTime += unit;
      this.stepIndex = (this.stepIndex + 1) % total;
    }
  };

  AudioEngine.prototype.stopMusic = function () {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  };

  // ---------- 音效 ----------
  var S = AudioEngine.prototype;
  S.sfx = function (name) {
    if (!this.ctx || this.muted || this.sfxOn === false) return;
    var c = this.ctx.currentTime;
    var T = this.tone.bind(this);
    switch (name) {
      case 'punch':
        T(220, 0.07, { at: c, wave: 'square', bus: 'sfx', gain: 0.30, slideTo: 100, release: 0.05 });
        break;
      case 'kick':
        T(160, 0.10, { at: c, wave: 'square', bus: 'sfx', gain: 0.32, slideTo: 70, release: 0.07 });
        break;
      case 'hit':
        T(420, 0.06, { at: c, wave: 'square', bus: 'sfx', gain: 0.26, slideTo: 180, release: 0.04 });
        this.drum('snare', c);
        break;
      case 'block':
        T(1400, 0.09, { at: c, wave: 'square', bus: 'sfx', gain: 0.18, slideTo: 900, release: 0.07 });
        break;
      case 'skill1':
        T(520, 0.10, { at: c, wave: 'square', bus: 'sfx', gain: 0.26 });
        T(780, 0.12, { at: c + 0.06, wave: 'square', bus: 'sfx', gain: 0.24 });
        break;
      case 'skill2':
        T(400, 0.12, { at: c, wave: 'saw', bus: 'sfx', gain: 0.24, slideTo: 900 });
        break;
      case 'skillField':
        T(196, 0.45, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.26, slideTo: 392, attack: 0.1 });
        break;
      case 'skillEcho':
        T(660, 0.12, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.24 });
        T(990, 0.16, { at: c + 0.08, wave: 'triangle', bus: 'sfx', gain: 0.22 });
        break;
      case 'ultimate':
        var seq = [392, 523, 659, 784, 1047, 1319];
        for (var i = 0; i < seq.length; i++) {
          T(seq[i], 0.16, { at: c + i * 0.075, wave: 'square', bus: 'sfx', gain: 0.30 });
        }
        break;
      case 'ko':
        var seq2 = [523, 466, 392, 311, 262, 196];
        for (var j = 0; j < seq2.length; j++) {
          T(seq2[j], 0.22, { at: c + j * 0.12, wave: 'triangle', bus: 'sfx', gain: 0.36 });
        }
        break;
      case 'select':
        T(880, 0.05, { at: c, wave: 'square', bus: 'sfx', gain: 0.20 });
        break;
      case 'confirm':
        T(660, 0.07, { at: c, wave: 'square', bus: 'sfx', gain: 0.22 });
        T(990, 0.10, { at: c + 0.07, wave: 'square', bus: 'sfx', gain: 0.22 });
        break;
      case 'win':
        var seq3 = [523, 659, 784, 1047, 1319];
        for (var m = 0; m < seq3.length; m++) {
          T(seq3[m], 0.20, { at: c + m * 0.11, wave: 'square', bus: 'sfx', gain: 0.30 });
        }
        break;
      case 'lose':
        var seq4 = [392, 349, 311, 262, 196];
        for (var n = 0; n < seq4.length; n++) {
          T(seq4[n], 0.30, { at: c + n * 0.18, wave: 'triangle', bus: 'sfx', gain: 0.32 });
        }
        break;
      case 'shield':
        T(300, 0.20, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.24, slideTo: 600 });
        break;
      case 'guardBreak':
        T(260, 0.14, { at: c, wave: 'square', bus: 'sfx', gain: 0.26, slideTo: 120, release: 0.1 });
        break;
      case 'bond':
        var seq5 = [523, 659, 784, 1047];
        for (var q = 0; q < seq5.length; q++) {
          T(seq5[q], 0.26, { at: c + q * 0.09, wave: 'triangle', bus: 'sfx', gain: 0.30 });
        }
        break;
      case 'field':
        T(196, 0.5, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.26, slideTo: 392, attack: 0.12, release: 0.2 });
        T(294, 0.45, { at: c + 0.06, wave: 'square', bus: 'sfx', gain: 0.14, slideTo: 588, attack: 0.1 });
        break;
      case 'echo':
        var seq6 = [784, 988, 1175, 1568];
        for (var r2 = 0; r2 < seq6.length; r2++) {
          T(seq6[r2], 0.14, { at: c + r2 * 0.06, wave: 'triangle', bus: 'sfx', gain: 0.22 });
        }
        break;
      case 'movement':
        // 乐章：指挥落拍般的短促音阶
        var seq7 = [440, 554, 659, 880, 1109];
        for (var s7 = 0; s7 < seq7.length; s7++) {
          T(seq7[s7], 0.13, { at: c + s7 * 0.055, wave: 'square', bus: 'sfx', gain: 0.22 });
        }
        break;
      case 'rondo':
        // 回旋：先上行再折返的滑音
        T(523, 0.16, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.26, slideTo: 1047 });
        T(1047, 0.20, { at: c + 0.16, wave: 'triangle', bus: 'sfx', gain: 0.24, slideTo: 523 });
        break;
      case 'canon':
        // 卡农：同一乐句两次，第二次更轻（模仿声部）
        T(659, 0.14, { at: c, wave: 'square', bus: 'sfx', gain: 0.24 });
        T(784, 0.14, { at: c + 0.1, wave: 'square', bus: 'sfx', gain: 0.22 });
        T(659, 0.14, { at: c + 0.24, wave: 'triangle', bus: 'sfx', gain: 0.16 });
        T(784, 0.16, { at: c + 0.34, wave: 'triangle', bus: 'sfx', gain: 0.14 });
        break;
      case 'heal':
        T(659, 0.12, { at: c, wave: 'triangle', bus: 'sfx', gain: 0.22 });
        T(880, 0.16, { at: c + 0.09, wave: 'triangle', bus: 'sfx', gain: 0.22 });
        break;
      case 'swap':
        T(523, 0.09, { at: c, wave: 'square', bus: 'sfx', gain: 0.24 });
        T(1047, 0.14, { at: c + 0.08, wave: 'square', bus: 'sfx', gain: 0.22 });
        break;
    }
  };

  S.tracks = TRACKS;
  S.trackTitle = function (i) { return TRACKS[i % TRACKS.length].title; };
  S.trackCount = function () { return TRACKS.length; };

  global.Chiptune = new AudioEngine();
  global.Chiptune.midi = midi;
  global.Chiptune.hz = hz;
})(window);

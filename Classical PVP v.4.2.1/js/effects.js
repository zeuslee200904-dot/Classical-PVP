/* ============================================================
   effects.js — 技能特效 / 粒子 / 飘字
   ============================================================ */
(function (global) {
  'use strict';

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pickOne(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    var x2 = x + w, y2 = y + h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x2 - r, y);
    ctx.lineTo(x2, y + r);
    ctx.lineTo(x2, y2 - r);
    ctx.lineTo(x2 - r, y2);
    ctx.lineTo(x + r, y2);
    ctx.lineTo(x, y2 - r);
    ctx.lineTo(x, y + r);
    ctx.closePath();
    ctx.fill();
  }

  // ---------- 像素字体 ----------
  var FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
    'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
    'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
    'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'],
    'I': ['111', '010', '010', '010', '111'], 'J': ['001', '001', '001', '101', '010'],
    'K': ['101', '101', '110', '101', '101'], 'L': ['100', '100', '100', '100', '111'],
    'M': ['101', '111', '111', '101', '101'], 'N': ['101', '111', '111', '111', '101'],
    'O': ['010', '101', '101', '101', '010'], 'P': ['110', '101', '110', '100', '100'],
    'Q': ['010', '101', '101', '111', '011'], 'R': ['110', '101', '110', '101', '101'],
    'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
    'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'],
    'W': ['101', '101', '111', '111', '101'], 'X': ['101', '101', '010', '101', '101'],
    'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
    '-': ['000', '000', '111', '000', '000'], '+': ['000', '010', '111', '010', '000'],
    '!': ['010', '010', '010', '000', '010'], '?': ['110', '001', '010', '000', '010'],
    '.': ['000', '000', '000', '000', '010'], ':': ['000', '010', '000', '010', '000'],
    '/': ['001', '001', '010', '100', '100'], '%': ['101', '001', '010', '100', '101'],
    '×': ['000', '101', '010', '101', '000'], ' ': ['000', '000', '000', '000', '000'],
    // 小写字母（3×5，供中英混排的短文本使用，例如 'Version 2.1'）
    'a': ['000', '011', '001', '011', '011'], 'b': ['100', '110', '101', '101', '110'],
    'c': ['000', '011', '100', '100', '011'], 'd': ['001', '011', '101', '101', '011'],
    'e': ['000', '011', '101', '111', '011'], 'f': ['011', '010', '111', '010', '010'],
    'g': ['000', '011', '101', '011', '110'], 'h': ['100', '110', '101', '101', '101'],
    'i': ['010', '000', '110', '010', '111'], 'j': ['001', '000', '001', '101', '010'],
    'k': ['100', '101', '110', '101', '101'], 'l': ['110', '010', '010', '010', '111'],
    'm': ['000', '111', '111', '101', '101'], 'n': ['000', '110', '101', '101', '101'],
    'o': ['000', '010', '101', '101', '010'], 'p': ['000', '110', '101', '110', '100'],
    'q': ['000', '011', '101', '011', '001'], 'r': ['000', '101', '110', '100', '100'],
    's': ['000', '011', '100', '010', '110'], 't': ['010', '111', '010', '010', '011'],
    'u': ['000', '101', '101', '101', '011'], 'v': ['000', '101', '101', '101', '010'],
    'w': ['000', '101', '101', '111', '101'], 'x': ['000', '101', '010', '101', '101'],
    'y': ['000', '101', '101', '011', '110'], 'z': ['000', '111', '001', '010', '100']
  };

  function textWidth(str, scale) {
    return str.length * 4 * scale - scale;
  }

  function drawText(ctx, str, x, y, scale, color, align) {
    str = String(str);
    scale = scale || 2;
    if (align === 'center') x -= textWidth(str, scale) / 2;
    else if (align === 'right') x -= textWidth(str, scale);
    ctx.fillStyle = color || '#f4f0e2';
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]];
      if (!g) continue;
      for (var r = 0; r < 5; r++) {
        var row = g[r];
        for (var c = 0; c < 3; c++) {
          if (row[c] === '1') ctx.fillRect(x + (i * 4 + c) * scale, y + r * scale, scale, scale);
        }
      }
    }
  }

  // 含中日韩文字时改用矢量字体（像素字库没有中文，直接画会空白）
  var CJK_RE = /[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/;
  function hasCJK(str) { return CJK_RE.test(String(str)); }

  /**
   * 自动选择字体：纯 ASCII 用像素字，含中文则用带描边的矢量字
   * 参数与 drawText 完全一致
   */
  function drawTextAuto(ctx, str, x, y, scale, color, align) {
    str = String(str);
    if (!hasCJK(str)) { drawText(ctx, str, x, y, scale, color, align); return; }
    var fs = Math.round(5 * (scale || 2) + 6);
    ctx.save();
    ctx.font = 'bold ' + fs + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = align === 'center' ? 'center' : (align === 'right' ? 'right' : 'left');
    ctx.textBaseline = 'top';
    if (align === 'center') x += fs * 0.05;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillText(str, x + 2, y + 2);
    ctx.fillStyle = color || '#f4f0e2';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ---------- 粒子系统 ----------
  function Effects() {
    this.list = [];
    this.numbers = [];
    this.shake = 0;
    this.shakeDecay = 0.86;
    this.flash = 0;
    this.flashColor = '#fff';
    this.overlay = null;
  }

  Effects.prototype.clear = function () {
    this.list.length = 0;
    this.numbers.length = 0;
    this.shake = 0;
    this.flash = 0;
    this.overlay = null;
  };

  Effects.prototype.add = function (p) {
    p.life = p.life || 30;
    p.maxLife = p.life;
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.x = p.x || 0;
    p.y = p.y || 0;
    p.rot = p.rot || 0;
    p.spin = p.spin || 0;
    p.grav = p.grav == null ? 0 : p.grav;
    this.list.push(p);
    if (this.list.length > 420) this.list.splice(0, 60);
    return p;
  };

  Effects.prototype.addNumber = function (x, y, text, color, big) {
    this.numbers.push({ x: x, y: y, text: text, color: color || '#fff', life: big ? 52 : 38, maxLife: big ? 52 : 38, vy: -1.1, big: !!big });
  };

  Effects.prototype.kick = function (power, color) {
    this.shake = Math.max(this.shake, power);
    if (color) { this.flash = Math.max(this.flash, Math.min(0.7, power / 26)); this.flashColor = color; }
  };

  // ---------- 常用小特效 ----------
  Effects.prototype.sparks = function (x, y, n, color, dir) {
    for (var i = 0; i < n; i++) {
      var a = dir == null ? rnd(0, Math.PI * 2) : dir + rnd(-0.9, 0.9);
      this.add({
        type: 'spark', x: x, y: y, life: rnd(12, 22),
        vx: Math.cos(a) * rnd(1.5, 6), vy: Math.sin(a) * rnd(1.5, 5) - 1,
        size: rnd(2, 5), color: color || '#ffe066'
      });
    }
  };

  Effects.prototype.ring = function (x, y, color, maxR, width, life) {
    this.add({ type: 'ring', x: x, y: y, color: color, life: life || 22, r: 6, maxR: maxR || 70, lw: width || 5 });
  };

  Effects.prototype.blockSpark = function (x, y, color) {
    this.add({ type: 'blockArc', x: x, y: y, life: 14, color: color || '#9fd6ff' });
    for (var i = 0; i < 8; i++) {
      this.add({
        type: 'spark', x: x, y: y, life: rnd(8, 16),
        vx: rnd(-3.4, 3.4), vy: rnd(-4, 1), size: rnd(2, 4), color: '#cfe9ff'
      });
    }
  };

  Effects.prototype.hitBurst = function (x, y, color, big) {
    this.add({ type: 'burst', x: x, y: y, life: big ? 20 : 14, size: big ? 46 : 28, color: color || '#fff2b0' });
    this.add({ type: 'burst', x: x, y: y, life: big ? 26 : 18, size: big ? 66 : 38, color: '#ffffff' });
    this.sparks(x, y, big ? 16 : 8, color || '#ffd166');
  };

  // ---------- 技能命名特效 ----------
  Effects.prototype.skillFx = function (kind, x, y, facing, theme) {
    var d = facing === 'right' ? -1 : 1; // 朝右时特效向左侧偏移
    var i, a;
    switch (kind) {
      case 'shock': // 命运动机：冲击波
        this.ring(x, y - 70, '#dfe6f5', 90, 7, 24);
        this.ring(x, y - 70, '#8fa6d8', 130, 4, 30);
        this.sparks(x, y - 70, 14, '#dfe6f5', d > 0 ? 0 : Math.PI);
        break;
      case 'impact':
        this.add({ type: 'burst', x: x, y: y - 70, life: 18, size: 60, color: '#ffe6a8' });
        this.ring(x, y - 70, '#ffcc66', 80, 6, 22);
        this.sparks(x, y - 70, 12, '#ffcc66');
        break;
      case 'notes': // 音符飞舞
        for (i = 0; i < 12; i++) {
          a = rnd(-0.4, Math.PI + 0.4);
          this.add({
            type: 'note', x: x + rnd(-30, 30), y: y - rnd(20, 110), life: rnd(30, 55),
            vx: Math.cos(a) * rnd(0.8, 2.4), vy: -rnd(0.8, 2.2),
            size: rnd(6, 11), color: pickOne(['#ffe066', '#7ee0c0', '#ffb0d0', '#a8d8ff'])
          });
        }
        this.ring(x, y - 60, '#ffe066', 70, 3, 26);
        break;
      case 'zzz':
        for (i = 0; i < 8; i++) {
          this.add({
            type: 'zzz', x: x + rnd(-25, 25), y: y - rnd(60, 130), life: rnd(40, 70),
            vx: rnd(0.4, 1.4), vy: -rnd(0.4, 1.0), size: rnd(9, 16), color: '#c7b8ff'
          });
        }
        break;
      case 'trail':
        for (i = 0; i < 16; i++) {
          this.add({
            type: 'streak', x: x + rnd(-40, 40), y: y - rnd(20, 110), life: rnd(10, 20),
            vx: -d * rnd(2, 6), vy: rnd(-0.6, 0.6), size: rnd(8, 26), color: pickOne(['#fff2b0', '#ffd166'])
          });
        }
        break;
      case 'shard': // 碎片 / 雨滴散射
        for (i = 0; i < 24; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'shard', x: x + Math.cos(a) * rnd(10, 70), y: y - 70 + Math.sin(a) * rnd(10, 60),
            life: rnd(18, 40), vx: Math.cos(a) * rnd(1, 3.2), vy: Math.sin(a) * rnd(1, 3) + 0.8,
            size: rnd(5, 13), rot: a, color: pickOne(['#cfeaff', '#9fd6ff', '#ffffff', '#a8e6d0'])
          });
        }
        this.add({ type: 'gcircle', x: x, y: y, life: 28, r: 10, maxR: 108, lw: 4, color: '#9fd6ff', grow: 0.22 });
        this.ring(x, y - 70, '#cfeaff', 92, 4, 26);
        break;
      case 'frost':
        for (i = 0; i < 26; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'shard', x: x + Math.cos(a) * rnd(10, 60), y: y - 70 + Math.sin(a) * rnd(10, 50),
            life: rnd(24, 50), vx: Math.cos(a) * rnd(1, 3.6), vy: Math.sin(a) * rnd(1, 3) - 1,
            size: rnd(5, 12), rot: a, color: pickOne(['#cfeaff', '#9fd6ff', '#ffffff'])
          });
        }
        this.ring(x, y - 70, '#bfe6ff', 100, 4, 30);
        break;
      case 'flame':
        for (i = 0; i < 30; i++) {
          this.add({
            type: 'flame', x: x + rnd(-38, 38), y: y - rnd(0, 120), life: rnd(16, 34),
            vx: rnd(-1, 1), vy: -rnd(1.4, 4), size: rnd(10, 24),
            color: pickOne(['#ffe066', '#ff9c33', '#ff5f2e'])
          });
        }
        this.ring(x, y - 60, '#ff9c33', 90, 6, 24);
        break;
      case 'chorus': // 合唱金光
        for (i = 0; i < 26; i++) {
          this.add({
            type: 'beam', x: x + rnd(-70, 70), y: y - 40, life: rnd(20, 40),
            w: rnd(6, 16), h: rnd(60, 150), color: pickOne(['#ffe9a8', '#ffd166', '#fff6d8'])
          });
        }
        this.ring(x, y - 70, '#ffe066', 150, 8, 30);
        this.ring(x, y - 70, '#ffffff', 100, 5, 22);
        for (i = 0; i < 10; i++) {
          this.add({ type: 'note', x: x + rnd(-50, 50), y: y - rnd(50, 140), life: rnd(30, 50), vy: -rnd(0.8, 1.8), size: rnd(8, 14), color: '#fff2b0' });
        }
        break;
      case 'waves':
        for (i = 0; i < 3; i++) {
          this.add({ type: 'ring', x: x, y: y - 70, color: i === 0 ? '#ffffff' : '#8fe6c8', life: 26 + i * 8, r: 10, maxR: 90 + i * 50, lw: 6 - i });
        }
        break;
      case 'chromatic':
        for (i = 0; i < 12; i++) {
          this.add({
            type: 'chroma', x: x + rnd(-40, 40), y: y - rnd(20, 120), life: rnd(18, 34),
            vx: d * rnd(1.5, 5), vy: rnd(-1, 1), size: rnd(6, 16),
            color: pickOne(['#e0b0ff', '#9c6ade', '#ffffff'])
          });
        }
        break;
      case 'ghost':
        for (i = 0; i < 14; i++) {
          this.add({
            type: 'ghost', x: x + rnd(-50, 50), y: y - rnd(20, 110), life: rnd(24, 44),
            vx: -d * rnd(1, 3), vy: rnd(-1.4, -0.2), size: rnd(14, 28), color: 'rgba(180,220,235,0.75)'
          });
        }
        break;
      case 'ragnarok':
        for (i = 0; i < 22; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'flame', x: x + Math.cos(a) * rnd(10, 80), y: y - 70 + Math.sin(a) * rnd(10, 60),
            life: rnd(20, 44), vx: Math.cos(a) * rnd(1, 3), vy: Math.sin(a) * rnd(1, 3) - 1,
            size: rnd(12, 30), color: pickOne(['#ff5f2e', '#ffb03a', '#7a2ecf'])
          });
        }
        for (i = 0; i < 5; i++) {
          this.add({ type: 'bolt', x: x + rnd(-70, 70), y: 40, life: rnd(8, 16), w: rnd(4, 9), h: rnd(120, 230), color: '#fff6c4' });
        }
        this.kick(16, '#ff8a3a');
        break;
      case 'torrent':
        for (i = 0; i < 24; i++) {
          this.add({
            type: 'streak', x: x + rnd(-60, 60), y: y - rnd(10, 130), life: rnd(12, 26),
            vx: -d * rnd(3, 9), vy: rnd(-1, 1), size: rnd(10, 34), color: pickOne(['#ffffff', '#a8c8ff', '#dfe6f5'])
          });
        }
        break;
      case 'matrix':
        for (i = 0; i < 12; i++) {
          this.add({
            type: 'glyph', x: x + rnd(-56, 56), y: y - rnd(10, 130), life: rnd(20, 40),
            vx: rnd(-1, 1), vy: -rnd(0.6, 2), size: rnd(10, 20),
            color: pickOne(['#ffe066', '#7ee0c0', '#e0b0ff', '#a8d8ff'])
          });
        }
        break;
      case 'circle':
        for (i = 0; i < 3; i++) {
          this.add({ type: 'ring', x: x, y: y - 70, color: i === 1 ? '#c9a227' : '#e0b0ff', life: 24 + i * 7, r: 8, maxR: 70 + i * 34, lw: 5 });
        }
        break;
      case 'confetti':
        for (i = 0; i < 40; i++) {
          this.add({
            type: 'confetti', x: x + rnd(-140, 140), y: y - rnd(120, 260), life: rnd(40, 80),
            vx: rnd(-1.6, 1.6), vy: rnd(1.2, 3.4), size: rnd(4, 9), rot: rnd(0, 6), spin: rnd(-0.3, 0.3),
            color: pickOne(['#ff6b8a', '#ffd166', '#7ee0c0', '#8fc7ff', '#e0b0ff', '#ffffff'])
          });
        }
        break;
      case 'ultimateAura':
        for (i = 0; i < 20; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'flare', x: x + Math.cos(a) * rnd(20, 70), y: y - 70 + Math.sin(a) * rnd(20, 60),
            life: rnd(18, 36), vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4 - 0.6,
            size: rnd(10, 26), color: '#fff2b0'
          });
        }
        break;

      // ---------- 新机制「领域」：地面魔法阵向上展开 ----------
      case 'fieldRise':
        this.add({ type: 'gcircle', x: x, y: y, life: 40, r: 16, maxR: 168, lw: 6, color: '#7ee0c0', grow: 0.14 });
        this.add({ type: 'gcircle', x: x, y: y, life: 46, r: 8, maxR: 120, lw: 3, color: '#ffffff', grow: 0.18 });
        for (i = 0; i < 16; i++) {
          this.add({
            type: 'shaft', x: x + rnd(-110, 110), y: y, life: rnd(26, 54),
            w: rnd(5, 13), h: rnd(50, 150), color: pickOne(['#7ee0c0', '#a8f0d8', '#ffffff'])
          });
        }
        for (i = 0; i < 8; i++) {
          this.add({
            type: 'glyphLine', x: x + rnd(-80, 80), y: y - rnd(10, 60), life: rnd(24, 46),
            vy: -rnd(0.6, 1.6), size: rnd(8, 14), color: pickOne(['#ffe066', '#7ee0c0', '#ffffff'])
          });
        }
        break;

      // ---------- 新机制「回声」：召唤魔法阵 + 虚影入场 ----------
      case 'echoCall':
        this.add({ type: 'gcircle', x: x, y: y, life: 34, r: 10, maxR: 96, lw: 5, color: '#c8a2ff', grow: 0.2 });
        for (i = 0; i < 18; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'spark', x: x + Math.cos(a) * 30, y: y - 60 + Math.sin(a) * 30,
            life: rnd(14, 30), vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6 - 1,
            size: rnd(2, 6), color: pickOne(['#c8a2ff', '#ffffff', '#a8d8ff'])
          });
        }
        this.ring(x, y - 66, '#c8a2ff', 110, 4, 26);
        break;

      case 'echoAppear':
        this.add({ type: 'gcircle', x: x, y: y, life: 22, r: 6, maxR: 62, lw: 4, color: '#c8a2ff', grow: 0.24 });
        break;

      case 'echoStrike':
        this.add({ type: 'burst', x: x, y: y - 70, life: 16, size: 42, color: '#e0d0ff' });
        this.ring(x, y - 70, '#c8a2ff', 74, 5, 20);
        this.sparks(x, y - 70, 10, '#e0d0ff');
        break;

      // ---------- 羁绊 / 免疫护罩 ----------
      case 'bondShield':
        this.add({ type: 'shell', x: x, y: y - 62, life: 34, size: 78, color: '#ffe066' });
        this.add({ type: 'gcircle', x: x, y: y, life: 30, r: 10, maxR: 96, lw: 5, color: '#ffe066', grow: 0.22 });
        for (i = 0; i < 14; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'flare', x: x + Math.cos(a) * 40, y: y - 62 + Math.sin(a) * 50,
            life: rnd(18, 34), vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.8,
            size: rnd(8, 18), color: '#ffe066'
          });
        }
        break;

      // ---------- v4.2「回旋」体系共鸣：反弹护盾 ----------
      case 'rondoShield':
        this.add({ type: 'shell', x: x, y: y - 62, life: 30, size: 84, color: '#ff5b5b' });
        this.add({ type: 'gcircle', x: x, y: y, life: 26, r: 12, maxR: 104, lw: 4, color: '#ff5b5b', grow: 0.2 });
        for (i = 0; i < 10; i++) {
          a = rnd(0, Math.PI * 2);
          this.add({
            type: 'shard', x: x + Math.cos(a) * 44, y: y - 62 + Math.sin(a) * 58,
            life: rnd(14, 26), vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.9 - 0.4,
            size: rnd(4, 9), rot: rnd(0, 6), color: '#ff8a8a'
          });
        }
        break;

      case 'rondoReflect':
        this.add({ type: 'shell', x: x, y: y - 62, life: 22, size: 92, color: '#ff5b5b' });
        this.add({ type: 'blockArc', x: x, y: y - 70, life: 18, color: '#ffd2d2' });
        this.add({ type: 'burst', x: x, y: y - 70, life: 16, size: 52, color: '#ff5b5b' });
        this.add({ type: 'arrow', x: x + 34, y: y - 70, life: 20, size: 26, color: '#ff8a8a', flip: true });
        for (i = 0; i < 12; i++) {
          this.add({
            type: 'shard', x: x + rnd(-26, 26), y: y - rnd(40, 110), life: rnd(10, 22),
            vx: rnd(-3.4, 3.4), vy: rnd(-3.0, 0.6), size: rnd(5, 11), rot: rnd(0, 6),
            color: pickOne(['#ff5b5b', '#ffb0b0', '#ffffff'])
          });
        }
        break;

      case 'blockImmune':
        this.add({ type: 'shell', x: x, y: y - 62, life: 20, size: 58, color: '#9fd6ff' });
        this.add({ type: 'blockArc', x: x, y: y - 70, life: 16, color: '#dff0ff' });
        for (i = 0; i < 10; i++) {
          this.add({
            type: 'shard', x: x + rnd(-20, 20), y: y - rnd(40, 100), life: rnd(10, 20),
            vx: rnd(-2.5, 2.5), vy: rnd(-2.5, 0.6), size: rnd(4, 9), rot: rnd(0, 6), color: '#cfe9ff'
          });
        }
        break;

      case 'guardBreak':
        this.add({ type: 'burst', x: x, y: y - 70, life: 14, size: 40, color: '#ff9c9c' });
        for (i = 0; i < 10; i++) {
          this.add({
            type: 'shard', x: x + rnd(-24, 24), y: y - rnd(40, 110), life: rnd(10, 22),
            vx: rnd(-3, 3), vy: rnd(-3, 0.5), size: rnd(5, 11), rot: rnd(0, 6), color: pickOne(['#ff9c9c', '#ffd166', '#ffffff'])
          });
        }
        break;

      // ---------- 新体系一「乐章」：五线谱与拍点 ----------
      case 'movementRise':
        this.add({ type: 'staff', x: x, y: y - 96, life: 46, w: 130, h: 30, color: '#ffe066' });
        for (i = 0; i < 10; i++) {
          this.add({
            type: 'note', x: x + rnd(-50, 50), y: y - rnd(40, 130), life: rnd(26, 50),
            vx: rnd(-0.8, 0.8), vy: -rnd(0.8, 2.0), size: rnd(7, 12), color: pickOne(['#ffe066', '#7ee0c0', '#ffffff'])
          });
        }
        this.add({ type: 'gcircle', x: x, y: y, life: 26, r: 8, maxR: 84, lw: 4, color: '#ffe066', grow: 0.24 });
        break;

      case 'movementBeat':
        this.add({ type: 'batons', x: x, y: y - 84, life: 20, size: 30, color: '#ffe066' });
        this.add({ type: 'burst', x: x + 40, y: y - 78, life: 14, size: 34, color: '#fff2b0' });
        for (i = 0; i < 8; i++) {
          this.add({
            type: 'note', x: x + rnd(-30, 60), y: y - rnd(50, 120), life: rnd(16, 32),
            vx: rnd(-1.2, 2.2), vy: -rnd(0.6, 1.6), size: rnd(6, 11), color: '#ffe066'
          });
        }
        break;

      // ---------- 新体系二「回旋」：甩出与折返 ----------
      case 'rondoCall':
        this.add({ type: 'arrow', x: x + 34, y: y - 78, life: 24, size: 30, color: '#9fd6ff', flip: false });
        for (i = 0; i < 10; i++) {
          this.add({
            type: 'streak', x: x + rnd(20, 90), y: y - rnd(40, 110), life: rnd(12, 22),
            vx: rnd(1, 4), vy: rnd(-0.6, 0.6), size: rnd(8, 22), color: pickOne(['#9fd6ff', '#ffffff'])
          });
        }
        this.add({ type: 'ring', x: x + 40, y: y - 78, color: '#9fd6ff', life: 22, r: 8, maxR: 76, lw: 4 });
        break;

      case 'rondoTurn':
        this.add({ type: 'arrow', x: x, y: y, life: 18, size: 26, color: '#ffd166', flip: true });
        this.add({ type: 'ring', x: x, y: y, color: '#ffd166', life: 20, r: 6, maxR: 54, lw: 4 });
        break;

      case 'rondoBack':
        this.add({ type: 'arrow', x: x, y: y, life: 20, size: 28, color: '#ff9c9c', flip: true });
        for (i = 0; i < 8; i++) {
          this.add({
            type: 'streak', x: x - rnd(10, 70), y: y - rnd(40, 110), life: rnd(10, 20),
            vx: -rnd(1, 4), vy: rnd(-0.6, 0.6), size: rnd(8, 20), color: pickOne(['#ff9c9c', '#ffd166'])
          });
        }
        break;

      // ---------- 新体系三「卡农」：模仿声部 ----------
      case 'canonMark':
        this.add({ type: 'staff', x: x, y: y - 116, life: 44, w: 96, h: 22, color: '#c8a2ff' });
        this.add({ type: 'gcircle', x: x, y: y, life: 30, r: 10, maxR: 96, lw: 5, color: '#c8a2ff', grow: 0.2 });
        for (i = 0; i < 12; i++) {
          this.add({
            type: 'note', x: x + rnd(-46, 46), y: y - rnd(30, 120), life: rnd(22, 44),
            vx: rnd(-1, 1), vy: -rnd(0.8, 1.8), size: rnd(7, 12),
            color: pickOne(['#c8a2ff', '#e0d0ff', '#ffffff'])
          });
        }
        break;

      case 'canonEcho':
        this.add({ type: 'burst', x: x, y: y - 70, life: 16, size: 40, color: '#c8a2ff' });
        this.add({ type: 'ring', x: x, y: y - 70, color: '#c8a2ff', life: 22, r: 8, maxR: 70, lw: 4 });
        this.add({ type: 'arrow', x: x - 26, y: y - 70, life: 16, size: 22, color: '#e0d0ff', flip: true });
        for (i = 0; i < 7; i++) {
          this.add({
            type: 'note', x: x + rnd(-24, 24), y: y - rnd(50, 110), life: rnd(16, 30),
            vx: rnd(-1.4, 1.4), vy: -rnd(0.8, 2.0), size: rnd(6, 11), color: '#c8a2ff'
          });
        }
        break;
    }
    void theme;
  };

  Effects.prototype.update = function () {
    var i, p;
    for (i = this.list.length - 1; i >= 0; i--) {
      p = this.list[i];
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      if (p.spin) p.rot += p.spin;
      if (p.maxR) p.r += (p.maxR - p.r) * (p.grow == null ? 0.22 : p.grow);
      if (p.life <= 0) this.list.splice(i, 1);
    }
    for (i = this.numbers.length - 1; i >= 0; i--) {
      p = this.numbers[i];
      p.life--;
      p.y += p.vy;
      p.vy *= 0.94;
      if (p.life <= 0) this.numbers.splice(i, 1);
    }
    this.shake *= this.shakeDecay;
    if (this.shake < 0.16) this.shake = 0;
    this.flash *= 0.9;
    if (this.flash < 0.01) this.flash = 0;
  };

  Effects.prototype.draw = function (ctx) {
    var i, p, a;
    for (i = 0; i < this.list.length; i++) {
      p = this.list[i];
      a = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      switch (p.type) {
        case 'spark':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
        case 'burst':
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color;
          var s = p.size * (1.5 - a * 0.5);
          ctx.beginPath();
          for (var k = 0; k < 8; k++) {
            var ang = k * Math.PI / 4;
            var rad = (k % 2 === 0 ? s : s * 0.45);
            var px = p.x + Math.cos(ang) * rad, py = p.y + Math.sin(ang) * rad;
            if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
          break;
        case 'ring':
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.lw * a);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'blockArc':
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 30, -Math.PI * 0.7, Math.PI * 0.7);
          ctx.stroke();
          break;
        case 'note':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.55, p.size * 0.42, -0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(p.x + p.size * 0.35, p.y - p.size * 2, 2, p.size * 2);
          ctx.fillRect(p.x + p.size * 0.35, p.y - p.size * 2, p.size * 0.7, 2);
          break;
        case 'zzz':
          drawText(ctx, 'Z', p.x, p.y, Math.max(2, Math.round(p.size / 5)), 'rgba(199,184,255,' + a.toFixed(2) + ')');
          break;
        case 'streak':
          ctx.globalAlpha = a * 0.8;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, 3);
          break;
        case 'shard':
          ctx.globalAlpha = a;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.5, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.5, 0);
          ctx.closePath(); ctx.fill();
          break;
        case 'flame':
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.6, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'beam':
          ctx.globalAlpha = a * 0.55;
          ctx.fillStyle = p.color;
          rr(ctx, p.x, p.y - p.h * (1 - a) - p.h * 0.5, p.w, p.h, 3);
          break;
        case 'chroma':
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, 2);
          ctx.fillRect(p.x + 3, p.y + 4, p.size * 0.7, 2);
          break;
        case 'ghost':
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, Math.PI, 0);
          ctx.lineTo(p.x + p.size * 0.5, p.y + p.size * 0.5);
          ctx.lineTo(p.x, p.y + p.size * 0.3);
          ctx.lineTo(p.x - p.size * 0.5, p.y + p.size * 0.5);
          ctx.closePath(); ctx.fill();
          break;
        case 'bolt':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          var by = p.y, bx = p.x, seg = p.h / 6;
          for (var b = 0; b < 6; b++) {
            ctx.fillRect(bx + (b % 2 ? 4 : -4), by + b * seg, p.w, seg + 1);
          }
          break;
        case 'glyph':
          drawText(ctx, pickOne(['0', '1', '2', '5', '7', '9', 'X', 'Z']), p.x, p.y, Math.max(1, Math.round(p.size / 5)), p.color);
          break;
        case 'confetti':
          ctx.globalAlpha = a;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
          break;
        case 'flare':
          ctx.globalAlpha = a * 0.8;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size * 0.35, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size * 0.35, p.y);
          ctx.closePath(); ctx.fill();
          break;
        case 'gcircle':   // 地面魔法阵
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.lw * a);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * 0.30, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.35;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 0.62, p.r * 0.19, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'shaft':     // 上升光柱
          ctx.globalAlpha = a * 0.42;
          ctx.fillStyle = p.color;
          var sh = p.h * a;
          rr(ctx, p.x - p.w / 2, p.y - sh, p.w, sh, 3);
          break;
        case 'glyphLine': // 音符行
          drawText(ctx, pickOne(['-', '+', '?', '1', '2', '3', '5', '7']), p.x, p.y, Math.max(1, Math.round(p.size / 5)), p.color);
          break;
        case 'shell':     // 护罩外壳（六边形）
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3 + 2 * a;
          ctx.beginPath();
          for (var h = 0; h < 6; h++) {
            var ha = -Math.PI / 2 + h * Math.PI / 3;
            var hx2 = p.x + Math.cos(ha) * p.size * 0.5;
            var hy2 = p.y + Math.sin(ha) * p.size * 0.62;
            if (h === 0) ctx.moveTo(hx2, hy2); else ctx.lineTo(hx2, hy2);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.18;
          ctx.fillStyle = p.color;
          ctx.fill();
          break;
        case 'staff':     // 五线谱（乐章 / 卡农）
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          var sy0 = p.y - p.h / 2;
          for (var ln = 0; ln < 5; ln++) {
            var ly = sy0 + ln * (p.h / 4);
            ctx.beginPath();
            ctx.moveTo(p.x - p.w / 2, ly);
            ctx.lineTo(p.x + p.w / 2, ly);
            ctx.stroke();
          }
          // 谱号示意（一个实心块）
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.w / 2 + 4, sy0, 4, p.h);
          break;
        case 'batons':    // 指挥棒扫过的轨迹
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, -Math.PI * 0.75, Math.PI * 0.35);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.66, -Math.PI * 0.6, Math.PI * 0.2);
          ctx.stroke();
          break;
        case 'arrow':     // 回旋的方向指示
          ctx.globalAlpha = a * 0.9;
          ctx.fillStyle = p.color;
          var dir = p.flip ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(p.x + dir * p.size * 0.5, p.y);
          ctx.lineTo(p.x - dir * p.size * 0.4, p.y - p.size * 0.42);
          ctx.lineTo(p.x - dir * p.size * 0.4, p.y + p.size * 0.42);
          ctx.closePath(); ctx.fill();
          break;
      }
      ctx.restore();
    }
  };

  Effects.prototype.drawNumbers = function (ctx) {
    for (var i = 0; i < this.numbers.length; i++) {
      var n = this.numbers[i];
      var a = Math.min(1, n.life / (n.maxLife * 0.5));
      ctx.globalAlpha = a;
      drawText(ctx, n.text, n.x, n.y, n.big ? 4 : 3, '#000', 'center');
      drawText(ctx, n.text, n.x - (n.big ? 1 : 1), n.y - (n.big ? 1 : 1), n.big ? 4 : 3, n.color, 'center');
      ctx.globalAlpha = 1;
    }
  };

  global.FX = {
    Effects: Effects,
    drawText: drawText,
    drawTextAuto: drawTextAuto,
    hasCJK: hasCJK,
    textWidth: textWidth,
    rr: rr,
    rnd: rnd,
    pickOne: pickOne
  };
})(window);

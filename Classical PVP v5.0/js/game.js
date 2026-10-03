/* ============================================================
   game.js — 对战引擎：操控 / 技能 / 判定 / 血条 / 轮换赛制
   玩家永远在左侧，右侧由 AI 操作
   ============================================================ */
(function (global) {
  'use strict';

  var FXM = global.FX;
  var drawText = FXM.drawText;
  var drawTextAuto = FXM.drawTextAuto;   // 含中文时自动切换矢量字体
  var rr = FXM.rr;

  var W = 960, H = 540;
  var GROUND = 468;
  // 3.0：大幅扩大可移动范围（原先在画面中线附近就会被挡住）
  var WALK_MARGIN = 70;
  var LEFT_MIN = WALK_MARGIN;
  var LEFT_MAX = W - WALK_MARGIN - 74;
  var RIGHT_MIN = WALK_MARGIN + 74;
  var RIGHT_MAX = W - WALK_MARGIN;
  var ROUND_TIME = 60;
  var SPRITE_SCALE = 1.12;
  var GRAVITY = 0.62;
  var VERSION_TEXT = 'Version 5.0';   // 标题画面右下角版本号
  // 平衡性微调：领域伤害整体下调（v2.1）
  var FIELD_DAMAGE_SCALE = 0.8;
  // 领域减速的下限倍率：无论面板写多低，都不会慢到无法接近对手
  var FIELD_SLOW_FLOOR = 0.5;
  // v4.2 平衡：全体角色造成的伤害统一下调（共鸣增伤仍按下调后的数值做乘区）
  var DAMAGE_SCALE = 0.8;
  // v4.2：开局终极技初始冷却 6 秒（双方一致，按实际交战时间计算）
  var ULT_OPENING_CD = 6 * 60;
  // v4.2 跳跃：以“最高点高度”为目标反推初速度，
  // 最高点刚好能让判定盒越过对手的投掷类技能（如贝多芬的 Q）。
  // 实测标定（tools/combat-test.mjs 第 11 节，取速度最低的角色做最坏情况）：
  //   130px → 15 个投掷技里 2 个完全跳不过去
  //   138px → 全部投掷技都能跳过去，其中 13/15 留有余量
  //   150px → 全部留有余量，但会连多段技能的垂直判定也一起躲掉（判定上限是 150）
  // 因此以 138px 为“最慢角色”的基准高度（最快角色约 143px）：
  // 只影响投掷物，不改变近战 / 技能的既有判定。
  var JUMP_APEX = 138;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function approach(v, t, s) {
    if (v < t) return Math.min(t, v + s);
    if (v > t) return Math.max(t, v - s);
    return v;
  }
  /** 判定盒：以角色中心为基准的正方形区域 */
  function fighterBox(f) {
    var w = 46 * f.c.sprite.bulk;
    var h = 106 * (f.c.sprite.height || 1);
    return { w: w, h: h, cx: f.x, cy: f.y - h * 0.52 };
  }
  function boxHit(a, b) {
    return Math.abs(a.cx - b.cx) * 2 < (a.w + b.w) && Math.abs(a.cy - b.cy) * 2 < (a.h + b.h);
  }

  // =========================================================
  //  键位（v4.0：取消左右惯用手方案，统一使用原键位）
  // =========================================================
  var KEYMAP = {
    KeyA: 'punch', KeyD: 'kick', KeyQ: 's1', KeyW: 's2', KeyE: 'ult',
    KeyS: 'block', KeyI: 'up', KeyJ: 'left', KeyK: 'down', KeyL: 'right',
    KeyM: 'mute', KeyR: 'restart', KeyP: 'clear', KeyO: 'settings',
    Enter: 'start', Space: 'start', NumpadEnter: 'start'
  };
  var KEY_HINT = '移动 I J K L　挥拳 A　踢腿 D　技能 Q W　终极 E　格挡 S（按住）';

  function loadSettings() {
    var def = { muted: false, sfx: true };
    try {
      var raw = global.localStorage && global.localStorage.getItem('ccb_settings');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o.muted === 'boolean') def.muted = o.muted;
        // v5.0：对战音效开关（旧存档没有这个字段时默认开启）
        if (o && typeof o.sfx === 'boolean') def.sfx = o.sfx;
      }
    } catch (e) { /* 无 localStorage 时使用默认值 */ }
    return def;
  }
  function saveSettings(s) {
    try {
      if (global.localStorage) global.localStorage.setItem('ccb_settings', JSON.stringify(s));
    } catch (e) { /* 忽略 */ }
  }

  // ---------- 对战音效开关（v5.0）----------
  // 统一走这两个包装，避免各处直接猜音频引擎的方法名（引擎里 toggleSfx / sfxEnabled
  // 是可选的，写错就是运行时 TypeError）
  function sfxEnabled() {
    return global.Chiptune.sfxEnabled ? global.Chiptune.sfxEnabled() : true;
  }
  function toggleSfx() {
    if (global.Chiptune.toggleSfx) return global.Chiptune.toggleSfx();
    if (global.Chiptune.setSfxEnabled) return global.Chiptune.setSfxEnabled(!sfxEnabled());
    return true;
  }

  // =========================================================
  //  战斗单位
  // =========================================================
  function Fighter(composer, side, index) {
    this.c = composer;
    this.side = side;
    this.facing = side === 'left' ? 'right' : 'left';
    this.idx = index;
    this.maxHp = composer.maxHp;
    this.hp = this.maxHp;
    this.dead = false;
    this.cd = [0, 0, 0];
    // 羁绊共鸣标记（整场有效，开局计算；回合切换时不清除）
    this.bondEra = null;
    this.bondRegion = null;
    this.bondSystem = null;
    // v5.0 红色「节拍」体系共鸣：挥拳 / 踢腿的动画推进倍率（1 = 正常速度）
    this.basicSpeed = 1;
    this.tickAcc = 0;    // 动画推进用的浮点累加器，避免 tick 变成小数
    this.resetRoundState();
  }

  Fighter.prototype.resetRoundState = function () {
    this.state = 'idle';
    this.tick = 0;
    this.x = this.side === 'left' ? 300 : W - 300;
    this.y = GROUND;
    this.vx = 0; this.vy = 0;
    this.ix = 0; this.iy = 0;
    this.onGround = true;
    this.blocking = false;
    this.guardHit = 0;
    this.guardFlash = 0;
    this.bondTimer = global.rollRegionInterval();  // 黄色羁绊：6~15 秒随机触发一次
    this.bondShield = 0;                            // 免疫剩余帧（仅用于显示）
    this.rondoTimer = global.SYSTEM_BOND.rondoInterval;  // 回旋：每 7 秒掷一次反弹护盾
    this.rondoShield = 0;                                // 回旋：反弹护盾剩余帧
    this.loopTimer = global.SYSTEM_BOND.loopInterval;     // 循环：每 7 秒回复 18% 已损失生命
    // 注意：bondEra / bondRegion / bondSystem 是整场比赛的属性，不在这里清除
    this.canon = null;                              // 卡农：延后重奏的持续状态
    this.freeMove = 0;                              // 乐章连奏期间不被招式动画锁住
    this.hitUsed = false;
    this.dash = null;
    this.multi = null;
    this.pendingHit = null;
    this.pendingStatus = null;
    this.stun = 0;
    this.invuln = 0;
    this.armor = null;
    this.buff = null;
    this.shield = 0;
    this.slow = null;
    this.dance = null;
    this.weaken = null;
    this.curse = null;
    this.bleed = null;
    this.lifesteal = 0;
    this.lifestealT = -1;      // 吸血剩余帧（-1 = 无期限；v4.2.1 起技能吸血有持续时间）
    this.flash = 0;
  };

  Fighter.prototype.speedValue = function () {
    var s = 2.05 + this.c.stats.speed * 0.055;
    if (this.slow) s *= (this.slow.power == null ? 0.55 : this.slow.power);
    if (this.buff) s *= (1 + (this.buff.speed || 0));
    // 红色「领域」体系共鸣：移动速度 +30%
    if (this.bondSystem === '领域') s *= (1 + global.SYSTEM_BOND.speedBonus);
    return s;
  };
  // 跳跃：v4.2 改为按“目标最高点”反推初速度。
  // 离散积分（每帧先 vy += GRAVITY 再 y += vy）的真实顶点为
  //   h = v²/(2g) - v/2
  // 反解得 v = (g + √(g² + 8gh)) / 2，据此可精确控制跳跃最高点，
  // 让最高点刚好越过对手的投掷类技能（敏捷角色略高一点）。
  Fighter.prototype.jumpApex = function () {
    // 速度最低（11）的角色也有 138px，速度最高（24）约 143px
    return JUMP_APEX + (this.c.stats.speed - 11) * 0.4;
  };
  Fighter.prototype.jumpPower = function () {
    var h = this.jumpApex();
    return (GRAVITY + Math.sqrt(GRAVITY * GRAVITY + 8 * GRAVITY * h)) / 2;
  };
  Fighter.prototype.damageMul = function () {
    var m = 0.82 + this.c.stats.power * 0.024;
    if (this.buff) m *= (1 + (this.buff.power || 0));
    if (this.weaken) m *= (1 - this.weaken.power);
    // 绿色（时期）羁绊共鸣：伤害 +15%
    if (this.bondEra) m *= (1 + global.BOND.eraDamage);
    return m;
  };
  Fighter.prototype.setAnim = function (st, force) {
    if (this.state === st && !force) return;
    this.state = st;
    this.tick = 0;
  };
  Fighter.prototype.bodyBox = function () { return fighterBox(this); };

  // =========================================================
  //  游戏主体
  // =========================================================
  function Game(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.fx = new FXM.Effects();
    this.input = {};
    this.wasDown = {};
    this.wasDownPrev = {};
    this.t = 0;
    this.uiIndex = 0;
    this.selSlots = [null, null, null];
    this.selFocus = 0;
    this.playerTeam = [];
    this.enemyTeam = [];
    this.projectiles = [];
    this.fields = [];       // 新机制一：领域
    this.echoes = [];       // 新机制二：回声虚影
    this.movements = [];    // 新体系一：乐章（自动连奏的多段乐句）
    this.canonQueue = [];   // 新体系三：卡农（延后重奏队列）
    this.playerBonds = null;
    this.enemyBonds = null;
    this.roundNo = 0;
    this.banner = null;
    this.nowPlaying = '';
    this.stars = [];
    for (var i = 0; i < 64; i++) {
      this.stars.push({ x: rnd(0, W), y: rnd(0, 300), s: rnd(0.6, 1.8), p: rnd(0, 6.28) });
    }
    this.titleNotes = [];
    for (var n = 0; n < 16; n++) {
      this.titleNotes.push({
        x: rnd(0, W), y: rnd(0, H), vy: rnd(0.3, 1.0), size: rnd(8, 18),
        color: ['#ffe066', '#7ee0c0', '#ff9cc0', '#a8d8ff'][n % 4]
      });
    }
    this.playT = 0;
    this.seedTracks();
    this.settings = loadSettings();
    this.settingsIndex = 0;
    this.settingsFrom = 'title';
    this.state = 'title';
    this.ai = new global.AIController(this);
    if (global.Chiptune.setMuted) global.Chiptune.setMuted(this.settings.muted);
    // v5.0：把「对战音效」开关同步给音频引擎（存档里没有该字段时默认开启）
    if (global.Chiptune.setSfxEnabled) global.Chiptune.setSfxEnabled(this.settings.sfx !== false);
    // 同时把状态写回 settings，界面上显示的就是引擎的真实状态
    this.settings.sfx = sfxEnabled();
  }

  Game.prototype.seedTracks = function () {
    this.trackOrder = [];
    for (var i = 0; i < global.Chiptune.trackCount(); i++) this.trackOrder.push(i);
    for (var j = this.trackOrder.length - 1; j > 0; j--) {
      var k = (Math.random() * (j + 1)) | 0;
      var t = this.trackOrder[j]; this.trackOrder[j] = this.trackOrder[k]; this.trackOrder[k] = t;
    }
    this.trackPtr = 0;
  };

  Game.prototype.nextTrack = function () {
    var idx = this.trackOrder[this.trackPtr % this.trackOrder.length];
    this.trackPtr++;
    var t = global.Chiptune.playTrack(idx, { force: true });
    this.nowPlaying = t ? t.title : '';
    return t;
  };

  // =========================================================
  //  输入
  // =========================================================
  Game.prototype.keyAction = function (code) {
    return KEYMAP[code] || null;
  };

  Game.prototype.bindInput = function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      var a = self.keyAction(e.code);
      if (a) e.preventDefault();
      if (!a) return;
      self.input[a] = true;
      global.Chiptune.resume();
    });
    window.addEventListener('keyup', function (e) {
      var a = self.keyAction(e.code);
      if (!a) return;
      self.input[a] = false;
    });
    window.addEventListener('blur', function () { self.input = {}; self.wasDownPrev = {}; });
  };

  /** 刷新页面底部的按键说明栏 */
  Game.prototype.refreshHelpBar = function () {
    var el = global.document && global.document.getElementById('helpbar');
    if (!el) return;
    var kb = function (k) { return '<span class="kb">' + k + '</span>'; };
    var html = kb('I') + '上 ' + kb('J') + '左 ' + kb('K') + '下 ' + kb('L') + '右';
    html += ' <span class="sep">|</span> ' + kb('A') + '挥拳 ' + kb('D') + '踢腿 ';
    html += kb('Q') + '技能1 ' + kb('W') + '技能2 ' + kb('E') + '终极技 ' + kb('S') + '格挡（按住）';
    html += ' <span class="sep">|</span> ' + kb('R') + '重新开始 ' + kb('O') + '设置 ' + kb('M') + '静音';
    el.innerHTML = html;
  };

  /** 本帧刚按下（与上一帧比较） */
  Game.prototype.pressed = function (a) {
    return !!this.input[a] && !this.wasDownPrev[a];
  };

  Game.prototype.latch = function () {
    this.wasDownPrev = {};
    for (var k in this.input) if (this.input[k]) this.wasDownPrev[k] = true;
  };

  // =========================================================
  //  每帧更新
  // =========================================================
  Game.prototype.update = function () {
    this.t++;

    if (this.pressed('mute')) {
      var m = global.Chiptune.toggleMute();
      this.settings.muted = m;
      saveSettings(this.settings);
      if (this.state !== 'settings') this.banner = { text: m ? '静音 开' : '静音 关', life: 40 };
    }
    // O 键：在标题菜单与选人界面打开设置
    if (this.pressed('settings') && (this.state === 'title' || this.state === 'select' || this.state === 'settings')) {
      if (this.state === 'settings') this.closeSettings();
      else this.openSettings();
    }
    if (this.state === 'settings') {
      this.updateSettings();
    } else if (this.pressed('restart') && this.state !== 'title' && this.state !== 'select') {
      this.state = 'select';
      this.selSlots = [null, null, null];
      this.selFocus = 0;
      this.uiIndex = 0;
      this.playerTeam = [];
      this.enemyTeam = [];
      this.projectiles = [];
      this.fx.clear();
      this.t = 0;
    } else {
      switch (this.state) {
        case 'title': this.updateTitle(); break;
        case 'select': this.updateSelect(); break;
        case 'vs': this.updateVs(); break;
        case 'fight': this.updateFight(); break;
        case 'roundover': this.updateRoundOver(); break;
        case 'result': this.updateResult(); break;
        case 'settings': this.updateSettings(); break;
      }
    }

    for (var i = 0; i < this.titleNotes.length; i++) {
      var tn = this.titleNotes[i];
      tn.y -= tn.vy;
      if (tn.y < -20) { tn.y = H + 20; tn.x = rnd(0, W); }
    }

    this.fx.update();
    if (this.banner) {
      this.banner.life--;
      if (this.banner.life <= 0) this.banner = null;
    }
    this.latch();
  };

  // ------------------ 设置界面（O 键，可从标题与选人界面打开）------------------
  Game.prototype.openSettings = function () {
    this.settingsFrom = this.state === 'settings' ? this.settingsFrom : this.state;
    this.state = 'settings';
    this.settingsIndex = 0;
    global.Chiptune.sfx('confirm');
  };

  Game.prototype.closeSettings = function () {
    this.state = this.settingsFrom || 'title';
    this.t = 0;
    global.Chiptune.sfx('select');
  };

  Game.prototype.updateSettings = function () {
    var opts = 3;   // 0 静音 / 1 对战音效 / 2 返回
    if (this.pressed('up')) { this.settingsIndex = (this.settingsIndex - 1 + opts) % opts; global.Chiptune.sfx('select'); }
    if (this.pressed('down')) { this.settingsIndex = (this.settingsIndex + 1) % opts; global.Chiptune.sfx('select'); }
    var lr = 0;
    if (this.pressed('right')) lr = 1;
    if (this.pressed('left')) lr = -1;
    if (this.settingsIndex === 0 && lr !== 0) {
      var m = global.Chiptune.toggleMute();
      this.settings.muted = m;
      saveSettings(this.settings);
      global.Chiptune.sfx('confirm');
    }
    if (this.settingsIndex === 1 && lr !== 0) {
      var on = toggleSfx();
      this.settings.sfx = on;
      saveSettings(this.settings);
      global.Chiptune.sfx('confirm');
    }
    if (this.pressed('start') || this.pressed('punch') || this.pressed('kick')) {
      if (this.settingsIndex === 0) {
        var m2 = global.Chiptune.toggleMute();
        this.settings.muted = m2;
        saveSettings(this.settings);
        global.Chiptune.sfx('confirm');
      } else if (this.settingsIndex === 1) {
        var on2 = toggleSfx();
        this.settings.sfx = on2;
        saveSettings(this.settings);
        global.Chiptune.sfx('confirm');
      } else {
        this.closeSettings();
      }
    }
  };

  // ------------------ 标题 ------------------
  Game.prototype.updateTitle = function () {
    if (this.pressed('start') || this.pressed('punch')) {
      this.state = 'select';
      this.t = 0;
      global.Chiptune.resume();
      global.Chiptune.sfx('confirm');
      if (!global.Chiptune.playing) this.nextTrack();
    }
  };

  // ------------------ 选人 ------------------
  Game.prototype.updateSelect = function () {
    var n = global.COMPOSERS.length;
    var old = this.uiIndex;
    var local = this.uiIndex % SEL_PER_PAGE;
    var col = local % SEL_COLS, row = (local / SEL_COLS) | 0;
    if (this.pressed('right')) {
      if (col === SEL_COLS - 1) this.uiIndex = Math.min(n - 1, (this.selPage() + 1) * SEL_PER_PAGE + row * SEL_COLS);
      else this.uiIndex = (this.uiIndex + 1) % n;
    } else if (this.pressed('left')) {
      if (col === 0) {
        var prevBase = (this.selPage() - 1) * SEL_PER_PAGE;
        if (prevBase >= 0) this.uiIndex = Math.min(n - 1, prevBase + row * SEL_COLS + SEL_COLS - 1);
      } else this.uiIndex = (this.uiIndex - 1 + n) % n;
    } else if (this.pressed('down')) {
      var nextRow = row + 1;
      if (nextRow >= SEL_ROWS) nextRow = 0;
      var cand = this.selPage() * SEL_PER_PAGE + nextRow * SEL_COLS + col;
      this.uiIndex = cand < n ? cand : col;
    } else if (this.pressed('up')) {
      var prevRow = row - 1;
      if (prevRow < 0) prevRow = SEL_ROWS - 1;
      var cand2 = this.selPage() * SEL_PER_PAGE + prevRow * SEL_COLS + col;
      this.uiIndex = cand2 < n ? cand2 : (n - 1);
    }
    // Q / E 翻页：必须按“当前列”而不是“当前页末尾”来算，
    // 否则在最后一页按 Q 会把光标顶到全体最后一位（v5.0 之前 50 人两页时
    // 恰好不明显，加到 75 人三页后就暴露了）。
    if (this.pressed('s1')) {
      var qBase = this.selPage() * SEL_PER_PAGE;
      // 目标页可能不满 25 人（v5.0 第 3 页只有 25 位，正好满；留好余量）：
      // 先算“目标页最后一行同一列”，再按实际人数收敛
      var qRowBase = qBase + SEL_PER_PAGE + (SEL_ROWS - 1) * SEL_COLS + col;
      var qNext = qBase + SEL_PER_PAGE + col;
      if (qNext >= n) qNext = Math.min(n - 1, qRowBase);
      this.uiIndex = qNext;
    }
    if (this.pressed('ult')) {
      var eBase = this.selPage() * SEL_PER_PAGE;
      var eCol = this.uiIndex - eBase;
      if (eCol >= SEL_COLS) {
        // 往上翻一行
        this.uiIndex = eBase + eCol - SEL_COLS;
      } else if (eBase > 0) {
        // 已在第一行：翻到上一页同一列
        this.uiIndex = eBase - SEL_PER_PAGE + eCol;
      }
    }
    if (this.uiIndex !== old) global.Chiptune.sfx('select');

    if (this.pressed('punch') || this.pressed('kick')) {
      var slot = this.selSlots.indexOf(this.uiIndex);
      if (slot >= 0) {
        this.selSlots[slot] = null;
        this.selFocus = slot;
        global.Chiptune.sfx('select');
      } else {
        var empty = this.selSlots.indexOf(null);
        if (empty >= 0) {
          this.selSlots[empty] = this.uiIndex;
          this.selFocus = Math.min(2, empty + 1);
        } else {
          this.selSlots[this.selFocus] = this.uiIndex;
        }
        global.Chiptune.sfx('confirm');
      }
    }
    if (this.pressed('block')) {
      // 清空已选三人（P 键改为返回标题画面，清空移到 S）
      this.selSlots = [null, null, null];
      this.selFocus = 0;
      global.Chiptune.sfx('select');
    }
    if (this.pressed('clear')) {
      // P 键：返回标题画面
      this.state = 'title';
      this.t = 0;
      this.selSlots = [null, null, null];
      this.selFocus = 0;
      global.Chiptune.sfx('select');
      return;
    }
    if (this.pressed('start') && this.selSlots.indexOf(null) < 0) this.startMatch();
  };

  // ------------------ 组队 ------------------
  Game.prototype.startMatch = function () {
    if (this.selSlots.indexOf(null) >= 0) return;
    this.playerTeam = [];
    for (var i = 0; i < 3; i++) this.playerTeam.push(new Fighter(global.COMPOSERS[this.selSlots[i]], 'left', i));
    var pool = [];
    for (var j = 0; j < global.COMPOSERS.length; j++) pool.push(j);
    for (var k = pool.length - 1; k > 0; k--) {
      var r = (Math.random() * (k + 1)) | 0;
      var t = pool[k]; pool[k] = pool[r]; pool[r] = t;
    }
    this.enemyTeam = [];
    for (var m = 0; m < 3; m++) this.enemyTeam.push(new Fighter(global.COMPOSERS[pool[m]], 'right', m));
    this.roundNo = 0;
    this.projectiles = [];
    this.fields = [];
    this.echoes = [];
    this.movements = [];
    this.canonQueue = [];
    this.fx.clear();
    // 计算双方羁绊共鸣
    this.playerBonds = this.applyBonds(this.playerTeam);
    this.enemyBonds = this.applyBonds(this.enemyTeam);
    this.state = 'vs';
    this.t = 0;
    this.nextTrack();
    global.Chiptune.sfx('confirm');
  };

  /**
   * 计算一支队伍的羁绊共鸣并把标记写到角色身上
   * 绿色（时期）：伤害 +15%
   * 黄色（地区）：每 20 秒免疫所有伤害 2.5 秒
   */
  Game.prototype.applyBonds = function (team) {
    var ids = [];
    for (var i = 0; i < team.length; i++) ids.push(team[i].c.id);
    var bonds = global.computeBonds(ids);
    for (var j = 0; j < team.length; j++) {
      var f = team[j];
      f.bondEra = null;
      f.bondRegion = null;
      f.bondSystem = null;
      f.basicSpeed = 1;    // v5.0：先复位，稍后再按红色「节拍」共鸣重新赋值
      f.bondTimer = global.rollRegionInterval();
      // 和声体系共鸣：生命值上限 +18%
      var baseHp = f.c.maxHp;
      f.maxHp = Math.round(baseHp);
      f.hp = Math.min(f.hp > 0 ? f.hp : baseHp, f.maxHp);
    }
    if (bonds.era) {
      for (var k = 0; k < bonds.era.idxs.length; k++) team[bonds.era.idxs[k]].bondEra = bonds.era.tag;
    }
    if (bonds.region) {
      for (var m = 0; m < bonds.region.idxs.length; m++) team[bonds.region.idxs[m]].bondRegion = bonds.region.tag;
    }
    if (bonds.system) {
      for (var n = 0; n < bonds.system.idxs.length; n++) {
        var ff = team[bonds.system.idxs[n]];
        ff.bondSystem = bonds.system.tag;
        if (bonds.system.tag === '和声') {
          // 生命上限提升 18%，并按同样比例补足当前生命
          ff.maxHp = Math.round(ff.c.maxHp * (1 + global.SYSTEM_BOND.hpBonus));
          ff.hp = Math.min(ff.maxHp, Math.round(ff.hp * (1 + global.SYSTEM_BOND.hpBonus)));
        } else if (bonds.system.tag === '节拍') {
          // v5.0：挥拳 / 踢腿攻击速度 +20%
          ff.basicSpeed = global.SYSTEM_BOND.basicSpeed;
        } else if (bonds.system.tag === '循环') {
          // v5.0：开局即进入每 7 秒一次的循环节律
          ff.loopTimer = global.SYSTEM_BOND.loopInterval;
        }
      }
    }
    return bonds;
  };

  // ------------------ 回合开始 ------------------
  Game.prototype.nextRound = function () {
    this.roundNo++;
    this.left = this.playerTeam[0];
    this.right = this.enemyTeam[0];
    this.left.resetRoundState();
    this.right.resetRoundState();
    this.left.facing = 'right';
    this.right.facing = 'left';
    this.roundTime = ROUND_TIME * 60;
    this.phase = 'intro';
    this.phaseT = 0;
    this.playT = 0;
    this.countdown = 3;
    this.loserSide = null;
    this.koTimer = 0;
    this.projectiles = [];
    this.fields = [];
    this.echoes = [];
    this.movements = [];
    this.canonQueue = [];
    this.ai.reset(this.right);
    this.fx.clear();
    this.state = 'fight';
    this.t = 0;
    this.banner = { text: 'ROUND ' + this.roundNo, life: 70 };
  };

  Game.prototype.updateVs = function () {
    if (this.t > 96 || this.pressed('start') || this.pressed('punch')) this.nextRound();
  };

  // ------------------ 战斗更新 ------------------
  Game.prototype.updateFight = function () {
    var L = this.left, R = this.right;
    if (!L || !R) { this.state = 'select'; return; }

    if (this.phase === 'intro') {
      this.phaseT++;
      if (this.phaseT % 30 === 0 && this.countdown > 0) {
        this.countdown--;
        global.Chiptune.sfx('select');
      }
      if (this.phaseT > 105) {
        this.phase = 'play';
        this.playT = 0;
        // v4.2：正式开打瞬间给双方挂上终极技初始冷却，
        // 保证「开始后 6 秒内不能使用终极技」（倒计时不计入这 6 秒）。
        // 真正挂载放在本帧 stepFighter 之后，避免同帧被扣掉 1 帧。
        this.ultLockPending = true;
      }
    } else if (this.phase === 'play') {
      this.playT++;              // 实际交战时间（不含开场倒计时），AI 用它判断“开局”
      this.roundTime--;
      if (this.roundTime <= 0) { this.timeUp(); return; }
      this.readPlayerInput(L, R);
      this.ai.update(R, L);
    } else if (this.phase === 'ko') {
      this.koTimer++;
      if (this.koTimer > 96) { this.afterKo(); return; }
    }

    this.stepFighter(L, R);
    this.stepFighter(R, L);
    // v4.2：开局终极技初始冷却在正式开打的第一帧结算完之后挂上，
    // 这样它正好锁满 6 秒（不会因为同帧的冷却递减而少 1 帧）
    if (this.ultLockPending) {
      this.ultLockPending = false;
      L.cd[2] = Math.max(L.cd[2], ULT_OPENING_CD);
      R.cd[2] = Math.max(R.cd[2], ULT_OPENING_CD);
    }
    this.separate(L, R);
    this.stepProjectiles();
    this.stepFields();
    this.stepEchoes();
    this.stepMovements();
    this.stepCanon();

    if (this.phase === 'play') {
      if (L.hp <= 0 && !L.dead) this.doKo('left');
      else if (R.hp <= 0 && !R.dead) this.doKo('right');
    }
  };

  Game.prototype.doKo = function (loser) {
    this.loserSide = loser;
    this.phase = 'ko';
    this.koTimer = 0;
    var f = loser === 'left' ? this.left : this.right;
    f.dead = true;
    f.hp = 0;
    f.setAnim('ko', true);
    f.stun = 9999;
    this.fx.kick(16, '#ff8a3a');
    global.Chiptune.sfx('ko');
    this.banner = { text: 'K.O.', life: 96 };
  };

  Game.prototype.timeUp = function () {
    var lp = this.left.hp / this.left.maxHp;
    var rp = this.right.hp / this.right.maxHp;
    this.banner = { text: 'TIME UP', life: 90 };
    if (lp >= rp) this.doKo('right'); else this.doKo('left');
  };

  // ------------------ 玩家操作 ------------------
  Game.prototype.readPlayerInput = function (me, foe) {
    if (me.dead || me.state === 'ko') { me.blocking = false; return; }
    // 乐章连奏期间（freeMove）施法者不被招式动画锁住，仍可自由走位与出招
    var free = me.freeMove > 0;
    var busy = !free && (me.state === 'punch' || me.state === 'kick' || me.state === 'hurt' ||
      me.state === 'cast' || me.state === 'kickSkill');
    var ix = 0;
    if (this.input.left) ix -= 1;
    if (this.input.right) ix += 1;
    me.ix = ix;

    me.facing = foe.x >= me.x ? 'right' : 'left';
    foe.facing = me.x >= foe.x ? 'right' : 'left';

    // 按住 S：只要站在地上且没有正在出招，格挡就持续生效
    // （即使被打中进入硬直，格挡姿态也保持，符合“按住一直生效”）
    var wantBlock = !!this.input.block && me.onGround && !busy;
    if (wantBlock && !me.blocking) global.Chiptune.sfx('shield');
    me.blocking = wantBlock;

    if (me.stun > 0) { me.vx *= 0.7; return; }   // 硬直期间不能出新招，但格挡仍在

    if (!busy && !me.blocking) {
      if (this.pressed('ult') && me.cd[2] <= 0) this.useSkill(me, foe, 2);
      else if (this.pressed('s2') && me.cd[1] <= 0) this.useSkill(me, foe, 1);
      else if (this.pressed('s1') && me.cd[0] <= 0) this.useSkill(me, foe, 0);
      else if (this.pressed('punch')) this.startBasic(me, 'punch');
      else if (this.pressed('kick')) this.startBasic(me, 'kick');
    }

    busy = !free && (me.state === 'punch' || me.state === 'kick' || me.state === 'cast' ||
      me.state === 'kickSkill' || me.state === 'hurt');
    if (!busy && !me.blocking) {
      if (this.pressed('up') && me.onGround) {
        me.vy = -me.jumpPower();
        me.onGround = false;
        me.setAnim('jump', true);
      }
      if (me.onGround) {
        me.vx = ix * me.speedValue();
        me.setAnim(ix === 0 ? 'idle' : 'walk');
      } else {
        me.vx = approach(me.vx, ix * me.speedValue() * 0.85, 0.4);
      }
    } else {
      me.vx *= 0.6;
    }
  };

  Game.prototype.startBasic = function (me, kind) {
    me.setAnim(kind, true);
    me.hitUsed = false;
    me.tickAcc = 0;   // v5.0：每次出招都从整数帧开始，避免残余小数直接跳过判定帧
    global.Chiptune.sfx(kind === 'punch' ? 'punch' : 'kick');
  };

  // ------------------ 技能 ------------------
  /** 计算某个技能的实际冷却秒数（含红色卡农体系共鸣的缩短与“不得超过持续时间”的保护） */
  Fighter.prototype.cooldownOf = function (slot) {
    var sk = this.c.skills[slot];
    var cd = sk.cd;
    // 红色「卡农」体系共鸣：终极技 ×0.8，技能 1/2 ×0.6
    if (this.bondSystem === '卡农') {
      cd *= (slot === 2 ? global.SYSTEM_BOND.ultCd : global.SYSTEM_BOND.skillCd);
    }
    if (this.curse) cd += this.curse.extraCd;
    // 安全阀：无论怎样缩短，冷却都必须长于技能自身的持续时间
    var dur = sk.dur || 0;
    if (dur > 0) cd = Math.max(cd, dur + 1);
    return cd;
  };

  Game.prototype.useSkill = function (me, foe, slot) {
    var sk = me.c.skills[slot];
    me.cd[slot] = me.cooldownOf(slot) * 60;
    var SKILL_SFX = { field: 'field', echo: 'echo', movement: 'movement', rondo: 'rondo', canon: 'canon' };
    var sfxName = slot === 2 ? 'ultimate' : (SKILL_SFX[sk.type] || (slot === 0 ? 'skill1' : 'skill2'));
    global.Chiptune.sfx(sfxName);
    me.pendingStatus = null;

    if (slot === 2) {
      this.fx.kick(15, me.c.sprite.accent);
      this.fx.skillFx('ultimateAura', me.x, me.y, me.facing, me.c);
      this.banner = { text: sk.name, sub: sk.sub, who: me.c.name, mine: me.side === 'left', life: 80 };
      this.fx.add({ type: 'ring', x: me.x, y: me.y - 70, color: me.c.sprite.accent, life: 36, r: 10, maxR: 200, lw: 9 });
    } else {
      this.banner = { text: sk.name, sub: sk.sub, who: me.c.name, mine: me.side === 'left', life: 54 };
    }

    if (sk.self) this.applySelf(me, sk.self);
    var status = sk.status || null;

    if (sk.type === 'projectile') {
      me.setAnim('cast', true);
      var pr = sk.proj;
      var dir = me.facing === 'right' ? 1 : -1;
      for (var i = 0; i < pr.count; i++) this.spawnProjectile(me, pr, dir, i, status);
      if (sk.fx) this.fx.skillFx(sk.fx, me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'multiHit') {
      me.setAnim('kickSkill', true);
      me.multi = { skill: sk, foe: foe, left: sk.hit.hits, timer: 5, status: status };
      this.fx.skillFx(sk.fx || 'trail', me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'dashAttack') {
      var dd = me.facing === 'right' ? 1 : -1;
      me.setAnim('walk', true);
      me.dash = { skill: sk, foe: foe, dir: dd, remaining: sk.dash.distance, hitUsed: false, status: status };
      if (sk.fx) this.fx.skillFx(sk.fx, me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'field') {
      // 新机制一：领域
      me.setAnim('field', true);
      this.spawnField(me, sk.field, foe);
      if (sk.fx) this.fx.skillFx(sk.fx || 'fieldRise', me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'echo') {
      // 新机制二：回声虚影
      me.setAnim('echo', true);
      this.spawnEcho(me, sk.echo, foe);
      if (sk.fx) this.fx.skillFx(sk.fx || 'echoCall', me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'movement') {
      // 新体系一：乐章（多段自动连奏，施法者不被锁定）
      me.setAnim('movement', true);
      this.spawnMovement(me, sk.movement, foe);
      if (sk.fx) this.fx.skillFx(sk.fx || 'movementRise', me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'rondo') {
      // 新体系二：回旋（飞出后折返，去程与回程各判定一次）
      me.setAnim('rondo', true);
      var rdir = me.facing === 'right' ? 1 : -1;
      this.spawnRondo(me, sk.rondo, rdir, status);
      if (sk.hit) {
        me.pendingHit = { skill: sk, foe: foe, frame: 0, status: status };
      }
      if (sk.fx) this.fx.skillFx(sk.fx || 'rondoCall', me.x, me.y, me.facing, me.c);
    } else if (sk.type === 'canon') {
      // 新体系三：卡农（期间自己的每次命中都会被延后重奏）
      me.setAnim('canon', true);
      me.canon = {
        t: Math.round(sk.canon.dur * 60),
        dur: sk.canon.dur,
        delay: sk.canon.delay,
        ratio: sk.canon.ratio
      };
      if (sk.hit) me.pendingHit = { skill: sk, foe: foe, frame: 0, status: status };
      if (sk.fx) this.fx.skillFx(sk.fx || 'canonMark', me.x, me.y, me.facing, me.c);
    } else { // hitbox / meleeSwing / controlHit / ultimate
      var isUlt = sk.type === 'ultimate';
      if (isUlt && sk.field) this.spawnField(me, sk.field, foe);
      if (isUlt && sk.echo) this.spawnEcho(me, sk.echo, foe);
      var hit = sk.hit;
      if (hit && hit.hits && hit.hits > 1) {
        me.setAnim(isUlt ? 'kickSkill' : 'kickSkill', true);
        me.multi = { skill: sk, foe: foe, left: hit.hits, timer: 8, status: status };
      } else if (hit) {
        me.setAnim(isUlt && sk.field ? 'field' : 'cast', true);
        me.pendingHit = { skill: sk, foe: foe, frame: 0, status: status };
      } else if (isUlt) {
        me.setAnim('field', true);
      }
      if (sk.fx) this.fx.skillFx(sk.fx, me.x, me.y, me.facing, me.c);
    }
  };

  // =========================================================
  //  新机制一：领域（Field）
  // =========================================================
  Game.prototype.spawnField = function (owner, spec, foe) {
    var x = spec.follow ? owner.x : (foe ? foe.x : owner.x);
    x = clamp(x, LEFT_MIN + 20, RIGHT_MAX - 20);
    // 同一施法者的同类领域只保留最新的一个，避免叠满全场
    for (var i = this.fields.length - 1; i >= 0; i--) {
      var old = this.fields[i];
      if (old.owner === owner && old.spec.kind === spec.kind) this.fields.splice(i, 1);
    }
    this.fields.push({
      owner: owner, spec: spec,
      x: x, y: GROUND,
      life: Math.round(spec.dur * 60),
      maxLife: Math.round(spec.dur * 60),
      tickTimer: 14,
      dmg: spec.dps || 0,
      seed: rnd(0, 6.28)
    });
    if (this.fields.length > 6) this.fields.shift();
  };

  Game.prototype.stepFields = function () {
    for (var i = this.fields.length - 1; i >= 0; i--) {
      var fd = this.fields[i];
      var sp = fd.spec;
      fd.life--;
      if (sp.follow && fd.owner) fd.x = fd.owner.x;
      // 渐强领域：伤害随时间线性攀升
      if (sp.ramp) {
        var elapsed = (fd.maxLife - fd.life) / 60;
        fd.dmg = sp.dps * (1 + sp.ramp * elapsed);
      }
      if (fd.life <= 0) { this.fields.splice(i, 1); continue; }
      fd.tickTimer--;
      if (fd.tickTimer > 0) continue;
      fd.tickTimer = sp.tickEvery || 30;
      var foe = fd.owner === this.left ? this.right : this.left;
      var r = sp.radius || 170;
      if (foe && !foe.dead && Math.abs(foe.x - fd.x) <= r) {
        if (fd.dmg > 0) this.fieldDamage(fd.owner, foe, fd.dmg * FIELD_DAMAGE_SCALE * fd.owner.damageMul(), fd);
        if (sp.slow) foe.slow = { t: (sp.tickEvery || 30) + 14, power: Math.max(FIELD_SLOW_FLOOR, sp.slow) };
        if (sp.status) this.applyStatus(foe, sp.status);
      }
      // 领域对施法者自身的增益（需站在自己的领域内）
      var own = fd.owner;
      if (own && !own.dead && Math.abs(own.x - fd.x) <= r) {
        if (sp.heal) {
          own.hp = clamp(own.hp + sp.heal, 0, own.maxHp);
          this.fx.addNumber(own.x, own.y - 166, '+' + sp.heal, '#7ee0c0');
        }
        if (sp.armor) own.armor = { t: (sp.tickEvery || 30) + 14, power: sp.armor };
      }
    }
  };

  Game.prototype.drawFields = function (ctx) {
    for (var i = 0; i < this.fields.length; i++) {
      var fd = this.fields[i];
      var sp = fd.spec;
      var r = sp.radius || 170;
      var fade = Math.min(1, fd.life / 40);
      var col = sp.kind === 'heal' ? '#7ee0c0' : (sp.kind === 'armor' ? '#bcd8e8' : (sp.kind === 'ramp' ? '#ffd166' : (sp.kind === 'drain' ? '#c8a2ff' : '#8fc7ff')));
      if (fd.owner && fd.owner.c) col = fd.colorOverride || col;
      // 地面光域
      ctx.save();
      ctx.globalAlpha = 0.22 * fade;
      var g = ctx.createRadialGradient(fd.x, fd.y, 4, fd.x, fd.y, r);
      g.addColorStop(0, col);
      g.addColorStop(0.65, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(fd.x, fd.y, r, r * 0.30, 0, 0, Math.PI * 2);
      ctx.fill();
      // 外圈脉冲
      ctx.globalAlpha = (0.5 + 0.25 * Math.sin(this.t * 0.09 + fd.seed)) * fade;
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(fd.x, fd.y, r, r * 0.30, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.35 * fade;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(fd.x, fd.y, r * 0.66, r * 0.20, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 旋转的符文
      ctx.globalAlpha = 0.75 * fade;
      for (var k = 0; k < 6; k++) {
        var ang = this.t * 0.03 + fd.seed + k * 1.047;
        var gx = fd.x + Math.cos(ang) * r * 0.8;
        var gy = fd.y + Math.sin(ang) * r * 0.24;
        ctx.fillStyle = col;
        ctx.fillRect(gx - 3, gy - 3, 6, 6);
      }
      // 上升光柱
      ctx.globalAlpha = 0.10 * fade;
      ctx.fillStyle = col;
      for (var s = 0; s < 3; s++) {
        var bx = fd.x + Math.sin(this.t * 0.05 + s * 2.1 + fd.seed) * r * 0.45;
        ctx.fillRect(bx - 8, fd.y - 150, 16, 150);
      }
      ctx.restore();
    }
  };

  // =========================================================
  //  新机制二：回声虚影（Echo）
  // =========================================================
  Game.prototype.spawnEcho = function (owner, spec, foe) {
    if (!foe) return;
    var dirToFoe = foe.x >= owner.x ? 1 : -1;
    var spots = spec.spots || [{ dx: -80, delay: 12 }, { dx: 80, delay: 24 }];
    for (var i = 0; i < Math.min(spec.count || 1, spots.length); i++) {
      var s = spots[i];
      var ex = clamp(foe.x + dirToFoe * (s.dx || 0), LEFT_MIN - 24, RIGHT_MAX + 24);
      this.echoes.push({
        owner: owner, spec: spec,
        x: ex, y: GROUND,
        facing: foe.x >= ex ? 'right' : 'left',
        delay: s.delay || 12,
        phase: 'appear', t: 0, hitUsed: false,
        alpha: 0, seed: rnd(0, 40), facing2: owner.facing
      });
      this.fx.skillFx('echoAppear', ex, GROUND, owner.facing, owner.c);
    }
    if (this.echoes.length > 14) this.echoes.splice(0, this.echoes.length - 14);
  };

  Game.prototype.stepEchoes = function () {
    for (var i = this.echoes.length - 1; i >= 0; i--) {
      var e = this.echoes[i];
      var spec = e.spec;
      e.t++;
      if (e.phase === 'appear') {
        e.alpha = Math.min(0.66, e.alpha + 0.06);
        if (e.t >= e.delay) { e.phase = 'strike'; e.t = 0; }
      } else if (e.phase === 'strike') {
        e.alpha = 0.66;
        if (e.t === 5 && !e.hitUsed) {
          e.hitUsed = true;
          var foe = e.owner === this.left ? this.right : this.left;
          if (foe && !foe.dead) {
            var ebox = { w: 96, h: 118, cx: e.x, cy: GROUND - 60 };
            if (boxHit(ebox, fighterBox(foe))) {
              this.hitTarget(e.owner, foe, {
                damage: spec.damage, knock: spec.knock || 3, stun: spec.stun || 15
              }, spec.status || null);
              this.fx.skillFx('echoStrike', foe.x, foe.y, e.facing, e.owner.c);
              this.fx.kick(6, '#c8a2ff');
            }
          }
        }
        if (e.t > 20) { e.phase = 'fade'; e.t = 0; }
      } else {
        e.alpha -= 0.055;
        if (e.alpha <= 0 || e.t > 24) this.echoes.splice(i, 1);
      }
    }
  };

  Game.prototype.drawEchoes = function (ctx) {
    for (var i = 0; i < this.echoes.length; i++) {
      var e = this.echoes[i];
      var st = 'idle';
      if (e.phase === 'strike') {
        st = e.spec.swing === 'kick' ? 'kick' : (e.spec.swing === 'punch' ? 'punch' : 'cast');
      }
      var tick = e.t + e.seed;
      var alpha = Math.max(0, Math.min(0.66, e.alpha));
      if (alpha <= 0.01) continue;
      // 脚下魔法阵
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#c8a2ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, 30, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // 虚影本体 + 发光叠加
      global.Sprites.draw(ctx, {
        composer: e.owner.c, state: st, tick: tick, facing: e.facing,
        scale: SPRITE_SCALE, alpha: alpha
      }, e.x, e.y);
      global.Sprites.draw(ctx, {
        composer: e.owner.c, state: st, tick: tick, facing: e.facing,
        scale: SPRITE_SCALE, alpha: alpha * 0.42, silhouette: true
      }, e.x, e.y);
    }
  };

  // =========================================================
  //  新体系一：乐章（Movement）
  //  展开一段多段式乐句，按拍点自动连奏；施法者不被锁定
  // =========================================================
  Game.prototype.spawnMovement = function (owner, spec, foe) {
    if (!spec || !spec.stanzas || !spec.stanzas.length) return;
    var st = spec.stanzas;
    this.movements.push({
      owner: owner,
      stanzas: st,
      idx: 0,
      timer: st[0].delay || 0,
      life: (st[st.length - 1].delay || 0) + 90,
      seed: rnd(0, 40)
    });
    if (this.movements.length > 8) this.movements.shift();
    void foe;
  };

  Game.prototype.stepMovements = function () {
    for (var i = this.movements.length - 1; i >= 0; i--) {
      var mv = this.movements[i];
      var owner = mv.owner;
      if (!owner || owner.dead || owner.state === 'ko') { this.movements.splice(i, 1); continue; }
      mv.life--;
      if (mv.idx < mv.stanzas.length) {
        mv.timer--;
        if (mv.timer > 0) continue;
        var st = mv.stanzas[mv.idx];
        mv.idx++;
        var next = mv.stanzas[mv.idx];
        mv.timer = next ? Math.max(2, (next.delay || 0) - (st.delay || 0)) : 9999;
        // 施法者在空档时补一个挥击动作，但保持自由走位（freeMove）
        if (st.anim && (owner.state === 'idle' || owner.state === 'walk' || owner.state === 'movement')) {
          owner.setAnim(st.anim, true);
          owner.freeMove = 22;
        }
        var foe = owner === this.left ? this.right : this.left;
        var reach = (st.w || 130) / 2 + owner.bodyBox().w / 2 + 10;
        var ok = foe && !foe.dead &&
          Math.abs(foe.x - owner.x) <= reach &&
          Math.abs(foe.y - owner.y) < 150;
        this.fx.skillFx('movementBeat', owner.x, owner.y, owner.facing, owner.c);
        if (ok) {
          this.hitTarget(owner, foe, {
            damage: st.damage, knock: st.knock || 2, stun: st.stun || 12
          }, st.status || null);
          this.fx.kick(st.damage >= 14 ? 6 : 3, '#ffe066');
        } else if (st.fx) {
          this.fx.skillFx(st.fx, owner.x + (owner.facing === 'right' ? 70 : -70), owner.y, owner.facing, owner.c);
        }
      } else if (mv.life <= 0) {
        this.movements.splice(i, 1);
      }
    }
  };

  Game.prototype.drawMovements = function (ctx) {
    for (var i = 0; i < this.movements.length; i++) {
      var mv = this.movements[i];
      var owner = mv.owner;
      if (!owner || owner.dead) continue;
      var total = mv.stanzas.length;
      var left = total - mv.idx + 1;
      // 头顶浮动五线谱 + 剩余拍点
      var y = owner.y - 132 + Math.sin(this.t * 0.08 + mv.seed) * 3;
      var w = 26 + total * 12;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(8,6,14,0.72)';
      rr(ctx, owner.x - w / 2, y, w, 24, 4);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 1;
      ctx.strokeRect(owner.x - w / 2 + 0.5, y + 0.5, w - 1, 23);
      ctx.strokeStyle = 'rgba(255,224,102,0.55)';
      ctx.lineWidth = 1;
      for (var ln = 0; ln < 3; ln++) {
        ctx.beginPath();
        ctx.moveTo(owner.x - w / 2 + 5, y + 5 + ln * 5);
        ctx.lineTo(owner.x + w / 2 - 5, y + 5 + ln * 5);
        ctx.stroke();
      }
      for (var k = 0; k < total; k++) {
        ctx.fillStyle = k < mv.idx ? '#4a4356' : '#ffe066';
        ctx.beginPath();
        ctx.arc(owner.x - w / 2 + 12 + k * 12, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      void left;
    }
  };

  // =========================================================
  //  新体系二：回旋（Rondo）—— 飞出后折返，去程/回程各判定一次
  // =========================================================
  Game.prototype.spawnRondo = function (me, spec, dir, status) {
    var count = spec.count || 1;
    for (var i = 0; i < count; i++) {
      var y = me.y + (spec.yOff == null ? -80 : spec.yOff);
      if (spec.spreadY) y += (i - (count - 1) / 2) * spec.spreadY;
      this.projectiles.push({
        owner: me, dir: dir, x: me.x + dir * 38, y: y,
        w: spec.w || 28, h: spec.h || 28,
        speed: spec.speed * dir,
        damage: spec.damage, backDamage: spec.backDamage,
        kind: spec.kind, status: status,
        pierce: false, hitsLeft: 1, life: 460, t: 0, arc: false, vy: 0,
        delay: i * 9,
        boomerang: true, returning: false,
        travelled: 0, turnDist: spec.range || 300,
        hitOut: false, hitBack: false,
        pull: !!spec.pull
      });
    }
    if (this.projectiles.length > 40) this.projectiles.splice(0, this.projectiles.length - 40);
  };

  // =========================================================
  //  新体系三：卡农（Canon）—— 命中后被延后的模仿声部重奏一次
  // =========================================================
  Game.prototype.queueCanon = function (attacker, victim, dmg) {
    if (!attacker.canon || attacker.canon.t <= 0 || dmg <= 0) return;
    this.canonQueue.push({
      owner: attacker, victim: victim,
      damage: Math.max(1, Math.round(dmg * attacker.canon.ratio)),
      at: this.t + attacker.canon.delay
    });
    if (this.canonQueue.length > 24) this.canonQueue.shift();
  };

  Game.prototype.stepCanon = function () {
    for (var i = this.canonQueue.length - 1; i >= 0; i--) {
      var c = this.canonQueue[i];
      if (this.t < c.at) continue;
      this.canonQueue.splice(i, 1);
      var v = c.victim, o = c.owner;
      if (!v || v.dead || v.state === 'ko' || !o || o.dead) continue;
      if (this.phase !== 'play') continue;
      // 视觉：模仿声部从侧后方现身挥击
      this.echoes.push({
        owner: o, spec: { swing: 'cast' },
        x: v.x + (v.facing === 'right' ? -44 : 44), y: GROUND,
        facing: v.facing === 'right' ? 'left' : 'right',
        delay: 0, phase: 'strike', t: 0, hitUsed: true,
        alpha: 0.6, seed: rnd(0, 40)
      });
      if (this.echoes.length > 20) this.echoes.shift();
      this.fx.skillFx('canonEcho', v.x, v.y, o.facing, o.c);
      // scaled：重奏伤害是从一次已经结算过（已乘全局下调）的命中派生出来的，
      // 不能再乘一次 DAMAGE_SCALE，否则模仿声部会被双重削减
      this.fieldDamage(o, v, c.damage, { kindColor: '#c8a2ff', scaled: true });
    }
  };

  Game.prototype.applySelf = function (me, self) {
    if (self.heal) {
      me.hp = clamp(me.hp + self.heal, 0, me.maxHp);
      this.fx.addNumber(me.x, me.y - 152, '+' + self.heal, '#7ee0c0');
      global.Chiptune.sfx('heal');
    }
    if (self.shield) {
      me.shield = Math.max(me.shield, self.shield);
      this.fx.addNumber(me.x, me.y - 172, '护盾 ' + self.shield, '#8fc7ff');
      this.fx.ring(me.x, me.y - 70, '#8fc7ff', 72, 4, 26);
    }
    if (self.armor) me.armor = { t: self.armor.dur * 60, power: self.armor.power };
    if (self.buff) me.buff = { t: self.buff.dur * 60, power: self.buff.power || 0, speed: self.buff.speed || 0 };
    if (self.lifesteal) {
      me.lifesteal = self.lifesteal;
      // v4.2.1：吸血改为可限时（未写 lifestealDur 时仍为整回合有效）
      me.lifestealT = self.lifestealDur ? Math.round(self.lifestealDur * 60) : -1;
    }
  };

  Game.prototype.spawnProjectile = function (me, pr, dir, i, status) {
    var y = me.y + (pr.yOff == null ? -78 : pr.yOff);
    if (pr.spreadY) y += (i - (pr.count - 1) / 2) * pr.spreadY;
    if (pr.low) y = me.y - 40;
    var p = {
      owner: me, dir: dir, x: me.x + dir * 44, y: y,
      w: pr.w, h: pr.h, speed: pr.speed * dir,
      damage: pr.damage, kind: pr.kind, status: status,
      pierce: !!pr.pierce, hitsLeft: pr.pierce ? 2 : 1,
      life: 220, t: 0, arc: !!pr.arc, vy: 0,
      delay: i * (pr.spacing ? 6 : 0),
      grav: pr.arc ? 0.09 : 0,
      groundY: GROUND - 34
    };
    if (pr.arc) p.vy = -2.4;
    this.projectiles.push(p);
    if (this.projectiles.length > 40) this.projectiles.shift();
  };

  Game.prototype.stepProjectiles = function () {
    var list = this.projectiles;
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      if (p.delay > 0) { p.delay--; continue; }
      p.t++;
      // —— 回旋：飞到尽头后折返，回到施法者手中消失 ——
      if (p.boomerang) {
        if (!p.returning) {
          p.travelled += Math.abs(p.speed);
          if (p.travelled >= p.turnDist) {
            p.returning = true;
            p.speed = -p.speed;
            this.fx.skillFx('rondoTurn', p.x, p.y, p.dir > 0 ? 'right' : 'left', p.owner.c);
          }
        } else {
          var home = p.owner ? p.owner.x : p.x;
          var dxHome = home - p.x;
          if (Math.abs(dxHome) < 26) { list.splice(i, 1); continue; }
          p.speed = (dxHome > 0 ? 1 : -1) * Math.abs(p.speed);
          // 回程时向施法者所在高度靠拢
          if (p.owner) p.y += (p.owner.y + (p.yOff || -78) - p.y) * 0.08;
        }
      }
      p.x += p.speed;
      if (p.arc) {
        p.vy += p.grav;
        p.y += p.vy;
        if (p.y > p.groundY) { p.y = p.groundY; p.vy = -p.vy * 0.4; }
      }
      if ((p.t & 1) === 0) {
        this.fx.add({
          type: 'spark', x: p.x - p.dir * 12, y: p.y + rnd(-6, 6), life: 10,
          vx: -p.dir * 0.7, vy: rnd(-0.5, 0.5), size: rnd(2, 5), color: p.owner.c.sprite.accent
        });
      }
      var target = p.owner === this.left ? this.right : this.left;
      var hitSomething = false;
      if (target && !target.dead && target.invuln <= 0) {
        var pbox = { w: p.w, h: p.h, cx: p.x, cy: p.y };
        var alreadyHit = p.boomerang ? (p.returning ? p.hitBack : p.hitOut) : false;
        if (!alreadyHit && boxHit(pbox, fighterBox(target))) {
          var dmg = (p.boomerang && p.returning) ? (p.backDamage || p.damage) : p.damage;
          this.hitTarget(p.owner, target, {
            damage: dmg, knock: p.pull ? 4.5 : 3.2, stun: 15, pull: !!(p.pull && p.returning)
          }, p.status);
          if (p.boomerang) {
            if (p.returning) {
              p.hitBack = true;
              this.fx.skillFx('rondoBack', p.x, p.y, p.owner.facing, p.owner.c);
            } else {
              p.hitOut = true;
              this.fx.skillFx('rondoTurn', p.x, p.y, p.owner.facing, p.owner.c);
            }
          }
          this.fx.hitBurst(p.x, p.y, p.owner.c.sprite.accent, false);
          hitSomething = !p.boomerang;
        }
      }
      if (hitSomething) {
        if (p.pierce && p.hitsLeft > 1) p.hitsLeft--;
        else { list.splice(i, 1); continue; }
      }
      if (--p.life <= 0 || p.x < -80 || p.x > W + 80) list.splice(i, 1);
    }
  };

  // ------------------ 单位推进 ------------------
  Game.prototype.stepFighter = function (s, foe) {
    for (var i = 0; i < 3; i++) if (s.cd[i] > 0) s.cd[i]--;

    if (s.stun > 0 && s.state !== 'ko') s.stun--;
    if (s.invuln > 0) s.invuln--;
    if (s.bondShield > 0) s.bondShield--;
    if (s.rondoShield > 0) s.rondoShield--;
    if (s.guardHit > 0) s.guardHit--;
    if (s.guardFlash > 0) s.guardFlash--;
    if (s.freeMove > 0) s.freeMove--;
    if (s.lifestealT > 0) {
      s.lifestealT--;
      if (s.lifestealT === 0) { s.lifesteal = 0; s.lifestealT = -1; }
    }
    if (s.canon) { s.canon.t--; if (s.canon.t <= 0) s.canon = null; }
    if (s.flash > 0) s.flash--;

    // 黄色（地区）羁绊共鸣：每 6~15 秒（随机间隔）免疫全部伤害 2.5 秒
    if (s.bondRegion && !s.dead) {
      if (s.bondTimer > 0) s.bondTimer--;
      if (s.bondTimer <= 0) {
        s.bondTimer = global.rollRegionInterval();
        s.invuln = Math.max(s.invuln, global.BOND.regionInvuln);
        s.bondShield = global.BOND.regionInvuln;
        this.fx.skillFx('bondShield', s.x, s.y, s.facing, s.c);
        this.fx.addNumber(s.x, s.y - 172, '羁绊共鸣·免疫', '#ffe066');
        global.Chiptune.sfx('bond');
      }
    }
    // 红色「回旋」体系共鸣：每 7 秒有 33% 概率展开 0.8 秒的反弹护盾
    if (s.bondSystem === '回旋' && !s.dead) {
      if (s.rondoTimer > 0) s.rondoTimer--;
      if (s.rondoTimer <= 0) {
        s.rondoTimer = global.SYSTEM_BOND.rondoInterval;
        if (Math.random() < global.SYSTEM_BOND.rondoChance) {
          s.rondoShield = global.SYSTEM_BOND.rondoShield;
          this.fx.skillFx('rondoShield', s.x, s.y, s.facing, s.c);
          this.fx.addNumber(s.x, s.y - 172, '回旋共鸣·反弹盾', global.SYSTEM_COLOR);
          global.Chiptune.sfx('shield');
        }
      }
    }
    // 红色「循环」体系共鸣（v5.0）：每 7 秒回复 18% 已损失生命
    if (s.bondSystem === '循环' && !s.dead && this.phase === 'play') {
      if (s.loopTimer > 0) s.loopTimer--;
      if (s.loopTimer <= 0) {
        s.loopTimer = global.SYSTEM_BOND.loopInterval;
        var lost = s.maxHp - s.hp;
        if (lost > 0) {
          var gain = Math.max(1, Math.round(lost * global.SYSTEM_BOND.loopHealRatio));
          s.hp = clamp(s.hp + gain, 0, s.maxHp);
          this.fx.addNumber(s.x, s.y - 160, '循环共鸣 +' + gain, global.SYSTEM_COLOR);
          this.fx.skillFx('loopPulse', s.x, s.y, s.facing, s.c);
          global.Chiptune.sfx('heal');
        }
      }
    }
    if (s.slow) { s.slow.t--; if (s.slow.t <= 0) s.slow = null; }
    if (s.weaken) { s.weaken.t--; if (s.weaken.t <= 0) s.weaken = null; }
    if (s.curse) { s.curse.t--; if (s.curse.t <= 0) s.curse = null; }
    if (s.buff) { s.buff.t--; if (s.buff.t <= 0) s.buff = null; }
    if (s.armor) { s.armor.t--; if (s.armor.t <= 0) s.armor = null; }
    if (s.dance) {
      s.dance.t--;
      if (s.dance.t % 30 === 0 && s.hp > 0) {
        s.hp -= s.dance.dps;
        this.fx.addNumber(s.x, s.y - 140, '-' + s.dance.dps, '#ff9cc0');
        this.fx.add({ type: 'note', x: s.x + rnd(-16, 16), y: s.y - 90, life: 30, vy: -1.2, size: 9, color: '#ff9cc0' });
        if (s.state !== 'ko') s.setAnim('walk', true);
        if (s.hp <= 0 && !s.dead && this.phase === 'play') this.doKo(s.side);
      }
      if (s.dance.t <= 0) s.dance = null;
    }
    if (s.bleed) {
      s.bleed.t--;
      if (s.bleed.t % 30 === 0 && s.hp > 0) {
        s.hp -= s.bleed.dps;
        this.fx.addNumber(s.x, s.y - 130, '-' + s.bleed.dps, '#ff7b6b');
        this.fx.sparks(s.x, s.y - 80, 4, '#ff7b6b');
        if (s.hp <= 0 && !s.dead && this.phase === 'play') this.doKo(s.side);
      }
      if (s.bleed.t <= 0) s.bleed = null;
    }

    var disabled = s.stun > 0 || s.state === 'ko';
    if (disabled) {
      // 硬直中若仍按住格挡，保持戒备姿态而不是倒地受击姿态
      if (s.state !== 'ko' && !s.blocking && s.state !== 'hurt') s.setAnim('hurt', true);
      s.vx *= 0.82;
    }

    // 多段攻击
    if (s.multi && !disabled) {
      var h = s.multi.skill.hit;
      s.multi.timer--;
      if (s.multi.timer <= 0 && s.multi.left > 0) {
        s.multi.left--;
        s.multi.timer = h.interval;
        var within = !!h.fullScreen;
        if (!within) {
          var reach = h.w / 2 + s.bodyBox().w / 2 + 8;
          within = Math.abs(foe.x - s.x) <= reach && Math.abs(foe.y - s.y) < 150;
        }
        if (within && !foe.dead) {
          this.hitTarget(s, foe, h, s.multi.status);
          this.fx.hitBurst(foe.x, foe.y - 70, s.c.sprite.accent, h.damage >= 18);
          this.fx.kick(h.damage >= 18 ? 10 : 5, s.c.sprite.accent);
        } else {
          this.fx.add({ type: 'ring', x: s.x + (s.facing === 'right' ? 60 : -60), y: s.y - 70, color: s.c.sprite.accent, life: 20, r: 12, maxR: h.w / 2, lw: 5 });
        }
        if (s.multi.left <= 0) s.multi = null;
      }
    }

    // 突进
    if (s.dash && !disabled) {
      var d = s.dash;
      var spd = d.skill.dash.speed;
      s.x += d.dir * spd;
      d.remaining -= spd;
      if ((this.t & 2) === 0) {
        this.fx.add({
          type: 'spark', x: s.x - d.dir * 22, y: s.y - rnd(20, 100), life: 12,
          vx: -d.dir * 1.5, vy: rnd(-0.6, 0.4), size: rnd(3, 7), color: s.c.sprite.accent
        });
      }
      if (!d.hitUsed && !foe.dead) {
        if (boxHit(fighterBox(s), fighterBox(foe))) {
          d.hitUsed = true;
          this.hitTarget(s, foe, d.skill.dash, d.status);
          this.fx.hitBurst(foe.x, foe.y - 70, s.c.sprite.accent, true);
          this.fx.kick(10, s.c.sprite.accent);
        }
      }
      if (d.remaining <= 0) {
        s.dash = null;
        if (s.state !== 'ko') s.setAnim('idle', true);
      }
    }

    // 普通攻击
    if (!disabled) this.resolveBasic(s, foe);

    // 单发技能
    if (s.pendingHit && !disabled) {
      s.pendingHit.frame++;
      if (s.pendingHit.frame >= 7) {
        var ph = s.pendingHit;
        var hit = ph.skill.hit;
        var ok = !!hit.fullScreen;
        if (!ok) {
          var reach2 = hit.w / 2 + s.bodyBox().w / 2 + 10;
          ok = Math.abs(foe.x - s.x) <= reach2 && Math.abs(foe.y - s.y) < 160;
        }
        if (ok && !foe.dead) {
          this.hitTarget(s, foe, hit, ph.status);
          this.fx.hitBurst(foe.x, foe.y - 70, s.c.sprite.accent, true);
          this.fx.kick(12, s.c.sprite.accent);
        }
        s.pendingHit = null;
      }
    }

    // 物理
    if (!s.onGround) {
      s.vy += GRAVITY;
      s.y += s.vy;
      if (s.y >= GROUND) { s.y = GROUND; s.vy = 0; s.onGround = true; }
    }
    s.x += s.vx;
    if (s.side === 'left') s.x = clamp(s.x, LEFT_MIN, LEFT_MAX);
    else s.x = clamp(s.x, RIGHT_MIN, RIGHT_MAX);

    // 动画推进 / 收招
    // v5.0：红色「节拍」体系共鸣让挥拳 / 踢腿的动画推进快 20%，
    //       从而缩短出招到收招的整段时间（攻击速度 +20%）。
    s.tickAcc += (s.basicSpeed > 1 && (s.state === 'punch' || s.state === 'kick')) ? s.basicSpeed : 1;
    while (s.tickAcc >= 1) { s.tickAcc -= 1; s.tick++; }
    if (!disabled) {
      var st = s.state;
      if (st === 'punch' || st === 'kick' || st === 'hurt' || st === 'cast' ||
        st === 'kickSkill' || st === 'field' || st === 'echo' ||
        st === 'movement' || st === 'rondo' || st === 'canon') {
        var maxTick = st === 'hurt' ? 22 : (st === 'punch' ? 24 : (st === 'kick' ? 34 : 40));
        if (s.tick > maxTick) s.setAnim(s.onGround ? 'idle' : 'jump', true);
      } else if (st === 'jump' && s.onGround) {
        s.setAnim('idle', true);
      }
    }
    if (s.tick > 6000) s.tick = 0;
  };

  Game.prototype.resolveBasic = function (s, foe) {
    var isPunch = s.state === 'punch';
    var active = false;
    if (isPunch) active = s.tick >= 5 && s.tick <= 14;
    else if (s.state === 'kick') active = s.tick >= 7 && s.tick <= 18;
    if (!active || s.hitUsed || foe.dead) return;
    var sb = fighterBox(s), fb = fighterBox(foe);
    var reach = (isPunch ? 46 : 58) + sb.w / 2 + fb.w / 2;
    if (Math.abs(foe.x - s.x) > reach) return;
    if (Math.abs(sb.cy - fb.cy) > 100) return;
    s.hitUsed = true;
    this.hitTarget(s, foe, {
      damage: isPunch ? 7 : 11, knock: isPunch ? 1.7 : 3.4, stun: isPunch ? 10 : 14, basic: true
    }, null);
    this.fx.hitBurst(foe.x, foe.y - 72, isPunch ? '#fff2b0' : '#ffd166', !isPunch);
    this.fx.kick(isPunch ? 4 : 6, null);
  };

  // ------------------ 命中结算 ------------------
  Game.prototype.hitTarget = function (attacker, victim, hit, status) {
    // KO 演出与开场倒计时期间不再结算伤害，避免出现“上场即死”的负血量角色
    if (this.phase !== 'play') return 0;
    if (!victim || victim.dead || victim.state === 'ko') return 0;
    if (victim.invuln > 0) {
      if (victim.bondShield > 0) {
        this.fx.skillFx('blockImmune', victim.x, victim.y, victim.facing, victim.c);
        this.fx.addNumber(victim.x, victim.y - 156, '羁绊·免疫', '#ffe066');
      }
      return 0;
    }

    // v4.2：所有伤害先按下调系数结算，共鸣增伤再对“下调后的数值”做乘区
    var dmg = Math.max(1, Math.round(hit.damage * attacker.damageMul() * DAMAGE_SCALE));
    // 红色「乐章」体系共鸣：14% 概率 ×2、8% 概率 ×3、3% 概率 ×4（互斥，由高到低）
    var bondMul = 1;
    if (attacker.bondSystem === '乐章') bondMul = global.rollSystemDamageMul();
    if (bondMul > 1) dmg *= bondMul;

    // 红色「回旋」体系共鸣：反弹护盾
    // 展开期间抵消一次敌方攻击，并把该次攻击原本伤害的 50% 弹回攻击者
    if (victim.rondoShield > 0) {
      victim.rondoShield = 0;
      var back = Math.max(1, Math.round(dmg * global.SYSTEM_BOND.rondoReflect));
      this.fx.skillFx('rondoReflect', victim.x, victim.y, victim.facing, victim.c);
      this.fx.addNumber(victim.x, victim.y - 158, '回旋·反弹', global.SYSTEM_COLOR);
      this.fx.hitBurst(attacker.x, attacker.y - 70, global.SYSTEM_COLOR, true);
      if (attacker.invuln > 0) {
        // 攻击者自己也处在无敌帧（黄色共鸣免疫 / 技能无敌）时，反伤同样被免疫
        this.fx.addNumber(attacker.x, attacker.y - 152, '免疫', '#ffe066');
        global.Chiptune.sfx('block');
      } else {
        this.fx.addNumber(attacker.x, attacker.y - 152, String(back), global.SYSTEM_COLOR, true);
        this.fx.kick(8, global.SYSTEM_COLOR);
        attacker.hp -= back;
        attacker.flash = 6;
        global.Chiptune.sfx('hit');
        if (attacker.hp <= 0 && !attacker.dead && this.phase === 'play') this.doKo(attacker.side);
      }
      return 0;
    }

    var canBlock = victim.blocking && !hit.pierce && !hit.fullScreen;
    var roll = Math.random();
    var blockLabel = null;

    if (canBlock) {
      victim.guardHit = 16;
      victim.guardFlash = 10;
      if (hit.basic) {
        // 普通攻击：75% 概率完全免疫
        if (roll < 0.75) {
          this.fx.skillFx('blockImmune', victim.x, victim.y, victim.facing, victim.c);
          this.fx.addNumber(victim.x, victim.y - 156, '格挡·免疫', '#9fd6ff');
          global.Chiptune.sfx('block');
          return;
        }
        blockLabel = '格挡失效';
      } else {
        // 技能：60% 概率随机减免原本伤害的 20%~40%
        if (roll < 0.60) {
          var cut = 0.20 + Math.random() * 0.20;
          var before = dmg;
          dmg = Math.max(1, Math.round(dmg * (1 - cut)));
          blockLabel = '格挡 -' + Math.round(cut * 100) + '%';
          void before;
        } else {
          blockLabel = '格挡失效';
        }
      }
      this.fx.blockSpark(victim.x + (victim.facing === 'right' ? 32 : -32), victim.y - 78, attacker.c.sprite.accent);
      global.Chiptune.sfx(roll < 0.6 ? 'block' : 'guardBreak');
      this.fx.addNumber(victim.x + 26, victim.y - 168, blockLabel, roll < 0.6 ? '#9fd6ff' : '#ff9c9c');
    }

    if (victim.armor) dmg = Math.max(1, Math.round(dmg * (1 - victim.armor.power)));
    // 红色「回旋」体系共鸣：免疫 8% 受到的伤害（反弹护盾见上方 rondoShield 分支）
    // （伤害很小时 8% 不足 1 点，四舍五入会把减免完全吃掉，因此设 1 点下限）
    if (victim.bondSystem === '回旋') {
      var cut8 = dmg - Math.round(dmg * (1 - global.SYSTEM_BOND.damageCut));
      if (cut8 < 1 && dmg >= 5) cut8 = 1;
      dmg = Math.max(1, dmg - cut8);
    }
    if (victim.shield > 0) {
      var absorbed = Math.min(victim.shield, dmg);
      victim.shield -= absorbed;
      dmg -= absorbed;
      this.fx.addNumber(victim.x + 22, victim.y - 170, '-' + absorbed, '#8fc7ff');
      this.fx.ring(victim.x, victim.y - 70, '#8fc7ff', 58, 3, 16);
      if (dmg <= 0) { this.fx.addNumber(victim.x, victim.y - 152, '盾挡', '#8fc7ff'); return; }
    }
    victim.hp -= dmg;
    victim.flash = 6;
    this.fx.addNumber(victim.x, victim.y - 152, String(dmg), bondMul > 1 ? '#ff5b5b' : (status ? '#ffe066' : '#ffffff'), dmg >= 25 || bondMul > 1);
    if (bondMul > 1) {
      this.fx.addNumber(victim.x + 30, victim.y - 178, '乐章·×' + bondMul + '!', '#ff5b5b');
      this.fx.ring(victim.x, victim.y - 72, '#ff5b5b', 84, 5, 22);
      this.fx.kick(6, '#ff5b5b');
    }
    if (!hit.basic) global.Chiptune.sfx('hit');
    // 卡农：本次命中会被延后的模仿声部重奏一次
    this.queueCanon(attacker, victim, dmg);
    // 硬直与击退：处于格挡姿态时大幅削弱（格挡的核心价值）
    var stunFrames = hit.stun || 12;
    if (victim.blocking && canBlock) stunFrames = Math.round(stunFrames * 0.5);
    victim.stun = Math.max(victim.stun, stunFrames);
    if (!victim.blocking) victim.setAnim('hurt', true);
    var dir = attacker.x <= victim.x ? 1 : -1;
    if (hit.pull) dir = -dir;    // 回旋的回程：把对手拖向施法者
    var knock = (hit.knock == null ? 2 : hit.knock) * (victim.blocking ? 0.6 : 1);
    victim.vx = dir * knock;
    if (!victim.blocking && !hit.pull && (hit.knock || 0) >= 6) {
      victim.vy = -Math.min(9.5, (hit.knock || 0) * 0.55);
      victim.onGround = false;
    }
    attacker.totalDamage = (attacker.totalDamage || 0) + dmg;

    if (attacker.lifesteal && dmg > 0) {
      var heal = Math.max(1, Math.round(dmg * attacker.lifesteal));
      attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
      this.fx.addNumber(attacker.x, attacker.y - 170, '+' + heal, '#ff9cc0');
    }
    // 红色「和声」体系共鸣：7% 吸血（命中过轻时不触发，避免 1 点伤害回 1 点血）
    if (attacker.bondSystem === '和声' && dmg >= 5 && attacker.hp > 0) {
      var healB = Math.max(1, Math.round(dmg * global.SYSTEM_BOND.lifesteal));
      attacker.hp = clamp(attacker.hp + healB, 0, attacker.maxHp);
      this.fx.addNumber(attacker.x, attacker.y - 186, '+' + healB, '#7ee0c0');
    }

    if (status && !victim.blocking) this.applyStatus(victim, status);

    if (victim.hp <= 0 && !victim.dead && this.phase === 'play') this.doKo(victim.side);
  };

  /**
   * 领域/卡农等“直接伤害”：不吃格挡，但吃减伤与护盾，且不产生硬直
   * @param {object} [fd] 附加信息；fd.scaled === true 表示 amount 已经是“下调后”的
   *   数值（例如卡农的模仿声部，派生自已结算过的命中），不再重复乘全局下调。
   */
  Game.prototype.fieldDamage = function (attacker, victim, amount, fd) {
    if (this.phase !== 'play') return 0;
    if (!victim || victim.dead || victim.state === 'ko') return 0;
    if (victim.invuln > 0) return 0;
    // v4.2：领域/卡农等直接伤害同样吃全局伤害下调，共鸣增伤再做乘区
    var preScaled = !!(fd && fd.scaled);
    var dmg = Math.max(1, Math.round(amount * (preScaled ? 1 : DAMAGE_SCALE)));
    // 红色「乐章」体系共鸣：14% ×2 / 8% ×3 / 3% ×4（互斥）
    var bondMul = 1;
    if (attacker.bondSystem === '乐章') bondMul = global.rollSystemDamageMul();
    if (bondMul > 1) dmg *= bondMul;
    if (victim.armor) dmg = Math.max(1, Math.round(dmg * (1 - victim.armor.power)));
    // 红色「回旋」体系共鸣：免疫 8% 伤害（同样设 1 点下限，避免小伤害被四舍五入吃掉）
    if (victim.bondSystem === '回旋') {
      var cut8f = dmg - Math.round(dmg * (1 - global.SYSTEM_BOND.damageCut));
      if (cut8f < 1 && dmg >= 5) cut8f = 1;
      dmg = Math.max(1, dmg - cut8f);
    }
    if (victim.shield > 0) {
      var absorbed = Math.min(victim.shield, dmg);
      victim.shield -= absorbed;
      dmg -= absorbed;
      if (dmg <= 0) return 0;
    }
    victim.hp -= dmg;
    victim.flash = 3;
    this.fx.addNumber(victim.x + (Math.random() * 26 - 13), victim.y - 140, String(dmg), bondMul > 1 ? '#ff5b5b' : (fd.kindColor || '#a8e6d0'), dmg >= 25 || bondMul > 1);
    this.fx.add({
      type: 'spark', x: victim.x + (Math.random() * 40 - 20), y: victim.y - Math.random() * 100,
      life: 12, vy: -1.2, size: 4, color: fd.kindColor || '#a8e6d0'
    });
    if (bondMul > 1) this.fx.addNumber(victim.x + 26, victim.y - 168, '乐章·×' + bondMul + '!', '#ff5b5b');
    attacker.totalDamage = (attacker.totalDamage || 0) + dmg;
    if (dmg > 0 && fd.spec && fd.spec.drain) {
      var heal = Math.max(1, Math.round(dmg * fd.spec.drain));
      attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
      this.fx.addNumber(attacker.x, attacker.y - 170, '+' + heal, '#c8a2ff');
    }
    // 红色「和声」体系共鸣：7% 吸血
    if (attacker.bondSystem === '和声' && dmg >= 5 && attacker.hp > 0) {
      var healB2 = Math.max(1, Math.round(dmg * global.SYSTEM_BOND.lifesteal));
      attacker.hp = clamp(attacker.hp + healB2, 0, attacker.maxHp);
      this.fx.addNumber(attacker.x, attacker.y - 186, '+' + healB2, '#7ee0c0');
    }
    if (victim.hp <= 0 && !victim.dead && this.phase === 'play') this.doKo(victim.side);
    return dmg;
  };

  var STATUS_LABEL = {
    slow: '减速', dance: '强制起舞', bleed: '流血', stun: '眩晕',
    root: '定身', weaken: '虚弱', curse: '十二音诅咒'
  };

  Game.prototype.applyStatus = function (victim, status) {
    var d = (status.dur || 2) * 60;
    // v4.2：持续伤害（起舞 / 流血）同样吃全局伤害下调，但保底 1 点
    var dotScale = function (v) { return Math.max(1, Math.round(v * DAMAGE_SCALE)); };
    switch (status.kind) {
      case 'slow': victim.slow = { t: d, power: status.power || 0.55 }; break;
      case 'dance': victim.dance = { t: d, dps: dotScale(status.dps || 5) }; break;
      case 'bleed': victim.bleed = { t: d, dps: dotScale(status.dps || 4) }; break;
      case 'stun':
      case 'root': victim.stun = Math.max(victim.stun, d); break;
      case 'weaken': victim.weaken = { t: d, power: status.power || 0.3 }; break;
      case 'curse': victim.curse = { t: d, extraCd: status.extraCd || 3 }; break;
    }
    var label = STATUS_LABEL[status.kind];
    if (label) this.fx.addNumber(victim.x, victim.y - 180, label, '#e0b0ff');
  };

  Game.prototype.separate = function (L, R) {
    var minDist = (L.bodyBox().w + R.bodyBox().w) / 2 - 6;
    var d = R.x - L.x;
    if (Math.abs(d) < minDist) {
      var push = (minDist - Math.abs(d)) / 2 + 0.5;
      var dir = d >= 0 ? 1 : -1;
      L.x -= dir * push;
      R.x += dir * push;
      L.x = clamp(L.x, LEFT_MIN, LEFT_MAX);
      R.x = clamp(R.x, RIGHT_MIN, RIGHT_MAX);
    }
  };

  // ------------------ 轮换结算 ------------------
  Game.prototype.afterKo = function () {
    var loser = this.loserSide;
    var team = loser === 'left' ? this.playerTeam : this.enemyTeam;
    team[0].dead = true;
    var remaining = 0;
    for (var i = 1; i < team.length; i++) if (team[i].hp > 0) remaining++;
    if (remaining === 0) {
      this.state = 'result';
      this.t = 0;
      this.winSide = loser === 'left' ? 'right' : 'left';
      global.Chiptune.stopMusic();
      global.Chiptune.sfx(this.winSide === 'left' ? 'win' : 'lose');
      return;
    }
    team.shift();
    // 战胜方按规则保留本轮结束时的血量（不回复）
    this.nextFighterName = team[0].c.name;
    this.state = 'roundover';
    this.t = 0;
    global.Chiptune.sfx('swap');
  };

  Game.prototype.updateRoundOver = function () {
    if (this.t > 132 || this.pressed('start') || this.pressed('punch')) this.nextRound();
  };

  Game.prototype.updateResult = function () {
    if (this.t > 110 && (this.pressed('start') || this.pressed('punch'))) {
      this.state = 'select';
      this.selSlots = [null, null, null];
      this.selFocus = 0;
      this.uiIndex = 0;
      this.t = 0;
      this.projectiles = [];
      this.fx.clear();
    }
  };

  // =========================================================
  //  绘制
  // =========================================================
  Game.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.save();
    if (this.fx.shake > 0.2) {
      ctx.translate(rnd(-this.fx.shake, this.fx.shake), rnd(-this.fx.shake, this.fx.shake) * 0.6);
    }
    this.drawBackground(ctx);
    this.drawStage(ctx);

    switch (this.state) {
      case 'title': this.drawTitle(ctx); break;
      case 'select': this.drawSelect(ctx); break;
      case 'vs': this.drawVs(ctx); break;
      case 'fight': this.drawFight(ctx); break;
      case 'roundover': this.drawFight(ctx); this.drawRoundOver(ctx); break;
      case 'result': this.drawResult(ctx); break;
      case 'settings': this.drawSettings(ctx); break;
    }

    if (this.fx.flash > 0.02) {
      ctx.globalAlpha = Math.min(0.6, this.fx.flash);
      ctx.fillStyle = this.fx.flashColor;
      ctx.fillRect(-24, -24, W + 48, H + 48);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  Game.prototype.drawBackground = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#120d22');
    g.addColorStop(0.45, '#1e1733');
    g.addColorStop(0.75, '#2a1f3d');
    g.addColorStop(1, '#150f22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];
      var tw = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 0.03 + s.p));
      ctx.globalAlpha = tw * 0.45;
      ctx.fillStyle = i % 3 === 0 ? '#ffe9a8' : '#cfd6f5';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    var pipes = 26, pw = 14;
    var gap = (W - pipes * pw) / (pipes + 1);
    for (var p = 0; p < pipes; p++) {
      var px = gap + p * (pw + gap);
      var ph = 120 + ((p * 37) % 5) * 26;
      ctx.fillStyle = p % 2 === 0 ? '#2c2440' : '#241e36';
      ctx.fillRect(px, 300 - ph, pw, ph);
      ctx.fillStyle = '#3a3154';
      ctx.fillRect(px + 2, 300 - ph, 3, ph);
      ctx.fillStyle = '#191428';
      ctx.fillRect(px + pw - 3, 300 - ph, 3, ph);
    }
    ctx.fillStyle = '#3b2b4d';
    ctx.fillRect(0, 292, W, 14);
    ctx.fillStyle = '#241a33';
    ctx.fillRect(0, 306, W, 8);
  };

  Game.prototype.drawStage = function (ctx) {
    var g = ctx.createLinearGradient(0, 306, 0, H);
    g.addColorStop(0, '#4a3a2e');
    g.addColorStop(0.35, '#3a2c22');
    g.addColorStop(1, '#221a15');
    ctx.fillStyle = g;
    ctx.fillRect(0, 300, W, H - 300);
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 14; i++) {
      var y = 332 + i * 16;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.ellipse(W / 2, GROUND, 350, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1220';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = '#2c2033';
    ctx.fillRect(0, H - 24, W, 4);
  };

  Game.prototype.drawFighter = function (ctx, f) {
    if (f.dead || f.state === 'ko') {
      ctx.save();
      ctx.translate(f.x, f.y);
      if (f.side === 'right') ctx.scale(-1, 1);
      ctx.rotate(-Math.PI * 0.46);
      global.Sprites.draw(ctx, {
        composer: f.c, state: 'hurt', tick: 0, facing: 'left',
        scale: SPRITE_SCALE, alpha: 0.92
      }, 0, 0);
      ctx.restore();
      return;
    }
    var st = f.state;
    if (f.dance && (st === 'idle' || st === 'walk')) st = 'walk';
    // 格挡：按住 S 键持续生效，被击中时先播“格挡受击”再回到戒备姿态
    if (f.blocking && f.state !== 'ko') st = f.guardHit > 0 ? 'guardHit' : 'block';
    global.Sprites.draw(ctx, {
      composer: f.c, state: st, tick: f.tick, facing: f.facing,
      scale: SPRITE_SCALE, alpha: f.alpha,
      silhouette: f.flash > 3
    }, f.x, f.y);

    // 格挡护罩（持续按住时不停脉动）
    if (f.blocking) {
      var pulse = 0.45 + 0.3 * Math.sin(this.t * 0.22);
      ctx.save();
      ctx.globalAlpha = Math.min(1, pulse + (f.guardFlash > 0 ? 0.35 : 0));
      ctx.strokeStyle = f.guardFlash > 0 ? '#ffffff' : '#9fd6ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(f.x + (f.facing === 'right' ? 10 : -10), f.y - 62, 34, 62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.35;
      ctx.fillStyle = '#9fd6ff';
      ctx.fill();
      ctx.restore();
    }
    // 羁绊金色护罩
    if (f.bondShield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(this.t * 0.3);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 62, 42, 74, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#ffe066';
      ctx.fill();
      ctx.restore();
    }
    // 红色「回旋」反弹护盾（0.8 秒）
    if (f.rondoShield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.35 * Math.sin(this.t * 0.5);
      ctx.strokeStyle = global.SYSTEM_COLOR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 62, 46, 78, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = global.SYSTEM_COLOR;
      ctx.fill();
      // 环绕的旋转弧线，强调“即将反弹”
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      for (var rq = 0; rq < 3; rq++) {
        var ra = this.t * 0.16 + rq * 2.094;
        ctx.beginPath();
        ctx.arc(f.x, f.y - 62, 50, ra, ra + 0.8);
        ctx.stroke();
      }
      ctx.restore();
    }
    // 卡农进行中：头顶音符环 + 剩余时间
    if (f.canon) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      var cy = f.y - 118 + Math.sin(this.t * 0.16) * 4;
      ctx.strokeStyle = '#c8a2ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.x, cy, 16, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (f.canon.t / (f.canon.dur * 60 || f.canon.t)));
      ctx.stroke();
      ctx.fillStyle = '#c8a2ff';
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♪', f.x, cy + 4);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    if (f.shield > 0) {
      ctx.strokeStyle = 'rgba(143,199,255,' + (0.4 + 0.25 * Math.sin(this.t * 0.12)).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 62, 40, 72, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (f.armor) {
      ctx.strokeStyle = 'rgba(191,230,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 62, 36, 76, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (f.buff) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = f.c.sprite.accent;
      for (var i = 0; i < 5; i++) {
        var a = this.t * 0.06 + i * 1.25;
        ctx.fillRect(f.x + Math.cos(a) * 32 - 2, f.y - 66 + Math.sin(a) * 52 - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
    if (f.slow) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#c7b8ff';
      for (var k = 0; k < 3; k++) {
        ctx.fillRect(f.x - 22 + k * 18, f.y - 138 + Math.sin(this.t * 0.1 + k) * 3, 8, 3);
      }
      ctx.globalAlpha = 1;
    }
  };

  Game.prototype.drawFight = function (ctx) {
    this.drawFields(ctx);
    this.drawFighter(ctx, this.right);
    this.drawFighter(ctx, this.left);
    this.drawProjectiles(ctx);
    this.drawEchoes(ctx);
    this.drawMovements(ctx);
    this.fx.draw(ctx);
    this.drawHud(ctx);
    if (this.phase === 'intro') this.drawIntro(ctx);
    if (this.phase === 'ko') {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    this.fx.drawNumbers(ctx);
    this.drawBanner(ctx);
  };

  Game.prototype.drawProjectiles = function (ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      if (p.delay > 0) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      var col = p.owner.c.sprite.accent;
      var k;
      switch (p.kind) {
        case 'moon':
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = '#e8eeff';
          ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
          ctx.fillStyle = '#9fb4e8';
          ctx.beginPath(); ctx.arc(0, 0, 6, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
          break;
        case 'flute':
          ctx.fillStyle = '#f4f0e2'; ctx.fillRect(-14, -3, 28, 6);
          ctx.fillStyle = col; ctx.fillRect(-14, -3, 6, 6);
          ctx.fillStyle = '#fff'; ctx.fillRect(10, -2, 6, 4);
          break;
        case 'earth':
          ctx.fillStyle = '#7a5a3a'; rr(ctx, -16, -16, 32, 32, 8);
          ctx.fillStyle = '#a8814f'; rr(ctx, -12, -12, 20, 20, 6);
          break;
        case 'dream':
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#c7b8ff';
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f0e8ff';
          ctx.beginPath(); ctx.arc(-4, -3, 6, 0, Math.PI * 2); ctx.fill();
          break;
        case 'lullaby':
          ctx.fillStyle = '#ffd9e8';
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
          drawText(ctx, 'Z', -4, -6, 2, '#7a4a6a');
          break;
        case 'shell':
          ctx.fillStyle = '#5a5a62';
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#8a8a96'; ctx.fillRect(-4, -14, 8, 8);
          ctx.fillStyle = '#ff9c33'; ctx.fillRect(8, -3, 5, 5);
          break;
        case 'swan':
          ctx.fillStyle = '#e8f4ff';
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2b4a68';
          ctx.fillRect(2, -12, 10, 4); ctx.fillRect(9, -12, 3, 8);
          break;
        case 'mystic':
          ctx.strokeStyle = col; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
          break;
        case 'bell':
          ctx.fillStyle = '#d4af37';
          ctx.beginPath();
          ctx.moveTo(-11, 6); ctx.lineTo(-7, -8); ctx.lineTo(7, -8); ctx.lineTo(11, 6);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#f6e2a0'; ctx.fillRect(-4, 6, 8, 4);
          break;
        case 'chroma':
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = '#e0b0ff';
          for (k = 0; k < 3; k++) ctx.fillRect(-14 + k * 4, -10 + k * 7, 26, 2);
          break;
        case 'rhapsody':
          ctx.fillStyle = '#dfe6f5';
          for (k = 0; k < 3; k++) ctx.fillRect(-12 + k * 3, -12 + k * 8, 22, 3);
          break;
        // ---- 3.0 回旋体系的乐句形态 ----
        case 'lute':      // 鲁特琴的音符
          ctx.fillStyle = '#c8a2c8';
          ctx.beginPath(); ctx.ellipse(0, 3, 11, 8, -0.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(6, -16, 3, 20);
          ctx.fillStyle = '#f0e8ff';
          ctx.beginPath(); ctx.ellipse(-2, 1, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'fairy':     // 仙后星的闪光
          ctx.fillStyle = '#ffe066';
          ctx.beginPath();
          for (k = 0; k < 8; k++) {
            var fa = k * Math.PI / 4;
            var fr = (k % 2 === 0 ? 15 : 6);
            var fx2 = Math.cos(fa) * fr, fy2 = Math.sin(fa) * fr;
            if (k === 0) ctx.moveTo(fx2, fy2); else ctx.lineTo(fx2, fy2);
          }
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(-3, -3, 6, 6);
          break;
        case 'idee':      // 固定乐思：发光的动机核
          ctx.fillStyle = '#c86a3a';
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff2b0';
          ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'aria':      // 咏叹的乐句弧
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI * 0.8, Math.PI * 0.8); ctx.stroke();
          ctx.fillStyle = '#fff2b0';
          ctx.beginPath(); ctx.ellipse(6, 12, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(10, -6, 2, 18);
          break;
        case 'tear':      // 一滴泪
          ctx.fillStyle = '#a8d8ff';
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.quadraticCurveTo(12, 2, 0, 14);
          ctx.quadraticCurveTo(-12, 2, 0, -15);
          ctx.fill();
          ctx.fillStyle = '#e8f4ff';
          ctx.beginPath(); ctx.arc(-3, 2, 3.4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'rag':       // 切分音型
          ctx.fillStyle = '#e0c060';
          ctx.fillRect(-14, -10, 28, 6);
          ctx.fillRect(-2, -10, 4, 22);
          ctx.fillStyle = '#fff2b0';
          ctx.beginPath(); ctx.ellipse(-6, 12, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
          break;
        default:
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  };

  // ------------------ HUD ------------------
  Game.prototype.drawHud = function (ctx) {
    var L = this.left, R = this.right;
    this.drawHpBar(ctx, 24, 20, 380, 20, L, false);
    this.drawHpBar(ctx, W - 24 - 380, 20, 380, 20, R, true);

    drawText(ctx, L.c.en, 26, 46, 3, '#ffe9a8');
    drawText(ctx, R.c.en, W - 26, 46, 3, '#ffe9a8', 'right');
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#cfc7b0';
    ctx.fillText(L.c.name, 26, 78);
    ctx.textAlign = 'right';
    ctx.fillText(R.c.name, W - 26, 78);
    ctx.textAlign = 'left';

    this.drawTeamDots(ctx, 24, 88, this.playerTeam, false);
    this.drawTeamDots(ctx, W - 24, 88, this.enemyTeam, true);
    // 羁绊共鸣提示
    this.drawBondChips(ctx, 24, 108, this.playerTeam, this.playerBonds, this.left, false);
    this.drawBondChips(ctx, W - 24, 108, this.enemyTeam, this.enemyBonds, this.right, true);

    var sec = Math.max(0, Math.ceil(this.roundTime / 60));
    var tw = 78;
    ctx.fillStyle = 'rgba(8,6,14,0.85)';
    rr(ctx, W / 2 - tw / 2, 14, tw, 46, 6);
    ctx.strokeStyle = '#6d5c3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - tw / 2, 14, tw, 46);
    drawText(ctx, (sec < 10 ? '0' : '') + sec, W / 2, 25, 5, sec <= 10 ? '#ff7b6b' : '#ffe9a8', 'center');
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.textAlign = 'center';
    ctx.fillText('第 ' + this.roundNo + ' / 5 回合', W / 2, 72);
    ctx.textAlign = 'left';

    this.drawSkillBar(ctx, 24, H - 64, L, false);
    this.drawSkillBar(ctx, W - 24, H - 64, R, true);
    // 格挡状态提示
    this.drawGuardHint(ctx, L, false);
    this.drawGuardHint(ctx, R, true);
    this.drawStatusTags(ctx, L, false);
    this.drawStatusTags(ctx, R, true);

    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(207,199,176,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('♪ ' + (this.nowPlaying || ''), W / 2, H - 10);
    ctx.textAlign = 'left';
  };

  Game.prototype.drawHpBar = function (ctx, x, y, w, h, f, rightAlign) {
    ctx.fillStyle = 'rgba(8,6,14,0.92)';
    rr(ctx, x - 3, y - 3, w + 6, h + 6, 4);
    ctx.fillStyle = '#2a2233';
    ctx.fillRect(x, y, w, h);
    var ratio = clamp(f.hp / f.maxHp, 0, 1);
    var fill = Math.round(w * ratio);
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    if (ratio > 0.3) {
      g.addColorStop(0, '#ffe066'); g.addColorStop(0.5, '#7ee0a0'); g.addColorStop(1, '#3aa06a');
    } else {
      g.addColorStop(0, '#ffb066'); g.addColorStop(0.5, '#ff6b5f'); g.addColorStop(1, '#a02a2a');
    }
    ctx.fillStyle = g;
    if (rightAlign) ctx.fillRect(x + w - fill, y, fill, h);
    else ctx.fillRect(x, y, fill, h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    if (rightAlign) ctx.fillRect(x + w - fill, y + 2, fill, 3);
    else ctx.fillRect(x, y + 2, fill, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    for (var i = 1; i < 4; i++) ctx.fillRect(x + (w / 4) * i, y, 2, h);
    ctx.strokeStyle = '#6d5c3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    if (f.shield > 0) {
      var sw = clamp(f.shield / 60, 0, 1) * w;
      ctx.fillStyle = 'rgba(143,199,255,0.9)';
      if (rightAlign) ctx.fillRect(x + w - sw, y + h + 3, sw, 4);
      else ctx.fillRect(x, y + h + 3, sw, 4);
    }
    drawText(ctx, Math.max(0, Math.ceil(f.hp)) + '/' + f.maxHp,
      rightAlign ? x + w - 4 : x + 4, y + h + (f.shield > 0 ? 10 : 5), 2,
      'rgba(255,233,168,0.8)', rightAlign ? 'right' : 'left');
  };

  Game.prototype.drawTeamDots = function (ctx, x, y, team, rightAlign) {
    for (var i = 0; i < team.length; i++) {
      var f = team[i];
      var bx = rightAlign ? x - 16 - i * 20 : x + i * 20;
      ctx.fillStyle = '#0d0a14';
      rr(ctx, bx, y, 16, 16, 3);
      ctx.fillStyle = f.hp > 0 ? f.c.sprite.coat[0] : '#3a3344';
      rr(ctx, bx + 2, y + 2, 12, 12, 2);
      if (i === 0) {
        ctx.strokeStyle = '#ffe066';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx - 1, y - 1, 18, 18);
      }
      if (f.hp <= 0) {
        ctx.strokeStyle = '#ff6b5f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 3, y + 3); ctx.lineTo(bx + 13, y + 13);
        ctx.moveTo(bx + 13, y + 3); ctx.lineTo(bx + 3, y + 13);
        ctx.stroke();
      }
    }
  };

  Game.prototype.drawSkillBar = function (ctx, x, y, f, rightAlign) {
    var box = 54, gap = 8;
    for (var i = 0; i < 3; i++) {
      var sk = f.c.skills[i];
      var bx = rightAlign ? x - box - i * (box + gap) : x + i * (box + gap);
      var ready = f.cd[i] <= 0;
      ctx.fillStyle = 'rgba(18,14,28,0.94)';
      rr(ctx, bx, y, box, box, 5);
      ctx.strokeStyle = ready ? (i === 2 ? f.c.sprite.accent : '#7ee0c0') : '#4a4356';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 0.5, y + 0.5, box - 1, box - 1);
      var cx = bx + box / 2, cy = y + box / 2;
      ctx.globalAlpha = ready ? 1 : 0.4;
      ctx.fillStyle = i === 2 ? f.c.sprite.accent : f.c.sprite.coat[2];
      if (i === 0) {
        ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#141024';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      } else if (i === 1) {
        ctx.fillRect(cx - 13, cy - 3, 26, 6);
        ctx.fillRect(cx - 3, cy - 13, 6, 26);
      } else {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 13, cy + 9); ctx.lineTo(cx - 13, cy + 9);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!ready) {
        var p = clamp(f.cd[i] / (sk.cd * 60), 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx + 1, y + 1, box - 2, (box - 2) * p);
        drawText(ctx, String(Math.ceil(f.cd[i] / 60)), cx - 6, cy - 8, 3, '#cfc7b0');
      }
      drawText(ctx, ['Q', 'W', 'E'][i], bx + 4, y + 3, 2, ready ? '#ffe9a8' : '#6a6478');
      if (i === 2) {
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = ready ? '#ffe066' : '#6a6478';
        ctx.textAlign = rightAlign ? 'right' : 'left';
        ctx.fillText(sk.name, rightAlign ? bx + box : bx, y - 5);
        ctx.textAlign = 'left';
      }
    }
  };

  /** 羁绊共鸣徽标：绿色＝时期（伤害+12%），黄色＝地区（每 6~15 秒免疫 2.5 秒）*/
  Game.prototype.drawBondChips = function (ctx, x, y, team, bonds, active, rightAlign) {
    if (!bonds || (!bonds.era && !bonds.region && !bonds.system)) return;
    var chips = [];
    var eraPct = Math.round(global.BOND.eraDamage * 100);
    var regMin = Math.round(global.BOND.regionMin / 60);
    var regMax = Math.round(global.BOND.regionMax / 60);
    if (bonds.era) chips.push({ text: '绿·' + bonds.era.tag + '×' + bonds.era.count + ' 伤害+' + eraPct + '%', color: '#4ee0b0' });
    if (bonds.region) {
      var t = '';
      if (active && active.bondRegion) {
        t = active.bondShield > 0
          ? ' 免疫中 ' + (active.bondShield / 60).toFixed(1) + 's'
          : ' ' + Math.ceil(active.bondTimer / 60) + 's';
      }
      chips.push({ text: '黄·' + bonds.region.tag + '×' + bonds.region.count + ' 每' + regMin + '~' + regMax + '秒免疫2.5秒' + t, color: '#ffd166' });
    }
    if (bonds.system) {
      chips.push({
        text: '红·' + bonds.system.tag + '×' + bonds.system.count + ' ' + (global.SYSTEM_DESC[bonds.system.tag] || ''),
        color: global.SYSTEM_COLOR
      });
    }
    for (var i = 0; i < chips.length; i++) {
      var ch = chips[i];
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      var tw = ch.text.length * 11 + 14;
      var bx = rightAlign ? x - tw - i * 0 - 0 : x;
      if (rightAlign) bx = x - tw;
      var by = y + i * 20;
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      rr(ctx, bx, by, tw, 18, 4);
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, 17);
      ctx.fillStyle = ch.color;
      if (rightAlign) ctx.textAlign = 'right';
      ctx.fillText(ch.text, bx + (rightAlign ? tw - 7 : 7), by + 13);
      ctx.textAlign = 'left';
    }
  };

  /** 技能栏左侧的格挡状态灯 */
  Game.prototype.drawGuardHint = function (ctx, f, rightAlign) {
    var box = 54, gap = 8;
    var bx = rightAlign ? W - 24 - 3 * (box + gap) - 4 : 24 + 3 * (box + gap) + 4;
    var by = H - 64;
    var on = f.blocking;
    ctx.fillStyle = on ? 'rgba(30,52,70,0.95)' : 'rgba(14,11,20,0.9)';
    rr(ctx, bx, by, box, box, 5);
    ctx.strokeStyle = on ? '#9fd6ff' : '#3a3344';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 0.5, by + 0.5, box - 1, box - 1);
    // 盾牌图标
    var cx = bx + box / 2, cy = by + box / 2;
    ctx.globalAlpha = on ? 1 : 0.45;
    ctx.fillStyle = on ? '#9fd6ff' : '#5b5470';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx + 12, cy - 9);
    ctx.lineTo(cx + 12, cy + 3);
    ctx.quadraticCurveTo(cx, cy + 17, cx - 12, cy + 3);
    ctx.lineTo(cx - 12, cy - 9);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    drawText(ctx, 'S', bx + 4, by + 3, 2, on ? '#ffe9a8' : '#6a6478');
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = on ? '#9fd6ff' : '#6a6478';
    ctx.textAlign = rightAlign ? 'right' : 'left';
    ctx.fillText(on ? '格挡中' : '格挡 S', rightAlign ? bx + box : bx, by - 5);
    ctx.textAlign = 'left';
  };

  Game.prototype.drawStatusTags = function (ctx, f, rightAlign) {
    var tags = [];
    if (f.canon) tags.push(['卡农 ' + (f.canon.t / 60).toFixed(1) + 's', '#c8a2ff']);
    if (f.shield > 0) tags.push(['盾 ' + Math.ceil(f.shield), '#8fc7ff']);
    if (f.rondoShield > 0) tags.push(['反弹盾 ' + (f.rondoShield / 60).toFixed(1) + 's', global.SYSTEM_COLOR]);
    // v5.0：红色「节拍」体系共鸣的攻速加成（常驻，用标签说明拳脚更快）
    if (f.basicSpeed > 1) tags.push(['节拍 攻速+' + Math.round((f.basicSpeed - 1) * 100) + '%', global.SYSTEM_COLOR]);
    if (f.buff) tags.push(['强化', '#ffe066']);
    if (f.armor) tags.push(['减伤', '#bfe6ff']);
    if (f.slow) tags.push(['减速', '#c7b8ff']);
    if (f.weaken) tags.push(['虚弱', '#ff9cc0']);
    if (f.lifesteal > 0) {
      tags.push([f.lifestealT > 0 ? '吸血 ' + (f.lifestealT / 60).toFixed(1) + 's' : '吸血',
        '#ff9cc0']);
    }
    if (f.curse) tags.push(['诅咒', '#e0b0ff']);
    if (f.dance) tags.push(['起舞', '#ff9cc0']);
    if (f.bleed) tags.push(['流血', '#ff7b6b']);
    var x = rightAlign ? W - 24 : 24;
    var tagY = 152;
    for (var i = 0; i < tags.length; i++) {
      var tw = tags[i][0].length * 8 + 14;
      var bx = rightAlign ? x - (i + 1) * tw - i * 6 : x + i * (tw + 6);
      ctx.fillStyle = 'rgba(10,8,16,0.82)';
      rr(ctx, bx, tagY, tw, 18, 4);
      ctx.strokeStyle = tags[i][1];
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, tagY + 0.5, tw - 1, 17);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = tags[i][1];
      ctx.fillText(tags[i][0], bx + 7, tagY + 13);
    }
  };

  Game.prototype.drawIntro = function (ctx) {
    var txt = this.countdown > 0 ? String(this.countdown) : 'FIGHT!';
    ctx.globalAlpha = 0.95;
    drawText(ctx, txt, W / 2, H / 2 - 70, 8, '#ffe066', 'center');
    ctx.globalAlpha = 1;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#cfc7b0';
    ctx.textAlign = 'center';
    ctx.fillText(this.left.c.name + '   VS   ' + this.right.c.name, W / 2, H / 2 + 20);
    ctx.textAlign = 'left';
  };

  Game.prototype.drawBanner = function (ctx) {
    if (!this.banner) return;
    var b = this.banner;
    var h = b.sub ? (b.who ? 92 : 74) : 46;
    // 面板宽度随文字自适应
    var tw = Math.max(
      global.FX.textWidth(b.text, 4) + 90,
      b.sub ? global.FX.textWidth(b.sub, 1) + 70 : 0,
      240
    );
    var bw = Math.min(W - 40, tw);
    ctx.globalAlpha = Math.min(1, b.life / 20);
    ctx.fillStyle = 'rgba(8,6,14,0.78)';
    rr(ctx, W / 2 - bw / 2, 148, bw, h, 6);
    ctx.strokeStyle = 'rgba(255,233,168,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - bw / 2, 148, bw, h);
    if (b.who) {
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = b.mine ? '#7ee0c0' : '#ff9c9c';
      ctx.textAlign = 'center';
      ctx.fillText(b.mine ? ('我方 · ' + b.who) : ('敌方 · ' + b.who), W / 2, 166);
      ctx.textAlign = 'left';
    }
    drawTextAuto(ctx, b.text, W / 2, b.who ? 178 : 160, 4, '#ffe066', 'center');
    if (b.sub) {
      ctx.font = '16px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#f4f0e2';
      ctx.textAlign = 'center';
      ctx.fillText(b.sub, W / 2, b.who ? 224 : 206);
      ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
  };

  Game.prototype.drawRoundOver = function (ctx) {
    ctx.globalAlpha = 0.66;
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    var winName = this.loserSide === 'left' ? this.right.c.name : this.left.c.name;
    drawText(ctx, 'ROUND ' + this.roundNo, W / 2, 96, 4, '#ffe066', 'center');
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#7ee0c0';
    ctx.textAlign = 'center';
    ctx.fillText(winName + ' 获胜！', W / 2, 150);
    ctx.fillStyle = '#f4f0e2';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillText('下一轮出场：' + this.nextFighterName, W / 2, 186);
    ctx.fillStyle = 'rgba(207,199,176,0.7)';
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillText('按 Enter / Space 立即继续', W / 2, 214);
    ctx.textAlign = 'left';
    this.drawTeamPreview(ctx, this.playerTeam, 250, 400, false);
    this.drawTeamPreview(ctx, this.enemyTeam, W - 250, 400, true);
  };

  Game.prototype.drawTeamPreview = function (ctx, team, cx, cy, rightAlign) {
    var n = team.length;
    for (var i = 0; i < n; i++) {
      var f = team[i];
      // 两队都按 index 从左到右排列，便于对照“第 1/2/3 位”
      var px = cx + (i * 92 - (n - 1) * 46);
      ctx.save();
      ctx.globalAlpha = f.hp > 0 ? 1 : 0.3;
      global.Sprites.draw(ctx, {
        composer: f.c, state: 'idle', tick: this.t * 0.8 + i * 9,
        facing: rightAlign ? 'left' : 'right', scale: 0.74
      }, px, cy);
      ctx.restore();
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = f.hp > 0 ? '#cfc7b0' : '#6a6478';
      ctx.textAlign = 'center';
      ctx.fillText(f.c.name, px, cy + 20);
      ctx.fillStyle = f.hp > 0 ? '#7ee0c0' : '#6a6478';
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('HP ' + Math.max(0, Math.ceil(f.hp)), px, cy + 36);
      ctx.textAlign = 'left';
    }
  };

  // ------------------ 设置界面 ------------------
  Game.prototype.drawSettings = function (ctx) {
    // 半透明遮罩，后面的画面仍然可见
    ctx.fillStyle = 'rgba(5,4,10,0.78)';
    ctx.fillRect(0, 0, W, H);
    var pw = 520, ph = 300, px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(14,10,22,0.98)';
    rr(ctx, px, py, pw, ph, 10);
    ctx.strokeStyle = '#ffd479';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffe066';
    ctx.textAlign = 'center';
    ctx.fillText('设　置', W / 2, py + 34);
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#8c84a0';
    ctx.fillText('I J K L 选择　A / D 或 ← → 切换　O / Enter 关闭', W / 2, py + 56);
    ctx.textAlign = 'left';

    var rows = [
      { label: '静音', value: this.settings.muted ? '开' : '关', extra: '全部声音（含 BGM）一起关掉，也可以随时按 M 键切换' },
      {
        label: '对战音效',
        value: this.settings.sfx !== false ? '开' : '关',
        extra: '只控制打击 / 技能 / 命中反馈音，BGM 不受影响'
      },
      { label: '返回', value: '关闭设置', extra: '' }
    ];
    for (var i = 0; i < rows.length; i++) {
      var ry = py + 78 + i * 62;
      var sel = i === this.settingsIndex;
      ctx.fillStyle = sel ? 'rgba(58,44,18,0.95)' : 'rgba(20,16,30,0.9)';
      rr(ctx, px + 20, ry, pw - 40, 52, 6);
      ctx.strokeStyle = sel ? '#ffe066' : '#3a3344';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(px + 20.5, ry + 0.5, pw - 41, 51);
      ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = sel ? '#ffe066' : '#cfc7b0';
      ctx.fillText(rows[i].label, px + 36, ry + 24);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#7ee0c0';
      ctx.fillText(rows[i].value, px + pw - 56, ry + 24);
      ctx.textAlign = 'left';
      if (sel) {
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.fillText('◀', px + pw - 46, ry + 25);
        ctx.fillText('▶', px + 22, ry + 25);
      }
      if (rows[i].extra) {
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#8c84a0';
        ctx.fillText(rows[i].extra, px + 36, ry + 43);
      }
    }
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(140,132,160,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('设置会自动保存，下次打开仍然生效', W / 2, py + ph - 14);
    ctx.textAlign = 'left';
  };

  /** 右上角显示正在播放的曲目（标题与选人界面） */
  Game.prototype.drawNowPlaying = function (ctx, top) {
    var title = this.nowPlaying || '（按 Enter 开始后可试听）';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    var tw = Math.max(150, title.length * 12 + 46);
    var x = W - 16 - tw;
    ctx.fillStyle = 'rgba(10,8,16,0.82)';
    rr(ctx, x, top, tw, 24, 5);
    ctx.strokeStyle = '#3a3344';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, top + 0.5, tw - 1, 23);
    ctx.fillStyle = '#7ee0c0';
    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
    ctx.fillText('♪', x + 9, top + 16);
    ctx.fillStyle = '#cfe9e2';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText(title, x + 24, top + 16);
  };

  // ------------------ 标题画面 ------------------
  Game.prototype.drawTitle = function (ctx) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    for (var i = 0; i < this.titleNotes.length; i++) {
      var tn = this.titleNotes[i];
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = tn.color;
      ctx.beginPath();
      ctx.ellipse(tn.x, tn.y, tn.size * 0.55, tn.size * 0.42, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(tn.x + tn.size * 0.35, tn.y - tn.size * 2, 2, tn.size * 2);
      ctx.fillRect(tn.x + tn.size * 0.35, tn.y - tn.size * 2, tn.size * 0.7, 2);
    }
    ctx.globalAlpha = 1;

    // 人数与体系数一律从数据里读，别再写死（v5.0 加到 75 人 / 七套体系时，
    // 写死的标题文案就成了明显的旧版本残留）
    var rosterN = global.COMPOSERS.length;
    var sysN = global.SYSTEM_TAGS.length;
    var trackN = global.Chiptune.trackCount ? global.Chiptune.trackCount() : 0;
    var title = 'CLASSIC COMPOSERS';
    drawText(ctx, title, W / 2 + 3, 99, 7, '#3a2e12', 'center');
    drawText(ctx, title, W / 2, 96, 7, '#ffe066', 'center');
    ctx.font = 'bold 34px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#f4f0e2';
    ctx.textAlign = 'center';
    ctx.fillText('古典作曲家 大乱斗', W / 2, 164);
    ctx.font = '15px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.fillText(rosterN + ' 位作曲家 · 3V3 轮换赛制 · 羁绊共鸣 · ' + trackN + ' 首 8bit 名曲 BGM',
      W / 2, 198);

    var demo = [0, 7, 11];
    for (var k = 0; k < 3; k++) {
      global.Sprites.draw(ctx, {
        composer: global.COMPOSERS[demo[k]],
        state: k === 1 ? 'cast' : 'idle',
        tick: this.t * 0.6 + k * 14,
        facing: k === 2 ? 'left' : 'right',
        scale: 1.35
      }, W / 2 + (k - 1) * 210, 402);
    }

    if ((this.t >> 4) % 2 === 0) {
      ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffe066';
      ctx.fillText('按 Enter / Space 开始', W / 2, 462);
    }
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#8c84a0';
    ctx.fillText(KEY_HINT + '　静音 M　重开 R', W / 2, 500);
    ctx.fillText(rosterN + ' 位作曲家　·　' + sysN + ' 套战斗体系　·　羁绊共鸣（同标签 2 人以上）',
      W / 2, 520);
    ctx.fillText('按 O 打开设置', W / 2, 538);
    ctx.textAlign = 'left';
    // 右上角显示当前曲目，右下角版本号
    this.drawNowPlaying(ctx, 8);
    drawText(ctx, VERSION_TEXT, W - 20, H - 20, 2, 'rgba(207,199,176,0.85)', 'right');
  };

  // ------------------ 选人画面 ------------------
  // ------------------ 选人画面（75 位作曲家，分页显示）------------------
  var SEL_COLS = 5, SEL_ROWS = 5, SEL_PER_PAGE = SEL_COLS * SEL_ROWS;
  var SEL_CELL_W = 100, SEL_CELL_H = 70, SEL_GAP = 6;

  Game.prototype.selPageCount = function () {
    return Math.max(1, Math.ceil(global.COMPOSERS.length / SEL_PER_PAGE));
  };
  Game.prototype.selPage = function () {
    return Math.floor(this.uiIndex / SEL_PER_PAGE);
  };
  Game.prototype.selCellPos = function (idx) {
    var local = idx % SEL_PER_PAGE;
    var col = local % SEL_COLS, row = (local / SEL_COLS) | 0;
    var gx = 20, gy = 50;
    return { x: gx + col * (SEL_CELL_W + SEL_GAP), y: gy + row * (SEL_CELL_H + SEL_GAP) };
  };

  Game.prototype.drawTagChip = function (ctx, x, y, text, color, small) {
    ctx.font = (small ? 10 : 11) + 'px "Microsoft YaHei", sans-serif';
    var tw = text.length * (small ? 10 : 11) + (small ? 10 : 14);
    var h = small ? 14 : 17;
    ctx.fillStyle = 'rgba(10,8,16,0.9)';
    rr(ctx, x, y, tw, h, 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, h - 1);
    ctx.fillStyle = color;
    ctx.fillText(text, x + (small ? 5 : 7), y + (small ? 11 : 13));
    return tw;
  };

  Game.prototype.drawSelect = function (ctx) {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    drawTextAuto(ctx, '选择三名出场作曲家', W / 2, 2, 4, '#ffe066', 'center');

    var gx = 20, gy = 50;
    var page = this.selPage();
    var base = page * SEL_PER_PAGE;
    var total = global.COMPOSERS.length;
    // 页码与页签放在左上角，更醒目
    var pbw = 214, pbh = 32;
    ctx.fillStyle = 'rgba(12,9,20,0.94)';
    rr(ctx, 12, 2, pbw, pbh, 6);
    ctx.strokeStyle = '#ffd479';
    ctx.lineWidth = 2;
    ctx.strokeRect(12.5, 2.5, pbw - 1, pbh - 1);
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffd479';
    ctx.fillText('第 ' + (page + 1) + ' / ' + this.selPageCount() + ' 页', 24, 24);
    for (var pg = 0; pg < this.selPageCount(); pg++) {
      var bx0 = 128 + pg * 24, by0 = 10;
      ctx.fillStyle = pg === page ? '#ffd479' : '#3a3344';
      rr(ctx, bx0, by0, 18, 18, 3);
      drawText(ctx, String(pg + 1), bx0 + 6, by0 + 3, 2, pg === page ? '#0d1a16' : '#8c84a0');
    }
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(140,132,160,0.9)';
    ctx.fillText('共 ' + total + ' 位', 182, 24);
    // 右上角当前曲目
    this.drawNowPlaying(ctx, 4);

    var cellW = SEL_CELL_W, cellH = SEL_CELL_H;
    for (var k2 = 0; k2 < SEL_PER_PAGE; k2++) {
      var i = base + k2;
      if (i >= total) break;
      var c = global.COMPOSERS[i];
      var pos = this.selCellPos(i);
      var x = pos.x, y = pos.y;
      var isFocus = i === this.uiIndex;
      var slotIdx = this.selSlots.indexOf(i);
      var picked = slotIdx >= 0;
      // 羁绊共鸣高亮：与已选角色同标签
      var bonded = picked || this.sharesTagWithSelection(i);
      ctx.fillStyle = picked ? 'rgba(46,38,20,0.96)' : 'rgba(16,12,24,0.94)';
      rr(ctx, x, y, cellW, cellH, 6);
      ctx.strokeStyle = isFocus ? '#ffe066' : (picked ? '#7ee0c0' : (bonded ? '#6a7a6a' : '#3a3344'));
      ctx.lineWidth = isFocus ? 3 : (bonded ? 2 : 1);
      ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      // 立绘
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellW, cellH - 13);
      ctx.clip();
      global.Sprites.draw(ctx, {
        composer: c, state: 'idle', tick: this.t * 0.7 + i * 7, facing: 'right', scale: 0.54
      }, x + cellW / 2 - 2, y + cellH - 11);
      ctx.restore();
      // 名字
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = isFocus ? '#ffe066' : '#cfc7b0';
      ctx.textAlign = 'center';
      var nm = c.name.length > 8 ? c.name.slice(0, 8) : c.name;
      ctx.fillText(nm, x + cellW / 2, y + cellH - 2);
      ctx.textAlign = 'left';
      // 标签色条：左＝时期（绿系）　右＝地区（黄系）　下＝体系（红色）
      ctx.fillStyle = (global.ERA_COLOR && global.ERA_COLOR[c.tags.era]) || '#4ee0b0';
      rr(ctx, x + 3, y + 3, 7, 12, 2);
      ctx.fillStyle = (global.REGION_COLOR && global.REGION_COLOR[c.tags.region]) || '#ffd166';
      rr(ctx, x + cellW - 10, y + 3, 7, 12, 2);
      if (c.tags.system) {
        ctx.fillStyle = global.SYSTEM_COLOR;
        rr(ctx, x + 3 + 9, y + 3, 7, 12, 2);
      }
      // 已选序号
      if (picked) {
        ctx.fillStyle = 'rgba(126,224,192,0.95)';
        rr(ctx, x + cellW - 24, y + cellH - 20, 21, 17, 3);
        drawText(ctx, String(slotIdx + 1), x + cellW - 20, y + cellH - 18, 2, '#0d1a16');
      }
    }

    // ---------------- 键位提示（放在网格与底部之间的独立一行，避免被其他元素遮挡）----------------
    var hintY = 50 + SEL_ROWS * SEL_CELL_H + (SEL_ROWS - 1) * SEL_GAP + 3;
    ctx.fillStyle = 'rgba(10,8,16,0.9)';
    rr(ctx, 12, hintY, W - 24, 18, 4);
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#b9b1c8';
    ctx.textAlign = 'center';
    ctx.fillText('A / D 选中或取消　S 清空　Q / E 翻页　Enter 开战　O 设置　P 返回标题' +
      '　　｜　　绿＝时期　黄＝地区　红＝体系（同标签 2 人以上共鸣）', W / 2, hintY + 13);
    ctx.textAlign = 'left';

    // ---------------- 开战提示（放在标题下方，不与底部羁绊面板重叠）----------------
    var left = 0;
    for (var z = 0; z < 3; z++) if (this.selSlots[z] == null) left++;
    var ready = left === 0;
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = ready ? ((this.t >> 3) % 2 === 0 ? '#ffe066' : '#c8b06a') : '#7a7290';
    ctx.textAlign = 'center';
    ctx.fillText(ready ? '按 Enter / Space 开始对战！' : '还需选择 ' + left + ' 名角色', W / 2, 44);
    ctx.textAlign = 'left';

    // ---------------- 右侧资料面板 ----------------
    var cur = global.COMPOSERS[this.uiIndex];
    var px = 600, py = 32, pw = 344, ph = 402;
    ctx.fillStyle = 'rgba(14,10,22,0.96)';
    rr(ctx, px, py, pw, ph, 8);
    ctx.strokeStyle = cur.sprite.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    // 立绘
    ctx.fillStyle = 'rgba(20,15,30,0.9)';
    rr(ctx, px + 6, py + 6, 116, 150, 6);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 6, py + 6, 116, 150);
    ctx.clip();
    global.Sprites.draw(ctx, {
      composer: cur, state: 'idle', tick: this.t, facing: 'right', scale: 1.16
    }, px + 64, py + 152);
    ctx.restore();

    // 姓名 / 英文 / 标签
    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffe066';
    ctx.fillText(cur.name, px + 130, py + 28);
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.fillText(cur.en, px + 130, py + 45);
    var tx = px + 130, ty = py + 54;
    if (cur.tags.era) tx += this.drawTagChip(ctx, tx, ty, cur.tags.era, '#4ee0b0', true) + 4;
    if (cur.tags.region) tx += this.drawTagChip(ctx, tx, ty, cur.tags.region, '#ffd166', true) + 4;
    if (cur.tags.system) this.drawTagChip(ctx, tx, ty, cur.tags.system, global.SYSTEM_COLOR, true);
    // 共鸣状态
    var sharedEra = 0, sharedReg = 0, sharedSys = 0;
    for (var q2 = 0; q2 < 3; q2++) {
      var sid = this.selSlots[q2];
      if (sid == null) continue;
      var sc = global.COMPOSERS[sid];
      if (cur.tags.era && sc.tags.era === cur.tags.era) sharedEra++;
      // v5.0：地区共鸣是「成对」判断（法派与波兰、法派与比利时都能共鸣，
      //       但波兰与比利时不能），所以用 regionResonates 而不是比较组名
      if (cur.tags.region && global.regionResonates(sc.tags.region, cur.tags.region)) sharedReg++;
      if (cur.tags.system && sc.tags.system === cur.tags.system) sharedSys++;
    }
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    if (sharedEra > 0 || sharedReg > 0 || sharedSys > 0) {
      var msg = [];
      if (sharedEra > 0) msg.push('时期 ' + (sharedEra + 1));
      if (sharedReg > 0) msg.push('地区 ' + (sharedReg + 1));
      if (sharedSys > 0) msg.push('体系 ' + (sharedSys + 1));
      ctx.fillStyle = '#ffd479';
      ctx.fillText('★ 共鸣：' + msg.join('　') + ' 人', px + 130, py + 84);
    } else {
      ctx.fillStyle = '#5b5470';
      ctx.fillText('暂无同标签队友', px + 130, py + 84);
    }

    // 属性
    var stats = [
      ['体力', cur.stats.hp / 250, '#ff6b5f', cur.stats.hp],
      ['力量', cur.stats.power / 24, '#ffb066', cur.stats.power],
      ['速度', cur.stats.speed / 24, '#7ee0c0', cur.stats.speed]
    ];
    for (var s = 0; s < stats.length; s++) {
      var sy = py + 94 + s * 18;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#9c94a8';
      ctx.fillText(stats[s][0], px + 130, sy + 9);
      ctx.fillStyle = '#241d33';
      ctx.fillRect(px + 160, sy, 118, 9);
      ctx.fillStyle = stats[s][2];
      ctx.fillRect(px + 160, sy, 118 * clamp(stats[s][1], 0, 1), 9);
      ctx.fillStyle = '#8c84a0';
      ctx.fillText(String(stats[s][3]), px + 284, sy + 9);
    }
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.fillText(cur.quote, px + 130, py + 172);

    // 技能
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#cfc7b0';
    ctx.fillText(cur.desc.slice(0, 27), px + 10, py + 198);
    if (cur.desc.length > 27) ctx.fillText(cur.desc.slice(27, 54), px + 10, py + 211);
    for (var k = 0; k < 3; k++) {
      var sk = cur.skills[k];
      var yy = py + 218 + k * 60;
      ctx.fillStyle = k === 2 ? 'rgba(58,44,18,0.94)' : 'rgba(20,16,30,0.94)';
      rr(ctx, px + 10, yy, pw - 20, 56, 5);
      ctx.strokeStyle = k === 2 ? cur.sprite.accent : '#4a4356';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 10.5, yy + 0.5, pw - 21, 55);
      drawText(ctx, sk.key, px + 16, yy + 8, 3, '#ffe066');
      // 机制标识
      var tag = { field: '领域', echo: '回声', projectile: '音波', dashAttack: '突进', multiHit: '连击', ultimate: '终极' }[sk.type];
      ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = k === 2 ? '#ffe066' : '#7ee0c0';
      ctx.fillText(sk.name + '·' + sk.sub, px + 38, yy + 18);
      if (tag) {
        ctx.font = '10px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#c8a2ff';
        ctx.fillText('【' + tag + '】', px + pw - 56, yy + 18);
      }
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#a89fb8';
      ctx.fillText(sk.desc.slice(0, 27), px + 38, yy + 33);
      if (sk.desc.length > 27) ctx.fillText(sk.desc.slice(27, 54), px + 38, yy + 45);
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#8c84a0';
      ctx.textAlign = 'right';
      ctx.fillText('CD ' + sk.cd + 's', px + pw - 14, yy + 45);
      ctx.textAlign = 'left';
    }

    // ---------------- 我方出场顺序（底部左侧）----------------
    var slotY = 448;
    for (var m = 0; m < 3; m++) {
      var bx = 16 + m * 156, by = slotY;
      ctx.fillStyle = 'rgba(14,10,22,0.96)';
      rr(ctx, bx, by, 148, 82, 6);
      ctx.strokeStyle = this.selSlots[m] == null ? '#3a3344' : '#7ee0c0';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 0.5, by + 0.5, 147, 81);
      drawText(ctx, String(m + 1), bx + 6, by + 5, 2, '#8c84a0');
      if (this.selSlots[m] == null) {
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#5b5470';
        ctx.textAlign = 'center';
        ctx.fillText('空缺', bx + 74, by + 48);
        ctx.textAlign = 'left';
      } else {
        var cc = global.COMPOSERS[this.selSlots[m]];
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx + 2, by + 2, 52, 78);
        ctx.clip();
        global.Sprites.draw(ctx, { composer: cc, state: 'idle', tick: this.t + m * 8, facing: 'right', scale: 0.55 }, bx + 28, by + 86);
        ctx.restore();
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ffe066';
        ctx.fillText(cc.name, bx + 58, by + 20);
        var cx2 = bx + 58, cy2 = by + 26;
        if (cc.tags.system) cx2 += this.drawTagChip(ctx, cx2, cy2, cc.tags.system, global.SYSTEM_COLOR, true) + 4;
        var cx3 = bx + 58, cy3 = by + 42;
        if (cc.tags.era) cx3 += this.drawTagChip(ctx, cx3, cy3, cc.tags.era, '#4ee0b0', true) + 4;
        if (cc.tags.region) this.drawTagChip(ctx, cx3, cy3, cc.tags.region, '#ffd166', true);
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#8c84a0';
        ctx.fillText('HP ' + cc.maxHp, bx + 58, by + 72);
      }
    }

    // ---------------- 羁绊预览（底部右侧）----------------
    var chosenIds = [], chosen = [];
    for (var v = 0; v < 3; v++) {
      if (this.selSlots[v] != null) { chosenIds.push(global.COMPOSERS[this.selSlots[v]].id); chosen.push(global.COMPOSERS[this.selSlots[v]]); }
    }
    var bonds = global.computeBonds(chosenIds);
    var by2 = 448;
    ctx.fillStyle = 'rgba(12,9,20,0.94)';
    rr(ctx, 486, by2, 458, 82, 6);
    ctx.strokeStyle = bonds.era || bonds.region || bonds.system ? '#ffd479' : '#3a3344';
    ctx.lineWidth = 2;
    ctx.strokeRect(486.5, by2 + 0.5, 457, 81);
    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffd479';
    ctx.fillText('羁绊共鸣', 496, by2 + 17);
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    var ly = by2 + 17;
    if (bonds.era) {
      ctx.fillStyle = '#4ee0b0';
      ctx.fillText('● 时期·' + bonds.era.tag + ' ×' + bonds.era.count + '　→　伤害 +' +
        Math.round(global.BOND.eraDamage * 100) + '%', 566, ly);
      ly += 17;
    }
    if (bonds.region) {
      ctx.fillStyle = '#ffd166';
      ctx.fillText('● 地区·' + bonds.region.tag + ' ×' + bonds.region.count + '　→　' +
        global.regionBondText(), 566, ly);
      ly += 17;
    }
    if (bonds.system) {
      ctx.fillStyle = global.SYSTEM_COLOR;
      ctx.fillText('● 体系·' + bonds.system.tag + ' ×' + bonds.system.count + '　→　' +
        (global.SYSTEM_DESC[bonds.system.tag] || ''), 566, ly);
      ly += 17;
    }
    if (!bonds.era && !bonds.region && !bonds.system) {
      ctx.fillStyle = '#6a6478';
      ctx.fillText('尚未共鸣：选出两名以上拥有相同时期 / 地区 / 体系标签的作曲家即可触发', 496, ly);
      ly += 17;
    } else {
      ctx.fillStyle = '#8c84a0';
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      var names = [];
      for (var w = 0; w < chosen.length; w++) {
        var ok = false;
        if (bonds.era && bonds.era.idxs.indexOf(w) >= 0) ok = true;
        if (bonds.region && bonds.region.idxs.indexOf(w) >= 0) ok = true;
        if (bonds.system && bonds.system.idxs.indexOf(w) >= 0) ok = true;
        if (ok) names.push(chosen[w].name);
      }
      ctx.fillText('生效角色：' + names.join('、'), 496, ly + 2);
    }
  };

  /** 该角色是否与当前已选角色共享任一标签（用于选人界面高亮） */
  Game.prototype.sharesTagWithSelection = function (idx) {
    var c = global.COMPOSERS[idx];
    for (var i = 0; i < 3; i++) {
      var sid = this.selSlots[i];
      if (sid == null || sid === idx) continue;
      var sc = global.COMPOSERS[sid];
      if (c.tags.era && c.tags.era === sc.tags.era) return true;
      if (c.tags.region && global.regionResonates(c.tags.region, sc.tags.region)) return true;
      if (c.tags.system && c.tags.system === sc.tags.system) return true;
    }
    return false;
  };

  // ------------------ VS ------------------
  Game.prototype.drawVs = function (ctx) {
    ctx.fillStyle = '#07060c';
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'TEAM BATTLE', W / 2, 22, 4, '#ffe066', 'center');
    var t = Math.min(1, this.t / 40);
    for (var i = 0; i < 3; i++) {
      var L = this.playerTeam[i], R = this.enemyTeam[i];
      if (!L || !R) continue;
      var y = 106 + i * 112;
      var lx = -180 + t * (230 + i * 8);
      var rx = W + 180 - t * (230 + i * 8);
      ctx.save();
      ctx.globalAlpha = t;
      global.Sprites.draw(ctx, { composer: L.c, state: 'idle', tick: this.t + i * 10, facing: 'right', scale: 0.84 }, lx, y + 46);
      global.Sprites.draw(ctx, { composer: R.c, state: 'idle', tick: this.t + i * 10 + 5, facing: 'left', scale: 0.84 }, rx, y + 46);
      ctx.restore();
      ctx.globalAlpha = t;
      ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#7ee0c0';
      ctx.textAlign = 'right';
      ctx.fillText((i + 1) + '. ' + L.c.name, 350, y + 14);
      ctx.fillStyle = '#ff9c9c';
      ctx.textAlign = 'left';
      ctx.fillText(R.c.name + ' .' + (i + 1), 610, y + 14);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,233,168,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(368, y - 26); ctx.lineTo(592, y - 26); ctx.stroke();
    }
    if ((this.t >> 3) % 2 === 0) drawText(ctx, 'VS', W / 2, 250, 6, '#ff6b5f', 'center');
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.textAlign = 'center';
    ctx.fillText('我方先出场：' + this.playerTeam[0].c.name + '　　敌方先出场：' + this.enemyTeam[0].c.name, W / 2, H - 30);
    ctx.fillText('BGM ♪ ' + (this.nowPlaying || ''), W / 2, H - 10);
    ctx.textAlign = 'left';
  };

  // ------------------ 结算 ------------------
  Game.prototype.drawResult = function (ctx) {
    ctx.fillStyle = '#07060c';
    ctx.fillRect(0, 0, W, H);
    var win = this.winSide === 'left';
    drawText(ctx, win ? 'YOU WIN' : 'YOU LOSE', W / 2, 54, 8, win ? '#ffe066' : '#ff6b5f', 'center');
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#f4f0e2';
    ctx.textAlign = 'center';
    ctx.fillText(win ? '音乐会圆满成功！' : '乐队已经散场……', W / 2, 132);
    var team = win ? this.playerTeam : this.enemyTeam;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#cfc7b0';
    ctx.fillText(win ? '存活阵容' : '对手阵容', W / 2, 178);
    for (var i = 0; i < team.length; i++) {
      var f = team[i];
      var px2 = W / 2 + (i - (team.length - 1) / 2) * 190;
      ctx.save();
      global.Sprites.draw(ctx, { composer: f.c, state: 'win', tick: this.t + i * 12, facing: 'right', scale: 1.1 }, px2, 344);
      ctx.restore();
      ctx.font = '15px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffe066';
      ctx.fillText(f.c.name, px2, 358);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#8c84a0';
      ctx.fillText('剩余 HP ' + Math.max(0, Math.ceil(f.hp)), px2, 378);
    }
    ctx.font = '15px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#9c94a8';
    ctx.fillText('共进行 ' + this.roundNo + ' 回合', W / 2, 428);
    if (this.t > 110 && (this.t >> 4) % 2 === 0) {
      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
      ctx.fillText('按 Enter / Space 重新选人', W / 2, 476);
    }
    ctx.textAlign = 'left';
  };

  global.GameClass = Game;
  global.FighterClass = Fighter;   // 供开发期测试工具构造战斗单位
  global.GAME_CONST = {
    W: W, H: H, GROUND: GROUND,
    LEFT_MIN: LEFT_MIN, LEFT_MAX: LEFT_MAX,
    RIGHT_MIN: RIGHT_MIN, RIGHT_MAX: RIGHT_MAX,
    ROUND_TIME: ROUND_TIME, SPRITE_SCALE: SPRITE_SCALE, GRAVITY: GRAVITY,
    FIELD_DAMAGE_SCALE: FIELD_DAMAGE_SCALE, FIELD_SLOW_FLOOR: FIELD_SLOW_FLOOR,
    DAMAGE_SCALE: DAMAGE_SCALE, ULT_OPENING_CD: ULT_OPENING_CD, JUMP_APEX: JUMP_APEX,
    VERSION: VERSION_TEXT
  };
})(window);

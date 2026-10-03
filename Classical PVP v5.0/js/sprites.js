/* ============================================================
   sprites.js — 90 年代红白机像素角色绘制
   低帧率关键帧动画（每 6 个渲染帧换一帧关键帧）
   角度约定：0 = 向下（顺躯干），+90 = 面朝方向，180 = 向上，-90 = 身后
   所有姿势朝向 +X（向右），朝左时由渲染器整体镜像
   ============================================================ */
(function (global) {
  'use strict';

  function rr(ctx, x, y, w, h, r) {
    if (w <= 0 || h <= 0) return;
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

  function seg(x, y, ang, len) {
    var r = ang * Math.PI / 180;
    return { x: x + Math.sin(r) * len, y: y + Math.cos(r) * len };
  }

  // ---------- 姿势数据表 ----------
  // thigh/shin/upper/fore 均为“大腿/小腿/上臂/前臂”的绝对角度
  var POSE = {};

  POSE.idle0 = { thighF: 9, shinF: 4, thighB: -7, shinB: -3, upperF: -11, foreF: 1, upperB: -17, foreB: -7, lean: 0, headTilt: 0, sq: 1 };
  POSE.idle1 = { thighF: 6, shinF: 3, thighB: -5, shinB: -2, upperF: -8, foreF: 4, upperB: -14, foreB: -4, lean: 1, headTilt: -1, sq: 0.975 };
  POSE.idle2 = { thighF: 11, shinF: 6, thighB: -9, shinB: -4, upperF: -13, foreF: -2, upperB: -19, foreB: -9, lean: -1, headTilt: 1, sq: 1.005 };

  POSE.walk0 = { thighF: 27, shinF: 17, thighB: -25, shinB: -35, upperF: -30, foreF: -16, upperB: 27, foreB: 45, lean: 3, headTilt: 0, sq: 1 };
  POSE.walk1 = { thighF: 5, shinF: 3, thighB: -6, shinB: -50, upperF: -7, foreF: 7, upperB: 7, foreB: 21, lean: 3, headTilt: 0, sq: 0.985 };
  POSE.walk2 = { thighF: -23, shinF: -33, thighB: 25, shinB: 15, upperF: 25, foreF: 41, upperB: -29, foreB: -15, lean: 3, headTilt: 0, sq: 1 };
  POSE.walk3 = { thighF: -6, shinF: -50, thighB: 5, shinB: 3, upperF: 8, foreF: 22, upperB: -7, foreB: -3, lean: 3, headTilt: 0, sq: 0.985 };

  POSE.punch0 = { thighF: 7, shinF: 4, thighB: -9, shinB: -5, upperF: -30, foreF: -78, upperB: 12, foreB: 32, lean: -4, headTilt: 2, sq: 0.99 };
  POSE.punch1 = { thighF: 12, shinF: 8, thighB: -14, shinB: -20, upperF: 82, foreF: 90, upperB: -42, foreB: -70, lean: 9, headTilt: -1, sq: 1 };
  POSE.punch2 = { thighF: 9, shinF: 5, thighB: -8, shinB: -4, upperF: 32, foreF: 22, upperB: -12, foreB: -14, lean: 4, headTilt: 0, sq: 1 };

  POSE.kick0 = { thighF: 34, shinF: -40, thighB: -8, shinB: -4, upperF: 26, foreF: 50, upperB: -24, foreB: -40, lean: -5, headTilt: 3, sq: 1 };
  POSE.kick1 = { thighF: 88, shinF: 92, thighB: -11, shinB: -7, upperF: -30, foreF: -60, upperB: 34, foreB: 70, lean: 7, headTilt: -4, sq: 1 };
  POSE.kick2 = { thighF: 44, shinF: 10, thighB: -8, shinB: -4, upperF: 10, foreF: 30, upperB: -14, foreB: -20, lean: 3, headTilt: 0, sq: 1 };

  POSE.block0 = { thighF: 8, shinF: 6, thighB: -22, shinB: -32, upperF: 60, foreF: 168, upperB: 45, foreB: 155, lean: -3, headTilt: 2, sq: 0.97, guard: 1 };
  POSE.block1 = { thighF: 9, shinF: 7, thighB: -23, shinB: -33, upperF: 63, foreF: 171, upperB: 47, foreB: 158, lean: -3, headTilt: 2, sq: 0.965, guard: 1 };

  POSE.hurt0 = { thighF: -12, shinF: -6, thighB: 15, shinB: 24, upperF: -66, foreF: -104, upperB: -88, foreB: -124, lean: -14, headTilt: 11, sq: 0.99 };
  POSE.hurt1 = { thighF: -5, shinF: -3, thighB: 8, shinB: 12, upperF: -40, foreF: -76, upperB: -60, foreB: -92, lean: -7, headTilt: 6, sq: 1 };

  POSE.crouch0 = { thighF: 58, shinF: -58, thighB: -40, shinB: -70, upperF: 42, foreF: 62, upperB: 38, foreB: 58, lean: 6, headTilt: -3, sq: 0.68 };

  POSE.cast0 = { thighF: 10, shinF: 6, thighB: -10, shinB: -6, upperF: 100, foreF: 122, upperB: -32, foreB: -52, lean: -2, headTilt: -5, sq: 1 };
  POSE.cast1 = { thighF: 14, shinF: 9, thighB: -12, shinB: -8, upperF: 132, foreF: 152, upperB: -36, foreB: -58, lean: -3, headTilt: -7, sq: 1.005 };
  POSE.cast2 = { thighF: 11, shinF: 7, thighB: -10, shinB: -6, upperF: 112, foreF: 134, upperB: -30, foreB: -48, lean: -2, headTilt: -4, sq: 1 };

  POSE.kickSkill0 = { thighF: 40, shinF: -44, thighB: -10, shinB: -6, upperF: 34, foreF: 56, upperB: -28, foreB: -46, lean: -6, headTilt: 4, sq: 1 };
  POSE.kickSkill1 = { thighF: 96, shinF: 100, thighB: -14, shinB: -9, upperF: -36, foreF: -66, upperB: 42, foreB: 78, lean: 8, headTilt: -6, sq: 1 };
  POSE.kickSkill2 = { thighF: 40, shinF: -30, thighB: -12, shinB: -8, upperF: 20, foreF: 40, upperB: -20, foreB: -30, lean: 2, headTilt: 0, sq: 1 };

  POSE.air0 = { thighF: 42, shinF: -30, thighB: -30, shinB: -62, upperF: 118, foreF: 148, upperB: -58, foreB: -88, lean: 5, headTilt: 4, sq: 1 };
  POSE.air1 = { thighF: 12, shinF: 2, thighB: -22, shinB: -42, upperF: 58, foreF: 88, upperB: -32, foreB: -52, lean: -4, headTilt: -3, sq: 1 };

  POSE.win0 = { thighF: 9, shinF: 5, thighB: -9, shinB: -5, upperF: 150, foreF: 172, upperB: 148, foreB: 170, lean: -4, headTilt: -8, sq: 1 };
  POSE.win1 = { thighF: 11, shinF: 6, thighB: -11, shinB: -6, upperF: 160, foreF: 178, upperB: 138, foreB: 164, lean: -2, headTilt: -8, sq: 1.01 };
  POSE.win2 = { thighF: 8, shinF: 4, thighB: -8, shinB: -4, upperF: 143, foreF: 166, upperB: 154, foreB: 176, lean: -6, headTilt: -8, sq: 0.995 };

  // ---------- 格挡（按住 S 键持续生效）----------
  POSE.guard0 = { thighF: 10, shinF: 5, thighB: -24, shinB: -34, upperF: 62, foreF: 170, upperB: 46, foreB: 156, lean: -2, headTilt: 2, sq: 0.96, guard: 1, bothFront: 1 };
  POSE.guard1 = { thighF: 11, shinF: 6, thighB: -25, shinB: -35, upperF: 66, foreF: 174, upperB: 50, foreB: 160, lean: -3, headTilt: 2, sq: 0.95, guard: 1, bothFront: 1 };
  POSE.guard2 = { thighF: 9, shinF: 5, thighB: -23, shinB: -33, upperF: 59, foreF: 167, upperB: 43, foreB: 153, lean: -2, headTilt: 3, sq: 0.965, guard: 1, bothFront: 1 };
  // 格挡住攻击的一瞬间：双臂被震回、身体后仰
  POSE.guardHit0 = { thighF: 4, shinF: -4, thighB: -34, shinB: -46, upperF: 74, foreF: 148, upperB: 60, foreB: 138, lean: -9, headTilt: 7, sq: 0.93, guard: 2, bothFront: 1 };
  POSE.guardHit1 = { thighF: 7, shinF: 1, thighB: -29, shinB: -40, upperF: 68, foreF: 160, upperB: 53, foreB: 148, lean: -5, headTilt: 4, sq: 0.95, guard: 1, bothFront: 1 };

  // ---------- 领域展开（双手向外拂开，如指挥落拍）----------
  POSE.field0 = { thighF: 12, shinF: 7, thighB: -14, shinB: -8, upperF: 96, foreF: 128, upperB: 88, foreB: 120, lean: -3, headTilt: -6, sq: 0.99, bothFront: 1 };
  POSE.field1 = { thighF: 16, shinF: 10, thighB: -18, shinB: -12, upperF: 58, foreF: 96, upperB: 52, foreB: 88, lean: 4, headTilt: 4, sq: 1.01, bothFront: 1 };
  POSE.field2 = { thighF: 14, shinF: 8, thighB: -16, shinB: -10, upperF: 74, foreF: 112, upperB: 68, foreB: 104, lean: 0, headTilt: -2, sq: 1, bothFront: 1 };

  // ---------- 召唤回声（一手前指，一手扬起）----------
  POSE.echo0 = { thighF: 10, shinF: 6, thighB: -12, shinB: -7, upperF: 40, foreF: 84, upperB: 120, foreB: 150, lean: -2, headTilt: -4, sq: 1 };
  POSE.echo1 = { thighF: 14, shinF: 9, thighB: -16, shinB: -10, upperF: 92, foreF: 104, upperB: 138, foreB: 168, lean: 3, headTilt: -8, sq: 1.01 };
  POSE.echo2 = { thighF: 12, shinF: 7, thighB: -14, shinB: -8, upperF: 66, foreF: 96, upperB: 128, foreB: 158, lean: 0, headTilt: -6, sq: 1 };

  // ---------- 乐章：挥棒指挥（新体系一）----------
  POSE.mov0 = { thighF: 10, shinF: 6, thighB: -12, shinB: -7, upperF: 130, foreF: 152, upperB: 62, foreB: 92, lean: -3, headTilt: -4, sq: 1 };
  POSE.mov1 = { thighF: 14, shinF: 9, thighB: -16, shinB: -10, upperF: 96, foreF: 62, upperB: 110, foreB: 142, lean: 4, headTilt: 3, sq: 0.99 };
  POSE.mov2 = { thighF: 8, shinF: 5, thighB: -10, shinB: -6, upperF: 150, foreF: 172, upperB: 40, foreB: 70, lean: -5, headTilt: -6, sq: 1.01 };

  // ---------- 回旋：先甩出去再把乐句拉回来（新体系二）----------
  POSE.ron0 = { thighF: 4, shinF: 1, thighB: -20, shinB: -26, upperF: 18, foreF: -22, upperB: -32, foreB: -52, lean: -7, headTilt: 5, sq: 0.98 };
  POSE.ron1 = { thighF: 18, shinF: 12, thighB: -14, shinB: -9, upperF: 92, foreF: 96, upperB: -20, foreB: -40, lean: 10, headTilt: -3, sq: 1 };
  POSE.ron2 = { thighF: 12, shinF: 7, thighB: -16, shinB: -10, upperF: 58, foreF: 26, upperB: 22, foreB: 52, lean: -3, headTilt: 2, sq: 0.99 };

  // ---------- 卡农：先倾听再指出声部进入（新体系三）----------
  POSE.can0 = { thighF: 8, shinF: 4, thighB: -12, shinB: -7, upperF: -58, foreF: -110, upperB: 42, foreB: 82, lean: -4, headTilt: 6, sq: 0.99 };
  POSE.can1 = { thighF: 12, shinF: 8, thighB: -14, shinB: -9, upperF: 44, foreF: 100, upperB: 70, foreB: 120, lean: 3, headTilt: -2, sq: 1 };
  POSE.can2 = { thighF: 10, shinF: 6, thighB: -12, shinB: -7, upperF: 102, foreF: 132, upperB: 30, foreB: 60, lean: -2, headTilt: -5, sq: 1.01 };

  // ---------- 动作序列 ----------
  var FRAMES = 6;   // 关键帧持续帧数：>=6 才有明显的低帧率动画感
  var ANIM = {
    idle: { loop: true, dur: FRAMES, keys: ['idle0', 'idle1', 'idle2', 'idle1'] },
    walk: { loop: true, dur: FRAMES, keys: ['walk0', 'walk1', 'walk2', 'walk3'] },
    punch: { loop: false, dur: 5, keys: ['punch0', 'punch1', 'punch1', 'punch2', 'idle0'] },
    kick: { loop: false, dur: 6, keys: ['kick0', 'kick1', 'kick1', 'kick2', 'idle0'] },
    // 格挡：呼吸般的持续戒备姿态
    block: { loop: true, dur: 7, keys: ['guard0', 'guard1', 'guard2', 'guard1'] },
    // 格挡受击：被震退再撑回来
    guardHit: { loop: false, dur: 5, keys: ['guardHit0', 'guardHit1', 'guard1'] },
    hurt: { loop: false, dur: 6, keys: ['hurt0', 'hurt1'] },
    crouch: { loop: true, dur: FRAMES, keys: ['crouch0'] },
    cast: { loop: false, dur: 7, keys: ['cast0', 'cast1', 'cast2'] },
    field: { loop: false, dur: 8, keys: ['field0', 'field1', 'field1', 'field2', 'idle0'] },
    echo: { loop: false, dur: 7, keys: ['echo0', 'echo1', 'echo1', 'echo2', 'idle0'] },
    // 新体系：乐章（挥棒指挥）/ 回旋（甩出再拉回）/ 卡农（倾听后指出声部）
    movement: { loop: false, dur: 8, keys: ['mov0', 'mov1', 'mov0', 'mov2', 'idle0'] },
    rondo: { loop: false, dur: 7, keys: ['ron0', 'ron1', 'ron1', 'ron2', 'idle0'] },
    canon: { loop: false, dur: 8, keys: ['can0', 'can1', 'can1', 'can2', 'idle0'] },
    kickSkill: { loop: false, dur: 6, keys: ['kickSkill0', 'kickSkill1', 'kickSkill2'] },
    jump: { loop: false, dur: FRAMES, keys: ['air0', 'air1'] },
    win: { loop: true, dur: 8, keys: ['win0', 'win1', 'win2', 'win1'] },
    ko: { loop: true, dur: 99, keys: ['hurt0'] }
  };

  function frameName(state, ticks) {
    var a = ANIM[state] || ANIM.idle;
    var idx = Math.floor(ticks / a.dur);
    if (a.loop) idx = idx % a.keys.length;
    else if (idx > a.keys.length - 1) idx = a.keys.length - 1;
    return a.keys[idx];
  }

  // ---------- 骨架绘制 ----------
  var OUT = '#170f21';   // 统一描边色，红白机式的黑边

  function stroke2(ctx, x1, y1, x2, y2, w, col) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = w + 3.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function drawLeg(ctx, x, y, thighA, thighL, shinA, shinL, col) {
    var k = seg(x, y, thighA, thighL);
    var f = seg(k.x, k.y, shinA, shinL);
    stroke2(ctx, x, y, k.x, k.y, 13, col);
    stroke2(ctx, k.x, k.y, f.x, f.y, 10, col);
    // 皮鞋
    ctx.fillStyle = OUT;
    rr(ctx, f.x - 10, f.y - 7, 20, 12, 4);
    ctx.fillStyle = '#1f1d26';
    rr(ctx, f.x - 8, f.y - 5, 16, 9, 3);
  }

  function drawArm(ctx, x, y, upperA, foreA, sleeveCol, skinCol, sp, p, isFront) {
    var e = seg(x, y, upperA, 17);
    var h = seg(e.x, e.y, foreA, 16);
    stroke2(ctx, x, y, e.x, e.y, 12, sleeveCol);
    stroke2(ctx, e.x, e.y, h.x, h.y, 10, sleeveCol);
    // 手
    ctx.fillStyle = OUT;
    rr(ctx, h.x - 8, h.y - 8, 16, 16, 6);
    ctx.fillStyle = skinCol;
    rr(ctx, h.x - 6, h.y - 6, 12, 12, 5);
    if (isFront && (sp.hair === 'glasses' || sp.glasses)) {
      ctx.fillStyle = sp.accent;
      rr(ctx, h.x - 7, h.y - 2, 6, 4, 2);
    }
    // 指挥棒：手臂抬起时才出现
    if (isFront && sp.item === 'baton' && p.foreF > 25) {
      var tip = seg(h.x, h.y, foreA, 24);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      ctx.strokeStyle = '#f8f4e6';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    }
    return h;
  }

  function drawTorso(ctx, hipY, shY, p, sp) {
    var h = hipY - shY;
    var lean = (p.lean || 0) * 0.9;
    // 修女服 / 长袍：整片长袍，没有燕尾、没有领结
    // v5.0：宾根（修女）、佩罗坦与塔利斯（修士）共用这套长袍
    if (sp.coatStyle === 'habit') {
      ctx.fillStyle = OUT;
      rr(ctx, -18 + lean * 0.4, shY - 2, 36, h + 34, 9);
      ctx.fillStyle = sp.coat[0];
      rr(ctx, -16 + lean * 0.4, shY, 32, h + 32, 8);
      ctx.fillStyle = sp.coat[1];
      rr(ctx, -16 + lean * 0.4, shY + 1, 8, h + 30, 7);
      ctx.fillStyle = sp.coat[2];
      rr(ctx, 7 + lean * 0.4, shY + 3, 5, h + 24, 3);
      // 头巾垂下的白色前襟
      ctx.fillStyle = sp.shirt[0];
      rr(ctx, -5, shY - 1, 12, 16, 3);
      ctx.fillStyle = sp.shirt[1];
      rr(ctx, -4, shY, 4, 14, 2);
      // 十字架吊坠（v5.0：只有 cross 为真的修士才挂，佩罗坦用）
      if (sp.cross) {
        ctx.fillStyle = sp.accent;
        rr(ctx, 1, shY + 16, 3, 12, 1);
        rr(ctx, -3, shY + 20, 11, 3, 1);
      }
      return;
    }
    // 燕尾 / 礼服下摆（先画，让前腿压在上面）
    ctx.fillStyle = OUT;
    if (sp.coatStyle === 'frock') {
      rr(ctx, -17 + lean * 0.5, hipY - 12, 19, 29, 5);
      rr(ctx, -1 + lean * 0.5, hipY - 12, 18, 26, 5);
    } else if (sp.coatStyle === 'tailed') {
      rr(ctx, -16 + lean * 0.5, hipY - 11, 18, 24, 4);
      rr(ctx, -1 + lean * 0.5, hipY - 11, 17, 22, 4);
    } else {
      rr(ctx, -17 + lean * 0.5, hipY - 11, 34, 20, 5);
    }
    ctx.fillStyle = sp.coat[1];
    if (sp.coatStyle === 'frock') {
      rr(ctx, -15 + lean * 0.5, hipY - 10, 16, 26, 4);
      rr(ctx, 0 + lean * 0.5, hipY - 10, 15, 23, 4);
    } else if (sp.coatStyle === 'tailed') {
      rr(ctx, -14 + lean * 0.5, hipY - 9, 15, 21, 3);
      rr(ctx, 0 + lean * 0.5, hipY - 9, 14, 19, 3);
    } else {
      rr(ctx, -15 + lean * 0.5, hipY - 9, 30, 17, 4);
    }
    // 躯干（描边 + 本体）
    ctx.fillStyle = OUT;
    rr(ctx, -17, shY - 2, 34, h + 12, 9);
    ctx.fillStyle = sp.coat[0];
    rr(ctx, -15, shY, 30, h + 8, 7);
    // 背光面
    ctx.fillStyle = sp.coat[1];
    rr(ctx, -15, shY + 1, 8, h + 7, 6);
    // 高光
    ctx.fillStyle = sp.coat[2];
    rr(ctx, 6, shY + 3, 6, h - 4, 3);
    // 白衬衫前襟
    ctx.fillStyle = sp.shirt[0];
    ctx.beginPath();
    ctx.moveTo(1, shY + 3);
    ctx.lineTo(13, shY + 3);
    ctx.lineTo(12, shY + h * 0.62);
    ctx.lineTo(4, shY + h * 0.7);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = sp.shirt[1];
    ctx.beginPath();
    ctx.moveTo(2, shY + 3);
    ctx.lineTo(6, shY + 3);
    ctx.lineTo(5, shY + h * 0.68);
    ctx.lineTo(2, shY + h * 0.64);
    ctx.closePath(); ctx.fill();
    // 翻领
    ctx.fillStyle = sp.coat[2];
    ctx.beginPath();
    ctx.moveTo(-2, shY + 1); ctx.lineTo(4, shY + 1); ctx.lineTo(1, shY + 15);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, shY + 1); ctx.lineTo(8, shY + 1); ctx.lineTo(11, shY + 15);
    ctx.closePath(); ctx.fill();
    // 领结 / 领巾
    ctx.fillStyle = sp.accent;
    rr(ctx, 3, shY + 2, 9, 5, 2);
    // 纽扣
    ctx.fillStyle = sp.coat[1];
    for (var i = 0; i < 3; i++) ctx.fillRect(9, shY + 18 + i * 10, 3, 3);
  }


  // ---------- 发型库（数据驱动：back 画在脸后，front 画在脸上）----------
  // 每项为 [dx, dy, w, h, r, dark?]，坐标以“下巴中心”为原点
  var HAIR_STYLES = {
    short: {
      back: [[-16, -30, 32, 18, 7]],
      front: [[-14, -29, 28, 6, 3], [6, -25, 8, 4, 2]]
    },
    crop: {   // 极短寸头
      back: [[-15, -29, 30, 13, 6]],
      front: [[-12, -28, 24, 5, 2]]
    },
    bowl: {   // 锅盖头
      back: [[-17, -33, 34, 23, 9]],
      front: [[-16, -31, 32, 11, 4]]
    },
    mop: {    // 拖把头
      back: [[-18, -32, 36, 24, 9], [-19, -14, 10, 22, 4], [11, -14, 10, 22, 4]],
      front: [[-16, -31, 32, 10, 4], [2, -26, 12, 6, 3]]
    },
    curly: {  // 卷发
      back: [[-19, -33, 38, 24, 12], [-20, -20, 12, 20, 6], [10, -20, 12, 20, 6]],
      front: [[-17, -31, 34, 8, 4]]
    },
    wavy: {
      back: [[-17, -32, 34, 22, 9], [-20, -18, 11, 22, 5], [10, -18, 11, 22, 5]],
      front: [[-14, -29, 28, 6, 3], [6, -25, 8, 4, 2]]
    },
    long: {
      back: [[-18, -33, 36, 25, 9], [-21, -14, 12, 34, 5], [10, -14, 12, 30, 5]],
      front: [[-14, -29, 28, 6, 3], [6, -25, 8, 4, 2]]
    },
    feather: { // 羽毛式长发
      back: [[-18, -33, 36, 26, 9], [-21, -16, 12, 30, 5], [11, -16, 12, 28, 5]],
      front: [[-16, -30, 32, 8, 4], [-14, -24, 8, 7, 3]]
    },
    mane: {   // 狮鬃
      back: [[-19, -34, 38, 26, 10], [-22, -20, 14, 26, 6], [9, -18, 13, 20, 6]],
      front: [[-15, -30, 30, 7, 3], [-13, -24, 9, 5, 2]]
    },
    wild: {   // 蓬乱
      back: [[-18, -33, 36, 22, 8], [-20, -40, 12, 16, 5], [6, -41, 12, 16, 5], [-9, -44, 14, 14, 5]],
      front: [[-15, -30, 30, 7, 3], [-13, -24, 9, 5, 2]]
    },
    bald: {   // 全秃 + 鬓角
      back: [[-15, -20, 8, 14, 4], [8, -20, 8, 13, 4]],
      front: [[-13, -27, 26, 3, 1]]
    },
    receding: { // 地中海
      back: [[-16, -24, 10, 16, 5], [8, -24, 10, 15, 5], [-16, -27, 32, 6, 2]],
      front: [[-14, -27, 6, 4, 2], [10, -27, 6, 4, 2]]
    },
    queue: {  // 18 世纪辫子
      back: [[-16, -31, 32, 19, 7], [-20, -19, 10, 17, 5], [10, -19, 10, 17, 5], [-22, -8, 9, 18, 4]],
      front: [[-14, -29, 28, 6, 3], [6, -25, 8, 4, 2]]
    },
    wig: {    // 法官式假发
      back: [[-18, -32, 36, 24, 9], [-21, -16, 11, 22, 5], [11, -16, 11, 22, 5]],
      front: [[-16, -30, 32, 7, 3]]
    },
    beret: {  // 贝雷帽
      back: [[-19, -32, 38, 13, 5], [-8, -39, 22, 12, 4]],
      front: [[-17, -31, 34, 5, 2]]
    },
    ponytail: { // 马尾
      back: [[-17, -31, 34, 18, 7], [6, -26, 10, 14, 5], [18, -22, 9, 24, 4]],
      front: [[-15, -30, 30, 7, 3], [6, -25, 8, 5, 2]]
    },
    bun: {    // 发髻
      back: [[-17, -31, 34, 18, 7], [-7, -40, 15, 13, 6]],
      front: [[-15, -30, 30, 6, 3]]
    },
    braids: { // 双辫
      back: [[-18, -32, 36, 20, 8], [-22, -16, 10, 28, 5], [12, -16, 10, 28, 5]],
      front: [[-16, -30, 32, 7, 3], [-13, -24, 8, 6, 3]]
    },
    topknot: { // 发髻高束
      back: [[-15, -29, 30, 16, 6], [-5, -41, 11, 13, 5]],
      front: [[-13, -28, 26, 5, 2]]
    },
    veil: {   // 修女头巾（宾根）
      back: [[-23, -37, 46, 36, 11], [-25, -12, 13, 34, 6], [12, -12, 13, 34, 6]],
      front: [[-21, -35, 42, 11, 5], [-21, -26, 9, 12, 4], [12, -26, 9, 12, 4]]
    }
  };

  function drawHairLayer(ctx, hx, hy, sp, layer) {
    var st = HAIR_STYLES[sp.hair] || HAIR_STYLES.short;
    var list = st[layer] || [];
    for (var i = 0; i < list.length; i++) {
      var r0 = list[i];
      ctx.fillStyle = r0[5] ? sp.hairDark : sp.hairColor;
      rr(ctx, hx + r0[0], hy + r0[1], r0[2], r0[3], r0[4]);
    }
  }
  function drawHairBack(ctx, hx, hy, sp) { drawHairLayer(ctx, hx, hy, sp, 'back'); }

  // ---------- 脸型 ----------
  var FACE_SHAPES = {
    round: { w: 25, h: 26, r: 9, top: -26, cw: 7 },
    square: { w: 26, h: 27, r: 4, top: -27, cw: 7 },
    long: { w: 23, h: 30, r: 7, top: -30, cw: 6 },
    gaunt: { w: 23, h: 28, r: 6, top: -28, cw: 6 },
    wide: { w: 29, h: 25, r: 8, top: -25, cw: 8 }
  };

  function drawEyes(ctx, hx, hy, sp, f) {
    var col = '#241d2a', white = '#f4f0e2';
    var y0 = hy - 21;
    switch (f.eyes) {
      case 'sharp':   // 细长锐利
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(hx + 2, y0); ctx.lineTo(hx + 8, y0 + 2);
        ctx.lineTo(hx + 8, y0 + 6); ctx.lineTo(hx + 2, y0 + 4);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + 10, y0 + 2); ctx.lineTo(hx + 16, y0);
        ctx.lineTo(hx + 16, y0 + 4); ctx.lineTo(hx + 10, y0 + 6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = white;
        ctx.fillRect(hx + 4, y0 + 1, 2, 2);
        ctx.fillRect(hx + 12, y0 + 1, 2, 2);
        break;
      case 'round':   // 圆眼（宾根等）
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(hx + 5, y0 + 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + 13, y0 + 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = white;
        ctx.fillRect(hx + 4, y0 + 1, 2, 2);
        ctx.fillRect(hx + 12, y0 + 1, 2, 2);
        break;
      case 'sleepy':  // 半闭的倦眼
        ctx.fillStyle = col;
        rr(ctx, hx + 2, y0 + 3, 6, 3, 1);
        rr(ctx, hx + 10, y0 + 3, 6, 3, 1);
        ctx.fillStyle = sp.hairDark;
        rr(ctx, hx + 1, y0, 8, 2, 1);
        rr(ctx, hx + 9, y0, 8, 2, 1);
        break;
      case 'deep':    // 深眼窝
        ctx.fillStyle = sp.skin[1];
        rr(ctx, hx + 1, y0 - 2, 8, 9, 2);
        rr(ctx, hx + 9, y0 - 2, 8, 9, 2);
        ctx.fillStyle = col;
        rr(ctx, hx + 3, y0 + 1, 4, 6, 1);
        rr(ctx, hx + 11, y0 + 1, 4, 6, 1);
        ctx.fillStyle = white;
        ctx.fillRect(hx + 3, y0 + 1, 2, 2);
        ctx.fillRect(hx + 11, y0 + 1, 2, 2);
        break;
      case 'wide':    // 大眼
        ctx.fillStyle = white;
        rr(ctx, hx + 1, y0 - 1, 8, 9, 3);
        rr(ctx, hx + 9, y0 - 1, 8, 9, 3);
        ctx.fillStyle = col;
        rr(ctx, hx + 3, y0 + 1, 4, 6, 2);
        rr(ctx, hx + 11, y0 + 1, 4, 6, 2);
        ctx.fillStyle = white;
        ctx.fillRect(hx + 3, y0 + 1, 2, 2);
        ctx.fillRect(hx + 11, y0 + 1, 2, 2);
        break;
      default:        // plain：标准眼
        ctx.fillStyle = col;
        rr(ctx, hx + 2, y0, 5, 7, 1);
        rr(ctx, hx + 10, y0, 5, 7, 1);
        ctx.fillStyle = white;
        ctx.fillRect(hx + 3, y0, 2, 3);
        ctx.fillRect(hx + 11, y0, 2, 3);
    }
  }

  function drawBrows(ctx, hx, hy, sp, f) {
    var y0 = hy - 27, c = sp.hairDark;
    ctx.fillStyle = c;
    switch (f.brows) {
      case 'thick':
        rr(ctx, hx + 1, y0, 8, 3, 1);
        rr(ctx, hx + 9, y0, 9, 3, 1);
        break;
      case 'bushy':
        rr(ctx, hx + 0, y0 - 1, 9, 5, 2);
        rr(ctx, hx + 9, y0 - 1, 10, 5, 2);
        break;
      case 'angry':   // 向内下压
        ctx.beginPath();
        ctx.moveTo(hx + 1, y0); ctx.lineTo(hx + 9, y0 + 3);
        ctx.lineTo(hx + 9, y0 + 5); ctx.lineTo(hx + 1, y0 + 2);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + 9, y0 + 3); ctx.lineTo(hx + 18, y0);
        ctx.lineTo(hx + 18, y0 + 2); ctx.lineTo(hx + 9, y0 + 5);
        ctx.closePath(); ctx.fill();
        break;
      case 'arch':    // 拱形细眉
        rr(ctx, hx + 2, y0 + 2, 7, 2, 1);
        rr(ctx, hx + 10, y0 + 2, 8, 2, 1);
        rr(ctx, hx + 4, y0, 4, 2, 1);
        rr(ctx, hx + 12, y0, 4, 2, 1);
        break;
      default:        // thin
        rr(ctx, hx + 2, y0 + 1, 6, 2, 1);
        rr(ctx, hx + 10, y0 + 1, 7, 2, 1);
    }
  }

  function drawNose(ctx, hx, hy, sp, f) {
    ctx.fillStyle = sp.skin[1];
    switch (f.nose) {
      case 'big':
        rr(ctx, hx + 13, hy - 18, 7, 9, 3);
        ctx.fillStyle = sp.skin[0];
        rr(ctx, hx + 14, hy - 17, 4, 5, 2);
        break;
      case 'hook':
        rr(ctx, hx + 13, hy - 20, 4, 6, 2);
        rr(ctx, hx + 12, hy - 15, 8, 6, 3);
        break;
      case 'flat':
        rr(ctx, hx + 12, hy - 15, 7, 4, 2);
        break;
      default:        // small
        rr(ctx, hx + 14, hy - 17, 4, 6, 2);
    }
  }

  function drawMouth(ctx, hx, hy, sp, f) {
    ctx.fillStyle = '#7b4a45';
    switch (f.mouth) {
      case 'smile':
        rr(ctx, hx + 4, hy - 6, 11, 2, 1);
        rr(ctx, hx + 3, hy - 8, 3, 2, 1);
        rr(ctx, hx + 13, hy - 8, 3, 2, 1);
        break;
      case 'frown':
        rr(ctx, hx + 4, hy - 8, 11, 2, 1);
        rr(ctx, hx + 2, hy - 6, 3, 2, 1);
        rr(ctx, hx + 14, hy - 6, 3, 2, 1);
        break;
      case 'tight':
        rr(ctx, hx + 6, hy - 7, 8, 1, 1);
        break;
      case 'open':
        ctx.fillStyle = '#3a1f1c';
        rr(ctx, hx + 5, hy - 8, 10, 6, 2);
        ctx.fillStyle = '#a05a52';
        rr(ctx, hx + 7, hy - 5, 6, 3, 1);
        break;
      default:        // line
        rr(ctx, hx + 5, hy - 6, 10, 2, 1);
    }
  }

  function drawHead(ctx, shY, p, sp) {
    var hx = (p.lean || 0) * 0.55 + (p.headTilt || 0) * 0.7;
    var hy = shY - 9 * (p.sq == null ? 1 : p.sq);
    var f = sp.face || {};
    var shape = FACE_SHAPES[f.shape] || FACE_SHAPES.round;
    var fw = shape.w, fh = shape.h, fr = shape.r, ftop = shape.top, cw = shape.cw;
    var fx = hx - Math.round(fw / 2);
    // 脖子
    ctx.fillStyle = OUT;
    rr(ctx, hx - 8, shY - 10, 17, 15, 3);
    ctx.fillStyle = sp.skin[1];
    rr(ctx, hx - 6, shY - 8, 13, 12, 2);
    // 后脑头发
    drawHairBack(ctx, hx, hy, sp);
    // 脸（含描边）
    ctx.fillStyle = OUT;
    rr(ctx, fx - 2, hy + ftop - 2, fw + 4, fh + 4, fr + 2);
    ctx.fillStyle = sp.skin[0];
    rr(ctx, fx, hy + ftop, fw, fh, fr);
    ctx.fillStyle = sp.skin[1];
    rr(ctx, fx, hy + ftop, cw, fh, Math.max(2, fr - 2));
    ctx.fillStyle = sp.skin[0];
    rr(ctx, hx + 2, hy - 20, 10, 18, 5);
    // 腮部阴影 / 颧骨
    if (f.cheeks === 'gaunt') {
      ctx.fillStyle = sp.skin[1];
      rr(ctx, hx + 1, hy - 12, 4, 9, 2);
      rr(ctx, hx + 12, hy - 12, 3, 8, 1);
    } else if (f.cheeks === 'full') {
      ctx.fillStyle = 'rgba(255,220,200,0.32)';
      rr(ctx, hx + 3, hy - 9, 7, 5, 2);
      rr(ctx, hx + 12, hy - 9, 5, 5, 2);
    }
    // 眉骨阴影
    ctx.fillStyle = sp.skin[1];
    rr(ctx, hx - 4, hy - 13, 16, 3, 1);
    drawEyes(ctx, hx, hy, sp, f);
    drawBrows(ctx, hx, hy, sp, f);
    drawNose(ctx, hx, hy, sp, f);
    drawMouth(ctx, hx, hy, sp, f);
    // 络腮胡
    if (sp.beard) {
      ctx.fillStyle = sp.hairColor;
      rr(ctx, hx - 12, hy - 9, 27, 13, 6);
      rr(ctx, hx - 4, hy + 1, 20, 11, 5);
      ctx.fillStyle = sp.hairDark;
      rr(ctx, hx - 8, hy - 9, 20, 4, 2);
      ctx.fillStyle = '#6b3f3a';
      rr(ctx, hx + 6, hy - 4, 9, 2, 1);
    }
    // 小胡子
    if (sp.mustache && !sp.beard) {
      ctx.fillStyle = sp.hairDark;
      rr(ctx, hx + 2, hy - 9, 16, 4, 2);
    }
    // 眼镜 / 单眼镜 / 烟斗
    if (sp.hair === 'glasses' || sp.glasses) {
      ctx.strokeStyle = '#e2dcc8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(hx + 4, hy - 17, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx + 13, hy - 17, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + 10, hy - 17); ctx.lineTo(hx + 7, hy - 17);
      ctx.stroke();
    } else if (sp.monocle) {
      ctx.strokeStyle = '#e8d9a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx + 12, hy - 17, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + 15, hy - 11); ctx.lineTo(hx + 17, hy - 3);
      ctx.stroke();
    }
    if (sp.pipe) {
      ctx.fillStyle = '#6b4a32';
      rr(ctx, hx + 8, hy - 6, 12, 3, 1);
      ctx.fillStyle = '#3a2a1c';
      rr(ctx, hx + 18, hy - 9, 6, 7, 2);
      ctx.fillStyle = 'rgba(220,220,230,0.55)';
      rr(ctx, hx + 20, hy - 16, 5, 6, 2);
    }
    if (sp.earring) {
      ctx.fillStyle = '#e0c060';
      rr(ctx, hx - 3, hy - 6, 4, 6, 2);
    }
    // 前发（盖住额头）
    drawHairLayer(ctx, hx, hy, sp, 'front');
  }

  // ---------- 组合 ----------
  function drawPose(ctx, p, sp) {
    var sq = p.sq == null ? 1 : p.sq;
    var vs = (sp.height || 1) * sq;
    var hipY = -42 * vs;
    var shY = -78 * vs;
    var lean = p.lean || 0;

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(lean * 0.55, 0);
    ctx.rotate(lean * Math.PI / 420);

    // 后腿（暗）
    drawLeg(ctx, -5, hipY, p.thighB, 24 * vs, p.shinB, 22 * vs, sp.pants[1]);
    // 后臂：格挡等姿势要求双臂都在身前时，推迟到躯干之后绘制
    if (!p.bothFront) drawArm(ctx, -10, shY + 4, p.upperB, p.foreB, sp.coat[1], sp.skin[1], sp, p, false);
    // 前腿
    drawLeg(ctx, 5, hipY, p.thighF, 24 * vs, p.shinF, 22 * vs, sp.pants[0]);
    // 躯干
    drawTorso(ctx, hipY, shY, p, sp);
    // 后臂（身前，颜色偏暗以制造层次）
    if (p.bothFront) drawArm(ctx, 5, shY + 6, p.upperB, p.foreB, sp.coat[1], sp.skin[1], sp, p, false);
    // 前臂（亮，位于最前）
    drawArm(ctx, 10, shY + 4, p.upperF, p.foreF, sp.coat[0], sp.skin[0], sp, p, true);
    // 头
    drawHead(ctx, shY, p, sp);
    // 格挡光罩
    if (p.guard) {
      var lv = p.guard;
      ctx.lineWidth = lv >= 2 ? 9 : 5;
      ctx.strokeStyle = lv >= 2 ? 'rgba(255,255,255,0.92)' : 'rgba(150,210,255,0.5)';
      ctx.beginPath();
      ctx.arc(8, shY + 16, lv >= 2 ? 46 : 36, -Math.PI * 0.62, Math.PI * 0.62);
      ctx.stroke();
      if (lv >= 2) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(150,220,255,0.9)';
        ctx.beginPath();
        ctx.arc(8, shY + 16, 58, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /**
   * 绘制角色
   * @param ctx  2d 上下文
   * @param opts { composer, state, tick, facing:'left'|'right', scale, alpha, silhouette }
   * @param x,y  脚底位置
   */
  function draw(ctx, opts, x, y) {
    var sp = opts.composer.sprite;
    var pname = frameName(opts.state || 'idle', opts.tick || 0);
    var p = POSE[pname] || POSE.idle0;
    var scale = opts.scale || 1;
    ctx.save();
    ctx.translate(x, y);
    if (scale !== 1) ctx.scale(scale, scale);
    if (opts.facing === 'left') ctx.scale(-1, 1);   // 素材朝向 +X，朝左时镜像
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (opts.silhouette) {
      var white = makeWhitePalette(sp);
      if (opts.alpha != null) ctx.globalAlpha = Math.min(1, opts.alpha * 0.92);
      drawPose(ctx, p, white);
      ctx.restore();
      return;
    }
    drawPose(ctx, p, sp);
    ctx.restore();
  }

  // 纯白调色板（保留发型与礼服剪影，仅换色）——受击闪白用
  var whiteCache = {};
  function makeWhitePalette(sp) {
    var k = sp.coat[0] + '|' + sp.hair + '|' + sp.coatStyle;
    if (!whiteCache[k]) {
      whiteCache[k] = {
        coat: ['#ffffff', '#eef4ff', '#ffffff'],
        shirt: ['#ffffff', '#eef4ff'],
        pants: ['#ffffff', '#eef4ff'],
        skin: ['#ffffff', '#eef4ff'],
        hair: sp.hair,
        hairColor: '#ffffff',
        hairDark: '#eef4ff',
        accent: '#ffffff',
        coatStyle: sp.coatStyle,
        height: sp.height,
        beard: sp.beard,
        mustache: sp.mustache,
        glasses: sp.glasses,
        monocle: sp.monocle,
        pipe: sp.pipe,
        earring: sp.earring,
        face: sp.face,
        item: null
      };
    }
    return whiteCache[k];
  }

  global.Sprites = {
    draw: draw,
    ANIM: ANIM,
    POSE: POSE,
    frameName: frameName
  };
})(window);

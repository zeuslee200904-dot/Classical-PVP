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
    if (isFront) drawItem(ctx, h, foreA, sp, p);
    return h;
  }

  // ---------- 手持物库（v5.1：从"人人一根指挥棒"扩到 15 种）----------
  // 以手部 h 为原点；baton 仍保留"抬臂才出现"的原始手感，其余手持物常驻
  var WOOD = ['#8a5a30', '#5c3a1c'];
  var BRASS = ['#e0c060', '#9a7a2a'];
  function drawItem(ctx, h, foreA, sp, p) {
    var it = sp.item;
    if (!it) return;
    var tip, i;
    ctx.lineCap = 'round';
    switch (it) {
      case 'baton':            // 指挥棒：手臂抬起时才出现
        if (!(p.foreF > 25)) break;
        tip = seg(h.x, h.y, foreA, 24);
        ctx.strokeStyle = OUT; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.strokeStyle = '#f8f4e6'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        break;
      case 'violin':           // 小提琴 + 琴弓
        ctx.fillStyle = OUT; rr(ctx, h.x - 7, h.y - 16, 15, 20, 5);
        ctx.fillStyle = '#8f4a24'; rr(ctx, h.x - 5, h.y - 14, 11, 16, 4);
        ctx.fillStyle = '#5e2c12'; rr(ctx, h.x - 5, h.y - 6, 11, 3, 1);
        ctx.fillStyle = OUT; rr(ctx, h.x + 4, h.y - 26, 4, 12, 1);
        ctx.fillStyle = '#e8dcc0'; rr(ctx, h.x + 5, h.y - 26, 2, 9, 1);
        ctx.strokeStyle = OUT; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(h.x - 14, h.y + 8); ctx.lineTo(h.x + 16, h.y - 20); ctx.stroke();
        ctx.strokeStyle = '#f4f0e2'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(h.x - 14, h.y + 8); ctx.lineTo(h.x + 16, h.y - 20); ctx.stroke();
        break;
      case 'flute':            // 长笛：一根带按键的银管
        tip = seg(h.x, h.y, foreA + 90, 30);
        ctx.strokeStyle = OUT; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(h.x - 30, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.strokeStyle = '#c8d4e0'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(h.x - 30, h.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.fillStyle = '#7a8896';
        for (i = -2; i <= 3; i++) ctx.fillRect(h.x + i * 7, h.y - 4, 2, 3);
        break;
      case 'trumpet':          // 小号：管身 + 喇叭口 + 活塞
        ctx.strokeStyle = OUT; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(h.x - 4, h.y - 2); ctx.lineTo(h.x + 22, h.y - 2); ctx.stroke();
        ctx.fillStyle = BRASS[0];
        rr(ctx, h.x - 4, h.y - 5, 22, 7, 2);
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.moveTo(h.x + 20, h.y - 10); ctx.lineTo(h.x + 34, h.y - 15);
        ctx.lineTo(h.x + 34, h.y + 11); ctx.lineTo(h.x + 20, h.y + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = BRASS[1];
        ctx.beginPath(); ctx.moveTo(h.x + 21, h.y - 8); ctx.lineTo(h.x + 32, h.y - 13);
        ctx.lineTo(h.x + 32, h.y + 9); ctx.lineTo(h.x + 21, h.y + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = BRASS[0];
        rr(ctx, h.x + 4, h.y - 11, 4, 7, 1); rr(ctx, h.x + 10, h.y - 11, 4, 7, 1);
        break;
      case 'lute':             // 鲁特琴：梨形琴身 + 弯颈
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.ellipse(h.x, h.y - 4, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = WOOD[0];
        ctx.beginPath(); ctx.ellipse(h.x, h.y - 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a1a0c';
        ctx.beginPath(); ctx.arc(h.x, h.y - 4, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = OUT; rr(ctx, h.x - 3, h.y - 30, 6, 16, 2);
        ctx.fillStyle = WOOD[1]; rr(ctx, h.x - 2, h.y - 29, 4, 14, 1);
        ctx.fillStyle = '#e8dcc0'; rr(ctx, h.x - 5, h.y - 34, 10, 5, 2);
        break;
      case 'lyre':             // 里拉琴：U 形框 + 琴弦
        ctx.strokeStyle = OUT; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(h.x - 11, h.y + 6); ctx.lineTo(h.x - 13, h.y - 22);
        ctx.moveTo(h.x + 11, h.y + 6); ctx.lineTo(h.x + 13, h.y - 22);
        ctx.moveTo(h.x - 12, h.y - 20); ctx.lineTo(h.x + 12, h.y - 20); ctx.stroke();
        ctx.strokeStyle = BRASS[0]; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(h.x - 11, h.y + 6); ctx.lineTo(h.x - 13, h.y - 22);
        ctx.moveTo(h.x + 11, h.y + 6); ctx.lineTo(h.x + 13, h.y - 22);
        ctx.moveTo(h.x - 12, h.y - 20); ctx.lineTo(h.x + 12, h.y - 20); ctx.stroke();
        ctx.strokeStyle = '#f4f0e2'; ctx.lineWidth = 1;
        for (i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(h.x + i * 6, h.y - 19); ctx.lineTo(h.x + i * 9, h.y + 4); ctx.stroke();
        }
        ctx.fillStyle = WOOD[1]; rr(ctx, h.x - 10, h.y + 2, 20, 8, 3);
        break;
      case 'quill':            // 羽毛笔
        ctx.strokeStyle = OUT; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(h.x - 4, h.y + 6); ctx.lineTo(h.x + 12, h.y - 22); ctx.stroke();
        ctx.fillStyle = '#f4f0e2';
        ctx.beginPath(); ctx.moveTo(h.x + 8, h.y - 26); ctx.lineTo(h.x + 17, h.y - 8);
        ctx.lineTo(h.x + 6, h.y - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.accent;
        ctx.beginPath(); ctx.moveTo(h.x + 9, h.y - 22); ctx.lineTo(h.x + 14, h.y - 11);
        ctx.lineTo(h.x + 8, h.y - 9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2a2a34'; rr(ctx, h.x - 6, h.y + 3, 6, 6, 1);
        break;
      case 'scroll':           // 乐谱卷轴
        ctx.fillStyle = OUT; rr(ctx, h.x - 14, h.y - 12, 30, 22, 4);
        ctx.fillStyle = '#efe6cc'; rr(ctx, h.x - 12, h.y - 10, 26, 18, 3);
        ctx.fillStyle = WOOD[1];
        rr(ctx, h.x - 17, h.y - 14, 6, 26, 3); rr(ctx, h.x + 13, h.y - 14, 6, 26, 3);
        ctx.fillStyle = '#8a7a5a';
        for (i = 0; i < 3; i++) ctx.fillRect(h.x - 8, h.y - 6 + i * 5, 18, 2);
        break;
      case 'fan':              // 折扇
        for (i = -2; i <= 2; i++) {
          ctx.save();
          ctx.translate(h.x - 2, h.y + 6);
          ctx.rotate(i * 0.22 - 0.5);
          ctx.fillStyle = i % 2 ? sp.accent : '#f0e6d0';
          rr(ctx, 0, -26, 11, 28, 2);
          ctx.fillStyle = WOOD[1]; rr(ctx, 0, -2, 11, 4, 1);
          ctx.restore();
        }
        ctx.fillStyle = WOOD[1]; rr(ctx, h.x - 5, h.y + 3, 9, 6, 2);
        break;
      case 'watch':            // 怀表 + 表链
        ctx.strokeStyle = BRASS[1]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(h.x + 2, h.y - 4); ctx.lineTo(h.x + 12, h.y - 16); ctx.stroke();
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.arc(h.x, h.y + 4, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = BRASS[0];
        ctx.beginPath(); ctx.arc(h.x, h.y + 4, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8f4e6';
        ctx.beginPath(); ctx.arc(h.x, h.y + 4, 4.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(h.x, h.y + 4); ctx.lineTo(h.x, h.y);
        ctx.moveTo(h.x, h.y + 4); ctx.lineTo(h.x + 3, h.y + 5); ctx.stroke();
        break;
      case 'book':             // 乐理书 / 总谱
        ctx.fillStyle = OUT; rr(ctx, h.x - 15, h.y - 11, 28, 22, 3);
        ctx.fillStyle = sp.accent; rr(ctx, h.x - 13, h.y - 9, 24, 18, 2);
        ctx.fillStyle = '#f4f0e2'; rr(ctx, h.x - 9, h.y - 8, 19, 16, 2);
        ctx.fillStyle = '#b9b3a0';
        for (i = 0; i < 4; i++) ctx.fillRect(h.x - 6, h.y - 5 + i * 4, 14, 1);
        break;
      case 'wineglass':        // 酒杯
        ctx.fillStyle = 'rgba(200,220,240,0.75)';
        ctx.beginPath(); ctx.moveTo(h.x - 9, h.y - 22); ctx.lineTo(h.x + 9, h.y - 22);
        ctx.lineTo(h.x + 5, h.y - 8); ctx.lineTo(h.x - 5, h.y - 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#a8324a';
        ctx.beginPath(); ctx.moveTo(h.x - 7, h.y - 16); ctx.lineTo(h.x + 7, h.y - 16);
        ctx.lineTo(h.x + 5, h.y - 9); ctx.lineTo(h.x - 5, h.y - 9); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c8d4e0'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(h.x, h.y - 8); ctx.lineTo(h.x, h.y + 4); ctx.stroke();
        ctx.fillStyle = '#c8d4e0'; rr(ctx, h.x - 8, h.y + 3, 16, 4, 2);
        break;
      case 'metronome':        // 节拍器：金字塔 + 摆锤
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.moveTo(h.x, h.y - 26); ctx.lineTo(h.x + 13, h.y + 8);
        ctx.lineTo(h.x - 13, h.y + 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = WOOD[0];
        ctx.beginPath(); ctx.moveTo(h.x, h.y - 22); ctx.lineTo(h.x + 10, h.y + 6);
        ctx.lineTo(h.x - 10, h.y + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = WOOD[1]; rr(ctx, h.x - 12, h.y + 6, 24, 5, 2);
        ctx.strokeStyle = BRASS[1]; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(h.x - 4, h.y + 6); ctx.lineTo(h.x + 5, h.y - 18); ctx.stroke();
        ctx.fillStyle = BRASS[0];
        ctx.beginPath(); ctx.arc(h.x + 5, h.y - 18, 3.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'cane':             // 手杖
        ctx.strokeStyle = OUT; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(h.x + 6, h.y - 4); ctx.lineTo(h.x + 6, h.y + 52); ctx.stroke();
        ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(h.x + 6, h.y - 4); ctx.lineTo(h.x + 6, h.y + 52); ctx.stroke();
        ctx.fillStyle = BRASS[0];
        ctx.beginPath(); ctx.arc(h.x + 6, h.y - 12, 5, 0, Math.PI * 2); ctx.fill();
        break;
      // ---------- v6.0 新增 6 种 ----------
      case 'notebook':         // 袖珍笔记本（雅那切克记录"语言旋律"用）
        ctx.fillStyle = OUT; rr(ctx, h.x - 13, h.y - 4, 25, 19, 3);
        ctx.fillStyle = sp.coat[1]; rr(ctx, h.x - 11, h.y - 3, 21, 17, 2);
        ctx.fillStyle = '#f4f0e2'; rr(ctx, h.x - 9, h.y - 2, 18, 15, 1);
        ctx.fillStyle = '#b9b3a0';
        for (var nbi = 0; nbi < 4; nbi++) ctx.fillRect(h.x - 7, h.y + 1 + nbi * 3, 14, 1);
        ctx.fillStyle = sp.accent; rr(ctx, h.x - 13, h.y - 4, 4, 19, 2);
        // 夹在指间的短铅笔
        ctx.strokeStyle = '#c8a24a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(h.x + 10, h.y - 8); ctx.lineTo(h.x + 17, h.y - 16); ctx.stroke();
        break;
      case 'cigar':            // 雪茄（格拉祖诺夫 / 米亚斯科夫斯基）
        ctx.fillStyle = OUT; rr(ctx, h.x - 4, h.y - 4, 24, 7, 3);
        ctx.fillStyle = '#6a4a2a'; rr(ctx, h.x - 3, h.y - 3, 22, 5, 2);
        ctx.fillStyle = sp.accent; rr(ctx, h.x + 9, h.y - 3, 4, 5, 1);
        ctx.fillStyle = '#ff8a3a';
        ctx.beginPath(); ctx.arc(h.x + 20, h.y - 0.5, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#d8d0c0';
        for (var cgi = 0; cgi < 3; cgi++) {
          ctx.beginPath();
          ctx.arc(h.x + 26 + cgi * 5, h.y - 8 - cgi * 7, 3.4 - cgi * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'cello':            // 大提琴（抵在身前的琴身 + 琴颈）
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.ellipse(h.x + 4, h.y + 12, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a4a24';
        ctx.beginPath();
        ctx.ellipse(h.x + 4, h.y + 12, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3418';
        ctx.beginPath();
        ctx.ellipse(h.x + 4, h.y + 17, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(h.x + 2, h.y - 2); ctx.lineTo(h.x - 4, h.y - 34); ctx.stroke();
        ctx.fillStyle = '#2a1a0c'; rr(ctx, h.x - 8, h.y - 40, 10, 8, 2);
        ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 1;
        for (var ci2 = 0; ci2 < 3; ci2++) {
          ctx.beginPath();
          ctx.moveTo(h.x - 1 + ci2 * 3, h.y - 28);
          ctx.lineTo(h.x + 1 + ci2 * 3, h.y + 22);
          ctx.stroke();
        }
        break;
      case 'harp':             // 竖琴（斜倚在肩上的琴框）
        ctx.strokeStyle = OUT; ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(h.x - 10, h.y + 8);
        ctx.quadraticCurveTo(h.x - 24, h.y - 40, h.x + 8, h.y - 52);
        ctx.stroke();
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(h.x - 10, h.y + 8);
        ctx.quadraticCurveTo(h.x - 24, h.y - 40, h.x + 8, h.y - 52);
        ctx.stroke();
        ctx.strokeStyle = BRASS[0]; ctx.lineWidth = 2;
        for (var hi2 = 0; hi2 < 6; hi2++) {
          var ht = hi2 / 5;
          ctx.beginPath();
          ctx.moveTo(h.x - 9 + ht * 16, h.y + 8 - ht * 58);
          ctx.lineTo(h.x + 2 + ht * 5, h.y + 4 - ht * 30);
          ctx.stroke();
        }
        break;
      case 'horn':             // 圆号（盘绕的铜管 + 喇叭口）
        ctx.strokeStyle = OUT; ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(h.x + 2, h.y + 4, 15, Math.PI * 0.15, Math.PI * 1.55);
        ctx.stroke();
        ctx.strokeStyle = BRASS[0]; ctx.lineWidth = 4.4;
        ctx.beginPath();
        ctx.arc(h.x + 2, h.y + 4, 15, Math.PI * 0.15, Math.PI * 1.55);
        ctx.stroke();
        ctx.fillStyle = BRASS[0];
        ctx.beginPath();
        ctx.moveTo(h.x + 15, h.y - 6);
        ctx.lineTo(h.x + 25, h.y - 18);
        ctx.lineTo(h.x + 30, h.y - 12);
        ctx.lineTo(h.x + 18, h.y + 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = BRASS[1];
        ctx.beginPath(); ctx.arc(h.x + 2, h.y + 4, 5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'snuffbox':         // 鼻烟盒（18 世纪宫廷小器物）
        ctx.fillStyle = OUT; rr(ctx, h.x - 12, h.y - 3, 26, 15, 3);
        ctx.fillStyle = sp.accent; rr(ctx, h.x - 10, h.y - 2, 22, 13, 2);
        ctx.fillStyle = BRASS[0]; rr(ctx, h.x - 10, h.y - 2, 22, 4, 2);
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath(); ctx.arc(h.x + 1, h.y + 5, 4, 0, Math.PI * 2); ctx.fill();
        break;
    }
  }

  function drawTorso(ctx, hipY, shY, p, sp) {
    var h = hipY - shY;
    var lean = (p.lean || 0) * 0.9;
    var style = sp.coatStyle || 'frock';
    // 修女服 / 长袍：整片长袍，没有燕尾、没有领结
    // v5.0：宾根（修女）、佩罗坦与塔利斯（修士）共用这套长袍
    if (style === 'habit') {
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

    // ---------- v5.1 新增剪影：7 种袍服 ----------
    // 学士袍 / 大礼服长袍：从肩到下摆逐渐外扩，袖子垂坠
    if (style === 'gown') {
      var gw = 20, gw2 = 27;
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(-gw - 3, shY - 2); ctx.lineTo(gw + 3, shY - 2);
      ctx.lineTo(gw2 + 3, hipY + 26); ctx.lineTo(-gw2 - 3, hipY + 26);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[0];
      ctx.beginPath();
      ctx.moveTo(-gw, shY); ctx.lineTo(gw, shY);
      ctx.lineTo(gw2, hipY + 24); ctx.lineTo(-gw2, hipY + 24);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[1];
      ctx.beginPath();
      ctx.moveTo(-gw, shY + 1); ctx.lineTo(-gw + 8, shY + 1);
      ctx.lineTo(-gw2 + 9, hipY + 23); ctx.lineTo(-gw2, hipY + 23);
      ctx.closePath(); ctx.fill();
      // 前襟垂带
      ctx.fillStyle = sp.coat[2];
      rr(ctx, 7, shY + 2, 6, h + 22, 3);
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-4, shY + 1); ctx.lineTo(6, shY + 1); ctx.lineTo(4, shY + h * 0.6);
      ctx.lineTo(-3, shY + h * 0.55); ctx.closePath(); ctx.fill();
      // 垂袖
      ctx.fillStyle = sp.coat[2];
      rr(ctx, -25, shY + 6, 9, 30, 4);
      rr(ctx, 17, shY + 6, 9, 26, 4);
      ctx.fillStyle = sp.accent;
      rr(ctx, -3, shY + 2, 8, 4, 2);
      return;
    }
    // 和服 / 东亚交领长衫：右衽交领 + 宽腰带
    if (style === 'kimono') {
      ctx.fillStyle = OUT;
      rr(ctx, -19 + lean * 0.35, shY - 2, 38, h + 26, 7);
      ctx.fillStyle = sp.coat[0];
      rr(ctx, -17 + lean * 0.35, shY, 34, h + 24, 6);
      ctx.fillStyle = sp.coat[1];
      rr(ctx, -17 + lean * 0.35, shY + 1, 8, h + 22, 5);
      // 交领：两片斜襟
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-13, shY + 1); ctx.lineTo(11, shY + 1);
      ctx.lineTo(3, shY + h * 0.72); ctx.lineTo(-13, shY + h * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[2];
      ctx.beginPath();
      ctx.moveTo(-15, shY + 1); ctx.lineTo(-2, shY + 1);
      ctx.lineTo(-6, shY + h * 0.7); ctx.lineTo(-15, shY + h * 0.62); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(15, shY + 1); ctx.lineTo(2, shY + 1);
      ctx.lineTo(1, shY + h * 0.66); ctx.lineTo(15, shY + h * 0.58); ctx.closePath(); ctx.fill();
      // 宽腰带
      ctx.fillStyle = OUT; rr(ctx, -19 + lean * 0.4, hipY - 16, 39, 15, 3);
      ctx.fillStyle = sp.accent; rr(ctx, -17 + lean * 0.4, hipY - 14, 35, 11, 2);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -17 + lean * 0.4, hipY - 6, 35, 3, 1);
      return;
    }
    // 军装：高领 + 双排扣 + 肩章 + 腰带
    if (style === 'military') {
      ctx.fillStyle = OUT; rr(ctx, -18 + lean * 0.45, hipY - 12, 37, 24, 5);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -16 + lean * 0.45, hipY - 10, 33, 21, 4);
      ctx.fillStyle = OUT; rr(ctx, -17, shY - 2, 34, h + 12, 8);
      ctx.fillStyle = sp.coat[0]; rr(ctx, -15, shY, 30, h + 8, 6);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15, shY + 1, 8, h + 7, 5);
      ctx.fillStyle = sp.coat[2]; rr(ctx, 6, shY + 3, 6, h - 4, 3);
      // 高领
      ctx.fillStyle = sp.coat[2]; rr(ctx, -8, shY - 3, 17, 6, 2);
      ctx.fillStyle = sp.accent; rr(ctx, -2, shY - 2, 5, 4, 1);
      // 双排扣
      ctx.fillStyle = sp.accent;
      for (var mi = 0; mi < 3; mi++) {
        ctx.fillRect(1, shY + 14 + mi * 7, 3, 3);
        ctx.fillRect(9, shY + 14 + mi * 7, 3, 3);
      }
      // 肩章
      ctx.fillStyle = sp.accent;
      rr(ctx, -17, shY - 1, 11, 5, 2); rr(ctx, 7, shY - 1, 11, 5, 2);
      ctx.fillStyle = sp.coat[1];
      rr(ctx, -14, shY + 1, 5, 2, 1); rr(ctx, 10, shY + 1, 5, 2, 1);
      // 腰带
      ctx.fillStyle = OUT; rr(ctx, -17, hipY - 6, 34, 9, 2);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -16, hipY - 5, 32, 7, 2);
      ctx.fillStyle = sp.accent; rr(ctx, 4, hipY - 5, 7, 7, 1);
      return;
    }
    // 文艺复兴紧身短上衣：拉夫领 + 收腰 + 开衩下摆
    if (style === 'doublet') {
      ctx.fillStyle = OUT; rr(ctx, -16 + lean * 0.5, hipY - 10, 33, 22, 4);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -14 + lean * 0.5, hipY - 8, 29, 19, 3);
      ctx.fillStyle = OUT; rr(ctx, -17, shY - 2, 34, h + 10, 8);
      ctx.fillStyle = sp.coat[0]; rr(ctx, -15, shY, 30, h + 6, 6);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15, shY + 1, 8, h + 5, 5);
      ctx.fillStyle = sp.coat[2]; rr(ctx, 6, shY + 3, 6, h - 6, 3);
      // 前襟开衩（尖角）
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-3, shY + 2); ctx.lineTo(9, shY + 2);
      ctx.lineTo(3, shY + h + 4); ctx.closePath(); ctx.fill();
      // 拉夫领：一圈白色褶皱
      ctx.fillStyle = sp.shirt[0];
      rr(ctx, -11, shY - 6, 23, 8, 3);
      ctx.fillStyle = sp.shirt[1];
      for (var di = 0; di < 5; di++) ctx.fillRect(-9 + di * 5, shY - 5, 2, 6);
      ctx.fillStyle = sp.accent; rr(ctx, -10, shY - 7, 21, 3, 1);
      // 排扣
      ctx.fillStyle = sp.accent;
      for (var dj = 0; dj < 4; dj++) ctx.fillRect(11, shY + 12 + dj * 7, 3, 3);
      return;
    }
    // 束腰长衫（中世纪 / 文艺复兴）
    if (style === 'tunic') {
      ctx.fillStyle = OUT; rr(ctx, -17 + lean * 0.45, hipY - 12, 35, 26, 5);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15 + lean * 0.45, hipY - 10, 31, 23, 4);
      ctx.fillStyle = OUT; rr(ctx, -17, shY - 2, 34, h + 12, 8);
      ctx.fillStyle = sp.coat[0]; rr(ctx, -15, shY, 30, h + 8, 6);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15, shY + 1, 8, h + 7, 5);
      ctx.fillStyle = sp.coat[2]; rr(ctx, 6, shY + 3, 6, h - 4, 3);
      // 圆领 + 系带
      ctx.fillStyle = sp.shirt[0]; rr(ctx, -6, shY - 1, 14, 7, 3);
      ctx.fillStyle = sp.accent;
      rr(ctx, -4, shY + 6, 10, 3, 1);
      rr(ctx, -4, shY + 12, 10, 3, 1);
      // 腰带
      ctx.fillStyle = OUT; rr(ctx, -16, hipY - 8, 33, 8, 2);
      ctx.fillStyle = WOOD[0]; rr(ctx, -15, hipY - 7, 31, 6, 2);
      ctx.fillStyle = sp.accent; rr(ctx, 2, hipY - 7, 7, 6, 1);
      return;
    }
    // 现代西装短外套：只到腰，不遮腿
    if (style === 'jacket') {
      ctx.fillStyle = OUT; rr(ctx, -17, shY - 2, 34, h - 2, 8);
      ctx.fillStyle = sp.coat[0]; rr(ctx, -15, shY, 30, h - 6, 6);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15, shY + 1, 8, h - 7, 5);
      ctx.fillStyle = sp.coat[2]; rr(ctx, 6, shY + 3, 6, h - 14, 3);
      // 大 V 领衬衫
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-6, shY - 1); ctx.lineTo(12, shY - 1);
      ctx.lineTo(3, shY + h * 0.82); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.shirt[1];
      ctx.beginPath();
      ctx.moveTo(-1, shY); ctx.lineTo(3, shY); ctx.lineTo(2, shY + h * 0.7);
      ctx.closePath(); ctx.fill();
      // 翻领
      ctx.fillStyle = sp.coat[2];
      ctx.beginPath(); ctx.moveTo(-8, shY - 1); ctx.lineTo(1, shY - 1);
      ctx.lineTo(-2, shY + 20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, shY - 1); ctx.lineTo(5, shY - 1);
      ctx.lineTo(8, shY + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.accent; rr(ctx, 1, shY + 6, 7, 4, 1);
      ctx.fillStyle = sp.coat[1];
      for (var ji = 0; ji < 2; ji++) ctx.fillRect(9, shY + 20 + ji * 8, 3, 3);
      return;
    }
    // 毛衣 / 便装：圆领罗纹，无领带领结
    if (style === 'sweater') {
      ctx.fillStyle = OUT; rr(ctx, -16, shY - 2, 33, h + 8, 8);
      ctx.fillStyle = sp.coat[0]; rr(ctx, -14, shY, 29, h + 5, 6);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -14, shY + 1, 8, h + 4, 5);
      ctx.fillStyle = sp.coat[2]; rr(ctx, 5, shY + 4, 7, h - 6, 3);
      // 圆领
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath(); ctx.ellipse(0, shY + 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sp.coat[1];
      ctx.beginPath(); ctx.ellipse(0, shY + 3, 6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      // 罗纹下摆
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15, hipY - 4, 31, 8, 3);
      ctx.fillStyle = sp.coat[2];
      for (var si = 0; si < 7; si++) ctx.fillRect(-13 + si * 4, hipY - 3, 2, 6);
      // 提花条纹
      ctx.fillStyle = sp.accent;
      rr(ctx, -12, shY + 16, 24, 2, 1);
      rr(ctx, -12, shY + 24, 24, 2, 1);
      return;
    }

    // ---------- v6.0 新增剪影：3 种 ----------
    // 18 世纪宫廷长外衣（justaucorps）：收腰、前襟排扣、口袋盖、及膝下摆
    if (style === 'justaucorps') {
      var jw = 18, jw2 = 26;
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(-jw - 3, shY - 2); ctx.lineTo(jw + 3, shY - 2);
      ctx.lineTo(jw2 + 3, hipY + 34); ctx.lineTo(-jw2 - 3, hipY + 34);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[0];
      ctx.beginPath();
      ctx.moveTo(-jw, shY); ctx.lineTo(jw, shY);
      ctx.lineTo(jw2, hipY + 32); ctx.lineTo(-jw2, hipY + 32);
      ctx.closePath(); ctx.fill();
      // 背光面
      ctx.fillStyle = sp.coat[1];
      ctx.beginPath();
      ctx.moveTo(-jw, shY + 1); ctx.lineTo(-jw + 8, shY + 1);
      ctx.lineTo(-jw2 + 9, hipY + 31); ctx.lineTo(-jw2, hipY + 31);
      ctx.closePath(); ctx.fill();
      // 收腰：在腰线上压一条深色带
      ctx.fillStyle = sp.coat[1];
      rr(ctx, -jw + 1, hipY - 14, jw * 2 - 2, 12, 3);
      // 前襟排扣（一整排，18 世纪的标志）
      ctx.fillStyle = sp.accent;
      for (var ji2 = 0; ji2 < 5; ji2++) {
        ctx.fillRect(-1, shY + 12 + ji2 * 11, 4, 4);
      }
      // 口袋盖
      ctx.fillStyle = sp.coat[2];
      rr(ctx, -16, hipY - 12, 11, 6, 2);
      rr(ctx, 6, hipY - 12, 11, 6, 2);
      // 白色领巾（cravat）与宽袖口
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-6, shY - 1); ctx.lineTo(7, shY - 1); ctx.lineTo(2, shY + 15);
      ctx.lineTo(-3, shY + 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[2];
      rr(ctx, -25, shY + 22, 9, 11, 3);
      rr(ctx, 17, shY + 22, 9, 10, 3);
      return;
    }
    // 马甲绅士：衬衫卷袖 + 紧身马甲 + 怀表链（19 世纪中后期的便装）
    if (style === 'waistcoat') {
      ctx.fillStyle = OUT; rr(ctx, -16 + lean * 0.5, hipY - 10, 33, 22, 5);
      ctx.fillStyle = sp.coat[1]; rr(ctx, -15 + lean * 0.5, hipY - 9, 31, 20, 4);
      // 衬衫（宽袖，露出小臂的白袖口）
      ctx.fillStyle = OUT; rr(ctx, -17, shY - 2, 34, h + 10, 8);
      ctx.fillStyle = sp.shirt[0]; rr(ctx, -15, shY, 30, h + 6, 6);
      ctx.fillStyle = sp.shirt[1]; rr(ctx, -15, shY + 1, 8, h + 5, 5);
      ctx.fillStyle = sp.shirt[0]; rr(ctx, 19, shY + 16, 8, 20, 3);
      rr(ctx, -27, shY + 16, 8, 18, 3);
      // 马甲
      ctx.fillStyle = sp.coat[0];
      ctx.beginPath();
      ctx.moveTo(-11, shY + 2); ctx.lineTo(11, shY + 2);
      ctx.lineTo(9, hipY - 2); ctx.lineTo(-9, hipY - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[2];
      ctx.beginPath();
      ctx.moveTo(-11, shY + 2); ctx.lineTo(-4, shY + 2);
      ctx.lineTo(-5, hipY - 2); ctx.lineTo(-9, hipY - 2); ctx.closePath(); ctx.fill();
      // 怀表链
      ctx.fillStyle = sp.accent;
      ctx.beginPath();
      ctx.moveTo(0, hipY - 6);
      ctx.quadraticCurveTo(7, hipY - 3, 9, hipY - 7);
      ctx.lineWidth = 2; ctx.strokeStyle = sp.accent; ctx.stroke();
      // 领带
      ctx.fillStyle = sp.accent; rr(ctx, -3, shY - 1, 6, 12, 2);
      // 马甲扣
      ctx.fillStyle = sp.coat[1];
      for (var wi = 0; wi < 3; wi++) ctx.fillRect(-1, shY + 18 + wi * 9, 3, 3);
      return;
    }
    // 教授袍 / 学院礼服：宽大垂坠的长袍 + 垂布 + 腰间束带
    if (style === 'academic') {
      var aw = 21, aw2 = 29;
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(-aw - 3, shY - 2); ctx.lineTo(aw + 3, shY - 2);
      ctx.lineTo(aw2 + 3, hipY + 30); ctx.lineTo(-aw2 - 3, hipY + 30);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[0];
      ctx.beginPath();
      ctx.moveTo(-aw, shY); ctx.lineTo(aw, shY);
      ctx.lineTo(aw2, hipY + 28); ctx.lineTo(-aw2, hipY + 28);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = sp.coat[1];
      ctx.beginPath();
      ctx.moveTo(-aw, shY + 1); ctx.lineTo(-aw + 9, shY + 1);
      ctx.lineTo(-aw2 + 10, hipY + 27); ctx.lineTo(-aw2, hipY + 27);
      ctx.closePath(); ctx.fill();
      // 前襟的学术垂布（两片深色垂带）
      ctx.fillStyle = sp.coat[2];
      rr(ctx, -7, shY + 2, 7, h + 26, 3);
      rr(ctx, 1, shY + 2, 7, h + 22, 3);
      // 白色领巾
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.moveTo(-5, shY + 1); ctx.lineTo(5, shY + 1); ctx.lineTo(2, shY + 16);
      ctx.lineTo(-2, shY + 16); ctx.closePath(); ctx.fill();
      // 腰间束带
      ctx.fillStyle = OUT; rr(ctx, -aw2 + 1, hipY - 8, aw2 * 2 - 2, 10, 2);
      ctx.fillStyle = sp.accent; rr(ctx, -aw2 + 2, hipY - 7, aw2 * 2 - 4, 8, 2);
      // 垂袖
      ctx.fillStyle = sp.coat[2];
      rr(ctx, -26, shY + 6, 10, 34, 4);
      rr(ctx, 16, shY + 6, 10, 30, 4);
      return;
    }

    // 燕尾 / 礼服下摆（先画，让前腿压在上面）
    ctx.fillStyle = OUT;
    if (style === 'frock') {
      rr(ctx, -17 + lean * 0.5, hipY - 12, 19, 29, 5);
      rr(ctx, -1 + lean * 0.5, hipY - 12, 18, 26, 5);
    } else if (style === 'tailed') {
      rr(ctx, -16 + lean * 0.5, hipY - 11, 18, 24, 4);
      rr(ctx, -1 + lean * 0.5, hipY - 11, 17, 22, 4);
    } else {
      rr(ctx, -17 + lean * 0.5, hipY - 11, 34, 20, 5);
    }
    ctx.fillStyle = sp.coat[1];
    if (style === 'frock') {
      rr(ctx, -15 + lean * 0.5, hipY - 10, 16, 26, 4);
      rr(ctx, 0 + lean * 0.5, hipY - 10, 15, 23, 4);
    } else if (style === 'tailed') {
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

  // ---------- v5.1 躯干外挂件：披风 / 围巾 / 绶带 / 肩背小风琴 ----------
  function drawOverlay(ctx, hipY, shY, p, sp, layer) {
    // 披风：分两层，后面那层在躯干之前画（后摆），前面这层在躯干之后画（肩扣与前襟）
    if (sp.cape) {
      if (layer === 'back') {
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(-19, shY - 3); ctx.lineTo(19, shY - 3);
        ctx.lineTo(27, hipY + 18); ctx.lineTo(-27, hipY + 18);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath();
        ctx.moveTo(-17, shY - 1); ctx.lineTo(17, shY - 1);
        ctx.lineTo(24, hipY + 15); ctx.lineTo(-24, hipY + 15);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[2];
        ctx.beginPath();
        ctx.moveTo(-17, shY - 1); ctx.lineTo(-9, shY - 1);
        ctx.lineTo(-14, hipY + 15); ctx.lineTo(-24, hipY + 15);
        ctx.closePath(); ctx.fill();
      } else {
        // 肩扣 + 领口
        ctx.fillStyle = sp.accent;
        rr(ctx, -14, shY - 6, 28, 6, 2);
        rr(ctx, -4, shY - 9, 9, 7, 2);
        ctx.fillStyle = sp.coat[2];
        rr(ctx, -2, shY - 4, 5, 4, 1);
      }
      return;
    }
    if (layer !== 'front') return;
    // 肩背小风琴（管风琴师的键盘）：横在胸前的键床 + 两侧音管
    if (sp.item === 'organ') {
      ctx.fillStyle = OUT; rr(ctx, -22, shY + 20, 45, 13, 3);
      ctx.fillStyle = WOOD[1]; rr(ctx, -20, shY + 21, 41, 11, 2);
      ctx.fillStyle = '#f4f0e2';
      for (var k = 0; k < 9; k++) ctx.fillRect(-18 + k * 4.4, shY + 22, 4, 6);
      ctx.fillStyle = '#2a2a34';
      for (var k2 = 0; k2 < 8; k2++) ctx.fillRect(-16 + k2 * 4.4, shY + 22, 2, 4);
      ctx.fillStyle = sp.accent; rr(ctx, -21, shY + 30, 43, 3, 1);
      ctx.fillStyle = BRASS[0];
      for (var k3 = 0; k3 < 4; k3++) {
        ctx.fillRect(-24 + k3 * 3.6, shY + 6, 3, 16);
        ctx.fillRect(12 + k3 * 3.6, shY + 6, 3, 16);
      }
    }
    if (sp.sash) {          // 绶带（斜挎）
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-16, shY + 2); ctx.lineTo(-8, shY - 1);
      ctx.lineTo(15, hipY + 6); ctx.lineTo(9, hipY + 9);
      ctx.closePath();
      ctx.fillStyle = sp.accent; ctx.fill();
      ctx.restore();
    }
    if (sp.scarf) {         // 围巾：绕颈一圈 + 垂下一段
      ctx.fillStyle = sp.accent;
      rr(ctx, -13, shY - 5, 27, 8, 3);
      ctx.fillStyle = sp.coat[2];
      rr(ctx, 8, shY + 2, 8, 26, 3);
      ctx.fillStyle = sp.accent;
      rr(ctx, 9, shY + 24, 7, 12, 3);
      rr(ctx, 10, shY + 34, 2, 5, 1); rr(ctx, 14, shY + 34, 2, 5, 1);
    }
    // v6.0：拉夫领（文艺复兴 / 巴洛克早期的轮状皱领）
    //   伯德、库普兰这类 16~17 世纪人物戴它，一眼就能和 19 世纪的领结区分开
    if (sp.ruff) {
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.ellipse(0, shY - 3, 17, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.ellipse(0, shY - 3, 15, 8.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 褶皱：一圈放射状的小扇形
      ctx.fillStyle = sp.shirt[1];
      for (var rf = 0; rf < 12; rf++) {
        var ra = rf * (Math.PI * 2 / 12);
        ctx.beginPath();
        ctx.ellipse(Math.cos(ra) * 11, shY - 3 + Math.sin(ra) * 5.4, 2.6, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = sp.shirt[0];
      ctx.beginPath();
      ctx.ellipse(0, shY - 3, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (sp.cape) {          // 披风（不会走到这里：上面已 return，留作防御）
      return;
    }
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
    },
    // ---------- v6.0 新增 5 种 ----------
    sidepart: { // 三七分背头（20 世纪绅士照最常见）
      back: [[-16, -31, 32, 19, 7], [-18, -22, 10, 16, 4]],
      front: [[-15, -30, 30, 5, 2], [-15, -30, 17, 8, 3]]
    },
    slick: {  // 油头后梳（紧贴头皮，额头全露）
      back: [[-16, -30, 32, 17, 7], [-15, -21, 30, 11, 4]],
      front: [[-15, -29, 30, 5, 2], [-9, -27, 19, 4, 2]]
    },
    periwig: { // 巴洛克长卷假发（两侧大卷垂到肩）
      back: [[-21, -34, 42, 26, 11], [-24, -18, 14, 34, 7], [10, -18, 14, 34, 7]],
      front: [[-19, -32, 38, 10, 5], [-22, -28, 9, 15, 4], [14, -28, 9, 15, 4]]
    },
    mutton: { // 连鬓鬓角（鬓角与头发连成一片）
      back: [[-16, -30, 32, 18, 7], [-20, -27, 11, 27, 5], [9, -27, 11, 27, 5]],
      front: [[-14, -29, 28, 6, 3]]
    },
    tuft: {   // 前秃、头顶后部留一撮
      back: [[-13, -25, 8, 14, 4], [6, -25, 8, 14, 4], [-7, -35, 19, 13, 5]],
      front: [[-9, -34, 18, 5, 2]]
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
      case 'narrow':  // v5.1 眯缝眼（东方 / 沉静）
        ctx.fillStyle = col;
        rr(ctx, hx + 1, y0 + 3, 8, 2, 1);
        rr(ctx, hx + 11, y0 + 3, 8, 2, 1);
        ctx.fillStyle = sp.hairDark;
        rr(ctx, hx, y0, 10, 2, 1);
        rr(ctx, hx + 10, y0, 10, 2, 1);
        break;
      case 'dot':     // v5.1 圆点眼（少年 / 诙谐）
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(hx + 5, y0 + 3, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + 13, y0 + 3, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = white;
        ctx.fillRect(hx + 4, y0 + 1, 1.6, 1.6);
        ctx.fillRect(hx + 12, y0 + 1, 1.6, 1.6);
        break;
      case 'sad':     // v5.1 下垂眼（忧郁）
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(hx + 1, y0 + 6); ctx.lineTo(hx + 9, y0 + 1);
        ctx.lineTo(hx + 9, y0 + 6); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + 18, y0 + 6); ctx.lineTo(hx + 10, y0 + 1);
        ctx.lineTo(hx + 10, y0 + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = white;
        ctx.fillRect(hx + 5, y0 + 3, 2, 2);
        ctx.fillRect(hx + 12, y0 + 3, 2, 2);
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
      case 'flat':    // v5.1 平直浓眉（军官 / 严师）
        rr(ctx, hx + 0, y0 + 1, 9, 4, 1);
        rr(ctx, hx + 10, y0 + 1, 9, 4, 1);
        break;
      case 'slight':  // v5.1 极淡的细眉（少年 / 女性）
        rr(ctx, hx + 3, y0 + 2, 6, 1.6, 1);
        rr(ctx, hx + 11, y0 + 2, 6, 1.6, 1);
        break;
      case 'worried': // v5.1 八字眉（忧虑）
        ctx.beginPath();
        ctx.moveTo(hx + 1, y0 + 4); ctx.lineTo(hx + 9, y0);
        ctx.lineTo(hx + 9, y0 + 3); ctx.lineTo(hx + 1, y0 + 7);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + 18, y0 + 4); ctx.lineTo(hx + 10, y0);
        ctx.lineTo(hx + 10, y0 + 3); ctx.lineTo(hx + 18, y0 + 7);
        ctx.closePath(); ctx.fill();
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
      case 'snub':    // v5.1 翘鼻（圆润上翘）
        ctx.fillStyle = sp.skin[0];
        rr(ctx, hx + 13, hy - 18, 6, 7, 3);
        ctx.fillStyle = sp.skin[1];
        rr(ctx, hx + 12, hy - 12, 7, 3, 2);
        break;
      case 'roman':   // v5.1 罗马鼻（高挺笔直）
        ctx.fillStyle = sp.skin[0];
        rr(ctx, hx + 14, hy - 22, 5, 12, 2);
        ctx.fillStyle = sp.skin[1];
        rr(ctx, hx + 13, hy - 12, 7, 3, 2);
        break;
      case 'wide':    // v5.1 宽扁鼻（敦厚）
        ctx.fillStyle = sp.skin[0];
        rr(ctx, hx + 12, hy - 16, 9, 5, 2);
        ctx.fillStyle = sp.skin[1];
        rr(ctx, hx + 11, hy - 13, 11, 3, 2);
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
      case 'smirk':   // v5.1 歪嘴笑（讥诮）
        ctx.fillStyle = '#7b4a45';
        rr(ctx, hx + 4, hy - 7, 9, 2, 1);
        rr(ctx, hx + 12, hy - 9, 4, 2, 1);
        break;
      case 'pursed':  // v5.1 抿嘴（严肃）
        ctx.fillStyle = '#7b4a45';
        rr(ctx, hx + 6, hy - 7, 9, 3, 2);
        ctx.fillStyle = '#c98a84';
        rr(ctx, hx + 7, hy - 7, 7, 1, 1);
        break;
      case 'grim':    // v5.1 咬牙（狠厉）
        ctx.fillStyle = '#3a1f1c';
        rr(ctx, hx + 4, hy - 8, 12, 5, 1);
        ctx.fillStyle = '#f4f0e2';
        rr(ctx, hx + 5, hy - 8, 10, 2, 1);
        ctx.fillStyle = '#7b4a45';
        rr(ctx, hx + 5, hy - 5, 10, 2, 1);
        break;
      default:        // line
        rr(ctx, hx + 5, hy - 6, 10, 2, 1);
    }
  }

  function drawHead(ctx, shY, p, sp) {
    var st = sp.stoop || 0;                       // v5.1：驼背程度 0/1/2（此前只写不读）
    var hx = (p.lean || 0) * 0.55 + (p.headTilt || 0) * 0.7 + st * 3.2;
    var hy = shY - 9 * (p.sq == null ? 1 : p.sq) + st * 2.6;
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
    } else if (f.cheeks === 'hollow') {   // v5.1 深陷的双颊
      ctx.fillStyle = sp.skin[1];
      rr(ctx, hx - 1, hy - 13, 5, 12, 2);
      rr(ctx, hx + 13, hy - 13, 4, 11, 2);
      ctx.fillStyle = 'rgba(40,28,26,0.22)';
      rr(ctx, hx + 1, hy - 10, 4, 7, 2);
      rr(ctx, hx + 13, hy - 10, 4, 6, 2);
    } else if (f.cheeks === 'rosy') {     // v5.1 红润的圆颊
      ctx.fillStyle = 'rgba(240,130,120,0.42)';
      ctx.beginPath(); ctx.arc(hx + 5, hy - 8, 4.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 14, hy - 8, 4, 0, Math.PI * 2); ctx.fill();
    } else if (f.cheeks === 'wrinkled') { // v5.1 法令纹 + 皱纹
      ctx.fillStyle = sp.skin[1];
      rr(ctx, hx + 1, hy - 7, 3, 8, 1);
      rr(ctx, hx + 14, hy - 7, 3, 7, 1);
      ctx.fillStyle = 'rgba(90,60,50,0.34)';
      rr(ctx, hx - 2, hy - 14, 8, 1.6, 1);
      rr(ctx, hx + 11, hy - 14, 8, 1.6, 1);
      rr(ctx, hx + 16, hy - 20, 6, 1.6, 1);
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
    // v5.1：帽子（画在头发之上）
    drawHat(ctx, hx, hy, sp);
  }

  // ---------- 帽子库（v5.1 新增：给 18 世纪组 / 现代组制造剪影差异）----------
  function drawHat(ctx, hx, hy, sp) {
    var hat = sp.hat;
    if (!hat) return;
    var top = hy - 26;      // 头顶基线
    ctx.lineCap = 'butt';
    switch (hat) {
      case 'tricorne':       // 三角帽（18 世纪）
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 20, top - 2); ctx.lineTo(hx + 21, top - 4);
        ctx.lineTo(hx + 13, top - 15); ctx.lineTo(hx - 13, top - 13);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[0];
        ctx.beginPath();
        ctx.moveTo(hx - 17, top - 3); ctx.lineTo(hx + 18, top - 5);
        ctx.lineTo(hx + 11, top - 12); ctx.lineTo(hx - 11, top - 11);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.accent;
        rr(ctx, hx - 6, top - 12, 7, 8, 2);
        rr(ctx, hx - 17, top - 3, 35, 3, 1);
        break;
      case 'bicorne':        // 双角帽（拿破仑式）
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 22, top - 6); ctx.lineTo(hx - 8, top - 14);
        ctx.lineTo(hx + 8, top - 14); ctx.lineTo(hx + 22, top - 6);
        ctx.lineTo(hx + 10, top + 1); ctx.lineTo(hx - 10, top + 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[0];
        ctx.beginPath();
        ctx.moveTo(hx - 19, top - 6); ctx.lineTo(hx - 7, top - 12);
        ctx.lineTo(hx + 7, top - 12); ctx.lineTo(hx + 19, top - 6);
        ctx.lineTo(hx + 8, top - 1); ctx.lineTo(hx - 8, top - 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.accent; rr(ctx, hx - 3, top - 12, 6, 6, 2);
        break;
      case 'tophat':         // 高筒礼帽（浪漫主义绅士）
        ctx.fillStyle = OUT; rr(ctx, hx - 15, top - 1, 31, 5, 2);
        ctx.fillStyle = '#22222a'; rr(ctx, hx - 12, top - 22, 25, 23, 3);
        ctx.fillStyle = '#3a3a46'; rr(ctx, hx - 10, top - 20, 8, 19, 2);
        ctx.fillStyle = sp.accent; rr(ctx, hx - 12, top - 6, 25, 4, 1);
        break;
      case 'flatcap':        // 平顶便帽 / 报童帽
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 16, top - 1); ctx.lineTo(hx + 13, top - 1);
        ctx.lineTo(hx + 11, top - 11); ctx.lineTo(hx - 12, top - 13);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[2];
        ctx.beginPath();
        ctx.moveTo(hx - 14, top - 2); ctx.lineTo(hx + 11, top - 2);
        ctx.lineTo(hx + 9, top - 10); ctx.lineTo(hx - 10, top - 11);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = OUT; rr(ctx, hx + 12, top - 3, 11, 4, 2);
        ctx.fillStyle = sp.coat[1]; rr(ctx, hx + 13, top - 2, 9, 3, 1);
        break;
      case 'mortarboard':    // 学士方帽 + 流苏
        ctx.fillStyle = OUT; rr(ctx, hx - 9, top - 8, 19, 8, 1);
        ctx.fillStyle = '#26262e'; rr(ctx, hx - 8, top - 7, 17, 6, 1);
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 21, top - 8); ctx.lineTo(hx, top - 17);
        ctx.lineTo(hx + 21, top - 8); ctx.lineTo(hx, top - 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath();
        ctx.moveTo(hx - 18, top - 8); ctx.lineTo(hx, top - 15);
        ctx.lineTo(hx + 18, top - 8); ctx.lineTo(hx, top - 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = sp.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx, top - 9); ctx.lineTo(hx + 15, top - 4);
        ctx.lineTo(hx + 15, top + 8); ctx.stroke();
        ctx.fillStyle = sp.accent;
        ctx.beginPath(); ctx.arc(hx + 15, top + 10, 3.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'beret':          // 贝雷帽（画家式）
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 5, 17, 8, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sp.coat[2];
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 5, 15, 6.4, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sp.accent;
        ctx.beginPath(); ctx.arc(hx + 3, top - 12, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'hood':           // 兜帽
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 17, top + 4); ctx.lineTo(hx - 15, top - 10);
        ctx.lineTo(hx + 1, top - 20); ctx.lineTo(hx + 18, top - 8);
        ctx.lineTo(hx + 16, top + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[0];
        ctx.beginPath();
        ctx.moveTo(hx - 14, top + 2); ctx.lineTo(hx - 13, top - 9);
        ctx.lineTo(hx + 1, top - 17); ctx.lineTo(hx + 15, top - 7);
        ctx.lineTo(hx + 13, top + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath();
        ctx.moveTo(hx - 14, top + 2); ctx.lineTo(hx - 8, top + 2);
        ctx.lineTo(hx - 9, top - 10); ctx.lineTo(hx - 13, top - 8); ctx.closePath(); ctx.fill();
        break;
      case 'wreath':         // 桂冠（古典 / 受封）
        ctx.strokeStyle = '#6f9a4a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(hx + 1, top + 12, 15, -Math.PI * 0.95, -Math.PI * 0.05); ctx.stroke();
        ctx.fillStyle = '#8fbf5f';
        for (var wi = 0; wi < 7; wi++) {
          var wa = -Math.PI * 0.92 + wi * (Math.PI * 0.84 / 6);
          ctx.beginPath();
          ctx.ellipse(hx + 1 + Math.cos(wa) * 15, top + 12 + Math.sin(wa) * 15, 4, 2.4, wa, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = sp.accent;
        ctx.beginPath(); ctx.arc(hx + 1, top + 1, 3.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'straw':          // 草帽（田园）
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 1, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8bc7a';
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 2, 22, 4.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = OUT; rr(ctx, hx - 11, top - 14, 24, 13, 4);
        ctx.fillStyle = '#e8cf94'; rr(ctx, hx - 9, top - 13, 20, 11, 3);
        ctx.fillStyle = sp.accent; rr(ctx, hx - 9, top - 6, 20, 4, 1);
        break;
      case 'nightcap':       // 睡帽（垂球）
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 14, top + 2); ctx.lineTo(hx - 4, top - 18);
        ctx.lineTo(hx + 14, top - 12); ctx.lineTo(hx + 15, top + 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[2];
        ctx.beginPath();
        ctx.moveTo(hx - 12, top + 1); ctx.lineTo(hx - 3, top - 15);
        ctx.lineTo(hx + 12, top - 10); ctx.lineTo(hx + 13, top + 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.shirt[0]; rr(ctx, hx - 13, top - 1, 28, 4, 2);
        ctx.fillStyle = sp.accent;
        ctx.beginPath(); ctx.arc(hx + 19, top + 3, 4.4, 0, Math.PI * 2); ctx.fill();
        break;
      // ---------- v6.0 新增 2 种 ----------
      case 'bowler':         // 圆顶硬礼帽（19 世纪末英国绅士）
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 1, 21, 5.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 2, 19, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 13, top - 2);
        ctx.quadraticCurveTo(hx - 13, top - 20, hx + 1, top - 20);
        ctx.quadraticCurveTo(hx + 15, top - 20, hx + 15, top - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[0];
        ctx.beginPath();
        ctx.moveTo(hx - 11, top - 3);
        ctx.quadraticCurveTo(hx - 11, top - 18, hx + 1, top - 18);
        ctx.quadraticCurveTo(hx + 13, top - 18, hx + 13, top - 3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[2]; rr(ctx, hx - 11, top - 7, 24, 4, 2);
        break;
      case 'widebrim':       // 宽檐软帽（浪漫主义 / 波希米亚）
        ctx.fillStyle = OUT;
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 1, 27, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sp.coat[1];
        ctx.beginPath(); ctx.ellipse(hx + 1, top - 2, 25, 5.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = OUT;
        ctx.beginPath();
        ctx.moveTo(hx - 12, top - 3);
        ctx.quadraticCurveTo(hx - 10, top - 21, hx + 1, top - 21);
        ctx.quadraticCurveTo(hx + 12, top - 21, hx + 13, top - 3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.coat[0];
        ctx.beginPath();
        ctx.moveTo(hx - 10, top - 4);
        ctx.quadraticCurveTo(hx - 8, top - 19, hx + 1, top - 19);
        ctx.quadraticCurveTo(hx + 10, top - 19, hx + 11, top - 4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sp.accent; rr(ctx, hx - 10, top - 9, 22, 4, 2);
        break;
    }
  }

  // ---------- 组合 ----------
  function drawPose(ctx, p, sp) {
    var sq = p.sq == null ? 1 : p.sq;
    var vs = (sp.height || 1) * sq;
    var st = sp.stoop || 0;                       // v5.1：0 挺拔 / 1 微驼 / 2 明显驼背
    var hipY = -42 * vs;
    var shY = -78 * vs + st * 2.2;
    var lean = (p.lean || 0) + st * 2.4;

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(lean * 0.55, 0);
    ctx.rotate(lean * Math.PI / 420);

    // 披风画在身体之后（露出身后的布面），其余挂件画在躯干之上
    if (sp.cape) drawOverlay(ctx, hipY, shY, p, sp, 'back');
    // 后腿（暗）
    drawLeg(ctx, -5, hipY, p.thighB, 24 * vs, p.shinB, 22 * vs, sp.pants[1]);
    // 后臂：格挡等姿势要求双臂都在身前时，推迟到躯干之后绘制
    if (!p.bothFront) drawArm(ctx, -10, shY + 4, p.upperB, p.foreB, sp.coat[1], sp.skin[1], sp, p, false);
    // 前腿
    drawLeg(ctx, 5, hipY, p.thighF, 24 * vs, p.shinF, 22 * vs, sp.pants[0]);
    // 躯干
    drawTorso(ctx, hipY, shY, p, sp);
    drawOverlay(ctx, hipY, shY, p, sp, 'front');
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
    // v6.0：缓存的键要覆盖所有影响剪影的字段。ruff 是 v6.0 新增的挂件，
    // 目前只有伯德一个人用、键不会撞车，但漏掉它属于"迟早出事"的写法，先补上。
    var k = sp.coat[0] + '|' + sp.hair + '|' + sp.coatStyle + '|' + (sp.ruff ? 1 : 0);
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
        hat: sp.hat,
        cape: sp.cape,
        scarf: sp.scarf,
        sash: sp.sash,
        cross: sp.cross,
        ruff: sp.ruff,
        stoop: sp.stoop,
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
    frameName: frameName,
    // v6.0：把发型表也导出去。tools/looksheet.html 需要按数据列出全部发型，
    // 而在此之前它只能拿到 undefined（"0 种发型"），整节都是空的。
    HAIR_STYLES: HAIR_STYLES
  };
})(window);

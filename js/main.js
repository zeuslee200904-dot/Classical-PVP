/* ============================================================
   main.js — 引导与主循环（固定 60Hz 逻辑 + 低帧率动画观感）
   ============================================================ */
(function (global) {
  'use strict';

  function boot() {
    var canvas = document.getElementById('screen');
    if (!canvas) return;

    var game = new global.GameClass(canvas);
    game.bindInput();
    game.refreshHelpBar();     // 依当前键位方案刷新页面说明栏
    global.GAME = game;

    // 首次按键手势里启动音频上下文
    var audioBooted = false;
    function bootAudio() {
      if (audioBooted) return;
      audioBooted = true;
      global.Chiptune.resume();
      global.Chiptune.sfx('select');
    }
    window.addEventListener('keydown', bootAudio, { once: false });
    window.addEventListener('mousedown', bootAudio);

    var STEP = 1000 / 60;
    var last = performance.now();
    var acc = 0;
    var MAX_STEPS = 5;

    function frame(now) {
      var dt = now - last;
      last = now;
      if (dt > 250) dt = STEP;      // 切回标签页时不要追帧
      acc += dt;
      var steps = 0;
      while (acc >= STEP && steps < MAX_STEPS) {
        game.update();
        acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS) acc = 0;
      game.draw();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // 焦点回到页面时恢复音乐
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        global.Chiptune.resume();
        if (game.state === 'fight' || game.state === 'vs' || game.state === 'select') {
          if (!global.Chiptune.playing) game.nextTrack();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);

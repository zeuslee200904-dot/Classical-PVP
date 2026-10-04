/* ============================================================
   tools/screens.mjs — 遍历所有界面并截图（CDP）
   用法: node screens.mjs <edgePath> <pageUrl> <outDir>
   ============================================================ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const [edgePath, pageUrl, outDir] = process.argv.slice(2);
const PORT = 9355;
mkdirSync(outDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(p) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); if (r.ok) return await r.json(); } catch { }
    await sleep(250);
  }
  throw new Error('devtools unreachable');
}

const child = spawn(edgePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-features=NetworkServiceSandbox',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*',
  '--user-data-dir=' + outDir + '\\cdp-screens', '--window-size=1000,620', '--hide-scrollbars',
  pageUrl
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const errs = [];

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)); } }, 20000);
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
}
async function shoot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${outDir}\\${name}.png`, Buffer.from(r.data, 'base64'));
}
/** 冻结 AI，让确定性场景可复现 */
async function freezeAI() {
  await ev('window.GAME.ai.update = function(){}; 1');
}
async function restoreAI() {
  await ev('window.GAME.ai.update = window.__AI0 || window.GAME.ai.update; 1');
}

try {
  const targets = await getJson('/json/list');
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('ws error')), { once: true });
  });
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 560, deviceScaleFactor: 1, mobile: false });

  for (let i = 0; i < 40; i++) {
    if (await ev('typeof window.__STEP') === 'function') break;
    await sleep(250);
  }

  // 保存真正的 AI 实现；后面每个「冻结 AI 拍确定性画面」的场景都从这里恢复
  await ev('window.__AI0 = window.GAME.ai.update; typeof window.__AI0');

  // 1. 标题
  await ev('window.__STEP(20)');
  await shoot('s1-title');

  // 2. 选人（75 位，三页）
  await ev(`
    (function(){ var G=window.GAME;
      G.state='select'; G.t=0; G.uiIndex=26; G.selSlots=[25,26,27]; G.selFocus=2; return G.state; })()
  `);
  await ev('window.__STEP(6)');
  await shoot('s2-select-p2');
  await ev('(function(){window.GAME.uiIndex=20; return 1;})()');
  await ev('window.__STEP(4)');
  await shoot('s2b-select-p1');
  // v5.0：第 3 页（第 51~75 位新角色）
  const p3 = await ev(`
    (function(){ var G=window.GAME;
      G.uiIndex=51; G.selSlots=[50,51,52]; G.selFocus=2;
      window.__STEP(5);
      return {page:G.selPage()+1, pages:G.selPageCount(), total:window.COMPOSERS.length,
              focus:G.uiIndex, name:window.COMPOSERS[G.uiIndex].name,
              bond:window.regionBondText()}; })()
  `);
  console.log('select p3@', JSON.stringify(p3));
  await shoot('s2d-select-p3');

  // 2b. 设置界面（O 键）— v5.0 有「静音 / 对战音效 / 返回」三行
  const st = await ev(`
    (function(){ var G=window.GAME;
      G.settingsIndex=1;                       // 光标停在「对战音效」
      G.openSettings(); G.settingsIndex=1;
      window.__STEP(6);
      return {state:G.state, index:G.settingsIndex, muted:G.settings.muted,
              sfx:G.settings.sfx, engine:window.Chiptune.sfxEnabled()}; })()
  `);
  console.log('settings@', JSON.stringify(st));
  await shoot('s2c-settings');
  // 真按一次方向键：确认开关真的驱动了音频引擎
  const st2 = await ev(`
    (function(){ var G=window.GAME;
      var engBefore = window.Chiptune.sfxEnabled();
      G.input.right = true; G.wasDown = {}; G.wasDownPrev = {};
      G.updateSettings();
      G.input.right = false;
      window.__STEP(3);
      return {engBefore:engBefore, engAfter:window.Chiptune.sfxEnabled(),
              ui:G.settings.sfx, index:G.settingsIndex}; })()
  `);
  console.log('sfx toggle@', JSON.stringify(st2));
  await shoot('s2c2-settings-sfx-off');
  await ev(`
    (function(){ var G=window.GAME;
      G.input.right = true; G.wasDown = {}; G.wasDownPrev = {};
      G.updateSettings(); G.input.right = false;
      G.closeSettings();
      return window.Chiptune.sfxEnabled(); })()
  `);
  await ev('window.__STEP(4)');

  // 3. VS
  await ev('(function(){var G=window.GAME; G.selSlots=[25,26,27]; G.startMatch(); return G.state;})()');
  await ev('window.__STEP(70)');
  await shoot('s3-vs');

  // 4. 开战倒计时
  await ev('window.__STEP(40)');
  console.log('state after vs:', await ev('window.GAME.state + "/" + window.GAME.phase'));

  // 5. 新体系一：乐章（柴可夫斯基「天鹅湖」）
  const f1 = await ev(`
    (function(){ var G=window.GAME;
      G.phase='play'; G.roundTime=50*60;
      G.left.x=380; G.right.x=520;
      G.useSkill(G.left, G.right, 0);
      window.__STEP(18);
      return {name:G.left.c.name, skill:G.left.c.skills[0].name, mv:G.movements.length,
              stage:G.movements[0] ? G.movements[0].idx : -1, st:G.left.state}; })()
  `);
  console.log('movement@', JSON.stringify(f1));
  await shoot('s5-movement');

  // 6. 新体系二：回旋（H.普赛尔「狄多与埃涅阿斯」）
  const f2 = await ev(`
    (function(){ var G=window.GAME;
      G.left.c = window.COMPOSER_BY_ID.purcell;
      G.left.cd=[0,0,0]; G.left.hp=G.left.maxHp=G.left.c.maxHp;
      G.left.x=280; G.right.x=640;
      G.useSkill(G.left, G.right, 0);
      window.__STEP(24);
      var p=G.projectiles[0];
      return {skill:'狄多与埃涅阿斯', proj:G.projectiles.length, returning:p?p.returning:null,
              x:p?Math.round(p.x):0, st:G.left.state}; })()
  `);
  console.log('rondo@', JSON.stringify(f2));
  await shoot('s6-rondo-out');
  const f3 = await ev(`
    (function(){ var G=window.GAME;
      window.__STEP(46);
      var p=G.projectiles[0];
      return {returning:p?p.returning:null, x:p?Math.round(p.x):0}; })()
  `);
  console.log('rondo back@', JSON.stringify(f3));
  await shoot('s7-rondo-back');

  // 7. 新体系三：卡农（拉莫「和声论」）
  const f4 = await ev(`
    (function(){ var G=window.GAME;
      G.left.c = window.COMPOSER_BY_ID.rameau;
      G.left.cd=[0,0,0]; G.left.hp=G.left.maxHp=G.left.c.maxHp;
      G.left.x=380; G.right.x=470; G.right.hp=G.right.maxHp;
      G.useSkill(G.left, G.right, 0);
      window.__STEP(10);
      G.hitTarget(G.left, G.right, {damage:22, stun:10, knock:2, basic:true}, null);
      window.__STEP(4);
      return {skill:'和声论', canon:!!G.left.canon, queue:G.canonQueue.length, st:G.left.state}; })()
  `);
  console.log('canon@', JSON.stringify(f4));
  await shoot('s8-canon');
  const f5 = await ev(`
    (function(){ var G=window.GAME;
      window.__STEP(22);
      return {echoes:G.echoes.length, queue:G.canonQueue.length, hp:Math.round(G.right.hp)}; })()
  `);
  console.log('canon echo@', JSON.stringify(f5));
  await shoot('s9-canon-echo');

  // 8. 格挡（按住 S）：显示戒备动画 + 护盾
  const g1 = await ev(`
    (function(){ var G=window.GAME;
      G.left.dead = false; G.left.stun = 0; G.left.hp = 400;
      window.__HOLD('block', 40);
      window.__STEP(6);
      var before = G.left.hp, immune = 0, cut = 0;
      for (var i=0;i<8;i++) {
        var h0 = G.left.hp;
        G.hitTarget(G.right, G.left, {damage:12, basic:true, stun:12, knock:2}, null);
        if (G.left.hp === h0) immune++;
        var h1 = G.left.hp;
        G.hitTarget(G.right, G.left, {damage:20, stun:16, knock:4}, null);
        if (G.left.hp === h1) cut++; else cut += (G.left.hp - h1) < 20 ? 1 : 0;
      }
      window.__STEP(1);
      return {blocking:G.left.blocking, st:G.left.state, guardHit:G.left.guardHit,
              basicImmune:immune, skillReduced:cut, took:before-G.left.hp}; })()
  `);
  console.log('guard@', JSON.stringify(g1));
  await shoot('s8-guard');

  // 9. 羁绊免疫（黄色共鸣触发）
  const b1 = await ev(`
    (function(){ var G=window.GAME;
      G.left.dead = false; G.left.state = 'idle'; G.left.stun = 0;
      G.left.hp = Math.max(G.left.hp, 120);
      G.left.bondRegion = G.left.bondRegion || '法派';
      G.left.bondTimer = 1;
      window.__STEP(5);
      var before = G.left.hp;
      G.hitTarget(G.right, G.left, {damage:99, stun:10, knock:2}, null);
      return {bondShield:G.left.bondShield, invuln:G.left.invuln, region:G.left.bondRegion,
              immune: G.left.hp === before}; })()
  `);
  console.log('bond@', JSON.stringify(b1));
  await shoot('s9-bond');

  // 9.5 v4.2：跳跃最高点躲开投掷技（贝多芬 Q）
  await freezeAI();
  const j1 = await ev(`
    (function(){ var G=window.GAME;
      G.nextRound();                      // 干净回合
      G.banner = null;
      G.left.c = window.COMPOSER_BY_ID.beethoven;
      G.left.dead=false; G.left.stun=0; G.left.invuln=0; G.left.hp=G.left.maxHp=G.left.c.maxHp;
      G.left.cd=[0,0,0];
      G.left.x=300; G.right.x=620; G.right.dead=false; G.right.stun=0; G.right.invuln=0;
      G.right.hp=G.right.maxHp; G.right.blocking=false; G.right.bondRegion=null; G.right.bondTimer=1e9;
      G.phase='play'; G.playT=200;
      G.useSkill(G.left, G.right, 0);
      var p=G.projectiles[0];
      G.projectiles = p ? [p] : [];       // 只保留一发，画面干净
      if (p) { p.x = G.right.x - 240; p.delay = 0; }
      window.__STEP(31);                  // 等弹体飞近到刚好要接触
      G.right.vy = -G.right.jumpPower(); G.right.onGround=false;
      G.right.setAnim('jump', true);      // 播放起跳姿势（否则浮空时仍是站立帧）
      window.__STEP(18);                  // 到达最高点（与弹体抵达同一时刻）
      return {proj:G.projectiles.length, rise:Math.round(468-G.right.y),
              apex:Math.round(G.right.jumpApex()), hp:Math.round(G.right.hp),
              dist:Math.round(Math.abs(p.x-G.right.x))}; })()
  `);
  console.log('jump@', JSON.stringify(j1));
  await shoot('s13-jump-apex');
  const j2 = await ev(`
    (function(){ var G=window.GAME;
      var before = G.right.hp;
      window.__STEP(34);                  // 让弹体从身下穿过并飞走
      return {hpBefore:Math.round(before), hpAfter:Math.round(G.right.hp),
              dodged: G.right.hp >= before, proj:G.projectiles.length}; })()
  `);
  console.log('jump result@', JSON.stringify(j2));

  // 9.6 v4.2：回旋体系共鸣的反弹护盾
  const rs = await ev(`
    (function(){ var G=window.GAME;
      G.left.c = window.COMPOSER_BY_ID.purcell;
      G.left.bondSystem = '回旋';
      G.left.hp = Math.max(120, G.left.hp); G.left.dead=false; G.left.stun=0; G.left.invuln=0;
      G.left.rondoShield = 48;
      G.left.x=420; G.right.x=520; G.right.dead=false; G.right.hp=G.right.maxHp;
      G.phase='play';
      window.__STEP(6);                 // 让红色护罩画出来
      G.left.rondoShield = 48;          // 截图瞬间保证护盾仍在
      var before = G.left.hp, foeBefore = G.right.hp;
      G.hitTarget(G.right, G.left, {damage:60, stun:12, knock:3, pierce:true}, null);
      window.__STEP(2);
      return {shield:G.left.rondoShield, selfLost:Math.round(before-G.left.hp),
              foeLost:Math.round(foeBefore-G.right.hp)}; })()
  `);
  console.log('rondo shield@', JSON.stringify(rs));
  await shoot('s14-rondo-reflect');

  // 9.7 v4.2：开局终极技 6 秒初始冷却（HUD 显示 E 不可用）
  const uc = await ev(`
    (function(){ var G=window.GAME;
      G.nextRound();                      // 干净的回合：清空场上残留特效
      G.banner = null;
      G.phase='intro'; G.phaseT=105; G.playT=0;
      G.left.cd=[0,0,0]; G.right.cd=[0,0,0];
      window.__STEP(3);                   // 开打 3 帧，E 仍是 6 秒冷却
      return {phase:G.phase, cd2:Math.round(G.left.cd[2]), secs:Math.ceil(G.left.cd[2]/60),
              playT:G.playT, ultReady:G.left.cd[2]<=0}; })()
  `);
  console.log('ult cd@', JSON.stringify(uc));
  await shoot('s15-ult-opening-cd');

  // 9.8 v5.0：红色「循环」体系共鸣（每 7 秒回复 18% 已损失生命）
  // 直接用 Fighter 构造阵容，避免 startMatch() 切到 VS 画面后 left/right 指向旧对象
  const lp = await ev(`
    (function(){ var G=window.GAME;
      G.banner = null;
      var IDs = [51, 59, 60];                    // 欣德米特 / 科雷利 / 帕赫贝尔，全是「循环」
      G.selSlots = IDs;
      G.playerTeam = IDs.map(function(id,i){ return new window.FighterClass(window.COMPOSERS[id], 'left', i); });
      G.enemyTeam = [0,1,2].map(function(id,i){ return new window.FighterClass(window.COMPOSERS[id], 'right', i); });
      G.playerBonds = G.applyBonds(G.playerTeam);
      G.enemyBonds = G.applyBonds(G.enemyTeam);
      G.roundNo = 3;
      G.phase = 'play'; G.playT = 300;
      G.left = G.playerTeam[0]; G.right = G.enemyTeam[0];
      G.left.x = 360; G.right.x = 580;
      G.left.dead=false; G.left.stun=0; G.left.invuln=0; G.left.cd=[0,0,0];
      G.right.dead=false; G.right.stun=0; G.right.invuln=0;
      G.right.hp = G.right.maxHp; G.right.blocking = false;
      G.right.bondRegion = null; G.right.bondTimer = 1e9;
      G.left.hp = Math.round(G.left.maxHp * 0.45);     // 先掉血，让回血看得见
      var hp0 = G.left.hp;
      G.left.loopTimer = 1;                            // 下一帧就触发
      window.__STEP(2);
      return {name:G.left.c.name, system:G.left.bondSystem, max:G.left.maxHp,
              hpBefore:hp0, hpAfter:Math.round(G.left.hp),
              healed:Math.round(G.left.hp)-hp0,
              timer:Math.round(G.left.loopTimer/60*10)/10,
              bonds:G.playerBonds.system && (G.playerBonds.system.tag+'x'+G.playerBonds.system.count),
              expect:Math.max(1, Math.round((G.left.maxHp-hp0)*0.18))}; })()
  `);
  console.log('loop bond@', JSON.stringify(lp));
  await shoot('s20-loop-bond');

  // 9.9 v5.0：红色「节拍」体系共鸣（普通攻击攻速 +20%）
  const bt = await ev(`
    (function(){ var G=window.GAME;
      var IDs = [62, 63, 64];                    // 泰勒曼 / 塔利斯 / 佩罗坦，全是「节拍」
      G.selSlots = IDs;
      G.playerTeam = IDs.map(function(id,i){ return new window.FighterClass(window.COMPOSERS[id], 'left', i); });
      G.enemyTeam = [0,1,2].map(function(id,i){ return new window.FighterClass(window.COMPOSERS[id], 'right', i); });
      G.playerBonds = G.applyBonds(G.playerTeam);
      G.enemyBonds = G.applyBonds(G.enemyTeam);
      G.roundNo = 3;
      G.phase = 'play'; G.playT = 320;
      G.left = G.playerTeam[0]; G.right = G.enemyTeam[0];
      G.left.x = G.right.x - 70;                       // 贴脸，拳脚能打到
      G.left.dead=false; G.left.stun=0; G.left.invuln=0; G.left.cd=[0,0,0];
      G.left.y = window.GAME_CONST.GROUND; G.left.onGround = true;
      G.right.dead=false; G.right.stun=0; G.right.invuln=0;
      G.right.hp = G.right.maxHp; G.right.blocking = false;
      G.right.bondRegion = null; G.right.bondTimer = 1e9;
      function measure(speed, kind) {
        G.left.basicSpeed = speed;
        G.left.setAnim(kind, true);
        G.left.tickAcc = 0;
        var n = 0;
        while (G.left.state === kind && n < 200) { G.stepFighter(G.left, G.right); n++; }
        return n;
      }
      var punchSlow = measure(1.0, 'punch');
      var punchFast = measure(1.2, 'punch');
      var kickSlow = measure(1.0, 'kick');
      var kickFast = measure(1.2, 'kick');
      // 停在踢腿的中段，好截到出招姿态（踢腿判定帧 7~18）
      G.left.basicSpeed = 1.2;
      G.startBasic(G.left, 'kick');
      window.__STEP(10);
      return {name:G.left.c.name, system:G.left.bondSystem, basicSpeed:G.left.basicSpeed,
              punch: punchSlow + '->' + punchFast, kick: kickSlow + '->' + kickFast,
              punchPct:Math.round((punchSlow/punchFast*100-100)*10)/10,
              kickPct:Math.round((kickSlow/kickFast*100-100)*10)/10,
              bonds:G.playerBonds.system && (G.playerBonds.system.tag+'x'+G.playerBonds.system.count),
              st:G.left.state, tick:G.left.tick}; })()
  `);
  console.log('beat bond@', JSON.stringify(bt));
  await shoot('s21-beat-bond');
  await ev('(function(){ window.GAME.left.basicSpeed = 1; return 1; })()');

  // 10. 回合结束
  await ev(`
    (function(){ var G=window.GAME;
      G.left.bondSystem=null; G.left.rondoShield=0;
      G.left.hp = 1; G.right.hp = 1;
      window.__STEP(90);
      return G.state + '/' + G.phase; })()
  `);
  await shoot('s10-ko');
  await ev('window.__STEP(150)');
  await shoot('s11-roundover');

  // 11. 结算
  await restoreAI();
  const res = await ev(`
    (function(){ var G=window.GAME; var guard=0;
      while (G.state!=='result' && guard++ < 60) {
        if (G.state==='fight' && G.phase==='play') G.left.hp=0;
        window.__STEPFAST(140);
      }
      return G.state + ' rounds=' + G.roundNo + ' guard=' + guard; })()
  `);
  console.log('result:', res);
  await ev('window.__STEP(4)');
  await shoot('s12-result');

  const info = await ev('window.__INFO()');
  console.log('INFO:', JSON.stringify(info));
  if (errs.length) console.log('ERRS:', errs.slice(0, 5).join('\n'));
} catch (e) {
  console.error('ERROR', e.message, errs.slice(0, 5).join(' | '));
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { }
  child.kill();
  await sleep(300);
}

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

  // 1. 标题
  await ev('window.__STEP(20)');
  await shoot('s1-title');

  // 2. 选人（50 位，两页）
  await ev(`
    (function(){ var G=window.GAME;
      G.state='select'; G.t=0; G.uiIndex=26; G.selSlots=[25,26,27]; G.selFocus=2; return G.state; })()
  `);
  await ev('window.__STEP(6)');
  await shoot('s2-select-p2');
  await ev('(function(){window.GAME.uiIndex=20; return 1;})()');
  await ev('window.__STEP(4)');
  await shoot('s2b-select-p1');

  // 2b. 设置界面（O 键）
  await ev('(function(){window.GAME.openSettings(); return window.GAME.state;})()');
  await ev('window.__STEP(6)');
  await shoot('s2c-settings');
  await ev('(function(){var G=window.GAME; G.settingsIndex=0; G.toggleSettingsTest ? 0 : 0; return G.state;})()');
  await ev('(function(){window.GAME.closeSettings(); return window.GAME.state;})()');
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

  // 7. 格挡（按住 S）：显示戒备动画 + 护盾
  const g1 = await ev(`
    (function(){ var G=window.GAME;
      // 先把血量抬高，避免测试过程中被直接打死
      G.left.dead = false; G.left.stun = 0; G.left.hp = 400;
      window.__HOLD('block', 40);
      window.__STEP(6);
      var before = G.left.hp, immune = 0, cut = 0, full = 0;
      for (var i=0;i<8;i++) {
        var h0 = G.left.hp;
        G.hitTarget(G.right, G.left, {damage:12, basic:true, stun:12, knock:2}, null);
        if (G.left.hp === h0) immune++; else full++;
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

  // 8. 羁绊免疫（黄色共鸣触发）
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
  const j1 = await ev(`
    (function(){ var G=window.GAME;
      G.nextRound();                      // 干净回合
      window.__origAI = G.ai.update; G.ai.update = function(){};   // 冻结 AI，让弹道可预测
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
      G.ai.update = window.__origAI || G.ai.update;
      return {hpBefore:Math.round(before), hpAfter:Math.round(G.right.hp),
              dodged: G.right.hp >= before, proj:G.projectiles.length}; })()
  `);
  console.log('jump result@', JSON.stringify(j2));

  // 9.6 v4.2：回旋体系共鸣的反弹护盾
  const rs = await ev(`
    (function(){ var G=window.GAME;
      window.__origAI3 = G.ai.update; G.ai.update = function(){};   // 冻结 AI，避免它先把护盾骗掉
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
      var res = {shield:G.left.rondoShield, selfLost:Math.round(before-G.left.hp),
                 foeLost:Math.round(foeBefore-G.right.hp)};
      G.ai.update = window.__origAI3;
      return res; })()
  `);
  console.log('rondo shield@', JSON.stringify(rs));
  await shoot('s14-rondo-reflect');

  // 9.7 v4.2：开局终极技 6 秒初始冷却（HUD 显示 E 不可用）
  const uc = await ev(`
    (function(){ var G=window.GAME;
      G.nextRound();                      // 干净的回合：清空场上残留特效
      window.__origAI2 = G.ai.update; G.ai.update = function(){};
      G.banner = null;
      G.phase='intro'; G.phaseT=105; G.playT=0;
      G.left.cd=[0,0,0]; G.right.cd=[0,0,0];
      window.__STEP(3);                   // 开打 3 帧，E 仍是 6 秒冷却
      return {phase:G.phase, cd2:Math.round(G.left.cd[2]), secs:Math.ceil(G.left.cd[2]/60),
              playT:G.playT, ultReady:G.left.cd[2]<=0}; })()
  `);
  console.log('ult cd@', JSON.stringify(uc));
  await shoot('s15-ult-opening-cd');
  const uc2 = await ev(`
    (function(){ var G=window.GAME;
      G.ai.update = window.__origAI2 || G.ai.update;
      return {restored: typeof G.ai.update}; })()
  `);
  console.log('ai restored@', JSON.stringify(uc2));

  // 9. 回合结束
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

  // 10. 结算
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

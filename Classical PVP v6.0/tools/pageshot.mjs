/* ============================================================
   tools/pageshot.mjs — 通用页面截图（整页，可超过视口）
   用法: node pageshot.mjs <edgePath> <pageUrl> <outFile> [width height] [waitExpr]
   waitExpr 是页面里的一个表达式，返回 true 时才截图；默认等待 1.5 秒。
   会在导航前注入 window.__perr 收集脚本错误，截图后一并打印。
   ============================================================ */
import { writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';

const [edgePath, pageUrl, outFile, wArg, hArg, waitExpr] = process.argv.slice(2);
const CW = parseInt(wArg || '1620', 10);
const CH = parseInt(hArg || '2420', 10);
const PORT = 9366 + (process.pid % 200);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const profile = outFile + '.profile';

const child = spawn(edgePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-features=NetworkServiceSandbox',
  '--allow-file-access-from-files',
  '--remote-debugging-port=' + PORT,
  '--remote-allow-origins=*',
  '--user-data-dir=' + profile,
  '--window-size=' + CW + ',' + CH,
  '--hide-scrollbars',
  'about:blank'
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const logs = [];

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)); } }, 25000);
  });
}

async function getJson(path) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`); if (r.ok) return await r.json(); } catch { }
    await sleep(250);
  }
  throw new Error('devtools not reachable');
}

async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __error: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
  return r.result && r.result.value;
}

try {
  const targets = await getJson('/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('no page target');
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
      if (m.error) rej(new Error(m.error.message)); else res(m.result);
      return;
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG: ' + m.params.entry.text);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: CW, height: CH, deviceScaleFactor: 1, mobile: false });
  // 导航前注入错误收集器
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__perr=[];window.onerror=function(m,s,l,c){window.__perr.push(m+" @"+(s||"").split("/").pop()+":"+l+":"+c);};'
  });
  await send('Page.navigate', { url: pageUrl });

  const deadline = Date.now() + 20000;
  let ok = false;
  while (Date.now() < deadline) {
    await sleep(300);
    const ready = await ev('document.readyState');
    const v = waitExpr ? await ev(waitExpr) : (ready === 'complete');
    if (v === true) { ok = true; break; }
  }
  await sleep(500);
  const diag = await ev('(function(){var c=document.getElementById("screen");if(!c)return "no#screen";' +
    'var g=c.getContext("2d");var d=g.getImageData(0,0,c.width,c.height).data;var n=0,tot=0;' +
    'for(var i=0;i<d.length;i+=4){tot++;if(d[i]>40||d[i+1]>40||d[i+2]>40)n++;}' +
    'return "canvas "+c.width+"x"+c.height+" 非背景像素 "+n+"/"+tot+" ("+(n/tot*100).toFixed(1)+"%) " +' +
    '"COMPOSERS="+(window.COMPOSERS?window.COMPOSERS.length:"undef")+" ready="+document.readyState;})()');
  console.log('等待条件满足: ' + ok + '   ' + JSON.stringify(diag));
  const errs = await ev('JSON.stringify(window.__perr||[])');
  if (errs && errs !== '[]') console.log('页面错误: ' + errs);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  const buf = Buffer.from(shot.data, 'base64');
  writeFileSync(outFile, buf);
  console.log('已保存 ' + outFile + '  ' + buf.length + ' 字节  ' + CW + '×' + CH);
  if (logs.length) console.log('控制台:\n' + logs.slice(0, 8).join('\n'));
} catch (e) {
  console.error('DRIVER ERROR:', e.message);
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { }
  child.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { }
}

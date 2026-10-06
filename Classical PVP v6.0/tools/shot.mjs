/* ============================================================
   tools/shot.mjs — 打开任意页面并截图（用 CDP，可靠等待渲染）
   用法: node shot.mjs <edgePath> <pageUrl> <outPng> [waitMs]
   ============================================================ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';

const [edgePath, pageUrl, outPng, waitMsArg, wArg, hArg] = process.argv.slice(2);
const waitMs = parseInt(waitMsArg || '1500', 10);
const vw = parseInt(wArg || '1220', 10);
const vh = parseInt(hArg || '800', 10);
const PORT = 9344;
mkdirSync(dirname(outPng), { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (r.ok) return await r.json();
    } catch { }
    await sleep(250);
  }
  throw new Error('devtools unreachable');
}

const child = spawn(edgePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-features=NetworkServiceSandbox',
  '--remote-debugging-port=' + PORT,
  '--remote-allow-origins=*',
  '--user-data-dir=' + dirname(outPng) + '\\cdp-profile2',
  '--window-size=1220,800', '--hide-scrollbars',
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
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)); } }, 15000);
  });
}

try {
  const targets = await getJson('/json/list');
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('ws error')), { once: true });
  });
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: vw, height: vh, deviceScaleFactor: 1, mobile: false
  });
  await sleep(waitMs);
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(outPng, Buffer.from(r.data, 'base64'));
  const t = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
  console.log('OK', outPng, 'title=', t.result?.value, errs.length ? 'ERRS=' + errs.join(' | ') : '');
} catch (e) {
  console.error('ERROR', e.message, errs.join(' | '));
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { }
  child.kill();
  await sleep(300);
}

/* ============================================================
   tools/shoot.mjs — 用 CDP 驱动无头 Edge，按帧步进并截图
   用法: node shoot.mjs <edgePath> <pageUrl> <outDir> [scenarios]
   ============================================================ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const [edgePath, pageUrl, outDir] = process.argv.slice(2);
const PORT = 9333;
mkdirSync(outDir, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (r.ok) return await r.json();
    } catch { /* 还没起来 */ }
    await sleep(250);
  }
  throw new Error('devtools not reachable: ' + path);
}

const child = spawn(edgePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--disable-features=NetworkServiceSandbox',
  '--remote-debugging-port=' + PORT,
  '--remote-allow-origins=*',
  '--user-data-dir=' + outDir + '\\cdp-profile',
  '--window-size=1000,640',
  '--hide-scrollbars',
  pageUrl
], { stdio: 'ignore', detached: false });

let ws;
let msgId = 0;
const pending = new Map();
const logs = [];

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)); }
    }, 20000);
  });
}

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true
  });
  if (r.exceptionDetails) {
    return { __error: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
  }
  return r.result?.value;
}

async function shoot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buf = Buffer.from(r.data, 'base64');
  writeFileSync(`${outDir}\\${name}.png`, buf);
  return buf.length;
}

try {
  const targets = await getJson('/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('no page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', e => rej(new Error('ws error')), { once: true });
  });

  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) rej(new Error(m.error.message));
      else res(m.result);
      return;
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      logs.push('console: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      logs.push('EXC: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    }
    if (m.method === 'Log.entryAdded') {
      logs.push('LOG[' + m.params.entry.level + ']: ' + m.params.entry.text);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 960, height: 560, deviceScaleFactor: 1, mobile: false
  });

  // 等待骨架就绪
  let ready = false;
  for (let i = 0; i < 40; i++) {
    const info = await evaluate('typeof window.__STEP');
    if (info === 'function') { ready = true; break; }
    await sleep(250);
  }
  const probe = await evaluate('document.getElementById("probe").textContent');
  console.log('PROBE:', probe);
  if (!ready) throw new Error('harness not ready');

  const scenarios = [
    { name: '01-title', steps: 30 },
    { name: '02-select', steps: 90 },
    { name: '03-vs', steps: 260 },
    { name: '04-fight-intro', steps: 40 },
    { name: '05-fight-punch', steps: 70 },
    { name: '06-fight-skill', steps: 60 },
    { name: '07-fight-ult', steps: 150 },
    { name: '08-fight-late', steps: 400 }
  ];

  for (const sc of scenarios) {
    const info = await evaluate(`window.__STEP(${sc.steps})`);
    await sleep(120);   // 让渲染帧落盘
    const bytes = await shoot(sc.name);
    console.log(`--- ${sc.name}  (${bytes}B)`, JSON.stringify(info));
  }

  const finalInfo = await evaluate('window.__INFO()');
  console.log('FINAL:', JSON.stringify(finalInfo, null, 1));
  if (logs.length) console.log('LOGS:\n' + logs.slice(0, 30).join('\n'));
} catch (e) {
  console.error('DRIVER ERROR:', e.message);
  if (logs.length) console.error('LOGS:\n' + logs.slice(0, 20).join('\n'));
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { }
  child.kill();
  await sleep(400);
}

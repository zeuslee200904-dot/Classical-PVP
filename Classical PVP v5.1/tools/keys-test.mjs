/* tools/keys-test.mjs — 校验选人光标导航与 S 键格挡绑定 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const [edgePath, pageUrl, outDir] = process.argv.slice(2);
const PORT = 9366;
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
  '--user-data-dir=' + outDir + '\\prof', '--window-size=1000,620', pageUrl
], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
const errs = [];
function send(method, params = {}) {
  const i = ++id;
  ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise((res, rej) => {
    pending.set(i, { res, rej });
    setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('timeout ' + method)); } }, 20000);
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
}

let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };

try {
  const targets = await getJson('/json/list');
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('ws')), { once: true });
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
  for (let i = 0; i < 40; i++) {
    if (await ev('typeof window.__STEP') === 'function') break;
    await sleep(250);
  }

  console.log('== 选人界面 5×5 分页导航（50 位角色）==');
  await ev(`(function(){var G=window.GAME; G.state='select'; G.uiIndex=0; G.selSlots=[null,null,null]; return 1;})()`);
  const tapKey = async (key) => {
    await ev(`(function(){var G=window.GAME; G.input['${key}']=true; G.wasDownPrev['${key}']=false; return 1;})()`);
    await ev('window.GAME.update()');
    await ev(`(function(){var G=window.GAME; G.input['${key}']=false; return 1;})()`);
  };
  const idx = () => ev('window.GAME.uiIndex');
  const setIdx = (n) => ev('window.GAME.uiIndex = ' + n + ';');

  await tapKey('down');
  ck(await idx() === 5, '光标 0 → 下 → 5（5 列）');
  await tapKey('down');
  ck(await idx() === 10, '5 → 下 → 10');
  await tapKey('up');
  ck(await idx() === 5, '10 → 上 → 5');
  await tapKey('right');
  ck(await idx() === 6, '5 → 右 → 6');
  await tapKey('left');
  ck(await idx() === 5, '6 → 左 → 5');

  await setIdx(4);                      // 第 1 页第 0 行最右
  await tapKey('right');
  ck(await idx() === 25, '最右列再按右 → 翻到第 2 页同一行（' + await idx() + '）');
  await tapKey('left');
  ck(await idx() === 4, '第 2 页最左列按左 → 翻回第 1 页最右列（' + await idx() + '）');

  await setIdx(20);                     // 第 1 页最后一行
  await tapKey('down');
  ck(await idx() === 0, '最后一行按下 → 回到本页第一行（' + await idx() + '）');

  await setIdx(0);
  await tapKey('s1');                   // Q 翻页
  ck(await idx() === 25, 'Q 键翻到第 2 页同一列（' + await idx() + '）');
  await tapKey('s1');                   // Q 再翻一页
  ck(await idx() === 50, 'Q 键再翻到第 3 页同一列（' + await idx() + '）');
  // 第 3 页只有 25 位（正好排满 5×5）：从本页第 1 行按 Q 想去的“下一行同一列”
  // 已经越界，于是收敛到本页最后一位（74），不会跑出 75 位之外
  await tapKey('s1');
  ck(await idx() === 74, '本页第 1 行按 Q 收敛到本页最后一位（' + await idx() + '）');
  ck(await idx() <= 74, '光标不会越出最后一位（' + await idx() + '）');
  await tapKey('ult');                  // E 往上翻一行
  ck(await idx() === 69, 'E 键回到上一行同一列（' + await idx() + '）');
  await setIdx(50);
  await tapKey('ult');
  ck(await idx() === 25, '第 3 页第 1 行按 E → 第 2 页同一列（' + await idx() + '）');
  await tapKey('ult');
  ck(await idx() === 0, '第 2 页第 1 行按 E → 第 1 页同一列（' + await idx() + '）');

  // 第 2 页最后一位（第 50 位）可达
  await setIdx(45);
  await tapKey('down');
  ck(await idx() === 25, '第 2 页末行按下回到第 2 页首行（' + await idx() + '）');
  await setIdx(49);
  ck(await idx() === 49 && await ev('window.COMPOSERS[49].name') === '布列兹', '第 50 位（布列兹）可达');

  // v5.0：第 3 页（第 51~75 位）与总人数
  const total = await ev('window.COMPOSERS.length');
  const pages = await ev('window.GAME.selPageCount()');
  ck(total === 75, '角色总数为 75（实际 ' + total + '）');
  ck(pages === 3, '选人界面共 3 页（实际 ' + pages + '）');
  await setIdx(50);
  ck(await ev('window.COMPOSERS[50].name') === '韦伯恩', '第 51 位是韦伯恩');
  await setIdx(74);
  const lastOne = await ev('window.COMPOSERS[74].name');
  ck(await idx() === 74 && lastOne === '吉松隆', '第 75 位（吉松隆）可达');
  // 第 3 页最后一行按下 → 回到本页第一行
  await setIdx(70);
  await tapKey('down');
  ck(await idx() === 50, '第 3 页末行按下回到第 3 页首行（' + await idx() + '）');
  // 第 3 页最右列按右 → 已是最后一位，不应越界到 76
  await setIdx(70);
  await tapKey('right');
  ck(await idx() === 71, '第 3 页中间按右正常右移（' + await idx() + '）');
  await setIdx(74);
  await tapKey('right');
  ck(await idx() <= 74, '在最后一位按右不会越界（' + await idx() + '）');

  console.log('\n== 选人与开战（含 3.0 新角色）==');
  await setIdx(25);
  await ev('window.GAME.selSlots=[null,null,null];');
  await tapKey('punch');
  ck((await ev('JSON.stringify(window.GAME.selSlots)')) === '[25,null,null]', 'A 键选中柴可夫斯基（第 26 位）');
  await tapKey('punch');
  ck((await ev('JSON.stringify(window.GAME.selSlots)')) === '[null,null,null]', '再按 A 取消选中');
  await ev(`(function(){var G=window.GAME; G.selSlots=[25,26,27]; return 1;})()`);
  await tapKey('start');
  const st = await ev('window.GAME.state');
  ck(st === 'vs', 'Enter 开战（state=' + st + '）');
  const bonds = await ev('JSON.stringify({p:window.GAME.playerBonds&&window.GAME.playerBonds.era&&window.GAME.playerBonds.era.tag, n:window.GAME.playerTeam.map(function(f){return f.c.name;})})');
  ck(bonds.includes('前中浪漫主义') && bonds.includes('柴可夫斯基'), '柴可夫斯基+门德尔松+肖邦共鸣前中浪漫主义×3：' + bonds);

  console.log('\n== 键位（v4.0：统一为原键位）==');
  const map = JSON.parse(await ev('JSON.stringify((function(){' +
    'var G=window.GAME; var out={}; ' +
    "['KeyA','KeyD','KeyQ','KeyW','KeyE','KeyS','KeyI','KeyJ','KeyK','KeyL','KeyR','KeyM','KeyP','KeyO','Enter','Space','KeyF','KeyT'].forEach(function(k){" +
    'out[k]=G.keyAction(k); }); return out; })())'));
  console.log('  键位表: ' + JSON.stringify(map));
  ck(map.KeyA === 'punch' && map.KeyD === 'kick', 'A 挥拳 / D 踢腿');
  ck(map.KeyI === 'up' && map.KeyJ === 'left' && map.KeyK === 'down' && map.KeyL === 'right', 'I J K L 方向');
  ck(map.KeyQ === 's1' && map.KeyW === 's2' && map.KeyE === 'ult', 'Q 技能1 / W 技能2 / E 终极技');
  ck(map.KeyS === 'block', 'S 格挡（按住生效）');
  ck(map.KeyR === 'restart' && map.KeyM === 'mute' && map.KeyP === 'clear' && map.KeyO === 'settings',
    'R 重开 / M 静音 / P 返回 / O 设置');
  ck(map.Enter === 'start' && map.Space === 'start', 'Enter / Space 确认开始');
  ck(map.KeyF === null && map.KeyT === null, 'v3.1 的左手方案键位（F / T）已解绑');
  ck(await ev('typeof window.GAME.setScheme') === 'undefined', '已移除键位方案切换接口');
  ck(await ev('window.GAME.settings.scheme === undefined'), '设置中不再保存键位方案');

  console.log('\n== 设置界面（O 键）==');
  await ev(`(function(){var G=window.GAME; G.state='title'; G.t=0; return 1;})()`);
  await tapKey('settings');
  ck(await ev('window.GAME.state') === 'settings', '标题画面按 O 打开设置');
  ck(await ev('window.GAME.settingsFrom') === 'title', '记录来源为标题画面');
  await tapKey('settings');
  ck(await ev('window.GAME.state') === 'title', '再按 O 关闭设置并回到标题画面');
  await ev(`(function(){var G=window.GAME; G.state='select'; G.uiIndex=0; G.selSlots=[null,null,null]; return 1;})()`);
  await tapKey('settings');
  ck(await ev('window.GAME.state') === 'settings', '选人界面按 O 也能打开设置');
  await tapKey('settings');
  ck(await ev('window.GAME.state') === 'select', '关闭后回到选人界面');

  console.log('\n== 选人界面 P 键返回标题 ==');
  await ev(`(function(){var G=window.GAME; G.state='select'; G.selSlots=[1,2,3]; G.uiIndex=5; return 1;})()`);
  await tapKey('clear');
  ck(await ev('window.GAME.state') === 'title', 'P 键从选人界面返回标题画面');
  ck((await ev('JSON.stringify(window.GAME.selSlots)')) === '[null,null,null]', '返回标题时清空已选角色');

  console.log('\n== S 键格挡绑定 ==');
  const blockMap = await ev(`(function(){
    var G = window.GAME;
    G.phase='play';
    window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyS'}));
    var held = !!G.input.block;
    window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyS'}));
    var released = !!G.input.block;
    window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyP'}));
    var pIsBlock = !!G.input.block;
    window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyP'}));
    return JSON.stringify({held:held, released:released, pIsBlock:pIsBlock});
  })()`);
  const bm = JSON.parse(blockMap);
  ck(bm.held === true && bm.released === false, '按下 S 格挡生效，松开后失效');
  ck(bm.pIsBlock === false, 'P 键不再绑定格挡，改为返回标题');

  if (errs.length) { console.log('\n运行期异常：\n' + errs.slice(0, 5).join('\n')); fail++; }
  else console.log('\n无运行期异常');
  console.log(fail ? '\n❌ 共 ' + fail + ' 项未通过' : '\n✅ 键位与导航校验通过');
  process.exitCode = fail ? 1 : 0;
} catch (e) {
  console.error('ERROR', e.message, errs.slice(0, 3).join(' | '));
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { }
  child.kill();
  await sleep(300);
}

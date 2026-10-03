/* ============================================================
   tools/ai-live.mjs — 在真实浏览器里跑完整对局，读取 AI 出招统计
   用法: node ai-live.mjs <edge路径> <autotest.html 的 file:// URL> [队伍...]
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = process.argv[2];
const BASE = process.argv[3];
const TEAMS = process.argv.slice(4);
// AILIVE_HURT=0 → 不注入“每 90 帧扣 16 血”的人造压力，用于观察自然对局节奏
const HURT = process.env.AILIVE_HURT === '0' ? '0' : '1';
const STEPS = parseInt(process.env.AILIVE_STEPS || '3000', 10);
const OUT = mkdtempSync(join(tmpdir(), 'dsh-ailive-'));
let port = 9400;

function run(url) {
  const myPort = ++port;
  return new Promise((resolve, reject) => {
    const child = spawn(EDGE, [
      '--headless=new', '--disable-gpu', '--remote-debugging-port=' + myPort,
      '--user-data-dir=' + join(OUT, 'p' + myPort), '--window-size=1210,700',
      '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', url
    ], { stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill(); reject(new Error('timeout')); }, 420000);
    const poll = async () => {
      for (let i = 0; i < 80; i++) {
        try {
          const r = await fetch('http://127.0.0.1:' + myPort + '/json/list');
          const list = await r.json();
          // 有些情况下列表里会先出现别的页面（about:blank 等），优先挑 autotest 页面
          const page = list.find(x => x.type === 'page' && x.webSocketDebuggerUrl && /autotest/.test(x.url || '')) ||
            list.find(x => x.type === 'page' && x.webSocketDebuggerUrl);
          if (page) {
            const ws = new WebSocket(page.webSocketDebuggerUrl);
            let id = 0; const pending = new Map();
            const send = (method, params) => new Promise(res => {
              const mid = ++id; pending.set(mid, res);
              ws.send(JSON.stringify({ id: mid, method, params }));
            });
            ws.onmessage = ev => {
              const m = JSON.parse(ev.data);
              if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
            };
            ws.onopen = async () => {
              await send('Runtime.enable');
              // 等页面初始化
              let ready = false;
              for (let k = 0; k < 40; k++) {
                const c = await send('Runtime.evaluate', { expression: 'typeof window.__STEP', returnByValue: true });
                if (c && c.result && c.result.value === 'function') { ready = true; break; }
                await new Promise(r => setTimeout(r, 250));
              }
              if (!ready) {
                ws.close(); child.kill(); clearTimeout(timer);
                reject(new Error('页面未完成初始化（__STEP 未就绪，可能是加载脚本失败）'));
                return;
              }
              await send('Runtime.evaluate', { expression: 'window.__STEP(' + STEPS + ')', returnByValue: true });
              const info = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__INFO())', returnByValue: true });
              const errs = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__ERRORS||window.__ERRS||[])', returnByValue: true });
              ws.close(); child.kill(); clearTimeout(timer);
              const infoVal = info && info.result ? info.result.value : null;
              const errVal = errs && errs.result ? errs.result.value : null;
              resolve({
                info: infoVal ? JSON.parse(infoVal) : null,
                errs: errVal ? JSON.parse(errVal) : []
              });
            };
            return;
          }
        } catch (e) { /* 等浏览器 */ }
        await new Promise(r => setTimeout(r, 400));
      }
      clearTimeout(timer); child.kill(); reject(new Error('no debug page'));
    };
    poll();
  });
}

let fail = 0;
const teams = TEAMS.length ? TEAMS : ['0,1,2', '15,16,19', '25,26,27', '35,36,37', '41,42,43'];
for (const tm of teams) {
  const url = BASE + '?auto=1&hurt=' + HURT + '&team=' + tm;
  let r;
  try { r = await run(url); } catch (e) { console.log('阵容 ' + tm + ' 运行失败: ' + e.message); fail++; continue; }
  const o = r.info || {};
  const ai = o.ai || {};
  const pace = o.pace || {};
  const left = (o.playerTeam && o.playerTeam[0]) || '?';
  const right = (o.enemyTeam && o.enemyTeam[0]) || '?';
  console.log('阵容 ' + tm.padEnd(10) + ' 敌方 ' + String(right).padEnd(14) +
    ' 普攻 ' + String(ai.basic).padStart(3) + '（拳 ' + String(ai.punch).padStart(3) +
    ' / 腿 ' + String(ai.kick).padStart(3) + '）命中 ' + String(ai.basicHits).padStart(3) +
    ' | 技能 ' + JSON.stringify(ai.skills) +
    ' | 首个大招 @交战第 ' + ai.ultFirstAt + ' 帧' +
    ' | 我方 ' + left + ' 回合' + (o.round || '?') + ' 状态 ' + o.state);
  const rds = (pace.rounds || []).map(f => (f / 60).toFixed(1) + 's');
  console.log('         每回合交战时长 [' + rds.join(', ') + ']（当前 ' + ((pace.curPlayFrames || 0) / 60).toFixed(1) +
    's）　全场伤害合计 ' + (pace.damage || 0) + ' 点　我方首个大招 @交战第 ' + pace.playerUltFirstAt + ' 帧');
  if (r.errs.length) { console.log('   ❌ 运行期错误: ' + JSON.stringify(r.errs.slice(0, 3))); fail++; }
  if (!ai.basic) { console.log('   ❌ 该局 AI 一次普攻都没有使用'); fail++; }
  // v4.2：终极技开局有 6 秒（360 帧）初始冷却
  if (ai.ultFirstAt >= 0 && ai.ultFirstAt < 360) {
    console.log('   ❌ AI 在开局的 6 秒终极技冷却内就放了大招（交战第 ' + ai.ultFirstAt + ' 帧）'); fail++;
  }
  if (pace.playerUltEarly > 0) {
    console.log('   ❌ 我方在开局的 6 秒冷却内放出了大招（' + pace.playerUltEarly + ' 次）'); fail++;
  }
}
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { }
console.log(fail ? ('\n❌ 共 ' + fail + ' 项异常') : '\n✅ 实机 AI 行为校验通过');
process.exitCode = fail ? 1 : 0;

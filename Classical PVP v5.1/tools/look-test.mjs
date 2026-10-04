/* ============================================================
   tools/look-test.mjs — v5.1 外观可区分度校验
   1) 覆盖性：数据里用到的每个 coatStyle / item / hat / hair / face 取值
      必须在 sprites.js 里有对应绘制分支（旧版 organ / metronome 就是缺分支）
   2) 渲染指纹：用最小 2D 光栅化把角色真正"画"进 32×48 网格，
      再按多帧位图 + 配色直方图计算两两差异，找出最像的角色对
   用法: node look-test.mjs [--sheet]   （--sheet 额外输出 tools/_look.html 供肉眼复核）
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const SPR = read('../js/sprites.js');

// ---------------------------------------------------------
//  最小 2D 光栅化上下文：把 Sprite 的绘制指令落到 32×48 网格
// ---------------------------------------------------------
const GW = 32, GH = 48;                 // 网格
const X0 = -44, X1 = 44;                // 局部坐标范围
const Y0 = -118, Y1 = 8;
function newGrid() { return new Uint8Array(GW * GH); }
function gridIdx(x, y) {
  const cx = Math.floor((x - X0) / (X1 - X0) * GW);
  const cy = Math.floor((y - Y0) / (Y1 - Y0) * GH);
  if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return -1;
  return cy * GW + cx;
}
function stampRect(g, x, y, w, h) {
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  const ax = Math.max(0, Math.floor((x - X0) / (X1 - X0) * GW));
  const bx = Math.min(GW - 1, Math.floor((x + w - X0) / (X1 - X0) * GW));
  const ay = Math.max(0, Math.floor((y - Y0) / (Y1 - Y0) * GH));
  const by = Math.min(GH - 1, Math.floor((y + h - Y0) / (Y1 - Y0) * GH));
  for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) g[cy * GW + cx] = 1;
}
function stampPoly(g, pts) {
  if (pts.length < 3) return;
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const p of pts) {
    if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
  }
  const ax = Math.max(0, Math.floor((minx - X0) / (X1 - X0) * GW));
  const bx = Math.min(GW - 1, Math.ceil((maxx - X0) / (X1 - X0) * GW));
  const ay = Math.max(0, Math.floor((miny - Y0) / (Y1 - Y0) * GH));
  const by = Math.min(GH - 1, Math.ceil((maxy - Y0) / (Y1 - Y0) * GH));
  for (let cy = ay; cy <= by; cy++) {
    const py = Y0 + (cy + 0.5) / GH * (Y1 - Y0);
    for (let cx = ax; cx <= bx; cx++) {
      const px = X0 + (cx + 0.5) / GW * (X1 - X0);
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) g[cy * GW + cx] = 1;
    }
  }
}
function stampThickLine(g, pts, w) {
  const hw = Math.max(1, w / 2);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.ceil(len / 1.5));
    for (let k = 0; k <= n; k++) {
      const t = k / n, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
      stampRect(g, px - hw, py - hw, hw * 2, hw * 2);
    }
  }
}
function circlePts(cx, cy, rx, ry, rot) {
  const out = [];
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2, c = Math.cos(a) * rx, s = Math.sin(a) * ry;
    const rc = Math.cos(rot || 0), rs = Math.sin(rot || 0);
    out.push([cx + c * rc - s * rs, cy + c * rs + s * rc]);
  }
  return out;
}

function makeCtx(grid, colors) {
  let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const stack = [];
  let path = [];
  const tf = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const tp = (p) => path.map(q => tf(q[0], q[1]));
  const ctx = {
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt',
    globalAlpha: 1, font: '', textAlign: 'left', globalCompositeOperation: 'source-over',
    set fillStyle_(v) { }, get fillStyle_() { },
    save() { stack.push(Object.assign({}, m)); },
    restore() { if (stack.length) m = stack.pop(); },
    translate(x, y) { m = { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e + m.a * x + m.c * y, f: m.f + m.b * x + m.d * y }; },
    scale(x, y) { m = { a: m.a * x, b: m.b * x, c: m.c * y, d: m.d * y, e: m.e, f: m.f }; },
    rotate(r) {
      const cs = Math.cos(r), sn = Math.sin(r);
      m = { a: m.a * cs + m.c * sn, b: m.b * cs + m.d * sn, c: m.c * cs - m.a * sn, d: m.d * cs - m.b * sn, e: m.e, f: m.f };
    },
    beginPath() { path = []; },
    closePath() { if (path.length) path.push(path[0].slice()); },
    moveTo(x, y) { path.push([x, y]); },
    lineTo(x, y) { path.push([x, y]); },
    quadraticCurveTo(cx, cy, x, y) { path.push([cx, cy], [x, y]); },
    bezierCurveTo(a, b, c, d, x, y) { path.push([a, b], [c, d], [x, y]); },
    arcTo(x1, y1, x2, y2) { path.push([x1, y1], [x2, y2]); },
    rect(x, y, w, h) { const p = tf(x, y); path.push([x, y], [x + w, y], [x + w, y + h], [x, y + h]); },
    arc(cx, cy, r, a0, a1) { path.push(...circlePts(cx, cy, r, r, 0)); },
    ellipse(cx, cy, rx, ry, rot) { path.push(...circlePts(cx, cy, rx, ry, rot)); },
    fill() {
      const pts = tp(path);
      if (pts.length >= 3) stampPoly(grid, pts);
      const c = String(ctx.fillStyle);
      const k = c.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
      if (k.length === 6) colors[k] = (colors[k] || 0) + 1;
    },
    stroke() {
      const pts = tp(path);
      if (pts.length >= 2) stampThickLine(grid, pts, (ctx.lineWidth || 1) * Math.abs(m.a));
      const c = String(ctx.strokeStyle);
      const k = c.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
      if (k.length === 6) colors[k] = (colors[k] || 0) + 1;
    },
    fillRect(x, y, w, h) {
      const p1 = tf(x, y), p2 = tf(x + w, y + h);
      stampRect(grid, Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1]));
      const c = String(ctx.fillStyle);
      const k = c.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
      if (k.length === 6) colors[k] = (colors[k] || 0) + 1;
    },
    strokeRect() { }, clearRect() { }, fillText() { }, strokeText() { }, measureText() { return { width: 8 }; },
    clip() { }, setLineDash() { }, createLinearGradient() { return { addColorStop() { } }; },
    createRadialGradient() { return { addColorStop() { } }; },
    drawImage() { }, putImageData() { }, getImageData() { return { data: [] }; }
  };
  return ctx;
}

// ---------------------------------------------------------
//  载入
// ---------------------------------------------------------
const win = {};
win.window = win;
const ctxV = vm.createContext({ window: win, console, Math, Object, Array, JSON, String, Number, Uint8Array, Infinity, isNaN });
vm.runInContext(read('../js/characters.js'), ctxV, { filename: 'characters.js' });
vm.runInContext(SPR, ctxV, { filename: 'sprites.js' });
const C = win.COMPOSERS, Sprites = win.Sprites;

let fail = 0;
const ck = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail++; };
const warn = (msg) => console.log('  ! ' + msg);

// ---------------------------------------------------------
//  1. 覆盖性：数据取值必须有绘制分支
// ---------------------------------------------------------
console.log('== 1. 数据 → 绘制分支 覆盖性 ==');
function casesIn(fnName) {
  const at = SPR.indexOf('function ' + fnName);
  if (at < 0) return [];
  // 函数体：从 { 起配对到同名缩进收尾
  let i = SPR.indexOf('{', at), depth = 0, end = i;
  for (; end < SPR.length; end++) {
    if (SPR[end] === '{') depth++;
    else if (SPR[end] === '}') { depth--; if (depth === 0) break; }
  }
  return [...SPR.slice(i, end).matchAll(/case '([a-zA-Z]+)'/g)].map(m => m[1]);
}
const HAIR_KEYS = (() => {
  const at = SPR.indexOf('var HAIR_STYLES = {');
  const end = SPR.indexOf('\n  };', at);
  return [...SPR.slice(at, end).matchAll(/^    ([a-zA-Z]+):/gm)].map(m => m[1]);
})();
const FACE_KEYS = (() => {
  const at = SPR.indexOf('var FACE_SHAPES = {');
  const end = SPR.indexOf('\n  };', at);
  return [...SPR.slice(at, end).matchAll(/([a-zA-Z]+):\s*\{/g)].map(m => m[1]);
})();
const ITEM_CASES = casesIn('drawItem');
const HAT_CASES = casesIn('drawHat');
const EYE_CASES = casesIn('drawEyes'), BROW_CASES = casesIn('drawBrows');
const NOSE_CASES = casesIn('drawNose'), MOUTH_CASES = casesIn('drawMouth');
const STYLE_CASES = [...SPR.matchAll(/style === '([a-zA-Z]+)'/g)].map(m => m[1]);

const used = { coatStyle: new Set(), item: new Set(), hat: new Set(), hair: new Set(), shape: new Set(), eyes: new Set(), brows: new Set(), nose: new Set(), mouth: new Set(), cheeks: new Set() };
for (const c of C) {
  const s = c.sprite, f = s.face || {};
  used.coatStyle.add(s.coatStyle); used.item.add(s.item); if (s.hat) used.hat.add(s.hat); used.hair.add(s.hair);
  used.shape.add(f.shape); used.eyes.add(f.eyes); used.brows.add(f.brows);
  used.nose.add(f.nose); used.mouth.add(f.mouth); used.cheeks.add(f.cheeks);
}
// 每个字段的"默认分支"取值（走 default / else，属正常）
const DEFAULTS = {
  coatStyle: ['frock', 'tailed'], eyes: ['plain'], brows: ['thin'],
  nose: ['small'], mouth: ['line'], cheeks: ['full', 'plain'], hair: [], item: ['organ'], hat: []
};
const check = (field, have, label) => {
  const missing = [...used[field]].filter(v => v && have.indexOf(v) < 0 && (DEFAULTS[field] || []).indexOf(v) < 0);
  ck(missing.length === 0, label + '：' + used[field].size + ' 种取值全部有绘制分支' + (missing.length ? '（缺 ' + missing.join(',') + '）' : ''));
};
check('coatStyle', STYLE_CASES, 'coatStyle');
check('item', ITEM_CASES.concat(['organ', 'baton']), 'item');
check('hat', HAT_CASES, 'hat');
check('hair', HAIR_KEYS, 'hair');
check('shape', FACE_KEYS, 'face.shape');
check('eyes', EYE_CASES, 'face.eyes');
check('brows', BROW_CASES, 'face.brows');
check('nose', NOSE_CASES, 'face.nose');
check('mouth', MOUTH_CASES, 'face.mouth');
// cheeks 是 if/else 链（plain 走"什么都不画"的隐式默认）
{
  const missing = [...used.cheeks].filter(v => v && v !== 'plain' && SPR.indexOf("f.cheeks === '" + v + "'") < 0);
  ck(missing.length === 0, 'face.cheeks：' + used.cheeks.size + ' 种取值全部有绘制分支' + (missing.length ? '（缺 ' + missing.join(',') + '）' : ''));
}
// 反向：sprites.js 里实现了但没人用的取值（提示，不判失败）
for (const [field, have] of [['item', ITEM_CASES], ['hat', HAT_CASES], ['hair', HAIR_KEYS]]) {
  const unused = have.filter(v => !used[field].has(v));
  if (unused.length) warn(field + ' 有未使用的实现分支: ' + unused.join(' '));
}

// ---------------------------------------------------------
//  2. 渲染指纹（多帧位图 + 配色直方图）
// ---------------------------------------------------------
console.log('\n== 2. 渲染指纹差异（32×48 网格，3 个关键姿势）==');
const FRAMES = [['idle', 0], ['walk', 8], ['punch', 6]];
function fingerprint(composer) {
  const grid = newGrid(), colors = {};
  for (const [state, tick] of FRAMES) {
    const ctx = makeCtx(grid, colors);
    // 在 (0,0) 处绘制：局部坐标即网格坐标
    Sprites.draw(ctx, { composer, state, tick, facing: 'right', scale: 1 }, 0, 0);
  }
  return { grid, colors };
}
const fps = C.map(c => fingerprint(c));
const ink = fps.map(f => f.grid.reduce((a, b) => a + b, 0));
console.log('  轮廓覆盖率: min=' + Math.min(...ink) + ' max=' + Math.max(...ink) +
  ' 平均=' + (ink.reduce((a, b) => a + b, 0) / ink.length).toFixed(0) + ' / ' + (GW * GH) + ' 格');
{
  const tooThin = C.filter((c, i) => ink[i] < 120);
  ck(tooThin.length === 0, '所有角色都能画出足够面积的轮廓' + (tooThin.length ? '（异常: ' + tooThin.map(c => c.name).join(' ') + '）' : ''));
  const tooFull = C.filter((c, i) => ink[i] > GW * GH * 0.92);
  ck(tooFull.length === 0, '没有角色的轮廓溢出网格' + (tooFull.length ? '（异常: ' + tooFull.map(c => c.name).join(' ') + '）' : ''));
}
function histVec(colors) {
  const v = new Float64Array(16 * 16 * 16);
  let tot = 0;
  for (const k in colors) {
    const r = parseInt(k.slice(0, 2), 16) >> 4, g = parseInt(k.slice(2, 4), 16) >> 4, b = parseInt(k.slice(4, 6), 16) >> 4;
    v[(r * 16 + g) * 16 + b] += colors[k]; tot += colors[k];
  }
  if (tot) for (let i = 0; i < v.length; i++) v[i] /= tot;
  return v;
}
const hists = fps.map(f => histVec(f.colors));
function pairDist(i, j) {
  const a = fps[i].grid, b = fps[j].grid;
  let diff = 0;
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) diff++;
  const shape = diff / a.length;
  const ha = hists[i], hb = hists[j];
  let dot = 0, na = 0, nb = 0;
  for (let k = 0; k < ha.length; k++) { dot += ha[k] * hb[k]; na += ha[k] * ha[k]; nb += hb[k] * hb[k]; }
  const cos = (na && nb) ? dot / Math.sqrt(na * nb) : 0;
  return { total: shape * 0.62 + (1 - cos) * 0.38, shape: shape, color: 1 - cos };
}
const pairs = [];
for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
  const d = pairDist(i, j);
  pairs.push({ i, j, a: C[i].name, b: C[j].name, ...d });
}
pairs.sort((x, y) => x.total - y.total);
const ds = pairs.map(p => p.total);
console.log('  两两差异: 最小=' + ds[0].toFixed(3) + ' 中位=' + ds[Math.floor(ds.length / 2)].toFixed(3) + ' 最大=' + ds[ds.length - 1].toFixed(3));
console.log('  最像的 12 对:');
for (const p of pairs.slice(0, 12)) {
  console.log('     ' + (p.a + ' / ' + p.b).padEnd(30) + ' 总差=' + p.total.toFixed(3) +
    '（轮廓' + p.shape.toFixed(3) + ' 配色' + p.color.toFixed(3) + '）');
}
const near = pairs.filter(p => p.total < 0.06);
ck(near.length === 0, '没有"几乎一样"的角色对（总差 < 0.06）' + (near.length ? '：' + near.map(p => p.a + '/' + p.b).join(' ') : ''));
const nearish = pairs.filter(p => p.total < 0.10);
console.log('  总差 < 0.10 的对数 = ' + nearish.length + ' / ' + pairs.length + '（' + (nearish.length / pairs.length * 100).toFixed(1) + '%）');

// ---------------------------------------------------------
//  3. 配色唯一性
// ---------------------------------------------------------
console.log('\n== 3. 配色唯一性 ==');
const dupOf = (get) => {
  const m = new Map();
  for (const c of C) { const v = get(c.sprite) || '-'; if (!m.has(v)) m.set(v, []); m.get(v).push(c.name); }
  return [...m.entries()].filter(([, v]) => v.length > 1);
};
for (const [label, get] of [
  ['外套主色 coat[0]', s => s.coat[0]], ['配饰色 accent', s => s.accent],
  ['裤色 pants[0]', s => s.pants[0]]]) {
  const d = dupOf(get);
  ck(d.length === 0, label + ' 75 人各不同' + (d.length ? '（重复: ' + d.map(([k, v]) => k + '→' + v.join('/')).join('  ') + '）' : ''));
}
// 发色：真实历史上同色很正常，只要求不出现大簇，且「发型+发色」组合唯一
{
  const d = dupOf(s => s.hairColor).sort((a, b) => b[1].length - a[1].length);
  const big = d.filter(([, v]) => v.length > 4);
  ck(big.length === 0, '发色没有超过 4 人共用的色值' + (big.length ? '（' + big.map(([k, v]) => k + '×' + v.length).join(' ') + '）' : ''));
  console.log('    （发色共 ' + (75 - d.reduce((a, [, v]) => a + v.length - 1, 0)) + ' 种，最大簇 ' + (d.length ? d[0][1].length : 1) + ' 人）');
  const pair = new Map();
  for (const c of C) { const k = c.sprite.hair + '|' + c.sprite.hairColor; if (!pair.has(k)) pair.set(k, []); pair.get(k).push(c.name); }
  const pd = [...pair.entries()].filter(([, v]) => v.length > 1);
  ck(pd.length === 0, '「发型 + 发色」组合互不相同' + (pd.length ? '（' + pd.map(([k, v]) => k + '→' + v.join('/')).join('  ') + '）' : ''));
}
// 五官组合唯一
{
  const m = new Map();
  for (const c of C) { const f = c.sprite.face; const k = [f.shape, f.eyes, f.brows, f.nose, f.mouth, f.cheeks].join('|'); if (!m.has(k)) m.set(k, []); m.get(k).push(c.name); }
  const d = [...m.entries()].filter(([, v]) => v.length > 1);
  ck(d.length === 0, '五官六参数组合 75 人互不相同' + (d.length ? '（重复: ' + d.map(([, v]) => v.join('/')).join('  ') + '）' : ''));
}

// ---------------------------------------------------------
//  3b. 肤色档位（防回归）
//  背景：v5.1 的外观批量脚本曾经把 75 人全部写成 fair，把身为黑人的乔普林
//  改成了白人。这条断言让同类事故不可能再悄悄通过。
// ---------------------------------------------------------
console.log('\n== 3b. 肤色档位 ==');
{
  const SKIN = { fair: '#f2c8a0', pale: '#f7d7b6', tan: '#e0b183', deep: '#c39064' };
  const tones = new Map();
  for (const c of C) {
    const k = c.sprite.skin[0];
    if (!tones.has(k)) tones.set(k, []);
    tones.get(k).push(c.name);
  }
  console.log('   肤色档位 ' + tones.size + ' 种: ' +
    [...tones.entries()].sort((a, b) => b[1].length - a[1].length)
      .map(([k, v]) => k + '×' + v.length).join('  '));
  ck(tones.size >= 3, '肤色至少保留 3 个档位（避免被批量脚本抹平成同一个人种）');
  const joplin = C.find(c => c.id === 'joplin');
  ck(!!joplin && joplin.sprite.skin[0] === SKIN.deep,
    '乔普林（非裔美国人）使用最深的一档肤色' + (joplin ? '（当前 ' + joplin.sprite.skin[0] + '）' : ''));
  const asian = ['chenqigang', 'takemitsu', 'yoshimatsu', 'khachaturian'];
  const wrong = asian.filter(id => {
    const c = C.find(x => x.id === id);
    return c && (c.sprite.skin[0] === SKIN.fair || c.sprite.skin[0] === SKIN.pale);
  });
  ck(wrong.length === 0, '东亚 / 西亚作曲家没有被写成最浅的两档肤色' +
    (wrong.length ? '（' + wrong.join(',') + '）' : ''));
  const deepN = (tones.get(SKIN.deep) || []).length;
  ck(deepN >= 1, '最深一档肤色至少有一位使用者（' + deepN + ' 人）');
}

// ---------------------------------------------------------
//  4. 造型词表分布
// ---------------------------------------------------------
console.log('\n== 4. 造型词表分布 ==');
for (const [label, get, cap] of [
  ['coatStyle', s => s.coatStyle, 16], ['item 手持物', s => s.item, 20],
  ['hat 帽子', s => s.hat || '(无)', 45], ['hair 发型', s => s.hair, 7]]) {
  const m = new Map();
  for (const c of C) { const v = get(c.sprite); m.set(v, (m.get(v) || 0) + 1); }
  const e = [...m.entries()].sort((a, b) => b[1] - a[1]);
  const over = e.filter(([, n]) => n > cap);
  console.log('  ' + label.padEnd(12) + e.length + ' 种: ' + e.map(([k, n]) => k + '×' + n).join(' '));
  ck(over.length === 0, label + ' 没有超过 ' + cap + ' 人共用' + (over.length ? '（' + over.map(([k, n]) => k + '×' + n).join(' ') + '）' : ''));
}

// ---------------------------------------------------------
//  5. 可选：导出对照表 HTML
// ---------------------------------------------------------
if (process.argv.includes('--sheet')) {
  const rows = C.map((c, i) => {
    const g = fps[i].grid;
    let cells = '';
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y * GW + x]) cells += '<i style="grid-area:' + (y + 1) + '/' + (x + 1) + '"></i>';
    return '<figure><div class="px">' + cells + '</div><figcaption>' + (i + 1) + '. ' + c.name +
      '<br><b>' + c.sprite.coatStyle + '</b> / ' + c.sprite.item + ' / ' + (c.sprite.hat || '-') + ' / ' + c.sprite.hair +
      '<br>' + c.sprite.coat[0] + '</figcaption></figure>';
  }).join('');
  const html = '<!DOCTYPE html><meta charset="utf-8"><title>v5.1 造型对照表</title><style>' +
    'body{background:#14161c;color:#cfd6e0;font:12px system-ui;margin:16px}' +
    'main{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}' +
    'figure{margin:0;background:#1c1f28;border-radius:8px;padding:8px;text-align:center}' +
    '.px{display:grid;grid-template:repeat(' + GH + ',3px)/repeat(' + GW + ',3px);justify-content:center;margin-bottom:6px}' +
    '.px i{background:#e8e2d0;display:block}' +
    'figcaption{font-size:10px;line-height:1.35}b{color:#ffd479}</style><main>' + rows + '</main>';
  writeFileSync(new URL('./_look.html', import.meta.url), html, 'utf8');
  console.log('\n对照表 → tools/_look.html');
}

console.log('\n' + (fail ? '✗ 外观校验失败 ' + fail + ' 项' : '✅ 外观校验通过'));
process.exit(fail ? 1 : 0);

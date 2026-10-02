/* tools/fx-check.mjs — 校验技能引用的特效是否都在 skillFx 中实现 */
import { readFileSync } from 'node:fs';
const c = readFileSync(new URL('../js/characters.js', import.meta.url), 'utf8');
const e = readFileSync(new URL('../js/effects.js', import.meta.url), 'utf8');

// 只截取 Effects.prototype.skillFx 的函数体
const start = e.indexOf('Effects.prototype.skillFx');
const end = e.indexOf('Effects.prototype.update', start);
const body = e.slice(start, end);

const used = [...new Set([...c.matchAll(/fx: '([a-zA-Z]+)'/g)].map(m => m[1]))];
const missing = used.filter(u => !body.includes("case '" + u + "':"));
console.log('skillFx 中实现的特效 =', (body.match(/case '[a-zA-Z]+':/g) || []).length, '种');
console.log('技能引用的特效 =', used.length, '种');
if (missing.length) {
  console.log('❌ 在 skillFx 里缺少实现 =', missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('✅ 技能引用的特效在 skillFx 中全部有实现');
}
// 粒子类型是否都有绘制分支
const ptypes = [...new Set([...body.matchAll(/type: '([a-zA-Z]+)'/g)].map(m => m[1]))];
const drawStart = e.indexOf('Effects.prototype.draw =');
const drawEnd = e.indexOf('Effects.prototype.drawNumbers', drawStart);
const drawBody = e.slice(drawStart, drawEnd);
const pMissing = ptypes.filter(t => !drawBody.includes("case '" + t + "':"));
console.log('使用的粒子类型 =', ptypes.length, pMissing.length ? ('❌ 未绘制: ' + pMissing.join(', ')) : '✅ 全部有绘制分支');
if (pMissing.length) process.exitCode = 1;

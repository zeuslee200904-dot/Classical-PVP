/* ============================================================
   tools/data-test.mjs — 校验角色数据、羁绊标签与技能配置
   用法: node data-test.mjs
   ============================================================ */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/characters.js', import.meta.url), 'utf8');
const win = {};
win.window = win;
const ctx = vm.createContext({ window: win, console, Math, Object, Array, JSON, String, Number });
vm.runInContext(src, ctx, { filename: 'characters.js' });

const C = win.COMPOSERS, BY = win.COMPOSER_BY_ID, bonds = win.computeBonds;
let fail = 0;
const bad = (m) => { console.log('  ✗ ' + m); fail++; };

// ---------- 1. 角色数量与结构 ----------
console.log('== 1. 角色总数 ==');
console.log('  角色数 =', C.length);
if (C.length !== 75) bad('角色数应为 75');

const UP25 = ['bach', 'handel', 'vivaldi', 'haydn', 'dvorak', 'verdi', 'bruckner',
  'strauss', 'debussy', 'ravel', 'prokofiev', 'bartok', 'vaughan'];
const NEW25 = ['tchaikovsky', 'mendelssohn', 'chopin', 'schubert', 'gershwin', 'grieg',
  'stravinsky', 'purcell', 'berlioz', 'monteverdi', 'dowland', 'joplin', 'kapustin',
  'rameau', 'hildegard', 'machaut', 'paganini', 'weber', 'palestrina', 'holst',
  'bernstein', 'boulez', 'takemitsu', 'chenqigang', 'britten'];
// v5.0：新增 25 位
const V5 = ['webern', 'hindemith', 'moscheles', 'messiaen', 'medtner', 'berg', 'ysaye',
  'khachaturian', 'satie', 'corelli', 'pachelbel', 'telemann', 'tallis', 'perotin',
  'bruch', 'faure', 'smetana', 'franck', 'rimsky', 'glinka', 'czerny', 'arensky',
  'rubinstein', 'hummel', 'yoshimatsu'];
console.log('  2.0 新增 =', UP25.length, ' 3.0 新增 =', NEW25.length, ' 5.0 新增 =', V5.length);
for (const id of UP25.concat(NEW25, V5)) if (!BY[id]) bad('缺少角色 ' + id);
if (V5.some(id => !BY[id])) bad('v5.0 角色未全部注册');
{
  const idx = V5.map(id => C.findIndex(c => c.id === id));
  if (idx.some((v, i) => v !== 50 + i)) bad('v5.0 角色应排在 51~75 位，实际 ' + idx.join(','));
}

console.log('\n== 2. 技能键位与冷却（v4.0 按持续时间自适应）==');
let cdRaised = 0, cdLowered = 0, badCd = 0;
for (const c of C) {
  if (c.skills.length !== 3) { bad(c.name + ' 技能数不是 3'); continue; }
  const keys = c.skills.map(s => s.key).join('');
  if (keys !== 'QWE') bad(c.name + ' 键位错误: ' + keys);
  for (let i = 0; i < 3; i++) {
    const s = c.skills[i];
    const isUlt = s.type === 'ultimate' || i === 2;
    if (!s.name || !s.sub || !s.desc) bad(c.name + '/' + s.key + ' 缺少名称或说明');
    if (s.desc.length > 52) bad(c.name + '/' + s.key + ' 说明过长(' + s.desc.length + '字)');
    if (s.type === 'field' && !s.field) bad(c.name + ' 领域技能缺少 field');
    if (s.type === 'echo' && !s.echo) bad(c.name + ' 回声技能缺少 echo');
    if (s.type === 'movement' && !s.movement) bad(c.name + ' 乐章技能缺少 movement');
    if (s.type === 'rondo' && !s.rondo) bad(c.name + ' 回旋技能缺少 rondo');
    if (s.type === 'canon' && !s.canon) bad(c.name + ' 卡农技能缺少 canon');
    // —— 冷却规则 ——
    if (typeof s.dur !== 'number') { bad(c.name + '/' + s.key + ' 缺少持续时间字段'); continue; }
    if (typeof s.cd !== 'number' || s.cd < 4) { bad(c.name + '/' + s.key + ' 冷却异常: ' + s.cd); continue; }
    if (isUlt && s.cd > 40) bad(c.name + ' 终极技冷却过长: ' + s.cd);
    if (!isUlt && s.cd > 20) bad(c.name + ' 技能冷却过长: ' + s.cd);
    if (s.dur > 0) {
      // 关键约束：冷却必须明显长于持续时间，否则效果可以无限延续
      if (s.cd <= s.dur) { bad(c.name + '/' + s.key + ' 冷却(' + s.cd + 's) ≤ 持续时间(' + s.dur + 's)'); badCd++; }
      if (s.cd < s.dur + 2) { bad(c.name + '/' + s.key + ' 冷却余量不足'); badCd++; }
      if (s.cd > (isUlt ? 15 : 5)) cdRaised++;
    } else if (s.cd < (isUlt ? 15 : 5)) {
      cdLowered++;
    }
  }
}
console.log('  因持续时间而拉长冷却的技能 =', cdRaised, '个');
console.log('  因无持续时间而放低冷却的技能 =', cdLowered, '个');
console.log('  冷却 ≤ 持续时间的技能 =', badCd === 0 ? '无 ✅' : badCd + ' 个 ❌');

// ---------- 3. 标签分配（对照需求原文） ----------
// v5.0：绿色标签新增地区/时期条目，拉赫玛尼诺夫由「前中浪漫主义」改归「晚期浪漫主义」
const ERA_SPEC = {
  '中世纪': ['hildegard', 'machaut', 'perotin'],
  '文艺复兴': ['monteverdi', 'dowland', 'palestrina', 'tallis'],
  '巴洛克': ['bach', 'handel', 'vivaldi', 'purcell', 'rameau', 'telemann', 'corelli', 'pachelbel'],
  '古典主义': ['beethoven', 'mozart', 'haydn', 'weber', 'paganini', 'hummel'],
  '前中浪漫主义': ['brahms', 'schumann', 'dvorak', 'verdi',
    'tchaikovsky', 'mendelssohn', 'chopin', 'schubert', 'grieg', 'berlioz',
    'moscheles', 'ysaye', 'bruch', 'faure', 'smetana', 'franck', 'rimsky',
    'glinka', 'czerny', 'arensky', 'rubinstein'],
  '晚期浪漫主义': ['mahler', 'bruckner', 'wagner', 'liszt', 'sibelius', 'scriabin',
    'ravel', 'debussy', 'strauss', 'holst', 'rachmaninoff', 'medtner', 'satie'],
  '现代': ['shostakovich', 'schoenberg', 'bartok', 'vaughan', 'prokofiev',
    'stravinsky', 'bernstein', 'boulez', 'takemitsu', 'chenqigang', 'britten',
    'webern', 'hindemith', 'messiaen', 'berg', 'khachaturian', 'yoshimatsu'],
  '爵士': ['gershwin', 'joplin', 'kapustin']
};
const REGION_SPEC = {
  '德奥': ['beethoven', 'mozart', 'brahms', 'mahler', 'wagner', 'bruckner', 'schumann',
    'strauss', 'liszt', 'schoenberg', 'haydn', 'bach', 'mendelssohn', 'schubert', 'hildegard', 'weber',
    'hummel', 'webern', 'czerny', 'berg', 'hindemith', 'moscheles', 'telemann', 'bruch', 'pachelbel'],
  '俄派': ['rachmaninoff', 'shostakovich', 'scriabin', 'bartok', 'prokofiev',
    'tchaikovsky', 'stravinsky', 'kapustin',
    'medtner', 'rimsky', 'glinka', 'arensky', 'rubinstein', 'khachaturian'],
  '北欧': ['sibelius', 'dvorak', 'grieg', 'smetana'],
  '意大利': ['verdi', 'vivaldi', 'monteverdi', 'palestrina', 'paganini', 'corelli'],
  '法派': ['debussy', 'ravel', 'machaut', 'rameau', 'berlioz', 'boulez',
    'messiaen', 'satie', 'perotin', 'franck', 'faure'],
  '英派': ['handel', 'vaughan', 'purcell', 'dowland', 'holst', 'britten', 'tallis'],
  '美国': ['gershwin', 'bernstein', 'joplin'],
  '亚洲': ['takemitsu', 'chenqigang', 'yoshimatsu'],
  '波兰': ['chopin'],        // 与法派同组共鸣
  '比利时': ['ysaye']        // v5.0：与法派同组共鸣，但不可与波兰（肖邦）共鸣
};

console.log('\n== 3. 标签分配核对 ==');
for (const [tag, ids] of Object.entries(ERA_SPEC)) {
  const got = C.filter(c => c.tags.era === tag).map(c => c.id).sort();
  const want = ids.slice().sort();
  if (got.join() !== want.join()) bad('时期「' + tag + '」不符\n    期望 ' + want.join(',') + '\n    实际 ' + got.join(','));
  console.log('  绿·' + tag.padEnd(6, '　') + ' ' + String(got.length).padStart(2) + ' 人');
}
for (const [tag, ids] of Object.entries(REGION_SPEC)) {
  const got = C.filter(c => c.tags.region === tag).map(c => c.id).sort();
  const want = ids.slice().sort();
  if (got.join() !== want.join()) bad('地区「' + tag + '」不符\n    期望 ' + want.join(',') + '\n    实际 ' + got.join(','));
  console.log('  黄·' + tag.padEnd(4, '　') + ' ' + String(got.length).padStart(2) + ' 人');
}
for (const c of C) {
  if (!c.tags.era) bad(c.name + ' 缺少时期标签');
  if (!c.tags.region) bad(c.name + ' 缺少地区标签');
  if (!c.tags.system) bad(c.name + ' 缺少体系标签');
}
if (win.ERA_TAGS.join() !== Object.keys(ERA_SPEC).join()) bad('ERA_TAGS 顺序/内容与需求不一致');
if (win.REGION_TAGS.join() !== Object.keys(REGION_SPEC).join()) bad('REGION_TAGS 顺序/内容与需求不一致');
console.log('  标签体系已按需求更新（现代主义→现代，新增中世纪/文艺复兴/爵士/美国/亚洲/波兰）');
if (C.some(c => c.tags.era === '现代主义')) bad('仍有角色使用旧的“现代主义”标签');

// ---------- 3b. 红色「体系」标签（v4.0 五项 + v5.0 两项） ----------
console.log('\n== 3b. 红色体系标签 ==');
const SYSTEM_SPEC = {
  '和声': ['beethoven', 'mozart', 'brahms', 'mahler', 'wagner', 'schumann', 'rachmaninoff',
    'shostakovich', 'schoenberg', 'sibelius', 'scriabin', 'liszt'],
  '领域': ['bruckner', 'strauss', 'prokofiev', 'haydn', 'bach', 'vivaldi', 'handel',
    'bartok', 'debussy', 'ravel', 'vaughan', 'dvorak', 'verdi'],
  '乐章': ['tchaikovsky', 'mendelssohn', 'chopin', 'schubert', 'gershwin', 'grieg',
    'stravinsky', 'chenqigang', 'britten', 'takemitsu'],
  '回旋': ['purcell', 'berlioz', 'monteverdi', 'dowland', 'joplin', 'kapustin'],
  '卡农': ['rameau', 'hildegard', 'machaut', 'paganini', 'weber', 'palestrina',
    'holst', 'bernstein', 'boulez'],
  // v5.0 新增两项
  '循环': ['webern', 'hindemith', 'moscheles', 'messiaen', 'medtner', 'berg', 'ysaye',
    'khachaturian', 'satie', 'corelli', 'pachelbel', 'hummel'],
  '节拍': ['telemann', 'tallis', 'perotin', 'bruch', 'faure', 'smetana', 'franck',
    'rimsky', 'glinka', 'czerny', 'arensky', 'rubinstein', 'yoshimatsu']
};
let sysTotal = 0;
for (const [tag, ids] of Object.entries(SYSTEM_SPEC)) {
  const got = C.filter(c => c.tags.system === tag).map(c => c.id).sort();
  const want = ids.slice().sort();
  sysTotal += ids.length;
  if (got.join() !== want.join()) {
    bad('体系「' + tag + '」不符\n    期望 ' + want.join(',') + '\n    实际 ' + got.join(','));
  }
  console.log('  红·' + tag.padEnd(3, '　') + ' ' + String(got.length).padStart(2) + ' 人：' + ids.map(i => BY[i].name).join('、'));
}
if (sysTotal !== 75) bad('体系标签应覆盖 75 人，实际 ' + sysTotal);
if (win.SYSTEM_TAGS.join() !== Object.keys(SYSTEM_SPEC).join()) bad('SYSTEM_TAGS 顺序/内容与需求不一致');
console.log('  体系共鸣效果：' + Object.entries(win.SYSTEM_DESC).map(([k, v]) => k + '=' + v).join('；'));

// ---------- 4. 羁绊规则数值 ----------
console.log('\n== 4. 羁绊数值 ==');
console.log('  绿色共鸣伤害加成 = +' + (win.BOND.eraDamage * 100) + '%');
console.log('  黄色共鸣周期 = ' + (win.BOND.regionMin / 60) + ' ~ ' + (win.BOND.regionMax / 60) +
  ' 秒（随机），免疫 ' + (win.BOND.regionInvuln / 60) + ' 秒');
if (Math.abs(win.BOND.eraDamage - 0.12) > 1e-9) bad('绿色羁绊应为 +12%');
if (win.BOND.regionMin !== 6 * 60 || win.BOND.regionMax !== 15 * 60) bad('黄色羁绊间隔应为 6~15 秒随机');
if (win.BOND.regionInvuln !== 2.5 * 60) bad('免疫时长应为 2.5 秒');
let rr = [];
for (let i = 0; i < 5000; i++) rr.push(win.rollRegionInterval());
if (Math.min(...rr) < 6 * 60 || Math.max(...rr) > 15 * 60) bad('黄色羁绊随机间隔越界');
// 界面文案必须跟着 BOND 走（v4.1 曾出现数值改了、界面仍写“每 12 秒”的情况）
const regText = win.regionBondText();
console.log('  界面文案 = ' + regText);
if (regText !== '每 6~15 秒免疫全部伤害 2.5 秒') bad('地区共鸣界面文案与 BOND 数值不一致：' + regText);

// ---------- 5. 三套新体系的覆盖 ----------
console.log('\n== 5. 三套新体系 ==');
const GROUPS = {
  '乐章 movement': ['tchaikovsky', 'mendelssohn', 'chopin', 'schubert', 'gershwin', 'grieg',
    'stravinsky', 'chenqigang', 'britten', 'takemitsu'],
  '回旋 rondo': ['purcell', 'berlioz', 'monteverdi', 'dowland', 'joplin', 'kapustin'],
  '卡农 canon': ['rameau', 'hildegard', 'machaut', 'paganini', 'weber', 'palestrina',
    'holst', 'bernstein', 'boulez']
};
let assigned = 0;
for (const [g, ids] of Object.entries(GROUPS)) {
  assigned += ids.length;
  const types = ids.map(id => BY[id].skills.map(s => s.type));
  const withMech = ids.filter((id, i) => types[i].indexOf(g.split(' ')[1]) >= 0).length;
  console.log('  ' + g.padEnd(14) + ' ' + ids.length + ' 人，其中 ' + withMech + ' 人拥有该体系技能');
  if (withMech < ids.length) bad(g + ' 有角色未使用本体系');
}
if (assigned !== 25) bad('三套体系覆盖人数应为 25，实际 ' + assigned);
const newMechUsers = NEW25.filter(id => BY[id].skills.some(s =>
  ['movement', 'rondo', 'canon'].indexOf(s.type) >= 0));
if (newMechUsers.length !== 25) bad('有 ' + (25 - newMechUsers.length) + ' 位新角色未使用新体系');
console.log('  25 位新角色全部使用新体系');

// ---------- 5b. v5.0 两套新体系「循环 / 节拍」的技能归属 ----------
console.log('\n== 5b. v5.0 新体系：循环 / 节拍 ==');
// 循环靠「反复回响」类技能（canon / echo / movement / rondo）实现，
// 节拍靠「强拍律动」类技能（movement / canon / rondo / echo / field）实现。
const LOOP_MECH = ['canon', 'echo', 'movement', 'rondo'];
const BEAT_MECH = ['movement', 'canon', 'rondo', 'echo', 'field'];
const LOOP_IDS = SYSTEM_SPEC['循环'], BEAT_IDS = SYSTEM_SPEC['节拍'];
const loopOK = LOOP_IDS.filter(id => BY[id].skills.some(s => LOOP_MECH.indexOf(s.type) >= 0));
const beatOK = BEAT_IDS.filter(id => BY[id].skills.some(s => BEAT_MECH.indexOf(s.type) >= 0));
console.log('  循环 ' + loopOK.length + '/' + LOOP_IDS.length + ' 人带反复回响类技能；' +
  '节拍 ' + beatOK.length + '/' + BEAT_IDS.length + ' 人带强拍律动类技能');
if (loopOK.length !== LOOP_IDS.length) {
  bad('循环体系缺少回响技能的角色：' + LOOP_IDS.filter(i => loopOK.indexOf(i) < 0).map(i => BY[i].name).join('、'));
}
if (beatOK.length !== BEAT_IDS.length) {
  bad('节拍体系缺少律动技能的角色：' + BEAT_IDS.filter(i => beatOK.indexOf(i) < 0).map(i => BY[i].name).join('、'));
}
// 两套体系的共鸣数值必须与需求一致
console.log('  循环共鸣：每 ' + (win.SYSTEM_BOND.loopInterval / 60) + ' 秒回复已损失生命的 ' +
  (win.SYSTEM_BOND.loopHealRatio * 100) + '%');
if (win.SYSTEM_BOND.loopInterval !== 7 * 60) bad('循环共鸣周期应为 7 秒');
if (Math.abs(win.SYSTEM_BOND.loopHealRatio - 0.18) > 1e-9) bad('循环共鸣回血比例应为 18%');
console.log('  节拍共鸣：普通攻击（挥拳 / 踢腿）攻速 +' +
  Math.round((win.SYSTEM_BOND.basicSpeed - 1) * 100) + '%');
if (Math.abs(win.SYSTEM_BOND.basicSpeed - 1.20) > 1e-9) bad('节拍共鸣攻速应为 +20%');
// 三选一：一个角色只能有一个体系标签
for (const c of C) {
  const n = Object.keys(SYSTEM_SPEC).filter(t => c.tags.system === t).length;
  if (n !== 1) bad(c.name + ' 的体系标签数量异常');
}

// ---------- 6. 羁绊共鸣计算 ----------
console.log('\n== 6. 羁绊共鸣计算 ==');
function show(label, ids) {
  const b = bonds(ids);
  const names = ids.map(i => BY[i].name).join(' + ');
  const era = b.era ? ('绿·' + b.era.tag + '×' + b.era.count) : '绿·无';
  const reg = b.region ? ('黄·' + b.region.tag + '×' + b.region.count) : '黄·无';
  console.log('  ' + label.padEnd(20, ' ') + names.padEnd(30, ' ') + era + '　' + reg);
  return b;
}
const t1 = show('三个爵士·美国', ['gershwin', 'joplin', 'kapustin']);
if (!t1.era || t1.era.tag !== '爵士' || t1.era.count !== 3) bad('爵士×3 应触发');
if (!t1.region || t1.region.tag !== '美国' || t1.region.count !== 2) bad('美国应为 2 人（卡普斯汀是俄派）');
const t2 = show('中世纪二人+无关', ['hildegard', 'machaut', 'bach']);
if (!t2.era || t2.era.tag !== '中世纪' || t2.era.count !== 2) bad('中世纪×2 应触发');
const t3 = show('三个亚洲/现代', ['takemitsu', 'chenqigang', 'boulez']);
if (!t3.era || t3.era.tag !== '现代' || t3.era.count !== 3) bad('现代×3 应触发');
if (!t3.region || t3.region.tag !== '亚洲' || t3.region.count !== 2) bad('亚洲×2 应触发');
const t4 = show('三种不同标签', ['gershwin', 'machaut', 'grieg']);
if (t4.era || t4.region) bad('无同标签不应触发共鸣');
const t5 = bonds(['purcell', 'rameau', 'handel']);
if (!t5.era || t5.era.tag !== '巴洛克' || t5.era.count !== 3) bad('普赛尔+拉莫+亨德尔应为巴洛克×3，实际 ' + JSON.stringify(t5.era));
if (!t5.region || t5.region.tag !== '英派' || t5.region.count !== 2) bad('英派×2 应触发，实际 ' + JSON.stringify(t5.region));
const t6 = bonds(['britten', 'bernstein', 'boulez']);
if (!t6.era || t6.era.tag !== '现代' || t6.era.count !== 3) bad('布里顿+伯恩斯坦+布列兹应为现代×3，实际 ' + JSON.stringify(t6.era));
const t7 = bonds(['holst', 'britten', 'vaughan']);
if (!t7.era || t7.era.tag !== '现代' || t7.era.count !== 2) bad('布里顿+沃恩·威廉斯应为现代×2，实际 ' + JSON.stringify(t7.era));

// v3.1：波兰与法派同组共鸣（v5.0：circles 语义——按"该标签自己的圈子"判定）
console.log('\n== 6b. 波兰 / 法派 同组共鸣（v3.1）==');
const t8 = bonds(['chopin', 'debussy']);
console.log('  肖邦(波兰) + 德彪西(法派) → ' + JSON.stringify(t8.region));
if (!t8.region || t8.region.count !== 2) bad('波兰应与法派共鸣');
if (t8.region.tag !== '法派/波兰') bad('共鸣标签应显示为“法派/波兰”，实际 ' + t8.region.tag);
if (t8.region.group.indexOf('法派') < 0 || t8.region.group.indexOf('波兰') < 0) {
  bad('共鸣组名应同时含法派与波兰，实际 ' + t8.region.group);
}
const t9 = bonds(['chopin', 'ravel', 'bach']);
if (!t9.region || t9.region.count !== 2) bad('肖邦+拉威尔应触发同组共鸣');
if (t9.region.idxs.indexOf(2) >= 0) bad('巴赫不应被算进法派/波兰共鸣');
const t11 = bonds(['chopin', 'bach']);
if (t11.region) bad('单独的波兰不应触发共鸣（需要 2 人以上同组）');

// v5.0：比利时（伊萨伊）与波兰（肖邦）都并入法派组，但彼此不共鸣
console.log('\n== 6b-2. 比利时 / 法派 / 波兰 的互相关系（v5.0）==');
const y1 = bonds(['ysaye', 'faure']);
console.log('  伊萨伊(比利时) + 福莱(法派) → ' + JSON.stringify(y1.region));
if (!y1.region || y1.region.count !== 2) bad('比利时应与法派共鸣');
if (y1.region.group.indexOf('法派') < 0 || y1.region.group.indexOf('比利时') < 0) {
  bad('伊萨伊的共鸣组应含比利时与法派，实际 ' + y1.region.group);
}
const y2 = bonds(['ysaye', 'chopin']);
console.log('  伊萨伊(比利时) + 肖邦(波兰) → ' + JSON.stringify(y2.region));
if (y2.region) bad('比利时与波兰不应互相共鸣（肖邦是波兰）');
const y3 = bonds(['ysaye', 'chopin', 'debussy']);
console.log('  伊萨伊 + 肖邦 + 德彪西 → ' + JSON.stringify(y3.region));
if (!y3.region || y3.region.count !== 2 || y3.region.idxs.indexOf(0) >= 0) {
  bad('伊萨伊不应与肖邦凑成一组（只有肖邦+德彪西算 2 人法派组）');
}
const y4 = bonds(['ysaye', 'franck', 'satie']);
if (!y4.region || y4.region.count !== 3) bad('伊萨伊+弗兰克+萨蒂应为法派组 3 人，实际 ' + JSON.stringify(y4.region));
if (y4.region.tag.indexOf('比利时') < 0 || y4.region.tag.indexOf('法派') < 0) {
  bad('共鸣标签应同时列出比利时与法派，实际 ' + y4.region.tag);
}
// 法派的圈子含比利时与波兰；但波兰 / 比利时各自的圈子不含对方
console.log('  法派圈子 = ' + win.regionGroupOf('法派').join('/') +
  '；波兰圈子 = ' + win.regionGroupOf('波兰').join('/') +
  '；比利时圈子 = ' + win.regionGroupOf('比利时').join('/'));
if (win.regionGroupOf('波兰').indexOf('比利时') >= 0) bad('波兰圈子里不应出现比利时');
if (win.regionGroupOf('比利时').indexOf('波兰') >= 0) bad('比利时圈子里不应出现波兰');

// ---------- 6c. 技能描述与实际数值一致（v4.2.1）----------
// 曾经出现过「描述写着 35 点护盾、实际 26 点」「写着 60% 减伤、实际 40%」这类走样，
// 这里逐条比对描述里出现的点数与百分比。
console.log('\n== 6c. 技能描述 vs 实际数值 ==');
const descBad = [];
for (const c of C) {
  for (const sk of c.skills) {
    const d = sk.desc || '';
    for (const m of d.matchAll(/(\d+)\s*(点|%)/g)) {
      const v = +m[1], unit = m[2];
      const cands = [];
      if (unit === '点') {
        if (sk.self) { cands.push(sk.self.shield, sk.self.heal); }
        if (sk.hit) cands.push(sk.hit.damage);
        if (sk.field) cands.push(sk.field.dps, sk.field.heal);
      } else {
        if (sk.self && sk.self.armor) cands.push(Math.round(sk.self.armor.power * 100));
        if (sk.self && sk.self.lifesteal) cands.push(Math.round(sk.self.lifesteal * 100));
        if (sk.self && sk.self.buff) cands.push(Math.round((sk.self.buff.power || 0) * 100), Math.round((sk.self.buff.speed || 0) * 100));
        if (sk.field && sk.field.armor) cands.push(Math.round(sk.field.armor * 100));
        if (sk.field && sk.field.drain) cands.push(Math.round(sk.field.drain * 100));
        if (sk.field && sk.field.slow) cands.push(Math.round((1 - sk.field.slow) * 100), Math.round(sk.field.slow * 100));
        if (sk.canon) cands.push(Math.round(sk.canon.ratio * 100));
        if (sk.status && sk.status.power) cands.push(Math.round(sk.status.power * 100));
      }
      if (cands.filter(x => x != null).indexOf(v) < 0) {
        descBad.push(c.name + ' ' + sk.key + '「' + m[0] + '」实际候选=' + JSON.stringify(cands.filter(x => x != null)));
      }
    }
  }
}
console.log('  抽查技能描述中的点数 / 百分比 = ' + descBad.length + ' 处不一致');
if (descBad.length) descBad.forEach(x => console.log('    ❌ ' + x));
if (descBad.length) bad('技能描述与数值不一致（' + descBad.length + ' 处）');

// ---------- 7. 数值区间 ----------
const hp = C.map(c => c.stats.hp);const pw = C.map(c => c.stats.power);
const sp = C.map(c => c.stats.speed);
// ---------- 6d. 形象与技能名称不重复（v5.0：75 人）----------
console.log('\n== 6d. 形象与技能名称的辨识度 ==');
{
  const dupId = C.map(c => c.id).filter((x, i, a) => a.indexOf(x) !== i);
  if (dupId.length) bad('角色 id 重复：' + dupId.join('、'));
  const dupName = C.map(c => c.name).filter((x, i, a) => a.indexOf(x) !== i);
  if (dupName.length) bad('角色名重复：' + dupName.join('、'));
  const dupEn = C.map(c => c.en).filter((x, i, a) => a.indexOf(x) !== i);
  if (dupEn.length) bad('英文名重复：' + dupEn.join('、'));
  // 形象指纹：发型 + 发色 + 衣服主色 + 版型 + 脸型/眼型 组合
  const faces = C.map(c => [c.sprite.hair, c.sprite.hairColor, c.sprite.coat[0],
    c.sprite.coatStyle, c.sprite.face.shape, c.sprite.face.eyes].join('|'));
  const dupFace = faces.filter((x, i, a) => a.indexOf(x) !== i);
  console.log('  形象指纹组合数 = ' + new Set(faces).size + ' / ' + C.length);
  if (dupFace.length) bad('有 ' + dupFace.length + ' 位作曲家的形象指纹完全相同');
  // 每位的三个技能名不应重复（同名技能在连招里会分不清）
  for (const c of C) {
    const names = c.skills.map(s => s.name);
    if (new Set(names).size !== 3) bad(c.name + ' 的三个技能名有重复：' + names.join('、'));
  }
  console.log('  技能名唯一性检查通过（' + C.length + ' × 3 = ' + C.length * 3 + ' 个技能）');
}

console.log('\n== 7. 数值区间 ==');console.log('  HP   ' + Math.min(...hp) + ' ~ ' + Math.max(...hp));
console.log('  力量 ' + Math.min(...pw) + ' ~ ' + Math.max(...pw));
console.log('  速度 ' + Math.min(...sp) + ' ~ ' + Math.max(...sp));
// v5.1：抬血后选人界面的体力条不再写死 250，而是从角色数据取最大值，
// 这里改成断言"分母确实来自数据"，避免再出现"全员满格"的回归
const gameSrc0 = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
if (!/var HP_BAR_MAX = 0;/.test(gameSrc0) || !/cur\.stats\.hp \/ HP_BAR_MAX/.test(gameSrc0)) {
  bad('选人界面体力条的分母不是由数据推导的 HP_BAR_MAX');
}
if (Math.max(...hp) > 400) bad('HP 上限过高: ' + Math.max(...hp));
if (Math.max(...pw) > 24 || Math.max(...sp) > 24) bad('属性超过界面刻度 24');
// 和声体系 +18% 生命：血条按各自 maxHp 归一化，不会溢出
const bondedMax = Math.round(Math.max(...hp) * (1 + win.SYSTEM_BOND.hpBonus));
console.log('  和声共鸣后的最高生命 = ' + bondedMax + '（血条按各自上限归一化显示）');
const gameSrc = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
if (!/var ratio = clamp\(f\.hp \/ f\.maxHp/.test(gameSrc)) bad('血条未按各自 maxHp 归一化，和声共鸣后可能溢出');
if (bondedMax > 440) bad('和声共鸣后生命过高: ' + bondedMax);

console.log('\n' + (fail ? ('❌ 共 ' + fail + ' 处问题') : '✅ 全部数据校验通过'));
process.exitCode = fail ? 1 : 0;

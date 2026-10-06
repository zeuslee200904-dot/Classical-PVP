/* ============================================================
   characters.js — 十二位古典作曲家：数值 / 技能 / 像素配色
   ============================================================ */
(function (global) {
  'use strict';

  function pal(main, dark, light, hair, hairDark, skin, skinDark, accent) {
    return { main: main, dark: dark, light: light, hair: hair, hairDark: hairDark, skin: skin, skinDark: skinDark, accent: accent };
  }

  // 通用肤色 / 白衬衫
  var SKIN = {
    fair: ['#f2c8a0', '#c08c62'],        // 白种人肤色
    pale: ['#f7d7b6', '#c99b73'],
    tan: ['#e0b183', '#a87c52'],
    deep: ['#c39064', '#8b5c3a']
  };
  var SHIRT = { white: ['#f4f0e2', '#b9b3a0'], cream: ['#efe6cc', '#b0a486'] };

  var LIST = [
    // ---------------- 1. 贝多芬 ----------------
    {
      id: 'beethoven', name: '贝多芬', en: 'BEETHOVEN', title: '路德维希·凡·贝多芬',
      quote: '我要扼住命运的咽喉！',
      stats: { hp: 329, power: 20, speed: 16 },
      desc: '均衡的正面强攻型。血量最厚，拳脚沉重，终极技范围极大。',
      sprite: {
        hair: 'mane', hairColor: '#8c8177', hairDark: '#4c453f',
        coat: ['#3a4a7a', '#222b47', '#7d88a7'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#191d2b', '#10121b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8c98a', item: 'baton',
        hat: 'wreath',
        beard: true,
        height: 1.02, bulk: 1.06, stoop: 2
      },
      skills: [
        {
          name: '月光奏鸣曲', sub: '月光·静谧领域', key: 'Q', cd: 5, range: 250, type: 'projectile',
          desc: '三连月光音波缓缓推进，被击中者移动与出拳都会变慢。',
          proj: { kind: 'moon', count: 3, speed: 4.2, w: 20, h: 20, spacing: 26, damage: 20, yOff: -78 },
          status: { kind: 'slow', dur: 3.0 }
        },
        {
          name: '命运交响曲', sub: '命运叩门', key: 'W', cd: 5, range: 150, type: 'hitbox',
          desc: '四记“命运动机”重击身前，每击都会把对手震退并造成短暂硬直。',
          hit: { damage: 29, hits: 4, interval: 9, w: 122, h: 84, yOff: -78, knock: 2.6, stun: 16 },
          fx: 'shock'
        },
        {
          name: '第九交响曲', sub: '欢乐升华', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '《欢乐颂》主题爆发：以自身为中心炸开巨型金色音浪，穿盾穿透、伤害极高并强制击飞。',
          hit: { damage: 109, w: 340, h: 190, yOff: -90, knock: 9.5, stun: 40, pierce: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 2. 莫扎特 ----------------
    {
      id: 'mozart', name: '莫扎特', en: 'MOZART', title: '沃尔夫冈·阿马德乌斯·莫扎特',
      quote: '音符对我来说已经太多了。',
      stats: { hp: 271, power: 15, speed: 24 },
      desc: '全场最快。走位灵动、出手密集，靠速度与走位弥补血少。',
      sprite: {
        hair: 'queue', hairColor: '#f0ead8', hairDark: '#b8ae94',
        coat: ['#8e2f3c', '#521b23', '#b4767e'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#301519', '#1f0d10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0e2c0', item: 'violin',
        hat: 'tricorne',
        height: 0.95, bulk: 0.9, stoop: 0
      },
      skills: [
        {
          name: '土耳其进行曲', sub: '进行曲·踏步突进', key: 'Q', cd: 5, range: 190, type: 'dashAttack',
          desc: '踩着进行曲节拍高速突进，一路撞击对手并将其顶退。',
          dash: { distance: 190, speed: 7.5, damage: 15, w: 56, h: 92, yOff: -76, knock: 4.2, stun: 14 },
          fx: 'trail'
        },
        {
          name: '费加罗的婚礼', sub: '婚礼·序曲狂想', key: 'W', cd: 5, range: 120, type: 'multiHit',
          desc: '序曲节奏越来越快，六连击把对手钉在原地痛打。',
          hit: { damage: 6, hits: 6, interval: 6, w: 96, h: 84, yOff: -78, knock: 0.9, stun: 10 }
        },
        {
          name: '魔笛', sub: '夜后咏叹·魔笛高音', key: 'E', cd: 15, range: 300, type: 'projectile',
          desc: '夜后的花腔高音化作三道音刃飞出，命中会击穿格挡、眩晕对手，并轻微回复自身。',
          proj: { kind: 'flute', count: 3, speed: 8.5, w: 26, h: 26, spreadY: 42, damage: 20, yOff: -80, pierce: true },
          status: { kind: 'stun', dur: 1.1 },
          self: { heal: 13 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 3. 勃拉姆斯 ----------------
    {
      id: 'brahms', name: '勃拉姆斯', en: 'BRAHMS', title: '约翰内斯·勃拉姆斯',
      quote: '慢工出细活，二十年一首交响曲。',
      stats: { hp: 314, power: 18, speed: 15 },
      desc: '厚实耐打的近身缠斗型，控制与持续伤害兼备。',
      sprite: {
        hair: 'mane', hairColor: '#9a8a70', hairDark: '#5e5240',
        coat: ['#4a4a3c', '#2b2b23', '#88887e'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c1c18', '#11110f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8b07a', item: 'baton',
        beard: true,
        height: 1, bulk: 1.14, stoop: 2
      },
      skills: [
        {
          name: '匈牙利舞曲', sub: '强制起舞', key: 'Q', cd: 5, range: 170, type: 'controlHit',
          desc: '匈牙利舞曲一响，对手身不由己地踏起舞步：被定住并持续掉血 3 秒。',
          hit: { damage: 13, w: 150, h: 96, yOff: -78, knock: 1.2, stun: 22 },
          status: { kind: 'dance', dur: 3.0, dps: 5 },
          fx: 'notes'
        },
        {
          name: '摇篮曲', sub: '摇篮·安眠曲', key: 'W', cd: 5, range: 120, type: 'projectile',
          desc: '轻柔的摇篮曲飘出，被笼罩的对手昏昏欲睡，速度骤降 5 秒。',
          proj: { kind: 'lullaby', count: 1, speed: 3.6, w: 32, h: 32, damage: 10, yOff: -80 },
          status: { kind: 'slow', dur: 5.0, power: 0.45 },
          fx: 'zzz'
        },
        {
          name: '第一交响曲', sub: '巨人交响·终曲', key: 'E', cd: 15, range: 150, type: 'ultimate',
          desc: '积蓄二十年的力量倾泻而出：身边音墙爆发，自身获得护盾并回复生命。',
          hit: { damage: 48, w: 210, h: 180, yOff: -88, knock: 7.5, stun: 34 },
          self: { shield: 36, heal: 14 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 4. 马勒 ----------------
    {
      id: 'mahler', name: '马勒', en: 'MAHLER', title: '古斯塔夫·马勒',
      quote: '交响曲必须像整个世界一样。',
      stats: { hp: 343, power: 22, speed: 11 },
      desc: '最厚重的体格与最强的单发伤害，但转身缓慢，需靠预判出招。',
      sprite: {
        hair: 'wild', hairColor: '#3a3128', hairDark: '#201a14',
        coat: ['#2f3238', '#1b1d20', '#76787c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#121315', '#0c0c0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b9c6d8', item: 'baton',
        glasses: true,
        height: 1.08, bulk: 1.22, stoop: 2
      },
      skills: [
        {
          name: '大地之歌', sub: '大地·送别', key: 'Q', cd: 5, range: 260, type: 'projectile',
          desc: '沉厚的大地之声贴地涌来，击中后会把对手掀翻在地。',
          proj: { kind: 'earth', count: 2, speed: 3.4, w: 34, h: 34, damage: 23, yOff: -60, spacing: 40, low: true },
          status: { kind: 'root', dur: 1.2 }
        },
        {
          name: '第一交响曲', sub: '巨人·葬礼进行曲', key: 'W', cd: 5, range: 130, type: 'meleeSwing',
          desc: '巨人般的沉重挥击，被命中的对手会被打飞很远。',
          hit: { damage: 40, w: 120, h: 100, yOff: -80, knock: 8.0, stun: 20 },
          fx: 'impact'
        },
        {
          name: '第八交响曲', sub: '千人交响·千人齐鸣', key: 'E', cd: 15, range: 960, type: 'ultimate',
          desc: '调动千人合唱轰鸣全场：全屏音浪无差别轰击（离开场地也无处可逃），伤害极高。',
          hit: { damage: 85, w: 960, h: 540, yOff: -60, knock: 10, stun: 44, fullScreen: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 5. 瓦格纳 ----------------
    {
      id: 'wagner', name: '瓦格纳', en: 'WAGNER', title: '威廉·理查德·瓦格纳',
      quote: '我要写一部前所未有的总体艺术品。',
      stats: { hp: 307, power: 23, speed: 14 },
      desc: '爆发力最强的近身型。半音阶突袭极难格挡，终极技伤害恐怖。',
      sprite: {
        hair: 'long', hairColor: '#6a5a48', hairDark: '#3c3226',
        coat: ['#5c2b52', '#351930', '#93738d'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#21131e', '#150c13'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d6b96a', item: 'wineglass',
        hat: 'beret',
        mustache: true,
        height: 1, bulk: 1.12, stoop: 1
      },
      skills: [
        {
          name: '特里斯坦与伊索尔德', sub: '特里斯坦和弦·无限渴望', key: 'Q', cd: 5, range: 130, type: 'meleeSwing',
          desc: '无法解决的和弦撕裂空气，这一击无视格挡。',
          hit: { damage: 16, w: 112, h: 92, yOff: -78, knock: 2.4, stun: 16, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '漂泊的荷兰人', sub: '幽灵船突袭', key: 'W', cd: 5, range: 240, type: 'dashAttack',
          desc: '化作幽灵船冲破风浪，横穿战场撞飞对手。',
          dash: { distance: 240, speed: 9.0, damage: 29, w: 60, h: 92, yOff: -76, knock: 6.5, stun: 18 },
          fx: 'ghost'
        },
        {
          name: '尼伯龙根的指环', sub: '诸神黄昏', key: 'E', cd: 15, range: 180, type: 'ultimate',
          desc: '指环的诅咒终结一切：以自身为中心连续三波烈焰与雷鸣，最后一波会把对手击飞。',
          hit: { damage: 35, hits: 3, interval: 16, w: 220, h: 190, yOff: -88, knock: 9, stun: 36 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 6. 舒曼 ----------------
    {
      id: 'schumann', name: '舒曼', en: 'SCHUMANN', title: '罗伯特·舒曼',
      quote: '音乐是诗的一种更高形式。',
      stats: { hp: 279, power: 16, speed: 19 },
      desc: '灵巧的幻术型：用幻影与梦境的音波折磨对手，续航靠“狂欢节”。',
      sprite: {
        hair: 'wavy', hairColor: '#7a5a3a', hairDark: '#4a3420',
        coat: ['#2f6b63', '#1b3e39', '#769d98'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#152724', '#0e1817'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0b0c8', item: 'quill',
        height: 0.98, bulk: 0.96, stoop: 0
      },
      skills: [
        {
          name: '童年情景', sub: '童年·异国与异事', key: 'Q', cd: 5, range: 150, type: 'multiHit',
          desc: '十三首童年小品的连环敲击，五连击快而零碎。',
          hit: { damage: 16, hits: 5, interval: 7, w: 116, h: 84, yOff: -78, knock: 1.0, stun: 12 }
        },
        {
          name: '梦幻曲', sub: '梦幻·迷离幻影', key: 'W', cd: 5, range: 320, type: 'projectile',
          desc: '梦境弥漫之处尽是幻影：被命中的对手视野迷乱，陷入减速与持续流失。',
          proj: { kind: 'dream', count: 2, speed: 4.0, w: 33, h: 30, damage: 30, yOff: -84, spacing: 34 },
          status: { kind: 'slow', dur: 4.0, power: 0.5 },
          fx: 'zzz'
        },
        {
          name: '狂欢节', sub: '狂欢节·四音狂欢', key: 'E', cd: 15, range: 900, type: 'ultimate',
          desc: '狂欢节的彩纸与音符席卷全场：大范围伤害并回复自身生命。',
          hit: { damage: 132, w: 1002, h: 300, yOff: -80, knock: 8, stun: 36 },
          self: { heal: 27 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 7. 拉赫玛尼诺夫 ----------------
    {
      id: 'rachmaninoff', name: '拉赫玛尼诺夫', en: 'RACHMANINOFF', title: '谢尔盖·瓦西里耶维奇·拉赫玛尼诺夫',
      quote: '我的双手能跨十二度。',
      stats: { hp: 336, power: 21, speed: 13 },
      desc: '巨型钢琴家：超大范围的锤击与厚重护盾，靠护盾换血。',
      sprite: {
        hair: 'crop', hairColor: '#2a2620', hairDark: '#16130f',
        coat: ['#232733', '#14171e', '#6e7078'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#0e0f12', '#090a0c'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#a8b8cc', item: 'baton',
        height: 1.06, bulk: 1.2, stoop: 1
      },
      skills: [
        {
          name: '帕格尼尼主题狂想曲', sub: '狂想·无尽随想', key: 'Q', cd: 5, range: 150, type: 'projectile',
          desc: '二十四段变奏连续轰出，一路推进的音符墙会把对手压在墙角。',
          proj: { kind: 'rhapsody', count: 3, speed: 5.2, w: 24, h: 30, damage: 14, yOff: -80, spacing: 22 },
          fx: 'trail'
        },
        {
          name: '第二钢琴协奏曲', sub: '拉二·钟声轰鸣', key: 'W', cd: 5, range: 135, type: 'meleeSwing',
          desc: '开场那排钟声般的和弦，砸下的同时为自己生成厚重护盾吸收 22 点伤害。',
          hit: { damage: 23, w: 128, h: 100, yOff: -80, knock: 5.5, stun: 20 },
          self: { shield: 22 },
          fx: 'impact'
        },
        {
          name: '第三钢琴协奏曲', sub: '拉三·钢铁洪流', key: 'E', cd: 15, range: 360, type: 'ultimate',
          desc: '被称为“大象之作”的巨量音符倾泻：连续五波音流横扫全场，击退所有敌人。',
          hit: { damage: 17, hits: 5, interval: 10, w: 360, h: 220, yOff: -88, knock: 6, stun: 30 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 8. 肖斯塔科维奇 ----------------
    {
      id: 'shostakovich', name: '肖斯塔科维奇', en: 'SHOSTAKOVICH', title: '德米特里·德米特里耶维奇·肖斯塔科维奇',
      quote: '请转告我，我不是懦夫。',
      stats: { hp: 293, power: 19, speed: 16 },
      desc: '压迫感十足的炮击型：锯齿波、列宁格勒炮火与步步紧逼的圆舞曲。',
      sprite: {
        hair: 'crop', hairColor: '#4a3f33', hairDark: '#28211a',
        coat: ['#4a4a52', '#2b2b30', '#88888d'], coatStyle: 'military',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c1c1f', '#121213'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#cfd6e0', item: 'quill',
        hat: 'flatcap',
        glasses: true,
        height: 0.98, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '第五交响曲', sub: '革命·锯齿风暴', key: 'Q', cd: 5, range: 130, type: 'meleeSwing',
          desc: '尖锐的锯齿音簇爆发，命中后留下一层“锯齿”持续割伤对手。',
          hit: { damage: 28, w: 133, h: 96, yOff: -78, knock: 3.4, stun: 18 },
          status: { kind: 'bleed', dur: 3.0, dps: 4 },
          fx: 'chromatic'
        },
        {
          name: '列宁格勒交响曲', sub: '列宁格勒·炮火入侵', key: 'W', cd: 5, range: 420, type: 'projectile',
          desc: '侵略者的脚步化作连环炮击，两颗炮弹依次在远处炸开。',
          proj: { kind: 'shell', count: 2, speed: 6.0, w: 33, h: 30, damage: 29, yOff: -70, spacing: 60, arc: true },
          fx: 'impact'
        },
        {
          name: '第二圆舞曲', sub: '圆舞曲·三拍终局', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '三拍子的优雅杀意：全场扫过三重音浪，每一击都会让对手愈陷愈深。',
          hit: { damage: 26, hits: 3, interval: 18, w: 435, h: 240, yOff: -86, knock: 5, stun: 30 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 9. 勋伯格 ----------------
    {
      id: 'schoenberg', name: '勋伯格', en: 'SCHOENBERG', title: '阿诺尔德·勋伯格',
      quote: '我发现了十二音体系。',
      stats: { hp: 286, power: 20, speed: 16 },
      desc: '颠覆规则的十二音魔法师：不能用常理格挡，能用“月迷彼埃罗”诅咒对手。',
      sprite: {
        hair: 'bald', hairColor: '#5a5248', hairDark: '#2e2a24',
        coat: ['#3c3a46', '#232229', '#7e7d85'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#17161a', '#0f0e10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c0a870', item: 'quill',
        monocle: true,
        height: 0.97, bulk: 1, stoop: 1
      },
      skills: [
        {
          name: '升华之夜', sub: '升华·半音爬行', key: 'Q', cd: 5, range: 320, type: 'projectile',
          desc: '半音阶缓缓爬升，两道无法被格挡的弦乐音波穿过一切障碍。',
          proj: { kind: 'chroma', count: 2, speed: 4.4, w: 31, h: 28, damage: 29, yOff: -82, spacing: 30, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '月迷彼埃罗', sub: '彼埃罗·十二音诅咒', key: 'W', cd: 5, range: 150, type: 'controlHit',
          desc: '念出十二音咒语，被诅咒者招式冷却全部延长 5 秒，并陷入混乱减速。',
          hit: { damage: 18, w: 154, h: 96, yOff: -78, knock: 2.0, stun: 20 },
          status: { kind: 'curse', dur: 5.0, extraCd: 5 },
          fx: 'circle'
        },
        {
          name: '管弦乐变奏曲', sub: '变奏·十二音矩阵', key: 'E', cd: 15, range: 200, type: 'ultimate',
          desc: '十二音矩阵在对手身上同时奏响，瞬间打出六段音列，最后一段将对手击飞。',
          hit: { damage: 20, hits: 6, interval: 8, w: 219, h: 180, yOff: -84, knock: 8, stun: 34 },
          fx: 'matrix'
        }
      ]
    },

    // ---------------- 10. 西贝柳斯 ----------------
    {
      id: 'sibelius', name: '西贝柳斯', en: 'SIBELIUS', title: '让·西贝柳斯',
      quote: '交响曲是血液里的事。',
      stats: { hp: 300, power: 17, speed: 18 },
      desc: '北国的守护者：远程压制强，还能用“芬兰颂”给自己套上减伤的冰霜结界。',
      sprite: {
        hair: 'bald', hairColor: '#8a8078', hairDark: '#4a453e',
        coat: ['#33443f', '#1e2725', '#788480'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#141918', '#0d100f'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#bcd8e8', item: 'cane',
        pipe: true,
        height: 1, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '图奥内拉的天鹅', sub: '天鹅·冥河咏叹', key: 'Q', cd: 5, range: 340, type: 'projectile',
          desc: '冥河黑水上滑行的天鹅唱出悲歌，音波命中后拖慢并削弱对手的防御。',
          proj: { kind: 'swan', count: 2, speed: 5.0, w: 30, h: 30, damage: 12, yOff: -82, spacing: 32 },
          status: { kind: 'weaken', dur: 4.0, power: 0.3 }
        },
        {
          name: '卡累利阿组曲', sub: '卡累利阿·风雪推进', key: 'W', cd: 5, range: 170, type: 'dashAttack',
          desc: '裹挟风雪向前推进，撞上对手后脚步一踏将其钉住。',
          dash: { distance: 170, speed: 6.8, damage: 16, w: 58, h: 92, yOff: -76, knock: 3.8, stun: 14 },
          status: { kind: 'root', dur: 1.0 },
          fx: 'frost'
        },
        {
          name: '芬兰颂', sub: '芬兰颂·冰霜颂歌', key: 'E', cd: 15, range: 300, type: 'ultimate',
          desc: '颂歌响起，北国的冰霜结界覆盖全身：造成大范围伤害，并获得 6 秒 35% 减伤。',
          hit: { damage: 38, w: 300, h: 200, yOff: -86, knock: 8, stun: 36 },
          self: { shield: 32, armor: { dur: 6, power: 0.35 } },
          fx: 'frost'
        }
      ]
    },

    // ---------------- 11. 斯克里亚宾 ----------------
    {
      id: 'scriabin', name: '斯克里亚宾', en: 'SCRIABIN', title: '亚历山大·尼古拉耶维奇·斯克里亚宾',
      quote: '我要用神秘和弦完成狂喜之诗。',
      stats: { hp: 286, power: 24, speed: 17 },
      desc: '攻击力最高、血量最薄的高风险刺客，技能多带吸血与增益。',
      sprite: {
        hair: 'curly', hairColor: '#3a2e26', hairDark: '#1e1712',
        coat: ['#4a3050', '#2b1c2e', '#88768c'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b141d', '#110d12'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#e8c86a', item: 'wineglass',
        mustache: true,
        height: 0.96, bulk: 0.94, stoop: 0
      },
      skills: [
        {
          name: '神秘和弦', sub: '神秘和弦·音簇', key: 'Q', cd: 5, range: 200, type: 'projectile',
          desc: '由四度叠置构成的神秘和弦扩散出去，命中会把对手向斜上方掀翻。',
          proj: { kind: 'mystic', count: 2, speed: 4.6, w: 30, h: 30, damage: 21, yOff: -80, spacing: 30 },
          fx: 'circle'
        },
        {
          name: '狂喜之诗', sub: '狂喜·吸血音诗', key: 'W', cd: 5, range: 150, type: 'meleeSwing',
          desc: '狂喜的音诗撕开对手，并在 3 秒内把造成伤害的 40% 化作自己的生命。',
          hit: { damage: 27, w: 130, h: 98, yOff: -80, knock: 4.0, stun: 18 },
          self: { lifesteal: 0.4, lifestealDur: 3 },
          fx: 'flame'
        },
        {
          name: '普罗米修斯', sub: '普罗米修斯·火之诗', key: 'E', cd: 15, range: 170, type: 'ultimate',
          desc: '盗来的天火浸透全身：8 秒内攻击力提升 60%、移动提速，并立刻打出火焰冲击。',
          hit: { damage: 55, w: 230, h: 190, yOff: -88, knock: 8.5, stun: 34 },
          self: { buff: { dur: 8, power: 0.6, speed: 0.25 } },
          fx: 'flame'
        }
      ]
    },

    // ---------------- 12. 李斯特 ----------------
    {
      id: 'liszt', name: '李斯特', en: 'LISZT', title: '弗朗茨·李斯特',
      quote: '钢琴之王，舞台之魔。',
      stats: { hp: 293, power: 20, speed: 19 },
      desc: '炫技的舞台之王：连击与高速突进，终极技换来回光返照般的巅峰状态。',
      sprite: {
        hair: 'long', hairColor: '#e8e0cc', hairDark: '#a89878',
        coat: ['#2c2438', '#1a1520', '#746e7c'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#110f14', '#0b090d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d4af37', item: 'baton',
        hat: 'wreath',
        earring: true,
        height: 1.02, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '匈牙利狂想曲第二号', sub: '狂想·弗利斯卡', key: 'Q', cd: 5, range: 200, type: 'dashAttack',
          desc: '弗利斯卡舞段越奏越快，突进期间一路连撞对手。',
          dash: { distance: 200, speed: 7.8, damage: 27, w: 63, h: 92, yOff: -76, knock: 5.0, stun: 16 },
          fx: 'trail'
        },
        {
          name: '钟', sub: '钟·高音铃震', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '高音区的钟声层层叠加，大范围音波震荡并让对手陷入耳鸣减速。',
          proj: { kind: 'bell', count: 3, speed: 5.6, w: 28, h: 26, damage: 16, yOff: -86, spacing: 24 },
          status: { kind: 'slow', dur: 3.5, power: 0.4 }
        },
        {
          name: '浮士德交响曲', sub: '浮士德·梅菲斯特终曲', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '与魔鬼签约：四波狂想轰击全场，之后进入 6 秒“巅峰状态”，攻击力提升 25%。',
          hit: { damage: 17, hits: 4, interval: 12, w: 370, h: 200, yOff: -88, knock: 6, stun: 28 },
          self: { buff: { dur: 6, power: 0.25 } },
          fx: 'ragnarok'
        }
      ]
    },

    // ================= 以下为新增的 13 位作曲家 =================
    // 他们使用两套新战斗机制：领域(field) 与 回声(echo)

    // ---------------- 13. J.S.巴赫 ----------------
    {
      id: 'bach', name: 'J.S.巴赫', en: 'BACH', title: '约翰·塞巴斯蒂安·巴赫',
      quote: '一切音乐的目的，都应当是为了荣耀上帝。',
      stats: { hp: 300, power: 18, speed: 15 },
      desc: '复调宗师：以“声部”围攻对手，并用平均律领域持续压制战场。',
      sprite: {
        hair: 'wig', hairColor: '#f4f0e2', hairDark: '#c0b8a0',
        coat: ['#2e2a22', '#1b1814', '#75726d'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#11100e', '#0b0a09'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8d9a0', item: 'organ',
        height: 1, bulk: 1.06, stoop: 1
      },
      skills: [
        {
          name: '赋格的艺术', sub: '声部追逐', key: 'Q', cd: 5, range: 260, type: 'echo',
          desc: '三个声部依次进入：三道巴赫的虚影分别在前、后、上方现身并逐一击出。',
          echo: {
            count: 3, damage: 15, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -70, delay: 10 }, { dx: 70, delay: 22 }, { dx: 0, delay: 34 }]
          },
          fx: 'echoCall'
        },
        {
          name: '平均律键盘曲集', sub: '十二调领域', key: 'W', cd: 5, range: 200, type: 'field',
          desc: '在身旁展开 8 秒的十二调领域：领域内的对手持续受伤并被减速。',
          field: { kind: 'damage', dur: 8, radius: 172, dps: 6, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '马太受难曲', sub: '受难合唱', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '受难合唱轰然响起：展开巨大领域并召出四道合唱虚影同时击打对手。',
          field: { kind: 'damage', dur: 6, radius: 205, dps: 9, tickEvery: 30, slow: 0.5, follow: false },
          echo: {
            count: 4, damage: 12, knock: 3, stun: 16, swing: 'cast',
            spots: [{ dx: -60, delay: 8 }, { dx: 60, delay: 16 }, { dx: -100, delay: 24 }, { dx: 100, delay: 32 }]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 14. 亨德尔 ----------------
    {
      id: 'handel', name: '亨德尔', en: 'HANDEL', title: '乔治·弗里德里希·亨德尔',
      quote: '先生们，如果这不能让你们快乐，我很遗憾。',
      stats: { hp: 307, power: 19, speed: 15 },
      desc: '英伦宫廷大师：用水之领域困住对手，再以哈利路亚合唱层层围击。',
      sprite: {
        hair: 'mane', hairColor: '#f4f0e2', hairDark: '#c8c0a8',
        coat: ['#5a2f3f', '#341b25', '#927680'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#201418', '#140c0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d8b0', item: 'trumpet',
        hat: 'wreath',
        height: 1.02, bulk: 1.1, stoop: 1
      },
      skills: [
        {
          name: '水上音乐', sub: '泰晤士水波', key: 'Q', cd: 5, range: 300, type: 'field',
          desc: '在对手脚下掀起 7 秒水波领域：被困其中的对手举步维艰并持续受伤。',
          field: { kind: 'damage', dur: 7, radius: 180, dps: 6, tickEvery: 30, slow: 0.42, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '弥赛亚', sub: '哈利路亚合唱', key: 'W', cd: 5, range: 280, type: 'echo',
          desc: '四声部合唱从四个方向同时压上，逐句击打对手。',
          echo: {
            count: 4, damage: 13, knock: 2.4, stun: 14, swing: 'cast',
            spots: [{ dx: -80, delay: 10 }, { dx: 80, delay: 18 }, { dx: -40, delay: 26 }, { dx: 40, delay: 34 }]
          },
          fx: 'chorus'
        },
        {
          name: '皇家焰火音乐', sub: '焰火齐鸣', key: 'E', cd: 15, range: 360, type: 'ultimate',
          desc: '皇家焰火在战场炸开：大范围领域灼烧全场，同时三道焰火虚影追击对手。',
          field: { kind: 'damage', dur: 5, radius: 235, dps: 10, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 13, knock: 4, stun: 18, swing: 'kick', spots: [{ dx: -70, delay: 10 }, { dx: 70, delay: 18 }, { dx: 0, delay: 26 }] },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 15. 维瓦尔第 ----------------
    {
      id: 'vivaldi', name: '维瓦尔第', en: 'VIVALDI', title: '安东尼奥·维瓦尔第',
      quote: '四季轮转，皆成音乐。',
      stats: { hp: 286, power: 17, speed: 19 },
      desc: '红发神父：以四季领域统治战场，春可自愈、冬能冻杀，是纯粹的领域型角色。',
      sprite: {
        hair: 'queue', hairColor: '#b04a2a', hairDark: '#6e2c16',
        coat: ['#5a2a24', '#341815', '#92726e'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#1f1110', '#140b0a'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8b878', item: 'violin',
        height: 0.98, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '四季·春', sub: '春之领域', key: 'Q', cd: 5, range: 160, type: 'field',
          desc: '春日重回大地：8 秒的春之领域中自己持续回血，对手则被藤蔓拖慢。',
          field: { kind: 'heal', dur: 8, radius: 172, dps: 3, heal: 2, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '四季·冬', sub: '凛冬之领域', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '寒风骤起：在对手脚下铺开 6 秒冰雪领域，急速冻杀并大幅减速。',
          field: { kind: 'damage', dur: 6, radius: 190, dps: 5, tickEvery: 30, slow: 0.35, follow: false },
          fx: 'frost'
        },
        {
          name: '四季', sub: '四季轮转', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '春夏秋冬接连降临：超长领域伤害随时间不断攀升，同时治疗自己并击飞对手。',
          field: { kind: 'ramp', dur: 10, radius: 225, dps: 4, ramp: 0.12, tickEvery: 30, slow: 0.45, heal: 1, follow: false },
          hit: { damage: 14, w: 300, h: 190, yOff: -86, knock: 7, stun: 30 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 16. J.海顿 ----------------
    {
      id: 'haydn', name: 'J.海顿', en: 'HAYDN', title: '弗朗茨·约瑟夫·海顿',
      quote: '惊愕，是最好的调味料。',
      stats: { hp: 293, power: 16, speed: 19 },
      desc: '交响曲之父：最擅长“惊愕”——虚影会从对手背后突然现身重击。',
      sprite: {
        hair: 'queue', hairColor: '#e8dcc0', hairDark: '#b0a486',
        coat: ['#6a4a2c', '#3d2b1a', '#9d8874'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#251c14', '#18120c'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8c8a0', item: 'baton',
        hat: 'tricorne',
        height: 0.99, bulk: 0.95, stoop: 1
      },
      skills: [
        {
          name: '惊愕交响曲', sub: '惊愕突袭', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '一道虚影毫无预兆地出现在对手背后，一记重击把人掀向前方。',
          echo: {
            count: 1, damage: 22, knock: 5.5, stun: 24, swing: 'kick',
            spots: [{ dx: 92, delay: 24 }]
          },
          fx: 'echoCall'
        },
        {
          name: '时钟交响曲', sub: '滴答时钟', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '滴答作响的时钟领域笼罩对手：7 秒内行动被拖到极慢。',
          field: { kind: 'damage', dur: 7, radius: 182, dps: 4, tickEvery: 30, slow: 0.3, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '创世纪', sub: '创世之光', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '“要有光”：展开巨型光之领域重创对手，同时照亮自身持续回复生命。',
          field: { kind: 'heal', dur: 8, radius: 245, dps: 9, heal: 3, tickEvery: 30, slow: 0.5, follow: false },
          hit: { damage: 20, w: 340, h: 200, yOff: -86, knock: 7.5, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 17. 德沃夏克 ----------------
    {
      id: 'dvorak', name: '德沃夏克', en: 'DVORAK', title: '安东宁·德沃夏克',
      quote: '音乐应当来自人民，唱给人民。',
      stats: { hp: 317, power: 19, speed: 15 },
      desc: '新世界之歌：念故乡的领域为他续航，斯拉夫舞曲的虚影成群冲锋。',
      sprite: {
        hair: 'wavy', hairColor: '#3a322a', hairDark: '#261f19',
        coat: ['#3a4436', '#22271f', '#7d847a'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#161915', '#0e100d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#a8c878', item: 'book',
        hat: 'flatcap',
        beard: true,
        pipe: true,
        height: 1.02, bulk: 1.12, stoop: 2
      },
      skills: [
        {
          name: '第九交响曲', sub: '自新世界·念故乡', key: 'Q', cd: 5, range: 160, type: 'field',
          desc: '思乡的旋律环绕自身 8 秒：持续回复生命，靠近的对手被旋律拖住。',
          field: { kind: 'heal', dur: 8, radius: 178, dps: 4, heal: 2, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '斯拉夫舞曲', sub: '热烈轮舞', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '三道舞者虚影踏着轮舞节拍轮番冲撞，一波接一波。',
          echo: {
            count: 3, damage: 18, knock: 3.4, stun: 16, swing: 'kick',
            spots: [{ dx: -90, delay: 10 }, { dx: 90, delay: 20 }, { dx: 0, delay: 30 }]
          },
          fx: 'trail'
        },
        {
          name: '第九交响曲·第四乐章', sub: '新世界终曲', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '新世界终曲轰然而至：三队虚影先后冲锋，最后由本人撞出决定性一击。',
          echo: { count: 3, damage: 20, knock: 4, stun: 18, swing: 'kick', spots: [{ dx: -100, delay: 10 }, { dx: 100, delay: 20 }, { dx: 0, delay: 30 }] },
          hit: { damage: 32, w: 300, h: 190, yOff: -86, knock: 9, stun: 34 },
          fx: 'impact'
        }
      ]
    },

    // ---------------- 18. 威尔第 ----------------
    {
      id: 'verdi', name: '威尔第', en: 'VERDI', title: '朱塞佩·威尔第',
      quote: '让我们回到过去吧，那才是真正的进步。',
      stats: { hp: 307, power: 21, speed: 15 },
      desc: '歌剧之王：震怒之日的领域与凯旋进行曲的军阵，专打阵地消耗。',
      sprite: {
        hair: 'wild', hairColor: '#c8c0b0', hairDark: '#8a8070',
        coat: ['#3a3038', '#221c20', '#7d767c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161315', '#0e0c0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c86a3a', item: 'trumpet',
        hat: 'tophat',
        beard: true,
        height: 1, bulk: 1.14, stoop: 2
      },
      skills: [
        {
          name: '安魂曲', sub: '震怒之日', key: 'Q', cd: 5, range: 320, type: 'field',
          desc: '震怒之日降临在对手脚下：7 秒内愤怒的烈焰持续灼烧并压制其脚步。',
          field: { kind: 'damage', dur: 7, radius: 192, dps: 8, tickEvery: 30, slow: 0.6, follow: false },
          fx: 'flame'
        },
        {
          name: '阿依达', sub: '凯旋进行曲', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '凯旋的军阵踏步而来：三道士兵虚影依次撞开对手。',
          echo: {
            count: 3, damage: 13, knock: 4.2, stun: 17, swing: 'punch',
            spots: [{ dx: -80, delay: 12 }, { dx: 80, delay: 24 }, { dx: 0, delay: 36 }]
          },
          fx: 'impact'
        },
        {
          name: '安魂曲·末日审判', sub: '末日审判', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '末日号角吹响：超大范围审判领域碾过全场，三道虚影紧随其后补刀。',
          field: { kind: 'damage', dur: 6, radius: 255, dps: 11, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 12, knock: 5, stun: 20, swing: 'kick', spots: [{ dx: -90, delay: 12 }, { dx: 90, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 19. 布鲁克纳 ----------------
    {
      id: 'bruckner', name: '布鲁克纳', en: 'BRUCKNER', title: '安东·布鲁克纳',
      quote: '献给上帝。',
      // v6.0 平衡：他此前 24 战全胜（96% → 100%）。强点不是输出而是
      // 「全场最厚的血 + 跟随自身的减伤领域 + 领域共鸣的移速爆发」三者叠加，
      // 纯伤害杠杆修不到，所以直接下调血上限（346 → 334，仍是第一档）与领域减伤。
      stats: { hp: 334, power: 22, speed: 11 },
      desc: '大教堂般的体格：血量最厚，管风琴领域为自己提供护体减伤。',
      sprite: {
        hair: 'receding', hairColor: '#8a7a5a', hairDark: '#544a34',
        coat: ['#343a42', '#1e2226', '#797d82'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#141618', '#0d0e0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#8fa8c8', item: 'organ',
        hat: 'mortarboard',
        height: 1.08, bulk: 1.24, stoop: 2
      },
      skills: [
        {
          name: '第四交响曲', sub: '浪漫·森林圆号', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '圆号在森林中三度回响：三道虚影由远及近，一次比一次更重。',
          echo: {
            count: 3, damage: 9, knock: 3.6, stun: 18, swing: 'cast',
            spots: [{ dx: -110, delay: 12 }, { dx: 110, delay: 26 }, { dx: 0, delay: 40 }]
          },
          fx: 'echoCall'
        },
        {
          name: '第八交响曲', sub: '大教堂管风琴', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '管风琴轰鸣笼罩自身 9 秒：领域内持续减伤，并震伤靠近的对手。',
          field: { kind: 'armor', dur: 9, radius: 185, dps: 4, tickEvery: 30, armor: 0.22, slow: 0.55, follow: true },
          fx: 'chorus'
        },
        {
          name: '第七交响曲', sub: '瓦格纳挽歌', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '为瓦格纳而作的挽歌：巨型领域层层堆叠轰响，最后以铜管齐鸣击飞对手。',
          field: { kind: 'damage', dur: 7, radius: 262, dps: 6, tickEvery: 24, slow: 0.5, follow: false },
          hit: { damage: 14, w: 340, h: 200, yOff: -88, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 20. 理查·施特劳斯 ----------------
    {
      id: 'strauss', name: '理查·施特劳斯', en: 'R.STRAUSS', title: '理查·施特劳斯',
      quote: '我可以用音乐描写一把汤匙。',
      stats: { hp: 314, power: 23, speed: 14 },
      desc: '交响诗巨匠：日出领域兼具灼烧与自愈，恶作剧的虚影神出鬼没。',
      sprite: {
        hair: 'bald', hairColor: '#6a6055', hairDark: '#3a342c',
        coat: ['#4a4055', '#2b2531', '#88818f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c191f', '#121014'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8a850', item: 'trumpet',
        mustache: true,
        pipe: true,
        height: 1, bulk: 1.08, stoop: 1
      },
      skills: [
        {
          name: '查拉图斯特拉如是说', sub: '日出', key: 'Q', cd: 5, range: 170, type: 'field',
          desc: '日出之光照亮战场 8 秒：灼烧领域内的对手，同时为自己持续回复生命。',
          field: { kind: 'heal', dur: 8, radius: 200, dps: 5, heal: 2, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'chorus'
        },
        {
          name: '蒂尔的恶作剧', sub: '恶作剧回声', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '蒂尔的恶作剧：两道虚影从两侧窜出，狠狠捉弄对手一番。',
          echo: {
            count: 2, damage: 13, knock: 3.4, stun: 17, swing: 'punch',
            spots: [{ dx: -85, delay: 14 }, { dx: 85, delay: 28 }]
          },
          fx: 'echoCall'
        },
        {
          name: '阿尔卑斯山交响曲', sub: '暴风骤雨', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '阿尔卑斯的风暴席卷全场：超大领域雷雨交加，两道虚影在雨中追击。',
          field: { kind: 'damage', dur: 6, radius: 275, dps: 9, tickEvery: 24, slow: 0.45, follow: false },
          echo: { count: 2, damage: 10, knock: 5, stun: 20, swing: 'kick', spots: [{ dx: -90, delay: 14 }, { dx: 90, delay: 28 }] },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 21. 德彪西 ----------------
    {
      id: 'debussy', name: '德彪西', en: 'DEBUSSY', title: '克洛德·德彪西',
      quote: '音乐是色彩与节奏的艺术。',
      stats: { hp: 279, power: 18, speed: 18 },
      desc: '印象派画家：牧神的虚影如梦似幻，海浪领域缓慢而持续地侵蚀对手。',
      sprite: {
        hair: 'wavy', hairColor: '#4a4038', hairDark: '#241f19',
        coat: ['#2f4a6b', '#1b2b3e', '#76889d'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#151c26', '#0d1218'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#c8e0f0', item: 'flute',
        hat: 'beret',
        beard: true,
        height: 0.98, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '牧神午后前奏曲', sub: '牧神之梦', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '牧神的笛声化作三道幻影，在半梦半醒间从各处飘出击中对手。',
          echo: {
            count: 3, damage: 14, knock: 2.2, stun: 20, swing: 'cast',
            spots: [{ dx: -75, delay: 12 }, { dx: 75, delay: 22 }, { dx: 0, delay: 32 }],
            status: { kind: 'slow', dur: 2.5, power: 0.5 }
          },
          fx: 'zzz'
        },
        {
          name: '大海', sub: '浪之嬉戏', key: 'W', cd: 5, range: 320, type: 'field',
          desc: '在对手脚下掀起 8 秒的海浪领域：浪涛反复冲刷，持续受伤并被拖慢。',
          field: { kind: 'damage', dur: 8, radius: 205, dps: 7, tickEvery: 30, slow: 0.5, follow: false },
          fx: 'waves'
        },
        {
          name: '意象集', sub: '意象之海', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整片意象之海倾泻而下：巨型海域吞没全场，三道幻影随浪而至。',
          field: { kind: 'damage', dur: 7, radius: 258, dps: 11, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 14, knock: 4.5, stun: 20, swing: 'cast', spots: [{ dx: -95, delay: 12 }, { dx: 95, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 22. 拉威尔 ----------------
    {
      id: 'ravel', name: '拉威尔', en: 'RAVEL', title: '莫里斯·拉威尔',
      quote: '我不是在作曲，我是在配器。',
      stats: { hp: 286, power: 20, speed: 17 },
      desc: '配器大师：波莱罗领域会越奏越响，拖得越久伤害越可怕。',
      sprite: {
        hair: 'bowl', hairColor: '#3a2f28', hairDark: '#1c1611',
        coat: ['#2a3a4a', '#18222b', '#727d88'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#11161b', '#0b0e11'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b8c8a0', item: 'cane',
        glasses: true,
        height: 0.96, bulk: 0.94, stoop: 0
      },
      skills: [
        {
          name: '波莱罗舞曲', sub: '渐强轮回', key: 'Q', cd: 5, range: 170, type: 'field',
          desc: '波莱罗的主题不断重复并渐强：持续 12 秒，领域伤害随时间越来越高。',
          field: { kind: 'ramp', dur: 12, radius: 178, dps: 4, ramp: 0.15, tickEvery: 30, slow: 0.6, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '鹅妈妈组曲', sub: '童话回声', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '童话里的两位主角化作虚影现身，各自给对手一记奇妙的打击。',
          echo: {
            count: 2, damage: 30, knock: 3, stun: 18, swing: 'punch',
            spots: [{ dx: -80, delay: 14 }, { dx: 80, delay: 26 }]
          },
          fx: 'confetti'
        },
        {
          name: '波莱罗舞曲·终局', sub: '全军齐奏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全乐队齐奏的终局：领域渐强速度翻倍，并以一次全体爆发收尾。',
          field: { kind: 'ramp', dur: 8, radius: 245, dps: 5, ramp: 0.3, tickEvery: 24, slow: 0.5, follow: false },
          hit: { damage: 49, w: 348, h: 200, yOff: -86, knock: 7.5, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 23. 普罗科菲耶夫 ----------------
    {
      id: 'prokofiev', name: '普罗科菲耶夫', en: 'PROKOFIEV', title: '谢尔盖·普罗科菲耶夫',
      quote: '音乐必须简洁，再简洁。',
      stats: { hp: 293, power: 22, speed: 17 },
      desc: '钢铁般的节奏：彼得与狼的群兽虚影轮番扑击，骑士之舞踏碎地面。',
      sprite: {
        hair: 'crop', hairColor: '#6a5a4a', hairDark: '#382e24',
        coat: ['#4a3a3a', '#2b2222', '#887d7d'], coatStyle: 'military',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b1717', '#110e0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e05a4a', item: 'flute',
        mustache: true,
        scarf: true,
        height: 1, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '彼得与狼', sub: '群兽追逐', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '小鸟、鸭子与猫接连登场：三道动物虚影从不同方向扑向对手。',
          echo: {
            count: 3, damage: 13, knock: 3.2, stun: 16, swing: 'kick',
            spots: [{ dx: -85, delay: 10 }, { dx: 85, delay: 20 }, { dx: 0, delay: 30 }]
          },
          fx: 'trail'
        },
        {
          name: '罗密欧与朱丽叶', sub: '骑士之舞', key: 'W', cd: 5, range: 320, type: 'field',
          desc: '骑士之舞沉重地踏在对手脚下 6 秒，每一步都震得人站不稳。',
          field: { kind: 'damage', dur: 6, radius: 188, dps: 8, tickEvery: 30, slow: 0.6, follow: false },
          fx: 'impact'
        },
        {
          name: '亚历山大·涅夫斯基', sub: '冰上之战', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '冰湖之战的号角吹响：冻原领域覆盖全场，三道骑士虚影随后冲阵。',
          field: { kind: 'damage', dur: 8, radius: 252, dps: 8, tickEvery: 24, slow: 0.35, follow: false },
          echo: { count: 3, damage: 12, knock: 5, stun: 20, swing: 'kick', spots: [{ dx: -95, delay: 12 }, { dx: 95, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'frost'
        }
      ]
    },

    // ---------------- 24. 巴托克 ----------------
    {
      id: 'bartok', name: '巴托克', en: 'BARTOK', title: '贝拉·巴托克',
      quote: '民间音乐是我的母语。',
      stats: { hp: 300, power: 21, speed: 16 },
      desc: '民间音乐的采集者：弦乐震音领域持续割伤，血之城堡能把伤害化为自身生命。',
      sprite: {
        hair: 'crop', hairColor: '#9a9088', hairDark: '#5a524a',
        coat: ['#4a3a4a', '#2b222b', '#887d88'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#1c171c', '#110f11'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c090c0', item: 'quill',
        hat: 'flatcap',
        height: 0.99, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '乐队协奏曲', sub: '弦乐震音', key: 'Q', cd: 5, range: 320, type: 'field',
          desc: '弦乐以极快的震音锯过战场 7 秒：领域内的对手持续被割伤。',
          field: { kind: 'damage', dur: 7, radius: 186, dps: 5, tickEvery: 24, slow: 0.55, follow: false },
          fx: 'chromatic'
        },
        {
          name: '罗马尼亚民间舞曲', sub: '民间轮舞', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '六首民间舞曲接连响起：三道舞者虚影以不规则的节拍轮番踢击。',
          echo: {
            count: 3, damage: 8, knock: 3, stun: 16, swing: 'kick',
            spots: [{ dx: -75, delay: 9 }, { dx: 75, delay: 18 }, { dx: 0, delay: 27 }]
          },
          fx: 'notes'
        },
        {
          name: '蓝胡子的城堡', sub: '血之城堡', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '城堡的第七扇门开启：暗色领域持续吸取对手生命，并转化为自己的血量。',
          field: { kind: 'drain', dur: 9, radius: 240, dps: 6, tickEvery: 24, slow: 0.5, drain: 0.35, follow: false },
          hit: { damage: 14, w: 320, h: 200, yOff: -86, knock: 7, stun: 30 },
          fx: 'ghost'
        }
      ]
    },

    // ---------------- 25. 沃恩·威廉斯 ----------------
    {
      id: 'vaughan', name: '沃恩·威廉斯', en: 'V.WILLIAMS', title: '拉尔夫·沃恩·威廉斯',
      quote: '我写的，是英国的音乐。',
      stats: { hp: 300, power: 17, speed: 16 },
      desc: '英伦田园诗人：绿袖子领域温和而持久地维持自己，云雀的虚影高飞奇袭。',
      sprite: {
        hair: 'short', hairColor: '#a89a88', hairDark: '#6a5f50',
        coat: ['#3a4a3a', '#222b22', '#7d887d'], coatStyle: 'sweater',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#171b17', '#0e110e'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#d8e0b0', item: 'book',
        hat: 'straw',
        beard: true,
        glasses: true,
        height: 1, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '云雀高飞', sub: '云雀之回声', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '云雀的鸣叫在空中回荡：两道虚影从高处俯冲，一左一右命中对手。',
          echo: {
            count: 2, damage: 24, knock: 3.4, stun: 18, swing: 'punch',
            spots: [{ dx: -80, delay: 16 }, { dx: 80, delay: 30 }]
          },
          fx: 'notes'
        },
        {
          name: '绿袖子幻想曲', sub: '绿袖子领域', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '古老的旋律铺满地面 9 秒：自己在其间缓缓回血，对手则被绊住脚步。',
          field: { kind: 'heal', dur: 9, radius: 182, dps: 4, heal: 2, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '塔利斯主题幻想曲', sub: '弦乐圣咏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '弦乐圣咏层层叠加：巨型领域笼罩全场，三声部虚影在圣咏中依次落下。',
          field: { kind: 'heal', dur: 8, radius: 248, dps: 14, heal: 2, tickEvery: 30, slow: 0.5, follow: false },
          echo: { count: 3, damage: 19, knock: 4, stun: 18, swing: 'cast', spots: [{ dx: -85, delay: 12 }, { dx: 85, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'chorus'
        }
      ]
    },

    // ================= 以下为 3.0 新增的 25 位作曲家 =================
    // 三套新体系：乐章(movement) / 回旋(rondo) / 卡农(canon)

    // ---------------- 26~35：「乐章」体系 ----------------
    // 技能会展开一段多段式乐章，按拍点自动连续发动不同招式，
    // 期间施法者不被锁定，可以自由走位与出招。

    // ---------------- 26. 柴可夫斯基 ----------------
    {
      id: 'tchaikovsky', name: '柴可夫斯基', en: 'TCHAIKOVSKY', title: '彼得·伊里奇·柴可夫斯基',
      quote: '灵感是不请自来的客人。',
      stats: { hp: 293, power: 20, speed: 16 },
      desc: '芭蕾大师：以四小天鹅的连环乐章压迫对手，末段以 1812 的炮声收束。',
      sprite: {
        hair: 'curly', hairColor: '#c8c8c0', hairDark: '#8a8a82',
        coat: ['#2f3a4a', '#1b222b', '#767d88'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#13161b', '#0c0e11'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#e8e0f0', item: 'baton',
        height: 1, bulk: 1.06, stoop: 1
      },
      skills: [
        {
          name: '天鹅湖', sub: '四小天鹅之舞', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '四小天鹅依次登场，四段轻快踢击自动连奏，期间仍可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 122, knock: 1.8, stun: 10, anim: 'kick', fx: 'notes' },
              { delay: 14, damage: 9, w: 130, knock: 2.0, stun: 11, anim: 'kick', fx: 'notes' },
              { delay: 28, damage: 10, w: 138, knock: 2.4, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 42, damage: 14, w: 156, knock: 4.5, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '罗密欧与朱丽叶', sub: '幻想序曲', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '爱情主题与家族仇恨的动机交替冲出，两道音波先后命中对手。',
          proj: { kind: 'dream', count: 2, speed: 5.0, w: 30, h: 30, damage: 12, yOff: -82, spacing: 26 },
          status: { kind: 'slow', dur: 3, power: 0.55 },
          fx: 'zzz'
        },
        {
          name: '1812序曲', sub: '炮声终曲', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '钟声、炮声与凯旋主题轮番轰鸣：五段乐章依次炸开，末段以礼炮击飞对手。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 200, knock: 1.5, stun: 10, anim: 'cast', fx: 'waves' },
              { delay: 14, damage: 10, w: 230, knock: 2, stun: 12, anim: 'cast', fx: 'impact' },
              { delay: 30, damage: 12, w: 260, knock: 3, stun: 14, anim: 'kickSkill', fx: 'flame' },
              { delay: 46, damage: 14, w: 290, knock: 4, stun: 16, anim: 'cast', fx: 'ragnarok' },
              { delay: 64, damage: 20, w: 340, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 27. 门德尔松 ----------------
    {
      id: 'mendelssohn', name: '门德尔松', en: 'MENDELSSOHN', title: '费利克斯·门德尔松',
      quote: '音乐是比语言更精确的表达。',
      stats: { hp: 286, power: 18, speed: 19 },
      desc: '优雅而迅捷：婚礼进行曲与仲夏夜之梦的乐章连绵不断，终曲直入芬格尔山洞。',
      sprite: {
        hair: 'curly', hairColor: '#2e2620', hairDark: '#15100c',
        coat: ['#2a3c5a', '#182334', '#727e92'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#121720', '#0b0f14'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#c8e0a0', item: 'baton',
        height: 0.98, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '仲夏夜之梦', sub: '婚礼进行曲', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '庄严的进行曲踏拍而来：三段行进击打自动展开，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 128, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 16, damage: 9, w: 140, knock: 3.0, stun: 14, anim: 'kick', fx: 'notes' },
              { delay: 32, damage: 12, w: 162, knock: 4.6, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '无词歌', sub: '春之歌', key: 'W', cd: 5, range: 320, type: 'movement',
          desc: '春之歌在战场上回响两段，并为自己回复生命。',
          self: { heal: 18 },
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 150, knock: 1.5, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 20, damage: 10, w: 176, knock: 2.6, stun: 15, anim: 'cast', fx: 'zzz' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '芬格尔山洞序曲', sub: '赫布里底', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '海浪的动机层层堆叠成五段乐章，最终以整片海潮把对手卷走。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 210, knock: 1.5, stun: 10, anim: 'cast', fx: 'waves' },
              { delay: 14, damage: 7, w: 240, knock: 2, stun: 11, anim: 'cast', fx: 'waves' },
              { delay: 28, damage: 8, w: 270, knock: 2.5, stun: 13, anim: 'cast', fx: 'waves' },
              { delay: 44, damage: 10, w: 300, knock: 3.5, stun: 15, anim: 'kickSkill', fx: 'waves' },
              { delay: 62, damage: 15, w: 350, knock: 8.5, stun: 33, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 28. 肖邦 ----------------
    {
      id: 'chopin', name: '肖邦', en: 'CHOPIN', title: '弗里德里克·肖邦',
      quote: '请把我的心脏送回华沙。',
      stats: { hp: 271, power: 19, speed: 18 },
      desc: '钢琴诗人：革命练习曲的激流与夜曲的静谧交替奏出，终以英雄波兰舞曲收场。',
      sprite: {
        hair: 'long', hairColor: '#8a6a4a', hairDark: '#4e3820',
        coat: ['#3a2f45', '#221b28', '#7d7684'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161319', '#0e0c10'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#e0d8c0', item: 'watch',
        height: 0.95, bulk: 0.95, stoop: 1
      },
      skills: [
        {
          name: '革命练习曲', sub: '华沙陷落', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '左手激流般的琶音化为四段连续冲击，越打越快。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 124, knock: 1.6, stun: 10, anim: 'punch', fx: 'chromatic' },
              { delay: 10, damage: 9, w: 132, knock: 1.8, stun: 10, anim: 'punch', fx: 'chromatic' },
              { delay: 20, damage: 10, w: 140, knock: 2.2, stun: 12, anim: 'kick', fx: 'chromatic' },
              { delay: 32, damage: 15, w: 166, knock: 5.0, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '夜曲', sub: '降E大调夜曲', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '两段柔美的夜曲缠住对手的脚步，命中后令其行动迟缓。',
          status: { kind: 'slow', dur: 3.5, power: 0.5 },
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 160, knock: 1.2, stun: 12, anim: 'cast', fx: 'zzz' },
              { delay: 24, damage: 11, w: 184, knock: 2.2, stun: 15, anim: 'cast', fx: 'zzz' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '英雄波兰舞曲', sub: '英雄', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '五段波兰舞曲气势层层推进，末段以英雄主题的强奏把对手掀翻。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 14, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 28, damage: 11, w: 265, knock: 3, stun: 14, anim: 'punch', fx: 'flame' },
              { delay: 44, damage: 13, w: 300, knock: 4, stun: 16, anim: 'kickSkill', fx: 'flame' },
              { delay: 62, damage: 20, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 29. 舒伯特 ----------------
    {
      id: 'schubert', name: '舒伯特', en: 'SCHUBERT', title: '弗朗茨·舒伯特',
      quote: '我的音乐诞生于歌唱。',
      stats: { hp: 293, power: 18, speed: 17 },
      desc: '歌曲之王：魔王的疾驰节奏与菩提树的温柔旋律接连奏出。',
      sprite: {
        hair: 'curly', hairColor: '#6a5240', hairDark: '#3a2c20',
        coat: ['#4a4436', '#2b271f', '#88847a'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b1a16', '#11100e'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#c8d0a0', item: 'violin',
        glasses: true,
        height: 0.98, bulk: 0.99, stoop: 0
      },
      skills: [
        {
          name: '魔王', sub: 'Erlkönig', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '马蹄般的三连音疾驰而来：四段冲锋式乐章自动连奏。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 130, knock: 2.4, stun: 12, anim: 'kick', fx: 'trail' },
              { delay: 13, damage: 8, w: 140, knock: 2.8, stun: 13, anim: 'punch', fx: 'trail' },
              { delay: 26, damage: 9, w: 150, knock: 3.2, stun: 14, anim: 'kick', fx: 'chromatic' },
              { delay: 40, damage: 13, w: 172, knock: 5.2, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '菩提树', sub: '冬之旅', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '菩提树下的回忆抚慰自身并击退靠近的对手。',
          self: { heal: 14 },
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 152, knock: 2.0, stun: 13, anim: 'cast', fx: 'notes' },
              { delay: 22, damage: 10, w: 178, knock: 3.4, stun: 16, anim: 'cast', fx: 'zzz' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '未完成交响曲', sub: '未完成', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '只写了两个乐章的杰作在此补完：五段乐章倾泻而出。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'notes' },
              { delay: 15, damage: 8, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 30, damage: 10, w: 265, knock: 3, stun: 14, anim: 'kick', fx: 'waves' },
              { delay: 46, damage: 11, w: 300, knock: 4, stun: 16, anim: 'kickSkill', fx: 'waves' },
              { delay: 64, damage: 16, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 30. 格什温 ----------------
    {
      id: 'gershwin', name: '格什温', en: 'GERSHWIN', title: '乔治·格什温',
      quote: '爵士乐就是美国的民间音乐。',
      stats: { hp: 286, power: 19, speed: 18 },
      desc: '爵士交响：蓝色狂想曲的滑音与夏日时光的慵懒交织成连绵乐章。',
      sprite: {
        hair: 'curly', hairColor: '#2a2a2a', hairDark: '#111111',
        coat: ['#585c66', '#33353b', '#91939a'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#222326', '#151618'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d060', item: 'baton',
        hat: 'flatcap',
        mustache: true,
        height: 1, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '蓝色狂想曲', sub: 'Rhapsody in Blue', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '单簧管的滑音一路爬升：四段爵士乐句自动连奏。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 126, knock: 2.0, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 13, damage: 7, w: 136, knock: 2.4, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 26, damage: 8, w: 146, knock: 2.8, stun: 13, anim: 'cast', fx: 'confetti' },
              { delay: 40, damage: 11, w: 170, knock: 5.0, stun: 19, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '一个美国人在巴黎', sub: '巴黎漫步', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '在巴黎街头边走边奏：三段轻快的乐章，期间可自由移动。',
          movement: {
            stanzas: [
              { delay: 0, damage: 5, w: 130, knock: 1.8, stun: 10, anim: 'punch', fx: 'trail' },
              { delay: 16, damage: 6, w: 142, knock: 2.2, stun: 12, anim: 'punch', fx: 'trail' },
              { delay: 32, damage: 8, w: 160, knock: 2.8, stun: 14, anim: 'kick', fx: 'confetti' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '波吉与贝丝', sub: '夏日时光', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '夏日时光降临：五段乐章舒缓却沉重，并为自身回复生命。',
          self: { heal: 21 },
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'zzz' },
              { delay: 15, damage: 7, w: 235, knock: 2.2, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 30, damage: 8, w: 265, knock: 3, stun: 14, anim: 'punch', fx: 'confetti' },
              { delay: 46, damage: 9, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'confetti' },
              { delay: 64, damage: 14, w: 350, knock: 8.5, stun: 33, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 31. 格里格 ----------------
    {
      id: 'grieg', name: '格里格', en: 'GRIEG', title: '爱德华·格里格',
      quote: '我在挪威的山水间听见了音乐。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '北国之声：山魔王的殿堂中步步逼近，越到后段杀伤越重。',
      sprite: {
        hair: 'wild', hairColor: '#e0dcd0', hairDark: '#a8a49a',
        coat: ['#2f4a3a', '#1b2b22', '#76887d'], coatStyle: 'sweater',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#131b16', '#0c110e'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#b8e0a8', item: 'baton',
        hat: 'straw',
        mustache: true,
        height: 0.98, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '在山魔王的宫殿里', sub: '山魔王的殿堂', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '同一主题反复逼近、一次比一次响：四段乐章伤害逐段攀升。',
          movement: {
            stanzas: [
              { delay: 0, damage: 4, w: 124, knock: 1.5, stun: 10, anim: 'punch', fx: 'impact' },
              { delay: 15, damage: 6, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 8, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'impact' },
              { delay: 46, damage: 12, w: 176, knock: 5.4, stun: 20, anim: 'kickSkill', fx: 'ragnarok' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '培尔·金特', sub: '晨景', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '晨光洒落：两段温柔的乐章并为自己回复生命。',
          self: { heal: 16 },
          movement: {
            stanzas: [
              { delay: 0, damage: 5, w: 154, knock: 1.8, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 22, damage: 8, w: 180, knock: 3.0, stun: 15, anim: 'cast', fx: 'chorus' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: 'a小调钢琴协奏曲', sub: '钢琴协奏曲', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '钢琴下行的洪流与乐队齐奏交错：五段乐章一气呵成。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'chromatic' },
              { delay: 15, damage: 7, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 8, w: 265, knock: 3, stun: 14, anim: 'cast', fx: 'waves' },
              { delay: 46, damage: 9, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'ragnarok' },
              { delay: 64, damage: 13, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 32. 斯特拉文斯基 ----------------
    {
      id: 'stravinsky', name: '斯特拉文斯基', en: 'STRAVINSKY', title: '伊戈尔·斯特拉文斯基',
      quote: '春之祭首演那天，观众打了起来。',
      stats: { hp: 300, power: 22, speed: 16 },
      desc: '原始主义的重音机器：不规则的重拍连续砸下，节奏越乱伤害越重。',
      sprite: {
        hair: 'bald', hairColor: '#6a6058', hairDark: '#38322c',
        coat: ['#3a3a44', '#222227', '#7d7d84'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#161619', '#0e0e10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d88a3a', item: 'baton',
        mustache: true,
        glasses: true,
        height: 1, bulk: 1.08, stoop: 0
      },
      skills: [
        {
          name: '春之祭', sub: '献祭之舞', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '不规则的重音接连砸下：四段乐章，间隔忽长忽短，极难预判。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 128, knock: 2.2, stun: 13, anim: 'punch', fx: 'impact' },
              { delay: 9, damage: 8, w: 136, knock: 2.4, stun: 13, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 9, w: 148, knock: 3.0, stun: 15, anim: 'kick', fx: 'ragnarok' },
              { delay: 36, damage: 11, w: 178, knock: 5.6, stun: 20, anim: 'kickSkill', fx: 'ragnarok' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '火鸟', sub: '火鸟之舞', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '火鸟振翅三次，羽焰依次扫过对手并造成灼伤。',
          status: { kind: 'bleed', dur: 3, dps: 4 },
          movement: {
            stanzas: [
              { delay: 0, damage: 5, w: 150, knock: 2.0, stun: 12, anim: 'cast', fx: 'flame' },
              { delay: 14, damage: 7, w: 168, knock: 2.6, stun: 14, anim: 'kick', fx: 'flame' },
              { delay: 28, damage: 9, w: 190, knock: 3.6, stun: 16, anim: 'kickSkill', fx: 'flame' }
            ]
          },
          fx: 'flame'
        },
        {
          name: '春之祭·大地的祭献', sub: '大地的祭献', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '终幕的献祭之舞：六段重音狂潮以极端的不规则节奏碾过全场。',
          movement: {
            stanzas: [
              { delay: 0, damage: 5, w: 210, knock: 1.5, stun: 10, anim: 'punch', fx: 'impact' },
              { delay: 10, damage: 6, w: 240, knock: 2, stun: 11, anim: 'punch', fx: 'impact' },
              { delay: 26, damage: 7, w: 265, knock: 2.6, stun: 13, anim: 'kick', fx: 'ragnarok' },
              { delay: 36, damage: 7, w: 295, knock: 3.2, stun: 15, anim: 'kick', fx: 'ragnarok' },
              { delay: 54, damage: 9, w: 320, knock: 4.5, stun: 18, anim: 'kickSkill', fx: 'flame' },
              { delay: 72, damage: 14, w: 370, knock: 9.5, stun: 36, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 33. 陈其钢 ----------------
    {
      id: 'chenqigang', name: '陈其钢', en: 'CHEN QIGANG', title: '陈其钢',
      quote: '我在东西方之间寻找自己的声音。',
      stats: { hp: 279, power: 19, speed: 17 },
      desc: '东方意境与现代技法的融合：蝶恋花的乐句轻柔却绵密不绝。',
      sprite: {
        hair: 'bowl', hairColor: '#241f1c', hairDark: '#0e0c0a',
        coat: ['#5a3a2a', '#342218', '#927d72'], coatStyle: 'kimono',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#201712', '#140e0b'],
        skin: ['#e0b183', '#a87c52'], accent: '#d0b8f0', item: 'fan',
        height: 0.98, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '蝶恋花', sub: '蝶恋花', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '蝶与花的乐句往复缠绕：三段乐章轻盈而绵密。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 128, knock: 1.6, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 18, damage: 10, w: 144, knock: 2.2, stun: 13, anim: 'cast', fx: 'notes' },
              { delay: 36, damage: 15, w: 170, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'confetti' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '走西口', sub: '走西口', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '西北民歌的苍凉旋律两段推进，命中后拖慢对手。',
          status: { kind: 'slow', dur: 3, power: 0.5 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 152, knock: 2.0, stun: 12, anim: 'punch', fx: 'trail' },
              { delay: 24, damage: 12, w: 178, knock: 3.2, stun: 16, anim: 'kick', fx: 'impact' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '万年欢', sub: '万年欢', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '喜庆的曲牌被拉长成五段乐章，锣鼓与乐队交替轰鸣。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'confetti' },
              { delay: 15, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'confetti' },
              { delay: 30, damage: 11, w: 265, knock: 3, stun: 14, anim: 'kick', fx: 'impact' },
              { delay: 46, damage: 13, w: 300, knock: 4, stun: 16, anim: 'cast', fx: 'notes' },
              { delay: 64, damage: 19, w: 350, knock: 8.5, stun: 33, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 34. 布里顿 ----------------
    {
      id: 'britten', name: '布里顿', en: 'BRITTEN', title: '本杰明·布里顿',
      quote: '为大众而写的音乐才有生命。',
      stats: { hp: 286, power: 20, speed: 16 },
      desc: '变奏大师：同一主题被拆成不同“乐器”，一段段递进碾过对手。',
      sprite: {
        hair: 'bowl', hairColor: '#8a7a5a', hairDark: '#4e4432',
        coat: ['#25405e', '#152537', '#6f8195'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#111821', '#0b0f15'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#7ec8e0', item: 'baton',
        scarf: true,
        height: 1, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '青少年管弦乐队指南', sub: '普赛尔主题变奏', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '主题之后是铜管、木管、弦乐与打击乐的变奏：四段乐章各具音色。',
          movement: {
            stanzas: [
              { delay: 0, damage: 5, w: 126, knock: 1.8, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 15, damage: 7, w: 138, knock: 2.2, stun: 12, anim: 'punch', fx: 'chromatic' },
              { delay: 30, damage: 8, w: 150, knock: 2.6, stun: 13, anim: 'kick', fx: 'waves' },
              { delay: 46, damage: 11, w: 176, knock: 5.0, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '战争安魂曲', sub: '战争安魂曲', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '安魂的钟声三次落下，末段沉重而决绝。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 150, knock: 1.8, stun: 12, anim: 'cast', fx: 'impact' },
              { delay: 20, damage: 7, w: 168, knock: 2.4, stun: 14, anim: 'cast', fx: 'waves' },
              { delay: 40, damage: 11, w: 192, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '彼得·格兰姆斯', sub: '四海之间', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '四首海之间奏曲联结成五段乐章，末段以海浪吞没对手。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'waves' },
              { delay: 15, damage: 7, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'waves' },
              { delay: 30, damage: 8, w: 265, knock: 3, stun: 14, anim: 'kick', fx: 'frost' },
              { delay: 46, damage: 9, w: 300, knock: 4, stun: 16, anim: 'cast', fx: 'waves' },
              { delay: 64, damage: 13, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 35. 武满彻 ----------------
    {
      id: 'takemitsu', name: '武满彻', en: 'TAKEMITSU', title: '武满彻',
      quote: '我希望音乐像庭园里的光影一样流动。',
      stats: { hp: 271, power: 20, speed: 18 },
      desc: '音色与留白的大师：尺八与琵琶的音色交错，乐句之间留有呼吸。',
      sprite: {
        hair: 'mop', hairColor: '#1e1a18', hairDark: '#0a0908',
        coat: ['#2f3a5e', '#1b2237', '#767d95'], coatStyle: 'kimono',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#141721', '#0c0e15'],
        skin: ['#e0b183', '#a87c52'], accent: '#b0e0d8', item: 'flute',
        glasses: true,
        height: 0.98, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '十一月的阶梯', sub: 'November Steps', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '尺八与琵琶交替发问：三段乐句之间留有大片沉默，落点难以预判。',
          movement: {
            stanzas: [
              { delay: 0, damage: 11, w: 132, knock: 2.0, stun: 14, anim: 'cast', fx: 'chromatic' },
              { delay: 26, damage: 12, w: 148, knock: 2.6, stun: 15, anim: 'cast', fx: 'ghost' },
              { delay: 52, damage: 15, w: 176, knock: 5.0, stun: 20, anim: 'kickSkill', fx: 'waves' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '群星', sub: '星际', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '星群的微光散落成两段乐句，命中后令对手陷入恍惚减速。',
          status: { kind: 'slow', dur: 3.5, power: 0.5 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 158, knock: 1.6, stun: 13, anim: 'cast', fx: 'zzz' },
              { delay: 28, damage: 12, w: 182, knock: 2.8, stun: 16, anim: 'cast', fx: 'notes' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '雨树', sub: '雨树', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '雨滴落在树上的万千声响化为五段乐章，末段以整片音色的洪流收束。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'shard' },
              { delay: 16, damage: 9, w: 235, knock: 2.2, stun: 12, anim: 'cast', fx: 'frost' },
              { delay: 32, damage: 10, w: 265, knock: 3, stun: 14, anim: 'punch', fx: 'ghost' },
              { delay: 48, damage: 12, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'waves' },
              { delay: 66, damage: 18, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'chorus'
        }
      ]
    },
    // ---------------- 36~41：「回旋」体系 ----------------
    // 技能放出的乐句会飞到尽头再折返；去程与回程各判定一次，
    // 回程命中会把对手向施法者方向拖拽（咏叹调的引力）。

    // ---------------- 36. H.普赛尔 ----------------
    {
      id: 'purcell', name: 'H.普赛尔', en: 'PURCELL', title: '亨利·普赛尔',
      quote: '音乐是灵魂的语言。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '英伦巴洛克之魂：狄多的哀歌去而复返，回程把对手拖回自己面前。',
      sprite: {
        hair: 'wig', hairColor: '#d8c8a8', hairDark: '#a08c68',
        coat: ['#4a3550', '#2b1f2e', '#887a8c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c161d', '#110e13'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8d0a8', item: 'baton',
        height: 0.99, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '狄多与埃涅阿斯', sub: '狄多的哀歌', key: 'Q', cd: 5, range: 300, type: 'rondo',
          desc: '哀歌飞出后折返：去程擦伤、回程重击，并把对手拖向自己。',
          rondo: { kind: 'lute', count: 1, speed: 6.6, range: 300, w: 30, h: 30, damage: 11, backDamage: 18, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '小号奏鸣曲', sub: '号角与号管', key: 'W', cd: 5, range: 320, type: 'projectile',
          desc: '三声嘹亮的号角依次射出，命中后使对手陷入耳鸣减速。',
          proj: { kind: 'flute', count: 3, speed: 7.0, w: 26, h: 26, damage: 9, yOff: -84, spacing: 20 },
          status: { kind: 'slow', dur: 3, power: 0.5 },
          fx: 'notes'
        },
        {
          name: '仙后', sub: '仙后·回旋终曲', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '三道仙乐同时飞出并折返，回程全部命中时会把对手反复拖拽。',
          rondo: { kind: 'fairy', count: 3, speed: 7.4, range: 380, w: 30, h: 30, damage: 12, backDamage: 16, yOff: -84, spreadY: 34, pull: true },
          hit: { damage: 16, w: 300, h: 190, yOff: -86, knock: 7, stun: 30 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 37. 柏辽兹 ----------------
    {
      id: 'berlioz', name: '柏辽兹', en: 'BERLIOZ', title: '埃克托·柏辽兹',
      quote: '我要用音乐写一部小说。',
      stats: { hp: 300, power: 21, speed: 15 },
      desc: '固定乐思的执念：同一条旋律一次次回来，每次都更强烈。',
      sprite: {
        hair: 'wild', hairColor: '#8a3a20', hairDark: '#4e1e0c',
        coat: ['#3a2f3a', '#221b22', '#7d767d'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161316', '#0e0c0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e07840', item: 'baton',
        hat: 'tophat',
        beard: true,
        height: 1.02, bulk: 1.1, stoop: 1
      },
      skills: [
        {
          name: '幻想交响曲', sub: '固定乐思', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '那条挥之不去的旋律飞出去又回来，回程带着更重的执念。',
          rondo: { kind: 'idee', count: 1, speed: 6.2, range: 320, w: 32, h: 32, damage: 10, backDamage: 16, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '罗马狂欢节', sub: '狂欢节序曲', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '盐舞的节拍弹跳而来：三段乐章快速连奏，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 128, knock: 2.0, stun: 11, anim: 'punch', fx: 'confetti' },
              { delay: 12, damage: 8, w: 138, knock: 2.4, stun: 12, anim: 'kick', fx: 'confetti' },
              { delay: 24, damage: 11, w: 156, knock: 3.4, stun: 15, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '安魂曲', sub: '末日审判', key: 'E', cd: 15, range: 440, type: 'ultimate',
          desc: '末日号角化作三道回旋的巨浪，去程与回程各判一次，最后以审判重击收尾。',
          rondo: { kind: 'idee', count: 3, speed: 7.0, range: 400, w: 34, h: 34, damage: 11, backDamage: 14, yOff: -84, spreadY: 40, pull: true },
          hit: { damage: 16, w: 320, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 38. 蒙特威尔第 ----------------
    {
      id: 'monteverdi', name: '蒙特威尔第', en: 'MONTEVERDI', title: '克劳迪奥·蒙特威尔第',
      quote: '歌词应当是音乐的主人。',
      stats: { hp: 293, power: 19, speed: 16 },
      desc: '歌剧之父：奥菲欧的咏叹去而复返，晚祷为自身铺开庇护。',
      sprite: {
        hair: 'crop', hairColor: '#5a5248', hairDark: '#2c2822',
        coat: ['#3f2b18', '#25190e', '#807367'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#16100b', '#0e0a07'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0c8b0', item: 'lute',
        beard: true,
        height: 1, bulk: 1.06, stoop: 2
      },
      skills: [
        {
          name: '奥菲欧', sub: '奥菲欧的咏叹', key: 'Q', cd: 5, range: 310, type: 'rondo',
          desc: '向冥界唱出的咏叹飞出又折返，回程把对手拖向自己。',
          rondo: { kind: 'aria', count: 1, speed: 6.4, range: 310, w: 30, h: 30, damage: 10, backDamage: 17, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '圣母晚祷', sub: '晚祷', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '晚祷的圣咏在地面铺开 8 秒：自己持续回血并减伤，靠近的对手被拖慢。',
          field: { kind: 'armor', dur: 8, radius: 176, dps: 4, heal: 2, tickEvery: 30, armor: 0.3, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '波佩阿的加冕', sub: '加冕', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '加冕的号角三度回旋，每次回程都更重，最后以合唱收束。',
          rondo: { kind: 'aria', count: 2, speed: 6.8, range: 380, w: 32, h: 32, damage: 11, backDamage: 17, yOff: -84, spreadY: 40, pull: true },
          hit: { damage: 17, w: 300, h: 195, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 39. 约翰·道兰德 ----------------
    {
      id: 'dowland', name: '约翰·道兰德', en: 'DOWLAND', title: '约翰·道兰德',
      quote: 'music is the food of love... 让音乐喂饱爱情。',
      stats: { hp: 279, power: 17, speed: 18 },
      desc: '鲁特琴的歌者：泪珠般的音符去而复返，把对手拖进昏沉的睡眠。',
      sprite: {
        hair: 'braids', hairColor: '#7a5a3a', hairDark: '#422e1c',
        coat: ['#4a2a3a', '#2b1822', '#88727d'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b1116', '#110b0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#a8d8ff', item: 'lute',
        mustache: true,
        height: 0.97, bulk: 0.96, stoop: 0
      },
      skills: [
        {
          name: '泪之帕凡舞曲', sub: '七滴泪', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '一滴泪飞出又落下：去程轻、回程重，并把对手拖向自己。',
          rondo: { kind: 'tear', count: 1, speed: 7.0, range: 320, w: 26, h: 26, damage: 10, backDamage: 20, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '来吧，深沉的睡眠', sub: '沉睡之歌', key: 'W', cd: 5, range: 280, type: 'echo',
          desc: '睡意化作两道虚影从两侧合拢，命中后令对手昏沉难行。',
          echo: {
            count: 2, damage: 10, knock: 1.5, stun: 26, swing: 'cast',
            spots: [{ dx: -70, delay: 16 }, { dx: 70, delay: 30 }],
            status: { kind: 'slow', dur: 4, power: 0.45 }
          },
          fx: 'zzz'
        },
        {
          name: '泪之终章', sub: '泪·终章', key: 'E', cd: 15, range: 440, type: 'ultimate',
          desc: '七滴泪同时化作回旋的旋律，去程与回程反复冲刷对手。',
          rondo: { kind: 'tear', count: 3, speed: 7.6, range: 400, w: 28, h: 28, damage: 11, backDamage: 17, yOff: -84, spreadY: 38, pull: true },
          hit: { damage: 17, w: 300, h: 190, yOff: -86, knock: 7, stun: 30 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 40. 乔普林 ----------------
    {
      id: 'joplin', name: '乔普林', en: 'JOPLIN', title: '斯科特·乔普林',
      quote: '拉格泰姆永远不会过时。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '拉格泰姆之王：切分的乐句弹出去又跳回来，节奏永远让人站不稳。',
      sprite: {
        hair: 'mop', hairColor: '#241c16', hairDark: '#0e0a07',
        coat: ['#5a3a1e', '#342211', '#927d6b'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#1f160e', '#140e09'],
        skin: ['#c39064', '#8b5c3a'], accent: '#e8b060', item: 'baton',
        hat: 'straw',
        mustache: true,
        height: 1, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '枫叶拉格', sub: 'Maple Leaf Rag', key: 'Q', cd: 5, range: 310, type: 'rondo',
          desc: '切分的乐句弹射而出又倒着跳回来，回程把对手拉近。',
          rondo: { kind: 'rag', count: 1, speed: 7.2, range: 310, w: 28, h: 28, damage: 11, backDamage: 17, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '艺人', sub: 'The Entertainer', key: 'W', cd: 5, range: 170, type: 'multiHit',
          desc: '钢琴左手的跳跃伴奏化为五连击，快而零碎。',
          hit: { damage: 6, hits: 5, interval: 6, w: 112, h: 88, yOff: -78, knock: 1.0, stun: 12 },
          fx: 'notes'
        },
        {
          name: '拉格泰姆终曲', sub: '拉格终曲', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '三段拉格同时飞出并折返，整个舞台都在切分节奏里摇晃。',
          rondo: { kind: 'rag', count: 3, speed: 7.8, range: 380, w: 30, h: 30, damage: 12, backDamage: 16, yOff: -84, spreadY: 36, pull: true },
          hit: { damage: 16, w: 300, h: 190, yOff: -86, knock: 7, stun: 30 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 41. 卡普斯汀 ----------------
    {
      id: 'kapustin', name: '卡普斯汀', en: 'KAPUSTIN', title: '尼古拉·卡普斯汀',
      quote: '爵士与古典，本来就是一回事。',
      stats: { hp: 293, power: 20, speed: 16 },
      desc: '爵士与古典的混血：练习曲的乐句弹出去又旋回来，一路摇摆。',
      sprite: {
        hair: 'short', hairColor: '#5a4a3a', hairDark: '#2e2418',
        coat: ['#7a5a2a', '#473418', '#a79272'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2214', '#1b150d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8a2c8', item: 'wineglass',
        hat: 'beret',
        height: 1, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '爵士练习曲', sub: '练习曲 Op.40', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '快速的爵士音型冲出后倒卷回来，回程的切分重音更重。',
          rondo: { kind: 'rag', count: 1, speed: 7.4, range: 320, w: 30, h: 30, damage: 12, backDamage: 18, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '爵士前奏曲', sub: '前奏曲', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '两段蓝调音阶先后射出，命中后让对手短暂失去节奏。',
          proj: { kind: 'rhapsody', count: 2, speed: 6.4, w: 26, h: 30, damage: 11, yOff: -82, spacing: 24 },
          status: { kind: 'slow', dur: 3, power: 0.5 },
          fx: 'notes'
        },
        {
          name: '第二钢琴协奏曲', sub: '爵士终曲', key: 'E', cd: 15, range: 440, type: 'ultimate',
          desc: '钢琴与乐队的对话被拆成三道回旋乐句，去程回程反复碾过对手。',
          rondo: { kind: 'rag', count: 3, speed: 7.6, range: 400, w: 32, h: 32, damage: 13, backDamage: 17, yOff: -84, spreadY: 40, pull: true },
          hit: { damage: 18, w: 310, h: 195, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 42~50：「卡农」体系 ----------------
    // 开启后的一段时间内，自己的每一次命中都会被一个延后的“模仿声部”
    // 重奏一次（额外伤害 + 虚影挥击），对位越密伤害越高。

    // ---------------- 42. 拉莫 ----------------
    {
      id: 'rameau', name: '拉莫', en: 'RAMEAU', title: '让-菲利普·拉莫',
      quote: '和声自有其法则。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '和声理论之父：写下和声法则后，你的每一击都会被一个声部模仿重奏。',
      sprite: {
        hair: 'wig', hairColor: '#e8e0c8', hairDark: '#b0a888',
        coat: ['#4a4a6a', '#2b2b3d', '#88889d'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1d1d26', '#121218'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0e0b0', item: 'book',
        hat: 'tricorne',
        height: 1, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '和声论', sub: '和声的法则', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '写下 6 秒的和声法则：期间你的每次命中都会被一个模仿声部延迟重奏一次。',
          hit: { damage: 27, w: 144, h: 96, yOff: -80, knock: 3, stun: 16 },
          canon: { dur: 6, delay: 24, ratio: 0.71 },
          fx: 'canonMark'
        },
        {
          name: '鸟之呼唤', sub: '鸟鸣', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '三段模仿鸟鸣的乐句依次射出，击中后拖慢对手。',
          proj: { kind: 'flute', count: 3, speed: 6.8, w: 26, h: 24, damage: 18, yOff: -84, spacing: 18 },
          status: { kind: 'slow', dur: 3, power: 0.5 },
          fx: 'notes'
        },
        {
          name: '希波吕托斯与阿里奇埃', sub: '歌剧终场', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整部歌剧的对位在此展开：8 秒内模仿声部威力大增，并立刻震开全场。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 41, w: 343, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 43. 宾根（女，修女形象）----------------
    {
      id: 'hildegard', name: '宾根', en: 'HILDEGARD', title: '希尔德加德·冯·宾根',
      quote: '我看见了光，便唱了出来。',
      stats: { hp: 279, power: 17, speed: 17 },
      desc: '中世纪的先知与女修道院长：圣咏在天地间回荡，美德颂让自己的每一击都被重唱。',
      sprite: {
        hair: 'veil', hairColor: '#c8b090', hairDark: '#8a7458',
        coat: ['#3a4a6a', '#222b3d', '#7d889d'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#181d26', '#0f1218'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8c0f0', item: 'lyre',
        height: 0.93, bulk: 0.88, stoop: 1
      },
      skills: [
        {
          name: '美德颂', sub: 'Ordo Virtutum', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '美德之歌唱响 6 秒：期间自己的每次命中都会被圣咏重唱一次。',
          canon: { dur: 6, delay: 26, ratio: 0.68 },
          fx: 'canonMark'
        },
        {
          name: '幻象之光', sub: '羽毛与光', key: 'W', cd: 5, range: 150, type: 'field',
          desc: '幻象之光笼罩自身 8 秒：持续回血并获得护体减伤。',
          field: { kind: 'armor', dur: 8, radius: 170, dps: 4, heal: 2, tickEvery: 30, armor: 0.3, slow: 0.6, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '赞美诗', sub: '圣咏合唱', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整座修道院一同歌唱：8 秒内每次命中都被放大重唱，并立刻降下光柱。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 30, w: 320, h: 200, yOff: -86, knock: 7, stun: 30 },
          self: { heal: 18 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 44. 马肖 ----------------
    {
      id: 'machaut', name: '马肖', en: 'MACHAUT', title: '纪尧姆·德·马肖',
      quote: '等节奏，是我给时间定的形状。',
      stats: { hp: 279, power: 18, speed: 17 },
      desc: '等节奏的发明者：同一节奏型被严格重复，每一次命中都会被精确模仿。',
      sprite: {
        hair: 'topknot', hairColor: '#40342a', hairDark: '#241a10',
        coat: ['#3e3244', '#241d27', '#807884'], coatStyle: 'tunic',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#171419', '#0f0d10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8b8e8', item: 'lute',
        hat: 'hood',
        height: 0.98, bulk: 1, stoop: 1
      },
      skills: [
        {
          name: '等节奏经文歌', sub: 'isorhythm', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '定下 6 秒的等节奏型：期间你的每次命中都会被严格重复一次。',
          canon: { dur: 6, delay: 22, ratio: 0.96 },
          fx: 'canonMark'
        },
        {
          name: '圣母弥撒', sub: '弥撒', key: 'W', cd: 5, range: 170, type: 'multiHit',
          desc: '弥撒的固定段落接连奏出，四连击把对手钉在原地。',
          hit: { damage: 21, hits: 4, interval: 8, w: 128, h: 88, yOff: -78, knock: 1.2, stun: 14 },
          fx: 'notes'
        },
        {
          name: '真爱之泉', sub: '叙事歌', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '真爱之泉喷涌：8 秒内每次命中都被重唱，并以一次重击引爆。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 55, w: 348, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 45. 帕格尼尼 ----------------
    {
      id: 'paganini', name: '帕格尼尼', en: 'PAGANINI', title: '尼科罗·帕格尼尼',
      quote: '魔鬼教会了我拉琴。',
      stats: { hp: 279, power: 22, speed: 19 },
      desc: '小提琴的魔鬼：随想曲的主题被二十四次分解，每一次命中都被模仿重奏。',
      sprite: {
        hair: 'ponytail', hairColor: '#1e1a18', hairDark: '#0a0808',
        coat: ['#1f1f28', '#121217', '#6b6b71'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#0c0c0f', '#080809'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c0c0d8', item: 'violin',
        hat: 'tophat',
        height: 0.97, bulk: 0.94, stoop: 1
      },
      skills: [
        {
          name: '二十四首随想曲', sub: '随想曲第24号', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '主题写下后是无穷的变奏：6 秒内你的每次命中都会被模仿重奏。',
          hit: { damage: 22, w: 130, h: 96, yOff: -80, knock: 3, stun: 16 },
          canon: { dur: 6, delay: 20, ratio: 0.78 },
          fx: 'canonMark'
        },
        {
          name: '女巫之舞', sub: 'Le Streghe', key: 'W', cd: 5, range: 200, type: 'dashAttack',
          desc: '踩着女巫之舞的节拍高速突进，一路撞开对手。',
          dash: { distance: 200, speed: 8.6, damage: 27, w: 58, h: 92, yOff: -76, knock: 5.0, stun: 16 },
          fx: 'trail'
        },
        {
          name: '魔鬼的颤音', sub: '第一小提琴协奏曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '魔鬼的颤音响起：8 秒内每次命中都被高分贝重奏，并以一次刺击收尾。',
          canon: { dur: 8, delay: 16, ratio: 1 },
          hit: { damage: 35, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chromatic'
        }
      ]
    },

    // ---------------- 46. 韦伯 ----------------
    {
      id: 'weber', name: '韦伯', en: 'WEBER', title: '卡尔·马利亚·冯·韦伯',
      quote: '魔弹射向哪里，由魔鬼决定。',
      stats: { hp: 286, power: 19, speed: 17 },
      desc: '德国浪漫歌剧的开创者：魔弹射出后仍会再回来一次，第七颗由魔鬼掌控。',
      sprite: {
        hair: 'queue', hairColor: '#6a5540', hairDark: '#382a1c',
        coat: ['#3a4a4a', '#222b2b', '#7d8888'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#171c1c', '#0f1111'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#a8d8b0', item: 'watch',
        hat: 'bicorne',
        height: 1, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '魔弹射手', sub: '魔弹', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '装填 6 秒的魔弹：期间自己的每次命中都会被同一颗子弹再打一次。',
          canon: { dur: 6, delay: 24, ratio: 0.73 },
          fx: 'canonMark'
        },
        {
          name: '邀舞', sub: '华丽回旋曲', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '邀舞的乐句绅士般展开：三段乐章依次奏出，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 15, w: 128, knock: 2.0, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 16, damage: 18, w: 142, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 32, damage: 24, w: 164, knock: 3.8, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '奥伯龙', sub: '精灵之王', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '精灵之王的号角吹响：8 秒内每次命中都被魔法重奏，并以号角震开对手。',
          canon: { dur: 8, delay: 18, ratio: 0.99 },
          hit: { damage: 32, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 47. 帕瓦斯特里纳 ----------------
    {
      id: 'palestrina', name: '帕瓦斯特里纳', en: 'PALESTRINA', title: '乔瓦尼·皮耶路易吉·达·帕瓦斯特里纳',
      quote: '让音乐回到教堂的纯净。',
      stats: { hp: 293, power: 18, speed: 15 },
      desc: '复调合唱的典范：声部一个接一个进入，每一次命中都会被另一个声部模仿。',
      sprite: {
        hair: 'bun', hairColor: '#8a8070', hairDark: '#4a4438',
        coat: ['#2f2f38', '#1b1b20', '#76767c'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#121215', '#0b0b0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0e8d0', item: 'scroll',
        beard: true,
        height: 1.02, bulk: 1.08, stoop: 2
      },
      skills: [
        {
          name: '教皇马尔切利弥撒', sub: '弥撒', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '六个声部依次进入：6 秒内你的每次命中都会被另一个声部模仿重唱。',
          canon: { dur: 6, delay: 26, ratio: 0.77 },
          fx: 'canonMark'
        },
        {
          name: '圣母颂', sub: 'Stabat Mater', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '圣母悼歌的两段乐句缓缓推进，并为自己回复生命。',
          self: { heal: 16 },
          movement: {
            stanzas: [
              { delay: 0, damage: 13, w: 154, knock: 1.8, stun: 13, anim: 'cast', fx: 'notes' },
              { delay: 24, damage: 21, w: 180, knock: 3.0, stun: 16, anim: 'cast', fx: 'chorus' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '升阶经', sub: '合唱终曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全合唱团一同进入：8 秒内每次命中都被重唱，并以一次齐唱击飞对手。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 30, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 48. 霍尔斯特 ----------------
    {
      id: 'holst', name: '霍尔斯特', en: 'HOLST', title: '古斯塔夫·霍尔斯特',
      quote: '行星的运转，就是我写下的节奏。',
      stats: { hp: 300, power: 20, speed: 15 },
      desc: '行星的作曲家：木星的欢乐被反复回响，火星的战争则一次砸下。',
      sprite: {
        hair: 'long', hairColor: '#7a6a58', hairDark: '#3e3428',
        coat: ['#2f4a3f', '#1b2b25', '#768880'], coatStyle: 'sweater',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#131b18', '#0c110f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e08a5a', item: 'book',
        mustache: true,
        height: 1.02, bulk: 1.08, stoop: 2
      },
      skills: [
        {
          name: '行星组曲·木星', sub: '木星·欢乐使者', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '木星的欢乐主题被反复回响：6 秒内你的每次命中都会再响一次。',
          hit: { damage: 23, w: 128, h: 96, yOff: -80, knock: 3, stun: 16 },
          canon: { dur: 6, delay: 22, ratio: 0.7 },
          fx: 'canonMark'
        },
        {
          name: '行星组曲·火星', sub: '火星·战争使者', key: 'W', cd: 5, range: 140, type: 'meleeSwing',
          desc: '火星的五拍节奏一次砸下：沉重且把对手打飞。',
          hit: { damage: 47, w: 132, h: 104, yOff: -80, knock: 8.0, stun: 22 },
          fx: 'impact'
        },
        {
          name: '行星组曲·土星', sub: '土星·老年使者', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '土星的缓慢逼近：8 秒内每次命中都被沉重的回响重奏，并以终曲压垮对手。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 39, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 49. 伯恩斯坦 ----------------
    {
      id: 'bernstein', name: '伯恩斯坦', en: 'BERNSTEIN', title: '伦纳德·伯恩斯坦',
      quote: '音乐没有高雅与通俗之分。',
      stats: { hp: 286, power: 20, speed: 17 },
      desc: '舞台与音乐厅之间：西区故事的舞步被一遍遍复制，节奏越跳越烈。',
      sprite: {
        hair: 'mop', hairColor: '#3a3128', hairDark: '#1a1611',
        coat: ['#4a3a2a', '#2b2218', '#887d72'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#1b1611', '#110e0b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d878', item: 'baton',
        height: 1, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '西区故事', sub: '美国', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '舞步被复制成两重：6 秒内你的每次命中都会被另一个自己再打一次。',
          canon: { dur: 6, delay: 20, ratio: 0.81 },
          fx: 'canonMark'
        },
        {
          name: '坎迪德序曲', sub: '坎迪德', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '序曲的急板连绵而出：四段乐章快速连奏，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 11, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 12, w: 136, knock: 2.2, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 13, w: 146, knock: 2.6, stun: 12, anim: 'kick', fx: 'confetti' },
              { delay: 36, damage: 19, w: 168, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '弥撒', sub: '弥撒终曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '剧场式的弥撒：8 秒内每次命中都被整个乐团重奏，并以齐奏收场。',
          canon: { dur: 8, delay: 16, ratio: 1 },
          hit: { damage: 27, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 50. 布列兹 ----------------
    {
      id: 'boulez', name: '布列兹', en: 'BOULEZ', title: '皮埃尔·布列兹',
      quote: '我选择把音乐推向绝对的严谨。',
      stats: { hp: 279, power: 21, speed: 16 },
      desc: '整体序列主义的建筑师：一切都被精确复制，每一次命中都有严格的对位应答。',
      sprite: {
        hair: 'short', hairColor: '#8a8078', hairDark: '#4a443c',
        coat: ['#2f2f3f', '#1b1b25', '#767680'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#121217', '#0c0c0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d0c8f0', item: 'quill',
        height: 1, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '无主之锤', sub: 'Le Marteau sans Maître', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '为诗句写下的严格对位：6 秒内你的每次命中都会被精确应答一次。',
          hit: { damage: 24, w: 136, h: 96, yOff: -80, knock: 3.2, stun: 17 },
          canon: { dur: 6, delay: 22, ratio: 0.79 },
          fx: 'canonMark'
        },
        {
          name: '结构', sub: 'Structures', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '两套序列同时展开，两道音波以严格的镜像关系飞出。',
          proj: { kind: 'chroma', count: 2, speed: 6.6, w: 28, h: 28, damage: 21, yOff: -82, spacing: 28, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '应答曲', sub: 'Répons', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '独奏与六重奏在空间中互相应答：8 秒内每次命中都被高倍重奏，并以全奏收束。',
          canon: { dur: 8, delay: 16, ratio: 1 },
          hit: { damage: 33, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'matrix'
        }
      ]
    },

    // =========================================================
    //  v5.0 新增 25 位（51~75）
    //  两套新体系：
    //    · 循环（Loop）——同一音型反复回响：碎片重击、逐次累加、固定低音
    //    · 节拍（Beat）——舞曲式的强拍律动：均匀连击、卡农式追随、疾速轮舞
    // =========================================================

    // ---------------- 51. 韦伯恩（循环）----------------
    {
      id: 'webern', name: '韦伯恩', en: 'WEBERN', title: '安东·韦伯恩',
      quote: '一个音，也要有它的颜色。',
      stats: { hp: 279, power: 19, speed: 18 },
      desc: '点描法的极简主义者：三个音就是一首曲子，每个音都独立成击。',
      sprite: {
        hair: 'receding', hairColor: '#9a9088', hairDark: '#544e46',
        coat: ['#33383c', '#1e2023', '#787c7e'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#141516', '#0d0d0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#a0d0c0', item: 'cane',
        hat: 'flatcap',
        glasses: true,
        height: 0.96, bulk: 0.94, stoop: 1
      },
      skills: [
        {
          name: '六首小品', sub: '点描·碎片', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '每个音各自独立：6 秒内你的每次命中都会再响一次。',
          canon: { dur: 6, delay: 18, ratio: 0.75 },
          fx: 'canonMark'
        },
        {
          name: '五首管弦乐小品', sub: '音色旋律', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '音色在不同乐器间传递：四段极短的乐句依次闪过。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 116, knock: 1.2, stun: 8, anim: 'punch', fx: 'chromatic' },
              { delay: 11, damage: 10, w: 124, knock: 1.4, stun: 9, anim: 'punch', fx: 'chromatic' },
              { delay: 22, damage: 11, w: 132, knock: 1.6, stun: 10, anim: 'kick', fx: 'chromatic' },
              { delay: 33, damage: 15, w: 148, knock: 3.0, stun: 15, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '交响曲 Op.21', sub: '十二音的微光', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '序列被反复陈述：8 秒内每次命中都被精密重奏，并以全奏收束。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 24, w: 320, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'matrix'
        }
      ]
    },

    // ---------------- 52. 欣德米特（循环）----------------
    {
      id: 'hindemith', name: '欣德米特', en: 'HINDEMITH', title: '保罗·欣德米特',
      quote: '音乐要能被用，才有意义。',
      stats: { hp: 300, power: 19, speed: 16 },
      desc: '实用音乐的工匠：把巴洛克的老形式重新锻造，让音型不断回来。',
      sprite: {
        hair: 'short', hairColor: '#4a3a2a', hairDark: '#241a10',
        coat: ['#4e5a52', '#2d3430', '#8a928d'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1e221f', '#131514'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0c8a8', item: 'book',
        height: 1, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '画家马蒂斯', sub: '天使的合奏', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '画中的天使依次奏乐：三道虚影由远及近逐句击打。',
          echo: {
            count: 3, damage: 12, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -80, delay: 12 }, { dx: 60, delay: 24 }, { dx: -30, delay: 36 }]
          },
          fx: 'echoCall'
        },
        {
          name: '调性游戏', sub: '循环音阶', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '一条音阶不断循环：四段乐句重复推进，每次略强一点。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 13, damage: 10, w: 134, knock: 2.0, stun: 11, anim: 'kick', fx: 'notes' },
              { delay: 26, damage: 12, w: 146, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 39, damage: 14, w: 160, knock: 3.8, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '交响曲·画家马蒂斯', sub: '古老形式的循环', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '帕萨卡利亚的低音不断重复：8 秒内每次命中都被重奏，末句爆发。',
          canon: { dur: 8, delay: 20, ratio: 0.89 },
          hit: { damage: 22, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 53. 莫谢莱斯（循环）----------------
    {
      id: 'moscheles', name: '莫谢莱斯', en: 'MOSCHELES', title: '伊格纳茨·莫谢莱斯',
      quote: '练习，是通往自由的唯一道路。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '练习曲大师：同一乐句一遍遍地磨，每一次都比上一次更紧。',
      sprite: {
        hair: 'short', hairColor: '#6e5a42', hairDark: '#2c2216',
        coat: ['#3a3242', '#221d26', '#7d7882'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161418', '#0e0c0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8b0e0', item: 'quill',
        hat: 'mortarboard',
        height: 0.99, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '练习曲 Op.70', sub: '反复磨练', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '同一乐句反复四遍：越到后面越快，末句收得干净。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 124, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 9, w: 132, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 10, w: 140, knock: 2.2, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 30, damage: 13, w: 154, knock: 3.6, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '二十七首特性练习曲', sub: '音型循环', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '在对手脚下铺开 6 秒的音型领域：被困者被反复冲刷并变慢。',
          field: { kind: 'damage', dur: 6, radius: 178, dps: 6, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '第三钢琴协奏曲', sub: '炫技终章', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '同一段炫技乐句被推向极限：6 秒内每次命中都再磨一遍。',
          canon: { dur: 6, delay: 16, ratio: 0.7 },
          hit: { damage: 22, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 54. 梅西安（循环）----------------
    {
      id: 'messiaen', name: '梅西安', en: 'MESSIAEN', title: '奥利维埃·梅西安',
      quote: '我听见了颜色的和弦。',
      stats: { hp: 293, power: 18, speed: 15 },
      desc: '有限移调与鸟歌：音块像钟一样反复敲响，始终回不到原点。',
      sprite: {
        hair: 'wavy', hairColor: '#5a4a3a', hairDark: '#2a2016',
        coat: ['#3a3a52', '#222230', '#7d7d8d'], coatStyle: 'sweater',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#17171e', '#0e0e13'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#90d8d0', item: 'organ',
        glasses: true,
        height: 1, bulk: 1.08, stoop: 1
      },
      skills: [
        {
          name: '有限移调模式', sub: '不可移位的音块', key: 'Q', cd: 5, range: 300, type: 'field',
          desc: '音块在对手周围 7 秒内反复敲响：被困者持续受创并失去速度。',
          field: { kind: 'damage', dur: 7, radius: 186, dps: 7, tickEvery: 26, slow: 0.42, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '鸟鸣集', sub: '鸟歌的碎片', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '各种鸟鸣轮流报出：四段短促的乐句依次扑击。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 128, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 11, w: 136, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 13, w: 148, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 36, damage: 15, w: 162, knock: 3.8, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '时间终结四重奏', sub: '时间的循环', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '时间在这里循环：8 秒内每次命中都被无限回响，末句钟声压顶。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 22, w: 330, h: 205, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 55. 梅特纳（循环）----------------
    {
      id: 'medtner', name: '梅特纳', en: 'MEDTNER', title: '尼古拉·梅特纳',
      quote: '我写的不是奏鸣曲，是叙事。',
      stats: { hp: 293, power: 19, speed: 16 },
      desc: '俄国的叙事者：一个主题讲到结尾还会回来，只是换了面孔。',
      sprite: {
        hair: 'crop', hairColor: '#cfc7b0', hairDark: '#8a8270',
        coat: ['#3a3550', '#221f2e', '#7d7a8c'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#17151d', '#0e0d12'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#c0b8e8', item: 'book',
        monocle: true,
        height: 1, bulk: 1.06, stoop: 1
      },
      skills: [
        {
          name: '叙事曲', sub: '主题的回归', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '主题讲完又回来：三道叙事虚影依次现身重述。',
          echo: {
            count: 3, damage: 21, knock: 2.6, stun: 15, swing: 'cast',
            spots: [{ dx: -70, delay: 12 }, { dx: 70, delay: 26 }, { dx: 0, delay: 40 }]
          },
          fx: 'echoCall'
        },
        {
          name: '被遗忘的旋律', sub: '旋律再临', key: 'W', cd: 5, range: 160, type: 'canon',
          desc: '被遗忘的旋律回来了：6 秒内你的每次命中都会再响一次。',
          canon: { dur: 6, delay: 22, ratio: 0.95 },
          fx: 'canonMark'
        },
        {
          name: '钢琴奏鸣曲·叙事', sub: '叙事终章', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '叙事走到最后：8 秒内每次命中都随主题一起回归，末句压顶。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 34, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 56. 阿尔班·贝尔格（循环）----------------
    {
      id: 'berg', name: '阿尔班·贝尔格', en: 'A.BERG', title: '阿尔班·贝尔格',
      quote: '音乐必须表达人。',
      stats: { hp: 279, power: 21, speed: 16 },
      desc: '表现主义的抒情者：把十二音写成会哭的旋律，音型反复噬咬。',
      sprite: {
        hair: 'receding', hairColor: '#4a4038', hairDark: '#221c16',
        coat: ['#52303a', '#301c22', '#8d767d'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1d1416', '#130c0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c86a8a', item: 'quill',
        height: 1.02, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '沃采克', sub: '碎片对位', key: 'Q', cd: 5, range: 300, type: 'projectile',
          desc: '破碎的音符接连飞出，同一动机反复出现，被击中者被削弱。',
          proj: { kind: 'chroma', count: 3, speed: 7.0, w: 26, h: 26, damage: 8, yOff: -82, spacing: 16 },
          status: { kind: 'weaken', dur: 3.0, power: 0.25 },
          fx: 'chromatic'
        },
        {
          name: '露露', sub: '五段回响', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '五段短句接连闪过：每段都从上一段里取走一点东西。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 118, knock: 1.2, stun: 8, anim: 'punch', fx: 'chromatic' },
              { delay: 10, damage: 8, w: 126, knock: 1.4, stun: 9, anim: 'punch', fx: 'chromatic' },
              { delay: 20, damage: 9, w: 134, knock: 1.8, stun: 10, anim: 'kick', fx: 'chromatic' },
              { delay: 30, damage: 11, w: 146, knock: 2.4, stun: 13, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '小提琴协奏曲', sub: '纪念一位天使', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '为逝者写下的圣咏：8 秒内每次命中都被回响，末句化作众赞歌。',
          canon: { dur: 8, delay: 20, ratio: 0.8 },
          hit: { damage: 20, w: 325, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 57. 伊萨伊（循环）----------------
    {
      id: 'ysaye', name: '伊萨伊', en: 'YSAYE', title: '欧仁·伊萨伊',
      quote: '我拉琴的时候，弦上住着整个乐队。',
      stats: { hp: 286, power: 20, speed: 18 },
      desc: '无伴奏小提琴的暴君：一个动机被反复锯开，直到全部声部都响起来。',
      sprite: {
        hair: 'mane', hairColor: '#6a5a48', hairDark: '#342a1e',
        coat: ['#2c2f4a', '#1a1b2b', '#747688'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#12131a', '#0b0c11'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0a860', item: 'violin',
        earring: true,
        height: 1, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '六首无伴奏奏鸣曲', sub: '动机的锯齿', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '一个动机被反复锯开：四段锯齿般的乐句连续切上。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 124, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 13, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 14, w: 142, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 36, damage: 18, w: 158, knock: 4.0, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '哈瓦那舞曲', sub: '哈瓦那的节拍', key: 'W', cd: 5, range: 150, type: 'canon',
          desc: '舞曲的节奏被复制：6 秒内你的每次命中都会再跳一次。',
          canon: { dur: 6, delay: 18, ratio: 0.77 },
          fx: 'canonMark'
        },
        {
          name: '第一小提琴奏鸣曲', sub: '独奏的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '一个人拉出整个乐队：8 秒内每次命中都被全声部重奏，末句齐奏。',
          canon: { dur: 8, delay: 16, ratio: 1 },
          hit: { damage: 26, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 58. 哈恰图良（循环）----------------
    {
      id: 'khachaturian', name: '哈恰图良', en: 'KHACHATURIAN', title: '阿拉姆·哈恰图良',
      quote: '我要让高加索的节奏响彻音乐厅。',
      stats: { hp: 300, power: 20, speed: 17 },
      desc: '高加索的节拍狂人：萨兹琴的固定音型一响，所有人都得跟着跑。',
      sprite: {
        hair: 'mop', hairColor: '#2e2620', hairDark: '#12100c',
        coat: ['#5a2f2a', '#341b18', '#927672'], coatStyle: 'military',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1f1312', '#140c0b'],
        skin: ['#e0b183', '#a87c52'], accent: '#e0b040', item: 'trumpet',
        mustache: true,
        height: 1, bulk: 1.1, stoop: 0
      },
      skills: [
        {
          name: '马刀舞曲', sub: '萨布烈舞', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '萨布烈舞的节拍一路狂飙：四段乐句越来越快，末段猛砍。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 2.0, stun: 10, anim: 'punch', fx: 'confetti' },
              { delay: 11, damage: 9, w: 134, knock: 2.2, stun: 11, anim: 'punch', fx: 'confetti' },
              { delay: 22, damage: 10, w: 144, knock: 2.8, stun: 13, anim: 'kick', fx: 'confetti' },
              { delay: 33, damage: 14, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '加雅涅', sub: '摇篮与轮舞', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '在对手脚下展开 6 秒的轮舞领域：被困者被节拍反复冲刷。',
          field: { kind: 'damage', dur: 6, radius: 180, dps: 5, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '斯巴达克斯', sub: '奴隶的起义', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '起义的号角带动整支军队：6 秒内每次命中都被节拍重奏，末段巨浪。',
          canon: { dur: 6, delay: 16, ratio: 0.72 },
          hit: { damage: 21, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 33 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 59. 萨蒂（循环）----------------
    {
      id: 'satie', name: '萨蒂', en: 'SATIE', title: '埃里克·萨蒂',
      quote: '我是一面镜子，只会反射。',
      stats: { hp: 271, power: 15, speed: 14 },
      desc: '家具音乐的先知：同一段音乐重复三百遍，听不听都无所谓。',
      sprite: {
        hair: 'receding', hairColor: '#6a6258', hairDark: '#34302a',
        coat: ['#3a3d44', '#222327', '#7d7f84'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161719', '#0e0f10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8d0b0', item: 'cane',
        hat: 'nightcap',
        glasses: true,
        height: 0.98, bulk: 0.98, stoop: 2
      },
      skills: [
        {
          name: '吉诺佩蒂', sub: '极简反复', key: 'Q', cd: 5, range: 300, type: 'movement',
          desc: '同一段音乐重复不停：三段缓慢的乐句依次压上。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 130, knock: 1.6, stun: 10, anim: 'cast', fx: 'notes' },
              { delay: 16, damage: 9, w: 140, knock: 1.8, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 32, damage: 13, w: 158, knock: 3.6, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '家具音乐', sub: '背景里的领域', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '像家具一样待在身边：8 秒的领域内自己持续回血，靠近者被拖慢。',
          field: { kind: 'heal', dur: 8, radius: 170, dps: 3, heal: 2, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '游行', sub: '重复三百遍', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '同一支曲子重复到你无法忽视：8 秒内每次命中都被再奏一遍。',
          canon: { dur: 8, delay: 24, ratio: 0.8 },
          hit: { damage: 19, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 60. 科雷利（循环）----------------
    {
      id: 'corelli', name: '科雷利', en: 'CORELLI', title: '阿尔坎杰罗·科雷利',
      quote: '大协奏曲，就是两支乐队在对话。',
      stats: { hp: 293, power: 18, speed: 17 },
      desc: '大协奏曲之父：独奏组与全奏组一问一答，同一乐句总要说两遍。',
      sprite: {
        hair: 'wig', hairColor: '#f0e8d0', hairDark: '#b8b098',
        coat: ['#7a2f3a', '#471b22', '#a7767d'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2a1518', '#1b0d0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f8f0d8', item: 'violin',
        height: 0.99, bulk: 1.02, stoop: 1
      },
      skills: [
        {
          name: '大协奏曲', sub: '独奏与全奏', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '独奏组先答一句，全奏组再应一句：两道虚影依次补上。',
          echo: {
            count: 2, damage: 19, knock: 3.0, stun: 17, swing: 'punch',
            spots: [{ dx: -70, delay: 14 }, { dx: 70, delay: 32 }]
          },
          fx: 'echoCall'
        },
        {
          name: '圣诞协奏曲', sub: '牧歌的应答', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '牧歌在对手脚下铺开 6 秒：领域内的人被反复冲刷并放慢脚步。',
          field: { kind: 'damage', dur: 6, radius: 176, dps: 8, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '第十二号大协奏曲', sub: '全奏的循环', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全奏组一遍遍地应答：8 秒内每次命中都被回奏，末句全体齐奏。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 27, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 61. 帕赫贝尔（循环）----------------
    {
      id: 'pachelbel', name: '帕赫贝尔', en: 'PACHELBEL', title: '约翰·帕赫贝尔',
      quote: '一条低音，可以走遍全世界。',
      stats: { hp: 293, power: 17, speed: 15 },
      desc: '卡农的化身：一条低音走到底，上面的旋律一轮轮追上来。',
      sprite: {
        hair: 'long', hairColor: '#8a7458', hairDark: '#4a3c28',
        coat: ['#3a2f26', '#221b16', '#7d7670'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#15120f', '#0d0b0a'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8d0a0', item: 'organ',
        height: 1, bulk: 1.02, stoop: 1
      },
      skills: [
        {
          name: 'D大调卡农', sub: '同一动机反复', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '同一动机反复出现：6 秒内你的每次命中都会被下一声部追上。',
          hit: { damage: 16, w: 132, h: 96, yOff: -80, knock: 2.8, stun: 15 },
          canon: { dur: 6, delay: 20, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '六首变奏曲', sub: '低音的变奏', key: 'W', cd: 5, range: 320, type: 'echo',
          desc: '低音不动，上面的声部换着花样：三道虚影依次落点。',
          echo: {
            count: 3, damage: 16, knock: 2.6, stun: 15, swing: 'cast',
            spots: [{ dx: -80, delay: 12 }, { dx: 80, delay: 24 }, { dx: 0, delay: 38 }]
          },
          fx: 'chorus'
        },
        {
          name: '众赞歌前奏曲', sub: '低音走到尽头', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '低音终于走到尽头：8 秒内每次命中都被追奏，末句管风琴全开。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 26, w: 330, h: 205, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 62. G.P.泰勒曼（循环）----------------
    {
      id: 'telemann', name: 'G.P.泰勒曼', en: 'TELEMANN', title: '格奥尔格·菲利普·泰勒曼',
      quote: '我写得快，但从不敷衍。',
      stats: { hp: 293, power: 17, speed: 18 },
      desc: '巴洛克的多产者：什么乐器都能写，什么音型都能循环着用。',
      sprite: {
        hair: 'wig', hairColor: '#e0d8c0', hairDark: '#a8a088',
        coat: ['#2f5040', '#1b2e25', '#768c81'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#131d18', '#0c120f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8e8b0', item: 'flute',
        hat: 'straw',
        height: 0.99, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '餐桌音乐', sub: '佐餐的循环', key: 'Q', cd: 5, range: 300, type: 'field',
          desc: '背景音乐永不停歇：对手脚下 7 秒的领域持续冲刷并拖慢步伐。',
          field: { kind: 'damage', dur: 7, radius: 182, dps: 5, tickEvery: 28, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '巴黎四重奏', sub: '四声部的应和', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '四个声部依次应和：四段乐句循环推进。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 8, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 9, w: 144, knock: 2.4, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 36, damage: 11, w: 160, knock: 3.8, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '汉堡的潮汐', sub: '潮水的涨落', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '潮水一波波地涨落：6 秒内每次命中都被下一波冲上来重奏。',
          canon: { dur: 6, delay: 16, ratio: 0.7 },
          hit: { damage: 19, w: 340, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 63. 塔利斯（节拍）----------------
    {
      id: 'tallis', name: '塔利斯', en: 'TALLIS', title: '托马斯·塔利斯',
      quote: '让每个声部都听得见。',
      stats: { hp: 286, power: 16, speed: 14 },
      desc: '英式圣咏的奠基者：四十个声部同时呼吸，节拍由所有人共同支撑。',
      sprite: {
        hair: 'receding', hairColor: '#9a9a90', hairDark: '#54544c',
        coat: ['#2e3438', '#1b1e20', '#75797c'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#121415', '#0b0c0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8d0a0', item: 'scroll',
        height: 1, bulk: 1.06, stoop: 2
      },
      skills: [
        {
          name: '寄希望于他人', sub: '四十声部', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '四十个声部依次进入：三道圣咏虚影按节拍逐句压上。',
          echo: {
            count: 3, damage: 15, knock: 2.4, stun: 15, swing: 'cast',
            spots: [{ dx: -80, delay: 14 }, { dx: 80, delay: 28 }, { dx: 0, delay: 44 }]
          },
          fx: 'chorus'
        },
        {
          name: '四声部弥撒', sub: '弥撒的节拍', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '圣咏在身边铺开 8 秒：自己持续回血并减伤，靠近者被拖慢。',
          field: { kind: 'armor', dur: 8, radius: 174, dps: 4, heal: 2, tickEvery: 30, armor: 0.3, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '耶利米哀歌', sub: '哀歌的齐鸣', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全部声部在同一拍上齐鸣：8 秒内每次命中都被合唱重奏。',
          canon: { dur: 8, delay: 20, ratio: 1 },
          hit: { damage: 25, w: 330, h: 205, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 64. 佩罗坦（节拍）----------------
    {
      id: 'perotin', name: '佩罗坦', en: 'PEROTIN', title: '佩罗坦（大佩罗坦）',
      quote: '让所有的声部一起延长。',
      stats: { hp: 300, power: 17, speed: 13 },
      desc: '巴黎圣母院乐派：把圣咏的每个音拉得极长，让节拍在长音里堆积。',
      sprite: {
        hair: 'crop', hairColor: '#6a6258', hairDark: '#2e2a24',
        coat: ['#2a3240', '#181d25', '#727881'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#111317', '#0b0c0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8a2ff', item: 'lyre',
        hat: 'hood',
        cross: true,
        height: 1, bulk: 1.08, stoop: 2
      },
      skills: [
        {
          name: '奥尔加农', sub: '多声部同时起音', key: 'Q', cd: 5, range: 330, type: 'echo',
          desc: '所有声部同时起音：三道虚影从不同高度一同压下。',
          echo: {
            count: 3, damage: 13, knock: 3.0, stun: 16, swing: 'kick',
            spots: [{ dx: -90, delay: 16 }, { dx: 90, delay: 16 }, { dx: 0, delay: 34 }]
          },
          fx: 'chorus'
        },
        {
          name: '迪斯康特', sub: '一音对一音', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '一音对一音、一步跟一步：四段节拍分明的乐句推进。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 130, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 14, damage: 10, w: 138, knock: 2.2, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 28, damage: 11, w: 148, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 42, damage: 14, w: 164, knock: 4.0, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '四声部奥尔加农', sub: '圣咏的延长', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '四个声部一起把圣咏拉长：8 秒内每次命中都被延长重奏，末句齐鸣。',
          canon: { dur: 8, delay: 22, ratio: 0.8 },
          hit: { damage: 21, w: 330, h: 205, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 65. 布鲁赫（节拍）----------------
    {
      id: 'bruch', name: '布鲁赫', en: 'BRUCH', title: '马克斯·布鲁赫',
      quote: '旋律，永远是第一位的。',
      stats: { hp: 293, power: 19, speed: 16 },
      desc: '旋律至上的浪漫派：小提琴的独奏一出来，节拍就跟着它走。',
      sprite: {
        hair: 'wavy', hairColor: '#4a3c2c', hairDark: '#2a2016',
        coat: ['#353f52', '#1f2530', '#7a808d'], coatStyle: 'military',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#15181e', '#0e0f13'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0a8c0', item: 'violin',
        beard: true,
        height: 1.02, bulk: 1.08, stoop: 1
      },
      skills: [
        {
          name: '第一小提琴协奏曲', sub: '独奏的折返', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '独奏主题飞出又折回：去程轻、回程重，并把对手拖向自己。',
          rondo: { kind: 'aria', count: 1, speed: 6.4, range: 320, w: 30, h: 30, damage: 10, backDamage: 17, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '苏格兰幻想曲', sub: '苏格兰的节拍', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '民谣的节拍一段段接上：四段乐句连绵推进。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 13, damage: 9, w: 136, knock: 2.2, stun: 11, anim: 'kick', fx: 'notes' },
              { delay: 26, damage: 10, w: 146, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 39, damage: 12, w: 162, knock: 4.0, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '科尔尼德莱', sub: '希伯来祷歌', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '祷歌在最强拍上爆发：6 秒内每次命中都被大提琴声部重奏。',
          canon: { dur: 6, delay: 18, ratio: 0.85 },
          hit: { damage: 19, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 66. 福莱（节拍）----------------
    {
      id: 'faure', name: '福莱', en: 'FAURE', title: '加布里埃尔·福莱',
      quote: '我只写让人安睡的安魂曲。',
      stats: { hp: 279, power: 17, speed: 17 },
      desc: '法兰西的优雅节拍：帕凡舞曲一步一停，安魂曲把所有人哄睡。',
      sprite: {
        hair: 'receding', hairColor: '#c0b8a8', hairDark: '#7a7264',
        coat: ['#443a56', '#272232', '#847d8f'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1a171f', '#100f14'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#d0c8f8', item: 'book',
        hat: 'mortarboard',
        scarf: true,
        height: 0.98, bulk: 1, stoop: 1
      },
      skills: [
        {
          name: '帕凡舞曲', sub: '一步一停', key: 'Q', cd: 5, range: 300, type: 'field',
          desc: '庄重的舞步在对手脚下回旋 7 秒：被困者被拖慢并持续受创。',
          field: { kind: 'damage', dur: 7, radius: 178, dps: 8, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '洋娃娃组曲', sub: '摇篮的节拍', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '摇篮轻轻摇晃：三段柔和的乐句按拍压下，末段略重。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 128, knock: 1.8, stun: 10, anim: 'cast', fx: 'zzz' },
              { delay: 14, damage: 14, w: 142, knock: 2.4, stun: 13, anim: 'kick', fx: 'zzz' },
              { delay: 30, damage: 19, w: 164, knock: 4.2, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '安魂曲', sub: '圣咏的节拍', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '没有震怒之日的安魂曲：8 秒内每次命中都被圣咏轻轻重奏，末句归于宁静。',
          canon: { dur: 8, delay: 22, ratio: 1 },
          hit: { damage: 24, w: 330, h: 205, yOff: -86, knock: 7.5, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 67. 斯美塔那（节拍）----------------
    {
      id: 'smetana', name: '斯美塔那', en: 'SMETANA', title: '贝德日赫·斯美塔那',
      quote: '我要把波希米亚的河流写成音乐。',
      stats: { hp: 293, power: 18, speed: 16 },
      desc: '波希米亚的河流：伏尔塔瓦河一路流去，节拍就是水流的脉动。',
      sprite: {
        hair: 'bowl', hairColor: '#8a7a68', hairDark: '#4a4034',
        coat: ['#3a5240', '#223025', '#7d8d81'], coatStyle: 'tunic',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#171e19', '#0f1310'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#8ec8b8', item: 'baton',
        beard: true,
        height: 1.02, bulk: 1.08, stoop: 2
      },
      skills: [
        {
          name: '伏尔塔瓦河', sub: '河流的脉动', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '河流绕过村庄又流回来：去程与回程各判一次，并把对手拖向自己。',
          rondo: { kind: 'rag', count: 1, speed: 6.0, range: 320, w: 32, h: 32, damage: 12, backDamage: 19, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '被出卖的新嫁娘', sub: '波尔卡舞步', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '波尔卡的节拍明快：四段舞步接连踏出。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 126, knock: 2.0, stun: 10, anim: 'punch', fx: 'confetti' },
              { delay: 12, damage: 10, w: 136, knock: 2.2, stun: 11, anim: 'kick', fx: 'confetti' },
              { delay: 24, damage: 11, w: 146, knock: 2.6, stun: 13, anim: 'punch', fx: 'confetti' },
              { delay: 36, damage: 14, w: 162, knock: 4.0, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '我的祖国', sub: '布拉格的终曲', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '河流汇成洪流：6 秒内每次命中都被水声重奏，末段冲垮堤岸。',
          canon: { dur: 6, delay: 16, ratio: 0.85 },
          hit: { damage: 23, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 33 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 68. 弗兰克（节拍）----------------
    {
      id: 'franck', name: '弗兰克', en: 'FRANCK', title: '塞萨尔·弗兰克',
      quote: '循环形式，让一切最终回到同一个主题。',
      stats: { hp: 300, power: 18, speed: 14 },
      desc: '循环形式的发明者：所有乐章的主题最后都要在同一個节拍上会合。',
      sprite: {
        hair: 'wavy', hairColor: '#a89a88', hairDark: '#5a5248',
        coat: ['#2f3540', '#1b1f25', '#767a81'], coatStyle: 'habit',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#131417', '#0c0d0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8d8a8', item: 'organ',
        beard: true,
        mustache: true,
        height: 1.02, bulk: 1.1, stoop: 1
      },
      skills: [
        {
          name: 'd小调交响曲', sub: '循环主题', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '主题在最后回到起点：6 秒内你的每次命中都会被循环重述。',
          canon: { dur: 6, delay: 20, ratio: 1 },
          fx: 'canonMark'
        },
        {
          name: '前奏曲、圣咏与赋格', sub: '圣咏的节拍', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '在对手脚下展开 7 秒的圣咏领域：被困者被反复冲刷并放慢。',
          field: { kind: 'damage', dur: 7, radius: 184, dps: 11, tickEvery: 28, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '交响变奏曲', sub: '主题的会合', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '所有乐章的主题在此会合：8 秒内每次命中都被变奏重奏，末句合流。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 55, w: 359, h: 205, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 69. 里姆斯基-科萨科夫（节拍）----------------
    {
      id: 'rimsky', name: '里姆斯基-科萨科夫', en: 'RIMSKY', title: '尼古拉·里姆斯基-科萨科夫',
      quote: '配器，是让旋律长出翅膀的手艺。',
      stats: { hp: 286, power: 19, speed: 18 },
      desc: '配器法的宗师：野蜂在弦上飞舞，天方夜谭的主题一晚上讲不完。',
      sprite: {
        hair: 'short', hairColor: '#5a4a38', hairDark: '#2a2014',
        coat: ['#2c3a5e', '#1a2237', '#747d95'], coatStyle: 'military',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#131721', '#0c0e15'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#9fc8e8', item: 'baton',
        hat: 'bicorne',
        beard: true,
        height: 1.02, bulk: 1.08, stoop: 1
      },
      skills: [
        {
          name: '天方夜谭', sub: '舍赫拉查德的主题', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '苏丹王与讲述者的主题交替：两道虚影一先一后地讲下去。',
          echo: {
            count: 2, damage: 30, knock: 3.0, stun: 17, swing: 'cast',
            spots: [{ dx: -80, delay: 16 }, { dx: 80, delay: 34 }]
          },
          fx: 'echoCall'
        },
        {
          name: '西班牙随想曲', sub: '急速的节拍', key: 'W', cd: 5, range: 150, type: 'canon',
          desc: '舞曲的节拍越来越急：6 秒内你的每次命中都被立刻跟上。',
          hit: { damage: 24, w: 126, h: 96, yOff: -80, knock: 2.6, stun: 14 },
          canon: { dur: 6, delay: 16, ratio: 1 },
          fx: 'canonMark'
        },
        {
          name: '野蜂飞舞', sub: '蜂群的疾走', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '野蜂在弦上疯转：6 秒内每次命中都被蜂群追上，末句一拥而上。',
          canon: { dur: 6, delay: 14, ratio: 1 },
          hit: { damage: 50, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 33 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 70. 格林卡（节拍）----------------
    {
      id: 'glinka', name: '格林卡', en: 'GLINKA', title: '米哈伊尔·格林卡',
      quote: '音乐是人民创造的，作曲家只是把它编好。',
      stats: { hp: 293, power: 18, speed: 16 },
      desc: '俄罗斯音乐之父：民间舞曲的节拍是他的地基，序曲一路狂奔到底。',
      sprite: {
        hair: 'queue', hairColor: '#54402c', hairDark: '#221a10',
        coat: ['#3a4a5e', '#222b37', '#7d8895'], coatStyle: 'tunic',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#181c22', '#0f1215'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8d86f', item: 'watch',
        height: 1, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '鲁斯兰与柳德米拉', sub: '序曲的狂奔', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '序曲的急速音型冲出去又冲回来：去程与回程各判一次。',
          rondo: { kind: 'rag', count: 1, speed: 8.0, range: 310, w: 30, h: 30, damage: 15, backDamage: 24, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '伊凡·苏萨宁', sub: '民间舞曲的节拍', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '在对手脚下铺开 6 秒的舞曲领域：被困者按拍受创并被拖慢。',
          field: { kind: 'damage', dur: 6, radius: 180, dps: 8, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '卡玛林斯卡亚', sub: '婚礼歌与舞曲', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '婚礼歌一转为舞曲就再也停不下：6 秒内每次命中都被节拍重奏。',
          canon: { dur: 6, delay: 16, ratio: 1 },
          hit: { damage: 29, w: 340, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 71. 车尔尼（节拍）----------------
    {
      id: 'czerny', name: '车尔尼', en: 'CZERNY', title: '卡尔·车尔尼',
      quote: '先把音阶弹对，再谈音乐。',
      stats: { hp: 286, power: 18, speed: 19 },
      desc: '练习曲工厂：节拍器一开就是几千遍，音阶像机器一样均匀。',
      sprite: {
        hair: 'bald', hairColor: '#8a8278', hairDark: '#463f36',
        coat: ['#42403a', '#262522', '#82817d'], coatStyle: 'jacket',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#191816', '#100f0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8c090', item: 'metronome',
        height: 0.98, bulk: 1, stoop: 1
      },
      skills: [
        {
          name: '快速练习曲', sub: '音阶跑动', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '音阶一口气跑完：四段均匀的乐句按节拍器推进。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 124, knock: 1.6, stun: 10, anim: 'punch', fx: 'chromatic' },
              { delay: 10, damage: 9, w: 132, knock: 1.8, stun: 10, anim: 'punch', fx: 'chromatic' },
              { delay: 20, damage: 10, w: 140, knock: 2.2, stun: 12, anim: 'kick', fx: 'chromatic' },
              { delay: 30, damage: 13, w: 154, knock: 3.6, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '左手练习曲', sub: '均匀的触键', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '节拍器在身边响 8 秒：领域内自己持续回血，靠近的对手被拖慢。',
          field: { kind: 'heal', dur: 8, radius: 172, dps: 3, heal: 2, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '手指灵巧的艺术', sub: '节拍器全开', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '节拍器开到最快：6 秒内每次命中都被精确重奏一遍。',
          canon: { dur: 6, delay: 14, ratio: 0.85 },
          hit: { damage: 21, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 72. 阿连斯基（循环）----------------
    {
      id: 'arensky', name: '阿连斯基', en: 'ARENSKY', title: '安东·阿连斯基',
      quote: '变奏，是让一个念头活很久的办法。',
      stats: { hp: 286, power: 18, speed: 16 },
      desc: '变奏曲的高手：一条固定低音撑住整首曲子，主题在上面换了七次衣裳。',
      sprite: {
        hair: 'feather', hairColor: '#4a3a2a', hairDark: '#221a10',
        coat: ['#443252', '#271d30', '#84788d'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1a151e', '#100d13'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b0a0e0', item: 'wineglass',
        hat: 'mortarboard',
        height: 1, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '固定低音', sub: '帕萨卡利亚', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '低音一成不变地循环：6 秒内你的每次命中都会被变奏重述。',
          hit: { damage: 19, w: 139, h: 96, yOff: -80, knock: 2.8, stun: 15 },
          canon: { dur: 6, delay: 20, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '埃及之夜', sub: '东方主题的回响', key: 'W', cd: 5, range: 320, type: 'echo',
          desc: '东方主题被反复雕琢：三道虚影依次浮现并击出。',
          echo: {
            count: 3, damage: 19, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -80, delay: 12 }, { dx: 80, delay: 26 }, { dx: 0, delay: 40 }]
          },
          fx: 'echoCall'
        },
        {
          name: '柴可夫斯基主题变奏曲', sub: '主题的七次变装', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '主题连换七次衣裳：8 秒内每次命中都被变奏重奏，末句回归原形。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 30, w: 354, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 73. 安东·鲁宾斯坦（节拍）----------------
    {
      id: 'rubinstein', name: '安东·鲁宾斯坦', en: 'A.RUBINSTEIN', title: '安东·格里戈里耶维奇·鲁宾斯坦',
      quote: '要么做第一，要么什么都不是。',
      stats: { hp: 307, power: 21, speed: 15 },
      desc: '俄国钢琴学派的祖师：塔兰泰拉的六拍子一响，就必须跳到倒下。',
      sprite: {
        hair: 'mane', hairColor: '#4a4034', hairDark: '#221c14',
        coat: ['#33304a', '#1e1c2b', '#787688'], coatStyle: 'gown',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#14131b', '#0d0c11'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b8a8d0', item: 'baton',
        height: 1.04, bulk: 1.12, stoop: 1
      },
      skills: [
        {
          name: '塔兰泰拉', sub: '六拍子的狂奔', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '塔兰泰拉的节拍越来越疯：四段舞步不停踏出。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 128, knock: 2.2, stun: 11, anim: 'punch', fx: 'confetti' },
              { delay: 12, damage: 9, w: 138, knock: 2.4, stun: 12, anim: 'kick', fx: 'confetti' },
              { delay: 24, damage: 10, w: 150, knock: 3.0, stun: 14, anim: 'punch', fx: 'confetti' },
              { delay: 36, damage: 12, w: 166, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: 'F大调旋律', sub: '旋律的节拍', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '如歌的旋律在身旁铺开 8 秒：自己持续回血，靠近者被拖慢。',
          field: { kind: 'heal', dur: 8, radius: 172, dps: 3, heal: 2, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '恶魔', sub: '六拍子的洪流', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '恶魔的舞会开场：6 秒内每次命中都被整个乐队重奏，末段全体踏地。',
          canon: { dur: 6, delay: 16, ratio: 0.68 },
          hit: { damage: 19, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 33 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 74. J.N.胡梅尔（循环）----------------
    {
      id: 'hummel', name: 'J.N.胡梅尔', en: 'HUMMEL', title: '约翰·内波穆克·胡梅尔',
      quote: '莫扎特教我的，我又教给了别人。',
      stats: { hp: 286, power: 17, speed: 18 },
      desc: '古典与浪漫之间的桥梁：回旋曲的主题一次次回来，每次都要更花哨。',
      sprite: {
        hair: 'queue', hairColor: '#d8c8a8', hairDark: '#a09070',
        coat: ['#5a4a3a', '#342b22', '#92887d'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#211c18', '#15120f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8b8d8', item: 'watch',
        hat: 'tricorne',
        height: 0.99, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '回旋曲', sub: '主题的返回', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '主题飞出去又回来：去程轻巧、回程华丽，并把对手拖过来。',
          rondo: { kind: 'aria', count: 1, speed: 7.0, range: 320, w: 30, h: 30, damage: 15, backDamage: 24, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '奥地利舞曲', sub: '舞会的节拍', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '舞会的节拍在对手脚下转 6 秒：被困者持续受创并被拖慢。',
          field: { kind: 'damage', dur: 6, radius: 180, dps: 8, tickEvery: 30, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: 'D大调小号协奏曲', sub: '三个乐章的循环', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '三个乐章的主题轮流回来：8 秒内每次命中都被循环重述。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 27, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 75. 吉松隆（节拍）----------------
    {
      id: 'yoshimatsu', name: '吉松隆', en: 'YOSHIMATSU', title: '吉松隆',
      quote: '我想写像鸟一样自由的音乐。',
      stats: { hp: 271, power: 17, speed: 20 },
      desc: '会唱歌的现代派：把重复的节拍写成旋律，让机器也有一颗心。',
      sprite: {
        hair: 'mop', hairColor: '#2a2620', hairDark: '#100e0a',
        coat: ['#3c4450', '#23272e', '#7e848c'], coatStyle: 'kimono',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#181a1d', '#0f1013'],
        skin: ['#e0b183', '#a87c52'], accent: '#a8c0d8', item: 'baton',
        height: 0.98, bulk: 0.96, stoop: 0
      },
      skills: [
        {
          name: '鸟之协奏曲', sub: '机械的鸟鸣', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '机械的鸟鸣按节拍出现：四段乐句一段接一段地滑过。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 11, damage: 9, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 22, damage: 10, w: 144, knock: 2.4, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 33, damage: 13, w: 158, knock: 3.8, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '管弦乐之梦', sub: '梦中的节拍', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '梦里的节拍在对手脚下展开 7 秒：被困者持续受创并放慢脚步。',
          field: { kind: 'damage', dur: 7, radius: 182, dps: 6, tickEvery: 28, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '第五交响曲', sub: '节拍的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '节拍汇成洪流：6 秒内每次命中都被整个乐团重奏，末句齐奏。',
          canon: { dur: 6, delay: 16, ratio: 0.85 },
          hit: { damage: 22, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'torrent'
        }
      ]
    },

    // =========================================================
    //  v6.0 新增 25 位（76~100）
    //  三套新体系：
    //    · 华彩（Cadenza）—— 一段炫技乐句把对手震在原地：
    //      每 8 秒的命中附带 0.7 秒眩晕，期间对手无法操作
    //    · 终曲（Finale）—— 收束句一锤定音：
    //      命中后对手生命降到其上限 5% 以下即斩杀，直接结束本轮
    //    · 顽固（Ostinato）—— 顽固音型般打不断的持续：
    //      抗打断（普攻硬直 60% 概率无效），控制类效果时间 −50%
    // =========================================================

    // ---------------- 76. 埃内斯库（华彩）----------------
    {
      id: 'enescu', name: '埃内斯库', en: 'ENESCU', title: '乔治·埃内斯库',
      quote: '我拉琴的时候，故乡的山就站在那里。',
      stats: { hp: 288, power: 19, speed: 19 },
      desc: '罗马尼亚的小提琴诗人：乐句像山间的即兴，一段炫技就能让对手怔住。',
      sprite: {
        hair: 'curly', hairColor: '#2a2620', hairDark: '#12100e',
        coat: ['#2e4a5e', '#1a2c38', '#70889a'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#151318', '#0d0c0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#9ad0e8', item: 'violin',
        hat: 'widebrim',
        height: 0.98, bulk: 0.97, stoop: 0
      },
      skills: [
        {
          name: '罗马尼亚狂想曲', sub: '故乡的即兴', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '乡间的旋律一段接一段地跳出来：四段乐句越走越快，末段全奏收束。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 124, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 9, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 10, w: 142, knock: 2.4, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 30, damage: 13, w: 156, knock: 3.8, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '第三小提琴奏鸣曲', sub: '民歌的炫技', key: 'W', cd: 5, range: 310, type: 'rondo',
          desc: '一句民歌飞出去又绕回来：去程轻巧、回程华丽，并把对手拖回身前。',
          rondo: { kind: 'aria', count: 1, speed: 7.4, range: 310, w: 30, h: 30, damage: 11, backDamage: 19, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '俄狄浦斯', sub: '悲剧的总奏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '悲剧的主题被整个乐团反复陈述：8 秒内每次命中都被重奏，末句雷鸣。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 20, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 77. 阿特伯格（华彩）----------------
    {
      id: 'atterberg', name: '阿特伯格', en: 'ATTERBERG', title: '库尔特·阿特伯格',
      quote: '乡下的湖和城里的乐团，我都要。',
      stats: { hp: 300, power: 19, speed: 16 },
      desc: '瑞典的旋律匠人：把民谣打磨成交响曲，一句炫技就能定住全场。',
      sprite: {
        hair: 'sidepart', hairColor: '#c8c0b0', hairDark: '#807868',
        coat: ['#3c4652', '#1f252c', '#7a8694'], coatStyle: 'jacket',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1a1c1a', '#101210'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#e0c060', item: 'quill',
        hat: 'flatcap',
        height: 1, bulk: 1.02, stoop: 1
      },
      skills: [
        {
          // v6.0 平衡：原本是 slot 0 的投掷技，AI 会据此长期保持远距离，
          // 于是普通攻击输出几乎全场最低（实测 拳 2.0/s、24 战 0 胜）。
          // 改成乐章型的四段乐句后，既贴合"交响曲作曲家"的设定，也逼 AI 近身。
          name: '第六交响曲', sub: '瑞典的夏夜', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '夏夜的旋律一段接一段地推开：四段乐句由远及近，末段定音鼓落下。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 128, knock: 1.8, stun: 10, anim: 'punch', fx: 'waves' },
              { delay: 11, damage: 13, w: 136, knock: 2.0, stun: 11, anim: 'punch', fx: 'waves' },
              { delay: 22, damage: 16, w: 148, knock: 2.6, stun: 13, anim: 'kick', fx: 'waves' },
              { delay: 33, damage: 21, w: 164, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact', status: { kind: 'slow', dur: 2.2 } }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '管弦乐狂想曲', sub: '民谣的炫技', key: 'W', cd: 5, range: 200, type: 'multiHit',
          desc: '民谣被连缀成四记重音：一串连击把对手一路推开。',
          hit: { damage: 18, hits: 4, interval: 9, w: 128, h: 86, yOff: -78, knock: 2.6, stun: 14 },
          fx: 'notes'
        },
        {
          name: '第三交响曲“西海岸”', sub: '海与岩的洪流', key: 'E', cd: 15, range: 390, type: 'ultimate',
          desc: '西海岸的浪拍下来：巨大的音浪贯穿全场，被击中者长时间僵直。',
          hit: { damage: 45, w: 350, h: 195, yOff: -88, knock: 9, stun: 34, pierce: true },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 78. 波特凯维茨（华彩）----------------
    {
      id: 'bortkiewicz', name: '波特凯维茨', en: 'BORTKIEWICZ', title: '谢尔盖·波特凯维茨',
      quote: '被遗忘也没关系，旋律自己会记得。',
      stats: { hp: 282, power: 19, speed: 17 },
      desc: '流亡的浪漫主义者：一手华丽的钢琴织体，把旧时代的旋律一路带下去。',
      sprite: {
        hair: 'sidepart', hairColor: '#3a3128', hairDark: '#181410',
        coat: ['#5c3a2e', '#341f18', '#a08064'], coatStyle: 'gown',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#12181c', '#0a0e11'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#d89878', item: 'quill',
        hat: 'widebrim', mustache: true,
        height: 0.99, bulk: 1, stoop: 1
      },
      skills: [
        {
          // v6.0 平衡：同阿特伯格 —— slot 0 的投掷技会把 AI 钉在远处，改为四段下行的乐章型乐句。
          name: '钢琴协奏曲第一号', sub: '华丽的下行', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '一串华丽的下行音阶一路滚下来：四段乐句越走越低，末段双手齐落。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 10, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 11, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 30, damage: 15, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '十首前奏曲', sub: '旧时代的回响', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '旧时代的和声在脚下铺开 7 秒：被困者被反复冲刷并放慢。',
          field: { kind: 'damage', dur: 7, radius: 176, dps: 6, tickEvery: 28, slow: 0.45, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '俄罗斯狂想曲', sub: '流亡的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '流亡者的乡愁汇成洪流：8 秒内每次命中都被重奏，末句砸落。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 19, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 79. 尼尔森（华彩）----------------
    {
      id: 'nielsen', name: '尼尔森', en: 'NIELSEN', title: '卡尔·尼尔森',
      quote: '音乐就是生命，而生命不可扑灭。',
      stats: { hp: 305, power: 19, speed: 16 },
      desc: '丹麦的斗士：用“前进”的动机不断打断对手，一句炫技就是一次撞击。',
      sprite: {
        hair: 'short', hairColor: '#948a80', hairDark: '#403a34',
        coat: ['#3e2f4a', '#231a2c', '#8878a0'], coatStyle: 'sweater',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c1512', '#110d0b'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#b8e0c8', item: 'cane',
        hat: 'straw',
        height: 1.01, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '第四交响曲“不可扑灭”', sub: '前进的动机', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '“前进”的动机一次次撞上来：四段乐句步步紧逼，末段定音鼓齐鸣。',
          movement: {
            stanzas: [
              { delay: 0, damage: 14, w: 126, knock: 2.0, stun: 11, anim: 'punch', fx: 'shock' },
              { delay: 11, damage: 15, w: 134, knock: 2.2, stun: 12, anim: 'kick', fx: 'shock' },
              { delay: 22, damage: 18, w: 144, knock: 2.6, stun: 13, anim: 'punch', fx: 'impact' },
              { delay: 33, damage: 23, w: 160, knock: 4.2, stun: 17, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '长笛协奏曲', sub: '两支长笛的对话', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '两支长笛你一句我一句：三道虚影由远及近逐句击打。',
          echo: {
            count: 3, damage: 18, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -76, delay: 11 }, { dx: 62, delay: 22 }, { dx: -28, delay: 33 }]
          },
          fx: 'echoCall'
        },
        {
          name: '第五交响曲', sub: '不可扑灭的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '两支乐队从两侧对冲：巨浪般的音墙贯穿全场，被击中者久久无法起身。',
          hit: { damage: 45, w: 355, h: 195, yOff: -88, knock: 9, stun: 34, pierce: true },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 80. 圣-桑（华彩）----------------
    {
      id: 'saintsaens', name: '圣-桑', en: 'SAINT-SAENS', title: '夏尔·卡米尔·圣-桑',
      quote: '我写音乐像苹果树结果，是自然的事。',
      stats: { hp: 288, power: 19, speed: 18 },
      desc: '什么都懂的全才：管风琴、天文、旅行笔记，全都化成干净利落的乐句。',
      sprite: {
        hair: 'bald', hairColor: '#c8c0b0', hairDark: '#807868',
        coat: ['#443450', '#201d30', '#8880a8'], coatStyle: 'waistcoat',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#131016', '#0b090e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0c8b8', item: 'watch',
        hat: 'tophat', beard: true, mustache: true,
        height: 0.99, bulk: 1.01, stoop: 1
      },
      skills: [
        {
          // v6.0 平衡：管风琴的和弦改成四段乐章，避免 slot 0 投掷技把 AI 钉在远处。
          name: '第三交响曲“管风琴”', sub: '琴键的全奏', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '管风琴的和弦一层层压上来：四段乐句一段比一段厚，末段全奏。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 128, knock: 2.0, stun: 11, anim: 'punch', fx: 'chorus' },
              { delay: 11, damage: 10, w: 136, knock: 2.2, stun: 12, anim: 'punch', fx: 'chorus' },
              { delay: 22, damage: 12, w: 148, knock: 2.8, stun: 14, anim: 'kick', fx: 'chorus' },
              { delay: 33, damage: 16, w: 166, knock: 4.6, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '骷髅之舞', sub: '骸骨的圆舞', key: 'W', cd: 5, range: 190, type: 'multiHit',
          desc: '骸骨敲响木琴：四记三角铁的颤音连续砸下。',
          hit: { damage: 13, hits: 4, interval: 8, w: 126, h: 86, yOff: -78, knock: 2.4, stun: 13 },
          fx: 'shard'
        },
        {
          name: '动物狂欢节', sub: '终场的狂奔', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '所有动物一起冲出来：6 秒内每次命中都被整个乐团重奏，末段狮吼。',
          canon: { dur: 6, delay: 16, ratio: 1 },
          hit: { damage: 28, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 81. 埃尔加（华彩）----------------
    {
      id: 'elgar', name: '埃尔加', en: 'ELGAR', title: '爱德华·埃尔加',
      quote: '我的音乐里藏着只有朋友才懂的暗号。',
      stats: { hp: 305, power: 18, speed: 15 },
      desc: '英帝国的音乐绅士：一段高贵的旋律推上来，谁都别想在这时候出招。',
      sprite: {
        hair: 'tuft', hairColor: '#a89a88', hairDark: '#5c5044',
        coat: ['#46402f', '#26221a', '#948a70'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#181613', '#0e0d0b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d4b0', item: 'cello',
        hat: 'bowler', mustache: true,
        height: 1, bulk: 1.05, stoop: 1
      },
      skills: [
        {
          name: '威仪堂堂进行曲', sub: '高贵的行板', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '四句堂皇的乐句轮番推进：一段比一段更响，末句全体立正。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 128, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 9, w: 136, knock: 2.2, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 11, w: 148, knock: 2.8, stun: 14, anim: 'kick', fx: 'chorus' },
              { delay: 36, damage: 14, w: 164, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '谜语变奏曲', sub: '十四段暗号', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '十四段变奏里先亮出三段：三道虚影由远及近，逐句点向对手。',
          echo: {
            count: 3, damage: 11, knock: 2.8, stun: 15, swing: 'cast',
            spots: [{ dx: -82, delay: 12 }, { dx: 66, delay: 24 }, { dx: -34, delay: 36 }]
          },
          fx: 'echoCall'
        },
        {
          name: 'e小调大提琴协奏曲', sub: '独奏的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '大提琴独奏拉开又合上：8 秒内每次命中都被整个乐团重奏，末句齐奏。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 20, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 82. 罗西尼（华彩）----------------
    {
      id: 'rossini', name: '罗西尼', en: 'ROSSINI', title: '焦阿基诺·罗西尼',
      quote: '给我一份食谱，比给我一份总谱更让我高兴。',
      stats: { hp: 296, power: 18, speed: 18 },
      desc: '渐强的魔术师：同一句反复重复、一次比一次响，直到全场都被震住。',
      sprite: {
        hair: 'mop', hairColor: '#6a5a48', hairDark: '#2e261e',
        coat: ['#5a3040', '#2c1a20', '#98707c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1d1310', '#110b09'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8b8a0', item: 'horn',
        hat: 'tophat', glasses: true,
        height: 0.98, bulk: 1.12, stoop: 1
      },
      skills: [
        {
          name: '塞维利亚的理发师', sub: '渐强的序曲', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '同一句反复重复、一次比一次响：四段乐句层层加码，末句全奏爆发。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 122, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 9, damage: 9, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 18, damage: 11, w: 144, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 27, damage: 14, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '威廉·退尔序曲', sub: '狂奔的骑兵', key: 'W', cd: 5, range: 320, type: 'dashAttack',
          desc: '骑兵冲出来：一路疾驰撞开对手，收尾的号角把人挑飞。',
          dash: { distance: 250, speed: 12, damage: 17, w: 96, h: 88, yOff: -78, knock: 6.5, stun: 20 },
          fx: 'trail'
        },
        {
          name: '灰姑娘', sub: '终场的渐强', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整支乐队一起渐强：8 秒内每次命中都被重奏，最后一句震住全场。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 19, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 83. 克莱门蒂（华彩）----------------
    {
      id: 'clementi', name: '克莱门蒂', en: 'CLEMENTI', title: '穆齐奥·克莱门蒂',
      quote: '把琴弹干净，比弹快更难。',
      stats: { hp: 300, power: 18, speed: 16 },
      desc: '钢琴技术的立法者：练习曲一样均匀的音粒，一颗接一颗砸在对手身上。',
      sprite: {
        hair: 'wig', hairColor: '#d0c0a0', hairDark: '#90805e',
        coat: ['#553a45', '#2e1f26', '#9c7c8a'], coatStyle: 'justaucorps',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#101418', '#0a0d10'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8c8a8', item: 'scroll',
        hat: 'tricorne',
        height: 0.98, bulk: 1.03, stoop: 1
      },
      skills: [
        {
          name: 'Gradus ad Parnassum', sub: '一百首练习曲', key: 'Q', cd: 5, range: 195, type: 'multiHit',
          desc: '均匀的音粒一颗接一颗：五记完全等长的连击，节奏丝毫不乱。',
          hit: { damage: 15, hits: 5, interval: 8, w: 124, h: 84, yOff: -78, knock: 2.2, stun: 12 },
          fx: 'notes'
        },
        {
          name: '六首钢琴奏鸣曲', sub: '清晰的织体', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '清晰的织体在脚下铺开 6 秒：被困者被一节一节地冲刷。',
          field: { kind: 'damage', dur: 6, radius: 174, dps: 11, tickEvery: 26, slow: 0.46, follow: false },
          fx: 'fieldRise'
        },
        {
          name: 'C大调交响曲', sub: '乐长的收束', key: 'E', cd: 15, range: 390, type: 'ultimate',
          desc: '整首交响曲的主题汇成一击：巨大的音块贯穿全场并把对手掀飞。',
          hit: { damage: 45, w: 345, h: 195, yOff: -88, knock: 9, stun: 33, pierce: true },
          fx: 'shock'
        }
      ]
    },

    // ---------------- 84. 萨列里（华彩）----------------
    {
      id: 'salieri', name: '萨列里', en: 'SALIERI', title: '安东尼奥·萨列里',
      quote: '教出来的学生，比我自己的曲子更有名。',
      stats: { hp: 290, power: 19, speed: 17 },
      desc: '维也纳的宫廷乐长：写出的乐句工整得没有一丝缝隙，让学生们无从下手。',
      sprite: {
        hair: 'periwig', hairColor: '#e8e0cc', hairDark: '#a89e88',
        coat: ['#2a3448', '#151b26', '#6a7890'], coatStyle: 'justaucorps',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1a1418', '#100c0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8d0d8', item: 'watch',
        hat: 'tricorne',
        height: 0.99, bulk: 1, stoop: 0
      },
      skills: [
        {
          // v6.0 平衡：宫廷序曲改成四段乐章，避免 slot 0 投掷技把 AI 钉在远处。
          name: '音乐至上', sub: '宫廷的序曲', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '工整的序曲一段段推上来：四段乐句一丝不乱，末段把对手拖慢。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 9, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 10, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'impact' },
              { delay: 30, damage: 13, w: 160, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact', status: { kind: 'slow', dur: 2.2 } }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '交响曲“日子”', sub: '工整的对位', key: 'W', cd: 5, range: 190, type: 'controlHit',
          desc: '一段严丝合缝的对位砸下：命中即让对手定身。',
          hit: { damage: 19, w: 132, h: 88, yOff: -78, knock: 3.2, stun: 18 },
          status: { kind: 'root', dur: 1.3 },
          fx: 'impact'
        },
        {
          name: '达那伊得斯', sub: '宫廷的总奏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '宫廷乐团全奏：8 秒内每次命中都被重奏，末句把对手钉在原地。',
          canon: { dur: 8, delay: 18, ratio: 0.88 },
          hit: { damage: 23, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          status: { kind: 'stun', dur: 1.0 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 85. 安东·埃布尔（终曲）----------------
    {
      id: 'eberl', name: '安东·埃布尔', en: 'EBERL', title: '安东·埃布尔',
      quote: '我的交响曲曾被当成莫扎特的手笔，那是我最好的夸奖。',
      stats: { hp: 292, power: 19, speed: 16 },
      desc: '维也纳的早逝天才：写出的句子和莫扎特像得让人分不清，收尾却更狠。',
      sprite: {
        hair: 'tuft', hairColor: '#e4dcc4', hairDark: '#a09880',
        coat: ['#2c3646', '#171d27', '#68788c'], coatStyle: 'justaucorps',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#161616', '#0d0d0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#a8b0e0', item: 'book',
        hat: 'tricorne',
        height: 0.99, bulk: 1, stoop: 0
      },
      skills: [
        {
          name: '大交响曲', sub: '被误认的手笔', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '四个乐章的主题接连推进：一段比一段重，末句一锤落下。',
          movement: {
            stanzas: [
              { delay: 0, damage: 11, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 12, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 15, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'impact' },
              { delay: 36, damage: 20, w: 164, knock: 4.6, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '钢琴奏鸣曲', sub: '维也纳的对话', key: 'W', cd: 5, range: 190, type: 'multiHit',
          desc: '右手与左手轮流发话：四记重音一次比一次低，把人压在原地。',
          hit: { damage: 13, hits: 4, interval: 9, w: 128, h: 86, yOff: -78, knock: 2.6, stun: 14 },
          fx: 'notes'
        },
        {
          name: '交响曲“胜利”', sub: '一锤定音的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '凯旋的终曲：整支乐团压上来，巨大的音响把对手直接推入终曲。',
          hit: { damage: 37, w: 350, h: 195, yOff: -88, knock: 9.5, stun: 34, pierce: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 86. 杜舍克（终曲）----------------
    {
      id: 'dussek', name: '杜舍克', en: 'DUSSEK', title: '扬·拉迪斯拉夫·杜舍克',
      quote: '我把钢琴侧过来弹，观众才能看见我的脸。',
      stats: { hp: 296, power: 18, speed: 15 },
      desc: '波希米亚的钢琴浪子：把琴侧过来弹给人看，也把对手逼到只剩最后一口气。',
      sprite: {
        hair: 'periwig', hairColor: '#dcd8cc', hairDark: '#9c9888',
        coat: ['#4a2f36', '#27181c', '#94707a'], coatStyle: 'justaucorps',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#131317', '#0b0b0e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0e0a0', item: 'book',
        hat: 'tricorne',
        height: 0.99, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '哀歌奏鸣曲', sub: '失落的主题', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '哀歌飞出去又绕回来：去程低沉、回程轰鸣，并把对手拖回身前。',
          rondo: { kind: 'tear', count: 1, speed: 7.0, range: 320, w: 30, h: 30, damage: 16, backDamage: 26, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '钢琴三重奏', sub: '三件乐器的合围', key: 'W', cd: 5, range: 190, type: 'multiHit',
          desc: '三件乐器围上来：四记合击把对手牢牢按在原地。',
          hit: { damage: 14, hits: 4, interval: 10, w: 130, h: 86, yOff: -78, knock: 2.8, stun: 15 },
          fx: 'shock'
        },
        {
          name: '玛丽·安托瓦内特的受难', sub: '断头台的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '悲剧的最后一幕：8 秒内每次命中都被重奏，末句铡刀落下。',
          canon: { dur: 8, delay: 18, ratio: 1 },
          hit: { damage: 27, w: 335, h: 200, yOff: -86, knock: 8.5, stun: 32 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 87. 威廉·伯德（终曲）----------------
    {
      id: 'byrd', name: '威廉·伯德', en: 'BYRD', title: '威廉·伯德',
      quote: '在暗处写弥撒，在明处写牧歌。',
      stats: { hp: 290, power: 19, speed: 15 },
      desc: '伊丽莎白时代的复调大师：五条声部同时说话，最后一句一定落在终止式上。',
      sprite: {
        hair: 'long', hairColor: '#5a4a3a', hairDark: '#241c14',
        coat: ['#37474a', '#1c2628', '#7c9094'], coatStyle: 'doublet',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b1512', '#100c0a'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d0d8d0', item: 'lute',
        hat: 'beret', ruff: true, beard: true, mustache: true,
        height: 0.98, bulk: 0.99, stoop: 0
      },
      skills: [
        {
          name: '圣体颂', sub: '五声部的合围', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '五个声部依次进入：三道虚影由远及近，一句接一句地击打。',
          echo: {
            count: 3, damage: 10, knock: 2.6, stun: 15, swing: 'cast',
            spots: [{ dx: -78, delay: 11 }, { dx: 64, delay: 22 }, { dx: -30, delay: 33 }]
          },
          fx: 'echoCall'
        },
        {
          name: '帕凡舞曲与加利亚德', sub: '慢与快的对句', key: 'W', cd: 5, range: 195, type: 'movement',
          desc: '先是庄重的帕凡，接着是跳跃的加利亚德：四段乐句由缓到急。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 122, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 9, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 11, w: 144, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 30, damage: 14, w: 160, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '五声部弥撒', sub: '终止式的裁决', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '五个声部汇成一个终止式：8 秒内每次命中都被重奏，末句全声部落下。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 20, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 88. 阿尔坎（终曲）----------------
    {
      id: 'alkan', name: '阿尔坎', en: 'ALKAN', title: '夏尔-瓦朗坦·阿尔坎',
      quote: '我一个人，把整部钢琴弹完了。',
      stats: { hp: 312, power: 21, speed: 13 },
      desc: '钢琴上的巨人：一个人写出整部交响曲的音响，最后一句的重量足以压垮对手。',
      sprite: {
        hair: 'slick', hairColor: '#2e2620', hairDark: '#12100c',
        coat: ['#2a3f4a', '#151f26', '#6c8490'], coatStyle: 'gown',
        shirt: ['#efe6cc', '#b0a486'], pants: ['#101014', '#08080b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b0d8f0', item: 'cane',
        hat: 'tophat', beard: true, mustache: true,
        height: 1.02, bulk: 1.1, stoop: 1
      },
      skills: [
        {
          name: '十二首大调练习曲', sub: '巨人的手指', key: 'Q', cd: 5, range: 195, type: 'multiHit',
          desc: '十根手指同时落下：五记沉重的连击，慢却一句话都插不进去。',
          hit: { damage: 15, hits: 5, interval: 11, w: 132, h: 88, yOff: -78, knock: 2.8, stun: 16 },
          fx: 'shock'
        },
        {
          name: '独奏交响曲', sub: '一台钢琴的乐团', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '整支乐团的音响挤在一台琴上：脚下 7 秒的低音轰鸣让人抬不起脚。',
          field: { kind: 'damage', dur: 7, radius: 186, dps: 9, tickEvery: 28, slow: 0.5, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '大奏鸣曲', sub: '四十分钟的重量', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整部大奏鸣曲的重量砸下来：巨型的音块贯穿全场，把对手掀到半空。',
          hit: { damage: 40, w: 355, h: 200, yOff: -88, knock: 10, stun: 34, pierce: true },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 89. 奥芬巴赫（终曲）----------------
    {
      id: 'offenbach', name: '奥芬巴赫', en: 'OFFENBACH', title: '雅克·奥芬巴赫',
      quote: '我的康康舞曲一响，整个巴黎都站起来了。',
      stats: { hp: 284, power: 19, speed: 19 },
      desc: '轻歌剧之王：一段加洛普舞曲冲过去，笑声还没停，对手已经跳到了终曲。',
      sprite: {
        hair: 'mutton', hairColor: '#6a5a48', hairDark: '#2c241c',
        coat: ['#5e4a2e', '#332616', '#a89268'], coatStyle: 'waistcoat',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1a1912', '#10100b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e0d0f0', item: 'wineglass',
        hat: 'tophat', glasses: true, mustache: true,
        height: 0.97, bulk: 1, stoop: 1
      },
      skills: [
        {
          name: '地狱中的奥菲欧', sub: '加洛普的狂奔', key: 'Q', cd: 5, range: 330, type: 'dashAttack',
          desc: '康康舞的节奏冲出来：一路疾驰撞开对手，收尾的踢腿把人挑飞。',
          dash: { distance: 268, speed: 13, damage: 16, w: 96, h: 88, yOff: -78, knock: 6.5, stun: 20 },
          fx: 'confetti'
        },
        {
          name: '霍夫曼的故事', sub: '三段爱情', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '三段爱情依次上演：三道虚影由远及近，逐句击打。',
          echo: {
            count: 3, damage: 10, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -74, delay: 10 }, { dx: 58, delay: 20 }, { dx: -26, delay: 30 }]
          },
          fx: 'echoCall'
        },
        {
          name: '巴黎的欢笑', sub: '终场的康康', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整个舞厅一起踢腿：6 秒内每次命中都被重奏，末段全体跳起来。',
          canon: { dur: 6, delay: 15, ratio: 0.85 },
          hit: { damage: 23, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 90. 莫什科夫斯基（终曲）----------------
    {
      id: 'moszkowski', name: '莫什科夫斯基', en: 'MOSZKOWSKI', title: '莫里茨·莫什科夫斯基',
      quote: '一首西班牙舞曲，比十页论文管用。',
      stats: { hp: 286, power: 19, speed: 18 },
      desc: '沙龙里的技巧大师：西班牙舞曲一段接一段，跳到最后一下，对手已经站不住。',
      sprite: {
        hair: 'sidepart', hairColor: '#241f1c', hairDark: '#0e0c0a',
        coat: ['#2f4a52', '#1a2a2e', '#7c98a0'], coatStyle: 'waistcoat',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#141016', '#0b090d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b8e8d8', item: 'violin',
        hat: 'mortarboard', mustache: true,
        height: 0.98, bulk: 0.99, stoop: 0
      },
      skills: [
        {
          name: '西班牙舞曲', sub: '五段轮舞', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '五段轮舞一段接一段：节奏越来越紧，末段全体踏地。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 122, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 9, damage: 7, w: 130, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 18, damage: 8, w: 138, knock: 2.2, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 27, damage: 11, w: 156, knock: 4.2, stun: 17, anim: 'kickSkill', fx: 'confetti' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '十五首技巧练习曲', sub: '均匀的音粒', key: 'W', cd: 5, range: 190, type: 'multiHit',
          desc: '均匀的音粒一颗接一颗：五记等长的连击，节奏丝毫不乱。',
          hit: { damage: 7, hits: 5, interval: 8, w: 126, h: 84, yOff: -78, knock: 2.2, stun: 12 },
          fx: 'notes'
        },
        {
          name: '钢琴协奏曲', sub: '沙龙的终场', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整座沙龙一起鼓掌：8 秒内每次命中都被重奏，末句华丽的八度落下。',
          canon: { dur: 8, delay: 17, ratio: 0.7 },
          hit: { damage: 18, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 91. 科恩戈尔德（终曲）----------------
    {
      id: 'korngold', name: '科恩戈尔德', en: 'KORNGOLD', title: '埃里希·沃尔夫冈·科恩戈尔德',
      quote: '好莱坞给了我一支真正的乐团，我为什么不用？',
      stats: { hp: 292, power: 20, speed: 17 },
      desc: '从维也纳神童到好莱坞配乐之父：每一句都写着“最后一击”，收尾从不含糊。',
      sprite: {
        hair: 'slick', hairColor: '#3a2e26', hairDark: '#161210',
        coat: ['#3d4a2f', '#212a19', '#849070'], coatStyle: 'waistcoat',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#191416', '#0f0c0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d890', item: 'quill',
        hat: 'widebrim', glasses: true,
        height: 0.97, bulk: 0.96, stoop: 0
      },
      skills: [
        {
          name: '死城', sub: '维也纳的阴影', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '阴影里的三段乐句依次现身：两道虚影先来，最后一道从正面击中。',
          echo: {
            count: 3, damage: 14, knock: 2.8, stun: 15, swing: 'cast',
            spots: [{ dx: -84, delay: 12 }, { dx: 70, delay: 24 }, { dx: -18, delay: 34 }]
          },
          fx: 'echoCall'
        },
        {
          name: '海盗船', sub: '浪头上的突进', key: 'W', cd: 5, range: 330, type: 'dashAttack',
          desc: '海盗船冲上浪头：一路劈开对手，收尾的横扫把人挑飞。',
          dash: { distance: 258, speed: 12.5, damage: 21, w: 98, h: 88, yOff: -78, knock: 6.6, stun: 20 },
          fx: 'trail'
        },
        {
          name: '侠盗罗宾汉', sub: '剑斗的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '剑光闪过整个森林：8 秒内每次命中都被整个乐团重奏，末句定音。',
          canon: { dur: 8, delay: 16, ratio: 0.9 },
          hit: { damage: 25, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 92. 萨拉萨蒂（终曲）----------------
    {
      id: 'sarasate', name: '萨拉萨蒂', en: 'SARASATE', title: '巴勃罗·德·萨拉萨蒂',
      quote: '琴弓上有火，别靠太近。',
      stats: { hp: 278, power: 19, speed: 21 },
      desc: '西班牙的小提琴之火：一串飞快的经过句之后，曲子和他一起停在最后一下。',
      sprite: {
        hair: 'wild', hairColor: '#1e1a18', hairDark: '#0a0908',
        coat: ['#6a5230', '#3a2c18', '#b49a68'], coatStyle: 'waistcoat',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#121014', '#0a090b'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0d8a0', item: 'violin',
        hat: 'beret', mustache: true,
        height: 0.96, bulk: 0.93, stoop: 0
      },
      skills: [
        {
          name: '流浪者之歌', sub: '吉普赛的狂奔', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '慢板忽然转成极快的舞曲：四段乐句一段比一段快，末句烧起来。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 120, knock: 1.6, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 8, damage: 13, w: 128, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 16, damage: 17, w: 140, knock: 2.4, stun: 12, anim: 'kick', fx: 'notes' },
              { delay: 24, damage: 24, w: 158, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'flame' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '卡门幻想曲', sub: '五段炫技', key: 'W', cd: 5, range: 195, type: 'multiHit',
          desc: '五段炫技一句接一句：五记连击快得看不清，最后一记最重。',
          hit: { damage: 16, hits: 5, interval: 7, w: 128, h: 84, yOff: -78, knock: 2.4, stun: 13 },
          fx: 'chromatic'
        },
        {
          name: '纳瓦拉', sub: '双弦的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '双弦一起拉响：火焰般的音流贯穿全场，被击中者久久无法起身。',
          hit: { damage: 46, w: 345, h: 195, yOff: -88, knock: 9, stun: 33, pierce: true },
          fx: 'flame'
        }
      ]
    },

    // ---------------- 93. 约克·鲍恩（顽固）----------------
    {
      id: 'yorkbowen', name: '约克·鲍恩', en: 'YORK BOWEN', title: '埃德温·约克·鲍恩',
      quote: '只要还有人写调性音乐，我就一直写下去。',
      stats: { hp: 300, power: 19, speed: 16 },
      desc: '被时代忽略的浪漫派：一旦开始就绝不改口，谁也打断不了他的句子。',
      sprite: {
        hair: 'sidepart', hairColor: '#4a3a2a', hairDark: '#1e160e',
        coat: ['#2f3a3a', '#181f1f', '#6c8080'], coatStyle: 'academic',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#171a17', '#0e100e'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#c8e0d0', item: 'book',
        hat: 'bowler',
        height: 1.03, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '升c小调前奏曲', sub: '不断回来的琶音', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '琶音一次次滚回来：四段乐句层层叠上，末段双手一起砸下。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'waves' },
              { delay: 12, damage: 9, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'waves' },
              { delay: 24, damage: 11, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'waves' },
              { delay: 36, damage: 14, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '中音萨克斯协奏曲', sub: '一条不断的旋律', key: 'W', cd: 5, range: 330, type: 'projectile',
          desc: '一条绵长的旋律被推出去：三块音团缓缓滚向对手，把人拖慢。',
          proj: { kind: 'swan', count: 3, speed: 4.2, w: 22, h: 22, spacing: 26, damage: 12, yOff: -78 },
          status: { kind: 'slow', dur: 2.6 },
          fx: 'waves'
        },
        {
          name: '第一钢琴协奏曲', sub: '不肯停下的洪流', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '浪漫主义的洪流冲下来：8 秒内每次命中都被整个乐团重奏，末句齐奏。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 20, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 94. 普菲茨纳（顽固）----------------
    {
      id: 'pfitzner', name: '普菲茨纳', en: 'PFITZNER', title: '汉斯·普菲茨纳',
      quote: '我写的是德国的音乐，谁说都不改。',
      stats: { hp: 308, power: 19, speed: 14 },
      desc: '不肯让步的守旧者：把瓦格纳的和声一路写到底，谁的拳头都推不动他。',
      sprite: {
        hair: 'bald', hairColor: '#9a9088', hairDark: '#544e46',
        coat: ['#523c4a', '#2b1f27', '#98808c'], coatStyle: 'academic',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1c1814', '#11100d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#d8b8a0', item: 'cigar',
        hat: 'flatcap', pipe: true,
        height: 1.01, bulk: 1.08, stoop: 2
      },
      skills: [
        {
          name: '帕莱斯特里纳', sub: '不肯妥协的对话', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '三段对位依次登场：三道虚影由远及近，一句接一句地压上来。',
          echo: {
            count: 3, damage: 11, knock: 2.8, stun: 16, swing: 'cast',
            spots: [{ dx: -80, delay: 12 }, { dx: 68, delay: 24 }, { dx: -32, delay: 36 }]
          },
          fx: 'echoCall'
        },
        {
          name: '德意志魂', sub: '压下来的和声', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '厚重的和声在脚下压开 8 秒：被困者被一层层地碾过并放慢。',
          field: { kind: 'damage', dur: 8, radius: 184, dps: 7, tickEvery: 30, slow: 0.5, follow: false },
          fx: 'fieldRise'
        },
        {
          name: 'b小调小提琴协奏曲', sub: '不肯结束的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '漫长的尾声终于落下：8 秒内每次命中都被重奏，末句全奏把人压垮。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 21, w: 340, h: 200, yOff: -86, knock: 8.5, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 95. 雅那切克（顽固）----------------
    {
      id: 'janacek', name: '雅那切克', en: 'JANACEK', title: '莱奥什·雅那切克',
      quote: '旋律就藏在人说话的声音里。',
      stats: { hp: 296, power: 19, speed: 15 },
      desc: '记录语言旋律的老人：一个小本子记下一辈子的短句，每一句都咬着不放。',
      sprite: {
        hair: 'mane', hairColor: '#e0dcd0', hairDark: '#98948a',
        coat: ['#40504a', '#212a26', '#84968e'], coatStyle: 'tunic',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#141215', '#0c0b0d'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#b8d8a8', item: 'notebook',
        hat: 'flatcap', mustache: true,
        height: 0.96, bulk: 0.95, stoop: 2
      },
      skills: [
        {
          name: '小交响曲', sub: '号角的齐鸣', key: 'Q', cd: 5, range: 330, type: 'projectile',
          desc: '军号一段段地吹出去：五支短促的号声依次飞向对手。',
          proj: { kind: 'flute', count: 5, speed: 5.2, w: 18, h: 18, spacing: 16, damage: 11, yOff: -78 },
          fx: 'notes'
        },
        {
          name: '耶努法', sub: '摩拉维亚的短句', key: 'W', cd: 5, range: 195, type: 'movement',
          desc: '一句句短促的语言旋律接连砸下：四段乐句，末段像喊出来一样。',
          movement: {
            stanzas: [
              { delay: 0, damage: 11, w: 124, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 10, damage: 12, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 20, damage: 15, w: 144, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 30, damage: 19, w: 160, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '格拉哥里弥撒', sub: '古斯拉夫语的怒吼', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整个乐团加上合唱一起吼出来：巨型的音响贯穿全场，被击中者久久不起。',
          hit: { damage: 36, w: 350, h: 195, yOff: -88, knock: 9, stun: 34, pierce: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 96. 库普兰（顽固）----------------
    {
      id: 'couperin', name: '库普兰', en: 'COUPERIN', title: '弗朗索瓦·库普兰',
      quote: '一个装饰音，就能让整首曲子活过来。',
      stats: { hp: 284, power: 18, speed: 17 },
      desc: '法国宫廷的羽管键琴大师：装饰音一颗都不肯少，句子被他捏得死死的。',
      sprite: {
        hair: 'periwig', hairColor: '#f0ece0', hairDark: '#aca898',
        coat: ['#5a4a5c', '#2f2630', '#a08ca4'], coatStyle: 'justaucorps',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#191210', '#0f0b0a'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#e8b8d8', item: 'snuffbox',
        height: 0.98, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '神秘的路障', sub: '绕不开的循环', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '神秘的音型飞出去又绕回来：去程轻巧、回程沉重，并把对手拖回身前。',
          rondo: { kind: 'mystic', count: 1, speed: 7.2, range: 320, w: 30, h: 30, damage: 14, backDamage: 22, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '键琴演奏艺术', sub: '装饰音的墙', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '密密麻麻的装饰音在脚下铺开 7 秒：被困者被反复刮过并放慢。',
          field: { kind: 'damage', dur: 7, radius: 178, dps: 6, tickEvery: 26, slow: 0.48, follow: false },
          fx: 'fieldRise'
        },
        {
          name: '王室协奏曲', sub: '宫廷的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '宫廷乐团一起收束：8 秒内每次命中都被重奏，末句把对手钉在原地。',
          canon: { dur: 8, delay: 18, ratio: 0.9 },
          hit: { damage: 22, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 97. 马尔蒂努（顽固）----------------
    {
      id: 'martinu', name: '马尔蒂努', en: 'MARTINU', title: '博胡斯拉夫·马尔蒂努',
      quote: '我从不修改，我只是一直往下写。',
      stats: { hp: 292, power: 19, speed: 17 },
      desc: '不停笔的流亡者：一台马达般的节奏一旦启动，谁也别想让他停下来。',
      sprite: {
        hair: 'slick', hairColor: '#5a5248', hairDark: '#26221c',
        coat: ['#33413a', '#1a221e', '#748a7e'], coatStyle: 'sweater',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#10121a', '#0a0b10'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#a0c8c8', item: 'cigar',
        hat: 'flatcap', glasses: true,
        height: 1.04, bulk: 0.92, stoop: 1
      },
      skills: [
        {
          name: '朱丽叶塔', sub: '梦里的三段', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '梦里的三段记忆依次浮现：三道虚影由远及近，逐句击打。',
          echo: {
            count: 3, damage: 11, knock: 2.8, stun: 15, swing: 'kick',
            spots: [{ dx: -78, delay: 11 }, { dx: 66, delay: 22 }, { dx: -24, delay: 33 }]
          },
          fx: 'echoCall'
        },
        {
          name: '第六交响曲“幻想”', sub: '马达般的节奏', key: 'W', cd: 5, range: 195, type: 'movement',
          desc: '马达一样的节奏启动：四段乐句不停顿地推过去，末段全体刹车。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'shock' },
              { delay: 10, damage: 9, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'shock' },
              { delay: 20, damage: 11, w: 144, knock: 2.6, stun: 13, anim: 'kick', fx: 'impact' },
              { delay: 30, damage: 14, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '战地弥撒', sub: '不肯停的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '战地上的合唱压过来：8 秒内每次命中都被重奏，末句全体静默。',
          canon: { dur: 8, delay: 17, ratio: 0.8 },
          hit: { damage: 20, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 98. 马斯奈（顽固）----------------
    {
      id: 'massenet', name: '马斯奈', en: 'MASSENET', title: '朱尔·马斯奈',
      quote: '歌剧要让听众流泪，也要让他们微笑。',
      stats: { hp: 286, power: 18, speed: 17 },
      desc: '法国歌剧的甜言蜜语者：一句旋律反反复复地唱，直到对手再也站不稳。',
      sprite: {
        hair: 'mutton', hairColor: '#e8e4d8', hairDark: '#a4a094',
        coat: ['#3f3a2c', '#221f17', '#847c62'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#181019', '#0e0a0f'],
        skin: ['#f2c8a0', '#c08c62'], accent: '#f0c8a0', item: 'harp',
        hat: 'tophat', beard: true,
        height: 0.96, bulk: 0.94, stoop: 1
      },
      skills: [
        {
          name: '黛依丝·沉思', sub: '一条不断的旋律', key: 'Q', cd: 5, range: 330, type: 'projectile',
          desc: '小提琴独奏缓缓推出来：三块音团慢慢滚向对手，被触到的人会被拖慢。',
          proj: { kind: 'aria', count: 3, speed: 4.0, w: 22, h: 22, spacing: 28, damage: 12, yOff: -78 },
          status: { kind: 'slow', dur: 2.6 },
          fx: 'waves'
        },
        {
          name: '维特', sub: '反复的告白', key: 'W', cd: 5, range: 195, type: 'movement',
          desc: '同一句告白反复说了四遍：每一遍都更急，末句彻底爆发。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 124, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 11, damage: 9, w: 132, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 22, damage: 11, w: 144, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 33, damage: 14, w: 160, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '玛侬', sub: '甜言蜜语的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整座歌剧院一起唱：8 秒内每次命中都被重奏，末句把对手留在原地。',
          canon: { dur: 8, delay: 18, ratio: 0.8 },
          hit: { damage: 19, w: 330, h: 200, yOff: -86, knock: 8, stun: 31 },
          status: { kind: 'slow', dur: 2.0 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 99. 格拉祖诺夫（顽固）----------------
    {
      id: 'glazunov', name: '格拉祖诺夫', en: 'GLAZUNOV', title: '亚历山大·格拉祖诺夫',
      quote: '里姆斯基把整部交响曲的配方都交给了我。',
      stats: { hp: 310, power: 19, speed: 14 },
      desc: '音乐学院的老院长：稳稳地站在那里，把每个乐章都写得一丝不乱。',
      sprite: {
        hair: 'bald', hairColor: '#8a8070', hairDark: '#48423a',
        coat: ['#2e3d52', '#18222f', '#6a7c94'], coatStyle: 'academic',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#1b1b16', '#10100d'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#d8b868', item: 'book',
        hat: 'flatcap', beard: true, glasses: true,
        height: 1.02, bulk: 1.09, stoop: 1
      },
      skills: [
        {
          name: '雷蒙达', sub: '大华尔兹', key: 'Q', cd: 5, range: 195, type: 'movement',
          desc: '大华尔兹一段段转过来：四段乐句越来越快，末段全体顿足。',
          movement: {
            stanzas: [
              { delay: 0, damage: 6, w: 128, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 7, w: 136, knock: 2.2, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 9, w: 148, knock: 2.8, stun: 14, anim: 'kick', fx: 'notes' },
              { delay: 36, damage: 11, w: 164, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '四季', sub: '不肯走的冬天', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '四季在脚下轮转 8 秒：被困者被雪与风反复刮过并放慢。',
          field: { kind: 'damage', dur: 8, radius: 182, dps: 4, tickEvery: 28, slow: 0.5, follow: false },
          fx: 'fieldRise'
        },
        {
          name: 'a小调小提琴协奏曲', sub: '稳稳的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '独奏与乐团一起收束：8 秒内每次命中都被重奏，末句稳稳落下。',
          canon: { dur: 8, delay: 18, ratio: 0.63 },
          hit: { damage: 16, w: 335, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 100. 米亚斯科夫斯基（顽固）----------------
    {
      id: 'myaskovsky', name: '米亚斯科夫斯基', en: 'MYASKOVSKY', title: '尼古拉·米亚斯科夫斯基',
      quote: '写了二十七首交响曲，我还是觉得没写完。',
      stats: { hp: 302, power: 19, speed: 14 },
      desc: '苏联交响曲的日记作者：沉闷的低音一层层压上来，怎么写都不肯收笔。',
      sprite: {
        hair: 'tuft', hairColor: '#40342a', hairDark: '#181410',
        coat: ['#4a3a52', '#271e2c', '#8c7c94'], coatStyle: 'tunic',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#141b1b', '#0b0f0f'],
        skin: ['#f7d7b6', '#c99b73'], accent: '#b8c8e8', item: 'cigar',
        hat: 'flatcap', beard: true, glasses: true,
        height: 1, bulk: 1.07, stoop: 2
      },
      skills: [
        {
          name: '第六交响曲', sub: '压下来的低音', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '低音声部一层层压上来：三道虚影由远及近，一句比一句低。',
          echo: {
            count: 3, damage: 10, knock: 2.8, stun: 16, swing: 'cast',
            spots: [{ dx: -82, delay: 12 }, { dx: 64, delay: 25 }, { dx: -30, delay: 38 }]
          },
          fx: 'echoCall'
        },
        {
          name: '第二十一交响曲', sub: '不肯收笔的旋律', key: 'W', cd: 5, range: 195, type: 'movement',
          desc: '一条旋律被翻来覆去地写：四段乐句层层叠加，末段像终于写下句号。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 11, damage: 8, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 22, damage: 10, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'notes' },
              { delay: 33, damage: 13, w: 162, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '大提琴协奏曲', sub: '沉重的收束', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '大提琴把低音拉到最低：8 秒内每次命中都被重奏，末句整支乐团压下。',
          canon: { dur: 8, delay: 19, ratio: 0.77 },
          hit: { damage: 20, w: 345, h: 200, yOff: -86, knock: 8.5, stun: 33 },
          fx: 'chorus'
        }
      ]
    },
  ];

  // =========================================================
  //  面部特征表（v3.1）
  //  shape 脸型 / eyes 眼型 / brows 眉型 / nose 鼻型 / mouth 嘴型 / cheeks 腮部
  //  与发型组合后保证每位作曲家都有可辨认的面孔
  // =========================================================
  var FACE_MAP = {
    // ---- 原有 25 位 ----
    beethoven:    { shape: 'square' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'grim' , cheeks: 'wrinkled'  },
    mozart:       { shape: 'round' , eyes: 'wide' , brows: 'slight' , nose: 'snub' , mouth: 'smile' , cheeks: 'rosy'  },
    brahms:       { shape: 'wide' , eyes: 'sleepy' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'wrinkled'  },
    mahler:       { shape: 'long' , eyes: 'deep' , brows: 'angry' , nose: 'roman' , mouth: 'grim' , cheeks: 'hollow'  },
    wagner:       { shape: 'round' , eyes: 'sharp' , brows: 'angry' , nose: 'hook' , mouth: 'pursed' , cheeks: 'full'  },
    schumann:     { shape: 'round' , eyes: 'sad' , brows: 'arch' , nose: 'small' , mouth: 'smile' , cheeks: 'plain'  },
    rachmaninoff: { shape: 'long' , eyes: 'deep' , brows: 'thick' , nose: 'roman' , mouth: 'grim' , cheeks: 'hollow'  },
    shostakovich: { shape: 'square' , eyes: 'plain' , brows: 'thin' , nose: 'small' , mouth: 'line' , cheeks: 'gaunt'  },
    schoenberg:   { shape: 'wide' , eyes: 'sharp' , brows: 'bushy' , nose: 'hook' , mouth: 'frown' , cheeks: 'hollow'  },
    sibelius:     { shape: 'square' , eyes: 'narrow' , brows: 'thick' , nose: 'flat' , mouth: 'line' , cheeks: 'gaunt'  },
    scriabin:     { shape: 'gaunt' , eyes: 'wide' , brows: 'arch' , nose: 'snub' , mouth: 'open' , cheeks: 'rosy'  },
    liszt:        { shape: 'long' , eyes: 'sharp' , brows: 'arch' , nose: 'hook' , mouth: 'smirk' , cheeks: 'plain'  },
    bach:         { shape: 'round' , eyes: 'plain' , brows: 'thick' , nose: 'big' , mouth: 'grim' , cheeks: 'full'  },
    handel:       { shape: 'wide' , eyes: 'wide' , brows: 'bushy' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    vivaldi:      { shape: 'long' , eyes: 'sharp' , brows: 'thin' , nose: 'hook' , mouth: 'smile' , cheeks: 'plain'  },
    haydn:        { shape: 'square' , eyes: 'sleepy' , brows: 'arch' , nose: 'wide' , mouth: 'smile' , cheeks: 'plain'  },
    dvorak:       { shape: 'round' , eyes: 'dot' , brows: 'flat' , nose: 'wide' , mouth: 'line' , cheeks: 'wrinkled'  },
    verdi:        { shape: 'wide' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'grim' , cheeks: 'wrinkled'  },
    bruckner:     { shape: 'square' , eyes: 'deep' , brows: 'thick' , nose: 'wide' , mouth: 'grim' , cheeks: 'wrinkled'  },
    strauss:      { shape: 'round' , eyes: 'sharp' , brows: 'bushy' , nose: 'roman' , mouth: 'grim' , cheeks: 'full'  },
    debussy:      { shape: 'round' , eyes: 'sleepy' , brows: 'thick' , nose: 'small' , mouth: 'smirk' , cheeks: 'rosy'  },
    ravel:        { shape: 'gaunt' , eyes: 'wide' , brows: 'thin' , nose: 'snub' , mouth: 'tight' , cheeks: 'hollow'  },
    prokofiev:    { shape: 'square' , eyes: 'sharp' , brows: 'angry' , nose: 'flat' , mouth: 'pursed' , cheeks: 'gaunt'  },
    bartok:       { shape: 'gaunt' , eyes: 'deep' , brows: 'bushy' , nose: 'hook' , mouth: 'grim' , cheeks: 'hollow'  },
    vaughan:      { shape: 'long' , eyes: 'sleepy' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'plain'  },
    // ---- v3.0 新增 25 位 ----
    tchaikovsky:  { shape: 'long' , eyes: 'sleepy' , brows: 'arch' , nose: 'small' , mouth: 'frown' , cheeks: 'hollow'  },
    mendelssohn:  { shape: 'round' , eyes: 'round' , brows: 'slight' , nose: 'small' , mouth: 'smile' , cheeks: 'rosy'  },
    chopin:       { shape: 'gaunt' , eyes: 'sad' , brows: 'arch' , nose: 'hook' , mouth: 'tight' , cheeks: 'hollow'  },
    schubert:     { shape: 'round' , eyes: 'round' , brows: 'slight' , nose: 'snub' , mouth: 'open' , cheeks: 'rosy'  },
    gershwin:     { shape: 'square' , eyes: 'wide' , brows: 'thick' , nose: 'big' , mouth: 'smile' , cheeks: 'plain'  },
    grieg:        { shape: 'wide' , eyes: 'wide' , brows: 'bushy' , nose: 'flat' , mouth: 'smile' , cheeks: 'full'  },
    stravinsky:   { shape: 'square' , eyes: 'sharp' , brows: 'bushy' , nose: 'big' , mouth: 'pursed' , cheeks: 'gaunt'  },
    chenqigang:   { shape: 'round' , eyes: 'narrow' , brows: 'thin' , nose: 'flat' , mouth: 'line' , cheeks: 'plain'  },
    britten:      { shape: 'wide' , eyes: 'plain' , brows: 'arch' , nose: 'small' , mouth: 'tight' , cheeks: 'plain'  },
    takemitsu:    { shape: 'long' , eyes: 'narrow' , brows: 'thin' , nose: 'flat' , mouth: 'line' , cheeks: 'gaunt'  },
    purcell:      { shape: 'round' , eyes: 'sharp' , brows: 'arch' , nose: 'hook' , mouth: 'smile' , cheeks: 'plain'  },
    berlioz:      { shape: 'gaunt' , eyes: 'wide' , brows: 'bushy' , nose: 'hook' , mouth: 'open' , cheeks: 'hollow'  },
    monteverdi:   { shape: 'round' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'line' , cheeks: 'wrinkled'  },
    dowland:      { shape: 'long' , eyes: 'sleepy' , brows: 'thin' , nose: 'small' , mouth: 'smile' , cheeks: 'hollow'  },
    joplin:       { shape: 'square' , eyes: 'plain' , brows: 'flat' , nose: 'wide' , mouth: 'smile' , cheeks: 'full'  },
    kapustin:     { shape: 'square' , eyes: 'sharp' , brows: 'thick' , nose: 'big' , mouth: 'smirk' , cheeks: 'plain'  },
    rameau:       { shape: 'round' , eyes: 'sharp' , brows: 'angry' , nose: 'big' , mouth: 'tight' , cheeks: 'full'  },
    hildegard:    { shape: 'round' , eyes: 'round' , brows: 'arch' , nose: 'small' , mouth: 'smile' , cheeks: 'plain'  },
    machaut:      { shape: 'gaunt' , eyes: 'plain' , brows: 'thin' , nose: 'hook' , mouth: 'line' , cheeks: 'hollow'  },
    paganini:     { shape: 'gaunt' , eyes: 'wide' , brows: 'angry' , nose: 'hook' , mouth: 'grim' , cheeks: 'hollow'  },
    weber:        { shape: 'square' , eyes: 'sharp' , brows: 'thin' , nose: 'big' , mouth: 'pursed' , cheeks: 'plain'  },
    palestrina:   { shape: 'wide' , eyes: 'sleepy' , brows: 'bushy' , nose: 'flat' , mouth: 'line' , cheeks: 'wrinkled'  },
    holst:        { shape: 'long' , eyes: 'deep' , brows: 'flat' , nose: 'big' , mouth: 'frown' , cheeks: 'gaunt'  },
    bernstein:    { shape: 'wide' , eyes: 'wide' , brows: 'angry' , nose: 'big' , mouth: 'open' , cheeks: 'full'  },
    boulez:       { shape: 'square' , eyes: 'sharp' , brows: 'arch' , nose: 'flat' , mouth: 'pursed' , cheeks: 'gaunt'  },
    // ---- v5.0 新增 25 位 ----
    webern:       { shape: 'gaunt' , eyes: 'sharp' , brows: 'thin' , nose: 'small' , mouth: 'tight' , cheeks: 'hollow'  },
    hindemith:    { shape: 'square' , eyes: 'plain' , brows: 'flat' , nose: 'wide' , mouth: 'line' , cheeks: 'full'  },
    moscheles:    { shape: 'wide' , eyes: 'sharp' , brows: 'arch' , nose: 'hook' , mouth: 'smile' , cheeks: 'full'  },
    messiaen:     { shape: 'long' , eyes: 'wide' , brows: 'bushy' , nose: 'big' , mouth: 'open' , cheeks: 'full'  },
    medtner:      { shape: 'long' , eyes: 'deep' , brows: 'arch' , nose: 'big' , mouth: 'smile' , cheeks: 'hollow'  },
    berg:         { shape: 'gaunt' , eyes: 'deep' , brows: 'angry' , nose: 'hook' , mouth: 'frown' , cheeks: 'hollow'  },
    ysaye:        { shape: 'wide' , eyes: 'sharp' , brows: 'bushy' , nose: 'big' , mouth: 'tight' , cheeks: 'full'  },
    khachaturian: { shape: 'round' , eyes: 'wide' , brows: 'thick' , nose: 'big' , mouth: 'smile' , cheeks: 'full'  },
    satie:        { shape: 'long' , eyes: 'sleepy' , brows: 'thin' , nose: 'hook' , mouth: 'line' , cheeks: 'hollow'  },
    corelli:      { shape: 'round' , eyes: 'plain' , brows: 'arch' , nose: 'big' , mouth: 'smile' , cheeks: 'full'  },
    pachelbel:    { shape: 'long' , eyes: 'plain' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    telemann:     { shape: 'round' , eyes: 'sharp' , brows: 'arch' , nose: 'flat' , mouth: 'smile' , cheeks: 'plain'  },
    tallis:       { shape: 'gaunt' , eyes: 'sleepy' , brows: 'thin' , nose: 'flat' , mouth: 'line' , cheeks: 'hollow'  },
    perotin:      { shape: 'wide' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    bruch:        { shape: 'long' , eyes: 'sleepy' , brows: 'bushy' , nose: 'hook' , mouth: 'frown' , cheeks: 'full'  },
    faure:        { shape: 'gaunt' , eyes: 'sleepy' , brows: 'arch' , nose: 'hook' , mouth: 'line' , cheeks: 'hollow'  },
    smetana:      { shape: 'square' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'tight' , cheeks: 'full'  },
    franck:       { shape: 'round' , eyes: 'sleepy' , brows: 'bushy' , nose: 'big' , mouth: 'smile' , cheeks: 'full'  },
    rimsky:       { shape: 'long' , eyes: 'plain' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'gaunt'  },
    glinka:       { shape: 'wide' , eyes: 'sharp' , brows: 'arch' , nose: 'flat' , mouth: 'smile' , cheeks: 'plain'  },
    czerny:       { shape: 'square' , eyes: 'plain' , brows: 'thin' , nose: 'flat' , mouth: 'tight' , cheeks: 'gaunt'  },
    arensky:      { shape: 'round' , eyes: 'sleepy' , brows: 'thick' , nose: 'small' , mouth: 'smile' , cheeks: 'full'  },
    rubinstein:   { shape: 'wide' , eyes: 'wide' , brows: 'bushy' , nose: 'big' , mouth: 'open' , cheeks: 'full'  },
    hummel:       { shape: 'round' , eyes: 'sharp' , brows: 'thin' , nose: 'small' , mouth: 'smile' , cheeks: 'plain'  },
    yoshimatsu:   { shape: 'round' , eyes: 'narrow' , brows: 'slight' , nose: 'small' , mouth: 'smile' , cheeks: 'rosy'  },
    // ---- v6.0 新增 25 位（76~100）----
    //  华彩：炫技型，面部偏锐利 / 高鼻 / 明快
    enescu:       { shape: 'round' , eyes: 'wide' , brows: 'thick' , nose: 'roman' , mouth: 'smile' , cheeks: 'full'  },
    atterberg:    { shape: 'wide' , eyes: 'plain' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    bortkiewicz:  { shape: 'gaunt' , eyes: 'sad' , brows: 'worried' , nose: 'hook' , mouth: 'tight' , cheeks: 'hollow'  },
    nielsen:      { shape: 'round' , eyes: 'sharp' , brows: 'flat' , nose: 'wide' , mouth: 'pursed' , cheeks: 'full'  },
    saintsaens:   { shape: 'long' , eyes: 'sharp' , brows: 'thin' , nose: 'hook' , mouth: 'smirk' , cheeks: 'gaunt'  },
    elgar:        { shape: 'wide' , eyes: 'deep' , brows: 'bushy' , nose: 'big' , mouth: 'pursed' , cheeks: 'full'  },
    rossini:      { shape: 'round' , eyes: 'sleepy' , brows: 'thick' , nose: 'big' , mouth: 'smile' , cheeks: 'full'  },
    clementi:     { shape: 'square' , eyes: 'sharp' , brows: 'bushy' , nose: 'roman' , mouth: 'tight' , cheeks: 'full'  },
    salieri:      { shape: 'long' , eyes: 'sharp' , brows: 'thin' , nose: 'roman' , mouth: 'tight' , cheeks: 'hollow'  },
    //  终曲：收束型，下颌与眉骨偏重
    eberl:        { shape: 'gaunt' , eyes: 'plain' , brows: 'slight' , nose: 'snub' , mouth: 'smile' , cheeks: 'plain'  },
    dussek:       { shape: 'wide' , eyes: 'sleepy' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    byrd:         { shape: 'gaunt' , eyes: 'narrow' , brows: 'thin' , nose: 'flat' , mouth: 'tight' , cheeks: 'hollow'  },
    alkan:        { shape: 'gaunt' , eyes: 'sad' , brows: 'bushy' , nose: 'hook' , mouth: 'grim' , cheeks: 'hollow'  },
    offenbach:    { shape: 'long' , eyes: 'sharp' , brows: 'arch' , nose: 'hook' , mouth: 'smirk' , cheeks: 'gaunt'  },
    moszkowski:   { shape: 'square' , eyes: 'wide' , brows: 'thick' , nose: 'big' , mouth: 'smile' , cheeks: 'full'  },
    korngold:     { shape: 'round' , eyes: 'sleepy' , brows: 'arch' , nose: 'roman' , mouth: 'smirk' , cheeks: 'full'  },
    sarasate:     { shape: 'long' , eyes: 'sharp' , brows: 'bushy' , nose: 'hook' , mouth: 'grim' , cheeks: 'gaunt'  },
    //  顽固：抗打断型，轮廓方正敦厚
    yorkbowen:    { shape: 'square' , eyes: 'sleepy' , brows: 'thick' , nose: 'big' , mouth: 'line' , cheeks: 'full'  },
    pfitzner:     { shape: 'square' , eyes: 'deep' , brows: 'bushy' , nose: 'wide' , mouth: 'frown' , cheeks: 'hollow'  },
    janacek:      { shape: 'gaunt' , eyes: 'wide' , brows: 'bushy' , nose: 'wide' , mouth: 'open' , cheeks: 'wrinkled'  },
    couperin:     { shape: 'round' , eyes: 'sleepy' , brows: 'arch' , nose: 'big' , mouth: 'pursed' , cheeks: 'wrinkled'  },
    martinu:      { shape: 'long' , eyes: 'plain' , brows: 'thin' , nose: 'roman' , mouth: 'line' , cheeks: 'gaunt'  },
    massenet:     { shape: 'round' , eyes: 'sad' , brows: 'arch' , nose: 'snub' , mouth: 'smile' , cheeks: 'rosy'  },
    glazunov:     { shape: 'square' , eyes: 'deep' , brows: 'thick' , nose: 'wide' , mouth: 'grim' , cheeks: 'full'  },
    myaskovsky:   { shape: 'wide' , eyes: 'sleepy' , brows: 'bushy' , nose: 'flat' , mouth: 'frown' , cheeks: 'full'  },
  };

  // =========================================================
  //  羁绊标签：绿色＝时期划分，黄色＝地区派别
  //  同一标签在出战三人中有 2 名及以上 → 触发共鸣
  // =========================================================
  var TAG_MAP = {
    // ---- 原有 25 位（'现代主义' 依 3.0 需求更名为 '现代'）----
    beethoven:    { era: '古典主义',     region: '德奥' },
    mozart:       { era: '古典主义',     region: '德奥' },
    brahms:       { era: '前中浪漫主义', region: '德奥' },
    mahler:       { era: '晚期浪漫主义', region: '德奥' },
    wagner:       { era: '晚期浪漫主义', region: '德奥' },
    schumann:     { era: '前中浪漫主义', region: '德奥' },
    rachmaninoff: { era: '晚期浪漫主义', region: '俄派' },   // v5.0：由「前中浪漫主义」改归「晚期浪漫主义」
    shostakovich: { era: '现代',         region: '俄派' },
    schoenberg:   { era: '现代',         region: '德奥' },
    sibelius:     { era: '晚期浪漫主义', region: '北欧' },
    scriabin:     { era: '晚期浪漫主义', region: '俄派' },
    liszt:        { era: '晚期浪漫主义', region: '德奥' },
    bach:         { era: '巴洛克',       region: '德奥' },
    handel:       { era: '巴洛克',       region: '英派' },
    vivaldi:      { era: '巴洛克',       region: '意大利' },
    haydn:        { era: '古典主义',     region: '德奥' },
    dvorak:       { era: '前中浪漫主义', region: '北欧' },
    verdi:        { era: '前中浪漫主义', region: '意大利' },
    bruckner:     { era: '晚期浪漫主义', region: '德奥' },
    strauss:      { era: '晚期浪漫主义', region: '德奥' },
    debussy:      { era: '晚期浪漫主义', region: '法派' },
    ravel:        { era: '晚期浪漫主义', region: '法派' },
    prokofiev:    { era: '现代',         region: '俄派' },
    bartok:       { era: '现代',         region: '俄派' },
    vaughan:      { era: '现代',         region: '英派' },
    // ---- 3.0 新增 25 位 ----
    tchaikovsky:  { era: '前中浪漫主义', region: '俄派' },
    mendelssohn:  { era: '前中浪漫主义', region: '德奥' },
    chopin:       { era: '前中浪漫主义', region: '波兰' },   // 波兰；与法派同组共鸣
    schubert:     { era: '前中浪漫主义', region: '德奥' },
    gershwin:     { era: '爵士',         region: '美国' },
    grieg:        { era: '前中浪漫主义', region: '北欧' },
    stravinsky:   { era: '现代',         region: '俄派' },
    chenqigang:   { era: '现代',         region: '亚洲' },
    britten:      { era: '现代',         region: '英派' },
    takemitsu:    { era: '现代',         region: '亚洲' },
    purcell:      { era: '巴洛克',       region: '英派' },
    berlioz:      { era: '前中浪漫主义', region: '法派' },
    monteverdi:   { era: '文艺复兴',     region: '意大利' },
    dowland:      { era: '文艺复兴',     region: '英派' },
    joplin:       { era: '爵士',         region: '美国' },
    kapustin:     { era: '爵士',         region: '俄派' },
    rameau:       { era: '巴洛克',       region: '法派' },
    hildegard:    { era: '中世纪',       region: '德奥' },
    machaut:      { era: '中世纪',       region: '法派' },
    paganini:     { era: '古典主义',     region: '意大利' },
    weber:        { era: '古典主义',     region: '德奥' },
    palestrina:   { era: '文艺复兴',     region: '意大利' },
    holst:        { era: '晚期浪漫主义', region: '英派' },
    bernstein:    { era: '现代',         region: '美国' },
    boulez:       { era: '现代',         region: '法派' },
    // ---- v5.0 新增 25 位（绿色＝时期 / 黄色＝地区）----
    perotin:      { era: '中世纪',       region: '法派' },
    tallis:       { era: '文艺复兴',     region: '英派' },
    telemann:     { era: '巴洛克',       region: '德奥' },
    corelli:      { era: '巴洛克',       region: '意大利' },
    pachelbel:    { era: '巴洛克',       region: '德奥' },
    hummel:       { era: '古典主义',     region: '德奥' },
    moscheles:    { era: '前中浪漫主义', region: '德奥' },
    ysaye:        { era: '前中浪漫主义', region: '比利时' },  // 比利时；与法派同组共鸣
    bruch:        { era: '前中浪漫主义', region: '德奥' },
    faure:        { era: '前中浪漫主义', region: '法派' },
    smetana:      { era: '前中浪漫主义', region: '北欧' },
    franck:       { era: '前中浪漫主义', region: '法派' },
    rimsky:       { era: '前中浪漫主义', region: '俄派' },
    glinka:       { era: '前中浪漫主义', region: '俄派' },
    czerny:       { era: '前中浪漫主义', region: '德奥' },
    arensky:      { era: '前中浪漫主义', region: '俄派' },
    rubinstein:   { era: '前中浪漫主义', region: '俄派' },
    medtner:      { era: '晚期浪漫主义', region: '俄派' },
    satie:        { era: '晚期浪漫主义', region: '法派' },
    webern:       { era: '现代',         region: '德奥' },
    hindemith:    { era: '现代',         region: '德奥' },
    messiaen:     { era: '现代',         region: '法派' },
    berg:         { era: '现代',         region: '德奥' },
    khachaturian: { era: '现代',         region: '俄派' },
    yoshimatsu:   { era: '现代',         region: '亚洲' },
    // ---- v6.0 新增 25 位（绿色＝时期 / 黄色＝地区）----
    //  华彩（Cadenza）9 位
    enescu:       { era: '现代',         region: '东欧' },   // 东欧；与北欧、南欧同组共鸣
    atterberg:    { era: '晚期浪漫主义', region: '北欧' },
    bortkiewicz:  { era: '晚期浪漫主义', region: '俄派' },
    nielsen:      { era: '晚期浪漫主义', region: '北欧' },
    saintsaens:   { era: '前中浪漫主义', region: '法派' },
    elgar:        { era: '晚期浪漫主义', region: '英派' },
    rossini:      { era: '古典主义',     region: '意大利' },
    clementi:     { era: '古典主义',     region: '意大利' },
    salieri:      { era: '古典主义',     region: '德奥' },
    //  终曲（Finale）8 位
    eberl:        { era: '古典主义',     region: '德奥' },
    dussek:       { era: '古典主义',     region: '德奥' },
    byrd:         { era: '文艺复兴',     region: '英派' },
    alkan:        { era: '前中浪漫主义', region: '法派' },
    offenbach:    { era: '前中浪漫主义', region: '法派' },
    moszkowski:   { era: '晚期浪漫主义', region: '俄派' },
    korngold:     { era: '现代',         region: '德奥' },
    sarasate:     { era: '前中浪漫主义', region: '南欧' },   // 南欧；与北欧、东欧同组共鸣
    //  顽固（Ostinato）8 位
    yorkbowen:    { era: '晚期浪漫主义', region: '英派' },
    pfitzner:     { era: '晚期浪漫主义', region: '德奥' },
    janacek:      { era: '现代',         region: '北欧' },
    couperin:     { era: '巴洛克',       region: '法派' },
    martinu:      { era: '现代',         region: '北欧' },
    massenet:     { era: '前中浪漫主义', region: '法派' },
    glazunov:     { era: '晚期浪漫主义', region: '俄派' },
    myaskovsky:   { era: '现代',         region: '俄派' }
  };

  // 标签顺序（用于界面展示与统计）
  var ERA_TAGS = ['中世纪', '文艺复兴', '巴洛克', '古典主义', '前中浪漫主义', '晚期浪漫主义', '现代', '爵士'];
  var REGION_TAGS = ['德奥', '俄派', '北欧', '意大利', '法派', '英派', '美国', '亚洲', '波兰', '比利时', '南欧', '东欧'];

  // 共鸣同组（v5.0 重写，v6.0 新增南欧 / 东欧）：
  //   需求：伊萨伊（比利时）可与法派共鸣，但不可与身为波兰的肖邦共鸣。
  //   注意「能共鸣」在这里**不是等价关系**——法派同时与波兰、比利时两国共鸣，
  //   但波兰与比利时之间毫无关系。旧的「一个标签 → 一个组名」写法无法表达这种
  //   结构（法派被拆到两个组里就永远漏算一半人），所以改成显式列出
  //   「所有能一起共鸣的标签集合」，判定时逐集合去数人头：
  //     · {波兰, 法派}       → 肖邦 + 德彪西 ✅
  //     · {比利时, 法派}     → 伊萨伊 + 福莱 ✅
  //     · 伊萨伊 + 肖邦      → 两个集合都凑不齐 2 人 ❌
  //   v6.0 追加：萨拉萨蒂（南欧）可与北欧、东欧共鸣；埃内斯库（东欧）可与北欧、
  //   南欧共鸣。三人互为可共鸣 → 写成一个三标签集合即可（北欧原本自成单标签集合，
  //   加入本集合后仍然保留「同名即共鸣」，因为 computeBonds 会额外补上单标签候选）。
  //   没被列进任何集合的标签（德奥 / 俄派 …）自成单标签集合，即「同名即可共鸣」。
  var REGION_GROUPS = [
    ['波兰/法派', ['波兰', '法派']],
    ['比利时/法派', ['比利时', '法派']],
    ['北欧/南欧/东欧', ['北欧', '南欧', '东欧']]
  ];
  var REGION_CIRCLE = {};
  (function () {
    for (var g = 0; g < REGION_GROUPS.length; g++) {
      var members = REGION_GROUPS[g][1];
      for (var m = 0; m < members.length; m++) {
        if (!REGION_CIRCLE[members[m]]) REGION_CIRCLE[members[m]] = members.slice();
      }
    }
    // 未配置的标签自成一组（彼此同名即可共鸣）
    for (var t = 0; t < REGION_TAGS.length; t++) {
      if (!REGION_CIRCLE[REGION_TAGS[t]]) REGION_CIRCLE[REGION_TAGS[t]] = [REGION_TAGS[t]];
    }
  })();

  /** 两个地区标签能否互相共鸣（选人界面的高亮与「同组」判断都用它）
   *  v5.1 修复：必须与 computeBonds 的「候选集合」语义完全一致。
   *  旧实现用 REGION_CIRCLE（"第一个包含该标签的集合"）求交集，
   *  而"求交"等价于传递闭包 —— 于是 波兰 与 比利时 会经由 法派 被判为互相共鸣，
   *  选人界面高亮成"可共鸣"，开战后 computeBonds 却返回 null。
   *  正确语义是：「存在某个候选集合同时包含 a 与 b」。 */
  function regionResonates(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;                       // 同名即可共鸣（自反）
    for (var g = 0; g < REGION_GROUPS.length; g++) {
      var m = REGION_GROUPS[g][1];
      if (m.indexOf(a) >= 0 && m.indexOf(b) >= 0) return true;
    }
    return false;
  }

  /** 某地区标签所属的代表性共鸣组（仅用于展示；可能不唯一，取配置顺序第一个） */
  function regionGroupOf(tag) {
    return REGION_CIRCLE[tag] || [tag];
  }

  // 各标签的代表色（让色块本身携带信息）
  var ERA_COLOR = {
    '中世纪': '#8a7fd0', '文艺复兴': '#d08a5a', '巴洛克': '#c8a24a',
    '古典主义': '#4ee0b0', '前中浪漫主义': '#6fd06f', '晚期浪漫主义': '#4aa8e0',
    '现代': '#c86ad0', '爵士': '#e0a040'
  };
  var REGION_COLOR = {
    '德奥': '#ffd166', '俄派': '#e07a5f', '北欧': '#7ec8e0', '意大利': '#9fd66f',
    '法派': '#c8a2ff', '英派': '#6fd0c0', '美国': '#ff9c6f', '亚洲': '#ff6f9c',
    '波兰': '#f0f0f0', '比利时': '#e0c060',
    // v6.0 新增：南欧＝西班牙/罗马尼亚一线的地中海暖色，东欧＝偏冷的青灰
    '南欧': '#ffb066', '东欧': '#a8b8d8'
  };

  // =========================================================
  //  红色「体系」标签（v4.0 五项 + v5.0 两项）：按技能机制划分，各带独立共鸣效果
  //  界面上只显示子标签（和声 / 领域 / 乐章 / 回旋 / 卡农 / 循环 / 节拍）
  // =========================================================
  var SYSTEM_TAGS = ['和声', '领域', '乐章', '回旋', '卡农', '循环', '节拍', '华彩', '终曲', '顽固'];
  var SYSTEM_COLOR = '#ff5b5b';
  var SYSTEM_DESC = {
    '和声': '生命上限 +18%、获得 7% 吸血',
    '领域': '移速 +30%；每 8 秒获得 2 秒额外 +60% 移速爆发',
    '乐章': '伤害 14% 概率 ×2、8% 概率 ×3、3% 概率 ×4',
    '回旋': '免疫 8% 伤害；每 7 秒 75% 概率展开 1 秒反弹盾（反弹 60%）',
    '卡农': '终极技冷却 ×80%，技能 1/2 冷却 ×60%',
    '循环': '每 7 秒回复 18% 已损失生命；血量 ≤20% 时改为 12%',
    '节拍': '挥拳与踢腿的攻击速度 +14%',
    // ---- v6.0 新增三套 ----
    '华彩': '每 8 秒命中附带 0.7 秒眩晕（期间无法操作）',
    '终曲': '敌人生命降至其上限 5% 以下即斩杀，结束本轮',
    '顽固': '抗打断：普攻硬直 60% 概率无效；控制时间 −50%'
  };
  var SYSTEM_MAP = {
    // ---- 和声：v1.0 的 12 位元老 ----
    beethoven: '和声', mozart: '和声', brahms: '和声', mahler: '和声',
    wagner: '和声', schumann: '和声', rachmaninoff: '和声', shostakovich: '和声',
    schoenberg: '和声', sibelius: '和声', scriabin: '和声', liszt: '和声',
    // ---- 领域：v2.0 的 13 位 ----
    bruckner: '领域', strauss: '领域', prokofiev: '领域', haydn: '领域', bach: '领域',
    vivaldi: '领域', handel: '领域', bartok: '领域', debussy: '领域', ravel: '领域',
    vaughan: '领域', dvorak: '领域', verdi: '领域',
    // ---- 乐章：v3.0 的 10 位 ----
    tchaikovsky: '乐章', mendelssohn: '乐章', chopin: '乐章', schubert: '乐章',
    gershwin: '乐章', grieg: '乐章', stravinsky: '乐章', chenqigang: '乐章',
    britten: '乐章', takemitsu: '乐章',
    // ---- 回旋：v3.0 的 6 位 ----
    purcell: '回旋', berlioz: '回旋', monteverdi: '回旋', dowland: '回旋',
    joplin: '回旋', kapustin: '回旋',
    // ---- 卡农：v3.0 的 9 位 ----
    rameau: '卡农', hildegard: '卡农', machaut: '卡农', paganini: '卡农',
    weber: '卡农', palestrina: '卡农', holst: '卡农', bernstein: '卡农', boulez: '卡农',
    // ---- 循环（v5.0）：音型反复回响，12 位 ----
    webern: '循环', hindemith: '循环', moscheles: '循环', messiaen: '循环',
    medtner: '循环', berg: '循环', ysaye: '循环', khachaturian: '循环',
    satie: '循环', corelli: '循环', pachelbel: '循环', hummel: '循环',
    // ---- 节拍（v5.0）：舞曲强拍律动，13 位 ----
    telemann: '节拍', tallis: '节拍', perotin: '节拍', bruch: '节拍', faure: '节拍',
    smetana: '节拍', franck: '节拍', rimsky: '节拍', glinka: '节拍', czerny: '节拍',
    arensky: '节拍', rubinstein: '节拍', yoshimatsu: '节拍',
    // ---- 华彩（v6.0）：炫技乐句令对手怔住，9 位 ----
    //  每 8 秒的命中附带 0.7 秒眩晕
    enescu: '华彩', atterberg: '华彩', bortkiewicz: '华彩', nielsen: '华彩',
    saintsaens: '华彩', elgar: '华彩', rossini: '华彩', clementi: '华彩', salieri: '华彩',
    // ---- 终曲（v6.0）：收束句一锤定音，8 位 ----
    //  命中后敌人生命降至其上限 5% 以下 → 立即斩杀
    eberl: '终曲', dussek: '终曲', byrd: '终曲', alkan: '终曲',
    offenbach: '终曲', moszkowski: '终曲', korngold: '终曲', sarasate: '终曲',
    // ---- 顽固（v6.0）：顽固音型（ostinato）般打不断的持续，8 位 ----
    //  抗打断：普通攻击硬直 60% 概率无效，控制类效果时间 −50%
    yorkbowen: '顽固', pfitzner: '顽固', janacek: '顽固', couperin: '顽固',
    martinu: '顽固', massenet: '顽固', glazunov: '顽固', myaskovsky: '顽固'
  };
  // 各体系共鸣效果数值（供 game.js 读取）
  var SYSTEM_BOND = {
    hpBonus: 0.18,          // 和声：生命上限 +18%
    lifesteal: 0.07,        // 和声：7% 吸血（v4.2）
    speedBonus: 0.30,       // 领域：移速 +30%（v4.2：原 20%）
    // 领域（v6.0）：每 8 秒获得 2 秒的额外 +60% 移速爆发
    speedBurstBonus: 0.60,
    speedBurstInterval: 8 * 60,
    speedBurstDur: 2 * 60,
    // 乐章（v4.2）：三档互斥判定，由高到低
    x4Chance: 0.03,         //   3% 概率 ×4
    x3Chance: 0.08,         //   8% 概率 ×3
    x2Chance: 0.14,         //  14% 概率 ×2
    damageCut: 0.08,        // 回旋：免疫 8% 伤害
    // 回旋（v6.0）：每 7 秒 75% 概率展开 1 秒反弹护盾（反弹原本伤害的 60%）
    //   （v5.0 为 33% / 0.8 秒 / 50%）
    rondoInterval: 7 * 60,
    rondoChance: 0.75,
    rondoShield: 1.0 * 60,
    rondoReflect: 0.6,
    ultCd: 0.80,            // 卡农：终极技冷却 ×0.8
    skillCd: 0.60,          // 卡农：技能 1/2 冷却 ×0.6
    // 循环（v5.0）：对战中每 7 秒回复 18% 已损失生命
    // 循环（v6.0）：血量降到自身上限 20% 以下后，回复量改为 12% 已损失生命
    loopInterval: 7 * 60,
    loopHealRatio: 0.18,
    loopLowHealRatio: 0.12,
    loopLowHpRatio: 0.20,
    // 节拍（v6.0）：挥拳 / 踢腿的攻击速度 +14%（动画推进速度倍率；v5.0 为 +20%）
    basicSpeed: 1.14,
    // 华彩（v6.0）：每 8 秒的命中附带 0.7 秒眩晕
    cadenzaInterval: 8 * 60,
    cadenzaStun: 0.7 * 60,
    // 终曲（v6.0）：敌人生命降至其上限 5% 以下即斩杀
    executeThreshold: 0.05,
    // 顽固（v6.0）：普通攻击硬直 60% 概率无效；控制类效果时间 −50%
    stubbornBasicNegate: 0.60,
    stubbornControlCut: 0.50
  };

  /**
   * 乐章共鸣的伤害倍率掷点（互斥，由高到低判定）
   * @returns {number} 1 / 2 / 3 / 4
   */
  function rollSystemDamageMul() {
    var r = Math.random();
    if (r < SYSTEM_BOND.x4Chance) return 4;
    if (r < SYSTEM_BOND.x4Chance + SYSTEM_BOND.x3Chance) return 3;
    if (r < SYSTEM_BOND.x4Chance + SYSTEM_BOND.x3Chance + SYSTEM_BOND.x2Chance) return 2;
    return 1;
  }

  var BY_ID = {};
  for (var i = 0; i < LIST.length; i++) {
    var c = LIST[i];
    c.index = i;
    c.maxHp = c.stats.hp;
    var tg = TAG_MAP[c.id] || {};
    c.tags = { era: tg.era || null, region: tg.region || null, system: SYSTEM_MAP[c.id] || null };
    c.sprite.face = FACE_MAP[c.id] || { shape: 'round', eyes: 'plain', brows: 'thin', nose: 'small', mouth: 'line', cheeks: 'plain' };
    BY_ID[c.id] = c;
  }

  // ---------- 羁绊规则（4.2 数值调整）----------
  var BOND = {
    eraDamage: 0.12,          // 绿色（时期）共鸣：伤害 +12%
    regionMin: 6 * 60,        // 黄色（地区）共鸣：两次免疫之间的随机间隔下限 6 秒
    regionMax: 15 * 60,       //                           随机间隔上限 15 秒
    regionInvuln: 2.5 * 60,   // 免疫全部伤害 2.5 秒
    need: 2                   // 同一标签至少 2 人
  };

  /** 掷出黄色共鸣下一次免疫的间隔帧数（6~15 秒之间随机） */
  function rollRegionInterval() {
    return Math.round(BOND.regionMin + Math.random() * (BOND.regionMax - BOND.regionMin));
  }

  /**
   * 黄色共鸣的效果文案（选人界面与 HUD 共用同一份数值来源，
   * 避免改了 BOND 之后界面文案没跟着改——v4.1 就出现过写着“每 12 秒”的情况）
   */
  function regionBondText() {
    return '每 ' + Math.round(BOND.regionMin / 60) + '~' + Math.round(BOND.regionMax / 60) +
      ' 秒免疫全部伤害 ' + (BOND.regionInvuln / 60) + ' 秒';
  }

  // =========================================================
  //  技能持续时间与冷却规范化（v4.0）
  //  原则：冷却时间必须明显长于技能本身的持续时间，
  //        避免"持续 8 秒、冷却 5 秒"导致效果无限延续；
  //        纯伤害类技能没有持续时间，冷却可以放低。
  // =========================================================
  function skillDuration(sk) {
    var d = 0;
    if (sk.field && sk.field.dur) d = Math.max(d, sk.field.dur);
    if (sk.echo && sk.echo.spots) {
      for (var i = 0; i < sk.echo.spots.length; i++) {
        var e = sk.echo.spots[i];
        d = Math.max(d, ((e.delay || 0) + 42) / 60);
      }
    }
    if (sk.movement && sk.movement.stanzas) {
      var last = 0;
      for (var j = 0; j < sk.movement.stanzas.length; j++) {
        last = Math.max(last, sk.movement.stanzas[j].delay || 0);
      }
      d = Math.max(d, (last + 42) / 60);
    }
    if (sk.canon && sk.canon.dur) d = Math.max(d, sk.canon.dur);
    if (sk.rondo) {
      var dist = (sk.rondo.range || 300) * 2;
      d = Math.max(d, dist / Math.max(1, sk.rondo.speed || 7) / 60);
    }
    if (sk.self) {
      if (sk.self.armor && sk.self.armor.dur) d = Math.max(d, sk.self.armor.dur);
      if (sk.self.buff && sk.self.buff.dur) d = Math.max(d, sk.self.buff.dur);
    }
    if (sk.status && sk.status.dur) d = Math.max(d, sk.status.dur);
    return d;
  }

  // 冷却规则：持续类 = 持续时间 + 余量；非持续类可放低
  var CD_RULE = {
    skillMargin: 2.5,   // 技能 1/2：持续结束后还需等待的秒数
    ultMargin: 5,       // 终极技：更长的余量
    flatSkill: 4,       // 无持续时间技能的冷却（原 5 秒，略放低）
    flatUlt: 12         // 无持续时间终极技的冷却（原 15 秒，略放低）
  };

  function normalizeCooldowns(list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      for (var k = 0; k < c.skills.length; k++) {
        var sk = c.skills[k];
        var isUlt = sk.type === 'ultimate' || k === 2;
        var dur = skillDuration(sk);
        sk.dur = Math.round(dur * 10) / 10;
        var base = sk.cd || (isUlt ? 15 : 5);
        var cd;
        if (dur > 0.05) {
          cd = Math.max(base, Math.ceil(dur + (isUlt ? CD_RULE.ultMargin : CD_RULE.skillMargin)));
        } else {
          cd = isUlt ? Math.min(base, CD_RULE.flatUlt) : Math.min(base, CD_RULE.flatSkill);
        }
        sk.cd = cd;
      }
    }
  }
  normalizeCooldowns(LIST);

  /**
   * 计算一支队伍（作曲家数组或 id 数组）的羁绊共鸣结果
   * 三种标签：era 时期（绿）/ region 地区（黄，支持同组共鸣）/ system 体系（红）
   * @returns { era: {tag,count,idxs}|null, region: {...}|null, system: {...}|null }
   */
  function computeBonds(list) {
    var ids = [];
    for (var i = 0; i < list.length; i++) {
      ids.push(typeof list[i] === 'string' ? list[i] : list[i].id);
    }
    var out = { era: null, region: null, system: null };
    var kinds = [
      ['era', ERA_TAGS],
      ['region', REGION_TAGS],
      ['system', SYSTEM_TAGS]
    ];
    for (var k = 0; k < kinds.length; k++) {
      var key = kinds[k][0], tags = kinds[k][1];
      var best = null;
      // 候选共鸣组：era / system 每个标签自成一组；
      // region 要用「所有能一起共鸣的标签集合」，因为同一标签可能出现在多个集合里
      // （法派既与波兰共鸣、也与比利时共鸣，而波兰与比利时彼此不共鸣）。
      var candidates = [];
      if (key === 'region') {
        for (var cg = 0; cg < REGION_GROUPS.length; cg++) candidates.push(REGION_GROUPS[cg][1]);
      }
      for (var t0 = 0; t0 < tags.length; t0++) candidates.push([tags[t0]]);
      for (var c = 0; c < candidates.length; c++) {
        var members = candidates[c];
        var idxs = [], tagCount = {};
        for (var m = 0; m < ids.length; m++) {
          var cc = BY_ID[ids[m]];
          if (!cc) continue;
          var own = cc.tags[key];
          if (own && members.indexOf(own) >= 0) {
            idxs.push(m);
            tagCount[own] = (tagCount[own] || 0) + 1;
          }
        }
        if (idxs.length >= BOND.need && (!best || idxs.length > best.count)) {
          // 展示用标签：按 REGION/ERA 顺序列出组内实际出现的标签
          var present = [];
          for (var ti = 0; ti < tags.length; ti++) {
            if (tagCount[tags[ti]]) present.push(tags[ti]);
          }
          best = {
            tag: present.join('/'),
            group: (key === 'region') ? members.slice().sort().join('/') : members[0],
            count: idxs.length, idxs: idxs, kind: key
          };
        }
      }
      out[key] = best;
    }
    return out;
  }

  global.COMPOSERS = LIST;
  global.COMPOSER_BY_ID = BY_ID;
  global.TAG_MAP = TAG_MAP;
  global.FACE_MAP = FACE_MAP;
  global.ERA_TAGS = ERA_TAGS;
  global.REGION_TAGS = REGION_TAGS;
  global.SYSTEM_TAGS = SYSTEM_TAGS;
  global.SYSTEM_MAP = SYSTEM_MAP;
  global.SYSTEM_DESC = SYSTEM_DESC;
  global.SYSTEM_BOND = SYSTEM_BOND;
  global.rollSystemDamageMul = rollSystemDamageMul;
  global.SYSTEM_COLOR = SYSTEM_COLOR;
  global.ERA_COLOR = ERA_COLOR;
  global.REGION_COLOR = REGION_COLOR;
  global.skillDuration = skillDuration;
  global.REGION_GROUPS = REGION_GROUPS;
  global.regionGroupOf = regionGroupOf;
  global.regionResonates = regionResonates;
  global.BOND = BOND;
  global.rollRegionInterval = rollRegionInterval;
  global.regionBondText = regionBondText;
  global.computeBonds = computeBonds;
})(window);

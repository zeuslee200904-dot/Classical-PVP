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
      stats: { hp: 230, power: 20, speed: 16 },
      desc: '均衡的正面强攻型。血量最厚，拳脚沉重，终极技范围极大。',
      sprite: {
        hair: 'mane', hairColor: '#8c8177', hairDark: '#4c453f',
        coat: ['#3a4a7a', '#232f52', '#5b6da6'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2a2f45', '#171a2a'],
        skin: SKIN.fair, accent: '#d8c98a', item: 'baton',
        height: 1.02, bulk: 1.06, stoop: 1
      },
      skills: [
        {
          name: '月光奏鸣曲', sub: '月光·静谧领域', key: 'Q', cd: 5, range: 250, type: 'projectile',
          desc: '三连月光音波缓缓推进，被击中者移动与出拳都会变慢。',
          proj: { kind: 'moon', count: 3, speed: 4.2, w: 20, h: 20, spacing: 26, damage: 9, yOff: -78 },
          status: { kind: 'slow', dur: 3.0 }
        },
        {
          name: '命运交响曲', sub: '命运叩门', key: 'W', cd: 5, range: 150, type: 'hitbox',
          desc: '四记“命运动机”重击身前，每击都会把对手震退并造成短暂硬直。',
          hit: { damage: 12, hits: 4, interval: 9, w: 122, h: 84, yOff: -78, knock: 2.6, stun: 16 },
          fx: 'shock'
        },
        {
          name: '第九交响曲', sub: '欢乐升华', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '《欢乐颂》主题爆发：以自身为中心炸开巨型金色音浪，穿盾穿透、伤害极高并强制击飞。',
          hit: { damage: 46, w: 340, h: 190, yOff: -90, knock: 9.5, stun: 40, pierce: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 2. 莫扎特 ----------------
    {
      id: 'mozart', name: '莫扎特', en: 'MOZART', title: '沃尔夫冈·阿马德乌斯·莫扎特',
      quote: '音符对我来说已经太多了。',
      stats: { hp: 190, power: 15, speed: 24 },
      desc: '全场最快。走位灵动、出手密集，靠速度与走位弥补血少。',
      sprite: {
        hair: 'wig', hairColor: '#f0ead8', hairDark: '#b5ae95',
        coat: ['#8e2f3c', '#5e1c26', '#c25a67'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#3a3242', '#211c28'],
        skin: SKIN.pale, accent: '#e8d9a0', item: 'baton',
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
          self: { heal: 16 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 3. 勃拉姆斯 ----------------
    {
      id: 'brahms', name: '勃拉姆斯', en: 'BRAHMS', title: '约翰内斯·勃拉姆斯',
      quote: '慢工出细活，二十年一首交响曲。',
      stats: { hp: 220, power: 18, speed: 15 },
      desc: '厚实耐打的近身缠斗型，控制与持续伤害兼备。',
      sprite: {
        hair: 'short', hairColor: '#b9a68c', hairDark: '#7a6b56', beard: true,
        coat: ['#4b5540', '#2c3325', '#79855f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#3b3a33', '#22211c'],
        skin: SKIN.fair, accent: '#c8b07a', item: 'baton',
        height: 1.0, bulk: 1.14, stoop: 1
      },
      skills: [
        {
          name: '匈牙利舞曲', sub: '强制起舞', key: 'Q', cd: 5, range: 170, type: 'controlHit',
          desc: '匈牙利舞曲一响，对手身不由己地踏起舞步：被定住并持续掉血 3 秒。',
          hit: { damage: 10, w: 150, h: 96, yOff: -78, knock: 1.2, stun: 22 },
          status: { kind: 'dance', dur: 3.0, dps: 5 },
          fx: 'notes'
        },
        {
          name: '摇篮曲', sub: '摇篮·安眠曲', key: 'W', cd: 5, range: 120, type: 'projectile',
          desc: '轻柔的摇篮曲飘出，被笼罩的对手昏昏欲睡，速度骤降 5 秒。',
          proj: { kind: 'lullaby', count: 1, speed: 3.6, w: 32, h: 32, damage: 8, yOff: -80 },
          status: { kind: 'slow', dur: 5.0, power: 0.45 },
          fx: 'zzz'
        },
        {
          name: '第一交响曲', sub: '巨人交响·终曲', key: 'E', cd: 15, range: 150, type: 'ultimate',
          desc: '积蓄二十年的力量倾泻而出：身边音墙爆发，自身获得护盾，并将回复造成伤害的一半生命。',
          hit: { damage: 38, w: 210, h: 180, yOff: -88, knock: 7.5, stun: 34 },
          self: { shield: 45, heal: 18 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 4. 马勒 ----------------
    {
      id: 'mahler', name: '马勒', en: 'MAHLER', title: '古斯塔夫·马勒',
      quote: '交响曲必须像整个世界一样。',
      stats: { hp: 240, power: 22, speed: 11 },
      desc: '最厚重的体格与最强的单发伤害，但转身缓慢，需靠预判出招。',
      sprite: {
        hair: 'wild', hairColor: '#5a4638', hairDark: '#332619',
        coat: ['#2f3238', '#1a1c20', '#575d68'], coatStyle: 'tailed',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2b2c34', '#191a1f'],
        skin: SKIN.fair, accent: '#b9c6d8', item: 'baton',
        height: 1.08, bulk: 1.22, stoop: 1
      },
      skills: [
        {
          name: '大地之歌', sub: '大地·送别', key: 'Q', cd: 5, range: 260, type: 'projectile',
          desc: '沉厚的大地之声贴地涌来，击中后会把对手掀翻在地。',
          proj: { kind: 'earth', count: 2, speed: 3.4, w: 34, h: 34, damage: 14, yOff: -60, spacing: 40, low: true },
          status: { kind: 'root', dur: 1.2 }
        },
        {
          name: '第一交响曲', sub: '巨人·葬礼进行曲', key: 'W', cd: 5, range: 130, type: 'meleeSwing',
          desc: '巨人般的沉重挥击，被命中的对手会被打飞很远。',
          hit: { damage: 24, w: 120, h: 100, yOff: -80, knock: 8.0, stun: 20 },
          fx: 'impact'
        },
        {
          name: '第八交响曲', sub: '千人交响·千人齐鸣', key: 'E', cd: 15, range: 960, type: 'ultimate',
          desc: '调动千人合唱轰鸣全场：全屏音浪无差别轰击（离开场地也无处可逃），伤害极高。',
          hit: { damage: 50, w: 960, h: 540, yOff: -60, knock: 10, stun: 44, fullScreen: true },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 5. 瓦格纳 ----------------
    {
      id: 'wagner', name: '瓦格纳', en: 'WAGNER', title: '威廉·理查德·瓦格纳',
      quote: '我要写一部前所未有的总体艺术品。',
      stats: { hp: 215, power: 23, speed: 14 },
      desc: '爆发力最强的近身型。半音阶突袭极难格挡，终极技伤害恐怖。',
      sprite: {
        hair: 'beret', hairColor: '#6b5a49', hairDark: '#3f3227',
        coat: ['#5c2b52', '#361630', '#8f4b81'], coatStyle: 'frock',
        shirt: ['#efe9db', '#b0a894'], pants: ['#33303c', '#1d1b23'],
        skin: SKIN.fair, accent: '#d6b96a', item: 'baton',
        height: 1.0, bulk: 1.12, stoop: 0
      },
      skills: [
        {
          name: '特里斯坦与伊索尔德', sub: '特里斯坦和弦·无限渴望', key: 'Q', cd: 5, range: 130, type: 'meleeSwing',
          desc: '无法解决的和弦撕裂空气，这一击无视格挡。',
          hit: { damage: 10, w: 112, h: 92, yOff: -78, knock: 2.4, stun: 16, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '漂泊的荷兰人', sub: '幽灵船突袭', key: 'W', cd: 5, range: 240, type: 'dashAttack',
          desc: '化作幽灵船冲破风浪，横穿战场撞飞对手。',
          dash: { distance: 240, speed: 9.0, damage: 18, w: 60, h: 92, yOff: -76, knock: 6.5, stun: 18 },
          fx: 'ghost'
        },
        {
          name: '尼伯龙根的指环', sub: '诸神黄昏', key: 'E', cd: 15, range: 180, type: 'ultimate',
          desc: '指环的诅咒终结一切：以自身为中心连续三波烈焰与雷鸣，最后一波会把对手击飞。',
          hit: { damage: 22, hits: 3, interval: 16, w: 220, h: 190, yOff: -88, knock: 9, stun: 36 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 6. 舒曼 ----------------
    {
      id: 'schumann', name: '舒曼', en: 'SCHUMANN', title: '罗伯特·舒曼',
      quote: '音乐是诗的一种更高形式。',
      stats: { hp: 195, power: 16, speed: 19 },
      desc: '灵巧的幻术型：用幻影与梦境的音波折磨对手，续航靠“狂欢节”。',
      sprite: {
        hair: 'wavy', hairColor: '#8a6f55', hairDark: '#54402f',
        coat: ['#2f6b63', '#1a3f3a', '#4f9d92'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33362f', '#1d1f1a'],
        skin: SKIN.fair, accent: '#e0b0c8', item: 'baton',
        height: 0.98, bulk: 0.96, stoop: 0
      },
      skills: [
        {
          name: '童年情景', sub: '童年·异国与异事', key: 'Q', cd: 5, range: 150, type: 'multiHit',
          desc: '十三首童年小品的连环敲击，五连击快而零碎。',
          hit: { damage: 5, hits: 5, interval: 7, w: 104, h: 84, yOff: -78, knock: 1.0, stun: 12 }
        },
        {
          name: '梦幻曲', sub: '梦幻·迷离幻影', key: 'W', cd: 5, range: 320, type: 'projectile',
          desc: '梦境弥漫之处尽是幻影：被命中的对手视野迷乱，陷入减速与持续流失。',
          proj: { kind: 'dream', count: 2, speed: 4.0, w: 30, h: 30, damage: 9, yOff: -84, spacing: 34 },
          status: { kind: 'slow', dur: 4.0, power: 0.5 },
          fx: 'zzz'
        },
        {
          name: '狂欢节', sub: '狂欢节·四音狂欢', key: 'E', cd: 15, range: 900, type: 'ultimate',
          desc: '狂欢节的彩纸与音符席卷全场：大范围伤害并回复自身生命。',
          hit: { damage: 40, w: 900, h: 300, yOff: -80, knock: 8, stun: 36 },
          self: { heal: 34 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 7. 拉赫玛尼诺夫 ----------------
    {
      id: 'rachmaninoff', name: '拉赫玛尼诺夫', en: 'RACHMANINOFF', title: '谢尔盖·瓦西里耶维奇·拉赫玛尼诺夫',
      quote: '我的双手能跨十二度。',
      stats: { hp: 235, power: 21, speed: 13 },
      desc: '巨型钢琴家：超大范围的锤击与厚重护盾，靠护盾换血。',
      sprite: {
        hair: 'short', hairColor: '#3a3a3a', hairDark: '#1c1c1c',
        coat: ['#232733', '#141720', '#454c60'], coatStyle: 'tailed',
        shirt: ['#f2eee2', '#b6b09c'], pants: ['#25272f', '#15161b'],
        skin: SKIN.fair, accent: '#a8b8cc', item: 'baton',
        height: 1.06, bulk: 1.2, stoop: 1
      },
      skills: [
        {
          name: '帕格尼尼主题狂想曲', sub: '狂想·无尽随想', key: 'Q', cd: 5, range: 150, type: 'projectile',
          desc: '二十四段变奏连续轰出，一路推进的音符墙会把对手压在墙角。',
          proj: { kind: 'rhapsody', count: 3, speed: 5.2, w: 24, h: 30, damage: 11, yOff: -80, spacing: 22 },
          fx: 'trail'
        },
        {
          name: '第二钢琴协奏曲', sub: '拉二·钟声轰鸣', key: 'W', cd: 5, range: 135, type: 'meleeSwing',
          desc: '开场那排钟声般的和弦，砸下的同时为自己生成厚重护盾吸收 35 点伤害。',
          hit: { damage: 18, w: 128, h: 100, yOff: -80, knock: 5.5, stun: 20 },
          self: { shield: 35 },
          fx: 'impact'
        },
        {
          name: '第三钢琴协奏曲', sub: '拉三·钢铁洪流', key: 'E', cd: 15, range: 360, type: 'ultimate',
          desc: '被称为“大象之作”的巨量音符倾泻：连续五波音流横扫全场，击退所有敌人。',
          hit: { damage: 13, hits: 5, interval: 10, w: 360, h: 220, yOff: -88, knock: 6, stun: 30 },
          fx: 'torrent'
        }
      ]
    },

    // ---------------- 8. 肖斯塔科维奇 ----------------
    {
      id: 'shostakovich', name: '肖斯塔科维奇', en: 'SHOSTAKOVICH', title: '德米特里·德米特里耶维奇·肖斯塔科维奇',
      quote: '请转告我，我不是懦夫。',
      stats: { hp: 205, power: 19, speed: 16 },
      desc: '压迫感十足的炮击型：锯齿波、列宁格勒炮火与步步紧逼的圆舞曲。',
      sprite: {
        hair: 'crop', hairColor: '#6b6157', hairDark: '#3d372f', glasses: true, glasses: true,
        coat: ['#4a4a52', '#2a2a30', '#75757f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f3038', '#1b1c21'],
        skin: SKIN.fair, accent: '#cfd6e0', item: 'baton',
        height: 0.98, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '第五交响曲', sub: '革命·锯齿风暴', key: 'Q', cd: 5, range: 130, type: 'meleeSwing',
          desc: '尖锐的锯齿音簇爆发，命中后留下一层“锯齿”持续割伤对手。',
          hit: { damage: 16, w: 122, h: 96, yOff: -78, knock: 3.4, stun: 18 },
          status: { kind: 'bleed', dur: 3.0, dps: 4 },
          fx: 'chromatic'
        },
        {
          name: '列宁格勒交响曲', sub: '列宁格勒·炮火入侵', key: 'W', cd: 5, range: 420, type: 'projectile',
          desc: '侵略者的脚步化作连环炮击，两颗炮弹依次在远处炸开。',
          proj: { kind: 'shell', count: 2, speed: 6.0, w: 30, h: 30, damage: 17, yOff: -70, spacing: 60, arc: true },
          fx: 'impact'
        },
        {
          name: '第二圆舞曲', sub: '圆舞曲·三拍终局', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '三拍子的优雅杀意：全场扫过三重音浪，每一击都会让对手愈陷愈深。',
          hit: { damage: 15, hits: 3, interval: 18, w: 400, h: 240, yOff: -86, knock: 5, stun: 30 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 9. 勋伯格 ----------------
    {
      id: 'schoenberg', name: '勋伯格', en: 'SCHOENBERG', title: '阿诺尔德·勋伯格',
      quote: '我发现了十二音体系。',
      stats: { hp: 200, power: 20, speed: 16 },
      desc: '颠覆规则的十二音魔法师：不能用常理格挡，能用“月迷彼埃罗”诅咒对手。',
      sprite: {
        hair: 'bald', hairColor: '#c9c2b4', hairDark: '#8f887a',
        coat: ['#5a5145', '#352f27', '#8b8271'], coatStyle: 'frock',
        shirt: ['#efe9db', '#b0a894'], pants: ['#3a3730', '#211f1a'],
        skin: SKIN.fair, accent: '#c9a227', item: 'baton',
        height: 0.97, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '升华之夜', sub: '升华·半音爬行', key: 'Q', cd: 5, range: 320, type: 'projectile',
          desc: '半音阶缓缓爬升，两道无法被格挡的弦乐音波穿过一切障碍。',
          proj: { kind: 'chroma', count: 2, speed: 4.4, w: 28, h: 28, damage: 13, yOff: -82, spacing: 30, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '月迷彼埃罗', sub: '彼埃罗·十二音诅咒', key: 'W', cd: 5, range: 150, type: 'controlHit',
          desc: '念出十二音咒语，被诅咒者招式冷却全部延长 5 秒，并陷入混乱减速。',
          hit: { damage: 8, w: 140, h: 96, yOff: -78, knock: 2.0, stun: 20 },
          status: { kind: 'curse', dur: 5.0, extraCd: 5 },
          fx: 'circle'
        },
        {
          name: '管弦乐变奏曲', sub: '变奏·十二音矩阵', key: 'E', cd: 15, range: 200, type: 'ultimate',
          desc: '十二音矩阵在对手身上同时奏响，瞬间打出六段音列，最后一段将对手击飞。',
          hit: { damage: 9, hits: 6, interval: 8, w: 200, h: 180, yOff: -84, knock: 8, stun: 34 },
          fx: 'matrix'
        }
      ]
    },

    // ---------------- 10. 西贝柳斯 ----------------
    {
      id: 'sibelius', name: '西贝柳斯', en: 'SIBELIUS', title: '让·西贝柳斯',
      quote: '交响曲是血液里的事。',
      stats: { hp: 210, power: 17, speed: 18 },
      desc: '北国的守护者：远程压制强，还能用“芬兰颂”给自己套上减伤的冰霜结界。',
      sprite: {
        hair: 'short', hairColor: '#bdb49c', hairDark: '#7d7660',
        coat: ['#2b4a68', '#172c40', '#4b7ba6'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2e3440', '#1a1e26'],
        skin: SKIN.fair, accent: '#bcd8e8', item: 'baton',
        height: 1.0, bulk: 1.0, stoop: 0
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
          desc: '颂歌响起，北国的冰霜结界覆盖全身：造成大范围伤害，并获得 6 秒 60% 减伤。',
          hit: { damage: 38, w: 300, h: 200, yOff: -86, knock: 8, stun: 36 },
          self: { shield: 40, armor: { dur: 6, power: 0.4 } },
          fx: 'frost'
        }
      ]
    },

    // ---------------- 11. 斯克里亚宾 ----------------
    {
      id: 'scriabin', name: '斯克里亚宾', en: 'SCRIABIN', title: '亚历山大·尼古拉耶维奇·斯克里亚宾',
      quote: '我要用神秘和弦完成狂喜之诗。',
      stats: { hp: 200, power: 24, speed: 17 },
      desc: '攻击力最高、血量最薄的高风险刺客，技能多带吸血与增益。',
      sprite: {
        hair: 'wild', hairColor: '#4a3a2c', hairDark: '#2a2018',
        coat: ['#6b3a7a', '#3f2049', '#9e63ad'], coatStyle: 'tailed',
        shirt: ['#efe9db', '#b0a894'], pants: ['#31283c', '#1c1622'],
        skin: SKIN.pale, accent: '#e8c86a', item: 'baton',
        height: 0.96, bulk: 0.94, stoop: 0
      },
      skills: [
        {
          name: '神秘和弦', sub: '神秘和弦·音簇', key: 'Q', cd: 5, range: 200, type: 'projectile',
          desc: '由四度叠置构成的神秘和弦扩散出去，命中会把对手向斜上方掀翻。',
          proj: { kind: 'mystic', count: 2, speed: 4.6, w: 30, h: 30, damage: 16, yOff: -80, spacing: 30 },
          fx: 'circle'
        },
        {
          name: '狂喜之诗', sub: '狂喜·吸血音诗', key: 'W', cd: 5, range: 150, type: 'meleeSwing',
          desc: '狂喜的音诗撕开对手，并把造成伤害的一半化作自己的生命。',
          hit: { damage: 21, w: 130, h: 98, yOff: -80, knock: 4.0, stun: 18 },
          self: { lifesteal: 0.5 },
          fx: 'flame'
        },
        {
          name: '普罗米修斯', sub: '普罗米修斯·火之诗', key: 'E', cd: 15, range: 170, type: 'ultimate',
          desc: '盗来的天火浸透全身：8 秒内攻击力提升 60%、移动提速，并立刻打出火焰冲击。',
          hit: { damage: 42, w: 230, h: 190, yOff: -88, knock: 8.5, stun: 34 },
          self: { buff: { dur: 8, power: 0.6, speed: 0.25 } },
          fx: 'flame'
        }
      ]
    },

    // ---------------- 12. 李斯特 ----------------
    {
      id: 'liszt', name: '李斯特', en: 'LISZT', title: '弗朗茨·李斯特',
      quote: '钢琴之王，舞台之魔。',
      stats: { hp: 205, power: 20, speed: 19 },
      desc: '炫技的舞台之王：连击与高速突进，终极技换来回光返照般的巅峰状态。',
      sprite: {
        hair: 'long', hairColor: '#cfc7b0', hairDark: '#8b8471',
        coat: ['#1f1f28', '#101018', '#3d3d4d'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#26262e', '#141419'],
        skin: SKIN.fair, accent: '#d4af37', item: 'baton',
        height: 1.02, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '匈牙利狂想曲第二号', sub: '狂想·弗利斯卡', key: 'Q', cd: 5, range: 200, type: 'dashAttack',
          desc: '弗利斯卡舞段越奏越快，突进期间一路连撞对手。',
          dash: { distance: 200, speed: 7.8, damage: 17, w: 58, h: 92, yOff: -76, knock: 5.0, stun: 16 },
          fx: 'trail'
        },
        {
          name: '钟', sub: '钟·高音铃震', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '高音区的钟声层层叠加，大范围音波震荡并让对手陷入耳鸣减速。',
          proj: { kind: 'bell', count: 3, speed: 5.6, w: 26, h: 26, damage: 10, yOff: -86, spacing: 24 },
          status: { kind: 'slow', dur: 3.5, power: 0.4 }
        },
        {
          name: '浮士德交响曲', sub: '浮士德·梅菲斯特终曲', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '与魔鬼签约：四波狂想轰击全场，之后进入 6 秒“巅峰状态”，攻击力提升 25%。',
          hit: { damage: 11, hits: 4, interval: 12, w: 340, h: 200, yOff: -88, knock: 6, stun: 28 },
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
      stats: { hp: 210, power: 18, speed: 15 },
      desc: '复调宗师：以“声部”围攻对手，并用平均律领域持续压制战场。',
      sprite: {
        hair: 'queue', hairColor: '#ded8c4', hairDark: '#9c9683',
        coat: ['#2b3a5e', '#182238', '#4a5f8c'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.fair, accent: '#e8d9a0', item: 'baton',
        height: 1.0, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '赋格的艺术', sub: '声部追逐', key: 'Q', cd: 5, range: 260, type: 'echo',
          desc: '三个声部依次进入：三道巴赫的虚影分别在前、后、上方现身并逐一击出。',
          echo: {
            count: 3, damage: 12, knock: 2.6, stun: 15, swing: 'kick',
            spots: [{ dx: -70, delay: 10 }, { dx: 70, delay: 22 }, { dx: 0, delay: 34 }]
          },
          fx: 'echoCall'
        },
        {
          name: '平均律键盘曲集', sub: '十二调领域', key: 'W', cd: 5, range: 200, type: 'field',
          desc: '在身旁展开 8 秒的十二调领域：领域内的对手持续受伤并被减速。',
          field: { kind: 'damage', dur: 8, radius: 172, dps: 5, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '马太受难曲', sub: '受难合唱', key: 'E', cd: 15, range: 340, type: 'ultimate',
          desc: '受难合唱轰然响起：展开巨大领域并召出四道合唱虚影同时击打对手。',
          field: { kind: 'damage', dur: 6, radius: 205, dps: 7, tickEvery: 30, slow: 0.5, follow: false },
          echo: {
            count: 4, damage: 10, knock: 3, stun: 16, swing: 'cast',
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
      stats: { hp: 215, power: 19, speed: 15 },
      desc: '英伦宫廷大师：用水之领域困住对手，再以哈利路亚合唱层层围击。',
      sprite: {
        hair: 'mane', hairColor: '#f0ead8', hairDark: '#a9a28c',
        coat: ['#5a2f3f', '#331a24', '#8c5568'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#33303c', '#1d1b23'],
        skin: SKIN.fair, accent: '#e8d9a0', item: 'baton',
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
            count: 4, damage: 11, knock: 2.4, stun: 14, swing: 'cast',
            spots: [{ dx: -80, delay: 10 }, { dx: 80, delay: 18 }, { dx: -40, delay: 26 }, { dx: 40, delay: 34 }]
          },
          fx: 'chorus'
        },
        {
          name: '皇家焰火音乐', sub: '焰火齐鸣', key: 'E', cd: 15, range: 360, type: 'ultimate',
          desc: '皇家焰火在战场炸开：大范围领域灼烧全场，同时三道焰火虚影追击对手。',
          field: { kind: 'damage', dur: 5, radius: 235, dps: 9, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 12, knock: 4, stun: 18, swing: 'kick', spots: [{ dx: -70, delay: 10 }, { dx: 70, delay: 18 }, { dx: 0, delay: 26 }] },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 15. 维瓦尔第 ----------------
    {
      id: 'vivaldi', name: '维瓦尔第', en: 'VIVALDI', title: '安东尼奥·维瓦尔第',
      quote: '四季轮转，皆成音乐。',
      stats: { hp: 200, power: 17, speed: 19 },
      desc: '红发神父：以四季领域统治战场，春可自愈、冬能冻杀，是纯粹的领域型角色。',
      sprite: {
        hair: 'wavy', hairColor: '#a8503a', hairDark: '#6d3020',
        coat: ['#7a3428', '#4a1e16', '#a85a48'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f2a26', '#1b1815'],
        skin: SKIN.pale, accent: '#e8d9a0', item: 'baton',
        height: 0.98, bulk: 0.98, stoop: 0
      },
      skills: [
        {
          name: '四季·春', sub: '春之领域', key: 'Q', cd: 5, range: 160, type: 'field',
          desc: '春日重回大地：8 秒的春之领域中自己持续回血，对手则被藤蔓拖慢。',
          field: { kind: 'heal', dur: 8, radius: 172, dps: 3, heal: 4, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '四季·冬', sub: '凛冬之领域', key: 'W', cd: 5, range: 300, type: 'field',
          desc: '寒风骤起：在对手脚下铺开 6 秒冰雪领域，急速冻杀并大幅减速。',
          field: { kind: 'damage', dur: 6, radius: 190, dps: 7, tickEvery: 30, slow: 0.35, follow: false },
          fx: 'frost'
        },
        {
          name: '四季', sub: '四季轮转', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '春夏秋冬接连降临：超长领域伤害随时间不断攀升，同时治疗自己并击飞对手。',
          field: { kind: 'ramp', dur: 10, radius: 225, dps: 4, ramp: 0.12, tickEvery: 30, slow: 0.45, heal: 3, follow: false },
          hit: { damage: 18, w: 300, h: 190, yOff: -86, knock: 7, stun: 30 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 16. J.海顿 ----------------
    {
      id: 'haydn', name: 'J.海顿', en: 'HAYDN', title: '弗朗茨·约瑟夫·海顿',
      quote: '惊愕，是最好的调味料。',
      stats: { hp: 205, power: 16, speed: 19 },
      desc: '交响曲之父：最擅长“惊愕”——虚影会从对手背后突然现身重击。',
      sprite: {
        hair: 'queue', hairColor: '#e6e0cc', hairDark: '#a49e8a',
        coat: ['#3f5a3a', '#253620', '#6b8c5f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.fair, accent: '#d8c98a', item: 'baton',
        height: 0.97, bulk: 0.95, stoop: 0
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
          field: { kind: 'heal', dur: 8, radius: 245, dps: 9, heal: 6, tickEvery: 30, slow: 0.5, follow: false },
          hit: { damage: 20, w: 340, h: 200, yOff: -86, knock: 7.5, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 17. 德沃夏克 ----------------
    {
      id: 'dvorak', name: '德沃夏克', en: 'DVORAK', title: '安东宁·德沃夏克',
      quote: '音乐应当来自人民，唱给人民。',
      stats: { hp: 222, power: 19, speed: 15 },
      desc: '新世界之歌：念故乡的领域为他续航，斯拉夫舞曲的虚影成群冲锋。',
      sprite: {
        hair: 'wavy', hairColor: '#6b5544', hairDark: '#3f3125',
        coat: ['#4a4a3a', '#2b2b20', '#7a7a5f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.fair, accent: '#c8b07a', item: 'baton',
        height: 1.02, bulk: 1.12, stoop: 1
      },
      skills: [
        {
          name: '第九交响曲', sub: '自新世界·念故乡', key: 'Q', cd: 5, range: 160, type: 'field',
          desc: '思乡的旋律环绕自身 8 秒：持续回复生命，靠近的对手被旋律拖住。',
          field: { kind: 'heal', dur: 8, radius: 178, dps: 3, heal: 5, tickEvery: 30, slow: 0.5, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '斯拉夫舞曲', sub: '热烈轮舞', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '三道舞者虚影踏着轮舞节拍轮番冲撞，一波接一波。',
          echo: {
            count: 3, damage: 13, knock: 3.4, stun: 16, swing: 'kick',
            spots: [{ dx: -90, delay: 10 }, { dx: 90, delay: 20 }, { dx: 0, delay: 30 }]
          },
          fx: 'trail'
        },
        {
          name: '第九交响曲·第四乐章', sub: '新世界终曲', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '新世界终曲轰然而至：三队虚影先后冲锋，最后由本人撞出决定性一击。',
          echo: { count: 3, damage: 15, knock: 4, stun: 18, swing: 'kick', spots: [{ dx: -100, delay: 10 }, { dx: 100, delay: 20 }, { dx: 0, delay: 30 }] },
          hit: { damage: 24, w: 300, h: 190, yOff: -86, knock: 9, stun: 34 },
          fx: 'impact'
        }
      ]
    },

    // ---------------- 18. 威尔第 ----------------
    {
      id: 'verdi', name: '威尔第', en: 'VERDI', title: '朱塞佩·威尔第',
      quote: '让我们回到过去吧，那才是真正的进步。',
      stats: { hp: 215, power: 21, speed: 15 },
      desc: '歌剧之王：震怒之日的领域与凯旋进行曲的军阵，专打阵地消耗。',
      sprite: {
        hair: 'short', hairColor: '#b8b0a0', hairDark: '#7a7264', beard: true,
        coat: ['#2f2f38', '#1a1a20', '#575760'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2b2b30', '#181819'],
        skin: SKIN.fair, accent: '#c9a227', item: 'baton',
        height: 1.0, bulk: 1.14, stoop: 1
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
      stats: { hp: 242, power: 22, speed: 11 },
      desc: '大教堂般的体格：血量最厚，管风琴领域为自己提供护体减伤。',
      sprite: {
        hair: 'receding', hairColor: '#9c9484', hairDark: '#635c50',
        coat: ['#2f3238', '#1a1c20', '#575d68'], coatStyle: 'frock',
        shirt: ['#efe9db', '#b0a894'], pants: ['#2b2c34', '#191a1f'],
        skin: SKIN.fair, accent: '#b9c6d8', item: 'baton',
        height: 1.08, bulk: 1.24, stoop: 1
      },
      skills: [
        {
          name: '第四交响曲', sub: '浪漫·森林圆号', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '圆号在森林中三度回响：三道虚影由远及近，一次比一次更重。',
          echo: {
            count: 3, damage: 14, knock: 3.6, stun: 18, swing: 'cast',
            spots: [{ dx: -110, delay: 12 }, { dx: 110, delay: 26 }, { dx: 0, delay: 40 }]
          },
          fx: 'echoCall'
        },
        {
          name: '第八交响曲', sub: '大教堂管风琴', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '管风琴轰鸣笼罩自身 9 秒：领域内持续减伤，并震伤靠近的对手。',
          field: { kind: 'armor', dur: 9, radius: 185, dps: 5, tickEvery: 30, armor: 0.4, slow: 0.55, follow: true },
          fx: 'chorus'
        },
        {
          name: '第七交响曲', sub: '瓦格纳挽歌', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '为瓦格纳而作的挽歌：巨型领域层层堆叠轰响，最后以铜管齐鸣击飞对手。',
          field: { kind: 'damage', dur: 7, radius: 262, dps: 10, tickEvery: 24, slow: 0.5, follow: false },
          hit: { damage: 22, w: 340, h: 200, yOff: -88, knock: 8, stun: 32 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 20. 理查·施特劳斯 ----------------
    {
      id: 'strauss', name: '理查·施特劳斯', en: 'R.STRAUSS', title: '理查·施特劳斯',
      quote: '我可以用音乐描写一把汤匙。',
      stats: { hp: 220, power: 23, speed: 14 },
      desc: '交响诗巨匠：日出领域兼具灼烧与自愈，恶作剧的虚影神出鬼没。',
      sprite: {
        hair: 'bald', hairColor: '#b0a898', hairDark: '#726a5c', mustache: true,
        coat: ['#3a3a4a', '#212128', '#63637a'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f2f38', '#1b1b20'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 1.0, bulk: 1.08, stoop: 0
      },
      skills: [
        {
          name: '查拉图斯特拉如是说', sub: '日出', key: 'Q', cd: 5, range: 170, type: 'field',
          desc: '日出之光照亮战场 8 秒：灼烧领域内的对手，同时为自己持续回复生命。',
          field: { kind: 'heal', dur: 8, radius: 200, dps: 7, heal: 3, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'chorus'
        },
        {
          name: '蒂尔的恶作剧', sub: '恶作剧回声', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '蒂尔的恶作剧：两道虚影从两侧窜出，狠狠捉弄对手一番。',
          echo: {
            count: 2, damage: 17, knock: 3.4, stun: 17, swing: 'punch',
            spots: [{ dx: -85, delay: 14 }, { dx: 85, delay: 28 }]
          },
          fx: 'echoCall'
        },
        {
          name: '阿尔卑斯山交响曲', sub: '暴风骤雨', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '阿尔卑斯的风暴席卷全场：超大领域雷雨交加，两道虚影在雨中追击。',
          field: { kind: 'damage', dur: 6, radius: 275, dps: 12, tickEvery: 24, slow: 0.45, follow: false },
          echo: { count: 2, damage: 14, knock: 5, stun: 20, swing: 'kick', spots: [{ dx: -90, delay: 14 }, { dx: 90, delay: 28 }] },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 21. 德彪西 ----------------
    {
      id: 'debussy', name: '德彪西', en: 'DEBUSSY', title: '克洛德·德彪西',
      quote: '音乐是色彩与节奏的艺术。',
      stats: { hp: 195, power: 18, speed: 18 },
      desc: '印象派画家：牧神的虚影如梦似幻，海浪领域缓慢而持续地侵蚀对手。',
      sprite: {
        hair: 'wavy', hairColor: '#4a3f38', hairDark: '#2a231e',
        coat: ['#2f4a6b', '#1a2c42', '#557ba6'], coatStyle: 'tailed',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2e3440', '#1a1e26'],
        skin: SKIN.fair, accent: '#9fd6d0', item: 'baton',
        height: 0.98, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '牧神午后前奏曲', sub: '牧神之梦', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '牧神的笛声化作三道幻影，在半梦半醒间从各处飘出击中对手。',
          echo: {
            count: 3, damage: 12, knock: 2.2, stun: 20, swing: 'cast',
            spots: [{ dx: -75, delay: 12 }, { dx: 75, delay: 22 }, { dx: 0, delay: 32 }],
            status: { kind: 'slow', dur: 2.5, power: 0.5 }
          },
          fx: 'zzz'
        },
        {
          name: '大海', sub: '浪之嬉戏', key: 'W', cd: 5, range: 320, type: 'field',
          desc: '在对手脚下掀起 8 秒的海浪领域：浪涛反复冲刷，持续受伤并被拖慢。',
          field: { kind: 'damage', dur: 8, radius: 205, dps: 6, tickEvery: 30, slow: 0.5, follow: false },
          fx: 'waves'
        },
        {
          name: '意象集', sub: '意象之海', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整片意象之海倾泻而下：巨型海域吞没全场，三道幻影随浪而至。',
          field: { kind: 'damage', dur: 7, radius: 258, dps: 9, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 12, knock: 4.5, stun: 20, swing: 'cast', spots: [{ dx: -95, delay: 12 }, { dx: 95, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 22. 拉威尔 ----------------
    {
      id: 'ravel', name: '拉威尔', en: 'RAVEL', title: '莫里斯·拉威尔',
      quote: '我不是在作曲，我是在配器。',
      stats: { hp: 200, power: 20, speed: 17 },
      desc: '配器大师：波莱罗领域会越奏越响，拖得越久伤害越可怕。',
      sprite: {
        hair: 'crop', hairColor: '#3f3a34', hairDark: '#231f1b',
        coat: ['#3f3f4a', '#242430', '#6b6b7a'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2e2e36', '#1a1a20'],
        skin: SKIN.pale, accent: '#d4af37', item: 'baton',
        height: 0.96, bulk: 0.94, stoop: 0
      },
      skills: [
        {
          name: '波莱罗舞曲', sub: '渐强轮回', key: 'Q', cd: 5, range: 170, type: 'field',
          desc: '波莱罗的主题不断重复并渐强：持续 12 秒，领域伤害随时间越来越高。',
          field: { kind: 'ramp', dur: 12, radius: 178, dps: 2, ramp: 0.15, tickEvery: 30, slow: 0.6, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '鹅妈妈组曲', sub: '童话回声', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '童话里的两位主角化作虚影现身，各自给对手一记奇妙的打击。',
          echo: {
            count: 2, damage: 15, knock: 3, stun: 18, swing: 'punch',
            spots: [{ dx: -80, delay: 14 }, { dx: 80, delay: 26 }]
          },
          fx: 'confetti'
        },
        {
          name: '波莱罗舞曲·终局', sub: '全军齐奏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全乐队齐奏的终局：领域渐强速度翻倍，并以一次全体爆发收尾。',
          field: { kind: 'ramp', dur: 8, radius: 245, dps: 3, ramp: 0.3, tickEvery: 24, slow: 0.5, follow: false },
          hit: { damage: 24, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 32 },
          fx: 'confetti'
        }
      ]
    },

    // ---------------- 23. 普罗科菲耶夫 ----------------
    {
      id: 'prokofiev', name: '普罗科菲耶夫', en: 'PROKOFIEV', title: '谢尔盖·普罗科菲耶夫',
      quote: '音乐必须简洁，再简洁。',
      stats: { hp: 205, power: 22, speed: 17 },
      desc: '钢铁般的节奏：彼得与狼的群兽虚影轮番扑击，骑士之舞踏碎地面。',
      sprite: {
        hair: 'crop', hairColor: '#8a7a5a', hairDark: '#544a34',
        coat: ['#6b5a3a', '#40351f', '#9c8a5f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.fair, accent: '#d8b060', item: 'baton',
        height: 1.0, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '彼得与狼', sub: '群兽追逐', key: 'Q', cd: 5, range: 300, type: 'echo',
          desc: '小鸟、鸭子与猫接连登场：三道动物虚影从不同方向扑向对手。',
          echo: {
            count: 3, damage: 14, knock: 3.2, stun: 16, swing: 'kick',
            spots: [{ dx: -85, delay: 10 }, { dx: 85, delay: 20 }, { dx: 0, delay: 30 }]
          },
          fx: 'trail'
        },
        {
          name: '罗密欧与朱丽叶', sub: '骑士之舞', key: 'W', cd: 5, range: 320, type: 'field',
          desc: '骑士之舞沉重地踏在对手脚下 6 秒，每一步都震得人站不稳。',
          field: { kind: 'damage', dur: 6, radius: 188, dps: 9, tickEvery: 30, slow: 0.6, follow: false },
          fx: 'impact'
        },
        {
          name: '亚历山大·涅夫斯基', sub: '冰上之战', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '冰湖之战的号角吹响：冻原领域覆盖全场，三道骑士虚影随后冲阵。',
          field: { kind: 'damage', dur: 8, radius: 252, dps: 9, tickEvery: 24, slow: 0.35, follow: false },
          echo: { count: 3, damage: 13, knock: 5, stun: 20, swing: 'kick', spots: [{ dx: -95, delay: 12 }, { dx: 95, delay: 22 }, { dx: 0, delay: 32 }] },
          fx: 'frost'
        }
      ]
    },

    // ---------------- 24. 巴托克 ----------------
    {
      id: 'bartok', name: '巴托克', en: 'BARTOK', title: '贝拉·巴托克',
      quote: '民间音乐是我的母语。',
      stats: { hp: 210, power: 21, speed: 16 },
      desc: '民间音乐的采集者：弦乐震音领域持续割伤，血之城堡能把伤害化为自身生命。',
      sprite: {
        hair: 'receding', hairColor: '#cfc8b6', hairDark: '#8b8471',
        coat: ['#4a3a4a', '#2a1f2a', '#7a607a'], coatStyle: 'tailed',
        shirt: ['#efe9db', '#b0a894'], pants: ['#2f2a30', '#1b181c'],
        skin: SKIN.fair, accent: '#c8a2c8', item: 'baton',
        height: 0.99, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '乐队协奏曲', sub: '弦乐震音', key: 'Q', cd: 5, range: 320, type: 'field',
          desc: '弦乐以极快的震音锯过战场 7 秒：领域内的对手持续被割伤。',
          field: { kind: 'damage', dur: 7, radius: 186, dps: 7, tickEvery: 24, slow: 0.55, follow: false },
          fx: 'chromatic'
        },
        {
          name: '罗马尼亚民间舞曲', sub: '民间轮舞', key: 'W', cd: 5, range: 300, type: 'echo',
          desc: '六首民间舞曲接连响起：三道舞者虚影以不规则的节拍轮番踢击。',
          echo: {
            count: 3, damage: 12, knock: 3, stun: 16, swing: 'kick',
            spots: [{ dx: -75, delay: 9 }, { dx: 75, delay: 18 }, { dx: 0, delay: 27 }]
          },
          fx: 'notes'
        },
        {
          name: '蓝胡子的城堡', sub: '血之城堡', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '城堡的第七扇门开启：暗色领域持续吸取对手生命，全部转化为自己的血量。',
          field: { kind: 'drain', dur: 9, radius: 240, dps: 9, tickEvery: 24, slow: 0.5, drain: 0.6, follow: false },
          hit: { damage: 20, w: 320, h: 200, yOff: -86, knock: 7, stun: 30 },
          fx: 'ghost'
        }
      ]
    },

    // ---------------- 25. 沃恩·威廉斯 ----------------
    {
      id: 'vaughan', name: '沃恩·威廉斯', en: 'V.WILLIAMS', title: '拉尔夫·沃恩·威廉斯',
      quote: '我写的，是英国的音乐。',
      stats: { hp: 210, power: 17, speed: 16 },
      desc: '英伦田园诗人：绿袖子领域温和而持久地维持自己，云雀的虚影高飞奇袭。',
      sprite: {
        hair: 'short', hairColor: '#bdb49c', hairDark: '#7d7660', mustache: true,
        coat: ['#3a4a3a', '#20281f', '#5f7a5f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2e3440', '#1a1e26'],
        skin: SKIN.fair, accent: '#a8c8a0', item: 'baton',
        height: 1.0, bulk: 1.04, stoop: 1
      },
      skills: [
        {
          name: '云雀高飞', sub: '云雀之回声', key: 'Q', cd: 5, range: 320, type: 'echo',
          desc: '云雀的鸣叫在空中回荡：两道虚影从高处俯冲，一左一右命中对手。',
          echo: {
            count: 2, damage: 14, knock: 3.4, stun: 18, swing: 'punch',
            spots: [{ dx: -80, delay: 16 }, { dx: 80, delay: 30 }]
          },
          fx: 'notes'
        },
        {
          name: '绿袖子幻想曲', sub: '绿袖子领域', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '古老的旋律铺满地面 9 秒：自己在其间缓缓回血，对手则被绊住脚步。',
          field: { kind: 'heal', dur: 9, radius: 182, dps: 3, heal: 5, tickEvery: 30, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '塔利斯主题幻想曲', sub: '弦乐圣咏', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '弦乐圣咏层层叠加：巨型领域笼罩全场，三声部虚影在圣咏中依次落下。',
          field: { kind: 'heal', dur: 8, radius: 248, dps: 8, heal: 4, tickEvery: 24, slow: 0.5, follow: false },
          echo: { count: 3, damage: 11, knock: 4, stun: 18, swing: 'cast', spots: [{ dx: -85, delay: 12 }, { dx: 85, delay: 22 }, { dx: 0, delay: 32 }] },
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
      stats: { hp: 205, power: 20, speed: 16 },
      desc: '芭蕾大师：以四小天鹅的连环乐章压迫对手，末段以 1812 的炮声收束。',
      sprite: {
        hair: 'wavy', hairColor: '#cfc7b0', hairDark: '#8b8471',
        coat: ['#2f3a4a', '#1a2130', '#556a86'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2b2b34', '#181820'],
        skin: SKIN.fair, accent: '#c9a227', item: 'baton',
        height: 1.0, bulk: 1.06, stoop: 0
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
      stats: { hp: 200, power: 18, speed: 19 },
      desc: '优雅而迅捷：婚礼进行曲与仲夏夜之梦的乐章连绵不断，终曲直入芬格尔山洞。',
      sprite: {
        hair: 'curly', hairColor: '#5a4638', hairDark: '#332619',
        coat: ['#3a4a5e', '#20293a', '#647c9c'], coatStyle: 'tailed',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2e2e38', '#1a1a20'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 0.98, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '仲夏夜之梦', sub: '婚礼进行曲', key: 'Q', cd: 5, range: 190, type: 'movement',
          desc: '庄严的进行曲踏拍而来：三段行进击打自动展开，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 10, w: 128, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 16, damage: 11, w: 140, knock: 3.0, stun: 14, anim: 'kick', fx: 'notes' },
              { delay: 32, damage: 15, w: 162, knock: 4.6, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '无词歌', sub: '春之歌', key: 'W', cd: 5, range: 320, type: 'movement',
          desc: '春之歌在战场上回响两段，并为自己回复生命。',
          self: { heal: 22 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 150, knock: 1.5, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 20, damage: 12, w: 176, knock: 2.6, stun: 15, anim: 'cast', fx: 'zzz' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '芬格尔山洞序曲', sub: '赫布里底', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '海浪的动机层层堆叠成五段乐章，最终以整片海潮把对手卷走。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 210, knock: 1.5, stun: 10, anim: 'cast', fx: 'waves' },
              { delay: 14, damage: 9, w: 240, knock: 2, stun: 11, anim: 'cast', fx: 'waves' },
              { delay: 28, damage: 10, w: 270, knock: 2.5, stun: 13, anim: 'cast', fx: 'waves' },
              { delay: 44, damage: 12, w: 300, knock: 3.5, stun: 15, anim: 'kickSkill', fx: 'waves' },
              { delay: 62, damage: 19, w: 350, knock: 8.5, stun: 33, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 190, power: 19, speed: 18 },
      desc: '钢琴诗人：革命练习曲的激流与夜曲的静谧交替奏出，终以英雄波兰舞曲收场。',
      sprite: {
        hair: 'feather', hairColor: '#8a6f55', hairDark: '#54402f',
        coat: ['#3a2f45', '#20182a', '#66557f'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2b2833', '#18161e'],
        skin: SKIN.pale, accent: '#c8a2c8', item: 'baton',
        height: 0.97, bulk: 0.95, stoop: 0
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
      stats: { hp: 205, power: 18, speed: 17 },
      desc: '歌曲之王：魔王的疾驰节奏与菩提树的温柔旋律接连奏出。',
      sprite: {
        hair: 'bowl', hairColor: '#6b5544', hairDark: '#3f3125',
        coat: ['#4a4030', '#2a2418', '#7d6c4c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.fair, accent: '#d8b060', item: 'baton',
        height: 0.99, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '魔王', sub: 'Erlkönig', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '马蹄般的三连音疾驰而来：四段冲锋式乐章自动连奏。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 130, knock: 2.4, stun: 12, anim: 'kick', fx: 'trail' },
              { delay: 13, damage: 10, w: 140, knock: 2.8, stun: 13, anim: 'punch', fx: 'trail' },
              { delay: 26, damage: 11, w: 150, knock: 3.2, stun: 14, anim: 'kick', fx: 'chromatic' },
              { delay: 40, damage: 16, w: 172, knock: 5.2, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '菩提树', sub: '冬之旅', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '菩提树下的回忆抚慰自身并击退靠近的对手。',
          self: { heal: 18 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 152, knock: 2.0, stun: 13, anim: 'cast', fx: 'notes' },
              { delay: 22, damage: 12, w: 178, knock: 3.4, stun: 16, anim: 'cast', fx: 'zzz' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '未完成交响曲', sub: '未完成', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '只写了两个乐章的杰作在此补完：五段乐章倾泻而出。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'notes' },
              { delay: 15, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 30, damage: 12, w: 265, knock: 3, stun: 14, anim: 'kick', fx: 'waves' },
              { delay: 46, damage: 13, w: 300, knock: 4, stun: 16, anim: 'kickSkill', fx: 'waves' },
              { delay: 64, damage: 20, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 200, power: 19, speed: 18 },
      desc: '爵士交响：蓝色狂想曲的滑音与夏日时光的慵懒交织成连绵乐章。',
      sprite: {
        hair: 'curly', hairColor: '#3f3a34', hairDark: '#231f1b', mustache: true,
        coat: ['#2f4a6b', '#1a2c42', '#557ba6'], coatStyle: 'tailed',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2b34', '#181820'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 1.0, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '蓝色狂想曲', sub: 'Rhapsody in Blue', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '单簧管的滑音一路爬升：四段爵士乐句自动连奏。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 126, knock: 2.0, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 13, damage: 10, w: 136, knock: 2.4, stun: 12, anim: 'punch', fx: 'notes' },
              { delay: 26, damage: 11, w: 146, knock: 2.8, stun: 13, anim: 'cast', fx: 'confetti' },
              { delay: 40, damage: 16, w: 170, knock: 5.0, stun: 19, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '一个美国人在巴黎', sub: '巴黎漫步', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '在巴黎街头边走边奏：三段轻快的乐章，期间可自由移动。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 130, knock: 1.8, stun: 10, anim: 'punch', fx: 'trail' },
              { delay: 16, damage: 9, w: 142, knock: 2.2, stun: 12, anim: 'punch', fx: 'trail' },
              { delay: 32, damage: 11, w: 160, knock: 2.8, stun: 14, anim: 'kick', fx: 'confetti' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '波吉与贝丝', sub: '夏日时光', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '夏日时光降临：五段乐章舒缓却沉重，并为自身回复生命。',
          self: { heal: 26 },
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'zzz' },
              { delay: 15, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 30, damage: 11, w: 265, knock: 3, stun: 14, anim: 'punch', fx: 'confetti' },
              { delay: 46, damage: 13, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'confetti' },
              { delay: 64, damage: 19, w: 350, knock: 8.5, stun: 33, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 200, power: 18, speed: 17 },
      desc: '北国之声：山魔王的殿堂中步步逼近，越到后段杀伤越重。',
      sprite: {
        hair: 'wild', hairColor: '#bdb49c', hairDark: '#7d7660',
        coat: ['#2f4a3a', '#1a2c22', '#557a5f'], coatStyle: 'tailed',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2e3440', '#1a1e26'],
        skin: SKIN.fair, accent: '#a8c8a0', item: 'baton',
        height: 0.98, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '在山魔王的宫殿里', sub: '山魔王的殿堂', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '同一主题反复逼近、一次比一次响：四段乐章伤害逐段攀升。',
          movement: {
            stanzas: [
              { delay: 0, damage: 7, w: 124, knock: 1.5, stun: 10, anim: 'punch', fx: 'impact' },
              { delay: 15, damage: 9, w: 134, knock: 2.0, stun: 11, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 12, w: 146, knock: 2.6, stun: 13, anim: 'kick', fx: 'impact' },
              { delay: 46, damage: 17, w: 176, knock: 5.4, stun: 20, anim: 'kickSkill', fx: 'ragnarok' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '培尔·金特', sub: '晨景', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '晨光洒落：两段温柔的乐章并为自己回复生命。',
          self: { heal: 20 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 154, knock: 1.8, stun: 12, anim: 'cast', fx: 'notes' },
              { delay: 22, damage: 12, w: 180, knock: 3.0, stun: 15, anim: 'cast', fx: 'chorus' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: 'a小调钢琴协奏曲', sub: '钢琴协奏曲', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '钢琴下行的洪流与乐队齐奏交错：五段乐章一气呵成。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'chromatic' },
              { delay: 15, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 11, w: 265, knock: 3, stun: 14, anim: 'cast', fx: 'waves' },
              { delay: 46, damage: 13, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'ragnarok' },
              { delay: 64, damage: 20, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 210, power: 22, speed: 16 },
      desc: '原始主义的重音机器：不规则的重拍连续砸下，节奏越乱伤害越重。',
      sprite: {
        hair: 'bald', hairColor: '#b0a898', hairDark: '#726a5c', mustache: true,
        coat: ['#3f3a30', '#241f18', '#6e6650'], coatStyle: 'tailed',
        shirt: ['#efe9db', '#b0a894'], pants: ['#2f2a24', '#1b1815'],
        skin: SKIN.fair, accent: '#c86a3a', item: 'baton',
        height: 1.0, bulk: 1.08, stoop: 0
      },
      skills: [
        {
          name: '春之祭', sub: '献祭之舞', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '不规则的重音接连砸下：四段乐章，间隔忽长忽短，极难预判。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 128, knock: 2.2, stun: 13, anim: 'punch', fx: 'impact' },
              { delay: 9, damage: 13, w: 136, knock: 2.4, stun: 13, anim: 'punch', fx: 'impact' },
              { delay: 30, damage: 14, w: 148, knock: 3.0, stun: 15, anim: 'kick', fx: 'ragnarok' },
              { delay: 36, damage: 18, w: 178, knock: 5.6, stun: 20, anim: 'kickSkill', fx: 'ragnarok' }
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
              { delay: 0, damage: 9, w: 150, knock: 2.0, stun: 12, anim: 'cast', fx: 'flame' },
              { delay: 14, damage: 11, w: 168, knock: 2.6, stun: 14, anim: 'kick', fx: 'flame' },
              { delay: 28, damage: 14, w: 190, knock: 3.6, stun: 16, anim: 'kickSkill', fx: 'flame' }
            ]
          },
          fx: 'flame'
        },
        {
          name: '春之祭·大地的祭献', sub: '大地的祭献', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '终幕的献祭之舞：六段重音狂潮以极端的不规则节奏碾过全场。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 210, knock: 1.5, stun: 10, anim: 'punch', fx: 'impact' },
              { delay: 10, damage: 10, w: 240, knock: 2, stun: 11, anim: 'punch', fx: 'impact' },
              { delay: 26, damage: 11, w: 265, knock: 2.6, stun: 13, anim: 'kick', fx: 'ragnarok' },
              { delay: 36, damage: 12, w: 295, knock: 3.2, stun: 15, anim: 'kick', fx: 'ragnarok' },
              { delay: 54, damage: 14, w: 320, knock: 4.5, stun: 18, anim: 'kickSkill', fx: 'flame' },
              { delay: 72, damage: 22, w: 370, knock: 9.5, stun: 36, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 195, power: 19, speed: 17 },
      desc: '东方意境与现代技法的融合：蝶恋花的乐句轻柔却绵密不绝。',
      sprite: {
        hair: 'bowl', hairColor: '#2f2a26', hairDark: '#1a1714',
        coat: ['#5a3a2a', '#331f16', '#8c6248'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#33302c', '#1e1c19'],
        skin: SKIN.tan, accent: '#c86a3a', item: 'baton',
        height: 0.98, bulk: 1.0, stoop: 0
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
      stats: { hp: 200, power: 20, speed: 16 },
      desc: '变奏大师：同一主题被拆成不同“乐器”，一段段递进碾过对手。',
      sprite: {
        hair: 'mop', hairColor: '#b8b0a0', hairDark: '#7a7264',
        coat: ['#2f3a4a', '#1a2130', '#5a6e88'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2b34', '#181820'],
        skin: SKIN.fair, accent: '#9fd6d0', item: 'baton',
        height: 1.0, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '青少年管弦乐队指南', sub: '普赛尔主题变奏', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '主题之后是铜管、木管、弦乐与打击乐的变奏：四段乐章各具音色。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 15, damage: 10, w: 138, knock: 2.2, stun: 12, anim: 'punch', fx: 'chromatic' },
              { delay: 30, damage: 11, w: 150, knock: 2.6, stun: 13, anim: 'kick', fx: 'waves' },
              { delay: 46, damage: 16, w: 176, knock: 5.0, stun: 19, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '战争安魂曲', sub: '战争安魂曲', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '安魂的钟声三次落下，末段沉重而决绝。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 150, knock: 1.8, stun: 12, anim: 'cast', fx: 'impact' },
              { delay: 20, damage: 10, w: 168, knock: 2.4, stun: 14, anim: 'cast', fx: 'waves' },
              { delay: 40, damage: 15, w: 192, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'chorus' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '彼得·格兰姆斯', sub: '四海之间', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '四首海之间奏曲联结成五段乐章，末段以海浪吞没对手。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'waves' },
              { delay: 15, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'punch', fx: 'waves' },
              { delay: 30, damage: 11, w: 265, knock: 3, stun: 14, anim: 'kick', fx: 'frost' },
              { delay: 46, damage: 13, w: 300, knock: 4, stun: 16, anim: 'cast', fx: 'waves' },
              { delay: 64, damage: 20, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 190, power: 20, speed: 18 },
      desc: '音色与留白的大师：尺八与琵琶的音色交错，乐句之间留有呼吸。',
      sprite: {
        hair: 'bowl', hairColor: '#2f2a26', hairDark: '#1a1714', glasses: true,
        coat: ['#3a4a4a', '#1f2a2a', '#5f7a7a'], coatStyle: 'tailed',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2b3033', '#181c1e'],
        skin: SKIN.tan, accent: '#9fd6d0', item: 'baton',
        height: 0.98, bulk: 0.98, stoop: 0
      },
      skills: [
        {
          name: '十一月的阶梯', sub: 'November Steps', key: 'Q', cd: 5, range: 200, type: 'movement',
          desc: '尺八与琵琶交替发问：三段乐句之间留有大片沉默，落点难以预判。',
          movement: {
            stanzas: [
              { delay: 0, damage: 12, w: 132, knock: 2.0, stun: 14, anim: 'cast', fx: 'chromatic' },
              { delay: 26, damage: 13, w: 148, knock: 2.6, stun: 15, anim: 'cast', fx: 'ghost' },
              { delay: 52, damage: 17, w: 176, knock: 5.0, stun: 20, anim: 'kickSkill', fx: 'waves' }
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
              { delay: 0, damage: 9, w: 158, knock: 1.6, stun: 13, anim: 'cast', fx: 'zzz' },
              { delay: 28, damage: 13, w: 182, knock: 2.8, stun: 16, anim: 'cast', fx: 'notes' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '雨树', sub: '雨树', key: 'E', cd: 15, range: 380, type: 'ultimate',
          desc: '雨滴落在树上的万千声响化为五段乐章，末段以整片音色的洪流收束。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 205, knock: 1.6, stun: 10, anim: 'cast', fx: 'shard' },
              { delay: 16, damage: 10, w: 235, knock: 2.2, stun: 12, anim: 'cast', fx: 'frost' },
              { delay: 32, damage: 11, w: 265, knock: 3, stun: 14, anim: 'punch', fx: 'ghost' },
              { delay: 48, damage: 13, w: 300, knock: 4, stun: 16, anim: 'kick', fx: 'waves' },
              { delay: 66, damage: 20, w: 350, knock: 9, stun: 34, anim: 'kickSkill', fx: 'chorus' }
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
      stats: { hp: 200, power: 18, speed: 17 },
      desc: '英伦巴洛克之魂：狄多的哀歌去而复返，回程把对手拖回自己面前。',
      sprite: {
        hair: 'wig', hairColor: '#e6e0cc', hairDark: '#a49e8a',
        coat: ['#4a3a5e', '#2a2038', '#7a659c'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2e2b34', '#1a181e'],
        skin: SKIN.pale, accent: '#c8a2c8', item: 'baton',
        height: 0.99, bulk: 1.0, stoop: 0
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
      stats: { hp: 210, power: 21, speed: 15 },
      desc: '固定乐思的执念：同一条旋律一次次回来，每次都更强烈。',
      sprite: {
        hair: 'wild', hairColor: '#8a6f55', hairDark: '#54402f', beard: true,
        coat: ['#3a2f3a', '#20181f', '#66506a'], coatStyle: 'frock',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2b2830', '#181620'],
        skin: SKIN.fair, accent: '#c86a3a', item: 'baton',
        height: 1.02, bulk: 1.1, stoop: 1
      },
      skills: [
        {
          name: '幻想交响曲', sub: '固定乐思', key: 'Q', cd: 5, range: 320, type: 'rondo',
          desc: '那条挥之不去的旋律飞出去又回来，回程带着更重的执念。',
          rondo: { kind: 'idee', count: 1, speed: 6.2, range: 320, w: 32, h: 32, damage: 12, backDamage: 20, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '罗马狂欢节', sub: '狂欢节序曲', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '盐舞的节拍弹跳而来：三段乐章快速连奏，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 128, knock: 2.0, stun: 11, anim: 'punch', fx: 'confetti' },
              { delay: 12, damage: 10, w: 138, knock: 2.4, stun: 12, anim: 'kick', fx: 'confetti' },
              { delay: 24, damage: 13, w: 156, knock: 3.4, stun: 15, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '安魂曲', sub: '末日审判', key: 'E', cd: 15, range: 440, type: 'ultimate',
          desc: '末日号角化作三道回旋的巨浪，去程与回程各判一次，最后以审判重击收尾。',
          rondo: { kind: 'idee', count: 3, speed: 7.0, range: 400, w: 34, h: 34, damage: 13, backDamage: 18, yOff: -84, spreadY: 40, pull: true },
          hit: { damage: 20, w: 320, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 38. 蒙特威尔第 ----------------
    {
      id: 'monteverdi', name: '蒙特威尔第', en: 'MONTEVERDI', title: '克劳迪奥·蒙特威尔第',
      quote: '歌词应当是音乐的主人。',
      stats: { hp: 205, power: 19, speed: 16 },
      desc: '歌剧之父：奥菲欧的咏叹去而复返，晚祷为自身铺开庇护。',
      sprite: {
        hair: 'bald', hairColor: '#b8b0a0', hairDark: '#7a7264', beard: true,
        coat: ['#5a2f3f', '#331a24', '#8c5568'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f2a2c', '#1b181a'],
        skin: SKIN.fair, accent: '#c9a227', item: 'baton',
        height: 1.0, bulk: 1.06, stoop: 1
      },
      skills: [
        {
          name: '奥菲欧', sub: '奥菲欧的咏叹', key: 'Q', cd: 5, range: 310, type: 'rondo',
          desc: '向冥界唱出的咏叹飞出又折返，回程把对手拖向自己。',
          rondo: { kind: 'aria', count: 1, speed: 6.4, range: 310, w: 30, h: 30, damage: 12, backDamage: 19, yOff: -80, pull: true },
          fx: 'rondoCall'
        },
        {
          name: '圣母晚祷', sub: '晚祷', key: 'W', cd: 5, range: 160, type: 'field',
          desc: '晚祷的圣咏在地面铺开 8 秒：自己持续回血并减伤，靠近的对手被拖慢。',
          field: { kind: 'armor', dur: 8, radius: 176, dps: 4, heal: 4, tickEvery: 30, armor: 0.3, slow: 0.55, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '波佩阿的加冕', sub: '加冕', key: 'E', cd: 15, range: 420, type: 'ultimate',
          desc: '加冕的号角三度回旋，每次回程都更重，最后以合唱收束。',
          rondo: { kind: 'aria', count: 2, speed: 6.8, range: 380, w: 32, h: 32, damage: 13, backDamage: 19, yOff: -84, spreadY: 40, pull: true },
          hit: { damage: 19, w: 300, h: 195, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 39. 约翰·道兰德 ----------------
    {
      id: 'dowland', name: '约翰·道兰德', en: 'DOWLAND', title: '约翰·道兰德',
      quote: 'music is the food of love... 让音乐喂饱爱情。',
      stats: { hp: 195, power: 17, speed: 18 },
      desc: '鲁特琴的歌者：泪珠般的音符去而复返，把对手拖进昏沉的睡眠。',
      sprite: {
        hair: 'feather', hairColor: '#6b5544', hairDark: '#3f3125', mustache: true,
        coat: ['#3f3a5e', '#241f38', '#6a659c'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2e2b34', '#1a181e'],
        skin: SKIN.pale, accent: '#a8d8ff', item: 'baton',
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
      stats: { hp: 200, power: 18, speed: 17 },
      desc: '拉格泰姆之王：切分的乐句弹出去又跳回来，节奏永远让人站不稳。',
      sprite: {
        hair: 'curly', hairColor: '#2f2a26', hairDark: '#1a1714', mustache: true,
        coat: ['#4a3a2a', '#2a1f16', '#7d6548'], coatStyle: 'tailed',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2b30', '#18181c'],
        skin: SKIN.deep, accent: '#e0c060', item: 'baton',
        height: 0.98, bulk: 1.0, stoop: 0
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
      stats: { hp: 205, power: 20, speed: 16 },
      desc: '爵士与古典的混血：练习曲的乐句弹出去又旋回来，一路摇摆。',
      sprite: {
        hair: 'crop', hairColor: '#8a7a5a', hairDark: '#544a34',
        coat: ['#3a3a4a', '#212128', '#63637a'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f2f38', '#1b1b20'],
        skin: SKIN.fair, accent: '#c8a2c8', item: 'baton',
        height: 1.0, bulk: 1.04, stoop: 0
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
      stats: { hp: 200, power: 18, speed: 17 },
      desc: '和声理论之父：写下和声法则后，你的每一击都会被一个声部模仿重奏。',
      sprite: {
        hair: 'queue', hairColor: '#e6e0cc', hairDark: '#a49e8a',
        coat: ['#5a3a2a', '#331f16', '#8c6248'], coatStyle: 'frock',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2f2a2c', '#1b181a'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 1.0, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '和声论', sub: '和声的法则', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '写下 6 秒的和声法则：期间你的每次命中都会被一个模仿声部延迟重奏一次。',
          canon: { dur: 6, delay: 24, ratio: 0.55 },
          fx: 'canonMark'
        },
        {
          name: '鸟之呼唤', sub: '鸟鸣', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '三段模仿鸟鸣的乐句依次射出，击中后拖慢对手。',
          proj: { kind: 'flute', count: 3, speed: 6.8, w: 24, h: 24, damage: 9, yOff: -84, spacing: 18 },
          status: { kind: 'slow', dur: 3, power: 0.5 },
          fx: 'notes'
        },
        {
          name: '希波吕托斯与阿里奇埃', sub: '歌剧终场', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整部歌剧的对位在此展开：8 秒内模仿声部威力大增，并立刻震开全场。',
          canon: { dur: 8, delay: 20, ratio: 0.8 },
          hit: { damage: 20, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 43. 宾根（女，修女形象）----------------
    {
      id: 'hildegard', name: '宾根', en: 'HILDEGARD', title: '希尔德加德·冯·宾根',
      quote: '我看见了光，便唱了出来。',
      stats: { hp: 195, power: 17, speed: 17 },
      desc: '中世纪的先知与女修道院长：圣咏在天地间回荡，美德颂让自己的每一击都被重唱。',
      sprite: {
        hair: 'veil', hairColor: '#3f4a6b', hairDark: '#26304a',
        coat: ['#2f3a5e', '#1a2138', '#54689c'], coatStyle: 'habit',
        shirt: ['#f7f3e6', '#cdc7b4'], pants: ['#2e3440', '#1a1e26'],
        skin: SKIN.pale, accent: '#d8b060', item: 'baton',
        height: 0.93, bulk: 0.88, stoop: 0
      },
      skills: [
        {
          name: '美德颂', sub: 'Ordo Virtutum', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '美德之歌唱响 6 秒：期间自己的每次命中都会被圣咏重唱一次。',
          canon: { dur: 6, delay: 26, ratio: 0.5 },
          fx: 'canonMark'
        },
        {
          name: '幻象之光', sub: '羽毛与光', key: 'W', cd: 5, range: 150, type: 'field',
          desc: '幻象之光笼罩自身 8 秒：持续回血并获得护体减伤。',
          field: { kind: 'armor', dur: 8, radius: 170, dps: 3, heal: 5, tickEvery: 30, armor: 0.3, slow: 0.6, follow: true },
          fx: 'fieldRise'
        },
        {
          name: '赞美诗', sub: '圣咏合唱', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '整座修道院一同歌唱：8 秒内每次命中都被放大重唱，并立刻降下光柱。',
          canon: { dur: 8, delay: 18, ratio: 0.75 },
          hit: { damage: 18, w: 320, h: 200, yOff: -86, knock: 7, stun: 30 },
          self: { heal: 22 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 44. 马肖 ----------------
    {
      id: 'machaut', name: '马肖', en: 'MACHAUT', title: '纪尧姆·德·马肖',
      quote: '等节奏，是我给时间定的形状。',
      stats: { hp: 195, power: 18, speed: 17 },
      desc: '等节奏的发明者：同一节奏型被严格重复，每一次命中都会被精确模仿。',
      sprite: {
        hair: 'receding', hairColor: '#8a7a5a', hairDark: '#544a34',
        coat: ['#4a3a4a', '#2a1f2a', '#7a607a'], coatStyle: 'frock',
        shirt: ['#efe9db', '#b0a894'], pants: ['#2f2a30', '#1b181c'],
        skin: SKIN.fair, accent: '#c8a2c8', item: 'baton',
        height: 0.98, bulk: 1.0, stoop: 0
      },
      skills: [
        {
          name: '等节奏经文歌', sub: 'isorhythm', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '定下 6 秒的等节奏型：期间你的每次命中都会被严格重复一次。',
          canon: { dur: 6, delay: 22, ratio: 0.55 },
          fx: 'canonMark'
        },
        {
          name: '圣母弥撒', sub: '弥撒', key: 'W', cd: 5, range: 170, type: 'multiHit',
          desc: '弥撒的固定段落接连奏出，四连击把对手钉在原地。',
          hit: { damage: 7, hits: 4, interval: 8, w: 118, h: 88, yOff: -78, knock: 1.2, stun: 14 },
          fx: 'notes'
        },
        {
          name: '真爱之泉', sub: '叙事歌', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '真爱之泉喷涌：8 秒内每次命中都被重唱，并以一次重击引爆。',
          canon: { dur: 8, delay: 18, ratio: 0.75 },
          hit: { damage: 19, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'waves'
        }
      ]
    },

    // ---------------- 45. 帕格尼尼 ----------------
    {
      id: 'paganini', name: '帕格尼尼', en: 'PAGANINI', title: '尼科罗·帕格尼尼',
      quote: '魔鬼教会了我拉琴。',
      stats: { hp: 195, power: 22, speed: 19 },
      desc: '小提琴的魔鬼：随想曲的主题被二十四次分解，每一次命中都被模仿重奏。',
      sprite: {
        hair: 'ponytail', hairColor: '#2f2a26', hairDark: '#1a1714',
        coat: ['#1f1f28', '#101018', '#3d3d4d'], coatStyle: 'tailed',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#26262e', '#141419'],
        skin: SKIN.pale, accent: '#c86a3a', item: 'baton',
        height: 0.97, bulk: 0.94, stoop: 0
      },
      skills: [
        {
          name: '二十四首随想曲', sub: '随想曲第24号', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '主题写下后是无穷的变奏：6 秒内你的每次命中都会被模仿重奏。',
          canon: { dur: 6, delay: 20, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '女巫之舞', sub: 'Le Streghe', key: 'W', cd: 5, range: 200, type: 'dashAttack',
          desc: '踩着女巫之舞的节拍高速突进，一路撞开对手。',
          dash: { distance: 200, speed: 8.6, damage: 16, w: 58, h: 92, yOff: -76, knock: 5.0, stun: 16 },
          fx: 'trail'
        },
        {
          name: '魔鬼的颤音', sub: '第一小提琴协奏曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '魔鬼的颤音响起：8 秒内每次命中都被高分贝重奏，并以一次刺击收尾。',
          canon: { dur: 8, delay: 16, ratio: 0.85 },
          hit: { damage: 21, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chromatic'
        }
      ]
    },

    // ---------------- 46. 韦伯 ----------------
    {
      id: 'weber', name: '韦伯', en: 'WEBER', title: '卡尔·马利亚·冯·韦伯',
      quote: '魔弹射向哪里，由魔鬼决定。',
      stats: { hp: 200, power: 19, speed: 17 },
      desc: '德国浪漫歌剧的开创者：魔弹射出后仍会再回来一次，第七颗由魔鬼掌控。',
      sprite: {
        hair: 'wavy', hairColor: '#6b5544', hairDark: '#3f3125',
        coat: ['#2f3a2f', '#1a211a', '#5a7a5a'], coatStyle: 'tailed',
        shirt: ['#f4f0e2', '#b9b3a0'], pants: ['#2e2b26', '#1a1815'],
        skin: SKIN.fair, accent: '#9fd6a0', item: 'baton',
        height: 1.0, bulk: 1.02, stoop: 0
      },
      skills: [
        {
          name: '魔弹射手', sub: '魔弹', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '装填 6 秒的魔弹：期间自己的每次命中都会被同一颗子弹再打一次。',
          canon: { dur: 6, delay: 24, ratio: 0.55 },
          fx: 'canonMark'
        },
        {
          name: '邀舞', sub: '华丽回旋曲', key: 'W', cd: 5, range: 200, type: 'movement',
          desc: '邀舞的乐句绅士般展开：三段乐章依次奏出，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 9, w: 128, knock: 2.0, stun: 11, anim: 'cast', fx: 'notes' },
              { delay: 16, damage: 11, w: 142, knock: 2.6, stun: 13, anim: 'punch', fx: 'notes' },
              { delay: 32, damage: 14, w: 164, knock: 3.8, stun: 16, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '奥伯龙', sub: '精灵之王', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '精灵之王的号角吹响：8 秒内每次命中都被魔法重奏，并以号角震开对手。',
          canon: { dur: 8, delay: 18, ratio: 0.75 },
          hit: { damage: 19, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 47. 帕瓦斯特里纳 ----------------
    {
      id: 'palestrina', name: '帕瓦斯特里纳', en: 'PALESTRINA', title: '乔瓦尼·皮耶路易吉·达·帕瓦斯特里纳',
      quote: '让音乐回到教堂的纯净。',
      stats: { hp: 205, power: 18, speed: 15 },
      desc: '复调合唱的典范：声部一个接一个进入，每一次命中都会被另一个声部模仿。',
      sprite: {
        hair: 'curly', hairColor: '#b8b0a0', hairDark: '#7a7264', beard: true,
        coat: ['#2f2f38', '#1a1a20', '#575760'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2b30', '#18181c'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 1.02, bulk: 1.08, stoop: 1
      },
      skills: [
        {
          name: '教皇马尔切利弥撒', sub: '弥撒', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '六个声部依次进入：6 秒内你的每次命中都会被另一个声部模仿重唱。',
          canon: { dur: 6, delay: 26, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '圣母颂', sub: 'Stabat Mater', key: 'W', cd: 5, range: 300, type: 'movement',
          desc: '圣母悼歌的两段乐句缓缓推进，并为自己回复生命。',
          self: { heal: 20 },
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 154, knock: 1.8, stun: 13, anim: 'cast', fx: 'notes' },
              { delay: 24, damage: 13, w: 180, knock: 3.0, stun: 16, anim: 'cast', fx: 'chorus' }
            ]
          },
          fx: 'fieldRise'
        },
        {
          name: '升阶经', sub: '合唱终曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '全合唱团一同进入：8 秒内每次命中都被重唱，并以一次齐唱击飞对手。',
          canon: { dur: 8, delay: 20, ratio: 0.8 },
          hit: { damage: 19, w: 320, h: 200, yOff: -86, knock: 7.5, stun: 31 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 48. 霍尔斯特 ----------------
    {
      id: 'holst', name: '霍尔斯特', en: 'HOLST', title: '古斯塔夫·霍尔斯特',
      quote: '行星的运转，就是我写下的节奏。',
      stats: { hp: 210, power: 20, speed: 15 },
      desc: '行星的作曲家：木星的欢乐被反复回响，火星的战争则一次砸下。',
      sprite: {
        hair: 'long', hairColor: '#cfc8b6', hairDark: '#8b8471', mustache: true,
        coat: ['#2f3a4a', '#1a2130', '#5a6e88'], coatStyle: 'frock',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2b2e34', '#181a1e'],
        skin: SKIN.fair, accent: '#c86a3a', item: 'baton',
        height: 1.02, bulk: 1.08, stoop: 0
      },
      skills: [
        {
          name: '行星组曲·木星', sub: '木星·欢乐使者', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '木星的欢乐主题被反复回响：6 秒内你的每次命中都会再响一次。',
          canon: { dur: 6, delay: 22, ratio: 0.55 },
          fx: 'canonMark'
        },
        {
          name: '行星组曲·火星', sub: '火星·战争使者', key: 'W', cd: 5, range: 140, type: 'meleeSwing',
          desc: '火星的五拍节奏一次砸下：沉重且把对手打飞。',
          hit: { damage: 26, w: 132, h: 104, yOff: -80, knock: 8.0, stun: 22 },
          fx: 'impact'
        },
        {
          name: '行星组曲·土星', sub: '土星·老年使者', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '土星的缓慢逼近：8 秒内每次命中都被沉重的回响重奏，并以终曲压垮对手。',
          canon: { dur: 8, delay: 20, ratio: 0.8 },
          hit: { damage: 22, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'ragnarok'
        }
      ]
    },

    // ---------------- 49. 伯恩斯坦 ----------------
    {
      id: 'bernstein', name: '伯恩斯坦', en: 'BERNSTEIN', title: '伦纳德·伯恩斯坦',
      quote: '音乐没有高雅与通俗之分。',
      stats: { hp: 200, power: 20, speed: 17 },
      desc: '舞台与音乐厅之间：西区故事的舞步被一遍遍复制，节奏越跳越烈。',
      sprite: {
        hair: 'mop', hairColor: '#8a7a5a', hairDark: '#544a34',
        coat: ['#3a3a4a', '#212128', '#63637a'], coatStyle: 'frock',
        shirt: ['#f7f3e6', '#bdb7a4'], pants: ['#2b2b34', '#181820'],
        skin: SKIN.fair, accent: '#e0c060', item: 'baton',
        height: 1.0, bulk: 1.04, stoop: 0
      },
      skills: [
        {
          name: '西区故事', sub: '美国', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '舞步被复制成两重：6 秒内你的每次命中都会被另一个自己再打一次。',
          canon: { dur: 6, delay: 20, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '坎迪德序曲', sub: '坎迪德', key: 'W', cd: 5, range: 190, type: 'movement',
          desc: '序曲的急板连绵而出：四段乐章快速连奏，期间可自由走位。',
          movement: {
            stanzas: [
              { delay: 0, damage: 8, w: 126, knock: 1.8, stun: 10, anim: 'punch', fx: 'notes' },
              { delay: 12, damage: 9, w: 136, knock: 2.2, stun: 11, anim: 'punch', fx: 'notes' },
              { delay: 24, damage: 10, w: 146, knock: 2.6, stun: 12, anim: 'kick', fx: 'confetti' },
              { delay: 36, damage: 14, w: 168, knock: 4.4, stun: 18, anim: 'kickSkill', fx: 'impact' }
            ]
          },
          fx: 'movementRise'
        },
        {
          name: '弥撒', sub: '弥撒终曲', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '剧场式的弥撒：8 秒内每次命中都被整个乐团重奏，并以齐奏收场。',
          canon: { dur: 8, delay: 16, ratio: 0.8 },
          hit: { damage: 20, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'chorus'
        }
      ]
    },

    // ---------------- 50. 布列兹 ----------------
    {
      id: 'boulez', name: '布列兹', en: 'BOULEZ', title: '皮埃尔·布列兹',
      quote: '我选择把音乐推向绝对的严谨。',
      stats: { hp: 195, power: 21, speed: 16 },
      desc: '整体序列主义的建筑师：一切都被精确复制，每一次命中都有严格的对位应答。',
      sprite: {
        hair: 'crop', hairColor: '#b8b0a0', hairDark: '#7a7264',
        coat: ['#2f2f3f', '#1a1a24', '#575770'], coatStyle: 'frock',
        shirt: ['#f0ece0', '#b2ac99'], pants: ['#2b2b33', '#18181e'],
        skin: SKIN.fair, accent: '#9fd6d0', item: 'baton',
        height: 1.02, bulk: 1.06, stoop: 0
      },
      skills: [
        {
          name: '无主之锤', sub: 'Le Marteau sans Maître', key: 'Q', cd: 5, range: 160, type: 'canon',
          desc: '为诗句写下的严格对位：6 秒内你的每次命中都会被精确应答一次。',
          canon: { dur: 6, delay: 22, ratio: 0.6 },
          fx: 'canonMark'
        },
        {
          name: '结构', sub: 'Structures', key: 'W', cd: 5, range: 300, type: 'projectile',
          desc: '两套序列同时展开，两道音波以严格的镜像关系飞出。',
          proj: { kind: 'chroma', count: 2, speed: 6.6, w: 28, h: 28, damage: 13, yOff: -82, spacing: 28, pierce: true },
          fx: 'chromatic'
        },
        {
          name: '应答曲', sub: 'Répons', key: 'E', cd: 15, range: 400, type: 'ultimate',
          desc: '独奏与六重奏在空间中互相应答：8 秒内每次命中都被高倍重奏，并以全奏收束。',
          canon: { dur: 8, delay: 16, ratio: 0.85 },
          hit: { damage: 20, w: 330, h: 200, yOff: -86, knock: 8, stun: 32 },
          fx: 'matrix'
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
    beethoven:    { shape: 'square', eyes: 'deep',   brows: 'bushy', nose: 'big',   mouth: 'tight', cheeks: 'gaunt' },
    mozart:       { shape: 'round',  eyes: 'wide',   brows: 'thin',  nose: 'small', mouth: 'smile', cheeks: 'full' },
    brahms:       { shape: 'wide',   eyes: 'sleepy', brows: 'thick', nose: 'big',   mouth: 'line',  cheeks: 'full' },
    mahler:       { shape: 'long',   eyes: 'deep',   brows: 'angry', nose: 'big',   mouth: 'frown', cheeks: 'gaunt' },
    wagner:       { shape: 'round',  eyes: 'sharp',  brows: 'angry', nose: 'hook',  mouth: 'tight', cheeks: 'full' },
    schumann:     { shape: 'round',  eyes: 'sleepy', brows: 'arch',  nose: 'small', mouth: 'smile', cheeks: 'plain' },
    rachmaninoff: { shape: 'long',   eyes: 'deep',   brows: 'thick', nose: 'big',   mouth: 'line',  cheeks: 'gaunt' },
    shostakovich: { shape: 'square', eyes: 'plain',  brows: 'thin',  nose: 'small', mouth: 'tight', cheeks: 'plain' },
    schoenberg:   { shape: 'wide',   eyes: 'sharp',  brows: 'bushy', nose: 'hook',  mouth: 'frown', cheeks: 'plain' },
    sibelius:     { shape: 'square', eyes: 'plain',  brows: 'thick', nose: 'flat',  mouth: 'line',  cheeks: 'full' },
    scriabin:     { shape: 'gaunt',  eyes: 'wide',   brows: 'arch',  nose: 'small', mouth: 'open',  cheeks: 'gaunt' },
    liszt:        { shape: 'long',   eyes: 'sharp',  brows: 'arch',  nose: 'hook',  mouth: 'smile', cheeks: 'plain' },
    bach:         { shape: 'round',  eyes: 'plain',  brows: 'thick', nose: 'big',   mouth: 'tight', cheeks: 'full' },
    handel:       { shape: 'wide',   eyes: 'wide',   brows: 'bushy', nose: 'big',   mouth: 'line',  cheeks: 'full' },
    vivaldi:      { shape: 'long',   eyes: 'sharp',  brows: 'thin',  nose: 'hook',  mouth: 'smile', cheeks: 'plain' },
    haydn:        { shape: 'square', eyes: 'sleepy', brows: 'arch',  nose: 'small', mouth: 'smile', cheeks: 'plain' },
    dvorak:       { shape: 'round',  eyes: 'plain',  brows: 'thick', nose: 'flat',  mouth: 'line',  cheeks: 'full' },
    verdi:        { shape: 'wide',   eyes: 'deep',   brows: 'bushy', nose: 'big',   mouth: 'frown', cheeks: 'full' },
    bruckner:     { shape: 'square', eyes: 'deep',   brows: 'thick', nose: 'big',   mouth: 'tight', cheeks: 'gaunt' },
    strauss:      { shape: 'round',  eyes: 'sharp',  brows: 'bushy', nose: 'big',   mouth: 'tight', cheeks: 'full' },
    debussy:      { shape: 'round',  eyes: 'sleepy', brows: 'thick', nose: 'small', mouth: 'line',  cheeks: 'full' },
    ravel:        { shape: 'gaunt',  eyes: 'sharp',  brows: 'thin',  nose: 'small', mouth: 'tight', cheeks: 'gaunt' },
    prokofiev:    { shape: 'square', eyes: 'sharp',  brows: 'angry', nose: 'flat',  mouth: 'tight', cheeks: 'plain' },
    bartok:       { shape: 'gaunt',  eyes: 'deep',   brows: 'bushy', nose: 'hook',  mouth: 'frown', cheeks: 'gaunt' },
    vaughan:      { shape: 'long',   eyes: 'sleepy', brows: 'thick', nose: 'big',   mouth: 'line',  cheeks: 'full' },
    // ---- v3.0 新增 25 位 ----
    tchaikovsky:  { shape: 'long',   eyes: 'sleepy', brows: 'arch',  nose: 'small', mouth: 'frown', cheeks: 'plain' },
    mendelssohn:  { shape: 'round',  eyes: 'round',  brows: 'thin',  nose: 'small', mouth: 'smile', cheeks: 'full' },
    chopin:       { shape: 'gaunt',  eyes: 'sleepy', brows: 'arch',  nose: 'hook',  mouth: 'tight', cheeks: 'gaunt' },
    schubert:     { shape: 'round',  eyes: 'round',  brows: 'thin',  nose: 'flat',  mouth: 'open',  cheeks: 'full' },
    gershwin:     { shape: 'square', eyes: 'wide',   brows: 'thick', nose: 'big',   mouth: 'smile', cheeks: 'plain' },
    grieg:        { shape: 'wide',   eyes: 'wide',   brows: 'bushy', nose: 'flat',  mouth: 'smile', cheeks: 'full' },
    stravinsky:   { shape: 'square', eyes: 'sharp',  brows: 'bushy', nose: 'big',   mouth: 'frown', cheeks: 'gaunt' },
    chenqigang:   { shape: 'round',  eyes: 'plain',  brows: 'thin',  nose: 'small', mouth: 'line',  cheeks: 'full' },
    britten:      { shape: 'wide',   eyes: 'plain',  brows: 'arch',  nose: 'small', mouth: 'tight', cheeks: 'plain' },
    takemitsu:    { shape: 'long',   eyes: 'plain',  brows: 'thin',  nose: 'flat',  mouth: 'tight', cheeks: 'gaunt' },
    purcell:      { shape: 'round',  eyes: 'sharp',  brows: 'arch',  nose: 'hook',  mouth: 'smile', cheeks: 'plain' },
    berlioz:      { shape: 'gaunt',  eyes: 'wide',   brows: 'bushy', nose: 'hook',  mouth: 'open',  cheeks: 'gaunt' },
    monteverdi:   { shape: 'round',  eyes: 'deep',   brows: 'bushy', nose: 'big',   mouth: 'line',  cheeks: 'full' },
    dowland:      { shape: 'long',   eyes: 'sleepy', brows: 'thin',  nose: 'small', mouth: 'smile', cheeks: 'gaunt' },
    joplin:       { shape: 'square', eyes: 'plain',  brows: 'thick', nose: 'flat',  mouth: 'smile', cheeks: 'full' },
    kapustin:     { shape: 'square', eyes: 'sharp',  brows: 'thick', nose: 'big',   mouth: 'line',  cheeks: 'plain' },
    rameau:       { shape: 'round',  eyes: 'sharp',  brows: 'angry', nose: 'big',   mouth: 'tight', cheeks: 'full' },
    hildegard:    { shape: 'round',  eyes: 'round',  brows: 'arch',  nose: 'small', mouth: 'smile', cheeks: 'full' },
    machaut:      { shape: 'gaunt',  eyes: 'plain',  brows: 'thin',  nose: 'hook',  mouth: 'line',  cheeks: 'gaunt' },
    paganini:     { shape: 'gaunt',  eyes: 'wide',   brows: 'angry', nose: 'hook',  mouth: 'open',  cheeks: 'gaunt' },
    weber:        { shape: 'square', eyes: 'sharp',  brows: 'thin',  nose: 'big',   mouth: 'tight', cheeks: 'plain' },
    palestrina:   { shape: 'wide',   eyes: 'sleepy', brows: 'bushy', nose: 'flat',  mouth: 'line',  cheeks: 'full' },
    holst:        { shape: 'long',   eyes: 'deep',   brows: 'thick', nose: 'hook',  mouth: 'frown', cheeks: 'gaunt' },
    bernstein:    { shape: 'wide',   eyes: 'wide',   brows: 'angry', nose: 'big',   mouth: 'open',  cheeks: 'full' },
    boulez:       { shape: 'square', eyes: 'sharp',  brows: 'arch',  nose: 'flat',  mouth: 'tight', cheeks: 'gaunt' }
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
    rachmaninoff: { era: '前中浪漫主义', region: '俄派' },
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
    boulez:       { era: '现代',         region: '法派' }
  };

  // 标签顺序（用于界面展示与统计）
  var ERA_TAGS = ['中世纪', '文艺复兴', '巴洛克', '古典主义', '前中浪漫主义', '晚期浪漫主义', '现代', '爵士'];
  var REGION_TAGS = ['德奥', '俄派', '北欧', '意大利', '法派', '英派', '美国', '亚洲', '波兰'];

  // 共鸣同组：波兰与法派归入同一共鸣组（肖邦可与其他法派作曲家共鸣）
  var REGION_GROUP = { '波兰': '法派' };
  function regionGroupOf(tag) { return REGION_GROUP[tag] || tag; }

  // 各标签的代表色（让色块本身携带信息）
  var ERA_COLOR = {
    '中世纪': '#8a7fd0', '文艺复兴': '#d08a5a', '巴洛克': '#c8a24a',
    '古典主义': '#4ee0b0', '前中浪漫主义': '#6fd06f', '晚期浪漫主义': '#4aa8e0',
    '现代': '#c86ad0', '爵士': '#e0a040'
  };
  var REGION_COLOR = {
    '德奥': '#ffd166', '俄派': '#e07a5f', '北欧': '#7ec8e0', '意大利': '#9fd66f',
    '法派': '#c8a2ff', '英派': '#6fd0c0', '美国': '#ff9c6f', '亚洲': '#ff6f9c',
    '波兰': '#f0f0f0'
  };

  // =========================================================
  //  红色「体系」标签（v4.0）：按技能机制划分，各带独立共鸣效果
  //  界面上只显示子标签（和声 / 领域 / 乐章 / 回旋 / 卡农）
  // =========================================================
  var SYSTEM_TAGS = ['和声', '领域', '乐章', '回旋', '卡农'];
  var SYSTEM_COLOR = '#ff5b5b';
  var SYSTEM_DESC = {
    '和声': '生命值上限 +18%',
    '领域': '移动速度 +20%',
    '乐章': '伤害有 20% 概率翻倍',
    '回旋': '免疫 8% 受到的伤害',
    '卡农': '终极技冷却 ×80%，技能 1/2 冷却 ×60%'
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
    weber: '卡农', palestrina: '卡农', holst: '卡农', bernstein: '卡农', boulez: '卡农'
  };
  // 各体系共鸣效果数值（供 game.js 读取）
  var SYSTEM_BOND = {
    hpBonus: 0.18,        // 和声：生命上限 +18%
    speedBonus: 0.20,     // 领域：移速 +20%
    doubleChance: 0.20,   // 乐章：20% 概率双倍伤害
    damageCut: 0.08,      // 回旋：免疫 8% 伤害
    ultCd: 0.80,          // 卡农：终极技冷却 ×0.8
    skillCd: 0.60         // 卡农：技能 1/2 冷却 ×0.6
  };

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

  // ---------- 羁绊规则（3.0 数值调整）----------
  var BOND = {
    eraDamage: 0.12,          // 绿色（时期）共鸣：伤害 +12%
    regionInterval: 12 * 60,  // 黄色（地区）共鸣：每 12 秒
    regionInvuln: 2.5 * 60,   // 免疫全部伤害 2.5 秒
    need: 2                   // 同一标签至少 2 人
  };

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
      ['era', ERA_TAGS, false],
      ['region', REGION_TAGS, true],
      ['system', SYSTEM_TAGS, false]
    ];
    for (var k = 0; k < kinds.length; k++) {
      var key = kinds[k][0], tags = kinds[k][1], grouped = kinds[k][2];
      var best = null;
      // 按“共鸣组”归并（未配置分组的标签自成一组）
      var groups = {};
      for (var t = 0; t < tags.length; t++) {
        var gname = grouped ? regionGroupOf(tags[t]) : tags[t];
        if (!groups[gname]) groups[gname] = [];
        groups[gname].push(tags[t]);
      }
      for (var g in groups) {
        if (!Object.prototype.hasOwnProperty.call(groups, g)) continue;
        var idxs = [], tagCount = {};
        for (var m = 0; m < ids.length; m++) {
          var cc = BY_ID[ids[m]];
          if (!cc) continue;
          var own = cc.tags[key];
          if (own && groups[g].indexOf(own) >= 0) {
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
            tag: present.join('/'), group: g,
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
  global.SYSTEM_COLOR = SYSTEM_COLOR;
  global.ERA_COLOR = ERA_COLOR;
  global.REGION_COLOR = REGION_COLOR;
  global.skillDuration = skillDuration;
  global.REGION_GROUP = REGION_GROUP;
  global.regionGroupOf = regionGroupOf;
  global.BOND = BOND;
  global.computeBonds = computeBonds;
})(window);

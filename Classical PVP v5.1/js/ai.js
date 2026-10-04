/* ============================================================
   ai.js — 右侧敌方作曲家的 AI 控制器
   根据距离 / 冷却 / 对手状态做决策，并带有性格参数
   ============================================================ */
(function (global) {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function AIController(game) {
    this.game = game;
    // 兜底默认值：即使没有调用 reset()，也不会因为 aggression 为 undefined
    // 让所有概率判定变成 NaN 比较，从而导致 AI 完全不出手
    this.aggression = 0.5;
    this.keepDist = 80;
    this.reactBase = 16;
    this.decision = 'hold';
    this.decisionT = 0;
    this.react = 16;
    this.moveDir = 0;
    this.wantSkill = -1;
    this.blockHold = 0;
    this.jumpCd = 0;
    this.attackCd = 0;
    this.leaveTime = 0;
    this.leaveCd = 0;
    this.escapeDir = 0;
    this.ultHold = 0;
  }

  AIController.prototype.reset = function (f) {
    var s = f.c.stats;
    // 性格：由属性推导，保证每位作曲家打法不同
    this.aggression = clamp(0.32 + s.power / 34 + (24 - s.speed) / 60, 0.25, 0.95);
    this.keepDist = 0;
    // 远程型/领域型倾向保持距离
    var k0 = f.c.skills[0], k1 = f.c.skills[1];
    var ranged = 0;
    if (k0.type === 'projectile' || k0.type === 'field' || k0.type === 'rondo') ranged++;
    if (k1.type === 'projectile' || k1.type === 'field' || k1.type === 'rondo') ranged++;
    if (ranged === 2) this.keepDist = 160;
    else if (ranged === 1) this.keepDist = 120;
    else this.keepDist = 40;
    if (k0.type === 'dashAttack' || k1.type === 'dashAttack') this.keepDist -= 40;
    this.reactBase = clamp(26 - s.speed * 0.45, 9, 22);
    this.decision = 'hold';
    this.decisionT = 0;
    this.react = 14;
    this.moveDir = 0;
    this.wantSkill = -1;
    this.blockHold = 0;
    this.jumpCd = 0;
    this.attackCd = 0;
    this.leaveTime = 0;      // 本次连续躲避领域的时长
    this.leaveCd = 0;        // 躲避冷却：逃太久会强制回头交战
    this.escapeDir = 0;
  };

  AIController.prototype.update = function (f, player) {
    if (!f || !player || f.dead || f.state === 'ko') { if (f) { f.ix = 0; f.blocking = false; } return; }

    // 各种计时器始终推进（包括出招硬直期间），
    // 否则出招时不递减，收招后会立刻重复同一个决策
    if (this.jumpCd > 0) this.jumpCd--;
    if (this.attackCd > 0) this.attackCd--;
    if (this.blockHold > 0) this.blockHold--;
    if (this.decisionT > 0) this.decisionT--;

    if (f.stun > 0) { f.ix = 0; f.blocking = false; return; }

    var G = this.game;
    f.facing = player.x >= f.x ? 'right' : 'left';
    player.facing = f.x >= player.x ? 'right' : 'left';

    var busy = !(f.freeMove > 0) && (f.state === 'punch' || f.state === 'kick' || f.state === 'cast' ||
      f.state === 'kickSkill' || f.state === 'hurt');
    if (busy) { f.blocking = false; return; }

    var d = Math.abs(player.x - f.x);
    var dirToPlayer = player.x >= f.x ? 1 : -1;
    var hpRatio = f.hp / f.maxHp;
    var foeRatio = player.hp / player.maxHp;

    // 重新决策
    if (this.decisionT <= 0) {
      this.decide(f, player, d, hpRatio, foeRatio);
    }

    // 执行决策
    var ix = 0;
    var acted = false;          // 本帧是否已经出招（出招后不再覆盖动作）
    f.blocking = false;

    switch (this.decision) {
      case 'approach':
        if (d > 78) ix = dirToPlayer;
        else ix = -dirToPlayer * (Math.random() < 0.4 ? 1 : 0);
        break;
      case 'retreat':
        ix = -dirToPlayer;
        break;
      case 'leave':
        ix = this.escapeDir || -dirToPlayer;
        break;
      case 'hold':
        ix = (Math.random() < 0.3) ? dirToPlayer : 0;
        break;
      case 'block':
        f.blocking = true;
        ix = 0;
        break;
      case 'jump':
        if (f.onGround && this.jumpCd <= 0) {
          f.vy = -f.jumpPower();
          f.onGround = false;
          f.setAnim('jump', true);
          this.jumpCd = 42;          // 防止连续起跳（此前这个计时器同样是死代码）
          acted = true;
        }
        ix = dirToPlayer;
        break;
      case 'punch':
        if (d <= 86) { G.startBasic(f, 'punch'); acted = true; }
        else ix = dirToPlayer;
        break;
      case 'kick':
        if (d <= 104) { G.startBasic(f, 'kick'); acted = true; }
        else ix = dirToPlayer;
        break;
      case 'skill1':
      case 'skill2':
      case 'ult':
        var slot = this.decision === 'skill1' ? 0 : (this.decision === 'skill2' ? 1 : 2);
        if (f.cd[slot] <= 0) { G.useSkill(f, player, slot); acted = true; }
        else ix = dirToPlayer;
        break;
    }
    void this.wantSkill;

    // 移动。
    // 关键：出招后的这一帧绝对不能再调用 setAnim()，否则会把刚设置的
    // punch / kick / cast 动作覆盖成 idle，导致攻击动画（以及判定帧）永远不出现
    // —— 这正是此前“AI 只会放技能、从不挥拳踢腿”的根因。
    if (acted) {
      f.ix = 0;
      if (!f.onGround) f.vx *= 0.9;
      else f.vx *= 0.5;
      return;
    }
    if (!f.blocking && f.onGround) {
      f.ix = ix;
      f.vx = ix * f.speedValue();
      f.setAnim(ix === 0 ? 'idle' : 'walk');
    } else if (f.blocking) {
      f.ix = 0;
      f.vx *= 0.5;
    } else {
      f.ix = ix;
      f.vx += ix * 0.4;
    }
  };

  /** 场地边界（game.js 加载后从 GAME_CONST 读取，避免脚本顺序问题） */
  AIController.prototype.bounds = function () {
    if (!this._b) {
      var GC = global.GAME_CONST || {};
      this._b = { l: GC.LEFT_MIN || 96, r: GC.RIGHT_MAX || 864 };
    }
    return this._b;
  };

  AIController.prototype.decide = function (f, player, d, hpRatio, foeRatio) {
    var G = this.game;
    var ag = this.aggression;
    // 残血时更谨慎，领先时更主动
    if (hpRatio < 0.3) ag *= 0.78;
    if (foeRatio < 0.3) ag = Math.min(1, ag * 1.25);
    this.react = this.reactBase + rnd(-4, 6);
    this.decisionT = Math.max(6, Math.round(this.react));

    // 0) 站在对手的伤害型领域里 → 尝试脱离，
    //    但设有时长上限与被逼到墙角时的回身交战，避免无限风筝导致对手永远打不到自己
    if (this.leaveCd > 0) this.leaveCd--;
    var fd = this.fieldOn(f);
    if (fd && this.leaveCd <= 0 && Math.random() < 0.85) {
      var B = this.bounds();
      var esc = f.x < fd.x ? -1 : 1;
      var atWall = (esc < 0 && f.x <= B.l + 45) || (esc > 0 && f.x >= B.r - 45);
      if (atWall) esc = -esc;                       // 撞墙就换方向逃
      atWall = (esc < 0 && f.x <= B.l + 45) || (esc > 0 && f.x >= B.r - 45);
      if (!atWall) {
        this.escapeDir = esc;
        this.decision = 'leave';
        this.decisionT = Math.round(rnd(12, 24));
        this.leaveTime += this.decisionT;
        if (this.leaveTime > 96) {                  // 逃够约 1.6 秒 → 强制回头交战
          this.leaveTime = 0;
          this.leaveCd = 210;
        }
        return;
      }
    }
    this.leaveTime = Math.max(0, this.leaveTime - 4);

    // 1) 对手正在出招 → 格挡 / 拉开
    var foeAttacking = player.state === 'punch' || player.state === 'kick' ||
      player.state === 'cast' || player.state === 'kickSkill' || player.dash || player.multi;
    if (foeAttacking && d < 170 && this.blockHold <= 0 && Math.random() < 0.32 + ag * 0.25) {
      this.decision = 'block';
      this.blockHold = Math.round(rnd(14, 30));
      this.decisionT = this.blockHold;
      return;
    }

    // 2) 躲开正在飞来的投射物：只有“起跳到最高点能越过”的才起跳，
    //    跳不过去的（三向扇形、贴地弹幕）改为后撤，避免原地白吃一发
    var proj = this.incomingProjectile(f);
    if (proj) {
      var tta = Math.abs(proj.x - f.x) / Math.max(0.5, Math.abs(proj.speed));
      if (this.canJumpOver(f, proj) && this.jumpCd <= 0 && tta >= 10 && tta <= 32 && Math.random() < 0.75) {
        this.decision = 'jump';
        return;
      }
      if (Math.random() < 0.6) { this.decision = 'retreat'; return; }
    }

    // 3) 贴身肉搏：普攻优先于技能。
    //    以前技能判定排在普攻之前，导致只要有一个技能不在冷却就永远轮不到挥拳踢腿，
    //    AI 因此显得只会放技能、毫无近身威胁。
    if (d < 96 && this.attackCd <= 0) {
      var skillReady = (f.cd[0] <= 0 || f.cd[1] <= 0);
      var basicChance = skillReady ? 0.55 + ag * 0.2 : 0.92;
      if (Math.random() < basicChance) {
        this.attackCd = Math.round(rnd(10, 20));   // 普攻节奏（此前这个计时器从未被赋值）
        // 对手血量低时更倾向用踢腿（伤害更高）
        var heavy = foeRatio < 0.45 ? 0.6 : 0.4;
        this.decision = Math.random() < heavy ? 'kick' : 'punch';
        return;
      }
    }

    // 4) 终极技：合适的距离与时机才放（见 ultWanted）
    if (f.cd[2] <= 0 && this.ultWanted(f, player, d, foeRatio, hpRatio)) {
      this.decision = 'ult';
      return;
    }

    // 4.5) 拉开距离型：距离太近就后撤
    if (this.keepDist > 0 && d < this.keepDist - 50 && Math.random() < 0.5) {
      this.decision = 'retreat';
      return;
    }

    // 5) 领域 / 回声 / 远程技能
    var s0 = f.c.skills[0], s1 = f.c.skills[1];
    if (f.cd[0] <= 0 && this.skillWanted(s0, d, ag)) { this.decision = 'skill1'; return; }
    if (f.cd[1] <= 0 && this.skillWanted(s1, d, ag)) { this.decision = 'skill2'; return; }

    // 8) 近身普攻（攻击间隔已到才出，避免原地连点）
    if (d < 96) {
      if (this.attackCd <= 0) {
        this.attackCd = Math.round(rnd(10, 20));
        var r = Math.random();
        if (r < 0.5 + ag * 0.3) { this.decision = 'punch'; return; }
        if (r < 0.78 + ag * 0.2) { this.decision = 'kick'; return; }
      }
      if (Math.random() < 0.35) { this.decision = 'block'; this.blockHold = Math.round(rnd(12, 24)); this.decisionT = this.blockHold; return; }
      this.decision = 'retreat';
      return;
    }

    // 9) 中远距离：靠近 / 跳跃逼近 / 观察
    var r2 = Math.random();
    if (r2 < 0.58 + ag * 0.25) this.decision = 'approach';
    else if (r2 < 0.72) this.decision = 'jump';
    else if (r2 < 0.88) this.decision = 'hold';
    else this.decision = 'retreat';
    void G;
  };

  /**
   * 终极技是否值得放。
   * 之前的判定只看距离，导致两个问题：
   *   1. 开局双方还隔着大半个场地就把大招交掉（尤其是治疗 / 增益 / 自我强化类，
   *      持续时间会在对手走过来之前就结束，等于白放）；
   *   2. 对手在无敌帧里也照放不误。
   */
  AIController.prototype.ultWanted = function (f, player, d, foeRatio, hpRatio) {
    var G = this.game;
    var u = f.c.skills[2];
    // 开局保护：v4.2 起引擎会在正式开打瞬间给双方挂上 6 秒的终极技初始冷却
    // （game.js ULT_OPENING_CD），cd[2] 本身就会拦住开局大招；
    // 这里再留 0.5 秒余量，避免刚解禁立刻交出大招。
    // v5.1：删掉原来的 `if (G.t < 120) return false`。G.t 每回合都会被 nextRound()
    // 清零，它的语义是"本回合开始后 2 秒"，与 playT 的"交战开始后 0.5 秒"重复且更严，
    // 导致第 2/3 回合 AI 要多等约 1.8 秒才可能放大招。开局保护统一由 playT 负责。
    if (G.playT != null && G.playT < 30) return false;
    if (G.phase !== 'play') return false;
    // 对手处于长期无敌（黄色羁绊免疫 / 技能无敌）时不要浪费伤害型大招。
    // 门槛取 24 帧：短无敌（受击硬直里的几帧）通常在起手动画结束前就消失了，
    // 不会让大招落空，只有免疫护盾这类长无敌才值得放弃。
    var selfOnly = this.isSelfOnlyUlt(u);
    if (player.invuln > 24 && !selfOnly) return false;
    // 各类型的有效距离
    var range;
    if (u.hit && u.hit.fullScreen) range = 9999;
    else if (u.type === 'field') range = selfOnly ? 230 : 320;
    else if (u.type === 'echo') range = 330;
    else if (u.type === 'movement') range = 250;
    else if (u.type === 'canon') range = 230;
    else if (u.type === 'projectile' || u.type === 'rondo') range = 340;
    else if (u.hit) range = (u.hit.w || 200) * 0.85;
    else if (u.dash) range = 260;
    else range = 200;
    if (d > range) return false;
    // 自我强化类：必须等对手靠近，否则 buff 时间会在空场里耗尽
    if (selfOnly && d > 230) return false;
    // 对手满血又离得远时不急着交大
    if (!selfOnly && foeRatio > 0.72 && d > 190 && Math.random() > 0.3) return false;
    // 自己残血时更愿意用大招搏一把
    if (hpRatio < 0.35) return Math.random() < 0.75;
    return Math.random() < 0.5 + this.aggression * 0.4;
  };

  /** 该终极技是否属于“自我强化 / 治疗 / 增益”一类（对距离敏感，远了就是浪费） */
  AIController.prototype.isSelfOnlyUlt = function (u) {
    if (u.type === 'canon') return true;
    if (u.self) {
      var s = u.self;
      if (s.heal || s.shield || s.buff || s.armor || s.lifesteal) {
        // 如果同时还带伤害判定，就不算纯自我强化
        if (!u.hit && !u.field && !u.echo) return true;
      }
    }
    if (u.type === 'field' && u.field) {
      var k = u.field.kind;
      if (k === 'heal' || k === 'armor') return true;
    }
    if (!u.hit && !u.field && !u.echo && !u.movement && !u.projectile && !u.rondo) return true;
    return false;
  };

  /** 判断某个技能在当前距离是否值得放 */
  AIController.prototype.skillWanted = function (sk, d, ag) {
    switch (sk.type) {
      case 'projectile':
        // v5.1 修复：原来是 d > 150，但 AI 自己的站位逻辑（decide 里 d > 78 就贴近、
        // 只在 d < keepDist-50 才后撤）会把稳态距离压在 80~140，于是弹道技能
        // 就绪时间里只有 0~4% 满足门限 —— 实测 16 位角色的投掷技几乎从不释放。
        // 门槛下调到 96，与 78 的贴近阈值留出余量。
        return d > 96 && d < 520 && Math.random() < 0.5 + ag * 0.3;
      case 'field':
        // 领域：贴脸或中距离都合适（跟随型领域最好近身，放置型可远投）
        var follow = sk.field && sk.field.follow;
        if (follow) return d < 240 && Math.random() < 0.5 + ag * 0.3;
        return d < 340 && Math.random() < 0.5 + ag * 0.3;
      case 'echo':
        return d < 330 && Math.random() < 0.5 + ag * 0.3;
      case 'movement':
        // 乐章：会自动连奏，中近距离最有效
        return d < 280 && Math.random() < 0.5 + ag * 0.3;
      case 'rondo':
        // 回旋：中远距离投射，回程还能把人拖回来
        return d > 80 && d < 400 && Math.random() < 0.5 + ag * 0.3;
      case 'canon':
        // 卡农是自我强化，任何距离都可以开
        return Math.random() < 0.45 + ag * 0.3;
      case 'dashAttack':
        return d > 92 && d < 300 && Math.random() < 0.5 + ag * 0.35;
      default:
        // v5.1 修复：近战判定是在出招后第 7 帧才结算的，双方都还在移动，
        // 真正可达的距离只有 ~82~103px，而这里原本放行到 140 —— 于是 30~70% 的
        // 释放落在判定框外空转。改用技能自己的判定框宽度来定门槛。
        var reach = (sk.hit && sk.hit.w) ? sk.hit.w * 0.5 + 18 : 90;
        return d < reach && Math.random() < 0.42 + ag * 0.3;
    }
  };

  /** 返回正踩在自己脚下的敌方“伤害型”领域（治疗/护甲领域无需躲避） */
  AIController.prototype.fieldOn = function (f) {
    var list = this.game.fields;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var fd = list[i];
      if (fd.owner === f) continue;
      var sp = fd.spec || {};
      var kind = sp.kind;
      if (kind !== 'damage' && kind !== 'ramp' && kind !== 'drain') continue;
      var r = sp.radius || 170;
      if (Math.abs(f.x - fd.x) <= r * 0.92) return fd;
    }
    return null;
  };

  AIController.prototype.threatenedByProjectile = function (f) {
    return !!this.incomingProjectile(f);
  };

  /** 返回正在飞向自己、且已进入危险距离的投射物（取最快命中的那一发） */
  AIController.prototype.incomingProjectile = function (f) {
    var list = this.game.projectiles;
    var best = null, bestT = 1e9;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.owner === f || p.delay > 0) continue;
      var dx = p.x - f.x;
      var approaching = (p.speed > 0 && dx < 0) || (p.speed < 0 && dx > 0);
      if (!approaching) continue;
      var gap = Math.abs(dx);
      if (gap > 320 || Math.abs(p.y - (f.y - 70)) > 110) continue;
      var tta = gap / Math.max(0.5, Math.abs(p.speed));
      if (tta < bestT) { bestT = tta; best = p; }
    }
    return best;
  };

  /**
   * 这一发投射物能否靠“跳到最高点”躲开。
   * 用与 game.js 相同的判定盒公式（fighterBox）比较最高点时的盒子是否分离，
   * 因此跳跃高度一旦调整，AI 的判断会自动跟着变。
   */
  AIController.prototype.canJumpOver = function (f, p) {
    var fh = 106 * (f.c.sprite.height || 1);
    var apexCy = (f.y - f.jumpApex()) - fh * 0.52;
    return Math.abs(apexCy - p.y) * 2 >= (fh + p.h);
  };

  global.AIController = AIController;
})(window);

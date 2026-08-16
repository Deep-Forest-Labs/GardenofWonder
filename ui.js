/* Garden Wonder — presentation, input and glue. */

(() => {
  const { $, $$, S, el, fmt, fmtTime, pct, signed, rnd, MASTERY_TRACK } = UI;

  /* ============ scenery ============ */
  const SKY_KEYS = [
    { t: 0.00, s1: '#132a52', s2: '#2b4a7a', s3: '#5a7a9e', sun: '#e8f0ff', star: 1, sx: 22, sy: 22 },
    { t: 0.18, s1: '#ff9e6d', s2: '#ffd9a0', s3: '#ffeed2', sun: '#fff0c4', star: 0.15, sx: 8, sy: 62 },
    { t: 0.34, s1: '#5cb8ee', s2: '#a9e2ff', s3: '#e4f7ff', sun: '#fff8d0', star: 0, sx: 30, sy: 22 },
    { t: 0.55, s1: '#7ec8f2', s2: '#bfe9ff', s3: '#e9f8ff', sun: '#fff3bf', star: 0, sx: 62, sy: 12 },
    { t: 0.74, s1: '#ff8f6b', s2: '#ffc48c', s3: '#ffe6c4', sun: '#ffd08a', star: 0.1, sx: 88, sy: 58 },
    { t: 0.86, s1: '#3d2a63', s2: '#7a5a92', s3: '#c98fa4', sun: '#ffd9e8', star: 0.55, sx: 96, sy: 74 },
    { t: 1.00, s1: '#132a52', s2: '#2b4a7a', s3: '#5a7a9e', sun: '#e8f0ff', star: 1, sx: 22, sy: 22 }
  ];


  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
  };

  function updateSky() {
    const t = Game.dayPhase();
    let i = 0;
    while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].t <= t) i += 1;
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    const k = (t - a.t) / (b.t - a.t);
    const r = document.documentElement.style;
    r.setProperty('--sky1', mix(a.s1, b.s1, k));
    r.setProperty('--sky2', mix(a.s2, b.s2, k));
    r.setProperty('--sky3', mix(a.s3, b.s3, k));
    r.setProperty('--sun-c', mix(a.sun, b.sun, k));
    r.setProperty('--star-op', (a.star + (b.star - a.star) * k).toFixed(2));
    r.setProperty('--sun-x', (a.sx + (b.sx - a.sx) * k).toFixed(1) + '%');
    r.setProperty('--sun-y', (a.sy + (b.sy - a.sy) * k).toFixed(1) + '%');
  }

  function buildClouds() {
    const make = (host, n, minW, maxW, minDur, maxDur, op) => {
      for (let i = 0; i < n; i += 1) {
        const c = document.createElement('div');
        c.className = 'cloud';
        const w = minW + Math.random() * (maxW - minW);
        c.style.setProperty('--w', w + 'px');
        c.style.setProperty('--dur', (minDur + Math.random() * (maxDur - minDur)) + 's');
        c.style.setProperty('--delay', (-Math.random() * 90) + 's');
        c.style.setProperty('--o', op);
        c.style.top = (14 + Math.random() * 52) + '%';
        host.appendChild(c);
      }
    };
    make(el.cloudsFar, 3, 58, 92, 130, 200, 0.62);
    make(el.cloudsNear, 2, 92, 140, 80, 120, 0.9);
  }

  /* ============ garden ============ */
  const plotEls = [];
  let flowerBtn = null;
  let speechEl = null;
  let comboRing = null;

  function buildGarden() {
    el.garden.innerHTML = '';
    plotEls.length = 0;
    for (let cell = 0; cell < 9; cell += 1) {
      if (cell === 4) {
        const wrap = document.createElement('div');
        wrap.className = 'flower-cell';
        wrap.innerHTML = `
          <div class="flower-glow"></div>
          <div class="combo-ring"></div>
          <button class="flower-btn" id="flowerBtn" aria-label="Tap the talking flower">${Flora.talkingFlower()}</button>
          <div class="speech" id="speech"></div>`;
        el.garden.appendChild(wrap);
        flowerBtn = $('#flowerBtn', wrap);
        speechEl = $('#speech', wrap);
        comboRing = $('.combo-ring', wrap);
        wireFlower();
        continue;
      }
      const idx = cell < 4 ? cell : cell - 1;
      const b = document.createElement('button');
      b.className = 'plot';
      b.dataset.idx = idx;
      b.dataset.state = 'empty';
      b.innerHTML = `
        <div class="plot-inner"><div class="plant-slot"></div></div>
        <div class="empty-mark">${Icons.get('plantSpot')}</div>
        <div class="lock-badge">${Icons.get('lock')}<div class="lock-cost">${Icons.get('coin')}<span></span></div></div>
        <div class="bar"><i></i></div>
        <div class="ready-pop">!</div>
        <div class="auto-tag">Auto</div>
        <div class="lucky-badge">${Icons.get('ladybug')}</div>
        <button class="skip-chip" type="button" aria-label="Finish this plant with gems">${Icons.get('gem')}<span></span></button>
        <button class="pack-drop" type="button" aria-label="Collect a card pack">${Icons.get('cards')}</button>`;
      $('.pack-drop', b).addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onPackTap(idx);
      }, { passive: false });
      $('.skip-chip', b).addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSkipTap(idx);
      }, { passive: false });
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); onPlotTap(idx, b); }, { passive: false });
      el.garden.appendChild(b);
      plotEls[idx] = {
        root: b,
        inner: $('.plot-inner', b),
        slot: $('.plant-slot', b),
        bar: $('.bar i', b),
        cost: $('.lock-cost span', b),
        costWrap: $('.lock-cost', b),
        tag: $('.auto-tag', b),
        skip: $('.skip-chip', b),
        pack: $('.pack-drop', b),
        skipNum: $('.skip-chip span', b),
        lucky: $('.lucky-badge', b),
        cache: {}
      };
    }
  }

  /** Keep the board a perfect square that fills whatever the stage row offers. */
  function sizeGarden() {
    const st = $('.stage');
    const r = st.getBoundingClientRect();
    const s = Math.max(150, Math.floor(Math.min(r.width, r.height)));
    el.garden.style.width = s + 'px';
    el.garden.style.height = s + 'px';
  }

  function stageOf(p) {
    if (p < 0.25) return 1;
    if (p < 0.7) return 2;
    return 3;
  }

  function renderPlots() {
    for (let i = 0; i < 8; i += 1) {
      const cell = S.grid[i];
      const v = plotEls[i];
      if (!v) continue;
      const c = v.cache;

      let state;
      if (cell.locked) state = 'locked';
      else if (!cell.seed) state = 'empty';
      else if (cell.ready) state = 'ready';
      else state = 'grow';

      if (c.state !== state) {
        v.root.dataset.state = state;
        c.state = state;
      }
      const hasPack = Boolean(cell.packDrop);
      if (c.packDrop !== hasPack) {
        v.root.classList.toggle('has-pack', hasPack);
        c.packDrop = hasPack;
      }
      const skipGems = state === 'grow' ? Game.skipCost(i) : 0;
      if (c.skip !== skipGems) {
        if (skipGems) {
          v.skipNum.textContent = fmt(skipGems);
          v.root.dataset.skip = S.gems >= skipGems ? 'ok' : 'no';
        } else {
          delete v.root.dataset.skip;
        }
        c.skip = skipGems;
      }
      const mut = cell.mutation || '';
      if (c.mutation !== mut) {
        if (mut) {
          const md = DATA.mutations[mut];
          v.root.dataset.mutation = mut;
          v.root.style.setProperty('--mut', md.tint);
          v.root.style.setProperty('--mut-glow', md.glow);
        } else {
          delete v.root.dataset.mutation;
        }
        c.mutation = mut;
      }
      if (c.aura !== (cell.aura || '')) {
        if (cell.aura) v.root.dataset.aura = cell.aura; else delete v.root.dataset.aura;
        c.aura = cell.aura || '';
      }
      const lucky = Boolean(cell.luckyBug);
      if (c.lucky !== lucky) { v.lucky.classList.toggle('show', lucky); c.lucky = lucky; }

      if (state === 'locked') {
        const gated = !Game.plotAvailable(i);
        if (c.gated !== gated) {
          v.root.dataset.gated = gated ? '1' : '0';
          if (gated) {
            v.costWrap.textContent = `Lv ${Game.plotUnlockLevel(i)}`;
            v.cost = null;
          } else {
            v.costWrap.innerHTML = `${Icons.get('coin')}<span></span>`;
            v.cost = $('span', v.costWrap);
          }
          c.gated = gated;
          c.cost = null;
        }
        if (gated) {
          if (c.afford !== '0') { v.root.dataset.afford = '0'; c.afford = '0'; }
        } else {
          const cost = Game.plotUnlockCost(i);
          if (c.cost !== cost) { if (v.cost) v.cost.textContent = fmt(cost); c.cost = cost; }
          const afford = S.credits >= cost ? '1' : '0';
          if (c.afford !== afford) { v.root.dataset.afford = afford; c.afford = afford; }
        }
        if (c.seed !== null) { v.slot.innerHTML = ''; c.seed = null; c.stage = null; }
        continue;
      }

      if (!cell.seed) {
        if (c.seed !== null) { v.slot.innerHTML = ''; c.seed = null; c.stage = null; }
        continue;
      }

      if (c.seed !== cell.seed) {
        const sdef = Game.seedById(cell.seed);
        v.slot.innerHTML = sdef ? Flora.plant(sdef) : '';
        c.seed = cell.seed;
        c.stage = null;
      }

      const p = Game.progressOf(cell);
      const st = stageOf(p);
      if (c.stage !== st) { v.root.dataset.stage = st; c.stage = st; }
      const w = (p * 100).toFixed(1) + '%';
      if (c.bar !== w) { v.bar.style.width = w; c.bar = w; }
    }
  }

  /* ============ talking flower ============ */
  let speechTimer = null;
  let lastSpeech = 0;
  let idleSince = Date.now() / 1000;

  function say(bucket, force) {
    const now = Date.now() / 1000;
    if (!el.coach.hidden) return; // don't stack a bubble on top of a coach mark
    if (!force && now - lastSpeech < 3.2) return;
    const lines = FLOWER_LINES[bucket] || FLOWER_LINES.idle;
    const text = lines[(Math.random() * lines.length) | 0];
    lastSpeech = now;
    speechEl.textContent = text;
    speechEl.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speechEl.classList.remove('show'), 2400);
  }

  let faceTimer = null;
  function faceReact(mood) {
    flowerBtn.classList.remove('bounce');
    void flowerBtn.offsetWidth;
    flowerBtn.classList.add('bounce');
    flowerBtn.classList.toggle('squint', mood === 'crit');
    flowerBtn.classList.toggle('happy', mood === 'happy');
    const mouth = $('.tf-mouth-path', flowerBtn);
    if (mouth) {
      const shapes = {
        idle: 'M-8,10 Q0,17 8,10',
        open: 'M-7,9 Q0,20 7,9 Q0,14 -7,9',
        crit: 'M-10,8 Q0,23 10,8 Q0,15 -10,8',
        wow: 'M-6,10 Q0,20 6,10 Q0,20 -6,10'
      };
      mouth.setAttribute('d', shapes[mood === 'crit' ? 'crit' : mood === 'wow' ? 'wow' : 'open']);
      clearTimeout(faceTimer);
      faceTimer = setTimeout(() => {
        mouth.setAttribute('d', shapes.idle);
        flowerBtn.classList.remove('squint');
      }, 340);
    }
  }

  function lookAt(clientX, clientY) {
    const eyes = $$('.tf-eye', flowerBtn);
    if (!eyes.length) return;
    const r = flowerBtn.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const dy = Math.max(-1, Math.min(1, (clientY - (r.top + r.height * 0.42)) / (r.height / 2)));
    flowerBtn.style.setProperty('--px', (dx * 2).toFixed(2));
    flowerBtn.style.setProperty('--py', (dy * 1.6).toFixed(2));
  }

  function wireFlower() {
    let holdTimer = null;
    const stopHold = () => {
      if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    };
    flowerBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.resume();
      lookAt(e.clientX, e.clientY);
      Game.tapFlower();
      if (!S.seen.intro) { S.seen.intro = true; Game.save(); hideCoach(); }
      // Holding repeats the same tap at a fixed cadence for as long as the
      // pointer stays down — Quick Grip shortens that cadence, it never
      // changes what a single tap is worth.
      stopHold();
      holdTimer = setInterval(() => Game.tapFlower(true), S.tap.holdInterval);
    }, { passive: false });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) => {
      flowerBtn.addEventListener(evt, stopHold);
    });
  }

  /* ============ HUD ============ */
  const counters = {
    credits: { disp: 0, node: el.credits, wallet: el.walletCredits, get: () => S.credits },
    gems: { disp: 0, node: el.gems, wallet: el.walletGems, get: () => S.gems }
  };

  function hudTick(dt) {
    Object.values(counters).forEach((c) => {
      const target = c.get();
      if (Math.abs(target - c.disp) < 0.6) {
        if (c.disp !== target) { c.disp = target; c.node.textContent = fmt(target); }
        return;
      }
      c.disp += (target - c.disp) * Math.min(1, dt * 9);
      c.node.textContent = fmt(c.disp);
    });
    renderQuestStrip();
  }

  function renderQuestStrip() {
    if (!el.questStrip) return;
    const q = Game.stripQuest();
    const lv = Game.levelFromRep(S.rep);
    const into = Game.repIntoLevel(S.rep);
    const need = Game.repToNext(lv);
    const repP = need ? Math.max(0, Math.min(1, into / need)) : 1;
    let text = 'More reputation is coming';
    let count = '';
    let ready = false;
    let claimId = '';
    let questP = 0;
    let reward = '';
    const rest = q.kind === 'rest' || !q.def;
    if (!rest) {
      text = q.def.text;
      ready = q.complete;
      questP = q.def.qty ? Math.max(0, Math.min(1, q.inst.progress / q.def.qty)) : 0;
      count = ready ? 'Claim' : `${q.inst.progress} / ${q.def.qty}`;
      claimId = ready ? q.def.id : '';
      reward = `+${q.def.rep}`;
    }
    const sig = [lv, repP.toFixed(3), questP.toFixed(3), text, count, claimId, reward, rest].join('|');
    if (el.questStrip.dataset.sig === sig) return;
    el.questStrip.dataset.sig = sig;
    el.qPip.textContent = lv;
    if (el.qPipWrap) el.qPipWrap.style.setProperty('--p', repP.toFixed(3));
    el.qBar.style.transform = `scaleX(${questP})`;
    el.qText.textContent = text;
    el.qCount.textContent = count;
    if (el.qReward) {
      el.qReward.innerHTML = reward ? `${Icons.get('star')}${reward}` : '';
    }
    el.questStrip.classList.toggle('ready', ready);
    el.questStrip.classList.toggle('rest', rest);
    el.questStrip.dataset.claim = claimId;
  }

  function popWallet(name) {
    const c = counters[name];
    if (!c) return;
    c.wallet.classList.remove('pop');
    void c.wallet.offsetWidth;
    c.wallet.classList.add('pop');
  }

  /* ============ rail chips ============ */
  /* The boost tray: active boosts show a countdown, held idle ones show a
     tappable chip that consumes one. Nothing renders when you hold none. */
  function renderRail() {
    const now = Game.nowSeconds();
    let html = '';
    DATA.boosters.forEach((b) => {
      if (Game.activeBoost(b.id)) {
        const remain = Math.max(0, S.boosters[b.id] - now);
        const p = Math.max(0, Math.min(1, remain / b.dur));
        html += `<div class="chip timed" style="--tint:${b.tint}">
          <span class="ring" style="--p:${p.toFixed(3)}"><i>${Math.ceil(remain) > 99 ? fmtTime(remain) : Math.ceil(remain)}</i></span>
          <span>${b.name}</span></div>`;
      } else {
        const held = (S.boostInv && S.boostInv[b.id]) || 0;
        if (held < 1) return;
        html += `<button class="chip buyable" data-boost="${b.id}" style="--tint:${b.tint}">
          <span class="chip-ico">${Icons.get(b.icon)}</span>
          <span>${b.name}</span>
          <span class="chip-price">×${held}</span></button>`;
      }
    });
    if (Game.wonderActive()) {
      const remain = Math.max(0, S.wonder.until - now);
      html = `<div class="chip timed" style="--tint:#ff6bd6">
        <span class="ring" style="--p:${(remain / WONDER.duration).toFixed(3)}"><i>${Math.ceil(remain)}</i></span>
        <span>WONDER x${WONDER.payoutMult}</span></div>` + html;
    }
    if (el.rail.dataset.sig !== html) {
      el.rail.innerHTML = html;
      el.rail.dataset.sig = html;
    }
  }

  /* ============ toasts ============ */
  function toast({ title, body, art, kind = '', ms = 3000 }) {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = `<div class="t-art">${art || Icons.get('sparkle')}</div>
      <div><div class="t-title">${title}</div>${body ? `<div class="t-body">${body}</div>` : ''}</div>`;
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 2) el.toasts.firstElementChild.remove();
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 320);
    }, ms);
  }

  function onSkipTap(idx) {
    const cost = Game.skipCost(idx);
    if (!cost) return;
    if (S.gems < cost) {
      Sound.play('deny');
      FX.shake(4);
      popWallet('gems');
      say('broke');
      return;
    }
    const r = Game.skipGrow(idx);
    if (!r) return;
    const v = plotEls[idx];
    const c = FX.centerOf(v.root);
    FX.sparks(c.x, c.y, 12, '#8ce0ff');
    FX.float(c.x, c.y - 8, `-${fmt(cost)}`, 'rare');
    Sound.play('buy');
    FX.haptic(12);
  }

  function onPackTap(idx) {
    const r = Game.collectPackDrop(idx);
    if (!r) return;
    const v = plotEls[idx];
    const c = FX.centerOf(v.root);
    FX.sparks(c.x, c.y, 16, '#ffe066');
    FX.ring(c.x, c.y, '#ffffff', 0.5, 90);
    FX.float(c.x, c.y - 10, 'Card pack!', 'epic');
    Sound.play('quest');
    FX.haptic(16);
    say('greet');
    toast({
      title: 'A pack of cards',
      body: 'Someone left it by the beds. Open it in the album.',
      art: Icons.get('cards')
    });
  }


  el.rail.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-boost]');
    if (!chip) return;
    if (Game.activateBoost(chip.dataset.boost)) {
      const c = FX.centerOf(chip);
      FX.sparks(c.x, c.y, 12, '#ffe066');
      FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
      renderRail();
    }
  });

  el.dock.addEventListener('click', (e) => {
    const b = e.target.closest('.dock-btn');
    if (!b) return;
    if (UI.sheetMode() === b.dataset.tab) UI.closeSheet();
    else UI.openSheet(b.dataset.tab);
  });

  $('#btnSettings').addEventListener('click', () => UI.openSheet('settings'));
  $('#btnDev').addEventListener('click', () => UI.openSheet('dev'));
  $('#btnAlbum').addEventListener('click', () => UI.openSheet('album'));
  $('#btnBonuses').addEventListener('click', () => UI.openSheet('bonuses'));
  el.questStrip.addEventListener('click', () => {
    Sound.resume();
    const id = el.questStrip.dataset.claim;
    if (id) Game.claimQuest(id);
    else UI.openSheet('quests');
  });

  /* ============ plot input ============ */
  function onPlotTap(idx, node) {
    Sound.resume();
    const cell = S.grid[idx];
    if (cell.locked) {
      if (!Game.plotAvailable(idx)) {
        const c = FX.centerOf(node);
        FX.float(c.x, c.y, `Level ${Game.plotUnlockLevel(idx)}`, '');
        return;
      }
      if (!Game.unlockPlot(idx)) {
        const c = FX.centerOf(node);
        FX.float(c.x, c.y, `Need ${fmt(Game.plotUnlockCost(idx))}`, '');
      }
      return;
    }
    if (!cell.seed) { UI.openSheet('seeds', idx); return; }
    if (cell.ready) { Game.harvest(idx); return; }
    Game.hasten(idx);
    const c = FX.centerOf(node);
    FX.sparks(c.x, c.y + 10, 4, '#8ce99a');
    FX.haptic(6);
  }

  /* ============ coach marks ============ */
  let coachTarget = null;
  function showCoach(target, text) {
    coachTarget = target;
    el.coach.hidden = false;
    el.coach.innerHTML = `<div class="tip">${text}</div><div class="arrow"></div>`;
    placeCoach();
  }
  function placeCoach() {
    if (!coachTarget || el.coach.hidden) return;
    const r = coachTarget.getBoundingClientRect();
    el.coach.style.left = `${r.left + r.width / 2}px`;
    el.coach.style.top = `${Math.max(8, r.top - el.coach.offsetHeight - 6)}px`;
  }
  function hideCoach() {
    coachTarget = null;
    el.coach.hidden = true;
  }
  function refreshCoach() {
    // hideCoach(), not just hidden=true: leaving coachTarget set means the next
    // tick takes the `coachTarget !== node` shortcut, skips showCoach(), and
    // reveals the old bubble with stale text at a stale position.
    if (UI.sheetMode()) { hideCoach(); return; }
    if (!S.seen.intro) {
      if (coachTarget !== flowerBtn) showCoach(flowerBtn, 'Tap the flower!');
      el.coach.hidden = false;
    } else if (!S.seen.plot) {
      const free = S.grid.findIndex((c) => !c.locked && !c.seed);
      if (free === -1) { hideCoach(); return; }
      const node = plotEls[free] && plotEls[free].root;
      if (node && coachTarget !== node) showCoach(node, 'Plant a seed here');
      el.coach.hidden = false;
    } else {
      hideCoach();
      return;
    }
    placeCoach();
  }

  /* ============ dock attention dots ============ */
  function updateDockDots() {
    const canUpgrade = UI.CORE_UPGRADES.concat(PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked).map((p) => p.key))
      .some((k) => !Game.upgradeMaxed(k) && S.credits >= Game.upgradePrice(k));
    const canDecor = DATA.decor.some((d) => {
      const pot = d.currency === 'gems' ? S.gems : S.credits;
      return pot >= d.cost;
    });
    const canHive = Game.jarsWaiting() > 0 || (!Game.hiveCount() && S.credits >= Game.nextHiveCost());
    const canBrew = Object.keys(S.goods).length > 0 || CRAFT_RECIPES.some((r) => Game.canCraft(r));
    const map = { upgrades: canUpgrade, apiary: canHive, craft: canBrew, shop: canDecor };
    $$('.dock-btn', el.dock).forEach((b) => {
      const dot = $('.dock-dot', b);
      const show = map[b.dataset.tab] && UI.sheetMode() !== b.dataset.tab;
      dot.hidden = !show;
    });
  }

  /* ============ wonder ============ */
  function showBanner(title, sub, ms = 2200) {
    el.banner.innerHTML = `<div class="bg"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
    el.banner.classList.remove('out');
    el.banner.classList.add('show');
    setTimeout(() => {
      el.banner.classList.add('out');
      setTimeout(() => el.banner.classList.remove('show', 'out'), 400);
    }, ms);
  }

  Game.on('wonder', ({ active }) => {
    if (active) {
      el.game.classList.add('wonder');
      showBanner('WONDER!', WONDER.lines[(Math.random() * WONDER.lines.length) | 0], 2600);
      Sound.play('wonder');
      FX.shake(10, 0.5);
      FX.haptic([30, 40, 30, 40, 60]);
      const c = FX.centerOf(flowerBtn);
      FX.rainbowBurst(c.x, c.y);
      for (let i = 0; i < 5; i += 1) {
        setTimeout(() => FX.confetti(Math.random() * window.innerWidth, window.innerHeight * 0.35, 20), i * 220);
      }
      faceReact('wow');
      say('wonder', true);
    } else {
      el.game.classList.remove('wonder');
      showBanner('Wonder over', 'Back to the quiet garden', 1500);
    }
  });

  /* ============ tap-triggered garden proc FX ============
     Each of these is rare on purpose (see docs/10-decision-log.md) — the
     animation is what has to carry the "you just won something" feeling,
     since the numbers themselves are small and infrequent. All three rebuild
     their DOM/animation state from scratch on every call rather than
     toggling a persistent class, so a retrigger on the same target (possible
     at high Quick Grip speeds) always restarts cleanly instead of looking
     like a dud. */

  function triggerRainFX(v, shaved) {
    if (!v) return;
    v.root.querySelectorAll('.rain-cloud').forEach((n) => n.remove());
    v.inner.querySelectorAll('.rain-drops').forEach((n) => n.remove());

    const cloud = document.createElement('div');
    cloud.className = 'rain-cloud';
    cloud.innerHTML = '<i></i><i></i><i></i>';
    v.root.appendChild(cloud);
    setTimeout(() => cloud.remove(), 950);

    const drops = document.createElement('div');
    drops.className = 'rain-drops';
    for (let i = 0; i < 12; i += 1) {
      const d = document.createElement('span');
      d.className = 'rain-drop';
      d.style.setProperty('--x', `${rnd(8, 92).toFixed(0)}%`);
      d.style.setProperty('--delay', `${rnd(0.1, 0.45).toFixed(2)}s`);
      d.style.setProperty('--dur', `${rnd(0.4, 0.6).toFixed(2)}s`);
      d.style.setProperty('--fall', `${rnd(80, 100).toFixed(0)}%`);
      drops.appendChild(d);
    }
    v.inner.appendChild(drops);
    setTimeout(() => drops.remove(), 1100);

    Sound.play('rainDance');

    setTimeout(() => {
      v.inner.classList.remove('watered'); void v.inner.offsetWidth; v.inner.classList.add('watered');
      v.bar.classList.remove('flash'); void v.bar.offsetWidth; v.bar.classList.add('flash');
      v.slot.classList.remove('perk'); void v.slot.offsetWidth; v.slot.classList.add('perk');
      const pc = FX.centerOf(v.root);
      FX.sparks(pc.x, pc.y, 6, '#74c0fc');
      FX.floatAt(v.root, `${shaved.toFixed(1)}s faster!`, 'water');
    }, 560);
  }

  function triggerBeeFX() {
    const c = FX.centerOf(flowerBtn);
    const bee = document.createElement('div');
    bee.className = 'bee-fly';
    bee.innerHTML = Icons.get('bee');
    bee.style.setProperty('--cx', `${c.x}px`);
    bee.style.setProperty('--cy', `${c.y}px`);
    bee.style.setProperty('--ex', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--ey', `${rnd(-170, -90).toFixed(0)}px`);
    bee.style.setProperty('--xx', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--xy', `${rnd(90, 170).toFixed(0)}px`);
    document.body.appendChild(bee);
    setTimeout(() => bee.remove(), 1000);

    Sound.play('beeSwarm');

    setTimeout(() => {
      FX.sparks(c.x, c.y - 6, 5, '#ffc93c');
      FX.floatAt(flowerBtn, '+1 Honey', 'bee');
    }, 430);
  }

  function triggerLadybugFX(v) {
    if (!v) return;
    v.lucky.classList.add('show');
    v.lucky.classList.remove('land'); void v.lucky.offsetWidth; v.lucky.classList.add('land');
    setTimeout(() => v.lucky.classList.remove('land'), 650);

    const pc = FX.centerOf(v.root);
    FX.sparks(pc.x, pc.y - 6, 6, '#fa5252');
    FX.floatAt(v.root, 'Lucky spot!', 'lucky');
    Sound.play('ladybug');
  }

  /* ============ game events ============ */
  Game.on('currency', () => {
    if (UI.sheetMode()) UI.syncAfford();
  });

  Game.on('quest', () => {
    const c = FX.centerOf(el.questStrip);
    FX.coins(c.x, c.y, 9);
    FX.stars(c.x, c.y, 9, '#4dabf7');
    FX.ring(c.x, c.y, '#4dabf7', 0.5, 120);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    renderQuestStrip();
    renderRail();
  });

  Game.on('levelup', ({ to, grants }) => {
    const c = FX.centerOf(el.questStrip);
    FX.confetti(c.x, c.y, 34);
    FX.shake(9, 0.4);
    FX.haptic([20, 40, 20, 40, 40]);
    Sound.play('levelup');
    const g = grants && grants[grants.length - 1];
    let body = 'The garden is growing.';
    if (g && g.seed) body = `${g.seed.name} seeds are in the picker.`;
    else if (g && g.plot != null) body = `Plot ${g.plot + 1} can be bought with coins.`;
    else if (g && g.hive) body = 'A new hive is waiting in the Apiary.';
    else if (g && g.decor) body = 'A new decoration was added to the garden.';
    else if (g && g.gems) body = `+${g.gems} gems`;
    else if (g && g.boost) {
      const b = DATA.boosters.find((x) => x.id === g.boost);
      body = b ? `${b.name} is waiting on the tray.` : 'A boost is waiting on the tray.';
    }
    toast({ title: `Level ${to}!`, body, art: Icons.get('star') });
    showBanner(`Level ${to}!`, body, 2000);
    renderQuestStrip();
    renderRail();
  });

  Game.on('tap', (p) => {
    const c = FX.centerOf(flowerBtn);
    FX.floatAt(flowerBtn, `+${fmt(p.gain)}`, p.crit ? 'crit' : '');
    FX.coins(c.x, c.y, p.crit ? 16 : 4);
    popWallet('credits');
    faceReact(p.crit ? 'crit' : 'tap');
    idleSince = Date.now() / 1000;
    if (p.crit) {
      FX.shake(7);
      FX.stars(c.x, c.y, 10, '#ffe066');
      FX.ring(c.x, c.y, '#ffe066', 0.5, 130);
      FX.haptic([12, 30, 22]);
      Sound.play('crit');
      say('crit');
    } else {
      FX.haptic(7);
      Sound.play('tap', p.combo);
      if (Math.random() < 0.06) say('tap');
    }
    if (p.gemDrop) {
      FX.floatAt(flowerBtn, '+1 Gem', 'gem');
      popWallet('gems');
    }
    if (p.rainDance) triggerRainFX(plotEls[p.rainDance.idx], p.rainDance.shaved);
    if (p.beeSwarm) triggerBeeFX();
    if (p.ladybug) triggerLadybugFX(plotEls[p.ladybug.idx]);
    if (p.cardPack) {
      const v = plotEls[p.cardPack.idx];
      if (v) {
        const c = FX.centerOf(v.root);
        FX.sparks(c.x, c.y, 14, '#ffe066');
        FX.ring(c.x, c.y, '#ffe066', 0.55, 80);
        Sound.play('rare');
        FX.haptic(10);
      }
    }
  });

  /* Adjacency is invisible until something points at it, and a permanent indicator would clutter
     a board kept deliberately clean. So it is shown at the moment the choice is made, then fades. */
  function flashAdjacency(idx, verbId) {
    const def = DATA.verbs[verbId];
    if (!def) return;
    const targets = Game.neighboursOf(idx);
    if (!targets.length) return;
    targets.forEach((n) => {
      const nv = plotEls[n];
      if (!nv) return;
      nv.root.style.setProperty('--verb', def.tint);
      nv.root.classList.add('verb-linked');
      setTimeout(() => nv.root.classList.remove('verb-linked'), 1600);
    });
    const src = plotEls[idx];
    if (src) {
      src.root.style.setProperty('--verb', def.tint);
      src.root.classList.add('verb-source');
      setTimeout(() => src.root.classList.remove('verb-source'), 1600);
    }
  }

  /* The sky is the only cue for ordinary weather — a banner four times an hour would be noise.
     Rare weather earns a line from the flower. */
  function paintWeather(w) {
    el.game.dataset.weather = w.id;
    if (w.tint) el.game.style.setProperty('--weather-tint', w.tint);
    else el.game.style.removeProperty('--weather-tint');
  }

  Game.on('weather', ({ weather }) => {
    paintWeather(weather);
    if (FLOWER_LINES[weather.id]) say(weather.id, weather.id === 'wonderfall');
    if (weather.id === 'wonderfall') showBanner('Wonderfall', 'Anything growing might change');
  });

  const seedNameOf = (idx) => {
    const cell = S.grid[idx];
    const sd = cell && cell.seed ? Game.seedById(cell.seed) : null;
    return sd ? sd.name : '';
  };

  Game.on('mutate', ({ caught }) => {
    caught.forEach(({ idx, mutation }) => {
      const v = plotEls[idx];
      const md = DATA.mutations[mutation];
      if (!v || !md) return;
      const c = FX.centerOf(v.root);
      const rank = md.rank;
      FX.sparks(c.x, c.y, 6 + rank * 6, md.tint);
      FX.ring(c.x, c.y, md.glow, 0.5, 60 + rank * 30);
      FX.float(c.x, c.y - 10, md.name, rank >= 3 ? 'legend' : rank === 2 ? 'epic' : 'rare');
      if (rank >= 3) {
        FX.shake(rank * 2);
        FX.confetti(c.x, c.y);
        showBanner(md.name, `Your ${seedNameOf(idx) || 'bloom'} changed`);
      }
      Sound.play(rank >= 3 ? 'legend' : 'rare');
      FX.haptic(rank * 8);
    });
  });

  Game.on('plant', ({ idx, auto, verb }) => {
    if (!S.seen.plot) {
      S.seen.plot = true;
      Game.save();
      hideCoach();
      el.game.classList.remove('onboard');
    }
    const v = plotEls[idx];
    if (!v) return;
    if (verb) flashAdjacency(idx, verb);
    const c = FX.centerOf(v.root);
    FX.sparks(c.x, c.y + 8, 8, '#c99a6b');
    if (auto) {
      v.tag.classList.add('show');
      setTimeout(() => v.tag.classList.remove('show'), 1100);
    } else {
      Sound.play('plant');
      FX.haptic(10);
    }
    idleSince = Date.now() / 1000;
  });

  Game.on('harvest', (p) => {
    const v = plotEls[p.idx];
    const c = v ? FX.centerOf(v.root) : FX.centerOf(flowerBtn);
    const rk = p.rarity.key;
    FX.coins(c.x, c.y, rk === 'legend' ? 22 : rk === 'epic' ? 14 : rk === 'rare' ? 9 : 6);
    FX.float(c.x, c.y - 6, `+${fmt(p.payout)}`, rk === 'common' ? 'big' : rk);
    popWallet('credits');
    idleSince = Date.now() / 1000;

    if (rk === 'common') {
      Sound.play('harvest');
      FX.haptic(12);
    } else {
      const tint = { rare: '#4dabf7', epic: '#b197fc', legend: '#ffd43b' }[rk];
      FX.stars(c.x, c.y, rk === 'legend' ? 16 : 9, tint);
      FX.ring(c.x, c.y, tint, 0.6, 150);
      if (rk === 'legend') {
        FX.confetti(c.x, c.y, 34);
        FX.shake(9, 0.4);
        FX.haptic([20, 40, 20, 40, 40]);
        Sound.play('legend');
        say('legend', true);
      } else {
        FX.shake(rk === 'epic' ? 5 : 3);
        FX.haptic([10, 20, 14]);
        Sound.play(rk === 'epic' ? 'legend' : 'rare');
      }
      // Rare fires often enough that a toast would be noise; sparkles carry it.
      if (rk !== 'rare') {
        toast({
          title: `${p.rarity.label} ${p.seed.name}!`,
          body: `Worth ${fmt(p.payout)} coins`,
          art: Flora.head(p.seed, 26),
          kind: rk
        });
      }
    }
    if (p.gemDrop) { FX.float(c.x + 26, c.y - 20, '+1 Gem', 'gem'); popWallet('gems'); }
    if (p.repBonus) {
      FX.float(c.x, c.y - 40, `+${p.repBonus} Reputation`, 'big');
      renderQuestStrip();
    }
    if (p.luckyHarvest) {
      FX.sparks(c.x, c.y, 8, '#fa5252');
      FX.float(c.x, c.y + 18, 'Ladybug luck!', 'lucky');
    }
    if (p.firstDiscover && !(p.milestones && p.milestones.length)) {
      FX.float(c.x - 20, c.y - 28, `${p.seed.name} discovered!`, 'big');
      if (rk === 'common' || rk === 'rare') {
        toast({
          title: `${p.seed.name} discovered!`,
          body: `${Game.discoveredCount()} / ${DATA.seeds.length} in the Almanac`,
          art: Flora.head(p.seed, 26)
        });
      }
    }
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
    if (Math.random() < 0.12) say('harvest');
  });

  Game.on('almanac', ({ found, milestones }) => {
    const c = FX.centerOf(el.questStrip);
    FX.coins(c.x, c.y, 9);
    FX.stars(c.x, c.y, 9, '#51cf66');
    FX.ring(c.x, c.y, '#51cf66', 0.5, 120);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    const last = milestones[milestones.length - 1];
    const boost = last.boost ? DATA.boosters.find((b) => b.id === last.boost) : null;
    const parts = [];
    if (last.rep) parts.push(`+${last.rep} reputation`);
    if (last.gems) parts.push(`+${last.gems} gem${last.gems === 1 ? '' : 's'}`);
    if (boost) parts.push(boost.name);
    toast({
      title: `${last.at} species collected!`,
      body: parts.join(' · ') || `${found} / ${DATA.seeds.length} in the Almanac`,
      art: Icons.get('book')
    });
    if (last.gems) popWallet('gems');
    renderQuestStrip();
    renderRail();
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
  });

  Game.on('mastery', ({ idx, seed, tier, gems, first, mult }) => {
    const v = plotEls[idx];
    const c = v ? FX.centerOf(v.root) : FX.centerOf(el.questStrip);
    FX.stars(c.x, c.y, 9, '#ffd43b');
    FX.ring(c.x, c.y, '#ffd43b', 0.5, 110);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    FX.float(c.x, c.y - 52, `${seed.name} Tier ${tier}`, 'big');
    FX.float(c.x, c.y - 34, signed(mult - 1), 'gem');
    // A tier lands every few harvests of a seed, so only the beats that are
    // actually rare get a toast. The rest ride on the sparkles.
    if (gems || first) {
      toast({
        title: `${seed.name} · Tier ${tier}`,
        body: `${signed(mult - 1)} yield${gems ? ` · +${gems} gem${gems === 1 ? '' : 's'}` : ''}`,
        art: Flora.head(seed, 26)
      });
    }
    if (gems) popWallet('gems');
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
  });

  Game.on('unlock', ({ idx }) => {
    const v = plotEls[idx];
    if (v) {
      const c = FX.centerOf(v.root);
      FX.confetti(c.x, c.y, 22);
      FX.ring(c.x, c.y, '#8ce99a', 0.6, 120);
    }
    Sound.play('unlock');
    FX.haptic([15, 30, 15]);
    say('unlock', true);
    toast({ title: 'Plot unlocked!', body: 'New ground to plant on', art: Icons.get('sprout') });
  });

  Game.on('purchase', ({ kind, def }) => {
    Sound.play(kind === 'booster' ? 'boost' : 'buy');
    FX.haptic(14);
    if (kind === 'booster' && def) {
      toast({ title: `${def.name} active!`, body: def.desc, art: Icons.get(def.icon), ms: 2400 });
    }
  });

  Game.on('deny', () => {
    Sound.play('deny');
    FX.shake(3, 0.16);
    FX.haptic(20);
    say('broke');
  });

  Game.on('grid', () => buildGarden());
  Game.on('panels', () => { if (UI.sheetMode()) UI.renderSheet(false); });


  /* ============ main loop ============ */
  let last = performance.now();
  let comboAcc = 0;
  let railAcc = 0;
  let slowAcc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    Game.tick(dt);
    renderPlots();
    hudTick(dt);
    FX.step(dt);

    // combo decay, once per second (matches the original cadence)
    comboAcc += dt;
    if (comboAcc >= 1) {
      comboAcc -= 1;
      Game.decayCombo();
      const now2 = Date.now() / 1000;
      if (now2 - idleSince > 26 && !UI.sheetMode()) { say('idle'); idleSince = now2; }
    }
    const cp = S.tap.combo / S.tap.comboMax;
    comboRing.style.setProperty('--combo', cp.toFixed(3));
    comboRing.style.setProperty('--combo-op', (0.3 + cp * 0.7).toFixed(2));

    railAcc += dt;
    if (railAcc >= 0.25) { railAcc = 0; renderRail(); UI.tickSheetTimers(); }

    slowAcc += dt;
    if (slowAcc >= 0.6) {
      slowAcc = 0;
      updateDockDots();
      refreshCoach();
      updateSky();
      if (UI.sheetMode() === 'settings') UI.syncAfford();
    }

    requestAnimationFrame(frame);
  }

  /* ============ boot ============ */
  function boot() {
    Flora.injectDefs();
    Icons.hydrate(document);
    FX.init();
    FX.setMagnet('coin', el.walletCredits);

    const info = Game.load();
    if (!S.seen.plot) el.game.classList.add('onboard');
    Sound.prefs.sfx = S.prefs.sfx;
    Sound.prefs.music = S.prefs.music;

    buildClouds();
    updateSky();
    buildGarden();
    sizeGarden();
    if (window.ResizeObserver) new ResizeObserver(sizeGarden).observe($('.stage'));
    renderRail();
    renderQuestStrip();
    Object.values(counters).forEach((c) => { c.disp = c.get(); c.node.textContent = fmt(c.disp); });

    el.game.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && flowerBtn) lookAt(e.clientX, e.clientY);
    });
    window.addEventListener('resize', () => { sizeGarden(); placeCoach(); });
    window.addEventListener('orientationchange', () => setTimeout(sizeGarden, 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden) Game.saveNow(); });
    window.addEventListener('pagehide', () => Game.saveNow());
    // unlock audio on the very first interaction
    const unlock = () => { Sound.init(); Sound.setSfx(S.prefs.sfx); Sound.setMusic(S.prefs.music); Sound.resume(); };
    window.addEventListener('pointerdown', unlock, { once: true });

    /* After the coach mark, never over it — a returning player who has not planted yet is being
       onboarded, and the scene would land on top of that. */
    const awayReport = Game.reconcile();
    UI.setAwayReport(awayReport);
    if (awayReport && S.seen.plot) {
      setTimeout(() => {
        UI.openSheet('welcome');
        Sound.play('open');
      }, 900);
    }

    setTimeout(() => {
      if (info.migrated) {
        toast({ title: 'Progress restored', body: 'Your old garden came along', art: Icons.get('sprout') });
      }
      say('greet', true);
    }, 700);

    if (info.decorRefund) {
      const r = info.decorRefund;
      const parts = [];
      if (r.credits) parts.push(`${fmt(r.credits)} coins`);
      if (r.gems) parts.push(`${fmt(r.gems)} gems`);
      setTimeout(() => {
        toast({
          title: 'Decor is just for show now',
          body: `Refunded ${parts.join(' and ')} for what you paid.`,
          art: Icons.get('decor'),
          ms: 3600
        });
      }, info.migrated ? 1500 : 700);
    }

    if (info.progressionGrant) {
      const delay = (info.migrated ? 1500 : 700) + (info.decorRefund ? 1600 : 0);
      setTimeout(() => {
        toast({
          title: 'The garden remembers you',
          body: 'Your seeds and plots are still yours. Reputation now tracks how far you\'ve come.',
          art: Icons.get('sprout'),
          ms: 3600
        });
      }, delay);
    }

    if (info.ticketGrant) {
      const delay = (info.migrated ? 1500 : 700)
        + (info.decorRefund ? 1600 : 0)
        + (info.progressionGrant ? 1600 : 0);
      setTimeout(() => {
        toast({
          title: 'Tickets became gems',
          body: `Converted ${fmt(info.ticketGrant.tickets)} tickets into ${fmt(info.ticketGrant.gems)} gems.`,
          art: Icons.get('gem'),
          ms: 3600
        });
      }, delay);
    }

    if (info.almanacGrant) {
      const delay = (info.migrated ? 1500 : 700)
        + (info.decorRefund ? 1600 : 0)
        + (info.progressionGrant ? 1600 : 0)
        + (info.ticketGrant ? 1600 : 0);
      const paid = info.almanacGrant.paid;
      const last = paid[paid.length - 1];
      setTimeout(() => {
        toast({
          title: 'The Almanac caught up',
          body: `${last.at} species already grown — collection rewards are waiting.`,
          art: Icons.get('book'),
          ms: 3600
        });
        renderRail();
        renderQuestStrip();
      }, delay);
    }

    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  UI.toast = toast;
  UI.showBanner = showBanner;
  UI.buildGarden = buildGarden;

  boot();
})();

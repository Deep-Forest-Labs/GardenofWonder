/* Garden Wonder — presentation, input and glue. */

(() => {
  const { $, $$, S, el, fmt, fmtTime } = UI;

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

  function noteActivity() {
    idleSince = Date.now() / 1000;
  }

  function say(bucket, force) {
    const lines = FLOWER_LINES[bucket] || FLOWER_LINES.idle;
    sayText(lines[(Math.random() * lines.length) | 0], force);
  }

  /* The same bubble and the same cooldown, for lines that live somewhere other
     than FLOWER_LINES — a creature's, for instance. */
  function sayText(text, force) {
    const now = Date.now() / 1000;
    if (!text) return;
    if (!el.coach.hidden) return; // don't stack a bubble on top of a coach mark
    if (!force && now - lastSpeech < 3.2) return;
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


  el.critterYard.addEventListener('pointerdown', (e) => {
    const node = e.target.closest('[data-critter]');
    if (!node) return;
    e.preventDefault();
    noteActivity();
    tapCritter(node.dataset.critter);
  }, { passive: false });

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

  /* ============ banners ============ */
  function showBanner(title, sub, ms = 2200) {
    el.banner.innerHTML = `<div class="bg"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
    el.banner.classList.remove('out');
    el.banner.classList.add('show');
    setTimeout(() => {
      el.banner.classList.add('out');
      setTimeout(() => el.banner.classList.remove('show', 'out'), 400);
    }, ms);
  }

  /* ============ main loop ============ */
  let last = performance.now();
  let comboAcc = 0;
  let railAcc = 0;
  let slowAcc = 0;

  /* ============ creatures ============ */

  /* Fixed spots along the lawn, so a creature keeps its place between renders
     rather than jumping about whenever the yard is rebuilt. */
  const CRITTER_SPOTS = [18, 78, 40, 62];
  const critterEls = new Map();

  function buildCritter(def, spot) {
    const node = document.createElement('button');
    node.className = 'critter';
    node.type = 'button';
    node.dataset.critter = def.id;
    node.style.setProperty('--x', spot + '%');
    node.setAttribute('aria-label', `${def.name}, a ${def.species}`);
    node.innerHTML = `
      <span class="critter-motes">${Critters.motes(3, def.art.glow)}</span>
      ${Critters.draw(def)}
      <span class="critter-gift" hidden>${Icons.get('gem')}</span>
      <span class="critter-leaf" hidden>${Icons.get('sprout')}</span>`;
    return node;
  }

  function renderCritters() {
    const home = Game.crittersHome();
    home.forEach((def, i) => {
      let node = critterEls.get(def.id);
      if (!node) {
        node = buildCritter(def, CRITTER_SPOTS[i % CRITTER_SPOTS.length]);
        critterEls.set(def.id, node);
        el.critterYard.appendChild(node);
        // Arrive with a hop rather than simply existing.
        requestAnimationFrame(() => node.classList.add('here'));
      }
      const waiting = Game.keepsakesWaiting(def.id);
      const gift = node.querySelector('.critter-gift');
      // Visibility belongs to `hidden`, never to a keyframe — an element that
      // only exists once an animation has run is uncollectable wherever the
      // animation does not play.
      if (gift.hidden === (waiting > 0)) gift.hidden = waiting <= 0;
      node.classList.toggle('has-gift', waiting > 0);
      const leaf = node.querySelector('.critter-leaf');
      const tending = Game.critterTending(def.id);
      if (leaf.hidden === tending) leaf.hidden = !tending;
    });
    critterEls.forEach((node, id) => {
      if (home.some((d) => d.id === id)) return;
      node.remove();
      critterEls.delete(id);
    });
  }

  function critterLine(def, mood) {
    const lines = (def.lines && def.lines[mood]) || [];
    return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
  }

  function tapCritter(id) {
    const def = Game.critterById(id);
    if (!def) return;
    const node = critterEls.get(id);
    if (node) { node.classList.remove('bop'); void node.offsetWidth; node.classList.add('bop'); }

    const got = Game.collectKeepsakes(id);
    if (got) {
      Sound.play('quest');
      if (node) {
        const c = FX.centerOf(node);
        FX.sparks(c.x, c.y, 14, def.art.glow);
        FX.stars(c.x, c.y, 5, def.art.accent);
        FX.float(c.x, c.y - 18, `×${got.count} ${got.name}`, 'good');
      }
      toast({
        title: `${def.name} left you something`,
        body: `${got.count} × ${got.name}`,
        art: Critters.draw(def),
        kind: 'gem'
      });
      sayText(critterLine(def, 'gift'), true);
      popWallet('credits');
      if (got.gems) popWallet('gems');
      renderCritters();
      return;
    }
    Game.petCritter(id);
    Sound.play('tap');
    FX.haptic(8);
    sayText(critterLine(def, 'pet'));
  }

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
      renderCritters();
      updateDockDots();
      refreshCoach();
      UI.updateSky();
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

    UI.buildClouds();
    UI.updateSky();
    // processWeather() suppresses the `weather` event for the first slot it sees,
    // and that event is the only thing that calls paintWeather() — so without
    // this, a page opened during rain or a storm renders a clear sky until the
    // slot rolls over. Roughly a quarter of slots are not clear.
    UI.paintWeather(Game.currentWeather());
    // Roll a capped creature's clock forward once, so time away it could never
    // have banked does not sit there pretending to still be accruing.
    Game.settleCritters();
    buildGarden();
    renderCritters();
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
  UI.say = say;
  UI.faceReact = faceReact;
  UI.popWallet = popWallet;
  UI.renderQuestStrip = renderQuestStrip;
  UI.renderRail = renderRail;
  UI.hideCoach = hideCoach;
  UI.noteActivity = noteActivity;
  UI.plotEls = plotEls;
  /* A function, not the node: buildGarden() throws the flower away and makes a new one. */
  UI.flowerBtn = () => flowerBtn;
  UI.sayText = sayText;
  UI.renderCritters = renderCritters;
  UI.tapCritter = tapCritter;

  boot();
})();

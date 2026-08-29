/* Garden Wonder — presentation, input and glue. */

(() => {
  const { $, $$, S, el, fmt, fmtTime, pickLine } = UI;

  /* ============ garden ============ */
  const plotEls = [];
  let flowerBtn = null;
  let guestFlower = null;   // a flower standing in some other room
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

  /* The one number the whole layout hangs off: how tall the window actually is.
     CSS reads it as `min-height` on `.game`, alongside the browser's own
     `inset: 0`, and the box is whichever of the two is taller.

     It is the window, and ONLY the window. On 2026-08-20 this also consulted
     `screen`, on the theory that an installed app's window IS the screen and a
     short `innerHeight` had to be WebKit under-reporting. Shipped to a real
     iPhone, it pushed the dock clean off the bottom: the window there is
     genuinely shorter than the screen, iOS paints the strip below it, and no
     amount of CSS reaches into ground the window does not own. `innerHeight` was
     telling the truth all along. **Never stretch the game past the window** —
     a band of lawn under the dock is a blemish, a dock nobody can tap is a dead
     app. The strip is handled by making it invisible instead: the page is the
     same flat meadow green iOS fills it with, and nothing draws a dark edge
     along the join. See 08-ui-and-layout.md.

     `clientHeight` is in the max because the two disagree on some browsers, and
     both describe the same window. Deliberately NOT visualViewport.height —
     that shrinks for the keyboard and for pinch-zoom, and the scenery must not
     resize under either. */
  function sizeViewport() {
    const h = Math.max(
      Math.round(window.innerHeight || 0),
      Math.round(document.documentElement.clientHeight || 0)
    );
    if (h > 0) document.documentElement.style.setProperty('--app-h', h + 'px');
  }

  /** Keep the board a perfect square that fills whatever the stage row offers,
      less the strip reserved for the creature yard beneath it. */
  function sizeGarden() {
    const st = $('.stage');
    const r = st.getBoundingClientRect();
    const yard = el.critterYard ? el.critterYard.getBoundingClientRect().height : 0;
    const s = Math.max(150, Math.floor(Math.min(r.width, r.height - yard)));
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
        /* Two different refusals, two different labels. "Lv 3" on a plot the
           Turn is holding is the wrong sentence, and it is the one a fresh save
           sees on plots 5-8 all through year one. */
        const gate = Game.plotGate(i);
        const gated = gate !== '';
        if (c.gated !== gate) {
          v.root.dataset.gated = gated ? '1' : '0';
          if (gate === 'turn') {
            v.costWrap.textContent = `Turn ${DATA.year.plotTurnGate}`;
            v.cost = null;
          } else if (gate === 'level') {
            v.costWrap.textContent = `Lv ${Game.plotUnlockLevel(i)}`;
            v.cost = null;
          } else {
            v.costWrap.innerHTML = `${Icons.get('coin')}<span></span>`;
            v.cost = $('span', v.costWrap);
          }
          c.gated = gate;
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

  /* The meadow is the one room with no visible entrance: the Hollow's creatures
     are standing in the garden whether or not you ever find the swipe, but a
     player who never swipes up never learns the meadow exists at all. So the
     flower names it once, on the first idle line after the tutorial is done.
     One line, one save flag, and then it goes back to chatting. */
  function idleNudge(now2) {
    if (!S.seen.meadow && S.seen.plot) {
      S.seen.meadow = true;
      Game.save();
      sayText('Swipe up sometime — the wild meadow is out that way.', true);
      return;
    }
    say('idle');
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
    // Whichever flower is actually on screen — it reacts wherever it stands.
    const face = guestFlower || flowerBtn;
    if (!face) return;
    face.classList.remove('bounce');
    void face.offsetWidth;
    face.classList.add('bounce');
    face.classList.toggle('squint', mood === 'crit');
    face.classList.toggle('happy', mood === 'happy');
    const mouth = $('.tf-mouth-path', face);
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
        face.classList.remove('squint');
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
    const onDown = (e) => {
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
    };
    const wire = (node) => {
      if (!node) return;
      node.addEventListener('pointerdown', onDown, { passive: false });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) => {
        node.addEventListener(evt, stopHold);
      });
    };
    wire(flowerBtn);

    /* The flower is the game's voice AND its core verb, and it now stands in
       more than one room. A place with its own flower hands it over here, so a
       tap pays exactly what it pays in the garden — the same loop, reachable
       everywhere, not a second minigame. `flowerBtn()` is what every tap effect
       centres on, so this is also what makes the coins, the crit ring and the
       face reaction fire in the right place. */
    UI.bindFlower = (node) => {
      stopHold();
      if (node && !node.dataset.wired) {
        node.dataset.wired = '1';
        wire(node);
      }
      guestFlower = node || null;
    };
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

  /* The flower's answer before the first Turn. Deliberately no numbers: it is
     a promise, not a readout, and it is the only thing year one says about the
     Turn until the meter is full. Three lines so a curious player who taps
     twice does not get the same one back. */
  const MYSTERY_LINES = [
    'Something\u2019s filling up. I don\u2019t know what yet.',
    'It fills a little every time you grow something.',
    'When it\u2019s full, I\u2019ll know what to do with it.'
  ];

  /* ============ the year meter ============ */
  /* The pill's fill is how close the Turn is, which means it has to show the
     BINDING gate — the Turn needs both the un-tallied increment and the year's
     earnings, so a bar that showed only one would sit full while the other held
     the ceremony shut. Recomputed on the slow tick, not per frame:
     projectedMint() walks the whole Tally table and nothing here changes at
     60fps. */
  function yearProgress() {
    const y = DATA.year;
    const mint = Game.projectedMint();
    const seeds = y.minSeeds > 0 ? mint.base / y.minSeeds : 1;
    const coins = y.minCoins > 0 ? S.year.coinsEarned / y.minCoins : 1;
    /* TWO different progresses, and they are not the same question.
       The PILL answers "can I turn yet", so it shows the binding gate — a bar
       tracking only one of the two would sit full while the other held the
       ceremony shut. But the gates are both met about a quarter of the way
       through year one, so the same number makes a poor SEASON clock: the
       garden would finish ripening on day one and never move again. The tint
       runs on the year's own earnings instead. */
    const ripe = y.seasonSpan > 0 ? S.year.coinsEarned / y.seasonSpan : 0;
    return {
      mint, seeds, coins,
      p: Math.max(0, Math.min(1, Math.min(seeds, coins))),
      ripe: Math.max(0, Math.min(1, ripe))
    };
  }

  let yearFillShown = -1;
  let pouchShown = -1;
  /* Published so the scenery can tint `theme-color` by the same amount — the
     status-bar strip has to match the sky under it. */
  let seasonAmount = 0;
  /* Since phase 3.5 the meter is the dock's Turn button rather than a HUD pill:
     same number, same binding gate, more room. The fill rises from the bottom
     because a button has 56px of height to travel where the pill had 39px of
     width. */
  function updateYearMeter() {
    const { p, ripe } = yearProgress();
    const pct100 = Math.round(p * 1000) / 10;
    if (pct100 !== yearFillShown) {
      el.yearFill.style.height = `${pct100}%`;
      yearFillShown = pct100;
    }
    el.turnBtn.classList.toggle('ready', Game.turnReady());
    /* The pouch, promoted to an always-visible surface for the first time — and
       never in year one, where doc 32's rule is that the meter fills with no
       numbers on it at all. */
    const showPouch = (S.year.turnsCompleted >= 1 || S.savedSeeds > 0) ? Math.floor(S.savedSeeds) : -1;
    if (showPouch !== pouchShown) {
      pouchShown = showPouch;
      el.pouchChip.hidden = showPouch < 0;
      if (showPouch >= 0) el.pouchChip.innerHTML = `${Icons.get('pouch')}${fmt(showPouch)}`;
    }
    /* The garden golds as the year fills. Derived, never stored — doc 32 is
       explicit that the season aging is visual only. */
    el.seasonTint.style.setProperty('--season-c', DATA.year.seasonTint);
    seasonAmount = DATA.year.seasonTintMax * ripe;
    el.seasonTint.style.setProperty('--season-o', seasonAmount.toFixed(3));
    /* An open Year panel keeps answering while the meter behind it fills. */
    if (UI.sheetMode() === 'year') UI.renderSheet();
  }

  function popWallet(name) {
    const c = counters[name];
    if (!c) return;
    c.wallet.classList.remove('pop');
    void c.wallet.offsetWidth;
    c.wallet.classList.add('pop');
  }

  /* ============ rail chips ============ */
  /* THE RAIL LOST ITS SHOP AND KEPT ITS CLOCK (phase 3.5). Spending a boost is
     the band's POWER-UP button now; what is left here is the countdown of
     whatever is already running, plus the Wonder. It is `:empty{display:none}`,
     so most of the time it costs nothing at all. */
  function renderRail() {
    const now = Game.nowSeconds();
    let html = '';
    DATA.boosters.forEach((b) => {
      if (!Game.activeBoost(b.id)) return;
      const remain = Math.max(0, S.boosters[b.id] - now);
      const p = Math.max(0, Math.min(1, remain / b.dur));
      html += `<div class="chip timed" style="--tint:${b.tint}">
        <span class="ring" style="--p:${p.toFixed(3)}"><i>${Math.ceil(remain) > 99 ? fmtTime(remain) : Math.ceil(remain)}</i></span>
        <span>${b.name}</span></div>`;
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

  /* ============ the power-up button ============ */
  /* One held boost at a time, chosen at random, with a badge counting the whole
     inventory. The eligible pool is held AND NOT ALREADY RUNNING: activateBoost
     refuses to re-arm a live boost and returns false, so a slot seated from
     held-alone would eventually hold a boost whose tap does nothing and the
     button would read as broken.

     The seat is sticky while it stays eligible — re-rolling every 0.25s tick
     would make the button flicker between four glyphs, and a control that
     changes what it does while you reach for it is worse than a slow one. */
  let powerSeat = '';
  function eligibleBoosts() {
    return DATA.boosters.filter((b) => ((S.boostInv && S.boostInv[b.id]) || 0) > 0 && !Game.activeBoost(b.id));
  }
  function renderPowerUp() {
    const pool = eligibleBoosts();
    if (!pool.some((b) => b.id === powerSeat)) {
      powerSeat = pool.length ? pool[(Math.random() * pool.length) | 0].id : '';
    }
    const held = DATA.boosters.reduce((n, b) => n + ((S.boostInv && S.boostInv[b.id]) || 0), 0);
    const def = powerSeat && DATA.boosters.find((b) => b.id === powerSeat);
    const sig = `${powerSeat}|${held}`;
    if (el.btnPower.dataset.sig === sig) return;
    el.btnPower.dataset.sig = sig;
    el.btnPower.classList.toggle('empty', !def);
    el.btnPower.dataset.boost = def ? def.id : '';
    el.btnPower.style.setProperty('--tint', def ? def.tint : 'transparent');
    el.btnPower.setAttribute('aria-label', def ? `Use ${def.name}` : 'Power-up');
    el.btnPower.innerHTML = def
      ? `${Icons.get(def.icon)}${held > 1 ? `<span class="f-count">${held}</span>` : ''}`
      : Icons.get('bolt');
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


  /* The vertical ladder: the MEADOW above, the garden here, the HOLLOW below.

     The old rule was the map's — up goes in, down pulls the camera back — and it
     died with the map. What is left is the picture: the Hollow is a burrow under
     the garden and the meadow is up the lane, so DOWN goes under and UP goes out.
     A room's own exit is the opposite of the swipe that got you there.

     There is no longer a labelled door for either. That is deliberate (the
     owner's call at the phase-3.5 gate) and the gesture is what a player is meant
     to learn — but it also means the meadow has no visible entrance at all, so
     the flower names it once, on the first Summer after the meadow is reachable.

     It only starts on the BACKGROUND — sky, lawn, the margins. Plots and the
     flower act on `pointerdown` and have already fired by the time a drag is
     recognisable, so a swipe begun on one would plant or harvest on its way out.
     Making them wait for `pointerup` instead would fix that and cost the tap
     latency the whole core loop is built on, which is a far worse trade. */
  const NAV_SWIPE = 70;
  const noSwipe = '.plot,.fl-plot,.flower-btn,.dock,.rail,.quest-strip,.hud,.sheet,.scrim,[data-critter],.coach,.s-edge,.g-back,.year-pop';
  let navY0 = null;
  let navX0 = null;
  let navId = null;
  el.game.addEventListener('pointerdown', (e) => {
    navY0 = null;
    navId = null;
    if (UI.hollowOpen() || UI.mapOpen() || UI.meadowOpen() || UI.sheetMode()) return;
    if (e.target.closest(noSwipe)) return;
    navY0 = e.clientY;
    navX0 = e.clientX;
    navId = e.pointerId;
  });
  /* A cancelled gesture must not leave an origin behind for the next release to
     measure against. */
  el.game.addEventListener('pointercancel', () => { navY0 = null; navId = null; });
  el.game.addEventListener('pointerup', (e) => {
    if (navY0 === null) return;
    /* ONLY the finger that started it. Without this, a second thumb landing
       anywhere overwrote the origin and the first thumb's release measured the
       distance between them — a two-thumb tap on the flower changed season. */
    if (navId !== null && e.pointerId !== navId) return;
    const dy = navY0 - e.clientY;
    const dxs = e.clientX - navX0;
    const dx = Math.abs(dxs);
    navY0 = null;
    /* Horizontal is time, and it mirrors the vertical gesture rule for rule:
       it only starts on the background (plots and the flower fire on
       pointerdown and would plant on the way out), it needs the same ~70px, and
       it has to be clearly horizontal or a diagonal would navigate. Swiping
       LEFT drags the world left, which brings the season on the right into
       view — the same direction a scroll would move it. */
    if (dx > NAV_SWIPE && dx > Math.abs(dy)) {
      noteActivity();
      stepSeason(dxs < 0 ? 1 : -1);
      return;
    }
    // Vertical, and clearly so — a diagonal drag should not navigate.
    if (Math.abs(dy) <= NAV_SWIPE || Math.abs(dy) <= dx) return;
    /* The vertical ladder hangs off SUMMER only — that is doc 32's diagram, and
       the Hollow is under the garden rather than under the year. Allowing it
       from Fall would also desync the two navigators: the map would return the
       player "to the garden" while `.in-fall` still had Fall's board in the
       stage. */
    /* The ladder hangs off SUMMER only — and a gate is held in `gateOn` while
       `season` is still whatever it was, so testing the season alone let a
       vertical swipe fire from a gate screen and leave two place-states on at
       once. */
    if (gateOn || season !== 'summer') return;
    noteActivity();
    if (dy > 0) UI.enterMeadow();
    else UI.enterHollow();
  });

  el.critterYard.addEventListener('pointerdown', (e) => {
    const node = e.target.closest('[data-critter]');
    if (!node) return;
    e.preventDefault();
    noteActivity();
    tapCritter(node.dataset.critter);
  }, { passive: false });

  /* THE BAND. Upgrades on the left, one held boost on the right.

     Spending goes through Game.activateBoost, which brings the whole
     confirmation package with it for free — the purchase event plays the boost
     sound, buzzes 14ms and toasts the booster's own name and icon. Nothing else
     needs writing; the local sparks are the only addition. */
  el.btnUpgrade.addEventListener('click', () => {
    Sound.resume();
    noteActivity();
    if (UI.sheetMode() === 'upgrades') UI.closeSheet();
    else UI.openSheet('upgrades');
  });
  el.btnPower.addEventListener('click', () => {
    Sound.resume();
    noteActivity();
    const id = el.btnPower.dataset.boost;
    /* Empty is a promise, not a dead control: it says where boosts come from
       rather than doing nothing at all. */
    if (!id) {
      Sound.play('deny');
      toast({
        title: 'Nothing loaded yet',
        body: 'Power-ups come from quests and from levelling up.',
        art: Icons.get('bolt')
      });
      return;
    }
    if (Game.activateBoost(id)) {
      const c = FX.centerOf(el.btnPower);
      FX.sparks(c.x, c.y, 12, '#ffe066');
      FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
      /* The seat empties the instant it is spent, so the next held boost takes
         its place and "a running boost cannot be refreshed" stays true by
         construction rather than by a check. */
      powerSeat = '';
      renderPowerUp();
      renderRail();
    }
  });

  el.dock.addEventListener('click', (e) => {
    const b = e.target.closest('.dock-btn');
    if (!b) return;
    Sound.resume();
    const tab = b.dataset.tab;
    /* GARDEN is not a panel — it is the way home, from anywhere. It closes any
       open sheet, leaves whichever room you are standing in, and puts Summer's
       board back in the stage. It is the one button that always does something,
       which is why it is the one that reads as *play*. */
    if (tab === 'garden') {
      UI.closeSheet();
      if (UI.hollowOpen()) UI.exitHollow();
      if (UI.meadowOpen()) UI.leaveMeadow();
      goSeason('summer');
      return;
    }
    if (UI.sheetMode() === tab) UI.closeSheet();
    else UI.openSheet(tab);
  });

  $('#btnSettings').addEventListener('click', () => UI.openSheet('settings'));
  $('#btnDev').addEventListener('click', () => UI.openSheet('dev'));
  el.seasonEdges.addEventListener('click', (e) => {
    const b = e.target.closest('[data-season]');
    if (b) goSeason(b.dataset.season);
  });
  el.gateLayer.addEventListener('click', (e) => {
    if (e.target.closest('[data-gateback]')) { hideGate(); Sound.play('close'); }
  });
  $('#btnBonuses').addEventListener('click', () => UI.openSheet('bonuses'));
  el.questStrip.addEventListener('click', () => {
    Sound.resume();
    const id = el.questStrip.dataset.claim;
    if (id) Game.claimQuest(id);
    else UI.openSheet('quests');
  });

  /* ============ the season strip ============

     Horizontal is time. Four gardens in the order of the year, and the player
     swipes between them — SPRING <- SUMMER -> FALL -> WINTER. Summer is home
     and the app opens there.

     A season is reachable when its Turn has passed AND its garden exists.
     Winter and Spring are slices C and E, so they are turn-gated in data and
     unbuilt in code; their gate says which of the two is holding it, because
     "Opens at Turn 3" shown to a player on Turn 5 is a lie. */
  const SEASONS = [
    { id: 'spring', name: 'SPRING', gate: 'springTurn', built: false },
    { id: 'summer', name: 'SUMMER', gate: null, built: true },
    { id: 'fall', name: 'FALL', gate: 'fallTurn', built: true },
    { id: 'winter', name: 'WINTER', gate: 'winterTurn', built: false }
  ];
  const SEASON_SKY = {
    spring: ['#bfe0f5', '#e6f3d8'], summer: ['#7ec8f2', '#e9f8ff'],
    fall: ['#8fbfd8', '#ffe3bd'], winter: ['#9fb6cc', '#eef4f8']
  };
  let season = 'summer';
  let gateOn = '';

  const seasonIdx = (id) => SEASONS.findIndex((x) => x.id === id);
  const seasonTurned = (sdef) => !sdef.gate || S.year.turnsCompleted >= DATA.year[sdef.gate];
  const seasonReady = (sdef) => sdef.built && seasonTurned(sdef);

  function stepSeason(dir) {
    const i = seasonIdx(gateOn || season);
    const next = SEASONS[i + dir];
    if (!next) { FX.shake(3); return; }
    goSeason(next.id);
  }

  function goSeason(id) {
    const sdef = SEASONS[seasonIdx(id)];
    if (!sdef) return;
    hideGate();
    if (!seasonReady(sdef)) { showGate(sdef); return; }
    if (id === 'fall') {
      if (season !== 'fall') { season = 'fall'; UI.enterFall(); }
    } else {
      if (season === 'fall') UI.leaveFall();
      season = 'summer';
    }
    renderSeasonEdges();
  }

  /* ---------- the gate ---------- */
  function showGate(sdef) {
    gateOn = sdef.id;
    const [sky1, sky2] = SEASON_SKY[sdef.id] || SEASON_SKY.summer;
    const why = seasonTurned(sdef)
      ? 'Still growing in'
      : `Opens at Turn ${DATA.year[sdef.gate]}`;
    el.gateLayer.innerHTML = `
      <div class="g-sky" style="background:linear-gradient(180deg,${sky1},${sky2})"></div>
      <div class="g-leaf" style="left:22%;animation-delay:-3s">${Icons.get('leaf')}</div>
      <div class="g-leaf" style="left:68%;animation-delay:-8s">${Icons.get('leaf')}</div>
      <div class="g-hedge">${[false, true].map((f) => UI.hedge(f)).join('')}</div>
      <div class="g-plate">
        <div class="g-lock">${Icons.get('lock')}</div>
        <div class="g-name outlined">${sdef.name}</div>
        <span class="chip">${Icons.get('pouch')}${why}</span>
      </div>
      <button class="g-back" data-gateback="1">${Icons.get('sprout')}Back to the garden</button>`;
    el.gateLayer.hidden = false;
    el.game.classList.add('in-gate');
    UI.hideCoach();
    Sound.play('open');
  }
  function hideGate() {
    if (!gateOn) return;
    gateOn = '';
    el.gateLayer.hidden = true;
    el.gateLayer.innerHTML = '';
    el.game.classList.remove('in-gate');
  }

  /* ---------- the edges ----------
     A labelled thing you can tap beside a gesture that does the same, which is
     exactly how the burrow door teaches the vertical swipe. A locked edge wears
     the drained paper and the turn that opens it, so a gate is a promise you
     can read from here without walking to it. */
  /* Fall is an appointment, and an appointment needs a bell. Anything ripe or
     still owed a windfall puts a dot on the edge tab — the same attention-dot
     idea the dock already uses, which is how a player learns a room is worth
     opening without being nagged. */
  function seasonWaiting(id) {
    if (id !== 'fall' || !Game.fallOpen()) return false;
    const now = Date.now() / 1000;
    return ((S.fall && S.fall.grid) || []).some((c) =>
      c && c.seed && (c.windfall || now >= c.plantedAt + c.grow));
  }

  let edgeSig = '';
  function renderSeasonEdges() {
    const here = seasonIdx(season);
    const sides = [['l', SEASONS[here - 1]], ['r', SEASONS[here + 1]]];
    const html = sides.map(([side, sdef]) => {
      if (!sdef) return '';
      const ready = seasonReady(sdef);
      /* The tab says which of the two gates is holding it, exactly as the gate
         screen does. Without the second case a season whose Turn has passed but
         whose garden is unbuilt rendered as a bare padlock with no label at
         all — a lock the player can never act on and cannot tell apart from one
         they can. Winter's turn passes around day 2.3 of play, so that state is
         reached quickly rather than theoretically. */
      const why = !seasonTurned(sdef) ? `Turn ${DATA.year[sdef.gate]}`
        : (!sdef.built ? 'Soon' : '');
      const turn = why ? `<span class="turn">${why}</span>` : '';
      const dot = seasonWaiting(sdef.id) ? '<span class="s-dot"></span>' : '';
      return `<button class="s-edge ${side}${ready ? '' : ' locked'}" data-season="${sdef.id}"
        aria-label="${ready ? 'Go to' : 'Look at'} ${sdef.name}">
        ${ready ? '' : Icons.get('lock')}<span class="w">${sdef.name}</span>${turn}${dot}</button>`;
    }).join('');
    /* Compared against a signature first, like the rail: this runs on the slow
       tick and rewriting identical HTML four times a second thrashes the DOM. */
    if (html === edgeSig) return;
    edgeSig = html;
    el.seasonEdges.innerHTML = html;
  }

  /* ============ plot input ============ */
  function onPlotTap(idx, node) {
    Sound.resume();
    const cell = S.grid[idx];
    if (cell.locked) {
      const gate = Game.plotGate(idx);
      if (gate) {
        const c = FX.centerOf(node);
        FX.float(c.x, c.y, gate === 'turn'
          ? (DATA.year.plotTurnGate === 1 ? 'After your first Turn' : `After Turn ${DATA.year.plotTurnGate}`)
          : `Level ${Game.plotUnlockLevel(idx)}`, '');
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
    /* A face is waiting and you can already fill their order — the one signal
       that should pull a player back into planting something specific. */
    /* The world button carries every place's attention: an order you can fill,
       or jars waiting in the meadow. */
    const canGive = Game.standOrders().some((o) => Game.standCanDeliver(o));
    /* `stripQuest()` is the engine's own "what is in front of the player right
       now" — the same call the quest strip uses, so the dot and the strip can
       never disagree about whether something is claimable. */
    const q = Game.stripQuest();
    const canClaim = Boolean(q && q.complete);
    /* Re-pointed for the Big Five. Craft has no button of its own any more, so
       its dot folds into Shop's — a player who can brew learns it by opening
       Shop, which is one tab pill away from the bench. `canHive` is the meadow's
       jars, and the meadow has no button either; it is deliberately unhomed and
       recorded in docs/11 rather than hidden inside another dot. */
    const map = {
      orders: canGive || canClaim,
      album: S.packs > 0,
      year: Game.turnReady(),
      shop: canDecor || canBrew
    };
    $$('.dock-btn', el.dock).forEach((b) => {
      const dot = $('.dock-dot', b);
      if (!dot) return;
      const show = map[b.dataset.tab] && UI.sheetMode() !== b.dataset.tab;
      dot.hidden = !show;
    });
    /* The band's UPGRADE pill carries the same dot on the same rule — the first
       time the attention-dot idea has reached a control that is not a dock tab. */
    const upDot = $('.dock-dot', el.btnUpgrade);
    if (upDot) upDot.hidden = !(canUpgrade && UI.sheetMode() !== 'upgrades');
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
  /* Phase 3.5: the crowd comes in off the edges, because the band's two
     floating buttons now stand at 34px in from each side. The old 80% spot put
     the second creature squarely behind the POWER-UP button. */
  const CRITTER_SPOTS = [32, 68, 44, 56];
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

  /* Only tending creatures stand in the yard. Resting ones are still home and
     still in the Almanac roster — they are just not on screen, because four is
     the most the lawn can hold before it reads as clutter. */
  function renderCritters() {
    const home = Game.crittersTending();
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
      /* Sleeping creatures stay on screen. Vanishing would be the "something
         was taken away" feeling coming back in through the side door, and a
         dozing pet is the reminder to feed it. */
      const asleep = Game.critterAsleep(def.id);
      if (node.classList.contains('asleep') !== asleep) node.classList.toggle('asleep', asleep);
      // A grown creature glows brighter, so its star reads off the art itself
      // rather than only out of a panel. It reads the star the creature is
      // *working* at, so a well-fed one is visibly brighter in the garden
      // without needing a badge of its own.
      const lvl = Game.critterWorkLevel(def.id);
      if (node.dataset.level !== String(lvl)) {
        node.dataset.level = String(lvl);
        node.style.setProperty('--lvl', (0.7 + lvl * 0.16).toFixed(2));
      }
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
    /* Nothing to collect, so the tap opens everything you can do with this one
       instead. Walking down to the Hollow to feed a creature that is standing
       right in front of you was the long way round. */
    UI.openSheet('critter', id);
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
      if (now2 - idleSince > 26 && !UI.sheetMode()) { idleNudge(now2); idleSince = now2; }
    }
    const cp = S.tap.combo / S.tap.comboMax;
    comboRing.style.setProperty('--combo', cp.toFixed(3));
    comboRing.style.setProperty('--combo-op', (0.3 + cp * 0.7).toFixed(2));

    railAcc += dt;
    if (railAcc >= 0.25) { railAcc = 0; renderRail(); renderPowerUp(); UI.tickSheetTimers(); }

    slowAcc += dt;
    if (slowAcc >= 0.6) {
      slowAcc = 0;
      if (UI.mapOpen()) UI.renderMap();
      else if (UI.meadowOpen()) UI.renderMeadow();
      else if (UI.hollowOpen && UI.hollowOpen()) UI.renderHollow();
      else renderCritters();
      updateDockDots();
      updateYearMeter();
      if (UI.fallOpen && UI.fallOpen()) UI.renderFall();
      renderSeasonEdges();
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
    UI.initFall();
    renderSeasonEdges();
    renderCritters();
    sizeViewport();
    /* iOS reports a short window while the launch animation is still running and
       then never fires `resize`, so keep asking over the first second — and lay
       the garden out again when the answer changes. */
    [80, 250, 600, 1200].forEach((t) => setTimeout(() => {
      sizeViewport();
      sizeGarden();
    }, t));
    sizeGarden();
    if (window.ResizeObserver) new ResizeObserver(() => { sizeGarden(); if (UI.sizeFallBoard) UI.sizeFallBoard(); }).observe($('.stage'));
    renderRail();
    renderPowerUp();
    renderQuestStrip();
    Object.values(counters).forEach((c) => { c.disp = c.get(); c.node.textContent = fmt(c.disp); });

    el.game.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && flowerBtn) lookAt(e.clientX, e.clientY);
    });
    window.addEventListener('resize', () => { sizeViewport(); sizeGarden(); placeCoach(); });
    // Coming back from the app switcher is the other moment iOS hands over a
    // window it never mentioned resizing.
    window.addEventListener('pageshow', sizeViewport);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) sizeViewport(); });
    // iOS reports the pre-rotation height on the event itself, and again a beat
    // later once the safe areas have swapped — so measure twice.
    window.addEventListener('orientationchange', () => {
      sizeViewport();
      setTimeout(() => { sizeViewport(); sizeGarden(); }, 250);
    });
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
  UI.renderPowerUp = renderPowerUp;
  /* The Year panel is the projection's new home, and it lives in ui-sheet.js —
     so the two presentation helpers and the mystery voice are published here
     rather than duplicated there. `ui-sheet.js` still does no economy math:
     both of these read Game and shape the answer, exactly as they did when the
     pill owned them. */
  UI.yearProgress = yearProgress;
  UI.mysteryLine = () => pickLine(MYSTERY_LINES, String(S.stats.totalTaps || 0));
  UI.hideCoach = hideCoach;
  UI.seasonAmount = () => seasonAmount;
  /* The ceremony's gate card checks for this before it promises a swipe — a
     card may not draw an open gate onto a place that cannot be reached. */
  UI.enterSeason = goSeason;
  UI.seasonHere = () => season;
  UI.renderSeasonEdges = renderSeasonEdges;
  UI.noteActivity = noteActivity;
  UI.plotEls = plotEls;
  /* A function, not the node: buildGarden() throws the flower away and makes a new one. */
  /* Whichever flower the player can actually see. Every tap effect centres on
     this, so it has to follow them between rooms. */
  UI.flowerBtn = () => guestFlower || flowerBtn;
  UI.sayText = sayText;
  UI.renderCritters = renderCritters;
  UI.tapCritter = tapCritter;
  UI.critterLine = critterLine;

  boot();
})();

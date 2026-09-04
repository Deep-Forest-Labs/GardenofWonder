/* Garden Wonder — presentation, input and glue. */

(() => {
  const { $, $$, S, el, fmt, fmtTime, pct, pickLine } = UI;

  /* ============ garden ============ */
  const plotEls = [];
  let flowerBtn = null;
  let guestFlower = null;   // a flower standing in some other room
  let speechEl = null;
  /* Summer's flower cell — the bubble's home when no other hero is on screen. */
  let speechHome = null;
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
        /* THE BUBBLE SURVIVES A REBUILD, and this is the whole reason it needs
           saying: `buildGarden()` runs again on every plot expansion, and the
           bubble may not be in this subtree when it does — `bindFlower()` moves
           the one `#speech` node into whichever hero's cell is on screen, so a
           player who buys a Land Deed while standing in Winter would otherwise
           get a SECOND `#speech`: the new one in a cell `.in-winter` has
           display:none'd (Holly goes mute) and the old one orphaned in Winter's
           cell with whatever it last said stuck to the board.

           So the fresh markup's bubble is thrown away whenever a real one
           already exists, and the survivor is put back wherever it belongs. */
        speechHome = wrap;
        const fresh = $('#speech', wrap);
        if (speechEl && speechEl !== fresh && speechEl.isConnected) {
          fresh.remove();
          if (!guestFlower) wrap.appendChild(speechEl);
        } else {
          speechEl = fresh;
        }
        comboRing = $('.combo-ring', wrap);
        wireFlower();
        continue;
      }
      const idx = cell < 4 ? cell : cell - 1;
      const b = document.createElement('button');
      b.className = 'plot';
      b.dataset.idx = idx;
      b.dataset.state = 'empty';
      /* `.wx-wet` is an opt-in hook, not a state: it rides the plot's interior
         for the life of the node and the stylesheet decides when a sky darkens
         it. Nothing here has to know what the weather is. */
      b.innerHTML = `
        <div class="plot-inner wx-wet"><div class="plant-slot"></div></div>
        <div class="empty-mark">${Icons.get('plantSpot')}</div>
        <div class="lock-badge">${Icons.get('lock')}<div class="lock-cost">${Icons.get('coin')}<span></span></div></div>
        <div class="bar"><i></i></div>
        <div class="ready-pop">!</div>
        <div class="auto-tag">Auto</div>
        <div class="lucky-badge">${Icons.get('ladybug')}</div>
        <button class="skip-chip" type="button" aria-label="Finish this plant with gems">${Icons.get('gem')}<span></span></button>
        <button class="pack-drop" type="button" aria-label="Collect a card pack">${Icons.get('cards')}</button>
        <button class="replant-chip" type="button" aria-label="Plant the same seed again">${Icons.get('sprout')}<span></span></button>`;
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
      /* `stopPropagation` is the whole reason this reads as its own control:
         the plot beneath it is itself a pointerdown button, and on an empty
         plot that button opens the seed picker — the one thing this chip
         exists so the player never has to do. */
      $('.replant-chip', b).addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onReplantTap(idx);
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
        replant: $('.replant-chip', b),
        replantNum: $('.replant-chip span', b),
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
  /* ONE square for both seasons. The swipe between them is this game's signature
     move, so the two boards have to be the same size in the same place at every
     viewport — and they were not, because each season measured its own room.

     The yard's height is read from the reservation `.stage` makes for it, never
     from the yard itself: Fall hides the creatures, so measuring the node
     returns zero there and Fall's board came out sized against a taller box than
     Summer's on any screen where height binds. The padding is the reservation
     and it is the same in both seasons, which is exactly the property wanted. */
  function boardSide() {
    const st = $('.stage');
    const r = st.getBoundingClientRect();
    const yard = parseFloat(getComputedStyle(st).paddingBottom) || 0;
    return Math.max(150, Math.floor(Math.min(r.width, r.height - yard)));
  }

  function sizeGarden() {
    const s = boardSide();
    el.garden.style.width = s + 'px';
    el.garden.style.height = s + 'px';
  }

  /* The four looks a growing flower wears, from DATA.growth — thresholds ruled
     on the stage spike, 2026-09-01. Comparisons are INCLUSIVE on purpose:
     progressOf() clamps to exactly 1 at ripeness, so `p >= bloom` fires at
     100% where `p > bloom` never would. Stage is derived from progress alone —
     never saved, and never from cell.ready, which belongs to data-state. */
  function stageOf(p) {
    const g = DATA.growth;
    if (p >= g.bloom) return 'bloom';
    if (p >= g.stem) return 'bud';
    if (p >= g.sprout) return 'stem';
    return 'sprout';
  }

  /* The wait a skip deletes. Spoken only now — it is what the `aria-label` says
     the gems buy, and the chip itself shows the price alone. The short form is
     kept because it is the same fact one word shorter, and something visible
     will want it again. */
  function skipWait(sec, spoken) {
    if (sec < 60) return spoken ? `${sec} second${sec === 1 ? '' : 's'}` : `${sec}s`;
    const m = Math.round(sec / 60);
    return spoken ? `${m} minute${m === 1 ? '' : 's'}` : `${m}m`;
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
      /* The chip shows the price and nothing else. It carried the wait too until
         2026-08-31, and on eight growing plots that was eight numbers counting
         down together inside the last minute — one chip explaining itself is
         informative, eight ticking at once is noise, and the owner overruled it
         from live play. The wait survives in the `aria-label`, where it is
         spoken on demand rather than flickering.

         So the key is the price and the afford state, which is what the visible
         chip is made of, and the countdown is out of it — the branch stops
         firing once a second per plot. The price steps once every thirty
         seconds, so the spoken wait refreshes on the same quantum the price is
         quoted in.

         The afford state has to stay in the key. It used to hang off the price
         alone, so a chip greyed out at 3 gems stayed grey after a gem drop until
         the price happened to tick — a number a purchase changes, not updating
         when it changed. */
      const skip = state === 'grow' ? Game.skipSaving(i) : null;
      const skipGems = skip ? skip.gems : 0;
      const skipOk = skipGems && S.gems >= skipGems ? 'ok' : 'no';
      if (c.skipGems !== skipGems || c.skipOk !== skipOk) {
        c.skipGems = skipGems;
        c.skipOk = skipOk;
        if (skipGems) {
          v.skipNum.textContent = fmt(skipGems);
          v.skip.setAttribute('aria-label',
            `Finish now for ${fmt(skipGems)} gem${skipGems === 1 ? '' : 's'}, saving ${skipWait(Math.ceil(skip.seconds), true)}`);
          v.root.dataset.skip = skipOk;
        } else {
          delete v.root.dataset.skip;
        }
      }
      /* Same key shape as the chip above it: the seed decides the label, the
         wallet decides the treatment, and neither is written unless it moved.
         The getter is called only on an empty plot, so a full board pays
         nothing for it, and `fmt()` runs only inside the branch. */
      const rp = state === 'empty' ? Game.replantSeed(i) : null;
      const rpSeed = rp ? rp.seed.id : '';
      const rpOk = rp && rp.afford ? 'ok' : 'no';
      if (c.rpSeed !== rpSeed || c.rpOk !== rpOk) {
        c.rpSeed = rpSeed;
        c.rpOk = rpOk;
        if (rpSeed) {
          v.replantNum.textContent = fmt(rp.cost);
          v.replant.setAttribute('aria-label', `Plant another ${rp.seed.name} for ${fmt(rp.cost)} gold`);
          v.root.dataset.replant = rpOk;
        } else {
          delete v.root.dataset.replant;
        }
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
        /* The sheen and the wind lean are opt-in hooks the sky reads, so they go
           on once with the plant rather than being written every frame. Only
           here, where the plant is already being replaced — a class flipped on
           the frame tier would be eight DOM writes a frame for a state that
           changes four times an hour. */
        const grown = v.slot.firstElementChild;
        if (grown) grown.classList.add('wx-glint', 'wx-lean');
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
    /* Summer, in the garden, with no gate and no room on top — the same "name
       every variable that can answer *where am I*" rule the vertical swipe
       follows. Anywhere else the bubble paints into a `display:none` subtree
       and the line is spent into nothing; in the Hollow it would also be a lie,
       because "swipe up" means the opposite thing down there.

       AND THE FLAG IS ONLY CONSUMED ONCE THE LINE HAS ACTUALLY BEEN DRAWN.
       `sayText` still refuses while a coach mark is up, which is reachable
       here: a player who plants before ever tapping the flower has
       `seen.plot` true and `seen.intro` false. Spending the meadow's ONLY
       signpost on a bubble nobody saw is unrecoverable — `seen.meadow` has no
       backfill, by design. */
    const inRoom = !gateOn && !UI.hollowOpen() && !UI.meadowOpen() && !UI.sheetMode();
    const canSee = season === 'summer' && inRoom;
    if (!S.seen.meadow && S.seen.plot && canSee) {
      if (sayText('Swipe down for the wild meadow.', true)) {
        S.seen.meadow = true;
        Game.save();
      }
      return;
    }
    /* WHOSE VOICE THIS IS depends on whose cell the bubble is standing in.
       Holly's idle is hers; the Summer flower's idle is his; and Fall borrows
       the Summer flower, so it borrows his lines too. Speaking Summer's idle
       out of Holly's mouth would be the one thing the character ruling asks
       this not to do. */
    if (season === 'winter' && inRoom) { say('hollyIdle'); return; }
    if (!canSee) return;
    say('idle');
  }

  /* WHOSE LINE IS THIS? Moving the bubble into whichever hero's cell is on
     screen gave every existing `UI.say()` call site a second mouth to come out
     of — so a crit, a weather forecast or the boot greeting could be spoken by
     HOLLY, in the Summer flower's voice, which is the one thing the character
     ruling asks this not to do. The rule is a single line: a `holly*` bucket
     belongs to Holly's room and every other bucket belongs to everyone else's.

     Dropped silently rather than redirected. Weather chatter is deliberately
     the Summer flower's job (docs/46 scopes it that way), and inventing a
     Holly line for every bucket the game already has would be four buckets
     turning into twenty. Fall is unaffected: it borrows the Summer flower, so
     it borrows his lines too, which is exactly what it should do until it has
     a hero of its own. */
  function say(bucket, force) {
    const hollyRoom = season === 'winter';
    const hollyLine = typeof bucket === 'string' && bucket.indexOf('holly') === 0;
    if (hollyRoom !== hollyLine) return;
    const lines = FLOWER_LINES[bucket] || FLOWER_LINES.idle;
    sayText(lines[(Math.random() * lines.length) | 0], force);
  }

  /* The same bubble and the same cooldown, for lines that live somewhere other
     than FLOWER_LINES — a creature's, for instance. */
  /* Returns whether it actually drew. Every existing caller ignores it; the
     meadow's one-time signpost does not, because a line it never showed must
     not be counted as shown. */
  function sayText(text, force) {
    const now = Date.now() / 1000;
    if (!text) return false;
    /* Don't stack a bubble on top of a coach mark — but ASK WHETHER THE COACH
       IS ACTUALLY PAINTED, not merely whether its `hidden` attribute is off.
       `.in-fall .coach:not(.season)` and `.in-winter .coach:not(.season)` hide
       it in CSS while `hidden` stays false, so the flat `!el.coach.hidden`
       test refused every line in both season rooms — which is HALF of the
       docs/11 item ("Fall's flower cannot speak"): moving the bubble into the
       room's own cell fixes where the line is written, and this fixes whether
       it is written at all. `offsetParent` is null for a `display:none`
       element, which is the cheapest true answer to "is this on screen". */
    if (!el.coach.hidden && el.coach.offsetParent !== null) return false;
    if (!force && now - lastSpeech < 3.2) return false;
    lastSpeech = now;
    speechEl.textContent = text;
    speechEl.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speechEl.classList.remove('show'), 2400);
    return true;
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
    /* THE SPEECH BUBBLE MOVES WITH THE HERO, and that is the whole of the
       docs/11 fix ("Fall's flower cannot speak"). `#speech` is a descendant of
       `#garden`, and four separate `display:none` rules delete that subtree —
       Fall's, the Hollow's, the meadow's and a locked gate's — so every line
       spoken in another room was written into a node that was not on screen
       and spent silently. `UI.say('windfall')` has fired into nothing since
       Fall shipped.

       ONE NODE, MOVED, rather than a second bubble per season: the id stays
       `#speech`, which is what `tools/capture-screens.js` and
       `tools/stage-parity.js` both address it by, and there is still exactly
       one `speechEl` for the cooldown to reason about. A per-season copy would
       have needed a per-season id — the reason ui-fall.js declined to draw one
       — and would have quietly broken both tools. */
    UI.bindFlower = (node) => {
      stopHold();
      if (node && !node.dataset.wired) {
        node.dataset.wired = '1';
        wire(node);
      }
      guestFlower = node || null;
      if (!speechEl) return;
      const home = node ? node.parentElement : speechHome;
      if (home && speechEl.parentElement !== home) {
        speechEl.classList.remove('show');
        home.appendChild(speechEl);
      }
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
    el.qBar.style.setProperty('--fill', pct(questP, 1));
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
      /* `--year-p`, not `height`. The fill is `.turn-fill::before` rising from
         the bottom; `.turn-fill` itself is only its clip box and is pinned
         `inset:0`. Writing a height there shrank the clip box from the top and
         left the waterline at 0%, so the dock's meter had never once painted. */
      el.yearFill.style.setProperty('--year-p', `${pct100}%`);
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
    /* An open Year panel keeps answering while the meter fills — but IN PLACE.
       This is not the old projection popover, which the comment here used to
       justify rebuilding because it had "nothing focusable inside it". This
       panel holds four spend buttons per unlocked flower and the ceremony's own
       call to action, and replacing `sheetBody.innerHTML` on a 0.6s tick swaps
       whatever is under the player's thumb mid-press. */
    if (UI.sheetMode() === 'year' && UI.syncYearPanel) UI.syncYearPanel();
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
     whatever is already running, plus the Wonder. The row holds its 33px box
     whether or not anything is in it (`.rail{min-height}`), so a chip arriving
     never moves the board under the player. */
  /* THE SKY'S OWN CHIP. A standing sky is worth real money and until now the
     player's only clue was that the screen got darker.

     NO COUNTDOWN, v1. A countdown to the end of this sky is also a countdown to
     when the next one starts, and paired with the flower's spoken forecast that
     rebuilds most of the forecast panel ruled out on 2026-08-31 in
     `18-mutations-and-weather.md`. A tinted chip says "the sky is doing
     something" without becoming a small clock to plant against. It is the
     owner's call to reopen. */
  function weatherChip() {
    const w = Game.currentWeather();
    if (!w || w.id === 'clear') return '';
    return `<button class="chip weather" type="button" data-tip="wx:${w.id}" style="--tint:${w.tint}"
      aria-label="${w.name} — what this sky is doing">
      <span class="weather-dot"></span><span>${w.name}</span></button>`;
  }

  /* THE COPY IS ABOUT A CHANCE, NEVER A PAYOUT, and this is the hard part of the
     whole item. A plant rolls for a mutation EXACTLY ONCE, at a moment chosen
     randomly inside its grow window when it is sown, resolved against whatever
     sky stands at that moment — so a storm standing now only pays the plants
     whose booked moment happens to land inside it. A chip reading "Gilded x10"
     promises a per-harvest multiplier the game does not give, and a player who
     harvests through a whole storm with nothing to show reads it as broken.

     So the copy carries that rule in its own words rather than in a preamble
     ahead of it: "caught out in it" is the booked moment landing under this sky,
     and "gets one … chance" is the whole of the once-per-plant rule at no cost
     in length. Every number — the odds, the multiplier, and what a rain takes
     off the clock — is read from the data rather than written out, because a
     tooltip that drifts from the table it describes is worse than no tooltip. */
  function weatherTip(id) {
    const w = (DATA.weather.types || []).find((t) => t.id === id);
    if (!w) return '';
    const m = w.mutation ? DATA.mutations[w.mutation] : null;
    /* Only a rain waters — `rainGrowthActive()` names one sky and no other — so
       only rain's line mentions growing. A sky says what it does; a sentence
       about what it does NOT do belongs to none of them. */
    const extra = {
      rain: ` Everything in the garden grows <b>${pct(DATA.weatherStage.rainGrowth)}</b> faster while it lasts.`,
      aurora: ' Night falls under it, whatever the hour, so the night-lovers wake.',
      wonderfall: ' The rarest sky there is.'
    }[id] || '';
    const roll = m
      ? `A plant caught out in it gets one <b>${pct(w.catch)}</b> chance of coming back
         <b>${m.name}</b>, worth <b>&times;${m.mult}</b>.`
      : '';
    return `<b>${w.name}</b><br>${roll}${extra}`;
  }

  /* ONE ATTRIBUTE FOR THREE KINDS OF CHIP. The close-when-gone guard below has
     to find the chip a bubble belongs to, and a boost runs out on its own clock
     — so a player can be reading a tooltip at the instant its chip disappears
     underneath it. One selector finds all three or one of the three is never
     cleaned up. The key is `kind:id`, and the kind is what picks the body. */
  function boostTip(id) {
    const b = DATA.boosters.find((x) => x.id === id);
    return b ? `<b>${b.name}</b><br>${b.desc}` : '';
  }

  /* HEDGED TO THE GARDEN, deliberately. Fall's bed is outside every multiplier —
     `fallHarvest()` credits its own total and never asks — and this chip is
     still shown there, because a tap on the season's hero flower does take the
     Wonder. "The garden" is true in both rooms; "everything" would not be. Both
     numbers are read from the table, never typed: a sentence with a figure
     written into it drifts off its knob with nothing anywhere going red. */
  function wonderTip() {
    return `<b>Wonder Effect</b><br>The garden pays <b>&times;${WONDER.payoutMult}</b> while it lasts,
      and everything in it grows ${WONDER.growMult} times faster.`;
  }

  /* THE SKY IS THE SAME SKY IN EVERY ROOM, and what it does is not. Rain waters
     and mutates `state.grid`; Fall's cells carry no mutation at all and take no
     growth modifier, so the summer copy became a promise the season cannot keep
     the moment this bubble could paint there. */
  function tipFor(key) {
    const [kind, id] = key.split(':');
    if (kind === 'boost') return boostTip(id);
    if (kind === 'wonder') return wonderTip();
    if (inSeasonRoom()) {
      const w = (DATA.weather.types || []).find((t) => t.id === id);
      return w ? `<b>${w.name}</b><br>The same sky hangs over every season. What it does, it does to
        the summer garden.` : '';
    }
    return weatherTip(id);
  }

  function showTip(btn) {
    const key = btn.dataset.tip;
    if (el.wxTip.dataset.tip === key && !el.wxTip.hidden) { hideTip(); return; }
    el.wxTip.dataset.tip = key;
    el.wxTip.innerHTML = `<div class="arrow"></div><div class="tip">${tipFor(key)}</div>`;
    el.wxTip.hidden = false;
    placeTip(btn);
    Sound.play('open');
  }

  /* SPLIT FROM showTip SO AN OPEN BUBBLE CAN BE RE-ANCHORED, silently. The sky
     chip is first in the row and never moves, so one measurement held for the
     life of the tooltip. A boost chip is not: when the Wonder beside it expires
     the row reflows and it slides 114.4px left in a 370px track, and an arrow
     placed once goes on pointing at whatever took its place.

     Placed in viewport coordinates, like the coach it sits beside — but
     CLAMPED to `.ui`'s measured box rather than to the window. This element
     lives outside `.ui` and inherits none of its 560px column, so a bubble
     clamped to the window would sail off into the grey on a desktop while the
     chip it belongs to stayed in the middle. */
  function placeTip(btn) {
    const host = el.ui.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const w = el.wxTip.offsetWidth;
    const centre = r.left + r.width / 2;
    const left = Math.max(host.left + 6, Math.min(host.right - w - 6, centre - w / 2));
    el.wxTip.style.left = `${left}px`;
    el.wxTip.style.top = `${r.bottom + 8}px`;
    /* The bubble slides to stay in the column; the arrow stays on the chip. */
    el.wxTip.style.setProperty('--ax', `${centre - left}px`);
  }

  function hideTip() {
    if (el.wxTip.hidden) return;
    el.wxTip.hidden = true;
    el.wxTip.dataset.tip = '';
  }

  /* A CHIP THAT DOES NOTHING IN THIS ROOM SHOULD NOT BE IN THIS ROOM — the
     owner's #11 ruling, which names Winter in its own words. A countdown for an
     effect the room cannot honour is a promise the room cannot keep. The
     weather chip stays everywhere, because weather is the world's and the sky
     is overhead in every season: `.wx` paints over Fall and Winter at full
     opacity, so hiding its label would leave a storm on screen that nothing
     names.

     A FILTER RATHER THAN A MEDIA QUERY. The half-fix that shipped hid the whole
     rail in Fall under `max-height:700px`, which took the weather chip with it
     and did nothing at all on a tall phone. `.rail` keeps `min-height`, so an
     empty row still holds its box and the board below cannot move. */
  const inSeasonRoom = () => season === 'fall' || season === 'winter';
  /* WHICH BOOSTS ACTUALLY REACH A SEASON ROOM — and it is not "none", which is
     what the first pass assumed. The hero flower in a season's middle cell IS
     the flower button (docs/46: "paying exactly what taps pay everywhere"), and
     `tapFlower()` reads `boostVal('tapPower')`, `critChance` and
     `globalCredits`. So Bloom Burst and Golden Popups genuinely work on the
     taps a player is making on Holly. Seed Rush (`growSpeed`), Fortune Aura
     (`rarityWeight`) and the rented drone (`autoHarvest`) cannot: no Winter or
     Fall plant takes a growth modifier or rolls a rarity, by construction, and
     the drone lifts plots out of `state.grid`, which is the summer board —
     Fall's bed is collected by hand and Winter pays on collect. That is the
     same boundary that makes `passiveIncomeRate()` summer-only.

     The owner's #11 ruling is "hide the power-up that's in effect on that
     garden" where you CANNOT use power-ups. Two of the five you can, so this
     predicate is the ruling applied to what the engine actually does rather
     than to a premise that is only partly true. It gates both halves —
     the chip in the rail and the tap that spends one — so they can never
     disagree about the same boost. A rented drone is still flying over the
     summer garden while this hides its chip; what the rail reports is what is
     in effect on the board you are LOOKING at. */
  const SEASON_DEAD_EFFECTS = ['growSpeed', 'rarityWeight', 'autoHarvest'];
  const reachesHere = (def) => !inSeasonRoom()
    || Object.keys(def.effects || {}).some((k) => SEASON_DEAD_EFFECTS.indexOf(k) === -1);
  function renderRail() {
    const now = Game.nowSeconds();
    let html = '';
    DATA.boosters.forEach((b) => {
      if (!Game.activeBoost(b.id)) return;
      if (!reachesHere(b)) return;
      const remain = Math.max(0, S.boosters[b.id] - now);
      const p = Math.max(0, Math.min(1, remain / b.dur));
      /* Hoisted into a local so the ring and the label cannot disagree about
         the same countdown — they are the same string, read once. */
      const left = Math.ceil(remain) > 99 ? fmtTime(remain) : Math.ceil(remain);
      html += `<button class="chip timed" type="button" data-tip="boost:${b.id}" style="--tint:${b.tint}"
        aria-label="${b.name}, ${left} left — what this power-up is doing">
        <span class="ring" style="--p:${p.toFixed(3)}"><i>${left}</i></span>
        <span>${b.name}</span></button>`;
    });
    /* The Wonder multiplies every payout including a tap, so it reaches here
       too — and it is the loudest thing in the game, which makes hiding it the
       most confusing possible thing to do with it. */
    if (Game.wonderActive()) {
      const remain = Math.max(0, S.wonder.until - now);
      const left = Math.ceil(remain);
      html = `<button class="chip timed" type="button" data-tip="wonder" style="--tint:${WONDER.tint}"
        aria-label="Wonder Effect, ${left} seconds left — what this is doing">
        <span class="ring" style="--p:${(remain / WONDER.duration).toFixed(3)}"><i>${left}</i></span>
        <span>WONDER x${WONDER.payoutMult}</span></button>` + html;
    }
    /* FIRST in the row, and the reason changed the day every chip became
       tappable. It was "the one control here never needs scrolling to", and it
       is not: five chips measure 531px in a 370px track, so four of them can
       need scrolling to whatever leads. What survives is READING ORDER — the
       sky is the world's and it is overhead in every room, while everything
       after it is a clock the player started. Leading with the one chip that is
       not the player's doing also gives the row the same left edge in Summer,
       Fall and Winter, where `reachesHere()` has thinned what follows. */
    html = weatherChip() + html;
    if (el.rail.dataset.sig !== html) {
      el.rail.innerHTML = html;
      el.rail.dataset.sig = html;
      /* THE TOOLTIP LIVES OUTSIDE THE RAIL, and this is why: the signature
         carries every countdown, so this branch fires about once a second and
         takes the whole row's markup with it. Anything anchored to a node in
         here is destroyed on the next tick. What is left is to close the tooltip
         when the chip it belongs to has gone, and to follow it when the row
         reflows around it. One query answers both — a boost expires on its own
         clock, so a bubble can be open at the instant its chip disappears, and
         the Wonder expiring beside a boost chip slides it 114.4px left. Keys are
         `[a-z:]` only, so no selector escaping is needed. */
      if (!el.wxTip.hidden) {
        const chip = el.rail.querySelector(`[data-tip="${el.wxTip.dataset.tip}"]`);
        if (chip) placeTip(chip);
        else hideTip();
      }
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
    /* DRAINED MEANS THE BAG IS EMPTY, never "the one you hold is already
       running". A player whose only boost is mid-countdown still owns it, and
       the badge is the one place its count is written — dropping both while the
       rail beside it counts the same boost down is the button contradicting the
       screen. The SEAT still decides what a tap does; this only decides what
       the button says. */
    const shown = def || (held
      ? DATA.boosters.find((b) => ((S.boostInv && S.boostInv[b.id]) || 0) > 0) : null);
    const sig = `${powerSeat}|${held}|${shown ? shown.id : ''}`;
    if (el.btnPower.dataset.sig === sig) return;
    el.btnPower.dataset.sig = sig;
    el.btnPower.classList.toggle('empty', !shown);
    el.btnPower.classList.toggle('busy', !def && Boolean(shown));
    el.btnPower.dataset.boost = def ? def.id : '';
    el.btnPower.style.setProperty('--tint', shown ? shown.tint : 'transparent');
    /* FOUR BOOSTERS SHARE ONE SEAT, and the seat re-rolls — so the same round
       button spends a different thing on different taps, and nothing but a tint
       says which. The name, what it does and how long it lasts go in the label,
       with the count the badge is showing: the badge counts the whole bag, not
       the one seated, and a label that said only one of those two numbers would
       contradict what is drawn on the button. */
    const bagged = def ? ((S.boostInv && S.boostInv[def.id]) || 0) : 0;
    const bag = held > bagged ? `${bagged} of these, ${held} power-ups in all` : `${bagged} to spend`;
    let label = 'Power-up. Nothing loaded yet.';
    if (def) label = `Use ${def.name}. ${def.desc} ${bag}.`;
    else if (shown) label = `${shown.name} is already running. You hold ${held}.`;
    el.btnPower.setAttribute('aria-label', label);
    el.btnPower.innerHTML = shown
      ? `${Icons.get(shown.icon)}${held > 1 ? `<span class="f-count">${held}</span>` : ''}`
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

  /* Straight through Game.plant(), never a shortcut around it — cost, growth
     modifiers, verbs, quests and the plant event all have to fire exactly as
     they do from the picker, or the chip becomes a second planting rule. The
     success beat is already carried by that event: it throws the sparks, plays
     the sound and buzzes. Only the refusal needs saying here. `Sound.resume()`
     is not decoration — `Sound.play()` bails until the context is awake, and a
     replant can be the first gesture of a session. */
  function onReplantTap(idx) {
    Sound.resume();
    const r = Game.replantSeed(idx);
    if (!r) return;
    if (Game.plant(idx, r.seed)) return;
    Sound.play('deny');
    FX.shake(4);
    popWallet('credits');
    say('broke');
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

     RE-RULED BY THE OWNER FROM LIVE PLAY, 2026-08-30: the finger drags the
     WORLD, it does not point at the destination. Pull the world up and you
     descend, so a finger dragged UP goes down into the Hollow; push it down and
     you rise, so a finger dragged DOWN goes out and up the lane to the meadow.
     Phase 3.5 read the gesture as a pointer — down goes under, up goes out —
     and in the hand it came out backwards.

     A room's own exit is the opposite of the swipe that got you there, so both
     rooms' exits flipped with this, and both exit pills' marks with them.

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
  const noSwipe = '.plot,.fl-plot,.wi-plot,.flower-btn,.fpill,.fround,.fl-collect,.wi-act,.dock,.rail,.quest-strip,.hud,.sheet,.scrim,.drawer,[data-critter],.coach,.s-edge,.g-back';
  let navY0 = null;
  let navX0 = null;
  let navId = null;
  el.game.addEventListener('pointerdown', (e) => {
    navY0 = null;
    navId = null;
    if (UI.hollowOpen() || UI.meadowOpen() || UI.sheetMode() || UI.menuOpen()) return;
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
    if (dy > 0) UI.enterHollow();
    else UI.enterMeadow();
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
  /* THE RAIL'S ONE LISTENER, and it now serves every chip in the row rather
     than the sky's alone. Delegated, because the row is rewritten wholesale
     about once a second and a listener bound to a chip would go with it.
     `click`, not `pointerdown`: the rail is already in `noSwipe`, so there is
     no gesture to beat, and a tap that drifts should do nothing rather than
     fire on the way past. */
  el.rail.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-tip]');
    if (!chip) return;
    Sound.resume();
    showTip(chip);
  });

  /* Tap it, tap anywhere, or open anything: three ways out, and the third is
     what a bubble that cannot be scrolled with its anchor needs. `capture`, so a
     tap that lands on a control still closes this on its way through. */
  document.addEventListener('pointerdown', (e) => {
    if (el.wxTip.hidden) return;
    if (e.target.closest('#wxTip') || e.target.closest('[data-tip]')) return;
    hideTip();
  }, true);
  el.wxTip.addEventListener('click', hideTip);

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
    /* A POWER-UP SPENT WHERE IT CANNOT REACH IS A POWER-UP THROWN AWAY — the
       button sits in the band, which is not hidden in a season room, so a tap
       burned an unrepeatable consumable silently. But the first version of this
       guard refused ALL FOUR, and two of them work: Holly is the flower button
       and a tap on her reads `tapPower` and `globalCredits` like any other.
       Refusing a boost that would have worked is the same harm as spending one
       that would not, so the guard asks the boost rather than the room. */
    const seated = id && DATA.boosters.find((b) => b.id === id);
    if (seated && !reachesHere(seated)) {
      Sound.play('deny');
      FX.shake(3);
      toast({
        title: `${seated.name} does nothing here`,
        body: 'Nothing in this garden grows faster, rolls rarer, or gets picked for you. Swipe back to the summer garden and it will still be waiting.',
        art: Icons.get(seated.icon)
      });
      return;
    }
    /* Empty is a promise, not a dead control: it says where boosts come from
       rather than doing nothing at all. */
    if (!id) {
      Sound.play('deny');
      const running = DATA.boosters.find((b) => Game.activeBoost(b.id)
        && ((S.boostInv && S.boostInv[b.id]) || 0) > 0);
      toast(running
        ? {
          title: `${running.name} is already running`,
          body: 'One at a time. The strip above the garden is counting it down.',
          art: Icons.get(running.icon)
        }
        : {
          title: 'Nothing loaded yet',
          body: 'They turn up for quests, for levelling, and for filling the Almanac.',
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
    /* GARDEN is the SEASON STRIP'S way home: it returns Fall to Summer. It is
       deliberately not a second way out of a panel or a room — a panel is
       covered by its own sheet and carries a close button (docs/36 annotation
       1), and a room leaves by the opposite swipe and hides the whole dock
       (annotation 2). The closeSheet and room calls below are belt-and-braces
       for a future layout where the dock is reachable, not live paths today. */
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
    { id: 'winter', name: 'WINTER', gate: 'winterTurn', built: true }
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

  /* TERNARY since 2026-09-01 (slice C). It was a summer/fall binary whose else
     branch hard-assigned `season = 'summer'`, so any id that was not 'fall'
     landed the player in Summer — including 'winter'. Written as leave-then-
     enter over a table rather than as a longer if/else, so a fourth season is
     one row and not a fourth branch. */
  const SEASON_ROOMS = {
    fall: { enter: () => UI.enterFall(), leave: () => UI.leaveFall(), seen: 'fallSwipe' },
    winter: { enter: () => UI.enterWinter(), leave: () => UI.leaveWinter(), seen: 'winterSwipe' }
  };
  function goSeason(id) {
    const sdef = SEASONS[seasonIdx(id)];
    if (!sdef) return;
    hideGate();
    /* A chip tooltip is anchored to a chip in the rail, and the rail's chips
       change with the room — so a tip left open on the way out reopens over the
       next room pointing at nothing. #9's close-on-room-change guard, extended
       to every season rather than only to the one it was written for. */
    hideTip();
    if (!seasonReady(sdef)) { showGate(sdef); return; }
    if (id === season) { renderSeasonEdges(); return; }
    const from = SEASON_ROOMS[season];
    if (from) {
      from.leave();
      // Leaving for anywhere retires the mark that pointed back to the garden.
      if (!S.seen.gardenSwipe) { S.seen.gardenSwipe = true; Game.save(); }
    }
    const to = SEASON_ROOMS[id];
    season = to ? id : 'summer';
    if (to) {
      to.enter();
      // Arriving retires the mark that pointed here, whichever way you arrived.
      if (!S.seen[to.seen]) { S.seen[to.seen] = true; Game.save(); }
    }
    /* The rail's contents depend on the ROOM — `reachesHere()` reads `season`,
       which the line above just reassigned — and the only other caller is the
       0.25s tier, so without this a chip the new room filters out stays painted
       for a quarter of a second into it. The signature cache makes the extra
       call free when nothing changed. */
    renderRail();
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
  /* The edge tab's attention dot: an appointment needs a bell. Widened past
     Fall on the day a second season was built, exactly as docs/43 said it
     would be. Winter's dot means "something opened while you were away", which
     is the whole reason the season is a place you come back to. */
  function seasonWaiting(id) {
    if (id === 'fall') {
      if (!Game.fallOpen()) return false;
      const now = Game.nowSeconds();
      return (S.fall.grid || []).some((c) => c && c.seed
        && (Boolean(c.windfall) || now - c.plantedAt >= c.grow));
    }
    if (id === 'winter') {
      if (!Game.winterOpen()) return false;
      const b = Game.winterBedState();
      return b.ripe > 0;
    }
    return false;
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
  /* `swipe` draws the finger and its wake beside the words; `season` is what
     lets the mark survive `.in-fall .coach{display:none}`, which exists because
     a garden-targeted bubble measured a 0x0 rect in Fall and parked over the
     coin wallet. The season tabs are drawn in Fall, so this one has a real rect
     — but the blanket hide had to be narrowed rather than removed. */
  let coachSide = '';
  function showCoach(target, text, opts = {}) {
    coachTarget = target;
    /* A SEASON TAB IS POINTED AT FROM THE SIDE. It is a 38px column pinned to
       the screen edge and standing on the lawn, and a bubble above it lands
       squarely on Fall's bed chip. Beside it, the mark reads as an arrow into
       the tab, which is also the direction the swipe goes. */
    coachSide = opts.side || '';
    coachWanted = coachSide;
    coachBase = `coach${opts.season ? ' season' : ''}`;
    coachTip = `<div class="tip">${opts.swipe ? `<span class="c-swipe ${opts.swipe}">${Icons.get('swipe')}</span>` : ''}${text}</div>`;
    el.coach.hidden = false;
    /* Force the rebuild: layOutCoach() short-circuits on an unchanged class, and
       a new mark can want the same shape with different words. */
    el.coach.className = '';
    layOutCoach(coachSide);
    placeCoach();
  }
  /* One mark, two shapes. Beside the target the arrow is a horizontal wedge and
     comes first (or last) depending on which edge the target is on; above it,
     the house's own stacked form. Rebuilt only when the shape actually changes
     — this is read from the 0.6s tick. */
  let coachWanted = '';
  let coachBase = 'coach';
  let coachTip = '';
  function layOutCoach(side) {
    const cls = `${coachBase}${side ? ` side-${side}` : ''}`;
    if (el.coach.className === cls) return;
    coachSide = side;
    el.coach.className = cls;
    const arrow = '<div class="arrow"></div>';
    el.coach.innerHTML = side === 'l' ? arrow + coachTip : coachTip + arrow;
  }
  function placeCoach() {
    if (!coachTarget || el.coach.hidden) return;
    const r = coachTarget.getBoundingClientRect();
    /* NOTHING THE PLAYER NEEDS GETS COVERED. A season tab's midpoint is the same
       height as the UPGRADE pill and the POWER-UP button, so a mark centred on
       it parked on top of them — over the very button the round's own opening
       bag exists to teach — and in Fall it crossed the bed chip that was moved
       out of the board's way an hour earlier. Ask those three where they are
       rather than guessing a constant, and look for a gap rather than only
       pushing upward: beside a tall tab there is usually room BELOW the chip as
       well as above it. */
    const blockers = [el.btnUpgrade, el.btnPower, el.fallChip, el.fallCollect]
      .map((n) => n && n.getBoundingClientRect())
      .filter((b) => b && b.height > 0);
    if (coachWanted) {
      layOutCoach(coachWanted);
      const h = el.coach.offsetHeight;
      const w = el.coach.offsetWidth;
      const left = coachSide === 'l' ? r.right + 6 : Math.max(8, r.left - 6 - w);
      const hits = blockers.filter((b) => b.right > left && b.left < left + w);
      const clear = (top) => top >= 8 && hits.every((b) => top + h <= b.top - 6 || top >= b.bottom + 6);
      /* A sideways arrow has to land on its tab, so every candidate must still
         overlap it vertically. */
      const onTab = (top) => top + h > r.top + 8 && top < r.bottom - 8;
      const centred = r.top + r.height / 2 - h / 2;
      const spot = [centred, ...hits.map((b) => b.top - 6 - h), ...hits.map((b) => b.bottom + 6)]
        .filter((t) => clear(t) && onTab(t))
        .sort((a, b) => Math.abs(a - centred) - Math.abs(b - centred))[0];
      if (spot !== undefined) {
        el.coach.style.top = `${spot}px`;
        el.coach.style.left = `${left}px`;
        const sideTip = el.coach.querySelector('.tip');
        if (sideTip) sideTip.style.setProperty('--tip-shift', '0px');
        return;
      }
      /* No gap beside the tab at all — a sideways arrow would be pointing at
         nothing. Stand above it and point down instead: the house's own shape,
         and the only honest one left on a screen this short. */
      layOutCoach('');
    }
    const floor = blockers.length ? Math.min(...blockers.map((b) => b.top)) - 6 : Infinity;
    const cx = r.left + r.width / 2;
    el.coach.style.left = `${cx}px`;
    el.coach.style.top = `${Math.max(8, Math.min(r.top - el.coach.offsetHeight - 6, floor - el.coach.offsetHeight))}px`;
    /* THE ARROW STAYS ON THE TARGET; THE BUBBLE MOVES. A season tab sits 19px
       from the screen edge and the tip is `white-space:nowrap`, so a bubble
       centred on it runs half its width off the screen. Shifting the whole mark
       would leave the arrow pointing at nothing, so only the tip slides. */
    const tip = el.coach.querySelector('.tip');
    if (!tip) return;
    const half = tip.offsetWidth / 2;
    const want = Math.max(8 + half, Math.min(window.innerWidth - 8 - half, cx));
    tip.style.setProperty('--tip-shift', `${Math.round(want - cx)}px`);
  }
  function hideCoach() {
    coachTarget = null;
    el.coach.hidden = true;
  }
  function refreshCoach() {
    // hideCoach(), not just hidden=true: leaving coachTarget set means the next
    // tick takes the `coachTarget !== node` shortcut, skips showCoach(), and
    // reveals the old bubble with stale text at a stale position.
    /* The Hollow, the meadow and a gate all set `display:none` on the season
       tabs or on the coach itself, and a hidden node measures 0x0 — which parks
       the bubble in the top-left corner over the wallets rather than failing.
       Naming every room that can be up is the same rule the vertical swipe's
       guard follows, and the menu drawer joined the list on 2026-08-31 — it
       covers the right two thirds of the screen, so a mark pointing into the
       garden lands on top of it. */
    if (UI.sheetMode() || gateOn || UI.hollowOpen() || UI.meadowOpen() || UI.menuOpen()) { hideCoach(); return; }
    /* THE SEASON ROOMS, and it has to be NARROW rather than a blanket bail.
       `.in-fall`/`.in-winter` display:none every coach mark EXCEPT `.season` —
       the ones teaching the way in and out point at a season tab, which is a
       real visible node in those rooms and is the whole reason the CSS rule
       carries a `:not()`. But the two marks below this line point INTO THE
       GARDEN, which those rooms have hidden, so `refreshCoach()` measured a
       0x0 rect every 0.6s and parked the bubble over the wallets — the
       recorded trap word for word, and two rooms had been missing from the
       list since Fall shipped. */
    const inGarden = season === 'summer';
    if (!inGarden && (!S.seen.intro || !S.seen.plot)) { hideCoach(); return; }
    if (!S.seen.intro) {
      if (coachTarget !== flowerBtn) showCoach(flowerBtn, 'Tap the flower!');
      el.coach.hidden = false;
    } else if (!S.seen.plot) {
      const free = S.grid.findIndex((c) => !c.locked && !c.seed);
      if (free === -1) { hideCoach(); return; }
      const node = plotEls[free] && plotEls[free].root;
      if (node && coachTarget !== node) showCoach(node, 'Plant a seed here');
      el.coach.hidden = false;
    /* TEACH THE SEASON SWIPE, ONCE EACH WAY. Turn 1's gift is Fall, and a gift
       nobody can find is not a gift — the ceremony names the tab and then the
       player is standing in a garden that looks exactly as it did. Both marks
       are retired by the player doing the thing they teach, so neither can sit
       there forever suppressing the flower's own lines (`sayText()` refuses
       while a coach is up).

       Gated on `Game.fallOpen()`, never on `turnsCompleted >= 1`: which Turn
       opens Fall is `DATA.year.fallTurn`, a knob, and the identity would go
       quietly wrong the day it moves. */
    } else if (season === 'fall' && !S.seen.gardenSwipe) {
      const node = el.seasonEdges.querySelector('.s-edge.l[data-season="summer"]');
      if (!node) { hideCoach(); return; }
      if (coachTarget !== node) showCoach(node, 'Swipe right for the garden', { swipe: 'right', season: true, side: 'l' });
      el.coach.hidden = false;
    } else if (season === 'summer' && Game.fallOpen() && !S.seen.fallSwipe) {
      const node = el.seasonEdges.querySelector('.s-edge.r[data-season="fall"]');
      if (!node) { hideCoach(); return; }
      if (coachTarget !== node) showCoach(node, 'Swipe left for Fall', { swipe: 'left', side: 'r' });
      el.coach.hidden = false;
    /* AND ONE MORE FOR WINTER, once Fall has been found. Turn 3's gift is a
       whole season, and a gift nobody can find is not a gift — the ceremony
       names the tab and then the player is standing in a garden that looks
       exactly as it did, which is the reason Fall got its pair. It waits for
       `fallSwipe` so the two marks never compete for the same edge, and
       `seen.winterSwipe` — written by `goSeason()` since the day Winter
       shipped, and read by nothing until now — is what retires it. */
    } else if (season === 'fall' && Game.winterOpen() && !S.seen.winterSwipe) {
      const node = el.seasonEdges.querySelector('.s-edge.r[data-season="winter"]');
      if (!node) { hideCoach(); return; }
      if (coachTarget !== node) showCoach(node, 'Swipe left for Winter', { swipe: 'left', season: true, side: 'r' });
      el.coach.hidden = false;
    } else {
      hideCoach();
      return;
    }
    placeCoach();
  }

  /* ============ dock attention dots ============ */
  function updateDockDots() {
    /* The curtain, docs/47: filtered to REVEALED cards only, or the pill nags
       at a masked row nobody can see yet (Rain Dance is affordable within
       minutes while hidden until 4K). Owner-ruled 2026-09-02: the dot is now
       a COUNT, the same .dock-dot.wide convention every other dock badge
       already carries, of every revealed core card that is either
       affordable or unseen (revealed but not yet celebrated) — one card
       counts once even if it is both. Harvesters have no "unseen" concept
       (they are not the drip) and only ever contribute by affordability. */
    Game.refreshReveals();
    const revealedCore = UI.CORE_UPGRADES.filter((k) => Game.upgradeRevealedNow(k));
    const coreAttention = revealedCore.filter((k) => (!Game.upgradeMaxed(k) && S.credits >= Game.upgradePrice(k))
      || !S.celebrated[`upgrade:${k}`]).length;
    const harvesterAttention = PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked)
      .filter(({ key }) => !Game.upgradeMaxed(key) && S.credits >= Game.upgradePrice(key)).length;
    const upgradeAttention = coreAttention + harvesterAttention;
    const canDecor = DATA.decor.some((d) => {
      const pot = d.currency === 'gems' ? S.gems : S.credits;
      return pot >= d.cost;
    });
    const canHive = Game.jarsWaiting() > 0 || (!Game.hiveCount() && S.credits >= Game.nextHiveCost());
    const canBrew = Object.keys(S.goods).length > 0 || CRAFT_RECIPES.some((r) => Game.canCraft(r));
    /* A face is waiting and you can already fill their order — the one signal
       that should pull a player back into planting something specific. */
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
    /* Doc 36's table asks for counts, not bare discs: "the fillable-order dot; a
       claimable-quest count" and "unopened pack count". A number is a reason to
       open something; a dot is only a nudge. */
    const counts = {
      orders: Game.standOrders().filter((o) => Game.standCanDeliver(o)).length + (canClaim ? 1 : 0),
      album: S.packs
    };
    $$('.dock-btn', el.dock).forEach((b) => {
      const dot = $('.dock-dot', b);
      if (!dot) return;
      const tab = b.dataset.tab;
      const show = map[tab] && UI.sheetMode() !== tab;
      dot.hidden = !show;
      const n = counts[tab];
      const txt = show && n > 1 ? String(n) : '';
      if (dot.textContent !== txt) dot.textContent = txt;
      dot.classList.toggle('wide', Boolean(txt));
    });
    /* The band's UPGRADE pill carries the same dot on the same rule — the first
       time the attention-dot idea has reached a control that is not a dock tab. */
    const upDot = $('.dock-dot', el.btnUpgrade);
    if (upDot) {
      const showUp = upgradeAttention > 0 && UI.sheetMode() !== 'upgrades';
      upDot.hidden = !showUp;
      const upTxt = showUp && upgradeAttention > 1 ? String(upgradeAttention) : '';
      if (upDot.textContent !== upTxt) upDot.textContent = upTxt;
      upDot.classList.toggle('wide', Boolean(upTxt));
    }
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
  let lastComboP = -1;

  /* ============ creatures ============ */

  /* Fixed spots along the lawn, so a creature keeps its place between renders
     rather than jumping about whenever the yard is rebuilt. */
  /* Phase 3.5: the crowd comes in off the edges, because the band's two
     floating buttons now stand at 34px in from each side. The old 80% spot put
     the second creature squarely behind the POWER-UP button. */
  const CRITTER_SPOTS = [35, 65, 45, 55];
  const critterEls = new Map();

  function buildCritter(def, spot) {
    const node = document.createElement('button');
    /* Only tending creatures stand in the yard, and a storm is the one sky that
       asks them to duck — so the shelter hook rides the node and the stylesheet
       decides when. Built once, never toggled: `place()`-style passes position
       these, and a node rebuilt under one flashes. */
    node.className = 'critter wx-shelter';
    node.type = 'button';
    node.dataset.critter = def.id;
    node.style.setProperty('--x', spot + '%');
    /* Paint order is DOM order, which is ARRIVAL order — so without this a
       creature further left could be drawn in front of one further right, with
       every creature on the same baseline and no depth cue to explain it.
       Stacking by position makes the occlusion read as a crowd. */
    node.style.zIndex = String(Math.round(spot));
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
    const t0 = performance.now();
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
      /* The backstop for every quiet beat that is not a sheet closing or the
         news chain settling — the coach clearing, or simply nothing else
         having happened for a second. Once a second is plenty; the gap
         between moments is 20s by default. */
      if (UI.tryMoment) UI.tryMoment();
    }
    const cp = S.tap.combo / S.tap.comboMax;
    // Byte-identical values written sixty times a second do nothing but invalidate.
    if (cp !== lastComboP) {
      lastComboP = cp;
      comboRing.style.setProperty('--combo', cp.toFixed(3));
      comboRing.style.setProperty('--combo-op', (0.3 + cp * 0.7).toFixed(2));
    }

    railAcc += dt;
    /* The quest strip moved off `hudTick` and onto this tier. It is signature-guarded,
       so what it DRAWS is unchanged — but the guard runs after `Game.stripQuest()`,
       which allocates a Date and two Sets, and every frame is sixty times a second to
       decide nothing changed. Every update that matters is event-driven and still calls
       it directly; the clock-driven half is a countdown, which is what this tier is for. */
    if (railAcc >= 0.25) {
      railAcc = 0;
      renderRail(); renderPowerUp(); renderQuestStrip(); UI.tickSheetTimers();
    }

    slowAcc += dt;
    if (slowAcc >= 0.6) {
      slowAcc = 0;
      if (UI.meadowOpen()) UI.renderMeadow();
      else if (UI.hollowOpen && UI.hollowOpen()) UI.renderHollow();
      else renderCritters();
      updateDockDots();
      updateYearMeter();
      if (UI.fallOpen && UI.fallOpen()) UI.renderFall();
      if (UI.winterOpen && UI.winterOpen()) UI.renderWinter();
      renderSeasonEdges();
      refreshCoach();
      UI.updateSky();
      /* Whether the sky is dark has two writers — the hour and an aurora bending
         the light rules — and the hour crosses on a clock nothing emits for.
         Nobody notices a dusk arriving half a second late. */
      UI.syncWeatherNight();
      /* Every open panel, not just Settings. Half the numbers the panels now
         quote move on a CLOCK rather than on a purchase — a mutation roll
         firing empties the sky card's count with no event at all, and a
         creature's food clock changes what the next tin is worth — and
         `currency` was the only thing calling this. The 0.6s tier is where
         work a player will not notice lagging belongs. */
      if (UI.sheetMode()) UI.syncAfford();
    }

    requestAnimationFrame(frame);
    /* After the request, never before it: an instrument that delays the next frame is
       measuring itself. Costs nothing while it is off, which is always, unless someone
       has turned it on from the dev sheet. */
    UI.perf.frame(now, t0);
  }

  /* ============ boot ============ */
  function boot() {
    Flora.injectDefs();
    Icons.hydrate(document);
    FX.init();
    FX.setMagnet('coin', el.walletCredits);

    const info = Game.load();
    /* A first-time player's first changelog is the game itself, so everything
       already shipped is marked read before anything can go up. Only on a fresh
       save, and `seedChangelogSeen()` refuses if anything is already recorded,
       so a returning player's history is never touched. */
    if (info.fresh) Game.seedChangelogSeen();
    if (!S.seen.plot) el.game.classList.add('onboard');
    Object.assign(Sound.prefs, S.prefs);

    /* The glint's interval is a data knob, written to CSS once. It never
       changes at runtime, so it does not belong on the 0.6s tick beside the
       fill. */
    el.turnBtn.style.setProperty('--turn-shine', `${DATA.year.turnShineEvery}s`);

    UI.buildClouds();
    UI.updateSky();
    // processWeather() suppresses the `weather` event for the first slot it sees,
    // and that event is the only thing that calls paintWeather() — so without
    // this, a page opened during rain or a storm renders a clear sky until the
    // slot rolls over. Roughly a quarter of slots are not clear.
    UI.paintWeather(Game.currentWeather());
    /* And the staged layers with it — the tuned values reach CSS here, and a sky
       already hanging when the page opens is put on screen without a front,
       because it is not arriving, it is already here. After paintWeather(), which
       is what writes the sky it reads. */
    UI.startWeather();
    // Roll a capped creature's clock forward once, so time away it could never
    // have banked does not sit there pretending to still be accruing.
    Game.settleCritters();
    buildGarden();
    UI.initFall();
    UI.initWinter();
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
    if (window.ResizeObserver) new ResizeObserver(() => { sizeGarden(); if (UI.sizeFallBoard) UI.sizeFallBoard(); if (UI.sizeWinterBoard) UI.sizeWinterBoard(); }).observe($('.stage'));
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
    let audioLive = false;
    const unlock = () => { audioLive = true; Sound.init(); Sound.setSfx(S.prefs.sfx); Sound.setAmb(S.prefs.amb); Sound.setMusic(S.prefs.music); Sound.resume(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    /* The page going away freezes the AudioContext clock and not the timers that
       schedule against it, so a scheduler left running banks a note per tick and
       fires the lot the instant the context comes back. Its own listener rather
       than a line inside the save above: an audio fault must never be able to
       throw before Game.saveNow() has run, and listeners fire in the order they
       were added. */
    document.addEventListener('visibilitychange', () => {
      if (!audioLive) return;
      if (document.hidden) Sound.pause(); else Sound.resume();
    });

    /* After the coach mark, never over it — a returning player who has not planted yet is being
       onboarded, and the scene would land on top of that. */
    const awayReport = Game.reconcile();
    UI.setAwayReport(awayReport);
    /* WHAT'S NEW GOES FIRST AND ALONE. It is the one dialog a player cannot
       swipe away, so nothing else may open underneath it — the away report
       would be sitting there behind the scrim, and on a `reset` announcement it
       is a report on a garden that is about to be replaced anyway. Both the
       welcome sheet and the flower's greeting stand down while it is up, and
       the welcome sheet gets its turn from afterNews() if the announcement did
       not take the player back to the start. */
    const announcing = Boolean(UI.maybeAnnounce && UI.maybeAnnounce());
    const welcome = () => {
      if (awayReport && S.seen.plot) {
        UI.openSheet('welcome');
        Sound.play('open');
      }
    };
    /* The moments queue drains through this same chain — after whatever news
       just closed settles (and after welcome() has had its turn, whether or
       not it actually opened the away sheet), try the next quiet beat. */
    UI.afterNews = () => setTimeout(() => { welcome(); if (UI.tryMoment) UI.tryMoment(); }, 400);
    if (!announcing) setTimeout(welcome, 900);

    setTimeout(() => {
      if (info.migrated) {
        toast({ title: 'Progress restored', body: 'Your old garden came along', art: Icons.get('sprout') });
      }
      if (!UI.newsOpen || !UI.newsOpen()) say('greet', true);
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
  UI.boardSide = boardSide;
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

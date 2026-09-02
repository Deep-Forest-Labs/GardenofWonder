/* Garden Wonder — Winter, the night shift.

   THE ARCHITECTURE, and it is the same one Fall states: Winter is NOT a place
   layer like the meadow or the map. It is the same room with a different board
   in it. The HUD, the quest strip, the rail and the dock never move; `.stage`
   swaps its board and the scenery swaps behind it. So this file does NOT
   re-state the 560px column, because it never leaves `.ui`.

   What differs from Summer and from Fall, and all of it is docs/46's:
     * the board is a dark cold-frame on frozen earth, in a world made of snow
     * the clocks are half a day to two days
     * THE NIGHT PAYS EXTRA WHEN THE GARDEN WAS KEPT — tuck the bed in, and
       whatever opens under the quilt wears the snowfall
     * Holly stands in the middle cell, and this is the first room where the
       speech bubble comes with the hero rather than staying in Summer */

(() => {
  const { $, S, el, fmt } = UI;
  /* Winter's clocks are hours and days, so it needs the hours-scale formatter.
     Read through UI at call time, never destructured: another ui-* file
     attaches it and load order is not ours to assume. */
  const span = (sec) => UI.fmtSpan(sec);
  const nowSec = () => Date.now() / 1000;

  let open = false;
  let sceneKey = '';
  let built = false;
  const cellEls = new Map();

  const WINTER = () => DATA.winter;
  const plantById = (id) => WINTER().plants.find((p) => p.id === id);

  /* ---------- the board ---------- */
  /* Built once and updated in place, never rebuilt on a tick — the meadow's
     hives were re-created from innerHTML every slow tick and the pets flashed
     in and out on a phone. */
  function buildBoard() {
    const board = el.winterBoard;
    if (!board) return;
    board.innerHTML = '';
    cellEls.clear();
    const zs = document.createElement('span');
    zs.className = 'wi-sleep';
    zs.innerHTML = Winter.zzz();
    board.appendChild(zs);
    /* ONE glint for the whole bed, for the same reason there is one set of Zs:
       eight infinite animations is eight layouts a frame on `left`, or sixteen
       composited layers on `transform`, and the recorded crash here is layer
       memory. The bed is what was kept, so the bed is what catches the light. */
    const glint = document.createElement('span');
    glint.className = 'wi-glint';
    glint.innerHTML = '<i></i>';
    board.appendChild(glint);
    for (let cell = 0; cell < 9; cell++) {
      if (cell === 4) {
        const mid = document.createElement('div');
        mid.className = 'wi-flower-cell';
        /* The glow is a sibling of the button, exactly as it is in Summer's
           cell and in Fall's. The combo ring does not come with it — there is
           no combo here. The SPEECH BUBBLE does, and that is new: `UI.bindFlower()`
           moves the one `#speech` node into whichever hero's cell is on
           screen, so Holly can talk and Fall inherits the fix for free. */
        mid.innerHTML = `<div class="flower-glow"></div>
          <button class="flower-btn wi-flower" id="winterFlower" aria-label="Tap Holly">${Flora.holly()}</button>`;
        board.appendChild(mid);
        continue;
      }
      const idx = cell < 4 ? cell : cell - 1;
      const b = document.createElement('button');
      b.className = 'wi-plot';
      b.dataset.winter = String(idx);
      b.innerHTML = `
        <span class="wi-floor">${Winter.cellFloor(idx)}</span>
        <span class="wi-slot"></span>
        <span class="wi-empty">${Icons.get('plantSpot')}</span>
        <span class="wi-quilt">${Winter.quilt()}</span>
        <span class="wi-ready">!</span>
        <span class="wi-wait" hidden></span>
        <span class="wi-bar"><i></i></span>`;
      board.appendChild(b);
      cellEls.set(idx, {
        root: b,
        slot: $('.wi-slot', b),
        wait: $('.wi-wait', b),
        bar: $('.wi-bar i', b),
        /* Seeded with values no state can produce. A cache initialised to ''
           never fires its first write for a state whose key is also '' — the
           recorded `dataset.look` trap, which has now bitten twice. */
        cache: { look: '?', wait: '?', state: '?', kept: null, tucked: null }
      });
    }
  }

  /* The same square Summer and Fall get, from the same function. Three boards
     the player swipes between are one board, and any second opinion about how
     big it is shows up as a jump at the moment of the swipe. */
  function sizeBoard() {
    if (!el.winterFrame || !el.winterBoard) return;
    const side = UI.boardSide();
    el.winterBoard.style.width = `${side}px`;
    el.winterBoard.style.height = `${side}px`;
  }

  /* ---------- the scene ----------
     Memoised on the size AND the sky, because a resize has to redraw and
     because build() replaces the node the memo was taken against. */
  function syncScene() {
    const host = el.winterScene;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const w = Math.max(320, Math.round(r.width));
    const h = Math.max(480, Math.round(r.height));
    const dock = el.dock ? Math.round(el.dock.getBoundingClientRect().height) || 96 : 96;
    const sky = Game.isNight() ? 'moon' : 'sun';
    const key = `${sky}|${w}|${h}|${dock}`;
    if (sceneKey === key && host.firstChild) return;
    sceneKey = key;
    host.innerHTML = Winter.scene({ width: w, height: h, dockHeight: dock, sky });
  }

  /* ---------- the chip ----------
     Fall's chip grammar, Winter's rule. THE RULE LIVES HERE and Holly's lines
     are never load-bearing — she is free to say nothing at all and the season
     still explains itself.

     Every branch is a sentence about the BED. The engine hands over the whole
     state in one object; a ui-* file does no economy math. */
  function renderChip() {
    if (!el.winterChip) return;
    const b = Game.winterBedState();
    const pct = Math.round(WINTER().snowfall * 100);
    let cls = '';
    let html;
    if (b.keptRipe > 0 && b.keptRipe === b.ripe) {
      /* The morning the season exists for. */
      cls = 'frost';
      html = `${Icons.get('snow')}<span><b>${b.keptRipe} kept ${b.keptRipe === 1 ? 'bloom' : 'blooms'}</b> waiting &mdash; <b>+${pct}%</b></span>`;
    } else if (b.keptRipe > 0) {
      /* THE MIXED BED. The snowfall pays the kept subset and the chip has to
         say so, or the button's number reads as a promise about all of them. */
      cls = 'frost';
      html = `${Icons.get('snow')}<span><b>${b.keptRipe} kept</b>, ${b.ripe - b.keptRipe} ripe &mdash; <b>+${pct}%</b> on the kept ${b.keptRipe === 1 ? 'one' : 'ones'}</span>`;
    } else if (b.ripe > 0) {
      html = `${Icons.get('star')}<span><b>${b.ripe} ripe</b> &middot; ready to pick</span>`;
    } else if (b.tucked && b.soonest !== null) {
      /* A count is a status; a WAIT is an appointment, and the appointment is
         what makes Winter a place you come back to in the morning. */
      cls = 'tucked';
      html = `${Icons.get('clock')}<span><b>Tucked in</b> &mdash; first up in ${span(b.soonest)}</span>`;
    } else if (b.tucked) {
      cls = 'tucked';
      html = `${Icons.get('quilt')}<span><b>Tucked in</b>${b.planted ? ` &mdash; ${b.planted} growing` : ''}</span>`;
    } else if (b.planted > 0) {
      html = `${Icons.get('leaf')}<span><b>${b.planted} growing</b> &middot; tuck in for <b>+${pct}%</b> overnight</span>`;
    } else {
      html = `${Icons.get('leaf')}<span>Plant a bed, then <b>tuck it in</b> for <b>+${pct}%</b></span>`;
    }
    if (el.winterChip.dataset.sig !== cls + html) {
      el.winterChip.className = `wi-chip ${cls}`;
      el.winterChip.innerHTML = html;
      el.winterChip.dataset.sig = cls + html;
    }
    el.winterBoard.classList.toggle('armed', b.keptRipe > 0);
    /* ONE set of Zs for the whole BED rather than one per cell. The quilt is
       over the bed and not over a list, so the bed is what is asleep — and six
       cells each drifting their own Zs was six promoted layers and a busy
       board saying one thing six times. */
    el.winterBoard.classList.toggle('sleeping', b.tucked && b.planted > b.ripe);
    renderAction(b);
  }

  /* ---------- the one button below the board ----------
     ONE control, and its VERB is the bed's state: Tuck the bed in → Tucked in →
     Collect all. Fall's Collect All owns this strip and is capped at 132px by
     the band's two buttons, which are not hidden in Winter either; a second
     control here would fight it for the same clearance. Ruled at the spike
     gate, 2026-09-01.

     OUTSIDE the chip's `dataset.sig` guard on purpose: that guard skips the
     write whenever the chip's sentence is unchanged, and the value on this
     button moves with the bed while the sentence above it does not. */
  function renderAction(b) {
    const btn = el.winterAct;
    if (!btn) return;
    /* An empty, untucked bed gets no button at all — Fall hides Collect All
       when there is nothing to collect, and Winter hides the tuck when there
       is nothing to tuck. The chip teaches the rule either way. */
    if (!b.planted && !b.tucked && !b.ripe) {
      btn.hidden = true;
      btn.dataset.sig = '';
      return;
    }
    btn.hidden = false;
    let sig;
    let cls;
    let html;
    let label;
    if (b.ripe > 0) {
      const v = Game.winterBedValue();
      sig = `pay:${v.total}:${v.plots}:${v.kept}`;
      cls = 'wi-act pay';
      const pct = Math.round(WINTER().snowfall * 100);
      const doLine = v.kept === v.plots
        ? `${Icons.get('snow')}Collect all &middot; +${pct}%`
        : v.kept > 0
          ? `${Icons.get('snow')}Collect all &middot; ${v.kept} kept`
          : `${Icons.get('star')}Collect all`;
      html = `<span class="a-do">${doLine}</span><span class="a-val">+${fmt(v.total)}</span>`;
      label = `Collect all ${v.plots} ripe ${v.plots === 1 ? 'bloom' : 'blooms'} for ${fmt(v.total)} gold`
        + (v.kept ? `, ${v.kept} of them kept overnight` : '');
    } else if (b.tucked) {
      sig = 'rest';
      cls = 'wi-act rest';
      html = `<span class="a-do">${Icons.get('quilt')}Tucked in</span><span class="a-val">goodnight</span>`;
      label = 'The bed is tucked in for the night';
    } else {
      sig = 'tuck';
      cls = 'wi-act';
      html = `<span class="a-do">${Icons.get('quilt')}Tuck the bed in</span><span class="a-val">for the night</span>`;
      label = 'Tuck the bed in for the night';
    }
    if (btn.dataset.sig === sig) return;
    btn.dataset.sig = sig;
    btn.className = cls;
    btn.innerHTML = html;
    btn.setAttribute('aria-label', label);
  }

  /* ---------- per-cell render ---------- */
  function render() {
    if (!open) return;
    syncScene();
    const now = nowSec();
    const tucked = Game.winterTucked();
    ((S.winter && S.winter.grid) || []).forEach((c, i) => {
      const v = cellEls.get(i);
      if (!v) return;
      const def = c && c.seed ? plantById(c.seed) : null;
      const ready = Boolean(def) && now >= c.plantedAt + c.grow;
      const stage = ready ? 3 : (now - c.plantedAt) / c.grow < 0.5 ? 1 : 2;
      /* A plant under a standing quilt is drawn ASLEEP — shut-eye arcs on the
         bloom, which is the creature grammar redrawn for a plant. The look key
         carries it, or a bed that gets tucked keeps its open eyes until the
         species happens to change. */
      const asleep = Boolean(def) && tucked && !ready;
      const look = def ? `${def.id}:${stage}:${asleep ? 'z' : 'w'}` : 'empty';
      if (v.cache.look !== look) {
        v.slot.innerHTML = def ? Winter.bloom(def.id, stage, asleep) : '';
        v.cache.look = look;
      }
      const state = !def ? 'empty' : ready ? 'ready' : 'grow';
      if (v.cache.state !== state) {
        v.root.dataset.state = state;
        v.cache.state = state;
      }
      /* A kept plot wears a frost rim, so "which of these pays extra" is a
         thing you can see rather than a thing you have to remember. The rim is
         a BASE STYLE and the travelling glint is the flourish on top: a state
         whose only carrier is a keyframe is a state nobody with reduced motion
         on can see. */
      const kept = Boolean(c && c.kept);
      if (v.cache.kept !== kept) {
        v.root.classList.toggle('kept', kept);
        v.cache.kept = kept;
      }
      const quilted = Boolean(def) && tucked && !ready;
      if (v.cache.tucked !== quilted) {
        v.root.classList.toggle('tucked', quilted);
        v.cache.tucked = quilted;
      }
      let wait = '';
      if (def && !ready) wait = span(Math.max(1, Math.round(c.plantedAt + c.grow - now)));
      if (v.cache.wait !== wait) {
        v.wait.textContent = wait;
        v.wait.hidden = !wait;
        v.cache.wait = wait;
      }
      if (def && !ready) {
        v.bar.style.width = `${Math.round(Math.min(1, (now - c.plantedAt) / c.grow) * 100)}%`;
      }
    });
    renderChip();
  }

  /* ---------- input ---------- */
  function onCellTap(idx) {
    const c = ((S.winter && S.winter.grid) || [])[idx];
    const def = c && c.seed ? plantById(c.seed) : null;
    if (!def) { UI.openSheet('winterPlants', idx); return; }
    const now = nowSec();
    if (now < c.plantedAt + c.grow) {
      const p = FX.centerOf(cellEls.get(idx).root);
      /* Winter has no hasten — its clocks ARE the mechanic — but the same tap
         hastens in Summer, so the refusal has to say something. */
      FX.float(p.x, p.y, `Opens in ${span(c.plantedAt + c.grow - now)}`, '');
      FX.haptic(4);
      return;
    }
    const res = Game.winterHarvest(idx);
    if (!res) return;
    const p = FX.centerOf(cellEls.get(idx).root);
    FX.coins(p.x, p.y, res.kept ? 10 : 5);
    FX.float(p.x, p.y - 8, `+${fmt(res.payout)}`, res.kept ? 'crit' : '');
    Sound.play(res.kept ? 'crit' : 'coin');
    if (res.kept) FX.haptic([10, 40, 10]);
    if (res.firstLight) morningLine();
    render();
  }

  function onTuck() {
    if (Game.winterTucked()) { Sound.play('deny'); FX.haptic(4); return; }
    if (!Game.winterTuck()) { Sound.play('deny'); FX.shake(3); return; }
    const c = FX.centerOf(el.winterBoard);
    FX.ring(c.x, c.y, '#dbe8f2', 0.5, 130);
    Sound.play('open');
    FX.haptic(12);
    UI.say('hollyTuck', true);
    render();
  }

  /* ONE celebration, not eight. The engine commits the whole bed in one go and
     this celebrates it once, a rung above an ordinary kept plot: confetti and
     a ring where a single plot gets coins, and the toast that names the
     snowfall — which is the sentence the season is for. */
  function collectAll() {
    const res = Game.winterHarvestAll();
    if (!res) { Sound.play('deny'); FX.shake(4); return; }
    const c = FX.centerOf(el.winterBoard);
    FX.ring(c.x, c.y, res.kept ? '#eaf4fb' : '#ffc93c', 0.6, 150);
    FX.confetti(c.x, c.y, res.kept ? 22 : 14);
    FX.coins(c.x, c.y, 20);
    FX.float(c.x, c.y - 10, `+${fmt(res.payout)}`, res.kept ? 'crit' : '');
    FX.shake(res.kept ? 7 : 4);
    FX.haptic([20, 40, 20, 40, 40]);
    Sound.play(res.kept ? 'levelup' : 'coin');
    const pct = Math.round(WINTER().snowfall * 100);
    UI.toast({
      title: res.kept
        ? `${res.kept === res.plots ? 'The whole bed' : `${res.kept} kept`} &middot; +${fmt(res.payout)}`
        : `+${fmt(res.payout)}`,
      body: res.kept
        ? `${res.plots} ${res.plots === 1 ? 'bloom' : 'blooms'} collected — +${pct}% on the ${res.kept} that opened under the quilt`
        : `${res.plots} ${res.plots === 1 ? 'bloom' : 'blooms'} collected`,
      art: Icons.get(res.kept ? 'snow' : 'star')
    });
    if (res.firstLight) morningLine();
    render();
  }

  /* Holly gets the morning, and she is credited for it because the bed was
     tucked. Nothing here is load-bearing — the toast above already carried the
     number and the chip carried the rule. */
  function morningLine() {
    setTimeout(() => { if (open) UI.say('hollyMorning', true); }, 900);
  }

  /* ---------- open / close ---------- */
  function enter() {
    if (open) return;
    open = true;
    if (!built) { buildBoard(); built = true; }
    /* Bound on every entry, not once at build: leave() clears it, so a second
       visit left UI.flowerBtn() falling back to the garden's flower — which
       .in-winter has display:none'd — and every coin and float resolved
       against a 0x0 rect and fired from the screen corner. */
    UI.bindFlower($('#winterFlower'));
    el.game.classList.add('in-winter');
    el.winterLayer.hidden = false;
    syncScene();
    render();
    requestAnimationFrame(sizeBoard);
    UI.hideCoach();
    Sound.play('open');
    /* HOLLY'S INTRODUCTION, BEAT TWO — and the one-shot is consumed only after
       the line has ACTUALLY DRAWN. `UI.sayText()` returns whether it drew, and
       it refuses while a coach mark is up; consuming on the decision to speak
       rather than on the speaking is the meadow-signpost blocker exactly, and
       it cost that feature its first impression. */
    if (Game.hollyIntroPending()) introStep = 0;
    queueIntro();
  }

  /* Her intro is a short scripted run rather than one random line, so it is
     `UI.pickLine`'s deterministic index rather than `UI.say`'s random one —
     the same reason the Stand's customers use it. */
  let introStep = -1;
  let introTimer = 0;
  function queueIntro() {
    clearTimeout(introTimer);
    if (introStep < 0 || !open) return;
    const lines = (typeof FLOWER_LINES !== 'undefined' && FLOWER_LINES.hollyIntro) || [];
    if (introStep >= lines.length) {
      /* Every line has drawn. NOW the flag is spent. */
      Game.consumeHollyIntro();
      introStep = -1;
      return;
    }
    const drew = UI.sayText(lines[introStep], true);
    if (!drew) {
      /* Refused — a coach mark is up, or the bubble is busy. Try again rather
         than spending a line into a node nobody saw. */
      introTimer = setTimeout(queueIntro, 900);
      return;
    }
    introStep += 1;
    introTimer = setTimeout(queueIntro, 2900);
  }

  function leave() {
    if (!open) return;
    open = false;
    clearTimeout(introTimer);
    el.game.classList.remove('in-winter');
    el.winterLayer.hidden = true;
    UI.bindFlower(null);
  }

  /* ---------- wiring ---------- */
  function init() {
    if (!el.winterBoard) return;
    el.winterBoard.addEventListener('click', (e) => {
      const b = e.target.closest('[data-winter]');
      if (!b) return;
      onCellTap(Number(b.dataset.winter));
    });
    if (el.winterAct) {
      el.winterAct.addEventListener('click', () => {
        const b = Game.winterBedState();
        if (b.ripe > 0) collectAll();
        else onTuck();
      });
    }
    addEventListener('resize', () => { if (open) { sizeBoard(); syncScene(); } });
  }

  UI.enterWinter = enter;
  UI.leaveWinter = leave;
  UI.winterOpen = () => open;
  UI.renderWinter = render;
  UI.sizeWinterBoard = sizeBoard;
  UI.winterCollectAll = collectAll;
  UI.winterTuck = onTuck;
  UI.initWinter = init;
})();

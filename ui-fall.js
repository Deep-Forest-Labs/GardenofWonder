/* Garden Wonder — Fall, the second season.

   THE ARCHITECTURE, and it is the whole point: Fall is NOT a place layer like
   the meadow or the map. It is the same room with a different board in it.
   The HUD, the quest strip, the rail and the dock never move; `.stage` swaps
   its board and the scenery swaps behind it. That is "share the grammar, never
   share the verb" taken literally — a player walking sideways into Fall keeps
   every control they already know, and the only things that change are the
   material, the clock and the rule.

   It also means this file does NOT re-state the 560px column, because it never
   leaves `.ui`. A room built as a layer would have had to; that trap is what
   made the meadow read as a different, worse game before `.mw-ui` was written.

   What differs from Summer, and all of it is doc 32's:
     * the board is a woven trug on damp autumn earth, not a soil planter
     * the clocks are hours, not seconds
     * THE BED PAYS TOGETHER — every eligible plot planted and ripe pays +50%
     * the Century Bloom stands outside the bed's arithmetic entirely */

(() => {
  const { $, $$, S, el, fmt } = UI;
  /* Fall's clocks are hours, so it needs the hours-scale formatter — fmtTime
     tops out at minutes and would render a three-hour pumpkin as "180m". Read
     through UI at call time, never destructured: another ui-* file attaches it
     and load order is not ours to assume. */
  const span = (sec) => UI.fmtSpan(sec);
  const nowSec = () => Date.now() / 1000;

  let open = false;
  let sceneKey = '';
  let built = false;
  const cellEls = new Map();

  const FALL = () => DATA.fall;
  const plantById = (id) => FALL().plants.find((p) => p.id === id);

  /* ---------- the board ---------- */
  /* Built once and updated in place, never rebuilt on a tick: the meadow's
     hives were re-created from innerHTML every slow tick and place() sized them
     a frame later, so on a phone the pets flashed in and out. */
  function buildBoard() {
    const board = el.fallBoard;
    if (!board) return;
    board.innerHTML = '';
    cellEls.clear();
    for (let cell = 0; cell < 9; cell++) {
      if (cell === 4) {
        const mid = document.createElement('div');
        mid.className = 'fl-flower-cell';
        mid.innerHTML = `<button class="flower-btn fl-flower" id="fallFlower">${Flora.talkingFlower()}</button>`;
        board.appendChild(mid);
        continue;
      }
      const idx = cell < 4 ? cell : cell - 1;
      const b = document.createElement('button');
      b.className = 'fl-plot';
      b.dataset.fall = String(idx);
      b.innerHTML = `
        <span class="fl-floor">${Fall.cellFloor(idx)}</span>
        <span class="fl-slot"></span>
        <span class="fl-empty">${Icons.get('plantSpot')}</span>
        <span class="fl-ready">!</span>
        <span class="fl-wait" hidden></span>
        <span class="fl-bar"><i></i></span>`;
      board.appendChild(b);
      cellEls.set(idx, {
        root: b,
        slot: $('.fl-slot', b),
        wait: $('.fl-wait', b),
        bar: $('.fl-bar i', b),
        /* Seeded with values no state can produce. A cache initialised to ''
           never fires its first write for a state whose key is also '' — an
           empty plot's wait text — so the wait pill painted as an empty capsule
           on every ripe plot. Exactly the trap the docs record for
           `dataset.look`. */
        cache: { look: '?', wait: '?', state: '?', marked: null }
      });
    }
  }

  /* The garden's own rule, restated: CSS cannot express "square, fitting the
     smaller dimension of a flexible parent", so the frame is measured and the
     board is written explicit pixels. */
  function sizeBoard() {
    if (!el.fallFrame || !el.fallBoard) return;
    const r = el.fallFrame.getBoundingClientRect();
    const side = Math.max(150, Math.floor(Math.min(r.width, r.height)));
    el.fallBoard.style.width = `${side}px`;
    el.fallBoard.style.height = `${side}px`;
  }

  /* ---------- the scene ----------
     Memoised on the size AND the sky, because a resize has to redraw and
     because build() replaces the node the memo was taken against — the map
     drew a blank green field twice for exactly that reason. */
  function syncScene() {
    const host = el.fallScene;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const w = Math.max(320, Math.round(r.width));
    const h = Math.max(480, Math.round(r.height));
    const dock = el.dock ? Math.round(el.dock.getBoundingClientRect().height) || 96 : 96;
    const sky = Game.isNight() ? 'moon' : 'sun';
    const key = `${sky}|${w}|${h}|${dock}`;
    if (sceneKey === key && host.firstChild) return;
    sceneKey = key;
    host.innerHTML = Fall.scene({ width: w, height: h, dockHeight: dock, sky });
  }

  /* ---------- the bed, and its one rule ----------
     The windfall pays when every WINDFALL-ELIGIBLE plot is planted and ripe —
     eligible meaning "not the Century Bloom", which stands outside the count so
     a fortnight plant can never park the bonus. The chip below is the whole
     rule as one object, and it is the only thing standing between a player and
     harvesting at seven of eight. */
  function bedState() {
    /* load() rebuilds state.fall defensively, so this should never be empty —
       but the board must not be the thing that throws if it ever is. */
    const grid = (S.fall && S.fall.grid) || [];
    const now = nowSec();
    let eligible = 0;
    let planted = 0;
    let ripe = 0;
    let marked = 0;
    let soonest = null;
    let latest = null;
    grid.forEach((c) => {
      const def = c && c.seed ? plantById(c.seed) : null;
      /* The Century Bloom is not part of the bed in EITHER direction: it does
         not block the windfall and it does not collect it. So "all eight" means
         all eight unless one of them is the fortnight plant. */
      if (def && def.century) return;
      eligible += 1;
      if (!def) return;
      planted += 1;
      /* THE MARKS ARE THE PROMISE. checkFallWindfall() marks every eligible
         plot once per fill and refuses to mark again while any mark is unspent,
         so a bed that is planted and ripe is NOT necessarily a bed that will
         pay — and a bed being collected plot by plot still owes +50% on every
         plot it already marked. Reading the clock alone told both lies: it
         promised a windfall to a replanted plot that can never be marked, and
         it dropped the promise off seven plots that were about to keep it. */
      if (c.windfall) marked += 1;
      /* Ripeness is read from the clock, never from the cached `ready` flag —
         load() clears that, and the promise that a bed ripening while the tab
         was shut still pays depends on the clock being the authority. */
      if (now >= c.plantedAt + c.grow) ripe += 1;
      else {
        const left = c.plantedAt + c.grow - now;
        if (soonest === null || left < soonest) soonest = left;
        /* The bed arms when the LAST plot ripens, so the wait a full bed is
           counting down is the longest one, not the shortest. Getting this
           backwards would promise a windfall minutes before it could pay. */
        if (latest === null || left > latest) latest = left;
      }
    });
    return { eligible, planted, ripe, marked, soonest, latest,
      collecting: marked > 0,
      armed: marked === 0 && eligible > 0 && planted === eligible && ripe === eligible };
  }

  function renderBedChip() {
    if (!el.fallChip) return;
    const b = bedState();
    const pct = Math.round(FALL().windfall * 100);
    let cls = '';
    let html;
    if (b.marked >= b.eligible && b.eligible > 0) {
      /* Freshly marked, nothing collected yet: the moment of triumph, and it
         gets the celebratory sentence. */
      cls = 'armed';
      html = `${Icons.get('star')}The whole bed — <b>+${pct}%</b>`;
    } else if (b.collecting) {
      /* Mid-collection. Every marked plot still owes +50%, and nothing planted
         into the gaps joins this fill — the engine will not mark again until
         the last of these is picked, so the chip must not imply otherwise. */
      cls = 'armed';
      html = `${Icons.get('star')}<b>${b.marked}</b> still ${b.marked === 1 ? 'pays' : 'pay'} <b>+${pct}%</b>`;
    } else if (b.armed) {
      cls = 'armed';
      html = `${Icons.get('star')}The whole bed — <b>+${pct}%</b>`;
    } else if (b.planted === b.eligible && b.eligible - b.ripe === 1 && b.latest !== null) {
      /* One to go. A count is a status; a WAIT is an appointment, and the
         appointment is what makes Fall a place you come back to. */
      cls = 'close';
      html = `${Icons.get('clock')}<b>One more</b> in ${span(b.latest)} — then <b>+${pct}%</b>`;
    } else if (b.planted === b.eligible && b.latest !== null) {
      html = `${Icons.get('clock')}All ${b.eligible} in · ripe in ${span(b.latest)}`;
    } else if (b.planted === 0) {
      html = `${Icons.get('leaf')}Fill all ${b.eligible} for <b>+${pct}%</b>`;
    } else {
      html = `${Icons.get('leaf')}<b>${b.planted} / ${b.eligible}</b> planted · fill the bed for <b>+${pct}%</b>`;
    }
    if (el.fallChip.dataset.sig !== cls + html) {
      el.fallChip.className = `fl-chip ${cls}`;
      el.fallChip.innerHTML = html;
      el.fallChip.dataset.sig = cls + html;
    }
    el.fallBoard.classList.toggle('armed', b.armed || b.collecting);
  }

  /* ---------- per-cell render ---------- */
  function render() {
    if (!open) return;
    syncScene();
    const now = nowSec();
    ((S.fall && S.fall.grid) || []).forEach((c, i) => {
      const v = cellEls.get(i);
      if (!v) return;
      const def = c && c.seed ? plantById(c.seed) : null;
      const ready = Boolean(def) && now >= c.plantedAt + c.grow;
      const look = def ? `${def.id}:${ready ? 3 : (now - c.plantedAt) / c.grow < 0.5 ? 1 : 2}` : 'empty';
      if (v.cache.look !== look) {
        v.slot.innerHTML = def
          ? Fall.crop(def.id, ready ? 3 : (now - c.plantedAt) / c.grow < 0.5 ? 1 : 2)
          : '';
        v.cache.look = look;
      }
      const state = !def ? 'empty' : ready ? 'ready' : 'grow';
      /* A marked plot wears a gold ring, so "which of these still pays" is a
         thing you can see rather than a thing you have to remember. */
      const marked = Boolean(c && c.windfall);
      if (v.cache.marked !== marked) {
        v.root.classList.toggle('marked', marked);
        v.cache.marked = marked;
      }
      if (v.cache.state !== state) {
        v.root.dataset.state = state;
        v.root.classList.toggle('century', Boolean(def && def.century));
        v.cache.state = state;
      }
      let wait = '';
      if (def && !ready) {
        const left = Math.max(1, Math.round(c.plantedAt + c.grow - now));
        wait = def.century ? fallDays(left) : span(left);
      }
      if (v.cache.wait !== wait) {
        v.wait.textContent = wait;
        v.wait.hidden = !wait;
        v.cache.wait = wait;
      }
      if (def && !ready) {
        v.bar.style.width = `${Math.round(Math.min(1, (now - c.plantedAt) / c.grow) * 100)}%`;
      }
    });
    renderBedChip();
  }

  /* A fortnight is not read in hours. Round to whole days first, then say it —
     the same lesson as rounding hours and minutes separately. */
  function fallDays(seconds) {
    const days = Math.ceil(seconds / 86400);
    return days > 1 ? `${days}d left` : `${Math.max(1, Math.ceil(seconds / 3600))}h left`;
  }

  /* ---------- input ---------- */
  function onCellTap(idx) {
    const c = ((S.fall && S.fall.grid) || [])[idx];
    const def = c && c.seed ? plantById(c.seed) : null;
    if (!def) { UI.openSheet('crops', idx); return; }
    const now = nowSec();
    if (now < c.plantedAt + c.grow) {
      const p = FX.centerOf(cellEls.get(idx).root);
      /* Fall has no hasten — its clocks are the mechanic — but the same tap
         hastens in Summer, so the refusal has to say something rather than
         nothing. */
      FX.float(p.x, p.y, def.century
        ? 'Growing all fortnight'
        : `Ripe in ${span(c.plantedAt + c.grow - now)}`, '');
      FX.haptic(4);
      return;
    }
    const res = Game.fallHarvest(idx);
    if (!res) return;
    const p = FX.centerOf(cellEls.get(idx).root);
    FX.coins(p.x, p.y, res.windfall ? 10 : 5);
    FX.float(p.x, p.y - 8, `+${fmt(res.payout)}`, res.windfall ? 'crit' : '');
    Sound.play(res.windfall ? 'crit' : 'coin');
    if (res.windfall) FX.haptic([10, 40, 10]);
    render();
  }

  /* ---------- open / close ---------- */
  function enter() {
    if (open) return;
    open = true;
    if (!built) { buildBoard(); built = true; }
    /* Bound on every entry, not once at build. leave() clears it, so a second
       visit left UI.flowerBtn() falling back to the garden's flower — which
       .in-fall has display:none'd — and every coin, float and speech bubble
       resolved against a 0x0 rect and fired from the screen corner. The
       meadow avoids this by rebuilding its board on every enter; binding here
       is the same fix without the rebuild. */
    UI.bindFlower($('#fallFlower'));
    el.game.classList.add('in-fall');
    el.fallLayer.hidden = false;
    syncScene();
    render();
    requestAnimationFrame(sizeBoard);
    UI.hideCoach();
    Sound.play('open');
  }

  function leave() {
    if (!open) return;
    open = false;
    el.game.classList.remove('in-fall');
    el.fallLayer.hidden = true;
    UI.bindFlower(null);
    /* The garden re-sizes itself: a ResizeObserver on .stage fires when the
       frames swap back, which is the same path a rotation takes. */
  }

  /* ---------- wiring ---------- */
  function init() {
    if (!el.fallBoard) return;
    el.fallBoard.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fall]');
      if (!b) return;
      onCellTap(Number(b.dataset.fall));
    });
    addEventListener('resize', () => { if (open) { sizeBoard(); syncScene(); } });
  }

  UI.enterFall = enter;
  UI.leaveFall = leave;
  UI.fallOpen = () => open;
  UI.renderFall = render;
  UI.sizeFallBoard = sizeBoard;
  UI.initFall = init;
})();

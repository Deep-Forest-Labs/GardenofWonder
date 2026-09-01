/* Garden Wonder — the frame-rate readout. A development instrument, never a feature.

   Built for the Sky Pass performance pass: the owner holds a sky on the handset and
   reads what it costs. It answers one question a plain fps counter cannot — WHERE the
   frame went — by splitting every frame into three timelines:

     interval  the raw gap between rAF timestamps: what the hand actually feels
     js        our own work, top of `frame()` to bottom of it
     rest      interval - js: style, layout, paint, blend, composite — the engine's half

   A blend or an animated filter is large `rest` with small `js`. A recalc storm or a
   forced layout is large `js`. That split is the whole diagnosis, and it is the reason
   this file exists rather than a one-line fps average.

   NEVER SHIPS VISIBLE. Three gates: the flag starts false; the only entry is the dev
   sheet, which sits behind the invisible dev dot; and the flag is a module `let` rather
   than a saved preference, so every reload turns it off and the save schema never
   learns this file exists.

   Costs nothing when off — `frame()` returns on its first line — and about five
   microseconds when on: two clock reads, three array increments, no allocation. The
   histograms are fixed Int32Arrays sized once at load, because an instrument that
   allocates is measuring itself. Nothing here may call `getComputedStyle` or
   `getBoundingClientRect`: both force the very flush the readout is hunting.

   Reaches the rest of the UI through the `UI` global — see docs/02-architecture.md. */

(() => {
  /* Two resolutions in one array: 0.25ms steps up to 80ms, where a phone lives and a
     quarter of a millisecond is worth seeing, then 5ms steps up to 480ms, where nothing
     is worth measuring finely but the number still has to be true. A single range fine
     enough for the first is too short for the second, and a frame that overflows the
     top reports as the ceiling — which is how a sky ten times over budget can read as
     merely bad. Percentiles are a forward scan at report time, so the per-frame path
     stays one increment. */
  const FINE = 320;             // 0..80ms at 0.25ms
  const COARSE = 80;            // 80..480ms at 5ms
  const BUCKETS = FINE + COARSE;
  const hInt = new Int32Array(BUCKETS);
  const hJs = new Int32Array(BUCKETS);
  const hRest = new Int32Array(BUCKETS);
  const bucketOf = (ms) => (ms < 80
    ? Math.max(0, (ms * 4) | 0)
    : Math.min(BUCKETS - 1, FINE + (((ms - 80) / 5) | 0)));
  const msOf = (i) => (i < FINE ? i / 4 : 80 + (i - FINE) * 5);

  /* A sky's arrival pays one-off costs — seeding the drop pool, the first rasterisation
     of a layer, the promotion of a new animation — that are real but are not what the
     sky COSTS to hold. They are counted apart rather than averaged into the steady state. */
  const SETTLE_MS = 500;

  let on = false;
  let node = null;
  let label = 'clear';
  let startedAt = 0;
  let settleUntil = 0;
  let prevNow = 0;
  let n = 0;
  let sum = 0;
  let worst = 0;
  let over1x = 0;
  let over2x = 0;
  let settleN = 0;
  let settleWorst = 0;
  let minInterval = Infinity;
  let paintAcc = 0;
  let lastSky = '';
  let lastPhase = '';
  /* rAF does not fire while the tab is hidden, so coming back produces one enormous
     gap that is an absence rather than a dropped frame. The flag throws that one frame
     away; everything else is counted however bad it is, because a bench measuring a
     genuinely 400ms frame must not silently discard it as an absence. */
  let returned = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) returned = true; });

  const push = (h, ms) => { h[bucketOf(ms)] += 1; };

  function pct(h, p) {
    if (!n) return 0;
    const want = n * p;
    let seen = 0;
    for (let i = 0; i < BUCKETS; i += 1) {
      seen += h[i];
      if (seen >= want) return msOf(i);
    }
    return msOf(BUCKETS - 1);
  }

  /* A base iPhone 16 runs at 60Hz and a 16 Pro at 120Hz, and a readout that hardcodes
     16.7ms would call a Pro dropping half its frames flawless. The budget is read off
     the fastest frame the window actually saw, snapped to the three refresh rates a
     phone has. */
  const RATES = [16.67, 11.11, 8.33];
  function budget() {
    if (!Number.isFinite(minInterval)) return RATES[0];
    let best = RATES[0];
    for (const r of RATES) if (Math.abs(r - minInterval) < Math.abs(best - minInterval)) best = r;
    return best;
  }

  function reset(tag) {
    hInt.fill(0); hJs.fill(0); hRest.fill(0);
    n = 0; sum = 0; worst = 0; over1x = 0; over2x = 0;
    settleN = 0; settleWorst = 0;
    minInterval = Infinity;
    startedAt = performance.now();
    settleUntil = startedAt + SETTLE_MS;
    if (typeof tag === 'string') label = tag;
    prevNow = 0;
    returned = false;
  }

  /* Called from the very top and the very bottom of `ui.js`'s `frame()`. `now` is the
     rAF timestamp — the raw one, because ui.js clamps its own dt to 0.1 and a clamped
     delta cannot report a dropped frame. `t0` is the clock at the top of that frame. */
  function frame(now, t0) {
    if (!on) return;
    const js = performance.now() - t0;
    if (returned) { returned = false; prevNow = now; return; }
    if (prevNow) {
      const interval = now - prevNow;
      if (interval > 0) {
        if (interval < minInterval) minInterval = interval;
        if (now < settleUntil) {
          settleN += 1;
          if (interval > settleWorst) settleWorst = interval;
        } else {
          const rest = Math.max(0, interval - js);
          push(hInt, interval);
          push(hJs, js);
          push(hRest, rest);
          n += 1;
          sum += interval;
          if (interval > worst) worst = interval;
          const b = budget();
          if (interval > b * 1.5) over1x += 1;
          if (interval > b * 2.5) over2x += 1;
        }
      }
    }
    prevNow = now;

    /* The panel is written four times a second, not sixty. One `textContent` write on
       an element that owns its own tile, and the string is built from numbers already
       in hand — no measurement, no layout read. */
    paintAcc += 1;
    if (paintAcc >= 15) { paintAcc = 0; tick(); }
  }

  /* The sky is read off the attribute rather than asked of the engine, because reading
     a dataset key forces nothing. A sky or phase change starts a fresh window, so each
     one gets its own baseline without the owner touching anything. */
  function tick() {
    // Only while the panel is up. A bench sets its own label and wants ONE window; a
    // reset it did not ask for would cut its sample in half and say nothing about it.
    if (!node || node.hidden) return;
    const g = UI.el.game;
    const sky = g.dataset.weather || 'clear';
    const phase = g.dataset.wxPhase || 'idle';
    if (sky !== lastSky || phase !== lastPhase) {
      lastSky = sky; lastPhase = phase;
      reset(`${sky}/${phase}`);
    }
    node.textContent = line();
  }

  function report() {
    const g = UI.el.game;
    const b = budget();
    const p50 = pct(hInt, 0.5);
    const cv = FX.canvasInfo;
    return {
      label,
      ms: Math.round(performance.now() - startedAt),
      n,
      budget: +b.toFixed(2),
      fps: p50 > 0 ? +(1000 / p50).toFixed(1) : 0,
      interval: {
        p50: +p50.toFixed(2),
        p95: +pct(hInt, 0.95).toFixed(2),
        max: +worst.toFixed(1),
        // Exact, and the only number here a bucket ceiling cannot flatten.
        mean: n ? +(sum / n).toFixed(2) : 0
      },
      js: { p50: +pct(hJs, 0.5).toFixed(2), p95: +pct(hJs, 0.95).toFixed(2) },
      rest: { p50: +pct(hRest, 0.5).toFixed(2), p95: +pct(hRest, 0.95).toFixed(2) },
      over1x,
      over2x,
      settle: { n: settleN, worst: +settleWorst.toFixed(1) },
      sky: g.dataset.weather || 'clear',
      phase: g.dataset.wxPhase || 'idle',
      night: g.dataset.wxNight === '1',
      sunbreak: g.dataset.sunbreak === '1',
      dpr: cv.dpr,
      canvas: { w: cv.w, h: cv.h },
      wx: FX.weatherCount,
      fx: FX.partCount
    };
  }

  // Six lines, one write. Tabular figures, so a number changing does not move the row.
  function line() {
    const r = report();
    return [
      `fps ${r.fps}  int ${r.interval.p50}  hz ${Math.round(1000 / r.budget)}`,
      `p50 ${r.interval.p50} p95 ${r.interval.p95} max ${r.interval.max}`,
      `js   ${r.js.p50} / ${r.js.p95}   n ${r.n}`,
      `rest ${r.rest.p50} / ${r.rest.p95}   >1.5x ${r.over1x} >2.5x ${r.over2x}`,
      `${r.sky}/${r.phase} night${r.night ? 1 : 0} sun${r.sunbreak ? 1 : 0}`,
      `dpr ${r.dpr} cv ${r.canvas.w}x${r.canvas.h} wx ${r.wx} fx ${r.fx}`
    ].join('\n');
  }

  /* The overlay is the LAST child of `#game`, a sibling of `#world`. Not inside
     `#world`: a fixed element inside a transformed ancestor is positioned against that
     ancestor, so it would ride every shake frame. Not inside `.wx`: everything in that
     box joins a blending group nothing may disturb. And it carries no filter, no blend
     and no shadow of its own — an instrument that costs what it is measuring reads its
     own reflection. */
  function mount() {
    if (node) return;
    node = document.createElement('div');
    node.className = 'perf-hud';
    node.setAttribute('aria-hidden', 'true');
    // Reachable with the sheet closed, because the sheet cannot be open while a sky is
    // being watched — and a window that cannot be restarted is a window of one sky.
    node.addEventListener('pointerdown', (e) => { e.stopPropagation(); reset(); });
    UI.el.game.appendChild(node);
  }

  function start() {
    mount();
    on = true;
    node.hidden = false;
    reset(UI.el.game.dataset.weather || 'clear');
  }

  function stop() {
    on = false;
    if (node) node.hidden = true;
  }

  UI.perf = {
    start,
    stop,
    toggle() { if (on) stop(); else start(); return on; },
    // The bench's entry: sample without putting the panel in the screenshot.
    sample(tag) { on = true; reset(tag); },
    on: () => on,
    reset,
    frame,
    report,
    line
  };
})();

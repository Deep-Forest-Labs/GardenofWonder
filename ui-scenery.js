/* Garden Wonder — the sky, the clouds and the weather tint.

   Everything that paints the world behind the interface. Reaches the rest of the UI through the
   `UI` global — see docs/02-architecture.md. */

(() => {
  const { el } = UI;

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

  /* `ui-shared.js` caches `#sky` and the clouds but not these two; looked up once here
     rather than added there, because nothing else in the UI wants them. */
  let celestial = null;
  let starsNode = null;
  const celestialEl = () => (celestial || (celestial = document.getElementById('celestial')));
  const starsEl = () => (starsNode || (starsNode = document.getElementById('stars')));

  function updateSky() {
    const t = Game.dayPhase();
    let i = 0;
    while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].t <= t) i += 1;
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    const k = (t - a.t) / (b.t - a.t);
    /* Each value is written on the element that reads it, never on the root.

       These seven used to go on `document.documentElement`, which makes the whole
       document re-resolve its inherited custom properties — measured at 3.7ms a call
       against 0.19ms for the same seven values written here, and this runs on the 0.6s
       tier for as long as the game is open. The `:root` defaults in `style.css` stay
       where they are: they are what paints the first frame before this ever runs.

       The three sky stops are read only by `.sky`, the sun's colour and position only by
       `.celestial`, and the star opacity only by `.stars` (including the aurora's
       brightened version, which is the same element). Checked by grep, not assumed. */
    const sky = el.sky.style;
    sky.setProperty('--sky1', mix(a.s1, b.s1, k));
    sky.setProperty('--sky2', mix(a.s2, b.s2, k));
    sky.setProperty('--sky3', mix(a.s3, b.s3, k));
    const cel = celestialEl().style;
    cel.setProperty('--sun-c', mix(a.sun, b.sun, k));
    cel.setProperty('--sun-x', (a.sx + (b.sx - a.sx) * k).toFixed(1) + '%');
    cel.setProperty('--sun-y', (a.sy + (b.sy - a.sy) * k).toFixed(1) + '%');
    starsEl().style.setProperty('--star-op', (a.star + (b.star - a.star) * k).toFixed(2));
    /* Reads computed style, so it has to come AFTER the writes and used to force the
       recalc they had just invalidated. With the writes on leaves it finds style clean. */
    setThemeColor(seasonMix(weatherMix(mix(a.s1, b.s1, k))));
  }

  /* The strip iOS draws above an installed app is painted from `theme-color`, and
     it is the only pixel of that strip we control — the window itself starts below
     it. So it carries the top of the sky, or it reads as a band of something else
     stuck above the game.

     Rewriting the attribute is not always enough: a browser that snapshotted the
     value at launch keeps showing that snapshot while the sky moves on, which is a
     stale sunset sitting over a midnight sky. Re-inserting the element is the
     nudge that makes it re-read. Only on a visible change, since this runs every
     0.6s and the sky moves in fractions of a channel. */
  let themeNow = '';
  function setThemeColor(rgb) {
    if (rgb === themeNow) return;
    const was = themeNow.match(/\d+/g);
    const now = rgb.match(/\d+/g);
    if (was && now && now.every((v, i) => Math.abs(v - was[i]) < 2)) return;
    themeNow = rgb;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', rgb);
    meta.parentNode.insertBefore(meta, meta.nextSibling);
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

  /* The sky is the only cue for ordinary weather — a banner four times an hour would be noise.
     Rare weather earns a line from the flower. */
  /* The season tint is a multiply over the whole scene, and the status-bar
     strip is painted from `theme-color` — which is written from here. If only
     one of them is tinted, the strip stops matching the sky it sits above, and
     doc 08 spends four bullets and three rounds of layout work on exactly that
     class of join. `mix()` hands us an rgb() string, so this works in the same
     space; multiply is per channel, c * ((1-a) + a*t/255). */
  const TINT_RGB = [255, 176, 102];   /* #ffb066, DATA.year.seasonTint */
  function seasonMix(rgb) {
    const amt = typeof UI.seasonAmount === 'function' ? UI.seasonAmount() : 0;
    if (!(amt > 0)) return rgb;
    const c = (rgb.match(/\d+/g) || []).map(Number);
    if (c.length < 3) return rgb;
    const out = c.slice(0, 3).map((v, i) =>
      Math.max(0, Math.min(255, Math.round(v * ((1 - amt) + amt * (TINT_RGB[i] / 255))))));
    return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
  }

  /* THE WEATHER JOIN. The strip is painted from the top of the sky with the
     season multiply folded in, and a sky heavy enough to recolour the scene has
     to join that multiply or the notch desyncs — the exact class of bug doc 08
     spent four rounds on.

     Computed from the layers themselves rather than from a second table of
     colours: the tint comes out of the same custom property the layer paints
     with, and the strength is the layer's own live opacity, mid-transition and
     all. So a sky that fades in fades in up here too, a value the owner retunes
     carries through, and there is no second copy to drift. It answers for the
     TOP of the sky only, which is all the strip ever shows. */
  const wxEls = {};
  const wxEl = (sel) => {
    if (!wxEls[sel]) wxEls[sel] = document.querySelector(sel);
    return wxEls[sel];
  };
  const alphaOf = (sel) => {
    const node = wxEl(sel);
    if (!node) return 0;
    const v = parseFloat(getComputedStyle(node).opacity);
    return isFinite(v) ? v : 0;
  };
  const tokenRgb = (name, fallback) => {
    const v = getComputedStyle(el.game).getPropertyValue(name).trim();
    if (!v) return fallback;
    if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
    const n = (v.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return n.length === 3 ? n : fallback;
  };
  const chMul = (a, b) => a.map((v, i) => v * b[i] / 255);
  const chScreen = (a, b) => a.map((v, i) => 255 - (255 - v) * (255 - b[i]) / 255);
  const chLerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, k)));

  function weatherMix(rgb) {
    const sky = el.game.dataset.weather;
    if (!sky || sky === 'clear') return rgb;
    const base = (rgb.match(/\d+/g) || []).map(Number);
    if (base.length < 3) return rgb;
    let out = base.slice(0, 3);
    if (sky === 'rain' || sky === 'storm') {
      out = chLerp(out, chMul(out, tokenRgb('--wxr-wash-a', [109, 130, 154])), alphaOf('.wx-wash'));
    } else if (sky === 'aurora') {
      /* .94 is the dusk gradient's own top stop — the layer's opacity is only
         half of how far it commits. */
      out = chLerp(out, chMul(out, [19, 42, 82]), alphaOf('.wx-dusk') * 0.94);
      out = chLerp(out, chScreen(out, tokenRgb('--wx-aurora-1', [95, 240, 182])),
        alphaOf('.wx-ribbon') * 0.35);
    } else if (sky === 'wonderfall') {
      out = chLerp(out, chScreen(out, [255, 107, 107]), alphaOf('.wx-veil'));
    }
    const c = out.map((v) => Math.max(0, Math.min(255, Math.round(v))));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function paintWeather(w) {
    /* The tail of a sky is still that sky: `[data-wx-phase="end"]` paints the
       parting clouds and the fading wash from `data-weather`, so `ui-weather.js`
       keeps the outgoing id until the sky has finished and hands it over then.
       The flat tint is NOT held with it — that one belongs to the sky actually
       standing, and the staged wash is what fades. */
    if (!(UI.wxHoldsSky && UI.wxHoldsSky())) el.game.dataset.weather = w.id;
    if (w.tint) el.game.style.setProperty('--weather-tint', w.tint);
    else el.game.style.removeProperty('--weather-tint');
  }


  /* A HEDGE, and the shape a gate is made of. Drawn as a mass with a lumpy
     crown rather than a green rectangle — doc 05's grass lesson applied to a
     bigger silhouette: a band is a mat with things growing out of it, and a
     flat-topped slab reads as a card. `preserveAspectRatio="none"` lets it fill
     any gate opening, and `vector-effect="non-scaling-stroke"` keeps the ink
     even while it does. Shared, because the ceremony's gate card and the season
     gates are the same object seen at two sizes. */
  function hedge(flip) {
    const body = 'M0 108 V54 Q4 34 20 36 Q26 16 46 22 Q62 8 78 22 Q98 16 106 38 Q124 40 128 58 V108 Z';
    return `<svg class="hedge-svg" viewBox="0 0 128 108" preserveAspectRatio="none" aria-hidden="true"
      style="transform:scaleX(${flip ? -1 : 1})">
      <path d="${body}" fill="#3f7d43" stroke="#2c1a10" stroke-width="4" stroke-linejoin="round"
        vector-effect="non-scaling-stroke"/>
      <path d="M0 70 V54 Q4 34 20 36 Q26 16 46 22 Q62 8 78 22 Q98 16 106 38 Q124 40 128 58 V70
               Q96 62 64 70 Q32 78 0 70 Z"
        fill="#57a25c" stroke="#2c1a10" stroke-width="2.6" stroke-linejoin="round"
        vector-effect="non-scaling-stroke"/>
      <path d="M0 108 V96 Q32 88 64 96 Q96 104 128 96 V108 Z" fill="#2f6236" opacity=".8"/>
      <!-- No blossom dots. This shape is used at two very different aspects —
           a 42%-wide card panel and a full-width gate screen — and
           preserveAspectRatio="none" turns any circle into a tell-tale
           ellipse. The lumps and the bands survive stretching; a circle does
           not. -->
    </svg>`;
  }

  UI.updateSky = updateSky;
  UI.buildClouds = buildClouds;
  UI.paintWeather = paintWeather;
  UI.hedge = hedge;
  UI.seasonMix = seasonMix;
})();

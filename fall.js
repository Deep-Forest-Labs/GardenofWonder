/* Garden Wonder — Fall's art.

   The same job meadow.js does for the Wild Meadow: the scene behind the board,
   the board's own floor, and the plants that stand in it. No DOM, no game
   state, no economy — this file draws.

   THE ONE RULE THIS FILE EXISTS TO OBEY: a room's scene is drawn at the size
   the room actually measures, 1:1, and everything inside it is positioned as a
   fraction of that size. A composition made at 390x844 and rendered with
   preserveAspectRatio="slice" does not crop, it SCALES — at 1440 wide the grass
   becomes a hedge and the tree fills a third of the screen. That mistake
   shipped in the meadow and read as a prototype.

   The second rule, from docs/32: a season is a speed and a rule, never a
   re-skin. Fall's board is the garden's construction in a different material —
   a woven trug on damp autumn earth, because the verb here is "fill it and
   carry the whole thing in" rather than "dig it, plant it, clear it". */

const Fall = (() => {
  const INK = '#2c1a10';

  /* A reference composition only. Never a viewBox for a real room. */
  const VIEW = { w: 390, h: 844 };

  const SKIES = {
    sun: {
      sky1: '#8fbfd8', sky2: '#cfe0e6', sky3: '#ffe3bd',
      hillFar: '#b4713a', hillNear: '#96562c',
      ground: '#8f9c4a', groundDark: '#7d8b40', groundLight: '#a3ae5a',
      hedge: '#3f7d43', hedgeLit: '#57a25c', hedgeDark: '#2f6236',
      trunk: '#7d4f2a', canopy: '#c9622f', canopyLit: '#e0803c',
      leaf: '#d9773a', haze: 'rgba(255,214,160,.35)'
    },
    moon: {
      sky1: '#26304f', sky2: '#3b4568', sky3: '#5d5570',
      hillFar: '#4a3450', hillNear: '#3a2a42',
      ground: '#3f4a38', groundDark: '#354030', groundLight: '#4a5741',
      hedge: '#2b5230', hedgeLit: '#376a3c', hedgeDark: '#1f3c25',
      trunk: '#4a3020', canopy: '#7a3f28', canopyLit: '#94513200',
      leaf: '#8a4c2c', haze: 'rgba(120,120,190,.25)'
    }
  };

  const r2 = (n) => Math.round(n * 100) / 100;

  /* ---------- the scene ----------
     Back to front: sky, haze, far hills, a hedge line along the horizon, two
     orchard trees, the ground band, and leaves in the air. Every y is a
     fraction of the measured height so a tall window gets more sky rather than
     a scaled-up tree. */
  function scene({ width, height, dockHeight = 96, sky = 'sun' } = {}) {
    const w = Math.max(320, Math.round(width || VIEW.w));
    const h = Math.max(480, Math.round(height || VIEW.h));
    const P = SKIES[sky] || SKIES.sun;
    const horizon = Math.round(h * 0.30);
    const groundTop = Math.round(h * 0.62);
    const floor = h - dockHeight;

    /* Density scales with width so a wide window gets more of everything
       rather than bigger everything. */
    const dense = (per) => Math.max(3, Math.round(w / per));

    const hills = `
      <path d="M${-w * 0.1} ${horizon + 40} Q${w * 0.22} ${horizon - 34} ${w * 0.5} ${horizon + 22}
               Q${w * 0.78} ${horizon + 62} ${w * 1.1} ${horizon + 6} V${h} H${-w * 0.1} Z"
            fill="${P.hillFar}"/>
      <path d="M${-w * 0.1} ${horizon + 74} Q${w * 0.34} ${horizon + 14} ${w * 0.66} ${horizon + 66}
               Q${w * 0.88} ${horizon + 96} ${w * 1.1} ${horizon + 56} V${h} H${-w * 0.1} Z"
            fill="${P.hillNear}"/>`;

    /* The hedge line along the horizon — the same silhouette the season gates
       use, laid out flat. It is what makes the season read as enclosed. */
    let hedge = '';
    const hedgeW = Math.round(w / dense(150));
    for (let x = -hedgeW; x < w + hedgeW; x += hedgeW) {
      const lift = 8 + ((x / hedgeW) % 3) * 5;
      hedge += `<path d="M${x} ${groundTop + 10} V${groundTop - 18 - lift}
        Q${x + hedgeW * 0.18} ${groundTop - 38 - lift} ${x + hedgeW * 0.4} ${groundTop - 30 - lift}
        Q${x + hedgeW * 0.68} ${groundTop - 46 - lift} ${x + hedgeW} ${groundTop - 20 - lift}
        V${groundTop + 10} Z" fill="${P.hedge}"/>`;
    }
    hedge += `<rect x="${-4}" y="${groundTop - 16}" width="${w + 8}" height="9" fill="${P.hedgeLit}" opacity=".55"/>`;

    /* Two trees, offset from the RIGHT edge and the horizon so a wide window
       moves them apart rather than stretching them. The keeper is the ruler:
       a trunk is about a creature and a half. */
    const tree = (cx, cy, s) => `
      <g transform="translate(${r2(cx)} ${r2(cy)}) scale(${s})">
        <path d="M0 0 V-58" stroke="${P.trunk}" stroke-width="13" stroke-linecap="round"/>
        <path d="M0 -34 L-18 -50 M0 -44 L16 -58" stroke="${P.trunk}" stroke-width="8" stroke-linecap="round"/>
        <circle cx="-16" cy="-72" r="26" fill="${P.canopy}"/>
        <circle cx="18" cy="-78" r="30" fill="${P.canopy}"/>
        <circle cx="2" cy="-96" r="26" fill="${P.canopyLit}"/>
        <circle cx="-24" cy="-88" r="17" fill="${P.canopyLit}"/>
      </g>`;

    /* The ground is a mass first and blades second: a dark back mat, the
       stubble, then a lighter front mat over their feet, so the blades read as
       the top of something dense instead of sticks planted in mid-air. */
    let stubble = '';
    const step = Math.max(9, Math.round(w / dense(26)));
    for (let x = 0; x < w + step; x += step) {
      const y = groundTop + 6 + ((x / step) % 4) * 5;
      stubble += `<path d="M${x} ${y + 12} V${y} M${x - 3} ${y + 12} V${y + 4} M${x + 3} ${y + 12} V${y + 3}"
        stroke="${P.groundDark}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
    }

    let leaves = '';
    const LEAF_N = Math.max(4, Math.round(w / 90));
    for (let i = 0; i < LEAF_N; i++) {
      const x = r2(((i * 137) % 100) / 100 * w);
      const y = r2(horizon + ((i * 53) % 100) / 100 * (groundTop - horizon));
      const rot = (i * 47) % 360;
      leaves += `<path d="M0 0 q7 -6 13 0 q-6 7 -13 0Z" fill="${P.leaf}" opacity=".75"
        transform="translate(${x} ${y}) rotate(${rot})"/>`;
    }

    return `<svg class="fall-scene" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"
      preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fall-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${P.sky1}"/>
          <stop offset="0.55" stop-color="${P.sky2}"/>
          <stop offset="1" stop-color="${P.sky3}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#fall-sky)"/>
      <ellipse cx="${r2(w * 0.74)}" cy="${r2(h * 0.13)}" rx="${r2(w * 0.26)}" ry="${r2(h * 0.09)}"
        fill="${P.haze}"/>
      ${hills}
      ${tree(w - 46, groundTop - 4, 1)}
      ${tree(w - 128, groundTop + 6, 0.72)}
      ${hedge}
      <rect x="0" y="${groundTop}" width="${w}" height="${h - groundTop}" fill="${P.ground}"/>
      <rect x="0" y="${groundTop}" width="${w}" height="10" fill="${P.groundLight}" opacity=".6"/>
      ${stubble}
      <rect x="0" y="${floor - 30}" width="${w}" height="${h - floor + 30}" fill="${P.groundDark}" opacity=".45"/>
      ${leaves}
    </svg>`;
  }

  /* ---------- the trug's floor ----------
     A cell's ground, so nothing in it stands on a shadow. Damp autumn earth
     with a lighter worn pad where the crop sits: the pad is the ground and the
     shadow goes on top of it. */
  function cellFloor(i) {
    const tilt = (i % 3) * 4 - 4;
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" class="fp-floor">
      <rect x="0" y="0" width="100" height="100" fill="#5f4630"/>
      <rect x="0" y="0" width="100" height="100" fill="url(#fp-grain)" opacity=".5"/>
      <ellipse cx="50" cy="${78 + tilt * 0.3}" rx="21" ry="7.5" fill="#7b5c3f" opacity=".6"/>
      <ellipse cx="${34 + tilt}" cy="34" rx="9" ry="6" fill="#71543a" opacity=".6"/>
      <ellipse cx="${70 - tilt}" cy="54" rx="7" ry="5" fill="#4d3826" opacity=".55"/>
    </svg>`;
  }

  /* One hidden defs block, injected once, so eight cells share one grain
     pattern instead of carrying eight copies of it. */
  function defs() {
    return `<svg id="fall-defs" aria-hidden="true" style="position:absolute;width:0;height:0">
      <defs>
        <pattern id="fp-grain" width="14" height="14" patternUnits="userSpaceOnUse"
          patternTransform="rotate(96)">
          <rect width="14" height="14" fill="none"/>
          <rect width="3" height="14" fill="rgba(255,255,255,.06)"/>
        </pattern>
      </defs>
    </svg>`;
  }

  /* ---------- the crops ----------
     Crops are not flowers, and they are deliberately not DRAWN like flowers:
     a berry on a stem, a gourd, an ear of wheat — never a radial bloom. The
     rule doing visual work, so the board reads as another kind of garden
     before a single label is read. Three growth stages, like the garden's. */
  const PLANTS = {
    strawberry:   { leaf: '#3f9d45', body: '#e8453c', pip: '#fff3bf', shape: 'berry' },
    mint:         { leaf: '#2f9e44', body: '#51cf66', pip: '#c9f5cf', shape: 'sprig' },
    chamomile:    { leaf: '#8fe08a', body: '#fff3bf', pip: '#ffd43b', shape: 'cluster' },
    brambleberry: { leaf: '#2f9e44', body: '#5f3dc4', pip: '#b197fc', shape: 'cluster' },
    pumpkin:      { leaf: '#2f9e44', body: '#ff922b', pip: '#e8590c', shape: 'gourd' },
    elderflower:  { leaf: '#69db7c', body: '#fdfdfd', pip: '#f1f3f5', shape: 'cluster' },
    apple:        { leaf: '#2f9e44', body: '#e03131', pip: '#ffc9c9', shape: 'tree' },
    wheat:        { leaf: '#e8a33d', body: '#ffd43b', pip: '#f59f00', shape: 'ear' },
    century:      { leaf: '#845ef7', body: '#b197fc', pip: '#efe7ff', shape: 'century' }
  };

  function crop(id, stage) {
    const p = PLANTS[id] || PLANTS.strawberry;
    const s = stage === undefined ? 3 : stage;
    const stemTop = s === 1 ? 74 : s === 2 ? 56 : 42;
    const stem = `
      <path d="M50 94 V${stemTop}" stroke="${p.leaf}" stroke-width="7" stroke-linecap="round"/>
      <path d="M50 76 c-13 0-21-7-23-17 12-2 21 4 23 17Z" fill="${p.leaf}"
        stroke="${INK}" stroke-width="3"/>`;
    if (s === 1) return wrap(stem);

    let head = '';
    if (p.shape === 'berry') {
      head = `<path d="M50 22 c14 0 22 11 22 22 0 13-10 24-22 24S28 57 28 44c0-11 8-22 22-22Z"
          fill="${p.body}" stroke="${INK}" stroke-width="3.4"/>
        ${[[42,36],[58,38],[50,50],[38,50],[62,52]].map(([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="2.6" fill="${p.pip}"/>`).join('')}`;
    } else if (p.shape === 'gourd') {
      head = `<ellipse cx="50" cy="44" rx="28" ry="22" fill="${p.body}" stroke="${INK}" stroke-width="3.4"/>
        <path d="M40 26 c-3 12-3 24 0 36 M60 26 c3 12 3 24 0 36" stroke="${p.pip}" stroke-width="2.6"
          fill="none" opacity=".7"/>
        <path d="M50 22 v-8" stroke="${p.leaf}" stroke-width="5" stroke-linecap="round"/>`;
    } else if (p.shape === 'cluster') {
      head = [[36, 34], [52, 28], [66, 38], [43, 48], [59, 50]].map(([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="10" fill="${p.body}" stroke="${INK}" stroke-width="3"/>`).join('')
        + `<circle cx="52" cy="38" r="4" fill="${p.pip}"/>`;
    } else if (p.shape === 'ear') {
      head = [0, 1, 2, 3].map((i) =>
        `<ellipse cx="${43 + (i % 2) * 14}" cy="${26 + i * 11}" rx="9" ry="7.5"
           fill="${p.body}" stroke="${INK}" stroke-width="3"/>`).join('')
        + `<path d="M50 60 V22" stroke="${p.pip}" stroke-width="2.6"/>`;
    } else if (p.shape === 'tree') {
      head = `<circle cx="50" cy="36" r="26" fill="${p.leaf}" stroke="${INK}" stroke-width="3.4"/>
        <circle cx="40" cy="34" r="8" fill="${p.body}" stroke="${INK}" stroke-width="2.6"/>
        <circle cx="60" cy="42" r="8" fill="${p.body}" stroke="${INK}" stroke-width="2.6"/>
        <circle cx="53" cy="24" r="7" fill="${p.body}" stroke="${INK}" stroke-width="2.6"/>`;
    } else if (p.shape === 'century') {
      /* The fortnight plant. It is not a crop and it should not look like one:
         a slow spire, lit from inside, unmistakable in a bed of berries. */
      head = `<path d="M50 8 L62 44 H38 Z" fill="${p.body}" stroke="${INK}" stroke-width="3.4"/>
        <circle cx="50" cy="20" r="6" fill="${p.pip}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M38 44 q12 10 24 0" fill="${p.leaf}" stroke="${INK}" stroke-width="3"/>`;
    } else {
      head = `<path d="M50 20 q16 8 12 26 q-12 8-24 0 q-4-18 12-26Z" fill="${p.body}"
        stroke="${INK}" stroke-width="3.4"/>`;
    }
    /* Stage 2 keeps the plant's silhouette and shrinks it toward the soil, the
       same trick the garden's growth stages use — no second drawing. */
    return wrap(stem + (s === 2
      ? `<g transform="translate(50 52) scale(.52) translate(-50 -46)">${head}</g>`
      : head));
  }

  const wrap = (inner) =>
    `<svg viewBox="6 6 88 92" class="fall-crop" aria-hidden="true">${inner}</svg>`;

  return { scene, cellFloor, defs, crop, PLANTS, VIEW, INK, SKIES };
})();

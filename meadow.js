/* Garden Wonder — the Wild Meadow, the hive bank over the hill.

   Same contract as flora.js, critters.js and hollow.js: parameters in, SVG out,
   knows nothing about the game.

   House rule that governs everything below: this is the QUIET place. The garden
   is the tapping, the combo and the noise; the meadow is warm light, slow bees
   and long grass. If it ever grows its own tap loop the two compete and both get
   worse — see docs/25-world-map.md. So there is no urgency anywhere in this art:
   nothing flashes, nothing counts down, and the only motion is drift. */

const Meadow = (() => {
  const INK = '#2c1a10';

  const SKIES = {
    sun: {
      hi: '#9fdcff', lo: '#e8f6ff', sun: '#fff3c4', sunGlow: '#ffe9a8',
      far: '#7cc86a', farDeep: '#63b155', bank: '#8ed36b', bankDeep: '#6cb551',
      willow: '#4f9a52', willowDeep: '#3d7f43', willowLit: '#63b155',
      grass: '#7fd07f', shade: 'rgba(44,26,16,.10)', post: '#e0be8c'
    },
    moon: {
      hi: '#2b2f63', lo: '#5a5f9c', sun: '#e8eeff', sunGlow: '#b9c2e8',
      far: '#3f7a44', farDeep: '#2f5f36', bank: '#4d9a58', bankDeep: '#3d8049',
      willow: '#2f6136', willowDeep: '#254e2c', willowLit: '#3b7742',
      grass: '#448a52', shade: 'rgba(0,0,0,.20)', post: '#b99a6a'
    }
  };

  const VIEW = { width: 390, height: 844 };

  /* Where the five hive spots sit on the bank, in view coordinates. Ordered to
     match MEADOW.spots so a spot's data and its place on the hill are the same
     row read twice. Staggered rather than gridded — a row of five would read as
     a shop shelf, and this is supposed to be a hillside. */
  const SPOTS = [
    { x: 92, y: 292 },     // sun     — high and open
    { x: 282, y: 286 },    // clover  — high right, clear of the tree
    { x: 176, y: 398 },    // stump   — middle
    { x: 296, y: 506 },    // willow  — low right, actually under the willow
    { x: 82, y: 462 }      // rise    — left shoulder
  ];
  const HIVE_SIZE = 86;

  /* The keeper bank along the bottom, in front of everything. */
  const KEEPERS = [{ x: 128, y: 626 }, { x: 262, y: 626 }];
  const KEEPER_SIZE = 78;

  function sky(c, h) {
    return `<rect x="0" y="0" width="${VIEW.width}" height="${h}" fill="url(#mw-sky)"/>
      <circle cx="316" cy="86" r="46" fill="${c.sunGlow}" opacity=".5"/>
      <circle cx="316" cy="86" r="30" fill="${c.sun}"/>`;
  }

  function clouds(c) {
    return [[54, 118, 1], [242, 66, 0.72]].map(([x, y, k], i) => `
      <g class="mw-cloud" style="--dur:${58 + i * 14}s" transform="translate(${x} ${y}) scale(${k})">
        <path d="M0,0 a34,34 0 0 1 58,-18 a40,40 0 0 1 68,8 a30,30 0 0 1 2,10 Z"
          fill="#fff" opacity=".82"/></g>`).join('');
  }

  /** Long grass along the bottom edge — the thing that says "meadow", not "lawn". */
  function grass(c, y) {
    let blades = '';
    for (let i = 0; i < 26; i += 1) {
      const x = -6 + i * 16 + (i % 3) * 4;
      const h = 26 + (i % 4) * 11;
      const lean = i % 2 ? 9 : -9;
      blades += `<path class="mw-blade" style="--i:${i % 7}"
        d="M${x},${y + 40} C${x},${y + 10} ${x + lean},${y - h / 2} ${x + lean * 1.6},${y - h}"
        fill="none" stroke="${c.bankDeep}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return `<g>${blades}</g>`;
  }

  function wildflowers(c) {
    const set = [
      [40, 596, '#ffd6e8'], [128, 612, '#ffe066'], [214, 600, '#c9b6ff'],
      [318, 618, '#ffd6e8'], [72, 636, '#ffe066'], [356, 588, '#c9b6ff'],
      [186, 640, '#ffd6e8'], [252, 630, '#ffe066']
    ];
    return set.map(([x, y, col], i) => `
      <g class="mw-flower" style="--i:${i % 5}" transform="translate(${x} ${y})">
        <path d="M0,14 L0,-2" stroke="#4bb257" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="0" cy="-8" r="9" fill="${col}" stroke="${INK}" stroke-width="4"/>
        <circle cx="0" cy="-8" r="3" fill="#fff7e1"/></g>`).join('');
  }

  /* A closed lumpy blob — a crown of leaves rather than a disc. A plain ellipse
     with fronds under it reads as a mushroom, or worse a table with legs, which
     is the same failure the Hollow's moss drips already documented. */
  function blob(cx, cy, rx, ry, bumps, seed) {
    const n = bumps || 9;
    let d = '';
    for (let i = 0; i <= n; i += 1) {
      const a = (Math.PI * 2 * i) / n;
      const wobble = 1 + 0.13 * Math.sin(a * 3 + (seed || 0));
      const x = cx + Math.cos(a) * rx * wobble;
      const y = cy + Math.sin(a) * ry * wobble;
      if (!i) { d = `M${x.toFixed(1)},${y.toFixed(1)}`; continue; }
      const pa = (Math.PI * 2 * (i - 0.5)) / n;
      const pw = 1 + 0.3 * Math.sin(pa * 3 + (seed || 0));
      const px = cx + Math.cos(pa) * rx * pw;
      const py = cy + Math.sin(pa) * ry * pw;
      d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return `${d} Z`;
  }

  /* The willow the shaded spot sits under, so that spot's name means something.
     Its crown must be DARKER than the bank behind it — drawn in the mid green it
     disappeared and only the ink outline showed, which read as a floating ring. */
  function willow(c) {
    let fronds = '';
    for (let i = 0; i < 13; i += 1) {
      const t = (i - 6) / 6;
      const x = 296 + t * 74;
      const from = 384 + Math.abs(t) * 18;
      const drop = from + 78 - Math.abs(t) * 26;
      fronds += `<path class="mw-frond" style="--i:${i % 6}"
        d="M${x},${from} C${x - 6},${from + 30} ${x + 6},${drop - 22} ${x - 3},${drop}"
        fill="none" stroke="${c.willowDeep}" stroke-width="6.5" stroke-linecap="round"/>`;
    }
    return `<g>
      <rect x="286" y="382" width="22" height="92" rx="9" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
      ${fronds}
      <path d="${blob(296, 372, 84, 46, 11, 0.9)}" fill="${c.willow}" stroke="${INK}"
        stroke-width="6" stroke-linejoin="round"/>
      <path d="${blob(266, 356, 42, 22, 8, 2.2)}" fill="${c.willowLit}"/>
    </g>`;
  }

  /** One empty hive spot: a flattened patch and a marker post. Drawn by the UI. */
  function spotMark(c) {
    return `<svg viewBox="0 0 86 86" class="mw-spot-art" aria-hidden="true">
      <ellipse cx="43" cy="66" rx="34" ry="12" fill="${c || 'rgba(44,26,16,.14)'}"/>
      <path d="M43,64 L43,26" stroke="#c99a68" stroke-width="7" stroke-linecap="round"/>
      <path d="M43,26 m-16,0 a16,16 0 1 0 32,0 a16,16 0 1 0 -32,0"
        fill="#fff7e1" stroke="${INK}" stroke-width="5"/>
      <path d="M36,26 h14 M43,19 v14" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`;
  }

  /** A hive, sized to a spot. `tint` is the spot's own colour, on the roof. */
  function hive(tint) {
    return `<svg viewBox="0 0 86 86" class="mw-hive-art" aria-hidden="true">
      <ellipse cx="43" cy="74" rx="34" ry="10" fill="rgba(44,26,16,.18)"/>
      <rect x="14" y="44" width="58" height="28" rx="6" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
      <rect x="11" y="26" width="64" height="22" rx="6" fill="#f0d59a" stroke="${INK}" stroke-width="5"/>
      <rect x="8" y="10" width="70" height="20" rx="7" fill="${tint || '#e8c07a'}" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="43" cy="60" rx="7" ry="5.5" fill="${INK}"/>
    </svg>`;
  }

  /** A jar of honey, coloured from the bloom it came from. */
  function jar(fill, glow) {
    return `<svg viewBox="0 0 48 56" class="mw-jar-art" aria-hidden="true">
      <path d="M11,20 h26 a5,5 0 0 1 5,5 v22 a5,5 0 0 1 -5,5 h-26 a5,5 0 0 1 -5,-5 v-22 a5,5 0 0 1 5,-5 Z"
        fill="${fill}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M11,20 h26 a5,5 0 0 1 5,5 v4 h-36 v-4 a5,5 0 0 1 5,-5 Z" fill="${glow || '#fff7e1'}" opacity=".55"/>
      <rect x="13" y="8" width="22" height="12" rx="4" fill="#e8d5b0" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="18" cy="36" rx="3.5" ry="6" fill="#fff" opacity=".5"/>
    </svg>`;
  }

  /** A bee. The UI flies these about; this only knows what one looks like. */
  function bee() {
    return `<svg viewBox="0 0 30 24" class="mw-bee-art" aria-hidden="true">
      <ellipse cx="8" cy="8" rx="9" ry="6" fill="#fff" opacity=".9" stroke="${INK}" stroke-width="2.6"/>
      <ellipse cx="17" cy="14" rx="9" ry="7" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
      <path d="M14,8.5 v11 M19,8 v12" stroke="${INK}" stroke-width="2.8"/>
      <circle cx="25" cy="12" r="4" fill="${INK}"/>
    </svg>`;
  }

  /** The whole backdrop. Nothing here is interactive. */
  function scene(opts) {
    const o = opts || {};
    const w = o.width || VIEW.width;
    const h = o.height || VIEW.height;
    const dock = o.dockHeight || 0;
    const c = SKIES[o.sky === 'moon' ? 'moon' : 'sun'];
    const horizon = Math.round(h * 0.26);

    return `<svg class="meadow-scene" viewBox="0 0 ${w} ${h}"
      preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="mw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c.hi}"/><stop offset="1" stop-color="${c.lo}"/>
        </linearGradient>
        <radialGradient id="mw-warm" cx="0.8" cy="0.1" r="0.9">
          <stop offset="0" stop-color="${c.sunGlow}" stop-opacity=".5"/>
          <stop offset="1" stop-color="${c.sunGlow}" stop-opacity="0"/>
        </radialGradient>
      </defs>

      ${sky(c, horizon + 40)}
      ${clouds(c)}

      <path d="M0,${horizon + 10} C90,${horizon - 32} 190,${horizon + 6} 270,${horizon - 18}
        C320,${horizon - 32} 360,${horizon - 6} ${w},${horizon - 20}
        L${w},${horizon + 90} L0,${horizon + 90} Z" fill="${c.farDeep}"/>
      <path d="M0,${horizon + 56} C110,${horizon + 16} 230,${horizon + 62} 330,${horizon + 34}
        C360,${horizon + 26} 375,${horizon + 34} ${w},${horizon + 28}
        L${w},${h} L0,${h} Z" fill="${c.far}"/>

      <path d="M0,${horizon + 108} C120,${horizon + 66} 250,${horizon + 118} ${w},${horizon + 82}
        L${w},${h} L0,${h} Z" fill="${c.bank}"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#mw-warm)"/>

      ${willow(c)}
      ${wildflowers(c)}
      ${grass(c, h - dock - 26)}
    </svg>`;
  }

  return { scene, spotMark, hive, jar, bee, SPOTS, HIVE_SIZE, KEEPERS, KEEPER_SIZE, VIEW, INK };
})();

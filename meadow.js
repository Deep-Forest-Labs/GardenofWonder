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
    /* Warmer and more bleached than the garden's mown green. The garden is
       tended; this is not, and the colour has to say so before anything else
       does. */
    sun: {
      hi: '#9fdcff', lo: '#eaf7ff', sun: '#fff3c4', sunGlow: '#ffe9a8',
      far: '#8cbf62', farDeep: '#6fa54e', bank: '#a8cf6a', bankDeep: '#8ab455',
      willow: '#4f9a52', willowDeep: '#3d7f43', willowLit: '#63b155',
      stone: '#d9cfc0', stoneLit: '#eae2d6', moss: '#8ab455',
      seed: '#e8d08a'
    },
    moon: {
      hi: '#2b2f63', lo: '#5a5f9c', sun: '#e8eeff', sunGlow: '#b9c2e8',
      far: '#3f6e42', farDeep: '#2f5636', bank: '#57764a', bankDeep: '#465f3c',
      willow: '#2f6136', willowDeep: '#254e2c', willowLit: '#3b7742',
      stone: '#8f8a80', stoneLit: '#a9a49a', moss: '#4a6b3c',
      seed: '#9c8f68'
    }
  };

  const VIEW = { width: 390, height: 844 };

  /* The board's own furniture. The scene is composed like the garden's — sky,
     ground, a boundary, pets, dock — but every piece of furniture is different,
     because a meadow is land nobody tends: a dry-stone wall instead of a fence,
     unmown grass instead of mown stripes, and warm bleached green instead of the
     garden's bright lawn. Same structure, different place. */

  const KEEPERS = [{ x: 128, y: 640 }, { x: 262, y: 640 }];
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

  /* Unmown grass with seed heads on it — the single clearest signal that nobody
     mows here, where the garden's lawn has neat stripes. */
  function grass(c, y, w, n, tall) {
    let blades = '';
    for (let i = 0; i < n; i += 1) {
      const x = -8 + i * (w / n) + (i % 3) * 5;
      const h = tall * (0.7 + (i % 4) * 0.16);
      const lean = i % 2 ? 10 : -10;
      const tipX = x + lean * 1.6;
      const tipY = y - h;
      blades += `<g class="mw-blade" style="--i:${i % 7}">
        <path d="M${x},${y + 30} C${x},${y} ${x + lean},${y - h / 2} ${tipX},${tipY}"
          fill="none" stroke="${c.bankDeep}" stroke-width="5.5" stroke-linecap="round"/>
        ${i % 3 === 0 ? `<ellipse cx="${tipX.toFixed(1)}" cy="${tipY.toFixed(1)}" rx="4" ry="8"
          fill="${c.seed}" transform="rotate(${lean} ${tipX.toFixed(1)} ${tipY.toFixed(1)})"/>` : ''}
      </g>`;
    }
    return `<g>${blades}</g>`;
  }

  function wildflowers(c) {
    const set = [
      [28, 476, '#ffd6e8'], [356, 470, '#c9b6ff'], [58, 566, '#ffe066'],
      [332, 578, '#ffd6e8'], [18, 640, '#c9b6ff'], [368, 636, '#ffe066']
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
      const x = 342 + t * 62;
      const from = 384 + Math.abs(t) * 18;
      const drop = from + 78 - Math.abs(t) * 26;
      fronds += `<path class="mw-frond" style="--i:${i % 6}"
        d="M${x},${from} C${x - 6},${from + 30} ${x + 6},${drop - 22} ${x - 3},${drop}"
        fill="none" stroke="${c.willowDeep}" stroke-width="6.5" stroke-linecap="round"/>`;
    }
    return `<g>
      <rect x="332" y="382" width="22" height="92" rx="9" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
      ${fronds}
      <path d="${blob(342, 356, 76, 44, 11, 0.9)}" fill="${c.willow}" stroke="${INK}"
        stroke-width="6" stroke-linejoin="round"/>
      <path d="${blob(318, 340, 38, 20, 8, 2.2)}" fill="${c.willowLit}"/>
    </g>`;
  }

  /* A dry-stone wall, which is what a meadow has instead of a painted fence.
     Uneven courses and moss in the joints — the whole point is that nobody
     built this last summer. */
  function wall(c, y, w) {
    let stones = '';
    const rows = [[0, 26], [1, 21], [0, 17]];
    rows.forEach(([off, h], r) => {
      const top = y + r * 19;
      for (let i = -1; i < Math.ceil(w / 46) + 1; i += 1) {
        const sw = 38 + ((i + r) % 3) * 12;
        const x = i * 46 + (off ? 23 : 0) + ((i + r) % 2) * 4;
        stones += `<rect x="${x}" y="${top}" width="${sw}" height="${h}" rx="9"
          fill="${r % 2 ? c.stoneLit : c.stone}" stroke="${INK}" stroke-width="4.5"/>`;
      }
    });
    let moss = '';
    [40, 150, 236, 330].forEach((x, i) => {
      moss += `<path d="M${x},${y + 4} q10,-9 21,0 q9,7 -3,9 q-13,2 -18,-9 Z"
        fill="${c.moss}" opacity=".9" transform="translate(0 ${(i % 2) * 19})"/>`;
    });
    return `<g>${stones}${moss}</g>`;
  }

  /** An empty cell on the board: pressed turf ringed with small stones. */
  function emptyCell() {
    return `<svg viewBox="0 0 100 100" class="mw-cell-art" aria-hidden="true">
      <ellipse cx="50" cy="58" rx="34" ry="24" fill="rgba(44,26,16,.13)"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (Math.PI * 2 * i) / 6 - 0.4;
        const x = 50 + Math.cos(a) * 36;
        const y = 58 + Math.sin(a) * 25;
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="7"
          fill="#d9cfc0" stroke="${INK}" stroke-width="4"/>`;
      }).join('')}
      <path d="M50,66 L50,40 M38,46 h24" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    </svg>`;
  }

  /** A hive on the board. */
  function hive() {
    return `<svg viewBox="0 0 100 100" class="mw-hive-art" aria-hidden="true">
      <ellipse cx="50" cy="86" rx="34" ry="10" fill="rgba(44,26,16,.2)"/>
      <rect x="18" y="54" width="64" height="30" rx="7" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
      <rect x="14" y="34" width="72" height="24" rx="7" fill="#f0d59a" stroke="${INK}" stroke-width="5"/>
      <rect x="11" y="16" width="78" height="22" rx="8" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="50" cy="72" rx="8" ry="6" fill="${INK}"/>
    </svg>`;
  }

  /* One drawing per tender. They must read at a glance as DIFFERENT OBJECTS —
     a board of five recoloured squares is a spreadsheet with a hedge round it. */
  const TENDERS = {
    sun: (t) => `<ellipse cx="50" cy="82" rx="32" ry="9" fill="rgba(44,26,16,.18)"/>
      <path d="M18,80 C14,52 30,34 52,34 C74,34 88,50 84,80 Z"
        fill="#d9cfc0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M30,74 C28,56 38,46 52,46" fill="none" stroke="#b8ab98" stroke-width="6" stroke-linecap="round"/>
      <circle cx="66" cy="22" r="13" fill="${t}" stroke="${INK}" stroke-width="4.5"/>
      ${[0, 1, 2, 3, 4].map((i) => {
        const a = (Math.PI * 2 * i) / 5 - 1;
        return `<path d="M${(66 + Math.cos(a) * 17).toFixed(1)},${(22 + Math.sin(a) * 17).toFixed(1)}
          L${(66 + Math.cos(a) * 24).toFixed(1)},${(22 + Math.sin(a) * 24).toFixed(1)}"
          stroke="${t}" stroke-width="5" stroke-linecap="round"/>`;
      }).join('')}`,
    clover: (t) => `<ellipse cx="50" cy="84" rx="34" ry="9" fill="rgba(44,26,16,.16)"/>
      ${[[30, 62, 1], [50, 52, 1.25], [70, 64, 1]].map(([x, y, k]) => `
        <g transform="translate(${x} ${y}) scale(${k})">
          <path d="M0,22 L0,4" stroke="#3f9950" stroke-width="5" stroke-linecap="round"/>
          <circle cx="-9" cy="-6" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
          <circle cx="9" cy="-6" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
          <circle cx="0" cy="-18" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
        </g>`).join('')}`,
    stump: (t) => `<ellipse cx="50" cy="84" rx="34" ry="9" fill="rgba(44,26,16,.18)"/>
      <path d="M22,80 L26,40 C26,32 74,32 74,40 L78,80 Z"
        fill="${t}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="50" cy="40" rx="24" ry="10" fill="#e0be8c" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="50" cy="40" rx="13" ry="5" fill="none" stroke="#b58a5c" stroke-width="3.5"/>
      <path d="M74,58 q14,-6 16,-18 q-16,2 -18,14 Z" fill="#57c15b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    willow: (t) => `<ellipse cx="50" cy="86" rx="30" ry="8" fill="rgba(44,26,16,.16)"/>
      <rect x="42" y="46" width="16" height="40" rx="6" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
      ${[0, 1, 2, 3, 4].map((i) => {
        const x = 50 + (i - 2) * 15;
        return `<path d="M${x},44 C${x - 4},58 ${x + 4},66 ${x - 2},76"
          fill="none" stroke="#3d7f43" stroke-width="5.5" stroke-linecap="round"/>`;
      }).join('')}
      <path d="${blob(50, 36, 36, 22, 9, 1.4)}" fill="${t}" stroke="${INK}"
        stroke-width="5" stroke-linejoin="round"/>
      <path d="${blob(38, 29, 15, 8, 7, 2.6)}" fill="#c9a3f5"/>`,
    foxglove: (t) => `<ellipse cx="50" cy="86" rx="30" ry="8" fill="rgba(44,26,16,.16)"/>
      ${[[34, 1], [50, 1.2], [66, 0.9]].map(([x, k]) => `
        <g transform="translate(${x} 0) scale(${k})">
          <path d="M0,84 L0,34" stroke="#3f9950" stroke-width="5" stroke-linecap="round"/>
          ${[0, 1, 2, 3].map((i) => `<ellipse cx="${i % 2 ? 7 : -7}" cy="${38 + i * 12}" rx="8" ry="6"
            fill="${t}" stroke="${INK}" stroke-width="3.5"/>`).join('')}
          <ellipse cx="0" cy="30" rx="7" ry="8" fill="${t}" stroke="${INK}" stroke-width="3.5"/>
        </g>`).join('')}`
  };

  function tender(id, tint) {
    const draw = TENDERS[id] || TENDERS.clover;
    return `<svg viewBox="0 0 100 100" class="mw-tender-art" aria-hidden="true">${draw(tint)}</svg>`;
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
      ${grass(c, Math.round(h * 0.52), w, 20, 46)}
      ${wildflowers(c)}
      ${wall(c, h - dock - 96, w)}
      ${grass(c, h - dock - 84, w, 24, 40)}
    </svg>`;
  }

  return { scene, emptyCell, hive, tender, jar, bee, wall, KEEPERS, KEEPER_SIZE, VIEW, INK };
})();

/* Garden Wonder — the overworld, seen from above the garden.

   Same contract as flora.js, critters.js and hollow.js: parameters in, SVG out,
   and it knows nothing about the game. `tools/map-spike.html` settled the
   composition and this is the shipping version of it.

   NOT called `Map`. That is a JS built-in and `ui-hollow.js` already uses
   `new Map()`; shadowing it would work right up until it did not.

   The house rule this scene exists to keep: it is the SAME WORLD as the garden,
   drawn from further away — side-on, storybook, thick ink outlines. A top-down
   or isometric map would be a second visual language for one screen, and the
   spike proved that reads as a diagram rather than a place. The other thing the
   spike found: a map with nothing between its landmarks looks like a menu, so
   the trees, tufts and birds are load-bearing, not decoration. */

const Overworld = (() => {
  const INK = '#2c1a10';

  /* The world is far bigger than any phone on purpose — panning across it is the
     point, and the landmarks have to be SMALL against it or the "map" is just
     the garden seen slightly further away. The UI fits this height to the screen
     and pans the width. Everything below is in these coordinates. */
  const W = 1800;
  const H = 1500;

  const SKIES = {
    sun: {
      hi: '#8fd8ff', lo: '#d9f2ff', hill: '#7cc86a', hillDeep: '#5faf52',
      lawn: '#7fd07f', lawnDeep: '#63c063', lane: '#e0c08a', laneEdge: '#c39c63',
      cloud: '#ffffff', cloudOp: 0.9, ink: 'rgba(44,26,16,.55)'
    },
    moon: {
      hi: '#2b2f63', lo: '#4a4f8f', hill: '#3f7a44', hillDeep: '#2f5f36',
      lawn: '#4d9a58', lawnDeep: '#3d8049', lane: '#a98d63', laneEdge: '#7d6544',
      cloud: '#b9c2e8', cloudOp: 0.5, ink: 'rgba(255,255,255,.32)'
    }
  };

  /* Where everything stands, in world coordinates. The UI reads these to place
     its own layers on top, so a landmark only ever has one set of numbers. */
  const PLACES = {
    garden: { x: 770, y: 560, w: 260, h: 360 },
    hollow: { x: 500, y: 1010, w: 180, h: 168 },
    stand:  { x: 1120, y: 990, w: 214, h: 194 },
    /* The meadow is not bought — it is meadow. It stands open from the start and
       putting a hive in it is what makes it yours, so it INVITES where a locked
       parcel refuses. Locked land is for the Orchard and the Ridge. */
    meadow: { x: 1420, y: 690, w: 230, h: 190 }
  };

  const PARCELS = [
    { id: 'orchard', name: 'The Orchard', x: 220, y: 760, w: 190, h: 150 },
    { id: 'ridge',   name: 'The Ridge',   x: 830, y: 250, w: 186, h: 142 }
  ];

  function clouds(c) {
    let out = '';
    [[180, 150, 1.1, 52], [820, 262, 0.8, 68], [1380, 118, 0.95, 60]].forEach(([x, y, k, dur], i) => {
      out += `<g class="ow-cloud" style="--dur:${dur}s" transform="translate(${x} ${y}) scale(${k})">
        <path d="M0,0 a44,44 0 0 1 74,-22 a52,52 0 0 1 88,10 a38,38 0 0 1 2,12 Z"
          fill="${c.cloud}" opacity="${c.cloudOp}" transform="translate(${-i * 26} 0)"/></g>`;
    });
    return out;
  }

  const tree = (c, x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">
    <ellipse cx="0" cy="46" rx="40" ry="11" fill="rgba(44,26,16,.15)"/>
    <rect x="-9" y="4" width="18" height="44" rx="7" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
    <circle cx="0" cy="-16" r="44" fill="${c.hillDeep}" stroke="${INK}" stroke-width="6"/>
    <circle cx="-19" cy="-30" r="26" fill="${c.hill}"/></g>`;

  const tuft = (c, x, y, col) => `<g transform="translate(${x} ${y})">
    <path d="M-24,12 C-24,-10 -13,-20 0,-20 C13,-20 24,-10 24,12 Z" fill="${c.hillDeep}" opacity=".5"/>
    <circle cx="-13" cy="-20" r="11" fill="${col}" stroke="${INK}" stroke-width="4.5"/>
    <circle cx="13" cy="-14" r="9" fill="${col}" stroke="${INK}" stroke-width="4.5"/></g>`;

  const bird = (c, x, y) => `<path d="M${x},${y} q9,-9 18,0 q9,-9 18,0" fill="none"
    stroke="${c.ink}" stroke-width="4.5" stroke-linecap="round"/>`;

  function scenery(c) {
    const trees = [[110, 700, 1], [520, 660, 0.86], [1180, 640, 0.94], [1700, 940, 1.05],
                   [96, 1140, 1.1], [700, 1400, 1.15], [1010, 1410, 1], [1520, 1330, 0.95],
                   [1720, 560, 0.8], [340, 1300, 0.9], [1300, 1420, 1.05], [640, 900, 0.7],
                   [1660, 1150, 0.86], [60, 960, 0.8]]
      .map(([x, y, k]) => tree(c, x, y, k)).join('');
    const tufts = [[600, 860, '#ffd6e8'], [1090, 800, '#ffe066'], [420, 1240, '#ffd6e8'],
                   [880, 1300, '#c9b6ff'], [1280, 840, '#ffe066'], [1560, 1080, '#ffd6e8'],
                   [280, 1010, '#ffe066'], [980, 1450, '#c9b6ff'], [1700, 1440, '#ffe066'],
                   [160, 1420, '#ffd6e8'], [1400, 1240, '#c9b6ff'], [760, 1120, '#ffe066']]
      .map(([x, y, col]) => tuft(c, x, y, col)).join('');
    return `<g>${bird(c, 340, 230)}${bird(c, 402, 276)}${bird(c, 1290, 190)}${trees}${tufts}</g>`;
  }

  /* The garden's boundary. It is what says "this land is yours" at map distance —
     the board on its own reads as furniture sitting in a field. */
  function fence() {
    const g = PLACES.garden;
    const y = g.y + g.h + 12;
    let posts = '';
    for (let x = g.x - 34; x <= g.x + g.w + 20; x += 58) {
      posts += `<rect x="${x}" y="${y - 14}" width="15" height="38" rx="5"
        fill="#e0be8c" stroke="${INK}" stroke-width="4.5"/>`;
    }
    return `<g><path d="M${g.x - 40},${y} L${g.x + g.w + 44},${y}
      M${g.x - 40},${y + 14} L${g.x + g.w + 44},${y + 14}"
      stroke="#c99a68" stroke-width="8" stroke-linecap="round"/>${posts}</g>`;
  }

  /** The backdrop. Everything that never changes and never gets tapped. */
  function scene(opts) {
    const o = opts || {};
    const c = SKIES[o.sky === 'moon' ? 'moon' : 'sun'];
    let stripes = '';
    for (let y = 1300; y < H; y += 74) {
      stripes += `<rect x="0" y="${y}" width="${W}" height="34" fill="${c.lawnDeep}" opacity=".3"/>`;
    }
    return `<svg class="ow-scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c.hi}"/><stop offset="1" stop-color="${c.lo}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${W}" height="540" fill="url(#ow-sky)"/>
      ${clouds(c)}
      <path d="M0,500 C240,340 500,360 740,432 C980,504 1240,320 1800,392 L1800,620 L0,620 Z"
        fill="${c.hillDeep}"/>
      <path d="M0,600 C300,480 620,540 920,506 C1220,472 1520,560 1800,510 L1800,790 L0,790 Z"
        fill="${c.hill}"/>
      <rect x="0" y="670" width="${W}" height="${H - 670}" fill="${c.lawn}"/>
      ${stripes}
      ${scenery(c)}
      ${fence()}
      <path d="M-20,1140 C260,1058 500,1268 820,1230 C1160,1190 1300,1310 1830,1264 L1830,1394
        C1300,1440 1160,1320 820,1360 C500,1398 260,1198 -20,1280 Z"
        fill="${c.lane}" stroke="${c.laneEdge}" stroke-width="6"/>
    </svg>`;
  }

  /** The garden's plot board, drawn at map distance. Blooms are placed over it. */
  function gardenBoard() {
    let cells = '';
    for (let r = 0; r < 3; r += 1) {
      for (let k = 0; k < 3; k += 1) {
        if (r === 1 && k === 1) continue;
        cells += `<rect x="${24 + k * 74}" y="${106 + r * 74}" width="66" height="66" rx="12"
          fill="#7d4f2c" stroke="${INK}" stroke-width="4.5"/>`;
      }
    }
    let hedge = '';
    for (let i = 0; i < 7; i += 1) {
      hedge += `<circle cx="${18 + i * 38}" cy="86" r="15" fill="#57c15b" stroke="${INK}" stroke-width="4"/>`;
    }
    return `<svg viewBox="0 0 260 360" class="ow-board">
      <rect x="4" y="86" width="252" height="248" rx="22" fill="#8a5a33" stroke="${INK}" stroke-width="7"/>
      <rect x="14" y="96" width="232" height="228" rx="16" fill="#a3703f"/>
      ${cells}${hedge}
    </svg>`;
  }

  /* Plot centres as a fraction of the board, so a bloom lands IN a cell rather
     than near one. Index matches the game's 3x3 grid with the middle skipped. */
  const CELLS = (() => {
    const out = [];
    for (let r = 0; r < 3; r += 1) {
      for (let k = 0; k < 3; k += 1) {
        if (r === 1 && k === 1) continue;
        out.push({ x: ((24 + k * 74 + 33) / 260) * 100, y: ((106 + r * 74 + 33) / 360) * 100 });
      }
    }
    return out;
  })();

  /** The burrow mouth, seen from across the meadow. */
  function burrow() {
    return `<svg viewBox="0 0 180 168" class="ow-art">
      <ellipse cx="90" cy="144" rx="88" ry="24" fill="rgba(44,26,16,.16)"/>
      <path d="M6,144 C6,80 38,42 90,42 C142,42 174,80 174,144 Z"
        fill="#a3703f" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M19,144 C19,92 46,61 90,61 C134,61 161,92 161,144 Z" fill="#b8834c"/>
      <path d="M6,144 C6,115 23,92 57,84 C38,105 30,123 28,144 Z" fill="#8ed36b"/>
      <path d="M174,144 C174,115 157,92 123,84 C142,105 150,123 152,144 Z" fill="#8ed36b"/>
      <path d="M55,146 C55,105 68,88 90,88 C112,88 125,105 125,146 Z"
        fill="#3b2415" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M63,146 C63,113 73,99 90,99 C107,99 117,113 117,146 Z" fill="#1e120a"/>
    </svg>`;
  }

  /** The Garden Stand — a stall on the lane, where the customers queue. */
  function stand() {
    let jars = '';
    [[62, 132], [107, 132], [152, 132]].forEach(([x, y]) => {
      jars += `<rect x="${x - 17}" y="${y - 17}" width="34" height="34" rx="7"
        fill="#ffd6a5" stroke="${INK}" stroke-width="4.5"/>`;
    });
    let scallops = '';
    for (let i = 0; i < 4; i += 1) {
      scallops += `<path d="M${44 + i * 42},34 L${20 + i * 42},88 L${44 + i * 42},88 Z" fill="#fff7e1"/>`;
    }
    return `<svg viewBox="0 0 214 194" class="ow-art">
      <ellipse cx="107" cy="176" rx="98" ry="22" fill="rgba(44,26,16,.16)"/>
      <rect x="26" y="88" width="162" height="86" rx="10" fill="#e8d5b0" stroke="${INK}" stroke-width="7"/>
      <rect x="26" y="88" width="162" height="20" fill="#c9ab7d"/>
      <path d="M10,88 L34,34 L180,34 L204,88 Z" fill="#ff8fa3" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      ${scallops}
      <path d="M10,88 L204,88" stroke="${INK}" stroke-width="7"/>
      <rect x="98" y="8" width="18" height="30" fill="#a3703f" stroke="${INK}" stroke-width="5"/>
      <circle cx="107" cy="10" r="13" fill="#ffc94a" stroke="${INK}" stroke-width="5"/>
      ${jars}
    </svg>`;
  }

  /** The Wild Meadow: wildflowers, and however many hives are actually kept. */
  function meadow(hives) {
    const n = Math.max(0, Math.min(4, hives || 0));
    let boxes = '';
    const spots = [[74, 118], [150, 106], [40, 92], [186, 132]];
    for (let i = 0; i < n; i += 1) {
      const [x, y] = spots[i];
      boxes += `<g transform="translate(${x} ${y})">
        <ellipse cx="0" cy="30" rx="30" ry="8" fill="rgba(44,26,16,.16)"/>
        <rect x="-25" y="-2" width="50" height="32" rx="5" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
        <rect x="-27" y="-20" width="54" height="20" rx="5" fill="#f0d59a" stroke="${INK}" stroke-width="5"/>
        <rect x="-30" y="-34" width="60" height="16" rx="5" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
        <circle cx="0" cy="14" r="5" fill="${INK}"/>
      </g>`;
    }
    let flowers = '';
    [[24, 158, '#ffd6e8'], [110, 168, '#ffe066'], [202, 162, '#c9b6ff'],
     [62, 172, '#ffe066'], [162, 176, '#ffd6e8']].forEach(([x, y, col]) => {
      flowers += `<g transform="translate(${x} ${y})">
        <path d="M0,10 L0,-4" stroke="#4bb257" stroke-width="4" stroke-linecap="round"/>
        <circle cx="0" cy="-8" r="8" fill="${col}" stroke="${INK}" stroke-width="4"/></g>`;
    });
    /* Bees only when there is a hive to have come out of. */
    let bees = '';
    if (n) {
      [[196, 60], [56, 46], [136, 36]].forEach(([x, y], i) => {
        bees += `<g class="ow-bee" style="--i:${i}" transform="translate(${x} ${y})">
          <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
          <path d="M-2,-4 L-2,4 M2,-4 L2,4" stroke="${INK}" stroke-width="2.4"/>
          <ellipse cx="-1" cy="-6" rx="5" ry="3" fill="#fff" opacity=".85" stroke="${INK}" stroke-width="2"/></g>`;
      });
    }
    return `<svg viewBox="0 0 230 190" class="ow-art">
      <path d="M6,150 C6,120 40,104 115,104 C190,104 224,120 224,150 C224,172 170,182 115,182
        C60,182 6,172 6,150 Z" fill="#8ed36b" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      ${boxes}${flowers}${bees}
    </svg>`;
  }

  /* Land you do not own is overgrown ground behind a signpost. The spike tried an
     isometric diamond first and it read as a mountain — this scene is side-on, so
     unowned land has to be side-on too, and it has to look CLEARABLE rather than
     like scenery, or it stops asking to be bought. */
  function parcel(p) {
    const w = p.w;
    const h = p.h;
    return `<svg viewBox="0 0 ${w} ${h}" class="ow-art">
      <ellipse cx="${w / 2}" cy="${h - 16}" rx="${w / 2 - 8}" ry="16" fill="rgba(44,26,16,.16)"/>
      <path d="M12,${h - 18} C12,${h * 0.52} 30,${h * 0.3} 52,${h * 0.34}
        C60,${h * 0.14} 92,${h * 0.1} 104,${h * 0.3}
        C132,${h * 0.2} ${w - 16},${h * 0.3} ${w - 12},${h - 18} Z"
        fill="#4a7c46" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M34,${h - 20} C40,${h * 0.6} 68,${h * 0.52} 84,${h * 0.62}"
        fill="none" stroke="#3d6a3a" stroke-width="6" stroke-linecap="round"/>
      <path d="M${w - 40},${h - 20} C${w - 48},${h * 0.6} ${w - 74},${h * 0.5} ${w - 92},${h * 0.6}"
        fill="none" stroke="#3d6a3a" stroke-width="6" stroke-linecap="round"/>
      <rect x="${w / 2 - 7}" y="${h * 0.30}" width="14" height="${h * 0.66}" rx="5"
        fill="#a3703f" stroke="${INK}" stroke-width="5"/>
      <rect x="${w / 2 - 40}" y="${h * 0.12}" width="80" height="54" rx="12"
        fill="#e8d5b0" stroke="${INK}" stroke-width="6"/>
    </svg>`;
  }

  return { scene, gardenBoard, burrow, stand, meadow, parcel, PLACES, PARCELS, CELLS, W, H, INK };
})();

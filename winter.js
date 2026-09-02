/* Garden Wonder — Winter's art.

   The same job fall.js does for Fall: the scene behind the board, the board's
   own cell floor, the plants that stand in it, and the quilt that goes over
   them. No DOM, no game state, no economy — this file draws.

   THE RULE FALL'S HEADER STATES AND THIS FILE INHERITS: a room's scene is
   drawn at the size the room actually measures, 1:1, and everything inside it
   is positioned as a fraction of that size. preserveAspectRatio="slice" does
   not crop, it SCALES, and that mistake shipped in the meadow once already.

   And one Winter learned by drawing it (2026-09-01, the wireframe spike): on a
   phone the scene's TOP band is thinner than the file makes it look. The HUD,
   the quest strip and the rail cover the first quarter of the screen and the
   bed chip sits under them, so a tree standing up into the top band lands
   behind the chip. Winter's horizon carries a flat TREELINE rather than two
   standing trees for exactly that reason.

   Winter's material, and why it is not Fall's (docs/05 check 5): the world
   here is SNOW, so both of the board's tiers have to be darker than the world
   — the opposite polarity to Fall's pale trug on olive ground. The frame is
   the dark body and the cells are the mid body, which is the garden's own
   arrangement, one season on. Cells that went near-black lost the ink bloom
   outline and the ink empty-marker entirely; that was the first pass. */

const Winter = (() => {
  const INK = '#2c1a10';

  /* A reference composition only. Never a viewBox for a real room. */
  const VIEW = { w: 390, h: 844 };

  const SKIES = {
    sun: {
      sky1: '#9fb6cc', sky2: '#c3d8e6', sky3: '#eef4f8',
      hillFar: '#b9cbdb', hillNear: '#a3b8cc',
      ground: '#ffffff', groundDark: '#cfdfec', groundLight: '#ffffff',
      shadow: '#b6cbdd',
      hedge: '#2f5238', hedgeLit: '#3f6b47',
      trunk: '#4a3a30', cap: '#ffffff',
      haze: 'rgba(255,255,255,.34)'
    },
    moon: {
      sky1: '#1c2740', sky2: '#2e3a58', sky3: '#46506e',
      hillFar: '#3d4a68', hillNear: '#2f3c57',
      ground: '#c8d6e8', groundDark: '#8497b4', groundLight: '#d8e2f0',
      shadow: '#7185a4',
      hedge: '#1e3626', hedgeLit: '#2a4a31',
      trunk: '#33291f', cap: '#c8d6e8',
      haze: 'rgba(140,160,210,.22)'
    }
  };

  /* The board's cells and the plants that stand in them. Real winter bloomers,
     because the season's identity is that these flowers actually open in snow
     — which is also where Holly comes from. Six silhouettes, hand-built: a
     season whose six plants are one ring recipe recoloured reads as a
     placeholder, and each of these has a shape worth stealing. */
  const PLANTS = {
    snowdrop:   { c1: '#ffffff', c2: '#dcefe4', shape: 'bell' },
    jasmine:    { c1: '#ffd84d', c2: '#fff0b0', shape: 'star' },
    cyclamen:   { c1: '#e8437f', c2: '#ffb3d1', shape: 'swept' },
    paperwhite: { c1: '#fffdf7', c2: '#ffe9a8', shape: 'cup' },
    hazel:      { c1: '#f08c00', c2: '#ffc93c', shape: 'ribbon' },
    camellia:   { c1: '#c2264f', c2: '#ff8fab', shape: 'rose' }
  };

  const LEAF = '#2f6d4a';
  const LEAF_L = '#3f8a5c';
  const r2 = (n) => Math.round(n * 100) / 100;

  /* ---------- the scene ----------
     Back to front: sky, haze, far hills, a snow-capped hedge line along the
     horizon with a bare treeline standing in it, then the snow field and its
     drifts. Every y is a fraction of the measured height. */
  function scene({ width, height, dockHeight = 96, sky = 'sun' } = {}) {
    const w = Math.max(320, Math.round(width || VIEW.w));
    const h = Math.max(480, Math.round(height || VIEW.h));
    const P = SKIES[sky] || SKIES.sun;
    const horizon = Math.round(h * 0.20);
    const groundTop = Math.round(h * 0.70);
    const dense = (per) => Math.max(3, Math.round(w / per));

    const hills = `
      <path d="M${-w * 0.1} ${horizon + 44} Q${w * 0.24} ${horizon - 30} ${w * 0.52} ${horizon + 26}
               Q${w * 0.8} ${horizon + 66} ${w * 1.1} ${horizon + 10} V${h} H${-w * 0.1} Z"
            fill="${P.hillFar}"/>
      <path d="M${-w * 0.1} ${horizon + 78} Q${w * 0.36} ${horizon + 18} ${w * 0.68} ${horizon + 70}
               Q${w * 0.9} ${horizon + 100} ${w * 1.1} ${horizon + 60} V${h} H${-w * 0.1} Z"
            fill="${P.hillNear}"/>`;

    /* The hedge line, snow lying along its top — the same silhouette the season
       gates use, laid out flat, with the cap that makes it read as winter
       rather than as a dark band. */
    let hedge = '';
    const hedgeW = Math.round(w / dense(150));
    const base = horizon + 46;
    for (let x = -hedgeW; x < w + hedgeW; x += hedgeW) {
      const lift = 8 + ((x / hedgeW) % 3) * 5;
      hedge += `<path d="M${x} ${base} V${base - 18 - lift}
        Q${x + hedgeW * 0.18} ${base - 38 - lift} ${x + hedgeW * 0.4} ${base - 30 - lift}
        Q${x + hedgeW * 0.68} ${base - 46 - lift} ${x + hedgeW} ${base - 20 - lift}
        V${base} Z" fill="${P.hedge}"/>`;
      hedge += `<path d="M${x} ${base - 20 - lift}
        Q${x + hedgeW * 0.2} ${base - 44 - lift} ${x + hedgeW * 0.42} ${base - 34 - lift}
        Q${x + hedgeW * 0.7} ${base - 50 - lift} ${x + hedgeW} ${base - 24 - lift}
        Q${x + hedgeW * 0.66} ${base - 40 - lift} ${x + hedgeW * 0.4} ${base - 24 - lift}
        Q${x + hedgeW * 0.2} ${base - 34 - lift} ${x} ${base - 20 - lift} Z" fill="${P.cap}"/>`;
    }

    /* Bare trees standing IN the hedge line rather than in front of it. Their
       whole job is to break the horizon; a bare winter tree is branches and a
       trunk, so there is no canopy to hide the board behind. */
    let trees = '';
    const treeN = Math.max(3, Math.round(w / 130));
    for (let i = 0; i < treeN; i += 1) {
      const x = r2(((i * 137) % 100) / 100 * (w * 0.92) + w * 0.04);
      const sc = 0.8 + ((i * 37) % 40) / 100;
      trees += `<g transform="translate(${x} ${base + 4}) scale(${r2(sc)})">
        <path d="M0 0V-52" stroke="${P.trunk}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M0 -30L-14 -43M0 -37L13 -49M0 -20L-10 -29M0 -44L9 -56"
              stroke="${P.trunk}" stroke-width="3.8" stroke-linecap="round"/>
        <path d="M0 -31L-12 -42M0 -38L11 -48" stroke="${P.cap}" stroke-width="2.4" stroke-linecap="round"/>
      </g>`;
    }

    /* The snow field: a mass first and drifts second. A flat white band is the
       placeholder docs/05 warns about, so the drifts and the blue shadow under
       them are what give it a surface. */
    let drifts = '';
    const step = Math.max(46, Math.round(w / dense(64)));
    for (let x = -step; x < w + step; x += step) {
      const y = groundTop + 18 + ((x / step) % 3) * 9;
      drifts += `<ellipse cx="${x}" cy="${y}" rx="${step * 0.66}" ry="11" fill="${P.shadow}" opacity=".55"/>`;
      drifts += `<ellipse cx="${x}" cy="${y - 6}" rx="${step * 0.64}" ry="11" fill="${P.groundLight}"/>`;
      /* A second, offset course. One row of drifts on a white field is still a
         white field with a line on it — a mass first, and detail second, is
         the same lesson the meadow's grass band records. */
      drifts += `<ellipse cx="${x + step * 0.5}" cy="${y + 34}" rx="${step * 0.5}" ry="9" fill="${P.shadow}" opacity=".4"/>`;
      drifts += `<ellipse cx="${x + step * 0.5}" cy="${y + 29}" rx="${step * 0.48}" ry="9" fill="${P.groundLight}"/>`;
    }

    return `<svg class="winter-scene" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"
      preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="winter-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${P.sky1}"/>
          <stop offset="0.52" stop-color="${P.sky2}"/>
          <stop offset="1" stop-color="${P.sky3}"/>
        </linearGradient>
        <!-- The last 44px fade to the page's own lawn, exactly as Fall's does.
             iOS paints any strip below a short window with the flat body
             colour, and a hard edge there is the line the whole layout pass
             went looking for once already. -->
        <linearGradient id="winter-foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${P.groundDark}" stop-opacity="0"/>
          <stop offset="1" stop-color="#4fae54"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#winter-sky)"/>
      <rect x="0" y="${horizon - 40}" width="${w}" height="${h * 0.4}" fill="${P.haze}"/>
      ${hills}
      ${hedge}
      ${trees}
      <path d="M0 ${groundTop + 26} Q${w * 0.3} ${groundTop - 4} ${w * 0.56} ${groundTop + 16}
               Q${w * 0.82} ${groundTop + 34} ${w} ${groundTop + 8} V${h} H0 Z" fill="${P.ground}"/>
      ${drifts}
      <rect x="0" y="${h - 44}" width="${w}" height="44" fill="url(#winter-foot)"/>
    </svg>`;
  }

  /* ---------- the cell floor ----------
     Frozen earth, the board's MID tier. It keeps the plot's own three-stop
     body rather than covering it with one flat colour: an opaque child is
     exactly what flattens a surface the CSS underneath had already built. */
  function cellFloor(i) {
    const tilt = (i % 3) * 4 - 4;
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" class="wp-floor">
      <defs><linearGradient id="wp-body-${i}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7d8798"/>
        <stop offset="0.72" stop-color="#68717f"/>
        <stop offset="1" stop-color="#565e6b"/>
      </linearGradient></defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#wp-body-${i})"/>
      <ellipse cx="26" cy="22" rx="13" ry="11" fill="rgba(255,255,255,.14)"/>
      <ellipse cx="72" cy="62" rx="10" ry="8" fill="rgba(0,0,0,.12)"/>
      <ellipse cx="50" cy="${80 + tilt * 0.3}" rx="22" ry="7" fill="#8d97a7" opacity=".55"/>
      <ellipse cx="${34 + tilt}" cy="34" rx="9" ry="6" fill="#8a94a4" opacity=".5"/>
      <ellipse cx="${70 - tilt}" cy="54" rx="7" ry="5" fill="#4f5763" opacity=".5"/>
      <!-- Frost along the cell's own rim: the season on the object, not only
           behind it. -->
      <path d="M0 8 Q14 2 28 8 Q42 14 56 7 Q70 1 84 8 Q94 13 100 8 V0 H0 Z" fill="#e9f1f8" opacity=".7"/>
    </svg>`;
  }

  /* ---------- the plants ----------
     Three growth stages, as Fall's crops have: a shoot, a bud on a stem, and
     the bloom. Winter deliberately does NOT use the main garden's four-stage
     `data-stage` system — that block is Summer's and the icon exporter's
     anchors live inside it. */
  function bloom(id, stage, sleeping) {
    const p = PLANTS[id] || PLANTS.snowdrop;
    const s = stage === undefined ? 3 : stage;
    const st = `stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"`;
    const stem = (d, wgt) => `<path d="${d}" fill="none" stroke="${LEAF}" stroke-width="${wgt || 6.5}" stroke-linecap="round"/>`;
    const strap = (d) => `<path d="${d}" fill="${LEAF}" ${st}/>`;
    /* THE SLEEPING FACE, redrawn for a plant. The creatures' grammar is shut-eye
       arcs on a body; a plant's only face is its flower, so the arcs go on the
       bloom. Same 3-weight round-capped curve critters.js uses. */
    const eyes = (y, gap, ew) => (sleeping
      ? `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round">
           <path d="M${-gap - ew} ${y} q${ew / 2} ${ew * 0.5} ${ew} 0"/>
           <path d="M${gap} ${y} q${ew / 2} ${ew * 0.5} ${ew} 0"/></g>`
      : '');

    if (s === 1) {
      return wrap(`${stem('M50 96 V72', 5)}
        ${strap('M50 76 c-13 0-21-7-23-17 12-2 21 4 23 17Z')}
        ${strap('M50 82 c13 0 21-7 23-17-12-2-21 4-23 17Z')}`);
    }
    if (s === 2) {
      return wrap(`${stem('M50 96 V50')}
        ${strap('M50 80 c-13 0-21-7-23-17 12-2 21 4 23 17Z')}
        <path d="M50 26 c9 6 13 15 11 24 -2 8-6 12-11 12 -5 0-9-4-11-12 -2-9 2-18 11-24Z"
          fill="${p.c1}" ${st}/>
        <path d="M43 56 c-3 8 3 12 7 12 4 0 10-4 7-12 -4 4-10 4-14 0Z" fill="${LEAF}" ${st}/>`);
    }

    let body = '';
    if (p.shape === 'bell') {
      /* Galanthus: a nodding white bell on a hooked pedicel, with the spathe
         leaf at the bend. The NOD is the species — a snowdrop drawn upright is
         a white crocus. The three tepals have to stay three, or the whole
         thing reads as an egg; the ink between them is the silhouette. */
      body = `${stem('M50,112 C50,88 46,64 40,40')}
        ${strap('M34,112 C29,90 32,70 40,60 C43,78 40,98 40,112 Z')}
        ${stem('M40,40 C36,27 42,18 52,20', 5)}
        ${strap('M41,31 C31,27 22,31 20,39 C29,43 39,39 41,31 Z')}
        <g ${st}>
          <path d="M52,22 C30,25 19,45 26,64 C31,76 44,78 49,67 C46,49 47,32 52,22 Z" fill="${p.c1}"/>
          <path d="M52,22 C74,25 85,45 78,64 C73,76 60,78 55,67 C58,49 57,32 52,22 Z" fill="${p.c1}"/>
          <path d="M52,27 C43,32 39,48 43,62 C46,71 58,71 61,62 C65,48 61,32 52,27 Z" fill="${p.c2}"/>
        </g>
        <path d="M46,60 q6,7 12,0" fill="none" stroke="#4f9b6d" stroke-width="3.4" stroke-linecap="round"/>
        <g transform="translate(52 46)">${eyes(0, 3, 8)}</g>`;
    } else if (p.shape === 'star') {
      /* Jasminum nudiflorum flowers on BARE green twigs — no leaves at all, and
         that absence is the plant's whole winter look. */
      let f = '';
      for (let i = 0; i < 6; i += 1) {
        f += `<path d="M0,0 C-9,-6 -10,-20 0,-27 C10,-20 9,-6 0,0 Z" fill="${i % 2 ? p.c2 : p.c1}" transform="rotate(${i * 60})"/>`;
      }
      const floret = (sc) => `<g transform="scale(${sc})"><g ${st}>${f}<circle r="6.5" fill="#fff3c4"/></g></g>`;
      body = `${stem('M50,112 C50,88 52,64 48,42')}
        ${stem('M50,86 C60,80 66,70 68,58', 4.5)}${stem('M50,68 C40,62 34,54 32,44', 4.5)}
        <g transform="translate(68 54)">${floret(0.5)}</g>
        <g transform="translate(32 40)">${floret(0.5)}</g>
        <g transform="translate(48 34)">${floret(1)}
          <circle r="9" fill="#fff3c4"/>${eyes(-2, 3, 8)}</g>`;
    } else if (p.shape === 'swept') {
      /* Cyclamen: the flower nods and every petal sweeps straight UP off it —
         the one silhouette in this game that nothing else has. */
      let f = '';
      for (let i = 0; i < 5; i += 1) {
        f += `<path d="M0,4 C-7,-8 -5,-24 0,-32 C5,-24 7,-8 0,4 Z" fill="${i % 2 ? p.c2 : p.c1}" transform="rotate(${-38 + i * 19})"/>`;
      }
      body = `${stem('M50,112 C50,88 54,66 48,50')}
        ${strap('M34,112 C28,92 32,74 42,66 C44,82 40,98 40,112 Z')}
        ${strap('M66,112 C72,94 68,78 59,70 C57,84 60,98 60,112 Z')}
        <g transform="translate(48 48)"><g ${st}>${f}</g>
          <path d="M-6,2 C-3,8 3,8 6,2" fill="${p.c1}" ${st}/>${eyes(-12, 4, 9)}</g>`;
    } else if (p.shape === 'cup') {
      /* Narcissus papyraceus: six flat tepals round a short cup, two or three
         to a head. The cup is what stops it reading as a daisy. */
      const floret = (sc) => {
        let f = '';
        for (let i = 0; i < 6; i += 1) {
          f += `<path d="M0,0 C-8,-7 -8,-19 0,-24 C8,-19 8,-7 0,0 Z" fill="${p.c1}" transform="rotate(${i * 60})"/>`;
        }
        return `<g transform="scale(${sc})"><g ${st}>${f}<circle r="8.5" fill="${p.c2}"/><circle r="5" fill="#ffd84d"/></g></g>`;
      };
      body = `${stem('M50,112 C50,88 50,66 50,46')}
        ${strap('M36,112 C32,88 36,66 44,58 C46,76 42,96 42,112 Z')}
        <g transform="translate(28 50)">${floret(0.56)}</g>
        <g transform="translate(72 46)">${floret(0.56)}</g>
        <g transform="translate(50 30)">${floret(0.86)}${eyes(-2, 4, 9)}</g>`;
    } else if (p.shape === 'ribbon') {
      /* Hamamelis: crumpled straps straight off a bare twig, no petal shape at
         all. Stroked rather than filled, and fat enough not to be the hairline
         a flat fill inside one thick outline exists to avoid. */
      const spider = (sc) => {
        let f = '';
        for (let i = 0; i < 10; i += 1) {
          f += `<path d="M0,-3 C5,-12 2,-22 7,-30" fill="none" stroke="${i % 2 ? p.c2 : p.c1}" stroke-width="4" stroke-linecap="round" transform="rotate(${i * 36})"/>`;
        }
        return `<g transform="scale(${sc})">${f}<circle r="6.5" fill="#7d4f2a" stroke="${INK}" stroke-width="2.6"/></g>`;
      };
      body = `${stem('M50,112 C50,90 46,70 40,52', 7)}
        ${stem('M46,80 C58,74 66,64 70,50', 5)}${stem('M44,66 C34,60 28,52 26,42', 5)}
        <g transform="translate(70 44)">${spider(0.52)}</g>
        <g transform="translate(26 38)">${spider(0.52)}</g>
        <g transform="translate(40 46)">${spider(0.8)}
          <circle r="8.5" fill="#7d4f2a" stroke="${INK}" stroke-width="2.6"/>${eyes(-2, 3, 8)}</g>`;
    } else {
      /* Camellia: a formal double — three tight concentric rings and glossy
         dark leaves. The only bloom here with any weight, which is what the
         top of a cost ladder should look like. */
      const PETAL = 'M0,-38 C13,-38 19,-26 17,-16 C15,-6 8,-1 0,-1 C-8,-1 -15,-6 -17,-16 C-19,-26 -13,-38 0,-38 Z';
      let f = '';
      for (let i = 0; i < 8; i += 1) f += `<path d="${PETAL}" fill="${p.c1}" transform="rotate(${i * 45}) scale(0.72)"/>`;
      for (let i = 0; i < 7; i += 1) f += `<path d="${PETAL}" fill="${p.c2}" transform="rotate(${i * 51 + 24}) scale(0.5)"/>`;
      for (let i = 0; i < 5; i += 1) f += `<path d="${PETAL}" fill="${p.c1}" transform="rotate(${i * 72 + 40}) scale(0.3)"/>`;
      body = `${stem('M50,112 C50,88 50,68 50,52')}
        <path d="M50,96 C34,98 22,88 18,74 C34,68 46,80 50,96 Z" fill="${LEAF}" ${st}/>
        <path d="M50,84 C66,86 78,76 82,62 C66,56 54,68 50,84 Z" fill="${LEAF_L}" ${st}/>
        <g transform="translate(50 40)"><g ${st}>${f}</g>
          <circle r="6" fill="#fff3c4" stroke="${INK}" stroke-width="2.4"/>${eyes(-2, 5, 10)}</g>`;
    }
    return `<svg viewBox="6 6 100 106" class="winter-bloom" aria-hidden="true">${body}</svg>`;
  }

  const wrap = (inner) => `<svg viewBox="6 6 88 92" class="winter-bloom" aria-hidden="true">${inner}</svg>`;

  /* ---------- the quilt ----------
     Patchwork, because a plain blanket is the placeholder docs/05 names and six
     cream squares are a bandage. Cream and frost carry it and one warm patch
     stops it going cold; a nursery palette is not the same thing as a cosy one.

     It covers the bottom of the cell and NOT the plant, which is the study the
     owner picked: tucked to the shoulders, so a covered bed is still a bed you
     can read. A quilt over the whole cell loses the count the chip points at. */
  const QUILT = ['#fff8e7', '#dbe8f2', '#ffeecd', '#e8d7e4', '#ffe0ad', '#cfe0ee'];
  function quilt() {
    const W = 100;
    const H = 40;
    const cols = 3;
    const rows = 2;
    const cw = W / cols;
    const ch = H / rows;
    let patches = '';
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        patches += `<rect x="${c * cw}" y="${8 + r * ch}" width="${cw}" height="${ch}" fill="${QUILT[(r * cols + c) % QUILT.length]}"/>`;
      }
    }
    let hem = `M0 ${8 + H}`;
    for (let i = 0; i < 5; i += 1) hem += ' q10 9 20 0';
    hem += ` V${8 + H} Z`;
    /* preserveAspectRatio="none" stretches the box to the cell, which stretches
       the stroke with it — and `vector-effect` DOES NOT INHERIT through a <g>,
       so putting it on the group left the house outline 28% thinner on the
       horizontals than on the verticals. It goes on every drawn shape. */
    const ve = 'vector-effect="non-scaling-stroke"';
    return `<svg viewBox="0 0 100 58" preserveAspectRatio="none" aria-hidden="true" class="wi-quilt-svg">
      <g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
        <g ${ve}>${patches}</g>
        <path d="${hem}" fill="#fff8e7" ${ve}/>
        <rect x="0" y="8" width="${W}" height="${H}" fill="none" ${ve}/>
      </g>
      <rect x="2" y="10" width="${W - 4}" height="3" fill="#fffdf7"/>
    </svg>`;
  }

  /* ---------- the Zs ----------
     Solid white and DELIBERATELY UNOUTLINED, which is the one place the house
     rule of "flat fill inside one thick outline" is broken on purpose — the
     same exception critters.js takes, and for the same reason: these are a
     wisp coming off a sleeper rather than a thing in the world. Geometry
     copied from critters.js so a plant's sleep and a pet's sleep are one
     grammar. Visible at rest; the drift is a flourish on top. */
  function zGlyph(x, y, s, i) {
    const t = s * 0.34;
    const d = `M${x} ${y} H${x + s} V${y + t} L${x + t * 1.4} ${y + s - t} H${x + s} V${y + s}`
      + ` H${x} V${y + s - t} L${x + s - t * 1.4} ${y + t} H${x} Z`;
    return `<path class="wi-z" style="--i:${i}" d="${d}"/>`;
  }
  function zzz() {
    return `<svg viewBox="0 0 60 50" class="wi-zzz" aria-hidden="true"><g fill="#ffffff">
      ${zGlyph(2, 30, 10, 0)}${zGlyph(16, 15, 12, 1)}${zGlyph(32, -2, 14, 2)}
    </g></svg>`;
  }

  return { scene, cellFloor, bloom, quilt, zzz, PLANTS, VIEW, INK, SKIES };
})();

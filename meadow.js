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
      stone: '#bfae95', stoneLit: '#d3c4a9', stoneDeep: '#9a8870', moss: '#8ab455',
      turf: '#63a94a', turfDeep: '#4a8b3b', turfLit: '#8fc95d',
      seed: '#e8d08a'
    },
    moon: {
      hi: '#2b2f63', lo: '#5a5f9c', sun: '#e8eeff', sunGlow: '#b9c2e8',
      far: '#3f6e42', farDeep: '#2f5636', bank: '#57764a', bankDeep: '#465f3c',
      willow: '#2f6136', willowDeep: '#254e2c', willowLit: '#3b7742',
      stone: '#7f7a70', stoneLit: '#948f84', stoneDeep: '#66625a', moss: '#4a6b3c',
      turf: '#3c6b3a', turfDeep: '#2c5230', turfLit: '#4f8544',
      seed: '#9c8f68'
    }
  };

  /* The size the composition was drawn against. The scene is now rendered at
     whatever the room actually measures, so this is a REFERENCE, not a viewport:
     things anchored to an edge are offset by the difference. Slicing a 390-wide
     composition into a 1500-wide window scaled every blade of grass by four and
     is what made this screen read as a prototype. */
  const VIEW = { width: 390, height: 844 };
  const HORIZON = Math.round(VIEW.height * 0.26);

  /* The board's own furniture. The scene is composed like the garden's — sky,
     ground, a boundary, pets, dock — but every piece of furniture is different,
     because a meadow is land nobody tends: a dry-stone wall instead of a fence,
     unmown grass instead of mown stripes, and warm bleached green instead of the
     garden's bright lawn. Same structure, different place. */

  /* The keepers stand on the bank between the board and the wall. Sitting them
     at the wall's own height put a pale slab across its top course, which read
     as a stone lid rather than as somebody standing in front of it. */
  const KEEPERS = [{ x: 122, y: 612 }, { x: 268, y: 612 }];
  const KEEPER_SIZE = 70;

  function sky(c, w, h) {
    const sx = Math.round(w * 0.9);
    const sy = Math.round(h * 0.45);
    return `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#mw-sky)"/>
      <circle cx="${sx}" cy="${sy}" r="46" fill="${c.sunGlow}" opacity=".5"/>
      <circle cx="${sx}" cy="${sy}" r="30" fill="${c.sun}"/>`;
  }

  function clouds(c, w, horizon) {
    return [[0.12, 0.55, 1, -19], [0.6, 0.32, 0.72, -44], [0.77, 0.77, 0.56, -8]]
      .map(([fx, fy, k, delay], i) => `
        <g transform="translate(${Math.round(w * fx)} ${Math.round(horizon * fy)}) scale(${k})">
          <g class="mw-cloud" style="--dur:${56 + i * 15}s;--delay:${delay}s">
            <path d="M0,0 a34,34 0 0 1 58,-18 a40,40 0 0 1 68,8 a30,30 0 0 1 2,10 Z"
              fill="#fff" opacity=".8"/></g>
        </g>`).join('');
  }

  /* Unmown grass with seed heads on it — the single clearest signal that nobody
     mows here, where the garden's lawn has neat stripes.

     It is a MAT with blades growing out of it, and that is the whole lesson of
     this function. The first version was tall thin strokes scattered across the
     full height of whatever stood behind them, and over the dry-stone wall it
     read as a broken comb laid on the stones rather than as grass growing at
     their foot. Grass is a mass first and blades second: the mat hides every
     blade's base, so the blades read as the top of something dense instead of
     as sticks planted in mid-air. */
  function grassBand(c, y, w, opts) {
    const o = opts || {};
    const band = o.band || 26;
    const tall = o.tall || 34;
    const n = o.n || Math.round(w / 11);
    const lo = o.back ? c.turfDeep : c.turf;
    const hi = o.back ? c.turf : c.turfLit;

    /* A soft bumpy top edge. A straight line reads as a painted stripe. */
    const mat = (top, depth, fill, bump) => {
      const step = 26;
      let d = `M-6,${(top + depth).toFixed(1)} L-6,${top.toFixed(1)}`;
      for (let i = 0; i * step < w + 12; i += 1) {
        d += ` q${(step / 2).toFixed(1)},${(-bump - (i % 3) * 2.5).toFixed(1)} ${step},0`;
      }
      return `<path d="${d} L${w + 6},${(top + depth).toFixed(1)} Z" fill="${fill}"/>`;
    };

    let blades = '';
    for (let i = 0; i < n; i += 1) {
      const x = -6 + i * ((w + 12) / n) + (i % 3) * 3;
      const h = tall * (0.52 + (i % 5) * 0.13);
      const lean = (i % 2 ? 8 : -8) * (0.7 + (i % 3) * 0.2);
      const tipX = x + lean * 1.5;
      const tipY = y - h;
      blades += `<g class="mw-blade" style="--i:${i % 7}">
        <path d="M${x.toFixed(1)},${(y + 10).toFixed(1)} C${x.toFixed(1)},${(y - h * 0.3).toFixed(1)} ${(x + lean).toFixed(1)},${(y - h * 0.66).toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}"
          fill="none" stroke="${i % 3 === 1 ? hi : lo}" stroke-width="${(3.6 + (i % 3) * 0.5).toFixed(1)}"
          stroke-linecap="round"/>
        ${i % 4 === 0 ? `<ellipse cx="${tipX.toFixed(1)}" cy="${tipY.toFixed(1)}" rx="3.2" ry="6.5"
          fill="${c.seed}" transform="rotate(${lean.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)})"/>` : ''}
      </g>`;
    }

    return `<g>
      ${mat(y - 4, band + 12, lo, 7)}
      ${blades}
      ${mat(y + 5, band, hi, 5)}
    </g>`;
  }

  function wildflowers(c, w, top, bottom) {
    const span = Math.max(40, bottom - top);
    const set = [
      [0.05, 0.62, '#ffd6e8'], [0.95, 0.58, '#c9b6ff'], [0.13, 0.8, '#ffe066'],
      [0.88, 0.84, '#ffd6e8'], [0.03, 0.97, '#c9b6ff'], [0.97, 0.94, '#ffe066'],
      [0.27, 0.93, '#ffe066'], [0.72, 0.96, '#ffd6e8'], [0.45, 0.99, '#c9b6ff']
    ];
    return set.map(([fx, fy, col], i) => `
      <g class="mw-flower" style="--i:${i % 5}"
        transform="translate(${Math.round(w * fx)} ${Math.round(top + span * fy)})">
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
  function willow(c, w, horizon) {
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
    return `<g transform="translate(${(w - VIEW.width).toFixed(0)} ${(horizon - HORIZON).toFixed(0)})">
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
    /* Stone size is the whole trick, and the first pass got it wrong by about
       three times: at 46px a course crossed the screen in eight stones and read
       as a row of pills. A stone is measured against the creature standing next
       to it — the keeper is the ruler. */
    const courses = [15, 13, 16];
    const step = 21;
    const tones = [c.stoneLit, c.stone, c.stoneDeep];
    let cope = '';
    for (let i = -1; i < Math.ceil(w / 15) + 1; i += 1) {
      const cw = 10 + ((i * 2) % 3) * 2;
      const ch = 16 + ((i * 3) % 4) * 3;
      cope += `<rect x="${i * 15 + (i % 2) * 1.5}" y="${y - ch + 4}" width="${cw}" height="${ch}"
        rx="4" fill="${tones[(i + (i % 2) * 2) % 3]}" stroke="${INK}" stroke-width="2.6"/>`;
    }
    let stones = '';
    let top = y;
    courses.forEach((h, r) => {
      for (let i = -1; i < Math.ceil(w / step) + 1; i += 1) {
        const sw = step - 5 + ((i * 3 + r) % 4) * 3;
        const dy = ((i + r * 2) % 3) - 1;
        const dh = ((i * 2 + r) % 3) - 1;
        const x = i * step + (r % 2) * 10 + ((i + r * 2) % 2) * 1.5;
        stones += `<rect x="${x.toFixed(1)}" y="${top + dy}" width="${sw}" height="${h + dh}"
          rx="${4 + ((i + r) % 3)}"
          fill="${tones[(i * 2 + r * 2 + (i % 3)) % 3]}" stroke="${INK}" stroke-width="2.6"/>`;
      }
      top += h + 2;
    });
    /* Moss in the joints, never on a stone face — it is damp collecting in the
       gaps, and a patch sitting on top of a stone reads as lichen paint. */
    let moss = '';
    [26, 88, 147, 209, 268, 331].forEach((x, i) => {
      const my = y + 12 + (i % 3) * 21;
      moss += `<path d="${blob(x, my, 11, 4.5, 7, i * 1.7)}" fill="${c.moss}" opacity=".85"/>`;
    });
    return `<g>${stones}${cope}${moss}</g>`;
  }

  /* The floor of a cell, and the piece that says what the verb is.

     The garden's plots are SOIL — dug, planted, harvested, emptied — and that
     is the right material for something temporary. A meadow cell is permanent:
     you set a hive down once and it stays. So the meadow's cells are COBBLES, a
     surface somebody laid and left. Sharing the board and differing in the
     material is the house rule working exactly as intended — same grammar,
     different verb — and it is also what finally separates this board from the
     green world it sits in, which no amount of detail on a green cell could.

     Colours come from custom properties rather than the sky table, so night
     recolours every cell without any of them being rebuilt. */
  function cobbleFloor(seed) {
    const s = seed || 0;
    let stones = '';
    for (let r = 0; r < 7; r += 1) {
      const y = 2 + r * 16;
      const off = (r + s) % 2 ? 9 : 0;
      for (let i = -1; i < 6; i += 1) {
        const x = i * 18 + 9 + off;
        const tone = ((i + 6) + r * 2 + s) % 3;
        const rx = 9.4 + ((i + 6 + r + s) % 3) * 0.8;
        const ry = 7.4 + (((i + 6) * 2 + r + s) % 3) * 0.5;
        stones += `<path d="${blob(x, y, rx, ry, 7, i + r * 2 + s)}" fill="var(--cob-${tone + 1})"/>
          <path d="${blob(x - rx * 0.18, y - ry * 0.34, rx * 0.54, ry * 0.32, 7, i + r)}"
            fill="var(--cob-lit)"/>`;
      }
    }
    /* Moss collects in the joints. Two or three per cell — enough that the
       surface is old, few enough that it is still a floor. */
    let moss = '';
    [[18, 26], [72, 42], [36, 74], [90, 90], [9, 58]].forEach(([mx, my], i) => {
      if ((i + s) % 3 === 2) return;
      moss += `<path d="${blob(mx, my, 6, 3.2, 7, i + s * 1.3)}" fill="var(--cob-moss)" opacity=".55"/>`;
    });
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-2" y="-2" width="104" height="104" fill="var(--cob-joint)"/>
      ${stones}${moss}
    </svg>`;
  }

  /* The ground a keeper stands on. A creature with nothing under it floats, and
     a soft ellipse is not ground — it is a shadow with no floor to fall on. */
  function keeperSpot() {
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <ellipse cx="50" cy="84" rx="33" ry="12" fill="rgba(16,10,6,.3)"/>
      <ellipse cx="50" cy="81" rx="32" ry="11" fill="var(--mw-tread)"/>
      <ellipse cx="47" cy="78" rx="20" ry="5" fill="rgba(255,250,238,.13)"/>
      ${[19, 33, 66, 81].map((x, i) => `<path d="M${x},${88 - (i % 2) * 3}
        q${i % 2 ? 4 : -4},-10 ${i % 2 ? 7 : -7},-1" fill="none" stroke="var(--mw-tuft)"
        stroke-width="4.4" stroke-linecap="round"/>`).join('')}
    </svg>`;
  }

  /* Everything that stands in a cell stands on a worn pad. A piece dropped
     straight onto the setts floats, and its own shadow cannot rescue it — a
     dark shadow on a dark floor is invisible, which is exactly why the first
     meadow's objects looked pasted on. The pad is the ground; the shadow on top
     of it is the contact. */
  function pad(cx, cy, rx) {
    return `<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx + 2}" ry="${(rx * 0.33).toFixed(1)}"
        fill="rgba(255,250,238,.1)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.3).toFixed(1)}" fill="var(--cob-pad)"/>
      <ellipse cx="${cx - 2}" cy="${cy - 2}" rx="${(rx * 0.6).toFixed(1)}" ry="${(rx * 0.15).toFixed(1)}"
        fill="rgba(255,250,238,.12)"/>`;
  }

  /** A hive on the board. */
  function hive() {
    return `<svg viewBox="0 0 100 100" class="mw-hive-art" aria-hidden="true">
      ${pad(50, 86, 33)}
      <ellipse cx="50" cy="85" rx="26" ry="7" fill="rgba(20,12,7,.34)"/>
      <rect x="18" y="54" width="64" height="30" rx="7" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
      <rect x="14" y="34" width="72" height="24" rx="7" fill="#f0d59a" stroke="${INK}" stroke-width="5"/>
      <rect x="11" y="16" width="78" height="22" rx="8" fill="#e8c07a" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="50" cy="72" rx="8" ry="6" fill="${INK}"/>
    </svg>`;
  }

  /* One drawing per tender. They must read at a glance as DIFFERENT OBJECTS —
     a board of five recoloured squares is a spreadsheet with a hedge round it. */
  const TENDERS = {
    sun: (t) => `${pad(50, 82, 31)}
      <ellipse cx="50" cy="81" rx="24" ry="6.5" fill="rgba(20,12,7,.3)"/>
      <path d="${blob(50, 60, 32, 23, 9, 1.2)}" fill="#cdb98f" stroke="${INK}"
        stroke-width="5" stroke-linejoin="round"/>
      <path d="M22,66 C34,78 68,80 79,70 C77,80 64,84 50,84 C34,84 24,76 22,66 Z"
        fill="#a68d63" opacity=".8"/>
      <path d="${blob(43, 48, 19, 9, 8, 2.4)}" fill="#e6d5ac"/>
      <path d="M60,54 C68,56 72,62 71,68" fill="none" stroke="#a68d63" stroke-width="3.4"
        stroke-linecap="round" opacity=".75"/>
      ${[30, 50, 70].map((x, i) => `<path d="M${x},${30 - i % 2 * 4}
        c-5,-6 5,-10 0,-16" fill="none" stroke="${t}" stroke-width="4.5"
        stroke-linecap="round" opacity=".95"/>`).join('')}`,
    clover: (t) => `${pad(50, 84, 33)}
      <ellipse cx="50" cy="83" rx="26" ry="6.5" fill="rgba(20,12,7,.3)"/>
      ${[[30, 62, 1], [50, 52, 1.25], [70, 64, 1]].map(([x, y, k]) => `
        <g transform="translate(${x} ${y}) scale(${k})">
          <path d="M0,22 L0,4" stroke="#3f9950" stroke-width="5" stroke-linecap="round"/>
          <circle cx="-9" cy="-6" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
          <circle cx="9" cy="-6" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
          <circle cx="0" cy="-18" r="10" fill="${t}" stroke="${INK}" stroke-width="4"/>
        </g>`).join('')}`,
    stump: (t) => `${pad(50, 84, 33)}
      <ellipse cx="50" cy="83" rx="26" ry="6.5" fill="rgba(20,12,7,.3)"/>
      <path d="M20,82 C18,74 24,72 26,74 L26,42 C26,34 74,34 74,42 L74,74
        C77,71 83,74 80,82 Z" fill="${t}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      ${[36, 50, 64].map((x, i) => `<path d="M${x},${52 + i % 2 * 4} L${x + 1},${74 - i % 2 * 3}"
        fill="none" stroke="#9c6f42" stroke-width="3.6" stroke-linecap="round" opacity=".8"/>`).join('')}
      <ellipse cx="50" cy="42" rx="24" ry="10" fill="#e0be8c" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="50" cy="42" rx="14.5" ry="5.6" fill="none" stroke="#b58a5c" stroke-width="3.2"/>
      <ellipse cx="50" cy="42" rx="6" ry="2.4" fill="none" stroke="#b58a5c" stroke-width="2.6"/>
      <path d="M74,58 q14,-6 16,-18 q-16,2 -18,14 Z" fill="#57c15b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    willow: (t) => `${pad(50, 86, 29)}
      <ellipse cx="50" cy="85" rx="22" ry="6.5" fill="rgba(20,12,7,.3)"/>
      <path d="M45,84 L44,50 q0,-6 7,-6 q7,0 7,6 L57,84 Z" fill="#8a5a33"
        stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="${blob(50, 34, 29, 22, 11, 1.4)}" fill="${t}" stroke="${INK}"
        stroke-width="5" stroke-linejoin="round"/>
      <path d="${blob(40, 26, 13, 7, 7, 2.6)}" fill="#c9a3f5"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = 50 + (i - 3) * 11;
        const from = 44 + Math.abs(i - 3) * 3;
        const drop = from + 30 - Math.abs(i - 3) * 5;
        return `<path d="M${x},${from} C${x - 5},${from + 12} ${x + 5},${drop - 10} ${x - 2},${drop}"
          fill="none" stroke="${i % 2 ? '#3d7f43' : '#5aa85e'}" stroke-width="4.6"
          stroke-linecap="round"/>`;
      }).join('')}`,
    foxglove: (t) => `${pad(50, 86, 29)}
      <ellipse cx="50" cy="85" rx="22" ry="6.5" fill="rgba(20,12,7,.3)"/>
      ${[[32, 30, 5], [50, 16, 5], [68, 34, 4]].map(([x, top, sw]) => `
        <path d="M${x},84 C${x - 3},64 ${x + 3},48 ${x},${top}" fill="none" stroke="#3f9950"
          stroke-width="${sw}" stroke-linecap="round"/>
        ${[0, 1, 2, 3, 4].map((i) => {
          const cy = top + 13 + i * 12;
          const r = 4.6 + i * 0.7;
          if (cy > 78) return '';
          const side = i % 2 ? 1 : -1;
          const cx = x + side * (r + 1.5);
          return `<ellipse cx="${cx.toFixed(1)}" cy="${cy}" rx="${r.toFixed(1)}"
            ry="${(r * 1.32).toFixed(1)}" fill="${t}" stroke="${INK}" stroke-width="3.2"
            transform="rotate(${side * 22} ${cx.toFixed(1)} ${cy})"/>`;
        }).join('')}
        <ellipse cx="${x}" cy="${top}" rx="5.4" ry="6.2" fill="${t}" stroke="${INK}" stroke-width="3.4"/>`).join('')}`
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
    const wallTop = h - dock - 54;
    const dense = (per) => Math.max(12, Math.round(w / per));

    /* Drawn 1:1 at the room's real size, so `slice` has nothing left to scale.
       The viewBox and the pixel box agree by construction. */
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

      ${sky(c, w, horizon + 40)}
      ${clouds(c, w, horizon)}

      <path d="M0,${horizon + 10} C90,${horizon - 32} 190,${horizon + 6} 270,${horizon - 18}
        C320,${horizon - 32} 360,${horizon - 6} ${w},${horizon - 20}
        L${w},${horizon + 90} L0,${horizon + 90} Z" fill="${c.farDeep}"/>
      <path d="M0,${horizon + 56} C110,${horizon + 16} 230,${horizon + 62} 330,${horizon + 34}
        C360,${horizon + 26} 375,${horizon + 34} ${w},${horizon + 28}
        L${w},${h} L0,${h} Z" fill="${c.far}"/>

      <path d="M0,${horizon + 108} C120,${horizon + 66} 250,${horizon + 118} ${w},${horizon + 82}
        L${w},${h} L0,${h} Z" fill="${c.bank}"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#mw-warm)"/>

      ${willow(c, w, horizon)}
      ${grassBand(c, horizon + 104, w, { band: 14, tall: 24, n: dense(15), back: true })}
      ${wildflowers(c, w, horizon + 150, wallTop - 40)}

      <!-- The wall stands IN the grass: a band behind it, the wall, then a
           denser band at its foot. Grass drawn over the whole stone face was
           the single worst thing on this screen. -->
      ${grassBand(c, wallTop - 10, w, { band: 16, tall: 24, n: dense(14), back: true })}
      ${wall(c, wallTop, w)}
      ${grassBand(c, h - dock - 2, w, { band: 26, tall: 20, n: dense(11) })}
    </svg>`;
  }

  return { scene, cobbleFloor, keeperSpot, hive, tender, jar, bee, wall,
    KEEPERS, KEEPER_SIZE, VIEW, INK };
})();

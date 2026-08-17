/* Garden Wonder — the Hollow, the room under the garden.

   Same contract as flora.js and critters.js: parameters in, SVG out, knows
   nothing about the game. `tools/hollow-spike.html` and the live screen both
   draw from here, so the art cannot drift between the design lab and the build.

   House rule that governs everything below: warm earth, never stone. Night cools
   only the light coming through the crack — a cold palette on the walls turns the
   room into a cellar, which is the one failure this design is exposed to. */

const Hollow = (() => {
  const INK = '#2c1a10';

  const SKIES = {
    sun: {
      beam: '#fffbe8', shaft: '#fff3c4', sky: '#bfe6ff', above: '#8ed36b', aboveDeep: '#6cb551',
      wall: '#d9a86e', wallDeep: '#b8834c', chamber: '#f0c894', floorLip: '#c08d55'
    },
    moon: {
      beam: '#f2f6ff', shaft: '#dfe8ff', sky: '#2f3d6b', above: '#5f8f57', aboveDeep: '#456b41',
      wall: '#c99a68', wallDeep: '#a5764a', chamber: '#e2b785', floorLip: '#b07f4d'
    }
  };

  const MOSS = '#7cc47f';
  const MOSS_DEEP = '#5aa552';

  /** A scalloped edge, used for every mossy lip in the room. */
  function scallop(x, y, w, n) {
    let d = `M${x} ${y}`;
    const step = w / n;
    for (let i = 0; i < n; i += 1) d += ` q ${step / 2} -${7 + (i % 3) * 2.5} ${step} 0`;
    return d;
  }

  /* Moss on an overhanging lip, with a few runs of it over the edge. The drips go
     BEHIND the band so only the rounded bottom of each shows — drawn in front as
     narrow shapes they read as table legs. Only ever used where there is open air
     below; moss dripping onto more ground reads as a mistake. */
  function mossLip(x, y, w, n, drips) {
    let out = '';
    (drips || []).forEach(([t, len, r]) => {
      out += `<ellipse cx="${x + w * t}" cy="${y + 6 + len * 0.55}" rx="${r * 1.25}" ry="${len * 0.75}"
        fill="${MOSS}" stroke="${INK}" stroke-width="3"/>`;
    });
    out += `<path d="${scallop(x, y, w, n)} v 12 h -${w} Z" fill="${MOSS}"
      stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    return out;
  }

  /* An arch, not a circle. A round mouth reads as a sticker sitting on the moss;
     an arch encloses whoever is in it. */
  function nook(x, y, rw, rh, c) {
    const base = y + rh;
    return `<g class="hl-nook">
      <path d="M${x - rw} ${base} v-${rh * 0.42} a${rw} ${rh} 0 0 1 ${rw * 2} 0 v${rh * 0.42} Z"
        fill="${c.wallDeep}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M${x - rw + 6} ${base} v-${rh * 0.36} a${rw - 6} ${rh - 6} 0 0 1 ${(rw - 6) * 2} 0 v${rh * 0.36} Z"
        fill="${c.chamber}" opacity="0.5"/>
      ${mossLip(x - rw, base, rw * 2, 4, [[0.16, 10, 5], [0.5, 15, 6], [0.84, 8, 4]])}
    </g>`;
  }

  function cubby(x, y, rw, rh, c, items) {
    const base = y + rh;
    return `<g>
      <path d="M${x - rw} ${base} v-${rh * 0.4} a${rw} ${rh} 0 0 1 ${rw * 2} 0 v${rh * 0.4} Z"
        fill="${c.wallDeep}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M${x - rw + 6} ${base} v-${rh * 0.34} a${rw - 6} ${rh - 6} 0 0 1 ${(rw - 6) * 2} 0 v${rh * 0.34} Z"
        fill="${c.chamber}" opacity="0.45"/>
      ${mossLip(x - rw, base, rw * 2, 3, [[0.3, 9, 4], [0.74, 7, 4]])}
      ${items}
    </g>`;
  }

  /* A root has to be fat where it leaves the soil and thin where it ends. An
     even-width stroke reads as wire. */
  function root(d, w0, w1) {
    return `<g>
      <path d="${d}" fill="none" stroke="${INK}" stroke-width="${w0 + 7}" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#a5764a" stroke-width="${w0}" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#c08d55" stroke-width="${w1}" stroke-linecap="round"
        opacity="0.75" transform="translate(-2 -1)"/>
    </g>`;
  }

  /* Beside a burrow, never across one — a vine over a burrow mouth reads as
     growing through somebody's front door. And it has to hang from something. */
  function vine(x, y, len) {
    const leaf = (t, dir) => `<ellipse cx="${x + dir * 8}" cy="${y + len * t}" rx="8" ry="4.4"
      fill="${MOSS}" stroke="${INK}" stroke-width="2.5" transform="rotate(${dir * 24} ${x} ${y + len * t})"/>`;
    return `<g>
      <path d="M${x} ${y} q 7 ${len * 0.3} 0 ${len * 0.55} q -7 ${len * 0.25} 0 ${len * 0.45}"
        fill="none" stroke="${MOSS_DEEP}" stroke-width="4" stroke-linecap="round"/>
      ${leaf(0.22, -1)}${leaf(0.45, 1)}${leaf(0.68, -1)}${leaf(0.88, 1)}
    </g>`;
  }

  function wisp(w) {
    return `<g class="hl-wisp" style="--dx:${w.dx}px;--dy:${w.dy}px;--dur:${w.dur}s;--delay:${w.delay}s">
      <circle cx="${w.x}" cy="${w.y}" r="${w.r * 3.6}" fill="#ffe9a8" opacity="0.2"/>
      <circle cx="${w.x}" cy="${w.y}" r="${w.r * 2}" fill="#ffe066" opacity="0.4"/>
      <circle cx="${w.x}" cy="${w.y}" r="${w.r}" fill="#fffbe8" stroke="#ffd166" stroke-width="2"/>
    </g>`;
  }

  function mushroom(x, y, s, cap, spot) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-5 0h10v13a5 5 0 0 1-10 0Z" fill="#fff2dd" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-16 1c0-10 7-16 16-16s16 6 16 16c0 3-32 3-32 0Z" fill="${cap}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="-6" cy="-6" r="3.1" fill="${spot}"/><circle cx="6" cy="-8" r="2.4" fill="${spot}"/>
    </g>`;
  }

  function bloom(x, y, s, petal, mid) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 0v-9" stroke="${MOSS_DEEP}" stroke-width="2.6" stroke-linecap="round"/>
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-13" rx="3.4" ry="5" fill="${petal}"
        stroke="${INK}" stroke-width="1.8" transform="rotate(${a} 0 -9)"/>`).join('')}
      <circle cx="0" cy="-9" r="2.6" fill="${mid}" stroke="${INK}" stroke-width="1.6"/>
    </g>`;
  }

  /* The floor is ONE mass, not a lip stacked on a lawn. An earlier pass put a
     scalloped moss band above a flat green field, which read as two unrelated
     layers — and the band's drips hung over more ground, which is nonsense.
     Here the scallop IS the top of the ground, and everything roots into it. */
  function ground(y, c, H, W) {
    const soil = `M0 ${y} q 62 -16 122 -5 t 132 -3 q 78 -6 138 9 V${H} H0 Z`;
    return `<g>
      <path d="${soil}" fill="${c.floorLip}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${scallop(0, y + 20, W, 13)} V${H} H0 Z" fill="${MOSS}" stroke="${INK}"
        stroke-width="3.5" stroke-linejoin="round"/>
      <path d="${scallop(0, y + 40, W, 9)} V${H} H0 Z" fill="${MOSS_DEEP}" opacity="0.85"/>
    </g>`;
  }

  const KEEP = {
    pebble: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="#bcd9b0" stroke="${INK}" stroke-width="3"/>`,
    nail: (x, y) => `<path d="M${x} ${y + 4} l2 -15" stroke="#9aa7b0" stroke-width="4" stroke-linecap="round"/>
      <path d="M${x - 4} ${y - 11} h10" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    button: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#ffd6e0" stroke="${INK}" stroke-width="3"/>
      <circle cx="${x - 2.6}" cy="${y - 1}" r="1.5" fill="${INK}"/><circle cx="${x + 2.6}" cy="${y - 1}" r="1.5" fill="${INK}"/>`
  };

  /* Burrows are staggered rather than gridded, because earth is dug where it lets
     you. Percentages, so the layout survives a change of canvas size. */
  const NOOKS = [
    { x: 196, y: 196, rw: 54, rh: 44 },
    { x: 92, y: 288, rw: 60, rh: 50 },
    { x: 300, y: 350, rw: 58, rh: 48 },
    { x: 96, y: 464, rw: 58, rh: 48 },
    { x: 296, y: 546, rw: 56, rh: 46 }
  ];

  /* Where a creature sits, as a percentage of the canvas — five burrows and one
     spot on the floor, so one chamber holds six. */
  const SPOTS = [
    { left: 50.3, top: 25.6 },
    { left: 23.6, top: 36.6 },
    { left: 77, top: 44.2 },
    { left: 24.6, top: 58.1 },
    { left: 75.9, top: 67.7 },
    { left: 56, top: 78.4 }
  ];

  const WISPS = [
    { x: 58, y: 396, r: 8, dx: 14, dy: -26, dur: 7.5, delay: 0 },
    { x: 342, y: 254, r: 6.5, dx: -16, dy: -18, dur: 9, delay: 1.6 },
    { x: 206, y: 600, r: 8.5, dx: 12, dy: -30, dur: 8.2, delay: 3.1 },
    { x: 136, y: 168, r: 5.5, dx: -10, dy: -14, dur: 10, delay: 4.4 },
    { x: 352, y: 630, r: 7, dx: 12, dy: -22, dur: 8.8, delay: 2.2 },
    { x: 42, y: 592, r: 6, dx: 9, dy: -18, dur: 11, delay: 5.5 }
  ];

  /** Draw the room. `opts.dockHeight` is reserved at the bottom, so the floor
      sits above the dock rather than disappearing under it. */
  function scene(opts) {
    const o = opts || {};
    const W = o.width || 390;
    const H = o.height || 844;
    const c = SKIES[o.sky === 'moon' ? 'moon' : 'sun'];
    const floorY = H - (o.dockHeight === undefined ? 96 : o.dockHeight) - 62;

    const dust = Array.from({ length: 10 }, (_, i) => {
      const x = 170 + Math.round(Math.sin(i * 2.1) * 26) + i * 4;
      return `<circle class="hl-dust" cx="${x}" cy="150" r="${1.6 + (i % 3) * 0.7}" fill="${c.beam}"
        style="--dx:${(i % 2 ? 1 : -1) * (6 + i)}px;--dur:${11 + i}s;--delay:${i * 1.4}s"/>`;
    }).join('');

    return `<svg class="hollow-scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="hlWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${c.wall}"/><stop offset="100%" stop-color="${c.wallDeep}"/>
        </linearGradient>
        <radialGradient id="hlChamber" cx="50%" cy="24%" r="78%">
          <stop offset="0%" stop-color="${c.chamber}"/><stop offset="100%" stop-color="${c.wall}"/>
        </radialGradient>
        <linearGradient id="hlBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${c.shaft}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${c.shaft}" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect width="${W}" height="${H}" fill="url(#hlWall)"/>

      <rect x="0" y="0" width="${W}" height="34" fill="${c.sky}"/>
      <path d="M0 24 h${W} v18 H0 Z" fill="${c.above}"/>
      <path d="${scallop(0, 38, W, 10)} v10 H0 Z" fill="${c.aboveDeep}"/>
      <path d="M0 46 h${W} v58 H0 Z" fill="${c.wallDeep}"/>
      <path d="M0 46 h${W}" stroke="${INK}" stroke-width="3.5"/>

      <path d="M10 ${H} V244 C10 156 96 102 ${W / 2} 102 s186 54 186 142 V${H} Z"
        fill="url(#hlChamber)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>

      <!-- The crack: a bright gap with earth teeth hanging DOWN into it. Drawn as
           a jagged outline instead, it reads as a mountain range — in SVG a
           smaller y is higher, so the obvious version points the teeth upward. -->
      <g>
        <path d="M148 58 L166 49 L196 53 L222 48 L246 54 L254 72 L246 90 L156 87 L142 74 Z"
          fill="${c.beam}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M148 58 L166 49 L196 53 L222 48 L246 54 L252 66 L150 66 Z" fill="${c.sky}" opacity="0.8"/>
        <path d="M158 54 L170 86 L182 52 Z" fill="${c.wallDeep}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M194 51 L205 92 L218 50 Z" fill="${c.wallDeep}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M228 51 L237 80 L247 56 Z" fill="${c.wallDeep}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      </g>
      <g class="hl-shaft">
        <path d="M152 88 L92 ${floorY + 46} H304 L246 88 Z" fill="url(#hlBeam)"/>
        <path d="M172 88 L138 ${floorY + 46} H264 L228 88 Z" fill="${c.beam}" opacity="0.34"/>
      </g>
      ${dust}

      ${root(`M34 46 C48 140 22 214 40 306 C54 382 26 458 40 546 C50 616 30 664 40 ${floorY + 10}`, 24, 6)}
      ${root(`M356 46 C342 152 368 228 350 320 C336 398 364 474 348 566 C338 630 358 670 348 ${floorY + 10}`, 23, 6)}
      ${root('M120 46 C112 82 126 104 118 138', 12, 4)}
      ${root('M268 46 C278 84 264 106 272 144', 12, 4)}

      ${vine(150, 106, 68)}
      ${vine(244, 106, 54)}
      ${vine(52, 330, 82)}
      ${vine(340, 430, 74)}

      <g>
        <path d="M330 116 v22" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <circle class="hl-glow" cx="330" cy="156" r="28" fill="#ffe9a8"/>
        <path d="M319 144 h22 l4 19 a15 15 0 0 1 -30 0 Z" fill="#ffd166" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M317 142 h26" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      </g>

      ${NOOKS.map((n) => nook(n.x, n.y, n.rw, n.rh, c)).join('')}
      ${cubby(90, 592, 54, 38, c, KEEP.pebble(66, 624) + KEEP.nail(90, 624) + KEEP.button(114, 623))}

      ${ground(floorY, c, H, W)}
      ${mushroom(44, floorY + 40, 0.95, '#ff8f6b', '#ffe3d1')}
      ${mushroom(112, floorY + 48, 0.7, '#ffb4a2', '#fff2e8')}
      ${mushroom(300, floorY + 44, 0.85, '#e0715a', '#ffe3d1')}
      ${mushroom(356, floorY + 50, 0.6, '#ff8f6b', '#ffe3d1')}
      ${bloom(78, floorY + 44, 0.95, '#ffc9de', '#ffe066')}
      ${bloom(150, floorY + 50, 0.8, '#e5c9ff', '#fff2b8')}
      ${bloom(252, floorY + 46, 0.85, '#ffd6a5', '#fff2b8')}
      ${bloom(336, floorY + 52, 0.75, '#ffc9de', '#ffe066')}

      ${o.wisps === false ? '' : WISPS.map(wisp).join('')}
    </svg>`;
  }

  return { scene, SPOTS, INK };
})();

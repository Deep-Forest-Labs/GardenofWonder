/* Garden Wonder — procedural creature art.

   Same contract as flora.js: parameters in, SVG out, and it knows nothing about
   the game. Every creature is drawn from a palette and a feature list, so a new
   one is a data row rather than a drawing.

   House rules, from docs/05-art-direction.md: one thick ink outline, saturated
   fills, big simple shapes, and a silhouette that still reads at 32px. Blush and
   a highlight in the eye are what keep a pale spirit friendly rather than
   spooky — this game is storybook-bright, never haunted. */

const Critters = (() => {
  const INK = '#2c1a10';

  /* A leafy sprout, drawn from the crown. The stem starts inside the body and
     clears it by a good margin. Tucked any
     lower the body swallows it, and the sprout is the whole reason this reads as
     a garden spirit rather than a generic ghost. */
  function sprout(fill) {
    return `<g class="cr-sprout">
      <path d="M50 34 L50 9" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M50 15 C41 5 30 7 28 15 C36 22 45 21 50 15 Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M50 21 C59 11 70 13 72 21 C64 28 55 27 50 21 Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    </g>`;
  }

  function eyes(c) {
    const y = c.eyeY || 60;
    const rx = c.eyeRx || 7.5;
    const ry = c.eyeRy || 9.5;
    return `<g class="cr-eyes">
      <ellipse class="cr-eye" cx="37" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>
      <ellipse class="cr-eye" cx="63" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>
      <circle cx="39.5" cy="${y - 3.5}" r="2.6" fill="#fff"/>
      <circle cx="65.5" cy="${y - 3.5}" r="2.6" fill="#fff"/>
    </g>`;
  }

  /* Kept well inside the silhouette — a blush that crosses the outline reads as
     a rendering fault rather than a cheek. */
  function blush(fill) {
    return `<g opacity="0.85">
      <ellipse cx="32" cy="74" rx="6.4" ry="4.2" fill="${fill}"/>
      <ellipse cx="68" cy="74" rx="6.4" ry="4.2" fill="${fill}"/>
    </g>`;
  }

  /* Freckles of moss. Three is enough to say "of the woods" and few enough that
     they never turn the face into noise at thumbnail size. */
  function speckles(fill) {
    return `<g opacity="0.7" fill="${fill}">
      <circle cx="32" cy="47" r="2.8"/>
      <circle cx="69" cy="43" r="2.1"/>
      <circle cx="64" cy="84" r="2.4"/>
    </g>`;
  }

  const BODIES = {
    /* A river-pebble bell: narrow crown, heavy base, so it sits rather than floats. */
    pebble: 'M50 30 C70 30 81 46 81 64 C81 82 68 93 50 93 C32 93 19 82 19 64 C19 46 30 30 50 30 Z',
    /* Rounder and squatter, for something that scurries. */
    bean: 'M50 34 C73 34 85 48 85 66 C85 84 70 94 50 94 C30 94 15 84 15 66 C15 48 27 34 50 34 Z'
  };

  /** Draw one creature. `def.art` carries body, palette and features. */
  function draw(def) {
    const a = (def && def.art) || {};
    const body = BODIES[a.body] || BODIES.pebble;
    const skin = a.skin || '#f2fbf3';
    const shade = a.shade || '#cfead8';
    const accent = a.accent || '#69db7c';
    const cheek = a.cheek || '#ff9ec4';
    const glow = a.glow || '#b6f2c8';

    return `<svg class="critter-svg" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse class="cr-glow" cx="50" cy="62" rx="42" ry="40" fill="${glow}" opacity="0.32"/>
      ${a.sprout === false ? '' : sprout(accent)}
      <g class="cr-body">
        <path d="${body}" fill="${skin}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="${body}" fill="${shade}" opacity="0.5" style="clip-path: inset(66% 0 0 0)"/>
        <path d="${body}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
        ${a.speckles === false ? '' : speckles(shade)}
        ${blush(cheek)}
        ${eyes(a)}
        <ellipse class="cr-mouth" cx="50" cy="78" rx="4.2" ry="5" fill="${INK}"/>
      </g>
    </svg>`;
  }

  /** The drifting spores that sell "this thing is magic". Pure decoration. */
  function motes(n, fill) {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      s += `<i class="cr-mote" style="--i:${i};background:${fill || '#c6f6d5'}"></i>`;
    }
    return s;
  }

  return { draw, motes, INK };
})();

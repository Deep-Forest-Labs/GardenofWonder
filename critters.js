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

  /* Spines, ears, antennae — whatever sits on the crown. Only one per creature,
     because two crowns turn the silhouette to mush at thumbnail size. */
  function spines(fill) {
    let out = '';
    const at = [[22, 52], [26, 38], [36, 28], [50, 24], [64, 28], [74, 38], [78, 52]];
    at.forEach(([x, y], i) => {
      const lean = (x - 50) * 0.22;
      out += `<path d="M${x} ${y} L${x + lean} ${y - 17} L${x + 6} ${y - 1} Z"
        fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    });
    return `<g class="cr-sprout">${out}</g>`;
  }

  function ears(fill) {
    return `<g class="cr-sprout">
      <path d="M28 40 L20 8 L46 26 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 40 L80 8 L54 26 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    </g>`;
  }

  function antennae(fill) {
    return `<g class="cr-sprout">
      <path d="M40 32 C34 18 28 12 22 9" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 32 C66 18 72 12 78 9" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="20" cy="8" r="6" fill="${fill}" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="80" cy="8" r="6" fill="${fill}" stroke="${INK}" stroke-width="3.5"/>
    </g>`;
  }

  /* Wings sit behind the body so the face is never crowded. Two silhouettes:
     broad and rounded for a moth, small and pinched for anything that buzzes. */
  function wings(kind, fill) {
    if (kind === 'buzz') {
      return `<g class="cr-wings" opacity="0.9">
        <ellipse cx="17" cy="52" rx="15" ry="9" fill="${fill}" stroke="${INK}" stroke-width="3" transform="rotate(-22 17 52)"/>
        <ellipse cx="83" cy="52" rx="15" ry="9" fill="${fill}" stroke="${INK}" stroke-width="3" transform="rotate(22 83 52)"/>
      </g>`;
    }
    /* Broad and clearing the body by a wide margin. Tucked in behind it the wings
       read as small nubs and the creature stops being a moth. */
    return `<g class="cr-wings" opacity="0.95">
      <path d="M40 52 C10 26 -6 52 2 74 C10 92 30 84 40 68 Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M60 52 C90 26 106 52 98 74 C90 92 70 84 60 68 Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    </g>`;
  }

  function tail(fill) {
    return `<path class="cr-tail" d="M78 84 C94 82 98 66 90 58 C86 70 80 76 74 78 Z"
      fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  }

  let uid = 0;

  function stripes(fill, body, id) {
    return `<clipPath id="${id}"><path d="${body}"/></clipPath>
      <g clip-path="url(#${id})" fill="${fill}" opacity="0.95">
        <path d="M8 66 H92 V74 H8 Z"/>
        <path d="M8 84 H92 V96 H8 Z"/>
      </g>`;
  }

  const CROWNS = { sprout, spines, ears, antennae };

  const BODIES = {
    /* A river-pebble bell: narrow crown, heavy base, so it sits rather than floats. */
    pebble: 'M50 30 C70 30 81 46 81 64 C81 82 68 93 50 93 C32 93 19 82 19 64 C19 46 30 30 50 30 Z',
    /* Rounder and squatter, for something that scurries. */
    bean: 'M50 34 C73 34 85 48 85 66 C85 84 70 94 50 94 C30 94 15 84 15 66 C15 48 27 34 50 34 Z'
  };

  /** Draw one creature. `def.art` carries body, palette and features. */
  function draw(def) {
    const a = (def && def.art) || {};
    uid += 1;
    const clipId = `cr-clip-${uid}`;
    const body = BODIES[a.body] || BODIES.pebble;
    const skin = a.skin || '#f2fbf3';
    const shade = a.shade || '#cfead8';
    const accent = a.accent || '#69db7c';
    const cheek = a.cheek || '#ff9ec4';
    const glow = a.glow || '#b6f2c8';

    const crown = CROWNS[a.crown || 'sprout'];

    return `<svg class="critter-svg" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse class="cr-glow" cx="50" cy="62" rx="42" ry="40" fill="${glow}" opacity="0.32"/>
      ${a.wings ? wings(a.wings, a.wingFill || glow) : ''}
      ${a.tail ? tail(a.accent2 || accent) : ''}
      ${a.crown === 'none' ? '' : crown(accent)}
      <g class="cr-body">
        <path d="${body}" fill="${skin}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
        ${a.stripes ? stripes(a.stripe || shade, body, clipId) : ''}
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

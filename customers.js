/* Garden Wonder — procedural customer art.

   Same contract as flora.js and critters.js: parameters in, SVG out, and it
   knows nothing about the game. A customer is a palette and a hair style, so a
   new villager is a data row rather than a drawing.

   House rules, from docs/05-art-direction.md: one thick ink outline, saturated
   fills, big simple shapes, and a silhouette that reads at 32px. These are drawn
   head-and-shoulders, because the portrait's job is to break out above the top
   of a sheet the way a creature's does — a bust reads at that size where a whole
   body becomes a smudge.

   Every expression is always drawn and CSS picks one, the same trick the
   creatures use for sleeping. That way this file never has to be told whether
   the order is filled, and every screen gets the reaction for free. */

const Customers = (() => {
  const INK = '#2c1a10';

  /* Hair sits in two pieces — a back mass behind the head and a front piece over
     it — so a fringe can overlap the face without the outline crossing an eye. */
  const HAIR = {
    bun: (c) => ({
      back: `<circle cx="50" cy="30" r="30" fill="${c}" stroke="${INK}" stroke-width="4.5"/>
        <circle cx="50" cy="6" r="12" fill="${c}" stroke="${INK}" stroke-width="4.5"/>`,
      front: `<path d="M21 34 C24 16 38 8 50 8 C62 8 76 16 79 34 C70 26 60 22 50 22 C40 22 30 26 21 34 Z"
        fill="${c}" stroke="${INK}" stroke-width="4"/>`
    }),
    mop: (c) => ({
      back: `<circle cx="50" cy="32" r="31" fill="${c}" stroke="${INK}" stroke-width="4.5"/>`,
      front: `<path d="M19 36 C19 14 34 6 50 6 C66 6 81 14 81 36 C74 30 70 24 64 26
        C58 28 58 20 50 22 C42 24 40 30 33 28 C27 26 25 32 19 36 Z"
        fill="${c}" stroke="${INK}" stroke-width="4"/>`
    }),
    braid: (c) => ({
      back: `<circle cx="50" cy="31" r="30" fill="${c}" stroke="${INK}" stroke-width="4.5"/>
        <path d="M78 40 C90 50 90 66 84 76 C78 68 76 54 74 46 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
      front: `<path d="M20 36 C22 14 36 7 50 7 C64 7 78 14 80 36 C68 28 58 24 50 24 C42 24 32 28 20 36 Z"
        fill="${c}" stroke="${INK}" stroke-width="4"/>`
    }),
    short: (c) => ({
      back: `<circle cx="50" cy="33" r="29" fill="${c}" stroke="${INK}" stroke-width="4.5"/>`,
      front: `<path d="M22 34 C24 17 36 10 50 10 C64 10 76 17 78 34 C68 28 60 26 50 26 C40 26 32 28 22 34 Z"
        fill="${c}" stroke="${INK}" stroke-width="4"/>`
    }),
    cap: (c) => ({
      back: '',
      front: `<path d="M21 33 C21 25 26 20 32 20 C32 8 40 1 50 1 C60 1 68 8 68 20
        C74 20 79 25 79 33 C70 28 60 25 50 25 C40 25 30 28 21 33 Z"
        fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    }),
    beard: (c) => ({
      back: `<circle cx="50" cy="33" r="29" fill="${c}" stroke="${INK}" stroke-width="4.5"/>`,
      front: `<path d="M22 34 C24 16 36 9 50 9 C64 9 76 16 78 34 C68 28 60 25 50 25 C40 25 32 28 22 34 Z"
        fill="${c}" stroke="${INK}" stroke-width="4"/>`,
      /* Drawn last, and deliberately BELOW the mouth. A beard that covers it
         takes the expression away, which is the one thing the portrait is for. */
      over: `<path d="M27 50 C27 76 34 102 50 102 C66 102 73 76 73 50
        C73 68 63 76 50 76 C37 76 27 68 27 50 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    })
  };

  /* A brim reads as a hat far better than a crown does at 32px, so hats are a
     brim plus a dome rather than a shape sitting on top of the head. */
  function hat(fill) {
    return `<g class="cu-hat">
      <path d="M28 30 C28 12 40 4 50 4 C60 4 72 12 72 30 Z" fill="${fill}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M14 31 C14 25 32 22 50 22 C68 22 86 25 86 31 C86 37 68 40 50 40 C32 40 14 37 14 31 Z"
        fill="${fill}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    </g>`;
  }

  /* Three expressions, all present, CSS chooses. `.is-happy` on any ancestor
     switches to the delivered face; `.is-waiting` to the patient one. */
  function face() {
    return `<g class="cu-face">
      <g class="cu-eyes">
        <ellipse cx="39" cy="40" rx="4.6" ry="5.6" fill="${INK}"/>
        <ellipse cx="61" cy="40" rx="4.6" ry="5.6" fill="${INK}"/>
        <circle cx="40.6" cy="38" r="1.7" fill="#fff"/>
        <circle cx="62.6" cy="38" r="1.7" fill="#fff"/>
      </g>
      <g class="cu-eyes-happy" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round">
        <path d="M33.5 42 q5.5 -7 11 0"/>
        <path d="M55.5 42 q5.5 -7 11 0"/>
      </g>
      <g class="cu-eyes-wait" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round">
        <path d="M34 41 h10"/>
        <path d="M56 41 h10"/>
      </g>
      <path class="cu-mouth" d="M44 53 q6 5 12 0" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <path class="cu-mouth-happy" d="M41 50 q9 12 18 0 q-9 4 -18 0 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path class="cu-mouth-wait" d="M44 54 h12" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    </g>`;
  }

  const blush = (c) => `<g class="cu-blush" fill="${c}" opacity=".75">
    <ellipse cx="27" cy="48" rx="7" ry="4.6"/>
    <ellipse cx="73" cy="48" rx="7" ry="4.6"/>
  </g>`;

  /** Draw one customer, head and shoulders. `def.art` carries the palette. */
  function draw(def) {
    const a = (def && def.art) || {};
    const skin = a.skin || '#f0c9a8';
    const hair = a.hair || '#7a4a28';
    const clothes = a.clothes || '#8fb8e8';
    const accent = a.accent || '#ffd6e8';
    const cheek = a.cheek || '#ff9ec4';
    const style = HAIR[a.style] ? a.style : 'short';
    const h = HAIR[style](hair);

    /* The viewBox starts ABOVE the origin on purpose. Buns, caps and hat brims all
       draw above the head, and a portrait cropped at the hairline reads as a
       mistake rather than a framing choice. */
    return `<svg class="customer-svg" viewBox="0 -18 100 136" aria-hidden="true">
      <g class="cu-body">
        <path d="M16 118 C16 96 30 84 50 84 C70 84 84 96 84 118 Z"
          fill="${clothes}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M42 86 C44 96 56 96 58 86 C56 100 44 100 42 86 Z" fill="${accent}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      </g>
      <g class="cu-head">
        ${h.back}
        <path d="M24 40 C24 21 36 12 50 12 C64 12 76 21 76 40 C76 62 64 74 50 74 C36 74 24 62 24 40 Z"
          fill="${skin}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M22 44 a5 6 0 1 0 4 -10 Z" fill="${skin}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M78 44 a5 6 0 1 1 -4 -10 Z" fill="${skin}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        ${h.front}
        ${blush(cheek)}
        ${face()}
        ${h.over || ''}
        ${a.hat ? hat(a.hat) : ''}
      </g>
    </svg>`;
  }

  /* A little burst of hearts for a delivered order. Same idea as Critters.motes:
     markup only, the motion lives in CSS. */
  function hearts(n) {
    let s = '';
    for (let i = 0; i < (n || 5); i += 1) s += `<i class="cu-heart" style="--i:${i}"></i>`;
    return s;
  }

  return { draw, hearts, INK };
})();

/* Garden Wonder — procedural flower art.
   Every bloom is drawn from its `art` block, so all 19 seeds get a distinct
   silhouette without shipping a single image file. */

const Flora = (() => {
  const INK = '#2c1a10';
  const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#f783ac'];

  const PETALS = {
    round: 'M0,-38 C13,-38 19,-26 17,-16 C15,-6 8,-1 0,-1 C-8,-1 -15,-6 -17,-16 C-19,-26 -13,-38 0,-38 Z',
    slim: 'M0,-40 C8,-40 12,-29 11,-19 C10,-8 6,-2 0,-2 C-6,-2 -10,-8 -11,-19 C-12,-29 -8,-40 0,-40 Z',
    point: 'M0,-40 C9,-28 12,-14 0,-2 C-12,-14 -9,-28 0,-40 Z',
    star: 'M0,-46 C5,-27 7,-14 0,-2 C-7,-14 -5,-27 0,-46 Z',
    lotus: 'M0,-42 C16,-28 15,-11 0,-2 C-15,-11 -16,-28 0,-42 Z',
    bell: 'M0,-30 C11,-30 15,-20 14,-9 C13,-1 7,3 0,3 C-7,3 -13,-1 -14,-9 C-15,-20 -11,-30 0,-30 Z'
  };

  /* Ring recipes. Scales are tuned so every bloom fills a similar radius,
     and crowded flowers switch to a slimmer petal so they don't read as a blur. */
  function rings(art) {
    const n = art.petals || 8;
    const roundPath = n > 10 ? 'slim' : 'round';
    switch (art.shape) {
      case 'rose':
        return [
          { count: n, scale: 1, rot: 0, fill: 'p', path: 'round' },
          { count: Math.max(5, n - 2), scale: 0.68, rot: 24, fill: 'h', path: 'round' },
          { count: Math.max(4, n - 4), scale: 0.38, rot: 48, fill: 'p', path: 'round' }
        ];
      case 'lotus':
        return [
          { count: n, scale: 1, rot: 0, fill: 'p', path: 'lotus' },
          { count: Math.max(5, Math.round(n * 0.6)), scale: 0.64, rot: 180 / n, fill: 'h', path: 'lotus' }
        ];
      case 'sun':
        return [
          { count: n, scale: 1.05, rot: 0, fill: 'p', path: 'point' },
          { count: n, scale: 0.58, rot: 180 / n, fill: 'h', path: 'point' }
        ];
      case 'star':
        return [
          { count: n, scale: 0.92, rot: 0, fill: 'p', path: 'star' },
          { count: n, scale: 0.5, rot: 180 / n, fill: 'h', path: 'star' }
        ];
      case 'point':
        return n > 10
          ? [
              { count: n, scale: 1, rot: 0, fill: 'p', path: 'point' },
              { count: Math.round(n / 2), scale: 0.58, rot: 180 / n, fill: 'h', path: 'point' }
            ]
          : [{ count: n, scale: 1, rot: 0, fill: 'p', path: 'point' }];
      case 'bell':
        return [
          { count: n, scale: 1.15, rot: 0, fill: 'p', path: 'bell', drop: -14 },
          { count: n, scale: 0.7, rot: 180 / n, fill: 'h', path: 'bell', drop: -6 }
        ];
      case 'orb':
        return [{ count: n, scale: 1, rot: 0, fill: 'p', path: 'slim' }];
      case 'round':
      default:
        return n > 10
          ? [
              { count: n, scale: 1, rot: 0, fill: 'p', path: roundPath },
              { count: Math.round(n * 0.5), scale: 0.5, rot: 180 / n, fill: 'h', path: roundPath }
            ]
          : [{ count: n, scale: 1, rot: 0, fill: 'p', path: roundPath }];
    }
  }

  function petalFill(seed, slot, i) {
    const art = seed.art;
    if (art.rainbow) return RAINBOW[i % RAINBOW.length];
    return slot === 'h' ? `url(#gh-${seed.id})` : `url(#gp-${seed.id})`;
  }

  function radialPetals(seed) {
    const art = seed.art;
    let out = '';
    rings(art).forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i += 1) {
        const angle = (360 / ring.count) * i + (ring.rot || 0);
        const d = PETALS[ring.path] || PETALS.round;
        const drop = ring.drop ? ` translate(0 ${ring.drop})` : '';
        out += `<path class="pt pt-${ri}" style="--i:${i}" d="${d}" fill="${petalFill(seed, ring.fill, i)}" transform="rotate(${angle}) scale(${ring.scale})${drop}"/>`;
      }
    });
    return out;
  }

  /* Shapes that don't read well as a simple radial burst. */
  function customHead(seed) {
    const art = seed.art;
    const p = `url(#gp-${seed.id})`;
    const h = `url(#gh-${seed.id})`;
    switch (art.shape) {
      case 'tulip':
        return `
          <g class="pt-group">
            <path class="pt" d="M-22,-6 C-24,-30 -16,-42 -8,-44 C-6,-28 -8,-12 -6,2 Z" fill="${h}" transform="translate(-4,0)"/>
            <path class="pt" d="M22,-6 C24,-30 16,-42 8,-44 C6,-28 8,-12 6,2 Z" fill="${h}" transform="translate(4,0)"/>
            <path class="pt" d="M0,-48 C16,-42 22,-24 20,-6 C18,6 10,10 0,10 C-10,10 -18,6 -20,-6 C-22,-24 -16,-42 0,-48 Z" fill="${p}"/>
            <path d="M0,-40 C6,-32 8,-18 6,-4" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>
          </g>`;
      case 'spike': {
        const n = art.petals || 8;
        const step = 7.4;
        const top = ((n - 1) * step) / 2;
        let s = `<path d="M0,${top + 8} L0,${-top}" fill="none" stroke="${art.leaf}" stroke-width="4.5" stroke-linecap="round"/>`;
        for (let i = 0; i < n; i += 1) {
          const y = top - i * step;
          const w = 19 - i * 1.5;
          const off = i % 2 === 0 ? -1 : 1;
          s += `<ellipse class="pt" style="--i:${i}" cx="${off * 3.4}" cy="${y}" rx="${Math.max(5, w)}" ry="6.4" fill="${i % 2 ? h : p}"/>`;
        }
        return `<g class="pt-group">${s}</g>`;
      }
      case 'fern': {
        const n = art.petals || 6;
        const step = 9.5;
        const top = ((n - 1) * step) / 2;
        let s = `<path d="M0,${top + 12} C-2,${top * 0.2} -1,${-top * 0.6} 0,${-top - 8}" fill="none" stroke="${art.core}" stroke-width="4.5" stroke-linecap="round"/>`;
        for (let i = 0; i < n; i += 1) {
          const y = top - i * step;
          const sc = 1 - i * 0.1;
          s += `<path class="pt" style="--i:${i}" d="M0,0 C-11,-3 -22,-10 -29,-18 C-18,-21 -7,-14 0,0 Z" fill="${i % 2 ? h : p}" transform="translate(0 ${y}) scale(${sc})"/>`;
          s += `<path class="pt" style="--i:${i}" d="M0,0 C11,-3 22,-10 29,-18 C18,-21 7,-14 0,0 Z" fill="${i % 2 ? h : p}" transform="translate(0 ${y}) scale(${sc})"/>`;
        }
        return `<g class="pt-group">${s}</g>`;
      }
      case 'orb':
        return `
          <g class="pt-group">
            ${radialPetals(seed)}
            <circle cx="0" cy="0" r="20" fill="${p}"/>
            <circle cx="-6" cy="-7" r="7.5" fill="#ffffff" opacity=".5" stroke="none"/>
          </g>`;
      default:
        return `<g class="pt-group">${radialPetals(seed)}</g>`;
    }
  }

  function core(seed) {
    const art = seed.art;
    if (['fern', 'spike', 'tulip', 'bell'].includes(art.shape)) return '';
    const r = art.shape === 'orb' ? 8 : 11;
    let dots = '';
    if (art.shape !== 'orb') {
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 * i) / 6;
        dots += `<circle cx="${(Math.cos(a) * r * 0.5).toFixed(1)}" cy="${(Math.sin(a) * r * 0.5).toFixed(1)}" r="1.7" fill="${INK}" opacity=".22"/>`;
      }
    }
    return `<g class="f-core"><circle cx="0" cy="0" r="${r}" fill="${art.core}" stroke="${INK}" stroke-width="2.4"/>${dots}</g>`;
  }

  function decoration(seed) {
    const art = seed.art;
    if (!art.ring) return '';
    return `<ellipse class="f-ring" cx="0" cy="0" rx="40" ry="13" fill="none" stroke="${art.c2}" stroke-width="4" opacity=".85" transform="rotate(-18)"/>`;
  }

  /* A seedling low to the soil: two cotyledon leaves in the species' own leaf
     colour. A seedling honestly doesn't show its flower yet, so the leaf colour
     is the whole variation. Hidden by base style; [data-stage="sprout"] shows it. */
  function sprout(seed) {
    const leaf = (seed.art && seed.art.leaf) || '#4bb257';
    return `
      <g class="f-sprout" transform="translate(50 99)">
        <g class="f-sprout-body" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
          <path d="M0,21 C0,13 0,7 0,1" fill="none" stroke="${leaf}" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M0,2 C-5,-7 -14,-11 -21,-9 C-20,-1 -11,5 0,2 Z" fill="${leaf}"/>
          <path d="M0,2 C5,-7 14,-11 21,-9 C20,-1 11,5 0,2 Z" fill="${leaf}"/>
        </g>
      </g>`;
  }

  /* The closed bud: where species identity lands before the flower opens. One
     hand-tuned shape per family, tinted from the species' own gradients so the
     player can read what is coming. Hidden by base style; [data-stage="bud"]
     shows it, and the unfurl fades it out as the head swells open underneath. */
  function bud(seed) {
    const art = seed.art;
    const p = `url(#gp-${seed.id})`;
    const h = `url(#gh-${seed.id})`;
    const leaf = art.leaf || '#4bb257';
    const calyx = `<path d="M-9,6 C-12,14 -5,18 0,18 C5,18 12,14 9,6 C5,11 -5,11 -9,6 Z" fill="${leaf}"/>`;
    let body = '';
    switch (art.shape) {
      case 'tulip':
        body = `
          <path d="M-14,-2 C-15,-18 -10,-28 -4,-31 C-3,-20 -4,-8 -3,2 Z" fill="${h}"/>
          <path d="M14,-2 C15,-18 10,-28 4,-31 C3,-20 4,-8 3,2 Z" fill="${h}"/>
          <path d="M0,-33 C10,-28 14,-14 12,-2 C10,7 6,10 0,10 C-6,10 -10,7 -12,-2 C-14,-14 -10,-28 0,-33 Z" fill="${p}"/>
          <path d="M0,-29 C2,-20 2,-8 1,4" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>`;
        break;
      case 'spike': {
        let s = `<path d="M0,16 L0,-14" fill="none" stroke="${leaf}" stroke-width="4.5" stroke-linecap="round"/>`;
        for (let i = 0; i < 4; i += 1) {
          const off = i % 2 === 0 ? -1.5 : 1.5;
          s += `<ellipse cx="${off}" cy="${10 - i * 7}" rx="${8.5 - i}" ry="5" fill="${i % 2 ? h : p}"/>`;
        }
        body = s;
        break;
      }
      case 'fern':
        body = `
          <path d="M0,10 C-5,8 -9,5 -11,1 C-6,0 -2,4 0,10 Z" fill="${h}"/>
          <path d="M0,10 C5,8 9,5 11,1 C6,0 2,4 0,10 Z" fill="${h}"/>
          <path d="M0,18 C-1,8 -1,-2 1,-8 C3,-14 9,-16 12,-12 C15,-8 12,-3 8,-4 C5,-5 5,-8 7,-9" fill="none" stroke="${art.core}" stroke-width="4.5" stroke-linecap="round"/>`;
        break;
      case 'orb':
        body = `
          <circle cx="0" cy="0" r="13" fill="${p}"/>
          <circle cx="-4" cy="-5" r="4" fill="#ffffff" opacity=".25" stroke="none"/>
          ${calyx.replace('C5,11 -5,11', 'C5,12 -5,12')}`;
        break;
      case 'bell':
        body = `
          <path d="M0,16 C0,8 -2,2 -6,-2" fill="none" stroke="${leaf}" stroke-width="4" stroke-linecap="round"/>
          <path d="M-10,-6 C-5,-3 -3,4 -5,10 C-7,15 -13,15 -15,10 C-17,4 -15,-3 -10,-6 Z" fill="${p}"/>
          <path d="M9,-5 C14,-2 16,5 14,11 C12,16 6,16 4,11 C2,5 4,-2 9,-5 Z" fill="${h}"/>
          <path d="M-1,-8 C4,-5 6,2 4,8 C2,13 -4,13 -6,8 C-8,2 -6,-5 -1,-8 Z" fill="${p}"/>`;
        break;
      default:
        body = `
          <path d="M0,-22 C9,-15 13,-6 11,3 C9,11 5,15 0,15 C-5,15 -9,11 -11,3 C-13,-6 -9,-15 0,-22 Z" fill="${p}"/>
          <path d="M0,-22 C-8,-15 -11,-6 -9,2 C-8,8 -4,13 0,15 C-2,4 -2,-10 0,-22 Z" fill="${h}"/>
          ${calyx}`;
    }
    return `
      <g class="f-bud" transform="translate(50 44)">
        <g class="f-bud-body" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">${body}</g>
      </g>`;
  }

  /**
   * Full plant: stem, leaves and head. Growth is driven from CSS via
   * data-stage so the same markup covers sprout through full bloom.
   */
  function plant(seed, opts = {}) {
    const art = seed.art;
    const glow = art.glow ? ` style="--glow:${art.glow}"` : '';
    const leaf = art.leaf || '#4bb257';
    return `
    <svg class="plant${art.glow ? ' has-glow' : ''}" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet"${glow} aria-hidden="true">
      <g class="f-stemwrap">
        <path class="f-stem" d="M50,120 C50,96 49,74 50,54" fill="none" stroke="${leaf}" stroke-width="7" stroke-linecap="round"/>
        <path class="f-stem-hi" d="M50,116 C50,96 49,76 50,58" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <g class="f-leaves">
        <path class="f-leaf f-leaf-l" d="M50,96 C36,98 24,90 20,78 C34,72 46,82 50,96 Z" fill="${leaf}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
        <path class="f-leaf f-leaf-r" d="M50,86 C64,88 76,80 80,68 C66,62 54,72 50,86 Z" fill="${leaf}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      </g>
      ${sprout(seed)}
      <g class="f-head" transform="translate(50 44)">
        ${decoration(seed)}
        <g class="f-petals" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
          ${customHead(seed)}
        </g>
        ${core(seed)}
      </g>
      ${bud(seed)}
    </svg>`;
  }

  /** Just the bloom, for shop cards and pickers. */
  function head(seed, size = 44) {
    const art = seed.art;
    const glow = art.glow ? ` style="--glow:${art.glow}"` : '';
    return `
    <svg class="bloom${art.glow ? ' has-glow' : ''}" width="${size}" height="${size}" viewBox="0 0 100 100"${glow} aria-hidden="true">
      <g transform="translate(50 50)">
        ${decoration(seed)}
        <g stroke="${INK}" stroke-width="2.8" stroke-linejoin="round">${customHead(seed)}</g>
        ${core(seed)}
      </g>
    </svg>`;
  }

  /** The star of the show: a Talking Flower with a face. */
  function talkingFlower() {
    const petal = 'M0,-40 C15,-40 22,-27 20,-15 C18,-4 10,1 0,1 C-10,1 -18,-4 -20,-15 C-22,-27 -15,-40 0,-40 Z';
    let ring = '';
    for (let i = 0; i < 8; i += 1) {
      ring += `<path class="tf-petal" style="--i:${i}" d="${petal}" fill="url(#gp-talker)" transform="rotate(${i * 45}) scale(1.02)"/>`;
    }
    return `
    <svg class="talker" viewBox="0 0 120 130" aria-hidden="true">
      <g class="tf-stemwrap">
        <path d="M60,130 C60,112 59,100 60,90" fill="none" stroke="#4bb257" stroke-width="9" stroke-linecap="round"/>
        <path class="tf-leaf tf-leaf-l" d="M60,112 C46,114 34,106 30,94 C44,88 56,98 60,112 Z" fill="#57c15b" stroke="#2c1a10" stroke-width="3" stroke-linejoin="round"/>
        <path class="tf-leaf tf-leaf-r" d="M60,104 C74,106 86,98 90,86 C76,80 64,90 60,104 Z" fill="#57c15b" stroke="#2c1a10" stroke-width="3" stroke-linejoin="round"/>
      </g>
      <g class="tf-head" transform="translate(60 56)">
        <g class="tf-petals" stroke="#2c1a10" stroke-width="3" stroke-linejoin="round">${ring}</g>
        <circle class="tf-face" cx="0" cy="0" r="26" fill="#ffe9a8" stroke="#2c1a10" stroke-width="3"/>
        <circle cx="0" cy="0" r="26" fill="url(#gface)" style="mix-blend-mode:multiply" opacity=".35"/>
        <g class="tf-eyes">
          <g class="tf-eye tf-eye-l" transform="translate(-9.5 -4)">
            <ellipse rx="6.2" ry="7.4" fill="#fffdf6" stroke="#2c1a10" stroke-width="2.4"/>
            <circle class="tf-pupil" r="3.4" fill="#2c1a10"/>
            <circle class="tf-shine" cx="-1.4" cy="-2" r="1.3" fill="#fff"/>
            <rect class="tf-lid" x="-7.6" y="-9" width="15.2" height="10" rx="4" fill="#ffd98a"/>
          </g>
          <g class="tf-eye tf-eye-r" transform="translate(9.5 -4)">
            <ellipse rx="6.2" ry="7.4" fill="#fffdf6" stroke="#2c1a10" stroke-width="2.4"/>
            <circle class="tf-pupil" r="3.4" fill="#2c1a10"/>
            <circle class="tf-shine" cx="-1.4" cy="-2" r="1.3" fill="#fff"/>
            <rect class="tf-lid" x="-7.6" y="-9" width="15.2" height="10" rx="4" fill="#ffd98a"/>
          </g>
        </g>
        <ellipse class="tf-cheek" cx="-16" cy="6" rx="4.6" ry="3.2" fill="#ff9ec1" opacity=".8"/>
        <ellipse class="tf-cheek" cx="16" cy="6" rx="4.6" ry="3.2" fill="#ff9ec1" opacity=".8"/>
        <g class="tf-mouth">
          <path class="tf-mouth-path" d="M-8,10 Q0,17 8,10" fill="#a83250" stroke="#2c1a10" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </g>
    </svg>`;
  }

  /* ---------------- Holly, the winter rose ----------------

     The game's second character-grade flower, built to talkingFlower()'s own
     construction so the two read as one cast: the same 120x130 box, the same
     stem and leaves, the same head at translate(60 56), the same face radius.
     What differs is everything the 2026-09-01 Holly ruling asks for — a pale
     porcelain face where Summer's is warm yellow, near-black plum petals with
     hot-pink undersides, a frost crown, angled lashed eyes and a smug smile.

     Three things this file learned drawing her, all of them worth keeping:

     ONE. Her hot pink is NOT a new colour. `#ff5d95` / `#ffb3d1` is `gp-talker`,
     the Summer flower's own petal gradient. The rival is lined with her
     rival's colour on the inside of her petals, and the palette gains a USE
     rather than a hue.

     TWO. A porcelain face cannot wear the Talking Flower's eyes. A white
     sclera ringed in ink reads as SPECTACLES on a pale face — two passes
     failed that way before this one. The house already has the right grammar
     and it is critters.js, not this file: an eye is a SOLID INK shape with one
     white shine. The Summer flower can afford a sclera because her face is
     saturated yellow.

     THREE. The crown is drawn AFTER the petals and reaches past them, with its
     bases hidden under the face the way a tiara's band is. A crown inside the
     petal ring does not exist at 46px or in black, which is what the spike's
     silhouette row was for. */
  const HOLLY = {
    plumD: '#241426', plumM: '#3b2140',
    pink: '#ff5d95',
    ice: '#eaf4fb', iceS: '#93b6d0',
    face: '#f7eef2',
    leaf: '#2f5d43', leafL: '#3f7a57',
    mouth: '#a83250'
  };

  function hollyRing(n, scale, rot, fill) {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      s += `<path d="${PETALS.round}" fill="${fill}" transform="rotate(${((360 / n) * i + rot).toFixed(1)}) scale(${scale})"/>`;
    }
    return s;
  }

  /* Five points minimum — the ruling's hard number, and never two. Lengths
     alternate long/short from the centre out, because a row of equal spikes
     reads as a comb and frost does not grow that way. */
  function hollyCrown(n, len, spread, w) {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const a = (t * spread * Math.PI) / 180;
      const r0 = 23;
      const alt = Math.round(Math.abs(i - (n - 1) / 2)) % 2 === 0 ? 1 : 0.66;
      const L = len * (1 - 0.26 * Math.abs(t)) * alt;
      const sx = Math.sin(a);
      const cy = -Math.cos(a);
      const px = Math.cos(a) * w;
      const py = Math.sin(a) * w;
      s += `<path d="M${(sx * r0 - px).toFixed(1)},${(cy * r0 - py).toFixed(1)}`
        + ` L${(sx * (r0 + L)).toFixed(1)},${(cy * (r0 + L)).toFixed(1)}`
        + ` L${(sx * r0 + px).toFixed(1)},${(cy * r0 + py).toFixed(1)} Z" fill="${HOLLY.ice}"/>`;
    }
    return s;
  }

  function hollyEye(side) {
    const m = side < 0 ? '' : ' scale(-1 1)';
    return `<g class="hl-eye" transform="translate(${side * 10.5} -2.5)${m}"><g transform="rotate(-13)">
      <path class="hl-lid" d="M-6.8,0.1 C-4.4,-3.7 2.4,-5.8 7.4,-3.8 C6.6,1 2.4,4.8 -2.4,4.6 C-5.2,4.5 -6.9,2.4 -6.8,0.1 Z" fill="${INK}"/>
      <circle cx="-1.9" cy="-0.9" r="1.35" fill="#fff"/>
      <path d="M7.4,-4.4 l4.1,-3.2 M8.6,-1.4 l4.4,-1.8" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    </g></g>`;
  }

  /* Winter botany for the forehead, never a skull — the ruling names the list:
     snowflake, berry, thorn. Six spokes is a snowflake; a four-point star is a
     shader glint, which is the one thing this character may not be made of. */
  function hollyMark() {
    let arms = '';
    for (let i = 0; i < 3; i += 1) {
      const a = (i * 60 * Math.PI) / 180;
      const dx = Math.cos(a) * 7;
      const dy = Math.sin(a) * 7;
      arms += `<path d="M${(-dx).toFixed(1)},${(-dy).toFixed(1)} L${dx.toFixed(1)},${dy.toFixed(1)}"/>`;
    }
    return `<g transform="translate(0 -15.5) scale(0.86)" fill="none" stroke="${HOLLY.iceS}"
      stroke-width="2.2" stroke-linecap="round">${arms}</g>`;
  }

  /** Holly's head, centred on 0,0. Order is load-bearing: petals, THEN the
      crown over them, then the face over the crown's bases. */
  function hollyHead(opts = {}) {
    return `<g class="hl-head-g">
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        ${hollyRing(8, 1.10, 22, HOLLY.pink)}
        ${hollyRing(8, 1.0, 0, HOLLY.plumD)}
        ${hollyRing(6, 0.68, 26, HOLLY.plumM)}
      </g>
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">${hollyCrown(7, 34, 68, 5)}</g>
      <circle class="hl-face" cx="0" cy="0" r="26" fill="${HOLLY.face}" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="0" r="26" fill="url(#gholly)" style="mix-blend-mode:multiply" opacity=".34"/>
      ${hollyMark()}
      ${opts.sleeping
        ? `<g fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round">
             <path d="M-15,-3 q4.5 5 9 0"/><path d="M6,-3 q4.5 5 9 0"/></g>`
        : hollyEye(-1) + hollyEye(1)}
      <path class="hl-mouth" d="M-8,10.4 Q0.5,15.8 8.6,8.2" fill="${HOLLY.mouth}" stroke="${INK}"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }

  /** The whole character, for Winter's centre cell. */
  function holly(opts = {}) {
    return `
    <svg class="talker holly" viewBox="0 0 120 142" aria-hidden="true">
      <g class="tf-stemwrap" transform="translate(0 10)">
        <path d="M60,132 C60,114 59,102 60,92" fill="none" stroke="${HOLLY.leaf}" stroke-width="9" stroke-linecap="round"/>
        <path class="tf-leaf tf-leaf-l" d="M60,114 C46,116 34,108 30,96 C44,90 56,100 60,114 Z" fill="${HOLLY.leafL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path class="tf-leaf tf-leaf-r" d="M60,106 C74,108 86,100 90,88 C76,82 64,92 60,106 Z" fill="${HOLLY.leafL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      </g>
      <g class="tf-head" transform="translate(60 66)">${hollyHead(opts)}</g>
    </svg>`;
  }

  /** Just her face, square, for the avatar picker.

      `fit` is not a nicety. The picker draws a face inside a CIRCULAR mask at
      46px, and at the Talking Flower's scale every point of Holly's crown is
      outside that circle — the spike's silhouette row showed four identical
      dark discs. Fitting the head inside the disc costs 17% of her face and
      keeps her identity, which is the trade the owner took. */
  function hollyFace(size = 46) {
    return `
    <svg class="bloom holly-face" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <g transform="translate(50 55) scale(0.78)">${hollyHead()}</g>
    </svg>`;
  }

  /** One hidden <svg> holds every gradient so the blooms stay cheap to draw. */
  function injectDefs() {
    if (document.getElementById('flora-defs')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'flora-defs');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    let defs = '';
    DATA.seeds.forEach((s) => {
      const a = s.art;
      defs += `
        <linearGradient id="gp-${s.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${a.c2}"/><stop offset="100%" stop-color="${a.c1}"/>
        </linearGradient>
        <linearGradient id="gh-${s.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="${a.c2}"/>
        </linearGradient>`;
    });
    defs += `
      <linearGradient id="gp-talker" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffb3d1"/><stop offset="100%" stop-color="#ff5d95"/>
      </linearGradient>
      <radialGradient id="gface" cx="50%" cy="35%" r="70%">
        <stop offset="55%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ffc978"/>
      </radialGradient>
      <radialGradient id="gholly" cx="50%" cy="34%" r="70%">
        <stop offset="52%" stop-color="#ffffff"/><stop offset="100%" stop-color="#cbb0c0"/>
      </radialGradient>`;
    svg.innerHTML = `<defs>${defs}</defs>`;
    document.body.appendChild(svg);
  }

  return { plant, head, talkingFlower, holly, hollyFace, hollyHead, injectDefs, INK };
})();

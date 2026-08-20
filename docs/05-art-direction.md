# Art Direction

## The rule that governs everything

**No binary assets.** No PNGs, no SVG files, no sprite sheets, no fonts beyond one web font, no
audio files. Every visual is inline SVG built in JavaScript or CSS drawn from custom properties.

This isn't purity for its own sake. It means the entire game is 476 KB of text, loads instantly,
diffs meaningfully in git, and can be recoloured or rescaled programmatically. A nineteenth seed
costs about eight lines of data rather than an art commission.

If you need new visual content, generate it. If you think you truly need a raster asset, that's a
decision for the log.

## Visual language

Four rules, in priority order:

1. **Thick dark outlines on everything.** One ink colour, `#2c1a10`, used at 2.4–3 px in SVG user
   units. Nothing floats without a contour.
2. **Chunky rounded shapes.** Border radii of 12, 18 and 26 px. No sharp corners anywhere in the UI.
3. **Warm paper against saturated nature.** Interface surfaces are cream; the world is bright green,
   sky blue, and flower-bright.
4. **Nothing is perfectly still.** Idle animation everywhere — swaying stems, drifting clouds,
   blinking eyes, bobbing prompts — but slow enough to read as calm.

## Palette

Defined as custom properties at the top of `style.css`. Use the variables, never raw hex, in any
new CSS.

| Role | Variable | Value |
| --- | --- | --- |
| Ink (outlines, text) | `--ink` | `#2c1a10` |
| Ink, softer | `--ink-2` | `#5a3a1f` |
| Paper (panels) | `--paper` | `#fff8e7` |
| Paper, mid | `--paper-2` | `#ffeecd` |
| Paper, deep | `--paper-3` | `#ffe0ad` |
| Grass | `--grass` | `#5cc45c` |
| Grass, shadow | `--grass-d` | `#3f9d45` |
| Grass, light | `--grass-l` | `#8fe08a` |
| Soil | `--soil` | `#a9713f` |
| Soil, shadow | `--soil-d` | `#7d4f2a` |
| Soil, deepest | `--soil-dd` | `#5f3a1e` |
| Coins | `--coin` | `#ffc93c` |
| Coins, edge | `--coin-d` | `#f08c00` |
| Tickets | `--ticket` | `#ff8fab` |
| Gems | `--gem` | `#8ce0ff` |
| Rare | `--rare` | `#4dabf7` |
| Epic | `--epic` | `#b197fc` |
| Legendary | `--legend` | `#ffd43b` |

The three rarity colours are load-bearing and consistent everywhere — particles, plot auras, toast
borders, floating text. A player learns blue/purple/gold once.

Sky colours (`--sky1` through `--sky3`, `--sun-c`, `--star-op`, `--sun-x`, `--sun-y`) are written
from JavaScript every 0.6 s and must not be hardcoded.

## Typography

**Baloo 2** at weights 600, 700 and 800, loaded from Google Fonts with a system rounded stack
behind it (`ui-rounded`, `SF Pro Rounded`, `Segoe UI Variable`). It's the only network dependency
in the project; if it fails the game still looks right on Apple and Windows.

Prominent numbers use the `.outlined` class — white fill with an eight-direction ink text-shadow
plus a drop shadow, giving the sticker look without an image.

## Procedural flowers

`flora.js` turns each seed's `art` block into SVG. A seed's art definition looks like this:

```js
art: { shape: 'lotus', petals: 8, c1: '#ff8fd0', c2: '#ffd4ec',
       core: '#ffe066', leaf: '#46ad7c', glow: '#ffb0e0', ring: true, rainbow: false }
```

| Field | Meaning |
| --- | --- |
| `shape` | Which construction recipe to use |
| `petals` | Petal count, interpreted per shape |
| `c1` | Deep petal colour (gradient bottom) |
| `c2` | Light petal colour (gradient top) |
| `core` | Centre disc |
| `leaf` | Stem and leaves |
| `glow` | Optional soft halo |
| `ring` | Optional orbital ellipse |
| `rainbow` | Ignore gradients, cycle a seven-colour palette per petal |

### Shapes

Eleven recipes. Eight are radial arrangements built from six petal paths; three are hand-built
because a radial burst doesn't read as the right plant.

| Shape | Construction | Used by |
| --- | --- | --- |
| `round` | One or two rings of rounded petals | Daisy, Peony |
| `point` | Tapered petals, second ring if crowded | Marigold, Aurora Crown |
| `star` | Long thin spikes, two rings | Starlit Iris, Nebula Orchid, Mythic Starflower |
| `lotus` | Wide layered petals | Orchid, Moonflower, Aurora Bloom, Eternal Crown |
| `sun` | Full ring plus inner ring at half scale | Sun Lotus, Solstice Lily |
| `bell` | Downward-hanging cups, offset via `drop` | Bluebell |
| `orb` | Slim petals behind a solid sphere with a highlight | Celestial Lotus |
| `rose` | Three concentric rings, decreasing count, rotated | Rose |
| `tulip` | Hand-built: two outer wraps plus a front cup | Tulip |
| `spike` | Hand-built: stacked alternating ellipses up a stalk | Lavender |
| `fern` | Hand-built: mirrored frond pairs along a curved spine | Jade Fern |

### Readability at small sizes

The hardest constraint in the art system: the same SVG renders at 120 px in a plot and at 22 px in
the Almanac. Several rules exist purely to survive that:

- Flowers with **more than 10 petals switch to a `slim` petal path**, because a wide petal at that
  count overlaps into a solid disc.
- Ring scales are tuned so every bloom fills a **similar radius** regardless of shape — otherwise
  cards look inconsistently sized.
- Inner rings rotate by `180 / count` degrees to sit in the gaps of the outer ring rather than
  behind it.
- `bell`, `spike`, `fern` and `tulip` **omit the centre disc**, which would read as a wrong-coloured
  blob on those silhouettes.

If you add a seed, check it at 22 px, not just in a plot. Blooms that look like mush at that size
have failed.

### Gradients

Each seed contributes two `linearGradient` definitions (`gp-{id}` for petals, `gh-{id}` for
highlight petals) to a single hidden `<svg id="flora-defs">` injected once at boot. Referencing
shared definitions rather than inlining gradients keeps repeated blooms cheap. Any new seed gets
its definitions automatically; a new *gradient kind* means editing `injectDefs()`.

### Render entry points

| Function | Output | Used for |
| --- | --- | --- |
| `Flora.plant(seed)` | Stem, leaves, head in a 100×120 viewBox | Plots |
| `Flora.head(seed, size)` | Bloom only, square viewBox | Shop cards, Almanac, toasts |
| `Flora.talkingFlower()` | The face character | Centre cell |

## Growth animation

Growth is CSS, not markup. `Flora.plant()` renders the full-grown plant once, then `ui.js` sets
`data-stage` on the plot and CSS scales the parts:

| Stage | Stem scale | Head scale | Petals |
| --- | --- | --- | --- |
| 1 | 0.42 | 0 (hidden) | — |
| 2 | 0.78 | 0.34 | 0.55 |
| 3 | 1.0 | 1.0 | 1.0 |

Cheap and smooth, and it means growth needs no per-frame DOM work beyond one attribute flip.

## Icons

Thirty-three icons in `icons.js`, drawn as 24×24 SVG with the shared ink stroke and flat colour
fills.
They are deliberately *not* monochrome — a coin is gold, a gem is cyan, a leaf is green — because
colour is how you identify them at a glance on a phone.

Two consumption patterns:

- Static markup in `index.html` uses `<span data-icon="coin">`, hydrated once at boot by
  `Icons.hydrate(document)`.
- Generated markup calls `Icons.get('coin')` inline.

`seed` and `mute` are defined but unused. `plantSpot` replaced `seed` for empty plots because a
dashed square with a plus reads as "put something here" where a seed shape did not.

## Scenery and parallax

Eleven stacked layers in `index.html`, back to front: sky gradient, sun/moon, stars, far clouds,
far hills, near clouds, mid hills, near hills, meadow, fence, vignette. All CSS gradients.

Clouds are generated at boot — three far, two near — with randomised width, drift duration and
vertical position, then animated across the screen on a long loop with negative delays so they
start mid-flight rather than all entering together.

Clouds are constrained to the top 14–66% of the sky. They drifted too low and too large in an
earlier pass and read as fog.

## Day and night

A full cycle is **360 seconds**. Every session starts at `DAY_START = 0.46`, bright midday, so a
first impression is never a dark screen.

Seven keyframes define the cycle — midnight, dawn, morning, midday, golden hour, dusk, back to
midnight. `updateSky()` interpolates between neighbouring keys every 0.6 s and writes the result to
custom properties. CSS carries 1.6 s transitions on those properties, so the coarse update rate is
invisible.

The cycle is **not saved**. It's derived from time since page load, so every session begins at
midday regardless of the real hour.

## Motion

Twenty-eight keyframe animations. The recurring principles:

**Squash and stretch on contact.** Taps trigger a scale-down-then-overshoot rather than a linear
scale. Re-triggering requires removing the class, forcing reflow with `void el.offsetWidth`, then
re-adding — a pattern used in several places.

**Overshoot on entry.** Toasts and banners scale past their target and settle back.

**Ambient idle motion.** Stems sway, leaves wave, clouds drift, stars twinkle, empty plots bob,
affordable prices pulse. All slow, all looping, none demanding attention.

**Shake for impact.** `FX.shake()` writes `--shake-x/y/r` on `#game`; the variables inherit to
`#world` inside it, which is the element carrying the `translate3d` and `rotate`. The transform sits
on the wrapper rather than on `#game` itself so `#game` stays an untransformed fixed box — see
[08-ui-and-layout.md](08-ui-and-layout.md#mobile-specifics). Magnitudes: 3 for a denial, 5 for Epic, 7 for a crit, 9 for
Legendary, 10 for a Wonder.

### Reduced motion

`prefers-reduced-motion: reduce` collapses all animation durations to near zero, hides clouds,
disables screen shake entirely, and drops ambient petals to zero with other particle counts cut.
`FX` reads the preference once at init. **Any new effect must respect it.**

## The Wonder Effect look

The `wonder` class on `#game` drives a rainbow gradient sweep, a saturate/hue-rotate filter cycle,
a gentle rotate-and-scale bob on the garden, and a spinning rainbow halo behind it. Paired with
five staggered confetti waves, a full-screen banner, and a rail countdown chip.

It is intentionally the loudest thing in the game and the only moment that breaks the calm palette.

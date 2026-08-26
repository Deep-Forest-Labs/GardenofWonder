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
| Ink, softer — every lip on paper | `--ink-2` | `#5a3a1f` |
| Ink, secondary text | `--ink-soft` | `#7a6047` |
| Paper (panels) | `--paper` | `#fff8e7` |
| Paper, mid | `--paper-2` | `#ffeecd` |
| Paper, deep | `--paper-3` | `#ffe0ad` |
| Drained paper | `--paper-dim` | `#ebe5d9` |
| Drained paper, mid | `--paper-dim-2` | `#d8d0c0` |
| Drained edge | `--paper-dim-edge` | `#bcb0a0` |
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

`--ink-soft` is the colour for descriptive text on paper — the second line of a card, a trait note, a
caption. It is deliberately not `opacity` on `--ink`: opacity drags text toward whatever surface is
behind it, so the same rule gets washier as the panel gets lighter and fails first in sunlight. A
dimmer colour holds its edge at any lightness and can be contrast-checked.

**Never write a hex fallback inside `var()`.** `var(--paper-2,#f3e4c6)` shipped nine times with a
fallback that was not `--paper-2`; it was harmless only because the variable always resolved, and it
was a wrong value sitting in the source waiting to be copied. If a variable might not resolve, that
is a bug to fix at the declaration, not to paper over at the use.

The three rarity colours are load-bearing and consistent everywhere — particles, plot auras, toast
borders, floating text. A player learns blue/purple/gold once.

**So a rarity colour may never be borrowed for something that is not a rarity.** The creature
panel's *asleep* state used to paint a lavender field — `#f2eeff → #e2dbf8`, with `#eae6fb` and
`#b3a7e8` alongside — which is the Epic family wearing a different hat. It was repainted on
2026-08-26. A state is not a tier, and a player who has learned that purple means Epic will read a
sleeping creature as a rare one for as long as the colour says so.

`--paper-dim` is what a state uses instead: the interface's own paper with the warmth taken out and
the value dropped. *Asleep, out of food, stopped working* should read as **drained** — the same
surface, tired — and desaturating what is already there says that without spending a hue. It is on
`.cp-fuel.out`, `.cp-head.asleep`, `.feed-row.napping`, `.feed-alert` and `.cp-card.bad`. The rule
generalises: **when a state needs a colour, take the value out of the surface it is already on
before you reach for a new hue.** The meadow's locked land does the same thing with
`filter: saturate(.3)`.

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

## The material recipe — why the garden looks finished and the meadow does not

**Diagnosed 2026-08-25 by putting the two screens side by side at the same size.** The owner's
words: *"the garden looks so much better than the meadow — night and day."* It is right, and the
difference is not talent or time. It is three specific, copyable things.

### 1. Value and hue separation is the whole game

The garden reads instantly because it has **four separated tiers**:

| Tier | In the garden |
| --- | --- |
| Ink | 3–4px `--ink` outline on everything |
| Dark body | The board — brown, on a green world |
| Mid body | The plots — a lighter brown inside the darker board |
| Light chips | Cream/paper pills for prices, gems, locks |

**The meadow was green cells, in a green board, on green ground.** No figure, no ground. That single
fact accounted for most of the gap, and no amount of extra detail fixes it — the board needs a body
colour that is *not* the colour of the world it sits in.

**Answered 2026-08-25: the terrace is stone and the cells are cobbles.** The meadow now runs the
same four tiers as the garden — ink, a light warm-stone board, dark cobbled cells, cream chips —
so the hue jump does the board-against-world work and value does the cells-against-board work,
exactly as brown-on-green does in the garden. The tokens live on `.meadow-layer` as custom
properties (`--mw-stone-*`, `--cob-*`), which is also what lets night recolour every cell without
one of them being rebuilt.

**And the material is where the verb lives.** Soil is the right body for something temporary — you
dig it, plant it, clear it. Cobbles are a floor somebody laid and left, which is what a permanent
placement wants. Sharing the board and differing in the material is the house rule working as
intended: same grammar, different verb, now said in the surface rather than in a label.

### 2. Every surface is built from the same five-layer recipe

This is the house material, and it is written down here because it is the thing that makes a flat
shape read as an object. From `.plot`:

```css
background:
  radial-gradient(circle at 26% 22%, rgba(255,255,255,.16) 0 12%, transparent 13%),  /* highlight */
  radial-gradient(circle at 72% 62%, rgba(0,0,0,.10) 0 9%, transparent 10%),          /* dirt mark */
  linear-gradient(180deg, var(--soil), var(--soil-d) 72%, var(--soil-dd));            /* body */
box-shadow:
  inset 0 5px 0 rgba(255,255,255,.16),    /* lit top edge */
  inset 0 -7px 0 rgba(0,0,0,.18),         /* shaded bottom edge */
  0 4px 0 var(--soil-dd),                 /* THE LIP — a solid, unblurred edge */
  0 8px 14px rgba(44,26,16,.24);          /* soft contact shadow */
```

**The unblurred `0 4px 0` lip is the single most important line.** It is what makes everything in
this game look moulded rather than drawn, and it is why the plots feel pressable. The meadow's cells
had a flat `rgba()` fill and no lip at all, which is why they read as empty rectangles; `.mw-cell`
now carries the whole recipe and presses with the same `translateY(3px)` the plots use.

**A lip is never translucent.** It is the object's own extruded side wall, so it is opaque and it is
the object's own dark: `var(--ink-2)` on paper, `var(--soil-dd)` on soil, `#6b4423` under the board.
`0 3px 0 rgba(44,26,16,.22)` is the same geometry and a different material — over cream, 22% ink
resolves to a desaturated grey-tan, and the surface stops reading as moulded and starts reading as a
web page with a drop shadow. Enforced 2026-08-26 across all 39 box-shadow lips that had drifted.
**A `box-shadow` with a zero blur and an `rgba()` colour is always the bug.**

The heights are a ladder, and a lip height is a size signal rather than a taste decision: 2px on a
chip, 3px on a pill or badge, 4px on a card or plot, 5px on the dock, 9px under the whole board. A
3px lip on a full-width panel makes the panel look small; a 5px lip on a chip makes it look broken.

**The exception is a shadow that is not a lip.** `.talker` and `.sheet-art svg` cast
`drop-shadow(0 6px 0 rgba(…))` and `.outlined` carries a `0 4px 0` text skirt. Those fall *onto the
surface below* rather than describing an object's own edge, they land on soil and lawn as often as
on paper, and they stay translucent so the ground shows through them.

**One trap comes with it.** An inset box-shadow paints *under* an element's content, so a cell with
an opaque floor child loses its lit top edge and shaded bottom entirely. Those two lines have to
ride an overlay above the floor — `.mw-cell::after` — or the recipe is only half applied and nobody
can see which half is missing.

The board itself adds one more: `repeating-linear-gradient(96deg, …)` grain over the body gradient.
A surface with no texture at all reads as a placeholder.

**The recipe on paper.** The alphas above are tuned for soil, and they do not transfer: white at
`.16` vanishes on cream, and black at `.10` over cream resolves to the same grey-tan the translucent
lip did. A cream surface keeps the geometry exactly and warms the colours — the blemish positions,
radii and rim offsets are the plot's, unchanged. From `.food-btn`:

```css
background:
  radial-gradient(circle at 26% 22%, rgba(255,255,255,.55) 0 12%, transparent 13%),
  radial-gradient(circle at 72% 62%, rgba(44,26,16,.05) 0 9%, transparent 10%),
  linear-gradient(180deg,#fffdf7 0%, var(--paper) 72%, var(--paper-2) 100%);
box-shadow:
  inset 0 5px 0 rgba(255,255,255,.5),
  inset 0 -7px 0 rgba(44,26,16,.07),
  0 3px 0 var(--ink-2),
  0 6px 10px rgba(44,26,16,.18);
```

`0 6px 10px rgba(44,26,16,.18)` is the contact shadow that goes with a 3px lip — the same pair the
wallet uses. A 4px lip takes `0 8px 14px rgba(44,26,16,.24)`, and the board's 9px lip takes
`0 18px 26px rgba(44,26,16,.3)`. Lip and contact shadow scale together or the object looks like it
is hovering at the wrong height.

**A state modifier that sets `box-shadow` has to restate the lip.** `.cp-card.bad`,
`.feed-row.napping` and `.feed-row.fed` each add an inset ring, and `box-shadow` is one property —
writing the ring alone silently deletes the lip for exactly the states a player is most likely to be
looking at.

### Every number lives in a cream pill

This is the fourth value tier doing its job. A number is never set loose on a coloured surface and
never set in grey on cream — it goes in a capsule with an ink contour and a lip, and the capsule is
what makes it legible against sky, lawn, soil or paper without changing anything about the number.

| Pill | Border | Lip | Body |
| --- | --- | --- | --- |
| `.stat` — cost, grow time | `2px var(--ink)` | `0 2px 0 var(--ink-2)` | `#fffdf7 → var(--paper-2)` |
| `.stat.good` — yield range | `2px var(--ink)` | `0 2px 0 var(--ink-2)` | `#d3f9d8 → #8ce99a` |
| `.stat.gem` — gem chance | `2px var(--ink)` | `0 2px 0 var(--ink-2)` | `#cdeeff → var(--gem)` |
| `.price` | `2.5px var(--ink)` | `0 2px 0 var(--ink-2)` | `#fff → var(--paper-3)`, `.ok` green, `.no` red |
| `.chip`, `.lock-cost` | `2.5px var(--ink)` | `0 2px 0 var(--ink-2)` | `#fffdf7 → var(--paper-2)` |

A good/affordable state is the same green in both families, so green means *yes* everywhere rather
than meaning one thing on a price and another on a yield.

**`.verb-note` is an object, not a rule in a margin.** A flat band with a `border-left` accent is a
web pattern; it made the trait — the most decision-relevant fact in a seed row — the least
interesting thing in it. It now takes the house material at radius 12, and the verb's own tint is
its *body* rather than a stripe, veiled under
`linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.58))` so ink stays legible across
every tint in `DATA.verbs`. The veil is what lets a saturated token be used as a pale surface
without a second hex per verb: the chip stays solid tint, the note is the same hue washed out, and
the pairing reads as one fact said twice at two volumes.

**The white veil is the general answer to "I need a pale version of a colour I already have".**
`.seed-art` uses it too — the plant picker's art badges were a fixed `#fff → #e8f7e3` mint, so
nineteen identical discs ran down the left edge of the list and killed the scan. They now take the
seed's own `art.c1` as the body under
`radial-gradient(circle at 34% 28%, rgba(255,255,255,.95), rgba(255,255,255,.6))`, which keeps the
old highlight exactly where it was and pales every petal colour — from `#4c6ef5` to `#e03131` — to a
disc the bloom's ink outline still reads against. Nineteen seeds, nineteen hues, no new tokens. The
alternative was a hand-picked pale hex per seed, which is nineteen more colours in a palette already
carrying 149 by accident.

### 3. Objects must be anchored, not floated

Every plant in the garden sits on a soil line with a shadow under it. The meadow's tenders sit in
the middle of an empty cell with a soft ellipse beneath — they float. Anything placed in a cell
needs **ground inside the cell** to stand on.

### The scale trap

Also found in the comparison: the meadow's dry-stone wall was drawn with stones roughly three times
too large, so it read as clip art rather than as a wall. **Check a new prop against a creature
standing next to it** — the keeper is the ruler. The courses are now 21px on a 390px screen, and a
row of **coping stones stood on end** caps them: without it, level courses of similar stones read as
brickwork, and no amount of jitter in the courses fixes that.

### Grass is a mass first and blades second

The meadow's grass was thin tall strokes scattered across the full height of whatever stood behind
them, and over the wall it read as a broken comb laid on the stones. **A grass band is a soft mat
with blades growing out of it** — the mat hides every blade's base, so the blades read as the top of
something dense rather than as sticks planted in mid-air. `grassBand()` draws a darker back mat, the
blades, then a lighter front mat over their feet, and the wall is drawn *between* two bands so it
stands in the grass instead of wearing it.

### Draw the scene at the size the room really is

A room's backdrop is composed against a phone — 390×844 — and it is tempting to render that
composition with `preserveAspectRatio="slice"` and let it crop. **It does not crop, it scales.** A
1440-wide window covers a 390-wide viewBox by multiplying everything by 3.7, so the grass became a
hedge, the willow filled a third of the screen and the wall fell off the bottom entirely. It read as
a prototype, and the cause was one attribute.

So `Meadow.scene()` takes the room's **measured** width and height and draws 1:1 into them, and
`syncScene()` memoises on the size as well as the sky so a resize redraws. Everything inside is
positioned relatively: the sun and the clouds as fractions of the width, the hills and the horizon
as fractions of the height, the willow offset from the *right edge* and the horizon, and blade
counts scaled by `w / n` so density stays constant instead of stretching. This is the same job the
garden's CSS scenery layers do for free by being CSS.

### Nothing stands on a shadow

A dark contact shadow on a dark floor is invisible, which is why objects dropped on the cobbles
still floated. Every piece in a cell now sits on a **worn pad** — a lighter disc in the setts — with
its shadow drawn on top of that. The pad is the ground; the shadow is the contact. Keepers get the
same treatment with a trodden patch, because a soft ellipse under a creature is a shadow with no
floor to fall on.

### The check to run before calling any screen done

Screenshot it next to the garden at the same size and ask three questions:

1. **Can I see the board against the world?** If the body colour is the world's colour, no.
2. **Does every surface have a lip and a gradient?** A flat fill is a placeholder.
3. **Is anything floating?** Everything sits on something.

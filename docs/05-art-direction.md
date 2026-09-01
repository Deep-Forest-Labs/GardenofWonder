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
| Saved Seeds | `--seed` | `#7bd88f` |
| Saved Seeds, shadow | `--seed-d` | `#3f9d45` |
| Saved Seeds, light | `--seed-l` | `#c9f5cf` |
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

`--seed` is the Garden Year's one new token, added 2026-08-29 with the year meter. The second
currency needed a colour of its own and could not borrow one: gold is coins, cyan is gems, and
blue/purple/gold are the rarity vocabulary a player has already learned. It is a green that belongs
to growing things and is used for exactly two things — **the meter's fill and the petal pips**.
Prices paid in Saved Seeds deliberately do *not* wear it: they take the ordinary `.price` family,
because green there already means *you can afford this* and a second green meaning *this costs
seeds* would be two facts in one colour. The pouch icon beside the number is what says which
currency. The pouch icon that goes with it is deliberately **cream-bodied with green
seeds**, because a green glyph on the green fill disappeared.

**The season tint.** `DATA.year.seasonTint` / `seasonTintMax` (`#ffb066` at `0.38`) warm Summer's
palette toward autumn as the year meter fills — one `multiply` overlay on the scenery
(`.season-tint`, a real layer after `.vignette`, because `::after` already carries the weather and
`::before` would paint under the sky), derived from the meter every slow tick and never saved. The
weather's sky wash tops out at `0.68` for a full storm (`--wx-storm-wash`; the flat `.52` overlay it
replaced is retired); a season is a mood and a storm is an event, so this stays under it. Both can be on at once and the day/night cycle keeps running under both. *Observed
and not fixed:* over a night sky the multiply reads browner than it does at noon — a phase-4
question, since the fix is to scale the tint by daylight.

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

Fifty-two icons in `icons.js`, drawn as 24×24 SVG with the shared ink stroke and flat colour
fills. The count is not written down anywhere that can go stale: `tools/export-icons.js` asserts
that the number of `.svg` files it writes equals the number of keys in the registry, and rewrites
the manifest table in [45-asset-inventory.md](45-asset-inventory.md) from the registry itself.
They are deliberately *not* monochrome — a coin is gold, a gem is cyan, a leaf is green — because
colour is how you identify them at a glance on a phone.

Two consumption patterns:

- Static markup in `index.html` uses `<span data-icon="coin">`, hydrated once at boot by
  `Icons.hydrate(document)`.
- Generated markup calls `Icons.get('coin')` inline.

`plantSpot` replaced `seed` for empty plots because a dashed square with a plus reads as "put
something here" where a seed shape did not.

**Six of them are monochrome, and that is the exception the rule needs.** `close`, `check`,
`chevron`, `menu` and the two halves of the pencil are punctuation rather than objects — a chevron
is not a thing in the garden, it is a direction. The menu (2026-08-31) added six glyphs in one go
because this game had never had an interface to navigate before: `menu`, `chevron`, `pencil`,
`bell`, `people` and `scroll`. `menu` is drawn at stroke 3.4 rather than the set's 2, because
beside the gear's solid grey body a 2-unit bar reads as a hairline at 24px and this is the button
the whole menu is found through.

## Scenery and parallax

Eleven stacked layers in `index.html`, back to front: sky gradient, sun/moon, stars, far clouds,
far hills, near clouds, mid hills, near hills, meadow, fence, vignette. All CSS gradients.

Clouds are generated at boot — three far, two near — with randomised width, drift duration and
vertical position, then animated across the screen on a long loop with negative delays so they
start mid-flight rather than all entering together.

Clouds are constrained to the top 14–66% of the sky. They drifted too low and too large in an
earlier pass and read as fog.

## Day and night

A full cycle is **360 seconds**, and the phase is `DAY` in `data.js` — `cycle: 360`, `offset: 0.46`,
`dawn: 0.14`, `dusk: 0.82`. Dawn and dusk are what "daytime" means to anything that asks, including
the sunbreak, which will not break through after dark.

Seven keyframes define the cycle — midnight, dawn, morning, midday, golden hour, dusk, back to
midnight. `updateSky()` interpolates between neighbouring keys every 0.6 s and writes the result to
custom properties. CSS carries 1.6 s transitions on those properties, so the coarse update rate is
invisible.

The cycle is **not saved, and no longer keyed to page load**. It derives from epoch time, so every
player sees the same hour at the same moment and a past instant stays answerable — which is what
lets a mutation that came due while the tab was shut resolve against the sky and the light that
were actually standing. `offset` only shifts the global phase now; it does not mean a session opens
at midday.

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

**And a collapsed animation must never be the only carrier of a STATE.** Found the hard way on
2026-08-30: the ready Turn button's whole signal was a breathing gold ring, the clamp above runs an
animation once for `.001ms` and drops it, and the attention dot is suppressed on the assumption that
the button is breathing — so a player with the preference on had *no* ready signal at all, and it
reviewed as correct for weeks. Where a state animates, reduced motion needs a **static substitute**,
not merely a shorter duration. The check is not "does it calm down", it is "does every state that
animates still read when it does not".

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
carrying 176 by accident.

**The veil is for a SATURATED token. A family already near cream takes a highlight instead.** Four of
the twelve card-set tints (`#ffe3bf`, `#ffd6a5`, `#e9d8c4`, `#d8cfc0`) are pale to begin with, and
veiling them produced four identical white discs on the one badge that carries a set's identity —
`.seed-art`'s own named failure reached from the other direction. `.set-ring` therefore takes
`radial-gradient(circle at 34% 28%, rgba(255,255,255,.5), transparent 62%)` over the tint: the same
highlight geometry, no wash. Use the veil when a token would otherwise fight the ink; use the
highlight when it would otherwise disappear.

**Gold means "you can have this", and Fall's Collect All wears the armed chip's exact gold.**
`linear-gradient(180deg, #ffe98a, var(--coin))` is already the bed chip's armed body, the affordable
price's body and the armed board's rim. The Collect All button restates it rather than inventing a
warmer one, because the button and the chip above it are the same fact said twice — the bed is
ready, and here is what it pays. This adds one *use* of a colour the palette already had and **zero
new colours**: `--strict`'s distinct set is unchanged at 133, which is the difference between a
re-baseline and a conversation (2026-08-31).

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


### The values phase 2 added, and why each one exists

Doc 05's fifth check asks *did I invent a value*, and says the answer must either reuse an existing
one or be written down here with its reason. Phase 2 added three small ramps. They are **component
ramps**, not palette entries — the same shape as the meadow's `--mw-stone-*` and `--cob-*`, which
this document names as families rather than listing value by value.

| Ramp | Values | Why it could not reuse one |
| --- | --- | --- |
| **The Tally plate** | `#8a5a33 → #71472a → #5c3a22`, lip `#4a2e1a` | The plate is the ceremony's **dark body** — the second of the four value tiers, doing the same job the garden's planter does against the lawn. It cannot be the planter's own `#d9a870 → #97643a`: the plate sits on cream inside a sheet, not on green, so it needs to be darker to separate, and the cream pills on top of it need more contrast than the planter gives. |
| **The hedge** | `#3f7d43`, lit `#57a25c`, shaded `#2f6236` | `--grass` is the lawn, and a hedge that is the lawn's colour has no figure against the lawn — the meadow's exact diagnosis. Shipped in `UI.hedge()` so the gate card and phase 3's season gates are one object at two sizes. |
| **The gate's scene** | sky `#ffd9a1 → #ffb570 → #e88f4e`, ground `#9a7a3f → #7d6132`, pad `#b08c4c` | An autumn sky and autumn ground, which the palette has none of — every existing sky value is written from JS by `updateSky()` and every green is Summer's. |

Phase 3 added three more, on the same terms:

| Ramp | Values | Why it could not reuse one |
| --- | --- | --- |
| **Fall's trug** | `#c98a4e → #a76b38 → #8a5528`, lip `#5f3a1a` | The board's body has to differ from the world it sits in *and* say its own verb. Summer's planter is soil — dug, planted, cleared; Fall's is a woven basket — filled and carried in whole. Same construction, different material, which is the meadow's cobbles-versus-soil lesson run a second time. |
| **Fall's earth** | `#7e5e42 → #5f4630 → #453221`, lip `#392a1c` | Damper and cooler than `--soil`, so an orange gourd and a red berry read against it. Summer's soil is tuned for flowers. |
| **The Century Bloom's plot** | `#5b4a7a → #463962 → #332a49`, lip `#2a2240` | The one cell that is *not* part of the bed has to look like it is not part of the bed. The rule is made visible before it is explained — and it is deliberately outside every existing family, because it is an exception. |

Fall's scene palette (`SKIES.sun` / `SKIES.moon` in `fall.js`) is a component palette in the same
sense as `Meadow.SKIES`, and lives beside the drawing that uses it.

Phase 3.8 added no ramp, but it did add four alphas, declared here under check 5:

| Where | Values | Why |
| --- | --- | --- |
| **The Turn button's glint** (`turnShine`) | `rgba(255,255,255,.9)` into `rgba(255,201,60,.7)` | The geometry is the ready plot's `sweep` unchanged — same 100° band, same 8° tilt. Only the band's colour is new, and it is new because the plot's flat white at `.55` is tuned for **soil**: over a cream dock button it is a lightening streak with no meaning attached. `--coin` is already the one colour on this button that means *the Turn is ready*, so the glint says the same thing the ring says, louder and once. |
| **Its reduced-motion rest state** | `rgba(255,201,60,.3)` into `rgba(255,201,60,.14)` | The same gold held still across the face. A wash rather than a band because a diagonal band frozen mid-travel reads as a rendering artefact, and the requirement is a *highlighted* state, not a paused animation. |

Phase 3.9, the Sky Pass, added one `:root` token and eighteen literals, declared here under check 5:

| Where | Values | Why |
| --- | --- | --- |
| **`--wonder-sweep`** (`:root`) | `#ff6b6b, #ffd43b, #69db7c, #4dabf7, #b197fc, #ff8fab` | Not a new colour — the *existing* Wonder palette, finally named. Four layers carry this exact six-colour sweep: the Wonder Effect's veil and halo, and the weather veil and takeover cue Wonderfall borrows from them. It went in the moment there were four copies rather than two, because a rainbow written out four times is four places to forget when one of them changes. |
| **The lit channels** — `.wx-bolt`, `.wx-flash-under` (`#fff`), `.wx-ground` (`#ffffff` inside a `color-mix`) | white | The same white `.cloud`, `.stars` and `.outlined` already use. A bolt and a flash are *light*, and light has no token because it is not a material — every surface colour in the palette is something the light falls on. |
| **Fourteen mask stops** — `.wx-bolt`, `.wx-ray`, `.wx-dusk`, `.wx-ribbon`, `.wx-veil`, `.wx-takeover`, `.wx-takeover::after` (`#000`), and the `#ff6b6b` that closes `.wx-takeover::after`'s conic gradient back to where it started | black, and one red | Not a colour at all. `#000` in a `mask-image` means *fully opaque*, and it is the same stop `.season-tint`, `.meadow::after`, `.vignette` and `.fence` already use for the 44px bottom fade. Every one of these is that fade, on a new layer. `tools/style-check.js` counts them because it reads hexes rather than roles; they are recorded here rather than tokenised, because `--fully-opaque: #000` would be a name that explains less than the value. |

The menu drawer (2026-08-31) added **one** token and **no** literal:

| Where | Value | Why |
| --- | --- | --- |
| **`--dot`** (`:root`) | `#ff6b6b` | Not a new colour — the dock's attention dot, finally named. The menu button's badge is the second thing in the game that means *there is something here*, and two dots that drift apart are two dots that stop reading as the same promise. It went in on the `--wonder-sweep` terms: the moment there were two copies rather than one. Net effect on the raw-hex count is **minus one**. |

**The drawer itself introduced no value at all**, and that was checked rather than asserted: the
distinct-hex set in `style.css` is byte-identical before and after it. Every surface in it is an
existing recipe reused — `.seed-row`'s cream material for the rows, `.seed-art`'s veil for the icon
discs and the avatar, `.seed-row.locked`'s drained family for the reserved rows, and
`.seed-lock.no`'s `#f6f2ea` for the Soon chip. The `tools/style-check.js` baseline moved from 409
to 417 occurrences for that reason and no other: eight more *uses* of colours the file already had.
A new component that correctly reuses the house recipe still costs occurrences, which is the one
thing this ratchet cannot tell apart from drift — so the diff of the distinct set is the check that
actually answers question 5, and it is worth running before any re-baseline.

Two things the drawer deliberately did **not** do, both of them docs/05 rules caught by the check
rather than by review: it does not write a hex fallback inside `var()` (`--av` and `--rt` declare
their defaults on the component, where a knob's resting value belongs), and it invents no drained
ink for its reserved rows — those keep `--ink` and `--ink-soft` and let the drained *surface* carry
the state, exactly as the locked seed row does.

**They are literals in `style.css` rather than `:root` tokens on purpose:** each is used by exactly
one component, and twelve more names in a palette this document already says carries 176 colours by
accident (re-counted 2026-08-30) would be a worse trade than three named ramps in one table. Promoting them to local custom
properties on their components (the `--mw-stone-*` pattern) is the tidy if a second component ever
wants one — a phase-4 job, not a phase-2 one.

### The check to run before calling any screen done

Not from memory. Put the new screen **next to the garden at the same size**, on a phone-shaped
viewport, and answer these five out loud. A screen that fails any of them is not done, however
finished the logic is. `node tools/probe.js` will take all the shots at one viewport if you cannot
open the game yourself — see [24-remote-sessions.md](24-remote-sessions.md).

1. **Can I see the board against the world?** Desaturate both. If the container's body colour is the
   same value as the ground it sits on, the screen reads as flat in any palette. Change the body
   colour, not the detail.
2. **Does every surface have a gradient and an opaque lip?** A flat fill is a placeholder. A
   translucent lip is a drop shadow pretending to be a lip. **Search the diff for `0 3px 0 rgba(`
   before you push.**
3. **Is anything floating?** Every object sits on ground that exists inside its own container, with
   its contact shadow drawn onto that ground.
4. **Is every number in a cream pill with a contour?** Naked text on a coloured surface, and grey
   text on cream, are the same bug.
5. **Did I invent a value?** A new radius, a new border width, a new brown, a new easing curve. If
   yes, either use an existing one or add yours to this document with the reason. Silent additions
   are how a style guide becomes fiction.

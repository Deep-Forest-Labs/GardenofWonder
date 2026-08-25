# Architecture

## Shape of the project

Fourteen JavaScript files, one stylesheet, one HTML shell. No build step, no bundler, no modules, no
dependencies. Each file defines exactly one global and they load in dependency order as plain
`<script>` tags.

`<script type="module">` is deliberately not used, because modules are blocked by CORS on
`file://` and one of the goals is that the game runs by double-clicking `index.html`.

## Load order

Declared at the bottom of `index.html`. **The order is load-bearing** — each file may only
reference globals defined above it.

| # | File | Global | Depends on |
| --- | --- | --- | --- |
| 1 | `data.js` | `DATA`, `WONDER`, `FLOWER_LINES`, `PLOT_AUTOPLANTERS`, `MAX_RARITY_MULT`, `CREATURES`, `CREATURE_TRAITS`, `CREATURE_PAIRS`, `BENCH` | nothing |
| 2 | `flora.js` | `Flora` | `DATA` (at `injectDefs` time) |
| 3 | `critters.js` | `Critters` | nothing |
| 4 | `hollow.js` | `Hollow` | nothing |
| 5 | `icons.js` | `Icons` | nothing |
| 6 | `audio.js` | `Sound` | nothing |
| 7 | `fx.js` | `FX` | nothing |
| 8 | `game.js` | `Game` | `DATA`, `WONDER`, `PLOT_AUTOPLANTERS`, `CREATURES` |
| 9 | `ui-shared.js` | `UI` | `Game`, the DOM |
| 10 | `ui-scenery.js` | *(attaches to `UI`)* | `UI` |
| 11 | `ui-sheet.js` | *(attaches to `UI`)* | `UI` |
| 12 | `ui-hollow.js` | *(attaches to `UI`)* | `UI`, `Hollow`, `Critters` |
| 13 | `ui-events.js` | *(attaches nothing)* | `UI` |
| 14 | `ui.js` | *(attaches to `UI`)* | everything above |

The UI files touch the DOM on load, and only `ui.js` calls `boot()`. Every other file is inert
until something calls into it.

## The shared UI surface

`ui.js` was one IIFE, and everything in it closed over the same locals: `$`, `$$`,
`S = Game.state`, the cached `el` element map, the formatting helpers, and callbacks like
`openSheet` and `syncAfford`. Splitting the UI across several files means that scope has to be
passed by hand, because there is no build step and `<script type="module">` is banned.

**It is passed as one global, `UI`.** `ui-shared.js` defines the part with no dependencies —
`$`, `$$`, `S`, `el`, `fmt`, `fmtTime`, `pct`, `signed`, `rnd`, `MASTERY_TRACK` — and every
other UI file attaches its own public functions to `UI` as it loads.

Two rules keep this honest:

- **A call that crosses a file boundary is written `UI.something()`.** A call within a file stays
  bare. So the `UI.` prefix is the marker for "this reaches into another file", and the size of
  each file's dependency on the others is countable by grepping for it.
- **Cross-file references resolve at call time, never at load time.** A file may destructure the
  `ui-shared.js` primitives at the top, because those exist as soon as `UI` does. It may *not*
  destructure another UI file's contributions, because that file may not have loaded yet. This is
  what makes the UI files after `ui-shared.js` order-independent among themselves.

`ui-shared.js` must load first, because the other UI files attach listeners to `el` nodes at load.
`ui.js` must load last, because it calls `boot()`.

## The layering rule

This is the most important convention in the codebase:

```
data.js      content and tuning values, no behaviour
   ↓
game.js      simulation — owns all state and all economy math
   ↓  (events)
ui.js        presentation and input — reads state, never derives economy
```

`game.js` must never reference `document`, `window`, or any DOM node. It is a pure simulation that
happens to persist to `localStorage`. You could run it headless.

`ui.js` must never do economy math. If it needs a number, `game.js` exposes a getter for it. The
one intentional exception is the Almanac panel (`renderBonuses`), which recomputes effective
multipliers for display; it calls `Game.boostVal` rather than hardcoding anything. Collection
progress goes through `Game.discoveredCount`, `discoveredOf`, `bestRarityOf` and
`almanacMilestones`; mastery goes through `Game.masteryOf`, `masteryMult` and `masteryGoal`, and
the ladder formula stays in `game.js`. `Game.decorVal` was deleted in navigation phase 1 along with decor's stat
bonuses — see [15-navigation-and-ia.md](15-navigation-and-ia.md).

`flora.js`, `critters.js`, `hollow.js`, `icons.js`, `audio.js`, and `fx.js` are leaf utilities. They
know nothing about the game — you hand them parameters and they produce SVG, sound, or particles.

## The event bus

`game.js` has a minimal pub/sub. `ui-events.js` subscribes; nothing else does.

```js
Game.on('harvest', (payload) => { /* ... */ });
Game.emit('harvest', payload);   // called from inside game.js
```

There is no unsubscribe. Listeners are registered once at load and live forever, which is fine
for a single-screen game but means **you must not register listeners inside a function that runs
more than once**. This has caused a real bug before: the flower's `pointermove` handler was
attached inside `buildGarden()`, which re-runs on plot expansion, so it stacked up. It now lives
in `boot()`.

### Events

| Event | Emitted when | Payload |
| --- | --- | --- |
| `currency` | Any balance changes | none |
| `tap` | Flower tapped | `{ gain, crit, combo, gemDrop, sparkedWonder, rainDance, beeSwarm, ladybug, held }` |
| `plant` | Seed planted (manually or by a harvester) | `{ idx, seed, auto }` |
| `ready` | A plot finishes growing | `{ idx }` |
| `harvest` | Plot collected | `{ idx, payout, rarity, seed, gemDrop, repBonus, sparkedWonder, luckyHarvest }` |
| `unlock` | Plot purchased | `{ idx, cost }` |
| `purchase` | Upgrade, decor, or booster bought | `{ kind, key, cost?, def? }` |
| `deny` | A purchase failed | `{ reason, need, idx? }` — `reason` is `credits` / `gems` / `level` |
| `wonder` | Wonder Effect starts or ends | `{ active }` |
| `almanac` | A harvest crossed a collection milestone | `{ found, seed, milestones }` |
| `mastery` | A harvest completed one or more mastery tiers | `{ idx, seed, tiers, tier, gems, first, mult }` |
| `quest` | A quest was claimed | `{ id, def, rep, grants }` |
| `levelup` | Reputation crossed a level | `{ from, to, grants }` |
| `grid` | The grid needs a full DOM rebuild | none |
| `panels` | Open sheet content is stale | none |

`grid` and `panels` are invalidation signals rather than descriptions of things that happened.
`grid` triggers `buildGarden()`, which throws away and recreates all plot DOM — only emit it when
the number of plots changes.

## The frame loop

One `requestAnimationFrame` loop in `ui.js` drives everything. There are no other timers except
the ambient music scheduler and various one-shot `setTimeout` calls for animation cleanup.

Work is tiered by how often it actually needs to happen:

| Cadence | Work |
| --- | --- |
| Every frame | `Game.tick`, `renderPlots`, `hudTick` (wallets + quest strip), `FX.step`, combo ring variables |
| 1 s | Combo decay, idle-chatter check |
| 0.25 s | Rail chips (booster and Wonder countdowns) |
| 0.6 s | Dock attention dots, coach mark placement, sky colour, sheet affordability |

`dt` is clamped to 0.1 s so that returning to a backgrounded tab doesn't produce one enormous
simulation step.

### Rendering cheaply

`renderPlots()` runs every frame across eight plots, so it caches the last value it wrote for
every property on each plot (`v.cache`) and only touches the DOM when a value actually changes.
Regenerating a bloom's SVG is comparatively expensive, so it only happens when the seed in a plot
changes identity — growth is expressed by flipping a `data-stage` attribute and letting CSS scale
what is already there.

Follow this pattern for anything new that renders per-frame. Write to CSS custom properties or
data attributes; do not rebuild markup.

## File responsibilities

**`data.js`** — Every tunable number and every piece of content. Seeds, upgrades, decor,
boosters, rarity weights, Wonder configuration, flower dialogue. Also derives the eight per-plot
harvester upgrades procedurally and appends them to `DATA.upgrades`. Contains no logic beyond
that generation.

**`flora.js`** — Turns a seed's `art` block into SVG. Exposes `plant()` (full stem, leaves and
head for a plot), `head()` (bloom only, for shop cards), `talkingFlower()`, and `injectDefs()`,
which writes one hidden `<svg>` holding every gradient so blooms stay cheap to draw.

**`critters.js`** — Turns a creature's `art` block into SVG, the same contract `flora.js` follows.
One body and a vocabulary of features — `crown`, `wings`, `tail`, `stripes`, a palette — so a new
creature is a data row rather than a drawing.

**`hollow.js`** — Draws the room under the garden: walls, burrows, the crack, the wisps.
`scene({ dockHeight, sky })` returns the SVG and `SPOTS` gives the creature positions **in the
scene's own coordinates**, because it is drawn with `preserveAspectRatio="slice"` and a percentage
of the container stops agreeing with a position in the art. `tools/hollow-spike.html` and the live
screen both draw from here, so the art cannot drift between them.

**`icons.js`** — Thirty-eight hand-built outlined SVG icons, every one of them referenced.
`get(name)` falls back to `sparkle` for an unknown name, so a typo degrades instead of throwing;
`hydrate(root)` replaces every `<span data-icon="…">` in a subtree. Static markup in
`index.html` uses `data-icon`; JavaScript-generated markup calls `Icons.get`.

**`audio.js`** — Web Audio synthesis. Two gain buses (effects and music) under a master. Sounds
are declarative recipes built from two primitives, `tone()` and `noise()`. Browsers require a
user gesture before audio starts, so `Sound.init()` is deferred to the first `pointerdown`.

**`fx.js`** — One full-screen canvas plus a DOM layer for floating text. Particle emitters, a
screen-shake driver that writes CSS variables on `#game` (read by the `#world` wrapper's
transform), and haptics. Reads
`prefers-reduced-motion` once at init and thins or disables effects accordingly.

**`game.js`** — The simulation. State, save/load/migration, economy math, purchases,
automation, the Wonder Effect, and the tick. Returns a frozen-in-practice public API.

**`ui-shared.js`** — The scope the UI files share. No behaviour of its own: DOM lookups, the
cached `el` map, and the formatting helpers. See "The shared UI surface" above.

**`ui-scenery.js`** — Everything that paints the world behind the interface: the `SKY_KEYS`
gradient ramp and the day/night interpolation in `updateSky()`, the parallax clouds, and the
weather tint. Publishes `updateSky`, `buildClouds` and `paintWeather`, and asks nothing of the
other UI files.

**`ui-sheet.js`** — The bottom sheet and every panel that opens over the garden: upgrades, shop,
apiary, apothecary, the seed picker, quests, the almanac, settings, the card album, a pack
opening, the welcome-back scene and the developer tools. It owns the sheet element and everything
rendered into it, including the delegated `sheetBody` click listener and drag-to-dismiss. The dock
and HUD buttons that *open* it stay in `ui.js`, with the elements they sit on.

It needs three things from `ui.js` — `UI.toast`, `UI.showBanner` and `UI.buildGarden` — and
publishes `openSheet`, `closeSheet`, `renderSheet`, `sheetMode`, `setAwayReport`, `syncAfford`,
`tickSheetTimers` and `CORE_UPGRADES`.

**`ui-hollow.js`** — The Hollow screen: it places real creatures into `Hollow.SPOTS`, owns the
room's own dock, and decides what a tap on a creature means. A tap is **modal** — Pet collects a
keepsake or makes the creature react, Loadout sends it out or lets it rest — because the room is
where the creatures live and so it is also where the loadout is chosen. Nodes are built once and
only their badges change; rebuilding them restarts every float, tilt and glow.

**`ui-events.js`** — The wiring from simulation events to what the player sees and hears. Every
`Game.on(...)` subscription lives here, along with the animations only they trigger: the three
tap-proc effects, the adjacency flash, and the seed-name lookup for mutation banners. It decides
nothing — it turns an event payload into particles, sound, haptics, a toast or a banner. It
attaches nothing to `UI`, being a pure consumer, and is the file with the widest reach into the
others.

**`ui.js`** — Everything else: DOM construction, the garden and its per-frame render, the talking
flower, input handling, HUD counters, the quest strip, the rail, toasts, banners, coach marks, the
dock, the frame loop and `boot()`.

It publishes the presentation primitives the other UI files drive: `toast`, `showBanner`,
`buildGarden`, `say`, `faceReact`, `popWallet`, `renderQuestStrip`, `renderRail`, `hideCoach`,
`noteActivity`, `plotEls` and `flowerBtn`. **`flowerBtn` is a function, not the node** —
`buildGarden()` throws the flower away and makes a new one on every plot expansion, so a captured
reference goes stale.

## Sizing the garden

The garden must be a perfect square that fills the stage row, which CSS alone cannot express here.
`sizeGarden()` measures the stage and sets explicit pixel width and height, driven by a
`ResizeObserver` plus `resize` and `orientationchange` handlers.

The five UI rows (`hud`, `quest-strip`, `rail`, `stage`, `dock`) have explicit `grid-row`
assignments. This is not decorative: the rail is `display:none` on short screens, and without
explicit rows the remaining elements shift up a track and the dock stretches to fill the leftover
space. The quest strip stays visible when the rail hides.

## Where the awkward bits are

`ui.js` reached 2,309 lines before being split, on 2026-08-16, along the three seams the docs had
named for months: the sheet panels, the scenery and day/night code, and the event wiring. All
three are out. What is left in `ui.js` is the garden, the talking flower, the HUD and rail, input,
the frame loop and `boot()` — about 700 lines.

The next seam, if one is ever needed, is the garden itself: `buildGarden`, `renderPlots` and the
talking flower are independent of the HUD and the rail. It is not worth doing yet.

Sheet panels return HTML strings that are assigned with `innerHTML`. This is concise and fast
enough, but it means **any content interpolated into a panel must be trusted**. All current
content comes from `data.js`. If player-supplied text ever reaches a panel, escape it.

## `customers.js`

Added 2026-08-25, alongside the Garden Stand. Same contract as `flora.js` and `critters.js`:
**parameters in, SVG out, and it knows nothing about the game.** A customer is a palette and a hair
style, so a new villager is a data row in `CUSTOMERS` rather than a drawing.

Drawn **head-and-shoulders**, because the portrait's job is to break out above the top of a sheet
the way a creature's does, and a bust reads at that size where a whole body becomes a smudge. Its
viewBox deliberately extends **above** the origin (buns, caps and hat brims draw up there) and
**below** the shoulders (the sheet sinks the art ~52px into the panel, and without that margin the
sink lands on the name plate).

`draw()` always emits **all three expressions** — greeting, waiting, delivered — and CSS picks one,
the same contract the sleeping creatures use. That is why the file never has to be told whether an
order is filled, and why every screen that draws a customer gets the reaction for free.

## `overworld.js` and `ui-map.js`

Added 2026-08-25. `overworld.js` follows the same contract as `flora.js`, `critters.js` and
`hollow.js` — **parameters in, SVG out, knows nothing about the game** — and owns the world's
coordinates: `W`, `H`, `PLACES`, `PARCELS` and `CELLS`. A landmark has one set of numbers, and the
UI reads them to position its own layers, so art and hit targets cannot drift apart.

**It is deliberately not called `Map`.** That is a JS built-in and `ui-hollow.js` already uses
`new Map()`.

`ui-map.js` is the camera and the input. The one identity the whole file rests on:

```
transform: translate(-camX * s, -camY * s) scale(s)   with transform-origin: 0 0
```

That puts world point `(camX, camY)` at the top-left of the screen — **and it only holds from the
origin.** Moving `transform-origin` to the place being dived into breaks the pan, which is how the
first build shipped wrong. The dive therefore animates the *camera*, not the origin, and the
transition is switched on only for the rise and the dive — a transition left on during a drag makes
every pan lag a third of a second behind the finger.

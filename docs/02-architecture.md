# Architecture

## Shape of the project

Seven JavaScript files, one stylesheet, one HTML shell. No build step, no bundler, no modules, no
dependencies. Each file defines exactly one global and they load in dependency order as plain
`<script>` tags.

`<script type="module">` is deliberately not used, because modules are blocked by CORS on
`file://` and one of the goals is that the game runs by double-clicking `index.html`.

## Load order

Declared at the bottom of `index.html`. **The order is load-bearing** — each file may only
reference globals defined above it.

| # | File | Global | Depends on |
| --- | --- | --- | --- |
| 1 | `data.js` | `DATA`, `WONDER`, `FLOWER_LINES`, `PLOT_AUTOPLANTERS`, `MAX_RARITY_MULT` | nothing |
| 2 | `flora.js` | `Flora` | `DATA` (at `injectDefs` time) |
| 3 | `icons.js` | `Icons` | nothing |
| 4 | `audio.js` | `Sound` | nothing |
| 5 | `fx.js` | `FX` | nothing |
| 6 | `game.js` | `Game` | `DATA`, `WONDER`, `PLOT_AUTOPLANTERS` |
| 7 | `ui.js` | *(none — IIFE)* | everything above |

Only `ui.js` touches the DOM on load, and only `ui.js` calls `boot()`. Every other file is inert
until something calls into it.

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

`flora.js`, `icons.js`, `audio.js`, and `fx.js` are leaf utilities. They know nothing about the
game — you hand them parameters and they produce SVG, sound, or particles.

## The event bus

`game.js` has a minimal pub/sub. `ui.js` subscribes; nothing else does.

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

**`icons.js`** — Thirty-eight hand-built outlined SVG icons, every one of them referenced.
`get(name)` falls back to `sparkle` for an unknown name, so a typo degrades instead of throwing;
`hydrate(root)` replaces every `<span data-icon="…">` in a subtree. Static markup in
`index.html` uses `data-icon`; JavaScript-generated markup calls `Icons.get`.

**`audio.js`** — Web Audio synthesis. Two gain buses (effects and music) under a master. Sounds
are declarative recipes built from two primitives, `tone()` and `noise()`. Browsers require a
user gesture before audio starts, so `Sound.init()` is deferred to the first `pointerdown`.

**`fx.js`** — One full-screen canvas plus a DOM layer for floating text. Particle emitters, a
screen-shake driver that writes CSS variables on `#game`, and haptics. Reads
`prefers-reduced-motion` once at init and thins or disables effects accordingly.

**`game.js`** — The simulation. State, save/load/migration, economy math, purchases,
automation, the Wonder Effect, and the tick. Returns a frozen-in-practice public API.

**`ui.js`** — Everything else: DOM construction, input handling, the bottom sheet, all six sheet
panels, HUD counters, the rail, toasts, banners, coach marks, day/night interpolation, clouds, and
the frame loop.

## Sizing the garden

The garden must be a perfect square that fills the stage row, which CSS alone cannot express here.
`sizeGarden()` measures the stage and sets explicit pixel width and height, driven by a
`ResizeObserver` plus `resize` and `orientationchange` handlers.

The five UI rows (`hud`, `quest-strip`, `rail`, `stage`, `dock`) have explicit `grid-row`
assignments. This is not decorative: the rail is `display:none` on short screens, and without
explicit rows the remaining elements shift up a track and the dock stretches to fill the leftover
space. The quest strip stays visible when the rail hides.

## Where the awkward bits are

`ui.js` is about 1,000 lines and is the file most likely to need splitting as the game grows. The
natural seams are the sheet panels (six `render*` functions), the scenery and day/night code, and
the event wiring.

Sheet panels return HTML strings that are assigned with `innerHTML`. This is concise and fast
enough, but it means **any content interpolated into a panel must be trusted**. All current
content comes from `data.js`. If player-supplied text ever reaches a panel, escape it.

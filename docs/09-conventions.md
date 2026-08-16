# Conventions and Playbooks

Read this before writing code. It's the difference between a change that fits and one that has to
be redone.

## Non-negotiables

**No build step.** No bundler, no transpiler, no package manager, no `node_modules`. The game must
stay runnable by opening `index.html`. If a change would require a build, it's the wrong change.

**No dependencies.** The only external resource is the Baloo 2 web font, and the game degrades
gracefully without it.

**No binary assets.** No images, no audio files, no icon fonts. Generate SVG and synthesize sound.
See [05-art-direction.md](05-art-direction.md).

**No `<script type="module">`.** Modules break under `file://`. Plain scripts and globals, loaded in
dependency order.

**Relative paths only.** No leading slashes anywhere. The game is served from a subpath on GitHub
Pages (`/gardenwonder/`), so `/style.css` would 404.

## Layering

```
data.js   →  game.js  →  ui-shared.js → ui-scenery.js / ui-sheet.js / ui-events.js / ui.js
             (no DOM)                    (no economy math)
```

- **`game.js` must never touch the DOM.** No `document`, no `window`, no element references. It's a
  headless simulation.
- **The `ui-*` files must never do economy math.** Need a number? Add a getter to `game.js`.
- **They share one global, `UI`**, and a call that crosses a file boundary is written
  `UI.something()` — see [02-architecture.md](02-architecture.md#the-shared-ui-surface).
- **`flora.js` / `icons.js` / `audio.js` / `fx.js` know nothing about the game.** Parameters in,
  output out. Don't let game concepts leak into them.
- **`data.js` holds no logic.** Values and content only.

## Code style

Matching what's already there matters more than any individual preference.

- Two-space indent, semicolons, single quotes.
- `const` by default, `let` when reassigned, never `var`.
- Modules are IIFEs returning a public object. Everything not returned is private.
- `camelCase` for functions and variables, `SCREAMING_CASE` for module-level constants.
- Short helper names are established and fine: `$`, `$$`, `fmt`, `ico`, `pct`, `el`, `S`.
- Template literals for HTML strings. Keep interpolation shallow enough to read.

### Comments

The codebase is deliberately light on comments. Existing ones explain **why**, never what:

```js
// An untouched Wonder save should never shadow real progress from the old build.
// Rare fires often enough that a toast would be noise; sparkles carry it.
// Keep the board a perfect square that fills whatever the stage row offers.
```

Don't add comments that narrate. Don't add comments explaining your change or referencing this
conversation — write for someone reading the file in a year with no context about how it got there.

## Performance rules

The frame loop runs across eight plots at 60 fps on a phone. Three rules:

**1. Cache before you write.** `renderPlots()` stores the last value written for each property and
only touches the DOM on a real change. Follow the pattern.

**2. Prefer CSS variables and data attributes to markup rebuilds.** Growth animation is one
attribute flip, not new SVG. Regenerate markup only when identity changes.

**3. Put work on the right tier.** Every frame is for things that must be smooth. Use 0.25 s for
countdowns and 0.6 s for anything a player won't notice lagging. Adding to the every-frame tier
needs justification.

Animate `transform` and `opacity`. Avoid animating layout properties.

## Playbook: add a seed

1. Append to `DATA.seeds` in `data.js`. **Keep `yield` at exactly `cost × 1.4`** — see
   [04-economy.md](04-economy.md). Set `unlockLevel` so the seed picker can grey it until that
   garden level.
2. Write the `art` block. Pick an existing `shape`, or add a recipe to `rings()` / `customHead()` in
   `flora.js`.
3. **Leave `gemChance` alone.** It is derived from grow time (`grow × 0.0005`, capped at 50%) so
   gems per hour stays flat across the ladder — see
   [04-economy.md](04-economy.md#gem-drops). Setting it explicitly overrides that and reintroduces
   the inversion that made Daisies the best gem farm in the game. Only do it with a reason in the
   decision log.
4. Gradients are generated automatically from `c1` / `c2`.
5. **Check the bloom at 22 px**, not just in a plot. The Almanac renders it that small.
6. **Bump the last `DATA.almanacMilestones` `at` to the new `DATA.seeds.length`.** Completing the
   collection is "every seed", not a frozen 19.

Nothing else needs touching — the seed picker, Almanac and harvester ceilings all read the array.

A seed may also carry a `verb` — see the next playbook. Most don't, and that's fine.

## Playbook: add or change a verb

Background in [03-systems.md](03-systems.md#verbs-and-adjacency), numbers in
[04-economy.md](04-economy.md#verb-tuning).

1. Add an entry to `DATA.verbs` with `name`, `cat`, `tint`, `desc`. **`cat` must be one no other verb
   uses** — a sim-test enforces it. That rule is the mechanic: two verbs that are both "+X% coins"
   give the player nothing to choose between.
2. Put its numbers in `DATA.verbTuning`, never inline in `game.js`. One place, so a balance pass is
   one edit.
3. Set `verb: 'yourVerb'` on exactly one seed in `DATA.seeds`. **Do not touch that seed's `yield`** —
   `yield === cost × 1.4` holds for every seed including verb-carriers, and a sim-test asserts it.
   Verbs are a second axis, not a discount.
4. Consume it somewhere. Nothing is applied automatically:
   - A **payout** effect belongs in `verbPayoutMult()`.
   - A **growth** effect belongs in `keeperModifier()` and needs a retro path like
     `quickenNeighbours()`, or it only works when the player plants in the right order.
   - A **harvest-moment** effect (rarity, drops, sowing) goes in `harvest()`, and must be read
     **before the plot is cleared** — clearing changes the neighbourhood.
5. Add sim-test coverage. The existing verb groups are the template; assert the neutral case
   (no neighbours = no effect) as well as the active one.
6. Nothing goes in the save. Verbs are derived from the seed id already in `state.grid[i].seed`, so
   there is no migration and retuning applies to every existing save instantly. **Keep it that way.**

Bounds worth knowing: every plot has exactly two neighbours, so any verb caps at two stacks.

## Playbook: add an upgrade (badge)

1. Add an entry to `DATA.upgrades` with `name`, `short`, `base`, `scale`, `icon`, `desc`.
2. Add the matching effect to `UPGRADE_EFFECTS` in `game.js`. It must increment its own level and
   return `true`, or return `false` to refund. If the badge just levels up to a hard cap and does
   nothing fancier, use the `cappedUpgrade(key, max)` helper rather than writing the same
   if/increment/return shape out by hand — `rainDance`, `beeSwarm`, `ladybug` and `autoWater` all
   use it.
3. Add its key to `CORE_UPGRADES` in `ui-sheet.js` so it appears in the Upgrades tab.
4. Add the field to `defaultState().upgrades`, **and** to the manual backfill list in `load()`
   (`['holdSpeed', 'rainDance', 'beeSwarm', 'ladybug'].forEach(...)`) — see "`load()` replaces
   `state.upgrades` wholesale" in [HANDOFF.md](HANDOFF.md#traps-in-this-codebase). Skipping this
   step is invisible until someone loads an old save.
5. If it has a cap, handle it in `upgradeMaxed()`. Several badges do now: `plotExpansion`,
   `holdSpeed`, `autoWater`, `rainDance`, `beeSwarm`, `ladybug`.
6. If it's a new *kind* of effect, find where it should be read in the economy. Nothing is applied
   automatically. A per-tap "chance to do something" effect belongs in `tapFlower()` as its own
   `rollXxx()` helper — see the three tap-triggered procs in
   [03-systems.md](03-systems.md#tap-triggered-garden-procs) for the pattern.

## Playbook: add decor

1. Append to `DATA.decor` with `name`, `currency`, `cost`, `icon`, `desc`. Decor is purely
   cosmetic — no `type`/`val` effect fields. Write flavour text, not a stat claim.
2. Decor stacks and never escalates in price. `Game.decorCount(id)` reads how many a player owns.
3. It lives in the Shop tab (`renderShop()` in `ui-sheet.js`), bought with `Game.buyDecor(id)`.

## Playbook: add a booster

1. Append to `DATA.boosters` with `dur`, `icon`, `tint`, `effects`, `desc`. Do not add a price —
   boosts are earned, not bought.
2. Use an **existing effect key** if you can — see the key table in
   [04-economy.md](04-economy.md). For a new key, add the place that reads it — `boostVal(key)`
   sums active sources, but something has to consume the sum.
3. A boost that is already running cannot be refreshed — the rail hides the hold-chip until it
   expires, so a second copy is not spent by accident. Needs a `tint` for the rail chip.
4. There is no shop panel for boosters. They surface as a chip in the status rail (`renderRail()`
   in `ui.js`) — a countdown while active, a tappable consume-one chip while `boostInv` holds at
   least one and the boost is idle, invisible otherwise. Grant copies through quest `reward.boost`
   or `DATA.levelGrants`. See [16-progression-and-quests.md](16-progression-and-quests.md).

## Playbook: add a game event with feedback

1. `Game.emit('yourEvent', payload)` from `game.js`.
2. `Game.on('yourEvent', …)` in `ui-events.js` — **at module level, never inside a function that reruns**.
3. Place it on the feedback ladder in [06-audio-and-fx.md](06-audio-and-fx.md) deliberately.
   Don't give a minor event Legendary-tier juice.
4. Add a sound recipe to `RECIPES` if it needs one, pitched to the pentatonic scale.
5. Respect reduced motion — `FX` handles this for you if you go through it.
6. Toasts only for genuinely notable moments. The cap is two.

## Playbook: add a sheet panel

All of this is in `ui-sheet.js`.

1. Add a `render*()` function returning an HTML string.
2. Register it in the `render` map and the `titles` map in `renderSheet()`.
3. Open it with `openSheet('yourMode')`.
4. Add tabs in the tab-strip branch if it needs them.
5. Handle interactions in the existing delegated `el.sheetBody` click listener — use a `data-*`
   attribute rather than adding another listener.
6. Make sure the frequently-changing parts are updatable by `syncAfford()` so it doesn't need a full
   rebuild on every tap.

## Playbook: add a development cheat

Panel is `renderDev()` in `ui-sheet.js`; the logic is `Game.Dev` in `game.js`. Full description in
[03-systems.md](03-systems.md#development-tools).

1. Add the behaviour to `Game.Dev`. **Force the real code path** — arm a flag the real function
   checks, or call the real function. Never call an FX helper directly to simulate an effect; a
   panel that plays perfect animations for broken features is worse than no panel.
2. Add a button to `renderDev()` with `data-dev="<what>"` and `data-arg`.
3. Handle it in `handleDev()`. Return falsey when a precondition fails so the caller can deny —
   a cheat that quietly does nothing reads as the feature being broken.
4. **Make it one-shot unless it is deliberately sticky.** A forced rarity left armed corrupts every
   balance reading taken afterwards. Only the weather hold is sticky, and it is visibly marked.
5. Add a sim-test. At minimum assert the force works *and* that nothing leaks into an unforced run.

## Playbook: change saved state

Covered fully in [07-save-data.md](07-save-data.md). The short version:

1. Add the field to `defaultState()`.
2. **If it's a nested object, add it to the individual re-merge list in `load()`** — this is the
   step people forget, and it breaks loading for existing players.
3. Renaming a field requires a fixup like the existing `plot1Gardener` one.

## Testing

There is no test suite. Verification is manual plus ad-hoc Playwright scripts.

Before calling a change done:

1. **Load at 390×844** with device emulation on.
2. **Tap the flower ~20 times** — coins fly, combo ring fills, pitch climbs, face reacts.
3. **Plant, hasten, harvest** a plot through all three growth stages.
4. **Open all seven sheet panels.** Check nothing overflows or wraps badly.
5. **Drag the sheet down** to dismiss.
6. **Reload** and confirm progress persisted.
7. **Summon a Wonder** from Settings and watch it start and end.
8. **Check a short viewport** (~640 px tall) — rail hidden, dock not stretched.
9. **Rotate to landscape.**
10. **Enable reduced motion** and confirm things calm down.
11. **Console must be clean.** No errors, no failed requests.

If you touch save loading, test migration explicitly: seed an `igr-save`, clear `gw-save`, load, and
confirm the import plus the "Progress restored" toast. Then test the pristine-shadow case from
[07-save-data.md](07-save-data.md).

## Deploying

The repository root **is** the deployed site. GitHub Pages serves `main` at
`https://jonishua.github.io/gardenwonder/`.

Consequences:

- Anything committed to root is public immediately.
- Pushing to `main` deploys. There is no staging environment.
- A rebuild takes roughly a minute.
- Never add a leading-slash path.

## Documentation duty

The checklist is in [AGENTS.md](../AGENTS.md#definition-of-done) and runs in the **same commit** as
the code. In short: update the doc that owns what you changed, log the reasoning in
[10-decision-log.md](10-decision-log.md), prune what you fixed from
[11-known-issues.md](11-known-issues.md) and add what you knowingly left broken, then write
[HANDOFF.md](HANDOFF.md) last, from the other docs rather than from memory.

Numbers quoted in these docs are copied from code by hand. Rebalancing means grepping `docs/` for
the old value — it is usually quoted in more than one place.

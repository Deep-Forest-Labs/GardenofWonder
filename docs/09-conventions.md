# Conventions and Playbooks

Read this before writing code. It's the difference between a change that fits and one that has to
be redone.

## Non-negotiables

**No build step.** No bundler, no transpiler, no package manager, no `node_modules`. The game must
stay runnable by opening `index.html`. If a change would require a build, it's the wrong change.

**No dependencies.** The only external resource is the Baloo 2 web font, and the game degrades
gracefully without it.

**No binary assets in the game.** No images, no audio files, no icon fonts. Generate SVG and
synthesize sound. See [05-art-direction.md](05-art-direction.md).

The first exception is `icons/` — the home screen icons the operating system requires, which
cannot be SVG on iOS. They are packaging, not art: nothing in the game loads them, and
`icons/icon.svg` remains the source they are rasterised from. See
[23-installable-pwa.md](23-installable-pwa.md).

**The second exception is `art/announcements/`, and it is deliberately narrow** (owner's ruling,
2026-08-30). A What's New announcement carries one piece of flashy owner-supplied art, and that
art is a photograph-class raster nobody is going to hand-write as SVG. The rules that keep it an
exception rather than a precedent:

- **This folder only.** `art/announcements/<id>.png`, one image per row in `DATA.announcements`.
  Nothing else in the game may load a raster, and no other folder inherits this.
- **Owner-supplied.** It is content the owner drops in, like the copy beside it — not something an
  agent generates, converts or optimises. If it needs re-exporting, that is the owner's call.
- **Lowercase paths.** GitHub Pages is case-sensitive and a Mac is not, so `Art/Announcements/`
  works locally and 404s on the live site. This bit once already.
- **It joins `CORE` in `sw.js` in the same commit**, or an installed app shows a broken square in
  the middle of a dialog it cannot dismiss around.
- **It is never load-bearing.** The dialog draws and dismisses with the image missing.

**The third exception is `docs/screens/`, and it is the first one that is not in the game at
all.** The screens gallery in [44-screens.md](44-screens.md) is a photograph of each key screen,
written for the Unity team and for anyone they forward it to. A screenshot of a running game
cannot be SVG, and a gallery that has to be rebuilt by hand is a gallery that goes stale. The
rules that keep it an exception rather than a precedent:

- **This folder only.** `docs/screens/<slug>.png`, one image per section of `44-screens.md`.
- **Nothing in the game loads them.** They are documentation imagery, like the diagrams in these
  docs would be if we had any — not assets, and never referenced from a `ui-*` file or `sw.js`.
  Adding one to `CORE` would make an installed app precache the design docs.
- **Generated, never hand-made.** `node tools/capture-screens.js` writes every one of them from
  the live build. A screenshot edited by hand, cropped, or dropped in from a phone is a lie the
  next regeneration silently deletes.
- **Kept small deliberately.** The tool quantises each PNG to an adaptive palette and refuses to
  finish if one lands over 300KB. These are regenerated often and every run is a new blob in git
  history forever, so the ceiling is the point.
- **Lowercase paths**, for the same case-sensitivity reason as the folder above.

**The fourth exception is `art/reveals/`, and it is an explicitly WIDENED cousin of the second**
(owner's ruling, docs/47, 2026-09-02) — the moments dialog that celebrates a seed or upgrade
reveal, one image per entry. Same shape as `art/announcements/`: owner-supplied, this folder only,
lowercase paths, joins `sw.js` `CORE` with a version bump the moment a file is added or changed,
never load-bearing (the dialog's art chain falls back to the shared `placeholder.jpg`, then to the
seed's own bloom or the upgrade's own badge — see doc 47's art chain). **The one term that
differs, and the reason this is a cousin rather than a reuse of the second exception outright: the
agent MAY compress and resize reveal art on the way in.** The announcements folder forbids that —
that art is a single flashy hero image, hand-picked and hand-sized by the owner. This folder is up
to nineteen-plus pieces of art landing over time against a hard 300KB-per-file cap (the phone
payload, not the screenshot tool's git-churn budget those bytes elsewhere in this doc are about),
so an agent re-encoding a dropped-in source image under that cap is expected work, not a liberty.
`placeholder.jpg` itself was re-encoded this way, from the owner's untracked `art/IMG_3718.jpg`
(394KB) down to 124KB.

None of the four exceptions is permission to add a PNG anywhere else, and only `docs/screens/`
does not ship inside the game.

**No `<script type="module">`.** Modules break under `file://`. Plain scripts and globals, loaded in
dependency order.

**Relative paths only.** No leading slashes anywhere. The game is served from a subpath on GitHub
Pages (`/gardenwonder/`), so `/style.css` would 404.

**A new script file must be added to `CORE` in `sw.js`.** That list is what gets precached for
offline play. Miss it and the game still works online but fails to boot without a network. So does
any announcement image — see the exception above. See
[23-installable-pwa.md](23-installable-pwa.md).

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
   [04-economy.md](04-economy.md). **Seeds no longer gate on levels** (the Garden Year retired
   that, 2026-08-29): a new seed lands at the end of the ladder and prices at
   `DATA.year.unlockBase × unlockRatio^(index − freeSeeds)`, which at index 19 is ~147M gold.
   `unlockLevel` is still worth setting — migrations read it to grandfather old saves, and the
   picker still shows it until phase 2 ships the unlock rows — but it gates nothing. If the new
   seed should be reachable, price it deliberately; **until phase 2 there is no unlock surface
   in the game, so a fresh save cannot buy it at all** (Developer tools → *Unlock the next
   seed*).
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

Nothing else needs touching — the seed picker, Almanac and harvester ceilings all read the
array — but note the unlock price above is what decides whether the seed is *reachable*.

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

1. Append to `DATA.boosters` with `dur`, `icon`, `tint`, `effects`, `desc`. **Do not add a price —
   boosts are earned, not bought, and this is now enforced by name.** `PRICE_FIELDS` in
   `tools/sim-test.js` bans `cost`, `price`, `gems`, `credits`, `tickets` and `currency` on every
   row of the table. A boost that is *offered* for something needs its offer terms in a block of
   their own — `DATA.droneRental` is the worked example.
2. Use an **existing effect key** if you can — see the key table in
   [04-economy.md](04-economy.md). For a new key, add the place that reads it — `boostVal(key)`
   sums active sources, but something has to consume the sum. **Check whether
   `passiveIncomeRate()` should see it, and default to no.** That function returns a *rate*, read
   once at the moment of return and multiplied over the whole absence, so any temporary effect
   composed into it is worth a full away window rather than its own duration.
3. A boost that is already running cannot be refreshed — the rail hides the hold-chip until it
   expires, so a second copy is not spent by accident. Needs a `tint` for the rail chip.
4. **Boosters normally have no shop panel, and exactly one is an exception.** They surface as a
   chip in the status rail (`renderRail()` in `ui.js`) — a countdown while active, a tappable
   consume-one chip while `boostInv` holds at least one and the boost is idle, invisible
   otherwise. Grant copies through quest `reward.boost` or `DATA.levelGrants`. See
   [16-progression-and-quests.md](16-progression-and-quests.md). The exception is the Harvest
   Drone: it is offered as a Shop card for one rewarded video, granted by `Game.rentDrone()`
   rather than by `boostInv` and the power-up button, and it is not in the bag, on any rung or on
   any quest. Follow the ad playbook below rather than this step if you are adding a second.
5. If the effect cannot reach a season room, add its key to `SEASON_DEAD_EFFECTS` (`ui.js`) — that
   one array gates both the rail chip and the tap that would spend a copy.

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

## Playbook: add or move a menu row

The menu drawer is deliberately a table, because the owner's condition at the wireframe gate was
that this menu will keep changing and things must move in and out of it easily. All of it is `ROWS`
at the top of `ui-menu.js`.

1. Add a row: `{ id, icon, tint, label, note, open }`. `open` is a thunk — usually
   `() => UI.openSheet('mode')`. The drawer closes itself before calling it, so a panel never opens
   behind a scrim.
2. **`tint` must be a saturated colour, and should be one the palette already has** — the seed art
   colours in `DATA.seeds[].art.c1` are the source the four live rows use. The disc draws it under
   `.seed-art`'s white veil, and a pale tint under that veil is a white disc: docs/05 names that
   failure under `.set-ring`.
3. A row that should badge gets `dot: () => <boolean>`, recomputed on every `panels` emit.
4. A reserved slot gets `soon: true` instead of `open`. It renders drained, non-interactive, with a
   Soon chip where a live row wears its badge. **Three is the cap** — past that the menu is
   advertising more game than exists, which is the whole reason it is honest.
5. Order in the array is order on screen; live rows are drawn first and reserved ones fall below the
   rule automatically, whatever order they are written in.
6. **The icon has to exist in `icons.js`**, and adding one means `node tools/export-icons.js` —
   which also rewrites the manifest in `45-asset-inventory.md`. Its "Used by" scan reads `icon: 'x'`
   in `data.js` *and* in `ui-*.js` files, so a row's icon is attributed to `ui-menu.js ROWS` rather
   than reported as an orphan.

Nothing else needs touching. There is no mode map and no title map — a drawer holds one list.

## Playbook: add a state field that can hold free text

There is exactly one today (`state.profile.name`) and the rule that governs it is not obvious, so it
is written down rather than inferred.

1. **Player text never enters a template literal.** No `esc()` helper exists and none should be
   written; the reasoning, and the four alternatives that were priced and rejected, are in
   [11-known-issues.md](11-known-issues.md).
2. Give the template an **empty labelled node** — `<b data-pname></b>` — and fill it with
   `.textContent` in one pass after the markup is written. One function, one call site per view:
   `paintName()` in `ui-menu.js` is the worked example.
3. An **attribute** goes through `setAttribute`; an **input** goes through `.value`. Never an
   interpolated attribute — a name holding a quote closes it and everything after becomes markup.
4. **Sanitise in `game.js`, do not escape there.** The engine's job is that the value is short,
   single-line and never empty; making it *safe* is the render site's. Escaping at the boundary puts
   `&lt;` in the save file and strands every existing save the day anyone changes their mind.
5. **Add every spelling of the accessor to `FIELDS` in `tools/html-check.js`.** `state.x.y`,
   `S.x.y` and a `Game.getter()` are the same fact three ways, and a check that knows one of them
   passes while the other two ship the bug.
6. Run `node tools/html-check.js`, then **break it on purpose and check it goes red** — including a
   nested case (`${a ? \`<b>${name}</b>\` : ''}`), which is the one that slipped through the first
   version of that walker.

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

## Playbook: add a rewarded-ad placement

**The component is built. Consume it; do not build a second one.** Engine half in `game.js`
(`adOffered`, `watchAd`, `adImpressions`, `adCountToday`, `adCap`, and `state.ads`), UI half in
`ui-sheet.js` (`UI.adTag()`, `UI.AD_LABEL`, the `video` glyph), caps in `DATA.ads`. Two consumers so
far: the Honeypot food tier ([22-creatures.md](22-creatures.md)) and the drone rental
([03-systems.md](03-systems.md#harvest-drone)); the rules and the reasoning are in
[37-monetization.md](37-monetization.md).

**Two shapes, and the second one is the general case.** A tier *inside* a control (the Honeypot)
swaps its price tag for `UI.adTag()` and branches on `currency` in the engine call it already had.
A whole control that IS the offer (the drone card) carries `data-ad="<placement>"` and is handled
by the single `[data-ad]` arm of `ui-sheet.js`'s delegated `sheetBody` click listener — one arm,
never a second listener, and never `data-buy` (`syncAfford()`'s final else treats an unrecognised
`[data-buy]` as a booster and throws). A `<button>` nested inside a `<button>` is invalid markup and
will not fire, so the pill goes where `priceTag()` goes and the host control carries the hook.

**None of this is an ad system, and the web build never gets one.** What exists is a placement with
a simulated grant — no network, no SDK, no fetch. `watchAd()` is the one function a real SDK would
replace, which is the whole point of the shape.

1. **Ask `Game.adOffered(placement)` FIRST and render NOTHING when it is false.** Absent, never
   disabled: a greyed-out ad button in a player's first session is still an ad in their first
   session. If the offer's absence changes a layout — a column count, a row height — that belongs to
   the same function that decides to render it, so the two can never disagree. `.food-row[data-n]`
   is the worked example, and the *only* place that rule is enforced for the food ladder, so it is
   asserted out of the source in `tools/sim-test.js` — the render is as much of the rule as the
   predicate is. **A first session is not a page-load count**: `adPastFirstSession()` wants the
   garden opened again *and* more than a day old, because a refresh, a restored tab or a
   service-worker update all bump `state.ads.sessions` inside one sitting. A fixture that writes
   `S.ads.sessions = 2` and nothing else is testing the bug this replaced —
   `returningPlayer()` in the suite sets both.
2. **Decide BEFORE rendering whether the reward can land in full, and never offer an ad for a
   trimmed one.** Gold can be part-spent; thirty seconds of somebody's attention cannot, and an ad
   sold once for a partial grant is an ad that is never trusted again. This rule cannot live in
   `watchAd()`, because only the caller knows what its reward is worth — so the caller checks, shows
   the control drained, and **says on the button what it will not give**. `foodEffect().partial` and
   *"too full for all of it"* are the worked example.
3. **Call `Game.watchAd(placement)` in `game.js`, on the same call that grants, and grant only on
   `true`.** It counts and permits; it never grants. Never call it from a `ui-*` file.
4. **Any gold an ad ever pays goes through `credit(n, { ad: true })` — including gold it pays
   LATER, through something it lends.** This is [37-monetization.md](37-monetization.md)'s first
   promise made mechanical: ad-granted gold never feeds the well. Ask what the reward *does* over
   its lifetime, not what the granting function hands over: the drone rental grants no coin at all
   and still paid 81k–591k gold into both accumulators, because the machine it lends spends half an
   hour harvesting. The flag is already there and already sim-tested — use it, and test it by
   **running the reward's whole window**, or the promise is silently broken while the guards stay
   green.
5. **The placement's cap is a key in `DATA.ads.perPlacement` and nowhere else.** A new placement
   adds one line there and nothing else. `dailyCap` is the whole plan and no placement may plan past
   it; both are remote-tunable by construction, which is doc 37's fifth prerequisite.
6. **The button is `UI.adTag(ready)`** — one label (`UI.AD_LABEL`) and one glyph
   (`Icons.get('video')`), everywhere. It takes no currency colour on purpose: cyan is gems and
   blue/purple/gold are the rarity vocabulary ([05-art-direction.md](05-art-direction.md)), and
   borrowing one would teach the player something untrue.
7. **No countdown, no "expires in", no urgency copy of any kind.** A time-limited or
   quantity-limited offer attaches a PEGI 12 descriptor
   ([40-financial-model.md](40-financial-model.md)), and this game's rating headroom is worth more
   than urgency. A sim-test reads `DATA.ads` for that vocabulary and fails on it; keep it true in
   the copy as well as the data.
8. **Rewarded video only** — no interstitials, no banners, no energy, no loot boxes — and nothing
   inside a sacred moment: not the ceremony, not the Wonder, not the Century Bloom's wait.
9. Add a sim-test. At minimum: the placement is absent in a first session, its cap refuses one more
   than it allows, the reward it grants does not reach the mint, and **no impression is spent on a
   refusal** — take the impression mark *before* the refusing call, in its own `check`. An earlier
   assertion that performs the refusal itself absorbs the stray impression and the guard then
   passes with `watchAd()` in the wrong place. That hole was found by sabotage, not by review.

## Playbook: change saved state

Covered fully in [07-save-data.md](07-save-data.md). The short version:

1. Add the field to `defaultState()`.
2. **If it's a nested object, add it to the individual re-merge list in `load()`** — this is the
   step people forget, and it breaks loading for existing players.
3. Renaming a field requires a fixup like the existing `plot1Gardener` one.

## Playbook: change `style.css`

1. Write the change. Use a token, never a raw hex — the palette table is in
   [05-art-direction.md](05-art-direction.md).
2. Run `node tools/style-check.js`. It reads `style.css` and reports six things: raw hex outside
   `:root`, translucent `box-shadow` lips, undeclared custom properties **with no fallback**,
   undeclared custom properties **with** one, corner radii outside the ladder, and a count of every
   distinct border width.
3. **The first three fail the check; the last three only report.** Radius and border are the
   geometry sweep, deliberately deferred — the check measures it so the sweep can be scoped, and
   refuses to be the thing that decides to do it.
4. **A missing variable is two different bugs and only one of them fails.** `var(--x)` with no
   fallback drops the whole declaration at computed-value time and paints nothing — silent, and the
   reason this check exists. `var(--x, 12px)` paints the fallback, which is how you write a knob
   *before* the data that feeds it lands. Failing on the second would fire on correct work in
   progress, so it is reported loudly and gated at zero for the first.
5. **It fails on new drift, not on old.** `tools/style-check.json` records the debt that already
   existed. A check that goes red on its first run and every run after it gets switched off within
   a week, so this one goes red only when a change *adds* to the count.
6. If a new value is deliberate, it goes in [05-art-direction.md](05-art-direction.md) with the
   reason — check 5 of that document's five questions — and then
   `node tools/style-check.js --update-baseline` re-records the count. Raising the baseline without
   writing down why is how a style guide becomes fiction.
7. `--strict` ignores the baseline and lists every violation in the file. That is the sweep's
   worklist, not the gate.

## Testing

`node tools/sim-test.js` plays the whole economy forward in Node and is the cheapest check in the
project; `node tools/style-check.js` holds the visual standard and `node tools/html-check.js` holds
the escaping ruling. Everything above the simulation —
the six `ui-*` files, layout, the sheet, FX — is verified by hand against this checklist, plus
`tools/probe.js` for a screenshot when you cannot open the game yourself.

`node tools/skybench.js LABEL` holds each sky in turn on a full board and reports what one frame
costs under it, so a rendering change can be measured rather than argued about. **Read its header
before quoting a number from it.** It runs headless with software rasterisation: it is good at
*ranking* skies, useless for absolute numbers, and blind to anything that only happens under a
finger. The device figure comes off the dev sheet's Frame rate row, on the handset.

**For a rendering change, prefer an A/B in one session over a before-and-after across two runs.**
Inject the rules you replaced back on top of the live ones, alternate which arm goes first, and
compare within the run. A before-and-after on a shared machine measures whatever else the machine
was doing — this pass produced a whole baseline table that was mostly another session's Chrome.
The same trick gives look-parity for free: freeze every animation at the same `currentTime`, stub
`requestAnimationFrame` so the particle canvas holds still, shoot both arms, and diff the pixels.
Three things that will lie to you if you skip them, each of which did:

- **Dismiss the What's New sheet first** (`tap:#newsOk`). Its backdrop blur costs more than any sky,
  and a bench that leaves it up measures the dialog.
- **A stubbed `requestAnimationFrame` must remember the callback**, because the frame loop
  reschedules itself — a stub that drops it kills the loop for the rest of the run, and every later
  screenshot is a stale canvas that looks entirely plausible.
- **Injected rules create new animation objects that do not exist until the next style recalc**, so
  winding "every animation" in the same tick misses them and shoots one arm at t=0 against the other
  at t=2.6 s.

Before calling a change done:

1. **Load at 390×844** with device emulation on.
2. **Tap the flower ~20 times** — coins fly, combo ring fills, pitch climbs, face reacts.
3. **Plant, hasten, harvest** a plot through all three growth stages.
4. **Open every sheet panel** — Upgrades, Apiary, Craft, Shop, the seed picker, Quests, the Almanac, Feed, the album, a pack, Settings. Check nothing overflows or wraps badly.
5. **Drag the sheet down** to dismiss.
6. **Reload** and confirm progress persisted.
7. **Summon a Wonder** from Settings and watch it start and end.
8. **Check a short viewport** (~640 px tall) — rail hidden, dock not stretched.
9. **Rotate to landscape.**
10. **Enable reduced motion** and confirm every state that animates still *reads* when it does not — not merely that things calm down. `node tools/probe.js media:reduce page:index.html …` screenshots it.
11. **Console must be clean.** No errors, no failed requests.

If you touch save loading, test migration explicitly: seed an `igr-save`, clear `gw-save`, load, and
confirm the import plus the "Progress restored" toast. Then test the pristine-shadow case from
[07-save-data.md](07-save-data.md).

## Deploying

The repository root **is** the deployed site. GitHub Pages serves `main` at
`https://deep-forest-labs.github.io/GardenofWonder/`.

Consequences:

- Anything committed to root is public immediately.
- Pushing to `main` deploys. There is no staging environment.
- A rebuild takes roughly a minute.
- Never add a leading-slash path.

## Playbook: ship a change a player can see

1. Add **one plain sentence** to `DATA.changelog` in `data.js`, in the same commit. Newest entry
   first; append to today's dated entry if there is one, start a new one if there is not.
2. Write it the way the glossary at the top of [32-the-garden-year.md](32-the-garden-year.md)
   writes: what it feels like to play. No version numbers, no file names, no mechanics vocabulary a
   player has not met.
3. **Never edit a shipped entry's date.** The date is its identity — the seen-marker records dates,
   outside the save, and changing one re-shows the whole entry to every player.
4. If the change is genuinely invisible to a player, it adds nothing here. Say so in a line and move
   on; the rule exists so that visible work is announced, not so that every commit is.

The popup itself needs no work: it batches everything unread into one list, shows at most once a
day, never stands beside a What's New announcement, and never greets a brand-new player.

## Documentation duty

The checklist is in [AGENTS.md](../AGENTS.md#definition-of-done) and runs in the **same commit** as
the code. In short: update the doc that owns what you changed, log the reasoning in
[10-decision-log.md](10-decision-log.md), prune what you fixed from
[11-known-issues.md](11-known-issues.md) and add what you knowingly left broken, then write
[HANDOFF.md](HANDOFF.md) last, from the other docs rather than from memory.

Numbers quoted in these docs are copied from code by hand. Rebalancing means grepping `docs/` for
the old value — it is usually quoted in more than one place.

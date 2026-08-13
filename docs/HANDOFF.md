# Handoff — Current State and Next Steps

Last updated: **2026-08-13**

Read this first if you're picking up the project cold. It covers where things stand, what's been
decided, and what to do next. Update it at the end of any significant session.

## Where the project stands

The game is **built, working, and live** at <https://jonishua.github.io/ghostgarden/>, deployed from
`main` at the repository root. It is a single-screen idle garden — tap a talking flower, plant
seeds in eight plots, harvest with rarity multipliers, spend on badges and decor, and earn boosts
from quests and levels.

The first slice of the meta-layer is also playable: **hives producing honey whose variety
follows what is planted, and an apothecary crafting flowers and honey into goods**. It lives behind
two dock tabs (Apiary, Craft), a deliberate throwaway until the world map exists.

**Navigation phase 1 is done**: the dock is `Upgrades · Apiary · Craft · Shop`. Badges was
renamed Upgrades; Decor lost its stat bonuses, became cosmetic, and moved into Shop with existing
owners refunded; Boosts left the dock entirely for a tap-to-activate tray in the status rail. Full
detail in [15-navigation-and-ia.md](15-navigation-and-ia.md).

**Progression phases 1 and 2 are done**: a quest strip sits between the HUD and the rail, reputation is
the only level track, seeds unlock on the bar, extra plots become buyable at levels 3 / 6 / 9
/ 12, and tickets are gone — boosts are earned inventory activated from the rail. Full detail in
[16-progression-and-quests.md](16-progression-and-quests.md). Phases 3–4 (combo, Almanac) and the
world map are still queued. A playtest pass after phase 1 made the bar track the quest and the pip
ring track reputation, replaced generic upgrade quests with buy-then-feel pairs (Combo Coil stays,
so the later multiplier work is not undone), and gated the empty-plot bob to first-plant
onboarding.

**Since then, the last two sessions went into the core tap-and-plant loop instead of phase 2** (see
the decision log for why that's deliberate, not drift):

- **Hold-to-tap**, with a Quick Grip badge that shortens the hold's repeat interval from 900ms down
  to a 180ms floor. Purely an input convenience — every roll (crit, gem, the three procs below) runs
  through the same `tapFlower()` as a manual tap, and the floor exists so holding can never out-earn
  active tapping.
- **A "Balanced" seed-sort option** in the plant picker, alongside cheapest/priciest — sorts by
  distance from `credits ÷ unlocked plot count`, i.e. "what's the right tier across my whole garden,"
  not just for one plot.
- **Three tap-triggered "garden proc" badges** — Rain Dance, Bee Swarm, Lucky Ladybug — each an
  independent, slot-machine-style roll on every tap. Sprinklers (`autoWater`) was recapped and
  repriced alongside them. One day after shipping, all three trigger rates were cut 5× (to
  `0.2%/level`) because they fired too often to feel rare, and each got a dedicated animation so the
  rarer trigger still reads as a clear, celebratory event. Full detail in
  [03-systems.md](03-systems.md#tap-triggered-garden-procs) and the two decision-log entries dated
  2026-08-05/06.
- A **"Grant 1,000,000 Gold" cheat button**, for testing high-currency states quickly.

Fully documented in this folder. Start with [README.md](README.md), then
[02-architecture.md](02-architecture.md) and [09-conventions.md](09-conventions.md).

The current build is a **prototype and design reference**, not the shipping product.

## Who is doing what

| Person | Role |
| --- | --- |
| Owner | Design and web prototyping. Not the implementer. |
| Engineer | Porting to Unity for iOS and Android. |
| Agent | Design advisor, prototype implementation, documentation. |

The web build is the **design lab** — cheap and fast to test ideas. Unity is the **shipping
product**. Keep them in that relationship; don't gold-plate the web build.

## Decisions already made

Don't relitigate these without a reason.

**Goal is modest revenue** — a few thousand a month, low risk. Not a venture-scale hit. This drives
scope, monetization tone, and the bias toward proven patterns.

**Next milestone is the multi-region meta-layer**, specified in
[12-meta-layer-design.md](12-meta-layer-design.md). One contiguous expanding map, five regions
feeding one interlocking economy, driven by a Township-style order system.

**One new mechanic only — merge, in the Potting Shed.** Everything else is timer-and-tap with
distinct art until the structure proves it retains. This is the main defence against scope collapse.
Merge replaced an earlier match-3 plan because match-3's hand-designed level treadmill is
unsustainable for two people.

**The world stays cozy and botanical.** Bees instead of chickens, a nursery instead of a mine.
Tonal coherence is the cheapest competitive advantage available and the easiest to squander.

**Unity port starts with the platform shell**, not the garden. Store setup, IAP, ad mediation,
analytics, remote config, cloud save.

**Every number must live in data, not code**, wired to remote config. Highest-value technical
constraint on the port.

**Navigation follows "places on the map, systems in the dock"**, specified in
[15-navigation-and-ia.md](15-navigation-and-ia.md). Regions are locations you travel to, not tabs.
The current Apiary and Craft tabs are a prototype shortcut and are meant to be removed.

**Economy is currently a frozen port** from *Idle Garden Reborn* and contains known problems — see
below.

## The current task

**Progression phases 3–4**, still specified in
[16-progression-and-quests.md](16-progression-and-quests.md). Phases 1 (quest ladder) and 2
(retire tickets) are built. Next independently shippable slices, in this order:

3. **Make the combo pay.** It currently multiplies nothing. Small, contained, independent of the
   Almanac.
4. **Almanac as a completion goal.** Lifetime discovery tracking plus milestones.

The world map (navigation phase 2) stays paused. Don't start it without asking.

## What comes after

1. ~~Lock the resource graph~~ — **done**, see [12-meta-layer-design.md](12-meta-layer-design.md).
2. ~~Spec the order system~~ — **done**, see [13-order-system.md](13-order-system.md).
3. ~~Economy model skeleton~~ — **done**, see [14-economy-model.md](14-economy-model.md). Structure
   is locked; the numbers in it are deliberate placeholders.
4. ~~Prototype the Garden ↔ Apiary loop~~ — **done and playable**. Mechanics in
   [03-systems.md](03-systems.md); run `node tools/sim-test.js` after any change to it.
5. ~~Decide the navigation structure~~ — **done**, [15-navigation-and-ia.md](15-navigation-and-ia.md).
6. ~~Navigation phase 1~~ — **done**, see above.
7. **Play the loop and judge it — in progress.** Hold-to-tap, Balanced sort, and the three tap
   procs (above) are texture added toward this question. The question is still narrow and still
   open: does the garden's *contents* start mattering — do you plant lavender because you want
   lavender honey? Content decisions wait on that answer.
8. ~~**Progression and quests — specified, current task.**~~ **Phases 1–2 done.** See above and
    [16-progression-and-quests.md](16-progression-and-quests.md). Phases 3–4 (combo, Almanac) are
    next, still ahead of the map: a map full of places is worthless if nothing tells you why you're
    going anywhere.
9. **The world map** — navigation phase 2, queued but paused. Unblocks everything else in the
   meta-layer.
10. **The Market** — see [13-order-system.md](13-order-system.md). The prototype has production but
    nothing that *wants* anything, which is exactly the gap orders fill. It pays into the same
    reputation number the quest ladder does, by design.
11. **Tune the economy for real.** Every number today is a placeholder. Also worth a look: the three
    new proc badges were repriced once (with Sprinklers) but *not* re-cut when their trigger rates
    were cut again the next day — see [04-economy.md](04-economy.md) for the reasoning and a
    deliberate open question about whether that needs revisiting.
12. **Fix the known economy bugs** before building content on top of them.

## Known problems worth knowing immediately

Full list in [11-known-issues.md](11-known-issues.md). The three that affect design decisions:

- **The combo does nothing.** It drives the ring visual and tap pitch only, never payout — which
  makes the 2,500-coin Combo Coil badge a dead purchase. A fix is specified as phase 3 of
  [16-progression-and-quests.md](16-progression-and-quests.md).
- **Endgame seeds have lower gem chances than a Daisy.** Defining `gemChance` overrides the generous
  5% default, so the best gem farm is spamming the cheapest seed.
- **Cheat buttons ship to players.** Settings has "Grant 50 Gems", "Grant 1,000,000
  Gold", and "Summon a Wonder Effect" with no confirmation, live on the public site.

All inherited from the frozen economy port. Fixing them is a deliberate balance project.

## Traps in this codebase

Things that cost real time to discover. None are visible from a casual read.

**`audio.js` already has a global-looking `RECIPES`.** It is a table of *sound* recipes, declared
inside the `Sound` IIFE. Crafting recipes are therefore named `CRAFT_RECIPES`. Shadowing would
technically work, but do not reintroduce the collision.

**`syncAfford()` in `ui.js` assumes every `[data-buy]` is one of three kinds.** Its final `else`
branch treats anything unrecognised as a booster and will throw. New purchase buttons must use
their own data attribute — the Apiary and Craft panels use `data-apiary`, `data-craft` and
`data-sell` for exactly this reason.

**The sheet overlays the dock when open.** Browser automation cannot click a dock button while a
sheet is up; click the in-sheet tab pills at `#sheetTabs .tab[data-tab="..."]` instead.

**`pagehide` calls `Game.saveNow()`.** Injecting a save into `localStorage` and then reloading does
*not* work — the outgoing page writes its in-memory state over the injection. Seed the save from a
page with no game code on the same origin, then navigate to the game. This wasted a full debugging
cycle and produced a false "saves are broken" report.

**Playwright needs an explicit browsers path** in this sandbox:
`PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright"`.

**Grow times are compressed.** A Daisy matures in 12 seconds. Values in
[14-economy-model.md](14-economy-model.md) are mobile-scale and deliberately differ from what the
web build uses; do not "fix" the discrepancy.

**`load()` replaces `state.upgrades` wholesale, it does not deep-merge it.** `Object.assign(state,
defaultState(), parsed)` only shallow-copies top-level keys, so a save from before a given badge
existed simply won't have it in `parsed.upgrades`, and that key comes back `undefined` — not `0`.
Every new badge key needs its own one-line backfill next to the existing `PLOT_AUTOPLANTERS.forEach`
one in `load()`, or `upgradePrice()`/the badge's effect will silently produce `NaN` for old saves.
`state.tap` doesn't have this problem — it's merged with `Object.assign(d.tap, parsed.tap || {})`,
so new fields on it just inherit the default. Same trap applies to any new per-cell grid field
(e.g. `luckyBug`) — it needs its own backfill loop over `state.grid` too.

**Automated/CDP-controlled browser tabs can freeze CSS animation clocks entirely.** If the tab lacks
OS focus (common for an automation window sitting behind the IDE), Chrome can stop advancing
`animation` timelines — `element.getAnimations()[0].currentTime` reads back unchanged across a real
multi-hundred-ms delay, even on an animation that's been looping since page load. `setTimeout` and
`requestAnimationFrame` keep running, so game logic and JS-driven FX (canvas particles, floating
text) still work and are safe to verify normally. To visually verify a *CSS keyframe* animation under
these conditions, don't wait on wall-clock time — trigger it, then manually seek with
`el.getAnimations().forEach(a => a.currentTime = <ms>)` and screenshot immediately in the same CDP
call (`take_screenshot_afterwards`). This cost a debugging cycle on the tap-proc animations before
the cause was found; it is a testing-environment artifact, not a game bug.

**The three tap-proc trigger rates share one constant.** `PROC_CHANCE_PER_LEVEL` in `game.js`
(currently `0.002`) is read by `rollRainDance()`, `rollBeeSwarm()`, and `rollLadybug()` — tune all
three at once by changing it in one place, not by editing each `roll*()` function.

## Checking your work

```bash
node tools/sim-test.js          # 149 assertions over the simulation layer
node --check <file>.js          # no build step, so this is the only syntax gate
python3 -m http.server 8899     # then open http://localhost:8899/
```

`tools/sim-test.js` runs the real `game.js` headlessly, because it has no DOM dependencies. **Keep
it that way** — it is the cheapest way to validate a balance change, and it should survive the Unity
port as an editor test. It asserts *invariants* that must hold through tuning (crafted goods beat
their ingredients by at least 1.35×, every recipe spans two regions) rather than specific numbers.

## Model and cost guidance

The owner is cost-sensitive. Tier the work:

| Task | Model |
| --- | --- |
| Architecture, economy math, hard bugs, design advice | Opus 5 thinking or Gemini 3.1 Pro |
| Day-to-day feature work — the default | **Sonnet 5 thinking** |
| Mechanical edits, boilerplate, exploration subagents | Composer 2.5 Fast or Gemini 3 Flash |

Two multipliers:

- **Point cheap models at these docs.** A Sonnet-class model reading
  [09-conventions.md](09-conventions.md) produces better-fitting code than an expensive model
  guessing. This is the main reason the docs exist.
- **Decide expensive, build cheap.** Advisory conversations cost a fraction of code generation. Use
  a strong model to make the call, a cheap one to implement it.

## Briefing a new agent

Paste something like this into a fresh chat:

> I'm building a mobile idle/casual game called Garden Wonder. The repo is my workspace root and
> it's fully documented in `docs/`.
>
> Read `docs/HANDOFF.md` first, then `docs/README.md` for the index. Before writing any code, read
> `docs/09-conventions.md` and `docs/02-architecture.md`, and note the "Traps in this codebase"
> section of the handoff.
>
> Your task is `docs/16-progression-and-quests.md`, phases 2–4. Phase 1 is built. Read that doc
> in full before touching anything and tell me your plan first. Do not build the world map.
>
> I'm the designer; an engineer is porting to Unity. Goal is modest revenue, small scope, two-person
> team. I want you as a design advisor as well as an implementer — push back on scope creep and tell
> me when an idea is a bad one.

The point of the docs is that this briefing is short. If a new agent needs more than that, a
document is missing.

## Maintaining this file

This file is **derived, never authored alone.** It summarizes the other documents, so update those
first and write this one from them — see the definition of done in [AGENTS.md](../AGENTS.md#definition-of-done).
A handoff written from memory at the end of a long session will confidently describe a game the
specific docs contradict, and the next agent will believe the specific doc.

At the end of a significant session, update: where the project stands, the current task, what comes
after, and any new trap you hit.

A full transcript of the founding conversation exists in Cursor's agent history, but it is long and
mostly implementation detail. **These documents are the intended handoff surface** — if something
important lives only in a transcript, move it here.

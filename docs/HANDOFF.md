# Handoff — Current State and Next Steps

Last updated: **2026-08-18**

Read this first if you're picking up the project cold. It covers where things stand, what's been
decided, and what to do next. Update it at the end of any significant session.

## Where the project stands

The game is **built, working, and live** at <https://jonishua.github.io/gardenwonder/>, deployed from
`main` at the repository root. It is a single-screen idle garden — tap a talking flower, plant
seeds in eight plots, harvest with rarity multipliers, spend on badges and decor, and earn boosts
from quests and levels.

> **Creatures arrived, and the direction changed, 2026-08-16.** The diagnosis was the owner's: the
> world had a place and a character but **no inhabitants**. So **habitat** was added as a second frame
> beside the production chain — the garden is a place that becomes alive because of what you plant.
> **The chain is not cancelled:** garden → bench → market and the order system are still wanted, and
> the owner was explicit about this on 2026-08-16. What is missing is the right way to fold them in,
> not the appetite for them. Treat the parked Potting Bench and Market as **unsolved, never
> rejected**.
>
> **Six creatures**, each drawn by a different bloom across seed unlock levels 1–10: Pip (Bluebell),
> Bumble (Lavender), Bramble (Rose), Thistle (Marigold), Luna (Moonflower), Ember (Starlit Iris). They
> live on the lawn, react when tapped, and leave **keepsakes** on a slow clock — a named memento each,
> written as a small joke about its creature, and **kept** in `state.mementos` rather than cashed
> straight into currency, so a future craft or display has something real to read. **This is the most direct
> answer the project has found to "why plant this flower":** Pip comes for bluebells and nothing else.
>
> **A creature is raised, not found.** It arrives at one star carrying a fifth of its trait and grows
> to five, and **the duplicate that raises it is the same bloom that attracted it** at an escalating
> count (Pip: 5 / 15 / 45 / 135 / 405). That is also the first real answer to **"why would I ever plant
> a Daisy again"** — a low-tier seed stays worth growing long after its coins stop mattering.
>
> **Only a few tend at once** — habitat slots at levels **1 / 5 / 10 / 16**, toggled in the Almanac's
> *The Habitat* block, and only tending creatures stand in the yard. **Eight named pairs**: two
> specific creatures tending together do a third thing neither does alone, with two deliberate
> "perfect trios" rewarding opposite play patterns. Listed under *Companions*.
>
> **The rule about traits and verbs was retracted the same day.** Traits **may** share an axis with a
> verb — they stack, and stacking is the point of the genre. What the suite actually enforces is that
> every trait declares a `pool`, that the roster is not all one kind of effect, that at most a third
> sits in the `yield` pool, and that **no pair touches `yield` at all**.
>
> Art is original work in the kodama archetype, not a copy — the game ships commercially. See
> [22-creatures.md](22-creatures.md) and the top of [10-decision-log.md](10-decision-log.md). **The
> build before all of this is tagged `v1-bench`**, recoverable with `git checkout v1-bench`.

> **The Hollow opened, 2026-08-16.** A warm room *under* the garden, reached through a **burrow
> mouth** at the bottom left of the stage, where every creature that has moved in actually lives. Its
> own dock — Feed, Pet, Loadout, Decorate — because a per-place dock is also how places stop competing
> for the five slots the garden dock caps at. **Swipe down to go back up**, which is the direction
> every scroll already uses. `hollow.js` draws the room and knows nothing about the game, the same
> contract `flora.js` and `critters.js` follow, so `tools/hollow-spike.html` and the live screen draw
> from one source and the art cannot drift. **Feed and Decorate are honest about not existing.**
> Chambers, sideways paging and a second level are agreed but unbuilt. See
> [22-creatures.md](22-creatures.md).
>
> **Feeding shipped, and creatures now sleep, 2026-08-18.** Three foods bought with coins from
> **Feed** on the Hollow's dock, and each runs **two clocks**:
>
> | Food | Awake | Well fed | Cost |
> | --- | --- | --- | --- |
> | Clover Nibble | 4h | 1h | 1,500 |
> | Petal Cake | 8h | 4h | 5,000 |
> | Honeypot | 16h | 12h | 12,000 |
>
> **Awake is upkeep.** A creature whose awake clock runs out is **asleep** — shut eyes, Zs, no
> trait, no pair — and that is deliberately punishing, because it is the retention mechanic.
> **Well fed is a boost on top:** the creature works one star above itself.
>
> **The sleeping face is load-bearing, not decoration.** An upkeep timer is only survivable inside a
> cosy game because a pet that is visibly *asleep* is obviously reversible and says what to do about
> it, where a pet that silently stops working reads as something taken away. If a creature ever
> stops working without looking asleep, this reverts to the version the cosy pillar rejects. It is
> also what makes pairs going quiet acceptable — you can *see* why.
>
> **Punishment on one axis only:** a sleeping creature keeps its home, its slot, its place on
> screen, and **keeps leaving keepsakes**. **A star rather than a flat ×2** for the boost, because
> ×2 doubles the only trait in the `yield` pool (Luna, +9.6% → +19.2% average payout) and doubles
> the gem faucet (Thistle); a star is ×2.00 at one and ×1.20 at five. **Food never advances the star
> a creature was raised to** — that stays the bloom's job. Arrivals and pre-sleeping saves get 24h
> free. **If the upkeep ever reads as a chore, raise `awake` in `data.js`, never the prices.**
>
> **Only a *tending* creature can be asleep**, because a resting one cannot be fed — showing a
> player a problem they cannot act on is the one thing an upkeep mechanic must never do. Found by
> driving the new cheats. **Test it with the Developer tools:** *Creature food clocks* — Drain 1h /
> 4h / 24h, Send them to sleep, Feed everyone. 97 assertions.
>
> **Two things a real phone found, 2026-08-18.** The sleeping **Zs** are now solid white with **no
> outline**, smaller and slower, drifting in a zigzag with no scaling — outlined they read as hard
> graphic shapes stuck to a creature's head. That is a **deliberate exception** to the house
> outline rule, because a Z is a wisp rather than a thing in the world. And the **installed PWA**
> ended short of the home indicator; `.game` now carries `height: 100dvh` and the page background is
> meadow green rather than sky blue. See the traps below.
>
> **The loadout is now chosen in the room, 2026-08-18.** Pet and Loadout are **modes** on the
> Hollow's dock and a tap on a creature spends whichever is armed — sending it out or letting it
> rest, rather than opening the Almanac to do it. The Almanac's Habitat block keeps its toggles,
> because it is the only place an *unmet* creature can live. Nothing was added to the save. The
> change exposed a real bug: **a celebration centred on a hidden element fires from the top-left
> corner**, because `.in-hollow` hides `.stage` and `#garden` then measures 0×0. Fixed for the
> `pair` and `critter` handlers; the rule is in the traps below.

> **The Potting Bench landed as simulation, 2026-08-16.** A merge board fed by the garden, and
> **it is what replaces the Apothecary** — both turn garden output into goods the Market will want,
> and a timed craft bench is the worse version of merging. A harvest drops a chain item into a
> **basket**, the player places it, and **three of a kind that end up orthogonally connected merge**
> into the rung above. Six rungs, Petal through Flower Crown. **No surface exists yet** — Craft is
> still the third dock tab and the bench fills its basket invisibly. The panel and the dock swap were
> split off because `tools/sim-test.js` cannot see a `ui-*` file and landing both blind into a live
> game is how a working build breaks — and then the habitat direction overtook it, so **the bench is
> parked and undecided rather than in flight**. Feel was settled first in a standalone spike
> at `tools/merge-spike.html`, which is still the fastest way to try it. See
> [21-potting-bench.md](21-potting-bench.md).

> **`ui.js` was split, 2026-08-16.** 2,309 lines became five files along the three seams the docs
> had named for months: `ui-shared.js` (the scope they share), `ui-scenery.js`, `ui-sheet.js`,
> `ui-events.js`, and a ~700-line `ui.js` keeping the garden, the flower, the HUD, input, the frame
> loop and `boot()`. **The shared scope is passed as one global, `UI`**, and a call that crosses a
> file boundary is written `UI.something()` — the prefix is how you count one file's reach into
> another. **Pure motion**: no behaviour changed, and the one bug spotted on the way went into
> [11-known-issues.md](11-known-issues.md) instead of the diff. See
> [02-architecture.md](02-architecture.md#the-shared-ui-surface).

> **Packs now turn up in the garden, 2026-08-15.** A fourth tap roll drops a card pack onto a plot,
> where it waits to be tapped — the Lucky Ladybug beat, but tappable. **Always on with no badge
> behind it**, because it is the album's only in-game source. The garden is where packs turn up,
> never what decides their contents.

> **The card album shipped 2026-08-15.** 12 sets of 9 = 108 cards in one season, packs of three,
> and the reveal. **Independent of the garden by design** — no card is earned by growing anything.
> **Card art is a slot**: `{ icon, tint }` draws a placeholder from the icon vocabulary, `{ src }`
> would carry a real illustration, so finished art can arrive without touching code and without
> breaking the no-binary-assets rule. Remaining: the spawning-pack proc, dust, seasons, completion
> rewards. See [19-card-album.md](19-card-album.md).

> **Gems got a faucet fix and real sinks, 2026-08-15.** Drop chance now derives from grow time, so
> gems/hour is flat across the ladder and Daisy-spamming is no longer the best gem farm. Gems buy
> **calling a sky** (Rain 8, Thunderstorm 25 — which also pulls every unspent mutation roll into the
> window) and **skipping a timer** (`ceil(remaining/30)` gems, shown on the plant). The standing
> rule: **gems buy chances, choices and looks, never outcomes**, with the timer skip as the one
> deliberate exception. **Aurora and Wonderfall have no price and must not get one.** See
> [03-systems.md](03-systems.md#gems-where-they-come-from-and-what-they-buy).

> **Offline earnings shipped 2026-08-15.** Two upgradeable axes — Moonlight Tending (rate, 25% base)
> and Lantern Oil (duration, 4h base) — with a 10% trickle past the cap rather than a wall. Income is
> **earned, not granted**: only plots with an auto-planter count, and only if the drone exists to
> pick them, so an unautomated garden still earns nothing. **The cap is the retention lever** — 12h
> banks ~644K, 24h ~805K, so doubling an absence adds a quarter. If offline feels stingy, raise the
> rate, not the cap. `Dev.simulateAway(3/6/12/24)` winds the world back to test it. See
> [03-systems.md](03-systems.md#offline-earnings).

> **The welcome-back scene shipped 2026-08-15.** `Game.reconcile()` reports time away, what
> ripened, which weather passed and what it changed, and honey waiting — as an account, never a
> total. It stays shut when there is nothing to say. **Note:** the reconciliation bug once logged in
> [11-known-issues.md](11-known-issues.md) did not exist — mutations always resolved against the sky
> at their own scheduled moment. See [03-systems.md](03-systems.md#coming-back-after-time-away).
> **Automation still does not run while away**; the two-axis offline earnings chain is the next
> piece, and this scene is the surface it reports into.

> **Nightbell shipped 2026-08-15.** Moonflower pays ×2 harvested at night and ×0.5 by day — the
> verb that was cut from the first pass for want of a real clock, now a twenty-line change. Near
> neutral on average by design (≈0.98): it makes *when you pick it* the decision, not *how much it
> pays*. Deeproot moved to Jade Fern. Seventh effect category, rule intact.

> **Day cycle and dev tools, 2026-08-15.** The day cycle now keys to **epoch time**, so `isNight()`
> is a shared fact the simulation can answer and the **night-blooming verb is unblocked**. A
> development panel sits behind an unlabelled hit area beside the gem wallet — weather holds, forced
> mutations, armed rarities and gem drops, forced tap procs, fill/ripen, and grants. **Every cheat
> forces the real code path rather than faking the effect**, so the animation you inspect is the one
> players get. See [03-systems.md](03-systems.md#development-tools).

> **Weather and mutations shipped 2026-08-15.** The sky runs on wall-clock epoch time — the same
> weather for everyone at the same moment, and any past slot computable. Every plant rolls once for a
> mutation mid-growth: Dewkissed ×2, Gilded ×10, Prismatic ×25, Wonderstruck ×100, visible from the
> moment it lands until harvest. An adjacent Beacon raises the catch chance. Measured at **~20% of
> income, evenly across every seed** — the spec's original per-slot exposure model produced a 65×
> spread and was cut after the sim-test caught it. Mechanic in
> [03-systems.md](03-systems.md#weather-and-mutations), design and the retraction in
> [18-mutations-and-weather.md](18-mutations-and-weather.md).

> **Verbs shipped 2026-08-14.** Six of the nineteen seeds now do something to their two neighbours
> — Keeper (growth), Nurse (yield, at a cost to itself), Beacon (rarity), Lantern (gems), Deeproot
> (density), Spreader (free propagation). This is the first step of the build order below and the
> first real answer to "why plant *this* flower". Mechanic in
> [03-systems.md](03-systems.md#verbs-and-adjacency), numbers in
> [04-economy.md](04-economy.md#verb-tuning), playbook in [09-conventions.md](09-conventions.md).
> **Verbs stay off the yield curve** — `yield === cost × 1.4` still holds for every seed and a
> sim-test asserts it. **No two verbs may share an effect category**, also asserted.

> **A strategy pass on 2026-08-14 changed the direction of several systems.** Read
> [17-market-and-positioning.md](17-market-and-positioning.md) and the top entry in
> [10-decision-log.md](10-decision-log.md) before planning work. In short: the Apiary and Apothecary
> are being folded into garden adjacency and losing their dock tabs; the Almanac becomes themed card
> sets and is promoted to the spine of the game; per-plant verbs with adjacency effects — not the
> Market — are the answer to "why plant *this* flower"; and the repo was renamed
> `ghostgarden` → `gardenwonder`. Several decisions previously marked as locked were overturned
> deliberately, on the owner's instruction that nothing in this folder is set in stone.

The first slice of the meta-layer is also playable: **hives producing honey whose variety
follows what is planted, and an apothecary crafting flowers and honey into goods**. It lives behind
two dock tabs (Apiary, Craft), a deliberate throwaway until the world map exists.

**Navigation phase 1 is done**: the dock is `Upgrades · Apiary · Craft · Shop`. Badges was
renamed Upgrades; Decor lost its stat bonuses, became cosmetic, and moved into Shop with existing
owners refunded; Boosts left the dock entirely for a tap-to-activate tray in the status rail. Full
detail in [15-navigation-and-ia.md](15-navigation-and-ia.md).

**Progression phases 1–5 are done**: a quest strip sits between the HUD and the rail, reputation is
the only level track, seeds unlock on the bar, extra plots become buyable at levels 3 / 6 / 9
/ 12, tickets are gone — boosts are earned inventory activated from the rail — the combo
multiplies tap payout, and the Almanac is a collection track with lifetime discovery, best
rarity, and milestones at 5 / 10 / 15 / 19 species, and **every seed carries an endless Bloom Mastery ladder**
on its Almanac row paying +5% to that seed's yield per tier. Full detail in
[16-progression-and-quests.md](16-progression-and-quests.md). The world map is still queued. A
playtest pass after phase 1 made the bar track the quest and the pip ring track reputation,
replaced generic upgrade quests with buy-then-feel pairs (Combo Coil stays, so the later
multiplier work is not undone), and gated the empty-plot bob to first-plant onboarding.

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

**Goal is modest revenue in execution, but do not cap the ceiling.** A few thousand a month is the
near-term target and still drives scope and monetization tone. **Revised 2026-08-14:** the owner's
instruction is that the *vision* should not be small enough to hurt later — "I don't want our vision
of the project to be too small that it hurts us in the end." So ship incrementally, but keep every
number in data and remote-config-ready, and keep the economy prestige-compatible before a prestige
layer exists. Push back on scope creep in execution, not in architecture. For what "a few thousand a
month" means in players, see
[17-market-and-positioning.md](17-market-and-positioning.md#numbers-to-plan-against) — roughly
2,000–3,000 sustained DAU.

**The meta-layer shrank, 2026-08-14.** [12-meta-layer-design.md](12-meta-layer-design.md) still
describes the map and the order system, but **the Apiary and Apothecary are no longer regions** —
they fold into garden adjacency. Five regions is now three at most. The Market and the map survive.

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
The Apiary and Craft tabs are a prototype shortcut and are **now scheduled for removal** with the
adjacency rework — the interim dock is `Garden · Cards · Market · Shop` (phase 1.5 in that doc).

**Nothing in `docs/` is set in stone.** Stated by the owner 2026-08-14: anything in the game could be
done better, and a decision recorded here is a decision that was right at the time, not a
constraint. The strategy pass overturned several previously locked items. Continue to record
reasoning — but do not treat this file as a fence.

**Economy is currently a frozen port** from *Idle Garden Reborn* and contains known problems — see
below.

## Two things to know before touching the economy

**The economy needs a full retune, and it is deliberately deferred.** Every number is a placeholder,
and the owner has said the whole curve — possibly including *fewer* seeds, unlocked through card
packs — is open. It is not being done now because an economy is tuned against the systems that
consume it, and orders, cards and prestige do not exist yet. Retuning now means retuning twice. The
right moment is after the Market and card sets land.

**When it happens, the level curve is the dependency nobody expects.** Levels 2–17 currently pay out
**one seed each** — that is the entire reward structure of the progression ladder. Pull seeds back
and those levels have nothing to grant, so a seed-count change is also a progression rework. Scope it
as one piece rather than discovering it halfway through.

## The current task

**The habitat direction is live and six creatures deep.** Pip, Thistle, Bramble, Luna, Ember and
Bumble all work end to end: attraction, arrival, stars, traits, tending, eight named pairs, keepsakes
kept as mementos, and **the Hollow** — a room under the garden, reachable from a burrow mouth, where
they live. See [22-creatures.md](22-creatures.md).

The obvious next pieces, roughly in order:

1. ~~**Swap the loadout from inside the Hollow.**~~ **Done 2026-08-18.** Pet and Loadout are modes
   on the Hollow's dock; a tap on a creature spends whichever is armed.
2. ~~**Feed.**~~ **Done 2026-08-18.** Three coin-bought foods; a fed creature works one star above
   itself. See above.
3. **Decorate, and it is where mementos finally go.** Agreed with the owner 2026-08-18 and **not**
   built: mementos buy **decorations and skins for the Hollow**, with a piece costing keepsakes from
   *two different creatures*, so decorating requires roster breadth rather than depth. The art
   already has a memento cubby waiting for it, and it is the *item-as-key* device in
   [17-market-and-positioning.md](17-market-and-positioning.md). **This is the next piece.**
4. **More pairs, or a seventh creature.** Eight pairs of a possible fifteen. Any new trait must
   declare a `pool`, and the suite fails if the roster becomes all one kind of effect, if more than a
   third sits in `yield`, or if any creature ends up in fewer than two pairs.
5. **Chambers and sideways paging in the Hollow.** Agreed and unbuilt — but **hold it until the
   roster outgrows one room.** `Hollow.SPOTS` holds six positions and there are six creatures, so
   paging today means swiping from a full room to an empty one, which is the same failure the
   "one level first" rule already names for a second floor. It is the natural unit for decorating
   later, so build it behind a seventh creature rather than ahead of one.
6. **Flower breeding**, the second half of the direction. Cross two mature neighbours into a hybrid
   seed. It reuses the adjacency board and *generates* content rather than authoring it — but it
   changes the seed model, so it has a far bigger blast radius than creatures did.

**Two things are deliberately parked, not abandoned.**

**The Potting Bench** is built as simulation with **no surface at all** — Craft is still the third
dock tab and the bench fills its basket invisibly. Under the habitat frame it is optional. Decide
soon whether it gets a panel or gets deleted; dormant code nobody surfaces is what
[11-known-issues.md](11-known-issues.md) exists to prevent. If it ships, the remaining work is the
panel in `ui-sheet.js` (port the drag from `tools/merge-spike.html`, and watch the sheet's own
fling-to-dismiss fighting it) and the dock swap. **Do not remove the Craft quests when that tab
goes** — they were repointed at the bench and keep their ids on purpose, and they carry 98 of the
ladder's 777 reputation ([21-potting-bench.md](21-potting-bench.md#quests)).

**The card album vs the creature roster is an open decision.** There are now two collection systems,
and splitting Completion across two unrelated albums halves the pull of both. Creatures are coupled
to the garden and answer "why plant this flower"; cards are deliberately independent. Settle it
deliberately rather than letting it drift.

The Market as **customers who walk up to the garden fence** and the **world map** both remain good
and both remain unbuilt.

**The long-running open question — *does the garden's contents start mattering* — has an answer, and
it is creatures.** Bloom Mastery could not deliver it (a percentage of an undifferentiated thing is
still undifferentiated), and orders make a flower *instrumentally* wanted, which is a quota rather
than desire. Verbs and adjacency were the previous best answer and are still good. But **Pip comes
for bluebells and nothing else**, and raising a creature costs escalating harvests of *its own*
bloom — which is also the first real answer to **"why would I ever plant a Daisy again."**

The diagnosis that started all of it still stands as the thing to keep escaping: **every seed yields
exactly 1.4× cost at Common across all nineteen tiers**, differing only in throughput. Charming,
distinct-looking producers that all do the same thing is the AdVenture Capitalist decay pattern; see
[17-market-and-positioning.md](17-market-and-positioning.md).

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
   procs (above) are texture added toward this question. Bloom Mastery was expected to answer it
   and does not — see "The current task". The question stands: does the garden's *contents* start
   mattering — do you plant lavender because you want lavender honey? Content decisions wait on
   that answer, and the honest place to get it is the Market.
8. ~~**Progression and quests — specified, current task.**~~ **All five phases done.** See above
    and [16-progression-and-quests.md](16-progression-and-quests.md). The map stays ahead of this
    only in the sense that a map full of places is worthless if nothing tells you why you're
    going anywhere — that reason now exists.
9. ~~**Bloom Mastery**~~ — **done 2026-08-14.** Phase 5 of
   [16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery). Per-seed
   endless ladders paying a permanent per-seed yield bonus, one gem every fifth tier.
10. **The Market** — see [13-order-system.md](13-order-system.md). Still valuable as the goal
    generator, the reputation source and the entire liveops surface. **No longer load-bearing for
    "why this flower"** — that burden moved to per-plant verbs. Skipping is now specified as free.
11. **The world map** — navigation phase 2, queued but paused. Unblocks everything else in the
   meta-layer.
12. **Tune the economy for real.** Every number today is a placeholder. Also worth a look: the three
    new proc badges were repriced once (with Sprinklers) but *not* re-cut when their trigger rates
    were cut again the next day — see [04-economy.md](04-economy.md) for the reasoning and a
    deliberate open question about whether that needs revisiting.
13. **Fix the known economy bugs** before building content on top of them.

### The build order agreed 2026-08-14

This supersedes the ordering above where they conflict. Reasoning in
[10-decision-log.md](10-decision-log.md).

1. ~~**Per-plant verbs and adjacency**~~ — **done 2026-08-14.** Six seeds carry a verb; the other
   thirteen stay plain yield tiers on purpose. Expanding the set is cheap when the mechanic proves
   out — it is one `DATA.verbs` entry, one `verb:` field and a consumer.
2. ~~**Mutations and variants**~~ — **built 2026-08-15**, steps 1–4 of
   [18-mutations-and-weather.md](18-mutations-and-weather.md): epoch-clock weather, four mutation
   tiers, Beacon stacking, visuals. Measured at ~20% of income, evenly across seeds. **Steps 5–6
   remain** — offline reconciliation and card generation.
   **Mutations do *not* feed the card album** — an earlier claim that they did is retracted; see
   [19-card-album.md](19-card-album.md).
3. **Named synergy pairs** — one data row and a name each; companion planting writes itself.
4. **Fold the Apiary and Apothecary into adjacency**, and move the dock to
   `Garden · Cards · Market · Shop` ([15-navigation-and-ia.md](15-navigation-and-ia.md) phase 1.5).
5. **Item-as-key, mementos, hidden blooms, and companion flavour text** — ~150 lines of writing is
   the cheapest differentiator available and the talking flower is a ready-made delivery vehicle.
6. ~~**Two-axis offline earnings (rate × duration)**~~ — **done 2026-08-15**, along with the
   welcome-back scene it reports into. Both axes are upgradeable and clamped, the cap is stated
   openly, and income only accrues from automation the player actually owns.
7. ~~**The card album**~~ — **built 2026-08-15**, minus the spawning proc, dust, seasons and
   completion rewards. [19-card-album.md](19-card-album.md). A **parallel meta, independent of the
   garden**: packs from quests, levels, dailies, the shop and a random spawn on a plant; ~12 sets of
   9 per themed season, with its own art and story. Model a card as an owned instance with an id, not
   a boolean, so dust and any future trading stay possible. **Paid randomized packs are loot boxes —
   read the warning in that doc before touching monetization.** Separate from the species Almanac in
   [16-progression-and-quests.md](16-progression-and-quests.md), which stays coupled to the garden.
8. **The Market.**
9. ~~**Gem sinks**~~ — **done 2026-08-15**, along with the gem-faucet inversion. Cosmetic breadth
   is the remaining piece: a fixed catalogue always gets bought out, so gems need either escalating
   prices or a growing list. Card packs are the eventual infinite sink.
10. **Seasonal turnover** (prestige) — designed now, built later. Never call it a reset.

Not on the list, deliberately: trading, battle pass, live events, PWA/service worker, world map,
merge.

## Known problems worth knowing immediately

Full list in [11-known-issues.md](11-known-issues.md). The two that affect design decisions:

- ~~**Endgame seeds have lower gem chances than a Daisy.**~~ **Fixed 2026-08-15.** Gem chance is now
  derived from grow time, so gems per hour is flat across all nineteen seeds and gem income tracks
  time played rather than seed choice.
- **Cheat buttons ship to players — on purpose.** Settings has "Grant 50 Gems", "Grant 1,000,000
  Gold", and "Summon a Wonder Effect" with no confirmation, live on the public site. **Decided
  2026-08-14: leave them.** The audience is friends, their sessions are not clean data, and the game
  has no analytics either way. Revisit before any real external audience; don't re-raise it before
  then.

That inversion was inherited from the frozen economy port; it is fixed. What remains from the port is
the Orchid throughput dip and the identical Aurora/Celestial rates.

## Traps in this codebase

Things that cost real time to discover. None are visible from a casual read.

**Check `git branch -r` before starting a specified phase.** Phase 4 was built twice, in parallel,
by two agents that did not know about each other — competently and incompatibly, with different
state shapes for the same feature. Cloud agents push to `cursor/*` branches and may already have
merged to `main` while your local tree still looks current. `git fetch` first.

**An upkeep state the player cannot clear is a bug wearing a mechanic.** Sleeping applies only to
*tending* creatures, because a resting one cannot be fed and would have shown as asleep forever with
no way out. Anything future that switches off gets the same check: *and can they turn it back on
from here?*

**`.game` needs `height: 100dvh`, not just `inset: 0`.** It carries a `transform` for the screen
shake, which makes it a containing block — and an installed PWA on iOS then resolves `inset: 0`
against a viewport that excludes the bottom safe area, ending the game short of the home indicator
with a band of page background under the dock. The page background is also the **meadow green**
rather than the sky, so anything left uncovered is invisible against the lawn instead of a band of
the wrong colour. Neither is reproducible in the desktop preview, which reports `.game` covering
exactly.

**A visual state must never depend on a keyframe having run.** Already recorded for the pack badge,
and it caught the sleeping Zs anyway — they started at `opacity: 0` and faded in, so they were
invisible in any tab whose animation clock was not advancing. Visibility belongs to the base style;
motion is the flourish on top. The corollary found at the same time: a *stroked* glyph a few pixels
wide is a hairline that disappears against a dark background, and the house style of a flat fill
inside one thick outline exists partly for this reason.

**Rounding hours and minutes separately renders 23h 59m 59s as "23h 60m".** Round to whole minutes
first, then split. Bit the feed panel's span formatter.

**`state.critters[id].fed` is the keepsake clock, not whether a creature has been fed.** It records
when the creature last handed a keepsake over, and it has meant that since creatures shipped. Food
is `fedUntil`, a separate absolute timestamp. Writing food into `fed` silently resets every keepsake
timer in the game, and nothing reports it.

**`tools/sim-test.js` keeps an explicit `GLOBALS` whitelist, and a new `data.js` constant must join
it.** Miss it and the constant reads `undefined` inside `game.js`, which throws inside `load()`,
which is caught — so the save silently resets and the failure surfaces as some unrelated test
several hundred assertions away. Cost a debugging pass on `CREATURE_FOOD`.

**A celebration centred on a hidden element fires from the top-left corner.** `.in-hollow` sets
`display:none` on `.stage`, so `#garden` measures a 0×0 rect and `FX.centerOf()` returns the origin
— no error, no warning, just confetti in the corner. Anything in `ui-events.js` that celebrates
something the player can cause from more than one screen has to centre on the screen that is
actually up; the `pair` and `critter` handlers go through `critterStage()` for exactly this. Found
by forming Nightbloom from inside the Hollow and looking at the picture.

**The UI is now six files sharing one global, and the sharing rule is load-order-sensitive.** A
`ui-*` file may destructure the `ui-shared.js` primitives at the top (`const { $, S, el, fmt } =
UI;`) because those exist as soon as `UI` does. It may **not** destructure anything another UI file
attaches — `UI.toast`, `UI.openSheet`, `UI.plotEls` — because that file may not have loaded yet;
call those through `UI.` at call time. `ui.js` publishes its half at the very bottom, just before
`boot()`. **`UI.flowerBtn` is a function, not the node**, because `buildGarden()` replaces the
flower on every plot expansion.

**`audio.js` already has a global-looking `RECIPES`.** It is a table of *sound* recipes, declared
inside the `Sound` IIFE. Crafting recipes are therefore named `CRAFT_RECIPES`. Shadowing would
technically work, but do not reintroduce the collision.

**`syncAfford()` in `ui-sheet.js` assumes every `[data-buy]` is one of three kinds.** Its final `else`
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
**Badges no longer need a per-key line** (fixed 2026-08-15): `load()` backfills every key in
`defaultState().upgrades`, so declaring the badge there is enough. The hand-maintained list it
replaced had already drifted and was missing all seven v1 badges. `state.tap` doesn't have this
problem — it's merged with `Object.assign(d.tap, parsed.tap || {})`, so new fields on it just
inherit the default. **The trap still applies to anything not covered by that loop**: a new
per-cell grid field (e.g. `luckyBug`) needs its own backfill over `state.grid`, and a new
`state.seen` flag needs its own line — see [07-save-data.md](07-save-data.md).

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

**`state.discovered` is not `state.flowers`.** Flowers are spendable inventory; discovered is a
lifetime harvest count that never decrements. A quest or milestone that reads the pantry will
go backwards when the player crafts. Backfill on load uses remaining flowers as a lower bound,
which undercounts old saves on purpose. `state.rarityCounts` is the same kind of record for
mastery and has the same rule.

**Mastery silently perturbs any sim-test that measures a harvest multiplier.** It multiplies
harvest payout and climbs as a run proceeds, so a test averaging thousands of harvests to isolate
some *other* multiplier has to reset the ladder first — and resetting `state.mastery` alone is not
enough, because the ladder reads `state.discovered`, so the next run restarts tier 1 with
thousands of harvests already banked and jumps several tiers on its first harvest. `clearMastery()`
in the suite clears all three. This broke the pollination and decor ratio tests the moment mastery
landed, and the failure looks like a balance regression rather than a test artifact.

**`.seed-row` is the plant picker's button, not a generic row.** Reusing it for the Almanac wrapped
every row in a card treatment and collapsed the columns onto one overflowing line. The Almanac's
classes are `.almanac-row*`. Check for an existing class before naming a new one — `style.css` is
50 KB and the collision is invisible until you screenshot it.

**Never let an animation be the thing that makes an interactive element exist.** The pack badge
started at `scale(0)` and depended on a keyframe to appear, which makes it uncollectable anywhere the
animation does not run. Visibility belongs to `display`; animation is a flourish on top.

**New per-cell grid fields keep catching out `clearGarden()` in the suite.** `mutation`, `mutateAt`
and `packDrop` have each leaked between tests. Add the field there at the same time you add it to
`defaultState()` and the `load()` backfill.

**A plant's mutation roll fires once and only once.** `plant()` schedules `cell.mutateAt` inside the
grow window; `rollMutations()` fires it and zeroes it. Anything writing a grid cell by hand — a test
fixture, a migration, a future auto-planter — must set `mutateAt` too, or that plant silently never
rolls. Both `mutation` and `mutateAt` need their own backfill loop in `load()`, beside `luckyBug`.

**Weather is a pure function of epoch time, so never store it.** `weatherForSlot(n)` is a hash of the
slot number. Caching or persisting the current weather means the design has been misunderstood — the
point is that any past or future slot is computable on demand.

**Offline income is a closed-form rate, not a replayed simulation.** `passiveIncomeRate()` values
each auto-planted plot at what its planter would grow and caps the total by the drone's cadence. It
is O(1) in the length of the absence, deliberately — do not "improve" it by stepping the simulation
forward across a 24-hour gap.

**Verb effects must be read before the plot is cleared.** `harvest()` captures the neighbourhood —
Beacon weight, Lantern gem multiplier, the payout multiplier — at the top, because clearing the plot
changes what its neighbours see. A verb consumer added after the `state.grid[idx] = {...}` line will
silently read the wrong garden.

**A growth verb needs two code paths, not one.** Growth time is baked in at plant time, so a plot
planted next to an existing Keeper gets the bonus for free — but a Keeper planted *afterwards* would
do nothing without `quickenNeighbours()`. Any future growth-affecting verb needs the same pair, or it
only works when the player happens to plant in the right order.

**Sim-tests that touch a harvest must pin `Math.random`.** Two were flaky and both are fixed —
together they failed 4 runs in 50. Harvest pays rarity, gems, mastery tiers and Wonder rolls from the
same call, so any assertion on a payout or a currency delta is flaky until the RNG is pinned.
**Prefer an exact assertion on one harvest to a tolerance on a sampled mean** — and if you must loop,
call `clearMastery()`, because the ladder climbs as the loop runs and you end up measuring two things
at once. See [11-known-issues.md](11-known-issues.md).

## Checking your work

```bash
node tools/sim-test.js          # 815 assertions over the simulation layer
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
> Your task is in `docs/HANDOFF.md`. All five progression phases, including Bloom Mastery, are
> built — see `docs/16-progression-and-quests.md`. Do not build the world map.
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

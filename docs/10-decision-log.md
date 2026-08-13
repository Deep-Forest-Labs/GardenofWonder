# Decision Log

Why things are the way they are. Append new entries at the top with a date. Record the reasoning,
not the diff — git already has the diff.

---

## 2026-08-12 — Quest strip measures the quest; upgrades get a buy-then-feel tutorial

**Decision.** Five playtest notes after phase 1 shipped in-session, all taken.

**The bar is the quest, the ring is reputation.** The strip printed `Tap 25 times · 0 / 25` next
to a meter that was filling from garden reputation. Two quantities, one visual, and the one you
read is the one with the numbers. The bar now tracks `progress / qty` of the quest on the strip.
Reputation moved to a conic ring around the level pip — the same pattern the booster chips and
combo ring already use. The task name sits on top of the thicker fill; a chip at the right shows
the reputation reward, because "Claim" with no number is a blank payoff.

**Buy, then feel.** Generic "Buy a badge" / "Buy 3 badges" is gone (the dock says Upgrades). Each
early tap upgrade is now a pair: buy Power Punch then tap 50 times, buy Quick Grip then hold-tap
20 times, buy Lucky Charm then land a crit, buy Star Strike (the crit quest already showed the
spike), buy Combo Coil then reach combo 55. Combo Coil stays in even though the multiplier is
still phase 3 — undoing the tutorial later would cost more than leaving a buy-and-fill-the-ring
quest in. Hold ticks are a new `hold` track on `tapFlower(true)`; combo quests set progress to the
current combo rather than counting taps.

**The plant prompt.** `S.seen.plot` only flipped in the seed-sheet click handler, so a harvester
plant or an old save left "Plant a seed here" hopping forever. It now flips on the `plant` event,
and empty-plot bobbing is gated behind `#game.onboard` so it stops after the first plant.

---

## 2026-08-12 — Phase 1 of progression: the ladder pays to Eternal, plots are level-gated purchases

**Decision.** Built phase 1 of [16-progression-and-quests.md](16-progression-and-quests.md). Two
calls on top of the spec, both about not turning the new bar into a punishment.

**The ladder has to actually reach the last seed.** Twenty-four quests paying 5→25 sum to ~360
reputation, which is level 10. Eternal Crown unlocks at 17 (760). Leaving the back half of the
seed list on a daily-login treadmill is worse than a slightly fatter late-game claim. So the
authored ladder is 29 rows, payouts 5→50, totaling 781 — it lands on level 17. Levels 18–20 are
the "no new seeds until the Market" tail, fed by the daily. Six extra long-tail harvest/plant/honey
rows were cheaper than compressing the seed schedule.

**Plots are not a quest.** "Unlock a plot" as an objective would sit on the strip for hours while
the player saved 1,900 coins, and the game already starts with four plots — "unlock a second plot"
was copy from a different game. Extra plots become *buyable* at levels 3, 6, 9 and 12, then cost
the same gold they always did. Hours-to-days to open the whole garden, not weeks. Land Deed cannot
skip a plot the level has not opened, so it cannot undermine the gate; at level 1 it simply reads
Maxed.

**Grandfathering is broader than "what can you afford right now."** A Moonflower in the ground and
80 coins would otherwise be knocked back to level 1 and could not be replanted. Migration takes the
max of affordable seeds, planted seeds, flowers in the bag, and affordable locked plots, and never
re-locks a plot that is already open.

Recipes stay ungated. There are three of them and they are the craft tutorial; locking them
recreates the seed-migration problem for no pacing gain. Level 19 grants a Butterfly Shrine
instead of "a recipe."

---

## 2026-08-12 — Progression pass specified: reputation is the only track, and it is what "level" means

**Decision.** The next project is progression, not the world map. Specified in
[16-progression-and-quests.md](16-progression-and-quests.md): a quest ladder feeding a level bar,
tickets retired, the combo made to actually pay, and the Almanac turned into a completion goal.

**The one that matters: no XP.** The obvious build is a level bar backed by its own experience
number. That would mean two progression tracks, because reputation already exists in the locked
design as the thing gating land, order tiers and regions
([13-order-system.md](13-order-system.md)). Two tracks means two curves to tune, two sets of
rewards to keep from colliding, and an eventual migration when one of them wins. So "level" is a
display of reputation and nothing else. Quests pay reputation; when the Market ships, orders pay
into the same number and the bar keeps working with no changes. The authored curve
(`10 + 5 × (level − 1)` per level) was chosen to land level 4 / 8 / 12 / 20 on the four order-tier
thresholds already written down, so the two systems agree by construction rather than by later
reconciliation.

**Tickets are deleted rather than moved.** The request was to move the ticket power-up chips into
the Shop tab to clear space at the top of the screen. That would have contradicted two decisions
already made — the boost tray shows what you *hold*, not what you can buy, and the Shop is the
only place real money appears ([15-navigation-and-ia.md](15-navigation-and-ia.md)). A third
currency that exists solely to buy four boosts from a rail chip is not worth a wallet slot, a drop
type and a denial reason. Boosts become earned inventory from quests and level-ups; tickets convert
to gems once and the field stays only so old saves parse. Clearing the rail was the actual goal,
and retiring the currency achieves it without putting power-ups behind a price tag.

**Content gating is the reward, and migration is the risk.** Levels grant seeds — three at the
start, one per level to nineteen — because pacing content is the cheapest way to make progress feel
like progress, and because it gives the bar something to promise. The danger is that gating an
already-open game takes something away from existing saves. The spec makes the grandfather
migration mandatory and sim-tested: no player loses a seed they could already plant.

**Why the combo was folded in.** It isn't progression, but it is a filled meter on the main screen
that multiplies nothing, and a 2,500-coin badge that raises its cap. Fixing it is a few lines, and
leaving a visibly broken promise on screen while adding a new one next to it would undercut the
whole pass. The multiplier scales with absolute combo rather than the fraction of the cap,
specifically so that Combo Coil raises the ceiling instead of making the meter slower to fill.

---

## 2026-08-05/06 — Paused navigation phase 2; spent the cycle on the core tap-and-plant loop instead

**Decision.** Immediately after navigation phase 1 shipped, the plan on paper was to move straight
to phase 2 (the world map, [15-navigation-and-ia.md](15-navigation-and-ia.md)). Instead the owner
redirected to core gameplay: hold-to-tap with a Quick Grip speed badge, a Balanced seed-sort option,
three new tap-triggered "garden proc" badges (Rain Dance, Bee Swarm, Lucky Ladybug), a Sprinklers
rebalance, and — the next day — cutting those three procs' trigger rates by 5× and giving each one
a dedicated animation. None of this touches navigation; the dock is still exactly
`Upgrades · Apiary · Craft · Shop`.

**Why this isn't scope drift.** The existing roadmap (see "What comes after" in
[HANDOFF.md](HANDOFF.md)) already listed *"play the loop and judge it"* ahead of the world map —
the map was only "current" because it was next in the doc, not because judging the loop was done.
Everything built this cycle is squarely inside "does tapping and planting feel good," which is a
prerequisite for the map mattering at all: a bigger, riskier structural feature is a bad place to
find out the core loop needed more texture first.

**Net effect on the loop.** Tapping now has three independent things it can be doing at once beyond
the base payout: a slow build toward a faster hold cadence (Quick Grip), a small but real chance of
a rare, celebratory proc firing (Rain Dance / Bee Swarm / Lucky Ladybug, each now tuned to feel
sporadic rather than routine), and planting decisions now have a "balanced" option that reasons
across the whole garden instead of one plot at a time. The world map remains queued and unblocked —
picking it back up is a decision for a future session, not a change to the spec.

---

## 2026-08-06 — Tap-triggered garden procs (Rain Dance, Bee Swarm, Lucky Ladybug): rate cut to 0.2%/level, dedicated animations added

**Decision.** One day after shipping the three tap-triggered procs at `level × 1%`, playtesting
feedback was that they fired far too often to feel like the "slot machine" bonus they were designed
to be. Cut the shared per-level rate from `1%` to `0.2%` (a fifth of the old rate), keeping each
badge's existing level count so its cap shrinks proportionally:

| Badge | Old cap | New cap | Levels (unchanged) |
| --- | --- | --- | --- |
| Rain Dance | 10% | 2% | 10 |
| Bee Swarm | 5% | 1% | 5 |
| Lucky Ladybug | 8% | 1.6% | 8 |

The rate lives in one place now — `PROC_CHANCE_PER_LEVEL` in `game.js` — instead of being repeated
as a literal `0.01` in each `rollXxx()` function, so the next tuning pass is a one-line change.

Each proc also got a purpose-built animation in `ui.js` (`triggerRainFX`, `triggerBeeFX`,
`triggerLadybugFX`), because at this rarity the trigger *has* to carry the "you just won something"
feeling — the numbers involved are small and infrequent by design, so the moment has to do the
emotional work instead. See [03-systems.md](03-systems.md#tap-triggered-garden-procs) for what each
animation actually does.

**Why cut the rate instead of, say, keeping 1% but making the effect smaller.** The brief was
explicit: "I want things to feel more sporadic and volatile... super rare, so the idea of levelling
it up is still a very, very small percentage." That's a statement about *frequency*, not
*magnitude* — Rain Dance's 3s shave and Bee Swarm's honey jar are already appropriately small
per-trigger. Shrinking the payout instead of the rate would have made triggers feel *worse* when
they landed without making them any rarer, which is the opposite of what was asked for.

**Why keep the same level counts instead of also cutting them.** Fewer levels (e.g. 2 levels of 1%
each for Rain Dance) would hit the same 2% cap but make the badge feel like barely an upgrade path
at all — buy it twice and you're done. Keeping 10/5/8 levels at 0.2%/level each means levelling still
takes the same number of purchases as before; each one just nudges the odds by a sliver. That's the
point: the climb is deliberately unexciting so all the excitement is reserved for the trigger itself.

**Why the prices weren't cut along with the rate.** Buying a level now returns a fifth of the old
expected value for the same coin cost, which is a real economic step backward. That's accepted
deliberately, at least for now — these three badges are sold as "a chance at a fun moment," not "a
guaranteed number," so judging them purely on coins-per-expected-percent misses the point of what
they're for (see [04-economy.md](04-economy.md)). If they end up feeling like a trap purchase in
practice, cutting their price is the next lever to pull — cutting the rate was the priority for now,
since it's what makes the feature good in the first place.

**Why persistent visuals for Lucky Ladybug but not the other two.** Rain Dance and Bee Swarm are
one-shot: the effect fully resolves the instant it fires, so a single flourish (falling rain,
a visiting bee) tells the whole story. Lucky Ladybug's payoff doesn't land until a *later* harvest,
so without something on the plot in the meantime, the eventual "lucky!" harvest would feel
disconnected from its cause. A small badge sprite that sits on the plot from trigger to harvest
(synced every frame off `cell.luckyBug`, same pattern as the existing "Auto" tag) closes that gap
at the cost of one more piece of UI state to keep in sync.

**Why every FX helper rebuilds its DOM/animation state from scratch instead of reusing nodes.**
Quick Grip can push tap cadence down to 180ms, so in principle the same plot could get re-targeted
by the same proc well within its own ~1s animation lifetime. Toggling a class on a long-lived node
risks a retrigger looking like nothing happened (the browser won't restart a still-running
animation just because the same class got re-applied). Removing and recreating the ephemeral pieces
(cloud, drops, bee sprite) every trigger guarantees a fresh animation every time, at the cost of a
little extra DOM churn that's irrelevant at this scale.

---

## 2026-08-05 — Three tap-triggered garden procs added; Sprinklers repriced and recapped

**Decision.** Added three new badges that each add an independent, per-tap "slot machine" roll
(manual tap or hold-tick, same as every other tap effect):

- **Rain Dance** — `level × 1%`, caps at 10% (10 levels). Instantly shaves 3s off a random
  growing plot's remaining grow time. An "instant shave," not a timed buff — it applies once and
  is done, rather than granting a temporary rate boost.
- **Bee Swarm** — `level × 1%`, caps at 5% (5 levels). Adds one jar of whatever's currently
  blooming to a random hive with room, reusing the same "variety fixed at production" rule the
  Apiary already uses for natural honey (see [03-systems.md](03-systems.md)).
- **Lucky Ladybug** — `level × 1%`, caps at 8% (8 levels). Flags a random growing plot; its next
  harvest gets a +1.0 bump to `rollRarity`'s weight bonus (roughly doubling non-common odds for
  that one harvest), then the flag clears.

Alongside this, **Sprinklers (`autoWater`) was rebalanced**: effect per level dropped from an
uncapped 5% to 1%, now hard-capped at 10 levels (10% total), and its price curve was cut from
2,500 base / 2.2 scale to 400 base / 1.7 scale.

**Why independent per-tap rolls, not a shared pool.** The designer's brief was explicit: it
should feel like a slot machine — always a live chance of something firing, not a single shared
roll that one badge "wins" over another. Each badge is checked separately in `tapFlower()`, so on
a lucky tap more than one can fire at once.

**Why "instant shave" over a timed buff for Rain Dance.** A timed growth-speed window (e.g. "+50%
speed for 3s") stacks unpredictably with everything else touching `growModifier`, and its value
depends on how much is currently planted — a dead multiplier if nothing's growing at that moment.
An instant, flat time reduction is worth the same whether it lands on a nearly-ready plot or one
that just went in the ground, and it reads clearly on a single plot rather than as a global rate
change.

**Why duds do nothing instead of rerolling or refunding.** If there's no eligible target (no
growing plot, no open hive), the trigger is simply wasted — no compensation, no guaranteed retry.
A slot machine that quietly fixes itself when the reels don't line up stops being an honest one,
and it would let the badges' *displayed* percentage silently understate their real value.

**Why Sprinklers had to be repriced, not just recapped.** The old price curve was built for an
effect that was ostensibly uncapped (in practice bounded by the shared 0.3 growth floor around
level 14, at a cost of roughly 2.4M coins). Keeping that curve while cutting the per-level effect
to a fifth and hard-capping at level 10 would have made the full 10% cost ~5.5M coins for a much
smaller payoff than before — a badge nobody would rationally buy past level 2. Since the new
Sprinklers is a smaller, earlier-game lever by design, it needed a smaller, earlier-game price to
match. New total cost to fully max: ~114K coins, in line with Rain Dance (~111K) and Lucky Ladybug
(~150K) — all three now feel like comparable mid-game investments rather than one being priced for
a payout curve it no longer has.

**Why the 0.3 growth floor stayed in the code.** It's now effectively unreachable with the new
caps (Seed Rush's +30% plus a maxed Sprinkler Network's +10% only reaches 0.6), but it costs
nothing to leave as a defensive backstop against future boosts stacking unexpectedly, and removing
it would be scope with no player-facing benefit.

## 2026-08-05 — Seed picker gained a "Balanced" sort

**Decision.** Added a fourth seed-sort tab, `balanced`, next to tier/cheapest/priciest. It sorts by
`abs(cost − credits/unlockedPlots)` — closest first — instead of raw price. No economy change: it
only reorders the same list `costAsc`/`costDesc` already draw from.

**Why.** The existing sorts answer "what's cheapest/priciest," which pushes toward either
under-spending or dumping your whole balance into one plot. Balanced answers "what's the best I
could plant in *every* plot at once," which is closer to what a player actually wants when working
a full garden rather than optimizing one cell in isolation.

## 2026-08-05 — Hold-to-tap added as an input method, not a new payout path

**Decision.** Holding the flower now repeats an ordinary tap on a timer instead of requiring
repeated presses. The Quick Grip badge shortens that timer, 900ms → 180ms floor over 12 levels.
Every roll a manual tap makes (crit, gem, ticket, Wonder) still happens per hold-tick, unchanged —
holding is a different way to trigger `tapFlower()`, not a different, better version of it.

**Why there's a hard floor instead of an uncapped upgrade.** The original ask was an upgrade line
that shrinks the hold interval "by milliseconds," which taken to its limit is an auto-tap exploit:
enough levels and holding down a button produces unbounded credits per second, tied to
implementation details like timer resolution rather than any deliberate rate. The floor (180ms,
`HOLD_INTERVAL_MIN` in `game.js`) is picked to land at roughly a fast manual tap's cadence, so a
maxed Quick Grip is *convenient*, never *better than playing*. This was a deliberate design
constraint agreed with the designer before implementation, not a default I picked unilaterally.

**Why it starts slower than active tapping.** A day-one hold at manual-tap speed would make the
button-mash feel (crit chance, combo ring, haptics) pointless immediately — nobody taps once
holding is free and equally fast. Starting at 900ms means holding is initially a strict comfort
trade against active tapping, and only converges toward parity as the player invests in it.

---

## 2026-08-05 — Navigation phase 1 built: Upgrades, cosmetic decor, boost tray

**Decision.** Built phase 1 of [15-navigation-and-ia.md](15-navigation-and-ia.md). Badges renamed
to Upgrades (no content change — it already held badges and the eight harvesters). Decor's stat
role was deleted outright rather than merged into Upgrades; the items themselves became cosmetic
and moved to a new Shop tab. Boosters lost their dock tab and sheet panel entirely; they now surface
as chips in the status rail — a countdown while active, a tap-to-buy-and-activate chip while
affordable and idle, nothing otherwise. Dock is now `Upgrades · Apiary · Craft · Shop`. Existing
decor owners are refunded at purchase price on first load, via a version-gated migration (save
schema 2 → 3).

**Why decor was deleted rather than merged.** The doc's "merge Badges and Decor into one Upgrades
surface" language describes fixing the duplication, not literally combining both cards into one
list. Badges already covered every stat decor touched; decor's only remaining job is to be an
honest cosmetic sink.

**Why boosts kept ticket-purchase instead of becoming reward-only immediately.** The doc's full
vision sources boosts from order rewards, rewarded video and drops — none of which exist yet (no
order system, no ad mediation, no drop mechanic). Cutting the only working acquisition path with
nothing to replace it would have made every booster dead content and stranded the ticket currency,
which exists almost entirely to buy them. Keeping ticket-purchase, just relocated off the dock and
into a tap-to-activate tray, satisfies the navigational goal (off the dock, contextual, one tap)
without inventing a new drop economy inside what was scoped as a small, safe, self-contained
change. Retiring tickets and wiring up real reward sources is its own balance project, deliberately
deferred — flagged to the designer before building, who confirmed this reading.

**Why the refund keeps the item rather than deleting it.** The alternative — stripping decor
entirely from a save — would have been a bigger surprise for the same generosity budget. Keeping it
as a cosmetic record and adding the refund on top costs nothing extra and reads as "this got better
for you," not "this got taken away."

**Why schema version was bumped for the first time.** `version` had been set unconditionally since
its introduction, reserved for exactly this kind of change. Decor's meaning changed (stat-carrying
→ cosmetic), which is what the save-data doc's guidance calls for a version bump over. See the
worked example in [07-save-data.md](07-save-data.md).

---

## 2026-08-05 — Navigation: places on the map, systems in the dock

**Decision.** The dock holds `World · Orders · Shop · Almanac · Events`. Regions are locations on
the map, never tabs. Upgrades become contextual to the object they upgrade. Decor becomes purely
cosmetic. Boosts become power-ups sourced from rewards rather than a shop. Full specification and
build order in [15-navigation-and-ia.md](15-navigation-and-ia.md).

**What prompted it.** The dock is labeled `aria-label="Shops"`, which is an accurate description of
the problem: every tab was a checkout, so no tab had a distinct job. Badges and Decor turned out to
be the same system twice — four decor items and four badges modifying the same four stats, differing
only in the currency paid.

**Why regions must not be tabs.** The locked design is a contiguous map that grows outward. Tabs and
a map are competing navigation models: if regions stay tabs the map becomes decoration, the visible
sprawl that was supposed to be the reward stops being load-bearing, and every new region costs a
dock slot out of five. The Apiary and Craft tabs shipped as an explicit prototype shortcut.

**Why upgrades become contextual.** A flat list of eight nearly identical plot harvesters is a
symptom of a global menu doing per-object work. Attaching upgrades to the object is the
Township/Hay Day pattern and is the only reason the dock can stay at five slots as regions multiply.
Phased last because a flat list is genuinely fine while there is one region.

**Why decor loses its stats rather than badges being deleted.** Cosmetics are a clean gem sink and
an expression layer that supports the monetization plan; a second stat menu supports nothing.
Existing owners get refunded at purchase price, because exact conversion into badge levels is not
possible — Crystal Fountain's multiplicative `tapYield` has no equivalent in Power Punch's flat +1.

**Why boosts leave the dock.** They are power-ups, and players do not shop for power-ups — in Coin
Master they fall out of the slot machine. Moving them to a contextual tray also places the
rewarded-video prompt where a player actually wants a boost, which is worth more than a menu entry.
This is also the natural moment to retire tickets, since tickets exist almost entirely to buy
boosts.

**Considered and rejected: a "Manage" mega-tab** holding upgrades, decor and boosts behind
sub-tabs. Least disruptive to the current code, but it renames the junk drawer instead of emptying
it. Also rejected: making the order board the home screen, which demotes the garden — in a cozy
game the pleasure is the place, not the checklist.

---

## 2026-08-05 — Garden ↔ Apiary ↔ Apothecary prototyped

**Built** the smallest closed version of the resource loop in the web build, as two dock tabs.
Mechanics in [03-systems.md](03-systems.md), tests in `tools/sim-test.js`.

**Why a sheet tab rather than hives beside the garden.** The prototype exists to answer one
question — is the loop fun — and a camera, a world map and region art answer none of it. The tab
reuses the existing sheet architecture and is throwaway if the loop fails.

**Why honey variety is fixed when the jar is produced.** Sampling at collection time is simpler, and
exploitable: leave the garden empty, plant one Eternal Crown, collect five jars of the most
valuable honey. Fixing variety at production forces the bloom to have actually stood in the garden
while the bees worked. Offline accrual still works because production is derived from elapsed time.

**Why flowers are a byproduct rather than replacing credits.** Harvest pays credits *and* banks the
bloom. Making crafting compete with the existing payout would have meant rebalancing the entire
nineteen-seed economy to test one hypothesis. As a byproduct, crafting is additive and the existing
balance is untouched.

**Why crafted goods sell for credits.** A placeholder for the Market. The invariant that orders must
pay more than selling still holds — these prices are the floor orders have to beat.

**Why storage caps were left out**, despite being a locked design decision. They add friction that
would confound the only question the prototype asks. They go in when the Market does.

**Deliberately untuned.** Every value is provisional. `tools/sim-test.js` asserts the *invariants*
that must survive tuning — crafted goods beat their ingredients by at least 1.35×, and every recipe
spans two regions — rather than the numbers themselves.

---

## 2026-08-05 — Resource graph locked; merge replaces match-3; world stays botanical

**Decisions.** Five regions: Garden, Apiary, Potting Shed, Apothecary, Market. The one new mechanic
is **merge**, not match-3. Mining and chickens are cut. Tickets retired, water never introduced.
Land unlocks via reputation. Full specification in
[12-meta-layer-design.md](12-meta-layer-design.md), with the Market in
[13-order-system.md](13-order-system.md) and resources in [14-economy-model.md](14-economy-model.md).

**Why merge over match-3.** Reversed from the previous entry. Content efficiency is decisive at two
people: match-3 players burn roughly fifty hand-designed levels a week, and that treadmill has
killed more small teams than anything else. A merge item tree entertains for months. Merge is also
cheaper to build (no cascade resolution, blocker taxonomy, booster interactions or level editor),
is the strongest-performing casual mechanic of the current era, and its slower pace suits a cozy
game. Decisively, seed-breeding *is* merging — mechanic and fiction are the same thing, so there's
no metaphor to teach.

**Why bees instead of chickens, and no mine.** Tonal coherence is this game's cheapest competitive
advantage. A cozy magical garden with a talking flower is a specific, defensible identity; grey ore
and a chicken coop pull it toward generic farm-sim, where it competes with Hay Day and loses. Bees
deliver the same production fantasy on-brand — and honey type following current blooms creates a
*harder* dependency than a resource sink, because the garden's contents matter, not just its
throughput.

**Why a crafting tier was added.** Previously under-specified. A graph where regions produce raws
and the Market consumes them still leaves regions parallel — players farm whichever raw pays best.
An Apothecary that combines flowers and honey into perfume, with the Market wanting *perfume*, makes
the dependency structural rather than a matter of pricing.

**Why reputation gates land, not coins.** Idle economies inflate coins unpredictably; reputation
only moves when a player engages the whole graph, making it a controlled progression gate.

**Why tickets are retired and water was never added.** Casual players fall off past four or five
tracked quantities. Tickets existed only as an inheritance from the previous build. Water is
friction without fun — watering stays a tap interaction, which `hasten()` already implements.

**Deliberately not tuned.** The numbers in [14-economy-model.md](14-economy-model.md) are
placeholders. Tuning waits until the Garden ↔ Apiary loop has been played, because values chosen
before the loop is felt are fiction with decimal places.

---

## 2026-08-05 — Direction set: modest revenue, multi-region meta-layer, one new mechanic

> **Partly superseded** by the entry above: the new mechanic is now merge in the Potting Shed, not
> match-3 in a mine, and the region themes changed. Everything else here still stands.

**Decisions.** Target is modest revenue (a few thousand a month), not a venture-scale hit. Next
milestone is a multi-region world built as one contiguous expanding map. Regions feed a single
interlocking economy driven by a Township-style order system. Exactly **one** genuinely new
mechanic — match-3 in the mine — with other regions shipping as timer production until the
structure proves it retains. An engineer ports to Unity, starting with the platform shell rather
than the garden.

**Why modest revenue.** Township-tier games are user-acquisition businesses with games attached;
success there is roughly 20% game quality and 80% economy tuning, liveops and CPI-versus-LTV
arithmetic, funded by large marketing spend. A two-person team without a UA budget can't compete
on that axis, but a well-made niche idle game with player-friendly monetization and web-portal
distribution is genuinely achievable.

**Why one contiguous map over a hub with rooms.** Visible sprawl is itself the reward and the store
screenshot; no context switching means short sessions still touch several systems; one scene is far
cheaper than N region screens.

**Why the order system.** Nothing else in the design consumes multiple resources at once, so without
it players optimise the single best region and interdependence is never felt. It's also the
cheapest infinitely-extensible content lever available and becomes the liveops surface later.

**Why only one new mechanic.** Four minigames is four games' worth of tuning, art, tutorial and bug
surface for two people. Players need distinct rewards and visuals, not distinct mechanics.

**Why data-driven numbers are non-negotiable.** If changing a grow time needs an engineer and a
build, tuning stops — and an untuned economy is the most common cause of death in this genre.

Full specification in [12-meta-layer-design.md](12-meta-layer-design.md).

---

## 2026-08-05 — Documentation set created

**Decision.** Wrote this `docs/` folder as the onboarding surface for future work, on the
assumption that most of it will be done by agents starting with no context.

**Why.** The game had reached a size where its behaviour was only discoverable by reading roughly
3,700 lines of source. Several values (rarity weights, upgrade scaling, the growth floor) are load
bearing and easy to break without knowing they matter.

**Notes.** Every number quoted was extracted from the code, and the derived economy tables were
computed by evaluating `data.js` rather than by hand — an earlier hand-calculation of the plot 8
harvester cost was wrong by half. Original *Idle Garden Reborn* design documents were moved to
`docs/legacy/` so they can't be mistaken for current truth.

---

## 2026-08-02 — Repository made public to enable GitHub Pages

**Decision.** Made `jonishua/ghostgarden` public and enabled Pages from `main` at the root.

**Why.** The owner wanted a link to send friends. GitHub Pages doesn't serve private repositories
on the free plan, so the alternatives were paying, using a third-party host, or going public. The
repository was scanned for secrets and personal data first and contained none.

**Consequence.** The repository root is now a live public site and pushing to `main` deploys. There
is no staging environment.

---

## 2026-08-02 — Game moved into the repository root

**Decision.** Moved the game from `VIBE Games/Garden/wonder/` to the repository root, with the
previous build archived in `legacy/`.

**Why.** The git repository and the game were in unrelated folders, so there was nothing to push.
Putting the game at the root also lets Pages serve it with no configuration.

**Excluded.** `Prototype/` — 3.4 GB across 90,392 files of Next.js build output — was left on disk
and added to `.gitignore`. GitHub would have rejected it.

---

## 2026-08-01 — Rebuilt as a new directory rather than editing in place

**Decision.** Built Garden Wonder as a fresh set of files instead of refactoring *Idle Garden
Reborn*, keeping the original playable.

**Why.** The visual and structural changes touched essentially every line. A rewrite alongside the
original meant the old build stayed available for comparison, and the economy could be ported
deliberately rather than accidentally mutated.

---

## 2026-08-01 — Economy ported unchanged

**Decision.** Carried every economic value across untouched: seed costs, yields, grow times, rarity
weights, upgrade scaling, decor and booster values.

**Why.** Two reasons. Migrated saves had to behave identically or players would feel robbed. And
keeping balance frozen meant any complaint about the rebuild was unambiguously about presentation.

**Consequence.** Several quirks came along: the Orchid throughput dip, endgame seeds having lower
gem chances than a Daisy, and the combo having no payout effect. All inherited, all documented in
[11-known-issues.md](11-known-issues.md), none fixed. Fixing them is a balance project and should be
treated as one.

---

## 2026-08-01 — Split into seven modules

**Decision.** Replaced the single 1,100-line `main.js` with seven files by responsibility.

**Why.** The original mixed simulation, rendering and input in one scope, so changing a payout
formula meant reading DOM code. The split makes `game.js` independently testable in principle and
gives the art and audio systems clear boundaries.

**Trade-off.** `ui.js` is still around 1,000 lines and remains the file most in need of further
splitting.

---

## 2026-08-01 — All art generated, no asset files

**Decision.** Every visual is inline SVG or CSS. No images at all.

**Why.** Nineteen seeds needing distinct art at multiple sizes would have been the bulk of the work
as hand-drawn assets. Generating from a small data block per seed made a nineteenth flower about
eight lines. It also keeps the whole game at 476 KB, diffable, and recolourable.

**Cost.** Small-size readability had to be engineered rather than eyeballed — the slim-petal
switch above 10 petals, per-shape ring scale tuning, and omitting the core on four silhouettes all
exist because early versions turned to mush in shop cards.

---

## 2026-08-01 — All audio synthesized

**Decision.** Web Audio synthesis, no audio files, everything pitched to a C major pentatonic scale.

**Why.** Consistent with the no-assets rule, and the pentatonic constraint means any layered
combination is automatically consonant. It also enables the tap pitch climbing with the combo,
which would need dozens of samples otherwise.

---

## 2026-08-01 — Shops as a draggable bottom sheet

**Decision.** All six panels live in one bottom sheet with a drag-to-dismiss grip, rather than
inline panels or a separate screen.

**Why.** The garden had to own the screen. A sheet keeps it visible behind a scrim, matches the
platform gesture vocabulary players already know, and gives one consistent place for all content.

---

## 2026-08-01 — Save migration hardened against pristine shadowing

**Decision.** Added `isPristine()`, which discards a modern save that was written but never played
if a meaningful legacy save exists.

**Why.** Found in testing. Merely opening the new build writes a `gw-save`. Without the check, a
player who launched it once and closed it would have their real *Idle Garden Reborn* progress
shadowed permanently by an empty save.

---

## 2026-08-01 — Day cycle always starts at midday

**Decision.** `DAY_START = 0.46`, derived from page load rather than wall-clock time.

**Why.** The cycle originally began at its zero point, which is midnight, so a first launch showed
a dark screen. Starting at bright midday guarantees a good first impression, and deriving from load
time rather than the real hour means a player at 3 a.m. still gets a sunny garden.

---

## 2026-08-01 — Grid rows pinned explicitly

**Decision.** Explicit `grid-row` on `hud`, `rail`, `stage` and `dock`, with `minmax(0, 1fr)` tracks.

**Why.** A real bug. The rail hides on short screens; with implicit placement the remaining rows
shifted up and the dock stretched into the free track, producing buttons that consumed a third of
the screen.

---

## 2026-08-01 — Rare harvests get no toast

**Decision.** Toasts only for Epic and Legendary. Rare gets stars and floating text. Cap of two
toasts on screen.

**Why.** Rare is a 20% roll. With automation running, toasts became a constant stream and stopped
meaning anything. Reserving them for the top two tiers restored their signal value.

---

## 2026-08-01 — Talking flower speech throttled

**Decision.** 3.2 s minimum gap, 6% chance on taps, 12% on harvests, suppressed while a coach mark
is visible; milestones always speak.

**Why.** Speaking on every interaction turned a charming character into an irritant fast, and
bubbles collided with coach marks during onboarding.

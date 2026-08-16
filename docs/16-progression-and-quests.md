# Progression and Quests

**Status: phases 1–5 built.** Specified 2026-08-12; phase 1 shipped the same day, phases 2 and 3 on
2026-08-13, phase 4 later that day. Phase 5 (Bloom Mastery) was specified 2026-08-13,
owner-ratified the same evening, and built 2026-08-14. Reasoning in
[10-decision-log.md](10-decision-log.md).

Read alongside [13-order-system.md](13-order-system.md), which owns reputation long-term, and
[15-navigation-and-ia.md](15-navigation-and-ia.md), which owns where things live on screen.

## The problem being fixed

The game has no answer to "what am I working toward." Every system is a spend surface — badges,
seeds, hives, recipes — and all of them are open from the first minute. Nothing is ever *granted*,
so nothing ever feels earned, and the session has no shape. You tap until you're bored rather than
until you've finished something.

Three specific symptoms:

- **No goal.** The only feedback for playing well is a bigger number in the same wallet.
- **No gating.** Content isn't paced. A player who happens to have coins sees the whole game at
  once, and a player who doesn't sees no reason to expect more.
- **Dead beats.** The combo ring used to fill and do nothing; it now multiplies tap payout. The
  Almanac used to list blooms and ask nothing; it is now the collection track.

## The core decision: one progression number

**Reputation is the only progression track.** It is earned, never spent, and it already exists in
the locked design as the thing that gates land, order tiers, and regions
([13-order-system.md](13-order-system.md#reputation-and-land)).

"Level" is a **display of reputation**, not a second currency. There is no XP. When the Market
ships, orders pay into the same number the quests pay into, and the level bar keeps working
untouched.

This is the whole reason the feature is affordable. Resist any suggestion to add a parallel track.

## Phase 1 — Quest ladder and level bar

The player always has a small number of visible, completable goals. Finishing one pays reputation.
Reputation fills a ring around the level pip. The ring completing grants something concrete.

### The surface

A new persistent row between the HUD and the stage:

```
┌───────────────────────────────────────────────┐
│  wallets                        almanac  gear │   HUD
├───────────────────────────────────────────────┤
│  ⑦  ▓▓▓ Harvest 3 roses  1/3 ▓▓   ★+12        │   quest strip  ← new
├───────────────────────────────────────────────┤
│  [WONDER 12s]  [Seed Rush 4:31]               │   rail — active timers only
├───────────────────────────────────────────────┤
│                    STAGE                      │
```

- **Always visible**, including on short viewports. If something has to give at ~640 px tall, hide
  the rail, not this. The rail carries transient timers; this carries the goal. The strip stays
  full height — collapsing it to a bar would hide the only goal on screen.
- **Level pip** on the left: current level in a circle, with a ring around it for reputation
  toward the next level.
- **Bar**: progress of the quest currently on the strip (`progress / qty`). The task name and
  count sit on top of the fill. A chip at the right end shows the reputation reward.
- **One quest** shown at a time — the oldest incomplete one. Tapping the strip opens the quest
  panel with all active quests.
- Tapping a **completed** quest claims it. Do not auto-claim. The claim tap is the payoff moment
  and it needs sound, a coin burst, and the bar visibly moving. Route it through `FX` and the
  feedback ladder in [06-audio-and-fx.md](06-audio-and-fx.md) at roughly Rare-tier juice; a
  level-up gets Legendary-tier.

Three quests are active at once. When one is claimed, the next unclaimed quest in the ladder slides
in. The player is never looking at an empty strip and never at a wall of twelve objectives.

### State

```js
quests: {
  active: [ { id, progress } ],   // up to 3
  done: [],                       // ids, for ladder position and Almanac-style completion
  daily: { id, progress, day }    // resets on local date change
},
rep: 0,
level: 1,
discovered: {},                   // seedId -> lifetime harvest count
bestRarity: {},                   // seedId -> rarity key
almanacClaimed: [],               // milestone `at` values already paid
mastery: {},                      // seedId -> tiers completed (phase 5, not on disk yet)
rarityCounts: {}                  // seedId -> { rare, epic, legend } (phase 5)
```

`rep` and `level` are top-level so the Market can pay into `rep` later without reaching into a
quest object. `level` is derived from `rep` and stored only so a level-up can be detected on load.

Add all of these to `defaultState()` **and** to the individual re-merge list in `load()` — nested
objects are replaced wholesale, see
[HANDOFF.md](HANDOFF.md#traps-in-this-codebase).

### The level curve

```js
repToNext(level) = 10 + 5 * (level - 1)
```

Cumulative reputation for level *L* is `10(L-1) + 5(L-1)(L-2)/2`. That gives:

| Level | Total rep | Lands near |
| --- | --- | --- |
| 4 | 45 | Order tier 2 (~50) |
| 8 | 175 | Order tier 3 (~150) |
| 12 | 385 | Order tier 4 (~400) |
| 20 | 1045 | Order tier 5 (~1000) |

The alignment is deliberate and is the payoff of the one-number decision. Author the ladder up to
**level 20**. Past that, reputation keeps accruing and the bar keeps filling, but there are no new
unlocks until the Market ships — that is acceptable and should be stated in the panel copy, not
hidden.

### Level rewards

Every level grants something. The primary lever is **seeds**. Plots are the other.

- Seeds 1–3 (Daisy, Tulip, Bluebell) are unlocked at level 1.
- One further seed unlocks per level from level 2, so Eternal Crown (seed 19) lands at level 17.
- Extra plots become **buyable** at levels 3, 6, 9 and 12 (plots 5–8). The gold cost is unchanged
  (`400 + 300 × (index + 1)`). Level opens the slot; coins buy it. This is not a quest.
- Levels 18–20 grant a hive slot, a Butterfly Shrine, and 5 gems respectively. Recipes stay
  ungated — there are only three, they are the craft tutorial, and locking them would need the
  same grandfathering as seeds for no pacing gain.

Add `unlockLevel` to each entry in `DATA.seeds`. Plot gates live in `DATA.plotUnlockLevel`. The
seed picker shows locked seeds greyed with "Level *n*" rather than hiding them — a visible locked
tier is a goal; a missing one is nothing. Locked plots show "Lv *n*" instead of a coin price.
Auto-planters plant `min(harvester ceiling, highest unlocked seed, affordable)`. Land Deed
(`plotExpansion`) can only unlock plots the current level has already opened; at level 1 it reads
Maxed.

Every level-up also pays a small coin grant (`20 × newLevel`). Boosts are granted at levels 3, 6,
9, 12 and 15 (Bloom Burst, Seed Rush, Golden Popups, Fortune Aura, Bloom Burst).

**Migration is mandatory here.** Taking a seed away from an existing save is the single worst thing
this feature could do. On first load of a save without a `rep` key (`'rep' in parsed`, not
`!state.rep` — a new player legitimately has 0):

1. Take the max of: the most expensive seed they can afford, the most expensive seed planted on
   the grid, the most expensive seed sitting in `state.flowers`, and the highest plot they can
   currently afford to buy.
2. Set `rep` to the cumulative value of that level.
3. Never re-lock a plot that is already unlocked, even if the grandfathered level is lower.
4. Show one toast explaining the new system, in the style of the decor refund migration already in
   `load()` — copy that pattern rather than inventing a new one.

Nobody loses access to a seed they had or a plot they already opened. Verify this with a sim-test.

### Quest schema

Quests are data. Put them in `DATA.quests` in `data.js`, in ladder order.

| Field | Meaning |
| --- | --- |
| `id` | Stable string. Never reuse or renumber — `done` stores these. |
| `text` | Imperative, short, fits one line: `Harvest 3 roses` |
| `track` | Which counter it watches (see below) |
| `key` | Optional qualifier — a seed id, a recipe id |
| `qty` | Target count |
| `rep` | Reputation paid |
| `reward` | Optional `{ credits, gems, boost }` |
| `after` | Optional quest id that must be in `done` first |

### The counters

The engine listens to events that already exist and increments counters. **It must never read a
spendable inventory.** `state.flowers` is decremented by crafting and selling, so a quest that
checks `flowers.daisy >= 9` can un-complete itself when the player crafts. This is the single
easiest way to get this feature wrong.

| `track` | Increment on | Notes |
| --- | --- | --- |
| `harvest` | `harvest` event | `key` = seed id, or any |
| `plant` | `plant` event | |
| `tap` | `tap` event | |
| `craft` | craft collection | `key` = recipe id |
| `honey` | jar added to a hive | Includes Bee Swarm procs |
| `wax` | wax produced | |
| `sell` | flower sold | |
| `upgrade` | badge purchased | `key` = upgrade id |
| `hold` | hold-to-tap tick | Interval repeats only, not the initial press |
| `crit` | crit tap | Same exception as rarity — keep tapping |
| `combo` | tap, set to current combo | Peak combo while the quest is active, not a tap count |
| `plot` | plot unlocked | Tap-to-buy or Land Deed |
| `hive` | hive purchased | Not in the original track list; needed for "Build a hive" |
| `rarity` | harvest at rarity ≥ `key` | Rare / Epic / Legendary |
| `discover` | first-ever harvest of a seed | Wired; no ladder quests use it — milestones pay instead |

Counters live on the active quest instance, not globally, so a quest that becomes active later
starts from zero. This is intentional: a quest should describe something you go *do*.

### Authoring rules

These are design constraints, not suggestions. A quest must:

1. **Teach or exercise one verb.** "Harvest 3 roses" is a quest. "Get rich" is not.
2. **Be completable by playing normally**, within one or two sessions at that stage.
3. **Never depend on a random proc firing.** Rain Dance is a 2% roll. "Trigger 2 ladybugs" is a
   quest that can strand a player for an hour through no fault of their own. Rarity quests and
   "land a crit" are the exceptions, because those rolls happen on every harvest or tap and the
   player can just keep going.
4. **Never require spending down a resource the player needs**, unless the quest itself is the
   tutorial for that sink.
5. **Point at a system the player has access to.** No honey quests before the first hive.

### The starting ladder

Thirty-three quests, authored in `DATA.quests`. Payouts climb from 5 to 50 so the ladder sums to
**777**, which still lands on level 17 (Eternal Crown). Generic "buy an upgrade" rows were replaced
with a buy-then-feel tutorial for each early tap upgrade, including Combo Coil (the follow-up is
"Reach combo 55", which needs the cap the badge just bought). Two long-tail filler rows were
dropped to keep the total near the seed gate.

Plot unlocks are not quests. Discover quests were not added to the ladder — the Almanac
milestones already pay reputation for distinct species, and stacking a quest on the same beat
would double-pay and blow the 777 total. Snapshot goals ("plant 4 plots at
once", "own 5 badges", "fill a hive") stay out because counters start at zero when a quest
becomes active.

| # | id | Text | track | key | qty | rep |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `q_tap_25` | Tap 25 times | tap | | 25 | 5 |
| 2 | `q_plant_1` | Plant a seed | plant | | 1 | 5 |
| 3 | `q_harvest_1` | Harvest a bloom | harvest | | 1 | 5 |
| 4 | `q_daisy_5` | Harvest 5 daisies | harvest | daisy | 5 | 8 |
| 5 | `q_power_1` | Buy Power Punch | upgrade | tapPower | 1 | 8 |
| 6 | `q_tap_50` | Tap 50 times | tap | | 50 | 10 |
| 7 | `q_tulip_3` | Harvest 3 tulips | harvest | tulip | 3 | 10 |
| 8 | `q_grip_1` | Buy Quick Grip | upgrade | holdSpeed | 1 | 12 |
| 9 | `q_hold_20` | Hold the flower 20 times | hold | | 20 | 12 |
| 10 | `q_plant_8` | Plant 8 seeds | plant | | 8 | 12 |
| 11 | `q_discover_5` | Discover 5 species | discover | | 5 | 12 |
| 12 | `q_hive_1` | Build a hive | hive | | 1 | 14 |
| 13 | `q_honey_3` | Fill 3 honey jars | honey | | 3 | 16 |
| 14 | `q_harvest_10` | Harvest 10 blooms | harvest | | 10 | 16 |
| 15 | `q_tea` | Craft Flower Tea | craft | tea | 1 | 18 |
| 16 | `q_charm_1` | Buy Lucky Charm | upgrade | critChance | 1 | 20 |
| 17 | `q_crit_1` | Land a crit | crit | | 1 | 20 |
| 18 | `q_rose_3` | Harvest 3 roses | harvest | rose | 3 | 20 |
| 19 | `q_lavender_3` | Harvest 3 lavender | harvest | lavender | 3 | 22 |
| 20 | `q_rare` | Harvest a Rare bloom | rarity | rare | 1 | 24 |
| 21 | `q_star_1` | Buy Star Strike | upgrade | critMult | 1 | 24 |
| 22 | `q_perfume` | Craft Petal Perfume | craft | perfume | 1 | 32 |
| 23 | `q_honey_8` | Fill 8 honey jars | honey | | 8 | 36 |
| 24 | `q_epic` | Harvest an Epic bloom | rarity | epic | 1 | 40 |
| 25 | `q_coil_1` | Buy Combo Coil | upgrade | comboMeter | 1 | 28 |
| 26 | `q_combo_55` | Reach combo 55 | combo | | 55 | 30 |
| 27 | `q_harvest_25` | Harvest 25 blooms | harvest | | 25 | 42 |
| 28 | `q_plant_20` | Plant 20 seeds | plant | | 20 | 44 |
| 29 | `q_peony_3` | Harvest 3 peonies | harvest | peony | 3 | 46 |
| 30 | `q_craft_2` | Craft 2 goods | craft | | 2 | 48 |
| 31 | `q_marigold_3` | Harvest 3 marigolds | harvest | marigold | 3 | 42 |
| 32 | `q_harvest_40` | Harvest 40 blooms | harvest | | 40 | 46 |
| 33 | `q_discover_12` | Discover 12 species | discover | | 12 | 50 |

`q_tap_50` has `after: q_power_1`, `q_hold_20` after `q_grip_1`, `q_crit_1` after `q_charm_1`,
`q_combo_55` after `q_coil_1`. Hold ticks are the repeating interval of a held press, not the
initial pointer-down. Combo quests set progress to the current combo rather than incrementing.

The first three are active together, so the first level-up lands inside the first minute. Honey
quests count jars added to a hive (including Bee Swarm), not collected. Craft quests count
collection (`crafted`), not `startCraft`. Discover quests count the first harvest of a species, so
they advance off `almanac.first` and never go backwards.

**The `sell` track carries no quests, deliberately.** `q_sell_5`, `q_sell_10` and `d_sell_3` were
removed 2026-08-15: `sell()` only credits the track for `kind === 'flower'`, and `stockRow()` is
only ever called for honey, wax and crafted goods, so no player could sell a flower. Because
`fillActive()` caps at three and `stripQuest()` always renders `active[0]`, the quest strip jammed
permanently at "Sell 5 flowers 0/5" once it reached the front. The ladder's two slots became
`q_discover_5` and `q_discover_12`, at the same reputation, which keeps the total at 777 — the
suite asserts the ladder still reaches Eternal. **Do not add a sell quest until the UI can sell a
flower**; a sim-test now fails if one appears before then. When the Market ships
([13-order-system.md](13-order-system.md)), the track is ready and `Game.sell('flower', …)` already
works.

### The daily quest

One quest, reset on local date change, drawn from `DATA.dailies`: Harvest 10 blooms, Plant 6 seeds,
Tap 100 times. Pays 12 reputation, a small coin grant, and a boost matching the verb (Seed Rush,
Seed Rush, Bloom Burst). No craft daily — it can strand a day-one return. No Fortune Aura on the
daily; that one stays a ladder gift. The pool is deliberately three, not four — "Sell 3 flowers"
was removed with the other sell quests, and every remaining daily is completable with nothing but
the garden, which is the property that matters for a daily.

Use local date, not a 24-hour timer from last claim. Timers that drift punish players for playing
earlier in the day. An unclaimed daily expires at midnight; the ladder never expires.

### Sim-test coverage

- `repToNext` matches the table; level derives correctly from rep at boundaries.
- A `harvest` event increments only matching quests.
- Hold ticks increment `hold` and not a manual tap; a crit tap increments `crit`; combo quests
  track peak combo, not tap count.
- A quest's counter is unaffected by crafting or selling the flowers involved.
- Claiming pays rep exactly once and moves the quest to `done`.
- Migration: a save with 100,000 credits and no `rep` keeps access to every seed it could afford;
  a planted high-tier seed with an empty wallet is also kept.
- Seed unlock: at level 1 exactly three seeds are plantable; at level 17 all nineteen are.
- Plot 5 is gated at level 1 and buyable at level 3; Land Deed cannot skip a plot the level has
  not opened.
- A maxed harvester still plants only an unlocked seed.
- Almanac `discovered` never decreases when flowers are spent; a milestone pays once; backfill
  from remaining `flowers` grants already-reached milestones on first load only.
- Ticket migration converts at 5:1 exactly once; activating a held boost decrements inventory
  and sets the timer; activating with none held is a no-op.
- Combo payout at 0 / 25 / 50 matches `1 + combo × 0.01`; Combo Coil raises the ceiling; decay
  reduces the multiplier; harvests ignore combo.

## Phase 2 — Retire tickets

**Built 2026-08-13.** Tickets are a third currency whose only use was buying four boosts from a rail chip. They added a
wallet, a drop type, a price display, and a denial reason, and they bought something the player
didn't choose so much as tolerate. The nav spec already calls for the boost tray to show **what
you hold**, not what you can buy ([15-navigation-and-ia.md](15-navigation-and-ia.md)).

**Boosts are earned inventory. Tickets are deleted.**

| Change | Detail |
| --- | --- |
| Inventory | `state.boostInv = { bloom: 0, seedrush: 0, fortune: 0, golden: 0 }` |
| Sources | Quest rewards, level-ups, daily quest, Almanac milestones. Later: orders, rewarded video. |
| Rail | Renders held boosts as tappable chips; tap consumes one and activates it. Active boosts keep the existing countdown chip. Nothing renders when you hold none. |
| Wallet | Remove tickets from the HUD. Two wallets, credits and gems. |
| Migration | `gems += round(tickets / 5)`, once, behind a flag, with a toast. Copy the decor-refund migration. |
| Lantern Tree | Was 200 tickets. Becomes 40 gems. |
| Drops | Removed `ticketChance` from seeds, the 3% crit-tap ticket, and the +3-per-10-harvests grant. The harvest beat now pays +1 reputation every 10 harvests. |
| `state.tickets` | Keep the field so old saves parse. Stop reading it after migration. |

No purchase path for boosts. Gems keep decor as their sink. If playtesting shows boosts too scarce,
the documented fallback is gem pricing at 1 gem = 5 old tickets — but try scarcity first, because a
boost you were given at the right moment reads as a gift and a boost you bought reads as a tax.

Ladder gifts: hive → Seed Rush, Flower Tea → Golden Popups, Rare → Fortune Aura, Epic → Fortune
Aura, combo 55 → Bloom Burst. Levels 3 / 6 / 9 / 12 / 15 grant Bloom Burst, Seed Rush, Golden
Popups, Fortune Aura, Bloom Burst.

**Sim-test:** migration converts tickets at the stated rate exactly once; activating a held boost
decrements inventory and sets the timer; activating with none held is a no-op.

## Phase 3 — Make the combo pay

**Built 2026-08-13.** The combo ring fills as you tap, caps at `comboMax` (50, +10 per Combo Coil level to 100), decays 1
per second. It now multiplies tap payout:

```js
comboMult = 1 + state.tap.combo * 0.01
```

Applied in `tapFlower()` alongside the existing multipliers, tap-only — the combo never touches
harvest payouts. The multiplier uses the combo **before** the tap increments it, so a tap at combo
0 is 1.0× and a tap at combo 50 is 1.5×.

At combo 50 that is 1.5×, and at 100 it is 2.0×. **The multiplier scales with absolute combo, not
with the fraction of the cap.** If it scaled with the fraction, Combo Coil would make the combo
slower to fill for no gain, which is backwards. As specified, the badge genuinely raises the
ceiling from +50% to +100% and finally earns its price.

Leave the 1-per-second decay alone. It is already well shaped against hold-to-tap: at the base 900
ms hold interval a held finger nets +0.11 combo per second and effectively never maxes, while a
fully levelled Quick Grip at 180 ms nets +4.56 per second and fills in about eleven seconds. Quick
Grip therefore buys the combo as a second-order reward. Do not "fix" the decay without re-checking
that interaction.

**Sim-test:** payout at combo 0, 25 and 50 matches the formula; Combo Coil raises the achievable
ceiling; decay reduces the multiplier; harvest payouts are unchanged by combo.

## Phase 4 — The Almanac as a completion goal

**Built 2026-08-13.** The Almanac is the collection track.

> **Superseded in shape by Phase 6 (below), decided 2026-08-14.** The state model here —
> `discovered`, `bestRarity`, milestone-pays-once — is right and survives. The *shape* does not: one
> 19-species track with rungs at 5/10/15/19 is a single 19-item set, and collection research puts the
> effective set size at **7–12**. Phase 6 restructures the same data into themed card sets. Read this
> section for what exists today and Phase 6 for where it is going.

- `state.discovered` maps seed id to **lifetime** harvest count, never decremented. Selling and
  crafting spend `state.flowers` and leave this alone. It is a record, not an inventory.
- `state.bestRarity` stores the best rarity key seen per seed. The seed row is three columns —
  name, best rarity (Common / Rare / Epic / Legendary), lifetime count. Ungrown blooms stay
  named, greyscale, and dashed. Phase 5 adds the mastery goal as a second line under grown rows.
- The panel header is `N / 19 discovered` with a progress bar. Ungrown blooms stay named and
  greyscale — the seed picker already shows them, so hiding the name would be a second secret
  for no reason.
- Milestones auto-pay on crossing 5 / 10 / 15 / 19 distinct species (numbers in
  `DATA.almanacMilestones`). They are not claim-tapped; the crossing is the moment.

| At | Rep | Gems | Boost |
| --- | --- | --- | --- |
| 5 | 20 | 1 | Bloom Burst |
| 10 | 30 | 2 | Seed Rush |
| 15 | 40 | 3 | Fortune Aura |
| 19 | 50 | 5 | Golden Popups |

140 reputation, 11 gems, four boosts across the whole collection. Completing 19 waits on
Eternal Crown at level 17, so the last rung is a late-game gift rather than a day-one splash.

- `state.almanacClaimed` holds the `at` values already paid, so a milestone pays once.
- On load, remaining `state.flowers` keys backfill `discovered` (max with any existing count).
  That undercounts for old saves — harvested-and-spent blooms are gone from inventory — which
  is fine. Already-reached unclaimed milestones then pay, so a returning garden with five
  species in the pantry is not locked out of the 5-rung forever.
- Discover quests were not added to the ladder. Milestones occupy that payout; a quest on the
  same beat would double-pay and blow the 777 total. `noteQuest('discover')` is wired so a
  future quest can read it without another harvest hook.

**Sim-test:** discovered count never decreases when flowers are spent; a milestone pays once;
backfill from remaining flowers grants already-reached milestones on first load only.

## Phase 5 — Bloom Mastery

**Built 2026-08-14.** Phase 4 answered "how many kinds have you grown." It does not answer "why
keep growing the ones you already have." Once a species is in the book it stops asking for
anything, and the dominant strategy stays what it has always been: plant the most expensive seed
you can afford and never look back.

Mastery gives every one of the nineteen flowers its own endless ladder. Every grown flower is
always mid-goal, so a harvest of anything is progress on something. The ladders live on the
Almanac row, not on the quest strip — the strip stays the tutorial of three goals and one verb.

### The reward is the flower itself

Each completed tier permanently adds **+5% to that seed's harvest yield**, added and not
compounded, so tier 10 is +50% and tier 20 is +100%. There is no cap, because the ladder has no
end. The bonus applies to harvests *after* the completing one.

This is chosen over paying reputation or gems per tier for three reasons:

- **It survives being infinite.** A percentage of one seed's yield inflates coins, which is what an
  idle game is *for*. Reputation drives seed and plot unlocks on a curve deliberately aligned to
  Market order tiers ([13-order-system.md](13-order-system.md)) and cannot absorb an unbounded
  faucet.
- **It is self-balancing across tiers.** 5% of a Daisy's 70 yield is 3 coins; 5% of an Eternal
  Crown's 140,000 is 7,000. Cheap flowers master quickly and are worth little; expensive flowers
  master slowly and pay enormously. That is why every flower can share one threshold table without
  per-seed tuning.
- **It rewards depth in whatever you actually grow.** Every grown flower is mid-goal at all times,
  so a harvest of anything is progress on something, and the seed you have leaned on is visibly
  better in your hands than in someone else's. That is the retention argument, and it is the one
  the mechanic delivers.

**What it does not do is re-rank the seeds.** The spec originally claimed a deeply mastered Daisy
becomes situationally worth planting. It does not, and the arithmetic is not close. Mastery is a
percentage of what a flower already pays, so it lifts both ends of the list by the same factor at
the same tier. The cheap seed's only real edge is speed — a Daisy matures in 12 s against an
Eternal Crown's 780 s, so it banks 65× the harvests in the same wall clock. But the ladder is
roughly six tiers per decade of harvests, so 65× the harvests is about eleven extra tiers, or
+55%, against a **31× gap in coins per second**. Closing that would take hundreds of tiers and
harvest counts with a hundred digits.

Left as designed. The feature is a depth reward and a coin faucet and is worth shipping as both;
it is simply not the answer to "does the garden's contents start mattering." That question belongs
to the Market ([13-order-system.md](13-order-system.md)), where an order that *wants* lavender
makes lavender worth planting directly. See the 2026-08-14 entry in
[10-decision-log.md](10-decision-log.md).

**Gems are 1 per fifth tier, flat, and nothing on the other four.** The arithmetic that rules out
anything richer: whatever a tier pays is multiplied by nineteen flowers. An escalating 1-to-5 gem
reward on every tier is roughly 570 gems by tier 10 across the collection — more than twice the
250-gem Gnome of Fortune, and the whole gem shop emptied several times over. At 1 per fifth tier
the same player earns 38, which is one Lantern Tree and feels earned.
[15-navigation-and-ia.md](15-navigation-and-ia.md) already warns that the collection is a retention
feature and not a monetization engine. An uncapped gem faucet inverts that.

### State

```js
mastery: {},                      // seedId -> tiers completed and paid
rarityCounts: {}                  // seedId -> { rare, epic, legend } lifetime, exact tier
```

`mastery` is a flat map of integers. `rarityCounts` is nested per seed and must be re-merged in
`load()` the same way `boostInv` is — a missing seed key is `{ rare: 0, epic: 0, legend: 0 }`.
Common counts are not stored; `discovered[id]` is the total. `bestRarity` stays, still driving
the row's tier label.

### The ladder

The same thresholds for every flower, generated rather than authored — nineteen flowers times an
endless ladder cannot live in `data.js` as data. Precedent is `repToNext()`. Numbers that *are*
data: `DATA.masteryYieldPerTier` (`0.05`), `DATA.masteryGemEvery` (`5`), `DATA.masteryGemGrant`
(`1`).

Track repeats every four tiers: **total, Rare, total, Epic**. Each track walks a 1 / 2.5 / 5
decade pattern forever:

```js
function decadeQty(steps, i) {
  return steps[i % steps.length] * Math.pow(10, Math.floor(i / steps.length));
}

function masteryTierGoal(tier) {      // 1-based: the tier you are currently climbing
  const cycle = (tier - 1) % 4;
  if (cycle === 0 || cycle === 2) {
    return { track: 'total', qty: decadeQty([10, 25, 50], Math.floor((tier - 1) / 2)) };
  }
  if (cycle === 1) {
    return { track: 'rare', qty: decadeQty([4, 10, 20], Math.floor((tier - 1) / 4)) };
  }
  return { track: 'epic', qty: decadeQty([2, 5, 10], Math.floor((tier - 1) / 4)) };
}
```

| Track | Sequence | `have` |
| --- | --- | --- |
| Total harvests | 10, 25, 50, 100, 250, 500, 1,000, 2,500, … | `discovered[id]` |
| Rare or better | 4, 10, 20, 40, 100, 200, … | rare + epic + legend |
| Epic or better | 2, 5, 10, 20, 50, 100, … | epic + legend |

Which produces:

| Tier | Goal | Expected harvests | Pays |
| --- | --- | --- | --- |
| 1 | 10 total | 10 | +5% |
| 2 | 4 Rare or better | ~13 | +5% |
| 3 | 25 total | 25 | +5% |
| 4 | 2 Epic or better | ~20 | +5% |
| 5 | 50 total | 50 | +5%, 1 gem |
| 6 | 10 Rare or better | ~33 | +5% |
| 7 | 100 total | 100 | +5% |
| 8 | 5 Epic or better | ~50 | +5% |
| 9 | 250 total | 250 | +5% |
| 10 | 20 Rare or better | ~67 | +5%, 1 gem |

A gem lands when `tier % DATA.masteryGemEvery === 0`.

**Rarity goals count that rarity or better**, matching `questMatches()` on the `rarity` track. An
Epic advancing a Rare goal is the only behaviour that isn't infuriating.

**Legendary is deliberately not a ladder tier.** At 2% it would stall a sequential ladder for
hours behind a coin flip, which is authoring rule 3 in everything but name. Legendary stays what
phase 4 made it: the `bestRarity` badge on the row, a chase with no gate attached.

### Paying out

Tiers **auto-pay on completion**. The owner ratified this: a claim-tap is a nicer beat on paper,
but nineteen flowers on endless ladders become an inbox of unclaimed gifts. Auto-pay matches the
phase 4 milestones — the crossing is the moment.

A single harvest can complete more than one tier, so the check loops. `recordHarvest()` banks the
count and rarity first, then `advanceMastery()` loops `masteryTierGoal(current + 1)` until
`have < qty`, paying each crossed tier before looking at the next. One `mastery` event is emitted
per harvest that paid anything, carrying every tier crossed plus the highest tier, the gems, and
whether it was that seed's first.

Harvest payout, once mastery exists:

```
payout = round(seed.yield × rarity.m × (1 + globalCredits) × (1 + pollination) × wonder × masteryMult)
masteryMult = 1 + DATA.masteryYieldPerTier × (state.mastery[id] || 0)
```

The completing harvest uses the *old* multiplier. Taps, flower-sell prices, and craft inputs are
untouched.

### Surface

Mastery is not a quest. It never appears on the strip, never takes a `DATA.quests` row, and never
pays reputation. Grown Almanac rows become two lines:

```
🌼  Daisy                    COMMON   ×47
    Tier 5 · 47 / 50 total  ▓▓▓▓▓░░   +20%
```

Name, best rarity, and lifetime count on top — three columns, no sentences. Current tier, its
goal, a thin progress bar, and the yield earned so far underneath. **Only the current goal is
ever shown**, never the rest of the ladder. Ungrown rows stay a single greyed line with dashes
and no mastery bar; the first harvest starts the climb toward tier 1. Progress is shown as
`have / qty` beside the bar, matching the quest strip's `1/3`; the bar alone cannot say how far
away the goal is. A gem pip marks a fifth tier while it is being climbed. Layout detail in
[08-ui-and-layout.md](08-ui-and-layout.md#the-almanac-seed-row).

`ui.js` reads getters, never the formula: `Game.masteryOf(id)`, `Game.masteryMult(id)`,
`Game.masteryGoal(id)` → `{ tier, track, qty, have }` or `null` if undiscovered. The pure
by-tier formula is exposed separately as `Game.masteryTierGoal(tier)` → `{ track, qty }`, because
the spec originally used one name for both and the UI getter and the formula are different
functions.

Toast copy names the flower and the highest tier paid that harvest (`Daisy · Tier 5 · +5% yield`);
append `· +1 gem` when a gem landed. Juice sits on the feedback ladder at **Rare / Almanac
milestone** — stars, ring, `quest` sound. A gem-paying tier does not jump to Epic or Legendary
juice.

**A tier only toasts when it is a seed's first or a gem-paying fifth.** Early tiers land every ten
or so harvests of a seed, which across eight plots is a toast every twenty seconds — noise, and
against the two-toast cap and the "genuinely notable moments" rule in
[09-conventions.md](09-conventions.md). Every other tier keeps the full particle beat and two
floating texts on the plot, and no toast. See
[06-audio-and-fx.md](06-audio-and-fx.md#the-feedback-ladder).

### Old saves

`rarityCounts` was never recorded, so a save with 500 lifetime Daisies would stall at tier 2
forever. Backfill estimates it from the drop table — 20% Rare, 8% Epic, 2% Legendary of
`discovered[id]` — **clamped by `bestRarity`, so a rarity the player has provably never hit is
never credited**. Tiers then advance to wherever that puts them.

Three details the spec left implicit, settled in the build:

- **The rates are read from `DATA.rarity`, not hardcoded.** They are the same 20 / 8 / 2, and
  deriving them means the backfill follows the drop table if it is ever retuned.
- **A credited rarity is floored at 1.** A save with `bestRarity: 'epic'` and three lifetime
  harvests would otherwise round to zero Epics, treating a rarity the player provably hit as
  never hit.
- **The estimate is capped by the harvests that happened**, allocated rarest first. One lifetime
  harvest with a Legendary best is one Legendary, not one of each.

Backfill is idempotent: once a seed has a `rarityCounts` entry it is normalised, never
re-estimated, so a second load changes nothing.

**Backfilled tiers grant the yield bonus but pay no gems and fire no toasts.** The gem belongs to
the moment of completion and a backfill has no moment; it also keeps a migration from dumping
gems into nineteen flowers at once.

### Sim-test

- A tier auto-pays once and the yield multiplier moves with it.
- The completing harvest uses the old multiplier; the next harvest of that seed uses the new one.
- One harvest that crosses two tiers pays both.
- Rarity goals count that rarity or better.
- `rarityCounts` never decreases when flowers are spent.
- Backfill never credits a rarity above `bestRarity`, and pays no gems.
- Gems land on tiers 5 and 10 and nowhere else.
- `masteryTierGoal(1)` through `masteryTierGoal(10)` match the table above, and the decade pattern
  keeps going past it.
- Backfill is idempotent — a second load advances nothing further.

All eight are in `tools/sim-test.js`, which now runs 282 assertions.

**Trap the build found:** mastery multiplies harvest payout and climbs as a run proceeds, so any
sim-test measuring a *different* harvest multiplier over thousands of harvests has to reset the
ladder **and the lifetime counts it reads** first — `clearMastery()` does this. Resetting only
`mastery` leaves the second run's counts already banked, so it jumps several tiers on its first
harvest and the ratio being measured comes out wrong.

## Phase 6 — The Almanac becomes card sets

**Specified 2026-08-14, not built.** This is a restructuring of Phase 4's surface, not a new system.
Reasoning in [10-decision-log.md](10-decision-log.md); evidence in
[17-market-and-positioning.md](17-market-and-positioning.md#who-this-game-is-for).

### Why this is now the spine

The Family/Farm Sim audience is **69% female** against an 18.5% sample-wide average, and for women
the two most common *primary* motivations are **Completion** and **Fantasy**. Completion being the
single most common motivation of the likely audience promotes the Almanac from a side panel to the
game's spine. It should be the best-built thing here.

### The rules, from collection research

| Rule | Current state | Change |
| --- | --- | --- |
| **Set size 7–12** | One 19-species set | Split into themed sets of 7–12 |
| **Never start at zero** | Starts empty | Pre-load one card per set as a gift |
| **Theme, don't index** | "N / 19 discovered" | Named sets — "Moonlit Blooms", not "Page 1" |
| **40–60% is the commitment point** | n/a | Set sizes chosen so the halfway rung arrives early |
| **Last item moderately hard** | 19th waits on level 17 | Keep one late card per set, never a 2% roll |
| **Completion improves the engine** | Pays rep, gems, a boost | Pays a *permanent growing bonus* |

The last row is the important one and is Pokémon's Shiny Charm device: **the reward for collecting is
a better collecting engine.** Completing a set should grant faster germination, better mutation odds,
or an extra plot — something that makes the *next* set easier to fill. Reputation and gems are fine
as a garnish; they must not be the whole payout, because a trophy case gets abandoned and a tool does
not.

### What survives from Phase 4

All of the state model. `state.discovered` stays a lifetime record, `state.bestRarity` stays,
`state.almanacClaimed` stays a pays-once ledger. Sets are a presentation and reward layer over the
same data, plus a set-membership table in `data.js`.

### Trading-ready, but no trading

The owner raised Monopoly Go's sticker trading. Collection ships; trading does not — it needs
accounts, a friend graph, a server and anti-fraud, against a local-first architecture, and its
monetization runs on chasing the last card, which is the pattern this audience punishes hardest.

**The constraint that matters now:** model a card as an owned *instance* with an id, not as a boolean
on the species. That single choice keeps duplicates representable, which is what any future gifting
or trading needs. Async gifting via share codes — no accounts, no server — is the cheap next step if
social pressure ever justifies it.

### Do not

- **Do not make a card's only reward a number.** Each carries flavour text, and ideally a memento or
  a hidden bloom state. See [17-market-and-positioning.md](17-market-and-positioning.md).
- **Do not put an impossible drop rate on a final card.** Players detect rigging and quit.
- **Do not build trading.** Build the data model that would allow it.

## Do not

- **Do not add XP.** Reputation is the number. One track.
- **Do not read `state.flowers` for quest progress.** It is spendable.
- **Do not gate a quest behind a random proc.**
- **Do not build a Quests dock tab.** The strip is the surface; a panel behind it is enough. The
  dock is full and the tab test in [15-navigation-and-ia.md](15-navigation-and-ia.md) applies.
- **Do not ship seed gating without the grandfather migration.**
- **Do not add a shop for boosts.** Power-ups are earned; the Shop is for money.
- **Do not put mastery on the quest strip.** It is an Almanac ladder, not a `DATA.quests` row.
- **Do not pay gems on every mastery tier.** Anything a tier pays is multiplied by nineteen
  flowers and the ladder never ends. One gem per fifth tier is the ceiling.
- **Do not put reputation on a mastery tier.** The level curve is aligned to Market order tiers
  and cannot absorb an endless faucet.
- **Do not make Legendary a mastery goal.** A 2% roll on a sequential ladder is a stall.
- **Do not build the world map.** Still deferred. Same reasons as before.

## Open questions

- ~~Does the quest strip collapse to just the bar on very short viewports, or stay full height?~~
  Stays full height. The rail hides; this does not.
- Should quests expire? Default answer is no — an expiring quest is a punishment for having a life.
  Dailies are the exception: they reset on local date change.
- ~~Is 24 authored quests enough to reach level 20, or does the daily need to carry more of it?~~
  29 quests totaling 781 rep reach level 17 (last seed). Levels 18–20 are the daily / Market tail.
- When the Market ships, do quests retire, or do they stay as the tutorial layer beneath orders?
  Leaning: they stay, but stop being the main rep source.

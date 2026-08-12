# Progression and Quests

**Status: specified, not built.** Agreed 2026-08-12; reasoning in
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
- **Dead beats.** The combo ring fills and does nothing. The Almanac lists blooms and asks nothing
  of you. Both are progression surfaces already on screen with no progression behind them.

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
Reputation fills a bar. The bar filling grants something concrete.

### The surface

A new persistent row between the HUD and the stage:

```
┌───────────────────────────────────────────────┐
│  wallets                        almanac  gear │   HUD
├───────────────────────────────────────────────┤
│  ⑦ ▓▓▓▓▓▓▓▓░░░░░░  Harvest 3 roses    1 / 3   │   quest strip  ← new
├───────────────────────────────────────────────┤
│  [WONDER 12s]  [Seed Rush 4:31]               │   rail — active timers only
├───────────────────────────────────────────────┤
│                    STAGE                      │
```

- **Always visible**, including on short viewports. If something has to give at ~640 px tall, hide
  the rail, not this. The rail carries transient timers; this carries the goal.
- **Level pip** on the left: current level in a circle.
- **Bar**: reputation progress toward the next level.
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
discovered: {}                    // seedId -> lifetime harvest count (Phase 4)
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

Every level grants something. The primary lever is **seeds**.

- Seeds 1–3 (Daisy, Tulip, Bluebell) are unlocked at level 1.
- One further seed unlocks per level from level 2, so Eternal Bloom (seed 19) lands at level 17.
- Levels 18–20 grant a hive slot, a recipe, and a decor item respectively.

Add `unlockLevel` to each entry in `DATA.seeds`. The seed picker shows locked seeds greyed with
"Level *n*" rather than hiding them — a visible locked tier is a goal; a missing one is nothing.
Auto-planters plant `min(harvester ceiling, highest unlocked seed, affordable)`.

Every level-up also pays a small coin grant scaled to the tier, and levels 3, 6, 9… grant a boost
from inventory (Phase 2).

**Migration is mandatory here.** Taking a seed away from an existing save is the single worst thing
this feature could do. On first load of a save without `rep`:

1. Find the most expensive seed the player can currently afford.
2. Set `rep` to the cumulative value of the level that unlocks it.
3. Show one toast explaining the new system, in the style of the decor refund migration already in
   `load()` — copy that pattern rather than inventing a new one.

Nobody loses access to a seed they had. Verify this with a sim-test.

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
| `plot` | plot unlocked | |
| `rarity` | harvest at rarity ≥ `key` | Rare / Epic / Legendary |
| `discover` | first-ever harvest of a seed | Distinct count, Phase 4 |

Counters live on the active quest instance, not globally, so a quest that becomes active later
starts from zero. This is intentional: a quest should describe something you go *do*.

### Authoring rules

These are design constraints, not suggestions. A quest must:

1. **Teach or exercise one verb.** "Harvest 3 roses" is a quest. "Get rich" is not.
2. **Be completable by playing normally**, within one or two sessions at that stage.
3. **Never depend on a random proc firing.** Rain Dance is a 2% roll. "Trigger 2 ladybugs" is a
   quest that can strand a player for an hour through no fault of their own. Rarity quests are the
   one exception, because rarity rolls on every harvest and the player can just harvest more.
4. **Never require spending down a resource the player needs**, unless the quest itself is the
   tutorial for that sink.
5. **Point at a system the player has access to.** No honey quests before the first hive.

### The starting ladder

Author roughly 24 quests to carry a player to level 20. A workable spine:

| Phase of play | Quests |
| --- | --- |
| First minutes | Tap 25 times · Plant your first seed · Harvest your first bloom |
| Learning plots | Harvest 5 daisies · Unlock a second plot · Buy any badge |
| Widening | Harvest 3 tulips · Plant 4 plots at once · Sell 5 flowers |
| Apiary intro | Build a hive · Collect 3 jars of honey · Collect wax |
| Craft intro | Craft Flower Tea · Craft Petal Perfume |
| Depth | Harvest a Rare bloom · Harvest an Epic bloom · Discover 8 different blooms |
| Long tail | Harvest 25 blooms · Reach combo 50 · Own 5 badges · Fill a hive |

Rep payouts start around 5 and climb to about 25. Tune so the first level-up lands within the first
two or three minutes and the second within ten.

### The daily quest

One quest, reset on local date change, drawn from a pool of repeatable objectives ("Harvest 10
blooms", "Craft anything", "Tap 200 times"). Pays rep plus a boost. It is the return-tomorrow hook
and it is cheap: it reuses the whole engine above.

Use local date, not a 24-hour timer from last claim. Timers that drift punish players for playing
earlier in the day.

### Sim-test coverage

- `repToNext` matches the table; level derives correctly from rep at boundaries.
- A `harvest` event increments only matching quests.
- A quest's counter is unaffected by crafting or selling the flowers involved.
- Claiming pays rep exactly once and moves the quest to `done`.
- Migration: a save with 100,000 credits and no `rep` keeps access to every seed it could afford.
- Seed unlock: at level 1 exactly three seeds are plantable; at level 17 all nineteen are.

## Phase 2 — Retire tickets

Tickets are a third currency whose only use is buying four boosts from a rail chip. They add a
wallet, a drop type, a price display, and a denial reason, and they buy something the player
doesn't choose so much as tolerate. The nav spec already calls for the boost tray to show **what
you hold**, not what you can buy ([15-navigation-and-ia.md](15-navigation-and-ia.md)).

**Boosts become earned inventory. Tickets are deleted.**

| Change | Detail |
| --- | --- |
| Inventory | `state.boostInv = { bloom: 0, seedrush: 0, fortune: 0, golden: 0 }` |
| Sources | Quest rewards, level-ups, daily quest. Later: orders, rewarded video. |
| Rail | Renders held boosts as tappable chips; tap consumes one and activates it. Active boosts keep the existing countdown chip. Nothing renders when you hold none. |
| Wallet | Remove tickets from the HUD. Two wallets, credits and gems. |
| Migration | `gems += round(tickets / 5)`, once, behind a flag, with a toast. Copy the decor-refund migration. |
| Lantern Tree | Was 200 tickets. Becomes 40 gems. |
| Drops | Remove `ticketChance` from seeds, the 3% crit-tap ticket, and the +3-per-10-harvests grant. Replace the harvest grant with reputation so the beat survives. |
| `state.tickets` | Keep the field so old saves parse. Stop reading it after migration. |

No purchase path for boosts. Gems keep decor as their sink. If playtesting shows boosts too scarce,
the documented fallback is gem pricing at 1 gem = 5 old tickets — but try scarcity first, because a
boost you were given at the right moment reads as a gift and a boost you bought reads as a tax.

**Sim-test:** migration converts tickets at the stated rate exactly once; activating a held boost
decrements inventory and sets the timer; activating with none held is a no-op.

## Phase 3 — Make the combo pay

The combo ring fills as you tap, caps at `comboMax` (50, +10 per Combo Coil level to 100), decays 1
per second, and **multiplies nothing**. Combo Coil is a 2,500-coin badge that raises a cap on a
number with no effect. This is the most visible broken promise in the game.

```js
comboMult = 1 + state.tap.combo * 0.01
```

Applied in `tapFlower()` alongside the existing multipliers, tap-only — the combo never touches
harvest payouts.

At combo 50 that is 1.5×, and at 100 it is 2.0×. **The multiplier scales with absolute combo, not
with the fraction of the cap.** If it scaled with the fraction, Combo Coil would make the combo
slower to fill for no gain, which is backwards. As specified, the badge genuinely raises the
ceiling from +50% to +100% and finally earns its price.

Leave the 1-per-second decay alone. It is already well shaped against hold-to-tap: at the base 900
ms hold interval a held finger nets +0.11 combo per second and effectively never maxes, while a
fully levelled Quick Grip at 180 ms nets +4.56 per second and fills in about eleven seconds. Quick
Grip therefore buys the combo as a second-order reward, which is a better payoff than the badge
currently has. Do not "fix" the decay without re-checking that interaction.

**Sim-test:** payout at combo 0, 25 and 50 matches the formula; Combo Coil raises the achievable
ceiling; decay reduces the multiplier; harvest payouts are unchanged by combo.

## Phase 4 — The Almanac as a completion goal

The Almanac lists blooms and asks nothing. Make it the collection track.

- Add `state.discovered` — seed id to **lifetime** harvest count, never decremented. It is a
  record, not an inventory, and it is what `discover` quests read.
- Track best rarity seen per seed. "You have never grown a Legendary Rose" is a better hook than
  any number on this screen.
- Header shows `12 / 19 discovered` with a progress bar.
- Milestones at 5, 10, 15 and 19 pay rep, gems and a boost.
- Backfill `discovered` on load from existing `state.flowers` keys. It undercounts for old saves,
  which is fine — it can only be generous going forward.

**Sim-test:** discovered count never decreases when flowers are spent; a milestone pays once.

## Do not

- **Do not add XP.** Reputation is the number. One track.
- **Do not read `state.flowers` for quest progress.** It is spendable.
- **Do not gate a quest behind a random proc.**
- **Do not build a Quests dock tab.** The strip is the surface; a panel behind it is enough. The
  dock is full and the tab test in [15-navigation-and-ia.md](15-navigation-and-ia.md) applies.
- **Do not ship seed gating without the grandfather migration.**
- **Do not add a shop for boosts.** Power-ups are earned; the Shop is for money.
- **Do not build the world map.** Still deferred. Same reasons as before.

## Open questions

- Does the quest strip collapse to just the bar on very short viewports, or stay full height?
- Should quests expire? Default answer is no — an expiring quest is a punishment for having a life.
- Is 24 authored quests enough to reach level 20, or does the daily need to carry more of it?
- When the Market ships, do quests retire, or do they stay as the tutorial layer beneath orders?
  Leaning: they stay, but stop being the main rep source.

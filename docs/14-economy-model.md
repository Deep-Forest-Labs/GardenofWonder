# Economy Model

**Status: skeleton.** The *structure* below is locked. The *numbers* are placeholders and will be
wrong — they exist so the prototype has something to run, and will be replaced once the
Garden ↔ Apiary loop has been played.

Do not treat any value here as tuned. Tuning happens after the prototype, deliberately, against
observed session behaviour.

## The spreadsheet is the game

Everything below should live in one authored data source — a spreadsheet exported to JSON, or
ScriptableObjects. Code renders it; it does not contain it.

If changing a grow time requires an engineer and a build, tuning stops happening, and an untuned
economy is the most common cause of death in this genre. This is the single most important
constraint on the Unity port.

## Resource taxonomy

Strict tiers. Adding a member requires removing one.

| Tier | Members | Capped? |
| --- | --- | --- |
| Raw | Flowers (per variety), Seeds, Rare Seeds, Honey (per variety), Wax | Yes — generous, upgradeable |
| Crafted | Perfume, Tea, Preserves, Candles, Salve | No |
| Soft currency | Coins | No |
| Hard currency | Gems | No |
| Progression | Reputation | Earned only, never spent |

Retired: **Tickets** (folded into gems). Never introduced: **Water** (stays a tap interaction).

## The unit-cost model

Every resource needs a **notional cost** — what it's worth in coins to produce one unit. This single
number drives order rewards, sell prices, and recipe pricing, and keeps the whole economy
self-consistent.

```
rawCost(r)      = coinsForegone + timeValue
craftedCost(c)  = Σ(ingredientCost × qty) × craftMarkup
orderPayout(o)  = Σ(itemCost × qty) × tierMult × varietyBonus
```

`craftMarkup` starts around **1.35** — crafting must beat selling ingredients, or the Apothecary is
pointless. `tierMult` starts around **1.5** — orders must beat selling crafted goods, or the Market
is pointless.

**The invariant chain: raw < crafted < order.** Every step must pay more than the last. Verify this
holds after any rebalance; it's the most likely thing to break silently.

## Inherited invariant

The existing garden holds one rule worth carrying forward: **every seed yields exactly 1.4× its
cost** at Common rarity, across all nineteen tiers. Combined with the 1.58× expected rarity
multiplier, expected return is 2.212× cost. See [04-economy.md](04-economy.md).

Keep this. If a new seed breaks it, say so in the decision log.

## Sheet structures

What the authored data needs to contain. Column names are suggestions; the shape is the point.

### Seeds *(exists — 19 rows)*

`id · name · cost · growSeconds · yield · gemChance · ticketChance · art{}`

Migration note: `ticketChance` becomes gem chance or is dropped when tickets retire.

### Flowers

One row per variety, derived from seeds.

`id · seedId · sellValue · pools[] · unlockTier`

`pools` is what the order system references — `flower`, `common_flower`, `night_flower`.

### Hives

`id · name · unlockRep · baseHoneySeconds · capacity · pollinationValue · costCoins`

Honey **type** is not on this sheet. It's resolved at collection time from what's blooming.

### Honey

One row per variety, mirroring flower varieties.

`id · flowerId · sellValue · pools[] · rarityWeight`

### Merge item tree *(Potting Shed)*

`id · name · tier · mergesInto · spawnWeight · sellValue · isGoal`

Standard merge chain: each item merges in pairs into the next tier. Three to five chains at launch,
five to seven tiers deep. The generator spawns tier-1 items on a cooldown.

### Recipes *(Apothecary)*

`id · name · outputResource · outputQty · ingredients[{resource|pool, qty}] · craftSeconds · unlockRep · slotCost`

**Every recipe must require output from at least two regions.** This is the rule that makes the
crafting tier do its job.

### Order templates

See [13-order-system.md](13-order-system.md) for the schema.

### Land parcels

`id · gridPosition · unlockRep · unlockCoins · contains[] · biome`

### Upgrades

`id · region · effect · base · scale · maxLevel`

Reuse the existing `round(base × scale^level)` curve from [04-economy.md](04-economy.md).

## Placeholder starting values

**These are guesses.** They exist to make the prototype runnable.

### Apiary

| Field | Placeholder | Reasoning |
| --- | --- | --- |
| First hive cost | 2,500 coins | Roughly the current cost of a mid badge — reachable in session two or three |
| Base honey time | 20 min | Slower than the garden, so it's a "check back" layer |
| Hive capacity | 5 jars | Overflows in ~100 min, forcing a return before a long absence |
| Pollination per hive | +8% garden yield | Visible but not dominant |
| Max hives | 4 at launch | +32% total, comparable to existing decor stacking |

### Apothecary

| Field | Placeholder |
| --- | --- |
| First recipe unlock | 50 reputation |
| Tier-1 craft time | 5 min |
| Tier-2 craft time | 45 min |
| Tier-3 craft time | 4 h |
| Craft slots at start | 2, expandable to 5 |
| `craftMarkup` | 1.35 |

### Market

| Field | Placeholder |
| --- | --- |
| Slots at start | 3, to 6 |
| Slot refill | 4 min |
| `tierMult` | 1.5 |
| `varietyBonus` | +10% per distinct region represented |
| Skip cost | 5 gems |
| Premium order | 1 per day, ~5× normal payout |

### Storage and offline

| Field | Placeholder |
| --- | --- |
| Base raw capacity | 50 per resource |
| Capacity upgrade | +25, cost `round(500 × 1.8^level)` |
| Offline cap | 8 hours at full rate |

## Tuning principles

**Time is the real currency.** Every cost should be thought of as "how many minutes of play does
this represent." Coins are just the accounting.

**Each region should feel worth checking.** If one dominates coins-per-minute, players will
single-task and the graph collapses. Aim for rough parity in value-per-session across regions, with
the garden slightly ahead since it's the emotional home.

**Sinks must keep pace with faucets.** Automation is a compounding faucet — the existing harvesters
already are. Land, capacity upgrades, hives and recipe slots are the sinks. Model total coins earned
per day against total sinks available at each reputation tier; a gap means either runaway inflation
or a hard wall.

**Prefer generous over stingy at this scale.** The modest-revenue target means retention matters far
more than extraction. When a number is uncertain, err toward the player.

**Watch the existing bugs.** [11-known-issues.md](11-known-issues.md) documents real economy
problems in the current build — the dead combo, inverted gem chances, the Orchid throughput dip.
Fix them before layering new systems on top, or you'll tune around broken foundations.

## Validating the model

Before committing to numbers, sanity-check by simulation rather than intuition. A short script that
plays the economy forward is worth more than a week of argument.

Questions it should answer:

1. **Time to first hive** for a player doing four sessions a day. Target: day one or two.
2. **Coins per day** at reputation tiers 1, 3 and 5 — does it grow smoothly or spike?
3. **Sink coverage** — is there always something worth buying?
4. **Order completability** — what fraction of generated orders can a typical player actually fill?
   Below roughly 70% and the board feels hostile.
5. **Does any single region dominate** value per session?
6. **Idle versus active ratio** — a fully automated player should still earn meaningfully less than
   an engaged one, or tapping becomes pointless.

A headless simulation is straightforward here because `game.js` has no DOM dependencies. That's
worth preserving in the Unity port too.

## Next

Numbers get real after the Garden ↔ Apiary prototype. Until then, treat this document as the shape
of the answer rather than the answer.

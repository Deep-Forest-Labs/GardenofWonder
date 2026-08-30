# Order System

**Status: built 2026-08-25** — simulation and surface shipped as the Garden Stand
([03-systems.md](03-systems.md#the-garden-stand--orders)); this document remains the design record
and the liveops roadmap. Structure is locked; numbers are placeholders pending the
prototype. See [12-meta-layer-design.md](12-meta-layer-design.md) for the world it sits in.

**Confirmed and named, 2026-08-25.** The order board is **the Garden Stand**, a place on the world
map's lane where customers visibly queue — confirmed as the first thing built after the map frame
([25-world-map.md](25-world-map.md)). It launches on **Florist order-shapes (bouquets — multi-flower
line items needing no crafting) and named honeys**; the full catalog and its rollout live in
[26-goods-catalog.md](26-goods-catalog.md).

**Still wanted, 2026-08-16.** The habitat direction (creatures, the Hollow) arrived first, but the
owner is explicit that orders and the production chain they sit on have not been dropped — the right
way to fold them in simply has not been found yet. This remains a live design.

## Why this system exists

Nothing else in the design consumes **multiple resources at once**. Without that, players optimise
whichever region pays best and ignore the rest — interdependence exists on paper but is never felt.

An order requesting three lavender, two honey and one perfume forces every production chain to keep
running. That single property is what turns the resource graph from a diagram into gameplay.

**Scope correction, 2026-08-14.** This document previously carried the whole "why plant *this*
flower" burden. It should not. An order makes a flower *instrumentally* wanted — a quota to fill —
which is not the same as wanting the flower. Desire comes from per-plant verbs, adjacency, mutations
and collection; see [17-market-and-positioning.md](17-market-and-positioning.md). Orders remain the
goal generator and the liveops surface, which is plenty.

It is also:

- The **goal generator**. Idle games die from "what do I do now?" Orders always answer it.
- The **cheapest content lever** in the project. New orders are data rows, not code.
- The **progression gate**, since reputation comes from here and reputation unlocks land.
- The **entire liveops surface** later — seasonal orders, timed events, special customers.

Build it early. It's more important than any minigame.

## Anatomy of an order

```
┌─────────────────────────────────┐
│  [portrait]  Mrs. Thistle       │   customer — character, art, voice line
│                                 │
│   3 × Lavender    ✓ have        │   requirements — 1 to 4 line items
│   2 × Wildflower Honey   1/2    │
│   1 × Rose Perfume       0/1    │
│                                 │
│   ⏱ expires in 4h               │   optional timer
│   ── rewards ──                 │
│   420 coins  ·  12 reputation   │   always coins + reputation
│   + 1 rare seed                 │   occasional bonus
│                                 │
│   [ Deliver ]   [ Skip · 5 💎 ] │
└─────────────────────────────────┘
```

| Field | Notes |
| --- | --- |
| `customer` | Character id — portrait, name, one line of dialogue |
| `requirements` | 1–4 line items, each a resource id and quantity |
| `rewards` | Coins, reputation, occasionally a bonus item |
| `expiresAt` | Optional. Most orders should **not** expire |
| `slot` | Which board position it occupies |

## Board layout

Three visible slots at the start, expanding to six with reputation. A slot refills a few minutes
after its order is delivered or skipped.

Three is deliberate: enough choice to avoid feeling railroaded, few enough that the board reads at a
glance on a phone.

**One premium slot** appears daily — a large multi-resource order paying several times the normal
rate. This is the "come back tomorrow" hook and the natural place for a rewarded-video reroll.

## Generation

Orders are generated, not hand-authored, from templates weighted by player state.

```
1. Determine tier from reputation.
2. Pick a customer eligible at that tier.
3. Choose line-item count: mostly 2–3, occasionally 1 or 4.
4. For each line item, pick a resource from the unlocked pool,
   weighted toward things the player can currently produce.
5. Set quantities from the tier's range.
6. Price rewards from the resource cost model (below).
7. Apply anti-frustration rules.
```

### Anti-frustration rules

These matter more than the generation logic. Break them and the board becomes a chore.

- **Never request a resource the player cannot yet produce.** Obvious, and easy to get wrong when a
  region is unlocked but not yet built.
- **Never fill all slots with long-lead items.** At least one order should be completable within a
  session or two.
- **Cap total requested quantity** relative to production rate, so the board can't demand more than
  roughly a day of output at once.
- **Avoid duplicate line items across simultaneous orders** unless production comfortably supports
  it.
- **Guarantee variety.** Don't request the same resource in three consecutive generations for a
  slot.
- **Skipping is always available, and free.** This is the load-bearing one. Township's helipad
  orders are dismissable with **no penalty beyond a 30-minute refresh timer** (or a small premium
  cost to refill instantly), and that single rule is what converts "I don't have that" from a wall
  into a choice. A stuck board is an uninstall. Do not price the first reroll.

### Reputation tiers

| Tier | Reputation | Line items | Introduces |
| --- | --- | --- | --- |
| 1 | 0 | 1–2 | Flowers only |
| 2 | ~50 | 2 | Honey |
| 3 | ~150 | 2–3 | First crafted goods |
| 4 | ~400 | 3 | Rare seeds, multi-craft orders |
| 5 | ~1000 | 3–4 | Premium goods, chained orders |

Numbers are placeholders. The shape — slowly widening requirements as regions come online — is the
locked part.

## Rewards

Every order pays **coins and reputation**. Some pay a bonus.

> **How much is "enough", 2026-08-30 (owner's ruling).** A delivered order should be worth **roughly
> one to two minutes of the player's current earning rate**, at every tier. Not "more than selling",
> not "a lot" — a span of the player's own time, measured rather than eyeballed. That is what
> [tools/order-gold.js](../tools/order-gold.js) exists to check, and it is the number to re-derive
> before touching `tierMultiplier` again.

> **Paused, 2026-08-30.** The reputation half is switched off at `STAND.repPaused` until slice D
> authors the level rungs past 20. Orders still pay coins and still count the Tally's orders line.
> The formula below is what the engine still authors onto every order — the pause gates the
> *payment*, in `Game.standOrderRep()`, not the price.

```
coinReward = Σ(itemCost × quantity) × tierMultiplier × varietyBonus
repReward  = base(tier) × lineItemCount
```

- `itemCost` comes from the resource cost model in
  [14-economy-model.md](14-economy-model.md) — the notional value of producing one unit.
- `tierMultiplier` is **30 / 200 / 210 / 225** across the four tiers as of 2026-08-30. It used to be
  1.55–2.60, and that is the shape of the mistake worth remembering: it was chosen as a small
  multiple of the raw value, and `flowerValue` is a STATIC `yield × 0.25` while the player's earning
  rate compounds every Turn through petals, plots, rarity and the drone. A static anchor cannot
  track a compounding rate, so what shipped as "a small windfall" decayed into a fifth of a second
  of income without anyone changing a number. **Whatever constant ships will decay again for the
  same reason** — the durable fix is pricing an order in *seconds of the player's earning rate*
  rather than as a multiple of raw value, which is an engine change nobody has scoped yet. Until
  then, re-measure with [tools/order-gold.js](../tools/order-gold.js) every few phases and expect to
  raise it.
- Orders must pay **more than selling raws directly**, or the system is optional. The real floor for
  that is `mult > 1 / STAND.wildBonus` = **1.12**, not "around 1.5".
- `varietyBonus` rewards spanning more regions. This is the thumb on the scale that makes
  interdependence pay.

Bonus rewards — a rare seed, a decor piece, gems, a story beat — should be occasional and
telegraphed on the card. They're the reason to read the board rather than tapping deliver.

> **Ruled 2026-08-30, not yet built: an order is filled from what you grew THIS year.** The Turn
> throws away all three orders and writes new ones, but it does not empty the pantry — so a fresh
> board met a stockpile, and 30% of a Turn-heavy player's entire order income arrived in the first
> sixty seconds of a new year. Everything left in the pantry at the Turn becomes *preserved*:
> craftable, sellable, and no longer something a customer will take. Full spec, including the honey
> half and what it costs normal play, in [41-the-preserve.md](41-the-preserve.md).

**Rule: fulfilling an order must always beat selling its contents.** Otherwise players bypass the
engine.

## Reputation and land

**Revised by the Garden Year, 2026-08-29 ([32-the-garden-year.md](32-the-garden-year.md)).**
Reputation gates order tiers, board slots and the re-authored ladder past level 17 — not land
(hedge gates open by Turn count) and not seed tiers (one-time gold unlock prices,
[33-year-one-economy.md](33-year-one-economy.md)). Orders are promoted to the perennial reputation
engine.

Reputation is earned only here, never spent, and is the single global progression track. It gates:

- **Land parcels** — the visible reward, and the reason to keep delivering.
- **Recipes** at the Apothecary.
- **Seed tiers** in the Garden.
- **Order board slots** and tier.

Land unlocking off reputation rather than coins is deliberate: coins inflate unpredictably in an
idle economy, while reputation only moves when the player engages the full graph.

## Data schema

Everything below is content, authored as data and shipped through remote config.

```jsonc
// customer
{
  "id": "thistle",
  "name": "Mrs. Thistle",
  "portrait": "thistle",
  "minTier": 1,
  "lines": { "greet": [...], "delivered": [...], "waiting": [...] }
}

// order template
{
  "id": "tea_run",
  "tier": 3,
  "weight": 10,
  "customers": ["thistle", "bramble"],
  "requires": [
    { "pool": "flower", "min": 2, "max": 5 },
    { "resource": "tea", "min": 1, "max": 2 }
  ],
  "rewardMult": 1.0,
  "bonus": { "chance": 0.15, "item": "rare_seed" }
}

// resource pool
{ "id": "flower", "members": ["daisy", "tulip", "..."], "unlockedBy": "seedTier" }
```

Pools rather than hardcoded resources are what let one template stay relevant across the whole game
— `{ "pool": "flower" }` automatically widens as seeds unlock.

## Liveops hooks

Designed in from the start, even if unused at launch:

- **Seasonal customers** with limited-time art and a themed reward track.
- **Event currencies** as an order reward, spent in a temporary shop.
- **Chained orders** — deliver three from one customer to unlock a story beat.
- **Double reputation weekends**, a pure remote-config flag.
- **Community orders**, if there's ever a server.

None require code changes if templates, customers and pools are data.

## Character and story

The Market is where the game's writing lives beyond the flower. Recurring customers with names,
portraits and opinions convert "submit 3 lavender" into a small relationship.

This is the Gossip Harbor lesson: the mechanic is the delivery vehicle for character. Cheap
content — a portrait and thirty lines makes a memorable customer.

Keep the flower as narrator. It should comment on customers, react to big deliveries, and have
opinions about who's demanding.

## Open questions

- Do orders expire by default, or only premium ones? (Leaning: only premium — expiry punishes the
  cozy player.)
- Can players see upcoming orders to plan production?
- Is there a "favourite customer" mechanic that biases generation?
- ~~Does skipping cost gems, a timer, or a rewarded video?~~ **Resolved 2026-08-14: a free timer.**
  See the anti-frustration rules above.
- Should crafted goods be sellable outside orders at all, or only deliverable? **Note:** the
  Apothecary is being folded down alongside the Apiary (see
  [10-decision-log.md](10-decision-log.md)), so "crafted goods" may not be a category this system
  needs to handle at all. Settle the garden's verbs first.

## Build order

1. Static board of three slots, hand-authored orders, flowers only.
2. Generation from templates and pools.
3. Reputation, tiers, and land unlocking.
4. Customers, portraits and dialogue.
5. Premium daily order and rewarded-video reroll.
6. Liveops flags.

Steps 1–3 are the minimum to test whether the loop works.

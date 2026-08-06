# Navigation and Information Architecture

**Status: phase 1 built, phases 2–5 specified but not built.** This is the agreed target structure
for the game's navigation. Decided 2026-08-05; reasoning in
[10-decision-log.md](10-decision-log.md).

Read alongside [08-ui-and-layout.md](08-ui-and-layout.md) for how the current UI is put together and
[12-meta-layer-design.md](12-meta-layer-design.md) for the world this navigation has to serve.

## The problem being fixed

The dock element in `index.html` is labeled, accurately, `aria-label="Shops"`. Every tab is a place
to spend money. None of them answers "where am I" or "what am I working toward", which is why the
categories feel interchangeable.

The clearest symptom is that **Badges and Decor are the same system twice**:

| Decor item | Effect | Badge doing the same job |
| --- | --- | --- |
| Gnome of Fortune | +5% crit chance | Lucky Charm — +1% crit chance |
| Butterfly Shrine | +10% grow speed | Sprinklers — +5% grow speed per level |
| Crystal Fountain | +10% tap earnings | Power Punch — tap payout |
| Lantern Tree | +1% crit multiplier | Star Strike — +2× crit multiplier |

Four decor items, four badges, the same four stats. The only real difference is which currency you
pay with.

There is also a collision coming. The locked design is a **contiguous map that grows outward**, but
Apiary and Craft are currently dock tabs. Tabs and a map are competing navigation models — if
regions stay tabs the map becomes decoration, and every new region costs a dock slot. The current
tabs were a deliberate prototype shortcut and are not meant to survive.

## The test for any tab

**Can you say what it is for in one word, and does no other tab do that?**

Apply this before adding anything. "Badges" and "Decor" both fail it today.

## Target structure

Places live on the map. Systems live in the dock.

```
┌───────────────────────────────────────────────┐
│  wallets                        almanac  gear │   HUD (unchanged)
├───────────────────────────────────────────────┤
│                                               │
│              WORLD / REGION VIEW              │   pan and zoom between regions
│                                               │
│   [boost tray]                                │   contextual power-ups
├───────────────────────────────────────────────┤
│  World  │  Orders  │  Shop  │ Almanac │ Events│   dock, max 5
└───────────────────────────────────────────────┘
```

| Tab | One word | Contains |
| --- | --- | --- |
| **World** | *Where* | Returns to the map. Pan and zoom between regions; buy land. |
| **Orders** | *Goals* | The Market order board — see [13-order-system.md](13-order-system.md). |
| **Shop** | *Money* | Gems, IAP, starter packs, remove-ads, cosmetic decor. The only place real money appears. |
| **Almanac** | *Collection* | Flowers discovered by rarity, recipes learned, stats. |
| **Events** | *Now* | Limited-time content. **Do not add until events exist.** |

Hard cap of five. If a sixth is ever wanted, something must leave.

## Where everything currently in the game goes

| Today | Goes to | Why |
| --- | --- | --- |
| Tap upgrades — Power Punch, Lucky Charm, Star Strike, Combo Coil | Contextual on the flower | They are all about tapping; put them where the tapping happens |
| 8 plot harvesters | Tap the plot itself | A flat list of eight near-identical cards is a symptom, not a menu |
| Sprinklers, Drone Harvester | Per-region automation | Every region will want its own; a global list stops scaling at region three |
| Land Deed (`plotExpansion`) | The map | Buying land is a map action, not a shop purchase |
| Decor | Shop, cosmetic only | Removes the duplication; makes decor a clean gem sink |
| Boosts | Contextual tray on the core screen | They are power-ups, not inventory — see below |
| Apiary, Craft | Map locations | They are places |
| Almanac (currently a HUD icon) | Promoted to a dock tab | This is the collection system |
| Settings | Stays a HUD icon | Correct where it is |

## Boosts become power-ups

Players should not shop for boosts. In Coin Master they fall out of the slot machine; the player
never browses a boost catalogue.

Sources, in order of importance: **order rewards**, **rewarded video**, and occasional drops from
harvests or Wonder Effects. Surfaced as a small tray on the core screen showing what you hold, with
one tap to activate.

This also places the rewarded-video prompt in the one spot where a player actively wants a boost,
which is worth more than a menu entry.

Tickets are already slated for retirement in favour of gems — see
[12-meta-layer-design.md](12-meta-layer-design.md). Moving boosts out of the dock is the natural
moment to do it, since tickets exist almost entirely to buy boosts.

## Decor becomes cosmetic

Decor keeps its art and loses its stats. It becomes the gem sink and the expression layer.

This needs a **save migration**, because existing saves hold decor with real bonuses:

```javascript
state.decor = [{ id: 'gnome', type: 'critChance', val: 0.05 }, ...]
```

`Game.decorVal()` reads it in `growModifier()`, `tapFlower()` and `harvest()`.

Recommended: **refund each owned decor at its purchase price in the currency it was bought with**,
and tell the player once with a toast. An exact conversion into badge levels is not possible —
Gnome maps cleanly onto Lucky Charm, but Crystal Fountain's multiplicative `tapYield` has no
equivalent in Power Punch's flat `+1`. A refund is simple, honest, and the live player base is
small enough that generosity costs nothing.

Once migrated, delete `decorVal()` and its three call sites rather than leaving them returning zero.

## Contextual upgrades

The largest change, and the reason the dock can stay small.

Instead of a global list, an upgrade lives on the thing it upgrades. Tap a plot to improve that
plot. Tap a hive to improve hives. Tap the flower for tap upgrades.

**Do not attach upgrades to the primary tap.** Plot taps already plant, harvest and hasten; adding
a fourth meaning will break the core loop. Use a **small corner affordance** on the object that
appears only when an upgrade is available and affordable — this reuses the attention-dot idea the
dock already implements in `updateDockDots()`.

Avoid long-press. It is undiscoverable on mobile and conflicts with drag-to-hasten.

While there is only one region, a flat upgrades list is fine. It stops scaling at three regions,
which is why this is phased last.

## Build order

Each phase is independently shippable and reversible. Do not skip ahead — phase 3 depends on the
map existing.

### Phase 1 — Fix the duplication *(small, safe, do first)* — **done, 2026-08-05**

- Merge Badges and Decor into one **Upgrades** surface. *(Badges renamed to Upgrades; decor's stat
  role was deleted rather than merged in — see below.)*
- Move boosts out of the dock into a contextual tray.
- Dock becomes `Upgrades · Apiary · Craft · Shop`.
- Decor migration and refund.

Done when: no two dock tabs answer the same question, and boosts are no longer purchasable from a
menu.

**Implementation notes, for whoever reads this before phase 2:**

- The boost tray keeps ticket-purchase — tap a chip in the status rail to buy-and-activate. It is
  no longer a dock menu, but it isn't yet "sourced from rewards" either, because order rewards and
  rewarded video don't exist yet. Retiring tickets and adding real drop sources is a deliberate,
  separate balance project, not a side effect of this phase. See the decision log entry dated
  2026-08-05.
- Shop currently holds only cosmetic decor. Gems, IAP and remove-ads arrive with actual
  monetization work, not as part of navigation.
- Decor's stat bonuses were deleted outright (`decorVal()` and its three call sites), not
  converted into Upgrades levels — the doc's "merge" language describes the resolution to the
  duplication, not a literal content merge. Existing owners were refunded at purchase price via a
  version-gated migration (schema v2 → v3) in `Game.load()`; they keep the item as a cosmetic
  record.

### Phase 2 — Build the world map

- A zoomed-out scene containing the garden, the apiary and the apothecary as locations.
- Tapping a location moves the camera to it; a back or pinch gesture returns to the map.
- Land parcels purchasable on the map.
- Regions leave the dock.

Done when: every region is reachable from the map and none from the dock.

### Phase 3 — Final dock

- `World · Orders · Shop · Almanac`, with Orders arriving alongside the Market.
- Almanac promoted out of the HUD.

### Phase 4 — Contextual upgrades

- Dissolve the Upgrades tab into per-object affordances.
- Land Deed moves to the map.

### Phase 5 — Events

Only once there is recurring content to put in it. An empty Events tab is worse than no tab.

## Do not

- **Add a region as a dock tab** after phase 2. Regions are places; places are on the map.
- **Create a "Manage" or "More" tab.** That is the junk drawer this document exists to prevent.
- **Exceed five dock slots.**
- **Put IAP anywhere except Shop.** One place for real money, always.
- **Break the layering rule** in [09-conventions.md](09-conventions.md) — data, then game, then ui.
- **Introduce a build step or binary assets.** Still non-negotiable.

## Open questions

- Does the world map replace the current single-garden view entirely, or does the garden remain the
  default screen with the map one zoom level out? *(Leaning: the latter — opening the app should
  land you where the action is, not on a menu.)*
- Should the Almanac show undiscovered flowers as silhouettes? Standard for collections, and a
  strong pull, but it reveals the content ceiling early.
- ~~Does the boost tray show empty slots as an upsell, or hide when empty?~~ **Resolved in phase
  1: hide.** A boost chip only renders while active or while affordable and idle.
- Is there room for a social tab at all given a two-person team? *(Leaning: no. Collections without
  trading or social pressure are achievement lists, which is fine, but do not plan a Coin Master
  card economy around it.)*

## A note on the collection tab

The 19 seeds already carry four rarity tiers, so "discover every bloom in Legendary" is a ready-made
album needing no new systems. That is unusually cheap content.

Be honest about the ceiling, though: Coin Master's cards work because of duplicates, trading and
social pressure. Without a social layer — out of scope for two people — an album is an achievement
list. Good for retention, not a monetization engine on its own. Do not over-invest in it.

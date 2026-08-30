# Navigation and Information Architecture

> **SUPERSEDED IN ITS DOCK SECTIONS, 2026-08-30 (phase 3.5) — third and final supersession.**
> The dock is now the owner's **Big Five**: *Orders & Quests · Cards · GARDEN · Turn · Shop*, with a
> floating **UPGRADE** pill and **POWER-UP** button in the band above it. See
> [36-hud-and-dock.md](36-hud-and-dock.md), which is the live spec, and
> [08-ui-and-layout.md](08-ui-and-layout.md) for how it is built.
>
> **What survived from this document:** the hard cap of five; the centre pedestal; *places live on
> the map, systems live in the dock* becoming *rooms are gestures, systems are the dock*; the
> attention-dot pattern, which this phase extended to a control that is not a dock button; and the
> house rule that decided the whole build order — **a tab leaves when its home exists, and not
> before.**
>
> **What did not:** the pedestal is **GARDEN**, not World. **The map is deleted**, so "navigation is
> the map, never the dock" is now "navigation is the gesture, never the dock". The Apiary and Craft
> tabs are gone from the dock — Craft keeps only the tab pill it shares with Upgrades and Shop, and
> **that demotion is the one thing doc 36 never named**. The boost tray left the rail for the
> POWER-UP button; the rail keeps only countdowns.

**Status: phase 1 built; phase 2 (the world map) BUILT 2026-08-25; phases 3–5 specified but not
built.** This is the agreed target structure
for the game's navigation. Decided 2026-08-05; reasoning in
[10-decision-log.md](10-decision-log.md). **The dock's purpose was reframed by the owner
2026-08-25** — read the next section first, since it supersedes the target structure below where
the two disagree.

**Superseded in part, 2026-08-29.** Season-swiping replaces map navigation
([32-the-garden-year.md](32-the-garden-year.md)); the centre-pedestal World dock target and phases
3–4 are superseded where they assume the map. The map and the World button retire when the year
strip ships.

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

## The dock is meta, the map is navigation

**Decided by the owner 2026-08-25, and it supersedes the target structure below where they
conflict.** The dock was always a temporary shape — Apiary, Craft and Shop were built as tabs
because there was nowhere else to put them, not because a place belongs in a menu.

The shape it is heading for is the one every large mobile casual game converges on:

```
│ Friends │ Cards │ ( WORLD ) │ Quests │ Shop │
```

| Slot | One word | Contains |
| --- | --- | --- |
| **Friends** | *Social* | Invites and whatever social exists. **Reserve the slot; do not build it** — it is a backend, not a button, and this is a two-person team with no server. |
| **Cards** | *Collection* | The card sets and albums. |
| **World** | *Where* | The centre pedestal — raised, round, larger than the rest. Takes you to the map, and from the map into a place. |
| **Quests** | *Goals* | Quests, levels, reputation, the Almanac, the creature roster — the progression surface. |
| **Shop** | *Money* | Gems, IAP, remove-ads, starter packs. |

Three rules follow, and they are the whole point of the change:

**Navigation is the map, never the dock.** The apiary, the crafting bench and every future region
are reached by pulling back to the world and going in. A region never gets a dock slot again.

**Upgrades stay in the garden.** They act on the garden, so they live where the garden is. This is
the same conclusion phase 4 below reached from the other direction — the dock cannot hold both
meta destinations and per-place controls, and the per-place ones lose.

**Real money appears in Shop and nowhere else.** A goods market or trading post is a *place* and
belongs on the map; the IAP shop is a *meta destination* and belongs in the dock. They share a word
and are not the same thing.

The centre pedestal is not decoration. It is what makes the dock read as meta at a glance: four
flat destinations and one raised button that means *play*.

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
| **Cards** | *Collection* | Themed card sets, flowers discovered by rarity, stats. Renamed from Almanac 2026-08-14 — see [16-progression-and-quests.md](16-progression-and-quests.md) phase 6. |
| **Events** | *Now* | Limited-time content. **Do not add until events exist.** |

Hard cap of five. If a sixth is ever wanted, something must leave.

### Interim dock, after the Apiary rework

**Decided 2026-08-14.** The world map is still paused, so the five-tab target above cannot be built
yet. But folding the Apiary and Apothecary into garden adjacency (see
[10-decision-log.md](10-decision-log.md)) frees two tabs immediately, which is the answer to the
dock's current shape:

```
│  Garden  │  Cards  │  Market  │  Shop  │
```

| Tab | One word | Contains |
| --- | --- | --- |
| **Garden** | *Where* | The garden itself, and the upgrades that act on it. Becomes **World** when the map exists. |
| **Cards** | *Collection* | The card sets. Promoted from a HUD button, because Completion is the audience's top motivation. |
| **Market** | *Goals* | The order board. Empty until [13-order-system.md](13-order-system.md) is built. |
| **Shop** | *Money* | Cosmetic decor now; gems, IAP and remove-ads later. |

This is four destinations that map to what the player actually does, replacing two real systems and
two prototype leftovers. It also survives contact with the target structure — Garden becomes World
and nothing else moves.

**Upgrades loses its tab**, which anticipates phase 4 (contextual upgrades) rather than fighting it.
Where upgrades surface in the interim is an open question; the cheapest answer is a sheet opened from
the Garden tab.

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

**Implementation notes, after progression phase 2:**

- The boost tray shows held inventory — tap a chip to consume one. Ticket-purchase is gone;
  tickets convert to gems on load. Order rewards and rewarded video are still future sources.
  See [16-progression-and-quests.md](16-progression-and-quests.md).
- Shop currently holds only cosmetic decor. Gems, IAP and remove-ads arrive with actual
  monetization work, not as part of navigation.
- Decor's stat bonuses were deleted outright (`decorVal()` and its three call sites), not
  converted into Upgrades levels — the doc's "merge" language describes the resolution to the
  duplication, not a literal content merge. Existing owners were refunded at purchase price via a
  version-gated migration (schema v2 → v3) in `Game.load()`; they keep the item as a cosmetic
  record.

### Phase 2 — Build the world map — **BUILT 2026-08-25**

- A zoomed-out scene containing the garden and whatever regions still exist as locations. **Note,
  2026-08-14: the apiary and apothecary are no longer regions** — they fold into garden adjacency.
  See [12-meta-layer-design.md](12-meta-layer-design.md).
- **Swipe down to pull back, swipe up to go in.** Not a pinch. The garden already binds swipe-up to
  the Hollow (`ui.js`), and swipe-down is free, which makes the whole game one vertical ladder:
  **map → garden → Hollow**. One gesture, one metaphor, no dock tab.

  > **Correction, 2026-08-30 (phase 3.8).** The map is deleted, so the ladder is
  > **meadow → garden → Hollow**. The *directions* in this bullet happen to be the live ones again —
  > swipe up goes into the Hollow — but not for the reason written here: it is not "up goes in", it
  > is that the finger drags the world. See
  > [08-ui-and-layout.md](08-ui-and-layout.md#the-vertical-ladder), which is the live spec for the
  > axis; this section is phase-2 history.
- Land parcels purchasable on the map, drawn as silhouettes with a price. The silhouette is the
  pull — you buy land you have been looking at.
- Regions leave the dock.

**The map is a layer above the garden, not a scene the garden lives inside.** Found in
`tools/map-spike.html` on 2026-08-25: the dive cannot simply keep zooming until the garden fills
the screen. The garden is its own composition — sky, quest strip, plots as tappable cards, the
burrow door, the HUD — and rebuilding it inside a world box would mean maintaining the garden
twice. So the camera move ends in a **cross-fade to the existing garden screen**, and the map's
copy of the garden is a thumbnail that only ever has to read at map distance.

Done when: every region is reachable from the map and none from the dock.

**Shipped 2026-08-25.** The map, the ladder, the dive, the Stand on the lane, locked parcels, and
**the Wild Meadow** — the Apiary's tab died the day the meadow existed, which is the pattern every
remaining tab follows: *a tab leaves when its map home exists, and not before.* The dock is now
`Upgrades · World · Craft · Shop`.
The dock's fifth slot is a single **World** button — travel, not a sheet — which is the
discoverable way in for anyone who has not found the swipe. **Craft keeps its tab for now** — it leaves when the Potting Shed
lands on the map, and removing it first would strand a live system. The full meta dock (Friends · Cards · World · Quests · Shop) arrives with the polish pass.

**The dock's column count now follows its button count** (`grid-auto-flow: column`). It was pinned
at four, so a fifth tab wrapped onto a second row and covered the lawn.

### Phase 1.5 — Interim dock *(new, 2026-08-14, ahead of the map)*

- Apiary and Craft tabs removed with the adjacency rework.
- Dock becomes `Garden · Cards · Market · Shop`. See "Interim dock" above.
- Cards promoted out of the HUD early, because Completion is the audience's top motivation and the
  HUD button under-sells it.

### Phase 3 — Final dock

- `World · Orders · Shop · Cards`, with Orders arriving alongside the Market.
- Garden becomes World once the map exists. Nothing else moves.

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

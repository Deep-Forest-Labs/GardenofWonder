# Meta-Layer Design — The Cozy Garden World

**Status: mostly design.** The Garden ↔ Apiary ↔ Apothecary loop is now prototyped in the web build
— see "Prototype status" at the bottom, and [03-systems.md](03-systems.md) for how it works. The
Potting Shed, the Market and the world map are still design only.

Companion documents: [13-order-system.md](13-order-system.md) for the Market engine,
[14-economy-model.md](14-economy-model.md) for resources, recipes and tuning.

## Goal and constraints

Target is **modest, real revenue** — a few thousand a month. Not a venture-scale hit. That drives
scope, player-friendly monetization, and a bias toward proven patterns.

Two people. The owner designs and prototypes in the web build; an engineer ports to Unity for iOS
and Android. The web build is the **design lab**; Unity is the **shipping product**.

## The organising principle: tonal coherence

The game's competitive advantage is not a mechanic. It's that it is a **cozy magical garden with a
talking flower** — a specific, warm, coherent world.

Every region must belong to that fiction. This is the cheapest advantage available and the easiest
to squander. A mine full of grey ore or a chicken coop pulls the game toward generic farm-sim,
where it competes with Hay Day and loses.

Concretely: **bees instead of chickens, a nursery instead of a mine.** Same production fantasies,
but they reinforce the brand instead of diluting it.

## World structure

One **contiguous map that grows outward**, not a hub screen with separate rooms.

The garden is the starting plot. Zooming out reveals adjacent land — hives at the meadow edge, a
potting shed behind the wall, an apothecary on the lane, a market at the road. Everything owned
stays visible at once, and land unlocks clear outward.

Chosen over hub-and-spoke because the visible sprawl *is* the reward and the store screenshot, a
two-minute session can still touch several systems with no context switching, and one camera with
one scene is far cheaper than N region screens. It's the Township / Hay Day village pattern, proven
in exactly this genre.

## The crafting tier is mandatory

A graph where regions produce raw resources and the Market consumes them **leaves regions
parallel** — players simply farm whichever raw pays best.

The fix is a processing layer in the middle. The Garden makes flowers, the Apiary makes honey, the
Apothecary combines them into perfume, and the Market wants *perfume*. Now neither region can be
skipped, because the dependency is structural rather than a matter of pricing.

This layer is also the cheapest content lever in the project — a new recipe is a data row — and it
matters more than any minigame.

## The five regions

Ranked by confidence, which is also the build order.

### 1. The Garden — *flowers, seeds* — **built**

Tap, plant, harvest on timers. Two-to-five-minute cadence. The heartbeat, and the thing that is
always ready when the app opens. Home of the talking flower and the emotional centre of the game.

### 2. The Apiary — *honey, wax, pollination* — **demoted 2026-08-14, no longer a region**

> **This is no longer a region.** Bees fold into the Garden as an **adjacency effect** — a flower
> that attracts them, a lift to neighbouring plots, honey as an occasional drop. The dock tab goes.
> Reasoning in [10-decision-log.md](10-decision-log.md).
>
> The argument below was that honey-follows-bloom makes the garden's *contents* matter. That
> instinct was right and the mechanism was wrong: it makes contents matter to a **second** economy
> sitting beside the first, rather than to the garden itself. Per-plant verbs and adjacency make
> contents matter *in place*, which is cheaper and reinforces the core loop instead of competing
> with it. See
> [17-market-and-positioning.md](17-market-and-positioning.md#why-plant-this-flower).
>
> Keep the visual language — amber jars, drifting bees, honeycomb — it is still free store
> screenshots. Only the separate production chain is cut.

Hives at the garden's edge.

**Honey type follows what is currently blooming.** Lavender in the ground yields lavender honey.
Retained as the rule for whatever honey survives the rework — sampling at production time, never at
collection time (see [03-systems.md](03-systems.md)).

Bees also generate **pollination**, a buff that raises garden yield, closing a visible cause-and-
effect loop inside a single session. **This part survives intact** and becomes the model for the
adjacency rework.

### 3. The Potting Shed — *rare seeds* — **merge**

The one genuinely new mechanic. Drag two seeds together for a better seed; sprouts merge into
saplings, saplings into rare blooms. Literally plant breeding, so mechanic and fiction are the same
thing and there is no metaphor to explain.

**Merge was chosen over match-3** for four reasons:

- **Content efficiency**, the decisive factor at this team size. Match-3 players burn fifty
  hand-designed levels a week; that treadmill kills small teams. A merge item tree entertains for
  months.
- **Cheaper to build.** No cascade resolution, blocker taxonomy, booster interactions or level
  editor. A grid, drag-and-drop, and a recipe table.
- **Best-performing casual mechanic of the current era** — Merge Mansion, Travel Town, and Gossip
  Harbor, which is already on the reference list.
- **Slower and more deliberate**, which suits a cozy game better than match-3's pressure.

Output is rare seeds, which feed straight back into the Garden.

### 4. The Apothecary — *perfume, tea, preserves, candles, salve* — recipe crafting

The processing tier. Timer-based crafting queues in the Township factory style — not a minigame.

Every recipe requires output from at least two regions. Infinitely extensible, authorable as data
without engineering, and where the theme gets to be charming: moonflower tea, lavender salve, rose
perfume.

### 5. The Market — *coins, reputation, land* — orders

The engine and the goal generator. Specified fully in [13-order-system.md](13-order-system.md).

A queue of requests, each spanning several production chains, paying coins, reputation, story beats
and land unlocks. This is what forces everything else to keep running, and later it is the entire
liveops surface.

## The resource graph

```
                    ┌──── pollination ────┐
                    ▼                     │
   rare seeds ──► GARDEN ──── flowers ──► APIARY ──┐
        ▲            │                              │
        │            │ flowers, seeds     honey, wax│
   POTTING SHED ◄────┘                              ▼
     (merge)                              APOTHECARY
        ▲                                      │
        │                       perfume, tea, preserves
        │                                      ▼
        └──────── coins, land ◄──────────── MARKET
                                               │
                                          reputation
                                               ▼
                                    land, recipes, seed tiers
```

Three interlocking cycles:

- **Garden → Apiary → pollination → Garden.** Tight and fast; teaches interdependence in the first
  session.
- **Garden → Potting Shed → rare seeds → Garden.** The progression loop.
- **Garden + Apiary → Apothecary → Market → coins → Garden.** The money loop.

## Locked decisions

Agreed and not to be relitigated without a reason.

**Land unlocks via Market reputation, not coins.** Idle games inflate coins unpredictably;
reputation from completed orders is a controlled gate and forces engagement with the whole graph
rather than one region.

**Reputation is the single global progression track.** It gates land, recipes and seed tiers. One
number, not parallel systems.

**Tickets are retired.** Boosts are earned inventory (quests, level-ups, later orders and rewarded
video), not a gem shop. Migrated saves convert leftover tickets to gems at 5:1.

**Water is not a tracked resource.** It's friction without fun, and it would add a currency for no
gain. Watering stays a *tap interaction* that speeds growth — which the existing `hasten()` already
implements.

**Storage caps on raw materials**, generous and upgradeable. Standard lever for return visits, and
capacity upgrades are a good coin sink. No caps on crafted goods.

**Offline production runs at full rate, capped around eight hours.** Generous enough to feel kind,
bounded enough that daily play matters. A longer cap is a plausible premium upgrade later.

**Honey type follows current blooms.** See the Apiary section.

## Currency policy

Casual players fall off a cliff past four or five tracked quantities. Keep the tiers strict:

| Tier | Members |
| --- | --- |
| Raw materials | Flowers (by variety), Seeds, Rare Seeds, Honey (by variety), Wax |
| Crafted goods | Perfume, Tea, Preserves, Candles, Salve |
| Soft currency | Coins |
| Hard currency | Gems |
| Progression track | Reputation *(earned, never spent)* |

Adding anything to this list requires removing something else.

## What was cut, and why

**Mining and ore.** Tonally wrong, and grey rock is the least appealing thing you can put in a
screenshot. If a hard-material resource is ever needed, geodes in a moonlit cave could be made
whimsical, but it's a stretch — leave it.

**Chickens and eggs.** Not bad, just generic. Pulls toward Hay Day, where this game cannot win.
Bees deliver the same production fantasy while reinforcing what makes the game distinct.

**Pachinko.** Too shallow to carry a region. Fine later as a *reward delivery* device — a plinko
drop for a daily bonus is cheap and satisfying.

**Deferred, not cut: the Critter Grove.** Attract hedgehogs, rabbits and butterflies by planting
specific flowers; they forage items for you. Cozy-correct, collection-driven, monetizes through
completionism. A strong candidate for region six.

## Session shape

Four to six visits a day, two to four minutes each. Stagger timers so something is always ready.

| Region | Cadence |
| --- | --- |
| Garden | 2–5 min — the "always something to do" layer |
| Apiary | 20–40 min |
| Potting Shed | Gated by merge board energy or generator cooldown |
| Apothecary | 5 min to several hours, depending on recipe tier |
| Market orders | Refresh several times daily, plus a long premium order |

**Opening the app must never present an empty screen.** Something is always collectable.

Lean on the talking flower for the emotional half of retention. A character who notices you were
away, reports what finished, and reacts to a completed order is worth more than any timer tuning —
and costs writing, not engineering.

## Monetization

Player-friendly, matched to the modest-revenue target. At this scale reputation compounds and
squeezing does not.

- **Rewarded video**, the main earner in casual and opt-in: double a harvest, skip a craft timer,
  extra merge board space, reroll an order.
- **Starter pack** around $2.99, offered only after several committed sessions.
- **Remove ads** IAP.
- **Cosmetic decor** for gems — framework already exists.

Explicitly avoid hard paywalls, aggressive energy and predatory limited-time offers. They optimise
for a whale economy this game won't have the traffic to support.

## Distribution

Ship the **web build to Poki and CrazyGames in parallel** with mobile. The build exists, those
portals pay revenue share and supply their own traffic, and it's the cheapest retention data
available. Mobile at any revenue level needs discoverability that web portals hand over free.

## What the Unity engineer needs

1. **Every number lives in data, not code.** Grow times, costs, drop rates, recipe requirements,
   order contents, curve exponents — ScriptableObjects or JSON, wired to remote config. If changing
   a grow time requires a build, tuning stops, and an untuned economy is the most common cause of
   death in this genre. This decision matters more than anything else in the port.
2. **Platform shell before gameplay.** Store setup and build pipeline, IAP with receipt validation,
   ad mediation, analytics with funnel events, remote config, cloud save, push notifications.
   Independent of ongoing design and on the critical path to earning anything.
3. **The web build is the feel reference** — animation timing, the feedback ladder in
   [06-audio-and-fx.md](06-audio-and-fx.md), and the numbers in [04-economy.md](04-economy.md).
   Port the feel, not the DOM architecture.

## Still open

- How much story, and delivered how — flower dialogue only, or a character per region?
- Does the merge board share space with the garden view or open as its own screen?
- Do rare seeds replace the existing 19-seed tier list, or extend it?
- What happens to the existing Wonder Effect in a multi-region world — global, or garden-only?
- ~~Decor: purely cosmetic, or does it keep its stat bonuses?~~ **Resolved: cosmetic.** See
  [15-navigation-and-ia.md](15-navigation-and-ia.md).

## Prototype status

The smallest closed version of the loop is playable in the web build, behind two new dock tabs.
Verified by `node tools/sim-test.js`.

**Built.** Hives producing honey on a timer, capped by capacity. Honey variety sampled from what is
actually planted, at the moment each jar is produced. Beeswax as a secondary drop. Pollination
raising every harvest. Flowers kept as an inventory item on harvest, alongside the usual credits.
Three Apothecary recipes on a two-slot timed bench, each requiring output from two regions, one of
them requiring a *named* honey. Selling raws and crafted goods for credits.

**Deliberately left out.** Storage caps, which are a locked design decision but would add friction
that muddies the only question the prototype is meant to answer. The Potting Shed, the Market, the
world map, reputation and land. Crafted goods currently sell for credits because there is no order
board yet; orders are meant to pay well above these prices.

**Temporary.** The Apiary and Craft *dock tabs* are a shortcut, not the design. Regions belong on
the map — see [15-navigation-and-ia.md](15-navigation-and-ia.md).

**What to look for when playing it.** Does the garden's *contents* start mattering — do you find
yourself planting lavender because you want lavender honey? Does collecting jars pull you back into
the app? Does the bench feel like a reason to harvest, or like homework? Is checking three places
per session pleasant or fussy?

If the answer to the first question is yes, the pattern extends to every other region and the
design holds. If it is no, the crafting tier needs rethinking before anything else gets built.

## Next steps

1. ~~Lock the resource graph~~ — done, above.
2. ~~Order system specification~~ — [13-order-system.md](13-order-system.md).
3. ~~Economy model skeleton~~ — [14-economy-model.md](14-economy-model.md).
4. ~~Prototype the Garden ↔ Apiary loop~~ — done, see above.
5. **Play it, then decide.** Tuning real numbers, and whether the Potting Shed or the Market comes
   next. The Market is the safer bet: it is the goal generator, and the prototype currently has no
   reason to want anything.

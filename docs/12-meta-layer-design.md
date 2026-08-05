# Meta-Layer Design — Multi-Region World

**Status: design, not built.** Nothing in this document exists in code yet. The shipped game is
the single garden described in [03-systems.md](03-systems.md). This is the agreed direction for
what comes next.

## Goal and constraints

The target is **modest, real revenue** — a few thousand a month — not a venture-scale hit. That
choice drives everything below: player-friendly monetization, small scope, and a bias toward
proven patterns over novelty.

Team is two people. The owner designs and prototypes in the web build; an engineer ports to Unity
for iOS and Android. The web build is the **design lab**; Unity is the **shipping product**.

## World structure

The garden becomes the starting plot of one **contiguous map that grows outward**, not a hub
screen with separate rooms behind it.

Zooming out reveals adjacent land — a mine on the hillside, a coop by the stream, a market at the
road. Everything you own stays visible at once. Land is unlocked by clearing outward.

This was chosen over hub-and-spoke deliberately:

- The visible sprawl *is* the reward, and it's what makes a good store screenshot or short video.
- No context switching, so a two-minute session can still touch several systems.
- One camera and one scene is far cheaper for a two-person team than N region screens.

It's the Township / Hay Day / Coin Master village pattern, and it's proven in exactly this genre.

## Resource graph

The regions must form **cycles**, so no region is a dead end and none can be safely ignored.

```
        ┌──────────────── water ─────────────┐
        │                                    ▼
   ┌─ SPRING                              GARDEN ──── flowers ──┐
   │      ▲                              ▲   │                  │
   │      │                    fertilizer│   │ grain            ▼
  ore     ore                            │   ▼                MARKET
   │      │                              COOP ──── eggs ────────▲
   │      └──────────── ore ──────────── ▲                      │
   ▼                                     │                      │
  MINE ◄────────────── tools ────────────┘         ore ─────────┘
   │
   └── gems ──► premium decor
```

| Region | Verb | Produces | Consumes |
| --- | --- | --- | --- |
| Garden | Tap, plant, harvest *(built)* | Flowers, grain | Water, fertilizer |
| Spring | Idle production | Water | Ore (for upgrades) |
| Coop | Idle production, later pachinko | Eggs → fertilizer | Grain |
| Mine | **Match-3** | Ore, gems | Tools |
| Market | Fulfil orders | Coins, story, land unlocks | Flowers, eggs, ore |

Ore is the universal sink — it upgrades buildings in every region.

**Build the garden → coop → fertilizer → garden cycle first.** It's the smallest closed loop that
proves the whole concept. If that isn't fun, adding three more regions won't save it.

## The order system is the engine

This is the piece that turns the graph above from a diagram into gameplay.

Nothing else in the design consumes *multiple resources at once*. Without that, players optimise
whichever region has the best rate and ignore the rest — interdependence exists on paper but is
never felt.

The Market runs a queue of **orders**, each requesting a bundle spanning several regions (three
flowers, two eggs, one ore), paying coins, story beats, and land unlocks. This is Township's
actual engine.

Why it earns its place:

- Forces every production chain to stay running.
- Infinitely extensible content lever — new orders cost data, not code.
- Cheap to build relative to any minigame.
- Becomes the liveops surface later: seasonal orders, timed events, special requests.

Design it early and make orders **data-driven** so they can be authored and tuned without an
engineer.

## Do not build four minigames

The strongest constraint in this document.

Match-3, pachinko, and friends are each a full game's worth of tuning, art, tutorial, and bug
surface. A two-person team building four of them ships four shallow games, and shallow is what
kills retention.

Players do not need four distinct mechanics. They need four distinct **rewards and visuals**.

So:

- **One** genuinely different verb: **match-3 in the mine**. It's the most proven casual mechanic
  available and needs almost no tutorial.
- Everything else ships as timer-and-tap production with its own art, animation and character —
  mechanically a cousin of the garden, emotionally its own place.
- Only after the map structure demonstrably retains players, replace one timer region with a real
  second mechanic. Pachinko in the coop is the natural candidate, since egg-drops suit it.

**Rule of thumb:** every proposed new mechanic must beat the timer version in a test before it gets
built.

## Gating the active regions

Match-3 needs a limit or it prints infinite currency. The industry default is lives or energy on a
refill timer, which is also the most resented mechanic in casual gaming.

Use an **in-economy consumable instead**: pickaxes crafted from garden or spring output, or tool
durability repaired with ore. Same throttling effect, reinforces interdependence rather than
fighting the player, and far less likely to trigger an uninstall. Bundles can be sold later if
needed.

## Session shape

Design for four to six visits a day, two to four minutes each. Stagger timers so something is
always ready:

| Region | Cadence |
| --- | --- |
| Garden | 2–5 min — the "always something to do" layer |
| Coop | 20–40 min |
| Mine | Gated by tool consumables, a few sessions a day |
| Market orders | Refresh several times daily, plus a longer premium order |

**Opening the app must never present an empty screen.** Something is always harvestable.

Lean on the talking flower for the emotional half of retention. A character who notices you were
away, reports what finished, and reacts to a completed order is worth more than any timer tuning —
and it costs writing, not engineering. It is the project's genuine differentiator, more so than any
minigame.

## Monetization

Player-friendly, appropriate to the modest-revenue target. At this scale reputation compounds and
squeezing does not.

- **Rewarded video** — the main earner in casual, and opt-in: double a harvest, skip a timer, extra
  match-3 moves, reroll an order.
- **Starter pack** around $2.99, offered only after the player has committed a few sessions.
- **Remove ads** IAP.
- **Cosmetic decor** for gems — the framework already exists.

Explicitly avoid hard paywalls, aggressive energy, and predatory limited-time offers. They optimise
for a whale economy this game won't have the traffic to support.

## Distribution note

Ship the **web build to Poki and CrazyGames in parallel** with mobile development. The build already
exists, those portals pay revenue share and supply their own traffic, and it is the cheapest
retention data available. Mobile at any revenue level needs discoverability that web portals hand
over for free.

## What the Unity engineer needs

Ordered by how much time it saves later.

1. **Every number lives in data, not code.** Grow times, costs, drop rates, order contents, curve
   exponents — ScriptableObjects or JSON, wired to remote config. If changing a grow time requires
   a build, tuning stops, and an untuned economy is the most common cause of death in this genre.
   This single decision matters more than anything else in the port.
2. **Platform shell first, not the garden.** Store setup and build pipeline, IAP with receipt
   validation, ad mediation (AppLovin MAX or Unity LevelPlay), analytics with funnel events, remote
   config, cloud save, push notifications. This work is independent of ongoing design and sits on
   the critical path to earning anything.
3. The web build is the **feel reference** — animation timing, feedback ladder, and the numbers in
   [04-economy.md](04-economy.md). Port the feel, not the DOM architecture.

## Open questions

Not yet decided:

- Does land unlock with coins, order completions, or story progress?
- Is there a global level or reputation track, and what does it gate?
- How much story, and delivered how — flower dialogue, or characters per region?
- Do resources have storage caps? (Caps drive session frequency but frustrate; Township uses them.)
- Offline production: full rate, reduced rate, or capped duration?
- Where does the existing gem/ticket economy fit once ore and eggs exist? It may need collapsing —
  five currencies is too many.

## Next steps

1. Lock the resource graph.
2. Build the economy spreadsheet — rates, costs, timers. **The spreadsheet is the game**; code just
   renders it.
3. Spec the order system: generation, scaling, rewards.
4. Screen flow for zoom-out and land unlocking.
5. Prototype the garden → coop → fertilizer loop in web and confirm interdependence is actually fun
   before committing to five regions.

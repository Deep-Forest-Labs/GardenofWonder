# The World Map — Research and Design

**Status: research and design, 2026-08-25. Nothing here is built except `tools/map-spike.html`,
which is the agreed art and camera reference.** Companion documents:
[12-meta-layer-design.md](12-meta-layer-design.md) for the world this map serves,
[13-order-system.md](13-order-system.md) for the order engine,
[15-navigation-and-ia.md](15-navigation-and-ia.md) for the dock-is-meta reframe,
[17-market-and-positioning.md](17-market-and-positioning.md) for the wider market research this
extends. Like that document, this one goes stale on its own — figures are from August 2026.

## The owner's framing, which this document answers

**"A new-age FarmVille: incremental, idle, and a tapper."** Zoom out from the garden and it becomes
one plot among many — potentially many flower gardens, maybe fields of wheat and corn, maybe a barn
with chickens, and a place where a line of customers waits for perfume, a dozen eggs, a bouquet of
roses. Collect a finished garden with one tap. The question asked: what does the market say has the
highest probability of success, and what exactly should be on this map?

## What the market says, in numbers

The farming-adjacent market splits into four families. The numbers below are the load-bearing facts.

| Game | Shape | Scale | What it proves |
| --- | --- | --- | --- |
| **Hay Day** (Supercell) | Full farm-sim live-ops | ~$13–16M/mo, ~$1.7B lifetime, 15M MAU, 14 years old | The fantasy has enormous tenure. Revenue is **Farm Pass**-driven since 2020; retention is credited to **neighborhoods and derbies** — social live-ops. |
| **Township** (Playrix) | Farm + city + orders | $2.1B lifetime, 600M downloads, 5M DAU | One town, many *different* production buildings, orders by train/plane/ship, co-op Regatta. |
| **Gossip Harbor** (Microfun) | **Merge + orders + story** | $1.2B lifetime; passed **$100M in a single month**, Q1 2026 +172% YoY | The hottest casual shape of 2026 is a merge board feeding a **queue of customers**. Travel Town ($593M) and Merge Mansion ($503M) are the same triangle. |
| **Family Island** / Klondike | Energy-gated adventure farm | ~$4M/mo / ~$2M/mo | Energy monetizes hard and is the anti-cosy pattern. Rejected for tone, not for revenue. |
| **FarmVille 2: Country Escape** | The surviving FarmVille | **~$500K/mo**, 12 years old | The brand is dead; the **order board** is what keeps the survivor breathing — its events literally refill the order board every 8 hours. Original FarmVille died of repetition and platform, not of farming. |
| **Grow a Garden** (Roblox) | Idle garden phenomenon | 22.3M peak CCU, 251M MAU | **One garden.** Not ten. Depth came from seed-shop rotation, mutations, weather and pets — everything this game already borrowed. |
| **Egg, Inc.** | Idle, "multiple farms" | ~1M weekly actives, 10 years | Its many farms are **sequential** (each new egg is a fresh farm — prestige), never parallel. Generosity is its stated moat. |
| **Idle Miner Tycoon** (Kolibri) | Parallel instanced producers | ~60% of revenue from rewarded ads, D1 63–81% | The one success built on *parallel same-shaped areas* — and it is the spreadsheet end of the genre, differentiated by continent currencies and carried by relentless live-ops. |
| **Cats & Soup** | Cozy idle | ~$300K/mo on 10M+ installs | What *winning* looks like at cozy-idle scale — and it has Netflix distribution. |

Context: Sensor Tower's 2026 reporting has simulation as the most-downloaded genre (~20% share),
demand for relaxing games growing, and **rewarded ads' share of the ad mix up 54% year on year** —
the wind is behind exactly the monetization this project already chose.

## The five findings that should shape the map

### 1. The order queue is the universal engine — build it first

Every survivor in every family runs one: Hay Day's truck and boat, Township's trains and planes,
FarmVille 2's order board, and the merge games' customer queues at $100M/month. It is the demand
side that makes every supply system mean something, and it is **already fully specified** in
[13-order-system.md](13-order-system.md). The owner's image — a line of customers wanting perfume,
eggs, a bouquet — *is* that spec. This is the highest-probability piece on the whole map and the
anchor everything else should be sequenced around.

### 2. Nobody at the top runs N identical gardens in parallel

The evidence is one-sided. Hay Day and Township are **one farm with many *different* production
buildings**. Grow a Garden is **one garden**. Egg, Inc.'s farms are **sequential**, not parallel.
The only parallel-instance success, Idle Miner Tycoon, differentiates every continent and pays for
its sameness with live-ops this team cannot staff. Ten flower gardens that differ only in which
flower grows is the AdVenture Capitalist decay pattern at map scale — the exact disease
[17-market-and-positioning.md](17-market-and-positioning.md) documents in the seed ladder.

**The version of the owner's idea the market does support: specialized gardens, few and
different.** Not ten clones — three or four *biomes*, each garden-shaped but mechanically its own
place. See "The map inventory" below.

### 3. Merge + orders is the hottest combination in casual — and both halves exist here

Gossip Harbor's triangle is merge board + customer orders + drip story. This project has a **built
merge simulation** (the Potting Bench, parked with no surface), a **fully specified order system**,
and a **talking flower** that is already the story voice. The market is pointing at a triangle
whose three corners are all sitting in this repo. That is a strong argument for the bench shipping
its surface as a *place on the map* rather than being deleted.

### 4. The production fantasy does not require wheat, corn, or chickens

What Hay Day actually sells is *transformation* — raw thing in, charming good out, customer pays.
The skin is negotiable, and the 2026-08-14 tonal decision ("bees instead of chickens, a nursery
instead of a mine") already named why generic farm content is a losing lane: it moves the game onto
Hay Day's home field, where a two-person team cannot win, and off its own — the kodama-cosy
botanical world nobody else occupies. Honey, teas, perfume, preserves and bouquets deliver eggs'
and wheat's entire economic role in the game's own voice.

**And this game already has livestock — the creatures.** Pip and the roster are producers with
names, faces, food, sleep and keepsakes. A barn of generic hens beside a burrow of characters would
split the animal fantasy across two systems and the generic one would cheapen the characterful one.
If animal *produce* needs to scale, the answer is more creatures and richer keepsakes, not a
second, worse animal system. *(The owner re-raised chickens on 2026-08-25, so this stays an open
call — but the recommendation is unchanged from 2026-08-14.)*

### 5. One-tap collection is right, and it is an ad placement

The zoomed-out collect-all is validated (Idle Miner's whole overworld works this way) with the
guardrails already recorded in [10-decision-log.md](10-decision-log.md): the map collects the
boring half (coins, raw flowers), the garden keeps the interesting half (mutations, rarity,
keepsakes, packs, the tap loop), and a region only shows its bubble once **fully automated** —
which turns the drone into an unlock instead of a percentage. A 2× rewarded video on that
collect-all is the best-converting placement in casual, and with ~60% of Idle Miner's revenue
coming from exactly this pattern, it is the map's honest revenue argument.

## What was looked at and deliberately not taken

- **Battle pass.** Hay Day's revenue is Farm Pass-led — and that is the cost of entry at Supercell
  scale, not a pattern two people can run. Already ruled out in
  [17-market-and-positioning.md](17-market-and-positioning.md); the research here reconfirms it.
- **Energy.** Family Island's $4M/mo is real and the mechanism is the anti-cosy pattern. The
  "cosy, not demanding" pillar is the product; energy would spend it.
- **Co-op social (derbies, regattas).** The retention engine of the giants and a server this team
  does not have. The dock's Friends slot stays **reserved, not built**.
- **Match-3 minigames** (Township's second engine). Already rejected 2026-08-14 for the level
  treadmill; merge replaced it.

## The map inventory

What belongs on the map, in the order it should arrive. Phases are separately shippable; each one
is judged before the next starts.

### Phase A — the frame *(spike done, build next)*

The camera, the swipe ladder (map → garden → Hollow), the meta dock
(Friends · Cards · World · Quests · Shop), the garden thumbnail with cross-fade hand-off, the
burrow mouth, and **three locked silhouettes with prices**. Nothing new to *do* — the frame kills
the dead Apiary/Craft tabs, creates the store screenshot, and puts the aspiration surface on
screen before content exists to fill it.

### Phase B — the Garden Stand *(the anchor)*

The order queue as a **place**: a stand at the lane's edge where customers visibly walk up and
wait. The lane in the spike art already leads here. Build order inside it follows
[13-order-system.md](13-order-system.md): three slots, flowers-only orders first, then honey, then
crafted goods as the bench comes online. This is where reputation starts, and reputation is what
buys land — which makes the Stand the engine that sells the map's own parcels.

### Phase C — the Potting Shed *(the bench gets its surface)*

The merge board becomes a building on the map, port of the `tools/merge-spike.html` drag work.
Its goods exist to feed Stand orders — the Gossip Harbor triangle, in this game's voice. This also
resolves the bench's parked-with-no-surface status honestly, and un-pauses its three quests
([21-potting-bench.md](21-potting-bench.md)).

### Phase D — specialized gardens, one at a time

The owner's many-gardens instinct, shaped by finding 2. Each is garden-shaped but mechanically its
own place, with its own clock and its own creatures. Candidates, cheapest first:

| Biome | Identity — what makes it not a clone |
| --- | --- |
| **The Orchard** | Trees: very long timers, huge payouts — the offline/overnight layer. Fruit feeds preserves at the bench. |
| **The Night Garden** | Only wakes at night (the epoch clock exists). Home of Moonflower, Starlit Iris, Luna and Ember. Nightbell's verb becomes a place. |
| **The Wild Meadow** | The bee layer — hives live here, honey follows what blooms, pollination drifts to adjacent parcels. Resolves the apiary question: **a place on the map, not a dock tab**, keeping the 2026-08-14 demotion's spirit (no separate production chain) while giving bees a home. |
| **The Greenhouse** | Controlled weather: the mutation-farming garden. Gems' "call a sky" verb becomes architecture. |

Ten gardens is not the plan; two to four *different* ones, arriving as the economy needs supply
breadth, is.

### Later, or never

- **Wheat, corn, barns, chickens** — see finding 4. Open call, recommended against.
- **Map decoration layer** — validated (decoration is a top motivation for this audience), but it
  arrives after the Hollow's Decorate proves the memento economy.
- **A second currency per region** (Idle Miner's continents) — no, until prestige design demands it.

## Probability ranking

The owner asked for bets ranked by likelihood of contributing to real revenue. Confidence is about
*this team shipping it to effect*, not the pattern in the abstract.

| Bet | Confidence | Why |
| --- | --- | --- |
| Order queue at the Garden Stand | **Very high** | Universal across every surviving comparable; already specified; the demand engine everything else lacks. |
| Map frame, parcels, land-by-reputation | **High** | Aspiration surface + the store screenshot; cheap after the spike. |
| Potting Shed surface feeding orders | **High** | The 2026 market's hottest triangle; both halves already exist in the repo. |
| Collect-all + 2× rewarded video | **High** | Best-converting ad placement in casual; gated on automation so it also sells drones. |
| 2–4 specialized garden biomes | **Medium-high** | Supported *if* each is mechanically distinct; the clone version is the documented decay pattern. |
| Generic crops and livestock | **Low** | Hay Day's home field; tonal cost; the creatures already fill the slot. |
| Social/co-op layer | **Low (now)** | The giants' real engine, but it is a server and a second job. Reserve the slot. |

## Sources

- [Hay Day monetization dissection — Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/hay-day-monetization) · [How Hay Day continues to make millions — CellString](https://cellstring.com/news/article/how-hay-day-continues-to-make-millions-after-14-years)
- [Township at 10: $2.1bn, 600m downloads — Mobilegamer.biz](https://mobilegamer.biz/playrixs-township-is-10-and-still-growing-after-2-1bn-revenue-600m-downloads/)
- [Gossip Harbor's meteoric rise — Naavik](https://naavik.co/digest/gossip-harbors-meteoric-rise-in-merge/) · [Finding genre success: Gossip Harbor — Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2024/8/19/finding-genre-success-the-case-of-gossip-harbor) · [Travel Town deconstruction — Gamigion](https://www.gamigion.com/travel-town-deconstruction-merge-2-whales/)
- [Family Island monetization — Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/family-island-monetization)
- [FarmVille shutdown — Game Developer](https://www.gamedeveloper.com/business/zynga-is-shutting-down-i-farmville-i-after-over-a-decade) · [What happened to FarmVille — ProductMint](https://productmint.com/what-happened-to-farmville/) · [FarmVille 2: Country Escape guide 2026 — FarmVille Freak](https://farmvillefreak.com/farmville-2-country-escape-guide/)
- [Grow a Garden — GameDaily](https://gamedaily.com/games/everything-about-grow-a-garden-the-cozy-idle-sim-revolutionizing-roblox-revenue) · [Grow a Garden — Wikipedia](https://en.wikipedia.org/wiki/Grow_a_Garden)
- [Egg, Inc. as idle monetization gold standard — PocketGamer.biz](https://www.pocketgamer.biz/comment-and-opinion/63770/egg-inc-idle-games-gold-standard/)
- [Kolibri Games on idle success — WN Hub](https://wnhub.io/news/other/item-16505)
- [Sensor Tower: State of Gaming 2026](https://sensortower.com/blog/state-of-gaming-2026)

Figures from third-party estimators (Sensor Tower, AppMagic and press citing them) are directional,
not audited. The confidence notes in
[17-market-and-positioning.md](17-market-and-positioning.md#confidence-notes) apply here too.

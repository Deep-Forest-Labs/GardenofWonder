# Market and Positioning

**Status: research, dated 2026-08-14.** Unlike the rest of this folder, this document describes the
*market*, not the game. It goes stale on its own — treat figures older than a year as directional and
re-check anything load-bearing before betting on it.

Its job is to answer three questions: is there room for this game, who is it actually for, and what
makes an individual flower worth wanting.

## The short version

1. **The lane is proven and unserved.** Farming sim did **$576M in H1 2026, +15% YoY, on 172M
   downloads** — and all eight titles that crossed $100K/month target Eastern markets. A bright,
   Western-appeal, non-gacha garden game is a real gap on iOS and Android.
2. **Demand is proven — on Roblox, not mobile.** *Grow a Garden* (March 2025) hit **22.3M concurrent
   users**, beating Fortnite's all-time record of 15.3M, and a billion visits in 33 days. Buy seeds,
   grow, harvest, sell. No combat, no fail state. Audience skews **16–24**, not children.
3. **The gap is closing.** *Grow a Garden* clones already ship on both stores. Speed and craft are
   the moat now, not the idea.
4. **The default outcome is invisibility.** **1,087 idle/clicker games released in 2026 earned
   ~$3.97M combined** — about **$3,650 lifetime per title**. Escaping that bucket is the job.

## Who this game is for

The most important finding in this document, and the one that should shape design priorities.

**Quantic Foundry, n = 1,924,157 players:** the Family/Farm Sim cluster (Sims, Harvest Moon, Animal
Crossing, Stardew) is **69% female**, against an 18.5% sample-wide average. For women, the two most
common *primary* motivations are:

- **Completion** — get all the stars, fill the collection
- **Fantasy** — be someone else, somewhere else

Men skew toward Competition, Destruction and Challenge. Design consequences:

| Finding | Consequence for Garden Wonder |
| --- | --- |
| Completion is the #1 primary motivation | **The Almanac is the spine, not a side system.** It deserves to be the best-built thing in the game. |
| "Design" ranks high | Garden layout and decoration outperform raw number-go-up. Decor being cosmetic is right; decor being *small* is not. |
| Fantasy is carried by art and character | Art direction and the talking flower are load-bearing, not polish. |

**Supporting case — Finch** (self-care pet app, ~75% women aged 25–35, bootstrapped to roughly
$30–40M ARR): **D1 54% / D7 37%**, beating Royal Match (40%/25%) and matching Duolingo. Its levers
are dopamine-dense micro-rewards, low decision fatigue, and **non-punitive streaks**. Its
home-screen widget is an always-on retention surface at zero annoyance cost.

Caution from the same source: players receiving **more than two streak notifications a week are 41%
more likely to abandon the app.**

## The differentiator

Cozy mobile is visually dominated by muted pastels, lo-fi and pixel art — Terrarium: Garden Idle,
Window Garden, Cozy Farm Idle, Honey Grove. **Almost nobody applies Mario Wonder-grade
squash-and-stretch, thick outlines, saturated colour and confetti juice to an idle garden.**

That is craft, not content volume — precisely the axis where two people with a strong designer
out-execute a studio. The "every tap answers" pillar in [01-overview.md](01-overview.md) is not
polish; it is the product. Royal Match is the proof at scale: a thirty-year-old commodity mechanic,
$3B+ lifetime, differentiated almost entirely on feedback quality.

## Why plant *this* flower

The project's longest-standing open question. Bloom Mastery did not answer it (see
[10-decision-log.md](10-decision-log.md)), and orders alone do not either — an order makes a flower
*instrumentally* wanted, which is a quota, not desire. The genre solves it with stacked structural
devices. Ranked by leverage per hour for a two-person team:

### 1. Per-plant unique verbs with adjacency — the strongest device

**Cookie Clicker's Garden minigame** is the closest existing analogue to this game and is rarely
cited. Forty-plus species where each does something *structurally different*:

| Plant | Effect |
| --- | --- |
| Baker's Wheat | +1% output — the boring baseline |
| Nursetulip | Surrounding plants +20% efficiency, but −2% output. An AoE buff with a real cost |
| Tidygrass | A 5×5 area develops no weeds |
| Bakeberry | Harvest at maturity for a burst payload |
| Elderwort | Immortal, and ages surrounding plants 3% faster |
| Crumbspore | Explodes into free production when it dies — it dies *usefully* |
| Brown Mold | 50% chance to contaminate orthogonal neighbours — actively hostile |

Because effects are AoE and adjacency-based, **the garden becomes a layout puzzle rather than a
shopping list.** You plant this flower because of what is next to it.

Ten flowers with distinct verbs generate more perceived depth than a hundred with ascending numbers,
at a fraction of the art cost. It also structurally defeats min-max convergence: there is no single
dominant answer when effects are *categorical* rather than numeric.

This game already has the board — eight plots ringing the flower. Adjacency is existing spatial
layout, currently unused.

### 2. Mutations and variants

*Grow a Garden*'s actual engine. **Gold mutation = 20× base value; Rainbow = 50×**; Wet (rain) = 2×.
Weather events are global, timed, and *trigger* the mutations; players stack odds with sprinklers
placed next to their best crops.

Effect: a common plant and a rare plant both stay interesting, because **any** plant can roll a
jackpot. That decouples excitement from tier position — which is this game's exact failure mode
(see "The AdVenture Capitalist trap" below). It also produces a "look what I grew" screenshot, which
is free marketing.

### 3. Named synergy pairs

Cookie Clicker ships **36 of them**, each a named pair where owning both boosts both. One row of data
and a name apiece. For a botanical game the naming writes itself — companion planting is real
horticulture. It also retroactively makes an old, dull seed interesting when a late partner unlocks.

### 4. Item-as-key

Neko Atsume has **26 rare cats, each behind one specific named goodie** — Sassy Fran behind the
Cardboard Cafe, Ramses behind the Pyramid Tent. Every shop SKU stops being "Tier 4 Toy" and becomes
a character unlock. Melvor Idle does the structural version: an item is desirable because it is the
only way into a downstream activity.

### 5. The memento

Neko Atsume gives **one unique named keepsake per cat**, earned over repeated visits rather than one
drop — Jeeves leaves a Silver Pocket Watch, Ms. Fortune an Oval Coin. Each is a small joke about the
character. Fifty species is fifty small jokes.

### 6. A hidden second form

**Viridi** lets 27 of its 30 real succulent species flower — and **three never do**. Blooms are
visually unique and unpredictable; the community built a photo guide because the blooms *are* the
goal. One extra sprite per species, silhouetted in the Almanac and absent from the shop, converts a
plant from a resource into a promise.

### 7. Flavour text with a voice

Animal Crossing's real secret: Blathers reacts to each donation with a fact and a joke, and the game
**deliberately withholds it on bulk donation** so players donate one at a time to hear him. He is
also *biased* — thrilled by fossils, horrified by bugs — which makes the museum a relationship
rather than a spreadsheet.

Little Alchemy 2 does the non-numeric version: no number appears anywhere, and **the joke is
load-bearing — it hints at what the item can make.**

~150 lines across 50 species is roughly a week of writing and is the cheapest available substitute
for the IP affection that carries every commercial success in this cluster. *Tamagotchi Plaza* sold
500K units at a **Metacritic of 43** on brand affection alone. This project has no such brand, so
the writing must do that job.

### 8. Multi-clock producers

Reference pattern gives producers deliberately different cycle lengths — 20 minutes, 5 hours, 2 days.
One system that serves the fifteen-minute checker and the once-a-day player simultaneously, gives
every species identity beyond yield, and creates genuine bed-allocation decisions.

### 9. Collection sets, sized correctly

From collection-psychology research and GameRefinery's collection-systems study:

- **Optimal set size is 7–12.** Under 7 feels trivial; over 12 feels endless.
- **Never start a player at zero** — pre-loaded progress is the coffee-loyalty-card trick, and blank
  starts are the leading abandonment cause.
- **The 40–60% mark is the tipping point** where players become committed (Zeigarnik effect: 11-of-12
  is far more motivating than 0-of-12).
- **Theme sets, don't index them** — "Moonlit Blooms", not "Page 1".
- The last item should be *moderately* hard. Impossible drop rates read as rigging and trigger
  loss-aversion quits.
- **Completion should improve the collecting engine itself** — Pokémon's Shiny Charm device. Filling
  a page should grant faster germination or better mutation odds, not a trophy.

Market context: collectible albums in top-100 US iOS games rose **from 21% to 72% between Feb 2017
and Jun 2021.**

### 10. External requests

Township runs **four parallel order types**, each paying a *different currency of progress*, so the
same crop is wanted for different reasons at different times. The load-bearing rule: **orders are
dismissable with no penalty** beyond a 30-minute free refresh. That converts "I don't have that"
from a wall into a choice. See [13-order-system.md](13-order-system.md).

## The AdVenture Capitalist trap

The failure mode this game is currently closest to, recorded so it stays visible.

AdVenture Capitalist reached **40M+ players** with charming, distinct-looking businesses — Lemonade
Stand, Shrimp Boat, Movie Studio. Every one did the same thing: produce money at a rate on a timer.
No synergy pairs, no unique verbs, no collection layer, no emergent narrative. Pocket Gamer scored it
**3/10** citing "little reward for progress"; it has decayed to roughly $100K/month.

Garden Wonder's economy currently protects one invariant: **every seed yields exactly 1.4× cost at
Common, across all 19 tiers.** Seeds differ *only* in throughput. That is cosmetic personality on an
undifferentiated multiplier ladder — the documented decay pattern, and the reason a percentage-based
mastery ladder could not make contents matter.

**The test to apply to every unlockable:** can the player explain what changed without opening a
calculator, does it unlock a choice they already understand, and is it still relevant thirty seconds
later?

**The rule that follows:** no two adjacent unlockables should share an effect *category*. Rotate
through rate → capacity → cost reduction → duration → unlock-key → synergy pair.

## Offline progress

The genre's core return mechanic, and currently absent here — automation stops when the tab closes.

**The design to copy is Cookie Clicker's two-axis model**, because it makes "how the game treats you
while away" into a desirable unlock chain rather than a system tax:

- **Rate** — fraction of online income earned while away (theirs: 5% → 75%)
- **Duration** — how long full rate lasts before dropping off (theirs: 1h → 5d 8h)

Two orthogonal axes yield ~14 individually meaningful, nameable upgrades from one system.

**Start generous.** Melvor Idle's 18-hour cap produced a well-upvoted rage-quit thread — *"REQUIRED
to interact with this game EVERY SINGLE DAY"* — and it retreated to 24h; the sequel markets full-rate
offline as a headline feature. Given the "cosy, not demanding" pillar, start near **25% rate / 4h
full rate** and let both climb. **Do not use the cap as a monetization lever.**

**Be transparent about the cap.** Egg, Inc. is explicitly praised for stating its limits openly while
selling upgrades to raise them. Hidden caps read as theft; stated caps read as rules.

**The welcome-back screen is a scene, not a number.** Never show "+4,213 gold while you were away."
Neko Atsume's entire retention is one screen showing *who visited, what they did, and what they
left*. State the duration, itemise what happened as a narrative timeline, disclose whether the cap
bit, and end on what it unlocks next.

## Prestige

Absent by design today; [04-economy.md](04-economy.md) states "no ending, no prestige, no soft wall,"
and progression is authored to level 20 and then stops. For a title with any ceiling ambition this is
the hardest limit in the game.

- **Payout curve:** a sublinear root on lifetime earnings so payout never outruns exponential costs.
  **Cube root** for a slow, ceremonial event (Cookie Clicker); square root for frequent ones
  (AdVenture Capitalist).
- **Framing:** a flat "delete your garden" reset is brand-hostile here. **Seasonal turnover** — the
  garden clears because that is what gardens do, and you keep the seeds — is narratively free and
  makes the reset cozy. **Never use the word "reset."**
- **Authorship:** Cookie Clicker's permaslots let the player choose which upgrades survive, which
  converts loss into a decision.
- **Timing heuristic:** offer it when progress slows to 10–20% of peak speed.

## Monetization

Two research threads disagreed here; the reconciliation matters.

**Cozy players do not reject ads — they reject interruption.** So: rewarded video only, **zero
interstitials, zero banners, no ads in session one**. Rewarded generates ~40% of casual ad revenue
from ~21% of impressions, 74% of players prefer it, and ad density above three per session depresses
casual retention ~27%.

**But do not plan for 80–90% ad revenue.** The warning case is exact: **Terrarium: Garden Idle has
~11M installs and earns roughly $9K/month** — plants as numeric production units, monetized with a
subscription that doubles output. Enormous reach, negligible revenue.

For an *almanac* game the better primary lever is **Little Alchemy 2's content-pack model**: free
base game, ~$3.99 for 100+ new discoverables, optional hints. "More encyclopedia" and "relief from
being stuck" are the most natural things this game has to sell. **Rewarded video is the floor; the
content pack is the ceiling.**

**Best IAP-per-effort in the genre — Egg, Inc.'s Piggy Bank.** It accrues as you play, uncapped, and
cracks for $5.99, so players effectively set their own price and feel they outsmarted the developer.
Zero live-ops. A "Seed Jar" or watering can ports this directly.

### Viable for two people

| Pattern | Verdict |
| --- | --- |
| Rewarded video, 2–3 opt-in placements | **Do first.** Highest return per hour |
| Remove-forced-ads IAP (~$3.99) | **Do.** Must keep rewarded opt-ins intact |
| Accruing piggy-bank IAP (~$5.99) | **Do.** Best IAP-per-effort available |
| Content pack (more species/cards) | **Do.** The natural fit for a collection game |
| Starter pack ($1.99–2.99, D2–D3) | Do. Static, no rotation |
| Cosmetic decor packs | Optional/quarterly — it is a content cost |
| VIP subscription | Not at launch. Consider past ~5K DAU |
| Season/battle pass | **No.** ~40–80 hrs *every season, forever* |
| Scheduled live events | **No.** Use evergreen auto-rotating seasonal themes instead |
| Interstitials, banners, energy, gacha | **No.** Costs the positioning that is the only marketing |

*"No forced ads, no energy timers, no fake timers"* is simultaneously a design decision and the best
free marketing asset available, in the one community that can actually launch this game.

### Regulatory notes

- **Apple Small Business Program = 15%** (≤$1M prior-year proceeds); Google has an equivalent tier.
  **Enrol on day one.** External-payment plumbing is not worth the engineering at this scale.
- **Loot boxes** are banned as gambling in Belgium and the Netherlands, barred to under-18s in Brazil
  from March 2026, and **PEGI now rates them 16+** — which would cost a bright family-appeal game its
  age rating.
- **EU DSA already bans dark patterns**, including fake countdowns, and requires disclosing the
  real-world cost of in-game currency. Enforcement is live.
- **Age-rating trap:** a bright storybook style attracts under-13 traffic, which triggers
  COPPA/GDPR-K child-directed ad treatment and **lowers eCPM.** Choose the rating deliberately.

## Numbers to plan against

Simulation is the right genre proxy; there is no separate "idle" bucket in most benchmark sets.

| Metric | Value |
| --- | --- |
| Simulation D1 / D7 / D30 | **30.1% / 8.71% / 2.96%** |
| Idle top-decile D1 | 45.55% |
| Idle session length (top performers) | **~7 minutes** |
| Idle sessions/day | **~5.8** |
| Idle stickiness (DAU/MAU) | 18%, vs 10.5% hyper-casual |
| Realistic indie ARPDAU | $0.02–$0.05; optimised $0.10+ |
| Store-page conversion | iOS ~8.7%, Android ~17.9% |

**Do not judge this game on D1.** Idle's advantage is tenure, not first-session hook. Design for
~7-minute sessions several times a day, not one long one.

**Revenue shape:** at **2,000–5,000 sustained DAU** with rewarded-led ARPDAU of $0.04–$0.09, the range
is **$2.4K–$13K/month**. The stated "few thousand a month" goal maps to roughly **2,000–3,000
sustained DAU**. Realistic ceiling without paid UA is ~$10–20K/month, and roughly 75% of idle games
launched without UA fail outright.

The closest business-shape comparable is **Egg, Inc.**: solo-founded, ten years of continuous
updates, ~1M weekly actives at roughly **$0.12 per weekly active per week.** Modest ARPU, enormous
tenure.

## Distribution

**FTUE is the highest-leverage single lever:** core gameplay within **60 seconds**, the "aha" within
**90**. Two tutorial steps or fewer, skippable. No ads in session one. Optimised onboarding is
reported to lift retention up to 50%.

**ASO has changed:** the App Store algorithm is now two-engine — metadata relevance to enter
consideration, then **behavioural quality signals (retention, engagement) to stay**. D1/D7 is now an
ASO input, so a cozy game with genuinely good D7 gets algorithmic lift a well-keyworded bad game does
not.

**Free channels that actually work at this scale:**

- **r/incremental_games** — *Magic Research*, a solo-dev incremental, made ~$400K in twelve months
  from zero paid promotion and essentially two posts there.
- **Wholesome Direct** — annual, June, free to submit. The 2025 edition reached **5M+ views with 650+
  co-streamers**, up 200× since 2020. The single highest-leverage free marketing beat available.
- **r/CozyGamers** — ~420,000 members.
- **"Paid organic" TikTok** — organic reach for gaming accounts fell from 15–20% in 2024 to 4–8% by
  early 2026; the working pattern is to post clips and put ~$200 behind ones showing traction.

**Web and PWA — do not build the retention plan on it.** iOS push works only for Home-Screen-installed
web apps, is **unavailable in the EU on iOS 17.4+**, there are no automatic install prompts, and
Background Sync is unsupported. Portals optimise for short sessions and repeat visits; idle games
monetize on multi-day retention portals do not retain. Realistic portal earnings for a
well-performing casual game are **$200–$2,000/month**.

Use a WebGL build on **CrazyGames** (Basic Launch requires no SDK work) as a free demand test and
top-of-funnel, not a revenue centre. The path that has actually worked is Melvor Idle's: free browser
build as funnel, paid/native mobile as the product.

## The talking flower

Nintendo's own logic, since this project borrows the device directly: Takashi Tezuka conceived
Wonder's Talking Flowers as **a live commentary feature**, then gave the commentary a face. It is not
a tutorial wearing a character; it is a commentary system given one.

**It was also the single most divisive element of that game** — "either the best part or its most
annoying feature." Nintendo shipped a mute, but only for text *or* audio, and caught criticism for
that too. **Ship a full mute for both from day one.**

| Do | Don't |
| --- | --- |
| React to what just happened | Explain what to do next |
| 1–2 short lines, dismissible with any tap | Block input or require "OK" |
| Have preferences — a favourite species, a disliked weather | Be uniformly encouraging (flat positivity reads as a system) |
| Carry one unresolved thread | Deliver exposition |
| Go quiet for long stretches | Comment on every tap |
| Idle-animate constantly — blink, sway, watch | Appear only in popups |

**The unresolved-thread device:** Merge Mansion built a cult following on a question it never intends
to answer — "what is grandma hiding?" — for **$700M+ lifetime and 60M+ downloads**. You do not have
to write an ending. You have to write a question.

## Craft notes worth acting on

**Juice — don't port violence verbs literally.** Screen shake and hit-stop are combat feel. The cozy
equivalents: squash-and-stretch on tap (1.0 → 1.15x/0.9y → overshoot → settle); **overshoot easing
(back-out / elastic-out) on every pop-in**, the highest value per engineering hour available;
particle burst, coin arc and number float staggered ~40–80ms so they read as a sequence; **confetti
reserved for milestones** so it keeps meaning; permanence — the harvested plot visibly changes and
petals linger.

**Audio.** Kazumi Totaka on Animal Crossing: *"we wanted no sound that was unnecessary."* 70–90 BPM
matches a resting heart rate. His specific trick — **pure acoustic tested "too relaxed", so they used
synth timbres arranged acoustically.** Ship 4–6 variants of every frequent SFX with ±3% pitch
randomisation, a diegetic ambience bed underneath, and **no failure stings, ever**. Extend the
existing combo pitch-climb to consecutive *harvests* — the cheapest dopamine multiplier available,
and it costs one variable.

**Art — the silhouette test.** Design every species as a filled black shape first. **If it is not
identifiable at 64×64 in pure black, redesign the shape before touching colour.** Two flowers
distinguishable only by petal texture are the same flower on a phone. This matters increasingly as
species count grows.

**Reactions on things that aren't the player.** Wonder's enemies avert their eyes and flee from an
elephant-powered Mario. Plants, bugs and soil should react to presence, not only to harvest.

**Content volume: 50–80 species, not 500.** Alba won an Apple Design Award with **62**; Neko Atsume
won a design award with fewer cats than it now has; Pocket Frogs' 38,262 combinations are *generated*
from 23 primary × 16 secondary colours, not authored.

## Scope model

Two comparables, opposite outcomes, same genre:

- **Sneaky Sasquatch** — *two people*. One small world, accreted additively for six years. Apple
  Arcade's #1 US game and Game of the Year 2020; RAC7 acquired by Apple in 2025.
- **Palia** — a ~130-person cozy MMO. **85 people laid off across two rounds in 2024**, studio sold.
  Right genre, wrong burn rate.

**Depth-by-accretion in a single scene, not breadth of scenes.**

Three more failures worth remembering:

- **Tales of the Shire** launched with the best cozy-adjacent IP on earth and an empty loop. **Cozy
  audiences forgive small scope; they do not forgive an empty loop.**
- **The Sims Mobile** was delisted after ~8 years with all progress server-side and lost, no refunds.
  → **Build local-first saves with optional cloud sync.** This game already does; after that news it
  is worth advertising as a feature.
- **Spry Fox** was bought by Netflix in 2022 and sold back to its founders in 2025. **Don't build for
  a single gatekeeper.**

## What to avoid entirely

Match-3 (closed — 1 of 120 new titles reached $100K/month in H1 2026); Merge-2 (growing but a
Century Games / Moon Active capital war); **RPG framing** (idle RPG has the worst install rate in
mobile at 2.0 per 1,000 impressions); hybrid-casual (assumes $10K–30K+/month media spend — it is a
user-acquisition business with a game attached); the lo-fi/pastel cozy visual lane (crowded).

## Titles worth playing, in order

1. **Pocket Plants** — the closest structural analogue already shipped: energy → grow → merge toward
   a target species → fulfil named NPC orders.
2. **Grow a Garden** (Roblox) — mutations, weather, rotating stock.
3. **Cookie Clicker's Garden minigame** — per-plant verbs and adjacency.
4. **Little Alchemy 2** — encyclopedia and discovery as the entire reward.
5. **Cats & Soup** — realistic revenue shape and cosmetic-only spend.
6. **Neko Atsume** — item-as-key, mementos, and the offline-as-scene framing.

## Confidence notes

- Much "2026 benchmark" content is vendor SEO with figures contradicting each other 2–3×. Tenjin,
  Sensor Tower, AppMagic, AppsFlyer, GameAnalytics and GameRefinery are the credible sources here;
  single-vendor claims should be treated as directional.
- Offerwall retention figures (Simulation D7 2.4% → 22.4%) carry heavy self-selection — those are
  already-engaged players.
- Egg, Inc.'s often-quoted "100M+ downloads" is **not supported**; best-sourced figures are 12.5M+ on
  iOS all-time. Do not cite 100M.
- Cookie Clicker's ~$21.9M gross is a third-party calculator estimate, not a reported figure. The
  100,000-copies-first-week figure is from the developer directly.

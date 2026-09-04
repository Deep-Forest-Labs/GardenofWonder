# Making Money — the Plan

**Status: the brainstorm, researched and pressure-tested, 2026-08-30. Nothing here is built, and
nothing ships before the Unity shell** — the web build has no ad system and never will. This is
the menu the owner picks from; prices are ballparks until phase 4's tuning. Written in the
glossary's plain words ([32-the-garden-year.md](32-the-garden-year.md)).

**Amended 2026-09-03 — the web build now carries two rewarded PLACEMENTS, and the sentence above
still governs the SDK.** The rule that nothing ships before the Unity shell is about *ad mediation*:
a network, an SDK, a fetch, a real video. None of those exists here and none ever will. What the
owner asked for and what now exists is the **placement** — where an offer sits, who may be offered
it, how often, what it says, and a counter — with a grant that fires immediately in place of a
video. The two are the Honeypot creature-food tier ([22-creatures.md](22-creatures.md)) and the
drone rental — **both live as of 2026-09-03**. They are built this way deliberately: the day a real
SDK arrives, `Game.watchAd()` is
the one function that changes and everything around it — the caps, the counters, the first-session
rule, the no-countdown rule, the mint exclusion — is already true and already tested.

Five things that ride with the amendment:

- **The caps live in `DATA.ads`**, which is prerequisite 5 below, done. `dailyCap: 6` is the top of
  the 3–6 band; `perPlacement: { food: 2, drone: 2 }` is what each surface may take of it. Feeding
  **could** want six a day on its own — four tended creatures on 16-hour Honeypots — so it is held
  to two on purpose; the drone rental is held to two for the same reason, since a half-hour loan
  would happily eat the whole plan and turn a taste into how the garden is played. Four of six
  spoken for, **two left — and three placements are named below as shipping first**, so the plan is
  already full: one of the three waits, shares, or `dailyCap` moves inside its 3–6 band. That is
  phase 4's call, not a thing to discover while wiring the third placement up. The suite sums
  `perPlacement` against `dailyCap` and refuses a table that plans past the day. Every number here
  is PROVISIONAL and phase 4's to retune.
- **The drone rental's own guardrails**, because they are the ones a future placement should copy.
  It composes with the bought upgrade by `max` and never by replacement, so a player who owns the
  drone at level 3 is never handed a loan that slows them to level 1. It refuses outright — before
  any impression is spent — when a rental is already flying or when the badge already matches the
  loan, because an ad sold once for a grant worth nothing is an ad that is never trusted again. And
  it is excluded from `passiveIncomeRate()`, which is the same refusal this document makes of the
  Turn doubler in different clothes: that function is a rate multiplied over a whole absence, so a
  thirty-second ad composed into it would pay out a full night.
- **The rental's gold does not feed the well, and this is where the promise nearly went.** The
  offer hands over no coin — it lends a machine — but the machine spends the next half hour
  *picking plots*, and every pick paid through `credit()` like any other. Measured before the fix:
  **81k–591k gold from one video** into both `lifetimeCoins` and `year.coinsEarned`, +34 to +58
  Saved Seeds, and `turnReady()` flipping false → true on its own — `DATA.year.minCoins` is one of
  its two gates. Promise 1 is absolute about the Turn's currencies and names this exact back door,
  so it is closed rather than argued: `processAutoHarvest()` passes `{ ad: true }` to `harvest()`
  whenever the **borrowed** drone wins `droneLevel()`'s `max`, and `harvest()` forwards that one
  flag to `credit()`. The condition is the composition rule read backwards — when the bought badge
  equals or beats the loan, the identical pick happens at the identical cadence without it, so that
  gold is the **purchase** earning and still counts in full. A hand harvest during a rental is the
  player's own play and counts too. Three sim-tests hold all three states by running the rental
  window rather than sampling the instant `rentDrone()` returns, which is zero by construction.
  **The lesson for the next placement: ask what the reward *does* over its lifetime, not what the
  granting function hands over.**
- **The mint-exclusion flag exists and is sim-tested** — prerequisite 2 below, done. `credit(n, {
  ad: true })` skips both accumulators exactly as `cheat` and `refund` do, and bill 4 in
  `tools/sim-test.js` asserts an ad grant moves the wallet and neither ledger. It shipped with the
  first placement so the second would inherit it rather than rediscover the promise — and the
  second promptly needed it, through a route nobody had drawn: the drone rental pays gold
  *indirectly*, over half an hour, out of the machine it lends.
- **Nothing in the placement holds a clock**, because a time-limited offer attaches a PEGI 12
  descriptor ([40-financial-model.md](40-financial-model.md)). A sim-test reads the whole `DATA.ads`
  table for the vocabulary of urgency and fails on it, and another reads `DATA.droneRental` the same
  way. The rental's own half-hour countdown is a different thing entirely — it is the rail chip
  telling a player what they already have, never the offer telling them to hurry.

The playbook a third placement follows is in [09-conventions.md](09-conventions.md) — read it rather
than rebuilding the component.

Three agents built this: one mapped every natural money-moment in the real game, one checked
what the comparable games actually charge and where their ads live (sources in the run), and
one adversary attacked every idea against the cosy rules. What survived is below.

**Emphasis corrected by [40-financial-model.md](40-financial-model.md), 2026-08-30, and the
advisor accepts it: the ads are the floor, the shelf is the plan.** Every promise and every
placement below stands exactly as ruled — what changed is which line has to grow. The best
evidence on our closest cluster runs ~59% purchases / 41% ads, the "Idle Miner is 60% ads" anchor
failed sourcing, and the gap between missing the revenue goal and beating it is the gem-and-decor
catalogue, not more ad slots. Also corrected: plan in *impressions*, not offers — 3–6 rewarded
impressions per player per day, measured in the first playtest.

## The two promises — what we never sell, ever

1. **The Turn's currencies are never for sale.** Saved Seeds, petals, seed unlocks, season
   gates, the blessing — none of these can be bought with money or ads, directly or through a
   back door. This is the promise that makes the Turn mean something, and one back door is
   named below because it is easy to build by accident: **ad-granted and purchased gold never
   feeds the well** (it gets the same flag cheat gold already has).
   *(Rescoped 2026-09-02 by the owner — this promise used to read "nothing permanent can be
   bought." The owner's ruling: this is a free-to-play mobile game, and items that increase the
   speed of play WILL be sold — the records and their charms
   ([49-the-record-shelf.md](49-the-record-shelf.md)) are the first. The frame that governs
   every such sale: **paying accelerates, never gates** — everything purchasable is also
   earnable through play, contents are listed and fixed, nothing is random-for-pay, nothing is
   time-pressured. The store sentence adjusts to "everything can be earned by playing — paying
   gets you there sooner." Reasoning and what this spends: the 2026-09-02 pillar entry in
   [10-decision-log.md](10-decision-log.md).)*
2. **The sacred moments stay clean.** No ad offer inside the ceremony's beats, no ad on the
   Wonder, no selling the Century Bloom's fourteen days — the wait *is* the product. Offers
   live on summary screens, after the fireworks, never gating them.

Standing rules, unchanged from the research days: **rewarded video only** — no interstitials,
no banners, no energy, no loot boxes; no ads in a player's first session; two to three offers
per session, capped in data. "No forced ads" stays our marketing line, so it must stay true.

**What "first session" means in a web build, because the obvious reading was wrong and shipped.**
A page load is not a session. A pull-to-refresh, a tab the phone discarded and restored, installing
the PWA and opening it, or a service-worker update are all fresh loads inside one sitting — and the
first version of this rule counted loads, so a player at level 1 with nothing earned was offered an
ad the second time the page came up. `Game.adOffered()` now asks for **two** things: the garden has
been opened again, **and** it is more than a day old. Refreshing bumps the first and cannot touch the
second. The cost of the conservative reading is at most one day of offers per player, once, ever —
which is the direction this rule is supposed to fail in.

## The owner's two ideas, ruled

**"Double the offline gold when you come back, by watching an ad" — YES, and it ships first.**
The single most proven placement in the genre, it fires at the exact moment of return, and it
touches only the year's money. One rule rides along: the doubled gold is fun-money — it never
counts toward the well. The offer is the *last* line of the welcome-back story, after the
telling, never before it.

**"Double the Saved Seeds at the Turn, by watching an ad" — NO, as stated.** Two plain reasons.
A perfect year of play earns about a ×1.66 Tally; a thirty-second ad granting ×2 would beat it
— the ad would outscore playing well, and the Tally stops teaching anything. And no big idle
game does this: Egg Inc's famous doubler doubles your *earnings*, never your prestige currency
— the prestige math absorbs it gently. **The version that works:** doublers on gold (welcome-
back, windfalls, order tips) give the same "I got more!" feeling without ever touching the
forever money.

## Ship first — the three safest, strongest placements

1. **Welcome-back gold doubler** (the owner's idea) — last beat of the away story, once per
   session, never session one.
2. **Fall windfall doubler** — after the bed's celebration finishes, on the payout summary:
   double the bonus. Fires once or twice a day at a moment the player *scheduled*, which is
   premium territory.
3. **A second daily card pack** — the first daily pack stays free forever; the ad offers "one
   more?" Feeds the collection habit, naturally capped at one a day. **Dust (the duplicate
   sink) ships with or before it**, and pack odds print on the pack face — that's law in the
   EU already.

## Ship soon, with their one guardrail each

- **Power-up button refill by ad** — one bonus charge, two or three a day, and the free way to
  earn boosts never gets worse to make the ad look better. The moment the free path degrades,
  this becomes energy in a costume, which we've banned twice.
- **Order tip doubler** — doubles an order's *gold*, never its reputation.
- **Dust doubler** — double the dust from a pack's duplicates; turns the worst moment in a
  pack ("already have it") into progress.

## The store shelf (real money)

- **The golden seed — a starter-pack candidate, owner-proposed 2026-09-02, parked with its
  guardrails named.** A special seed slotting between Bluebell and Lavender: inexpensive, an
  outsized payout for its tier, so a paying player feels a real boost early. The rules it must
  ship under, recorded now so nobody rediscovers them at build time: it lives **off the 19-seed
  ladder** (an extra species — the seed curtain's reveal law is proven on the ladder and a paid
  seed must never sit inside that proof); it **never appears in a mystery `???` slot** (paid
  content behind a mystery attaches PEGI's paid-random-items descriptor — a rating cliff); the
  pack stays **untimed with fixed, listed contents** (a time-limited starter pack is PEGI 12);
  and the store sentence *"every collectible can be earned by playing"* survives only if the
  golden seed is **also earnable by play eventually** — buy it now, or earn it later through a
  long quest — or the sentence is consciously given up. That last shape is the owner's
  pricing-posture call when monetization's time comes; the recommendation is earn-or-buy.
- **Starter pack, ~$1.99–2.99, offered day 2–3** — fixed, listed contents: gems, one named
  card, a decor piece, a few boosts. No randomness (that's a loot box), and no meaningful
  gold (gold buys seed unlocks, and year-one pacing is the tuned heart of the game).
- **The Gem Jar (piggy bank), ~$5.99** — fills with gems as you play, never overflows, never
  expires, no countdown, no nag; crack it whenever you like. Egg Inc's best-per-effort
  pattern, and its jar holds the premium currency too. **Gems only** — a gold jar quietly
  mints Saved Seeds through the well, and a seed jar sells the Turn itself. Both are never.
- **Gem packs** — fine, with the real-money price shown beside every gem price in the game
  (EU rule, already law), and only worth it once gems have more to buy —
- **Cosmetic decor packs** — the cleanest sale in the game: pure looks, already what gems and
  money are allowed to buy. A Harvest Moon set, a Winter lights set. The cost is art time,
  not design risk. This is also the answer to "what do gems buy": grow this catalog.
- **Remove-ads** — weaker here than in most games because we have nothing forced to remove.
  If built, it's a "golden trowel" supporter tier that auto-grants the rewarded bonuses —
  cosy, but it converts ad placements into paid outcomes, so it excludes anything near the
  Turn. Cats & Soup sells ad-removal as cheap *passes*, not a one-time unlock, if we ever
  want that shape. Low priority.
- **Content packs, later, ~$3.99** — a whole listed album season or a species wave. The most
  natural big sale this game has ("more encyclopedia"), and the riskiest promise: a season is
  a subscription to our own output. Not before the art pipeline is proven.

## Never — and each one has a reason, not a mood

| Never sell | Because |
| --- | --- |
| Saved Seeds, petals, or a seed jar | Money minting the forever currency deletes the Turn |
| Seed unlock skips | The walls are the game's pacing; selling past them sells past the game |
| Early season gates | The Turn pays in places — selling the places sells the Turn's payout |
| The Century Bloom's time | The wait is the monument. Sell it a cosmetic pot; never the exit |
| A second blessing | An ad minting permanent power, and it breaks the ceremony's one choice |
| Offline cap extensions | "Do not use the cap as a monetization lever" — standing rule, kept |
| Wonder extensions | A jackpot you can buy more of stops being a jackpot |
| Paid random packs | That's a loot box: banned in two countries, 16+ rating, audience poison |

## What has to be true before any of it ships

1. **The Unity shell exists** — ad mediation and IAP live there; the web build stays clean.
2. ~~**The mint-exclusion flag** covers ad-granted and purchased gold, sim-tested like cheat
   gold.~~ **DONE 2026-09-03** — `credit(n, { ad: true })` in `game.js`, asserted in bill 4 of
   `tools/sim-test.js`. Purchased gold gets the same flag the day an IAP exists.
3. **Dust exists** before the second daily pack.
4. **Gem sinks grow** before gem packs are worth selling. *(One landed 2026-09-03: Petal Cake, the
   first recurring gem sink — see [04-economy.md](04-economy.md).)*
5. ~~**Caps live in data**: offers per session, refills per day, all remote-tunable.~~ **DONE
   2026-09-03** — `DATA.ads` in `data.js`, one key per placement, nothing else anywhere.

The revenue shape, corrected by [40-financial-model.md](40-financial-model.md): **the rewarded
placements are the dependable floor, and the shelf — the Gem Jar, decor and gem catalogue — is
the line that has to grow**, because the closest comparable cluster earns more from purchases
than from ads and the gap between missing and beating the goal lives there. That matches the modest-DAU
plan the market doc set from the start.

# Decision Log

Why things are the way they are. Append new entries at the top with a date. Record the reasoning,
not the diff — git already has the diff.

---

## 2026-08-15 — Weather and mutations built; the spec's exposure model was wrong and measurement caught it

Built: the epoch weather clock, the sky, all four mutation tiers, Beacon stacking, and the visuals.
Not built: offline reconciliation and card generation, steps 5 and 6 of
[18-mutations-and-weather.md](18-mutations-and-weather.md).

**The design survived contact. One number in it did not.**

The spec said exposure was **one roll per weather slot a plant lives through**, on the theory that
slow seeds *should* catch more weather — a long grow time buying mutation chances. It was reasoned
about, not measured. The first run of the income-share test said:

| Seed | Share of income from mutations |
| --- | --- |
| Eternal Crown (780 s) | **75.0%** |
| Marigold (55 s) | 21.2% |
| Daisy (12 s) | **5.9%** |

A **65× spread**. Scaling the catch rates down to bring the Crown into band pushed a Daisy to 0.6%,
which means a new player would go hours without seeing the feature at all.

**The error in the reasoning:** slow seeds don't need extra exposure, because they already collect
the reward. The same ×10 lands on a far bigger yield — ×10 on an Eternal Crown is worth roughly
2,000× the same mutation on a Daisy. Exposure was paying them a second time for the same virtue.

**The fix: one roll per plant**, at a moment chosen when it is sown. Share is now even across the
ladder — Daisy 20.4%, Marigold 20.9%, Eternal Crown 19.2% — which is the property that keeps
mutations present at every stage of the game rather than dominant late and invisible early. **The
original catch rates were right all along**; only the exposure model was wrong, and the numbers in the
spec table now match measurement almost exactly (Dewkissed ~5%, Gilded ~1%, Prismatic ~0.3%,
Wonderstruck ~0.045%).

*Consequence, and it resolves an open question:* one roll means **no upgrades**. A plant cannot catch
Dewkissed and later improve to Gilded. Simpler to reason about, and it removes a rule that would have
needed explaining.

**The lesson worth keeping:** the income-share test earned its place before it ever guarded a
regression — it caught a design error that reasoning had not, on the first run. The version that
matters compares a **fast seed against a slow one**; a single-seed measurement would have passed and
shipped the bug.

**Rejected: fixing the spread by shortening the weather slot.** Shorter slots raise everyone's
exposure but leave the ratio between fast and slow seeds untouched — it scales the problem rather
than solving it, and a sky changing every ten seconds is unpleasant besides.

**Rejected: capping exposures per plant.** Would have bounded the top end without lifting the bottom;
a Daisy at 12 s against a 60 s slot still crosses a boundary only a fifth of the time.

**Ripe plots do not roll.** Only unlocked, growing, unharvested plots do. Letting a ripe plot keep
rolling would make "never harvest, wait for Wonderfall" a real strategy, which fights the core loop.

**Stacking raises the catch chance, never the payout** — `beaconCatchBonus: 0.5` per adjacent
Beacon. An arranged garden gets *more jackpots*, not bigger ones, which is what keeps the income
share computable however much agency is added later.

**Nothing new is stored beyond two per-cell fields.** `mutation` and `mutateAt` on each grid cell,
plus `lastSeen` for the reconciliation that is still to come. The weather clock itself stores
nothing, because it is a pure function of time. Both grid fields needed their own backfill loop in
`load()`, per the trap `luckyBug` established.

**Left knowingly broken**, both in [11-known-issues.md](11-known-issues.md): mutations do not
reconcile across time away, and the day/night cycle still keys to page boot while weather keys to
epoch — so the sky's weather is shared and honest while its time of day is per-session. Fixing the
latter is small and **unblocks the night-blooming verb**.

**Verification.** 315 sim-test assertions pass. In the browser: all four tiers caught from their
matching weather, each with a distinct readable treatment; the storm sky greys the scene without
hiding the garden; a Wonderstruck Daisy paid 7,000 against a plain 70, exactly ×100; the plot cleared;
console clean.

---

## 2026-08-15 — Retracted: the card album is not coupled to flowers, and that independence is the design

**Correction.** The same day's earlier entry claimed mutations were the card album's content engine —
19 species × 5 states yielding ~95 cards from procedural art, with card rarity mapping onto the
mutation ladder and Mythical = Wonderstruck. **That is wrong and is withdrawn.** The owner's design,
which is the correct one, is in [19-card-album.md](19-card-album.md).

**Cards are a parallel meta, independent of the garden.** No card is earned by growing any particular
species, mutation or rarity. Packs come from quests, level-ups, the daily reward, the shop, and a
**random spawn on a plant in the garden** — the Lucky Ladybug pattern. The album carries its own
seasonal theme (*Harvest Moon*), its own art, and its own story, flower- and farm-flavoured but not
about the game's mechanics. The references do exactly this: Monopoly Go's stickers are not board
spaces, Coin Master's cards are not spins.

**Why the independence is right, recorded because the coupled version was tempting.** If a card
required a Gilded Marigold, the album would dictate what the player plants — the garden would stop
being a place to arrange and become a checklist to satisfy. Verbs, adjacency and mutations all exist
to make planting a *choice*, and a coupled album would cancel them out. Independence also lets
*every* system pay into the album rather than only the one it is bolted to, and keeps two economies
from distorting each other when either is retuned.

**The cost of being right: the affordability argument is gone.** The coupled design got ~95 cards
free from art already rendered. Independent cards with bespoke art and story mean **~108 hand-authored
illustrations plus ~108 lines of writing per season, forever** — and that collides with the
no-binary-assets rule in [09-conventions.md](09-conventions.md). Three routes are recorded in the
spec: let the prototype cheat with procedural placeholder cards (the web build is the design lab, not
the product), compose cards from background × motif × frame rather than drawing each one, and keep a
recycled-season fallback. **Position unchanged: build the album, design seasons as possible, do not
announce a cadence until one season has been authored and measured.**

**The best idea in the feature is the spawning pack.** A card pack that appears on a plant and must
be tapped, exactly like Lucky Ladybug — a fourth entry in the existing tap-proc pattern, which is
already built and already tuned through one shared constant. It gives tapping a second reason to
exist without touching the coin economy, and it connects the album to the garden **without coupling
them**: the garden is where packs turn up, never what decides their contents.

**Loot-box warning recorded prominently**, because "sales" came up as a pack source. Selling a
*randomized* pack for real money is a loot box: banned as gambling in Belgium and the Netherlands,
barred to under-18s in Brazil from March 2026, rated **16+ by PEGI** — which a bright family-appeal
game cannot absorb — and the stated reason Nintendo shut down a $381M Pocket Camp. Earned packs are
fine however random. Selling a *specific card*, a *guaranteed-contents bundle*, *dust*, or a *whole
new set with contents listed* is fine. **Sell more album, never a better chance.**

**Duplicates get a dust sink from day one.** Trading is deferred, so duplicates convert to a currency
that buys a chosen card. That turns "I already have this" into visible progress and defuses the
endgame where one card remains. Reachable but expensive; never trivial, never impossible.

---

## 2026-08-15 — Mutations specified: weather causes them, verbs stack them, and the income share is the number that matters

Full spec in [18-mutations-and-weather.md](18-mutations-and-weather.md). Nothing built yet.

**The problem the design had to solve first.** The game already rolls four rarity tiers on every
harvest. A mutation that is "a second dice roll multiplying payout" is rarity repainted — the same
AdVenture Capitalist failure this project already diagnosed. Three properties keep it structurally
different, and all three are load-bearing: a mutation is **visible while the plant grows**, its odds
are **stackable by the player**, and its cause is **visible weather in the world**. Drop any one and
it collapses back into rarity.

**Weather is derived from wall-clock epoch time, not a running timer.** `slot = floor(epoch /
slotSeconds)`, weather is a deterministic hash of the slot. No stored state, no scheduler. Three
consequences justify the choice: every player sees the same sky at the same moment (a shared-world
feel with no server), past weather is computable so time away can be reconciled exactly, and it moves
the day/night clock out of `ui.js` — where it is keyed to *page boot* and restarts on every reload —
which **re-opens the night-blooming verb that had to be dropped from the first verb pass.**

**Weather rarity gates mutation rarity.** A Wonderstruck needs a rare sky *and* a roll inside it. Two
gates make the top tier genuinely rare without any single absurd probability, and the rare sky is
itself an event worth planting into.

**Decision: tune the income share, not the multipliers.** Target is **20–30% of total income from
mutations**. Pick the share, derive chance × multiplier to hit it. The share survives a full economy
retune; specific multipliers do not.

**The arithmetic that drove the ladder, because it is counterintuitive.** Contribution to average
income is `chance × (multiplier − 1)`. A **×3 at 20% adds +40%**; a **×50 at 0.2% adds +10%**. The
modest frequent bonus inflates the curve *four times harder* than the spectacular rare one and
delivers a fraction of the feeling. So the rule is **generous at the top of the ladder, stingy at the
bottom** — jackpots are cheap, and frequent small bonuses are what quietly wreck an economy. The
owner's framing was the same conclusion from the other direction: unforgettable beats mild.

*Rejected: a single mutation tier.* Four tiers at four cadences — a couple a session, every other
session, weekly, and rarely — do genuinely different jobs. One tier can be frequent-and-mild or
rare-and-huge but not both, and the game wants both.

*Rejected: mutation replacing the rarity roll.* Cleaner arithmetic, but it makes rarity irrelevant
whenever a mutation lands, and two axes that can both fire is more interesting than one that
overrides the other.

**Slow seeds catch more weather, and that is kept on purpose.** Exposure is per weather slot lived
through, so a 780-second Eternal Crown sees far more sky than a 12-second Daisy. It hands long-grow
seeds an advantage unrelated to yield and partially answers the throughput-trap problem in
[11-known-issues.md](11-known-issues.md). It also makes the ladder impossible to tune by hand, which
is why the sim-test measures the income share directly rather than asserting chosen numbers.

**Stacking multiplies catch chance, never payout.** A well-arranged garden gets *more jackpots*, not
bigger ones, so the income-share target stays computable.

**Anti-FOMO rules are part of the spec, not a footnote.** Mutations land on what is already growing,
weather recurs forever, nothing is missable, and **weather is never a push notification**. The first
pillar is "cosy, not demanding," and a sky you have to be present for would break it.

**Mutations are the card album's content engine.** 19 species × 5 states = **95 cards from art
already rendered procedurally**, and card rarity maps onto the mutation ladder with **Mythical =
Wonderstruck**. That deliberately aligns the album's hardest row with the game's biggest moment.

**Album structure, from the owner.** ~12 sets of 9 cards per season, Common → Legendary plus one
Mythical per set, album completion as the season goal, ~3-month seasons. Nine sits inside the 7–12
band the collection research recommends. Recorded in
[16-progression-and-quests.md](16-progression-and-quests.md), **along with a warning**: a quarterly
season is a standing commitment to author ~108 cards four times a year, and missing one scores worse
than never promising it. The position taken is **build the album, design seasons as possible, and do
not announce a cadence until one season has been authored end to end and measured.**

**On the economy retune.** The owner is right that the whole economy needs one, and possibly fewer
seeds unlocked through card packs. Deliberately deferred: an economy is tuned against the systems
that consume it, and orders, cards and prestige do not exist yet — retuning now means retuning twice.
Noted dependency for whenever it happens: **the level curve currently pays one seed per level to 17**,
so pulling seeds back leaves levels 2–17 with nothing to grant and needs a replacement reward.

---

## 2026-08-14 — Verbs built: six flowers that do something, on an axis the yield curve doesn't govern

**Decision.** Six of the nineteen seeds now carry a **verb** — Keeper, Nurse, Beacon, Lantern,
Deeproot, Spreader — each affecting the two plots adjacent to it. Mechanic in
[03-systems.md](03-systems.md#verbs-and-adjacency), numbers in
[04-economy.md](04-economy.md#verb-tuning), playbook in [09-conventions.md](09-conventions.md).

**Why six and not nineteen.** Smallest change that tests whether the idea works. Verbs are a
content axis, so the authoring cost scales linearly and there is no reason to pay it before the
mechanic has proved itself in play. The other thirteen stay plain yield tiers and are not worse for
it — a garden where *everything* has a special property has no figure and ground.

**The load-bearing constraint: verbs stay off the yield curve.** `yield === cost × 1.4` still holds
for every seed, and a sim-test asserts it. Verbs are applied as multipliers at harvest exactly the
way rarity, mastery, pollination and the Wonder already are. This is what makes them safe: any verb
can be added to any seed without a rebalance, and the economy stays tunable by the one invariant
that has always governed it.

**Rejected: giving verb-carriers a yield discount to "pay for" the verb.** It sounds fair and it
would wreck the only thing keeping nineteen tiers coherent. A verb is not worth a fixed number of
coins — Lantern is worth a great deal beside a Daisy farm and nothing beside an empty garden — so
any discount would be wrong at most moments of the game.

**Rejected: one shared "adjacency bonus" stat with per-seed magnitudes.** That is the mastery
mistake again: same effect, different number, nothing to choose between. The rule that replaced it
is that **no two verbs may share an effect category**, and a sim-test enforces it. Speed, yield,
rarity, drops, density and propagation are six genuinely different questions, so "which of these do
I want next to my Daisy" has no single dominant answer.

**Rejected: a night-blooming verb.** Wanted one, and it would have been the best-themed of the set.
The day/night cycle lives entirely in `ui.js` and is keyed to page-boot rather than wall clock, so
"pays double at night" would reset its phase on every reload and be trivially farmable. Moving the
cycle into `game.js` is a bigger change than the verb is worth today. Deeproot took the slot.

**The ring turned out to be free symmetry.** The eight plots share edges in exactly one closed loop,
`0-1-2-4-7-6-5-3-0`, so **every plot has exactly two neighbours**. No plot is better positioned than
another, which means verbs need no per-plot balancing and every effect has a known ceiling of two
stacks. This was luck, not design — the layout predates the mechanic — but it is worth protecting if
the board ever changes shape.

**Keeper needed a second code path.** Growth time is baked in at plant time, so a plot planted next
to an existing Keeper gets the bonus naturally, but a Keeper planted *afterwards* would have done
nothing. `quickenNeighbours()` shaves its share off anything already growing. Without it the verb
would only pay out when the player happened to plant in the right order — a rule nobody would ever
discover, and one that would read as the feature being broken.

**No new saved state, deliberately.** Verbs derive entirely from the seed id already sitting in
`state.grid[i].seed`. Nothing was added to the save, so there is no migration, no backfill, and no
new instance of the `load()` trap that has bitten every previous badge. Retuning a verb is a
`data.js` edit that applies to every existing save immediately. Keep it that way.

**Also fixed, while in there: two pre-existing flaky sim-tests.** Measured at **4 failures in 50
runs** on the committed code, both statistical rather than real.

- `gems move by the milestone` asserted an exact gem count while the triggering harvest rolled its
  own independent 5% gem chance.
- `four hives lift yield by about 32%` averaged 4,000 random harvests with a ±0.06 tolerance, which
  put the 2%-Legendary tail inside the band (observed 1.253 against a 1.26 floor). It now pins the
  roll and asserts **exact payouts on a single harvest**, which also removed a mastery drift — the
  ladder climbs as a loop proceeds, so a sampled mean was measuring two things at once.

Neither was caused by verbs; both were confirmed against the pre-change code. The rule is recorded
in [11-known-issues.md](11-known-issues.md): **prefer an exact assertion on one harvest to a
tolerance on a sampled mean.** A test that passes forty-nine times in fifty reads as a real
regression the one time it doesn't, and sends the next person hunting a balance bug that isn't there.

**Verification.** 282 sim-test assertions pass, and the suite is now deterministic — **60 consecutive
runs clean**, against 4-in-50 failing before. In the browser: verb chips and notes render in the
picker, the adjacency flash marks the correct source and neighbour plots, Keeper measured 12 s →
10.2 s both when planted first and when planted last, console clean.

---

## 2026-08-14 — Strategy pass: the item-identity problem gets a real answer, and the Apiary loses

A market and competitor review ran against the whole design. Findings live in
[17-market-and-positioning.md](17-market-and-positioning.md); this entry records what changed and
why. Several of these overturn decisions previously marked as locked — deliberately. The owner's
instruction was that nothing in this folder is set in stone and anything in the game could be done
better.

**Ambition revised.** The standing decision was "modest revenue, a few thousand a month, low risk,
bias to proven patterns." That remains the *execution* target. What changed is the ceiling: the
owner's words were "I don't want our vision of the project to be too small that it hurts us in the
end." So execution stays incremental, but no structural decision may cap the ceiling — every number
stays in data and remote-config-ready, and the economy stays prestige-compatible before a prestige
layer exists. Push back on scope creep in execution, not in architecture.

**The item-identity problem has an answer, and it is not the Market.** The open question — *does the
garden's contents start mattering* — was handed to the Market in the entry below. That was half
right. An order makes a flower *instrumentally* wanted, which is a quota to fill, not desire. The
genre's actual answer is **per-plant unique verbs with adjacency effects**: Cookie Clicker's Garden
minigame runs 40+ species where one buffs its neighbours at a cost to itself, one suppresses weeds
in a 5×5, one is immortal and ages its neighbours, one explodes usefully when it dies, and one
actively contaminates orthogonal plots. The garden becomes a layout puzzle rather than a shopping
list, and ten flowers with distinct verbs read as more depth than a hundred with ascending numbers.

This game already has the board for it — eight plots ringing the flower, with adjacency completely
unused.

It also structurally defeats the min-max convergence that percentage bonuses invite: there is no
single dominant answer when effects are categorical rather than numeric.

**Named as the diagnosis: the AdVenture Capitalist trap.** 40M+ players, charming distinct-looking
businesses, every one producing money at a rate on a timer. No synergies, no unique verbs, no
collection layer. Pocket Gamer 3/10, "little reward for progress," now decayed to roughly $100K a
month. This game's protected invariant — every seed yields exactly 1.4× cost at Common across all
nineteen tiers, differing only in throughput — is that pattern exactly. It is also the real reason
Bloom Mastery could not make contents matter: a percentage of an undifferentiated thing is still
undifferentiated.

**The Apiary is folded into garden adjacency and loses its dock tab.** It was built as an explicit
throwaway to give the garden's output a consumer, because nothing in the game wanted anything. Once
plants have verbs and orders exist, that job is absorbed, and a parallel production chain becomes a
second economy competing with the one that matters. Bees become a plot-adjacency effect — a flower
attracts them, they lift neighbouring plots, honey is an occasional drop. The Apiary and Craft dock
tabs go, which the navigation doc already wanted.

*Rejected: keeping it as a shrunken single-hive flavour system.* It would still sit beside the core
loop instead of reinforcing it, and the tab cost is the same whether it holds one hive or four.

**The Almanac becomes themed card sets and is promoted to the spine.** The strongest audience finding
in the review: the Family/Farm Sim cluster is **69% female** against an 18.5% sample-wide average
(Quantic Foundry, n≈1.9M), and for women the two most common *primary* motivations are **Completion**
and **Fantasy**. Completion being the number-one motivation of the likely audience makes the Almanac
the spine of the game, not a side panel.

Current shape is wrong for that: one 19-species track with milestones at 5/10/15/19. Collection
research is specific — **optimal set size 7–12**, never start a player at zero, themes not indices,
the last item moderately hard, and **completion should improve the collecting engine itself**
(Pokémon's Shiny Charm device) rather than pay a trophy. See
[16-progression-and-quests.md](16-progression-and-quests.md).

**Card trading is deferred, but the data model must not preclude it.** The owner raised Monopoly Go's
sticker trading as a mass-market feature. Collection sets: yes, and the audience data backs it hard.
Trading: not yet. It needs accounts, a friend graph, a server and anti-fraud, all of which contradict
the local-first architecture — and the mechanic is inseparable from Monopoly Go's monetization, which
runs on chasing the last gold sticker, the pattern cozy players punish hardest. The Sims Mobile is
the cautionary tale: delisted after ~8 years with all progress server-side and lost.

*The middle path, if social pressure comes:* async gifting of duplicates via share codes — no
accounts, no server — which is most of the social warmth for almost none of the infrastructure.
Design the card data model so that stays possible.

**PWA is withdrawn as a retention strategy.** An earlier recommendation in this session to add a
manifest and service worker was wrong and is retracted. iOS push works only for Home-Screen-installed
web apps, is unavailable in the EU on iOS 17.4+, has no automatic install prompt, and lacks
Background Sync. It remains fine as convenience for testers. Native is the retention plan; a WebGL
build on CrazyGames is a free demand test, not a revenue channel.

**Offline earnings become a two-axis unlock chain rather than a system.** Currently automation runs
on `requestAnimationFrame` and stops dead when the tab closes, so the maximum reward for being away
is eight ripe plots and 7.5 minutes of honey — an overnight absence pays the same as a coffee break.
The fix is Cookie Clicker's split of **rate** and **duration** into two independently upgradeable
axes, which turns "how the game treats you while away" into ~14 nameable unlocks instead of a tax.
Start generous (~25% rate / 4h full rate) given the cosy pillar; Melvor Idle's 18-hour cap produced a
public rage-quit thread and it retreated to 24h. **Do not use the cap as a monetization lever, and
state it openly** — hidden caps read as theft.

The welcome-back screen is a **scene, not a number**: who visited, what bloomed, what they left.
Never "+4,213 gold while you were away."

**Prestige gets a framing that fits the brand.** Still not built, but no longer blocked on tone. A
flat "delete your garden" reset is brand-hostile; **seasonal turnover** — the garden clears because
that is what gardens do, and you keep the seeds — is narratively free and makes the loop cozy. Cube
root on lifetime earnings for the payout curve, permaslots so the player chooses what survives, and
never use the word "reset."

**Monetization shape settled.** Rewarded video only — zero interstitials, zero banners, no ads in
session one. But **not** an 80–90% ad-revenue plan: Terrarium: Garden Idle has ~11M installs and
earns roughly $9K a month on exactly that model. For a collection game the primary lever is Little
Alchemy 2's content pack (more discoverables), with Egg, Inc.'s accruing piggy bank as the best
IAP-per-effort mechanic in the genre. No battle pass, no scheduled live events, no energy, no gacha.

**Repo renamed `ghostgarden` → `gardenwonder`.** The game has been called Garden Wonder in the title,
meta tags and docs throughout; only the URL still carried the old prototype name. Saves are unaffected
because `localStorage` is keyed to the origin, which does not change. Noted for the record: "Garden
Wonder" sits close to *Super Mario Bros. Wonder*, whose aesthetic this game deliberately borrows —
worth a trademark search before any store submission, though it is not a prototype-stage problem.

**Cheat buttons stay live, deliberately.** "Grant 50 Gems", "Grant 1,000,000 Gold" and "Summon a
Wonder Effect" remain unconfirmed in Settings on the public build. The audience is friends and
buddies, their sessions are not being treated as clean data, and the buttons are useful for reaching
high-currency states. Revisit before any real external audience. Recorded in
[11-known-issues.md](11-known-issues.md) as a decision rather than an open question.

**Also recorded, not yet acted on:** the bottom HUD and meta layer need work (owner's assessment);
the docs' locked "storage caps" decision should be re-examined, because item durability was the one
change Neko Atsume 2's audience actively punished and caps are decay-adjacent against a "nothing
punishes you for leaving" pillar; and the talking flower needs a **full mute for both text and
audio** — Nintendo shipped only one or the other and was criticised for it, and the Talking Flowers
were that game's single most divisive element.

---

## 2026-08-14 — Bloom Mastery built; the "cheap seeds matter" claim retracted

**Decision.** Phase 5 shipped as specified. Nothing in the mechanic changed: endless per-seed
ladders, +5% added yield per tier, one gem every fifth tier, auto-pay, Almanac-only surface, no
Legendary gate. What changed is a claim in the spec that the arithmetic does not support.

**The retraction.** The spec argued mastery "finally gives a cheap seed a late-game reason to
exist — a deeply mastered Daisy becomes situationally worth planting." It does not, and it is not
close. Mastery is a percentage of what a flower already pays, so at equal tiers it lifts every
seed by the same factor and the ranking is unchanged. The cheap seed's only real edge is cycle
time: a Daisy matures in 12 s against an Eternal Crown's 780 s, so it banks 65× the harvests per
hour. But the ladder is about six tiers per decade of harvests, so 65× the harvests is roughly
eleven extra tiers — **+55%, against a 31× gap in coins per second** (Daisy 5.8/s, Eternal Crown
179.5/s at base). Closing that would need hundreds of tiers and harvest counts with a hundred
digits.

**Why ship it anyway.** The other two arguments for yield-over-gems are sound and unaffected: it
survives being infinite, and it self-balances across tiers without per-seed tuning. And the
retention argument — every grown flower is always mid-goal, so a harvest of anything is progress
on something — is the real value, and the mechanic delivers it. This is a depth reward and a coin
faucet, correctly shaped for both.

**Rejected: fixing the ranking.** Making mastery multiplicative (`1.05^n`) still needs ~70 tiers
to close a 31× gap, which is around 10^12 harvests. Scaling thresholds per seed by grow time would
work but reintroduces exactly the per-seed tuning the one-shared-table decision exists to avoid,
across nineteen flowers that would each need revisiting whenever a yield moves. Moving the bonus
to grow-time reduction hits a floor at -100% and cannot span 31×. All three are worse than
accepting the honest scope.

**Where the real answer lives.** "Does the garden's contents start mattering" is a Market
question, not a mastery question. An order that *wants* lavender makes lavender worth planting
directly, which is already the design in [13-order-system.md](13-order-system.md). Mastery was
never going to answer it, and the handoff should stop implying it might.

**Three implementation calls the spec left open.** Backfill rates are read from `DATA.rarity`
rather than hardcoded as 20/8/2 — the same numbers, but they now follow the drop table if it is
retuned. A credited rarity is floored at 1, because a save with `bestRarity: 'epic'` and three
lifetime harvests would otherwise round to zero Epics and treat a provably-hit rarity as never
hit. And the estimate is capped at the harvests that actually happened, allocated rarest first,
so one lifetime harvest with a Legendary best is one Legendary rather than one of each.

**Toasts were cut back from the spec.** The spec toasts every tier. Early tiers land every ten or
so harvests of a seed, which across eight plots is a toast roughly every twenty seconds — against
both the two-toast cap and the "genuinely notable moments" rule in
[09-conventions.md](09-conventions.md), and against the same reasoning that already denies Rare
harvests a toast. A tier now toasts only when it is a seed's first or a gem-paying fifth. Every
other tier keeps the full Rare-tier particle beat on the plot and stays out of the notification
lane.

**Two naming collisions cost time and are worth knowing.** `masteryGoal()` was the spec's name for
both the pure by-tier formula and the per-seed UI getter; they are now `masteryTierGoal(tier)` and
`masteryGoal(id)`. And `.seed-row` was already the plant picker's button class — styling the
Almanac rows with it wrapped every row in a card and collapsed the three columns onto one
overflowing line. The Almanac uses `.almanac-row*`.

---

## 2026-08-13 — Bloom Mastery spec locked

**Decision.** Owner ratified phase 5 of [16-progression-and-quests.md](16-progression-and-quests.md).
Per-flower endless ladders, auto-pay, +5% harvest yield per tier on that seed, one gem every
fifth tier, Almanac-only surface, no Legendary gate. **Built 2026-08-14.**

The original sketch was 19 quest lines with a gem on every rung. That version is rejected for
the arithmetic already in the entry below: 570 gems by tier 10 across the book, plus a drowned
tutorial strip. Yield is the infinite-safe reward; the Almanac row is the surface.

---

## 2026-08-13 — Bloom Mastery pays yield, not gems

**Decision.** Specified phase 5 of [16-progression-and-quests.md](16-progression-and-quests.md).
Every seed gets an endless ladder of goals — total harvests, Rare-or-better, Epic-or-better — and
each completed tier permanently adds +5% to that seed's yield. Gems appear on every fifth tier, one
each. Tiers auto-pay. **Built 2026-08-14.**

**The arithmetic that killed per-tier gems.** The original sketch was 1 gem rising to 5 by the
tenth tier. Whatever a tier pays is multiplied by nineteen flowers, so that is roughly 570 gems by
tier 10 across the collection, against a 250-gem Gnome of Fortune and a 40-gem Lantern Tree. It
would empty the gem shop several times and, worse, teach the player that gems come from grinding —
the exact belief that stops anyone buying them. One per fifth tier yields 38 for the same player.

**Why yield is the right reward and not reputation.** Reputation drives seed and plot unlocks on a
curve deliberately aligned to Market order tiers; it cannot absorb an unbounded faucet. Coin
inflation is what the genre is for. And a percentage reward is self-balancing across the nineteen
seeds — 5% of a Daisy is 3 coins and 5% of an Eternal Crown is 7,000 — which is what lets every
flower share one threshold table instead of nineteen tuned ones.

**The real design win is late-game Daisies.** The dominant strategy today is to plant the most
expensive seed you can afford, always. A deeply mastered cheap seed is the first thing in the game
that argues otherwise, which is a direct run at the open question in
[HANDOFF.md](HANDOFF.md#the-current-task) about whether the garden's contents ever start mattering.

**Rejected: Legendary as a tier.** At 2% it stalls a sequential ladder behind a coin flip for
hours. Legendary stays the `bestRarity` badge from phase 4 — a chase with no gate on it.

**Rejected: per-seed thresholds scaled to grow time.** It equalises pace, but it costs nineteen
tuning tables and it throws away the self-balancing property above. A hundred harvests is twenty
minutes of Daisy and twenty-two hours of Eternal Crown; the proportional reward already prices
that difference.

**Rejected: claim-tap per tier.** The owner initially wanted a claim. Nineteen flowers on endless
ladders would keep a permanent pile of pending taps, turning the reward into an inbox. Auto-pay
matches the phase 4 milestones and level-ups.

**Backfill grants yield but no gems.** Old saves never recorded per-rarity counts, so those are
estimated from the drop table and clamped by `bestRarity` — a rarity the player provably never hit
is never credited. The tiers that unlocks grant their yield, but the gem belongs to the moment of
completion and a backfill has no moment.

---

## 2026-08-13 — Two Almanacs were built; the merged one won

**Decision.** Phase 4 was implemented twice in parallel — once by a cloud agent, merged to `main`
as `947f110`, and once locally in an uncommitted tree. The merged version is the survivor. The
local one is preserved in a git stash and is not coming back.

**Why the merged one.** It is what is deployed, and it is more complete where it counts: a
first-discovery float and toast, full FX on a milestone crossing, and a live re-render of the
Almanac while the sheet is open. Its state shape is also flatter — `discovered` as seed-to-count
and `bestRarity` as seed-to-key, two flat maps of primitives — which merges more safely in `load()`
than the nested `{ count, best }` record the local version used.

**What is being carried over from the loser.** Only the seed row. The merged build writes
"Best Common · no Legendary yet", which reads as a sentence and hides Epic as a tier entirely. It
becomes three columns: name, best rarity, count. Phase 5 then adds the goal line beneath.

**The lesson worth keeping.** Two agents were pointed at the same spec without either knowing the
other existed, and both built it competently and incompatibly. Check `git branch -r` before
starting a specified phase.

---

## 2026-08-13 — Almanac is the collection track

**Decision.** Built phase 4 of [16-progression-and-quests.md](16-progression-and-quests.md).
Harvests write a lifetime `discovered` count and a `bestRarity` per seed. The Almanac header is
`N / 19` with a bar; ungrown blooms stay named and greyscale. Milestones at 5 / 10 / 15 / 19
auto-pay reputation, gems and a boost, once.

**Rejected: discover quests on the ladder.** The milestones already pay for distinct species. A
quest on the same beat would double-pay and blow the 777 total that lands Eternal Crown on
level 17. `noteQuest('discover')` is wired anyway so a later quest can listen without another
harvest hook.

**Rejected: claim-tap for milestones.** Level-ups auto-grant; the crossing is the moment. A
second tap to collect would make the Almanac feel like a second quest strip.

**Rejected: mystery names / true silhouettes.** The seed picker already shows every bloom with a
level gate. Hiding the name only in the Almanac would be a second secret for no pacing gain.
Greyscale plus "Not yet grown" is enough to read as a hole.

**Backfill pays catch-up.** Remaining `flowers` keys seed `discovered` on load, then any
already-reached unclaimed rung pays. That is generous (inventory undercounts true lifetime
harvests) and it is the only way a garden that already holds five species is not locked out of
the 5-rung forever.

---

## 2026-08-13 — Combo Coil finally buys a ceiling

**Decision.** Built phase 3 of [16-progression-and-quests.md](16-progression-and-quests.md). Tap
payout is now `× (1 + combo × 0.01)`, using the combo before the tap increments it. Harvests ignore
it. The multiplier is absolute, not a fraction of the cap, so Combo Coil raising 50 → 60 actually
moves the ceiling from 1.5× to 1.6× (and 2.0× at 100). Decay stays 1 per second — hold-to-tap
already has a shaped relationship with that timer, and changing it would be a different project.

---

## 2026-08-13 — Tickets retired; boosts are earned inventory

**Decision.** Built phase 2 of [16-progression-and-quests.md](16-progression-and-quests.md). The
HUD is two wallets. Boosts come from quests, level-ups and the daily, sit in `boostInv`, and
activate from the rail — tap consumes one. There is no buy path.

**Conversion is 5 tickets to 1 gem, once.** The flag is the presence of `boostInv` on the save,
same shape as the decor refund: toast, then never again. Leftover `state.tickets` stays so old
saves parse and is zeroed after the grant. Lantern Tree moved to 40 gems, which is the same 5:1
as the conversion, so a tree that used to cost 200 tickets still costs the same in gem terms.

**The tenth-harvest beat survived as reputation.** +3 tickets every 10 harvests was the only
regular drip besides quests. Replacing it with +1 reputation keeps the float without inventing a
second currency or inflating gem income. Combo Coil and the Almanac were still phase 3 and 4
when this shipped; both are built now.

---

## 2026-08-12 — Quest strip measures the quest; upgrades get a buy-then-feel tutorial

**Decision.** Five playtest notes after phase 1 shipped in-session, all taken.

**The bar is the quest, the ring is reputation.** The strip printed `Tap 25 times · 0 / 25` next
to a meter that was filling from garden reputation. Two quantities, one visual, and the one you
read is the one with the numbers. The bar now tracks `progress / qty` of the quest on the strip.
Reputation moved to a conic ring around the level pip — the same pattern the booster chips and
combo ring already use. The task name sits on top of the thicker fill; a chip at the right shows
the reputation reward, because "Claim" with no number is a blank payoff.

**Buy, then feel.** Generic "Buy a badge" / "Buy 3 badges" is gone (the dock says Upgrades). Each
early tap upgrade is now a pair: buy Power Punch then tap 50 times, buy Quick Grip then hold-tap
20 times, buy Lucky Charm then land a crit, buy Star Strike (the crit quest already showed the
spike), buy Combo Coil then reach combo 55. Combo Coil stays in even though the multiplier is
still phase 3 — undoing the tutorial later would cost more than leaving a buy-and-fill-the-ring
quest in. Hold ticks are a new `hold` track on `tapFlower(true)`; combo quests set progress to the
current combo rather than counting taps.

**The plant prompt.** `S.seen.plot` only flipped in the seed-sheet click handler, so a harvester
plant or an old save left "Plant a seed here" hopping forever. It now flips on the `plant` event,
and empty-plot bobbing is gated behind `#game.onboard` so it stops after the first plant.

---

## 2026-08-12 — Phase 1 of progression: the ladder pays to Eternal, plots are level-gated purchases

**Decision.** Built phase 1 of [16-progression-and-quests.md](16-progression-and-quests.md). Two
calls on top of the spec, both about not turning the new bar into a punishment.

**The ladder has to actually reach the last seed.** Twenty-four quests paying 5→25 sum to ~360
reputation, which is level 10. Eternal Crown unlocks at 17 (760). Leaving the back half of the
seed list on a daily-login treadmill is worse than a slightly fatter late-game claim. So the
authored ladder is 29 rows, payouts 5→50, totaling 781 — it lands on level 17. Levels 18–20 are
the "no new seeds until the Market" tail, fed by the daily. Six extra long-tail harvest/plant/honey
rows were cheaper than compressing the seed schedule.

**Plots are not a quest.** "Unlock a plot" as an objective would sit on the strip for hours while
the player saved 1,900 coins, and the game already starts with four plots — "unlock a second plot"
was copy from a different game. Extra plots become *buyable* at levels 3, 6, 9 and 12, then cost
the same gold they always did. Hours-to-days to open the whole garden, not weeks. Land Deed cannot
skip a plot the level has not opened, so it cannot undermine the gate; at level 1 it simply reads
Maxed.

**Grandfathering is broader than "what can you afford right now."** A Moonflower in the ground and
80 coins would otherwise be knocked back to level 1 and could not be replanted. Migration takes the
max of affordable seeds, planted seeds, flowers in the bag, and affordable locked plots, and never
re-locks a plot that is already open.

Recipes stay ungated. There are three of them and they are the craft tutorial; locking them
recreates the seed-migration problem for no pacing gain. Level 19 grants a Butterfly Shrine
instead of "a recipe."

---

## 2026-08-12 — Progression pass specified: reputation is the only track, and it is what "level" means

**Decision.** The next project is progression, not the world map. Specified in
[16-progression-and-quests.md](16-progression-and-quests.md): a quest ladder feeding a level bar,
tickets retired, the combo made to actually pay, and the Almanac turned into a completion goal.

**The one that matters: no XP.** The obvious build is a level bar backed by its own experience
number. That would mean two progression tracks, because reputation already exists in the locked
design as the thing gating land, order tiers and regions
([13-order-system.md](13-order-system.md)). Two tracks means two curves to tune, two sets of
rewards to keep from colliding, and an eventual migration when one of them wins. So "level" is a
display of reputation and nothing else. Quests pay reputation; when the Market ships, orders pay
into the same number and the bar keeps working with no changes. The authored curve
(`10 + 5 × (level − 1)` per level) was chosen to land level 4 / 8 / 12 / 20 on the four order-tier
thresholds already written down, so the two systems agree by construction rather than by later
reconciliation.

**Tickets are deleted rather than moved.** The request was to move the ticket power-up chips into
the Shop tab to clear space at the top of the screen. That would have contradicted two decisions
already made — the boost tray shows what you *hold*, not what you can buy, and the Shop is the
only place real money appears ([15-navigation-and-ia.md](15-navigation-and-ia.md)). A third
currency that exists solely to buy four boosts from a rail chip is not worth a wallet slot, a drop
type and a denial reason. Boosts become earned inventory from quests and level-ups; tickets convert
to gems once and the field stays only so old saves parse. Clearing the rail was the actual goal,
and retiring the currency achieves it without putting power-ups behind a price tag.

**Content gating is the reward, and migration is the risk.** Levels grant seeds — three at the
start, one per level to nineteen — because pacing content is the cheapest way to make progress feel
like progress, and because it gives the bar something to promise. The danger is that gating an
already-open game takes something away from existing saves. The spec makes the grandfather
migration mandatory and sim-tested: no player loses a seed they could already plant.

**Why the combo was folded in.** It isn't progression, but it is a filled meter on the main screen
that multiplies nothing, and a 2,500-coin badge that raises its cap. Fixing it is a few lines, and
leaving a visibly broken promise on screen while adding a new one next to it would undercut the
whole pass. The multiplier scales with absolute combo rather than the fraction of the cap,
specifically so that Combo Coil raises the ceiling instead of making the meter slower to fill.

---

## 2026-08-05/06 — Paused navigation phase 2; spent the cycle on the core tap-and-plant loop instead

**Decision.** Immediately after navigation phase 1 shipped, the plan on paper was to move straight
to phase 2 (the world map, [15-navigation-and-ia.md](15-navigation-and-ia.md)). Instead the owner
redirected to core gameplay: hold-to-tap with a Quick Grip speed badge, a Balanced seed-sort option,
three new tap-triggered "garden proc" badges (Rain Dance, Bee Swarm, Lucky Ladybug), a Sprinklers
rebalance, and — the next day — cutting those three procs' trigger rates by 5× and giving each one
a dedicated animation. None of this touches navigation; the dock is still exactly
`Upgrades · Apiary · Craft · Shop`.

**Why this isn't scope drift.** The existing roadmap (see "What comes after" in
[HANDOFF.md](HANDOFF.md)) already listed *"play the loop and judge it"* ahead of the world map —
the map was only "current" because it was next in the doc, not because judging the loop was done.
Everything built this cycle is squarely inside "does tapping and planting feel good," which is a
prerequisite for the map mattering at all: a bigger, riskier structural feature is a bad place to
find out the core loop needed more texture first.

**Net effect on the loop.** Tapping now has three independent things it can be doing at once beyond
the base payout: a slow build toward a faster hold cadence (Quick Grip), a small but real chance of
a rare, celebratory proc firing (Rain Dance / Bee Swarm / Lucky Ladybug, each now tuned to feel
sporadic rather than routine), and planting decisions now have a "balanced" option that reasons
across the whole garden instead of one plot at a time. The world map remains queued and unblocked —
picking it back up is a decision for a future session, not a change to the spec.

---

## 2026-08-06 — Tap-triggered garden procs (Rain Dance, Bee Swarm, Lucky Ladybug): rate cut to 0.2%/level, dedicated animations added

**Decision.** One day after shipping the three tap-triggered procs at `level × 1%`, playtesting
feedback was that they fired far too often to feel like the "slot machine" bonus they were designed
to be. Cut the shared per-level rate from `1%` to `0.2%` (a fifth of the old rate), keeping each
badge's existing level count so its cap shrinks proportionally:

| Badge | Old cap | New cap | Levels (unchanged) |
| --- | --- | --- | --- |
| Rain Dance | 10% | 2% | 10 |
| Bee Swarm | 5% | 1% | 5 |
| Lucky Ladybug | 8% | 1.6% | 8 |

The rate lives in one place now — `PROC_CHANCE_PER_LEVEL` in `game.js` — instead of being repeated
as a literal `0.01` in each `rollXxx()` function, so the next tuning pass is a one-line change.

Each proc also got a purpose-built animation in `ui.js` (`triggerRainFX`, `triggerBeeFX`,
`triggerLadybugFX`), because at this rarity the trigger *has* to carry the "you just won something"
feeling — the numbers involved are small and infrequent by design, so the moment has to do the
emotional work instead. See [03-systems.md](03-systems.md#tap-triggered-garden-procs) for what each
animation actually does.

**Why cut the rate instead of, say, keeping 1% but making the effect smaller.** The brief was
explicit: "I want things to feel more sporadic and volatile... super rare, so the idea of levelling
it up is still a very, very small percentage." That's a statement about *frequency*, not
*magnitude* — Rain Dance's 3s shave and Bee Swarm's honey jar are already appropriately small
per-trigger. Shrinking the payout instead of the rate would have made triggers feel *worse* when
they landed without making them any rarer, which is the opposite of what was asked for.

**Why keep the same level counts instead of also cutting them.** Fewer levels (e.g. 2 levels of 1%
each for Rain Dance) would hit the same 2% cap but make the badge feel like barely an upgrade path
at all — buy it twice and you're done. Keeping 10/5/8 levels at 0.2%/level each means levelling still
takes the same number of purchases as before; each one just nudges the odds by a sliver. That's the
point: the climb is deliberately unexciting so all the excitement is reserved for the trigger itself.

**Why the prices weren't cut along with the rate.** Buying a level now returns a fifth of the old
expected value for the same coin cost, which is a real economic step backward. That's accepted
deliberately, at least for now — these three badges are sold as "a chance at a fun moment," not "a
guaranteed number," so judging them purely on coins-per-expected-percent misses the point of what
they're for (see [04-economy.md](04-economy.md)). If they end up feeling like a trap purchase in
practice, cutting their price is the next lever to pull — cutting the rate was the priority for now,
since it's what makes the feature good in the first place.

**Why persistent visuals for Lucky Ladybug but not the other two.** Rain Dance and Bee Swarm are
one-shot: the effect fully resolves the instant it fires, so a single flourish (falling rain,
a visiting bee) tells the whole story. Lucky Ladybug's payoff doesn't land until a *later* harvest,
so without something on the plot in the meantime, the eventual "lucky!" harvest would feel
disconnected from its cause. A small badge sprite that sits on the plot from trigger to harvest
(synced every frame off `cell.luckyBug`, same pattern as the existing "Auto" tag) closes that gap
at the cost of one more piece of UI state to keep in sync.

**Why every FX helper rebuilds its DOM/animation state from scratch instead of reusing nodes.**
Quick Grip can push tap cadence down to 180ms, so in principle the same plot could get re-targeted
by the same proc well within its own ~1s animation lifetime. Toggling a class on a long-lived node
risks a retrigger looking like nothing happened (the browser won't restart a still-running
animation just because the same class got re-applied). Removing and recreating the ephemeral pieces
(cloud, drops, bee sprite) every trigger guarantees a fresh animation every time, at the cost of a
little extra DOM churn that's irrelevant at this scale.

---

## 2026-08-05 — Three tap-triggered garden procs added; Sprinklers repriced and recapped

**Decision.** Added three new badges that each add an independent, per-tap "slot machine" roll
(manual tap or hold-tick, same as every other tap effect):

- **Rain Dance** — `level × 1%`, caps at 10% (10 levels). Instantly shaves 3s off a random
  growing plot's remaining grow time. An "instant shave," not a timed buff — it applies once and
  is done, rather than granting a temporary rate boost.
- **Bee Swarm** — `level × 1%`, caps at 5% (5 levels). Adds one jar of whatever's currently
  blooming to a random hive with room, reusing the same "variety fixed at production" rule the
  Apiary already uses for natural honey (see [03-systems.md](03-systems.md)).
- **Lucky Ladybug** — `level × 1%`, caps at 8% (8 levels). Flags a random growing plot; its next
  harvest gets a +1.0 bump to `rollRarity`'s weight bonus (roughly doubling non-common odds for
  that one harvest), then the flag clears.

Alongside this, **Sprinklers (`autoWater`) was rebalanced**: effect per level dropped from an
uncapped 5% to 1%, now hard-capped at 10 levels (10% total), and its price curve was cut from
2,500 base / 2.2 scale to 400 base / 1.7 scale.

**Why independent per-tap rolls, not a shared pool.** The designer's brief was explicit: it
should feel like a slot machine — always a live chance of something firing, not a single shared
roll that one badge "wins" over another. Each badge is checked separately in `tapFlower()`, so on
a lucky tap more than one can fire at once.

**Why "instant shave" over a timed buff for Rain Dance.** A timed growth-speed window (e.g. "+50%
speed for 3s") stacks unpredictably with everything else touching `growModifier`, and its value
depends on how much is currently planted — a dead multiplier if nothing's growing at that moment.
An instant, flat time reduction is worth the same whether it lands on a nearly-ready plot or one
that just went in the ground, and it reads clearly on a single plot rather than as a global rate
change.

**Why duds do nothing instead of rerolling or refunding.** If there's no eligible target (no
growing plot, no open hive), the trigger is simply wasted — no compensation, no guaranteed retry.
A slot machine that quietly fixes itself when the reels don't line up stops being an honest one,
and it would let the badges' *displayed* percentage silently understate their real value.

**Why Sprinklers had to be repriced, not just recapped.** The old price curve was built for an
effect that was ostensibly uncapped (in practice bounded by the shared 0.3 growth floor around
level 14, at a cost of roughly 2.4M coins). Keeping that curve while cutting the per-level effect
to a fifth and hard-capping at level 10 would have made the full 10% cost ~5.5M coins for a much
smaller payoff than before — a badge nobody would rationally buy past level 2. Since the new
Sprinklers is a smaller, earlier-game lever by design, it needed a smaller, earlier-game price to
match. New total cost to fully max: ~114K coins, in line with Rain Dance (~111K) and Lucky Ladybug
(~150K) — all three now feel like comparable mid-game investments rather than one being priced for
a payout curve it no longer has.

**Why the 0.3 growth floor stayed in the code.** It's now effectively unreachable with the new
caps (Seed Rush's +30% plus a maxed Sprinkler Network's +10% only reaches 0.6), but it costs
nothing to leave as a defensive backstop against future boosts stacking unexpectedly, and removing
it would be scope with no player-facing benefit.

## 2026-08-05 — Seed picker gained a "Balanced" sort

**Decision.** Added a fourth seed-sort tab, `balanced`, next to tier/cheapest/priciest. It sorts by
`abs(cost − credits/unlockedPlots)` — closest first — instead of raw price. No economy change: it
only reorders the same list `costAsc`/`costDesc` already draw from.

**Why.** The existing sorts answer "what's cheapest/priciest," which pushes toward either
under-spending or dumping your whole balance into one plot. Balanced answers "what's the best I
could plant in *every* plot at once," which is closer to what a player actually wants when working
a full garden rather than optimizing one cell in isolation.

## 2026-08-05 — Hold-to-tap added as an input method, not a new payout path

**Decision.** Holding the flower now repeats an ordinary tap on a timer instead of requiring
repeated presses. The Quick Grip badge shortens that timer, 900ms → 180ms floor over 12 levels.
Every roll a manual tap makes (crit, gem, ticket, Wonder) still happens per hold-tick, unchanged —
holding is a different way to trigger `tapFlower()`, not a different, better version of it.

**Why there's a hard floor instead of an uncapped upgrade.** The original ask was an upgrade line
that shrinks the hold interval "by milliseconds," which taken to its limit is an auto-tap exploit:
enough levels and holding down a button produces unbounded credits per second, tied to
implementation details like timer resolution rather than any deliberate rate. The floor (180ms,
`HOLD_INTERVAL_MIN` in `game.js`) is picked to land at roughly a fast manual tap's cadence, so a
maxed Quick Grip is *convenient*, never *better than playing*. This was a deliberate design
constraint agreed with the designer before implementation, not a default I picked unilaterally.

**Why it starts slower than active tapping.** A day-one hold at manual-tap speed would make the
button-mash feel (crit chance, combo ring, haptics) pointless immediately — nobody taps once
holding is free and equally fast. Starting at 900ms means holding is initially a strict comfort
trade against active tapping, and only converges toward parity as the player invests in it.

---

## 2026-08-05 — Navigation phase 1 built: Upgrades, cosmetic decor, boost tray

**Decision.** Built phase 1 of [15-navigation-and-ia.md](15-navigation-and-ia.md). Badges renamed
to Upgrades (no content change — it already held badges and the eight harvesters). Decor's stat
role was deleted outright rather than merged into Upgrades; the items themselves became cosmetic
and moved to a new Shop tab. Boosters lost their dock tab and sheet panel entirely; they now surface
as chips in the status rail — a countdown while active, a tap-to-buy-and-activate chip while
affordable and idle, nothing otherwise. Dock is now `Upgrades · Apiary · Craft · Shop`. Existing
decor owners are refunded at purchase price on first load, via a version-gated migration (save
schema 2 → 3).

**Why decor was deleted rather than merged.** The doc's "merge Badges and Decor into one Upgrades
surface" language describes fixing the duplication, not literally combining both cards into one
list. Badges already covered every stat decor touched; decor's only remaining job is to be an
honest cosmetic sink.

**Why boosts kept ticket-purchase instead of becoming reward-only immediately.** The doc's full
vision sources boosts from order rewards, rewarded video and drops — none of which exist yet (no
order system, no ad mediation, no drop mechanic). Cutting the only working acquisition path with
nothing to replace it would have made every booster dead content and stranded the ticket currency,
which exists almost entirely to buy them. Keeping ticket-purchase, just relocated off the dock and
into a tap-to-activate tray, satisfies the navigational goal (off the dock, contextual, one tap)
without inventing a new drop economy inside what was scoped as a small, safe, self-contained
change. Retiring tickets and wiring up real reward sources is its own balance project, deliberately
deferred — flagged to the designer before building, who confirmed this reading.

**Why the refund keeps the item rather than deleting it.** The alternative — stripping decor
entirely from a save — would have been a bigger surprise for the same generosity budget. Keeping it
as a cosmetic record and adding the refund on top costs nothing extra and reads as "this got better
for you," not "this got taken away."

**Why schema version was bumped for the first time.** `version` had been set unconditionally since
its introduction, reserved for exactly this kind of change. Decor's meaning changed (stat-carrying
→ cosmetic), which is what the save-data doc's guidance calls for a version bump over. See the
worked example in [07-save-data.md](07-save-data.md).

---

## 2026-08-05 — Navigation: places on the map, systems in the dock

**Decision.** The dock holds `World · Orders · Shop · Almanac · Events`. Regions are locations on
the map, never tabs. Upgrades become contextual to the object they upgrade. Decor becomes purely
cosmetic. Boosts become power-ups sourced from rewards rather than a shop. Full specification and
build order in [15-navigation-and-ia.md](15-navigation-and-ia.md).

**What prompted it.** The dock is labeled `aria-label="Shops"`, which is an accurate description of
the problem: every tab was a checkout, so no tab had a distinct job. Badges and Decor turned out to
be the same system twice — four decor items and four badges modifying the same four stats, differing
only in the currency paid.

**Why regions must not be tabs.** The locked design is a contiguous map that grows outward. Tabs and
a map are competing navigation models: if regions stay tabs the map becomes decoration, the visible
sprawl that was supposed to be the reward stops being load-bearing, and every new region costs a
dock slot out of five. The Apiary and Craft tabs shipped as an explicit prototype shortcut.

**Why upgrades become contextual.** A flat list of eight nearly identical plot harvesters is a
symptom of a global menu doing per-object work. Attaching upgrades to the object is the
Township/Hay Day pattern and is the only reason the dock can stay at five slots as regions multiply.
Phased last because a flat list is genuinely fine while there is one region.

**Why decor loses its stats rather than badges being deleted.** Cosmetics are a clean gem sink and
an expression layer that supports the monetization plan; a second stat menu supports nothing.
Existing owners get refunded at purchase price, because exact conversion into badge levels is not
possible — Crystal Fountain's multiplicative `tapYield` has no equivalent in Power Punch's flat +1.

**Why boosts leave the dock.** They are power-ups, and players do not shop for power-ups — in Coin
Master they fall out of the slot machine. Moving them to a contextual tray also places the
rewarded-video prompt where a player actually wants a boost, which is worth more than a menu entry.
This is also the natural moment to retire tickets, since tickets exist almost entirely to buy
boosts.

**Considered and rejected: a "Manage" mega-tab** holding upgrades, decor and boosts behind
sub-tabs. Least disruptive to the current code, but it renames the junk drawer instead of emptying
it. Also rejected: making the order board the home screen, which demotes the garden — in a cozy
game the pleasure is the place, not the checklist.

---

## 2026-08-05 — Garden ↔ Apiary ↔ Apothecary prototyped

**Built** the smallest closed version of the resource loop in the web build, as two dock tabs.
Mechanics in [03-systems.md](03-systems.md), tests in `tools/sim-test.js`.

**Why a sheet tab rather than hives beside the garden.** The prototype exists to answer one
question — is the loop fun — and a camera, a world map and region art answer none of it. The tab
reuses the existing sheet architecture and is throwaway if the loop fails.

**Why honey variety is fixed when the jar is produced.** Sampling at collection time is simpler, and
exploitable: leave the garden empty, plant one Eternal Crown, collect five jars of the most
valuable honey. Fixing variety at production forces the bloom to have actually stood in the garden
while the bees worked. Offline accrual still works because production is derived from elapsed time.

**Why flowers are a byproduct rather than replacing credits.** Harvest pays credits *and* banks the
bloom. Making crafting compete with the existing payout would have meant rebalancing the entire
nineteen-seed economy to test one hypothesis. As a byproduct, crafting is additive and the existing
balance is untouched.

**Why crafted goods sell for credits.** A placeholder for the Market. The invariant that orders must
pay more than selling still holds — these prices are the floor orders have to beat.

**Why storage caps were left out**, despite being a locked design decision. They add friction that
would confound the only question the prototype asks. They go in when the Market does.

**Deliberately untuned.** Every value is provisional. `tools/sim-test.js` asserts the *invariants*
that must survive tuning — crafted goods beat their ingredients by at least 1.35×, and every recipe
spans two regions — rather than the numbers themselves.

---

## 2026-08-05 — Resource graph locked; merge replaces match-3; world stays botanical

**Decisions.** Five regions: Garden, Apiary, Potting Shed, Apothecary, Market. The one new mechanic
is **merge**, not match-3. Mining and chickens are cut. Tickets retired, water never introduced.
Land unlocks via reputation. Full specification in
[12-meta-layer-design.md](12-meta-layer-design.md), with the Market in
[13-order-system.md](13-order-system.md) and resources in [14-economy-model.md](14-economy-model.md).

**Why merge over match-3.** Reversed from the previous entry. Content efficiency is decisive at two
people: match-3 players burn roughly fifty hand-designed levels a week, and that treadmill has
killed more small teams than anything else. A merge item tree entertains for months. Merge is also
cheaper to build (no cascade resolution, blocker taxonomy, booster interactions or level editor),
is the strongest-performing casual mechanic of the current era, and its slower pace suits a cozy
game. Decisively, seed-breeding *is* merging — mechanic and fiction are the same thing, so there's
no metaphor to teach.

**Why bees instead of chickens, and no mine.** Tonal coherence is this game's cheapest competitive
advantage. A cozy magical garden with a talking flower is a specific, defensible identity; grey ore
and a chicken coop pull it toward generic farm-sim, where it competes with Hay Day and loses. Bees
deliver the same production fantasy on-brand — and honey type following current blooms creates a
*harder* dependency than a resource sink, because the garden's contents matter, not just its
throughput.

**Why a crafting tier was added.** Previously under-specified. A graph where regions produce raws
and the Market consumes them still leaves regions parallel — players farm whichever raw pays best.
An Apothecary that combines flowers and honey into perfume, with the Market wanting *perfume*, makes
the dependency structural rather than a matter of pricing.

**Why reputation gates land, not coins.** Idle economies inflate coins unpredictably; reputation
only moves when a player engages the whole graph, making it a controlled progression gate.

**Why tickets are retired and water was never added.** Casual players fall off past four or five
tracked quantities. Tickets existed only as an inheritance from the previous build. Water is
friction without fun — watering stays a tap interaction, which `hasten()` already implements.

**Deliberately not tuned.** The numbers in [14-economy-model.md](14-economy-model.md) are
placeholders. Tuning waits until the Garden ↔ Apiary loop has been played, because values chosen
before the loop is felt are fiction with decimal places.

---

## 2026-08-05 — Direction set: modest revenue, multi-region meta-layer, one new mechanic

> **Partly superseded** by the entry above: the new mechanic is now merge in the Potting Shed, not
> match-3 in a mine, and the region themes changed. Everything else here still stands.

**Decisions.** Target is modest revenue (a few thousand a month), not a venture-scale hit. Next
milestone is a multi-region world built as one contiguous expanding map. Regions feed a single
interlocking economy driven by a Township-style order system. Exactly **one** genuinely new
mechanic — match-3 in the mine — with other regions shipping as timer production until the
structure proves it retains. An engineer ports to Unity, starting with the platform shell rather
than the garden.

**Why modest revenue.** Township-tier games are user-acquisition businesses with games attached;
success there is roughly 20% game quality and 80% economy tuning, liveops and CPI-versus-LTV
arithmetic, funded by large marketing spend. A two-person team without a UA budget can't compete
on that axis, but a well-made niche idle game with player-friendly monetization and web-portal
distribution is genuinely achievable.

**Why one contiguous map over a hub with rooms.** Visible sprawl is itself the reward and the store
screenshot; no context switching means short sessions still touch several systems; one scene is far
cheaper than N region screens.

**Why the order system.** Nothing else in the design consumes multiple resources at once, so without
it players optimise the single best region and interdependence is never felt. It's also the
cheapest infinitely-extensible content lever available and becomes the liveops surface later.

**Why only one new mechanic.** Four minigames is four games' worth of tuning, art, tutorial and bug
surface for two people. Players need distinct rewards and visuals, not distinct mechanics.

**Why data-driven numbers are non-negotiable.** If changing a grow time needs an engineer and a
build, tuning stops — and an untuned economy is the most common cause of death in this genre.

Full specification in [12-meta-layer-design.md](12-meta-layer-design.md).

---

## 2026-08-05 — Documentation set created

**Decision.** Wrote this `docs/` folder as the onboarding surface for future work, on the
assumption that most of it will be done by agents starting with no context.

**Why.** The game had reached a size where its behaviour was only discoverable by reading roughly
3,700 lines of source. Several values (rarity weights, upgrade scaling, the growth floor) are load
bearing and easy to break without knowing they matter.

**Notes.** Every number quoted was extracted from the code, and the derived economy tables were
computed by evaluating `data.js` rather than by hand — an earlier hand-calculation of the plot 8
harvester cost was wrong by half. Original *Idle Garden Reborn* design documents were moved to
`docs/legacy/` so they can't be mistaken for current truth.

---

## 2026-08-02 — Repository made public to enable GitHub Pages

**Decision.** Made `jonishua/ghostgarden` public and enabled Pages from `main` at the root.

**Why.** The owner wanted a link to send friends. GitHub Pages doesn't serve private repositories
on the free plan, so the alternatives were paying, using a third-party host, or going public. The
repository was scanned for secrets and personal data first and contained none.

**Consequence.** The repository root is now a live public site and pushing to `main` deploys. There
is no staging environment.

**Later.** The repository was renamed `ghostgarden` → `gardenwonder` on 2026-08-14; the URL in this
entry is historical. See the strategy-pass entry at the top of this file.

---

## 2026-08-02 — Game moved into the repository root

**Decision.** Moved the game from `VIBE Games/Garden/wonder/` to the repository root, with the
previous build archived in `legacy/`.

**Why.** The git repository and the game were in unrelated folders, so there was nothing to push.
Putting the game at the root also lets Pages serve it with no configuration.

**Excluded.** `Prototype/` — 3.4 GB across 90,392 files of Next.js build output — was left on disk
and added to `.gitignore`. GitHub would have rejected it.

---

## 2026-08-01 — Rebuilt as a new directory rather than editing in place

**Decision.** Built Garden Wonder as a fresh set of files instead of refactoring *Idle Garden
Reborn*, keeping the original playable.

**Why.** The visual and structural changes touched essentially every line. A rewrite alongside the
original meant the old build stayed available for comparison, and the economy could be ported
deliberately rather than accidentally mutated.

---

## 2026-08-01 — Economy ported unchanged

**Decision.** Carried every economic value across untouched: seed costs, yields, grow times, rarity
weights, upgrade scaling, decor and booster values.

**Why.** Two reasons. Migrated saves had to behave identically or players would feel robbed. And
keeping balance frozen meant any complaint about the rebuild was unambiguously about presentation.

**Consequence.** Several quirks came along: the Orchid throughput dip, endgame seeds having lower
gem chances than a Daisy, and the combo having no payout effect. All inherited, all documented in
[11-known-issues.md](11-known-issues.md), none fixed. Fixing them is a balance project and should be
treated as one.

---

## 2026-08-01 — Split into seven modules

**Decision.** Replaced the single 1,100-line `main.js` with seven files by responsibility.

**Why.** The original mixed simulation, rendering and input in one scope, so changing a payout
formula meant reading DOM code. The split makes `game.js` independently testable in principle and
gives the art and audio systems clear boundaries.

**Trade-off.** `ui.js` is still around 1,000 lines and remains the file most in need of further
splitting.

---

## 2026-08-01 — All art generated, no asset files

**Decision.** Every visual is inline SVG or CSS. No images at all.

**Why.** Nineteen seeds needing distinct art at multiple sizes would have been the bulk of the work
as hand-drawn assets. Generating from a small data block per seed made a nineteenth flower about
eight lines. It also keeps the whole game at 476 KB, diffable, and recolourable.

**Cost.** Small-size readability had to be engineered rather than eyeballed — the slim-petal
switch above 10 petals, per-shape ring scale tuning, and omitting the core on four silhouettes all
exist because early versions turned to mush in shop cards.

---

## 2026-08-01 — All audio synthesized

**Decision.** Web Audio synthesis, no audio files, everything pitched to a C major pentatonic scale.

**Why.** Consistent with the no-assets rule, and the pentatonic constraint means any layered
combination is automatically consonant. It also enables the tap pitch climbing with the combo,
which would need dozens of samples otherwise.

---

## 2026-08-01 — Shops as a draggable bottom sheet

**Decision.** All six panels live in one bottom sheet with a drag-to-dismiss grip, rather than
inline panels or a separate screen.

**Why.** The garden had to own the screen. A sheet keeps it visible behind a scrim, matches the
platform gesture vocabulary players already know, and gives one consistent place for all content.

---

## 2026-08-01 — Save migration hardened against pristine shadowing

**Decision.** Added `isPristine()`, which discards a modern save that was written but never played
if a meaningful legacy save exists.

**Why.** Found in testing. Merely opening the new build writes a `gw-save`. Without the check, a
player who launched it once and closed it would have their real *Idle Garden Reborn* progress
shadowed permanently by an empty save.

---

## 2026-08-01 — Day cycle always starts at midday

**Decision.** `DAY_START = 0.46`, derived from page load rather than wall-clock time.

**Why.** The cycle originally began at its zero point, which is midnight, so a first launch showed
a dark screen. Starting at bright midday guarantees a good first impression, and deriving from load
time rather than the real hour means a player at 3 a.m. still gets a sunny garden.

---

## 2026-08-01 — Grid rows pinned explicitly

**Decision.** Explicit `grid-row` on `hud`, `rail`, `stage` and `dock`, with `minmax(0, 1fr)` tracks.

**Why.** A real bug. The rail hides on short screens; with implicit placement the remaining rows
shifted up and the dock stretched into the free track, producing buttons that consumed a third of
the screen.

---

## 2026-08-01 — Rare harvests get no toast

**Decision.** Toasts only for Epic and Legendary. Rare gets stars and floating text. Cap of two
toasts on screen.

**Why.** Rare is a 20% roll. With automation running, toasts became a constant stream and stopped
meaning anything. Reserving them for the top two tiers restored their signal value.

---

## 2026-08-01 — Talking flower speech throttled

**Decision.** 3.2 s minimum gap, 6% chance on taps, 12% on harvests, suppressed while a coach mark
is visible; milestones always speak.

**Why.** Speaking on every interaction turned a charming character into an irritant fast, and
bubbles collided with coach marks during onboarding.

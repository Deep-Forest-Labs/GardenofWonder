Understood — cheats stay. That's a reasonable call for a friends-and-family build, and it means the analytics concern is moot too since you're not treating their sessions as clean data anyway.

Let me note that decision so nobody (including me) re-raises it, and check the research.

Research is still fanning out. In the meantime, here's my design read — this part doesn't depend on the market data, and it's the bulk of what you asked for.

## The diagnosis

Garden Wonder has **excellent texture and a weak between-session loop.** The tap feel, art, juice, and moment-to-moment polish are genuinely above the bar for this genre. But idle games don't live on texture — they live on what happens when the player *isn't* playing. Right now, closing the tab stops the game almost completely.

That's the whole story, and it's fixable.

## What I'd build, in order

**1. Offline earnings + a "while you were away" moment.** *(highest return in the project)*

Today, automation runs on `requestAnimationFrame`, so a closed tab earns nothing. Your maximum reward for being away is 8 ripe plots and 7.5 minutes of honey — an overnight absence pays the same as a coffee break. That is precisely backwards from how the genre works.

The fix: reconcile elapsed time on load, simulate automation forward against a cap, and greet the player with a collect-able total. This single change converts "I stopped playing" into "I have a reason to open the app," and it retroactively makes every automation upgrade you've already built matter more.

It also hands you three proven levers you currently don't have: *extend the offline cap* as an upgrade, *double offline earnings* as the natural rewarded-video slot, and a daily reason to return that isn't a single quest.

**2. The Market / order board.** Your docs already name this as next and the reasoning is sound — I'd only add that it's also your best retention lever, not just your best content lever. It answers "what do I do now," it makes a *specific* flower worth planting (the question Bloom Mastery honestly failed to answer, as your handoff already concedes), and the daily premium order is a second come-back-tomorrow hook. Build steps 1–3 of your documented build order and stop there.

**3. Give gems a real sink.** 290 gems buys literally everything purchasable in the game. Gems are your future premium currency, and right now you're training players that they're worthless — you'd have to un-teach that later. Order rerolls, offline-cap extensions, instant-grow, an extra craft slot. Cheap to add, and it makes the eventual monetization feel native rather than bolted on.

**4. Design the prestige layer now; build it later.** This is your "don't cap the ceiling" item. Your docs state flatly: *no prestige, no soft wall.* Progression is authored to level 20 and then simply stops. For a title with hit ambition that's the single hardest ceiling you have — it's the mechanic that turns 20 hours of content into 200. I'm **not** suggesting you build it now. I'm suggesting you stop making economy decisions that preclude it: keep multipliers separable so a prestige multiplier can slot in cleanly.

**5. Fix the inverted gem chances before layering content on them.** Your top five seeds have *lower* gem drop rates (0.8–2%) than the 5% default every cheap seed gets, so the optimal gem strategy is spamming Daisies. Content built on a backwards curve compounds the problem.

## Quick win worth taking

You're staying on web — so **add a manifest and service worker.** It's small, and it makes the game installable to the home screen with an icon and splash. Your testers get something that feels like an app instead of a bookmark, and it's the prerequisite for web push later. You already have every meta tag except those two files.

## Two things I'd push back on

**Don't touch the world map or merge yet.** Your docs already say this and they're right. Both are large, and neither fixes retention.

**The naming is a real problem.** The URL says `ghostgarden`, the game says *Garden Wonder*, and the docs use both. That's confusing the moment a tester shares a link. More importantly — you're building a game called **Garden Wonder** whose stated visual reference is **Super Mario Bros. Wonder**, complete with a talking flower companion and a "Wonder Effect." That's fine as a private prototype. It is a genuine trademark risk the day you put it on an app store with real revenue. Worth deciding early, because renaming gets more expensive with every asset and doc.

I'll fold in the market findings as soon as they land — particularly on how the top titles handle the offline/return loop and what monetization actually suits a two-person team.

The cozy-collection research landed (the idle/incremental and monetization threads are still running). It's substantial, and it **changes one of my earlier recommendations** — plus it answers the biggest open question in your docs.

## Your #1 open design question has an answer, and it isn't the Market

Your handoff says Bloom Mastery failed to make the garden's *contents* matter, and pins that hope on the Market. I'd said I agreed. Having seen how this genre actually solves it, I'd revise: **orders make a flower instrumentally wanted — a quota to fill. They don't make you want *that flower*.** The cozy-collection genre solves it with cheaper, more durable devices:

**Item-as-key.** Neko Atsume has 26 rare cats, each sitting behind one *specific named goodie* — Sassy Fran lives behind the Cardboard Cafe, Ramses behind the Pyramid Tent. Every shop item stops being "Tier 4 Toy" and becomes a character unlock. For you: each seed and decor piece is the key to exactly one named flower-character, shown in the Almanac as a silhouette with a hint. Cost is a lookup table.

**The memento.** Each cat leaves one unique named keepsake after *repeated* visits — Jeeves leaves a Silver Pocket Watch, Ms. Fortune an Oval Coin. Each is a small joke about the character. Fifty species = fifty small jokes, and the reward is for a relationship over time rather than a single drop.

**Flavor text — and you already built the slot for it.** This is Animal Crossing's real secret: Blathers *reacts* to each donation with a fact and a joke, which is why players donate instead of selling. **Your talking flower is a ready-made Blathers.** Two or three lines per species across ~50 species is roughly 150 lines — about a week of your time, and it's the single biggest differentiator available to you. Worth knowing: *Tamagotchi Plaza* sold 500K units at a Metacritic of **43**, carried almost entirely by IP affection. You don't have Sanrio or Bandai IP, so the writing has to do that job.

**Almanac-as-shop.** Pocket Frogs' Froggydex holds 50 types and lets you re-buy *any catalogued frog with coins, forever*. Your album is your inventory. You already track `discovered` — this turns the Almanac from a trophy case into a tool, and gives late-game players a reason to fill gaps.

**Rarity you can see.** Pocket Frogs' Glass and Chroma mutations are visually spectacular, not statistically superior. Given your art direction, this is your strongest unused asset — rare flowers should be identifiable across the garden at a glance, not by a bigger number.

## This corrects my offline-earnings advice

I told you to build a "welcome back" with a collectable total. The genre says the framing matters more than the number: **never show "+4,213 gold while you were away."** Neko Atsume's entire retention is one screen showing *who visited, what they did, and what they left* — evidence of a lived-in world, not an accrual counter. Same mechanic, completely different emotional result. Build the reconciliation as I described, but present it as a scene.

## A warning that contradicts a locked decision in your docs

**Neko Atsume 2 added item durability** — goodies break, repairs cost currency — and it's the single most-criticized change in the sequel, described as a straight downgrade. Adding a maintenance tax to a no-pressure cozy game is the one thing this audience actively punishes.

Your docs list **storage caps** as a locked-but-unbuilt design decision. That's decay-adjacent, and your own first pillar is *"cosy, not demanding — nothing punishes you for leaving."* I'd re-examine it before building it.

## Scope: two comparables, opposite outcomes

- **Sneaky Sasquatch** — *two people*, one small world accreted for six years, became Apple Arcade's #1 US game and Game of the Year. RAC7 was acquired by Apple in 2025.
- **Palia** — a 130-person cozy MMO. 85 people laid off across two rounds in 2024, studio sold. Right genre, wrong burn rate.

You're the first profile. Depth-by-accretion in a single scene, not breadth of scenes. And on content volume: **Alba won an Apple Design Award with 62 species**; Neko Atsume won a design award with fewer cats than it has now. Your 19 seeds want to become 50–80, not 500.

## Monetization, briefly

Opt-in rewarded ads → a decor currency (Cats & Soup does this at 60M downloads, never interstitial), soft currency for the shop, and an optional $0.99–$2.99/mo cosmetic tier. **No loot boxes** — regulatory pressure on them is the stated reason Nintendo killed Pocket Camp, a game that had earned $381M. And worth architecting for now: a premium offline conversion is a proven, dignified exit (Pocket Camp Complete took $3.1M in a week). Keeping the game fully playable offline from day one gets you that option free.

## Revised build order

1. **Offline reconciliation + a "who visited" scene** — unchanged in priority, changed in presentation.
2. **Item-as-key + memento + companion flavor text** — moved *ahead* of the Market. It's cheaper, it's the thing that makes contents matter, and it needs no new systems.
3. **Almanac-as-shop** — small change, large effect, uses state you already track.
4. **The Market** — still valuable as a goal generator and live-ops surface, just no longer carrying the "why this flower" burden alone.
5. Gem sinks, then the known economy bugs.

The idle/incremental and monetization threads are still running — I'll add anything that changes this. Want me to start on any of these, or would you rather talk through the item-as-key design first? I'd suggest the latter, since it touches your data model and is much cheaper to get right on paper.

The idle/incremental brief landed too. It sharpens the diagnosis considerably — and it names your exact failure mode.

## The uncomfortable finding

**Your 19 seeds are AdVenture Capitalist businesses.**

AdVenture Capitalist hit 40M+ players with charming, distinct-looking businesses — Lemonade Stand, Shrimp Boat, Movie Studio. Every one did the same thing: produce money at a rate on a timer. No synergies, no unique verbs, no collection layer. Pocket Gamer scored it **3/10** citing "little reward for progress," and it's decayed to roughly $100K/month.

Your economy has one protected invariant: **every seed yields exactly 1.4× cost at Common, all 19 tiers.** Seeds differ *only* in throughput. That's cosmetic personality on an undifferentiated multiplier ladder — the documented decay pattern. It also explains, precisely, why Bloom Mastery couldn't make contents matter: a percentage of an undifferentiated thing is still undifferentiated.

The good news is that every fix is cheap, structural, and needs no live-ops.

## Four fixes, in value-per-hour order

**1. Named synergy pairs — the highest-leverage device in either report.** Cookie Clicker ships 36 of them; each is one row of data and a name. Mechanically: owning both of two specific things boosts both. For a botanical game **this writes itself** — companion planting is real horticulture. "Lavender and rosemary like each other." Suddenly planting lavender has a reason that isn't its yield number, and an old boring seed becomes interesting again when a late partner unlocks.

**2. Multi-clock species.** Your seeds run 12s–780s — one rhythm, compressed. The reference pattern gives producers *deliberately* different clocks: 20 minutes, 5 hours, 2 days. That single change (a) gives every species identity beyond yield, (b) serves the 15-minute checker and the once-a-day player from one system, (c) creates real bed-allocation decisions, and (d) makes your offline cap species-dependent and therefore interesting.

**3. Rotate effect categories.** Enforce a rule: no two adjacent unlockables share an effect *category*. Rotate through rate → capacity → cost reduction → duration → unlock-key → synergy. Egg Inc's artifacts do this — one raises a cap, one cuts research cost, one extends boost duration. Your 19 upgrades are almost entirely rate-and-chance multipliers. A player choosing between "+30%" and "+30%" is choosing nothing.

**4. Item-as-key** (from the cozy brief) — an item that opens a bed, a biome, or an Almanac page rather than adding a percent.

The practical test to apply to every unlockable you ship: *can the player explain what changed without opening a calculator, does it unlock a choice they already understand, and is it still relevant thirty seconds later?*

## Offline: I'm revising this again, and it's better

Don't build one offline system. Build **two orthogonal upgrade axes**, which is how Cookie Clicker does it:

- **Rate** — what fraction of your online income accrues while away (theirs: 5% → 75%)
- **Duration** — how long you earn at full rate before it drops off (theirs: 1h → 5d 8h)

That's ~14 individually meaningful, nameable upgrades out of one system, and it converts "how the game treats you while you're away" from a system tax into a *desirable unlock chain*.

**But start generous.** Melvor Idle's 18-hour cap produced a well-upvoted rage-quit thread — *"REQUIRED to interact with this game EVERY SINGLE DAY"* — and they retreated to 24h; the sequel now markets full-rate offline as a headline feature. Given your "cosy, not demanding" pillar, I'd start around **25% rate / 4h full-rate** and let both climb toward 100% / 24h+. **Don't use the cap as a monetization lever** — use it as an unlock chain. Offer the 2× doubler on the welcome-back screen and nowhere else.

## Prestige: the framing problem is solved

I flagged prestige as your biggest ceiling but couldn't square "delete your garden" with a cozy brand. The genre has two softeners, and one is perfect for you:

**Seasonal turnover.** The garden clears because that's what gardens *do*. You keep the seeds. It's narratively free and makes the reset cozy rather than punitive. Pair it with **permaslots** — the player chooses which upgrades survive — which converts loss into authorship.

Use a **cube root** on lifetime earnings for the payout curve (that's Cookie Clicker's; AdVenture Capitalist uses square root for more frequent resets). Cube root makes the first turnover cheap and each one meaningfully harder without a wall. And per the brief's blunt advice: **never use the word "reset."**

## Numbers to plan against

Your genre proxy is Simulation: **~30% D1, ~8.7% D7, ~3% D30** is genre-par in 2026. Critically — **do not judge Garden Wonder on D1.** Idle's advantage is tenure, not first-session hook.

The business shape closest to your stated goal is Egg, Inc.: solo-founded, ten years of continuous updates, roughly **1M weekly actives generating ~$0.12 per active per week**. Modest ARPU, enormous tenure. That's a real, reachable target.

And your scope model is **Idle Slayer** — one person, 700+ upgrades, 600+ achievements, 10M+ downloads, no live-ops, and "no forced ads" as explicit positioning. **Not** Legend of Slime, which is content-treadmill-dependent and needs a UA team running 140 live creatives.

## One correction on your web plan

You're staying on web, which I agree with for prototyping. But be clear-eyed about it as a *channel*: browser portals are marketing and playtesting, not revenue, at your scale. Poki and CrazyGames both run idle categories, but idle games have a structural problem there — their value accrues over days while portal sessions last minutes with no cross-session identity. A well-performing web game earns $200–$2,000/month.

The path that actually worked is **Melvor's**: free browser build as top-of-funnel, paid mobile as the conversion. Which is essentially your existing plan — worth knowing it's validated.

## Revised roadmap

1. **Synergy pairs + multi-clock species** — cheapest, most structural, directly fixes the undifferentiated ladder
2. **Item-as-key + memento + companion flavor text** (~150 lines, one week, biggest differentiator you have)
3. **Two-axis offline + narrated welcome-back scene**
4. **Almanac-as-shop with set-completion bonuses**
5. **The Market** — still worth building, no longer load-bearing for "why this flower"
6. Gem sinks, then the known economy bugs
7. **Seasonal turnover** designed now, built later

The monetization and top-games threads are still running; I'll flag anything that changes this.

Two offers — say which you'd like:

**Talk through synergy pairs + multi-clock first.** Both touch `data.js`'s seed schema and your sim-test invariants, and multi-clock in particular breaks the "every seed yields 1.4× cost" rule that 249 assertions are built on. Much cheaper to settle on paper.

**Or I write this up into your docs properly** — a dated entry in `10-decision-log.md` with the reasoning and what we rejected, plus updates to `16-progression-and-quests.md`. Your `AGENTS.md` wants that in the same commit as any code, and right now this analysis exists only in this chat.

The full market brief is in. It reframes the strategic picture, and it **corrects one of my own recommendations.**

## The headline: your lane is proven and genuinely unserved

**Farming sim did $576M in H1 2026, up 15%, on 172M downloads — and all eight titles that crossed $100K/month target Eastern markets.** A bright, Western-appeal, non-gacha garden game is an actual gap on iOS and Android.

The demand proof is almost absurd. **Grow a Garden**, released on Roblox in March 2025 by an anonymous 16-year-old, hit **22.3M concurrent users** — beating Fortnite's all-time record of 15.3M. A billion visits in 33 days. No combat, no fail state: buy seeds, grow, harvest, sell. That is *your loop*, and its audience skews 16–24, not children.

Two caveats that matter. **The gap is closing** — *Grow a Garden* clones are already on both stores, so speed and craft are the moat now, not the idea. And **the default outcome is invisibility**: 1,087 idle/clicker games released in 2026 earned ~$3.97M *combined* — about **$3,650 lifetime per title**. Escaping that bucket is the whole job.

## Your art direction is the moat — this is the most important validation in the brief

Cozy mobile is visually dominated by muted pastels, lo-fi, and pixel art. **Almost nobody applies Mario Wonder-grade squash-and-stretch, thick outlines, saturated color and confetti juice to an idle garden.**

That's craft, not content volume — precisely the axis where a two-person team with a strong designer out-executes a studio. The thing you've already built well is the thing that differentiates you. Your "every tap answers" pillar isn't polish; it's the product.

## The missing mechanic: mutations

This is Grow a Garden's actual engine and it's directly portable. **Gold mutation = 20× base value. Rainbow = 50×.** Wet from rain = 2×. Weather events are global and timed, and they *trigger* the mutations — and players stack the odds with sprinklers placed next to their best crops.

The effect: a common plant and a rare plant both stay interesting, because **any** plant can roll a jackpot. That decouples excitement from tier position — the exact failure mode we identified in your 19-tier ladder. It also generates a "look what I grew" screenshot, which is free marketing.

You already have the Wonder Effect, a day/night cycle, and rarity rolls. This is a recombination of parts you've built, not a new system.

## Correction: I was wrong about the PWA

I told you to add a manifest and service worker. **Withdraw that as a strategy.** The brief is specific: iOS push works only for Home-Screen-installed web apps, is **unavailable in the EU on iOS 17.4+**, there are no automatic install prompts, and Background Sync is unsupported. Apple restricts exactly the OS integration idle retention depends on.

It's still fine as a convenience for your friends-and-family testers. It is not a distribution or retention plan. Ship native for that.

Related: **portals optimize for short sessions and repeat visits; idle games monetize on multi-day retention portals don't retain.** Use a WebGL build on CrazyGames (their Basic Launch needs zero SDK work) as a *free demand test*, not a revenue center.

## Your Almanac is the wrong shape

Collection psychology is well-studied and your current milestones (5/10/15/19) are one 19-item set:

- **Optimal set size is 7–12.** Under 7 feels trivial, over 12 feels endless.
- **Never start a player at zero** — pre-loaded progress is the coffee-loyalty-card trick, and blank starts are the #1 abandonment cause.
- **The 40–60% mark is the tipping point** where players become fiercely committed.
- **Theme sets, don't index them** — "Moonlit Blooms," not "Page 1."
- The last item should be *moderately* hard. Impossible drop rates read as rigging.

So: themed pages of 7–12 with a little free progress, and **page completion should improve the growing engine itself** (faster germination, better mutation odds) — Pokémon's Shiny Charm trick, where the reward for collecting is a better collecting engine.

## Monetization: a clear verdict

**Rewarded video only. Zero interstitials, zero banners.** Rewarded generates ~40% of casual ad revenue from 21% of impressions, 74% of players prefer it, and ad density above three per session depresses casual retention ~27%. Critically, *"no forced ads, no energy timers, no fake timers"* is simultaneously a design decision and **your single best free marketing asset** in the one community that can launch you.

Best single IAP in the genre, and it's tonally perfect for you: **Egg Inc's Piggy Bank** — it accrues as you play, uncapped, and you crack it for $5.99. Players effectively set their own price and feel like they outsmarted the developer. Zero live-ops. A **"Seed Jar" or watering can** ports this directly.

**Do not build:** battle pass, scheduled live events, energy systems, gacha, multi-currency, launch-day subscriptions, leaderboards, or any RPG framing (idle RPG has the worst install rate in mobile at 2.0 per 1,000 impressions).

**One non-obvious trap:** a bright storybook art style attracts under-13 traffic, which triggers COPPA/GDPR-K child-directed ad treatment and **lowers your eCPM**. Choose your age rating deliberately rather than by accident.

## The number that defines your goal

Your docs say "a few thousand a month." That maps to roughly **2,000–3,000 sustained DAU** at rewarded-led ARPDAU of $0.04–$0.09. Achievable — but ~75% of idle games launched without UA fail outright, so the launch has to work.

And your launch channel is identified: **r/incremental_games.** Magic Research, a solo-dev incremental, made ~$400K in twelve months from **zero paid promotion and essentially two Reddit posts there.**

Two more targets: **core loop in 60 seconds, "aha" in 90** (highest-leverage single lever in the brief), and design for **~7-minute sessions, ~6 per day** — not one long session.

---

That's the complete picture. My consolidated recommendation, in build order:

1. **Mutations + synergy pairs + multi-clock species** — fixes the undifferentiated seed ladder using parts you already have
2. **Item-as-key, mementos, companion flavor text** (~150 lines)
3. **Two-axis offline + narrated welcome-back**, cap stated openly
4. **Almanac reshaped** into themed 7–12 pages with completion rewards that improve growing
5. **The Market**, with Township's free-reroll rule
6. **FTUE pass** to 60s/90s
7. Seasonal turnover (prestige) designed now, built later

**I'd strongly suggest I write this into your docs now.** Right now this entire analysis exists only in a chat window — which is precisely the failure mode `AGENTS.md` was written to prevent. Concretely: a dated entry in `10-decision-log.md` with the reasoning and what we rejected, a new `17-market-and-positioning.md` for the competitive findings, and revisions to `13-order-system.md` (free-reroll) and `16-progression-and-quests.md` (Almanac set sizing).

Say the word and I'll write it up and push it. Or if you'd rather start building, I'd pick mutations first — biggest effect, uses systems you already have.

Final addendum landed — and it contains the single best idea in all of this for *your specific game*, plus audience data that reframes priorities.

## Cookie Clicker's Garden minigame is your closest analogue, and nobody talks about it

40+ species where each does something **structurally different**, not numerically different:

- **Nursetulip** — surrounding plants +20% efficiency, but −2% output. An AoE buff with a real cost.
- **Tidygrass** — a 5×5 area develops no weeds.
- **Bakeberry** — harvest at maturity for a burst payload.
- **Elderwort** — immortal, and ages surrounding plants 3% faster.
- **Crumbspore** — explodes into free production when it dies. It dies *usefully*.
- **Brown Mold** — 50% chance to contaminate orthogonal neighbours. An actively hostile plant.

Because effects are AoE and adjacency-based, **the garden becomes a layout puzzle instead of a shopping list.** You plant *this* flower because of what's next to it.

**You already have the board for this.** Eight plots in a ring around the flower — adjacency is your existing spatial layout, unused. Ten flowers with distinct verbs generate more perceived depth than a hundred with ascending numbers, at a fraction of the art cost. And it structurally solves min-maxing: there's no single dominant answer when effects are *categorical* rather than numeric.

This is my top recommendation now, ahead of everything else.

## The audience data reframes your priorities

Quantic Foundry, n = 1.9 million players: **Family/Farm Sim is 69% female**, against an 18.5% sample-wide average. And for women, the two most common primary motivations are **Completion** ("get all the collectibles") and **Fantasy** ("be someone else, somewhere else"). Men skew toward Competition and Challenge.

Three consequences:

1. **Your Almanac isn't a side system — it's the spine.** Completion is the single most common primary motivation of your likely audience. It deserves to be the best-built thing in the game.
2. **"Design" outranks number-go-up.** Garden layout and decoration will outperform raw multipliers — which sits awkwardly against your recent decision to strip decor of its bonuses and shrink it to four cosmetic items. Cosmetic is right; *small* may not be.
3. **Fantasy is carried by art direction and the companion** — the two things you're already best at.

Supporting proof: **Finch**, a self-care pet app with ~75% women aged 25–35, bootstrapped to roughly $30–40M ARR, posts **D1 54% / D7 37%** — beating Royal Match and matching Duolingo. Its levers are dopamine-dense micro-rewards, low decision fatigue, and **non-punitive streaks.** Also worth stealing: **the home-screen widget is the notification** — an always-on retention surface at zero annoyance cost. (Related warning: players getting more than 2 streak notifications a week are **41% more likely to abandon.**)

## I need to revise the monetization advice

The cozy research contradicts the idle research, and the reconciliation matters. Cozy players don't reject *ads* — they reject **interruption**. So rewarded-only, zero interstitials, no ads in session one all survive. What doesn't survive is the **revenue mix**: planning for 80–90% ad revenue is probably wrong for this audience.

The warning case is precise: **Terrarium: Garden Idle has ~11M installs and earns roughly $9K/month.** Plants as numeric production units, monetized with a subscription that doubles output. Enormous reach, negligible revenue.

The better primary lever for an *almanac* game is **Little Alchemy 2's content-pack model** — free base game, $3.99 for 100+ new discoverables, plus optional hints. You're building an encyclopedia; "more encyclopedia" and "relief from being stuck" are the most natural things you have to sell. **Treat rewarded video as the floor and a content pack as the ceiling, not the reverse.** The Egg Inc piggy bank still fits either way.

## A warning about your talking flower

Nintendo's Talking Flowers were **the single most divisive element of Mario Wonder** — "either the best part of the game or its most annoying feature." Nintendo shipped a mute, but you can only disable text *or* audio, not both, and caught criticism for that too. **Ship a full mute for both from day one.**

The design rule that makes it work: it's **a commentary system given a face, not a tutorial wearing one.** React to what just happened; don't explain what to do next. Have preferences — a favourite species, a disliked weather. Go quiet for long stretches. Flat positivity reads as a system, not a character.

And one device worth stealing: **Merge Mansion built a cult following on a question it never intends to answer** — "what is grandma hiding?" $700M+ lifetime. You don't have to write an ending; you have to write a question.

## Three quick, concrete craft notes

- **Hidden blooms.** Viridi lets 27 of its 30 species flower — and three never do. One extra sprite per species, silhouetted in the Almanac and absent from the shop, converts a plant from a resource into a promise.
- **Silhouette test.** Design every species as a filled black shape first. If it isn't identifiable at 64×64 in pure black, redesign it before touching colour. Two flowers distinguishable only by petal texture are the same flower on a phone — and that's a real risk at 50–80 species.
- **Pitch-ascending harvest SFX.** You already do this on taps via combo. Extend it to consecutive harvests — it's the cheapest dopamine multiplier that exists and costs one variable.

## Marketing beat worth calendaring

**Wholesome Direct** — annual, June, free to submit. The 2025 edition hit 5M+ views with 650+ co-streamers, up 200× since 2020. Combined with r/incremental_games and r/CozyGamers (~420K members), that's your entire launch plan and it costs nothing.

---

That's the complete research picture. Nothing further is pending.

**We're now well past the point where this should live in a chat window.** I've given you a market analysis, a competitive read, a revised roadmap, and three corrections to my own advice — and none of it is in `docs/`, which is exactly the failure `AGENTS.md` exists to prevent.

My recommendation: let me write it up now, in your format —

- `10-decision-log.md` — dated entry with the reasoning and what we rejected
- `17-market-and-positioning.md` — new doc for the competitive and audience findings
- `13-order-system.md` — add Township's free-reroll rule
- `16-progression-and-quests.md` — Almanac reshaped into themed 7–12 pages
- `HANDOFF.md` — derived last, per your process

Then push it. After that, I'd start on **per-plant verbs and adjacency** — biggest effect, uses the board you already have, and it's the one that makes your garden a place instead of a spreadsheet.

Want me to go ahead with the docs?
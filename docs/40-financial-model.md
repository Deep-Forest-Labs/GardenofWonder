# The Financial Model — what this actually earns

**Status: model, 2026-08-30.** Companion to [38-market-refresh.md](38-market-refresh.md) (who we're up against)
and [39-growth-and-launch.md](39-growth-and-launch.md) (how anyone finds us). It extends
[17-market-and-positioning.md](17-market-and-positioning.md#numbers-to-plan-against) and prices
[37-monetization.md](37-monetization.md).

**Plain tables here. Every formula, source and assumption is in the appendix.** Nothing in this document is a
projection you should trust to two decimal places; it is a set of bands wide enough to be honest and narrow
enough to decide with.

---

## The one number that decides everything

It is not ARPDAU. It is **how many days the average player sticks around.**

Here is why, in one table. To *hold* 3,000 players a day — the target our docs have carried since August — you
have to keep replacing the ones who leave, forever:

| If the average installer plays for… | You need this many installs **every day**, forever | Per month | Is that reachable with no ad budget? |
| --- | --- | --- | --- |
| **~4 days** (the 2026 median mobile game) | **750** | 22,800 | **No.** Well above what an optimised game gets organically. |
| **~8 days** (a good cozy game) | **375** | 11,400 | **Only at the very top of the range.** |
| **~15 days** (best-in-class idle) | **200** | 6,080 | **Yes** — at the bottom of the organic band. |

The organic ceiling, for context: even well-optimised games rarely exceed **200-500 organic installs a day**
(CAS.AI, soft — see appendix), an eight-week Apple feature across 139 countries produced **3,790 downloads
total**, and a studio Google features "quite often" reports **under 100 installs a day**.

> **So: at median retention, this plan cannot reach 3,000 DAU at all. At good retention, it can.**
>
> That is the whole business in one sentence, and it means the money question and the design question are the
> same question. Doc 29 was right that D7 is the highest-leverage unbuilt work in the project — it just had the
> reason slightly wrong. It is not an ASO input (see doc 39). **It is the thing that decides whether the free
> channels are big enough to fill the bucket.**

**The rule of thumb to carry around:**

| D7 | What it means |
| --- | --- |
| **Under 10%** | The plan does not work without paid user acquisition. Stop and re-design, or change the goal. |
| **10-20%** | It works, but only with every free channel firing and no wasted install. |
| **Over 20%** | It works, and the ceiling is a long way above the target. |

### And right now we cannot measure it

There is **no analytics, telemetry or remote-config code anywhere in the repository** — verified by grep, not
assumed. Doc 01 lists "no analytics" as a deliberate absence, doc 29 makes D7 the highest-leverage work in the
project, and doc 37 promises that every cap is "remote-tunable". **The plan requires a number it has no
instrument to measure and a lever it has no server to pull.** That is not a criticism of the web prototype,
which was right to stay clean — but it is the first line item on the Unity shell, ahead of ads and ahead of IAP.

---

## What it earns — three scenarios

Read these as **bands, not forecasts**. The difference between them is not luck; it is whether the store shelf
(gems, decor, the Gem Jar) actually gets built and grows.

| Sustained players a day | **Lean** — ads only, thin shelf | **Base** — ads plus a working shelf | **Strong** — a real gem and decor catalogue |
| --- | --- | --- | --- |
| **1,000 DAU** | **$885 / month** | **$2,280 / month** | **$4,490 / month** |
| **3,000 DAU** | **$2,650 / month** | **$6,840 / month** | **$13,475 / month** |
| **10,000 DAU** | **$8,850 / month** | **$22,800 / month** | **$44,900 / month** |

*(Net of the store's 15%. Ad revenue carries no store fee; the network's cut is already inside the eCPM.)*

**Where the target lands.** The standing goal — $3-5K a month — sits **between lean and base at 3,000 DAU**. In
plain terms: **if we hold three thousand players a day and the shop is more than an afterthought, we hit the
goal. If the shop is an afterthought, we miss it by half.**

**A year of it, at base case:**

| DAU | Launch year, net |
| --- | --- |
| 1,000 | ~$27,000 |
| 3,000 | ~$82,000 |
| 10,000 | ~$274,000 |

**A reality check on those numbers, so nobody reads them as a plan.** A real solo developer's full 2025 Google
Play books, published with the receipts: **6,400 downloads, 71 average DAU, $1,695 gross for the year** — a
blended ARPDAU of $0.065, which is very close to our base case. His conclusion is worth pinning up: *"you need
to design your game with monetization in mind in every step, to have a large enough LTV. Or you need to be
really good at marketing to get a low enough CPI."*

---

## Where the money comes from — and why doc 37 needs one change

Doc 37's shape is **rewarded-led, with IAP as a quiet floor**. On the best evidence available, **that is
backwards for our kind of game.**

| Source | Ads share | IAP share |
| --- | --- | --- |
| Sensor Tower, hybridcasual **Lifestyle & Puzzle** (closest cluster to us) | **41%** | **59%** |
| A live 4-person idle-RPG studio's own 18-month books | **20%** | **80%** |
| A solo dev's published 2025 Google Play P&L | **32.5%** | **67.5%** |
| CAS.AI's own portfolio (a mediation vendor describing hyper/hybrid-casual) | 60-85% | 15-40% |

Only the mediation vendor — the one with a commercial interest in ad volume — supports an ads-majority model,
and it is describing a different genre. **And the "Idle Miner Tycoon is ~60% ads" figure our docs lean on could
not be sourced at all**; it traces to one Kolibri business-development person in a vendor blog post.

**This is not an argument to sell more. It is an argument about which line has to grow.**

> **The recommended change to doc 37: keep every promise and every placement exactly as ruled, but stop
> describing the ad line as the plan. It is the floor.** The thing that has to grow is the shelf — gems, decor
> packs, the Gem Jar — because that is where the difference between $2,650 and $13,475 a month lives, and doc 37
> already names it: *"This is also the answer to 'what do gems buy': grow this catalog."*

Two more things the comparables say, both of which support doc 37 rather than challenging it:

- **Rewarded ads and paying are not enemies.** Unity's own data: only ~3% of players convert to paying, while
  **over 60% are interested in rewarded placements**, and the two groups overlap. Players who engage with
  rewarded video are reported as more likely to buy, not less.
- **Cats & Soup, at 80M downloads, has no subscription at all after five years.** It sells ad relief as
  **expiring passes at $0.99 for 7 days and $2.99 for 30**, and prices *desire* high — $9.99 and $11.99 content
  passes. It monetises relief cheaply and expiringly, and charges for what people want.

**And one number nobody publishes, so nobody should pretend to have it:** there is **no benchmark anywhere for
starter-pack or piggy-bank conversion rates or price points.** Five differently-phrased searches found
qualitative design writing and nothing else. Studios treat it as proprietary. If a starter-pack conversion
figure ever appears in our docs with a citation, the citation is wrong.

### The one modelling correction inside doc 37

Doc 37 caps offers at **two to three per session**. At the session frequency our docs assume, that is **11-17
offers per player per day** — and every published benchmark is in *impressions*, not offers. CAS.AI's own two
2026 pages give **2-3 rewarded impressions/day** in one place and **8-12** in another, a 3-4× internal
contradiction. **Plan on 3-6 rewarded impressions per player per day**, and instrument the offer-to-watch rate
ourselves in the first playtest, because nobody publishes it.

---

## The cost side

**The tooling bill is almost nothing. The only expensive thing is people.**

| | Year one | Ongoing |
| --- | --- | --- |
| **Minimal** — Apple $99/yr, Google $25 once, a .com at $11.08 | **$135** | **$110 / year** |
| **Comfortable** — adds paid analytics, Sentry for two people, an ASO tool, a hosted privacy policy, screenshot tool, localisation, Firebase headroom | **~$2,850** | ~$2,850 / year |

Everything else genuinely costs nothing at our scale: **Unity is $0** (Personal is free below $200K of revenue
*and funding*, the Runtime Fee was cancelled outright in September 2024, and the splash screen is optional since
Unity 6); GameAnalytics' free tier has **no MAU cap** and includes remote config and A/B testing; Firebase
Crashlytics, Analytics and cloud save all sit inside the free tier at 3,000 DAU; **all three ad mediation
platforms cost $0 up front**; AppLovin pays at a **$100 minimum, NET 15**, which at 2,000 DAU we clear by 12-30×
in the first month.

Two small things that are load-bearing and easy to miss: **AdMob requires app-ads.txt on your own domain** for
apps created after January 2025 or you face limited serving — so the $11 domain is an ad-revenue dependency, not
a marketing nicety. And **Firebase Remote Config starts charging on 1 September 2026**, with billing deferred to
December or February for projects that enable it before then.

### The number that actually matters

**One part-time contract engineer at $70/hour, 20 hours a week, is $72,800 a year.** That is roughly **500× the
minimal annual tooling bill**, and it is about what the base case earns at 3,000 DAU.

| | |
| --- | --- |
| Base case at 3,000 DAU, for a year | **~$82,000** |
| One part-time engineer at market rate | **~$72,800** |
| The designer's time | **$0 left over** |

**So the honest read on the target: at 3,000 DAU and a working shop, Garden Wonder pays for roughly one
part-time engineer and nothing else.** Cash break-even against the tooling bill happens in the first week; break-
even against *what two people's time is worth* happens somewhere north of 3,000 DAU with a real shelf, or not at
all. That is not a reason to stop — it is the reason doc 29's scope discipline exists — but it should be said
out loud once.

**A soft launch cannot fix any of this, and it is worth knowing why.** The mechanics are free (limited-country
release, TestFlight up to 10,000 testers), but the one practitioner source we could retrieve puts the floor at
**$300-500 per day per ad set** and **1,000 purchased installs per cell** before D1 is readable. **A no-spend
soft launch is a stability test, not a monetisation read.** Use the Google Play 12-tester closed test as exactly
that: does it crash, does the tutorial complete, where do people stop, does the save survive an update. Do not
try to read ARPDAU or D7 from twelve friends.

---

## The kill / scale signals

Measured at **30 days after launch, on organic traffic**. Every one of these needs analytics to exist first.

### PUSH — spend the next six months on this

- **D7 above 15%.** This is the single gate. It says the free channels are big enough to fill the bucket.
- **Organic installs above 150/day and still rising in week four**, without a feature carrying them.
- **Any store rating above 4.6 with 200+ ratings.** Rating quality is a documented ranking factor; this is the
  algorithm noticing.
- **Rewarded opt-in above 40% of offers shown.** Says the placements are wanted, not tolerated.
- **Any single Reddit or TikTok post clearing 100 upvotes / 50K views without being boosted.** Says the sentence
  and the clip work.

### HOLD — it is working but it is not a business yet

- D7 between 8% and 15%.
- Organic installs 50-150/day, flat.
- ARPDAU between $0.02 and $0.05.
- **The action here is not more marketing. It is the second half of the shop** — decor packs and gem sinks — plus
  whatever the D7 curve says is broken between day 1 and day 7.

### PIVOT — the loop is fine, the shape is wrong

- **D1 healthy but D7 below 8%.** People like it and don't come back. That is a *reason-to-return* problem, and
  it is exactly what the Turn and the forecast are for. It is a design fix, not a marketing one.
- **Retention fine but ARPDAU below $0.015 at 1,000+ DAU.** People stay and nothing is worth buying. That is the
  shelf, and it points at the premium PC question in [39-growth-and-launch.md](39-growth-and-launch.md).
- **The store reviews are about ads.** We built the wrong thing; the placements are the fastest fix in the game.

### STOP — or rather, change what "success" means

- **D7 below 5% after one real FTUE pass.** The market's own median is under 4% and this lane is littered with
  competent, honest, actively-updated games at 1,000 downloads. Cozy Farm: Idle Farming Game ships almost our
  exact spec, answers *"Are there gacha or loot boxes? A. No."* on its store page, and has **one thousand
  installs**.
- **Under 20 organic installs a day at 90 days with every free channel fired.** The sentence is not landing.
- **Kinder World is the case to hold in mind here.** Ad-free, venture-backed, 2.5M+ players, genuinely beloved —
  and it ended active development because it *"haven't been able to attract enough new players for this
  particular game to be financially viable."*

**And the question nobody has put to the owner, which the critic is right to raise:** every strategy doc in this
project is written for the 30-40% case. **None is written for the median outcome.** The useful version of the
question is not "which direction" — that has been asked and answered three times. It is:

> **What does this have to earn, by when, for you to keep working on it — and what do you do in the month it
> earns $200?**

Three live decisions fall straight out of that answer and are currently being made on aesthetics instead:
whether the Unity port is worth its cost, whether analytics ship at all, and whether the ad line is worth having
versus going premium.

---

## The 2026 rules that change the plan

Good news first: **nothing in the 2026 regulatory landscape breaks a rewarded-led cozy game with no loot boxes.**
The store cuts actually got *cheaper* for a studio under $1M. But three things bite, and one of them bites us
specifically.

| What | When | What it means for us |
| --- | --- | --- |
| **Apple Small Business Program is still 15%** | Now | Confirmed on Apple's own page. Two catches doc 17 omits: the test is **two-sided** — under $1M in the prior calendar year **and** under $1M in the current year — and **enrolment is manual**, via the Paid Apps agreement in App Store Connect. It is not automatic. Also, Apple now varies SBP **by market**: China dropped to **12%** on 15 March 2026. |
| **Google Play's fees were re-cut on 30 June 2026** | Live in US / EEA / UK | **Read this row carefully — two of our research agents got it wrong and it is the most financially consequential detail in the document.** Under $1M the fee now depends on *when the player first installed*: **10% + 5% billing fee** for subscriptions and for **new installs**, but **20% + 5%** for **existing installs**. Google defines a new install as *"a transaction from a user whose first-time install or first update of the app from Google Play occurred on or after June 30, 2026."* **Garden Wonder has not launched, so every player we will ever have is a new install** — our rate is **15% effective**, permanently, for this app. A live game that launched before June would be paying ~25% on most of its revenue. Australia 30 Sep 2026, Japan and Korea 31 Dec 2026, rest of world by 30 Sep 2027. |
| **Apple's EU terms change on 1 October 2026** | 1 Oct 2026 | **Good for us.** An SBP participant pays **15% on IAP, 10% on alternative in-app payment, 10% on out-of-app offers**, and the per-install Core Technology Fee is replaced by a **5% commission**. Best rate Apple has offered a small studio. |
| **US external links currently cost 0%** | Now, but contested | Apple's guidelines confirm no entitlement is needed for US storefront apps. **But the Supreme Court took Apple's appeal on 30 June 2026**, and on **14 August 2026 Apple filed to charge 15%, or 5% for SBP developers**. **Plan for the 0% window to close.** |
| **PEGI now rates games on their daily-return mechanics** | **From June 2026** | **This is the one that costs us.** Time-limited or quantity-limited offers → **PEGI 12**. Paid random items → **PEGI 16** by default. Daily-return rewards → PEGI 7. And: *mechanisms that **punish** players for not returning, by losing content or reducing progress → **PEGI 12**.* Germany's USK, which did this first, reports the new criteria applied to ~30% of submissions with **1 in 3 of those getting a higher rating**. |
| **EU Digital Fairness Act** | **Not a thing yet** | Checked against the Commission's own register on 29 Aug 2026: stage **PLANNING_WORKFLOW**, no adoption date, no foreseen act type, consultation closed Oct 2025. **There is no proposal text.** Industry expects a proposal in autumn 2026, which means application no earlier than ~2029. **Do not redesign the economy for it now.** |
| **The "show real-money prices next to gems" rule is not the DSA** | In force as guidance | It comes from the CPC Network's Key Principles of 21 March 2025, and the document **expressly states it does not bind anyone**. Worth following anyway. Note the carve-out: currencies obtainable **only** through gameplay are outside its scope entirely — so gold and Saved Seeds fall through, and everything attaches the moment gems are purchasable. |
| **COPPA's amended rule** | **Compliance date passed 22 April 2026** | Live obligation today, not a future risk. |
| **Loot boxes** | Brazil, in force 17 Mar 2026 | Banned in games likely to be accessed by children — and **Apple auto-rates any app declaring loot boxes as 18+ on the Brazil storefront**, which is effectively unlaunchable there. Combined with PEGI 16 in Europe, **"no loot boxes" is now a distribution asset, not a mood.** Doc 37's never-sell table is worth money. |

### The art-style trap, and it is aimed at us

Google Play's Families policy says it plainly: *"Regardless of what you identify in the Google Play Console, if
you choose to include imagery and terminology in your app that could be considered targeting children, this may
impact Google Play's assessment of your declared target audience."* **A bright storybook garden is itself
evidence Google can use to pull us into the Families programme.**

What that costs: only Families-certified ad SDKs, **no personalised advertising**, and no advertising ID for
children *or users of unknown age*. **So the single most valuable piece of engineering in the ad stack is a
neutral age gate** — without one, every user is "unknown age" and every impression is non-personalised. We could
not source a 2026 figure for how much that costs in eCPM and will not invent one; the design consequence does
not depend on the exact number.

**And never ship a 4+ store rating alongside a 13+ minimum age in the EULA.** That exact mismatch is the subject
of a live UK CMA complaint against Apple, Google, King, Supercell and others.

**The two PEGI decisions that are ours to make, stated plainly:**

1. **A time-limited starter pack is PEGI 12.** Doc 37's starter pack is already specified as *fixed, listed
   contents, no randomness*. Keep it **untimed** and it stays clean. This is a one-word design decision worth an
   age band.
2. **Creature upkeep that reduces progress when you don't return is PEGI 12.** Upkeep that pauses, sleeps, or
   costs you nothing but a slower day is not. **The sleeping face is not just the cosy fix for a punishing
   mechanic — it is the rating fix too.** See the fork in [39-growth-and-launch.md](39-growth-and-launch.md).

---

## What is the owner's call

### Pricing posture

Three shapes, all defensible, all sourced.

| Option | The shape | The case | The risk |
| --- | --- | --- | --- |
| **A. Free, rewarded-led, thin shelf** | Doc 37 as currently written | Lowest build cost, keeps every promise, ships fastest | **Lands at the lean band — roughly $2,650/month at 3,000 DAU.** Half the target. |
| **B. Free, rewarded floor, real shelf** *(recommended)* | Doc 37 plus a decor and gem catalogue that keeps growing | Matches what the closest comparable cluster actually earns (59% IAP / 41% ads), hits the target at 3,000 DAU, and doc 37 already names the catalogue as the answer to "what do gems buy" | Art time. The catalogue is the cost, and a fixed catalogue always gets bought out. |
| **C. Premium, $4.99, no ads at all** | The Kairosoft / Melvor / Rusty's shape | The incremental audience's own stated ceiling is *"doesn't charge more than like $5"* with a demo; a solo dev's paid $1.99 game made **8× the revenue of his featured free one on a fifth of the installs**; and it makes every promise in doc 37 trivially true | A completely different funnel, a much smaller top-of-funnel, and it abandons the mobile F2P audience doc 17 identified |

**Recommendation: B**, and it is close to what doc 37 already says. The change is one of emphasis, not of
rules — **the ads are the floor, the shelf is the plan.** But **C is a real option and should not be dismissed
by default**, because the "$3,650 per idle title" graveyard our whole framing rests on is a *mobile
free-to-play* statistic and does not describe the premium lane at all. **This is the owner's, and we are
stopping here.**

### The revenue goal itself

The standing goal is $3-5K/month. On this model that is **3,000 DAU with a working shop** — which needs **375
installs a day, forever**, which is at the top of what an optimised game gets organically. It is reachable and
it is not comfortable. The owner should decide whether the goal is:

- **the target** (in which case the whole plan is retention work, because that is what moves the install
  requirement), or
- **the floor** (in which case something has to change about the top of the funnel — a PC build, a publisher, or
  a budget).

We have not decided this and it is not ours to decide.

---

# Appendix — the arithmetic

*Everything above is computed by `model.js`, reproduced below. Sources for every input follow.*

## The build-up

**Ad revenue per player per day** = rewarded impressions per player × eCPM ÷ 1000.

| Band | Impressions/DAU | eCPM | = Ad ARPDAU |
| --- | --- | --- | --- |
| Lean | 3.0 | $8.00 | $0.024 |
| Base | 4.5 | $11.00 | $0.0495 |
| Strong | 6.0 | $14.00 | $0.084 |

**IAP revenue per player per day**, net of the store's 15%:

| Band | Gross IAP ARPDAU | Net |
| --- | --- | --- |
| Lean | $0.006 | $0.0051 |
| Base | $0.030 | $0.0255 |
| Strong | $0.075 | $0.0638 |

**Blended ARPDAU: lean $0.029, base $0.075, strong $0.148.** Ad share of revenue: 82% / 66% / 57%.

**Monthly = DAU × ARPDAU × 30.4. Annual = DAU × ARPDAU × 365.**

## The install requirement

Steady state: **DAU = installs per day × average active days per install.**

Curve-fitting *overstates* the tail badly. Fitting a power law to the 2026 medians gives ~2.9 lifetime days;
fitting to a classic 40/20/10 curve gives ~28. But the same method applied to a real game with published books
(Flappy Bat: 6,400 downloads across 2025, 71 average DAU, D7 ~12%) predicts ~15 days against an **observed
4.05**. **So quote observed multipliers, never fitted ones.** The three used above:

| Retention shape | Observed multiplier |
| --- | --- |
| Benchmark median (D1 ~18-22%, D7 <4%) | 4 |
| Good cozy (D1 ~35%, D7 ~12%) | 8 |
| Best-in-class idle (D1 46%, D7 20%, D28 7.5%) | 15 |

## The model

```js
const DAYS = 30.4, STORE_FEE = 0.15;
const AD  = { lean:{imp:3.0,ecpm:8}, base:{imp:4.5,ecpm:11}, strong:{imp:6.0,ecpm:14} };
const IAP = { lean:0.006, base:0.030, strong:0.075 };          // gross IAP ARPDAU

const arpdau = b => AD[b].imp * AD[b].ecpm / 1000 + IAP[b] * (1 - STORE_FEE);
const monthly = (dau, b) => dau * arpdau(b) * DAYS;
const installsPerDay = (dau, mult) => dau / mult;              // mult = observed active days
```

## Where every input comes from

**Retention and sessions.** [GameAnalytics 2026 Mobile & PC Gaming Benchmarks](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks)
— 16,000+ mobile games, 9 regions, 1,000+ MAU threshold, full 2025 calendar year. Median D1 ~18-22%, D7 just
under 4%, D30 0.7-0.8%; P75 D1 just above 30%, D7 6-7%, D30 1.6-1.8%; P90 D1 ~40%, D7 11-12%; P99 D1 64-68%,
D30 13-15%. Median session 3.1-3.5 min, 3.8-3.9 sessions/day, ~12 min daily playtime. **The report explicitly
states genre-level benchmarks are unavailable this cycle** — so any 2026 "Simulation retention" figure is not
from GameAnalytics.

**Adjust's competing figures** (D1 27%, D7 13%, D30 5%, 30-minute sessions) measure *attributed installs in apps
running paid UA* — the funded cohort we are not in. Do not average the two; do not cite both in one document.

**Rewarded eCPM.** [Mistplay](https://business.mistplay.com/resources/mobile-ads-ecpm) (page updated Mar 2026,
underlying data Appodeal Q4 2024, so ~18 months stale): rewarded North America **$9.20 Android / $13.90 iOS**;
Europe $5.10 / $8.80; LATAM $1.90 / $3.75; US blended **$15.15**. TopOn H1 2025, casual games: EU/NA Android
**$8.90**, iOS **$12.24**, global Android **$3.02** (down from $3.60 in H1 2023). **Tenjin publishes no 2026
eCPM data at all** — its only country-level rewarded charts are labelled Q1/Q2 **2024**. A **free H1 2026 TopOn
report exists behind an email form** and is the single highest-value unclaimed source for our ad planning.

**Rewarded frequency.** [CAS.AI hybrid guide](https://cas.ai/blog/hybrid-monetization-in-mobile-games-a-practical-guide/)
(May 2026): start at 2-3 rewarded/user/day, scale to 3-4 if retention holds. Their own publishing-requirements
page (Dec 2025) says 8-12/day. **Same vendor, 3-4× apart.** Also: Appodeal reports idle games serve **73.2
rewarded videos per user lifetime**, second only to merge-3 at 101.5.

**Ad ARPDAU sanity check.** CAS.AI's published publishing baseline is **$0.02-0.05 Android, $0.05-0.08 iOS** —
which brackets our lean and base bands.

**Payer conversion.** Unity: *"only 3% of players convert to paying for IAP in successful free to play mobile
titles"*, while over 60% are interested in rewarded placements. Corroborated by two real developers' own books:
Bounty Bash 3.5% of installs, Flappy Bat ~3.1%. AppsFlyer casual D90 IAP ARPPU **$7.26**; casual D90 ad ARPU
**$0.55**, the highest of any genre. **The widely-quoted "9.84% install-to-buyer" figure is NON-GAMING apps —
do not put it in a game model.**

**Ad vs IAP split.** Sensor Tower State of Gaming 2026 via
[Gamesforum](https://www.globalgamesforum.com/news-media/state-of-gaming-heres-what-the-mobile-data-actually-says),
US/Japan/UK/Brazil: hybridcasual Lifestyle & Puzzle **59.0% IAP / 41.0% ads**. A 4-person idle-RPG studio's own
18-month books: 80/20, with the ad-removal pass as one of its best sellers. Flappy Bat: 67.5/32.5.

**Store fees.** [Apple SBP](https://developer.apple.com/app-store/small-business-program/) 15%, two-sided $1M
test, manual enrolment. [Google Play](https://support.google.com/googleplay/android-developer/answer/112622),
first $1M in US/EEA/UK from 30 June 2026, **checked directly against Google's own table because two research
agents read it differently**: subscriptions **10% + 5%**, other transactions from **new installs 10% + 5%**,
other transactions from **existing installs 20% + 5%**. Above $1M the existing-install rate rises again. **Since
Garden Wonder is unreleased, every player is a "new install" by Google's own definition, so 15% is the correct
figure for this model** — but a doc that says "Google is a flat 15%" is wrong in general and would mislead
anyone applying it to a live game. Everywhere outside US/EEA/UK the old 15%/30% tier holds until the rollout
completes 30 Sep 2027. Apple $99/year; Google $25 once.

**Featuring is worth much less than folklore.** An 8-week Apple "New Games We Love" across 139 countries
(excluding the US) → **2.74M impressions, 3,790 downloads, $130 in proceeds, one IAP sale ever.** A ~1-week US
Games feature on a $1.99 paid game → **793 downloads, €1,102 over 30 days.** A studio Google features "quite
often" → **under 100 installs/day, and those installs retain worse than paid ones.**

**Organic ceiling and indie odds.** [CAS.AI](https://cas.ai/blog/the-mobile-game-publishing-reality-why-most-indies-fail-and-what-actually-works/)
(vendor-published and commercially motivated, so soft): *"even well-optimized games rarely get more than 200-500
organic installs per day"*; **1 in 100 indie games reaches $10,000/month, 1 in 300 reaches $30,000, 1 in 1,000
reaches $100,000.**

**Market context.** Farming $576M IAP in H1 2026, +15% YoY, on 172M downloads, +33%
([AppMagic](https://gamedevreports.substack.com/p/appmagic-mobile-casual-games-in-h1)) — against total mobile
games IAP of **$40bn, down 2%**, on downloads **down 12%**. Casual downloads fell from 11.2bn in H1 2021 to
**6.34bn in H1 2026**. Simulation lost **$723M of IAP in 2025** even as farming inside it grew — the genre is
bifurcating. And **paid UA for our shape is the worst in the business**: Simulation IPM 3.9 and Idle RPG 2.0,
the two lowest of 22 categories against an 8.62 average, with idle RPG CPI at $3.19. **Our no-UA position is not
a handicap; it is the same conclusion a funded studio would reach.**

**Costs.** Unity Personal free under $200K revenue **and funding**; Pro $2,310/yr per seat if ever needed;
Runtime Fee cancelled 12 Sep 2024. GameAnalytics free tier, no MAU cap. Firebase Spark tier covers Crashlytics,
Analytics, Remote Config (until 1 Sep 2026, then 100K fetches/day free) and cloud save at our scale. Sentry Team
$312/yr for two seats. Appfigures Connect $9.99/mo. Domain $11.08/yr at Porkbun. AppLovin MAX: $100 minimum,
NET 15. Contract Unity developers $60-100+/hr.

## What could not be sourced, and is therefore not in the model

Recorded so nobody fills these with invention later:

- **Starter-pack and piggy-bank conversion rates or price points.** No vendor publishes them. Searched five ways.
- **Rewarded impressions per DAU as a published benchmark.** Nobody credible publishes it for 2026.
- **IAP payer conversion for casual specifically.** AppsFlyer publishes casino (4.95% first purchase) and
  non-gaming, and skips casual. Unity's 3% is the best available anchor.
- **DAU/MAU for cozy or simulation.** GameAnalytics publishes it for PC only; a practitioner review notes the
  commonly quoted 20-30% stickiness thresholds have *"no gaming dataset behind them."* Doc 17's "idle stickiness
  18%" should be relabelled from *benchmark* to *internal target*.
- **"Ad density above 3/session depresses casual retention ~27%."** Could not be sourced anywhere. Treat as
  folklore. The only real guidance found: accept a frequency increase if ARPDAU rises and retention falls by no
  more than ~1 percentage point.
- **"Idle top-decile D1 45.55%."** Not sourceable for 2026. The real market P90 for D1 is ~40%.
- **The eCPM cost of non-personalised ads to child and unknown-age traffic.** Real mechanism, no credible 2026
  number.
- **Web-player → app-installer conversion.** The single most valuable number still missing from this whole run,
  and the growth plan multiplies by it.

**Source hygiene, once, for the record.** 2026 benchmark search results are now heavily polluted by
AI-generated statistics farms — gameinsights.ai (whose own homepage calls it an "AI Prediction Platform" and
whose /research URL 404s) claims casual D1 of 38% and LTV of $45, reconcilable with nothing. **If a figure's
only home is a domain nobody in the industry has heard of, it does not go in a doc.**

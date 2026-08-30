# Growth and Launch — the dated plan

**Status: plan, 2026-08-30. Extends [29-direction-and-odds.md](29-direction-and-odds.md) with dates, prices and
sources.** Companion to [38-market-refresh.md](38-market-refresh.md) (who we're up against) and
[40-financial-model.md](40-financial-model.md) (what it earns).

This is a calendar the owner can follow, not a strategy essay. Everything dated is sourced or marked as an
estimate from prior years. Everything free is marked free.

---

## The short version

**There are four ways this game meets an audience, and doc 29 priced three of them too high.**

| Channel | Doc 29 said | What we actually found | Verdict |
| --- | --- | --- | --- |
| **Community** (Reddit, cozy showcases) | The main free channel | A top-decile Reddit post buys **a few thousand installs, once**. The subreddit itself says so at 744 upvotes: *"we are a source of players and feedback, but not a source for much money."* | **Real, and it is a playtest, not a business.** Do it properly, expect a cohort. |
| **Platform editorial** (Apple / Google) | Rare, craft-rewarded | **Winnable and self-serve** — both are forms you file yourself, and Honey Grove holds an Editors' Choice with 2,890 ratings. But an 8-week Apple feature across 139 countries produced **3,790 downloads**, and a studio Google features "quite often" reports **under 100 installs a day**. | **File both. Do not model it as the step change.** |
| **Algorithmic ASO** | D1/D7 is an ASO input | **Half wrong.** Apple's own docs name **downloads, number of ratings, and quality of ratings** — never retention. Retention feeds ASO *through* the rating prompt, which is a different instruction. | **Corrected below. The rating is the ranking.** |
| **Clips and screenshots** | A moment worth filming | The mechanism is real — Grow a Garden's own growth is attributed to cozy footage travelling on TikTok/Reels/Shorts. But our "$200 behind a post" figure comes from **one unsourced SEO blog**, and TikTok's published floor is **$50/day at campaign level**. | **Real as discovery, not as a UA channel.** |

**The one number nobody produced, and the whole plan multiplies by it:** the rate at which a browser player
becomes an app installer. Our free channels all point at the web build; the web build will never carry ads. At
2% versus 15% these are two different companies. **Instrument this before spending another week on growth
planning.**

---

## The calendar

Everything below is either **CONFIRMED** (we retrieved the page), **ESTIMATE** (extrapolated from prior years,
with the years stated), or **UNSOURCEABLE** (the citation exists but nobody can open it — flagged, because one
of them is the anchor).

### Right now — this week

| When | What | Cost | Notes |
| --- | --- | --- | --- |
| **Before 1 Sep 2026** | **Turn on Firebase Remote Config in the project, even unused.** | Free | Billing starts 1 Sep 2026, but projects with it enabled *before* that date defer to **1 Dec 2026 (Spark)** or **1 Feb 2027 (Blaze)**. Free tier is 100,000 fetches/day regardless — at 3,000 DAU you would need 33 config fetches per player per day to hit it. [Source](https://firebase.google.com/docs/remote-config/pricing) |
| **Today** | **Join the Wholesome Games mailing list.** | Free | This is literally how they announce the Direct's submission window. There is no standing form to bookmark. [wholesomegames.com](https://wholesomegames.com/) |
| **Today** | **File the Wholesome Games Presents publishing pitch.** | Free | Open year-round, ~20 minutes, 8 questions, no platform restriction. They now run a **publishing label** — Usagi Shima's Steam release in October 2026 is credited to Wholesome Games Presents. [The form](https://docs.google.com/forms/d/e/1FAIpQLSdWRfXN_3zPQOiQoMYrxaidIeaGV-9nWlCziw48GnQ--LZmGg/viewform) |
| **Today** | **Start the Google Play developer account.** | $25 once | Not for the fee. For the clock — see the trap below. |

> ### THE SCHEDULING TRAP THAT WILL COST YOU A MONTH
>
> **Personal Google Play accounts created after 13 Nov 2023 must run a closed test with at least 12 testers
> opted in *continuously* for 14 days before production access unlocks.** Testers who opt in, test, and opt out
> **do not count**. Until it clears, Production *and* Pre-registration stay disabled.
> ([Google's own policy](https://support.google.com/googleplay/android-developer/answer/14151465).)
>
> Twelve friends, on Android, staying opted in for two straight weeks. The escape hatch is an **organization
> account, which needs a D-U-N-S number and can take 30 days** to obtain. Either way, **start now, not at
> submission.**
>
> The same applies to AdMob: **new apps are throttled to "limited ad serving" during an app-readiness review
> that "typically" runs under 30 days**, and app-ads.txt on your own domain is required for apps created after
> January 2025 or you face limited serving anyway. **Launch-week ad revenue is not real data.**

### September — December 2026

| Date | Beat | Mobile? | Cost | Status |
| --- | --- | --- | --- | --- |
| **31 Aug** | Steam Next Fest (Oct) registration deadline | ✗ PC only | Free | CONFIRMED — needs a published Steam page and a public demo, **and a title may only ever enter one Next Fest**. Irrelevant unless a PC build happens. |
| **2 Sep** | Big Indie Pitch at SLICE, Seattle | ✓ | Free + ticket | CONFIRMED. Four days out; the window has almost certainly shut. |
| **7 Sep** | **DevGAMM Awards 2026** | ✓ **explicitly "PC or Mobile"** | **FREE** | CONFIRMED. Teams up to 50; **unreleased games eligible**; there is a **Best Mobile Game** category and a **Best Game in Early Development** category. Ceremony 18 Nov, Lisbon. *Correction: the rules page does not state a $100,000 pool — it itemises individual prizes. And nominees must attend or send a rep, so "free" carries a flight.* [Rules](https://devgamm.com/awards2026/rules/) |
| **13 Sep** | **IGF 2027 submissions close** | ✓ — "officially supports any platform — PC, console, web, mobile" | $75 ($25 student, hardship waiver available) | CONFIRMED. [Submission info](https://igf.com/submission-info/) |
| **Sept** | Apple's social-media age-rating questions become **mandatory** on every submission | — | Free | CONFIRMED. Answer "no" if there is no feed. |
| **~23 Sep** | Wholesome Snack 2026 submission window | ? | ? | **ESTIMATE, from 2025 only.** Snack 2025 aired 9 Dec alongside The Game Awards; its registration deadline was ~23 Sep 2025. Nothing announced yet. This is the nearest Wholesome beat you can still catch. |
| **30 Sep** | Google Play's new fee structure reaches Australia | — | — | CONFIRMED |
| **1 Oct** | Apple's new EU terms take effect | — | — | CONFIRMED. Good news — see doc 40. |
| **5 Oct** | Big Indie Pitch Mobile Edition (Nordics) — submission deadline | ✓ | Free + PGC ticket | CONFIRMED |
| **20 Oct** | Big Indie Pitch **Mobile Edition**, Helsinki | ✓ | Free + PGC ticket | CONFIRMED |
| **27 Oct** | Big Indie Pitch at MIGS — entry deadline | ✓ | Free + ticket | CONFIRMED |
| **10 Nov** | Big Indie Pitch, MIGS Montréal | ✓ | Free + ticket | CONFIRMED |
| **18 Nov** | DevGAMM Awards ceremony, Lisbon | — | Travel | CONFIRMED |
| **~early Dec** | Wholesome Snack 2026 broadcast | ? | ? | ESTIMATE from 2024 and 2025 |
| **Dec** | The Indie Game Awards | ? | ? | SOFT. Nominations historically open ~27 Aug, so the window may be open now. Worth checking indiegameawards.gg this week. |
| **31 Dec** | Google Play's new fees reach Japan and Korea | — | — | CONFIRMED |

### 2027

| Date | Beat | Mobile? | Cost | Status |
| --- | --- | --- | --- | --- |
| **5 Jan** | Big Indie Pitch Mobile Edition (London) — deadline | ✓ | Free + ticket | CONFIRMED |
| **18-19 Jan** | **PGC London 2027 + Big Indie Pitch Mobile Edition**, The Brewery | ✓ | Free pitch, PGC ticket required | CONFIRMED. **The single best-fitting recurring beat on this calendar for a two-person cozy mobile team.** Five minutes to expert panels, live feedback, a PocketGamer.biz roundup article for every participant — real free press. Studios up to 12. |
| **Jan** | IndieCade Festival (online) | ✓ explicitly | $80 regular / $135 late, fee assistance available | CONFIRMED. Their instruction matters for a tiny team: *"The most important part of your submission is your DOCUMENTATION and not necessarily the build."* |
| **~1-6 Mar** | **WHOLESOME DIRECT 2027 SUBMISSIONS OPEN** | see below | Free (probably) | **ESTIMATE, and see the warning.** |
| **1-5 Mar** | GDC 2027, Moscone Center | — | Expensive | SOFT (venue listing) |
| **~early Mar** | Day of the Devs, San Francisco — free to attend, GDC week | ✓ no platform rule stated | Free | ESTIMATE from 8 Mar 2026, 16 Mar 2025, 17 Mar 2024 — all confirmed. But: **1,700+ submissions for ~60-70 slots**, and selected teams must deliver a build, a 2-3 minute intro video with isolated audio, a fact sheet and translated subtitles. A week of work. |
| **~20 Mar** | **WHOLESOME DIRECT 2027 SUBMISSIONS CLOSE** | | | ESTIMATE — this exact date held in both 2025 and 2026 |
| **~5 Jun** | **WHOLESOME DIRECT 2027 BROADCAST** | | | ESTIMATE from 6 Jun 2026 (Sat) and 8 Jun 2024 (Sat) |
| **~Aug** | Wholesome Games Celebration (Steam sale event) | ✗ for the storefront half | Free | ESTIMATE from 6-13 Aug 2026 |

**Rolling, no deadline, both free, both worth more than most of the above:**

- **Apple Featuring Nomination**, inside App Store Connect. Three types (App Launch / New Content / App
  Enhancements). Apple asks for **3 weeks minimum, recommends up to 3 months**. File one for launch, then one
  per season. Needs Account Holder / Admin / App Manager / Marketing role.
- **Google's Indie Games Corner**, [a form](https://support.google.com/googleplay/contact/indie_corners).
  Requires **team of 1-15** (we qualify), **a 3.8+ rating**, and submission **only if launching within 10
  weeks**. Featured games typically appear 1-2 months after release.

> ### THE WARNING ON WHOLESOME DIRECT
>
> Two things, and the owner should hear both before planning a year around it.
>
> **First, the 2026 submission window (2-20 March) is sourced to an X/Twitter post that returns HTTP 402 and
> cannot be opened by us or by anyone without API access.** The 2025 companion is an Instagram reel, equally
> unfetchable. The date is probably right — it held in two consecutive years — but if a March 2027 push is going
> on the calendar, **get a second source first.** The submission form only exists during the window, which is
> why nobody can tell you the trailer length or the build requirement today.
>
> **Second, and more important: Wholesome Direct's entire machine runs on Steam wishlists.** Its published
> success metric is *"+20,000 median wishlists"*; its August Celebration is a Steam sale a mobile-only game
> cannot join; every link in its social feed for three weeks was a Steam URL. Mobile *does* appear — Unpacking's
> mobile reveal ran inside the 2023 Direct, Wholesome ran a "Walk The Frog Mobile Trailer" this August, and their
> own label publishes cozy mobile games — but **JUDGMENT: a mobile-only game of equal quality gets in less
> often, because the show's value to sponsors and co-streamers is wishlists.**
>
> One hard rule that is not a judgment: **"We stand firmly against AI-generated art and NFTs"** is on their about
> page, and their pitch form carries a mandatory generative-AI disclosure. If any shipped asset is AI-generated,
> this door is closed.
>
> **The honest ranking:** IGF (13 Sep, mobile-eligible, $75) and DevGAMM (7 Sep, free, a Best Mobile Game
> category) are both better-matched than Wholesome Direct and both close within three weeks.

**Dead ends, so nobody plans around them:** *Guerrilla Collective* no longer exists — it is now **The MIX**, and
it charges **$600**. *Google Play Indie Games Festival* — the most recent edition we could verify is **August
2022**; do not build a 2027 plan on it. *Apple Design Awards* — **no public submission route exists**; the
actual lever is the featuring nomination, which is what puts you in front of those editors. *Steam Next Fest* —
PC only, one shot per title, ever. *r/idlegames* — private and closed since 2013.

---

## The Reddit playbook

This is the channel doc 29 leans on hardest, and it has changed since our docs were written.

### First, the Magic Research story is half true

The developer really did say he did no paid promotion and *"the only thing were two posts on Reddit on
/r/incremental_games"*, and that his account was banned when he made a third. **He never stated a revenue
figure.** The "$400K in twelve months" is a blogger's headline whose own URL slug still reads *"$150,000 in 8
months"* — the number was revised upward with no new evidence. What is verifiable: **100K+ paid downloads at
$3.99 on Google Play accumulated over three and a half years**, plus a Steam version whose calculator estimate is
$31,282 gross — and, per the same page, **about $9,228 net** after regional pricing, discounts, refunds, Steam's
cut and tax.

**Rewrite the claim as:** a solo dev built a five-figure-to-low-six-figure premium game over three years off a
launch that started with two Reddit posts. Drop the twelve-month framing.

Also worth knowing: his third post was **removed by a moderator and cost him his account the same day**. That is
the real lesson about this channel.

### The rules changed on 2 June 2026

| Rule | What it now says |
| --- | --- |
| **Self-promotion** | **One post per 30 days** — it was one per week. **The limit binds the whole team**: the engineer cannot post about Garden Wonder inside the same window. |
| **AI disclosure** | Every developer post must carry a section headed **"AI Disclosure"** — *required even if you used no generative AI at all*. Omit it and the post is removed. |
| **Playable link** | Mandatory. "Does not have to be free." A paid Steam release is as valid as a free itch demo. |
| **Title** | Must contain the game's name. |
| **Feedback Friday** | Participation is **exempt** from both the 30-day limit and the AI-disclosure rule. |

### What the numbers say about how to post

One agent pulled **all 7,949 r/incremental_games posts from 1 Jan to 29 Aug 2026** and analysed the 4,355
surviving developer posts. This is measurement, not folklore:

| Choice | Mean upvotes | Read |
| --- | --- | --- |
| **Native Reddit image / GIF** (i.redd.it) | **34.8** — 9.2% break 100 | **The winning asset.** |
| Native Reddit video | 17.2 | Half as good. |
| Self-text post | 11.9 | |
| **A Google Play link as the post URL** | **0.7** | **Functionally invisible. Never do this.** |
| **Android flair** | **2.0** — and **not one post broke 100 all year** | The mobile stigma is real and measurable. |
| Steam flair | 18.0 | |
| Title says "out now / released / launch" | **21.5** vs 11.5 | The strongest single signal. |
| **Title asks for feedback** | **6.9** vs 13.7 | **Roughly halves it.** Feedback belongs in Feedback Friday. |
| Title mentions mobile | 6.8 vs 13.4 | |
| Leading bracket tag like "[Android]" | 9.1 vs 13.3 | |
| Monday | 15.9 (Sunday 10.2) | Small but free. Post 13:00-15:00 UTC. |

**The ceiling, stated honestly:** only **3.7%** of surviving posts reached 100 upvotes and the median post
scores **1**. The best-documented 2026 case — "Grow!", a 177-point launch post — turned 500 downloads into
roughly **8,000 players in a month**, with the developer writing *"Almost all of this came from this sub."*
**That is a playtest cohort and a review-seeding event.** Budget it as that.

### The five subs, ranked

| Sub | Size | Verdict |
| --- | --- | --- |
| **r/incremental_games** | 187K | **The anchor.** Post here first. One post per 30 days, AI disclosure mandatory, lead with the **web build**, never the store link. |
| **r/cozygames** | 122K | **The cozy room we should actually use.** ~7% dev-post removal, purpose-built "My Game" flairs, and a **14-day** promotion cadence. |
| **r/CozyGamers** | 434K | **Effectively closed to us.** ~43% of developer-flaired posts are removed (live-checked, n=30), **zero mobile dev posts survived in four months**, and the dev rules sit behind a login wall so you cannot even check compliance. |
| **r/AndroidGaming** | 422K | Worth it, but **earn the right first**: "[DEV]" title prefix, account 1 month old, **50 community karma**, one post per 30 days, and self-promo under 10% of your total activity. Only 135 DEV posts survived in five months — but they average 18.8. |
| **r/iosgaming** | 266K | **Saturdays only** (US Eastern), weekly rather than monthly. Strip every tracking parameter from the App Store URL — `at=`, `ct=`, `src=` and shorteners are auto-removed. |
| r/playmygame | 140K | Median score 1, mean 1.9, **0.3% of posts ever reach 50 upvotes** across 15,675 posts in five months. Post for completeness; budget zero installs. |

### The plan, in order

1. **Six weeks before launch, warm one named developer account.** Comment genuinely, no links, in
   r/incremental_games, r/cozygames and r/AndroidGaming. Target 50+ comment karma in r/AndroidGaming
   specifically. **A cold account posting links is the most likely way to lose this launch** — it is what
   happened to Magic Research's developer.
2. **The anchor post, r/incremental_games.** Monday or Tuesday, 13:00-15:00 UTC. A single looping **GIF uploaded
   natively** showing a garden going from bare to full in under six seconds. Flair Cross-Platform or Development
   — **never Android or iOS**. Title: name first, concept-led, no platform word, no bracket, no feedback ask.
   Body in this order: two sentences on the one unusual mechanic; **the free web build as the only prominent
   link**; one honest line on monetization; "I'd love to hear what you think, good or bad"; then a section headed
   exactly **AI Disclosure**.
3. **Clear the first six hours.** Answer every comment personally. Thank the critic by name, concede the specific
   point, say what changes next build, put extra links in *replies* rather than editing the post. Never argue.
4. **48 hours to a week later, r/cozygames** with a "My Game" flair, the same GIF, softer framing, and a plain
   statement of your involvement (their rule 3 treats concealment as deception).
5. **Store subs only once you have store links and karma.** Copy the Gnomia template for r/AndroidGaming: Play
   link on line one, "[DEV]" prefix, personal time-framing, one paragraph on the single unusual mechanic, an
   explicit monetization clearance, and an ask for **negatives** specifically. It scored 129.
6. **Then you are locked out of r/incremental_games for 30 days, engineer included.** Fill it with **Feedback
   Friday every single Friday** (exempt, median 50 comments) and Monday's "What are you playing" thread. Come
   back in 30-90 days with genuinely new playable content — repeat posters have a median best score of **15**
   against **0** for one-shot posters. **Never spend the monthly slot on a gratitude post**: Grow!'s thank-you
   follow-up scored 44 against its launch post's 177.

### One risk specific to us

This audience is primed against derivative cozy games right now — the top replies on 2026's best-performing
launch post are *"Once or twice a year someone makes something actually new, then EVERYONE just copies that."*
**A generic idle garden gets pattern-matched to the Grow a Garden wave in one second.** The Turn and the stakes
are what survive that filter in r/incremental_games. But r/cozygames' rule 1 defines cozy as having *"little
time pressure or harsh penalties"* — so **lead with stakes in the incremental sub and with warmth in the cozy
sub.** Same game, two true sentences.

---

## ASO — the correction, and the five actions

### What our docs get wrong

Doc 17 says the App Store algorithm is two-engine — metadata relevance to enter, then behavioural quality
(retention, engagement) to stay — so D1/D7 is an ASO input.

**The shape is right and Apple confirms it in writing. The second engine is not what we wrote.** Apple's
[discoverability page](https://developer.apple.com/app-store/discoverability/) names exactly three behavioural
inputs: **downloads, number of ratings and reviews, and quality of ratings and reviews.** Retention, engagement,
sessions, D1 and D7 appear nowhere in Apple's public ranking documentation.

**The honest mechanism is a chain, and it changes what you build:**

```
   good retention  →  the player reaches a satisfying completion moment
                   →  the review prompt fires there (max 3 times / 365 days)
                   →  ratings VOLUME and STAR QUALITY go up
                   →  those two ARE documented ranking factors
```

So: build a **satisfying completion beat to hang the prompt on** — and the Turn's Tally is exactly that — rather
than chasing a retention number for its own sake. And note that **"quality of ratings" is a separate factor from
"number of ratings"**: a 4.9 outranks a 4.2 at the same volume. That upgrades **cloud save and crash-freedom
from engineering hygiene to ranking infrastructure**, because save-data loss is the #1 one-star driver for the
category leader.

Ironically **Google is the better home for the retention thesis**, which is the reverse of how our docs frame
it: Play's store-listing experiments report **1-day retention per listing variant**.

### The five actions, ranked by return per hour

1. **Rewrite the name, subtitle and keyword field.** Hours of work, feeding the highest-weighted engine. Every
   successful comparable spends **all 30 title characters on brand + genre phrase** — "Cats&Soup: Relaxing Cozy
   Games" is exactly 30, its subtitle "Cute kitty home in forest ASMR" is exactly 30. Put **Cozy, Garden and
   Idle** where they are weighted most. Exact-match titles still beat authority: *Blossom: Idle Garden* with 12
   ratings outranks Terrarium's 262,984 for "idle garden". *(Note for whoever does this: the ASO agent worked
   from the repo name and analysed "Ghost Garden". The game is **Garden Wonder** — the finding still holds that
   a bare brand name wastes half the highest-weighted field, and it is worth checking what "wonder" pulls in
   before committing.)*
2. **Build keyword-assigned custom product pages.** New since **29 Oct 2025**: up to **70 pages, each with its
   own keywords**, so a "cozy game" searcher and an "idle garden" searcher see different screenshots
   *organically*. Mirror with Play's custom store listings (up to 50, targetable at search terms). **Do this
   instead of Product Page Optimization at launch** — PPO needs 90 days and statistical confidence you won't
   have.
3. **Ship Game Center sign-in and one In-App Event before launch.** The **Apple Games app is pre-installed on
   iOS 26+**, and Apple states games using Game Center features and In-App Events "receive prominent display".
   Game Center player initialization unlocks the **Top Played chart in both the Games app and the App Store**.
   In-app events are also an *acquisition* surface — **people who don't have the app can install directly from
   an event card**. Almost none of the cozy-idle comparables are exploiting this.
4. **Build art for Apple's new creative assets.** Announced **5 Aug 2026**, shipping with **iOS 27 this fall**:
   a product-page header and a **dedicated search-results asset** — "the first visual experience when users find
   your app through the Search tab." Figma/Photoshop templates provided. A cozy garden with a looping ambient
   shot is almost the ideal content. Remember only **the first one to three screenshots** do any search work.
5. **Protect the rating, because the rating is the ranking.** Cloud save and account recovery before launch. Ad
   load conspicuously light, and *say so in screenshot copy* — the category leader is beatable on exactly that.
   Place the prompt after a completed sequence, never at launch, never on a user action, and **never behind a
   "do you like the app?" filter, which Google explicitly bans**.

---

## Short-form video — what our docs say is wrong

**Doc 17's "organic reach fell from 15-20% in 2024 to 4-8% by early 2026" comes from
[one SEO blog that cites nothing](https://gamosy.com/blog/tiktok-game-marketing)** — and the same post is where
our "$200 behind a post" figure and a "59% of gamers discover games on TikTok" stat came from. TikTok's own
research says **41%**, from a 2021 study. There is no 59%.

**The metric is also wrong for the platform.** "Organic reach as a percentage of followers" is a
Facebook/Instagram concept. On TikTok the **For You page drives 7 of every 10 views** and search is ~4% of
impressions.

**The real collapse is about account size, not gaming.** [Socialinsider](https://www.socialinsider.io/social-media-benchmarks/tiktok),
2M videos: accounts with **1-5K followers fell 59% to 350 views per post**, while 100K-1M accounts **rose 39%**.
Engagement did not fall — it rose. **Distribution to small accounts fell.** As a brand-new account we are on the
wrong side of that split regardless of genre.

**And $200 is a four-day experiment, not a campaign.** TikTok's published minimums are **$50/day at campaign
level and $20/day at ad group level**. Worse, that $200 figure was borrowed from a *Steam wishlist* playbook — a
wishlist is a free click, an install is an auction bid. For mobile UA the sourced floor to learn anything on
TikTok is **$5,000/month**.

### What to do instead, at zero dollars

- **Instagram Trial Reels are a free A/B rig and nothing on TikTok matches them.** Toggle "Trial" and the reel
  goes **only to non-followers**, stays off your grid, and reports back in ~24 hours. Test five hooks on the same
  20 seconds of garden footage without burning an audience or spending a cent. Post there first, 24 hours ahead
  of TikTok, and only cut the winners.
- **Length is two products, not two sizes.** 15-30 seconds hits the highest engagement rate (6.0%); 2-3 minutes
  generates **~11× the median views**. A 20-second harvest loop and a 2-minute ambient garden are different
  posts.
- **Cadence:** 2-3 posts a week, cross-posted natively to Reels and Shorts. Most videos get under 1,000 views.
  Consistency beats volume.
- **Free TikTok SEO nobody does:** keyword in the *first line* of the caption, on-screen text in the first three
  seconds, **say the keyword out loud** (TikTok transcribes and categorises), auto-captions on, descriptive
  filename before upload.
- **Creator seeding beats an account.** Neoludic Games — a released, well-covered cozy game — has **10.1K
  followers**. The reach lives with creators, and cozy creators are overwhelmingly **micro** (1.3K-10K) and
  answer their own email. Personalised cold email gets **17-18% replies** vs 7-9% generic; **40-60 genuinely
  tailored emails** in daily batches of 10-15, one bump a week later.
- **One account, framed as the game, with devlog as a series inside it.** JUDGMENT — nobody has real data
  comparing the two, but distribution is per-clip and For You-driven, a game-named account converts a curious
  viewer into a store search, a devlog-first account accumulates an audience of other developers, and two people
  cannot feed two accounts.
- **Do not pay a cozy influencer.** There is an active, large backlash: Not Malcolm's *"'Cozy Game' influencers
  are imploding"* has 351K views, *"this 'cozy game' is a fraud"* 304K. This audience is primed to detect and
  punish sponsored enthusiasm. Unsponsored seeding and visible dev honesty are worth more, and a paid campaign
  carries reputational downside we cannot afford.
- **Only after a clip crosses 50K organic views**, consider a Spark Ad — an ad built on the existing organic
  post, so engagement attributes back to it — budgeted honestly as $50/day for a fixed four-day test, treated as
  an experiment in reach, not a UA channel.

---

## The web build — the ruling

**Ship it wide, and treat exactly one portal as the funnel: CrazyGames.** It is the only surveyed platform that
both moves volume and **puts App Store and Play Store buttons on your game's own page**, and its
[2025 developer terms](https://files.crazygames.com/documents/developer_terms_20250818.pdf) say plainly:
*"Platforms such as Steam, Apple app store and Google play store are not considered browser gaming websites"* —
so a mobile launch does not break its optional two-month web-exclusivity bonus (+50% compensation).

**But know exactly what you are getting.** In-game store links are **never allowed**; clause 10.2(b) bars
promoting your own site through the game without written consent. **The funnel is the game page, which you do
not control** — and when CrazyGames takes a third-party web hit to mobile, **it publishes under its own App
Store account** (Space Waves, Capybara Clicker, Italian Brainrot Clicker are all `com.CrazyGames.*`). Basic
Launch runs 7-21 days, graduates at 500 plays, and **pays nothing** — ads stay disabled until Full Launch. Their
own clicker benchmarks are sobering: **15 minutes average play, 6.6% D1**.

**The others are dead ends for us.** Poki is bigger but demands **5-year web exclusivity** and instructs
developers to *"Remove splash screens and outgoing links"* — which kills the funnel and probably conflicts with
our own public build. itch.io HTML5 games **can only take donations** (though reclassifying as "Downloadable"
enables sales). Newgrounds' revenue share is **switched off entirely**. Kongregate has not accepted new games
since **1 July 2020**. Coolmath buys flat licences for "thinking" games with no ads and no external links.

**Two corrections to our PWA notes, and one thing we never recorded that is worse than all of them.**

- **The EU restriction is gone.** Apple announced the removal of Home Screen web apps in the EU in Feb 2024 and
  **reversed it before iOS 17.4 shipped**. There is no EU carve-out to design around.
- **iOS 26 removed installability requirements entirely** — "there are now zero requirements for 'installability'
  in Safari." Easier to ask for; still no automatic prompt (BeforeInstallPromptEvent is unsupported on Safari
  and Firefox and is non-standard).
- **THE ONE WE MISSED: Safari deletes all localStorage, IndexedDB, session storage and service-worker registrations
  after 7 days of no interaction — and only Home Screen web apps are exempt.**
  ([WebKit](https://webkit.org/tracking-prevention/).) **An uninstalled iOS Safari player who takes a week off
  loses their entire garden.** For a game whose whole promise is that the garden is still there when you come
  back, that is fatal, and the review evidence across this whole lane says players blame the developer, not the
  browser. **Cloud save, or a very hard Home-Screen-install push, is not optional before the web build goes
  wide.**

Background Sync, for the record, does not exist in Safari at all and is not a standard. Offline catch-up must
run on next foreground open.

**And the Melvor lesson is not the one our docs record.** Melvor's free browser build really did precede
600,000+ downloads and a $9.99 Steam launch. But in 2026 **its mobile leg is the weakest part of the business** —
iOS frozen at v3.0.3 since March 2023, Play at 3.7 stars — while **Patreon (2,854 paid members at $5+)** is
plausibly worth more than the entire mobile store take and funded a fifth full-time employee. **The corrected
lesson: a free browser build funnels to a *direct relationship*, and the direct relationship is worth more than
the store.** That is a materially different instruction, and a much more achievable one for two people.

---

## What in this game is actually filmable

**JUDGMENT throughout — this is a craft read of our own docs, not sourced research.**

Ranked for a five-second muted vertical clip. The brutal part first: **everything that lives on a sheet films
badly.** The Tally, the blessing, the pack reveal and the welcome-back scene are the four places this game is
most proud of itself, and all four **cover up the thing people came to look at**. In a vertical feed a cream
panel full of numbers reads as a spreadsheet in under 300ms.

> **The editorial rule: if a moment needs a sheet, it will not film — so either it happens in the garden, or it
> ends on a frame that does.**

### The five clips

| # | The clip | First frame → payoff | Caption |
| --- | --- | --- | --- |
| 1 | **Wonderfall ×100** — the hero, and it is fully built today | An ordinary bright garden at midday, deliberately boring → at 0.5s the sky goes, rainbow halo spins, confetti fires, the flower pulls its `wow` face → a Wonderstruck harvest lands ×100 | *"Every garden in the world is under this exact sky right now."* |
| 2 | **The windfall pop** — the most legible clip in the game | Fall's trug, seven of eight ripe, the unripe plot centre-frame → the last crop pops, all eight take gold rings → **one tap**, eight harvests fire in a staggered wave | *"Plant it in the morning. Pop the whole bed at dinner."* |
| 3 | **The gate lifting** — the cheapest strong clip we own | A hedge gate, padlock chip, something drifting behind it → the Turn commits, the hedge rises → Fall's board in full | *"Starting over doesn't take your garden. It gives you a new season."* |
| 4 | **The Tally** — great content, wrong container | Start on the base number **mid-roll**, never static → lines slam in → *"…the year scored ×1.66"* | *"It scores your whole year. There is no row for what you got wrong."* |
| 5 | **A mutation arriving mid-grow** — the best idea, the worst shot | Close on a growing plant under a grey rain wash → thunder flash, the plant goes gold → it is **still growing**, with time left on the clock | *"The storm did that. It's still growing."* |

**Clip 1 has a production secret nobody in the docs has noticed.** Weather is a pure function of wall-clock
epoch time — `slot = floor(epochSeconds / 60)`, hashed — and Wonderfall is 0.5% of slots. **The exact minute of
the next Wonderfall is computable in advance.** The rarest, loudest moment in the game is on a public
timetable, and you can be recording before it starts.

*(The critic flagged the flip side: the game ships unminified with no build step on public GitHub Pages, so that
timetable is computable by anyone with devtools. Within a week of any r/incremental_games post, someone
publishes the year's Wonderfall schedule as a spreadsheet. That is the incremental audience behaving normally.
It argues for the forecast being **an in-game surface you own and pace** rather than a third-party wiki you
compete with.)*

### What to build because it films well

Ranked by film-value per hour of engineering, cheapest first. **Every one is smaller than a feature.**

| # | Build | Cost | Why |
| --- | --- | --- | --- |
| 1 | **Force the flower's reaction** — a `wow` face and a line at the windfall, the Century Bloom, and the Tally total | Near zero | A face reacting tells a viewer the thing was good in a language that needs no UI literacy and survives a thumbnail on mute. All three are already "always speak" class events. Improves **all five clips at once**. |
| 2 | **Mutations recolour the petals, not the plot** | Small | The art schema **already supports `rainbow: true`** ("cycle a seven-colour palette per petal"). Today the treatment is a border and glow *around* the plant, which at phone scale is invisible in a recording. **This converts our structurally strongest mechanic from unfilmable to filmable at data cost, not art cost.** |
| 3 | **Index the Tally's line sounds up the pentatonic** instead of five identical `coin` ticks | Near zero | The audio system already does exactly this for combo taps. Five lines climbing is a rising figure. |
| 4 | **The Tally share card** — one final frame outside the sheet: *"YEAR 7 · ×1.66 · blessed the Moonflower · 12 species"* | Low | **The Year produces something the sky never can: a score.** Scores are comparable, boastable, screenshot-shaped — and right now it evaporates when the sheet closes. This is the clip's ending frame and the App Store screenshot. *Do not build a share button;* a frame worth screenshotting beats a button nobody taps. |
| 5 | **A capture-mode class that hides HUD and dock** | Low | Three HUD pills and five dock buttons around a 370×370 board is a lot of chrome in a 9:16 crop. A tool, not a shipped feature. |
| 6 | **The Spring return shows the garden**, tint snapping from ripe-autumn to fresh green | Small | Ends the game's biggest ceremony on its best-looking surface. The tint layer already exists. |
| 7 | **One-tap harvest on an armed Fall bed** | Moderate | Eight taps is fiddling; one tap is a firework. **Already an open owner question** — this costs a decision you owe anyway. Guard it to armed beds so it doesn't become a general auto-harvest. |
| 8 | **The Century Bloom needs an opening** | Moderate, heavily reused | Every doc specifies its *economics* — 14 days, one at a time, survives the Turn — and **not one specifies what happens when it opens.** It currently ends in an ordinary harvest. It is the only moment in the game with two weeks of anticipation behind it, and anticipation is what makes a clip get *shared*. It is also the one thing that legitimately earns a push notification: *"your Century Bloom opens tonight"* is news, not a nag. |

**Two free assets nobody has named.** The day/night cycle is **360 seconds, not saved, always starting at bright
midday** — so any six-minute screen recording contains a complete sunrise-to-night garden. Speed it to five
seconds and that is the App Store video's opening, with no build at all. And the season tint warms Summer toward
autumn as the meter fills, which is a **before/after of a whole playthrough in two frames** — the
highest-performing static format in cozy marketing.

**Two production hazards that will cost a shoot day.** `prefers-reduced-motion` collapses every animation,
disables shake, drops ambient petals to zero, and makes the Tally **land instead of roll** — a capture phone with
that setting on records a dead game. **Check it before every session.** And film the tint ripening at midday; the
multiply tint reads browner over a night sky.

---

## The differentiation argument, in one page

### The claim no competitor can make

> **Every collectible in this game can be earned by playing it, nothing is taken while you are away, and no ad
> ever plays that you did not ask for.**

Across **233 substantive five-star reviews** of the seven biggest games in and around our lane, **exactly one**
praises a game for being generous or fair. This is not a values position. It is a counted, empty square.

And note what makes it defensible: **the claim itself is copyable** — Tiny Harvest shipped almost these words
eight months ago and is being destroyed for AI art. What is not copyable is *making it true while also earning*,
which is what the Turn is for.

### The clip

**The Wonderfall ×100** (built today, schedulable to the minute) for acquisition. **The gate lifting** for the
audience that has bounced off other idle games — it inverts the genre's ugliest word, and its payoff is a
*place*. **The Tally share card** for the store gallery, once it exists.

### The sentence — and the fork underneath it

Five candidates, tested against *can a stranger repeat it after hearing it once*, and *does it promise something
no competitor can*:

| | Candidate | Repeat? | Promise? |
| --- | --- | --- | --- |
| **A** | *"Everyone's garden is under the same sky, and you can read the forecast."* | **Strong** — a stranger hands it on as "everyone gets the same weather and you can see it coming" | **Strong** — a synchronous global event with no server, no accounts, no friend graph |
| **B** | *"A garden game with a weather forecast."* | Perfect, six words | Weak — describes a UI feature, doesn't tempt |
| **C** | *"Plant for the storm."* | Perfect | Partial — promises a timing decision, says nothing about the world being shared. **But it is usable today, with zero new build.** |
| **D** | *"One garden, one year, one sky everyone shares."* | **Fails** — a stranger reproduces the rhythm without the content | |
| **E** | *"You don't walk a map — you swipe through the year, and turning it is the prestige."* | **Fails outside the genre.** "Prestige" is inside baseball | An excellent *design* sentence. It should stay at the top of doc 32 and **never be marketing copy** |

**The pick is A, with a hard condition: do not say it in public until the forecast surface exists.** The claim is
currently true and undemonstrable — doc 29 names that weakness itself. A player who installs on that sentence and
finds no forecast has been mis-sold, and the one-star writes itself. Use **C** as the short form on a thumbnail
until then.

**Shared Sky versus the Year, ruled: the sky is the better sentence, the Year is the better product, and framing
them as a choice is the error.** Doc 32 already says they compose. Lead *acquisition* with the sky, because it is
what gets a clip watched by someone who has never heard of us. Lead *retention and store screenshots* with the
Year, because it is what the person who installed is still doing on day seven, and it is the only thing here that
makes a shareable object.

> ### THE FORK THE OWNER HAS TO RESOLVE
>
> The best-performing cozy dev post of 2026 (587 upvotes) won on this exact register:
>
> > *"Crops never die. Miss a week? Everything's right where you left it. No timers, no energy systems, no
> > pay-to-win."*
>
> **We cannot say that and also ship punishing creature upkeep.** Both are defensible games. They are not the
> same marketing. The store listing, the Reddit post, the first screenshot and the one sentence all fall out of
> this answer, and every one of them is currently blocked on it.
>
> **The recommendation, and it is a recommendation, not a decision:** keep the stakes, but make the consequence
> **legible, reversible, and tied to what the player chose rather than to how long they were away** — and put the
> sleeping face in the first screenshot rather than leaving it to be discovered. That version can honestly say
> *"nothing is taken while you're away"* while still having something at stake, and it is also the version that
> avoids a **PEGI 12** rating (see [40-financial-model.md](40-financial-model.md)). See
> [38-market-refresh.md](38-market-refresh.md) for the review evidence on both sides.

---

## What is the owner's call, and what we recommend

Presented as options. **We are not deciding these.**

### 1. How loud to be about the "two people, no budget" story

| Option | The case | The risk |
| --- | --- | --- |
| **Loud** — lead with the solo-designer story in every post | Measured: posts carrying a personal story had a **median 17 upvotes against 1** uncontrolled. And it is the honest counterweight to the AI-slop wave the audience is currently punishing. | It ages badly if the game grows, and it can read as asking for sympathy rather than showing a game. |
| **Quiet** — let the craft speak, mention the team only when asked | The game looks bigger than it is, which helps at editorial desks. | Throws away the single most-upvoted framing device available for free. |
| **Warm but not central** *(recommended)* | The hand is visible in the art, the AI disclosure is proudly plain, the story is in the body of the post and never in the title. | — |

### 2. Launch timing

| Option | The case | The risk |
| --- | --- | --- |
| **Aim at PGC London, 18-19 Jan 2027** *(recommended)* | It is the best-fitting free beat on the calendar, it is CONFIRMED rather than estimated, it gives a real date to build toward, and it leaves room to file IGF and DevGAMM in September on the current build. | A January launch means Christmas is spent finishing rather than resting. |
| **Aim at Wholesome Direct, ~June 2027** | Bigger reach if you get in. | The window date is **unsourceable**, the machine runs on Steam wishlists, and it is nine months of waiting. |
| **Ship when ready, no date** | Honest. | Doc 29 is right that a launch aimed at a date beats a launch aimed at "when it's ready", and this is the pattern that produces a game that never ships. |

### 3. The premium PC question — bigger than it looks

Our whole "$3,650 lifetime per idle title" framing is a **mobile free-to-play** statistic. In the
desktop-companion lane next door, a first-time solo dev took **~$1.6M gross in four months at $7**. The
incremental audience's own stated price ceiling is *"doesn't charge more than like $5"* with a demo, and
r/incremental_games gives Steam-flaired posts **18.0 mean upvotes against Android's 2.0**. A premium PC build
would put prestige in front of an audience that treats it as a feature rather than an apology.

**Against it:** it is a second product, a second store, a second set of art requirements, and doc 29's scope rule
("depth by accretion in a single scene") exists for a reason. **This is genuinely the owner's, and it should be
decided deliberately rather than drifted into.** We have not costed it.

---

## The one-page checklist, if you only do six things

1. **Turn on Firebase Remote Config before 1 September.** Ten minutes, buys months of free tier.
2. **Start the Google Play account and line up twelve Android testers.** The 14-day continuous clock is the
   hardest schedule constraint in the whole plan.
3. **File the Wholesome Games Presents pitch and join their mailing list.** Twenty minutes, free, open now.
4. **Enter DevGAMM by 7 September** (free, Best Mobile Game category, unreleased games eligible). **Enter IGF by
   13 September** if $75 is affordable.
5. **Build the five small things on the film list** — forced flower reaction, mutations recolouring petals,
   Tally sounds, the share card, capture mode. All five together are smaller than one feature.
6. **Answer the fork.** Stakes or "nothing dies while you're away". Everything else waits on it.

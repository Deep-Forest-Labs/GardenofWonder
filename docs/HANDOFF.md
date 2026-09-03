# Handoff — Current State and Next Steps

Last updated: **2026-09-01** (the growth stages pass)

> **THE GROWTH STAGES PASS LANDED 2026-09-01 — every flower grows through four stages, and the
> ripe blooms are proven untouched.** Sprout (shared cotyledons in the species' leaf colour), stem,
> a closed **bud** shaped per family and tinted from the species' own gradients, and the bloom —
> which now **opens at 90% of the grow, a visible beat ahead of the ripe wiggle**, exactly as the
> owner ruled on `tools/stage-spike.html`'s sliders (sprout .14 / stem .45 / bloom .9, opening
> .9s — approved values shipped verbatim in `DATA.growth`). The shrunken-bloom middle stage is
> gone; so are the numeric `data-stage` rules, the orphan stage-0 rule, and the
> `transform-origin:50px 44px` line whose double-count was punch list `#14` — that bug is gone by
> construction, and the punch list's keeper has already pruned `#14` against this pass's commit.
>
> **The blooms did not move: zero differing pixels on a full ripe board, before vs after,
> re-derived independently.** The instrument is committed — `node tools/stage-parity.js` shoots two
> deterministic boards through the real build and diffs arms pixel by pixel; its freeze sequence
> answers every recorded probe trap plus four new ones (the ambient petal canvas, the pending rAF
> frame, transitions that must be finished not pinned, promoted-layer antialiasing) and one real
> leak it caught: **an invisible child still widens the paint bounds a glow's `drop-shadow`
> rasterises from**, which is why the hidden stage groups are hidden with `display`, not opacity.
> Suite **1,495**; zero new colours; the stage rules' hand-copy in `tools/sky-spike.html` came
> along in the same commit. Both 2026-09-01 (stages) entries in
> [10-decision-log.md](10-decision-log.md) carry the reasoning; the spike stays live for future
> tuning at `tools/stage-spike.html`, now reading the shipped `DATA.growth`.
>
> **The Unity handoff shipped with it: all 76 per-stage renders** — every species at every stage —
> **exported to `art/exports/stages/`** by `node tools/export-icons.js`, each file self-contained
> with the stage pose baked from the REAL `style.css` block (read and rewritten at export time, so
> it cannot drift; the exporter refuses to run if the block's anchors move). The screens gallery
> was regenerated the same day, so [44-screens.md](44-screens.md)'s summer garden shows the
> four-stage board the players see.

Read this first if you're picking up the project cold. It covers where things stand, what's been
decided, and what to do next. Update it at the end of any significant session.

> **THE SKY PERFORMANCE PASS LANDED 2026-09-01 — and it ends with two minutes of your time, not with
> a green tick.**
>
> The iPhone 16 frame dip was measured rather than guessed. **Wonderfall was the dip**: it cost 80%
> more per frame than a clear sky and now costs 13% more, because its breathing warp was one animated
> filter duplicated across eight full-window layers (now one) and its veil repainted a full-screen
> gradient every frame (now a sliding tile). Two costs nobody had suspected turned out to be bigger
> and are nothing to do with weather — the screen shake and the sky's own colour update were writing
> custom properties on `#game` and on the document root, invalidating everything beneath them; both
> now write on the elements that read them. Four of the five filed suspects were innocent.
>
> **Every sky is bit-for-bit identical to before** — Clear, Rain, Thunderstorm, Aurora and the
> Sunbreak diff to zero pixels; Wonderfall to 0.006% at a worst channel delta of 3, which is one
> animated filter a frame apart. `DATA.weatherStage` is untouched. `node tools/sim-test.js` is
> unchanged at 1,491 passing, which is the proof that no game logic was touched.
>
> **What is NOT answered: whether an iPhone holds 60.** No Mac can tell you — iOS pays for blends
> and animated filters in a way desktop Skia does not, which is why this was reported from a phone.
> So the pass built the thing that can: **Settings → Developer tools → Frame rate**, a readout that
> splits each frame into `js` (our code) and `rest` (paint, blend, composite). Hold each sky on the
> handset for twenty seconds and read it. A big `rest` with a small `js` is the sky costing paint.
> **The owner's two-minute check is in [11-known-issues.md](11-known-issues.md); until it is done,
> "the web build holds the frame" is an expectation and not a finding.**

## Where the project stands

The game is **built, working, and live** at <https://deep-forest-labs.github.io/GardenofWonder/>, deployed from
`main` at the repository root. It is a single-screen idle garden — tap a talking flower, plant
seeds in eight plots, harvest with rarity multipliers, spend on **upgrades** (the word "badges" is
retired everywhere a player reads, 2026-08-30), and earn **power-ups** from a starting bag, quests,
levels, the daily and the Almanac.

> **THE UNITY TEAM GOT PICTURES AND AN ASSET LIST, 2026-08-31 — docs-only, no game code touched.**
> [44-screens.md](44-screens.md) is every key screen of the live build at true phone size;
> [45-asset-inventory.md](45-asset-inventory.md) is the whole icon set exported as `.svg` files
> they can lift, plus a table of every other art class with where its drawing code lives and how
> many variants it has. Both sit in **"What the Unity build needs"** on the wiki.
>
> **Both are generated, and neither may be hand-edited** — the next run overwrites it.
> `node tools/capture-screens.js` drives the real build headlessly through 26 states and writes
> the PNGs *and* the page that indexes them from one scene table. `node tools/export-icons.js`
> writes all 46 icons, six representative art samples, and its own manifest table. Add a screen to
> the table in `tools/capture-screens.js` and it appears in the doc on the next run.
>
> **A screen is DRIVEN to its state and photographed second, and the run asserts that state before
> the shutter.** A screenshot taken in the wrong state exits zero and looks entirely plausible, so
> a failed assertion stops the run and refuses to rewrite the page. Three things had to be pinned
> or the gallery differed every run — the announcement, the sky, and the six-minute day cycle. See
> the traps below and the 2026-08-31 (docs) entry in [10-decision-log.md](10-decision-log.md).
>
> `docs/screens/` is the **third deliberate binary exception** and the first that is not in the
> game at all — recorded in [09-conventions.md](09-conventions.md) with the other two.

> **THE STRATEGY REFRESH LANDED 2026-08-30 — three new documents, docs-only, no code and no economy knob.**
> [38-market-refresh.md](38-market-refresh.md) (the lane as it stands), [39-growth-and-launch.md](39-growth-and-launch.md)
> (a dated calendar) and [40-financial-model.md](40-financial-model.md) (what it earns). Reasoning and the full
> list of corrections is in the 2026-08-30 strategy entry in [10-decision-log.md](10-decision-log.md).
>
> **Four numbers our docs quote do not hold**, and one of them is load-bearing: the Simulation retention table
> (D1 30.1 / D7 8.71 / D30 2.96) comes from a vendor blog that contradicts itself on the same page, and the
> largest real 2026 dataset publishes **no genre split at all** and puts the median mobile game at D1 ~18-22%,
> D7 under 4%. **Our planning numbers are a top-quartile outcome dressed as a baseline.** Also corrected: Cats &
> Soup is 80M downloads and a listed publisher, not an indie at 10M, and its "$300K/mo" could not be reproduced;
> Egg Inc's moat is "never interrupt with an ad", not generosity; Terrarium's "$9K/mo" is from October 2022.
> **Sensor Tower, AppMagic and data.ai are now one company**, so their agreement is one vote.
>
> **The finding that matters most: the number that decides the business is how many days a player stays.** To
> hold 3,000 players a day at median retention you need **750 installs every day forever** — above what any
> optimised game gets organically. At a good cozy curve, 375. At best-in-class idle, 200. **At median retention
> this plan cannot reach its own target**, which makes the money question and the design question the same
> question.
>
> **The positioning claim is now countable, not rhetorical.** Across 233 substantive five-star reviews of the
> seven biggest games in and around our lane, **exactly one** praises a game for being generous or fair. And
> **no commercially successful cozy game shipped a prestige loop between Jan 2025 and Aug 2026** — the Turn is
> uncontested, and untested.
>
> **Two hard dependencies, neither an opinion.** There is **no analytics, telemetry or remote-config code
> anywhere in the repo** (verified by grep), so the number the plan turns on cannot be measured and doc 37's
> "all remote-tunable" has nothing behind it — that is the first line item on the Unity shell, ahead of ads.
> And **Safari deletes every save after seven days without interaction** unless the player installed the game to
> their Home Screen, which is live for the friend playtest group right now. Both in
> [11-known-issues.md](11-known-issues.md), with the Unity-or-Capacitor contradiction the run also hit.
>
> **Four calls are the owner's and are deliberately not made:** pricing posture (free-with-a-real-shelf
> recommended; premium at $4.99 is genuinely live), launch timing (PGC London, 18-19 Jan 2027 recommended —
> confirmed rather than estimated), how loud to be about the two-people story, and whether $3-5K/month is the
> target or the floor. Plus the fork in doc 39: **stakes, or "nothing dies while you're away" — we cannot market
> both**, and the store listing, the launch post and the first screenshot are all blocked on it. The
> recommendation is to keep the stakes and make the consequence legible and reversible, which is also what keeps
> the game out of **PEGI 12** under the new June 2026 criteria.
>
> **Three dates worth acting on this week:** turn on Firebase Remote Config **before 1 September** (billing
> starts, and enabling early defers it months); **start the Google Play account now**, because a personal
> account needs **12 testers opted in continuously for 14 days** before production unlocks; and **DevGAMM closes
> 7 September** — free, explicitly mobile, unreleased games eligible.

> **PHASE 3.7 IS BUILT — the Numbers pass, the What's New popup, and orders that pay in minutes.**
> Three owner rulings from live play, built together because the first one is a project-wide rule
> the other two have to obey. Suite **1,353** at the time (was 1,305), clean; the reasoning is in the
> phase 3.7 entry in [10-decision-log.md](10-decision-log.md).
>
> **The rule, and it now holds project-wide:** *if a button costs something, it says what you get
> and what you now have, and every number a purchase changes updates the moment you buy.* **This
> overrules the phase-2 "pips, not spreadsheet rows" position** — the resolution keeps both, dots
> for the feel and the number beside them for the value. **One deliberate exception survives**: year
> one's mystery meter, still wordless.
>
> **The plant picker was lying and now cannot.** Its grow label applied sprinklers and boosts and
> forgot petals and Keepers — a Tulip full of Quick Sprout read 18 seconds while growing in 13 — and
> its payout pill was `seed.yield` off the data row with none of the seven multipliers a real harvest
> reads. Both now come from the functions the plant itself goes through, `Game.plantGrowth()` and a
> new `Game.plantPayout()`. **A number the garden has improved says so**: a faster time takes the
> house green and an improved payout carries the `×` that did it.
>
> **The sweep found the rule was kept on Lucky Charm and almost nowhere else.** Thirteen badge cards
> whose only live number was `Lv N`, six of them saying nothing numeric at all. Five priced meadow
> tenders described entirely in adjectives — **two of which silently SLOW the hives they touch**,
> now stated in a red pill as plainly as the benefits. A food button stamping the tin's `+16h` while
> the cap handed over two. "Sell all" with no total. A bought sky promising "everything growing gets
> a shot" on a board where nothing could catch it. A gem skip naming a price and never the wait it
> deletes. **Thirteen getters joined `game.js`** so the panels read numbers instead of re-deriving
> them, and three house-rule violations went with them — the Almanac was rebuilding the tap payout
> stack by hand and had already drifted past the combo.
>
> **The What's New popup ships in its own file**, `ui-news.js`, because it is the only modal in the
> game a player cannot swipe away. Announcements are data — a new build is one row appended to
> `DATA.announcements`. **The seen-flag lives in `gw-news`, outside the save**, because "Got it!"
> wipes the save and a flag inside it would loop the popup for ever; a sim-test asserts it survives a
> reset that demonstrably clears the wallet. **Nothing in the dialog fades in** — a modal whose one
> button depends on a frame that may never arrive is a trap. The art is the repo's **second
> deliberate binary-asset exception**, written into the conventions and kept narrow.
>
> **Orders pay in minutes now, not seconds.** `STAND.tiers[].mult` went **1.55/1.85/2.20/2.60 →
> 30/200/210/225**, measured with a new tool, [`tools/order-gold.js`](../tools/order-gold.js), that
> divides every delivery by the rate the rest of the garden was running at. Medians land at **t1 87s,
> t2 95s, t3 73s, t4 82s** against the owner's 60–120 second band; the old values paid **0.2 to 4
> seconds**. Two things worth carrying forward: the invariant's real floor is `1 / wildBonus` =
> **1.12**, not the lowest number in the table as `data.js` had claimed since the Stand shipped; and
> the suite was only ever checking the TOP tier, because `standReset()` unlocks to level 20. Both
> properties now loop the tiers.
>
> **The one thing that got worse:** `year-sim`'s cheap-Turn verdict no longer decides the same way
> twice — five runs came back OK, OK, OK, FAIL, FAIL where it used to exit 0 every time. It fails on
> lifetime GOLD only; `smart` never out-mints `casual` on Saved Seeds, so the property the cumulative
> mint guarantees is intact in every run.
>
> **Chased down after the phase shipped, and it was the pantry.** The Turn never emptied it, so a
> fresh board of orders met a stockpile — 30% of a Turn-heavy player's order income lands in the
> first minute of a new year. Two rulings came out of it and both are specced, not built: seed the
> pacing tool, then build [the Preserve](41-the-preserve.md). See "The current task".

> **PHASE 3.6 IS BUILT — the cleanup round: three ruled fixes and the owner's review kit.** No new
> layouts, so no wireframe gate; no economy knob moved. Suite **1,305**, clean across six runs, every
> fix mutation-proven; `year-sim` exits 0. Reasoning in the phase 3.6 entry in
> [10-decision-log.md](10-decision-log.md).
>
> **The discover quests count what you already found.** A quest on a track the game keeps a lifetime
> record for is now dealt at that record, as a *floor* — which also straightens a save already
> stranded at 0/5, with no migration and nothing new in the save file. `q_discover_12` was measured
> unwinnable at a ceiling of 11/12 and now asks for four more species instead of twelve. **The goal
> strip shows the quest nearest to done** rather than the oldest, and the quest panel reads the same
> order from the same getter so the two can never disagree. Measured over ten simulated minutes and
> 684 strip reads: the quest changed **4 times, every one a completion handing over** — no flicker.
>
> **The Stand's standing is paused** behind `STAND.repPaused`, read through one getter,
> `Game.standOrderRep(order)`. Orders keep paying gold and keep counting the Tally's orders line; the
> card omits its star chip. The authored number stays honest in the save, so **slice D turns this
> back on by changing one word and every board already written pays** — asserted in both directions.
> Every other standing faucet is untouched, each with its own assertion, because putting the flag
> inside `addRep()` would have switched off the whole ladder with a green suite. **Consequence worth
> holding on to: until slice D, the quest ladder plus the Almanac's 140 is the only road to every
> level gate**, including the fourth habitat slot at 16.
>
> **The padlock now means the one-time wall and nothing else.** The go button draws its sprout in
> every state and drains on the `--paper-dim` family when unaffordable. Fall's crop picker took the
> same edit — it shares the row and has no unlock wall at all. **The half that would have shipped
> broken is `syncAfford()`**, which rewrote that slot on every `currency` emit; a markup-only fix
> grows the padlock back a second after the panel opens.
>
> **The review kit is in Developer tools.** *Wind the world forward* 1h / 8h / 24h winds every
> production clock back — plants in both seasons, Fall's bed and the Century Bloom, jars, crafts,
> order refills, creature food **and** the separate keepsake clock — then runs one real `tick(0)`.
> **`state.lastSeen` is the one field it will not touch**, because moving it is what turns an advance
> into an absence and pays offline income. **A running power-up and the Wonder keep their remaining
> time on purpose**, so the warp and the POWER-UP button do not fight; verified live. *Summon* the
> next unmet creature or all six at a chosen ★, through the same `moveIn()` record and the same
> arrival beat a real threshold writes — it leaves `state.discovered` alone, so a creature summoned
> at ★3 honestly shows an empty bar toward ★4. **Summoning grants no levels**, so the band fills only
> as far as habitat slots allow; the row header says so. Plus one of every power-up, +50 Saved Seeds,
> and the pack buttons that were already there.
>
> **The one place the kit touches the mint, stated plainly:** `Dev.warp()` calls `credit()` nowhere,
> but the real `tick(0)` runs the auto-harvester, so a save that owns the drone earns **one harvest
> per warp press** (measured ~450–500 gold, often zero — the drone's own cadence gate blocks a
> second). Suppressing it would mean a cheat that lies about what the automation would have done.
> In [11-known-issues.md](11-known-issues.md) with the called-sky seam.

> **PHASE 3.5 IS BUILT AND LIVE — the Big Five, the band, and the map is gone.** Three pushes on
> 2026-08-30, in the order doc 36's rail required, each leaving the live game navigable:
> `06785dc` the two door graphics become the vertical swipe; `add83d4` the dock rebuild; `eeba59d`
> the map deleted. The owner approved `tools/dock-spike.html` with six annotations and they are
> built verbatim — they are listed in [36-hud-and-dock.md](36-hud-and-dock.md), whose **as-built
> section at the bottom is the truth** for this dock.
>
> **The dock is Orders & Quests · Cards · GARDEN · Turn · Shop**, with a floating **UPGRADE** pill
> and **POWER-UP** button in the band above it. **The band costs the layout nothing** — it lives in
> the yard `.stage` already reserves for the creatures, and the board is 370×370 before and after.
> The meter pill and the album star retire into the Turn and Cards buttons, which is the fix
> `style.css` asked for in prose and buys **44px round buttons back** at 360px wide.
>
> **Navigation is the gesture now: DOWN goes under to the Hollow, UP goes out to the Wild Meadow**,
> and a room leaves by the opposite swipe. The Hollow's direction flipped, because *up goes in, down
> pulls the camera back* was the map's rule and there is no camera any more. **The meadow has no
> visible entrance at all** — one line from the flower on the first idle after the tutorial is its
> whole discoverability, and that is the phase's named risk, in
> [11-known-issues.md](11-known-issues.md) with the two cheapest fixes.
>
> **THE GAUNTLET RAN: 69 agents, 52 confirmed findings, one blocker and twenty highs — all fixed.**
> The blocker was the meadow's own signpost: `idleNudge()` spent and saved `seen.meadow` *before*
> `sayText()` had drawn anything, and `sayText` swallows a line whenever a coach mark is up or the
> bubble would paint into a hidden subtree. Twenty-six seconds idle in the Hollow, in Fall, or on a
> gate burnt the game's only pointer to the Wild Meadow, permanently, with no backfill by design.
> **Consume a one-shot only after the thing it pays for has happened.** Also caught: a swipe starting
> on UPGRADE or POWER-UP navigated away; the pouch chip was guillotined by the Turn button's own
> clip; the creatures painted over the GARDEN pedestal and stole its taps; and the round buttons were
> still 40px on every phone under 700px tall. Full list in the 2026-08-30 gauntlet entry in
> [10-decision-log.md](10-decision-log.md); what was knowingly left is in
> [11-known-issues.md](11-known-issues.md).
>
> **Two specificity traps, and they are the same trap twice** — worth knowing before touching this
> dock. `.dock.five .dock-btn{min-height}` out-specified both the pedestal's 74px and the short
> block's 50px. And **`:has()` takes its argument's specificity**, so four rules written before the
> `.five` class existed silently out-ranked everything it set.
>
> **Three real bugs the build itself found, all fixed:** the year-one Year panel had a mystery and **no
> door out of it** (full meter, breathing button, and a panel still saying *keep going* with no way
> to Turn — the owner's own warning coming true); lifting the creatures to clear the band broke doc
> 05's anchoring rule outright; and `min-height` on `.dock.five .dock-btn` out-specified both the
> pedestal's 74px and the short-screen block's 50, so the pedestal did not rise and the 700px dock
> did not shrink. All three were found by measuring rather than by reading.
>
> **What is still open:** the **Apothecary has no dock button** and doc 36 never named that — it
> survives on the tab pill it shares with Upgrades and Shop; the **jars-waiting dot** has nowhere to
> live now the meadow has no button; and the map's **land parcels died with it**, deliberately
> (doc 25 says so at the top). Suite **1,207**, clean across five runs; `year-sim` exits 0.
> **No economy knob or rule moved.**

> **FIRST PLAYTEST, 2026-08-29 — THE PROGRESSION LADDER NEEDS A DESIGN SESSION BEFORE PHASE 4.**
> The owner played a fresh save and hit two things in the first minutes; auditing them turned up a
> third. All three are reproduced against the real engine and written up with numbers and options in
> [11-known-issues.md](11-known-issues.md), and flagged at the top of
> [16-progression-and-quests.md](16-progression-and-quests.md), which owns the ladder:
>
> 1. **A discover quest cannot count a species you already have.** Quests are dealt at `progress: 0`
>    and a species fires its discover event once, ever — so the two free species are spent before
>    `q_discover_5` is dealt. The Almanac reads 2 while the strip reads 0. It reaches the front of
>    the always-visible strip at ~3 active minutes and stays there for days.
> 2. **`q_discover_12`, the ladder's last rung, is arithmetically unclaimable** — dealt at 8+ species
>    found, its ceiling is 10/12 even after growing all nineteen. It then holds the strip forever,
>    and the daily quest can never reach the strip again.
> 3. **The Stand out-runs the level ladder.** It has paid reputation since it shipped, up to 48 rep
>    an order, while doc 32 puts order-driven rep and the levels 18–40 rungs in slice D.
>
> **These are design calls, not bug fixes, and none of them were taken.** Also filed and not taken:
> the plant picker draws one padlock for two different refusals — a momentary "36 gold short" and a
> permanent "150,000, once" — with the hierarchy inverted, so the expensive thing looks obtainable.
>
> **THE SURFACE RUN IS DONE FOR THE NIGHT — phases 2 and 3 merged into one unattended session on
> the owner's call, 2026-08-29.** The wireframe gate's approval step was deferred to morning for
> this run only, so **both spikes shipped first in their own commits** —
> `tools/turn-spike.html` (21 frames) and `tools/fall-spike.html` (12) — and
> **[35-morning-review.md](35-morning-review.md) carries every decision the gate would have put to
> the owner**, opening with where the night got to and a five-minute phone walkthrough that was
> itself walked end to end before it was written down. **No economy knob or rule moved.**
>
> **PHASE 2 IS BUILT AND GAUNTLETED: the Turn has a surface.** The year-meter pill (a third wallet
> whose own body *is* the meter) and its projection with both Turn gates drawn as tracks; the `turn`
> sheet's five beats — the ask, the blessing picker, the Tally's count-up / lines / total, the
> spring return with its gate card; petal tracks on the Almanac rows; unlock prices in the plant
> picker with a confirm; and the season tint ripening Summer as the year fills. **Eight adversarial
> critics ran over it and three independently found the same blocker: the ask told the player the
> Turn was free** while it zeroed their gold, badges, boosts and plots 5–8. It now carries two
> labelled rows — *this year goes* and *these stay, always*. Also found and fixed: the **mystery
> meter did not exist** (`turnsCompleted` appeared zero times in `ui.js`, so a first tap explained
> the whole prestige system), the **season tint stopped a quarter of the way through the year** and
> left the iOS status-bar strip untinted above the sky it sits on, the **HUD still wrapped at
> 375px**, and the drained-paper family — the game's word for *stopped working* — was carrying the
> ceremony's best news.
>
> **PHASE 3'S FIRST HALF IS BUILT AND GAUNTLETED: the strip, the gates and Fall.** Horizontal is
> time — SPRING ← SUMMER → FALL → WINTER — swiped with the vertical gesture's rules mirrored, plus
> an edge tab on each side so the gesture has a visible door the way the burrow has one. **Fall is
> not a place layer**: a season is the same room in a different month, so `.stage` swaps its board
> and the scenery swaps behind it while the HUD, quest strip, rail and dock never move — which is
> also why nothing in Fall re-states the 560px column. Fall's board is the garden's construction in
> a woven trug on damp autumn earth, eight crops on hour clocks, the windfall stated as one chip
> above the board, and the Century Bloom in its own block with a plot colour of its own. Six more
> critics found **three blockers**: the bed chip read the clock instead of the engine's windfall
> marks and so lied about the +50% in both directions; the gate's only visible button was inert; and
> a two-thumb tap changed season. All fixed, and **four new traps** are recorded below.
>
> **THE MAP IS DELIBERATELY UNTOUCHED and the dock still says World** — the owner's runway call was
> *phase 2 deep, phase 3 parked with the map still working*. Both navigations work, which is doc
> 34's hard rail. **The blocker under the rest of phase 3: the Wild Meadow's only door is the map**,
> so retiring one strands the other; doc 32's sentence saying otherwise is corrected there. Phase
> 3's remainder is itemised in [11-known-issues.md](11-known-issues.md), and the four questions
> waiting for the owner are in [35-morning-review.md](35-morning-review.md). New files are `fall.js`
> and `ui-fall.js`, in [02-architecture.md](02-architecture.md). Suite **1,207**, clean across
> repeated runs.
>
> **PHASE 1 OF THE GARDEN YEAR IS BUILT, 2026-08-29 — the engine, as pure simulation, awaiting
> the owner's verdict.** The whole prestige loop runs headlessly under the live game, which looks
> and plays identically: `Game.credit()` as the single earnings faucet (cheats and refunds
> flagged out of the mint), one-time seed unlock prices with the level-gates retired and a
> grandfather migration, petals (Rich Bloom / Quick Sprout) live in harvest and offline income,
> the atomic `Game.turnYear()` over the full never-resets partition, Fall's board with the
> windfall and the Century Bloom as simulation, Bloom Mastery retired into a one-time Saved
> Seeds conversion, the four quest re-keys at a held 777, and Developer-tools drivers to feel a
> whole year in five minutes. The doc-33 sim-test bill (items 1–6, 8–18) is genuinely asserted —
> the suite grew to **1,096 assertions**, clean across repeated runs and hardened by the
> gauntlet's own mutation tests — and `tools/year-sim.js` drives casual-play pacing through the
> real `game.js`. **The gauntlet ran (33 agents, 20 confirmed findings, all fixed or escalated —
> see the two 2026-08-29 entries in [10-decision-log.md](10-decision-log.md)) and left ONE OPEN
> OWNER DECISION: the cheap-Turn cadence is strictly profitable at the spec constants (bill item
> 17's economic half — sqrt-splitting, uncapped veterancy, Turn-surviving Fall beds;
> `node tools/year-sim.js 12 all` reproduced it and exited non-zero until the mint was ruled
> cumulative; it exits 0 now, and a non-zero exit is the regression signal. Dials
> are `minCoins` / `veterancy` / `mintK`).** See
> [03-systems.md](03-systems.md#the-garden-year--the-engine-simulation-only) for the engine,
> [07-save-data.md](07-save-data.md#the-garden-year-added-2026-08-29) for the save shape and
> migration, and the 2026-08-29 build entry in [10-decision-log.md](10-decision-log.md) for the
> judgement calls. **The independent review is in (2026-08-29, the review entry in the log):
> spec fidelity 10/10, the suite's 1,051/0 reproduced, the Tally's cumulative reading RATIFIED
> (it is arithmetic), and phase 1 APPROVED on two conditions** — a phase-1.1 patch closing the
> one fresh-mutation escape (M09: the grandfather migration lacks its negative assertion), and
> **the owner's ruling on the mint**, where the review's four measured variants recommend the
> cumulative shape (B) and prove veterancy must be deleted rather than capped.
>
> **PHASE 1.3 — THE GAUNTLET'S FOURTH ROUND IS THE FIRST WITH NO BLOCKER AND NO LIVE BUG.**
> 18 findings, all coverage gaps, dev-surface wrinkles or stale sentences; rounds 1–3 each
> turned up something that could bite a player and round 4 did not. Fixed: the per-cell
> windfall marks (the substrate round 3's latch fix rests on) were never round-tripped, and
> `bedPaid` was still restored verbatim from the save — so the mirror the last entry called
> impossible to desync did, including from every save live on the site right now; `load()`
> derives it. Four of the five Tally lines had no test that could fail — every line now has an
> exact multiplier at every rung. Two tests asserted the right sentence while walking a path
> where the code never ran (the refund branch, unreachable through the real badges; and
> `Dev.setYearStats`'s species count, discarded on reload). **And the dev sheet blessed Daisy
> by name — which the five-minute script's own steps cap** — so every later Turn silently
> dropped the largest per-Turn grant in the game; it now blesses the cheapest flower with room
> and says when none is left. Suite **1,202**, twelve mutations, twelve caught. The
> small-sample habit was also caught a third time and in a third author's hands: the margin
> table is restated as a median with a 30-run range, and the docs now say plainly that **the
> tool's exit code, not the table, is the regression test.** See the 2026-08-29 (phase 1.3)
> entry in [10-decision-log.md](10-decision-log.md).
>
> **PHASE 1.2, THE GAUNTLET'S THIRD ROUND — one LIVE bug found and fixed, and every refusal
> now has a test.** Round 3 caught what two rounds of critics and an independent review had
> all walked past: **Fall's windfall latch stuck permanently the first time a player replanted
> a plot as they harvested it** — the natural per-plot flow — because the latch was a flag
> cleared only when the bed fell simultaneously empty. Five consecutive full ripe beds paid
> ONE windfall, and it survived both the Turn and save/load, so once stuck it was stuck for
> the life of the save. The latch is now **derived from the fill's own unspent marks** and
> ripeness is read from the clock rather than the cached `ready` flag (which `load()` clears,
> so the promise that a bed ripening while the tab was shut still pays is now true rather
> than merely commented). **My own bill-12 test missed it by harvesting the whole bed before
> replanting — the one flow that did clear the flag.** Round 3 also found that both gardens'
> ripeness gates, three of Fall's four purchase gates, the Saved Seeds sink and
> `passiveIncomeRate()`'s unlock guard had **no negative test at all**: deleting any of them
> left the suite green while the game became an unbounded gold printer. All now asserted from
> the NO side; thirteen mutations, thirteen caught; suite **1,149**. See the 2026-08-29
> (phase 1.2) entry in [10-decision-log.md](10-decision-log.md).
>
> **PHASE 1.1 IS COMPLETE — BOTH CONDITIONS CLOSED, AND THE MINT IS CUMULATIVE.** The owner
> ruled, and the ruling is built: the pool a garden will ever mint is
> `mintK × sqrt(state.lifetimeCoins)`, a Turn draws the undrawn part of it
> (`state.mintedBase`), the Tally multiplies the draw without consuming it, and
> **`DATA.year.veterancy` is deleted** — not capped, because the review proved any per-turn
> multiplier on a split-neutral base re-arms the split. `minSeeds` gates the un-tallied
> increment. Two new never-reset top-level fields; a phase-1 save inherits `lifetimeCoins`
> from the year it is standing in. **The exploit is dead by construction** —
> `node tools/year-sim.js 12 all` **exits zero**, with normal play ahead of turn-spam by a
> a median ~1.9× on seeds (range ~1.5–2.2× over 30 runs) and ahead on gold too (re-measured after the same day's Fall
> fixes, which handed the adversary a better crop and **widened** the margin from ~1.5–1.6×). The suite is at **1,202 assertions** with
> a new bill item **17b** for the mint's own properties, and twelve of twelve mutants die
> (four survived the first pass and are closed; writing the last of them found a real defect
> in the patch — a `null` `lifetimeCoins` passed the finite guard as `0`). **Condition 1
> (M09) was verified rather than redone** — the mutant still kills the suite on both arms.
> **Two costs, measured and filed, neither fixed:** the lifetime seed supply is now hard-
> bounded, so the 636,378 shared-skill sink needs 4.05 × 10¹³ lifetime coins and doc 33's
> "2–5 petals per Turn forever" is false (phase 4's `mintK` chair); and **the blessing
> inherited the exploit** — one free Rich Bloom petal per Turn is now the largest per-Turn
> grant in the game, and 95 Turns hand over the whole Rich Bloom ladder (318,189 Saved Seeds
> of value) for ~101M lifetime coins, about 2.5 days of play. That is **the one open owner
> decision now**, with four dials named and none taken; `year-sim` splits bought from blessed
> petals and discloses it beneath the verdict rather than failing on it. See the
> 2026-08-29 (phase 1.1, the ruling) entry in [10-decision-log.md](10-decision-log.md) and
> the open decision in [11-known-issues.md](11-known-issues.md). **Phase 2's wireframe gate
> is next, in its own session.**
>
> **Phase 1.1's first half, earlier the same day — condition 1 closed.** M09 is dead (three cases now separate the
> migration's two grandfather arms and assert the negative), round 2 of the builder's gauntlet
> is answered (21 confirmed findings, two of them blockers about rigs that never exercised the
> path they covered), and the suite is at **1,096 assertions**, every fix mutation-proven 16 of
> 16. Two findings changed what we know: the pacing model had never bought the game's
> automation, so **the exploit is a SEEDS-ONLY break — normal play out-earns the turn-spam
> cadence on gold by ~2.7×** (which narrows the dials to the mint's shape and corroborates the
> review's recommendation), and with automation modelled the tool moved the first year close to
> doc 33's 370–410K band. *(That was quoted from three runs and later withdrawn: a 120-run
> sample puts the median at ~355K, quartiles 309–386K, about a quarter inside the band.)* **The owner's ruling on the mint has since
> landed — see the block above.** Phase 2 begins at the wireframe gate, in its own session.
>
> **THE GARDEN YEAR IS DOCUMENTED FOR BUILD, 2026-08-29.** The brainstorm ended and the owner said
> go. **[32-the-garden-year.md](32-the-garden-year.md)** is the master design — four seasonal
> gardens on one horizontal swipe strip replacing the world map (Summer home · Fall at Turn 1 ·
> Winter ~3 · Spring ~6), the Turn as prestige (invited never forced, clears fast annuals in the
> main garden only, never kills a running long timer), Saved Seeds minted once per Turn from the
> year's earnings, and flower mastery as **petals** on the Almanac's own rows (Rich Bloom + Quick
> Sprout everywhere, one signature each, six authored at launch, chance skills as countdowns).
> **[33-year-one-economy.md](33-year-one-economy.md)** is the retune riding inside slice A: unlock
> prices carry the spread (seed 3 = 150K, ×1.5/tier — retuned from ×1.6 by the 2026-08-29 full
> sim; per-plant spreads cannot wall while 1.4× holds), the mint formula, petal prices, Fall's eight plants and the +50% windfall rule, the
> Century Bloom, migration, and an 18-item sim-test bill.
>
> **Orders stay, and are promoted** — the owner's call ("that was always a fun system"): the Stand
> becomes the perennial reputation engine behind an extended level ladder, entered from an order
> strip above the plots rather than a map trip. **Doc 30's season-level split retires** — nothing
> re-locks, so one lifetime reputation track survives untouched. **Old Bloom Mastery retires into
> petals** with a one-time conversion grant. **Badges stay run-scoped** (the rebuild ritual);
> **drone and harvesters stay parked** for their own conversation.
>
> **Build slices, each judged before the next:** A) the Turn + petals + unlock prices + Fall at
> background-swap art, with the retune and sim-tests; B) the launch six signatures; C) Winter;
> D) the order strip and the ladder past 17; E) Spring. The map and its World button stay until
> the year strip ships — a tab leaves when its home exists.

> **PER-SEED PRESTIGE IS THE DESIGN, 2026-08-29 — pressure-tested, two of the advisor's own claims
> refuted on the way.** The owner committed: incremental idle tapper on the garden engine, seeds
> spread far apart, prestige at the seed-3 wall, and the spend as **permanent upgrade trees per
> seed** (value, speed, mutation, gem, pack, proc; the drone eventually per-seed).
> **[31-per-seed-prestige.md](31-per-seed-prestige.md)** is the analysis — a four-agent pressure
> test plus adversarial verification. Verdict: **the core is right** — it is the strongest concrete
> answer yet to "nineteen seeds that differ only in throughput," and it is doc 30's Seed Saving in
> authored form. Priced **~20/5 as literally described, ~45/12 with four surgeries.**
>
> **The structural finding: no per-plant price spread can create a wall while yield = 1.4× cost
> holds** — the whole ladder self-finances in ~6 active minutes. The spread lives in **one-time
> per-seed unlock prices, permanent across prestiges** (seed 3 = 150K, ×1.6/tier, seed 19 ≈ 277M),
> gated by the shipped two-stage chip. *(Final design, later the same day: the unlock price gates
> alone — season-level regating was rejected as a double wall, and the ladder's rewards re-author
> instead. See [33-year-one-economy.md](33-year-one-economy.md).)*
>
> **The four surgeries:** currency is **sqrt of lifetime-earned this run**, never leftover balance
> (Antimatter Dimensions is the honest counterexample, and the conditions that save it there —
> hyper-exponential income, x^(1/308) damping — do not hold here; the simulated hoarding penalty is
> 15.5% of a run's prestige income per late purchase). The first wall **feels** six-times-impossible
> on day one and breaks day 2–3 (weeks-long walls return legitimately at prestige 6+ — Egg Inc's
> first prestige is day 19–23, but every long-wall comparable climbs on visibly accelerating
> income, and this wall under 1.4× would be a flat savings grind, which is the actual churn shape).
> The trees are **a checklist, not an allocation exam** — 114 free knobs at the moment the garden
> was just cleared is the fatal-rated attack that survived its own steelman: shared spine + one
> signature branch, five or six authored signatures at v1, **chance axes sold as pity countdowns**,
> **no per-seed gem axis ever** (it is the deleted 2026-08-15 override mechanism returning, on the
> premium currency), one ceremonial choice at the turn. And **automation gets a global floor — the
> creatures tend the garden while you are away** — with per-seed drone upgrades raising the rate,
> because a drone buried in one tree gives the longest run of the game zero offline income.
>
> **The invariants audit returned 25 touched rules, 7 blockers**, tabled in doc 31 — the spendable-
> tallies corruption (a conversion that reads `state.discovered` de-stars creatures; use a separate
> accumulator), the quest ladder's empty rep fuel on run 2+, the meadow quests jamming during the
> hold (114 rep needs stand-ins), the barren first run (daisy+tulip carry no verb and no creature),
> Bloom Mastery absorbed not stacked, upgrades applied via the masteryMult pattern into
> `passiveIncomeRate()` in the same commit, and **cheat buttons now minting permanent progression**
> — cheats stay, but cheated coins must sit outside the conversion or playtest pacing data is
> contaminated. Provisional numbers (all data): points = 0.1·√(runCoins)·(1+0.2·prestiges); tree
> level price 5×1.3^(seed−1)×1.25^level, +30%/level; first turn day 2–3, ~10 prestiges, all seeds
> ~day 31.

> **THE PIVOT TO PRESTIGE, 2026-08-26 — and the retune is unblocked.** The owner's call after the
> direction analysis: **focus on the garden as is and design a real incremental prestige** —
> restart, a currency, permanent points. **[30-prestige-directions.md](30-prestige-directions.md)**
> prices five systems; this is **direction D executed**, and the map, Stand, meadow and bench are
> *parked, not deleted* — the Gardens Ladder idea re-sequences the map from geography into
> progression later.
>
> **Two structural findings gate everything.** The economy is **bounded** — ×1.53/tier, then flat at
> ~1.48M/hour forever — and a bounded economy cannot prestige: no deceleration, and a
> lifetime-earnings currency pays the same in run nine as in run two. The recommended fix is
> cosy-native rather than genre-standard: **the season ages** — growth slows as the year ripens into
> autumn, so prestige timing lives in the art, not in a derivative. And **the one-number rule must
> bend**: lifetime reputation never resets and stays the meta-track; the *season's level* (rep
> earned this season) is what gates the seed ladder, so the ladder is **reclimbed, not extended** —
> which dissolves the audit's "no vertebrae past 17" problem.
>
> **The recommendation: The Turning Year + Seed Saving as one system (~45/15, the best base odds
> priced so far).** Full seasonal prestige, the turn *invited never forced*, permanent upgrades
> named **Perennials**, and the prestige currency an **Heirloom Seed** whose properties are
> inherited from how the season was actually played — the breeding feature the owner wants, arriving
> as the prestige payout. Hold the Gardens Ladder as the long-run ceiling; Fallow Beds and the
> Compost Heap are texture, not spines.
>
> **A never-resets list is proposed as sim-test material:** creatures, the Hollow, lifetime Almanac
> records, cards, gems, mementos, lifetime reputation. Badges, coins, plots above four, boosts,
> season level and Bloom Mastery reset — the strongest argument yet for capping mastery.
>
> **And the owner ruled the same day: *"we can retune the economy. The economy is already
> broken."*** The retune is no longer deferred — it is part of the prestige work, because the
> consuming system the deferral was waiting for is the prestige loop itself.

> **FOUR DIRECTIONS PRICED, AND THE HOOK TURNS OUT TO HAVE SHIPPED BY ACCIDENT, 2026-08-26.** The
> owner asked whether the genre is too saturated to enter, and what it would actually take to
> succeed. **[29-direction-and-odds.md](29-direction-and-odds.md)** answers it, and rejects the
> framing first: **1,087 idle games in 2026 earned ~$3.97M combined — about $3,650 each.** That is
> not a saturated market, it is **a market full of games nobody could find**, which is good news for
> a team whose advantage is craft. The genuinely saturated case is Merge-2, crowded with *funded*
> competitors rather than bad ones. **The real question is whether a category rewards craft or
> rewards spend.**
>
> **Three of the four distribution channels open to two people with no UA — community posts,
> platform editorial, clips — are closed to a merge board**, and all four reward the same two things.
> **Does the direction produce a sentence, and a five-second video?** The project has craft and
> neither, which is exactly the Terrarium warning: 11M installs, ~$9K/month.
>
> **The four, priced** (base = $3–5K/mo, breakout = >$20K/mo): **A finish the plan 30% / 7%** —
> safest, most likely invisible. **B the merge pivot 12% / 3%** — highest ceiling, worst odds from
> here, strands most of what is built. **C the Shared Sky 40% / 15% — recommended.** **D the
> incremental-depth reposition 35% / 10%** — Magic Research made ~$400K from essentially two posts on
> r/incremental_games. **A, C and D are not exclusive; only B is a fork.**
>
> **The finding: `DATA.weather` runs on wall-clock epoch time**, chosen on 2026-08-15 so offline
> reconciliation could resolve a past slot. The consequence nobody drew — **every player in the world
> is under the same sky at the same moment, and the sky is computable forwards too, so the game can
> print a forecast.** Not "it might rain." *"Wonderfall at 6:42."* Wonderfall is 0.5% of 60-second
> slots: roughly **seven times a day, worldwide, simultaneously**, on the rarest mutation tier.
>
> **That is a synchronous global event with no server, no accounts and no friend graph.** It supplies
> the missing sentence, the missing reason to open the app, a notification that is *news* rather than
> guilt, the missing clip, and the missing reason planting is a **timing** decision. **And it names
> an identity five shipped systems already share:** the epoch day/night cycle, weather, mutations,
> Nightbell, and the Ridge — all of them *the world has a clock and you play against it*.
>
> **Two weaknesses recorded, not glossed:** with no server the shared sky can be asserted but not
> demonstrated (the forecast is real and free; a read-only counter is the cheapest server anyone has
> specified), and a uniform global slot clock gives a player in the wrong timezone fewer good skies
> while awake — **check this before it ships.**
>
> **Four of the five things any direction needs are missing:** a one-sentence hook; **D7 above ~15%**,
> now an ASO input and the only free algorithmic lift, needing dailies, streaks, notifications and a
> designed session; one live-ops-free monetization lever (all three specced, none built); and a
> distribution date — **Wholesome Direct is annual, June, free to submit, next window roughly nine
> months out.**

> **MERGE MOVES TO THE CENTRE, AND THE GARDEN STAYS THE HOME SCREEN, 2026-08-26 (proposal).** The
> owner played Gossip Harbor, agreed the bench is underutilised, and floated the full pivot — *"maybe
> The Little Garden is secondary."* **[28-the-loop.md](28-the-loop.md)** is the answer: **yes to
> merge central, no to a merge game**, and it goes further than the current plan in every respect
> except that one.
>
> **What the owner liked contains three things and only one is about merge** — a generator you act
> on, **demand rendered on top of supply**, and visible progress while you play. The middle one is
> load-bearing and it is a *layout* insight: this game puts its demand **two navigations from its
> supply**, which is why the map MVP's own rubric question — *does checking the Stand pull you back
> into planting something specific* — structurally cannot pass.
>
> **Three reasons the garden stays home.** Merge core loops **monetize on energy** (Gossip Harbor,
> Merge Mansion, Travel Town, Family Island all are) and energy is already rejected twice as the
> anti-cosy pattern; a merge core loop carries **the same content treadmill that killed the match-3
> plan**, because the board is the cheap half of a merge game and the task ladder is the expensive
> half; and it trades the one differentiated asset for the most commoditized screen in mobile —
> doc 17 lists Merge-2 under *avoid entirely*. **You cannot out-spend Century Games; you can
> out-craft them.**
>
> **Four changes, no new genre.** The **order queue comes to the garden** — three customer faces
> above the plots, the Stand's existing simulation rendered where the planting decision is made. The
> **bench becomes the second screen, not the sixth place**, one gesture away with the same strip
> above it. **The bench is the job that never automates** — the garden automates by design, the bench
> cannot, and that is the answer to *what is the player's job after automation*, which is the hole
> the missing ceiling, session shape and retention plan are all three views of. And **the generator
> is the garden, never an energy meter**: harvests already drop chain items, `basketMax` caps the
> bank, board space caps the hand.
>
> **The consequence nobody had noticed:** a harvest's bench rung is
> `seedBucket[seed] + rarityBump[rarity]`, so **rarity and mutations already decide the quality of
> the merge board.** Legendary stops being a bigger number and becomes a better hand — the strongest
> answer yet to *why does the garden still matter*, needing no design, only noticing that two
> shipped systems already touch.
>
> **Scarcity gets a rule:** *space and attention, never permission and never progress.* You may run
> out of room and out of hands; you may never run out of the right to play, and nothing earned may
> be taken away. Four of the five scarcities already exist — board space, habitat slots, plot
> adjacency, the awake clock — and the fifth is the Night Garden's time-of-day gate.
>
> **Three session shapes are specified at last:** the 40-second check at map altitude (no decision
> required, and where the rewarded video belongs), the 7-minute sit-down across garden and bench,
> and the 30-second return for one finished thing.
>
> **Also settled by the owner, 2026-08-26:** creatures go **wide** — many of them, attracted by
> blooms as now, with a hatchery or breeding wanted long-run; **seasons and the content bill of
> materials are deferred** as separate conversations; and **the cheat buttons stay**, reconfirmed,
> since the audience is still friends playtesting.

> **THE DESIGN WAS AUDITED AS A WHOLE, 2026-08-26, and the audit argues with its own brief.** The
> owner asked for an audit before a plan and named eight known gaps rather than letting them be
> rediscovered. All eight are real. **[27-design-audit.md](27-design-audit.md)** is the document;
> four of its positions change what should be settled first.
>
> **The game has a spine and it is reputation** — one number, earned never spent, no XP, the curve
> pre-aligned to the order tiers. What is missing is that **the spine has no vertebrae past level
> 17**, because the things it was going to gate are unbuilt. So *"which collection is the spine"* is
> the wrong first question: a collection is a retention surface hung off a progression track, never
> the track itself.
>
> **There are five collections and a half, not three** — card album, creature roster, Honey Shelf,
> species Almanac, Bloom Mastery, and mementos with no sink. **Three of them are the same table**,
> all keyed on the same nineteen seeds. Folding them into **one nineteen-row Almanac** (species ·
> best rarity · lifetime count · honey made · creature raised) is the cheapest structural
> improvement available and it answers *why plant this flower* five ways on one row.
>
> **Nothing in this game is scarce, and that is upstream of the ceiling.** Every seed returns
> 2.212× cost in expectation and outside creature hunger nothing can go backwards. A pillar against
> *punishment* has been read as a pillar against *stakes*. **The sleeping face is the proof the game
> can carry a stake cosily, and it has been used exactly once.** So a new **item 0** goes ahead of
> the owner's list: what a session is, what the player's job is after automation, and what is
> scarce.
>
> **The order the audit proposes:** 0 the loop and scarcity → 1 the spine (one collection to finish,
> the rest demoted) → 2 the ceiling, which **must rule on Bloom Mastery** → 3 retention, dailies and
> the Night Garden → 4 monetization *architecture* → 5 the economy retune *and* SKU pricing → 6
> FTUE. Monetization is **split**: what is sold is cheap and constrains the economy; what it costs
> cannot be priced against placeholder coins.
>
> **What it recommends cutting:** the Honey Shelf as a screen, the card album's *seasonal cadence*
> (keep the pack opening), the Greenhouse from the biome list, and Bloom Mastery's endlessness. And
> **it deliberately relitigates the merge bench** — merge is a core loop, not a side room, and the
> Stand already proved the transformer role needs no crafting system. The counter-case is recorded
> in the audit rather than dismissed.
>
> **Seven stale claims in `docs/` are listed there too.** Doc 13 still says "not built" and the
> Stand shipped; doc 12 still lists the Apothecary as a region and defers a "Critter Grove" that
> shipped as the creature roster; doc 15 shows three dock layouts as current; doc 22 says "only one
> creature." Same failure as the visual standard, same cause — **nothing enforces it.**

> **THE VISUAL STANDARD IS WRITTEN DOWN AND ENFORCED, 2026-08-26.** The garden screen was audited
> against every other screen and the drift was counted rather than guessed: 46 translucent lips
> against 39 solid ones, `--ink-soft` used 23 times and declared nowhere, 9 `var()` fallbacks holding
> the wrong colour, and the creature panel's *asleep* state painted in the Epic purple. **The art was
> not degrading; the rules were.** Seven fixes shipped that day, one commit each — the token
> declared, every box-shadow lip made opaque, lips and the full six-layer recipe added to the
> creature panel, `.stat` and `.verb-note` given the house material, the seed sheet's flavour line
> filed in the Almanac, the seed badges tinted from their own `art.c1`, and *asleep* repainted as
> **drained** rather than as a rarity.
>
> **[05-art-direction.md](05-art-direction.md) is now the enforceable version of that** — the recipe
> on paper as well as on soil, the lip ladder, the rule that a lip is never translucent, the rule
> that a state takes the value out of a surface before it takes a new hue, and the white-veil trick
> that derives a pale surface from a saturated token without adding a hex. The palette names 22
> colours. `style.css` still holds 147.
>
> **The geometry sweep is deliberately NOT done** — 16 radii and 11 border widths remain, and the
> reasoning for leaving them is in [11-known-issues.md](11-known-issues.md#visual-standard). It is
> its own pass because moving a radius moves layout and moves how a `:active` travel lines up with
> its lip; bundling it with a colour change makes any regression impossible to bisect.
>
> **The highest-leverage item left on the whole page is that nothing enforces any of this.** A
> pre-commit check on four things — a raw hex outside `:root`, a radius outside the allowed set, a
> `box-shadow` with zero blur and an `rgba()` colour, an undeclared custom property — would have
> caught every item the audit counted. The rules did not fail because anyone disagreed with them.
> They failed because nothing noticed.
>
> **The world map is the direction now, and the dock changed with it, 2026-08-25.** The owner's
> call: **the dock is meta, the map is navigation, and upgrades stay in the garden.** The dock is
> heading for **Friends · Cards · (World) · Quests · Shop** with the world on a raised centre
> pedestal — the shape large mobile casual games converge on. A region never gets a dock slot again;
> Apiary and Craft were always a prototype shortcut. **Friends is a reserved slot, not a feature** —
> it is a backend, and this is two people with no server. A goods market is a *place* on the map;
> the IAP **Shop** is a *meta destination* in the dock, and real money still appears in exactly one
> place.
>
> **The gesture was already free.** `ui.js` binds swipe-*up* in the garden to the Hollow and leaves
> swipe-down unbound, so the map lands on the one free gesture and the whole game becomes one
> vertical ladder: **map → garden → Hollow**. Not a pinch.
>
> **`tools/map-spike.html` is built and is the fastest way to try it** — a camera over one world
> box, two stops, one CSS transform, toggles for night, collect bubbles, locked land and chrome.
> **What it found changes the build plan: the dive cannot keep zooming until the garden fills the
> screen.** A phone is 2.16:1 and a parcel is roughly square, so no scale both fills the frame and
> keeps the neighbours out — and more decisively, the garden is *its own composition* (sky, quest
> strip, plots as tappable cards, the burrow door) and rebuilding it inside a world box means
> maintaining the garden twice. **So the map is a layer above the existing garden and the dive ends
> in a cross-fade.** The map's garden is a thumbnail that only has to read at map distance.
>
> **Two rules taken from the design pass, and they are the guardrails:** **no region may be a second
> garden** — every location is a producer, a transformer or a consumer, or the map becomes the
> AdVenture Capitalist trap one level up. And **the map collects the boring half, the garden keeps
> the interesting half** — one-tap collect pays coins and raw flowers, while mutations, rarity,
> keepsakes, packs and the tap loop still require going in, so the map serves the 40-second session
> and the garden the 7-minute one. **"Completed" means fully automated:** a region only shows a
> collect-all bubble once its planter and drone are owned, which makes the drone an unlock rather
> than a percentage. **The Market is the right second location** because it is a *consumer* and
> therefore structurally unlike the garden — and it is the owner's own "gift store where people come
> and ask for things", already specified in [13-order-system.md](13-order-system.md). See the top of
> [10-decision-log.md](10-decision-log.md) and
> [15-navigation-and-ia.md](15-navigation-and-ia.md).
>
> **And then the build paused for a design pass, 2026-08-25 (later).** The owner kept the spike as
> the art reference and asked for the whole map to be designed first, against market research —
> the framing is **"a new-age FarmVille: incremental, idle, and a tapper."** The research is done
> and lives in **[25-world-map.md](25-world-map.md)**: what Hay Day, Township, Gossip Harbor,
> FarmVille's corpse, Grow a Garden and Egg Inc actually prove, the map inventory in phases
> (frame → **Garden Stand** with a visible customer queue → Potting Shed surface → specialized
> garden *biomes*), and a probability ranking.
>
> **The owner answered the same day: the Stand is confirmed first**, the **map is a freely
> scrollable world** (pan with a finger at map altitude; the vertical swipe stays as the altitude
> gesture; the spike's fixed two-stop camera is superseded on this), and **the ceiling is open** —
> design what a AAA team would build, ship incrementally, with the not-a-clone bar standing per
> garden.
>
> **THE HOUSE RULE, 2026-08-25: share the grammar, never share the verb.** The owner's note was
> that the meadow *felt like a different game* — it had been built as a **diorama** where the garden
> is a **board**: a square frame floating in a scene, the talking flower in the middle, tappable
> cells around it, pets underneath, dock below. That is Garden Wonder's **layout language**, and
> every place uses it. What must differ is the **verb**: garden cells are *temporary* (plant, grow,
> harvest, empty) and meadow cells are *permanent* (place it once, it stays). Farming against
> building, on one board shape. **Sharing a frame is cohesion; sharing a verb is the clone** the
> place taxonomy exists to prevent. See
> [25-world-map.md](25-world-map.md#share-the-grammar-never-share-the-verb).
>
> **The Wild Meadow is that board now.** Eight cells holding **hives** (make honey) or **tenders**
> (make nothing; improve only the hives they *touch*, on the garden's own adjacency table). Eight
> hives is max raw output with no multipliers; two hives ringed by tenders is few-but-excellent.
> **Moving is free** — buying costs, rearranging never does. The **flower stands in the middle and
> pays exactly what it pays in the garden**; `UI.flowerBtn()` returns whichever flower is on screen,
> which is what makes every tap effect fire in the right room. The skin still differs: a dry-stone
> wall instead of a fence, unmown grass with seed heads instead of mown stripes, and an old **stone
> terrace with cobbled cells** instead of a wooden planter holding soil.
>
> **The art pass landed, 2026-08-25, and the material turned out to be where the verb lives.** Soil
> is right for something temporary — dug, planted, harvested, cleared. Cobbles are a floor somebody
> laid and left, which is what "place it once and it stays" looks like. It also fixes the thing that
> made this screen read as a different game: a green board on green ground had no figure and no
> ground, and the terrace gives the meadow the garden's own four tiers — ink, light body, dark
> cells, cream chips. See [05-art-direction.md](05-art-direction.md#the-material-recipe--why-the-garden-looks-finished-and-the-meadow-does-not)
> and the top of [10-decision-log.md](10-decision-log.md).
>
> **Earlier the same day, and superseded in layout only —** You travel into it like the Hollow: five **named
> hive spots** on a bank (Sun Bank fastest, Clover Patch wax, Old Stump capacity, Under the Willow
> rare-skewed, Top of the Rise pollination) so buying a hive asks *where?* rather than *yes?*; a
> **keeper bank** where two creatures stand and speed the hives, doubled for **Bumble**, the only
> creature with `affinity: 'meadow'`; the **Honey Shelf** — one slot per bloom, filled the first time
> that variety is made; bees that only exist because hives do; and a 2% **swarm** that fills every
> hive at once. Its own dock: Collect · Keepers · Shelf · Stores. See
> [03-systems.md](03-systems.md#the-wild-meadow).
>
> **The Shelf is the piece that matters.** It is the clearest answer the project has found to its
> oldest question — **you plant moonflower because the moonflower jar slot is empty**, which is
> desire where an order is a quota.
>
> **The HUD is up in every room as of 2026-08-25** — garden, Hollow, meadow and map. The meadow's
> pollination and jar counts sit below it, and the shelf count is gone from the strip because the
> dock already has a button for it.
>
> **The meadow is the QUIET place, on purpose.** The garden owns the tapping, the combo and the
> noise. Nothing here flashes or counts down and the only motion is drift; two competing tap loops
> would make both worse. Hold that line.
>
> **The keeper bank is the creature-station idea scoped to one place** rather than a map-wide
> rework, and its guardrail is a sim-test: **the hives work with nobody standing on them.**
>
> **Earlier the same day — the hives came home:** the Apiary is a *place* on the map
> and its dock tab is gone. It draws however many hives you actually keep, and bees drift only once
> there is a hive to have come out of. **It is not a locked parcel — it is meadow**, open from the
> first visit, and putting a hive in it is what makes it yours; an empty meadow invites where a
> locked parcel refuses. The dock is now `Upgrades · World · Craft · Shop`, and **the rule for the
> rest of the migration is: a tab leaves when its map home exists, and not before.** Craft keeps its
> slot until the Potting Shed lands.
>
> **Places got a taxonomy, 2026-08-25 (design).** The owner played Cats & Soup and read the right
> lesson: the stations around the soup pot **do not each make their own soup** — they make *the*
> soup worth more. That names a fourth structural type the docs lacked. Every place on the map is
> now exactly one of **producer / transformer / consumer / amplifier**, no two of the same type in a
> row, and there is a three-question not-a-clone test before anything gets built. **The amplifier is
> what turns a row of buildings into a system, and this project already shipped one without naming
> it: pollination.**
>
> **The six places are settled:** Garden (producer) · Potting Shed (transformer, a *building beside
> the garden*, not a bought parcel) · Garden Stand (consumer, built) · Orchard (producer, overnight
> clock — **and the natural home for collect-all**) · Wild Meadow (producer **+ amplifier**) ·
> The Ridge (**the Night Garden**, time-gated — the one hook the game completely lacks, a reason to
> open the app at a different time of day). See
> [25-world-map.md](25-world-map.md#what-a-place-is-allowed-to-be).
>
> **The apiary comes back as a place, and the 2026-08-14 demotion was only half wrong.** What it
> objected to — honey as a second economy beside the first — still stands. What changed is that the
> amplifier type is now named: the hives' output depends on what is planted in the garden and
> pollination lifts every harvest there, which is the opposite of a parallel faucet. The dock tab
> still dies. The Apothecary stays folded into the bench.
>
> **Creatures as labour is agreed and deliberately NOT next.** `setTending(id, on)` is a boolean
> because there was only ever one place to be out in; on a map it becomes `home.at = 'meadow'`, and
> one field makes every place depend on who is stationed there. **Guardrail: a place must work with
> nobody stationed at it** — a creature makes it better, never possible. Held because traits and the
> eight pairs were balanced against one garden.
>
> **The world map is BUILT, 2026-08-25.** Swipe down from the garden and the camera pulls back to a
> world you drag around with a finger: the garden **showing whatever is actually planted in it**,
> the Hollow's burrow, the **Garden Stand on the lane**, and three parcels of land you cannot buy
> yet. Swipe up, or tap a place, to dive in. The game is now **three places on one axis** — map,
> garden, Hollow — with one rule: **down pulls the camera back, up goes in.**
> `overworld.js` draws the scene (knows nothing about the game), `ui-map.js` is the camera. The
> Stand left the dock for the lane, and the fifth dock slot is a single **World** button — travel,
> not a panel — for anyone who has not found the swipe. Apiary and Craft keep their tabs until their
> own map homes exist. See [25-world-map.md](25-world-map.md),
> [08-ui-and-layout.md](08-ui-and-layout.md#the-vertical-ladder) and the top of
> [10-decision-log.md](10-decision-log.md).
>
> **Not built yet, on purpose:** collect-all (gated on automation, and it belongs after the frame
> has been played) and actually buying land (reputation tiers gate it, and the Stand only started
> paying reputation the same day).
>
> **The Garden Stand is BUILT, 2026-08-25.** Simulation and surface both. Three slots, generated
> orders, delivery, free skipping, refill clocks, reputation — and **the first system in this game
> that wants anything**, since everything before it only produced. 27 new sim-test assertions hold
> the two anti-frustration rules as invariants. The surface reuses the creature panel's breakout:
> **the customer stands on the sheet**, and in the queue the face is the biggest thing on the row,
> carrying ready-or-waiting as an *expression* rather than a label. Entry is an **interim dock tab**
> until the map frame exists. See [03-systems.md](03-systems.md#the-garden-stand--orders),
> [07-save-data.md](07-save-data.md) and the top of [10-decision-log.md](10-decision-log.md).
>
> **Three traps came out of it and are in the list below:** a line item that names nothing cannot be
> priced when it is written; `width:auto` on an SVG is 100% of its container, not the viewBox
> aspect; and a tier with fewer customers or goods than slots repeats itself on the board.
>
> **The goods are decided, 2026-08-25 (latest): deep botanical catalog plus cottage crops, no
> barn.** Specified in **[26-goods-catalog.md](26-goods-catalog.md)** — six families, three
> production shapes (order-shapes, producers, merge chains on the bench), the crop list with one
> small wheat patch as the whole grain concession, and the one-line test made structural as a
> `line` field on every good. **The Florist family (bouquets — multi-flower order lines, no
> crafting needed) plus named honeys is the Stand's launch catalog.** Crops never enter the
> flower garden. And **the map goes MVP-first**: phases A+B at spike-level art, dock migration
> deferred, the Stand as the only functional new thing, with the feel rubric and sim-first rule
> in [25-world-map.md](25-world-map.md#the-mvp-decided-2026-08-25--build-plain-test-the-feel-polish-as-we-go).

> **Creatures arrived, and the direction changed, 2026-08-16.** The diagnosis was the owner's: the
> world had a place and a character but **no inhabitants**. So **habitat** was added as a second frame
> beside the production chain — the garden is a place that becomes alive because of what you plant.
> **The chain is not cancelled:** garden → bench → market and the order system are still wanted, and
> the owner was explicit about this on 2026-08-16. What is missing is the right way to fold them in,
> not the appetite for them. Treat the parked Potting Bench and Market as **unsolved, never
> rejected**.
>
> **Six creatures**, each drawn by a different bloom across seed unlock levels 1–10: Pip (Bluebell),
> Bumble (Lavender), Bramble (Rose), Thistle (Marigold), Luna (Moonflower), Ember (Starlit Iris). They
> live on the lawn, react when tapped, and leave **keepsakes** on a slow clock — a named memento each,
> written as a small joke about its creature, and **kept** in `state.mementos` rather than cashed
> straight into currency, so a future craft or display has something real to read. **This is the most direct
> answer the project has found to "why plant this flower":** Pip comes for bluebells and nothing else.
>
> **A creature is raised, not found.** It arrives at one star carrying a fifth of its trait and grows
> to five, and **the duplicate that raises it is the same bloom that attracted it** at an escalating
> count (Pip: 5 / 15 / 45 / 135 / 405). That is also the first real answer to **"why would I ever plant
> a Daisy again"** — a low-tier seed stays worth growing long after its coins stop mattering.
>
> **Only a few tend at once** — habitat slots at levels **1 / 5 / 10 / 16**, toggled in the Almanac's
> *The Habitat* block, and only tending creatures stand in the yard. **Eight named pairs**: two
> specific creatures tending together do a third thing neither does alone, with two deliberate
> "perfect trios" rewarding opposite play patterns. Listed under *Companions*.
>
> **The rule about traits and verbs was retracted the same day.** Traits **may** share an axis with a
> verb — they stack, and stacking is the point of the genre. What the suite actually enforces is that
> every trait declares a `pool`, that the roster is not all one kind of effect, that at most a third
> sits in the `yield` pool, and that **no pair touches `yield` at all**.
>
> Art is original work in the kodama archetype, not a copy — the game ships commercially. See
> [22-creatures.md](22-creatures.md) and the top of [10-decision-log.md](10-decision-log.md). **The
> build before all of this is tagged `v1-bench`**, recoverable with `git checkout v1-bench`.

> **The Hollow opened, 2026-08-16.** A warm room *under* the garden, reached through a **burrow
> mouth** at the bottom left of the stage, where every creature that has moved in actually lives. Its
> own dock — Feed, Pet, Loadout, Decorate — because a per-place dock is also how places stop competing
> for the five slots the garden dock caps at. **Swipe down to go back up**, which is the direction
> every scroll already uses. `hollow.js` draws the room and knows nothing about the game, the same
> contract `flora.js` and `critters.js` follow, so `tools/hollow-spike.html` and the live screen draw
> from one source and the art cannot drift. **Feed and Decorate are honest about not existing.**
> Chambers, sideways paging and a second level are agreed but unbuilt. See
> [22-creatures.md](22-creatures.md).
>
> **Feeding shipped, and creatures now sleep, 2026-08-18.** Three foods bought from **Feed** on the
> Hollow's dock, each running **two clocks** at the time. The clocks merged on 2026-08-20 and the
> **prices went three-currency on 2026-09-03**; the current ladder is:
>
> | Food | Adds | Of which boost | Currency | Cost |
> | --- | --- | --- | --- | --- |
> | Clover Nibble | 4h | 1h | gold | 1,500 |
> | Petal Cake | 8h | 5h | **gems** | 3 *(PROVISIONAL)* |
> | Honeypot | 16h | 13h | **one rewarded ad** | — |
>
> **Awake is upkeep.** A creature whose awake clock runs out is **asleep** — shut eyes, Zs, no
> trait, no pair — and that is deliberately punishing, because it is the retention mechanic.
> **Well fed is a boost on top:** the creature works one star above itself.
>
> **The sleeping face is load-bearing, not decoration.** An upkeep timer is only survivable inside a
> cosy game because a pet that is visibly *asleep* is obviously reversible and says what to do about
> it, where a pet that silently stops working reads as something taken away. If a creature ever
> stops working without looking asleep, this reverts to the version the cosy pillar rejects. It is
> also what makes pairs going quiet acceptable — you can *see* why.
>
> **Punishment on one axis only:** a sleeping creature keeps its home, its slot, its place on
> screen, and **keeps leaving keepsakes**. **A star rather than a flat ×2** for the boost, because
> ×2 doubles the only trait in the `yield` pool (Luna, +9.6% → +19.2% average payout) and doubles
> the gem faucet (Thistle); a star is ×2.00 at one and ×1.20 at five. **Food never advances the star
> a creature was raised to** — that stays the bloom's job. Arrivals and pre-sleeping saves get 24h
> free. ~~**If the upkeep ever reads as a chore, raise `awake` in `data.js`, never the prices.**~~
> **THAT ADVICE IS RETIRED, 2026-09-03.** The owner asked for teeth, so the prices are the pressure
> dial and the hours are the shape; if upkeep ever reads as a chore, drop a price. Read it against
> the sleeping face, which is what keeps an expensive meal survivable.
>
> **Only a *tending* creature can be asleep**, because a resting one cannot be fed — showing a
> player a problem they cannot act on is the one thing an upkeep mechanic must never do. Found by
> driving the new cheats. **Test it with the Developer tools:** *Creature food clocks* — Drain 1h /
> 4h / 24h, Send them to sleep, Feed everyone. 97 assertions.
>
> **Food runs ONE clock, 2026-08-20.** A creature is **well fed** above 3h remaining (works a star
> up), **awake but hungry** above zero, and **asleep** at nothing. Clover 4h, Petal Cake 8h,
> Honeypot 16h. It was two clocks until the panel asked for one bar — and merging them lost nothing,
> because the second was only ever carrying the gap between them. **The threshold is a warning line,
> not a target:** at three quarters up, no single food reaches it from empty and the buff would only
> exist by stacking. One side effect kept on purpose — **an arrival now lands well fed for its first
> 21 hours**, which teaches the buffed state before it lapses. Saves migrate by taking the larger of
> the old pair.
>
> **The creature panel is ordered by what you came to do, 2026-08-20.** Who it is → what it does →
> how grown it is → **Feed and every action with it**. A sleeping creature must never need a scroll
> to reach the food that wakes it. **Re-measured 2026-09-03** (the old 518/579 figures do not
> reproduce): at 375×812 the food row ends at **506px in a 582px body** — 76px of headroom, and the
> three-currency change costs none of it — but the **out-or-rest button ends at 602px, already below
> the fold**, and on a 390×640 screen the food row itself ends at 507px in a 444px body. Both were
> true before that change and are measured against `HEAD`;
> [11-known-issues.md](11-known-issues.md) carries them. **Anything added above the food row makes
> this worse.** One meter now, not two, since the clocks merged.
>
> **THE FOOD LADDER SPANS THREE CURRENCIES, AND THE HONEYPOT IS THE GAME'S FIRST REWARDED
> PLACEMENT, 2026-09-03.** `CREATURE_FOOD` carries `currency: 'credits' | 'gems' | 'ad'`.
> **It is a placement, not an ad system — the web build has no network, no SDK, no fetch, and never
> will** ([37-monetization.md](37-monetization.md), amended in the same commit so it cannot
> contradict a live button). Four rules the placement obeys and one component that enforces them:
> **absent, never disabled, in a player's first session**; **no countdown, ever** (a timed offer is
> PEGI 12); **never sold for a partial grant** — the 24h cap would trim a 16h Honeypot for a creature
> with 12h banked, which is fine for gold and intolerable for thirty seconds of attention, so
> `feedCritter()` refuses and the button says *"too full for all of it"* before it is tapped; and
> **every ad-granted reward is mint-excluded** through `credit(n, { ad: true })`, the third flag
> beside `cheat` and `refund`. **The component is shared and there must never be a second one** —
> `Game.adOffered/watchAd/adImpressions/adCountToday/adCap` and `state.ads` in `game.js`,
> `UI.adTag()` + `UI.AD_LABEL` + the `video` glyph in `ui-sheet.js`, caps in `DATA.ads`. The playbook
> is in [09-conventions.md](09-conventions.md); read it before adding a placement.
>
> **The panel's growth row is bloom → bar → star, 2026-08-20.** No "Growing on X" line: the real
> bloom is drawn in a token on the left (`Flora.head()`), the count sits *inside* the bar, and the
> star being climbed toward is on the right. **The owner's standing note is that more iconography
> beats more sentences everywhere in this game** — this row is the worked example. The breakout art
> is hidden by CSS whenever the sheet lacks `.open`, because it rides the sheet's transform and a
> closed sheet left a creature's head sitting over the dock.
>
> **Gestures, one-tap pets, and a panel that stands the creature on it, 2026-08-20.**
> **Swipe up in the garden to go down to the Hollow**, swipe down to come back. The swipe only
> starts on the *background* — plots and the flower act on `pointerdown` and would fire on the way
> out, and making them wait for `pointerup` would cost the tap latency the core loop is built on.
> **Tapping a creature in the garden collects, or opens its panel if there is nothing to collect**,
> so feeding never needs a trip downstairs. And the creature's art now **breaks out above the top of
> the sheet**, with the growth bar promoted to the biggest thing on the screen and every fact in its
> own chip. The palette stays paper and botanical on purpose.
>
> **A tap opens the whole creature, and only creatures that are out leave keepsakes, 2026-08-20.**
> Tapping a pet in the Hollow opens **its own sheet** — trait, awake and fed state, growth, keepsake
> status, out-or-rest, the three foods, a Pet button and its pairs. Modes were a workaround for one
> tap target and several verbs. **Loadout mode survives as a fast path** for swapping several in a
> row, and **the dock is still there on purpose** so the question "does Feed or Pet still have a job"
> can be answered by looking rather than by argument.
>
> **Collecting happens in the garden, not the Hollow** — they live down there, they work up here.
> And **only a tending creature earns a keepsake**: a rester banks what it had and stops earning,
> getting it all back when it comes out. Since a decoration costs keepsakes from *two different
> creatures*, this is what makes the roster worth rotating. A **sleeping** creature is still out, so
> it still earns — sleep costs the trait, not the mementos.
>
> **Two things a real phone found, 2026-08-18.** The sleeping **Zs** are now solid white with **no
> outline**, smaller and slower, drifting in a zigzag with no scaling — outlined they read as hard
> graphic shapes stuck to a creature's head. That is a **deliberate exception** to the house
> outline rule, because a Z is a wisp rather than a thing in the world. And the **installed PWA**
> ended short of the home indicator; `.game` now carries `height: 100dvh` and the page background is
> meadow green rather than sky blue. See the traps below.
>
> **What the phone found stayed found, 2026-08-19.** The PWA still ended short of the home
> indicator — `height: 100dvh` was a guess about what `dvh` measures in standalone and it was wrong.
> `.game` now sizes off **`--app-h`, written from `window.innerHeight`** by `sizeViewport()`. More
> useful than the fix: **safe-area insets moved to four `:root` variables** so the notched layout can
> finally be simulated in the preview, because `env()` reads `0` on a desktop and that is why this
> shipped twice. The dock also stops `max(10px, --sab - 12px)` short of the bottom rather than the
> whole inset, which was leaving a band of dead lawn under the buttons. And the **three bench quests
> are paused** — they were being handed out for a merge board with no UI, jamming the strip exactly
> as the retired sell quests once did. Three live stand-ins hold the ladder at 777. See the traps
> below.
>
> **The line at the bottom of the screen was a shadow, 2026-08-20.** The owner's phone still showed a hard
> green line across the bottom with the dock floating above it, and the failure was reproduced in
> the preview by forcing `.game` short — it looks exactly like the photograph. The mechanism was
> never in doubt; **why WebKit sizes the box short still is.** So this pass stops guessing and makes
> the layout survive being wrong: the **shake transform moved off `.game` onto a new `#world`
> wrapper** (a transformed fixed box is the one thing both failed attempts had in common),
> **`--app-h` became a `min-height` floor rather than the height** (so a bad measurement can only
> fail to help, where before it overrode a browser that may have been right), **`sizeViewport()`
> maxes three signals** instead of trusting `innerHeight` alone, and **the vignette fades out before
> the lawn does** — which is what turned a shortfall into a *cut*, since the page behind the game
> was already the same green.
>
> **And then the pixels were actually measured, which is what should have happened three rounds
> ago.** With the height work in place a short box *still* showed a join, so the screenshot was
> decoded: the lawn's last pixels were darker than the page's, ramping toward the edge. It was the
> **closed bottom sheet's `box-shadow`**, parked just below the game's bottom edge and throwing a
> 30px blur back up into the lawn for `.game` to clip square. It only casts a shadow when open now.
> The page background also went **flat** — its mown stripes could never line up with the meadow's,
> so the meadow fades its own out over the last 44px instead. A game forced 80px short is now
> **pixel-identical** either side of the join. And **Developer tools has a screen report** —
> `screen`, `window`, `clientHeight`, the game box, `--app-h`, both insets, display mode — because
> `env()` is `0` on a desktop and every round of this bug so far was diagnosed off a photograph.
> See the traps below.
>
> **And the height half of it was wrong, 2026-08-20 (later).** Stretching `.game` to `screen.height`
> shipped, and on a real iPhone it pushed the **dock out of the window** where it could not be
> tapped. The window an installed iOS app gets is genuinely shorter than the screen; iOS paints the
> strip below it; `innerHeight` was telling the truth through all three rounds of this. `--app-h` is
> back to the window alone. **Never stretch the game past the window** — a band of lawn under the
> dock is a blemish, a dock nobody can tap is a dead app. What fixes the *look* is the seam work
> above, which stands: flat green both sides of the join and nothing casting a dark edge along it.
>
> **And then the phone was finally asked, 2026-08-20 (last).** The screen report added an hour
> earlier said: `screen 402×874 · window 402×812 · insets 62 / 34`. The window is short by
> **exactly the top inset** — this was never a browser lying about its height, it was
> **`apple-mobile-web-app-status-bar-style: black-translucent`**, which sizes an installed app's
> window to the screen minus the status bar and pins it to the top. The game got to draw under the
> clock and lost the bottom of the screen for it. It is now **`default`**: the window sits below the
> status bar and reaches the bottom, the dock lands over the home-indicator margin, and the sheet
> reaches the bottom edge. The strip along the top takes `theme-color`, which `updateSky()` now
> keeps on the current sky so it is not noon blue at midnight. **Four rounds of layout work went at
> this from inside the page and none of them could have worked**; the fix that mattered was making
> the app report its own numbers. `--page-fill` (the page background following the bottom of the
> screen — lawn, or the sheet's paper) stays as the safety net.
>
> **The loadout is now chosen in the room, 2026-08-18.** Pet and Loadout are **modes** on the
> Hollow's dock and a tap on a creature spends whichever is armed — sending it out or letting it
> rest, rather than opening the Almanac to do it. The Almanac's Habitat block keeps its toggles,
> because it is the only place an *unmet* creature can live. Nothing was added to the save. The
> change exposed a real bug: **a celebration centred on a hidden element fires from the top-left
> corner**, because `.in-hollow` hides `.stage` and `#garden` then measures 0×0. Fixed for the
> `pair` and `critter` handlers; the rule is in the traps below.

> **The Potting Bench landed as simulation, 2026-08-16.** A merge board fed by the garden, and
> **it is what replaces the Apothecary** — both turn garden output into goods the Market will want,
> and a timed craft bench is the worse version of merging. A harvest drops a chain item into a
> **basket**, the player places it, and **three of a kind that end up orthogonally connected merge**
> into the rung above. Six rungs, Petal through Flower Crown. **No surface exists yet** — Craft is
> still the third dock tab and the bench fills its basket invisibly. The panel and the dock swap were
> split off because `tools/sim-test.js` cannot see a `ui-*` file and landing both blind into a live
> game is how a working build breaks — and then the habitat direction overtook it, so **the bench is
> parked and undecided rather than in flight**. Feel was settled first in a standalone spike
> at `tools/merge-spike.html`, which is still the fastest way to try it. See
> [21-potting-bench.md](21-potting-bench.md).

> **`ui.js` was split, 2026-08-16.** 2,309 lines became five files along the three seams the docs
> had named for months: `ui-shared.js` (the scope they share), `ui-scenery.js`, `ui-sheet.js`,
> `ui-events.js`, and a ~700-line `ui.js` keeping the garden, the flower, the HUD, input, the frame
> loop and `boot()`. **The shared scope is passed as one global, `UI`**, and a call that crosses a
> file boundary is written `UI.something()` — the prefix is how you count one file's reach into
> another. **Pure motion**: no behaviour changed, and the one bug spotted on the way went into
> [11-known-issues.md](11-known-issues.md) instead of the diff. See
> [02-architecture.md](02-architecture.md#the-shared-ui-surface).

> **Packs now turn up in the garden, 2026-08-15.** A fourth tap roll drops a card pack onto a plot,
> where it waits to be tapped — the Lucky Ladybug beat, but tappable. **Always on with no badge
> behind it**, because it is the album's only in-game source. The garden is where packs turn up,
> never what decides their contents.

> **The card album shipped 2026-08-15.** 12 sets of 9 = 108 cards in one season, packs of three,
> and the reveal. **Independent of the garden by design** — no card is earned by growing anything.
> **Card art is a slot**: `{ icon, tint }` draws a placeholder from the icon vocabulary, `{ src }`
> would carry a real illustration, so finished art can arrive without touching code and without
> breaking the no-binary-assets rule. Remaining: the spawning-pack proc, dust, seasons, completion
> rewards. See [19-card-album.md](19-card-album.md).

> **Gems got a faucet fix and real sinks, 2026-08-15.** Drop chance now derives from grow time, so
> gems/hour is flat across the ladder and Daisy-spamming is no longer the best gem farm. Gems buy
> **calling a sky** (Rain 8, Thunderstorm 25 — which also pulls every unspent mutation roll into the
> window) and **skipping a timer** (`ceil(remaining/30)` gems, shown on the plant). The standing
> rule: **gems buy chances, choices and looks, never outcomes**, with the timer skip as the one
> deliberate exception. **Aurora and Wonderfall have no price and must not get one.** See
> [03-systems.md](03-systems.md#gems-where-they-come-from-and-what-they-buy).

> **Offline earnings shipped 2026-08-15.** Two upgradeable axes — Moonlight Tending (rate, 25% base)
> and Lantern Oil (duration, 4h base) — with a 10% trickle past the cap rather than a wall. Income is
> **earned, not granted**: only plots with an auto-planter count, and only if the drone exists to
> pick them, so an unautomated garden still earns nothing. **The cap is the retention lever** — 12h
> banks ~644K, 24h ~805K, so doubling an absence adds a quarter. If offline feels stingy, raise the
> rate, not the cap. `Dev.simulateAway(3/6/12/24)` winds the world back to test it. See
> [03-systems.md](03-systems.md#offline-earnings).

> **The welcome-back scene shipped 2026-08-15.** `Game.reconcile()` reports time away, what
> ripened, which weather passed and what it changed, and honey waiting — as an account, never a
> total. It stays shut when there is nothing to say. **Note:** the reconciliation bug once logged in
> [11-known-issues.md](11-known-issues.md) did not exist — mutations always resolved against the sky
> at their own scheduled moment. See [03-systems.md](03-systems.md#coming-back-after-time-away).
> **Automation still does not run while away**; the two-axis offline earnings chain is the next
> piece, and this scene is the surface it reports into.

> **Nightbell shipped 2026-08-15.** Moonflower pays ×2 harvested at night and ×0.5 by day — the
> verb that was cut from the first pass for want of a real clock, now a twenty-line change. Near
> neutral on average by design (≈0.98): it makes *when you pick it* the decision, not *how much it
> pays*. Deeproot moved to Jade Fern. Seventh effect category, rule intact.

> **Day cycle and dev tools, 2026-08-15.** The day cycle now keys to **epoch time**, so `isNight()`
> is a shared fact the simulation can answer and the **night-blooming verb is unblocked**. A
> development panel sits behind an unlabelled hit area beside the gem wallet — weather holds, forced
> mutations, armed rarities and gem drops, forced tap procs, fill/ripen, and grants. **Every cheat
> forces the real code path rather than faking the effect**, so the animation you inspect is the one
> players get. See [03-systems.md](03-systems.md#development-tools).

> **Weather and mutations shipped 2026-08-15.** The sky runs on wall-clock epoch time — the same
> weather for everyone at the same moment, and any past slot computable. Every plant rolls once for a
> mutation mid-growth: Dewkissed ×2, Gilded ×10, Prismatic ×25, Wonderstruck ×100, visible from the
> moment it lands until harvest. An adjacent Beacon raises the catch chance. Measured at **~20% of
> income, evenly across every seed** — the spec's original per-slot exposure model produced a 65×
> spread and was cut after the sim-test caught it. Mechanic in
> [03-systems.md](03-systems.md#weather-and-mutations), design and the retraction in
> [18-mutations-and-weather.md](18-mutations-and-weather.md).

> **Verbs shipped 2026-08-14.** Six of the nineteen seeds now do something to their two neighbours
> — Keeper (growth), Nurse (yield, at a cost to itself), Beacon (rarity), Lantern (gems), Deeproot
> (density), Spreader (free propagation). This is the first step of the build order below and the
> first real answer to "why plant *this* flower". Mechanic in
> [03-systems.md](03-systems.md#verbs-and-adjacency), numbers in
> [04-economy.md](04-economy.md#verb-tuning), playbook in [09-conventions.md](09-conventions.md).
> **Verbs stay off the yield curve** — `yield === cost × 1.4` still holds for every seed and a
> sim-test asserts it. **No two verbs may share an effect category**, also asserted.

> **A strategy pass on 2026-08-14 changed the direction of several systems.** Read
> [17-market-and-positioning.md](17-market-and-positioning.md) and the top entry in
> [10-decision-log.md](10-decision-log.md) before planning work. In short: the Apiary and Apothecary
> are being folded into garden adjacency and losing their dock tabs; the Almanac becomes themed card
> sets and is promoted to the spine of the game; per-plant verbs with adjacency effects — not the
> Market — are the answer to "why plant *this* flower"; and the repo was renamed
> `ghostgarden` → `gardenwonder`. Several decisions previously marked as locked were overturned
> deliberately, on the owner's instruction that nothing in this folder is set in stone.

The first slice of the meta-layer is also playable: **hives producing honey whose variety
follows what is planted, and an apothecary crafting flowers and honey into goods**. It lives behind
two dock tabs (Apiary, Craft), a deliberate throwaway until the world map exists.

**Navigation phase 1 is done**: the dock is `Upgrades · Apiary · Craft · Shop`. Badges was
renamed Upgrades; Decor lost its stat bonuses, became cosmetic, and moved into Shop with existing
owners refunded; Boosts left the dock entirely for a tap-to-activate tray in the status rail. Full
detail in [15-navigation-and-ia.md](15-navigation-and-ia.md).

**Progression phases 1–5 are done**: a quest strip sits between the HUD and the rail, reputation is
the only level track, seeds unlock on the bar, extra plots become buyable at levels 3 / 6 / 9
/ 12, tickets are gone — boosts are earned inventory activated from the rail — the combo
multiplies tap payout, and the Almanac is a collection track with lifetime discovery, best
rarity, and milestones at 5 / 10 / 15 / 19 species, and **every seed carries an endless Bloom Mastery ladder**
on its Almanac row paying +5% to that seed's yield per tier. Full detail in
[16-progression-and-quests.md](16-progression-and-quests.md). The world map is still queued. A
playtest pass after phase 1 made the bar track the quest and the pip ring track reputation,
replaced generic upgrade quests with buy-then-feel pairs (Combo Coil stays, so the later
multiplier work is not undone), and gated the empty-plot bob to first-plant onboarding.

**Since then, the last two sessions went into the core tap-and-plant loop instead of phase 2** (see
the decision log for why that's deliberate, not drift):

- **Hold-to-tap**, with a Quick Grip badge that shortens the hold's repeat interval from 900ms down
  to a 180ms floor. Purely an input convenience — every roll (crit, gem, the three procs below) runs
  through the same `tapFlower()` as a manual tap, and the floor exists so holding can never out-earn
  active tapping.
- **A "Balanced" seed-sort option** in the plant picker, alongside cheapest/priciest — sorts by
  distance from `credits ÷ unlocked plot count`, i.e. "what's the right tier across my whole garden,"
  not just for one plot.
- **Three tap-triggered "garden proc" badges** — Rain Dance, Bee Swarm, Lucky Ladybug — each an
  independent, slot-machine-style roll on every tap. Sprinklers (`autoWater`) was recapped and
  repriced alongside them. One day after shipping, all three trigger rates were cut 5× (to
  `0.2%/level`) because they fired too often to feel rare, and each got a dedicated animation so the
  rarer trigger still reads as a clear, celebratory event. Full detail in
  [03-systems.md](03-systems.md#tap-triggered-garden-procs) and the two decision-log entries dated
  2026-08-05/06.
- A **"Grant 1,000,000 Gold" cheat button**, for testing high-currency states quickly.

Fully documented in this folder. Start with [README.md](README.md), then
[02-architecture.md](02-architecture.md) and [09-conventions.md](09-conventions.md).

The current build is a **prototype and design reference**, not the shipping product.

## Who is doing what

| Person | Role |
| --- | --- |
| Owner | Design and web prototyping. Not the implementer. |
| Engineers | Two, porting to Unity for iOS and Android. |
| Agent | Design advisor, prototype implementation, documentation. |

The web build is the **design lab** — cheap and fast to test ideas. Unity is the **shipping
product**. Keep them in that relationship; don't gold-plate the web build.

**The engineers read `docs/` as a wiki, not as a clone.** `tools/wiki-sync.js` mirrors this folder
to <https://github.com/Deep-Forest-Labs/GardenofWonder/wiki>, so run it after any docs change — it
is step 5 in [README.md](README.md). Treat the wiki as read-only: every run overwrites it wholesale,
and an edit made there is gone at the next sync with nothing recording it. `docs/` is the source of
truth; the wiki is a window onto it. Why, and what was rejected: the 2026-08-31 wiki-mirror entry in
[10-decision-log.md](10-decision-log.md).

## Decisions already made

Don't relitigate these without a reason.

**Goal is modest revenue in execution, but do not cap the ceiling.** A few thousand a month is the
near-term target and still drives scope and monetization tone. **Revised 2026-08-14:** the owner's
instruction is that the *vision* should not be small enough to hurt later — "I don't want our vision
of the project to be too small that it hurts us in the end." So ship incrementally, but keep every
number in data and remote-config-ready, and keep the economy prestige-compatible before a prestige
layer exists. Push back on scope creep in execution, not in architecture. For what "a few thousand a
month" means in players, see
[17-market-and-positioning.md](17-market-and-positioning.md#numbers-to-plan-against) — roughly
2,000–3,000 sustained DAU.

**The meta-layer shrank, 2026-08-14.** [12-meta-layer-design.md](12-meta-layer-design.md) still
describes the map and the order system, but **the Apiary and Apothecary are no longer regions** —
they fold into garden adjacency. Five regions is now three at most. The Market and the map survive.

**One new mechanic only — merge, in the Potting Shed.** Everything else is timer-and-tap with
distinct art until the structure proves it retains. This is the main defence against scope collapse.
Merge replaced an earlier match-3 plan because match-3's hand-designed level treadmill is
unsustainable for two people.

**The world stays cozy and botanical.** Bees instead of chickens, a nursery instead of a mine.
Tonal coherence is the cheapest competitive advantage available and the easiest to squander.

**Unity port starts with the platform shell**, not the garden. Store setup, IAP, ad mediation,
analytics, remote config, cloud save.

**Every number must live in data, not code**, wired to remote config. Highest-value technical
constraint on the port.

**Navigation follows "places on the map, systems in the dock"**, specified in
[15-navigation-and-ia.md](15-navigation-and-ia.md). Regions are locations you travel to, not tabs.
The Apiary and Craft tabs are a prototype shortcut and are **now scheduled for removal** with the
adjacency rework — the interim dock is `Garden · Cards · Market · Shop` (phase 1.5 in that doc).

**Nothing in `docs/` is set in stone.** Stated by the owner 2026-08-14: anything in the game could be
done better, and a decision recorded here is a decision that was right at the time, not a
constraint. The strategy pass overturned several previously locked items. Continue to record
reasoning — but do not treat this file as a fence.

**Economy is currently a frozen port** from *Idle Garden Reborn* and contains known problems — see
below.

## Two things to know before touching the economy

**The retune is no longer deferred — it is specified.** The owner unblocked it 2026-08-26 ("the
economy is already broken") and it now lives in [33-year-one-economy.md](33-year-one-economy.md),
shipping inside the Garden Year's slice A. The consuming system the deferral was waiting for is
the prestige loop itself, and it was designed first. Every number in the current build remains a
placeholder until slice A lands.

**The level-curve dependency this section always warned about is resolved by design, not dodged:**
levels 2–17 paid out one seed each, and [33-year-one-economy.md](33-year-one-economy.md) retires
seed level-gates in favour of one-time gold unlock prices — so the ladder's freed rewards are
re-authored (levels 18–40 sketched in 33), and four year-one quests that name walled seeds get
re-keyed in the same slice. Scope held as one piece, as promised.

## The current task

**THE RECORD SHELF IS AT GATE 1 AND STOPPED FOR THE OWNER.** The spec is
[49-the-record-shelf.md](49-the-record-shelf.md); the spike is live at
**https://deep-forest-labs.github.io/GardenofWonder/tools/records-spike.html** and the reasoning
for every call in it is the 2026-09-02 (records, gate 1) entry at the top of
[10-decision-log.md](10-decision-log.md). **Nothing in the game changed** — the spike loads no game
file. Read that entry before touching any of this; it is where the nine things the spec is wrong
about are written down.

- **The owner is asked for two things and offered the rest.** Required: a ruling on the blocker
  (section 9.1) and a verdict on the four veto points (section 8) — "keep all four" is a complete
  answer, and the desk recommends changing the fourth. Everything else in the spike carries a
  recommendation the build takes on its own if the owner would rather not spend the attention.
- **THE BLOCKER: Holly's Record cannot be granted by the owed sweep as the spec writes it.**
  Nothing in the save remembers that a Winter night was ever kept — `cell.kept` is destroyed by
  both collect paths (`game.js:4368`, `game.js:4399`) and `tuckedAt` is zeroed at first light.
  Four of the five records sweep fine; Holly's has nothing to read. Three options are drawn; the
  desk recommends a durable latch from this build forward, grandfathering nobody.
- **Three things the spec says about the code that are not true, and each changes the build.**
  `winterDeriveKept` lives in `game.js:4227`, not `winter.js` (a pure art module), and `load()`
  never calls it — `reconcile()` does. Its marking line is an **edge**, so the hook there must
  write a latch and never a grant. And the owed sweep must NOT hang off `refreshReveals()`, which
  runs at 1 Hz from `tryMoment()` and again on `reset()`'s birth path.
- **Punch-list #23 HAS now run (2026-09-03), and this is the scheduler to rebase on.** `audio.js`
  gained a page-lifecycle pair, `Sound.pause()` / `Sound.resume()`, wired from a third
  `visibilitychange` listener in `ui.js` — page lifecycle is the UI layer's, so audio.js keeps its
  knows-nothing-about-the-game contract. Every recurring scheduler additionally carries its own
  `if (ctx.state !== 'running') return;` guard, and **the test is never `=== 'suspended'`** because
  iOS reports `interrupted`. A bed's recurring voices are now declared as a `pulses: [{ms, fn}]`
  list on its record instead of scheduled inside its builder, so a pause stops them without tearing
  down the drones and the noise loop; `timers` on that record now means one-shots only. A pause
  preserves `bar`, the live beds and every pref. The record element joins `pause()`/`resume()`
  rather than adding a fourth listener — doc 49's API contract says so now.
- **Name collisions, all handled, none needing a ruling.** `shelf` is the Honey Shelf's namespace
  (`renderShelf`, four `Game.shelf*`, the `shelf` sheet mode, six `.shelf-*` classes) — the panel is
  `records` in code and `.rec-*` in CSS. The rarity id is **`legend`**, never `legendary`. The
  Almanac already has a block headed "Records"; it becomes "Your totals" in the build commit.
- **`art/exports/icons/` is already one icon stale** before this build — `mysteryBloom` was added by
  the curtain pass and `node tools/export-icons.js` was never re-run. The `vinyl` run will write two
  files and take the manifest 54 → 56. That is correct, not churn.
- **Doc 32's glossary row for records is false** and is the highest-priority doc fix in the pass: it
  says *"never bought with money,"* which the owner's pillar ruling overruled the same evening. The
  music session flagged it and left it to this desk. Seven separate statements that this game has no
  audio files also go false when the first track lands; only one of the seven is on doc 49's list.
- **Coordination.** The music-direction session was committing into **this same checkout** while
  this was written — doc 48, `tools/wiki-sync.js` and its own decision-log entry sat uncommitted in
  the working tree as the spike was pushed, and landed as `1eb89f6` immediately after. So
  [48-music-direction.md](48-music-direction.md) is now tracked and safe to link, and doc 49's audio
  numbers now defer to it: AAC in an `.m4a`, 60–90 s loops in whole bars, −17 LUFS, a ledger row per
  track. That changes gate 3, not the spike. `git fetch` and re-read the top of the decision log
  before gate 2 — this tree takes commits mid-session most days.

| Gate | State |
| --- | --- |
| 1 · The wireframe spike, then stop | **Stopped, waiting on the owner.** Eighteen frames; one blocker, four veto points, one design question |
| 2 · Engine | Not started. Five save keys, the owed sweep, `charmEffect`'s whitelist, the gramophone's memento decrement — the live game unchanged |
| 3 · The audio machine | Not started, but **the `visibilitychange` resume is now built** by punch-list #23 and the element joins `Sound.pause()`/`Sound.resume()`. Still to do: the `sw.js` exemption, one media element, mute-pauses-the-element — verified on the handset **before** the surface ships |
| 4 · The surface | Not started. `openSheet('records')`, the two doors, the vinyl icon exported, the capture scenes edited and the gallery re-run whole |
| 5 · The gauntlet | Not started |

---

**THE CURTAIN AND THE DRIP IS BUILT, PUSHED, AND LIVE — all four gates are closed.** The spec is
[47-the-curtain-and-the-drip.md](47-the-curtain-and-the-drip.md). The reasoning for every call made
along the way is three same-day decision-log entries, newest first: (gauntlet) — the gate-4 findings
and the owner's live playtest, fixed in one round; (build) — the owner's four rulings on the gate-1
spike; (ruling) — the original spec decisions. Read all three in
[10-decision-log.md](10-decision-log.md) before touching any of this.

- **What shipped.** The picker's three bands with the sort-sink rule; the Almanac's masked row
  keyed to the same latch as the picker, never to `discoveredOf`; the shop's opening four cards
  with the rest revealing on lifetime gold alone; a numbered UPGRADE-pill dot (`.dock-dot.wide`,
  the same convention every other dock badge uses); the moments dialog as a third `#news` mode with
  its three-tier art chain; the per-Turn reveal cap (owner-ruled, mid-build); Land Deed pulled from
  the shop entirely (owner-ruled — it duplicated the in-garden plot-tap unlock at a second,
  confusing price). **Not one economy number moved** — Land Deed's own price is untouched in the
  data, it simply no longer renders. Confirmed independently again by gate 4's economy-scope critic.
- **Gate 4 closed 3 of 5 clean** (economy scope, reduced motion) and found six real things across
  visual and grammar — worst was the masked seed row silently inheriting a generic `[disabled]`
  grayscale filter that re-washed the "fully opaque" surface the Almanac's masked row already got
  right. All six fixed and re-verified live; full writeup in the (gauntlet) decision-log entry.
- **The owner playtested live and found, independently, the same bug the grammar critic found
  before the report had even landed** — the upgrade reveal's tagline ("In the shop now.") was both
  tone-wrong (doc 47: "the popup sells nothing," twice) and factually wrong (it's the upgrades
  sheet, never the shop). Fixed alongside two more asks from that same message: the gold-cost
  bullet is gone from upgrade reveals, and the remaining description line now shows the upgrade's
  own icon — already defined per-upgrade in `data.js`, already worn on its shop card — instead of
  the shared green bullet dot every other `.news-list` line uses. No new art was drawn; the fix was
  showing art that already existed in a second place.
- **Two bugs no headless test could have caught, found only by driving the real game in a
  browser**, both fixed and both worth knowing before touching this code again: a padlock belongs
  in `.seed-lock`, never `.seed-go` (an existing scan in `tools/sim-test.js` catches this now, but
  the first draft of the masked row got it wrong); and `el` (ui.js's own module-local element
  cache) is not part of the shared `UI` surface the way `$`/`S`/`fmt` are — reach for the coach
  through `$('#coach')` instead, the way `sayText()` already does.
- **`tools/capture-screens.js` needed two real fixes**, not just three updated scenes. The three
  curtain-adjacent scenes (`plant-picker`, `upgrades`, `almanac`) moved from `Game.Dev.grantGold()`
  to `Game.Dev.driveYear()` — a cheat gold grant never reaches `lifetimeCoins`, so under the
  curtain it only ever proves the affordability arm and leaves everything else masked, which is
  not what a real year of play looks like. And the moments dialog itself leaked through onto the
  **`welcome-back`** scene on the first attempt: suppressing it by overriding the exported
  `UI.tryMoment` from outside was not enough, because `dismiss()`'s own queue-drain calls the
  *private* `tryMoment` binding directly. The working fix is a `window.__noMoments` flag checked
  **inside** `momentsQuiet()` itself, so every path in — internal or external — sees the same
  answer. Regenerated clean afterward; `docs/44-screens.md` is current.
- **Not done, on purpose.** The owner's broader "start sprucing up these screens to feel more
  gaming" is a real direction, not a scoped task this pass took on. It should be its own pass, not
  a rider on this one.
- **Coordination, unchanged from gate 1.** Winter's gauntlet still has not had a clean round (see
  below, "What is still open, honestly") and punch-list fix-round #15 (season-tab retirement) is
  still queued against `ui.js` — this pass's own `ui.js` edits (the UPGRADE pill's dot, the
  once-a-second moments poll) did not touch `renderSeasonEdges()` or anything #15 owns, but
  `git fetch` and re-read the top of the decision log before editing that file next. This tree
  takes commits mid-session most days.

| Gate | State |
| --- | --- |
| 1 · The wireframe spike, then stop | **Closed.** Owner's verdict: build the spike's recommendations verbatim, plus four rulings of his own (Land Deed out, M1 art for everything, a numbered dot, the per-Turn cap) |
| 2 · Engine | **Closed.** `node tools/sim-test.js`: 1,744 assertions, every guard sabotaged and restored |
| 3 · The surface | **Closed.** Verified live in the browser, not only headlessly |
| 4 · The gauntlet | **Closed.** Five independent critics — 3 clean, 2 with real findings — all six fixed and re-verified live. See the (gauntlet) decision-log entry |

---

**SLICE C — WINTER, THE NIGHT SHIFT — IS PLAYABLE ON `main`.** The spec is
[46-the-night-shift.md](46-the-night-shift.md); read it twice before touching anything here.

### The five-minute check — Winter, on the phone

Every step below was walked in a headless browser before it was written down, and two of them are
not what you would guess.

1. **Developer tools → Jump ahead → +1 Turn, twice.** Two, not three — and this is the step that
   surprises. *Jump ahead* calls `turnYear()` directly, so it skips the ceremony, and **the Winter
   gate card lives in the ceremony's fifth beat.** Jumping straight to Turn 3 opens the season and
   you never see Holly introduced.
2. **Take the third Turn yourself**, from the dock. Walk all four beats: turn the year, bless a
   flower, watch the Tally count, and on the last beat the Summer flower says *"A whole new year —
   and somewhere cold to put it. Be nice to her"* over a card carrying **Holly's face** and *"Winter
   is open · past Fall, on the right"*. **That is beat one of her introduction.**
3. **Swipe left twice** — past Fall, into Winter. Holly is in the middle cell and she says four
   lines, about three seconds apart. **Watch that they all arrive**: the one-shot is spent only
   after the last one has drawn, which is the meadow-signpost lesson applied. Leave halfway and come
   back and she starts over; let her finish and she never says them again.
4. **Tap an empty plot, plant Snowdrops.** Note there is no button under the board while the bed is
   empty — the chip carries the rule instead.
5. **Tuck the bed in.** Quilts settle, the plants sleep, the chip goes drained and reads *"Tucked in
   — first up in 12h"*, and the button becomes *"Tucked in / goodnight"*. Nothing is at stake: no
   frost, no wilt, nothing lost to a night, ever.
6. **Developer tools → Winter → Sleep a whole night.** This winds the plant clocks past their grow
   AND the tuck back further, then lets the real derivation write the marks — a cheat that set
   `kept` by hand would show you a morning the engine would never produce.
7. **Back in Winter:** every kept bloom wears a gold ring *and* a frost halo, the chip counts them,
   and the one button is gold and says what the night is worth. Collect it and Holly takes the
   credit.
8. **Once more with Reduced Motion on.** Every state must still read — the frost rim, the quilts and
   the Zs are all base style, and only the glint and the drift go away.
9. **Developer tools → Simulate an absence → 24h**, with a tucked bed and an empty Summer garden.
   The welcome-back scene must appear on Winter's news alone: *"Winter opened 8 blooms overnight
   under the quilt — the snowfall pays +50% on those. Holly kept watch."*
10. **Swipe back to Summer and to Fall** and confirm nothing else moved — and that Fall's flower now
    speaks, which it has not done since Fall shipped.



| Gate | State |
| --- | --- |
| 1 · Two spikes, then stop | **Closed.** Both live. The owner spent the gate on play rather than reading — *"go with your recommendation on everything"* — so every question was ruled by the builder and argued in the 2026-09-01 gate-1 decision-log entry |
| 2 · Annotations build verbatim | **Closed with gate 1** |
| 3 · Engine as pure simulation | **Shipped.** 1,642 assertions, every guard sabotaged |
| 4 · The surface | **Shipped.** Board, chip, the one button, Holly, the picker, the gate card, the welcome-back line, the avatar picker |
| 5 · The gauntlet | **Three rounds run, findings fixed, NOT re-run clean.** Eight critics; the four that mattered were things no green suite would catch — Holly failing her own silhouette gate, the sleeping face being unreachable code, a power-up spent in Winter buying nothing, and her intro spent behind the plant picker. Everything found is fixed and the suite is green. **A third round has not been run against the result** |

**Four things about this slice that are not obvious from the diff.**

1. **`kept` is derived from timestamps and then persisted, and that is the season.** Winter ripens
   with the app shut, so no code runs when a plant opens; the mark is a comparison of the computed
   ripen instant against the recorded tuck window. Tucking after a plant has opened earns nothing,
   and an earned mark is never voided by anything.
2. **`winterHarvestAll()` is NOT a `fallHarvestAll()` mirror.** It takes every ripe plant and pays
   the snowfall on the **kept subset only** — Fall's marks and Fall's collection are the same set,
   Winter's are not. The mixed bed is a named test because the all-kept morning hides it.
3. **"Fall's flower cannot speak" was two bugs.** The node (moved, per season) and `sayText()`'s
   coach test, which refused every line in a season room because the coach is `display:none`'d there
   while `hidden` stays false. Fall's `windfall` line has now drawn for the first time since Fall
   shipped. `say()` also gained a room gate, or the Summer flower's lines come out of Holly's mouth.
4. **The play model is one file now** — `tools/play-model.js`, shared by `year-sim` and
   `order-gold`, seeded, on a fixed epoch. See below; it found two real things on its first run.

**THE ONE ECONOMY DECISION WAITING ON THE OWNER.** `node tools/year-sim.js 14 winter` **exits 1**.
Guardrail one FAILS: a single full kept night of eight Camellia grosses **2,688,000**, which clears
`minCoins` twenty-six times over and mints **18.3 Saved Seeds against a gate of 10**, at every Turn
from 3 to 6. Verified by driving the real engine — `Game.turnReady()` goes false → true on that one
collect with nothing else played. **Only Camellia breaches**; Witch Hazel and below are clear.

**The dial points the opposite way to intuition.** A night may gross at most **1,459,149** at this
model's poorest Turn-3-to-6 lifetime, which is a top rung costing at most **86,854** against 160,000
today. Gross is `plots × cost × 1.4 × 1.5`, so it rises WITH cost — making Camellia dearer makes it
worse. The dials are the top rung's cost coming down, `DATA.winter.snowfall` coming down, or
`DATA.year.minSeeds` going up (outside this slice). All three are the owner's, and doc 46 says every
number in `DATA.winter` is provisional.

*This was reported as "passes by 7.5%" until 2026-09-02 and that was wrong: the guardrail was priced
from NET, and no Turn gate reads net — the mint reads earnings, never balance.*

**What is still open, honestly.**

1. **Gate 5 has not had a clean round.** Three rounds ran — eight critics, then their verifiers —
   every finding is fixed and the suite is green at 1,642, but the critics have not been re-run
   against the result. That is the next thing anyone picking this up should do. Worth knowing what
   the rounds actually caught, because it says where to point the next one: **the suite was green
   throughout**, and the worst findings were a character failing her own silhouette gate, a sleeping
   face that was unreachable code, a power-up spent for nothing, an intro spent behind a sheet, an
   intro spent 2.9 seconds late, and a reset that stranded the player in a season. **None of those
   is the kind of thing an assertion sees.**
2. **The fix round's five collision surfaces have STILL not landed.** Slice C touched four of them:
   `goSeason()` is ternary, `seasonWaiting()` is widened, `renderRail()` carries the #11 room filter
   (which is RULED and names Winter in its own words), and Winter's controls joined `noSwipe`.
   **#15's season-tab retirement is the one that will conflict** — `renderSeasonEdges()` is
   unchanged, Winter now has a tab, and `tools/capture-screens.js` drives three scenes through those
   tabs. `git fetch` before touching `ui.js`.
3. **Guardrail one FAILS and `year-sim` exits 1.** Eight kept Camellia gross 2,688,000 and mint 18.3
   seeds against a gate of 10 at every Turn 3–6 — one night opens a Turn on its own. Only the top
   rung breaches. The dial is its cost coming DOWN to about 86,854 (gross rises with cost, so
   raising it makes this worse), or the snowfall down, or `minSeeds` up. **The owner's call, and
   nothing should be tuned until they make it.**
4. **Winter buys gold and spends Turns.** Over thirty days the arm that plays Winter turns 16 times
   against 21, and the Turn is where the compounding is. Reported and not tuned — the capital Winter
   parks is capital a sleeping player was not cycling anyway. Doc 46's own metric is the one to
   read: **a kept morning is worth a median 23% of that day's income.**
5. **Fall is still not in the welcome-back report**, and Winter's arrival makes that louder rather
   than quieter — two of the three gardens now report an overnight and the middle one does not.
   Deliberately left, because Fall is not this slice: it is a `fallRipe` count beside Winter's in
   the same payload.
6. **Fall's bed chip double-spaces around its bold words** — the same flex-gap leak Winter's chip
   had, and one line of CSS. It is `.fl-chip`'s, not Winter's.

---

**THE OVERNIGHT FIX ROUND IS DONE — nine items off the punch list, all nine shipped and pushed.**
Two of them want the owner's *ear* before anything else, and two carry a decision made in their
absence that is theirs to overturn. The morning script is below; do it in that order, because the
first two things need a quiet room and the rest do not.

**Each item's commit, so the punch list can be pruned in the morning:**

| # | What | Commit |
| --- | --- | --- |
| **#3** | Three sound channels, each a slider and a mute | `b196d3c` |
| **#8** | The gem chip loses its countdown | `ef19afc` |
| **#4** | The app icon becomes the talking flower | `e6a0540` |
| **#6 + #7** | Fall's board aligned, its flower resized, the pill above, Collect All below | `d4687c3` |
| **#5** | The Turn-jump cheat | `9297273` |
| **#1** | The Thunderstorm becomes rain plus thunder | `3f4de68` |
| **#9** | The daily changelog | `ba63379` |
| **#2** | The sky's chip | `abb55f1` |

`docs/43-punch-list.md` was deliberately **not** touched — it belongs to the agent who keeps it.

**One thing was found rather than done.** The working tree held a complete, uncommitted frame-rate
instrument from another session — `ui-perf.js`, `tools/skybench.js`, a `.scenery-warp` box and a
three-state sunbreak fade. It passed every check and the game booted clean, so it went in on its own
commit (`bc74b3b`) before the round started, rather than being swept into nine commits that are not
about it.

*(2026-09-01: that session came back and finished the pass — the instrument is now documented in
docs 02, 03, 09 and 24, the Wonderfall fix it had half-made turned out to hide a real look
regression that a pixel diff caught, and the whole thing is written up in the performance entry
below and in the decision log. Nothing about it is unreviewed any more.)*

### The morning script — ears first, then eyes, then thumbs

**LISTEN. Do this one in a quiet room, with the phone, before anything else.**

1. **The storm.** Menu → Settings → Developer tools → hold the weather on **Thunderstorm**, and sit
   in it for a full minute. It should now sound like *rain* — a hiss with drops in it — with weight
   underneath, and it should **breathe** rather than sit on one note. Measured above 300 Hz, which is
   the band a phone can actually reproduce, it used to swing 0.59 dB across twenty seconds and now
   swings 2.20 dB; rain swings 2.63. It is also a hair quieter than the rain, which is the honest
   answer to "overbearing" — note that turning it *down* was the one thing that would not have
   helped, because it already measured quieter than the rain. What was missing was the rain.
   **Both noise beds are half as loud since 2026-09-03**, at the owner's request, and the thunder is
   untouched — so the breath is the thing to listen for, and it should sound the same, just further
   away. Re-measure any time with `node tools/bedbench.js`.
2. **The three sliders.** Settings, at the top: **Sound effects · Ambience · Music**, each with a
   mute and a level. **They should sound exactly like yesterday until you touch one** — that is
   deliberate, and it is why the ambient house level is written as 0.36 rather than 0.5. Drag
   Ambience down while a sky is running and it should fade under the effects, not with them. Mute
   Music and the tune stops; drag Music to zero instead and it goes silent but keeps running, so it
   comes back the moment you drag it up.

**LOOK.**

3. **The icon.** Add the game to your home screen (or re-add it — an app already installed keeps the
   operating system's copy of the old picture). It is the pink flower with the face now, the one the
   game opens on, not the yellow bloom. It was checked at 40 px, which is where a face has to
   survive.
4. **Fall's board.** Turn once, then swipe between the garden and Fall and back, watching the board.
   **It should not move and it should not resize** — the two are the same square in the same place
   now, at 390×844, 375×667 and 390×640, measured to the pixel. Fall's flower is Summer's flower and
   has its glow back.
5. **Fall's Collect All moment.** Fill and ripen the bed (Developer tools has both buttons). The pill
   above the board says *The whole bed — +50%*; below it, a gold **Collect all · +33,600**. Tap it
   once: confetti, coins, one sound, and a toast that says the bonus was applied. **The ripe Century
   Bloom is left standing** — that is the decision, and it is in the table below.
6. **The calmer plots.** Plant a few things and watch the top-right of each. Just a gem and a price.
   No second number counting down on eight plots at once.

**TAP.**

7. **The Turn jump.** Developer tools → *Jump ahead* → **+3 Turns (Winter's gate)**. It earns its way
   there through the real faucet and runs the real Turn three times, so expect a **bare garden with
   Saved Seeds banked** — that is a prestige, three times, not a bug. Then look at Winter's tab: it
   says *Soon* rather than *Turn 3*, and tapping it reads **"Still growing in"**. That plate has
   never been reachable before. **It opens the gate, not a garden** — Spring and Winter are not
   built, and this cheat cannot conjure them.
8. **The weather chip.** Hold any sky that is not Clear. A tinted chip appears at the left of the row
   under the quest bar with the sky's name. **Tap it** for one paragraph about what that sky is
   doing. Read the wording carefully: it promises a **chance**, never a payout, and that is
   deliberate — see the table below.
9. **What's New.** Menu → *What's New*. It now opens the **changelog** — a dated list of what changed
   — with the Garden Year announcement as a tappable row at the top. It also puts itself up on its
   own, at most once a day, never beside an announcement and never to a brand-new player.

### The two decisions made in your absence, both one line to reverse

| Decision | What was chosen, and why | To overturn |
| --- | --- | --- |
| **The weather chip has no timer** | You asked for one. A countdown to the end of this sky is also a countdown to when the next one starts, and paired with the flower's spoken forecast it rebuilds most of the forecast panel *you* ruled out this morning — "the garden stops being a place and becomes an optimisation problem". A tinted chip says the sky is doing something without becoming a clock to plant against. | Everything is in place. **The trap:** `weatherSlotRemaining()` measures the **slot**, and a bought or held sky outlasts its slot — a chip that trusted it would count to zero and then keep going. |
| **A storm keeps some rumble** | The item left it open: cosy rain plus thunder cracks, or rain with weight still under it. The roll band is kept at half its old height and the sub at 0.45, so a storm still reads as different from a rain. | Two numbers in `BUILD.storm` in `audio.js`: `rollG.gain` and `deepG.gain`. Take them toward zero for pure cosy rain, then re-run `node tools/bedbench.js`. |
| **Collect All leaves a ripe Century Bloom** | It is outside the bed in both directions — it neither blocks nor collects the windfall — so the fortnight showpiece stays yours to pick. | One `def.century` guard in `fallHarvestAll()`, and the sim-test that asserts it. |

### What this round got wrong first, and what caught each one

Four, and **not one of them threw, failed a check, or looked wrong in a screenshot.**

1. **The weather chip was a full-screen box that swallowed every tap on the garden.** `.chip.wx`
   picked up `.wx{position:absolute;inset:0}`, the Sky Pass's weather layer. It measured 390×844
   while looking perfectly correct in the rail; the first probe tap summoned a Wonder Effect from the
   flower underneath it. Renamed to `.chip.sky` — **which is also taken**, by the scenery's sky, and
   did exactly the same thing. It is `.chip.weather` now. The recorded "check for an existing class
   before naming a new one" rule earned itself twice in ten minutes, and the check that found it was
   `getBoundingClientRect()`, not the eye.
2. **Equal margins looked like the fix for Fall's offset and were not.** A margin on one side of a
   `place-items:center` child shifts it by half of itself — that was the 23px. Equal margins cancel
   *while they fit*: a grid falls back to start-alignment the moment an item overflows its track, so
   on a 640-tall screen the same trick pushed the board down by a whole strip instead of half of one.
   No margin at all is the only version that holds at every height.
3. **`display:none` on the rail broke the very alignment it was added to protect.** Hiding a grid row
   in Fall gives its height back to `.stage` **in Fall only**, and a taller stage in one season is
   the exact fault the round existed to remove. `visibility:hidden` keeps the box.
4. **The tooltip's own `white-space` lost the cascade.** `.coach .tip` and `.weather-tip .tip` are
   the same specificity, so source order decides — written up beside the rail, the bubble ran off
   both edges of the phone in one unwrapped line. Same lesson the reduced-motion block already
   records.

**And one test that passed for the wrong reason and had to be rewritten.** The Century Bloom
assertion in `fallHarvestAll()`'s group survived a sabotage that deliberately took the Century
Bloom — because a Century Bloom never carries a `windfall` mark, so the explicit guard is belt and
braces rather than the thing doing the work. It now asserts the fixture is genuinely ripe first, and
the sabotage that must go red is the *realistic* wrong implementation: a loop over everything ripe.
**Every new group this round was broken on purpose before it was believed** — three sabotages each
for Collect All, the Turn jump and the changelog.

### The round before this one — the hamburger menu

**THE HAMBURGER MENU IS BUILT AND WAITING FOR THE OWNER'S REVIEW.** The wireframe gate opened first
(`tools/menu-spike.html`, five frames), the owner approved all six questions on 2026-08-31 and added
one condition — *"this thing needs to be somewhat modular where we can move things in and out"* — and
the build followed. The two-minute phone script is below.

**What landed, in one picture.** The settings gear in the top-right is now a hamburger with a red
badge dot. Tapping it slides a drawer in from the right edge over a scrim, with the garden still
visible down the left. At the top: a round portrait, the player's name, and a pencil. Below: **Shop ·
Almanac · What's New · Settings**, then a *Coming soon* rule and three drained, unpressable rows —
**Friends · Daily Gift · Garden Record**. Settings kept every one of its six controls; nothing else
in the HUD or the dock moved at all.

- **The drawer is a third surface class**, and calling it a sheet is the mistake that breaks it.
  Definition, rules and the two dismissals:
  [08-ui-and-layout.md](08-ui-and-layout.md#the-side-drawer--the-menu-2026-08-31). The reasoning and
  what was rejected: the 2026-08-31 build entry at the top of
  [10-decision-log.md](10-decision-log.md).
- **`state.profile` is `{ name, avatar }`**, top-level, and it is identity rather than progress —
  [07-save-data.md](07-save-data.md#stateprofile--who-the-player-is-added-2026-08-31). The mechanic
  is in [03-systems.md](03-systems.md#the-menu--who-the-player-is-and-where-everything-else-lives-2026-08-31).
- **The rows are a table**, `ROWS` at the top of `ui-menu.js`. Moving one in or out is one line;
  the playbook is in [09-conventions.md](09-conventions.md#playbook-add-or-move-a-menu-row).
- **`tools/html-check.js` is new and is now part of checking your work.** It holds the escaping
  ruling. Run it beside `sim-test` and `style-check`.

### The five things this round got wrong first, and what caught each one

Worth reading before the next surface, because none was visible from the code.

1. **The drawer flew to the corner of a desktop window.** It is a *sibling* of `.ui` — it has to be,
   or the FX float layer paints coin drops over it — so it inherits nothing and must re-state the
   560px column itself. Perfect on a phone, wrong on a laptop. Caught by comparing
   `getBoundingClientRect()` against `.ui`'s, not by looking. This is the meadow's own recorded trap,
   stepped in again on a new surface.
2. **Every row wore a 39px grey blob.** `.dr-row` shipped with the plot's full five-layer recipe, and
   the two blemish radials are sized in *percentages of the box* — a speck on a 100px plot, a bruise
   on a 300px row. The scale trap, in CSS. Every wide card in this game is a two-stop gradient.
3. **"Tap the flower!" sat on top of the menu for half a second.** `refreshCoach()` runs on the 0.6s
   tick, so the JS guard alone leaves a window. It needs the declarative half too —
   `.drawer.open ~ .coach{display:none}`, the same route the sheet uses.
4. **The escaping checker passed a planted attack.** A template literal cannot be found by counting
   backticks: the first one *inside* a template opens a nested one rather than closing the outer, so
   a two-level case reads as a closed span. It keeps a mode stack now. **It was re-broken four ways
   before being believed** — and that is the rule, not the anecdote.
5. **The spike promised a dismissal that cannot exist.** An open drawer covers the button that opened
   it, so "tap the hamburger again" is unreachable with a thumb. Two dismissals: drag the grip right,
   or tap the 58px strip of garden. The spike's note was corrected in place.

**And one trap that behaved exactly as designed, which is worth saying too.** Adding `profile` to
`defaultState()` turned sim-test's partition completeness check red on the very next run, exactly as
its comment promises. It is classified `SURVIVES` — **a Turn must never touch identity** — and the
rig writes a non-default name *and* avatar so the assertion cannot pass on a value that equals its
own default. The Settings reset is a different thing and does clear it.

### The two-minute check — the menu, on the phone

Do this one first. Everything is behind one button.

1. **Find the button.** Top right, where the gear was: three bars, with a **red dot** if there is an
   announcement you have not read. Tap it. The menu slides in from the right and the garden stays
   visible down the left edge — you have not left it.
2. **Rename yourself.** Tap the pencil beside *Gardener*. The name becomes a field with a green tick;
   type something and tap the tick. Try a long one: it stops at 16 characters and the header
   ellipsises rather than breaking. Try `<b>hello</b>` if you like — it shows up as those exact
   letters, which is the whole point of the fuss in the code.
3. **Pick a creature as your face.** Tap the round portrait. Your blooms come first, then any
   creature that has moved in; flowers you have not unlocked are greyed with a padlock, like a locked
   seed row. Tap one — a gold ring and a green tick say it is yours, and the menu goes back to the
   list.
4. **Reopen What's New.** Third row. It shows the newest announcement again; the button only closes
   it and the red dot goes out. **It can never start you over** — that only ever happens once, on the
   dialog that greets a new build.
5. **Find Settings in its new home.** Fourth row. Sound, music, the two grants, the Wonder and the
   reset are all exactly where they were, one tap deeper.
6. **Get out two ways.** Drag the little bar on the drawer's left edge to the right. Then reopen it
   and tap the garden strip beside it. Both close it. (Tapping the hamburger again does not — the
   drawer is covering it.)

Then check nothing else moved: the coins and gems pills, the Almanac book, the quest strip, the
UPGRADE and POWER-UP buttons and all five dock buttons are untouched.

---

**PHASE 3.9 — THE SKY PASS — IS BUILT AND WAITING FOR THE OWNER'S REVIEW.** The owner approved all
five skies on the motion stage, handed back their tuned values, and asked for one change to the
sunbreak; the values are `DATA.weatherStage` verbatim and the change is in. The spec and the
as-built notes are [41-weather-staging.md](41-weather-staging.md); the reasoning is the phase-3.9
entry at the top of [10-decision-log.md](10-decision-log.md); the five-minute phone check is below.

**What landed.** Weather used to be one flat colour fade per state, with no sound and nothing on the
board reacting. Now every sky is a sequence — it announces itself, transforms in layers, holds, and
ends — and **rarity buys layers**: Rain moves three channels, the storm five, the aurora six, and
Wonderfall all of them. Seven slots in ten are Clear, and Clear giving way to Clear moves nothing at
all; that silence is what makes the rest events.

- **The sunbreak** rides the ends of Rain and the Storm when the next slot is Clear and it is
  daytime. Two to four soft shafts crossing the sky on a slow sweep while fading in and out on a
  separate clock — the owner's note after the stage review, and the reason `sunbreak.phase` exists.
- **Two nudges reach the simulation, and only two.** *Rain waters* — a tenth off growing time,
  through both paths a growth effect needs here, and deliberately kept out of the offline rate.
  *An aurora brings the night* — `isNight()` true while one hangs, for the moment it is asked about,
  so Nightbell wakes and an away roll resolves against the sky that actually stood.
- **The world answers**: wet ground and glisten, wind and sheltering pets, glow rims and creatures
  looking up, the veil and the bobbing and the singing flower. The flower forecasts every real sky a
  few seconds ahead, and only the aurora and Wonderfall may talk over its cooldown.
- **The music rearranges rather than being replaced** — same progression, a per-weather dress, over
  a new ambience bus carrying four synthesized beds. Full record in
  [06-audio-and-fx.md](06-audio-and-fx.md).

**Five bugs the pass found and closed**, four of them the recorded one-property traps and one of
them older than the pass: the storm's crouch deleted the transform that centres a creature on its
anchor; the glisten deleted a mutated bloom's glow; both plant hooks replaced the ripe wiggle; a
`filter` on the lawn and on `.scenery` reached the bottom edge, where a filter cannot be masked; and
**the slot tick had been announcing the slot's own weather over a bought sky since weather shipped**,
so a four-minute called rain stopped raining every sixty seconds.

**The suite's clock is pinned to a fixed epoch.** Weather is a function of wall-clock time and now
decides how fast things grow, so a suite seeded from `Date.now()` saw a different sky every run.
1,444 assertions, byte-identical across runs.

**Read before touching this**: what the pass knowingly left, in
[11-known-issues.md](11-known-issues.md#what-the-sky-pass-knowingly-left-2026-08-31-phase-39) — the
retro shave missed while nothing is watching, the once-per-rain compounding, and the 44px bright
strip along the bottom, which is load-bearing and must not be "fixed".

### The five-minute check, phase 3.9 — the sky, on the phone

Sound on. Music on in Settings, or you will miss half of it. Weather turns on the minute, and seven
minutes in ten are Clear, so the two rare skies are held from Developer tools — the unlabelled dot
beside the gem wallet, then **Hold the weather**. Release it when you are done or the sky stays put.

1. **Watch a front roll in.** Do nothing for a couple of minutes. When a real sky is coming the
   flower says so about five seconds early — *"Smells like rain coming"* — and the cloud bank
   thickens before anything falls. That is the whole announcement: no banner, no toast.
2. **Stand in the rain.** Look at the ground rather than the sky: the soil and the lawn go dark and
   stay dark, the plants pick up a wet sheen, and the flower puts a leaf over its head. Listen for
   the hiss, and for the music putting on a coat — same tune, heard from indoors. Tap something and
   notice the taps have gone soft too.
3. **Call a storm and feel it arrive.** Shop → 25 gems. It does not switch on; it comes. Then the
   flash, the bolt behind the hills, the wind leaning the plants sideways, and the pets ducking
   under the nearest leaves to peek out. It cannot flash more than three times in ten seconds
   however hard it tries — that ceiling is not a knob.
4. **Watch the sun break through after it.** When the storm ends into a clear minute in daylight,
   the shafts fade in and cross the sky while the ground is still drying. That drying is the trace:
   the garden stays wet for half a minute after the last drop.
5. **Catch an aurora at noon.** Hold *Aurora*. The sky goes down to dusk whatever the hour, the
   ribbons drift in, the stars come up, every plant takes a faint glow, and the creatures stop and
   look up. Nothing else moves; that stillness is the acknowledgment. Nightbell pays its night rate
   while it hangs.
6. **Be there when the sky does something wonderful.** Hold *Wonderfall*. The banner, the veil, the
   ripe flowers bobbing on the beat, gold falling out of the sky, and the flower singing. **The one
   number worth arguing with is the veil** — it is deliberately far under the Wonder Effect's, so it
   reads as weather rather than the ×3 event, and it may be too quiet.

**And once with Reduced Motion on**, in the phone's accessibility settings. Every sky has an honest
quiet version: no drops, a still wet ground, one dim ribbon, a slow tint pulse instead of the flash,
and a single faint shaft. The question is whether you can still tell what the sky is doing.

---

**PHASE 3.8 — THE POLISH ROUND — IS BUILT AND WAITING FOR THE OWNER'S REVIEW.** Six of the owner's
seven rulings are in as written; the seventh was re-ruled by the owner mid-round and is in as
re-ruled. Nothing is half-done and nothing is blocked. The reasoning is the phase-3.8 entry at the
top of [10-decision-log.md](10-decision-log.md); the five-minute phone check is below.

**What landed**, in the owner's order:

1. **The ready Turn button throws a gold glint** across its face every `DATA.year.turnShineEvery`
   seconds, on top of the 1.4s breath, and holds a solid ring under reduced motion. Building it found
   that **the dock's year meter had never once painted** — `ui.js` wrote a `height` onto the clip box
   instead of `--year-p` onto the waterline. Fixed here.
2. **"Badges" is gone from everything a player reads**, and **every power-up faucet is audited**:
   nothing was farmable by Turning, and `bill 1c` in the suite now fails if anything ever is. The
   curve is reshaped — a new garden opens with four power-ups in the tray, the third and fourth
   quests pay two each, every level from 2 to 8 pays a rung, then it tapers to 10/12/15 and stops.
   Provisional values; deep tuning is phase 4's.
3. **Every petal skill says what it is in one plain line**, on the Turn panel's cards and the
   Almanac's rows (one renderer, one edit). At zero pips the sentence replaces the bare "next +30%".
4. **The vertical swipe is re-pointed**: finger UP goes down to the Hollow, finger DOWN goes out to
   the Wild Meadow. **The placeholder gate was NOT built** — see below.
5. **Two one-shot coach marks teach the season swipe** after the Turn that opens Fall, one each way,
   pointing at the season tab from the side.
6. **Fall's bed chip hangs under the board**, in a strip `sizeBoard()` reserves for it.
7. **The album, the set view and pack-opening are on the house material** — dark bodies, real lips,
   numbers in cream pills, and rarity in the rarity colours instead of the two currencies.

**THE ONE RULING THAT CHANGED, and why it matters to whoever reads this next.** Ruling 4 gave
swipe-down to a placeholder gate. **Swipe-down is the Wild Meadow's only door in the game** — the
gate would have stranded the room, its hives, its keepers and four quests worth 114 of the ladder's
789 reputation. Three options went to the owner and **the owner chose to fix only the inverted half
and let the gate wait**. Do not re-propose the gate as an easy win: the blocker is that the meadow
needs a second door first. Recorded in
[11-known-issues.md](11-known-issues.md#what-phase-38-knowingly-left-2026-08-30).

**What phase 3.8 knowingly left** — the gate, four Cards layout questions for the owner, Fall's
board sitting ~23px higher than the garden's, and two pre-existing nits the review surfaced — is in
[11-known-issues.md](11-known-issues.md#what-phase-38-knowingly-left-2026-08-30). **Read that section
before proposing anything about the Cards screens or the vertical axis.**

---

**Still open from before this round, and unchanged by it.** Walk the phase-3.7 two-minute check below
— most of what the next session does depends on the answer to its last two questions.

**The pacing verdict was chased down after phase 3.7 shipped, and it produced two rulings. Both are
specced and neither is built — they are the next two jobs, in this order.**

**The handoff's own explanation of that verdict was wrong, and the owner caught it.** It said a
Turn-heavy shape wins by laundering doomed gold through Fall beds. Fall-dumping before a Turn is good
play, not an exploit, and gold at the Turn cannot be the mechanism at all — the mint reads what a
year *earned*, never what is in the wallet. The real cost of a fast cadence is that **the Turn wipes
every badge**: fifty-three Turns is fifty-three rebuilds of the automation. Do not repeat the
laundering story.

**1 · Seed the referee, then use it.** `tools/order-gold.js` was written this phase by copying
`tools/year-sim.js`'s play model verbatim, and the probe that measured the pantry made a third copy —
three copies of "what a casual player does in six minutes" already exist. Pull one
`tools/play-model.js` out of them, **seed `Math.random`**, and print a delta against a committed
`tools/baseline.json`. Seeding is the load-bearing half: unseeded, the verdict is a coin flip (five
runs of identical code returned OK, OK, OK, FAIL, FAIL); seeded, the same player can be run on the
same dice against two economies and the difference IS the change. Keep it small — one command, a
printed table, no dashboard.

**2 · Build the Preserve** — [41-the-preserve.md](41-the-preserve.md), owner-ruled, spec complete
with a test bill. An order is filled from what you grew **this year**; everything still in the pantry
at the Turn becomes pressed flowers and kept jars, which craft and sell but which no customer will
take. The Turn regenerates all three orders and never emptied the pantry, so a fresh board met a
stockpile that had been growing for the life of the save: **30% of a Turn-heavy player's entire order
income arrived in the first sixty seconds of a new year.** Blocking it flips the ten-day result on
its own and drops his Turn count from 53 to 35 without touching a multiplier.

Three things that ruling knowingly buys, all in the spec: the first board of a new year becomes a
to-do list rather than a payout; **normal play loses order income too**, by about two thirds; and the
honey half ships unmeasured, because the play model never builds a hive so honey goods never reach
the board.

**The referee comes first on purpose** — the Preserve is the first change that moves order income for
everyone, so it is exactly the change worth a real before-and-after, and measuring it with the tool as
it stands would produce another coin flip.

**Still genuinely open, and unchanged by this phase** — the first two inherited from the design
session's docs-only commits `30c3a63` and `06ce06a`:

- **The blessing is RULED, and the advisor's recommendation was not taken.** *Keep it exactly as it
  is*, no once-ever cap and no pricing. The owner's diagnosis was the sharper one: it feels
  lackluster because it is *a ceremony wrapped around a thing you can already buy*. The open item
  changed shape from *how do we price this* to **what should a blessing actually be**, with three
  sparks recorded against it. The farmability seam in [11-known-issues.md](11-known-issues.md) is
  therefore **accepted for now**, not a pending decision — it was still headed *OPEN OWNER DECISION*
  after the ruling landed and is re-marked in this commit.
- **There is a money plan now**, [37-monetization.md](37-monetization.md). Nothing in phase 3.6 or
  3.7 touches it.
- **Petal pacing**, which waits on the owner playing. The answer the owner asked for is literally
  *"play five years with the time-warp and say whether the Turn still felt worth doing"* — so the
  cheat this round shipped is the instrument for it.
- **The Fall one-tap bed sweep**, explained to the owner and awaiting a yes or no.

**What comes after, when the owner is ready:** slice D, which authors the level rungs past 20 and
turns the Stand's standing back on — one word, `STAND.repPaused` in `data.js`. Until then the quest
ladder and the Almanac's milestones are the only road to every level gate in the game, including the
fourth habitat slot at level 16, so **do not bench another ladder quest without re-checking that
headroom.**

### Alongside phase 3.9: the overnight housekeeping round, 2026-08-30

**Tooling and mechanical fixes only — no design, no economy number, no phase work.** It ran in a
separate worktree cut from `origin/main` and pushed to `main` from there, precisely so it could not
sweep the Sky Pass's uncommitted work out of the shared checkout. Full account, including everything
it declined to decide, in [42-overnight-housekeeping.md](42-overnight-housekeeping.md).

**What it built.** `tools/style-check.js` — the enforcement doc 11 called "the single
highest-leverage item on this page" — and twenty-one design-rule assertions in `tools/sim-test.js`,
which now runs 1,444 checks. Both ratchet.

**What it fixed.** The quest bar and the Almanac meter reveal their gradient instead of compressing
it; 32 raw hexes became tokens, including all 25 `#2c1a10`; a keyboard focus ring on every button;
three missing `aria-label`s; the quest card's contact shadow; a drifted translucent lip; and
`Icons.get()` now warns once per missing name where a developer can hear it.

**Three things it was asked to fix and deliberately did not**, because each turned out to need you:

1. **The "Garden Mastery" rename rests on a premise that is not true.** The brief said the glossary
   implied it. [32-the-garden-year.md](32-the-garden-year.md)'s glossary has sixteen entries and
   names none of these things. And the issue is stale — "Bloom Mastery" is in **zero** player-facing
   strings and the "Tier N" toast cannot fire, so the collision it describes is unreachable. **The
   question is now whether there is still a problem, not what to rename it to.**
2. **The creature arrival bar has no display-side fix left.** The clamp is already there and is what
   produces the wrong string; the state itself is impossible. A second clamp moves the lie.
3. **The `innerHTML` hardening is priced rather than done.** 908 interpolations reach an
   `innerHTML` and **468 of them return markup that must not be escaped**, against 120 that want it.
   Nothing player-supplied can reach a panel today. The filed ruling is a rule, not a helper:
   player text never enters a template literal.

**And it found five documentation faults** by trying to assert what the docs say — including
`33-year-one-economy.md`'s "every level grants something", which is false at six levels, and the
currency policy in doc 12, which its own game broke twice. All in
[11-known-issues.md](11-known-issues.md#five-documentation-faults-the-design-rule-pass-turned-up).

### The two-minute check, the visual reference — do this one on a laptop, not the phone

Everything here is on the wiki, so no checkout is needed and you can send any of these links
straight to the Unity engineers.

1. **Open the wiki and find the two new pages.** <https://github.com/Deep-Forest-Labs/GardenofWonder/wiki>
   — they are the last two lines of **"What the Unity build needs"**, and they are in the sidebar
   under the same heading.
2. **Open [44-screens](https://github.com/Deep-Forest-Labs/GardenofWonder/wiki/44-screens) and
   scroll it.** Twenty-six pictures of the game, grouped garden → seasons → the Turn → the other
   places → the panels → the weather. **Every picture should load.** They are linked by full web
   address rather than by file path, which is what makes this page work identically in the repo,
   on the wiki and in anything you forward it to.
3. **Look at the four Turn shots in particular.** The ask, the blessing picker, the Tally caught
   *mid-count* with "counting…" under it, and the spring return. If the ceremony ever stops
   reading in that order, that is the sequence to compare against.
4. **Open [45-asset-inventory](https://github.com/Deep-Forest-Labs/GardenofWonder/wiki/45-asset-inventory)
   and click three icons in the manifest table** — the little pictures are links to real `.svg`
   files. Try `coin`, `sprout` and `plantSpot`. Each opens as a standalone drawing the Unity team
   can drop straight into the engine. Forty-six of them, and the table says where each one is used.
5. **Scroll to the bottom of that page**, to *"The six things most likely to cost you a rebuild"*.
   That is the part worth reading yourself rather than only forwarding — in particular that
   **decor is bought and counted but never actually drawn in the garden**, and that the card album
   has **108 slots and no real card art**, filled today by nine placeholder shapes on a loop.

**If a screen ever looks wrong, nothing here is fixed by hand** — the pictures and the page are
both written by `node tools/capture-screens.js`, and the icon files and their table by
`node tools/export-icons.js`. Run the command and the mistake goes away or it is a real bug.

### The two-minute check, the overnight round — do this one first

1. **Watch the new check pass, then watch it fail.** `node tools/style-check.js` ends
   `OK — no new drift`. Add `.x{color:#123456}` to the bottom of `style.css`, run it again: it names
   the file and line and exits 1. Delete the line. That is the whole feature.
2. **Look at the quest strip.** Tap the flower a dozen times. The fill is green and stays green
   until the bar is nearly full; before tonight it reached full gold at 44%. Same fix on the
   Almanac's Collection meter.
3. **`node tools/sim-test.js`** — 1,444 passed, 0 failed.
4. **Then read the three things it would not decide**, above.

### The five-minute check, phase 3.8 — the polish round, on the phone

**Every step was walked in the live build before it was written down.** Developer tools is the
unlabelled patch of empty space just right of the gem wallet — one tap, no icon.

**Steps 1–3 want a FRESH garden.** Settings → *Start over*, or open the game on a phone that has
never seen it. Steps 4–8 want a Turn under your belt.

**1 · A new garden opens with power-ups already in it.** The round button on the right of the band
is lit in a colour with a **4** on it before you have done anything at all. Tap it and something
starts. That is the first-days richness the ruling asked for — and it keeps coming: every level from
2 to 8 pays another one, and levels arrive fast because the first quests are small.

**2 · The ask says "upgrades".** Play until the Turn is ready (or Developer tools → *Earn 150K into
the year*), then tap **Turn**. The card that asks you to confirm lists what the year takes: Gold,
**Upgrades**, Power-ups, big plots, growing. The word "badges" is gone from everything you can read.

**3 · A petal explains itself before you buy one.** Almanac (the book in the HUD) → scroll to any
flower's rows. With no dots filled it now reads *"+30% gold on this flower's harvests, per petal."*
and *"Grows 6% faster, per petal."* — not the bare "next +30%" from your screenshot. Same on the
Turn panel's flower cards.

**4 · The Turn button calls you.** With a Turn ready, watch the dock without touching it. It breathes
gold as before — and **every nine seconds a glint crosses its face.** The green fill under it is also
painting for the first time; it never has before, on any build you have played.

**5 · Both swipes go where your hand expects.** On the lawn — not on a plot, not on the flower:
**drag UP** and you go **down into the Hollow**; **drag DOWN** and you go **out to the Wild Meadow**.
Each room comes back the opposite way, and each exit pill's arrow points the way its swipe goes. This
is the half of ruling 4 that shipped; the placeholder gate did not — see *What phase 3.8 knowingly
left* in [11-known-issues.md](11-known-issues.md), which explains why.

**6 · After the Turn, the game teaches Fall.** Come back to the garden after the ceremony and a
bubble sits beside the FALL tab with a finger dragging: *"Swipe left for Fall."* Do it. Inside Fall,
the mirror image points back at SUMMER: *"Swipe right for the garden."* Each shows once, ever, and
each disappears the moment you do the thing it teaches.

**7 · The bed chip sits clear of the garden.** In Fall, the *"Fill all 8 for +50%"* pill is now
**under** the board, not across its top edge. Plant the bed and watch it change: filling → all in →
one more → the whole bed, gold and pulsing with the board's gold rim. Nothing it says is drawn on
the bed any more.

**8 · Open a pack in the new clothes.** Cards → *Open a pack*. The card is a dark wooden panel with
a proper edge and a shadow, the art on a tinted disc, the name in cream on top. A **new** Rare or
Legendary wears a ring in the same blue and gold the garden uses for rarity; a **spare** is the same
card drained to grey paper with no ring at all. Back out to the album: twelve dark tiles on cream,
each with its set's colour on its badge and its count in a little cream pill.

**Two things to tell me if they feel wrong:** whether the first days feel *too* generous with
power-ups (the knob is `n` in `DATA.levelGrants`, and it is provisional), and whether Mythical needs
a colour of its own — right now it wears legendary gold said twice, because the cards have five
rarity rungs where the garden has four.

### The two-minute check, phase 3.7 — read this one first

Two minutes, in order, on a phone. Every step was walked in the live build before it was written
down. **Steps 4 and 5 need one tap in Developer tools** — the unlabelled patch of empty space just
right of the gem wallet — because a fresh garden has no Saved Seeds yet and petals do not exist
until your first Turn. That is the year-one mystery working as designed, not something to fix.

**1 · Open the game. A card comes up, once.** Flashy art, four plain lines about the Garden Year,
and one button. It is not fullscreen, you cannot swipe it away, and tapping outside does nothing —
the button is the way out, on purpose. **It will never show again**, not even after the reset it is
about to perform.

**2 · Tap "Got it!" — and you land in a fresh garden.** Four plots, a hundred gold, nothing else.
That is the announcement's gift rather than its threat, which is why the button does not say
"reset" and the card says *"This one starts everyone on fresh soil"* instead. Everyone in the
playtest starts the same build on the same morning.

**3 · Tap an empty plot and read the Tulip row.** `110 gold · 18s · 154–1,232`. Remember the
**18s** — that number used to be a lie. The picker was applying your sprinklers and boosts to it and
forgetting your petals, so a flower you had spent Saved Seeds on read the same as one you had not.

**4 · Buy a Quick Sprout petal on the Tulip, and watch that number move.** Developer tools →
**Petals → +50 Saved Seeds**. Now the Turn button in the dock has a card per flower. Find **Tulip →
Quick Sprout**: the row reads its own value out loud, *next −6%*, where before it was five dots and
a price. Buy one and it becomes *−6% time · next −6%*.

Now open the picker again. **The Tulip says 17s.** Buy the rest of the ladder and it says **13s, in
green** — green because the garden made it better — and the payout beside it carries an `×` showing
what your petals are adding. That is the whole point of the round: **nothing in the game should ever
again show you a number that is not the number you would actually get.**

**5 · Fill an order and feel the gold.** Developer tools → **Give → +1M gold**, then plant and
harvest for a moment so you have blooms in the pantry. Orders & Quests in the dock: deliver whatever
the first customer is asking for. It should land like a small windfall — roughly **a minute or two
of what you are currently earning**, at every tier, which is the rule the whole change was measured
against. Before this it paid between a fifth of a second and four seconds of your income, which is
exactly why it felt pointless.

**What to tell us.** Does an order feel like a *reward for engaging with the Stand*, or like free
money that makes the rest of the garden feel slow? That is the one judgement a simulation cannot
make, and it is the reason the numbers went up as far as they did rather than further.

**And a smaller one:** now that the buttons all state their numbers, does the game read as *clearer*
or as *busier*? Four buttons still say nothing about what you already have — the plot padlocks, the
meadow's land, the season tabs and the POWER-UP button — because there is no honest room on any of
them. If any of those four bother you, they are the next easy win.

### The two-minute check, phase 3.6 — the round before this one

Developer tools is the unlabelled patch of empty space just right of the gem wallet — one tap, no
icon. Every step below was walked in the live build before it was written down.

**1 · Open the plant picker: one padlock, not two.** Tap any empty plot.

- **Daisy** has a green go button. **Tulip** is grey with the same sprout on it, drained — you cannot
  afford it *yet*, and that is all it says. **Bluebell** wears the padlock, with **150K** beside it.
- The padlock now means one thing: **the one-time wall**. Tap the flower a few times and watch
  Tulip's row come back to life on its own without anything unlocking.

**2 · Watch the goal strip pick the nearest quest.** On a fresh save the strip reads *Tap 25 times*.
Plant one seed. The strip switches to **Plant a seed — Claim**, because that one is finished and the
tap quest is at 1/25. It follows whatever you are closest to finishing rather than whatever you were
given first — but it **holds** that quest while you play and only re-picks when one is claimed or a
new one is dealt, so it will not trade places under your thumb. A quest you actually *finish* jumps
in front from anywhere. **One thing to watch and tell us about:** once the discover quest is dealt it
will sit on the strip, because counting the two species you already grew genuinely makes it the
closest to done — and you cannot move it until you can afford Bluebell. It is no longer stuck
forever (anything you finish jumps in front of it), but if it feels like the strip is nagging you
about something you cannot do, say so — there are two cheap fixes waiting in
[11-known-issues.md](11-known-issues.md).

**3 · Warp a day and watch the garden catch up.** Developer tools → **Wind the world forward → +24
hours**. In one tap: every plot ripe, Fall's whole bed ripe, hives full of jars, keepsakes waiting on
your creatures — and your pets asleep and hungry, because a day of food ran out. **No welcome-back
sheet, no offline-income screen** — this is the world moving while you watch, not you coming back to
it. A power-up you have running keeps its time, on purpose, so this and the POWER-UP button do not
fight each other. Note a plot holds one plant, so warping further does not grow more in Summer — the
long clocks (Fall, the Century Bloom, jars, keepsakes, food) are what a bigger warp is for.

**4 · Summon the pets and look at the band.** Developer tools → **Creatures**. The row header tells
you where you stand: *6 home · 1 out of 1 slot*. Tap **★3** to bring the next one in.

- The band holds **four** at most, and slots open at levels **1 / 5 / 10 / 16** — so to see it full,
  tap **Give → +5 levels** three times first, then **Summon all six, at the same star → ★3**. If you
  do it the other way round, press **Summon all six** once more afterwards: opening the habitat does
  not send anyone out by itself, and that second press is what fills the new slots.
- **Warp +8 hours rather than +24 while you are judging the band.** A full day empties every food
  clock exactly, so after a 24-hour warp you would be looking at four sleeping faces. *Feed everyone*
  is the other way back.
- Judge it at **0, 1, 3 and 4**: is four a crowd? Do they collide with the UPGRADE pill or the
  POWER-UP button? Two of the six stay home resting, which is the habitat cap doing its job.
- A summoned creature shows an **empty bar toward its next star**. That is honest, not a bug — it has
  no lifetime harvests behind it, and faking them would move the Almanac and the discover quests.

**5 · One thing to know while you judge pacing.** The warp itself mints nothing. But if you own the
auto-harvester it will take **one** harvest per warp press (~450–500 gold), because the plot really
is ripe — the same earnings you would have got by waiting. It is far too small to distort the year
meter, but it is the one place the kit touches the mint, so you are being told rather than finding it.

**The rubric, as always: does turning the year feel like a gift or a loss?** And for this round:
*after a day of warping, do petals arrive often enough to feel worth saving for?*

### Phase 3.5, for reference — the task this session inherited

**Phase 3.5, the Big Five ([36-hud-and-dock.md](36-hud-and-dock.md)): the dock rebuilds around
five main buttons and a floating pair, owner-specced with a reference screenshot. Wireframe gate
in full force — spike first, owner approval against the screenshot, then build. The meter pill
and album star retire into it; map and meadow stay parked and reachable by gesture. The morning
docket's remaining rulings (discover quests, Stand rep, picker padlocks, the blessing, mintK)
are in the design conversation now.**

**Phase 1 and 1.1 are BUILT, REVIEWED and VERIFIED (1,202/0; the mint is cumulative; the
exploit is dead; M09 closed). The Surface run — phases 2+3 merged — is next, overnight, per
[34-build-plan.md](34-build-plan.md)'s "The Surface run" section: spikes first, morning-review
file instead of mid-run questions, every push playable, no economy knobs. On the morning
docket: the blessing's pricing (advisor recommends once-ever per flower) and the mintK
calibration, both in [11-known-issues.md](11-known-issues.md).**

**The build is phased and gated: [34-build-plan.md](34-build-plan.md).** Slice A splits into four
owner-reviewed phases (engine → ceremony → Fall and the strip → tuning), each built by a fresh
session from the paste-ready prompt in that doc, each ending in a critic gauntlet and a
five-minute phone test script before the owner's verdict gates the next. **Phase 1 and 1.1 are BUILT and awaiting the
owner's review** — the engine as simulation, the bill asserted, the game visually unchanged,
and the mint rebuilt cumulative on the owner's ruling; the five-minute script is at the end of
the phase-1 session's handoff and drives Developer tools → the Garden Year rows. **Phase 2
starts at the wireframe gate** (`tools/turn-spike.html`, owner-approved before any UI code). If you are
a builder session, your prompt told you your phase — doc 34 is your scope, and the design
conversation lives elsewhere: where docs 32/33 are silent, ask, don't invent.

**The spec itself: slice A of the Garden Year.** [32-the-garden-year.md](32-the-garden-year.md)
is the design, [33-year-one-economy.md](33-year-one-economy.md) the numbers, and slice A is the
whole first task: the year state and mint (earnings-accumulator, never balance, cheat grants
excluded), the Turn path over the never-resets partition, petals' shared skills on the Almanac
rows, unlock prices on seeds 3+, and Fall at background-swap art with the windfall rule — all
under the sim-test bill in doc 33 before any UI. Simulation first, the Stand's own pattern.

### The navigation lap — five minutes on the phone, phase 3.5

**Every step below was walked end to end before it was written down.** Developer tools is the
unlabelled patch of empty space just right of the gem wallet — one tap, no icon.

**1 · The two rooms are gestures now.** On the lawn (not on a plot, not on the flower):

- **Swipe UP** → the Hollow. Swipe **down** to come back.
- **Swipe DOWN** → the Wild Meadow. Swipe **up** to come back.

**Re-pointed 2026-08-30 (phase 3.8) after the owner played it and both directions went to the wrong
room.** The rule is now *the finger drags the world*: pull it up and you descend, push it down and
you rise. A room still leaves by the opposite swipe, and both exit pills' marks point the way their
swipe goes. There are no doors drawn on the lawn. **Watch for this:** the meadow has no visible
entrance at all — the flower says *"Swipe down for the wild meadow."* once, on its first idle line
after the tutorial, and that is the whole of it. If it feels forgotten, say so; the fix is a tab of
its own. Note the flag has no backfill, so a save that already spent that line never hears the new
direction.

**2 · One power-up, used, and the slot refilling.** Developer tools → **+5 levels**, twice. Three
power-ups land. The round button on the right of the band lights up in the boost's own colour with a
badge counting them.

- Tap it. It starts, its countdown appears in the strip above the garden, and **the slot fills
  straight away with a different one** — the badge drops by one.
- Spend the rest. The button goes to drained paper. **Tap it anyway**: it tells you where power-ups
  come from rather than doing nothing.

**3 · Every panel from its button, home by GARDEN.** Tap each of the five, and the UPGRADE pill on
the left of the band. Come home from each with the raised green **GARDEN** button:

Orders & Quests · Cards · Turn · Shop · UPGRADE — six panels, one way home. GARDEN also brings you
out of the Hollow or the meadow, and back to Summer from Fall.

**4 · The Turn button through all four states.** The fourth button's own body is the meter.

- **Now:** empty and unexplained. No number anywhere on it.
- Developer tools → **Earn +25K**. It fills a quarter. Tap it: a padlocked meter, one bar labelled
  *Gold earned*, and the flower telling you to keep going. No pouch, no petals, no second gate —
  a mystery, but never a mystery with nothing to do.
- Developer tools → **Earn +100K**. It fills and **breathes gold**. Tap it: the lock is off and the
  ceremony's button is there — *See what it's for*.
- Take the Turn. Come back to the button afterwards: **the pouch now rides above it** with your
  Saved Seeds on it, and the panel has both gates drawn, the lower one marked as the one holding
  you, and a card for every flower to spend seeds on.

**5 · The two squeezes, if you have a second phone.** At 360px wide the dock buttons are 64px each
and the round buttons in the top bar are back to full size — that is a debt this phase collected.
At 700px tall everything shrinks together and the band is exactly full.

**The rubric, as always: does turning the year feel like a gift or a loss?** And for this phase:
*can you find everything you used to be able to find?*

### The five-minute phase-1 test: feel a whole year from Developer tools

Everything below is one panel: tap the unlabelled dot beside the gem wallet, scroll to **The
Garden Year**. Nothing here has a surface yet — you are judging *numbers*, and the row's
header line is the meter until phase 2 draws it.

1. **Watch the meter fill.** Tap **Earn +100K**, then **+400K**. The header re-reads each time,
   and since the ruling it shows the **ledger** the mint runs on: earned-so-far against the
   100K floor, then `pool P from L lifetime, D drawn`, then
   `projects N seeds (increment I / 10 × tally M)`, then whether the Turn is ready. The pool is
   `0.1 × sqrt(lifetime)` and the increment is what this Turn would draw out of it. Note that
   **+1M gold** (in *Give*, above) moves the wallet and **neither** ledger — that is cheated
   gold staying out of the mint, deliberately, and the lifetime one matters most because it
   never resets.
2. **Hit the wall.** In *Petals*, tap **Unlock the next seed**. On a **fresh** save Bluebell
   wants **150,000** — the first wall, and the number to judge: on day one it should read as
   impossible. Pay it, and it is paid forever (it survives every Turn). **On your own save this
   button will say "Every seed is already unlocked"** — migration grandfathered everything you
   had earned, which is correct and deliberate. To feel the wall as a new player meets it, open
   the game in a private window and run these steps there.
3. **Turn the year.** Tap **A good year's Tally** (a canned mid-game year), then **Run the Turn
   (blesses a flower with room)**. The toast is the ceremony's content without its theatre: the
   pouch, then **`drew X of a Y pool`**, the Tally's multiplier, and every line that scored —
   *Orders filled: 12 → +10%*, and so on. A line the year scored nothing on simply does not
   appear. *(The button blesses the cheapest flower that still has room rather than Daisy by
   name — walking these steps repeatedly caps her, and a named target then silently dropped the
   blessing entirely.)*
   **Then do it again** — this is the ruling made visible, and the one thing worth two minutes
   of the five. Tap **Earn +400K** and **Run the Turn** a second time. Walked end to end in a
   real browser on 2026-08-29, the numbers are: first Turn **pouch 91** on a 70.7 pool, all of
   it drawn; then +400K opens only **24.2** more, and the second Turn pays **24** with the
   drawn figure moving 70.7 → 94.9 — up by exactly that increment. Nearly the same money, a
   quarter of the seeds, because the pool grows with the square root of *lifetime* earnings and
   you have already drawn what the first 500K opened. **Turning often now buys nothing.** That
   is the whole change; if a Turn ever pays as much as the one before it on the same money,
   something has regressed.
4. **Spend the pouch.** *Petals* now shows Saved Seeds and Daisy's next two prices. Buy **Rich
   Bloom** and **Quick Sprout** a few times and watch the price ladder climb — 2–5 petals per
   Turn is the intended feel.
5. **Check the never-resets list held.** Your gems, cards, packs, creatures, the Hollow,
   reputation, level and the Almanac are all untouched; your gold is back to 100, the badges are
   gone to be rebought, and plots 5–8 have closed for the rebuy. The Turn is what took them, and
   the spec says so.
6. **Fall is open now** (it unlocks at Turn 1). *Fall* → **Fill the bed** → **Ripen the bed** →
   **Harvest the bed**: eight crops, and the windfall pays **+50% on the whole bed** because
   every plot was planted and ripe. That is the appointment Fall is built around.

**The question that was waiting on you is answered** — you ruled the mint cumulative, phase 1.1
built it, and turning often now buys nothing (`node tools/year-sim.js 12 all` exits zero).
**The new one, in its place:** the blessing is now the largest per-Turn grant in the game and
nothing prices it — **95 Turns hand over every flower's Rich Bloom ladder, 318,189 Saved Seeds
of value, for about 2.5 days of play**, while the mint pays 997 seeds over the same span. It is
a ceremony beat, so the call is yours; four dials are named and none taken. See the open
decision in [11-known-issues.md](11-known-issues.md).

**Parked by this pivot, not deleted:** the map build-out, the Stand's expansion, the meadow's next
pieces, the bench surface, and the merge-central layout work in [28-the-loop.md](28-the-loop.md).
The order strip and the Shared Sky both survive as compatible later work; the Gardens Ladder is
where the map returns.

The build state below is unchanged and still accurate.

**The habitat direction is live and six creatures deep.** Pip, Thistle, Bramble, Luna, Ember and
Bumble all work end to end: attraction, arrival, stars, traits, tending, eight named pairs, keepsakes
kept as mementos, and **the Hollow** — a room under the garden, reachable from a burrow mouth, where
they live. See [22-creatures.md](22-creatures.md).

The obvious next pieces, roughly in order:

1. ~~**Swap the loadout from inside the Hollow.**~~ **Done 2026-08-18.** Pet and Loadout are modes
   on the Hollow's dock; a tap on a creature spends whichever is armed.
2. ~~**Feed.**~~ **Done 2026-08-18.** Three coin-bought foods; a fed creature works one star above
   itself. See above.
3. **Decorate, and it is where mementos finally go.** Agreed with the owner 2026-08-18 and **not**
   built: mementos buy **decorations and skins for the Hollow**, with a piece costing keepsakes from
   *two different creatures*, so decorating requires roster breadth rather than depth. The art
   already has a memento cubby waiting for it, and it is the *item-as-key* device in
   [17-market-and-positioning.md](17-market-and-positioning.md). **Still agreed, still unbuilt, and
   now queued behind the map** — mementos have had no sink since 2026-08-18 and this is the piece
   that closes that loop.
4. **More pairs, or a seventh creature.** Eight pairs of a possible fifteen. Any new trait must
   declare a `pool`, and the suite fails if the roster becomes all one kind of effect, if more than a
   third sits in `yield`, or if any creature ends up in fewer than two pairs.
5. **Chambers and sideways paging in the Hollow.** Agreed and unbuilt — but **hold it until the
   roster outgrows one room.** `Hollow.SPOTS` holds six positions and there are six creatures, so
   paging today means swiping from a full room to an empty one, which is the same failure the
   "one level first" rule already names for a second floor. It is the natural unit for decorating
   later, so build it behind a seventh creature rather than ahead of one.
6. **Flower breeding**, the second half of the direction. Cross two mature neighbours into a hybrid
   seed. It reuses the adjacency board and *generates* content rather than authoring it — but it
   changes the seed model, so it has a far bigger blast radius than creatures did.

**Two things are deliberately parked, not abandoned.**

**The Potting Bench** is built as simulation with **no surface at all** — Craft is still the third
dock tab and the bench fills its basket invisibly. Under the habitat frame it is optional. Decide
soon whether it gets a panel or gets deleted; dormant code nobody surfaces is what
[11-known-issues.md](11-known-issues.md) exists to prevent. If it ships, the remaining work is the
panel in `ui-sheet.js` (port the drag from `tools/merge-spike.html`, and watch the sheet's own
fling-to-dismiss fighting it) and the dock swap. **Its three quests are paused as of 2026-08-19** —
`q_tea`, `q_perfume` and `q_craft_2` were being handed out for a board that does not exist, so they
sat in the strip uncompletable. They keep their ids and their tuning, and three live stand-ins
(`q_discover_8`, `q_hold_60`, `q_honey_15`) carry their 98 of the ladder's 789 reputation. **If the
bench ships a screen, drop the `paused` flags and retire the stand-ins together** — one without the
other moves the ladder off 789 ([21-potting-bench.md](21-potting-bench.md#quests)).

**The card album vs the creature roster is an open decision.** There are now two collection systems,
and splitting Completion across two unrelated albums halves the pull of both. Creatures are coupled
to the garden and answer "why plant this flower"; cards are deliberately independent. Settle it
deliberately rather than letting it drift.

The Market as **customers who walk up to the garden fence** and the **world map** both remain good
and both remain unbuilt.

**The long-running open question — *does the garden's contents start mattering* — has an answer, and
it is creatures.** Bloom Mastery could not deliver it (a percentage of an undifferentiated thing is
still undifferentiated), and orders make a flower *instrumentally* wanted, which is a quota rather
than desire. Verbs and adjacency were the previous best answer and are still good. But **Pip comes
for bluebells and nothing else**, and raising a creature costs escalating harvests of *its own*
bloom — which is also the first real answer to **"why would I ever plant a Daisy again."**

The diagnosis that started all of it still stands as the thing to keep escaping: **every seed yields
exactly 1.4× cost at Common across all nineteen tiers**, differing only in throughput. Charming,
distinct-looking producers that all do the same thing is the AdVenture Capitalist decay pattern; see
[17-market-and-positioning.md](17-market-and-positioning.md).

**The world map is the direction, the design pass is complete, and the MVP is cleared to build.**
The spike stands as the art and camera reference. [25-world-map.md](25-world-map.md) is the design
document — inventory **frame → Garden Stand → Potting Shed surface → specialized biomes**, plus
the MVP scope — and [26-goods-catalog.md](26-goods-catalog.md) is the goods spec.

**Settled 2026-08-25:** the Stand builds first; the map pans freely at map altitude; the ceiling
is open with the not-a-clone bar per garden; goods are deep-botanical plus cottage crops, no barn;
and the build is **MVP-first** — plain map, functional Stand, polish later.

~~**The next task is the VISUAL GAP between the garden and the meadow.**~~ **Done 2026-08-25.**
The meadow is now a light warm-stone terrace with **dark cobbled cells**, running the garden's own
four tiers (ink / light body / dark cells / cream chips) and the full five-layer recipe including
the unblurred lip. Everything in a cell stands on a worn pad, keepers stand on a trodden patch, the
dry-stone wall is at a third of its old stone size and capped with coping stones, and the grass is a
soft mat with blades out of it drawn at the wall's *foot* rather than across its face. The material
was chosen to carry the verb: soil is temporary, cobbles are permanent. See
[05-art-direction.md](05-art-direction.md#the-material-recipe--why-the-garden-looks-finished-and-the-meadow-does-not)
and the top of [10-decision-log.md](10-decision-log.md).

**Three shipped-and-invisible bugs came out of the same pass** and are in the traps below: an empty
keeper stand whose icon had never rendered, both meadow clouds swept off the top of the viewBox
since the screen shipped, and a reduced-motion block that lost the cascade to the rules it was
meant to cancel.

**Then a second pass, the same day, on the owner's note that it still did not line up — and the
cause named the rule the docs were missing: *this is a phone game, and the garden looks right
because it is built for one.*** `.ui` is `max-width: 560px; margin: 0 auto`, and **a place layer
sits outside `.ui` and inherits none of it**. The Hollow is inside `.ui` and got it for free; the
meadow and the map are siblings of `.ui` because they paint *under* the HUD, so the meadow was the
only screen in the game running the full width of a desktop window. It now re-states the column
itself as `.mw-ui` — same cap, same padding, same rows. **Scenery is full-bleed, interface is
capped**, and any future room does the same. See
[08-ui-and-layout.md](08-ui-and-layout.md#this-is-a-phone-game-and-the-layout-says-so).

**The backdrop was doing the same thing in SVG.** It was composed at 390×844 and drawn with
`preserveAspectRatio="slice"`, which does not crop to fit — it *scales* to cover, so a 1440-wide
window multiplied every blade of grass by 3.7. The scene is now drawn 1:1 into the room's measured
box. "Too busy" was one attribute, not a decoration problem.

**Also in that pass:** the keepers left scene coordinates for the garden's own yard (a flex row in
the `.stage` padding, so a whole class of `getScreenCTM()` bugs went with them); the empty cell is a
dashed **rounded square** with a plus, the garden's `plantSpot` idiom, not an oval; and **the swipe
out of the room now starts anywhere on the board.** It had worked only on the slivers of scene
either side, which on a phone is most of the screen unreachable — the meadow's cells act on `click`
rather than `pointerdown`, so a drag may begin on one and withhold the click at the end.

**The meadow has locked land, 2026-08-25.** Cells 0–3 open; the rest gate at levels **5, 8, 11, 14**
and then cost **5,700 / 6,600 / 7,500 / 8,400**. `cellUnlockLevel` / `cellAvailable` / `cellLocked`
/ `unlockCell` mirror the garden's plot functions line for line and the cell wears the same
two-stage chip, because a second board teaching a second acquisition rule is the clone trap arriving
through the back door. **Every number is provisional** and belongs in the full retune. Buying fires
its own `cellUnlock` event — the garden's `unlock` centres confetti on a plot node, and in the
meadow the garden is `display:none`. 12 new sim-test assertions, at 914.

**The MVP is done.** The Stand and the map frame both ship. ~~What comes next, roughly in
order:~~ **This list is parked by the Garden Year pivot, 2026-08-29** — the map retires when the
season strip ships ([32-the-garden-year.md](32-the-garden-year.md)); Fall absorbs the Orchard's
role, Winter the long-clock role, and collect-all/land-buying die with the map. Kept for the
record:

1. ~~**The Wild Meadow**~~ — **done 2026-08-25**, art included.
2. **The Orchard** — the long-clock producer, and the natural home for collect-all. It is also the
   first place that will want its own keeper slots, which is when the creature-station question
   stops being scoped to one room.
3. **Play it and judge the feel** — the rubric is in
   [25-world-map.md](25-world-map.md#the-mvp-decided-2026-08-25--build-plain-test-the-feel-polish-as-we-go).
   The load-bearing question: *does checking the Stand pull you back into planting something
   specific?* If not, the order generation weights are wrong before anything else is.
4. **Collect-all**, gated on a region being fully automated, with the 2× rewarded video on it —
   the map's honest revenue argument and the reason the drone becomes an unlock. **The Orchard is
   its natural home**, being long-clock and low-interaction by design.
5. **Buying land**, off Stand reputation, which turns the refusing parcels into the progression
   gate they are drawn to be.
6. **The Potting Shed surface**, which the goods decision already settled: every crafted family is
   a merge chain on the bench, and the prototype Craft tab retires when it lands.
7. **Creature stations across the whole map**, now that the meadow has proved the shape in one
   room. Traits and the eight pairs are still balanced against a single garden, so this is the piece
   with the real blast radius.

**Resolved by the goods decision:** the bench ships a surface (every crafted family is a merge
chain on it), and the prototype Craft tab retires when it does.

**A caution recorded so it stays visible.** The map manufactures collection moments, and a 2×
rewarded video on a collect-all is the best-converting placement in casual — Kolibri takes roughly
60% of Idle Miner Tycoon's revenue from that pattern. That is a real argument for the *first*
region and not for six. The closest cozy comparable, **Cats & Soup, does roughly $300K/month on
10M+ Play installs**, and **Terrarium: Garden Idle earns ~$9K/month on 11M installs** — reach
without a reason to spend. Building a bigger map does not move this game toward the first number;
distribution does. See [17-market-and-positioning.md](17-market-and-positioning.md).

## What comes after

1. ~~Lock the resource graph~~ — **done**, see [12-meta-layer-design.md](12-meta-layer-design.md).
2. ~~Spec the order system~~ — **done**, see [13-order-system.md](13-order-system.md).
3. ~~Economy model skeleton~~ — **done**, see [14-economy-model.md](14-economy-model.md). Structure
   is locked; the numbers in it are deliberate placeholders.
4. ~~Prototype the Garden ↔ Apiary loop~~ — **done and playable**. Mechanics in
   [03-systems.md](03-systems.md); run `node tools/sim-test.js` after any change to it.
5. ~~Decide the navigation structure~~ — **done**, [15-navigation-and-ia.md](15-navigation-and-ia.md).
6. ~~Navigation phase 1~~ — **done**, see above.
7. **Play the loop and judge it — in progress.** Hold-to-tap, Balanced sort, and the three tap
   procs (above) are texture added toward this question. Bloom Mastery was expected to answer it
   and does not — see "The current task". The question stands: does the garden's *contents* start
   mattering — do you plant lavender because you want lavender honey? Content decisions wait on
   that answer, and the honest place to get it is the Market.
8. ~~**Progression and quests — specified, current task.**~~ **All five phases done.** See above
    and [16-progression-and-quests.md](16-progression-and-quests.md). The map stays ahead of this
    only in the sense that a map full of places is worthless if nothing tells you why you're
    going anywhere — that reason now exists.
9. ~~**Bloom Mastery**~~ — **done 2026-08-14.** Phase 5 of
   [16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery). Per-seed
   endless ladders paying a permanent per-seed yield bonus, one gem every fifth tier.
10. **The Market** — see [13-order-system.md](13-order-system.md). Still valuable as the goal
    generator, the reputation source and the entire liveops surface. **No longer load-bearing for
    "why this flower"** — that burden moved to per-plant verbs. Skipping is now specified as free.
11. **The world map** — navigation phase 2, queued but paused. Unblocks everything else in the
   meta-layer.
12. **Tune the economy for real.** Every number today is a placeholder. Also worth a look: the three
    new proc badges were repriced once (with Sprinklers) but *not* re-cut when their trigger rates
    were cut again the next day — see [04-economy.md](04-economy.md) for the reasoning and a
    deliberate open question about whether that needs revisiting.
13. **Fix the known economy bugs** before building content on top of them.

### The build order agreed 2026-08-14

This supersedes the ordering above where they conflict. Reasoning in
[10-decision-log.md](10-decision-log.md).

1. ~~**Per-plant verbs and adjacency**~~ — **done 2026-08-14.** Six seeds carry a verb; the other
   thirteen stay plain yield tiers on purpose. Expanding the set is cheap when the mechanic proves
   out — it is one `DATA.verbs` entry, one `verb:` field and a consumer.
2. ~~**Mutations and variants**~~ — **built 2026-08-15**, steps 1–4 of
   [18-mutations-and-weather.md](18-mutations-and-weather.md): epoch-clock weather, four mutation
   tiers, Beacon stacking, visuals. Measured at ~20% of income, evenly across seeds. **Steps 5–6
   remain** — offline reconciliation and card generation.
   **Mutations do *not* feed the card album** — an earlier claim that they did is retracted; see
   [19-card-album.md](19-card-album.md).
3. **Named synergy pairs** — one data row and a name each; companion planting writes itself.
4. **Fold the Apiary and Apothecary into adjacency**, and move the dock to
   `Garden · Cards · Market · Shop` ([15-navigation-and-ia.md](15-navigation-and-ia.md) phase 1.5).
5. **Item-as-key, mementos, hidden blooms, and companion flavour text** — ~150 lines of writing is
   the cheapest differentiator available and the talking flower is a ready-made delivery vehicle.
6. ~~**Two-axis offline earnings (rate × duration)**~~ — **done 2026-08-15**, along with the
   welcome-back scene it reports into. Both axes are upgradeable and clamped, the cap is stated
   openly, and income only accrues from automation the player actually owns.
7. ~~**The card album**~~ — **built 2026-08-15**, minus the spawning proc, dust, seasons and
   completion rewards. [19-card-album.md](19-card-album.md). A **parallel meta, independent of the
   garden**: packs from quests, levels, dailies, the shop and a random spawn on a plant; ~12 sets of
   9 per themed season, with its own art and story. Model a card as an owned instance with an id, not
   a boolean, so dust and any future trading stay possible. **Paid randomized packs are loot boxes —
   read the warning in that doc before touching monetization.** Separate from the species Almanac in
   [16-progression-and-quests.md](16-progression-and-quests.md), which stays coupled to the garden.
8. **The Market.**
9. ~~**Gem sinks**~~ — **done 2026-08-15**, along with the gem-faucet inversion. Cosmetic breadth
   is the remaining piece: a fixed catalogue always gets bought out, so gems need either escalating
   prices or a growing list. Card packs are the eventual infinite sink.
10. **Seasonal turnover** (prestige) — designed now, built later. Never call it a reset.

Not on the list, deliberately: trading, battle pass, live events, PWA/service worker, world map,
merge.

## Known problems worth knowing immediately

Full list in [11-known-issues.md](11-known-issues.md). The four that affect design decisions:

- **`year-sim` does not decide the same way twice any more** (2026-08-30). Raising order gold moved
  the two shapes it compares inside its own noise: five runs, three OK and two FAIL. It is a GOLD
  result, never a Saved Seeds one, so the mint is still split-neutral. **Do not read a single run of
  it as a verdict until it is seeded and multi-run** — and do not "fix" it to pass. The arithmetic
  and the two ways out are in [11-known-issues.md](11-known-issues.md); the choice is the owner's.

- ~~**Endgame seeds have lower gem chances than a Daisy.**~~ **Fixed 2026-08-15.** Gem chance is now
  derived from grow time, so gems per hour is flat across all nineteen seeds and gem income tracks
  time played rather than seed choice.
- **Cheat buttons ship to players — on purpose.** Settings has "Grant 50 Gems", "Grant 1,000,000
  Gold", and "Summon a Wonder Effect" with no confirmation, live on the public site. **Decided
  2026-08-14: leave them.** The audience is friends, their sessions are not clean data, and the game
  has no analytics either way. Revisit before any real external audience; don't re-raise it before
  then.
- ~~**Nothing enforces the visual standard.**~~ **`tools/style-check.js` does, as of 2026-08-30.**
  Run it whenever you touch `style.css`; `node tools/sim-test.js` now also holds twenty *design*
  rules, not only economy ones. Both **ratchet against a recorded baseline** rather than failing on
  the debt that was already there, so they pass today and go red on what you add. **What is left is
  a palette decision, not a sweep**: ~94 distinct colours with no token near them, and 29 more
  within a hair of one — `#fff8e8` against `--paper` `#fff8e7` — where the file cannot tell you
  which are typos. `node tools/style-check.js --strict` prints the worklist. See
  [42-overnight-housekeeping.md](42-overnight-housekeeping.md).

That inversion was inherited from the frozen economy port; it is fixed. What remains from the port is
the Orchid throughput dip and the identical Aurora/Celestial rates.

## Traps in this codebase

**A timer that schedules against the AudioContext clock must check `ctx.state`, because a frozen
page stops that clock and not the timer.** `tone()` writes `ctx.currentTime + at`; the three
schedulers that call it run on `setInterval`. Sleep a laptop or lock a phone and the context
suspends while the intervals keep ticking, so every step banks another note against a clock that is
not moving — measured at **81 notes fired into 2.45 s** after thirty seconds away, nine of them on
the same sample, scaling linearly with the absence (an hour is ~9,700). The same bug was already
fixed once in another disguise: muting used to leave the scheduler running. **Write the guard
`!== 'running'`, never `=== 'suspended'`** — iOS reports `interrupted`, and `wake()` twelve lines
above contains the wrong spelling ready to copy; a desktop suite goes fully green with the phone
still broken. And put the guard **above** the bar counter, not below it: below, the notes stop and
the progression still walks, so the tune comes back on the wrong chord and doc 06's "the bar clock
is never restarted" quietly becomes false.

**`tap:#newsOk` RELOADS the page, so anything injected before it is destroyed.**
`DATA.announcements[0]` carries `reset: true`, which `ui-news.js` handles with
`Game.reset(); location.reload()`. A probe script that patches the page and *then* dismisses the
announcement reads back `undefined` and looks like a broken instrument — it cost three runs to find.
Dismiss first, patch second, gesture third. Same family as the `pagehide` trap below: the page you
are setting up gets replaced out from under you.

**`opacity:0` HIDES a layer. It does not RELEASE it — and the bill is memory, which no frame timer
can see.** A `mask-image` or a `mix-blend-mode` puts an element on its own composited layer and
holds a full-window backing store there (width x height x dpr² x 4 bytes) for as long as it is in
the tree, drawn or not. Eleven of those hung over a clear sky: **80 layers, 343 MB at DPR 3**, of
which 118 MB was masks on invisible weather. On a desktop that costs nothing, which is why every
frame measurement ever taken on this game called it healthy; on iOS it is the budget a tab gets
killed for. `node tools/probe.js layers:3` is the instrument. The fix is to drop the mask and the
blend under a `:not()` gate naming the state that needs them — **not `display:none`, because you
cannot transition out of `display:none`** and every fade-in becomes a pop. And watch for the
opposite trap in the same breath: a fix that helps frame time can be a liability in memory. This
pass's own veil rewrite was a clean win on the timer and the single largest layer in the game at
90 MB.

**A custom property written on a HIGH element invalidates everything beneath it, and the cost is
WHICH ELEMENT — not which property, and not how many.** Three `--shake-*` writes on `#game` measured
2.5–3.4 ms a frame; the identical transform written straight onto `.world` measured 0.004 ms. Seven
sky values on `document.documentElement` measured 3.7 ms a call against 0.19 ms for the same seven
on the three elements that read them. Nothing about this is visible in a profile as "custom
properties are slow" — the same write on a leaf is free. **The corollary bit this project twice
over:** adding a subtree that reads a lot of `var()`s makes every unrelated root-scoped write dearer
for the whole page, so the Sky Pass's twenty-four element `#wx` box — three percent of the tree —
took a full recalc up about 40% and pushed two pre-existing per-frame writes past the frame budget.
The feature that got slower was not the feature that changed. Write a value on the element that
reads it, and keep the `:root` declaration as the first-paint default.

**A headless page nobody is looking at does not paint, and a bench that does not know that is
confidently wrong.** `tools/probe.js` runs Chrome with `--disable-gpu`, and an offscreen page
composites lazily — so a frame bench reported 2 ms for a sky running nine full-screen blends and
looked entirely healthy. `paint:on` opens a screencast and throws the frames away purely to force
real ones. Two siblings of the same trap, both of which produced a plausible table before they were
caught: **the What's New sheet's backdrop blur costs more than any sky**, so a bench that does not
`tap:#newsOk` first measures the dialog; and **a second session's Chrome on the same machine moves
every number by a factor of five**, which is why a rendering change is A/B'd inside one run —
inject the rules you replaced, alternate which arm goes first — rather than measured before and
after. See [09-conventions.md](09-conventions.md).

**An infinite animation declared in a BASE rule runs forever, on elements nobody can see.**
`.wx-ray` and `.wx-front-cloud` were the only two of roughly a hundred and fifty animations in the
stylesheet that carried no state gate, so ten promoted layers — four of them blurred and masked —
animated under every sky from page load, for a sunbreak that lives thirty seconds an hour. Gate it,
and gate it with a **`:not()`** rather than the obvious positive selector: the `animation` shorthand
resets `animation-delay` (which deletes the whole point of a staggered set), a positive gate
out-ranks the reduced-motion cancel at the foot of the file and hands the motion back to a player
who asked for stillness, and `animation-play-state:paused` keeps the layer promoted so it removes
the motion and none of the cost.

**A class name in a 250KB stylesheet is taken until you have PROVED it is not, and the collision is
silent AND invisible.** `.chip.wx` and then `.chip.sky` both picked up a
`position:absolute; inset:0` layer — the Sky Pass's weather layer and the scenery's sky. The chip
looked perfectly correct in its row while measuring 390×844 and swallowing every tap on the garden;
the first automated tap on it summoned a Wonder Effect from the flower underneath. Nothing threw,
nothing failed a check, and a screenshot of the rail was reassuring. **Grep for the bare name first**
(`grep -cE '\.name([{ ,:.]|$)' style.css`) and **measure the box after**, because the rendered
picture will not tell you.

**A margin on one side of a `place-items:center` child shifts it by HALF of itself, and equal margins
only cancel while they fit.** `.fl-wrap{margin-bottom:46px}` is where Fall's measured 23px board
offset came from. The obvious repair — the same margin on both sides — works until the item overflows
its track, at which point a grid falls back to start-alignment and the child moves by a whole strip
instead of half of one. On a 640-tall screen that turned a 23px error into a 52px one. **If two
things must line up, give them no margin and let whatever hangs off them be positioned absolutely.**

**Two pieces of tile furniture that can be on screen at the same time cannot both be centred on the
same edge, and the arithmetic settles it, not the screenshot at the reference size.** Fall's wait
pill was centred at `top:6px` and `#24` needed the top-right corner for a gem chip. At 390×844 a plot
is 110.1px, the widest three-digit chip is 43.5px and the widest ordinary wait ("7h 59m") is 48.3px —
so they overlap, and they overlap by *more* on every smaller viewport, because the pill's width is
set by its text and the tile's is set by the screen (98.4px at 390×640, 100.9 at 360×780, 88.7 at
320×568). A reference-size screenshot of two chips that happen to clear each other proves nothing;
measure both rects at the smallest supported tile. The pill moved to `bottom:16px`, which is where
Winter's `.wi-wait` already sat — **the cheapest answer to "where else can this live" is usually the
room next door that already solved it.**

**Hiding a grid row in ONE state gives its height back to the container in that state only.**
`.in-fall .rail{display:none}` was added to give the bed chip its band on a short screen and
immediately broke the board alignment it was there to protect, because `.stage` grew in Fall and not
in Summer. `visibility:hidden` keeps the box. Anything that hides a row conditionally has to ask what
the row's height was holding up.

**Two seasons that must look identical cannot each measure their own room.** Summer sized its board
from `.stage` minus the **measured** creature yard; Fall sized its from its own frame minus a chip
strip — and Fall hides the creatures, so that node measures zero there. Two formulas, two answers,
and they agreed at 390×844 only because width happened to bind at that size. `UI.boardSide()` is the
single function both call now, and it reads the yard's **reservation** (`.stage`'s bottom padding)
rather than the node. **`--yard-h` is therefore load-bearing for alignment**: anything that changes
how that room is reserved silently resizes one season's board against the other's.

**A guard can be belt-and-braces while its test looks load-bearing.** `fallHarvestAll()` carries an
explicit `def.century` check, and a sabotage that removed it **passed every assertion** — because a
Century Bloom never carries a `windfall` mark, so the real exclusion happens a line earlier. The test
was asserting a ruling that nothing in the code path could violate. Sabotage with the *realistic*
wrong implementation (here, a loop over everything ripe), not with the removal of the line you just
wrote, and assert the fixture itself is in the state you think it is.

**`tools/probe.js`'s documented lawn point no longer starts a season swipe.** `drag:@30,600:...` at
390×844 is in the usage header as "the lawn", and it does nothing now — verified against `HEAD` as
well, so it is not a regression from any recent change. The season tabs
(`tap:[data-season="fall"]`) work and are how everything in the fix round was driven. Anything
relying on that drag point should re-derive it before believing a red result.

**A long dev sheet scrolls, and `tap:` cannot reach what is below the fold.** The probe taps an
element's measured centre, and an element scrolled out of the viewport gets no event — the Turn-jump
button reported a successful tap and did nothing. `scrollIntoView({block:'center'})` then `.click()`
in a single `eval:` goes through the same delegated handler a thumb does.


**A depth counter over backticks does not find a nested template literal, and the miss is silent.**
The first backtick *inside* a template opens a new one — it can only appear inside a `${}` — so
counting them as one depth makes a nested case read as a closed span. `tools/html-check.js` shipped
that way for an hour and passed a deliberately planted
``${a ? `<span title="${S.profile.name}">` : ''}`` without a word. It keeps a mode stack now, `tpl`
and `expr` frames with a brace counter per expression so an object literal cannot end one. **The
general rule is the one that found it: a check that has never gone red is not a check.** Break a new
guard four ways — the obvious one, a nested one, a different file, a different spelling of the same
accessor — and confirm a *fifth* case that is legal stays green.

**The five-layer material recipe does not survive a change of aspect ratio.** Its two blemishes are
`radial-gradient(circle at 26% 22%, … 12%, …)` — a *percentage* radius, resolved against the box —
so the speck that reads as dirt on a 100px plot is a 39px grey bruise across a 300px menu row. Every
wide card in this game is a two-stop gradient for this reason; `.seed-row` is the one to copy. Same
family as the meadow's oversized stones: a recipe composed at one size, reused at another.

**A surface that must not be painted over cannot live inside `.ui`, and one that lives outside it
inherits nothing.** These two pull in opposite directions and the menu drawer sits between them.
Inside `.ui` it would be covered by the FX float layer at `z-index: 40`; outside, it loses the
`max-width: 560px` column and flies to the corner of a desktop window — which is exactly what it did
first, while looking perfect on a phone. `.sheet` re-states the column with `max-width` +
`margin: 0 auto` because it spans it; the drawer is pinned to one edge, so it says the same thing as
`right: max(0px, calc((100% - 560px) / 2))`. **Whichever side you land on, measure it against
`.ui`'s own rect on a wide viewport before believing it.**

**Hiding a coach mark needs BOTH halves, because `refreshCoach()` runs on the 0.6s tick.** The JS
guard stops a hidden target being *measured* (a 0×0 rect parks the bubble over the wallets); the
declarative rule stops it being *painted*. With only the guard, "Tap the flower!" sat on top of the
new menu for up to half a second every time it opened — long enough to photograph, which is how it
was found. `.sheet.open ~ .coach` and `.drawer.open ~ .coach` are the two rules; both work by DOM
order, so anything new that covers the garden has to come *before* `.coach` in `index.html`.

**A panel that slides in cannot be tapped until it has arrived, and automation will not wait for
you.** `tools/probe.js` taps an element's centre, and a drawer at `translateX(102%)` has its centre
outside the viewport, where events are not delivered. Two runs of this suite reported "nothing
matches .pencil" and looked like a broken render. Put `wait:450` after opening any transformed
surface before tapping into it — the transition is 340ms.

**A drawer covers the button that opened it.** So "tap the toggle again to close" is not a dismissal
a thumb can reach, however reasonable it sounds in a spec — the spike promised it and it was wrong.
`document.elementFromPoint()` over the button's own centre is the one-line way to check. What is
left is the gesture and the scrim, which is why the strip of garden the drawer deliberately leaves
visible is load-bearing rather than decorative.

**`tools/style-check.js` counts occurrences, so a correct change still turns it red.** A new
component that reuses the house recipe exactly — same gradients, same lip, same drained family —
adds *uses* of colours the file already had, and the ratchet cannot tell that apart from drift. The
check that actually answers docs/05's fifth question is the **distinct set**: dump it from
`--strict` before and after and diff them. The menu drawer added eight occurrences and **zero** new
colours, which is a re-baseline; a change that adds a colour is a conversation. It caught two real
violations on the way, so do not skip it — a hex fallback inside `var()`, and a drained ink invented
where the locked seed row already proves the drained *surface* is enough.

**`tools/export-icons.js` scanned only `data.js` for `icon:` rows.** The menu is the first table of
icons that does not live there, and four live glyphs reported as `**not referenced anywhere**` in the
manifest the Unity team reads — a lie in a generated document, which is worse than a blank. It reads
`ui-*.js` too now. Any future table of icons outside `data.js` should check the manifest afterwards
rather than assume.


**A gallery of screenshots is a different sky every run unless three separate things are pinned,
and none of them is obvious until the pictures come out wrong.** `tools/capture-screens.js` hit
all three. (1) **The What's New announcement goes up over a fresh boot**, so it was in front of
every screenshot — it is marked read once for the whole run, and still gets its own picture
through `UI.previewAnnouncement()`, which shows it without resetting the save. (2) **Weather is a
hash of epoch time**, so roughly a third of runs boot straight into rain or a storm, and asking
for clear does not undo it in the same frame: ending a sky holds the layers for `HOLD[standing]`
— eight seconds for rain and storm — and rain or storm ending into *daylight* hands over to a
thirty-second sunbreak on its own timer, on purpose. Wait for `UI.wxHoldsSky()` to go false
rather than guessing a delay, then call `UI.startWeather()`, which is the only public entry point
that runs `sunbreakOff()`. (3) **The day/night cycle is six minutes long**, so scenes captured
minutes apart get different skies. Pin it through `DAY.offset`, **not** by stubbing
`Game.dayPhase` — `offset` is the knob both readers go through, and stubbing the getter pins the
picture while leaving `Game.isNight()` still answering from the real clock, which is how you get
a moonlit Hollow behind a midday garden.

**`.dock-btn` matches thirteen elements, not five.** The Hollow and the Wild Meadow each carry
their own dock, and all three are in the DOM at once. Anything counting or addressing the garden's
Big Five has to scope to `#dock`. Found by an assertion that failed on a screenshot that looked
perfect.

**An icon added to `icons.js` in the second `Object.assign` block is invisible to anything that
parses the file.** `LIB` is built in two parts — an object literal, then `Object.assign(LIB, {…})`
— and the public surface is `{ get, has, hydrate }` with `LIB` private and `get()` falling back to
`sparkle` for an unknown name. So the registry can be neither parsed reliably nor enumerated by
probing. `tools/export-icons.js` runs the module with one anchored substitution that hands `LIB`
back, and refuses to run if that anchor has moved. The count assertion is the point of the script:
an icon with no `.svg` beside it leaves the directory looking complete and one glyph missing from
everything downstream.

**Three art files draw every state at once and let CSS choose one.** `critters.js` and
`customers.js` emit all the eyes and mouths together — exported raw, a creature has open eyes,
shut eyes and floating Zs simultaneously — and the Talking Flower's eyelids are full-height rects
that `style.css` collapses with `transform: scaleY(0)`, so it exports **asleep**. Separately,
`flora.js` writes `fill="url(#gp-daisy)"` and keeps those gradients in a hidden `<svg>` that
`injectDefs()` appends to the page, so every bloom exports as a hollow outline. All four are fine
in the game and all four break the moment the markup leaves it. See the samples section of
[45-asset-inventory.md](45-asset-inventory.md).

**`transform`, `filter` and `animation` are one property each, exactly as `box-shadow` is, and the
Sky Pass stepped on all three in one round.** The storm's crouch wrote a bare `transform` and
deleted the `translateX(-50%)` that centres a creature on its `left` anchor, so every pet jumped
half its own width sideways. The rain's glisten wrote a flat `filter` and deleted a mutated bloom's
glow — the single visual the whole mutation mechanic rests on, gone for the length of every shower.
And both plant hooks wrote `animation` and replaced the ripe wiggle, so a ready flower stopped
inviting the tap for a quarter of all slots. None threw, none failed a test, and two were in
screenshots nobody had questioned. **Where the added value varies, compose through a custom property
the base sets** (`--wx-own-glow`, `--wx-wet-b`); where it does not, **list the existing value
alongside yours**. The recorded lesson said `box-shadow`; the lesson is the property list.

**A `filter` cannot carry a mask, so nothing that owns the bottom edge may take one.** Every other
tint in the game fades out over the last 44px because iOS paints the strip below a short window with
the flat lawn colour — but `mask-image` does not reach a `filter`, and two of them reached the
bottom: the lawn's wetness and Wonderfall's breathing saturation on `.scenery`. Darkening or
saturating the bottom of the world has to be done with a *layer* that can be masked, not with a
filter on the element that owns the edge.

**A `z-index` on a layer that holds blended children silently kills every blend inside it.** A
positioned element with a `z-index` is a stacking context, and a stacking context is an isolated
blending group — so `mix-blend-mode: multiply` on its children blends against *transparency*
instead of against the sky beneath. The sky spike's weather layer shipped with `z-index: 15` and
every wash, dusk, ribbon and veil composited as a flat overlay: it looked plausible, it was not the
specced compositing, and no error was raised anywhere. The weather layer now carries **no**
`z-index` and relies on DOM order, with the siblings above it carrying their own. Anything future
that blends with the scene has the same constraint, and `isolation: isolate` is the same bug spelled
differently.


**Writing a `height` onto a clip box pinned `inset:0` paints nothing, silently.** `.turn-fill` is
`position:absolute; inset:0; overflow:hidden` and the water is its `::before` reading `--year-p`.
`ui.js` wrote `el.yearFill.style.height`, which over-constrains the box (top, bottom and height all
set, so `bottom` is dropped), shrinks the clip from the top, and leaves the waterline at `0%`. **The
dock's year meter had never once painted** and nobody noticed for two days, because a meter that is
empty looks exactly like a meter at zero. Two commits a day apart each did half of one design; the
lesson is to check that the thing you are styling is the thing that draws.

**A collapsed animation must never be the only carrier of a STATE.** The global reduced-motion clamp
runs any animation once for `.001ms` with no fill-mode, so the value it was animating simply reverts.
The ready Turn button's whole signal was a breathing gold ring, and its attention dot is suppressed on
the assumption that the button is breathing — so **a player with the preference on had no ready signal
at all**, and it reviewed as correct for weeks. `node tools/probe.js media:reduce page:index.html` is
now the way to screenshot it. Where a state animates, reduced motion needs a *static substitute*.

**`box-shadow` is one property, and the trap runs BOTH ways.** The recorded version is a state
modifier deleting the base lip. The mirror bit this round: `.pack-reveal:not(.is-new) .pack-card`
(drained paper) and `.pack-reveal.r-legend .pack-card` (the gold ring) are the **same specificity**
— `:not()` contributes its argument — so the later rule won outright and a spare Legendary wore the
dark body's lip and bruise on a cream body. When two independent facts want the same property, give
one of them a **custom property** (`--pc-ring`) and compose, instead of restating the other's whole
stack in every combination.

**A coach mark centred on a screen-edge tab lands exactly on the band.** A season tab's midpoint is
the same height as the UPGRADE pill and the POWER-UP button, and in Fall on a short screen it is also
the bed chip's row. `placeCoach()` now asks those three nodes where their tops are rather than
guessing a constant — and **a side mark the clamp pushes clear off its own tab flips back to the
stacked shape**, because a sideways arrow pointing at nothing is worse than a down arrow that reaches.

**A hidden target measures 0×0, so a coach mark has to be NOT SHOWN, not merely not painted.**
`.in-meadow .coach{display:none}` hides the bubble but leaves `refreshCoach()` happily measuring a
collapsed season tab and parking the mark over the wallets. Every room that can be up is named in the
guard now. (`docs/08` claimed `.in-hollow` hid coach marks in CSS; it never did.)

**A dispatched TOUCH drag is read as a pan and cancelled after the first move.** On a page with no
`touch-action:none`, CDP's `Input.dispatchTouchEvent` produces `pointerdown → pointermove →
pointercancel`, so a gesture that works perfectly in the hand dies in automation and looks broken.
`tools/probe.js`'s `drag:` step sends **mouse** input instead — still real browser input with a live
pointer, which is the thing a synthetic `PointerEvent` is not. Its `drag:@X,Y:DX,DY` form exists
because the garden's swipe only starts on the background and the centre of anything big enough to
name is covered by the board; `@30,600` is the lawn at 390×844. Keep the endpoint inside the
viewport — events dispatched outside the window are not delivered.

**A new test group is worth sabotaging before it is worth believing.** `bill 1c` shipped with three
assertions that could not fail: one asserted a getter after a Turn had already emptied the bag, one
table (`DATA.dailies`) was not in the audit at all, and a typo'd booster id on any rung but the one
the walk happened to cross paid nothing while the level-up toast still announced a power-up. All three
looked fine and read fine. **Break the guard, run the suite, and check that the assertion you meant to
write is the one that goes red.**

**An absolutely-positioned child of a `place-items: center` grid container is sized to its content,
not stretched — even with `inset: 0`.** The announcement dialog's scrim was `position:absolute;
inset:0` inside a centring grid, and it measured **0×0**: `align-self`/`justify-self` from
`place-items` apply to abspos children and override the fill, so the four zero offsets only decide
*where* a content-sized box lands. There is no error and no warning — the game behind a modal simply
stays bright. Put the dim on the layer itself, or say `place-self: stretch` on the child. Found by
reading `getBoundingClientRect()` after a screenshot looked wrong; it survived one round of "the
opacity must be the problem".

**A modal that must not be painted over has to live OUTSIDE `.world`.** `FX` builds its float layer
as a child of **`.game`**, so a coin float from a harvest that landed while the dialog was up drew
straight over it — z-index cannot help, because the two are in different stacking contexts. `#news`
is a direct child of `.game`, after `.world`, for exactly this reason. Anything future that must be
the topmost thing on screen goes there too.

**A sheet that opens and closes inside one gesture reads, afterwards, as never having opened.**
The `.replant-chip` trap test asked "did the seed picker come up?" with `UI.sheetMode()` half a
second after the tap, and got `null` — from a build with `stopPropagation` deliberately removed, in
which `UI.openSheet('seeds', 0)` had demonstrably run. The rest of the same pointer sequence closes
it again. **Instrument the call, not the resulting state**: wrap `UI.openSheet` and push its
arguments onto an array. The same tap in the *affordable* case does not open the picker at all — the
chip plants first, so the plot the bubbled event reaches is no longer empty and `onPlotTap()` falls
through to `Game.hasten()` instead, silently stealing a growth tap. So the propagation guard has two
distinct failure faces and neither is the one the punch list predicted; the detectors that catch
them are the `openSheet` call log and the plant's `grow` against the seed's base `grow`.

**A group that opens with `G.reset()` cannot see a gap in `clearGarden()`.** `reset()` does
`Object.assign(state, defaultState())`, which rebuilds `state.grid` wholesale — so a new per-cell
field missing from the `clearGarden()` fixture is invisible to the first assertion after the reset,
and a sabotage that removes it stays green. The fixture line still matters, because dozens of groups
call `clearGarden()` mid-run with no reset in front of it. Hold it with an assertion that *plants,
harvests and then clears* inside its own IIFE; that one goes red.

**A shared control priced for a NUMBER does not fit a column when its label is WORDS.** `.price` is
a pill sized for "1,500" beside a 15px coin; "Watch an ad" beside a video glyph is nearly three times
that, and a food column is 107px wide at 375. The fix was not a smaller font on its own — it took
the whole column (`width:100%`), a 10px ink, a 12px glyph and explicit permission to wrap
(`white-space:normal`), and the numbers are what settled it rather than an argument: **91×22 on one
line at 375 with the button height unchanged at 140px, and 79×33 on two lines at 360 where every
button in the row grows to 148 together** — so the row never goes ragged and nothing overflows at
either size. Measure the pill against the column before assuming a shared component transplants.

**A backfill that runs on first READ hides a missing merge line from the test that was written to
catch it.** `state.ads` got its `load()` re-merge and an assertion in the same commit, and the
assertion passed with the re-merge deleted — because it asked a getter, and the getter's own day-roll
rebuilds the missing fields before answering. The half that cannot self-heal is the one `load()`
*writes*: `undefined + 1` is `NaN`, `NaN || 0` is `0`, and the player is silently pushed back into a
first session with `"sessions": null` on disk. **Read the object straight off `load()`, before
touching any getter**, and remember that the case needing the line is a PARTIAL save object — an
absent key takes the whole default from the shallow assign and is fine either way.

**`check(name, () => expr)` in `tools/sim-test.js` passes vacuously.** The second argument is a
condition, not a thunk — a function is truthy, so the assertion reports `ok` without ever running.
Two written that way in this pass both "passed" and were testing nothing. Grep a new group for
`check('...', () =>` before believing it; the same family as the `gardenwonder.save` key already
recorded below.

**A season's scene has two visible bands, not one canvas.** The board covers the middle of the
screen — roughly y 25%–70% on a phone — so anything composed into it is drawn and then hidden. Fall
shipped with its horizon, its hedge line, its stubble and both orchard trees all behind the board,
and the only strip a player could see was a flat colour field. Compose into the top band (sky,
horizon, hedge line) and the bottom one (ground, texture, props), and check by looking rather than
by reading the coordinates.

**A layer at `z-index` below `.ui` needs `.in-x .ui{pointer-events:none}` or every tap dies.** This
is already recorded below for the meadow and the map, and it was stepped in again the moment a new
place layer was added: the season gate's "Back to the garden" was the only visible control on its
screen and it was inert, because `.in-gate` shipped with the `display:none` half of the pair and not
the `pointer-events` half. **Whenever you add a `.in-something` block, copy BOTH lines.**

**One pair of gesture-origin variables is a two-finger bug waiting to happen.** The swipe recorded
`navX0/navY0` with no `pointerId`, so a second thumb landing anywhere overwrote the origin and the
first thumb's release measured the distance between the two — on a 390px phone two thumbs sit ~250px
apart horizontally and a few pixels apart vertically, and the core loop *is* rapid two-thumb tapping.
It cost a season change per double-tap the moment a horizontal axis existed. Record the
`pointerId`, ignore releases from any other, and clear the origin on `pointercancel`.

**A room's own state is not the same variable as the room you are looking at.** The vertical ladder
was gated on `season !== 'summer'`, but a locked-season gate is held in a *different* variable and
leaves `season` untouched — so the ladder still fired from the gate screen and left two place-states
on `#game` at once. Anything that guards on "where am I" has to name every variable that can answer.



Things that cost real time to discover. None are visible from a casual read.

**A state modifier that sets `box-shadow` silently deletes the lip.** `box-shadow` is one property,
so `.cp-card.bad { box-shadow: inset 0 0 0 2px #… }` overrides the base rule's
`0 3px 0 var(--ink-2)` entirely. Every component in this game carries its lip in `box-shadow`, and
every "add a coloured ring for a state" edit is therefore a lip deletion unless the lip is restated
in the modifier. It bites hardest where it matters most: the affected rules are the *states* — fed,
hungry, napping — so the object loses its material in exactly the moments a player is looking at it.
Grep the modifier for `box-shadow` before adding one, and restate the lip.

**A place layer sits OUTSIDE `.ui`, and `.ui` is the only thing that makes this a phone game on a
desktop.** `.ui` is `max-width: 560px; margin: 0 auto`; `.hollow` is inside it and inherits that,
but `.meadow-layer` and `.map-layer` are siblings at `#world` level because they paint under the
HUD. A room built as a layer that does not re-state the column is the only screen in the game that
fills a laptop window, and it will read as a different, worse game beside the garden. Scenery
full-bleed, interface capped.

**`preserveAspectRatio="slice"` does not crop to fit — it scales to cover.** A backdrop composed at
390×844 and sliced into a 1440-wide window is drawn at 3.7×: grass becomes a hedge, a tree fills a
third of the screen, and the thing you wanted at the bottom is off it. Draw a room's scene at the
size the room actually measures, memoise on that size so a resize redraws, and position everything
as a fraction of it.

**A gesture may begin on a control that acts on `click`; it may not on one that acts on
`pointerdown`.** This is the whole distinction. The meadow's cells are click-driven, so a swipe can
start on one and simply withhold the click at the end — and it has to, because excluding them left
the swipe working only on the slivers of scene either side of the board. The flower is
pointerdown-driven and stays excluded; that tap latency is load-bearing.

**A backtick inside an HTML comment terminates the template literal it is written in.** Commenting
`.ui` as a code span inside a `build()` template turned the rest of the markup into a tagged
template call, and the error surfaced as `"<div class=…" is not a function` at load. Use plain
prose in markup comments.

**An inset box-shadow paints UNDER an element's content.** Give a surface an opaque child — a
floor, a fill, a full-bleed SVG — and its `inset` lit top edge and shaded bottom vanish, silently
and with no error. Half the house material recipe disappeared from the meadow's cells this way. The
edges have to ride an overlay above the child, which is what `.mw-cell::after` is for.

**A CSS `transform` REPLACES an SVG `transform` attribute, it does not compose with it.** Animating
the same `<g>` that carried `transform="translate(x y)"` sent both of the meadow's clouds to y=0 and
off the top of the viewBox — they had been invisible since the screen shipped, in a sky that just
looked empty. Position on an outer group and animate an inner one. Related: `vw` inside an SVG
resolves against the page, not the viewBox, so a keyframe written for a DOM element is not portable
into SVG.

**A `prefers-reduced-motion` block must come AFTER every rule it cancels.** A media query adds no
specificity, so a reduced-motion `animation:none` sitting above the animation it targets loses the
cascade and does nothing. The meadow's clouds, blades and fronds kept moving with the preference on,
and the block *looked* correct in review the whole time.

**Initialising a `dataset.look` cache to `''` breaks any state whose key is also `''`.** An empty
keeper stand's id is the empty string, so `node.dataset.look !== id` was never true and the sprout
marking a free stand had never once been drawn. Seed the cache with something no state can produce.

**A dark contact shadow on a dark surface is not a contact shadow.** It is invisible, and the object
floats anyway. Anything standing on the meadow's cobbles gets a lighter **pad** first and its shadow
on top of that — the pad is the ground, the shadow is the contact. The same applies to any future
dark board.

**Its sibling, and the one that reads backwards: a LIGHT mark reads better on darker ground, not
worse. What kills it is a BUSY ground.** `#12` predicted that giving Fall Summer's `.62` marker
would let its darker soil swallow the glyph. Measured on the rendered boards afterwards, Fall is the
*strongest* of the four at 3.33:1 against Summer's 2.64:1 — the mark is cream, and the soil getting
darker is the mark getting louder. The two that go marginal are the meadow at 2.49:1 and Winter at
2.30:1, on the two LIGHTEST floors in the game. And Winter, the numerically worst, reads perfectly:
its frozen earth is smooth, while the meadow's cobbles are the only high-frequency floor of the four
and a thin dashed ring there competes with stone edges. **Contrast against the mean is the wrong
instrument for a textured surface** — take the screenshot and look at it, and when you do trust a
ratio, compare it against something already shipped rather than against 3:1.

**`[hidden]` loses to any later rule that sets `display`.** `.mw-jar-badge` declares `display:grid`,
so a badge that was correctly marked hidden still painted — an empty yellow pill on all eight cells.
Every class that sets `display` needs its own `[hidden]{display:none}` companion.

**After removing a method from `Game`, grep the `ui-*` files for it.** `tools/sim-test.js` cannot see
a `ui-*` file, so a UI call to a method that no longer exists passes every test and throws the moment
a player opens that panel. Collapsing the two food clocks left two live call sites to
`Game.critterAwakeFor` — the roster Feed panel and the post-feed toast — with a fully green suite.

**Never measure sheet contents with `getBoundingClientRect()` while the sheet is opening.** `.sheet`
carries a `translateY` transition, so absolute positions read hundreds of pixels off — and in an
automated tab that transition can freeze part-way and never settle, so waiting does not help.
Measure **relative to `#sheetBody`**, which is transform-independent. This produced two wrong
diagnoses in one session, including a fold check that claimed content was off screen when it was not.

**A design session can commit into THIS checkout while you are working in it, and the handoff is
what breaks.** Not a branch and not a worktree — the same directory. Phase 3.6 was built across
`30c3a63` and `06ce06a` landing underneath it, and one of them **ruled on the blessing** in the
opposite direction to the advice this file was still carrying. Nothing conflicted, nothing failed,
and `git status` looked exactly as expected, because the other session only touched `docs/` — so the
first sign was the parent commit not being the one the session started from. **Re-read
`10-decision-log.md` from the top immediately before writing step 5**, and diff `HEAD` against the
commit you started at: the handoff is *derived*, and it is the one file guaranteed to be wrong when a
ruling lands mid-session.

**Check `git branch -r` before starting a specified phase.** Phase 4 was built twice, in parallel,
by two agents that did not know about each other — competently and incompatibly, with different
state shapes for the same feature. Cloud agents push to `cursor/*` branches and may already have
merged to `main` while your local tree still looks current. `git fetch` first.

**A gesture cannot be added over controls that act on `pointerdown`.** Plots and the flower fire the
moment you touch them, by design — `click` waits for release and makes rapid tapping feel laggy. So
a swipe begun on one has already planted or harvested before it is recognisable as a drag, and the
garden's vertical swipe therefore only starts on the background. Do not "fix" this by moving those
handlers to `pointerup`; the tap latency is load-bearing.

**An upkeep state the player cannot clear is a bug wearing a mechanic.** Sleeping applies only to
*tending* creatures, because a resting one cannot be fed and would have shown as asleep forever with
no way out. Anything future that switches off gets the same check: *and can they turn it back on
from here?*

**The bottom of the screen was `black-translucent`, not the layout. Never set it back.**
`apple-mobile-web-app-status-bar-style` is **`default`**, because translucent sizes an installed
app's window to the screen minus the status bar and pins it to the top — leaving a strip along the
bottom that no CSS can reach. Measured: `screen 402×874 · window 402×812 · insets 62/34` on an
iPhone 16 Pro. Everything below was written while chasing this from inside the page; it is all still
true and still load-bearing, but none of it was ever going to close the gap. `inset: 0` alone was short (2026-08-18), `height: 100dvh` was short (2026-08-19), and **both
were measured while `.game` carried the shake transform** — a transform makes an element its own
containing block, and that is the case WebKit is known to mis-size. As of 2026-08-20 the shake lives
on **`#world` inside `.game`**, `.game` is a plain untransformed `position: fixed; inset: 0` box, and
`--app-h` is a **`min-height` floor** under it rather than its height, so the box is the taller of
the browser's answer and the JS measurement and a wrong measurement can only fail to help.
`sizeViewport()` in `ui.js` maxes `innerHeight` and `documentElement.clientHeight` — **the window,
and only the window**. Not `visualViewport.height`, which shrinks for the keyboard and pinch-zoom,
and **not `screen`**: that was tried the same day, on the theory that an installed app's window is
the screen, and it pushed the dock out of the window on a real iPhone. The window there really is
shorter than the screen and iOS paints the strip below it. **Never stretch the game past the
window, never put a transform back on `.game`, and never turn `--app-h` back into `height`.** The `<body>` background is the meadow
flat `#4fae54`, and **nothing may draw a dark edge along the bottom of `.game`** — the vignette
fades out, the meadow fades its stripes out over the last 44px, and the closed bottom sheet no
longer casts its shadow up into the lawn, which is what was drawing the line all along. None of it
reproduces in the desktop preview, which reports `.game` covering exactly — force
`.game{height:772px}` there to see the failure, and **compare the RGB either side of the join rather
than looking at it**. And read **Developer tools → Screen** on the handset before theorising — one
tap on the unlabelled dot beside the gem wallet. It prints `screen`, `window`, `clientHeight`, the
game box, `--app-h` and both insets. `window` shorter than `screen` is the normal state of an
installed iOS app, not a browser lying: **the inset being present does not mean the window reaches
the indicator**, which is exactly the assumption that pushed the dock off the bottom.

**`env(safe-area-inset-*)` is always `0` on the desktop, so never trust a preview on inset layout.**
That blind spot shipped the band under the dock twice. All four insets now come from `:root`
variables — `--sat`, `--sar`, `--sab`, `--sal` — and **nothing else in `style.css` may call `env()`
directly**, so a phone's layout can be put on screen by overriding four numbers:
`:root{--sat:59px;--sab:34px}` in the preview's devtools. Do that before believing a layout change.
The dock keys off `--bottom-gap`, `max(10px, calc(var(--sab) - 12px))`, not the whole inset.

**A quest for a feature with no UI jams the strip, and the bench is the live example.** `fillActive()`
caps at three, so an uncompletable quest holds a slot forever. Since 2026-08-30 `stripQuest()` ranks
the live active quests nearest-to-done and steps past a stuck one, so the strip keeps moving — but
the fall-through to the daily still waits for the active list to empty, so a dead entry keeps the
daily off the strip for the life of the save. `paused: true` on a definition is the escape hatch: never handed
out, stripped from an existing save by `ensureProgression()`, definition and tuning kept. Anything
that counts quests — the panel's "N left", the suite's level-17 assertion — **must filter to live
quests**, or it will report a ladder complete that no player can climb.

**A quest that becomes GATED is a third case, and `ensureProgression()` had never seen it
(2026-09-03).** It dropped a definition that vanished and one that was paused; `needSeeds: N` —
"not until the player owns N seeds" — makes a definition that is present, unpaused and still
unclearable. Adding the gate to `fillActive()` alone therefore fixes nothing for anyone already
playing: every existing save keeps the quest in its slot, exactly as jammed as before, because
nothing ever re-examines an instance already dealt. The half-fix is invisible in a suite that only
tests hand-out. **And the rule that comes with it: a gate that DROPS a live instance may only be
hung on a track with a lifetime record**, or it destroys progress on load. On the discover track
`questFloor()` deals the quest back whole the moment the gate opens, which is the only reason the
drop needs no migration flag. See
[16-progression-and-quests.md](16-progression-and-quests.md#gating-a-quest).

**A visual state must never depend on a keyframe having run.** Already recorded for the pack badge,
and it caught the sleeping Zs anyway — they started at `opacity: 0` and faded in, so they were
invisible in any tab whose animation clock was not advancing. Visibility belongs to the base style;
motion is the flourish on top. The corollary found at the same time: a *stroked* glyph a few pixels
wide is a hairline that disappears against a dark background, and the house style of a flat fill
inside one thick outline exists partly for this reason.

**Rounding hours and minutes separately renders 23h 59m 59s as "23h 60m".** Round to whole minutes
first, then split. Bit the feed panel's span formatter.

**`.ui` is a stacking context, so nothing inside it can climb above a place layer.** It is
`z-index: 20`; raising `.hud`'s own z-index does nothing. The HUD shows in every room because the
place layers sit **under** `.ui` (Hollow 5, HUD 6, meadow 12, map 14) — and because `.ui` then
covers the screen, it takes `pointer-events: none` while a layer is open or it eats every tap meant
for the room. **Anything a place draws along its top edge must clear ~62px + `--sat`**, or it lands
under the wallets. See [08-ui-and-layout.md](08-ui-and-layout.md#the-hud-is-always-up).

**Never recreate a node that a post-layout pass positions.** The meadow rebuilt its hives and
keepers from `innerHTML` every slow tick and `place()` sized them a frame later, so each drew once
per tick at its natural size — on a phone, pets flashing in and out. Build once, update in place,
like `renderPlots()` and the Hollow's `petEls`.

**A test that passes for the wrong reason is worse than no test.** The sim-suite was writing its
injected saves to `'gardenwonder.save'`; the real key is **`gw-save`**. `load()` therefore reported a
*fresh game* every time, and three save/migration tests passed **vacuously** against default state
for as long as they existed. Found only because a new migration test failed inexplicably. The suite
now has one `SAVE_KEY` constant — and the lesson generalises: a migration test must assert something
that is **false** on a fresh save, or it is testing nothing.

**`setPointerCapture` RETARGETS every later pointer event to the capturing element**, so
`pointerup` arrives claiming the capturing element was pressed and `e.target.closest(...)` finds
nothing on it. It made tapping a place on the world map do nothing on a desktop mouse. The map no
longer captures at all, and **a gesture resolves what was pressed at `pointerdown`, as ids rather
than nodes** — which also survives the node being replaced mid-gesture, where keeping a reference
would not (a detached element's `closest()` walks up to nothing).

**A synthetic input test can silently avoid the branch that breaks real input.** Synthetic
`PointerEvent`s have no live pointer, so `setPointerCapture` throws and the `try/catch` swallowed
it — every automated tap took a path no real mouse takes, and passed. When a gesture works in
automation and fails on a device, suspect the difference between the two. The check that matters
dispatches `pointerdown` on the target and `pointerup` on the LAYER, reproducing the retarget.

**Anything positioned in scene coordinates must be a child of what those coordinates measure
from.** The meadow's keeper bank was nested in the padded stage while `placeKeepers()` computed
`left`/`top` against the *layer*, so every keeper landed in the wrong place. Same family as the
`getScreenCTM()` rule: the maths was right and the container was not.

**Replacing a block of CSS between two comment markers takes everything in between.** Rewriting the
meadow's bank rules silently removed `.mw-keeper-bank` and `.mw-keeper`, so the keepers lost
`position: absolute` and stacked in the corner while JS went on writing coordinates that did
nothing. Grep for the class names after any block replacement.

**Never memoise against a node you also replace.** `syncScene()` skips redrawing the map's backdrop
unless the sky changed, so drifting clouds are not restarted every tick — but `build()` replaces the
element it was memoising against, and the second visit to the map drew a blank green field with no
error anywhere. The check now tests the node as well as the value.

**A camera translate and a moved `transform-origin` cannot both be used.**
`translate(-camX*s, -camY*s) scale(s)` puts world point (camX, camY) at the top-left of the screen,
and **that identity only holds with `transform-origin: 0 0`.** Setting the origin to the place being
dived into — the obvious-looking way to zoom toward something — broke the pan and pushed the world
off screen. `ui-map.js` animates the *camera* instead. Two more from the same file: the transition
must be **off** during a drag or every pan lags a third of a second behind the finger, and a gesture
only counts as a tap under 12px of movement, or panning keeps opening whatever it finishes over.

**Anything drawn inside the map's world transform is scaled by the camera, including text.** Labels
and badges are UI, not art: at map altitude a 13px name renders at 7px. They counter-scale with
`scale(calc(1 / var(--ow-s)))`. The corollary is the composition rule that cost a rebuild —
**landmarks have to be small against the world**, or the "map" is just the garden seen from slightly
further away. The first world was 1240×900 and the garden covered 69% of the screen.

**The dock's columns follow its button count.** It was pinned at `repeat(4, ...)`, so a fifth tab
wrapped onto a second row and covered the lawn. `grid-auto-flow: column` instead — and the IA doc's
hard cap of five still stands, because past that the labels stop fitting.

**A line item that names nothing cannot be priced when it is written.** The Stand's "any blooms"
line could be filled with daisies or with Eternals, so a price fixed at generation is either a
swindle or an exploit. The card quotes a **floor** and `standDeliver()` re-prices against what
actually crossed the counter, paying the larger — and the wild discount has to be applied on *both*
sides or "any" becomes the best line in the game. That second half shipped broken and surfaced as a
**flaky test failing one run in three**, not as a visible bug. Anything future that prices an
unnamed quantity needs the same treatment.

**`width:auto` on an SVG is 100% of its container, not the viewBox aspect.** It drew a customer's
head three times the size of the panel. State both dimensions. And an SVG *taller* than its
container is not pushed up by `place-items:end` — it overflows downward, which put a portrait's
shoulders on top of the name underneath it. The customer viewBox now carries empty space below the
shoulders the way the creature art does, so the sheet's sink eats that first. Both were found by
measuring with `getBoundingClientRect()`; neither was obvious from looking.

**A tier with fewer customers or goods than `STAND.slots` repeats itself on the board**, which reads
as a bug rather than as a small village — and tier 1 is the first thing a new player ever sees. Both
counts are asserted per tier. Anything that adds a tier has to add faces and goods with it.

**A coach mark points at something in the garden, so an open sheet has covered it.** It floated over
the Stand panel's own title. Hidden declaratively off `.sheet.open`, like `.sheet-art` — never from
a JS close path, which can be forgotten.

**`state.critters[id].fed` is the keepsake clock, not whether a creature has been fed.** It records
when the creature last handed a keepsake over, and it has meant that since creatures shipped. Food
is `fedUntil`, a separate absolute timestamp. Writing food into `fed` silently resets every keepsake
timer in the game, and nothing reports it.

**`tools/sim-test.js` keeps an explicit `GLOBALS` whitelist, and a new `data.js` constant must join
it.** Miss it and the constant reads `undefined` inside `game.js`, which throws inside `load()`,
which is caught — so the save silently resets and the failure surfaces as some unrelated test
several hundred assertions away. Cost a debugging pass on `CREATURE_FOOD`.

**A celebration centred on a hidden element fires from the top-left corner.** `.in-hollow` sets
`display:none` on `.stage`, so `#garden` measures a 0×0 rect and `FX.centerOf()` returns the origin
— no error, no warning, just confetti in the corner. Anything in `ui-events.js` that celebrates
something the player can cause from more than one screen has to centre on the screen that is
actually up; the `pair` and `critter` handlers go through `critterStage()` for exactly this. Found
by forming Nightbloom from inside the Hollow and looking at the picture.

**The UI is now six files sharing one global, and the sharing rule is load-order-sensitive.** A
`ui-*` file may destructure the `ui-shared.js` primitives at the top (`const { $, S, el, fmt } =
UI;`) because those exist as soon as `UI` does. It may **not** destructure anything another UI file
attaches — `UI.toast`, `UI.openSheet`, `UI.plotEls` — because that file may not have loaded yet;
call those through `UI.` at call time. `ui.js` publishes its half at the very bottom, just before
`boot()`. **`UI.flowerBtn` is a function, not the node**, because `buildGarden()` replaces the
flower on every plot expansion.

**`audio.js` already has a global-looking `RECIPES`.** It is a table of *sound* recipes, declared
inside the `Sound` IIFE. Crafting recipes are therefore named `CRAFT_RECIPES`. Shadowing would
technically work, but do not reintroduce the collision.

**`syncAfford()` in `ui-sheet.js` assumes every `[data-buy]` is one of three kinds.** Its final `else`
branch treats anything unrecognised as a booster and will throw. New purchase buttons must use
their own data attribute — the Apiary and Craft panels use `data-apiary`, `data-craft` and
`data-sell` for exactly this reason, and a rewarded-ad control uses `data-ad`.

**A `<button>` nested inside a `<button>` is invalid markup and will not fire**, so a card that IS
an offer carries the hook itself and puts the ad pill where `priceTag()` goes. `UI.adTag()` returns
a `<span>` for exactly this reason; do not "improve" it into a button.

**The sheet overlays the dock when open.** Browser automation cannot click a dock button while a
sheet is up; click the in-sheet tab pills at `#sheetTabs .tab[data-tab="..."]` instead.

**`pagehide` calls `Game.saveNow()`.** Injecting a save into `localStorage` and then reloading does
*not* work — the outgoing page writes its in-memory state over the injection. Seed the save from a
page with no game code on the same origin, then navigate to the game. This wasted a full debugging
cycle and produced a false "saves are broken" report. **The same trap eats a `localStorage.clear()`
from the console**, which is the tempting way to test a fresh install: the page you are clearing
from writes its state straight back on the way out, and you reload into the save you thought you had
deleted. The announcement's "Got it!" is safe from it by ORDER rather than by luck — `Game.reset()`
makes the in-memory state a fresh garden *before* the reload, so the write that fires on the way out
writes a fresh garden too.

**Playwright needs an explicit browsers path** in this sandbox:
`PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/ms-playwright"`.

**Grow times are compressed.** A Daisy matures in 12 seconds. Values in
[14-economy-model.md](14-economy-model.md) are mobile-scale and deliberately differ from what the
web build uses; do not "fix" the discrepancy.

**`load()` replaces `state.upgrades` wholesale, it does not deep-merge it.** `Object.assign(state,
defaultState(), parsed)` only shallow-copies top-level keys, so a save from before a given badge
existed simply won't have it in `parsed.upgrades`, and that key comes back `undefined` — not `0`.
**Badges no longer need a per-key line** (fixed 2026-08-15): `load()` backfills every key in
`defaultState().upgrades`, so declaring the badge there is enough. The hand-maintained list it
replaced had already drifted and was missing all seven v1 badges. `state.tap` doesn't have this
problem — it's merged with `Object.assign(d.tap, parsed.tap || {})`, so new fields on it just
inherit the default. **The trap still applies to anything not covered by that loop**: a new
per-cell grid field (e.g. `luckyBug`) needs its own backfill over `state.grid`, and a new
`state.seen` flag needs its own line — see [07-save-data.md](07-save-data.md).

**Automated/CDP-controlled browser tabs can freeze CSS animation clocks entirely.** If the tab lacks
OS focus (common for an automation window sitting behind the IDE), Chrome can stop advancing
`animation` timelines — `element.getAnimations()[0].currentTime` reads back unchanged across a real
multi-hundred-ms delay, even on an animation that's been looping since page load. `setTimeout` and
`requestAnimationFrame` keep running, so game logic and JS-driven FX (canvas particles, floating
text) still work and are safe to verify normally. To visually verify a *CSS keyframe* animation under
these conditions, don't wait on wall-clock time — trigger it, then manually seek with
`el.getAnimations().forEach(a => a.currentTime = <ms>)` and screenshot immediately in the same CDP
call (`take_screenshot_afterwards`). This cost a debugging cycle on the tap-proc animations before
the cause was found; it is a testing-environment artifact, not a game bug.

**The same freeze stops `requestAnimationFrame` outright, and the frame loop is what redraws the
quest strip.** `frame()` in `ui.js` calls `hudTick()`, which calls `renderQuestStrip()` — so in a tab
that is not compositing, the engine can be perfectly correct while the strip on screen still shows
the previous quest, and it reads exactly like a broken render. `document.hidden` is `false` and
`visibilityState` is `visible` throughout, so neither one tells you. Call `UI.renderQuestStrip()`
directly to separate "the engine picked the wrong quest" from "nothing has repainted". The related
half: `innerText` needs layout and comes back **empty** for the whole sheet body under the same
conditions — read `textContent` instead when scraping a panel in automation.

**The three tap-proc trigger rates share one constant.** `PROC_CHANCE_PER_LEVEL` in `game.js`
(currently `0.002`) is read by `rollRainDance()`, `rollBeeSwarm()`, and `rollLadybug()` — tune all
three at once by changing it in one place, not by editing each `roll*()` function.

**`state.discovered` is not `state.flowers`.** Flowers are spendable inventory; discovered is a
lifetime harvest count that never decrements. A quest or milestone that reads the pantry will
go backwards when the player crafts. Backfill on load uses remaining flowers as a lower bound,
which undercounts old saves on purpose. `state.rarityCounts` is the same kind of record for
mastery and has the same rule.

**Mastery no longer perturbs harvest measurements — but PETALS now can.** The old trap (the
climbing mastery ladder drifting any averaged-harvest test) died when `masteryMult()` retired
with the Garden Year; `clearMastery()` survives in the suite because `discovered` still drives
creatures and quests. The successor trap is `state.petals`: Rich Bloom multiplies every harvest
of its flower and Quick Sprout changes baked grow times, so a test measuring some *other*
multiplier must not inherit petals from an earlier test — `G.reset()` clears them, but a rig
that writes state by hand does not.

**`state.credits += x` is banned in favour of `Game.credit(x, {cheat, refund})`.** The Year's
mint reads `state.year.coinsEarned`, which only `credit()` writes — a raw wallet grant either
silently misses the meter (an earnings faucet that mints nothing) or, flagged wrongly, mints
Saved Seeds from a cheat. Spending stays plain subtraction. Sim-test bill item 4 exists to catch
exactly this; the dev gold buttons route through `Dev.grantGold`.

**`turnYear()` is the only legal prestige path, and it is atomic on purpose.** It collects,
banks, mints, blesses, clears and rolls over in one commit ending in `saveNow()`. Never reuse
the Settings reset as a prestige, and never "improve" the Turn by splitting it — a Turn that can
half-happen is corrupted saves at the worst possible moment. Bill item 1's partition test also
fails the suite if a new `defaultState()` field is not classified as cleared-or-surviving, which
is deliberate: classify it when you add it.

**`state.fall.grid` is positional, like the meadow's cells and the Stand's slots.** Rebuilt to
`DATA.fall.plots` length on load, never merged. And Fall crops are NOT flowers: they must never
touch rarity, mutations, `discovered`, the pantry or the bench, and they must never DROP a gem —
the windfall is their whole juice, and several sim-tests assert the separation (*a whole Fall bed
drops no gems*, *it writes no discovery and drops no bloom*). **Gems run the other way now, and
only that way:** `fallSkip()` SPENDS them to hurry a crop — the owner's ruling of 2026-09-02,
shipped in `bf6f24c` — and it is the season's only gem sink, with the Century Bloom refused at any
price. A hurried crop still pays flat `yield`, still writes no discovery and still counts only
generic `harvest` tracks, so the rule above is intact: it is about what a crop EARNS. Do not read
`.fl-skip` as a violation of it and revert a ruled feature.

**`.seed-row` is the plant picker's button, not a generic row.** Reusing it for the Almanac wrapped
every row in a card treatment and collapsed the columns onto one overflowing line. The Almanac's
classes are `.almanac-row*`. Check for an existing class before naming a new one — `style.css` is
50 KB and the collision is invisible until you screenshot it.

**Never let an animation be the thing that makes an interactive element exist.** The pack badge
started at `scale(0)` and depended on a keyframe to appear, which makes it uncollectable anywhere the
animation does not run. Visibility belongs to `display`; animation is a flourish on top.

**New per-cell grid fields keep catching out `clearGarden()` in the suite.** `mutation`, `mutateAt`
and `packDrop` have each leaked between tests. Add the field there at the same time you add it to
`defaultState()` and the `load()` backfill.

**A plant's mutation roll fires once and only once.** `plant()` schedules `cell.mutateAt` inside the
grow window; `rollMutations()` fires it and zeroes it. Anything writing a grid cell by hand — a test
fixture, a migration, a future auto-planter — must set `mutateAt` too, or that plant silently never
rolls. Both `mutation` and `mutateAt` need their own backfill loop in `load()`, beside `luckyBug`.

**Weather is a pure function of epoch time, so never store it.** `weatherForSlot(n)` is a hash of the
slot number. Caching or persisting the current weather means the design has been misunderstood — the
point is that any past or future slot is computable on demand.

**Offline income is a closed-form rate, not a replayed simulation.** `passiveIncomeRate()` values
each auto-planted plot at what its planter would grow and caps the total by the drone's cadence. It
is O(1) in the length of the absence, deliberately — do not "improve" it by stepping the simulation
forward across a 24-hour gap.

**And because it is a rate read ONCE and multiplied over the whole absence, no temporary effect may
ever be composed into it.** A thirty-minute boost reaching that function is worth a full away
window, not thirty minutes — a thirty-second ad watched just before closing the app would pay out a
night. The rented Harvest Drone is the live case: it composes in `processAutoHarvest()` and is
deliberately excluded here, and the local is named `owned` rather than `droneLevel` precisely
because `Game.droneLevel()` is the composed getter and a tidy-minded refactor of that line is one
keystroke from swapping it in. The function also still duplicates the cadence formula inline instead
of calling `autoHarvestCadence()`, which is what makes the line inviting to tidy. `tools/sim-test.js`
has "the rental does not touch offline income"; sabotaging that one line reddens it and nothing else.

**`PRICE_FIELDS` in `tools/sim-test.js` bans `cost`, `price`, `gems`, `credits`, `tickets` and
`currency` on every `DATA.boosters` row**, because boosts are earned rather than bought. So a timed
effect that is *offered* for something needs its offer terms outside that table — `DATA.droneRental`
is the pattern. The reflex to write `currency: 'ad'` on the row is strong, because `CREATURE_FOOD`
carries exactly that field; the suite goes red immediately, which is the point.

**A rewarded-ad refusal must be decided before `watchAd()`, and the test for it is easy to write
so that it cannot fail.** Take the impression mark *before* the refusing call, in a `check` of its
own. A group whose earlier assertion performs the refusal itself absorbs the stray impression, the
day's cap is then already spent, and every later "no impression on a refusal" assertion passes
against an implementation that spends one every time. Found by sabotage, not by review.

**Verb effects must be read before the plot is cleared.** `harvest()` captures the neighbourhood —
Beacon weight, Lantern gem multiplier, the payout multiplier — at the top, because clearing the plot
changes what its neighbours see. A verb consumer added after the `state.grid[idx] = {...}` line will
silently read the wrong garden.

**A growth verb needs two code paths, not one.** Growth time is baked in at plant time, so a plot
planted next to an existing Keeper gets the bonus for free — but a Keeper planted *afterwards* would
do nothing without `quickenNeighbours()`. Any future growth-affecting verb needs the same pair, or it
only works when the player happens to plant in the right order.

**The suite's clock was seeded from the real wall clock, and weather is a function of that clock.**
Once the Sky Pass made the sky change how fast things grow, three assertions passed or failed
depending on what the weather happened to be doing while the suite ran — proved by watching the
failure count go 3 → 2 → 3 with no code change at all. `clock` is pinned to a fixed epoch whose slot
and the two after it are Clear, in daylight. **A test that wants a sky asks for one with
`G.Dev.setWeather()` and puts it back**, and note that `G.reset()` clears the hold.

**Sim-tests that touch a harvest must pin `Math.random`.** Two were flaky and both are fixed —
together they failed 4 runs in 50. Harvest pays rarity, gems, mastery tiers and Wonder rolls from the
same call, so any assertion on a payout or a currency delta is flaky until the RNG is pinned.
**Prefer an exact assertion on one harvest to a tolerance on a sampled mean** — and if you must loop,
call `clearMastery()`, because the ladder climbs as the loop runs and you end up measuring two things
at once. See [11-known-issues.md](11-known-issues.md).

## Checking your work

```bash
node tools/sim-test.js          # 1,463 assertions over the simulation layer
node tools/html-check.js        # the escaping ruling: no player text inside a template literal
node tools/year-sim.js 12 all   # the pacing model — see the caveat below before trusting its exit code
node tools/order-gold.js 25 4   # is a delivered order worth a minute of the player's time, per tier?
node --check <file>.js          # no build step, so this is the only syntax gate
node tools/capture-screens.js    # redraw the whole screens gallery, and the page that indexes it
node tools/export-icons.js --check # do the icon exports still match icons.js?
python3 -m http.server 8899     # then open http://localhost:8899/
```

**`year-sim`'s exit code stopped being a gate on 2026-08-30** and has not been made into one again.
It runs ONE unseeded run per strategy, and at the raised order gold the two shapes it compares sit
inside its own noise — five runs, three OK and two FAIL. Read the day-10 table rather than the exit
code, and check *which currency* a shape wins on: a `smart` win on Saved Seeds minted would be a
real mint break, a win on lifetime coins alone is the Fall-dump conversion and is what is currently
flipping the verdict. See [11-known-issues.md](11-known-issues.md).

**`tools/order-gold.js` is the Stand's tuning instrument**, and it is deterministic — the same
`data.js` gives the same answer twice. It drives the casual model, divides each delivery by the rate
the rest of the garden was running at (order gold and offline lumps deliberately outside the anchor)
and prints a median per tier against the owner's 60–120 second band. Re-run it after ANY change to
`STAND.tiers[].mult`, and give it 25 days or more — tier 4 needs rep 600 and does not arrive
organically inside the 14-day default while `STAND.repPaused` is on.

`tools/sim-test.js` runs the real `game.js` headlessly, because it has no DOM dependencies. **Keep
it that way** — it is the cheapest way to validate a balance change, and it should survive the Unity
port as an editor test. It asserts *invariants* that must hold through tuning (crafted goods beat
their ingredients by at least 1.35×, every recipe spans two regions) rather than specific numbers.

## Model and cost guidance

The owner is cost-sensitive. Tier the work:

| Task | Model |
| --- | --- |
| Architecture, economy math, hard bugs, design advice | Opus 5 thinking or Gemini 3.1 Pro |
| Day-to-day feature work — the default | **Sonnet 5 thinking** |
| Mechanical edits, boilerplate, exploration subagents | Composer 2.5 Fast or Gemini 3 Flash |

Two multipliers:

- **Point cheap models at these docs.** A Sonnet-class model reading
  [09-conventions.md](09-conventions.md) produces better-fitting code than an expensive model
  guessing. This is the main reason the docs exist.
- **Decide expensive, build cheap.** Advisory conversations cost a fraction of code generation. Use
  a strong model to make the call, a cheap one to implement it.
- **Every builder prompt opens with its recommended model on the first line** (owner-requested,
  2026-09-02) — e.g. `MODEL: Sonnet 5 (thinking)` — so the owner sees the assignment immediately
  and deletes the line when pasting. Whoever writes a prompt picks the tier from the table above.

## Briefing a new agent

Paste this into a fresh chat. Keep it current — it is the first thing the next agent sees, and a
stale line here costs them real time before they have any way to know it is wrong.

> I'm building a mobile idle/casual game called Garden Wonder. It's a static site — no build step,
> no dependencies — deployed straight from the repo root to GitHub Pages, and it's fully documented
> in `docs/`.
>
> **The repo is a subdirectory of my workspace, not the workspace root:** open
> `Ghost Garden/Ghost Garden`. (`garden-polish` beside it is a second worktree on the `polish`
> branch; `ghostgarden` is an empty leftover.) Run `git fetch` and check `git status` before you
> start — other sessions work in this tree.
>
> Read `docs/HANDOFF.md` first, then `docs/README.md` for the index. Before writing any code read
> `docs/09-conventions.md` and `docs/02-architecture.md`, and the **"Traps in this codebase"**
> section of the handoff — it will save you hours.
>
> **Where the game is now.** The garden is the core loop: tap a talking flower, plant nineteen
> seeds in eight plots, harvest with rarity and mutations. Six **creatures** with traits, stars,
> pairs and keepsakes live in **the Hollow** under it, and the **Wild Meadow** (a board of hives and
> tenders that make honey and pollinate the garden) is out along the lane. **The world map is
> deleted** — both rooms are gestures now: the finger drags the world, so dragging UP goes down into
> the Hollow and dragging DOWN goes out to the meadow, and each room leaves by the opposite swipe.
> The **Garden Stand** (customers queue up wanting bouquets and named honeys, and pay coins and
> reputation) is the Orders & Quests dock button. Read `docs/03-systems.md`,
> `docs/08-ui-and-layout.md` and the top few entries of `docs/10-decision-log.md`.
>
> **THE HOUSE RULE, and the most useful sentence in the docs: share the grammar, never share the
> verb.** Every place is the same frame — a square board floating in a scene, the talking flower in
> the middle, tappable cells around it, pets underneath, dock below — so nobody has to learn a
> second screen. What differs is the verb: garden cells are planted and emptied, meadow cells are
> placed and permanent.
>
> **The meadow's art pass is done (2026-08-25) and its lesson is the standing bar for every room
> that comes after.** `docs/05-art-direction.md` → "The material recipe" is now a worked example,
> not a diagnosis: four value tiers, the five-layer surface recipe whose unblurred `0 4px 0` lip
> does most of the work, everything standing on ground rather than on a shadow, and props measured
> against a creature. **Screenshot any new screen next to the garden at the same size before calling
> it done** — and pick its material to say what its verb is, the way the meadow's cobbles say
> "permanent" against the garden's soil.
>
> **This is a phone game.** Compose at 390×844 and let a desktop window show that same column
> centred — `.ui` caps the interface at 560px and the scenery bleeds out behind it. **A place layer
> sits outside `.ui` and inherits none of that, so a new room must re-state the column itself**, and
> its scene must be drawn at the size the room really measures rather than sliced from a phone-sized
> viewBox. Both mistakes shipped in the meadow and both read as "it looks like a prototype."
>
> **The work in flight is slice A of the Garden Year** — the Turn, the mint, petals, unlock
> prices and Fall. Read `docs/32-the-garden-year.md` (the design), `docs/33-year-one-economy.md`
> (the numbers) and `docs/34-build-plan.md` (the phases). **Phase 1 — the whole engine as
> simulation — is built and under review; phase 2 (the ceremony's UI) starts at the wireframe
> gate after my verdict.** The one rule above all others there: a season is a speed and a rule,
> never a re-skin.
>
> **How I work.** I'm the designer; an engineer ports to Unity. Two people, modest revenue goal,
> deliberately small scope. I want you as a **design advisor as much as an implementer** — push back
> on scope creep, tell me plainly when an idea is bad, and correct me when I'm wrong. Several of the
> best decisions here came from exactly that.
>
> - **Show me pictures.** Screenshot what you build and look at it critically yourself first. Real
>   bugs here have only ever been visible in an image, and more only on a real phone.
> - **Drive real input for anything gestural.** A synthetic `PointerEvent` has no live pointer, so
>   it silently skips branches a real mouse hits — that is how a map where nothing was tappable
>   passed every automated test. See the traps.
> - **Push after every change.** I test on my phone from the live URL.
> - **Docs are the source of truth.** `AGENTS.md` defines "done" as the docs being true again in the
>   same commit. That has kept this project coherent across a very long run; please hold it.
> - **Run `node tools/sim-test.js` after any simulation change, several times** — the docs record a
>   whole class of flaky tests caused by unpinned `Math.random`. It is at 1,444 assertions,
>   including the Garden Year's 18-item bill.
> - **Spike the feel before building the system.** `tools/merge-spike.html`, `tools/hollow-spike.html`,
>   `tools/map-spike.html` and `tools/customer-spike.html` all saved real time.
> - **More iconography, fewer sentences.** A standing note, and the thing I keep asking for.

The point of the docs is that this briefing is short. If a new agent needs more than that, a
document is missing — write the document rather than lengthening this.

## Maintaining this file

This file is **derived, never authored alone.** It summarizes the other documents, so update those
first and write this one from them — see the definition of done in [AGENTS.md](../AGENTS.md#definition-of-done).
A handoff written from memory at the end of a long session will confidently describe a game the
specific docs contradict, and the next agent will believe the specific doc.

At the end of a significant session, update: where the project stands, the current task, what comes
after, and any new trap you hit.

A full transcript of the founding conversation exists in Cursor's agent history, but it is long and
mostly implementation detail. **These documents are the intended handoff surface** — if something
important lives only in a transcript, move it here.

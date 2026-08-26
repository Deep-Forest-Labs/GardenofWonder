# Handoff — Current State and Next Steps

Last updated: **2026-08-25**

Read this first if you're picking up the project cold. It covers where things stand, what's been
decided, and what to do next. Update it at the end of any significant session.

## Where the project stands

The game is **built, working, and live** at <https://jonishua.github.io/gardenwonder/>, deployed from
`main` at the repository root. It is a single-screen idle garden — tap a talking flower, plant
seeds in eight plots, harvest with rarity multipliers, spend on badges and decor, and earn boosts
from quests and levels.

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
> wall instead of a fence, unmown grass with seed heads instead of mown stripes, turf on a stone lip
> instead of a wooden planter.
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
> **Feeding shipped, and creatures now sleep, 2026-08-18.** Three foods bought with coins from
> **Feed** on the Hollow's dock, and each runs **two clocks**:
>
> | Food | Awake | Well fed | Cost |
> | --- | --- | --- | --- |
> | Clover Nibble | 4h | 1h | 1,500 |
> | Petal Cake | 8h | 4h | 5,000 |
> | Honeypot | 16h | 12h | 12,000 |
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
> free. **If the upkeep ever reads as a chore, raise `awake` in `data.js`, never the prices.**
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
> to reach the food that wakes it: at 375×812 the food buttons end 518px into a 582px body and the
> rest button at 579px, so **anything added above them pushes the cure off screen**. Two meters —
> *Awake* and *Well fed*, both to the same 24h cap — so you can see what a Honeypot actually buys
> before you buy it.
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
| Engineer | Porting to Unity for iOS and Android. |
| Agent | Design advisor, prototype implementation, documentation. |

The web build is the **design lab** — cheap and fast to test ideas. Unity is the **shipping
product**. Keep them in that relationship; don't gold-plate the web build.

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

**The economy needs a full retune, and it is deliberately deferred.** Every number is a placeholder,
and the owner has said the whole curve — possibly including *fewer* seeds, unlocked through card
packs — is open. It is not being done now because an economy is tuned against the systems that
consume it, and orders, cards and prestige do not exist yet. Retuning now means retuning twice. The
right moment is after the Market and card sets land.

**When it happens, the level curve is the dependency nobody expects.** Levels 2–17 currently pay out
**one seed each** — that is the entire reward structure of the progression ladder. Pull seeds back
and those levels have nothing to grant, so a seed-count change is also a progression rework. Scope it
as one piece rather than discovering it halfway through.

## The current task

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
(`q_discover_8`, `q_hold_60`, `q_honey_15`) carry their 98 of the ladder's 777 reputation. **If the
bench ships a screen, drop the `paused` flags and retire the stand-ins together** — one without the
other moves the ladder off 777 ([21-potting-bench.md](21-potting-bench.md#quests)).

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

**The MVP is done.** The Stand and the map frame both ship. What comes next, roughly in order:

1. ~~**The Wild Meadow**~~ — **done 2026-08-25.**
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

Full list in [11-known-issues.md](11-known-issues.md). The two that affect design decisions:

- ~~**Endgame seeds have lower gem chances than a Daisy.**~~ **Fixed 2026-08-15.** Gem chance is now
  derived from grow time, so gems per hour is flat across all nineteen seeds and gem income tracks
  time played rather than seed choice.
- **Cheat buttons ship to players — on purpose.** Settings has "Grant 50 Gems", "Grant 1,000,000
  Gold", and "Summon a Wonder Effect" with no confirmation, live on the public site. **Decided
  2026-08-14: leave them.** The audience is friends, their sessions are not clean data, and the game
  has no analytics either way. Revisit before any real external audience; don't re-raise it before
  then.

That inversion was inherited from the frozen economy port; it is fixed. What remains from the port is
the Orchid throughput dip and the identical Aurora/Celestial rates.

## Traps in this codebase

Things that cost real time to discover. None are visible from a casual read.

**After removing a method from `Game`, grep the `ui-*` files for it.** `tools/sim-test.js` cannot see
a `ui-*` file, so a UI call to a method that no longer exists passes every test and throws the moment
a player opens that panel. Collapsing the two food clocks left two live call sites to
`Game.critterAwakeFor` — the roster Feed panel and the post-feed toast — with a fully green suite.

**Never measure sheet contents with `getBoundingClientRect()` while the sheet is opening.** `.sheet`
carries a `translateY` transition, so absolute positions read hundreds of pixels off — and in an
automated tab that transition can freeze part-way and never settle, so waiting does not help.
Measure **relative to `#sheetBody`**, which is transform-independent. This produced two wrong
diagnoses in one session, including a fold check that claimed content was off screen when it was not.

**Check `git branch -r` before starting a specified phase.** Phase 4 was built twice, in parallel,
by two agents that did not know about each other — competently and incompatibly, with different
state shapes for the same feature. Cloud agents push to `cursor/*` branches and may already have
merged to `main` while your local tree still looks current. `git fetch` first.

**A gesture cannot be added over controls that act on `pointerdown`.** Plots and the flower fire the
moment you touch them, by design — `click` waits for release and makes rapid tapping feel laggy. So
a swipe begun on one has already planted or harvested before it is recognisable as a drag, and the
garden's swipe-up therefore only starts on the background. Do not "fix" this by moving those
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
caps at three and `stripQuest()` always renders `active[0]`, so an uncompletable quest holds a slot
forever and the strip never moves. `paused: true` on a definition is the escape hatch: never handed
out, stripped from an existing save by `ensureProgression()`, definition and tuning kept. Anything
that counts quests — the panel's "N left", the suite's level-17 assertion — **must filter to live
quests**, or it will report a ladder complete that no player can climb.

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
`data-sell` for exactly this reason.

**The sheet overlays the dock when open.** Browser automation cannot click a dock button while a
sheet is up; click the in-sheet tab pills at `#sheetTabs .tab[data-tab="..."]` instead.

**`pagehide` calls `Game.saveNow()`.** Injecting a save into `localStorage` and then reloading does
*not* work — the outgoing page writes its in-memory state over the injection. Seed the save from a
page with no game code on the same origin, then navigate to the game. This wasted a full debugging
cycle and produced a false "saves are broken" report.

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

**The three tap-proc trigger rates share one constant.** `PROC_CHANCE_PER_LEVEL` in `game.js`
(currently `0.002`) is read by `rollRainDance()`, `rollBeeSwarm()`, and `rollLadybug()` — tune all
three at once by changing it in one place, not by editing each `roll*()` function.

**`state.discovered` is not `state.flowers`.** Flowers are spendable inventory; discovered is a
lifetime harvest count that never decrements. A quest or milestone that reads the pantry will
go backwards when the player crafts. Backfill on load uses remaining flowers as a lower bound,
which undercounts old saves on purpose. `state.rarityCounts` is the same kind of record for
mastery and has the same rule.

**Mastery silently perturbs any sim-test that measures a harvest multiplier.** It multiplies
harvest payout and climbs as a run proceeds, so a test averaging thousands of harvests to isolate
some *other* multiplier has to reset the ladder first — and resetting `state.mastery` alone is not
enough, because the ladder reads `state.discovered`, so the next run restarts tier 1 with
thousands of harvests already banked and jumps several tiers on its first harvest. `clearMastery()`
in the suite clears all three. This broke the pollination and decor ratio tests the moment mastery
landed, and the failure looks like a balance regression rather than a test artifact.

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

**Verb effects must be read before the plot is cleared.** `harvest()` captures the neighbourhood —
Beacon weight, Lantern gem multiplier, the payout multiplier — at the top, because clearing the plot
changes what its neighbours see. A verb consumer added after the `state.grid[idx] = {...}` line will
silently read the wrong garden.

**A growth verb needs two code paths, not one.** Growth time is baked in at plant time, so a plot
planted next to an existing Keeper gets the bonus for free — but a Keeper planted *afterwards* would
do nothing without `quickenNeighbours()`. Any future growth-affecting verb needs the same pair, or it
only works when the player happens to plant in the right order.

**Sim-tests that touch a harvest must pin `Math.random`.** Two were flaky and both are fixed —
together they failed 4 runs in 50. Harvest pays rarity, gems, mastery tiers and Wonder rolls from the
same call, so any assertion on a payout or a currency delta is flaky until the RNG is pinned.
**Prefer an exact assertion on one harvest to a tolerance on a sampled mean** — and if you must loop,
call `clearMastery()`, because the ladder climbs as the loop runs and you end up measuring two things
at once. See [11-known-issues.md](11-known-issues.md).

## Checking your work

```bash
node tools/sim-test.js          # 837 assertions over the simulation layer
node --check <file>.js          # no build step, so this is the only syntax gate
python3 -m http.server 8899     # then open http://localhost:8899/
```

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
> **Where the game is now:** the habitat direction. Six creatures with traits, stars, eight named
> pairs and keepsakes, living in **the Hollow** under the garden. Food runs one fullness clock —
> well fed, hungry, or asleep — and a tap on a creature opens its own panel. Read
> `docs/22-creatures.md` end to end and the top few entries of `docs/10-decision-log.md`.
>
> **The world map MVP is built and the next job is judging it.** Swipe down from the garden to pull back to a freely
> scrollable world — the game becomes one altitude ladder, map → garden → Hollow. The design pass
> is done and shipped: `docs/25-world-map.md` (map inventory, feel rubric) and
> `docs/26-goods-catalog.md` (goods families, cottage crops, no barn) are the spec. Swipe down from
> the garden for the map, up for the Hollow. Next: judge the feel, then collect-all gated on
> automation, then buying land off reputation. **Two rules to hold:** no region may be a second
> garden, and the map collects the boring half while the garden keeps the interesting half. Read the
> top of `docs/10-decision-log.md` first.
>
> **Decorate is still agreed and still unbuilt** — mementos have had no sink since August 18. Check
> with me before starting anything else; the Potting Bench is also still a live option.
>
> **How I work.** I'm the designer; an engineer ports to Unity. Two people, modest revenue goal,
> deliberately small scope. I want you as a **design advisor as much as an implementer** — push back
> on scope creep, tell me plainly when an idea is bad, and correct me when I'm wrong. Several of the
> best decisions here came from exactly that.
>
> - **Show me pictures.** Screenshot what you build and look at it critically yourself first. Real
>   bugs here have only ever been visible in an image, and more only on a real phone.
> - **Push after every change.** I test on my phone from the live URL.
> - **Docs are the source of truth.** `AGENTS.md` defines "done" as the docs being true again in the
>   same commit. That has kept this project coherent across a very long run; please hold it.
> - **Run `node tools/sim-test.js` after any simulation change, several times** — the docs record a
>   whole class of flaky tests caused by unpinned `Math.random`.
> - **Spike the feel before building the system.** `tools/merge-spike.html`,
>   `tools/hollow-spike.html` and `tools/map-spike.html` all saved real time.
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

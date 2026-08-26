# Design Audit — 2026-08-26

**Status: audit and recommendation, not decision.** Nothing here has been agreed with the owner.
Where this document says "cut", read it as "the case for cutting, with the counter-case stated."
Decisions land in [10-decision-log.md](10-decision-log.md) after the owner rules on them.

Its job is the one the owner asked for: what is strong, what is redundant, what is missing, and
what should be cut — before any new design is written. It extends
[17-market-and-positioning.md](17-market-and-positioning.md) and
[25-world-map.md](25-world-map.md) rather than redoing them.

---

## Six disagreements with the framing, stated first

### 1. The game has a spine. It is reputation, and it stops at level 17

The brief says "a lot of systems and no spine." The diagnosis is half right and the half that is
wrong matters, because it points the first decision at the wrong question.

**Reputation is already the spine and it is a good one.** One number, earned never spent, no XP,
levels as its display, the Stand paying into the same field the quests pay into, and the level
curve deliberately aligned to the order tiers in
[13-order-system.md](13-order-system.md#reputation-tiers). Most two-person teams get this wrong and
end up with three parallel tracks. This one has one, and every system built since has plugged into
it without rework.

What is missing is not a spine. It is that **the spine has no vertebrae past level 17.** Levels
2–17 each grant a seed; 18–20 grant a hive slot, a shrine and five gems; past that reputation
accrues against nothing. The ladder does not stop because it was badly designed — it stops because
the things it was going to gate (land, order tiers, regions) are unbuilt.

**Consequence for the ordering:** "which collection is the spine" is not the right first question,
because a collection is not a progression track. In every comparable that works, the collection is
a *retention surface hung off* the progression track, not the track itself. Monopoly Go's spine is
the dice loop; the album is the reason to come back. Hay Day's spine is the order board and the
level; its collections are decoration. The answerable question is smaller and better:
**which collection is the one the player is asked to finish, and what happens to the others?**

### 2. There are not three competing collections. There are five and a half

This is worse than the brief states, and naming the real count is most of the fix.

| # | Surface | Indexed by | Finishable? |
| --- | --- | --- | --- |
| 1 | The card album | Card id (108, seasonal) | Only per season, forever |
| 2 | The creature roster | Creature (6 × 5 stars, 8 pairs) | Yes, and quickly |
| 3 | The Honey Shelf | **Seed (19)** | Yes |
| 4 | The species Almanac | **Seed (19)** — discovered, best rarity | Yes |
| 5 | Bloom Mastery | **Seed (19)** — endless ladder | **Never, by design** |
| 5½ | Keepsakes / mementos | Creature (1 named each) | Yes, and they buy nothing |

Rows 3, 4 and 5 are **the same table**. All three are keyed on the same nineteen seeds. They are
three screens rendering three columns of one spreadsheet. That is not a spine problem; it is a
presentation problem wearing a spine problem's clothes, and it is the cheapest fix in this
document.

### 3. "Idle or tapper" is a false binary, and the docs already answered it

The answer is written in two places without being recognised as an answer: *"the map serves the
40-second session and the garden the 7-minute one"* ([10-decision-log.md](10-decision-log.md),
2026-08-25) and the session-shape table in
[12-meta-layer-design.md](12-meta-layer-design.md#session-shape). The tap loop is the **texture**;
the timer loop is the **structure**. No title at scale in this lane is a pure tapper — Cats & Soup,
Egg Inc and Grow a Garden are all idle games with an active layer available to a present player.

But there is a real, unanswered question hiding behind that one, and it is more important:

> **What is the player's job when they open the app?**

Today the answer is "tap the flower, re-plant the plots." Both are explicitly designed to be
automated away — harvesters, then the drone. After automation the game asks nothing. That is the
actual hole, and "idle or tapper" cannot find it.

### 4. Nothing in this game is scarce, and that is upstream of the ceiling

Every seed returns **2.212× cost in expectation** ([04-economy.md](04-economy.md#the-one-invariant-worth-protecting)).
There is no bad purchase. There is no loss, no denial, no fail state, and — outside creature
hunger — nothing that can go backwards. The design pillar says "nothing punishes you for leaving,"
and that is right and should stay; but a pillar against *punishment* has been read as a pillar
against *stakes*, and they are not the same thing.

**Creature hunger is the only real stake in the game, and it is the best-designed thing in it.**
The sleeping face is the reason it works: an upkeep failure that is visibly reversible and says what
to do about it. That is a reusable device and it has been used exactly once.

A game where every number only goes up has nothing to climb toward, which is why the ceiling is
missing. **The ceiling is a symptom; scarcity is the cause.** Design the ceiling without answering
"what is scarce" and it will be a reset button on an economy that had no pressure in it.

### 5. Monetization should be split in two, and only the first half belongs at position 4

Specifying SKUs now is premature — there are no players, no analytics, no Unity shell, no store
listing, and the economy every SKU would be priced against is a placeholder. A piggy bank that
accrues coins cannot be priced against coins that are about to be re-tuned; a 2× rewarded video on
collect-all cannot be placed before collect-all exists.

But monetization *architecture* is a genuine constraint on the economy and must come first:

- **Monetization architecture** — what is sold, what is never sold, which surfaces exist, which
  moment per session is designed to be doubled. One page. Constrains the economy retune. **Do this
  early.**
- **SKUs, prices and placements** — after the retune, because that is what they are priced against.

### 6. The docs are the source of truth, and in six places they disagree with each other

14,473 lines of documentation against a codebase of a few hundred KB. That ratio is a strength —
it is why a cold session can be productive in an hour — but "the docs are the source of truth" only
holds while the docs agree. They no longer entirely do. The specific drift is listed under
[Stale documentation](#stale-documentation-found-during-the-audit) below; the pattern is that
**status lines and "locked decisions" go stale faster than body text**, because a later session
adds a new section rather than retracting an old one.

This is the same failure the visual standard just had, and it has the same fix:
**nothing enforces it.** [11-known-issues.md](11-known-issues.md#nothing-enforces-any-of-this)
already says so about CSS. It is equally true of design.

---

## What is strong

Do not touch these. Several are better than the market comparables they were derived from.

1. **One progression number.** Reputation, earned never spent, level as display, no XP, and the
   level curve pre-aligned to order tiers. This is why the Stand cost nothing to plug in.
2. **"Level gates, coins pay," restated identically on every board.** The meadow's cells wear the
   garden's chip and mirror its functions line for line. One acquisition rule learned once, and it
   is what stopped the second board needing a second tutorial.
3. **Share the grammar, never share the verb.** The most useful sentence in the repo. It is what
   lets the map hold six places without any of them being a clone.
4. **The four place types, and the not-a-clone test.** Producer / transformer / consumer /
   amplifier, no two of the same type adjacent, three questions before anything is built. The
   *amplifier* is the real insight and the project had already shipped one (pollination) without
   naming it.
5. **Design rules held as sim-test invariants.** "Never ask for what the player cannot produce,"
   "delivering always beats selling," "hives work with nobody stationed on them," "no pair touches
   the yield pool." Encoding a design rule as a test is the single highest-leverage practice in this
   repo and it should be extended, not just maintained.
6. **The sleeping face.** See disagreement 4. The template for every future stake.
7. **The Honey Shelf's insight** — *you plant moonflower because the moonflower jar slot is empty.*
   The best answer the project has found to its oldest question, and it arrived almost by accident
   inside a room built for something else.
8. **Feel and craft.** The visual standard, the feedback ladder, "every tap answers," the material
   recipe. This is the moat identified in [17-market-and-positioning.md](17-market-and-positioning.md#the-differentiator)
   and it is real and shipped, which is rare.
9. **The market research itself.** Docs 17 and 25 are better than most funded studios' equivalent.
   Extend; do not redo.

---

## What is redundant

### Five completion surfaces, three of them the same table

Covered in disagreement 2. **Recommendation: one Almanac, nineteen rows, five columns.**

```
🌼  Bluebell            EPIC   ×214   🍯   ★★★☆☆ Pip
    Tier 7 · 214/250 total  ▓▓▓▓▓▓░  +35%
```

Species · best rarity · lifetime count · honey made · creature raised. The Honey Shelf becomes a
column, not a screen. Bloom Mastery stays where it already is. **Five surfaces become one, and
"why plant this flower" gets answered five ways on a single row** — for the coins, for the rarity,
for the jar, for the creature, for the mastery tier.

Cost: near zero. The Honey Shelf is already `state.apiary.shelf`, a lifetime count per bloom, and
the Almanac row already renders per bloom. This is the cheapest structural improvement available.

### Two answers to "why plant this flower", pointed at different collections

Creature attraction (Pip comes for bluebells) and the Honey Shelf (the empty moonflower jar) are
**the same device** — an empty slot with a specific bloom's name on it — aimed at two different
screens. Consolidating the screens consolidates the device.

### Three decoration systems

Cosmetic decor in the Shop (built, four pieces, flat prices, never escalate — so it is bought out
in an afternoon), Hollow decorations bought with mementos (agreed 2026-08-18, unbuilt, and the only
memento sink that has ever been proposed), and a map decoration layer (deferred). **One of these
should exist.** The memento one is the strongest: it is the *item-as-key* device, it costs
keepsakes from two different creatures so it rewards roster breadth, and it is the only one that
closes a loop currently dangling.

### Two currencies buying the same category

Gnome of Fortune and Lantern Tree cost gems; Butterfly Shrine and Crystal Fountain cost coins. Same
catalogue, same shelf, two wallets, no rule distinguishing them.

### Stale dock specifications

[15-navigation-and-ia.md](15-navigation-and-ia.md) contains three dock layouts — the 2026-08-25
meta dock, a "target structure" from an earlier pass, and a 2026-08-14 interim — presented as
current in the same file. Only the first is live.

---

## What is missing, re-ranked

The brief named eight gaps. All eight are real. This re-ranks them and adds four, in the order that
the dependencies actually run.

### A. Nothing is scarce *(new, and first)*

See disagreement 4. Upstream of the ceiling, the economy and monetization.

### B. There is no reason to open the app *(new, and bigger than the ceiling)*

There is a daily **quest** (one, from a pool of three, resets on local date, pays 12 rep and a
boost). There is no daily **reward**, no streak, no notification plan, no time-gated content, and no
event. The Ridge / Night Garden is named in [25-world-map.md](25-world-map.md) as *"the one hook
the game completely lacks — a reason to open the app at a different time of day"* and it is
unbuilt.

A game with a ceiling and no daily reason to return still dies at D7. This outranks the ceiling.

### C. The session has no designed shape *(the brief named it; it is worse than stated)*

Three documents describe a session and none of them specifies one:
[12-meta-layer-design.md](12-meta-layer-design.md#session-shape) says 4–6 visits of 2–4 minutes;
[17-market-and-positioning.md](17-market-and-positioning.md#numbers-to-plan-against) says ~7 minutes
× 5.8/day; the map decision says 40 seconds on the map, 7 minutes in the garden. Nobody has written
what the 40-second session and the 7-minute session actually *contain*, beat by beat. That is two
pages and it constrains every remaining decision.

### D. The ceiling, and it is structurally harder than "add prestige"

Bloom Mastery is **endless by design**, and [25-world-map.md](25-world-map.md) states outright
*"there is no completion in a game with endless Bloom Mastery."* An infinite per-seed yield ladder
and a prestige layer are in direct conflict: either prestige resets mastery (and the endless ladder
was pointless) or it does not (and season two is trivially faster than season one, forever).
**Nobody has said which.** This is the hardest unsolved problem in the project and the ceiling
cannot be designed without ruling on it.

### E. Monetization — architecture now, SKUs after the retune

See disagreement 5.

### F. The economy retune, correctly deferred and now unblocked

The stated precondition was "after the Market and card sets land." Both have landed. The dependency
flagged in [HANDOFF.md](HANDOFF.md#two-things-to-know-before-touching-the-economy) still holds and
is still under-appreciated: **levels 2–17 grant one seed each and that is the entire reward
structure of the ladder**, so any change to the seed count is also a progression rework. Scope it
as one piece.

### G. No FTUE for the new surfaces *(the brief named it; add the scale)*

The game now has five surfaces — map, garden, Hollow, meadow, Stand — and two coach marks, both in
the garden. A new player who discovers the downward swipe by accident arrives on a map nothing has
introduced. The 60-second rule in [17-market-and-positioning.md](17-market-and-positioning.md#distribution)
has never been run against anything built since 2026-08-15.

### H. No analytics specification *(new)*

[01-overview.md](01-overview.md) lists "no analytics" as a deliberate absence and
[12-meta-layer-design.md](12-meta-layer-design.md#what-the-unity-engineer-needs) lists it as the
engineer's job. Neither is a spec. For a game whose ASO now depends on behavioural quality signals,
and whose economy is about to be retuned against guesses, **the funnel event list is a design
document and it does not exist.** It is cheap: twenty events, five funnels, and the three questions
each one answers.

### I. No launch content bill of materials *(new)*

How many seeds ship? How many creatures? How many customers, goods, cards, quests? The research
recommends 50–80 species; the game has 19 seeds and 6 creatures. Without this number the economy
retune has no target and the content pipeline has no end.

### J. Nothing enforces the design rules *(new)*

The sim-test suite enforces the economy's invariants beautifully and nothing enforces the rest —
the place taxonomy, the one-line goods test, the "no two adjacent unlockables share a category"
rule, the currency policy's "adding anything requires removing something." Each is script-checkable.

### K. Reputation gates almost nothing *(the brief named it; the mechanism is fine)*

Worth stating plainly because the brief hints at a contradiction that is not there: reputation is
**never spent**, and land is **gated by level, paid for in coins**. That model is consistent, it is
already shipped twice (garden plots, meadow cells), and it is right. The gap is only that the
parcels on the map refuse with a toast. This is a build item, not a design problem.

---

## What should be cut

Ordered by confidence. Each states the counter-case.

### 1. The Honey Shelf as a separate surface — fold into the Almanac. **High confidence**

Covered above. The insight survives intact; only the screen goes. *Counter-case:* the Shelf has its
own dock button in the meadow and reads well there. *Answer:* keep the button; point it at the
Almanac filtered to the honey column.

### 2. Seasonal card albums — keep the pack, cut the cadence. **High confidence**

[19-card-album.md](19-card-album.md#the-seasonal-commitment-honestly) already argues against itself:
*"~108 hand-authored illustrations plus ~108 lines of writing, every season, forever"*, *"a season
is a subscription to your own output"*, and *"missing one scores worse than never promising one."*
[15-navigation-and-ia.md](15-navigation-and-ia.md#a-note-on-the-collection-tab) adds *"do not
over-invest in it."* Two documents are telling you the same thing.

**Recommendation: one permanent album, no seasons, no announced cadence.** Keep the built pack
opening — it is good dopamine and it costs nothing to keep. Keep the spawning pack proc, which is
the best idea in that document. Cut the seasonal treadmill and the Mythical-chase framing. A
finite, permanent, completable album is a better fit for a cosy audience than a rotating one, and
it is the one collection commitment a two-person team can actually keep.

*Counter-case:* albums went from 21% to 72% of top-100 US iOS games, and seasons are how they
monetize. *Answer:* they monetize through duplicates, trading and social pressure — all three of
which this game has already ruled out, which is exactly what doc 15 says.

### 3. The Greenhouse, from the biome candidate list. **High confidence, and free**

Its stated identity is "controlled weather — the mutation-farming garden." That is an **amplifier
of an amplifier**, and it points directly at the one income share the economy carefully tuned and
holds under test (20–30% from mutations, asserted for a fast seed and a slow one). A place whose
purpose is to break a tested invariant should not be on the list. It is unbuilt, so cutting it
costs a table row.

### 4. Bloom Mastery — bound it rather than delete it. **Medium-high confidence**

It is built, it is a working coin faucet, and [16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery)
already concedes it did not answer the question it was built for. Its remaining problem is that
being endless makes prestige unsolvable (gap D).

**Recommendation: cap it** — roughly tier 12–15 per seed, which is where the yield bonus reaches
+60–75% and the goals reach 500–1,000 harvests. That turns nineteen endless ladders into nineteen
**completable** ones, gives the Almanac a real completion state, and makes it something prestige can
legibly reset. *Counter-case:* endless ladders mean a late-game player is always mid-goal.
*Answer:* that is the ceiling's job, and it is doing it badly.

### 5. The Potting Bench merge board — replace the mechanic, keep the role. **Medium confidence, and this relitigates a decision**

Stated plainly because the brief asked for it: **I think merge is the wrong mechanic here, and the
decision that chose it was made in a context that no longer exists.**

When merge was chosen over timed crafting (2026-08-16, *"a timed craft bench is the worse version
of merging"*), the bench was going to be the project's only meta system. It is now one of six
places, behind two navigations from the garden, on a map with a Stand, a meadow and a Hollow. The
comparison changed.

- **Merge is a core loop, not a side room.** Gossip Harbor grosses $100M a month because merge *is*
  the game — the board is the first thing you see and the only thing you do. A merge board reached
  by pulling back to a map and diving into a shed is a room nobody visits.
- **It is the largest remaining build item** and the entire "one new mechanic only" budget. Drag
  handling, board-full states, generators, basket overflow, and a sheet whose fling-to-dismiss
  already fights it ([HANDOFF.md](HANDOFF.md)).
- **The Stand launched without it.** Order-shapes fill the transformer role for free — a Bouquet is
  "three roses and two bluebells" and no bouquet object exists anywhere. That was the best idea in
  the goods decision and it proves the role does not require a crafting system.
- **A timed queue is what this game is short of.** [17-market-and-positioning.md](17-market-and-positioning.md)
  names multi-clock producers as device #8 — *"one system that serves the fifteen-minute checker and
  the once-a-day player simultaneously."* A production building that takes 3 lavender and 1 honey
  and returns Lavender Tea in twenty minutes is the Hay Day pattern, is cheap, and directly answers
  gap B: it is a reason to come back at a specific time.

*Counter-case, and it is not weak:* the merge simulation is already written and tested; four of the
six goods families in [26-goods-catalog.md](26-goods-catalog.md) are specified as merge chains; and
the market genuinely does favour merge+orders right now. *Answer:* the simulation is ~200 lines
against a UI that is the real cost, the families re-map onto recipes without changing a single good,
and "the market favours merge" is an argument for building a merge game, not for putting a merge
board inside an idle game.

**If merge is kept, the honest version is that it moves to the centre** — the bench becomes the
game's second core screen, not a shed. That is a bigger decision than it currently looks.

### 6. Split cosmetic currencies — pick one. **Medium confidence, low stakes**

### 7. The three paused bench quests and their three stand-ins — resolve. **Low stakes, do it with 5**

They are stable and documented, but they are 98 of the ladder's 777 reputation held in a state that
needs explaining every time anyone reads the ladder. Whatever happens to the bench decides them.

---

## Stale documentation found during the audit

Not a criticism of the practice — a list, because "the docs are the source of truth" is only true
while it is true.

| Document | Says | Actually |
| --- | --- | --- |
| [13-order-system.md](13-order-system.md) | "**Status: specification, not built.**" | The Garden Stand shipped 2026-08-25 |
| [12-meta-layer-design.md](12-meta-layer-design.md) §4 | The Apothecary is a region with timed recipe crafting | Folded into the bench, 2026-08-14 |
| [12-meta-layer-design.md](12-meta-layer-design.md) locked decisions | "Offline production runs at full rate, capped around eight hours" | Two-axis model, 25% base rate / 4h base cap, both upgradeable |
| [12-meta-layer-design.md](12-meta-layer-design.md) locked decisions | "Storage caps on raw materials, generous and upgradeable" | Does not exist anywhere and never has |
| [12-meta-layer-design.md](12-meta-layer-design.md) | "Deferred, not cut: the Critter Grove" — attract creatures by planting specific flowers | Shipped 2026-08-16 as the creature roster. This *is* the Critter Grove |
| [15-navigation-and-ia.md](15-navigation-and-ia.md) | Three dock layouts presented as current | Only the 2026-08-25 meta dock is live |
| [22-creatures.md](22-creatures.md#what-is-not-built) | "**Only one creature.**" | Six |

---

## The order to settle things in

The brief proposed: spine → ceiling → retention → monetization → economy. Four changes, all
argued above.

| # | Item | Why here |
| --- | --- | --- |
| **0** | **The loop** — what a session is, what the player's job is after automation, and what is scarce | Everything below depends on it, and it is the cheapest of the six. "Which collection is the spine" cannot be answered without knowing whether a session is 40 seconds or 7 minutes |
| **1** | **The spine** — one collection to finish, the others demoted to feeders | Reframed per disagreement 1. Includes the five-into-one consolidation |
| **2** | **The ceiling** — seasonal turnover, and it must rule on Bloom Mastery | Gap D. Cannot be designed before 0 and 1 |
| **3** | **Retention and session design** — daily reward, streak, notifications, the Night Garden as the time-of-day hook | Outranks the ceiling on impact but depends on it for what a "season" is |
| **4** | **Monetization architecture** — what is sold, what is never sold, which surfaces exist | One page. Constrains 5 |
| **5** | **The economy retune** — including SKU pricing, and the seed-count decision it drags with it | Constrained by 0–4, as the deferral always said |
| **6** | **FTUE across all five surfaces** | Last, because it teaches whatever the above decided |

Retention moved *below* the ceiling only because a season is the unit a streak and a notification
plan hang off. If the ceiling stalls, run 3 first — it is independent enough.

---

## Questions that are genuinely the owner's

Not rhetorical. Each changes what gets designed.

1. **How many creatures, eventually?** The roster is the strongest spine candidate — it is coupled
   to the garden, it has the only real stake in the game, it has depth beyond have-or-not, and it
   feeds forward into every future place through stations. But **six is not a collection**; the
   research band is 7–12 and Neko Atsume runs 60+. One creature per bloom caps at nineteen, maps
   exactly onto the Almanac's nineteen rows, and makes the consolidated table complete. That is a
   real content commitment (thirteen more characters, traits, and ~15 more named pairs) and it is
   the owner's call, not the advisor's.

2. **Is merge kept, moved to the centre, or replaced?** See cut 5. The three answers lead to three
   different games.

3. **Does a season clear the garden?** The cosy framing — *the garden clears because that is what
   gardens do, and you keep the seeds* — is already written and is good. What it does not say is
   whether creatures, the Hollow, the Almanac record and the cards survive a turnover. My strong
   recommendation is that **creatures never reset** (losing a pet is the one thing this audience
   will not forgive), but that is a call worth making explicitly rather than by omission.

4. **What is the launch content bill of materials?** Gap I. Needed before the retune has a target.

5. **Is the cheat-button decision still current?** [11-known-issues.md](11-known-issues.md) says
   revisit "before any real external audience." A store listing is that audience, and the FTUE work
   at position 6 is the natural moment.

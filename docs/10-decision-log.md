# Decision Log

Why things are the way they are. Append new entries at the top with a date. Record the reasoning,
not the diff — git already has the diff.

---

## 2026-08-16 — Keepsakes are kept, and an icon fallback that hid two mistakes

**Built:** `state.mementos`, a lifetime count per keepsake id, shown on each creature's Almanac row.
23 new assertions.

**The owner spotted that the memento was named but not stored.** `collectKeepsakes()` turned it
straight into coins and gems and the object itself evaporated, which made the name decoration. Six
keepsakes each written as a small joke about their creature — *Someone Else's Button* because Bramble
brings you things and not all of them are hers — and none of them existed after the tap.

**Counts, not booleans**, for the same reason the card album stores counts: nothing spends mementos
yet, but any future craft, display or trade needs quantities, and retrofitting a count onto a boolean
after players have saves is the migration worth spending one line to avoid.

**Keepsake ids are now separate from display names**, so renaming one can never orphan a save — the
same lesson as quest ids. A test asserts they are unique and never collide with a card id.

**Recorded as intent:** the coins and gems are the placeholder, not the memento. Eventually the object
should be the reward and the currency should shrink, because a keepsake that pays 250 coins is a
wallet top-up wearing a name.

**A silent fallback hid two missing icons.** `Icons.get()` returns `sparkle` for an unknown name, so a
typo renders a plausible wrong glyph rather than failing. `gift` and `moon` were referenced by
creature traits and pairs for a whole session while quietly drawing sparkles. Both added,
**`Icons.has()`** introduced for an exact check, and the suite now asserts every icon named by
`CREATURE_TRAITS`, `CREATURE_PAIRS`, `BENCH`, `DATA.upgrades` and `DATA.decor` exists.

*The obvious version of that test is wrong*, and it is worth recording because the next person will
write it: comparing `Icons.get(name)` against `Icons.get('nonsense')` reports every legitimate use of
`sparkle` as a failure. It produced three false positives before `has()` existed.

**`BENCH.chain` carried an `icon` field nothing reads**, found by the same guard — the merge spike
draws its own shapes. Dropped rather than authoring five speculative glyphs for a feature with no
surface: dead data is worse than a missing icon.

---

## 2026-08-16 — Eight named pairs, and slots moved earlier so they can be found

**Built:** eight pairs, their eight consumers, a Companions block in the Almanac, a discovery banner,
and 35 new assertions. Drafted on paper first and owner-approved before a line was written, which is
the right order for content this cheap to author and this easy to get wrong.

**The problem pairs solve:** six creatures and three slots is 20 trios, and without pairs the answer
is fixed — pick the three biggest numbers. A loadout that has one correct answer is a ranking, not a
decision.

**Two perfect trios, deliberately.** Pip + Luna + Ember lights Nightbloom, Lantern in the Rain and The
Long Watch — a *night-and-away* build. Thistle + Bramble + Bumble lights The Hedgerow, Jar of Odds and
Ends and The Delivery Round — a *finds-and-gems* build. **Neither dominates; they reward different
lives**, which is the property to protect as the roster grows.

**No pair touches the yield pool**, and a sim-test asserts a full loadout never changes
`critterPayoutMult()`. Eight pairs quietly joining the harvest product would be a multiplier stack
wearing eight names — the exact thing the pool rule exists to stop.

**Every creature sits in at least two pairs**, asserted. A creature appearing in none would be
strictly worse than the rest the moment pairs existed, and the whole roster would collapse to five.

**Habitat slots moved from 1 / 8 / 14 / 20 to 1 / 5 / 10 / 16**, at the owner's call. Pairs need two
slots to exist at all, so at the old spacing a player could not form one until level 8 or hold two
until 14. **Discovering the most interesting mechanic in the system late is the same as not having
it.**

**Nightbloom was toned down before shipping, also at the owner's call.** Upgrading Dewkissed (×2) to
Gilded (×10) is a 5× jump on that harvest, so it became a coin flip rather than a certainty, and
`nightbloomCap` stops it ever producing the top tier. **The game's biggest moment should be found, not
engineered** — the same principle that keeps Wonderfall unpriced.

**Pairs are binary, and categorical.** Both out and it is on; no scaling with stars, because a bonus
you cannot tell is active is not a bonus. And every effect is a different *thing happening* rather
than "+X% more" — "a mutation at night comes in one tier higher" is a pair, "+15% mutation chance" is
just Pip again, louder.

**Two implementations are not where you would guess, and are worth knowing.** Night Errand **banks a
rarity floor** in `state.luckyPacks` rather than tagging a pack, because `state.packs` is a count and
always has been; `openPack()` spends one floor on its first card. And Nightbloom is applied at **both**
mutation roll sites — the live one and the gem-skip path — because applying it at one would make it
silently inconsistent depending on how the plant finished.

**Unformed pairs show both portraits with the effect hidden.** A locked thing you can see is a goal; a
missing one is nothing — the same rule the seed picker already follows. It also tells the player
exactly which creature to go and find.

**Every pair is tested on and off.** The "off" half matters more: a pair that is silently always on is
indistinguishable from a buff nobody chose, and nothing about the panel would look wrong.

---

## 2026-08-16 — Five more creatures, and a feature vocabulary instead of five drawings

**Built:** Thistle, Bramble, Luna, Ember and Bumble, their five traits and five consumers, and the art
features they needed. 16 new assertions. Roster in [22-creatures.md](22-creatures.md#the-roster).

**Each one is on a different bloom and a different axis, spread across seed unlock levels 1 to 10**, so
creatures arrive gradually rather than all at once and the roster paces itself against the seed ladder.
A sim-test holds all three properties.

**The loadout is deliberately not six parallel percentages.** Bumble *buffs the other creatures*,
which makes choosing three self-referential rather than a ranking — and it is the cheapest possible
preview of what synergy pairs will do.

**Luna is the only trait in the `yield` pool, and its cap is the clock.** Night is roughly 32% of the
cycle, so +30% at night is about +10% on average, and the bound is something the player does not
control. That is the shape any future yield trait should copy — nominally large, structurally bounded.

**A trait wired to nothing is invisible**, because nobody notices a number that never moves. So there
is now one assertion per trait proving the value reaches its consumer, including two negative cases:
no pack turns up without a forager tending, and keepsakes go back to their normal wait when the helper
rests.

**`gemLuck` goes at the roll, not in `gemChanceFor()`.** The base rate stays the derived
grow-time number that fixed the gem faucet on 2026-08-15; a creature multiplies the roll beside the
Lantern verb. A test asserts the base function is untouched.

**`keepsakeSpeed` is floored at a quarter of the authored wait**, so no stack of helpers can turn
keepsakes into a tap-to-print button.

**Art: one body and a vocabulary of features, not five drawings.** `crown` is
`sprout | spines | ears | antennae`, plus optional `wings`, `tail`, `stripes` and a palette. Six
creatures fall out of that and a seventh is a data row. **One crown each** — two turns the silhouette
to mush at thumbnail size.

**Two art bugs found by looking, which no test could catch.** An inline `clip-path: path()` silently
did nothing, so the bee had no stripes — the one thing a bee needs; it now uses a real `<clipPath>`
with a unique id per draw. And the moth's wings were tucked behind her body, reading as small nubs;
wings have to clear the body by a wide margin or a moth stops being a moth.

**The shading band was removed from every creature.** An `inset()` clip drew a hard horizontal seam
across the body, most obvious on a light one. The house style is flat fills inside one thick outline,
so the band was off-style as well as an artifact.

---

## 2026-08-16 — Creatures are raised, and the bloom that attracts one is what grows it

**Built:** five stars per creature, an escalating growth threshold, a level-up beat, stars and a
growth bar in the Almanac, and a glow that brightens with the star. 21 new assertions.

**The owner's ask, and it fixes a real weakness:** a creature that arrives fully powered has nothing
left to give, which is exactly the "stops asking for anything" problem Bloom Mastery was invented to
solve for flowers. A pet is something you raise.

**The design that made it cheap: the duplicate comes from the bloom that attracted it.** Rather than
an inventory of duplicate pets to manage, continuing to grow bluebells brings another Pip that merges
in — same fiction, no new machinery, and it reuses the `discovered` lifetime record already in place.
Thresholds escalate `count × growth^(level−1)`, so Pip is 5 / 15 / 45 / 135 / 405.

**The payoff is larger than the levelling.** A low-tier seed now has a reason to be in the ground long
after its coins stop mattering — **the first real answer this project has had to "why would I ever
plant a Daisy again."** That question has been open since the AdVenture Capitalist diagnosis, and
neither verbs, mutations, mastery nor orders answered it.

**`trait.value` became the ceiling rather than the current value.** A one-star creature gives a fifth.
This was chosen over authoring five values per creature because it keeps a creature one data row, and
the listed number stays the promise rather than the reality.

**The growth check loops.** A long absence can bank enough for more than one star, and granting a
single level per harvest would silently swallow the rest — the same class of bug as a mutation roll
that never fires.

**Stars, not the word "level."** Five pips under a name say how grown something is at a glance, which
is what the owner asked for and is also the right call for a game read at arm's length.

*Rejected: an inventory of duplicate creatures.* It is closer to the literal merge fiction, but it
adds a management layer, a second collection surface and a whole new save shape for a feeling the
escalating threshold already delivers.

**A real bug the change exposed.** The board sizes itself to the stage, so on a taller viewport it grew
*down over* the creature yard and put Pip on top of a plot — precisely the thing
[22-creatures.md](22-creatures.md) says must never happen, since a creature on a plot reads as
something to harvest. The yard's height is now reserved as `padding-bottom` on `.stage` and
`sizeGarden()` subtracts it, so they stay separate at every screen size. Found by looking at a
screenshot, not by a test; the suite cannot see layout.

---

## 2026-08-16 — Retracting the trait-collision rule, and only tending pets on screen

**A correction to an entry written the same day.** That entry said a creature trait must not share an
effect category with a verb, on the grounds that the two would cancel out. **The owner pushed back and
was right.** They stack, and stacking buffs is the pleasure of this genre — this project's own market
doc cites Cookie Clicker's 36 synergy pairs approvingly, and Melvor and Egg Inc are built on deep
stacks.

**Where the reasoning went wrong:** the rule was imported from the verb system, where it is correct
for a specific reason. A plot picks **one** verb, so two verbs sharing a category would make that
choice meaningless. A loadout picks **three of N**, which is a different problem with a different
answer.

**What replaces it — the pool a trait stacks into.** Harvest payout is already seven multiplied terms
and the mastery ladder is endless, so the only genuinely dangerous pool is one that multiplies that
product. Every trait now declares `pool`: `capped` (a stat with a ceiling, free), `chance`
(self-limiting, since contribution is `chance × (mult − 1)`), `utility` (off the curve), or `yield`
(compounds — keep few and small). Four traits at +25% yield is 2.44× on top of mastery, verbs, rarity
and mutations, and that is the number worth watching rather than any notion of collision.

**Two assertions replace the retracted one, guarding what actually breaks:** the roster may not be all
one kind of effect, because six creatures that all add a percentage turn choosing three into a ranking
rather than a decision; and at most a third of the roster may sit in the `yield` pool.

**Only tending creatures stand in the yard**, at the owner's call — four is the most the lawn holds
before it reads as clutter. A resting creature leaves the screen but stays home and stays in the
roster, one tap from returning. This also makes tending *visually* meaningful rather than a number in a
panel.

**Recorded as a direction, not built:** the owner wants a farmhouse or den where resting creatures
live — visit them, feed them, swap the loadout there rather than in a list. That is the right eventual
home for feeding and any relationship mechanic, and it is a much better surface than a list row.

---

## 2026-08-16 — Creatures get traits, and a slot limit to make them a decision

**Built:** one trait per creature, habitat slots, a tending toggle, and a **The Habitat** block in the
Almanac. 22 new assertions. Design in [22-creatures.md](22-creatures.md#traits-and-tending).

**The owner's framing, and it is a good one:** badges never felt integrated, but creatures read as
*pets that carry attributes* — and the wish is to swap them for different parts of the game later.
Character first, buffs second, but with enough of a stat layer to feel strategic.

**The slot limit is the mechanic, not the trait.** A trait on its own is a badge with a face. What
makes it interesting is that there are more creatures than slots, so *which one is out* is a standing
question. Slots open at levels 1 / 8 / 14 / 20. **Nothing is ever taken away** — every creature that
has moved in stays in the garden and stays visible, resting or not, because removal is the one thing
this audience punishes hardest.

**Two rails, both already in the docs, both easy to fall off.**

*RPG framing is the trap, not RPG depth.* Idle RPG has the worst install rate in mobile at 2.0 per
1,000 impressions, per [17-market-and-positioning.md](17-market-and-positioning.md). That is a
marketing constraint, not a design one. Loadouts and stats are fine; "RPG" on the store page is not.

*A trait must not share an effect category with a verb.* **Retracted the same day — see the entry
above.** They stack, and stacking is the point of the genre; this rule was imported from the verb
system, where it is correct for a reason that does not carry. Kept here as written because the log
records what was decided at the time. The reasoning as it stood:

Verbs own growth, yield, rarity, gems,
density, propagation and night, and a sim-test already asserts no two verbs collide. A trait on one of
those axes would quietly cancel a verb out and nothing would look broken. **Two new assertions
enforce it**: no trait may sit on a verb category, and no two creatures may share a trait category —
so the roster is *forced* to rotate categories rather than stacking percentages, which is the
AdVenture Capitalist rule applied to a new system before it can go wrong.

**Pip raises the mutation catch chance, never a payout.** Wired into `catchMultiplier()`, the single
choke point both mutation roll paths already run through, so there is no second consumer to keep in
sync. Chance-not-payout is what keeps the 20–30% mutation income target computable.

**Consumers read a trait by id, not by creature.** `critterTrait('mutationLuck')` sums across everyone
tending, so adding a creature is genuinely a data row — the consumer already sees it.

**Two migration rules.** An arrival tends itself when there is room, because a first creature that did
nothing until the player found a toggle reads as broken. And **an absent `tending` field means "tend
it", not "off"** — a save from before traits must come back working, which is the same rule as never
taking a seed away from an old save. A deliberate rest is still respected, and the slot count trims
the overflow either way.

*Rejected: hanging the toggle off `data-buy`.* `syncAfford()`'s final `else` treats anything
unrecognised as a booster and throws — the trap already recorded in the handoff. The button uses
`data-tend`, and it was verified that `syncAfford()` still runs clean with it on screen.

*Rejected: a dedicated creatures panel, for now.* The Almanac already owns collection, the sheet
system already exists, and a habitat block there is both cheaper and more discoverable than a fifth
dock tab against a dock that caps at five.

---

## 2026-08-16 — The habitat direction, and the first creature

**Built:** `critters.js`, one creature end to end — Pip the Grove Spirit — and 36 sim-test
assertions. Design in [22-creatures.md](22-creatures.md).

**The owner's diagnosis, and it was the right one:** *"There's no life like Merge Dragons, outside of
our main character."* The world had a place and a character but no inhabitants. Every system built
in the previous month was a modifier on one verb, and nothing lived in the garden.

**The reframe: this is a habitat, not a factory.** The whole design had been thinking in production
chains — garden makes flowers, bench makes goods, market consumes goods. That is Township, in a
crowded capital-heavy lane, and it is not what the research says this audience wants: the likely
audience is **69% female with Completion and Fantasy as the top two motivations**, and neither is
"optimise a supply chain." The garden should be a place that becomes alive because of what you plant.

**Market evidence checked the same day, not recalled:**

- **Grow a Garden — this project's own demand proof — has gone all-in on creatures**: pet mutations,
  a Pet Mutation Machine, the pet level cap raised 100 → 500, tameable pets, 60-day event worlds.
- **Shared spaces and cooperative decoration show up to 300% longer retention** than solo cozy
  experiences, which is a direct measurement of the thing the owner was feeling.
- **Neko Atsume 2 added a "Going Out" mode** for visiting other players' yards — from the studio that
  defined the solitary cozy game.
- **Simulation revenue is up ~12% YoY** and western cozy with ethical monetization is still called
  out as underexploited. The lane in [17-market-and-positioning.md](17-market-and-positioning.md)
  is still open.

**The rule that makes it worth building: a creature is a character first and a mechanic a distant
second.** A grove spirit that is "+5% growth" with a face on it is the badge list in a costume, and
it fails for exactly the reason the AdVenture Capitalist trap describes. A sim-test asserts every
creature carries a name, a species, a hint, a line about itself and three moods of dialogue, so a
stat-only creature cannot be added without the suite noticing.

**This is the most direct answer the project has found to *why plant this flower*.** Verbs made
flowers behave differently; mutations made any flower exciting; orders would make a flower wanted.
None made you want a *specific* bloom. **Pip comes for bluebells and for nothing else** — desire
rather than a quota, for the price of a data row.

**Attraction reads `state.discovered`, never `state.flowers`.** Flowers are spendable, so an
attraction keyed to the pantry would let a creature *leave* when the player crafts — the same class
of bug that once jammed the quest strip on an uncompletable goal.

**Petting pays nothing, deliberately, and a test asserts it.** A creature you tap for currency is a
button. A creature that just reacts is a pet. The keepsake is the reward; the tap is the
relationship.

**Keepsakes cap.** Three waiting is a small gift, thirty is homework, and homework is what the cosy
pillar exists to prevent. `settleCritters()` runs once on boot so a creature that has been full for
a week is not silently banking time it can never use.

*Rejected: forking the repo.* The owner asked whether to start fresh to avoid losing what exists. The
opposite is true — creatures and breeding are the **first features that reuse nearly everything**
already built: the garden, adjacency, the day/night clock, the Almanac's lifetime records, the
welcome-back scene (which is literally the Neko Atsume screen), the talking flower as narrator, the
save discipline and the test harness. A fork would mean rebuilding all of it and splitting the docs,
which are the actual asset. The build was tagged **`v1-bench`** instead, so every state is
recoverable with one command.

*Rejected: copying the kodama design.* The owner asked for Studio Ghibli's forest spirits, which are
from *Princess Mononoke* rather than *Spirited Away*. The game ships commercially, so Pip borrows the
archetype's silhouette language and is original work: a sprout instead of a bare head, moss speckles,
blush, and a saturated storybook palette. Bright, never haunted.

**Three art rules learned by drawing it.** The sprout has to clear the body or the crown swallows it
and it reads as a generic ghost. Blush must stay well inside the silhouette or it reads as a
rendering fault. And blush plus an eye highlight are what keep a pale spirit friendly.

**A pre-existing flake was found and fixed on the way.** `a guaranteed crit increments the crit
quest` set `critChance = 1` and tapped — but `critChanceNow()` caps crit at 99% on purpose so a tap
can always miss, making the test's name a lie about one run in thirty. Confirmed against `v1-bench`
that it predated this work, then pinned the roll. 0 failures in 40 runs, from 3 in 30.

**What this means for merge, stated plainly:** under the habitat frame the bench becomes optional. It
is fun and it is tested, but it is a separate board with a separate verb whose main job — turning
flowers into goods a customer wants — is not one this direction especially needs. It stays dormant
and undecided rather than being quietly deleted or quietly shipped.

---

## 2026-08-16 — The Potting Bench: merge replaces the Apothecary, and the garden is its generator

**Built:** the bench simulation, its save, and 51 sim-test assertions. **Not built:** any surface for
it. Design in [21-potting-bench.md](21-potting-bench.md); the feel was settled first in a standalone
spike at `tools/merge-spike.html`.

**The owner's diagnosis is what started this: the game feels solitary.** One screen, one verb, and
every system built in the last month is a modifier on that verb rather than a second thing to do.
Merge is the second verb, and the Apiary — which the owner has never liked — is the thing it is
replacing the sibling of.

**Merge replaces the Apothecary, not the Apiary.** Both turn garden output into goods the Market
will want, and the timed craft bench is the strictly worse version: pick a recipe, wait, collect is a
vending machine with a progress bar. This also resolves a tension recorded on 2026-08-14, where the
Apothecary was being folded away *and* a Market was being planned that needs a supply chain to ask
for. Crafting does not die; it becomes the good version.

**The positioning claim worth keeping:** every shipped merge game gates its board behind a generator
— energy, a timer, a paid tap — and that generator is the most complained-about part of the genre.
This game already built a generator people enjoy for its own sake. Nothing else in the category has
one.

**The rule that protects the economy: the bench never outputs a seed or a flower.** Two ladders that
both mean "better flower" eat each other, and a bench that manufactured expensive seeds from cheap
ones would route around both the coin sink and the level ladder — levels 2–17 grant one seed each,
which is the entire reward structure of progression. A sim-test asserts no chain id collides with a
seed id.

**Entry tier scales with the seed, because this exact bug has already been fixed once.** A flat
one-item-per-harvest rate makes Daisy spam the best feed, since a Daisy cycles 65× faster than an
Eternal Crown — the same inversion the gem faucet had before chance was derived from grow time on
2026-08-15. Entry is `seedBucket + rarityBump` instead, and the suite asserts a Daisy cannot
out-feed the endgame seed by more than 1.35×.

*The rarity half is the part worth having.* The 70/20/8/2 roll already happens on every harvest and
currently only scales a number. Making it decide where the bloom lands on the chain costs nothing
and makes a Legendary worth watching. Measured in the spike it roughly **triples** throughput
against Commons only, so `+3` for Legendary is the first number to cut if the bench runs hot.

**Merge-3 by adjacency, chosen over merge-2 by stacking**, at the owner's call after playing both in
the spike. Merge-3 chews through surplus about 1.6× faster, which matters when the generator never
stops, and adjacency makes the bench a spatial puzzle that rhymes with the garden's verb adjacency
instead of merely sitting beside it.

**Two things the spike found that reasoning did not.**

*Spatial merging can deadlock.* A full bench with no three alike adjacent has no legal move at all,
and a checkerboard of petals and posies reaches that in about forty harvests on a 4×4. Stacking never
had this problem, because a match was always droppable. The escape hatch is **banking** — drag an
item off the bench into stock — which unsticks the board and happens to be the exact gesture a Market
customer will collect from. A sim-test builds the deadlock and asserts banking is the way out.

*A grid that grows resizes everything on it.* The bench is therefore a fixed 6×6 with padlocks on
the locked cells, the same language the garden already uses for plots 5–8, unlocking 4×4 → 5×5 →
6×6. Board space is the tension in this mechanic and it is a coin sink the late game badly needs.

**A cascade is played one rung at a time, and each rung is slower than the last.** The first pass
resolved a whole cascade inside one frame, so six petals appeared to collapse straight into a bouquet
— the logic was already stepwise, it simply had no time. `benchMergeOnce()` now performs exactly one
merge and returns; the caller owns the beat. **The bench must never look ahead** and resolve a chain
in one go. Timings escalate 300 ms → 396 ms → 523 ms because a cascade should build like a drum roll;
a flat one blurs into a single event.

**Harvests land in the basket, never on the bench.** Offline earnings run all night, and an idle
generator feeding a merge board directly hands the player a full board on open — the worst feeling
the genre has.

**The three Apothecary quests were repointed, not removed.** They carry 98 of the ladder's 777
reputation, and the suite asserts the ladder still reaches level 17 where Eternal Crown unlocks.
Dropping them would also have jammed the quest strip on an uncompletable goal, exactly as the sell
quests once did. **Their ids are deliberately kept**, against the "never reuse an id" rule in
[16-progression-and-quests.md](16-progression-and-quests.md): a new id orphans any instance already
sitting in a player's `quests.active`, and an orphaned active quest is the jam this change exists to
avoid.

*Rejected: shipping the panel in the same commit.* The simulation is headlessly testable and the
panel is not — `tools/sim-test.js` cannot see a `ui-*` file, as the `ui.js` split proved. Landing
both blind into a live game is how a working build breaks. The bench runs invisibly until the panel
lands; nothing is removed and nothing regresses.

*Rejected: deleting `CRAFT_RECIPES` and `state.craft` now.* They are untouched so existing saves keep
parsing. Only the quests moved.

---

## 2026-08-16 — Splitting `ui.js`, and how the shared scope gets passed

**Decided before moving a line, because discovering it halfway through is how this goes wrong.**
`ui.js` had grown to 2,309 lines and every function in it closed over the same IIFE scope. Any
split has to answer one question first: how does a function that has moved to another file still
reach `$`, `S`, `el`, `fmt`, `openSheet` and `syncAfford`? There is no build step and
`<script type="module">` is banned, so the answer cannot be imports.

**One global, `UI`.** `ui-shared.js` loads first with the dependency-free part of that scope; every
other UI file attaches its public functions to the same object as it loads. Cross-file calls are
written `UI.something()` and resolve at call time, so the `UI.` prefix is a countable marker of how
much one file reaches into another, and the UI files after `ui-shared.js` stay order-independent.

**Rejected: passing the scope as an argument to each module's IIFE** (`UI_SHEET(shared)`). It reads
better, but it forces the dependency edges to be settled at load time, which puts the files back in
a strict order and makes a cycle — the sheet needs `toast`, `ui.js` needs `openSheet` — impossible
to express without splitting one of them again.

**Rejected: several globals, one per file** (`UI_SHEET`, `UI_SCENERY`, …). It is more precise about
who owns what, but a reader then has to know which global holds which helper before they can find
anything, and the precision buys nothing that grepping `UI.` does not already give.

**Rejected: leaving it alone.** Tempting, since the file works and there is no automated test above
the simulation layer to catch a mistake. But the cost of the split only grows, and the seams —
sheet panels, scenery, event wiring — have been named in the docs since before any of this code was
written.

**The split is pure motion.** No behaviour changes, no reformatting, no drive-by fixes; anything
spotted along the way went into [11-known-issues.md](11-known-issues.md) rather than into the diff.
One seam per commit, with `node tools/sim-test.js`, `node --check` and a real play of the moved
panel after each.

---

## 2026-08-15 — Packs turn up in the garden, and a badge that needed an animation to exist

**Built:** a fourth tap roll drops a card pack onto a plot, where it waits to be tapped. Plus dev
cheats to grant a card, a mythical, a completed set, or a pack on the ground.

**The Lucky Ladybug shape, deliberately.** *"Something turned up in your garden, go and get it"* is a
better beat than a number appearing in a wallet, and the pattern is already built and already tuned.
What changed is that the badge is **tappable** — the ladybug's is decoration, this one is the reward.
New icon: a fanned deck of three cards, in the house style.

**Always on, with no badge behind it** — unlike the three proc badges, which all gate on an upgrade.
`packDropChance` is a flat 0.0015 per tap. The reasoning: this is the album's **only in-game source**
of packs, so a player who has bought nothing still has to be able to find one. A pack behind a
paywall of coins would make the album invisible to exactly the players most likely to start it.

**This is how the album touches the garden without being coupled to it.** The garden is *where packs
turn up*; it never decides *what is inside them*. That distinction is the whole reason the album was
untied from flowers earlier today, and the spawning pack is the version of "connect them" that does
not undo it.

**A real bug, caught by looking rather than by a test.** The badge started at `transform: scale(0)`
and relied on a keyframe to become visible. **A badge that only exists once an animation has run is
invisible and uncollectable anywhere the animation does not play** — a frozen CSS clock, a reduced
motion path someone adds later, an engine that drops the keyframe. Visibility now comes from
`display`, and the landing and bob are a flourish on top. Worth generalising: *never let an
animation be the thing that makes an interactive element exist.*

**Environment note, not a bug.** The badge appeared to do nothing in the automated browser because
`requestAnimationFrame` had stopped entirely — measured **0 frames** across two calls — so
`renderPlots()` never ran to apply the class. This is the hidden-pane version of the frozen-clock
trap already in the handoff. Verified instead by applying the class directly and by dispatching a
real `pointerdown`, which granted exactly one pack and cleared that plot alone.

**`clearGarden()` in the suite did not reset `packDrop`**, so a test that filled all eight plots
leaked into the next one. Third time a new per-cell field has caught that helper out, after
`mutation` and `mutateAt` — the helper now clears all three.

---

## 2026-08-15 — The card album built, with art as a slot rather than a dependency

**Built:** 12 sets of 9 = 108 cards in one season, pack opening, the album and set views, and the
reveal. **Not built:** the spawning-pack proc, dust, seasons, completion rewards.

**The structural decision: card art is a slot.** `art` is either `{ icon, tint }` — a placeholder
composed from the existing 33-icon vocabulary — or `{ src }`, a real illustration. `cardArt()`
renders either and nothing else in the codebase knows which it got.

That is what lets two things be true at once: the web build keeps its **no-binary-assets** rule
intact, and real card art can arrive whenever the owner wants without touching code. The owner has a
Midjourney account and asked whether it could be used. It can — just not *here*. The web build is the
design lab; finished illustration belongs to the Unity port, which has an asset pipeline and no such
rule. **Nine motifs cycle across all twelve sets on purpose:** the feature is the album, not the
picture.

*Rejected: bending the no-binary-assets rule for cards.* Tempting, since cards are inherently
illustrated. But it would put ~108 PNGs in a static site with no build step, for a prototype whose
whole job is to test whether the loop is fun — and the loop is testable with circles and icons.

*Rejected: reusing `Flora.head()` for card art.* It would have given 19 genuinely lovely images for
free, and it would have quietly re-coupled the album to the garden — the exact mistake retracted
earlier the same day. The placeholders are worse-looking and structurally correct.

**Every set has an identical rarity shape** — 3 Common, 2 Uncommon, 2 Rare, 1 Legendary, 1 Mythical.
Fixed so that authoring a new set is nine names and a tint rather than a balancing exercise, and a
sim-test holds the shape across all twelve.

**Cards are counts, not booleans.** `state.cards[id]` is a number. Nothing needs duplicates yet — but
dust does, and gifting would, and retrofitting a count onto a boolean after players have saves is the
kind of migration worth avoiding by spending one line now.

**The draw is biased toward what the player is missing**, within a rolled rarity. Without dust to
soften them, duplicates are pure disappointment, and an album that keeps returning cards you already
have is the fastest way to make collecting feel like a chore. A test fills every Common but one and
asserts the gap closes quickly.

**Set completion is reported once, on the pack that closes it** — `setsClaimed` records it — and the
banner fires *after* the last card of the pack, not interrupting the reveal.

**The opening is the feature, so it got the care.** One card at a time, never a grid. Rarity is
telegraphed by the frame before the name is legible. A duplicate is greyed and says so. Celebration
escalates by rarity, with confetti and a shake reserved for the top two tiers and a pulse for
Mythical alone — the same discipline as the mutation ladder, for the same reason: a top tier that
looks like the tier below it is not a top tier.

**Content note.** The twelfth set, *The Open Question*, is written as an unresolved thread — "A Gate
You Did Not Build", "Someone Has Been Weeding", "Not Yet". That is the Merge Mansion device recorded
in [17-market-and-positioning.md](17-market-and-positioning.md): **you do not have to write an
ending, you have to write a question.**

---

## 2026-08-15 — Gems get a rule, a corrected faucet, and two sinks that cannot become pay-to-win

**The rule, ratified by the owner and now the test every gem or IAP proposal faces:**

> **Gems buy chances, choices and looks. Never outcomes.**
> Skipping a timer is the one deliberate exception, at an expensive rate — it is farm-game
> convention and it buys *time*, not a better result.

The reason to fix the rule before the sink: **gems are the obvious IAP currency, so whatever gems
buy is what money buys.** Deciding the sink casually would have quietly chosen the monetization
model. The genre research is blunt that this audience punishes pay-to-win harder than any other —
what works is selling identity, breadth, relief and earliness.

**The faucet was the real bug, and it was worse than the known-issues entry said.** That entry
blamed the explicit `gemChance` values on the top five seeds overriding a generous 5% default. True,
but incomplete: **a Daisy cycles 65× more often than an Eternal Crown, so *any* flat per-harvest rate
makes the cheapest seed the best gem farm.** Removing the overrides alone would not have fixed it.

Gem chance is now **derived from grow time** — `grow × 0.0005`, capped at 50% — which makes gems per
hour constant at ~1.8 per plot across all nineteen seeds. Gems track *time played*, not seed choice,
and nobody is punished for growing what they like. The five overrides are deleted; the conventions
playbook now says to leave `gemChance` alone rather than "optionally set it".

*Rejected: making endgame seeds strictly better gem farms.* Tempting as a reward, but it re-creates
the same problem pointing the other way — a correct answer to "what should I plant for gems" is a
worse game than no answer at all.

**Sink one: calling a sky.** Rain 8 gems, Thunderstorm 25, for four minutes. It does two things —
holds the weather, and **pulls every unspent mutation roll in the ground into the window**. Without
the second half the purchase is nearly a no-op, because a roll is a single instant and most fall
outside four minutes. This is the infinite sink, it needed no new art, and it turns gems into agency
over a system that was previously pure luck.

**Aurora and Wonderfall are deliberately unpriced.** A ×100 behind a paywall is a jackpot you can
buy; if gems ever cost money that is pay-to-win *and* gambling-shaped, and it is exactly the pattern
that cost Pocket Camp its life. **The game's biggest moment should never be purchasable** — that
principle is worth more than the revenue, and a sim-test enforces it.

**Sink two: skipping a timer**, at `ceil(remaining / 30)` gems. The owner asked for this explicitly
as industry-standard practice, and it is — Township and Hay Day both do it, and both show the price
on the crop, which is why the cost chip sits on the plant rather than behind a gesture.

**The skip buys time and nothing else.** The mutation roll still resolves against the weather at its
*originally scheduled* moment, which is computable because weather is deterministic. So hurrying a
plant can neither gain nor lose a mutation. That closes the exploit where a player waits out a
Wonderfall and skip-grows the whole garden into it — the version where the roll resolves against
*now* would have made gems buy a ×100 through the back door, defeating the pricing decision above.

**Two bugs found while building, both worth recording:**

- The skip originally shrank `grow` to match elapsed time. A plant skipped *the instant it went in*
  has zero elapsed seconds, so any positive grow left it permanently one tick short of ripe. It now
  backdates `plantedAt` instead, which also keeps the progress bar reading full.
- The first version of the "skipping cannot manufacture a rare mutation" test used the dev weather
  override, which **ignores time by design** — so it was testing the override, not the real path. It
  now moves the actual clock into a genuine Wonderfall. A test that cannot fail is worse than no
  test.

**Three more flaky tests fell out of this, all the same class.** The combo block asserted exact
credit deltas from `tapFlower()` without pinning the roll, and a tap can spark a Wonder that triples
the payout — two assertions failing about one run in twenty-five. And the Lantern gem test sampled a
Daisy, whose base chance dropped from 5% to 0.6% with the faucet fix: the effect was still real, the
instrument had silently become eight times too small. **A sampled test is coupled to the number its
rate is built on** — an economy change can turn a good test into a flaky one without anyone touching
it.

**Still open:** cosmetic breadth. A fixed catalogue always gets bought out against an endless faucet,
so gems eventually need escalating prices or a growing list. Card packs are the real infinite sink
once the album exists.

---

## 2026-08-15 — Offline earnings on two axes, and a cap that is the whole point

**Built.** Rate and duration as separate upgradeable tracks — Moonlight Tending (25% base, +5%/level,
clamped at 100%) and Lantern Oil (4h base, +1h/level, clamped at 24h) — with a **10% trickle past the
cap rather than a hard zero**. Numbers in [04-economy.md](04-economy.md#offline-earnings).

**Two axes rather than one number**, per the Cookie Clicker model recorded in
[17-market-and-positioning.md](17-market-and-positioning.md#offline-progress). One system yields ~35
individually meaningful levels, and it turns "how the game treats you while away" from a tax into a
chain of things to want.

**The cap is the retention mechanic, and the owner called it before I built it.** At base, a fully
automated garden banks ~644K over 12 hours and ~805K over 24 — **doubling an absence adds a
quarter**. Returning at the four-hour mark is far more efficient than sleeping on it, which is
exactly the pull wanted. Recorded in the economy doc: if offline feels stingy, **raise the rate, not
the cap.**

**A trickle, not a wall.** A hard zero past the cap reads as punishment; a trickle reads as a rule.
It also keeps the curve monotonic — a sim-test asserts a longer absence never pays less, which a
hard cap plus any rounding could otherwise violate.

**Offline income is earned, not granted.** `passiveIncomeRate()` pays only for plots that have an
auto-planter, and only if the drone exists to pick them, valued at what that planter would actually
grow. **An unautomated garden earns nothing while away.** That is honest — the player was not
earning passively — and it gives the automation badges a second reason to exist.

**The drone's cadence caps throughput**, since it lifts one plot at a time. Both directions are
asserted: plots outrunning a slow drone are throttled by it, and a drone faster than the plots adds
nothing. The second test is the one that matters — without it the model would happily invent income
from an upgrade that changes nothing.

*Rejected: replaying the simulation forward across the absence.* Faithful, and far too expensive for
a 24-hour gap. The closed-form rate is accurate enough for a number nobody can audit, and it stays
O(1) regardless of how long someone was gone.

**`EXPECTED_RARITY_MULT` is derived from `DATA.rarity`**, not hardcoded at 1.58, so the eventual
rarity retune carries into offline income without anyone remembering to do it.

**The cap is disclosed in the scene.** It names the hours, says what happened after, and points at
the badge that extends it. Hidden caps read as theft.

**`Dev.simulateAway(hours)` winds the world back, not the clock forward.** Plot planting times,
mutation moments and hive clocks all move, so plots genuinely mature and rolls genuinely come due —
the report then comes from the same `reconcile()` a real absence runs. Winding `lastSeen` forward
instead would have produced a report about a garden that had not actually changed, which is precisely
the kind of cheat that passes while the feature is broken.

**One bug found in review, not by a test:** the cap notice put `<b>4h</b>` directly inside a
`display:flex` paragraph, making the bold text its own flex item and breaking the sentence across
lines. Wrapped in a span. Worth remembering that the `.away-list` items already had span wrappers for
this exact reason.

---

## 2026-08-15 — The welcome-back scene, and a known issue that turned out not to be one

**`Game.reconcile()` now reports what happened while the player was away**, and `renderWelcome()`
shows it as a short account: how long you were gone, what ripened, which weather passed and what it
changed, and how much honey is waiting.

**The correction worth recording: the reconciliation bug I logged did not exist.** The entry in
[11-known-issues.md](11-known-issues.md) said a plant whose mutation moment passed while the tab was
shut would roll "against whatever weather is standing then rather than the weather it should have
met." That was wrong. `rollMutations()` reads `weatherAt(cell.mutateAt)` — the moment the roll was
*scheduled for* — so it always resolved against the correct historical sky. The design had handled
it and I misread my own code when writing the issue up.

What was actually missing was only the **telling**. Verified in the browser: a storm hours in the
past, a clear sky now, and the scene still reads *"A spell of thunderstorm passed. Your Marigold came
back Gilded."*

Two consequences worth keeping. **Reconciliation is O(plots), not O(slots)** — because each plant
carries its own moment, there is no walk over elapsed time and no cap needed, which is the thing the
spec worried about. And **the one-roll-per-plant decision paid a dividend nobody planned**: the
per-slot model this replaced would have required exactly the expensive catch-up walk the spec
described.

**The scene is an account, not a receipt**, per
[17-market-and-positioning.md](17-market-and-positioning.md#offline-progress). Never a total. It also
stays shut when there is nothing to say — under two minutes away, nothing happened, or the player has
not planted yet and the coach mark owns the screen. A welcome-back that fires on every reload with
"nothing happened" trains people to dismiss it unread.

*Rejected: a banner instead of a sheet.* Three or four events with a tinted line each need room to be
read, and the sheet is the established vocabulary for anything with a list in it.

**Automation still does not run while away.** The drone and auto-planters need the frame loop, so a
closed tab earns nothing beyond what was in the ground. That is the next piece — the two-axis offline
earnings chain in [17-market-and-positioning.md](17-market-and-positioning.md#offline-progress) — and
this scene is the surface it will report into.

---

## 2026-08-15 — Nightbell: the verb the epoch clock was for, and it pays *less* half the time

**Moonflower now carries Nightbell** — ×2 if harvested at night, ×0.5 by day — and **Deeproot moved
to Jade Fern**, which suits it better anyway ("ancient frond storing rich nutrients" is what a
deeproot is). Moonflower's own description has read "night-blooming marvel" since the first build; it
was always the right home and the clock was the only thing in the way.

**It is deliberately not a buff.** Night is ~32% of the cycle, so the expected multiplier is ≈0.98 —
a sim-test asserts it stays inside 0.85–1.15 across a full cycle. Nightbell does not make a flower
pay more. It makes **when you pick it** a decision, which is a kind of choice no other verb offers.

*Rejected: "pays double at night" with no downside.* That is a +32% flower, which is just Nurse with
extra steps and a worse name. The halving is what turns it from a number into a question, and it
gives the verb a real interaction with Keeper — speed a bloom up so it lands on the right side of
dusk.

**Read at harvest, not at planting.** The decision being bought is *when to pick it*, which only
means anything if the clock is checked at the moment you pick.

**This is the seventh effect category** — time — and the category-uniqueness rule still holds. Two
new assertions came with it: every verb must be used by some seed, and no seed carries two.

Worth noting the sequence, because it is the argument for doing infrastructure properly: this verb
was cut from the first verb pass, and the reason was recorded rather than the idea being abandoned.
Moving the day cycle to epoch time made it a twenty-line change.

---

## 2026-08-15 — Day cycle moved onto epoch; a real cheat menu that forces the real code paths

**The day cycle now keys to wall-clock epoch time** instead of `bootAt`, using the same 360-second
cycle. Phase and `isNight()` live in `game.js`; `ui.js` reads them and paints.

**Why it mattered enough to change:** keyed to page load, the phase restarted on every reload, so
"is it night" was a per-session accident that no game rule could ever depend on. It is now a shared
fact the simulation can answer — which is precisely what the **night-blooming verb** needed, the one
dropped from the first verb pass for this exact reason. That verb is now unblocked. The matching
entry in [11-known-issues.md](11-known-issues.md) is deleted, since it is fixed.

**Supersedes the 2026-08-01 "day cycle always starts at midday" decision.** It cannot hold once
sessions no longer set the phase. `DAY.offset` survives as a global shift and nothing more. The
trade accepted: a player can now open the game at night. Given the cycle is six minutes, the cost is
small and the shared clock is worth it.

**A development panel, reached from an unlabelled 44 px hit area beside the gem wallet.** Absolutely
positioned so it can never take a flex row and grow the HUD — as a sibling in flow it wrapped and
made the wallets three rows tall.

**The design rule, and the reason it is worth the code: every cheat forces an outcome through the
real path rather than faking an effect.** An armed rarity is consumed inside `harvest()`. A forced
proc sets a flag the existing `roll*()` functions check *before* their level and chance gates, then
takes a genuine tap. A forced mutation writes the cell and emits the same `mutate` event the weather
does. So the animation the owner inspects is the one players get, and a cheat cannot pass while the
feature is broken.

*Rejected: calling the FX functions directly from the panel.* Far simpler, and it would have made
the panel a liar — every effect would play perfectly whether or not the system behind it worked. The
whole point of this menu is to test features without relying on chance, which is only true if the
features actually run.

**The proc buttons are toggles rather than one-shots**, added the same day after the first version
proved annoying to use. A single forced fire meant reopening the panel for every look at an
animation; held at 50% per tap the sheet can stay closed. The boost is additive on the badge rate and
**bypasses the level gate**, because testing Bee Swarm should not require buying Bee Swarm first.
`procChance()` became the one place that decides a proc's odds, which also tidied three duplicated
gates into one function.

**Everything except the weather hold and the proc boosts is one-shot.** A sticky armed rarity would silently corrupt
every balance reading taken afterwards, so a sim-test asserts that **nothing armed leaks into an
ordinary harvest** — 2,000 unarmed harvests must land near the natural 2% Legendary rate.

**Cheats that cannot apply say so.** Mutating with nothing in the ground, or a bee swarm with no
hive, returns a deny sound and a toast. A cheat that quietly does nothing is worse than no cheat,
because it reads as the feature being broken.

**Not gated behind `?dev=1`.** Consistent with the standing decision to leave the existing cheat
buttons live — the audience is friends, and the affordance is useful. The hit area being unlabelled
and out of the tab order is enough for now. Revisit alongside the other cheats before any real
external audience.

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

Each proc also got a purpose-built animation in `ui-events.js` (`triggerRainFX`, `triggerBeeFX`,
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

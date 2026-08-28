# Per-Seed Prestige — the owner's design, pressure-tested

**Status: analysis, 2026-08-29 — executed the same day.** The design this pressure test shaped is
now **[32-the-garden-year.md](32-the-garden-year.md)** with numbers in
[33-year-one-economy.md](33-year-one-economy.md); this document remains the record of the evidence,
the refutations, and the invariants audit. Original framing: The owner's concrete prestige design, put
through a four-angle pressure test (genre comparables with sources, a full repo-invariants audit,
a simulated economy model, and an adversarial critique that also attacked the advisor's fixes),
plus adversarial verification of the two highest-stakes claims — **both of which were partly
refuted**, and the refutations are recorded here because they changed the recommendation.

## The design, as proposed

Incremental idle tapper on the existing garden engine. The 19 seeds spread much further apart
economically. A new player starts with daisy and tulip; seed 3 reads as nearly impossible ("a few
weeks of grinding"). At that wall, prestige unlocks: restart the garden, convert what you
accumulated — leftover gold, flower harvests — into **permanent upgrade trees for each individual
seed** (harvest value, grow speed, mutation chance, gem chance, pack chance, proc chance), with
the harvest drone eventually moving *into* a specific flower's path rather than staying global.
Map, orders, meadow on hold.

## Verdict

**The core is right, and it is the strongest concrete answer yet to the audit's oldest finding.**
Per-seed permanent trees give each of the nineteen seeds an identity — the thing the "every seed
yields 1.4× cost, differing only in throughput" diagnosis has demanded since doc 17 was written.
It is also [30-prestige-directions.md](30-prestige-directions.md)'s **Seed Saving idea arrived at
independently, in a more buildable form**: instead of a generated heirloom with rolled properties
(high variance, needs a property-budget harness), the lineage of each flower improves through a
tree the designer authors. Same fantasy — you end the year saving seeds, and each flower's line
gets better across generations — with authored numbers instead of generated ones.

**Four parts need surgery before it works.** Each is below with the evidence. And one honest
correction of the advisor's own earlier position is folded in where the verification demanded it.

Probability, same thresholds as before (base = $3–5K/mo; breakout = >$20K/mo):

| Version | Base | Breakout |
| --- | --- | --- |
| As literally described (leftover-balance currency, weeks-long first wall, 114 free-allocation knobs) | **~20%** | **~5%** |
| With the four surgeries below | **~45%** | **~12%** |

Focusing garden-only with the map on hold does not lower these — it *is* direction D, already the
recommended lane. The one real cost of the hold is the playtest group (surgery 4, last row).

---

## Surgery 1 — the prestige currency: lifetime-earned, not leftover balance

**The claim that "no successful game converts unspent balance at reset" was put to adversarial
verification and REFUTED.** Antimatter Dimensions — one of the most acclaimed incrementals ever —
converts the *held* balance at every prestige layer, and The Modding Tree genre does it by
default. So balance-at-reset is not a design law violation.

**But the two conditions that make it safe there do not hold here, and the failure is now
quantified.** It works in Antimatter Dimensions because (a) production is hyper-exponential, so
spending compounds into a *larger* final balance than hoarding, and (b) the conversion is damped
to powers like x^(1/308), so hoarding is nearly worthless. Garden Wonder's income is **flat**
(the 1.4× rule) and the proposed conversion is roughly linear. The simulation:

> A player buys a 25,000-coin plot one hour before their first prestige. Under
> **leftover-balance** conversion, that purchase costs **21.8 prestige points — 15.5% of the
> entire run's prestige income** — for buying the thing the game told them to want. The back
> ~1.5 days of every run become a "touch nothing" dead zone. Under **sqrt-of-lifetime-earned**,
> the same purchase *gains* +0.40 points, and spending is provably points-neutral: the lifetime
> counter never decreases, so no purchase can ever cost permanent progress.

Every mobile-scale comparable uses lifetime/since-reset earnings: AdCap angels ~ √lifetime,
Cookie Clicker chips ~ ∛lifetime, Egg Inc soul eggs ~ (since-reset earnings)^0.14 — the exponent
chosen, per its designer, precisely so equivalent runs pay equally. The two games closest to
spending-your-meta-currency (Clicker Heroes' unspent-soul bonus, AdCap's angel sacrifice) both
generated the documented hoard-paralysis that community guides exist to manage.

**The fix:** points = k·√(coins earned this run), veterancy-scaled. Leftover gold at the turn
converts into something small but never nothing — a decoration token, never main points — so the
wallet visibly zeroing out is compensated. The provisional formula set from the model, all in
data: `points = 0.1·√(runCoins) · (1 + 0.2·prestiges)`; first prestige pays ~61 points.

**A second blocker hides in "keep all of their flower harvests":** harvest tallies must NOT
become the spendable currency, because `state.discovered` is read by creature attraction and
stars (Pip's 5/15/45/135/405 Bluebells), Bloom Mastery, Almanac milestones and Stand order bias —
all under the standing rule that **counters never read a spendable inventory**, with sim-tests
asserting it. Spending tallies would de-star creatures. If harvests feed the conversion, they do
it through a *separate accumulator* written at harvest time, never through the lifetime records.
And "any other currency" must exclude gems entirely — gems buying permanent per-seed power is
gems buying outcomes, the rule the whole IAP posture stands on.

## Surgery 2 — the wall: it can *feel* impossible, but income must never be flat while you stare at it

**The claim that "a weeks-long first wall churns everyone; successful games reveal prestige
within day one" was ALSO put to verification and REFUTED as stated.** Cookie Clicker's first
ascension is days-to-weeks; Egg Inc's first prestige lands around day 19–23 for typical players;
Melvor Idle and Rusty's Retirement have *no* prestige and retained for years. Long first arcs are
survivable.

**The kernel that survives is sharper than the original claim:** in every counterexample, the
weeks are weeks of *visibly accelerating numbers* — Cookie Clicker's income grows exponentially
the entire climb. The owner's wall, with the 1.4× rule intact, is a **flat-income savings grind**:
weeks in which nothing on screen changes but a total. That shape — not wall length — is the churn
mechanism. And the desktop-cult counterexamples (Cookie Clicker, Kittens Game, Melvor) sit in
front of a different audience than a cosy mobile game with 7-minute sessions.

**The fix, from the simulation:** set the seed-3 wall at **150,000 coins**. Session one earns
~25K, so on day one the wall reads as *six times everything you have ever earned* — "nearly
impossible" as a **feeling** — but it actually breaks on day 2–3 of casual play (~6 sessions),
which is inside every mobile comparable's first-prestige window. The owner's multi-week walls are
not lost: they belong at prestige 6+, where Egg Inc proves upgraded veterans expect and accept
them. Two conditions ride along: the prestige mechanic is **foreshadowed from session one** (a
visible end-of-year meter, not a surprise rescue), and things remain buyable during the climb so
income visibly moves.

## Surgery 3 — the spread cannot live in plant prices, and this is the finding that changes the economy

**The simulation found something structural: no spread of per-plant prices can create a wall
while the 1.4× rule holds**, because yield scales with cost — the entire current 19-tier ladder
self-finances in about **six active minutes** with 8 plots, and multiplying the ratios just
multiplies minutes. "Spread the seeds way further apart" is impossible in the seed table as it
stands.

**The fix: split the price in two.** The per-plant cost keeps today's table and the 1.4× rule
untouched — the invariant survives, everything tuned against it survives. Each seed gains a
**one-time unlock price, permanent across prestiges**, and *that* carries the spread:
`unlock(3) = 150K`, `unlock(n) = 150K × 1.6^(n−3)` (seed 19 ≈ 277M). Simulated: ~10 prestiges,
all nineteen seeds revealed around day 31 of casual play, averaging 1.7 tiers per prestige —
inside every pacing target. The 1.6 ratio is the tuned sweet spot (1.5 compresses to ~3 weeks,
1.8 stalls below one tier per prestige).

**This also reconciles the level system instead of gutting it.** Seeds unlocking by price alone
would empty levels 2–17 of their entire reward structure — the dependency
[HANDOFF.md](HANDOFF.md#two-things-to-know-before-touching-the-economy) has warned about all
along. But the game already owns the answer, shipped twice: **"reach the level, then pay the
coins"** — the two-stage chip on plots and meadow cells. Applied to seeds: season level opens
the seed's slot, the one-time unlock price buys it. Levels keep their vertebrae, the wall keeps
its size, and the acquisition rule stays the one rule learned once.

(Decided otherwise in the final design: the unlock price gates alone — season-level regating was
rejected as a double wall; see [33-year-one-economy.md](33-year-one-economy.md).)

## Surgery 4 — the trees: a checklist for this audience, not an allocation exam

The adversarial critique's strongest surviving attack, rated fatal as-proposed: **19 trees × ~6
axes ≈ 114 permanent knobs competing for one scarce spend-at-reset currency is an allocation
exam** — every purchase implicitly "and NOT the other 113" — delivered at the exact moment the
player's garden was just cleared. The measured audience (69% female farm-sim cluster,
Completion + Fantasy motivations, Finch's low-decision-fatigue lever) is selected to churn on
precisely that. The comparables agree from the other side: **no successful idle ships a
per-generator × multi-axis permanent matrix.** The permanent layer in every hit is one legible
global currency; per-generator permanence, where it exists at all, is one axis, hard-capped
(Idle Miner: one income multiplier, six steps per mine).

The fixes, each keeping the owner's structure and changing its surface:

1. **Checklist, not allocation.** Everything eventually maxes; no order is wrong; the surface is
   the Almanac's nineteen rows (each seed a section, not a separate tree screen) — which is the
   audit's five-collections-into-one consolidation arriving with a purpose. Completion-motivated
   players love long checklists; they abandon regret-generating optimization.
2. **A shared spine plus one signature branch per seed.** The spine (value, speed) is the same
   everywhere and can be one-tap "suggested." The signature branch is where seed identity lives —
   and v1 authors real signatures for only the **first five or six seeds**, with later seeds
   launching spine-only and gaining signatures in waves. Nineteen was never a design requirement;
   it is how many seeds exist today.
3. **Chance axes become countdown axes.** "+0.4% mutation chance" is the least legible purchase a
   game can sell — spend hard-won points, feel nothing for days. Sell the pity counter instead:
   *every 12th harvest mutates → every 10th*, with a visible "3 more until a gem" readout. Same
   math underneath, Finch-legible on the surface. This also protects the tested mutation-share
   band, because a counter is cappable in data the way a compounding percentage is not.
4. **Per-seed gem upgrades are the one axis to refuse.** Flat gems-per-hour is a *constructed*
   invariant (chance derived from grow time) that exists because its absence made Daisy-spam the
   optimal gem farm — a per-seed gem axis is literally the override mechanism the 2026-08-15 fix
   deleted, on the premium currency. Keep gems global.
5. **Automation gets a global floor; the trees upgrade it.** The drone deep in one flower's path
   means the entire first run — the longest run — has **zero offline income**, which breaks
   "nothing punishes you for leaving" for exactly the players who churn fastest. The cosy fix
   also re-arms a frozen feature: **the creatures tend the garden while you are away** — a base
   away-harvest rate with a fiction already living under the lawn — and per-seed drone upgrades
   raise that rate per seed. The owner's instinct that a global drone is "too powerful" is
   honoured by the *level* of the floor, not by its absence.
6. **One ceremonial choice at the turn.** Spine ranks can be bought any time (constant small
   dopamine); the prestige ceremony holds exactly one juicy decision — *which flower is blessed
   this year* — so the reset moment is a festival with one choice, not an exam with 114.

## What the invariants audit adds (the build-facing list)

Twenty-five touched invariants, seven of them blockers; the full list is in the audit run. The
ones that must be decided rather than merely respected:

| Decision needed | The shape of the answer |
| --- | --- |
| Quest ladder on run 2+ | `quests.done` never resets and badge quests cannot re-fire, so a season's re-climb has almost no reputation fuel — the ladder needs a repeatable seasonal form, or season level needs a non-quest source |
| Meadow-dependent quests during the hold | `q_hive_1` + three honey quests are 114 of the ladder's 777 rep; if the meadow is out of the run-1 flow they jam the strip — pause them with same-rep stand-ins, the documented pattern |
| First-run content | Daisy and tulip carry no verbs and attract no creature, so run 1 has no adjacency decision and no pet until after the wall — move one verb and one attraction (Pip is the obvious one) into the starter pair, or accept a barer first run deliberately |
| Bloom Mastery | Absorbed: the trees are the bought ladder, mastery is the played one; running both stacks two per-seed yield ladders on a product of seven terms. Doc 30's ruling stands — mastery is bounded, resets at the turn, converts |
| Upgrade application | Per-seed multipliers apply at harvest time via the `masteryMult` pattern and in `passiveIncomeRate()` in the same commit — never by editing `seed.yield`, or offline silently diverges from online |
| Cheat buttons | Once conversion exists, "Grant 1,000,000 Gold" mints *permanent* progression — friend-testers will contaminate exactly the pacing data this design needs. Cheats stay (owner's standing call), but cheated coins must be excluded from conversion or cheated saves stamped |
| The turn itself | The Settings reset is not a prestige; the turn needs its own selective path over the never-resets partition, sim-tested field by field |

## The provisional number set (all data, all remote-config-ready)

From the simulated model — starting points for the retune, not commitments:

| Knob | Value |
| --- | --- |
| Seed-3 unlock (the first wall) | 150,000 coins |
| Unlock ratio per tier | ×1.6 (seed 19 ≈ 277M) |
| Prestige points | 0.1·√(run coins) × (1 + 0.2·prestiges) |
| Tree level price | 5 × 1.3^(seed−1) × 1.25^level points; side axes ×0.6 |
| Main-axis effect | +30% seed income per level |
| Pacing result | first turn day 2–3 · ~10 prestiges · all seeds ~day 31 · 2–5 buys per turn |
| Sink runway | level-12 catalog ≈ 525K points vs ~1.8K/day endgame faucet — months of headroom |

The two pacing knobs to hold in data forever: level-cost growth (1.25) at or slightly above
per-cycle point growth (1.2), so every prestige affords a similar 2–5 purchases across an
ever-widening catalog.

## The hold, honestly

Freezing the map, orders and meadow is consistent with direction D and costs little strategically
— but the *playtest group* lives on visible novelty, and months of "the numbers are rebalanced"
gives friends nothing to reopen. One small visible thing per build (a creature, a card set, a
decoration) is cheap insurance on the only retention data source the project has.

## Rejected

**Leftover-balance conversion** — with the Antimatter Dimensions counterexample honestly on the
record, and the reason it does not transfer (hyper-exponential production + damped conversion,
neither present here). **The weeks-long first wall** — with the Cookie Clicker/Egg Inc
counterexamples honestly on the record, and the surviving kernel: flat income at the wall is the
killer, not wall length. **Per-plant price spreads** — structurally impossible under 1.4×.
**A per-seed gem axis** — it is the deleted override mechanism returning. **19 hand-authored
signature branches at v1** — five or six, then waves. **Free allocation across 114 knobs** —
checklist, spine, one ceremony choice.

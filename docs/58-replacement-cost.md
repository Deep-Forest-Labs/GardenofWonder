# Replacement Cost — what another studio would have charged

**Status: estimate, 2026-10-17.** Re-run of an exercise first done on 2026-08-30 at day 28. It answers
one question — **how much work is in this repository** — in the unit people outside the project
understand, which is dollars. Companion to [40-financial-model.md](40-financial-model.md), which asks
the opposite question (what this *earns*). The two must never be confused: this document measures what
has been built, not what it is worth in a market.

**The published version is an artifact:** <https://claude.ai/artifact/HvfFdNzKWaanf7F8B7EZjr> — the same
figures laid out for showing to someone outside the project. This doc is the source; if the two
disagree, fix this one and republish.

---

## The headline

> **~$900K of studio output, delivered in 77 days.**
>
> Range **$615K – $1.22M** at fully loaded US/EU small-studio rates. **51–64 person-months**, midpoint
> 57, or roughly 9,100 hours. A five-person studio works that in about eleven months.

Up from **~$450K** when this was last priced on 2026-08-30. Same method, same rate band, roughly twice
the artifact.

---

## What is in the box

Counted from the working tree on 2026-10-17, excluding `legacy/` and `_to_delete/`. **These are
measurements, not estimates** — every row is reproducible with the command beside it.

| Asset | Size | What it is | How to recount |
| --- | --- | --- | --- |
| **Shipped client code** | 31,218 lines | 23,870 of JavaScript across 27 modules, 6,970 of CSS, 378 of HTML. No framework, no build step | `wc -l *.js style.css index.html` |
| **Test suite** | **2,335 assertions** | One deterministic 13,754-line simulation harness. Ran clean on 2026-10-17: 2,335 passed, 0 failed | `node tools/sim-test.js` |
| **Tooling** | 22,723 lines | 18 Node tools and 21 browser spike harnesses: the pixel-parity differ, the CSS and HTML linters, the year simulator, five asset exporters | `wc -l tools/*.js` |
| **Design documentation** | 525,623 words | 60 documents, 44,862 lines. The decision log alone is 11,279 | `wc -lw docs/*.md` |
| **Art** | 183 renders | Every plant, creature and customer drawn procedurally. **Zero binary art assets in the build.** 76 renders are every species at every growth stage | `find art -type f` |
| **Version history** | 422 commits | 157,425 insertions, 17,120 deletions, 2 August to 8 October 2026 | `git log --oneline \| wc -l` |

Content, for scale: **19 species** each through four growth stages, **12 creatures** in eight breeding
pairs, **10 customers** with **10 goods**, **12 album sets**, **six rooms**, and a **924-line** story
script imported as data.

---

## What changed since the last estimate

| | 30 Aug, day 28 | 17 Oct, day 77 | Change |
| --- | --- | --- | --- |
| Commits | 178 | 422 | 2.4× |
| Shipped client code | ~18,000 lines | 31,218 lines | 1.7× |
| Test suite | ~1,200 assertions | 2,335 assertions | 1.9× |
| Design documentation | ~22,000 lines | 44,862 lines | 2.0× |
| **Studio-equivalent effort** | **28–30 person-months** | **51–64 person-months** | **2.0×** |
| **Replacement cost** | **$375K – $600K** | **$615K – $1.22M** | **2.0×** |

**What the second half bought** — the systems that did not exist on 30 August:

- **The Garden Year.** The prestige layer: the Turn, Prisms, petals and four seasons on a shared world
  clock, with a ceremony at the reset. [32-the-garden-year.md](32-the-garden-year.md)
- **Four more rooms.** The Meadow, the Hollow, Fall and Winter, each with its own screen and logic.
- **A narrative engine.** Chapters imported as data from a 924-line script, latched and swept and played
  in order, with a cutscene, reply chips and a replay door in the Almanac.
  [57-volume-one-script.md](57-volume-one-script.md)
- **Four growth stages per plant,** with the ripe blooms proven untouched by a differ that reported zero
  differing pixels on a full board.
- **A measured performance pass.** The frame dip was found rather than guessed, the costly sky made
  6× cheaper, every sky proven bit-identical afterwards, and a frame-rate readout shipped in-game.
- **A motion bible** generated from the real stylesheet, whose `--check` goes red when it drifts from
  the code. [50-motion-bible.md](50-motion-bible.md)
- **A Unity handoff set:** the screens gallery, the asset inventory, the motion bible and all 76
  per-stage renders. [44-screens.md](44-screens.md), [45-asset-inventory.md](45-asset-inventory.md)
- **The commercial layer:** monetization, a financial model, a growth and launch plan, a refreshed
  market read. Docs [37](37-monetization.md), [38](38-market-refresh.md), [39](39-growth-and-launch.md),
  [40](40-financial-model.md)

---

## The team you would have to hire

Not a headcount plan — a reconstruction. For each discipline: what a studio would have had to staff to
produce the artifact above, and for how long. **Every number in this table is judgment.** The total is a
range because the honest answer to "how long would this have taken you" is always one.

| Role | Person-months | What they would be producing |
| --- | --- | --- |
| **Gameplay engineers** (two to three) | 20–24 | 31,000 lines of hand-rolled client: six rooms, the world clock, save and migration, offline earnings, the weather and mutation simulation, the prestige engine, the narrative engine, the PWA shell |
| **Lead designer / creative director** | 10–13 | 525,000 words of specification: the loop, the economy, the prestige year, progression, monetization, the market work, the decision record behind all of it |
| **Technical artist / art director** | 8–10 | The entire look, drawn in code: 19 species at four stages, 12 creatures, 10 customers, four seasons of scenery, the weather, and the motion language on top |
| **QA and tools engineer** | 4–5 | The 2,335-assertion deterministic harness, the pixel-parity differ, the CSS and HTML linters, the in-game frame-rate instrument, 21 spike harnesses |
| **Economy designer** | 3–4 | The year-one economy, order pricing, the prestige curves, the currency set, and the simulations that prove them |
| **Narrative designer** | 2–3 | The story bible, the premise, the chapter flow, volume one's script and every character voice in it |
| **Producer** (part-time) | 2–3 | The decision log, the punch list, the handoff document, playtest wrangling |
| **Audio** (contract) | 1.5–2 | A 925-line synthesis engine, the feedback ladder that ties every sound to an action, the music direction |
| **Total** | **51–64** | Midpoint 57 person-months ≈ 8,200–10,200 hours, call it 9,100 |

---

## The cost, three ways

9,100 hours priced at three market rates. **These are ordinary market bands, not quotes.**

| Who builds it | Rate | Replacement cost | Note |
| --- | --- | --- | --- |
| Offshore or outsourced team | $40–65/hr | $330K – $660K | Plausible for the engineering; the design and economy work is the part that does not survive this route |
| **US or EU small studio, fully loaded** | **$75–120/hr** | **$615K – $1.22M**, middle **~$900K** | Salary, benefits, tax, software and overhead included. **The band to quote** — the same one the August estimate used, so the two are comparable |
| Top-tier studio or agency | $150–200/hr | $1.2M – $2.0M | What a publisher's preferred external partner would bill for the same scope |

---

## The two lines that would surprise a studio quoting it

They pull in opposite directions, and together they are the shape of this project's cost.

**Cheaper than normal: there is no art pipeline.** Every plant, creature, customer and season is drawn
procedurally in SVG and CSS. The build contains **no binary art assets at all** — no illustration packs,
no outsourced character sheets, no texture budget, no asset-store spend, no engine licence, no sprite
pipeline to maintain. In a conventional casual game that line is **25–30% of the budget**, and it is
usually the one that slips. Here it is a stylesheet. See
[05-art-direction.md](05-art-direction.md) and [09-conventions.md](09-conventions.md) for the rule that
keeps it that way.

**More expensive than normal: the paper trail and the proofs.** 525,000 words of design documentation, a
2,335-assertion tested economy, a motion specification generated from the real cascade, and a
pixel-parity instrument that can prove a visual change moved nothing. Most funded studios ship without
any of it. The market research alone — the positioning work, the refreshed market read, the financial
model and the pitch brief — is an engagement an agency would bill **$30–60K** for on its own.

This is the part of a budget that normally does not exist, and it is the part that keeps the rest from
being spent twice.

---

## The clock is the real finding

Fifty-seven person-months is about **eleven months of calendar time** for a five-person studio, and that
is before hiring, onboarding and the coordination tax a team of that size pays. The same artifact took
**eleven weeks**.

| | |
| --- | --- |
| Studio calendar, five people | ~11 months |
| Actual calendar | **11 weeks** (2 Aug – 17 Oct 2026) |
| Compression | **4–5×**, on schedule, not only on cost |
| Direct cash cost | Subscription software. No payroll, no contractors, no asset spend |

**For anyone deciding whether to back this, the cost saving is the smaller half of the story.** The
schedule is the part a competitor cannot buy.

---

## What this figure is not

**Cost to here.** The ~$900K is the cost to reach exactly where the project stands today: a
systems-complete, playable, documented web build with a tested economy, live and installable. It is not
the cost of a launched mobile game.

**Cost to ship.** Getting from here to a launched title adds a store-wrapped or ported client, a final
art and audio pass, store setup, analytics and attribution, live-ops tooling and a launch marketing
budget: realistically **another $400–700K**. A comparable funded cozy or casual title therefore
represents **$1.3–1.9M of total investment** by its first anniversary.

**What no amount of this proves.** None of it is evidence that the game will earn. There is no retention
data on anything yet; that is what a soft launch buys, and [40-financial-model.md](40-financial-model.md)
is where that question lives. Do not let this document stand in for that one.

---

## How it was actually built

One person as designer, director and reviewer, working through **61 agent sessions and 888 subagent
runs** over the 77 days. Every design ruling, every art approval and every economy number was a human
call; the typing, the test-writing, the research sweeps and the documentation were not.

The method is why the two odd budget lines above look the way they do. The expensive-to-a-studio items —
the 525,000 words, the 2,335 assertions, the generated motion spec — are the *cheap* items under this
method. So the project has the paper trail that funded teams skip, and skips the art pipeline that
funded teams cannot.

---

## Method

**Measured.** Line counts from `wc -l` over the working tree on 2026-10-17, excluding `legacy/` and
`_to_delete/`. Commit counts and churn from `git log`. The assertion count is the output of an actual
run of `node tools/sim-test.js` on the same day. Art counts are files under `art/`. Session and subagent
counts are transcript files on the owner's machine for this project, which is why they are not
reproducible from a clone.

**Judgment.** Person-months are a bottom-up reconstruction per discipline, cross-checked against the
2026-08-30 estimate so the two scale consistently. One person-month is taken as 160 hours. The hourly
bands are ordinary fully loaded market rates for the three team types named. The 25–30% art-budget share
and the $30–60K research figure are industry rules of thumb, stated as such.

**Deliberately excluded.**

- Any value assigned to the design method itself, which is the company's actual asset and is not a line
  in a studio quote.
- The predecessor prototype this build replaced. The clock starts at the first commit of this rebuild,
  **2 August 2026**.
- Revenue, retention or market value of any kind.

**Lineage.** First run 2026-08-30 (day 28): 28–30 person-months, $375K–$600K, middle ~$450K; that
version lived only in a chat transcript and was never written down here. Re-run 2026-10-17 (day 77):
51–64 person-months, $615K–$1.22M, middle ~$900K.

**When to re-run it.** The figures go stale the moment the counts do. Re-run the commands in "What is in
the box", scale the person-month table against the new counts, and append to the lineage above rather
than overwriting it — the series is more useful than any single reading.

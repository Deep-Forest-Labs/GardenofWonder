# Direction and Odds

**Status: analysis, 2026-08-26.** Written to answer the owner's question directly: *am I entering a
genre so saturated the game cannot stick out, or should I focus on the idle incremental tapper —
and what would it actually take to build something that succeeds?*

Four directions, priced. Extends [17-market-and-positioning.md](17-market-and-positioning.md) and
[25-world-map.md](25-world-map.md) rather than redoing them; every market figure below is theirs.

**The probabilities are calibrated judgement, not derived numbers.** They are stated to be argued
with. Two thresholds are used throughout:

- **Base** — the stated goal: **$3–5K/month sustained, roughly 2,000–3,000 DAU.**
- **Breakout** — **>$20K/month**, which doc 17 puts at the realistic ceiling without paid UA.

---

## The question, reframed

**Saturation is not the problem. Invisibility is.**

The number that matters is already in doc 17: **1,087 idle/clicker games released in 2026 earned
~$3.97M combined — about $3,650 lifetime each.** That is not a saturated market. A saturated market
is one where good products compete and margins compress. That is a market **full of games nobody
could find**, and it is *good* news for a team whose only real advantage is craft, because it means
the median competitor is not competing.

Compare the genuinely saturated case: **Merge-2 is not crowded with bad games, it is crowded with
funded ones.** Century Games, Moon Active, Microfun and Metacore are spending on user acquisition.
There the median competitor *is* competing, and with a budget.

So the useful distinction is not crowded / not-crowded. It is:

> **Is this a category where craft wins, or one where spend wins?**
> Idle, cosy and farming-sim reward craft. Merge-2 rewards spend.

## What actually determines the outcome, at two people with no UA budget

There are exactly four ways this game reaches an audience:

| Channel | What it rewards | Open to a merge game? |
| --- | --- | --- |
| **Community** — Wholesome Direct, r/incremental_games, r/CozyGamers | Distinctiveness, a story worth posting | **No** |
| **Platform editorial** — Apple/Google featuring | Craft, novelty, taste | Rarely |
| **Algorithmic ASO lift** — the behavioural-signal engine doc 17 describes | **D1 / D7 retention** | Yes |
| **Clips and screenshots** — the Grow a Garden route | A moment worth filming | **No** |

Three of the four are closed to a merge board, and all four reward the same two things: **a hook you
can say in one sentence, and retention good enough for the algorithm to notice.**

The project currently has **neither**. It has craft, which is necessary and not sufficient — that is
precisely the Terrarium: Garden Idle warning in doc 17: **11M installs, ~$9K/month.** Reach without
a reason.

> **The selection criterion for a direction is therefore: does it produce a sentence, and a
> five-second video?** Not "is the genre good."

---

## The four directions

### A — Finish the plan

The current roadmap executed well: garden as home, merge promoted to the second screen
([28-the-loop.md](28-the-loop.md)), the Stand, the map, creatures, the ceiling and retention work
from the audit, then Unity and ship into the cosy channels.

**Uses:** ~95% of everything built. **Costs:** monetization, retention, prestige, FTUE, the bench
surface, the port. **Risk:** it is the Terrarium shape — good, cosy, and undifferentiated in one
sentence. "A cosy idle garden game" is not a sentence anyone repeats.

| | |
| --- | --- |
| **Base ($3–5K/mo)** | **~30%** |
| **Breakout (>$20K/mo)** | **~7%** |

The safest direction, the one most likely to produce a real small business, and the one most likely
to be invisible. Note that Cats & Soup's $300K/month comes with **Netflix distribution attached**;
without that the same game is a different business.

### B — The merge pivot

The garden demoted to a feature, the merge board as home. Gossip Harbor's shape.

**Uses:** the merge simulation, the goods catalog, the customers. **Strands:** the garden art, the
tap loop, the creatures, the weather, the mutations — most of what has been built. **Costs:** an
energy system (which contradicts the cosy pillar), a story-task content treadmill, and entry into
the highest-CAC category in mobile.

| | |
| --- | --- |
| **Base** | **~12%** |
| **Breakout** | **~3%** |

The upside in merge is real and it is **spend-gated**. Priced here rather than dismissed, because
the owner should be able to see the shape of the bet: it has the highest theoretical ceiling and the
worst odds of reaching it from this starting position. Argument in full in
[28-the-loop.md](28-the-loop.md#merge-central-yes-a-merge-game-no).

### C — The Shared Sky — **recommended**

**Direction A, plus the hook it is missing — and the hook is already built.**

`DATA.weather` runs on **wall-clock epoch time**. The decision log records why:
*"the same weather for everyone at the same moment, and any past slot computable."* That was built
as an engineering convenience for offline reconciliation.

**It is the most valuable unexploited asset in the project.** It means:

- **Every player in the world is under the same sky at the same moment.** A synchronous global
  event, with **no server, no accounts and no friend graph** — the three things this team does not
  have and cannot build.
- **The sky is computable in both directions**, so the game can show a **forecast**. Not "it might
  rain" — *"Wonderfall at 6:42."*
- Wonderfall is 0.5% of 60-second slots, so it lands roughly **seven times a day, worldwide,
  simultaneously**, and it is the rarest mutation tier in the game.

That produces the sentence and the video:

> **"Everyone's garden shares one sky, and you can read the forecast."**

And it connects five systems that are already built and currently have nothing to do with one
another: **the epoch day/night cycle, weather, mutations, Nightbell's night multiplier, and the
Ridge / Night Garden.** They are all the same idea — *the world has a clock and you play against
it* — and nobody has named it.

**What it fixes, mechanically:**

| Gap | How the forecast closes it |
| --- | --- |
| **No reason to open the app** ([27](27-design-audit.md)) | A scheduled event you can plan around, which is an invitation rather than a nag |
| **No notification that isn't nagging** | *"Wonderfall in ten minutes"* is news, not guilt. Doc 17's warning is about **streak** notifications, and this is not one |
| **Planting is not a decision** | It becomes a **timing** decision — hold the Eternal Crown for the storm, or bank the Daisies now |
| **Nothing is clippable** | A ×100 Wonderstruck harvest under a global event is the "look what I grew" screenshot that carried Grow a Garden |
| **No social feeling** | Shared experience without a social system |

**Uses:** everything in A, plus the epoch clock, weather, mutations, Nightbell and the Ridge.
**Costs:** a forecast surface, notifications, and one design pass to make timing matter. It is the
cheapest of the four by a wide margin, because the engine shipped on 2026-08-15.

| | |
| --- | --- |
| **Base** | **~40%** |
| **Breakout** | **~15%** |

**The honest weakness, stated plainly:** without a server the game can *assert* that the sky is
shared but cannot *demonstrate* it. There is no "1,204 gardens are in this storm" counter. The
fiction is true and unverifiable. Two mitigations: the **forecast** is real and needs no server, and
a single read-only counter endpoint is the cheapest server anyone has ever specified — worth
costing, not worth blocking on.

**Second weakness:** a global 60-second slot clock means a player in the wrong timezone gets fewer
good skies during their waking hours. That needs checking before it ships, and it may want the rare
tiers biased toward a spread of local evenings rather than uniform across the day.

### D — The incremental-depth reposition

Aim at **r/incremental_games** rather than the cosy audience. Doc 17's own evidence: **Magic
Research, a solo-dev incremental, made ~$400K in twelve months from zero paid promotion and
essentially two posts there.**

Garden Wonder already has more systems depth than most incrementals — six adjacency verbs, four
mutation tiers, weather, eight named pairs, per-seed mastery, pollination, a two-axis offline model.
**That depth is currently half-hidden**, because the cosy framing argues for fewer numbers on screen.

**What changes:** numbers become visible, theorycrafting is encouraged, the wiki/spreadsheet
audience is served deliberately, art polish becomes less load-bearing, and prestige becomes the
headline feature rather than a gap.

**What it costs:** the 69%-female Completion-and-Fantasy audience doc 17 identifies is *not* this
audience. It is a genuine repositioning, not an addition.

| | |
| --- | --- |
| **Base** | **~35%** |
| **Breakout** | **~10%** |

Better base odds than A because the channel demonstrably converts and is reachable for free; lower
breakout because the audience is smaller and monetizes more suspiciously.

---

## The three that are not mutually exclusive

**A is the plan. C is the hook A is missing. D is an audience A could also serve.**

Only **B** is a fork — it strands most of what is built and closes three of the four distribution
channels.

And C is the direction **legible to both audiences at once**: a public forecast you optimise against
is exactly what the incremental crowd wants, and a sky everyone shares is exactly what the cosy
crowd will post about. That is the strongest argument for it and it is why it is the recommendation.

---

## What it takes to succeed, regardless of which is chosen

Five requirements. Four of them are currently missing.

1. **A hook you can say in one sentence and show in five seconds.** Missing. This is what C supplies
   and what A does not.
2. **D7 above roughly 15%.** Simulation's benchmark D7 is 8.71% and idle's top-decile D1 is 45.55%.
   D7 is now an **ASO input**, so it is the only free algorithmic lift available. It requires
   dailies, streaks, notifications and a designed session — none of which exist. **This is the
   highest-leverage unbuilt work in the project.**
3. **One monetization lever that needs no live-ops.** Rewarded video, an accruing piggy bank, a
   content pack. All three are specified in doc 17 and none is built. A battle pass or an event
   calendar is a second job.
4. **A distribution beat to build toward.** **Wholesome Direct is annual, in June, and free to
   submit** — 5M+ views and 650+ co-streamers in 2025. That is a *date*, and the next window is
   roughly nine months out. A launch aimed at a date beats a launch aimed at "when it's ready."
   *(Verify the submission window before planning against it.)*
5. **Scope discipline.** Sneaky Sasquatch: two people, one world, accreted for six years, Apple's
   Game of the Year. Palia: ~130 people, 85 laid off, studio sold. **Depth by accretion in a single
   scene, not breadth of scenes.**

## Recommendation

**C, which is A with the sky made into the point, and D taken as a free second audience rather than
a pivot.**

The reasoning in one paragraph: this project's problem has never been that its genre is crowded — it
is that nothing about it produces a sentence. It has craft, which is necessary and insufficient, and
it has, unused, a wall-clock weather engine that makes every player's sky the same sky and lets the
game print a forecast. That is a hook, a retention mechanic, a notification that is welcome, a
screenshot, and a reason planting is a decision — and it was shipped as a convenience eleven days
ago.

**The cheapest thing on this page is also the only one that answers the question the owner is
actually asking.**

## What would change the recommendation

- **If the forecast does not survive a playtest** — if knowing the sky in advance makes the garden
  feel like a schedule rather than a place — C collapses back to A and the hook problem returns.
- **If the timezone check fails badly** and the rare skies cannot be spread fairly, the shared-sky
  fiction weakens to a single-player forecast, which is still useful and much less special.
- **If the owner wants the biggest possible ceiling and accepts the odds**, B is the honest name for
  that bet. It should be taken deliberately, with the energy question answered first, or not at all.

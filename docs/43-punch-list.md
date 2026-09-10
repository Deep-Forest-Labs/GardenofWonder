# The Punch List — the working queue of bugs and polish

**This is the day's working queue, fed by the owner playing the game.** Items arrive as they are
noticed, get a number, and get investigated far enough that a fix agent starts warm rather than
cold. Nothing here is fixed by the keeper of this file — the list becomes the brief for a separate
fix round.

The permanent record is [11-known-issues.md](11-known-issues.md). This file is the short-lived half:
a fixed item is pruned to the graveyard at the bottom with its commit, and anything that turns out
to be long-lived — accepted, deferred, or a decision rather than a defect — graduates into
`11-known-issues.md` and leaves here. **The repo is the source of truth; where this file and the
code disagree, this file is stale.**

Severity is `blocker` (cannot play past it), `annoying` (the player notices and minds), or
`cosmetic` (the player might notice).

## How an item is written — the anchor standard (owner-ruled 2026-09-03)

The 2026-09-03 round measured what stale pointers cost: **fifteen recon agents, 49 minutes,
re-doing investigation this file had already done once** — because items cited `file:line` in a
tree that takes commits all day, so several pointers were stale at kickoff and every landed commit
staled the next item's. Twelve of the round's twenty-seven commits were repairs. The standard,
drawn from that round's own findings:

1. **Anchors, not line numbers.** An item points at a FUNCTION NAME plus one unique, grep-able
   string (`renderRail()` — grep `chip timed`), never a bare `file:line`. A line number may ride
   along as a hint only in the pinned form `ui.js:648 @ <short hash>` — the commit it was true at
   — so its staleness is self-declaring. A fix agent re-derives by grep and never trusts a line.
2. **A repro is run, or it says HYPOTHESIS.** Every repro command was executed against the live
   build the day it was filed; one that was not carries the word in front of it. (The `#23` repro
   shipped un-runnable: `tap:#newsOk` dismisses a `reset: true` announcement, which reloads the
   page and destroys anything injected before it.)
3. **Driven facts and read facts are marked apart.** Any claim a fix will REST on — "this chip
   does nothing in this room", "this is only reachable through X" — is verified by driving the
   build and marked **driven**; a fact taken from reading code is marked **read**, and the fix
   agent re-checks it before building on it. (The 09-03 round: two of three chips an item called
   dead in Fall are paid on every tap there; a "move this upgrade" item would have zeroed offline
   income for every existing save as written.)
4. **Acceptance is a behaviour sentence.** Each item ends with what is TRUE after the fix —
   behaviour under conditions, in the glossary's words — never "change line N", so the fix's test
   guards the behaviour rather than the one declaration the fixer just typed.
5. **Dependencies are edges, not an ordering.** The queue names an edge only where it is real
   ("#A before #B — both edit `<surface>`") and marks everything else parallel-safe. The 09-03
   round serialized fifteen items over four real edges.
6. **The freshness sweep at dispatch.** When a round is handed over, the keeper re-greps every
   anchor once and stamps the queue's header — "verified against `<HEAD hash>`, `<time>`" — one
   as-of point for the whole round.

---

## Tonight's round

**Empty except one.** The 2026-09-03 round closed fifteen of the sixteen; see the graveyard. Nothing
is queued for a fix round right now.

- **#16 · The meadow's art pass** is the only survivor, and **it is deliberately not fix-round work
  as it stands.** Its marker half shipped inside `#12`. What is left is one bounded job — bring
  `.mw-board` and `.mw-cell` onto `.garden` and `.plot`'s material — and one design job that should
  start with a `tools/meadow-spike.html` for the owner to judge before any of it reaches `style.css`.

---

## Items

### #16 · POLISH · The meadow's art is off-style, and its board does not match the garden's · annoying · reported 2026-09-01 · part C SHIPPED 2026-09-03

**What the owner said.** "I really dislike the background and look and feel of the meadow where you
place the bees. I don't think our art style does well with long, stringy vines or grass textures. I
think it looks good at the top part of the meadow, but not at the bottom where the stone is. The tree
to the right, maybe the willow shade or whatever it is, looks really bad as well. Can we give the
meadow a nicer update to the background that's more in line with our garden with rolling hills? We've
got the fence. You could still have cobblestone… Also, we need to have and make sure that the grid
for the flowers and the honey hives match our garden. Also, the plus symbols with a little square
around them are the same type of work we're doing for fall… I think we're close, but it just needs a
fresh pass on it."

**Repro.** `node tools/probe.js wait:900 tap:#newsOk wait:500 'eval:UI.enterMeadow()' wait:1600 shot:meadow`
— the swipe is gated, so drive it through `UI.enterMeadow()` rather than a drag.

**This is three separable jobs and they are very different sizes.** Splitting them is the most useful
thing this entry does; a single "make the meadow nicer" brief produces something arbitrary.

**A · The named art faults, all in `meadow.js`.**

| The owner's words | What it is | Where |
| --- | --- | --- |
| "long, stringy vines or grass textures" | `grassBand()` — up to `w/11` individual bezier blades with seed-head ellipses, drawn twice as a back and front band | `meadow.js:85` |
| "the bottom where the stone is" | `wall()` — a dry-stone wall in three uneven courses plus a coping row, with the blades pushing through it | `meadow.js:188` |
| "the tree to the right… looks really bad" | `willow()` — thirteen hanging `mw-frond` strokes under a lumpy leaf blob on a `#8a5a33` trunk | `meadow.js:165` |
| "looks good at the top part" | `sky()` and `clouds()` — leave these alone | `meadow.js:57`, `65` |

The blades and the fronds are the same idiom — long thin strokes — and they are the two things named.
The wall's own comment argues for it (*"what a meadow has instead of a painted fence… nobody built
this last summer"*), which was a defensible call and the owner has now overruled it: they want the
garden's fence language, with cobblestone allowed to stay.

**B · The board does not match the garden's, and this is the concrete half.** The garden's plots are
brown soil in a wooden planter with a grass fringe on the rim (`.garden` / `.plot`, `style.css:518`);
the meadow's are stone setts in a tan frame (`.mw-board` / `.mw-cell`, `style.css:4140`), with locked
cells in grey cobble against the garden's grey slab. Fall's board was already brought into line with
Summer's this week (`#6`), so **the meadow is the third of three and the only one still out of
family.**

**C · ~~The plant-here marker is a third independent copy of one glyph.~~ SHIPPED in `#12` (`7571fa4`) — one glyph, one size rule, all four boards. Kept below for the record.** This is the piece that paired
directly with `#12`:

| Room | How it is drawn | Size |
| --- | --- | --- |
| Summer | `Icons.get('plantSpot')` | 30% of the cell, capped 44px |
| Fall | `Icons.get('plantSpot')` | 46%, no cap — `#12` |
| **Meadow** | **hand-drawn inline in `meadow.js:269`** — its own `rect rx=11` + dashed ring + plus path | 34% |

The meadow does not use the shared icon at all; it re-draws it, with its own dash pattern
(`6 5.4`), its own stroke width and its own colours. **Fixing `#12` by matching Fall's numbers to
Summer's leaves a third set of numbers here.** Do all three at once and make the meadow call
`Icons.get('plantSpot')` like the others, so there is one glyph and one size rule.

**The structural fact that decides how much A costs.** The garden's world is **CSS layers** —
`.hills-far`, `.hills-mid`, `.hills-near` and `.fence` are `<div class="layer">` elements in
`index.html:51-67`, styled in `style.css:234-272`, with `ui-scenery.js` driving the sky gradient,
building the clouds as DOM and tinting everything for weather. The meadow's world is **one generated
SVG** from `Meadow.scene()` (`meadow.js:411`). So "give it the garden's rolling hills and fence" is
not copy-paste — it is either re-authoring those shapes as SVG paths inside the meadow scene, or
letting the meadow use the garden's CSS layers and drawing only its own furniture. **That choice is
the first decision of this job**, and the second route is much the better one if it works, because it
makes the two rooms share a world instead of imitating one.

**Recommend a spike, because this is the house practice for exactly this.** `tools/` holds eleven
`*-spike.html` benches — `fall-spike`, `hollow-spike`, `dock-spike`, `menu-spike`, `sky-spike` — and
**there is no `meadow-spike.html`**, which may be why this room is the one that drifted. An art pass
judged by eye needs the owner's eye on it before it lands in `style.css`, and a bench is how every
other room got that.

**Related.**
- **`#12`** — fold C into it as a three-room sweep rather than fixing Fall alone.
- **`#15`** — also moves furniture at the bottom of the screen; different room, but both are the
  "bottom of the screen is crowded" complaint.
- **The meadow's door is a filed known issue** (`11-known-issues.md`, *"The meadow's only door is a
  gesture nobody can see"*). Not this item, but anyone spending a session in this room should know
  the room is hard to reach at all.
- `05-art-direction.md` owns the standard this is being measured against, and
  `tools/style-check.js` enforces the part a script can hold.

**Fix sketch.** Split it: ~~**C**, folded into `#12`~~ — done. **B next**, since it is bounded — bring
`.mw-board` and `.mw-cell` onto `.garden` and `.plot`'s material, borders, radii and lip. **A as its
own session**, starting with `tools/meadow-spike.html` carrying the current scene beside a
garden-language version — rolling hills, the fence, garden clouds, cobblestone kept as ground rather
than as a wall — for the owner to pick from. **What it might break:** `Meadow.scene()` is composed
against a fixed `VIEW` and a `HORIZON` constant with the willow and wall positioned against them
(`meadow.js:37`), so removing a layer shifts everything keyed to that horizon. The `mw-blade`,
`mw-frond` and `mw-flower` classes carry CSS animations that become dead selectors — grep and remove
them rather than leaving them. `.mw-jar-badge` is a recorded trap (`[hidden]` losing to a later
`display:grid`); do not disturb it. Run `node tools/style-check.js`, and check reduced motion — the
blades and fronds are what most of this room's motion currently is.

**Open question.** Should the meadow use the garden's actual CSS scenery layers, or keep its own SVG
scene re-authored in the garden's language? The first is less code and guarantees they can never
drift again; the second keeps the room able to differ. The owner asked for "in line with our garden",
which points at the first.

---

## Fixed and pruned

**The 2026-09-03 round closed fifteen items across 27 commits**, and the round's own close
(`93e8520`) records that twelve of those 27 were repairs to the other fifteen — the ratio that
produced the anchor standard at the top of this file. Do not re-report anything below.

- **#23 · Music stacked against a frozen clock while the device slept** — a sleep no longer fires 81
  notes at once. `3e8ecb2`. *(Filed repro was un-runnable — `tap:#newsOk` reloads the page — which is
  point 2 of the standard.)*
- **#13 · Rain and storm beds were twice as loud as wanted** — halved on `BED_TRIM`, which leaves the
  thunder alone. `a1684b3`.
- **#12 · The plant-here marker was a different size in every room** — one glyph, one size rule, all
  four boards. Absorbed `#16`'s marker half. `7571fa4`.
- **#19 · "Discover 5 species" landed in minutes and needed ~1.8 years of gold** — the discover
  quests now wait for the wall they ask you to climb, and old jammed saves un-jam. `7dbe5e5`.
- **#24 · Fall had no way to hurry a crop** — gem skip added at the garden's own rate, Century Bloom
  excluded, Summer unchanged. `bf6f24c`.
- **#25 · No way to replant without the picker** — a picked plot remembers what grew in it and offers
  it again at its own price. `ed764c4`.
- **#18 · Pet food was too cheap and single-currency** — gold, gems and one rewarded ad; **the shared
  "Watch an ad" button was built once here** and `#21` consumed it. `c2c69c6`.
- **#21 · The drone lived in Upgrades only** — the Shop lends it for half an hour, and the badge
  always outruns the loan. `ed3403b`. Repaired by `db4e5e5` (a borrowed drone's gold must never feed
  the well) and `eefbbb9` (a first session ends when you come back, not when you reload).
- **#22 · The Turn's ask read as a confiscation list** — the same price in a kinder voice, naming
  nothing less. `0d5cff2`. *(A sabotage run shipped green with the two chip rows inverted — the panel
  promised to wash away your Seeds and never touch your Gold.)*
- **#20 · A running boost was invisible at the moment it paid** — the harvest now says so. `420e628`,
  with `368add7` repairing a colour that asked the live Wonder while the crit was switched off.
- **#17 · The sky chip lectured for forty-five words before it reached the odds** — twenty now.
  `2e70be4`, with `cd40f41` catching a sentence that was false while every figure in it was derived.
- **#11 · Chips that do nothing in a season room stop being shown there** — `d2b80d5`. **My item's
  table was wrong**: it called three chip kinds dead in Fall and **two of the three are paid on every
  tap there**, so the shipped filter (`SEASON_DEAD_EFFECTS` in `ui.js`) is narrower than what I
  filed. That claim was marked from reading code, not from driving it, and it is why point 3 of the
  standard exists.
- **#9 · Only the sky chip answered a tap** — every chip in the rail does now. `e885085`, with
  `87e1db2` giving them focus they could hold.
- **#15 · The season tabs are retired and the band went to the edges** — `fb17c80`, which confirmed
  the item's warning: taking the tabs off would have deleted three lessons and a working bell.
  `357fb92` then repaired both Fall lessons, which had been parked in the HUD row pointing at sky.
- **#10 · Fall's Collect All was too small and too quiet** — wider, louder, wearing the Turn button's
  shine. `92c9bb5`. **My diagnosis was wrong**: the 132px cap was never what made it small. Winter's
  `.wi-act` keeps that width on purpose.

---

- **#14 · A growing plant's bud sat down and to the right of its stem** — never fix-rounded, by the
  owner's ruling: the Growth Stages pass rewrote the whole stage block, and the faulty
  `transform-origin` died with the numeric stage rules it lived in. Gone by construction, ripe board
  pixel-diffed to zero against the pre-pass baseline. `db43231`, 2026-09-01. The transform-origin
  corollary trap the item proposed is recorded with the pass.

- **#1 · The Thunderstorm's bed was a featureless drone** — rain's upper bands added to the storm,
  breath moved onto the audible half, `BED_TRIM` re-derived. `3f4de68`, with the measuring
  instrument that proves it.
- **#2 · A standing sky said nothing about what it was doing** — a tinted, tappable chip in the rail
  with a tooltip. **Shipped deliberately WITHOUT a countdown** (a countdown to this sky's end is a
  countdown to the next one's start, which rebuilds the forecast panel ruled out on 2026-08-31); the
  owner can reopen that. `abb55f1`, changelog line in `49ecf22`. The tooltip built here is what `#9`
  now reuses.
- **#3 · Effects, ambient and music were three buses behind two switches** — three channels, each
  with a slider and a mute. `b196d3c`.
- **#4 · The app icon was a yellow faceless flower** — rebuilt from `Flora.talkingFlower()`, eyelids
  dropped. `e6a0540`.
- **#5 · No cheat jumped ahead Turns** — a Turn-jump that credits until `turnReady()` rather than a
  flat amount, so it does not stall at Turn 4. `9297273`. *(Spring and Winter are still unbuilt —
  the cheat reaches the gate, not a garden. Slices C and E.)*
- **#6 · Fall's board sat 23px high with a 73% flower** — `d4687c3`.
- **#7 · Fall's windfall had no payoff moment** — pill moved above the board, an atomic
  `Game.fallHarvestAll()`, and the Collect All button. Same commit as `#6`, `d4687c3`. **`#10` is the
  follow-up on how it looks, not a re-report.**
- **#8 · The gem skip chip counted down every second** — countdown removed from the visible label,
  kept in the `aria-label`, and the reversal logged. `ef19afc`.

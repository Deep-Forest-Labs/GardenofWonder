# The Morning Review — the Surface run, overnight 2026-08-29

**What this file is.** The owner asked for phases 2 and 3 in one unattended session and accepted the
trade that names it: the wireframe gate's approval step moved to the morning. So every decision the
gate would normally have put to the owner is written down here — **what I chose, why, and what
changing it costs** — together with the questions I could not answer alone. Your notes on these are
**accepted rework**, priced in by the call that merged the phases.

Read it beside the two spikes. They carry the same notes inline, on the frame they belong to.

---

## Where the night got to

**Both spikes shipped first, in their own commits**, so the record shows layout preceded code:
`tools/turn-spike.html` (21 frames) and `tools/fall-spike.html` (12 frames).

**Phase 2 is built and gauntleted.** The meter pill and its projection, the Turn ceremony's five
beats, petal tracks on the Almanac, unlock prices in the plant picker, and the season tint. Eight
adversarial critics ran over it and **three independently found the same blocker — the ask told the
player the Turn was free** while it zeroed their gold, badges, boosts and plots 5–8. Fixed, along
with about twenty other findings. Every one is in the 2026-08-29 (phase 2, the gauntlet) entry of
`10-decision-log.md`.

**Phase 3's first half is built and gauntleted too**: the strip, the season edge tabs, the
locked-season gate, Fall's board with all eight crops, the windfall and the Century Bloom. Six more
critics ran over it and found **three blockers** — the bed chip read the clock instead of the
engine's windfall marks and so lied about the +50% in both directions; the gate's only visible
button was inert; and a two-thumb tap changed season. All fixed. §7 has the list and what is left.

**The map is untouched and the dock still says World**, which is your runway answer: *phase 2 deep,
phase 3 parked with the map still working*. Both navigations work. The blocker under the rest of
phase 3 is that **the Wild Meadow's only door is the map** — retiring one strands the other.

**No economy knob or rule moved.** `mintK`, `minSeeds`, `minCoins`, `tallyCap`, unlock prices, petal
prices and the blessing's grant are exactly as phase 1 left them. The three numbers I did add are
visual only and labelled as such in `DATA.year`: the season tint's hue, its ceiling, and how much of
a year's earnings ripens the palette.

**Four questions are waiting for you**, and they are the only things I could not settle alone:
§1 the meter pill's number (and the album button that would buy it back), §4 the meadow's missing
door, §5 the eight-tap Fall bed, and the accessibility trade in §2 — 40px round buttons on phones
under 430px wide, which one fewer HUD button also fixes.

---

## The five-minute phone walkthrough

Everything below is reachable from the live URL. Do it in this order.

| # | Where | What to do | What you are judging |
| --- | --- | --- | --- |
| 1 | `tools/turn-spike.html` | Scroll the 21 frames. Tap **Notes** off to see the screens clean, on to read the decisions. | Layout, at the size it ships. |
| 2 | Frames 2 → 3 → 4 | The three HUD variants, in order. | **The one layout question of phase 2** — see §1 below. |
| 3 | Frames 7 → 13 | The ceremony's four beats in sequence. | *Gift or loss?* — the rubric. |
| 4 | Frames 19 → 21 | Flick between the three season tints. | Whether the garden ripening reads at all. |
| 5 | `tools/fall-spike.html` | Frame 1 first, and sit with it. | Summer after phase 3 — two season tabs, two doors, the Stand in the dock. The screen a player lives on. |
| 6 | Frames 7 → 8 → 9 | Filling → one from ready → armed. | Whether the windfall rule can be misread. |
| 7 | Frame 11 | The Century Bloom, and the bed still armed at seven. | The exception that stops a fortnight parking the windfall. |

**Then the built game, from the live URL.** Developer tools is the unlabelled dot right of the gem
wallet.

| # | Where | What to do | What you are judging |
| --- | --- | --- | --- |
| 8 | The garden, on a **fresh** save (a private window) | Look at the HUD: a third pill, green, no number. Tap it. | Year one is a mystery — the pill answers in the flower's voice and gives no numbers at all. Is that the right amount of nothing? |
| 9 | Dev (the unlabelled dot right of the gems) → **Earn +400K**, three times | Watch the pill fill and the garden warm as it goes. | The season tint. It is the only tuning I invented, and it runs on the year's earnings rather than on the meter. |
| 10 | Dev → **A good year's Tally**, then tap the pulsing pill | The ceremony. Read the ask — especially *this year goes* — bless a flower, watch the Tally land one line at a time. | ***Gift or loss?*** — the whole rubric, in one screen. And is the price honestly stated before you pay it? |
| 11 | Back in the garden, Dev → **Earn +25K**, then tap the pill | *Now* the projection, because the pill only speaks in numbers after the first Turn: what is ready to save, and **both** Turn gates as tracks. | Can you tell *why* you cannot turn yet, without a wiki? |
| 12 | Almanac (the book button) | Petal tracks on every unlocked flower. Buy one. | Does the pouch have somewhere to go the morning after? |
| 13 | Tap an empty plot | The picker. Locked rows wear their one-time price. | Is the wall legible, and is the confirm worth its extra tap? |
| 14 | Swipe **left** on the lawn — or tap the **FALL** tab at the right edge | Fall. | Does it read as the garden in another season, or as a second game? |
| 15 | Plant something, then Dev → **Fill the bed** and **Ripen the bed** | Watch the chip above the board: *fill all eight* → *5 / 8 planted* → *All 8 in · ripe in 20m* → *one more in 4m* → *the whole bed*. | Can the windfall rule be misread? That chip is the only thing between a player and harvesting at seven of eight. |
| 16 | Swipe left again, from Fall | Winter's gate. | Is a locked season a promise or a wall? |
| 17 | Swipe right twice, back to Summer | The dock still says **World**, and the map still works. | Both navigations are live — nothing was retired. |

**This script was walked end to end, step by step, in a headless run of the live build** — that is
how steps 10 and 11 ended up in this order: on a fresh save one *Earn +400K* already meets both Turn
gates, so the projection cannot be reached before the ceremony is. The mystery pill, the ceremony,
the petal tracks, the locked picker rows, Fall's four chip states, Winter's gate and the still-live
World button were each asserted in that run.

---

## §1 — THE ONE LAYOUT QUESTION OF PHASE 2: the meter pill's number

**Doc 32 says the pill shows the banked Saved Seeds after the first Turn. Measured on the real
metrics, it cannot — not while three round buttons sit beside it.**

The HUD column is 360px wide inside `.ui`'s padding. Three round buttons take 132px of it at 40px
each. That leaves 220px for three wallets and their gaps; three pills carrying numbers need ~230px
at short values and ~245px once coins read "38.4K" and gems pass 999. `.wallets` is
`flex-wrap: wrap`, so the overflow is not an error — it is a **HUD that changes shape as you earn**,
which is the one thing a HUD must never do.

| | What it is | What it costs |
| --- | --- | --- |
| **What I built** | The pill is **icon + fill**, no number. Both numbers (banked, and this year's) live one tap away in the projection popover. | One clause of doc 32 deferred. The pouch is one tap from every screen instead of zero. |
| **Alternative A** | The pill carries its number and the wallets wrap. | ~30px of garden board, permanently, and the wrap appears and disappears as numbers grow. |
| **Alternative B** | The pill carries its number and **the album star leaves the HUD** for the Almanac. | Everything fits at the worst numbers with room over. But it is a navigation change (doc 15), and it moves a button a live tester already uses. |

**I did not take B**, though I think it is the best answer, because it is yours: doc 32 already calls
the Almanac "the one place a flower's whole story lives" and the design audit's
five-collections-into-one points the same way — the card album *is* a collection. If you say the
word, swapping to B is one markup line plus the album's new home.

**Cost of changing my choice later:** trivial. The pill's number is one template branch.

---

## §2 — Decisions the gate would have asked about (phase 2)

Each of these is also written on its own frame in `tools/turn-spike.html`.

**The HUD tightens on narrow screens, and it has to.** Wallet padding 4/8, 14px numerals, 19px icons,
40px round buttons — which is exactly the `max-height:700px` block the game already ships, promoted
to apply on narrow *width* too. Without it the pills wrap on every phone, with or without a number
on the meter. *Changing it:* it is one media query.

**The meter pill is a wallet whose own body is the meter.** Not a pill with a bar under it, which
spends a HUD row. The fill is the year; the pill is the pouch. *Changing it:* the fill is one
absolutely-positioned child.

**Saved Seeds get one new colour token, `--seed` `#7bd88f`.** Deliberately not gold (coins), not cyan
(gems), and clear of all three rarity colours — a player has learned blue/purple/gold means rarity,
and doc 05 forbids borrowing those. It is the only new token phase 2 adds. *Changing it:* one
variable.

**Before the first Turn the pill carries no number at all.** Doc 32's year one is "nothing,
unexplained — the mystery is the tutorial". A number invites arithmetic; a rising fill invites a tap.
It is also 34px narrower, which is what keeps the HUD on one row for the whole of year one.

**The projection popover shows the increment, never the tallied pouch.** Showing the multiplied total
before the ceremony would spoil the Tally, which is the one piece of theatre this phase exists to
build. Both Turn gates are drawn as tracks, because *why can't I turn yet* has to be answerable
without a wiki.

**The ceremony is one sheet at one height across all four beats** (`min(94%, 800px)`), with its body
centred and the primary button pinned to the bottom. A sheet that resized between the ask and the
Tally would jump under your thumb. *Consequence, found by building it:* **a sheet that tall has no
room above its own top edge**, so the ceremony draws the talking flower **inside its body** rather
than in `#sheetArt` — the breakout art clips off the top of the screen. The Almanac and the plant
picker keep the game's existing `min(80dvh, 660px)`.

**From the moment the Turn commits until the total lands, the ceremony cannot be dismissed.** The
scrim tap and the drag-to-dismiss are both guarded for the three Tally frames. `turnYear()` is
atomic and has already run by then, so a stray swipe would cost the player the only celebration the
Turn has and could never undo it. The close button returns after the total.

**The ceremony renders from a step variable, the pack-reveal pattern.** Any `panels` event repaints
the sheet body from scratch — so a ceremony that animated from markup alone would restart its
fireworks every time an unrelated purchase fired. Rendering deterministically from a step index
means a repaint reproduces the same frame.

**The Tally plate is the garden's four value tiers, indoors.** Ink outline, a dark body, cream pills
for every number, `.outlined` for the big ones. That is why an arcade scoreboard can be this loud
without leaving the house style. *Changing it:* it is one CSS block.

**Tally line labels are shortened from the data** ("Species grown this year" → "Species grown") so
they never wrap at 390px. If you want doc 33's copy verbatim, the labels wrap and the plate grows
~60px.

**The blessing picker filters capped flowers, and shows the room you are filling.** The
carried-forward requirement from docs/11: `turnYear()` silently drops a blessing on a capped flower,
so a player could lose the largest per-Turn grant in the game with no undo. The picker is a grid of
blooms with their Rich Bloom pips — no cost, no yield, no verb, because the only decision here is
*which flower*. There is **no "skip the blessing" button**; the only no-blessing path is the
every-flower-capped state, which has its own frame and its own line of writing.

**The blessing picker reserves a slot for a price it does not have** — your call from tonight. It
renders nothing while the engine gives the petal away free; pricing it later (a cost, a per-year
limit, a scaling with the Tally) is then a data change rather than a re-layout.

**The Almanac has no petal UI at all before the first Turn** — no teaser, no locked track. Doc 32's
introduction rule. The arrival of pips the morning after *is* the tutorial. This also closes a
docs/11 seam: the frozen mastery ladder is deleted rather than left reading honestly-but-oddly.
*The counter-argument I could not settle:* nothing at all is also the version that gives a player no
reason to open that page in year one.

**No signature (third) track is stubbed on the Almanac row.** Signatures are slice B. A row that
advertises an unbuilt thing is the quest-strip trap wearing a different hat.

**A locked seed row is drained, not deleted.** Today's gated row is `grayscale(.7) opacity(.72)` and
its stats stop being readable — but that row is an advert for the thing you are saving 150K for, so
the numbers have to survive. It takes the `--paper-dim` family every other "not now" state wears,
and the unlock price sits in the same slot the go button uses on every other row.

**Unlocking asks first.** One extra tap on the happy path, standing between a mis-tap and 150K of
gold that cannot be refunded. *Changing it:* deleting the confirm is two lines.

**The unlock toast says "yours for good".** The fact a player cannot see is that unlocks survive
every Turn; a one-time price that looks like a per-year price is the likeliest misreading in this
phase.

**The season tint runs 0 → 0.18 → 0.38** of `#ffb066`, `multiply`, composed exactly like the weather
tint — an overlay on the scenery, never a repaint of the sky, so the day/night cycle keeps running
underneath it. The weather's sky wash tops out at 0.68 for a full storm (the flat .52 overlay it
was composed against was retired by the Sky Pass); a season is a mood and a storm is an event, so
this stays below it. **These three numbers are the only tuning I invented tonight**,
they are visual-only with no state behind them, and they are a phase-4 knob — not an economy one.

---

## §3 — What I did not touch, on purpose

- **No economy knob or rule moved.** `mintK`, `minSeeds`, `minCoins`, `tallyCap`, unlock prices,
  petal prices, the blessing's grant: all exactly as phase 1 left them. The UI is built against the
  engine as it behaves, including the two open decisions in docs/11.
- **No retune, no phase 4, no phase 5.** The celebration ladder placement, the `FLOWER_LINES` for
  meter states, and the first-blessing script are phase 4's by doc 34 and are not in this build.
- **Docs 32 and 33 are not relitigated.** Where I departed from doc 32 it is named above, once, with
  its cost.

---

## §4 — Contradictions between the docs and the code

Recorded as found, because they change what a later phase has to build.

**`docs/32` says "the meadow keeps its current entry from Summer unchanged". There is no entry from
Summer.** Verified by grep: `UI.enterMeadow()` has exactly one caller in the whole repo —
`ui-map.js:257`, the map's dive — and the meadow's only exit is a swipe-down that returns to the
map (`ui-meadow.js:453`). **So retiring the map without re-homing the meadow strands the Wild
Meadow**: a whole built screen, with its hives, keepers and honey, unreachable from anywhere. This
is the hard rail of phase 3 and it is dealt with in §5 when phase 3 lands.


**How I dealt with it:** the meadow gets **a door at the foot of the garden, the burrow door's twin**
— same shape, same place, same "a visible labelled thing beside a gesture" pattern. Doc 32 says the
map's swipe-down "is then free for later use", so I have **left the gesture retired** and given the
meadow a door only. Both doors are drawn in frame 1 of the fall spike. *Changing it:* the door is one
button and one handler; if you would rather the meadow inherited swipe-down as well, that is three
lines in the gesture block.

---

## §5 — Decisions the gate would have asked about (phase 3)

**Sideways is discovered by a season tab at the screen edge.** The horizontal answer to the burrow
door: a 38px half-off-screen tab, one per side, wearing the season's name — and, when it is locked,
the drained paper and the turn that opens it. So **a gate is a promise you can read from Summer**
without walking to it. *The alternative* is the gesture alone plus a one-time coach mark, which is
quieter and much easier to miss — and missing it means missing Fall, which is Turn 1's whole reward.
*Changing it:* the tabs are one component and one handler.

> **Re-ruled 2026-09-03** (owner, punch list `#15`): the tab is gone and the alternative above was
> not what replaced it. What ships is the middle option nobody wrote down here — a **10×40px
> non-interactive peek** at the screen edge, keeping the drained-paper lock state, the attention dot
> and the node the coach marks point at, and losing the name, the padlock, the Turn and the tap. The
> reason the whole component could not simply go is the paragraph above: three coach marks anchor to
> it, and each bails silently when its node is missing. The Turn that opens a season is on the gate
> plate now, which the same swipe still reaches.

**The tabs sit low, over the lawn, not centred.** Centred vertically they landed **on the board**,
and the board is the thing this game is. Dropping them to the lawn band also puts them beside the two
doors, so all four ways out of the garden read as one family.

**Each season is a whole screen that slides — HUD, quest strip and dock included.** Not a static
frame with a sliding board. It makes the gesture feel like walking rather than paging a carousel, and
it is also the cheaper build, since a season is just another layer under `.ui`.

**A swipe onto a locked season shows its gate rather than refusing.** You can always walk up to a
locked gate; that is what makes it a promise rather than a wall.

**Fall's board is the garden's construction in a different material.** Same 3×3, same talking flower
in the middle, same lip ladder, same grass fringe — a **woven trug on damp autumn earth** instead of a
soil planter, because the verb here is *fill it and carry the whole thing in*. That is doc 05's
material lesson and the meadow's cobbles-vs-soil precedent, applied a second time.

**Fall's whole rule lives in one chip above the board, in four states:** *fill all eight for +50%* →
*5 / 8 planted* → *one more in 4m* → *the whole bed — +50%*, pulsing. The one thing this screen must
never do is let a player harvest at seven of eight without knowing, and the chip is what stands
between them and that. When the bed is armed the **board itself** takes a gold rim and a warm bloom —
no banner, no toast: you can tell from across the room, which is what a screen you come back to at
dinner needs. *Note for the build:* that rim is a fourth `box-shadow` layer and it **restates the
whole lip and contact shadow**, because the documented trap is that a state modifier setting
`box-shadow` silently deletes the lip — and it would bite in exactly the state a player is most likely
to be looking at.

**"One more in 4m", not "7 / 8 ripe".** A count is a status; a wait is an appointment, and the
appointment is what doc 32 wants Fall to be.

**The Century Bloom gets a different body colour from every other plot** — deep violet earth — so the
one cell that is *not* part of the bed looks like it is not part of the bed. Its wait is made visible
three ways: a plant that is visibly a sapling, a bar that has moved a fifth of the way, and a chip
reading the days left. A fourteen-day timer with no visible progress is indistinguishable from a bug.
It is **not** in the crop picker: two million gold in a list of two-thousand-gold strawberries is
either scrolled past or tapped by accident.

**The crop row is the plant picker's row with two facts removed.** No verb chip, no rarity, no gem
pill — crops roll none of those — and the shorter row is itself the tell that these are not flowers.
The clocks do the rest: **20m** where Summer says **24s**.

**The dock's World becomes Stand, and the Stand sheet is unchanged.** Doc 32's exact instruction; the
dock stays at four buttons. One new 24×24 stall icon is needed — `icons.js` has no stall today.

**The order the pushes have to happen in, which is the run's hard rail:** strip and gates first, then
Fall, then the dock swap and the map's deletion **last**. The Stand and the meadow both need their new
doors before the map goes, so there is never a push where neither navigation exists.

### The one phase-3 question I could not answer alone

**Collecting a full Fall bed is eight taps.** The engine harvests one plot per call
(`fallHarvest(idx)`), each paying its own share with the windfall applied — so the bed's big moment
arrives as eight separate toasts. I have drawn what I think it should be (**one motion, one number**)
and **built what the engine actually does**, because a collect-all is either a new affordance or a
change to how the engine is called, and no engine rule was mine to move tonight. It is a small
addition on top and a much better moment; it is also the single biggest difference between Fall
feeling like an appointment and Fall feeling like admin.

---

## §6 — Decisions the gate would have asked about (phase 3, as built)

**Fall is not a place layer, and that is the phase's one architectural decision.** The Hollow, the
meadow and the map are rooms you leave the garden for. A season is the same room in a different
month: `.stage` swaps its board, the scenery swaps behind it, and the HUD, quest strip, rail and
dock never move. *What it buys:* every control a player knows keeps working in Fall, and nothing in
Fall re-states the 560px column — the trap that made the meadow read as a worse game. *What
changing it costs:* rebuilding Fall as a layer means re-declaring the column and a dock, and it
would hide the shops inside a garden. I would not.

**The season edges are absolute, not grid items** — as a grid item the tabs forced `.stage` into an
implicit second column and halved the interface. They sit **low, over the lawn**, because centred
they land on the board.

**The gate says which gate is holding it.** Winter and Spring have turns in data and no gardens in
code, so *"Opens at Turn 3"* would be a lie to anyone past Turn 3. It reads *"Still growing in"*
once the turn has passed. *Changing it:* two words.

**Fall's board keeps Summer's yard padding** even though its creatures do not follow it, so both
boards are the same size. The empty strip below Fall's board is ground.

**The bed chip's near-miss state names a wait, not a count** — *"one more in 4m"*, not *"7 / 8
ripe"*. A count is a status; a wait is an appointment.

**The Century Bloom gets its own block in the picker and its own plot colour.** Two million gold in
a list of two-thousand-gold strawberries is either scrolled past or tapped by accident, and the one
cell that is not part of the bed has to look like it.

**The hedge has no blossoms.** It is used at a 42%-wide card panel and at a full-width gate screen,
and `preserveAspectRatio="none"` turns any circle into a tell-tale ellipse.

### The two phase-3 questions I could not answer alone

**1. Collecting a full Fall bed is eight taps.** `fallHarvest(idx)` is per plot, so the bed's big
moment arrives as eight separate toasts. I built what the engine does. A collect-all is either a new
affordance or a change to how the engine is called, and no engine rule was mine to move overnight —
but it is the single biggest difference between Fall feeling like an appointment and Fall feeling
like admin.

**2. The meadow still has no door but the map's.** Until it gets one, the map cannot retire and the
dock cannot take the Stand. My proposal is in §4 — the burrow door's twin at the foot of the garden,
drawn in frame 1 of the fall spike — and it is one button plus one handler. It is the first thing
phase 3's remainder needs.

---

## §7 — What phase 3's gauntlet found, and what is left

Six critics: the mandatory grammar critic, visual fidelity against the spike then doc 05, gesture
and layout, whether Fall's surface tells the truth about Fall's rules, correctness, and the house
traps. Three blockers, all fixed; the full list is in the 2026-08-29 (phase 3, the gauntlet) entry
of `10-decision-log.md`. **The three worth knowing about:**

1. **The bed chip read the clock, not the engine's marks.** A bed that is planted and ripe is not
   necessarily a bed that will pay — the latch marks once per fill and refuses to mark again while
   any mark is unspent. So harvesting one plot and replanting it (the natural flow) left the chip
   promising +50% on a plot that could never earn it, and collecting one plot dropped the promise off
   the seven that still would. Every marked plot now wears a gold ring, so *which of these still
   pays* is something you can see.
2. **The gate's "Back to the garden" was dead.** `.in-gate` shipped with half of the place-layer
   pair; `.ui` covers the screen and ate the tap. It is the handoff's own trap, and it is now
   written there as an instruction rather than an anecdote.
3. **A two-thumb tap changed season.** One pair of gesture-origin variables with no `pointerId`, and
   the core loop is rapid two-thumb tapping.

### What is left of phase 3, in the order I would do it

1. **The meadow's door**, then the map's retirement and the Stand in the dock. Blocked on your call
   in §4; everything else waits behind it.
2. **The eight-tap bed harvest** (§5) — the biggest single difference between Fall feeling like an
   appointment and Fall feeling like admin.
3. **Fall in the welcome-back report.** The edge tab's dot and the arming celebration exist now, but
   a bed that ripened overnight is still silent in the away sheet — which is the screen a player
   sees first.
4. **Winter and Spring** are slices C and E and are correctly gated; their gates say which of the
   two gates is holding them.

### One thing I would look at with fresh eyes

Fall's scene is composed into the two bands the board does not cover, which is a constraint I only
found by drawing it and is now a trap in the handoff. It reads as a season — but it is
background-swap art by doc 32's own staging, and it is the part of the night I would least defend as
finished. Phase 4 owns it; if it looks wrong to you in the morning, that is the honest answer rather
than a defect.

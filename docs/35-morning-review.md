# The Morning Review — the Surface run, overnight 2026-08-29

**What this file is.** The owner asked for phases 2 and 3 in one unattended session and accepted the
trade that names it: the wireframe gate's approval step moved to the morning. So every decision the
gate would normally have put to the owner is written down here — **what I chose, why, and what
changing it costs** — together with the questions I could not answer alone. Your notes on these are
**accepted rework**, priced in by the call that merged the phases.

Read it beside the two spikes. They carry the same notes inline, on the frame they belong to.

---

## The five-minute phone walkthrough

Everything below is reachable from the live URL. Do it in this order.

| # | Where | What to do | What you are judging |
| --- | --- | --- | --- |
| 1 | `tools/turn-spike.html` | Scroll the 21 frames. Tap **Notes** off to see the screens clean, on to read the decisions. | Layout, at the size it ships. |
| 2 | Frames 2 → 3 → 4 | The three HUD variants, in order. | **The one layout question of phase 2** — see §1 below. |
| 3 | Frames 7 → 13 | The ceremony's four beats in sequence. | *Gift or loss?* — the rubric. |
| 4 | Frames 19 → 21 | Flick between the three season tints. | Whether the garden ripening reads at all. |

*(This table grows as the night does — the built-game steps land under it as each phase ships. If
the run stopped early, the sections below say exactly where.)*

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
underneath it. The weather tint tops out at .52 for a full storm; a season is a mood and a storm is
an event, so this stays below it. **These three numbers are the only tuning I invented tonight**,
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


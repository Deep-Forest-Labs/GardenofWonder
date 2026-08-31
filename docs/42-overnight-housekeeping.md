# The Overnight Housekeeping Round — 2026-08-30

A tooling and mechanical-fix session, run overnight while the owner was asleep and while another
session was finishing the Sky Pass (phase 3.9) in the same checkout. Nothing here changes a design,
moves a number in `data.js`, or decides anything that needed taste.

**The rule this round ran under:** fix what is mechanical or already ruled in the docs; **file
everything else**, including the things it was asked to fix. Three of the items on the list turned
out to need the owner, and one of them turned out to rest on a premise that is not true. Those are
in [What was filed, not fixed](#what-was-filed-not-fixed), which is the half of this document worth
reading first.

## How this round avoided the trap the handoff warns about

> *"A design session can commit into THIS checkout while you are working in it… Not a branch and not
> a worktree — the same directory."*

That was live tonight, not hypothetical: `game.js`, `style.css`, `audio.js` and `data.js` all had
uncommitted Sky Pass work in the shared checkout, and `game.js` had been written to two minutes
before this session started. Committing from that directory would have swept an unfinished sky into
a housekeeping commit.

So none of this was done there. The work ran in a **separate `git worktree` cut from `origin/main`**,
and reached `main` by pushing the branch to it. The other session's working tree was never read,
never written and never needed — it simply pulls this down when it is ready.

**One thing to keep, for whoever inherits a shared checkout:** `git stash` is not the way to get a
pristine tree for a before-and-after comparison. It was used once here, a probe run timed out mid-
comparison, and the session's own work sat in `stash@{0}` until it was noticed. A second detached
worktree is free and cannot lose anything. There is one in this session's scratch space; the second
comparison onwards used it.

## What was fixed

### The enforcement the standards never had

`tools/style-check.js`, and `tools/style-check.json` beside it. Five checks over `style.css`; the
first three fail a run and the last two only report. The design reasoning is in
[09-conventions.md](09-conventions.md#playbook-change-stylecss) and
[11-known-issues.md](11-known-issues.md#nothing-enforces-any-of-this--built-2026-08-30); what
belongs here is the two decisions that were not obvious.

**It ratchets, it does not judge.** Run strictly, it opens on 402 raw hexes and can never pass, and
a check that is red on its first run and every run after it is switched off within a week. The
baseline file records the debt as found, so the check goes red only when a change *adds* to it.
That is the difference between a rule and a complaint.

**Precision was chosen over recall.** The naive reading of doc 05 — "a `box-shadow` with a zero blur
and an `rgba()` colour is always the bug" — fires 18 times, and 16 of those are rarity rings and
pressed states that doc 05 blesses elsewhere. A lip is the shadow with a **vertical offset** and no
blur, which is the signature doc 05 actually tells you to grep for. Tightened to that, it fires
twice, and both are real. A gate that cries wolf is a gate somebody turns off.

It was sabotaged before it was believed, per the handoff's own rule about new test groups: each
failing check broken in turn and confirmed to be the one that goes red, and each blessed pattern
confirmed to stay green.

| Check | Fires | Result |
| --- | --- | --- |
| Raw hex outside `:root` | 434 → 401 | 32 swept, the rest triaged below |
| Translucent lip | 2 → 1 | `.critter-gift` fixed; `.plot .bar` filed |
| Undeclared custom property | 2 → 1 | `--badge-c` declared; `--bloom` filed |
| Corner radius off the ladder | 43, 14 distinct | Reports only — the geometry sweep is deferred |
| Border widths | 158, 11 distinct | Counts only — `1.5px` to `11px`, as doc 11 said |

The border count reproduces the 2026-08-26 audit's independently-derived numbers exactly — 11
distinct widths, and `border-radius:14px` twelve times — which is the closest thing to a correctness
proof this kind of tool gets.

### The hex sweep, and the rule it followed

32 substitutions, and the rule was deliberately narrower than "a hex that equals a token becomes the
token": **a hex was replaced only where the token's name matches the site's evident meaning.**

`#ffd43b` is `--legend`. On `.toast.legend` it became `var(--legend)`. On `.hollow-gift`,
`.food-ico b` and `.plot .bar i` it did not, because those are a gold that happens to equal the
rarity colour without meaning the rarity — and writing `var(--legend)` there would encode a claim
that is false *and* drag those components along the next time the rarity gold is retuned. Same for
`.fl-plot.century`, where doc 05 says the Century Bloom is "deliberately outside every existing
family, because it is an exception": tokenising it to `--epic` would have quietly cancelled a
documented design decision.

All 25 raw `#2c1a10` are gone. The ink can be adjusted globally now, which was the point.

### Three progress bars — two of which existed

Full write-up in [11-known-issues.md](11-known-issues.md). The short version: `.q-bar i` and
`.almanac-meter i` clip a full-width fill instead of scaling a painted one, so a part-full bar shows
its green end rather than a squeezed copy of the whole ramp. Measured at 11/25, the quest bar used
to reach full gold at 44%.

The fill is named `--fill` rather than the album's `--p`, because `--p` already means a unitless
ratio one line above the bar and a percentage two panels away. `calc(100% - 0.44)` is invalid, and
an invalid `clip-path` **shows the whole bar** — so that collision fails by reading 100%.

The third named bar, `.mastery-bar b`, is emitted by nothing and was left exactly as found.

## What was filed, not fixed

Everything in this section was on the list to fix. Each one is here because doing it would have been
a decision, not a repair.

### "Garden Mastery" → the rename rests on a premise that is not true

The round was told the rename "is already implied by the glossary". **It is not.** The glossary at
the top of [32-the-garden-year.md](32-the-garden-year.md) has sixteen entries and not one of them is
"Garden Mastery", "Bloom Mastery", "Mastery" or "Garden Bonuses". There is nothing there to imply
it, so choosing the replacement word is still the owner's call — which is what
[11-known-issues.md](11-known-issues.md) said in the first place.

**And the issue as filed is stale.** It describes a player scrolling the Almanac, seeing "Tier 13",
then seeing "Garden Mastery" a few blocks below, and assuming they are related. That collision is
unreachable now: "Bloom Mastery" appears in **zero** player-facing strings — all five hits in the
shipped code are comments — `recordHarvest()` returns `mastery: []` so the "Tier N" toast cannot
fire, and the petal tracks replaced the mastery goal line in the Almanac.

So there is exactly one string in question, `<h3>Garden Mastery</h3>` at `ui-sheet.js:1933`, and
nothing beside it to be confused with. **The question for the owner is no longer "what should it be
renamed to" but "is there still a problem here at all?"**

### The creature that arrives with a full growth bar — there is no display-side fix left

The entry says fixing it properly would let a creature arrive at ★3, and arriving small is a
designed beat. So the round looked for a display-only repair instead. **There is not one, and the
reason is worth recording:** `ui-sheet.js` already clamps that line in three places, and the clamp is
precisely what turns the true state — say 40 lifetime Rose against a goal of 24 — into the string
"24 / 24 Rose to ★2".

The panel is not lying. It is faithfully rendering a state that is itself impossible, because
`state.critters[id].level` and `state.discovered[seed]` are two independent numbers and the bar's
only job is to show the relationship between them. When they disagree, *every* rendering of that
relationship is wrong in one direction: believe `level` and the count is a lie, believe `discovered`
and the stars row is a lie. A second clamp would move the lie, not remove it. **The fix is in the
state, which is the design change the entry already reserved for the owner.**

### The two remaining `style-check` findings

- **`.plot .bar` carries `0 1px 0 rgba(255,255,255,.2)`.** It matches the lip signature but it is
  white, on a sunken translucent groove, under a 2px ink border — a lit under-edge on a recess, not
  an extruded side wall. Doc 05's "the exception is a shadow that is not a lip" is probably the right
  reading, and if so it wants to be `inset`. Either way it is a material call.
- **`--bloom` is used and never declared.** `.plot[data-stage="3"] .f-head` reads
  `scale(var(--bloom,1))` and nothing anywhere sets it, so every stage-3 bloom has always drawn at
  the fallback. Stage 2 next door uses a literal `scale(.34)`, so this looks like a deliberate
  extension point that was never wired up rather than a typo. Deleting a hook and declaring one are
  both guesses about intent.

### The near-miss hexes

29 distinct values sit within a hair of a token — `#fff8e8` against `--paper` `#fff8e7` is one step
of red — across 74 occurrences. Each is either a typo or a deliberate half-shade and **the file
cannot tell you which**. `node tools/style-check.js --strict` prints the list. Beyond them sit ~94
distinct colours with no token near them, which is a palette pass rather than a sweep.

Also filed: **`#f08c00` is a third gold with no name**, used both for legendary text on cream and for
coin figures. It wants a `--legend-d`, or an admission that `--coin-d` is doing double duty.

### Two dead surfaces, found on the way past

- **`.mastery-bar` and the `.almanac-row-goal` block around it** are emitted by no `ui-*.js` file.
- **`.card-badge`'s tint hook is bypassed.** `--badge-c` is now declared, but `ui-sheet.js:295`
  sets `style="background:${w.tint}"`, which replaces the whole gradient rather than feeding the
  variable. The hook works and nothing uses it.

Neither was deleted. The last "delete the unused thing" call in this repo was wrong by merge time,
and doc 11 already says to confirm against both branches first.

## The two-minute morning check

1. **Watch the new check pass, then watch it fail.**

   ```
   node tools/style-check.js
   ```

   It ends `OK — no new drift off docs/05-art-direction.md.` Now add a line to the bottom of
   `style.css` — `.x{color:#123456}` — and run it again: it names the file and line and exits 1.
   Delete the line. That is the whole feature.

2. **Look at the two bars.** Open the game, tap the flower a dozen times, and look at the quest
   strip: the fill is green, and it stays green until the bar is nearly full. Before tonight it
   reached full gold at 44%. The Almanac's Collection meter is the same fix.

3. **The suite.**

   ```
   node tools/sim-test.js
   ```

4. **Then read [What was filed, not fixed](#what-was-filed-not-fixed)** — particularly the first
   item, which asks you a different question than the one the round was sent to answer.

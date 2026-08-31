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

### The design rules become checks too

Twenty assertions at the end of `tools/sim-test.js`, in five groups, each one a sentence a doc
already states turned into something that can go red — the offline `CORE` list matching the scripts
the page actually loads, every badge in `DATA.upgrades` reaching a surface a player can see, every
announcement image precached and **lowercase**, decor staying cosmetic and boosters staying
unbuyable, and every good carrying the `line` its customer speaks.

**Every one was sabotaged individually and confirmed to be the assertion that fails**, in a
throwaway copy so the tree was never dirty — and then sabotaged again by a second pass whose only
job was to refute the first. That second pass earned its keep: it found **two assertions whose names
promised more than their code tested.** "No decor row carries a stat" only looked for `type` and
`val`, so a bare `yield: 2` stayed green; "every decor price never escalates" only checked that the
cost was a positive number, so a `costScale: 2` beside it stayed green too. Both predicates are
widened and both sabotages now go red. It also caught a comment describing a reading its own code
does not use, and a scraped group missing the "was actually found and read" guard its three
siblings have.

Two of the original sabotages are worth repeating:

- Changing an announcement path to `Garden-Year.png` left the *on-disk* check **green**, because a
  Mac disk is case-insensitive and GitHub Pages is not. Doc 09's "this bit once already", reproducing
  exactly, which is why the lowercase check is its own assertion rather than folded into the other.
- Adding `cost: 50` to a booster walked straight past the existing check, which asks only whether
  the word `tickets` is present. The new one asks about six price fields.

**Two of the four candidates the known-issues entry named were not written, and both refusals are
the finding.** The place taxonomy is dead — the map was retired the same day that entry was written,
and `overworld.js` and `ui-map.js` are not on disk. And the currency policy's "adding anything to
this list requires removing something else" is **a constraint on a diff, not on a snapshot**: a test
only ever sees one state. It also turns out to be already broken, which is in the list below.

### Three progress bars — two of which existed

Full write-up in [11-known-issues.md](11-known-issues.md). The short version: `.q-bar i` and
`.almanac-meter i` clip a full-width fill instead of scaling a painted one, so a part-full bar shows
its green end rather than a squeezed copy of the whole ramp. Measured at 11/25, the quest bar used
to reach full gold at 44%.

The fill is named `--fill` rather than the album's `--p`, because `--p` already means a unitless
ratio one line above the bar and a percentage two panels away. `calc(100% - 0.44)` is invalid, and
an invalid `clip-path` **shows the whole bar** — so that collision fails by reading 100%.

The third named bar, `.mastery-bar b`, is emitted by nothing and was left exactly as found.

### `harvestsThisSession` renamed, and deliberately not reset

doc 11 filed it as a naming problem and it was right. The field counts lifetime harvests toward a
repeating +1 reputation drip, is only read modulo 10, and progress surviving a reload is what a
player wants. So it is `harvestsTowardRep` now — and **actually making it per-session is a behaviour
change that was not made**, because nobody asked for one.

The rename is behaviour-preserving **only** because it ships with a `load()` fixup. The field is in
the save, and `load()` copies unknown keys in and never removes them, so a bare rename would have
cost every existing player up to nine harvests of progress and left a dead key in `state` forever,
silently. Proven load-bearing rather than assumed: removing the fixup turns the suite red in three
places, one of them the pre-existing "no key dodges the partition" check, which names the stray key.
`legacy/main.js` still writes the old name and was left alone on purpose — real `igr-save` payloads
were written by it, and the same fixup migrates them for free.

### Four smaller repairs

- **`Icons.get()` warns once per missing name**, gated on `location.hostname` being `localhost`,
  `127.0.0.1` or `''` — the same test `index.html` uses to skip the service worker, and the only
  honest dev signal in a project with no build step. The fallback is byte-identical. **The suite
  cannot test this** (Node has no `location`) and `probe.js` drops every console message that is not
  an error, so it was proved by driving a real browser and capturing `console.warn`: two warnings
  for three bad calls, none for a good one.
- **A focus ring on every button**, as an `outline` and never a `box-shadow` — because every surface
  here carries its lip in `box-shadow`, and a ring written that way deletes the lip of whatever it
  lands on. On a bare `button` rule that is every button at once. Confirmed by reading `boxShadow`
  on a focused dock button and finding its 5px lip intact.
- **Three `aria-label`s**, each copied from text already beside it. The plot buttons were left alone:
  their name depends on plot state, and guessing is worse than the gap.
- **The quest card's contact shadow.** It had the seed row's material and not its `0 8px 14px`, so
  two rows from one recipe sat at different heights. The seed row's *press* was deliberately not
  copied — that is a different question from height.

### The check found a flaw in itself, by being pointed at code it had never seen

Run against the in-flight Sky Pass CSS in the shared checkout — read-only, nothing written — the
checker reported **26 undeclared custom properties**. Every one is a `--wx-*` weather knob written
with a fallback, waiting for a `DATA.weatherStage` that phase 3.9 has deliberately not built yet.
They are correct.

A gate that fails on those is a gate that fires on work in progress, on somebody else's desk. So the
check is split: `var(--x)` with **no** fallback drops the whole declaration at computed-value time
and paints nothing — that is the `--ink-soft` bug, and it now fails at a baseline of **zero**, so
the next one is caught the day it appears. `var(--x, 12px)` paints the fallback, is reported loudly,
and does not fail. **The one that is silent is the one that is fatal.**

Worth knowing: the Sky Pass work will meet this gate when it merges. On tonight's snapshot it also
carries 65 new raw hexes and 2 new translucent lips. That is not a criticism of unfinished work — it
is what the gate is for, and doc 05's check 5 already asks for a new value to be written down with
its reason.

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

### The `innerHTML` hardening — priced, not done

The entry said "add escaping before adding any naming feature" and had said it long enough to become
furniture. It is now measured: **908 interpolations reach an `innerHTML`, and 468 of them return
markup that must not be escaped** — an icon SVG, a drawn creature, a nested conditional fragment —
against 120 that want escaping. A blanket `esc()` is 468 hand-judged opt-outs whose failure mode is a
panel printing tag source, in files no test in this repo can see.

**Nothing player-supplied can reach a panel today.** Checked rather than assumed: no `input`, no
`textarea`, no `contenteditable`, no `prompt()`, no URL parameters, no `postMessage`, no `fetch`
outside `sw.js`.

The filed ruling is a rule rather than a helper — **player text never enters a template literal** —
with the sixteen sites a naming feature would actually touch named individually. Full plan in
[11-known-issues.md](11-known-issues.md).

### Five documentation faults, found by trying to assert what the docs say

The most load-bearing: **[33-year-one-economy.md](33-year-one-economy.md)'s "every level grants
something" is false** — six levels have no entry — and **the currency policy in doc 12 is violated by
its own terms**, since `savedSeeds`, `petals` and `tickets` are all tracked and none of them is in
that document's currency table. The Garden Year added two currencies without the trade the rule asks
for. All five are listed in [11-known-issues.md](11-known-issues.md).

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

   1,407 passed, 0 failed. It was run **45 times consecutively with 0 divergent** — ten was the ask,
   but the flakes this project has recorded were 4-in-50 and about 1-in-25, and ten runs would miss
   a 1-in-25 flake two times in three. Nothing flaked, so there was no unpinned randomness to hunt.

4. **Then read [What was filed, not fixed](#what-was-filed-not-fixed)** — particularly the first
   item, which asks you a different question than the one the round was sent to answer.

# Decision Log

Why things are the way they are. Append new entries at the top with a date. Record the reasoning,
not the diff — git already has the diff.

---

## 2026-09-02 (ruling) — The record shelf: songs on Side A, charms on Side B

**The owner ruled the collectible-records feature into the game**: records found through play,
each carrying a song and a charm, **equipped independently once found** — the owner's own
decouple, which is the transmog pattern and the design's spine. The full spec is
**[49-the-record-shelf.md](49-the-record-shelf.md)**, pressure-tested before filing (two critics,
five blockers folded in). The owner's two placement rulings: **the gramophone in the Hollow**,
bought with keepsakes in the already-ruled two-creatures shape — the game's first memento sink —
and **a live "Records" row in the hamburger menu** with a new vinyl icon. The reserved "Garden
Record" row is relabelled **"Garden Journal"** (two "records" cannot share a menu — design-desk
call, owner may veto at the spike).

**The design laws, from the research (K.K. Slider, transmog, and this repo's own tables):**
sources are named deterministic gifts, never loot rolls, and grants are **condition-latched
sweeps, never edge-fired** — the pressure test proved edge triggers would permanently lock out
the veteran playtest saves (a maxed creature never levels again; a claimed milestone never
re-fires). **Rarity maps to the song and the ceremony, never to charm size.** Charms are small,
categorical, one slot at v1, flowing through one auditable modifier function, and **every charm
works with music muted** — power never coerces audio-on in a game that ships music off. **A
record with a charm is never sold for money, ever** — a permanent charm is the forever-money
back door doc 37 forbids; cosmetic-only records may join the decor lane someday as their own
ruling.

**Rejected:** records as a card-album set (the album's constitution keeps power out — doc 19's
own words); mementos as the currency that buys records themselves (finding must never feel like
shopping; mementos buy the FURNITURE, per the 2026-08-18 ruling); a combo-building charm (combo
feeds tap yield and the Tally's bestCombo arm — two banned tables at once); edge-fired grants
(above); rarity-scaled charm power (deletes the choice the decouple bought); and a badge dot on
the Records row at v1 (the find is already celebrated by the moments dialog — the dot is the
ready answer if playtesters miss new records).

**The music itself is a separate content stream** — the owner supplies track files; doc 48 (the
commissioning bible) is the music session's deliverable, and until it lands the delivery specs
in doc 49's audio section are normative. Playback rulings made here, owner-vetoable at the
spike: equipping a song flips the music channel on (a chosen act is consent to hear it); the
record wears the standing sky's dress in its cheapest form (one lowpass driven by the ARRANGE
values); mute PAUSES the track rather than silencing it.

---

## 2026-09-02 (gauntlet) — Five independent critics, one live playtest, and what survived contact with both

**The gauntlet closed 3 of 5 clean.** Economy scope and reduced motion came back with zero
findings — confirmed independently that no price, yield, grow time or unlock value moved, and that
every new animation (the reveal-fresh flash, the moments dialog's entrance) respects
`prefers-reduced-motion` the same way the rest of the game does. The other three each found
something real.

**Visual — the masked seed row was not actually opaque.** `<button class="seed-row masked" ...
disabled>` inherits the pre-existing `.seed-row[disabled]{filter:grayscale(.6) opacity(.6)}` meant
for ordinary can't-afford rows, re-washing the "drained paper, still fully legible" surface docs/47
asks for on top of — and directly contradicting this same pass's own comment on the Almanac's masked
row, one file over: "Not opacity-dimmed like `.dim` above: the row is fully opaque." Only one of the
two masked-row implementations actually was. Fixed with one line — `.seed-row.masked{filter:none}`,
which wins on source order at equal specificity (`.seed-row[disabled]` and `.seed-row.masked` are
both a class plus one more simple selector) — and confirmed live via `getComputedStyle` before and
after.

**Grammar — the upgrade reveal's tagline broke the popup's one rule, and the owner found the same
bug live before the report even finished.** "In the shop now." is retail language under a
celebratory headline, and it is not even true — the upgrade sits in the *upgrades* sheet, never the
shop. Doc 47 says "the popup sells nothing," twice. Independently, watching the real Star Strike
reveal on his phone, the owner flagged the exact same line, asked for "upgrade available" instead,
asked to drop the gold cost from the popup entirely (a second thing that bullet was doing that the
spec never asked for), and asked for the circle bullet in front of the remaining description to be
"some icon that represents critical multiplier" rather than the shared green dot every `.news-list`
line wears. All three landed as one change: `upgradeMoment()` now reads `tagline: 'Upgrade
available.'`, drops the cost bullet, and its one remaining bullet renders through a new `{icon,
text}` form of `bullets()` — a small badge (`.mini-badge`, the `.card-badge` recipe at 26px) showing
the upgrade's own `icon`, which every hand-authored upgrade already carries in `data.js` and already
wears on its shop card. No new art was drawn; the fix was showing art that already existed in a
second place. `seedMoment()` keeps its plain green-dot bullets — it is a real multi-fact list (cost,
grow time, payout, sometimes a verb), not one line standing in for an icon, and nothing asked for it
to change.

**Grammar, low severity, a judgement call — both reveal titles dropped their exclamation point.**
"X revealed!" was the sole punctuated line in the whole pass; every sibling line (the curtain hint,
the away-reveal line, the changelog entry, `pairRows()`'s own precedent) stays calm and unpunctuated.
The critic flagged it as debatable rather than required — the phrase stood unchanged in the
owner-reviewed spike — but dropping it costs nothing and buys consistency, so both titles now read
"X revealed." rather than "X revealed!".

**Visual, medium — doc 05 never recorded that `.news-art` can be a photograph.** Not a new problem:
the What's New announcement dialog has rendered owner-supplied raster art in `.news-art`/
`.log-ann-art` since before this feature existed, entirely undocumented in doc 05's own "no binary
assets" rule. The moments dialog just added a second user of the same pattern
(`art/reveals/placeholder.jpg`, logged in the entry below this one), which is what surfaced the gap.
Added a short exception note to doc 05 covering both.

**Visual, low — the art-fallback chain only survived one failure, not the two its own comment
promised.** `wireMomentArtFallback`'s `error` listener was `{once:true}`; a custom `revealArt` 404
followed by the shared placeholder *also* failing would have left a permanently broken `<img>` with
the SVG tier never reached. Unreachable today (no seed or upgrade sets `revealArt` yet, and the
placeholder file exists), but a real landmine for the day custom art starts shipping. Fixed by
tracking `triedPlaceholder` instead of consuming the listener, and verified live by forcing both
failures in sequence — the seed's own inline bloom correctly renders on the second failure.

**Visual, low, polish — the fallback badges were enlarged without their border and lip scaling with
them.** `.news-fallback .seed-art`/`.card-badge` grew to ~90–96px but kept the small badge's 3px
border and lip, off the ladder doc 05 states explicitly (`.unlock-art`, the nearest same-recipe
precedent at 100px, steps to 4px/5px). Matched it.

**Popup-discipline — one finding was the reviewer and this session colliding, not the game.** The
critic saw dialogs open and close, and sheets change, that it never triggered — while testing against
the same shared `localhost:8899` dev tab this session was independently using at the same moment, to
chase down the tagline bug above. Its own report says as much: "in every one of these incidents the
guards still held — never more than one `.news-card` at once, never a moment dialog coexisting with
an open sheet." No fix, because there was nothing to fix; noted here so a future gauntlet knows to
ask for (or verify) a dedicated tab. The other four popup-discipline findings were plain passes, and
one is worth calling out on its own: the burst scenario (`Game.Dev.driveYear(3000000)`, 15 moments
queued at once) confirmed the owner's own per-Turn cap request, two entries below this one, actually
holds under a real adversarial burst — not just in `sim-test.js`'s mocked clock.

**Not done, on purpose.** The owner's broader "start sprucing up these screens to feel more gaming"
is a real direction, not a scoped task — nothing else changed on its say-so. Whichever screen it
lands on next should be its own pass, not a rider on this one.

---

## 2026-09-02 (build) — The curtain and the drip's verdict, and what got built past it

**The owner's verdict on the gate-1 spike, live on the phone: go with the builder's recommendation
on everything, plus four rulings of his own.** Arm 2 (the always-revealed next wall) and the whole
reveal system shipped exactly as spiked — neither veto point was taken. The four rulings:

**1. Land Deed is out of the shop, permanently.** The owner's own observation, verified against the
code before building anything: tapping a locked plot 5–8 in the garden already unlocks it at its
own price through `unlockPlot()`, entirely independent of the Land Deed upgrade card. Land Deed
duplicated that unlock through `unlockNextPlots()` at a second, differently-priced, confusing path.
Built as a UI-only removal — `plotExpansion` is simply no longer in `CORE_UPGRADES` — rather than a
full deletion: its data, effect and any existing save's level stay in `game.js`/`data.js` untouched,
so nothing about an existing save's numbers moves and the change stays scoped to this pass rather
than becoming an unrelated cleanup. This also retires doc 47's own Land Deed reveal carve-out
outright — a card that never renders needs no reveal condition, so the second veto point resolved
itself rather than being taken either way.

**2. Every reveal gets custom art, seeds and upgrades alike — M1 is the standard, not a fallback.**
The owner wants painted art for all nineteen seeds and every upgrade eventually, and the same M1
treatment (a photo window, full advert-form stats) used for both, never the icon-only tier as the
default for upgrades. The engineering does not change — the three-tier art chain (custom, the
shared placeholder, the seed's bloom or the upgrade's badge) still exists and still never blocks the
dialog on a file that has not been painted yet — but the ART PLAN does: `art/reveals/<id>.jpg` is
the target for every entry, not an optional nicety. Nothing today declares a custom file (none has
been painted), so every reveal currently renders at the placeholder tier; the code is ready to light
up per-entry the moment a builder or the owner adds a file and sets `revealArt` on that seed or
upgrade's data row.

**3. The UPGRADE pill's dot is a number, not a boolean.** Confirmed the builder's own recommended
option (Frame D1): the existing `.dock-dot.wide` convention every other dock badge already uses,
counting revealed cards that are either affordable or unseen, one card counted once even if it is
both.

**4. A new rule: at most two seeds reveal per Turn, through arm 3 only.** The owner's own scenario,
watched actually happen while testing: leaving a harvester and the Harvest Drone running, coming
back to a large offline windfall, and worrying about "a bunch of unlock pop-ups happening" all at
once. Two clarifying calls were made before building it, both confirmed by the owner rather than
assumed:

- **The cap gates arm 3 alone — never arm 2 (the next wall) and never arm 4 (the affordability
  law).** Arm 4 is the one sim-tested guarantee the whole feature stands on — "no moment may exist
  where a seed is affordable and still hidden" — and capping it would have broken that law for the
  sake of the exact burst scenario it exists to protect against. A big windfall can still reveal
  several seeds outright if the player can afford them; only the "almost there, 85%-earned" reveals
  are throttled.
- **The cap resets on the prestige Turn, not on returning to the game.** Turns are days apart in
  this economy, so this is a real throttle rather than one that clears itself on the next visit.
  Implemented as `state.year.revealsThisTurn`, zeroed in `turnYear()` alongside the half-dozen other
  year-scoped fields that function already resets — a deliberate, named exception to doc 47's
  "`credit()` and `turnYear()` are not touched": that line was protecting the mint's own math from
  this feature, and a throttle counter that touches nothing the mint reads was never what it meant
  to forbid. Verified live: `jumpTurns`, the burst adversary, credits a huge windfall in one call and
  a single `refreshReveals()` afterward adds at most the cap's worth of new arm-3 reveals, never the
  whole crossed set.

**Two things found and fixed only by driving the real game, that no headless test could have
caught, named so the next agent does not rediscover them the slow way.** `.seed-go` is the plant
affordance's slot and nothing else — an existing scan in `tools/sim-test.js` (from a prior pass)
asserts no go slot ever renders a padlock, and the first version of the masked row put its padlock
there. It belongs in `.seed-lock`, the same slot the locked-but-revealed row already uses. And
`el` — ui.js's own module-local element cache — is not part of the shared `UI` surface the way `$`,
`S` and `fmt` are; a coach-visibility check reaching for it directly from `ui-news.js` threw on the
very first real reveal, caught only by actually opening the picker in a browser rather than trusting
the headless suite, which loads no UI file and could not have seen it.

**`tools/capture-screens.js`'s three curtain-adjacent scenes (plant-picker, upgrades, almanac) moved
from `Game.Dev.grantGold()` to `Game.Dev.driveYear()`.** `grantGold` is deliberately a cheat that
never reaches `lifetimeCoins` — exactly the property arm 4's own sim-test bill item relies on — so
under the curtain it exercises only the affordability arm, leaving everything not literally
affordable masked regardless of what a real year of play would have revealed by then. The gallery
these three scenes feed is meant to show what the game actually looks like; `driveYear` earns the
same total legitimately and lets arms 2 and 3 fire the way real play does. A fourth, silent risk
found along the way: several OTHER scenes in the same file also call `driveYear`/`grantGold` for
unrelated reasons, and any of them could now legitimately cross a reveal threshold and pop a moments
dialog mid-capture, over a Turn screen's scrim, the same failure class the announcement popup was
already guarded against. Fixed the same way: `UI.tryMoment` is neutered to a no-op for the duration
of every scene, re-applied after each scene's own page reload — not by pre-marking everything
celebrated, which would have erased the very masked-vs-revealed distinction these screenshots exist
to show.

**Rejected, in the order they came up:** capping every reveal arm uniformly (breaks the affordability
law); resetting the per-Turn cap on session return rather than on the Turn (too weak a throttle given
how rarely Turns happen); pre-celebrating everything to suppress capture-run popups (destroys the
screenshots' whole point); a full deletion of Land Deed's data and effect (real cleanup, but
unrelated scope with real save-migration risk, better done as its own deliberate pass if ever
wanted — recorded here rather than done quietly).

---

## 2026-09-02 (gate) — The curtain and the drip, drawn before it is built

**Gate 1 of [47-the-curtain-and-the-drip.md](47-the-curtain-and-the-drip.md), the spec the ruling
below produced.** `tools/curtain-spike.html` draws all three pieces — the seed picker's three
bands, the upgrade shop's drip, the moments dialog — in twelve static frames at 390×844, no
`data.js`/`game.js`/`style.css` loaded, every reused component's CSS copied by hand from the real
stylesheet so the mockup cannot be righter than the game it is describing. Live at
<https://deep-forest-labs.github.io/GardenofWonder/tools/curtain-spike.html>. **Nothing is built
yet** — no state field, no getter, no line in `game.js` or any `ui-*.js`.

**What the frames prove, not just assert.** A fresh save (P1) shows exactly the picker the spec
promises: Daisy and Tulip open, Bluebell alone priced and padlocked, everything past it a
silhouette. The same save under "Priciest" (P2) shows Bluebell, Tulip and Daisy reorder while the
`???` rows underneath do not move at all — the sort-sink rule, not merely stated. A later state
(P3) shows Lavender light up on its own once lifetime gold clears 85% of its price, wearing the
same gold flash a purchase gets, while the wallet shown (40,000 credits) stays far under what it
would take to actually buy it — arm 3 and arm 4 are visibly different mechanisms, not one law
wearing two names. The Almanac frame (A1) puts a never-grown-but-revealed row (today's exact
`.almanac-row.dim`, untouched) beside a masked one, so the difference the spec insists on is
something to look at rather than take on faith. The shop opens on four cards (U1), Star Strike
drops into its real ladder slot past 40K wearing the fresh flash while Rain Dance and Bee Swarm —
cheaper, but later in ladder order — already look ordinary (U2), and Land Deed's three states
across the Turn gate (U3) are drawn side by side rather than described. The moments dialog (M1–M4)
is the same `.news-card` recipe four times over, proving the art chain never leaves a hole: a
painted scene, the shared placeholder, and the bloom or badge alone all read as a finished screen.

**Two rulings the spec already made are shown live rather than re-argued, because the gate exists
to let the owner see their consequence before vetoing either.** Arm 2 — the next locked seed is
ALWAYS revealed, from a fresh save's first frame — is why Bluebell is priced in P1 before a single
coin is earned; veto it and the picker reads purely off the 85% line, which can leave a save with
nothing to save up for on screen for a stretch. Land Deed's `turnsCompleted ≥ plotTurnGate` carve-out
is why U3 has a middle state at all — a card that reveals on gold alone but cannot be bought before
Turn 1 is a moment that celebrates a purchase the game refuses; veto it and Land Deed reveals at
400K flat, an honest number nothing can yet spend.

**Builder judgment calls made at wireframe fidelity, worth a look rather than a ruling.** One hint
line, not nineteen — every `???` row reads "Keep growing — the garden isn't done with you," the
same choice `pairRows()` already made for an unformed creature pair (a generic "???" plus one
non-revealing note), not `critterRows()`'s per-creature `hint` field, which names a creature that
already has a face on screen. The silhouette is one generic dark flower glyph for every masked row
and Almanac slot, never a shape that hints at family or rarity — the colour is the reveal, the
shape stays a secret twice over. The moments dialog is drawn as literally `#news`, third mode,
reusing its class names rather than inventing a sibling dialog system, exactly as the spec asks.

**Genuinely open, and asked rather than answered on the frames (D1).** The UPGRADE pill's dot —
doc 36 documents that it exists and never pins its colour or a numbered form. Four readings are
drawn side by side: no change, the same plain dot doing double duty for "unseen" as well as
"affordable," a two-tone treatment, and a count like the dock tabs already carry for packs and
quests. Also open: the moments dialog's button copy (this spike reuses "Got it!", the What's New
dialog's own acknowledgement copy, for a dialog that unlike that one isn't asking the player to
acknowledge anything) and whether five sampled `???` rows read right at nineteen, which wants a
look at the real ladder before the gauntlet rather than a ruling now.

**Coordination, checked at kickoff and worth re-checking at gate 2.** Winter's gauntlet has not had
a clean round (docs/HANDOFF.md, "What is still open, honestly") and punch-list fix-round #15
(season-tab retirement) is still queued, touching `ui.js` — this pass's engine work stays clear of
both files; the surface pass that follows approval will need a fresh `git fetch` and a re-read of
this log's own top before touching either.

---

## 2026-09-02 (ruling) — The curtain and the drip: reveals become moments, and the shop learns to grow

**The owner adopted recommendations 1 and 2 of the celebratory-progression pass** (pressure-tested
the same day — three researchers on the repo's truth, the project's own law, and the market; the
market's verdict: the genre's winners lock visibly and never hide their shops, and the toxic shape
is hidden + missable + random). **The seed curtain**: open seeds, then the next locked seed exactly
as today's full-price advert (the "six times everything I've earned" wall stays on screen — its
feeling is load-bearing), then silhouette-and-`???` rows with one directional hint each, the same
grammar in picker and Almanac, the Almanac's 19 denominator kept so the collection stays legibly
finishable. **The upgrade drip**: the shop opens with four cards — Power Punch, Quick Grip, Lucky
Charm, Combo Coil, the owner's own list, all four verified as the real `short` names — and the
rest reveal progressively; their cost rebalance belongs to phase 4 and no cost moves in this pass.

**Rulings inside it:**

- **The reveal trigger keys on the earnings ledger, never on Turn count.** Turn-keyed reveals
  re-import the deleted veterancy family (a term that rewards turn count is the exploit, whatever
  its size) and would lag for exactly the casual player the design favours. **The owner set the
  threshold: a seed reveals at 85% of its unlock price** (`f = 0.85`, in data, remote-tunable),
  keyed to the lifetime ledger so it is monotone across Turns. The law it must prove by sim-test
  exit code: **no moment may exist where a seed is affordable and still hidden.** The Turn's
  ceremony stages the *celebration* of reveals; the ledger owns the *fact*. *(Two refinements at
  spec time, 2026-09-02, both in [47-the-curtain-and-the-drip.md](47-the-curtain-and-the-drip.md):
  the lowest-priced locked seed is ALWAYS revealed — the spec's own pressure test proved the 0.85
  clause alone hides the next wall in a recurring window, so the advert arm is by-construction;
  and Land Deed alone adds `turnsCompleted ≥ plotTurnGate` to its reveal — visibility matching a
  card that is structurally unbuyable pre-Turn, not information paced to Turn count. The owner
  may veto either at the spike gate.)*
- **The reveal is a moment**: a popup with custom owner-provided art and the seed's full stats in
  advert form (the Numbers rule applies to reveals too), and the seed is still purchased from the
  picker as ever.
- **A reusable milestone-popup system gets built once** — the owner's explicit ask, so popups are
  never rebuilt per feature. The What's New dialog's bones are the base; the spec carries its
  guardrails (never two popups, never a session-start gauntlet, sacred moments stay clean).
- **Reveal flags are lifetime** — top-level beside `seedUnlocks`, never cleared by any path, the
  Turn included; existing saves grandfather fully revealed (re-hiding buys no surprise and sells a
  visible regression).
- The 2026-08-13 **"mystery names rejected" entry is superseded** — both its premises (level
  gates; a picker that shows everything either way) are retired; a note now sits on that entry.

**Parked with constraints, not designed: the golden seed** — the owner's starter-pack idea, added
to doc 37's menu with its guardrails named at proposal time rather than discovered at build time.

**Rejected:** turn-count reveal triggers (above); hiding the next wall (the advert row is the
first wall's phenomenology — both docs 31 and 33 preserve it by name); absent rows anywhere (the
shipped law is "a locked thing you can see is a goal, and a missing one is nothing"); re-hiding on
migration; and any `???` slot that is missable, time-windowed, or reachable by a paid currency —
the last is a PEGI rating cliff, not a taste call.

---

## 2026-09-01 (slice C, gate 5) — The gauntlet ran twice, and what it found was mostly invisible to a green suite

**Eight critics over the shipped slice, every finding verified before it was believed.** The
interesting thing is the shape of what it caught: the suite was green at 1,592 assertions
throughout, and the four worst findings were things no assertion was ever going to see.

- **Holly failed her own build gate.** Filled in plain black only **three** crown points read
  against a ruling that says five or more and never two. The cause was arithmetic, not art: the
  short points alternated to 0.66 of the long ones and topped out at 43.5 units against a petal ring
  reaching 44, so four of seven were swallowed whole. 0.82 keeps the rhythm and loses none of them.
  **The alternation, the base radius, the crown length and the petal scale are ONE measurement**,
  and the code says so now — the next person to move any of them has to re-run the test.
- **The sleeping face was unreachable code.** A tucked plant is by definition not ripe, so it is
  never at stage 3, and the shut-eye arcs only existed there. **The entire sleeping study the owner
  chose had never rendered once.** A screenshot of a ripe board cannot show you that, and neither
  can a passing test.
- **A power-up spent in Winter bought nothing**, silently. The band's POWER-UP button is not hidden
  in a season room and boosts do not reach one, so a tap burned an unrepeatable consumable. The
  owner's #11 ruling hides the running chip in a room it does not reach; this is the same rule one
  step earlier, at the moment of spending.
- **Holly's introduction was spent behind the plant picker.** Tapping a plot is the likeliest first
  thing anybody does in a new room and it covers the screen; the lines went on drawing behind it and
  the one-shot burned on lines nobody saw. `sayText()` cannot know — the bubble is genuinely
  painted, just covered. **The meadow-signpost lesson at one more remove**, and the same answer.

**And two tests that could not fail.** The Turn partition rig replaced `state.seen` with a
three-key object, so both of this slice's new flags were witnessed at their DEFAULT and "`seen`
survives the Turn verbatim" was testing nothing; it is built from `defaultState()`'s own keys now.
And the Winter half of `reconcile()` — which doc 46 calls "new ground, not a mirror" — had no test
at all. Bill 4 was vacuous for a third reason: `passiveIncomeRate()` returns zero on its first line
without the drone, so it compared zero to zero. **The bill is 1,642 assertions now.**

**One fix was itself wrong and had to be put back.** The `max-height:700px` rail rule was deleted as
a leftover of the #11 filter — and it is not one. #11 is about MEANING (a chip doing nothing here
should not be here); that rule is about SPACE (on a 667-tall phone the bed chip's row and the rail's
row are the same 48px of band). Restored, and widened to Winter, which collides identically. **Two
rules that look like one is how a correct rule gets deleted.**

**A third round, from the verifiers' own output, found seven more — and two of them were live.**
The one-shot was **spent 2.9 seconds after the last line drew** rather than on the draw itself, so a
player who swiped out in that window got the whole introduction again on their next visit; and a
**Settings reset taken in Winter** left them standing in a season their save could no longer reach
(the reset zeroes `turnsCompleted`, `season` is a module local it does not touch, and nothing
re-evaluates the gate). Both fixed. Plus: every ripe Winter bloom sat **six percent left of centre**
in its cell, because the stage-3 viewBox was 100 wide from x=6 while every drawing is centred on 50;
the sky carried a **ruler-straight seam** where a flat haze rect met the gradient; the cell floor
had **invented four values**, one of them a second frost white two percent from the declared one;
and the Zs had been put somewhere white **twice** — first over the board's snow rail, then inside
the top-right cell, which carries its own frost rim. They hang off the board's shoulder now and
they carry the house outline, which `critters.js` deliberately omits: **that exception was decided
over a green garden**, and the reason for it inverts over snow.

**And Turn 3's gift was findable only by accident.** Fall gets two coach marks teaching its swipe;
Winter got none, and `seen.winterSwipe` was written by `goSeason()` and read by nothing. It has a
mark now, in Fall, pointing at Winter's tab — and the coach guard that suppresses the garden-facing
marks in a season room had to be **narrowed rather than blanket**, because the season marks point at
a tab, which is a real visible node there. That `:not(.season)` in the CSS is the same distinction,
and a blanket JS guard would have silently cancelled the mark it was written beside.

**Rejected:** widening the speech bubble for Holly (every one of her lines is inside the
37-character budget the game already ships instead — a character does not get its own layout rule);
a face on the stage-1 seedling (it has no head, the quilt covers the cotyledons, and forcing one is
art made worse by a rule); and counting `currency` emits as the atomicity assertion (eight harvests
drip reputation and a level grant emits on its own — the claim that survives is one write to the
save and a wallet that moved once by the whole payout, and the realistic wrong implementation, a
loop of eight single harvests, goes red on both).

**Not done: a third clean round.** Every finding is fixed and the suite is green, but the critics
have not been re-run against the result. That is the honest state of gate 5.

---

## 2026-09-01 (slice C, the referee) — The play model is one file, seeded, and it found two things

**`tools/play-model.js` exists**, and `year-sim.js` and `order-gold.js` both run on it. This is
docs/11's standing "seed the referee, then use it" item, done because doc 46 made it a prerequisite:
a Winter arm bolted onto either tool would have been the fourth diverged copy of the same person.

**The extraction was proved before it was believed.** `order-gold.js`'s full report is
**byte-identical** before and after — that was the acceptance test, run after every step, and it
caught a divergence nobody had listed: `results.turns` is an ARRAY of turn records in year-sim and a
COUNTER in order-gold. Five hooks rather than four, and the fifth only surfaced by running it.

**Seeding turned a coin flip into a verdict, and the verdict was already failing.** Five runs of the
UNSEEDED tool on unmodified code returned FAIL, FAIL, FAIL, OK, FAIL — so bill 17's exit code has
been reporting noise. It is deterministic now, on a fixed epoch (weather is a function of the clock,
and the sky changes how fast things grow, so a wall-clock seed measures a different world every run).

**Then the seeded tool failed, and it was MY model rather than the economy.** With Winter on, the
`smart` cheap-Turn cadence beat casual on lifetime coins; with Winter off it did not. The cause was
the first draft of `playWinter()`, which refilled every empty Winter plot on every eight-second
check with the best rung the wallet could afford. That made the CASUAL arm 8% poorer — Winter's
per-hour rate is far below Summer's *by design*, because the tuck's convenience is paid for in rate,
so a greedy refill parks the whole wallet in the slowest season in the game. **That is not a finding
about the economy; it is a model that does not represent a person.** Modelled as the ritual instead
— collect whenever you look, sow and tuck once on the way out — bill 17 passes both with Winter and
without.

**A lift on lifetime totals turned out not to be the number, and the tool now says so.** It moves
with the run length — **+1.4% at ten days, +2.6% at twelve, −16.2% at thirty** — and the sign flip is
not noise: the arm that plays Winter **turns less often** (16 against 21 over thirty days). The
casual model rides each year to its wall, Winter's income pushes that wall out, and the Turn is
where the compounding lives. **Winter buys gold and spends Turns.** Whether that is a cost at all is
the owner's question: the capital Winter parks is capital a sleeping player was not cycling anyway,
and a model that charges Winter the full opportunity cost of a wallet nobody is awake to spend is
being unfair to it. Reported and not tuned.

**So doc 46's own metric is implemented rather than proxied**, which the first pass had skipped: **a
kept morning is worth a median 23% of that day's income** (spread 8%–52%, over eleven kept mornings
in thirty days). That is the number that says whether the morning is worth coming back for, and it
is measured per collect from a pairing the model records as each one lands — it cannot be
reconstructed afterwards. **The band is the owner's to set**, as doc 46 says in as many words; the
tool's job is that the number exists and moves when the ladder does.

**Guardrail one FAILS, and the number to rule on is the top rung's cost.** A single full kept night
of **eight Camellia grosses 2,688,000**, which clears `minCoins` 100,000 twenty-six times over and
mints **18.3 Saved Seeds against a gate of 10** — at every Turn from 3 to 6. Driven through the real
engine rather than derived: `Game.turnReady()` goes false → true on that one collect with nothing
else played. **Only Camellia breaches**; Witch Hazel and below are clear.

**The dial, and it points the opposite way to intuition.** At this model's poorest Turn-3-to-6
lifetime a night may gross at most **1,459,149**, which is a top rung costing at most **86,854**
against 160,000 today. Gross is `plots × cost × 1.4 × 1.5`, so it RISES with cost — making Camellia
dearer makes this worse. The dials are the top rung's cost coming **down**, `DATA.winter.snowfall`
coming down, or `DATA.year.minSeeds` going up, and the last is outside this slice. All three are the
owner's; doc 46 says every number in `DATA.winter` is provisional and measured before it ships.

*(This was reported as "passes by 7.5%" until 2026-09-02. That was wrong, and wrong in the
direction that matters: the guardrail was priced from **net** — the night's takings less what the
bed cost to sow — and no Turn gate reads net. `credit()` moves `year.coinsEarned` and
`lifetimeCoins` by the full payout and sowing is a bare `state.credits -= cost` that touches
neither. The mint reads EARNINGS, never balance, which `game.js` says in those words and sim-test's
bill 3 asserts by name. Net understates every rung by a constant 1.909, which is the whole
difference between the pass and the failure.)*

**Guardrail two is reported and not failed on**, as ruled: a ripe bed held through a Turn carries at
most 2,688,000 gold into a fresh purse — 26.9× the coin gate. Accepted as cosy planning.

---

## 2026-09-01 (slice C, gates 3 and 4) — Winter is playable, and the speech bubble turned out to be two bugs

**The engine shipped first as pure simulation and the surface followed the same day**, because the
owner spent the spike gate on play rather than on reading. Winter is on `main`, behind its Turn-3
gate, and it can be walked end to end: plant a bed, tuck it in, sleep a night, collect the morning.

**"Fall's flower cannot speak" was two bugs and only one of them was written down.** The recorded
half is the node: `#speech` is created inside Summer's flower cell and four separate `display:none`
rules delete that subtree, so a line spoken anywhere else was written into a node that was not on
screen. `UI.bindFlower()` now **moves the one node** into whichever hero's cell is on screen. One
node rather than a bubble per season, deliberately: the id stays `#speech`, which is what
`tools/capture-screens.js` and `tools/stage-parity.js` both address it by, and there is still one
`speechEl` for the cooldown to reason about — a per-season copy would have needed a per-season id,
which is exactly why `ui-fall.js` declined to draw one.

**And then it still did not speak.** `sayText()` refuses while a coach mark is up, and it tested
`!el.coach.hidden` — but `.in-fall .coach:not(.season)` hides the coach *in CSS* while leaving
`hidden` false, so every line in a season room was refused before it reached the node. Moving the
bubble alone fixed nothing a player could see. It asks `offsetParent !== null` now. **Fall's
`windfall` line has drawn on screen for the first time since Fall shipped**, which is the fix
docs/11 had been carrying as an open item.

**The rail's room filter landed here rather than waiting for the fix round.** The #11 ruling names
Winter in its own words, and Winter is the season that makes the rule visible — a booster countdown
in a room where boosters do nothing is a promise the room cannot keep. It is a **JS filter** rather
than the shipped half-fix, which hid the whole rail in Fall under a `max-height:700px` media query:
that took the weather chip with it and did nothing at all on a tall phone. `.rail` keeps its
`min-height`, so an empty row still holds its box and the board below cannot move.

**Five things the surface decided, each with what was rejected.**

- **One button below the board, and its verb is the bed's state** — Tuck the bed in → Tucked in →
  Collect all. *Rejected: a tuck button and a Collect All in the same strip.* They would fight for
  the same 132px, which is a clearance rather than a taste — UPGRADE sits 34px in from the left and
  POWER-UP 34px in from the right, and neither is hidden in Winter. One button also says the ritual
  better than two.
- **Gold stays on the collect alone.** Gold means *you can have this*, and a tuck pays nothing.
  Tucked takes the **drained paper family**, which is what this game already uses for asleep —
  *rejected: a cool blue "tucked" tint*, because a state takes the value out of the surface it is
  already on before it reaches for a hue.
- **The kept mark is a static frost rim with the glint on top.** *Rejected: a shimmer alone.* Where
  a state animates, reduced motion needs a static substitute rather than a shorter duration; the
  Turn button's ready ring was a breathing halo and nothing else, and a player with the preference
  on had no ready signal at all for weeks.
- **The Zs belong to the BED, not to each cell.** Eight cells each drifting their own was eight
  promoted layers and a board saying one thing eight times — and the quilt is over the bed, not
  over a list. *Rejected: per-cell Zs*, which is what the first pass drew.
- **Winter's empty-plot marker is Summer's 30%, not Fall's 46%.** Punch list #12 is open on Fall's
  being oversized; a third size would have made the sweep worse.

**The palette went in at twelve new colours, and the six that came off it are the interesting
part.** The first pass was eighteen. Winter's growth bar took a cream well and a frost-blue fill —
both wrong, and both already answered in the file: a cream well draws a bright line across the
plant (Fall's own comment says so) and **green means *growing* in every room**, learned once. And a
"snow" family and a "frost" family that sat two percent apart are one ramp, because frost is snow
seen closer up. What is left is three declared ramps and one gate literal, all in docs/05 with
reasons.

**Holly's own two.** Her hot pink is `#ff5d95` — `gp-talker`'s bottom stop, the Summer flower's own
petal gradient — so the palette gains a *use* rather than a hue and the rivalry says itself. And
her eyes are `critters.js`'s grammar rather than `flora.js`'s: a **solid ink shape with one white
shine**, because a white sclera ringed in ink reads as spectacles on a porcelain face. Two passes
failed that way before the third worked.

**Holly joins the avatar picker fitted**, gated on `seen.hollyIntro` — the flag her introduction
spends, so wearing her face means you have actually been to her room.

---

## 2026-09-01 (slice C, gate 1) — The two spikes are up, and the owner ruled on all of them at once

**`tools/holly-spike.html` and `tools/winter-spike.html` are live**, and the owner's verdict was
not an annotation but a delegation: *"go with your recommendation on everything — I need to go in
there and play with it and see how it feels, versus trying to read over this."* So gate 1 closed
on the builder's picks, recorded here because a decision nobody wrote down is a decision that gets
re-litigated. **The motion-gate contract still held**: the spikes were built, pushed and put in
front of the owner before a line of Winter shipped, and it was the owner who chose to spend the
gate on play rather than on reading.

**The picks, each with the reason that decided it:**

| Question | Ruled | Why |
| --- | --- | --- |
| Holly's look | **Take A, the Crown** | Seven frost points, rose-form plum, pink showing past the tips. It reads loudest at 46px and it is the least ambiguous silhouette that is still *a flower* — take C's standing ruff is more distinctive in black and reads as a sunflower at picker size. |
| The avatar picker | **Fitted** | See below; this one was a finding, not a preference. |
| The sleeping plants | **S2, tucked to the shoulders** | The bloom stays legible while it is covered, so a tucked bed is still a bed you can read — and the sleep lands on the plant, which is where the grammar says it goes. S3 (a quilt over the whole cell) loses the count the chip is pointing at. |
| The board | **M1 — dark cold-frame timber, mid frozen-earth cells, snow on the rail** | docs/05's four tiers, unchanged. |
| The empty bed | **No button** | Fall hides Collect All when there is nothing to collect; Winter hides the tuck when there is nothing to tuck. The chip teaches the rule either way. |
| Falling snow | **Not this slice** | A layer costs its backing store whether it is drawn or not, and Winter already has the shimmer and the quilts. It is an addition, not a foundation. |
| Holly's face shading | **Kept** | It is the Talking Flower's own construction restated, not a new treatment. |

**The three things the spikes found that nobody had written down.**

- **The avatar picker clips Holly's crown off entirely.** The picker draws a face at the Talking
  Flower's scale inside a circular mask, and every point of Holly's crown is outside that circle —
  so at 46px, in black, all four takes were four identical discs. Fitting the whole head inside
  the disc costs 17% of her face and the eyes land near their floor. **Fitted wins**: a picker row
  where the second character in the game is a dark circle beside the first one is a row that has
  not identified her at all. The row is in the spike, both ways, so the trade is visible rather
  than argued.
- **A pale face cannot wear the Talking Flower's eyes.** Two passes failed before the third
  worked, and both failures are worth keeping: a round ellipse under a brow line reads as
  spectacles, and so does a pale almond inside a thick ink contour — on porcelain, a white sclera
  ringed in ink *is* a lens. The house already had the right grammar and it is `critters.js`, not
  `flora.js`: a creature's eye is a **solid ink shape with one white shine**. The Summer flower can
  afford a sclera because her face is saturated yellow. Holly cannot.
- **A crown drawn inside the petal ring does not exist.** It has to be drawn *after* the petals and
  reach past them, with its bases hidden under the face the way a tiara's band is. The first pass
  put it behind and it vanished at every size.

**Winter's board runs Summer's polarity, not Fall's.** The world is snow, so the board is the
**dark body** and the cells are the **mid body** inside it — the canonical arrangement in docs/05's
tier table. The first pass inverted it (a mid frame with near-black cells) on the theory that white
blooms need dark ground, and it cost both the ink bloom outline and the ink empty-marker, which
simply disappeared. Two ramps are declared in docs/05 with their reasons: the frame
`#3f4959 / #313947 / #262c37` lip `#191e26`, and the cell `#7d8798 / #68717f / #565e6b` lip
`#414854`.

**Holly's hot pink is the Summer flower's own pink.** `#ff5d95` is `gp-talker`'s bottom stop,
already in the file. It adds a *use* of an existing colour rather than a hue, which is the standing
rule — and the rivalry then says itself without a line of dialogue: the dark one is lined with the
bright one's colour on the inside of her petals.

**Rejected at this gate:** a tuck button and a Collect All in the same strip (they would fight for
the same 132px clearance the band's two buttons force on Fall — one button whose *verb* is the
bed's state says the ritual better anyway, Tuck → Tucked in → Collect all); gold on the tuck button
(gold means *you can have this*, and a tuck pays nothing — it takes the drained paper family, which
is what the game already uses for asleep); a pale-blue clock pill in the plant picker (it sits
beside `.stat.gem` and a currency colour may not be borrowed for something that is not that
currency — the clock takes plain cream, as Fall's does); cheeks on Holly (the Summer flower
blushes; Holly does not — she wears a drawn snowflake on her brow instead, which is the ruling's
own list of winter botany); and a four-point sparkle for that mark (a glint is a shader, and this
character is explicitly not made of shaders).

**One more, found by rendering rather than by reading:** a phone's top scenery band is almost
entirely under the HUD, so two bare trees standing up into it landed behind the bed chip. They are
a treeline along the horizon now. Fall's recorded lesson is that a season's scene has two visible
bands; this is the same lesson one step further along — on a phone the *top* band is thinner than
it looks in the file.

---

## 2026-09-01 (ruling) — The night shift is specified: the tuck-in, the snowfall, and a spec that was attacked before it was believed

**The owner adopted the design desk's Winter recommendation in full** — the two-beat ritual (tuck
the bed in at night, collect at first light), the whole-bed bonus grammar, six real winter
bloomers outside the flower systems, and Holly's small introduction — and the spec went through
two adversarial critics **before** entering the folder. Three blockers and thirteen highs were
found and folded in; **[46-the-night-shift.md](46-the-night-shift.md)** is the corrected result,
and slice C builds from it. What the pressure test changed, so the reasoning survives:

- **The tuck's lifecycle was unspecified — the season's centre, not an edge.** Nothing said what
  ends a tuck, whether planting into a standing tuck covers the plant, or how "ripened while
  tucked" could even be known when Winter ripens with the app closed (no code runs at that
  moment). Ruled: timestamps are the stored truth, `kept` derives from *ripen instant inside the
  tuck window* whenever ripeness is first observed, first light is an event (the first
  post-ripening collect ends the night), and **tucking after ripeness earns nothing** — the
  fishing case, closed by construction and named in the test bill.
- **The bonus was renamed twice by collision.** "First light" is a live card set; "dewfall" is a
  card in it. The name is **the snowfall** — Fall has the windfall, Winter has the snowfall, one
  grammar met twice, and the pair coexists the way windfall/Wonderfall already do.
- **Two economy seams surfaced and are ruled, not discovered later.** A kept night could open
  both Turn gates by itself at modest costs (and every extra Turn pays the unpriced blessing) —
  now a measured guardrail on the cost ladder. And ripe Winter crossing the Turn into a fresh
  purse is a bounded gold vault — **accepted as cosy planning**, sized as a tuning input, with
  the Preserve's grammar as the ready answer if live play shows it distorting; doc 32's in-flight
  auto-collect bullet is scoped to the main garden so no builder auto-eats a kept Camellia.
- **The 8h draft entry broke the season's own law** (doc 33's 12–48h band; it also sat on Fall's
  apple clock and would have dominated it). The floor is 12h, and Winter prices below Fall
  per-hour at any shared clock — the tuck's convenience premium, paid in rate.
- **Holly's intro would have spoken into a hidden node** — the meadow-signpost blocker reborn.
  Split into two beats: the ceremony's gate card, then `hollyIntro` on first entry to her own
  room, consumed only after it draws.
- **A literal `fallHarvestAll` mirror was wrong** for Winter's mixed mornings (kept beside
  unkept-ripe): the collect takes everything ripe and pays the snowfall on the kept subset only,
  with the mixed bed a named test.
- **The measurement's prerequisites are named as gates**: seed `year-sim`, extract the shared
  play model (both already-ruled, unbuilt), add a Winter arm, run seeded and paired.

**Rejected:** frost damage or any overnight loss (pre-rejected with Holly's ruling — restated
because every critic instinctively reached for it); a wall-clock evening gate on the tuck (a
time-free ritual punishes no time zone or shift); a Tally line and Stand orders for Winter at
slice C (the quiet season stays quiet; slice D owns cross-season demand); auto-collecting Winter
at the Turn (it would eat the morning the season exists for); and the names "first light" and
"dewfall" (collisions, above).

---

## 2026-09-01 (stages, built) — The owner ruled on the spike, and the garden grows in four stages

**The gate closed the same day it opened.** The owner tuned the spike and ruled: **sprout until
14%, stem until 45%, opens at 90%, the opening takes 0.9s** — earlier into the stem and the bud
than the proposal (.25/.55), the opening exactly where the ruling put it. The values ship verbatim:
`DATA.growth = { sprout: 0.14, stem: 0.45, bloom: 0.9 }` in `data.js`, the `.9s` unfurl already the
shipped default in `style.css`. `stageOf()` now speaks the four words from `DATA.growth` with
inclusive comparisons (`progressOf()` clamps to exactly 1, so `>=` fires at ripeness where `>`
never would); stage stays derived from progress alone — no migration, a mid-grow garden re-reads
under the new thresholds on next paint, which is the feature.

**What retired with the numeric stages:** the `data-stage` 0–3 rules, the orphan
`[data-stage="0"]` rule that never had a writer, and the base
`.plot .f-head{transform-origin:50px 44px}` line — **punch list `#14`'s measured bug is gone by
construction**, because every stage rule that scales the head restates its translate with
`transform-origin:0 0`. The punch list itself is deliberately untouched (it belongs to the agent
who keeps it); `#14`'s keeper should re-verify and likely close it against this entry.
`tools/sky-spike.html`'s hand-copied block and hardcoded `data-stage="2"/"3"` markup came along in
the same commit, as recorded. `var(--bloom,1)` stays as the ripe rule's knob, still writer-less.

**The Unity deliverable the pass was commissioned for shipped the same day:** all **76 per-stage
renders** (19 species × 4 stages) in `art/exports/stages/`, written by `tools/export-icons.js`.
The stated fix stays inside each file and is generated, not hand-copied: the exporter reads the
growth-staging block out of `style.css` at run time, rewrites `.plot[data-stage=X]` to a
`.stage-X` class on the exported root, and refuses to run if the block's anchors move — so the
exports cannot drift from the shipped rules. The blunt no-`var()` self-containment test gave way
to the real question (does every `var()` resolve inside the file — declared in-file or carrying a
fallback), which also let `plant-rose.svg` bake full growth honestly now that the hidden stage
groups ride in the markup. `docs/44-screens.md` and its gallery were regenerated — the
summer-garden scene now photographs buds and seedlings, 28/28 state assertions green.

**Proof, re-run after the switchover:** the ripe board diffs to **zero pixels** against the
pre-pass baseline — the growing board now differs, which is the feature shipping.
`tools/stage-parity.js` writes its stages from the live `DATA.growth` and grew a `ripe`/`grow`
board filter so the zero-forever line can be held on its own. Suite **1,495** (four new assertions
pin the `DATA.growth` contract — three ordered keys, the ruled values verbatim, the bud opening
strictly before ripeness — sabotage-proven red then green). The changelog tells the players in one
line; doc 32's glossary gains the four words; docs 03, 05, 08 and 45's hand-written half now
describe four stages.

---

## 2026-09-01 (stages, the gate) — The four stages are on main, invisible, and the spike is live

**The Growth Stages pass landed its pre-gate half: every species' sprout and bud geometry ships
inside `Flora.plant()`'s SVG, and the live game renders pixel-identically with it there.** The
spike's chicken-and-egg — it must render through the real `data.js`/`flora.js`/`style.css`, which
means the art reaches `main` before the gate — is resolved exactly as commissioned: the new groups
are hidden by base style (`display:none`, not opacity — see below), and every new stage rule is
keyed to the string values `sprout`/`stem`/`bud`/`bloom`, which nothing in the live game emits.
`stageOf()`, `ui.js` and the `DATA.growth` thresholds all wait for the owner's word at
[tools/stage-spike.html](../tools/stage-spike.html).

**The proof is a camera, not a claim.** `tools/stage-parity.js` shoots two deterministic boards
through the real build — all-ripe on the eight fast seeds, staggered growth on the slow half, the
eleven shape families covered between them — and diffs arms pixel by pixel. Before-vs-after:
**zero differing pixels on both boards**, re-derived by an independent critic. Getting the camera
honest found five things that will lie to any future diff, all now answered in the tool: the
ambient petal canvas holds boot-random particles when the frame loop stops; the loop's
already-scheduled last frame fires after a naive stub; a mid-flight transition pinned at a fixed
time freezes the sun at a boot-dependent height (transitions are *finished*, animations killed to
base pose); a merely paused animation keeps its layer promoted and promoted edges rasterise a
shade differently run to run; and `--disable-lcd-text`/`--force-color-profile` must pin the
rasteriser or edge antialiasing flips between runs.

**One real leak was caught before it shipped: an invisible child still widens the paint bounds a
`drop-shadow` rasterises from.** With the new groups hidden by `opacity:0`, every *glowing*
species' glow fringe moved by a few channels at small stages — 683 pixels on the growing board,
found only because the camera demands zero. The base hide is `display:none`, each stage that needs
a fade keeps its neighbour stage's group displayed at opacity 0, and the bud's bounds sit inside
the full bloom's, so the ripe glow can never move.

**Art decisions, made and standing for the gate:** the bud is one hand-tuned closed shape per
family, tinted from the species' own `gp-`/`gh-` gradients with sepals in its own leaf colour —
radial families get a wrapped teardrop with a calyx, the tulip closes its cup, the spike stacks
short and tight, the fern curls a crozier, the orb dulls its sphere, the bell hangs three closed
drops. The sprout is shared cotyledons in the species' leaf colour. The unfurl rides the proven
`f-head` pattern — the head swells open out of the bud's footprint while the bud fades on top —
so no new transform-origin arithmetic exists anywhere (`#14`'s rule is carried:
`transform-origin:0 0` on every restated transform). The rainbow species buds in its two data
colours; a closed bud showing all seven would read as a different flower.

**Recorded for integration, not acted on:** `.plot[data-stage="0"] .plant{opacity:0}` has no
writer (it dates to the initial commit) and `var(--bloom,1)` in the ripe rule has no JS writer —
both retire with the numeric rules when `stageOf()` switches, and
[tools/sky-spike.html](../tools/sky-spike.html)'s hand-copied stage block and hardcoded
`data-stage="2"/"3"` markup must be brought along in the same commit. Suite 1,491, zero failed;
zero new colours against `HEAD`'s distinct set.

---

## 2026-09-01 (ruling) — Holly keeps Winter's nights, and every season will one day have a face

**The owner ruled on Winter's hero flower: her name is Holly**, and she is the game's second
character-grade flower — a punk-cute foil to the Summer flower, a dark character in a sweet world
in the classic mascot-rival tradition. Grounded in real botany like everything here: **the winter
rose, the flower that blooms in snow** — which makes her Winter's whole identity in one character,
because Winter is the night shift and Holly is the one who keeps the garden while you sleep (and
will insist she didn't do it for you).

**The design brief's hard rules, recorded as rules rather than taste:**

- **The silhouette test.** Filled in as a plain black shape, Holly must read as no one but
  herself. No two-point dark silhouette over a pale face — her frost crown carries five points or
  more; her forehead mark, if any, is drawn from winter botany (snowflake, berry, thorn), never a
  skull; no tail. The character spike must include a black-silhouette row so this is judged by
  eye, not argued.
- **Her sass aims at the Summer flower, never at the player.** Doc 17's own tonal table ("flat
  positivity reads as a system"; the one-unresolved-thread device) finally gets its thread: a
  two-character rivalry, one swipe apart, each commenting from her own room.
- **The Summer flower keeps the icon, the tutorial voice and the ceremony** — Holly is additive,
  never a replacement. "Ice princess" survives as attitude, not title: no royalty vocabulary
  enters the world.

**Scope ruled: one foil first.** Holly ships with slice C and is judged with the playtest group
before Fall or Spring get a character of their own. **And the ambition is on the record: the owner
wants each season to have its own hero flower eventually, each with their own little story, the
Summer flower carrying the biggest part** — because the game is to grow a larger story over time,
milestones opening story beats the way the big cozy hits pace theirs. The story meta is
deliberately NOT designed yet; it is a named future thread. Two observations parked with it: the
Turn's season gates already ARE a chapter structure (a gate lifting is a story beat and a first
meeting — no new system needed), and `state.decor` is bought, counted and never drawn in the world
(doc 45's finding) — an empty socket a story-decoration meta would plug into. Fall borrowing
Summer's flower today is part of the same eventual-cast question.

**Rejected:** copying-adjacent design of any existing mascot — Holly is an original archetype-mate,
and the archetype (mischief, contrast, dark-and-hot-pink attitude) is nobody's property while a
silhouette is; four heroes built at once — the foil is a hypothesis with an exit, not a
commitment; and **frost damage or any overnight-loss mechanic in Winter**, pre-rejected here so no
builder ever proposes it — nothing is ever taken by a night (the fork in doc 39, and doc 40's
PEGI note, both point the same way).

---

## 2026-09-01 (ruling) — Growth stages are commissioned, and the bud holds until almost ready

**The owner commissioned the Growth Stages pass**: every flower in the main garden gets four
distinct visual stages — sprout, stem, bud, bloom — the way Animal Crossing draws them, replacing
today's three stages whose middle is the finished bloom scaled to a third ("the game goes from a
small, scaled-down version of the bloom to a larger one"). Scope, ruled at commissioning: the
Summer garden's nineteen flowers only — not Fall, not the meadow, not the Talking Flower; the ripe
blooms are **locked** ("I think we did a good job on them"); and the stages are a Unity handoff
deliverable — the team needs to see every state, exported. The pass runs as its own builder
session behind a spike gate: all nineteen species at all four stages on the owner's phone, with
threshold sliders, before any of it reaches the live plots. The prompt is written and
pressure-tested (three adversarial critics, two of the advisor's own instructions refuted and
corrected — the spike's chicken-and-egg with `flora.js` on main, and a byte-identical demand that
one-markup-CSS-chooses makes impossible as first written).

**And the one design question inside it is ruled: the bud holds until the plant is ALMOST ready,
opening a little before ripeness** — "exactly like Animal Crossing... so they can kind of see it
opening up." The opening is its own visible beat, arriving just ahead of the ripe wiggle rather
than underneath it. Default `DATA.growth.bloom = 0.9` of the grow (a 12s Daisy opens ~1.2s before
ready; a slow seed opens a minute-plus early), fine-tuned on the spike's slider at the gate —
approved values ship verbatim, per the motion gate's contract.

**Rejected: opening at 25% progress** — today's behaviour, and the shrunken-bloom read the whole
pass exists to remove. **Rejected: opening exactly at ready** — the advisor's recommendation
(bud = growing, open flower = pick me, one clean signal), overruled because it lands the opening
on the same beat as the ripe wiggle and the owner wants the opening watched, not merged into the
harvest signal.

**Coordination note for tonight's round:** punch-list `#14` (the head that sits off its stem) is a
proven one-line fix in the exact `style.css` stage block this pass rewrites. `#14` lands first in
the fix round as queued; the stages prompt tells its builder to check whether it has landed before
taking any before-screenshots, and to carry its rule — a restated SVG transform keeps
`transform-origin: 0 0` — into every new stage rule. *(Superseded the same afternoon: the owner
ruled `#14` out of the fix round entirely — the stages pass owns that block, and its integration
commit `db43231` retired the faulty rule with the rest of the numeric stages, gone by construction.
`#14` is pruned to the punch list's graveyard, never separately fixed.)*

---

## 2026-09-01 (performance, third pass) — The handset answered, and it said the frame is all paint

**The owner filmed the readout on an iPhone 16 Pro.** On a **clear sky, doing nothing**: 29 fps, a
34 ms frame, **`js 0`** and **`rest 34`**, four frames in five over budget, a worst frame of 990 ms.
Twelve particles on screen. Identical with a sheet open and closed.

**That one screen settles three arguments at once.** The game logic is not the problem *on the
device*, not just on a bench. The weather is not the problem, because this is a clear sky. And 34 ms
is 2 x 16.7 — **iOS has stopped trying for 60 and is holding the page at 30**, which is what it does
when a page cannot make the budget.

The crash is a **white screen followed by a reload**: the renderer being killed and restarted, which
is memory rather than a script error, and consistent with the layer census.

### One more free layer, found by looking rather than measuring

`.wonder-veil` was holding a full-window `overlay` blend **at all times** for an effect that runs
twelve seconds now and then — the identical mistake the weather layers were making, in the file's
oldest block, missed on the pass that fixed the others because that pass went looking under `.wx`.
Gated: 266 MB to 241 MB, and pixel-identical because the element is at `opacity:0` the whole time
the blend is now off.

**The lesson is the search, not the layer.** "Which layers hold a blend they are not using" is a
question about the whole stylesheet, and it was asked about one section.

### Why the next move is a switch panel and not another fix

**Nothing on a Mac reproduces this.** The same clear sky measures 2.3 ms here and 34 ms there — a
factor of fifteen — so every candidate ranking a desktop can produce is a guess about which of a
dozen full-screen layers iOS is actually choking on.

So rather than guess, the pass ships **Developer tools → "Find the cost"**: one switch per suspect,
each removing a layer, so the owner can turn one off and watch `rest` move on the only device where
the number is real. Ten seconds a switch, ten switches, and the answer is measured instead of argued.
Ordered by suspicion — weather layer, season tint, sky and clouds, particles — and ending with two
blunt ones, **ALL blends** and **ALL masks**, which answer a different question: if either of those
moves the number a long way and none of the specific ones do, the cost is the technique rather than
any single layer, and that is a design conversation rather than a bug.

They change how the game looks, deliberately. **A measuring tool is allowed to break the picture; a
setting is not.** They live behind the dev sheet with every other cheat.

### Rejected

- **Guessing and fixing the most likely layer.** The season tint is the obvious candidate — a
  full-window multiply that is always visible — but it is a designed effect that cannot be removed
  without changing the look, and there is no evidence yet that it is the one. Fixing it blind would
  spend the one thing this pass has been careful with all day, which is that nothing changes how a
  sky looks.
- **Reaching for a rewrite.** `js 0` is the whole reason not to. The simulation, the board and the
  tap loop are free on the device; what is expensive is a specific rendering technique used about a
  dozen times. That is a budget to bring down, not an engine to replace.

---

## 2026-09-01 (performance, second pass) — The crash is memory, not frame rate, and `opacity:0` does not put a layer down

**The owner reported that the game CRASHES when you spam the flower, harvest and plant, and that
10 fps is easy to reach.** The first performance pass had just finished measuring frame time and
finding the game healthy, so the two reports had to be reconciled before anything was changed.

### The game logic is not the problem, and that was worth proving

A hundred harvest-and-replant cycles with two thousand taps, driven headlessly: **DOM nodes flat at
~1,250, JS heap flat at 3 MB, no console errors, a steady 16.5 ms a frame.** Eight hundred taps
with the proc rate forced created ~1,750 oscillators and ~1,850 gain nodes and the heap did not
move. There is no leak in the game, in the particle pool, in the audio graph or in the DOM.

**So the failure is not something that accumulates in JavaScript. It is something iOS runs out of.**

### 343 MB of composited layers on an empty sky

The instrument for this is not a frame timer. `tools/probe.js layers:3` walks Chrome's layer tree,
resolves every layer back to the element that asked for it, and prices it at width x height x dpr²
x 4 bytes. On a **clear** sky, doing nothing:

**80 composited layers, 343 MB at DPR 3 — and 118 MB of that was held by `mask-image` alone,
across fourteen layers, every one of them a weather layer that was invisible.**

**`opacity:0` hides a layer. It does not release it.** A `mask-image` or a `mix-blend-mode` puts an
element on its own composited layer and keeps a full-window backing store there for as long as it is
in the tree, whether or not one pixel of it is ever drawn. Eleven of those hung over a clear sky,
which is seventy percent of all slots. That is invisible to every frame-rate measurement ever taken
on this game, because on a desktop it costs nothing — and it is exactly the budget iOS Safari kills a
tab for exceeding.

**It fits every symptom the owner reported**, which no frame-time explanation did: it crashes rather
than stutters, it gets worse the longer a session runs and the more the sky has cycled, and it does
not reproduce on a desk.

Dropping the mask and the blend on each layer whose sky is not standing: **80 layers to 59, 343 MB
to 266 MB, and the mask line from 131.6 MB to 17.4 MB.** Every sky is pixel-identical.

### Why the mask and the blend, and not `display:none`

`display:none` releases more, and it would have been wrong. **You cannot transition out of
`display:none`** — a layer that appears in the same frame its opacity is told to rise has nothing to
rise from, so every fade-in in the Sky Pass would have become a pop. Dropping only the mask and the
blend leaves the element in the tree with its opacity transition intact, and while it is off it sits
at `opacity:0`, where a mask and a blend mode have nothing to change. Verified rather than assumed:
sampled the wash's computed opacity every 250 ms through a rain arrival and watched it climb
0.006 → 0.224 with the mask present from the first sample.

`.wx-ground` is deliberately left alone. The wet ground dries for thirty seconds *after* the sky has
gone back to clear — that trace is the point of it, so it keeps its layer and earns it.

### The pass's own veil fix was the biggest single layer in the game

Wonderfall came to **404 MB**, and 90 MB of it was one element: the `.wx-veil::before` this pass had
introduced that morning, eight tiles wide so its slide could wrap seamlessly. **A fix for one budget
that is a liability in another**, and it took a layer census to see it — the frame timer had called
the same change a clean win.

It stayed, because measuring it three ways said it was worth keeping: the slide holds a **steady
16.67 ms** where the repainting form runs 19.6–21.1 ms and drops about one frame in seven. But it is
now **five tiles wide and not one more** — the minimum that still covers the window at the far end of
the travel, which took Wonderfall from 404 MB to 363 MB.

**The arithmetic bit twice in one day.** `background-size` percentages resolve against the element's
own box, so narrowing the child from eight tiles to five changes the tile fraction from 50% to 80%,
and getting it wrong makes a tile the wrong size — a quarter of the screen different, and completely
invisible in a diff of the CSS. Caught by the pixel diff both times. **Neither error was findable by
reading.**

### Rejected

- **`display:none` on the inactive layers.** Frees more, breaks every fade-in. Above.
- **`contain:paint` on `.wx-veil` to let the browser clip the oversized child.** Measured: no
  change at all, 399.7 MB before and after.
- **Reverting the veil to `background-position` to reclaim its 56 MB.** Tempting once memory turned
  out to be the binding constraint, and rejected on the measurement: it is the difference between a
  steady 60 and a sky that drops a seventh of its frames, and 56 MB is now a fifth of what it was.
- **Blaming the audio graph.** `tone()` and `noise()` never disconnect their gain nodes, which looks
  exactly like the classic iOS Web Audio leak. Counted it: 1,750 oscillators over 800 taps, heap
  flat throughout. Chrome collects them. Recorded as *unproven on Safari* rather than dismissed.

### What is still unknown, and it is the same thing as before

**Whether 266 MB is over or under an iPhone 16's limit.** These are Chrome's layers, priced by hand,
on a machine with no such ceiling — the number is a budget, not a verdict, and Safari's layerisation
is its own. What can be said is that the direction is right and the size is not small. The remaining
309 MB is mostly layers with no obvious cause, which is the next thread to pull if the handset still
crashes after this.

---

## 2026-09-01 (performance) — The frame dip was one sky, and the instrument is worth more than the fix

The owner reported a visible frame-rate dip on an iPhone 16 the morning the five skies landed, and
[11-known-issues.md](11-known-issues.md) filed a suspect list in rough order of guilt. **Four of the
five suspects were innocent, the one nobody named cost eight times more than any other sky, and the
thing this pass leaves behind that matters most is not a fix — it is a readout on the handset.**

### Measure first, and the first three measurements were wrong

The bench was rebuilt three times, and each wrong version looked entirely convincing.

**The first baseline measured a dialog.** What's New opens over the garden on a fresh save, and its
backdrop blur costs more than any sky. Every row in that table was the same dialog with slightly
different weather behind it, which is why Thunderstorm came out *cheaper* than a clear sky and
nobody blinked.

**The second measured another session's Chrome.** Two runs an hour apart differed by a factor of
five with no code change at all — the machine had a second headless browser on it the first time.
That is what killed before-and-after as a method here and replaced it with an A/B: inject the old
rules back on top of the live ones, alternate which arm goes first, and compare inside one run.

**The third did not paint at all.** A `--disable-gpu` headless page nobody is looking at composites
lazily, so the bench reported 2 ms a frame for a sky running nine full-screen blends. `paint:on`
opens a screencast and throws the frames away, purely to make Chrome produce real ones.

None of the three threw, and all three produced a plausible table. **A performance number that
nobody has tried to disprove is a rumour.**

### What it cost, measured

Milliseconds per frame, software rasterisation, five reps, arms alternated, one session:

| Sky | Before | After | |
| --- | --- | --- | --- |
| Clear | 2.29 | 2.31 | the floor |
| Aurora | 2.51 | 2.38 | inside the noise |
| Rain | 2.73 | 2.71 | inside the noise |
| Thunderstorm | 2.66 | 2.55 | inside the noise |
| **Wonderfall** | **4.09** | **2.62** | **80% dearer than clear → 13% dearer** |

**Wonderfall was the whole dip.** Two rules did it. Its breathing warp was one animated
`saturate()`/`hue-rotate()` duplicated across eight separate full-window scenery layers — eight
colour-matrix passes a frame and eight filter buffers held for the whole slot. And its veil animated
`background-position`, which is not a compositor property in any engine, so a six-stop rainbow was
re-rasterised across the entire window every frame and then read back through an overlay blend.

The warp now runs once, on a new `.scenery-warp` box holding all eight. **The pixels are the same
pixels**: `saturate()` and `hue-rotate()` are linear colour matrices, and for a linear matrix over
source-over compositing, filtering each layer then compositing equals compositing then filtering the
group. Nothing in the group is a spatial filter, which is the case where that would not hold. The
veil now slides a two-tile child on a `transform` instead.

### The one that nearly shipped a difference

The veil's first rewrite was a single un-repeated tile, translated the same distance. The arithmetic
was right and the result was wrong, because **backgrounds repeat by default** — the old form tiled a
4×window image, and the new one slid its only copy off the left edge and drained the colour out of
the lawn for most of the cycle. It read as fine in the code and in the diff of the code.

**It was caught by a pixel diff, not by a reading.** That is the argument for the look-parity method
this pass leaves behind: freeze every animation at the same point, stub the frame loop so the
particle canvas holds still, shoot both arms, subtract. Final verdict, on a full board:

| Sky | Pixels differing by more than 2/255 |
| --- | --- |
| Clear, Rain, Thunderstorm, Aurora, Sunbreak | **0** — bit-for-bit |
| Wonderfall | 0.006%, worst channel delta 3 — the animated filter a frame apart |

### The two always-on animations, fixed on the evidence and not on the measurement

`.wx-ray` and `.wx-front-cloud` declared their infinite animations in **base rules**, so four
blurred, masked, clip-pathed ray layers and six drop-shadowed clouds animated under every sky, from
page load, forever — for elements that are invisible except during a sunbreak or a front. They are
the only two of roughly a hundred and fifty animations in the stylesheet that were ungated.

**They show no measurable win on this bench, and they are gated anyway.** Desktop software
rasterisation does not charge for a promoted layer that paints nothing; iOS walks and commits every
promoted layer each frame whether its content changed or not. That is ten layers of pure overhead
the page did not have before the Sky Pass. Recorded as unproven rather than claimed as a win — the
handset readout is where it can be settled.

Both are written as `:not()` gates rather than the obvious positive selector, for three reasons that
each cost a rediscovery: the `animation` shorthand resets `animation-delay`, which would line all
four rays up at the left edge and delete the point of their negative delays; a positive gate
out-ranks the reduced-motion cancel and would hand sweeping rays back to a player who asked for
stillness; and `animation-play-state:paused` keeps the layer promoted, so it removes the motion and
none of the cost.

The rays needed one engine change to go with it: `sunbreakOff()` now writes **`fade` before `0`**,
because the layer takes 2.8 s to fade out and killing the sweep at the flip would freeze four shafts
mid-journey in full view.

### Two costs that are nothing to do with the weather, and are bigger

Both pre-existed the Sky Pass and both were made worse by it, because the cost is *which element*
and not *which property*.

**The screen shake wrote three custom properties on `#game` every frame.** A custom property
changing on an ancestor makes every descendant re-resolve its inherited map: 2.5–3.4 ms a frame
against 0.004 ms for the same transform written straight onto `.world`. The Sky Pass added a
twenty-four element subtree reading ninety-odd `var(--wx-*)`, which took a full recalc up by about
40%. It fires on every crit tap and holds 0.28 s, so during held tapping it is close to continuous.

**`updateSky()` wrote seven custom properties on `document.documentElement`** — the whole document
invalidated 1.67 times a second, forever, at 3.7 ms a call against 0.19 ms for the same values
written on the three elements that read them.

Neither is visible in the sky bench, which never taps and averages over six seconds. Both are the
best-evidenced answer to *why it started dipping when the Sky Pass landed*: the cost pre-existed, and
the Sky Pass pushed it past the budget.

### Rejected

- **Capping the weather canvas DPR to 1.5.** It was on the brief's own list of classic wins, and it
  is the one lever there that cannot be taken without changing the look: every particle edge softens.
  The canvas also turned out not to be a top cost — particles cover under 1.2% of the surface under
  every sky. [41-weather-staging.md](41-weather-staging.md) records "the DPR-2 canvas cap stays" as
  an owner-specced constraint, and reversing that needs a device measurement and the owner's word,
  not a quiet one-line change in `fx.js`.
- **`contain`, `isolation` or a `z-index` on `#wx`** — the standard iOS playbook for taming a blend
  stack, and every one of them is the recorded blend-killer trap spelled a different way.
- **Hoisting `mix-blend-mode:screen` from the three aurora ribbons onto their container.** Screen is
  not associative across a group when the members overlap, and they are drawn overlapping on purpose.
- **Shortening Wonderfall's veil period or dropping the glisten's 4 px halo.** Both would make the
  numbers better by making the sky different. `DATA.weatherStage` is the owner's approved feel and
  this pass may not touch it.
- **Reporting the mean as the headline number.** One machine stall moves a mean and moves nothing
  else. The median is the headline and the mean is printed beside it, because the *gap* between them
  is its own finding: a sky whose median is fine and whose mean is four times that is not slow, it
  is stalling.

### What this does not answer

**Whether the web build holds 60 on the handset.** Nothing on a Mac can tell you that — iOS Safari
pays for `mix-blend-mode` and animated filters in full-screen compositing passes that desktop Skia
simply does not charge for, which is the entire reason the dip was reported from a phone and not
from a desk. That is what `ui-perf.js` is for, and it is the deliverable this pass would keep if it
could keep only one thing.

---

## 2026-08-31 (fix round) — The sky gets a chip, and it says a chance rather than a payout

**The owner:** *"When a weather effect happens, we should place a buff and a timer under the quest
bar… they could tap on whatever the buff is and it does a quick tooltip that explains what the
weather is doing."* A standing sky is worth real money — a Thunderstorm is a ×10 and an Aurora a ×25
plus a free night — and the player's only clue was that the screen got darker.

### The hard part was the copy, not the chip

A plant rolls for a mutation **exactly once**, at a moment chosen randomly inside its grow window
when it is sown, resolved against whatever sky stands *at that moment*. So a storm standing now only
pays the plants whose booked moment happens to land inside it. **A chip reading "Gilded ×10"
promises a per-harvest multiplier the game does not give**, and a player who harvests through a whole
storm with nothing to show reads the chip as broken and the game as lying.

Every tooltip therefore states the rule first and the sky's odds second — *"Every plant rolls for a
mutation once, at a moment of its own while it grows. If that moment lands under Thunderstorm, it has
about a 1 in 7 chance of coming up Gilded — worth ×10."* Both the odds and the multiplier are read
out of `DATA` rather than written into the string, because a tooltip that drifts from the table it
describes is worse than no tooltip at all.

### No timer, and it is on the table for the morning

The owner asked for one. **The design desk's ruling in their absence is to ship without it**, and to
say so plainly rather than quietly. A countdown to the end of this sky is also a countdown to when
the next one starts, and paired with the flower's spoken forecast it rebuilds most of the forecast
panel that was ruled out this morning in `18-mutations-and-weather.md` — *"the moment planting is
scheduled against a readout the garden stops being a place and becomes an optimisation problem."*
A tinted chip says *the sky is doing something* without becoming a small clock to plant against.

That ruling is the owner's to reverse and everything is in place if they do. **The trap if they
do:** `weatherSlotRemaining()` measures the **slot**, and a called sky (bought) or a held one
(Developer tools) both outlast their slot — a chip that trusted it would count down to zero and then
keep going.

### The engineering, and the two things that bit

**It is first in the row.** The rail overflows with two boosters and a Wonder running — measured, 437
px of chips in a 370 px row — and this is the only chip in there that can be tapped. A control you
have to scroll sideways to find is a control nobody finds.

**The tooltip lives outside the rail.** `renderRail()` rewrites `el.rail.innerHTML` whenever its
signature changes and the signature carries every countdown, so it fires about once a second:
anything anchored inside would be destroyed on the next tick. `#wxTip` is a sibling of `.coach`,
borrowing its arrow-and-bubble shape and none of its machinery — it is placed by its own tap and
closed by the next one, so it never joins `refreshCoach()`'s slow tick.

**`.chip.wx` silently became a full-screen box, and then `.chip.sky` did it again.** Both class names
are taken and both are `position:absolute; inset:0` — `.wx` is the Sky Pass's weather layer, `.sky`
is the scenery's sky. The chip looked perfectly correct in the rail while measuring 390×844 and
swallowing every tap on the garden; the first probe run tapped it and summoned a Wonder Effect from
the flower underneath. **Nothing threw and nothing failed a check.** It is `.chip.weather` now, and
the recorded "check for an existing class before naming a new one" rule earned its place twice in
ten minutes.

**And the cascade caught the tooltip.** `.coach .tip` and `.weather-tip .tip` are the same
specificity, so whichever is written last wins — the block written up beside the rail lost
`white-space` and the bubble ran off both edges of the phone in one unwrapped line. It sits below
`.coach` now. Same lesson the reduced-motion block already records.

**Rejected: reusing `.coach` itself.** It carries `refreshCoach()`'s 0.6s tick, a measured target, a
0×0 hidden-target trap and two declarative hides. Borrowing the shape costs nothing; joining the
system costs all of that.

**Rejected: making the chips `<div>`s like their neighbours.** The rail has never had a listener and
its chips have never been interactive; this one is, so it is a real `<button>` with a real
`aria-label`.

**Verified:** every sky's copy read back from the running game, the chip fully visible at the head of
an overflowing rail, Clear showing no chip at all, three dismissals, the arrow pointing up at its
chip rather than down at its own roof, and no animation to lose under reduced motion.

---

## 2026-08-31 (fix round) — The daily changelog ships, and the What's New row becomes its door

Built to the spec logged this morning (see *"The daily changelog: the What's New popup's little
sibling"* further down). What follows is what the build decided that the spec left open.

**It is the same dialog, not a second one.** `ui-news.js` grew a changelog mode rather than a new
file: same `#news` node, same card, same bullets, same button. That is the "exactly like our other
popup" ask taken literally — and sharing the module's single `open` variable makes **"never two
popups" structural** rather than a rule somebody has to keep remembering.

**The marker is `gw-log`, outside the save, holding `{ seen: [dates], day }`.** `seen` is dates
rather than indices, so inserting an old entry cannot silently re-show a newer one — **and it is why
a shipped entry's date must never be edited.** `day` is what enforces once-a-day without a timer.

**The three gates are all about not being a nuisance:** something unread, nothing shown yet today,
and no announcement pending. A brand-new player is seeded as read on a fresh save — their first
changelog is the game — and `seedChangelogSeen()` refuses if anything is already recorded, so a
returning player's history can never be wiped by a mis-fire.

**The badge dot's meaning changed, and both places had to change together.** The What's New row now
leads to the changelog with the announcement as its top row, so the dot means *there is something
behind here you have not read* — either kind. The **hamburger's** dot was still testing only
`pendingAnnouncement()`, which would have badged the row inside a menu whose button stayed quiet: a
menu nobody opens. Same condition in both places now.

**The announcement is a row inside the changelog, not a second destination.** One door to "what
changed". It opens the announcement in **preview**, so its `reset` can never fire from there — that
path belongs to the once-per-build dialog on boot and to nothing else.

**Rejected: a separate `ui-changelog.js`.** A new file in `CORE`, a second copy of the show/close
dance, and a second `open` flag that would have to be coordinated with the first — which is exactly
the coordination the shared module gives away free.

**Rejected: indices instead of dates as the marker.** Cheaper to write and wrong the first time an
entry is inserted or removed.

**Rejected: making the popup dismissible by tapping the scrim.** It inherits the announcement's
"the button is the only way out", which is right for the announcement (its button does something)
and only *harmless* here — but two dialogs on one node with two dismissal rules is a bug waiting for
a distracted afternoon.

**AGENTS.md's definition of done gains its line, and this round obeys it.** A change a player can see
adds one plain sentence, in the glossary's words, in the same commit. `09-conventions.md` has the
playbook. The first entry is this round's own visible work: the sound sliders, the storm, the icon,
Fall's Collect All, Fall's alignment and the calmer gem chip.

**Verified in the browser across all four rules** — a brand-new player is seeded and shown nothing,
a returning player with an unread entry gets it once, a second load the same day is quiet, and an
unread announcement holds it back. Ten sim-test assertions, sabotaged three ways: moving the marker
into `defaultState()` (which the Turn-partition test catches as well), removing the announcement
gate, and letting seeding overwrite an existing marker.

---

## 2026-08-31 (fix round) — The Thunderstorm becomes rain plus thunder

**The owner:** *"The background sound for the storm is a little overbearing… the constant, steady
sound is a little too much… It does need to sound like it's raining."* Both halves of that turned
out to be literally true, and the obvious repair — turn it down — was the one thing that would not
have helped.

**It had no rain in it at all.** `BUILD.storm` was two low bands: a sub under 190 Hz and a roll
between 160 and 620 Hz. **Nothing above 620 Hz** — no patter, no hiss, no drops. A storm plays only
its own bed, so the rain bed was never underneath it. What the owner heard as "not sounding like
rain" was exactly that: a band-limited roar with the rain removed.

**And the half you can hear never moved.** Its only modulation rode the **sub** band, which a phone
speaker cannot reproduce; the roll band — the one a handset actually plays — sat pinned at 0.6 with
no modulation at all. Measured across everything above 300 Hz, the old storm swung **0.59 dB** over
twenty seconds against rain's 2.75. "Constant, steady" was a number.

**It measured QUIETER than the rain** — 0.0177 RMS against 0.0207, and 0.0156 against 0.0220 in the
band a phone plays. So turning it down produces a quieter featureless drone, not a cosier rain. That
is why the volume knob the owner offered as an option was declined.

**The fix is the rain graph, darker, plus a reduced roll.** Air, body and patter from `BUILD.rain`
with the body closed from 1250 Hz to 1050 and the patter held back from 0.16 to 0.10 — heavier
weather rather than a louder shower — and the roll band underneath at 0.30 rather than 0.6. **The
swell moved onto the roll**, so the half a phone can hear is the half that breathes.

**Default decided in the owner's absence: a storm keeps some rumble.** The item left it open —
cosy rain plus thunder cracks, or rain with weight still under it. The sketch's own reading was to
keep a little, so a storm still reads as different from a rain, and that is what shipped. The sub is
kept too, at 0.45 of its old height: inaudible on a handset, but on headphones it is the difference
between weather and a hiss, and at that level it no longer spends the bed's headroom on a band the
speaker throws away. **Both are one-line reversals if the owner wants pure cosy rain** — see the
morning script.

**`BED_TRIM.storm` fell from 1.9 to 1.2, re-derived by measurement.** 1.9 was calibrated for a graph
with nothing above 620 Hz, and the whole bed jumped half again the moment the rain went back into
it. Note that the trim is *not* what the thunder rides: `rel()` reads the caller's knob, so the trim
can be retuned freely — it is `DATA.weatherStage.storm.bed` that would move `crack()` and
`rumble()`, and it was not touched.

### The instrument, because this one cannot be checked by looking

`Sound.renderBed()` and `node tools/bedbench.js` are new. The bench renders each bed offline through
the **real** `BUILD[id]` and the real gain chain and prints peak, RMS, the RMS above 300 Hz, and
swing. `renderBed` swaps the module's audio context for an `OfflineAudioContext` and restores it in
a `finally` — the price of measuring the actual graph, and the right price: a bench that copies the
constants stops measuring the file it is about the first time either changes. It reproduced the
punch list's independently-taken table to within 4% on RMS before anything was altered, which is
what made it trustworthy enough to tune against.

**The phone-band column is the addition.** Whole-bed swing said the old storm was fine (3.03 dB);
above 300 Hz it said 0.59. The game is played on a handset, so the second number is the one that
describes what anybody experiences.

| Bed | peak | rms | phone rms | swing | phone swing |
| --- | --- | --- | --- | --- | --- |
| Rain | 0.106 | 0.0207 | 0.0220 | 3.05 dB | 2.68 dB |
| Storm, before | 0.083 | 0.0177 | 0.0156 | 3.03 dB | **0.59 dB** |
| Storm, after | 0.092 | 0.0203 | 0.0218 | 2.38 dB | **2.27 dB** |

Three runs each, 20-second window; RMS is the comparator because peak moves with the shared noise
buffer, which is regenerated per render.

**Rejected: giving the patter its own rhythm.** `loopNoise()` is one shared 4-second buffer, so two
taps off one source are a fixed relationship. Independent patter needs a second buffer, which the
file deliberately avoided for a phone hitch.

**Rejected: playing the rain bed underneath the storm bed.** Two beds on one bus is two fades, two
levels and a second thing for `bedsOff()` to get wrong, for a result one graph produces.

**Untouched: the storm's arrangement.** `ARRANGE.storm` is dark on dark and would compound this — but
music is off by default and the owner has almost certainly never heard it. It is a separate call,
and it belongs with the nature bed rather than with a bug fix.

---

## 2026-08-31 (fix round) — A Turn-jump cheat that earns its way there

**The owner:** *"I want to be able to get to spring and winter, so we need to be able to cheat and
jump ahead turns."* Everything needed already existed — `driveYear`, `runTurn`, `turnYear` — and
nothing looped it.

**It credits until `turnReady()`, not a flat amount, and the sim-test proves why.** The mint pool is
`mintK × √lifetimeCoins` minus what has been drawn, so a loop handing over a flat `minCoins` a year
gives a *shrinking* increment: 31.6, 13.1, 10.1, then 8.5 — under `minSeeds`, and `turnYear()`
returns `null` on the fourth pass, silently. Winter is reachable that way by luck and Spring is not.
The suite runs that flat loop and asserts it stalls short of Spring, so the decision stays measured
rather than remembered. Crediting until the gates open needs about 719K lifetime coins for Turn 6.

**The cheat flag is omitted on purpose.** `credit()` skips both `year.coinsEarned` and
`lifetimeCoins` when a grant is flagged, and those are precisely the two numbers the gates read — so
copying `grantGold`'s `{ cheat: true }` would spin the loop against a pool that never grows.
`driveYear` is the right precedent, and it is unflagged for the same reason.

**It never writes `state.year.turnsCompleted`.** The conventions playbook says a cheat forces the
real code path, and this one is a good illustration of why: that field alone opens Fall, both plot
gates and both season gates while Saved Seeds, `mintedBase` and `year.number` all disagree with it —
a garden in a state no player can ever reach, which is worse than no cheat at all.

**The blessing is re-picked every Turn, not once.** Six Turns cap a flower's Rich Bloom ladder
partway through, and a stale id makes every later blessing land nowhere while the ceremony still
reports it. Same rule the panel and `tools/year-sim.js` use: the cheapest unlocked flower with room.

**The inner loop is capped, and the method returns what it actually completed.** A cheat that can
hang the phone is not a cheat, and a loop that ignores `turnYear()`'s null reports success having
done nothing — the panel needs the count so its deny can fire.

**Rejected: a "set the Turn to N" cheat.** It is the obvious shape and it is the one the playbook
forbids, for the reason above.

**What it does NOT do, and the owner should hear it plainly: it does not show anyone a Spring
garden.** `ui.js` carries `built: false` on Spring and Winter, so the jump opens the *gate* and
behind the gate is the gate — the plate's line changes from "Opens at Turn 6" to **"Still growing
in"**, a string that had never been reachable in normal play. It is now, and it reads correctly. If
what is actually wanted is Spring and Winter to *exist*, that is slices C and E of the build plan.

**Verified end to end:** through the real dev button, a +6 jump lands at Turn 6 with 95 Saved Seeds
banked, 900K lifetime coins earned through the unflagged faucet, six blessings recorded (one per
Turn, so the re-pick works) and the wallet back to a fresh purse. Ten sim-test assertions, sabotaged
three ways — flagging the grant, flattening the credit, and writing `turnsCompleted` directly — and
each one goes red.

---

## 2026-08-31 (fix round) — Fall's board lines up with Summer's, and the windfall gets its moment

Punch-list `#6` and `#7`, done together because they are one piece of geometry: the margin causing
the offset existed only to hold the pill that `#7` moves.

**The owner:** *"If I'm on the main garden and I swipe to go to fall, I notice that the garden is
higher on the screen… the flower in the center is not the same size."* And: *"we should have that be
a 'Collect All' button… a way for the player to feel like, 'Boom! They completed a challenge.'"*

### The 23px was a margin halved, and equal margins are not the fix

`.fl-wrap` carried `margin-bottom:46px` to reserve the chip's row, and a margin on one side of a
`place-items:center` child shifts it by **half of it** — 23px, exactly what was measured. The
obvious repair is equal margins top and bottom, which cancel. They cancel *while they fit*: a grid
falls back to start-alignment the moment an item overflows its track, so on a 640-tall screen the
same trick pushed the board down by a whole strip instead of half of one. **No margin at all** is
the only version that holds at every height, and it is affordable because both the pill and Collect
All are absolutely positioned and take no space.

### The deeper fault: each season measured its own room

Removing the margin was not enough. Summer sized its board from `.stage` minus the **measured**
creature yard; Fall sized its board from its own frame minus a chip strip. Fall hides the creatures,
so measuring that node returns zero there — two formulas, two answers, and the boards only agreed at
390×844 because width happened to bind at that size. `UI.boardSide()` is now the single function
both call, and it reads the yard's **reservation** (`.stage`'s bottom padding) rather than the node,
which is the same number in both seasons by construction. Measured at 390×844, 375×667 and 390×640:
top, left, width and height agree to the pixel.

**Rejected: reserving the strips inside `boardSide()` for both seasons.** It keeps the boards equal
and costs Summer up to 46px of board on a short screen for a chip Summer does not have. The main
screen does not pay for Fall's furniture.

### The flower was never sized; it fell out

`.talker` is `118%/118%`, set inside `Flora.talkingFlower()` and belonging to the SVG rather than to
a season — so it already applied to Fall. Fall looked smaller because `.fl-flower svg{width:100%}`
was specificity (0,1,1) against `.talker`'s (0,1,0) and silently won, on top of an 86%-wide button:
`0.86 × 1.00` against `1.00 × 1.18`, which is the 95px against 130px on the ruler. Deleting one rule
and letting the button fill its cell is the whole fix — no Fall-specific size was added. The glow is
Summer's `.flower-glow`, copied as a sibling. The combo ring and the speech bubble deliberately did
not come with it: there is no combo in Fall, and `.speech` carries an id `buildGarden()` owns.

### The chip goes back above the board, and answers the reasons it left

This reverses the 2026-08-30 move below the board, made on the owner's word that above it
*"intrudes"*. Three specific failures caused that move and all three are answered rather than
reintroduced: the chip sat 2px inside the board and across the stubble fringe because it was
anchored 4px clear — at `top:-46px` there is 5px of air over a fringe occupying -10px to +2px; and
the notched-phone case, where the board filled the frame and pushed the chip off the top, cannot
recur now that the board is the same square Summer's is and the chip hangs outside it.

### The rail stands down in Fall on a short screen — with `visibility`, not `display`

Once both boards are the same size, on a 667-tall phone the chip's row and the status rail's row are
the same 48px and neither can move. `display:none` was tried first and **broke the alignment it was
meant to protect**: hiding the row gives its height back to `.stage` in Fall only, and a taller stage
in one season is the exact fault this round exists to remove. `visibility:hidden` keeps the box. The
rail loses the tie-break because a booster and the Wonder Effect act on the garden — there is nothing
in Fall for them to do and nothing there to tap. Recorded in `11-known-issues.md` as knowingly
traded.

### Collect All

**`Game.fallHarvestAll()` is one commit, shaped on `turnYear()`** — pay and clear every marked ripe
plot in one body, credit once, `saveNow()` once, emit after the state is already correct. Looping
`fallHarvest()` eight times would be eight credits, eight saves and up to seventeen emits in a
single frame, and the HUD's coin counter animates off `currency`, so the wallet would lurch through
all eight. **`Game.fallBedValue()`** returns what that call will pay, before it pays it, because the
number has to be on the button before the tap — the dev cheat's trick of summing `r.payout` after
harvesting cannot be copied into a `ui-*` file, which does no economy math.

**Nothing in the economy moves.** Picking the bed plot by plot already pays +50% on every plot,
because the promise is a per-cell mark rather than a live clock reading. Collect All is a convenience
and a celebration.

**It leaves a ripe Century Bloom standing** — the ruling in the owner's absence, and it is the
consistent one: the Century Bloom is outside the bed in both directions, so the fortnight showpiece
stays theirs to pick. In practice the mark already excludes it; the explicit `century` guard restates
the ruling rather than implementing it, and the sim-test asserts the ruling against the *realistic*
wrong implementation (a loop over everything ripe) rather than against the guard.

**One celebration, one rung above the bed arming.** Arming is the promise — a crit's worth of noise;
Collect All is the promise kept — the level-up's confetti and sound, plus the toast that names the
bonus, which is the sentence the owner asked for. Placed on the ladder in `06-audio-and-fx.md`.

**The button is 132px wide and its label is two lines, and that is a clearance rather than a taste.**
UPGRADE and POWER-UP are hidden in the Hollow, the meadow and at a gate — but **not** in Fall — and
they sit 34px in from each edge of the same strip. A full-width pill overlapped both on a 667-tall
phone; measured, 132px leaves at least 24px of daylight either side at every supported viewport.

**Fall's darker planter is left alone**, as the punch list read it: a season is allowed its own
palette, and "same visual fidelity" meant the two faults above, not repainting Fall as Summer.

**Found while in here, not fixed:** Fall's flower has no speech node. `UI.say()` writes into
`#speech` inside the garden's flower cell, which `.in-fall .garden-frame{display:none}` hides — so
the existing `windfall` beat has always spoken into a hidden node in Fall. Collect All does not call
`say()`; its toast carries the line. Filed in `11-known-issues.md`.

---

## 2026-08-31 (fix round) — The app icon becomes the flower the game actually stars

**The owner's words: "I want to update our App icon to look more like our Hero Flower and not just
a random flower."** He was describing a real gap, not a preference. The icon was a yellow, faceless,
rose-like bloom built on 2026-08-18 from the generic `round` petal path — the shape used for
*planted seeds*. The character the game opens on is an eight-petal pink flower with a face, and it
has had its own function in `flora.js` the whole time. The icon simply predated the character.

**The face is the whole thing.** A botanical drawing of a plant says "a gardening game"; a flower
looking at you says *this* game. Nothing new was drawn: the icon is `Flora.talkingFlower()`'s own
numbers — the same petal path at `rotate(i × 45)`, the same `r=26` face, the same eyes, cheeks and
mouth, the same ink — on the sky and turf the old icon already had.

**The eyelids had to be dropped, and that is a trap rather than a taste.** `.tf-lid` is a full-size
`#ffd98a` rect over each eye, collapsed to nothing by a CSS `transform: scaleY(0)` with a blink
keyframe. `icon.svg` is standalone with no stylesheet, so a verbatim paste is a flower with both eyes
shut behind two yellow blocks — and it reads as a design choice, not as a bug. This is the recorded
"a visual state must never depend on a keyframe having run" trap in new clothes.

**The stem is what gave, and the maskable safe zone is why.** Doc 23 promises the artwork sits inside
a centred circle of 40% radius so Android can crop to any mask. A face big enough to read at 40 px
plus a stem and two leaves does not fit inside that circle. The flower is centred and scaled 4.7×,
which puts the petal tips at radius 199 of the 205 allowed — the whole bloom inside the safe zone,
only sky and turf ever cropped — and the head rests in the grass rather than floating. **Checked at
40 px**, where two eyes, two blushes and a smile still read, which is the test that mattered.

**Rejected: `art/01-flower-hero.png`.** The owner supplied it and it is what prompted the ask, but it
is a photoreal 3D render and this game's art direction is flat ink outline. An icon promising a
render the game never delivers is a worse first impression than a plain icon — doc 05 is the moat.
It also would have broken the raster exception, which is `art/announcements/` **only**. It stays in
`art/` as unloaded reference, which breaks no rule.

**Rejected: keeping the sun where it was.** At (398,112) it sat directly under the new bloom's petal
ring and was simply hidden. Moved to the top-left corner, where it clears the flower and still puts
some warmth in the sky.

**Rejected: `gface` verbatim.** It relies on `mix-blend-mode: multiply`, and this file is rasterised
by `qlmanage` and drawn as a favicon by every browser. An equivalent radial — clear in the middle,
warm at the rim — gets the same face without depending on a compositing mode surviving the trip.

**`VERSION` in `sw.js` goes to 8.** The four filenames did not change, so an installed app would
otherwise keep the old picture out of its own cache. The worker is network-first, so an online player
sees the new icon regardless; the bump is what sweeps the stale copy. An app already sitting on a
home screen keeps the operating system's copy until it is re-added, and nothing in the game can
reach that.

---

## 2026-08-31 (fix round) — The gem skip chip loses its countdown, and this reverses a logged ruling

**The owner overruled a decision made yesterday, from live play**, and the reversal is the point of
this entry. On 2026-08-30 the phase-3.8 sweep put a real number on every surface, and one of the
things it found was that *"a gem skip named a price and never the wait it deleted"*.
`Game.skipSaving()` was written for that one label. It was right about the surface and wrong about
the room: `skipWait()` renders seconds below a minute, so inside the last minute of a grow window the
chip re-rendered **every second, on up to eight plots at once**, at exactly the moment the player is
watching the board.

**One chip explaining itself is informative; eight ticking together is noise.** That is the cost the
sweep did not weigh, and it is only visible from a seat in front of the game. The owner's words:
*"Remove the timer that spawns that shows how many seconds are counting down. Just show the gem and
how much it costs."*

**The wait is removed from the eye, not from the game.** It stays in the `aria-label` — "Finish now
for 3 gems, saving 13 minutes" is the accessible description of what the button *does*, spoken on
demand rather than flickering on screen, and the complaint was about visual noise. That also keeps
`Game.skipSaving()` in use, which avoids the recorded trap of removing a method from `Game` and
leaving a `ui-*` caller behind.

**The render cache relaxes with it.** `c.skipLeft` existed to notice the countdown changing. The key
is now the price and the afford state — what the visible chip is actually made of — so the branch
stops firing once a second per plot. `skipCost()` is `ceil(remaining / 30)`, so the spoken wait now
refreshes on the same thirty-second quantum the price is quoted in: the player is told what the
gems on offer buy, which is the deal actually being made.

**Rejected: keeping the wait and slowing its tick.** A countdown that updates every five seconds is
still a countdown, still eight of them, and now also wrong for four seconds at a time.

**Rejected: deleting `skipWait()`.** The short form (`13m`) is the same fact one word shorter and
something visible will want it again; it costs six lines to keep.

**The CSS comment above `.skip-chip` was rewritten rather than left standing.** It justified
`white-space:nowrap` and the `max-width` clamp with "the price and the wait are one fact, so they
never wrap apart" — false the moment the wait left. The clamp is still right, for the landscape
overflow in `11-known-issues.md`, so the reason had to be replaced rather than the rule.

**One thing fixed in passing:** the `aria-label` said "1 gems". It is the line being rewritten, so
it is now pluralised.

---

## 2026-08-31 (fix round) — Three sound channels, each a level and a mute

**The owner asked for effects, ambient and music as separate channels, then chose sliders *and*
mutes** — "sliders and an on and off to mute them". Both, per channel. The buses were already
three; only the two switches on top of them conflated them.

**The three sliders multiply the house levels; they never replace them.** `sfx 0.65`, `amb 0.36`
and `music 0.16` are calibrated against each other and against every recipe's own gain, with
`BED_TRIM` and the stinger makeup downstream of the ambient one. A slider written as a raw bus gain
throws all of that away and every measurement taken against it with it. Each slider defaults to 1.0,
so a player who never touches one hears exactly what they heard yesterday.

**`MUSIC_OFF_TRIM` is deleted, and its level is kept.** The old `ambLevel()` read *both*
preferences: effects-off silenced the sky outright, music-off trimmed it to 0.72. The argument for
that coupling was written down and is now overturned on purpose — a channel the player can reach is
the thing that makes it wrong. But retiring the reasoning is not a licence to move the number:
0.5 × 0.72 = **0.36** is the height the ambience has actually been playing at for every player, since
music is off by default. Naming 0.36 as the house level keeps the sky exactly as loud as it was, and
keeps the storm measurements taken for punch-list `#1` valid rather than obsolete on arrival.

**Rejected: letting the ambient default rise to 0.5.** It is the literal reading of "slider 1.0 = the
house level", and it would have handed every player a 2.9 dB louder sky on the same night the owner
called the storm overbearing.

**Rejected: `prefs.audio.{sfx,amb,music}.{level,muted}`.** The nested shape reads better and
backfills correctly *today*. `state.prefs` is re-merged over its defaults shallowly, so the day a
fourth channel is added an existing save's `audio` object replaces the default wholesale and the new
channel arrives `undefined` — the nested-object trap wearing a name that reads well. Six flat keys
cannot fall into it.

**`prefs.amb` is derived from the old prefs, not defaulted.** A player with `sfx: false` had
silenced the beds too, because until now that was the only way to. A flat `amb: true` would have
handed them a garden that starts making noise by itself. `load()` derives `amb` from `parsed.prefs.sfx`
for any save with no `amb` of its own.

**A slider at zero is not a mute, and this one is load-bearing.** `setMusic(false)` calls
`stopMusic()` because muting by bus gain alone left the scheduler building oscillator nodes every
3.2 s forever. `setLevel()` therefore only ever touches a gain — dragging music to zero leaves the
timer running, because the player is turning something down rather than switching it off, and a
channel that tore itself down at zero could not be dragged back up.

**Muting Ambience cancels the duck; turning it down does not.** `duck()` drops the effects filter to
950 Hz while rain stands. Before the split this question could not arise, because ambient-off meant
effects-off. The duck is the sky leaning on the effects, so a muted sky has nothing to lean with —
but a bed turned to zero is still a bed, and the effects still belong under it. `duck()` remembers
the caller's intent so `setAmb()` can re-apply it.

**The flower's hummed song stays on Ambience.** It is the one *tune* on that bus, so moving it to
Music is arguable — and wrong: music is off by default, and the Wonderfall's signature moment would
go silent for almost everyone. It is the garden singing at you, not a score.

**A range input is the first form control in the game**, and it stays a native `<input type=range>`.
The keyboard support and the slider role come free with the element; a slider rebuilt from divs
loses both and has to reproduce the `setPointerCapture` retarget by hand. It is restyled to the last
pseudo-element — the webkit track and thumb, the Firefox track, progress and thumb, none of which
inherits from another — because a system control in a hand-drawn garden reads as something that got
left in. `node tools/style-check.js --strict` reports zero violations on the new rules: every colour
is a token.

**Verified:** an old save with `{sfx:false, music:false}` loads as `amb:false`; one with
`{sfx:true, music:true}` loads as `amb:true`; a fresh save gets the flat defaults. Slider drags
write through to `Game.state.prefs`, `Sound.prefs` and the save file, and the mute drains its row
without moving the slider.

**Not in scope: the nature bed.** Birds, wind and rustling leaves are what the owner wants this
channel *for*, and they are new content with their own tuning. Ship the switch, let the owner sit in
a clear garden with it, then write the bed.

---

## 2026-08-31 — The menu is built, and the drawer is the third surface class

**The owner approved every one of the gate's six questions**, adding one condition: *"I imagine
things will change later, so this thing needs to be somewhat modular where we can move things in
and out."* So the menu is a table. `ROWS` at the top of `ui-menu.js` is the whole thing — an entry
is `{ id, icon, tint, label, note, open }`, a reserved slot is `soon: true`, and moving a row in or
out is one line. There is no mode map and no title map, because a drawer holds one list.

**A drawer is not a sheet, and the difference is load-bearing rather than pedantic.** The sheet
comes up, holds one panel chosen from a mode map, and is dismissed downward. This comes in from the
right, holds a menu, and is dismissed rightward. It borrows the sheet's scrim, its z-order and its
material; it differs in obeying the column by *offset* rather than by centring, in paying the full
top and bottom inset because it touches both screen edges, and in being a scrolling column of rows
rather than one panel.

**It is a sibling of `.ui`, and that decided the column bug.** A child of `.ui` would inherit the
560px cap for free — and would be painted over by the FX float layer at `z-index: 40`, so a coin
from a harvest would draw across the menu. Outside `.ui` it has to re-state the cap itself, which
is the rule [08-ui-and-layout.md](08-ui-and-layout.md) has carried since the meadow, and **it was
got wrong exactly as the trap predicts**: the first build pinned `right: 0` and looked perfect on a
phone while flying out to the corner of a desktop window. `right: max(0px, calc((100% - 560px)/2))`
is the fix — on a phone the offset is zero, on a laptop it is the gutter. Found by measuring
`getBoundingClientRect()` against `.ui`'s, not by looking.

**Two dismissals, not three, and the spike's note was corrected in place.** Drag the grip right past
90px, or tap the 58px strip of garden the drawer deliberately leaves visible. The third the spike
claimed — tap the hamburger again — **cannot happen**: an open drawer covers the button that opened
it, which `elementFromPoint` says plainly. The toggle stays wired because the button is still
focusable and Enter fires a click without hit-testing, but it is not a dismissal anyone will find.
That is why the visible strip is not negotiable: it is the second exit, not decoration.

**Nothing carries state in movement, so reduced motion needed no substitute — and that was checked
rather than assumed.** The badge dot is a solid disc in its base style, the scrim's dim is a plain
opacity, the rows never animate. What the block at the end of the file adds is honesty about the
arrival: the global clamp leaves 80ms of travel, which on a full-height panel is a flinch rather
than a calm entrance, so the drawer says `transition: none` for itself. The close path's 340ms wait
goes to zero with it, or an invisible scrim eats taps for a third of a second after an instant
close.

**The escaping ruling met its feature, and it held.** `state.profile.name` is the first
player-typed text this game has ever stored. The plan filed in
[11-known-issues.md](11-known-issues.md) on 2026-08-30 predicted a handful of sites rather than 908;
the real number is **two** — `paintName()`, which writes `.textContent` into a node the template
left empty, and the edit field's `.value`. No `esc()` was written. The engine sanitises rather than
escapes: short, single-line, never empty, capped at 16 *after* collapsing whitespace so padding
cannot spend the allowance. Storing `esc(name)` was re-priced and re-rejected — `&lt;` in a save
file is a promise every future reader has to keep, and it strands every existing save the day
anyone changes their mind.

**`tools/html-check.js` exists now, and the interesting part is that its first version was wrong.**
A template literal cannot be found with a regular expression, because the thing being looked for is
nesting. The first walker counted backticks as a single depth — and a nested backtick *opens* a
template rather than closing one, so a planted `${a ? `<span title="${S.profile.name}">` : ''}`
read as a closed span and passed without a word. It keeps a mode stack now, with a brace counter
per expression so an object literal cannot end one, and it was re-broken four ways before being
believed. The general lesson is the one this file already records about vacuous tests, arriving
from a new direction: **a check that has never gone red is not a check.**

**Your garden is your face — no uploads, no photographs, ever.** Every portrait is drawn by the game
from something the player earned: an unlocked bloom through `Flora.head`, a creature that has moved
in through `Critters.draw`, stored as an id rather than as a drawing. It costs no backend, no
moderation and no storage, and it turns the picker into a second collection screen. An unlocked-yet
bloom is drained and padlocked rather than hidden — the locked seed row's rule on a new surface,
because the cell is an advert for the flower you are saving for. Two groups rather than one grid:
blooms and creatures are different kinds of thing and a single grid reads as a bag of stickers.

**A Turn must not touch identity, and the suite says so before anyone can forget.** `profile` went
into `defaultState()` and the partition's completeness check went red on the next run, which is
exactly what it is for. It is classified `SURVIVES`, and the rig writes a non-default name *and* a
non-default avatar so the assertion cannot pass on a value that equals its own default. The Settings
reset is a different thing and does clear it — that path is an explicit, twice-confirmed erasure of
the whole save.

**One token, no new colour, and the distinct-hex set is byte-identical to the commit before it.**
`--dot` names the attention red the day it got a second home; the drawer itself reuses `.seed-row`'s
card, `.seed-art`'s veil, `.seed-row.locked`'s drained family and `.seed-lock.no`'s `#f6f2ea`. The
style check still went red, because it counts *occurrences* and a new component that correctly
reuses the recipe still adds them — which is the one thing that ratchet cannot tell apart from
drift. **Diffing the distinct set against `HEAD` is the check that actually answers docs/05's fifth
question**, and it is worth running before any re-baseline. It caught two real violations on the way:
a hex fallback inside `var()` (twice), and a drained ink invented for the reserved rows when the
locked seed row already proves the drained *surface* is enough.

**A wide row does not take the plot's blemishes.** `.dr-row` shipped with the full five-layer recipe
and drew a 39px grey blob across every row, because those radials are sized in percentages of the
box and a 9% dirt mark is a speck on a 100px plot and a bruise on a 300px row. That is the scale
trap — the meadow's oversized stones — written in CSS. Every wide card in this game is a two-stop
gradient, and now this one is too.

**Six icons in one commit, which is a lot and was still right.** `menu`, `chevron`, `pencil`,
`bell`, `people`, `scroll`. Each is generic interface vocabulary the set genuinely lacked, because
until now this game had nothing to navigate, nothing to edit and no slot to reserve. `menu` is drawn
at stroke 3.4 rather than the set's 2: beside the gear's solid grey body a 2-unit bar is a hairline
at 24px, and this is the button the whole menu is found through. `tools/export-icons.js` was taught
to scan `icon:` rows in `ui-*.js` as well as `data.js` at the same time — the menu is the first
table of icons that does not live in `data.js`, and without it four live glyphs reported as orphans
in the manifest the Unity team reads.

**Rejected: a close button in the drawer's header.** It would be a fourth control beside the avatar,
the name and the pencil, and the two dismissals that exist are the ones every drawer of this shape
has. **Rejected: putting the avatar and name in the HUD** — the owner's call at the gate, and the
right one; the HUD has just bought its 44px tap targets back by losing two elements. **Rejected:
a count on the badge dot** — one announcement is one thing to look at, and it becomes worth asking
again the day two rows can badge at once.

---

## 2026-08-31 (design) — The daily changelog: the What's New popup's little sibling

**The owner's ask:** when a player opens the game and there are new features since they last
looked, show a simple popup — same house styling as the What's New popup, no art required, no
reset ever — listing what changed, in plain words. "Got it" and gone.

**The spec, small on purpose:**
- Entries are data: `DATA.changelog = [{ date, lines: [...] }]` — one entry per shipped batch,
  each line a plain-glossary sentence a player understands ("The sky sounds like rain now").
- The popup shows only when entries exist that this player has not seen, at most once per day,
  batching everything unseen into one list. A brand-new player never sees it — their first
  changelog is the game itself; the seen-marker initialises to now on first run.
- **Never two popups:** if a What's New announcement is pending, it wins and the changelog waits
  for the next open.
- The seen-marker lives beside the announcement flags, outside the save, surviving resets and
  Turns alike.
- Reuses `ui-news.js`'s pattern and styling — the "exactly like our other popup" ask taken
  literally.

**And the rule that keeps it alive:** AGENTS.md's definition of done gains a line — a change a
player can see adds a changelog entry, one plain sentence, same commit. The first entry is a
backfill of the recent run: the seasons, the skies, the Big Five, the menu.

**Build home:** the upcoming fix round (it is a contained feature beside eight investigated
fixes), sequenced after the hamburger menu lands.

---

## 2026-08-31 (gate) — The hamburger menu, drawn before it is built

**The owner's reference is Monopoly Go's slide-out menu, and what is being borrowed is its
LAYOUT.** A panel off the right edge, a round face and a name at the top, then a clean column of
feature rows with icons and the odd red dot. `tools/menu-spike.html` draws that shape in this
house's paper, ink and opaque lip, at 390x844 with a real handset's insets on, static and with no
game files loaded — the same terms as `dock-spike.html` and for the same reason: a spike that
imports the game breaks when the game moves, and a layout judged at the wrong proportions is not
judged at all.

**The drawer is a new SURFACE CLASS, and calling it a sheet would be the mistake.** The bottom
sheet comes up, holds one panel and is dismissed downward; this comes in from the right, holds a
menu and is dismissed rightward. It shares the sheet's scrim, its z-order and its material, and it
differs in three ways that matter: it is `min(86%, 332px)` pinned right so it obeys the 560px
column, it pays the **full** top and bottom safe-area inset because it touches both screen edges
(the dock's `--bottom-gap` shortcut is wrong for a panel that reaches the bottom), and it is a
scrolling column of rows rather than one panel, so a row may never depend on the drawer's height.

**The strip of garden down the left is deliberate and it is 58px of design, not slack.**
Full-bleed makes this a screen; leaving the garden visible makes it a drawer over the game you are
still standing in — and it is what makes the scrim tap discoverable at all.

**The gear becomes the hamburger, and Settings becomes a row inside.** A gear promises one panel;
the menu holds seven things, so the glyph had to change or the button would be lying. Nothing the
gear reached is lost — every one of its six controls is one tap deeper. The button keeps its
44px target and its place, and nothing else in the HUD moves: the wallets, the Almanac book and
the whole dock are untouched.

**The badge dot is the dock's attention dot, on a HUD button for the first time.** Same red disc,
same ink contour, same opaque lip. It lights when the newest announcement has not been seen. It is
deliberately **not** a count: one announcement is one thing to look at, and a "1" on a badge is a
number nobody needs. That question is worth reopening the day two rows can badge at once.

**Three reserved rows, capped at three, in the drained not-now treatment.** Friends is the slot
[15-navigation-and-ia.md](15-navigation-and-ia.md) has protected since 2026-08-25 — it is a
backend, not a button. Daily Gift and Garden Record are the owner's. They wear the same
`--paper-dim` family the locked seed row and the locked season tab wear, they restate their own
lip, they are marked *Soon* and they cannot be pressed. **The cap is the honesty:** past three, a
menu is advertising more game than exists.

**Your garden is your face — no uploads, no photos, ever.** The avatar picker is generated from
what the player owns: unlocked blooms through `Flora.head`, then creatures they have met. It costs
no backend, no moderation and no storage, and it turns the picker into a second collection screen
rather than a settings field. Two groups rather than one grid, because blooms and creatures are
different kinds of thing and a single grid reads as a bag of stickers. An unlocked-yet bloom is
drained and padlocked rather than hidden, exactly as the locked seed row is — the cell is an
advert for the flower you are saving for.

**What was asked and not decided.** Whether the avatar and name should also appear in the HUD —
the spec says menu only, and the spike agrees: the HUD has just bought its 44px tap targets back
by losing two elements, and a face there spends that win. Whether 332px is the right width.
Whether the Almanac having two doors (the HUD book and the menu row) is right. Whether a creature
you have met but never housed should be pickable. All four are on the frames.

**Nothing is built yet.** No state field, no icon, no CSS in `style.css`. The gate is the point:
`dock-spike.html` found three functions the phase-3.5 spec had forgotten, and it found them
because it was drawn first.

---

## 2026-08-31 (docs) — The Unity team gets pictures and an asset list, and both are commands rather than snapshots

**Two Unity engineers can now read the design, but they had never seen the game.** The wiki
mirror gave them every word and not one picture, and nothing anywhere said what art exists.
[44-screens.md](44-screens.md) is the game photographed screen by screen;
[45-asset-inventory.md](45-asset-inventory.md) is every visual asset, what draws it, and how
many variants it has. Both are for people who will rebuild this in another engine, not for us.

**The tool is the deliverable and the output is only its latest run.** A gallery of screenshots
pasted in by hand is out of date the week after it is made, and worse, nobody can tell which
picture went stale. So `tools/capture-screens.js` drives the real build headlessly through
twenty-six states and writes both the PNGs *and the page that indexes them* from one scene
table; `tools/export-icons.js` writes every icon in the registry as an `.svg` and rewrites its
own manifest table. Regenerating is one command each. Nothing in either document is hand-made,
and both say so at the top, because a generated page that looks authored is a page somebody
will eventually edit.

**A screen is DRIVEN to its state and photographed second, and the run asserts the state before
the shutter.** This is the whole reason the gallery is trustworthy. A screenshot taken in the
wrong state is silent — it exits zero and it looks completely plausible — so every scene names
what must be true at the moment of capture and the run stops if it is not. That guard has
already paid for itself twice: two scenes failed on the first full run, and both were wrong
assertions rather than wrong recipes, which is exactly the failure a green run would have
hidden. A failed scene also refuses to rewrite the page, because a gallery that is 24/26 correct
is worse than one that will not build.

**Three things had to be pinned or the gallery would differ on every run**, and none of them was
obvious until the pictures came out wrong. The **announcement** goes up over a fresh boot, so it
was in front of every screenshot until it was marked read once for the whole run — and it still
gets its own picture, through `UI.previewAnnouncement()`, which shows it without resetting the
save. The **sky** is a hash of epoch time, so roughly a third of runs boot into rain or a storm;
asking for clear does not undo that in the same frame, because ending a sky is an eight-second
sequence that hands over to a thirty-second sunbreak in daylight. The run now waits for the
layers to report clear rather than guessing a delay. And the **day/night cycle** is six minutes
long, so an unpinned gallery is a blue garden, an orange one two scenes later and a purple dusk
for whatever ran at the wrong moment. It is pinned through `DAY.offset` rather than by stubbing
`Game.dayPhase`, because `offset` is the knob both readers go through — stubbing the getter
would pin the picture and leave `Game.isNight()` still thinking it was midnight, which is how
you get a moonlit Hollow behind a midday garden.

**`docs/screens/` is the third binary exception, and the first that is not in the game at all.**
Recorded in [09-conventions.md](09-conventions.md) beside the other two. A screenshot cannot be
SVG, so the rule had to bend; what keeps it narrow is that nothing in the game loads these,
they are generated rather than dropped in, and the tool refuses to finish if one lands over
300KB. That ceiling is load-bearing rather than tidy: these are regenerated often and every run
is a new blob in git history forever. Chrome's own PNGs run 500–900KB at 2×, so the tool
quantises each one to an adaptive palette — flat art with thick outlines is visually
indistinguishable at 256 colours and about a quarter of the bytes. Dithering was measured and
deliberately not used: it costs more than the extra colours buy and makes flat art look noisy.

**The icon exporter reaches the registry by running the module, not by parsing it**, and the
assertion that the file count equals the registry count is the point of the script. `icons.js`
builds `LIB` in two parts — an object literal and a later `Object.assign` — which is exactly the
shape a regex loses half of, and an icon that is never exported is invisible: the directory
looks complete, the manifest looks complete, and one glyph is quietly missing from everything
the Unity team builds. All three guards were tested by breaking them. The manifest's "used by"
column is scanned rather than written, because an icon is asked for in four different shapes and
one of them — `Icons.get(d.icon)` fed by a data row — names no icon at the call site at all.

**Six representative `.svg` samples ship beside the icons, and each needed a stated fix.** None
of the art classes is quite standalone: `flora.js` keeps its gradients in a hidden `<svg>` that
`injectDefs()` appends to the page, so raw exports paint as hollow outlines; `critters.js` and
`customers.js` draw every state at once and let CSS choose one; the Talking Flower's eyelids are
full-height rectangles that CSS collapses, so it exports asleep. Each fix lives **inside** the
file, and the flora one runs the game's own `injectDefs()` against a DOM stub rather than
restating the gradients — a hand-written copy of a palette is a copy that drifts. The two big
backdrops are exportable and deliberately have no sample, because they compose against a
measured screen size and any file would be one arbitrary window; the inventory gives the recipe
instead. **Rejected: exporting everything.** A class earns a file when it draws to a fixed
viewBox, and forcing the rest would have produced assets that are wrong in a way nobody notices.

**Three findings the inventory turned up, recorded here because they are design facts rather
than defects.** Decor is bought, counted and **never drawn in the world** — `state.decor` is read
by exactly one function, the shop card's "Owned ×N" caption. The card album has 108 named slots
and **no real card art**, filled today by nine placeholder motifs cycled by index, so every set's
card #1 is the same sprout on the same green disc. And the `flask` icon is drawn by no code in
the game at all. None of these is broken; all three are things a Unity estimate would otherwise
get wrong.

---

## 2026-08-31 (process) — The owner's play gets a queue of its own, and its keeper never fixes anything

**The owner plays the live build and notices things, and until now those went into a conversation
and then nowhere.** [43-punch-list.md](43-punch-list.md) is the queue they land in: numbered on
arrival, investigated to the point where a fix agent starts warm — file and line, engine or display,
what the fix might break — and ordered for the night's fix round.

**The keeper of that file tracks and never fixes.** That is the whole point of the split. An agent
that can fix what it finds stops looking the moment it finds something, and the second bug in the
same area is never reported; an agent that cannot fix anything keeps reading. It also keeps the
owner's reporting cheap: they say what they saw in one line and get one line back, because the
investigation goes in the file rather than into the chat. The file is the only thing it writes.

**Two files, two lifetimes.** The punch list is the day's working queue and is meant to empty — a
fixed item is pruned to a one-line graveyard with the commit that fixed it, so nothing is
re-reported. [11-known-issues.md](11-known-issues.md) stays the permanent record, and anything that
turns out to be a decision, an acceptance or a deferral rather than a defect graduates there and
leaves the queue. Without that rule the punch list becomes a second known-issues file that nobody
prunes, which is the failure mode a daily queue has.

---

## 2026-08-31 (project) — The docs get a wiki mirror, and 755 links had to lose their `.md`

**Two Unity engineers now need to read this folder, and neither of them should have to clone it to
do that.** They are porting the game, not editing the design: what they want is a link they can open
on a second monitor, search, and send to each other — not a git checkout, a markdown viewer and a
merge conflict waiting to happen. `tools/wiki-sync.js` mirrors `docs/*.md` to the project's wiki at
<https://github.com/Deep-Forest-Labs/GardenofWonder/wiki>, which is the cheapest reading surface
GitHub gives us: it already exists, it renders our markdown the way GitHub renders it everywhere
else, it has search, and it needs no hosting decision.

**`docs/` is the source of truth forever; the wiki is generated and overwritten.** Every run
replaces the wiki wholesale — each page is deleted and rewritten — so the mirror cannot quietly
become a second copy somebody maintains, and a renamed document leaves no ghost page behind.
Nothing there is authored, nothing is merged back, and a page is only ever as true as the last sync.
A generated `_Footer.md` says so on every page. The sync is the **last** step of the definition of
done, after the handoff, for the same reason the handoff is last: it is derived, so it runs on docs
that are already true rather than on memory.

**The one real engineering problem is that a wiki URL carries no extension.** A page committed as
`03-systems.md` is served at `/wiki/03-systems`, so `[03-systems.md](03-systems.md)` — the form used
everywhere in this folder — would resolve to `/wiki/03-systems.md` and 404. That is **755 links**,
154 of them carrying an anchor that has to survive the rewrite, and one written with a `./` prefix.
Sixteen more leave `docs/` altogether — `../AGENTS.md#definition-of-done`, `../sw.js`,
`../tools/order-gold.js` and friends — and a wiki is a *different repository*, so on the mirror
those have no target at all; they are rewritten to absolute `github.com` URLs, or to the live
GitHub Pages copy where the thing is better run than read (the spikes, and the playable `legacy/`
build). Everything else the tool does is a file copy. **The link text is never touched** — 753 of
the 755 links carry `.md` in the words the reader sees, and in most of them the visible text is
character-identical to the target, so a rewrite that is not anchored on the `](...)` parentheses
edits the prose instead of the URL. The words ship exactly as written.

**The failure mode is why this ends in a check rather than a careful regex.** A link form the
rewriter misses does not throw and does not look wrong: it renders an ordinary page with one dead
link, and the only person who ever finds out is the engineer the mirror was built for. Worse, a
GitHub wiki does not 404 a missing page — it redirects to the wiki's Home and answers **HTTP 200**,
so a link checker that trusts status codes reports a clean wiki while every dead target hides. So
the sync resolves every link it rewrites against the set of pages it is about to write, and refuses
to push if one dangles — the argument `tools/style-check.js` was built on, that a rule nobody
notices breaking is not a rule. It also reports the three anchors in this folder that were already
stale before any of this (in `03-systems.md`, `10-decision-log.md` and `27-design-audit.md`) rather
than repairing them silently; they are the docs' bug to fix, not the mirror's.

**`docs/legacy/` is not mirrored, and that is not a softening of the keep-everything policy.** Those
are the *Idle Garden Reborn* documents; they are kept permanently, and this folder's README already
says plainly that they are wrong about the current game. But a wiki is one flat list of pages, so
mirroring them drops a document describing a different build into the sidebar beside `03-systems`
with nothing around it to say so — for a reader whose only context *is* that sidebar, that is a trap
rather than an archive. The repository is the archive; the mirror is a reading surface, and it
carries only what an engineer should build from. `docs/feedback.md` is skipped too, for the duller
reason that it is empty and gitignored.

**The wiki's Home is not this folder's README.** It is generated: the same documents, reordered for
someone who has to build the thing — start here, then what the Unity build needs, then the build
plan and open work, then design history, then the playable spikes at their live URLs. `README.md` is
still mirrored as its own page, unchanged: the links that point at this folder's own index still
resolve, and the reordering is a reading aid, not a correction.

**This is the plain working mirror, and deliberately not the styled one.** The 2026-08-30 entry
[*Everything is kept, and the bible will one day be published*](#2026-08-30-project--everything-is-kept-and-the-bible-will-one-day-be-published)
records the standing intent: the whole corpus is kept and eventually published as a styled public
record of how much work went into the game. That is a different artifact for a different audience
and it is still a future phase. What this round does is cash that entry's central claim — that the
corpus is consistent, cross-linked markdown, so a wiki is cheap to generate whenever the moment
comes. It was cheap. The link rewriting was the entire bill, and it is now paid and written down.

### Rejected

**Hand-copying the pages into the wiki.** Forty-six documents and 27,242 lines, touched on twenty of
the last thirty days — a copy made by hand is accurate the day it is made and wrong within the week.
The cost is not the typing, it is that the staleness is invisible: nothing on a stale page says it
is stale, so the engineer builds from it and finds out in code. Anything the definition of done
cannot reach with one command does not stay true.

**Letting the engineers edit the wiki and merging their changes back.** A GitHub wiki is a git
repository, so this is nearly free to build, and that is the trap. It creates a second place where
the design can change — with no review, no decision log, and no way for a correction to arrive with
its reasoning attached, which is the one thing this file exists to carry. An engineer who finds
something wrong sends it back to `docs/`, where the fix gets an entry. The wholesale overwrite is
what enforces it: wiki edits do not count *and* do not survive, so nobody has to remember the policy.

**Building the styled showcase wiki now.** Different audience, different job — design, navigation
and an edit for a reader who is not on the team, none of which two engineers reading a spec need.
Doing it now would have put a working-day tool behind a marketing artifact, and would have had to
guess at a public shape nobody has decided. The mirror is due this week; the showcase keeps its own
moment.

---

## 2026-08-31 (phase 3.9) — The Sky Pass ships, and one property at a time is how it nearly did not

**The owner approved all five skies on the motion stage and handed back their tuned values, so
`DATA.weatherStage` is those numbers verbatim.** The gate worked exactly as intended: nothing was
argued about after the fact, because the feel had already been agreed. The one note that came back
— *the sun rays just hang in one spot* — was correct, and it was correct because the drift was 24px
over 76 seconds on `alternate`, so each shaft rocked in place. Rebuilt on two clocks: a slow linear
sweep off one edge to the other, and a separate, shorter fade with per-ray offsets. Two clocks is
what stops three rays reading as one object sliding sideways, and running the sweep off both edges
is what makes the loop point invisible without needing the fade to hide it. `sunbreak.phase` is the
knob for how much of the coming and going you see.

**Rain waters through two code paths, because growth is baked in at plant time here.** A factor in
`plantGrowth()` for anything sown while it rains, and a one-shot shave of what is left for
everything already in the ground when the sky turns — the Keeper's own pair, which the conventions
playbook already demanded of any growth effect. Neither pays the other's plants. **`passiveIncomeRate()`
deliberately excludes it:** a sixty-second sky must not set the rate for a twenty-four-hour absence,
and letting it would have quietly made *closing the app during a shower* worth money — an incentive
nobody asked for and the exact opposite of cosy.

**The mutation share did not move**, which was the invariant to protect: `rainGrowth` touches
growth, not catches.

### What the build discovered, and why it is worth writing down

**A `z-index` on the weather layer silently killed every blend inside it.** A stacking context is an
isolated blending group, so the wash, the dusk, the ribbons and the veil all composited against
transparency instead of against the sky. Nothing errored. It *looked* plausible — a flat haze rather
than light — for long enough to be screenshotted and approved by eye. It is a new entry in the
handoff's traps because the class of bug is general: any future layer that blends with the scene has
the same constraint, and `isolation: isolate` is the same bug spelled differently.

**A `filter` cannot carry a mask, and two of them owned the bottom edge.** The lawn's wetness and
Wonderfall's breathing saturation both reached the strip iOS paints below a short window — the join
three rounds of layout work went into hiding. The lawn's wetness moved onto the masked multiply that
exists for exactly that, and the saturation moved off `.scenery` onto the layers above the lawn.

**`transform`, `filter` and `animation` are each one property, and this pass stepped on all three.**
The storm's crouch deleted the transform that centres a creature on its anchor, so every pet jumped
half its own width sideways. The glisten deleted a mutated bloom's glow — the single visual the
whole mutation mechanic rests on, gone for the duration of every shower. And both plant hooks
replaced the ripe wiggle, so a ready flower stopped inviting the tap for a quarter of all slots.
None of the three threw, none showed up in a passing suite, and two of them were in screenshots
nobody had questioned. The recorded trap said `box-shadow`; the lesson is the property list, not the
property.

**The slot tick had been announcing the slot's own weather over a bought sky since weather shipped.**
`processWeather()` emitted `weatherForSlot(slot)` where everything else asks `weatherAt(now)`, so a
four-minute called rain stopped raining every sixty seconds. Invisible while a sky was one tint;
with a sky that is a sequence it aborts an arrival mid-flight. Found by driving a dev hold and
watching the aurora restart.

**The suite's clock was seeded from the real wall clock**, and weather is a pure function of that
clock, and weather now decides how fast things grow. So three assertions passed or failed depending
on what the sky happened to be doing while the suite ran — the flakiest kind of test and the
hardest to diagnose, and it was proved by watching the failure count change from 3 to 2 to 3 with
no code change at all. The clock is pinned to a fixed epoch whose slot and the two after it are
Clear, in daylight.

### Rejected

**Letting the momentary sky into offline income** — see above; it is the one place a transient
becomes a strategy. **A retro shave that fires on page load** — reproduced paying the same plant
again on every reload, so the retro half fires only on a false→true transition the running game
actually saw, and a rain that began while the tab was shut is simply missed. **Keeping the old flat
weather tint alongside the new wash** — two tints over one sky darkened every sky twice, and the
wash is the better object: a gradient, phased with the front, masked at the bottom, and foldable
into `theme-color`. **The drawn stand-in leaf** — it could never be drawn, because the stylesheet
hides it on sight of a talking flower and the garden always has one; the flower's own leaf had been
doing the job all along. **Patching the three flaky assertions individually** — the flakiness was
structural and a patch would have left the next growth assertion to find it again.

---

## 2026-08-30 (overnight housekeeping) — The style guide becomes a check, and a rename that was not authorised

**`tools/style-check.js` exists because a rule nobody notices breaking is not a rule.** The
2026-08-26 Garden Standard audit found that every item it counted was already agreed with. Doc 11
put it exactly: *"The rules did not fail because anyone disagreed with them. They failed because
nothing noticed."* Four of doc 05's rules are properties of a text file, and this checks them.

**Rejected: a check that fails on the existing debt.** It is the obvious design and it is why this
kind of tool does not survive. Run strictly it opens on 402 raw hexes, so every task after it starts
with a red gate that has nothing to do with that task — and the fix everyone reaches for is to stop
running it. `tools/style-check.json` records the counts as found and the check fails only when a
change *adds* to them. Raising the baseline is deliberate and takes a flag.

**Rejected: the literal reading of the lip rule.** Doc 05 says "a `box-shadow` with a zero blur and
an `rgba()` colour is always the bug", and implemented literally that fires 18 times — 16 of them on
rarity rings, pressed states and the aura ladder, all of which doc 05 blesses in other paragraphs.
The rule doc 05 *means* is the one its checklist tells you to grep for: `0 3px 0 rgba(`, a shadow
with a **vertical offset** and no blur. Tightened to that it fires twice and both are real. A gate
that cries wolf is a gate someone turns off, so precision beat recall.

**Rejected: swapping every hex that equals a token.** That was the brief, and it is wrong in about a
third of cases. `#ffd43b` equals `--legend`, but on `.hollow-gift` and `.plot .bar i` it is a gold
that merely *happens* to be the rarity colour — writing `var(--legend)` there states something false
and drags those components along the next time rarity gold is retuned. On `.fl-plot.century` it
would have been worse: doc 05 says the Century Bloom is "deliberately outside every existing family,
because it is an exception", so tokenising it to `--epic` would have silently cancelled a documented
decision. The rule used instead: **replace only where the token's name matches the site's evident
meaning.** 32 substitutions, including all 25 raw `#2c1a10`.

**The bars use `--fill`, not the album's `--p`.** `--p` already means a unitless ratio on
`.q-pip-wrap` one line above the quest bar, and a percentage in `.turn-fill::before` and the album.
They are siblings today, so nothing inherits across and `--p` would work. It was rejected anyway
because of how that collision fails: `calc(100% - 0.44)` is invalid, an invalid `clip-path` paints
the **whole** element, and a progress meter whose failure mode is reading 100% is the wrong failure
mode to leave lying around. `.mastery-bar b` was left untouched — it is emitted by nothing, and
giving dead code a `--fill` contract nothing satisfies hands its reviver an empty bar and no clue.

**Not done: the "Garden Mastery" rename, because the premise was false.** The round was told the
rename was "already implied by the glossary". The glossary in doc 32 has sixteen entries and names
none of these things. Checking further, the issue itself is stale: "Bloom Mastery" is in zero
player-facing strings, `recordHarvest()` returns `mastery: []` so the "Tier N" toast cannot fire,
and the petal tracks replaced the mastery goal line — so the collision the issue describes is
unreachable. One heading remains, and whether it is still a problem is now the question, not what to
rename it to. Panel copy stayed the owner's call, which is where doc 11 had already put it.

**The undeclared-variable check is split by fallback, and testing found it rather than reasoning.**
The tool was pointed at the in-flight Sky Pass CSS — code it had never seen — and reported 26
undeclared custom properties. Every one was a `--wx-*` weather knob written with a fallback, waiting
for a `DATA.weatherStage` that phase 3.9 has deliberately not built yet. They are correct. A gate
that fails on them is a gate that fires on work in progress, which is the same "cries wolf" failure
the baseline exists to avoid, and it would have landed on another session's desk as a false alarm.
So `var(--x)` with no fallback — which drops the declaration and paints nothing — fails at a
baseline of **zero**, and `var(--x, 12px)` is reported and does not. The one that is silent is the
one that is fatal.

**`Icons.get()` warns once per missing name, and only where a developer is looking.** The suite
asserts every icon a data table names, but both icons that went missing for a whole session were
named at hand-written call sites, which no table covers. The gate is `location.hostname` —
`localhost`, `127.0.0.1` or `''` for `file://`, the same test `index.html` uses to skip the service
worker. Rejected: a `?dev=1` URL flag (invisible unless you already suspect something), a
`const DEV = true` edit-before-release (a release step nobody performs), and `Game.Dev` (icons.js
knows nothing about the game and doc 09 says to keep it that way). Worth recording that **the suite
cannot test this** — Node has no `location`, and probe.js drops every console message that is not an
error — so it was proved by driving a real browser on 127.0.0.1 and capturing `console.warn`.

**`harvestsThisSession` is renamed, not reset, and the difference is the whole point.** doc 11 filed
this as "a naming problem" and it was right: the field counts lifetime harvests toward a repeating
+1 reputation drip, it is only ever read modulo 10, and progress surviving a reload is what a player
would want. **Actually making it per-session is a behaviour change and was not made** — that is the
owner's call, and nobody asked for it. It is now `harvestsTowardRep`, which is what it does.

**The rename is only behaviour-preserving because it ships with a `load()` fixup.** The field is in
the save, and `load()` is `Object.assign(state, defaultState(), parsed)` — which copies unknown keys
in and never removes them. A bare rename would have cost every existing player up to nine harvests of
progress and left the dead key riding along in `state` forever, silently. The fixup is in the shape
of the existing `plot1Gardener` one, including the `delete`, and it sits in the fixup cluster rather
than lower down `load()`, because the `catch` further on re-assigns defaults without deleting.
Proven load-bearing rather than assumed: removing it turns the suite red in three places, one of them
the pre-existing save-partition check, which names the stray key.

`legacy/main.js` still writes the old name and was deliberately not touched — real `igr-save`
payloads in players' browsers were written by that code, and the same fixup migrates them for free.

**The focus ring is an `outline`, and that is the whole decision.** A ring is the natural job for
`box-shadow` in this codebase — every surface already composes one — and that is exactly why it
could not be used. `box-shadow` is one property, so a focus ring written that way deletes the lip of
whatever it lands on, and a rule on bare `button` lands on all of them at once. It is the
state-modifier trap doc 05 records, arriving everywhere simultaneously instead of one component at a
time. `outline` is a separate property, follows the border radius on its own, and cannot reach the
stack; confirmed by reading `boxShadow` on a focused dock button and seeing its 5px lip intact.
`:focus-visible` rather than `:focus` because this is played with a thumb.

Three `aria-label`s went in beside it — the Fall room's talking flower, which the garden and the
meadow both already label, and the two settings toggles, whose visible siblings read "Sound effects"
and "Ambient music". Nothing ambiguous was guessed: the plot buttons' names depend on plot state and
are left for whoever does that properly.

**Not done: the creature arrival bar, and the reason is not the one expected.** The search was for a
display-only fix that avoided the design change. There is none, because the display fix is already
there — `ui-sheet.js` clamps that line in three places, and the clamp is what produces "24 / 24 Rose
to ★2". The panel renders faithfully; the *state* is impossible, because `level` and `discovered`
are independent and the bar exists to show their relationship. A second clamp moves the lie rather
than removing it.

---

## 2026-08-30 (phase 3.9, the motion gate) — The stage goes up, and six knobs the spec did not name

**`tools/sky-spike.html` is built and nothing has integrated**, which is the whole point of the
gate. Six buttons, each playing a sky's entire shape — front, transform, linger, end — on the
garden at 390×844 with a real handset's insets, thirty-six sliders, a block that prints the current
state as the exact `DATA.weatherStage` object, and a reduced-motion toggle. The owner tunes; the
builder transcribes.

**The stage loads the game's own modules rather than mocking them.** `data.js`, `flora.js`,
`critters.js` and `audio.js` are all DOM-light and know nothing about the game, so the plants, the
flower, the creatures and every one-shot sound on the stage are the real ones. A sky approved
against invented art would have to be approved twice.

**Three divergences, chosen and written down** rather than discovered later: the particle canvas
is frame-local where `fx.js` sizes to the window; the beds own their own `AudioContext`, because
`Sound` exports no context and no bus and cannot be re-instrumented from outside; and reduced motion
is a toggle rather than a media query, because the owner has to be able to see the quiet version on
demand. The bed module is written in the shape it will take *inside* `audio.js`, so the build is a
transcription.

**Six knobs joined the spec's list**, all in the copyable block: `rain.wash` and `storm.wash` (the
sky's own depth, which turned out to be a different decision from the wet ground), `aurora.rimGlow`,
`aurora.starBoost`, `wonderfall.bobPeriod` (so "bob in rhythm" can be put on the 3.2s bar) and a
stage-only `stageHoldSeconds` that never reaches `data.js`. A value the feel depends on and cannot
be reached is a value that gets guessed.

**Two things the stage makes visible on purpose.** The flash ceiling is enforced *on the stage* and
reports its refusals, so winding the gap slider to 0.2s teaches the owner what the ceiling is rather
than silently ignoring them. And the strip above the frame is painted from the same value the game
writes into `theme-color`, computed from the weather layers themselves, with a toggle to switch the
join off — the notch desync doc 08 spent four rounds on is now something to look at rather than
something to remember.

**Building it found one real bug in its own design.** The sunbreak first keyed "is it daytime" off
`data-night`, which was the aurora's dusk flag — so at midnight the sun broke through. `data-night`
now means *the sky is dark*, with two writers (the hour, and an aurora bending the light rules), and
the aurora hands the flag back to the hour on its way out instead of hardcoding it off.

### Rejected

**Letting the sequences speak a spike-only vocabulary** through an adapter — they were rewritten to
call the real bed API instead, because a sequence is the thing that gets transcribed into the game
and a shim only a spike understands is a trap for whoever does that. **A speed control on the
stage** — a sky played at 2× is not the sky being judged; the phase strip re-enters a phase instead,
and the button still plays the whole sequence. **Adding a visual hook for the singing flower** — the
mouth is already on the bar in CSS, so a second class would have been dead markup dressed as a
feature.

---

## 2026-08-30 (phase 3.8) — The polish round: seven rulings, and one of them re-ruled at the door

**All seven came from the owner playing the live build**; the spec is the "rulings, polish" entry
further down. Six landed as written. The fourth was re-ruled mid-build, and that one is the entry
worth reading.

### 1 · The Turn button had a dead meter under its breath

The ruling was a shine. Building it found that **the dock's year meter had never once painted**:
`ui.js` wrote a `height` onto `.turn-fill`, which is only the clip box and is pinned `inset:0`, so
the box shrank from the top while the waterline underneath stayed at `0%`. Two commits a day apart
each did half of one design. Fixed here, because a glint on a broken surface is polish over a hole.

The glint is **the ready plot's own `sweep`** — same 100° band, same 8° tilt — parked off the button
for seven eighths of a nine-second cycle so it lands as a moment rather than as the constant travel a
plot can afford at 1.9s. Gold, not the plot's white, because gold is already the only thing on this
button that means *the Turn is ready*. Interval in `DATA.year.turnShineEvery`.

**Reduced motion was a repair, not an addition.** The breath is an animation; the global clamp runs
it once for `.001ms` and drops it; and the attention dot is suppressed on the assumption that the
button is breathing. **A player with the preference on had no ready signal on the Turn button at
all**, and it reviewed as correct for weeks. The general lesson is now in doc 05: *a collapsed
animation must never be the only carrier of a state* — where a state animates, reduced motion needs a
static substitute, not a shorter duration.

*Rejected:* driving the glint from a JS timer. CSS says "park, then cross" in one animation, and this
project already refuses recurring timers outside the frame loop.

### 2 · The word, and the faucets

One player-facing "Badges" survived, in the Turn's ask. The icon id, the four `*-badge` classes and
the tools' model fields keep their names — renaming those blanks glyphs and empties panels with no
error.

**The faucet audit found nothing farmable, and that is the finding.** Quests, the level ladder and
the Almanac are keyed on `quests`, `rep`, `level`, `discovered` and `almanacClaimed`, every one of
which the Turn leaves verbatim. So the work is not a fix, it is a **tripwire**: `bill 1c` seeds each
faucet as already-paid, runs a real Turn, and asserts the re-earn is refused. Sabotaging `turnYear()`
to clear `quests.done`, to roll the daily, and typo'ing two booster ids fails ten assertions by name.

**The distribution is a curve, not a number.** A new garden opens with four power-ups in the tray,
the third and fourth quests a player finishes pay two each, and every level from 2 to 8 pays a rung —
about 54 minutes of cover inside the first days, on top of the bag's 11½. Levels 10, 12 and 15 pay one
each and then the level faucet is finished and quests, the Almanac and the Stand carry it.

**The short boosters are front-loaded on purpose.** A boost already running cannot be refreshed, so a
bag of half-hour auras is a bag the first session cannot spend. Worth knowing for phase 4: two Fortune
Auras are 41 of those 54 minutes, and rarity odds are the one effect a beginner cannot *see* — the
cover they feel is the 30-second pair, and `n` is the knob for it.

*Rejected:* a `startedAt` timestamp to scope "the first few days". A save has no creation time, and
seeding one in `defaultState()` would stamp every existing player as brand new on their next load.
Reputation is monotonic, survives the Turn, and is already the shape `levelGrants` uses — so the curve
is unfarmable **by construction** rather than by a guard.

*Also:* `giveOpeningBag()` is deliberately **not** part of `defaultState()`, because that object is
the backfill source for every save ever written and a bag declared there would be handed to any old
save predating `boostInv`.

### 3 · A petal with no pips

`petalTrack()` draws the Turn panel's cards *and* the Almanac's rows, so this was one edit for both.
The sentence is authored in data with a `{v}` token where the panel writes the effect value back in —
a hand-typed "+30%" would be the first copy of a number this file otherwise keeps in one place.

**At zero pips the sentence replaces the value line.** That is a small judgement inside the ruling:
the show-the-numbers ruling put "now · next" on every track, and at zero pips "next +30%" and
"+30% … per petal" are one fact said twice, the second time with a noun attached.

### 4 · The gestures — re-ruled at the door

Phase 3.5 read the gesture as a **pointer**: the Hollow is under the garden, so point the finger down
to go there. In the hand it is backwards. **The finger drags the world.** Pull it up and you descend;
push it down and you rise. Swipe UP goes down into the Hollow, swipe DOWN goes out along the lane.

This reinstates the half of the phase-3.5a option that was **explicitly rejected at the time**, and
`docs/22-creatures.md` had argued for it when the Hollow was first designed: *"dragging down pulls the
world down past you, which is the direction every scroll already uses."* **The original argument was
right and the gate overruled it** — that is the reusable lesson, and it is why a picture-argument
about where a room *is* should not settle a question about what a *hand* does.

**The placeholder gate is not built, and that is the owner's call taken mid-round.** Swipe-down is the
Wild Meadow's *only* door in the game. The gate would have stranded the room, its hives, its keepers
and four quests worth 114 of the ladder's 777 reputation — and a quest for a feature with no UI jams
the strip. Three options went to the owner: build the gate and let the meadow go dark; make the gate
the meadow's porch; or fix only the inverted half and let the gate wait. **The owner chose the third.**
Both directions answer, nothing is stranded, and the gate ships in a round that gives it somewhere
else to live.

*Also done, because the code was open:* both room exits record their pointer id and clear on
`pointercancel` — the same two-thumb hole the garden's swipe closed. The meadow is one thumb-tap away
from a full board and was the most exposed.

### 5 · Teaching the swipe

Turn 1's gift is Fall, and a gift nobody can find is not a gift. Two one-shot marks, each retired by
the player doing the thing it teaches — which also matters because `sayText()` refuses to draw a
speech bubble while a coach is up, so a mark that could sit forever would mute the flower.

**They point at their tab from the side**, because a season tab is a 38px column pinned to the screen
edge. Two collisions came out of the review and both are fixed: a bubble centred on the tab is exactly
band height, and one clamped above the band in Fall at 390×667 cut through the bed chip. The mark now
asks the band and the chip where their tops are, and **a side mark the clamp pushes clear off its tab
flips back to the stacked shape** rather than pointing a sideways arrow at nothing.

**Gated on `Game.fallOpen()`, never on `turnsCompleted >= 1`** — which Turn opens Fall is
`DATA.year.fallTurn`, a knob, and the identity would go quietly wrong the day it moves. Backfilled
from Fall itself: a paid bed or a crop in the ground is proof the player found Fall and came back.
`seen.meadow` still gets **no** backfill, deliberately — nobody has seen the line it gates.

### 6 · The bed chip

Above the board, its last 2px sat inside the board and its lower third lay across the stubble fringe —
Fall's one rule drawn on top of Fall's one picture. On a notched phone, where the board fills the
frame, it was pushed off the top of the board entirely.

It hangs under the board now, anchored to `.fl-wrap`, which **is** the board's box. **The strip it
stands in is reserved, not borrowed**: `sizeBoard()` subtracts 46px from the height it will accept. On
a phone the board is width-bound and this costs nothing; on an SE-class screen it is height-bound and
gives up about 45px. Without that, the widest state lay across the UPGRADE and POWER-UP buttons at
390×667 — measured, not guessed. The consequence to know: Fall's board now sits ~23px **above** the
garden's, where it used to sit ~12px below. It is the board *and its caption* that is centred.

### 7 · The Cards pass

The album shipped 15 August; the standard hardened on the 26th. These were the last screens still
drawn the old way.

**The fix is doc 05's first check applied literally.** Twelve pale tints on pale cream have no figure
and no ground, and no amount of detail fixes that — the body colour has to change. So the tiles and
the card faces become the **dark body tier**, in the Tally plate's ramp, which exists for exactly this
case: a dark body standing on cream inside a sheet. The set's tint moves to its ring, where a tint
belongs.

**Rarity is painted in the rarity colours.** The reveal glowed gem-cyan for Rare and coin-gold for
Legendary — the two *currencies* — and Wonderstruck pink for Mythical. **Mythical wears legendary gold
said twice**, because the card ladder has five rungs where the garden has four and `--epic` purple
already means one rung *down*.

*Rejected:* giving Mythical a colour of its own — a new value in a palette this project already
carries 176 of by accident, and "gold said twice" reads correctly rather than merely cheaply. Raised
as a question rather than settled; frozen, a Legendary and a Mythical differ by 1px of ring and 14px
of glow.

*Rejected:* every layout change the standard would otherwise ask for — a name-plate on the card face,
a back for an unowned card, wider grid gaps. The ruling said look, not layout; they are questions in
the handoff.

### Two tools, because the round could not otherwise be checked

`tools/probe.js` gained `media:reduce` — CSS cannot force a media query on from inside the page, and
"honest under reduced motion" is not a claim you can screenshot without it — and `drag:`, because the
project had no way to drive a gesture headlessly at all. **`drag:` sends mouse input, not touch:** a
dispatched touch drag on a page with no `touch-action:none` is read as a pan and answered with
`pointercancel` after the first move, so the gesture dies in automation on a screen that works
perfectly in the hand.

### What the gauntlet caught that the build did not

Five independent critics over the finished round. The two that mattered were both **the same trap
wearing different hats**: `box-shadow` is one property. A duplicate Rare/Legendary/Mythical pack card
wore the dark body's lip on a cream body, because `:not(.is-new)` and `.r-legend` are the same
specificity and the later rule won outright — so the rarity ring moved onto its own custom property,
and "which rarity" and "already had it" stopped fighting. And `bill 1c` was passing on things it did
not test: its Almanac check asserted a getter after a Turn had already emptied the bag, the daily was
not audited at all, and a typo'd booster id on any rung but level 2 paid nothing while the toast still
announced a power-up. **A new test group is worth sabotaging before it is worth believing.**

---

## 2026-08-30 (rulings, after phase 3.7) — The pantry was the bank, and the referee needs seeding

**Two rulings out of the owner reading the phase-3.7 pacing result and not believing it.** Both came
from playing, not from the sim; the sim only confirmed them afterwards.

### 1. The correction that started it

The phase-3.7 handoff said a Turn-heavy shape beat normal play by *laundering doomed gold through
Fall beds*. **The owner rejected the framing and was right to.** Planting Fall before a Turn is the
correct move and exactly the investment feeling Fall exists for — it is good play, not an exploit.
And gold at the Turn cannot be the mechanism at all, because the mint reads what a year *earned*,
never what is left in the wallet.

The real cost of a fast cadence is that **the Turn wipes every badge**. Fifty-three Turns in ten days
is fifty-three rebuilds of the automation, and the earning rate sawtooths where a four-Turn player's
climbs and holds. That is the design working, and it should have been the explanation from the start.

### 2. What last year's harvest becomes

Chasing the correction found the actual hole, which the owner had already felt in play: *"when I come
back to the game after a turn, I have those orders that I can turn in, and it catapults me far
through the new season."*

The Turn regenerates all three orders and **does not empty the pantry**, and nothing else in the game
empties it either. So a fresh board meets a stockpile that has been growing for the life of the save.
Measured: **30.0% of every coin a Turn-heavy player earns from orders lands in the first sixty seconds
of a new year** — 401 deliveries of 1,304, against 5.7% for a player who Turns four times. Blocking
it flips the ten-day result on its own (68.1M/46.6M in the Turn-heavy player's favour becomes
32.4M/38.2M against him) and drops his Turn count from 53 to 35 without touching a multiplier.

**The ruling: an order is filled from what you grew this year.** Everything still in the pantry at the
Turn is preserved — craftable, sellable, and no longer something a customer will take. Nothing is
destroyed, which is the point: the owner's own framing was that the blooms should keep their value
somewhere else rather than be wiped. Spec in [41-the-preserve.md](41-the-preserve.md).

Three things that ruling knowingly buys, all recorded there rather than discovered later: the first
board of every new year becomes a to-do list rather than a payout; **normal play loses order income
too**, by about two thirds, because the bank closes for everybody; and crafting finally acquires a
supply, which it has never had.

### Rejected

**Cutting the order multipliers back to ~40%** to make the pacing verdict pass. It would also have
flipped the result, and it would have taken an order from ninety seconds of income back to
thirty-five — most of the way to the "pretty pointless" the ruling that raised them was fixing. That
is undoing a ruling to satisfy a tool.

**Wiping the pantry at the Turn.** Measured, because it was the cheap way to test the idea, and
rejected as a design: it deletes something the player grew. The Preserve keeps the value and moves
where it can be spent, which is the owner's version and the better one.

**Capping or expiring the Preserve.** It grows forever and crafting is a thin sink, and that is
accepted rather than solved — preserved stock is worth roughly a hundredth of the same stock fresh,
because an order pays 30–225× the unit value. If the pile becomes a problem the answer is more
crafting, not a cap.

### 3. The pacing tool is a simulation and needs to become an instrument

The owner's question, which is the more valuable one: *is this just a simulation, or a tool we can
leverage when we retune?* Today it is the former, and it has quietly grown a second problem.

`tools/order-gold.js` was written this phase by copying `tools/year-sim.js`'s play model verbatim,
and the scratch probe that measured the pantry made a third copy. **Three copies of "what a casual
player does in six minutes" already exist**, and every retune from here either copies it again or
drifts from it.

The ruling is to make it an instrument before the next economy change rather than after, and to keep
it small — no dashboard, one command, a printed table:

- **Seed the dice.** Every roll goes through `Math.random()`, so no two runs agree and the pacing
  verdict is a coin flip (five runs of identical code came back OK, OK, OK, FAIL, FAIL). Seeded, the
  same `data.js` answers the same way twice — and, far more useful, **the same player can be run on
  the same dice against two economies**, so the difference IS the change rather than the weather.
- **One play model, imported.** `tools/play-model.js`, and the question-tools stop carrying copies.
- **Compare, don't report.** A retune always asks *did this help?*, never *what is the number?*. A
  committed `tools/baseline.json` and a printed delta answers the question actually being asked.

**Why before the Preserve rather than after:** the Preserve is the first change that moves order
income for everyone, so it is exactly the change worth a real before-and-after — and measuring it with
the referee as it stands would produce another coin flip.

---

## 2026-08-30 (phase 3.7) — The Numbers pass, the What's New popup, and orders that pay in minutes

**Builds the three rulings logged below it on the same day.** The whole phase is the owner's one
sentence made true everywhere: *if a button costs something, it says what you get and what you now
have, and every number a purchase changes updates the moment you buy.*

### 1. The picker was lying, and it was not the only one

`renderSeeds()` computed its grow label as `seed.grow * growModifier()` — sprinklers and boosts, and
nothing else. A tulip full of Quick Sprout read **18 seconds while growing in 13**, and the payout
pill was worse: `seed.yield` straight off the data row, with none of the seven multipliers a real
harvest reads. The engine was right the whole time; the label was the bug.

Both pills now come from the functions the plant itself goes through — `Game.plantGrowth(seed, plot)`
and a new `Game.plantPayout(seed, plot)` — so the picker cannot drift from the garden again. Rarity
stays out of the payout because it is the range, and mutation stays out because it is a roll;
everything else is in. **A number the garden has improved says so**: a faster grow time takes the
house green, and an improved payout carries the multiplier that did it (`×5.7`) inside its own pill
rather than being quietly bigger than the data row.

`plantGrowth` was not exported. It is now, and `MAX_RARITY_MULT` left `ui-sheet.js` with it — the
last piece of economy math in the picker.

### 2. Pips stay, numbers join them

**This overrules the phase-2 "pips, not spreadsheet rows" position**, and the resolution keeps both:
the dots are the feel of filling something, and the number beside them is the value. Every petal
track — the Turn panel's cards and the Almanac's rows, which share one function — now reads
`Rich Bloom ●●●○○ +90% gold · next +30%`, off a new `Game.petalEffect()` rather than arithmetic in
the panel.

### 3. What the sweep found

The Lucky Charm standard held on Lucky Charm and almost nowhere else. Thirteen badge cards shared
one template whose only live number was `Lv N`, and six of them said nothing numeric at all. Five
priced meadow tenders were described entirely in adjectives — **and two of them silently SLOW the
hives they touch** while their copy said "cool and quiet". A creature food button stamped the tin's
`+16h` while the engine's cap handed over two. "Sell all" showed the unit price and the quantity and
left the player to multiply. A bought sky promised "everything growing gets a shot" on an empty
board. A gem skip named a price and never the wait it deleted. *(That last one was reversed by
the owner on 2026-08-31 — see the entry at the top of this file. The wait moved to the
`aria-label`; the chip shows the price alone.)*

Every one of those numbers already existed inside the function that spends it. The pass added
thirteen getters to `game.js` — `upgradeEffect`, `foodEffect`, `hiveProjection`, `tenderEffect`,
`keeperLift`, `skipSaving`, `weatherCallEffect`, `sellValue`, `tapStats`, `growthStats`,
`autoHarvestCadence`, `procChance` promoted out of `Dev`, and `plantPayout`/`petalEffect` above — and
the panels now read them instead of re-deriving them. Three house-rule violations went with it: the
Almanac was rebuilding the tap payout stack by hand (and had already drifted — it omitted the
combo), multiplying `PROC_CHANCE_PER_LEVEL` by hand, and duplicating the drone's cadence formula.

**The live half of the rule needed its own work.** Most surfaces rebuild on `panels` and were
already honest the moment a purchase landed. Two were not. The picker's payout pill folds in the
Wonder multiplier and the night bonus, and neither a Wonder starting nor nightfall re-renders the
sheet — so an open picker quoted a stale number for the length of a Wonder. `tickSheetTimers()` now
re-reads the two pills on the slow tick, cached on the node so it writes only on a real change (a
`panels` rebuild would swap the row under a pressing thumb, which is why it is a sync and not a
re-render). And the plot's gem chip wrote its afford state only when the PRICE changed, so a chip
greyed out at 3 gems stayed grey after a gem drop until the price happened to tick — up to thirty
seconds of the game saying "you cannot afford this" when you could.

**The one deliberate exception survives**: year one's mystery meter stays wordless. It is the
tutorial, and the ruling named it.

**Three questions left for the owner rather than answered.** The **plot unlock badge** and the
**meadow cell badge** are 60px and already carry a gate label or a price; there is nowhere honest to
put "what you now have", and the answer is visible on the board anyway. The **season edge tabs** are
38px and say which Turn opens them and nothing about what is behind. And the **POWER-UP button**
spends one of a rotating inventory and says only how many you hold: the name, effect and duration
went into its label, but a visible caption needs the round button to give up glyph size, and every
booster name is two words, so a visible label would be a truncation. All three are "no room",
not "not worth saying".

### 4. The What's New popup

A one-time house-styled dialog on boot, in its own file (`ui-news.js`) because it is the only modal
in the game a player cannot swipe away. Announcements are data — a new build is one row appended to
`DATA.announcements` — and the first one ships with art the owner supplied, which makes it **the
repo's second deliberate binary-asset exception**, written into the conventions rather than snuck
in, and narrow: this folder, owner-supplied, lowercase paths, in `sw.js` in the same commit, never
load-bearing.

Three decisions worth the ink:

**The seen-flag lives outside the save, in `gw-news`.** "Got it!" wipes the save; a flag inside it
would be erased on the way out and the popup would open for ever. A sim-test asserts it survives a
`reset()` that demonstrably clears the wallet — an assertion that is false the moment anyone moves
the flag into `state`.

**Nothing in the dialog fades in.** The card and the dim are opaque in their base style and the only
thing the open class moves is the card's position. A modal whose single button depends on a frame
that may never arrive is a trap, and this codebase has the scar: the pack badge started at
`scale(0)`.

**It sits outside `.world`.** FX builds its float layer as a child of `.game`, so a coin float from a
harvest that landed while the dialog was up painted straight over the art. Found by looking at it.

**The button never says "reset".** The fresh start is the announcement's gift, so the dialog says
"This one starts everyone on fresh soil" and the button says "Got it!".

### 5. Orders that pay in minutes rather than seconds

The owner: the delivery bonus "is so small... almost feels pretty pointless." Measured, they were
right by **a factor of twenty-five to a hundred**: at the old 1.55–2.60 a delivered order paid
between a fifth of a second and four seconds of the player's own earning rate.

`STAND.tiers[].mult` is now **30 / 200 / 210 / 225**, and the measurement is a new tool —
`tools/order-gold.js` — that drives the casual model, divides each delivery by the rate the rest of
the garden was running at (order gold and offline lumps deliberately outside the anchor), and prints
a median per tier against the 60–120 second band. At these values, over 25 simulated days: **t1 87s,
t2 95s, t3 73s, t4 82s** — every tier inside the band, cross-checked by a second, independently
written probe that agreed within noise.

**The floor the invariant sits on is `1 / STAND.wildBonus` = 1.12, not the lowest number in the
table** — the comment in `data.js` claimed otherwise and had been wrong since the Stand shipped.
Raising a multiplier can never endanger "delivering beats selling"; only dropping one under 1.12
can. And the suite was only ever checking the top tier: `standReset()` unlocks to level 20, which
puts rep past 600, so a broken tier 1–3 multiplier shipped green. Both properties now loop the tiers.

### Rejected, and what it cost

**Tuning `mult` per tier to hit the band at the tier BOUNDARIES.** Measured that way the four tiers
demand a non-monotone set — tier 3 wants more than tier 4 — because between those thresholds the
player's rate grows 2.9× while the board's median order value grows 10.1×. Measured over the
deliveries a player actually makes, the same four values land in band together. The board-sample
reading is the wrong denominator: it prices orders nobody fills.

**Fixing the within-tier spread.** At the ruled values a tier-4 board pays anywhere from four
seconds to six hours of the player's rate. Two structural causes, both in the engine and both out of
scope for a data-only ruling: `standFloorUnit()` is pinned to Daisy for ever, and
`standBuildOrder()` draws named blooms from the whole unlocked pool. Recorded in
[11-known-issues.md](11-known-issues.md) with the cheapest first move.

**Making `year-sim`'s verdict pass.** It no longer decides the same way twice — five runs came back
OK, OK, OK, FAIL, FAIL — and the tool's own header says not to fix the tool. What it fails on is
`smart` out-earning `casual` on lifetime GOLD, never on Saved Seeds minted, so the property the
cumulative mint guarantees is intact in every run; the mechanism is `smart` laundering a
now-much-larger wallet through Fall beds before each of its fifty-five Turns. Seeding and
multi-running the verdict would settle it honestly, and a session should not go changing a verdict
tool in the same pass that makes the verdict inconvenient. It is the owner's call, with the
arithmetic in [11-known-issues.md](11-known-issues.md).

**Numbers on year one's meter.** The mystery is the tutorial. Kept.

---

## 2026-08-30 — The strategy refresh: what the market says now, what it costs, and the four numbers we were quoting that do not hold

**Docs-only. No code, no economy knob, no design ruling.** Three new documents —
[38-market-refresh.md](38-market-refresh.md), [39-growth-and-launch.md](39-growth-and-launch.md),
[40-financial-model.md](40-financial-model.md) — plus corrections logged here. Twenty-three research agents,
three adversarial fact-checkers who corrected thirteen claims and killed four, and one critic whose only job
was to find what everyone else missed.

### The honest framing first: doc 17 is fifteen days old

The brief asked us to re-verify what had moved since August. **Nothing in the market moved in a fortnight**, and
saying otherwise would have been the easiest way to waste the run. What the refresh actually bought was
corrections, width, and a pile of coded player complaints. That is stated at the top of doc 38 so nobody reads
it as a changed world.

### What we concluded

**The middle of this lane is empty and that is the whole strategy.** Three tiers: funded games that are hated
for how they treat you and make money anyway; small games that are loved and earn nothing; abandoned games with
enormous reach and no reason to return. Nobody is loved *and* earning. The evidence is countable rather than
rhetorical — across **233 substantive five-star reviews** of the seven biggest games in and around our lane,
**exactly one** praises a game for being generous or fair. "No forced ads, no energy, no fake timers" is
therefore not a values position filed under monetization; it is the only unoccupied square on the board, and it
should be the headline positioning claim with that number attached.

**Cozy-plus-prestige is an empty intersection.** We looked hard: no commercially successful cozy idle game
shipped a prestige loop between January 2025 and August 2026. The one cozy botanical game with a
prestige-shaped reset is a solo dev at 10K installs. The 2026 incremental scene's prestige games are all uncozy
— mining, tower defence, space. **The Turn is the only thing in this project nobody else has, and nobody else
has tried it either**, which is the opportunity and the risk in the same sentence.

**The number that decides everything is how many days a player stays, not what they spend.** To hold 3,000
players a day at the 2026 median retention you need **750 installs every day forever**, which is well above what
any optimised game gets organically; at a good cozy curve you need **375**; at best-in-class idle, **200**. The
organic ceiling is 200-500/day. So at median retention this plan cannot reach its own target at all. **The money
question and the design question turn out to be the same question.**

**The ad-versus-purchase assumption in doc 37 is backwards for our shape.** The closest comparable cluster
(Sensor Tower's hybridcasual Lifestyle & Puzzle) runs **59% purchases / 41% ads**; a live four-person idle
studio's own books run 80/20; a solo dev's published P&L runs 67.5/32.5. The only source supporting an
ads-majority model is a mediation vendor describing a different genre. **Recommendation: keep every promise and
every placement exactly as ruled, and stop calling the ad line the plan. It is the floor. The shelf is the
plan** — and doc 37 already says so in its own gems paragraph.

### The four numbers we were quoting that do not hold

1. **The Simulation retention table (D1 30.1 / D7 8.71 / D30 2.96).** It comes from one vendor blog **that
   contradicts itself two paragraphs above the table**, and the largest genuine 2026 dataset — GameAnalytics,
   16,000+ games — **publishes no genre split at all this year** and puts the median mobile game at D1 ~18-22%,
   D7 just under 4%, D30 0.7-0.8%. Our planning numbers are a **top-quartile outcome dressed as a baseline**,
   and every revenue figure downstream inherited that optimism. This is the correction that matters most.
2. **Cats & Soup at "10M+ installs, ~$300K/mo, Hidea".** It is **80M+ downloads** from NEOWIZ's own statement,
   the seller is **NEOWIZ** — a listed publisher that reports the game to investors — and **the $300K/mo could
   not be reproduced** because Sensor Tower's per-app pages are login-walled. Stop using it as "what a small
   team can earn."
3. **Egg Inc's "moat is generosity", "~1M weekly actives", "12.5M iOS installs".** The generosity is **only
   about ads**: free players earn offline at **0.5×** and 1.0× costs a $9.99 Pro Permit, which also gates the
   MAX button, silos, boost slots and artifact slots. Neither the 1M WAU nor the 12.5M could be sourced at all.
   **The transferable rule is narrower and better: never interrupt the player with an ad.**
4. **Terrarium's "~$9K/mo".** Traces to **October 2022**; the host that published it now refuses connections.
   The *argument* — reach without a reason — survives and is far better evidenced now. The number is four years
   stale.

Two smaller ones: **Terrarium is Green Panda → Ubisoft/Ketchapp, not Kolibri** (and that ownership *is* the
explanation — a hypercasual ad-arbitrage org with no live-ops unit, which is why 11M installs never became a
service), and **the "1,087 idle games earned $3.97M" statistic could not be reproduced in any search**.

And one methodological correction with teeth: **Sensor Tower bought AppMagic on 2026-05-13**, having bought
data.ai in 2024. Doc 17's confidence note lists them as separate credible sources. **They are one company**, so
"AppMagic and Sensor Tower agree" is one vote.

### Where we disagree with the standing docs

- **Doc 29's ceiling argument leans on a channel that is closing.** It caps direction A with "Cats & Soup's
  $300K/month comes with Netflix distribution attached." Netflix **sold Spry Fox back to its founders in
  December 2025**, closed Boss Fight in October 2025, and closed Night School Studio and Moonloot on **13 August
  2026**. The Cats & Soup Netflix Edition has been frozen since October 2024 at 3.30 stars from 172 ratings.
  **Cats & Soup did not win because of Netflix.**
- **Doc 29's ASO claim is half wrong.** Apple's own documentation names **downloads, number of ratings, and
  quality of ratings** — retention appears nowhere. Retention reaches ASO through a specific chain: it keeps
  players alive to reach a completion moment, the review prompt fires there, and ratings volume and star quality
  are the documented factors. **That changes what you build** — it argues for engineering a satisfying
  completion beat to hang the prompt on, which the Tally already is, and it promotes cloud save and
  crash-freedom from hygiene to ranking infrastructure.
- **Doc 29's TikTok numbers come from one unsourced SEO blog**, along with the "$200 behind a post" figure and a
  "59% discovery" stat that TikTok's own research contradicts (it says 41%). TikTok's published floor is **$50/day
  at campaign level**, so $200 is a four-day experiment. And the figure was borrowed from a *Steam wishlist*
  playbook, where a wishlist is a free click and an install is an auction bid.
- **Doc 17 has no competitor entry for Runaway Play.** Honey Grove appears only as a visual reference. They are
  ~30 people with an eight-title cozy portfolio, an Apple editorial relationship, a 1M-download launch this
  March, and **a bee-and-flowers game already on the shelf**. Biggest single blind spot in the document.
- **Doc 17's "the lane is visually uniform, so craft wins" premise is weakening.** The conclusion survives, but
  the two most *editorially successful* botanical games of the window are a 509MB 3D flower sim and 656MB of
  painterly 3D, and **both won Apple "GAMES WE LOVE" slots**. Our craft argument has to be about *feel*, which
  is cheap, not *fidelity*, which is not.
- **The "$3,650 lifetime per idle title" graveyard is a MOBILE FREE-TO-PLAY statistic.** In the desktop-companion
  lane next door, a first-time solo dev took ~$1.6M gross in four months at $7. Same content, different
  storefront, completely different distribution of outcomes. That is an argument for taking a premium PC build
  seriously as a revenue line — presented as an owner's call, not a recommendation.

### The one place the evidence runs against the owner's stated taste

**Punishing upkeep.** The owner has ruled that they want stakes, and this pass did not soften that — but it did
not hide the evidence either. Window Garden, the nearest solo-dev success, loses stars exactly where upkeep
scales with the collection (*"taking care of them every day felt too monotonous"*, *"this game wants to be a
second job"*). Tiny Pasture's top negative review reads *"Listing it as an idler, but punishing you for being
idle is a very strange choice."* A competitor launched on 2 August 2026 selling **the absence of upkeep** as its
headline feature. And from **June 2026, PEGI rates a game PEGI 12 if daily mechanics punish players for not
returning by losing content or reducing progress.**

**The recommendation, which is a recommendation and not a ruling: keep the stakes, make the consequence
legible, reversible, and tied to what the player chose rather than to how long they were away — and put the
sleeping face in the first screenshot rather than leaving it to be discovered.** That version can honestly say
"nothing is taken while you're away" while still having something at stake, and it is also the version that
stays out of PEGI 12. There is a real marketing fork underneath this, written up in doc 39: the best-performing
cozy dev post of 2026 won on *"Crops never die. Miss a week? Everything's right where you left it."* **We cannot
say that and also ship punishing upkeep.** Both are good games; they are not the same marketing, and the store
listing, the launch post, the first screenshot and the one sentence are all blocked on the answer.

### What we rejected

- **Rebuilding doc 17.** It is fifteen days old and mostly right. Extending and correcting it in a separate
  document preserves the record of what was believed when, which is the whole point of dated research docs.
- **Printing a Wholesome Direct 2027 date as fact.** The 2026 submission window is sourced to an X post that
  returns HTTP 402 and an Instagram reel — neither openable by us or anyone without API access. It is marked
  **UNSOURCEABLE** in doc 39 rather than quietly repeated, because a year's plan should not rest on a link
  nobody can click. Related: Wholesome Direct's published success metric is **Steam wishlists**, and its August
  Celebration is a Steam sale a mobile-only game cannot join. **IGF (13 Sep, explicitly mobile-eligible) and
  DevGAMM (7 Sep, free, with a Best Mobile Game category) fit us better and close within three weeks.**
- **Any starter-pack or piggy-bank conversion figure.** Five differently-phrased searches found qualitative
  design writing and no published benchmark anywhere. Studios treat it as proprietary. Recorded as a gap rather
  than filled.
- **Every figure from the AI statistics farms** now dominating benchmark search results — gameinsights.ai,
  playio.co, progamespoint, zipdo, worldmetrics. One claims casual D1 of 38% and LTV of $45, reconcilable with
  nothing. **Rule adopted: if a figure's only home is a domain nobody in the industry has heard of, it does not
  go in a doc.**
- **Averaging GameAnalytics and Adjust.** Their retention figures differ ~2× and their session lengths ~10×,
  because Adjust measures attributed installs in apps running paid UA — the funded cohort we are not in. Any doc
  citing both in one table is broken.

### Three things nobody had noticed, worth keeping

- **Weather is a pure function of wall-clock epoch time, so the exact minute of the next Wonderfall is
  computable in advance.** The rarest, loudest, best-filming moment in the game is on a public timetable and you
  can be recording before it starts. The flip side, from the critic: it is computable by anyone with devtools,
  because the game ships unminified with no build step — which argues for the forecast being an in-game surface
  we own and pace rather than a third-party wiki we compete with.
- **The seed art schema already supports `rainbow: true`.** Mutations are currently drawn as a border and glow
  *around* the plot, which is invisible in a phone recording. Recolouring the actual petals converts our
  structurally strongest mechanic from unfilmable to filmable **at data cost, not art cost**.
- **The Century Bloom has no opening.** Every doc specifies its economics — fourteen days, one at a time,
  survives the Turn — and not one specifies what happens when it opens. It is the only moment in the game with
  two weeks of anticipation behind it, and anticipation is what makes a clip get *shared* rather than watched.

### What is left open, and whose it is

Four owner calls are presented with options and recommendations and **deliberately not decided**: pricing
posture (free-with-shelf recommended, premium at $4.99 genuinely live), launch timing (PGC London, 18-19 January
2027 recommended, because it is confirmed rather than estimated), how loud to be about the two-people story
(warm but not central), and whether the $3-5K/month goal is the target or the floor.

And the question the critic is right that nobody has put to the owner: **what does this have to earn, by when,
for it to be worth continuing — and what happens in the month it earns $200?** Every strategy doc in this
project is written for the 30-40% case and none for the median outcome. Three live decisions currently being
made on aesthetics fall straight out of that answer: whether the Unity port is worth its cost, whether analytics
ship at all, and whether the ad line is worth having.

**Two hard dependencies surfaced that are not opinions.** There is **no analytics, telemetry or remote-config
code anywhere in the repository** — verified by grep — so the number the whole plan turns on cannot currently be
measured, and doc 37's promise that caps are "all remote-tunable" has nothing behind it. And **Safari deletes
every save after seven days without interaction unless the player installed the game to their Home Screen**,
which is live right now for the friend playtest group; it is in [11-known-issues.md](11-known-issues.md) with
the two documentation contradictions the run also hit.

**Added later the same day — the TAPCLAP case, from an owner question.** The owner asked what a Cyprus HTML5
studio with high CrazyGames play counts might be earning. The answer turned out to be worth writing down,
because it replaces the weakest evidence in doc 38 with the strongest: **~80 million lifetime Play installs
across seven apps, 62 million on one game — supporting about thirty people, down from "more than 70" in
2020.** Their whole portfolio has ~15,000 lifetime US App Store ratings, so the audience is Russia/CIS and
emerging markets at emerging-market rates. No public revenue figure is reliable (Sensor Tower's per-country
pages show the same game at $20K/month in one place and a $43 peak in another), so the estimate — **roughly
$2-4M a year, trending down** — is built from headcount, which for a self-funded studio is the honest proxy.
**Where doc 38 previously leaned on Terrarium's unverifiable four-year-old "$9K/month" to argue reach without
revenue, it now leans on this.** It also supports doc 39's web-funnel ruling from the strongest possible
source: TAPCLAP's CrazyGames pages link out to *their own* store listings rather than a CrazyGames-published
bundle — a studio that has run this play for a decade treats the portal as a shop window and takes the money
on mobile. Full entry, with the per-install comparison against The Cozy Florist and Rusty's Retirement, in
[38-market-refresh.md](38-market-refresh.md).

---

## 2026-08-30 (phase 3.6) — The cleanup round: three ruled fixes, and a review kit so the owner can live a week in an afternoon

**Implements the three rulings below, plus the cheats the owner asked for.** No new layouts, so no
wireframe gate. No economy knob moved. Suite **1,207 → 1,305**, clean across six runs; `year-sim`
exits 0.

### The discover quests count what you already found

**Two faults with one symptom, needing different fixes.** A discover quest was dealt at zero however
many flowers you had already grown, so the strip read 0/5 while the Almanac on the next screen read
2 — one word counting two different things. And the last rung asked for twelve species after being
dealt at eight, in a game with nineteen: measured against the real engine, a hard ceiling of 11/12.
Unwinnable, and because the strip always showed the *oldest* active quest it then became the
permanent contents of the one thing the game keeps in front of the player.

**The engine now asks one question when it deals a quest: what does this goal already deserve?** The
answer comes from a small table keyed on the quest's *track*. Only `discover` has an answer today,
because it is the only track with a lifetime record behind it. It is written as a **floor**, not a
starting value, which is the part worth keeping: a record can never be lower than what a quest
counted for itself, so re-applying it is harmless — and that is what quietly straightens a save
already stranded at 0/5, with no migration flag and nothing new in the save file.

**The daily is deliberately excluded.** A daily is a goal for today; a lifetime record would deal it
finished every morning — and the dailies are the only quests that pay gold, so that is a faucet into
the mint on a timer. It gets a sim-test with an injected discover daily rather than a comment.

**The strip now shows the quest nearest to done**, as a fraction of the goal — four of five is
closer than five of twelve — with a completed quest first and ties going to the one dealt first, so
a fresh save's strip is unchanged. The quest panel reads the same order from the same getter, so the
strip can never disagree with the panel it opens.

**And it HOLDS that quest until the active set changes**, which was not in the ruling and is the one
place this round overrode a first implementation. Ranking on every read looked fine under a coarse
harness — ten simulated minutes, 684 reads, four changes, every one a completion handing over. A
finer harness sampling after every single action found the real case: two quests at similar
fractions both advancing on *interleaved* actions. *Harvest 5 daisies* and *Tap 50 times* traded
places **three times in two rounds** of tap-tap-harvest, which is the core loop, not an edge case.
A goal that moves while you are looking at it is not a goal. The hold re-opens on a deal, a claim or
a prune; a **finished** quest still jumps from anywhere, because a claim waiting is the one thing
worth interrupting for. The lesson is the measurement, not the fix: **a harness that batches actions
cannot see a flicker that lives in the interleaving.**

This would also have defused the two jams already in the docs — 'Merge a Posy' and the sell quests —
but it does **not** free the slot a dead quest holds. Only `paused: true` does that, and reading
this as licence to unbench the bench quests would be a misreading.

### The Stand's standing is paused on a flag, not zeroed in the save

A three-line tier-4 order paid 48 standing, more than the largest quest in the game, while
`DATA.levelGrants` stops at 20 — the faucet shipped in slice A and the rungs it feeds did not.

**`STAND.repPaused` in `data.js`, read through one getter, `Game.standOrderRep(order)`.** Orders keep
paying gold, keep counting the Tally's orders line, keep their refill and their skip.

**Why a getter rather than zeroing the price at generation.** Zeroing writes the pause *into the
save*: every order already on a board keeps a stale number, and flipping the flag back needs a
migration to pay it. The getter leaves the authored number honest in the save and gates only the
payment, so **slice D turns this on by changing one word and every board already written pays**. A
sim-test asserts both directions. The order card omits its star chip entirely while the flag is on,
because an order that promises standing it will not hand over is worse than one that promises
nothing. Every other standing faucet — quests, Almanac milestones, the ten-harvest drip, the dev
level grant — is untouched, and each has an assertion saying so, because putting the flag inside
`addRep()` would have switched off the whole ladder with a green suite.

### The padlock means the one-time wall, and nothing else

The go button draws its sprout in every state and drains onto the drained-paper tokens when the row
is unaffordable. An **empty** disc was rejected: it reads as a bug. Fall's crop picker took the same
edit — it shares the row and has no unlock wall at all, so its padlock could only ever have meant
*can't afford yet*.

**The half that would have shipped broken:** `syncAfford()` rewrote that slot on every `currency`
emit, so a markup-only fix puts the padlock back about a second after the panel opens — worse than
shipping nothing, because it then reads as a flicker bug. There is no UI test in this project, so a
sim-test reads `ui-sheet.js` and holds all four writers at once, including the negative case: a
suite that only said "no padlocks in the picker" would be passed by deleting the padlock that stays.

### The review kit

**The time-warp is the away cheat with `lastSeen` held down.** It winds every production clock
*back* — plants in both seasons, Fall's bed and the Century Bloom on the same field, hive jars,
crafts, order refills, creature food **and** the separate keepsake clock — then runs one real
`tick(0)` so the world catches up in the same commit. `state.lastSeen` is the one field it will not
touch, because moving it is exactly what turns an advance into an absence and pays offline income;
`tick(0)` even re-pins it to now, so the guarantee is structural rather than a promise.

**A running power-up and the Wonder keep their remaining time — a ruling, not an oversight.** The
rest of the kit exists to give the POWER-UP button something to demonstrate, and a warp that blew a
boost away would make the two cheats fight each other. Verified live: 30s of Bloom Burst and 20s of
Wonder both survived a 24-hour warp untouched.

**Summoning goes through `moveIn()`**, extracted so that one function writes the arrival record — six
fields that mean different things, and `fed` is the keepsake clock wearing a name that says
otherwise. The summon fires the same `critter` arrival event a threshold crossing does, so the
celebration is the one a player gets. **It leaves `state.discovered` alone on purpose**: faking it to
trip `checkCritters()` would move the Almanac, the discover quests fix 1 has just taught to read that
count, the growth loop and the creature's own attract line, all to buy one animation.

**Summoning grants no levels.** The band holds `habitatSlots()` and slots open at levels 1/5/10/16,
so on a fresh save only one creature can be out. That is stated in the row header rather than worked
around, and a summon that lands but cannot come out takes the *toast* path, not the deny path — the
cap doing its job is not a failure.

**A bug this round shipped and then caught: `moveIn()` stamps `tending` once, at arrival.** Summon
the roster at level 1 and *then* open the habitat, and you get four slots with one creature in them
and nothing to re-tend the other three — and the toast was telling the owner to do it in exactly
that order. `summonAll()` now also sends resting creatures out through the real `setTending()`, so
pressing it again after raising a level fills the band, and the toast says so. The assertion that
was supposed to cover this passed while the band was empty (`habitatFree() > 0` is the *symptom*,
not the guarantee) — the "test that passes for the wrong reason" trap, in a test written to honour
that very trap.

### Rejected

**Re-keying, benching or re-costing the discover quests**, and re-pointing the track at
`state.year.stats.speciesSeen` — the owner ruled options 1 and 4. The `speciesSeen` idea is the
strongest of the rest and stays available: it is a decision about what the discover track *is*,
not a bug fix.

**Zeroing the Stand's rep at generation** — see above; it writes the pause into the save.

**An empty go disc, and a "36 gold short" label.** The ruling was *grey row only*; a disc with
nothing in it reads as a broken button rather than as a quiet one.

**Suppressing the drone's harvest inside the warp.** `Dev.warp()` calls `credit()` nowhere, but the
real `tick(0)` runs the auto-harvester, and a warped plot genuinely is ripe — so a save that owns the
drone earns one harvest per warp press (measured: ~450–500 gold, and often zero, because the drone's
own cadence gate blocks a second). Suppressing it would mean a cheat that lies about what the
automation would have done over the hours it just skipped. Recorded in `11-known-issues.md`
instead.

**Granting levels from the summon button** so the band fills in one tap. It would silently unlock
plots, meadow cells and Stand tiers on the way past. One cheat, one job.

**Overriding the ruling to keep the discover quest off the strip.** With the backfill it arrives at
2/5 while its neighbours sit at 0, so it genuinely *is* the closest to done — and on a fresh save
nothing can advance it until Bluebell's 150,000 wall. The two halves of the ruling meet here, and
the answer is a design call the owner should make rather than one a builder should quietly take:
re-cost the first rung to `discover 3`, or point the track at `state.year.stats.speciesSeen`. Both
are on the menu in [11-known-issues.md](11-known-issues.md), where the seam is recorded rather than
hidden.

---

## 2026-08-30 (phase 3.5, the gauntlet) — Sixty-nine critics, and the blocker was the meadow's only signpost

Five independent critics — reachability that *walks*, visual fidelity against the approved spike then
doc 05, grammar, the house traps, and the squeeze — then every finding independently re-checked
against the running game. **Fifty-two confirmed, twelve dismissed.** One blocker, twenty highs.

**THE BLOCKER, and it is the shape of a whole class of bug.** `idleNudge()` wrote `seen.meadow` and
saved it *before* calling `sayText()` — and `sayText` has two ways to swallow a line: a coach mark
up, or a bubble painting into a `display:none` subtree. The meadow has had no visible entrance since
the first push of this phase, so that one line is its entire discoverability, and it has **no
backfill by design**. Sitting in the Hollow, in Fall, or on a locked gate for twenty-six seconds
spent it into nothing, permanently. In the Hollow it would also have been a lie — "swipe up" means
the opposite thing down there. **Consume a one-shot only after the thing it pays for has actually
happened**, and guard it on every variable that can answer *where am I*, which is the same rule the
vertical swipe already follows. Verified by waiting out two real twenty-nine-second idles, one in the
garden and one in a room.

**Four things the phase itself broke and the gauntlet caught:**

- **A swipe starting on UPGRADE or POWER-UP navigated to the meadow.** `noSwipe` lost `.burrow-door`
  and gained nothing for its replacements. Press-slide-off-release — the standard cancel gesture —
  had nowhere to go but up.
- **The pouch chip was guillotined by the Turn button's own `overflow:hidden`,** which was there to
  clip the fill. The top of a 21px chip sliced flat, contour and digits with it, on the one number
  this phase newly promoted to an always-visible surface. **The clip belongs to the fill, not the
  button** — the fill is its own clip box now, at the button's inner curve.
- **The creatures painted OVER the GARDEN pedestal and stole its taps.** The code comment claimed the
  reverse. `.critter-yard` is `z-index:3` and a `.dock-btn` is `position:relative; z-index:auto`, and
  inside `.ui` a positive index paints after an auto one. `#dock{z-index:5}` — `#dock`, not `.dock`,
  because the Hollow's and the meadow's docks wear the same class and must not be raised over their
  own rooms.
- **The HUD's round buttons were still 40px on every phone under 700px tall.** The phase deleted one
  copy of that rule, celebrated it in the docs, and missed the identical pair in the short-screen
  block. The docs were true above 700px only.

**Two specificity traps, and they are the same trap twice.** `.dock.five .dock-btn{min-height}`
out-specified both `.dock-btn.home`'s 74px and the short-screen block's 50px, so the pedestal did not
rise and the short dock did not shrink. And `:has()` **takes its argument's specificity**, so the
four `.dock:has(.dock-btn:nth-child(5))` rules — written before a `.five` class existed — silently
out-ranked everything `.dock.five` set, including this phase's own 9.5px label rule, which never
applied at any size. Converted rather than outranked.

**The rail's track is reserved now, not collapsed.** `:empty{display:none}` was free while boosts
were spent from a chip *inside* the rail — the row and its cause were one object. They are not any
more: spending happens at POWER-UP, thirty pixels from the board, and a board that shrinks 9% on a
short phone the moment you press a button is the layout changing shape under the player. Same call
the HUD made when it took sub-44px buttons over a row that wraps as you earn. **It costs a 700px
phone 31px of board, permanently, and that is the trade.**

**The Year panel stopped rebuilding itself under the player's thumb.** `updateYearMeter` called
`renderSheet()` on the 0.6s tick, inheriting a comment that justified it because the old projection
popover "had nothing focusable inside it". This panel holds four spend buttons per unlocked flower.
`syncYearPanel()` moves the meter and the two tracks in place and rebuilds only when the ceremony's
button arrives or year one's lock comes off — neither of which can land under a thumb already down.

**Grammar, all confirmed and all fixed:** the Hollow's exit arrow still pointed and bobbed DOWN while
its label said "Swipe up"; the level-up that hands you your first boost still pointed at "the tray",
which this phase deleted; the Cards button opened a panel titled *The Long Season*; POWER-UP claimed
"nothing loaded yet" while the rail beside it counted down the boost you were holding; the Year panel
tagged a gate "nearly" however far off it was and said *seeds* three times in a game where a seed is
the thing you plant; and the ceremony told you to "swipe right" for a season you reach by swiping
left.

**Doc 05, rule by rule:** the pedestal's lip was grass on grass (rgb(47,122,52) against a lawn of
rgb(70,144,76) — same hue, 1.2:1) on the one button that must read as *play*; the Turn button painted
a 2px grey-tan scum line at 0% fill, because a border sits outside the box; an unmet gate filled
green, and green is this game's *yes*; the empty POWER-UP wore a dashed contour and a faded glyph,
two more ways of saying what drained paper already says; and two seams were translucent grey where
every other seam on the screen is ink.

**Deleted rather than left dead:** the `stores` sheet — fully written, registered in *both* maps, and
opened by nothing, which the phase-3.5 dock mapping existed to catch — along with `honeyIco`, its
only consumer; nine card cells that rendered as `<button data-card>` with no handler anywhere; a
stray `}` left when `@keyframes meterFull` went; and `.in-fall .burrow-door`.

**The spike was corrected to match the build, not the other way round.** Its band stood the creatures
above the two buttons on a lane of their own; built, that reads as floating. The reference now shows
what shipped, so the next visual critic judges against the truth.

---

## 2026-08-30 (phase 3.5c) — The map comes out, last and on purpose

`overworld.js`, `ui-map.js`, the `.map-layer`, the whole `.ow-*` block (4.9KB of CSS), the World
button and the swipe-down pull-back: deleted. The house rule stood — *a tab leaves when its home
exists, and not before* — and it was honoured across **three pushes in this order**, each of which
left the live game navigable:

1. **The meadow's way in**, on its own, while the map still worked. `UI.enterMeadow()` had exactly
   one caller in the repo and it was the map's dive.
2. **The Big Five**, which is where the World button went.
3. **The deletion.**

**Everything the map was the only door to has a new one** — the Stand is the Orders & Quests button,
the Wild Meadow is the swipe up, the Hollow is the swipe down, the garden is the GARDEN button.

**The three locked land parcels are the one thing that had nowhere to go, and they went with it
deliberately.** They were a promise that reputation would open land, drawn on a screen that no longer
exists; nothing else in the game refers to them. Killing them silently would have been the easy
version. [25-world-map.md](25-world-map.md) is now a design record with that stated at the top, so
if the promise is wanted again it gets a new home rather than a resurrection.

**Kept out of the deletion:** the camera identity — `translate(-camX*s, -camY*s) scale(s)` only holds
with `transform-origin: 0 0`, so a dive animates the camera and never the origin. It cost a rebuild
to learn and it stays in the traps list.

**One syntax trap worth recording, because it is the shape of every "delete a branch" edit:** taking
`if (UI.mapOpen()) UI.renderMap();` out of the slow tick left the `else if` beneath it dangling off
`slowAcc = 0;`. `node --check` caught it immediately — which is the whole argument for running it on
every file you touch in a project with no build step.

---

## 2026-08-30 (phase 3.5b) — The Big Five, and the mystery that had no door out

Built to the annotated spike. The dock is **Orders & Quests · Cards · GARDEN · Turn · Shop**, with
UPGRADE and POWER-UP floating in the band above it.

**The band costs the layout nothing, and that is the finding the phase rests on.** `.stage` already
reserves a yard along its bottom for the creatures; the two floating controls move into the two ends
of that same strip. The board measures 370×370 before and after. Both are inset 34px from the column
so they clear the 38px season tabs by 6 — the owner's *"have the UPGRADEs and POWER-UPs sit inside"*,
in pixels.

**The pedestal rises without making the dock taller.** `.dock.five` pins `grid-template-rows` to the
dock's own height with `align-items:end` and gives every button that exact height; only `.home` is
taller and overflows upward. Two cascade bugs were found by measuring rather than by looking:
`.dock.five .dock-btn{min-height:56px}` out-specified both `.dock-btn.home`'s 74 and the
`max-height:700px` block's 50, so at first the pedestal did not rise at all and the short-screen dock
did not shrink. Explicit heights fixed both.

**The creatures were lifted 64px to clear the band, and it was wrong.** It broke doc 05's anchoring
rule outright — a creature 64px up reads as floating, because the lawn it belongs to is still down
there. They stand where they stood; the two buttons paint over them at z-index 4, and a creature
tucked behind a button is depth, which is exactly what the burrow mouth used to do. What did have to
move is `CRITTER_SPOTS`: the old 80% spot put the second creature squarely behind the POWER-UP
button, so the crowd comes in to 32/68/44/56.

**THE ONE REAL BUG, and it was the owner's own warning coming true.** The year-one Year panel shipped
with a mystery and no door out of it: when the meter filled, the dock button breathed, the gold bar
sat at 100%, and the panel still said *keep going* — with no way to Turn at all. The mystery branch
had simply never been given the ceremony's button. It now unlocks the moment `turnReady()` is true,
drops the padlock, and offers *See what it's for*; the ceremony's ask does the teaching, exactly as
it always has. **"Mysterious with no direction feels broken" was the note, and this was the proof.**

**The order token was rebuilt because the owner caught it.** `.on-chip-count` was
`position:absolute; top:30px` over a 38px art tile, so the have/want pill sat across the bottom eight
pixels of the bloom. Two things fighting for one square, and the bloom is the half a player has to go
and grow. The token is now one object with two bands — 52px of art on top, the count in its own strip
underneath with a rule between them — and both numbers always show, with a tick **added** rather than
substituted, because "3/3 ✓" keeps the size of the ask that a bare tick loses.

**The HUD collected an old debt.** `style.css` had shaved every round button to 40px — under the
touch minimum — and written down in prose that the real fix was one fewer HUD button and that the
call was the owner's. Retiring the meter pill and the album star is that call: the row is two wallets
and two buttons, 234px of the 340 available at 360px wide, and 44px is back.

**Rejected: panels that stop above the dock.** Doc 36 asked for it so the Garden button would always
be the visible way home. The owner ruled otherwise — every panel already carries a close button — and
that ruling is worth 100px of panel height and zero lines of CSS.

**The rail lost its shop and kept its clock.** `.chip.buyable` retires; running boosts and the Wonder
still count down there. The power-up slot draws from *held AND not currently running*, because
`activateBoost` refuses to re-arm a live boost and returns false — a slot seated from held alone
would eventually hold a boost whose tap does nothing. The seat empties the instant it is spent, so
"a running boost cannot be refreshed" stays true by construction rather than by a check.

**Retired and deleted rather than left dead:** `.wallet.meter`, `.meter-fill`, `.year-pop` and every
`.yp-*` rule, `.chip.buyable`, the `#btnAlbum` listener, `onYearTap`, `openYearPop`, `renderYearPop`
and `yearGate`. Dead CSS is a trap in a 50KB stylesheet.

---

## 2026-08-30 (phase 3.5a) — The doors become the gesture, and the meadow finally has a way in

The owner's annotation at the gate: *"remove the little graphic for the hollow and the meadow — I
want players to learn they can slide down to go to the hollow, it doesn't need a button that's
prominent."* Built, and it is the first push of the phase because **the map may not retire before
the meadow has a door** and this is that door.

**Down goes under, up goes out.** The Hollow's direction flips. The old rule — *up goes in, down
pulls the camera back* — was the map's altitude metaphor, and with the map going there is no camera
to pull back to. What is left is the picture: the Hollow is a burrow under the garden, the meadow is
up the lane. A room's exit is now the opposite of the swipe that got you there, which is what makes
the axis learnable rather than two unrelated gestures. **A friend who learned the old swipe will land
in the meadow the first time** — they lose nothing, and it is one line to flip back if the owner
would rather.

**The burrow mouth is deleted, not hidden.** It was the discoverable entrance and the owner is right
that it was competing with the gesture it existed to teach — and the band needs the foot of the yard
for the floating pair. `.burrow-door`, `.burrow-mouth` and `.burrow-label` are gone from
`style.css`, the node is out of `index.html` and out of the `ui-shared.js` cache, and it is off the
swipe-exclusion list.

**The meadow's exit comes home.** `UI.enterMap('meadow')` was the only thing that happened when you
swiped out of the meadow; now `leave()` simply returns to the garden, and the chip reads *Swipe down
for the garden*. `UI.enterMap` now has exactly one caller left in the repo — the World dock button —
which is what push 3 removes.

**The one real cost, and it is named rather than absorbed:** the meadow now has no visible entrance
at all. The Hollow can afford that; the meadow holds 114 of the ladder's 777 reputation behind four
quests. Its whole discoverability is one line from the flower on the first idle after the tutorial,
gated by a new `seen.meadow` flag — which deliberately has **no** load-time backfill, because nobody
has seen that line yet, including a player who has been reaching the meadow through the map. Filed
in [11-known-issues.md](11-known-issues.md) with the two cheapest fixes if it reads as forgotten in
play.

**Rejected: keeping the Hollow on swipe-up and giving the meadow the freed swipe-down.** Less churn
— the Hollow would not have changed at all — but it puts the burrow above the garden and the meadow
below it, which is a picture of nothing. The owner asked for down; down is also true.

Both navigations still work after this push: the World button and the map are untouched, so the
meadow is reachable two ways for exactly one push. That is doc 34's hard rail being obeyed rather
than trusted.

---

## 2026-08-30 (phase 3.5, the wireframe gate) — The Big Five's spike, and the three things the spec forgot

`tools/dock-spike.html`, 16 frames, pushed before any UI code per doc 34's gate. What follows is the
reasoning; the frames carry the pictures and [36-hud-and-dock.md](36-hud-and-dock.md) carries the
summary.

**The mapping frame was built first and earned its place three times over.** Walking every function
on today's dock, HUD, rail, quest strip and gestures — plus everything the world map is the only
door to — turned up three things nobody had named. **The Apothecary loses its dock button and doc
36 never mentions it**; it survives on the tab pill row it already shares with Upgrades and Shop, so
it is two taps rather than lost, but that is a demotion and the owner should make it. **The map's
locked land parcels have no new home at all** — a promise about land, drawn on a surface that is
going away; recommended dead, deliberately. And **the `stores` sheet is already opened by nothing**
and a card cell in the album is already a button with no handler; both are recorded in doc 11 rather
than silently "preserved" into the new dock.

**The band costs the layout nothing, and that is the finding the whole phase rests on.** `.stage`
already reserves a yard along its bottom for the creatures — 108px at 390×844, 91px at 700. The
owner's two floating buttons move into the two ends of that same strip. No new grid row, and the
board measures 370×370 before and after. The pedestal is *taller than the dock row* with
`align-items:end`, so the raised Garden button rises out of the top without changing row 5's height
— which is what stops a fifth button wrapping onto a second row, the exact bug `grid-auto-flow:
column` was introduced to fix.

**Every measurement in the spike is read off a frame that is really that size, and self-review
still caught three wrong numbers after the first push** — five dock buttons at 360 are 64px, not the
81 that was four buttons' arithmetic; the HUD's spare width is 61px, not 22, once it is only two
wallets; and the docked panel does give up 100px of height, because lifting today's 660px sheet
clear of the dock would push its top edge into the wallets. Two frames were also wrong the first
time and both were caught by measuring rather than by looking: the 360 frame was a
390 frame with a smaller board drawn in it, and the 700 frame was not 700 tall. Worse, the chassis
inherited from the phase-2 and phase-3 spikes is `box-sizing: border-box` with a 5px phone frame, so
**every frame in all three spikes has been 380×834 of usable area rather than 390×844.** Fixed here
with `content-box`; the older two are left alone.

**The HUD wins something back.** `style.css`'s `max-width:430px` block shaved every round button to
40px and wrote the cost down in prose — three wallets at 222px plus three 44px buttons plus the gap
came to 374px of the 370 available, four pixels over — and named the real fix: one fewer HUD button.
This phase retires two (the meter pill into the Turn button, the album star into Cards), so the HUD
is two wallets and two buttons and **44px touch targets come back even at 360px wide.**

**The Turn button's fill rises rather than wipes.** The pill it replaces wipes left-to-right across
just **39px** — it is the narrowest thing in the HUD, being the one pill with no number — so a wipe
is not too narrow so much as out of room: rising has 56px of button height to travel instead. It
reads `yearProgress()`'s existing `min(seeds, coins)`, so nothing in the engine changes. From year
two it also carries the pouch count, which is a **promotion rather than a new readout**: the number
already exists in the projection pop, the Almanac's seed-row header and the ceremony, and has simply
never been on an always-visible surface.

**Corrected on the adversarial pass, before the owner read them:** the fill's ready ring is not "the
breath every affordable price uses" — it is the *full pill's own* ring, worn today by exactly one
thing in the game and meaning exactly one thing, which is a better argument than the one first
written; the dock button is 70×56 at 390 and 64×56 at 360; retiring the rail's track buys back 6px
of stage, not 12; and the board's 2px overhang at 700 dates from the creature yard on 17 August, not
from Fall.

**Rejected: opening the ceremony straight from the dock button.** It is one tap closer and it makes
the button useless for the other fifty weeks of the year. The panel behind it holds the pouch, both
gates and petal spending, which is worth the extra tap.

**Rejected: hiding the power-up button when nothing is held.** The standing rule is *hidden, never a
dead button*, but this game already has a better answer for "a thing you do not have yet" — the
locked season edge, which wears the drained paper and the turn that opens it, because a gate is a
promise you can read. Hidden also breaks the sketch's symmetry in the first session, when the band
is two buttons and an empty lawn. Proposed as a quiet drained slot whose tap says where boosts come
from. **This is a gate question and the owner may overrule it in one class.**

**Rejected: putting the two doors in the middle as a pair,** which is how the phase-3 spike drew
them. The middle is where the sketch puts the creatures and where the pedestal rises into; the pair
lands on the pedestal's shoulders and pushes the creatures to the sides. The corners keep the burrow
door exactly where it already is and make the meadow's door its literal mirror. **Drawn both ways
in frame 4 — this is the one composition question the sketch cannot settle.**

**The rail keeps its clock and loses only its shop.** Doc 36 retires "the rail's boost chips", and
the chips a player *taps* are the ones that move. A running boost's countdown and the Wonder chip
stay, because the button is the shop and the rail is the clock — which also keeps *a running boost
cannot be refreshed* true by construction, since the used boost leaves the button the instant it
starts. The eligible pool for the slot is therefore **held AND not currently running**: draw from
held alone and the button will eventually seat a boost whose tap does nothing, because
`activateBoost` returns false and the click handler's success branch never fires.

**Year one is the one place this dock could break a rule.** A Turn button in the dock is a door a
player will push in the first minute, and doc 32 is explicit that year one is a mystery. So the
year-one panel is the meter drawn large, the flower's existing line, and nothing else — no pouch, no
gates, no petals. The explanation still arrives where it always did, in the ceremony's ask.

**No economy knob or rule moved.** The blessing, `mintK` and every open decision in doc 11 are
exactly where they were.

---

## 2026-08-29 (phase 3, the gauntlet) — Six critics, and the gate's only button was dead

Six adversarial critics over the strip and Fall — the mandatory grammar critic, visual fidelity
against the spike then doc 05, gesture and layout, whether Fall's surface tells the truth about
Fall's rules, correctness, and the house traps. **Two blockers were found by more than one of them.**

**THE BLOCKER: the bed chip read the clock instead of the engine's marks.** `checkFallWindfall()`
marks every eligible plot once per fill and refuses to mark again while any mark is unspent — so a
bed that is planted and ripe is *not* necessarily a bed that will pay. Harvesting one marked plot
and replanting it (the natural per-plot flow, and the exact player the 1.2 latch fix was written
for) left the chip gold and promising +50% on a plot that could never be marked; and collecting one
marked plot dropped the rim off the seven that *were* still owed. Fall's one rule, told wrong in
both directions, on the object built to tell it. The surface reads `cell.windfall` now, every marked
plot wears a gold ring, and the chip counts them.

**THE SECOND BLOCKER: the gate's "Back to the garden" was inert** — `.in-gate` shipped with the
`display:none` half of the place-layer pair and not the `pointer-events` half, so `.ui` ate every
tap on the only visible control on that screen. The trap is already in the handoff, written for the
meadow. It has been rewritten as an instruction: **whenever you add a `.in-something` block, copy
both lines.**

**And a third that only a critic with a second finger would find: a two-thumb tap changed season.**
The swipe kept one pair of origin variables with no `pointerId`, so a second thumb overwrote the
origin and the first thumb's release measured the gap between them. On a 390px phone two thumbs sit
~250px apart horizontally and a few pixels apart vertically — and the core loop is rapid two-thumb
tapping. Harmless on the vertical axis for a year; a season change per double-tap the moment a
horizontal one existed.

**Fall was built and never registered as a room.** No `.in-fall .coach{display:none}`, so the coach
mark re-fired on the 0.6s tick, measured the garden's hidden flower and parked over the coin wallet
in every Fall screenshot. `critterStage()` had no Fall branch either, so a creature arriving while
the player stood in Fall — which is what Fall's hour clocks *ask* them to do — celebrated from the
top-left corner. And the flower binding lived inside `buildBoard()`, which runs once, while `leave()`
cleared it every time: from the second visit on, every coin, float and speech bubble fired from the
origin.

**An empty Fall cell read as more planted than a planted one.** The empty mark was `sprout` — the
glyph that means *a seedling is growing* — at 46% with a contour and a drop shadow, while a stage-1
crop was a small leaf bisected by a cream progress track. Doc 05 records why `plantSpot` replaced a
seed shape on empty plots: a dashed square reads as *put something here*. Fall now uses it, and the
bar took the garden's dark track and position so a 0% bar vanishes into the soil.

**A season's scene has two visible bands, not one canvas** — the phase's own lesson, now a trap in
the handoff. Fall's horizon, hedge line, stubble and both orchard trees were composed into the band
the board covers, so the only strip a player could see was a flat colour field. And its ground
painted a dark band to the very bottom of `.game`, which is the one thing the status-bar work
forbids: that darkening is what made a short window read as a *cut* rather than as ground.

**The cell floor was an opaque rect over a properly built gradient** — the inset-shadow trap's
cousin: a flat fill on top of the plot's own three-stop body. It is a gradient now, and the
blemishes ride it.

**Fall's appointment had no bell.** Nothing outside Fall said the bed was ripe. The edge tab carries
the dock's attention dot now; the welcome-back half is not done and is named in docs/11.

**Also:** the Turn's ask enumerated everything the Turn takes and keeps and Fall was in neither
column — including the fortnight plant whose whole promise is that a Turn cannot touch it; the
Century Bloom's 14 days rendered as "336h" in the pill read before committing two million gold;
"bed" meant the plot in one sentence and the board in the next; every unlocked season tab wore an
autumn leaf, including SUMMER; and `sizeFallBoard()` was wired to `window.resize` only, so the rail
collapsing or expanding left Fall's board overhanging its frame until the next visit.

## 2026-08-29 (phase 3, the strip) — A season is the same room in a different month

**The architectural decision the whole phase rests on: Fall is not a place layer.** The Hollow, the
meadow and the map are rooms you leave the garden to visit — siblings of `.ui`, each hiding its
chrome, each having to re-state the 560px column. A *season* is not that. `.stage` swaps its frame,
the scenery swaps behind it, and the HUD, the quest strip, the rail and the dock never move.

*Why it matters beyond tidiness:* it is "share the grammar, never share the verb" taken literally. A
player walking sideways into Fall keeps every control they already know; the only things that change
are the material, the clock and the rule. It also means nothing in Fall re-states the column,
because nothing in Fall leaves `.ui` — the trap that made the meadow read as a different, worse game
until `.mw-ui` was written. *Rejected:* a `.fall-layer` at z-index 13 beside the meadow, which is
the pattern the codebase already had and would have been faster to write. It would have meant
re-declaring the column, re-declaring a dock, and hiding the shops in a garden.

**A season is reachable when its Turn has passed AND its garden exists**, and the gate says which of
the two is holding it. Winter and Spring are slices C and E; a Turn-5 player standing at Winter's
gate must not read "Opens at Turn 3". Two words of copy, chosen from `seasonTurned()`.

**The gate is a screen, not a refusal.** Swiping onto a locked season shows it: a real sky, a hedge
across it, a padlock, the turn that opens it, one drifting leaf, and the way back. You can always
walk up to a locked gate — that is what makes it a promise rather than a wall.

**The season edges are absolute, not grid items, and that cost a debugging pass.** As
`grid-row: 4` with an auto column, an explicitly-placed item forced the next auto-placed item
(`.stage`) into an **implicit second column**: the interface halved, the dock squashed into a corner
and both tabs stacked on the left. Absolute against `.ui`, clear of the dock, they cannot touch the
row layout. *And they sit low rather than centred* — centred they land on the board, and the board
is the thing this game is.

**The bed chip is Fall's whole rule as one object**, in four states ending in the board itself taking
a gold rim. The near-miss state names a **wait**, not a count: *"one more in 4m"* rather than *"7 / 8
ripe"*. A count is a status; a wait is an appointment, and the appointment is what doc 32 wants Fall
to be. Its pulse lives on a pseudo-element, because `affordPulse` writes `transform` and the chip is
centred with `translateX(-50%)` — the same collision family as a state modifier that writes
`box-shadow` and silently eats the lip.

**Two house traps, both stepped in and both caught by looking at the picture.** The per-cell render
cache was seeded with `''`, and an empty plot's wait text *is* `''` — so the first write never fired
and an empty capsule painted on every ripe plot. That is the documented `dataset.look` trap, one
field over; the cache is seeded with `'?'` now. And a `display:none` written *after* the rule that
shows it still loses on specificity, so the growth bar painted on empty plots.

**The hedge lost its blossoms.** `UI.hedge()` is used at two very different aspects — a 42%-wide
card panel and a full-width gate screen — and `preserveAspectRatio="none"` turns any circle into a
tell-tale ellipse. The lumps and the bands survive stretching; a circle does not. The gate tiles two
copies rather than stretching one, for the same reason a backdrop is never sliced.

**Crops are not drawn like flowers.** A berry on a stem, a gourd, an ear of wheat — never a radial
bloom. The rule doing visual work, so the board reads as another kind of garden before a single
label is read; and the row carries three stat pills where a seed row carries five.

**What was deliberately NOT done, on the owner's overnight call:** the map, `overworld.js`,
`ui-map.js` and the camera are untouched and the dock still says World. Both navigations work, which
is doc 34's rail — *never a push where neither exists*. The blocker underneath it is that **the Wild
Meadow's only door is the map**, so retiring one strands the other; that is the first item of phase
3's remainder, in [11-known-issues.md](11-known-issues.md).

## 2026-08-29 (phase 2, the gauntlet) — Eight critics, and the ask was lying

Eight independent adversarial critics over the built phase — visual fidelity against the spike then
doc 05, layout against doc 08, spec against docs 32/33/34/11, correctness, the house traps, grammar,
accessibility and motion, and state/saves. **Three of them independently found the same blocker**,
which is the strongest signal the ladder produces.

**THE BLOCKER: the ask told the player the Turn was free.** `turnAsk()` built its cost line from the
grid alone, so a tidy player who harvested the board clean — the *careful* play — read *"This Turn
costs you nothing at all"* and then lost their gold, every badge level, their held boosters and
plots 5–8, atomically and with the sheet locked against dismissal a beat later. The engine was
right; doc 32's clears column is exactly what `turnYear()` does. The screen whose entire job is
informed consent was the part that was wrong, and it was wrong in the branch a careful player is
*most* likely to hit. The ask now carries two labelled rows — **this year goes** (gold, badges,
boosts, the big plots, whatever is still growing) and **these stay, always** — and the
"costs you nothing" branch is deleted. *An irreversible commit may never understate its own price.*

**The mystery meter did not exist.** `turnsCompleted` appeared zero times in `ui.js`: there was one
pill state and one popover, so a first-time player's first tap explained the whole prestige system —
increment, both gates, the pouch. Doc 32's introduction rule is "year one: nothing, unexplained; the
mystery is the tutorial", and docs/35 had claimed the mystery was preserved because the pill carries
no number. The popover gave it away. Before the first Turn the pill now answers in the flower's
voice and no numbers at all.

**The season tint was a clock that stopped a quarter of the way through the year.** Both Turn gates
are met at roughly 100K earned; doc 33 targets 370–410K for year one. Driving the tint off the
meter's own fill meant the garden finished ripening on day one and never moved again. The *pill*
still shows the binding gate — that answers "can I turn yet", which is its question — but the tint
now runs on `DATA.year.seasonSpan`, the year's own earnings. Two progresses, two questions.

**And the tint had two unpainted edges.** It multiplies over the whole scenery, but `theme-color`
(the iOS status-bar strip) and `--page-fill` (the strip below a short window) were still publishing
the untinted sky and lawn — the exact class of join doc 08 spends four bullets and three rounds of
layout work making invisible. The strip is now tinted by the same multiply in `seasonMix()`, and the
overlay is masked off its own last 44px, the same geometry `.meadow::after` and `.vignette` already
use.

**Two irreversible spends, two opposite rules.** The phase gave a 150K seed unlock a whole confirm
panel and gave a petal purchase a 27px button 6px from its neighbour — a mis-tap bought the wrong
skill, permanently. Petal chips are 40px with 10px between tracks now. The unlock confirm also froze
its own affordability: `syncAfford` re-synced the list row but not the ask, so a player who opened it
while saving up could never complete the purchase without backing out.

**The drained-paper family was carrying good news.** `--paper-dim` is this game's word for *asleep,
out of food, stopped working*. The spring beat was announcing "Daisy carries your blessing" on it —
the best fact on the screen, rendered as the deadest object in the frame. Grants and reassurances
take a cream band now; the drained one is kept for the actual cost.

**The gate card had no ground in it**, so the marigold hung in an orange void and the rotated hedges
ended on a hard diagonal — doc 05 check 3 verbatim, the meadow's own diagnosis one screen over. It
has a ground band with an ink edge, the bloom stands on a lighter pad with its shadow on top of
that, and the hedge's crown carries a contour so it stops reading as three flat bands.

**And the card said two contradictory things at once.** "Fall is open" sat beside a chip reading
"opening soon", because the feature check guarded only the chip. Both halves follow the same
condition now, and the gate stays visually *shut* until the strip exists to honour it — a card may
not draw an open gate onto a place you cannot reach.

**The HUD, again, and this time measured to the pixel.** `.wallets` was `flex-wrap: wrap`, so at
375px with a million coins and four figures of gems the meter dropped to a second row, the HUD grew
~46px, the `1fr` stage lost the same, and `sizeGarden()` visibly shrank the board — a layout that
reshapes itself as you earn, which is the one thing this row must never do and the thing the
numberless pill was chosen to prevent. It is `nowrap` now, and **the one pill with no number is the
only thing allowed to compress**: under pressure it gives up padding rather than the HUD giving up
its shape. Measured at 375×812 with "880.2K" and "1,163": one row, 40px tall, 8px spare.

**The round buttons are 40px on phones under 430px wide, and that is written down rather than
hidden.** Three pills at their realistic worst are 222px; three 44px buttons are 144px; 222 + 8 + 144
is 374 of the 370 a 390px phone has. Four pixels. The choice was a 40px control — a size this
stylesheet already used on short screens — or a wrapping HUD. Doc 08's accessibility section now
says so instead of claiming 44px. **The real fix is one fewer round button in the HUD**, which is a
navigation decision and sits with the owner in docs/35.

**Smaller, all real:** the petal float fired on a node `buyPetal`'s own `panels` emit had already
deleted, so "+1" appeared in the top-left corner (the documented confetti-from-the-corner trap, one
screen over); the projection froze the moment it opened and went on answering "why can't I turn yet"
with stale numbers; the ceremony's header narrated the flower's own line back at it 90px above its
mouth; the ask called garden plots "beds" fifteen seconds before the Tally used "bed" to mean Fall's
whole eight-cell board; the popover said "the ceremony", a word the player has never been taught,
where the game says "the Turn"; the keep-row chips carried six identical ticks where the same object
four beats later let the icon name the thing; the unlock price chip was twice the width of the go
button it replaces, so locked rows wrapped their stat pills and the picker's columns stopped lining
up; and ten new hex values shipped without the entry doc 05's fifth check requires — now three named
component ramps in that document, with the reason each could not reuse an existing value.

**Verified clean, and worth recording so it is not re-litigated:** the step machine survives a
`panels` emit mid-Tally; a triple-tap on *Turn the year* commits exactly once; `turnTimers` are
cleared on every reachable exit; the `sheetLocked` window cannot deadlock, because the scrim covers
`.ui` so neither the dock nor the pill can open a sheet during it; no old save can feed `undefined`
into the new reads; every new `box-shadow` state modifier restates its lip; and the mandated
`0 3px 0 rgba(` grep over the phase's whole diff is clean.

## 2026-08-29 (phase 2, the ceremony) — The Turn gets its surface, and the cosy rule gets enforced twice

**The whole of phase 2's remaining scope in one push, because it is one coherent thing:** a player
can now see the year filling, ask what it means, turn it, watch the Tally, and spend the pouch. Any
smaller slice would have shipped a currency with no sink or a sink with no currency.

**The meter pill carries no number, and that is measured rather than preferred.** Doc 32 asks for the
banked Saved Seeds on the pill. On the real metrics they do not fit: 360px of HUD, 132px of round
buttons at 40px, and three numbered wallets needing ~245px of the 220px left. `.wallets` is
`flex-wrap: wrap`, so the overflow is not an error — it is a HUD that **changes shape as you earn**,
appearing and disappearing as "84.2K" becomes "212K". Icon-and-fill fits at every wealth on every
phone down to a 375px SE, with both numbers one tap away. *Rejected for tonight, and the better
answer if the owner wants it:* move the album star into the Almanac and everything fits at the worst
numbers. That is a navigation change and it is the owner's, so it is parked in docs/35 rather than
taken.

**The fill shows the binding gate, not the seeds.** The Turn needs the increment AND the year's
earnings; a bar showing only the first would sit full while the second held the ceremony shut, which
is the worst possible reading of a meter. `min(seeds, coins)`.

**The projection shows the un-tallied increment and never the pouch.** Quoting the multiplied number
before the ceremony would spoil the Tally, which is the one piece of theatre the Turn has. Both gates
are drawn as tracks instead, because *why can't I turn yet* has to be answerable without a wiki.

**The ceremony renders from a step variable.** Every `panels` emit rebuilds the sheet body from
scratch — a ceremony animating out of its own markup would restart its fireworks whenever an
unrelated purchase fired. Rendering deterministically from `(step, linesShown, count)` means a
repaint reproduces the same frame. The corollary took a second pass to see: **only the newest line
may carry the entrance animation**, or every landing replays the whole list and the Tally jitters
instead of stacking.

**It cannot be dismissed between the commit and the total.** `turnYear()` is atomic and has already
happened by the time the count-up starts, so a stray scrim tap would cost the celebration with
nothing to undo. One early return in `closeSheet()` covers all three dismissal paths, and
`.sheet.no-exit` hides the controls that would invite the tap it refuses. *Rejected:* guarding each
path separately — three places to forget.

**A sheet at 94dvh cannot carry `#sheetArt`.** Found by building it: the breakout art sits above the
sheet's top edge, and at that height the top edge is 50px from the top of the screen, so the flower
clipped off. The ceremony draws its own flower inside the body. Named in the spike's notes and worth
keeping in mind for any future full-height panel.

**THE COSY RULE IS ENFORCED TWICE, and the second one was a real find.** The engine already refuses
to emit a Tally line the year scored zero on. But a year that scored *nothing at all* reached the
total and rendered **"×1.00"** — which is precisely the "you failed" row doc 32 forbids, wearing a
different hat at the summary level. A zero-scoring year now shows the pouch and no multiplier at
all. Caught by walking the zero-stats case by hand before the critics ran.

**The blessing picker filters capped flowers** — the carried-forward requirement from docs/11 — and
shows each flower's Rich Bloom pips, so the room you are filling is visible rather than implied.
*Rejected:* a "skip the blessing" button. It is free value, and an irreversible Turn that quietly
gave nothing is the exact failure docs/11 describes; the only no-blessing path is the
every-flower-capped panel, which says so in a sentence.

**The dashed price slot from the spike did not ship.** The spike reserved a line for a future
blessing price, which was the right thing to *draw* and the wrong thing to *build*: an empty dashed
box is a promise to the player, not to the developer. The layout leaves room; the markup does not
pretend.

**Petal tracks appear only after the first Turn, and only on a flower you have grown.** Doc 32's
year one is "nothing, unexplained". No teaser, no locked track, no stubbed signature — a row that
advertises an unbuilt thing is the quest-strip trap wearing a different hat. *The counter-argument I
could not settle:* nothing at all is also the version that gives a player no reason to open the
Almanac in year one.

**The season tint is a real layer, not a pseudo-element.** `.scenery::after` already carries the
weather, and `::before` would be the first child and paint under the sky. `.season-tint` sits after
`.vignette`; both are `multiply` and both can be on at once. Its two numbers are in `DATA.year`
beside the year's other knobs, labelled visual-only — **no economy knob moved tonight.** Observed and
left: over a night sky the multiply reads browner than at noon; scaling the tint by daylight is a
phase-4 question.

**`--seed` is the one new colour token.** The second currency could not borrow gold (coins), cyan
(gems), or any of blue/purple/gold (the rarity vocabulary). The pouch icon that carries it is
cream-bodied with green seeds, because the first version was green-on-green and vanished into the
meter's own fill.

## 2026-08-29 (phase 2, first push) — The wall gets a shopfront, and two refusals stop sharing one label

**Shipped first on purpose, and on the owner's call:** with no unlock surface, a brand-new save on
the live site could never plant past Tulip. That is the smallest, safest slice of phase 2 and it is
the one that unbreaks a fresh save, so it goes in before the ceremony rather than after it.

**A locked seed row is drained, not deleted.** The row it replaces was `grayscale(.7) opacity(.72)`
with a `Level N` chip read from the retired `unlockLevel`, which had been the wrong refusal since
the Garden Year priced seeds in gold. Two decisions inside that:

- *Why drained rather than hidden or greyed to nothing.* The row is an **advert for the thing you
  are saving 150K for**. If its cost, its clock and its yield range are not readable, the wall has
  no shape and the player has nothing to aim at. `--paper-dim` is what every other "not now" state
  in this game wears, and it says *not yet* without spending a hue.
- *Why the price sits where the go button sits.* One slot, one answer, down the whole list — the eye
  never has to search a second place to find out whether a row is buyable.

**It asks before it charges.** An unlock is one-time, permanent, unrefundable and the game has no
undo, so a mis-tap on a 150K row would be the worst tap in the game. The confirm costs one tap on
the happy path and names the price, the permanence and nothing else. *Rejected:* a long-press
(undiscoverable), and a floating confirm card over the list — a `panels` event rebuilds the sheet
body from scratch and would delete the question mid-answer, which is why the pending seed lives in
a module local and the ask replaces the whole panel.

**The toast says "yours for good".** The single fact a player cannot see is that unlocks survive
every Turn. A one-time price that reads as a per-year price is the likeliest misreading in this
phase, and one line of copy closes it.

**`Game.plotGate(idx)` — because two different refusals were wearing one label.** Plots 5–8 are held
by the Turn first and the level second, and after the Garden Year the level is usually not the
binding one — so a chip reading `Lv 3` on a plot the Turn is holding is a sentence the player cannot
act on, and it is what every fresh save saw all through year one. The accessor is read-only and
re-reads exactly the two conditions `plotAvailable()` already checks; the UI then says `Turn 1` on
the chip and *After your first Turn* in the deny float. *Why in the engine and not in `ui.js`:*
which gate binds is a rule, and `ui.js` does not do rule math. The suite asserts both arms, the
no-gate case, and that `plotGate` and `plotAvailable` can never disagree — 1,202 → 1,207.

**Green is what yes looks like.** The confirm's buy button was `.big-btn.magic` for about ten
minutes; magic is `#b197fc`, which is the Epic rarity's own colour, and doc 05 forbids borrowing a
rarity for something that is not a rarity. It is the house green now, the same green every
affordable price in the game already wears.

## 2026-08-29 (phase 1.3) — Round 4: no blockers, no live bugs, and the small-sample habit caught a third time

**The gauntlet's fourth round is the first with no blocker and no live engine bug** — 18
findings, 7 major, 11 minor, every one a coverage gap, a dev-surface wrinkle or a stale
sentence. Rounds 1–3 each turned up something that could bite a player; round 4 did not. That
is the shape of a phase converging, and it is the honest signal that the engine is done.

**The findings worth naming:**

**The per-cell windfall marks — the substrate round 3's whole latch fix rests on — were never
round-tripped.** Dropping them on load silently forfeits every pending windfall mid-collection;
forcing them pays +50% forever without the bed ever arming. Both directions are asserted now,
in both senses. **And `bedPaid` was still restored verbatim from the save**, so the mirror the
phase-1.2 entry called impossible to desync did desync across exactly one boundary — including
from every save currently live on the site, where the old sticky latch left a stuck `true`.
`load()` derives it now, honouring the Century exclusion like the rest of the bed math.

**Four of the five Tally lines had no test that could fail.** Only the orders line was pinned;
the rest rode on a maxed-year check whose `sum > 1` carried a third of the range in slack, so
any line could be deleted, wired to the wrong counter, or re-tiered and stay green. Every line
now has an exact multiplier at every rung, plus a one-below-the-rung check — this is the table
phase 4's tuning chair edits, and it needed a net.

**Two tests were asserting the right sentence while walking a path where the code never ran** —
the same shape as round 3's lesson, twice more. "A refunded purchase is not income" never
reached the refund: `upgradeMaxed` pre-empts `buyUpgrade` for every effect that can decline, so
the branch is unreachable through the real badges. It is now tested by making an effect decline
on purpose, and the refusal case is named honestly as a refusal. And `Dev.setYearStats` wrote a
`species` count that `load()` recomputes from `speciesSeen` and therefore discards — the canned
Tally quietly lost a line across a reload.

**The dev sheet blessed Daisy by name, and the review script walks straight into capping her.**
Following the five-minute script literally, steps 3 and 4 cap Daisy's Rich Bloom for 89 seeds
out of a pouch already holding 115 — after which every Turn taken from the sheet silently drops
the largest per-Turn grant in the game and the toast simply omits the word. It now blesses the
cheapest flower with room, names it, and says so when the blessing finds nowhere to land. The
repo already knew this hazard: `year-sim`'s `blessTarget()` carries a comment about it. The
owner-facing surface walked into what the tool was written to avoid.

**And the small-sample habit turned up a third time, in a third author's hands.** I quoted the
pacing tool's year-one figure from three runs and withdrew it; the mint commit quoted its margin
table and a bolded "stable ~1.9–2.2×" from a small sample, and a 30-run sample falls outside most
of its cells — `smart`'s minted seeds land 436–553 against a quoted 418–481. Restated as a
median with a range, with the ranges labelled as a 30-run sample and a line saying plainly that
**the tool's exit code, not the table, is the regression test.** Three people made the same
mistake in one day on the same tool; the lesson is not about anyone's care, it is that a
stochastic model invites point estimates and the only defence is to write the sample size next
to the number.

**Also swept:** `data.js` still documented the windfall rule the latch fix disproved and the
pouch-growth curve the cumulative mint deleted — the file the Unity port reads for the reasoning
behind each knob. HANDOFF still told every cold session that `year-sim` is *expected* to exit
non-zero, which inverts the pass condition after the ruling. Doc 34's hard out-of-scope bar
still claimed phase 1 leaves the live game playing identically, which docs 03 and 11 retire by
name. Suite 1,149 → 1,202; twelve mutations introduced against the new assertions, twelve
caught.

### Rejected

**Re-running the margin table at 30 runs to quote fresh brackets** — that would repeat the
error at higher precision. The direction is robust and the exit code is the test; the table
says so now. **Fixing the blessing's economics** — still the owner's open decision, and this
was a dev-surface bug about *which flower gets blessed*, not about what the blessing is worth.
**Phase 2's blessing picker** — a real note (the ceremony must filter capped flowers, since the
Turn is atomic and a blessing cannot be re-offered) but it is design work behind phase 2's
wireframe gate, so it is carried forward rather than built.

---

## 2026-08-29 (phase 1.2) — Round 3 finds a live Fall bug the tests were shaped to miss, and every refusal gets a test

**The gauntlet's third round was the one that found a real gameplay bug**, not a coverage
gap — and it found it in the system two rounds of critics had already been over.

**Fall's windfall latch stuck permanently the first time a player replanted mid-collection.**
`bedPaid` was cleared in exactly one branch: when the bed fell *simultaneously* empty. A player
who harvests a plot and immediately replants it — the natural per-plot flow, and the one phase 3
will ship — never empties the bed, so the latch stuck and **every subsequent full ripe bed was
silently refused its windfall for the life of the save.** Measured on the shipped engine: five
consecutive full, ripe fills paid **one** windfall, losing 11,200 coins on the second fill alone.
It survived the Turn (Fall is correctly never touched) and survived save/load, so once stuck it
was stuck forever.

**The fix is to stop keeping a flag and start deriving the latch.** A fill is still being
collected exactly while some plot carries an unspent windfall mark; the moment the last mark is
spent the bed is free to arm again. `bedPaid` survives as the saved *mirror* of that derivation,
recomputed on every arm and every Fall harvest, so it cannot desync. Ripeness moved to
`plantedAt`/`grow` in the same change: `checkFallWindfall()` was reading the cached `ready`
flag, and `load()` rebuilds every Fall cell with `ready: false` — so the comment promising that
"a bed that completed while the tab was shut still pays" was not true, and now is.

**Why three rounds of critics missed it, which is the more useful lesson: my own bill-12 group
harvested the entire bed before replanting.** That is the one flow that *did* clear the flag. The
test asserted "a replant mid-collection joins the next fill" and then never ran a second fill.
A rig can assert the right sentence and still walk the one path where the bug does not appear.

**Every gate now has a test from the NO side.** Round 3's mutation pass found that both gardens'
ripeness gates and three of Fall's four purchase gates had no negative test at all — every rig
ripens with `plantedAt = clock - 9999` and plants with a full wallet into an empty cell, so the
*refusal* half was never exercised. Deleting a gate turned the game into an unbounded gold
printer with the suite green: plant-and-harvest in the same instant, one Fall plot filling the
mint's entire coins floor in zero elapsed time. Same for the Saved Seeds sink — `buyPetal` could
be made free, or buyable at zero seeds, or have its per-petal ratio deleted (sink 636K → 388K)
— and for `passiveIncomeRate()`'s unlock guard, whose removal paid a fresh save ~21× its
legitimate offline rate, and which has no second line of defence the way the online twin does.
Thirteen mutations introduced, thirteen caught. Suite 1,129 → 1,149.

**And bill 12b was silently order-coupled** — it read a running windfall count carried over from
the group above it, so inserting anything between them moved a number it asserted. Made
self-contained. A test that depends on where it sits in the file is a test an unrelated edit
will break.

**Three corrections to my own phase-1.1 documentation**, all found by round 3's docs critic:
the "reproduces doc 33's 370–410K first year" claim rested on **three runs**; a 120-run sample
puts the median at ~355K with quartiles 309–386K and only about a quarter inside the band, so
the claim is withdrawn and the band is restated as the design target. Bill item 8 still carried
the pre-correction "stays above the 0.3 floor" wording 140 lines below the row I had corrected.
And the 725,067 total sink is not derivable from `data.js` at all — there are no signature petal
counts in the data, so any total assumes them, and four of doc 33's own launch six take fewer
than three; only the 636,378 shared-skill figure is real, and it is the one pinned by a
sim-test. Also fixed: `docs/02`'s load-order table had been five files short since 2026-08-25
(the Stand, map and meadow files), the second time that table has gone stale the same way.

### Rejected

**Deleting `bedPaid` and deriving the latch purely at read time** — it is a saved field that
phase 2 and 3 will render against, and another session had just documented it; keeping it as a
recomputed mirror fixes the bug without a save-shape change mid-flight. **Fixing the blessing**
— it is the open owner decision and a ceremony beat, not mine to tune. **Re-running the pacing
tool's headline numbers as proof of the band** — the 120-run distribution is the honest answer
and it says the tool does not reproduce the band; overclaiming it once was enough.

---

## 2026-08-29 (phase 1.1, the ruling) — The mint becomes cumulative, the exploit dies by construction, and the blessing inherits the problem

**The owner ruled on the mint: cumulative.** This is the second of the two conditions phase 1's
independent review left open, and the recommendation it made after measuring four variants
through the real engine. The mint is now:

```
pool      = mintK × sqrt(state.lifetimeCoins)      // lifetime earnings, ever
increment = pool − state.mintedBase                 // what is left to draw
pouch     = round(increment × tally)
at the Turn: state.mintedBase += increment          // the UN-TALLIED increment
```

Two new top-level fields, neither of which ever resets: `lifetimeCoins`, fed by `credit()`
beside `year.coinsEarned` under the same cheat/refund exclusions, and `mintedBase`, the ledger
of un-tallied seeds already drawn. `DATA.year.veterancy` is **deleted**, not capped — the
review proved that re-attaching any per-turn multiplier to a split-neutral base re-arms the
split at 1.3–1.4×. `minSeeds` now gates the **increment** rather than the tallied pouch,
because the increment is what the Turn actually spends from the pool; gating the tallied
number would let a good year's fireworks buy entry to a Turn the pool cannot pay for.

**The exploit is dead, and dead by construction rather than by tuning.** `node
tools/year-sim.js 12 all` exited non-zero for a day and now **exits zero**: normal play beats
turn-at-every-gate on Saved Seeds by a stable ~1.5–1.6× across runs (832–967 against 563–610
at day 10) and on gold as well. *(Re-measured later the same day, after the Fall session
corrected `bestFallCrop` — it had planted wheat forever, off the 1.4×/hour curve. Giving the
adversary the better crop made it stronger and the margin **widened** to ~1.9–2.2×, 883–956
against 418–481. The tables in docs 33 and 11 carry the newer figures; this paragraph keeps
the ones this commit was judged on.)* The sum of every Turn's draw is the same number however the
year is sliced, verified end to end at 1→64 chunks. **The first Turn is unchanged** — a first
year *is* the lifetime — so doc 33's ~60–65 seeds on a ~370–410K year survives untouched.

**Two costs, both measured rather than estimated, both filed rather than fixed.**

1. **The lifetime seed supply is now hard-bounded** at `0.1 × sqrt(lifetime)`, where veterancy
   previously let it grow without limit. The 636,378-seed shared-skill sink needs **4.05 ×
   10¹³ lifetime coins** — about a million days at the measured ~40M/day; a whole year of play
   opens ~12,000 seeds. Doc 33's **"every Turn affords a similar 2–5 petals forever" is now
   false** (the tool measures 1 of 5 Turns in band against 4 of 7 before). The review named
   this cost in advance and assigned it to phase 4's chair; `mintK` is the knob, doc 33 says
   these two exponents tune together or not at all, and re-pricing wants playtest data.
2. **The blessing inherited the exploit.** With the base split-neutral, the one free Rich Bloom
   petal per Turn is now the largest per-Turn grant in the game and nothing prices it. Driven
   through the real engine: **95 Turns fill every flower's Rich Bloom ladder — 318,189 Saved
   Seeds of value, exactly half the shared sink — for ~101M lifetime coins, about 2.5 days of
   play**, while the mint pays 997 seeds over the same span. It is pre-existing; what changed
   is that the mint no longer dwarfs it. `year-sim` now splits **bought** petals from
   **blessed** ones and discloses this beneath the verdict rather than failing on it, because
   the exit code answers the question the owner ruled on and the blessing is a designed
   ceremony beat. Logged as the new open owner decision in
   [11-known-issues.md](11-known-issues.md) with four dials named and none taken.

**The suite went 1,096 → 1,129**, and the new group is bill item **17b** — the cumulative mint's
own properties asserted directly rather than inferred from the pacing tool's exit code:
veterancy absent from the data and turn count moving no part of the projection, the pool
unmoved by the year's own earnings or the wallet, four Turns drawing exactly what one Turn
draws, a drawn pool refusing a fresh 150K year, a maxed Tally paying *over* the pool rather
than out of it, both migration arms, and the negative clamps.

**Mutation-proven, twelve of twelve.** Every regression the shape invites was introduced into a
scratch copy and the suite watched: ledger moving by the pouch instead of the increment, the
gate reading `.pouch`, the pool reading the year instead of the lifetime, `credit()` forgetting
or over-feeding the ledger, the Turn resetting either ledger, a per-turn multiplier re-added on
the pouch *or* folded into the Tally, the ledger floored to an integer each draw (a slow leak),
and the draw taken before the in-flight harvest is credited. **Four survived the first pass and
are now closed**: a refund reaching `lifetimeCoins` (bill 4 asserted the exclusion on the
year's accumulator only — and the year's washes out every Turn while the pool's is permanent),
and the three load-time guards on hand-edited ledgers. **Writing that last test found a real
defect in this patch**: `Number.isFinite(Number(null))` is `true`, so a `lifetimeCoins` that
JSON had flattened from `NaN`/`Infinity` to `null` passed the guard as `0` and silently zeroed
the pool instead of inheriting the year. The guard now demands an actual number.

**Task 2 of the phase-1.1 brief was already done** and was verified rather than redone: the
M09 mutant (gut `migrateYear()`'s condition so every seed unlocks free) was re-applied to a
scratch copy and the suite went red on both arms — *"and a seed with NEITHER evidence stays
walled"* and *"a modest save is NOT handed the whole ladder"*, the latter naming Eternal Crown
explicitly. Re-verified after the mint changes.

**Migration.** A save that already carries a `year` but no ledgers — everything phase 1 wrote,
the owner's own included — is not a `migrateYear()` case, since its `year` key exists; it is
handled in `load()`'s field rebuild, taking `lifetimeCoins` from the sanitised
`year.coinsEarned` and `mintedBase` from zero. That year is therefore drawn exactly once, at
the same pouch the old per-year formula would have paid it at zero Turns. A save that had
completed Turns gets a one-off draw on its current year: generous by at most one year's pouch,
bounded, and correct in the only available direction, because no honest lifetime figure exists
anywhere in the save to reconstruct.

### Rejected

**Tuning `mintK` to restore the 2–5 petals band.** The ruling was about the mint's *shape*;
re-pricing it against the petal ladder is a different decision, wants playtest data, and is
explicitly phase 4's — the review said so when it recommended the shape. Doing it in the same
patch would also make it impossible to tell which change moved the pacing. **Failing
`year-sim` on the blessing.** The brief asked for the tool to go green on Saved Seeds and it
does; the blessing is a ceremony beat, so silently widening the exit-code criterion would be
this session overruling the owner on a design question. Disclosed in the report instead —
which is the same fix the gauntlet applied when it caught the tool declaring "unprofitable:
YES" while rush was winning in its own printout. **Capping the blessing, or making it once per
year.** Both are real options and both are the owner's; phase 1.1 measured the problem and
changed nothing. **Taking the peer session's Fall windfall-latch bug into this commit.** It is
confirmed and real (`bedPaid` never clears for a player who replants as they harvest), but it
is a different system with a different fix, and bundling it would blur what this commit is for;
the phase-1 builder session takes it next.

---

## 2026-08-29 (phase 1.1) — The review's condition closed, round 2 of the gauntlet answered, and the exploit turns out to be seeds-only

**Phase 1.1 is the patch the independent review made a condition of its approval, plus round 2
of the builder's own gauntlet** (four fresh critics, 39 agents, 21 confirmed findings after
adversarial verification). The suite went 1,051 → 1,096 and every fix was mutation-proven: 16
regressions introduced into scratch copies, 16 caught.

**Condition 1 is closed — M09, the grandfather migration's missing negative.** The review found
that gutting `migrateYear()` so *every* seed unlocks free on any pre-Year save left all 1,051
assertions green: bill 13b asserted only positives, so nothing said a modest save must NOT
receive the ladder. Three cases now separate the two arms and assert the negative — the
discovered arm alone at level 1, a seed with neither evidence staying walled, and a 400-coin
rep-5 save getting exactly its old level-5 catalogue rather than all nineteen. Both mutants die.

**Round 2's own blockers, both about rigs that never exercised the path they claimed to cover.**
Bill 1 proved the partition only on a Turn that collected nothing — the in-flight arm
(auto-collect, pack-banking) runs *before* the mint, so 19 of 20 wipes in there passed. The rig
is now a function run twice, the second time with a ready bloom, a parked pack and a growing
annual; the harvest's legitimate lifetime writes are named in a list rather than excused by a
loose comparison. And bill 2's "paid into the year BEFORE the mint" was arithmetically blind:
it predicted the pouch from `sqrt(200000 + 70)`, which rounds to the same integer as
`sqrt(200000)` — the auto-collect's gold could vanish entirely and the assertion held. It now
asserts the gold through the Turn's own `earned` field. Same family, all fixed: bill 1's rig
left 18 of 21 badge keys and two tap fields at defaults (a Turn sparing the drone, the
harvesters or the proc badges passed; so did dropping the `critMult` and `holdInterval`
re-derivations, which would hand out a permanent free maxed crit and hold speed), bill 3 spent
through one sink of six, a refused Turn was never asserted to leave the save alone, and the
windfall's "all eight *planted*" half was only covered by another group's rig by accident.

**The pacing tool never bought the game's automation, and that changed the exploit's shape.**
`MODEL.badges` omitted the drone, the harvesters and both offline badges, and
`passiveIncomeRate()` short-circuits to zero without a drone — so the model measured an idle
game with its idle half switched off, and bill item 10 had no pacing evidence behind it at all.
With automation in: **casual now out-earns the turn-spam cadence on gold by ~2.7×** (42.3M vs
15.5M by day 10) while still losing to it on Saved Seeds by ~20×. **The exploit is a seeds-only
break** — the gold half of the earlier disclosure is withdrawn, which narrows the owner's dials
to the mint's shape rather than the coins floor, and independently corroborates the strategy
session's recommendation of the cumulative mint. The same fix moved year one to 370K / 409K /
312K across three runs, **reproducing doc 33's 370–410K band from the shipped engine for the
first time**; the first Turn still lands at day ~1.75–1.9 against a documented 2.7–3.3, which
is turn-policy sensitivity and stays phase 4's.

**Numbers recomputed rather than quoted.** The petal sink is **636,378** Saved Seeds for the
shared skills (the whole sink reachable in phase 1) and **725,067** with signatures — not the
design session's ~525K/~679K estimates, which predate the constants landing. A sim-test now
pins it, which is what doc 33's own preamble asked for.

**Docs-truth, the half the critics were right to be pedantic about.** Doc 32's Tally worked
example — the block a phase-2 builder builds the ceremony from — disagreed with the engine on
four of its five lines, and its species line was unreachable under *either* tier-reading;
corrected to what `projectedTally()` produces, with the one always-correct line (47 orders →
×1.25) called out as the evidence that settles cumulative. Doc 32's petal rule 4 and doc 33's
guardrail both claimed Quick Sprout is "bounded well inside" the 0.3 floor when the truth is
that the stack reaches 0.294 and `plantGrowth()` clamps it — restated, with the last-petal
waste logged for phase 4. "The live game looks and plays identically" is retired as a claim: it
holds for the *look*, and docs 03 and 11 now name the three behavioural differences a migrated
save actually gets. Plus the mechanical ones: `docs/README.md` still told a cold reader all
three Year docs were unbuilt, the add-a-seed playbook still produced a seed no player could
plant, three docs still quoted 837 assertions, HANDOFF still said a 13-item bill, doc 16
presented retired mastery coverage as live, and doc 03's driver list omitted the unlock button
the review script points the owner at.

**And the review script's step 2 does not work on the owner's own save** — the "Unlock the next
seed" button finds nothing to sell once migration has grandfathered everything. The script now
says so and sends the owner to a private window to feel the wall as a new player meets it.

### Rejected

**Re-tuning the mint now that the exploit is better understood** — it is still the owner's
ruling, and the recommendation on the table is the strategy session's, measured across four
variants. **Sizing Quick Sprout to sit inside the 0.3 floor** — that is a tuning decision with
a pacing cost, and phase 4 owns it; phase 1.1 documents the clamp truthfully instead.
**Deleting doc 16's retired mastery sim-test list** — struck through and annotated instead, so
the retired design stays legible next to what replaced it.

---

## 2026-08-31 (project) — The garden moves to Deep Forest Labs, history intact

**The repo's new home is `github.com/Deep-Forest-Labs/GardenofWonder`** — created in the owner's
Chrome session, then given the complete story: every commit since 2 August, both branches, both
tags. Nothing was transferred, so nothing was lost: the old repo at `jonishua/gardenwonder`
stays where it is (the owner ruled the testers and their saves need no bridge — old saves live
in the old address and a fresh start is acceptable), and `main` now tracks the org repo as its
one true origin, with the old remote kept reachable as `legacy`.

**The move surfaced a repair worth recording:** the repository had never been garbage-collected
— every object in a month of work was loose, which is why the first pushes hung for minutes. A
whole month of game and documentation packs to **3.2 MiB**. Aborted-push debris was cleaned and
the pack now exists; future clones and pushes are seconds.

**Still to flip:** GitHub Pages on the new repo (Settings → Pages → main / root), which brings
the new live URL — `deep-forest-labs.github.io/GardenofWonder` — into being. Doc references to
the old addresses are updated in this commit; the memory notes carry the new remote.

---

## 2026-08-30 (project) — Everything is kept, and the bible will one day be published

**The owner's standing intent, recorded:** the whole body of work — every numbered doc, every
spike in `tools/`, the decision log, the pitch artifact, the enforcement and pacing tools — is
**kept permanently and will eventually be published as a styled wiki**: a public record of how
much work went into the game, and the reference the Unity team builds from. The house already
practices the policy that makes this possible — superseded docs receive status notes and are
never deleted, spikes stay in `tools/` after their features ship, and the log keeps the
reasoning git cannot.

**One preservation gap found and closed the same day:** the Garden Year pitch — the visual
document the whole prestige direction was sold and refined on — lived only as a hosted artifact
plus a session-temporary source file. Its HTML is now committed as `docs/garden-year-pitch.html`,
served straight off the repo like everything else.

**The publication itself is a future phase, deliberately not now** — the corpus is consistent,
cross-linked markdown, so a styled wiki is cheap to generate whenever the moment comes. Worth
noting from the strategy pass: in the current climate, a hand-written 25,000-line design bible
with its receipts attached is not just documentation — it is the exact proof-of-hand this
audience rewards, and publishing it is marketing.

---

## 2026-08-30 (design) — The Sky Pass: weather gets staged, and a motion gate guards the feel

**The owner's pick from the weather brainstorm:** the full Weather Ladder plus fronts, the world
acknowledging, the music rearrangement, and the two math nudges — specced in
[41-weather-staging.md](41-weather-staging.md). **The grounding audit found the gap plainly:**
weather carries 20–30% of all income under test, and each state's entire presentation was one
flat colour fade — no sound exists for any weather, nothing on the board reacts, and Wonderfall
never received the Wonder veil doc 18 promised it. The Wonder Effect stages on nine channels;
the sky it names stages on one. The staging grammar came from the games that do this best:
foreshadow → transform in layers → legible payoff → graceful end; rearrangement for common
skies, takeover for the rarest; existing things reacting beats new particles.

**The rule the ladder runs on: rarity buys layers.** Rain moves three channels, Wonderfall all
of them, and nothing fires on Clear→Clear — the 70% silence is what makes the rest events.

**Math kept honest:** two nudges only, both data-knobbed and sim-asserted — rain waters (+10%
growth while raining, the Stardew gift-you-can-see) and the aurora brings the night (isNight()
true under ribbons, waking Nightbell and Luna, with an epsilon assertion on Nightbell's expected
value). **Storm-crits cut** — one sky, one message. The mutation income share may not move.

**A new gate joins the process: the MOTION GATE**, the wireframe gate's sibling — the owner's
words: *get this right the first time.* The builder's first deliverable is a motion stage
(`tools/sky-spike.html`) where each sky's whole sequence plays on demand **with sliders on the
values the feel depends on**; the owner tunes by hand, the spike prints the chosen values as a
copyable block, and those numbers enter `data.js` verbatim. No sky integrates before its motion
is approved.

### Rejected

**Storm-crits** (legibility). **The petal-recolour in this round** — not picked; it stays filed
where the film pass left it. **Fronts on every slot change** — only a real incoming sky earns
one; four cues an hour is noise, which doc 18 knew from the start. **Letting the stage write
game state** — staging is presentation; the two nudges live in the engine.

---

## 2026-08-30 (rulings, polish) — Seven polish calls from the owner's play, before the strategy talk resumes

**All seven are the owner's, from playing the live build.** Recorded here as the spec for the
polish round; the prompt carries the detail.

1. **The Turn button under-announces its biggest moment.** The pulse is fine and not enough —
   when a Turn becomes available the player has *agency over the season itself*, and the button
   must earn the eye: a shine sweep or equivalent, celebration-grade but not constant noise, and
   honest under reduced-motion.
2. **Player-facing "badges" are gone — the word is "upgrades", everywhere a player reads.** The
   ceremony's ask says upgrades; the glossary gains the line. And **power-up distribution is a
   design problem, ruled in direction**: audit every boost faucet, close anything farmable by
   Turning (nothing that pays a power-up may be re-earnable through the year loop), and reshape
   the curve so a **new player's first few days are rich with power-ups — near-always-active** —
   with the generosity tapering as the game opens up. Knobs in data; deep tuning stays phase 4's.
3. **A petal with no pips must still explain itself.** "Next +30%" with no base description
   teaches nothing — every petal skill carries its one-line meaning at zero pips ("Rich Bloom:
   +30% gold on this flower's harvests, per petal"), per the show-the-numbers principle.
   (Transcribed from the owner's screenshot.)
4. **The vertical gestures, ruled plainly:** swiping the finger **up** descends into the Hollow;
   swiping **down** opens a **placeholder gate in the locked-season style** — a promise of
   something above, content unnamed. Both directions now answer; neither is dead.
5. **After the first Turn, teach the swipe.** A one-shot coach moment — an icon and a finger
   dragging right-to-left — so the opened Fall is *found*: drag to enter, drag back to return.
   The house coach-mark pattern, seen-once.
6. **Fall's bed chip intrudes on the board** — reposition so the +50% pill reads without
   overlaying the garden.
7. **The Cards screens predate the visual standard** (the album shipped 15 August, the standard
   hardened on the 26th) — a full visual pass bringing album, set view and pack-opening onto the
   house material recipe, judged against doc 05.

### Rejected

**Treating item 2's farming worry as hypothetical** — whether or not a loop exists today, the
invariant is worth asserting: the builder audits the faucets and the suite holds the result.
**A wireframe gate for this round** — no new screens; before/after screenshots stand in for it,
and the Cards pass is judged against the standard, not against a new layout.

---

## 2026-08-30 (review) — The strategy pass is accepted, and the advisor's own numbers take their corrections

**The strategist's three documents pass review** — sourced, honest about gaps, and willing to kill
claims this project has been repeating, several of them the advisor's own. Correction notes now sit
at the top of docs 17, 29, 37 and 01 so nobody quotes the dead numbers from the place they were
born. The corrections accepted without argument: the retention baseline was optimistic, the
Magic Research and graveyard figures fail sourcing, editorial features are worth thousands of
installs rather than a launch, ASO runs on ratings rather than raw retention, and **doc 37's
emphasis inverts — the ads are the floor, the shelf is the plan.**

**What the pass surfaced that must move now:** Firebase Remote Config enabled before 1 September
(two days); DevGAMM by 7 September and IGF by 13 September, both mobile-eligible and both
better-fitted than the Wholesome Direct the plan previously leaned on; the Google Play 12-tester
14-day clock started immediately; and **the Safari seven-day save wipe is live for the playtest
group today** — friends playing in the browser who take a week off lose their garden, so the
home-screen install push is now a duty of care, not a growth tactic.

**Five calls are the owner's and are queued, not decided:** the fork (punishing upkeep versus the
"nothing is taken while you're away" register — the store listing, the first screenshot and the
one sentence all wait on it, and PEGI 12 rides on it); pricing posture (B recommended — real
shelf; C, premium, stays a live option); launch timing (PGC London, 18–19 Jan 2027, recommended);
the premium PC question; and the strategist's bluntest and best question — *what does this have
to earn, by when, for you to keep working on it, and what do you do in the month it earns $200?*

### Rejected

**Averaging the two retention benchmarks** — one measures organic reality, the other paid-UA
cohorts; the plan runs on the median and treats the old table as the target it always was.
**Softening the fork into a compromise nobody chose** — it is presented to the owner as the two
games it actually is.

---

## 2026-08-30 (rulings) — Show the numbers, the What's New popup, and orders that pay like they mean it

**Three owner calls from playing the build, and the first is a design principle that overrules
an earlier one.**

**1. Show the value where the player taps.** The owner's words: this is an incremental game —
"these games are all about math and small numbers... show people the value that they have."
Lucky Charm is the house's own worked example (says what it does, blips imply the total); the
petals got it wrong (dots with no numbers), and the plant picker got it *actively* wrong — it
applies Sprinklers and boosts to its grow-time label but **forgot petals**, so a tulip full of
Quick Sprout still reads 18 seconds while genuinely growing faster underneath
(`ui-sheet.js:818` applies `growModifier()` but not `petalGrowMult`). The engine was right;
the label lied. **This overrules the phase-2 "pips, not spreadsheet rows" position** — the
resolution keeps both: pips for the feel of filling something, the number beside them for the
value. The rule, project-wide: *if a button costs something, it says what you get and what you
now have; every number a purchase changes updates the moment you buy.* One deliberate
exception survives: year one's mystery meter, the approved tutorial beat.

**2. The What's New popup.** A one-time, house-styled dialog (never fullscreen) on opening the
game: a piece of flashy art up top, a few plain bullets of what's new, and one button — "Got
it!" — which also **resets the save** so the playtest group starts the new build fresh.
Design decisions: announcements are **data** (id, image, title, bullets, and a per-announcement
reset flag) so the owner ships a new one by adding a row; the seen-flag lives in its own
storage key **outside the game save** — it must survive the very reset the button performs, or
the popup loops forever; a seen announcement never shows again; dev tools get a preview and a
clear-flags button. **The art is a raster image, which is the repo's first deliberate
binary-asset exception beyond the home-screen icons** — announcement art is owner-supplied,
per-announcement, and the exception is documented in the conventions rather than snuck in. The
offline cache list must carry it or the installed app shows a broken square.

**3. Orders pay real gold.** The owner: the delivery bonus "is so small... almost feels
pretty pointless." Right — the Stand's multiplier was tuned against the old economy and, with
its reputation paused, a filled order now pays a token. The ruling: raise order payouts until
delivering feels like a small windfall — the working target is **roughly one to two minutes of
the player's current earning rate per order**, measured in the sim rather than eyeballed, all
in data, with the standing invariant untouched: delivering always beats selling the contents.

### Rejected

**Numbers on the year-one meter** — the mystery is the tutorial, kept. **Storing the popup's
seen-flag in the save** — the reset would resurrect it. **A fullscreen takeover** — the owner
asked for a mobile-game popup with the house border, and the house style has one. **Calling
the button "Reset"** — it says "Got it!"; the fresh start is the announcement's gift, not its
threat.

---

## 2026-08-30 (design) — The money plan: one owner idea ships first, the other is ruled out by its own math

**The owner opened the monetization conversation with two ideas, and a three-agent crew
(placement inventory, market comparables with sources, a cosy-pillar adversary) returned the
plan now in [37-monetization.md](37-monetization.md).** The headline rulings, recorded plainly:

**The welcome-back gold doubler ships first** — the genre's most proven placement, offered as
the *last* line of the away story, never in a first session, with one rule that closes a back
door nobody had noticed: **ad-granted gold never feeds the well** (the cheat-gold flag,
reused). Without that flag, ads would quietly mint Saved Seeds through the lifetime pool.

**The Turn-pouch doubler is ruled out as stated, by two facts rather than taste:** a perfect
year's Tally is ~×1.66, so a thirty-second ad granting ×2 would out-score playing well and the
Tally would stop being the economic teacher; and the comparable everyone assumes does this —
Egg Inc — actually doubles *earnings*, never the prestige currency, letting sub-linear prestige
math absorb the boost. The same "I got more" feeling ships as gold doublers instead.

**The never-sell table is now written down with reasons attached**, because every entry will be
proposed again someday by someone reasonable: no Saved Seeds or petals for money ever, no seed
unlock skips, no early season gates, no Century Bloom time (sell it a cosmetic pot, never the
exit), no second blessing, no offline-cap lever, no Wonder extensions, no paid random packs.
The two promises above the table: the forever money is never for sale, and the sacred moments
stay clean — offers live on summary screens, after the fireworks.

**The store shelf settles the piggy-bank currency question the hard way:** a Saved Seeds jar
sells the Turn itself (never), a gold jar mints seeds through the well (never), so **the Gem
Jar holds gems** — which is also exactly what Egg Inc's holds. Cosy build: never overflows,
never expires, never nags. Cosmetic decor packs are named the cleanest sale in the game and
the real answer to "what do gems buy."

### Rejected

**Every red-table entry above, each with its reason inline.** **The ad-refill Power-up button
as a primary loop** — it survives only in the capped-bonus form where the free path never
degrades; the moment scarcity exists to sell relief, it is energy in a costume. **Building any
of this in the web build** — no ad SDK exists there and none will; the shell comes first.

---

## 2026-08-30 (ruling) — The blessing stays as it is, and gets a creative brief instead of a fix

**The owner's call, and their diagnosis is sharper than the advisor's was:** the blessing feels
lackluster *because it is a ceremony wrapped around a thing you can already buy* — a free petal
dressed up as an event. "Keep it as is right now until we figure out another way to do it
better or come up with another cool idea." So: no once-ever cap, no pricing — the farmability
stays a known, accepted seam (docs/11 keeps its entry, re-marked as accepted-for-now), and the
open item changes shape from *how do we price this* to **what should a blessing actually BE**.

Three sparks recorded for that brief, none chosen: the blessed flower wears a **crown all
year** (identity, visible to anyone who sees your garden); the blessing **wakes the flower's
signature skill for one year** before it is bought (a free taste of the game's coolest
unbuilt thing — lands naturally with slice B); the Tally **nominates** the flower of the year
and the player confirms or overrules (the blessing becomes an award, not a purchase).

Also asked and answered in plain terms the same day: the Fall one-tap bed sweep (explained,
awaiting yes/no) and the petal-pacing question (explained as "play five years with the
time-warp and say whether the Turn still felt worth doing").

---

## 2026-08-30 (rulings) — Three yeses, a field guide, and the cleanup round

**The owner ruled on three of the five open questions, plainly:** the discover quests get the
fix (count what you already found, and the goal strip shows whichever quest is closest to done
instead of always the oldest); the Stand's level points **pause** until the phase that builds
the new level rewards (orders keep paying gold and keep counting on the Tally); and the
padlock now means one thing only — the real one-time wall — while a
ten-seconds-away "can't afford yet" row just looks grey.

**Still open, by the owner's own words:** the blessing — they asked what it even does before
ruling, which is its own finding: *the ceremony's one choice was not legible to the person who
designed the game around it.* The plain answer now lives in the Garden Year artifact's new
**field guide** (every Year term, one line each, blessing included) and in doc 32's glossary.
The advisor's recommendation stands — each flower blessed once, ever. And the petal-pacing
question waits on the owner actually playing, which is what the cheat request below is for.

**The owner asked for a review kit of cheats**, because judging the feel requires living a week
in an afternoon: simulate time passing, summon creatures to see them in the new HUD band, and
whatever else helps. Scoped into the cleanup round: a **time-warp** (wind every clock — plants,
Fall beds, the Century Bloom, food, keepsakes, jars — forward 1h / 8h / 24h without the away
framing), **summon a creature / summon all six** (at a chosen star, tending, so the band fills),
**grant Saved Seeds**, **grant boosts** (the Power-up button needs inventory to demonstrate
itself), and **grant card packs**. All cheat-flagged so none of it touches the mint.

**The cleanup round is phase 3.6:** the three ruled fixes plus the review kit, no wireframe
gate (no new layouts — a dev panel and one padlock change), standard gauntlet-lite.

### Rejected

**Ruling the blessing by default while the owner was still asking what it does** — a mechanic
gets explained before it gets judged. **A save-slot system for testing** — considered for the
kit, dropped as scope; the fresh-save private window and the existing reset cover it.

---

## 2026-08-30 (design, later) — Garden only, the map goes, and the project learns to speak plainly

**Three owner calls in one message.** The dock's centre button is **Garden, nothing else** — the
sketch's MAP/GARDEN double label is resolved. **The map is removed, not parked** — which
green-lights the morning review's §4 proposal by necessity: the meadow gets the burrow door's
twin *first*, verified, and only then does the map (button, camera, `overworld.js`, swipe-down)
come out, all inside phase 3.5. And **the owner asked the whole project to change how it talks
to them**: like a game designer, not a mathematician — plain words, flows and pictures first,
formulas kept in the docs.

That third call produced three artifacts: a **plain-English glossary and a one-page flow
diagram at the top of [32-the-garden-year.md](32-the-garden-year.md)** (the words every
conversation now uses — the well, the scoop, the Turn, the Tally), a standing instruction in
**AGENTS.md** so every future builder session inherits the style without being told, and a
memory note so the advisor session holds it across conversations.

### Rejected

**A separate glossary doc** — the words belong at the top of the design they describe, where a
cold reader hits them first. **Keeping swipe-down alive after the map goes** — a gesture to a
deleted screen is a trap; doc 32 already said the gesture frees up when the map retires.

---

## 2026-08-30 (design) — The Big Five: the owner rebuilds the bottom of the screen

**The owner's call, with a reference screenshot, before the rest of the morning docket:** the
dock becomes **five main buttons** — Orders & Quests · Cards · **GARDEN** (centre, raised) ·
**Turn** · Shop — with a **floating pair** above it: Upgrades on the left, and on the right a
**power-up button that always holds one random held boost** (tap uses it, another fills in).
The spec is [36-hud-and-dock.md](36-hud-and-dock.md); the Monopoly Go / Clash Royale shape,
named as such by the owner.

**What it resolves for free:** the morning review's §1 — its whole question was where the meter
pill's number fits beside three round HUD buttons, and the answer is that **the meter stops
being a pill: the Turn button's body is the meter**, filling as the year grows and pulsing at
ready, with petals bought behind it. The pill retires, the album star leaves the HUD for the
Cards slot, and the narrow-width squeeze dies with both. Doc 15 is superseded a third time —
the centre-pedestal idea survives, but the pedestal is Garden, not World.

**What it deliberately parks:** the map and meadow, by the owner's explicit words — the World
button retires from the dock but the swipe-down gesture stays live, so both remain reachable
and nothing is stranded; the meadow-door decision and the map's retirement wait. The quest
strip stays for now, flagged as a gate question rather than removed on a hunch.

**Process:** a mini-phase (3.5) with the wireframe gate in full force — the owner is awake, the
spike is compared against their screenshot, and no build starts before approval. No economy
knob moves; the phase moves entries, never behavior.

### Rejected

**Bundling the docket's quick fixes into this phase** (the picker padlock, the discover
backfill) — the docket items get their own rulings in the design conversation now underway;
this phase stays one thing. **Retiring the quest strip in the same pass** — the one
always-visible goal does not leave on a hunch; the spike measures whether the Big Five's badges
can carry its job first.

---

## 2026-08-29 (review, later) — 1.1 verified, the blessing goes on the morning docket, and the night gets a double phase

**Phase 1.1 is verified by the strategy session:** 1,202/0 reproduced across runs, the mint
cumulative with veterancy deleted outright, `year-sim` green with casual beating every spam
shape on the currencies the mint controls, and M09 closed with genuine negative assertions
(both grandfather arms tested separately, and the level-1 catalogue asserted exactly). The 1.1
builder also ran three unprompted follow-up rounds and disclosed what they found instead of
tuning it away: **the blessing is now the largest per-Turn grant and nothing prices it** — one
free petal per Turn against a split-neutral mint means ~95 spam-Turns farm half the entire
shared-skill sink (~318K seeds of value) free. Measured, disclosed, untouched. The related
disclosure that the 2–5-petals-per-Turn claim is false under the cumulative mint is phase 4's
mintK calibration, exactly where the mint ruling said it would land.

**The advisor's recommendation for the morning docket, not a ruling: each flower can be blessed
once, ever.** Nineteen free petals lifetime (~6% of the sink, not 50%), the ceremony intact,
and the choice *deepened* — which flower earns its one blessing becomes a real decision, and
spam gains only earliness, not value. The builder's other dials (tally-scaling, caps) remain on
the table; the owner rules when awake.

**And the owner asked for a larger overnight phase, so phases 2 and 3 merge into one unattended
Surface run** — with the wireframe gate's approval step deferred to morning by the owner's
explicit call, spikes still built first so layout precedes code, and every gate-worthy decision
logged to a morning-review file as accepted rework. Two rails are non-negotiable overnight:
every push playable with a working navigation (the strip before the map retires), and no
economy knob moves — the blessing and mintK wait for daylight.

### Rejected

**Ruling on the blessing tonight** — it is a ceremony-beat design decision the owner was
promised. **Letting the overnight builder ask questions** — it cannot; the morning-review file
replaces ask-don't-invent for one night, bounded by the no-economy and playable-push rails.
**Including phase 4 in the overnight run** — tuning is calibrated against the owner's own
played feel, which no unattended session has.

---

## 2026-08-29 (review) — Phase 1 passes its independent review, with one escape and one ruling to make

**The strategy session reviewed the builder's phase 1 without reusing its gauntlet** — four
independent auditors: a line-by-line spec-fidelity check, eight *fresh* mutations the builder's
critics had not tried, four exploit-fix variants driven through the real engine, and a
docs-truth pass that walked the five-minute test script against the actual dev-tools code.

**Spec fidelity: ten of ten MATCH, zero deviations.** Every doc-33 constant sits in `data.js` at
its documented value; both Turn gates hold; the partition, the in-flight rules, the
once-per-lifetime unlocks, crops-are-not-flowers and the 1.4× curve (Century Bloom included) are
all implemented as written. The suite's 1,051/0 was reproduced independently, repeatedly. **The
builder's work is approved** — this is what implementing a finished spec looks like, including
the correct refusal to tune the exploit away without a ruling.

**Fresh mutations: seven of eight caught, one escape.** M09: gut the grandfather migration so
*every* seed unlocks free on any pre-Year save, and all 1,051 assertions stay green — the
bill-13b group asserts only positives (a rich save keeps what it had) and never the negative (a
modest save must NOT receive the ladder). The probe made it concrete: a 400-coin, rep-5 save
loads with 3/19 seeds on the real engine and 19/19 — Eternal Crown included, a 98.5M unlock,
free — on the mutant. **One negative assertion closes it; phase 1.1's first task.**

**The Tally's tier-reading is ratified, not just flagged:** cumulative is the only reading that
reproduces doc 33's own "47 → ×1.25" example and reaches the ×2.0 cap the doc says a maxed year
hits (+138% summed and clamped, against +69% for highest-tier-only). The builder implemented an
ambiguous table correctly; the flag in doc 33 is resolved.

**The exploit ruling, prepared for the owner with the variants measured rather than argued.**
Baseline verified at ~25–32× casual's Saved Seeds by day 10–12. **A (dials: minCoins 500K,
veterancy capped) fails at 3.5–4×** — sqrt-of-this-year is superadditive under splitting and
dials only re-price the split. **D (minCoins ratcheting ×1.6 per Turn) fails at 1.2–1.5×** and
adds the worst cosy violation on the table: a player who turned often early owes a
permanently-ratcheted multi-million floor forever. **C (cumulative + capped veterancy) is the
decisive control: re-attaching ANY per-turn multiplier to a split-neutral base re-arms the
exploit at 1.3–1.4× — veterancy must be deleted, not capped.** **B (the cumulative mint,
Cookie Clicker's heavenly-chip shape) is the only variant that kills the exploit, and it kills
it by construction:** the mintable pool depends on lifetime earnings only, so no cadence can
out-mint another on the base — casual *beats* turn-spam on seeds while spam burns 35 Turns —
and the Tally graduates from garnish to the economic teacher, since full well-played years
(~×1.3–1.6) out-score spam years (~×1.0–1.2). B's honest cost, named so phase 4 owns it: under
the play model's income plateau, late pouches thin (real income grows through petals, unlocks
and Fall, which the model under-represents — but mintK-vs-petal-cost calibration is explicitly
phase 4's chair). **Recommendation to the owner: adopt B — lifetime accumulator, mint the
increment, tally on top, veterancy deleted.**

**Docs-truth: one should-fix and three notes, all applied or filed.** The known-issues note
overstated the exploit's late-turn mint ~2.5× (~1,100 claimed, ~380–440 real — corrected, with
the correction owned in place: the exploit needs no exaggeration); the windfall's "all eight"
wording now carries the Century exception inline where the rule is stated, not just in the
bill; the measured-envelope tilde-band and the pre-existing `seen.apiary` doc gap are noted for
the next doc pass.

### Rejected

**Approving unconditionally** — the M09 escape is real and cheap to close; conditions are the
review doing its job. **Ruling on the mint in this session** — the builder escalated it as the
owner's call and it is one: it changes the game's core formula. The recommendation is as strong
as the evidence allows; the ruling is not mine. **Re-running the builder's own mutants** — the
point of an independent review is fresh attacks; theirs were verified once by their own
re-runs, and the one hole found was in territory they never probed.

---

## 2026-08-29 (gauntlet) — Phase 1's critics: 29 findings, 20 confirmed, and one genuine economy break

**The doc-34 gauntlet ran as a 33-agent adversarial workflow** — four independent critics
(invariant coverage, partition completeness, economy pacing, spec fidelity), every finding then
handed to a verifier instructed to refute it. Nine were refuted; twenty survived, several by
mutation testing (the verifiers edited scratch copies of `game.js` and watched the suite stay
green). What was fixed the same day:

**The suite's faucet coverage had real holes.** Mutating `standDeliver`, `fallHarvest` or
`applyReward` from `credit()` to a raw wallet write left all 1,043 assertions green — the exact
regression class bill item 4 exists to catch. The bill-4 group now watches a real Stand delivery,
a daily quest's gold, and a Fall harvest reach `coinsEarned` (and the Tally's orders counter move
off the real event); the bill-1 rig now carries non-default values in every surviving field it
asserts (tickets, prefs, a live daily quest, claimed sets and milestones, Stand lifetime
counters, a stationed keeper, a widened bench), so "survives verbatim" can actually fail; bill 3
spends through every coin sink, bill 9 asserts fresh order ids and live refill clocks, and the
migration groups carry the bill-13 tag. All eight of the gauntlet's surviving mutants are now
caught; the suite stands at 1,051.

**The pacing tool had a model bug and a dishonest verdict.** The tap loop played 1.8 taps/sec
where its knob said 0.8 (`for (t < 0.8)` runs once, plus the fractional roll — fixed to
floor+fraction), and the daisy-rush verdict compared only coins and petals, ignoring Saved Seeds
minted — the actual prestige currency, which rush was winning in the tool's own printout while
it declared "unprofitable: YES". year-sim now plays Fall, buys post-Turn plots, blesses the
cheapest uncapped flower, prints its unlock diary, plays an honest `smart` strategy (normal play,
turn at the gate, wallet dumped into Fall beds first), and **exits non-zero when any cheap-Turn
shape beats casual** — which it currently does; see below.

**The one genuine economy break: bill item 17's economic half is false at the spec constants.**
Confirmed and quantified by the critics with the real engine: sqrt-splitting plus uncapped
veterancy plus Turn-surviving Fall beds make turn-at-every-100K strictly dominant (~35× the
seeds, more gold, ~8 Turns/day). The engine is faithful to docs 32/33; the constants are the
owner's. Recorded as an open owner decision in [11-known-issues.md](11-known-issues.md) and
flagged inline in doc 33 — phase 1 does not retune, and the tool fails loudly until the ruling.

**Disclosure fixes:** docs/11 now states plainly that a fresh save is hard-capped at 2 seeds and
4 plots until phase 2 (with a new dev-tools "Unlock the next seed" driver so the wall can be
felt during review), doc 33's two headline pacing claims carry the shipped tool's measured
envelope beside the design-session numbers, doc 32's never-touched column got its precise
reading (never reset or decreased — the mint and blessing only add), doc 07's state shape
gained the fields it had drifted past (flowers, craft, goods, holdInterval, the proc badges),
and the dev windfall toast reads its percentage from `DATA.fall.windfall`.

### Rejected

**Making the suite assert rush-unprofitability** — it would assert a falsehood at current
constants; the claim lives in year-sim's exit code where it can go green the day the data
changes. **Retuning minCoins/veterancy/mintK in phase 1** — the builder implements a finished
spec; the exploit is documented, measured, reproducible on demand, and waiting on the owner.
**Trusting the critics' word** — every fix above was re-verified by re-running the critics'
own mutations against the repaired suite; all eight are caught.

---

## 2026-08-29 (build) — Phase 1: the Garden Year's engine ships as pure simulation

**The whole prestige loop now runs headlessly under the live game** — `Game.credit()` as the
single faucet, one-time seed unlock prices, petals with both shared skills live in the payout
and offline paths, the atomic `turnYear()`, Fall's board with the windfall state machine and
the Century Bloom, the mastery retirement and conversion, the four quest re-keys, and the
doc-33 sim-test bill (items 1–6 and 8–18) genuinely asserted — the suite grew 908 → 1,043 and
runs clean twelve times in a row. The engine choices worth recording:

**The Tally's tiers accumulate within a line.** Doc 33's table read either way, and its two
worked examples contradicted each other — but only the cumulative reading reproduces doc 32's
"47 orders → ×1.25", reaches the ×2.0 cap a maxed year is said to hit (+138% summed, clamped),
and lands the quoted ~×1.35 mid-game year. Highest-tier-only tops out at ×1.69 and can never
touch the cap. Implemented cumulative, flagged in doc 33 for the owner to veto. "A line the
year scored zero on" means *scored no bonus*: a counter below its first tier renders nothing —
rendering "Orders: 7 → +0%" would be the ×1.00-you-failed row the cosy rule forbids.

**The windfall is per-cell marks plus a bed latch.** Arming stamps every ripe bed cell when
the last one ripens; `bedPaid` holds until the bed empties. This makes "once per fill"
structural — a plot replanted mid-collection joins the *next* fill because it never got a
mark, and re-ripening cannot re-arm a paid bed. A single armed-flag would have paid new
plants planted into a half-collected bed.

**The growth floor moved onto the product.** Quick Sprout at cap stacked with Sprinklers,
Seed Rush and a Keeper wall multiplies to 0.294 — through the 0.3 floor the two existing
clamps only guarded separately. `plantGrowth()` clamps the combined stack, both at plant time
and in `passiveIncomeRate()`, so bill item 8 is enforced by construction and today's
behaviour is untouched (the clamp only binds under petals).

**The Century Bloom holds the 1.4× curve at 2M/2.8M.** "Deliberately absurd" is carried by
scale and the fortnight, not by a better ratio — bill item 5 stays one rule with no
exception, and phase 4 can retune the magnitude freely.

**`credit()` skips the accumulator for refunds as well as cheats.** A failed purchase
refunding through the earnings counter would mint seeds from a no-op; a migration refund
would mint them from history. Neither was ever income.

**The blessing refuses politely.** An unknown flower or a capped Rich Bloom blesses nothing
and the Turn still runs — the ceremony's one choice must never be able to brick the Turn.
`state.blessed` records the year that blessed, before the rollover.

**`tools/year-sim.js` models a casual player, and the model is the sensitive part.** The
four verdicts that hold across every model variant tried: petals per Turn sit in the 2–5 band
(12/12 in the frozen calibration), the daisy-rush shape loses on both coins and petals, the
first wall reads as several times lifetime earnings on day one, and a 400K year pays ~63 base
seeds — doc 33's "60–65" to the digit. The first-Turn *day* and year-one *coins* depend
heavily on the turn-policy knob (measured envelope: day ~1.5 at 252K to day ~5.3 at 1.7M,
doc 33's day 2.7–3.3 at 390K inside it), because income accelerates through the walls where
the doc's flat model did not. Recorded as a phase-4 calibration question, not tuned around.

> **Two of those four "verdicts" did not survive, and the correction is owned here rather than
> left standing** (2026-08-29, rounds 1–2 and phase 1.1). **The daisy-rush claim was wrong**:
> the tool's rush strategy was handicapped and its verdict ignored Saved Seeds minted, which is
> the currency the shape actually wins — the real finding is the escalated seeds-only exploit in
> [11-known-issues.md](11-known-issues.md). **The 12/12 petal band was a frozen-calibration
> artifact**: with the tap-rate bug fixed and automation in the model, the band now holds on
> roughly half of Turns, and the tool marks it OK/CHECK instead of printing a bare count. The
> other two held, and the year-one figure improved into doc 33's documented band once the model
> bought the game's automation. The lesson worth keeping: **a pacing model's verdicts are only
> as good as the strategies it is willing to play against itself.**

### Rejected

**Rounding `coinsEarned` per grant** — the mint rounds once at the end; per-grant rounding
would drift the accumulator from the wallet. **Letting Fall crops count keyed quests or
plant-tracks** — doc 33 says generic harvest tracks and nothing else; crops stay out of every
flower system including quest keys. **A second Tally knob for the tier-reading** — one
documented reading, one owner question, no config surface for an unsettled rule. **Re-keying
`q_discover_5`** — doc 33 names exactly four quests; discover quests span years by design
(lifetime counter, quests survive the Turn), logged as a playtest watch item instead.

---

## 2026-08-29 (process, later) — The wireframe gate

**The owner's addition to the build plan, before any builder starts:** a UI phase now begins with
a **full layout pass of every screen it will touch, approved by the owner before a line of UI
code is written.** The vehicle is the house's own spike tradition — `tools/turn-spike.html` for
phase 2 and `tools/fall-spike.html` for phase 3, static pages at 390×844 obeying doc 08's layout
rules at wireframe fidelity, pushed so the owner reviews them from the live URL on a phone. The
builder's layout questions are raised *as questions*, the owner's annotations go verbatim into
the build, and **the approved spike becomes the reference the visual-fidelity critic later judges
the built UI against** — layout first, doc 05 finish second. Phase 2's spike must show the meter
pill in both states, all four ceremony beats including the Tally sequence, the Almanac petal
rows in empty and mid states, the unlock rows, and the season tint at three points of the year;
phase 3's must show how a player *discovers* the strip exists, a hedge gate up close, Fall's
board with a windfall-ready bed, the Century Bloom mid-wait, and the dock swap. The Phase 1
prompt was also rewritten clean with the retuned numbers inline, so a builder cannot implement
the superseded values from a stale paste.

### Rejected

**Wireframes as documents** — a markdown layout description cannot be judged on a phone; the
spike is the wireframe. **Gating phase 1 on wireframes** — it ships no UI by design. **Letting
the builder resolve its own layout questions** — the entire point of the gate is that layout
decisions reach the owner while they still cost nothing.

---

## 2026-08-29 (tuning) — The full-model sim reports late, fails four checks, and saves the loop

**The economy verifier presumed lost to the session-limit outage finished after all**, having
driven a session-by-session year model through the documented numbers — and it earned the wait:
of nine checks, two passed, three were partial, and **four failed**, one fatally. Every verdict
is applied to [33-year-one-economy.md](33-year-one-economy.md) before any builder implements the
old values.

**The fatal one: the prestige loop died at week eight.** At petal base 5 / ×1.3 per seed, Turns
paid 7–10 petals instead of 2–5 and the entire sink was consumed by day ~56 — after which a Turn
buys nothing and the game's engine stops. **Repriced to base 15 / ×1.45**: the 2–5 band centres
and the sink (~679K seeds) is uncleared at day 180. The knob that looked like taste was the one
keeping the Turn button alive.

**The unlock ratio was wrong for a subtle reason:** gold resets at the Turn, so seed 19's 277M
had to be earned *inside one year* against ~30–40M/day — the endgame became 5–11-day grind-years
and all nineteen landed at day ~67. **×1.6 → ×1.5** (seed 19 ≈ 98.5M, all-19 ≈ day 46), with the
recorded instruction that the knobs interact and **the unlock ratio is tuned last**, in phase 4,
after petal pricing — the sim's own cross-check showed repriced petals slow income enough that
~×1.45 may be the landing spot.

**Two exploits, one fix each.** The seeds-only Turn gate was reached at ~8K coins, enabling a
**daisy petal rush** — many cheap Turns a day, 36% faster to the first million; a **coins floor
joins the gate** (`minCoins = 100K`, verified robust where petal repricing alone was not). And
year one earned ~800K instead of ~370K because plots 5–8 cost 9.4K and double income; **plots
5–8 now require `turnsCompleted ≥ 1`** — which also makes Turn 1's gift bigger: Fall, *and* the
right to a larger garden. Migrated saves keep what they owned; nothing is ever re-locked.

**What passed, recorded because passes are evidence too:** the growth-floor stack (0.375 > 0.3
with everything at cap); **the Tally lands in the exact band it was designed for** — a player who
maxes it every year finishes 18% faster than one who ignores it, optional-but-delightful, not
mandatory; and **skipping unlocks is strictly dominated** (saving for seed 10 directly arrives
eight days later than climbing), so the sequence needs no enforcement code at all.

**Fall's fade is measured and half-intended:** competitive at opening (~0.6× Summer, windfall
×2.75 over lazy play), fading toward ~0.2× as Summer's ladder reaches its teens. Winter takes
the long-clock baton at Turn ~3 by design; if playtest shows Fall dead by Turn 6 the remedy is a
`DATA.fall.scale` yield knob in phase 4. **The sim's suggestion of rarity-for-crops was
rejected** — it reverses "crops are not flowers" to solve a tuning problem one knob can solve.

**The quest re-key survives with sharper reasoning:** at the gated ~370–410K, peony and marigold
stay unreachable and lavender and rose become *marginal* — reachable only on a perfect year. All
four still re-key, because a quest that sometimes jams is the same bug on a timer.

Sim-test bill grows to 18 (the two gates; the plots year-gate); docs 32 and 34 and the HANDOFF
carry the new numbers; phase 1's prompt targets are corrected in doc 34.

### Rejected

**Rarity on Fall crops** (above). **Shipping the documented values and tuning in phase 4** — the
dead-at-week-8 sink is not a tuning miss, it is a structural failure the builder must not
implement. **Trusting the earlier pressure-test sim over this one** — the first model simulated
the formulas; this one simulated the *player*, sessions and offline batches and Turn policy
included, and where they disagree the fuller model wins.

---

## 2026-08-29 (process) — The build gets phases, a gauntlet, and a prompt per builder

**The owner asked for the build to start — in phases they can review, with critics reviewing the
work too.** The plan is [34-build-plan.md](34-build-plan.md); this records the process decisions.

**The session split holds:** this session stays strategy and review, and each phase is built by a
fresh session from a paste-ready prompt in doc 34 — the standing role division, applied to the
build. **Slice A splits into four reviewable phases**, because a single review gate at the end of
the whole slice would be the first time the owner saw anything: 1 the engine (simulation only,
the live game visibly unchanged while the year accrues underneath), 2 the ceremony (the Turn
sheet, the Tally as theatre, petal rows), 3 Fall and the strip (the world change, the map's
retirement), 4 the tuning pass (its own phase, deliberately, so tuning is never squeezed into
the end of a build phase). Slices B–E become phases 5–8, scoped when reached.

**Every phase ends in a gauntlet before the owner sees it:** the suite run repeatedly (the flaky
class), an adversarial multi-agent critique inside the builder session — invariant coverage,
partition completeness, economy pacing through the real `game.js`, and for UI phases a
visual-fidelity critic judging phone screenshots rule-by-rule against doc 05 plus a grammar
critic — then the five-step docs handoff, a push, and **a five-minute cheat-driven test script**
so the owner's review never starts with "where do I look?". The owner's verdict gates the next
phase, their notes go verbatim into the next prompt, and `/code-review ultra` is recommended
after phases 1 and 3.

**Three bars are named in the plan because the owner named them:** visual fidelity to doc 05,
tuning measured never asserted, and the prestige feeling like what the game was always meant to
be — with doc 32's rubric (*gift or loss?*) as the standing review question.

### Rejected

**Building in this session** — the strategy seat stays clean, per the standing role split.
**One review at the end of slice A** — four gates instead. **Critics only at the end** — the
gauntlet runs inside every phase, before the owner's time is spent. **Pre-writing phase 2–4
prompts in full** — each next prompt is written after the previous review so the owner's notes
land in it verbatim, which is what makes the loop real.

---

## 2026-08-29 (design, later) — The Tally, and what the verification fleet found

**The owner added the ceremony's missing beat, and it is the best kind of feature — one that was
already half-built.** The Turn's count-up becomes an **arcade end-of-year score**: the base mint
rolls up, then the year's achievements land one line at a time, each raising a multiplier —
orders filled, full-bed windfalls, species grown, Legendary blooms, best combo. Bonuses add, the
sum multiplies the base, **capped at ×2.0**, every line reads a year-scoped counter in
`state.year.stats` (never lifetime, never spendable), and **a line the year scored zero on simply
does not appear** — the Tally only celebrates, because a "×1.00, you failed" row is the arcade
convention this game must not import. The tiers rotate categories deliberately: demand, Fall's
ritual, breadth, luck celebrated, and the tap loop. Also closed by the owner: **the Century Bloom
ships in slice A with Fall**, and **the windfall is the bed-completion bonus** — the streak
appetite lands in the Tally, where it multiplies the whole year rather than one bed.

**A three-agent verification fleet ran over docs 32/33 and its findings are all applied.** The
consistency auditor found a real arithmetic error in 33's own prose — the mint formula yields ~61
seeds on a ~370K-coin year, not the ~160K the draft quoted — and a **swipe-direction error in 32**
(the Hollow is entered by swiping *up*, as built; "down" was written from the artifact's diagram
rather than from `ui.js`). Eleven older docs received supersession notes in the same pass, 25 and
13 and 16 chief among them, so no cold reader can be sent to build the Orchard again.

**The completeness critic asked the question that mattered — could an engineer build slice A
without a design question — and the answer was no, thirteen times.** The blockers are now closed
in the docs: the never-resets partition generates from one rule (*everything not named in the
clears column survives verbatim*) with in-flight cases specified — a ready bloom auto-collects
into the year before the mint, a plot-parked pack banks into `state.packs`, a growing annual is
forfeit and the flower says so before it happens; the badge wipe names every `state.upgrades` key
and re-derives the tap fields; the blessing is one Rich Bloom petal per Turn on any flower; the
ceremony is one atomic `Game.turnYear(blessedId)` behind a sheet mode, re-invited from the meter
pill; the meter is a third HUD pill; **Fall's board keeps the talking flower in the middle**
(the meadow's rule beats the critic's suggestion of a prop — the flower pays everywhere or the
grammar is broken); the windfall needs all eight plots planted and ripe so a single strawberry
cannot fish for it; **crops are not flowers** — no rarity, no mutations, no gems, never
`discovered`, and `DATA.fall` lives wholly outside `DATA.seeds` so no flower system drags them in;
**the Stand keeps a dock entry through slices A–C** (the World button becomes a Stand button —
one swap, honouring "a tab leaves when its home exists"); and **four year-one quests re-key** —
`q_lavender_3`, `q_rose_3`, `q_peony_3`, `q_marigold_3` name seeds behind 240K–983K unlocks that
a ~370K first year cannot reach, the sell-quest jam arriving a third time. Every credit grant now
routes through one `Game.credit(amount, {cheat, refund})` helper so the mint can never silently
miss a faucet, and migrated saves start `coinsEarned` at zero because no honest backfill source
exists.

**One regression is accepted knowingly, so nobody "fixes" it later:** retiring Bloom Mastery cuts
a veteran save's income at migration — `masteryMult` leaves every yield, and the 2-seeds-per-tier
conversion buys back only a fraction through petals. That is the retune working as intended on an
economy the owner has already called broken; the conversion is a courtesy, not compensation, and
it stays toastless per the backfill pattern.

### Rejected

**A prop in Fall's centre instead of the flower** — the one critic suggestion overruled, because
"the talking flower stands in the middle of every board and pays what it pays" is the grammar.
**Multiplying tally lines against each other** — bonuses add before the cap, or three mid tiers
compound past it. **A tally line for creatures kept fed** — an upkeep stat in a celebration reads
as surveillance; the Tally only counts things that went right. **Backfilling `coinsEarned` from
`stats`** — no lifetime coin figure exists in the save, and a guessed number in a mint formula is
worse than a low meter.

---

## 2026-08-29 (design) — The Garden Year is the design, documented for build

**The owner said go**, after four brainstorm rounds: the seasonal world, the Turn, Saved Seeds and
flower mastery become the game's shape, orders stay in, and the economy retune rides inside the
first slice. The design is **[32-the-garden-year.md](32-the-garden-year.md)**, the numbers are
**[33-year-one-economy.md](33-year-one-economy.md)**; this entry records what was decided in the
brainstorm and the three calls the documentation made that were not explicitly the owner's.

**Decided by the owner across 2026-08-28/29:** four seasonal gardens on one horizontal swipe strip
replace the world map (Summer home, Fall at Turn 1, Winter ~3, Spring ~6); art ships as a
background swap per season; the Turn clears fast annuals in the main garden only and never kills a
running long timer; the year is the player's own calendar, invited never forced; badges stay the
inside-the-year game and reset for the rebuild ritual; the drone and harvesters are parked for
their own conversation; the mint counts the year's earnings rather than the leftover balance (the
two-wallet rule, accepted after the hoarding walkthrough); every flower carries Rich Bloom + Quick
Sprout + one signature; and **orders stay** — the owner's words, "that was always a fun system."

**The documentation's three calls, flagged for the owner rather than silently made:**

**One lifetime reputation track — doc 30's season-level split retires.** The split existed because
seeds were going to re-lock each year. The unlock-price model removed the re-lock, so nothing
needs a second ladder: rep stays lifetime and earned-never-spent (the spine intact), the level
ladder re-authors past 17 with orders as the perennial faucet, and the re-climb inside a year is
purely economic — a veteran blasting back to their best seed in minutes is the fun, exactly as in
every comparable. This also closes the audit's "no vertebrae past 17" without resetting anything.

**Old Bloom Mastery retires into petals.** Two permanent per-seed yield ladders on one flower is
the stacking failure the pool discipline exists to prevent. Lifetime counts stay (creatures and
the Almanac read them); existing tiers convert to a one-time Saved Seeds grant.

**Orders become load-bearing, not just kept.** They are the repeatable reputation engine every
re-authored level past 17 hangs off — the role doc 13 assigned them on the day it was written,
finally cashed in — and their entry moves from a map trip to an order strip above the plots, the
demand-on-top-of-supply lesson surviving from the merge-central proposal even though the
bench-as-second-screen plan is parked.

**Also settled while documenting:** doc 30's season-aging growth-slowdown is superseded — the
deceleration comes from the unlock walls and the aging is visual only, keyed to the year-meter,
which doubles as the pouch preview (the AdCap angels-if-reset pattern). The Fall windfall rule
(+50% on a fully-ripe bed) is the season's one twist and one knob. The Century Bloom (14 days,
survives every Turn) is the design's screenshot. Cheated gold is excluded from the mint so the
friend-testers keep their buttons without contaminating pacing data.

### Rejected

**A third currency or any gold→seed→petal chain** — petals are purchases, not currency; there is
exactly one conversion, once per Turn. **Season-level regating of seeds** — two gates on one seed
double-walls the re-climb the design wants fast. **Authoring all nineteen signatures now** — six
at launch, waves after. **Winter's plant list now** — slice C's job. **Designing Spring's breeding
now** — slice E's job, deliberately.

---

## 2026-08-29 (design) — Per-seed prestige is the design, after a pressure test that refuted two of the advisor's own claims

**The owner committed to the direction and brought a concrete mechanism:** an incremental idle
tapper on the garden engine, seeds spread far apart, prestige at the seed-3 wall, and the spend as
**permanent upgrade trees per individual seed** — value, speed, mutation, gem, pack, proc, with the
drone eventually moving into a flower's path. The analysis is
[31-per-seed-prestige.md](31-per-seed-prestige.md), built on a four-agent pressure test
(comparables with sources, a 25-invariant repo audit, a simulated economy model, an adversarial
critique instructed to attack the advisor's fixes too) plus adversarial verification of the two
highest-stakes claims.

**The verdict: the core is right.** Per-seed trees are the strongest concrete answer yet to the
oldest finding in the project — nineteen seeds that differ only in throughput — and they are
doc 30's Seed Saving idea arrived at independently in a more buildable form: authored trees
instead of generated heirloom properties, same save-your-seeds fantasy. **Priced: ~20/5 as
literally described, ~45/12 with four surgeries.**

**Both verification passes refuted the advisor, and the record keeps the refutations.** The claim
that no successful game converts unspent balance at reset is FALSE — Antimatter Dimensions does it
at every layer — but the two conditions that make it safe there (hyper-exponential production,
conversion damped to powers like x^(1/308)) do not hold in a flat-income game with linear
conversion, and the simulation quantified the difference: buying a 25K plot an hour before reset
costs **15.5% of the run's prestige income** under leftover-balance and gains +1% under
sqrt-of-lifetime. The claim that a weeks-long first wall always churns is ALSO false as stated —
Cookie Clicker takes days-to-weeks, Egg Inc's first prestige lands around day 19–23, Melvor has no
prestige at all — but the surviving kernel is sharper than the original claim: every counterexample
climbs its wall on **visibly accelerating income**, and the owner's wall under the 1.4× rule is a
**flat-income savings grind**, which is the actual churn shape. Wall length is tunable; flatness at
the wall is not.

**The structural finding that changes the economy: no per-plant price spread can create a wall
while yield = 1.4× cost holds** — the whole 19-tier ladder self-finances in about six active
minutes, and multiplying ratios multiplies minutes. The spread must live in **one-time per-seed
unlock prices, permanent across prestiges** (150K for seed 3, ×1.6 per tier, seed 19 ≈ 277M),
which keeps the 1.4× invariant and everything tuned against it untouched. And the unlock gate
reconciles the level system instead of gutting it, using the two-stage chip shipped twice already:
**season level opens the seed's slot, the unlock price buys it** — levels keep their vertebrae.

**The fatal-rated attack that survived its own steelman: 19 trees × 6 axes is a 114-knob
allocation exam** delivered at the moment the player's garden was just cleared, aimed at an
audience selected for low decision fatigue — and no successful idle ships a per-generator ×
multi-axis permanent matrix (the hits keep the permanent layer to one global currency; Idle
Miner's per-mine permanence is one axis, six steps). The fixes keep the owner's structure:
checklist not allocation (everything maxes, no wrong order, surfaced as the Almanac's nineteen
rows — the audit's consolidation arriving with a purpose); a shared spine plus one signature
branch, authored for only the first five or six seeds at v1; **chance axes sold as pity countdowns**
("every 12th harvest mutates → every 10th") because a permanent RNG percentage is the least
legible purchase a game can sell; **no per-seed gem axis ever** — it is the exact override
mechanism the 2026-08-15 faucet fix deleted, on the premium currency; a **global automation floor
with the creatures tending the garden while you are away** (per-seed drone upgrades raise the
rate), because a drone buried in one tree means the longest run of the game has zero offline
income; and one ceremonial choice at the turn, not an exam.

**The invariants audit returned 25 touched rules, seven blockers**, now tabled in doc 31: the
spendable-tallies corruption (harvest counts feeding conversion must be a separate accumulator or
creatures de-star), the quest ladder having no rep fuel on run 2+ (`quests.done` never resets),
the meadow-dependent quests jamming during the hold (114 rep needs stand-ins), the barren first
run (daisy and tulip carry no verb and no creature — move Pip or accept it), Bloom Mastery
absorbed rather than stacked, upgrades applied via the masteryMult pattern in the same commit as
`passiveIncomeRate()`, and **cheat buttons now minting permanent progression** — cheats stay per
the owner's standing call, but cheated coins must be excluded from conversion or the playtest
pacing data is contaminated.

### Rejected

**Leftover-balance conversion**, with the honest counterexample on the record. **The weeks-long
first wall**, likewise — it returns legitimately at prestige 6+, where Egg Inc proves veterans
accept it; the first wall is 150K, which *feels* six-times-impossible on day one and breaks on day
2–3. **Per-plant price spreads** — structurally impossible. **Free allocation across 114 knobs.**
**Nineteen hand-authored signatures at v1.** **Gems anywhere near the conversion** — gems buying
permanent per-seed power is gems buying outcomes.

---

## 2026-08-26 (strategy) — The pivot to prestige, two structural findings, and the retune unblocked

**The owner's pivot, made after sitting with the direction analysis:** focus on the garden as is and
design a real incremental prestige — restart or restart halfway, a currency, permanent points that
make each run faster. Rethinking coins, upgrades and the level system is explicitly on the table.
The analysis is [30-prestige-directions.md](30-prestige-directions.md); named there as **direction D
from [29-direction-and-odds.md](29-direction-and-odds.md) executed** — the map, the Stand, the
meadow and the bench are *parked, not deleted*, and two of the five ideas show where they return.

**Finding one: the economy is bounded, and a bounded economy cannot prestige.** Measured, not
estimated: seed costs span 2,000× over 19 tiers (×1.53/tier) and endgame income is **flat at
~1.48M/hour forever** once badges cap. Prestige needs a run that *decelerates* — this curve
flattens into a wall, so the "prestige at 10–20% of peak speed" heuristic never fires and a
lifetime-earnings currency pays the same per hour in run nine as in run two. Two ways out were
named, and the recommendation takes the second: reshape the economy exponential (genre-standard,
drags every number), or **make the season decelerate instead of the costs** — the run slows because
the year ages into autumn, which is cosy-native and puts prestige timing in the art rather than in
a derivative.

**Finding two: the one-number rule meets prestige and one of them must bend.** If reputation never
resets, nothing re-locks and a fresh start begins with all nineteen seeds — no ladder to reclimb.
If it resets, "earned never spent, never lost" breaks and the Stand loses its floor. **Resolution:
split what the number displays, not the number** — lifetime reputation never resets and stays the
meta-track; the *season's level* derives from reputation earned this season and is what gates the
seed ladder. One field, no second currency, and the audit's "no vertebrae past 17" problem
dissolves because the ladder is reclimbed rather than extended.

**A standing never-resets list was proposed for sim-test:** creatures, the Hollow, lifetime Almanac
records, cards, gems, mementos, lifetime reputation. Coins, plots above four, badges, boosts,
season level and **Bloom Mastery** reset — which is the strongest argument yet for the audit's
mastery cap, since a bounded ladder can convert to a permanent bonus at season's end and an endless
one can only be confiscated.

**The five, priced** (base $3–5K/mo / breakout >$20K/mo): **1 The Turning Year 40/12** — full
prestige, season-aging as the decelerator, permanent upgrades named **Perennials** because the
metaphor explains persistence without a tutorial sentence. **2 Seed Saving 35/15** — the prestige
currency is an **Heirloom Seed** whose properties are inherited from how the season was actually
played; it is the breeding feature the owner already wants, arriving as the prestige payout.
**3 The Gardens Ladder 30/10** — Egg Inc's sequential ascent, and the parked map places become the
later rungs, so the garden-only focus re-sequences the map rather than deleting it. **4 Fallow
Beds 25/6** — "restart halfway" literally, per-bed; rejected as spine because partial resets never
produce the fresh start that is most of why prestige retains. **5 The Compost Heap 20/5** —
sacrifice as continuous prestige; rejected as spine (no re-climb), kept as the first mechanic where
a harvest has two mutually exclusive uses.

**Recommendation: build 1+2 as one system (combined ~45/15, the best base odds priced so far), hold
3 as the long-run ceiling, fold 4 and 5 in later as texture.** The turn is *invited, never forced*
— autumn makes it obviously right — which answers the owner's "forced players to restart" framing
with the cosy version of the same pressure.

**And the retune is unblocked by the owner, same day:** *"we can retune the economy. The economy is
already broken."* The deferral's original condition — an economy is tuned against the systems that
consume it — is now satisfied the only way that matters: the consuming system is the prestige loop,
and it is being designed first.

### Rejected

**Bolting prestige onto the frozen port** — finding one is why. **Resetting reputation** — the
spine's trust rule is worth more than the simplicity. **Fallow Beds or Compost as the spine** — both
are texture. **A global season clock** — the Shared Sky composes with per-player years, but the turn
must stay the player's own, or prestige loses authorship. **Treating the garden-only focus as
abandoning the map** — the Gardens Ladder is the map re-sequenced from geography into progression.

---

## 2026-08-26 (strategy) — Four directions priced, and the hook turns out to have shipped by accident

**The owner's question, asked directly:** *am I entering a genre so saturated the game cannot stick
out, or should I focus on the idle incremental tapper — and what would it take to build something
that succeeds?* The analysis is [29-direction-and-odds.md](29-direction-and-odds.md).

**The framing was rejected first.** Saturation is not the problem. **1,087 idle/clicker games in 2026
earned ~$3.97M combined — about $3,650 each.** That is not a saturated market; it is a market full of
games nobody could find, and it is *good* news for a team whose advantage is craft, because the
median competitor is not competing. The genuinely saturated case is Merge-2, which is crowded with
**funded** competitors rather than bad ones. So the useful question is not crowded / not-crowded but
**does this category reward craft or reward spend** — and idle, cosy and farming-sim reward craft.

**The selection criterion that follows:** three of the four distribution channels available to two
people with no UA budget — community posts, platform editorial, clips — are closed to a merge board,
and all four reward the same two things. **Does the direction produce a sentence, and a five-second
video?** The project currently has craft and neither of those, which is exactly the Terrarium: Garden
Idle warning: 11M installs, ~$9K/month. Reach without a reason.

### The four, priced (base = $3–5K/mo; breakout = >$20K/mo)

**A — finish the plan: 30% / 7%.** Safest, most likely to be a real small business, most likely to be
invisible. Cats & Soup's $300K/month arrives with Netflix distribution attached.
**B — the merge pivot: 12% / 3%.** Highest theoretical ceiling, worst odds from this position;
strands the garden, the tap loop, the creatures, the weather and the mutations, and requires energy.
Priced rather than dismissed so the shape of the bet is visible.
**C — the Shared Sky: 40% / 15%. Recommended.**
**D — the incremental-depth reposition: 35% / 10%.** Magic Research made ~$400K in twelve months
from essentially two posts on r/incremental_games, and this game already has more systems depth than
most incrementals — currently half-hidden by the cosy framing.

**A, C and D are not mutually exclusive.** A is the plan, C is the hook A lacks, D is an audience A
could also serve. Only B is a fork.

### The finding: the hook shipped on 2026-08-15 as a convenience

`DATA.weather` runs on **wall-clock epoch time**, chosen so that offline reconciliation could resolve
any past slot. The consequence nobody drew: **every player in the world is under the same sky at the
same moment**, and the sky is computable forwards as well as backwards — so the game can print a
**forecast**. Not "it might rain." *"Wonderfall at 6:42."* Wonderfall is 0.5% of 60-second slots, so
it lands roughly seven times a day, worldwide, simultaneously, and it is the rarest mutation tier in
the game.

**That is a synchronous global event with no server, no accounts and no friend graph** — the three
things this team does not have. It supplies the missing sentence (*everyone's garden shares one sky,
and you can read the forecast*), the missing reason to open the app, a notification that is news
rather than guilt (doc 17's warning is about **streak** nudges, and this is not one), the missing
clip, and the missing reason planting is a *timing* decision rather than a shopping list.

**And it names an identity five built systems already share and nobody had connected:** the epoch
day/night cycle, weather, mutations, Nightbell's night multiplier and the Ridge / Night Garden are
all *the world has a clock and you play against it*.

**Two weaknesses recorded rather than glossed.** Without a server the game can *assert* a shared sky
and cannot *demonstrate* it — no "1,204 gardens are in this storm" counter; the forecast is real and
needs no server, and a read-only counter is the cheapest server anyone has specified, worth costing
rather than blocking on. And a uniform global slot clock gives a player in the wrong timezone fewer
good skies while awake, which needs checking before it ships.

### What it takes regardless of direction, and four of the five are missing

A one-sentence hook; **D7 above ~15%**, which is now an ASO input and therefore the only free
algorithmic lift available — and which needs dailies, streaks, notifications and a designed session,
none of which exist; **one monetization lever needing no live-ops** (rewarded video, piggy bank,
content pack — all specced, none built); **a distribution date to build toward** — Wholesome Direct
is annual, June, free to submit, 5M+ views in 2025, next window roughly nine months out; and scope
discipline, which is Sneaky Sasquatch against Palia.

### Rejected

**Choosing by genre.** The question was asked as one and it is not one; at this scale distribution
decides, and doc 25 already said so — *"building a bigger map does not move this game toward the
first number; distribution does."* **Treating the merge pivot as unthinkable** — it is priced, and
its odds are bad from here rather than bad in the abstract. **Adding a social system to get the
shared feeling** — the epoch clock already delivers it for free, and a friend graph is a backend.
**Treating D as a pivot** rather than a second audience C happens to serve, since a public forecast
you optimise against is what the incremental crowd wants and a shared sky is what the cosy crowd
posts about.

---

## 2026-08-26 (design) — Merge moves to the centre, and the garden stays the home screen

**The owner answered the audit's five questions, and two of the answers change the shape of the
game.** The proposal is [28-the-loop.md](28-the-loop.md); this records the argument, because the
argument is the part that will be needed again.

**The owner played Gossip Harbor and agreed merge is underutilised** — *"maybe The Little Garden is
secondary. Maybe this turns into a game that's more like Gossip Harbor, and we just have some extra
features like the garden and the pets. I don't know."* The advisor's answer is **yes to merge
central, no to a merge game**, and it goes further than the current plan in every respect except
that one.

**What the owner actually liked contains three things and only one is about merge.** In their
words: *"you spawn items while you're merging, and then you see the orders appear up top as you
play."* A generator you act on; **demand rendered on top of supply**; visible progress while you
play. The middle one is load-bearing and it is a **layout** insight, not a genre one — Garden
Wonder currently puts its demand *two navigations* from its supply, which is why the map MVP's own
rubric question (*does checking the Stand pull you back into planting something specific*)
structurally cannot pass.

### Why the garden stays home

**Merge core loops monetize on energy**, and energy is rejected twice already as the anti-cosy
pattern. Gossip Harbor, Merge Mansion, Travel Town and Family Island are all energy-gated, because
a merge board is infinitely playable and the developer sells the right to play it. Remove energy
and the shape has no engine under it.

**A merge core loop carries the content treadmill that killed the match-3 plan.** Merge was chosen
over match-3 because match-3's authored level treadmill is unsustainable for two people. That holds
while merge is a side board; promote it to the core and the treadmill arrives with it, because a
merge board with nothing to spend on is a board you abandon. **The board is the cheap half of a
merge game; the task ladder is the expensive half, and it never stops.**

**And it trades the only differentiated asset for the most commoditized screen in mobile.** Doc 17
names the moat as Mario Wonder juice on an idle garden and lists Merge-2 in *avoid entirely* as a
Century Games / Moon Active capital war. **You cannot out-spend Century Games; you can out-craft
them. Merge rewards spend, cosy rewards craft** — and the free distribution this project can
actually reach (Wholesome Direct, r/incremental_games, r/CozyGamers) is closed to a merge game.

### The four changes proposed instead

**The order queue comes to the garden** — three customer faces above the plots, the Stand's existing
simulation rendered where the planting decision is made. The Stand survives as the place you go to
deliver; what moves is the *ask*. **The bench becomes the second screen, not the sixth place**, one
gesture from the garden with the same strip above it. **The bench is the job that never automates**
— the garden automates by design, the bench cannot, and that is the answer to *what is the player's
job after automation*, which is the hole the missing ceiling, session shape and retention plan are
all three views of. And **the generator is the garden, never an energy meter**: harvests drop chain
items (already built), `basketMax` caps the bank, board space caps the hand, and *"board space is
the only sink that scales with how automated the garden already is"* turns out to have been written
for a purpose nobody had identified yet.

**The consequence nobody had noticed:** a harvest's bench rung is
`seedBucket[seed] + rarityBump[rarity]`, so **rarity and mutations already decide the quality of the
merge board**. Legendary stops being a bigger number and becomes a better hand. That is the
strongest answer the project has had to *why does the garden still matter*, and it needed no design
at all — only noticing that two shipped systems already touch.

### Scarcity gets a rule

The audit found nothing in the game is scarce and that this is upstream of the missing ceiling.
The rule proposed: **scarcity in a cosy game is space and attention — never permission, and never
progress.** You may run out of room and out of hands; you may never run out of the right to play,
and nothing earned may be taken away. It is checkable, and it is exactly why an upkeep clock passes
and an energy meter does not: hunger costs a creature's *work* and is visibly reversible, energy
costs you the *game*.

Four of the five scarcities already exist (board space, habitat slots, plot adjacency, the awake
clock); the fifth is the Night Garden's time-of-day gate, which is scarcity of *opportunity*.

### Three session shapes, finally specified

Three documents described a session and none specified one. Now: the **40-second check** at map
altitude where no decision is required and the rewarded video belongs; the **7-minute sit-down**
across garden and bench, where every beat is a decision and the order strip is the thread that
turns six systems into one errand; and the **30-second return** for one specific finished thing,
which is what notifications serve.

### The owner's other answers

**Creatures: many, and eventually bred.** The current model — attracted by a bloom, raised by
duplicate harvests of that bloom — stays as the acquisition verb, and a hatchery is wanted long-run.
Recorded as direction; the roster's shape is item 1. **Seasons and the content bill of materials
are both deferred** by the owner as separate conversations. **The cheat buttons stay**, reconfirmed
2026-08-26 — the audience is still a small group of friends playtesting, which is the condition
[11-known-issues.md](11-known-issues.md) already names.

### Rejected

**The full pivot** — garden demoted, merge board as home. **Energy in any form**, including a soft
one on a generator; there is no version that is a little bit of both. **Leaving the bench on the map
as a sixth place** — it is the second screen or it is nothing, and ten days of it sitting unbuilt
behind two navigations is the evidence. **A second generator on the bench itself**, which would work
and would immediately make the garden optional. **Adding any new mechanic to fill the
after-automation hole** — the cheapest fix was a system already built and carrying no job.

---

## 2026-08-26 (design) — A design audit, and four arguments with the brief that framed it

**The owner asked for an audit before a plan, and named eight known gaps rather than letting them
be rediscovered.** All eight are real. The audit is
[27-design-audit.md](27-design-audit.md); this records the positions it took and what it rejected,
because those are the parts nobody can reconstruct from the document later.

**The game has a spine, and it is reputation.** One number, earned never spent, no XP, level as its
display, and the curve pre-aligned to the order tiers. What is missing is not a spine — it is that
**the spine has no vertebrae past level 17**, because the things it was going to gate are unbuilt.
So "which collection is the spine" was **rejected as the first question**: a collection is not a
progression track anywhere this game is drawing from, it is a retention surface hung off one.
Monopoly Go's spine is the dice loop. The answerable question is *which collection is the player
asked to finish, and what happens to the others.*

**There are five collections and a half, not three.** Card album, creature roster, Honey Shelf,
species Almanac, Bloom Mastery, and mementos with no sink. **Three of them are the same table** —
Shelf, Almanac and Mastery are all keyed on the same nineteen seeds and are three screens rendering
three columns of one spreadsheet. Folding them into one nineteen-row Almanac is the cheapest
structural improvement in the project and it makes *why plant this flower* answerable five ways on
a single row.

**"Idle or tapper" was rejected as a false binary** — the docs already answer it twice (the map
serves the 40-second session, the garden the 7-minute one) and no title at this scale is a pure
tapper. The real question hiding behind it is better: **what is the player's job when they open the
app?** Today it is tap and re-plant, and both are designed to be automated away.

**Nothing in this game is scarce, and that is upstream of the ceiling.** Every seed returns 2.212×
cost in expectation, there is no bad purchase, and outside creature hunger nothing can go backwards.
A pillar against *punishment* has been read as a pillar against *stakes*. The ceiling is a symptom;
scarcity is the cause — so **a new item 0 was put ahead of the owner's list**: what a session is,
what the player's job is after automation, and what is scarce. The sleeping face is the proof the
game can carry a stake cosily, and it has been used exactly once.

**Monetization was split in two and the halves moved apart.** Architecture — what is sold, what is
never sold, which surfaces exist — is cheap and constrains the economy, so it stays early. SKUs and
prices move *after* the retune, because a piggy bank cannot be priced against coins that are about
to change and a 2× collect-all video cannot be placed before collect-all exists.

### What the audit recommends cutting, and the counter-cases it recorded

**The Honey Shelf as a screen** (fold to a column — high confidence). **Seasonal card albums**
(keep the pack opening and the spawning proc, cut the cadence — high confidence, and two documents
already argue for it: doc 19 calls a season "a subscription to your own output" and doc 15 says
"do not over-invest"). **The Greenhouse** from the biome list (its stated purpose is farming
mutations, which attacks the one income share the suite holds under test — free to cut, unbuilt).
**Bloom Mastery bounded rather than deleted**, because being endless is what makes prestige
unsolvable.

**And the merge bench, which deliberately relitigates 2026-08-16.** The reason offered: that
decision was made when the bench was going to be the project's *only* meta system, and it is now one
of six places behind two navigations. Merge is a core loop, not a side room — Gossip Harbor grosses
$100M a month because merge *is* the game. The Stand already proved the transformer role does not
need a crafting system, since an order-shape bouquet is three roses and two bluebells and no bouquet
object exists. A timed production queue is the cheaper fill and it answers the retention gap
directly, being a reason to come back at a specific time. **The counter-case is recorded rather than
dismissed:** the simulation is written and tested, four of six goods families are specced as merge
chains, and the market genuinely favours merge+orders right now. The honest alternative is that
merge **moves to the centre** and becomes the second core screen — a bigger decision than it looks.

### Rejected

**Rewriting docs 17 and 25.** Both hold up; the audit extends them and lists what has gone stale
instead. **Redoing the market research.** **Proposing new systems** — the brief asked for cuts and
consolidation first and the audit found no gap that a new system fixes better than a consolidation
does. **Treating "reputation gates almost nothing" as a contradiction** — level gates and coins pay,
consistently, on both boards already built; that model is right and the gap is only that the map's
parcels still refuse.

### Seven stale claims found in the docs, listed in the audit

Status lines and "locked decisions" go stale faster than body text, because a later session adds a
section rather than retracting one. Doc 13 still says "not built" and the Stand shipped; doc 12
still lists the Apothecary as a region, still specifies an eight-hour flat offline cap, still
locks in storage caps that have never existed, and still defers a "Critter Grove" that shipped as
the creature roster; doc 15 presents three dock layouts as current; doc 22 says "only one creature"
and there are six. **Same failure as the visual standard, and the same cause: nothing enforces it.**

---

## 2026-08-26 (fix) — "Asleep" was wearing Epic's colour, and purple is spoken for

**The creature panel painted a sleeping creature lavender: `#f2eeff → #e2dbf8`, with `#eae6fb` and
`#b3a7e8` on the cards beside it.** That is the `--epic` family — `#b197fc` — at a different
lightness. Rarity colour in this game is a vocabulary, not a mood: a player learns blue / purple /
gold once and then trusts it across particles, plot auras, toast borders and floating text. Spending
purple on a *state* quietly teaches them that a hungry creature is a rare one, and the cost lands
somewhere else entirely — on the next Epic drop, which now has to compete with a food timer for the
meaning of the colour.

**The replacement had to say "drained", and drained is a value change, not a hue change.** A creature
that has run out of food is not alarming and it is not special; it has gone quiet. The right reading
is the same surface, tired — so `--paper-dim` (`#ebe5d9`), `--paper-dim-2` (`#d8d0c0`) and
`--paper-dim-edge` (`#bcb0a0`) are the interface's own cream with the saturation pulled out and the
value dropped. Nothing new enters the palette's *hue* budget; three names enter its value budget,
which is the cheaper of the two.

**Three tokens rather than five inline hexes, because this state appears in five places.**
`.cp-fuel.out`, `.cp-head.asleep`, `.feed-row.napping`, `.feed-alert` and `.cp-card.bad` all read
from the same names now, so the next state that needs to look drained has somewhere to point rather
than a hex to copy.

**Rejected: `filter: saturate(.3)` on the panel, the way locked meadow land does it.** It is the
tidiest expression of exactly this idea and it desaturates the element's *children* too — which on
`.cp-head` means the creature's portrait and its star row, and on a feed row means the food icons.
A drained background with a full-colour creature asleep on it is the correct picture; a fully
desaturated card is a disabled one, and a sleeping creature is not disabled — it is right there and
one meal from waking. That distinction is the whole reason an upkeep timer is survivable in a cosy
game, so it is worth three tokens to keep it.

**Rejected: a blue or grey from outside the rarity set.** Blue is `--rare`, grey belongs to
`.price.maxed`, and either would have been a fourth thing for a colour to mean. Taking the value out
of a surface the player is already looking at needs no new meaning taught at all.

## 2026-08-26 — Nineteen seeds, nineteen badge colours, and no new hexes to maintain

**The picker's art badges were all the same mint-white disc.** `#fff → #e8f7e3`, nineteen times down
the left edge of a scrolling list, which is the column the eye actually uses to find a row. The
blooms inside them differ, but at 40px inside a 54px circle the disc is what registers first and it
was saying nothing. The badge now takes the seed's own `art.c1` — the deep petal colour that already
drives its gradients — so the left edge runs the hue wheel in tier order.

**The white radial became a veil rather than a fill, which is what makes this free.** `c1` values are
fully saturated by design: `#4c6ef5`, `#e03131`, `#d6336c`. Painting one straight into a badge would
put a 3px ink bloom on a mid-dark disc and lose the outline. Laying
`rgba(255,255,255,.95) → rgba(255,255,255,.6)` over it instead pales any hue to a legible surface
while leaving the highlight at 34% 28% exactly where it was, so the badge is the same object it
always was with the colour swapped in underneath.

**Rejected: a hand-picked pale hex per seed.** It gives finer control over each badge and it costs
nineteen new colours in a stylesheet that already accumulated 149 by accident, plus a second value
to remember every time a seed's art is retuned. The veil derives from what is already in `data.js`,
so a seed that changes colour changes its badge with it and nobody has to notice.

**Daisy stays white and that is correct, not a bug.** Its `c1` is `#ffffff`, so its badge is the one
that does not tint — which is a truthful reading of a white flower rather than an exception to work
around.

## 2026-08-26 — The flavour line moved to the Almanac, because the picker is for choosing

**Every seed row said the same thing twice in two registers.** *"Shaded blossom that rewards patient
gardeners"* and *"Neighbouring plots grow 15% faster"* are one fact at two volumes, and only one of
them can be acted on. The picker was carrying seven facts a row across eight rows — around fifty-six
on one screen — against the garden's nine objects and one number. Restyling thirty pills to be
louder without cutting anything would only have produced a loud dense screen.

**Cutting the prose was the right half to cut, and the reasoning is not "less is more".** The trait
note carries a decision; the flavour line carries a mood. A screen a player opens *to choose* should
hold what changes the choice, and a screen they open *to read* should hold the rest. The Almanac is
already that reading screen — it renders every bloom at 22px next to a lifetime count and a mastery
ladder — so the copy did not get deleted, it got filed. Ungrown rows keep it too, since the name and
the bloom are already visible there and there is nothing to spoil.

**The row lost about a third of its height and all of its grey at once.** That was the second reason:
the flavour line was the last `opacity: .7` text on the screen, and two lines of washed-out prose per
row was doing more damage to the sheet's calm than the pills were. Its one surviving rule now uses
`var(--ink-soft)` at full opacity, which is the colour it should always have been.

**`.seed-row` gained the plot's contact shadow.** It had the correct lip and no `0 8px 14px` under
it, so rows sat *on* the paper instead of above it — the fifth layer of the recipe missing from an
object that has the other five. The press now collapses the lip and tightens the shadow together,
the way `.plot:active` does, rather than dropping the lip and leaving the object's shadow where it
was.

**Rejected: keeping the description behind a tap or a long-press.** It is a real pattern and it is
the wrong one here — a disclosure control is a new affordance to teach, on the one screen where the
whole row is already a button, in order to reach copy nobody needs at the moment of choosing.
Rejected too: showing it only for undiscovered seeds as a lure. That inverts the information — the
seeds you know least about would be the ones described most, and the picker would get chattier
exactly where a player is least equipped to act on it.

## 2026-08-26 (fix) — Thirty grey smudges were most of why the seed sheet read as a spec table

**`.stat` was `rgba(44,26,16,.07)` with no border and no lip.** Three or four to a row, eight rows
deep — around thirty flat elements on one screen, in a game whose fourth value tier is *every number
lives in a cream pill with a contour*. That is not a small inconsistency; it is the single rule the
HUD is built on, suspended for the one screen that shows the most numbers. They now take
`2px var(--ink)` and `0 2px 0 var(--ink-2)`, and the fill is the cream gradient rather than a
percentage of ink, because 7% ink on cream is grey and grey on cream reads as disabled.

**`.stat.good` takes the green `.price.ok` already uses, deliberately and not coincidentally.** Green
should mean *yes* in one voice — affordable on a price, generous on a yield — so both are
`#d3f9d8 → #8ce99a`. `.stat.gem` follows into `#cdeeff → var(--gem)` for the same reason: the gem
colour is already spoken for, so the pill should wear it rather than a translucent wash of it.

**`.verb-note` needed a different argument than the pills did.** Its problem was not only material —
a flat band with a `border-left` accent is a *web* pattern, and it made the most decision-relevant
fact in the row look like the least interesting one. The verb's tint is now the note's body instead
of a stripe down its side, under a white veil that pales any tint to a legible surface. That solves
a real constraint cheaply: `DATA.verbs` carries seven saturated tints, ink on `#6f7bff` is a
marginal contrast, and adding a second pale hex per verb would have doubled the palette to fix a
rendering problem. One veil, seven verbs, no new tokens. Its radius drops 9 → 12, removing the
fourteenth radius in a system documented as having three.

**Rejected: `color-mix()` for the veil.** It is the obvious modern answer and it would read better in
the source, but it is the sort of thing that silently degrades to nothing on an older phone, and the
project's whole deal is that it runs from a file with no build step and no polyfills. A stacked
white gradient over a solid colour does the same job with no support question to answer.

**Rejected: leaving `.stat` alone and only cutting rows.** Density is the other half of this screen's
problem and it is handled separately, but a loud fix and a quiet cut have to land in that order —
restyle first and the row's real weight is visible, cut first and you are guessing.

## 2026-08-26 (fix) — The creature panel had the shapes and not the material

**`.cp-skill`, `.cp-card`, `.cp-head` and `.cp-said` were a 3px ink border around a flat fill.**
Structurally the panel is the best information design in the game — the art broken out over the
sheet's top edge, the level bar tall enough to stack a count and a caption, the number inside the
star rather than beside it. It read as a form anyway, because four of its six boxes were the only
surfaces in the game with no side wall. They now carry `0 3px 0 var(--ink-2)`, which is the height
the ladder gives a box that size.

**The three state modifiers had to be edited with them, and this is the trap worth naming.**
`.cp-card.bad`, `.feed-row.napping` and `.feed-row.fed` each set `box-shadow` to an inset ring.
`box-shadow` is one property, so adding a lip to the base rule would have given every card a lip
*except* the ones a player is most likely to be staring at — the hungry one and the sleeping one. The
rule is now in `05-art-direction.md`: a modifier that writes `box-shadow` restates the lip.

**The feed cards got the whole recipe rather than a lip, because they are buy buttons.** They are
the only things on the panel that spend currency and they were a flat `var(--paper)` fill — the same
material as the label boxes around them, which is precisely the wrong signal. All six layers now,
plus a press that collapses the lip fully at `translateY(3px)` and tightens the contact shadow to
`0 3px 6px`, matching `.round-btn`.

**The blemish and rim alphas had to be retuned for cream, and that is a documented variant rather
than a new invention.** The plot's `rgba(255,255,255,.16)` highlight is invisible on `#fff8e7`, and
its `rgba(0,0,0,.10)` dirt mark over cream resolves to the same grey-tan as the translucent lip did
— the identical mistake one layer down. The geometry is the plot's, unchanged: same blemish
positions, same radii, same rim offsets. Only the colours warm up. The meadow already did this for
stone with `--cob-*`, so a per-surface alpha set is the established pattern, not a new one.

**Rejected: gradients on the other four boxes in the same pass.** A flat fill inside a 3px contour
with a solid lip is a legitimate material in this system — `.tab` is exactly that and it is canon.
The four boxes needed a side wall, not a rebuild, and pushing further would have made a fifteen-
minute change into a redesign of a panel whose layout is already right.

## 2026-08-26 (fix) — The translucent lip was most of what "the art is degrading" meant

**Counted at 8393738: forty-six zero-blur `rgba(44,26,16,…)` shadows against thirty-nine solid
`var(--ink-2)` lips.** The wrong one was in the majority, and it had got there one defensible edit
at a time — every new panel since the garden wrote `0 3px 0 rgba(44,26,16,.22)` because it looks
right in isolation and nobody was comparing it to a plot.

**It is not a subtle difference; it is a material difference.** A lip is the object's extruded side
wall, so it has to be opaque and it has to be the object's own dark. Twenty-two per cent ink over
cream resolves to a desaturated grey-tan, which is not a side wall at all — it is a drop shadow, and
a drop shadow says "this is a graphic printed on a page" where a side wall says "this is a thing you
could pick up". Same geometry, opposite claim. Thirty-nine of them are now `var(--ink-2)`, at their
existing heights, and the ladder is written into `05-art-direction.md` so the height stays a size
signal rather than a taste decision.

**Every drifted lip turned out to be on paper, so none needed `--soil-dd`.** The rule covers both —
`--ink-2` on paper, `--soil-dd` on soil, `#6b4423` under the board — but the soil surfaces are the
garden's, and the garden never drifted. That is the whole finding restated: the drift is in
everything built *after* the screen the standard was measured off.

**Seven were left translucent on purpose, and this is the part a future grep will re-flag.** The
same pattern appears in `.talker` and `.sheet-art svg` as `filter: drop-shadow(0 6px 0 rgba(…))` and
in `.outlined`, `.hollow-name`, `.hollow-count`, `.hollow-empty` and `.burrow-label` as a text
skirt. Those are not lips. They are shadows a character or a letterform casts *onto the surface
below*, they fall on lawn and soil at least as often as on paper, and an opaque `--ink-2` under a
white numeral on green would read as a second outline in the wrong colour. **The test is what the
shadow is attached to, not what the shadow looks like:** an object's own edge is opaque, a shadow
cast on something else is not.

**Rejected: normalising the opacities instead.** The forty-six spanned `.2` to `.4` and picking one
value would have made the drift consistent rather than absent — a tidy grey-tan lip is still a grey-
tan lip. Rejected too: sweeping the heights at the same time. Several are load-bearing against a
`:active` travel that has to match them, and changing colour and geometry in one commit would make
any regression impossible to bisect.

## 2026-08-26 (fix) — `--ink-soft` was a real colour that got into the game by accident

**A visual audit of `style.css` at 8393738 counted `var(--ink-soft, #7a6047)` twenty-three times and
found the variable declared nowhere.** Every one of those rules silently took the fallback, so the
game has had a second ink colour for months and nobody ever chose it. It is on the creature panel,
the critter cards, the onboarding copy and the overworld tags — all of the descriptive text on
paper, which is exactly the job a secondary ink should have.

**Declared rather than deleted.** The alternative was to rewrite all twenty-three rules onto
`--ink-2`, which is the lip colour and too dark and too close to the heading weight to read as
secondary, or onto `opacity` on `--ink`, which is the pattern this pass exists to remove — opacity
drags text toward the surface behind it, so the same rule gets washier as the panel gets lighter.
The accidental colour was the right colour. It is now `--ink-soft: #7a6047` in `:root` and in the
palette table, and the palette is nineteen names instead of eighteen.

**The hex fallbacks came out with it.** Once the token exists, `var(--ink-soft, #7a6047)` is the hex
written twenty-three more times in a file whose rule is "write the variable, never the hex". The
`--paper-2` and `--paper-3` fallbacks were worse than redundant: `var(--paper-2, #f3e4c6)` against a
real value of `#ffeecd`, and `var(--paper-3, #f7e7c4)` against `#ffe0ad`. Nine occurrences, both
wrong, harmless only because the variables always resolved — a wrong value sitting in the source
waiting for the next author to copy it out of a `var()` and into a fill.

**Rejected: keeping fallbacks defensively.** A `var()` fallback is a second definition of the colour,
maintained in a place nobody looks, and it converts a loud failure (nothing renders) into a quiet one
(it renders the wrong colour). If a custom property can fail to resolve, that is a bug at the
declaration. The rule is now written into `05-art-direction.md`: no hex inside `var()`.

## 2026-08-25 (fix) — The meadow was not built for a phone, and everything else followed from that

**The owner put the two screens side by side again and the list was blunt: the buttons do not line
up, the background is too busy, it reads as a prototype.** Then the sentence that named the cause:
*"we're building this for mobile. The reason why the garden looks so good is it's made for mobile."*
Every item on the list turned out to be one omission wearing four costumes.

**`.ui` is `max-width: 560px; margin: 0 auto`, and a place layer is not inside `.ui`.** That single
line is what makes the garden a phone column centred in a laptop window. The Hollow sits inside
`.ui` and inherited it without anyone noticing; the meadow and the map are siblings of `.ui` at
`#world` level, because a room has to paint *under* the HUD. So the meadow was the only screen in
the game running the full width of a desktop window — a dock three times the garden's, a board a
third too big, and cobbles scaled up with it. **The rule is now written down: a room built as a
layer re-states the column itself.**

**And the scene was doing the same thing in SVG.** The backdrop was composed at 390×844 and drawn
with `preserveAspectRatio="slice"`, which does not crop to fit — it *scales* to cover. A 1440-wide
window multiplied every blade of grass by 3.7. The scene is now drawn 1:1 into the room's measured
box with everything positioned as fractions of it. **"Busy" was never a decoration problem; it was
one attribute.**

**Rejected: capping the layer itself.** Constraining `.meadow-layer` would have capped the scenery
too, and the garden's sky, hills and fence deliberately bleed to the window edges. The split is
scenery full-bleed, interface capped — which is what the garden already does and what nobody had
had to state before, because until the map there was only one room outside `.ui`.

**The keepers stopped being scene-positioned, and that is a simplification worth keeping.** They had
been mapped from scene coordinates through `getScreenCTM()`, which was correct only while the scene
and the layer were the same box. Once the board became a centred column they belonged to the column,
so they are now a flex row in the yard — the same yard the garden reserves as `.stage` padding so a
creature never stands on a plot. A whole class of coordinate bugs went with it.

**The swipe out of the room was a hidden control.** Excluding cells from the gesture had left it
working only on the slivers of scene either side of the board, which on a phone is most of the
screen unreachable. The distinction that makes it safe: **the meadow's cells act on `click`, not on
`pointerdown`**, so a drag may begin on one and simply withhold the click at the end. The flower
still cannot start a swipe — it pays on pointerdown and that latency is load-bearing.

**Locked land, and why it is the garden's logic rather than a new one.** The owner asked for a level
gate and a coin gate and said the values could be settled later. The values are provisional; the
*shape* is not. `cellUnlockLevel` / `cellAvailable` / `cellLocked` / `unlockCell` mirror the garden's
plot functions line for line, and the cell wears the same two-stage chip — the level until you reach
it, then the price. A second board teaching a second acquisition rule would be the clone trap
arriving through the back door.

**One migration decision worth recording: ground a player has built on is never taken back.** A save
that predates the gates keeps every cell that holds something and re-locks only empty land. The
alternative — grandfathering everything open — would have meant the owner never saw the feature on
their own save, and the alternative to *that* would have been taking hives off people.

---

## 2026-08-25 (art) — The meadow is cobbles on a stone terrace, and the material is the verb

**The owner put the two screens side by side and called it: "night and day."** The diagnosis was
already written in [05-art-direction.md](05-art-direction.md); this entry records what was chosen to
answer it, and the one decision that was not in the diagnosis.

**The board is stone and the cells are cobbles — the owner's call, and it is better than "turf on
earth."** The diagnosis only demanded a body colour that is not the world's colour. Cobbles do that
and one more thing: they say what the verb is. Soil is the right material for something temporary —
you dig it, plant it, harvest it, clear it. A cobbled floor is something somebody laid and left,
which is exactly "place it once and it stays." **Sharing the board and differing in the material is
the house rule working in the surface rather than in a label**, and it means the two rooms can never
be confused even in a thumbnail.

**Rejected: making the meadow's cells lighter than its board.** The garden runs a light-mid board
with darker plots inside it, and inverting that in the second room would have cost the thing the
whole exercise was for — one ladder of values a player learns once. The meadow now runs the same
four tiers: ink, light warm stone, dark cobbles, cream chips.

**Rejected: a status colour per cell state.** The old board repainted the whole cell for empty,
hive, tender and ready. **A cell is a place, not a status light** — the cobbles now read the same in
every state and what changes is the thing standing on them, with the "you can afford this" invite
moved onto the empty socket. Ringing all eight cells at once had turned the board back into the
wireframe the art pass existed to kill.

**The grass lesson is the one worth carrying.** The owner's second complaint — the grass over the
wall "looked horrible" — was not a colour problem. Grass had been drawn as tall thin strokes spread
across the whole face of the wall, which reads as a comb laid on the stones. **Grass is a mass first
and blades second:** a soft mat with blades growing out of it, and the mat hides every base. The
wall is now drawn *between* two bands so it stands in the grass rather than wearing it, and it is
capped with coping stones stood on end, without which four level courses of similar stones read as
brickwork whatever you do to them.

**Three bugs surfaced only because the art was being looked at closely**, and all three had been
shipped and invisible: an empty keeper stand initialised `dataset.look` to `''`, which is also an
empty slot's id, so the sprout marking a free stand had never once been drawn; the meadow's clouds
animated the same group that carried their `transform` attribute, and a CSS transform *replaces* a
presentation attribute, so both clouds were swept to y=0 and off the top of the viewBox since the
screen shipped; and the reduced-motion block sat above the rules it cancels, where a media query
adds no specificity and therefore loses the cascade — the clouds, blades and fronds kept moving with
reduced motion on. **None of these is findable from a test. All three were findable from a
screenshot**, which is the argument for looking at the picture before calling anything done.

---

## 2026-08-25 (fix) — Tapping a place on the map did nothing, for two reasons at once

**The owner's report was the whole diagnosis: on a desktop mouse, tapping Wild Meadow would not
open it, but tapping fast several times sometimes worked.** "Sometimes, if I tap really fast, it
works" is the signature of a target that keeps disappearing — and there were two independent causes.

**One: the map rebuilt its places on a timer.** `renderMap()` rewrote `#owGarden` and `#owMeadow`
`innerHTML` on every slow tick, so the element under the cursor was destroyed and recreated every
0.6 seconds. A press that began before a rebuild had no target left by the time it was released.
Tapping fast "worked" purely by landing inside the gap. **This is the same trap as the flashing
pets, in a file that had not been fixed with them** — never recreate a node on a timer. Both places
now memoise against a signature and only rewrite when something actually changed.

**Two: `setPointerCapture` retargets every later pointer event to the capturing element.** So
`pointerup` arrived claiming that the map itself had been pressed, and `e.target.closest('[data-go]')`
found nothing. The capture existed to keep a drag alive when the pointer leaves the layer — which a
full-screen layer barely needs — and it cost far more than it gave. **It is gone.**

**The gesture now resolves what was pressed at `pointerdown`, as ids rather than nodes**, and the
release reads those. That is immune to both causes at once: a retargeted release still knows what
was pressed, and so does a press whose node has since been replaced (a detached element's
`closest()` walks up to nothing, so keeping the node would not have been enough).

### Why the tests did not catch it

**Synthetic `PointerEvent`s have no live pointer, so `setPointerCapture` throws** — and the call was
wrapped in a `try/catch` that swallowed it. Every automated tap therefore took a code path no real
mouse ever takes, and passed. The regression check that matters is now the one that dispatches
`pointerdown` on the target and `pointerup` on the LAYER, reproducing the retarget on purpose.

**The lesson is general: a synthetic input test can silently avoid the very branch that breaks real
input.** When a gesture works in automation and fails on a device, suspect the difference between
the two rather than the logic in between.

---

## 2026-08-25 (build 6) — The meadow becomes a board, and the game gets a grammar

**The owner's note, and it was right: the Wild Meadow felt like a different game.** It had been
built as a **diorama** — objects scattered over a hillside, each learned by tapping it — where the
garden is a **board**: a square frame floating in a scene, a character in the middle, tappable cells
around it, pets underneath, dock below.

That is not the garden's layout. It is **Garden Wonder's layout language**, and a place that walks
away from it makes the player learn a second screen for nothing.

**The rule that came out of it is the most useful sentence in these docs:
share the grammar, never share the verb.** Sharing a frame is cohesion; sharing a verb is the clone
the place taxonomy exists to prevent. Garden cells are *temporary* — plant, grow, harvest, empty,
constantly. Meadow cells are *permanent* — place a thing once and it stays. Farming against
building, on one board shape, which is what Township does on a single screen without anyone
confusing the two.

**So the five named spots became five placeable tenders**, which is a much better use of that
content: a fixed menu of locations turned into a spatial decision. Hives make honey; tenders make
nothing and improve only the hives they **touch**, using the garden's own adjacency table. Eight
hives is maximum raw output with no multipliers, two hives ringed by tenders is few-but-excellent,
and everything between is a real build — the "layout puzzle rather than a shopping list" this
project has praised about Cookie Clicker's garden since the first strategy pass.

**Moving is free.** Buying a piece costs money; rearranging never does, because a board you are
punished for experimenting with is the opposite of the cosy pillar. It is a *mode* on the dock
rather than a drag, since a drag would fight the swipe out to the map.

**The flower now stands in the middle of every board and pays exactly what it always paid.**
`UI.flowerBtn()` returns whichever flower is on screen, which is what makes the coins, the crit
ring and the face reaction fire in the right room — the same loop reachable everywhere, and
explicitly *not* the second tap minigame that was argued against.

**The skin had to change even though the frame did not**, and the owner asked for this
specifically: a **dry-stone wall** instead of a painted fence, **unmown grass with seed heads**
instead of mown stripes, turf held by a stone lip instead of a wooden planter, and a warmer, more
bleached green — because the garden is tended and this is not.

### Two bugs worth keeping

**A block replacement swallowed rules it was not meant to touch.** Rewriting the CSS between two
comment markers removed `.mw-keeper-bank` and `.mw-keeper` along with the dead spot rules, so the
keepers lost `position: absolute` and stacked in the corner — with JS still dutifully writing
`left` and `top` that did nothing.

**And the keeper bank was nested inside the padded stage**, so coordinates computed against the
*layer* were applied inside a box that starts somewhere else. Anything positioned in scene
coordinates has to be a child of the thing those coordinates are measured from.

---

## 2026-08-25 (build 5) — The HUD stops disappearing, and the pets stop flashing

**Three things off a photograph, which is how the real bugs in this project have always been
found.**

**The pets flashed in and out every few seconds, one frame at a time.** The meadow rebuilt its hive
and keeper nodes from `innerHTML` on every slow tick, and `place()` gave them their real geometry
on the *next* frame — so every 0.6 seconds each one drew once at its natural size. The fix is the
rule [09-conventions.md](09-conventions.md) already states and this file forgot: **cache before you
write.** Nodes are built once and updated in place, which is also exactly what the Hollow's `petEls`
map has been doing all along.

**The HUD is now up everywhere — and it never was, including in the Hollow.** The owner's call, and
it is right: you should always see your coins and reach your settings whatever room you are in.

The interesting part is why the obvious fix fails. **`.ui` is `z-index: 20`, which makes it a
stacking context**, so nothing inside it can paint above a sibling layer with a higher number —
raising `.hud`'s own z-index does nothing at all. The place layers went **under** `.ui` instead
(meadow 12, map 14, Hollow 5, HUD 6), and while a layer is open `.ui` takes `pointer-events: none`
with the HUD taking `auto`, or it would swallow every tap meant for the room beneath it. Recorded
in [08-ui-and-layout.md](08-ui-and-layout.md#the-hud-is-always-up).

**Two things then collided with the HUD** and moved down: the Hollow's exit hint and the meadow's
status strip. Anything a place draws along its top edge has to clear ~62px plus the safe-area inset.

**And the strip lost a number.** The shelf count was up there next to a dock button that opens the
shelf — the owner cut it, correctly: *a number that already has a button is not worth a slot.*

### The gold coins were not going to the pollination pill

Asked, and worth writing down because it looked like a feature. `FX.setMagnet('coin',
el.walletCredits)` makes every coin particle fly to the **coin wallet**, which lives at the top-left
of the HUD. The HUD was hidden under the meadow layer, and the meadow's own status strip happened to
sit exactly where the wallet would have been — so the coins appeared to fly *into the pollination
readout*. Two bugs wearing each other's coat. With the HUD visible the motion reads correctly, and
the strip has moved out from under it.

---

## 2026-08-25 (build 4) — The Wild Meadow becomes somewhere you go

**The owner's brief: it should feel like travelling into a feature, not opening a panel** — and it
does not need to be as deep as the garden. Five ideas went in and all five shipped.

**1. It is a place.** Full screen, its own dock, the Hollow's architecture exactly: `meadow.js`
draws the room and knows nothing about the game, `ui-meadow.js` puts the real hives in it.

**2. Five named spots, so buying a hive is a choice.** Sun Bank (fastest), Clover Patch (wax), Old
Stump (holds more), Under the Willow (slower, skews rare), Top of the Rise (pollination). Hive
number two asks *where?* rather than *yes?*. **Deliberately not adjacency** — that is the garden's
mechanic and copying it would have made the meadow a second garden, which is the exact thing the
place taxonomy exists to prevent. A sim-test asserts no two spots do the same thing.

**3. The Honey Shelf, which is the one worth arguing for.** One slot per bloom, filled the first
time that variety is made. The 19 seeds were always a ready-made album — but the real prize is that
it is the clearest answer yet to the project's oldest question: **you plant moonflower because the
moonflower jar slot is empty.** That is desire, where an order is a quota.

**4. Bees that exist because hives do.** With none kept the meadow is silent, which is what makes
buying the first hive land. Plus a 2% **swarm** that fills every hive at once — rare, free, purely a
gift.

**5. The keeper bank**, which is the Cats & Soup station idea scoped to one place instead of the
whole map. Two slots, 4% faster per star, doubled for a creature whose `affinity` is `'meadow'` —
and **Bumble the Gardenbee is the only one**, which is item-as-key pointed at a character rather
than a shop SKU. You do not want "a keeper", you want Bumble on the hives.

**The guardrail is asserted, not intended: the hives work with nobody standing on them.** A keeper
makes the meadow better, never possible.

### One thing pushed back on

The meadow stays **quiet**. The garden owns the tapping, the combo and the noise; nothing in the
meadow flashes or counts down and the only motion is drift. Bees you *may* tap would be fine, bees
you *must* tap would be a second job, and two competing tap loops make both worse.

### Bugs, and one that had been hiding

**The save key in the test suite was wrong**, and it had been wrong since the Stand shipped. Three
save/migration tests were passing **vacuously** — `load()` reported a fresh game and every
assertion held against default state. Found only because a new migration test failed for a reason
that made no sense. `SAVE_KEY` is now a constant in the suite. *A test that passes for the wrong
reason is worse than no test.*

**Two art bugs, both only visible in a picture.** The willow was drawn in the same mid green as the
bank behind it, so only its ink outline showed and it read as a floating ring; then, fixed as a flat
ellipse with fronds beneath, it read as a mushroom — or a table with legs, which is the failure the
Hollow's moss drips already documented. It has a lumpy crown now. And **honey jars taking the
petal colour outright made Daisy's jar white**, indistinguishable from an empty shelf slot; the
bloom now tints an amber base instead.

**And the bees all launched from the same point**, so six of them flew as one clump, which reads as
a bug rather than as a meadow.

---

## 2026-08-25 (build 3) — The hives come home, and a tab dies the right way

**The Wild Meadow is a place now**, and the Apiary tab is gone. This is the cheapest region the
project will ever ship: the hive simulation, pollination and honey-follows-bloom were all built
months ago and sitting behind a dock tab everyone agreed should not exist. Moving them cost an art
function, a hit target and four lines of wiring.

**It is not a locked parcel, because it is meadow.** It stands open from the first visit, and
putting a hive in it is what makes it yours. An empty meadow **invites**; a locked parcel refuses.
That distinction is worth keeping — locked land is for the Orchard and the Ridge, which are
genuinely bought.

**It draws the truth.** However many hives are actually kept appear as boxes, and **bees only drift
when there is a hive for them to have come out of.** Same principle as the garden thumbnail showing
what is really planted: the map is a picture of your game, not a picture of the game.

**The rule this establishes, and it now governs the two remaining tabs:** *a tab leaves when its map
home exists, and not before.* Craft keeps its slot until the Potting Shed lands; removing it first
would strand a live system with nowhere to live. The dock is `Upgrades · World · Craft · Shop`, and
the World button carries the attention dot for **every** place — an order you can fill, or jars
waiting in the meadow.

**One real bug, and it is a nasty little pattern.** `syncScene()` memoises the backdrop against the
sky so drifting clouds are not restarted every tick — but `build()` replaces the element it was
memoising against, so the second visit to the map drew a blank green field. Memoising against a
node you also replace is the trap; the check now tests the node as well as the sky.

---

## 2026-08-25 (design) — Places get a taxonomy, and the amplifier gets its name

**The owner played Cats & Soup and read it correctly.** The lesson is not the ring of stations
around a soup pot — it is that **the stations do not each make their own soup.** Chopping makes
*the* soup worth more. That is a shipped, cozy, commercially proven version of the rule
[12-meta-layer-design.md](12-meta-layer-design.md) has called mandatory since it was written:
regions that all produce raw material for one market are **parallel**, and players farm whichever
pays best.

So it confirms the design. What it adds is **a fourth structural type**: producer, transformer,
consumer, and now **amplifier** — a place that makes nothing and makes another place better.
Naming it matters, because the amplifier is what turns a row of buildings into a system, and
**this project already shipped one without knowing it**: pollination.

**The taxonomy is now a rule with a test**, in
[25-world-map.md](25-world-map.md#what-a-place-is-allowed-to-be): every place is exactly one type,
no two of the same type in a row, and before anything is built — what type is it, what makes it
not the garden (a different *clock* or *output family* counts, a different sprite does not), and
could an existing place do the job instead.

**The six places are settled.** Garden (producer), Potting Shed (transformer, a building beside the
garden rather than a bought parcel — it is a shed), Garden Stand (consumer, built), Orchard
(producer on an overnight clock), Wild Meadow (producer *and* amplifier), Ridge (**the Night
Garden** — time-gated).

**Two of those are better than they look.** The Orchard is where **collect-all belongs** — long
timers and low interaction make it *designed* to be tapped from the map, which turns "the map
collects the boring half" from a per-region toggle into a property of how a place is designed. And
the Night Garden gives the game the single hook it completely lacks: **a reason to open the app at
a different time of day**, reusing the epoch clock that already exists.

### The apiary comes back, and the demotion was only half wrong

2026-08-14 cut the Apiary as a region because honey was a *second economy beside the first*. That
objection stands and is not being relitigated. What changed is that the map exists and the
amplifier type is now named: the hives' output depends on what is planted in the garden, and
pollination lifts every harvest there. **That is the opposite of a parallel faucet.** So the Wild
Meadow returns as a *place*, the dock tab still dies, and the Apothecary stays folded into the
bench. It is also the cheapest region the project will ever ship, because the simulation is already
built.

### Creatures as labour — agreed, and deliberately not next

The owner's other read of Cats & Soup: cats are assigned to stations. Garden Wonder has the entire
apparatus — traits, stars, food, sleep, eight pairs, a slot-limited loadout — pointed at nothing,
because `setTending(id, on)` is a boolean. There was only ever one place to be *out* in.

**On a map with places that boolean becomes a location**, and one field buys an enormous amount:
every place's output depends on who is stationed there, the roster becomes worth growing, and the
loadout stops being a fixed optimum. **The guardrail: a place must work with nobody stationed at
it.** A creature makes a place better, never possible — otherwise two habitat slots and four places
is a map of dead buildings, which is the "upkeep state the player cannot clear" trap wearing a
different hat.

**Not built next, on purpose.** Traits and the eight pairs were balanced against one garden. Ship a
second place, see whether the map reads as a system, then decide.

---

## 2026-08-25 (build 2) — The map frame lands, and the Stand moves onto the lane

**The game is three places on one axis now.** Swipe down from the garden and the camera pulls back
to a world you can drag around: the garden with whatever is actually planted in it, the Hollow's
burrow, the Garden Stand on the lane, and three parcels of land you cannot buy yet. Swipe up, or
tap a place, and you dive into it. `overworld.js` draws the scene under the usual
knows-nothing-about-the-game contract; `ui-map.js` is the camera.

**The Stand stopped being a dock tab the day the lane existed.** It is a place, it was only ever in
the dock as a shortcut, and the fifth slot is now a single **World** button — travel rather than a
panel, and the discoverable way in for anyone who has not found the swipe. Apiary and Craft keep
their tabs until their own map homes exist; removing them first would strand two live systems.

### Three things the build got wrong, and what they teach

**The first world was too small, so it was not a map.** 1240×900 at one pixel per unit put the
garden across 69% of the screen — that is the garden seen from slightly further away, not a world.
The fix was not a camera setting: **the landmarks have to be small against the world**, so the world
grew to 1800×1500 and the camera fits its height to the screen and pans its width. That axis choice
is deliberate — a side-on world is landscape and a phone is portrait, and fitting the height means
there is never a band of nothing above or below.

**`transform-origin` and a camera translate cannot both be used.**
`translate(-camX*s, -camY*s) scale(s)` puts world point (camX, camY) at the top-left of the screen,
and **that identity only holds with the origin at 0 0**. Setting the origin to the place being
dived into — which looked like the obvious way to zoom toward something — broke the pan and pushed
the whole world off screen. The dive now animates the *camera*, not the origin.

**Labels are UI, not art, so they must counter-scale out of the world transform.** At map altitude
a 13px name rendered at 7px and the map could not be read. Names and badges now divide by the
camera scale.

Two smaller ones worth keeping: the transition has to be switched **off** during a drag, or every
pan lags a third of a second behind the finger; and on the map a drag is a pan, so only a gesture
that moved under 12px counts as a tap — otherwise panning across the world keeps opening whatever
it finishes over.

**The spike's finding held all the way through.** The dive does not keep zooming into the garden;
it scales toward the place, cross-fades, and hands off to the screen that already exists. The map's
garden is a thumbnail — and because it draws `S.grid`, **it shows what you actually planted**, with
ripe blooms bobbing. That was cheap and it is the thing that makes the map feel like yours rather
than like a menu.

**Deliberately not built yet:** collect-all. It is gated on automation by design and belongs after
the frame has been played; buying land is likewise a refusal with a toast for now, since reputation
tiers are the gate and the Stand only started paying reputation today.

---

## 2026-08-25 (build) — The Garden Stand ships its simulation and its faces

**The first system in this game that *wants* anything.** Everything built so far produces —
flowers, honey, keepsakes, cards — and nothing consumed any of it. Three slots, a queue of
customers, orders generated from goods and delivered for coins and reputation.
[03-systems.md](03-systems.md) has the mechanic, [07-save-data.md](07-save-data.md) the state.

**Simulation first, on purpose.** Generation, pricing, delivery and skipping all landed in
`game.js` under 27 new sim-test assertions before a single pixel existed, because the two
anti-frustration rules are properties rather than intentions: *never ask for what the player cannot
produce*, and *delivering always beats selling the contents*. Both are asserted across the whole
goods pool at several levels, not spot-checked.

**The bug worth recording: a wild line cannot be priced when it is written.** "A handful of
whatever's blooming" names nothing, so the same card could be filled with daisies or with Eternals.
The first version priced it at a hardcoded fallback and the invariant test caught it immediately.
The fix is that **the card quotes a floor and delivery re-prices against what actually crossed the
counter**, paying the larger — generous, and exploit-free because the multiplier is identical either
way. Then the *second* version handed the wild discount back at delivery, which made "any" strictly
the best line in the game; that one surfaced as a **flaky test**, failing roughly one run in three,
which is exactly the failure mode this project has a standing rule about. Both halves of the
discount now match.

**And the same fix caught a third bug by reading its own comment.** The wild-line spend loop said
"spend the cheapest first" and did the opposite — `sortedByValue` is ascending and it had been
reversed. A wild order would quietly have eaten the rare bloom a player was saving for a named one.

**Two content invariants came out of playing it, not from the spec.** A fresh board showed the same
face twice, because tier 1 had two eligible customers for three slots; then it showed the same
*good* twice for the same reason. Both are now asserted — **every tier must field at least
`STAND.slots` customers and goods** — because the tier-1 board is the first thing a new player ever
sees and a duplicate reads as a bug rather than as a small village. Miss Marigold moved to tier 1
and a Buttonhole was written.

### The surface: a queue of people, not a list of orders

The owner's note going in was that the creature panel's breakout portrait "adds a lot of life to
the slide-ups", and that new features must not become static menus. So the Stand reuses that exact
device: **the customer stands on the sheet** through the same `.sheet-art` element, and the queue
puts the face first on every row.

**Mood is carried on the face rather than in a label.** `customers.js` always draws all three
expressions and CSS picks one — the sleeping-creature contract — so a customer whose order you can
already fill is *smiling at you from the queue* before you read anything. That one property is what
makes the board scannable without text, and it is the owner's standing "iconography over sentences"
note applied to a screen full of state. Every bloom asked for is drawn with the real
`Flora.head()`.

**Three art bugs, all found only by looking.** Heads clipped, because buns and hat brims draw above
the origin and the viewBox started at 0. A baker wore a cap *and* a hat in near-identical whites.
And a beard covered the mouth — which takes away the one thing a portrait is for.

**Two layout bugs, both fixed by measuring rather than eyeballing.** The bust overflowed its
container *downward* and landed its shoulders on the customer's own name: an SVG taller than its
box does not get pushed up by `place-items:end`. Setting `height:100%;width:auto` then drew a head
three times the size of the panel, because **`width:auto` on an SVG resolves to 100% of its
container, not to the viewBox aspect**. Both dimensions are now stated, and the customer viewBox
carries empty space below the shoulders the way the creature art does, so the sink eats that first.

**A pre-existing bug surfaced on the way:** a coach mark points at something in the garden, so an
open sheet has covered the thing it points at — it was floating over the panel's own title. Now
hidden declaratively off `.sheet.open`, like `.sheet-art`, so no close path can forget it.

**`UI.pickLine()` is deterministic on purpose.** The sheet re-renders on every currency change, and
a random pick made customers stutter through their whole script while you watched.

**Entry is an interim dock tab.** The Stand is a *place* and belongs on the world map; it sits in
the dock only until the map frame exists, the same shortcut Apiary and Craft took. Its dock dot
lights when an order is fillable — the one signal meant to pull a player back into planting
something specific.

---

## 2026-08-25 (latest) — The goods are decided, and the map goes MVP-first

**The owner picked recommendations 1 and 2 and rejected 3, ending the goods question the same day
it opened.** The catalog goes deep and botanical — six families, specified in
[26-goods-catalog.md](26-goods-catalog.md) — and cottage crops are admitted as inputs:
strawberries, bramble berries, mint, chamomile, apples, elderflower, pumpkin, and **one small
wheat patch** as the entire grain concession. **No barn, no chickens, ever-ish**: re-raised and
re-rejected, the creatures are this game's animals, and the cut list in
[12-meta-layer-design.md](12-meta-layer-design.md) now says so twice.

**Three shapes of production, zero new systems.** Bouquets are *order-shapes* — a multi-flower
line item with a ribbon, no item, no crafting code — which is what lets the Stand launch on the
Florist family plus named honeys with nothing new built underneath. Everything else is a merge
chain on the Potting Bench, one chain per family, which retires the prototype `CRAFT_RECIPES`
two-slot bench when the surface ships. **Crops never enter the flower garden** — no seed-model
change, no verb or attraction interactions; they live in their own beds and patches on the map,
and the currency policy grows by one row ("garden produce, by variety"), not eight.

**The `line` field is the one-line test made structural.** Every good carries the sentence its
customer speaks ("Moonflower Tea — for sleep."); a good that can't fill the field doesn't enter
the catalog. Cheap to write, and it is where the captivation actually lives.

**And the map goes MVP-first, on the owner's instruction:** build it plain — spike-level art, no
dock migration, no polish — to test whether the *feel* holds, and spend the effort on features.
The MVP is phases A+B: the pan camera, the altitude swipes, the cross-fade, the burrow, locked
parcels that show a price, and **the Garden Stand as the only functional new thing** (order steps
1–2, Florist + honey). A feel rubric went into [25-world-map.md](25-world-map.md) so "does it feel
good" is testable — the key line: *does checking the Stand pull you back into planting something
specific.* If not, the order weights are wrong before anything else is. Simulation first: order
generation and delivery land in `game.js` under `tools/sim-test.js` before any UI exists.

---

## 2026-08-25 (last) — The map becomes a scrollable world, the Stand is confirmed, and the goods question opens

**Three answers from the owner, the same day as the research.** The **Garden Stand is confirmed as
the first build after the map frame** — demand before supply, no dissent. The **map stops being a
phone-shaped screen**: pan freely with a finger at map altitude, Township-style; the vertical swipe
survives as the altitude gesture (down to pull back, up to dive in) but the spike's fixed two-stop
camera is superseded. And the **ceiling is open** — the owner's instruction is to design what a AAA
team would build, because the team will grow; live-ops capacity is not the constraint to design
against. That is the 2026-08-14 "don't cap the vision" rule applied to the map: design the whole
world, build it incrementally. Many gardens is the long-run picture; **the not-a-clone bar stands
per garden**, because parallel identical boards decay at any team size.

**The sharpest question of the session was about the goods, and it got a direct answer in
[25-world-map.md](25-world-map.md#the-goods-catalog--is-botanical-enough).** *Are teas, honey,
preserves, perfume and bouquets enough — what if nobody cares about perfume?* The comparables say
nobody cares about the noun anywhere: Gossip Harbor sells chowder at $100M a month; the customer is
the story and the good is a token. The test recorded: **can a customer ask for it in one line, and
does the player smile.** Three recommendations with probabilities went into the doc: build the
botanical catalog deep (~75%), admit *cottage* crops — berries, herbs, orchard fruit, at most one
grain, sourced from the Orchard biome (~60% needed, high fit), and keep animal produce with the
creatures rather than a barn (~35% a barn adds more than it costs). **The Florist family is the
Stand's launch catalog** — a bouquet is a multi-flower order line with a ribbon, needing no
crafting system at all. Also noted: the card album already believes in these goods — the *Sweet
Things* set is Elderflower Cordial, Bramble Jam, Rosehip Syrup, First Honey.

---

## 2026-08-25 (later) — The map pauses for a design pass, and the research answers three questions

**The owner's call, made the same day the spike shipped:** keep the spike as the art and camera
reference, but design the whole map before building any more of it. The framing sharpened to
**"a new-age FarmVille — incremental, idle, and a tapper"**, with three concrete ideas on the
table: many flower gardens collected with one tap, fields and a barn (wheat, corn, chickens, eggs),
and a line of customers waiting for goods. A market research pass was asked for and done —
the result is [25-world-map.md](25-world-map.md), and three answers came out of it.

**The customer line is the anchor, and it should be built first.** Every survivor in every family
of this market runs an order queue — Hay Day's truck and boat, Township's trains, the merge games'
customer queues at $100M/month, and FarmVille 2's order board, which is the only thing keeping the
last FarmVille alive at ~$500K/month twelve years on. The owner's "gift store with a line" is
[13-order-system.md](13-order-system.md), already specified, and it becomes **the Garden Stand**:
a place on the lane where customers visibly queue.

**Many gardens survive as a few biomes, not ten clones.** Nobody at the top runs N identical
parallel boards: Hay Day and Township are one farm with many *different* buildings, Grow a Garden
is one garden, Egg Inc's farms are sequential. Ten same-shaped flower gardens is the AdVenture
Capitalist decay pattern at map scale. The shaped version keeps the owner's instinct: **two to
four specialized gardens** — Orchard (overnight timers), Night Garden (the epoch clock as a
place), Wild Meadow (the bees' home, resolving the apiary question as a *place* without reviving
its separate chain), Greenhouse (controlled weather, the mutation farm).

**Wheat, corn and chickens are recommended against, and the recommendation was made once already.**
The 2026-08-14 tonal decision cut them; the research reconfirms it — generic farm content moves the
game onto Hay Day's field, and **the creatures are already this game's livestock**: named producers
with food, sleep and keepsakes. A barn of generic hens beside a burrow of characters would split
the animal fantasy and cheapen the half with names. The owner re-raised it, so it stays an open
call rather than a settled one.

**One finding was better than expected: the market's hottest shape is already in the repo.**
Gossip Harbor ($1.2B lifetime, +172% YoY) is merge + customer orders + drip story. This project
has a built merge simulation with no surface, a specified order system, and a talking flower.
The bench's parked status should end with a surface on the map, feeding Stand orders.

---

## 2026-08-25 — The dock stops being navigation, and the map becomes it

**The owner's call, and it settles a tension the IA doc has carried since 2026-08-05.** The dock was
never meant to be a menu of places — Apiary, Craft and Shop became tabs because there was nowhere
else to put them. The shape it is heading for is the one large mobile casual games converge on:
**Friends · Cards · (World) · Quests · Shop**, with the world on a raised centre pedestal.

**The dock is meta; the map is navigation; upgrades stay in the garden.** Three rules, and the third
is phase 4 of [15-navigation-and-ia.md](15-navigation-and-ia.md) arrived at from the other
direction — a dock cannot hold both meta destinations and per-place controls, and the per-place ones
are the ones that lose. A region never gets a dock slot again.

**One clarification applied rather than asked about:** a goods market or trading post is a *place*
and goes on the map; the IAP shop is a *meta destination* and stays in the dock. They share a word.
The standing rule that real money appears in exactly one place is unaffected.

**Friends is a reserved slot, not a feature.** Two people, no server. Drawing it greyed in the spike
is how the bar's proportions get judged without anyone committing to build a backend.

### The gesture was already free

**Swipe down, not pinch.** `ui.js` binds swipe-*up* in the garden to the Hollow and leaves swipe-down
unbound, so the map slots onto the ladder that already exists: **map → garden → Hollow**, one axis,
one metaphor. The owner's instinct ("scroll their finger down") landed on the one free gesture in
the game.

### What the spike found, which changes the build plan

`tools/map-spike.html` — a camera over one world box, two stops, one CSS transform.

**The dive cannot keep zooming until the garden fills the screen.** A phone is 2.16:1 and a garden
parcel is roughly square, so a pure camera zoom either crops the parcel or leaves its neighbours in
frame; there is no scale that does neither. More decisively, the garden screen is *its own
composition* — sky, quest strip, plots as tappable cards, the burrow door, the HUD — and rebuilding
it inside a world box would mean maintaining the garden twice.

So **the map is a layer above the existing garden**, and the camera move ends in a cross-fade to the
screen that already exists. The map's copy of the garden is a thumbnail that only ever has to read
at map distance. This is the difference between a week of work and a rewrite, and it was worth the
spike to find.

**Two art findings, both only visible in a picture.** Locked land drawn as an isometric diamond is
wrong in a side-on scene — it reads as a mountain. Overgrown ground behind a signpost reads as land
you could clear, stays side-on, and asks to be bought. And a map with nothing between its landmarks
reads as a *diagram*: trees, tufts and birds are not polish here, they are what makes the space a
place. Both were rejected versions before the current one.

### The direction, and the pushback that shaped it

The owner's sketch was a map of many areas each harvesting a different resource, with a completed
area collectable in one tap without entering it. Two objections were raised and both stand:

**N areas that differ only in theme and rate is the AdVenture Capitalist trap one level up** — the
same disease [17-market-and-positioning.md](17-market-and-positioning.md) already diagnoses in
nineteen seeds that all yield 1.4× cost. The rule taken from it: **no region may be a second
garden.** Every location is a producer, a transformer, or a consumer.

**"You never have to go in again" deletes the game's only advantage.** Craft and juice are what this
game has; a screen of collect-all bubbles is a screen where no tap answers. The line drawn instead:
**the map collects the boring half, the garden keeps the interesting half** — one tap pays coins and
raw flowers, while mutations, rarity, keepsakes, packs and the tap loop still require going in. The
map then serves the 40-second session and the garden the 7-minute one, which is the session shape
the research already calls for.

**"Completed" is defined as fully automated.** There is no completion in a game with endless Bloom
Mastery. A region shows a collect-all bubble only when its planter and drone are owned — which turns
buying the drone into unlocking a convenience rather than another percentage, and is a far better
upgrade than anything currently in the shop.

**The Market is the right second location**, because it is a *consumer* and therefore structurally
unlike the garden. It is also the goal generator, the reputation source and the liveops surface, and
it is already specified in [13-order-system.md](13-order-system.md). The owner's own framing — "a
gift store where people come and ask for things" — is that document.

**Still open:** whether the apiary and the crafting bench return as places (the 2026-08-14 demotion
put both into garden adjacency), and the region order after the Market.

---

## 2026-08-20 (last) — Two clocks become one, and the panel loses three boxes

**The complaint was that the screen had too many boxes**, and it was right — the creature panel had
drifted to six. Four merges came out of it, and one of them turned out to be a simulation change
rather than a layout one.

**The skill and its level are one box now**, because the star *is* the trait getting stronger.
Splitting them said less and crowded more. That is the general lesson: **a box worth counting is a
box worth removing.**

**And the two food meters became one clock.** The owner asked to merge the bars with a pip on them
marking "well fed" — which cannot be done honestly in the UI alone, because `awakeUntil` and
`fedUntil` were independent and a single pip position would have been a lie at two of the three food
tiers. So the *simulation* merged instead: **one fullness clock, well fed above a threshold, awake
above zero, asleep at nothing.**

This lost nothing. Every food's awake window already outlasted its boost by roughly a fixed margin,
so the second clock was carrying one number — that margin — at the cost of a second bar, a second
timestamp and a second thing to keep in sync. The old invariant *"a food keeps a creature up longer
than it boosts it"* stopped being a rule to assert and became arithmetic.

**Where the pip goes was settled by arithmetic, not taste.** The owner suggested three quarters up.
At 18h of a 24h cap **no single food reaches it from empty**, so the buff would only ever exist by
stacking — a wall rather than a line. At **3h** the tuning the two-clock version already had is
reproduced almost exactly (Clover keeps its token 1h of boost; Petal and Honeypot come out a shade
more generous). A low pip also reads better: the band underneath becomes a warning strip rather than
a climb.

**An accident worth keeping:** the arrival grant is a full clock, and a full clock is above the line,
so a new creature now arrives **well fed for its first 21 hours**. That is good onboarding — you see
the buffed state, watch it lapse, and learn what food buys. The alternative under one clock is a
short grant, which reintroduces the sleeping-first-pet problem the grant exists to prevent.

**Cost per hour now runs two ways and both are asserted.** Per hour of *boost* it falls with the tier
(1,500 → 1,000 → 923); per hour of plain *fullness* it rises (375 → 625 → 750). The second is
deliberate: the cheap food stays the efficient way to simply keep someone awake, so being broke can
never strand a creature.

**Ten sim-test fixtures had to change, and every one of them for the same reason:** an arrival is
now well fed, so anything measuring an unbuffed trait had to spend that first. A `hungry()` helper
sets the clock to exactly the threshold — awake, not buffed — which is the baseline state that used
to be free.

*Two assertions became better in the process.* "No boost time is owed" was meaningless under one
clock; it now asserts the structural property that the leftover is **exactly the threshold band**.
And the per-hour test now measures boost hours, which is what the premium actually buys.

**Smaller things from the same note.** The star token's own stroke was thinned so the number inside
it stops colliding with the outline. The food buttons became the food: a 52px token with `+4h`
stamped on the corner, name under, price under that — icon first, words second. The pip is marked
with a **star rather than the words "Well fed"**, which the header already says. And *Out or resting*
moved back outside Feed, where it belongs.

**A real bug the grep caught, not the tests:** the roster-wide Feed panel and the post-feed toast
both still called `Game.critterAwakeFor`, which no longer exists. `tools/sim-test.js` cannot see a
`ui-*` file, so nothing failed — the panel would simply have thrown when opened. **After removing a
`Game` method, grep the UI for it.**

---


## 2026-08-20 (last) — The creature panel is ordered by what you came to do

**The complaint was concrete and correct:** *"the pet might be asleep, and I have to scroll down
through a lot of stuff to even tap on the things to feed."* A panel whose cure for its own alarm is
below the fold is a broken panel.

**The order the owner set, and it is now the design:** who it is → what it does → how grown it is →
everything you might have opened this to do. The trait moved up to sit directly under the stars,
because "what does this pet actually do" is the question the panel exists to answer, and Feed moved
up with every action attached to it, out-or-rest included.

**The number that has to stay true:** at 375×812 the food buttons end 518px into a 582px body and
the rest button at 579px. Both clear the fold with almost nothing spare, and getting the second one
there took ~20px of trimmed padding. **Anything added above them pushes the cure off screen** —
that is now written into the creature doc as the thing to re-check.

**Two meters, because a number is not a picture.** The owner asked for a bar showing how fed a
creature is, "so we can see how far we are from making the pet feel well fed and buffed". Awake and
Well fed both run to the same 24h cap, so they sit under each other and compare directly. The value
of drawing them rather than printing a timestamp is immediate: a Clover Nibble on a sleeping
creature fills Awake to 17% and Well fed to 4%; a Honeypot takes them to 83% and 54%. You can see
what a purchase buys before you make it.

That made the sleep alert redundant at its old length — the Awake meter already reads `Asleep`, so
the alert shrank to one line carrying only what a meter cannot say, which is what to do about it.

**The level row was rebuilt from a pencil sketch**, and the sketch was right about all three things:
a **rounded-square** bloom token rather than a circle, the **number inside the star** rather than
beside it, and the caption living *inside* the bar's own height. That last one is the real idea — a
short bar leaves vertical void next to a 50px token, so making the bar as tall as the tokens and
stacking `60 / 63` over `LAVENDER HARVESTED` inside it fills the void instead of costing another
row. Iconography that pays for itself in space rather than spending it.

**A slip worth recording:** the sleep alert briefly picked a pronoun by comparing the creature's
name against a list. The roster is a mix of he, she and it, that already lives in each creature's
authored lines, and a name check in the UI would have been a second place to keep it right and a
first place to get it wrong. It says the creature's name instead.

**And a measurement trap, twice in one session:** `getBoundingClientRect()` on anything inside the
sheet is useless while the open transition is running, and in an automated tab that transition can
freeze part-way and never finish. It read the food buttons 660px lower than they render. Measure
**relative to `#sheetBody`** instead — that is transform-independent and it is what the fold check
above is based on.

---


## 2026-08-20 (later) — A head over the dock, and a progress row made of pictures

**The bug: the breakout art stayed on screen after the sheet closed.** It is positioned *above* the
sheet's top edge and rides the sheet's transform — and a closed sheet parks just below the bottom of
the screen, which put the creature's head neatly over the dock. Found by the owner on a phone.

**Fixed in CSS, tied to `.sheet.open`, rather than in the close path.** There is more than one way
out of a sheet — the close button, the scrim, drag-to-dismiss, opening a different mode — and a rule
that lives on the class cannot be forgotten by whichever one gets added next. It fades rather than
snapping, with `visibility` delayed behind the fade.

**The growth row stopped being a sentence and became pictures.** The owner's note: *"I don't think
you need a line that says Growing on Moonflower. People will automatically know that they're
levelling it… the more iconography and visuals we can add throughout the game, the better."* Right on
both counts, and the second half is the more useful instruction.

So the row now reads left to right as **bloom → bar → star**: the actual flower in a round token,
the count *inside* the bar, and the star being climbed toward on the right. `Flora.head()` already
existed for shop cards and draws the real bloom, so the icon is never a stand-in for the flower —
it *is* the flower. The caption underneath is the one thing a picture cannot say: which flower.

**A typography note worth keeping.** The count in the bar started as the house style — white text in
an ink outline, eight offset shadow copies. At 13px that crowds the glyphs into mud. It is dark ink
with a **white halo** instead, which stays legible over both the green fill and the pale track. The
house outline is for display sizes; small numbers on a busy ground want the inverse.

**And the palette stayed put.** The owner confirmed the earlier call not to borrow the reference's
dark-blue chrome. Layout ideas travel between games; colour does not.

---


## 2026-08-20 — Swipe between the two places, one tap does the right thing, and the pet stands on the sheet

Three asks from the owner, now that the game is an installed app and there is no browser chrome to
fight over the gestures.

**Swipe up in the garden to go down to the Hollow**, mirroring the swipe down that already comes
back. The interesting part is what it cannot do: **plots and the flower act on `pointerdown`**, so a
swipe begun on one has already planted or harvested by the time it is recognisable as a drag. Making
them wait for `pointerup` would fix it and cost the tap latency the entire core loop is built on —
which is why the swipe only starts on the *background*, and the burrow mouth stays as the
discoverable entrance. Both swipes also require `dy > dx`, so a diagonal drag does nothing.

That guard exposed the same latent problem in the Hollow, which had none: **dragging down off a
creature there opened its sheet *and* left the room.** Fixed at the same time, same rule.

**A tap on a creature in the garden collects, or opens its panel when there is nothing to collect.**
One target, two jobs, and the right one every time — the collect is what you came for when a badge
is showing, and when there is not, the thing you probably want is to feed it. The owner's framing is
the one to keep: *"if you tap a pet, the experience should be as friendly as possible, allowing them
to do what they need to do with that pet instead of traveling to the Hollow."*

**And the panel stopped being a form.** The owner's note was that the screens read plain and
technical and that the progress bar in particular felt small and boring, with a Clash Royale card
screen as the reference. What transferred:

- **The creature breaks out above the sheet's top edge**, sunk far enough that its body disappears
  behind the paper. A creature that only *touches* the edge reads as a sticker; one the panel cuts
  off reads as standing there. It lives on `.sheet`, not in the scrolling body, so it rides the
  open/close transform and then holds still.
- **The growth bar was promoted from a 7px sliver of trim to the largest element on the screen**,
  with a star-goal pill on it. It is the one number a player watches climb.
- **The name is in the game's own `.outlined` display type**, with the species under it and a big
  star row — a nameplate rather than a title bar. The sheet's chrome title is now empty for this
  mode, which also killed the earlier triple-naming.
- **Every fact is its own chunky chip** rather than a paragraph of state.

**What deliberately did not transfer is the palette.** The reference is dark-blue sci-fi chrome.
Borrowing its *layout* ideas is right; borrowing its colours would put another game's skin on a
storybook botanical one, and tonal coherence is the cheapest competitive advantage this project has
([17-market-and-positioning.md](17-market-and-positioning.md)).

**A measurement trap worth recording:** the art looked clipped at the creature's chin, and it was
not. `overflow` was `visible`, nothing was painting over it, and probing with a translucent sheet
background showed the body drawing correctly on top. The real problem was that the art was too
small and barely overlapped, so it read as perched rather than standing. **Twenty minutes went into
proving a clipping bug that did not exist** — the picture was right and the diagnosis was wrong.

---


## 2026-08-20 — Keepsakes come from creatures that are out, and a tap opens the whole creature

**Built:** keepsakes gated on tending, collecting removed from the Hollow, and a per-creature sheet
that carries every verb. 11 new assertions, 834 total. The owner's call, and both halves are better
than what they replace.

**Only a creature that is out leaves anything.** A rester earns nothing while it is in. The reason
this is more than a nerf: a decoration costs keepsakes from **two different creatures**, so gating
supply on the loadout means **the roster has to be rotated to collect every kind**. That turns the
loadout from a fixed optimum into something you revisit, which is the property the slot limit has
been reaching for since it was built — and it lands right before mementos become a currency.

**Nothing is lost by resting.** Earnings are banked when a creature goes in and handed back when it
comes out, and the clock is stamped on both edges so the resting stretch is never credited later.
Asserted in both directions, because the tempting cheap version — zero it on rest — would take
something away, and this project does not do that.

**A sleeping creature is still out, so it still leaves keepsakes.** The one-axis rule survives
untouched: sleep costs the trait, not the mementos.

**The Hollow stopped being a second harvesting screen.** It is where they live; the garden is where
they work, and that is where you collect. The keepsake badge down there now means "there is
something waiting for you upstairs", which always has somewhere to go because only a tender earns
and a tender is in the garden by definition.

**And the modes were a workaround, which the owner spotted.** Pet / Loadout / Feed as armed dock
verbs existed because there was one tap target and several things to do with it. A **per-creature
sheet** is the answer that does not make the player arm anything first: portrait, trait at its
current value, awake and fed state, growth bar, keepsake status, out-or-rest, the three foods, a Pet
button and the pairs it belongs to — everything about one creature in one place.

**Loadout mode survives as a fast path**, deliberately. Swapping three creatures in a row should not
be three sheets. It is the only mode left, and the dock's Pet button is now effectively its off
switch — which is exactly the redundancy the owner predicted when they said to try this *before*
taking the dock buttons away. That question is now answerable by looking at it rather than by
argument, which was the point of the sequencing.

**Petting replies inside the panel**, because the flower's speech bubble lives in the garden and is
hidden while the Hollow is up. A line said through it would have landed nowhere — the same class of
mistake as centring confetti on a hidden element.

**Three sim-test fixtures assumed a rester still earns** and had to be corrected. One of them,
`and it goes back when the helper rests`, was resting *both* creatures and would have passed for the
wrong reason under the new rule; it now rests only the helper it is actually measuring.

**Logged rather than fixed:** a creature that arrives with progress already banked shows a full
growth bar at ★1 until the next harvest, because `checkCritters()` cannot arrive and grow on one
call. Unreachable without a seeded save, and fixing it would let a creature arrive at ★3, which
undoes a designed beat. See [11-known-issues.md](11-known-issues.md).

---


## 2026-08-20 (last) — It was the status bar style all along

**Changed:** `apple-mobile-web-app-status-bar-style` from `black-translucent` to `default`,
`theme-color` now tracks the sky, and the page background became `--page-fill`, which follows
whatever the bottom of the screen is showing.

**The screen report ended four rounds of guessing in one screenshot.** An iPhone 16 Pro reported
`screen 402×874 · window 402×812 · insets 62 / 34`. The window is short by **exactly the top
inset**, and the 34px bottom inset was being reserved for a home indicator that was not inside the
window at all. That is not a browser lying about its height. It is `black-translucent`: iOS sizes
the window to the screen minus the status bar and then pins it to the *top*, so the game gets to
draw under the clock and loses the bottom of the screen in exchange.

**Which means none of the previous three fixes could ever have worked.** Moving the shake
transform, `min-height` over `height`, maxing three measurements — all of them describe the window,
and the window was never the problem. The one that *did* help was cosmetic: making the strip
invisible by matching its colour. The lesson is not "measure more carefully", it is **when a value
cannot be fixed from inside the page, stop trying to fix it from inside the page** — and the way to
find that out was to make the app report its own numbers, which took a fifth of the time all the
reasoning did.

**The trade is the top of the screen for the bottom of the screen, and the bottom wins.**
`default` puts the window below the status bar. The sky no longer bleeds behind the clock, and the
dock finally sits where a dock belongs, over the home indicator margin, with the sheet reaching the
bottom edge. For an idle game where every interaction is in the bottom third, that is not a close
call. The status bar strip is drawn from `theme-color`, so `updateSky()` writes the current sky
colour there each tick rather than leaving a fixed noon blue over a midnight sky. One line reverts
it if the owner would rather have the full-bleed top back.

**`--page-fill` stays anyway.** iOS paints whatever is left uncovered with the page's background
colour, so the page follows the bottom of the screen — lawn normally, the sheet's paper while a
sheet is open. There should be nothing left to paint now, which is exactly when a cheap safety net
is worth keeping.

---

## 2026-08-20 (later) — The window really is shorter than the screen, and that is the end of the argument

**Changed:** `sizeViewport()` no longer consults `screen`. It maxes `innerHeight` and
`clientHeight` — the window, and only the window.

**It shipped, and it pushed the dock off the bottom of the window.** The reasoning in the entry
below was that an installed app's window IS the screen, so a short `innerHeight` had to be WebKit
under-reporting; the correction was gated on a non-zero bottom inset precisely to avoid the other
case. On a real iPhone the gate did not hold — the inset is reported whether or not the window
reaches the indicator — and `.game` grew past the bottom of the window, taking the dock with it.
The owner's screenshot showed the buttons cut in half.

**`innerHeight` was telling the truth the whole time.** The window an installed iOS app gets does
not reach the bottom of the screen, iOS paints the strip below it, and no CSS reaches into ground
the window does not own. Three rounds of this bug were spent looking for a browser that lied. None
of them was.

**The rule that comes out of it: never stretch the game past the window.** A band of lawn under the
dock is a blemish. A dock nobody can tap is a dead app. The two failure directions are not
comparable, and every future attempt at the bottom of the screen has to respect that asymmetry —
which the `min-height` shape still does, because the browser's own `inset: 0` is now the only thing
that can grow the box.

**What is left is what should have been the whole fix.** The strip below the window is painted with
the page's background colour, so it is made *invisible* rather than filled: flat `#4fae54` both
sides, no stripes to fall out of phase, no vignette, no sheet shadow, nothing drawing a dark edge
along the join. The dock still sits higher above the physical bottom than a native tab bar would.
That is the platform, not the layout — and if it is ever to be closed, it will be by learning why
the window is short, not by drawing outside it.

---

## 2026-08-20 — The line at the bottom of the screen was a shadow, and the height was only half of it

**Changed:** the shake transform moved from `.game` to a new `#world` wrapper, `--app-h` became
`min-height` instead of `height`, `sizeViewport()` takes the largest of three signals rather than
trusting one, the closed bottom sheet stopped casting its shadow, the page background went flat and
the meadow fades its stripes out, the vignette fades out before the lawn does, and the dev panel
gained a screen report.

**Two fixes had already been shipped for this and the owner's phone still showed a hard green line
across the bottom, with the dock floating above it.** The failure was reproduced in the preview by
forcing `.game` short: it looks exactly like the photograph. So the mechanism was never in doubt —
the box ends above the screen and the page shows through. What was in doubt was why, and the honest
answer is that it still is: `inset: 0` came up short, then `height: 100dvh` came up short, and
neither can be tested here.

**So the fix is the one that does not need the diagnosis to be right.** Three changes, each
independently sufficient, chosen because they fail in different directions:

1. **The transform is the one thing both failed attempts had in common.** A transform makes an
   element its own containing block, and a transformed fixed box is exactly the case WebKit is
   known to mis-size against the viewport. `.game` carried the shake for no reason other than being
   the outermost element, so the shake moved to `#world` inside it and `.game` is a plain fixed box
   again. This is a new hypothesis, not a third guess at the same one.
2. **`min-height` instead of `height` changes the failure direction.** The box is now the taller of
   the browser's `inset: 0` and the JS measurement, so a wrong measurement can only fail to help —
   where `height: var(--app-h)` made a short measurement authoritative and overrode a browser that
   might have had it right all along. That was the real defect in yesterday's fix: it replaced a
   signal rather than adding one.
3. **`window.innerHeight` is no longer taken on its own.** It is maxed with
   `documentElement.clientHeight` and, in an installed iOS app whose window is as wide as the
   screen, with `screen`'s own dimension — capped at 170px of correction, so only a safe-area-sized
   shortfall is ever fixed up. The gate is `navigator.standalone`, not the display-mode query,
   because an installed *Android* app's `screen` includes the status and navigation bars and
   stretching to it would post the dock underneath them. Measured again at 80/250/600/1200 ms and on
   `pageshow`, because iOS can report a short window during the launch animation and then never fire
   `resize` — and in standalone the tallest reading for the orientation is held, since an installed
   app cannot shrink without rotating.

**The vignette was what turned a shortfall into a *cut*.** The page behind the game is already flat
meadow green with the same stripes, so the missing strip was never the wrong colour — but the
vignette darkened the game's last few pixels and an undarkened page began right under them, drawing
a hard horizontal line. It now fades to nothing over the bottom 74–92% of the screen, and in the
preview a game forced 80px short reads as lawn running off the bottom rather than as a cut. That
matters beyond this bug: the lawn no longer depends on the height being exactly right to look
right.

**The hard line was a box-shadow, and finding it needed pixels rather than eyes.** After the height
work above, a game forced 80px short still showed a visible join in the preview — so the screenshot
was decoded and the RGB values above and below the join compared. The lawn's last few pixels were
`(75,156,75)` against the page's `(79,174,84)`, ramping darker toward the edge: a soft shadow, not a
colour mismatch. Hiding layers one at a time found it in the **closed bottom sheet**, which parks
just below the game's bottom edge and threw `0 -8px 30px rgba(44,26,16,.32)` back up into the lawn,
where `.game` clipped it square. It now casts that shadow only when open. With it gone the two sides
of the join are *pixel-identical*, and that is the measurement this bug should have been held to
from the start — three fixes were shipped on the strength of looking at a photograph.

**The colour was never the problem; the darkening above it was.** The same reasoning retired the
page background's mown stripes, which could never line up with the meadow's because a repeating
gradient starts from its own box — the meadow fades its own stripes out over the last 44px instead.
Flat meets flat, whether what is below is the page behind a short game box or the strip iOS paints
under a short web view.

**A bottom inset of zero means the window does not own the bottom of the screen.** The `screen`
correction is now gated on `--sab` being non-zero, read back through a probe element. The two ways
of ending short look identical in a photograph and want opposite fixes: a window that *overlaps* the
home indicator has a bottom inset, so a short `innerHeight` is the browser under-reporting and
stretching is right; a window with *no* inset genuinely stops above the indicator, iOS is painting
the strip below it, and stretching would post the dock into ground the window cannot draw on. Off a
photograph there is no way to tell — hence the probe, and hence the report below.

**The dev panel now says what the phone thinks its screen is.** `screen`, `window`, `clientHeight`,
the game box, `--app-h`, both insets, display mode and DPR, on one line in Developer tools. `env()`
is `0` on a desktop and an installed app has no console, so every previous round of this bug was
diagnosed from a photograph. One screenshot of that line settles what three rounds of reasoning
could not.

**Rejected: painting the lawn past the bottom of `.game`.** Still impossible for the reason recorded
on 2026-08-19 — `.game` clips — and unclipping it would let the closed bottom sheet, which parks
itself just below the game's bottom edge, show above the home indicator. Fading the vignette gets
the same cohesion with nothing to unclip.

**Rejected: pinning the dock with its own `position: fixed`.** It is what a native tab bar does and
it would be immune to all of this, but the dock is row 5 of the grid that sizes the garden, so
pulling it out of the flow means the stage no longer knows what space it has. Not worth it while
three cheaper signals agree.

---

## 2026-08-19 — The bench quests are paused, and the screen is measured rather than asserted

**Changed:** `paused: true` on the three bench quests with three live stand-ins under them, and
`.game` now sizes off a JS-measured `--app-h`.

**A quest for a feature with no UI is the same bug as a quest on a track nothing emits.** The
potting bench is fully built in `game.js` and reachable from nowhere — no `ui*.js` file calls
`benchMergeOnce()` or `benchBank()`. `q_tea`, `q_perfume` and `q_craft_2` were repointed at it on
2026-08-16 on the assumption a screen was coming, and in the meantime they did precisely what the
retired sell quests did: took a slot, could never be completed, and jammed the strip on "Merge a
Posy 0/1" because `stripQuest()` always renders `active[0]`. The guard that catches sell quests now
catches these too.

**Paused, not deleted, and the difference is the save.** Deleting a definition orphans any instance
already in a player's `quests.active` — that orphan was the argument for repointing rather than
removing last time. `ensureProgression()` already pruned unresolvable instances, so extending that
prune to paused ones makes the flag safe where deletion was not: a stranded player gets the slot
back on next load, and a player who *completed* the quest before the pause is untouched because
`questById()` still resolves it. The tuning stays in the file for the day the bench ships.

**Three stand-ins, because the ladder is load-bearing.** The three carry 98 of the ladder's 777
reputation, and 777 is what lands level 17 and the Eternal Crown. Benching them without replacement
would have stranded every player three levels short of the last seed — the sim-test would not have
caught it, because it summed `DATA.quests` including the paused ones. That assertion now filters to
live quests, which is the fix that matters more than the numbers: a suite that can call a ladder
complete when no player can climb it is worse than no assertion. `q_discover_8`, `q_hold_60` and
`q_honey_15` sit at the same rungs and the same reputation, on tracks a player can already reach.

**`100dvh` was a guess and it was wrong.** Yesterday's fix for the band of page under the dock in
the installed app assumed `dvh` measured the real screen. On a real installed iPhone it did not, and
the same report came back. `window.innerHeight` in standalone with `viewport-fit=cover` is the whole
screen in CSS pixels, safe areas included, so `sizeViewport()` writes it to `--app-h` and CSS uses
it. Explicitly not `visualViewport.height`, which shrinks for the keyboard and pinch-zoom and would
resize the scenery under both. `height: 100dvh` stays above it as the first frame's value, and a
browser with neither falls back to `height: auto`, which `inset: 0` stretches exactly as before.

**The deeper problem was that none of this could be looked at.** `env(safe-area-inset-*)` is always
`0` in a desktop browser, so the notched layout was unverifiable outside an installed build on a
real phone — which is how the same bug shipped twice. All four insets now come from `:root`
variables and nothing else in the stylesheet calls `env()`, so overriding four numbers in the
preview puts the real phone layout on screen. That indirection is the actual deliverable here; the
height fix is what it made checkable.

**The dock stops `max(10px, --sab - 12px)` short of the bottom, not the full inset.** Spending the
whole 34px left a band of dead lawn under the buttons. The inset is sized for the swipe-up gesture
area; a row of buttons nobody swipes from does not need all of it, and the floor keeps a margin on a
phone with no inset. The bottom sheet still takes the full inset, because its content scrolls to the
edge.

**Rejected: extending the meadow past the bottom of `.game`.** It cannot work — `.game` clips, so
nothing painted inside it can reach past where it ends. The body background carries the meadow's
stripes instead, so a strip the game fails to reach reads as more lawn rather than as the page
showing through. That is a safety net under the measurement, never a substitute for it.

---

## 2026-08-19 — A remote session can see the game, on a branch

**Built:** `tools/probe.js` and `docs/24-remote-sessions.md`, so the game can be worked on from a
phone while the Mac is closed.

**The constraint that shaped this is that a cloud session has no eyes.** It clones the repository
into a Linux container, which is fine for a project with no build step and no dependencies — but
this is a game whose whole point is how it looks and feels, and every previous verification loop
ended with a person opening `index.html` and looking. Without a replacement for that, a remote
session can only change code it cannot check, which is the worst way to touch a layout.

**So the probe drives Chrome directly rather than through a library.** Playwright is the obvious
answer and it is one `npm install` away, except that it is a dependency in a project whose first
non-negotiable is not having any, and the container's registry refuses it anyway. Node 22 ships a
WebSocket client, and Chrome speaks the DevTools Protocol over one, so the whole thing is about
three hundred lines and adds nothing to the repository's surface. It also runs unchanged on the
Mac, which was not the goal but means it works as a local screenshot tool too.

**Taps are touch events aimed at a selector's centre, not synthetic clicks.** The game listens for
touch, and a probe that exercised a different code path than a player would be worse than no probe
— it would be a check that passes while the thing it claims to verify is broken.

**An unrecognised step is an error.** A no-op would mean a mistyped `tap:` silently produced a
screenshot of an untouched game, and the session would report a fix that was never exercised. The
failure mode of a verification tool matters more than its convenience.

**Remote sessions work on a branch, and this is the part worth remembering.** The repository root
is what GitHub Pages serves, and `sw.js` is network-first by deliberate design, so a push to `main`
is in front of installed players almost immediately. That property is exactly right when someone is
at a desk and has just looked at the change on a real phone. It is exactly wrong when the change
was verified only by Chromium-on-Linux, which knows nothing about iOS Safari, sticky positioning,
viewport units or audio. A branch costs one command and puts a person between the container and the
audience.

**The token is pasted per session and never stored.** A fine-grained token scoped to this one
repository, in a container that is destroyed at the end of the session, is a small enough blast
radius to be worth the convenience. Writing it into a file to save the paste would have put a
credential in a repository that deploys itself publicly.

---

## 2026-08-18 — Installable and offline, with a worker that cannot strand anyone

**Built:** `manifest.json`, `sw.js` and `icons/`, so the game installs to a home screen and plays
with no network.

**The default service worker recipe would have been a trap here.** Every tutorial teaches
cache-first, because every tutorial assumes a build step that puts a content hash in the filename.
This project has neither. `game.js` is `game.js` forever. Cache-first would have pinned each player
to whatever build they happened to install, and the only way out would be remembering to bump a
version constant on every push — which is exactly the kind of manual step that gets forgotten on
push forty, by which point a silent population is playing a build from weeks ago and there is no
way to tell.

**So the worker is network-first, and the cache is a fallback rather than a source.** Online, it is
as if the worker were not there. Offline, the game still boots. The property worth having is that
`VERSION` is now housekeeping — it decides when stale caches are swept up, not whether anyone sees
new code. Forgetting it costs nothing. A design that fails safe under human error beats one that is
faster when maintained perfectly, on a project pushed several times a day.

**The worker is not registered on localhost at all, and unregisters itself if found there.** The
whole point was to add distribution without touching the daily loop of edit, reload, look. A worker
serving stale files during development would have taxed every iteration forever to save a few
hundred milliseconds for players. `?sw` opts in when the offline path itself needs testing.

**The `icons/` PNGs break the no-binary-assets rule, knowingly.** iOS will not take an SVG for a
home screen icon. They are packaging rather than art — no game code loads them, and `icon.svg`
stays the source they are rasterised from, drawn with `flora.js`'s own petal path so it is not a
second art style. `09-conventions.md` records the carve-out and says plainly that it does not
generalise.

**Not the App Store.** That is Capacitor, a build step, `node_modules`, a $99/year account and
review latency. The PWA groundwork carries over to it whole, so nothing here is wasted if that
decision is made later, and it was not worth paying for now to find out.

---

## 2026-08-18 — Softer Zs, and a PWA that stopped short of the bottom of the phone

Both found by the owner on a real installed app, and neither was visible anywhere else.

**The sleeping Zs were too loud.** Outlined filled glyphs read on a phone as three hard graphic
shapes stuck to a creature's head rather than as something drifting off a sleeping animal. They are
now **solid white with no outline**, smaller, at 0.72 opacity — **the one place the house rule of
"flat fill inside one thick outline" is deliberately broken**, because a Z is a wisp coming off a
creature rather than a thing in the world. Recorded as an exception so nobody "fixes" it later.

**And the motion was wrong in a way worth naming.** Each Z slid out to one side and scaled up, which
reads as a graphic being *pushed*. It now sways left, right, left over a slow 4.8s rise with **no
scaling at all**, and the three share one keyframe offset by *negative* delays so they are already
staggered on the first frame and form a stream rather than a pulse. Verified by sampling the
transform across the cycle rather than by eye: x runs 0 → −3.5 → +3.2 → −2.5 → +1 while y rises
monotonically.

*This is the third pass on this one small effect*, and every failure was invisible in code review:
invisible at rest, then a hairline against dark earth, then too heavy on a phone. Small motion
belongs in front of eyes early.

**The installed PWA ended short of the home indicator.** `.game` is `position: fixed; inset: 0`, but
it also carries a `transform` for the screen shake — which makes it a containing block, and iOS then
resolved `inset: 0` against a viewport that excluded the bottom safe area. The result was a band of
page background under the dock. It has an explicit **`height: 100dvh`** now, which measures the real
viewport; `height` wins over `bottom`, and a browser that does not know `dvh` ignores the line and
keeps the old behaviour, so it degrades safely.

**The page background also moved from sky blue to meadow green**, which is the belt to that
braces. Whatever a browser leaves uncovered is always at the *bottom* of the screen, and the bottom
of this game is lawn — so a stray strip is now invisible instead of being a band of the wrong
colour. Verified by faking a 46px uncovered strip and looking at it. The manifest's
`background_color` stays sky blue, because that one is the launch splash rather than a runtime
colour.

**Neither could be reproduced locally**, which is the standing lesson: iOS standalone is a different
layout environment, and the desktop preview reported `.game` covering the viewport exactly.

---

## 2026-08-18 — The Feed panel lists tenders first, and pointedly does not sort by urgency

**Built:** one stable sort in `feedRows()`.

**Tending creatures go to the top** because a resting one cannot be fed at all, so it is dead weight
at the top of the panel you opened in order to act.

**The interesting half is what it deliberately does not do.** The obviously "better" sort is by who
needs feeding most — asleep, then unfed, then well fed. That order is wrong here for one reason:
**it changes on the very tap you just made.** Feed the sleeping creature at the top and its row
jumps to third while your finger is still on it, and the next row slides up under where you tapped.
Sorting a list by a property the list's own buttons mutate is how a panel becomes unusable, and it
is worth remembering the next time a "sort by what needs attention" seems obvious.

Tending is the right key precisely because it is **stable within this screen** — it only changes in
the Hollow's Loadout mode, which is somewhere else. Verified by feeding the top row and confirming
the order is byte-identical afterwards.

`sort` is stable in modern JS, so each group keeps the roster order the Almanac already uses rather
than inventing a second ordering for the same six creatures.

**No sim-test:** `tools/sim-test.js` cannot see a `ui-*` file. Verified by driving the panel with
the tended creatures deliberately last in roster order.

---

## 2026-08-18 — Cheats for the sleep clocks, and the dead end they immediately found

**Built:** Drain 1h / 4h / 24h, Send them to sleep, and Feed everyone, in the Developer tools panel
under a header showing how many tenders are down. 21 more assertions, 815 total.

**The ask was practical** — a four-hour awake window is untestable if you have to wait four hours.

**They wind the clocks back rather than the world forward**, which matters for the same reason
`simulateAway()` winds the world back rather than pushing `lastSeen`: sleeping is *derived* from
`awakeUntil` against now, so moving that value is not a simulation of the passage of time, it **is**
the passage of time. The panel's standing rule holds — every cheat forces the real code path — and
**Feed everyone** goes further by running the actual `feedCritter()` purchase rather than writing
the clocks, so the wake-up beat is the one a player gets.

**Both clocks always move together.** Every food's awake window outlasts its boost, so *asleep but
still well fed* is a state real play cannot reach, and a cheat that invented one would send someone
chasing a bug that only the cheat can produce.

**Then the cheats immediately found a real dead end, which is the point of building them.** Sending
everyone to sleep put the three *resting* creatures to sleep too — and feeding requires a tending
creature, so nothing could ever wake them. The Hollow showed three sleepers with no way to act on
them.

**So: only a tending creature can be asleep.** A resting one contributes nothing either way, so its
awake clock is meaningless, and showing the player a problem they cannot act on is the one thing an
upkeep mechanic must never do — it is the difference between pressure and a wall. A rested creature
swapped back in with an expired clock *does* wake up needing food, which is coherent and gives the
loadout swap a small honest cost. Asserted both ways: a resting creature with an empty clock is not
asleep, and **everyone the game shows as asleep is someone the player can wake.**

*Worth keeping as a general rule:* an upkeep state that the player cannot clear is not a mechanic,
it is a bug wearing one. Any future thing that switches off should be checked against "and can they
turn it back on from here?".

**The deny messages are now per-cheat.** The panel's shared "that cheat needs something in the garden
first" was written for the garden cheats and is simply wrong for these three — "they are all asleep
already" and "nobody is tending, or they are all fed to the cap" say what actually happened. A cheat
that quietly does nothing reads as the feature being broken; a cheat that lies about *why* is worse.

---

## 2026-08-18 — Creatures sleep, and the sleeping face is what made an upkeep timer acceptable

**Built:** a second clock. Food now keeps a creature **awake** (4 / 8 / 16 hours) as well as **well
fed** (1 / 4 / 12). A creature whose awake clock runs out is **asleep** — shut eyes, Zs, no trait,
no pair. 34 more assertions, 794 total.

**This reverses the entry immediately below it, deliberately and at the owner's direction**, hours
after it shipped. That entry argued nothing should ever switch off. The owner came back with the
case for stakes: *"as much as I think we are a cozy game, we need to have some features that are
somewhat punishing… the whole idea is retention and getting people to come back in."* That is
correct and the previous entry under-weighted it — a game with no downside gives a returning player
nothing to feel.

**What changed the answer was not a compromise, it was the owner's presentation.** The objection had
been that a pet going quiet reads as *something taken away*, which this project's own creature doc
forbids in three places. **A pet that is visibly asleep does not read that way.** It is obviously
reversible, it says what to do about it, and it is charming rather than punishing — Animal Crossing
rather than an energy wall. The same mechanic in a different costume is a different mechanic.

**So the sleeping art is load-bearing, not decoration.** Recorded plainly in
[22-creatures.md](22-creatures.md) because it is the kind of thing a later optimisation pass would
quietly break: if a creature ever stops working without *looking* asleep, this reverts to the
version the cosy pillar rejects.

**It also settled the pair problem rather than creating one.** A pair now needs both halves tending
*and* awake, so pairs do go quiet. The rule says "a bonus you cannot tell is active is not a bonus"
— and a visibly sleeping creature is precisely how you can tell. Sleep is the one thing allowed to
switch a pair off, because it is the only thing that announces itself.

**Punishment on one axis, not two.** A sleeping creature keeps its home, its slot, its place on
screen, and **keeps leaving keepsakes**. A lapsed player comes back to a small gift waiting rather
than to nothing — and mementos are the currency the Hollow's decorating will read, so stopping them
would have taxed the same lapse twice.

**The number was the argument, not the structure.** The owner sketched a one-hour active window. At
that length a twice-daily player finds their pets asleep essentially every session, which is not
pressure but a wall — and it is the version that earns resentment rather than habit. Offered 8/16/24
and 4/8/16, the owner took the tighter one. **`awake` in `data.js` is the dial if it ever reads as a
chore; never the prices.**

*The counter-argument that was fairly raised and lost:* [17-market-and-positioning.md](17-market-and-positioning.md)
cites **Finch** (~75% women, D7 37%) as getting its retention from *non-punitive* streaks, and warns
that more than two streak nudges a week makes abandonment 41% more likely. That is a real caution
and it now applies to notifications in the Unity port rather than to the mechanic itself. In the
other direction, **Pocket Plants** is the closest structural analogue in that document and does run
on energy — though its energy gates the player's own actions, not whether the collection is alive.

**An arriving creature gets 24 hours free**, and so does a save written before sleeping existed —
absent means awake, the same rule `tending` follows. Nobody meets their first pet and watches it
fall asleep before learning food exists. Side effect worth knowing: the arrival grant equals the
cap, so a new creature cannot be starved inside one food's worth of time.

**Three art lessons, all found by looking rather than by a test.** A Z that starts at `opacity: 0`
and fades in via keyframes is invisible wherever the animation does not run — the pack-badge trap,
made again inside a file whose own comment warned about it. A *stroked* Z at 9px is a hairline that
vanishes against dark earth, so they became filled glyphs inside one thick outline. And the corners
of a creature belong to its badges, so the Zs had to rise clear above the viewBox rather than tuck
beside the head.

**And a formatting bug worth the line:** rounding hours and minutes separately renders 23h 59m 59s
as **"23h 60m"**. Round to whole minutes first, then split.

---

## 2026-08-18 — Feeding is a treat, not an upkeep, and it buys a star rather than a multiplier

> **Half of this was overturned the same day — see the entry above.** The *boost* half stands
> exactly as written: food buys a star, and the numbers here are still the reasoning for that. The
> "nothing ever switches off" half was **reversed at the owner's direction**: creatures now also
> have an awake clock and **do** go to sleep. The argument below under-weighted the case for stakes,
> and what resolved it was the sleeping *presentation* rather than a compromise on the mechanic.
> Kept unedited because the reasoning is still the reasoning, and the shape of the reversal is worth
> being able to read.

**Built:** three foods, `fedUntil` on each creature, a Feed panel on the Hollow's dock, and 42 new
assertions. Design in [22-creatures.md](22-creatures.md#food-2026-08-18).

**The owner's shape was an upkeep timer** — a pet goes *inactive* without food, and food tiers buy
hours of being active, as a retention and monetization surface. The goals were right and are all
delivered. **The direction of the baseline is what changed**, after a push-back that the owner
accepted: a creature is always active, and food makes it *better* than normal for a while.

**Why that mattered enough to argue about.** [22-creatures.md](22-creatures.md) already said it three
times before food existed — "nothing is ever taken away", "losing one is punitive", and a returning
player finding a creature idle is "the same class of harm as taking a seed away". An upkeep timer
breaks all three. And the loop is *identical* either way: you come back because the boost lapsed
rather than because the pet did, you buy the same food, on the same cadence. The only thing that
moves is whether lapsing feels like losing something you raised.

The research pointed the same way. **Finch** — the closest business analogue in
[17-market-and-positioning.md](17-market-and-positioning.md), ~75% women, $30–40M ARR — gets D7 37%
from **non-punitive streaks** specifically, and the same source warns that more than two streak
nudges a week makes abandonment 41% more likely.

*The honest counter-argument, recorded because it is a real one:* **Pocket Plants** is listed as the
closest structural analogue in that same document and it does run on energy. But its energy gates
**the player's own actions**, not whether the collection they built is alive. That is a different
mechanic wearing a similar name.

**Pairs deliberately ignore food.** They stay binary on tending. A pair blinking out because a timer
lapsed would be exactly the failure the pair rules already name — "a bonus you cannot tell is active
is not a bonus."

**A star, not ×2, and the numbers are why.** Measured against the real roster, a flat double is safe
for four creatures — the `pool` system is doing its job, `chance × (mult−1)` stays small, Bumble
stays under the `k.every/4` floor, Ember stays inside `maxRate`. It is **not** safe for two. Luna is
the only trait in the `yield` pool: ×2 takes her from +9.6% to **+19.2% average payout**, on a
product that is already seven multiplied terms with an endless mastery ladder under it. Thistle at
×2 doubles the faucet on the premium currency.

One star is `(n+1)/n` — **×2.00 at one star, ×1.20 at five**. The boost shrinks exactly as the
creature's absolute contribution grows, which is the opposite of how a flat multiplier behaves. It
was also nearly free: `critterTraitAt()` already scales by star, so a fed creature computes one
higher. **The ceiling had to move to `CREATURE_STARS + FED_STARS`** or a maxed creature would have
been the one player state where feeding did nothing.

**Food never advances the star a creature was raised to.** `critterLevel()` is what growth counts
against and `critterWorkLevel()` is what traits read. Keeping those apart is what stops food becoming
a second path to raising a creature — and the bloom-raises-its-own-creature rule is this project's
best answer to "why would I ever plant a Daisy again". A sim-test asserts it.

**Only a tending creature can be fed**, because traits are only read from tenders and feeding a
rester would be a purchase that buys nothing. The panel says so and points at the Loadout mode.

**Fed time caps at 24 hours, stated openly in the panel.** Without it one large purchase buys weeks
and the loop stops existing. Egg, Inc. is cited in the market doc for exactly this: a stated cap
reads as a rule, a hidden one reads as theft.

*Rejected: mementos as the food currency.* That was the agent's proposal and the owner's counter was
better. **Mementos buy decorations and skins for the Hollow** — a piece costing keepsakes from *two
different creatures*, so decorating requires roster breadth rather than depth. The art already has a
memento cubby waiting, and it is the *item-as-key* device the market doc files under Neko Atsume's
26 rare cats. That is the next piece and it is agreed, not built.

**Two traps, both of which cost real time.** `state.critters[id].fed` already existed and means the
**keepsake clock**, so food needed `fedUntil` — writing into `fed` would have silently reset every
keepsake timer in the game. And `tools/sim-test.js` keeps an **explicit `GLOBALS` whitelist**: a new
`data.js` constant that is not on it comes back `undefined` inside `game.js`, throws inside `load()`,
gets caught, and silently resets the save. The failure surfaced as an unrelated creature test.

**Two things only the picture showed.** The three food buttons wrapped 2 + 1 because they were nested
beside a 46px portrait; they now sit outside the text column as a three-column grid. And the fed
star was appended *after* the five, which reads as a sixth star rather than one on loan — it now sits
in the slot the creature is working at, and only a five-star creature grows a genuine sixth pip.

---

## 2026-08-18 — The loadout moved into the room, and a celebration fired from the corner

**Built:** Pet and Loadout as modes in the Hollow's dock, a tap on a creature spending whichever is
armed, and a fix for FX centred on a hidden element.

**The odd part was going somewhere else to choose who stands here.** Loadout opened the Almanac —
so the way to pick which pets are out was to leave the room they are standing in and read a book
about them. The room already had every creature drawn, already had a leaf badge saying who was
tending, and already routed taps through one handler. It was a surface waiting for a second verb.

**Two verbs on the same target means a mode, not a second gesture.** Long-press, double-tap and
drag were all available and all worse: each is undiscoverable, and the dock button that arms the
mode is already on screen saying what it does. The armed button lights, the count line says
`· tap to swap`, and resting creatures step back to half opacity. Which state you are in is
readable without a tutorial.

**No toast on entering the mode.** The first draft had one and it duplicated the count line
verbatim. Toasts are for notable moments and the cap is two; arming a mode is neither.

**The Almanac keeps its toggles rather than being replaced.** It is the only place an *unmet*
creature and its harvest progress can live, and the Hollow can only show creatures already home.
Two surfaces onto one `Game.setTending()` — the same shape `UI.tapCritter()` already uses for
petting from either screen. Nothing new went into the save; the mode is a UI local.

**The bug this exposed, and why it had been invisible.** Forming Nightbloom from inside the Hollow
threw its confetti and its green ring at the top-left corner of the screen. Both the `pair` and
`critter` handlers centre on `#garden`, and `.in-hollow` sets `display:none` on `.stage` — a hidden
element measures as a 0×0 rect, so `FX.centerOf()` returns the origin and the celebration happens
in the corner. Measured directly: `#garden` reads 0×0 while `#hollow` reads 375×812.

It had never mattered because the loadout could only be changed from the Almanac, over the garden.
It was reachable before this change though — automation harvests on the tick regardless of which
screen is up, so a creature could always have arrived or gained a star while the room was open.
Both handlers now go through one `critterStage()` helper. **The general rule worth keeping: a
celebration must be centred on the screen that is actually up, and a zero rect is what a hidden
element measures rather than an error anything reports.**

**Docs corrected while in there.** `02-architecture.md` claimed eleven JavaScript files and its
load-order table was missing `critters.js`, `hollow.js` and `ui-hollow.js`; `README.md` said seven
`<script>` tags. There are fourteen. The table is the first thing a new agent reads before touching
load order, so a gap in it is worse than most stale numbers.

**Not covered by a sim-test, deliberately and unavoidably.** `tools/sim-test.js` cannot see a `ui-*`
file. `setTending()` and the pair machinery underneath were already covered and still pass at 718;
what is new here is entirely presentation, and it was verified by driving the real screen and
looking at it.

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

**The reframe: habitat as well as factory.** *(Sharpened by the owner later the same day: the wording
below overstated it. The production chain is **unsolved, not rejected** — see
[22-creatures.md](22-creatures.md#the-production-chain-is-not-cancelled--clarified-by-the-owner-2026-08-16).
The argument that follows is about what the game asks you to care about **first**, not about deleting
a system.)* The whole design had been thinking in production
chains — garden makes flowers, bench makes goods, market consumes goods. That is Township, in a
crowded capital-heavy lane, and it is not what the research says this audience wants: the likely
audience is **69% female with Completion and Fantasy as the top two motivations**, and neither is
"optimise a supply chain" — which is an argument about emphasis, not a reason to cut the chain. The
garden should also be a place that becomes alive because of what you plant.

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
Greyscale plus "Not yet grown" is enough to read as a hole. *(Superseded 2026-09-02: both premises
are retired — the level gates died with the Garden Year, and the seed-curtain ruling hides the deep
ladder in the SAME silhouette grammar on both surfaces at once, so there is no second-secret
asymmetry. See the 2026-09-02 curtain-and-drip entry at the top.)*

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

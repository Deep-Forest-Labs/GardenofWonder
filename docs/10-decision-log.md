# Decision Log

Why things are the way they are. Append new entries at the top with a date. Record the reasoning,
not the diff — git already has the diff.

---

## 2026-08-05 — Direction set: modest revenue, multi-region meta-layer, one new mechanic

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

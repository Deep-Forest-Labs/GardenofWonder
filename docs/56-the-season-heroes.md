# The Season Heroes — Fall's and Spring's flowers, and Holly's eyes

**Status: SPIKE, 2026-09-27 — the owner is picking. Nothing is built, and no game code follows from
this document until the owner has picked from the spike.** Six candidates are drawn in
[`tools/hero-spike.html`](https://deep-forest-labs.github.io/GardenofWonder/tools/hero-spike.html),
three for each season, beside Poppy and Holly, with Holly's eyes redrawn three ways. This document
records what each candidate is, why it is shaped that way, what the drawing decided, and what the
owner is being asked. Everything is judged by eye on the page; the words here only index it.

**The constraint, as ruled (decision log, 2026-09-27):**

> *"I think we might have gone a little too overboard with the visual complexity of Holly, and I
> really like our main flower, Poppy. I want to make sure the other flowers are somewhat simple, but
> maybe carry a different silhouette."*

Ruled from that: **simple like Poppy** — one face, one petal shape, one palette, readable at 46px —
and **under Holly's kit** (no crown, no two-tone petals, no accessory unless the accessory *is* the
silhouette). **Each hero owns a silhouette that differs from both** Poppy's round rosette and
Holly's crowned rose, and the black-silhouette row is the test. **Eyes read first**: cute and clear
at 46px before anything else; mischief is a tilt on a readable eye, never a squint. **Gender open**:
one or both may be male. **One family**: the heroes are Poppy's siblings, one seed per season from
Gran's tin (doc 55 §2), so the four must read as one cast at a glance.

**No outside reference, image or name enters this repo.** Every shape here is described in words
and drawn from the game's own parts.

---

## The natures, written before the drawing

Holly's nature comes from Winter's rule: Winter is the night shift, so she is the one who keeps the
garden while you sleep. The same move for the other two:

- **Fall — hours, and the bed pays together** (doc 32: planted in the morning, popped at dinner;
  the windfall lands only when all eight are ripe). **Fall's hero is the one who waits until
  everyone is in, and then calls them to the table.** Nothing is picked early on their watch.
- **Spring — the long game** (doc 32: the nursery, Prisms spent in ceremony, breeding one day; the
  garden *about* the other three). **Spring's hero plants for a year they will not see** — patient,
  a little ceremonious, the keeper of what hasn't come up yet.

## What the drawing decided for the whole family

Each of these is reversible with one word from the owner; none is a ruling.

- **One eye recipe, and it is Poppy's own** — the white eye (6.2 × 7.4), the 2.4 ink contour, the
  ink pupil, one shine, her blink lid (`.tf-lid`). Each new hero varies only **tilt** (the outer
  corner up or down), **a resting lid** (a face-coloured lid with an ink lid line, capped at a
  third of the eye so the pupil and its shine are always whole), **pupil size**, and **where it
  looks**. This works for all six because **none of them has a pale face** — Holly's lesson, that a
  white eye on porcelain reads as spectacles, never arises.
- **Poppy's pink cheeks on all six** — the family blush. Holly still does not blush (her ruling).
- **The male read is one level brow stroke over each eye and a wider mouth.** Poppy's face has no
  brow and reads as a girl, so her face is the family's default. **The female read is a single lash
  at the outer corner** (Holly's own, one instead of two) and a head tilt. No bows, no moustaches,
  no lashes doing the eye's work.
- **Every colour is a value doc 05 already declares** — a `:root` token, a declared component ramp
  (Fall's trug, the gate skies, the orchard canopy in `Fall.SKIES`, the hedge, the frost), or
  Poppy's and Holly's own. **No new hex.** The currency and rarity tokens are not borrowed, per doc
  05's own rule. See *The rule bites in Spring*, below.
- **Fitted in the avatar picker, all six** — the whole head inside the circular mask, on Holly's
  rule (her crown was clipped by the mask once; doc 46).

---

## The six candidates

Species, why the shape reads at 46px, the silhouette claim, the eye, the palette, the read, the
nature, and three names. Names are in Poppy's and Holly's register — a real plant or a plain English
word, one or two syllables — and every one was checked against `data.js`, `customers.js`, doc 55 and
doc 57: none is already a seed, a creature, a villager or a food. (Pip, Hazel, Clover, Willow, Wren,
Bell and Fern were each struck for that reason, and Sprout because it is a growth stage's name.) **The first name is the desk's pick.**

### F·A — The Sunflower

- **Species:** sunflower. **Why the shape:** the one flower everyone can draw from memory — a dark
  disc and a ring of rays. At 46px the ray count is lost but the spikiness is not.
- **Silhouette:** eighteen sharp rays all the way round, in two ranks. Poppy's edge is eight soft
  lobes; Holly's points are on top only.
- **Eye:** level, a light resting lid at both corners (0.1), a slightly larger pupil (3.6).
- **Palette:** the Fall gate's sky, mid `#ffb570` (**dominant**), its deep `#e88f4e` for the back
  rank, Fall's trug top `#c98a4e` for the disc face, the hedge's lit `#57a25c` for leaves.
- **Read: male** — a level brow stroke and a wide open grin; a thick stem and bigger leaves.
- **Nature:** turns to follow the sun across the day, and when it sets, calls everybody in to eat.
- **Names:** Rowan, Barley, Russet.

### F·B — The Mop

- **Species:** spider chrysanthemum — autumn's own flower, opening as the days shorten. **Why the
  shape:** thin quills with hooked tips, the side ones drooping — the only open, gappy silhouette in
  the game.
- **Silhouette:** a spray of quills you can see between. Poppy and Holly are both solid shapes.
- **Eye:** tilted a touch down at the outer corner, the resting lid heavier there (0.24) — kindly.
- **Palette:** the orchard canopy from `Fall.SKIES` — lit `#e0803c` (**dominant**) and `#c9622f` for
  the back quills; the gate sky's top `#ffd9a1` for the face; hedge leaves.
- **Read: either**, on purpose — no brow, no lash. The voice decides.
- **Nature:** the last bloom of the year, in no hurry at all: everything ripens if you give it the
  hours, and they are not about to pick anything early.
- **Names:** Ginger, Tansy, Aster.
- **Two passes failed first, and the lesson is recorded in the spike's code:** a dense ring of thick
  quills round a face is a lion's mane, and quills that rise from the top and fall either side are a
  wig. Sparse and radial with gravity is what reads as a flower.

### F·C — The Dinnerplate

- **Species:** dinnerplate dahlia, the café-au-lait kind — grown for heads the width of a plate and
  cut in September. **Why the shape:** wider than it is tall (1.36 : 0.82), which no flower in the
  game is; and the name is Fall's rule — the windfall is the dinner appointment.
- **Silhouette:** a wide plate. Poppy and Holly are both round. The petals are laid on an ellipse
  rather than squashed, so the outline stays the house's 3 all the way round.
- **Eye:** outer corners lifted (7°), a light lid toward the nose, one lash.
- **Palette:** `--paper-3` `#ffe0ad` (**dominant**) and the gate sky's top `#ffd9a1` for the petal
  tiers, the gate sky's mid `#ffb570` for the face, hedge leaves.
- **Read: female** — a lash at each outer corner, the head tilted 7°, a small smile lifted at one side.
- **Nature:** sets the table — nobody sits down until every one of the eight has come in.
- **Names:** Maple, Clove, Amber.

### S·A — The Trumpet

- **Species:** daffodil — the first flower of the year, and it has a trumpet. **Why the shape:** six
  tepals make a star with fat points, fewer and broader than the sunflower's rays, so the two never
  blur; the frilled corona rings the face.
- **Silhouette:** a six-point star, all the way round. Holly's points are a crown on top.
- **Eye:** outer corners up (4°), no lid, looking up.
- **Palette:** Poppy's face `#ffe9a8` (**dominant**) for the front tepals, her lid `#ffd98a` for the
  back three, the `gface` stop `#ffc978` for the corona, `--paper-3` for the face, `--grass-l` leaves.
- **Read: male** — a level brow stroke set high (eager, not cross), an open mouth.
- **Nature:** first up, and loudest about it — the herald who announces every Turn's ceremony for a
  spring that has not arrived yet.
- **Names:** Sorrel, Dill, Chive.

### S·B — The Bell

- **Species:** bluebell. **Why the shape:** the droop, real — a bluebell's bells hang from an arched
  stem, and one bell is one petal, so she is the simplest candidate on the page. Worn the storybook
  way: the bell is a bonnet and her face hangs below it like the clapper.
- **Silhouette:** a bell with six pointed tips and a stalk on top, the face below it.
- **Eye:** outer corners down (3°), the lid heavier there (0.26), looking down, one lash.
- **Palette:** the frost shade `#93b6d0` (**dominant**), the Winter gate sky `#b9cee0` for its light,
  `--paper-3` for the face, `--grass-l` leaves.
- **Read: female** — one lash, lowered lids, a small mouth; the head hangs, which reads as shy.
- **Nature:** a bluebell wood takes decades to spread and nobody alive planted it — she is fine with
  that. The long game, in person.
- **Names:** Ivy, Lilac, Dewdrop.
- **Three passes failed first:** a bell wrapped past the chin reads as a hood; a bell whose face is
  its own colour reads as a ghost; a soft scalloped hem reads as a haircut. The tips have to be
  points. **The risk that remains:** some will read the bell as blue hair.

### S·C — The Cup

- **Species:** tulip — planted in autumn, it waits all winter, which is the long game in one plant.
  **Why the shape:** three soft tips over a round-bottomed cup, taller than it is wide. Every petal
  sits behind the face; a cup drawn in front would hide the mouth.
- **Silhouette:** a tall cup with three soft tips. Holly's crown is seven sharp points over a round
  head.
- **Eye:** level, a light lid at both corners. The neutral face.
- **Palette:** the family's mouth crimson `#a83250` (**dominant** — Poppy's and Holly's mouth, a use
  and not a hue, the move Holly made with Poppy's pink), the gate sky's top `#ffd9a1` for the face,
  `--grass-l` and `--grass`.
- **Read: either** — level eyes, a level smile, no brow and no lash. The voice decides.
- **Nature:** spent the whole winter underground as a bulb, planning; keeps the nursery's ledger, and
  ceremony is how they say they care.
- **Names:** Sage, Moss, Linden.

**Tulip and bluebell are also Summer seeds.** Holly (the winter rose) already stands beside the Rose
seed, so the precedent exists; a hero's name is never its species, which keeps the two apart in
every sentence a player reads.

---

## The silhouette row — the gate

All eight filled plain black, at 46px in the picker's mask and at 120px (spike frame 3).

- **Strongest: the Trumpet, the Bell and the Cup.** A star, a bell and a tulip are the shapes a child
  would draw for those flowers, and all three hold at 46px.
- **The Dinnerplate** is the only wide shape in the game and holds for that reason alone. It pays for
  it in face size: fitted, it draws at 0.72 (Holly: 0.78), the Mop at 0.74; the Trumpet and the Cup
  at 0.9.
- **The Mop** is distinctive, but filled black its hooked quills can read as a spider or an anemone,
  and on Fall's own woven centre cell its rust is the trug's family — the weakest figure of the three
  in the room (spike frame 6).
- **Weakest: the Sunflower.** At 46px its rays close up into a toothed disc, and a round dark disc is
  what Holly's body is too. It passes, narrowly, on the teeth.
- **Never together: the Sunflower and the Trumpet** (both points all the way round).

**If forced to pick, the desk's pair is F·C the Dinnerplate and S·C the Cup.** The Dinnerplate is
the only wide shape in the game, the strongest figure on Fall's own board, and its name is Fall's
rule. The Cup is the cleanest Spring silhouette, owns a colour no other hero wears, and its nature is
the long game. Between them: one female read and one either, so a boy is still available through the
Cup's voice. Runner-up for Fall: the Sunflower, if recognisability matters more than the gate.

### Which pairs can stand together

The pair check against Poppy and Holly passes for all six (no candidate's dominant is Poppy's pink or
Holly's plum). Two are flagged: the Trumpet's dominant is Poppy's *face* colour (it reads as family on
purpose, and it is the closest of the six to Poppy), and the Bell's is Holly's *frost* (it reads
colder than Spring should). Across seasons, by eye:

| | S·A Trumpet | S·B Bell | S·C Cup |
| --- | --- | --- | --- |
| **F·A Sunflower** | ✗ amber and gold, too close | ✓ | ✓ |
| **F·B Mop** | ✓ | ✓ | ✓ |
| **F·C Dinnerplate** | ✗ cream and pale gold, too close | ✓ | ✓ |

### The rule bites in Spring

Spring's natural colours — clear blue, violet, lemon — are all spoken for in doc 05: blue and violet
are the rarity colours (Rare, Epic) and the gem, lemon is the coin and Legendary, and doc 05 forbids
borrowing any of them. So the daffodil wears Poppy's face-gold, the bluebell wears Holly's
frost-blue, and the tulip wears the family's mouth crimson. Fall has no such problem: it has three
declared autumn ramps of its own. **For the Spring hero picked, the build may want one declared
component colour of its own, beside the drawing, the way Holly's plum was declared** — an open
question below.

---

## Holly's eyes

Everything else about Holly is untouched — crown, petals, porcelain, mark, mouth. Only the eyes
change, shown at full size and at 46px beside her current head (spike frame 4).

**The finding: the built eye is drawn the wrong way round.** Holly's spike described her eye as
*"angled down toward the nose, with two short lashes off the outer tip."* In `hollyEye()`
(`flora.js`) the lash path runs to +x on the unmirrored left eye, which is the **inner** side, so the
almond's point and both lashes sit at the nose, the eyes rise toward the centre, and the four lashes
meet under the frost mark like a frown line. Rendered from `flora.js` itself in the spike page: the
same. The eye is also 10.6 units tall against Poppy's 14.8. At 46px she reads as two worried dark
patches — the squint the 2026-09-27 rule forbids, from the other side. **Any of the three treatments
fixes the direction; they differ in how much eye they give her.**

| | What changed | What it keeps of "mischievous" |
| --- | --- | --- |
| **H1 · Almond, turned round** | The same almond flipped: point and one lash at the **outer** corner; 35% taller; a bigger shine | The almond and the lash — a winged, sly eye. The smallest change |
| **H2 · The family eye** | Poppy's eye — white, ink ring, pupil, shine — with the pupil grown to 4.6 so the white is a thin rim; a porcelain lid cut on a slant, heavy toward the nose | The slant and one lash. All four sisters would share one eye |
| **H3 · The pip** | The creatures' eye (`critters.js`): one solid ink oval with one big shine, upright, with the same slanted lid cut across its top | The slant — the smug half-lid is the mischief — and one lash |

**The desk recommends H3.** It is the only treatment that is a *solid* ink shape, and solid ink is
the one eye that cannot read as spectacles on porcelain — the lesson her first spike paid for. At
46px it is the clearest dark mark of the four with a shine you can see, and the smug look is carried
by the lid rather than by squeezing the eye. **H2 is the runner-up** and the most *family*, but it
leans on a thin white rim on a white face, the exact risk two earlier passes failed on. **Recommended
timing: change her with the heroes, not before** — one commit should move all four faces, and the
bug is cosmetic, not broken.

---

## Expressions, the room, and the idle

- **Four faces each** (spike frame 5): idle, talking (the mouth opens — ui.js's `faceReact()` shapes,
  scaled per hero), pleased (upturned arc eyes over a big smile) and asleep (the creatures'
  downturned arcs and drifting Zs, drawn at night). Pleased and asleep must never be mistaken for each
  other; at 46px the mouth tells them apart.
- **In the room** (frame 6): Fall's candidates on a hand-copy of `Fall.scene()`, `.fl-board` and
  `Fall.cellFloor()` at 390 wide, with a toggle back to today's borrowed Poppy. Spring's on a plain
  spring-green stand-in, captioned: Spring has no board yet.
- **The idle** (frame 7): the desk's pair on the talking flower's own idle, hand-copied from
  `style.css` — `stemSway` 3.4s, `leafWaveL/R` 2.6s and 2.9s, `blink` every 5.4s, `cheekPulse` —
  beside the same frame under reduced motion.

---

## What a build would need

Not scoped until the owner picks; listed so the pick can be priced.

1. **`fallHead()` / `springHead()` and `fall()` / `spring()` in `flora.js`, on Holly's pattern** —
   the 120 × 142 box, the outer `translate(0 10)` group that nothing selects (the recorded trap: a
   CSS `transform` replaces an SVG `transform` attribute), `.tf-head` at (60,56), a `*Face(size)`
   fitted for the picker, and `opts.sleeping`. Their component colours sit beside the drawing, with
   a line in doc 05's palette section, as Holly's do.
2. **Carry the classes the game already animates and reacts through**: `.tf-stemwrap`, `.tf-leaf-l`
   / `-r`, `.tf-lid` on the blink lid, `.tf-cheek`, and `.tf-mouth-path` on the mouth — `faceReact()`
   finds the mouth by that class, so a hero without it cannot open its mouth when tapped.
3. **Two idle facts.** `.tf-petals` turns once every 26 seconds; that is for **radial heads only**
   (the Sunflower) — it turns a six-point daffodil into a pinwheel and spins a cup, bell, mop or
   plate sideways. And the head sits **outside** `.tf-stemwrap`, so only the stem sways; a drooping
   head (the Bell) must sit **inside** it or it comes loose.
4. **The flower-button swap in Fall's room.** `ui-fall.js` draws `Flora.talkingFlower()` into
   `#fallFlower` today; Fall's hero replaces it, the way `ui-winter.js` draws `Flora.holly()`. Slice
   C already gave the speech bubble a per-season home, so the hero speaks for free. Poppy keeps the
   ceremony, the icon and the tutorial (the Holly ruling's rule, extended).
5. **The picker rows.** `Game.avatarChoices()` pushes Holly into `heroes` once `seen.hollyIntro`;
   each new hero joins the same way, on its own intro flag, and `renderPicker()` / `faceArt()` in
   `ui-menu.js` gain a branch and a tint each.
6. **The four voice buckets per hero**, on Holly's shape (`hollyIntro`, `hollyTuck`, `hollyMorning`,
   `hollyIdle`) — an intro, the season's ritual line, a morning or return line, and idle. **The story
   bible fills them**; doc 57 holds `[FALL HERO]` / `[SPRING HERO]` placeholders until then. No voice
   lines are written here.
7. **Holly's eye**, whichever is picked: one function in `flora.js` and the silhouette test re-run.

## Open questions for the owner

1. **Which Fall hero and which Spring hero?** The desk's forced pair is the Dinnerplate and the Cup;
   the matrix above says which pairs can stand together.
2. **Gender, for each.** The drawings carry a read (Sunflower and Trumpet male; Dinnerplate and Bell
   female; Mop and Cup either), and the voice can decide for the two drawn as either.
3. **Names** — three each above; the first is the desk's.
4. **Does Spring's hero appear before Spring's garden exists?** Spring opens about Turn 6 and has no
   board. The hero could first appear in the Turn's ceremony — the nursery's job, per doc 32 — and
   move into its room when the room is built.
5. **Holly's eyes: Now, H1, H2 or H3 — and now, or with the heroes?** The desk recommends H3, with
   the heroes.
6. **May the picked Spring hero declare one colour of its own?** It is the difference between a
   bluebell that is blue and one that is Winter's frost.
7. **Should Poppy be fitted in the picker too?** She is the only face drawn as a whole plant, so at
   46px hers is the smallest face in the row. One line in `ui-menu.js`.

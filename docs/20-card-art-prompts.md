# Card Art Prompts

Prompts for generating card art externally — **Grok or Midjourney** — and dropping it into the album.
Structure and slots are in [19-card-album.md](19-card-album.md).

**Nothing here is required.** The album ships with procedural placeholders and works without a single
image. This exists so art can be added when it is wanted, not before.

## The style is the game, not the interface

An earlier version of this document described flat vector emblems with heavy outlines. **That was
wrong** — it described the *card frames* and the rest of the UI chrome, not the world the game is set
in.

The art direction is [05-art-direction.md](05-art-direction.md): **Super Mario Bros. Wonder**, with
Mario Kart alongside it. Vivid grass greens, warm oranges, sunny yellows. Everything glossy, rounded,
slightly plush. Soft dimensional shading rather than flat fills. Bouncy, characterful, joyful.

**Why the in-game art looks flatter than this.** Everything in the running game is procedural SVG
drawn at 22–64px, so it needs thick outlines and big shapes to survive. Card art has neither
constraint. **It should be the aspirational version of the same world** — what the garden looks like
in the player's head.

### So: ask for detail

Earlier advice here said *few big shapes, minimal detail*. That was reasoning from a constraint that
does not apply. Generated art is free, and the reveal shows a card at roughly **210px** — plenty for
richness.

Ask for **whimsy and small delightful details**. A bee circling the honey jar. Dewdrops catching the
light. Sparkles trailing a butterfly. The one thing to keep is a **clear hero subject**, so the 46px
thumbnail in the set grid still reads — but that is a composition rule, not a detail budget.

*The silhouette test in [17-market-and-positioning.md](17-market-and-positioning.md) applies to
**flower species**, which have to be told apart at a glance during play. Cards do not. Don't apply it
here.*

## How art gets in

`art` on a card is a slot:

```js
art: { icon: 'sprout', tint: '#8ce99a' }   // placeholder, drawn from icons.js
art: { src: 'cards/first-light-1.png' }    // a generated illustration
```

`cardArt()` in `ui.js` renders either. **Swapping one for the other is a data edit**, no code change.

**The web build takes no binary assets** ([09-conventions.md](09-conventions.md)) — that rule stands.
Generated art belongs to the **Unity port**, which has an asset pipeline. The prompts live here so
the two stay in step.

## The two approaches

| | Reusable motifs | Per-set art |
| --- | --- | --- |
| Images needed | **9**, cycled across all 12 sets | **108**, nine per set |
| Generation sessions | 1 | 12 |
| Aspect | 1:1, hero object on the card face | 3:4, full-bleed scene |
| Cost per season | Trivial | A real content pipeline |

Start with the nine. They prove the pipeline end to end at a twelfth of the effort.

## Running it in Grok

Grok generates conversationally and takes **no Midjourney flags**. `--ar`, `--style raw`, `--s`,
`--no` and `--sref` all do nothing; everything is said in plain language.

**Consistency comes from the thread, not a parameter:**

1. **One conversation for the whole batch.** Not a new chat per card — that is the mistake that
   ruins it.
2. Generate **card 1** and iterate conversationally — "more vibrant", "glossier", "warmer light",
   "more playful" — until it is genuinely right. This image sets the style for everything after.
3. Then generate **card 9, the Mythical, second.** If the style cannot do spectacular, find out now
   rather than after seven more images.
4. Every card after that leads with **"Same style, same lighting, same palette as before. Now:"**
5. If it drifts, **re-upload the approved card 1** and say "match this exactly."

Grok is better than Midjourney at two things here: iterating on one image in conversation, and taking
an approved image as a reference. It is worse at two: aspect ratio is a request rather than a
guarantee, and it drifts toward photorealism unless pushed.

*Grok moves quickly and this was written against what it did at the time. If the interface offers
explicit aspect-ratio or style-reference controls, prefer those over describing them.*

## Running it in Midjourney

Generate one image, then pass its job ID or URL as `--sref` on every subsequent prompt. Without it,
nine prompts produce nine unrelated images — the specific failure that makes generated card art look
cheap. Keep the style block byte-identical; change only the subject.

---

## A. The nine reusable motifs

A **hero object**, rendered richly, sitting on the card's tinted face.

**They must ascend.** Motif index maps to rarity: 1–3 are Commons, 4–5 Uncommons, 6–7 Rares, 8 the
Legendary, 9 the Mythical. Card nine should look like a prize; card one should look like a nice
start.

### Style block — Grok

Paste once at the top of the thread, then send subjects one at a time.

```
Draw bright, vibrant cartoon video-game art in the style of a modern Nintendo platformer — glossy,
colourful and joyful. Soft rounded three-dimensional forms with clean crisp edges. Richly saturated
colours: vivid grass greens, warm oranges, sunny yellows, bright sky blues. A cheerful sunlit
storybook world, playful and whimsical, with a sense of bounce and life.

Soft rim lighting, gentle highlights, a little gloss on every surface. Pack in small delightful
details — sparkles, dewdrops, tiny creatures — while keeping one clear hero subject in the centre.

Square image. Simple uncluttered background so the subject pops.

No text, letters, numbers, watermarks or signatures. No people or human faces. Not photorealistic,
not gritty, not muted.

The subject is:
```

### Style block — Midjourney

```
bright vibrant cartoon video game art, modern Nintendo platformer aesthetic, glossy and colourful,
soft rounded 3d forms with clean edges, richly saturated vivid greens oranges and sunny yellows,
cheerful sunlit storybook world, playful and whimsical, soft rim lighting, gentle highlights,
delightful small details, sparkles and dewdrops, single clear hero subject centred,
simple uncluttered background
--ar 1:1 --style raw --s 400
--no text, letters, words, numbers, watermark, signature, photorealism, gritty, muted, dark,
people, human faces, ui, frame, border
```

### The nine subjects

| # | Rarity | Subject |
| --- | --- | --- |
| 1 | Common | `a bright green seedling bursting up out of rich dark soil, two glossy round leaves, one dewdrop catching the light` |
| 2 | Common | `a cheerful white daisy with a big golden centre, petals glowing in warm sunlight, a tiny ladybird on one petal` |
| 3 | Common | `a warm terracotta plant pot sitting in sunlight, a small chip in the rim, rich soil inside and a curl of green` |
| 4 | Uncommon | `a butterfly with vivid orange and yellow wings caught mid-flutter, a trail of sparkles behind it` |
| 5 | Uncommon | `a fat jar of golden honey overflowing down its sides, a wooden dipper resting in it, one happy bee circling` |
| 6 | Rare | `a glowing paper lantern spilling warm orange light into the dusk, two soft moths drawn to the glow` |
| 7 | Rare | `a rounded teacup with steam curling up and flower petals floating on the surface, cosy golden light` |
| 8 | Legendary | `a golden four-leaf clover radiating light, jewel-bright dewdrops on its leaves, sparkles spinning around it` |
| 9 | Mythical | `an enormous radiant star-shaped bloom exploding with rays of golden light, rainbow shimmer, floating sparkles, glorious and magical` |

In Grok, send the style block once and each subject as its own message. In Midjourney, subject first,
style block after, as one prompt.

**On the background.** Neither tool does reliable transparency, so it comes baked in. That is fine —
the motif renders as a round medallion on the card face, so it becomes the medallion's own colour.
Do not spend time cutting it out.

### What to accept

- **Vibrant.** If it looks muted or tasteful, it is wrong. This world is loud and happy.
- The subject **reads at 46px** — a strong central focal point, not a busy scene.
- Nine images that look like **one family**.
- **Card nine is obviously the best one.** If the Mythical does not beat the Common at a glance,
  regenerate it.

---

## B. Per-set art — *First Light*

Nine full-bleed 3:4 scenes. The first set a player meets, so the right one to test with.

The arc is the point: **a garden waking up.** Cards 1–3 are cool blue and quiet, card 9 is full
golden daylight. Rarity and warmth climb together.

### Style block — Grok

```
Draw a bright, vibrant cartoon garden scene in the style of a modern Nintendo platformer — glossy,
colourful and joyful. Soft rounded three-dimensional forms with clean crisp edges. Richly saturated
colours: vivid grass greens, warm oranges, sunny yellows, bright sky blues. A cheerful storybook
garden world, playful and whimsical, full of life.

Beautiful atmospheric light, soft rim lighting, gentle glow. Pack in small delightful details —
sparkles, dewdrops, bees, butterflies, tiny flowers — while keeping one clear focal point.

Tall portrait image, 3:4 ratio, taller than it is wide.

No text, letters, numbers, watermarks or signatures. No people or human faces. Not photorealistic,
not gritty, not muted. No frame or border.

The scene is:
```

### Style block — Midjourney

```
bright vibrant cartoon garden scene, modern Nintendo platformer aesthetic, glossy and colourful,
soft rounded 3d forms with clean edges, richly saturated vivid greens oranges and sunny yellows,
cheerful storybook garden world, playful and whimsical, beautiful atmospheric light, soft rim
lighting, delightful small details, bees and butterflies and sparkles, clear focal point
--ar 3:4 --style raw --s 500
--no text, letters, words, numbers, watermark, signature, photorealism, gritty, muted, dark,
people, human faces, ui, frame, border
```

### The nine scenes

| # | Card | Rarity | Scene |
| --- | --- | --- | --- |
| 1 | Dawn Chorus | Common | `two plump cheerful birds singing on a wooden garden fence as the sun just begins to rise, cool blue sky warming at the horizon, little musical sparkles in the air` |
| 2 | Dewfall | Common | `enormous glistening dewdrops clinging to a vivid green leaf, each one reflecting the pale morning sky, cool early light` |
| 3 | The Early Row | Common | `a tidy row of bright green seedlings in rich dark soil, long cool shadows stretching away, the first sliver of sun cresting a hedge` |
| 4 | Frost on the Gate | Uncommon | `a wooden garden gate covered in sparkling frost crystals, cold blue dawn light, the first warm sun just catching the top edge` |
| 5 | Mist Over the Beds | Uncommon | `soft white mist rolling low across lush vegetable beds, pale golden sunbeams cutting through it, everything hushed` |
| 6 | Long Shadows | Rare | `a golden sunrise casting long dramatic shadows across a winding garden path, warm light and cool blue shade side by side` |
| 7 | The Watering Can | Rare | `a colourful metal watering can gleaming in the first sunlight, dewdrops beading on it, a tiny rainbow in the drifting spray` |
| 8 | Sunrise Bloom | Legendary | `an enormous flower unfurling toward a blazing sunrise, petals glowing translucent with the light shining through them, warm and radiant` |
| 9 | The First Warmth | Mythical | `a whole garden flooded with glorious golden morning light all at once, everything glowing, butterflies and sparkles rising, pure joy, the moment the cold finally lifts` |

### What to accept

- **The arc holds.** Laid out in order they should visibly warm from cold blue to full gold.
- **Card nine is spectacular.** It is the rarest thing in the set and should feel like it.
- Vibrant, not tasteful. Muted output is wrong output.
- No text anywhere — the UI draws the card name over the art and baked lettering will collide.

---

## Files and wiring

Export **PNG**, **1024px on the long edge**. The reveal shows a card at ~210px, so 1024 leaves room
on a high-density screen and for whatever Unity does with it later.

```
motifs/motif-1.png … motif-9.png
first-light/first-light-1.png … first-light-9.png
```

Then it is a data edit per card.

**One caveat before generating 108 of anything:** the `{ src }` path currently renders a *square*
image at the motif's size, which suits approach A. Full 3:4 card art wants to fill the card face
instead — a small CSS change. Ask for it alongside the first batch rather than after.

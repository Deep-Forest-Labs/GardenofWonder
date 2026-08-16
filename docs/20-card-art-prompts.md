# Card Art Prompts

Prompts for generating card art externally — **Grok or Midjourney** — and dropping it into the album.
Structure and slots are described in [19-card-album.md](19-card-album.md); the house style these
prompts encode is [05-art-direction.md](05-art-direction.md).

**Nothing here is required.** The album ships with procedural placeholders and works without a single
image. This exists so art can be added when it is wanted, not before.

## How art gets in

`art` on a card is a slot:

```js
art: { icon: 'sprout', tint: '#8ce99a' }   // placeholder, drawn from icons.js
art: { src: 'cards/first-light-1.png' }    // a generated illustration
```

`cardArt()` in `ui.js` renders either. **Swapping one for the other is a data edit**, no code change.

**The web build takes no binary assets** ([09-conventions.md](09-conventions.md)) — that rule stands.
Generated art belongs to the **Unity port**, which has an asset pipeline. The prompts live here so
the two stay in step; the design lab keeps its circles and icons.

## The two approaches

| | Reusable motifs | Per-set art |
| --- | --- | --- |
| Images needed | **9**, cycled across all 12 sets | **108**, nine per set |
| Generation sessions | 1 | 12 |
| Aspect | 1:1, emblem on the card face | 3:4, full-bleed |
| Feel | Clean, systematic, clearly a prototype | Much closer to Monopoly Go |
| Cost per season | Trivial | A real content pipeline |

Start with the nine. They prove the pipeline end to end at a twelfth of the effort, and if the album
turns out not to retain, nothing is wasted.

## Two rules that matter more than the prompt

**Cards render at 46px in the set grid and 96px in the reveal.** That is small. Detail is not just
wasted, it turns to mush. Push for big shapes and few of them.

**Apply the silhouette test** from [17-market-and-positioning.md](17-market-and-positioning.md):
fill the image with pure black and look at it at 64px. If you cannot tell what it is, reject it and
regenerate. This is the single best filter on output quality here.

## Running it in Grok

Grok generates conversationally and takes **no Midjourney-style flags**. `--ar`, `--style raw`,
`--s`, `--no` and `--sref` all do nothing; everything has to be said in plain language. The subject
lines below are unchanged — only the wrapper differs.

**Consistency comes from the thread, not from a parameter.** This is the whole technique:

1. Open **one** conversation and stay in it for the entire batch. Do not start a new chat per card.
2. Generate **card 1**. Iterate on it conversationally — "thicker outline", "simpler shapes",
   "less detail", "warmer cream" — until it is genuinely right. This first image sets the style for
   everything after it.
3. Then generate **card 9, the Mythical, second.** If the style cannot do "radiant and special",
   you want to know that now rather than after seven more images. If card 9 does not clearly beat
   card 1, adjust the style before continuing.
4. For every card after that, lead with **"Same style, same outlines, same palette as before. Now:"**
   followed by the subject line.
5. If it drifts, **re-upload the approved card 1** and say "match this exactly."

Two things Grok does better than Midjourney here: you can **iterate on a single image in
conversation**, and you can **attach an approved image as a reference**. Two things it does worse:
aspect ratio is a request rather than a guarantee, and it drifts toward photorealism unless the
style language pushes hard.

*Grok's capabilities move quickly and this was written against what it did at the time. If the
interface offers explicit aspect-ratio or style-reference controls, prefer those over describing
them.*

## Running it in Midjourney

Generate **one** image first. When you have one you like, pass its job ID or image URL as a **style
reference** (`--sref`) on every subsequent prompt in the batch. Without it, nine images from nine
prompts will not look like they belong together — the specific failure that makes generated card art
look cheap.

Keep the style block byte-identical between prompts. Change only the subject line.

## A. The nine reusable motifs

Each motif is a **centred emblem** on the card's tinted face — the same job the icons do now.

**They must ascend.** Motif index maps to rarity: 0–2 are Commons, 3–4 Uncommons, 5–6 Rares, 7 the
Legendary, 8 the Mythical. Card nine should feel like the prize; card one should feel like a seed
packet.

### The style block — Grok

Paste this once at the top of the thread, then send subjects one at a time.

```
Draw a chunky storybook emblem in a cosy children's picture-book style. Bold dark brown outlines,
flat saturated colours, simple bold shapes, warm paper palette, high contrast, clean vector look.
Centre the subject with generous space around it on a plain soft cream background. Square image.

Keep it simple — this is seen very small, so use a few big shapes rather than fine detail.

No text, letters, numbers, watermarks or signatures. Not photorealistic. No 3D rendering, no drop
shadows, no busy background.

The subject is:
```

### The style block — Midjourney

```
chunky storybook emblem, bold dark brown outline, flat saturated colour, simple bold shapes,
cosy children's picture book, warm paper palette, clean vector look, high contrast, centred,
generous negative space, plain soft cream background
--ar 1:1 --style raw --s 150
--no text, letters, words, numbers, watermark, signature, photorealism, 3d render, drop shadow,
busy background, clutter, tiny detail
```

### The nine subjects

| # | Rarity | Subject line to prepend |
| --- | --- | --- |
| 1 | Common | `a single small green seedling with two round leaves,` |
| 2 | Common | `one simple white daisy seen from the front,` |
| 3 | Common | `a terracotta plant pot, empty,` |
| 4 | Uncommon | `a single butterfly with rounded wings, wings open,` |
| 5 | Uncommon | `a small jar of honey with a wooden dipper,` |
| 6 | Rare | `a warm glowing paper lantern,` |
| 7 | Rare | `a rounded teacup with a curl of steam,` |
| 8 | Legendary | `a golden four-leaf clover, softly gleaming,` |
| 9 | Mythical | `a radiant star-shaped bloom with light rays behind it,` |

In Grok, send the style block once and then each subject as its own message. In Midjourney, the
subject line goes first and the style block after it, as one continuous prompt.

**On the cream background.** Neither tool does reliable transparency, so the motif will arrive with
its background baked in. That is fine — the motif renders as a round medallion on the card face, so
the cream becomes the medallion's own colour rather than clashing with the set tint. Do not spend
time trying to cut it out.

### What to accept

- Readable as a **silhouette** at 64px.
- Outline reads as **dark brown**, not black, and is thick enough to survive downscaling.
- The subject **fills most of the frame** with a little air around it — not a small object in a big
  scene.
- Nine images that look like **one family**. If one is an outlier, regenerate it in the same thread
  (Grok) or against the `--sref` (Midjourney) rather than accepting it.

---

## B. Per-set art — *First Light*

The first set a player meets, and therefore the right one to test with. Nine full-bleed 3:4 scenes.

The mood arc is the point: the set is **a garden waking up**, and the cards should get warmer and
brighter as rarity climbs. Cards 1–3 are cold, blue and quiet. Card 9 is the sun finally on your
face.

### The style block — Grok

```
Draw a cosy storybook garden illustration in a children's picture-book style. Bold dark brown
outlines, flat saturated colours, simple bold shapes, painterly but clean, warm inviting palette,
strong silhouette, uncluttered composition. Tall portrait image, 3:4 ratio, taller than it is wide.

Keep the composition simple — this is seen very small, so it needs to read at a glance.

No people or faces. No text, letters, numbers, watermarks or signatures. Not photorealistic. No 3D
rendering. No frame, border or interface elements.

The scene is:
```

### The style block — Midjourney

```
cosy storybook garden illustration, bold dark brown outlines, flat saturated colour, simple bold
shapes, children's picture book, painterly but clean, warm inviting palette, strong silhouette,
uncluttered composition, no people
--ar 3:4 --style raw --s 250
--no text, letters, words, numbers, watermark, signature, photorealism, 3d render, ui, frame,
border, faces, people, clutter
```

### The nine scenes

| # | Card | Rarity | Subject line to prepend |
| --- | --- | --- | --- |
| 1 | Dawn Chorus | Common | `two small round birds singing on a garden fence at first light, pale blue sky,` |
| 2 | Dewfall | Common | `close view of fat dew droplets on a broad green leaf, cool early morning light,` |
| 3 | The Early Row | Common | `a neat row of young seedlings in dark soil, long cool morning shadows,` |
| 4 | Frost on the Gate | Uncommon | `a wooden garden gate rimed with white frost, still blue dawn,` |
| 5 | Mist Over the Beds | Uncommon | `low white mist lying across quiet vegetable beds, soft pale light,` |
| 6 | Long Shadows | Rare | `long golden shadows stretching across a garden path at sunrise,` |
| 7 | The Watering Can | Rare | `an old metal watering can catching the first warm sunlight, dew on its handle,` |
| 8 | Sunrise Bloom | Legendary | `a single large flower opening to a golden sunrise, petals lit from behind,` |
| 9 | The First Warmth | Mythical | `warm golden sunlight flooding a whole garden at once, radiant and glowing, the moment the cold lifts,` |

### What to accept

- The **arc holds**: laid out in order, they should visibly warm from card one to card nine.
- Card nine should be **obviously the best one**. If it does not read as the prize, regenerate it.
- Each is legible at **96px** — the size it is actually seen at in the reveal.
- No text anywhere. The card name is drawn by the UI over the art; baked-in lettering will collide.

---

## Files and wiring

Export **PNG**, square-cropped for motifs and 3:4 for scenes, **512px on the long edge** — enough for
a 96px reveal on a high-density screen, and small enough that 108 of them do not become a payload
problem later.

Name them predictably, because the wiring reads the name:

```
motifs/motif-1.png … motif-9.png
first-light/first-light-1.png … first-light-9.png
```

Then it is a data edit per card. **One caveat worth knowing before generating 108 of anything:** the
`{ src }` path currently renders a *square* image at the motif's size, which suits approach A. Full
3:4 card art wants to fill the card face instead, which is a small CSS change — ask for it at the
same time as the first batch rather than after.

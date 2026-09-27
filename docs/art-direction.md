# NEON RIOT — illegal broadcast art direction

Generated with the built-in `image_gen` tool. Original PNGs are preserved under `assets/source/`; the application loads WebP encodings from `public/art/`. Encoding uses ImageMagick without cropping or changing compositions. Sprite and album isolation use SVG viewports in the application.

## Visual direction

Pirate radio meets an underground metal show: a giant speaker-skull, scavenged hardware, acid-yellow guitars, oxidized cyan light, cold concrete and warm copper embers. The interface uses a gig-poster headline, stamped venue labels, channel readouts, a visible roster and a vinyl sleeve. Existing economy rules and save schema are unchanged.

## Motion

- Slow stage camera drift (23 seconds), moving light beams (11–13 seconds), haze (17 seconds), drifting embers and subtle musician movement establish atmosphere.
- Riffs immediately animate the guitarist, emit a sound ring and activate the signal meter. Repeated inputs extend the reaction without allowing stale timeouts to end it early.
- Recruited musicians enter over 600 ms; panels enter over 250 ms. Active shows animate the crowd and accelerate lighting.
- FX ON/OFF uses the existing reduced-motion preference, while system reduced motion is always honored. No economy or input depends on animation completion.
- Stage animation pauses when it is outside the viewport or the document is hidden. Rendering uses CSS transforms/opacity, with no JavaScript frame loop.

## Final generation prompts

### Undercity stage

Runtime asset: `public/art/undercity-stage.webp`  
Source: `assets/source/undercity-stage.png`

```text
Use case: stylized-concept. Asset type: production background for NEON RIOT, a cyberpunk heavy-metal band idle game. Create an exquisitely detailed, cinematic hand-painted graphic-novel illustration, landscape 1536x1024. An illegal rehearsal stage inside an abandoned brutalist megacity subway maintenance bay, year 2089. Huge jagged chrome demonic skull built from scavenged speaker cones and tangled cables mounted on the back wall, teal neon tubes, sparse burning tangerine neon, acid-yellow electrical hazard tape, distressed band flyers with abstract illegible marks, banks of battered amplifiers flanking the sides, puddles reflecting cyan lights on the black concrete floor, steaming conduits, a window into layered rainy megacity buildings. Underground metal, rebellious, tactile, powerful. Dramatic perspective but camera nearly straight on, floor/platform occupying bottom 35 percent, EMPTY central stage suitable for overlaying five game characters. Central skull sits in upper middle, character-safe negative space lower center, speakers at far left and far right. Precise ink outlines with richly painted lighting and realistic worn materials, dark charcoal, oxidized copper, luminous cold cyan and restrained chartreuse. Beautiful art-directed videogame background, no interface, no borders, NO PEOPLE OR CHARACTERS, no legible words or logos. Not flat vector, not generic purple cyberpunk, not photography. Keep important details legible at 700px wide.
```

### Band atlas generation

Runtime asset: `assets/source/riot-lineup.png`  
Source: `assets/source/riot-lineup.png`

```text
Use case: stylized-concept. Asset type: transparent character sprite atlas for NEON RIOT cyberpunk heavy metal videogame. One landscape image, 1536x1024, GENUINELY TRANSPARENT alpha background, no backdrop, no ground plane. Exactly FIVE completely separate full-body adult musician cutouts in ONE horizontal row, each centered in one equal-width vertical fifth of the image, no overlapping cells, generous transparent gaps. All feet at same baseline near bottom 95%, all heads near 20%. Left to right: (1) male founder guitarist, black spiky long hair, black leather patched sleeveless jacket, mechanical chrome left arm, neon acid-yellow angular electric guitar, wide planted stance; (2) fierce female bassist with icy white undercut and long side hair, distressed black streetwear, dark red six-string bass; (3) muscular android drummer with orange cybernetic visor and black chrome armor seated at tiny compact industrial drum kit, cymbals and bass drum contained entirely within his own narrow cell; (4) female vocalist with vivid red asymmetric hair, long dark torn coat, handheld microphone, dramatic arm extended UPWARD not sideways; (5) masked synth musician, black hood, cyan faceplate, playing compact synthesizer on slim stand contained within own cell. Cohesive highly detailed hand-painted graphic-novel videogame concept art, realistic anatomy, rich worn metal and leather texture, sharp ink edges, cinematic cyan rim lighting from left and warm amber from right, dark dramatic clothes with clear silhouettes. Match a grimy neon subway-stage world. Full bodies and all instruments fully visible, sharp clean alpha silhouettes, no drop shadows outside characters, no cast ground shadow, no text, no interface, no framing, no extra people. EXACTLY FIVE equal-width sprite columns, NOT a group photo.
```

### Band atlas cleanup (final sprites)

Runtime asset: `public/art/riot-lineup-v2.webp`  
Source: `assets/source/riot-lineup-v2.png`

```text
Use case: stylized-concept. Asset type: transparent sprite atlas, 2560x1024 wide landscape. Edit this provided NEON RIOT band atlas into a clean production-ready sprite sheet. Preserve exactly the same five adult characters, faces, costumes, instruments, detailed hand-painted cyberpunk metal style, cyan and amber rim lighting. Remove ALL background lighting haze, gradients, colored glows between people, ground or stage, preserving genuine completely transparent alpha around isolated bodies and instruments. Arrange the five musicians left to right in FIVE EQUAL 512-pixel-WIDE COLUMNS on a 2560x1024 canvas. Reduce each entire cutout to fit strictly inside its own column with minimum 50-pixel transparent space on both left and right; no body part, instrument or cymbal may cross a column boundary. All feet and drum/synth stand bottoms align at y=950, tallest sprite starts no higher than y=120. Guitarist first, bassist second, drummer and compact kit third, vocalist fourth, masked synth musician fifth. It is okay to shrink drummer/keyboard slightly to fit. No text or labels or gridlines or floor shadows. The transparent gutters are essential for game sprite clipping. Preserve every character, do not redesign them.
```

### Transmission sleeve

Runtime asset: `public/art/concrete-cathedral.webp`  
Source: `assets/source/concrete-cathedral.png`

```text
Use case: stylized-concept. Asset type: original square album-cover artwork for NEON RIOT cyberpunk heavy metal game, no typography. Create a magnificent gothic mechanical cathedral shaped like an electric guitar rising from a dense dystopian megacity, a giant fractured black chrome skull like a sun eclipsing a luminous acidic chartreuse halo above the cathedral, tiny cyan windows and burning orange satellite trails, tangled thick speaker cables snaking from foreground toward the cathedral, black concrete, wet metallic surfaces, beautifully intricate ink engraving details with painted teal luminous mist. A bold, iconic, high-contrast metal record sleeve with a strong central silhouette that remains legible as a thumbnail. Emphasize dark oxidized turquoise, dirty bone-white chrome, chartreuse glow, tiny copper embers. Powerful graphic-novel painting, underground gig poster texture, premium original art, square 1024x1024, edge to edge full bleed, no text, no letters, no logos, no border, no real band imagery, no humans. The visual theme is 'a rebellion transmitted through sound'.
```

### Six-cover album atlas

Runtime asset: `public/art/album-covers.webp`  
Source: `assets/source/album-covers.png`

```text
Use case: stylized-concept. Asset type: a single production album-cover texture atlas for cyberpunk heavy metal game NEON RIOT. Landscape image exactly 1536x1024, divided into a PERFECT 3-column by 2-row grid of SIX DISTINCT SQUARE 512x512 album cover artworks. No gutters, no margins, no rounded edges, no overlapping panels. Each square is self-contained edge-to-edge. Cohesive premium hand-painted ink-engraved dystopian metal aesthetic, extremely detailed dark metal, blackened concrete, cyan/acid-yellow/orange highlights, powerful centered motifs visible as small thumbnails. Top-left: STATIC IN THE WIRES visual, a cybernetic raven made from cassette tape and copper wiring perched on a cracked CRT television in teal haze. Top-middle: CONCRETE CATHEDRAL visual, a Gothic brutalist cathedral shaped like an angular guitar, green toxic halo, dark chrome. Top-right: CHROME IS A DISEASE visual, closeup of a half human half robot skull splitting into reflective liquid chrome shards, burnt orange lighting. Bottom-left: NO GODS ONLY NOISE visual, a stone angel with gigantic speaker-cone wings falling amid violet lightning. Bottom-middle: KILL THE ALGORITHM visual, a mechanical heart stabbed by an electric guitar neck, tangled red circuit cables and acid green sparks. Bottom-right: EARTH IS THE OPENING ACT visual, Earth in a luminous blue orbital ring shaped like a vinyl record, enormous battered metal space antenna floating above the planet. NO TEXT WHATSOEVER, no titles, no typography, no letters, no logos. Not six variants: six unmistakably different iconic compositions, matched artwork quality. Flat two-dimensional cover art atlas, not photographed records.
```

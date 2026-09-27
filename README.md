# NEON RIOT

A single-player cyberpunk heavy metal band idler. Play riffs, assemble a band, grow a fanbase, release records, and conquer six venues before starting a new era with permanent Legend bonuses.

**[Play NEON RIOT](https://algorithmwiz.github.io/neon-riot/)**

## Run locally

Requires Node.js 22.12+ (tested on Node 24).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. It normally uses port 5173 and selects the next available port when occupied. The current development preview uses port 5174.

```sh
npm run build
npm run preview
```

The production site is in `dist/`. It requires no backend, account, API key, or runtime network request to a third party. Pushes to `main` are tested, built, and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`.

This workspace is on a drive without symlink support. `.npmrc` disables npm binary links, and scripts invoke tool entry points directly. The same scripts also work on ordinary filesystems.

## Play

- **Riffs:** click Play Riff, or focus it and use Space/Enter. Riffs earn credits and boost an active gig by 0.5% each, capped at 50%.
- **Gear:** five repeatable upgrade tracks; buy one, ten, or the maximum affordable amount. Prices grow by 16% per level (rounded up). Purchase previews show the total income/click benefit for the selected quantity.
- **Band:** recruit two alternative musicians for each of four roles. Recruitment costs once; switching recruited musicians is free between gigs. Income, fans, and recording-speed bonuses stack by role.
- **Gigs:** one at a time, unlocked by fans and total gear. Finish automatically, including offline. Rewards use the lineup at booking, plus the click boost. No automatic rebooking or failure penalty.
- **Albums:** one recording at a time, concurrent with gigs. Each release can be recorded once per era and adds ongoing royalties. Recording speed and fan rewards are fixed at project start.
- **Music:** releasing an album unlocks its song in Pirate Radio beneath the stage and adds Listen to Single to that album card. Native audio controls support pause, seeking, volume, and mute. Playback continues across game tabs and starts only when requested; the sound-effects toggle is separate.
- **Legend:** complete an orbital headline show to prestige. Earn `floor(sqrt(fans / 10000))` Legend (minimum one), each granting a permanent +10% income bonus. The confirmation screen explains all resets and preserved progress.

The first upgrade costs 15 credits. A simulated player making two or three five-minute visits per day reaches first prestige in approximately 4.5 or 3.7 days, respectively. This simulation includes two riff clicks per second during visits and regular purchases. Actual pacing depends on choices and activity.

## Saves and offline time

State lives in `localStorage` under `neon-riot-save-v1`. Autosave runs every ten seconds, after actions, and when the page hides. Save exports/imports are JSON and include a schema version. Import requires confirmation before replacing the current game; invalid or unsupported saves are rejected.

Production uses elapsed time, not frame counts. An absence awards at most 24 hours of passive production. Existing shows and recordings finish once when their end timestamps pass, even after a longer absence; they never restart automatically. Newly released album royalties accrue only after completion and within the 24-hour earning window. Backward clock movement cannot duplicate income.

On corrupted saved data, automatic writing pauses so the original data remains intact. Storage failure leaves the game playable in memory and displays an export reminder. Export backups before clearing browser data or switching devices. Saves are local to the browser and origin (including the port). Use one game tab at a time; cloud sync is not included.

## Project structure

- `src/engine.ts`: deterministic state transitions, purchasing, time advancement, prestige, and validated serialization.
- `src/content.ts`: typed musicians, equipment, venues, albums, and achievements; edit this to tune balance.
- `src/App.tsx`: gameplay interface, local persistence, accessible dialogs, feedback, and settings.
- `src/PerformanceStage.tsx`: generated artwork, individual musician sprites, roster portraits, venue atmosphere, and visibility-aware stage animation.
- `src/audio.ts`: optional Web Audio synthesized riffs and interface notes. Sound starts disabled.
- `src/styles.css` and `src/riot.css`: industrial neon design, concert-poster typography, responsive layouts, local fonts, motion, and reduced-motion support.

No hidden gameplay debug controls are shipped. Tests supply isolated fixture saves to exercise late-game behavior.

## Verification

```sh
npm test
npm run simulate
node node_modules/@playwright/test/cli.js install chromium
npm run test:browser
npm run build
```

The browser suite uses port 5174 and starts Vite automatically if needed. It covers opening purchases, keyboard activation, sound/settings, roster locks, concurrent activities, offline completion, persistence, save download/import/reset, corrupt/unavailable storage, prestige, six venue renderings, and layouts at 390, 768, and 1440 pixels. Screenshots are written to `test-results/`.

Balance tests model two or three daily visits. Engine tests cover bulk and maximum purchasing, bonuses, clock reversal, offline limits, time segmentation around album completion, repeated rewards, and malformed saves.

## Asset provenance

Stage backgrounds, band sprites, transmission sleeve art, and six album covers were generated with the built-in image generation tool for this project. Final runtime assets are in `public/art/`; original PNGs are preserved in `assets/source/`. See [the art direction and complete generation prompts](docs/art-direction.md). Runtime images are compressed WebP encodings; SVG viewports select individual sprites and album covers without modifying the original artwork. The logo, favicon, stage light layers, haze, sound rings and interface graphics use SVG/CSS.

Five user-provided recordings are bundled in `public/audio/`: Static in the Wires, Concrete Cathedral, Chrome Is a Disease, No Gods / Only Noise, and Kill the Algorithm. Earth Is the Opening Act has no recording yet. Optional riff and interface effects are synthesized locally. Icons come from Lucide (ISC). Barlow, Barlow Condensed, and IBM Plex Mono are self-hosted through Fontsource; their open font license files are included in their dependency packages. All band/character and album names are fictional.

The stage uses CSS animation for breathing musicians, swaying lights, haze, embers, sound rings and live-show crowds. Use FX ON/OFF beside the signal meter or Reduce motion in Settings to pause the effects. System reduced motion is also respected; offscreen/background stage effects pause automatically. Fast repeated riffs extend the performance reaction, while income and activity timers remain independent of motion.

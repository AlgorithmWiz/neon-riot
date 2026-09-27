# Adaptive band performance — production brief

Status: generated through the user's Suno account on 27 September 2026 and integrated locally.

## Generated sources

- Standalone 4:30 guitar: https://suno.com/song/d0057cf8-708c-46a5-80bb-8369909a8156 — exported to `assets/source/audio/guitar-engine.mp3`.
- Full-band cover: https://suno.com/song/78921b56-3fd2-4fac-af6f-a83eec543e19 — instrument stems aligned at 269.64 seconds, but the nominal vocal stem had negligible energy and was rejected.
- Vocal-edit attempt: https://suno.com/song/4da599d4-6cfc-4b36-b267-ed16d27f791a — 269.04-second instrumental stems; no usable vocal stem returned, so not selected for the final game mix.
- Selected full song with original lyrics: https://suno.com/song/98b70e86-d092-4fbb-83e3-ae70b2c66265.

All generation and export actions used the existing account. No subscription was purchased or upgraded.

## Guitar generation prompt

Extended instrumental solo electric guitar performance, 4–6 minutes. Heavy down-tuned metal guitar in E minor with thick distortion, tight palm-muted chugs, aggressive power chords, and a steady driving groove at 125 BPM in 4/4. Begin immediately with a strong riff. Develop variations, occasional sustained notes, and short melodic fills while keeping consistent volume and energy. One guitar only, dry close-miked studio sound. No vocals, drums, bass guitar, synths, long pauses, intro, or fade-out. Finish on a riff that can transition naturally back to the opening for looping. Gritty industrial cyberpunk mood for an interactive guitar-clicking game.

## Arrangement and integration

Create a matching full-band arrangement using the chosen guitar performance as the reference. Keep its guitar part, tempo, key, structure, and duration. Add tight metal drums, electric bass following the riff, restrained wordless vocal accents, and dark industrial synth textures. Obtain aligned instrument stems from the same arrangement; independently generated songs cannot be assumed to align.

Map stems to the active lineup, rather than the total number of recruited characters:

| Active role | Added layer |
| --- | --- |
| Guitar (always present) | Guitar performance |
| Hex or Crash — drums | Drums |
| Volt or Echo — bass | Bass |
| Nyx or Razor — vocals | Vocal accents |
| Zero or Glitch — synth | Synth |

Keep all layers on a shared playback clock. Recruiting or changing an active member should change that role's gain without restarting the other instruments. Support any recruitment order. Preserve rapid-click sustain, the release fade, sound-effect mute, and the separate persistent background-music setting. Balance the full mix to avoid a volume jump as players recruit members.

Before integration, verify the actual generated duration, instrument separation, aligned starts and ends, loop boundary, and output levels. Record the selected Suno song links and exported filenames here after generation. Do not purchase a plan or upgrade to unlock exports without user authorization.

## Verification after audio is available

Exercise solo guitar, each individual role, the full band, role swaps, rapid clicks, inactivity fade, restarting, muting, reload, and prestige. Confirm that absent roles remain silent and adding a member does not restart the performance.


## Final game assets

`assets/source/audio/raise-the-noise-stems.zip` preserves the original selected export. `assets/source/audio/guitar-engine.mp3` preserves the standalone guitar generation, and `riff-short.mp3` preserves the earlier click recording.

The game uses the selected full song's guitar stem so every layer remains aligned. The exported stems are 269.088 seconds long. Preparation removes a shared 3.215-second silent guitar opening, leaving 265.873 seconds with an immediate guitar attack. Browser regression coverage checks real decoded guitar energy in the first 100 ms. `scripts/prepare-band-audio.py` combines drums + percussion, lead + backing vocals, and synth + keyboard into their corresponding roles; guitar and bass remain separate. All five receive identical timing, a 5 ms opening ramp, a 50 ms end ramp, and the same gain multiplier (0.55798886). Exports are mono 32 kHz MP3 at 96 kbps. The common gain leaves headroom for any subset of instruments; runtime master gain is 0.45. Numerical RMS and peak checks are saved in `public/audio/band/mix-report.json`. These checks confirm signal and alignment, not a subjective listening review. Endpoint fades soften the wrap; they do not establish a musically seamless loop.

`src/BandAudio.ts` decodes stems once, schedules all five on the same AudioContext clock, and fades role gains as the active lineup changes. Rapid clicks extend the release envelope without retriggering stems. Inactivity, sound mute, and hiding the page stop the performance. Delayed downloads cannot start after a mute or after clicking has stopped; failed downloads can retry on the next request. Background music remains independently controlled and its choice persists.

## Completed verification

- Production build and TypeScript checks pass.
- 35 unit tests pass, including aligned starts, role changes without restart, inactivity release, muted/expired asynchronous loads, and retry after a failed asset fetch.
- All 25 browser tests pass, including decoding all five real assets, rapid-click continuity, recruiting all four roles, synchronized starts, immediate sound mute, and background-mute persistence after reload.
- The selected final source includes original sung lyrics, rather than the rejected wordless-vocal approach above.

Riff bursts tolerate a one-second gap before the 150 ms fade. Stage clicks and Enter/Space use the same riff action. Background music pauses throughout a burst and resumes after release, respecting its mute preference and album playback.

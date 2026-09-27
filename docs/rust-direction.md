# Rust & feedback

The game interface is the band's battered rehearsal-room wall: a stage framed in oxidized metal, a paper booking ledger, and a physical amplifier console. Preserve Neon Riot's fiction, progression, saves, audio and controls.

Palette: soot #171310, bone #dfcfaa, rust #ad482f, amber #e8ac58. Condensed block headlines, typewriter labels, dashed receipt rules, offset poster composition and irregular paper edges. The stage is the focal point; management is a contrasting warm paper surface. On mobile the ledger follows the stage without horizontal scrolling.

Motion: swinging stage lamps, warm moving beams and dust; riff-triggered speaker vibration and meter movement; paper tab arrival and poster hover. All effects stop with the existing FX switch and OS reduced-motion preference. Stage loops pause offscreen.

Acceptance: working riff/purchase/recruit/gig/album/save flows; legible controls across every tab; no overflow at 390/768/1440px; generated assets stored locally with provenance; desktop/mobile screenshot review; build and existing tests pass.

## Cyberpunk refinement

The user clarified that the world must remain unmistakably futuristic. Retain the rust, tape, bootleg poster and analog amplifier, but pair them with cyan conduits, magenta signs, megacity skylines and an off-grid tour terminal. The active backdrop is now `cyber-foundry.webp`. `cyber.css` applies this final direction over the material treatments.

Character animation uses SVG cutout joints over the existing transparent artwork. Per-role head and hand loops animate strumming, plucking, alternating sticks, key presses and vocal phrasing. The lower body, drum shells and keyboard remain anchored, while guitarist, bassist and singer add restrained weight shifts. Idle, live and riff states choose loop pace independently of gameplay timers. Portraits remain static; all joints obey FX pause, OS reduced motion, page visibility and stage intersection. This is procedural cutout animation, not newly generated frame-by-frame footage.

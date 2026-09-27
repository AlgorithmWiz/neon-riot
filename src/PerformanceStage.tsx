import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { MUSICIANS, type Role } from "./content";
import { gearCount, venueIndex, type State } from "./engine";
const ATLAS = `${import.meta.env.BASE_URL}art/riot-lineup-v2.webp`;
const regions = {
  guitar: [0, 420],
  bass: [425, 350],
  drums: [775, 405],
  vocals: [1180, 400],
  synth: [1600, 383],
} as const;
type Instrument = keyof typeof regions;
export function MusicianArt({
  instrument = "guitar",
  portrait = false,
  variant = 0,
}: {
  instrument?: Instrument;
  portrait?: boolean;
  variant?: number;
}) {
  const [x, w] = regions[instrument];
  // SVG viewports isolate the original transparent atlas without resampling its pixels.
  const portraitBoxes: Record<Instrument, string> = {
    guitar: "125 110 165 165",
    bass: "475 110 180 180",
    drums: "900 190 170 170",
    vocals: "1290 120 180 180",
    synth: "1700 125 180 180",
  };
  const viewBox = portrait ? portraitBoxes[instrument] : `${x} 0 ${w} 793`;
  const [left, top, width, height] = viewBox.split(" ").map(Number);
  const clip = useId();
  return (
    <svg
      className={`musician-art ${portrait ? "portrait-art" : ""} ${variant ? "alternate-art" : ""}`}
      viewBox={viewBox}
      preserveAspectRatio={portrait ? "xMidYMid slice" : "xMidYMax meet"}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clip}>
          <rect x={left} y={top} width={width} height={height} />
        </clipPath>
      </defs>
      <image
        href={ATLAS}
        width="1983"
        height="793"
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}
const scenery = [
  "REHEARSAL // SECTOR 07",
  "THE RUST PIT // AFTER HOURS",
  "DEAD SIGNAL // NO REQUESTS",
  "FOUNDRY 404 // BREAK THE MACHINE",
  "THE MONOLITH // SOLD OUT",
  "ORBITAL UPLINK // PLANETWIDE",
];
export default function PerformanceStage({
  state,
  playing,
}: {
  state: State;
  playing: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null),
    [running, setRunning] = useState(true);
  const venue = state.gig?.index ?? venueIndex(state),
    band = Object.keys(state.lineup).length;
  useEffect(() => {
    let visible = true;
    const sync = () => setRunning(visible && !document.hidden);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              visible = entries[0].isIntersecting;
              sync();
            },
            { threshold: 0.05 },
          );
    if (stageRef.current) observer?.observe(stageRef.current);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <div
      ref={stageRef}
      className={`performance-stage venue-scene-${venue} ${playing ? "is-playing" : ""} ${state.gig ? "is-live" : ""} ${!running ? "motion-paused" : ""} ${band === 0 ? "solo" : ""}`}
      role="img"
      aria-label={`Your band performing in venue ${venue + 1}, with ${band} recruited musicians`}
    >
      <img
        className="scene-backdrop"
        src={`${import.meta.env.BASE_URL}art/undercity-stage.webp`}
        alt=""
        fetchPriority="high"
        width="1536"
        height="1024"
      />
      <div className="scene-color" />
      <div className="scene-vignette" />
      {venue > 0 && (
        <div className="venue-neon-sign">
          <span>{scenery[venue]}</span>
        </div>
      )}
      {venue === 5 && <div className="orbital-planet" />}
      {venue === 3 && <div className="foundry-hazard" />}
      <div className="light-beam beam-left" />
      <div className="light-beam beam-right" />
      <div className="stage-haze haze-back" />
      {state.lineup.drums && (
        <div className="performer performer-drums" key={state.lineup.drums}>
          <div className="performer-motion">
            <MusicianArt instrument="drums" />
          </div>
        </div>
      )}
      {state.lineup.bass && (
        <div className="performer performer-bass" key={state.lineup.bass}>
          <div className="performer-motion">
            <MusicianArt
              instrument="bass"
              variant={state.lineup.bass === "volt" ? 1 : 0}
            />
          </div>
        </div>
      )}
      <div className="performer performer-guitar">
        <div className="performer-motion">
          <MusicianArt />
        </div>
      </div>
      {state.lineup.synth && (
        <div className="performer performer-synth" key={state.lineup.synth}>
          <div className="performer-motion">
            <MusicianArt instrument="synth" />
          </div>
        </div>
      )}
      {state.lineup.vocals && (
        <div className="performer performer-vocals" key={state.lineup.vocals}>
          <div className="performer-motion">
            <MusicianArt
              instrument="vocals"
              variant={state.lineup.vocals === "razor" ? 1 : 0}
            />
          </div>
        </div>
      )}
      <div className="stage-haze haze-front" />
      <div className="stage-embers">
        {Array.from({ length: 10 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--x": `${(i * 37 + 12) % 100}%`,
                "--delay": `${-i * 1.7}s`,
                "--drift": `${i % 2 ? 35 : -30}px`,
                "--duration": `${7 + (i % 4)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="stage-ripple" key={`pulse-${state.riffs}`} />
      {state.gig && (
        <div className="crowd-silhouettes">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  "--crowd-delay": `${-i * 0.18}s`,
                  "--crowd-height": `${21 + (i % 4) * 5}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="scene-scanlines" />
      <div className="stage-tech-readout" aria-hidden="true">
        <span>AMP / {String(gearCount(state)).padStart(3, "0")}</span>
        <span>CH. {String(venue + 1).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
export function RosterStrip({ state }: { state: State }) {
  return (
    <div className="roster-strip">
      <div className="roster-slot filled">
        <MusicianArt portrait />
        <span>YOU</span>
      </div>
      {(["drums", "bass", "vocals", "synth"] as Role[]).map((role) => {
        const musician = MUSICIANS.find((m) => m.id === state.lineup[role]);
        return (
          <div
            key={role}
            className={`roster-slot ${musician ? "filled" : "empty"}`}
          >
            <MusicianArt instrument={role} portrait />
            <span>{musician ? musician.name : role}</span>
            {!musician && <b>+</b>}
          </div>
        );
      })}
      <span className="roster-caption">
        {Object.keys(state.lineup).length + 1}/5
        <br />
        <b>
          VOICES OF
          <br />
          THE RIOT
        </b>
      </span>
    </div>
  );
}

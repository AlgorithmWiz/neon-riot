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
type RigPart = { name: string; points: string; pivot: string };
// Overlapping cutout joints keep necks/wrists covered during restrained motion.
// Instrument bodies, keyboards and drum shells remain planted in the base layer.
const rigs: Record<Instrument, RigPart[]> = {
  guitar: [
    {
      name: "head",
      points: "105,90 302,90 295,235 256,270 178,258 115,230",
      pivot: "213px 251px",
    },
    {
      name: "hand",
      points: "118,363 164,378 212,404 206,440 169,441 132,409",
      pivot: "142px 388px",
    },
  ],
  bass: [
    {
      name: "head",
      points: "489,103 631,103 640,224 597,263 521,243 480,211",
      pivot: "560px 241px",
    },
    {
      name: "hand",
      points: "462,394 491,411 508,437 489,465 453,451 444,430",
      pivot: "476px 411px",
    },
  ],
  drums: [
    {
      name: "head",
      points: "925,189 1026,190 1048,254 1014,307 947,290 921,246",
      pivot: "980px 284px",
    },
    {
      name: "hand",
      points: "875,207 911,204 881,302 879,352 839,370 819,344 846,303",
      pivot: "848px 345px",
    },
    {
      name: "hand offhand",
      points: "1060,197 1090,198 1109,270 1137,296 1136,337 1103,348 1078,303",
      pivot: "1110px 328px",
    },
  ],
  vocals: [
    {
      name: "head",
      points: "341,22 650,22 687,197 639,287 515,326 364,248 335,155",
      pivot: "512px 286px",
    },
  ],
  synth: [
    {
      name: "head",
      points: "1711,114 1869,112 1876,217 1830,293 1751,273 1702,216",
      pivot: "1789px 266px",
    },
    {
      name: "hand",
      points: "1680,320 1730,328 1773,359 1778,390 1727,390 1692,363",
      pivot: "1710px 350px",
    },
    {
      name: "hand offhand",
      points: "1822,334 1870,336 1907,360 1902,389 1856,388 1827,367",
      pivot: "1848px 354px",
    },
  ],
};
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
  const isVocalist = instrument === "vocals";
  const viewBox = isVocalist
    ? portrait
      ? "300 60 420 420"
      : "0 0 1024 1536"
    : portrait
      ? portraitBoxes[instrument]
      : `${x} 0 ${w} 793`;
  const [left, top, width, height] = viewBox.split(" ").map(Number);
  const clip = useId();
  const source = isVocalist
    ? `${import.meta.env.BASE_URL}art/male-vocalist.webp`
    : ATLAS;
  const artWidth = isVocalist ? 1024 : 1983;
  const artHeight = isVocalist ? 1536 : 793;
  const parts = portrait ? [] : rigs[instrument];
  return (
    <svg
      className={`musician-art rig-${instrument} ${portrait ? "portrait-art" : ""} ${variant ? "alternate-art" : ""}`}
      viewBox={viewBox}
      preserveAspectRatio={portrait ? "xMidYMid slice" : "xMidYMax meet"}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clip}>
          <rect x={left} y={top} width={width} height={height} />
        </clipPath>
        {parts.length > 0 && (
          <mask
            id={`${clip}-body`}
            maskUnits="userSpaceOnUse"
            x={left}
            y={top}
            width={width}
            height={height}
          >
            <rect x={left} y={top} width={width} height={height} fill="white" />
            {parts.map((part, index) => (
              <polygon
                key={index}
                points={part.points}
                fill="black"
                stroke="white"
                strokeWidth="8"
                strokeLinejoin="round"
              />
            ))}
          </mask>
        )}
        {parts.map((part, index) => (
          <clipPath key={index} id={`${clip}-part-${index}`}>
            <polygon points={part.points} />
          </clipPath>
        ))}
      </defs>
      <g clipPath={`url(#${clip})`}>
        <image
          href={source}
          width={artWidth}
          height={artHeight}
          mask={parts.length ? `url(#${clip}-body)` : undefined}
        />
        {parts.map((part, index) => (
          <g
            key={index}
            className={`rig-part rig-${part.name.replaceAll(" ", " rig-")}`}
            style={{ transformOrigin: part.pivot }}
          >
            <image
              href={source}
              width={artWidth}
              height={artHeight}
              clipPath={`url(#${clip}-part-${index})`}
            />
          </g>
        ))}
      </g>
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
        src={`${import.meta.env.BASE_URL}art/cyber-foundry.webp`}
        alt=""
        fetchPriority="high"
        width="1536"
        height="1024"
      />
      <div className="scene-color" />
      <div className="hanging-lamp lamp-one" aria-hidden="true">
        <i />
      </div>
      <div className="hanging-lamp lamp-two" aria-hidden="true">
        <i />
      </div>
      <div className="scene-vignette" />
      <div className="venue-neon-sign">
        <span>{scenery[venue]}</span>
      </div>
      <div className="stage-circuit circuit-left" aria-hidden="true" />
      <div className="stage-circuit circuit-right" aria-hidden="true" />
      <div className="holo-grid" aria-hidden="true" />
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

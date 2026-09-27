import type { State } from "./engine";
import { gearCount, venueIndex } from "./engine";
export function Portrait({
  color = "#d5f34a",
  variant = 0,
}: {
  color?: string;
  variant?: number;
}) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <rect width="80" height="80" fill="#22292a" />
      <path
        d="M0 68 80 12M0 30 80 76"
        stroke={color}
        opacity=".12"
        strokeWidth="15"
      />
      <path d="M10 80 17 60 30 54 50 54 64 62 72 80" fill="#101617" />
      <path d="m29 50 2 12 10 7 10-11-3-14" fill="#b48b77" />
      <path d="m25 24 6-11 21 4 7 12-6 22-13 8-13-11z" fill="#c49d87" />
      <path
        d={
          variant % 2 === 0
            ? "M23 39 17 26 26 12 42 7 59 19 58 32 45 22 32 32 32 47 26 48Z"
            : "M22 34 23 15 43 7 59 24 61 55 50 48 49 23 36 32Z"
        }
        fill={color}
      />
      <path d="M32 36h10m4-1h9" stroke="#171e20" strokeWidth="4" />
      <path d="m33 48 13 1" stroke="#624e4b" strokeWidth="2" />
      <path d="m21 61 15 19m23-18L48 80" stroke="#475658" strokeWidth="4" />
      <path d="M16 65h10m-8 5h9" stroke={color} strokeWidth="2" />
    </svg>
  );
}
function Player({
  x,
  y,
  scale = 1,
  color = "#dfc56d",
  kind = "guitar",
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
  kind?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="95" rx="48" ry="9" fill="#05090b" opacity=".6" />
      <path
        d="m-13 34-7 34-12 23 17 3L2 62 11 89l17 1-8-34-8-27"
        fill="#111d22"
        stroke="#35494b"
        strokeWidth="2"
      />
      <path
        d="m-31 87-6 9 23 1 2-9m23-2 2 11 23-1-8-8"
        fill="#070c10"
        stroke="#536569"
      />
      <path
        d="m-16-22-17 10 7 33 9 23 36-2 6-33-6-26-18-7"
        fill="#182328"
        stroke="#4c5757"
        strokeWidth="2"
      />
      <path
        d="m-17-20 15 37L11-21M-10-4 2 4l9-9"
        fill="#11191d"
        stroke="#849591"
        strokeWidth="2"
      />
      <path
        d="m-29-14-11 35 17 18 7-9-12-14 13-27m34-7 13 30 24 2 2 8-35 2-14-23"
        fill="#aa8f7c"
        stroke="#19292d"
        strokeWidth="4"
      />
      <path d="m-8-34 1 14 10 9 9-15-3-12" fill="#b39883" />
      <path d="m-13-62 20-5 14 15-5 22-13 8-16-14z" fill="#bb9e86" />
      <path
        d="m-17-37-7-17 9-19 23-4 18 19-10 3-12-11-9 19-3 29-10-3z"
        fill="#171e21"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M0-44h15" stroke="#54d7ca" strokeWidth="4" />
      <path d="m4-32 8 1" stroke="#705c51" strokeWidth="2" />
      <path d="m-29-6 10-5m-13 13 10-5" stroke={color} strokeWidth="3" />
      {kind === "guitar" || kind === "bass" ? (
        <g transform="rotate(-24 3 22)">
          <path
            d="m-13 4-14 21-1 20 18-6 12 9 12-9-8-22-8-13-3 12z"
            fill={color}
            stroke="#0b171d"
            strokeWidth="3"
          />
          <path
            d="M0 20 65 17l8-6 8 2-8 12-10-1-62 4"
            fill="#8b8171"
            stroke="#15282a"
            strokeWidth="2"
          />
          <path d="M-9 28 70 20" stroke="#dde3c1" />
          <path d="M-11 22v14m8-14v11" stroke="#172323" strokeWidth="4" />
        </g>
      ) : kind === "vocals" ? (
        <g stroke="#bbc7c1" strokeWidth="3">
          <path d="m34 4 4 84m-15 3h28" />
          <rect x="27" y="-2" width="20" height="8" rx="4" fill="#18242a" />
        </g>
      ) : kind === "synth" ? (
        <g>
          <path
            d="m-26 29 18 61m40-61-17 61"
            stroke="#627f82"
            strokeWidth="4"
          />
          <path d="m-40 16 85 0 10 22-94 0z" fill="#253639" stroke="#68c6bf" />
          <path d="m-29 25 71 0" stroke="#d9ddd0" strokeWidth="8" />
        </g>
      ) : (
        <path d="m-30 19-19-22m88 22 10-30" stroke="#c4b996" strokeWidth="3" />
      )}
    </g>
  );
}
export default function Stage({
  state,
  playing,
}: {
  state: State;
  playing: boolean;
}) {
  const venue = venueIndex(state),
    advanced = venue >= 2,
    count = gearCount(state);
  return (
    <svg
      className={`stage-art ${playing ? "is-playing" : ""}`}
      viewBox="0 0 800 450"
      role="img"
      aria-label={`Your band performing in venue ${venue + 1}, with ${Object.keys(state.lineup).length} recruited musicians`}
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor="#172b30" />
          <stop offset="1" stopColor="#0d171c" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#223032" />
          <stop offset="1" stopColor="#0a1116" />
        </linearGradient>
        <linearGradient id="beam" x2="0" y2="1">
          <stop stopColor="#96e7ba" stopOpacity=".19" />
          <stop offset="1" stopColor="#64bea9" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="haze">
          <stop
            stopColor={venue >= 5 ? "#746ba5" : "#659581"}
            stopOpacity=".2"
          />
          <stop offset="1" stopColor="#213a39" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="brick"
          width="100"
          height="46"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0h100M0 23h100M50 0v23M10 23v23"
            fill="none"
            stroke="#527174"
            strokeOpacity=".15"
          />
        </pattern>
        <pattern
          id="speaker"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="#667675" opacity=".25" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="800" height="450" fill="#0a131a" />
      <rect x="82" y="0" width="633" height="342" fill="url(#wall)" />
      {venue >= 5 ? (
        <g fill="#a4cfd4">
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 137) % 800}
              cy={(i * 43) % 310}
              r={i % 3 === 0 ? 1.5 : 0.6}
            />
          ))}
          <circle cx="550" cy="130" r="100" fill="#244857" />
          <path
            d="M453 110q100-90 192 25"
            stroke="#7fafad"
            strokeWidth="5"
            fill="none"
          />
        </g>
      ) : (
        <rect x="82" y="10" width="633" height="330" fill="url(#brick)" />
      )}
      <path d="M0 0 82 35v307L0 413z" fill="#17252b" />
      <path d="M800 0 715 35v307l85 71z" fill="#0c1b23" />
      <path d="M0 410 82 333h633l85 77v40H0" fill="url(#floor)" />
      <path
        d="m82 333-82 77m199-77L139 450m178-117-27 117m171-117 25 117m115-117 83 117m79-117 85 77M0 413h800M45 367h715"
        stroke="#4a5e5c"
        opacity=".26"
      />
      <path d="M93 0v326m605-326v331" stroke="#0a141b" strokeWidth="15" />
      <path d="M102 0v323m588-323v331" stroke="#597071" strokeWidth="2" />
      <g opacity=".9">
        <path d="M0 44h800M0 61h800" stroke="#070f16" strokeWidth="11" />
        <path d="M5 48h784" stroke="#587274" strokeWidth="2" />
        <path d="M116 0v65m565-65v60" stroke="#9ba098" strokeWidth="2" />
        <rect x="105" y="65" width="91" height="7" fill="#91d5b2" />
        <rect x="547" y="62" width="133" height="6" fill="#79b9b6" />
        <rect
          x="105"
          y="65"
          width="91"
          height="7"
          fill="#a3f2b8"
          filter="url(#glow)"
        />
        <path
          d="m105 73-65 256h235L196 73m351-4-62 268h282L680 68"
          fill="url(#beam)"
        />
      </g>
      <g transform="translate(505 101)" opacity={venue < 3 ? 1 : 0}>
        <rect
          x="0"
          y="0"
          width="143"
          height="128"
          fill="#080f19"
          stroke="#51686a"
          strokeWidth="6"
        />
        <rect x="8" y="8" width="127" height="112" fill="#1c353e" />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <rect
              x={10 + i * 19}
              y={20 + ((i * 19) % 54)}
              width="17"
              height="100"
              fill={i % 2 ? "#102331" : "#152b36"}
            />
            {Array.from({ length: 7 }, (_, j) => (
              <rect
                key={j}
                x={13 + i * 19}
                y={35 + j * 12}
                width="4"
                height="3"
                fill={(j + i) % 3 ? "#58b6b0" : "#eb9d6e"}
                opacity={(j + i) % 4 ? 0.6 : 0.1}
              />
            ))}
          </g>
        ))}
        <path d="M70 3v123M4 62h134" stroke="#596f6d" strokeWidth="4" />
        <path
          d="m20 5-12 30m91 13-25 68"
          stroke="#95b0a8"
          strokeWidth="2"
          opacity=".2"
        />
      </g>
      <g opacity={venue < 2 ? 0.85 : 0}>
        <path
          d="M123 102h97v96h-97z"
          fill="#28393a"
          transform="rotate(-7 170 150)"
        />
        <path d="m136 113 69-9-9 78-53 4z" fill="#939772" />
        <text
          x="145"
          y="137"
          fontFamily="monospace"
          fontWeight="900"
          fontSize="19"
          fill="#142b2c"
          transform="rotate(-7 170 140)"
        >
          NO GODS
        </text>
        <path d="m160 150 29-11-13 24 20-3-34 22 11-22-15 4" fill="#213133" />
        <path
          d="M172 218h69v65h-69z"
          fill="#526e6a"
          transform="rotate(5 190 240)"
        />
        <text
          x="177"
          y="240"
          fontFamily="monospace"
          fontSize="13"
          fontWeight="bold"
          fill="#0e272b"
        >
          MAKE
        </text>
        <text
          x="177"
          y="257"
          fontFamily="monospace"
          fontSize="15"
          fontWeight="bold"
          fill="#0e272b"
        >
          NOISE.
        </text>
      </g>
      <g transform="translate(365 157) rotate(-5)" opacity={venue < 4 ? 1 : 0}>
        <circle
          r="64"
          fill="none"
          stroke="#779784"
          strokeWidth="2"
          opacity=".23"
        />
        <circle
          r="57"
          fill="none"
          stroke="#779784"
          strokeWidth="5"
          opacity=".08"
        />
        <path d="m8-52-42 62h29l-6 47 49-74H7z" fill="#95a875" opacity=".38" />
        <path
          d="m-68 42 9-6m115-88 14-4m-99 115-9 20"
          stroke="#95a875"
          strokeWidth="3"
        />
      </g>
      {venue === 1 && (
        <g>
          <rect
            x="498"
            y="99"
            width="163"
            height="153"
            fill="#1e1c1c"
            stroke="#715e46"
            strokeWidth="4"
          />
          {[0, 1].map((row) => (
            <g key={row}>
              <path
                d={`M500 ${163 + row * 75}h159`}
                stroke="#9b7951"
                strokeWidth="6"
              />
              {Array.from({ length: 7 }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${510 + i * 21} ${111 + row * 75})`}
                >
                  <path
                    d="M4 0h6v12l4 5v34H0V17l4-5z"
                    fill={i % 2 ? "#436962" : "#96774a"}
                  />
                  <path d="M1 28h12v10H1z" fill="#b5ae7d" opacity=".5" />
                </g>
              ))}
            </g>
          ))}
          <rect
            x="260"
            y="80"
            width="195"
            height="38"
            fill="#241a19"
            stroke="#a66f49"
          />
          <text
            x="357"
            y="106"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
            fontSize="22"
            fill="#e6ad78"
          >
            THE RUST PIT
          </text>
          <path d="M270 112h175" stroke="#df975d" filter="url(#glow)" />
        </g>
      )}
      {venue === 2 && (
        <g>
          <path
            d="M127 291V89h549v202M135 89l29 25 28-25 29 25 28-25 29 25 28-25 29 25 28-25 29 25 28-25 29 25 28-25 29 25 28-25 29 25 28-25"
            fill="none"
            stroke="#547876"
            strokeWidth="3"
          />
          <rect
            x="239"
            y="120"
            width="268"
            height="68"
            fill="#142929"
            stroke="#6da7a3"
          />
          <text
            x="373"
            y="162"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="28"
            letterSpacing="3"
            fill="#8ce8d2"
          >
            DEAD SIGNAL
          </text>
          <path d="M247 181h253" stroke="#a577b5" strokeWidth="3" />
          <path
            d="m143 115 190 260m319-260L437 365"
            stroke="#76ddd0"
            opacity=".15"
            strokeWidth="28"
          />
        </g>
      )}
      {venue === 3 && (
        <g>
          <path
            d="M139 325V132q0-27 27-27h44V65m364 248V152q0-35 35-35h48V75"
            fill="none"
            stroke="#415855"
            strokeWidth="25"
          />
          <path
            d="M130 324V132q0-35 35-35h41m359 216V152q0-43 43-43h43"
            fill="none"
            stroke="#7f8780"
            strokeWidth="3"
          />
          <rect
            x="258"
            y="94"
            width="240"
            height="75"
            fill="#2f3127"
            stroke="#8a8f66"
            strokeWidth="2"
          />
          <text
            x="378"
            y="139"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
            fontSize="30"
            fill="#c5c078"
          >
            FOUNDRY 404
          </text>
          <path
            d="M260 164h235"
            stroke="#b9a34c"
            strokeWidth="7"
            strokeDasharray="20 13"
          />
          <path
            d="M520 283q45-70 24-106M211 235q-48-73-5-98"
            stroke="#c4bfa1"
            strokeWidth="20"
            opacity=".07"
            fill="none"
          />
        </g>
      )}
      {venue === 4 && (
        <g>
          <rect
            x="177"
            y="86"
            width="455"
            height="150"
            fill="#18383a"
            stroke="#91c3b9"
            strokeWidth="3"
          />
          {Array.from({ length: 21 }, (_, i) => (
            <path
              key={i}
              d={`M181 ${91 + i * 7}h447`}
              stroke="#b1e5c2"
              opacity=".12"
            />
          ))}
          <text
            x="404"
            y="127"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="13"
            letterSpacing="6"
            fill="#a6c8b9"
          >
            THE MONOLITH PRESENTS
          </text>
          <text
            x="404"
            y="185"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontWeight="900"
            fontSize="42"
            fill="#c8e97b"
          >
            {state.name.slice(0, 16).toUpperCase()}
          </text>
          <text
            x="404"
            y="215"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="10"
            letterSpacing="4"
            fill="#a7c9bc"
          >
            SOLD OUT / LIVE & UNFILTERED
          </text>
          <path d="M113 102v164m581-164v164" stroke="#92d6c2" strokeWidth="8" />
          <path
            d="M113 102v164m581-164v164"
            stroke="#92d6c2"
            strokeWidth="15"
            filter="url(#glow)"
            opacity=".4"
          />
        </g>
      )}
      {venue === 5 && (
        <g>
          <path
            d="M107 85h581v231H107z"
            fill="none"
            stroke="#577d8f"
            strokeWidth="5"
          />
          <path
            d="M122 98h552v204H122z"
            fill="none"
            stroke="#89bac5"
            strokeWidth="1"
          />
          <path
            d="M118 104 228 305m443-201L567 305"
            stroke="#2e4c61"
            strokeWidth="9"
          />
          <rect
            x="139"
            y="125"
            width="224"
            height="80"
            fill="#11323fbf"
            stroke="#648f9a"
          />
          <text
            x="157"
            y="148"
            fontFamily="monospace"
            fontSize="10"
            fill="#95cfd0"
          >
            UNLICENSED PLANETARY UPLINK
          </text>
          <text
            x="157"
            y="177"
            fontFamily="monospace"
            fontSize="22"
            fill="#c7e9ac"
          >
            EARTH IS LISTENING
          </text>
          <path d="M157 188h143" stroke="#8adaaa" strokeWidth="3" />
        </g>
      )}
      {state.gear.automation > 0 && (
        <g transform="translate(696 252)">
          <rect width="31" height="90" fill="#172d2c" stroke="#618a7e" />
          {[12, 29, 46, 63].map((y) => (
            <g key={y}>
              <path d={`M5 ${y}h21`} stroke="#385d56" strokeWidth="9" />
              <circle cx="23" cy={y} r="2" fill="#bce47b" />
            </g>
          ))}
        </g>
      )}
      {state.gear.distribution > 0 && (
        <g transform="translate(63 210)">
          <path d="M0 0v102m-13-69h26" stroke="#6b9690" strokeWidth="3" />
          <path
            d="M-18-18q18 36 36 0"
            fill="#425f63"
            stroke="#97b9ad"
            strokeWidth="2"
          />
          <path d="M0 0 9-21" stroke="#bad49e" strokeWidth="2" />
        </g>
      )}
      <g transform="translate(96 267)">
        <rect
          width="83"
          height="89"
          rx="3"
          fill="#0b1319"
          stroke="#637576"
          strokeWidth="2"
        />
        <rect x="6" y="18" width="71" height="64" fill="url(#speaker)" />
        <circle cx="41" cy="52" r="25" stroke="#4d605e" fill="none" />
        <circle cx="41" cy="52" r="11" stroke="#3d5150" fill="#111c20" />
        <path d="M9 8h23" stroke="#b1b68c" strokeWidth="2" />
        <circle cx="64" cy="8" r="2" fill="#cfea64" />
        {count > 5 && (
          <g transform="translate(0 -70)">
            <rect width="83" height="65" fill="#101b20" stroke="#637576" />
            <rect x="5" y="9" width="73" height="50" fill="url(#speaker)" />
            <circle cx="22" cy="31" r="16" fill="none" stroke="#657674" />
            <circle cx="60" cy="31" r="16" fill="none" stroke="#657674" />
          </g>
        )}
      </g>
      <g transform="translate(626 281)">
        <rect width="63" height="66" fill="#17242a" stroke="#62716b" />
        <rect x="5" y="15" width="53" height="46" fill="url(#speaker)" />
        <path d="M9 8h30" stroke="#b5b390" />
        <circle cx="53" cy="8" r="2" fill="#69dcd0" />
      </g>
      {state.lineup.drums ? (
        <g>
          <Player x={425} y={223} scale={0.64} kind="drums" color="#e8a273" />
          <path
            d="M380 274v61m95-64v63m-43-71v81"
            stroke="#6f8f90"
            strokeWidth="3"
          />
          <ellipse cx="378" cy="271" rx="31" ry="5" fill="#b5a57e" />
          <ellipse cx="478" cy="268" rx="28" ry="5" fill="#b5a57e" />
          <circle
            cx="428"
            cy="312"
            r="31"
            fill="#172829"
            stroke="#839b93"
            strokeWidth="4"
          />
          <path d="m434 294-17 23h12l-4 12 20-24h-14z" fill="#cde16c" />
        </g>
      ) : (
        <g opacity=".35">
          <rect x="410" y="303" width="40" height="28" fill="#3c4e4b" />
          <path
            d="m408 333 48-4M421 300v-28h23"
            stroke="#5b7170"
            strokeWidth="2"
          />
        </g>
      )}
      {state.lineup.bass && (
        <Player x={240} y={272} scale={0.81} color="#bca8d9" kind="bass" />
      )}
      {state.lineup.synth && (
        <Player x={578} y={270} scale={0.8} color="#64c9c5" kind="synth" />
      )}
      <g className="guitar-player">
        <Player x={345} y={277} color="#d9e792" scale={1.03} />
      </g>
      {state.lineup.vocals && (
        <Player x={468} y={294} scale={0.96} color="#e79799" kind="vocals" />
      )}
      <path
        d="M350 370c30 20 129-11 124 13s-130 2-137 17 43 13 73 12M165 350c-29 56 78 40 102 57"
        fill="none"
        stroke="#070e11"
        strokeWidth="4"
      />
      <path d="m526 336 12 49m-26 2h40" stroke="#516c6b" strokeWidth="3" />
      <path d="m524 334 15-7" stroke="#9eb4a7" strokeWidth="6" />
      <g transform="translate(62 368) rotate(10)">
        <rect width="25" height="32" rx="2" fill="#283c3e" />
        <path d="M6 9h13M6 14h13" stroke="#91bca6" strokeWidth="2" />
        <circle cx="19" cy="26" r="2" fill="#d5ee76" />
      </g>
      {advanced && (
        <g fill="#0a1319">
          {Array.from({ length: venue * 5 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${((i * 91) % 820) - 10} ${424 + (i % 3) * 7})`}
            >
              <circle r="13" />
              <path d="M-21 29q-3-31 21-24 24-7 21 24" />
              {i % 3 === 0 && <path d="m11 11 19-35 5 3-12 38" />}
            </g>
          ))}
        </g>
      )}
      <ellipse
        cx="350"
        cy="240"
        rx="290"
        ry="210"
        fill="url(#haze)"
        pointerEvents="none"
      />
      <path d="M0 444h800" stroke="#243d3d" strokeWidth="12" />
    </svg>
  );
}

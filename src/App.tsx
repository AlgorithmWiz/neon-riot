import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity as ActivityIcon,
  ArrowDownToLine,
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cpu,
  Disc3,
  Guitar,
  LockKeyhole,
  Maximize2,
  Radio,
  Settings,
  ShieldAlert,
  Shirt,
  Skull,
  SlidersHorizontal,
  Sparkles,
  Speaker,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import {
  ACHIEVEMENTS,
  ALBUMS,
  GEAR,
  MUSICIANS,
  ROLES,
  VENUES,
} from "./content";
import {
  advance,
  bonuses,
  buy,
  deserialize,
  duration,
  fmt,
  fresh,
  gearCount,
  legendReward,
  prestige,
  quote,
  rates,
  recruit,
  riff,
  SAVE_KEY,
  serialize,
  startAlbum,
  startGig,
  venueIndex,
  venueUnlocked,
  type Activity,
  type Report,
  type State,
} from "./engine";
import PerformanceStage, { MusicianArt, RosterStrip } from "./PerformanceStage";
import { playSound } from "./audio";
import SongPlayer, { SONGS, type SongPlayerHandle } from "./SongPlayer";

type Tab = "Gear" | "Band" | "Gigs" | "Albums";
type Modal =
  | "settings"
  | "achievements"
  | "prestige"
  | "reset"
  | "import"
  | "welcome"
  | "help"
  | null;
const iconMap = {
  guitar: Guitar,
  amp: Speaker,
  cpu: Cpu,
  shirt: Shirt,
  radio: Radio,
};
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: fresh(), report: null, error: "" };
    const { state, report } = advance(deserialize(raw));
    return {
      state,
      report: report.elapsed >= 60000 ? report : null,
      error: "",
    };
  } catch (e) {
    return {
      state: fresh(),
      report: null,
      error: `Save protection: ${e instanceof Error ? e.message : "Storage unavailable."} Automatic saving is paused. Existing data has not been replaced. Use Settings to import a backup or explicitly reset.`,
    };
  }
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-head">
        <div>
          <span className="eyebrow">NEON RIOT / CONTROL PANEL</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
function Progress({
  activity,
  now,
  label,
}: {
  activity: Activity;
  now: number;
  label: string;
}) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      ((now - activity.started) / (activity.ends - activity.started)) * 100,
    ),
  );
  return (
    <div className="activity-progress">
      <div>
        <span>{label}</span>
        <span>{duration((activity.ends - now) / 1000)}</span>
      </div>
      <progress max="100" value={percentage} aria-label={label} />
    </div>
  );
}
export default function App() {
  const [initial] = useState(load),
    [state, setState] = useState(initial.state),
    [tab, setTab] = useState<Tab>("Gear"),
    [quantity, setQuantity] = useState<1 | 10 | "max">(1),
    [modal, setModal] = useState<Modal>(initial.report ? "welcome" : null),
    [welcome, setWelcome] = useState<Report | null>(initial.report),
    [error, setError] = useState(initial.error),
    [toasts, setToasts] = useState<{ id: number; text: string }[]>([]),
    [particles, setParticles] = useState<
      { id: number; value: string; x: number }[]
    >([]),
    [playing, setPlaying] = useState(false),
    [name, setName] = useState(initial.state.name),
    [pendingImport, setPendingImport] = useState<State | null>(null),
    [savedAt, setSavedAt] = useState<number | null>(null);
  const current = useRef(state),
    blocked = useRef(!!initial.error),
    toastId = useRef(0),
    riffUntil = useRef(0),
    songAudio = useRef<SongPlayerHandle | null>(null),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    file = useRef<HTMLInputElement>(null);
  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== t);
      fn();
    }, ms);
    timers.current.push(t);
  };
  const notify = (text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    schedule(() => setToasts((t) => t.filter((a) => a.id !== id)), 4500);
  };
  function save(s: State) {
    if (blocked.current) return;
    try {
      localStorage.setItem(SAVE_KEY, serialize(s));
      setSavedAt(Date.now());
    } catch {
      blocked.current = true;
      setError(
        "Browser storage is unavailable or full. Progress continues in memory; export your save before closing.",
      );
    }
  }
  function update(s: State, persist = false) {
    const prev = current.current;
    current.current = s;
    setState(s);
    if (venueIndex(s) > venueIndex(prev))
      notify(`New venue unlocked: ${VENUES[venueIndex(s)].name}`);
    for (const id of s.achievements.filter(
      (id) => !prev.achievements.includes(id),
    ))
      notify(
        `Achievement: ${ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id}`,
      );
    if (persist) save(s);
  }
  function tick(showReturn = false) {
    const { state: s, report } = advance(current.current);
    update(s);
    if (showReturn && report.elapsed >= 60000) {
      setWelcome(report);
      setModal("welcome");
    } else {
      if (report.gigName)
        notify(
          `Show complete! +${fmt(report.gigFans)} fans · +${fmt(report.gigCredits)} credits`,
        );
      if (report.albumName)
        notify(
          `Released: ${report.albumName} · +${fmt(report.albumFans)} fans`,
        );
    }
    return s;
  }
  function act(fn: (s: State) => State, sound = false) {
    const base = tick();
    const next = fn(base);
    update(next, true);
    if (sound && next !== base && next.sound) playSound("buy");
    return next !== base;
  }
  useEffect(() => {
    const interval = setInterval(() => {
        if (!document.hidden) tick();
      }, 1000),
      autosave = setInterval(() => {
        if (!document.hidden) save(current.current);
      }, 10000);
    const visibility = () => {
      if (document.hidden) save(current.current);
      else {
        tick(true);
        save(current.current);
      }
    };
    const leave = () => save(current.current);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(interval);
      clearInterval(autosave);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
      timers.current.forEach(clearTimeout);
    };
  }, []);
  const r = rates(state),
    b = bonuses(state),
    venue = venueIndex(state),
    performanceVenue = state.gig?.index ?? venue,
    location = VENUES[performanceVenue],
    next = VENUES[venue + 1],
    totalGear = gearCount(state),
    now = state.lastSeen;
  const doRiff = () => {
    const value = rates(current.current).click;
    act(riff);
    if (current.current.sound) playSound("riff");
    setPlaying(true);
    riffUntil.current = Date.now() + 450;
    schedule(() => {
      if (Date.now() >= riffUntil.current) setPlaying(false);
    }, 460);
    const id = ++toastId.current;
    setParticles((p) => [
      ...p.slice(-7),
      { id, value: `+${fmt(value, 1)}`, x: 30 + Math.random() * 40 },
    ]);
    schedule(() => setParticles((p) => p.filter((a) => a.id !== id)), 850);
  };
  function exportSave() {
    const blob = new Blob([serialize(current.current)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `neon-riot-era-${current.current.era}.json`;
    a.click();
    schedule(() => URL.revokeObjectURL(url), 1000);
    notify("Save exported. Keep the noise backed up.");
  }
  const tutorialStep =
    state.riffs === 0
      ? 0
      : totalGear === 0
        ? 1
        : state.recruited.length === 0
          ? 2
          : state.shows === 0
            ? 3
            : 4;
  const tutorials = [
    [
      "Every legend starts with one riff.",
      "Hit PLAY RIFF to earn your first credits. Loud is a lifestyle.",
    ],
    [
      "Give your sound some teeth.",
      "Buy Junkyard strings in Gear to earn credits automatically.",
    ],
    [
      "A solo act only gets so loud.",
      "Save 100 credits, open Band, and recruit your first drummer.",
    ],
    [
      "Time to find your people.",
      "Open Gigs and start an open-door rehearsal. Fans unlock bigger stages.",
    ],
    [
      "You’re on the air.",
      "Keep upgrading, release your first demo, and take the underground.",
    ],
  ];
  return (
    <div className={`app ${state.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Neon Riot home">
          <span className="brand-symbol">
            <Zap fill="currentColor" size={28} />
          </span>
          <span>
            NEON<span className="brand-riot">RIOT</span>
            <small>BAND IDLER / EST. 2089</small>
          </span>
        </a>
        <div className="top-center">
          <span className="status-dot" />
          UNDERGROUND FREQUENCY <span className="muted">//</span> 107.7
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setModal("help")}
            aria-label="How to play"
          >
            <CircleHelp size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("achievements")}
            aria-label="Achievements"
          >
            <Trophy size={19} />
            <span className="notification-dot" />
          </button>
          <button
            className="icon-button"
            onClick={() => act((s) => ({ ...s, sound: !s.sound }))}
            aria-label={
              state.sound ? "Mute sound effects" : "Enable sound effects"
            }
          >
            {state.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <span className="header-rule" />
          <button
            className="icon-button"
            onClick={() => {
              setName(state.name);
              setModal("settings");
            }}
            aria-label="Settings"
          >
            <Settings size={19} />
          </button>
        </div>
      </header>
      <main id="main">
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span className="tiny-line" />
              YOUR BAND. YOUR REBELLION.
            </div>
            <h1>
              MAKE THE CITY <span>SCREAM.</span>
            </h1>
            <p>
              No label. No permission. Just five outcasts and a wall of sound.
            </p>
          </div>
          <div className="transmission-art" aria-hidden="true">
            <div className="record-disc" />
            <img
              src={`${import.meta.env.BASE_URL}art/concrete-cathedral.webp`}
              alt=""
              width="1254"
              height="1254"
            />
            <span>BOOTLEG TRANSMISSION / VOL. 01</span>
          </div>
          <div className="era-label">
            <span>CAREER TRANSMISSION</span>
            <strong>
              ERA {String(state.era).padStart(2, "0")} <AudioLines size={22} />
            </strong>
            <small>{location.tag}</small>
          </div>
        </section>
        {error && (
          <div className="error-banner" role="alert">
            <ShieldAlert size={20} />
            <span>{error}</span>
            <button onClick={() => setModal("settings")}>
              Manage save <ArrowRight size={15} />
            </button>
          </div>
        )}
        <section className="stats" aria-label="Band statistics">
          <div className="stat">
            <span>
              <Zap size={15} /> CREDITS
            </span>
            <strong className="acid">
              {fmt(Math.floor(state.credits))}
              <small>₡</small>
            </strong>
            <p>Your next big thing starts here.</p>
          </div>
          <div className="stat">
            <span>
              <Users size={15} /> FANS
            </span>
            <strong>{fmt(state.fans)}</strong>
            <p>
              {state.fans === 0
                ? "Even legends start at zero."
                : "Your noise is finding its people."}
            </p>
          </div>
          <div className="stat">
            <span>
              <ActivityIcon size={15} /> PASSIVE INCOME
            </span>
            <strong>
              {fmt(r.passive, 1)}
              <small>₡ / sec</small>
            </strong>
            <p>The noise keeps paying.</p>
          </div>
          <button
            className="stat legend-stat"
            onClick={() => setModal("prestige")}
          >
            <span>
              <Sparkles size={15} /> LEGEND
            </span>
            <strong>
              {fmt(state.legend)}
              <small>+{fmt(state.legend * 10)}% income</small>
            </strong>
            <p>
              {state.orbital
                ? "A new era is ready."
                : "Build a legacy that outlives you."}
              <ChevronRight size={14} />
            </p>
          </button>
        </section>
        <div className="game-grid">
          <section className="left-column">
            <div className="stage-panel">
              <div className="panel-top">
                <span className="eyebrow">
                  <span className="status-dot" />{" "}
                  {performanceVenue === 5
                    ? "LIVE FROM LOW ORBIT"
                    : performanceVenue === 4
                      ? "LIVE FROM THE UPPER CITY"
                      : "LIVE FROM THE UNDERCITY"}
                </span>
                <span className="mono">
                  VENUE {String(performanceVenue + 1).padStart(2, "0")} / 06
                </span>
              </div>
              <div className="venue-heading">
                <div>
                  <h2>{location.name}</h2>
                  <p>{location.district}</p>
                </div>
                <span className="venue-tag">
                  {performanceVenue === 0 ? "DIY OR DIE" : location.tag}
                </span>
              </div>
              <div className="stage-container">
                <PerformanceStage state={state} playing={playing} />
                <div className="stage-stamp">
                  <Radio size={13} /> {state.name.toUpperCase()}{" "}
                  <span>ON AIR</span>
                </div>
                <div className="stage-caption">
                  {state.gig
                    ? "● LIVE PERFORMANCE"
                    : "SOUND CHECK / ALWAYS TOO LOUD"}
                </div>
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="riff-particle"
                    style={{ left: `${p.x}%` }}
                  >
                    {p.value} ₡
                  </span>
                ))}
              </div>
              <RosterStrip state={state} />
              <div className={`riff-console ${playing ? "riff-active" : ""}`}>
                <div className="signal-deck">
                  <span className="signal-label">
                    SIGNAL /{" "}
                    {state.gig ? "LIVE" : playing ? "RIFF DETECTED" : "STANDBY"}
                  </span>
                  <div
                    className={`signal-bars ${playing || state.gig ? "signal-active" : ""}`}
                    aria-hidden="true"
                  >
                    {Array.from({ length: 32 }, (_, i) => (
                      <i
                        key={i}
                        style={
                          {
                            "--bar-height": `${20 + ((i * 17) % 80)}%`,
                            "--bar-speed": `${0.25 + (i % 5) * 0.08}s`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                  <button
                    className="motion-toggle"
                    aria-label={
                      state.reducedMotion
                        ? "Resume visual effects"
                        : "Pause visual effects"
                    }
                    aria-pressed={state.reducedMotion}
                    onClick={() =>
                      act((s) => ({ ...s, reducedMotion: !s.reducedMotion }))
                    }
                  >
                    {state.reducedMotion ? "FX OFF" : "FX ON"}
                  </button>
                </div>
                <div className="riff-meta">
                  <span>
                    <AudioLines size={17} />
                    <b>{fmt(r.click, 1)} ₡</b> per riff
                  </span>
                  <span>
                    {state.gig
                      ? `SHOW BOOST +${Math.round(state.gig.boost * 100)}%`
                      : "AMPLIFIERS READY"}
                  </span>
                </div>
                <button className="riff-button" onClick={doRiff}>
                  <Zap size={23} fill="currentColor" />
                  <span>PLAY RIFF</span>
                  <span className="riff-button-right">
                    MAKE SOME NOISE <ArrowRight size={18} />
                  </span>
                </button>
                <p className="riff-hint">
                  Click. Earn. Upgrade. Repeat.{" "}
                  <span>The underground is listening.</span>
                </p>
              </div>
            </div>
            <SongPlayer
              playerRef={songAudio}
              unlockedTitles={state.albums.map((index) => ALBUMS[index].name)}
            />
            {state.tutorial && (
              <div className="tutorial">
                <div className="tutorial-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <span className="eyebrow">
                    THE FIRST DECIBELS / {Math.min(tutorialStep + 1, 5)} OF 5
                  </span>
                  <h3>{tutorials[tutorialStep][0]}</h3>
                  <p>{tutorials[tutorialStep][1]}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Dismiss tutorial"
                  onClick={() => act((s) => ({ ...s, tutorial: false }))}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <section className="road-panel">
              <div className="section-label">
                <h3>
                  <Radio size={16} /> THE ROAD TO LEGEND
                </h3>
                <span>{venue + 1} / 6 VENUES</span>
              </div>
              <div className="road-track">
                {VENUES.map((v, i) => (
                  <button
                    key={v.name}
                    className={`road-stop ${i <= venue ? "reached" : ""} ${i === venue ? "current" : ""}`}
                    onClick={() => {
                      setTab("Gigs");
                      document.getElementById("management")?.scrollIntoView({
                        behavior: state.reducedMotion ? "auto" : "smooth",
                        block: "start",
                      });
                    }}
                    aria-label={`${v.short}${i <= venue ? ", unlocked" : `, requires ${fmt(v.fans)} fans and ${v.gear} gear`}`}
                  >
                    <span>
                      {i < venue ? (
                        <Check size={13} />
                      ) : i === venue ? (
                        <Zap size={13} />
                      ) : (
                        <LockKeyhole size={11} />
                      )}
                    </span>
                    <small>{v.short}</small>
                  </button>
                ))}
              </div>
              {next ? (
                <div className="next-venue">
                  <span>
                    NEXT UP <b>{next.name}</b>
                  </span>
                  <span>
                    <Users size={13} />
                    {fmt(state.fans)} / {fmt(next.fans)} fans{" "}
                    <span className="divider">·</span>
                    {totalGear} / {next.gear} gear
                  </span>
                </div>
              ) : (
                <div className="next-venue">
                  <span>YOU OWN THE AIRWAVES</span>
                  <button onClick={() => setModal("prestige")}>
                    Start a new era <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </section>
          </section>
          <section className="management" id="management">
            <nav className="tabs" aria-label="Band management">
              {(["Gear", "Band", "Gigs", "Albums"] as Tab[]).map((t) => {
                const Icon =
                  t === "Gear"
                    ? SlidersHorizontal
                    : t === "Band"
                      ? Users
                      : t === "Gigs"
                        ? Radio
                        : Disc3;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={tab === t ? "active" : ""}
                    aria-pressed={tab === t}
                  >
                    <Icon size={17} />
                    {t}
                    {t === "Band" && (
                      <small>{Object.keys(state.lineup).length}/4</small>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="management-body" key={tab}>
              <div className="management-title">
                <div>
                  <span className="eyebrow">
                    {tab === "Gear"
                      ? "LOUDER IS A BUSINESS MODEL"
                      : tab === "Band"
                        ? "FIND YOUR PARTNERS IN NOISE"
                        : tab === "Gigs"
                          ? "TAKE IT TO THE STREETS"
                          : "PRESS RECORD. LEAVE A MARK."}
                  </span>
                  <h2>
                    {tab === "Gear"
                      ? "The loadout."
                      : tab === "Band"
                        ? "The outcasts."
                        : tab === "Gigs"
                          ? "The next stage."
                          : "The discography."}
                  </h2>
                </div>
                {tab === "Gear" && (
                  <div className="quantity" aria-label="Purchase quantity">
                    {([1, 10, "max"] as const).map((q) => (
                      <button
                        key={q}
                        className={quantity === q ? "active" : ""}
                        onClick={() => setQuantity(q)}
                        aria-pressed={quantity === q}
                      >
                        {q === "max" ? "MAX" : `×${q}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tab === "Gear" && (
                <>
                  <p className="panel-description">
                    Turn scrap into sound. Turn sound into a living.
                  </p>
                  <div className="gear-list">
                    {GEAR.map((g) => {
                      const Icon = iconMap[g.icon as keyof typeof iconMap],
                        q = quote(state, g.id, quantity),
                        affordable = q.count > 0 && state.credits >= q.cost,
                        shownCost = q.count
                          ? q.cost
                          : quote(state, g.id, 1).cost,
                        shownCount = q.count || 1;
                      return (
                        <article
                          className={`gear-card ${affordable ? "affordable" : ""}`}
                          key={g.id}
                        >
                          <div className="gear-upper">
                            <div className={`gear-icon ${g.id}`}>
                              <Icon size={26} strokeWidth={1.5} />
                            </div>
                            <div className="gear-title">
                              <span className="eyebrow">{g.label}</span>
                              <h3>{g.name}</h3>
                            </div>
                            <span className="owned">
                              LVL{" "}
                              <b>{String(state.gear[g.id]).padStart(2, "0")}</b>
                            </span>
                          </div>
                          <p>{g.description}</p>
                          <div className="gear-bottom">
                            <span className="gear-benefit">
                              +{fmt(g.passive * b.credit * shownCount, 1)} ₡ /
                              sec
                              {g.click > 0 && (
                                <small>
                                  +{fmt(g.click * b.credit * shownCount, 1)} /
                                  riff
                                </small>
                              )}
                            </span>
                            <button
                              className="buy-button"
                              disabled={!affordable}
                              onClick={() => {
                                if (act((s) => buy(s, g.id, quantity), true))
                                  notify(
                                    `${g.name} upgraded${q.count > 1 ? ` ×${q.count}` : ""}. Turn it up.`,
                                  );
                              }}
                              aria-label={`Buy ${g.name}${quantity === 10 ? " times 10" : quantity === "max" ? " maximum" : ""} for ${fmt(shownCost)} credits`}
                            >
                              <Zap size={13} />
                              {fmt(shownCost)}
                              <span>
                                {quantity === "max" && q.count > 0
                                  ? `×${q.count}`
                                  : "₡"}
                              </span>
                              {affordable ? (
                                <ArrowRight size={14} />
                              ) : (
                                <LockKeyhole size={12} />
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="panel-footnote">
                    <span className="status-dot" />
                    UPGRADES WORK WHILE YOU’RE AWAY <span>24H OFFLINE CAP</span>
                  </div>
                </>
              )}
              {tab === "Band" && (
                <>
                  <p className="panel-description">
                    Four empty spots. A whole city to wake up.{" "}
                    {state.gig
                      ? "Lineup changes are locked until the show ends."
                      : "Recruit once. Switch freely between shows."}
                  </p>
                  <div className="band-player">
                    <div className="avatar">
                      <MusicianArt portrait />
                    </div>
                    <div>
                      <span className="eyebrow">GUITAR / FOUNDER</span>
                      <h3>You. The original riot.</h3>
                      <p>One borrowed guitar. An unreasonable ambition.</p>
                    </div>
                    <span className="small-badge">ON STAGE</span>
                  </div>
                  {ROLES.map((role) => (
                    <section className="role-section" key={role}>
                      <div className="role-label">
                        <span>{role}</span>
                        <span>
                          {state.lineup[role]
                            ? "POSITION FILLED"
                            : "OPEN POSITION"}
                        </span>
                      </div>
                      {MUSICIANS.filter((m) => m.role === role).map((m, i) => {
                        const owned = state.recruited.includes(m.id),
                          active = state.lineup[role] === m.id;
                        return (
                          <article
                            className={`musician ${active ? "selected" : ""}`}
                            key={m.id}
                          >
                            <div className="avatar">
                              <MusicianArt
                                instrument={m.role}
                                portrait
                                variant={i}
                              />
                            </div>
                            <div className="musician-info">
                              <h3>
                                {m.name}
                                {active && <Check size={14} />}
                              </h3>
                              <p>{m.title}</p>
                              <span>
                                +{m.passive} ₡/s
                                {m.credit > 0 &&
                                  ` · +${Math.round(m.credit * 100)}% income`}
                                {m.fans > 0 &&
                                  ` · +${Math.round(m.fans * 100)}% fans`}
                                {m.album > 0 &&
                                  ` · +${Math.round(m.album * 100)}% record speed`}
                              </span>
                            </div>
                            <button
                              disabled={
                                active ||
                                !!state.gig ||
                                (!owned && state.credits < m.cost)
                              }
                              onClick={() => {
                                if (act((s) => recruit(s, m.id), true))
                                  notify(`${m.name} is on stage.`);
                              }}
                              className="recruit-button"
                            >
                              {active
                                ? "ON STAGE"
                                : owned
                                  ? "SELECT"
                                  : `${fmt(m.cost)} ₡`}
                            </button>
                          </article>
                        );
                      })}
                    </section>
                  ))}
                </>
              )}
              {tab === "Gigs" && (
                <>
                  <p className="panel-description">
                    Book a show. Play riffs for up to +50% rewards. Let the
                    crowd do the rest.
                  </p>
                  {state.gig && (
                    <div className="live-activity">
                      <span className="eyebrow">
                        <span className="status-dot" /> ON THE BILL
                      </span>
                      <h3>{VENUES[state.gig.index].gig}</h3>
                      <Progress
                        activity={state.gig}
                        now={now}
                        label={`Show bonus +${Math.round(state.gig.boost * 100)}%`}
                      />
                    </div>
                  )}
                  <div className="gig-list">
                    {VENUES.map((v, i) => {
                      const unlocked = venueUnlocked(state, i);
                      return (
                        <article
                          className={`gig-card ${unlocked ? "unlocked" : ""}`}
                          key={v.name}
                        >
                          <div className="gig-number">
                            {String(i + 1).padStart(2, "0")}
                            {unlocked ? (
                              <Radio size={20} />
                            ) : (
                              <LockKeyhole size={18} />
                            )}
                          </div>
                          <div className="gig-info">
                            <span className="eyebrow">
                              {v.short} · {duration(v.duration)}
                            </span>
                            <h3>{v.gig}</h3>
                            <p>{v.description}</p>
                            <div className="rewards">
                              <span>
                                <Zap size={12} />
                                {fmt(v.credits * b.credit)} ₡
                              </span>
                              <span>
                                <Users size={12} />+
                                {fmt(Math.round(v.reward * b.fans))}
                              </span>
                            </div>
                            {!unlocked && (
                              <small className="requirements">
                                Requires {fmt(v.fans)} fans + {v.gear} gear
                              </small>
                            )}
                            <button
                              className="outline-button"
                              disabled={!unlocked || !!state.gig}
                              onClick={() => {
                                if (act((s) => startGig(s, i), true))
                                  notify(
                                    `Booked: ${v.gig}. Give them something to remember.`,
                                  );
                              }}
                            >
                              {state.gig?.index === i
                                ? "LIVE NOW"
                                : !unlocked
                                  ? "LOCKED"
                                  : "BOOK SHOW"}
                              {unlocked ? (
                                <ArrowRight size={14} />
                              ) : (
                                <LockKeyhole size={12} />
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
              {tab === "Albums" && (
                <>
                  <p className="panel-description">
                    The show ends. The record keeps playing. Release albums for
                    fans and permanent royalties this era.
                  </p>
                  {state.recording && (
                    <div className="live-activity">
                      <span className="eyebrow">IN THE STUDIO</span>
                      <h3>{ALBUMS[state.recording.index].name}</h3>
                      <Progress
                        activity={state.recording}
                        now={now}
                        label="Recording in progress"
                      />
                    </div>
                  )}
                  {ALBUMS.map((a, i) => {
                    const done = state.albums.includes(i);
                    return (
                      <article className="album-card" key={a.name}>
                        <div
                          className={`album-art album-${i}`}
                          style={
                            { "--cover-color": a.color } as React.CSSProperties
                          }
                        >
                          <span>NR / {String(i + 1).padStart(2, "0")}</span>
                          <svg
                            className="generated-cover"
                            preserveAspectRatio="xMidYMid slice"
                            viewBox={`${(i % 3) * 512} ${Math.floor(i / 3) * 512} 512 512`}
                            aria-hidden="true"
                          >
                            <image
                              href={`${import.meta.env.BASE_URL}art/album-covers.webp`}
                              width="1536"
                              height="1024"
                            />
                          </svg>
                          <small>{a.name.toUpperCase()}</small>
                        </div>
                        <div className="album-info">
                          <span className="eyebrow">{a.kind}</span>
                          <h3>{a.name}</h3>
                          <p>
                            +{fmt(a.reward * b.fans)} fans · +
                            {fmt(a.royalty * b.credit, 1)} ₡ / sec
                          </p>
                          <small>
                            <Clock3 size={11} />
                            {duration(a.duration / b.album)}{" "}
                            {state.fans < a.fans &&
                              ` · Requires ${fmt(a.fans)} fans`}
                          </small>
                          <button
                            className="outline-button"
                            disabled={
                              done ||
                              !!state.recording ||
                              state.credits < a.cost ||
                              state.fans < a.fans
                            }
                            onClick={() => {
                              if (act((s) => startAlbum(s, i), true))
                                notify(`Recording ${a.name}.`);
                            }}
                          >
                            {done
                              ? "RELEASED"
                              : state.recording?.index === i
                                ? "RECORDING"
                                : `RECORD · ${fmt(a.cost)} ₡`}
                            {done ? <Check size={14} /> : <Disc3 size={14} />}
                          </button>
                          {SONGS.some((song) => song.title === a.name) &&
                            done && (
                              <button
                                className="outline-button listen-button"
                                onClick={() => {
                                  songAudio.current?.playSong(a.name);
                                }}
                              >
                                <Radio size={14} /> LISTEN TO SINGLE
                              </button>
                            )}
                          {SONGS.some((song) => song.title === a.name) &&
                            !done && (
                              <p className="song-unlock-note">
                                <LockKeyhole size={12} /> RELEASE TO UNLOCK SONG
                              </p>
                            )}
                        </div>
                      </article>
                    );
                  })}
                </>
              )}
            </div>
          </section>
        </div>
        <footer>
          <span>
            <Zap size={13} /> BUILT FROM SCRAP. POWERED BY NOISE.
          </span>
          <span>
            {error
              ? "SAVE PAUSED"
              : savedAt
                ? "PROGRESS SAVED LOCALLY"
                : "LOCAL SAVE / EVERY 10 SEC"}
            <span className={`status-dot ${error ? "warning" : ""}`} />
          </span>
          <button onClick={() => setModal("help")}>
            FIELD GUIDE <ArrowRight size={12} />
          </button>
        </footer>
      </main>
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <Zap size={16} />
            {t.text}
          </div>
        ))}
      </div>
      <input
        type="file"
        ref={file}
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            if (f.size > 100000)
              throw new Error("File is too large. Choose a NEON RIOT save.");
            const parsed = deserialize(await f.text());
            setPendingImport(parsed);
            setModal("import");
          } catch (e) {
            notify(
              e instanceof Error ? e.message : "Could not read this save.",
            );
          }
        }}
      />
      {modal && (
        <Dialog
          title={
            modal === "settings"
              ? "Behind the noise."
              : modal === "achievements"
                ? "Your mark on the city."
                : modal === "prestige"
                  ? "Legends never unplug."
                  : modal === "reset"
                    ? "Pull the plug?"
                    : modal === "import"
                      ? "Restore this transmission?"
                      : modal === "welcome"
                        ? "The noise never stopped."
                        : "The underground field guide."
          }
          onClose={() => setModal(null)}
        >
          {modal === "settings" && (
            <>
              <form
                className="name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim()) {
                    act((s) => ({ ...s, name: name.trim().slice(0, 32) }));
                    notify("Band name updated.");
                  }
                }}
              >
                <label htmlFor="band-name">BAND NAME</label>
                <div>
                  <input
                    id="band-name"
                    maxLength={32}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <button className="primary-small" type="submit">
                    SAVE
                  </button>
                </div>
              </form>
              <button
                className="setting-row"
                onClick={() => act((s) => ({ ...s, sound: !s.sound }))}
              >
                <span>
                  <Volume2 size={18} /> Synthesized riff & interface sounds
                </span>
                <b>{state.sound ? "ON" : "OFF"}</b>
              </button>
              <button
                className="setting-row"
                onClick={() =>
                  act((s) => ({ ...s, reducedMotion: !s.reducedMotion }))
                }
              >
                <span>
                  <Maximize2 size={18} /> Reduce motion
                </span>
                <b>{state.reducedMotion ? "ON" : "OFF"}</b>
              </button>
              <button
                className="setting-row"
                onClick={() => act((s) => ({ ...s, tutorial: !s.tutorial }))}
              >
                <span>
                  <CircleHelp size={18} /> Opening tutorial
                </span>
                <b>{state.tutorial ? "ON" : "OFF"}</b>
              </button>
              <div className="save-note">
                <LockKeyhole size={16} />
                <p>
                  Your progress lives in this browser. Export a backup to move
                  devices or keep your band safe when clearing browser data.
                </p>
              </div>
              <div className="dialog-actions">
                <button className="outline-button" onClick={exportSave}>
                  <ArrowDownToLine size={15} />
                  EXPORT SAVE
                </button>
                <button
                  className="outline-button"
                  onClick={() => file.current?.click()}
                >
                  IMPORT SAVE <ArrowRight size={15} />
                </button>
              </div>
              <button className="danger-link" onClick={() => setModal("reset")}>
                Erase all progress
              </button>
            </>
          )}
          {modal === "achievements" && (
            <>
              <p className="dialog-description">
                {state.achievements.length} / {ACHIEVEMENTS.length}{" "}
                achievements. Your legacy survives a new era.
              </p>
              <div className="achievement-list">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    className={
                      state.achievements.includes(a.id) ? "earned" : ""
                    }
                    key={a.id}
                  >
                    <span>
                      {state.achievements.includes(a.id) ? (
                        <Trophy size={22} />
                      ) : (
                        <LockKeyhole size={20} />
                      )}
                    </span>
                    <div>
                      <h3>{a.name}</h3>
                      <p>{a.description}</p>
                    </div>
                    {state.achievements.includes(a.id) && <Check size={16} />}
                  </div>
                ))}
              </div>
            </>
          )}
          {modal === "prestige" && (
            <>
              <div className="prestige-icon">
                <Skull size={55} />
              </div>
              <p className="dialog-description">
                A band can conquer a city. A legend can start a movement.
              </p>
              <div className="prestige-reward">
                <span>NEXT ERA REWARD</span>
                <strong>+{legendReward(state)} LEGEND</strong>
                <small>
                  Permanent income bonus: +{state.legend * 10}% → +
                  {(state.legend + legendReward(state)) * 10}%
                </small>
              </div>
              <p className="dialog-description">
                Starting a new era resets your credits, fans, equipment,
                musicians, records, and active projects. Keep your band name,
                achievements, settings, and all Legend points.
              </p>
              {!state.orbital && (
                <p className="locked-message">
                  <LockKeyhole size={16} /> Complete the Orbital Uplink headline
                  show to unlock.
                </p>
              )}
              <button
                className="primary-small full-width"
                disabled={!state.orbital}
                onClick={() => {
                  act((s) => prestige(s));
                  setModal(null);
                  setTab("Gear");
                  notify("A new era begins. Your legend echoes on.");
                }}
              >
                START A NEW ERA <ArrowRight size={16} />
              </button>
            </>
          )}
          {modal === "reset" && (
            <>
              <p className="dialog-description">
                This erases your entire career, including Legend points and
                achievements. Export a backup first if you want to come back.
              </p>
              <div className="dialog-actions">
                <button className="outline-button" onClick={exportSave}>
                  EXPORT BACKUP
                </button>
                <button
                  className="danger-button"
                  onClick={() => {
                    blocked.current = false;
                    setError("");
                    update(fresh(), true);
                    setName("Neon Riot");
                    setModal(null);
                    setTab("Gear");
                    notify("A fresh start. Make it loud.");
                  }}
                >
                  ERASE & RESTART
                </button>
              </div>
            </>
          )}
          {modal === "import" && pendingImport && (
            <>
              <p className="dialog-description">
                Replace this browser’s progress with <b>{pendingImport.name}</b>
                , era {pendingImport.era}? This save has{" "}
                {fmt(pendingImport.fans)} fans, {fmt(pendingImport.credits)}{" "}
                credits, and {pendingImport.legend} Legend points.
              </p>
              <div className="dialog-actions">
                <button
                  className="outline-button"
                  onClick={() => setModal("settings")}
                >
                  CANCEL
                </button>
                <button
                  className="primary-small"
                  onClick={() => {
                    const result = advance(pendingImport);
                    blocked.current = false;
                    setError("");
                    update(result.state, true);
                    setName(result.state.name);
                    setPendingImport(null);
                    setWelcome(result.report);
                    setModal(result.report.elapsed >= 60000 ? "welcome" : null);
                    notify("Save restored. Welcome back to the underground.");
                  }}
                >
                  REPLACE & RESTORE
                </button>
              </div>
            </>
          )}
          {modal === "welcome" && welcome && (
            <>
              <p className="dialog-description">
                You were away for {duration(welcome.elapsed / 1000)}. Your band
                kept the amps warm. Passive earnings are capped at 24 hours per
                absence.
              </p>
              <div className="return-summary">
                <div>
                  <span>Passive income</span>
                  <strong>+{fmt(welcome.passive)} ₡</strong>
                </div>
                {welcome.gigName && (
                  <>
                    <p>{welcome.gigName} completed</p>
                    <div>
                      <span>Show rewards</span>
                      <strong>
                        +{fmt(welcome.gigCredits)} ₡ · {fmt(welcome.gigFans)}{" "}
                        fans
                      </strong>
                    </div>
                  </>
                )}
                {welcome.albumName && (
                  <>
                    <p>{welcome.albumName} released</p>
                    <div>
                      <span>Album release</span>
                      <strong>+{fmt(welcome.albumFans)} fans</strong>
                    </div>
                  </>
                )}
              </div>
              <button
                className="primary-small full-width"
                onClick={() => setModal(null)}
              >
                BACK TO THE NOISE <ArrowRight size={16} />
              </button>
            </>
          )}
          {modal === "help" && (
            <div className="help-content">
              <p>
                It’s 2089. The megacity runs on corporate static. You’re here to
                change the frequency.
              </p>
              <ol>
                <li>
                  <b>Play riffs.</b> Click the big button to earn credits. You
                  can also focus it with Tab and press Space or Enter.
                </li>
                <li>
                  <b>Build your sound.</b> Gear adds automatic income and
                  stronger clicks. Buy ×1, ×10, or as many as you can afford.
                </li>
                <li>
                  <b>Find your band.</b> Pick a musician for each role. Income
                  bonuses stack; fan bonuses affect newly booked shows and
                  recordings. Switch freely between gigs.
                </li>
                <li>
                  <b>Play shows.</b> Fans and total gear unlock venues. A gig
                  finishes by itself; each riff adds 0.5% to its rewards, up to
                  +50%.
                </li>
                <li>
                  <b>Make records.</b> Albums bring fans and ongoing royalties.
                  One show and one recording can run together, including
                  offline.
                </li>
                <li>
                  <b>Become a legend.</b> Complete the orbital headline show,
                  then start a new era with permanent income bonuses. Your first
                  era is designed for several days of casual play.
                </li>
              </ol>
              <p>
                Progress saves locally every ten seconds and after important
                actions. Offline production stops after 24 hours; finished gigs
                and albums pay once. Export a backup in Settings.
              </p>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}

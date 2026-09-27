import {
  ACHIEVEMENTS,
  ALBUMS,
  GEAR,
  MUSICIANS,
  ROLES,
  VENUES,
  type GearId,
  type Role,
} from "./content";
export const SAVE_KEY = "neon-riot-save-v1";
export const OFFLINE_CAP = 86400000;
export type Activity = {
  index: number;
  started: number;
  ends: number;
  fans: number;
  credits: number;
  boost: number;
};
export type State = {
  version: 1;
  name: string;
  credits: number;
  fans: number;
  gear: Record<GearId, number>;
  recruited: string[];
  lineup: Partial<Record<Role, string>>;
  albums: number[];
  gig: Activity | null;
  recording: Activity | null;
  shows: number;
  riffs: number;
  orbital: boolean;
  legend: number;
  era: number;
  achievements: string[];
  lastSeen: number;
  created: number;
  tutorial: boolean;
  sound: boolean;
  backgroundMusic: boolean;
  reducedMotion: boolean;
};
export function fresh(now = Date.now()): State {
  return {
    version: 1,
    name: "Neon Riot",
    credits: 0,
    fans: 0,
    gear: { guitar: 0, amp: 0, automation: 0, merch: 0, distribution: 0 },
    recruited: [],
    lineup: {},
    albums: [],
    gig: null,
    recording: null,
    shows: 0,
    riffs: 0,
    orbital: false,
    legend: 0,
    era: 1,
    achievements: [],
    lastSeen: now,
    created: now,
    tutorial: true,
    sound: false,
    backgroundMusic: true,
    reducedMotion: false,
  };
}
export function bonuses(s: State) {
  const band = MUSICIANS.filter((m) => s.lineup[m.role] === m.id);
  return {
    credit: (1 + band.reduce((n, m) => n + m.credit, 0)) * (1 + s.legend * 0.1),
    fans: 1 + band.reduce((n, m) => n + m.fans, 0),
    album: 1 + band.reduce((n, m) => n + m.album, 0),
    passive: band.reduce((n, m) => n + m.passive, 0),
  };
}
export function rates(s: State) {
  const b = bonuses(s);
  return {
    passive:
      (GEAR.reduce((n, g) => n + s.gear[g.id] * g.passive, 0) +
        b.passive +
        s.albums.reduce((n, i) => n + ALBUMS[i].royalty, 0)) *
      b.credit,
    click:
      (1 + GEAR.reduce((n, g) => n + s.gear[g.id] * g.click, 0)) * b.credit,
  };
}
export const gearCount = (s: State) =>
  Object.values(s.gear).reduce((a, b) => a + b, 0);
export function venueUnlocked(s: State, i: number) {
  const v = VENUES[i];
  return !!v && s.fans >= v.fans && gearCount(s) >= v.gear;
}
export function venueIndex(s: State) {
  return VENUES.reduce((n, _, i) => (venueUnlocked(s, i) ? i : n), 0);
}
export function quote(s: State, id: GearId, quantity: 1 | 10 | "max") {
  const g = GEAR.find((g) => g.id === id)!;
  let cost = 0,
    count = 0;
  const limit = quantity === "max" ? 1000 : quantity;
  while (count < limit && s.gear[id] + count < 1000) {
    const next = Math.ceil(g.cost * 1.16 ** (s.gear[id] + count));
    if (quantity === "max" && cost + next > s.credits) break;
    cost += next;
    count++;
  }
  return { cost, count };
}
export function buy(s: State, id: GearId, q: 1 | 10 | "max"): State {
  const { cost, count } = quote(s, id, q);
  return count && s.credits >= cost
    ? award({
        ...s,
        credits: s.credits - cost,
        gear: { ...s.gear, [id]: s.gear[id] + count },
      })
    : s;
}
export function riff(s: State): State {
  return award({
    ...s,
    credits: s.credits + rates(s).click,
    riffs: s.riffs + 1,
    gig: s.gig ? { ...s.gig, boost: Math.min(0.5, s.gig.boost + 0.005) } : null,
  });
}
export function recruit(s: State, id: string): State {
  const m = MUSICIANS.find((m) => m.id === id);
  if (!m || s.gig) return s;
  const owned = s.recruited.includes(id);
  if (!owned && s.credits < m.cost) return s;
  return award({
    ...s,
    credits: s.credits - (owned ? 0 : m.cost),
    recruited: owned ? s.recruited : [...s.recruited, id],
    lineup: { ...s.lineup, [m.role]: id },
  });
}
export function startGig(s: State, index: number, now = Date.now()): State {
  if (s.gig || !venueUnlocked(s, index)) return s;
  const v = VENUES[index],
    b = bonuses(s);
  return {
    ...s,
    gig: {
      index,
      started: now,
      ends: now + v.duration * 1000,
      credits: v.credits * b.credit,
      fans: Math.round(v.reward * b.fans),
      boost: 0,
    },
  };
}
export function startAlbum(s: State, index: number, now = Date.now()): State {
  const a = ALBUMS[index];
  if (
    !a ||
    s.recording ||
    s.albums.includes(index) ||
    s.fans < a.fans ||
    s.credits < a.cost
  )
    return s;
  return {
    ...s,
    credits: s.credits - a.cost,
    recording: {
      index,
      started: now,
      ends: now + (a.duration * 1000) / bonuses(s).album,
      fans: Math.round(a.reward * bonuses(s).fans),
      credits: 0,
      boost: 0,
    },
  };
}
export function award(s: State): State {
  const conditions: Record<string, boolean> = {
    "first-riff": s.riffs > 0,
    "hundred-riffs": s.riffs >= 100,
    "first-recruit": s.recruited.length > 0,
    "full-band": ROLES.every((r) => !!s.lineup[r]),
    "first-show": s.shows > 0,
    "first-album": s.albums.length > 0,
    "thousand-fans": s.fans >= 1000,
    orbital: s.orbital,
    legend: s.legend > 0,
  };
  const unlocked = Object.keys(conditions).filter(
    (k) => conditions[k] && !s.achievements.includes(k),
  );
  return unlocked.length
    ? { ...s, achievements: [...s.achievements, ...unlocked] }
    : s;
}
export type Report = {
  elapsed: number;
  passive: number;
  gigCredits: number;
  gigFans: number;
  albumFans: number;
  albumName: string | null;
  gigName: string | null;
};
export function advance(
  previous: State,
  now = Date.now(),
): { state: State; report: Report } {
  const end = Math.max(previous.lastSeen, now),
    elapsed = Math.min(end - previous.lastSeen, OFFLINE_CAP),
    incomeEnd = previous.lastSeen + elapsed;
  let s = { ...previous };
  let passive = (elapsed / 1000) * rates(s).passive;
  const report: Report = {
    elapsed: end - previous.lastSeen,
    passive: 0,
    gigCredits: 0,
    gigFans: 0,
    albumFans: 0,
    albumName: null,
    gigName: null,
  };
  if (s.recording && s.recording.ends <= end) {
    const a = s.recording;
    if (a.ends < incomeEnd)
      passive +=
        (Math.max(0, incomeEnd - Math.max(previous.lastSeen, a.ends)) / 1000) *
        ALBUMS[a.index].royalty *
        bonuses(s).credit;
    s = {
      ...s,
      albums: [...s.albums, a.index],
      fans: s.fans + a.fans,
      recording: null,
    };
    report.albumFans = a.fans;
    report.albumName = ALBUMS[a.index].name;
  }
  if (s.gig && s.gig.ends <= end) {
    const g = s.gig;
    report.gigCredits = g.credits * (1 + g.boost);
    report.gigFans = Math.round(g.fans * (1 + g.boost));
    report.gigName = VENUES[g.index].gig;
    s = {
      ...s,
      credits: s.credits + report.gigCredits,
      fans: s.fans + report.gigFans,
      shows: s.shows + 1,
      orbital: s.orbital || g.index === 5,
      gig: null,
    };
  }
  report.passive = passive;
  s = { ...s, credits: s.credits + passive, lastSeen: end };
  return { state: award(s), report };
}
export const legendReward = (s: State) =>
  Math.max(1, Math.floor(Math.sqrt(s.fans / 10000)));
export function prestige(s: State, now = Date.now()): State {
  if (!s.orbital) return s;
  return award({
    ...fresh(now),
    name: s.name,
    legend: s.legend + legendReward(s),
    era: s.era + 1,
    achievements: s.achievements,
    sound: s.sound,
    backgroundMusic: s.backgroundMusic,
    reducedMotion: s.reducedMotion,
    tutorial: false,
  });
}
export function serialize(s: State) {
  return JSON.stringify(s);
}
export function deserialize(raw: string): State {
  if (raw.length > 100000)
    throw new Error("This save is too large. Choose a NEON RIOT export.");
  let x: unknown;
  try {
    x = JSON.parse(raw);
  } catch {
    throw new Error(
      "This file is not a valid JSON save. Your current game is safe.",
    );
  }
  if (!x || typeof x !== "object" || Array.isArray(x))
    throw new Error("Invalid save data.");
  const s = x as State;
  if (s.backgroundMusic === undefined) s.backgroundMusic = true;
  if (s.version !== 1)
    throw new Error(
      "Unsupported save version. Your existing save has not been replaced.",
    );
  const num = (v: unknown, max = 1e100) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
  const int = (v: unknown, max = 1e9) => num(v, max) && Number.isInteger(v);
  if (
    typeof s.name !== "string" ||
    !s.name.trim() ||
    s.name.length > 32 ||
    !num(s.credits) ||
    !num(s.fans) ||
    !num(s.lastSeen, 8.64e15) ||
    !num(s.created, 8.64e15) ||
    s.created > s.lastSeen ||
    !int(s.legend) ||
    !int(s.era) ||
    s.era < 1 ||
    !int(s.shows) ||
    !int(s.riffs)
  )
    throw new Error("Save contains invalid progress values.");
  if (!s.gear || !GEAR.every((g) => int(s.gear[g.id], 1000)))
    throw new Error("Invalid equipment data.");
  if (
    !Array.isArray(s.recruited) ||
    s.recruited.length > 8 ||
    new Set(s.recruited).size !== s.recruited.length ||
    !s.recruited.every((id) => MUSICIANS.some((m) => m.id === id))
  )
    throw new Error("Invalid roster.");
  if (
    !s.lineup ||
    typeof s.lineup !== "object" ||
    Array.isArray(s.lineup) ||
    Object.keys(s.lineup).some((r) => !ROLES.includes(r as Role)) ||
    !ROLES.every(
      (r) =>
        s.lineup[r] === undefined ||
        MUSICIANS.some(
          (m) =>
            m.id === s.lineup[r] && m.role === r && s.recruited.includes(m.id),
        ),
    )
  )
    throw new Error("Invalid lineup.");
  if (
    !Array.isArray(s.albums) ||
    s.albums.length > 6 ||
    new Set(s.albums).size !== s.albums.length ||
    !s.albums.every((i) => int(i, 5))
  )
    throw new Error("Invalid album collection.");
  for (const a of [s.gig, s.recording])
    if (
      a !== null &&
      (!a ||
        !int(a.index, 5) ||
        !num(a.started, 8.64e15) ||
        !num(a.ends, 8.64e15) ||
        a.ends <= a.started ||
        !num(a.fans) ||
        !num(a.credits) ||
        !num(a.boost, 0.5))
    )
      throw new Error("Invalid activity data.");
  if (s.recording && s.albums.includes(s.recording.index))
    throw new Error("Album is already released.");
  if (
    !Array.isArray(s.achievements) ||
    s.achievements.length > ACHIEVEMENTS.length ||
    new Set(s.achievements).size !== s.achievements.length ||
    !s.achievements.every((a) =>
      ACHIEVEMENTS.some((entry) => entry.id === a),
    ) ||
    !["orbital", "tutorial", "sound", "backgroundMusic", "reducedMotion"].every(
      (k) => typeof s[k as keyof State] === "boolean",
    )
  )
    throw new Error("Invalid settings or achievements.");
  return s;
}
export function fmt(n: number, decimals = 0) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 10000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}
export function duration(seconds: number) {
  const n = Math.max(0, Math.ceil(seconds));
  return n >= 3600
    ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`
    : n >= 60
      ? `${Math.floor(n / 60)}m ${n % 60}s`
      : `${n}s`;
}

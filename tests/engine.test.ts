import { describe, it, expect } from "vitest";
import { ALBUMS, GEAR } from "../src/content";
import {
  advance,
  bonuses,
  buy,
  deserialize,
  fresh,
  gearCount,
  legendReward,
  OFFLINE_CAP,
  prestige,
  quote,
  rates,
  recruit,
  riff,
  serialize,
  startAlbum,
  startGig,
  venueIndex,
  type State,
} from "../src/engine";
const rich = (): State => ({
  ...fresh(100000),
  credits: 1e10,
  fans: 200000,
  gear: { guitar: 30, amp: 30, automation: 30, merch: 30, distribution: 30 },
});
describe("economy and roster", () => {
  it("starts from nothing and reaches first purchase with fifteen riffs", () => {
    let s = fresh(0);
    for (let i = 0; i < 15; i++) s = riff(s);
    expect(s.credits).toBe(15);
    s = buy(s, "guitar", 1);
    expect(s.credits).toBe(0);
    expect(rates(s)).toEqual({ click: 2, passive: 0.3 });
    expect(s.achievements).toContain("first-riff");
  });
  it("never buys unaffordable upgrades or empty max purchases", () => {
    const s = fresh(0);
    expect(buy(s, "guitar", 1)).toBe(s);
    expect(buy(s, "guitar", "max")).toBe(s);
  });
  it("bulk purchase costs equal sequential purchases and prices grow", () => {
    let s = { ...fresh(0), credits: 10000 };
    const cost = quote(s, "amp", 10).cost;
    const bulk = buy(s, "amp", 10);
    for (let i = 0; i < 10; i++) s = buy(s, "amp", 1);
    expect(s.gear).toEqual(bulk.gear);
    expect(s.credits).toBe(10000 - cost);
    expect(quote(s, "amp", 1).cost).toBeGreaterThan(150);
  });
  it("max buys everything affordable without allowing debt", () => {
    const s = buy({ ...fresh(0), credits: 500 }, "guitar", "max");
    expect(s.gear.guitar).toBeGreaterThan(1);
    expect(s.credits).toBeGreaterThanOrEqual(0);
    expect(s.credits).toBeLessThan(quote(s, "guitar", 1).cost);
  });
  it("recruits once, switches for free and locks lineup during shows", () => {
    let s = recruit({ ...fresh(0), credits: 300 }, "hex");
    expect(s.credits).toBe(200);
    expect(rates(s).passive).toBeCloseTo(2.2);
    s = recruit(s, "crash");
    expect(s.credits).toBe(100);
    expect(bonuses(s).fans).toBe(1.2);
    s = recruit(s, "hex");
    expect(s.credits).toBe(100);
    s = startGig(s, 0, 0);
    expect(recruit(s, "crash")).toBe(s);
  });
  it("requires fans and gear to unlock a venue", () => {
    let s = { ...fresh(0), fans: 100 };
    expect(venueIndex(s)).toBe(0);
    expect(startGig(s, 1, 0)).toBe(s);
    s.gear.guitar = 8;
    expect(venueIndex(s)).toBe(1);
  });
});
describe("time, offline production and projects", () => {
  it("uses elapsed seconds independently of tick frequency", () => {
    const s = buy({ ...fresh(0), credits: 15 }, "guitar", 1);
    let many = s;
    for (let i = 1; i <= 120; i++) many = advance(many, i * 1000).state;
    const one = advance(s, 120000).state;
    expect(many.credits).toBeCloseTo(one.credits);
  });
  it("caps offline income at 24 hours and never awards it twice", () => {
    const s = buy({ ...fresh(0), credits: 15 }, "guitar", 1);
    const a = advance(s, 3 * OFFLINE_CAP);
    expect(a.report.passive).toBe(0.3 * 86400);
    expect(advance(a.state, 3 * OFFLINE_CAP).report.passive).toBe(0);
  });
  it("does not move lastSeen backward or duplicate income after clock reversal", () => {
    const s = buy({ ...fresh(100000), credits: 15 }, "guitar", 1);
    const backward = advance(s, 0);
    expect(backward.state.lastSeen).toBe(100000);
    expect(backward.report.passive).toBe(0);
    expect(advance(backward.state, 101000).report.passive).toBe(0.3);
  });
  it("snapshots show rewards, caps click boost and pays exactly once", () => {
    let s = startGig(fresh(0), 0, 0);
    for (let i = 0; i < 200; i++) s = riff(s);
    expect(s.gig?.boost).toBe(0.5);
    expect(startGig(s, 0, 100)).toBe(s);
    const a = advance(s, 60000);
    expect(a.report.gigCredits).toBe(180);
    expect(a.report.gigFans).toBe(45);
    expect(a.state.shows).toBe(1);
    expect(a.state.gig).toBeNull();
    expect(advance(a.state, 70000).report.gigCredits).toBe(0);
  });
  it("can record alongside a gig and only pays royalties after completion", () => {
    let s = { ...fresh(0), credits: 500 };
    s = startAlbum(s, 0, 0);
    s = startGig(s, 0, 0);
    expect(s.gig).not.toBeNull();
    expect(s.recording).not.toBeNull();
    expect(startAlbum(s, 1, 0)).toBe(s);
    const a = advance(s, 700000);
    expect(a.report.passive).toBe(200);
    expect(a.report.albumFans).toBe(100);
    expect(a.state.albums).toEqual([0]);
    expect(a.state.recording).toBeNull();
    expect(advance(a.state, 800000).report.albumFans).toBe(0);
    expect(startAlbum(a.state, 0, 800000)).toBe(a.state);
  });
  it("finishes long projects beyond the income cap but does not invent royalties", () => {
    let s = startAlbum(rich(), 5, 100000);
    s.recording!.ends = 100000 + OFFLINE_CAP * 2;
    const a = advance(s, 100000 + OFFLINE_CAP * 3);
    expect(a.state.albums).toContain(5);
    expect(a.report.passive).toBeCloseTo(rates(s).passive * 86400);
  });
  it("gives the same income whether album completion is processed in one or multiple advances", () => {
    const s = startAlbum({ ...fresh(0), credits: 500 }, 0, 0);
    const once = advance(s, 900000).state;
    const twice = advance(advance(s, 600000).state, 900000).state;
    expect(once.credits).toBeCloseTo(twice.credits);
  });
  it("faster musicians shorten recording time at project start", () => {
    const s = recruit(rich(), "zero");
    const a = startAlbum(s, 0, 100000);
    expect(a.recording!.ends - 100000).toBeCloseTo(
      (ALBUMS[0].duration * 1000) / 1.35,
    );
  });
});
describe("legacy and saves", () => {
  it("requires the orbital show before prestige, then resets era progress only", () => {
    let s = rich();
    expect(prestige(s, 200000)).toBe(s);
    s = { ...s, name: "Iron Ghost", sound: true, reducedMotion: true };
    s = startGig(s, 5, 100000);
    s = advance(s, s.gig!.ends).state;
    const reward = legendReward(s);
    const p = prestige(s, s.lastSeen);
    expect(p.legend).toBe(reward);
    expect(p.era).toBe(2);
    expect(p.name).toBe("Iron Ghost");
    expect(p.sound).toBe(true);
    expect(p.reducedMotion).toBe(true);
    expect(p.credits).toBe(0);
    expect(p.fans).toBe(0);
    expect(gearCount(p)).toBe(0);
    expect(p.albums).toEqual([]);
    expect(p.recruited).toEqual([]);
    expect(p.achievements).toContain("orbital");
    expect(p.achievements).toContain("legend");
    expect(rates(p).click).toBeCloseTo(1 + reward * 0.1);
  });
  it("round-trips complete state", () => {
    let s = recruit(rich(), "hex");
    s = startAlbum(s, 0, 100000);
    s = startGig(s, 2, 100000);
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it.each([
    "{",
    "null",
    "[]",
    '{"version":2}',
    JSON.stringify({ ...fresh(0), credits: -1 }),
    JSON.stringify({ ...fresh(0), credits: null }),
    JSON.stringify({ ...fresh(0), gear: {} }),
    JSON.stringify({ ...fresh(0), lineup: { drums: "missing" } }),
    JSON.stringify({ ...fresh(0), gig: { index: 99 } }),
    JSON.stringify({ ...fresh(0), albums: [0, 0] }),
  ])("rejects malformed or unsupported save %s", (raw) => {
    expect(() => deserialize(raw)).toThrow();
  });
  it("validates all normal purchase levels and imported values are finite", () => {
    const s = rich();
    for (const g of GEAR)
      expect(Number.isFinite(quote(s, g.id, 10).cost)).toBe(true);
    expect(() => deserialize(serialize({ ...s, credits: Infinity }))).toThrow();
  });
});

it("migrates old music settings and preserves mute through saves and prestige", () => {
  const old = JSON.parse(serialize(fresh()));
  delete old.backgroundMusic;
  expect(deserialize(JSON.stringify(old)).backgroundMusic).toBe(true);
  const muted = { ...fresh(), backgroundMusic: false, orbital: true };
  expect(deserialize(serialize(muted)).backgroundMusic).toBe(false);
  expect(prestige(muted).backgroundMusic).toBe(false);
  expect(() =>
    deserialize(JSON.stringify({ ...muted, backgroundMusic: "off" })),
  ).toThrow();
});

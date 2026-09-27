import { it, expect } from "vitest";
import { ALBUMS, GEAR } from "../src/content";
import {
  advance,
  bonuses,
  buy,
  fresh,
  quote,
  recruit,
  riff,
  startAlbum,
  startGig,
  venueIndex,
} from "../src/engine";
function simulate(gapHours: number) {
  let s = fresh(0);
  let firstRecruit = 0,
    firstGig: number | null = null;
  const unlocks: Record<number, number> = { 0: 0 };
  for (let session = 0; session < 50 && !s.orbital; session++) {
    const start = session * gapHours * 3600000;
    s = advance(s, start).state;
    for (let t = 0; t < 300 && !s.orbital; t++) {
      const now = start + t * 1000;
      s = advance(s, now).state;
      // Five-minute visits, two deliberate clicks per second; purchases every five seconds.
      s = riff(riff(s));
      if (t % 5 === 0) {
        for (const id of ["hex", "echo", "nyx", "zero"]) {
          const before = s;
          s = recruit(s, id);
          if (!firstRecruit && s.recruited.length > 0 && s !== before)
            firstRecruit = now;
        }
        for (let i = ALBUMS.length - 1; i >= 0; i--) s = startAlbum(s, i, now);
        // Keep a small cash reserve for recruits and recordings.
        for (let n = 0; n < 20; n++) {
          const available = GEAR.filter(
            (g) => quote(s, g.id, 1).cost <= s.credits * 0.65,
          ).sort(
            (a, b) =>
              quote(s, a.id, 1).cost /
                (a.passive * bonuses(s).credit + a.click * 0.15) -
              quote(s, b.id, 1).cost /
                (b.passive * bonuses(s).credit + b.click * 0.15),
          );
          if (!available.length) break;
          s = buy(s, available[0].id, 1);
        }
      }
      const v = venueIndex(s);
      if (unlocks[v] === undefined) unlocks[v] = now / 3600000;
      const before = s;
      s = startGig(s, v, now);
      if (firstGig === null && s !== before) firstGig = now;
    }
  }
  return {
    state: s,
    days: s.lastSeen / 86400000,
    firstRecruit: firstRecruit / 1000,
    firstGig: (firstGig ?? Infinity) / 1000,
    unlocks,
  };
}
it.each([8, 12])(
  "reaches first prestige in 3–5 days with visits every %i hours",
  (gap) => {
    const result = simulate(gap);
    console.log(
      JSON.stringify({
        gapHours: gap,
        days: result.days,
        firstRecruitSeconds: result.firstRecruit,
        firstGigSeconds: result.firstGig,
        venueUnlockHours: result.unlocks,
        credits: result.state.credits,
        fans: result.state.fans,
        gear: result.state.gear,
      }),
    );
    expect(result.state.orbital).toBe(true);
    expect(result.firstRecruit).toBeLessThan(300);
    expect(result.firstGig).toBeLessThan(600);
    expect(result.days).toBeGreaterThanOrEqual(3);
    expect(result.days).toBeLessThanOrEqual(5);
  },
);

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BandAudio } from "../src/BandAudio";

let sources: any[], gains: any[], contexts: any[];
const param = () => ({
  value: 0,
  setTargetAtTime: vi.fn(),
  cancelAndHoldAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  setValueAtTime: vi.fn(),
});
beforeEach(() => {
  vi.useFakeTimers();
  sources = [];
  gains = [];
  contexts = [];
  vi.stubGlobal(
    "AudioContext",
    class {
      currentTime = 10;
      destination = {};
      constructor() {
        contexts.push(this);
      }
      resume = vi.fn(async () => {});
      decodeAudioData = vi.fn(async () => ({ duration: 270 }));
      createGain() {
        const gain = { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
        gains.push(gain);
        return gain;
      }
      createBufferSource() {
        const source = {
          start: vi.fn(),
          stop: vi.fn(),
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
        sources.push(source);
        return source;
      }
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(4),
    })),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const make = () =>
  new BandAudio(
    (["guitar", "drums", "bass", "vocals", "synth"] as const).map((role) => ({
      role,
      src: `/${role}.mp3`,
      volume: 1,
    })),
  );

it("starts aligned stems and changes active roles without restarting", async () => {
  const band = make();
  await band.riff();
  expect(sources).toHaveLength(5);
  expect(sources.map((s) => s.start.mock.calls[0][0])).toEqual(
    Array(5).fill(10.015),
  );
  expect(gains.slice(1).map((g) => g.gain.value)).toEqual([1, 0, 0, 0, 0]);
  band.setLineup({ bass: "echo", drums: "hex" });
  expect(
    gains.slice(1).map((g) => g.gain.setTargetAtTime.mock.lastCall[0]),
  ).toEqual([1, 1, 1, 0, 0]);
  await band.riff();
  expect(sources).toHaveLength(5);
  band.setLineup({ drums: "crash", vocals: "nyx", synth: "zero" });
  expect(
    gains.slice(1).map((g) => g.gain.setTargetAtTime.mock.lastCall[0]),
  ).toEqual([1, 1, 0, 1, 1]);
  band.stop();
  expect(sources.every((s) => s.stop.mock.calls.length === 1)).toBe(true);
});

it("rapid clicks extend playback, inactivity releases it, and the next burst restarts", async () => {
  const band = make();
  await band.riff();
  await vi.advanceTimersByTimeAsync(700);
  await band.riff();
  await vi.advanceTimersByTimeAsync(700);
  expect(sources[0].stop).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(700);
  expect(sources[0].stop).toHaveBeenCalledOnce();
  await band.riff();
  expect(sources).toHaveLength(10);
  expect(fetch).toHaveBeenCalledTimes(5);
});

it("does not start a delayed load after mute", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      await gate;
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) };
    }),
  );
  const band = make();
  const pending = band.riff();
  band.stop();
  release();
  await pending;
  expect(sources).toHaveLength(0);
});

it("retries failed asset loads on the next request", async () => {
  const band = make();
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  await band.riff();
  expect(sources).toHaveLength(0);
  await band.riff();
  expect(sources).toHaveLength(5);
});

it("does not play a late first download after clicking has stopped", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      await gate;
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) };
    }),
  );
  const band = make();
  const pending = band.riff();
  await vi.advanceTimersByTimeAsync(2000);
  release();
  await pending;
  expect(sources).toHaveLength(0);
  await band.riff();
  expect(sources).toHaveLength(5);
});

import type { Role } from "./content";

export const RIFF_IDLE_MS = 1000;
export const RIFF_RELEASE_MS = 170;

export type StemRole = "guitar" | Role;
export type StemAsset = { role: StemRole; src: string; volume: number };

// All stems share one AudioContext clock; recruitment changes only their gains.
export class BandAudio {
  private context?: AudioContext;
  private buffers = new Map<StemRole, AudioBuffer>();
  private loading?: Promise<void>;
  private voices: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    asset: StemAsset;
  }[] = [];
  private master?: GainNode;
  private lineup: Partial<Record<Role, string>> = {};
  private deadline = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;

  constructor(private assets: StemAsset[]) {}

  prepare() {
    if (this.loading) return this.loading;
    this.context ??= new AudioContext({ sampleRate: 32000 });
    const context = this.context;
    this.loading = Promise.all(
      this.assets.map(async (asset) => {
        if (this.buffers.has(asset.role)) return;
        const response = await fetch(asset.src);
        if (!response.ok) throw new Error(`Audio unavailable: ${asset.role}`);
        this.buffers.set(
          asset.role,
          await context.decodeAudioData(await response.arrayBuffer()),
        );
      }),
    )
      .then(() => undefined)
      .catch((error) => {
        this.loading = undefined; // A later interaction can retry a failed download.
        throw error;
      });
    return this.loading;
  }

  setLineup(lineup: Partial<Record<Role, string>>) {
    this.lineup = { ...lineup };
    for (const voice of this.voices) {
      voice.gain.gain.setTargetAtTime(
        this.level(voice.asset),
        this.context!.currentTime,
        0.04,
      );
    }
  }

  private level(asset: StemAsset) {
    return asset.role === "guitar" || this.lineup[asset.role]
      ? asset.volume
      : 0;
  }

  async riff() {
    this.deadline = performance.now() + RIFF_IDLE_MS;
    const generation = this.generation;
    try {
      const loading = this.prepare();
      await this.context!.resume();
      await loading;
      if (generation !== this.generation || performance.now() >= this.deadline)
        return;
      const context = this.context!;
      if (!this.voices.length) {
        this.master = context.createGain();
        this.master.connect(context.destination);
        this.master.gain.value = 0;
        const start = context.currentTime + 0.015;
        const loopEnd = Math.min(
          ...[...this.buffers.values()].map((b) => b.duration),
        );
        this.voices = this.assets.map((asset) => {
          const source = context.createBufferSource();
          const gain = context.createGain();
          source.buffer = this.buffers.get(asset.role)!;
          source.loop = true;
          source.loopEnd = loopEnd;
          gain.gain.value = this.level(asset);
          source.connect(gain);
          gain.connect(this.master!);
          source.start(start);
          return { source, gain, asset };
        });
      }
      const master = this.master!.gain;
      master.cancelAndHoldAtTime(context.currentTime);
      master.linearRampToValueAtTime(0.45, context.currentTime + 0.015);
      const release =
        context.currentTime +
        Math.max(0, this.deadline - performance.now()) / 1000;
      master.setValueAtTime(0.45, release);
      master.linearRampToValueAtTime(0, release + 0.15);
      clearTimeout(this.timer);
      this.timer = setTimeout(
        () => this.stop(),
        Math.max(0, this.deadline - performance.now()) + RIFF_RELEASE_MS,
      );
    } catch {
      // Optional audio must never prevent earning a riff or recruiting a member.
    }
  }

  stop() {
    this.generation++;
    this.deadline = 0;
    clearTimeout(this.timer);
    for (const { source, gain } of this.voices) {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    this.voices = [];
    this.master?.disconnect();
    this.master = undefined;
  }
}

import { BandAudio } from "./BandAudio";
import type { Role } from "./content";

const band = new BandAudio(
  (["guitar", "drums", "bass", "vocals", "synth"] as const).map((role) => ({
    role,
    src: `${import.meta.env.BASE_URL}audio/band/${role}.mp3`,
    volume: 1,
  })),
);
export const stopRiff = () => band.stop();
export const setBandLineup = (lineup: Partial<Record<Role, string>>) =>
  band.setLineup(lineup);
export const prepareBandAudio = () => {
  try {
    void band.prepare().catch(() => {});
  } catch {
    // Browsers without Web Audio can still run the game.
  }
};

let context: AudioContext | undefined;
export function playSound(kind: "riff" | "buy") {
  try {
    if (kind === "riff") {
      void band.riff();
      return;
    }
    context ??= new AudioContext();
    void context.resume();
    const now = context.currentTime;
    for (const [offset, freq] of [
      [0, 440],
      [0.09, 660],
    ]) {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        filter = context.createBiquadFilter();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now + offset);
      filter.type = "lowpass";
      filter.frequency.value = 800;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.035, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.25);
    }
  } catch {
    /* Audio is optional; gameplay always continues. */
  }
}

let context: AudioContext | undefined;
export function playSound(kind: "riff" | "buy") {
  try {
    context ??= new AudioContext();
    void context.resume();
    const now = context.currentTime;
    for (const [offset, freq] of kind === "riff"
      ? [
          [0, 82.41],
          [0.015, 123.47],
          [0.03, 164.81],
        ]
      : [
          [0, 440],
          [0.09, 660],
        ]) {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        filter = context.createBiquadFilter();
      oscillator.type = kind === "riff" ? "sawtooth" : "sine";
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

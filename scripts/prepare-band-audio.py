"""Convert one aligned Suno stem export into the five game layers.

Requires numpy and imageio-ffmpeg. Usage: python prepare-band-audio.py STEM_DIR
Original exports remain unchanged. All layers receive the same trim and gain.
"""
from pathlib import Path
import json
import subprocess
import sys
import numpy as np
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
output = root / "public/audio/band"
output.mkdir(parents=True, exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
rate = 32000
files = {}
for path in source.glob("*.mp3"):
    label = path.stem.split(" ", 1)[1].lower()
    raw = subprocess.check_output([ffmpeg, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(rate), "-"])
    files[label] = np.frombuffer(raw, dtype="<f4")

mapping = {
    "guitar": ["guitar"], "drums": ["drums", "percussion"],
    "bass": ["bass"], "vocals": ["lead vocals", "backing vocals"],
    "synth": ["synth", "keyboard"],
}
lengths = {len(x) for x in files.values()}
if len(lengths) != 1:
    raise ValueError(f"Stems are not aligned: sample lengths {lengths}")
length = lengths.pop()
layers = {}
for role, labels in mapping.items():
    matches = [files[label] for label in labels if label in files]
    if not matches:
        raise ValueError(f"Missing required layer: {role}")
    layers[role] = np.sum(matches, axis=0)
    if np.sqrt(np.mean(layers[role] ** 2)) < 0.001:
        raise ValueError(f"Near-silent layer: {role}; review source generation")

# Find the first audible guitar attack in 10 ms windows, retaining 5 ms preroll.
window = rate // 100
energy = np.sqrt(np.mean(layers["guitar"][:length // window * window].reshape(-1, window) ** 2, axis=1))
onsets = np.flatnonzero(energy > 0.005)
if not len(onsets):
    raise ValueError("No audible guitar attack")
trim = max(0, int(onsets[0]) * window - 160)
layers = {role: samples[trim:].copy() for role, samples in layers.items()}
length -= trim

# Keep a common timeline. Brief endpoint ramps prevent a discontinuity at looping.
for samples in layers.values():
    samples[:160] *= np.linspace(0, 1, 160)
    samples[-1600:] *= np.linspace(1, 0, 1600)
# Headroom for every possible subset, rather than only the full-band mix.
worst_peak = float(np.max(sum(np.abs(x) for x in layers.values())))
scale = min(1.0, 0.88 / worst_peak)
report = {"trimStartSeconds": trim / rate, "sampleRate": rate, "duration": length / rate, "commonGain": scale, "layers": {}}
for role, samples in layers.items():
    samples *= scale
    subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "f32le", "-ar", str(rate), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "96k", str(output / f"{role}.mp3")], input=samples.astype("<f4").tobytes(), check=True)
    report["layers"][role] = {"rms": float(np.sqrt(np.mean(samples ** 2))), "peak": float(np.max(np.abs(samples)))}
(output / "mix-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))

"""Audio Agent: mastering, stem separation, and analysis via FFmpeg + Demucs."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


class AudioAgent:
    """Handles audio mastering, stem separation, and musical analysis."""

    def analyze(self, audio_path: str) -> dict[str, Any]:
        """Extract BPM, key, duration, and energy from an audio file."""
        try:
            import librosa
            import numpy as np

            y, sr = librosa.load(audio_path, mono=True)
            duration = librosa.get_duration(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            key_idx = int(np.argmax(np.mean(chroma, axis=1)))
            key_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
            energy = float(np.mean(librosa.feature.rms(y=y)))

            return {
                "bpm": round(float(tempo), 1),
                "key": key_names[key_idx],
                "duration_sec": round(duration, 2),
                "energy": round(energy * 1000, 3),
                "provider": "librosa",
            }
        except ImportError:
            return self._analyze_ffprobe(audio_path)

    def _analyze_ffprobe(self, audio_path: str) -> dict[str, Any]:
        """Fallback analysis using ffprobe only."""
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", audio_path],
            capture_output=True, text=True
        )
        import json
        data = json.loads(result.stdout) if result.returncode == 0 else {}
        streams = data.get("streams", [{}])
        duration = float(streams[0].get("duration", 0)) if streams else 0
        return {"bpm": None, "key": None, "duration_sec": round(duration, 2), "energy": None, "provider": "ffprobe"}

    def master(self, input_path: str, output_path: str, preset: str = "balanced") -> dict[str, Any]:
        """Apply a mastering chain: normalize → EQ → compress → limit.

        Target: -14 LUFS, -1 dBTP peak.
        """
        presets = {
            "balanced": "loudnorm=I=-14:TP=-1:LRA=11,acompressor=threshold=-18dB:ratio=3:attack=5:release=60",
            "punchy": "loudnorm=I=-14:TP=-1:LRA=7,acompressor=threshold=-20dB:ratio=4:attack=2:release=40",
            "warm": "loudnorm=I=-16:TP=-1:LRA=12,equalizer=f=200:width_type=o:width=2:g=2",
        }
        af_chain = presets.get(preset, presets["balanced"])

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-af", af_chain,
            "-ar", "44100", "-ab", "320k",
            "-map_metadata", "0",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg mastering failed: {result.stderr}")

        return {"output_path": output_path, "preset": preset, "cost_usd": 0.005, "provider": "ffmpeg"}

    def separate_stems(self, input_path: str, output_dir: str) -> dict[str, Any]:
        """Separate audio into stems using Demucs.

        Returns paths for vocals, drums, bass, other.
        """
        try:
            import demucs.separate
            import torch

            os.makedirs(output_dir, exist_ok=True)
            demucs.separate.main([
                "--two-stems", "vocals",
                "-n", "htdemucs",
                "-o", output_dir,
                input_path,
            ])

            # Demucs outputs to: {output_dir}/htdemucs/{track_name}/
            track_name = Path(input_path).stem
            stems_dir = Path(output_dir) / "htdemucs" / track_name

            stems = {}
            for stem_file in stems_dir.glob("*.wav"):
                stems[stem_file.stem] = str(stem_file)

            return {"stems": stems, "cost_usd": 0.020, "provider": "demucs"}
        except ImportError:
            raise RuntimeError("Demucs not installed. Run: pip install demucs")

    def extract_clip(self, input_path: str, output_path: str, start_sec: float, duration_sec: float) -> dict[str, Any]:
        """Extract a short clip from audio."""
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_sec),
            "-i", input_path,
            "-t", str(duration_sec),
            "-c", "copy",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"Clip extraction failed: {result.stderr}")
        return {"output_path": output_path, "start_sec": start_sec, "duration_sec": duration_sec}

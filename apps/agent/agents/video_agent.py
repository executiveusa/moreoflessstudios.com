"""Video Agent: scene planning, fal.ai orchestration, and FFmpeg stitching."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from apps.agent.agents.audio_agent import AudioAgent
from apps.agent.agents.character_agent import CharacterAgent
from apps.agent.providers import falai


MOOD_TO_VISUAL: dict[str, str] = {
    "energetic": "dynamic motion, fast cuts, vibrant colors",
    "calm": "slow pan, soft lighting, muted tones",
    "dark": "shadows, contrast, moody atmosphere",
    "euphoric": "bright lights, crowd, celebration",
    "mysterious": "fog, silhouettes, deep shadows",
}


class VideoAgent:
    """Plans and generates music videos from audio."""

    def __init__(self):
        self._audio = AudioAgent()
        self._character = CharacterAgent()

    def plan_scenes(self, audio_path: str, style: str, num_scenes: int = 3) -> list[dict[str, Any]]:
        """Analyze audio and return a scene breakdown."""
        analysis = self._audio.analyze(audio_path)
        duration = analysis.get("duration_sec", 180)
        energy = analysis.get("energy", 0.5)
        bpm = analysis.get("bpm") or 120

        mood = "energetic" if energy > 0.5 else "calm"
        visual_hint = MOOD_TO_VISUAL.get(mood, "cinematic, atmospheric")

        scene_duration = duration / num_scenes
        scenes = []
        for i in range(num_scenes):
            start = i * scene_duration
            scene_num = i + 1
            scenes.append({
                "id": f"scene_{scene_num}",
                "index": i,
                "start_sec": round(start, 1),
                "duration_sec": round(scene_duration, 1),
                "mood": mood,
                "prompt": f"{style} aesthetic, {visual_hint}, scene {scene_num} of {num_scenes}, "
                          f"music video, cinematic 4K, {bpm} BPM energy, professional production",
                "estimated_cost_usd": 0.50,
            })
        return scenes

    async def generate_scene(
        self,
        scene: dict[str, Any],
        character_id: str | None = None,
        character_data: dict | None = None,
    ) -> dict[str, Any]:
        """Generate a single video clip for a scene."""
        prompt = scene["prompt"]

        if character_id and character_data:
            prompt = self._character.inject_prompt(prompt, character_data)

        result = await falai.generate_video_clip(
            prompt=prompt,
            duration_seconds=min(int(scene["duration_sec"]), 8),
        )
        return {**scene, "video_url": result["url"], "actual_cost_usd": result["cost_usd"]}

    def stitch_video(
        self,
        clip_paths: list[str],
        audio_path: str,
        output_path: str,
        fade_duration: float = 0.5,
    ) -> dict[str, Any]:
        """Stitch video clips and sync to audio using FFmpeg."""
        if not clip_paths:
            raise ValueError("No clips to stitch")

        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as concat_file:
            for clip in clip_paths:
                concat_file.write(f"file '{clip}'\n")
            concat_path = concat_file.name

        # Step 1: concatenate clips
        concat_output = output_path.replace(".mp4", "_concat.mp4")
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_path,
             "-c", "copy", concat_output],
            capture_output=True, check=True,
        )

        # Step 2: mix in original audio
        cmd = [
            "ffmpeg", "-y",
            "-i", concat_output,
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k",
            "-map", "0:v:0", "-map", "1:a:0",
            "-shortest",
            "-vf", f"fade=t=in:st=0:d={fade_duration}",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, check=True)
        os.unlink(concat_path)
        os.unlink(concat_output)

        return {"output_path": output_path, "clips_stitched": len(clip_paths), "cost_usd": 0.005}

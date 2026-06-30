"""
Video Generation Orchestrator: end-to-end music video creation
Analyzes audio → Plans scenes → Generates clips → Stitches → Uploads
"""

import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Any

# These would import from actual implementations in production
# from agents.audio_agent import AudioAgent
# from agents.video_agent import VideoAgent
# from agents.character_agent import CharacterAgent
# from providers.falai import FalAIClient


class VideoOrchestrator:
    """Orchestrates complete video generation pipeline"""

    def __init__(self, supabase_client=None, r2_client=None):
        self.supabase = supabase_client
        self.r2 = r2_client
        self.audio_agent = None  # AudioAgent()
        self.video_agent = None  # VideoAgent()
        self.character_agent = None  # CharacterAgent()

    async def generate_music_video(
        self, job_id: str, input_asset_id: str, params: dict[str, Any], user_id: str
    ) -> dict[str, Any]:
        """
        End-to-end music video generation

        1. Download audio from R2
        2. Analyze audio (BPM, key, structure)
        3. Plan scenes (1 per structural section)
        4. Fetch character passport if specified
        5. Generate each scene via fal.ai
        6. Stitch clips + add audio + color grade
        7. Upload output video to R2
        8. Update job record with output_asset_id
        """

        temp_dir = tempfile.mkdtemp()

        try:
            # Update job status
            await self._update_job_status(job_id, "processing", 10)

            # 1. Download input audio
            audio_path = await self._download_asset(input_asset_id, temp_dir)
            if not audio_path:
                raise Exception(f"Failed to download asset {input_asset_id}")

            # 2. Analyze audio
            await self._update_job_status(job_id, "processing", 20)
            audio_analysis = self.audio_agent.analyze(str(audio_path))
            # Returns: {bpm, key, energy, structure, duration, keyframes}

            # 3. Plan scenes
            await self._update_job_status(job_id, "processing", 30)
            scene_plan = self._plan_scenes(audio_analysis, params)
            # Returns list of scenes with timestamps, mood, character hints

            # 4. Fetch character if specified
            character_data = None
            if params.get("character_id"):
                character_data = await self._fetch_character(params["character_id"])

            # 5. Generate scenes
            scene_clips = []
            num_scenes = len(scene_plan["scenes"])

            for idx, scene in enumerate(scene_plan["scenes"]):
                await self._update_job_status(
                    job_id, "processing", 35 + (50 * idx / max(num_scenes, 1))
                )

                # Inject character into scene prompt
                scene_prompt = scene["prompt"]
                if character_data:
                    scene_prompt = self.character_agent.inject_prompt(
                        scene_prompt, character_data
                    )

                # Generate via fal.ai LTX-Video (8-second clips at 1080p)
                clip_path = await self._generate_scene_via_falai(
                    scene_prompt,
                    duration=8,
                    model="fal.ai/ltx-video-x",  # or similar
                )

                if not clip_path:
                    raise Exception(f"Failed to generate scene {idx}")

                scene_clips.append(clip_path)

            # 6. Stitch clips + add audio + color grade
            await self._update_job_status(job_id, "processing", 90)
            output_video = await self._stitch_video(
                scene_clips, str(audio_path), temp_dir, params.get("style", "cinematic")
            )

            if not output_video:
                raise Exception("Failed to stitch video")

            # 7. Upload to R2
            r2_key = f"{user_id}/videos/{job_id}/output.mp4"
            r2_url = await self._upload_to_r2(output_video, r2_key)

            # 8. Create asset record + update job
            asset_data = await self.supabase.from_("mol_assets").insert(
                {
                    "project_id": (
                        await self.supabase.from_("mol_jobs")
                        .select("project_id")
                        .eq("id", job_id)
                        .single()
                    )["data"]["project_id"],
                    "user_id": user_id,
                    "type": "video",
                    "r2_key": r2_key,
                    "filename": f"video_{job_id}.mp4",
                    "mime_type": "video/mp4",
                    "size_bytes": Path(output_video).stat().st_size,
                    "duration_sec": audio_analysis["duration"],
                    "metadata": {
                        "bpm": audio_analysis["bpm"],
                        "key": audio_analysis["key"],
                        "character_id": params.get("character_id"),
                        "style": params.get("style"),
                    },
                }
            ).execute()

            output_asset_id = asset_data["data"][0]["id"]

            # Update job
            await self.supabase.from_("mol_jobs").update(
                {
                    "status": "completed",
                    "progress": 100,
                    "output_asset_id": output_asset_id,
                    "result": {
                        "video_url": r2_url,
                        "scenes_generated": num_scenes,
                        "duration_sec": audio_analysis["duration"],
                    },
                }
            ).eq("id", job_id).execute()

            return {"success": True, "output_asset_id": output_asset_id, "r2_key": r2_key}

        except Exception as e:
            # Mark as failed
            await self.supabase.from_("mol_jobs").update(
                {"status": "failed", "error": str(e), "progress": 0}
            ).eq("id", job_id).execute()

            return {"success": False, "error": str(e)}

        finally:
            # Cleanup temp files
            import shutil

            shutil.rmtree(temp_dir, ignore_errors=True)

    async def _update_job_status(self, job_id: str, status: str, progress: int):
        """Update job progress"""
        await self.supabase.from_("mol_jobs").update(
            {"status": status, "progress": min(progress, 100)}
        ).eq("id", job_id).execute()

    async def _download_asset(self, asset_id: str, dest_dir: str) -> str | None:
        """Download asset from R2"""
        # Get asset metadata
        asset = (
            await self.supabase.from_("mol_assets")
            .select("r2_key, filename")
            .eq("id", asset_id)
            .single()
            .execute()
        )

        if not asset["data"]:
            return None

        # Download from R2
        output_path = Path(dest_dir) / asset["data"]["filename"]
        # await self.r2.download_file(asset["data"]["r2_key"], str(output_path))
        return str(output_path)

    def _plan_scenes(self, analysis: dict, params: dict) -> dict:
        """Plan video scenes based on audio structure"""
        # Use analysis.structure to divide audio into logical sections
        # Create 1 scene per section
        # Return: {scenes: [{timestamp, duration, prompt, mood, character_hint}]}

        scenes = []
        structure = analysis.get("structure", [])

        for section in structure:
            scene = {
                "timestamp": section["start"],
                "duration": section["end"] - section["start"],
                "prompt": f"A {params.get('style', 'cinematic')} scene for {section['label']}",
                "mood": section.get("mood", "neutral"),
                "character_hint": params.get("character_name", ""),
            }
            scenes.append(scene)

        return {"scenes": scenes, "total_duration": analysis["duration"]}

    async def _fetch_character(self, character_id: str) -> dict | None:
        """Fetch character passport"""
        char = (
            await self.supabase.from_("mol_characters")
            .select("*")
            .eq("id", character_id)
            .single()
            .execute()
        )
        return char["data"] if char["data"] else None

    async def _generate_scene_via_falai(self, prompt: str, duration: int = 8, **kwargs) -> str | None:
        """Generate video scene via fal.ai LTX-Video"""
        # Call fal.ai API: llm.fal.ai for video generation
        # Return local path to generated MP4
        # This would integrate with FalAIClient
        pass

    async def _stitch_video(self, clips: list[str], audio_path: str, temp_dir: str, style: str) -> str | None:
        """Stitch clips + add audio + color grade"""
        output_path = Path(temp_dir) / "output.mp4"

        try:
            # Create concat demuxer file
            concat_file = Path(temp_dir) / "concat.txt"
            with open(concat_file, "w") as f:
                for clip in clips:
                    f.write(f"file '{clip}'\n")

            # FFmpeg: concat clips → add audio → color grade
            cmd = [
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", str(concat_file),
                "-i", audio_path,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-vf", f"fade=t=in:st=0:d=0.5,fade=t=out:st={len(clips)*8-0.5}:d=0.5,eq=saturation=1.2",  # Color grade
                "-shortest",
                str(output_path),
            ]

            subprocess.run(cmd, check=True, capture_output=True)
            return str(output_path)

        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return None

    async def _upload_to_r2(self, file_path: str, r2_key: str) -> str:
        """Upload video to Cloudflare R2"""
        # await self.r2.upload_file(file_path, r2_key)
        # return f"https://{R2_PUBLIC_URL}/{r2_key}"
        pass

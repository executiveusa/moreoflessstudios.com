"""More-of-Less job dispatch endpoint — extends the ACE-Step FastAPI server."""

from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/mol", tags=["more-of-less"])

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "moreofless-media")


def _supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


class DispatchRequest(BaseModel):
    jobId: str
    type: str
    inputAssetId: str | None = None
    params: dict[str, Any] = {}


@router.post("/jobs/dispatch")
async def dispatch_job(
    payload: DispatchRequest,
    x_api_key: str = Header(default=""),
):
    """Receive a job from the Next.js API and process it asynchronously."""
    if WORKER_API_KEY and x_api_key != WORKER_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Mark job as processing
    await _update_job(payload.jobId, {"status": "processing", "progress": 5})

    # Dispatch asynchronously (don't await — return 202 immediately)
    asyncio.create_task(_process_job(payload))
    return {"status": "accepted", "jobId": payload.jobId}


async def _process_job(payload: DispatchRequest):
    """Execute the job and update Supabase on completion."""
    try:
        if payload.type in ("audio_master", "stem_sep", "audio_analyze"):
            await _process_audio_job(payload)
        elif payload.type == "music_gen":
            await _process_music_gen(payload)
        elif payload.type == "video_gen":
            await _process_video_gen(payload)
        else:
            await _update_job(payload.jobId, {"status": "failed", "error": f"Unknown type: {payload.type}"})
    except Exception as e:
        await _update_job(payload.jobId, {"status": "failed", "error": str(e)[:500], "progress": 0})


async def _process_audio_job(payload: DispatchRequest):
    """Handle audio mastering, stem separation, analysis."""
    from apps.agent.agents.audio_agent import AudioAgent
    agent = AudioAgent()

    # Fetch input asset metadata
    asset = await _get_asset(payload.inputAssetId) if payload.inputAssetId else None
    if not asset:
        await _update_job(payload.jobId, {"status": "failed", "error": "Input asset not found"})
        return

    # Download from R2
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, asset["filename"])
        await _download_r2(asset["r2_key"], input_path)
        await _update_job(payload.jobId, {"progress": 30})

        result: dict[str, Any] = {}
        cost = 0.0

        if payload.type == "audio_analyze":
            result = agent.analyze(input_path)
            cost = 0.002

        elif payload.type == "audio_master":
            output_path = os.path.join(tmpdir, f"mastered_{asset['filename']}")
            preset = payload.params.get("preset", "balanced")
            master_result = agent.master(input_path, output_path, preset=preset)
            r2_key = f"{asset['user_id']}/{asset['project_id']}/mastered_{asset['filename']}"
            await _upload_r2(output_path, r2_key, "audio/wav")
            output_asset_id = await _create_asset(asset, r2_key, f"mastered_{asset['filename']}")
            result = {**master_result, "output_asset_id": output_asset_id}
            cost = 0.005

        elif payload.type == "stem_sep":
            stems_dir = os.path.join(tmpdir, "stems")
            stem_result = agent.separate_stems(input_path, stems_dir)
            stem_asset_ids = {}
            for stem_name, stem_path in stem_result["stems"].items():
                stem_filename = f"{stem_name}_{asset['filename']}"
                r2_key = f"{asset['user_id']}/{asset['project_id']}/{stem_filename}"
                await _upload_r2(stem_path, r2_key, "audio/wav")
                stem_asset_ids[stem_name] = await _create_asset(asset, r2_key, stem_filename)
            result = {"stems": stem_asset_ids}
            cost = 0.020

        await _update_job(payload.jobId, {
            "status": "completed",
            "progress": 100,
            "result": result,
            "cost_usd": cost,
            "provider": "ffmpeg" if payload.type != "stem_sep" else "demucs",
            "output_asset_id": result.get("output_asset_id"),
        })


async def _process_music_gen(payload: DispatchRequest):
    """Forward music generation to ACE-Step's existing pipeline."""
    await _update_job(payload.jobId, {"progress": 10})
    # ACE-Step handles this via its own /release_task endpoint
    # Here we just signal completion placeholder; in production
    # ACE-Step's pipeline would update this job directly
    await _update_job(payload.jobId, {"status": "processing", "progress": 15,
                                       "result": {"message": "Handed off to ACE-Step pipeline"}})


async def _process_video_gen(payload: DispatchRequest):
    """Generate a music video via scene plan + fal.ai + FFmpeg stitch."""
    from apps.agent.agents.video_agent import VideoAgent
    agent = VideoAgent()

    asset = await _get_asset(payload.inputAssetId) if payload.inputAssetId else None
    if not asset:
        await _update_job(payload.jobId, {"status": "failed", "error": "Audio asset not found"})
        return

    style = payload.params.get("style", "Cinematic")
    num_scenes = payload.params.get("num_scenes", 3)

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, asset["filename"])
        await _download_r2(asset["r2_key"], audio_path)
        await _update_job(payload.jobId, {"progress": 10})

        scenes = agent.plan_scenes(audio_path, style=style, num_scenes=num_scenes)
        await _update_job(payload.jobId, {"progress": 20, "result": {"scenes_planned": len(scenes)}})

        clip_paths = []
        for i, scene in enumerate(scenes):
            scene_result = await agent.generate_scene(scene)
            clip_path = os.path.join(tmpdir, f"clip_{i}.mp4")
            # Download generated clip
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.get(scene_result["video_url"])
                Path(clip_path).write_bytes(r.content)
            clip_paths.append(clip_path)
            progress = 20 + int((i + 1) / num_scenes * 60)
            await _update_job(payload.jobId, {"progress": progress})

        output_path = os.path.join(tmpdir, "music_video.mp4")
        agent.stitch_video(clip_paths, audio_path, output_path)
        await _update_job(payload.jobId, {"progress": 90})

        r2_key = f"{asset['user_id']}/{asset['project_id']}/video_{payload.jobId}.mp4"
        await _upload_r2(output_path, r2_key, "video/mp4")
        output_asset_id = await _create_asset(asset, r2_key, f"video_{payload.jobId}.mp4", asset_type="video")

        total_cost = sum(s.get("estimated_cost_usd", 0.5) for s in scenes) + 0.005
        await _update_job(payload.jobId, {
            "status": "completed",
            "progress": 100,
            "output_asset_id": output_asset_id,
            "cost_usd": total_cost,
            "provider": "falai",
            "result": {"scenes": len(scenes), "output_asset_id": output_asset_id},
        })


# ── Supabase helpers ─────────────────────────────────────────────────────────

async def _update_job(job_id: str, updates: dict[str, Any]):
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/mol_jobs?id=eq.{job_id}",
            headers=_supabase_headers(),
            json=updates,
        )


async def _get_asset(asset_id: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/mol_assets?id=eq.{asset_id}&select=*",
            headers=_supabase_headers(),
        )
        data = res.json()
        return data[0] if data else None


async def _create_asset(parent: dict, r2_key: str, filename: str, asset_type: str = "audio") -> str:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/mol_assets",
            headers={**_supabase_headers(), "Prefer": "return=representation"},
            json={
                "project_id": parent["project_id"],
                "user_id": parent["user_id"],
                "type": asset_type,
                "r2_key": r2_key,
                "filename": filename,
                "mime_type": "audio/wav" if asset_type == "audio" else "video/mp4",
            },
        )
        created = res.json()
        return created[0]["id"] if created else ""


# ── R2 helpers ────────────────────────────────────────────────────────────────

async def _download_r2(r2_key: str, local_path: str):
    """Download a file from R2 via presigned URL."""
    from boto3 import client as boto_client
    s3 = boto_client(
        "s3",
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )
    s3.download_file(R2_BUCKET, r2_key, local_path)


async def _upload_r2(local_path: str, r2_key: str, content_type: str):
    """Upload a file to R2."""
    from boto3 import client as boto_client
    s3 = boto_client(
        "s3",
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )
    s3.upload_file(local_path, R2_BUCKET, r2_key, ExtraArgs={"ContentType": content_type})

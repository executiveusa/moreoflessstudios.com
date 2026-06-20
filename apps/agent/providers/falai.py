"""fal.ai provider for video and image generation."""

from __future__ import annotations

import os
import time
from typing import Any

import httpx

FAL_API_KEY = os.getenv("FALAI_API_KEY", "")
FAL_BASE = "https://queue.fal.run"

MODELS = {
    "ltx_video": "fal-ai/ltx-video",
    "sdxl": "fal-ai/stable-diffusion-xl",
}


def _headers() -> dict[str, str]:
    return {"Authorization": f"Key {FAL_API_KEY}", "Content-Type": "application/json"}


async def generate_video_clip(
    prompt: str,
    duration_seconds: int = 8,
    resolution: str = "1080p",
    timeout: int = 300,
) -> dict[str, Any]:
    """Generate a short video clip via fal.ai LTX-Video.

    Returns dict with 'url' (video URL) and 'cost_usd'.
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        # Submit request
        res = await client.post(
            f"{FAL_BASE}/{MODELS['ltx_video']}",
            headers=_headers(),
            json={
                "prompt": prompt,
                "num_frames": duration_seconds * 8,  # 8fps → 24fps via interpolation
                "resolution": resolution,
                "enable_safety_checker": True,
            },
        )
        res.raise_for_status()
        data = res.json()

        # Poll for result
        request_id = data.get("request_id")
        if not request_id:
            raise ValueError(f"No request_id in fal.ai response: {data}")

        for _ in range(60):  # max 5 minutes
            time.sleep(5)
            status_res = await client.get(
                f"{FAL_BASE}/{MODELS['ltx_video']}/requests/{request_id}/status",
                headers=_headers(),
            )
            status_data = status_res.json()
            if status_data.get("status") == "COMPLETED":
                result = await client.get(
                    f"{FAL_BASE}/{MODELS['ltx_video']}/requests/{request_id}",
                    headers=_headers(),
                )
                result_data = result.json()
                video_url = result_data.get("video", {}).get("url", "")
                return {"url": video_url, "cost_usd": 0.50, "duration_seconds": duration_seconds}
            elif status_data.get("status") in ("FAILED", "CANCELLED"):
                raise RuntimeError(f"fal.ai job failed: {status_data}")

        raise TimeoutError("fal.ai video generation timed out after 5 minutes")


async def generate_image(prompt: str, width: int = 1024, height: int = 1024) -> dict[str, Any]:
    """Generate an image via fal.ai SDXL."""
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            f"{FAL_BASE}/{MODELS['sdxl']}",
            headers=_headers(),
            json={"prompt": prompt, "image_size": {"width": width, "height": height}},
        )
        res.raise_for_status()
        data = res.json()
        images = data.get("images", [])
        if not images:
            raise ValueError("No images returned from fal.ai")
        return {"url": images[0]["url"], "cost_usd": 0.005}

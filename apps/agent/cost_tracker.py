"""Tracks per-job costs and enforces user budget constraints."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime

# Cost estimates per provider/job type (USD)
COST_ESTIMATES: dict[str, float] = {
    "audio_master": 0.005,
    "stem_sep": 0.020,
    "audio_analyze": 0.002,
    "music_gen": 0.050,
    "video_gen": 0.500,   # per 8s clip via fal.ai; multiply by scene count
    "image_gen": 0.005,
    "clip_extract": 0.002,
    "caption_gen": 0.003,
}


@dataclass
class CostEvent:
    job_id: str
    job_type: str
    provider: str
    cost_usd: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


class CostTracker:
    """Logs costs and checks budget before dispatching jobs."""

    def __init__(self, supabase_client=None):
        self._supabase = supabase_client
        self._session_events: list[CostEvent] = []

    def estimate(self, job_type: str, params: dict | None = None) -> float:
        """Return estimated cost for a job type."""
        base = COST_ESTIMATES.get(job_type, 0.01)
        if job_type == "video_gen" and params:
            scene_count = params.get("scene_count", 3)
            return base * scene_count
        return base

    async def check_budget(self, user_id: str, estimated_cost: float) -> tuple[bool, str]:
        """Return (ok, reason). Blocks if user is over budget."""
        if not self._supabase:
            return True, ""

        profile = (
            self._supabase.table("profiles")
            .select("budget_usd, monthly_spend_usd")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not profile.data:
            return True, ""

        budget = profile.data["budget_usd"]
        spent = profile.data["monthly_spend_usd"]
        if spent + estimated_cost > budget:
            return False, f"Budget limit ${budget:.2f} reached (spent ${spent:.2f})"
        return True, ""

    async def record(self, job_id: str, job_type: str, provider: str, actual_cost: float, user_id: str | None = None):
        """Record actual cost after job completion."""
        event = CostEvent(job_id=job_id, job_type=job_type, provider=provider, cost_usd=actual_cost)
        self._session_events.append(event)

        if self._supabase and user_id:
            # Update job cost
            self._supabase.table("jobs").update({"cost_usd": actual_cost}).eq("id", job_id).execute()
            # Increment monthly spend on profile
            profile = (
                self._supabase.table("profiles")
                .select("monthly_spend_usd")
                .eq("id", user_id)
                .single()
                .execute()
            )
            if profile.data:
                new_spend = profile.data["monthly_spend_usd"] + actual_cost
                self._supabase.table("profiles").update({"monthly_spend_usd": new_spend}).eq("id", user_id).execute()
            # Log event
            self._supabase.table("events").insert({
                "user_id": user_id,
                "job_id": job_id,
                "event_type": "job_cost",
                "provider": provider,
                "cost_usd": actual_cost,
            }).execute()

    @property
    def session_total(self) -> float:
        return sum(e.cost_usd for e in self._session_events)

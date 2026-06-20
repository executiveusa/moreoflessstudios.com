"""Character Agent: passport management and prompt injection for consistent AI characters."""

from __future__ import annotations

from typing import Any


class CharacterAgent:
    """Manages character passports and ensures visual continuity in generated video."""

    def inject_prompt(self, scene_prompt: str, character: dict[str, Any]) -> str:
        """Prepend character appearance and rules to a scene prompt.

        Ensures the character's look is consistent in every generated clip.
        """
        parts = []
        if character.get("name"):
            parts.append(character["name"])
        if character.get("appearance"):
            parts.append(character["appearance"])
        if isinstance(character.get("continuity_rules"), list):
            parts.extend(character["continuity_rules"])

        if not parts:
            return scene_prompt

        character_prefix = ", ".join(p.strip() for p in parts if p.strip())
        return f"{character_prefix}, {scene_prompt}"

    def build_generation_params(self, character: dict[str, Any]) -> dict[str, Any]:
        """Return generation parameters derived from the character passport."""
        params: dict[str, Any] = {}
        if character.get("seed") is not None:
            params["seed"] = character["seed"]
        if character.get("style_lora"):
            params["lora_path"] = character["style_lora"]
        return params

    def validate_continuity(self, character: dict[str, Any], generated_metadata: dict[str, Any]) -> dict[str, Any]:
        """Check if a generated clip matches the character's rules.

        In a full implementation, this would use a vision model to compare
        the generated frame against the character's reference image.
        Returns a report with match score and any issues found.
        """
        issues = []
        rules = character.get("continuity_rules", [])

        # Placeholder: rule-based heuristic checking
        for rule in rules:
            # Future: invoke vision API to check each rule
            _ = rule

        return {
            "appearance_match": 1.0 if not issues else 0.7,
            "issues": issues,
            "recommendation": "Approved" if not issues else "Review flagged issues",
        }

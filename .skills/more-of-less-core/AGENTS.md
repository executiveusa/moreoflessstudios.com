# More-of-Less: Multi-Agent Roles & Interaction

## Agent Coordination Framework

All agents operate under the Paperclip AI orchestration pattern:
1. **Announce** – Agent declares intent and required resources
2. **Negotiate** – Other agents agree, propose alternatives, or escalate
3. **Execute** – Primary agent performs task, sub-agents assist
4. **Report** – Results logged, knowledge graph updated, next steps proposed

## Agent Role Definitions

### 1. Product Agent

**Mission:** Ensure the platform solves real creator problems. Champion user voice. Prioritize features that maximize adoption and retention.

**Responsibilities:**
- Monitor user feedback and feature requests
- Analyze market trends and competitive landscape
- Define success metrics and KPIs
- Escalate to founder when strategic decision needed

**Interface:**
```python
@agent.register_skill("product-agent")
class ProductAgent:
    def evaluate_feature(self, feature_spec: dict) -> dict:
        """Score feature against user pain, effort, market impact."""
        return {
            "user_impact": 0.8,      # 0-1 scale
            "effort": 0.4,
            "market_fit": 0.9,
            "priority": "high",
            "rationale": "..."
        }
    
    def gather_feedback(self, project_id: str) -> list:
        """Post-project: ask user if outputs met expectations."""
        return [{"question": "...", "response": "..."}]
```

---

### 2. Design Agent

**Mission:** Maintain beautiful, intuitive interfaces. Apply Steve Krug's usability principles. Ensure accessibility and consistency across languages.

**Responsibilities:**
- Design UI mockups and interaction flows
- Conduct usability audits (heuristic evaluation)
- Ensure WCAG 2.1 AA compliance
- Review all user-facing text for clarity and tone

**Interface:**
```python
@agent.register_skill("design-agent")
class DesignAgent:
    def audit_component(self, component_name: str) -> dict:
        """Rate component against Krug heuristics."""
        return {
            "visibility_of_status": 0.9,
            "match_system_world": 0.85,
            "user_control_freedom": 0.8,
            "error_prevention": 0.7,
            "issues": ["Font contrast low on mobile"],
            "priority_fixes": ["Increase heading size on <600px screens"]
        }
    
    def translate_string(self, english: str, lang: str) -> str:
        """Ensure translation maintains UI layout, tone."""
        return {"es": "...", "context": "Button label"}
```

---

### 3. Engineering Agent

**Mission:** Implement features using TDD and GSD workflows. Maintain clean architecture. Secure secrets at server-side.

**Responsibilities:**
- Write tests before code (unit, integration, e2e)
- Review pull requests for correctness and simplicity
- Manage provider integrations (FFmpeg, ComfyUI, Higgsfield)
- Ensure no credentials leak to frontend

**Interface:**
```python
@agent.register_skill("engineering-agent")
class EngineeringAgent:
    def test_job_workflow(self, job_type: str) -> dict:
        """Run full test suite for job type."""
        return {
            "unit_tests": {"passed": 42, "failed": 0},
            "integration_tests": {"passed": 15, "failed": 0},
            "e2e_tests": {"passed": 8, "failed": 0},
            "coverage": 0.89,
            "status": "ready_to_merge"
        }
    
    def code_review(self, pr_id: int) -> dict:
        """Review for bugs, simplification, security."""
        return {
            "approved": True,
            "findings": [
                {"type": "security", "severity": "high", "issue": "..."}
            ]
        }
```

---

### 4. Audio Agent

**Mission:** Deliver professional-quality audio. Support mixing, mastering, stem separation, and genre-specific presets.

**Responsibilities:**
- Analyze uploaded audio (BPM, key, energy, loudness)
- Apply mastering chain (normalization, EQ, compression, limiting)
- Separate stems (vocals, drums, instruments)
- Generate stem variations (e.g., remove vocals for karaoke)

**Interface:**
```python
@agent.register_skill("audio-agent")
class AudioAgent:
    def analyze_audio(self, asset_id: str) -> dict:
        """Extract musical features."""
        return {
            "bpm": 120.5,
            "key": "A minor",
            "energy": 0.8,
            "loudness_lufs": -12.5,
            "duration_sec": 180,
            "structure": ["intro_8s", "verse_32s", "chorus_16s", ...],
            "genres": ["house", "techno"],
            "confidence": 0.92
        }
    
    def master_audio(self, asset_id: str, preset: str = "balanced") -> dict:
        """Apply mastering chain."""
        return {
            "output_asset_id": "asset_abc",
            "loudness_before_lufs": -12.5,
            "loudness_after_lufs": -14.0,
            "cost_usd": 0.01,
            "processing_time_sec": 5.3
        }
    
    def separate_stems(self, asset_id: str) -> dict:
        """Isolate stems using Demucs."""
        return {
            "vocals": "asset_vocals_123",
            "drums": "asset_drums_123",
            "bass": "asset_bass_123",
            "other": "asset_other_123",
            "cost_usd": 0.03,
            "processing_time_sec": 22.1
        }
```

---

### 5. Video Agent

**Mission:** Create cinematic videos using LTX, ComfyUI, and Higgsfield. Ensure character continuity.

**Responsibilities:**
- Plan video scenes based on audio structure and user brief
- Generate prompts for each scene (respecting character passport)
- Invoke video generation (local Higgsfield → fal.ai fallback)
- Stitch clips with transitions, sync to audio
- Handle remake requests for individual scenes

**Interface:**
```python
@agent.register_skill("video-agent")
class VideoAgent:
    def plan_video(self, project_id: str, song_analysis: dict) -> dict:
        """Create scene breakdown."""
        return {
            "scenes": [
                {
                    "id": "scene_1",
                    "start_sec": 0,
                    "duration_sec": 32,
                    "audio_segment": "intro",
                    "mood": "mysterious",
                    "setting": "neon city",
                    "character_action": "walking through rain"
                },
                ...
            ],
            "total_duration_sec": 180,
            "estimated_cost_usd": 1.50
        }
    
    def generate_scene(self, scene_spec: dict, character_id: str) -> dict:
        """Invoke video generation."""
        return {
            "video_asset_id": "asset_video_scene1",
            "provider": "local_higgsfield",
            "quality": "1080p",
            "duration_sec": 32,
            "cost_usd": 0.45,
            "processing_time_sec": 120
        }
    
    def stitch_video(self, scene_ids: list, audio_asset_id: str) -> dict:
        """Combine scenes with audio, apply transitions."""
        return {
            "final_video_asset_id": "asset_final_video",
            "duration_sec": 180,
            "bitrate": "8000k",
            "cost_usd": 0.05,
            "processing_time_sec": 45
        }
```

---

### 6. Character Agent

**Mission:** Maintain consistent character appearance and personality across projects. Manage LoRAs, seeds, and continuity rules.

**Responsibilities:**
- Create and update character passports
- Validate continuity (appearance, style, behavior)
- Manage character LoRAs and model weights
- Inject character constraints into prompts

**Interface:**
```python
@agent.register_skill("character-agent")
class CharacterAgent:
    def create_passport(self, name: str, appearance: str, voice_sample: str) -> dict:
        """Create character profile."""
        return {
            "character_id": "char_abc123",
            "name": name,
            "appearance": appearance,
            "lora_id": "lora_char_v1",
            "seed": 42,
            "voice_id": "voice_char_v1",
            "sample_video": "s3://...",
            "created_at": "2025-01-15T10:00:00Z"
        }
    
    def validate_continuity(self, character_id: str, video_asset_id: str) -> dict:
        """Check if video matches character guidelines."""
        return {
            "appearance_match": 0.95,
            "style_consistency": 0.92,
            "issues": ["Jewelry mismatch in scene 2"],
            "confidence": 0.88,
            "recommendation": "Approve with minor notes"
        }
    
    def inject_prompt_constraint(self, scene_spec: dict, character_id: str) -> str:
        """Augment scene prompt with character details."""
        return "Luna, tall with dark hair and blue eyes, wearing silver jewelry, cyberpunk aesthetic, speaking with confidence, in a neon city, walking through rain..."
```

---

### 7. Marketing Agent

**Mission:** Generate promotional content. Schedule social posts. Optimize for SEO and audience engagement.

**Responsibilities:**
- Generate short clips from videos (15s, 30s, 60s)
- Write social media captions (Instagram, TikTok, Twitter)
- Schedule posts via Postiz
- A/B test post formats and times
- Suggest trending remixes and collaborations

**Interface:**
```python
@agent.register_skill("marketing-agent")
class MarketingAgent:
    def generate_clips(self, video_asset_id: str) -> dict:
        """Extract short clips for social media."""
        return {
            "clips": [
                {"asset_id": "clip_15s", "duration": 15, "highlights": ["beat drop"]},
                {"asset_id": "clip_30s", "duration": 30, "highlights": ["chorus"]},
                {"asset_id": "clip_60s", "duration": 60, "highlights": ["full scene"]}
            ]
        }
    
    def generate_caption(self, clip_id: str, platform: str) -> dict:
        """Write social caption optimized for platform."""
        return {
            "caption": "Just dropped 🎵 New visualiser out now! #cyberpunk #neon",
            "hashtags": ["#musicvideo", "#edm", "#neon", "#cyberpunk"],
            "platform": "instagram",
            "recommendation": "Post 6pm UTC for max engagement"
        }
    
    def schedule_posts(self, posts: list) -> dict:
        """Schedule via Postiz."""
        return {
            "posted": 3,
            "scheduled": 5,
            "next_post_time": "2025-01-16T18:00:00Z"
        }
```

---

### 8. Financial Agent

**Mission:** Track costs, enforce budgets, suggest ROI-positive features, manage white-label pricing.

**Responsibilities:**
- Log all provider costs and execution times
- Enforce per-project and per-month budgets
- Suggest cost-saving provider alternatives
- Calculate ROI on premium features
- Allocate 10% of profits to open-source

**Interface:**
```python
@agent.register_skill("financial-agent")
class FinancialAgent:
    def log_cost(self, job_id: str, cost_usd: float, provider: str) -> dict:
        """Record job cost."""
        return {
            "cost_usd": cost_usd,
            "provider": provider,
            "user_budget_remaining": 2.45,
            "monthly_cost_so_far": 4.50
        }
    
    def suggest_optimization(self, job_id: str) -> dict:
        """Propose cost savings."""
        return {
            "current_provider": "fal.ai",
            "current_cost": 0.50,
            "recommended_provider": "local_higgsfield",
            "recommended_cost": 0.02,
            "savings": 0.48,
            "quality_trade": "Minimal (0.95 vs 0.98)"
        }
    
    def calculate_roi(self, feature_name: str) -> dict:
        """Forecast ROI on premium feature."""
        return {
            "feature": "white_label_deployment",
            "implementation_cost": 5000,
            "monthly_recurring_revenue": 2000,
            "payback_period_months": 2.5,
            "recommendation": "Implement in Q2"
        }
```

---

### 9. Analytics Agent

**Mission:** Learn user preferences, build knowledge graph, generate recommendations.

**Responsibilities:**
- Track user project completions and quality ratings
- Build preference model (genre, style, BPM, mood preferences)
- Suggest next projects or remixes
- Analyze audience reactions (views, likes, comments)
- Maintain knowledge graph linking songs, videos, users

**Interface:**
```python
@agent.register_skill("analytics-agent")
class AnalyticsAgent:
    def analyze_preferences(self, user_id: str) -> dict:
        """Build user style profile."""
        return {
            "favorite_genres": ["house", "techno", "dnb"],
            "preferred_bpm": 120,
            "preferred_mood": "energetic",
            "preferred_length_sec": 180,
            "style_keywords": ["cyberpunk", "neon", "dystopian"],
            "confidence": 0.87
        }
    
    def suggest_next_project(self, user_id: str) -> dict:
        """Recommend creative direction."""
        return {
            "suggestions": [
                {
                    "type": "remix",
                    "track": "Trending house track by Artist X",
                    "style": "Your cyberpunk aesthetic",
                    "confidence": 0.92
                },
                {
                    "type": "collaboration",
                    "artist": "Producer Y",
                    "reason": "Similar style and audience"
                }
            ]
        }
    
    def track_output_performance(self, video_asset_id: str) -> dict:
        """Monitor social metrics."""
        return {
            "platform_metrics": {
                "instagram": {"views": 5000, "likes": 250, "saves": 50},
                "tiktok": {"views": 25000, "likes": 1200, "shares": 150}
            },
            "audience_growth": 0.12,  # 12% weekly growth
            "recommendation": "Trending! Post similar content"
        }
```

---

### 10. Voice Agent

**Mission:** Power voice interaction, booking, and remote control. Enable crowd analysis for live DJ sets.

**Responsibilities:**
- Process voice input (speech-to-text)
- Generate voice responses (text-to-speech)
- Handle voice commands for UI control
- Support event booking requests
- Analyze crowd energy and suggest DJ set adjustments (v2.0)

**Interface:**
```python
@agent.register_skill("voice-agent")
class VoiceAgent:
    def process_voice_input(self, audio_bytes: bytes) -> dict:
        """Transcribe voice to text."""
        return {
            "text": "Create a music video for my track Midnight Run",
            "confidence": 0.96,
            "language": "en"
        }
    
    def generate_voice_response(self, text: str, voice_id: str = None) -> bytes:
        """Generate TTS response."""
        return {
            "audio_bytes": b"...",
            "duration_sec": 3.2,
            "voice": "Luna",
            "provider": "elevenlabs"
        }
    
    def execute_voice_command(self, command: str) -> dict:
        """Interpret and execute voice control."""
        return {
            "command": command,
            "action": "toggle_dark_mode",
            "status": "completed",
            "confirmation": "Switched to dark mode"
        }
```

---

## Agent Interaction Patterns

### Pattern 1: Sequential Execution
```
User Request → Product Agent (validate)
             → Design Agent (UX check)
             → Engineering Agent (feasibility)
             → [Primary Agent] (execute)
             → All Agents (log & learn)
```

### Pattern 2: Parallel Execution
```
Video Generation:
  ├─ Video Agent → Generate scenes (3 in parallel)
  ├─ Audio Agent → Analyze audio
  └─ Character Agent → Validate continuity
  
All complete → Marketing Agent (create clips)
            → Financial Agent (log costs)
            → Analytics Agent (track output)
```

### Pattern 3: Escalation
```
Job encounters unknown error
  → [Primary Agent] attempts fallback
  → Financial Agent checks budget for retry
  → [Primary Agent] switches provider
  → If still fails → Engineering Agent logs incident
  → If cost exceeded → User approval required
```

## Command Protocol

All agents respond to standard commands:

```python
# Health check
agent.health()  # Returns {"status": "healthy", "uptime_sec": 3600}

# Get role description
agent.describe_role()  # Returns HART + responsibilities

# Execute skill
agent.execute(skill_name, params)

# Log decision
agent.log_decision({"action": "...", "cost": 0.05})

# Escalate
agent.escalate(message, options)  # Requires user input
```

## Success Metrics per Agent

| Agent | Key Metric | Target |
|-------|-----------|--------|
| Product | Feature adoption | 70%+ within 3 months |
| Design | WCAG compliance | AA across all pages |
| Engineering | Test coverage | 85%+ |
| Audio | Output quality | 4.5+ stars |
| Video | Character consistency | 95%+ match |
| Character | Passport reusability | 3+ projects per character |
| Marketing | Click-through rate | 2%+ |
| Financial | Cost per output | <$0.05 |
| Analytics | Recommendation accuracy | 75%+ |
| Voice | Command success rate | 95%+ |

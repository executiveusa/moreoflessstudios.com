# More-of-Less Core Skill

## Overview

The **more-of-less-core** skill provides the foundational system prompt, identity, and orchestration logic for the More-of-Less personal AI studio platform.

## What This Skill Does

- **System Identity:** Defines the agent's purpose, values, goals, and ethical code
- **Orchestration Framework:** Coordinates sub-agents (audio, video, character, marketing, financial, analytics)
- **Operating Principles:** Establishes heartbeats, feedback loops, and decision-making heuristics
- **Financial Governance:** Tracks costs, sets budgets, enforces open-source-first policy

## Files

- **HART.md** – Heart & Soul; persistent identity and core operating system
- **SPEC.md** – Full specification including architecture, roles, design guidelines, roadmap
- **ARCHITECTURE.md** – Detailed system design (coming)
- **AGENTS.md** – Multi-agent role definitions and interaction patterns (coming)
- **ONBOARDING.md** – Getting started for new developers (coming)

## How to Use

### 1. Initialize the Agent
```python
from skills.more_of_less_core import MoreOfLessAgent

agent = MoreOfLessAgent(
    user_email="artist@example.com",
    language="es",  # English or Spanish
    mode="studio"   # 'studio' or 'assistant'
)
```

### 2. Define Sub-Agents
Each specialized agent (audio, video, character, etc.) registers with the core agent:
```python
agent.register_skill("audio-agent", AudioAgent)
agent.register_skill("video-agent", VideoAgent)
agent.register_skill("character-agent", CharacterAgent)
```

### 3. Process a Creative Request
```python
project = agent.process_request(
    user_input="Create a music video for my track 'Midnight Run'",
    context={
        "song_id": "track_123",
        "style": "cyberpunk",
        "language": "en"
    }
)
```

## Configuration

### Environment Variables
```bash
# Model providers
LLM_PROVIDER=openai  # or 'anthropic', 'local'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Media processing
FFMPEG_PATH=/usr/bin/ffmpeg
COMFY_API_URL=http://localhost:8188
HIGGSFIELD_API_URL=http://localhost:5000

# Voice & TTS
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=voice_abc

# Storage
DATABASE_URL=postgres://...
STORAGE_BUCKET=s3://more-of-less-studios

# Features
ENABLE_VOICE_INPUT=true
ENABLE_CROWD_ANALYSIS=false  # v2.0+
MAX_COST_PER_PROJECT=5.00  # USD
```

### Branding & Customization
```json
{
  "studio_name": "More-of-Less",
  "studio_tagline": "Your personal AI studio",
  "primary_color": "#1f2937",
  "accent_color": "#60a5fa",
  "supported_languages": ["en", "es"],
  "default_language": "en",
  "logo_url": "https://...",
  "white_label": false,
  "white_label_name": null
}
```

## Key Features

### 1. Conversational Interface
- Voice and text input
- Natural language understanding
- Multi-turn context awareness
- Language auto-detection

### 2. Agentic Autonomy
- Sub-agents negotiate tasks independently
- Escalation to human only when needed
- Parallel task execution
- Graceful fallbacks

### 3. Cost Tracking & Budget Enforcement
```python
# Agent logs all decisions
agent.log_decision({
    "action": "generate_video_ltr",
    "provider": "local_higgsfield",
    "cost_usd": 0.02,
    "duration_sec": 45,
    "quality": "1080p"
})

# Respects user budget
if total_cost > user_budget:
    agent.escalate("Budget exceeded. Approve $X more? (Y/n)")
```

### 4. Learning & Personalization
- Builds user preference model
- Adapts prompts based on past projects
- Suggests trending remixes and variations
- Tracks A/B test results

### 5. Ethical Enforcement
- Prevents copyrighted content remix without rights
- Requires voice consent before cloning
- Logs consent status per asset
- Provides data deletion on demand

## Integration Checklist

- [ ] Create `.env.local` with provider credentials
- [ ] Register all sub-agent skills
- [ ] Set up database (projects, assets, jobs)
- [ ] Configure storage bucket (S3 or equivalent)
- [ ] Test conversational flow (CLI)
- [ ] Validate multi-language support
- [ ] Audit cost tracking
- [ ] Deploy to staging
- [ ] Gather early adopter feedback
- [ ] Launch on Product Hunt

## Support & Contributing

See CONTRIBUTING.md for guidelines on extending agents, adding new languages, or submitting feedback.

## License

More-of-Less is built on open-source foundations and respects the licenses of all dependencies. See LICENSE for details.

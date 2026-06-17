# More-of-Less Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONT-END (WEB UI)                   │
│  [Dashboard] [Music Video] [Audio] [Character Lab] etc  │
│  Chat Panel (Voice & Text Input)                        │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket + REST
┌────────────────────▼────────────────────────────────────┐
│            PI AGENT ORCHESTRATOR                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Core: Memory, Planning, Tool Invocation          │   │
│  │ HART: Identity, Values, Operating Principles     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Sub-Agents (Skills):                                  │
│  ├─ Audio Agent (Mixing, Mastering, Stem Sep)         │
│  ├─ Video Agent (LTX, ComfyUI, Higgsfield)           │
│  ├─ Character Agent (Passports, LoRAs, Seeds)        │
│  ├─ Marketing Agent (Social Posts, SEO)              │
│  ├─ Financial Agent (Costs, Budgets, ROI)            │
│  ├─ Analytics Agent (User Preferences, KG)           │
│  └─ Voice Agent (TTS, STT, Crowd Analysis)           │
└────────────────────┬────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼───┐   ┌──────▼──────┐   ┌───▼────┐
│ STORAGE │   │ JOB QUEUE   │   │ CACHE  │
│ (JSON   │   │ (Redis)     │   │ (Fast) │
│ Versioned)  │             │   │        │
└─────────┘   └──────┬──────┘   └────────┘
                     │
     ┌───────────────┼───────────────┬──────────────┐
     │               │               │              │
┌────▼──────┐  ┌────▼──────┐  ┌────▼──────┐  ┌──▼────────┐
│  FFMPEG   │  │  COMFY    │  │ HIGGSFIELD│  │ FAL.AI    │
│  (Local)  │  │  (Local)  │  │  (Local)  │  │ (Remote)  │
│  Audio    │  │  Images   │  │  Video    │  │ Fallback  │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

## Data Model

### Projects
```json
{
  "id": "proj_abc123",
  "user_id": "user_123",
  "name": "Midnight Run - Visualiser",
  "created_at": "2025-01-15T10:00:00Z",
  "language": "en",
  "metadata": {
    "genre": "cyberpunk",
    "mood": "energetic",
    "bpm": 120
  },
  "assets": ["asset_1", "asset_2"],
  "jobs": ["job_1", "job_2"],
  "total_cost_usd": 2.45,
  "status": "completed"
}
```

### Assets
```json
{
  "id": "asset_abc123",
  "project_id": "proj_abc123",
  "type": "audio|video|image|character",
  "url": "s3://bucket/asset.wav",
  "metadata": {
    "duration_sec": 180,
    "bitrate": "320k",
    "language": "en"
  },
  "consent_status": {
    "voice_cloning": false,
    "likeness_cloning": false,
    "copyright_licensed": true
  },
  "version": 1
}
```

### Jobs
```json
{
  "id": "job_abc123",
  "project_id": "proj_abc123",
  "type": "audio_mastering|video_generation|stem_separation",
  "status": "pending|processing|completed|failed",
  "input": { "asset_id": "...", "params": {} },
  "output": { "asset_id": "...", "quality": "1080p" },
  "cost_usd": 0.50,
  "duration_sec": 45,
  "created_at": "2025-01-15T10:05:00Z",
  "completed_at": null,
  "error": null
}
```

### Character Passports
```json
{
  "id": "char_abc123",
  "user_id": "user_123",
  "name": "Luna",
  "appearance": "Tall, dark hair, blue eyes",
  "style_lora": "lora_luna_v2.safetensors",
  "seed": 42,
  "continuity_rules": [
    "Always wear silver jewelry",
    "Cyberpunk aesthetic",
    "Speak with confidence"
  ],
  "voice_id": "voice_luna_v1",
  "sample_video": "s3://...",
  "created_at": "2025-01-10T14:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

## API Endpoints

### Projects
- `POST /api/projects` – Create new project
- `GET /api/projects/{id}` – Get project details
- `PUT /api/projects/{id}` – Update project metadata
- `GET /api/projects` – List user's projects

### Jobs
- `POST /api/jobs` – Submit new job
- `GET /api/jobs/{id}` – Get job status
- `DELETE /api/jobs/{id}` – Cancel job
- `GET /api/jobs?project_id=...` – List jobs for project

### Assets
- `POST /api/assets` – Upload asset
- `GET /api/assets/{id}` – Get asset metadata
- `DELETE /api/assets/{id}` – Delete asset

### Characters
- `POST /api/characters` – Create character passport
- `GET /api/characters/{id}` – Get character details
- `PUT /api/characters/{id}` – Update character
- `GET /api/characters` – List user's characters

## Workflow: Creating a Music Video

```
1. User: "Create a music video for 'Midnight Run'"
   └─> Pi Agent parses intent, extracts song_id

2. Audio Agent: Analyzes song (BPM, key, structure, mood)
   └─> Generates emotional keyframes

3. Video Agent: Plans scenes (3 scenes × 60 sec each)
   └─> Creates prompts per scene, respects character continuity

4. Character Agent: Loads character passport (Luna)
   └─> Ensures consistent appearance, style, seed

5. Job Queue: Submit 3 video generation jobs
   ├─ Try local Higgsfield first
   ├─ Fall back to fal.ai if needed
   └─> Track cost, monitor progress

6. Post-Processing: Stitch clips, add transitions
   └─> FFmpeg pipeline for color grading, audio sync

7. Output: Final video → S3, notify user
   └─> Log decision, update knowledge graph (preferences, budget)

8. Analytics: Reflect on quality, cost, user reaction
   └─> Refine prompts for next project
```

## Provider Routing Strategy

### Local-First (Cost Efficient)
```
Audio Mastering:   FFmpeg + SoX
Stem Separation:   Demucs (local)
Image Generation:  ComfyUI + Stable Diffusion
Video Generation:  Higgsfield (LTX or LTX-Video)
Transcription:     Whisper (local)
Text-to-Speech:    Piper (local) or 11 Labs (premium)
```

### Fallback (When Local Unavailable)
```
Image Generation:  fal.ai, Hugging Face
Video Generation:  fal.ai, Replicate
TTS:               11 Labs, Google Cloud
```

### Cost Limits
- **Per project:** User-configurable (default: $5.00)
- **Per job:** Auto-select cheapest provider within quality threshold
- **Per month:** User budget (enforced via Financial Agent)

## Deployment

### Development
```bash
# Local stack
docker-compose -f docker-compose.dev.yml up

# Services
- Pi Agent: http://localhost:8000
- ComfyUI: http://localhost:8188
- Higgsfield: http://localhost:5000
- Database: postgres://localhost:5432
- Redis: localhost:6379
```

### Production
```bash
# Kubernetes / Cloud Run
kubectl apply -f k8s/more-of-less.yaml

# Environment: prod
# Database: RDS (AWS) or Cloud SQL (GCP)
# Storage: S3 (AWS) or GCS (GCP)
# Secrets: AWS Secrets Manager or Google Secret Manager
```

## Monitoring & Logging

### Key Metrics
- Job success rate (target: 95%+)
- Average response time (target: <2s)
- Cost per output (target: <$0.05)
- User retention (target: 70%+ MAU)

### Logging Strategy
```python
# Every decision is logged
agent.log_decision({
    "timestamp": "2025-01-15T10:05:30Z",
    "action": "generate_video",
    "provider": "local_higgsfield",
    "cost_usd": 0.02,
    "quality_score": 4.5,
    "user_id": "user_123"
})
```

### Alerts
- Job failure rate > 5% → Escalate to Engineering Agent
- Average cost > $0.10 per output → Optimize routing
- User budget exceeded → Notify user immediately
- Provider outage → Fall back automatically, log incident

# More-of-Less Core Skill

**Liberate creators from technical complexity. One conversational studio for DJs, musicians, and video artists.**

This skill provides the foundational system prompt, identity, values, and orchestration framework for the More-of-Less platform—a personal AI studio that handles mixing, mastering, video generation, and social promotion through a single conversational interface.

## 📚 Documentation

### Core Files

| File | Purpose |
|------|---------|
| **HART.md** | Heart & Soul—agent identity, core goals, operating principles, ethical code, financial objectives |
| **SPEC.md** | Complete specification—vision, values, architecture, multi-agent roles, design guidelines, MVP/long-term roadmap |
| **ARCHITECTURE.md** | Detailed system design—data models, API endpoints, workflow examples, provider routing, deployment strategy |
| **AGENTS.md** | Multi-agent role definitions—10 specialized agents (Product, Design, Engineering, Audio, Video, Character, Marketing, Financial, Analytics, Voice) |
| **TEST_SPEC.md** | Validation checklist—test cases for spec compliance across identity, architecture, integration, UI/UX, security, performance |
| **SKILL.md** | How to use this skill—configuration, integration checklist, CLI examples |

### Quick Links

- **Vision:** Empower creators with freedom and transparency. Hide technical complexity behind conversational interface.
- **Mission:** Build a multi-agent platform on Pi agent framework using open-source models (LTX, ComfyUI, Higgsfield).
- **Values:** User ownership, simplicity, agentic autonomy, accessibility, ethics & consent, sustainability.

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone https://github.com/executiveusa/moreoflessstudios.com.git
cd moreoflessstudios.com
pip install -e .

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Hello World

```python
from skills.more_of_less_core import MoreOfLessAgent

# Create agent
agent = MoreOfLessAgent(
    user_email="artist@example.com",
    language="en",
    mode="studio"
)

# Process a request
project = agent.process_request(
    user_input="Create a music video for my track 'Midnight Run'",
    context={
        "song_id": "track_123",
        "style": "cyberpunk",
        "language": "en"
    }
)

print(f"Project created: {project['id']}")
print(f"Estimated cost: ${project['estimated_cost_usd']:.2f}")
```

## 📋 Architecture Overview

```
Web UI (Dashboard, Music Video, Audio Studio, Character Lab)
    ↓
Pi Agent Orchestrator (HART-driven decision-making)
    ├─ Audio Agent (Mixing, mastering, stem separation)
    ├─ Video Agent (Scene planning, video generation)
    ├─ Character Agent (Passport management, continuity)
    ├─ Marketing Agent (Clips, captions, scheduling)
    ├─ Financial Agent (Cost tracking, budgets)
    ├─ Analytics Agent (Preference learning, knowledge graph)
    └─ Voice Agent (TTS/STT, voice commands)
    ↓
Media Processors (FFmpeg, ComfyUI, Higgsfield, fal.ai)
    ↓
Storage (S3, Database, Cache)
```

## 🎯 Core Features

### 1. **Conversational Studio**
- Voice and text input
- Natural language understanding
- Multi-turn context awareness
- Language auto-detection (English, Spanish at MVP)

### 2. **Multi-Agent Coordination**
- 10 specialized agents with distinct responsibilities
- Autonomous negotiation and escalation
- Parallel task execution
- Graceful fallbacks

### 3. **Audio Professional Features**
- BPM and key detection
- Loudness normalization (mastering)
- Stem separation (vocals, drums, bass, other)
- Genre-specific presets

### 4. **Video Generation**
- Scene planning based on audio structure
- Character passport management (LoRAs, seeds, continuity)
- Multi-provider support (Higgsfield → fal.ai fallback)
- Automatic sync to audio, transitions, color grading

### 5. **Cost Transparency & Control**
- Per-job cost logging
- Per-project and per-month budget enforcement
- Provider selection to minimize cost
- User escalation at 80% of budget

### 6. **Learning & Personalization**
- User preference modeling
- Adaptive prompt generation
- Recommendation engine
- A/B testing and analytics

### 7. **Ethical Operations**
- Copyrighted content detection
- Voice/likeness cloning consent enforcement
- Data deletion on demand
- Licensing respect

## 📊 MVP Roadmap (3–4 months)

### Phase 1: Foundation
- [x] System prompt and HART file
- [ ] Phase-1 hardening and skill files
- [ ] Basic audio mastering job
- [ ] Character passport creation

### Phase 2: Integration
- [ ] Pi agent with core skills
- [ ] Audio/video worker containers
- [ ] Responsive UI (desktop + mobile)

### Phase 3: Launch
- [ ] English and Spanish UI
- [ ] Voice commands (optional at MVP)
- [ ] Product Hunt launch
- [ ] Early adopter feedback

## 🛠️ Configuration

### Environment Variables

```bash
# Model Providers
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Media Processing
FFMPEG_PATH=/usr/bin/ffmpeg
COMFY_API_URL=http://localhost:8188
HIGGSFIELD_API_URL=http://localhost:5000

# Voice & TTS
ELEVENLABS_API_KEY=...

# Storage
DATABASE_URL=postgres://...
STORAGE_BUCKET=s3://moreofless-studios

# Budget Enforcement
MAX_COST_PER_PROJECT=5.00  # USD
```

### White-Label Customization

```json
{
  "studio_name": "Your Studio Name",
  "primary_color": "#1f2937",
  "supported_languages": ["en", "es"],
  "white_label": true,
  "white_label_name": "Your Brand"
}
```

## 📝 Multi-Agent Roles

| Agent | Responsibility |
|-------|---|
| **Product Agent** | Vision, user feedback, market trends |
| **Design Agent** | UI/UX audit (Steve Krug), accessibility |
| **Engineering Agent** | TDD implementation, architecture, security |
| **Audio Agent** | Mixing, mastering, stem separation |
| **Video Agent** | Scene planning, video generation, character continuity |
| **Character Agent** | Passport management, consistency enforcement |
| **Marketing Agent** | Clips, captions, post scheduling |
| **Financial Agent** | Cost tracking, budgets, ROI analysis |
| **Analytics Agent** | Preference learning, knowledge graph |
| **Voice Agent** | TTS/STT, voice commands, crowd analysis (v2.0) |

## 🧪 Testing & Validation

Run the test suite:

```bash
# Unit tests (identity, API, security)
pytest tests/unit -v

# Integration tests (agent coordination, workflows)
pytest tests/integration -v

# E2E tests (full user workflows)
pytest tests/e2e -v

# Spec compliance check
pytest tests/spec_compliance -v --markers=hart,architecture,agents
```

See **TEST_SPEC.md** for the complete validation checklist.

## 📈 Success Metrics

| Target | Goal | Timeline |
|--------|------|----------|
| Quality | 4.5+ star peer review | Launch |
| Cost | <$0.05 per output | Launch |
| Speed | <2s UI response (P95) | Week 1 |
| Adoption | 500+ early adopters | Month 1 |
| PH ranking | #1 on launch day | Launch |
| Retention | 70%+ MAU | Month 6 |
| Languages | English + Spanish | MVP |
| Break-even | 6 months | 6 months |

## 🔐 Security & Privacy

- ✅ API keys stored in environment, never hardcoded
- ✅ User data encrypted at rest
- ✅ Secrets managed server-side only
- ✅ WCAG 2.1 AA accessibility
- ✅ Consent tracking for voice/likeness cloning
- ✅ Data deletion on demand

## 💰 Financial Model

- **MVP launch cost:** ~$15,000 (design, engineering, infrastructure)
- **Monthly operational cost:** ~$500–1,000 (compute, storage, APIs)
- **Revenue model:** White-label deployments ($5K–20K/mo), premium models, add-ons
- **Target:** Break-even in 6 months, 5× ROI on premium features by month 12
- **Sustainability:** 10% of profits allocated to open-source contributions

## 🌍 Localization

Supported languages:
- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr) — planned for Q2
- 🇵🇹 Portuguese (pt) — planned for Q3
- 🇯🇵 Japanese (ja) — planned for Q4

Uses i18n framework for easy translation management.

## 🤝 Contributing

1. Read HART.md and SPEC.md to understand the vision
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Follow TDD: write tests first, then code
5. Ensure spec compliance (run TEST_SPEC.md checklist)
6. Submit a pull request

See CONTRIBUTING.md for detailed guidelines.

## 📄 License

More-of-Less is built on open-source foundations and respects all dependencies' licenses. See LICENSE for details.

## 📞 Support

- **Documentation:** https://docs.moreofless.studio
- **Community:** https://discord.gg/moreofless
- **Issues:** https://github.com/executiveusa/moreoflessstudios.com/issues
- **Email:** support@moreofless.studio

---

**Built with ❤️ for creators. Powered by open-source AI.**

# More-of-Less Studio: Complete Specification

## 1. Vision & Mission

**Vision:** Liberate DJs, musicians, and video creators from the complexity of multiple tools. Provide a single conversational studio that can mix/master audio, generate visuals, create music videos, and manage promotions through voice and simple chat.

**Mission:** Build a multi-agent platform on the Pi agent framework that combines best-in-class open-source models (LTX, ComfyUI, Higgsfield, Open Generative AI), flexible UI modules, and smart orchestration. Support English and Spanish at launch.

**Philosophy:** Empower creators with freedom and transparency. Avoid paywalls and lock-ins. Favor open models and self-hosted options. Design for accessibility (Steve Krug principles). Hide technical complexity behind conversational interface.

## 2. Core Values

| Value | Definition |
|-------|-----------|
| **User Ownership** | Artists own data, characters, and output. System never sells/shares without consent. |
| **Simplicity** | Minimalist interfaces, discoverable. Advanced controls only in Expert Mode. |
| **Agentic Autonomy** | Agents negotiate tasks, escalate only for human approval. Chat-first interface. |
| **Accessibility** | Multi-lingual (English/Spanish launch), inclusive design, WCAG compliance. |
| **Ethics & Consent** | No voice/likeness cloning without explicit consent. Respect copyright and licensing. |
| **Sustainability** | Long-term maintainability, testability, monetization via white-label not subscriptions. |

## 3. Architecture

### Mono-repo Structure
```
more-of-less-studios.com/
├── apps/
│   ├── web/               # Studio UI (React/Next.js)
│   ├── api/               # Business logic & storage (FastAPI/Node)
│   ├── agent/             # Pi agent orchestrator & skills
│   └── workers/           # Media processors (FFmpeg, LTX, ComfyUI)
├── .skills/
│   ├── more-of-less-core/ # Core HART, SPEC, SKILL
│   ├── audio-agent/       # Mixing, mastering, stem separation
│   ├── video-agent/       # LTX/Comfy/Higgsfield orchestration
│   ├── character-agent/   # Character passport management
│   └── ...                # Other specialized agents
├── tests/
│   ├── unit/              # Component tests
│   ├── integration/       # Agent coordination tests
│   └── e2e/               # Full workflow validation
└── docs/
    ├── architecture.md
    ├── api.md
    └── user-guide.md
```

### Backend Orchestration
- **Pi agent:** Plans, memory, tool invocation, sub-agent coordination
- **Skills:** Audio analysis, video generation, mixing/mastering, character continuity, provider routing, publishing
- **Data layer:** Projects, assets, character passports, job plans, knowledge graph as versioned JSON
- **API:** GraphQL or REST for retrieval; WebSocket for real-time job updates

### Front-end
- **Design inspiration:** Suno (clean layout) + Higgsfield (cinematic)
- **Color palette:** Dark modern with high contrast, generous white space
- **Tabs:** Dashboard, Music Video, Visualiser, Audio Studio, Character Lab, Project Library
- **Chat panel:** Persistent Pi agent interface, voice-first option
- **Responsive:** Desktop, tablet, mobile support

### Model Providers
- **Priority order:** Local (Higgsfield, LTX, ComfyUI) → Fal.ai → Hugging Face
- **Adapters:** MuAPI, Open Generative AI for existing capabilities
- **Fallback:** Human-readable error messages with cost estimates

## 4. Multi-Agent Roles

| Agent | Responsibility |
|-------|----------------|
| **Product Agent** | Vision prioritization, user feedback, market trends |
| **Design Agent** | UI/UX audit (Steve Krug), consistency, accessibility |
| **Engineering Agent** | TDD implementation, architecture, provider integration |
| **Audio Agent** | Mixing, mastering, stem separation, genre presets |
| **Video Agent** | Scene planning, prompt building, LTX/Comfy invocation, character continuity |
| **Character Agent** | Passport management (appearance, LoRAs, seeds), consistency enforcement |
| **Marketing Agent** | Promotional content (Postiz, Graphify), scheduling, SEO |
| **Financial Agent** | Cost tracking, budgets, ROI, monetization options |
| **Analytics Agent** | User preference learning, knowledge graph, recommendations |
| **Voice Agent** | Voice interaction, booking, remote control (OSC/MIDI), crowd analysis |

## 5. Design Guidelines

### Look & Feel
- Dark, modern color palette with high contrast
- Generous white space (Suno-inspired)
- Clear typography, waveform displays
- Professional, calm aesthetic

### Navigation
- **Tabs:** Dashboard, Music Video, Visualiser, Audio Studio, Character Lab, Project Library
- **Consistency:** Same navigation across all languages
- **Discoverability:** Common actions visible, advanced features in Expert Mode

### Progress & Feedback
- Job status with human-readable messages
- Cancel or remake individual scenes
- Error messages with remediation steps

### Conversational UI
- Persistent chat panel (Pi agent)
- Voice and text first-class
- Dynamic layout changes via voice ("Create a visualiser", "Change to dark mode")
- Speech recognition for voice commands

### Language & Voice
- i18n framework (next-i18next)
- English (en) and Spanish (es) directories
- 11 Labs integration for TTS/STT
- Locale detection and easy switching
- Language-aware prompts (e.g., Spanish lyrics for Spanish songs)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigability
- ARIA labels
- Sufficient color contrast
- Optional subtitles for audio previews

## 6. MVP Roadmap (3–4 months)

**Phase 1: Foundation**
- Implement phase-1 hardening and skill files
- Create basic audio mastering and visualiser jobs
- Implement character passport creation

**Phase 2: Integration**
- Build Pi agent with core skills
- Connect audio/video workers
- Create clean, responsive UI

**Phase 3: Launch**
- English and Spanish UI
- Voice commands (optional at MVP)
- Product Hunt launch
- Gather early adopter feedback

## 7. Long-term Vision (1–2 years)

- Crowd analysis and live DJ control
- Expand to 5+ languages
- Multi-agent booking, marketing, logistics
- Knowledge graph for personalized recommendations
- Open API for third-party plugins
- Remote hardware control (MIDI/OSC)

## 8. Success Criteria

- **Quality:** 4.5+ star peer review rating
- **Cost:** <$0.05 per professional output
- **Speed:** <2s UI response time
- **Adoption:** 500+ early adopters in month 1, Product Hunt #1 on day 1
- **Retention:** 70%+ monthly active users by month 6

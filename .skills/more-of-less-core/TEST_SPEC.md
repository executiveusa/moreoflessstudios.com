# More-of-Less: Test & Validation Specification

## Spec Compliance Checklist

This document defines test cases that validate the More-of-Less specification is complete and implementable.

### A. Identity & Values (HART.md)

- [ ] **T-A1:** Agent can articulate its purpose in conversational format
  - Test: `agent.describe_purpose()` returns mission statement with <50 words
  - Expected: "I am the More-of-Less agent, a personal AI studio for creators..."

- [ ] **T-A2:** All core values are documented and referenced in decisions
  - Test: Run 10 jobs, verify each log includes relevant value(s)
  - Expected: At least 80% of logs reference a value (User Ownership, Simplicity, etc.)

- [ ] **T-A3:** Ethical code is enforced (no copyrighted remix, consent required)
  - Test: Attempt to remix copyrighted track without rights
  - Expected: Agent raises error: "Requires copyright license to remix"

- [ ] **T-A4:** Cost tracking and budget enforcement works
  - Test: Set user budget to $2.00, submit job costing $3.00
  - Expected: Agent escalates: "Budget exceeded. Approve additional $1.00? (Y/n)"

### B. Architecture (ARCHITECTURE.md)

- [ ] **T-B1:** Data model supports all required entities
  - Test: Create project with all required fields (projects, assets, jobs, characters)
  - Expected: All data persisted and retrievable via API

- [ ] **T-B2:** API endpoints follow REST conventions
  - Test: Call all 12 documented endpoints with valid/invalid payloads
  - Expected: 200 OK for valid, 400/401/404 for invalid with clear error messages

- [ ] **T-B3:** Provider routing prioritizes local models
  - Test: Submit 5 jobs with local providers available
  - Expected: All 5 use local providers; total cost <$0.10

- [ ] **T-B4:** Job queue handles concurrent processing
  - Test: Submit 10 jobs in parallel, monitor queue
  - Expected: All complete within 2× sequential time, no race conditions

- [ ] **T-B5:** WebSocket updates are real-time
  - Test: Listen to job status via WebSocket, monitor latency
  - Expected: Status updates within 500ms of completion

### C. Multi-Agent Coordination (AGENTS.md)

#### Audio Agent

- [ ] **T-C1-Audio:** Audio analysis extracts correct musical features
  - Test: Analyze 5 test tracks (known BPM, key)
  - Expected: 95%+ accuracy on BPM and key detection

- [ ] **T-C2-Audio:** Mastering preserves audio quality while normalizing loudness
  - Test: Master audio, compare before/after spectrogram
  - Expected: <3dB change in frequency response, loudness within target ±1 LUFS

- [ ] **T-C3-Audio:** Stem separation produces usable isolated tracks
  - Test: Separate 3 test tracks, verify vocals isolated, drums isolated
  - Expected: <15% vocal bleed in drum track, <15% drum bleed in vocal track

#### Video Agent

- [ ] **T-C4-Video:** Scene planning respects audio structure
  - Test: Plan video for 180s song with known structure
  - Expected: Scenes align to intro/verse/chorus boundaries (±3 seconds)

- [ ] **T-C5-Video:** Video generation completes within time budget
  - Test: Generate 3 scenes (32s each), measure wall time
  - Expected: Completion in <2 minutes per scene with Higgsfield

- [ ] **T-C6-Video:** Video stitching produces seamless transitions
  - Test: Stitch 3 video clips, rate visual smoothness
  - Expected: No visible cuts or audio glitches; smooth fade transitions

#### Character Agent

- [ ] **T-C7-Char:** Character passport creation saves all fields
  - Test: Create character with appearance, LoRA, seed, voice
  - Expected: All fields retrievable, consistent across 3+ projects

- [ ] **T-C8-Char:** Continuity validation detects appearance mismatches
  - Test: Generate video with wrong hair color vs. passport
  - Expected: Validation flags issue: "Appearance mismatch in scene 2"

- [ ] **T-C9-Char:** Prompt injection includes character constraints
  - Test: Generate scene prompt for character with specific rules
  - Expected: Final prompt includes 3+ character details (appearance, style, behavior)

#### Other Agents (Financial, Analytics, Marketing, Voice)

- [ ] **T-C10-Fin:** Financial agent logs all costs with <1% rounding error
  - Test: Submit 10 jobs, verify total cost
  - Expected: Total cost matches sum of individual job costs ±$0.01

- [ ] **T-C11-Ana:** Analytics agent learns user preferences from 5+ projects
  - Test: Complete 5 projects in different genres, request preference model
  - Expected: Agent correctly identifies primary genre and mood preference

- [ ] **T-C12-Mark:** Marketing agent generates clips from full video
  - Test: Request 15s, 30s, 60s clips from 180s video
  - Expected: Clips correctly extracted with highlight detection; all <1MB

- [ ] **T-C13-Voice:** Voice command execution works for 10+ common tasks
  - Test: Execute voice commands: "Create visualiser", "Change to dark mode", etc.
  - Expected: 95%+ command success rate, clear voice feedback

### D. API & Integration (SKILL.md)

- [ ] **T-D1:** REST API supports CRUD for all entities
  - Test: Create, read, update, delete for projects, assets, jobs, characters
  - Expected: All operations return correct status codes and data

- [ ] **T-D2:** Multi-language support (English, Spanish)
  - Test: Switch language to Spanish, verify all UI strings translated
  - Expected: 100% of user-facing strings have Spanish translation

- [ ] **T-D3:** Error messages are human-readable and actionable
  - Test: Trigger 10 common errors (missing API key, file not found, etc.)
  - Expected: Each error message <100 chars, suggests remediation

- [ ] **T-D4:** Rate limiting prevents abuse
  - Test: Send 1000 requests in 10 seconds
  - Expected: Requests throttled after rate limit; clear 429 response

- [ ] **T-D5:** Authentication enforces user isolation
  - Test: Log in as User A, attempt to access User B's projects
  - Expected: 403 Forbidden response

### E. UI/UX (Design Guidelines)

- [ ] **T-E1:** UI responds within 2 seconds for all interactions
  - Test: Measure response time for 50 common interactions
  - Expected: P95 latency <2s, P99 <5s

- [ ] **T-E2:** Chat panel accepts voice input and displays transcription
  - Test: Speak "Create a music video", verify text appears and agent responds
  - Expected: Transcription accuracy >90%, agent response within 3s

- [ ] **T-E3:** Job progress is visible throughout workflow
  - Test: Submit job, monitor UI for status updates
  - Expected: Status updates every 5 seconds with ETA and % complete

- [ ] **T-E4:** Mobile UI (320px–768px) remains usable
  - Test: View dashboard, music video tab, character lab on mobile
  - Expected: No horizontal scroll, readable text, touch targets >48px

- [ ] **T-E5:** WCAG 2.1 AA compliance verified
  - Test: Run Axe accessibility scanner on all pages
  - Expected: Zero critical or serious issues, <5 minor issues

### F. Security & Privacy

- [ ] **T-F1:** API keys never logged or exposed to frontend
  - Test: Search logs and browser DevTools for API keys
  - Expected: Zero matches for OPENAI_API_KEY, ELEVENLABS_API_KEY, etc.

- [ ] **T-F2:** Secrets retrieved from environment, never hardcoded
  - Test: Grep codebase for API keys in source
  - Expected: Zero hardcoded secrets

- [ ] **T-F3:** User data is encrypted at rest
  - Test: Inspect database for sensitive fields (project metadata)
  - Expected: Sensitive data encrypted with user-specific key

- [ ] **T-F4:** User can delete all personal data on demand
  - Test: Request data deletion, verify all associated records removed
  - Expected: All projects, assets, characters removed within 24 hours

- [ ] **T-F5:** Consent status tracked for voice/likeness cloning
  - Test: Create character, attempt to clone voice without consent
  - Expected: Agent raises error: "Voice cloning requires explicit consent"

### G. Performance & Scalability

- [ ] **T-G1:** Audio mastering completes in <10 seconds
  - Test: Master 10 different audio files
  - Expected: All complete in <10s, consistent quality

- [ ] **T-G2:** Video generation (local Higgsfield) completes in <2 minutes per 30s
  - Test: Generate 5 × 30s video clips
  - Expected: All complete in <2 minutes each

- [ ] **T-G3:** Stem separation completes in <60 seconds
  - Test: Separate 5 tracks
  - Expected: All complete in <60s, usable output

- [ ] **T-G4:** Database queries return in <100ms (p95)
  - Test: Run 1000 typical queries
  - Expected: P95 latency <100ms

- [ ] **T-G5:** System scales to 1000 concurrent users
  - Test: Load test with 1000 simultaneous users
  - Expected: <5% error rate, P95 latency <5s

### H. MVP Readiness (Section 8 of SPEC.md)

- [ ] **T-H1:** Phase 1 hardening complete
  - Test: Review SKILL.md integration checklist
  - Expected: All 10 items checked

- [ ] **T-H2:** Basic audio mastering workflow functional
  - Test: Upload audio → master → download result
  - Expected: Output is loudness-normalized and audibly improved

- [ ] **T-H3:** Basic video generation workflow functional
  - Test: Upload audio → generate 3-scene video → download
  - Expected: Video is 1080p, synced to audio, coherent scenes

- [ ] **T-H4:** Character passport creation and reuse working
  - Test: Create character → reuse in 3 videos → verify consistency
  - Expected: Character appears consistent across all videos

- [ ] **T-H5:** UI is clean and responsive on desktop + mobile
  - Test: View all tabs on 1920×1080 and 375×812 screens
  - Expected: No layout breaks, all controls accessible

- [ ] **T-H6:** Multi-language support (English + Spanish) complete
  - Test: Switch to Spanish, verify all UI text translated
  - Expected: 100% translation coverage, no English fallback

- [ ] **T-H7:** Voice commands functional (at least 5 core commands)
  - Test: Execute: "Create visualiser", "Remix this track", "Change mood to happy"
  - Expected: All 5 commands execute correctly

- [ ] **T-H8:** Cost tracking and budget enforcement working
  - Test: Set budget, run jobs, verify costs logged and budget enforced
  - Expected: Costs accurate to <$0.01, user alerted at 80% of budget

## Test Execution Plan

### Phase 1: Unit Tests (Week 1)
- Run spec compliance tests A, D, F
- Target: 95%+ pass rate

### Phase 2: Integration Tests (Week 2)
- Run spec compliance tests B, C, E, G
- Target: 90%+ pass rate

### Phase 3: E2E Tests (Week 3)
- Run spec compliance tests H (MVP readiness)
- Target: 100% pass rate

### Phase 4: User Acceptance (Week 4)
- Beta test with 10 early adopters
- Verify 80%+ feature satisfaction

## Continuous Validation

After launch, run spec compliance tests weekly:
- **T-A, T-D, T-F:** Every build (security-critical)
- **T-B, T-C, T-E, T-G:** Weekly (functional)
- **T-H:** Monthly (MVP metrics)

Maintain a public dashboard: https://status.moreofless.studio/

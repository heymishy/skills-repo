## Epic: Phase 2 — Copilot CLI execution engine (backend)

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** Walking skeleton (engine layer before UI layer)

## Goal

The web backend can spawn a GitHub Copilot CLI subprocess (or ACP server session) on behalf of an authenticated user, execute a named skill with an assembled prompt, capture JSONL output, and return a structured result — with session state isolated per user via `COPILOT_HOME`, skills auto-discovered from the repo's `.github/skills/` directory, and BYOK/self-hosted configuration supported. No browser UI is built in this epic. The engine is verified by backend integration tests that assert correct subprocess invocation, output capture, and error handling. Epic 4 builds the guided UI on top of this engine.

## Out of Scope

- Any browser-facing UI for skill execution — that is Epic 4
- OAuth flow for the engine (it consumes an already-authenticated token from Epic 1) — no new auth in this epic
- Multi-turn ACP session UI — ACP server is used as infrastructure here; the conversation loop is Epic 4
- SKILL.md authoring or editing via the web UI — out of scope for the entire feature
- Skill execution for non-discovery skills in this epic — engine is proven with `/discovery`; extension to other skills is a configuration concern, not a new story

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Copilot CLI/API feasibility | Spike verdict: PROCEED | PROCEED confirmed with working proof of concept | This epic is the proof-of-concept realised as production-quality backend code |
| P2 — Unassisted /discovery completion rate | 0% — no execution engine exists | ≥70% of Phase 2 /discovery sessions produce valid artefact on first attempt | Without the engine, P2 is unmeasurable; this epic creates the pre-condition |

## Stories in This Epic

- [ ] wuce.9 — CLI subprocess invocation with JSONL output capture
- [ ] wuce.10 — Per-user session isolation (`COPILOT_HOME`) and session lifecycle management
- [ ] wuce.11 — SKILL.md discovery and skill routing (from `.github/skills/` and `COPILOT_SKILLS_DIRS`)
- [ ] wuce.12 — BYOK / self-hosted provider configuration (`COPILOT_PROVIDER_*`, `COPILOT_OFFLINE`)

## Human Oversight Level

**Oversight:** High
**Rationale:** This epic introduces server-side process spawning using user-scoped OAuth tokens. Security isolation between user sessions (COPILOT_HOME) is a security requirement, not an enhancement. Multi-tenant token handling must be reviewed at each story. Requires explicit human review before any story proceeds to coding.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable

# Decision Log: 2026-05-02-web-ui-copilot-execution-layer

**Feature:** Web UI + Copilot Execution Layer
**Discovery reference:** `artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md`
**Last updated:** 2026-05-02

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-05-02 | ASSUMPTION | spike**
**Decision:** High-risk assumption validated — Copilot CLI CAN be invoked non-interactively server-side. Spike verdict is PROCEED.
**Alternatives considered:** REDESIGN (use GitHub Models API directly with SKILL.md as system prompt); DEFER (insufficient public docs).
**Rationale:** The CLI has a first-class programmatic mode (`-p` flag, `--output-format=json`, `--silent`, `--no-ask-user`), headless authentication via `COPILOT_GITHUB_TOKEN` env var, native SKILL.md discovery from `.github/skills/`, BYOK support for self-hosted deployments, and an ACP (Agent Client Protocol) server mode for multi-turn web integration. All four done conditions met. See full spike outcome artefact.
**Made by:** Agent (automated investigation) — acknowledged by Hamish King as sponsor
**Revisit trigger:** If GitHub deprecates the `-p` flag or removes programmatic mode; or if the "Copilot Requests" PAT permission scope changes.
---

---
**2026-05-02 | ARCH | spike**
**Decision:** Phase 2 execution model: web backend spawns Copilot CLI as subprocess (or ACP server) with user's OAuth token as `COPILOT_GITHUB_TOKEN`, per-user `COPILOT_HOME` isolation, `COPILOT_SKILLS_DIRS` pointing to skills directory.
**Alternatives considered:** (a) Direct GitHub Models REST API calls with SKILL.md injected as system prompt — would lose the CLI's multi-tool agent loop, skill invocation chain, and session management. (b) GitHub Copilot Chat REST API — no documented programmatic endpoint for skill execution. (c) MCP server only — MCP provides tools but not the full agent orchestration that SKILL.md skills depend on.
**Rationale:** The Copilot CLI subprocess model preserves the full skill execution pipeline (SKILL.md → agent loop → tool calls → output). The ACP TCP server mode provides cleaner multi-turn session management for a web UI. The BYOK path (`COPILOT_PROVIDER_*` env vars) enables self-hosted deployments without routing through GitHub's Copilot service. These were not expected to be available based on discovery-phase assumptions — the spike validated all of them from public docs.
**Made by:** Agent (spike investigation) — to be formally confirmed at /definition
**Revisit trigger:** If ACP server exits public preview with breaking changes; or if per-user `COPILOT_HOME` isolation proves insufficient for multi-tenant security.
---

---
**2026-05-02 | ARCH | phase-1**
**Decision:** Phase 1 write-back (sign-off, annotations) uses the authenticated user's GitHub OAuth token with `repo:write` scope via the GitHub Contents API directly — not via the Copilot CLI.
**Alternatives considered:** Service account token with delegated write access — rejected because it breaks identity attribution (commits would show a bot, not the approver). Copilot CLI as write agent — not applicable; Phase 1 has no skill execution requirement and routing a structured API call through the CLI adds unnecessary complexity and a Copilot licence dependency where none is needed.
**Rationale:** Phase 1 has no skill execution requirement. The write is a structured pipeline-state update or artefact append, not a model-mediated action. Using the user's token directly (not a service account) satisfies the identity attribution non-negotiable from discovery. The OAuth App must request both `repo` (read + write) scope at authorisation time; the write path is only exercised for sign-off and annotation actions. ADR-009 applies: read and write are separate permission concerns handled by the same OAuth token with appropriate scope grants — the handlers must remain separately structured.
**Made by:** Hamish King (sponsor) — confirmed at /definition
**Revisit trigger:** If GitHub's fine-grained PAT model changes the `repo:write` scope requirements for Contents API calls.
---

---

## Architecture Decision Records

### ADR-001: Phase 2 Skill Execution via Copilot CLI Subprocess/ACP

**Status:** Accepted
**Date:** 2026-05-02
**Decided by:** Hamish King (sponsor) — based on spike outcome

#### Context

The web UI + Copilot execution layer (Phase 2) requires the web backend to execute pipeline skills (SKILL.md files from `.github/skills/`) on behalf of non-engineer users. The question was whether this could be done by calling GitHub Copilot CLI non-interactively server-side, or whether a different invocation model was needed.

The high-risk assumption in the discovery artefact stated: "Copilot CLI can be invoked non-interactively server-side — spike required."

#### Decision

Use the GitHub Copilot CLI programmatic interface (`-p` flag) or ACP server mode as the Phase 2 execution engine. The web backend:
1. Sets `COPILOT_GITHUB_TOKEN` to the user's stored OAuth token (Copilot licence required)
2. Sets `COPILOT_HOME` to a per-user isolated directory for session state
3. Sets `COPILOT_SKILLS_DIRS` to the pipeline's `.github/skills/` directory
4. Invokes `copilot -p "/skill-name [context]" --no-ask-user --allow-all-tools --silent --output-format=json`
5. OR: Starts a per-session ACP TCP server and uses `@agentclientprotocol/sdk` for multi-turn

For self-hosted deployments where routing through GitHub Copilot is not acceptable:
- Set `COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, `COPILOT_MODEL`
- Set `COPILOT_OFFLINE=true` to prevent any GitHub Copilot service calls
- Skills continue to work from local filesystem; GitHub MCP server and `/delegate` become unavailable

#### Alternatives considered

**Direct GitHub Models API**: Would require reimplementing the full SKILL.md execution pipeline (context assembly, tool dispatch, multi-turn session management) in application code. Loses the tested agent loop that the CLI provides. Viable fallback if CLI approach fails at scale.

**GitHub Copilot Extensions API**: No documented programmatic endpoint for invoking extensions server-side as of 2026-05-02 docs review.

**MCP server only**: Provides tools but not the agent orchestration layer that multi-turn SKILL.md execution requires.

#### Consequences

- Phase 2 requires Copilot licence per execution user. This was already known and is documented in benefit-metric.md (P2 metric annotation). No change to scope.
- ACP server is in public preview — use the stable `-p` subprocess path as primary, ACP as preferred option once it reaches GA.
- Per-user `COPILOT_HOME` isolation is a security requirement for multi-tenant deployment. Must be implemented before Phase 2 goes to production.
- OAuth token lifecycle (expiry, refresh) is not covered by the spike — must be addressed in Phase 2 stories.

---
**2026-05-02 | ARCH | scale**
**Decision:** Phase 2 service account pool required for production at >25 concurrent sessions. Single service account is acceptable for pilot (≤10 concurrent sessions). Service account pool (wuce.17 candidate) deferred to post-pilot based on observed concurrency from P2 metric. Concurrency cap: 20 concurrent Phase 2 sessions per Container Apps instance. Queue model for overflow. Revisit trigger: P2 metric (concurrent session count) observed at 30 days post Phase 2 launch.
**Alternatives considered:** Immediate multi-account pool implementation — deferred as premature optimisation given P2 baseline is unknown; in-process concurrency limiter without queue — rejected as it would drop requests silently rather than hold them.
**Rationale:** Pilot phase (≤10 concurrent sessions) does not justify the operational cost of a service account pool. The P2 metric provides the empirical signal needed to right-size the pool. The 20-session cap with a queue model ensures graceful degradation rather than hard failure if the cap is reached during the pilot. wuce.17 is the natural candidate story if the 30-day P2 observation confirms the need.
**Made by:** Hamish King (sponsor)
**Revisit trigger:** P2 concurrent session count observed at 30 days post Phase 2 launch.
---

---
**2026-05-04 | SCOPE | wuce.18-post-merge**
**Decision:** wuce.18 (HTML shell and navigation) implementation extended scope beyond DoR contract to include `src/web-ui/routes/dashboard.js` and wiring in `src/web-ui/server.js`. The DoR contract (`wuce.18-html-shell-navigation-dor-contract.md`) explicitly listed these files as out of scope ("MUST NOT be touched"). The Coding Agent Instructions block in the same DoR artefact, and the story ACs (AC1: GET /dashboard returns HTML+nav; AC2: unauthenticated → 302) and test plan (T9–T18) all required a working HTTP route to satisfy the tests. Coding agent followed the Coding Agent Instructions block as the authoritative specification — this is correct per agent-orientation.instructions.md. The contradiction between the contract and the Coding Agent Instructions block is a DoR authoring defect: the contract was written to a narrower scope than the ACs and tests implied.
**Impact on wuce.19–25:** `src/web-ui/routes/dashboard.js` and the `/dashboard` route now exist on master as a result of wuce.18. Wave B stories (wuce.19–22) must import `renderShell()` from `src/web-ui/utils/html-shell.js` (per their DoR contracts) and must not re-implement or duplicate it. `escHtml()` canonical location is `src/web-ui/utils/html-shell.js` — all subsequent stories that need HTML escaping must import from there.
**Alternatives considered:** Splitting the PR to land only html-shell.js first — rejected because all 18 tests in the test plan require the full integration (including route tests T9–T18) to pass, and splitting would leave the test suite permanently red until a follow-up story.
**Rationale:** Coding Agent Instructions block takes precedence over the contract when the two conflict, because the instructions are derived from the ACs and test plan — the source of truth for what "done" means. The contract scope was too narrow.
**Preventive measure for wuce.19–25:** DoR contracts for Wave B/C stories should be verified to match their Coding Agent Instructions blocks before dispatch. Contracts that say "MUST NOT touch server.js" when the ACs require a new route will cause the same conflict.
**Made by:** Agent (automated — post-merge observation, flagged in PR #293 oversight comment)
**Revisit trigger:** If a Wave B/C DoR contract also contradicts its Coding Agent Instructions block — surface before implementing, not after.
---

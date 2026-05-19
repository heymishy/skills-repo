## Story: BYOK and self-hosted provider configuration

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e3-phase2-execution-engine.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **platform operator deploying to an air-gapped or regulated environment**,
I want the execution engine to route Copilot CLI skill invocations to a self-hosted or BYOK model provider (Azure OpenAI, Anthropic, Ollama) when configured,
So that Phase 2 skill execution works in environments where routing through GitHub's Copilot service is not permitted by security or data sovereignty policy.

## Benefit Linkage

**Metric moved:** M2 — Phase 1 stakeholder activation rate (also enables M1 coverage for BYOK deployments)
**How:** Enterprise environments with data-residency or air-gap requirements will not activate on Phase 2 if all skill executions must route through GitHub's external Copilot service; BYOK configuration removes that barrier for the regulated-enterprise segment.

## Architecture Constraints

- ADR-004: all BYOK configuration (`COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, `COPILOT_MODEL`, `COPILOT_OFFLINE`) must be read from environment variables — never from user-supplied request parameters
- Mandatory security constraint: `COPILOT_PROVIDER_API_KEY` must be loaded from environment and injected into the subprocess env — never logged, never returned in API responses
- ADR-012: BYOK mode is a configuration of the execution adapter (`executeSkill`), not a separate code path — the adapter reads provider env vars and sets them on the subprocess environment before spawning

## Dependencies

- **Upstream:** wuce.9 (BYOK env vars are injected into the same subprocess environment configured in wuce.9)
- **Downstream:** None — BYOK is an optional deployment mode; all Epic 4 stories work with or without it configured

## Acceptance Criteria

**AC1:** Given the environment variables `COPILOT_PROVIDER_TYPE=azure`, `COPILOT_PROVIDER_BASE_URL=<url>`, `COPILOT_PROVIDER_API_KEY=<key>`, and `COPILOT_MODEL=<model>` are set, When the execution engine spawns a Copilot CLI subprocess, Then those four env vars are present in the subprocess environment alongside `COPILOT_GITHUB_TOKEN`.

**AC2:** Given `COPILOT_OFFLINE=true` is set, When the subprocess is spawned, Then `COPILOT_OFFLINE=true` is present in its environment — and the spike-confirmed behaviour (no GitHub Copilot service calls) is the expected outcome (verified by subprocess not requiring `COPILOT_GITHUB_TOKEN` to be set for model inference).

**AC3:** Given no `COPILOT_PROVIDER_*` env vars are set, When the engine spawns a subprocess, Then no BYOK env vars are injected — the subprocess uses its default GitHub Copilot routing.

**AC4:** Given `COPILOT_PROVIDER_API_KEY` is set in the server environment, When any API response is serialised or any log line is written, Then the API key value does not appear in any log output or HTTP response body.

**AC5:** Given the server starts with `COPILOT_PROVIDER_TYPE` set but `COPILOT_PROVIDER_BASE_URL` absent, When the startup configuration is validated, Then the server logs a warning ("BYOK provider type set but base URL is missing — Phase 2 execution may fail") and continues to start — it does not crash on partial BYOK configuration.

## Out of Scope

- A UI configuration screen for BYOK settings — configuration is always via environment variables only (ADR-004); no admin console in Phase 1 or Phase 2
- Validating that the configured provider endpoint is reachable at startup — post-MVP; acceptable to fail at first execution
- Support for providers beyond the three confirmed in the spike (Azure OpenAI, Anthropic, Ollama) — additional providers are a configuration concern, not a code change, once the env var injection pattern is in place

## NFRs

- **Security:** Provider API key never logged or serialised. Injected via env var only. Startup warning on partial config.
- **Audit:** BYOK mode active/inactive logged at server startup (provider type only — no key values).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

# Review Report: BYOK and self-hosted provider configuration — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.12-byok-config.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[12-L1]** [C — AC quality] — AC4 asserts "the API key value does not appear in any log output or HTTP response body." The "HTTP response body" portion is testable by mocking the serialiser and inspecting output. The "any log line" portion is not testable in full generality — a coding agent can test the specific log-writing paths it knows about but cannot assert that no code path accidentally emits the key. Consider tightening the scope to "the structured log events for startup, subprocess invocation, and API response serialisation" rather than "any log line", to give the implementing agent a testable contract while preserving the intent.

- **[12-L2]** [E — Architecture] — ADR-009 (execution module separation) is not cited in the Architecture Constraints, despite wuce.12 explicitly configuring the `executeSkill` adapter that ADR-009 governs. The constraint text correctly follows ADR-009 ("BYOK mode is a configuration of the execution adapter, not a separate code path") but omits the citation. Add `ADR-009` to the Architecture Constraints for traceability — a future agent modifying the execution adapter should see both ADRs together.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 4 | PASS | All references present. Benefit linkage names two metrics (M2 primary, M1 secondary for BYOK deployments) with a mechanism sentence for each — the clearest multi-metric linkage in the feature so far. Score reflects that the enterprise regulated-environment persona is not explicitly named in the benefit-metric artefact; the linkage is sound but slightly removed from the P-series metrics. |
| B — Scope integrity | 5 | PASS | Out of scope explicitly excludes a UI config screen (ADR-004 enforced), startup reachability validation, and additional providers. Discovery out-of-scope constraint on "non-GitHub SCM" does not apply here. |
| C — AC quality | 4 | PASS | 5 ACs in Given/When/Then. AC1–AC3 cover the three env var states (BYOK configured, offline mode, no config). AC4 covers key non-leakage. AC5 covers partial config graceful degradation. LOW on "any log line" testability scope in AC4 (12-L1). |
| D — Completeness | 5 | PASS | All template fields populated. Named persona (platform operator deploying to air-gapped or regulated environment) — the most specific deployment context persona in the feature. No Accessibility NFR (appropriate for a backend config story). Audit NFR correctly limits logging to provider type, not key values. |
| E — Architecture | 4 | PASS | ADR-004 and ADR-012 cited. Security constraints on key injection via env var are precise. LOW on missing ADR-009 citation (12-L2) — the behaviour is correct but the ADR reference is absent. |

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome: PASS** — No MEDIUMs, no blockers for /test-plan. The two LOWs are note-for-retrospective items: tightening AC4's testability scope (12-L1) and adding a missing ADR-009 citation (12-L2). Both can be addressed in-story at any time before the coding agent runs.

# Review Report: Playwright E2E test infrastructure — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.17-playwright-e2e-infrastructure.md
**Date:** 2026-05-06
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

- **[17-L1]** [E — Architecture] — AC2 states the auth bypass is activatable "only when `NODE_ENV=test`". The story does not specify what happens if the server is started with `NODE_ENV=test` unintentionally in a staging environment. The DoR contract should reinforce that the bypass is guarded by the Playwright fixture injection path, not a server-wide middleware flag — this avoids any accidental bypass activation outside the test runner process.

- **[17-L2]** [B — Scope] — The AC4 opt-in gate pattern (context.yml `audit.e2e_tests`) mirrors the caa.3 CI attachment gate, but the story does not reference caa.3 explicitly. The coding agent should read `scripts/ci-attachment-config.js` for the pattern to follow, and the DoR coding agent instructions should name this reference explicitly.

- **[17-L3]** [C — AC quality] — AC5 specifies placeholder spec files with `test.todo()` stubs but does not state the minimum number of stubs per file. Without a minimum, the coding agent could create a file with a single `test.todo('placeholder')` that gives E3/E4 subagents no navigational structure. The DoR coding agent instructions should require at minimum one stub per "human smoke test" step from the corresponding story's verification script.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | Benefit linkage to T1 (Wave 4 AC verification accuracy) is direct. Upstream dependency on wuce.1 (session cookie format) stated. Downstream consumers (E3/E4 subagents via placeholder specs) named. |
| B — Scope | 5 | PASS | Out-of-scope list is appropriately ambitious — visual regression, cross-browser, mobile viewports, and pre-wave-4 coverage all deferred. Boundary between infrastructure (this story) and test authoring (follow-on) is clean. LOW on caa.3 reference omission (17-L2). |
| C — AC quality | 4 | PASS | 5 ACs in Given/When/Then. All mechanically testable without human visual inspection. LOW on stub minimum in AC5 (17-L3). |
| D — Completeness | 5 | PASS | All story fields populated. Complexity 2 / Stable — well-matched to the scope. NFRs cover security (bypass guard), CI permissions (ADR-009), and developer experience. |
| E — Architecture | 4 | PASS | ADR-014 (proposed) establishes Playwright as the project E2E framework and makes future spec addition a contractual expectation in the DoR. Auth bypass guard constraint is explicit. LOW on bypass activation scope (17-L1). |

---

## Summary

0 HIGH, 0 MEDIUM, 3 LOW.
**Outcome: PASS** — Well-contained infrastructure story. All three LOWs are clarification items to be enforced in the DoR coding agent instructions, not gaps in AC quality. No scope creep risk — the infrastructure/authoring boundary is the cleanest of any wuce story reviewed.

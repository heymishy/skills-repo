## Test Plan: E2E coverage confirming both journey entry points reach definition-of-ready complete and every major stage resumes correctly

**Story reference:** artefacts/2026-08-10-full-journey-core-flow-e2e/stories/fjcv-s1-full-journey-core-flow-and-resume.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | E2E | Gap type | Risk |
|----|-------------|-----|----------|------|
| AC1 | ideate-first journey reaches DoR complete | 1 test | — | 🟢 |
| AC2 | discovery-first journey reaches DoR complete | 1 test | — | 🟢 |
| AC3 | 3 representative stages resumable per journey (6 total assertions) | covered within AC1/AC2's own tests | — | 🟢 |
| AC4 | zero real LLM calls throughout | covered within AC1/AC2's own tests | — | 🟢 |

---

## Coverage gaps

None blocking. Per the story's own Out of Scope: not every individual stage is resume-tested (3 representative checkpoints per journey instead of all 7-8) — accepted since the resume-view code path is stage-agnostic, and `rdac-s1`'s own spec already separately proves the real-browser mermaid-render half of resumability that this spec's server-rendered-text-only assertions don't re-check.

---

## Test Data Strategy

**Source:** Real signup + product creation + journey creation through the mock-gateway-backed local harness (`NODE_ENV=test`), reusing `bri-s3.2`'s own proven helper patterns (duplicated, not imported, per this repo's file-isolation convention).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no real staging or credits dependency.
**Owner:** Self-contained; unique `e2e-test-fjcv-s1-` prefixed email per run.

---

## E2E Tests

### fjcv-s1-full-journey-core-flow-and-resume.spec.js

- **Verifies:** AC1, AC3 (ideate/discovery/definition-of-ready checkpoints), AC4
- **Scenario:** Sign up, create a product, start a journey via `/ideate`, drive it through ideate's own multi-turn lens cycle (isc-s1/isc-s2) to completion, then through discovery -> benefit-metric -> design -> definition -> review -> test-plan -> definition-of-ready via the JSON `/turn` + `/gate-confirm` endpoints. Assert `/journey/:id/complete` shows the pass state. Assert `GET /journey/:id/stage/ideate`, `.../discovery`, and `.../definition-of-ready` each return real artefact + conversation content.
- **Tooling:** Playwright `request` context, local `NODE_ENV=test` harness — no real staging.

- **Verifies:** AC2, AC3 (discovery/definition/definition-of-ready checkpoints), AC4
- **Scenario:** Same as above but starting at `/discovery` directly (formed idea), skipping `/ideate` entirely. Assert `checkpoints.ideate` is `undefined` (never touched). Assert `GET /journey/:id/stage/discovery`, `.../definition`, and `.../definition-of-ready` each return real artefact + conversation content.
- **Tooling:** Same as above.

---

## Regression Tests

- `bri-s3.2-signup-onboarding-journey.spec.js` — re-run unmodified, confirms the discovery-first sequencing logic this story's own helper mirrors is unaffected.

---

## Out of Scope for This Test Plan

- Real-staging variant — not needed, per the story's own Out of Scope section.
- Per-stage exhaustive resumability — 3 representative checkpoints per journey, per the story's own Out of Scope section.

---

## Test Gaps and Risks

None identified as blocking. Verified 2x locally with zero flakiness (~4-9s total runtime for the 3-test file) before considering this story done.

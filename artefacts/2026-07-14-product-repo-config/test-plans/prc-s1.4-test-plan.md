## Test Plan: Prove the walking skeleton end-to-end with a real commit

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.4.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real sign-off through the actual web UI produces a real commit | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC2 | Commit content matches exactly (no corruption) | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC3 | Recorded as Metric 1's first real baseline measurement | — | — | — | 1 scenario | External-dependency | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Real GitHub API interaction, real browser session | AC1, AC2 | External-dependency | This story's entire purpose is proving the *real* system works, not a mocked simulation of it — mocking it would defeat the story | Manual scenario — see AC verification script 🔴 |

This story is explicitly a one-time proof, not a regression guard (that's `prc-s4.3`). No automated test suite is written for this story — see `decisions.md` if this needs a RISK-ACCEPT note (per review finding 1-M1, the environment this runs against should be explicitly named before /definition-of-ready).

---

## Test Data Strategy

**Source:** Real (not synthetic) — a real, disposable test product connected to a real, disposable GitHub repo. Per `/review` finding 1-M1, the specific environment (staging vs. local dev vs. a scratch product in production) must be named and a cleanup step defined before `/definition-of-ready` — this test plan does not resolve that ambiguity, it inherits it from the story.
**PCI/sensitivity in scope:** No.
**Availability:** Dependency — requires a real GitHub repo and a running instance of wuce reachable by the person performing the verification.
**Owner:** TBD — see review finding 1-M1; must be resolved before DoR.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real test product + real repo | Manually created for this verification | None | Environment TBD, see above |
| AC2 | The exact artefact content submitted for sign-off | Manually authored test content | None | |
| AC3 | Access to `benefit-metric.md`'s coverage matrix to record the result | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

⚠️ **TEST DATA GAP:** The specific environment (which real GitHub repo, which wuce deployment) is not yet named. This is a dependency before this story can be marked DoR-ready — add to `/decisions` as RISK-ACCEPT naming the environment and a cleanup step, or resolve directly, before `/definition-of-ready`.

---

## Unit Tests

None — this story has no automatable unit-level behaviour; it is a manual proof of previously-tested mechanisms working together for real.

---

## Integration Tests

None — see Unit Tests note; this story deliberately does not duplicate prc-s1.1–1.3's own integration test coverage.

---

## NFR Tests

None — confirmed with story owner (story's own NFR section states "None identified" for Performance and Security beyond what prior stories established).

---

## Out of Scope for This Test Plan

- Automating this as a permanent CI check — that is `prc-s4.3`'s job, with broader coverage across all 4 write paths, not just sign-off.
- Any synthetic/mocked test — mocking would defeat this story's entire purpose.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated coverage at all for this story | By design — it's a one-time manual proof, not a regression guard | `prc-s4.3` provides the permanent automated coverage this story's mechanism needs going forward |
| Environment not yet named (review finding 1-M1) | Discovered during `/review`, not yet resolved | Must be resolved via `/decisions` RISK-ACCEPT or direct clarification before `/definition-of-ready` |

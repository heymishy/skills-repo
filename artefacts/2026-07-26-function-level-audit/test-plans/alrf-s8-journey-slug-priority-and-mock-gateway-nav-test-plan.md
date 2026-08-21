## Test Plan: Journey featureSlug priority over response SLUG marker; mock-gateway toggle nav link

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s8-journey-slug-priority-and-mock-gateway-nav.md
**Epic reference:** None directly — operator-requested, found via manual staging testing
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test files (`tests/check-alrf-s8-journey-slug-priority.js`, plus a new case in `tests/check-b2-account-nav.js`) already existed and were merged (PR #620, 2026-07-26, bundled with `alrf-s9` — see that story's own DoD for the cross-feature bundling note); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `htmlSubmitTurn`: a journey-linked session's real `featureSlug` wins over the response's `---SLUG---` marker | 1 test | — | — | — | — | 🔴 |
| AC2 | `htmlSubmitTurn`: a session with no known `featureSlug` still falls back to the marker | 1 test | — | — | — | — | 🟢 |
| AC3 | The streaming handler (`handlePostTurnStreamHtml`) applies the same priority | 1 test | — | — | — | — | 🔴 |
| AC4 | The streaming handler falls back to the marker with no regression when no `featureSlug` is known | 1 test | — | — | — | — | 🟢 |
| AC5 | `/admin/mock-gateway` has a real, discoverable nav entry, admin-only | 1 test | — | — | — | — | 🟢 |
| AC6 | No regression to existing turn-completion / streaming / nav behaviour | — | 11 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

None. All 6 ACs have direct test coverage. AC1/AC3 marked 🔴 — this was the data-correctness bug affecting every real feature created on staging while the mock gateway was on; now correctly guarded.

---

## Test Data Strategy

**Source:** Synthetic — sessions with and without a known `session.featureSlug`, and mock-gateway response fixtures carrying the shared `---SLUG---\n2026-07-10-mock-fixture-feature` marker.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s8-journey-slug-priority.js` (4 assertions, AC1–AC4) and `tests/check-b2-account-nav.js`'s new `alrf-s7` case (1 assertion, AC5):

- **AC1:** `htmlSubmitTurn` prefers `session.featureSlug` over the response's `---SLUG---` marker when both are present.
- **AC2:** No known `featureSlug` — falls back to the marker (unchanged behaviour for standalone/CLI sessions).
- **AC3:** Streaming handler (`handlePostTurnStreamHtml`) applies the same priority.
- **AC4:** Streaming handler falls back to the marker with no regression when no `featureSlug` is known.
- **AC5:** `/admin/mock-gateway` has a real nav entry, admin-only; plus the pre-existing AC3 dangling-link check confirms the route genuinely resolves.

---

## Integration Tests

**AC6 (regression):** `check-dsq1-dynamic-next-question.js` (9/9), `check-dsq2-section-confirmation-loop.js` (10/10), `check-dsq4-section-artefact-assembly.js` (7/7), `check-srmw-s1-streaming-mock-gateway-wiring.js`, `check-stis-s1-guard-skill-turn-git-commit.js` (6/6), `check-wsm1-session-persistence.js` (23/23), `check-wuce26-per-answer-model-response.js` (14/14), `check-cmtt-s1-chat-message-text-truncation-fix.js` (8/8), `check-b1-nav-fix.js`, `check-kanban-consolidation.js`, `check-wuce18-html-shell.js` — all unchanged. Two pre-existing `check-mfc1-model-first-chat-session.js` failures confirmed via `git stash` to predate this change (missing local `ANTHROPIC_API_KEY`, unrelated).

---

## E2E Tests

None.

---

## NFR Tests

None named — a data-correctness bug fix, not a formally-tracked NFR.

---

## Out of Scope for This Test Plan

- The "Session not found" symptom itself — expected to resolve naturally once the slug fix lands (story's own Out of Scope).
- Whether staging should default to real Anthropic calls — the nav fix gives the operator the choice, not a policy decision.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

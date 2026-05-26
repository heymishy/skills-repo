# Review: wfp.11b — Interactive allocation assignment UI: person-centric and squad-centric views

**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot /review skill
**Story artefact:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11b.md

---

## FINDINGS

**1-M1 — MEDIUM — H-E2E triggered: person and squad views require Playwright E2E test coverage**

wfp.11b adds two new view panels (person-centric and squad-centric) to the HTML already served by `GET /workforce`. ACs 6, 7, and 11 all describe in-browser DOM interactions — tab navigation, filter controls, detail panels, bulk-assign action, unsaved-changes banner consistency — that cannot be verified by unit tests alone.

The test plan must include a Playwright spec file at `tests/e2e/wfp11b-person-squad-views.spec.js`. The spec must depend on the test server fixture established for wfp.11a (or reuse the same global setup). CSS-layout aspects (1280px width across all three views) are B2-visual and must be addressed via RISK-ACCEPT with a manual smoke test step, consistent with the approach declared in wfp.11a.

**1-L1 — LOW — AC7 "assign squad to initiative" edge case unspecified**

AC7 states the operator can "assign the entire squad to an initiative" in a single action and the action "stages all squad members as individual person entries in the in-memory allocation." However, the AC does not specify behaviour when one or more squad members are already staged or saved for that initiative. Without this, two reasonable implementations exist: (a) idempotent — skip members already present, add only the missing ones; or (b) replace — overwrite the existing entry for any member already present.

The DoR contract must specify option (a) as the required behaviour: skip members already staged or saved for the initiative, add only those not yet present. This avoids accidental data loss and is consistent with the "staged in memory without writing to disk" pattern established in wfp.11a.

---

## SCORES

| Category | Score | Notes |
|----------|-------|-------|
| A — Traceability | 5 | Epic, discovery, and benefit-metric references all present. M1 and M2 references accurate. Mechanism sentence is specific (person/squad views reduce cross-reference rework). Prerequisite story (wfp.11a) declared. |
| B — Scope integrity | 5 | Out-of-scope section is complete: no new routes, no handler modifications, no dashboards/workforce.html changes, no localStorage, no OVER_ALLOCATION_THRESHOLD UI control. Each exclusion references the reason (established in wfp.11a or Phase 2). |
| C — AC quality | 4 | 3 ACs in GWT format. AC6 specifies the 4 filter dimensions, over-allocation threshold, and shared-state consistency. AC7 specifies the bulk-assign picker and individual entry staging. AC11 specifies cross-view state consistency. One MEDIUM deduction: AC7 is ambiguous on the idempotency edge case (addressed in 1-L1 finding). Otherwise well-scoped. |
| D — Completeness | 5 | All template fields populated. Named persona (Head of Engineering). Complexity 2 with rationale (pure UI, no new routes). NFRs section explicit: scale (200 persons, 40 squads), performance (no additional GET /workforce/data calls), compatibility (1280px). |
| E — Architecture compliance | 5 | No new routes, no new deps, no new files beyond the E2E spec. Extends inline HTML/JS in workforce.js handler only. Shared in-memory state pattern declared. OVER_ALLOCATION_THRESHOLD as a const (not a CLI flag, not a server config) — consistent with architecture-guardrails.md. |

**Overall score: 4.8**

---

## VERDICT: PASS

1 MEDIUM finding (1-M1 — H-E2E trigger; Playwright E2E tests required) and 1 LOW finding (1-L1 — squad bulk-assign idempotency edge case must be specified in DoR contract). No HIGH findings. Story does not require rework before test planning.

**Notes for /test-plan:**
- No unit tests are needed for wfp.11b — there are no new route handlers, no new Node.js modules. All testable behaviour is in the browser-executed inline JavaScript. The test file is a Playwright E2E spec only.
- AC6 filter tests: use a fixture roster with at least 3 distinct product groups, 2 employment types, 3 squads, and 4 skill tags. Verify that each filter dimension reduces the displayed list correctly. Do not combine all four filters in a single test — test each dimension independently.
- AC6 over-allocation flag: the fixture must have at least one person with 3 or more initiative assignments (exceeding the `OVER_ALLOCATION_THRESHOLD` of 2). Assert that the person's row carries a visible warning indicator. Also assert that a person with exactly 2 assignments does NOT carry the warning (boundary condition).
- AC7 bulk-assign: stage "assign squad to initiative" → verify the in-memory state contains an entry for each squad member for that initiative. Then navigate to the initiative-centric view (established in wfp.11a) → verify those members appear in the initiative's assignee list. This is the critical cross-view consistency assertion.
- AC7 idempotency: run "assign squad to initiative" twice for the same squad+initiative → assert the number of entries in the staged state for that initiative equals the squad member count (not doubled).
- AC11 cross-view: use a multi-step Playwright test — (1) stage a change in initiative view; (2) navigate to person view; (3) assert banner still visible and staged-count unchanged; (4) navigate to squad view; (5) assert same; (6) navigate back to initiative view; (7) assert same; (8) click save; (9) assert banner dismissed in all three views.

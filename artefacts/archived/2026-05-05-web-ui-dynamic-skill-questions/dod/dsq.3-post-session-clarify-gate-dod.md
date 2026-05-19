# Definition of Done: Post-session /clarify gate for web UI skill sessions

**PR:** #311 | **Merged:** 2026-05-05
**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.3-post-session-clarify-gate.md
**Test plan:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/test-plans/dsq.3-post-session-clarify-gate-test-plan.md
**DoR artefact:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/dor/dsq.3-post-session-clarify-gate-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Acceptance Criterion 1: htmlRecordAnswer done=true causes nextUrl to point to /complete route, not directly to /commit-preview) | ✅ | T3.1 — nextUrl from final-answer htmlRecordAnswer is /skills/:name/sessions/:id/complete | Automated test `check-dsq3-post-session-clarify-gate.js` T3.1 | None |
| AC2 (Acceptance Criterion 2: /complete page renders "Draft complete ✅" heading, skill name, question count, "Commit artefact" button, and "Run /clarify first" link) | ✅ | T3.2 — /complete response includes all 4 required elements | Automated test T3.2 | None |
| AC3 (Acceptance Criterion 3: "Commit artefact" button links to existing commit-preview URL; commit flow unchanged) | ✅ | T3.3 — commit-preview URL present in complete page; commit-preview route still works as before | Automated test T3.3 | None |
| AC4 (Acceptance Criterion 4: "Run /clarify first" navigates to /skills/clarify; current session not destroyed) | ✅ | T3.4 — clarify link points to /skills/clarify; session remains in _sessionStore after navigation | Automated test T3.4 | None |
| AC5 (Acceptance Criterion 5: "Run /clarify first" is visually secondary to "Commit artefact" on complete page) | ✅ | T3.5 — "Commit artefact" appears before "Run /clarify first" in rendered HTML (primary action first) | Automated test T3.5 | None |
| AC6 (Acceptance Criterion 6: All prior tests continue to pass — any test asserting nextUrl for final answer updated to expect /complete URL) | ✅ | T3.6 — regression suite passes; prior nextUrl assertions updated to /complete as required | Automated test T3.6 | None |

---

## Scope Deviations

None

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 total
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T3.1 — AC1: nextUrl = /complete on done | ✅ | ✅ | |
| T3.2 — AC2: complete page renders all 4 elements | ✅ | ✅ | |
| T3.3 — AC3: commit-preview link present; commit flow unchanged | ✅ | ✅ | |
| T3.4 — AC4: clarify link + session preserved | ✅ | ✅ | |
| T3.5 — AC5: commit action is primary (appears first) | ✅ | ✅ | |
| T3.6a — AC6: regression suite passes | ✅ | ✅ | |
| T3.6b — AC6: prior nextUrl assertion updated to /complete | ✅ | ✅ | |

**Gaps (tests not implemented):**
None

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility: "Commit artefact" and "Run /clarify first" rendered as `<a>` or `<button>` elements (keyboard-navigable) | ✅ | T3.2 confirms elements are rendered as proper interactive elements; not plain text links |
| Security: no session data (token, answer content) in complete page HTML — only skill name and question count | ✅ | T3.2 inspects complete page HTML; confirmed no token or answer content rendered |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Skill session completion rate (> 50%) | ❌ | After first real sessions reaching the complete gate | Feature deployed; /complete route now provides a clear end-of-session prompt; measure completion rate after first real operator sessions |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None — measure P1 after first real production sessions. Use `/record-signal` when evidence is available.

---

## DoD Observations

1. T3.6 required updating prior test assertions about `nextUrl` from the final answer — this is an expected and authorised regression as noted in AC6 of the story. The update was made as part of the dsq.3 implementation and confirmed passing.
2. The 7-test count covers 6 ACs; AC6 warranted two sub-tests (regression suite + prior assertion update) consistent with the regression verification pattern across this feature.

## Definition of Ready: Admin sees real Approve/Reject buttons for pending promotion requests

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s13-approve-reject-ui.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s13-approve-reject-ui-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-14

---

## Contract Review

✅ **Contract review passed** — no mismatches against the 6 ACs. This story's Architecture Constraints explicitly name `_renderPromotionAction`, `handleGetProductGuardrailsView`, and `_renderGuardrailsSection` as the real, current functions this story extends — verified directly against merged `master` before writing this story (per this feature's own established discipline, `standards/governance/delivery-patterns.md`'s "Read the Real, Merged Upstream Code Before Writing an Implementation Plan" pattern, added 2026-08-14 from this same feature's own retrospective).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | admin |
| H2 | ≥3 ACs Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 tests (5 unit + 1 integration/regression) |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | M2 — closes the "no UI trigger" gap `/trace` flagged as blocking real measurement |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | This story IS the resolution of `/trace`'s 2026-08-14 HIGH finding |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s9` (`dodStatus: complete`), `wugs-s8` (`dodStatus: complete`) — both already merged |
| H9 | Architecture Constraints populated | ✅ | No new backend surface; extends existing render function; reuses existing CSRF/role-gate patterns |
| H-E2E | Layout-dependent gap check | ✅ | Button click/disable/re-enable/DOM-update behaviour is unit-testable via source-string assertions on the embedded `<script>`, matching this file's own established pattern for prior client-side button wiring (`ssPromote`/`ssOptOut`, before their removal in `wugs-s11`) — not a genuine CSS-layout-dependent gap requiring Playwright/manual classification |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | No new NFR category — Accessibility and Security both explicitly addressed, matching existing profile entries |
| H-GOV | ✅ | Same as prior stories in this feature |
| H-ADAPTER | ✅ | No new adapter — calls existing `wugs-s9` endpoints only |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Pending operator sign-off below |

---

## Oversight level

**High** (per Epic 3, unchanged for this follow-up story) — named sign-off required.

---

## Standards injection

Domain tags: `[web-ui, security-engineering]`
Matched: `standards/saas-gui/POLICY.md`, `standards/security-engineering/core.md`, `standards/security-engineering/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Admin sees real Approve/Reject buttons for pending promotion requests — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s13-approve-reject-ui.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s13-approve-reject-ui-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- No new backend endpoints — calls only the existing, already-merged
  POST /api/admin/promotions/:requestId/approve and .../reject (wugs-s9).
- Extend _renderPromotionAction (products.js) with a third rendering
  branch: pending + isEffectivelyAdmin(req.session) → real Approve/Reject
  buttons. Non-admin sessions must see the existing static text unchanged
  (AC2 is a hard non-regression guarantee).
- Thread a single isAdmin boolean through handleGetProductGuardrailsView →
  _renderGuardrailsSection → _renderPromotionAction, matching the existing
  csrfToken-threading pattern — do not invent a second admin-check
  mechanism.
- Client-side JS must match the removed smug-s1 UI's own ssPromote/
  ssOptOut pattern: disable-on-click, fetch with CSRF, DOM update on
  success, re-enable + alert on failure.
- Re-run wugs-s9's own AC3 tests unchanged as part of this story's own
  regression check (AC6) — do not modify wugs-s9's test file.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md and standards/security-engineering/
  core.md + POLICY.md (web-ui, security-engineering domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Platform owner — 2026-08-14

**PROCEED: Yes**

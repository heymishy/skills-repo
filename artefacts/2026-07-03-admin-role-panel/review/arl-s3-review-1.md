# Review Report: arl-s3 — Admin credits page: view all balances and submit top-up — Run 1

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
**Date:** 2026-07-03
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS (1 MEDIUM — acknowledge in /decisions before /test-plan)

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C — Security controls stated in NFRs but missing dedicated ACs. Two security controls are specified in the NFRs section without corresponding Given/When/Then ACs:
  1. `tenantId` must be validated against a DB allowlist of existing tenants before the UPDATE executes (not just format-validated).
  2. `tenantId` and `balance` values interpolated into the HTML response must be HTML-escaped to prevent stored XSS.
  Without dedicated ACs, these controls cannot be verified by /test-plan or enforced as CI assertions. The test-plan author has no observable behaviour to assert against.
  Fix: Add two ACs before /test-plan:
  - **AC8:** "Given a `POST /api/admin/credits/adjust` request where `tenantId` does not exist as a key in the `credits` table, When the request is processed, Then HTTP 400 is returned and no `credits` row is modified."
  - **AC9:** "Given the `credits` table contains a `tenant_id` value with HTML special characters (e.g. `a<b>c`), When `GET /admin/credits` renders the page, Then the response HTML contains the escaped form (`a&lt;b&gt;c`) and does not contain an unescaped `<b>` tag."
  Risk if proceeding without fix: Security controls (DB allowlist, XSS escaping) will be implemented at developer discretion without a test gate. If either is missed, the build still passes.
  To acknowledge: run /decisions, category RISK-ACCEPT, note that XSS and allowlist controls are implemented but not test-gated.

---

## LOW findings — note for retrospective

- **[1-L1]** Category E — B2 verification triad partially complete. The RISK-ACCEPT for AC7 (keyboard navigation) is logged in `decisions.md` ADR-004 ✓. However, the third required element (a post-deployment smoke test action item for keyboard navigation in `workspace/state.json` pendingActions) is not yet explicitly present. The verification script step is expected at /test-plan. Add a specific pendingAction to `workspace/state.json` before DoR sign-off: "MANUAL SMOKE TEST (post-deploy arl-s3): keyboard-navigate /admin/credits using Tab/Enter/Space — verify all tenant forms are reachable and submittable."

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 4 | PASS |

**A — Traceability (5):** All three reference links present. "So that" connects directly to M2 (credits top-up in under 2 minutes without SQL). Benefit linkage explains the mechanism (form POST + redirect replaces the `fly postgres connect` workflow). M2 is in the coverage matrix.

**B — Scope integrity (5):** Story stays within MVP scope. No audit logging, no pagination, no balance reduction, no tenant creation implemented. Out of Scope section names five explicit exclusions. No scope additions without notes.

**C — AC quality (3):** Six of seven ACs follow Given/When/Then with observable behaviour. AC7 is correctly classified as a browser-only verification with RISK-ACCEPT. The score is 3 rather than 4 because security controls that appear only in NFRs (tenantId allowlist, HTML escaping) are not independently testable from the story as written. This is the MEDIUM finding 1-M1. Score of 3 is borderline — the AC quality for the 7 present ACs is sound; the gap is the missing security ACs.

**D — Completeness (5):** All template fields populated. Named persona. Benefit linkage present. Out of scope populated. NFRs detailed. Complexity rated (2). Scope stability (Stable). DoR pre-check has the B2 classification reminder as a specific checklist item.

**E — Architecture compliance (4):** Architecture Constraints field populated with all applicable constraints (No Express, No npm, CommonJS, B2 RISK-ACCEPT, ougl input validation, requireAdmin gating). ADR-011 satisfied by this artefact chain. ADR-018 addressed via RISK-ACCEPT path (decisions.md ADR-004). No active ADR violated. Score 4 rather than 5 because the B2 triad (decisions.md ✓, verification script ✗ pending, state.json pendingAction ✗ missing) is not yet complete — the missing pendingAction is LOW finding 1-L1.

---

**Verdict:** PASS — all criteria scored 3 or above. 0 HIGH, 1 MEDIUM (security ACs missing — acknowledge in /decisions or add ACs before /test-plan), 1 LOW (B2 pendingAction missing from state.json).

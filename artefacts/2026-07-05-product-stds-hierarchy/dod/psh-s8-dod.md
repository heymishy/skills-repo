# Definition of Done: psh-s8 — Standards definition and management per product

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s8.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s8-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s8-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (standards row inserted with correct fields, HTTP 201, standard_id returned) | ✅ | T1: POST creates row with product_id, org_id from session, visibility='product', name, content; HTTP 201 + standard_id | `tests/check-psh-s8-standards-management.js` T1 — automated test, CI pass | None |
| AC2 (standard_created PostHog event with standardId, productId, tenantId, visibility) | ✅ | T2: standard_created event emitted with all required properties on creation | `tests/check-psh-s8-standards-management.js` T2 — automated test, CI pass | None |
| AC3 (list view — standards by product_id, ordered newest first, with visibility indicator) | ✅ | T3: GET standards list returns all standards for product, newest first; Product/Org badge present | `tests/check-psh-s8-standards-management.js` T3 — automated test, CI pass | None |
| AC4 (edit — name/content update, updated_at refreshed, HTTP 200) | ✅ | T4: PUT updates name and content; updated_at reflects current time; HTTP 200 | `tests/check-psh-s8-standards-management.js` T4 — automated test, CI pass | None |
| AC5 (input sanitisation — HTML in name stored as escaped text) | ✅ | T5: XSS in name stored and rendered as escaped plain text; no DOM injection | `tests/check-psh-s8-standards-management.js` T5 — automated test, CI pass | None |
| AC6 (path traversal guard — HTTP 400, no disk write) | ✅ | T6: path traversal in standard name returns HTTP 400; no file written | `tests/check-psh-s8-standards-management.js` T6 — automated test, CI pass | None |

**6 / 6 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: Standards creation — row insert + HTTP 201 | ✅ | ✅ | |
| T2: PostHog standard_created event | ✅ | ✅ | |
| T3: Standards list view (ordered, with visibility badge) | ✅ | ✅ | |
| T4: Edit standard — update + HTTP 200 | ✅ | ✅ | |
| T5: Input sanitisation (XSS in name) | ✅ | ✅ | |
| T6: Path traversal guard | ✅ | ✅ | |
| T7: org_id from session only (not request body) | ✅ | ✅ | Security NFR |
| T8: Standards content rendered safely (code snippets) | ✅ | ✅ | MC-SEC-01 |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: standard content HTML-escaped before rendering | ✅ | T8 asserts code-snippet content in standard body rendered safely |
| Security: org_id from req.session.tenantId only | ✅ | T7 asserts session tenantId used; request body org_id ignored |
| Performance: standards list < 1s for ≤ 50 standards | ✅ | Indexed product_id; single query |
| Path traversal guard | ✅ | T6 asserts HTTP 400 on traversal |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M4a: Standards library adoption rate | ✅ | Immediately post-deploy (60-day observation window starts) | standard_created PostHog event (AC2) is the M4a signal; target TBD after 60 days of data |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Review M4a PostHog data at 60 days post-launch and set forward target. Owner: Hamish King.

---

## DoD Observations

None.

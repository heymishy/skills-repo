# Test Plan: psh-s3 — Product creation flow (hybrid form + AI draft + review)

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s3.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s3-review-1.md (PASS, 2 MEDIUM)
**Test file:** `tests/check-psh-s3-product-creation.js`
**Date:** 2026-07-05

**MEDIUM findings carried in:**
- 1-M2: AC1 form field enumeration deferred — test covers name (required), tech-stack and constraints (optional) based on discovery clarification.
- 1-M3: "ADR-020" reference is a broken pointer; constraint is correct (req.session.accessToken).

---

## Test Data Strategy

**Strategy:** Synthetic. Tests use a mocked `pg` pool and a mocked `generateProductDraft` adapter. No real AI calls. No real DB writes. PostHog client mocked to capture emitted events. Tests inject the mock adapter via `setGenerateProductDraft(mockFn)`.

**Sensitivity:** None. No PCI scope, no real credentials.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — form submission triggers AI draft for 5 files | Unit | `POST /products/new calls generateProductDraft with form fields` |
| AC2 — AI response displayed in editable review panel | Integration | `successful draft response returns 5 editable sections in response` |
| AC3 — confirmed product inserted, PostHog fired | Integration | `POST /products/confirm inserts product row and emits product_created event` |
| AC4 — solo plan: second product returns HTTP 403 | Integration | `second product attempt for single-product tenant returns 403 with plan_limit reason` |
| AC5 — team plan: no limit | Integration | `team-plan tenant can create third product (HTTP 201)` |
| AC6 — XSS: name is stored and rendered as plain text | Unit | `script-injected product name is stored as escaped text, not executed HTML` |
| AC7 — path traversal: HTTP 400, no file written | Unit | `context file path traversal attempt returns 400 and writes no file` |
| AC8 — D37: production wiring present in server.js | Unit | `setGenerateProductDraft is called with real implementation before server accepts connections` |
| AC8 — D37: stub throws when not wired | Unit | `calling generateProductDraft without setGenerateProductDraft throws adapter-not-wired error` |

**Total tests: 9** (5 unit, 4 integration)

---

## Gap Table

| AC | Gap | Type | Resolution |
|----|-----|------|------------|
| AC1 form field spec | Form field enumeration is incomplete in story (finding 1-M2) | spec-gap | Tests assume name required, tech-stack and constraints optional per discovery log. Operator to confirm at DoR. |

---

## Unit Tests

### T1: `POST /products/new calls generateProductDraft with form fields`
**AC:** AC1
**Precondition:** `generateProductDraft` replaced with a spy. Authenticated session with `tenantId`.
**Action:** POST to `/products/new` with `{ name: 'Test Product', techStack: 'Node.js', constraints: 'No AWS' }`.
**Expected result:** Spy called once with an object containing `name`, `techStack`, `constraints`. No actual AI call made.

### T2: `script-injected product name is stored as escaped text, not executed HTML`
**AC:** AC6
**Precondition:** Mocked pool captures INSERT values. Mocked draft adapter returns 5 empty sections.
**Action:** POST to `/products/confirm` with `name = '<script>alert(1)</script>'`.
**Expected result:** The value stored in the captured INSERT is `<script>alert(1)</script>` (plain text string, not rendered). Response does not contain `<script>` tag in any rendered HTML output. No script execution occurs.

### T3: `context file path traversal attempt returns 400 and writes no file`
**AC:** AC7
**Precondition:** Server configured with a known `repoRoot`. File-write spy is installed.
**Action:** POST with product name `'../../../etc/evil'`. Trigger the context file write path.
**Expected result:** Response is HTTP 400. File-write spy is never called (no file written to disk). Error response does not echo the raw path value.

### T4: `calling generateProductDraft without setGenerateProductDraft throws adapter-not-wired error`
**AC:** AC8 stub-throws
**Precondition:** Module is freshly loaded with no `setGenerateProductDraft` call.
**Action:** Call `generateProductDraft({ name: 'Test' })` directly.
**Expected result:** Throws `Error` with message `'Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.'`

### T5: `setGenerateProductDraft is called with real implementation before server accepts connections`
**AC:** AC8 production wiring
**Precondition:** `server.js` initialisation sequence with real Anthropic client mock.
**Action:** Import/start the server module. Before any route handles requests, check that the adapter is wired.
**Expected result:** The wired adapter does not throw the adapter-not-wired error. Calling `generateProductDraft` with a test payload invokes the real (mocked) Anthropic implementation.

---

## Integration Tests

### T6: `successful draft response returns 5 editable sections in response`
**AC:** AC2
**Precondition:** `generateProductDraft` mocked to return `{ mission: 'x', roadmap: 'y', techStack: 'z', constraints: 'w', architectureGuardrails: 'v' }`.
**Action:** POST to `/products/new` with valid form data.
**Expected result:** Response body includes 5 labelled sections: mission, roadmap, tech-stack, constraints, architecture-guardrails. Each section has non-empty content.

### T7: `POST /products/confirm inserts product row and emits product_created event`
**AC:** AC3
**Precondition:** Mocked pool captures INSERT. Mocked PostHog client captures events.
**Action:** POST to `/products/confirm` with confirmed draft content.
**Expected result:** INSERT captured into `products` table with `tenant_id = req.session.tenantId`, `name`, context file content. HTTP 201 response with `product_id`. PostHog `product_created` event captured with `productId`, `tenantId`, `hasContextFiles: true`.

### T8: `second product attempt for single-product tenant returns 403 with plan_limit reason`
**AC:** AC4
**Precondition:** Mocked pool returns 1 existing product for `tenantId = 'solo-tenant'`. Plan flag = personal.
**Action:** POST to `/products/confirm` for `solo-tenant`.
**Expected result:** HTTP 403. Response body: `{ reason: 'plan_limit', upgradeRequired: true }`. No INSERT captured. PostHog `product_created` NOT emitted.

### T9: `team-plan tenant can create third product (HTTP 201)`
**AC:** AC5
**Precondition:** Mocked pool returns 2 existing products for `tenantId = 'team-tenant'`. Plan flag = team.
**Action:** POST to `/products/confirm` for `team-tenant`.
**Expected result:** HTTP 201. Product INSERT captured. No 403 returned.

---

## NFR Tests

### T-NFR1: `generateProductDraft timeout: server returns graceful error if AI call exceeds 30 seconds`
**NFR:** Performance
**Precondition:** `generateProductDraft` mocked to delay 31 seconds (or throw timeout error).
**Action:** POST to `/products/new`.
**Expected result:** Server returns HTTP 500 or 504 with a user-friendly error message. The form input is not lost (response includes original form fields or redirect to retry). No unhandled promise rejection.

### T-NFR2: `req.session.accessToken used — req.session.token never accessed`
**NFR:** Security
**Action:** Grep the product creation route handler source for `req\.session\.token[^A]`.
**Expected result:** Zero matches. Only `req.session.accessToken` is present.

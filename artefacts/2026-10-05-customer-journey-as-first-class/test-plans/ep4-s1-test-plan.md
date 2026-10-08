## Test Plan: Journey list page: index of all journeys for the tenant

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
**Epic reference:** navigation-entry-points-and-journey-list
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-09):**

- **Route:** `GET /customer-journeys`, not the originally-drafted `/journeys` — see `decisions.md` D8. `GET /journeys` is already a live, unrelated platform route (`handleJourneys`, the skill-session first-run empty-state screen).
- **New handler `handleGetCustomerJourneysList`** in `journeys.js`. Two queries: (1) `SELECT cj.id, cj.name, cj.description, cj.created_at, p.name AS product_name FROM customer_journeys cj LEFT JOIN products p ON cj.product_id = p.product_id WHERE cj.tenant_id = $1 ORDER BY cj.created_at DESC`; (2) `SELECT journey_id, COUNT(*) AS stage_count FROM customer_journey_stages WHERE journey_id = ANY($1) GROUP BY journey_id`, merged into the journey rows by id. No new table/column needed — `customer_journeys` already has `created_at` (confirmed in `server.js`'s boot-wiring block) and the `products(product_id)` join target matches `decisions.md` D2's own FK convention exactly.
- **Product picker (AC3):** reuses the exact `SELECT product_id, name FROM products WHERE tenant_id = $1` query already established in `products.js` (confirmed by grep — used 3 times already for org-kanban/product-list contexts), embedded as JSON in the page for the "New journey" modal's `<select>`, mirroring `ep1-s3`'s own `stageDataJson` embedding convention.
- **No new POST handler for AC4.** `handlePostJourneys` (built in `ep1-s1`) already accepts `name`/`description`/`productId` and already redirects 302 to `/journeys/:id` on success — reused as-is. **Client-side redirect handling (the one real design decision this story makes):** a plain `fetch()` call to `POST /journeys` auto-follows the server's 302 by default, so the response body on success is the CANVAS page's HTML, not JSON — calling `.json()` on it would throw and look like a failure even though the journey was created. The modal's submit handler instead checks `response.redirected`/`response.url` first: if `true`, navigate the browser there directly (`window.location.href = response.url`) without ever calling `.json()`; only the error path (400, `r.ok === false`, a real JSON body) calls `.json()`. This requires zero backend changes.
- **AC5 corrected (grounding-time fix, same spirit as the route-rename above):** as originally drafted, AC5 says a cross-tenant journey *ID* in the request returns *403*. Neither half survives contact with the real codebase: (a) this story's own endpoints (`GET /customer-journeys`, and the reused `POST /journeys`) take no journey id in the request at all, so "another tenant's journey ID is used in the request" doesn't describe any real request this story's own surface can receive; (b) every cross-tenant check already built in this feature (`ep1-s2`, `ep1-s3`, `ep1-s4`) returns **404**, not 403, matching the established `FORBIDDEN`-vs-`NOT_FOUND` policy from `handlePostProductModule`. Reinterpreted as the one AC5 phrasing that actually fits this story's own request shape and stays consistent with the rest of the codebase: **the list query itself must never return another tenant's journeys**, tested directly by seeding two tenants' worth of data and asserting the response is scoped correctly (no status-code check needed, since nothing is being rejected — the other tenant's rows are simply absent from a 200 response, which is the correct shape for a scoping bug, not an authorization-denial bug).
- **Modal pattern:** reuses `products.js`'s own `ep4s1-pods-modal` precedent (`role="dialog" aria-modal="true"`, initial-focus-on-open, Escape-to-close, focus-restore via captured `_triggerBtn`) — that precedent was never E2E-tested either (no CSS-layout-dependent behaviour beyond what a rendered-markup assertion can confirm), so this story follows the same level of coverage, not a weaker one.

---

**E2E/browser-layout detection (Step 3a):** No AC in this story matches any trigger pattern (no drag-and-drop, no pointer-coordinate assertions, no `getBoundingClientRect`/CSS-stacking dependency). This is a server-rendered list + a modal form, fully verifiable via rendered-HTML-string assertions against the real handler functions, matching every non-drag story in this feature. No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | List renders all tenant-scoped journeys with name, truncated description, product name/"No product", stage count | 2 tests | — | — | — | — | 🟢 |
| AC2 | Empty state message + "New journey" CTA when zero journeys | 1 test | — | — | — | — | 🟢 |
| AC3 | "New journey" modal renders name (required)/description/product-picker fields | 1 test | — | — | — | — | 🟢 |
| AC4 (shape) | Modal's submit handler correctly treats a redirected response as success without calling `.json()` on it | 1 test | — | — | — | — | 🟢 |
| AC5 (reinterpreted) | Another tenant's journeys never appear in the list response | 1 test | — | — | — | — | 🟢 |
| (data) | Stage count is correct for 0 and N stages | 1 test | — | — | — | — | 🟢 |
| (data) | Product name resolves correctly; null `product_id` shows "No product" | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs (including the two corrected at grounding time — the route, and AC5's own reinterpretation, both logged in `decisions.md` D8) are fully unit-testable server-side against the real handler with a mock pool.

---

## Test Data Strategy

**Source:** Synthetic — extends `check-ep1-s3-stage-panel.js`/`check-ep1-s4-stage-reorder.js`'s own mock-pool conventions.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock pool: 2 journeys for tenant `org-1`, one with a `product_id` matching a seeded product row and 2 stages, one with `product_id: null` and 0 stages | Synthetic | None | Assert both journeys' names, descriptions, resolved product name/"No product", and stage counts appear correctly |
| AC1 (truncation) | A journey with a >140-char description | Synthetic | None | Assert the rendered description is truncated with an ellipsis, not the full text |
| AC2 | Mock pool returning zero journeys for the tenant | Synthetic | None | Assert the exact empty-state text and a "New journey" CTA element |
| AC3 | Mock pool returning 2 products for the tenant | Synthetic | None | Assert the modal's `<select>` contains both product names as options, plus name/description fields |
| AC4 (shape) | Rendered client script | Synthetic | None | Extract the submit handler's function body; assert it checks `response.redirected` before calling `.json()` |
| AC5 | Mock pool: journeys for both `org-1` and `org-2` | Synthetic | None | Call the handler with `tenantId: 'org-1'`; assert the SQL `WHERE tenant_id = $1` param is `'org-1'` and zero `org-2` journey names appear anywhere in the rendered output |
| (data) stage count | Journeys with 0 and 3 stages respectively | Synthetic | None | Assert exact counts rendered |
| (data) product resolution | One journey with a real `product_id`, one with `null` | Synthetic | None | Assert resolved name vs. "No product" |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### List renders all tenant-scoped journeys with correct fields

- **Verifies:** AC1
- **Action:** Call `handleGetCustomerJourneysList` with a mock pool returning 2 journeys (one with a product and 2 stages, one with no product and 0 stages) for `tenantId: 'org-1'`
- **Expected result:** Rendered `bodyContent` contains both journey names, both descriptions, the resolved product name for the first and "No product" for the second, and "2" / "0" stage counts respectively
- **Edge case:** No

### A long description is truncated

- **Verifies:** AC1 (truncation)
- **Action:** Call the handler with a mock journey whose `description` is 200 characters long
- **Expected result:** Rendered description is truncated (shorter than 200 chars, ends with an ellipsis marker), not the full text
- **Edge case:** Yes

### Empty state renders the exact message and CTA

- **Verifies:** AC2
- **Action:** Call the handler with a mock pool returning zero journeys
- **Expected result:** Rendered `bodyContent` contains the exact text "No journeys yet. Create your first journey." and a "New journey" button/link element
- **Edge case:** Yes

### "New journey" modal renders name, description, and product-picker fields

- **Verifies:** AC3
- **Action:** Call the handler with a mock pool returning 2 products for the tenant
- **Expected result:** Rendered `bodyContent` contains a required name input, an optional description field, and a `<select>` populated with both product names as options
- **Edge case:** No

### Submit handler treats a redirected response as success without parsing it as JSON

- **Verifies:** AC4 (shape)
- **Action:** Extract the modal's submit handler function body from the rendered client script
- **Expected result:** The function body checks `response.redirected` (or equivalent) and navigates via `window.location.href`/`.url` BEFORE any `.json()` call on the success path; `.json()` is only called in the non-redirected (error) branch
- **Edge case:** Yes

### Another tenant's journeys never appear in the list

- **Verifies:** AC5 (reinterpreted — see grounding notes)
- **Action:** Call the handler with a mock pool seeded with journeys for both `org-1` and `org-2`, requesting as `tenantId: 'org-1'`
- **Expected result:** The underlying SQL call's `tenant_id` parameter is `'org-1'`; zero `org-2` journey names appear anywhere in the rendered output
- **Edge case:** Yes

### Stage count is correct at both boundaries

- **Verifies:** (data) stage count
- **Action:** Call the handler with one journey having 0 stages and another having 3
- **Expected result:** Rendered counts are exactly "0" and "3" respectively, not omitted or miscounted
- **Edge case:** Yes

### Product name resolution and the null-product fallback

- **Verifies:** (data) product resolution
- **Action:** Call the handler with one journey whose `product_id` matches a real product row, and one with `product_id: null`
- **Expected result:** First renders the resolved product name; second renders exactly "No product"
- **Edge case:** Yes

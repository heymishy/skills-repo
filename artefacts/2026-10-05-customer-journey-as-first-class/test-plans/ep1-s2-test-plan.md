## Test Plan: Add and name stages: POST route, inline name entry, and stage card rendering

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s2.md
**Epic reference:** journey-entity-and-stage-management
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- New handler `handlePostJourneyStage` added to `src/web-ui/routes/journeys.js` (same file as `ep1-s1`'s handlers). Dispatch entry `pathname.match(/^\/journeys\/[^/]+\/stages$/) && req.method === 'POST'` added to `server.js` immediately after the existing `GET /journeys/:id` entry (~line 3945), wrapped in `authGuard` + `requireNonViewer`, matching every other mutating route's own convention.
- **CSRF (jcg-s1 precedent, mandatory from first implementation — not retrofitted later):** `handlePostJourneyStage` calls `_csrf.csrfGuard(req, res)` as its first statement, exactly like `handlePostJourneys` post-`jcg-s1`. `jcg-s1`'s own story explicitly flagged this as the pattern the next mutating route in this file must follow.
- **Tenant scoping + ownership (FORBIDDEN-vs-NOT_FOUND policy):** the journey row must be looked up by `id AND tenant_id = req.session.tenantId` before any insert — a journey ID belonging to a different tenant returns 404 (matching `handleGetProductModules`/`handlePostProductModule`'s own established policy of 404, not 403, for cross-tenant access attempts), not merely "insert succeeds with the wrong tenant_id." `customer_journey_stages.tenant_id` is still set independently from `req.session.tenantId` on the insert itself (never trusted from the journey row or request body), per ADR-025.
- **Position ordinal:** `position` is computed server-side as `COALESCE(MAX(position), -1) + 1` for the target `journey_id` in a single query (or two sequential queries against the mock pool — see Test Data Strategy), never client-supplied. Appends at the end regardless of how many stages already exist, including zero.
- **Client-side interaction (AC1, pure DOM behaviour, no server round-trip until save):** clicking "+ Add stage" inserts an unsaved stage-card DOM node with a focused `<input>` — this is the one AC in this story not server-unit-testable. Classified below (CSS-layout-dependent-AC-equivalent gate) as **RISK-ACCEPT, not E2E** — see rationale in that section.
- **Fetch-then-reload client convention (confirmed, `products.js`'s `_renderModulesManagement`):** `submitJson(url, method, payload)` → `fetch(...).then(r => r.ok ? r.json() : r.json().then(j => { throw new Error(j.error) }))`, success handler calls `window.location.reload()`, failure handler shows an inline error — mirrored here, with the AC3-specific twist that the error is shown on the stage-card's own input (not a page-level banner), since the story's own AC3 says "the inline field shows an error state."
- **CSRF token embedding:** `handleGetJourneyCanvas` must call `await _csrf.generateCsrfToken(req)` and embed it as `var csrfToken=...;` in the canvas page's own inline `<script>`, matching `_renderModulesManagement`'s exact pattern — needed for the client JS's `fetch` call to `POST /journeys/:id/stages`.

**E2E/browser-layout detection (Step 3a):** AC1 is a client-side DOM/focus behaviour, not a CSS-layout rendering concern (no visual alignment, breakpoint, or pixel-level assertion) — the CSS-layout-dependent-AC gate (DoR's H-E2E check) does not strictly apply. However, since it is still a real browser-only behaviour untestable by a Node unit test, this test plan classifies it explicitly rather than silently dropping it: **RISK-ACCEPT**, logged in `decisions.md`, with the manual verification step named below — not deferred as an unflagged gap. Complexity 1/Stable and the very small blast radius (a client-only DOM insertion with no state mutation until save, which AC2/AC3 do cover server-side) make a dedicated Playwright spec disproportionate for this story; `ep1-s4`'s own drag-and-drop story is the first one in this epic where a real E2E spec is justified for this canvas.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "+ Add stage" inserts a new, focused inline-name stage card | — | — | — | 1 manual step | RISK-ACCEPT (client-only DOM/focus behaviour) | 🟡 |
| AC2 | Valid submission inserts customer_journey_stages record, appended at end, renders with saved name | 1 test | — | — | — | — | 🟢 |
| AC3 | Blank submission → 400, no insert, inline error state | 1 test | — | — | — | — | 🟢 |
| AC4 | Saved stage renders with name + "Edit stage" affordance on re-render | 1 test | — | — | — | — | 🟢 |
| (security) | CSRF guard present on the new route from first implementation | 1 test | — | — | — | — | 🟢 |
| (security) | Cross-tenant journey ID returns 404, no insert | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC1 only (see RISK-ACCEPT above, to be logged in `decisions.md` at DoR). All other ACs plus the two security-hardening assertions this story's architecture constraints require are unit-testable against the real handler functions with mock `pool`/`req`/`res` objects.

---

## Test Data Strategy

**Source:** Synthetic — extends `check-ep1-s1-journey-create.js`'s own `makeMockPool`/`makeMockRes`/`REAL_CSRF` conventions (now including `jcg-s1`'s CSRF fixtures) into a new file.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC2 | Mock pool: journey-lookup SELECT returns a row for `(journeyId, tenantId)`; stage-position lookup returns an existing max `position`; INSERT returns a generated stage id | Synthetic | None | Assert INSERT params include `journey_id`, `tenant_id`, `name`, and `position = maxPosition + 1`; assert 201 response |
| AC3 | Mock pool: journey-lookup succeeds; `req.body.name` blank | Synthetic | None | Assert 400, zero INSERT ops on `customer_journey_stages` |
| AC4 | Mock pool: journey-lookup succeeds; one existing stage row returned on the canvas-render SELECT | Synthetic | None | Assert rendered `bodyContent` includes the stage's name and the literal text `"Edit stage"` |
| (security) CSRF | `req.session.csrfToken` set, `req.body._csrf` absent/mismatched | Synthetic | None | Assert 403, zero INSERT ops — same shape as `jcg-s1`'s own AC1 tests |
| (security) cross-tenant | Mock pool: journey-lookup SELECT returns zero rows for the given `(journeyId, tenantId)` pair (journey belongs to a different tenant) | Synthetic | None | Assert 404, zero INSERT ops into `customer_journey_stages` |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC1 (RISK-ACCEPT, above).

---

## Unit Tests

### Valid stage submission inserts record appended at end, renders with saved name

- **Verifies:** AC2
- **Action:** Call `handlePostJourneyStage` with a valid session/CSRF pair, a journey owned by the session's tenant, an existing stage at `position=0`, and `req.body.name = 'Discover'`
- **Expected result:** Exactly one `INSERT INTO customer_journey_stages` op with `journey_id`, the session's `tenant_id`, `name='Discover'`, and `position=1`; 201 response
- **Edge case:** No

### First stage in an empty journey gets position 0

- **Verifies:** AC2 (edge case)
- **Action:** Same as above but the journey has zero existing stages
- **Expected result:** INSERT's `position` param is `0`, not `null`/`NaN`/negative
- **Edge case:** Yes

### Blank name returns 400, no insert, and the field is markable as errored

- **Verifies:** AC3
- **Action:** Call `handlePostJourneyStage` with a valid session/CSRF pair, a valid journey, `req.body.name = ''`
- **Expected result:** 400 response; zero `INSERT INTO customer_journey_stages` ops
- **Edge case:** No

### Saved stage renders with name and "Edit stage" affordance

- **Verifies:** AC4
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning one `customer_journey_stages` row for the journey
- **Expected result:** Rendered `bodyContent` includes the stage's `name` and the literal string `"Edit stage"`
- **Edge case:** No

### Missing or mismatched CSRF token is rejected

- **Verifies:** (security) CSRF
- **Action:** Call `handlePostJourneyStage` with no `_csrf` field (and, as a second case, a mismatched one)
- **Expected result:** 403 response; zero INSERT ops
- **Edge case:** Yes — two sub-cases, mirroring `jcg-s1`'s own test shape

### Cross-tenant journey ID is rejected as not found

- **Verifies:** (security) cross-tenant
- **Action:** Call `handlePostJourneyStage` with a valid session/CSRF pair but a `journeyId` that belongs to a different tenant (mock pool's journey-lookup SELECT returns zero rows for this session's `tenantId`)
- **Expected result:** 404 response; zero INSERT ops
- **Edge case:** Yes

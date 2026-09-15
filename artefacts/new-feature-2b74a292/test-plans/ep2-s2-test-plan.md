# Test Plan: Filter Stage Visibility by Role (ep2-s2)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep2-s2.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story
As a **Team collaborator (any role)**, I want **to see only the pipeline stages relevant to my role by default**, So that **I'm not overwhelmed by stages that aren't mine to act on**.

---

## Acceptance Criteria

**AC1:** Given Susan (engineer) loads Feature A1, When the stage list renders, Then Susan sees by default only "test-plan", "review", "definition-of-ready", "coding" (her role's stageVisibility).

**AC2:** Given Hamish (product) loads the same Feature A1, When the stage list renders, Then Hamish sees by default only "discovery", "benefit-metric", "definition" (his role's stageVisibility) — a different default view from Susan's, from the same underlying data.

**AC3:** Given either collaborator's filtered default view, When they click "Show all stages", Then every stage in the pipeline becomes visible, and no previously-visible stage is hidden as a result of toggling.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`
- Fixture roles: `engineer` (stageVisibility: ["test-plan", "review", "definition-of-ready", "coding"]), `product` (stageVisibility: ["discovery", "benefit-metric", "definition"])
- Fixture collaborators: Susan (engineer), Hamish (product), both assigned to Feature A1
- Session contexts: Separate mocked sessions for each collaborator with `req.session.userId`, `req.session.tenantId`, and `req.session.roleId`
- Feature stage list: All 7 stages (discovery, benefit-metric, definition, test-plan, review, definition-of-ready, coding) always present in the underlying data
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + E2E | Engineer default view (4 stages filtered) | No |
| AC2 | Unit + E2E | Product default view (3 stages filtered, different from engineer) | No |
| AC3 | Unit + E2E | "Show all stages" toggle reveals all 7 stages | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Engineer Default View Filtered Correctly

**Test name:** `stage-visibility.filter.engineer-default-view`

**What it tests:** AC1 — engineer role sees only engineer-relevant stages on page load

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123', userId: 'user-susan', roleId: 'engineer' }`
- Fixture feature: Feature A1 with all 7 stages in the underlying data
- Engineer role stageVisibility: ["test-plan", "review", "definition-of-ready", "coding"]
- Susan assigned to Feature A1 with engineer role

**Action:**
- Call GET `/api/features/{featureId}/stages` with Susan's session context
- Parse response for `stages` array
- Render stage list component with the response data

**Expected result:**
- HTTP 200 response
- Response includes `{ stages: [{ name: "test-plan", visible: true }, { name: "review", visible: true }, { name: "definition-of-ready", visible: true }, { name: "coding", visible: true }] }`
- Stage list renders exactly 4 items (no discovery, benefit-metric, or definition)
- Each displayed stage name is correct and in expected order

---

### AC2: Product Default View Differs from Engineer View

**Test name:** `stage-visibility.filter.product-default-view-differs`

**What it tests:** AC2 — product role sees different stages than engineer, same feature, same underlying data

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123', userId: 'user-hamish', roleId: 'product' }`
- Fixture feature: Feature A1 (same as AC1 setup)
- Product role stageVisibility: ["discovery", "benefit-metric", "definition"]
- Hamish assigned to Feature A1 with product role

**Action:**
1. Call GET `/api/features/{featureId}/stages` with Hamish's session context
2. Parse response for `stages` array
3. Compare against the Susan (AC1) response to verify they differ

**Expected result:**
- HTTP 200 response
- Response includes `{ stages: [{ name: "discovery", visible: true }, { name: "benefit-metric", visible: true }, { name: "definition", visible: true }] }`
- Stage list renders exactly 3 items (no test-plan, review, definition-of-ready, or coding)
- The product-filtered list is demonstrably different from the engineer-filtered list for the same feature

---

### AC3: Show All Stages Toggle Reveals Complete List

**Test name:** `stage-visibility.toggle.show-all-reveals-all-seven`

**What it tests:** AC3 — toggling "Show all stages" displays all 7 stages regardless of role filter

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123', userId: 'user-susan', roleId: 'engineer' }`
- Fixture feature: Feature A1 with all 7 stages
- Engineer role stageVisibility: ["test-plan", "review", "definition-of-ready", "coding"] (4 stages by default)

**Action:**
1. Load feature page with stage list filtered to engineer view (4 stages visible)
2. Simulate "Show all stages" toggle click (set `showAllStages = true` in component state)
3. Query the stage list element for all items

**Expected result:**
- After toggle: all 7 stages appear (discovery, benefit-metric, definition, test-plan, review, definition-of-ready, coding)
- No previously-visible stage is hidden as a side effect (engineer's 4 stages remain, not replaced)
- Count of visible stages increases from 4 to 7

---

## Integration Tests

### Multi-Role Feature Load — Full Path

**Test name:** `stage-visibility.integration.multi-role-feature-load-full-path`

**What it tests:** Complete feature load flow for two different roles; verifies AC1 and AC2 work together on the same feature

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Feature A1 with 7 stages, role_definitions table populated
- Two sessions: Susan (engineer), Hamish (product), both assigned to Feature A1

**Action:**
1. Call GET `/api/features/{featureId}/stages` with Susan's context
2. Parse engineer-filtered stage list
3. Call the same endpoint with Hamish's context
4. Parse product-filtered stage list
5. Compare the two responses

**Expected result:**
- Susan's response contains 4 stages (engineer view)
- Hamish's response contains 3 stages (product view)
- No stage appears in both lists that shouldn't (e.g. definition should appear only for product, not engineer)
- Both responses are valid and consistent with their respective role definitions

---

### Role-Filtered Visibility Isolation by Tenant

**Test name:** `stage-visibility.integration.role-filtering-isolation-by-tenant`

**What it tests:** ADR-025 — role-filtered stage visibility is tenant-scoped; one tenant's role definitions do not affect another tenant's view

**Setup:**
- Tenant A: Feature A1, Susan (engineer), role definition: engineer sees ["test-plan", "review", "definition-of-ready", "coding"]
- Tenant B: Feature A1 (same name, different tenant), Susan (different user, same name in different tenant), role definition for engineer: ["discovery"] (intentionally different)
- Session context: `{ tenantId: 'tenant-a', userId: 'user-susan-a' }`

**Action:**
- Load Feature A1 under Tenant A with Susan's engineer role
- Query role_definitions for tenant A's engineer role stageVisibility
- Verify the stages returned match Tenant A's definition, not Tenant B's

**Expected result:**
- Tenant A's engineer sees 4 stages (the full set per Tenant A's engineer definition)
- Tenant B's data is completely inaccessible
- No cross-tenant role definition bleed

---

## E2E Tests (Browser)

### AC1: Engineer Default View Renders on Page Load

**Test name:** `stage-visibility.e2e.engineer-default-renders-on-page-load`

**Setup:**
- Auth bypass fixture (NODE_ENV=test guard) with synthetic session for Susan (engineer)
- Feature A1 fully set up with all 7 stages in database
- role_definitions table seeded with engineer stageVisibility

**Action:**
- Open `http://localhost:3000/features/{featureId}` in browser
- Wait for page to render
- Locate and count stage list items

**Expected result:**
- Page renders completely
- Stage list visible without scrolling or menu click
- Exactly 4 stages displayed: "test-plan", "review", "definition-of-ready", "coding"
- discovery, benefit-metric, and definition are NOT present in the initial view

---

### AC2: Product Default View Is Different on Same Feature

**Test name:** `stage-visibility.e2e.product-default-differs-same-feature`

**Setup:**
- Auth bypass fixture with synthetic session for Hamish (product)
- Feature A1 (same feature as AC1 E2E)
- role_definitions table seeded with product stageVisibility

**Action:**
1. Open `http://localhost:3000/features/{featureId}` in a separate browser (or clear session and login as Hamish)
2. Wait for page to render
3. Count and list visible stages

**Expected result:**
- Page renders completely
- Stage list shows exactly 3 stages: "discovery", "benefit-metric", "definition"
- test-plan, review, definition-of-ready, and coding are NOT present
- Comparison with AC1 confirms the views are demonstrably different for the same feature

---

### AC3: Show All Stages Toggle Works Without Refresh

**Test name:** `stage-visibility.e2e.show-all-toggle-no-refresh`

**Setup:**
- Same as AC1 E2E (Susan, engineer, 4 stages default)

**Action:**
1. Load feature page (4 stages visible for engineer)
2. Locate "Show all stages" toggle
3. Click the toggle
4. Observe stage list without manual page refresh

**Expected result:**
- After toggle click: all 7 stages appear in the list
- Page did NOT refresh (any unsaved work or scroll position is preserved)
- Engineer's original 4 stages are still there, not hidden (union, not replacement)
- Count increases from 4 to 7

---

## NFR Tests

### NFR-Perf-1: Stage List Load Latency

**Test name:** `stage-visibility.nfr.stage-list-load-latency`

**Setup:** Same as AC1 unit test

**Action:** Call GET `/api/features/{featureId}/stages`, measure response time

**Expected result:** Response time ≤ 500ms (filtered list computes and returns quickly)

---

### NFR-Perf-2: Toggle Response Latency

**Test name:** `stage-visibility.nfr.toggle-response-latency`

**Setup:** Feature page with engineer filtered view (4 stages)

**Action:** Click "Show all stages" toggle, measure time from click to all 7 stages appearing in DOM

**Expected result:** All 7 stages visible within 200ms of toggle click (client-side state change, no server call needed)

---

### NFR-A11y-1: Stage List Keyboard Navigation

**Test name:** `stage-visibility.nfr.stage-list-keyboard-navigation`

**Setup:** Feature page with stage list rendered

**Action:** Use Tab key to navigate to each stage item in the list

**Expected result:** Every stage item is reachable via keyboard; no items skipped; focus indicator visible on each item

---

### NFR-A11y-2: Toggle Button Accessible

**Test name:** `stage-visibility.nfr.toggle-button-accessible`

**Setup:** Feature page with "Show all stages" toggle visible

**Action:** Navigate to toggle via Tab key; press Enter to activate

**Expected result:** Toggle activates via keyboard (not click-only); all 7 stages appear without requiring mouse

---

## Test Summary

- **Unit tests:** 3 (AC1 engineer view, AC2 product view differs, AC3 show-all toggle)
- **Integration tests:** 2 (multi-role full-path load, tenant-scoped role isolation)
- **E2E tests:** 3 (engineer default on page load, product default differs, toggle without refresh)
- **NFR tests:** 4 (load latency, toggle latency, keyboard navigation, toggle accessibility)
- **Total:** 12 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Filter Stage Visibility by Role (ep2-s2)

**Setup:** You are logged in as two different users — Susan (engineer) and Hamish (product) — with access to Feature A1. Both have full visibility to all 7 stages if they choose to reveal them, but their default views differ by role.

---

### Scenario AC1: Engineer Default View

**Expected outcome:** When Susan (engineer) loads Feature A1, she sees only the stages relevant to engineering work.

1. Log in as Susan (engineer role).
2. Navigate to Feature A1's main page: `http://localhost:3000/features/feature-a1-uuid`.
3. **Verify:** The page renders completely.
4. **Verify:** The stage list on the left or in the main navigation shows exactly 4 items:
   - "test-plan"
   - "review"
   - "definition-of-ready"
   - "coding"
5. **Verify:** The following stages are NOT visible in the default view:
   - discovery
   - benefit-metric
   - definition
6. **Verify:** The stage list is presented without any scrolling, menu click, or toggle required — it is the default view.

---

### Scenario AC2: Product Default View Is Different

**Expected outcome:** When Hamish (product) loads the same Feature A1, he sees only product-relevant stages — a different set from Susan's default.

1. Log in as Hamish (product role) in a separate browser session (or clear Susan's session).
2. Navigate to the same Feature A1: `http://localhost:3000/features/feature-a1-uuid`.
3. **Verify:** The page renders completely.
4. **Verify:** The stage list shows exactly 3 items:
   - "discovery"
   - "benefit-metric"
   - "definition"
5. **Verify:** The following stages are NOT visible in Hamish's default view:
   - test-plan
   - review
   - definition-of-ready
   - coding
6. **Verify:** This view is materially different from Susan's (no stages overlap in the default views).

---

### Scenario AC3: Show All Stages Toggle

**Expected outcome:** Either role can click "Show all stages" and see the entire pipeline without refreshing the page.

1. From Scenario AC1 or AC2, locate a "Show all stages" button or toggle on the feature page.
2. **Verify:** The button or toggle is visible and reachable without scrolling.
3. Click "Show all stages".
4. **Verify:** The page does NOT refresh (if you had unsaved text or a scroll position, it remains).
5. **Verify:** ALL 7 stages now appear:
   - discovery
   - benefit-metric
   - definition
   - test-plan
   - review
   - definition-of-ready
   - coding
6. **Verify:** None of the originally-visible stages (from AC1 or AC2) are hidden — they are still there, and the new ones are added (union, not replacement).
7. **Verify:** If you click "Show all stages" again (toggle off), the list returns to the role-filtered default without a page refresh.

---
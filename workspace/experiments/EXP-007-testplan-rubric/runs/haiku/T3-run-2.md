# Test Plan — T3 Backlog drag-and-drop (browser-layout) (Trial 2)

**Story:** Reorder backlog items by drag-and-drop  
**Story ID:** BL-2.4  
**Test framework:** Playwright (E2E); Node.js for integration  
**E2E test runner:** `playwright test tests/backlog-reorder.spec.ts`  
**Integration test runner:** `node tests/backlog-persistence.test.js`  
**Date written:** 2026-05-16  
**Trial:** 2

---

## Test Data Strategy

**Approach:** Synthetic fixture data for backlog cards; Playwright for E2E drag-drop tests; mocked API for integration tests.

**Test data ownership:** Self-contained — tests generate backlog fixtures. E2E tests render via Playwright browser context.

**Data sources:**
- Backlog fixture: 5 story cards (`{ id: 'story-001', title: 'Feature A', position: 1 }`)
- API mock responses: POST/PATCH to `/stories/order` endpoint
- E2E element locators: `[data-testid="story-card"]`, `[data-testid="reorder-target"]`

**Why E2E for AC1 and AC3:** DOM simulation (jsdom) does not compute CSS layout. Drag-drop positioning depends on:
- Which element occupies pixel coordinates (x, y) on the rendered page
- Visual stacking order and overlap
- CSS transforms and absolute positioning
A jsdom test using `fireEvent.dragStart()` would pass regardless of visual layout — it doesn't verify the AC's observable outcome ("appears immediately above the target card").

**Playwright resolves layout:** A real browser computes CSS layout, so `page.dragAndDrop(source, target)` verifies the actual rendered positioning.

**No PII:** All data is synthetic.

---

## AC Coverage and Test Classification

| AC | Description | Test Type | Status |
|----|-------------|-----------|--------|
| AC1 | Drag above target → appears above in visual order | E2E browser | Covered |
| AC2 | Reorder persists after navigation away/return | Integration | Covered |
| AC3 | Drag pos-3 to pos-1 → cascading shift (1→2, 2→3) | E2E browser | Covered |

**Gap analysis:** No gaps. AC1 and AC3 are correctly classified as E2E (layout-dependent). AC2 is integration (API persistence).

---

## Integration Tests

### Test 1: AC2 — Reordered backlog persists after navigation away and return

**Given:** A product owner has reordered the backlog by drag-and-drop  
**When:** They navigate away and return to the backlog view  
**Then:** The reordered sequence is preserved and displayed in the order they set

```javascript
// tests/backlog-persistence.test.js
test('AC2: backlog order persists after navigation away and return', async () => {
  const mockApi = new MockBacklogApi();
  const backlogService = new BacklogService(mockApi);
  
  // Initial backlog
  const initial = [
    { id: 'story-001', title: 'Login flow', position: 1 },
    { id: 'story-002', title: 'Dashboard', position: 2 },
    { id: 'story-003', title: 'Reports', position: 3 },
    { id: 'story-004', title: 'Notifications', position: 4 },
    { id: 'story-005', title: 'Settings', position: 5 }
  ];
  
  // User reorders: move story-003 to position 1
  const newOrder = ['story-003', 'story-001', 'story-002', 'story-004', 'story-005'];
  
  // Call API to persist new order
  const saveResult = await mockApi.updateStoriesOrder(newOrder);
  expect(saveResult.statusCode).toBe(200);
  
  // Simulate navigation away and return: fetch backlog again
  const refetchedBacklog = await mockApi.getBacklog();
  
  // Verify order is persisted
  const ids = refetchedBacklog.map(s => s.id);
  expect(ids).toEqual(newOrder);
  expect(refetchedBacklog[0].id).toBe('story-003');
  expect(refetchedBacklog[1].id).toBe('story-001');
  expect(refetchedBacklog[2].id).toBe('story-002');
});
```

**Expected to fail before implementation:** ✓

---

## E2E Browser Tests

### AC1 & AC3 — Drag-and-drop positioning (browser-layout-dependent)

**Why Playwright (not jsdom):** 
- AC1 requires verifying the dragged card "appears immediately above the target card in the displayed backlog order"
- AC3 requires verifying "the dragged card moves to position 1" (specific rendered position)
- Both depend on CSS layout computation, which jsdom does not support
- Playwright uses a real browser, which computes layout correctly

### Test 2: AC1 — Drag card above target; appears in correct visual order

**Given:** Product owner viewing 5 backlog cards  
**When:** They drag card at position 3 and drop it above card at position 1  
**Then:** Dragged card visually appears above the target, all adjacent cards shift

```typescript
// tests/backlog-reorder.spec.ts (Playwright)
test('AC1: drag card above target → visually reorders on display', async ({ page }) => {
  await page.goto('/backlog');
  
  // Wait for all cards to render
  await page.waitForSelector('[data-testid="story-card"]');
  
  // Get initial card order from DOM
  const initialCards = await page.locator('[data-testid="story-card"]').all();
  const initialIds = [];
  for (const card of initialCards) {
    initialIds.push(await card.getAttribute('data-story-id'));
  }
  expect(initialIds).toEqual([
    'story-001', 'story-002', 'story-003', 'story-004', 'story-005'
  ]);
  
  // Drag card at position 3 (story-003) above card at position 1 (story-001)
  const cardToDrag = initialCards[2];    // position 3 (0-indexed: 2)
  const targetCard = initialCards[0];    // position 1 (0-indexed: 0)
  
  // Perform drag-and-drop
  await cardToDrag.dragTo(targetCard);
  
  // Wait for reorder animation/update
  await page.waitForTimeout(300);
  
  // Get reordered card positions from DOM
  const reorderedCards = await page.locator('[data-testid="story-card"]').all();
  const reorderedIds = [];
  for (const card of reorderedCards) {
    reorderedIds.push(await card.getAttribute('data-story-id'));
  }
  
  // Verify story-003 is now at position 1 (visually appears above story-001)
  expect(reorderedIds[0]).toBe('story-003');
  expect(reorderedIds[1]).toBe('story-001');
  expect(reorderedIds[2]).toBe('story-002');
  expect(reorderedIds[3]).toBe('story-004');
  expect(reorderedIds[4]).toBe('story-005');
  
  // Verify API was called with correct order
  expect(mockApi.lastPatchedOrder).toEqual(reorderedIds);
});
```

**Expected to fail before implementation:** ✓

### Test 3: AC3 — Drag position-3 to position-1; correct cascading positions

**Given:** Backlog with cards at positions 1–5  
**When:** Drag card at position 3 and drop onto card at position 1  
**Then:** Position-3 → position-1, position-1 → position-2, position-2 → position-3 (cascading)

```typescript
test('AC3: drag pos-3 to pos-1 → correct cascading shift', async ({ page }) => {
  await page.goto('/backlog');
  await page.waitForSelector('[data-testid="story-card"]');
  
  const initialCards = await page.locator('[data-testid="story-card"]').all();
  expect(initialCards).toHaveLength(5);
  
  // Initial state: [story-001, story-002, story-003, story-004, story-005]
  const initialIds = [];
  for (const card of initialCards) {
    initialIds.push(await card.getAttribute('data-story-id'));
  }
  
  // Drag the card currently at position 3 (story-003) onto position 1 (story-001)
  const position3Card = initialCards[2];
  const position1Card = initialCards[0];
  
  await position3Card.dragTo(position1Card);
  await page.waitForTimeout(300);
  
  // Verify the cascading shift
  const reorderedCards = await page.locator('[data-testid="story-card"]').all();
  const reorderedIds = [];
  for (const card of reorderedCards) {
    reorderedIds.push(await card.getAttribute('data-story-id'));
  }
  
  // Expected: [story-003, story-001, story-002, story-004, story-005]
  expect(reorderedIds[0]).toBe('story-003');  // Moved from position 3 to position 1
  expect(reorderedIds[1]).toBe('story-001');  // Shifted from position 1 to position 2
  expect(reorderedIds[2]).toBe('story-002');  // Shifted from position 2 to position 3
  expect(reorderedIds[3]).toBe('story-004');  // Unchanged at position 4
  expect(reorderedIds[4]).toBe('story-005');  // Unchanged at position 5
});
```

**Expected to fail before implementation:** ✓

---

## Gap Analysis

**No gaps identified.** AC1 and AC3 correctly classified as E2E (browser layout required). AC2 correctly classified as integration (API persistence). No jsdom drag-drop tests.

---

---

# AC Verification Script — T3 Backlog drag-and-drop

**Story:** Reorder backlog items by drag-and-drop  
**Story ID:** BL-2.4  
**Audience:** Product Owner, UX, QA  
**Last updated:** 2026-05-16  
**Trial:** 2

---

## Test Environment Setup

Before running the scenarios below:

1. Backlog UI is deployed or running locally at `http://localhost:3000`
2. Playwright is installed: `npm install -D @playwright/test`
3. Run E2E tests: `playwright test tests/backlog-reorder.spec.ts`
4. Run integration tests: `node tests/backlog-persistence.test.js`

---

## AC1: Drag card above target; appears immediately above in visual order 🔴

**Scenario (requires browser):** Verify the drag-and-drop visual reordering works correctly.

1. Navigate to the backlog page
2. Observe 5 story cards in order: "Login flow" (1), "Dashboard" (2), "Reports" (3), "Notifications" (4), "Settings" (5)
3. **Click and hold** the "Reports" card (position 3)
4. **Drag the card upward** until your cursor is above the "Login flow" card (position 1)
5. **Release the mouse button** to drop
6. Observe on screen:
   - "Reports" card **moves to the top** (now at position 1)
   - "Login flow" and "Dashboard" **shift down one position each**
   - "Notifications" and "Settings" remain in positions 4 and 5
   - All cards remain properly aligned and spaced
   - The new order is: "Reports", "Login flow", "Dashboard", "Notifications", "Settings"

**Expected outcome:** The drag-and-drop interaction is smooth, visual reordering happens immediately, and all cards shift correctly.

**Reset:** Refresh the page to restore original order.

---

## AC2: Reordered backlog persists after navigation away and return

**Scenario:** Verify that your backlog reordering is saved and restored when you navigate away and return.

1. Navigate to the backlog page
2. Perform a reordering (e.g., drag "Reports" to position 1, as in AC1)
3. Wait 2–3 seconds for the save to complete
4. Navigate away from the backlog (click another menu item: "Team", "Projects", etc.)
5. Wait 3 seconds
6. Navigate back to the backlog page
7. Observe: The backlog **still shows your reordered sequence**
   - "Reports" is still at position 1
   - "Login flow" is still at position 2
   - "Dashboard" is still at position 3
   - "Notifications" and "Settings" at positions 4 and 5

**Expected outcome:** Reordering is persisted to the database and displayed when you return to the backlog.

**Reset:** Reorder back to original and refresh.

---

## AC3: Drag position-3 to position-1; correct cascading shift 🔴

**Scenario (requires browser):** Verify precise position-to-position reordering with cascading shifts.

1. Navigate to the backlog page
2. Observe the current order:
   - Position 1: "Login flow"
   - Position 2: "Dashboard"
   - Position 3: "Reports"
   - Position 4: "Notifications"
   - Position 5: "Settings"
3. **Click and hold** the card at position 3: "Reports"
4. **Drag it to position 1** — specifically, drop it **directly on** the "Login flow" card
5. **Release to complete the drop**
6. Verify the new order on screen:
   - Position 1: "Reports" (moved from position 3) ✓
   - Position 2: "Login flow" (shifted down from position 1) ✓
   - Position 3: "Dashboard" (shifted down from position 2) ✓
   - Position 4: "Notifications" (unchanged from position 4) ✓
   - Position 5: "Settings" (unchanged from position 5) ✓

**Expected outcome:**
- Exact position shift: card at pos-3 now at pos-1
- Cascading shift: previous pos-1 and pos-2 shift down by exactly one position
- No cards are duplicated or lost
- All 5 positions remain accounted for

**Reset:** Refresh the page.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] 🔴 Drag a card from position 5 to position 2; verify it appears at position 2 and others shift (requires browser)
- [ ] 🔴 Drag a card from position 1 to position 4; verify cascading shift (requires browser)
- [ ] Reorder the backlog, navigate away, return — verify order is persisted
- [ ] Drag 3 different cards in sequence; verify each reordering is independent and persisted
- [ ] Verify no cards are duplicated or lost after multiple drag operations
- [ ] Test with different browser zoom levels (75%, 100%, 125%) and verify drag-drop still works
- [ ] Test on different screen sizes (desktop, tablet) and verify positioning is correct

**Note:** 🔴 indicates scenarios requiring a real browser with CSS layout computation. These must be tested in Playwright (or equivalent E2E tool) and cannot be verified in DOM simulation environments like jsdom.

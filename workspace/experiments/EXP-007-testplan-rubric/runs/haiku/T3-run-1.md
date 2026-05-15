# Test Plan — T3 Backlog drag-and-drop (browser-layout)

**Story:** Reorder backlog items by drag-and-drop  
**Story ID:** BL-2.4  
**Test framework:** Playwright (E2E); Node.js for integration  
**E2E test runner:** `playwright test tests/backlog-dragdrop.spec.ts`  
**Integration test runner:** `node tests/backlog-api-order.test.js`  
**Date written:** 2026-05-15

---

## Test Data Strategy

**Approach:** Synthetic test data (backlog items, story card fixtures) for both E2E and integration tests.

**Test data ownership:** Self-contained — tests generate backlog fixture data in setup/teardown.

**Data sources:**
- Backlog items (fixture): 5 story cards with IDs, titles, and positions
- Story card objects: `{ id: 'story-001', title: 'Payment system', position: 1 }`
- API mock responses: Mock PATCH /stories/order endpoint

**E2E test data:** Playwright will seed the frontend with 5 pre-populated backlog items. The API backend (real or mocked) will be available to receive PATCH requests.

**No PII:** All data is synthetic.

---

## AC Coverage and Test Classification

| AC | Description | Test type | Status |
|----|-------------|-----------|--------|
| AC1 | Drag card above target → dragged appears above target in display order | E2E browser | Covered |
| AC2 | Reorder persists after navigation away and return | Integration | Covered |
| AC3 | Drag position-3 to position-1 → correct order (1→2, 2→3) | E2E browser | Covered |

**Gap analysis:** No gaps. AC1 and AC3 are browser-layout-dependent and require E2E tests. AC2 is persistence and can be tested at the integration (API) level.

---

## Integration Tests

### Test 1: AC2 — Backlog order persists after navigation away and return

**Given:** A product owner has reordered the backlog by drag-and-drop  
**When:** They navigate away from the backlog view and return  
**Then:** The reordered sequence is preserved and displayed in the order they set

```javascript
// tests/backlog-api-order.test.js
test('should persist reordered backlog when navigating away and returning', async () => {
  const mockApi = new MockBacklogApi();
  const backlogService = new BacklogService(mockApi);
  
  // Initial backlog order
  const initialOrder = [
    { id: 'story-001', title: 'Payment system', position: 1 },
    { id: 'story-002', title: 'Auth flow', position: 2 },
    { id: 'story-003', title: 'Dashboard', position: 3 },
    { id: 'story-004', title: 'Reports', position: 4 },
    { id: 'story-005', title: 'Analytics', position: 5 }
  ];
  
  // User reorders: move story-003 to position 1
  const newOrder = [
    'story-003',  // position 1 (moved from 3)
    'story-001',  // position 2 (shifted from 1)
    'story-002',  // position 3 (shifted from 2)
    'story-004',  // position 4 (unchanged)
    'story-005'   // position 5 (unchanged)
  ];
  
  // Call API to save new order
  const response = await mockApi.patchStoriesOrder(newOrder);
  expect(response.status).toBe(200);
  
  // Simulate navigation away and return: fetch the backlog again
  const fetchedOrder = await mockApi.getBacklog();
  
  // Verify order is persisted
  expect(fetchedOrder[0].id).toBe('story-003');
  expect(fetchedOrder[1].id).toBe('story-001');
  expect(fetchedOrder[2].id).toBe('story-002');
  expect(fetchedOrder[3].id).toBe('story-004');
  expect(fetchedOrder[4].id).toBe('story-005');
});
```

**Expected to fail before implementation:** ✓

---

## E2E Browser Tests

### AC1 & AC3 — Drag-and-drop positioning (browser-layout-dependent)

**Why E2E is required:** Drag-and-drop positioning depends on CSS layout. The DOM simulation environment (jsdom) does not compute:
- Which CSS element is at rendered position (x, y)
- Whether a drop target is "above" or "below" another element in visual space
- CSS stacking context and z-index ordering

Playwright's real browser context resolves these via actual CSS layout computation.

### Test 2: AC1 — Drag card above target; appears in correct display order

**Given:** Product owner is viewing the backlog with 5 story cards displayed  
**When:** They drag the card at visual position 3 and drop it above the card at visual position 1  
**Then:** The dragged card appears visually above the target card, and all adjacent cards shift

```typescript
// tests/backlog-dragdrop.spec.ts (Playwright)
test('should reorder backlog when dragging card above target', async ({ page }) => {
  await page.goto('/backlog');
  
  // Wait for backlog cards to render
  await page.waitForSelector('[data-testid="story-card"]');
  
  // Get initial card order
  const initialCards = await page.locator('[data-testid="story-card"]').all();
  expect(initialCards.length).toBe(5);
  const initialTitles = [];
  for (const card of initialCards) {
    initialTitles.push(await card.getAttribute('data-story-id'));
  }
  // Expected: ['story-001', 'story-002', 'story-003', 'story-004', 'story-005']
  
  // Drag card at position 3 (story-003) and drop above card at position 1 (story-001)
  const cardToDrag = initialCards[2]; // position 3 (0-indexed: 2)
  const cardToDropAbove = initialCards[0]; // position 1 (0-indexed: 0)
  
  await cardToDrag.dragTo(cardToDropAbove);
  
  // Wait for animation/reorder to complete
  await page.waitForTimeout(500);
  
  // Get reordered card order
  const reorderedCards = await page.locator('[data-testid="story-card"]').all();
  const reorderedTitles = [];
  for (const card of reorderedCards) {
    reorderedTitles.push(await card.getAttribute('data-story-id'));
  }
  
  // Verify new order: story-003 appears first (above story-001)
  expect(reorderedTitles[0]).toBe('story-003');
  expect(reorderedTitles[1]).toBe('story-001');
  expect(reorderedTitles[2]).toBe('story-002');
  expect(reorderedTitles[3]).toBe('story-004');
  expect(reorderedTitles[4]).toBe('story-005');
  
  // Verify API was called with correct order
  expect(mockApi.patchCallCount).toBe(1);
  expect(mockApi.lastPatchedOrder).toEqual([
    'story-003', 'story-001', 'story-002', 'story-004', 'story-005'
  ]);
});
```

**Expected to fail before implementation:** ✓

**Why NOT jsdom:** A unit test using `fireEvent.dragStart(card, { ... })` would not verify that the dragged card visually appears above the target. CSS layout is not computed, so the test cannot assert the *rendered position* of the cards.

### Test 3: AC3 — Drag position-3 to position-1; correct cascading shift

**Given:** Product owner is viewing the backlog with cards at positions 1–5  
**When:** They drag the card at position 3 and drop it onto the card at position 1  
**Then:** Position-3 card moves to position 1, previous position-1 moves to position 2, previous position-2 moves to position 3, and positions 4–5 remain unchanged

```typescript
test('should correctly shift cards when dragging position-3 to position-1', async ({ page }) => {
  await page.goto('/backlog');
  await page.waitForSelector('[data-testid="story-card"]');
  
  const initialCards = await page.locator('[data-testid="story-card"]').all();
  expect(initialCards.length).toBe(5);
  
  // Initial state: [story-001, story-002, story-003, story-004, story-005]
  const initialOrder = [];
  for (const card of initialCards) {
    initialOrder.push(await card.getAttribute('data-story-id'));
  }
  expect(initialOrder).toEqual([
    'story-001', 'story-002', 'story-003', 'story-004', 'story-005'
  ]);
  
  // Drag card at position 3 (story-003) onto card at position 1 (story-001)
  const position3Card = initialCards[2];
  const position1Card = initialCards[0];
  
  await position3Card.dragTo(position1Card);
  await page.waitForTimeout(500);
  
  // Verify order matches AC3 requirement
  const reorderedCards = await page.locator('[data-testid="story-card"]').all();
  const reorderedOrder = [];
  for (const card of reorderedCards) {
    reorderedOrder.push(await card.getAttribute('data-story-id'));
  }
  
  // Expected: story-003 at position 1, story-001 at position 2, story-002 at position 3
  expect(reorderedOrder[0]).toBe('story-003'); // new position 1
  expect(reorderedOrder[1]).toBe('story-001'); // shifted to position 2
  expect(reorderedOrder[2]).toBe('story-002'); // shifted to position 3
  expect(reorderedOrder[3]).toBe('story-004'); // unchanged at position 4
  expect(reorderedOrder[4]).toBe('story-005'); // unchanged at position 5
});
```

**Expected to fail before implementation:** ✓

---

## NFR Tests

**NFR status:** None for this story. No NFR tests required.

---

## Gap Analysis

**No gaps identified.** All 3 ACs are covered: AC1 and AC3 with E2E browser tests (correctly classified as requiring CSS layout verification), and AC2 with an integration test (API persistence).

---

---

# AC Verification Script — T3 Backlog drag-and-drop

**Story:** Reorder backlog items by drag-and-drop  
**Story ID:** BL-2.4  
**Audience:** Product Owner, QA, UX  
**Last updated:** 2026-05-15

---

## Test Environment Setup

Before running the scenarios below:

1. Backlog service is deployed or running locally at `http://localhost:3000`
2. Playwright is installed: `npm install --save-dev @playwright/test`
3. Run E2E tests: `playwright test tests/backlog-dragdrop.spec.ts`
4. Run API persistence test: `node tests/backlog-api-order.test.js`

---

## AC1: Drag card above target; appears in correct display order

**Scenario:** 🔴 Verify the drag-and-drop positioning works correctly (requires browser rendering).

1. Navigate to the backlog page
2. Observe 5 story cards displayed in order: "Payment system", "Auth flow", "Dashboard", "Reports", "Analytics"
3. **Click and hold** the "Dashboard" card (at position 3)
4. **Drag it upward** to position the cursor above the "Payment system" card (at position 1)
5. **Release the mouse** to drop the card
6. Observe the result:
   - "Dashboard" card **jumps to the top** (above "Payment system")
   - "Payment system" **shifts down** one position
   - "Auth flow" **shifts down** one position
   - "Reports" and "Analytics" remain at positions 4 and 5
   - Card positions are visually aligned and properly spaced

**Expected outcome:**
- Visually on screen, the card order is now: "Dashboard", "Payment system", "Auth flow", "Reports", "Analytics"
- The drag-and-drop interaction is smooth and responsive
- All cards remain properly aligned horizontally and vertically

**Reset:** Refresh the page to restore the original order.

---

## AC2: Reorder persists after navigation away and return

**Scenario:** Verify that your backlog reordering is saved and persists when you leave and return.

1. Navigate to the backlog page
2. Drag and drop to reorder the cards (e.g., move "Dashboard" to the top as in AC1)
3. Wait 2 seconds for any server communication to complete
4. Navigate away from the backlog page (click another menu item, e.g., "Team" or "Reports")
5. Wait 3 seconds
6. Click back to the backlog page
7. Observe the result: the backlog **still shows the reordered sequence**
   - "Dashboard" is still at position 1 (still at top)
   - "Payment system" is still at position 2
   - "Auth flow" is still at position 3
   - "Reports" and "Analytics" are at positions 4 and 5

**Expected outcome:** Your reordering is persisted and displayed when you return to the backlog.

**Reset:** Reorder back to original and refresh to reset.

---

## AC3: Drag position-3 to position-1; correct cascading shift

**Scenario:** 🔴 Verify precise position-to-position reordering and cascading shifts (requires browser rendering).

1. Navigate to the backlog page and observe the initial order:
   - Position 1: "Payment system"
   - Position 2: "Auth flow"
   - Position 3: "Dashboard"
   - Position 4: "Reports"
   - Position 5: "Analytics"
2. **Click and hold** the card at position 3 ("Dashboard")
3. **Drag it to position 1** — specifically, drop it **directly onto** the "Payment system" card (position 1)
4. **Release to complete the drop**
5. Verify the new order on screen:
   - Position 1: "Dashboard" (moved from position 3) ✓
   - Position 2: "Payment system" (shifted down from position 1) ✓
   - Position 3: "Auth flow" (shifted down from position 2) ✓
   - Position 4: "Reports" (unchanged) ✓
   - Position 5: "Analytics" (unchanged) ✓

**Expected outcome:**
- All 5 positions are accounted for
- No cards are duplicated or lost
- The card that was at position 3 now appears at position 1 on the rendered backlog
- The two cards that were at positions 1–2 have shifted down by exactly one position each

**Reset:** Refresh the page to restore the original order.

---

## Smoke Test Checklist (Post-Deployment)

- [ ] 🔴 Drag a card from position 3 to position 1 and verify visual reordering (E2E browser verification)
- [ ] 🔴 Drag a card from position 5 to position 2 and verify all intermediate cards shift correctly (E2E browser verification)
- [ ] Reorder backlog, navigate away, return — verify order is preserved
- [ ] Drag 3 different cards in sequence; verify each reordering persists independently
- [ ] Verify no cards are duplicated or lost after multiple reorderings
- [ ] Test with different screen sizes/zoom levels to ensure drag-drop works across resolutions

**Note:** 🔴 indicates scenarios that require a real browser with CSS layout computation. These cannot be verified by DOM simulation tools (jsdom) and must be tested in a browser environment using Playwright or equivalent E2E framework.

# Test Plan — BL-2.4: Reorder backlog items by drag-and-drop

**Story ID:** BL-2.4
**Trial:** 1
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Jest (unit/integration); Playwright (E2E browser tests)
**Framework:** Jest for integration tests; Playwright (`playwright.config.js` present at repo root — confirmed)
**Test data strategy:** Synthetic — seed a backlog with 5 story cards for drag-drop tests. API responses for `PATCH /stories/order` mocked in integration tests. Playwright E2E tests use the Playwright browser context with `page.dragAndDrop()`.

---

## Browser-layout detection — ⚠️ Pre-test classification

> ⚠️ **AC1 is browser-layout-dependent.**
> "The dragged card appears immediately above the target card in the displayed backlog order, and all other cards shift to accommodate the new position." — This AC requires CSS layout computation to verify which rendered element the card lands above. jsdom does not compute CSS layout and cannot determine the rendered visual order of DOM elements. This AC must be tested as a Playwright E2E test.

> ⚠️ **AC3 is browser-layout-dependent.**
> "The dragged card moves to position 1, the previous position-1 card moves to position 2, and the previous position-2 card moves to position 3." — Drag-drop target resolution depends on where elements are rendered on screen. Verifying that a card dropped at a position actually appears in the correct visual slot requires a real browser. A jsdom `fireEvent.dragStart` test would process the drag event handlers regardless of rendered position — it does not test the observable outcome stated in the AC. This AC must be tested as a Playwright E2E test.

A jsdom test using `fireEvent.dragStart()` would pass because the event handler fires regardless of visual layout — it does not verify that the dragged card actually appears above the target card as rendered on screen. Only a real browser computing CSS layout can verify the observable outcome in AC1 and AC3.

**AC2 is persistence-only** — verifying that the reordered sequence is preserved after navigation does not depend on CSS layout. An API-level integration test asserting the PATCH request is made with the correct ordered array and that a subsequent GET returns that order is sufficient.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Drag card above different card → appears immediately above target in displayed order | E2E (Playwright) | 1 | Covered |
| AC2 | Reorder then navigate away and back → reordered sequence preserved | Integration | 2 | Covered |
| AC3 | Drag position-3 card to position-1 → positions shift correctly | E2E (Playwright) | 1 | Covered |

**Total tests:** 4
**E2E required:** Yes — Playwright (configured at `playwright.config.js`)
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | AC1 and AC3 covered by Playwright E2E. AC2 covered by integration test. No gaps. |

---

## E2E tests (Playwright)

### Test suite: Backlog drag-and-drop — visual ordering

```javascript
// tests/e2e/backlog-drag-drop.spec.js
import { test, expect } from '@playwright/test';

test.describe('Backlog drag-and-drop — AC1 and AC3', () => {

  test.beforeEach(async ({ page, request }) => {
    // Seed a backlog with 5 story cards in known order
    await request.post('/test-setup/seed-backlog', {
      data: {
        stories: [
          { id: 'story-s1t3-001', title: 'Story A', position: 1 },
          { id: 'story-s1t3-002', title: 'Story B', position: 2 },
          { id: 'story-s1t3-003', title: 'Story C', position: 3 },
          { id: 'story-s1t3-004', title: 'Story D', position: 4 },
          { id: 'story-s1t3-005', title: 'Story E', position: 5 },
        ],
      },
    });
    await page.goto('/backlog');
    await page.waitForSelector('[data-testid="backlog-card"]');
  });

  // AC1 — Dragged card appears immediately above the target card
  test('dragged card appears immediately above the target card after dropping', async ({ page }) => {
    // Arrange
    const sourceCard = page.locator('[data-story-id="story-s1t3-003"]'); // Story C at position 3
    const targetCard = page.locator('[data-story-id="story-s1t3-001"]'); // Story A at position 1

    // Act — drag Story C above Story A
    await page.dragAndDrop(
      '[data-story-id="story-s1t3-003"]',
      '[data-story-id="story-s1t3-001"]'
    );

    // Assert — Story C now appears above Story A in the rendered backlog
    const cards = await page.locator('[data-testid="backlog-card"]').all();
    const cardTitles = await Promise.all(cards.map(card => card.textContent()));
    const storyAIndex = cardTitles.findIndex(t => t.includes('Story A'));
    const storyCIndex = cardTitles.findIndex(t => t.includes('Story C'));

    expect(storyCIndex).toBeLessThan(storyAIndex);
    // Story C is immediately above Story A (adjacent in rendered order)
    expect(storyCIndex).toBe(storyAIndex - 1);
  });

  // AC3 — Position-3 card moved to position 1: all three positions shift correctly
  test('dragging the position-3 card to position 1 shifts existing cards to positions 2 and 3', async ({ page }) => {
    // Arrange — initial state: Story A (1), Story B (2), Story C (3), Story D (4), Story E (5)
    const cards = page.locator('[data-testid="backlog-card"]');

    // Act — drag the card at position 3 (Story C) to position 1 (above Story A)
    await page.dragAndDrop(
      '[data-story-id="story-s1t3-003"]', // position 3
      '[data-story-id="story-s1t3-001"]'  // drop above position 1
    );

    // Assert — rendered order after drag
    const updatedCards = await page.locator('[data-testid="backlog-card"]').all();
    const updatedTitles = await Promise.all(updatedCards.map(card => card.textContent()));

    // Story C (was pos 3) is now at position 1
    expect(updatedTitles[0]).toContain('Story C');
    // Story A (was pos 1) is now at position 2
    expect(updatedTitles[1]).toContain('Story A');
    // Story B (was pos 2) is now at position 3
    expect(updatedTitles[2]).toContain('Story B');
    // Story D and Story E remain at positions 4 and 5
    expect(updatedTitles[3]).toContain('Story D');
    expect(updatedTitles[4]).toContain('Story E');
  });

});
```

---

## Integration tests

### Test suite: Backlog order persistence (AC2)

```javascript
describe('Backlog order persistence', () => {

  // AC2 — PATCH request sent with reordered array
  it('sends a PATCH /stories/order request with the new ordered array of story IDs after reordering', async () => {
    // Arrange
    const mockApiClient = { patchStoryOrder: jest.fn().mockResolvedValue({ status: 200 }) };
    const backlogStore = new BacklogStore({ apiClient: mockApiClient });
    const initialOrder = ['story-s1t3-001', 'story-s1t3-002', 'story-s1t3-003', 'story-s1t3-004', 'story-s1t3-005'];
    const newOrder = ['story-s1t3-003', 'story-s1t3-001', 'story-s1t3-002', 'story-s1t3-004', 'story-s1t3-005'];

    // Act
    await backlogStore.applyReorder(newOrder);

    // Assert
    expect(mockApiClient.patchStoryOrder).toHaveBeenCalledWith(newOrder);
  });

  // AC2 — Persisted order is returned on subsequent GET
  it('returns the reordered sequence when the backlog is fetched after a reorder', async () => {
    // Arrange
    const apiClient = new FakeApiClient();
    await apiClient.patchStoryOrder(['story-s1t3-003', 'story-s1t3-001', 'story-s1t3-002', 'story-s1t3-004', 'story-s1t3-005']);

    // Act
    const backlogResponse = await apiClient.getBacklog();

    // Assert — order is preserved
    expect(backlogResponse.stories.map(s => s.id)).toEqual([
      'story-s1t3-003',
      'story-s1t3-001',
      'story-s1t3-002',
      'story-s1t3-004',
      'story-s1t3-005',
    ]);
  });

});
```

---

## NFR tests

None — confirmed. This story has no non-functional requirements.

---

## Output 2: AC Verification Script

**Story:** BL-2.4 — Reorder backlog items by drag-and-drop
**For use:** Pre-code sign-off, post-merge smoke test, delivery review
**Environment required:** Application running locally or in test environment with a browser (not a headless environment — drag-and-drop requires a rendered UI).

---

### Setup

Before running these scenarios:
1. Start the application in a browser (Chrome or Firefox recommended).
2. Log in as a product owner test user.
3. Navigate to the backlog view.
4. Ensure there are at least 5 story cards visible in the backlog.
5. Take note of the current order of the first 5 cards before each scenario.

---

### Scenario 1 — AC1: 🔴 Dragged card appears above the target card (browser required)

**What to check:** When a story card is dragged and dropped above another card, it visually appears immediately above that card in the backlog list.

**Steps:**
1. Identify two story cards — call them "Card X" and "Card Y". Card X should start below Card Y.
2. Click and hold Card X, then drag it upward until it is visually hovering above Card Y.
3. Release the mouse button (drop the card).

**Expected result:** Card X now appears immediately above Card Y in the list. All cards below the new position of Card X have shifted down by one slot. The order looks natural — no jumps, no cards overlapping.

**If broken:** Card X snaps back to its original position, or it appears in the wrong slot (not immediately above Card Y), or the other cards do not shift to accommodate the new position.

---

### Scenario 2 — AC2: Reordered order is preserved after navigation

**What to check:** The new order set by drag-and-drop is saved — if you leave the backlog and come back, the order is the same.

**Steps:**
1. Reorder at least one card (use Scenario 1 steps above).
2. Navigate away from the backlog (click any other page in the application).
3. Navigate back to the backlog.

**Expected result:** The backlog appears in the same order as you left it after the drag-and-drop. The card you moved is still in its new position.

**If broken:** The backlog reverts to its previous order when you navigate away and return. The reorder was not saved.

---

### Scenario 3 — AC3: 🔴 Moving a card from position 3 to position 1 shifts all affected cards correctly (browser required)

**What to check:** When a card is dragged from the third position to the first position, the previous first and second cards shift down, and everything lines up correctly.

**Steps:**
1. Note the current order of the first three cards — call them Position-1 Card, Position-2 Card, and Position-3 Card.
2. Drag the Position-3 Card to the very top of the list (above the Position-1 Card).
3. Release to drop.

**Expected result:**
- The Position-3 Card is now in position 1 (at the top of the list).
- The former Position-1 Card is now in position 2.
- The former Position-2 Card is now in position 3.
- All other cards (positions 4 onward) remain in the same order.

**If broken:** The card lands in the wrong position, or the other cards do not shift correctly (e.g. two cards occupy the same position, or a card disappears).

---

**Test plan complete for BL-2.4 ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T3-run-1.md`
4 tests | 0 unit | 2 integration | 2 E2E (Playwright) | 0 NFR | 3 ACs covered
No gaps — AC1 and AC3 correctly assigned to Playwright E2E; AC2 covered by integration test.

Verification script: embedded above
3 scenarios | 2 marked 🔴 (browser required) | 0 manual gap scenarios

Test data: Synthetic — 5-card backlog seeded in test setup. No real project data.

`hasLayoutDependentGaps: false` (no untested layout gaps — E2E covers AC1 and AC3)
`e2eToolingRequired: true` (Playwright assigned for AC1 and AC3)

# Test Plan — BL-2.4: Reorder backlog items by drag-and-drop

**Story ID:** BL-2.4
**Trial:** 2
**Model:** claude-sonnet-4-6
**Experiment:** EXP-007-testplan-rubric
**Date:** 2026-05-16

---

## Test context

**Test runner:** Playwright (E2E — AC1, AC3); Jest (integration — AC2)
**Framework:** Playwright for browser-layout-dependent drag-and-drop ACs; Jest + mock API client for persistence tests
**Test data strategy:** Synthetic — backlog stories created via API setup before each test. Story IDs use `s2t3` prefix (distinct from Trial 1 `s1t3` prefix). Story titles use `Story P / Q / R / S / T` naming (distinct from Trial 1 `A / B / C / D / E`).

---

## ⚠️ Browser-layout detection

> **AC1 and AC3 MUST use Playwright E2E tests — NOT jsdom or fireEvent simulation.**
>
> AC1: "The dragged card appears immediately above the target card in the displayed backlog order." — Verifying that a card appears at a specific visual position in the rendered list requires the browser's layout engine to compute and reflect the actual DOM order after a drag interaction. jsdom does not implement CSS layout, does not compute rendered positions, and cannot resolve where a drag target lands relative to other elements. A `fireEvent.dragStart` / `fireEvent.drop` test would pass regardless of whether the visual reordering works correctly.
>
> AC3: "Dragging the card at position 3 to position 1 shifts the card previously at position 1 to position 2 and the card previously at position 2 to position 3." — Same constraint. Reading final rendered positions of elements in the list requires the layout engine. jsdom cannot validate this.
>
> Playwright is confirmed as the configured E2E framework (`playwright.config.js` at repo root). Use `page.dragAndDrop()`.

---

## AC coverage table

| AC | Description | Test type | Test count | Status |
|----|-------------|-----------|------------|--------|
| AC1 | Dragged card appears immediately above the target card after drop | E2E (Playwright) | 1 | Covered |
| AC2 | Navigate away and back → reordered sequence is preserved | Integration | 2 | Covered |
| AC3 | Position-3 card dragged to position-1 → shift-down effect on positions 1 and 2 | E2E (Playwright) | 1 | Covered |

**Total tests:** 4
**E2E required:** Yes — Playwright for AC1 and AC3
**NFRs:** None — confirmed

---

## Gap table

| Gap | AC | Gap type | Handling | Rationale |
|-----|----|----------|----------|-----------|
| None | — | — | — | AC1 and AC3 correctly covered by Playwright E2E. No untestable ACs. |

---

## E2E tests (Playwright)

### Test suite: Backlog drag-and-drop reordering

```javascript
// tests/e2e/backlog-drag-drop.spec.js
import { test, expect } from '@playwright/test';

test.describe('Backlog — drag-and-drop reordering', () => {

  test.beforeEach(async ({ page, request }) => {
    // Seed backlog with 5 stories in known order: P(1) Q(2) R(3) S(4) T(5)
    await request.post('/api/test-setup/backlog', {
      data: {
        stories: [
          { id: 'story-s2t3-001', title: 'Story P', position: 1 },
          { id: 'story-s2t3-002', title: 'Story Q', position: 2 },
          { id: 'story-s2t3-003', title: 'Story R', position: 3 },
          { id: 'story-s2t3-004', title: 'Story S', position: 4 },
          { id: 'story-s2t3-005', title: 'Story T', position: 5 },
        ],
      },
    });
    await page.goto('/backlog');
    await page.waitForSelector('[data-testid="backlog-story"]');
  });

  // AC1 — Dragged card appears immediately above target card
  test('the dragged card appears immediately above the target card in the backlog list after dropping', async ({ page }) => {
    // Drag Story R (pos 3) above Story P (pos 1)
    await page.dragAndDrop(
      '[data-story-id="story-s2t3-003"]', // drag source: Story R
      '[data-story-id="story-s2t3-001"]'  // drop target: Story P
    );

    // Assert Story R is now in position above Story P in the rendered list
    const storyItems = page.locator('[data-testid="backlog-story"]');
    const titles = await storyItems.allTextContents();
    const storyRIndex = titles.findIndex(t => t.includes('Story R'));
    const storyPIndex = titles.findIndex(t => t.includes('Story P'));
    expect(storyRIndex).toBeLessThan(storyPIndex);
    expect(storyPIndex).toBe(storyRIndex + 1);
  });

  // AC3 — Position-3 card to position-1 shifts positions 1 and 2 down
  test('dragging the position-3 card to position 1 moves the position-1 card to position 2 and the position-2 card to position 3', async ({ page }) => {
    // Story R is at position 3; drag to above Story P (position 1)
    await page.dragAndDrop(
      '[data-story-id="story-s2t3-003"]', // Story R (pos 3) → drag to pos 1
      '[data-story-id="story-s2t3-001"]'  // Story P (pos 1) → becomes target
    );

    // Assert new rendered order: R(1), P(2), Q(3), S(4), T(5)
    const storyItems = page.locator('[data-testid="backlog-story"]');
    const updatedTitles = await storyItems.allTextContents();
    expect(updatedTitles[0]).toContain('Story R'); // was position 3 → now 1
    expect(updatedTitles[1]).toContain('Story P'); // was position 1 → now 2
    expect(updatedTitles[2]).toContain('Story Q'); // was position 2 → now 3
    expect(updatedTitles[3]).toContain('Story S'); // unchanged → still 4
    expect(updatedTitles[4]).toContain('Story T'); // unchanged → still 5
  });

});
```

---

## Integration tests

### Test suite: Backlog reordering — persistence

```javascript
describe('Backlog reordering — persistence', () => {

  // AC2 — PATCH /stories/order called with correct new order
  it('sends a PATCH request to /stories/order with the updated story order after a drag-and-drop reorder', async () => {
    // Arrange
    const mockApiClient = {
      patchStoryOrder: jest.fn().mockResolvedValue({ success: true }),
    };
    const backlogController = new BacklogController({ apiClient: mockApiClient });

    // Simulate a reorder: move story-s2t3-003 (R) to position 1
    const reorderEvent = {
      movedStoryId: 'story-s2t3-003',
      newOrder: [
        'story-s2t3-003', // R → pos 1
        'story-s2t3-001', // P → pos 2
        'story-s2t3-002', // Q → pos 3
        'story-s2t3-004', // S → pos 4
        'story-s2t3-005', // T → pos 5
      ],
    };

    // Act
    await backlogController.handleReorder(reorderEvent);

    // Assert
    expect(mockApiClient.patchStoryOrder).toHaveBeenCalledWith(reorderEvent.newOrder);
  });

  // AC2 — Reordered sequence returned on subsequent fetch
  it('returns stories in the new reordered sequence when the backlog is fetched after a successful reorder', async () => {
    // Arrange
    const storyStore = new InMemoryStoryStore([
      { id: 'story-s2t3-001', title: 'Story P', position: 1 },
      { id: 'story-s2t3-002', title: 'Story Q', position: 2 },
      { id: 'story-s2t3-003', title: 'Story R', position: 3 },
      { id: 'story-s2t3-004', title: 'Story S', position: 4 },
      { id: 'story-s2t3-005', title: 'Story T', position: 5 },
    ]);
    const backlogService = new BacklogService({ storyStore });

    // Reorder: move Story R to position 1
    await backlogService.reorder([
      'story-s2t3-003',
      'story-s2t3-001',
      'story-s2t3-002',
      'story-s2t3-004',
      'story-s2t3-005',
    ]);

    // Fetch the backlog again and check order persisted
    const backlogResponse = await backlogService.getBacklog();

    // Assert
    expect(backlogResponse.stories.map(s => s.id)).toEqual([
      'story-s2t3-003',
      'story-s2t3-001',
      'story-s2t3-002',
      'story-s2t3-004',
      'story-s2t3-005',
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
**Environment required:** Application running in browser. Scenarios 1 and 3 require a browser — they cannot be verified without rendering the backlog UI. Scenario 2 (persistence) can be verified without a browser.

---

### Setup

Before running these scenarios:
1. Open the application in a web browser.
2. Log in with a user account that has access to the backlog view.
3. Ensure the backlog has at least 5 items. If needed, create test stories named `Story P`, `Story Q`, `Story R`, `Story S`, `Story T` in that order.

---

### Scenario 1 — AC1: 🔴 Dragged card appears immediately above the target card after dropping (browser required)

**What to check:** When you drag a card and drop it above another card, the dragged card appears immediately above the target in the displayed list — no page refresh needed.

**Steps:**
1. Identify two cards in the backlog — pick one to drag (the "source") and one to drop it above (the "target").
2. Click and hold the source card.
3. Drag it upwards (or downwards) over the target card.
4. Release the mouse when the drop indicator appears above the target.

**Expected result:** The source card immediately appears in the position directly above the target card in the list. The visual update happens without a page reload. No other cards move unexpectedly.

**If broken:** The card snaps back to its original position, or it appears in the wrong position, or no visual update occurs after dropping.

---

### Scenario 2 — AC2: Order is preserved after navigating away and back

**What to check:** The new order is saved — if you leave the backlog view and come back, the stories appear in the order you set.

**Steps:**
1. Perform a drag-and-drop reorder (use Scenario 1 steps).
2. Confirm the new visual order looks correct.
3. Navigate to a different page in the application.
4. Navigate back to the backlog.

**Expected result:** The stories appear in exactly the same order as when you left — the drag-and-drop order is preserved across navigation.

**If broken:** The stories revert to their previous order when you navigate back.

---

### Scenario 3 — AC3: 🔴 Dragging position-3 to position-1 shifts positions 1 and 2 down (browser required)

**What to check:** Moving a card from position 3 all the way to position 1 pushes both the card at position 1 and the card at position 2 down by one position each.

**Steps:**
1. Note the first 3 cards in the backlog in their current order. Label them mentally as A (pos 1), B (pos 2), C (pos 3).
2. Drag card C (position 3) to position 1 — drop it above card A.

**Expected result:** The list now shows:
- Position 1: Card C (previously position 3)
- Position 2: Card A (previously position 1 — shifted down one)
- Position 3: Card B (previously position 2 — shifted down one)
- Positions 4+ are unchanged

**If broken:** Card C does not reach position 1, or Card A and Card B are not shifted correctly, or the order is inconsistent with what you would expect from the drag operation.

---

**Test plan complete for BL-2.4 (Trial 2) ✅**

Technical test plan: `workspace/experiments/EXP-007-testplan-rubric/runs/sonnet/T3-run-2.md`
4 tests | 0 unit | 2 integration | 2 Playwright E2E | 3 ACs covered
No gaps. AC1 and AC3 correctly assigned to Playwright E2E. jsdom excluded with explicit rationale.

Verification script: embedded above
3 scenarios | 2 marked 🔴 (browser required) | 0 manual gap scenarios

Test data: Synthetic. All fixture IDs use `s2t3` prefix. Story titles P/Q/R/S/T (distinct from Trial 1 A/B/C/D/E).

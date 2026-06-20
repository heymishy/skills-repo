# Test Plan: iem.1 — Application Shell and 2×2 Canvas

**Story:** iem.1 — Application shell and 2×2 canvas
**Feature:** 2026-06-04-impact-effort-matrix-workshop
**Review status:** PASS (corrected stories from Review Run 1)
**Test framework:** Vitest + React Testing Library
**E2E framework:** Playwright (not required for this story)
**Written:** 2026-06-04
**TDD discipline:** All tests written to fail — implementation does not exist yet

---

## Test data strategy

| Story | Strategy | Notes |
|-------|----------|-------|
| iem.1 | Synthetic | No cards, no external data. localStorage state injected directly in test setup via `localStorage.setItem('iem-session', JSON.stringify(...))` or cleared via `localStorage.clear()`. |

No PCI/sensitivity constraints. No test data gaps.

---

## AC coverage table

| AC | Description | Test type | Test IDs | Gap |
|----|-------------|-----------|----------|-----|
| AC1 | Grid displays with Impact (Y) and Effort (X) labels on first load | Unit | U1.1, U1.2 | None |
| AC2 | Four quadrant labels visible in correct positions | Unit | U1.3 | None |
| AC3 | Empty canvas + prompt when no prior session | Unit | U1.4 | None |
| AC4 | Banner shown + cards restored when prior session in localStorage | Unit | U1.5, U1.6 | None |

---

## Unit tests

### U1.1 — Axis label: Impact on Y-axis

**AC:** AC1
**Precondition:** No session in localStorage; component renders fresh.
**Action:** Render `<App />` (or `<Canvas />`).
**Expected:** Element with text "Impact" is present in the document.
**Edge case:** None.

```javascript
test('renders Impact axis label', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText('Impact')).toBeInTheDocument();
});
```

---

### U1.2 — Axis label: Effort on X-axis

**AC:** AC1
**Precondition:** No session in localStorage.
**Action:** Render `<App />`.
**Expected:** Element with text "Effort" is present in the document.

```javascript
test('renders Effort axis label', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText('Effort')).toBeInTheDocument();
});
```

---

### U1.3 — Four quadrant labels visible

**AC:** AC2
**Precondition:** Component renders.
**Action:** Render `<App />`.
**Expected:** All four quadrant label strings are present in the document: "High Impact / Low Effort", "High Impact / High Effort", "Low Impact / Low Effort", "Low Impact / High Effort".

```javascript
test('renders all four quadrant labels', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText('High Impact / Low Effort')).toBeInTheDocument();
  expect(screen.getByText('High Impact / High Effort')).toBeInTheDocument();
  expect(screen.getByText('Low Impact / Low Effort')).toBeInTheDocument();
  expect(screen.getByText('Low Impact / High Effort')).toBeInTheDocument();
});
```

---

### U1.4 — Empty canvas with prompt on first visit

**AC:** AC3
**Precondition:** `localStorage.clear()` called before render; no `iem-session` key present.
**Action:** Render `<App />`.
**Expected:** A prompt element guiding the user to add their first card is visible. No card elements are rendered.

```javascript
test('shows empty canvas prompt when no prior session', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText(/add.*(your first|a) card/i)).toBeInTheDocument();
  expect(screen.queryAllByRole('article')).toHaveLength(0); // no cards
});
```

---

### U1.5 — Session restored: banner shown

**AC:** AC4
**Precondition:** `localStorage.setItem('iem-session', JSON.stringify({ cards: [{ id: '1', name: 'Test Card', impact: 0.8, effort: 0.3 }], transcript: [], segmentLinks: [] }))` set before render.
**Action:** Render `<App />`.
**Expected:** A banner element confirming session restoration is visible (text contains "restored" or equivalent).

```javascript
test('shows session-restored banner when prior session present', () => {
  localStorage.setItem('iem-session', JSON.stringify({
    cards: [{ id: '1', name: 'Test Card', impact: 0.8, effort: 0.3 }],
    transcript: [],
    segmentLinks: []
  }));
  render(<App />);
  expect(screen.getByText(/session.*restored|restored.*session/i)).toBeInTheDocument();
});
```

---

### U1.6 — Session restored: prior cards rendered

**AC:** AC4
**Precondition:** Same as U1.5 — localStorage contains one card named "Test Card".
**Action:** Render `<App />`.
**Expected:** "Test Card" is visible on the canvas.

```javascript
test('renders prior cards from localStorage on load', () => {
  localStorage.setItem('iem-session', JSON.stringify({
    cards: [{ id: '1', name: 'Test Card', impact: 0.8, effort: 0.3 }],
    transcript: [],
    segmentLinks: []
  }));
  render(<App />);
  expect(screen.getByText('Test Card')).toBeInTheDocument();
});
```

---

## Integration tests

No integration seams in iem.1 — this story renders a static shell with localStorage read. The localStorage integration is covered by U1.5 and U1.6 (which test the actual browser API via jsdom's localStorage mock).

---

## NFR tests

NFRs: None — confirmed. No NFR tests written.

---

## Gap table

No gaps. All ACs are verifiable in Vitest + React Testing Library.
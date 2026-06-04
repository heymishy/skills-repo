## Test Plan: Restructure right panel into two named sections for assumption cards and artefact draft coexistence

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Both #assumption-cards and #draft-content present in DOM | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | #assumption-cards shows placeholder when empty | 1 test | — | — | — | — | 🟢 |
| AC3 | #draft-content shows placeholder and is present | 1 test | — | — | — | — | 🟢 |
| AC4 | #assumption-cards max-height 42%; #draft-content fills remaining space | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC5 | Keyboard: both sections reachable; AT announces section boundaries | — | — | — | 1 scenario | DOM-behaviour | 🟡 |
| NFR-A11Y | WCAG AA: keyboard-reachable; section boundaries announced | — | 1 test | — | 1 scenario | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| #assumption-cards max-height 42% enforced by CSS | AC4 | CSS-layout-dependent | `getComputedStyle`/`getBoundingClientRect` return 0 in jsdom | Playwright E2E test in real browser 🟡 |
| Screen reader section boundary announcement | AC5 | DOM-behaviour | Requires real AT to confirm announcement | Manual scenario in verification script 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — no external data; test setup renders the session shell HTML
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Rendered session shell HTML | Synthetic | None | |
| AC2 | Rendered shell HTML with zero assumption cards | Synthetic | None | |
| AC3 | Rendered shell HTML with no draft content | Synthetic | None | |
| AC4 | Real browser rendering of right panel | Playwright | None | Measures actual CSS layout |
| AC5 | Running application with keyboard focus | Manual | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### session shell HTML contains #assumption-cards element

- **Verifies:** AC1
- **Precondition:** The session shell HTML generator is called (or its output inspected)
- **Action:** Call `handleGetChatHtml` (or the equivalent view builder) with a minimal mock session; extract the returned HTML string
- **Expected result:** The HTML string contains an element with `id="assumption-cards"`
- **Edge case:** No

### session shell HTML contains #draft-content element

- **Verifies:** AC1
- **Precondition:** Same as above
- **Action:** Same as above
- **Expected result:** The HTML string contains an element with `id="draft-content"`
- **Edge case:** No

### #assumption-cards shows placeholder when no cards are present

- **Verifies:** AC2
- **Precondition:** Session shell rendered with empty assumption cards state
- **Action:** Inspect the `#assumption-cards` inner content when no cards have been emitted
- **Expected result:** The element contains a visible placeholder text (e.g. "assumptions will appear here"); the element is not hidden, `display:none`, or removed from the DOM
- **Edge case:** No

### #draft-content shows placeholder and has flex:1 class or style

- **Verifies:** AC3
- **Precondition:** Session shell rendered with no draft content
- **Action:** Inspect `#draft-content` inner content and check its inline styles or class
- **Expected result:** The element contains a placeholder message (e.g. "artefact draft will appear here"); the element has `flex: 1` as an inline style or via a CSS class applied at render time
- **Edge case:** No

---

## Integration Tests

### handleGetChatHtml includes both named sections in output

- **Verifies:** AC1
- **Components involved:** `handleGetChatHtml` route handler, right panel HTML template
- **Precondition:** A minimal mock request/session is passed to the handler
- **Action:** Call the handler and capture the full HTML output
- **Expected result:** The output contains both `id="assumption-cards"` and `id="draft-content"` as sibling elements within a flex-column container

### axe-core scan on right panel sections passes WCAG AA

- **Verifies:** NFR-A11Y
- **Components involved:** axe-core, rendered HTML
- **Precondition:** The right panel HTML with both sections is rendered as a string; axe-core is run in Node.js using `axe-core/axe` or equivalent
- **Action:** Run `axe.run` on the right panel HTML fragment
- **Expected result:** Zero WCAG AA violations; in particular, `region` and `name-role-value` rules pass for both sections

---

## NFR Tests

### right panel sections are keyboard-reachable (structural check)

- **NFR addressed:** Accessibility
- **Measurement method:** Inspect the rendered HTML — assert that both `#assumption-cards` and `#draft-content` are not marked `aria-hidden="true"` and have a role or heading that would expose them to the accessibility tree
- **Pass threshold:** Neither section has `aria-hidden="true"`; each has a `role` or `aria-label` or heading
- **Tool:** Node.js DOM string inspection

---

## E2E Tests (Playwright)

### #assumption-cards does not exceed 42% of right panel height and scrolls internally

- **Verifies:** AC4
- **Precondition:** A running server (`node --env-file=.env src/web-ui/server.js`); Playwright browser launched; an /ideate session page loaded with `#assumption-cards` populated with enough cards to overflow
- **Action:** Use `page.evaluate()` to call `getBoundingClientRect()` on `#assumption-cards` and its parent right panel; compare heights; scroll the panel to confirm internal scroll
- **Expected result:** `assumptionCardsHeight / rightPanelHeight <= 0.42`; the element has `overflow-y: auto` or `overflow-y: scroll` and scrolls when cards overflow without affecting `#draft-content`
- **Test file:** `tests/e2e/iwu2-right-panel-layout.spec.js`

---

## Out of Scope for This Test Plan

- Populating #assumption-cards with real card content — iwu.3
- Populating #draft-content with SSE-driven content — iwu.5
- Context manifest chip layout — iwu.1 (left panel)
- Lens track topbar indicator — deferred to post-MVP

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Actual CSS 42% max-height enforcement | jsdom does not compute CSS layout | Playwright E2E test in real browser |
| Screen reader announcement of section boundaries | Requires real AT | Manual verification scenario; axe-core reduces risk |

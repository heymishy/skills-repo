## Test Plan: Remove dead nav links and add the missing Org board and Home List/Board toggle

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b1-remove-dead-links-add-missing-nav.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-b-navigation-fix.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Features/Actions/Status entries removed | 1 | — | — | — | — | 🟢 |
| AC2 | List/Board toggle present under Home | — | — | 1 | — | — | 🟢 |
| AC3 | Org board nav item present | 1 | — | — | — | — | 🟢 |
| AC4 | Every remaining nav item resolves to a real route | 1 | 1 | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Synthetic — the `NAV_ITEMS` array itself is the test subject; no external data needed.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC4 | The `NAV_ITEMS` array and `server.js`'s route dispatch table | Real source files, read directly by the test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### NAV_ITEMS no longer contains Features, Actions, or Status
- **Verifies:** AC1
- **Precondition:** N/A — reads the real `NAV_ITEMS` array from `html-shell.js`
- **Action:** Assert none of the three `id`s exist in the array
- **Expected result:** `NAV_ITEMS.find(i => i.id === 'features')` etc. all return `undefined`

### NAV_ITEMS contains an Org board entry pointing to /org/kanban
- **Verifies:** AC3
- **Precondition:** N/A
- **Action:** Assert an entry with `href: '/org/kanban'` exists
- **Expected result:** Found, matches

---

## Integration Tests

### Every NAV_ITEMS href resolves to a route registered in server.js
- **Verifies:** AC4
- **Components involved:** `NAV_ITEMS`, `server.js`'s route dispatch chain (read as source text and pattern-matched, matching this repo's own established dangling-reference-sweep convention from `kbc-s1`'s AC5)
- **Precondition:** N/A
- **Action:** For each `NAV_ITEMS` entry, confirm its href (or href's path portion, ignoring query strings) appears as a registered `pathname ===` or `pathname.match(...)` check in `server.js`
- **Expected result:** 100% resolve; zero dangling entries

### Running this test against the CURRENT (pre-fix) NAV_ITEMS confirms it catches the real bug
- **Verifies:** AC4 (test validity, not the story's own behaviour)
- **Components involved:** Same test, run against a snapshot of the pre-fix array (containing Features/Actions/Status)
- **Precondition:** A fixture copy of the old array
- **Action:** Run the same resolution check
- **Expected result:** FAILS — confirming this test would have caught the original `kbc-s1` gap, not just passing trivially against whatever shape it's given

---

## E2E Tests

### List/Board toggle switches views without a full nav-item click
- **Verifies:** AC2
- **Tool:** Playwright
- **Precondition:** Signed-in session, dev server running
- **Action:** Click the "Board" toggle under Home
- **Expected result:** URL changes to include `?view=board`; the board layout renders

---

## NFR Tests

None — confirmed with story owner. This is a static configuration change with no runtime performance or security surface beyond what AC4's structural test already covers.

---

## Out of Scope for This Test Plan

- Rendering of `/org/kanban` or `/dashboard?view=board` themselves — already covered by `kbc-s1`'s own test suite.

## Test Gaps and Risks

None.

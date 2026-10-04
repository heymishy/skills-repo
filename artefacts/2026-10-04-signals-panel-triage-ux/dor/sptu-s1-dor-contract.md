# Contract Proposal: Add `/signals` to the main navigation

**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Date:** 2026-10-04

---

## What will be built

- One new entry added to `NAV_ITEMS` in `src/web-ui/utils/html-shell.js:54-78`: `{ id: 'signals', label: 'Signals', href: '/signals', icon: '◎' }`, placed in the main product nav section (not `section: 'account'`), positioned after the `pod-manager` entry.
- New test file `tests/check-sptu-s1-signals-nav.js` (4 tests per the test plan).

## What will NOT be built

- No change to `handleGetSignalsPanelHtml` or any other route logic — the `active: 'signals'` value it already passes is reused as-is.
- No unread/count badge on the nav row.
- No icon/branding exploration beyond picking one single-character glyph consistent with existing entries.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — nav row renders | `renderSidebar` unit test asserting `href="/signals"` and visible "Signals" text in the main section | unit |
| AC2 — active state on `/signals` | `renderSidebar` unit test asserting `sw-nav-item--active` on the Signals row only, when `active='signals'` | unit |
| AC3 — no regression | Reuse of `check-b2-account-nav.js`'s own existing `"AC3: zero dangling NAV_ITEMS entries"` logic against the post-change array | unit |
| AC4 — keyboard-accessible | Unit test asserting no `tabindex` override on the new `<a>` element | unit |

## Assumptions

- `handleGetSignalsPanelHtml` (`signals-panel.js:39`) already passes `active: 'signals'` to `renderShell` — confirmed directly in code, not assumed.
- `/signals` is already a registered route in `server.js:3065` — confirmed directly, so the existing dangling-link regression test passes without modification.

## Estimated touch points

**Files:** `src/web-ui/utils/html-shell.js` (modified — one array entry added), `tests/check-sptu-s1-signals-nav.js` (new)
**Services:** none
**APIs:** none — reuses the existing, already-registered `GET /signals` route

---

## Contract Review

Cross-checked against the story's own 4 ACs and the test plan's AC Coverage table — every AC maps to a specific test, matching the test plan exactly. No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.

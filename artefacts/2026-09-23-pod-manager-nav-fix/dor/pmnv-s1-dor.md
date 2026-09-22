## Definition of Ready: pmnv-s1 — Add Pod Manager to the sidebar nav

**Story:** artefacts/2026-09-23-pod-manager-nav-fix/stories/pmnv-s1-pod-manager-nav-entry.md
**Test plan:** artefacts/2026-09-23-pod-manager-nav-fix/test-plans/pmnv-s1-test-plan.md
**Date:** 2026-09-23

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `src/web-ui/utils/html-shell.js` — add one entry to the `NAV_ITEMS` array: `{ id: 'pod-manager', label: 'Pod Manager', href: '/admin/pods/manager', icon: '⬡' }`, positioned in the main (non-account) section, immediately after the existing `org-kanban` entry. No `section: 'account'` tag (main section, not account-settings), no `adminOnly` flag (matches the real route's `authGuard`-only access level).
- New: `tests/check-pmnv-s1-pod-manager-nav-entry.js`.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/routes/pods.js`, `src/web-ui/public/pod-manager.html`, `src/web-ui/modules/pod-store.js` — the route/handler/page/data layer is unmodified; this story only adds a link pointing at it.
- `ORG_ROSTER`'s hardcoded-fixture nature — a separate, larger concern requiring its own `/discovery` pass (logged in `workspace/capture-log.md`, 2026-09-23), not this story.
- Any `ep4-s1` file (`src/web-ui/routes/products.js`'s pod-assignment handlers/UI) — unaffected, separate feature.
- Any restructuring of `renderSidebar`'s section logic beyond the one new array entry.

### Architecture Constraints

No new architectural decision — mirrors the already-proven `b2` (`admin-mock-gateway`) and `alrf-s7` `NAV_ITEMS`-addition pattern for a route that shipped with no nav entry. No ADR required.

### Human oversight

**Low** — a single-array-entry addition mirroring an already-proven pattern, touching one file, with an existing regression test (`check-b2-account-nav.js`) that automatically covers the new entry with no modification needed.

### Coding Agent Instructions

1. Read `src/web-ui/utils/html-shell.js`'s `NAV_ITEMS` array (around line 54) and the comments immediately above/around it (the `b2`/`pan-s1` comments) for the established convention before editing.
2. Add the new entry exactly as specified in the Scope Contract above — main section, no `adminOnly`, positioned after `org-kanban`.
3. Write `tests/check-pmnv-s1-pod-manager-nav-entry.js` per the test plan's 2 unit tests (nav-item-present, nav-item-shape-correct) — follow `tests/check-b2-account-nav.js`'s own `freshRequire`/`test()`/assert conventions exactly (same file, same helpers, matching style).
4. Run the new test file: expect 2/2 passing.
5. Re-run `tests/check-b2-account-nav.js` unmodified: expect all its existing checks still passing (AC4) — this confirms zero dangling links from the new entry.
6. Run the full suite (`npm test`): expect no new failures beyond the pre-existing, unrelated `tests/check-p3.5-validate-trace.js`.
7. After merge: live-verify via Chrome on `wuce-staging.fly.dev` — confirm "Pod Manager" appears in the sidebar for both an admin and non-admin session, and clicking it lands on the real, already-working Pod Manager page. This is this story's own completion criterion (matches the AC verification script's own scenario).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified — all ACs are server-rendered-HTML string/array-shape assertions (nav item presence, href, adminOnly flag), not visual/layout-dependent. The live-Chrome step above is a functional smoke check, not a required CSS-layout AC classification.

**PROCEED: Yes**

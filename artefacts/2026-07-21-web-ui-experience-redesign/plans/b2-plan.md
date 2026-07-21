# Implementation Plan: Restructure account-level nav items and add a dangling-link regression test (b2)

**Story:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md`
**DoR:** `artefacts/2026-07-21-web-ui-experience-redesign/dor/b2-dor.md` (Proceed: Yes)
**Test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b2-test-plan.md`
**Depends on:** B1 (merged, PR #523) and C1 (merged, PR #521)

## Loaded

Story title: Restructure account-level nav items and add a dangling-link regression test
ACs: 4 | Tests: 5 (test plan) | Architecture constraint: Admin-only visibility (`Admin credits`) must be gated the same way the route itself already is — via the live `requireAdmin` role check, not a client-side-only toggle.

## File map

| File | Change |
|------|--------|
| `src/web-ui/utils/html-shell.js` | Add `Settings` + `Admin credits` entries to `NAV_ITEMS` with a `section: 'account'` tag. `renderSidebar` gains an `isAdmin` param and renders a visually distinct account-nav block (border-top divider, pushed to sidebar bottom next to the identity block) filtering `adminOnly` items. `renderShell` gains `opts.isAdmin`, passed through. New CSS rule `.sw-nav-account`. |
| `src/web-ui/routes/dashboard.js` | Compute `isAdmin` from `req.session.role === 'admin'` (same pattern C1's `settings.js` already uses) and pass to `renderShell`. |
| `src/web-ui/routes/settings.js` | Pass the `isAdmin` it already computes through to its own `renderShell` call (currently computed but not forwarded). |
| `tests/check-b2-account-nav.js` (new) | AC1–AC4 + NFR tests, following `tests/check-b1-nav-fix.js` / `tests/check-sec-perf-s2-stale-role-revalidation.js` conventions (hand-rolled `test()`/`assert`, no Jest). |

**Scope note (contract/AC conflict, documented per CLAUDE.md's "DoR contract must not contradict the test plan" rule):** the DoR contract's estimated touch points list only `html-shell.js`. AC2 (live role-check gating) cannot be demonstrated as real, wired behaviour with zero call-site changes, so `dashboard.js` and `settings.js` are also touched — the minimum necessary to have one genuinely correct, reachable production page (Home) plus the Settings page itself. Other pages that call `renderShell` (`journey.js`, `skills.js`, `products.js`, `features.js`, `artefact.js`) are **not** wired to pass `isAdmin` in this story — they will default to non-admin display (Settings shows, Admin credits does not). This is a deliberate, narrow scope boundary consistent with the epic's own "one shared file, low blast radius" framing and the Coding Agent Instructions' "do not add scope beyond the ACs/tests." Logged as a follow-up, not a silent gap.

## Tasks

### Task 1 — RED: write failing tests for AC1/AC2 (non-admin/admin sidebar rendering)
File: `tests/check-b2-account-nav.js`
Write tests asserting `renderSidebar`/`renderShell` output contains "Settings" + identity block always, and "Admin credits" only when `isAdmin` is true. Run — expect failures (Settings/Admin credits don't exist yet).

### Task 2 — GREEN: add NAV_ITEMS account entries + isAdmin-gated rendering
File: `src/web-ui/utils/html-shell.js`
Add `section: 'account'` entries for Settings/Admin credits to `NAV_ITEMS`; update `renderSidebar(active, login, isAdmin)` to split product vs account items and render the account block; update `renderShell` to accept/pass `opts.isAdmin`. Re-run Task 1 tests — expect pass.

### Task 3 — RED then GREEN: AC2 integration test (live role re-check, not stale cache)
File: `tests/check-b2-account-nav.js`
Test wires `require-admin.js`'s `setGetCurrentRole` to simulate a DB-revoked admin, drives `requireAdmin` to self-heal `req.session.role`, then renders the sidebar with the corrected value and confirms Admin credits is absent. No production code change needed here (already satisfied by task 2 + existing `require-admin.js` self-heal) — this task proves it behaviourally.

### Task 4 — AC3/AC4: dangling-link regression test + validity check
File: `tests/check-b2-account-nav.js`
Mirror `check-b1-nav-fix.js`'s `pathRegisteredInServer` resolution check (kept local rather than extracted into a shared helper, to avoid touching b1's already-merged test file) against the real `NAV_ITEMS` (AC3) and against a fixture pre-fix array containing Features/Actions/Status (AC4), confirming the fixture fails.

### Task 5 — NFR: nav visibility is not the security boundary
File: `tests/check-b2-account-nav.js`
Test calls `requireAdmin` directly with a non-admin session (bypassing any nav/UI state) and confirms 403 — cross-referencing existing coverage in `check-arl-s2-admin-middleware.js` / `check-sec-perf-s2-stale-role-revalidation.js` rather than duplicating their full suite.

### Task 6 — Wire isAdmin into dashboard.js and settings.js
Files: `src/web-ui/routes/dashboard.js`, `src/web-ui/routes/settings.js`
One-line additions computing/forwarding `isAdmin`. No new tests required beyond Task 1–2 (which already exercise the underlying render function); a smoke check confirms no syntax regressions via full suite run.

### Task 7 — Full suite + verification
Run `npm test`. Walk the AC verification script. Confirm zero regressions vs baseline.

## Self-review

- [x] Exact file paths
- [x] Complete code will be written directly (see implementation, not left as placeholders)
- [x] Failing test before implementation (Task 1 before Task 2; Task 3 written test-first)
- [x] Expected output stated per run
- [x] Commit messages imperative mood
- [x] No scope beyond the ACs (scope note above documents the one necessary, narrow expansion beyond the DoR contract's file list, justified by AC2 itself)

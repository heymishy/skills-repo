# AC Verification Script: Auto-resolve the single-AC capture target (actr-s2)

**Audience:** Product owner / domain expert — pre-code sign-off, post-merge smoke test, delivery review.
**Setup:** Open the Playback evidence page for a story whose own `test-plan.md` names a real, existing E2E spec file covering the AC you're checking. You will need a product owner login for a tenant connected to this repo.

**Updated at /verify-completion (2026-10-29):** `ppc-s6`'s own named spec file (`tests/e2e/ppc-s6-responsive-summary.spec.js`) was never actually created (confirmed during the 2026-10-27 trace run) — it is not a usable live example for Scenarios 1/2/3/6 below. No real journey anywhere in this environment currently has a qualifying fixture; this gap is logged as a RISK-ACCEPT in `decisions.md` (2026-10-29) with a follow-up action, not fixed as part of this story. All scenarios below are fully confirmed by this story's own automated route-level test suite (`tests/check-actr-s2-auto-resolve-single-ac.js`, 21/21 passing — real handler code producing real HTML, not a browser simulation); use this script for a real walkthrough once a genuinely qualifying journey exists.

## Scenario 1 (AC1) — The capture target fills itself in

1. Navigate to the Playback evidence page for an AC that has merged E2E coverage and has never had a capture target set manually.
2. Check: instead of the usual "Enter a URL and CSS selector" form, you see a box reading something like "Auto-detected from `tests/e2e/...spec.js`" showing a URL and a CSS selector.
3. Expected result: no typing required — the values are already shown, read-only.

## Scenario 2 (AC2) — Capturing with the auto-filled values actually works

1. On the same AC, click "Trigger capture" without typing anything.
2. Check: the capture dispatches normally (same "capture in progress" behaviour you'd see after a manual entry today).
3. Expected result: the capture uses the auto-detected address and selector — you do not need to have typed them first.

## Scenario 3 (AC3) — Your own manual entry always wins

1. On an AC that shows an auto-detected target, click "Override" and type in a different URL and selector, then submit.
2. Reload the page.
3. Check: the page now shows YOUR typed values, not the auto-detected ones.
4. Expected result: once you've set something yourself, the system never silently goes back to guessing — your entry sticks.

## Scenario 4 (AC4) — ACs with no test coverage behave exactly as before

1. Navigate to an AC that has no E2E test coverage at all (check the story's own test plan if unsure).
2. Check: you see the normal "Enter a URL and CSS selector" form — unchanged from today.
3. Expected result: no "auto-detected" box appears for an AC the system genuinely has no spec-derived answer for.

## Scenario 5 (AC5) — A detection problem never breaks the page

1. 🔴 This scenario requires a temporarily broken repo connection or a deliberately corrupted test-plan reference — ask engineering to simulate this (e.g. temporarily rename a referenced spec file) if you want to run this yourself; otherwise this is confirmed by the automated test suite (`rendersSuccessfullyOnTestPlanFetchFailure`, `rendersSuccessfullyOnSpecFetchFailure`) and should be spot-checked in the post-merge smoke test only if a real detection failure is observed in production.
2. Expected result: even if auto-detection cannot find an answer or hits an error, the page loads normally and shows the ordinary manual-entry form — it never shows a broken page.

## Scenario 6 (AC6) — Override control round-trips correctly

1. Repeat Scenario 3's steps on a fresh AC that currently shows an auto-detected target.
2. Click "Override", type a new URL/selector, submit, then reload.
3. Check: the page shows your override, not the original auto-detected values, and clicking "Trigger capture" uses your override.
4. Expected result: identical to Scenario 3 — this scenario exists to confirm the override control itself (not just the stored result) works end to end.

## Reset instructions

Scenarios 3 and 6 both set a manual override on an AC — if you want to re-test Scenario 1's "nothing set yet" state afterwards, ask engineering to clear that AC's manual target in the test tenant before re-running.

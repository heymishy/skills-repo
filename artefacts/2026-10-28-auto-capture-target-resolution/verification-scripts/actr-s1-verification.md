# AC Verification Script: Derive capture target from E2E spec (actr-s1)

**Audience:** Product owner / domain expert — pre-code sign-off and post-merge smoke test.
**Setup:** None required — this story has no UI. Verification is done by running one command and reading its output.

**Updated at /verify-completion (2026-10-28):** the original scenarios named test titles from before implementation and did not cover AC2b or the two security fixes found during review (a tab-obscured and a backslash-obscured protocol-relative URL, both of which would have let a crafted test file redirect a real browser session to an attacker's site). Rewritten to match the real, committed test suite.

## Scenario 1 (AC1) — Selector detection still works the same as before

1. Run `node tests/check-actr-s1-capture-target-derivation.js`.
2. Check: the test "AC1 (unit): derives the selector correctly" shows PASS.
3. Expected result: the tool correctly reads the CSS selector out of a sample test file, exactly as it already does today for the selector-only case.

## Scenario 2 (AC2) — URL detection, new capability

1. Same command as Scenario 1.
2. Check: the tests "AC2 (unit): derives url from a goto call appearing after the AC tag" and "AC2 (real-file): resolves both url and selector from the real fpd-s4-caption-sync.spec.js" both show PASS.
3. Expected result: given a sample test file that visits a page and then checks something on that page, the tool correctly identifies that page's address as the one to capture — confirmed against both a constructed example and a real file already in this repo.

## Scenario 3 (AC2b) — Doesn't borrow the wrong AC's address or element when a file covers several

1. Same command.
2. Check: the tests "AC2b (unit): bounds the scan so a later AC's goto never leaks into an earlier AC that has none of its own" and "AC2b (unit, selector mirror): bounds the scan so a later AC's locator never leaks into an earlier AC that has none of its own" both show PASS.
3. Expected result: when one file covers two different acceptance criteria, the tool never mixes up which address or which on-page element belongs to which criterion.

## Scenario 4 (AC3) — Safety check: never trust an external web address

1. Same command.
2. Check: all 4 of these show PASS — "AC3 (unit): rejects an absolute goto URL", "AC3 (unit): rejects a protocol-relative goto URL", "AC3 (unit, security regression): rejects a tab-obscured protocol-relative goto URL", "AC3 (unit, security regression): rejects a backslash-obscured protocol-relative goto URL".
3. Expected result: if a sample test file happens to visit a different website entirely — including two disguised forms of this found during review, one hidden behind an invisible character and one hidden behind a backslash — the tool refuses to use that address. This matters because a wrong address here could later be opened by a real, logged-in browser session, handing that session to whoever controls the other site.

## Scenario 5 (AC4) — Nothing found, no crash

1. Same command.
2. Check: the test "AC4 (unit): returns null when the spec file does not name the AC at all" shows PASS.
3. Expected result: if the acceptance criterion isn't mentioned in any test file at all, the tool just says "nothing found" — it does not crash or produce an error.

## Scenario 6 (AC5) — Nothing breaks for the existing feature

1. Run `node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (the pre-existing test file this story builds on).
2. Check: every test in that file still shows PASS (8 of 8).
3. Expected result: moving this logic to its new shared location does not break anything that already worked.

## Reset instructions

None needed — every scenario is a read-only test run; no shared state between scenarios.

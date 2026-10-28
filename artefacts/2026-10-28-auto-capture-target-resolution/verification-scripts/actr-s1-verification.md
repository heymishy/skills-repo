# AC Verification Script: Derive capture target from E2E spec (actr-s1)

**Audience:** Product owner / domain expert — pre-code sign-off and post-merge smoke test.
**Setup:** None required — this story has no UI. Verification is done by running one command and reading its output.

## Scenario 1 (AC1) — Selector detection still works the same as before

1. Run `node scripts/run-all-tests.js tests/check-actr-s1-capture-target-derivation.js` (new test file).
2. Check: the test named "derivesSelectorMatchingExistingBehaviour" shows PASS.
3. Expected result: the tool correctly reads the CSS selector out of a sample test file, exactly as it already does today for the selector-only case.

## Scenario 2 (AC2) — URL detection, new capability

1. Same command as Scenario 1.
2. Check: the test named "derivesUrlFromPrecedingGoto" shows PASS.
3. Expected result: given a sample test file that visits a page (`/playback/actr-fixture`) and then checks something on that page, the tool correctly identifies `/playback/actr-fixture` as the page to capture.

## Scenario 3 (AC3) — Safety check: never trust an external web address

1. Same command.
2. Check: the tests named "rejectsAbsoluteGotoUrl" and "rejectsProtocolRelativeGotoUrl" both show PASS.
3. Expected result: if a sample test file happens to visit a different website entirely (e.g. `https://evil.example.com`), the tool refuses to use that address — it returns "no address found" rather than trusting it. This matters because a wrong address here could later be opened by a real, logged-in browser session.

## Scenario 4 (AC4) — Nothing found, no crash

1. Same command.
2. Check: the test named "returnsNullForUnmatchedAc" shows PASS.
3. Expected result: if the acceptance criterion isn't mentioned in any test file at all, the tool just says "nothing found" — it does not crash or produce an error.

## Scenario 5 (AC5) — Nothing breaks for the existing feature

1. Run `node scripts/run-all-tests.js tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (the pre-existing test file this story builds on).
2. Check: every test in that file still shows PASS.
3. Expected result: moving this logic to its new shared location does not break anything that already worked.

## Reset instructions

None needed — every scenario is a read-only test run; no shared state between scenarios.

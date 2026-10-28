# AC Verification Script: Extend bulk "Capture all" to include auto-resolved targets (actr-s3)

**Audience:** Product owner / domain expert — pre-code sign-off, post-merge smoke test, delivery review.
**Setup:** A feature with at least 3 ACs: one with a manual target already set, one with merged E2E coverage but no manual target, one with neither.

## Scenario 1 (AC1) — "Capture all" picks up auto-detected ACs too

1. Click "Capture all evidence" for the feature described in Setup.
2. Check: the capture run includes the manually-targeted AC AND the auto-detected AC — only the AC with neither is skipped.
3. Expected result: you no longer have to manually set a target just to get an AC included in a bulk run.

## Scenario 2 (AC2) — Your manual entry still wins inside a bulk run

1. On an AC that has both a manual target and E2E coverage that would otherwise auto-detect something different, run "Capture all".
2. Check: that AC's capture uses your manually-entered address/selector, not the auto-detected one.
3. Expected result: consistent with the single-AC behaviour (`actr-s2`) — manual always wins, even in a bulk run.

## Scenario 3 (AC3) — Each AC captures against its own correct page

1. Run "Capture all" on the Setup feature.
2. Once captures complete, open each AC's resulting screenshot/video.
3. Expected result: each AC's evidence shows the correct page for THAT AC — not one AC's evidence accidentally using another AC's address.

## Scenario 4 (AC4) — A detection problem for one AC doesn't block the others

1. 🔴 This scenario requires a simulated detection failure (e.g. a temporarily broken spec reference) — ask engineering to set this up, or confirm via the automated test suite (`skipsAcOnAutoResolutionFailureWithoutErroring`) if not reproducible manually.
2. Expected result: the one affected AC is skipped (same as an AC with no target at all today); every other AC in the run still completes normally. No error page.

## Scenario 5 (AC5) — The progress count is accurate

1. Run "Capture all" on the Setup feature (3 ACs, 2 of which will be included).
2. While the run is in progress, check the progress indicator.
3. Expected result: the progress indicator's total reflects 2 (the real number of ACs actually being captured), not just the count of ACs that had a manual target before this story shipped.

## Reset instructions

None needed beyond Setup — each scenario reads the same fixture feature; re-running "Capture all" is idempotent (matches today's existing behaviour).

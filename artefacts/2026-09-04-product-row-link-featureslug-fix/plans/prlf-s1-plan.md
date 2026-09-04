# Implementation Plan: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Story reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**DoR contract:** artefacts/2026-09-04-product-row-link-featureslug-fix/dor/prlf-s1-dor-contract.md
**Worktree:** .worktrees/prlf-s1 (branch `feature/prlf-s1`)
**Baseline:** 606 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: featureSlug in row links (AC1–AC3)

**Sub-steps, in TDD order:**
1. Write `tests/check-prlf-s1-featureslug-row-links.js` (RED) — 3 tests covering AC1–AC3, calling the already-exported `_renderPvcItemRow` directly.
2. Fix `_renderPvcItemRow` (`src/web-ui/routes/products.js`) — `href` uses `item.featureSlug || item.slug`.
3. Confirm GREEN (new tests + `check-ppg-s1-decouple-modules-gate.js` + `check-pefl-s1-feature-name-not-epic-name.js` + `check-fal-s1-artefact-lookup-epic-nested-fix.js` regression guards).
4. Full-suite run surfaced a real, expected downstream break in `check-shb-s1-story-health-badge-fix.js`: its own test helper located a row by matching `href="/features/<storySlug>"`, which this fix intentionally makes untrue for epic-nested items. Fixed the test's own helper to anchor on `data-search` instead (unaffected by this fix, still carries the raw story slug) — not a silent workaround, all 5 of that test's own assertions (AC1–AC4 of `shb-s1`) still pass and verify the same real behaviour.

**Files touched:**
- `src/web-ui/routes/products.js`
- `tests/check-prlf-s1-featureslug-row-links.js` (new)
- `tests/check-shb-s1-story-health-badge-fix.js` (test-helper fix, not scope creep — required by this story's own intentional behaviour change)

**TDD verification performed:** before committing, the fix was temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed AC1/AC3 fail with exactly the raw story slug instead of the resolved feature slug, while AC2's regression guard correctly passes either way.

**Status:** Complete. Committed as `80837524` on `feature/prlf-s1`.

---

## Verification

- New test file: 3/3 passing.
- `tests/check-ppg-s1-decouple-modules-gate.js` (regression guard): 7/7 passing, unmodified.
- `tests/check-pefl-s1-feature-name-not-epic-name.js` (regression guard): 6/6 passing, unmodified.
- `tests/check-fal-s1-artefact-lookup-epic-nested-fix.js` (regression guard): 5/5 passing, unmodified.
- `tests/check-shb-s1-story-health-badge-fix.js`: 5/5 passing after fixing its own test helper (required, not a regression left unaddressed).
- Full suite: 606 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures.

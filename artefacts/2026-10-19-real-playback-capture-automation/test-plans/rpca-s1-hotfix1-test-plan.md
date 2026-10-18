## Test Plan: rpca-s1-hotfix1 — path-traversal guard on the capture CLI's own feature-slug argument

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — not a full discovery→definition story. Found at `/definition-of-done` for `rpca-s1`: the CLI's own `featureSlug` argument (`process.argv[2]`) flows directly into `buildScreenshotPath` with no validation, deviating from the NFR `rpca-s1`'s own NFR profile committed to (the existing path-traversal guard convention in `.github/standards/web-ui/web-ui-patterns.md`).
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A feature-slug argument containing `../` is rejected before any file write is attempted | 1 test | — | — | — | — | 🟢 |
| AC2 | A legitimate feature-slug argument is unaffected — still resolves to the expected path | 1 test | — | — | — | — | 🟢 |

No gaps. Pure local logic, no real secret/network needed.

## Test Data Strategy

**Source:** Synthetic | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: a traversal attempt in the feature slug is rejected

- **Verifies:** AC1
- **Action:** Call the path-construction/guard logic with `featureSlug = '../../etc/passwd'`
- **Expected result:** Throws an error naming the problem (e.g. "feature slug resolves outside the repo root") — does not return a path, does not attempt any write

### AC2: a legitimate feature slug still resolves correctly

- **Verifies:** AC2
- **Action:** Call the same logic with a real-shaped slug, e.g. `2026-10-11-journey-cx-redesign`
- **Expected result:** Returns the same path `buildScreenshotPath` already produced before this fix — no behavioural change for legitimate input

## Out of Scope

- Validating `storySlug`/`acId` — these are not CLI-supplied arguments in `rpca-s1`'s own scope (hardcoded), only `featureSlug` comes from `argv`.

## Test Gaps and Risks

None.

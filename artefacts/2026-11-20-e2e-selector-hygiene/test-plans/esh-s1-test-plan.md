## Test Plan: Five E2E specs that fail on stale selectors and stale pinned colours check what they were written to check

**Story reference:** artefacts/2026-11-20-e2e-selector-hygiene/stories/esh-s1-stale-selectors-and-pinned-values.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json and playwright.config.js):** the specs are Playwright, outside the `npm test` chain. Run by hand with `NODE_ENV=test` and `E2E_LOCAL_SUITE=true`: `npx playwright test <files> --reporter=line`. The config starts the test-mode server itself. The code under test is the five spec files; there is no new check script.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `ep1-s3` passes on the visible Edit link | - | - | 1 (existing, repaired) | - | - | 🟢 |
| AC2 | `frsr-s1` both tests pass on the visible row link | - | - | 2 (existing, repaired) | - | - | 🟡 |
| AC3 | `jcx-s6` AC1 counts visible headers; other three still pass | - | - | 4 (existing, one repaired) | - | - | 🟢 |
| AC4 | `ep1-s4` three scenarios scoped to the seeded journey | - | - | 3 (existing, repaired) | - | - | 🟢 |
| AC5 | `fpux.1` AC2a and AC2b compare against resolved tokens | - | - | 3 (existing, two repaired) | - | - | 🟢 |
| AC6 | Each repaired spec can still fail | - | - | - | 1 (M1) | Needs deliberate breaks | 🟢 |
| AC7 | CI full E2E run: nine repaired tests pass, nothing else regresses | - | - | CI run | 1 (M2) | Needs the PR's CI run | 🟢 |
| AC8 | Changed files are the five specs and artefacts | - | - | - | 1 (M3) | Diff check | 🟢 |

The risk on AC2 is yellow because the keyboard-activation half of `frsr-s1` has never been run against the visible link. If it fails with a correct selector, that is a possible keyboard-accessibility defect, which is a finding to report, not a spec to loosen.

## Red-first plan

The nine tests fail before the change. Measured on 2026-11-20 on master `c05f5fb3d` with the test-mode server: `ep1-s4` scenarios 1, 2 and 3 (scenario 2: 8 matches where 0 expected; scenario 3: focus moves to the next dot because the first card is another journey's), `fpux.1` AC2a and AC2b, and `jcx-s6` AC1 (6 header cells, 3 hidden): 6 failed, 4 passed in that run. `ep1-s3` was run earlier the same day: it fails on the hidden first match and passed with `:visible` on a temporary copy. `frsr-s1` (two tests) was confirmed to take a hidden first match, but the `:visible` repair has not been run yet, so its result after the change is open (see the AC2 risk). After the change all nine are expected to pass.

## Tests (the specs are the tests; each repair)

- **AC1, `ep1-s3`:** the trigger is `page.locator('.sw-stage-edit:visible').first()` (visible match), everything else unchanged.
- **AC2, `frsr-s1`:** the link is `page.locator('a.pvc-item-link:visible').first()` in both tests, everything else unchanged.
- **AC3, `jcx-s6` AC1:** `headers` is `page.locator('.sw-cx-grid-cell--header:visible')`; the count of 3 and the left-to-right order assertions are unchanged. The other tests keep their selectors; they already pass.
- **AC4, `ep1-s4`:** `seedStage` already returns `{ journeyId, ... }`; each scenario builds its locator from `a[data-stage-nav][href*="/journey/" + journeyId + "/"]` (and, for scenarios 1 and 2, the label). Scenario 2 still expects count 0 for the later stage's link; scenario 3 still expects focus to stay on the single dot after ArrowRight and Enter to navigate to confirm-back.
- **AC5, `fpux.1`:** the expected `epicBg` is the resolved value of the page's `--surface` token for that theme and the expected `storyColor` the resolved `--ink`, each read by giving a temporary element `background-color: var(--surface)` or `color: var(--ink)` on the same document and reading its computed colour. AC2b keeps `expect(epicBg).not.toBe('rgb(255, 255, 255)')` and also asserts the dark `--ink` differs from the light one.

## Manual steps

- **M1 (AC6), deliberate breaks, local only, never committed:** (a) `ep1-s4` scenario 2: seed a `benefit-metric` stage for the same journey id and expect count 0, which must fail; (b) `fpux.1` AC2a: set the expected token to `--ink-2`, which must fail; (c) `jcx-s6` AC1: expect 4, which must fail; (d) `ep1-s3` and `frsr-s1`: point the selector at a nonexistent class, which must fail. Record each result in the DoD.
- **M2 (AC7):** on the pull request's `Playwright E2E smoke tests` run, read the `pw-report-json` artefact (or the job summary) and list the failing tests; compare with the last master run's list. Record both lists.
- **M3 (AC8):** `git diff --stat master...HEAD` lists only the five files and artefacts.
- **Local run:** the five files together, with the untracked-path snapshot taken before and the folders created removed after. Because the local tenant holds many leftover journeys, a pass here is the stronger check for AC4 than a pass on CI.

## Deliberate updates to existing tests

None: the five specs are the change.

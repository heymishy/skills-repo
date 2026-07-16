# Definition of Done: Fix the over-broad Stripe-key grep scope causing 3 NFR checks to false-positive in real CI

**PR:** https://github.com/heymishy/skills-repo/pull/486 | **Merged:** 2026-07-16
**Story:** artefacts/2026-07-16-ci-flake-grep-fix/stories/cfg-s1-scope-stripe-key-grep-checks.md
**Test plan:** artefacts/2026-07-16-ci-flake-grep-fix/test-plans/cfg-s1-scope-stripe-key-grep-checks-test-plan.md
**DoR artefact:** artefacts/2026-07-16-ci-flake-grep-fix/dor/cfg-s1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD, 2026-07-16, per operator decision to require DoD for all short-track stories going forward
**Date:** 2026-07-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `check-bri-s3.5-nfr-stripe-keys.js` check 3 passes under a real POSIX shell | ✅ | Grep scope narrowed to `src/`, `tests/e2e/fixtures/`, `playwright.config.js`, `.env.example`. Confirmed under Git Bash's `bash.exe` (forced explicitly via `execSync`'s shell option) that the narrowed grep returns zero matches. Confirmed on real CI: PR #486's "Lint, typecheck, test, build" check passed. | Real POSIX shell verification + real CI run | None |
| AC2 — `check-lab-s3.2-stripe-checkout.js` NFR1 passes | ✅ | Same scoping fix, same verification method. | Real POSIX shell verification + real CI run | None |
| AC3 — `check-lab-s3.4-stripe-webhook.js` NFR passes | ✅ | Same scoping fix, same verification method. | Real POSIX shell verification + real CI run | None |
| AC4 — Narrowed scope still catches a real violation | ✅ | Temporary fixture (`src/__cfg-s1-fixture.js` containing a fake `sk_live_`-prefixed string) staged via `git add`, confirmed the check correctly failed and reported the match; fixture then removed and unstaged, confirmed the check passes again. | Direct fixture test under a real POSIX shell | None |
| AC5 — Full suite shows no new regressions, baseline refreshed | ✅ | Full suite run twice; `ci-test-regression-check.js` confirmed zero unaccounted regressions both times. One real consequence found and fixed along the way: `tst-s1`'s own meta-test hardcoded an assumption that all 5 of its "restore, still failing" files remain in the baseline — updated to reflect that 3 are now genuinely fixed here. | `scripts/ci-test-regression-check.js`, two full-suite runs | A necessary, in-scope follow-on fix to `tst-s1`'s meta-test/triage-report, not scope creep — a direct consequence of this story's own fix. |

## Scope Deviations

None from the story's own defined scope. `tests/run-gpa-tests.js` and `tests/check-gpa-sc06-source-path-guard.js` were explicitly investigated and explicitly left unresolved, as the story's own Out of Scope section states — no similar defect found on inspection; leading unconfirmed hypothesis is a Node 20 (CI) vs Node 22 (local) version mismatch, blocked by an unresponsive `nvm` prompt during investigation.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1-AC5, each independently verified per the test plan's verification steps)
**Tests passing:** 5 / 5

**Test gaps:** None for the confirmed 3-file scope. The 2 out-of-scope files remain genuinely unconfirmed — not a test gap in this story, an explicit, documented scope boundary.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — narrowed scope must not reduce detection of a real committed key | ✅ | AC4's fixture test directly proves this. |
| Performance — negligible | ✅ | Narrower grep scope, if anything marginally faster. |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: None (within the confirmed 3-file scope; 2 files remain a separate, explicitly-tracked open item)

**Retroactive DoD note:** This DoD was written 2026-07-16, immediately upon this PR's merge, as part of the operator's decision to require DoD for all short-track stories going forward — the first short-track story in this repo's history to receive DoD at merge time rather than retroactively much later.

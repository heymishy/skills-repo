# Definition of Ready: cfg-s1 — Fix over-broad Stripe-key grep scope

**Story:** artefacts/2026-07-16-ci-flake-grep-fix/stories/cfg-s1-scope-stripe-key-grep-checks.md
**Test plan:** artefacts/2026-07-16-ci-flake-grep-fix/test-plans/cfg-s1-scope-stripe-key-grep-checks-test-plan.md
**Review:** artefacts/2026-07-16-ci-flake-grep-fix/review/cfg-s1-review-1.md
**Date:** 2026-07-16

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 5 ACs |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ (names the 2 unresolved files explicitly) |
| H5 | Benefit linkage names a real metric | ✅ |
| H6 | Complexity rated | ✅ Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH |
| H8 | Test plan covers all ACs | ✅ |
| H8-ext | Cross-story schema dependency | ✅ N/A — tst-s1 already merged |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ |
| H-GOV | Governance approval | ⚠️ See decisions.md GAP entry (same precedent as pcr-s1/tst-s1/jlc-s1) |
| H-ADAPTER | D37 check | ✅ N/A — no adapters involved |

**All hard blocks pass.**

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix the over-broad Stripe-key grep scope -- artefacts/2026-07-16-ci-flake-grep-fix/stories/cfg-s1-scope-stripe-key-grep-checks.md
Test plan: artefacts/2026-07-16-ci-flake-grep-fix/test-plans/cfg-s1-scope-stripe-key-grep-checks-test-plan.md

Goal:
Narrow the git grep pathspec in tests/check-bri-s3.5-nfr-stripe-keys.js,
tests/check-lab-s3.2-stripe-checkout.js, and tests/check-lab-s3.4-stripe-webhook.js
so it searches only runtime-relevant paths (src/, tests/e2e/fixtures/,
playwright.config.js, .env.example) and excludes *.md files and the checking
test files' own source, instead of the whole repo. Confirmed root cause: the
current `-- .` scope matches documentation and the checker's own source code
that legitimately reference these pattern strings as examples.

Read each file's actual current grep invocation yourself before editing --
do not assume line numbers are exact.

Verify using a real POSIX shell (this machine has one at
C:\Program Files\Git\usr\bin\bash.exe) so the fix is actually exercised, not
silently no-op'd the way the original bug was masked on Windows via cmd.exe.

AC4 is important: prove the narrowed scope still catches a REAL violation by
temporarily adding a fixture file under src/ with a fake sk_live_-prefixed
string, confirming the check correctly fails, then removing it and confirming
it passes again.

Do not touch tests/run-gpa-tests.js or tests/check-gpa-sc06-source-path-guard.js
-- explicitly out of scope, root cause unconfirmed (see decisions.md).

Update tests/known-baseline-failures.json to remove the 3 fixed files. Update
.github/pipeline-state.json via node bin/skills advance (never edit directly).
Open a draft PR. Never merge/self-merge. Never push directly to origin/master.

Oversight level: Low
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-07-16.

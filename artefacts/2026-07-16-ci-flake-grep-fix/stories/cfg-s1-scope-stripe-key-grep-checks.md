## Story: Fix the over-broad Stripe-key grep scope causing 3 NFR checks to false-positive in real CI

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## Background (follow-up from tst-s1, 2026-07-16)

During `tst-s1`'s baseline triage, 5 files were found to pass on a local Windows dev machine but genuinely fail on the real GitHub Actions (Ubuntu) CI runner. `tst-s1` restored them to the accepted baseline rather than investigate under time pressure, logging a follow-up trigger. This story is that follow-up, scoped to the 3 files where root cause is now confirmed: `tests/check-bri-s3.5-nfr-stripe-keys.js`, `tests/check-lab-s3.2-stripe-checkout.js`, `tests/check-lab-s3.4-stripe-webhook.js`.

## Root cause (confirmed by direct investigation, not assumption)

All 3 files run `git grep -n "<pattern>" -- .` (e.g. `sk_live_`, `STRIPE_SECRET_KEY=sk_`, `STRIPE_WEBHOOK_SECRET=whsec_`) via Node's `execSync`, wrapped in a try/catch that silently swallows any error into an empty result.

**On a local Windows machine:** Node's `execSync` defaults to `cmd.exe` when no `shell` option is passed. `cmd.exe` does not understand the POSIX `2>/dev/null` redirect syntax in the command string, so the whole command errors ("The system cannot find the path specified"). The try/catch swallows this, `grepResult` becomes `''`, and the check trivially passes — not because it verified anything, but because it never ran.

**On real CI (Ubuntu, real `/bin/sh`):** the command runs correctly. `git grep -n "sk_live_" -- .` searches the **entire repository**, including markdown documentation, story/test-plan/DoD artefacts, and — critically — the checking script's **own source code**, all of which legitimately reference these exact pattern strings as documentation/examples (e.g. this story's own predecessor story explains "Live keys (`sk_live_...`) are set only by lab-s3.5 pre-launch checklist"; the checker file's own comments say "never `sk_live_`"). None of these are real committed secrets. The check has no mechanism to distinguish "a file that discusses this pattern" from "a file containing an actual live key," so it produces a real false-positive failure on the only environment where the grep actually executes.

Confirmed directly: running `git grep -n "sk_live_" -- .` under a real POSIX shell (`C:\Program Files\Git\usr\bin\bash.exe`, matching how Ubuntu's `/bin/sh` would execute the same syntax) surfaces 11 matches, all in `.github/pipeline-state.json`, `artefacts/`, and the test files themselves — zero real committed keys.

## User Story

As an **operator relying on CI as the authoritative pass/fail signal for this suite**,
I want **these 3 Stripe-key-integrity checks to actually verify what they claim (no live-mode key committed to runtime-relevant code) without false-positiving on documentation that discusses the pattern**,
So that **CI's regression gate reflects real defects, not a check that was silently inert locally and produces noise on every real run**.

## Benefit Linkage

**Metric moved:** CI signal accuracy — directly continues `tst-s1`'s own benefit linkage (reducing undifferentiated red noise so a genuinely new regression isn't lost in it).
**How:** Confirmed with the operator (2026-07-16) as a direct follow-up to `tst-s1`'s logged revisit trigger.

## Architecture Constraints

- Do not weaken the actual security property (no live-mode Stripe key ever committed to runtime-relevant code). The fix narrows *where* the grep searches, not *whether* it searches.
- Scope the grep to the paths where a real committed key would actually matter: `src/`, `tests/e2e/fixtures/`, `playwright.config.js`, and `.env*` files — matching the original intent already documented in `artefacts/2026-07-09-beta-readiness-infra/plans/bri-s3.5-plan.md` ("confirms `tests/e2e/fixtures` and `playwright.config.js` never hardcode a live-mode key pattern"). Exclude `*.md` files and the checking test files' own source (self-referential pattern mentions) from the search.
- Do not change `execSync`'s cross-platform shell behavior as part of this story (e.g. don't add an explicit `shell:` option to force POSIX semantics on Windows) — that's a separate, broader concern (affects local dev ergonomics on Windows, not CI correctness) and out of this story's bounded scope. This story only needs the check to be *correct* wherever it successfully runs; making it *also* run correctly on Windows locally is a nice-to-have, not required to close the CI-flake gap.

## Dependencies

- **Upstream:** `tst-s1` (merged, PR #484) — the revisit trigger this story closes.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `tests/check-bri-s3.5-nfr-stripe-keys.js`'s check 3 (no `sk_live_`/`rk_live_` pattern), When run under a real POSIX shell against this repo's actual current content, Then it passes (0 false-positive matches against documentation/self-referential code, while still searching all runtime-relevant paths).

**AC2:** Given `tests/check-lab-s3.2-stripe-checkout.js`'s NFR1 check (no `STRIPE_SECRET_KEY=sk_` committed), When run the same way, Then it passes for the same reason.

**AC3:** Given `tests/check-lab-s3.4-stripe-webhook.js`'s NFR check (no `STRIPE_WEBHOOK_SECRET=whsec_` committed), When run the same way, Then it passes for the same reason.

**AC4:** Given a genuine live-mode key were hypothetically committed to `src/`, `tests/e2e/fixtures/`, `playwright.config.js`, or a `.env*` file (simulated via a temporary test fixture, not a real key), When the scoped grep runs, Then it still correctly detects and fails — proving the fix narrows scope without losing real detection capability.

**AC5:** Given the 3 fixed files, When run via `node scripts/run-all-tests.js` (or directly), Then all 3 exit 0, and `tests/known-baseline-failures.json` is updated to remove these 3 entries (they are no longer false-positive-failing, and were never real regressions).

## Out of Scope

- `tests/run-gpa-tests.js` and `tests/check-gpa-sc06-source-path-guard.js` — the other 2 files from `tst-s1`'s original 5-file local-vs-CI list. Direct investigation found no execSync/grep-scope issue in these; `check-gpa-sc06`'s own guard logic (`path.resolve`/`path.sep`) is portable and passes cleanly on inspection. The leading unconfirmed hypothesis is a Node version mismatch (local dev machine runs Node 22; CI pins Node 20 exactly in `pr-checks.yml`) — attempting to install/switch to Node 20 locally to confirm was blocked by an unresponsive `nvm` prompt during this story's own investigation. These 2 files remain in `tests/known-baseline-failures.json`, unresolved, with this finding logged in `decisions.md` as a distinct follow-up (do not conflate with AC1-AC5's confirmed root cause).
- Changing `execSync`'s shell behavior to also make these checks meaningful when run locally on Windows — a separate developer-ergonomics concern, not required to close the CI-accuracy gap this story targets.
- Any other file in the 67-file deferred list from `tst-s1`'s triage-report.md — not this story's scope.

## NFRs

- **Security:** The fix must not reduce detection of a real committed live-mode key in any runtime-relevant path (AC4 proves this).
- **Performance:** Negligible — same grep mechanism, narrower scope (fewer files to search, if anything faster).
- **Accessibility:** Not applicable.
- **Audit:** None beyond existing logging.

## Complexity Rating

**Rating:** 1 — root cause is fully confirmed, fix is a well-understood, narrow scope change to 3 existing grep invocations.
**Scope stability:** Stable.

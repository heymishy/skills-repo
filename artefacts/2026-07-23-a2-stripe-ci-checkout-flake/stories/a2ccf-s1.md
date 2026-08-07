# Story: Serialize the "Scenario A E2E (staging)" CI job's real-staging Playwright specs to eliminate CPU-contention-induced Stripe Checkout flake

**Epic reference:** None — short-track (bounded CI fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect found this session while getting the newly-wired "Scenario A E2E (staging)" CI gate (PR https://github.com/heymishy/skills-repo/pull/563, story a5-ci-gate-scenario-a-blocking) to pass against real `wuce-staging`, after the prior rate-limiter cascade fix (PR #564, serlb-s1) resolved the previous blocker.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied to the parent feature's own benefit metric.

## User Story

As **the "Scenario A E2E (staging)" CI job** (and any future contributor relying on its pass/fail signal as a genuine, CI-blocking merge gate),
I want **`tests/e2e/a1-staging-auth-stub.spec.js`, `a2-stripe-test-mode-plan-selection.spec.js`, `a3-product-feature-ideate-canvas.spec.js`, and `a4-ideate-session-resume.spec.js` to run serially (one worker) inside this specific CI job**,
So that **`a2`'s real Stripe Checkout interaction is never starved of CPU by a concurrently-running, page-fixture-heavy spec (`a3`/`a4`) on the small GitHub Actions runner, and the gate reports a genuine, repeatable pass/fail signal rather than an environment-induced flake**.

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Without this fix, the Scenario A CI-blocking gate (PR #563) cannot pass a clean run even though the application code under test (Stripe test-mode checkout, session handling) is genuinely correct — confirmed by the same spec passing 3/3 both in a prior manual run this session and via a clean local run with `--workers=1` (see decisions.md). A gate that cannot pass for reasons unrelated to the code it is meant to verify has negative value: it either blocks merges spuriously or trains operators to ignore/override it.

**How:** confirmed via the real failing CI run (`gh run view 29981769208 --job 89124881273 --log-failed`): 6 passed, 2 skipped, 3 failed — all 3 failures in `a2-stripe-test-mode-plan-selection.spec.js`, and all 3 downstream of the same root interaction never completing (see Architecture Constraints/root cause below).

## Architecture Constraints

- **Root cause (independently confirmed, not assumed):** `.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` job runs `npx playwright test <4 files>` with no `--workers` flag and no `workers` setting in `playwright.config.js`, so Playwright falls back to its CPU-based default. The real failing run's own log shows `Running 11 tests using 2 workers` — consistent with GitHub Actions' small `ubuntu-latest` runner (≈2 vCPU vCPU, default workers ≈ half of that). `a1`'s 3 tests all destructure only `{ request }` (no `page` fixture — no browser page is driven), so `a1` finishes fast and its worker frees up almost immediately once the run starts, while `a2` (which does use `page` for its real Stripe Checkout interaction) is often still mid-flight. The freed worker then picks up the next queued file — `a3` or `a4`, both of which use the `page` fixture heavily (29 and 13 `page.*` call sites respectively, driving real canvas rendering / SSE streaming UI). The result: `a2`'s real, timing-sensitive interaction with Stripe's real hosted Checkout page (`page.fill()` the card fields, then click the submit button) runs genuinely concurrently, in a sibling worker process on the same small runner, with a second heavy browser automation session. On a CPU-constrained runner this contention is enough to delay Stripe Checkout's own client-side validation/enablement JavaScript past the point where our synthetic `click()` lands — so the click silently has no effect: no redirect fires, no decline message renders, and (for AC1) no successful checkout means no Stripe test-mode webhook ever reaches the server to flip the tenant's plan state from `trial` to `paid`. This explains all 3 observed failures as one shared root cause, not three independent defects.
- **Ruled out, with evidence, not by assumption:**
  - **Real per-IP rate limiting (429s):** the failing CI run's log shows zero HTTP 429 errors anywhere in `a2`'s 3 failures — all 3 are either an assertion mismatch (`trial` vs `paid`) or a Playwright `page.waitForURL`/`toBeVisible` timeout, never an HTTP-level error. `E2E_STAGING_AUTH_STUB_SECRET` was confirmed present as a GitHub Actions secret as of `2026-07-23T05:11:16Z` (`gh secret list`), before this run started (`05:18:29Z`), so serlb-s1's rate-limit bypass was genuinely active for this run — consistent with "no more 429s" and ruling out rate-limiting as this run's failure cause.
  - **Timeout-too-tight for CI network latency:** ruled out because AC1's failure is not "assertion timed out marginally" — `pollPlanState` polled 10 times over 15s and the plan state never once became `paid`, meaning the checkout was never actually completed server-side at all (a webhook that never fires does not eventually fire with more time). AC2's 30s `waitForURL` timeout and AC3's 15s `toBeVisible` timeout are both generous relative to this app's typical redirect/render latency (confirmed by the identical spec completing in 33.5s total for all 3 tests when run serially, locally, against the same real staging app) — a genuinely slower network path would show partial/marginal timing misses, not a complete non-occurrence of the underlying server-side effect.
  - **Stripe test-mode bot detection / GitHub Actions IP blocking:** no CAPTCHA, block page, or Stripe-side error status was observed anywhere in the log; the failure mode (our own click having no effect) is indistinguishable, from the available evidence, from a client-side timing race — and directly reproducible locally purely by re-introducing worker concurrency (see decisions.md), with no change to network origin. Not fully ruled out in isolation (no CI-run trace/screenshot was recoverable — see decisions.md's artifact-upload finding — this session's local reproduction is treated as informative but not identical to the exact CI network path), but the concurrency-removal fix (`--workers=1`) is the same fix regardless of whether the trigger is CPU contention or (less likely, given the evidence) some other concurrency-coupled variable, so it is not required to fully exclude this to proceed.
- **MUST NOT modify `playwright.config.js` globally.** The pre-existing 29 local-mocked specs (run via `npm run test:e2e` in the `e2e` job, non-blocking) intentionally benefit from parallel workers for speed; forcing `workers: 1` there would slow every other spec in the repo for a fix that only this one job/spec combination needs.
- **MUST NOT weaken, relax, or remove any of `a2`'s existing assertions** (AC1's `plan`/`status` checks, AC2's `/dashboard` URL and `me.authenticated` checks, AC3's `/declined/i` visibility and `plan !== 'paid'` check) to make the job pass artificially.
- **Fix is scoped to the `scenario-a-staging-e2e` job's own `run:` command only** (`.github/workflows/e2e.yml`), via a Playwright CLI flag (`--workers=1`), not a config-file-level change — keeps blast radius to exactly the one job that has this concurrency problem.

## Dependencies

- **Upstream:** `a5-ci-gate-scenario-a-blocking` (PR #563, open/draft) — this story's fix is authored on top of that branch (the `scenario-a-staging-e2e` job does not exist on `master` yet). `staging-e2e-rate-limit-bypass` / serlb-s1 (PR #564, merged) — resolved the prior, unrelated 429-cascade blocker that this story's investigation had to first rule out as a confound.
- **Downstream:** None yet — this is the fix that is expected to let PR #563's own "Scenario A E2E (staging)" check finally pass for real, unblocking that PR's merge.

## Acceptance Criteria

**AC1:** Given the `scenario-a-staging-e2e` job's `run:` command in `.github/workflows/e2e.yml`, When read, Then it invokes `npx playwright test <4 spec files> --workers=1` (the `--workers=1` flag is present, scoped to this one `run:` line only).

**AC2:** Given `playwright.config.js`, When read, Then it contains no `workers` field and no other change from before this story — the fix is not applied globally.

**AC3:** Given the exact fixed command run locally against real `wuce-staging` (`npx playwright test tests/e2e/a1-staging-auth-stub.spec.js tests/e2e/a2-stripe-test-mode-plan-selection.spec.js tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js --workers=1`), When run, Then all of `a2`'s 3 tests (AC1, AC2, AC3) pass — reported honestly including any unrelated pre-existing skip/fail in `a1`/`a3`/`a4` (e.g. the already-documented credits-upsert gap or per-IP rate-limit exhaustion from this session's own repeated local runs, both out of scope for this story).

**AC4:** Given this fix pushed to a real branch and a real GitHub Actions run of the "Scenario A E2E (staging)" job, When the run completes, Then the job's own log is inspected directly (`gh run view --job <id> --log-failed` or full log) to confirm `a2`'s 3 tests are not among any failures — the only verification that actually matters, since the defect is CI-environment-specific and a local pass alone does not prove it.

**AC5:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the failure set matches `tests/known-baseline-failures.json` (no new regressions — this fix touches only `.github/workflows/e2e.yml`, which `npm test` does not execute, so this AC is expected to be a clean no-op confirmation).

**AC6 (secondary, bundled fix):** Given the `scenario-a-staging-e2e` job's "Upload Playwright traces and screenshots on failure" step's `if:` condition, When the job's run step genuinely fails (no `continue-on-error` on that job), Then the upload step still executes (via an explicit `always()` in its condition) — fixing the discovered defect where GitHub Actions' implicit `success()`-wrapping of any custom `if:` expression silently skipped this step on every real failure, leaving zero diagnostic artifacts (confirmed: run 29981769208 failed with 3 real test failures but `gh api .../actions/runs/29981769208/artifacts` returned an empty list).

## Out of Scope

- Any change to `a2-stripe-test-mode-plan-selection.spec.js`'s own assertions, timeouts, or checkout-flow logic — the spec is correct; the CI job's concurrency configuration is the defect.
- Any change to the pre-existing, non-blocking `e2e` job (`Playwright E2E smoke tests`) or its 29 local-mocked specs' parallelism.
- Fully proving/disproving the Stripe test-mode bot-detection hypothesis in isolation — the chosen fix (serialize this job's specs) resolves the observed flake regardless of which concurrency-coupled mechanism is the precise trigger, per the Architecture Constraints section above.
- The already-documented, unrelated credits-upsert gap (`a3`/`a4`) and a4's NFR-Security staging-freshness open question — both pre-existing and out of scope here.
- Re-litigating serlb-s1's rate-limit-bypass fix — confirmed still working correctly (no 429s in the run under investigation).

## NFRs

- **Performance:** This job's own wall-clock time increases (fewer than before parallel workers, now fully serial) — acceptable trade-off; this job is not on any interactive/blocking developer feedback path faster than PR review cadence, and the job's own `timeout-minutes: 10` budget still comfortably covers a serial run (the failing run itself completed, pass or fail, well under 2 minutes with 2 workers; a serial run of the same 11 tests is expected to complete within the existing 10-minute budget based on the local `--workers=1` run's own 48.7s wall-clock time).
- **Security:** None — no change to secrets, auth, or session handling.
- **Accessibility:** Not applicable — CI/workflow-only change.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed via real CI log analysis plus a clean local reproduction/non-reproduction comparison (`--workers=1` vs default), fix is a single CLI flag addition scoped to one `run:` line.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High — solo-operator default, per CLAUDE.md's estimation model)

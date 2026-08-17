# Definition of Done: Staging smoke-test job runs single-worker so the real-LLM-call counter can't be polluted by a concurrently-running spec

**PR:** commit `21d83bd4` / `94828eef` "rlcc-s1: serialize the staging smoke-test job to fix real-LLM-call counter races (#603)" | **Merged:** 2026-07-25
**Note:** the task brief for this DoD pass cited PR #633, but git log shows #633 is a different, later story (`pmec-s1: auto-confirm real-staging E2E specs after every master deploy`). rlcc-s1's actual merge commit is PR #603 (`21d83bd4`, 2026-07-25 18:30:45 +1200) — corrected here from direct git log evidence.
**Story:** artefacts/2026-07-25-realllm-counter-isolation/stories/rlcc-s1-smoke-test-worker-isolation.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Verification method | Deviation |
|----|-------------|------------|----------|---------------------|-----------|
| AC1 | `staging-deploy.yml`'s smoke-test job's `@mocked` Playwright line includes `--workers=1` | Yes | `AC1a: found the @mocked run: line`, `AC1b: that line includes --workers=1` -- confirmed directly at `.github/workflows/staging-deploy.yml:145` (`npx playwright test --grep "@mocked" --workers=1`) | Automated (`check-rlcc-s1-smoke-test-worker-isolation.js`) | None |
| AC2 | No other job's Playwright invocation gained `--workers=1` as a side effect | Yes | `AC2a: exactly one run: command inside the smoke-test job carries --workers=1`, `AC2b: --workers=1 does not appear inside deploy-staging or promote-to-prod` | Automated | Note: the check script's own comment records that a later story (`pmec-s1`) added a separate `post-deploy-e2e-confirm` job that legitimately reuses `--workers=1` for its own, unrelated CPU-contention reason. AC2's actual guarantee is "the flag didn't leak into `deploy-staging`/`promote-to-prod`", not "no other job anywhere in the file may ever use it" -- consistent with the test's own scoping and not a gap in rlcc-s1's own delivery. |
| AC3 | `playwright.config.js` (shared, non-CI-specific) is unmodified | Yes | `AC3: playwright.config.js module.exports has no "workers" key` | Automated (loads the config module directly and asserts absence of a `workers` key) | None |

## Scope Deviations

None from the story's own stated scope. The story itself names three explicitly deferred/out-of-scope items, not defects:
- Building true per-request/per-worker attribution in `server.js` (e.g. `AsyncLocalStorage`) -- rejected in favour of the simpler, precedented serialization fix; may be revisited if job runtime becomes a real constraint.
- Investigating exactly which code path produced the extra real-looking calls observed in the original `bri-s3.4` incident -- no longer observable/relevant once the job is serialized; left as an optional curiosity-driven investigation.
- Any change to the 20x-repeat `bri-s3.4-cross-tenant-repeat-gate.yml` workflow -- not evidenced as sharing this race, out of scope unless shown otherwise.

## Test Plan Coverage

`check-rlcc-s1-smoke-test-worker-isolation.js`: 5 passed, 0 failed (freshly re-run 2026-08-17). This covers all 3 ACs: AC1 (2 assertions -- line found, flag present), AC2 (2 assertions -- exactly one `run:` line in the smoke-test job carries the flag, and it does not leak into `deploy-staging`/`promote-to-prod`), and AC3 (1 assertion -- `playwright.config.js` unmodified).

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| CI runtime | Presumed met, not independently re-measured this session | Story states serializing roughly doubles the smoke-test job's wall-clock time (5 spec files, ~21 tests, 2 workers -> 1) and must stay within the job's existing 10-minute `timeout-minutes` budget. No live CI run timing was gathered as part of this retroactive pass; the job has been running in this configuration since 2026-07-25 with no reported timeout failures surfaced in this session's git log review. |

## Metric Signal

No dedicated benefit-metric artefact is referenced by this story -- it is a short-track bug fix (story's own header: "Short-track: bug fix -- adjacent gap surfaced by dss-s1's own post-merge live verification"). The story's benefit is stated directly rather than via a `/benefit-metric` artefact: a `@mocked` spec should never fail its own "zero real LLM calls" assertion due to a different, concurrently-running spec's activity on the same shared staging server. No independent post-merge signal (e.g. a subsequent live smoke-test run showing zero worker-contention-attributable failures) was reviewed in this session to confirm the fix holds under real CI load; the automated structural checks (AC1-AC3) confirm the fix is correctly wired, not that it has since prevented a live flake.

## Outcome

**COMPLETE**
**Follow-up actions:** None required for this story. The two items named in Scope Deviations above remain optional future work, not gaps in this story's own delivery.

## DoD Observations

This story is the direct fix for the "shared-process counter pollution across concurrent Playwright workers" item that sibling story `dss-s1` (2026-07-25-staging-safe-test-endpoints) explicitly flagged as a deferred follow-up candidate in its own Scope Deviations and Outcome sections (capture-log.md, 2026-07-25, signal-type `gap`) rather than fixing itself -- `dss-s1`'s own DoD (this session) references the same gap and names rlcc-s1 as the story that would need to close it. The fix follows an already-precedented pattern in this repo (`e2e.yml`'s Scenario A `--workers=1`, from `a2ccf-s1`), and has been running in `staging-deploy.yml` since 2026-07-25 with no counter-pollution-attributable failures surfaced in this session's git log review.

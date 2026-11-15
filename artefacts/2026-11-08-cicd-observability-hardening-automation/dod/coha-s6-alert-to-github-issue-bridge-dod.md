# Definition of Done: Alert-to-GitHub-issue bridge for new production error issues

**PR:** https://github.com/heymishy/skills-repo/pull/1089 (merge commit 703852dec) | **Merged:** 2026-11-14 (00:27 UTC)
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s6-alert-to-github-issue-bridge-dor.md (signed off by Hamish King)
**Verification evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/reference/coha-s6-verify-completion-evidence.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

Verification-strength tags: `unit` is a test against stubs; `integration-real-code` means real production code ran (the real handler, the real `server.js` started as a child process, and a real Postgres 16 for the store) with a fake GitHub API standing in for GitHub. No AC has `live-verified` or `production-observed` evidence yet: nothing has been sent to the real GitHub repository from the deployed app (see Follow-up actions 1 to 3).

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: issue content: fixed code title, `production-error` label, body with first-seen, environment, PostHog link and id marker. Evidence: U1, U2, U3, U3b, U3c, U3d, U4, U4b, I1 and the adapter shape tests in `tests/check-coha-s6-error-bridge.js` | `unit` and `integration-real-code` | None |
| AC2 | ✅ | Criterion: one issue per error across duplicates, concurrency, restart and stuck pending. Evidence: U5 to U9b, and against a real Postgres P1 to P4 | `integration-real-code` | A retry that arrives while the first attempt is still running gets 200 in-flight and that issue can be lost: RISK-ACCEPT in decisions.md (2026-11-14) |
| AC3 | ✅ | Criterion: secret, method, size and malformed-body handling. Evidence: U10 to U16, U15b, U17, N4, I1, W1 | `unit` and `integration-real-code` | None |
| AC4 | ✅ | Criterion: staging or missing environment creates nothing, with a distinct log line. Evidence: U17b, U18, U18b, U19, I1, W1 | `integration-real-code` | None |
| AC5 | ✅ | Criterion: GitHub failure leaves the claim retryable, never a duplicate. Evidence: U20 to U22b, ambiguous-create and search-phase tests, adapter classification tests, I2, I2b, and real Postgres P5 | `integration-real-code` | Release-on-failure was narrowed to definite failures only (decisions.md 2026-11-14) so an ambiguous create cannot cause a duplicate |
| AC6 | ✅ | Criterion: live PostHog test run opens exactly one issue. Evidence: 2026-11-14 20:39 UTC, a test invocation of the PostHog webhook destination (real HTTP, secret header added in the PostHog UI) against https://wuce-staging.fly.dev/webhook/error-alert with a made-up production event (id 00000000-0000-4000-8000-0000c0a56006) created exactly one issue, #1091 in heymishy/skills-repo: title tenant_admin_bootstrap_failed, label production-error, body holding only first-seen, environment, PostHog link and id line. Staging log: one line "created issue #1091". No second issue appeared after several minutes. Issue closed by the operator. | `live-verified` | PostHog logged attempt 1 as timed out and retried, yet the issue was created in that same second; deduplication held. Bridge response time on a cold machine is worth watching. |
| AC7 | ✅ | Criterion: real startup wiring. Evidence: W1 (no database) and against real Postgres P6 and P7: the fake GitHub API received the right path, bearer token, title, body marker and label; two ids gave two different correct issues | `integration-real-code` | None |
| AC8 | ✅ | Criterion: unwired adapter throws the exact message and is contained. Evidence: U23 (exact message), U24, the unwired-adapter-never-releases test, W1 (503 and "Adapter not wired" log) | `unit` and `integration-real-code` | None |
| AC9 | ⚠️ | Criterion: first real production error opens exactly one issue. Evidence: Cannot be produced on demand. Accepted as a RISK-ACCEPT in decisions.md (2026-11-13) | none yet | Waiting for the first real production error: `production-observed` evidence still to come |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are recorded here and will be surfaced by /trace.

---

## Scope Deviations

None against the story's Out of Scope list. Additions beyond the plan's text (the release-claim step and the definite/ambiguous failure boundary, config validation at wiring time) were logged in decisions.md on 2026-11-14 and listed in the PR description.

One governed file outside the story's own touch points was considered, `scripts/run-all-tests.js`. It was measured and left unchanged: the new test file does not disturb timing-sensitive tests (0 of 6 failures beside it, against 5 of 6 beside coha-s5), so it stays in the normal pool.

---

## Test Plan Coverage

**Tests from plan implemented:** yes; the file holds 90 tests (83 always run, 7 need a real Postgres and print SKIPPED without one)
**Tests passing in CI:** PR Checks on the final commit (0aa37056c) all passed: Lint, typecheck, test, build; Cross-tenant isolation (20x); Playwright E2E smoke; Run assurance gate; Scenario A and B E2E (staging); Vulnerability check; Watermark gate. The seven real-Postgres tests were run locally against a throwaway Postgres 16 (90 passed, 0 skipped); CI has no Postgres service, so in CI those seven are skipped.

**Gaps (tests not implemented):**
None against the plan. The seven real-database tests do not run in CI (optional follow-up: add a CI Postgres service).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Privacy: issue content is public, only fixed code, time, environment, link and marker | ✅ | AC1 tests; the body builder takes no message or stack |
| Isolation: test and staging traffic cannot create production issues | ✅ | AC4 tests; staging and production share one PostHog project (confirmed 2026-11-13) so the `environment` filter is the separation |
| Reliability: one issue per error, never lost or duplicated | ⚠️ | Verified against real Postgres for duplicates, restarts and stuck claims; one accepted gap (retry while the first attempt is still running); the real first production error is still to be observed (AC9) |
| Security: authenticated, bounded, token limited to issues on one repo | ⚠️ | Constant-time secret check, 16 KB limit, verified by tests; the token's real permission scope and expiry are operator-created and not yet verified (Follow-up action 1) |

NFR profile status left at Active, not Verified: two rows await the live checks and coha-s7 adds further rows to the same profile.

---

## Metric Signal

Metric 4 (Production-defect detection latency) lists no contributing stories in `pipeline-state.json`. Its first signal needs a real production error to open an issue, which has not happened. No signal is recorded and no deferred-item registration is made, matching the coha-s5 DoD.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Production-defect detection latency (Metric 4) | ❌ (baseline still unknown) | After the first real production error produces a GitHub issue (AC9) | coha-s5 supplies the "defect appeared" timestamp; this bridge supplies the "issue opened" timestamp |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Eight of nine ACs are satisfied: seven on `unit` and `integration-real-code` evidence, and AC6 on `live-verified` evidence from staging (2026-11-14). AC9 (the first real production error) is production-observed only and not yet seen. The staging run proves the bridge, secret, token and label work end to end; production still needs its own Fly secrets and an enabled PostHog destination.

**Follow-up actions:**
1. Done 2026-11-15: production prepared and switched on. Token and the three Fly secrets set on skills-framework, production deployed (release v182 and a secrets deploy), PostHog destination 01a1d3ce-ad2c-0000-64b2-d32e9b55609b pointed at https://skills-framework.fly.dev/webhook/error-alert and ENABLED after a passing production test. One setback: the first production secret pasted into PostHog was rejected by PostHog as an invalid header value (nothing was sent); a freshly generated secret set in both places worked.
2. Done: live tests opened exactly one issue each, on staging (#1091, 2026-11-14) and on production (#1092, 2026-11-15, 1.5 s, no retry). Operator closes test issue #1092. AC9 (the first real production error) is now the only open criterion; coha-s5 error capture and this bridge are both live on production.
3. Operator: when the first real production error occurs, confirm exactly one issue opens and a repeat opens none (AC9, `production-observed`).
4. Optional follow-up story: add a Postgres service to CI so the seven real-database tests run on every pull request.
5. Optional follow-up: delete or repoint the disabled draft PostHog destination `01a1d3ce-ad2c-0000-64b2-d32e9b55609b`.
6. Accepted gaps to revisit: retry-while-in-flight can lose an issue (RISK-ACCEPT 2026-11-14); the takeover marker search sees only the 100 most recent labelled issues.

---

## DoD Observations

1. **A "release on any failure" amendment of my own would have caused duplicates.** The first design released the claim on any non-timeout error; review showed an ambiguous create could then post a second issue. Narrowed to definite failures, with the boundary pinned by tests. Tag: /improve candidate (retry designs should classify errors as definite or ambiguous before choosing to release).
2. **Real Postgres found nothing the fakes missed, but only because the gated tests were run.** The seven real-database tests skip silently without a variable; a skip is not a pass, so verification ran them explicitly. CI does not (Follow-up 4).
3. **The bridge is inert until the operator acts.** Three secrets, a token, a label and a PostHog destination are all operator steps. The story is shipped but not live; AC6 and AC9 are the proof of life.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Alert-to-GitHub-issue bridge for new production error issues".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

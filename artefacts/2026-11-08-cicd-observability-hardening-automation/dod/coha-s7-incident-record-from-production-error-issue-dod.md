# Definition of Done: Incident record pull request for each bridge-opened production error issue

**PR:** https://github.com/heymishy/skills-repo/pull/1090 (merge commit 19d902a7b) | **Merged:** 2026-11-14 (19:08 UTC)
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s7-incident-record-from-production-error-issue-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s7-incident-record-from-production-error-issue-dor.md (signed off by Hamish King, 2026-11-14)
**Verification evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/reference/coha-s7-verify-completion-evidence.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

Verification-strength tags: `unit` is a test against stubs; `integration-real-code` means real production code ran (the real script and logic module as child processes, real git in temporary repositories, the real product page handler and record store) with no real GitHub. No AC has `live-verified` evidence yet: the workflow has not run on GitHub (see Follow-up actions 1 to 3).

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: one pull request with one added record and the right fields. Evidence: U1 to U5, I1, I6 in `tests/check-coha-s7-error-issue-incident.js` | `unit` and `integration-real-code` | None |
| AC2 | ✅ | Criterion: no second branch or pull request. Evidence: U14, U14b, U15, I6; fork pull requests ignored | `unit` and `integration-real-code` | Fork-PR exclusion added after security review (decisions.md) |
| AC3 | ✅ | Criterion: other author declined; unset variable recognises nothing. Evidence: U6 to U8, W10 | `unit` | None |
| AC4 | ✅ | Criterion: missing label or marker declined; the issue is only opened. Evidence: U9 to U11, W1 | `unit` | None |
| AC5 | ✅ | Criterion: record accepted by validation and the product page. Evidence: I1, I2 (real page handler, text escaped), I3 | `integration-real-code` | None |
| AC6 | ✅ | Criterion: hostile text inert; bad id creates no branch; code in inline code. Evidence: U12, U13, U18 (real child process with a sentinel file), W4 | `integration-real-code` | None |
| AC7 | ✅ | Criterion: simultaneous issues independent; conflicted record rebuilt. Evidence: I4 (real git: second merge conflicts, rebuild with force-with-lease merges cleanly), I5, U14b, W3, W9 | `integration-real-code` | None |
| AC8 | ✅ | Criterion: dry run prints the result and creates nothing. Evidence: 2026-11-15 on GitHub. Test issue #1093 opened by hand without the label: the automatic run declined it ("decline label issue #1093"). After adding the label no run started. A hand-started run with dry_run=true (run 43657093638) logged "dry-run would-open issue #1093" with the record (summary coha_s7_live_test_error, tags production-error and posthog:00000000-0000-4000-8000-000000000009) and branch incident/posthog-00000000-0000-4000-8000-000000000009; the record job was skipped and no branch or pull request exists. Variable ERROR_BRIDGE_AUTHOR=heymishy was set first. | `live-verified` | None |
| AC9 | ⚠️ | Criterion: live real run: one branch, one pull request, repeat creates nothing, cleaned up. Evidence: W2, W5, W9, W13 and I6 cover the structure and real-git behaviour; the live real run (scenario 9) has not been run; it needs the operator's approval immediately before | `integration-real-code` only so far | Live-only: not verified |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are recorded here and will be surfaced by /trace.

---

## Scope Deviations

None against the story's Out of Scope list (no auto-merge, no push to master, no ready-for-review step, no writing to `workspace/incidents.json` outside a pull request).

Additions beyond the plan's text, all from per-task reviews and logged in decisions.md ("coha-s7 verify-completion: additions beyond the plan text", 2026-11-15) and in the PR description: five extra tests (U2b, U3b, U3c, U19, W13), hardening of the logic module, script and workflow (including `pull-requests: read` on the recognise job, decided 2026-11-14), and test isolation from global git settings.

One governed file outside the story's own touch points changed: `scripts/run-all-tests.js` (the new test file joined `SEQUENTIAL_EXCLUSIVE_LIST`, measured, decisions.md 2026-11-15).

---

## Test Plan Coverage

**Tests from plan implemented:** 39 planned, 44 implemented (the extra five are listed above)
**Tests passing in CI:** 44 of 44 locally in every run. PR Checks on the final commit (03ee9ed7c) all passed: Lint, typecheck, test, build; Cross-tenant isolation (20x); Playwright E2E smoke; Run assurance gate; Scenario A and B E2E (staging); Vulnerability check; Watermark gate. In particular "Lint, typecheck, test, build" passed, so the `cat-s1` timing failure seen locally (acknowledged as environmental) did not recur on CI's quiet runner.

**Gaps (tests not implemented):**
None against the plan. Verification script scenarios 8 and 9 are manual post-merge steps, not automated tests.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: only a bridge-opened production error issue can create a record | ✅ | U6 to U12 (label, exact author login, whole-line marker, lowercase UUID) |
| Security: no untrusted text executed; nothing pushed to or merged into master | ✅ | U13, U18, W4, W5; no merge, approve or ready step |
| Security: least privilege and no outside code | ✅ | W2, W8, W12; only `actions/checkout`; job permissions pinned |
| Audit: every attempt visible in the run log without echoing issue text | ✅ | N1 |
| Reliability: one record pull request per error, never lost, never duplicated | ⚠️ | Idempotency and conflict rebuild proved with real git; the real GitHub behaviour (concurrency group, payload shapes) is only proved by the live runs |
| Compliance: audit records reach main only through the operator's merge | ✅ | Record exists only on its pull request until the operator merges with the admin bypass; one-file workflow RISK-ACCEPTed against ADR-009 |

NFR profile status left at Active, not Verified: the reliability row awaits the live runs.

---

## Metric Signal

Metric 4 (Production-defect detection latency) lists no contributing stories in `pipeline-state.json`; the incident record does not move it directly. No signal is recorded and no deferred-item registration is made, matching the coha-s5 DoD.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Production-defect detection latency (Metric 4) | ❌ (baseline still unknown) | After the first real production error produces a GitHub issue and then a record | The record's first-seen time and the PostHog link give the measurement data once a real error flows through |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Eight of nine ACs are satisfied: seven on `unit` and `integration-real-code` evidence and AC8 on `live-verified` evidence (2026-11-15). AC9 is live-only and not yet run; the claimed real-world effect (the workflow opening one record pull request on GitHub for a real labelled issue) has not been observed.

**Follow-up actions:**
1. Operator: create the repository variable `ERROR_BRIDGE_AUTHOR` holding the bridge account's exact login, letter case included. Until it is set the workflow declines every issue, by design.
2. DONE 2026-11-15 (AC8 passed; the variable was created first). Original step: the AC8 live dry run (verification scenario 8): open the test issue WITHOUT the label, add the label afterwards, start the workflow by hand with `dry_run` on. Confirm it prints the result and creates no branch or pull request.
3. Operator: approve, immediately before, the AC9 live real run (scenario 9) with the fake id `00000000-0000-4000-8000-000000000009`: confirm one branch and one pull request, that a repeat creates nothing, then close the pull request and delete the branch. Record whether the required checks on the workflow-made pull request need approval to start, and merge real record pull requests with the admin bypass. Upgrades AC1, AC2 and AC7 to `live-verified`.
4. Decision pending: the triage drafter links every new record to every earlier one because all records share the `production-error` tag (similarity 0.33 against a 0.3 threshold). Needs a threshold or tag change before it matters.
5. Follow-up: add bidirectional-text and zero-width character ranges to the code check in both the producer (coha-s6) and the consumer (coha-s7).

---

## DoD Observations

1. **A story-design catch changed the verification order.** A hand-opened labelled test issue fires the live workflow before the dry run can happen, so the test issue is opened without the label and labelled afterwards (review run 4 FAIL, fixed in the story and verification script). Tag: /improve candidate (a story whose trigger is the artefact it tests needs the test steps ordered to avoid self-triggering).
2. **My own approved guard rejected valid input.** The first planRecord check required `recognised === true`, which the validated plan did not carry, so every build would have crashed. Reproduced and fixed with a field-based guard. Tag: /improve candidate (a guard on an output that another function produces needs a test that feeds it that real output).
3. **A new CPU-heavy test file again needed the sequential phase.** Second time after coha-s5, this time measured rather than assumed. The `cat-s1` timing assertion failed locally in three of three runs and passed on CI. Tag: /improve candidate (the `check-cat-s1` 50 ms threshold needs a tolerance review by its owner).
4. **Known unrelated full-suite failures locally**: `check-pipeline-state-integrity` (tfhc-s1), `check-pcr-s1-test-runner` (machine-specific limit) and `check-cat-s1-core-trace-builder` (timing). None caused by this change.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Incident record pull request for each bridge-opened production error issue".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

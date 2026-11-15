# Definition of Done: Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events

**PR:** https://github.com/heymishy/skills-repo/pull/1095 (merge commit 55057b50e) | **Merged:** 2026-11-15 (02:36 UTC)
**Story:** artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md
**Test plan:** artefacts/2026-11-15-coha-scrubber-filename-fix/test-plans/sff-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-15-coha-scrubber-filename-fix/dor/sff-s1-dor.md (Low oversight, no named sign-off required)
**Verification evidence:** artefacts/2026-11-15-coha-scrubber-filename-fix/reference/sff-s1-verify-completion-evidence.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

Verification-strength tags: `unit` is a test against the scrubber function; `integration-real-code` is the real `createApp()` in a child process with a local sink; `live-verified` is observed in the real PostHog project from the deployed staging app.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: every scrubbed frame has a string filename (repo path or `[redacted]`). Evidence: UT1, UT2, UT3 in `tests/check-coha-s5-error-capture.js` (UT2 and UT3 fail on the old scrubber) | `unit` | None |
| AC2 | ✅ | Criterion: no canary text reaches the placeholder; existing canary tests pass. Evidence: UT4 plus all 77 existing tests passing; only the two `undefined` assertions in `scrubEvent_filename_keptOnlyWhenRepoRelative` changed, as the story states | `unit` | None |
| AC3 | ✅ | Criterion: real captured shapes pass the schema check after and fail before. Evidence: UT6 with fixture and negative control | `unit` | None |
| AC4 | ✅ | Criterion: end to end through the real createApp. Evidence: IT1 (the sink event has a string filename on every frame; request still 500) | `integration-real-code` | None |
| AC5 | ✅ | Criterion: staging events accepted by PostHog (issue id, no cymbal error, an Error Tracking issue). Evidence: after the staging deploy (release v1293, 2026-11-15 about 02:38 UTC), 9 new `$exception` events from staging (first 02:38:47, last 02:39:48): 9 of 9 carry `$exception_issue_id` (01a1dd12-795d-7763-827f-9a246fad8d00), 0 of 9 carry a `$cymbal_errors` value (before the fix: 207 of 207 rejected, 0 issues); Error Tracking lists 1 active issue ("Error", 9 occurrences). Processed events also carry `$exception_values` (`["tenant_admin_bootstrap_failed"]`), `$exception_types` and `code` | `live-verified` (staging) | None |
| AC6 | ✅ | Criterion: a different rejection must be recorded as INCOMPLETE. Evidence: not triggered. AC5 returned no cymbal error at all, so there is no second rejection reason to record | `live-verified` (condition not met) | None |

---

## Scope Deviations

None against the story's Out of Scope list (no production deploy, no rate limit, no coha-s6 or coha-s7 change, no change to what is scrubbed other than the frame filename key).

One process deviation, logged in `decisions.md` (2026-11-15): one implementer subagent did all three plan tasks (per-task commits), and the two reviewers each reviewed the whole diff once.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 planned entries, 6 new tests plus the edited assertion (UT5 is "the whole existing file" and adds no test; the plan's "84 passing" was an arithmetic error, the correct total is 83).
**Tests passing in CI:** PR Checks passed before merge (the operator merged after the checks). Locally: 83 of 83 for the file; the full suite matched the 6 acknowledged baseline failures exactly.

**Gaps:** None against the plan.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security and privacy: output only from allow-listed fields and one fixed constant | ✅ | UT4 canary scan; the quality and privacy review probed getters, `toString` objects, arrays, frozen frames and a polluted prototype: only a validated repo path or `[redacted]` ever appeared |
| Performance: no change beyond one string assignment per frame | ✅ | Existing 200 ms capture-bound tests still pass |
| Correctness: the schema check can fail | ✅ | UT6 negative control |

---

## Metric Signal

Metric 4 (Production-defect detection latency) lists no contributing stories in `pipeline-state.json`; this story removes the blocker to its first measurement (PostHog now creates Error Tracking issues), but no production error has produced an issue yet. No signal recorded, matching coha-s5 and coha-s6.

---

## Outcome

**COMPLETE**

All six acceptance criteria are satisfied. The live proof is on staging; production still runs the old scrubber until the operator approves the "Promote to production" step of the Staging Deploy workflow run for this commit.

**Follow-up actions:**
1. Operator: approve the "Promote to production (manual approval required)" job of Staging Deploy run 43668594002 (or deploy production the way you usually do) once the post-deploy real-staging E2E confirmation finishes green. Until then production capture is still rejected by PostHog.
2. HIGH, found while verifying (see `artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md`, 2026-11-15): the bridge's body template reads `event.properties.exception_timestamp` for `first_seen`, but the processed `$exception` events carry no such property, and the bridge answers 400 when `first_seen` is empty. The real `$error_tracking_issue_created` event may lack it too, in which case every real alert would be rejected. Proposed fix: set `first_seen` to `{event.timestamp}` in the PostHog destination (a live production change, needs the operator's approval).
3. Candidate hardening story (not required): `RE_REPO_PATH` accepts `..` segments.

---

## DoD Observations

1. **The first real input proved more than all the tests.** Nine real staging events through PostHog's own processor settled in one query what the mock-based live bridge tests could not (learnings D52).
2. **Verifying the fix surfaced the next link in the chain.** Checking which properties processed events carry showed the bridge template depends on a property that does not exist on them. Tag: /improve candidate (a story that feeds a downstream template should list every property the template reads and check each against a real event).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Keep a placeholder filename on every scrubbed stack frame".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

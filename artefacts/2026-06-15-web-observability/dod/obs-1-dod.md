# Definition of Done: Add pino structured logging with turn correlation IDs and timing to the web server

**PR:** https://github.com/heymishy/skills-repo/pull/381 | **Merged:** 2026-06-16
**Story:** artefacts/2026-06-15-web-observability/stories/obs-1.md
**Test plan:** artefacts/2026-06-15-web-observability/test-plans/obs-1-test-plan.md
**DoR artefact:** artefacts/2026-06-15-web-observability/dor/obs-1-dor.md
**Assessed by:** Claude Sonnet 4.6 (copilot)
**Date:** 2026-06-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1, T2, T9, T12 all pass | automated test (`tests/check-obs1-logging.js`) | None |
| AC2 | ✅ | T3, T4, T13 all pass — `llm_complete` event has `llm_duration_ms` and matching `correlationId` | automated test | None |
| AC3 | ✅ | T9 (`sse_open`), T10 (`sse_close` + `chunk_count`), T11 (`sse_error` + `error_message`) all pass | automated test | None |
| AC4 | ✅ | T7, T8, NFR-SEC-1 all pass — no fake access token or SESSION_SECRET value found in captured log output | automated test | None |
| AC5 | ✅ | T5, T6 pass — pino output is valid JSON with `level`/`time`/`msg`/`correlationId` | automated test | None |
| AC6 | ✅ | Full `npm test` run (207 commands) passes with 0 failures on this branch prior to merge; PR #381's "Run assurance gate" CI check passed | automated test + CI | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
No deviations recorded — implementation matches all 6 ACs as specified.

---

## Scope Deviations

None. Pino logging is scoped solely to the SSE turn handler (`handlePostTurnStreamHtml` in `src/web-ui/routes/skills.js`) — confirmed by code inspection that no other route acquired a logger call. No log aggregation config, no PII/turn-content logging, no log rotation/file output, and no runtime log-level switching were implemented, consistent with the story's Out of Scope section.

Note: the squash-merge for PR #381 also carried forward a large amount of pre-existing branch history unrelated to obs-1 (inc2/inc3/inc4 canvas-panel and condition-marker work, pmf.3 orientation wizard, and EXP-038/EXP-040 evaluation artefacts) that had accumulated on `feat/obs-1-pino-logging` before this story's work began. This is a PR-hygiene observation, not an obs-1 scope deviation — none of that code was introduced *by* obs-1's work. Logged below under DoD Observations.

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14
**Tests passing in CI:** 14 / 14

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 | ✅ | ✅ | correlationId non-empty string |
| T2 | ✅ | ✅ | correlationId unique across concurrent calls |
| T3 | ✅ | ✅ | llm_duration_ms positive integer |
| T4 | ✅ | ✅ | llm_complete includes correlationId |
| T5 | ✅ | ✅ | pino output valid JSON |
| T6 | ✅ | ✅ | correlationId propagated via child logger |
| T7 | ✅ | ✅ | access token absent from log output |
| T8 | ✅ | ✅ | SESSION_SECRET absent from log output |
| T9 | ✅ | ✅ | sse_open logged with correlationId |
| T10 | ✅ | ✅ | sse_close logged with chunk_count |
| T11 | ✅ | ✅ | sse_error logged with error_message |
| T12 | ✅ | ✅ | all turn events share correlationId |
| T13 | ✅ | ✅ | llm_duration_ms reflects actual adapter delay |
| NFR-SEC-1 | ✅ | ✅ | no secret values in log output |

**Gaps (tests not implemented):** None — all 14 planned tests implemented and passing.

**Coverage gap audit (CSS-layout-dependent gaps):** Not applicable — this is a server-side logging story with no UI/CSS surface.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — log emission must not add >5ms to SSE stream open time | ⚠️ | Not measured. Manual curl/browser timing comparison from the test plan was never run (no live server session available). RISK-ACCEPTed in `decisions.md` (2026-06-16) rather than asserted as met. |
| Security — no API keys, OAuth tokens, or session secrets in any log line | ✅ | NFR-SEC-1 + T7/T8 automated tests pass; pino call sites never pass `accessToken`, `clientSecret`, or `SESSION_SECRET` values |
| Data residency — not applicable | ✅ | stdout-only, no persistence or cross-region transfer |
| Availability — no SLA degradation | ✅ | Logging is additive; no change to request handling control flow on the happy path |
| Compliance — not required | ✅ | No named regulatory clause applies to this story |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Time to diagnose a hung SSE connection (target: ≤60s from logs alone) | ❌ | not-yet-measured | Merged minutes ago; no real hung-connection incident has occurred yet to measure against |
| M2 — LLM call duration recorded per turn (target: 100% of completing turns have llm_duration_ms) | ❌ | not-yet-measured | No production/staging turn volume yet since merge |
| M3 — Correlation trace completeness (target: 100% of SSE turns share correlationId) | ❌ | not-yet-measured | Same — no real traffic sample yet |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation = the unmeasured performance NFR, recorded as a RISK-ACCEPT — not an AC failure. All 6 ACs are fully satisfied with automated evidence.)

**Follow-up actions:**
- Run the manual SSE time-to-first-byte timing comparison (curl -N or browser Network tab) next time the server is run locally with a live session, to close out NFR-PERF-1 with real evidence.
- Re-check M1/M2/M3 signals once real session traffic has flowed through the merged code (no fixed date — opportunistic, next time anyone is debugging a turn or reviewing logs).

---

## DoD Observations

1. PR #381's squash-merge commit bundled ~180 files of pre-existing, unrelated branch history (inc2/inc3/inc4 canvas-panel work, pmf.3, EXP-038/EXP-040 evaluation artefacts) alongside obs-1's actual ~3-file implementation. This did not affect obs-1's correctness, but it means master's history for this merge is not a clean record of "what obs-1 shipped." Worth a `/improve` candidate: consider a pre-PR check or branch hygiene reminder that flags when a feature branch's diff is far larger than the story's own scope would suggest, so unrelated accumulated work gets split into its own PR before merge.
2. CI's "Trace Validation" check failed on first push to PR #381 with 11 schema violations in `pipeline-state.json`, none of which were caused by this story's edits — they were pre-existing gaps (missing `name`/`track`/`slug`) in two other unmerged features (`ideate-web-ux-inc2`, `ideate-web-ux-inc3`) that had simply never been schema-validated before, since they don't exist on `master`. Fixed as part of this PR (commit `d2e1591`). Worth flagging for `/improve`: schema validation only runs in CI on PRs that touch `pipeline-state.json`, so latent schema drift on long-lived feature branches can accumulate silently until an unrelated PR surfaces it.
3. Three master-branch push-triggered workflows ("Trace Commit", "Deploy dashboards to GitHub Pages", "Improvement Agent — Scheduled Dreaming") failed immediately after this merge with a bash syntax error (`unexpected token '('`) in `.github/workflows/trace-commit.yml`'s "Skip if trace-only commit" step. Root cause: `msg="${{ github.event.head_commit.message }}"` interpolates the raw commit message directly into a shell script — this squash-merge's commit body contained parentheses, which broke the script. This is a pre-existing CI fragility (and minor script-injection-shaped pattern), not something obs-1 introduced, but it is currently broken on master and will recur on any future commit message containing shell metacharacters. Flagged here for follow-up; not fixed as part of this DoD since it is unrelated to obs-1's scope.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add pino structured logging with turn correlation IDs and timing to the web server".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

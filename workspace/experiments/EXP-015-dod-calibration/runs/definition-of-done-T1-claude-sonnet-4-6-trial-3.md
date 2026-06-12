# /definition-of-done — ham.9 · Payment status webhook delivery

**DoD evaluated:** 2026-05-14
**PR:** #214 (merged)
**Evaluator:** /definition-of-done pipeline skill
**Prior DoR verdict:** PROCEED (Warning W1 acknowledged — load test deferred, operator committed to resolution before DoD)

---

## Evaluation summary

> **❌ FAIL — DoD not satisfied.**
>
> PR #214 delivers complete implementation and passes all unit/integration tests (5/5). However, AC4 carries no test coverage and the open performance gap (GAP-1) was never resolved or formally risk-accepted before merge. This story cannot be closed as done.

---

## AC-by-AC verdict

| AC | Description | Test coverage | Verdict | Notes |
|----|-------------|--------------|---------|-------|
| AC1 | HTTPS POST within 500ms on "settled" transition, correct body and HMAC header | T1, T2 — full | ✅ Pass | Both delivery trigger and signature correctness covered |
| AC2 | Retry up to 3×, exponential backoff (1s/2s/4s), dead-letter on third failure | T3, T4 — full | ✅ Pass | Backoff spy and dead-letter write both exercised |
| AC3 | Status-filtered subscriber suppressed for non-matching transitions | T5 — full | ✅ Pass | Filter logic verified |
| AC4 | P99 ≤ 500ms under 100 concurrent transitions, measured in integration environment | None — GAP-1 open | ❌ Fail | Performance SLA entirely untested; no risk acceptance on record |

---

## GAP-1 disposition audit

GAP-1 was flagged **HIGH RISK** in the test plan before DoR. At DoR, the operator acknowledged W1 with an explicit commitment that a load test would be added before DoD. The following checks were performed against that commitment.

| Check | Finding |
|-------|---------|
| Load test implemented in PR #214 | ❌ No — PR description lists no load test artefact or tooling |
| Load test added in a separate merged PR referencing ham.9 | ❌ Not evidenced |
| GAP-1 formally RISK-ACCEPTed in `/decisions` with authority sign-off | ❌ Not evidenced |
| GAP-1 status updated to closed in test plan | ❌ Still listed as Open |

**GAP-1 is unresolved.** The operator commitment made at DoR was not honoured, and no compensating decision record exists. The story has been merged in a state that was explicitly pre-identified as incomplete.

---

## Additional observations

### 1. Merge sequencing concern
PR #214 was merged while GAP-1 remained open and without a RISK-ACCEPT record. The DoR commitment created an expectation that this gate would be enforced before merge, not deferred to post-merge closure. This represents a process control gap that should be reviewed regardless of how GAP-1 is ultimately resolved.

### 2. WEBHOOK_SECRET runtime dependency — untested boundary
The PR notes that `process.env.WEBHOOK_SECRET` is read at dispatch time for rotation safety. This is a reasonable design choice, but the test artefact makes no mention of a test covering the behaviour when the variable is absent or malformed at dispatch time. This is not an AC breach, but it is a latent reliability gap worth a low-priority test.

### 3. Dead-letter path hardcoded
AC2 specifies `logs/webhook-dead-letter.jsonl`. No evidence that the path is configurable or that the `logs/` directory is guaranteed to exist in all deployment environments. Not an AC failure, but a deployment hygiene note for the integration environment used in AC4 testing.

---

## Required actions to achieve DoD pass

The following must be completed. This story should be reopened or tracked via a linked bug/task until these actions are closed.

---

### ACTION-1 — Implement and execute AC4 load test *(blocking)*

**Priority:** High
**Owner:** Engineer (ham.9 implementer)
**What is required:**

- Implement a load test that drives 100 concurrent payment status transitions against the integration environment.
- Measure P99 delivery latency to registered subscribers.
- The test must demonstrate P99 ≤ 500ms to satisfy AC4.
- Results must be committed to `artefacts/hamilton-webhooks/test-plans/` or an equivalent evidenced location and referenced from the test plan.
- Update GAP-1 status in `ham.9-test-plan.md` from Open to Closed with a link to results.

**If the SLA cannot be met:** A RISK-ACCEPT decision record must be raised in `/decisions` with explicit authority sign-off naming the accepted risk, the measured P99, and any agreed mitigation or timeline for resolution. The story may then be conditionally closed against that record.

---

### ACTION-2 — Resolve DoR commitment accountability *(blocking — process)*

**Priority:** High
**Owner:** Tech lead / delivery manager
**What is required:**

- Review how PR #214 was approved and merged with GAP-1 open and no RISK-ACCEPT on record, in direct contradiction of the DoR W1 commitment.
- Determine whether the PR review checklist or merge gate needs a step that cross-references open DoD-blocking gaps before approval.
- Document the outcome (process change, or explicit acknowledgement that the gap was a one-off deviation).

This action does not gate the technical DoD pass but must be closed to satisfy delivery governance for this epic.

---

### ACTION-3 — Clarify WEBHOOK_SECRET absence behaviour *(non-blocking, recommended)*

**Priority:** Low
**Owner:** Engineer
**What is required:**

- Add a test or documented behaviour for dispatch when `WEBHOOK_SECRET` is undefined.
- Acceptable outcomes: throw with a descriptive error at startup (fail-fast), or skip signing and log a warning (permissive). Either is acceptable; the behaviour should be explicit and tested.

---

## DoD checklist

| Gate | Status |
|------|--------|
| All ACs have passing tests | ❌ AC4 untested |
| All test plan gaps closed or formally RISK-ACCEPTed | ❌ GAP-1 open |
| PR merged with green CI | ✅ 5/5 tests pass |
| Implementation matches story scope (in-scope / out-of-scope respected) | ✅ In-memory Map, no replay, no subscriber-side verification |
| NFRs satisfied | ✅ None defined |
| DoR warnings resolved per operator commitment | ❌ W1 commitment not fulfilled |

---

## Final verdict

**❌ FAIL**

**Story ham.9 is not done.** Reopen the story. Assign ACTION-1 to the implementing engineer with a target resolution date. ACTION-2 is a delivery governance obligation and should be tracked at tech-lead level independently of the engineering fix.

A re-evaluation of DoD can be triggered once ACTION-1 evidence is available — either a passing load test result or a signed RISK-ACCEPT decision record.
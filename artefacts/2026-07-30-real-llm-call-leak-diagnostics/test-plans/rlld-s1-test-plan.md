## Test Plan: Add temporary diagnostic logging to identify the real-LLM-call leak source

**Story reference:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/stories/rlld-s1-diagnostic-logging.md

## AC Coverage

| AC | Description | Verification | Risk |
|----|-------------|--------------|------|
| AC1 | console.warn emitted with hostname/path/method/count/stack on a real-provider match | Code review of the diff; manual local invocation via `node --check` + a scripted `https.request` call against a stubbed hostname | 🟢 |
| AC2 | Wrapper still always forwards the call unmodified | Code review confirming `_origHttpsRequest.apply(https, arguments)` is unchanged and unconditional | 🟢 |
| AC3 | Next real staging-deploy run's logs reveal the actual caller | Cannot be verified locally — this is inherently a real-staging observation, captured promptly via `flyctl logs` after the next run fails | 🟢 |

## Coverage gaps

AC3 cannot be verified before merge — it is the entire purpose of this story, and by definition requires observing the next real failure against live `wuce-staging`. This is accepted and explicit, not a hidden gap.

## Test Data Strategy

No new fixtures. This story adds logging only; no test data changes.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 unverifiable pre-merge | Diagnostic logging can only be validated against the real leak once observed live | Capture `flyctl logs` promptly after the next staging-deploy failure — wuce-staging auto-suspends when idle and the log buffer is small/rotates quickly |

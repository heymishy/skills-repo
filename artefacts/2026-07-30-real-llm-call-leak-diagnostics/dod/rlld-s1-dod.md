# Definition of Done: Add temporary diagnostic logging to identify the real-LLM-call leak source

**PR:** https://github.com/heymishy/skills-repo/pull/641 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/stories/rlld-s1-diagnostic-logging.md
**Test plan:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/test-plans/rlld-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-real-llm-call-leak-diagnostics/dor/rlld-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `console.warn` added to the `https.request` monkey-patch, logging hostname/path/method/count/stack trace on a real-provider hostname match | Code review of merged diff | None |
| AC2 | ✅ | Wrapper still unconditionally forwards to the original `https.request` | Code review of merged diff | None |
| AC3 | ✅ | The very next staging-deploy run's `flyctl logs` (captured promptly) identified `handlePostProductNew` → `generateProductDraft`'s buggy wiring as the exact real-call source, via the stack trace this diagnostic emitted | Direct log capture and analysis, same session, feeding directly into rlld-s2's fix | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A — diagnostic-only story, no new automated tests (by design; verification is live-log observation)
**Tests passing in CI:** N/A

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| N/A — diagnostic logging verified via live staging logs | — | ✅ | Successfully identified the leak source on the first staging-deploy run after merge |

**Gaps (tests not implemented):** None — this story's own test plan scoped verification as live-log observation, not automated tests, and that verification succeeded.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — no secrets logged | ✅ | Code review confirmed only hostname/path/method/stack trace logged, no headers or body content |
| Performance — negligible | ✅ | Only fires on the rare real-provider-hostname-match path |

---

## Metric Signal

No benefit-metric artefact — short-track bug investigation, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None — this story's explicit purpose (identify the leak source) succeeded, and the identified leak was fixed by the direct follow-up, rlld-s2 (also DoD'd in this batch). The diagnostic logging itself was removed as part of rlld-s2's fix, per this story's own stated intent.

---

## DoD Observations

1. This diagnostic-logging-then-fix pattern (rlld-s1 → rlld-s2) was reused twice more later in the same investigation (tpwd-s1 → seic-s1), each time successfully isolating a root cause that pure code review alone had not conclusively identified. Worth noting as a validated technique for this class of "staging-only, real-log-dependent" bug.

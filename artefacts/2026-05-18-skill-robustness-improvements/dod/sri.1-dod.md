# Definition of Done: Add git fetch timeout and fallback in inner-loop skills

**PR:** https://github.com/heymishy/skills-repo/pull/410 | **Merged:** 2026-06-25
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.1.md
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.1-test-plan.md
**DoR artefact:** artefacts/2026-05-18-skill-robustness-improvements/dor/sri.1-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `/branch-complete` logs warning and falls back to local branch copy without hanging when origin is absent | ✅ | T1 (`branch-complete-contains-fetch-timeout-and-fallback`), T2 (`branch-complete-contains-local-copy-fallback-path`), T3 (`branch-complete-contains-origin-not-reachable-warning`) all pass. `skills/branch-complete/SKILL.md` now wraps `git fetch origin master` in `try/catch` with `timeout: 5000`, falls back to local branch copy, and emits a `WARNING: origin not reachable` message. | Automated test (13/13 passing) | None |
| AC2 — `/implementation-plan` logs warning and falls back without hanging when origin is absent | ✅ | T4 (`implementation-plan-contains-fetch-timeout-and-fallback`), T5 (`implementation-plan-contains-local-copy-fallback-path`), T6 (`implementation-plan-contains-origin-not-reachable-warning`) all pass. Same try/catch pattern applied to `skills/implementation-plan/SKILL.md`. | Automated test | None |
| AC3 — `/subagent-execution` logs warning and falls back without hanging when origin is absent | ✅ | T7 (`subagent-execution-contains-fetch-timeout-and-fallback`), T8 (`subagent-execution-contains-local-copy-fallback-path`), T9 (`subagent-execution-contains-origin-not-reachable-warning`) all pass. Same try/catch pattern applied to `skills/subagent-execution/SKILL.md`. | Automated test | None |
| AC4 — 5-second timeout: skill treats fetch failure as timeout and continues after at most 5 seconds | ✅ | T1, T4, T7 all verify `timeout: 5000` is present in the try/catch block in each skill file. | Automated test | None |
| AC5 — When origin is healthy and reachable, behaviour is unchanged; `git fetch origin master` still executes normally | ✅ | T10 (`git-fetch-origin-master-instruction-still-present`) passes — the instruction is retained in all three files; the try/catch wraps it, not replaces it. The happy path reads from `origin/master` unchanged. | Automated test — regression guard | None |

## Scope Deviations

None. Only the three named SKILL.md files were modified. No retry logic, no operator-configurable timeout, no schema changes, no log persistence.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 branch-complete-contains-fetch-timeout-and-fallback | ✅ | ✅ | |
| T2 branch-complete-contains-local-copy-fallback-path | ✅ | ✅ | |
| T3 branch-complete-contains-origin-not-reachable-warning | ✅ | ✅ | |
| T4 implementation-plan-contains-fetch-timeout-and-fallback | ✅ | ✅ | |
| T5 implementation-plan-contains-local-copy-fallback-path | ✅ | ✅ | |
| T6 implementation-plan-contains-origin-not-reachable-warning | ✅ | ✅ | |
| T7 subagent-execution-contains-fetch-timeout-and-fallback | ✅ | ✅ | |
| T8 subagent-execution-contains-local-copy-fallback-path | ✅ | ✅ | |
| T9 subagent-execution-contains-origin-not-reachable-warning | ✅ | ✅ | |
| T10 git-fetch-origin-master-instruction-still-present (regression) | ✅ | ✅ | |
| T11 branch-complete-warning-does-not-log-remote-url (NFR-SEC) | ✅ | ✅ | |
| T12 implementation-plan-warning-does-not-log-remote-url (NFR-SEC) | ✅ | ✅ | |
| T13 subagent-execution-warning-does-not-log-remote-url (NFR-SEC) | ✅ | ✅ | |

**Test gaps:** 1 — live runtime verification that the fallback actually fires in a no-origin repo. Tests confirm the instruction text (timeout, fallback, warning) is present in the SKILL.md files; they cannot execute the fetch against a real absent remote. This is the established text-level verification pattern for SKILL.md stories in this pipeline. Runtime confirmation is the responsibility of the OrderHub team per the M1 measurement plan.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — fallback activates within 5 seconds of fetch failure | ✅ | `timeout: 5000` present in try/catch block in all three SKILL.md files (T1, T4, T7 pass). Text instructs operator to apply the 5-second limit; runtime behaviour is bounded. |
| Security — warning must not include remote URL, credentials, or command error output | ✅ | T11, T12, T13 (NFR-SEC regression guards) all pass. The warning text reads: "origin not reachable — falling back to local branch copy. Verify state accuracy before merging." — no URL, no credential, no error output. |

---

## Metric Signal

Is measurement possible yet for M1 (Inner loop hang-free rate on no-origin repos)? **Not yet.**

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Inner loop hang-free rate on no-origin repos | not-yet-measured | The timeout + fallback instruction text is present and verified in all three SKILL.md files (13/13 tests pass). Runtime measurement requires a real session in a no-origin repo — not yet run. OrderHub team (abhijeet-qsofte) to confirm on their environment per the M1 measurement plan. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (live runtime fallback — accepted by design; text-level verification is the standard for SKILL.md stories)

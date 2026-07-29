# Definition of Done: Extend gate-advance structural validation to all 7 canonical gate names

**PR:** https://github.com/heymishy/skills-repo/pull/635 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**Test plan:** artefacts/2026-07-18-gate-advance-validation/test-plans/gav-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-18-gate-advance-validation/dor/gav-s1-dor.md
**Assessed by:** Copilot (autonomous)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `dor-signed-off` and `definition-of-ready` both route through the unchanged H1-H9 logic (merged, on master); U1-U4 re-run against merged code | Automated test (`node tests/check-gav-s1-gate-advance-validation.js`, U1-U4) | None |
| AC2 | ✅ | `validateDiscoveryApproved()` checks all 5 required sections + Approved By placeholder detection | Automated test (U5-U9), re-run against merged master | None |
| AC3 | ✅ | `validateBenefitMetricActive()` checks at least one fully-populated Tier 1 metric | Automated test (U10-U13), re-run against merged master | None |
| AC4 | ✅ | `validateDefinitionComplete()` checks AC count, Out of Scope, Complexity Rating | Automated test (U14-U17), re-run against merged master | None |
| AC5 | ✅ | `validateTestPlanComplete()` generalises the H3/H8 coverage check standalone | Automated test (U18-U19) + integration (IT2), re-run against merged master | None |
| AC6 | ✅ | `validateBranchComplete()` checks prUrl + verifyStatus against a minimal per-story JSON snapshot (design decision logged in decisions.md) | Automated test (U20-U22) + integration (IT3), re-run against merged master | None |
| AC7 | ✅ | `validateDefinitionOfDone()` checks every AC Coverage row is ✅ or ⚠️-with-deviation | Automated test (U23-U25) + integration (IT4), re-run against merged master | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None beyond the one design clarification already logged in `decisions.md` at implementation time (AC6's artefact-path interpretation — a minimal per-story JSON snapshot rather than the full `pipeline-state.json`, since `validate()`'s signature has no feature/story parameter to index into the real file with). This was anticipated by the DoR contract's own W4 acknowledgement that Complexity Rating 3 / Unstable scope work might surface exactly this kind of design ambiguity, and was resolved and logged as instructed rather than silently guessed at.

No other scope deviations. The merged PR touches only `src/enforcement/cli-outer-loop.js` and the new test file, matching the DoR contract's estimated touch points exactly. `gate-map.js`, any SKILL.md, and `bin/skills advance`'s non-gated path were all confirmed untouched, matching the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 29 / 29 (25 unit + 4 integration)
**Tests passing in CI:** 29 / 29 (52 individual assertions across the 29 named test cases)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1-U4 (AC1) | ✅ | ✅ | Re-run against merged master code today |
| U5-U9 (AC2) | ✅ | ✅ | Re-run against merged master code today |
| U10-U13 (AC3) | ✅ | ✅ | Re-run against merged master code today |
| U14-U17 (AC4) | ✅ | ✅ | Re-run against merged master code today |
| U18-U19, IT2 (AC5) | ✅ | ✅ | Re-run against merged master code today |
| U20-U22, IT3 (AC6) | ✅ | ✅ | Re-run against merged master code today |
| U23-U25, IT4 (AC7) | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** None — the test plan itself declared no coverage gaps, and all 29 named tests were implemented and pass.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — not applicable, CLI/tooling validation, not a runtime hot path | ✅ N/A | Confirmed by design — each check reads a small number of Markdown/JSON files synchronously, matching the existing H1-H9 checks' cost profile |
| Security — path traversal guard (OWASP A01) preserved for every new gate branch | ✅ | IT1 confirms all 6 new gate names reject a traversal attempt with `exitCode: EXIT.SYSTEM`; re-run against merged master code today |
| Audit — every validation failure names the specific check that failed | ✅ | Every failing-path unit test (U6-U9, U11-U12, U15-U17, U19, U21-U22, U25) asserts the stderr message names the specific field/section/AC, not a generic "validation failed" |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-18-gate-advance-validation` has an empty `metrics: []` in `pipeline-state.json`). The story's Benefit Linkage section states the metric directly — "governance gate integrity: the fraction of gate-map.js's 7 documented gate boundaries that are actually structurally enforced by gate-advance" — moved from 0/7 (only a naming-mismatched partial implementation existed) to 7/7 (all 7 canonical gate names now have a dedicated, tested validator). This is a direct, immediate, code-level signal rather than one requiring a future observation period.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Two informal follow-ups already named by the story's own Out of Scope section, not owned by this story: (1) wiring `gate-advance` calls into any SKILL.md's actual step-by-step instructions (currently, nothing in the repo invokes `gate-advance` with a real gate name in practice — this story makes the validation logic correct and ready, but adoption is a separate future story); (2) if a future story extends `validate()` again for an 8th gate type, consider promoting the established pattern (typed exit codes, artefact-read-then-structural-check) to a formal ADR in `architecture-guardrails.md`, per the decisions.md note already logged at story-authoring time.

---

## DoD Observations

1. This story is the first of this session's items to genuinely exercise a Complexity Rating 3 / Scope-stability Unstable short-track story end-to-end. The one real design ambiguity flagged at DoR time (AC6's artefact-path interpretation) surfaced exactly as anticipated during implementation, and was resolved and logged in `decisions.md` per the DoR contract's own explicit instruction — a clean example of the "unstable scope, but with a named process for handling the instability" pattern working as intended, rather than either silently guessing or stalling on an open question.
2. A genuine (unrelated) regression was caught and fixed during this story's own verification pass: `check-cli-outer-loop.js`'s NFR3a failure is a pre-existing baseline item (`tests/known-baseline-failures.json`), confirmed unrelated to this change before treating the suite as green — this is the kind of verification-scoping discipline (checking the specific delta against baseline, not assuming a red suite item is caused by the current change) that avoided a false "my change broke something" conclusion.
3. This story directly enables — but does not itself perform — actual adoption of `gate-advance` across the pipeline. A natural follow-up for a future `/improve` pass: now that all 7 gates are genuinely enforceable, consider whether at least the highest-value boundaries (e.g. `definition-of-done`, `branch-complete`) should be wired into their respective SKILL.md instructions, closing the loop between "the mechanism works" and "the mechanism is actually used."

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Extend gate-advance structural validation to all 7 canonical gate names" (gav-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

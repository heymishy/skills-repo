# Definition of Done: Drift-comparator recognizes subgraphs

**PR:** #788 — "S4: Drift-comparator recognizes subgraphs" | **Merged:** 2026-08-30 (03:47:56Z)
**Story:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s4-drift-comparator-subgraphs-test-plan.md
**DoR artefact:** artefacts/2026-08-29-diagram-validation-and-types/dor/s4-drift-comparator-subgraphs-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `nodesInsideSubgraphAreCapturedNotDropped` — both nodes inside a `subgraph ... end` block captured in the flat `nodes` array | `tests/check-s4-drift-comparator-subgraphs.js` (unit) | None |
| AC2 | ✅ | `edgeAcrossSubgraphBoundaryResolvesCorrectly` — both directions (outside→inside, inside→outside) resolve both endpoints correctly | `tests/check-s4-drift-comparator-subgraphs.js` (unit) | None |
| AC3 | ✅ | `subgraphGroupedAsDesignedMatchesFlatAsBuilt` — subgraph-grouped as-designed vs. flat as-built returns MATCHED; a genuine structural difference is still caught as DIVERGED even when one side uses a subgraph | `tests/check-s4-drift-comparator-subgraphs.js` (integration) | None |
| AC4 | ✅ | `s3RegressionAndExistingNonSubgraphFixturesStillPass` — S3's labeled/multi-target edge syntax and all pre-existing `drift-comparator.js` fixtures pass unmodified | `tests/check-s4-drift-comparator-subgraphs.js` (regression) + full suite | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Out-of-scope items (nested subgraphs, visual subgraph styling/layout direction) were not touched.

**Notable, but not a scope deviation:** the story shipped with **no production code change**. Empirical testing during implementation planning (4 scenarios run directly against the unmodified `parseFlowchartMermaid`) found subgraphs already parse correctly today — `subgraph`/`end`/`direction` lines simply fail to match `NODE_DECL_RE`/`EDGE_RE` and are silently skipped, while nested node/edge declarations are matched individually regardless of indentation. The story's actual deliverable was dedicated test coverage closing the untested gap identified by metric M2, not a bug fix. Logged as an `ASSUMPTION` entry in `decisions.md` (2026-08-30), including the DoR contract's own inline correction note. Mutation-tested per the story's Architecture Constraint: a deliberate regression (naive "skip everything between `subgraph` and `end`") was temporarily introduced, confirmed to fail 5 of 7 new tests for the expected reason, then fully reverted (confirmed via empty `git diff`) — proving the new tests have real detection power against the failure mode they guard against.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (7 assertions total — AC2 and AC4 each cover two directions/cases)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| nodesInsideSubgraphAreCapturedNotDropped | ✅ | ✅ | |
| edgeAcrossSubgraphBoundaryResolvesCorrectly | ✅ | ✅ | Both directions verified (2 assertions) |
| s3RegressionAndExistingNonSubgraphFixturesStillPass | ✅ | ✅ | |
| subgraphGroupedAsDesignedMatchesFlatAsBuilt | ✅ | ✅ | Includes a genuine-DIVERGED counter-case (2 assertions) |
| subgraphParsingAddsNoModelOrNetworkCall | ✅ | ✅ | Implicit — no new async call sites introduced; confirmed by story suite passing synchronously |

**Story suite:** 7/7 passing (`node tests/check-s4-drift-comparator-subgraphs.js`, re-run 2026-08-30)
**Full suite:** 572/572 files passing, 0 failures (`node scripts/run-all-tests.js`, re-run 2026-08-30 against current master tip, post jgcc-s1/cptr-s1/csdl-s1/sccf-s1 merges)

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No additional model/LLM call for diagnostic generation | ✅ | Story suite confirms `parseFlowchartMermaid`/`compareSystemArchitecture`/`compareProgramDesign` remain synchronous — no new async call sites; no production code changed at all |
| Diagnostic text escaping (S1/S2 only — N/A to S4) | N/A | Not applicable to this story |
| Mermaid sanitization coverage (S5 only — N/A to S4) | N/A | Not applicable to this story |
| Data classification: Internal | ✅ | No customer PII or payment data involved — diagram structure only |

NFR profile at `artefacts/2026-08-29-diagram-validation-and-types/nfr-profile.md` is shared across S1–S5; the Performance NFR row applicable to S4 is fully evidenced above. Profile left `Active` (not yet `Verified`) — S5 still open.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m2 — Drift-comparator parsing accuracy | ✅ (0 — no test fixtures existed for labeled edges, multi-target edges, or subgraphs) | 2026-08-30 | Target ("dedicated passing fixtures for labeled edges, multi-target edges, and subgraphs, for both parser functions") is now fully met — S3 closed labeled/multi-target edges, S4 closes the third and final named gap (subgraphs). Signal: **on-track**. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story.

---

## DoD Observations

1. This story shipped as a **test-only PR with zero production code change** — a legitimate outcome when empirical investigation during implementation planning finds the assumed bug doesn't exist. Worth feeding back to `/definition` or `/implementation-plan` guidance as a normal, expected path (not a deviation) when a DoR contract's proposed fix turns out to target already-correct behaviour — the correct action is to update the contract in place (as done here) and ship coverage, not to force a no-op code change for appearances. Candidate for `/improve`.
2. Metric m2's `contributingStories` array in `pipeline-state.json` currently lists only `s3-drift-comparator-labeled-multi-target-edges`; this DoD run adds `s4-drift-comparator-subgraphs` per the mandatory state-update step below, since S4 is the story that closes the metric's target in full.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Drift-comparator recognizes subgraphs.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

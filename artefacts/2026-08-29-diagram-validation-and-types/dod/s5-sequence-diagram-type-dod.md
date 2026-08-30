# Definition of Done: Add the Sequence diagram type, conditionally emitted

**PR:** #796 — "S5: Add the Sequence diagram type, conditionally emitted" | **Merged:** 2026-08-30 (06:41:21Z)
**Story:** artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
**Test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s5-sequence-diagram-type-test-plan.md
**DoR artefact:** artefacts/2026-08-29-diagram-validation-and-types/dor/s5-sequence-diagram-type-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | Not yet verified with a real model turn — see DoD Observations | Manual (deferred) | See below |
| AC2 | ⚠️ | Not yet verified with a real model turn — see DoD Observations | Manual (deferred) | See below |
| AC3 | ✅ | `sequenceTypeRendersViaSharedBuildDiagramBodyHtml`, `sequenceTypeRenderFailureUsesS1S2DiagnosticsAutomatically` (both passing) **plus live confirmation**: a real `sequence`-type marker rendered as a genuine mermaid SVG sequence diagram (lifelines for `CI Pipeline`/`Release Gate Service`/`Postgres`, ordered messages) in a real browser session on `wuce-staging.fly.dev`, 2026-08-30, via the `design.diagram-showcase.json` mock fixture reached through the `mgss-s1`+`msps-s1` scenario-selection mechanism. Same type-tag/title/wrapper/text-alternative shape as System Architecture, confirmed visually. | Automated (unit) + Manual (live, real browser) | None |
| AC4 | ✅ | `readOnlyHistoryViewRendersSequenceBlockIdenticallyToLiveView` (passing) | Automated (unit) | None |
| AC5 | ✅ | `typeAllowIncludesSequence` (passing) | Automated (unit) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

**Full suite:** 574/574 files passing, 0 failures (confirmed at merge; re-confirmed clean multiple times since via later stories' own full-suite runs).

**Gaps (tests not implemented):** AC1/AC2's own test plan already classified them as `Untestable-by-nature` (Jest) by design — the gap is not a missing test, it's the deferred *manual* scenario itself (see below).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no new model/network call | ✅ | `noNewModelOrNetworkCallForSequenceType` passing |
| Security: mermaid `securityLevel: "strict"` | ✅ | `sequenceMermaidCoveredBySameSecurityLevelStrict` passing, and confirmed live — the real mermaid render on staging used the shared `strict` config, no per-type override |
| Accessibility: text-alternative `<details>` | ✅ | `sequenceDiagramAccessibleViaSameTextAlternative` passing, and confirmed live — "View diagram source (text alternative)" present and functional in the real render |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m3 — New diagram type (sequence) adoption | ✅ (0% — the sequence type did not exist before this story) | Not yet — target is "at least 1 genuine (non-test) emission within 4 weeks of shipping." Today's live verification used the mocked `diagram-showcase` scenario, not a genuine real-model emission, so it does not count toward this metric. Signal: **not-yet-measured**. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **AC1/AC2 still need a genuine real-model verification** — the DoR's own W4 RISK-ACCEPT always intended this as a post-merge manual smoke test (verification script Scenarios 1 and 2), not a permanent gap. What's new since DoR: the mechanism to reach `design`/`definition` deterministically via a mocked journey now exists and was proven live today (`mgss-s1` + `msps-s1`), but AC1/AC2 specifically test the model's own judgment about *when* to emit a sequence marker — which requires the real LLM gateway, not the mock. Doing this costs real API tokens and requires toggling the mock gateway off (an admin action `/admin/mock-gateway`, blocked for this agent's own permission scope) — owner: **operator**. Recommended approach: toggle the mock gateway off briefly, run two real `/design` sessions (one genuinely interaction-shaped feature, one that clearly isn't), confirm the model correctly emits/withholds a `sequence` marker in each, then toggle back on. Update this DoD's AC1/AC2 rows once done.
2. Once AC1/AC2 are confirmed, this DoD's Outcome should be updated to **COMPLETE**.

---

## DoD Observations

1. **This story's own DoD process directly produced 2 follow-up stories** (`mgss-s1`, `msps-s1`) — both were found and fixed specifically because closing out this DoD required trying to actually use the platform's own mocked-verification tooling for its stated purpose, and it didn't work the first two times. This is a strong, concrete example of the DoD gate doing its job: a story that looked fully done by its own automated tests (3/5 ACs auto-verified, 0 failures) surfaced two real, separate defects in *adjacent* infrastructure the moment someone tried to close the remaining 2/5 ACs for real.
2. **Live confirmation of AC3 exceeded the original test plan's own ambition** — the test plan scoped AC3 as a jsdom-level unit test (no real browser, no real mermaid.js execution). Today's live Chrome session additionally confirmed the diagram renders correctly with real mermaid.js in a real browser on real infrastructure — strictly stronger evidence than what was originally planned, recorded here for completeness even though it wasn't a formal requirement.
3. Candidate `/improve` signal: the AC1/AC2 gap shape (a live-model judgment call, RISK-ACCEPTed at DoR, requiring a real-token post-merge manual check) is now a repeated pattern across this feature and others. Worth considering whether the DoR/verification-script templates should have a standard field for "how to trigger a real-model check for this specific gap" (e.g. "toggle mock gateway off, use these 2 contrasting prompts") so it doesn't need to be rediscovered per-story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Add the Sequence diagram type, conditionally emitted.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

# Definition of Done: Recognize the H2-epic/H3-story (Format A) definition-artefact shape

**PR:** https://github.com/heymishy/skills-repo/pull/801 | **Merged:** 2026-08-31 (`3be4b94efe34ad4c696d05bf9c573ef493aba755`)
**Story:** artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md
**Test plan:** artefacts/2026-08-31-definition-artefact-story-id-parsing/test-plans/daep-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-31-definition-artefact-story-id-parsing/dor/daep-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Format A recognized, document order): `extractStoryIdsFromDefinitionArtefact` new third branch; both hyphenated (`ep1-s1`) and dotted (`wgol.1`) slug fixtures pass | `tests/check-daep-s1-format-a-epic-h2-story-h3.js`, 2/2 AC1 cases | None |
| AC2 | ✅ | AC2 (auto-populate via `GET /journey/:id/stories`): real-render harness confirms textarea pre-filled with both extracted slugs and the "pre-filled below" copy shown, not the manual-entry copy | Same test file, AC2 case | None |
| AC3 | ✅ | AC3 (unrecognized artefact still returns `[]`, no regression): `UNRECOGNISED_ARTEFACT` fixture still returns `[]`, no throw | Same test file, AC3 case | None |

---

## Scope Deviations

None. Format B (flat H2) and Format C (H1 epic/story) behavior is unchanged — confirmed by re-running their exact fixtures from `check-dsda-s1-default-all-stories.js` inline in the new test file (NFR case), and by that pre-existing suite passing unchanged in the full run. No change to the client-side `parseDefinitionArtefact`, `handleGetStories`, or `handlePostStories` beyond what the extractor now returns, matching the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 (AC1 ×2 fixtures, AC2, AC3, NFR)
**Tests passing in CI:** 578/578 full suite (0 failures), including the pre-existing `check-dsda-s1-default-all-stories.js` (5/5) run unchanged

**Gaps (tests not implemented):** None. This is a pure function with no I/O or state; every AC was directly unit-testable, as declared at test-plan time.

**Layout gap audit:** N/A — no CSS-layout-dependent ACs.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to Format B / Format C | ✅ | Existing `check-dsda-s1-default-all-stories.js` (5/5) plus this story's own inline regression case both pass unchanged |
| No new npm dependencies | ✅ | Diff touches only `src/web-ui/routes/journey.js` (logic) and one new test file |

---

## Metric Signal

No formal benefit-metric artefact — short-track bug fix. The operational signal is direct: this closes the real root cause of a live production report (journey `af17f555-dfa9-4f66-910b-32bec32d66b7`, the `cross-channel-feature-continuity` feature) where `/journey/:id/stories` fell back to an empty manual-entry textarea despite a well-formed, fully-readable definition artefact on disk. First real observation will be the operator resuming that exact journey post-promotion and confirming the story list auto-populates with all 6 `ep1-sN` slugs instead of an empty form — not yet observed as of this DoD (promotion to production pending).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Once promoted to production, confirm journey `af17f555` now auto-populates its story list (the original triggering incident) — operator-run, not automatable from here since it requires the live production journey record.
2. No code follow-up required. The fix is additive and self-contained.

---

## DoD Observations

1. **A misdiagnosis was caught and corrected within the same session.** The initial bug report ("review asks which stories") was first attributed to `/review`'s own SKILL.md chat prompt (`rssp-s1`, PR #799) — a real, independently-valid fix — but re-investigating the *exact* journey/URL the operator originally linked (`/journey/af17f555.../stories`) revealed a second, unrelated root cause in a hardcoded form-rendering function, not the model's chat behavior at all. Worth citing in a future `/improve` pass: when a bug report includes a specific URL, fetching that URL's actual rendering code before proposing a fix — rather than pattern-matching the symptom description to the most recently-touched adjacent skill — would have caught this on the first pass.
2. **Client/server parser drift is a standing risk in this codebase.** `journey.js`'s server-side extractor and `skills.js`'s client-side `parseDefinitionArtefact` are two independent hand-maintained implementations of the same three-format detection logic, linked only by a code comment ("MUST mirror that function's story-ID regexes exactly"). This is the second time this exact function has needed a fix for exactly this reason (`dsda-s1` originally implemented 2 of 3 documented formats). A future hardening candidate: extract the shared format-detection/parsing logic into one function both call, removing the manual-mirroring requirement entirely — flagged here, not undertaken in this fix (out of scope, would have expanded the PR beyond the incident-driven fix).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Recognize the H2-epic/H3-story
(Format A) definition-artefact shape (daep-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable
   behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a
   recorded trigger?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE)
   consistent with the AC and deviation rows?
4. Is Follow-up action #1 (confirming journey af17f555 auto-populates
   post-promotion) tracked somewhere an operator will actually see it, not
   just buried in this file?
Report findings as HIGH / MEDIUM / LOW.
```

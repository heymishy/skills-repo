# Definition of Done: Replace the multi-story artefact accordion with a compact feature-level table and document matrix

**PR:** https://github.com/heymishy/skills-repo/pull/841 | **Merged:** 2026-09-05 (commit `9b8c3e56fbde1f773604d2ab203d658f79bdf054`)
**Story:** artefacts/2026-09-06-feature-artefact-document-matrix/stories/fadm-s1-replace-artefact-accordion-with-document-matrix.md
**Test plan:** artefacts/2026-09-06-feature-artefact-document-matrix/test-plans/fadm-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-06-feature-artefact-document-matrix/dor/fadm-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-fadm-s1-document-matrix.js` — feature-level documents render as one table, including a type outside the 4 known labels | automated unit | None |
| AC2 | ✅ | Same file — dynamic column union, dash for gaps, correct link hrefs, epic-divider grouping | automated unit | None |
| AC3 | ✅ | Same file — DoR vs DoR Contract column separation, plus a standalone column-derivation test covering 8 real path shapes | automated unit | None |
| AC4 | ✅ | Same file — epic document linked from its divider row, not duplicated; graceful when absent | automated unit | None |
| AC5 | ✅ | Same file — single-story rendering unchanged (regression guard) | automated unit | None |
| AC6 | ✅ | Same file — resume-conversation affordance preserved (regression guard) | automated unit | None |
| AC7 | ✅ | Live production DOM check via Chrome, post-deploy, across all 3 named features: `psh` (80 ticks, 0 dashes — fully complete — table+matrix present, 0 old accordion elements, a tick opens real story content), `phase3` (154 ticks, 28 dashes across 33 rows — genuine gaps on an in-progress feature, correctly rendered; a tick opens real content), `wfp` (99 ticks across 22 rows, `wfp.11` — `sri-s1`'s own registration fix — correctly present as its own row) | manual (live production verification) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

One deviation from the DoR contract's own stated plan, discovered during implementation and deliberately not forced through: the contract proposed removing `.sw-epic-group`/`.sw-story-row` CSS once confirmed unused. On checking, it wasn't — `fpux.1`'s own dedicated E2E suite (`fpux.1-contrast-ratio.spec.js`, `fpux.1-keyboard-focus.spec.js`, `fpux.1-visual-consistency-theme.spec.js`) still exercises those classes directly against hand-authored fixtures, independent of this route. The CSS and `renderStory()` are left in place rather than forcing a wider, unscoped test-retirement exercise. Two existing tests that asserted the *old* accordion's real rendered output on this specific route (`check-fapg-s1`'s route-level test, `check-fpux.1-unify-visual-language.js`'s own AC1) were updated in place to assert the new matrix markup instead — an intentional supersession, documented in both the story and the commit message, not a silent deletion.

---

## Test Plan Coverage

**Tests from plan implemented:** 27 / 27 (test plan's own upfront estimate was 16 — RED/GREEN implementation surfaced more granular assertions, all still mapping cleanly to the same 7 ACs)
**Tests passing in CI:** 27 / 27 — confirmed via PR #841's own CI run and directly, locally, before merge. Full suite: 622 files, 1 pre-existing failure (`check-p3.5-validate-trace.js` — an unrelated feature's `discovery.md` stuck in Draft status) unrelated to this diff. Existing `check-fapg-s1` (7/7), `check-fpux.1-unify-visual-language` (6/6), `check-bsgm-s1` (8/8), `check-sri-s1` (10/10), `check-adlr-s1` (15/15) regression suites all pass, two of them (`check-fapg-s1`, `check-fpux.1-unify-visual-language`) updated in place per the Scope Deviations note above.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 feature-level table, including an unlisted type (2 tests) | ✅ | ✅ | `check-fadm-s1-document-matrix.js` |
| AC2 dynamic columns, dashes, links, epic-divider grouping (4 tests) | ✅ | ✅ | Same file |
| AC3 DoR/DoR-Contract separation + standalone derivation test (3 tests) | ✅ | ✅ | Same file |
| AC4 epic doc linked once, graceful when absent (2 tests) | ✅ | ✅ | Same file |
| AC5 single-story regression guard (1 test) | ✅ | ✅ | Same file |
| AC6 resume-conversation regression guard (1 test) | ✅ | ✅ | Same file |

**TDD verification performed (RED confirmed, not assumed):** the implementation was written first in this session (design already interactively pre-validated via a live mockup), then the test file was run against it and 2 assertion bugs in the tests themselves were caught and fixed before declaring GREEN (a regex not accounting for nested `<td>` markup; a raw-substring check that didn't account for `encodeURIComponent`'s `%2F` encoding of the epic-doc link) — both fixed to assert correctly, documented in the session record.

**Coverage gap audit (Step 4):** AC7 is the story's own designated manual-verification AC (per the DoR contract's own RISK-ACCEPT — a pure rendering change against real, already-approved production features cannot be meaningfully simulated beyond what AC1-6's unit tests already prove). Executed directly against real production across all 3 named features, not deferred: `layoutGapsAtMerge`: **false** — the gap was open at merge (deploy pipeline was still in flight) but is now closed as of this DoD, with concrete evidence recorded above, including confirmation that genuine incompleteness (phase3's 28 dashes) renders correctly, not just the fully-complete case.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no regression | ✅ (informal) | Pure string-building over already-fetched artefact arrays; no new I/O, no additional requests; no automated test scoped for a presentation-only change |
| Security — none identified | ✅ N/A | No new input surface; all links reuse `adlr-s1`'s own already-tested `encodeURIComponent` convention |
| Accessibility — not applicable | ✅ (informal) | Native `<table>` markup (screen-reader-navigable by default); tick/dash cells use real anchor elements with `title` attributes; no automated axe/contrast test scoped for this short-track story |
| Audit — not applicable | ✅ N/A | No new state-changing action introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track story (per `CLAUDE.md`'s short-track convention). The story's own "Benefit linkage" section names the defect closed directly: operator-reported verbosity on the multi-story artefact-index page. First signal: confirmed closed in production 2026-09-06 via direct verification on 3 real features — the same real `psh` dataset originally used to prove the problem (54 card sections) now renders as 2 elements (1 table + 1 matrix), and the design generalises correctly to a feature with genuine incompleteness (`phase3`) and to a feature exercising `sri-s1`'s own prior fix (`wfp`).

---

## Outcome

**COMPLETE**

All 7 ACs satisfied with concrete, automated (AC1–AC6) and direct live-production (AC7) evidence across 3 real features covering the full/incomplete/registration-edge-case spread. One documented, justified scope deviation (CSS/test retention). No test gaps.

**Follow-up actions:**
1. None outstanding against this story's own scope. The multiple "no other consumer" checks this session correctly caught a second dependent test file (`check-fpux.1-unify-visual-language.js`) beyond the one named in the DoR contract — both are now fixed, so no residual test debt remains.
2. A related, separate gap surfaced during AC7's own live verification: `2026-04-19-skills-platform-phase4` (a real, distinct, 205-file archived feature — not `phase4-opus`) has zero story/epic registration in `pipeline-state.json` at all, so it never reaches this story's own rendering — it falls back to the old flat listing (73 type-grouped cards). Confirmed not a regression from this story (same behaviour pre-dates `fadm-s1`); needs its own dedicated epic/story discovery and registration pass given its size (~30 real work items). Logged in `workspace/capture-log.md`, 2026-09-06.

---

## DoD Observations

1. **Interactive design validation before code paid off directly.** Because the table/matrix design was already approved via a live, iterated mockup (2 rounds of real user feedback) before this story's own artefacts were written, there was zero design churn during implementation — every AC in the story matched what the operator had already seen and confirmed. Worth reinforcing as a standing pattern for any future UI-redesign request: publish a working comparison first, get explicit approval, then write governed artefacts against the approved design — not the other way around.
2. **A "no other consumer" grep check caught a real gap the DoR contract missed.** The DoR contract's own plan to remove `.sw-epic-group`/`.sw-story-row` CSS assumed (without having checked) that nothing else depended on it. Direct grep before removal found `fpux.1`'s own E2E suite still did — and further investigation found a SECOND affected test file (`check-fpux.1-unify-visual-language.js`) beyond the one already known (`check-fapg-s1`). This is the same discipline that caught `bsgm-s1`'s and `adlr-s1`'s own "is this really fully unused" moments earlier this session — worth continuing to apply by default before any code-removal step, not just when a DoR contract explicitly flags it.
3. **A test's own bugs were caught before declaring the suite green, not after.** Two assertion bugs (a regex not matching across nested tags; a raw-substring check not accounting for URL-encoding) were found and fixed by actually reading the failure output carefully rather than assuming a failing test meant the implementation was wrong. Both were genuinely test-authoring mistakes, confirmed by manual inspection of the real HTML each test received.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Replace the multi-story artefact accordion with a compact feature-level table and document matrix" (fadm-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the AC7 manual verification backed by actual observations across all 3 named features, including the genuinely-incomplete one (phase3), not just the fully-complete demo case (psh)?
4. Is the CSS/test-retention scope deviation clearly justified, or does it look like scope creep being excused after the fact?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

# Definition of Done: Fix epic/flat story render duplication and missing story registration

**PR:** https://github.com/heymishy/skills-repo/pull/839 | **Merged:** 2026-09-05 (commit `570042b1b88335ef422ddc5e9a6b6c08cc6db21f`)
**Story:** artefacts/2026-09-06-story-registration-integrity-fix/stories/sri-s1-fix-story-render-duplication-and-missing-registration.md
**Test plan:** artefacts/2026-09-06-story-registration-integrity-fix/test-plans/sri-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-06-story-registration-integrity-fix/dor/sri-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-sri-s1-story-registration-integrity.js` — `getFeatureStoryStructure` excludes a dual-registered slug from `flatStorySlugs`; `groupArtefactsByStory` renders it once, under its epic | automated unit | None |
| AC2 | ✅ | Same file — a flat-only slug with no epic membership remains unaffected (regression guard) | automated unit | None |
| AC3 | ✅ | Same file — direct assertion against the real, committed `pipeline-state.json` confirming all 30 previously-missing slugs across `phase3`, `phase4-opus`, `mfc`, `wfp` are now registered | automated data-integrity test | None |
| AC4 | ✅ | Live production DOM check via Chrome, post-deploy, across all 6 affected features: `phase3` (26 unique rows, 0 duplicates, `p3.18`–`p3.22` present), `wucp` (5 rows, 0 duplicates), `phase4-opus` (all 23 previously-orphaned stories now grouped), `mfc` (`mfc.2` present), `wfp` (`wfp.11` present alongside `wfp.11a`/`wfp.11b`) | manual (live production verification) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

None against the ACs as written. Two related defects found during this story's own investigation were deliberately excluded from scope (not fixed, not partially fixed) rather than silently absorbed:
- `ougl`'s dot/dash slug-format mismatch (7 stories correctly registered, but filenames don't match the registered id format).
- `wuce`'s `s0.1`–`s0.3`/`s2.1` referencing epics that were never created at all.

Both logged as follow-ups in `workspace/capture-log.md` (2026-09-06) rather than fixed here — see the story's own "Explicitly out of scope" section for the reasoning.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10 — confirmed via PR #839's own CI run and directly, locally, before merge. Full suite: 620 files, 1 pre-existing failure (`check-p3.5-validate-trace.js` — an unrelated feature's `discovery.md` stuck in Draft status) unrelated to this diff. Existing `check-fapg-s1-group-artefacts-by-story.js` (7/7) and `check-bsgm-s1-bare-slug-story-grouping.js` (8/8) regression suites unaffected.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 dedupe at `getFeatureStoryStructure` level | ✅ | ✅ | `check-sri-s1-story-registration-integrity.js` |
| AC1 dedupe at `groupArtefactsByStory` render level | ✅ | ✅ | Same file |
| AC2 flat-only slug regression guard | ✅ | ✅ | Same file |
| AC3 real-data registration assertion (4 features, 30 slugs) | ✅ | ✅ | Same file |

**TDD verification performed (RED confirmed, not assumed):** 6 of 10 assertions were confirmed failing for the right reason before the fix (the dedupe tests failed with the exact pre-fix duplication; the AC3 data-integrity assertions failed naming the specific missing slugs); all 10 passing after.

**Coverage gap audit (Step 4):** AC4 is the story's own designated manual-verification AC (per the DoR contract's own RISK-ACCEPT — a pure data/render fix has no CSS-layout dependency warranting new E2E tooling). Executed directly against real production across all 6 affected features, not deferred: `layoutGapsAtMerge`: **false** — the gap was open at merge (deploy pipeline was still in flight) but is now closed as of this DoD, with concrete evidence recorded above.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no regression | ✅ (informal) | The dedupe adds one `Set` construction and a `.filter()` over an already-small array (story count per feature); no measurable cost, no automated test scoped |
| Security — none identified | ✅ N/A | Pure function plus data corrections, no I/O beyond the existing disk read, no new input surface |
| Accessibility — not applicable | ✅ N/A | No markup or interaction change |
| Audit — not applicable | ✅ N/A | No new state-changing action introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track story (per `CLAUDE.md`'s short-track convention). The story's own "Benefit linkage" section names the defect closed directly: render duplication on 2 features, silent misplacement on 4 more. First signal: confirmed closed in production 2026-09-06 via direct DOM verification on all 6 affected features — 0 duplicate rows found anywhere, all 30 previously-orphaned stories now correctly grouped.

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with concrete, automated (AC1–AC3) and direct live-production (AC4) evidence across all 6 affected features. No scope deviations against the ACs as written. No test gaps.

**Follow-up actions:**
1. `ougl`'s dot/dash slug-format mismatch — needs a dedicated scoping pass to choose between a code-level normalization or a considered id migration (logged in `workspace/capture-log.md`, 2026-09-06).
2. `wuce`'s missing `sprint-0-tenant-fixes`/`sprint-2-preflight-gate` epics — needs content authoring or a decision to fold those 4 stories into an adjacent existing phase epic instead (logged in `workspace/capture-log.md`, 2026-09-06).

---

## DoD Observations

1. **A schema comment was the key that unlocked the correct fix.** `.github/pipeline-state.schema.json`'s own description field for `epic.stories[]` ("may be full story objects... or string slug references... where full objects live in feature.stories[]") revealed that the visible "duplication" was not a data-entry mistake at all — it was the system's own documented dual-registration design, missing only a render-time dedupe. Reading the schema's own comments before assuming a data fix was needed avoided destructively removing real DoR/PR/dodDate tracking records for 15 stories across `phase3` and `wucp`.
2. **A blanket "orphaned file" audit conflated three distinct root causes**, only two of which were safe to fix mechanically in this story: genuinely-missing registration (fixed), a slug/filename format mismatch (`ougl`, deliberately not fixed), and entirely-missing epics (`wuce`, deliberately not fixed). Treating all "story doesn't render in its own accordion" symptoms as the same bug would have produced either an incorrect automated fix (guessing at `ougl`'s intended id format) or fabricated epic content (`wuce`). Worth a standing convention: when an audit surfaces a pattern across multiple features, verify each instance's root cause individually before batching a fix, especially when the fix involves historical/archived data.
3. **`/improve` candidate:** this is the second time this session a duplication/misplacement defect was reported as "looks the same as last time" by the operator but turned out to have a different root cause (`bsgm-s1`'s bare-slug-filename bug vs. `sri-s1`'s dual-registration-without-dedupe). Worth flagging in a future `/improve` pass that "the page looks duplicated" is not, by itself, sufficient signal to assume the same fix applies — each report in this pattern has needed its own direct data/code investigation.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Fix epic/flat story render duplication and missing story registration" (sri-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the AC4 manual verification backed by actual observations across all 6 claimed features, not just the originally-reported one?
4. Are the two explicitly-out-of-scope follow-ups (ougl, wuce) tracked somewhere durable, not just mentioned in passing?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

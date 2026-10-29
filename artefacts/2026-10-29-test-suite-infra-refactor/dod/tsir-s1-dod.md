# Definition of Done: Extract a shared mockReq/mockRes fixture module for journey.js tests

**PR:** https://github.com/heymishy/skills-repo/pull/1038 | **Merged:** 2026-10-29
**Story:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
**Test plan:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s1-shared-journey-fixture-module-test-plan.md
**DoR artefact:** artefacts/2026-10-29-test-suite-infra-refactor/dor/tsir-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `journeyFixture()` default session includes `login`/`tenantId`/`accessToken`/`userId`/`role` (`tests/check-tsir-s1-shared-journey-fixture.js`) | `unit` | None |
| AC2 | ✅ | `check-ep1-s1-journey-feature-merge.js` passes 12/12 after migration, identical to pre-migration baseline | `integration-real-code` (real `journey.js` route handlers, not mocked) | None |
| AC3 | ✅ | `session.tenantId` defaults to `'t1'` — non-empty, not `''`, not `undefined` | `unit` | None |
| AC4 | ✅ | `journeyFixture({session:{tenantId:'other-tenant'}})` merges correctly, other fields unchanged | `unit` | None |

**UI-evidence gate:** N/A — no AC in this story describes browser-observable behaviour (pure Node.js module/API shape).

**Verification strength mismatch check:** None of these ACs make a claim about an external real-world effect (no third-party system, no UI visibility, no restart/failure survival) — `unit`/`integration-real-code` evidence is the correct and sufficient class for all 4.

---

## Scope Deviations

None. PR #1038's file list (`.github/pipeline-state.json`, `artefacts/2026-10-29-test-suite-infra-refactor/decisions.md`, `artefacts/2026-10-29-test-suite-infra-refactor/plans/tsir-s1-plan.md`, `tests/check-ep1-s1-journey-feature-merge.js`, `tests/check-tsir-s1-shared-journey-fixture.js`, `tests/helpers/journey-fixture.js`) touches nothing from the story's or epic's out-of-scope sections (no retrofit of the other 41 files, no extension to `skills.js`/`products.js`/`journeys.js`).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (confirmed via PR #1038's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: default session fields | ✅ | ✅ | |
| AC1 edge case: fresh object per call | ✅ | ✅ | |
| AC3: tenantId non-empty | ✅ | ✅ | |
| AC4: overrides merge | ✅ | ✅ | |
| AC2: migrated consumer file (integration) | ✅ | ✅ | 12/12, same as pre-migration baseline |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — no new production code path | ✅ | PR file list confirmed: only `tests/`/`artefacts/`/`.github/pipeline-state.json` touched, no `src/` change |
| Performance — not applicable to this story | ✅ | Story's own NFRs section: "None identified" (performance NFRs in the feature profile apply to `tsir-s2`/`tsir-s3`'s own self-test/check, not this story) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Fixture duplication (m1) | ✅ (17/42, audit-confirmed) | Not yet — the structural measurement mechanism (`check-journey-fixture-usage.js`, Story `tsir-s3`) doesn't exist yet | not-yet-measured |
| Divergence-bug incidence (m2) | ✅ (1 occurrence, `ctpl-s1`) | Not yet — needs a window of the next 3 `journey.js`-touching stories per the minimum validation signal defined in `benefit-metric.md`; `tsir-s1` is infrastructure, not a consumer story | not-yet-measured |

**Fixture duplication (m1):**
Signal: not-yet-measured
Evidence note: Infrastructure-only story — the fixture module and one proof-of-pattern migration shipped, but the structural detection mechanism this metric is measured by (`tsir-s3`) has not shipped yet.
Date measured: null

**Divergence-bug incidence (m2):**
Signal: not-yet-measured
Evidence note: No new `journey.js`-touching story has shipped since this one — the 3-story measurement window named in `benefit-metric.md` hasn't started yet.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None. `tsir-s2` and `tsir-s3` remain to ship next in this epic's walking-skeleton sequence.

---

## DoD Observations

1. **Gap found and fixed at this DoD run, not at `/definition`:** `/definition` populated the prose "Metric Coverage Matrix" table in `benefit-metric.md` but never wrote the matching `metrics[].contributingStories` arrays in `pipeline-state.json` — without that fix, this DoD run would have silently found zero metrics to assess for `tsir-s1` (Step 6 keys off `contributingStories`, not the prose table). Fixed directly in `pipeline-state.json` before writing this artefact. `/improve` candidate: `/definition`'s own State update section should explicitly call out writing `contributingStories` from the coverage matrix it just built, the same way it already calls out populating `epics[]`/`stories[]` — right now the SKILL.md text for that step doesn't mention the state-file write at all, only the artefact table.
2. Epic-level `status` was stale at `not-started` immediately after this story's merge, despite `tsir-s1` being fully done — corrected to `in-progress` as part of the post-merge bookkeeping commit (`a5973fe3`), consistent with the epic-nested-story rule in CLAUDE.md.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Extract a shared mockReq/mockRes fixture module for journey.js tests" (tsir-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

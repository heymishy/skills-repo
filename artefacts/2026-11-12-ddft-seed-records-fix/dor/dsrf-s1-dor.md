## Definition of Ready: Persist the two seeded deferred-item records that ddft-s1 promised but never shipped

**Story reference:** artefacts/2026-11-12-ddft-seed-records-fix/stories/dsrf-s1-persist-seeded-deferred-item-records.md
**Test plan reference:** artefacts/2026-11-12-ddft-seed-records-fix/test-plans/dsrf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-12
**Track:** short

---

## Contract Proposal

See `artefacts/2026-11-12-ddft-seed-records-fix/dor/dsrf-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed.** The proposed build (one data file and one read-only test) matches all 5 ACs, and each AC maps to a named test in the test plan. The contract's exclusion list (no change to `incident-store.js` or anything under `src/`) has zero test assertions against it, so no "MUST NOT touch" entry conflicts with a required touchpoint.

---

## Short-track entry-condition note

This is a short-track story (CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`). The literal review-report and discovery entry conditions, and the hard blocks that depend on them (H7, H-GOV), are treated as vacuously satisfied under the same precedent used for `smt-s1` and `lasr-s1`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a platform maintainer relying on the deferred-decision-follow-through epic" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→UT1-2, AC2→UT3, AC3→UT4, AC4→UT5+IT1, AC5→IT2 |
| H4 | Out-of-scope section is populated | ✅ | 6 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ (short-track convention) | "None formal", and it states the specific unmet ddft-s1 target it closes |
| H6 | Complexity is rated | ✅ | Rating 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (vacuous — short-track) | No review ran |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 covered, zero gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream is the already-merged `incident-store.js` (PR #1067), whose record shape this story only consumes. `schemaDepends: []` declared in the contract: no `pipeline-state.json` fields are read. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 5 constraints stated |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ (N/A) | Data file and test only, no UI |
| H-NFR | NFR profile exists or story states NFRs | ✅ (short-track convention) | NFRs populated inline in the story |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ (N/A) | None |
| H-NFR3 | Data classification field not blank | ✅ (N/A) | Story's Security NFR states no credentials, tenant identifiers or PII |
| H-GOV | `## Approved By` in discovery.md has an entry | ✅ (vacuous — short-track) | No discovery.md |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ (N/A) | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ (skipped) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ (skipped) | `hasMigrationTrack` not set. No database schema is touched. |
| H-DESIGN | Design-token compliance | ✅ (skipped) | `hasDesignSystemTrack` not set, no UI |

**Hard blocks: 19/19 passed** (3 vacuously under the short-track convention, as flagged above).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A — no review ran) | — | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No human has walked the verification script yet. The risk is low because the story is a two-record data fix whose scenarios are one-line file checks. | **Pending — operator to confirm** |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | One accepted gap: UT3 pins today's state and will need editing when `tfhc-s1` is eventually fixed. This is documented in the test plan. | — |

---

## Standards injection

Domain tags: `[pipeline-tooling, data]`

No matched standards file applies. `.github/standards/data/data-standards.md` is still an unfilled template and covers database concerns that do not arise for a JSON file. The binding constraints for this story are the ones in its own Architecture Constraints section (use the shipped mechanism, read-only check, no new dependency).

---

## Oversight level

**Low** — a bounded data file plus a read-only test, with no runtime code path or production service changed. No named sign-off needed.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Persist the two seeded deferred-item records that ddft-s1 promised but never shipped — artefacts/2026-11-12-ddft-seed-records-fix/stories/dsrf-s1-persist-seeded-deferred-item-records.md
Test plan: artefacts/2026-11-12-ddft-seed-records-fix/test-plans/dsrf-s1-test-plan.md

Goal:
Make every test in tests/check-dsrf-s1-seeded-records.js pass. Write that test file first and confirm it fails (the data file does not exist yet), then create workspace/incidents.json. Do not add scope beyond the 5 ACs and the test plan.

Constraints:
- Build the two records with createDeferredItemRecord and persist them with appendIncidentRecord from scripts/lib/incident-store.js, using a throwaway script kept outside the repo (scratchpad). Do not hand-write the JSON, and do not commit the script.
- Re-run `node scripts/check-pipeline-state-integrity.js` first and take the real C3 numbers for the tfhc-s1 record from its output. Do not copy them from the story text.
- Each record's summary must be self-contained. workspace/capture-log.md is gitignored, so do not rely on a reader opening it. Use the real contradiction text logged there on 2026-11-08, restated in your own words in the summary.
- The test reads the real workspace/incidents.json and never writes to it. No temp files for the data under test. UT5's negative control may use in-memory arrays only.
- Do NOT modify scripts/lib/incident-store.js, or anything under src/ or skills/.
- Do NOT fix tfhc-s1 or the C1/Option C contradiction, and do not change the C3 check.
- Node.js built-ins only, no new npm dependencies.
- Use explicit file paths in `git add`. Verify with `git ls-files workspace/incidents.json` that the file is tracked before opening the PR.
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce anti-patterns or violate Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

Oversight level: Low — no named sign-off required.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

**Outstanding before coding agent assignment:** W4 (verification script review) is advisory and does not block the build. The operator can walk `artefacts/2026-11-12-ddft-seed-records-fix/verification-scripts/dsrf-s1-verification.md` at any point before merge.

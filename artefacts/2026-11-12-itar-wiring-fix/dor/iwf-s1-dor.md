## Definition of Ready: Wire triage drafting to incident creation, so a created incident gets a triage summary

**Story reference:** artefacts/2026-11-12-itar-wiring-fix/stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
**Test plan reference:** artefacts/2026-11-12-itar-wiring-fix/test-plans/iwf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-12
**Track:** short

---

## Contract Proposal

See `artefacts/2026-11-12-itar-wiring-fix/dor/iwf-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed.** The proposed build (a recorder module, a command, one filter line in the drafter and one test file) matches all 5 ACs, and each AC maps to named tests. The contract's exclusion list (no change to `incident-store.js` or `drift-comparator.js`) has no test assertions against it, and the one file it does touch outside the new files (`triage-drafter.js`) is listed as a touchpoint, not excluded, so there is no contract-versus-test-plan conflict.

---

## Short-track entry-condition note

Short-track story (CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`). The literal review-report and discovery entry conditions, and the hard blocks that depend on them (H7, H-GOV), are treated as vacuously satisfied under the same precedent used for `smt-s1`, `lasr-s1` and `dsrf-s1`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a delivery engineer who has just identified a production incident" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→UT1-2, AC2→UT6+IT1-3, AC3→UT3-4, AC4→UT5, AC5→IT4+NFR-CORR1 |
| H4 | Out-of-scope section is populated | ✅ | 5 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ (short-track convention) | "None formal", and it names the specific itar-s2 DoD gap it closes |
| H6 | Complexity is rated | ✅ | Rating 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (vacuous — short-track) | No review ran |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 covered, zero gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared in the contract |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 6 constraints stated |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ (N/A) | Command-line only, no UI |
| H-NFR | NFR profile exists or story states NFRs | ✅ (short-track convention) | NFRs populated inline |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ (N/A) | None |
| H-NFR3 | Data classification field not blank | ✅ (N/A) | Story's Security NFR states no credentials, tenant identifiers or PII |
| H-GOV | `## Approved By` in discovery.md has an entry | ✅ (vacuous — short-track) | No discovery.md |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ (N/A) | The entry point calls the real modules directly. The optional `draft` option defaults to the real `draftTriageSummary`, so there is no throwing or silent stub to wire. |
| H-INF | Infra-plan gate | ✅ (skipped) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ (skipped) | `hasMigrationTrack` not set; no database schema touched |
| H-DESIGN | Design-token compliance | ✅ (skipped) | `hasDesignSystemTrack` not set, no UI |

**Hard blocks: 19/19 passed** (3 vacuously under the short-track convention, as flagged above).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A — no review ran) | — | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No human has walked the script. The risk is low: five terminal scenarios, one of them an automated-test pointer. | **Pending — operator to confirm** |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | One accepted gap: concurrent runs could interleave writes, the same single-writer assumption as every `workspace/` log | — |

---

## Standards injection

Domain tags: `[pipeline-tooling, data]`

No matched standards file applies (`.github/standards/data/data-standards.md` is still an unfilled template covering database concerns). The binding constraints are the story's own Architecture Constraints.

---

## Oversight level

**Low** — a command-line entry point composing already-merged, already-tested modules, plus one filter line. No production service or UI is changed. No named sign-off needed.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire triage drafting to incident creation, so a created incident gets a triage summary — artefacts/2026-11-12-itar-wiring-fix/stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
Test plan: artefacts/2026-11-12-itar-wiring-fix/test-plans/iwf-s1-test-plan.md

Goal:
Make every test in tests/check-iwf-s1-incident-recording.js pass. Write that test file first and confirm it fails (the module and command do not exist yet), then build src/modules/incident-recorder.js and scripts/create-incident.js, then add the type filter in src/modules/triage-drafter.js. Do not add scope beyond the 5 ACs and the test plan.

Constraints:
- Compose the shipped modules (createIncidentRecord and appendIncidentRecord from scripts/lib/incident-store.js, draftTriageSummary from src/modules/triage-drafter.js). Do not reimplement matching or storage.
- Store the incident before drafting. If drafting throws, leave the stored record untouched and rethrow.
- All tests use temp files in os.tmpdir(). No test may write to workspace/incidents.json. NFR-CORR1 hashes it before and after the run.
- IT1 to IT4 must run the real command as a child process (node scripts/create-incident.js) so an unwired entry point fails them.
- In triage-drafter.js change only the candidate filter: records of type incident, with a missing type treated as incident (use withDefaultType). Do not change INCIDENT_JACCARD_THRESHOLD, scoring or summary wording.
- tests/check-itar-s2-triage-drafting.js (15 tests) must still pass unchanged.
- Do NOT modify scripts/lib/incident-store.js or src/modules/drift-comparator.js.
- Do NOT write any incident record to the real workspace/incidents.json.
- Node.js built-ins only, no new npm dependencies.
- Use explicit file paths in `git add`.
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

**Outstanding before coding agent assignment:** W4 (verification script review) is advisory and does not block the build. The operator can walk `artefacts/2026-11-12-itar-wiring-fix/verification-scripts/iwf-s1-verification.md` at any point before merge.

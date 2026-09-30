# Definition of Ready: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema

**Story reference:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/stories/psir-s1.md
**Test plan reference:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/test-plans/psir-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## Contract Proposal

**What will be built:**
`scripts/check-pipeline-state-integrity.js` extended in place with 15 new check codes (`C15`–`C29`, plus an extension of the existing `C4`) covering the `required`/`enum` schema constraints on `features[]`, epic-nested `stories[]`, `guardrails[]`, `tasks[]`, and `spikes[]` that the script currently has no equivalent for. Each new check: a `VALID_*` constant array (for enums) and a `findings.push({level:'fail', code, message})` entry inside `checkFeature`/`checkStory` or a new small helper (`checkGuardrails`/`checkSpikes`) called from the existing integration-check loop, plus a companion self-test block matching the file's own established density and phrasing.

**What will NOT be built:**
No new npm dependency (`ajv`/`jsonschema`). No new `tests/check-*.js` wrapper file. No changes to `validate-trace.sh` or `.github/pipeline-state.schema.json` themselves. No retroactive fix of any pre-existing real-data violation beyond confirming AC8's "0 new failures."

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Embedded self-tests (C15/C16) | Unit |
| AC2 | Embedded self-tests (C17, both feature and epic-nested contexts) | Unit |
| AC3 | Embedded self-tests (C18/C19/C20) | Unit |
| AC4 | Embedded self-tests (C21/C22/C23) | Unit |
| AC5 | Embedded self-tests (C24/C25/C26) | Unit |
| AC6 | Embedded self-tests (C4 extension + C27) | Unit |
| AC7 | Embedded self-tests (C28/C29) | Unit |
| AC8 | Real-file run + real Python jsonschema cross-check | Integration |

**Assumptions:**
The existing embedded self-test harness (lines ~292–727 of the current file) is the correct, sole test surface for this story — matching the file's own already-established convention, not a gap to fix. New check codes continue sequentially from `C15` (last existing is `C14`; `C9` is defined out of order already in the current file, unaffected).

**Estimated touch points:**
Files: `scripts/check-pipeline-state-integrity.js` only (~150–200 lines added: constants, check logic, self-tests).
Services: None new.
APIs: None new.

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC8; no mismatch between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "platform owner running the local governance checks before opening or updating a PR" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 8 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 8/8 covered, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ N/A-adapted | Short-track hardening fix, not a metric-tracked feature — benefit linkage instead cites the exact real incident (the `2026-09-29-test` `name`-field gap found during `wuar-s1`/`rsc-s1`'s own PR cycle) this fix directly prevents a repeat of |
| H6 | Complexity rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no review ran by design |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Names the exact file, preserves its zero-dependency design constraint, cites the exact numbering/self-test convention to follow |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — CLI tooling only |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states all 4 categories Not Applicable |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's own NFR section is Not Applicable for all 4 |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ N/A | Short-track skips `/discovery` by design — satisfied via the operator's own direct in-session instruction ("OK Lets do 4", selecting this from a recommended follow-up list). Same pattern as `gcw-s1`, `jasb-s1`, `jgls-s1`, `asa-s1`, `wuar-s1`, `rsc-s1`. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track — no review ran | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ RISK-ACCEPT | Purely additive checks (new failure modes only, no change to existing check behaviour) against an already-well-tested file; AC8's real-data cross-check against the actual Python validator is the strongest available guard against a false positive shipping | Operator selected this story directly from a recommended follow-up list after the underlying gap was found live; logged in this session's own record |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently.

---

## Oversight Level

**Oversight:** Low — additive-only checks to an existing, already-tested governance script; no production code path affected, no new dependency.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema
Story artefact: artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/stories/psir-s1.md
Test plan: artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/test-plans/psir-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Only file touched: scripts/check-pipeline-state-integrity.js. Do NOT
  add a new tests/check-*.js file, do NOT add a new npm dependency.
- New check codes continue sequentially from C15 (last existing code is
  C14). Follow the exact existing pattern: a VALID_* constant array (for
  each new enum), a findings.push({level:'fail', code, message}) entry,
  and a header-comment doc entry above the existing C1-C14 doc block
  citing the exact schema property/line being mirrored -- matching every
  existing check's own documentation style precisely.
- checkFeature(feature) gets: C15 (missing name), C16 (missing health),
  C17 (health invalid enum -- feature context).
- checkStory(featureSlug, story, isEpicNested) gets: C17 (health invalid
  enum -- epic-nested story context, same code reused, guard on
  isEpicNested the same way C8 already does), C18 (epic-nested missing
  name), C19 (epic-nested missing stage), C20 (epic-nested missing
  health), C21 (dorStatus invalid enum, any story shape), C22
  (reviewStatus invalid enum, epic-nested only -- field doesn't exist on
  flat stories per schema), C23 (verifyStatus invalid enum, epic-nested
  only), C27 (tddState invalid enum value inside tasks[], extends the
  existing C4 tasks[] loop rather than adding a new loop).
- Extend the existing C4 tasks[] loop to also check for missing `id` and
  missing `name` (currently only tddState presence is checked) -- do not
  introduce a separate code for this, it's the same "task object missing
  a required field" concern the existing C4 doc comment already
  describes.
- New small helpers (or inline logic in checkFeature): C24/C25/C26 for
  feature.guardrails[] (missing required field, invalid category enum,
  invalid status enum respectively), C28/C29 for feature.spikes[]
  (missing required field, invalid verdict enum respectively -- verdict
  may be null, which is valid per schema and must NOT fire C29).
- Extend the existing "AC6: fully-valid fixture" self-test to include a
  valid guardrails[] entry, tasks[] entry, and spikes[] entry, asserting
  none of C15-C29 fire against it.
- After implementation: run node scripts/check-pipeline-state-integrity.js
  against the real repo pipeline-state.json and confirm 0 new failures
  (AC8). Also independently cross-check with the real Python validator:
  python -c "import json, jsonschema; ..." (exact command already used
  earlier this session, cite it verbatim in your own verification notes)
  -- both must report 0 violations before this is considered done.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)

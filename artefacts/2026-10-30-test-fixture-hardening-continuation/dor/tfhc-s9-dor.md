# Definition of Ready Checklist: Parallelize scripts/run-all-tests.js's sequential child-process execution

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s9-run-all-tests-parallelization-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-10-31

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona matches discovery.md "Who It Affects" item 1 near-verbatim |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all G/W/T |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC3/AC5/AC6 have unit/integration tests; AC4 has an explicit manual NFR test entry |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | m10 |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1: 0 HIGH, 1 MEDIUM (RISK-ACCEPTed), 2 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | AC4's gap is explicit in the test plan's Coverage gaps table, referencing the /review 1-M1 RISK-ACCEPT |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tfhc-s8` as upstream (not "None") → `schemaDepends: [dodStatus]` declared in the DoR contract; `dodStatus` confirmed present in `.github/pipeline-state.schema.json` and confirmed `"complete"` on `tfhc-s8`'s entry |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | "None identified — checked against .github/architecture-guardrails.md"; Category E scored 5/5 at /review, no applicable guardrail found against this story's scope |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | No CSS-layout-dependent AC exists (confirmed at /test-plan Step 3a scan) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md`, updated for this story |
| H-NFR2 | Compliance NFR with named regulatory clause has documented human sign-off | ✅ N/A | No compliance NFR with a regulatory clause applies to this story |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | `nfr-profile.md` Security section: `[x] Public` |
| H-NFR-profile | NFR profile presence check | ✅ | Story's NFR section is populated (not "None"/blank); profile exists (see H-NFR) |
| H-GOV | `## Approved By` section in discovery artefact has ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-10-30" — present, non-blank. M1 signal: role not unambiguously non-engineering ("Platform Owner" is not an engineering title like Lead Engineer/Tech Lead/Developer, but also not unambiguously PM/business-stakeholder) — recorded as role-unverified-for-independent-sign-off, same as every prior story in this epic |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | This story introduces no `setX()`-style injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set on this story |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set on this story |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` not set on this story |

**All hard blocks: 15/15 passed (10 substantive + 5 N/A-by-trigger-condition).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Already logged (1-M1 RISK-ACCEPT, `decisions.md`, 2026-10-31) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases the author didn't anticipate | Hamish King (solo-operator capacity) — RISK-ACCEPTed below, same rationale as every other story in this epic |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | AC4's gap is explicitly addressed (RISK-ACCEPT reference), not left UNCERTAIN |

---

## Standards injection

**Domain tags:** [testing]
**Matched standards files:** `.github/standards/testing/test-design-patterns.md`

These are appended to the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Parallelize scripts/run-all-tests.js's sequential child-process execution — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s9-run-all-tests-parallelization-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node, no test framework — every test file in this repo is a standalone
  `node <file>` process using manual assertions and `console.log('✓ ...')` /
  `process.exitCode`. Match this exact convention in the new test file.
- Do not modify GRANDFATHER_LIST, discoverTestFiles, or getAllTestFiles — the
  discovery mechanism is explicitly out of scope for this story.
- Do not add a CLI flag or environment variable to make concurrency
  operator-configurable — ship a single fixed default (os.cpus().length).
- Do not modify any .github/workflows/*.yml file.
- Do not modify any individual check-*.js file's own test logic — if parallel
  execution surfaces a pre-existing test-isolation bug in a real file, stop and
  add a PR comment describing it rather than fixing that file inline.
- New fixture files belong under tests/fixtures/ (not tests/), so they are not
  swept into the real suite by the check-*.js glob.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs. No applicable guardrail was found
  against this story's scope at /review Category E.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/testing/test-design-patterns.md (matched domain: testing)

# Test Design Patterns — Cross-Cutting

Rules for writing tests that genuinely prove what they claim to prove, independent of any single domain. Extracted from recurring findings across multiple features (res-s2, res-s3, res-s4).

## Mutation-test a fix's own new test before trusting it

When a code-quality review or a corrective task adds a NEW test specifically to prove a specific bug is fixed, do not trust that the test passing means the fix is real. Temporarily revert the fix (or disable the specific guard/branch it added) and re-run the unmodified test. If the test still passes with the fix reverted, the test is not exercising what it claims to — it is passing for an unrelated reason.

**Rule:** For any test whose entire purpose is proving a specific code branch is what prevents/produces an outcome (not just that *some* related event occurred), revert the specific change under test and confirm the test then fails for the expected reason, before committing the test as evidence.

**Applied to this story specifically:** the AC2 concurrency-bound test and the AC6 hang/timeout test are exactly this shape — each proves a specific guard (the concurrency semaphore; the timeout-kill) is what produces the observed outcome. Before committing either test, temporarily remove or neutralise the corresponding guard (e.g. set concurrency effectively unbounded, or disable the timeout-kill) and confirm the test then fails for the expected reason. Restore the guard and confirm the test passes again before considering it trustworthy evidence.

## A whole-file source-text regex assertion is vacuous if the same string legitimately appears elsewhere in the file

A test that asserts "attribute/string X is present in this source file" via an unscoped regex over the entire file passes even when X only appears in a DIFFERENT function than the one under test. Prefer asserting against genuine render/runtime OUTPUT over source TEXT wherever a real call is reachable.

**Applied to this story specifically:** not directly applicable (no HTML/DOM rendering in this story), but the underlying principle carries over to AC5's output-attribution test — assert against the actual captured stdout chunks the runner produced during a real concurrent run, not against the runner's source code for the string "buffer" or "pipe".
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required (epic's own Rationale: "A PR-stage human checkpoint is proportionate for the implementation stories")
**Signed off by:** Hamish King, Platform Owner (solo-operator — tech lead and operator are the same person for this repo, same precedent as every other story in this epic)

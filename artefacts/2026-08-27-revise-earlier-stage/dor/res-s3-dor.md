# Definition of Ready: Suggest whether a stage revision is material to downstream stages

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Test plan reference:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s3-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-08-28

---

## Contract Proposal

See `res-s3-dor-contract.md`.

## Contract Review

**Resolves an open test-design risk:** the test plan flagged that AC2/AC3 assert a deterministic classification while the epic itself rates this capability Complexity 3 ("genuinely novel, unproven"), raising a real risk that an LLM-judged implementation would make the tests flaky. The Contract Proposal resolves this explicitly: classification is a deterministic section-diff (Problem Statement / MVP Scope / named Constraint), with only the free-text rationale sentence left to a model call. This is exactly the kind of choice DoR's contract mechanism exists to force before implementation starts.

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs; the test-design risk from `/test-plan` is resolved by this contract's explicit classification-mechanism choice.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Operator (solo product owner + engineer running the outer loop) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 9 tests across 4 ACs |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | "Materiality-suggestion acceptance rate" |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 — 0 HIGH (1-H1 resolved) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None as hard gaps (test-design risk noted and resolved at contract review) |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["prStatus", "dodStatus"]` declared; both fields present in schema |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Run 2 Architecture compliance score 5, no HIGH |
| H-E2E | CSS-layout-dependent gate | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-27-revise-earlier-stage/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact — passes |
| H-ADAPTER | Injectable adapter wiring | ⚠️→✅ | **CORRECTED 2026-08-28:** originally read "No new adapter introduced" — incorrect. res-s2's `_materialityCheckHook`/`setMaterialityCheckHook` D37 adapter was introduced specifically for this story to wire. Corrected at implementation-plan investigation; AC5 added to the story to cover the mandatory wiring requirement (D37 rule #2). See decisions.md's 2026-08-28 ARCH entry (res-s3). |
| H-INF | Infra-plan gate | ✅ | Not applicable |
| H-MIG | Migration-review gate | ✅ | Not applicable |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Unstable — declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | No MEDIUM findings (1 LOW only) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md (2026-08-28) — covers all 4 stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Gap table's test-design risk resolved at contract review |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Suggest whether a stage revision is material to downstream stages — artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
Test plan: artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/journey.js conventions
- Classification (material/minor) MUST be a deterministic section-diff (Problem Statement / MVP Scope boundary / named Constraint sections) — do NOT implement classification as a raw LLM judgment call, per the DoR contract's resolution of the test-plan's flagged test-design risk. Only the rationale sentence may come from a model call.
- Consumes res-s2's pre-revision-content handoff (AC5) — do not attempt to independently source "before" content from disk
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Depends on res-s2 (Dependencies: Upstream) — confirm res-s2's prStatus/dodStatus in pipeline-state.json before assuming the handoff is available (H8-ext)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-28)

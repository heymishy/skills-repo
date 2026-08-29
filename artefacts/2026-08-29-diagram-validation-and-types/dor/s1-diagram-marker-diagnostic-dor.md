# Definition of Ready: Structured diagnostic for a malformed canvas diagram marker

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Test plan reference:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s1-diagram-marker-diagnostic-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## Contract Proposal

See `s1-diagram-marker-diagnostic-dor-contract.md`.

## Contract Review

A gap was found: the original proposal left S1's diagnostic purely as an SSE-level event, which would not actually surface anything to the operator watching the chat UI — contradicting the story's own stated purpose. Resolved by adding a minimal client-side console-log listener as an explicit touch point (see contract's "Added at contract review" note). This also resolves the open gap `nfr-profile.md` flagged for revisit at DoR.

✅ **Contract review passed** — proposed implementation (as corrected) aligns with all 5 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Developer/engineer running `/design` or `/definition` |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 12 tests across 5 ACs |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Diagram render-failure diagnosability |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 — 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency check | ✅ | No upstream dependencies declared — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-026 + testing-standards both referenced; Run 2 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gate | ✅ | No layout-dependent ACs (Step 3a scan clean) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-29-diagram-validation-and-types/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable — no compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | `Approved By: Hamish King — Platform Owner — 2026-08-29` — treated as non-engineering-equivalent per established repo precedent (Platform Owner ≠ a pure engineering title) |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ | Not applicable — `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ | Not applicable — `hasMigrationTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable — declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Run 2 has 0 MEDIUM — not applicable |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in `decisions.md` (2026-08-29) — covers all 5 stories in this batch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | No gaps in this story's test plan |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Structured diagnostic for a malformed canvas diagram marker — artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
Test plan: artefacts/2026-08-29-diagram-validation-and-types/test-plans/s1-diagram-marker-diagnostic-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/skills.js conventions
- ADR-026: the diagnostic must dispatch through the existing canvas-marker scan loop and parseCanvasBlock — do not introduce a second, parallel handling path
- Mutation-test any new test asserting the diagnostic fires (.github/standards/testing/test-design-patterns.md) — revert the fix, confirm the test fails for the expected reason, before trusting it
- Add the minimal client-side console-log listener identified at contract review — do not skip this even though it's not a full UI treatment (S2's scope)
- Diagnostic text must be escaped before appearing in any SSE payload or log — no raw model-output injection
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing.

### .github/standards/testing/test-design-patterns.md (domain: web-ui)
Read this file directly before implementing — directly applicable to this story's own diagnostic-mechanism tests.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-29)

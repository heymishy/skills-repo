# Definition of Ready: Act on a materiality suggestion without auto-triggering downstream changes

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md
**Test plan reference:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s4-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-08-28

---

## Contract Proposal

See `res-s4-dor-contract.md`.

## Contract Review

**Resolves review finding 1-M1 (RISK-ACCEPT res-s4-1-M1):** the review flagged that "downstream stages" ordering and flag-state persistence were both undefined at story-write time. The RISK-ACCEPT deferred resolving this to "DoR/implementation time" rather than another story-text revision pass — this Contract Proposal is that resolution: downstream ordering reuses `journey-store.js`'s single `STAGE_SEQUENCE` (no new hardcoded list), and flag persistence follows the same disk-backed path `completedStages` already uses.

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs; RISK-ACCEPT res-s4-1-M1's two open questions are resolved explicitly in this contract.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Operator (solo product owner + engineer running the outer loop) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 11 tests across 4 ACs |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | 2 metrics named |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 — 0 HIGH (1 MEDIUM, acknowledged via RISK-ACCEPT) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: table references the RISK-ACCEPT, not an uncovered AC — all 4 ACs have tests |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["prStatus", "dodStatus"]` declared; both fields present in schema |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Field populated; Run 1 Architecture compliance score 3 (1 MEDIUM, acknowledged) — no HIGH |
| H-E2E | CSS-layout-dependent gate | ✅ | Flag marker verified via DOM/markup inspection, not CSS layout — no AC typed CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-27-revise-earlier-stage/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact — passes |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new `setX()` adapter — `flaggedStages` is a data field, not an injectable adapter |
| H-INF | Infra-plan gate | ✅ | Not applicable |
| H-MIG | Migration-review gate | ✅ | Not applicable |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable — declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | RISK-ACCEPT res-s4-1-M1 logged 2026-08-28, resolved further at this contract |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md (2026-08-28) — covers all 4 stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Gap table's open item (STAGE_SEQUENCE + persistence) resolved at this contract |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Act on a materiality suggestion without auto-triggering downstream changes — artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md
Test plan: artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/journey.js and journey-store.js conventions
- "Downstream stages" MUST be computed from journey-store.js's single STAGE_SEQUENCE constant — do NOT create a second hardcoded stage-order list anywhere (named anti-pattern, previously caught twice in dtra-s1/dspw-s1)
- Flag state MUST persist through the same disk-backed path completedStages already uses (_diskAdapter/_pgWrite) — not in-memory-only
- Flag markers must include a text label or icon, never colour alone (accessibility mandatory constraint, architecture-guardrails.md)
- Never auto-regenerate a downstream artefact under any circumstance
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Depends on res-s3 (Dependencies: Upstream) — confirm res-s3's prStatus/dodStatus in pipeline-state.json before assuming its suggestion-logging is available (H8-ext)
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

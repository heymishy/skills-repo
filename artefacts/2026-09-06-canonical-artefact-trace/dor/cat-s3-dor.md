# Definition of Ready: Classify every divergence case the audit found, not just the common one

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s3-divergence-classification-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s3-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Tech lead |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 unit + 1 integration across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 2 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Unregistered documents visible without a bug report" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency | ✅ | schemaDepends: ["stage","reviewStatus"] on cat-s1 — both fields exist in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | /clarify decision + MC-A11Y-02 cited; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered |
| H-NFR3 | Data classification not blank | ✅ | Populated |
| H-NFR-profile | NFR profile presence | ✅ | Populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Low — derived from PASSed AC/test plan | Hamish King — RISK-ACCEPT logged in decisions.md, 2026-09-06 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Classify every divergence case the audit found, not just the common one — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s3-divergence-classification-test-plan.md

Goal:
Make every test in tests/check-cat-s3-divergence-classification.js pass. Do
not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies.
- Extend src/web-ui/adapters/artefact-trace.js (cat-s1's module) with
  classifyDivergence(traceResult, pipelineState) — run inside buildArtefactTrace's
  existing single pass, no second directory walk (Performance NFR).
- not-yet-synced status (from cat-s1's AC5) takes precedence at the feature
  level over any per-document classification — never compute a per-document
  unregistered/orphaned-registration value when the trace itself is not-yet-synced.
- Never the same state value for "unregistered" (no pipeline-state.json entry)
  vs "orphaned-registration" (pipeline-state.json entry, no matching file) —
  these need visibly distinct labels for cat-s4's rendering.
- Out of scope: any rendering of these states (cat-s4); any write-back to
  pipeline-state.json for orphaned-registration.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` — read in full before implementing.

Most directly relevant for this story (a pure classification function, no route/session/HTML surface):

- **Stack constraints:** No new npm `dependencies`.
- No injectable adapter, session, or HTML-rendering surface introduced here — those sections become relevant starting at `cat-s4`.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)

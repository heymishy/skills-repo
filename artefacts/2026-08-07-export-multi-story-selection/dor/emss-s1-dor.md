# Definition of Ready Checklist

## Definition of Ready: Let a --from-saas export request specify which DoR-approved story to fetch

**Story reference:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**Test plan reference:** artefacts/2026-08-07-export-multi-story-selection/test-plans/emss-s1-test-plan.md
**Review artefact:** artefacts/2026-08-07-export-multi-story-selection/review/emss-s1-review-2.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-08-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Operator running the bootstrap CLI's --from-saas flow..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Correctness of the --from-saas export path (operational, short-track) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 N/A reasoning, lookup-scoping guard, backward-compat mandate; Category E score 5 (Run 2) |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | Server-side/CLI logic only |
| H-NFR | NFR profile exists | ⚠️ N/A | Story has explicit NFRs field (4 categories) — no separate feature-level nfr-profile.md for this short-track feature |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No feature-level NFR profile for short-track; story-level NFRs cover this directly |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story NFR section populated — proceeds without a separate nfr-profile.md per pcr-s1/tpac-s1/npwe-s1 short-track precedent |
| H-GOV | Discovery Approved By populated | ⚠️ **See decisions.md GAP entry (2026-08-07)** | No discovery artefact exists — short-track skips /discovery by design, matching pcr-s1/stis-s1/tpac-s1/npwe-s1 precedent |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | `findDorApprovedStory` is an internal helper inside the already-D37-wired `setExportDataSource` adapter pair — no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass — 15/15 (10 direct passes + 5 explicit N/A), with the H-GOV and H-NFR-profile notes recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 2: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` (2026-08-07) |
| W5 | No UNCERTAIN items left unaddressed | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Standards injection

Domain tags: `[web-ui, api]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`. `api` domain has no dedicated standards file in `index.yml` at this time — flagged here per the standards-injection algorithm, not silently dropped.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Let a --from-saas export request specify which DoR-approved story to fetch — artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
Test plan: artefacts/2026-08-07-export-multi-story-selection/test-plans/emss-s1-test-plan.md
DoR contract: artefacts/2026-08-07-export-multi-story-selection/dor/emss-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Backward compatibility is mandatory: the existing no-selector call shape
  MUST continue to return the first signed-off story exactly as today
  (AC1). Do not change this default under any circumstance.
- The story selector is resolved ONLY against the target feature's own
  known story slugs -- never against any other feature, and rejected
  (clear not-found error) rather than silently ignored if it doesn't match.
- Reuse the existing ExportNotFoundError class/status-code convention for
  an invalid/unmatched selector -- do not invent a new error type.
- The CLI's --story flag is a companion to --from-saas, not a standalone
  flag -- it has no effect without --from-saas also being present.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.

## Applicable standards (domain: web-ui, api)

[Standards files matched from .github/standards/index.yml for the web-ui
domain -- inject full content here per standards-injection.js's algorithm.
No standards file matched for the "api" domain tag at this time.]

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches a production machine-to-machine API endpoint (`/api/export/:slug`) and the CLI's own bootstrap flow, both already in real use, warranting tech-lead-equivalent awareness even though the change is small and additive.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King — Platform maintainer / Product owner — 2026-08-07

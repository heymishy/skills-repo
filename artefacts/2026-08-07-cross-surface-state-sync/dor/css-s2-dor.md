# Definition of Ready: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**Review artefact:** artefacts/2026-08-07-cross-surface-state-sync/review/css-s2-review-2.md
**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
**Test plan reference:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s2-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-07-cross-surface-state-sync/dor/css-s2-dor-contract.md`.

**Contract Review outcome:** No mismatches found — the proposed implementation (D37 write-adapter reusing `das-s1`'s Contents API pattern and `mtrr-s1`'s repo resolution, bounded in-request retry, shared `sync_log` table) aligns with all 4 ACs and the ADR-020/Step-1.5 architecture constraints already resolved at `/definition`. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Platform maintainer whose web-UI journey completes a stage |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ | "Automatic cross-surface agreement rate" |
| H6 | Complexity is rated | ✅ | Rating 3, Unstable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 1 LOW (repo-level, not story-specific) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 1 External-dependency gap (AC1's real commit-author check) explicitly acknowledged with a manual scenario |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies lists `mtrr-s1` (external, already merged) and `das-s1` (external, PR pending) — both external, not in-feature upstream stories; H8-ext's schemaDepends requirement targets in-feature dependencies. Not applicable. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-020, resolved Step 1.5 decision, D37, repo-resolution mechanism (fixed at Run 2) all named; Run 2 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-07-cross-surface-state-sync/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ | Confirmed (same discovery as css-s1) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | Story's D37 constraint names stub-throws requirement; implementation plan must name wiring as a separate task |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable | Hamish King |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Run 2 has 0 MEDIUM remaining | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — RISK-ACCEPT logged in `decisions.md` (shared entry covering all 4 stories) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names the 2 real gaps with explicit mitigation, not "UNCERTAIN" | — |

---

## Standards injection

Domain tags: `[web-ui, data]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/data/data-standards.md` (both confirmed present on disk).

---

## Oversight level

**Medium** (from parent epic `css-e1`). Confirmed: Hamish King (solo maintainer).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Automatically reflect a web-UI journey stage completion in pipeline-state.json — artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
Test plan: artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s2-test-plan.md
Contract: artefacts/2026-08-07-cross-surface-state-sync/dor/css-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- ADR-020: the pipeline-state.json write MUST use req.session.accessToken via
  the GitHub Contents API — never a service account or GITHUB_TOKEN. Verify
  the resulting commit author matches the authenticated user (this is checked
  again at DoD per ADR-020's own stated consequence).
- Bounded in-request retry only — do NOT store the token or any credential
  for later background use. If retries exhaust, log a sync_log gap entry
  (entry_type: 'gap') and let the request succeed anyway (das-s1's artefact
  commit remains authoritative for stage completion).
- D37 (injectable adapter rule): setPipelineStateCommitWriter()/
  getPipelineStateCommitWriter(); stub throws by default; wire the real
  implementation as a SEPARATE task from the handler task.
- Reuse mtrr-s1's ownerRepoForFeature for repo resolution — do not
  reimplement repo resolution.
- Create the sync_log table (shared with css-s3 — do not create a second,
  near-identical table when css-s3 lands): feature_slug, tenant_id,
  entry_type, pipeline_state_value, journey_value, resolved_value, created_at.
- Out of scope: background/queued retry; conflict detection (css-s3); full
  gate-vocabulary coverage beyond generic test-plan exercising (css-s4).
- Architecture standards: read .github/architecture-guardrails.md and the two
  matched standards files (web-ui-patterns.md, data-standards.md) in full
  before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Platform maintainer / Product owner (solo repo), 2026-08-07

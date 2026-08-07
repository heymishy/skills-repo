# Definition of Ready: Backfill already-completed stage artefacts to a repo at the moment it's connected

**Review artefact:** artefacts/2026-08-06-durable-artefact-storage/review/das-s3-review-2.md
**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
**Test plan reference:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-06-durable-artefact-storage/dor/das-s3-dor-contract.md`.

**Contract Review outcome:** No mismatches found — the proposed consolidation onto `_applyRepoChange` and migration of `handlePostProductRepoCreate` align with all 4 ACs and the story's own Architecture Constraints (corrected at Run 2 review to the accurate 3-entry-point picture). ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator who connects a repo after stages already completed |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ | Extends das-s1/das-s2's durability guarantee, grounded in a real live finding |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies lists das-s1/das-s2 (external to this story, both merged, in-epic) — no new schema field this story depends on that those two didn't already establish |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, D37, and the corrected 3-entry-point consolidation constraint all named; Run 2 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs — pure backend/API change |
| H-NFR | NFR profile exists or story has explicit NFRs | ✅ | Story's own NFR section populated (Performance/Security/Audit real; Accessibility explicitly N/A) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ N/A | No data classification field required — story-level NFRs suffice, no feature NFR profile artefact exists for this epic beyond story-level NFRs (consistent with das-s1/das-s2's own DoR treatment) |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ | Discovery already approved for das-s1/das-s2; das-s3 extends the same approved epic |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | Story names D37 for any new backfill adapter; wiring task required in implementation plan |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM findings ever | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — solo-maintainer RISK-ACCEPT, consistent with this session's established pattern |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards injection

Domain tags: `[web-ui, data]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/data/data-standards.md` (both confirmed present on disk earlier this session for css-s1..s4; still present).

---

## Oversight level

**High** — inherited from the parent epic (`durable-artefact-storage`'s own Human Oversight Level). Per the DoR skill's own rule: named human sign-off required before assigning to the coding agent.

> 🔴 **High oversight** — named sign-off required.
> Who is signing off on this story?

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Backfill already-completed stage artefacts to a repo at the moment it's connected — artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
Test plan: artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md
Contract: artefacts/2026-08-06-durable-artefact-storage/dor/das-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The single consolidation point for this feature is _applyRepoChange in
  src/web-ui/routes/product-repo.js -- add the backfill call there, once.
  Do NOT add a separate backfill call inside handlePutProductEdit,
  handlePostConnectRepo, or handlePostProductRepoCreate directly -- all
  three must go through _applyRepoChange to get this feature.
- handlePostProductRepoCreate (src/web-ui/routes/products.js) currently
  does its OWN raw UPDATE instead of calling _applyRepoChange -- migrate
  it to call _applyRepoChange instead, removing its duplicate UPDATE.
  Its own repo-creation logic (_repoAdapter.createRepo, RepoNameTakenError
  handling) is unchanged; only the DB-write step at the end changes.
- Reuse das-s1's existing artefact-commit-writer.js's commitArtefact for
  the actual commit -- do not write a new commit mechanism.
- ADR-025 (multi-tenancy): the backfill's own query for already-completed,
  not-yet-backed-up stages must remain tenant_id-scoped.
- D37 (injectable adapter rule) applies to any new adapter function
  introduced for finding stages needing backfill.
- Out of scope: recovering already-lost content from prior redeploys; any
  UI rendering of the new backfill response field.
- Architecture standards: read .github/architecture-guardrails.md and the
  two matched standards files in full before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Platform maintainer / Product owner, 2026-08-07

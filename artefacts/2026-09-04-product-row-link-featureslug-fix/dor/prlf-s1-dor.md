# Definition of Ready Checklist

## Definition of Ready: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Story reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**Test plan reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/test-plans/prlf-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs (2 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric this whole investigation thread has targeted; real, confirmed `p3.3` collision cited as evidence |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `fal-s1`, `pefl-s1`, `aada-s1` — all merged, DoD-complete. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — single field-read change, single construction site confirmed via `grep` before writing the contract. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — presence/shape assertion on a rendered HTML string |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-product-row-link-featureslug-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1/ppg-s1/fal-s1/pefl-s1/aada-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("let's do this new design and the short track story"), confirmed via AskUserQuestion sequencing this as Story 2 of 3. Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Single-line field-read change, one construction site confirmed via direct grep, exercising already-computed data from two already-shipped, already-tested prior stories. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug — artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
Test plan: artefacts/2026-09-04-product-row-link-featureslug-fix/test-plans/prlf-s1-test-plan.md
DoR contract: artefacts/2026-09-04-product-row-link-featureslug-fix/dor/prlf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

In _renderPvcItemRow (src/web-ui/routes/products.js): change the row
link's href from '/features/' + _escapeHtml(item.slug) to
'/features/' + _escapeHtml(item.featureSlug || item.slug).

Constraints:
- Do NOT modify computeTaxonomyRollup, groupItemsByModule, or
  groupItemsByPhase -- the featureSlug field this story reads is already
  computed and correct.
- Do NOT modify handleGetFeatureArtefacts's own server-side resolver
  (fal-s1's taxonomy-scan fallback) -- it remains in place for
  non-product-page navigation paths.
- Do NOT add any anchor/fragment to the link -- speculative, not in scope.
- No new npm dependencies. No schema or query change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — single field-read change in one function, exercising already-computed, already-tested data from two prior stories.
**Sign-off required:** No
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04.

# Definition of Ready: Session-origin indicator on the org kanban board

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
**Test plan reference:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s3-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-09-08

**Contract Proposal:** artefacts/2026-09-08-session-origin-badge/dor/sob-s3-dor-contract.md

**Contract review:** ✅ Passed — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Hamish King, Platform Owner" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 covered |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | "List-view session-origin visibility" |
| H6 | Complexity is rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 2 LOW (noted, non-blocking) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream sob-s1 named; `schemaDepends: []` declared — code dependency, not a schema field |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 4 constraints listed; review found 0 HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No trigger patterns |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-NFR-profile | NFR profile presence | ✅ | Story NFRs populated; profile exists |
| H-GOV | `## Approved By` non-blank, non-engineer-only | ✅ | Same discovery artefact — "Hamish King — Platform Owner — 2026-09-08" |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | Reuses sob-s1's existing seam unchanged — introduces no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | No MEDIUM findings (2 LOW noted, non-blocking per review) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases at pre-code sign-off | RISK-ACCEPT logged in `decisions.md` (2026-09-08, same entry covers all 3 stories) — verified post-merge instead |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | Gap table states "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` (sha256 `8c188790ec1c3808901cd26821ffabf9f1be9e16d5396dee25ea5c13ab6d7fc2`) — read in full before implementing.

Most directly relevant sections for this story:

- **HTML render function unit test pattern**: assert on specific string fragments in the rendered kanban card HTML, reusing `kanban-view.js`'s existing test conventions.
- No injectable-adapter section applies — this story reuses sob-s1's existing seam without modification, introduces no new one.
- No shared-shell change — only `kanban-view.js`'s card-rendering markup gains the indicator.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Session-origin indicator on the org kanban board — artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
Test plan: artefacts/2026-09-08-session-origin-badge/test-plans/sob-s3-test-plan.md
Contract: artefacts/2026-09-08-session-origin-badge/dor/sob-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Requires sob-s1 merged first (reuses its _getSessionOriginBulk/
  setGetSessionOriginBulk seam and deriveSessionOrigin unchanged) — do not
  build a second bulk-lookup function.
- handleGetOrgKanban's own query (SELECT journey_id, feature_slug, ... FROM
  journeys WHERE product_id = $1 AND tenant_id = $2) must remain unmodified
  by this story — do not add a taxonomy merge here, that is explicitly out
  of scope (see decisions.md).
- Out of scope: adding a taxonomy merge to handleGetOrgKanban; any change to
  which cards this board shows.
- Architecture standards: read .github/architecture-guardrails.md and
  .github/standards/web-ui/web-ui-patterns.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

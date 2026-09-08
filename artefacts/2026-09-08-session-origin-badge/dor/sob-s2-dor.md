# Definition of Ready: Session-origin indicator on the /journey dashboard

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md
**Test plan reference:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s2-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-09-08

**Contract Proposal:** artefacts/2026-09-08-session-origin-badge/dor/sob-s2-dor-contract.md

**Contract review:** ✅ Passed — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Hamish King, Platform Owner" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | "List-view session-origin visibility" |
| H6 | Complexity is rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream sob-s1 named; `schemaDepends: []` declared in DoR contract — this is a code dependency (imported function), not a `pipeline-state.json` field, so zero fields to check |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 4 constraints listed; review found 0 HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No trigger patterns |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-NFR-profile | NFR profile presence | ✅ | Story NFRs populated; profile exists |
| H-GOV | `## Approved By` non-blank, non-engineer-only | ✅ | Same discovery artefact as sob-s1 — "Hamish King — Platform Owner — 2026-09-08" |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | This story introduces no new injectable adapter — it reuses sob-s1's `deriveSessionOrigin` (a plain function, not an adapter) unchanged |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | No MEDIUM findings |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases at pre-code sign-off | RISK-ACCEPT logged in `decisions.md` (2026-09-08, same entry covers all 3 stories) — verified post-merge instead |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | Gap table states "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` (sha256 `8c188790ec1c3808901cd26821ffabf9f1be9e16d5396dee25ea5c13ab6d7fc2`) — read in full before implementing.

Most directly relevant sections for this story:

- **HTML render function unit test pattern**: assert on specific string fragments in `/journey`'s rendered card HTML — do not snapshot the whole page.
- No injectable-adapter section applies — this story introduces no new adapter.
- No shared-shell change — `/journey`'s existing page shell is untouched; only the per-card indicator markup (already established by sob-s1) is added to the card template.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Session-origin indicator on the /journey dashboard — artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md
Test plan: artefacts/2026-09-08-session-origin-badge/test-plans/sob-s2-test-plan.md
Contract: artefacts/2026-09-08-session-origin-badge/dor/sob-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Requires sob-s1 merged first (imports its deriveSessionOrigin function
  from features.js) — do not reimplement the tri-state logic locally.
- A synthesized /journey entry from _mergeStateFeaturesIntoJourneyList has
  NO completedStages property at all (not an empty array — the property is
  absent). Map it to { hasJourney: false, completedStages: [] } before
  calling deriveSessionOrigin. Do not read journey.completedStages.length
  on a synthesized entry without this mapping — it will throw or misclassify.
- No new query: listJourneys() already returns full journey objects with
  completedStages intact. Do not add a new bulk-lookup call for this story.
- Out of scope: org kanban wiring (sob-s3); changing what
  _mergeStateFeaturesIntoJourneyList synthesizes.
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

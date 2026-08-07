# Definition of Ready Checklist

## Definition of Ready: Fix "New feature" redirecting to the sign-in page for logged-in users

**Story reference:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Test plan reference:** artefacts/2026-07-19-new-feature-redirect-fix/test-plans/jrf-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-19

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Core add-a-feature flow |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Exact routing mismatch cited with file/line |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-new-feature-redirect-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-19)** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-19-new-feature-redirect-fix/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Explicit mitigation recorded | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix "New feature" redirecting to the sign-in page for logged-in users — artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
Test plan: artefacts/2026-07-19-new-feature-redirect-fix/test-plans/jrf-s1-test-plan.md
DoR contract: artefacts/2026-07-19-new-feature-redirect-fix/dor/jrf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. First read src/web-ui/server.js's
full router chain (the if/else if pathname-matching block) to build an accurate
picture of every currently-registered route shape — do not assume the codebase
matches what any prior story or comment describes, confirm directly.

Constraints:
- Read src/web-ui/routes/products.js's handlePostProductFeature, src/web-ui/routes/journey.js's
  handleGetJourney, and every /journey*-prefixed route registration in server.js
  before writing anything.
- Prefer fixing the redirect target string over registering a new route — only
  register a new route if investigation genuinely shows no existing route covers
  "open a specific journey by ID at its discovery stage."
- IT1/IT2 must assert on response body content (does NOT match renderLoginPage's
  markers; DOES match the correct journeyId's discovery content) — not just an
  HTTP status code, since a wrong-but-still-200 page would pass a status-only check.
- IT5 is a full regression pass — run the existing test suite in full and confirm
  the baseline failure count is unchanged (currently 67/345 pre-existing failures
  documented in tests/known-baseline-failures.json) before considering this story done.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — a confirmed, well-understood routing bug with a narrow, low-risk fix; AC3's regression guard specifically protects real authentication enforcement.
**Sign-off required:** No
**Signed off by:** Hamish King (Founder/Operator) — found this bug directly during live staging verification, 2026-07-19

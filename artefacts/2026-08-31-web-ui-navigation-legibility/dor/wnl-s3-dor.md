# Definition of Ready Checklist

## Definition of Ready: No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Test plan reference:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s3-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-10

---

## Contract Proposal

See `artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s3-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (reuse `_mergeStateFeaturesIntoJourneyList` per ADR-028, presence-only entry point) directly satisfies AC1–AC6, each AC maps to a real, already-written integration test. No mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Developer/engineer or Platform maintainer who works across both Claude Code CLI and the web UI" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | M3 — Cross-channel feature discoverability from the dashboard |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` Run 2 (`wnl-s3-review-2.md`) — 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block: "None" upstream (`cross-channel-feature-continuity`/`ep1-s1` is already DoD-complete, reused read-only, not a blocking in-flight dependency) — no `schemaDepends` declaration required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, explicitly cites and correctly applies ADR-028 (the single most relevant guardrail for this feature); `/review` Category E clean at Run 2 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent ACs — presence/link-destination checks, not on-screen position |
| H-NFR | NFR profile exists | ✅ | Feature-level `nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Platform Owner — 2026-08-31" present and substantive |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — reuses an existing, already-D37-compliant function (`_mergeStateFeaturesIntoJourneyList`) unmodified |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 13/13 (10 direct passes + 3 explicit N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | All Run 1 MEDIUM findings resolved before Run 2 | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** Root cause was confirmed via direct code reading (not guessed) before the story was written; the specific test (`entry-point-shown-for-cli-only-unbackfilled-feature`) that would catch a wrong/naive implementation is explicitly named and designed to fail by construction if the fix is shallow. RISK-ACCEPT logged in `decisions.md`. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps in this test plan — all 6 ACs have a real automated test | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: No-product, CLI-authored features are reachable within one click from the /dashboard landing page — artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
Test plan: artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s3-test-plan.md
DoR contract: artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Do NOT ship a naive
Postgres-only count check -- read journey.js's own
_mergeStateFeaturesIntoJourneyList (~line 4447) first and understand
exactly how it classifies a CLI-only, not-yet-backfilled feature as
"no product" before writing any code. A fix that only checks
getProductsNavSummary's own noProductJourneyCount will pass every test
except entry-point-shown-for-cli-only-unbackfilled-feature -- that
test exists specifically to catch this exact shortcut.

(1) src/web-ui/routes/products.js: in handleGetDashboard and
_renderProductDashboard, add a new entry point to the dashboard body
(a link, styled consistently with the existing product-card markup at
~line 168) that appears whenever noProductJourneyCount > 0 OR at least
one non-terminal pipeline-state.json feature (read via the same
mechanism _mergeStateFeaturesIntoJourneyList uses) has no matching
journey-store record. The entry point must:
  - Show NO numeric count -- presence-only copy (e.g. "No product
    work →"), per decisions.md's own logged design decision.
  - Link to /journey (the same destination the sidebar's existing "No
    product" link already provides) -- do not build a new route or view.
  - Not render at all when neither condition is true (AC4).
Reuse _mergeStateFeaturesIntoJourneyList's existing logic directly, or
extract a small shared boolean helper from the same underlying
computation -- do not write a second, independent "does no-product
work exist" query (ADR-028).

(2) Create tests/check-wnl-s3-dashboard-no-product-entry.js.
Implement all 6 integration tests named in the test plan, using a
mocked pool object and a temporary pipeline-state.json fixture
directory (fs.mkdtempSync) for the CLI-only-feature test case.

Constraints:
- Do NOT modify _mergeStateFeaturesIntoJourneyList itself, or
  /journey's own rendering.
- Do NOT fix the sidebar's own noProductJourneyCount undercount --
  explicitly out of scope (see decisions.md). If confirmed to exist
  during implementation, log it as a follow-up finding in
  decisions.md, do not silently expand this story's scope.
- Do NOT change existing product-card rendering, or how products are
  created/connected.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing, especially ADR-028. Do not introduce patterns
  listed as anti-patterns or violate named mandatory constraints or
  Active ADRs.
- No new npm dependencies (product/tech-stack.md's runtime constraint,
  Mandatory Constraint MC-SELF-02 -- do not cite ADR-009, which governs
  an unrelated topic).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — matches epic-level oversight. Complexity is rated 2 (integration-shape reconciliation, not risk), but no security, compliance, or data-model surface is touched, and the root cause was confirmed via direct code reading before the story was written.
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

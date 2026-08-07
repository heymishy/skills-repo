# DoR Contract: Fix "New feature" redirecting to the sign-in page for logged-in users

**Story reference:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Test plan reference:** artefacts/2026-07-19-new-feature-redirect-fix/test-plans/jrf-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Trace `handleGetJourney` (`src/web-ui/routes/journey.js:278`) and the `/journey/<slug>/resume` route to determine which, if either, is the correct existing mechanism for "open a specific just-created journey at its discovery stage."
2. Fix `handlePostProductFeature`'s redirect in `src/web-ui/routes/products.js` to target that correct, existing route — or, if no existing route actually covers this exact need, register a new minimal route in `server.js` that does, following the existing router-chain pattern (`pathname.match(...)` / `req.params = {...}`).
3. New test file `tests/check-jrf-s1-*.js` covering all 5 integration tests from the test plan.

**What will NOT be built:**
- No change to any other redirect in the codebase.
- No change to `handleGetJourney`'s internal logic beyond what's needed to correctly receive this redirect, if it turns out to be the right target.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | IT1 | integration |
| AC2 | IT2, IT3 | integration |
| AC3 | IT4 | integration |
| AC4 | IT5 (full regression pass) | integration |

**Assumptions:**
- The correct fix is most likely changing the redirect *target string* in `products.js` to match an already-existing, already-correct route — registering a brand new route is the fallback only if investigation shows no existing route actually does this job.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, possibly `src/web-ui/server.js` (only if a new route is genuinely needed), `tests/check-jrf-s1-*.js` (new)
Services: None
APIs: None

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ verified by IT1 — ✅ aligned.
- AC2 ↔ verified by IT2/IT3 — ✅ aligned.
- AC3 ↔ verified by IT4 — ✅ aligned.
- AC4 ↔ verified by IT5 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Core add-a-feature flow, currently completely broken |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Exact routing mismatch identified and cited |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-new-feature-redirect-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1`/`stis-s1`/`gav-s1`/`dta-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass**, with the H-GOV note recorded transparently.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior short-track precedent — operator directly found and requested this fix, live, with full context. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap (exact target route TBD) has an explicit mitigation | — |

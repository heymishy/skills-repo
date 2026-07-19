# DoR Contract: Give every product a UI path to connect or create a GitHub repo

**Story reference:** artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
**Test plan reference:** artefacts/2026-07-19-product-repo-connect-ux/test-plans/rpc-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Extend `_renderProductView` (`src/web-ui/routes/products.js:104`) to conditionally render a "Connect repo" affordance when `repo_owner`/`repo_name` are absent, offering two paths: create a new repo (POSTs to the existing `/products/:id/repo/create`) or connect an existing one (submits owner+repo to the existing `handlePutProductEdit` repo-association path).
2. When a repo is already connected, render its owner/name instead of the connect prompt (AC4).
3. New test file `tests/check-rpc-s1-*.js` covering U1-U2 and IT1-IT3 from the test plan.

**What will NOT be built:**
- No change to `handlePostProductRepoCreate` or `handlePutProductEdit`'s own logic.
- No repo-disconnection UI.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | U1 | unit |
| AC2 | IT1 | integration |
| AC3 | IT2 | integration |
| AC4 | U2 | unit |
| NFR-Security | IT3 | integration |

**Assumptions:**
- The existing `handlePostProductRepoCreate` and `handlePutProductEdit` handlers' request shapes (params they expect) are read directly from their current implementation before building the new form markup — not assumed from their names alone.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-rpc-s1-*.js` (new)
Services: None
APIs: None (reuses existing GitHub-repo-creation/association logic already wired)

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ built via conditional rendering in `_renderProductView`, verified by U1 — ✅ aligned.
- AC2 ↔ built via reusing `handlePostProductRepoCreate` unchanged, verified by IT1 — ✅ aligned.
- AC3 ↔ built via reusing `handlePutProductEdit`'s repo-association path unchanged, verified by IT2 — ✅ aligned.
- AC4 ↔ built via the same conditional rendering, verified by U2 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator who has just created a new product" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | product-rollup's Metric 1/Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | MC-SEC-01 referenced |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-product-repo-connect-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior short-track precedent. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | No gaps recorded | — |

# DoR Contract: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status

**Story reference:** artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
**Test plan reference:** artefacts/2026-07-19-kanban-consolidation/test-plans/kbc-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Generalise `renderKanban` (`src/web-ui/views/kanban-view.js`) to accept a generic `{ columns: [{ stage, cards: [...] }], ideas? }` shape (or equivalent), making `ideas` optional, rather than the current `{ features, ideas }` shape tied to GitHub-repo features.
2. Update `handleGetProductKanban` and `handleGetOrgKanban` (`src/web-ui/routes/products.js`) to call this shared renderer and return real HTML (`Content-Type: text/html`), instead of raw JSON.
3. Build a new tenant-scope data function (aggregating journeys across every product owned by a tenant) and wire it to a new `GET /dashboard?view=board` route, calling the same shared renderer.
4. Remove `/features`, `/actions`, `/status`, `/status/export` route registrations from `server.js`; delete `handleGetFeatures` and the `/status`/`/actions` handler functions/modules once confirmed unused elsewhere; migrate any test coverage for `renderKanban`'s own behaviour (as opposed to the removed routes) to test the generalised function directly.
5. New/updated test file(s) covering all 9 unit tests + 3 integration tests + 2 NFR tests from the test plan.

**What will NOT be built:**
- No drag-and-drop or other new interactive board behaviour.
- No change to `handleGetProductKanban`/`handleGetOrgKanban`'s underlying data queries beyond what's needed to feed the new renderer shape.
- No redirect or deprecation notice for the removed routes — per the operator's confirmed decision, this is an outright removal.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | U1-U5 (one renderer, three scope-specific callers) | unit |
| AC2 | U2, IT1 | unit + integration |
| AC3 | U3, IT2 | unit + integration |
| AC4 | U4, U5, IT3 | unit + integration |
| AC5 | U8, U9 | unit |
| AC6 | U6, U7 | unit |
| NFR-Security | Escaping test across all 3 scopes | unit |
| NFR-Performance | Tenant-aggregate timing test | integration |

**Assumptions:**
- `_listArtefacts` and other helpers currently imported by `features.js` are checked for use elsewhere before `features.js` itself is deleted wholesale — if still needed by another module, extract rather than delete.
- The tenant-level aggregate (AC4) reuses the same `Promise.all`-parallelised pattern `handleGetDashboard` already uses for per-product queries, per the test plan's NFR-Performance note.

**Estimated touch points:**
Files: `src/web-ui/views/kanban-view.js`, `src/web-ui/routes/products.js`, `src/web-ui/server.js`, `src/web-ui/routes/features.js` (deleted or reduced), status/actions handler file(s) (deleted), new/updated test files
Services: None
APIs: None

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ built via generalising `renderKanban`, verified by U1-U5 — ✅ aligned.
- AC2 ↔ built via updating `handleGetProductKanban`, verified by U2/IT1 — ✅ aligned.
- AC3 ↔ built via updating `handleGetOrgKanban`, verified by U3/IT2 — ✅ aligned.
- AC4 ↔ built via new tenant-scope function + `/dashboard?view=board`, verified by U4/U5/IT3 — ✅ aligned.
- AC5 ↔ built via route/handler removal, verified by U8/U9 — ✅ aligned.
- AC6 ↔ built via migrating `renderKanban`'s own test coverage, verified by U6/U7 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Maintainability of the kanban/board feature surface |
| H6 | Complexity is rated | ✅ | Rating 2, Stable (both open questions resolved by operator confirmation) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Both design decisions recorded with operator confirmation date |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — pure HTML structure/data correctness |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-kanban-consolidation/nfr-profile.md` |
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
| W2 | Scope stability declared | ✅ | Stable, both prior open questions resolved | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case, particularly around the `/features`/`/actions`/`/status` removal's blast radius | **Acknowledged — proceed.** Operator explicitly confirmed the outright-removal decision knowing the risk (see decisions.md). |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | The one gap (external consumer risk) is explicitly operator-accepted, not left uncertain | — |

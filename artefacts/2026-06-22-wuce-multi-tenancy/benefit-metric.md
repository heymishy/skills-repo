# Benefit Metric: WUCE Multi-Tenancy — Authorization Guard and Tenant Isolation

**Status:** Active
**Feature slug:** wuce-multi-tenancy
**Linked discovery:** artefacts/2026-06-22-wuce-multi-tenancy/discovery.md
**Date:** 2026-06-22
**Skill version:** /benefit-metric

> **Attribution note:** The discovery artefact's `Approved By` field is absent (no Attribution section was included at write time). This artefact proceeds with that acknowledgement. Revisit before DoR: populate `Approved By` in the discovery artefact before Phase 0 sign-off.

---

## Metric owner

**Owner:** Hamish King — solo founder / operator
**Reviewers:** Hamish King (self-review; sole operator on this deployment)

> Solo-founder context: no external metric reviewer available. Metrics are self-assessed against automated test suite output. For future security assessments, the authorization coverage rate (M1) and KNOWN BUG closure (T3-M1) are the primary evidence artefacts.

---

## Tier 1 — Product outcome metrics

### M1 — Authorization coverage rate

**What we're measuring:** The percentage of journey API route handlers that enforce an ownership or tenant access check before returning data, computed as: (handlers with guard) ÷ (total handlers in the KNOWN BUG list + 2 existing mutating routes) × 100.

**Baseline:** 2 of 11 route handlers have an ownership check (18%). The 2 that check are `handlePostJourneyRecommit` and `handlePostJourneyStageCommit`. The 9 that do not are confirmed in discovery.

**Target:** 11 of 11 (100%) — all route handlers enforce the guard via the shared `requireJourneyAccess()` function, not ad-hoc inline checks. Phase 0 delivers this.

**Minimum validation signal:** 9 of 11 (≥82%) — the 9 KNOWN BUG routes are guarded, even if the 2 existing mutating routes still use the old inline pattern. This partial signal is not acceptable as a final state but indicates Phase 0 implementation is substantially complete.

**Feedback loop:** Measured automatically by the Phase 0 test suite (`check-p0.1-*` and `check-p0.2-*`). CI gate runs on every PR touching `src/web-ui/routes/journey.js`. Signal: test suite pass/fail. Measurement cadence: on every affected PR merge. Owner: Hamish King.

---

### M2 — Cross-tenant journey data leakage prevention

**What we're measuring:** Whether a user authenticated to tenant A can successfully retrieve journey data (JSON, HTML, trace, or artefact content) belonging to a user in tenant B, tested by the automated tenant-isolation test suite.

**Baseline:** Not yet established in a multi-tenant context (Phase 1 does not yet exist). Current state: any authenticated user can read any other user's journey — 100% of journeys are accessible to any logged-in user. The bug is confirmed, not measured.

**Target:** Zero cross-tenant API responses return journey data for a caller from a different tenant. Verified by: the tenant-isolation test suite (Phase 2 story p2.2) asserting that a simulated tenant B session returns 404 on all journey reads belonging to tenant A. The filesystem scan of tenant A's directory tree returns zero files from tenant B.

**Minimum validation signal:** Phase 0 complete — an unauthenticated caller (or a caller with a different `login`) receives 404 on all 9 KNOWN BUG routes. This is a necessary but not sufficient signal for full cross-tenant isolation (Phase 1+ is required for the tenant boundary to have real meaning).

**Feedback loop:** Tenant-isolation test suite (story p2.2) runs as a CI gate from Phase 2 onward. Binary result: PASS (zero leakage) or FAIL (any cross-tenant response). Owner: Hamish King. Cadence: every PR touching `journey.js`, `session-store.js`, or `journey-disk.js` after Phase 2 merges.

---

## Tier 3 — Security and risk-reduction metrics

### T3-M1 — KNOWN BUG closure: journey authorization gap

**Obligation source:** KNOWN BUG confirmed in codebase review during discovery (2026-06-22). Nine journey route handlers return data to any authenticated user regardless of ownership. This is an active, exploitable vulnerability on any deployment with more than one user.

**Metric:** Count of journey route handlers without a `requireJourneyAccess()` guard that return journey-specific data to the caller.

**Baseline:** 9 unguarded handlers (confirmed in discovery codebase review).

**Target:** 0 unguarded handlers. Every handler either (a) calls `requireJourneyAccess()` and handles the typed error result, or (b) does not return journey-specific data. Binary: OPEN or CLOSED.

**Validated by:** Hamish King — the Phase 0 test suite (`check-p0.2-*`) must show all guard assertions passing. A code grep of `journey.js` route exports must show zero handlers that return journey data without calling the guard. Both checks must pass before DoR sign-off on p0.2.

**Sign-off required at DoR:** Yes — for story p0.2. The H-NFR block in the DoR checklist must confirm: (1) `requireJourneyAccess()` is wired in all 9 handlers, (2) test suite assertions exist for each handler, and (3) no handler was missed (full export list confirmed).

---

### T3-M2 — Path-traversal guard validity under variable repoRoot

**Obligation source:** Discovery constraint C3 ("path-traversal guards must not be weakened; Phase 2 and Phase 5 must re-audit them with `tenantId` as a variable input"). In Phase 2+, `repoRoot` is derived from `tenantId` — an externally-influenced value — rather than being a compile-time constant. A maliciously crafted `tenantId` could attempt directory traversal if guards are not re-validated.

**Metric:** Number of path-traversal guards that fail adversarial `tenantId` injection tests (a crafted `tenantId` containing `../`, URL-encoded variants, null bytes, or overly long strings that attempt to escape the tenant directory).

**Baseline:** Not yet established (repoRoot is currently static; existing guards are correct for a static root but have not been tested against a variable-root threat model). Guards currently exist in `journey.js` — count and pattern confirmed in discovery.

**Target:** 0 guard failures against the adversarial test suite (story p5.1). All guards pass `path.resolve(tenantDerivedPath).startsWith(resolvedTenantRoot + path.sep)` and the assertion fires for every attempted traversal.

**Validated by:** adversarial test suite (story p5.1). Must run before p5.1 DoR sign-off.

**Sign-off required at DoR:** Yes — for story p5.1. The `tenantId` slugification function must be validated separately (inputs like `../../etc/passwd`, `%2e%2e%2f`, and a 256-character string must all produce a safe slug or be rejected before use in path construction).

---

## Baselines not yet established — measurement plan

| Metric | Why unknown | When established |
|--------|------------|-----------------|
| M2 cross-tenant leakage | No multi-tenant deployment exists yet; Phase 1 required before tenantId-based isolation is meaningful | At Phase 2 p2.2 completion |
| T3-M2 traversal guard baseline | repoRoot is currently static; variable-root threat model has not been exercised | At Phase 5 p5.1 test suite first run |

---

## Metric summary

| ID | Tier | Metric | Baseline | Target | Min signal | Phase gate |
|----|------|--------|----------|--------|------------|------------|
| M1 | 1 | Authorization coverage rate | 18% (2/11) | 100% (11/11) | 82% (9/11) | Phase 0 (p0.2) |
| M2 | 1 | Cross-tenant leakage prevention | 0% isolated | 100% isolated | Phase 0 404s on all 9 routes | Phase 2 (p2.2) |
| T3-M1 | 3 | KNOWN BUG closure — unguarded handlers | 9 open | 0 open | N/A — binary | Phase 0 (p0.2 DoR) |
| T3-M2 | 3 | Traversal guard validity under variable repoRoot | Not established | 0 failures | N/A — binary | Phase 5 (p5.1 DoR) |

---

## Metric coverage matrix

Maps each metric to the stories that move it. Added at definition completion per SKILL.md Step 5.

| Metric | Contributing stories |
|--------|---------------------|
| M1 (Authorization coverage rate) | p0.1 (guard module establishes the function), p0.2 (wires guard into all 11 handlers — delivers 100% coverage) |
| M2 (Cross-tenant journey data leakage prevention) | p1.1 (establishes tenantId identity at OAuth), p1.2 (writes tenantId to session and journey; isSameTenant real enforcement), p2.1 (filesystem isolation — tenant-namespaced repoRoot and session store), p2.2 (automated measurement — binary PASS/FAIL CI gate), p4.1 (extends M2 guarantee to inference layer — cache key and rate-limit isolation) |
| T3-M1 (KNOWN BUG closure — 9 unguarded handlers) | p0.1 (guard module — prerequisite), p0.2 (closes the bug — 9 open → 0 open) |
| T3-M2 (Path-traversal guard validity under variable tenantId-derived repoRoot) | p5.1 (adversarial test suite — sole measurement and closure mechanism for this metric) |

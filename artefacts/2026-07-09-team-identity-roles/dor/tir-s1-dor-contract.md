# DoR Contract: Person and team-membership schema replaces tenant-wide role lookup

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A schema migration bootstrap (mirroring the existing `journey-store-pg.js`/`arl-s1` `CREATE TABLE IF NOT EXISTS` startup convention) creating `people` and `team_memberships` tables.
2. A backfill step, run once during that same bootstrap, copying every existing `user_roles` row into `people` + `team_memberships` with the role value unchanged.
3. A new (or extended) D37 adapter — replacing/extending `src/web-ui/modules/user-roles.js`'s `getUserRole`/`setGetUserRole` — that resolves role by `(person_id, tenant_id)` instead of `tenant_id` alone.
4. Updated call sites in `src/web-ui/routes/auth.js` and `src/web-ui/routes/auth-email.js` (currently calling `_userRoles.getUserRole(tenantId)` at login) to resolve the person for the authenticating identity first, then use the new person-scoped lookup.
5. Rewiring `server.js`'s existing adapter-setter call (currently at line ~185, wiring `setGetUserRole` to a real `SELECT role FROM user_roles WHERE tenant_id = $1` query) to instead wire the new person/team-scoped query — this is AC6, added during this DoR pass after H-ADAPTER found the original story draft lacked an explicit wiring AC.

**What will NOT be built:**
- No UI for switching between multiple teams — the schema supports many-to-many person↔team membership, but nothing surfaces it.
- No backfill of historical login/audit events — only current role state is migrated.
- No removal of the legacy `user_roles` table — left in place, unused, decision on dropping it deferred.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test (table-shape assertion against mocked pool) + integration test (idempotent rerun) | unit + integration |
| AC2 | Integration test (seeded legacy row → migration → assert new-schema row matches) | integration |
| AC3 | Integration test (login via all 3 providers, assert new-schema lookup path used, legacy lookup spy never called) | integration |
| AC4 | Regression-baseline check (`node scripts/run-all-tests.js` diffed against the known baseline) | manual/process-level |
| AC5 | Integration test (unmigrated legacy row, login triggers lazy creation) | integration |
| AC6 | Unit test (inspect the `server.js` adapter-setter call site for the real person/team-scoped query, not the legacy tenant-wide one) | unit |

**Assumptions:**
- The new adapter can reuse `user-roles.js`'s existing throw-on-unwired stub contract (D37) rather than needing a wholly new module — extending in place is preferred over a parallel adapter, consistent with this feature's Architecture Constraints on ADR-025 (no second, parallel isolation/lookup mechanism).
- The backfill runs unconditionally at startup (idempotent `CREATE TABLE IF NOT EXISTS` + `INSERT ... ON CONFLICT DO NOTHING`-style safety), not as a manually-triggered one-off script — matching the existing `journey-store-pg.js` convention this codebase already uses for schema bootstrap.
- `DATABASE_URL` is available in the same way it already is for `arl-s1`'s `user_roles` wiring (the `_userRolesPool` at server.js line ~184) — this story does not introduce a new database connection mechanism.

**Estimated touch points:**
Files: `src/web-ui/modules/user-roles.js` (or its replacement), `src/web-ui/routes/auth.js`, `src/web-ui/routes/auth-email.js`, `src/web-ui/server.js` (adapter wiring), new `tests/check-tir-s1-person-team-schema.js`
Services: Postgres (`DATABASE_URL`, existing connection)
APIs: None

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ migration bootstrap + idempotent rerun, verified by the unit + integration tests above — ✅ aligned.
- AC2 ↔ backfill step, verified by the seeded-legacy-row integration test — ✅ aligned.
- AC3 ↔ updated call sites in `auth.js`/`auth-email.js`, verified by the multi-provider login integration test — ✅ aligned.
- AC4 ↔ no code change of its own; a regression-baseline check across the whole story's diff — ✅ aligned, matches the established pcr-s1/bri-s2.5 regression-gate pattern.
- AC5 ↔ lazy-creation path in the same call-site update as AC3, verified by its own integration test — ✅ aligned.
- AC6 ↔ `server.js` rewiring, verified by the adapter-setter unit test — ✅ aligned. This AC was added during this DoR pass specifically to close the H-ADAPTER gap; the contract's touch-point list already included `server.js` before this addition, so no new file scope was introduced by adding it.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "solo operator (today's persona)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | See coverage table — 0 gaps |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 5 (primary), Metric 1 (foundational) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 1 LOW (persona phrasing, non-blocking) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, D37, migration convention all cited; Review Run 1 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-07-09-team-identity-roles/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause (context.yml: unregulated) |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Founder / Operator — 2026-07-12" — populated, non-engineering role |
| H-ADAPTER | D37 adapter wiring check | ✅ | Was a genuine gap (original draft had no explicit wiring AC) — **fixed during this DoR pass**: AC6 added, scoping the `server.js` rewiring; stub default preserves the existing throw-on-unwired contract from `user-roles.js`. Logged in decisions.md. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM (1 LOW, non-blocking) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Operator is driving this feature directly through the pipeline in real time with full context; formal separate sign-off would be redundant at this stage, same rationale as prior short-track stories this session. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps is "None" | — |

---

## Oversight

**Level:** Medium (per epic tir-e1's Human Oversight Level)
**Handling:** Solo-operator repo — no separate named tech lead exists in `context.yml`. This DoR artefact itself is the "share with the tech lead" step; the operator is reviewing it directly in this session.

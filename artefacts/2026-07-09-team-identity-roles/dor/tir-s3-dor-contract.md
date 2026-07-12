# DoR Contract: An admin adds a teammate by identity and assigns a role

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s3-admin-adds-teammate-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A team-management route (admin-only, `requireAdmin`-gated) accepting an identity descriptor and a role, adding or updating a `team_memberships` row for that tenant.
2. Existing-person lookup logic: the identity descriptor must resolve to an existing `people` row (from tir-s1's schema, populated by that person's own prior login) — no placeholder-record creation.
3. Idempotent upsert behaviour: re-adding an existing member updates their role in place rather than duplicating the row.
4. Rejection logic for non-admin callers (403) and for identities with no existing `people` row (AC5, added during /review Run 2).

**What will NOT be built:**
- No invite/email-based signup flow.
- No teammate-removal action.
- No pending-invite state — membership is active immediately on add.
- No placeholder-`people`-row mechanism for never-logged-in identities — explicitly deferred (AC5, Out of Scope).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: admin adds an existing person with a role, assert `team_memberships` row created | integration |
| AC2 | Integration test: assigned role resolves in the teammate's next simulated login | integration |
| AC3 | Integration test: non-admin caller denied 403 | integration |
| AC4 | Integration test: re-add same person, assert single row updated in place | integration |
| AC5 | Integration test: attempt to add an identity with no `people` row, assert clear rejection, no row created | integration |

**Assumptions:**
- The identity descriptor format (GitHub login, Google email, or email/password email) is whatever tir-s1's `people` table already uses to key a person — this story does not invent a new identity-lookup key.
- Role assignment reuses the same `team_memberships` write path for both the initial-add and idempotent-update cases — one code path, not two.

**Estimated touch points:**
Files: new team-management route handler, `team_memberships` access (from tir-s1's schema), new `tests/check-tir-s3-admin-adds-teammate.js`
Services: None new
APIs: None new

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ add-teammate handler, verified directly — ✅ aligned.
- AC2 ↔ role write followed by a simulated login read, verified directly — ✅ aligned.
- AC3 ↔ `requireAdmin`-consistent gating on this new endpoint, verified directly — ✅ aligned.
- AC4 ↔ upsert-not-duplicate logic, verified directly — ✅ aligned.
- AC5 ↔ existing-person-required check (added during review Run 2 to close the AC1-ambiguity finding), verified directly — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Team admin / tech lead" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions (post-Run-2 update) |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2: PASS, 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — same reasoning as tir-s2 (code-level dependency on tir-s1's schema); `dorStatus` confirmed present in schema. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 cited; Review Run 1/2 Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter — app-layer DB logic only, per the story's own Architecture Constraints reasoning |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 2: 0 MEDIUM remain | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as tir-s1/s2. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1)
**Handling:** Same as tir-s1/s2.

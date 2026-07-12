# DoR Contract: An admin bulk-adds teammates from their connected GitHub org

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s5.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s5-github-org-bulk-add-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A bulk-add route (admin-only) that calls the existing `setFetchOrgs` adapter (p1.1) to list the admin's GitHub org members, then calls tir-s3's add-teammate operation once per member not already present, with a fixed default role `engineer`.
2. Skip-existing logic reusing tir-3's idempotent-upsert behaviour so re-running bulk-add never duplicates or resets a manually-changed role.
3. Clear error surfacing when the org-membership API call fails due to insufficient token scope.

**What will NOT be built:**
- No live/ongoing org-membership sync.
- No bulk-add from any non-GitHub directory.
- No per-member role selection within the same bulk action.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: mocked `setFetchOrgs` returns 3 members, assert 3 new `team_memberships` rows with role `engineer` | integration |
| AC2 | Integration test: simulated login as a bulk-added member, assert same resolution as tir-s3's manual add | integration |
| AC3 | Integration test: re-run bulk-add with one member already manually role-changed, assert no duplicate, no overwrite | integration |
| AC4 | Integration test: mocked `setFetchOrgs` rejects with a scope error, assert clear error surfaced, no rows created | integration |

**Assumptions:**
- This story calls tir-s3's add-teammate operation as a function, in a loop — it does not duplicate that logic.
- `setFetchOrgs`'s existing mocking pattern (already used by its own p1.1 tests) is reused here rather than invented fresh.

**Estimated touch points:**
Files: new bulk-add route handler, reuses tir-s3's add-teammate function, new `tests/check-tir-s5-github-org-bulk-add.js`
Services: GitHub org-membership API (via existing `setFetchOrgs` adapter — no new integration)
APIs: None new

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ bulk-add loop over tir-s3's add-teammate operation, verified directly — ✅ aligned.
- AC2 ↔ no separate login path introduced, verified directly — ✅ aligned.
- AC3 ↔ skip-existing/no-overwrite logic, verified directly — ✅ aligned.
- AC4 ↔ clear error on scope failure, verified directly — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Team admin / tech lead" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 (breadth); "So that" clause reworded during review Run 2 to connect directly |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2: PASS, 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — depends on both tir-s1 (schema) and tir-s3 (add-teammate operation reused directly, hard dependency); `dorStatus` confirmed present in schema. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Correctly cites and reuses p1.1's `setFetchOrgs` rather than proposing a new integration |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | Reuses the already-wired `setFetchOrgs` adapter — does not introduce a new one |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 2: 0 MEDIUM remain (both Run 1 MEDIUMs resolved — one genuinely, one was a Run 1 misquote, see review) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior stories. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1)
**Handling:** Same as prior stories.

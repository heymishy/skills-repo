# DoR Contract: The admin/credits panel is gated by per-person role, not tenant membership

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md

---

## Contract Proposal

**What will be built:**
1. `src/web-ui/middleware/require-admin.js`'s `requireAdmin` function updated to resolve role from tir-s1's person/team-scoped schema instead of directly trusting whatever `req.session.role` was set to at login (or, if `req.session.role` is already correctly populated by tir-s1's login-time rewiring, confirm `requireAdmin` reads that same value — no change needed to `requireAdmin` itself beyond verifying its precondition holds).
2. A fail-closed default: any ambiguous/missing role state results in denial, not access.

**What will NOT be built:**
- No change to any other gated feature — only the admin/credits panel.
- No change to what an admin can do inside the panel once granted access.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: `team_memberships` fixture (admin + non-admin sharing a tenant), non-admin request denied 403 | unit |
| AC2 | Unit test: same fixture, admin request granted | unit |
| AC3 | Unit test: solo-tenant fixture, admin access unchanged (regression) | unit |
| AC4 | Unit test: ambiguous/missing role, request denied (fail closed) | unit |

**Assumptions:**
- `requireAdmin` already reads `req.session.role`, which tir-s1 (AC3/AC6) is responsible for populating correctly at login time via the new schema — this story's job is to confirm/verify that dependency holds, and to add the fail-closed behaviour (AC4) if it doesn't already exist, not to re-derive role from the database on every request.
- No hard hard dependency on tir-s3's actual UI existing — this story's tests seed `team_memberships` fixtures directly, per the story's own Dependencies reasoning.

**Estimated touch points:**
Files: `src/web-ui/middleware/require-admin.js`, `src/web-ui/routes/admin-credits.js` (verification only, likely no change needed there), new `tests/check-tir-s4-role-gated-credits-panel.js`
Services: None new
APIs: None new

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ `requireAdmin` denial for a non-admin sharing a tenant, verified directly — ✅ aligned.
- AC2 ↔ `requireAdmin` grant for the admin, verified directly — ✅ aligned.
- AC3 ↔ solo-tenant regression check, verified directly — ✅ aligned.
- AC4 ↔ fail-closed default, verified directly — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Engineer on a team that shares a tenant with an admin" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 3 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 0 MEDIUM, 0 LOW — cleanest story in the batch |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — depends on tir-s1's schema/login wiring (hard) but not on tir-s3's UI (soft, per story's own reasoning); `dorStatus` confirmed in schema. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 cited; names the exact two files modified |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | Modifies existing synchronous middleware reading session state; no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior stories. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1) — but note the epic's own rationale singles this story out as the highest-security-criticality one in the batch (a mistake here has real access-control blast radius). Recorded here for visibility even though the formal oversight level is unchanged from the epic default.
**Handling:** Same as prior stories — this DoR artefact is the share-with-operator step.

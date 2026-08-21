# Definition of Ready Checklist

## Definition of Ready: Thread the authenticating person's identity through requireAdmin's live role re-check

**Story reference:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
**Test plan reference:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/test-plans/lrtc-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform operator responsible for tenant isolation between teammates who share one org-allowlisted tenant" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3/3 |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track security bug fix — no formal metric; real explanation given (standard short-track pattern used throughout this repo) |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — upstream dependencies (`sec-perf-s2`, `tir-s9`) are already-merged code, not `pipeline-state.schema.json` fields; downstream (`rbg-s1`) is a blocking relationship, not a schema dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — pure server-side role-resolution logic |
| H-NFR | NFR profile or explicit "None" field | ✅ | Inline NFR section populated (Security is the substantive NFR) |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — remediation path is `/definition` Step 7, which short-track never runs by design; consistent with `rbg-s1` and every other short-track story in this repo's history |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters introduced — `setGetCurrentRole`/`setGetRoleForTenant` already exist; this story only changes the arguments passed to and forwarded by their existing wiring |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ **Resolved** | Reviewed and confirmed by the operator (2026-08-21) before proceeding — no RISK-ACCEPT needed | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Gap table states "None" | — |

---

## Standards injection

**Domain tags:** `[web-ui, security]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`

Same matches as `rbg-s1` (identical domain tags). This story edits `require-admin.js` (already the canonical location for the exact security pattern `security-standards.md` documents) and `server.js`'s adapter wiring — both squarely within scope of both matched files.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Thread the authenticating person's identity through requireAdmin's live role re-check — artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
Test plan: artefacts/2026-08-21-live-role-recheck-tenant-collapse/test-plans/lrtc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Scope is 3 files: src/web-ui/middleware/require-admin.js, src/web-ui/server.js, tests/check-sec-perf-s2-stale-role-revalidation.js. Do not touch any other file.
- require-admin.js: change the live re-check call from `_getCurrentRole(req.session.tenantId)` to `_getCurrentRole(req.session.tenantId, req.session.login)`. Do not change requireAdmin's other logic (the fail-closed catch, the audit logger, the unwired-fallback branch) — only this one call's arguments.
- server.js: update BOTH `setGetCurrentRole` wiring sites (the one inside `if (process.env.DATABASE_URL)`, and the fake-test-db one rbg-s1 added inside `if (!process.env.DATABASE_URL)`) from `function(tenantId) { return getRoleForTenant(tenantId); }` to `function(tenantId, identityKey) { return getRoleForTenant(tenantId, identityKey); }`. Do not change setGetRoleForTenant's own wiring (already correct, already forwards identityKey).
- tests/check-sec-perf-s2-stale-role-revalidation.js: ADD two new tests (do not modify or delete T1-T10, including the existing weaker T8/T9). New test 1 (AC1): wire setGetCurrentRole/setGetRoleForTenant to the REAL resolveRoleForPerson chain (import it from modules/user-roles.js) against a synthetic in-memory pool object with 2 person_identities/team_memberships rows sharing one tenant_id (mirror the fixture-construction pattern already used in tests/check-tir-s7-person-scoped-login-resolution.js — read that file first for the exact shape). Call requireAdmin twice with two different req.session objects (different userId/login, same tenantId, one deliberately cached with the WRONG role) and assert each resolves independently and correctly. Do NOT use an external switch variable to control the mock's return value — the whole point of this test is to exercise the real per-call argument, not simulate it externally. New test 2 (AC2): same pattern, single person, tenantId === identity, confirms unchanged behaviour.
- After the fix, run `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"` (this requires rbg-s1's WIP commit on feature/rbg-s1 — either rebase this branch on it, or cherry-pick that one commit, to verify AC3 end-to-end). If that branch/commit isn't available in your environment, it's acceptable to skip this specific verification step and note it in the PR description — the 2 new unit tests are the primary verification this story requires.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Applicable standards (see Standards injection section above): .github/standards/web-ui/web-ui-patterns.md, .github/standards/security/security-standards.md — read both before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — operator is directly reviewing this DoR live)
**Signed off by:** Hamish King (2026-08-21) — reviewed and approved the verification script (W4) and this DoR in the same session

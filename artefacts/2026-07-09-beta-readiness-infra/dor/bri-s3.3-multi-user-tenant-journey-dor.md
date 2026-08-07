# Definition of Ready: Multi-user within one tenant journey spec (bri-s3.3)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md (updated 2026-07-16)
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.3-multi-user-tenant-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.3-review-2.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.3-multi-user-tenant-journey-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-16 (re-run — supersedes the 2026-07-13 BLOCKED run)

---

## Read this first

The 2026-07-13 run found a new, independent blocker: no production-reachable path existed for two distinct people to log in and share one `tenantId` with correctly differentiated per-person roles, because `server.js`'s `setGetRoleForTenant` wiring passed `tenantId` as both the `identityKey` and `tenantId` arguments to `resolveRoleForPerson`, causing `resolvePersonForIdentity` to fall through to an unordered, `LIMIT`-less query that returned an arbitrary tenant member — not the authenticating person. That run's revisit trigger named the exact fix required and recommended it ship as `tir-s9`.

**`tir-s9` has since shipped and merged** (`2026-07-09-team-identity-roles` epic, all 9 stories DoD-complete). Re-verified directly against the actual shipped code on 2026-07-16, not against the story text or TIR's own tests:

- `src/web-ui/server.js` line 336-338: `setGetRoleForTenant(function(tenantId, identityKey) { return resolveRoleForPerson(_userRolesPool, identityKey || tenantId, tenantId); });` — confirmed the wiring now accepts and forwards a distinct `identityKey`, falling back to `tenantId` only when a caller omits it.
- `src/web-ui/routes/auth.js` line 210: GitHub callback passes `user.login` (the authenticating person's own GitHub login) as `identityKey`.
- `src/web-ui/routes/auth.js` line 320: Google callback passes `userInfo.sub` as `identityKey` (a documented non-bug finding — Google's `tenantId` already equals `identityKey`, since Google has no shared-tenant mechanism).

This closes the exact gap the 2026-07-13 run named. Two people sharing a GitHub-org-allowlisted tenant (`TENANT_ORG_ALLOWLIST`) now resolve their own, individually-correct roles on real login — confirmed both by `tir-s9`'s own AC1/AC2 (exercised through the real OAuth callback, not just by calling `resolveRoleForPerson` directly) and by this DoR run's independent code read.

---

## Residual known gap (not a blocker for this story)

`tir-s9` deliberately left one related gap out of scope: a person who authenticates via Google or email/password and is manually added as a teammate to a GitHub-org-shared tenant (via `team-management.js`'s `addOrUpdateTeammate`) can never reach that shared tenant on their own login, because their own login always recomputes `tenantId` to their own personal identity — a different bug shape (silent role loss, not role collision), logged in TIR's `decisions.md` as a candidate follow-up story.

bri-s3.3's AC1-AC3 do not require this path. The story only requires "two people in the same tenant with differentiated roles, exercised via a real browser-driven login" — GitHub-org-allowlist mode, now correctly wired, satisfies that. The test plan (updated 2026-07-16) makes this scope boundary explicit so a future reader does not mistake it for an oversight.

---

## Hard Blocks (re-run against current state)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Unchanged |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs have E2E test blocks, now unblocked |
| H4 | Out-of-scope section is populated | ✅ | Updated 2026-07-16 to name the Google/email-added-teammate gap explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 3 retained (real browser-driven multi-person OAuth flow remains genuinely more complex than a single-user spec), Scope stability upgraded from Unstable to Stable — TIR's schema and wiring are now shipped and confirmed |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan updated 2026-07-16 — stale gap notices replaced, scope note added |
| H8-ext | Cross-story schema dependency check | ✅ | schemaDepends: `2026-07-09-team-identity-roles` (tir-s1 through tir-s9, all merged/DoD-complete) — the login-wiring gap found at the 2026-07-13 re-run is independently confirmed fixed by `tir-s9`. Dependency resolved, not outstanding. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Unchanged |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | Not a CSS-layout gap |
| H-NFR | NFR profile exists | ✅ | Unchanged |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs apply |
| H-NFR3 | Data classification not blank | ✅ | Unchanged |
| H-GOV | Governance approval | ✅ | Unchanged |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | This story introduces no new adapter; the upstream `getRoleForTenant` adapter's wiring correctness was independently re-verified above, not merely assumed |
| H-INF / H-MIG | N/A | N/A | Unchanged |

**All hard blocks pass.**

---

## READY / BLOCKED determination

## ✅ READY

The blocker named in the 2026-07-13 re-run is resolved: `tir-s9` (merged) fixes the login-time `identityKey` wiring, confirmed by direct code read of the actual shipped `server.js`/`auth.js`, not by trusting TIR's own tests or completion report. AC1-AC3 are scoped to GitHub-org-allowlist mode (the only production path that creates a shared tenant today) — this is now a real, correctly-wired, browser-driven-testable path. The Google/email-added-teammate gap remains open but is out of this story's scope, documented rather than silently dropped.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Multi-user within one tenant journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md (read the 2026-07-16 scope note before writing any test)
DoR contract: artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.3-multi-user-tenant-journey-dor-contract.md

Goal:
Implement tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js covering AC1-AC4.
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Critical scope constraint — read before writing any test:
AC1-AC3 MUST be exercised via GitHub-org-allowlist mode (TENANT_ORG_ALLOWLIST)
with two real, distinct GitHub OAuth logins sharing one allowlisted org's
tenantId, each with their own team_memberships row and role
(admin/engineer/viewer per AC). This is the ONLY production mechanism that
creates a shared tenant today. Do NOT forge/inject session state directly to
fake a shared tenant — that would contradict AC1's and AC3's own framing
("proving... under an actual browser-driven attempt, not just a unit-test
assertion") and would not actually exercise the real login-time role
resolution wiring this story depends on (tir-s9, src/web-ui/server.js lines
336-338 and src/web-ui/routes/auth.js lines 210 and 320).

Do NOT attempt to fix the Google/email-added-teammate gap (a person added via
team-management.js's addOrUpdateTeammate on a non-GitHub-org tenant cannot
reach their assigned role) — that is explicitly out of scope for this story,
tracked as a candidate follow-up in 2026-07-09-team-identity-roles'
decisions.md.

Constraints:
- Read src/web-ui/routes/auth.js and src/web-ui/server.js's actual current
  wiring before writing any test — do not assume the shape described in this
  DoR document is still exactly correct without re-confirming it yourself
  first (per this repo's CLAUDE.md mock-shape-verification standard).
- Reuse bri-s2.4's synthetic staging tenant/seed conventions and S3.1's mock
  LLM gateway for the @mocked tag — zero real LLM calls.
- Follow ADR-018 (browser-driven Playwright spec) and ADR-025 (tenant-scoping
  is the isolation boundary; this story is about within-tenant role
  differentiation, not cross-tenant isolation — that is S3.4).
- Do not modify TIR's (2026-07-09-team-identity-roles) code — if you find a
  genuine defect in the shipped role/wiring logic while implementing, file it
  as a fix-forward story candidate in TIR's own decisions.md (matching the
  tir-s7/tir-s8/tir-s9 pattern already used in that epic) rather than
  patching it inline here.
- Do not modify any currently-open bri-* or other feature's branch or PR.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story exercises a security-relevant role-boundary path (per-person privilege differentiation within a shared tenant); a role-boundary regression here is high-priority per the story's own NFR statement.
**Sign-off required:** No formal sign-off beyond this DoR re-run — consistent with how the 2026-07-13 BLOCKED determination and this repo's other DoR re-runs have been handled.
**Signed off by:** Claude (agent), definition-of-ready re-run, 2026-07-16, grounded in direct verification of tir-s9's merged code (not TIR's self-report) per this repo's CLAUDE.md dispatch-verification standard.

## Definition of Ready: A person with no membership in a tenant gets the lowest role, not another member's role

**Story reference:** artefacts/2026-11-20-role-resolution-fallback/stories/rrf-s1-no-membership-gets-user-role.md
**Test plan reference:** artefacts/2026-11-20-role-resolution-fallback/test-plans/rrf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `src/web-ui/modules/user-roles.js` (AC1 to AC4): both fallback returns in `resolveRoleForPerson` return `'user'`; the comments are updated to say why; `resolveRoleForTenant` and the exports are unchanged.
- `tests/check-rrf-s1-no-membership-gets-user-role.js` (T1 to T5), and a deliberate update to any existing assertion that pinned the arbitrary-row fallback (AC6).
- `decisions.md` and a DoD.
- Not built: no change to `routes/auth.js`, bootstrap, team management, middleware, schema or workflows; no membership row written at sign-in; no production change.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing spec, or the manual step. `user-roles.js` is a required touchpoint and appears in no exclusion list; the files in the exclusion list (`routes/auth.js` and others) have zero assertions in the new test.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `src/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator of the platform |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is a recorded manual step |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter added or changed; `setGetRoleForTenant` and its throwing default are untouched |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | A person who has been getting an arbitrary role (possibly admin) in production will, after the deploy, resolve to `'user'` at their next sign-in and at the next admin-gated request (the live re-check uses the same adapter). That is the intended correction, but it is a visible change for any such person. AC7 measures how many there could be; a person who needs admin must be given it explicitly by an existing admin. |
| W2 | Accepted | The first-login redirect for such a person changes from `/dashboard` to `/welcome` (plan selection), as designed. |
| W3 | Accepted | Whether anyone was actually given admin by this fallback in production is not established by this story; only the count in AC7 bounds it. |
| W4 | Accepted | The agent runs only the read-only production aggregate in AC7, if it can be run read-only. It changes no production row and no role. |

## Oversight level
**High** - a change to the authorisation default, with a visible effect for any person the old fallback promoted. The operator reviews the pull request and merges; production promotion is the operator's.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-role-resolution-fallback/stories/rrf-s1-no-membership-gets-user-role.md
Test plan: artefacts/2026-11-20-role-resolution-fallback/test-plans/rrf-s1-test-plan.md
Goal: write tests/check-rrf-s1-no-membership-gets-user-role.js first and confirm T1, T3 and T5 fail; then change the two fallback returns in resolveRoleForPerson to 'user' and update, deliberately, only any existing assertion that pinned the arbitrary-row fallback.
Constraints:
- Touch only src/web-ui/modules/user-roles.js in src/, the new test, any pinned existing test, and artefacts.
- Do not change routes/auth.js, the admin bootstrap, team management, middleware, schema or workflows.
- Do not write a membership row anywhere; do not change any role value other than the fallback default.
- The production check is a single read-only aggregate count; never read or print names or identifiers, never write.
- Preserve each file's existing line endings.
- Check the absolute path contains .worktrees/rrf-s1/ before every edit.
```

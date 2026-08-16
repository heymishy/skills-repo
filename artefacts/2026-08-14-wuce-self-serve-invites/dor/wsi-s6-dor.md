## Definition of Ready: Admin has a real, reachable form to create a team invite

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
**Test plan reference:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s6-invite-creation-ui-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Contract Review

✅ **Contract review passed** — the proposed `GET` route + minimal form reuses `handleGetTeamMembers`'s exact existing pattern and posts to `wsi-s1`'s existing, unchanged endpoint; aligns with all 4 ACs and the story's own explicit no-client-JS constraint.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tenant admin |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 unit tests |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | Both feature metrics named |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wsi-s1` — the existing, already-merged `POST /api/team/invites` route contract (`email`/`role` field names) this story's form targets unchanged. This is a route-contract dependency, not a `pipeline-state.schema.json` field reference — no `schemaDepends` field declaration applies (confirmed via direct reading of `routes/team-management.js`'s real, current `handleCreateInvite` this session, not assumed) |
| H9 | Architecture Constraints populated | ✅ | 4 bullets; explicitly names the exact pattern being reused and the exact endpoint being targeted |
| H-E2E | Layout-dependent gap check | ✅ | None — all 4 ACs testable via server-rendered HTML string inspection (test-plan Step 3a scan, zero triggers) |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | Same feature-level `nfr-profile.md` |
| H-GOV | ✅ | Same as `wsi-s1` |
| H-ADAPTER | ✅ | Not triggered — no new injectable adapter, reuses existing `csrf.js`/`team-management.js` exports |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | RISK-ACCEPT logged in `decisions.md` (2026-08-16, extends the existing 2026-08-15 blanket entry to cover `wsi-s6` explicitly — that entry named only `wsi-s1` through `wsi-s5`, written before `wsi-s6` existed) |

---

## Oversight level

**Medium** (per Epic 1)

---

## Standards injection

Domain tags: `[auth]`
Matched: `.github/standards/auth/auth-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Admin has a real, reachable form to create a team invite — artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
Test plan: artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s6-invite-creation-ui-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse handleGetTeamMembers's exact existing rendering pattern in
  src/web-ui/routes/team-management.js -- native label+input/select pairs,
  a real <button type="submit">, csrf.generateCsrfToken/csrf.csrfField for
  the embedded CSRF token. No new form-rendering approach.
- Role <option> values come from team-management.js's exported VALID_ROLES
  -- do not hardcode a second role list.
- The form's action/method/field names target wsi-s1's existing
  POST /api/team/invites UNCHANGED (email/role field names). Do NOT modify
  handleCreateInvite's own request/response contract.
- No client-side JS, no AJAX, no redirect-and-flash-message UX -- matches
  handleAddTeammate's own existing minimal bar exactly.
- Mount the new GET route behind requireAdmin in server.js exactly like
  every other admin-facing GET route -- no route-specific bypass.
- Budget updating server.js's exhaustive requireAdmin( call-site count
  (13 -> 14) as part of this same task: tests/check-d2-banner-exit-permission-visibility.js
  and tests/check-d4-nfr-security-review-and-hardening.js both hardcode
  this count and will need the same update wsi-s1 already made once.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Read .github/standards/auth/auth-patterns.md (auth domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish King — Platform owner — 2026-08-16

**PROCEED: Yes**

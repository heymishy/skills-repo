## Definition of Ready: Migrate team-management admin pages onto the shared HTML shell

**Story reference:** artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
**Test plan reference:** artefacts/2026-08-16-team-management-shared-shell-migration/test-plans/tmss-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "tenant admin" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track substitute metric named (standards-compliance debt / visual inconsistency), same pattern as `pcr-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Cites `.github/standards/web-ui/web-ui-patterns.md`'s existing Shared shell module rule; review ran C/D only (short-track), no Category E findings |
| H-E2E | CSS-layout-dependent AC gap check | ✅ | No AC typed CSS-layout-dependent (Step 3a scan, test plan) — not applicable |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | `artefacts/2026-08-16-team-management-shared-shell-migration/nfr-profile.md` created |
| H-NFR2 | Compliance NFR with named clause has documented sign-off | ✅ | No compliance NFR named — not applicable |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence check | ✅ | Story NFR section has real content (not "None") → profile created and populated |
| H-GOV | Governance approval check | ✅ (N/A) | No `discovery.md` exists — short-track deliberately skips discovery. Treated as not-applicable per `pcr-s1` precedent; recorded as an ASSUMPTION entry in `decisions.md` |
| H-ADAPTER | Injectable adapter wiring check | ✅ (N/A) | No new adapter (`setX()`) introduced by this story |
| H-INF | Infra-plan gate check | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | ✅ (N/A) | `hasMigrationTrack` not set |

**Result: 15/15 hard blocks passed (4 not-applicable, explicitly recorded as such).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM findings) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | RISK-ACCEPTed — see `decisions.md`, 2026-08-16 entry (solo-operator repo, same rationale applied consistently across this session's other features) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — (gap table is empty) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Migrate team-management admin pages onto the shared HTML shell — artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
Test plan: artefacts/2026-08-16-team-management-shared-shell-migration/test-plans/tmss-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Refactor ONLY `handleGetTeamMembers` and `handleGetCreateInviteForm` in
  `src/web-ui/routes/team-management.js`. Do not touch `handleAddTeammate`
  or `handleCreateInvite` (the POST handlers) — their request/response
  contracts must remain byte-for-byte unchanged.
- Use `html-shell.js`'s `renderShell()` exactly as `admin-credits.js` already
  calls it (`src/web-ui/routes/admin-credits.js:140-147`): pass `title`,
  `bodyContent`, `user: req.session`, `active`, `crumbs`, `isAdmin: true`.
  Use `active: 'team-members'` for both handlers (no matching NAV_ITEMS
  entry exists yet — this is expected and out of scope for this story, see
  story's Out of Scope).
- Remove the locally-defined `_escapeHtml` function entirely from
  `team-management.js`. Replace every call site with `html-shell.js`'s
  exported `escHtml()`.
- Preserve every existing form field's exact `id`/`name`/`type` attributes
  and the CSRF hidden-field embedding (`csrf.generateCsrfToken`/
  `csrf.csrfField`) unchanged — only the outer wrapper and escaping function
  change.
- Architecture standards: read `.github/standards/web-ui/web-ui-patterns.md`
  before implementing — this story exists specifically to bring these two
  handlers into compliance with its "Shared shell module" rule. Also read
  `.github/architecture-guardrails.md`. Do not introduce patterns listed as
  anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator (Hamish King) requested and is directly reviewing this work in-session; low-risk, single-file, mechanical reuse of an already-proven shared function.

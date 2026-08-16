# Definition of Done: Migrate team-management admin pages onto the shared HTML shell

**PR:** https://github.com/heymishy/skills-repo/pull/743 | **Merged:** 2026-08-16
**Story:** artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
**Test plan:** artefacts/2026-08-16-team-management-shared-shell-migration/test-plans/tmss-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-16-team-management-shared-shell-migration/dor/tmss-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: `/team/members` renders via shared shell | ✅ | `teamManagement_getTeamMembers_rendersViaSharedShell` | Automated test, re-run fresh 2026-08-16 | None |
| AC2: `/team/invites/new` renders via shared shell | ✅ | `teamManagement_getCreateInviteForm_rendersViaSharedShell` | Automated test, re-run fresh 2026-08-16 | None |
| AC3: `_escapeHtml` removed, no escaping regression | ✅ | `teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegression` | Automated test, re-run fresh 2026-08-16 | None |
| AC4: CSRF hidden field unchanged | ✅ | `teamManagement_csrfFieldUnchangedInBothForms` | Automated test, re-run fresh 2026-08-16 | None |

4/4 tests re-run fresh on current master, all passing.

---

## Scope Deviations

One documented, necessary deviation from the original DoR contract: the migration of `handleGetCreateInviteForm` broke `wsi-s6`'s own existing test (`tests/check-wsi-s6-invite-creation-ui.js`, AC4) — its whole-page regex for "no styled div/anchor masquerading as submit" false-flagged the shared shell's unrelated mobile-sidebar overlay div. Fixed by scoping the assertion to the `<form>` block, logged as a CORRECTION entry in `decisions.md` at implementation time, not discovered after the fact. This is the exact class of touch the DoR contract's "What will NOT be built" section didn't anticipate, but is squarely in scope for the story's own "no regressions" NFR. No other deviations.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing in CI:** 4/4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `teamManagement_getTeamMembers_rendersViaSharedShell` | ✅ | ✅ | |
| `teamManagement_getCreateInviteForm_rendersViaSharedShell` | ✅ | ✅ | |
| `teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegression` | ✅ | ✅ | Corrected mid-implementation from a tautological CSRF-token-based design to the real `VALID_ROLES` call-site test — see decisions.md CORRECTION entry |
| `teamManagement_csrfFieldUnchangedInBothForms` | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no measurable slowdown | ✅ | Same synchronous string-building, now routed through `renderShell()`; no new I/O introduced |
| Security: no escaping regression | ✅ | AC3 test, verified via real `VALID_ROLES` call-site injection |
| Accessibility: no regression from shell wrapper | ✅ | Existing native labelled controls and keyboard tab order unchanged; baseline independently verified via live Chrome staging review during `wsi-s6`'s own delivery |
| Audit: none identified | ✅ | No logging behaviour change |

---

## Metric Signal

Not applicable — this is a pure internal refactor (visual/escaping consistency fix) with no user-facing behavioural change and no linked benefit metric. Short-track story per CLAUDE.md's own convention; no metric signal expected or tracked.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. This story is a direct, traceable closure of a real finding from `wuce-self-serve-invites`'s own `/improve` pass (`artefacts/2026-08-14-wuce-self-serve-invites/decisions.md`, 2026-08-16 RISK-ACCEPT entry) — the `renderShell`/`escHtml` standards violation found via a live Chrome review of staging. Full traceable chain: beta review → `/improve` finding → new short-track story → merged fix, all within the same session.
2. The AC3 test-design correction (CSRF-token-based test would have been tautological; the real fix required tracing the actual `VALID_ROLES` call site) is a good example of the "read real code before planning" discipline already proposed as an `/implementation-plan` improvement in `wuce-self-serve-invites`'s own `/improve` pass — this story independently re-derived the same lesson rather than having it applied automatically, since that proposal has not yet been merged into the skill itself (still `status: pending_review` in `workspace/proposals/`).
3. **`/improve` candidate:** the `wsi-s6` test-breakage-and-fix (scoping a whole-page regex to a `<form>` block) is the 5th live instance of this session's recurring shared-dependency-check-gap pattern, already logged in `wuce-self-serve-invites`'s own `/improve` run and merged into the pending `implementation-plan` proposal. No new proposal needed — already captured.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for tmss-s1 (migrate team-management to shared HTML shell).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

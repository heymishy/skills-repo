# DoD backlog pass — findings tracker

Single consolidated list of every real finding (not pre-existing/already-known test failures) discovered during the 2026-08-17 retroactive DoD backlog pass. Each finding gets a follow-up story artefact; this file tracks status until the follow-up story reaches DoD, at which point its row moves to Resolved with the closing PR.

Update this file whenever a new finding surfaces during the backlog pass, and whenever a tracked follow-up story's stage changes.

---

## Open

| ID | Finding | Follow-up story | Stage | Owner / next action |
|----|---------|-----------------|-------|---------------------|
| F1 | Impersonation "Viewing as" banner does not render on `/dashboard` — `handleGetDashboard` never threads `req.session.impersonation` into its `renderShell()` call, unlike `settings.js`/older `dashboard.js`. Live-confirmed via Chrome (started real impersonation session, banner present on `/settings`, absent on `/dashboard`, reproduced twice). | `ibg-s1` — `artefacts/2026-08-17-impersonation-banner-dashboard-gap/` | Story written, not yet at `/test-plan` | operator/next session — run `/test-plan` for `ibg-s1` next |
| F2 | `b2`'s own AC1 requires a broken Scenario B to block merge, but the live master branch ruleset (`gh api repos/heymishy/skills-repo/rulesets/14979696`) does not list "Scenario B E2E (staging)" in `required_status_checks`, even though the job runs on every PR. `b2`'s own test (`check-b2-ci-gate-config.js`) already flags this as SKIPPED/inconclusive rather than failing, since it depends on live GitHub state. | `sbrc-s1` — `artefacts/2026-08-17-scenario-b-not-required-check/` | Story written, not yet at `/test-plan` | operator/next session — run `/test-plan` for `sbrc-s1` next |
| F3 | `r-canvas-render-and-story-extraction-fix`'s own AC3 self-documented two gaps at merge (2026-07-26), never followed up: (a) `extractStoryIdsFromDefinitionArtefact()` was only manually verified, never captured as an automated regression test; (b) an unexplained 400 on `POST /api/journey/:id/gate-confirm` immediately after a real `/definition` turn was observed but never root-caused. | `csgc-s1` — `artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/` | Story written, not yet at `/test-plan` | operator/next session — run `/test-plan` for `csgc-s1` next |

---

## Resolved

None yet — all three open findings above are still pre-`/test-plan`.

---

## Process notes

- **Depth policy for this backlog pass** (operator-set 2026-08-16/17): lightweight-by-default — confirm PR merged, re-run tests fresh, cite production longevity. Live Chrome verification reserved for stories flagged `hasLayoutDependentGaps`. Ordering: largest story-count clusters first.
- **Decision pattern on every real finding so far:** operator has consistently chosen "create a follow-up story" over "fix it directly in the DoD pass" — this keeps the DoD write-up itself honest (documents the gap, doesn't silently patch around it) and lets each fix go through its own short-track pipeline (`/test-plan` → `/definition-of-ready` → dispatch) rather than being rushed inside a bookkeeping session.
- **Distinct from `tests/known-baseline-failures.json`:** that file tracks pre-existing, already-accepted test failures encountered repeatedly across this backlog pass (not new findings, no action needed). This file tracks the opposite — genuinely new, real gaps that need resolution. Check a discovery against `known-baseline-failures.json` first; only add it here if it's not already known/accepted there.
- **Distinct from the original 161-story DoD-backlog note** in `workspace/state.json` `pendingActions` (logged 2026-08-16) — that entry tracks the overall *volume* of stories missing DoD write-ups; this file tracks the *substantive findings* uncovered while writing those DoDs, which is a much smaller, higher-signal list.
- When a follow-up story here reaches DoD, move its row to Resolved with: closing PR link, merge date, and one line on the actual fix. Do not delete the row — this file is the durable record of what the backlog pass surfaced, not just a todo list.

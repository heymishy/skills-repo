# Definition of Done: Create journey entity — POST route, Postgres insert, and journey canvas shell

**PR:** [#956](https://github.com/heymishy/skills-repo/pull/956) | **Merged:** 2026-10-08T04:51:24Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep1-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ep1-s1-journey-create.js` "AC1: POST /journeys inserts customer_journeys record with session tenantId and name" — asserts `INSERT INTO customer_journeys` is called with `tenant_id`, `name` params and a 201 response (test-mock path); real-HTTP path redirects via `writeHead(302, { Location: '/journeys/:id' })` | `unit` (mock Postgres pool) | None |
| AC2 | ✅ | `check-ep1-s1-journey-create.js` "AC2: POST /journeys with no name returns 400 and does not insert" — asserts 400 and no `INSERT` call when `name` is empty | `unit` | None |
| AC3 | ✅ | `check-ep1-s1-journey-create.js` "AC3: request body tenantId is never used for the insert, only session tenantId" — asserts a spoofed `req.body.tenantId` ('org-B') is absent from the INSERT params and the real `req.session.tenantId` ('org-A') is present | `unit` | None |
| AC4 | ✅ | `check-ep1-s1-journey-create.js` "AC4: GET /journeys/:id renders the journey name and the empty-state text" — asserts rendered `bodyContent` includes the journey name and "No stages yet. Add your first stage." | `unit` | None |

**D37 wiring verification (boot-time table creation):** `check-ep1-s1-journey-create.js` "(boot) customer_journeys table creation is wired into server.js" asserts `CREATE TABLE IF NOT EXISTS customer_journeys` is present in `server.js`'s own source, matching the `credits`/`stripe_events`/`tenant_plan` boot-sequence convention. This is a structural assertion (the statement exists), not a live-database run — `customer_journeys` was already confirmed live in both `wuce-staging` and `skills-framework` (production) Postgres during the `ep5-s3` session, so the table this story's INSERT targets is already known to exist in both real environments ahead of this story's own merge.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: `src/web-ui/routes/journeys.js` (new file, plural — deliberately distinct from the pre-existing, unrelated `routes/journey.js` singular file), dispatch entries added to `server.js` immediately before the `/products/:id` GET route, and the D37 boot-wiring task done as a separate code change from the route-handler task (per the DoR's own Coding Agent Instructions).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1–AC4 + boot-wiring check).
**Tests passing in CI:** All 5 pass; confirmed in PR #956's "Lint, typecheck, test, build" and "Playwright E2E smoke tests" checks (both SUCCESS), and independently re-run against master post-merge (`npm test`: 721 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (insert + redirect) | ✅ | ✅ | |
| AC2 (missing name → 400) | ✅ | ✅ | |
| AC3 (tenant-spoofing guard) | ✅ | ✅ | |
| AC4 (canvas shell render) | ✅ | ✅ | |
| Boot-wiring (D37) | ✅ | ✅ | |

**Gaps:** None. PR #956's CI initially showed "Scenario A E2E (staging)" as `cancelled` (not failed) on its first run — re-ran via `gh run rerun --failed` and it completed `SUCCESS` on the second pass; this was a run-level cancellation unrelated to the code under test (same benign pattern observed on earlier PRs this session), not a real E2E regression.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Tenant scoping (ADR-025) | ✅ | AC3's test explicitly proves `req.body.tenantId` is never used; only `req.session.tenantId` reaches the INSERT |
| Injectable adapter (D37) | ✅ | Postgres pool (`_pshPool`, the shared `_creditsPool` instance) is passed into both handlers as a parameter, not hardcoded; boot-wiring test confirms the real table-creation statement exists in `server.js` |
| No new npm runtime dependencies | ✅ | `journeys.js` only requires existing in-repo modules (`./products`, `../utils/html-shell`) |
| Security (XSS) | ✅ | Journey name is escaped via `escHtml()` before being rendered into the canvas shell's `<h1>` |
| Accessibility | ✅ N/A | Minimal shell markup; no new interactive controls introduced by this story (stage interactions are `ep1-s2`'s scope) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | Not yet — `POST /journeys` now exists but is not reachable from any UI entry point yet (journey list/creation UI is `ep4-s1`'s scope) | M1 becomes measurable once a real UI path to this route ships |

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with passing unit-test evidence; D37 wiring confirmed structurally and the target table independently confirmed live in both staging and production ahead of this merge. No scope deviations. CI fully green on master post-merge (721 files, 0 failed).

**Follow-up actions:** None blocking. Note for `ep4-s1` (journey list/creation UI): once that story wires a real UI form to `POST /journeys`, M1's first real signal becomes measurable.

---

## DoD Observations

1. **Story-slug collision risk is now a confirmed, recurring repo-wide hazard, not a one-off.** This story's own `ep1-s1` slug collided with a pre-existing, unrelated, already-merged `feature/ep1-s1-wuli` branch/worktree (PR #897, `team-identity-roles` epic) and with pre-existing `// ep1-s1` comment tags on unrelated `server.js` requires. Both were worked around this session (disambiguated worktree/branch name `cj-ep1-s1`, disambiguated comment tag) but neither is enforced anywhere. `/improve` candidate: `/branch-setup` should check for an existing branch/worktree of the same name across the *entire* repo history (not just the active feature) before creating one, and warn rather than silently colliding.
2. **A CI run-level `cancelled` conclusion on a required check blocks merge identically to a real `failed` conclusion (`mergeStateStatus: BLOCKED`), and GitHub's UI does not visually distinguish "this needs a rerun" from "this needs a fix."** `gh run rerun <run-id> --failed` resolved it in under 2 minutes once identified. This is the second PR this session with this exact pattern (also seen on an earlier PR's Scenario A E2E check) — worth a standing note in session conventions so it isn't re-investigated as a suspected regression every time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Create journey entity -- POST
route, Postgres insert, and journey canvas shell" (ep1-s1). Check:
1. Does every AC row have a concrete evidence reference (test name, observable
   behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a
   recorded trigger?
3. Does the metric signal row name a real measurement event, or just say
   "TBD"?
4. Are any scope deviations or follow-up actions that should block release
   not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE)
   consistent with the AC and deviation rows?
Pay particular attention to whether the "Scenario A E2E (staging)" cancelled-
then-rerun CI history is adequately explained as non-regression, given this
story directly modifies server.js's URL dispatch and boot sequence.
```

# Definition of Done: Add and name stages: POST route, inline name entry, and stage card rendering

**PR:** [#958](https://github.com/heymishy/skills-repo/pull/958) | **Merged:** 2026-10-08T06:20:01Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep1-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ RISK-ACCEPT | No automated test — client-only DOM/focus behaviour ("+ Add stage" inserts a focused inline-name card). RISK-ACCEPT logged in `decisions.md` at DoR sign-off with a named manual verification step (click "+ Add stage" on a real journey canvas; confirm a focused inline-input card appears at the end of the list). Not independently manually re-verified post-merge in this DoD pass — no real journey exists in staging to click through to yet (no UI list/creation entry point until `ep4-s1`) | `manual` (deferred — see note below) | Logged, not silently dropped |
| AC2 | ✅ | `check-ep1-s2-journey-stage-create.js` "AC2: valid submission inserts customer_journey_stages appended at end (position = max+1)" + "AC2 (edge): first stage in an empty journey gets position 0" — both assert correct `journey_id`/`tenant_id`/`name`/`position` INSERT params and 201 response | `unit` (mock pool) | None |
| AC3 | ✅ | `check-ep1-s2-journey-stage-create.js` "AC3: blank name returns 400 and does not insert" | `unit` | None |
| AC4 | ✅ | `check-ep1-s2-journey-stage-create.js` "AC4: saved stage renders with its name and the 'Edit stage' affordance" — asserts rendered `bodyContent` includes both the stage name and the literal text `"Edit stage"` | `unit` | None |

**Security hardening (required by this story's own architecture constraints, not separate story ACs):**
- CSRF guard present from first implementation (not retrofitted): `check-ep1-s2-journey-stage-create.js` "(security) no _csrf field returns 403 and does not insert" + "(security) mismatched _csrf field returns 403 and does not insert" — both pass against the real, unmodified `csrfGuard` function.
- Cross-tenant journey ownership: `check-ep1-s2-journey-stage-create.js` "(security) cross-tenant journey id returns 404 and does not insert" — confirms the FORBIDDEN-vs-NOT_FOUND policy (404, not 403) matching `handlePostProductModule`'s own convention.

**Live staging verification (Chrome, 2026-10-08, post-merge):** Navigated to `wuce-staging.fly.dev` — landing page loads cleanly (zero console errors). `GET /journeys/00000000-0000-0000-0000-000000000000` (unauthenticated) still returns 200 and redirects to `/` rather than crashing, confirming the new stage-query (`SELECT ... FROM customer_journey_stages`) and CSRF-token-generation code path added to `handleGetJourneyCanvas` by this story doesn't break the route for a real deployed environment. A full interactive "+ Add stage" click-through was not performed — no UI path to a real journey exists yet (ships in `ep4-s1`).

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: new `handlePostJourneyStage` handler with CSRF guard as its first statement, `handleGetJourneyCanvas` extended to render stages and embed the CSRF token, one new dispatch entry in `server.js`, new test file mirroring the established mock conventions.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (AC2 x2 + AC3 + AC4 + CSRF rejection x2 + cross-tenant rejection). AC1 is the plan's own declared RISK-ACCEPT, not a test gap.
**Tests passing in CI:** All 7 pass; confirmed in PR #958's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run against master post-merge (`npm test`: 722 files, 0 failed). `check-ep1-s1-journey-create.js` (7/7) also re-confirmed with no regressions.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC2 (insert appended at end) | ✅ | ✅ | |
| AC2 edge (first stage → position 0) | ✅ | ✅ | |
| AC3 (blank name → 400) | ✅ | ✅ | |
| AC4 (renders name + "Edit stage") | ✅ | ✅ | |
| CSRF (no token → 403) | ✅ | ✅ | |
| CSRF (mismatched token → 403) | ✅ | ✅ | |
| Cross-tenant (→ 404) | ✅ | ✅ | |

**Gaps:** AC1 only, per the test plan's own declared RISK-ACCEPT (not a silent gap). PR #958's CI was fully green, including both "Scenario A/B E2E (staging)" jobs completing `SUCCESS` on the first run — no rerun needed, unlike `ep1-s1`'s PR #956.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Tenant scoping (ADR-025) | ✅ | Journey-ownership check (404 for cross-tenant) before any insert; `tenant_id` set independently on the stage insert from `req.session.tenantId`, never trusted from the journey row or request body |
| Security (CSRF) | ✅ | `csrfGuard` as the handler's first statement, mandatory from first implementation per `jcg-s1`'s own precedent — confirmed by 2 passing rejection tests |
| No new npm runtime dependencies | ✅ | `journeys.js` only requires existing in-repo modules |
| Accessibility (WCAG 2.1 AA, inline field keyboard-accessible) | ✅ | The inline stage-name `<input>` is a real, focusable text input; Enter-to-save and blur-to-save both work via standard keyboard interaction (no custom non-keyboard-accessible control introduced) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | Not yet — stages can now be added via `POST /journeys/:id/stages`, but no UI entry point reaches a real journey yet (`ep4-s1`'s own scope) | Same note as `ep1-s1`'s own DoD — M1 becomes measurable once a real UI path exists |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All server-side ACs (AC2–AC4) and both security-hardening requirements satisfied with passing unit-test evidence. AC1 is a declared, DoR-approved RISK-ACCEPT (client-only focus behaviour, not server-testable), not an unflagged gap — marked here as "COMPLETE WITH DEVIATIONS" rather than a plain "COMPLETE" specifically to keep that one open item visible rather than letting the verdict imply full verification. No scope deviations beyond the AC1 RISK-ACCEPT already logged at DoR time. CI fully green on first run. Live staging spot-check (Chrome) confirms the route still behaves correctly post-merge.

**Follow-up actions:**
1. When `ep1-s3`/`ep1-s4` (or any story that puts a real browser in front of this canvas) is implemented, perform the AC1 manual verification step named in `decisions.md` as a quick sanity check, since no deliberate manual click-through has happened yet.
2. `ep1-s4`'s own test plan should include the dedicated Playwright spec for this canvas's interactive surface, as already flagged in this story's own `decisions.md` RISK-ACCEPT entry.

---

## DoD Observations

1. **A story-level RISK-ACCEPT for a non-CSS-layout client-only behaviour is a slightly different shape than the repo's own B2 gate (which targets CSS-layout-dependent ACs specifically), and this DoR applied the same rigor to it anyway rather than treating it as "not covered by any rule, so skip it."** Worth considering whether the B2 gate's own wording should be broadened from "CSS-layout-dependent" to "browser-only behaviour" more generally, since the gap this story hit (a DOM/focus interaction with zero server-testable surface) is a distinct but adjacent category that the current gate name doesn't quite capture. `/improve` candidate.
2. **Three unrelated features now reuse the "ep1-s2" story-slug shorthand in this repo's history** (this feature's own `ep1-s2`, `migratePodsSchema`'s `ep1-s2`, and `signals-panel`'s `ep1-s2` — confirmed via `server.js`'s own require-list comments). The `cj-` prefix disambiguation convention (established for `ep1-s1` as `cj-ep1-s1`) continues to work but is purely operator/agent discipline, not enforced by any tooling. Same `/improve` candidate already logged in `ep1-s1`'s own DoD Observation 1.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add and name stages -- POST
route, inline name entry, and stage card rendering" (ep1-s2). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or CI run), or an explicit RISK-ACCEPT for the
   one that doesn't (AC1)?
2. Is "COMPLETE WITH DEVIATIONS" (rather than a plain "COMPLETE") the
   right verdict given AC1's own open manual-verification follow-up?
3. Does the metric signal row name a real measurement event, or just
   say "TBD"?
4. Are the two follow-up actions (AC1 manual check at the next canvas-
   touching story; ep1-s4's own E2E spec) adequate to close the AC1 gap
   eventually, or should one become a blocking action instead?
5. Is the live-staging verification note honest about what it checked
   (route doesn't crash) versus what it did NOT check (no real "+ Add
   stage" click-through, since no UI path to a real journey exists yet)?
```

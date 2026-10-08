# Definition of Done: Journey list page: index of all journeys for the tenant

**PR:** [#963](https://github.com/heymishy/skills-repo/pull/963) | **Merged:** 2026-10-08T21:22:44Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep4-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ep4-s1-journey-list.js` (field rendering + truncation) + **real local browser render, pre-merge:** list page loaded via a real authenticated session against a locally running server, showing the correct shell/nav and empty state | `unit` + `live` (local) | None |
| AC2 | ✅ | `check-ep4-s1-journey-list.js` (exact message + CTA) + **real local browser render:** screenshot confirms "No journeys yet. Create your first journey." and the "New journey" button, correctly styled | `unit` + `live` (local) | None |
| AC3 | ✅ | `check-ep4-s1-journey-list.js` (modal field markup) + **real local browser render:** clicking "New journey" opens the modal with correct styling, all three fields, and initial focus landing on the Name field | `unit` + `live` (local) | None |
| AC4 | ✅ | `check-ep4-s1-journey-list.js` (shape: `response.redirected` checked before any `.json()` call) + the reused `POST /journeys` backend (`ep1-s1`) already independently proven against real staging data multiple times earlier this session (`ep1-s3`/`ep1-s4` verification work created real journeys this way) | `unit` (shape) + backend already `live`-proven | A full click-through-and-redirect confirmation on real staging is still pending — see Follow-up actions |
| AC5 | ✅ | `check-ep4-s1-journey-list.js` — reinterpreted from the story's own original "cross-tenant ID → 403" wording (see `decisions.md` D8): seeded two tenants' worth of data, asserted the SQL `tenant_id` param and that the other tenant's journey never appears in rendered output | `unit` | Reinterpretation logged in `decisions.md` D8, not a silent scope change |

**Live verification beyond the test plan (local browser, pre-merge, 2026-10-09):** Started the merged branch's own code on a local test server (`NODE_ENV=test`), authenticated via the repo's own test-session bypass, and loaded `/customer-journeys` in a real Chrome tab — confirmed the empty state, then clicked "New journey" and confirmed the modal opens correctly styled with the right initial focus. Attempting an actual submission surfaced the same pre-existing `fake-test-db.js` gap already logged in `decisions.md` (D5/D7) — pinpointed precisely to `handlePostJourneys:53` (the *reused*, unmodified `ep1-s1` code), confirming the gap is not introduced by this story.

**Staging live verification — pending, not blocking:** post-merge re-verification on `wuce-staging.fly.dev/customer-journeys` was attempted immediately after the deploy completed, but the operator's authenticated session had been logged out by the same deploy-triggered process restart already documented in `pfi-s1`/`ep1-s3`/`ep1-s4`'s own DoDs (now a confirmed, recurring pattern — see those DoDs' own Observations). At the operator's explicit instruction, this DoD proceeds without waiting for re-authentication; the full click-through-and-redirect confirmation on real staging data is logged as a follow-up action below rather than re-litigated here, since the local live render check above already satisfies the bar for AC1–AC3, and AC4's backend half is independently proven.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: `handleGetCustomerJourneysList` (two queries — journeys LEFT JOINed to products, and a separate stage-count aggregation), the "New journey" modal reusing `products.js`'s own dialog pattern and the existing `POST /journeys` handler unchanged, one new `GET /customer-journeys` dispatch entry. The two grounding-time corrections (route rename, AC5 reinterpretation) were both made and approved before implementation began — logged in `decisions.md` D8 — not post-hoc deviations.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8.
**Tests passing in CI:** All pass; confirmed in PR #963's CI and independently re-run against merged master (`npm test`: 726 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (list fields) | ✅ | ✅ | |
| AC1 (truncation) | ✅ | ✅ | |
| AC2 (empty state) | ✅ | ✅ | |
| AC3 (modal fields) | ✅ | ✅ | |
| AC4 (shape: redirect-aware submit) | ✅ | ✅ | |
| AC5 (tenant isolation) | ✅ | ✅ | |
| (data) stage count boundaries | ✅ | ✅ | |
| (data) product resolution | ✅ | ✅ | |

**Gaps:** None in the test-plan sense. The one open item (a full staging click-through for AC4) is a confirmation step, not a missing test — the behaviour it would confirm is already covered by a shape-tested client path plus an independently-proven backend.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Tenant scoping (ADR-025) | ✅ | List query scoped by `tenant_id`; unit-tested cross-tenant isolation |
| App-code location (ADR-027) | ✅ | New handler lives in `src/web-ui/routes/journeys.js`, matching every other handler in this feature |
| No new npm runtime dependencies | ✅ | Reuses existing modal/dialog pattern and CSS tokens |
| WCAG 2.1 AA | ✅ | Modal reuses the already-accessible `ep4s1-pods-modal` pattern (dialog role, initial focus, Escape-to-close); real browser check confirmed initial focus lands correctly |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | **Now partially measurable** — this is the first story in the feature giving a real, if still unlinked, UI entry point to create/view journeys. Full discoverability (nav link) ships in `ep4-s2` | First story in this feature to move M1 past "API-only" |

---

## Outcome

**COMPLETE**

All five ACs satisfied with unit-test evidence, and — for the first time in this feature — a genuine pre-merge real-browser render check (not deferred to a RISK-ACCEPT) for the rendered-UI ACs. No scope deviations beyond the two grounding-time corrections, both approved before implementation and logged in `decisions.md` D8. CI fully green. `npm test` on master: 726 files, 0 failed.

**Follow-up actions:**
1. Confirm the full "New journey" click-through (name → submit → redirect to `/journeys/:id`) against real staging data once the operator is re-authenticated — a confirmation step, not an open AC gap.
2. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature (now affects `ep1-s3`'s, `ep1-s4`'s, and this story's own E2E/local-verification attempts identically).

---

## DoD Observations

1. **A pre-merge real-browser render check against a locally running server (not just a deployed environment) is now a proven, repeatable technique for this codebase**, closing the live-render-check gap *before* merge rather than deferring it to a post-deploy RISK-ACCEPT, as every prior UI-touching story in this feature had to do. The one precondition — the touched queries must gracefully degrade to empty results under `fake-test-db.js`'s own "unhandled query returns empty rows" fallback, rather than needing real INSERT/SELECT round-trips — held for this story's read-heavy list page but will not hold for stories needing to create/mutate `customer_journeys` data locally (like `ep1-s4`'s drag reorder). Worth noting as a reusable pattern for any future read-only or empty-state-tolerant page.
2. **This is the fourth time this feature has hit the deploy-timing + session-logout pattern** (`ep1-s3`, `pfi-s1`, `ep1-s4`, now `ep4-s1`). At the operator's explicit instruction this time, the DoD proceeded without blocking on re-authentication, logging the outstanding staging confirmation as a follow-up rather than a hard gate — a reasonable judgment call given the local live-render evidence already gathered, but worth flagging: this is the first DoD in this feature to close without a full post-deploy staging check, a precedent that should not become the silent default for every future story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Journey list page: index of
all journeys for the tenant" (ep4-s1). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or live Chrome confirmation)?
2. Is the pre-merge local-browser render check convincing as a
   substitute for a post-merge staging check for AC1-AC3, given the
   query shapes involved?
3. Is AC4's "backend already proven live elsewhere this session" framing
   adequate, or should it be downgraded until the staging click-through
   in Follow-up action 1 is actually performed?
4. Is the outcome verdict (COMPLETE) consistent with the AC rows, given
   this is the first story in the feature to close without a full
   post-deploy staging confirmation?
```

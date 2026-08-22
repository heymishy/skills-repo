# AC Verification Script: Restore same-tenant journey access under POLICY.TENANT

**Story reference:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md`
**Technical test plan:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/test-plans/jatg-s1-test-plan.md`
**Script version:** 1
**Verified by:** Copilot (agent self-verification, per /verify-completion) | **Date:** 2026-08-22 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the root of the `skills-repo` checkout.
2. No server, database, or environment variables need to be running — everything in this script runs from the command line against in-memory test objects.
3. You'll need Node.js installed (already required to work in this repo).

**Reset between scenarios:** No shared state — each scenario is independent.

---

## Scenarios

---

### Scenario 1: A teammate on the same team can now view a journey they don't own

**Covers:** AC1

**Steps:**
1. Run:
   ```
   node -e "const {requireJourneyAccess,POLICY}=require('./src/web-ui/middleware/journey-access.js');const journey={ownerId:'user-A',tenantId:'acme'};const session={accessToken:'tok',login:'user-B',tenantId:'acme'};try{requireJourneyAccess(journey,session,POLICY.TENANT);console.log('ACCESS GRANTED');}catch(e){console.log('ACCESS DENIED:',JSON.stringify(e));}"
   ```

**Expected outcome:**
> The output reads `ACCESS GRANTED`. Before this fix, it read `ACCESS DENIED: {"code":"FORBIDDEN"}` — a teammate ("user-B") sharing the same tenant ("acme") as the journey's owner ("user-A") was wrongly denied.

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual output: `ACCESS GRANTED`.

---

### Scenario 2: Someone from a different organisation is still correctly denied

**Covers:** AC2

**Steps:**
1. Run:
   ```
   node -e "const {requireJourneyAccess,POLICY,asHttpResponse}=require('./src/web-ui/middleware/journey-access.js');const journey={ownerId:'user-A',tenantId:'acme'};const session={accessToken:'tok',login:'user-C',tenantId:'other-tenant'};try{requireJourneyAccess(journey,session,POLICY.TENANT);console.log('ACCESS GRANTED (wrong!)');}catch(e){console.log('ACCESS DENIED, HTTP', asHttpResponse(e,POLICY.TENANT));}"
   ```

**Expected outcome:**
> The output reads `ACCESS DENIED, HTTP 404`. Someone from a different tenant ("other-tenant") must never be able to view another tenant's journey — this must not change before or after the fix.

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual output: `ACCESS DENIED, HTTP 404`.

---

### Scenario 3: An owner-only action still refuses a same-tenant teammate

**Covers:** AC3

**Steps:**
1. Run:
   ```
   node -e "const {requireJourneyAccess,POLICY}=require('./src/web-ui/middleware/journey-access.js');const journey={ownerId:'user-A',tenantId:'acme'};const session={accessToken:'tok',login:'user-B',tenantId:'acme'};try{requireJourneyAccess(journey,session,POLICY.OWNER);console.log('ACCESS GRANTED (wrong!)');}catch(e){console.log('ACCESS DENIED:',JSON.stringify(e));}"
   ```

**Expected outcome:**
> The output reads `ACCESS DENIED: {"code":"FORBIDDEN"}`. This confirms the two owner-only actions (recommitting a journey, committing a stage) stay restricted to the actual owner, even though same-tenant teammates can now view/resume — a teammate being able to *see* a journey is not the same as being allowed to *finalize* it on the owner's behalf.

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual output: `ACCESS DENIED: {"code":"FORBIDDEN"}`.

---

### Scenario 4: The originally-broken collaborative-session tests now pass

**Covers:** AC5

**Steps:**
1. Run:
   ```
   node tests/check-wsm2-collaborative-sessions.js
   ```

**Expected outcome:**
> The last line reads `=== wsm2 results: 22 passed, 0 failed ===`. Before this fix, it read `17 passed, 5 failed`, with the 5 failures being `T2b`, `T2c`, `T2d`, `T4a`, `T4b` — all 404-where-200-expected for a same-tenant viewer.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed `=== wsm2 results: 22 passed, 0 failed ===`. Required adding explicit, matching `tenantId` to `wsm2`'s own T2/T4 fixtures (they never modeled tenant identity at all before) — see decisions.md.

---

### Scenario 5: The full test suite has no new failures

**Covers:** AC4

**Steps:**
1. Run:
   ```
   node scripts/run-all-tests.js
   ```
2. Wait for it to finish (this takes a few minutes).

**Expected outcome:**
> The "Failed files" list contains only the small set of already-known, already-tracked pre-existing issues unrelated to this story (`scripts/check-pipeline-state-integrity.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`) — `tests/check-wsm2-collaborative-sessions.js` must no longer appear in this list, and no other file should newly appear either.

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual: `533 file(s) run, 3 failed` — exactly the 3 expected pre-existing/unrelated entries. Reaching this state required investigating and fixing 5 additional files beyond `wsm2` itself, once a first attempt (reusing `isSameTenant()`'s existing passthrough) surfaced them as newly-failing: `check-s3.4-item-detail-view.js` and `check-kcrs-s1-kanban-card-resume-session.js` had incomplete cross-tenant fixtures (completed with explicit tenant IDs), and `session-turns-pg.js`'s `getTurnsForStage()` had a separate, pre-existing wrong-policy-constant bug (`POLICY.TENANT` → `POLICY.OWNER`), exposed rather than caused by this fix. Full investigation and reasoning in decisions.md.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — same-tenant teammate granted access | Pass | |
| Scenario 2 — different-tenant viewer still denied | Pass | |
| Scenario 3 — owner-only action still restricted | Pass | |
| Scenario 4 — wsm2's own tests now pass | Pass | Required completing wsm2's own incomplete tenant fixtures |
| Scenario 5 — full suite has no new failures | Pass | Required fixing 2 additional test fixtures + 1 separate policy-constant bug |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

No open findings. One additional, genuinely separate bug was found and fixed during implementation: `src/web-ui/adapters/session-turns-pg.js`'s `getTurnsForStage()` used `POLICY.TENANT` where its own test explicitly wanted owner-only semantics for reading conversation content — fixed to `POLICY.OWNER` (see decisions.md). Not a new finding requiring its own story — a one-line, narrowly-scoped, already-fixed correction discovered as a direct consequence of this story's own regression check.

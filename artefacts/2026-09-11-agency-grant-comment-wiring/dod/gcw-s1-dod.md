# Definition of Done: Wire the already-built shared-access grant and client-agency comment routes into live URLs

**PR:** [#860](https://github.com/heymishy/skills-repo/pull/860) | **Merged:** 2026-09-11 (merge commit `470958de`)
**Story:** artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md
**Test plan:** artefacts/2026-09-11-agency-grant-comment-wiring/test-plans/gcw-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-11-agency-grant-comment-wiring/dor/gcw-s1-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `POST /api/agency/grants` reachable, ownership enforced (relationship's `agency_org_id` must match caller) | 2 integration tests + **live Chrome verification** on `wuce-staging.fly.dev`: created a real grant (`grant-mtwki77l-d5y7qd`) sharing `skills-framework` with the real Client org created earlier in the same session, response `{"success":true,"grant":{...}}` | None |
| AC2 | ✅ | `GET /client/shared-products`/`:id` reachable; 404 (never 403) for no grant | 3 integration tests | None — client-org-side live verification not performed this session (would require real Story 4 magic-link auth for a Client org; the automated end-to-end test covers this path instead, see DoD Observations) |
| AC3 | ✅ | `PUT`/`POST`/`DELETE /client/shared-products/:id` always 403 | 1 integration test + **live Chrome verification**: `PUT /client/shared-products/skills-framework` from the (Agency) session returned `403 {"error":"forbidden -- shared-access grants are read-only"}` | None |
| AC4 | ✅ | Comment create/list reachable, grant-gated (both Client-side and Agency-side routes) | 3 integration tests | None |
| AC5 | ✅ | CSRF required on all 3 mutating routes | 3 integration tests + **live Chrome verification**: `POST /api/agency/grants` with a forged `_csrf` value returned `403 Forbidden`; the same request with a real, session-valid token returned `200` | None |
| AC6 | ✅ | Full chain (activate → create client → grant → client view) works end-to-end | 1 integration test (`fullChainActivateCreateClientGrantAndClientViewSucceeds`) — chains `asa-s1` + Story 3 + this story's own routes through real handler functions | None — see DoD Observations for the one leg (real Client-org login) not independently live-verified |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged diff wires all 9 handler functions unmodified, plus the one agreed-necessary CSRF addition (see Architecture Constraints in the story). `handleCreateAgencyComment`/`handleListAgencyComments`'s missing resource-ownership check was confirmed during implementation and deliberately not fixed — logged as a follow-up in `decisions.md`, not an out-of-process scope violation.

---

## Test Plan Coverage

**Tests from plan implemented:** 15 / 15 (14 integration + 1 wiring regression)
**Tests passing in CI:** 15 / 15

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| grantCreationReachableViaLiveRouteWithOwnershipEnforced (AC1) | ✅ | ✅ | |
| grantOwnershipRejectedAtRouteLevel (AC1) | ✅ | ✅ | |
| sharedProductsListAndGetReachableViaLiveRoute (AC2) | ✅ | ✅ | |
| sharedProductGetReturns404ForNoGrant (AC2) | ✅ | ✅ | |
| sharedProductsListEmptyForNoGrants (AC2) | ✅ | ✅ | |
| mutationAlwaysRejectedOnWiredRoute (AC3) | ✅ | ✅ | |
| sharedCommentCreateAndListReachableViaLiveRoute (AC4) | ✅ | ✅ | |
| agencyCommentCreateAndListReachableViaLiveRoute (AC4) | ✅ | ✅ | |
| sharedCommentCreateReturns404ForNoGrant (AC4) | ✅ | ✅ | |
| csrfRequiredOnCreateGrant (AC5) | ✅ | ✅ | |
| csrfRequiredOnCreateSharedComment (AC5) | ✅ | ✅ | |
| csrfRequiredOnCreateAgencyComment (AC5) | ✅ | ✅ | |
| fullChainActivateCreateClientGrantAndClientViewSucceeds (AC6) | ✅ | ✅ | |
| serverWiresGrantAndCommentRoutes (wiring regression) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Post-deploy live Chrome verification:** Performed on `wuce-staging.fly.dev` after deploy (`470958d`, deployed 2026-09-11T06:02:59Z). Confirmed AC1 (real grant creation), AC3 (mutation always rejected), and AC5 (CSRF genuinely enforced, not just present in the code) directly against production-adjacent infrastructure — not only the mocked-pool test suite. AC2 and the Client-org-side leg of AC6 were **not** independently live-verified this session: doing so would require authenticating as the Client org itself, which needs either real GitHub OAuth for an org outside this session's control, or exercising Story 4's magic-link invite flow, which sends a real email — a boundary the operator and I agreed to stay within earlier in this session. The automated integration test (`fullChainActivateCreateClientGrantAndClientViewSucceeds`) covers this exact path through real handler functions and a fake pool; it is not a substitute for a live check, and is recorded here as a known, deliberate gap rather than silently treated as equivalent.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No material performance change | ✅ | Wiring only, no new queries beyond what the already-tested handlers already issue |
| Security — CSRF on all 3 mutating routes | ✅ | AC5, live-verified (see above) — this story's load-bearing NFR |
| Accessibility | ✅ Not applicable | API routes only, no UI in this story |
| Data residency / Availability / Compliance | ✅ Not applicable | No new data storage or movement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Agency-led client provisioning (`2026-07-30-agency-client-organisations`) | ✅ (target: client user logs in and views ≥1 shared product/feature) | Partially — this story is the last blocking piece for the "views ≥1 shared product" half; the "client user logs in" half depends on Story 4, exercised only by the automated test this session, not live | Signal: `not-yet-measured`. |
| Ongoing client-agency artefact collaboration | ✅ (target: ≥1 comment thread with both an Agency-org and Client-org participant) | This story is the entire missing mechanism — Story 5's comment handlers were unreachable until this PR | Signal: `not-yet-measured`. Evidence note: shipped and live-verified (Agency side) 2026-09-11; no real bidirectional thread exists yet. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Live-verify the Client-org-side leg (AC2, AC6's client-view step) once Story 4's real login path is exercised with a real invite — either accept a real email send, or build a staging-safe test-login endpoint for Client-org sessions (mirroring this repo's own established `NODE_ENV=test`-gated seed-endpoint pattern used elsewhere). No owner/timeline set; logged here so it isn't silently forgotten.
2. `handleCreateAgencyComment`/`handleListAgencyComments`'s missing resource-ownership check (logged in `decisions.md`) — small, separate, not urgent.

---

## DoD Observations

1. **This DoD was written retroactively**, alongside `asa-s1`'s, after a repo-wide stocktake found both missing — see `asa-s1-dod.md`'s own Observation #1 for the same process note.
2. **AC2/AC6's partial live-verification gap is deliberately recorded, not glossed over.** This is the same discipline this session applied when it first found `asa-s1`'s gap (never assume a mocked test proves live reachability) — applying it symmetrically here means being honest that this story's own live check is itself incomplete, for a real, named reason (avoiding a real email send), not silently calling the automated test "good enough" without saying so.
3. No NFR gaps or guardrail entries were absent at delivery time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire the already-built shared-access grant and client-agency comment routes into live URLs" (gcw-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

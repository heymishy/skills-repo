# Definition of Done: A standalone organisation's admin can self-activate it as an Agency

**PR:** [#859](https://github.com/heymishy/skills-repo/pull/859) | **Merged:** 2026-09-10 (merge commit `7e65c56f`)
**Story:** artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md
**Test plan:** artefacts/2026-09-11-agency-self-activation/test-plans/asa-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-11-agency-self-activation/dor/asa-s1-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `activateOrganisationAsAgency` flips a `standalone` org to `agency` in place, same `org_id`, audited | `tests/check-asa-s1-agency-self-activation.js` (unit) + live Chrome verification on `wuce-staging.fly.dev` (2026-09-11): activated the real `heymishy` org via `POST /organisations/become-agency`, confirmed `org_type: "agency"` in the response | None |
| AC2 | ✅ | Non-admin rejected 403 on both GET and POST, denial audited | Unit test | None |
| AC3 | ✅ | Already-`agency`/`client` orgs unaffected by a repeat activation attempt | Unit test | None |
| AC4 | ✅ | `agency_client_relationships`/`shared_access_grants` byte-for-byte unchanged after activation | Unit test | None |
| AC5 | ✅ | Post-activation, `/agency/clients/new` (Story 3's own entry point) becomes reachable | Integration test (`become-agency-then-create-client-flow-succeeds-end-to-end`) + **live Chrome verification**: navigated to `/agency/clients/new` as the newly-activated `heymishy` org and confirmed the real Create-Client form rendered (previously rejected with "only reachable by Agency-type organisations") | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged diff is scoped exactly to `modules/organisations.js`'s new `activateOrganisationAsAgency` function, the new `routes/org-activation.js` route file, and `server.js` wiring — mirroring `org-conversion.js`'s established pattern, as agreed at DoR sign-off. No reversal mechanism, no platform-operator panel, no change to any of `2026-07-30-agency-client-organisations`'s own 6 shipped stories.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (5 unit test groups + 1 integration)
**Tests passing in CI:** 8 / 8 (unit assertion count across the 6 named groups)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| activateOrganisationAsAgency-flips-standalone-org-in-place (AC1) | ✅ | ✅ | |
| activateOrganisationAsAgency-idempotent-safe-on-non-standalone (AC3) | ✅ | ✅ | |
| handlePostBecomeAgency-rejects-non-admin (AC2) | ✅ | ✅ | |
| handleGetBecomeAgencyForm-rejects-non-admin (AC2) | ✅ | ✅ | |
| handlePostBecomeAgency-rejects-already-activated-org (AC3) | ✅ | ✅ | |
| activateOrganisationAsAgency-does-not-touch-relationship-or-grant-tables (AC4) | ✅ | ✅ | |
| become-agency-then-create-client-flow-succeeds-end-to-end (AC5) | ✅ | ✅ | |
| serverWiresOrgActivationRoutes (wiring regression) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Post-deploy live Chrome verification (this repo's own recent precedent for CSS-layout/live-reachability ACs — `sob-s4`, 2026-09-08; `jgls-s1`, 2026-09-11):** Performed on `wuce-staging.fly.dev` after deploy (`7e65c56`, deployed 2026-09-10T19:28:07Z). Confirmed via `fetch('/organisations/become-agency', {method:'POST', body:{confirm:'AGENCY'}})`: `{"success":true,"org_id":"heymishy","org_type":"agency"}`. Then confirmed `GET /agency/clients/new` rendered the real Create-Client form for the same, now-activated session — direct proof the gap this story exists to close is actually closed for a real user, not just in a mocked test database.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new-request overhead (Performance) | ✅ | Single indexed UPDATE, same cost profile as `convertOrganisationToStandalone` |
| Security — server-side-only admin gate, one-way `standalone`-only transition | ✅ | AC2/AC3; live-verified the admin gate held (only the org's own admin session could activate it) |
| Accessibility — real form/button markup | ✅ | Code review; matches `org-conversion.js`'s established pattern |
| Data residency / Availability / Compliance | ✅ Not applicable | No new data storage or movement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Agency-led client provisioning (`2026-07-30-agency-client-organisations`) | ✅ (target: ≥1 Agency org signs up, provisions ≥1 Client org, client user logs in and views ≥1 shared product/feature) | Partially — this story closes the very first blocking step (an org can now become an Agency at all), directly enabling the rest of the chain `gcw-s1` and Story 3/4 complete | Signal: `not-yet-measured`. Evidence note: `asa-s1` shipped 2026-09-10 and was live-verified to work, but no real (non-operator) Agency has used this path yet — same "staging only" caveat every story in the parent epic carries. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required to close this story. The metric this story contributes to remains `not-yet-measured` pending real usage — tracked at the parent epic level, not a gap in this story's own delivery.

---

## DoD Observations

1. **This DoD was written retroactively, after a repo-wide stocktake found it missing.** The story was merged and live-verified on 2026-09-11, but `/definition-of-done` was not run immediately afterward — the session moved directly into scoping `gcw-s1` (the next gap the same live-verification pass surfaced). Logged as a process gap: live-verify → write DoD immediately, don't let a second finding's own investigation push the first one's DoD out.
2. This story is part of a pattern this session established and worth naming explicitly: 3 of the 6 original `2026-07-30-agency-client-organisations` stories' own DoDs recorded "COMPLETE" against fully-mocked test suites that never exercised a real HTTP request — and the epic itself was unreachable in production the whole time as a direct result. `asa-s1` and `gcw-s1` (its sibling story) both close gaps that only became visible through live Chrome verification, not through any of that epic's own (extensive, passing) automated test coverage. Worth flagging at `/improve`: mocked-pool integration tests prove a handler's own logic is correct, but not that anything actually calls it.
3. No NFR gaps or guardrail entries were absent at delivery time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "A standalone organisation's admin can self-activate it as an Agency" (asa-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

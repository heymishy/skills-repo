# Test Plan: Record an in-app sign-off decision on captured evidence

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) — plain Node.js `assert`-based tests, confirmed from `package.json`'s own `scripts.test` entry, not assumed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Sign-off area shows Approve (primary) / Needs changes (destructive) + optional comment field | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Decision written to `journeys.data.signOff` with correct identity/timestamp/coverage snapshot, tenant-scoped | — | 3 tests | — | — | — | 🟢 |
| AC3 | Recorded decision renders on reload as a status badge, with `escHtml()`-escaped text | 2 tests | 1 test | — | — | — | 🟢 |
| AC4 | Stale decision stays visible but marked with the coverage snapshot it was recorded against | — | 2 tests | — | — | — | 🟢 |
| AC5 | Sign-off write passes the same tenant/product access-control check as every other `ppc` write | — | 1 test | — | — | — | 🟢 |
| AC6 | Empty state reads "No decision recorded yet" — unambiguous, never blank or indistinguishable from "Approved" | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is fully coverable with the existing fake-pool/`journey-store` pattern this feature already uses — no browser-layout-dependent behaviour is introduced (buttons and badges are DOM-presence/class-name assertions, not position- or stacking-dependent claims).

---

## Test Data Strategy

**Source:** Mixed — fake Postgres pool + in-memory `journey-store._clearForTesting()` (the same pattern `ppc-s1`–`ppc-s4` already use), plus a deliberately malicious comment-field fixture for the XSS test.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture page render with no prior decision | Fixture | None | |
| AC2 | A fake `req.session.login`/`req.session.userId`, a fixture AC coverage state (e.g. 5 of 7 captured) | Fixture | None | `by` resolution mirrors `admin-credits.js`'s own `adminId` test fixtures |
| AC3 | A comment fixture containing `<script>alert(1)</script>` and a literal `"`, for the mandatory XSS-injection test case | Fixture | None | Same minimum-coverage requirement as `ppc-s6`'s own AC2 XSS test |
| AC4 | A persisted decision with `coverageSnapshot: "5 of 7"`, then a second capture bringing coverage to 7 of 7 | Fixture, two-step | None | |
| AC5 | Two tenant/product fixtures (A, B) | Fixture | None | Mirrors `ppc-s1`'s own access-control test pattern |
| AC6 | A fixture journey with no `signOff` field at all | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderSignOffArea_noPriorDecision_showsApproveAndNeedsChangesButtons_correctVariants

- **Verifies:** AC1
- **Precondition:** No `signOff` field on the fixture journey
- **Action:** Call the render function for the sign-off area
- **Expected result:** Output contains an "Approve" button using the primary-variant class/markup and a "Needs changes" button using the destructive-variant class/markup, per `DESIGN.md`, plus an optional comment `<textarea>`/`<input>`

### renderSignOffArea_escapesXssInjection_inCommentField

- **Verifies:** AC3 (security — MC-SEC-01, mandatory "XSS injection" coverage per `web-ui-patterns.md`'s HTML render function unit test pattern)
- **Precondition:** A persisted decision whose `comment` field contains `<script>alert(1)</script>` and a literal `"`
- **Action:** Call the render function that displays the recorded decision
- **Expected result:** Output string does NOT contain an unescaped `<script>` tag; the `"` character is rendered escaped; the comment's plain text is still visibly present

### renderSignOffArea_emptyState_readsNoDecisionRecordedYet_distinctFromApproved

- **Verifies:** AC6
- **Precondition:** No `signOff` field on the fixture journey
- **Action:** Call the render function
- **Expected result:** Output contains the literal text "No decision recorded yet" (or equivalent unambiguous wording) — and does NOT contain the "Approved" badge markup/class used when a real decision exists

---

## Integration Tests

### handlePostSignOff_writesDecisionToJourneyData_withResolvedIdentityAndTimestamp

- **Verifies:** AC2
- **Components involved:** Route handler, fake pool, `journey-store`
- **Precondition:** A fixture journey, fake `req.session.login = 'alice'`
- **Action:** Submit an "Approve" decision with a comment
- **Expected result:** `journeys.data.signOff` now contains `{ status: 'approved', by: 'alice', at: <ISO timestamp>, comment: ..., coverageSnapshot: ... }`

### handlePostSignOff_resolvesIdentityViaLoginOrUserId_neverAccessToken

- **Verifies:** AC2 (CLAUDE.md canonical-field rule regression guard)
- **Components involved:** Same, `req.session.accessToken` set to a decoy value, `req.session.login` unset, `req.session.userId` set
- **Precondition:** Session with only `userId` present (no `login`)
- **Action:** Submit a decision
- **Expected result:** `signOff.by` equals the `userId` value, never the `accessToken` value — a grep-style assertion on the handler's own source additionally confirms no `req.session.accessToken` reference exists in the sign-off code path

### handlePostSignOff_coverageSnapshot_reflectsAcCoverageAtMomentOfDecision

- **Verifies:** AC2
- **Components involved:** Same, fixture with 5 of 7 ACs captured
- **Precondition:** Same
- **Action:** Submit a decision
- **Expected result:** `coverageSnapshot` reads "5 of 7" (or equivalent), matching the coverage line shown on the page at that moment

### renderSignOffArea_existingDecision_rendersBadgeAndEscapedDetails

- **Verifies:** AC3
- **Components involved:** Render function, fixture with a persisted decision
- **Precondition:** `signOff: { status: 'approved', by: 'alice', at: ..., comment: 'looks good', coverageSnapshot: '7 of 7' }`
- **Action:** Render the page
- **Expected result:** Output contains a status badge using the `--success` token/class for "Approved", plus the who/when/comment/coverage text, all present and correctly escaped

### handleGetPlaybackEvidence_staleDecision_staysVisibleButMarkedWithOriginalSnapshot

- **Verifies:** AC4
- **Components involved:** Route handler, fixture decision recorded at "5 of 7", then capture-all brings coverage to "7 of 7"
- **Precondition:** Decision persisted first, then new evidence captured afterward
- **Action:** Reload the page
- **Expected result:** The decision still renders, explicitly labelled "Approved against 5 of 7 ACs" (or equivalent) — never silently re-labelled as if it covered the new 7-of-7 state

### handleGetPlaybackEvidence_staleDecision_doesNotImplyCoverageOfNewEvidence_stringCheck

- **Verifies:** AC4 (negative check)
- **Components involved:** Same
- **Precondition:** Same
- **Action:** Inspect the rendered decision text
- **Expected result:** The text never reads a bare "Approved" with no coverage qualifier when the current coverage differs from the recorded snapshot

### handlePostSignOff_crossTenantRequest_isDenied

- **Verifies:** AC5
- **Components involved:** Route handler, two tenant fixtures (A, B)
- **Precondition:** Tenant B attempts to record a decision for tenant A's feature
- **Action:** Submit the request as tenant B, targeting tenant A's `productId`/`featureSlug`
- **Expected result:** 403/404, no write occurs to tenant A's journey — mirrors `ppc-s1`'s own access-control test pattern exactly

---

## NFR Tests

### signOffWrite_boundedOverhead_oneAdditionalJsonbWrite

- **NFR addressed:** Performance
- **Measurement method:** Call-count assertion on the `journey-store` write path
- **Pass threshold:** Exactly 1 additional write per sign-off submission, same cost class as `ppc-s2`'s `captureAllDuration` write
- **Tool:** Node `assert`

### signOffIdentity_neverAccessToken_tenantScopingIdenticalToOtherWrites

- **NFR addressed:** Security
- **Measurement method:** The two Integration tests above (`handlePostSignOff_resolvesIdentityViaLoginOrUserId_neverAccessToken`, `handlePostSignOff_crossTenantRequest_isDenied`) are also the NFR evidence
- **Pass threshold:** Same as those tests
- **Tool:** Node `assert`

### signOffForm_keyboardOperability_plainFormElementsOnly

- **NFR addressed:** Accessibility
- **Measurement method:** Source-level assertion that the sign-off render function emits only `<form>`/`<button>`/`<textarea>` elements, no `onclick`/JS-event-handler attributes
- **Pass threshold:** No inline JS event handlers present in the rendered markup
- **Tool:** Node `assert` (string-fragment check, consistent with `ppc-s1`/`ppc-s6`'s own precedent)

---

## Out of Scope for This Test Plan

- Testing that a decision cannot be edited or retracted (the story has no such mechanism to test — Out of Scope per the story itself).
- Multi-approver workflow testing — not built by this story.
- Live staging/production verification — tracked as this story's own Follow-up Action at DoD time, matching `ppc-s1`'s own precedent.

---

## Test Gaps and Risks

No gaps. Every AC is fully coverable at Unit/Integration level with no browser-layout dependency.

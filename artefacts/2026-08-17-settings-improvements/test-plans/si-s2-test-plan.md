## Test Plan: Add a timezone and date-format preference to Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Form renders with sensible defaults when unset | 1 test | — | — | — | — | 🟢 |
| AC2 | Submit persists `timezone`/`date_format` to `people` row via `resolvePersonForIdentity` | — | 1 test | — | — | — | 🟢 |
| AC3 | Reload pre-populates saved values | — | 1 test | — | — | — | 🟢 |
| AC4 | Invalid/empty timezone rejected with 400 + specific message, no partial write | — | 1 test | — | — | — | 🟢 |
| AC5 | `resolvePersonForIdentity` returns `null` — rejected cleanly, no crash | — | 1 test | — | — | — | 🟢 |
| AC6 | Successful save fires a new PostHog event | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 6 ACs are covered at the unit/integration level using this codebase's existing injectable fake-pool convention (`src/web-ui/adapters/fake-test-db.js`) — no real Postgres or live session required.

---

## Test Data Strategy

**Source:** Seeded database (fake pool)
**PCI/sensitivity in scope:** No — timezone/date-format are low-sensitivity personal preferences, not payment or identity-document data
**Availability:** Available now
**Owner:** Self-contained — tests seed their own fake `people`/`person_identities`/`team_memberships` rows in setup, using the existing `fake-test-db.js` injectable pool pattern already used elsewhere in this codebase's test suite

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | None (renders defaults) | N/A | None | Direct function call, no DB |
| AC2 | A fake pool seeded with one `people` row + a matching `person_identities` row for a test `identityKey` | `fake-test-db.js` injectable pool | None | Assert the row's `timezone`/`date_format` columns after the handler runs |
| AC3 | Same seeded row, pre-populated with a saved value | `fake-test-db.js` | None | Assert the rendered form's selected values match |
| AC4 | Same seeded row, submission with an invalid value | `fake-test-db.js` | None | Assert the row is UNCHANGED after the rejected submission |
| AC5 | A fake pool seeded with NO matching `person_identities`/`team_memberships` row for the test `identityKey` | `fake-test-db.js` | None | Asserts `resolvePersonForIdentity` returns `null` and the handler responds with a clean error, not a thrown exception |
| AC6 | Injected `_posthog` spy | Existing injectable-adapter pattern | None | N/A |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### localePreferenceFormRendersDefaultsWhenUnset

- **Verifies:** AC1
- **Precondition:** Render function called with a synthetic person object where `timezone`/`date_format` are both `null`
- **Action:** Call the Profile tab's locale-form render function
- **Expected result:** Rendered HTML contains a timezone selector and a date-format selector, both showing a non-blank sensible default (e.g. UTC / ISO format), not an empty/unselected state
- **Edge case:** No

### localePreferenceSaveFiresPostHogEvent

- **Verifies:** AC6
- **Precondition:** Injected `_posthog` spy, valid locale preference submission
- **Action:** Successfully save a locale preference (using the fake pool from the integration tests below)
- **Expected result:** `_posthog.capture` called exactly once with a new, distinct event name
- **Edge case:** No

---

## Integration Tests

### localePreferenceSubmitPersistsToPeopleTableViaIdentityResolution

- **Verifies:** AC2
- **Components involved:** `settings.js` handler, `identity-links.js`'s `resolvePersonForIdentity`, fake pool (`people` table)
- **Precondition:** Fake pool seeded with `people` row `id=1`, `person_identities` row mapping test `identityKey` → `person_id=1`
- **Action:** POST a valid timezone + date-format submission with a session carrying the test `identityKey`
- **Expected result:** The fake pool's `people` row `id=1` now has `timezone` and `date_format` set to the submitted values; response includes a confirmation banner (reusing `bse-s1`'s pattern)

### localePreferenceReloadPrePopulatesSavedValues

- **Verifies:** AC3
- **Components involved:** `settings.js` handler (GET), fake pool
- **Precondition:** Fake pool seeded with a `people` row already carrying a saved `timezone`/`date_format`
- **Action:** GET the Settings page for the session mapped to that person
- **Expected result:** Rendered form's selected timezone/date-format values match the seeded row, not the system default

### localePreferenceInvalidTimezoneRejectedNoPartialWrite

- **Verifies:** AC4
- **Components involved:** `settings.js` handler, fake pool
- **Precondition:** Fake pool seeded with a `people` row with `timezone=null`
- **Action:** POST a submission with an invalid timezone string (e.g. `"Not/A/Real/Zone"`)
- **Expected result:** Response is a 400 with a message naming the timezone field specifically; the fake pool's row is read back afterward and confirmed still `timezone=null` (no partial write)

### localePreferenceNullPersonResolutionRejectedCleanly

- **Verifies:** AC5
- **Components involved:** `settings.js` handler, `resolvePersonForIdentity`, fake pool
- **Precondition:** Fake pool with NO `person_identities` row and NO `team_memberships` row matching the test session's `identityKey`
- **Action:** POST a valid locale preference submission
- **Expected result:** Handler returns a clean error response (not an unhandled exception / 500), and no row is created or modified anywhere in the fake pool
- **Edge case:** Yes — this is the story's own explicitly-added edge case (AC5), covering a state that should not occur for an authenticated session but is not structurally impossible

---

## NFR Tests

### localePreferenceServerSideValidatesTimezoneAllowlist

- **NFR addressed:** Security
- **Measurement method:** Submit a range of invalid timezone values (empty string, non-IANA string, a script-injection-shaped string) and confirm each is rejected before reaching the database write
- **Pass threshold:** 100% of invalid inputs rejected with no write to the fake pool
- **Tool:** `node tests/check-si-s2-locale-preference.js`

### localePreferenceNoUnescapedValueInRenderedForm

- **NFR addressed:** Security
- **Measurement method:** Seed a `people` row with a saved value containing HTML-special characters (simulating any legacy/malformed data), render the form, and assert the output contains the escaped form, not the raw string
- **Pass threshold:** Zero unescaped `<`/`>`/`&` in the rendered form output derived from stored data
- **Tool:** `node tests/check-si-s2-locale-preference.js`

### localePreferenceSaveCompletesUnderOneSecond

- **NFR addressed:** Performance
- **Measurement method:** Timed execution of the integration test's save path against the fake pool
- **Pass threshold:** < 1 second (fake pool is in-memory, so this threshold is trivially met — this test exists to catch an accidental N+1 or blocking-loop regression, not to benchmark real Postgres latency)
- **Tool:** `node tests/check-si-s2-locale-preference.js`

---

## Out of Scope for This Test Plan

- Real Postgres integration test — this plan uses the fake pool, consistent with this codebase's existing test convention; a real-database smoke check happens post-merge, not in this test plan.
- Actually reformatting existing timestamps elsewhere in the product — out of scope for the story itself (see story's Out of Scope), so no tests for it here.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real production identity resolution against a live GitHub-OAuth session | Fake pool tests the `resolvePersonForIdentity` contract, not a live session | This mechanism is already exercised by `team-identity-roles`' own existing test suite in production use; this story reuses it rather than re-testing it from scratch |

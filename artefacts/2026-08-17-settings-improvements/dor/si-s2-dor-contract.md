# Contract Proposal: Add a timezone and date-format preference to Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Date:** 2026-08-17

---

**What will be built:**
- `src/web-ui/modules/user-roles.js`'s `migrateTeamSchema()`: add `ALTER TABLE people ADD COLUMN IF NOT EXISTS timezone TEXT` and `... date_format TEXT` — following the established idempotent-migration pattern (`product-repo.js`, `products.js`).
- `settings.js`'s `handleGetSettings`: extend to resolve `person_id` via `resolvePersonForIdentity(pool, identityKey)` (reusing the existing `identityKey` variable) and read `timezone`/`date_format` for the Profile tab form.
- A new POST handler for the locale-preference form, server-side validating against an IANA timezone allowlist before writing.
- New PostHog capture on successful save, reusing the existing injected adapter.

**What will NOT be built:**
- Currency/number-format preferences, reformatting of existing timestamps elsewhere, org-wide default/override, browser auto-detect — all explicitly out of scope per the story.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render function called with `timezone`/`date_format` both `null` | Unit |
| AC2 | Fake-pool integration: POST valid submission, assert `people` row updated | Integration |
| AC3 | Fake-pool integration: GET with pre-seeded row, assert form pre-populated | Integration |
| AC4 | Fake-pool integration: invalid timezone, assert 400 + unchanged row | Integration |
| AC5 | Fake-pool integration: no matching identity, assert clean error not a crash | Integration |
| AC6 | Injected `_posthog` spy, assert `capture` called once | Unit |

**Assumptions:**
- The existing `identityKey` (`req.session.tenantId`) resolves correctly via `resolvePersonForIdentity` for the accounts this story targets — this is the same mechanism already live for `getLinkedProviders`, so no new resolution logic is introduced.

**Estimated touch points:**
Files: `src/web-ui/modules/user-roles.js`, `src/web-ui/routes/settings.js`, `tests/check-si-s2-locale-preference.js`. Services: none. APIs: none (internal route).

**Contract review outcome:** PASSED — proposed implementation aligns with all 6 ACs; no mismatches.

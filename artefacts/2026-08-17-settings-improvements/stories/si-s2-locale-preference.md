## Story: Add a timezone and date-format preference to Settings

**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-08-17-settings-improvements/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **regular team member** (available to all signed-in users, per-person — not an admin-only or org-wide setting),
I want to **set my own timezone and date-format preference in Settings' Profile tab**,
So that **timestamps I see in the product reflect my own locale rather than a fixed default, closing the beta-reported "start with locale settings" ask**.

## Benefit Linkage

**Metric moved:** Locale preference adoption
**How:** This story is the entire mechanism the metric measures — without it, adoption is definitionally 0%. Shipping it and instrumenting the settings-change event is what makes the metric measurable at all.

## Architecture Constraints

- **ADR-026 (reuse existing entity) — corrected in review run 1 (finding 1-H1):** the `users` table (`scripts/migrate-schema-users.js`) is a legacy email/password schema with no relationship to this codebase's real GitHub-OAuth session identity — `handleGetSettings` never reads it. The correct reuse target is `people` (`src/web-ui/modules/user-roles.js`: `id SERIAL PK`, `created_at`), resolved via `person_identities`/`resolvePersonForIdentity(pool, identityKey)` (`src/web-ui/modules/identity-links.js`) — the same mechanism `handleGetSettings` **already calls** at line ~480 (`var identityKey = req.session && req.session.tenantId; var linkedFromDb = identityKey ? await _identityLinks.getLinkedProviders(pool, identityKey) : [];`) for the existing linked-providers list. Add two new nullable columns to `people`: `timezone` (TEXT) and `date_format` (TEXT). Resolve `person_id` via `resolvePersonForIdentity(pool, identityKey)` using the SAME `identityKey` variable already computed in `handleGetSettings` — do not introduce a second identity-resolution path.
- **ADR-025 (tenant scoping):** this is a per-user preference on an existing person's row, resolved through the existing session-scoped identity mechanism (`identityKey` → `resolvePersonForIdentity`) — no new resource or route requiring its own `requireJourneyAccess`/`isSameTenant` guard.
- Shared shell module (mandatory): the new preference form fields in `settings.js`'s Profile tab must use `escHtml()` for any dynamic/user-supplied value rendered back into the page (e.g. re-displaying a saved value), and must not duplicate `renderShell()`.

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a signed-in user on the Settings page's Profile tab with no timezone/date-format set yet, When the page renders, Then a locale preference form is visible showing a timezone selector and a date-format selector, both defaulted to a sensible system default (not blank).

**AC2:** Given a user selects a timezone and date format and submits the form, When the submission completes, Then the values are persisted to the `people` table's `timezone` and `date_format` columns for the row resolved via `resolvePersonForIdentity(pool, identityKey)` (the same `identityKey` `handleGetSettings` already computes from `req.session`), and a confirmation is shown on the page (reusing the existing banner pattern from `bse-s1`, not a new mechanism).

**AC3:** Given a user has previously saved a timezone/date-format preference, When they reload the Settings page, Then the form is pre-populated with their saved values (read from `people.timezone`/`people.date_format` for their resolved `person_id`), not the system default.

**AC4:** Given a user submits the locale preference form with an invalid or empty timezone value, When the submission is processed, Then the request is rejected server-side with a 400 response and a message naming the specific invalid field (e.g. "Timezone must be a valid IANA timezone identifier"), and no partial write occurs to the `people` row — matching the existing server-side-validation pattern already used elsewhere in this codebase.

**AC5:** Given `resolvePersonForIdentity(pool, identityKey)` returns `null` (no `person_identities` row and no `team_memberships` fallback match — a state that should not occur for an authenticated session but is not structurally impossible), When the locale preference form is submitted, Then the request is rejected server-side with a clear error rather than throwing an unhandled exception or silently writing to a wrong/new row.

**AC6:** Given a user successfully saves a locale preference, When the save completes, Then a new settings-change PostHog event fires (matching the existing `_posthog.capture` convention), providing the adoption data the benefit metric measures.

## Out of Scope

- Currency or number-formatting preferences — timezone and date format only, per the clarified discovery scope.
- Actually reformatting existing timestamps across the product to honour the saved preference — this story adds the preference and its storage; applying it to every existing timestamp display elsewhere in the product is a separate follow-up, not part of this story's ACs.
- Org-wide default or per-org override — per-person only, no admin-set default for the team.
- Automatic timezone detection from the browser — user selects explicitly; no auto-detect logic in this story.

## NFRs

- **Performance:** Locale preference save completes in under 1 second under normal load — a single-row update, no heavier than existing settings writes in this file.
- **Security:** Timezone/date-format values are validated server-side against an allowlist of valid IANA timezone identifiers and supported date-format strings — never written to the database unvalidated, and never reflected back into HTML without `escHtml()`.
- **Accessibility:** Form selectors are keyboard-navigable and labelled, consistent with existing form patterns in `settings.js`.
- **Audit:** None identified — this is a low-sensitivity personal preference, not a security-relevant or compliance-relevant field.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    PEOPLE {\n        serial id PK\n        timestamptz created_at\n        text timezone\n        text date_format\n    }\n    PERSON_IDENTITIES {\n        varchar identity_key PK\n        integer person_id FK\n        varchar provider\n        timestamptz created_at\n    }\n    TEAM_MEMBERSHIPS {\n        integer person_id PK,FK\n        varchar tenant_id PK\n        varchar role\n        timestamptz created_at\n    }\n    PERSON_IDENTITIES }o--|| PEOPLE : \"resolves to via resolvePersonForIdentity\"\n    TEAM_MEMBERSHIPS }o--|| PEOPLE : \"fallback resolution path\""}}---

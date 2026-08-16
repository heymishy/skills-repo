# Review Report: Add a timezone and date-format preference to Settings — Run 1

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Date:** 2026-08-17
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category E (Architecture compliance) — The story extends the wrong entity. Architecture Constraints states: *"ADR-026 (reuse existing entity): the `users` table (`scripts/migrate-schema-users.js`: `id`, `email`, `password_hash`, `created_at`) is the correct extension point for a per-person preference — no new table."* AC2/AC3 then require reading/writing "the `users` table's `timezone` and `date_format` columns" keyed to "that user's row."

  This is factually wrong about how this codebase actually identifies a signed-in person. `src/web-ui/routes/settings.js` never reads a `users`-table row for the current user — `handleGetSettings` identifies the signed-in person entirely via `req.session.login`, `req.session.tenantId`, and `req.session.authProvider` (confirmed by grep — zero references to the `users` table anywhere in `settings.js`). The `users` table (`scripts/migrate-schema-users.js`: `id UUID`, `email TEXT UNIQUE`, `password_hash TEXT`, `created_at`) is a legacy email/password schema with no `tenant_id` column and no relationship to GitHub-OAuth session identity at all — nothing in the live request path ever creates or looks up a row there for a real signed-in user.

  The codebase already has the correct entity for this: `src/web-ui/modules/user-roles.js` defines `people` (`id SERIAL PRIMARY KEY`, `created_at`) and `src/web-ui/modules/identity-links.js` defines `person_identities` (`identity_key`, `person_id REFERENCES people(id)`, `provider`), with `resolvePersonForIdentity(pool, identityKey)` as the established mechanism for mapping a session-derived identity key to a `person_id`. This is the real, live per-person identity model this codebase uses (built for the `team-identity-roles` epic) — `people` is the correct ADR-026 reuse target, not `users`.

  As written, implementing AC2/AC3 literally would persist locale preferences to rows in a table that no authenticated session in production ever reads from or writes to for identity purposes — the feature would silently do nothing for real users while every automated test built against the story's own ACs passes, because the tests would use the same (wrong) table the story specifies. This is the same failure shape CLAUDE.md's own "Mock-shape verification when reusing an adapter for a new purpose" rule and the `tir-s5` anti-pattern entry warn about: a plausible-looking reuse target that was never checked against the real, live-wired mechanism.

  Fix: Rewrite Architecture Constraints, AC1–AC3, and the data-model diagram to extend `people` (add `timezone TEXT` and `date_format TEXT` columns) rather than `users`, and route the read/write through `resolvePersonForIdentity(pool, req.session.login)` (or the equivalent identity key this codebase uses elsewhere in `settings.js`), not a direct `users.id` lookup. Re-verify against `src/web-ui/modules/user-roles.js` and `identity-links.js` before finalising the AC wording.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None beyond 1-H1 — no independent MEDIUM findings; the AC-wording issues noted below are downstream of the same root cause and are captured in the HIGH finding's fix rather than listed separately to avoid double-counting.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C — AC4's error message requirement ("a clear error message") is not specific about content or format, unlike AC2/AC3 which are concrete. Minor — worth tightening once 1-H1 is resolved and the AC set is rewritten anyway.

---

## Summary

1 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** FAIL

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — benefit linkage mechanism sentence will need a one-word update (`users`→`people`) once 1-H1 is fixed, but the metric linkage itself is sound |
| Scope integrity | 5 | PASS |
| AC quality | 3 | PASS — format and testability are otherwise solid; AC2/AC3's factual content is wrong but that is scored under Architecture compliance to avoid double-penalising the same root cause |
| Completeness | 5 | PASS |
| Architecture compliance | 2 | FAIL — 1-H1: story's ACs require implementation against an entity the live session-identity path never actually uses |

**Verdict:** FAIL — 1 criterion (Architecture compliance) below threshold. 1-H1 must be resolved before /test-plan.

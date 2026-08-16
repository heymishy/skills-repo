# Decision Log: settings-improvements

**Feature:** Settings improvements — locale, plan management, theme relocation
**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md
**Last updated:** 2026-08-17

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**[2026-08-17] | ARCH | /definition**
**Decision:** Locale preference (timezone/date-format) is stored on a new `timezone`/`date_format` column pair on the existing `people` table, resolved via `resolvePersonForIdentity(pool, identityKey)` — not on the legacy `users` table.
**Alternatives considered:** Extending `users` (email/password_hash) — the original /definition draft, caught wrong at review run 1 (finding 1-H1) because `handleGetSettings` never actually reads `users` for the signed-in person; real identity flows through session → `people`/`person_identities`.
**Rationale:** `people`/`person_identities`/`resolvePersonForIdentity` is the real, live-wired identity model this codebase's session-based GitHub-OAuth flow already resolves through (built for `team-identity-roles`), and `handleGetSettings` already computes the exact `identityKey` needed to call it. Extending `users` would have shipped a feature that silently did nothing for real users.
**Made by:** Claude (agent), via /review run 1 finding 1-H1, fix applied same session
**Revisit trigger:** Never, unless this codebase's session-identity model itself changes.
---
**[2026-08-17] | RISK-ACCEPT | /review**
**Decision:** si-s3's AC3 (verifying the Stripe billing portal's success path) is not blocked on confirming a staging-account-with-Stripe-customer-ID fixture right now, at review time. Instead, a PROCEED-BLOCKED condition was added directly to the story (per `.github/architecture-guardrails.md`'s PAT-06 pattern), deferring the actual fixture-existence check to `/definition-of-ready`.
**Alternatives considered:** Confirming the fixture exists immediately (not possible from within this session — requires operator knowledge of staging Stripe test-mode account state); dropping AC3 from scope entirely (rejected — it's the specific gap this story exists to close, per discovery's own MVP scope item 3).
**Rationale:** The gap is real but not yet actionable without operator input on staging environment state. Structuring it as an explicit DoR gate (rather than silently proceeding or blocking the whole review) keeps the risk visible and enforced at the correct checkpoint, consistent with the Approved Pattern this finding cited.
**Made by:** Claude (agent), review run 1 finding 1-M1
**Revisit trigger:** Resolved automatically at `/definition-of-ready` when the fixture is confirmed or provisioned — if it turns out no such fixture can reasonably be provisioned, AC3 is deferred and this entry is revisited.
---

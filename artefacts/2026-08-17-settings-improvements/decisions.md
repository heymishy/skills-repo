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
**Resolution [2026-08-17, /definition-of-ready]:** Operator confirmed a staging account with a configured Stripe test-mode customer ID exists. PROCEED-BLOCKED condition on si-s3's AC3 resolved — story signed off. Account identity intentionally not recorded in this versioned artefact; obtain from operator at verification time.
---
**[2026-08-17] | RISK-ACCEPT | /definition-of-ready**
**Decision:** si-s1's W4 warning (verification script not yet reviewed by a domain expert before coding begins) is acknowledged and accepted rather than resolved now — proceeding to sign-off without a pre-code read-through of `verification-scripts/si-s1-verification.md`.
**Alternatives considered:** Pausing DoR sign-off until the operator reads the script first (the "resolve now" option) — not chosen.
**Rationale:** si-s1 is Complexity 1, Low oversight, with a clean review (0 HIGH, 0 MEDIUM) and a small, well-bounded scope (relocate one existing control, no new schema or adapter). The risk of an unreviewed script missing an edge case is low relative to the cost of pausing.
**Made by:** Hamish King (operator choice via DoR warning prompt)
**Revisit trigger:** If AC verification post-merge surfaces a real mismatch between the script and actual intent, revisit whether pre-code script review should be mandatory for future Low-oversight stories.
---
**[2026-08-17] | RISK-ACCEPT | /definition-of-ready**
**Decision:** si-s2's W4 warning (verification script not yet reviewed by a domain expert before coding begins) is acknowledged and accepted rather than resolved now, same as si-s1 — explicitly re-confirmed for si-s2 given it carries the higher-risk schema write and identity-resolution edge case.
**Alternatives considered:** Pausing DoR sign-off until the operator reads the script first — not chosen, after being asked specifically given this story's higher risk profile.
**Rationale:** Operator explicitly confirmed proceeding after being flagged that si-s2 carries more risk than si-s1 (new schema column, identity-resolution edge case AC5).
**Made by:** Hamish King (operator choice via DoR warning prompt, asked specifically for this story)
**Revisit trigger:** If AC verification post-merge surfaces a real mismatch, revisit whether pre-code script review should be mandatory for schema-touching stories specifically.
---
**[2026-08-17] | RISK-ACCEPT | /definition-of-ready**
**Decision:** si-s3's W4 warning (verification script not yet reviewed by a domain expert) is acknowledged and accepted, consistent with si-s1/si-s2's same choice — not re-asked separately since the operator's intent was already established twice in this same DoR run.
**Alternatives considered:** Pausing to review the script first — not chosen.
**Rationale:** Consistent with the operator's stated preference across si-s1 and si-s2 in this same session.
**Made by:** Claude (agent), applying operator's established pattern; flagged for correction if operator disagrees
**Revisit trigger:** If the live verification run surfaces a scenario mismatch, revisit script-review discipline for future stories.
---

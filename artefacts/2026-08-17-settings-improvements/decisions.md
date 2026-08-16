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
**[2026-08-17] | ARCH | Inner coding loop (si-s1)**
**Decision:** si-s1's AC4 (click-rate capture on the relocated theme toggle) is implemented with a new fire-and-forget `POST /settings/theme-toggle-clicked` route (`authGuard`-gated, no CSRF, no new adapter), called via `fetch()` from a new `swCaptureThemeToggle()` client function in `html-shell.js`'s `SHELL_JS`. This touches `src/web-ui/server.js`, which was not listed in the si-s1 DoR contract's "Estimated touch points" (which stated "Services: none. APIs: none.").
**Alternatives considered:** (1) Loading the browser PostHog snippet (as `landing.js`/`skills.js` do) and calling `posthog.capture()` directly client-side, avoiding any new server route — rejected because the story's NFR profile explicitly states "does not add new client-side dependencies," and this would add a whole new third-party script tag to the Settings page. (2) Leaving AC4 unimplemented pending a human decision — rejected because a reasoned, precedent-matching resolution existed and the story is Complexity 1 / Low oversight.
**Rationale:** Every existing `_posthog.capture()` call site in this codebase (`team-management.js`, `journey.js`, `products.js`) fires inside a server-side route handler that a client action already had to call over the network for its own primary purpose. The theme toggle click has no such existing network call by design (instant, no-reload). Satisfying AC4 with the real, testable, server-side `_posthog.capture()` convention — while also respecting the "no new client-side dependency" NFR — requires a small new server round trip. The new route mirrors the existing `swExitImpersonation()` fetch-on-click pattern already in `SHELL_JS`, reuses `_posthog.capture()` unmodified, and introduces no new adapter (per DoR H-ADAPTER: N/A).
**Made by:** Claude (agent), inner coding loop, si-s1 — flagged per the DoR's "add a PR comment describing the ambiguity" instruction; see the PR description/comment for the same note.
**Revisit trigger:** If a future story needs a second capture-only client action, consider whether a small generic `/api/track` beacon route (rather than a bespoke route per feature) is warranted instead of repeating this pattern per-story.
---

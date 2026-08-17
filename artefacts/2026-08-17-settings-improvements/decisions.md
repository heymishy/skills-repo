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
**[2026-08-17] | RISK-ACCEPT | /branch-setup (si-s2)**
**Decision:** Proceeded past a failing baseline at `/branch-setup` for si-s2 (worktree `.worktrees/si-s2`, branch `feature/si-s2-locale-preference`) rather than pausing to investigate first — 528 test files run, 35 failed, 0 passed-then-broken.
**Alternatives considered:** Pausing to investigate/fix all 35 pre-existing failures before starting si-s2 — rejected as disproportionate; these span unrelated features (i1.2, i3.x, mfc1/mfc2, ougl1-6, sec3/sec5, wuce3/4/24, wucp1, shr1, srt1, and others) across a repo with 25+ concurrent worktrees active at the time of this check (`git worktree list`), consistent with the known cross-worktree instability pattern already recorded in this operator's session memory.
**Rationale:** None of the 35 failing files touch `src/web-ui/routes/settings.js`, `src/web-ui/modules/user-roles.js`, or `src/web-ui/modules/identity-links.js` (si-s2's actual touch points), and si-s2 is Complexity 2 / Low oversight. Verification scoping for this story checks the delta against this baseline (35 known-failing files), not suite-wide zero-failures — consistent with this operator's own "check the specific delta against baseline, not the whole suite" convention.
**Made by:** Claude (agent), per branch-setup SKILL.md's option 2 ("Acknowledge as pre-existing and proceed")
**Revisit trigger:** If `npm test` after si-s2's implementation shows any NEW failure outside this 35-file baseline list, treat it as a real regression requiring investigation before branch-complete.
---
**[2026-08-17] | DESIGN | si-s2 implementation**
**Decision:** si-s2's AC2 confirmation ("a confirmation is shown on the page, reusing the existing banner pattern from bse-s1") is implemented as: `handlePostLocalePreference` persists then 302-redirects to `/settings?locale=saved`; `handleGetSettings` maps `req.query.locale` through a new fixed dictionary (`_LOCALE_SUCCESS_MESSAGES`, mirroring `_BILLING_ERROR_MESSAGES`'s exact shape) and renders a banner only for a recognized value, never reflecting the raw query string. This is the same query-param → allowlist-dictionary → conditional-banner mechanism bse-s1 introduced, applied to a success case instead of an error case.
**Alternatives considered:** Rendering the confirmation directly in the POST response body (skip the redirect) — rejected because it deviates from the established GET-render banner mechanism the AC explicitly names, and would leave the URL bar suggesting a page state (e.g. "unsaved form") that does not match what is displayed.
**Rationale:** Matches the AC's explicit instruction to reuse bse-s1's mechanism rather than invent a new one; keeps the success path structurally identical to the existing error path (Billing tab), which future stories can extend consistently.
**Made by:** Claude (agent), implementing si-s2
**Revisit trigger:** None expected — revisit only if a future story needs the confirmation to survive without a page reload (e.g. client-side fetch + inline update), which would be a deliberate UX change, not a bug fix.
---
**[2026-08-17] | RISK-ACCEPT | si-s2 implementation (found-and-fixed regression)**
**Decision:** si-s2's Profile-tab locale-preference form is rendered unconditionally (AC1 requires it to always show sensible defaults), which means it always embeds its own CSRF hidden field — this broke a pre-existing assertion in `tests/check-c2-billing-tab.js` (`testHandleGetSettingsReflectsRealPlanStateNoDuplicateComputation`) that asserted zero `name="_csrf"` occurrences anywhere on the page when no Billing form is shown. Fixed by narrowing that assertion to the Billing panel's own HTML boundary (`id="tab-panel-billing"` through the next tab panel's start), matching the test's own stated intent ("no CSRF field rendered when no [billing] form is shown") rather than the accidentally page-wide check it had been written as.
**Alternatives considered:** Making the locale form's CSRF field conditional on some state (rejected — the field must always be present since the form is always submittable, and this would add complexity purely to satisfy an unrelated test's over-broad assertion); leaving the c2 test failing and calling it acceptable collateral (rejected — this is a real, mechanically-caused regression in another story's test, not pre-existing flakiness, and the fix is small and precisely scoped).
**Rationale:** The original assertion's own inline comment ("no _csrf field is embedded here") was written when the Billing tab was the only form-bearing content near the top of the Profile/Billing structure; it never anticipated a second, unrelated, always-present form elsewhere on the same page. Scoping the check to the panel it actually cares about preserves the AC5 guarantee it was written to protect (no unnecessary CSRF surface on a GET-only link) without coupling it to an unrelated feature.
**Made by:** Claude (agent), implementing si-s2, caught via full-suite diff against the /branch-setup baseline (verify-completion scoping)
**Revisit trigger:** None expected.
---

# Decision Log: journey-gate-confirm-missing-csrf

**Feature:** Add the missing CSRF field to the in-chat gate-confirm button
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-30

---

## Decision categories

| Code | Meaning |
|------|---------|
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `GAP` | A skill-design gap surfaced by this feature, logged for future correction |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-30 | ARCH | pre-implementation**
**Decision:** `_renderChatPage`'s single call site pre-computes `await _csrf.generateCsrfToken(req)` and passes the token value in as a new trailing parameter; `_renderChatPage` itself stays synchronous and embeds `_csrf.csrfField(token)` in the `ougl.4` gate-confirm form.
**Alternatives considered:** (1) Make `_renderChatPage` itself `async` and have it call `generateCsrfToken` internally (would require passing `req` into the function and awaiting its one call site) — declined as unnecessary complexity for a function with exactly one call site; passing the already-minted token value is simpler and keeps the function's existing synchronous contract intact for any future caller.
**Rationale:** Confirmed via direct DOM inspection on live `wuce-staging` (2026-08-30) that the in-chat "Continue to [next stage] →" button's form has no `_csrf` field at all, causing every submission to fail `csrfGuard` unconditionally — found while validating an unrelated fix (`cptr-s1`) and initially mistaken for a recurrence of that same suspend/timing race, until reproducing it instantly with zero idle wait ruled that out. This is the actual root cause of the operator's original bug report ("hit forbidden again in prod... discovery... clarify... benefit-metric").
**Made by:** Hamish King — Platform Owner (confirmed proceeding with this fix after the root cause was found and explained)
**Revisit trigger:** This is the SECOND real CSRF-related gap found in one session (after `cpr-s1`/`cptr-s1`'s own persistence-timing issue). Worth a `/capture` entry recommending a dedicated audit of every form in this codebase for the same missing-`_csrf`-field pattern, rather than waiting for a third live incident to find the next one.
---

# Decision Log: 2026-08-27-csrf-persist-race-on-suspend

**Feature:** Close the race between persisting a new CSRF token and the process suspending mid-write
**Discovery reference:** None — short-track (bug fix)
**Last updated:** 2026-08-27

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
**2026-08-27 | ARCH | pre-implementation**
**Decision:** Implement Option A — make `persistSession` return its write promise, make `generateCsrfToken` `async` and `await` it, and add `await` at all 27 existing call sites of `generateCsrfToken(req)` across 12 files (`admin-credits.js`, `admin-mock-gateway.js`, `dashboard.js`, `features.js`, `impersonation.js`, `journey.js` ×9, `org-conversion.js`, `products.js` ×3, `public.js` ×2, `settings.js` ×2, `skills.js` ×3, `team-management.js` ×2).
**Alternatives considered:** Option B — a centralized pending-writes list flushed by the server's response-dispatch path before sending, keeping `generateCsrfToken` synchronous with zero call-site changes.
**Rationale:** Operator chose Option A. It guarantees the token is durably persisted before any response embedding it is sent, closing the race entirely and unconditionally — Option B's correctness would depend on every current and future response path correctly participating in the centralized flush, a standing maintenance burden Option A avoids by making the guarantee local to the one function that mints the token.
**Made by:** Hamish King (operator), explicit choice ("do 1" / Option A) after being shown both options with tradeoffs.
**Revisit trigger:** If a 28th call site of `generateCsrfToken` is ever added without the `await`, it silently reintroduces the exact race this story closes — worth a lint rule or a structural test (mirroring `pncg-s1`'s manifest-driven approach) if this recurs.
---

# Decision Log: nav-products-wiring-expansion

**Feature:** Show the Products sidebar during skill chat sessions
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-06

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `ARCH` | Architecture or significant technical design choice |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-06 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** Same structural gap already documented for `pcr-s1`/`stis-s1`/`tpac-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** See `tpac-s1`'s equivalent entry — same underlying process gap.
---

---
**2026-08-06 | ARCH | /review Run 1**
**Decision:** `skills.js` gains its own module-level D37 pool reference (`setDbPool`/`getDbPool`), rather than threading `pool` through `server.js`'s 13 dispatch call sites for these routes.
**Alternatives considered:** Passing `pool` as an explicit parameter through every one of `server.js`'s dispatch calls for these 13 routes, mirroring `journey.js`'s `handleGetJourney(req, res, _next, pool)` signature.
**Rationale:** The module-level D37 pattern (already proven by `mtrr-s1`'s `export-data-source.js`, itself mirroring `routes/auth.js`'s `setOrganisationsPool`) avoids a second file's signature changes across 13 call sites, is more consistent with the majority of this codebase's Postgres-backed adapters, and keeps the change contained to `skills.js` + one `server.js` wiring block. Caught as review finding 1-M1 (the story originally implied trivial reuse without naming this real plumbing gap), fixed before Run 2 passed clean.
**Made by:** Hamish King — Platform maintainer / Product owner (caught during review), implemented by Claude Code
**Revisit trigger:** If a future story needs `pool` threaded through `server.js`'s dispatch signatures for an unrelated reason, reconsider whether the module-level pattern is still the right fit for `skills.js` specifically.
---

---
**2026-08-06 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script (`npwe-s1-verification.md`) being reviewed by a domain expert first (W4).
**Rationale:** Same rationale as every other story this session.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals the verification script described the wrong expected behaviour.
---

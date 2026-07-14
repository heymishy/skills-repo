# Decisions Log — security-perf-hardening

Architectural decisions made during delivery of this feature. Created at `sec-perf-s2` (this feature is short-track and had no discovery-time decisions.md; created retroactively at the first point an architectural choice arose).

---

## D1: `requireAdmin`'s new live-role adapter defaults to fallback, not throw, when unwired

**Date:** 2026-07-14
**Context:** `sec-perf-s2` adds a live per-request role re-check to `requireAdmin` via a new injectable adapter, `setGetCurrentRole`. CLAUDE.md's D37 rule requires injectable-adapter stub defaults to throw when unwired, not silently return a safe-looking value.
**Decision:** `setGetCurrentRole`'s default, when unwired, is an explicit fallback to `requireAdmin`'s pre-existing behaviour — trust the cached `req.session.role` — rather than a `throw`.
**Rationale:** Three existing, unrelated test suites (`tests/check-arl-s2-admin-middleware.js`, `tests/check-tir-s4-role-gated-credits-panel.js`, `tests/check-tir-s5-github-org-bulk-add.js`) call `requireAdmin` directly without wiring any adapter, and must continue to pass unmodified — this story does not touch those files. A hard throw would break all three. This mirrors an existing precedent already in this codebase: `src/web-ui/modules/user-roles.js`'s `getRoleForTenant` falls back to the legacy `getUserRole` adapter when its own adapter is unwired, and only throws when *neither* is wired — an explicit, documented delegation to another real behaviour, not a silent empty-value stub. `tir-s9` (team-identity-roles epic, in flight on a separate branch) uses the same additive-default pattern for `getRoleForTenant`'s new optional second parameter. In production, `server.js` always wires `setGetCurrentRole` (sec-perf-s2 AC5), so the fallback branch is dead in production — it exists only for backward compatibility with pre-existing tests and any other unwired context.
**Alternative considered:** Update all three affected test files to wire the new adapter, satisfying a strict reading of D37. Rejected for this story: touches three other stories' test artefacts for a change that is orthogonal to what those stories were verifying, and the fallback-with-precedent pattern is already an accepted shape in this codebase (see above).

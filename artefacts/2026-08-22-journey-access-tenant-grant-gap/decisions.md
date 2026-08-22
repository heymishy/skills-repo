# Decisions Log: journey-access tenant grant gap

## RISK-ACCEPT — W4: Verification script not reviewed by a domain expert before DoR sign-off

**Date:** 2026-08-22
**Context:** `jatg-s1`'s DoR run flagged W4 — the AC verification script (`artefacts/2026-08-22-journey-access-tenant-grant-gap/verification-scripts/jatg-s1-verification.md`) has not been walked through by a domain expert ahead of implementation. This was asked explicitly (not defaulted) given this story is a real access-control/security fix, unlike the preceding `pisd-s1` (a path-configuration fix).
**Decision:** Proceed without a pre-implementation review. The operator chose to acknowledge the risk rather than block on it.
**Rationale:** The fix is small, fully specified, and bounded: a single function (`requireJourneyAccess`) with an exact, already-diagnosed root cause and a suggested fix shape already documented in the story. The 5 verification scenarios are direct, mechanically-derived reproductions of the exact bug and its regression guards (same-tenant grant, cross-tenant denial, owner-only-route denial) — not subjective judgment calls. AC2 and AC3 specifically exist as negative-case guards against the fix over-correcting into a new vulnerability (cross-tenant access, or weakened owner-only routes), and are unit-tested directly.

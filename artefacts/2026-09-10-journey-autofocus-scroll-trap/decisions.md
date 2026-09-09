# Decisions: journey-autofocus-scroll-trap

---

## RISK-ACCEPT: jasb-s1 verification script not yet reviewed by a separate domain expert

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (DoR Warning W4)
**Context:** DoR for `jasb-s1` flagged W4 — the AC verification script (`artefacts/2026-09-10-journey-autofocus-scroll-trap/verification-scripts/jasb-s1-verification.md`) has not been reviewed by a separate domain expert before sign-off.
**Decision:** Proceed without a separate pre-code review of the verification script.
**Rationale:** The root cause was confirmed via live reproduction on `wuce-staging.fly.dev` (direct JS inspection of `window.scrollY` and `document.activeElement`, 2026-09-10) before the story was written, not inferred or guessed. The fix is a single conditional-attribute change (complexity rating 1) with a precisely scoped, already-live bug as its own specification — low ambiguity, low blast radius. Operator (Hamish King) directed the story directly in-session.

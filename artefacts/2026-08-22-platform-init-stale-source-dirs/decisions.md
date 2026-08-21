# Decisions Log: platform-init stale source directories

## RISK-ACCEPT — W4: Verification script not reviewed by a domain expert before DoR sign-off

**Date:** 2026-08-22
**Context:** `pisd-s1`'s DoR run flagged W4 — the AC verification script (`artefacts/2026-08-22-platform-init-stale-source-dirs/verification-scripts/pisd-s1-verification.md`) has not been walked through by a domain expert ahead of implementation.
**Decision:** Proceed without a pre-implementation review. The operator chose to acknowledge the risk rather than block on it, matching the precedent already set this session for `cmba-s1`.
**Rationale:** This is a bounded, low-ambiguity path-constant fix (`platform-init.js`'s `COPY_DIRS` source paths) with a small, mechanically-derived verification script (4 scenarios plus one investigation edge case). The risk of an unreviewed script missing edge cases is lower here than for a UI-behaviour story — the scenarios are direct file-count/presence checks against already-known real skill/template names, not subjective UX judgment calls. AC5 (the one genuinely judgment-dependent item — what `.github/skills/`'s current content is for) is explicitly carried forward as its own investigation requirement, not silently accepted.

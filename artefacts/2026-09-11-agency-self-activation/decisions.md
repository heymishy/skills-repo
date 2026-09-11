# Decisions: agency-self-activation

Per this repo's standing rule (`CLAUDE.md`, "decisions.md is mandatory for features with architectural choices"). Created at story-authoring time (short-track); appended as further decisions are made during delivery.

---

## Decision: Self-service activation, mirroring `org-conversion.js`'s pattern, not a platform-operator panel

**Date:** 2026-09-11
**Context:** The missing "how does an org become an Agency" mechanism could be built as (a) self-service (any standalone org's admin can activate it themselves) or (b) platform-operator-driven (an internal admin panel to flag specific orgs).
**Decision:** Self-service, matching the original `2026-07-30-agency-client-organisations` discovery's own stated intent ("A consultancy can sign up as an Agency") and its benefit metric's own target language ("at least 1 Agency organisation signs up"). Implementation mirrors `org-conversion.js`'s already-shipped, already-reviewed `client → standalone` admin-gate pattern as closely as possible (same role-resolution call, same single-statement atomic UPDATE shape, same audit-log shape) rather than introducing a new permission or activation mechanism.
**Rationale:** Building a platform-operator panel would be new scope beyond what the original epic ever specified or needed, and would reintroduce exactly the kind of "not self-service" friction the original epic's own benefit metric was designed to measure away. Mirroring an already-reviewed sibling pattern keeps this story's own implementation risk low despite touching the same tenant-isolation boundary (ADR-025) the original epic's Story 2 was given closer review for.

---

## RISK-ACCEPT: Verification script not yet reviewed by a separate domain expert

**Date:** 2026-09-11
**Category:** RISK-ACCEPT (DoR Warning W4)
**Context:** DoR flagged W4 — the test plan/verification script has not been reviewed by a separate person before implementation begins.
**Decision:** Proceed without a separate pre-code review.
**Rationale:** This story mirrors an already-shipped, already-reviewed sibling function (`convertOrganisationToStandalone`) closely enough that the pattern itself has already had independent scrutiny in this codebase. Complexity rating 2 (not 1) specifically because of the security-sensitive org-type boundary — mitigated by the tight mirroring, not by skipping review of the mirroring itself. Operator (Hamish King) directed this story directly in-session, immediately after independently reviewing the live-verification finding that produced it, and confirmed short-track (not standard-track) was the right weight for this gap given its narrow, precedent-mirroring scope.

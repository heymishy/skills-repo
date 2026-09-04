# Decisions: Staging deploy workflow skips bookkeeping-only pushes to master

---

## RISK-ACCEPT: AC2/AC3 (GitHub-native trigger-skip behaviour) cannot be verified by a local automated test

**Date:** 2026-09-04
**Context:** `paths-ignore`'s actual skip-vs-run behaviour executes entirely inside GitHub's own trigger evaluation, before any job or step in the workflow runs -- there is no local harness that can simulate a real `push` webhook event against this exact workflow file.
**Decision:** AC1 (the `paths-ignore` list's own shape), AC4, and AC5 are covered by automated tests. AC2/AC3 (the real skip-vs-run behaviour) are covered by a manual verification script (`verification-scripts/sdsb-s1-verification.md`) run post-merge, not by an automated test.
**Rationale:** Matches the precedent already established in CLAUDE.md's B2 rule for CSS-layout-dependent ACs (RISK-ACCEPT + manual smoke test script), applied here to a GitHub-native-behaviour-dependent AC rather than a CSS-rendering-dependent one -- the same underlying reason (the correctness of the behaviour cannot be observed without the real external system) applies equally to both cases.

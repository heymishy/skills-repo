# Review Report: Separate staging and prod PostHog projects with isolated API keys — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C/E — AC3 ("Given a Playwright test run against the staging environment generates events... When the prod PostHog project is inspected, Then zero of those events... appear there") requires a live staging environment and a Playwright E2E suite — neither exists yet within this epic. Discovery's own hard sequencing constraint states sub-feature 2 (staging) and sub-feature 3 (E2E suite) are both built *after* this feature-flags epic. AC3 cannot be verified at the point this story would normally reach DoD. This is exactly the case `.github/architecture-guardrails.md`'s Approved Pattern **PAT-06** ("Execution pre-condition gate on runtime artefact existence") governs: such a dependency must be expressed as a DoR PROCEED-BLOCKED condition, not embedded as a plain AC.
  Fix: Either (a) rewrite AC3 to verify what's actually testable at this story's stage (e.g. that the staging/prod key selection logic is correct in isolation, mocking "prod project" as an assertion on which key was used, not a live E2E run), or (b) add an explicit PAT-06 PROCEED-BLOCKED condition to this story's DoR pre-check stating AC3 cannot be verified until Epic 2 (staging) and Epic 3 (E2E) exist, and reference it in `decisions.md`.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** E — AC3 requires "a Playwright test run" but Architecture Constraints cites only D37 and the zero-new-npm-deps relaxation — ADR-018 (Playwright is the sole E2E framework; specs in `tests/e2e/`) is applicable and directly invoked by the AC's own language, but is not referenced.
  Risk if proceeding: a future implementer could reach for a non-Playwright test mechanism for this AC, violating ADR-018.
  To acknowledge: add "ADR-018: Playwright is the sole E2E framework" to Architecture Constraints, or run /decisions RISK-ACCEPT if deliberately deferred.

---

## LOW findings — note for retrospective

- **[1-L1]** A — Dependency-chain inconsistency: this story's own "Downstream" field lists only "S1.4, S1.5," omitting S1.3 — yet S1.3's Dependencies section explicitly lists "S1.1, S1.2" as upstream. The two stories' declared dependency graphs don't agree.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 4, B-ScopeIntegrity: 4, C-ACQuality: 2 (automatic-fail threshold — AC3 not independently testable at this story's stage, no PROCEED-BLOCKED gate), D-Completeness: 5.

# Review Report: Build the CI pipeline — PR checks through staging deploy — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C — AC4, the sole AC covering removal of the existing direct-to-prod deploy behaviour, is not concrete enough to verify the old path is actually gone: "Given `.github/workflows/fly-deploy.yml` currently deploys directly to prod on push to `main`, When this story is complete, Then that workflow (or its replacement) no longer does so." This is a narrative negative with no named verification mechanism — no grep/CI assertion that no push-to-main step deploys to the prod app, no definition of what "replacement" structurally means. As written, a PR could add the new staging-deploy workflow (satisfying AC2) while leaving the old `fly-deploy.yml` trigger dormant-but-present, and AC4 would be hard to fail it against. This touches a live production deploy path — under-specification here is a genuine operational risk.
  Fix: Rewrite AC4 with a concrete, checkable verification step, e.g. "Given the updated workflow configuration, When inspected, Then no GitHub Actions job triggered by push-to-`main` deploys to the `wuce-prod` Fly app — verified by a CI-native check (e.g. a script asserting no workflow file contains `--app wuce-prod` outside the manual-approval promote job introduced in S2.6)."

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** E — Architecture Constraints cites "D37: no new architecture pattern introduced" — this is a misuse of the D37 label. D37 (CLAUDE.md) is specifically the injectable-adapter rule; no adapter is introduced here, so invoking D37 to mean "not applicable" is confusing. The template's correct phrasing for a genuinely inapplicable constraint is "None identified — checked against .github/architecture-guardrails.md."
  Risk if proceeding: low but creates a bad precedent for D37 citation hygiene, especially given this same feature already had to correct a real D37/ADR-009 mislabeling elsewhere.
  To acknowledge: correct the phrasing in the story.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 5, B-ScopeIntegrity: 5, C-ACQuality: 3, D-Completeness: 5. Note: C scored at the floor (3) rather than below it, but AC4's under-specification on a live production deploy path is a HIGH-severity finding — Outcome corrected to FAIL per the template's rule ("PASS = no HIGH findings remain").

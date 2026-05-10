# T3 — Solution masquerades as problem / claude-opus-4-6 / Run 1

**Date:** 2026-05-10
**Model:** claude-opus-4-6
**Case:** T3-solution-masquerades-as-problem
**Experiment:** EXP-001-discovery-phase4-5
**Status:** CONFOUNDED — model read `product/mission.md`, `product/tech-stack.md`, `product/constraints.md` from this repo; domain context bled into response. Superseded by run-2 (fresh repo, no product context).

---

## Operator input

Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.

---

## Model response

This request needs to enter the pipeline at `/discovery`, not implementation. Two reasons:

1. **Pipeline discipline.** New features (especially regulated/compliance-driven ones) must run discovery → benefit-metric → definition → review → test-plan → DoR before any code. Jumping straight to implementation skips the scope contract, ACs, and test plan that the coding agent requires.

2. **Workspace mismatch.** This repo is the skills platform itself — it contains no transaction-processing code, AML rules engine, or alerting infrastructure. There's nothing here to add monitoring to. If the AML system lives in another repo, the pipeline should run there (after `/bootstrap` if it's not yet set up).

Recommended next step — run `/discovery` to capture:
- Problem statement (two near-misses, 18+ hr detection lag, £10k threshold)
- Regulatory driver (FCA Q4 review)
- Scope boundaries (detection only? alerting? case management? SAR workflow?)
- Constraints (which system, which data sources, who consumes alerts)

After discovery is approved, `/benefit-metric` will set the measurable target (e.g. detection lag < X minutes, zero missed thresholds), then `/definition` slices into stories.

Want me to:
- **(a)** Run `/discovery` here as a structuring exercise (output saved to artefacts), or
- **(b)** Confirm which repo the AML system lives in so the pipeline runs in the right place?
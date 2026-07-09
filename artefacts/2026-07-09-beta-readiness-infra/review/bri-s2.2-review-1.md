# Review Report: Provision a Neon staging branch for Postgres — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C — AC3's "30 seconds" Neon cold-start timeout is asserted with no grounding. Discovery.md explicitly required this be "a concrete timeout budget decided at /definition, not left as 'account for it,'" and this story claims 30 seconds is "the agreed timeout budget," but `decisions.md` contains no entry establishing this figure — its only Neon-related entry (2026-07-09) confirms free-tier *capacity* sufficiency and names cold-start latency as "the known risk," never a resolved duration. This unsourced number then cascades into S2.5/S2.6 NFRs and gate logic as if it were validated.
  Fix: Either (a) source the 30-second figure from an actual Neon benchmark/doc reference, or (b) run a small technical spike measuring real cold-start latency and record the result in `decisions.md` before treating 30 seconds as authoritative, or (c) explicitly log a `/decisions` ASSUMPTION entry stating 30 seconds is a working placeholder pending real measurement, and propagate that caveat to S2.5/S2.6.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** A — Benefit Linkage is dependency-flavoured ("this story ensures a broken migration or bad query in staging can never touch or corrupt production data") rather than a direct metric-movement statement — plausible but framed around infrastructure necessity.
  Risk if proceeding: low.
  To acknowledge: tighten wording, or RISK-ACCEPT (same class as bri-s2.1's 1-M1).

---

## LOW findings — note for retrospective

- **[1-L1]** D — NFR Performance field restates the ungrounded 30s figure as though settled; see 1-H1.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 4, B-ScopeIntegrity: 5, C-ACQuality: 3, D-Completeness: 5. Note: C scored at the floor (3, "addressable without rework" per the scoring rubric) rather than below it, but the ungrounded timeout figure is a HIGH-severity finding per the template's own rule ("PASS = no HIGH findings remain") — Outcome is corrected to FAIL despite no criterion scoring below 3.

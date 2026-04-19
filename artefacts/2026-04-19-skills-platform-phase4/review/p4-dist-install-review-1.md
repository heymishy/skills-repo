# Review Report: p4-dist-install — Sidecar Install via init Command — Run 1

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-install.md
**Date:** 2026-04-19
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Traceability — "So that" clause does not name the benefit metric. Current text: "So that I have a local, hash-verified copy of all skill content I am governed by, and my repo's git history is clean of platform install noise." M1 (Distribution sync) is named in the benefit linkage section, which compensates — but the user story clause itself fails the `"So that..." connects to a named metric` check.
  Risk if proceeding: Test plan authors may not link install validation to M1 measurement evidence.
  To acknowledge: run /decisions, category RISK-ACCEPT, or update the "So that" clause.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC1 bundles four distinct test conditions in one AC: (1) sidecar directory exists, (2) zero commits added, (3) `git status` shows no staged/modified tracked files, (4) sidecar directory is in `.gitignore`. A test plan author writing against this AC must cover four failure modes under one AC ID. Consider splitting into separate ACs: AC1a (sidecar exists at expected path), AC1b (zero commits), AC1c (no staged/modified tracked files). These have independent failure modes that deserve independent test IDs.

- **[1-L2]** AC quality — AC4 contains an OR branch: `init` on an existing sidecar "either errors with <message> or performs a safe idempotent re-init." An AC with an OR branch allows the implementation to choose either path without test failure — the test plan must pick one path to assert against. Recommend picking the preferred behaviour (error path is simpler and safer for a first install) and making it the normative case, with the idempotent re-init as an explicit "alternate path" AC or moving it to out-of-scope (Phase 5 enhancement).

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 1 MEDIUM, 2 LOW.
**Outcome: PASS** — 1 MEDIUM finding (1-M1) must be acknowledged or the "So that" clause updated before /test-plan.

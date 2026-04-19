## Story: Validate install and sync end-to-end against a fresh consumer repo

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead evaluating the distribution model (Craig's context)**,
I want to **see a scripted end-to-end test that runs install → verify → update upstream → sync → verify on a fresh consumer repo**,
So that **I have evidence that the full distribution lifecycle works before I recommend my squad adopt it (M1)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** This story produces the direct measurement evidence for M1. The E2E test measures the success rate of the install and sync operations. If the E2E test passes, M1 has baseline evidence. If it fails, M1 has a documented failure case to fix.

## Architecture Constraints

- **All distribution constraints (C1, C5, ADR-004, ADR-012) are tested indirectly:** This E2E story validates the constraints in combination; individual constraint satisfaction is tested in the upstream stories
- **MC-CORRECT-02 (schema-first):** The E2E test validates that all generated files (lockfile, `context.yml`) conform to their schemas

## Dependencies

- **Upstream:** All Epic 2 implementation stories (implement-zero-commit-install, implement-sync-command, implement-lockfile-hash-verification, implement-context-yml-seeding)
- **Downstream:** None — this is the E2E validation story; results feed into M1 metric evidence

## Acceptance Criteria

**AC1:** Given a scripted E2E test, When the test initialises a fresh git repository as the consumer repo and runs the install command, Then the install completes successfully, the lockfile is present, `context.yml` is seeded, and `git log` shows zero commits from the install.

**AC2:** Given the install from AC1 has completed, When the E2E test runs the hash verification command, Then all files pass verification (exit code 0).

**AC3:** Given a simulated upstream update (at least one file in the governance package is modified at the source), When the E2E test runs the sync command on the consumer repo, Then the updated files arrive in the consumer's working tree, the lockfile hashes are updated, and `context.yml` is untouched.

**AC4:** Given the sync from AC3 has completed, When the E2E test runs the hash verification command again, Then all files pass verification (exit code 0) — demonstrating that sync produces a consistent, verifiable state.

**AC5:** Given the full E2E test run (AC1 through AC4), When the test completes, Then it produces a summary report showing: (a) total operations attempted, (b) success count, (c) failure count with details, and (d) the computed M1 success rate for this run.

## Out of Scope

- Testing on multiple operating systems in CI — this E2E validates the happy path on the developer's local machine; CI matrix testing is a future hardening story
- Testing with consumer-modified governed files (conflict scenarios) — Phase 5
- Performance benchmarking — the E2E checks correctness, not speed

## NFRs

- **Security:** E2E test must not use real credentials; test fixtures must not contain tokens (MC-SEC-02)
- **Performance:** Full E2E should complete in under 60 seconds
- **Accessibility:** None — automated test, no UI

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — this is a pure validation story; scope is defined by the upstream implementation stories

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/validate-install-sync-e2e.md |
| run_timestamp | 2026-04-19T18:52:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 2 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 5 ACs covering install, verify, sync, re-verify, summary report |
| Scope adherence | 5 | E2E validation only — no multi-OS CI, no conflict testing |
| Context utilisation | 5 | M1 metric directly measured; all distribution constraints validated in combination |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |

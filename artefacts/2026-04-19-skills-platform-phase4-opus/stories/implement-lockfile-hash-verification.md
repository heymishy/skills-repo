## Story: Implement lockfile hash verification

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **senior individual engineer (Thomas's context)**,
I want to **run a verification command that checks every file in my installed governance package against its lockfile hash**,
So that **I can detect tampering or drift before the pipeline runs and trust that the governance rules I am executing are authentic (M1, C5)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** Hash verification is the trust mechanism that underpins distribution. Without it, a consumer cannot distinguish a legitimate governance update from accidental or malicious modification. Verification failures that are detected early protect the ≥90% sync success target by surfacing problems before they cascade.

## Architecture Constraints

- **C5 (hash-verified skill files):** This story is the implementation of C5 at the consumer side. The verification must use SHA-256 hashes recorded in the lockfile.
- **MC-CORRECT-02 (schema-first):** The verification must operate against the lockfile schema — it does not invent its own hash storage format
- **ADR-012 (platform-agnostic):** Verification must work on macOS, Linux, and Windows

## Dependencies

- **Upstream:** design-package-manifest — the lockfile schema defines the hash format; implement-zero-commit-install or implement-sync-command — a lockfile must exist to verify against
- **Downstream:** validate-install-sync-e2e includes hash verification in its E2E test

## Acceptance Criteria

**AC1:** Given a consumer repo with a lockfile and installed governance package, When I run the verification command, Then it computes the SHA-256 hash of every file listed in the lockfile and compares it against the recorded hash.

**AC2:** Given all files match their lockfile hashes, When the verification completes, Then it outputs a clear "all files verified" message with the count of files checked.

**AC3:** Given one or more files have been modified (hash mismatch), When the verification completes, Then it outputs: (a) the list of files that failed verification, (b) the expected hash vs. actual hash for each, and (c) exits with a non-zero exit code.

**AC4:** Given one or more files listed in the lockfile are missing from the working tree, When the verification completes, Then it reports the missing files separately from hash mismatches and exits with a non-zero exit code.

## Out of Scope

- Automatic remediation of hash failures (re-syncing failed files) — the command reports, it does not fix
- Signing or PKI-based verification — C5 uses hash verification, not cryptographic signing; signing is a future hardening concern
- CI/CD integration (pre-commit hooks, GitHub Actions verification step) — that can be built on top of this command but is not in scope

## NFRs

- **Security:** Verification must use SHA-256 (not MD5 or SHA-1); no credentials in verification output (MC-SEC-02)
- **Performance:** Verification should complete in under 10 seconds for a typical governance package (~200 files)
- **Accessibility:** CLI output must be readable by screen readers

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — hash verification is well-understood; the lockfile schema is defined upstream

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-lockfile-hash-verification.md |
| run_timestamp | 2026-04-19T18:52:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs: hash computation, success path, failure path with detail, missing file path |
| Scope adherence | 5 | Verification only — no remediation, no signing, no CI integration |
| Context utilisation | 5 | C5 is the primary constraint; SHA-256 specified; lockfile schema referenced |

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

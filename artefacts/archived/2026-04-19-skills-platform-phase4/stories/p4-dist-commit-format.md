## Story: Operator-configured commit-format validation before state advance

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform operator in a regulated enterprise (Craig, or any consumer with a traceability standard)**,
I want to **configure a commit-format rule in `.github/context.yml` that the distribution command validates before advancing state**,
So that **my regulated team's commit traceability standard is enforced by the platform tool and not by a manual code review policy that teams can bypass**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync
**How:** Distribution sub-problem 1b in the Phase 4 discovery is commit provenance — enterprises want story-reference or ticket-reference in commit messages as a traceability artifact. Without an operator-configurable enforcement point, regulated consumers cannot adopt the platform without also building a custom pre-commit hook, which is friction that blocks adoption. This story removes that friction.

## Architecture Constraints

- ADR-004: the commit-format rule is read exclusively from `.github/context.yml` under the key `distribution.commit_format_regex` — the command must not accept the regex as a CLI argument, an environment variable, or a hardcoded fallback value; any source other than context.yml is a violation of ADR-004
- C1: the `advance` command validates the existing commit format but does not generate commits; the validation is a gate, not a transformation; generating a commit on behalf of the consumer to satisfy the format would violate C1
- MC-CORRECT-02: the regex validation must use a schema-validated config read (the context.yml schema defines `distribution.commit_format_regex` as an optional string field); reading an undeclared field does not fail silently — it uses the declared schema's default (absent = no validation)
- MC-SEC-02: no commit message content, author identity, or repository content may be logged to external services as a side effect of format validation

## Dependencies

- **Upstream:** p4.dist-install — the commit-format check is only meaningful when a sidecar exists; `advance` is a sidecar-requiring command; p4.spike-c output must have decided the commit-format validation approach
- **Downstream:** p4.dist-migration — migrating consumers may have non-conforming commit history; the migration guide must document how to handle an existing commit history that predates the format rule

## Acceptance Criteria

**AC1:** Given `distribution.commit_format_regex` is set to a valid regex in `.github/context.yml` (e.g. `"^JIRA-[0-9]+"`) and the HEAD commit message does not match the regex, When `skills-repo advance` is run, Then the command exits with a non-zero status, an error message naming: the failing commit SHA (first 8 characters), the commit message excerpt (first 72 characters), and the expected format as stated in the regex — and no workflow state transition occurs.

**AC2:** Given `distribution.commit_format_regex` is absent from `.github/context.yml`, When any distribution command (including `advance`) runs, Then no commit-format validation occurs and the command proceeds without checking commit messages — the platform does not impose a default format rule on consumers who have not opted in.

**AC3:** Given `distribution.commit_format_regex` is set and the HEAD commit message matches the regex, When `skills-repo advance` is run, Then the command proceeds normally; the format validation adds no observable latency beyond a simple regex match (sub-millisecond).

**AC4:** Given a consumer sets an invalid regex in `distribution.commit_format_regex` (e.g. an unclosed character class), When any distribution command reads the context.yml, Then the command exits with a clear error message identifying the invalid regex and the context.yml line reference — the consumer is not presented with a regex library stack trace.

## Out of Scope

- Generating, amending, or rewriting commits to satisfy a format rule — the validation is a gate, not a fixer; the consumer must amend their commit before re-running `advance`
- Validating commits other than HEAD at `advance` time — the check covers the most recent commit only; historical commits are not re-validated
- Enforcing any specific commit format as a platform default — the platform has no opinion on format; the rule is entirely operator-defined

## NFRs

- **Security:** Commit message content is not logged to external services (MC-SEC-02); regex validation is performed in-process, not via a shell command that might expose the message
- **Correctness:** ADR-004 compliance — single config source only; tested by the `check-approval-adapters.js` or equivalent governance check
- **Performance:** Format validation adds at most 10 milliseconds to `advance` wall time

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — the feature is entirely driven by the context.yml schema; no architectural dependency beyond Spike C's distribution.commit_format_regex field definition

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
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-commit-format.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 8 |

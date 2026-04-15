# Retrospective Story Template

<!--
  USAGE: Use this template when work has already landed in the codebase without a full artefact chain.
  A retrospective story satisfies the artefact-first rule retroactively for BETWEEN-STORIES items
  identified by the retrospective audit process.

  When to use:
  - A functional SKILL.md, src/ module, or governance check was committed without a discovery → story → DoR chain
  - You need to bring a BETWEEN-STORIES item into the traceability system without re-doing the implementation
  - The change is already on master; the implementation section can reference the committed code directly

  When NOT to use:
  - New work that has not yet started — use the standard story.md template instead
  - PRE-PIPELINE work (before the first story pipeline started) — these are excluded from coverage by convention
  - Documentation-only changes to README, CHANGELOG, or workspace notes — these are exempted by the artefact-first rule

  Retrospective story IDs use the prefix "r-" followed by a short slug, e.g. r-estimate-skill.
  Save to: artefacts/[feature-slug]/stories/r-[slug].md
  Pair with: r-[slug]-dor.md in the dor/ folder (the DoR for a retrospective story focuses on test coverage and trace linkage, not implementation scope, since the implementation already exists)
-->

## Retrospective Story: [Title]

**Story ID:** r-[slug]
**Retrospective audit date:** [YYYY-MM-DD]
**Committed in:** [CHANGELOG version or commit hash where this work landed, e.g. [Unreleased] or abc1234]
**Risk classification:** HIGH / MEDIUM / LOW (from retrospective audit findings table)

**Epic reference:** [Link to parent epic or "no epic — standalone BETWEEN-STORIES item"]
**Discovery reference:** [Link to approved discovery artefact or "no discovery — retrospective only"]
**Benefit-metric reference:** [Link to benefit-metric artefact or "no direct metric — see parent phase benefit-metric.md"]

## What was delivered

<!-- One paragraph describing what is already in the codebase. Be specific: file paths, entry points, and observable behaviour. This replaces the implementation plan since the implementation exists. -->

**Key files already committed:**
- `[path/to/primary/file]` — [one-line description of its role]
- `[path/to/test/file]` — [one-line description]

**Observed behaviour:** [What the feature does when exercised. A new reader should be able to understand the delivered scope from this paragraph alone.]

## Benefit Linkage

**Metric moved:** [Name of metric from parent phase benefit-metric artefact, or "none — tooling improvement"]
**How:** [One honest sentence. If there is no direct metric connection, write: "This delivers pipeline infrastructure that enables [downstream story or skill] to achieve [metric]."]

## User Story

As a **[persona]**,
I want to **[specific action this feature enables]**,
So that **[observable outcome now achievable]**.

## Acceptance Criteria

<!-- For a retrospective story, ACs describe the observable behaviour that already exists AND the test coverage that must be added to bring it into the governance framework. Mark each AC as: ALREADY-MET (implemented), NEEDS-TESTS (implemented but not tested), or NEEDS-IMPLEMENTATION (genuinely missing). -->

**AC1 — [Condition]**
Status: ALREADY-MET / NEEDS-TESTS / NEEDS-IMPLEMENTATION
Evidence: [Commit hash, file path, or "no test coverage yet"]

**AC2 — [Condition]**
Status: ALREADY-MET / NEEDS-TESTS / NEEDS-IMPLEMENTATION
Evidence: [...]

**AC3 — Test coverage gate**
Status: NEEDS-TESTS
Evidence: A passing test (unit or integration) must be added to `tests/` that exercises the primary behaviour described in AC1. Until this is present, this retrospective story is not DoR-complete.

## Out of Scope

<!-- What is explicitly not covered by this retrospective story. Be concrete. -->

- Re-implementing the feature from scratch is out of scope — the implementation exists and is correct
- Full regression suite expansion beyond the primary ACs is out of scope unless called out above

## Open Questions

<!-- Unresolved questions that the DoR gate should address before this story is considered DoR-complete. -->

- [ ] Does the committed implementation satisfy the platform's architectural guardrails? (check `.github/architecture-guardrails.md`)
- [ ] Are there any security implications of the committed code that were not reviewed? (OWASP Top 10 scan recommended for src/ modules)
- [ ] Is the feature referenced in any upgrade-path agent index (e.g. `docs/HANDOFF.md`)? If not, add a reference before closing.

## Traceability Linkage

<!-- Once this retrospective story is DoR-complete, update these links. -->

**DoR artefact:** `artefacts/[feature-slug]/dor/r-[slug]-dor.md` (create alongside this file)
**Test plan:** `artefacts/[feature-slug]/test-plans/r-[slug]-test-plan.md`
**Verification script:** `artefacts/[feature-slug]/verification-scripts/r-[slug]-verification.md`
**DoD artefact:** `artefacts/[feature-slug]/dod/r-[slug]-dod.md` (written post-PR-merge)

## Notes

<!-- Contextual notes for the agent picking up this retrospective story. -->

- This is a retrospective story. The implementation already exists on master. The primary work is: (1) write the test plan, (2) confirm ACs are met by the existing code, (3) add any missing tests, (4) complete the DoR checklist, (5) open a PR for the test additions if any new test files are needed.
- If the implementation has gaps (NEEDS-IMPLEMENTATION ACs above), treat this as a standard story for those ACs only. Do not re-touch the already-delivered behaviour unless a bug is found during the AC review.

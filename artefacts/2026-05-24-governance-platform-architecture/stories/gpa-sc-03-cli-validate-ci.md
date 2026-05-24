## Story: Wire CLI validate to CI assurance gate

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **platform operator** responsible for governance quality across story deliveries,
I want H1-H9 DoR gate checks re-evaluated by CI on every PR push to master — not only at web UI gate-confirm time —
So that M2 (CI H-gate enforcement coverage) moves from 0 of 9 H-checks wired to CI to 9 of 9, and a DoR artefact mutated between gate-confirm and merge is caught by CI before it lands on master.

## Benefit Linkage

**Metric moved:** M2 — CI H-gate enforcement coverage.
**How:** Today, H1-H9 are implemented in `cli-outer-loop.js` and called only from `journey.js` (web UI gate-confirm path). The CI assurance gate only checks 4 structural file-existence conditions. This story wires `skills validate --ci` to run in assurance-gate.yml on every PR push, making H1-H9 a CI gate rather than a point-in-time web UI check. A DoR artefact mutated after gate-confirm is caught before merge.

## Architecture Constraints

- **ADR-013:** `skills validate` is a CLI surface adapter. The H-gate evaluation logic it calls must be in `governance-package.js` (or called through it), not reimplemented independently in the CLI module. If H-gate logic currently lives only in `cli-outer-loop.js`, extracting it to `governance-package.js` is in scope for this story.
- ADR-009: the H-check wiring runs in the `pull_request` workflow (`contents: read` only) — no write-back to the branch from this step.
- ADR-011: new `bin/skills validate --ci` mode — this story artefact satisfies artefact-first.
- Output format: `skills validate` output must use `[skills-validate] Results: N passed, N failed` prefix per test-output-format standard (SC-04).
- Plain Node.js, CommonJS, no external npm dependencies.
- Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** SC-01 (`gpa-sc-01-trace-contract.md`) — H9 (architecture constraints check) relies on trace-contract.md existing to be evaluated meaningfully. H9 can technically run without it, but will always warn until trace-contract.md lands. SC-03 should be dispatched after SC-01 is DoD-complete.
- **Downstream:** M2 signal begins when SC-03 is deployed. M4 (SC-02) is gated on Wave 2 stable — SC-03 completing is part of that gate condition.

## Acceptance Criteria

**AC1:** Given a PR is opened or updated against master with changes to an active feature, when the assurance-gate.yml CI workflow runs, then it calls `node bin/skills validate --story <story-slug> --ci` for each story in the PR's feature whose `dorStatus` is not `signed-off`, and each H-check result is reported as a named check verdict (H1 through H9, each with pass/fail/warn — not a single boolean pass/fail).

**AC2:** Given `node bin/skills validate --story <slug> --ci` is run and all H1-H9 checks pass for that story, when the command completes, then it exits 0 and prints output conforming to the test-output-format standard: `[skills-validate] Results: 9 passed, 0 failed`.

**AC3:** Given `node bin/skills validate --story <slug> --ci` is run and H1 fails (discovery artefact not found at expected path), when the command completes, then it exits 1 and the output identifies H1 specifically — `[skills-validate] H1: FAIL — discovery artefact not found at <path>` — not a generic gate failure. The CI job reports a named failure for H1.

**AC4:** Given a story whose `dorStatus` is `signed-off`, when `skills validate --ci` runs on a PR containing that story, then the story is skipped and a skip notice is printed (`[skills-validate] <slug>: SKIP — dorStatus is signed-off`) — the H-checks are not re-run on already-signed-off stories.

**AC5:** Given SC-03 is deployed and 10 consecutive PRs pass `skills validate --ci` without false-positive rejections (valid PRs rejected by the H-check gate), then M2's minimum signal condition is met and the evidence is recorded at SC-03 DoD.

**AC6:** Given assumption A3 (DoR path resolution for multi-story features) produces false-positive rejections on more than 1 in 20 PRs, when the pattern is identified, then a RISK-ACCEPT entry is written to `artefacts/2026-05-24-governance-platform-architecture/decisions.md` and the H-check wiring scope is restricted to single-story features until A3 is resolved — the CI job does not silently discard the false-positive; it reports the path resolution failure.

## Out of Scope

- Re-evaluating H-checks for stories already DoD-complete (merged PRs) — historical stories are out of scope.
- Replacing or removing the existing 4 structural file-existence checks in the assurance gate — these remain and run in addition to the H-check wiring.
- Automating the `dorStatus: signed-off` write from CI — sign-off remains a deliberate human approval action.
- Making H-gate failures merge-blocking — that is a post-Wave-3 governance decision outside this story's scope.

## NFRs

- **Output format:** `skills validate` output must conform to `[skills-validate] Results: N passed, N failed` per test-output-format standard (SC-04).
- **Performance:** CI job must complete in under 60 seconds for features with ≤10 stories (A3 performance assumption from discovery).
- **No external npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

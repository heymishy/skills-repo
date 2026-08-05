## Story: Optionally install the full outer loop during bootstrap

**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e2-saas-connected-bootstrap-and-outer-loop.md
**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Domain:** None identified — checked against `.github/standards/index.yml`.

## User Story

As an **engineering-capable evaluator or SaaS-hosted consumer who has just bootstrapped a repo**,
I want to **optionally enable the full outer loop (discovery through DoD) in the same bootstrap step**,
So that **I can run future feature cycles entirely locally, not just the one inner-loop run that triggered the bootstrap**.

## Benefit Linkage

**Metric moved:** Fork/clone avoidance rate among new adopters
**How:** An adopter who converts to a git-native repo but then hits the same fork/clone wall for their *second* feature has only solved the problem once; making the outer loop an explicit opt-in at bootstrap time removes that wall permanently, strengthening the case for using the init command at all.

## Architecture Constraints

- Reads the registry from `rb-s2` to determine which skills are `outer-loop` — no separate hardcoded list of outer-loop skills in this story's own logic (single source of truth, matching ADR-004's spirit).
- **None identified beyond the registry dependency** — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** rb-s2 (registry must exist to know what "outer loop" means); rb-s1 and rb-s4 (both entry points this flag applies to)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a user runs the init command with an explicit outer-loop opt-in flag (e.g. `--with-outer-loop`) against a fresh directory, When the command completes, Then every skill the registry categorizes as `outer-loop` is present and runnable, in addition to the inner-loop and ancillary skills already installed by default.

**AC2:** Given a user runs the SaaS-connected bootstrap (`rb-s4`) without the opt-in flag, When the command completes, Then only inner-loop and ancillary skills are installed — matching the default behaviour stated in discovery MVP scope (inner-loop-only is the default for the SaaS-connected path).

**AC3:** Given a user runs the SaaS-connected bootstrap (`rb-s4`) *with* the opt-in flag, When the command completes, Then outer-loop skills are additionally installed on top of the fetched DoR-approved artefact — the flag behaves identically regardless of which entry point (fresh or SaaS-connected) it's combined with.

**AC4:** Given the opt-in flag was not used at initial bootstrap, When the user later wants the outer loop, Then the command documents that re-running init in "add-on" mode (not full re-bootstrap) is the supported path — it does not require discarding and redoing the entire bootstrap from scratch.

## Out of Scope

- Any mechanism for *removing* the outer loop after it's been installed — not requested, not needed for MVP.
- The underlying outer-loop skills' own behaviour — this story only concerns whether they're installed, not their content or governance rules.

## NFRs

- **Performance:** Enabling the flag adds no more than 3 seconds versus the default inner-loop-only install, since it's copying already-materialized files from the same registry-driven skill set.
- **Security:** None identified beyond what `rb-s1`/`rb-s4` already cover.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable at this story's scope.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

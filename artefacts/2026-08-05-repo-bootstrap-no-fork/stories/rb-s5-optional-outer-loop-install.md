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
- **Revised at implementation time (2026-08-06), see `decisions.md`:** the flag controls an *enablement signal*, not file presence. `rb-s2`'s AC1 ("the target directory contains the platform's complete current skill set... not a subset or placeholder") is an unconditional, already-shipped guarantee — every skill file, outer-loop included, is always present on disk regardless of this flag. `--with-outer-loop` instead writes `outerLoop.enabled: true|false` to the bootstrapped `context.yml`, and the harness-agnostic instruction file's (`rb-s3`) session-start section reflects that flag when listing which skills are presented as active outer-loop tooling versus installed-but-not-yet-enabled. This avoids any conflict with `rb-s2`'s already-tested guarantee and does not require touching `rb-s2`'s or `rb-s3`'s already-shipped file-copy behaviour.
- **None identified beyond the registry dependency** — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** rb-s2 (registry must exist to know what "outer loop" means); rb-s1 and rb-s4 (both entry points this flag applies to); rb-s3 (the instruction file this story's enablement signal is reflected in)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a user runs the init command with an explicit outer-loop opt-in flag (e.g. `--with-outer-loop`) against a fresh directory, When the command completes, Then `context.yml` contains `outerLoop.enabled: true`, and the generated instruction file's session-start section lists every `outer-loop`-categorized skill as active/available — in addition to the inner-loop and ancillary skills already presented by default. Every skill file (outer-loop included) is present on disk regardless of the flag, per `rb-s2`'s unconditional AC1.

**AC2:** Given a user runs either bootstrap path without the opt-in flag, When the command completes, Then `context.yml` contains `outerLoop.enabled: false` (or the field is absent, defaulting to false), and the generated instruction file's session-start section does not present outer-loop skills as active tooling — it names them as installed but not yet enabled, with the exact flag needed to enable them. All skill files, including outer-loop ones, remain present on disk (matching `rb-s2`'s AC1) — this AC concerns what's presented as *active*, not what's *installed*.

**AC3:** Given a user runs the SaaS-connected bootstrap (`rb-s4`) *with* the opt-in flag, When the command completes, Then the same `outerLoop.enabled: true` signal and instruction-file presentation apply — the flag behaves identically regardless of which entry point (fresh or SaaS-connected) it's combined with.

**AC4:** Given the opt-in flag was not used at initial bootstrap, When the user later wants the outer loop enabled, Then re-running init with just `--with-outer-loop` (no `--force`, no full re-bootstrap) flips `outerLoop.enabled` to `true` in the existing `context.yml` and regenerates the instruction file's session-start section — it does not require discarding and redoing the entire bootstrap, and does not touch any already-bootstrapped file `rb-s1`'s AC3 already protects from overwriting.

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

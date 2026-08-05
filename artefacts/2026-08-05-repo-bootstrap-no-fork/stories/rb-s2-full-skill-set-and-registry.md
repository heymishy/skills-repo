## Story: Install the full skill set with a lightweight outer/inner/ancillary registry

**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Domain:** None identified — checked against `.github/standards/index.yml`.

## User Story

As an **engineering-capable evaluator**,
I want to **have the init command materialize the platform's complete skill set alongside a manifest that declares which skills are outer-loop, inner-loop, or ancillary**,
So that **I (and my tooling) know what's runnable and relevant right after bootstrap, without the init command needing conditional install logic per skill**.

## Benefit Linkage

**Metric moved:** Bootstrap-to-first-inner-loop-run time
**How:** A developer who only sees a partial or unlabelled skill set has to work out what's usable by trial and error, adding time before their first real inner-loop run; a complete, categorized set removes that guesswork.

## Architecture Constraints

- **ADR-004** (`context.yml` is the single config source of truth) — the registry is a new, separate manifest file (not folded into `context.yml`), following the existing convention of dedicated config files (`context.yml`, `pipeline-state.json`) rather than overloading one file with unrelated concerns.
- **ADR-011** (Artefact-first rule) — this story itself needs this definition artefact before merge, which this /definition pass provides.
- **Reuse, not reimplementation (ASSUMPTION-invalidated, see `decisions.md` 2026-08-05):** `platform-init.js`'s existing `COPY_DIRS` already includes the whole `scripts/` directory, which means `platform-fetch.js`, `platform-pin.js`, and `platform-verify.js` already travel into every bootstrapped repo automatically, as a side effect of `rb-s1`'s wrapping of the existing script. This story does not need to build fetch/pin/verify from scratch — it only adds the registry manifest on top of what `rb-s1` already materializes.

## Update-sync clarification (supersedes discovery's original framing)

Discovery's Out of Scope originally deferred "ongoing update-sync" on the assumption no such mechanism existed. It does — `platform:fetch`/`platform:pin`/`platform:verify` already implement it locally, and travel into the bootstrapped repo for free per the constraint above. What remains genuinely out of scope for this feature is narrower: making `platform:fetch` resolve its source against a *published npm package version* (for an `npx`-only consumer with no local `PLATFORM_ROOT`) rather than a local directory path — that npm-specific extension is deferred, not the update mechanism itself.

## Dependencies

- **Upstream:** rb-s1 (the init command must exist before this story can extend it)
- **Downstream:** rb-s3 (harness-agnostic instructions) reads the same skill set this story materializes; rb-s5 (optional outer-loop install) reads the registry this story creates to decide what to additionally enable.

## Acceptance Criteria

**AC1:** Given a fresh init run, When the command completes, Then the target directory contains the platform's complete current skill set (every skill under `skills/` in the upstream repository at the published package's pinned version), not a subset or placeholder.

**AC2:** Given the materialized skill set, When a developer or tool reads the registry manifest, Then it lists every skill with an explicit category of exactly one of `outer-loop`, `inner-loop`, or `ancillary`, matching the pipeline diagram's own step groupings in `CLAUDE.md`.

**AC3:** Given the registry manifest exists, When the init command is later extended to add a new skill category (e.g. a future `programme-track` grouping), Then adding that category requires only a registry entry change — no change to the init command's file-copying logic.

**AC4:** Given a developer inspects the registry after bootstrap, When they cross-reference it against the pipeline diagram in the bootstrapped repo's own instruction file, Then every `outer-loop` and `inner-loop` category in the registry corresponds to a step named in that diagram — no orphaned or unlabelled skill.

## Out of Scope

- Harness-agnostic instruction file generation — `rb-s3`.
- Making `platform:fetch`/`platform:pin`/`platform:verify` resolve their source against a published npm package version instead of a local directory path — the scripts themselves already exist and already travel with every bootstrapped repo; only the npm-specific source-resolution extension is deferred (see Update-sync clarification above).

## NFRs

- **Performance:** Materializing the full skill set adds no more than 5 seconds to the init command's total run time versus the minimal set shipped in `rb-s1`.
- **Security:** None identified beyond what `rb-s1` already covers.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable at this story's scope.

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

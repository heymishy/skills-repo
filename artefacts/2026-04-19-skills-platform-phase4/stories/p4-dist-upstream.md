## Story: Upstream authority configuration from context.yml

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **ensure that every distribution command reads the upstream source URL exclusively from `.github/context.yml`'s `skills_upstream` block — never from a hardcoded path or a different configuration mechanism**,
So that **consumers can switch or override the upstream source by editing a single, well-known file, and the distribution model has no hidden hardcoded dependencies on `heymishy/skills-repo`'s URL**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** The upstream authority decision from Spike C has no implementation value unless the distribution commands enforce ADR-004 — reading the upstream source from context.yml, not from a hardcoded URL. Without this story, a consumer who adopts from a productisation fork of the platform cannot configure their own upstream source, which blocks Craig's and Thomas's teams from customising the upstream to their organisation's fork if the platform is productised.

## Architecture Constraints

- ADR-004: this story's primary constraint is ADR-004 — the `skills_upstream` block in `.github/context.yml` is the sole authoritative config source for the upstream URL; no command-line flag, environment variable, or config file other than context.yml may specify a different upstream source
- C5: the upstream content is hash-verified on fetch — the upstream source may be authoritative, but content fetched from it is still verified against the lockfile hashes; a source that changes content without changing the pinned ref must produce a verify failure, not a silent pass
- MC-CORRECT-02: the `skills_upstream` block schema (fields: `repo`, `remote`, `sync_paths`, `strategy`) must be validated against the declared context.yml schema at command startup; an invalid or missing schema entry produces a named error before the network is contacted

## Dependencies

- **Upstream:** p4.spike-c must have a verdict specifying the `skills_upstream` schema and the upstream authority decision
- **Downstream:** p4.dist-upgrade, p4.dist-migration, p4.dist-registry all depend on a correctly configured upstream source; without this story, they have no authoritative URL to read

## Acceptance Criteria

**AC1:** Given `.github/context.yml` contains a valid `skills_upstream.repo` entry (e.g. `https://github.com/heymishy/skills-repo.git`), When any distribution command that requires an upstream (`fetch`, `pin`, `upgrade`) runs, Then the command uses exactly the URL from `skills_upstream.repo` — no hardcoded fallback URL is used if the context.yml entry is present.

**AC2:** Given `skills_upstream.repo` is absent or empty in `.github/context.yml`, When any command that requires an upstream runs, Then the command exits with a non-zero status and an error message: "No upstream source configured — set skills_upstream.repo in .github/context.yml" before attempting any network request.

**AC3:** Given the upstream source is changed in `.github/context.yml` from URL A to URL B, When `skills-repo fetch` is run with the new config, Then the command fetches from URL B and records URL B in the updated lockfile's `upstreamSource` field — the lockfile is updated to reflect the config change.

**AC4:** Given a governance check (`npm test`) runs against the implementation, When `check-approval-adapters.js` or an equivalent check validates ADR-004 compliance, Then the check confirms that no distribution command file contains a hardcoded URL matching `github.com/heymishy` or any other skills-repo URL outside a test fixture.

## Out of Scope

- Configuring multiple upstream sources per consumer repo — single upstream is the Phase 4 MVP; consumers who need multi-source distribution must wait for Phase 5
- Publishing infrastructure at the upstream source — Phase 4 assumes the upstream source is accessible; setting up CI/CD to publish tagged releases is a separate operational concern
- Supporting non-git upstream sources (npm registry, S3 bucket) — Phase 4 MVP supports git-hosted upstream only

## NFRs

- **Security:** Upstream URL must be treated as an opaque user-supplied string — no URL validation that resolves DNS or makes speculative network calls (MC-SEC-02); the URL is only contacted when a distribution command is explicitly invoked
- **Audit:** ADR-004 compliance verified by `npm test` governance check — a hardcoded URL in a distribution command file fails the check
- **Performance:** Config read adds at most 5 milliseconds to command startup

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — ADR-004 compliance is a well-defined implementation constraint with no ambiguity once the context.yml schema is decided by Spike C

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upstream.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 4 |
| intermediates_produced | 11 |

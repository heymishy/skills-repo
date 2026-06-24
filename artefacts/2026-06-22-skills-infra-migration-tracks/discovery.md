# Discovery: Skills Infrastructure and Schema-Migration Pipeline Tracks

**Status:** Approved
**Feature slug:** skills-infra-migration-tracks
**Date:** 2026-06-22
**Skill version:** /discovery

---

## Problem statement

The current pipeline covers code delivery end-to-end — discovery through DoD. It has no corresponding structured track for two categories of change that accompany most feature deliveries and carry their own, distinct risk profile:

**P1 — Infrastructure changes are invisible to the pipeline.** When a feature requires a new service, a changed resource configuration, a secrets rotation, or a network rule change, there is no artefact type for the plan, no blast-radius classification, no explicit rollback plan requirement, no tier-applicability statement (local dev vs. production), and no chain-hash trace linking the infra change to the feature story that motivated it. Operators produce infra plans in tool-specific formats (Terraform plan files, Pulumi previews, CDK diff output, or hand-written runbooks) and attach them to PRs ad-hoc. The pipeline cannot audit them.

**P2 — Schema migrations are unclassified and rollback paths are unverified.** When a feature adds a database column, renames a field, or changes an index, there is no artefact distinguishing additive-only from breaking changes, no required forward/rollback pair, and no record of which tier (CI ephemeral, staging snapshot, production) the migration has been tested against. Migrations are one of the highest-risk delivery artefacts (data loss, cascading failures on rollback, schema drift between tiers) yet they receive less structured review than a four-line story update.

**P3 — The DoR gate lacks mandatory rollback and blast-radius fields for both categories.** The current DoR hard-block checklist (H1–H9, H-E2E, H-NFR through H-NFR3) does not require a rollback plan or blast-radius statement before sign-off on stories that carry infra or migration changes. An operator running `/definition-of-ready` today on a story that replaces a managed database has no mandatory gate preventing sign-off without a tested rollback.

**P4 — Environment tiers are undeclared in delivery artefacts.** There are four meaningful tiers in this repo's deployment topology: local dev (docker-compose with Postgres/Redis containers), test/CI (ephemeral testcontainers-style, destroyed post-run), staging (real Fly/Fargate tier, persistent, requires snapshot privacy design), and production (managed Postgres/Redis, real tenant data). No current artefact type declares which tier(s) a plan, migration, or test applies to. An infra change that has been validated only on local dev but not on staging is indistinguishable in the pipeline from one that has been fully tier-validated.

---

## Codebase verification — what exists today

The following was confirmed by reading `src/web-ui/modules/journey-store.js` and `src/web-ui/routes/journey.js` before producing this artefact.

### STAGE_SEQUENCE (confirmed in journey-store.js lines 7–16)

```
ideate → discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready
```

This is a flat, ordered array. There is no concept of a parallel track, a conditional branch, or an optional track extension point in the current data model. `STAGE_META` in `journey.js` mirrors this sequence as a display list (lines 67–76).

The journey object (created by `createJourney()`) has `activeSkill`, `completedStages`, and `sessions` fields but no track field, no multi-track state, and no per-track completed stages. A journey currently models exactly one skill sequence.

### What is NOT in the codebase

- No `infra-definition`, `infra-review`, `infra-plan`, or `schema-migration-*` SKILL.md files exist under `skills/`.
- No DoR hard-block for rollback plan or blast-radius statement.
- No template fields for forward/rollback migration pair, tier applicability, or additive-vs-breaking classification.
- No chain-hash trace linkage for infra or migration artefacts (trace emits only on DoR gate-confirm for code stories).

### What exists and is reusable

- Chain-hash trace infrastructure (`src/enforcement/gate-map.js`, `_writeTrace` adapter in `journey.js`) — can be extended to infra and migration gate-confirms.
- Injectable adapter pattern (`set<Name>()` / throw-by-default stubs) — already established; new skills should follow it.
- Artefact path convention (`artefacts/YYYY-MM-DD-[feature-slug]/[sub-dir]/`) — applies unchanged.
- SHA-256 artefact history in `pipeline-state.json` — extends naturally to new artefact types.
- DoR contract proposal format (Step 2 in definition-of-ready SKILL.md) — reusable for infra DoR with extended fields.

---

## Personas

**P-Founder** — Solo founder/operator running the full pipeline. Must be able to produce a complete infra plan and schema migration plan, run them through review, and reach DoR gate without requiring a separate DevOps or DBA function. Every artefact type and review checklist must be operable solo.

**P-Agent** — The coding agent (inner loop) that receives DoR instructions and executes implementation. The agent will need to distinguish which tasks are infra tasks vs. code tasks vs. migration tasks and apply the appropriate sub-sequence. This is the primary consumer of the DoR coding agent instructions block.

**P-Auditor** — Future operator or regulator reading the artefact chain. Needs to trace an infra or migration change from the motivating story through the plan artefact to the gate-confirm. Must not need to open tool-specific CLI output files to understand what changed and why.

---

## MVP scope

### What is in scope

**Track 1 — Infra track (three new skills)**

A parallel, optional track that can be attached to any feature story or run standalone for infra-only changes.

| Step | Skill | Output artefact | Entry condition |
|------|-------|-----------------|-----------------|
| 1 | `infra-definition` | `infra/[story-id]-infra-def.md` | Story artefact approved or standalone infra need identified |
| 2 | `infra-review` | `infra/[story-id]-infra-review.md` | Infra definition artefact exists; plan/preview artefact attached |
| 3 | `infra-plan` | `infra/[story-id]-infra-plan.md` | Infra review passed (no HIGH findings) |

The `infra-definition` artefact must include: change description, blast-radius statement (which tiers are affected and how), rollback plan (manual steps, estimated time), tier applicability (which of local/CI/staging/production the plan has been validated against at DoR time), and tool-agnostic plan/preview attachment (a text export of the tool's diff output, or a hand-written runbook — no tool lock-in).

`infra-review` is a new SKILL.md that consumes the `infra-definition` artefact and the attached plan/preview, not story ACs. Its checklist differs from `/review`: blast-radius plausible, rollback plan testable, tier applicability declared and coherent, no hardcoded secrets, no destructive operations without explicit Proceed: Yes gate.

`infra-plan` is the signed-off artefact confirming the reviewed infra change is ready for execution at each tier. It is the infra equivalent of the DoR sign-off document.

**Track 2 — Schema-migration track (two new skills)**

A parallel, optional track for any database schema change, whether Postgres, Redis key structure, or structured file format.

| Step | Skill | Output artefact | Entry condition |
|------|-------|-----------------|-----------------|
| 1 | `schema-migration-plan` | `migrations/[story-id]-migration-plan.md` | Story artefact approved, migration need identified |
| 2 | `schema-migration-review` | `migrations/[story-id]-migration-review.md` | Migration plan exists; forward+rollback pair attached |

The `schema-migration-plan` artefact must include: classification (additive-only vs. breaking — defined below), forward migration (the change SQL/command), rollback migration (the undo SQL/command — mandatory even for additive-only), tier applicability (which tiers have been tested before production), and staging snapshot privacy decision (see OQ2).

Classification definitions:
- **Additive-only**: adds columns/tables with defaults or nullable; existing queries unaffected; rollback does not require data removal. Lower risk; can deploy without application-version coordination if default is safe.
- **Breaking**: renames, removes, or changes the type of an existing column/table/index; or adds a NOT NULL column without a default. Requires application-version coordination and a tested rollback that handles data removal or type coercion.

`schema-migration-review` checks: classification matches the actual change, forward migration has been tested on at least CI tier, rollback migration has been tested on at least CI tier, staging snapshot privacy approach declared, no production-only test required for sign-off (staging mirror is sufficient).

**DoR hard-block extension (two new blocks)**

Add to the existing `definition-of-ready` SKILL.md hard-block checklist:

- **H-INF**: If the story has an attached infra definition, an `infra-plan` sign-off artefact must exist and show PASS before DoR can proceed.
- **H-MIG**: If the story has an attached migration plan, a `schema-migration-review` artefact must exist and show PASS, forward+rollback pair must be present, and classification must be declared before DoR can proceed.

These blocks are opt-in (triggered only when the story claims infra or migration changes). Stories with no infra/migration impact are unaffected.

**Environment tier topology (first-class constraint in all new artefacts)**

Every infra and migration artefact must include a `## Tier applicability` section that maps the artefact to one or more of:

| Tier | Infrastructure | Lifecycle |
|------|---------------|-----------|
| `local` | docker-compose; Postgres and Redis containers | Developer-local, destroyed between dev sessions |
| `ci` | Ephemeral testcontainers-style; destroyed post-run | Per-CI-run |
| `staging` | Real Fly/Fargate tier; persistent; staging snapshot | Long-lived; requires snapshot privacy approach |
| `production` | Managed Postgres/Redis; real tenant data | Permanent; change gate required |

Infra and migration plans must state: "Validated on [tier list]. NOT yet validated on [remaining tier list] — validation required before production deployment." This is a required field, not optional prose.

**Chain-hash trace extension**

The `_writeTrace` adapter currently fires on DoR gate-confirm for code stories. Extend to fire on `infra-plan` sign-off and `schema-migration-review` sign-off. This links the infra and migration artefacts into the same audit chain as the code story that motivated them.

### What is NOT in scope

- Tooling integrations (Terraform provider, CDK plugin, Alembic, Flyway CLI) — the platform is tool-agnostic; artefacts attach plan output as text, not structured tool data.
- Automated migration execution or rollback execution — the platform validates and governs; operators execute.
- Staging snapshot provisioning or data anonymisation tooling — this is infrastructure work; the platform only requires that the privacy approach be declared in the artefact.
- Web UI journey changes for new track types — the STAGE_SEQUENCE does not change; infra and migration tracks are run as standalone skill sessions or attached to an existing feature journey's story context. Multi-track journey UI support is a future feature (see OQ1).
- Automated classification enforcement (e.g. a linter that detects breaking schema changes) — the classification is operator-declared and reviewer-validated, not tool-enforced.

---

## Success indicators

1. An operator can run `/infra-definition`, `/infra-review`, and `/infra-plan` against a story and produce a fully auditable infra change artefact chain in under 30 minutes, solo.
2. Running `/definition-of-ready` on a story that claims infra or migration changes and lacks the required artefacts produces a hard block (H-INF or H-MIG) — not a warning, not optional.
3. Running `/trace` on a feature that includes infra or migration track sign-offs reports those artefacts in the chain (not a gap).
4. The staging snapshot privacy approach is declared in every `schema-migration-plan` artefact — the field is mandatory, not "see operator judgement".

---

## Constraints

**C1 — Single-founder operable.** Every new skill checklist must be completable by one person with access to the deployment environment. No checklist step may require a separate human approver, DBA, or security officer by default. Org-mapping overrides are available for regulated contexts but the default path must be solo-operable.

**C2 — Tool-agnostic.** Artefacts attach plan output as text (plan file export, `terraform plan -out=plan.txt`, CDK diff output, Alembic downgrade SQL, hand-written runbook). No tool-specific fields, no tool-specific SKILL.md branches, no CLI tool assumed present on the reviewer's machine.

**C3 — No STAGE_SEQUENCE change.** `STAGE_SEQUENCE` in `journey-store.js` must not be modified as part of this feature. Infra and migration tracks run as skill sessions that are either standalone or contextually attached to an existing feature; they do not appear as new stages in the main sequence. Web UI multi-track support is out of scope.

**C4 — Existing audit mechanisms extend, not replace.** Chain-hash trace, SHA-256 artefact history, gate-map, and gate-advance harness all extend to cover new artefact types. No parallel audit mechanism.

**C5 — No new required env vars or platform dependencies.** New skills must be runnable with the current CLAUDE.md + context.yml setup. If a new env var is introduced, it must have a safe default (the feature degrades gracefully, not fails).

**C6 — Path-traversal guards on all new disk writes.** All new route handlers or skill handlers that write artefacts to disk must implement the `path.resolve` + `startsWith(repoRoot + path.sep)` guard. This is non-negotiable per the existing coding standard (ougl path-traversal guard).

**C7 — DoR extension is additive.** H-INF and H-MIG are new blocks that fire only when the story flags infra or migration changes. All existing H1–H9, H-E2E, H-NFR blocks are unchanged. No regression to existing DoR behaviour.

---

## Assumptions

1. The staging environment is Fly.io or Fargate (real platform tier, not local). A staging database snapshot is available or can be provisioned from production with anonymisation. The privacy approach (synthetic data vs. anonymised production snapshot) is a per-team policy decision, not a platform decision — the platform requires the approach to be declared, not enforced.
2. The infra and migration skills are used for changes to the skills-repo platform itself (this repo) and for any downstream product repo that adopts the skills pipeline. The SKILL.md files are general-purpose, not skills-repo-specific.
3. Operators already have the relevant CLI tool available locally when they produce plan/preview output to attach. The platform does not invoke CLI tools itself.
4. Breaking schema migrations that are deployed to staging before production are the norm, not the exception. Staging validation is the minimum acceptable tier for a breaking migration before production sign-off.
5. `pipeline-state.json` field additions for infra and migration track state are additive (new optional fields on existing story entries) — not a schema version bump or file split.

---

## Open questions

**OQ1 — Multi-track journey UI support:** Should the web UI journey model be extended to show infra and migration tracks as first-class panels alongside the code track? Currently a journey models one skill sequence. Showing parallel tracks in the UI would require changes to STAGE_SEQUENCE display, journey creation, and the stage progress dots. This is out of scope for this discovery — flag for a follow-on feature.

**OQ2 — Staging snapshot privacy policy:** The artefact requires a declared approach (synthetic vs. anonymised production snapshot). Should the platform provide a `staging-data-policy.md` template with a default recommendation, or leave the declaration entirely free-form? A template would give solo founders a starting point; free-form avoids imposing a model. Recommend: provide a minimal template with three named options (synthetic generated data, anonymised snapshot via tool X, subset of non-PII production data) and a declared choice field. Operators choose one and document the tool/process used.

**OQ3 — Rollback test evidence requirement:** Should `schema-migration-review` require evidence that the rollback has been executed (e.g., a log snippet or CI test result), or is a declared rollback script sufficient at review time? Requiring execution evidence is stronger but more friction for solo founders. Recommend: CI-tier execution evidence required for breaking migrations; declaration only acceptable for additive-only.

**OQ4 — Infra-review blast-radius severity scale:** Should `infra-review` use the same HIGH/MEDIUM/LOW finding system as `/review`, or a different scale that reflects infra-specific risk (e.g. reversible/irreversible, blast radius scope: single tenant / all tenants / platform infrastructure)? Recommend: introduce a parallel infra-specific severity: `DESTRUCTIVE` (hard block, irreversible data or service loss), `REVERSIBLE-HIGH` (hard block, reversible but high impact), `ADVISORY` (warning, proceed with acknowledgement). This is distinct from and does not conflict with the code review finding severity scale.

**OQ5 — `pipeline-state.json` story flag for infra/migration:** How should a story declare that it has an infra or migration component? Options: (a) a boolean flag on the story entry (`hasInfraTrack: true`, `hasMigrationTrack: true`), (b) a list of attached artefact paths, (c) a free-form tag array. Recommend: boolean flags (option a) — simplest for harness validation and for H-INF/H-MIG gate checks.

**OQ6 — Standalone infra changes (no parent story):** Can an infra plan be produced without a parent story? For example, a secrets rotation or a firewall rule change that is not attached to a feature delivery. The current pipeline assumes every artefact has a parent feature slug. Recommend: allow standalone infra journeys by supporting a feature slug of `ops/YYYY-MM-DD-[change-slug]` — a new path prefix that signals an operational change, not a feature delivery. This requires no STAGE_SEQUENCE change but does require the artefact path convention to accommodate the `ops/` prefix.

**OQ7 — Additive migration deployment order:** For additive-only migrations (new nullable column), should the migration run before or after the application deployment in the default runbook? Recommend: migration before application deployment (expand-then-contract pattern), since additive columns are invisible to the old application version and the new application can rely on them immediately after deploy. This should be stated as a default in the `schema-migration-plan` template rather than left to operator discretion.

---

## Story breakdown

### Infra track (5 stories)

**inf.1 — `infra-definition` SKILL.md**
Write the `infra-definition` skill with: artefact template, blast-radius statement, rollback plan section, tier applicability table, plan/preview attachment section.
Entry condition: story artefact exists (or standalone ops change).
Output: `artefacts/[feature]/infra/[story-id]-infra-def.md`.

**inf.2 — `infra-review` SKILL.md**
Write the `infra-review` skill with: DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale, blast-radius plausibility check, rollback testability check, tier applicability coherence check, secrets/hardcoded values check, destructive operation gate.
Entry condition: `infra-definition` artefact exists.
Output: `artefacts/[feature]/infra/[story-id]-infra-review.md`.

**inf.3 — `infra-plan` SKILL.md**
Write the `infra-plan` skill (sign-off skill): confirms infra-review passed, declares final tier sequence (which tier to execute first, when to stop for validation), produces the operator execution checklist.
Entry condition: `infra-review` shows no DESTRUCTIVE or REVERSIBLE-HIGH findings, or all findings acknowledged.
Output: `artefacts/[feature]/infra/[story-id]-infra-plan.md`.

**inf.4 — DoR hard-block H-INF**
Extend `definition-of-ready` SKILL.md: add H-INF block that fires when story `hasInfraTrack: true`. Checks: `infra-plan` sign-off artefact exists and shows PASS. Hard block if missing.

**inf.5 — Chain-hash trace extension for infra-plan**
Extend `_writeTrace` call site to emit a trace event on `infra-plan` sign-off. Infra artefact path included in the trace chain alongside code artefact paths. Extend `/trace` skill output to report infra artefacts in the chain.

### Schema-migration track (5 stories)

**mig.1 — `schema-migration-plan` SKILL.md**
Write the schema-migration-plan skill with: additive-vs-breaking classification, forward migration field, rollback migration field (mandatory), tier applicability table, staging snapshot privacy declaration field.
Entry condition: story artefact approved, migration need identified.
Output: `artefacts/[feature]/migrations/[story-id]-migration-plan.md`.

**mig.2 — `schema-migration-review` SKILL.md**
Write the schema-migration-review skill: checks classification matches change, forward migration tested on CI tier, rollback migration tested on CI tier (with evidence for breaking), staging snapshot privacy declared, no production-only test required at sign-off.
Entry condition: `schema-migration-plan` exists.
Output: `artefacts/[feature]/migrations/[story-id]-migration-review.md`.

**mig.3 — DoR hard-block H-MIG**
Extend `definition-of-ready` SKILL.md: add H-MIG block that fires when story `hasMigrationTrack: true`. Checks: `schema-migration-review` artefact exists and shows PASS, classification declared, forward+rollback pair present. Hard block if missing.

**mig.4 — Chain-hash trace extension for schema-migration-review**
Extend `_writeTrace` to emit on `schema-migration-review` sign-off. Migration artefact path included in trace chain. `/trace` output reports migration artefacts.

**mig.5 — `staging-data-policy` template**
Write `templates/staging-data-policy.md`: three named options (synthetic generated data, anonymised snapshot, non-PII production subset), declared choice field, tool/process documentation field. Referenced by `schema-migration-plan` when staging tier is in scope.

### Shared infrastructure (2 stories)

**shr.1 — `pipeline-state.json` schema extension**
Add optional boolean flags `hasInfraTrack` and `hasMigrationTrack` to the story entry schema in `check-pipeline-state-integrity.js`. Add corresponding optional fields `infraPlanPath`, `migrationReviewPath` for artefact path recording. Update `harness/advance` to support these fields.

**shr.2 — OQ6 standalone ops change path**
Extend artefact path convention to support `ops/YYYY-MM-DD-[change-slug]` as a valid feature slug prefix. Update `check-pipeline-state-integrity.js` validation to accept `ops/` prefix. Confirm path-traversal guard still holds for ops-prefixed paths (resolves within repoRoot).

---

## Delivery sequencing

The infra and migration tracks are independent and can be developed in parallel. The recommended sequencing within each track is sequential (definition → review → plan/review sign-off → DoR extension → trace extension) because each skill SKILL.md is the input to the next.

The shared infrastructure stories (shr.1, shr.2) should land before any skills that read `hasInfraTrack` or `hasMigrationTrack` from `pipeline-state.json`.

DoR extension stories (inf.4, mig.3) land last — after both the track skills and the trace extensions are in place. This ensures the H-INF and H-MIG hard blocks can actually validate the artefacts they check.

```
shr.1 (schema extension) ──► inf.1 ──► inf.2 ──► inf.3 ──► inf.5 ──► inf.4 (DoR H-INF)
                          └──► mig.1 ──► mig.2 ──► mig.4 ──► mig.3 (DoR H-MIG)
shr.2 (ops path) ──► independent, can land any time before first standalone ops run

mig.5 (staging-data-policy template) ──► parallel with mig.1, referenced at first use
```

---

## Attribution

Operator: Hamish King
Discovery date: 2026-06-22

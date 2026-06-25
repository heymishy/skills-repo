# /schema-migration-plan

Produce a schema-migration-plan artefact for a story that involves a database schema change. `/schema-migration-plan` is the planning gate that records the migration intent, classification, rollback approach, and staging privacy declaration before execution or review. The artefact at `artefacts/[feature]/migrations/[story-id]-migration-plan.md` is the required input to `/schema-migration-review`.

## When to invoke

Invoke `/schema-migration-plan` after the story's implementation plan is agreed and before any schema change is applied to a non-local environment. The plan must be committed and reviewed before staging or production execution.

## Migration classification

Every migration must be classified as one of two types. The operator declares the classification; the planning skill does not auto-detect it.

### Breaking migrations

A migration is **breaking** when any of the following are true:

- Renames a column or table (without a compatibility alias in place for the transition window)
- Drops a column or table
- Changes a column type (ALTER COLUMN TYPE or equivalent)
- Adds a NOT NULL constraint to an existing column without a safe default
- Removes or narrows a unique constraint or index that application code depends on
- Any statement that removes or truncates data, or tightens constraints on existing rows

Breaking migrations require CI-tier rollback execution evidence before `/schema-migration-review` can reach PASS (see rollback evidence requirement below).

### Additive-only migrations

A migration is **additive-only** when all statements are safe to apply without application downtime:

- Adds a nullable column to an existing table
- Creates a new table with safe defaults
- Adds a new index (non-blocking build)
- Adds a new enum value at the end of an enum type
- Any statement that adds data or structure without modifying or removing existing rows or columns

Additive-only migrations do not require CI-tier rollback execution for review to PASS — a declaration is sufficient (see rollback evidence requirement below).

## Mandatory fields

Every migration plan artefact must contain all five sections below. A blank or missing section blocks the plan from proceeding to review.

### 1. Classification

Declare `breaking` or `additive-only` with a one-sentence rationale. If the migration contains a mix of breaking and additive statements, classify it as `breaking`.

### 2. Forward migration

The forward migration command or SQL statements to apply the change. Write as a fenced code block or as numbered steps.

> ⚠️ **Warning:** Do not paste production connection strings, passwords, credentials, tokens, or secrets into this field. This artefact is committed to the repository. Use placeholder names (e.g. `$DB_URL`) for any environment-specific values.

### 3. Rollback migration

The rollback command or SQL statements to reverse the forward migration. **Rollback is mandatory for all classifications** — including additive-only. A blank rollback field blocks the plan.

- **Breaking migrations:** the rollback must be executable. If the rollback itself cannot be executed without data loss, document the recovery procedure in full.
- **Additive-only migrations:** a declaration is sufficient — "Rollback command declared and reviewed — not yet executed on CI."

If the classification is `breaking` and the rollback field is blank, the operator must provide a rollback before the plan is saved.

### 4. Tier applicability

A table recording which tiers this migration will be applied to and the validation status for each.

| Tier | In scope? | Validation status |
|------|-----------|-------------------|
| local | Yes / No | Not started / In progress / Passed / Not applicable |
| ci | Yes / No | Not started / In progress / Passed / Not applicable |
| staging | Yes / No | Not started / In progress / Passed / Not applicable |
| production | Yes / No | Not started / In progress / Passed / Not applicable |

Update the `Validation status` column as each tier is executed and validated.

### 5. Staging snapshot privacy declaration

**Applies when staging tier is in scope** (i.e., the tier-applicability table marks staging as "Yes").

The staging-snapshot-privacy field must not be blank or marked "TBD". Populate it by completing a `staging-data-policy.md` (template at `.github/templates/staging-data-policy.md`) and recording the declared choice here.

If staging is not in scope, mark this section "Not applicable — staging tier excluded."

## Artefact output path

Save the completed artefact at:

```
artefacts/[feature]/migrations/[story-id]-migration-plan.md
```

Where `[feature]` is the feature slug (e.g. `2026-06-22-my-feature`) and `[story-id]` is the story identifier (e.g. `db.1`).

## Artefact template

```markdown
# Schema Migration Plan: [migration title]

**Story:** [story-id]
**Feature:** [feature slug]
**Date:** [YYYY-MM-DD]
**Classification:** breaking / additive-only

---

## 1. Classification

**Classification:** [breaking / additive-only]
**Rationale:** [one sentence]

---

## 2. Forward migration

> ⚠️ Warning: do not paste production credentials, connection strings, passwords, tokens, or secrets here.

[Forward migration command or SQL — fenced code block or numbered steps]

---

## 3. Rollback migration

[Rollback command or SQL — or declaration: "Rollback command declared and reviewed — not yet executed on CI."]

---

## 4. Tier applicability

| Tier | In scope? | Validation status |
|------|-----------|-------------------|
| local | | |
| ci | | |
| staging | | |
| production | | |

---

## 5. Staging snapshot privacy declaration

[Declared choice from staging-data-policy.md — or "Not applicable — staging tier excluded."]

**Reference:** [path to completed staging-data-policy.md, or "N/A"]
```

## Tool-agnostic stance

This skill does not prescribe which migration toolchain the operator uses. All fields accept any tool format — SQL statements, CLI commands, or descriptive steps. The field labels describe what to provide, not which command to run.

## State update — mandatory final step

After the artefact is saved and committed, record its path in the story's pipeline-state entry:

```
node bin/skills advance [feature-slug] [story-id] migrationPlanPath=artefacts/[feature]/migrations/[story-id]-migration-plan.md
```

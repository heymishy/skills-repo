# /schema-migration-review

Review a schema-migration-plan artefact for rollback evidence, staging snapshot privacy declaration, and classification coherence. `/schema-migration-review` is the enforcement gate between migration planning and sign-off. A PASS artefact (`artefacts/[feature]/migrations/[story-id]-migration-review.md`) is required before `/schema-migration-plan` sign-off can be recorded.

## When to invoke

Invoke `/schema-migration-review` after a schema-migration-plan artefact has been produced and committed at `artefacts/[feature]/migrations/[story-id]-migration-plan.md`.

## Review checklist

Work through every item. Each maps to a classification-dependent requirement.

---

### 1. Credentials check — mandatory

**Check:** Scan the migration command fields in the migration-plan artefact for production credentials, connection strings, passwords, API keys, or tokens.

- If any credential or connection string is found: finding — "Potential credential exposure in migration command: [field name]. Redact before proceeding."
- This check is mandatory regardless of migration classification.

---

### 2. Classification coherence check

**Check:** Compare the declared classification (`breaking` or `additive-only`) against the actual migration statements in the forward migration script or description.

Breaking indicators (presence of any one = classification must be `breaking`):
- `DROP COLUMN` or `DROP TABLE`
- `ALTER COLUMN TYPE` or equivalent column type change
- `RENAME COLUMN` or `RENAME TABLE` (without a compatibility alias in place)
- Removal of a unique constraint or index that application code depends on
- Any statement that removes or narrows data — truncation, deletion, constraint tightening

If the migration-plan artefact declares `additive-only` but the statements contain a `DROP COLUMN` or `ALTER COLUMN TYPE` (or equivalent breaking indicator), this is a coherence finding:

- **Finding:** "Classification mismatch: artefact declares additive-only but the forward migration contains [DROP COLUMN / ALTER COLUMN TYPE / etc.]. Reclassify as breaking and re-run the rollback evidence check."
- This finding blocks PASS. The operator must resolve the mismatch before the review can proceed.

---

### 3. Rollback evidence check

The rollback evidence requirement depends on the migration classification.

#### Breaking migrations — CI-tier rollback execution evidence is required

For migrations classified as `breaking`, the review cannot reach PASS without evidence that the rollback command was executed on a CI-equivalent environment. Acceptable forms of rollback execution evidence:

- A log snippet from a CI pipeline run showing the rollback command executed successfully
- An automated test result confirming the schema returns to its pre-migration state after rollback
- An operator attestation in the following form: "Rollback command executed on CI-equivalent environment on [date] — outcome: [pass/fail and what was observed]"

If none of the above forms of evidence is present in the migration-plan artefact: finding — "Breaking migration: CI-tier rollback execution evidence is required. Provide a log snippet, test result, or operator attestation that the rollback command was executed on a CI-equivalent environment."

#### Additive-only migrations — declaration is sufficient

For migrations classified as `additive-only`, CI-tier execution evidence is not required. A rollback command declaration is sufficient: "Rollback command declared and reviewed — not yet executed." If the rollback field contains this or equivalent language, no finding is raised for rollback evidence.

---

### 4. Staging snapshot privacy check

This check applies only when staging tier is in scope for the migration (i.e., the tier-applicability table includes staging).

**When staging is in scope:**
- The `staging-snapshot-privacy` field (or a reference to a completed `staging-data-policy.md`) must be populated with a declared choice from the three named options.
- If the field is blank, missing, or marked "TBD": finding — "Staging tier is in scope but staging-snapshot-privacy field is blank. Populate the field or complete a `staging-data-policy.md` reference before PASS."
- This finding blocks PASS.

**When staging is not applicable:**
- If the tier-applicability table excludes staging or marks it "Not applicable", this check is skipped.

---

## PASS criteria

The review produces a PASS artefact when all of the following are true:

1. Zero unresolved findings remain (all findings have been resolved or explicitly risk-accepted with documented rationale)
2. For breaking migrations: CI-tier rollback execution evidence is present
3. For migrations with staging in scope: staging-snapshot-privacy declaration is present
4. No classification coherence mismatch

## Review artefact

Produce a markdown review artefact at `artefacts/[feature]/migrations/[story-id]-migration-review.md`:

```markdown
# Schema Migration Review: [migration title]

**Input artefact:** [path to migration-plan.md]
**Reviewer:** [operator name or "Claude Sonnet / operator-reviewed"]
**Date:** [YYYY-MM-DD]
**Status:** PASS / FAIL

---

## Findings

| Check | Finding | Status |
|-------|---------|--------|
| Credentials check | [finding or "No finding"] | Resolved / Unresolved |
| Classification coherence | [finding or "No finding"] | Resolved / Unresolved |
| Rollback evidence ([breaking/additive-only]) | [finding or evidence summary] | Resolved / Unresolved |
| Staging snapshot privacy | [finding or "Not applicable" or "Declared: Option [A/B/C]"] | Resolved / Unresolved |

---

## Zero unresolved findings: [Yes / No]

**Proceed to sign-off:** [Yes — review is PASS / No — [reason]]
```

## Tool-agnostic stance

This review does not prescribe which migration toolchain the operator uses. All checklist items describe what to verify, not which command to run. "CI-tier rollback execution evidence" means evidence that the rollback was executed and succeeded on a CI-equivalent environment — the form of that evidence (log, test, attestation) is not constrained to any specific tool.

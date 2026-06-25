# Staging Data Policy

<!-- This template is referenced from schema-migration-plan artefacts for stories where the staging tier is in scope. A completed declaration at artefacts/[feature]/migration/staging-data-policy.md satisfies the mandatory staging-snapshot-privacy field check in schema-migration-review. -->

**Feature:** [feature-slug]
**Story:** [story-id]
**Author:** [operator name]
**Date:** [YYYY-MM-DD]

---

## Staging Snapshot Privacy Options

Choose exactly one of the three options below and complete the declared-choice field. The declared choice must not be left blank or marked "TBD" — a non-declaration fails the schema-migration-review mandatory field check.

### Option A — Synthetic generated data

Staging uses a dataset that is entirely synthetically generated. No production data, not even anonymised subsets, are present in the staging environment.

### Option B — Anonymised snapshot via named tool/process

Staging uses a snapshot derived from production data that has been anonymised using a documented tool or process. PII fields are scrubbed, transformed, or replaced before the snapshot is loaded into staging.

### Option C — Non-PII production subset

Staging uses a subset of production data that contains no personally identifiable information (PII) by design — the subset is drawn from tables or records that inherently contain no PII, without requiring an anonymisation step.

---

## Declared Choice

<!-- Select exactly one option. Delete the other two lines. Must not be left blank or marked TBD. -->

**Declared choice:** Option A — Synthetic generated data / Option B — Anonymised snapshot / Option C — Non-PII production subset

<!-- Replace the line above with a single selection, e.g.: -->
<!-- **Declared choice:** Option B — Anonymised snapshot -->

---

## Tool or Process Documentation

<!-- Describe the specific tool or process used to produce the staging dataset for your declared option. Free-form text. -->

**Tool or process used:** [describe the specific implementation — e.g. "Option B: pg_dump + scrub script at scripts/anonymise.sh replaces email, name, and phone fields with Faker-generated values before loading to staging"]

> **Warning:** Do NOT include production credentials, connection strings, passwords, or secrets in this field. If your tool or process requires credentials, reference the credential management approach (e.g. "credentials retrieved from Vault at deploy time") rather than pasting the values here. Treat this artefact as an internal document committed to version control.

---

## Integration Note

This completed template is referenced from the schema-migration-plan artefact. When `schema-migration-review` checks the `staging-snapshot-privacy` field of the migration plan, a valid completed reference to this file (with a non-blank `Declared choice`) satisfies the mandatory field check. A blank, TBD, or missing reference is a blocking finding in schema-migration-review.

Record the path to this completed file in the schema-migration-plan artefact under the staging-snapshot-privacy section:

```
Staging data policy: artefacts/[feature]/migration/staging-data-policy.md
Declared choice: [Option A / B / C]
```

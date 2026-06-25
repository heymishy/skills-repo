# /infra-review

Review an infra-definition artefact using a structured severity scale. `/infra-review` is the enforcement gate between infra-definition and infra-plan sign-off. A PASS artefact is required before `/infra-plan` can proceed.

## When to invoke

Invoke `/infra-review` after an infra-definition artefact has been produced and committed. The review consumes the infra-definition artefact and produces a review artefact at the same `infra/` directory.

**Input:** `artefacts/[feature]/infra/[story-id]-infra-def.md`
**Output:** `artefacts/[feature]/infra/[story-id]-infra-review.md`

## Severity scale

All findings are classified into one of three severity levels:

**DESTRUCTIVE** — The change permanently deletes or irreversibly modifies data, managed infrastructure, or configuration with no viable rollback path. Examples: permanently dropping a managed database, removing a firewall rule with no equivalent replacement, deleting a Kubernetes namespace with live workloads and no backup. DESTRUCTIVE findings hard-block the review. The operator must provide explicit acknowledgement in the form `PROCEED: Yes — [finding text]` before the review can reach PASS. Without this acknowledgement, the review refuses to produce a PASS artefact and re-surfaces the unacknowledged finding.

**REVERSIBLE-HIGH** — The change carries significant risk but can be reversed within an acceptable time window. Examples: a rollback plan with more than 4 hours estimated execution time, a blast-radius statement that affects more than one production service, a secret pattern detected in the plan/preview attachment. REVERSIBLE-HIGH findings must be noted in the review artefact. The operator may proceed to infra-plan after noting each finding, but must not mark the review PASS without addressing or explicitly accepting the risk of each REVERSIBLE-HIGH finding.

**ADVISORY** — The change has a noteworthy concern that does not block the review. Examples: tier-applicability table shows production validated before CI (coherence violation), rollback plan has fewer than 2 discrete steps, blast-radius statement uses vague language ("some services may be affected"). ADVISORY findings appear in the review artefact as warnings. They do not block the review from reaching PASS.

## Review checklist

Work through every item in this checklist against the infra-definition artefact. Each item maps to a severity level.

### Blast-radius review

- **Check:** Does the blast-radius statement name every service, API, or consumer that depends on the changed component?
  - If vague ("may affect downstream consumers") without naming them: ADVISORY finding — "Blast-radius statement is non-specific: name every affected service"
  - If states "None identified" for a change touching a shared resource: REVERSIBLE-HIGH finding — "Blast-radius may be understated: the change touches a shared resource but lists no affected services"

### Rollback testability

- **Check:** Does the rollback plan contain discrete numbered steps (at least 2) and an estimated time-to-execute?
  - If single sentence or no numbered steps: ADVISORY finding — "Rollback plan lacks discrete steps; an operator under incident pressure cannot execute it reliably"
  - If estimated time exceeds 4 hours: REVERSIBLE-HIGH finding — "Rollback time exceeds 4 hours — this is a high-risk window for a sustained production incident"
  - If rollback plan states the change is irreversible: DESTRUCTIVE finding — "No rollback path exists; this change is irreversible"

### Tier-applicability coherence

- **Check:** Does the tier-applicability table show a logically valid validation sequence? Production cannot be validated before staging; staging cannot be validated before CI; CI cannot be validated before local.
  - If production is marked "Validated" while CI or staging is "Not yet validated": ADVISORY finding — "Tier sequence incoherent: production cannot be reasonably validated before [CI/staging]"
  - If all tiers are "Not yet validated" for a change already in production: ADVISORY finding — "Tier table does not reflect current validation state"

### Secret hygiene — mandatory check

**Checklist item:** Scan the plan/preview attachment section for secret patterns. Look for strings matching `password=`, `token=`, `secret=`, `api_key=`, `apikey=`, or similar key=value patterns where the value is not a placeholder (e.g. not `<your-value-here>`, `[REDACTED]`, or `xxx`).

- If a real-valued secret pattern is found: REVERSIBLE-HIGH finding — "Potential credential exposure in plan/preview attachment: [pattern found]. Redact and recommit before review proceeds."
- If no secret patterns found: no finding.

### Destructive operation check

- **Check:** Does the change description or blast-radius statement describe a permanently destructive operation (data deletion, irreversible configuration removal, resource destruction with no restore path)?
  - If yes and rollback plan confirms no rollback: DESTRUCTIVE finding — "[describe the operation] is permanently destructive with no rollback path"

## DESTRUCTIVE finding — acknowledgement gate

If any DESTRUCTIVE finding is identified:

1. Surface the finding to the operator with its full text.
2. Require the operator to respond with: `PROCEED: Yes — [finding text]`
3. Do not produce a PASS artefact until the acknowledgement is received.
4. If the operator does not provide the acknowledgement, re-surface the unacknowledged DESTRUCTIVE finding and block progress. The review cannot proceed to infra-plan without explicit acknowledgement.

## Review artefact

Produce a markdown review artefact at `artefacts/[feature]/infra/[story-id]-infra-review.md` with the following structure:

```markdown
# Infra-Review: [change title]

**Input artefact:** [path to infra-def.md]
**Reviewer:** [operator name or "Claude Sonnet / operator-reviewed"]
**Date:** [YYYY-MM-DD]
**Status:** PASS / FAIL

---

## Findings

| Severity | Check | Finding |
|----------|-------|---------|
| [DESTRUCTIVE / REVERSIBLE-HIGH / ADVISORY / NONE] | [check name] | [finding text or "No finding"] |

---

## Acknowledgements

[If any DESTRUCTIVE findings: list each with the operator's PROCEED: Yes acknowledgement.]

---

## Decision

**PASS conditions met:** [Yes / No]
- Zero unacknowledged DESTRUCTIVE findings: [Yes / No]
- All REVERSIBLE-HIGH findings noted and accepted: [Yes / No]

**Proceed to infra-plan:** [Yes — review is PASS / No — [reason]]
```

## PASS criteria

The review status is **PASS** when:

1. Zero unacknowledged DESTRUCTIVE findings remain (all DESTRUCTIVE findings have an explicit `PROCEED: Yes` acknowledgement from the operator).
2. All REVERSIBLE-HIGH findings are noted in the artefact (they do not require acknowledgement, but must be recorded).
3. The artefact is committed to `artefacts/[feature]/infra/[story-id]-infra-review.md` before `/infra-plan` begins.

ADVISORY findings do not block PASS.

## Tool-agnostic stance

This review does not require any specific infrastructure toolchain. Plan and preview output references in this skill are tool-agnostic — "review the output of your plan/preview tool" means any output your team uses to preview infrastructure changes (e.g. a plan summary, diff output, change preview, or dry-run result). Do not reference specific tool CLI commands in required review steps.

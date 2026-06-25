# /infra-plan

Produce the infra-plan sign-off artefact — the final step of the infra track. `/infra-plan` requires a passing infra-review as its entry condition. The sign-off artefact is evidence that the full infra track (definition → review → plan) is complete. Its path is recorded as `infraPlanPath` on the story entry, which the H-INF DoR gate reads at next DoR run.

## Entry condition

Before invoking `/infra-plan`, verify:

1. An infra-review artefact exists at `artefacts/[feature]/infra/[story-id]-infra-review.md`
2. The infra-review artefact shows **Status: PASS** (zero unacknowledged DESTRUCTIVE findings)

If the infra-review artefact is absent or shows a status other than PASS, `/infra-plan` cannot produce a sign-off. Surface the blocking condition:

- If infra-review is missing: "Entry condition not met: infra-review artefact not found at `artefacts/[feature]/infra/[story-id]-infra-review.md`. Complete `/infra-review` first."
- If infra-review shows an unacknowledged DESTRUCTIVE finding: "Entry condition not met: infra-review has an unacknowledged DESTRUCTIVE finding — `[finding text]`. The operator must provide `PROCEED: Yes — [finding text]` in the review artefact before sign-off can proceed."

Re-surface the unacknowledged finding to the operator. Do not produce the sign-off artefact until the entry condition is met.

## Output path

`artefacts/[feature]/infra/[story-id]-infra-plan.md`

After completing the sign-off, the operator records the path via:
`node bin/skills advance [feature-slug] [story-id] infraPlanPath=artefacts/[feature]/infra/[story-id]-infra-plan.md`

## Sign-off artefact template

Produce a markdown file at the output path with the following sections:

```markdown
# Infra-Plan Sign-Off: [change title]

**Feature:** [feature-slug]
**Story / ops ID:** [story-id or ops-slug]
**Infra-definition:** [path to infra-def.md]
**Infra-review:** [path to infra-review.md]
**Operator:** [operator name]
**Date:** [YYYY-MM-DD]
**Status: PASS**

---

## 1. Tier Execution Sequence

Apply the change in this order. Do not skip tiers. If a tier validation checkpoint fails, stop and consult the rollback plan from the infra-definition artefact.

| Step | Tier | Action | Checkpoint before proceeding |
|------|------|--------|------------------------------|
| 1 | Local | [apply change in local environment] | [what to verify — e.g. "smoke test passes"] |
| 2 | CI | [apply change in CI environment] | [checkpoint — e.g. "pipeline runs green with new config"] |
| 3 | Staging | [apply change in staging] | [checkpoint — e.g. "load test passes; no anomalous error rate"] |
| 4 | Production | [apply change in production] | [checkpoint — e.g. "error rate within baseline for 15 minutes post-deploy"] |

---

## 2. Per-Tier Validation Checkpoints

For each tier, record what was checked and the outcome before proceeding to the next tier.

| Tier | Checkpoint | Result | Date |
|------|-----------|--------|------|
| Local | [checkpoint text] | Pass / Fail / Pending | [date] |
| CI | [checkpoint text] | Pass / Fail / Pending | [date] |
| Staging | [checkpoint text] | Pass / Fail / Pending | [date] |
| Production | [checkpoint text] | Pass / Fail / Pending | [date] |

---

## 3. Operator Execution Checklist

Complete each step in order. Check each box when done.

- [ ] Confirm infra-review status is PASS before starting
- [ ] Apply the change to Local tier; record checkpoint result above
- [ ] Apply the change to CI tier; record checkpoint result above
- [ ] Apply the change to Staging tier; record checkpoint result above
- [ ] Apply the change to Production tier; record checkpoint result above
- [ ] Confirm rollback plan is accessible and ready (reference: infra-def.md §3)
- [ ] Record `infraPlanPath` on the story entry via `skills advance`
- [ ] Notify any downstream consumers of the change

---

## 4. Rollback Reference

If any tier checkpoint fails: execute the rollback plan from `[infra-def.md path] §3 — Rollback Plan`.

Do not derive a new rollback plan at execution time. The rollback plan must have been reviewed and validated during infra-review. If the rollback plan is insufficient, stop execution and raise a REVERSIBLE-HIGH finding against the infra-review artefact before proceeding.
```

## After completion

Record the sign-off artefact path on the pipeline story entry:

```
node bin/skills advance [feature-slug] [story-id] infraPlanPath=artefacts/[feature]/infra/[story-id]-infra-plan.md
```

The H-INF gate at DoR will read this path to confirm the infra track is complete. `/trace` will reference this artefact for audit continuity.

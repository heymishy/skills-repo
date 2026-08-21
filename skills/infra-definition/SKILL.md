# /infra-definition

Produce a structured infra-definition artefact for an infrastructure change. The artefact is the mandatory input for `/infra-review`. It must be complete before any infrastructure change is executed.

## When to invoke

Invoke `/infra-definition` whenever a story or standalone ops change modifies infrastructure — cloud resources, network configuration, IAM policies, secrets management, deployment targets, or any system component external to application code.

For a story-linked change: `feature-slug` is the story's feature slug (e.g. `2026-06-25-payment-gateway-migration`) and `story-id` is the story identifier (e.g. `inf.1`).

For a standalone ops change: `feature-slug` uses the `ops/` prefix (e.g. `ops/2026-06-25-secrets-rotation`). The artefact is written to `artefacts/ops/[ops-slug]/infra/standalone-infra-def.md`.

## Output path

Story-linked: `artefacts/[feature]/infra/[story-id]-infra-def.md`

Standalone ops: `artefacts/ops/[ops-slug]/infra/standalone-infra-def.md`

## Artefact template

Produce a markdown file at the output path above with all five sections below. Every section is mandatory. Do not omit or collapse sections.

---

```markdown
# Infra-Definition: [change title]

**Feature:** [feature-slug]
**Story / ops ID:** [story-id or ops-slug]
**Author:** [operator name]
**Date:** [YYYY-MM-DD]

---

## 1. Change Description

[Describe what infrastructure component is changing. Include: the component name, the type of change (create / modify / delete / promote), and the expected post-change state. One to three paragraphs — be specific enough that a reviewer who has not read the story can understand the scope.]

---

## 2. Blast-Radius Statement

[Declare the impact scope of this change. Address each of the following:]

**Services affected:** [List every service, API, or consumer that depends on the changed component. If none, state "None identified".]

**Environments affected:** [List the environments this change touches, in rollout order.]

**Data at risk:** [Identify any data that could be lost, corrupted, or temporarily inaccessible during the change. If none, state "No data at risk".]

**Blast radius summary:** [One sentence characterising the worst-case impact if the change fails — e.g. "Full outage of payment processing for all tenants for up to 30 minutes".]

---

## 3. Rollback Plan

[Provide discrete, numbered steps to reverse this change if it causes a production incident. Each step must be actionable without referencing this document — assume the operator is under incident pressure.]

1. [Step 1 — specific action]
2. [Step 2 — specific action]
3. [Continue as needed]

**Estimated time to execute:** [e.g. "15 minutes", "1–2 hours depending on database replication lag"]

**Rollback decision point:** [At what signal should an operator initiate rollback? e.g. "If error rate exceeds 1% within 5 minutes of deployment".]

---

## 4. Tier-Applicability

[Complete the table for all four tiers. "Validated" means the change has been applied and verified in that tier. "Not yet validated" means it is required before advancing to the next tier.]

| Tier | Scope | Validation Status |
|------|-------|-------------------|
| Local | Developer workstation / local compose stack | Validated — [date] / Not yet validated — required before CI |
| CI | Automated pipeline environment | Validated — [date] / Not yet validated — required before Staging |
| Staging | Pre-production environment (mirrors production data shape) | Validated — [date] / Not yet validated — required before Production |
| Production | Live environment serving real users | Validated — [date] / Not yet validated |

---

## 5. Plan/Preview Attachment

[Attach the output of your infrastructure planning or preview tool here as a plain text export. This is tool-agnostic — paste the text output regardless of what toolchain you are using (e.g. a plan summary, diff output, change preview, or dry-run result).]

> **Warning:** Do NOT paste secrets, credentials, API keys, tokens, or any sensitive values into this section. If your plan output contains sensitive values, redact them before attaching. Treat this artefact as an internal document, not a secrets store.

**Plan/preview output:**

```
[Paste tool output here. Redact any credentials or sensitive values before pasting.]
```

**Tool/command used:** [e.g. "terraform plan", "pulumi preview", "cdk diff", "ansible --check", or your team's equivalent. This field is for audit context — it does not restrict which tools your team uses.]
```

---

## Checklist before submitting to `/infra-review`

- [ ] All five sections are populated (no placeholder text remaining)
- [ ] Blast-radius statement names every affected service
- [ ] Rollback plan has ≥2 discrete numbered steps and an estimated time
- [ ] All four tiers have a validation status (Validated or Not yet validated)
- [ ] Plan/preview attachment is present and contains no credentials
- [ ] Artefact is committed to the feature artefact directory before review begins

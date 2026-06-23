---
name: release
description: >
  Closes the pipeline loop from merged code to production. Consumes DoD artefacts
  across a set of stories and produces: release notes (technical and plain language),
  a change request body ready for the change management process, a deployment
  checklist, and a rollback trigger definition. Use when one or more stories are
  DoD-complete and someone says "prepare the release", "write release notes",
  "change request", "ready to deploy", or "what's in this release".
  Requires at least one DoD-complete story artefact.
triggers:
  - "prepare the release"
  - "write release notes"
  - "change request"
  - "ready to deploy"
  - "what's in this release"
  - "deployment checklist"
  - "rollback plan"
  - "release this"
---

# Release Skill

## Step 0 — Read tool integrations from context

Before producing outputs, read `.github/context.yml` (the active pipeline context).
If the file does not exist, fall back to the **Tool integrations** table in the
agent instruction file (e.g. `copilot-instructions.md`).

The fields that control release output are:

| `context.yml` field | When set, outputs will include... |
|---------------------|-----------------------------------|
| `change_management.tool` (e.g. `servicenow`, `jira-sm`) | ITSM field names in the change request (ticket number, assignment group, change category, base URL) |
| `tools.ci_platform` (e.g. `jenkins`, `github-actions`, `gitlab-ci`) | Pipeline build links in the deployment checklist and test evidence section |
| `tools.monitoring` (e.g. `dynatrace`, `datadog`, `newrelic`) | Dashboard and synthetic monitor links in the deployment checklist; monitoring problem feed in rollback triggers |
| `tools.log_aggregation` (e.g. `splunk`, `elk`, `cloudwatch`) | Saved search / log query links in the post-deployment verification steps |
| `tools.alerting` (e.g. `pagerduty`, `opsgenie`) | On-call service URL for contact confirmation in the deployment checklist |
| `tools.project_management` (e.g. `jira`, `linear`, `github-issues`) | Story ticket links in release notes and the change request |
| `tools.artifact_registry` (e.g. `nexus`, `artifactory`, `github-packages`) | Artefact version reference in the deployment checklist |

State what was detected before proceeding:

> **Tool integrations detected from context.yml:**
> - Change management: [`change_management.tool` value / not configured]
> - CI/CD: [`tools.ci_platform` value / not configured]
> - Monitoring: [`tools.monitoring` value / not configured]
> - Log aggregation: [`tools.log_aggregation` value / not configured]
> - Alerting: [`tools.alerting` value / not configured]
> - Project management: [`tools.project_management` value / not configured]
> - Artefact registry: [`tools.artifact_registry` value / not configured]
>
> Are these correct, or should I use different tools for this release?
> Reply: correct — or specify overrides

If no `context.yml` is present and no tool config is found, use generic
`[monitoring tool]`, `[log tool]`, and `[change management tool]` placeholders throughout.

Also apply policy overlays if present:

- `mapping.governance.gates`: use org governance labels alongside canonical
  release/change wording
- `mapping.artefact_aliases`: include org artefact names in output headings
- `optimization.token_policy`: keep release summaries concise; place detailed
  operational evidence in appendices

---

## Step 1 — Identify what is in scope for this release

State what was found before asking:

> **DoD-complete stories found:**
> - [story title] — PR [ref] merged [date]
> - [story title] — PR [ref] merged [date]
>
> Any scope deviations recorded: [None / list]
>
> Are all of these in scope for this release, or do you want a subset?
> Reply: all — or list the stories to include

---

## Step 1b — Compliance bundle (regulated and programme releases)

If `context.yml` has `regulated: true` or `compliance.frameworks` is non-empty,
surface this automatically:

> **This repo is marked as regulated** (frameworks: [`compliance.frameworks` values]).
> Is this release in scope for a compliance evidence bundle?
>
> 1. Yes — produce a compliance evidence bundle alongside standard release artefacts
> 2. No — standard release outputs only

If `context.yml` is absent or `regulated: false`, ask:

> **Is this release part of a regulated, audited, or programme-gated context?**
> (e.g. in PCI-DSS scope, SOX audit trail required, internal phase gate completion,
> post-incident remediation, regulatory deadline)
>
> 1. Yes — produce a compliance evidence bundle alongside standard release artefacts
> 2. No — standard release outputs only
>
> Reply: 1 or 2

If **1 — Compliance bundle:**

Conforms to `templates/compliance-bundle.md`.
Save to `artefacts/[feature]/release/[version]-compliance-bundle.md`.

If any artefact is missing from the bundle:

> ⚠️ **Compliance bundle gap: [artefact type] not found for [story].**
> This must be resolved before the bundle can be treated as complete.
> Missing artefact must be produced or its absence formally accepted and recorded.

---

## Step 2 — Confirm the release type

> **What type of release is this?**
>
> 1. Standard — scheduled release, normal change process
> 2. Emergency / hotfix — expedited change process
> 3. Feature flag release — code ships but feature is gated, not yet live
> 4. Canary / staged rollout — partial traffic or user cohort first
>
> Reply: 1, 2, 3, or 4

---

## Step 3 — Confirm change governance context

> **What change management process applies?**
>
> 1. Standard — produce a change request body for the CAB process
> 2. Pre-approved change — documented in the change register, no CAB submission needed
> 3. Emergency — note the expedited process requirements
> 4. Not applicable for this release
>
> Reply: 1, 2, 3, or 4

---

## Step 4 — Confirm deployment context

> **What does deployment look like for this release?**
>
> 1. Automated pipeline — CI/CD, no manual steps beyond approval gate
> 2. Automated with manual pre/post steps — I'll note them explicitly
> 3. Partially manual — describe the manual steps
> 4. Fully manual — walk me through the process
>
> Reply: 1, 2, 3, or 4

If 3 or 4:

> **Describe the manual deployment steps in order.**
> I'll format them into the deployment checklist.
>
> Reply: list the steps

---

## Step 5 — Rollback context

> **Rollback status for this release?**
>
> 1. Tested in a lower environment — I'll reference the test result
> 2. Documented but not tested this cycle
> 3. Has known complications — I'll need to describe them
> 4. No rollback possible — I'll flag this prominently
>
> Reply: 1, 2, 3, or 4

If 3:

> **Describe the rollback complications.**
> These will be flagged prominently in the checklist and change request.
>
> Reply: describe

---

## Output 1: Release notes — technical

Conforms to `.github/templates/release-notes-technical.md`.
Save to `artefacts/[feature]/release/[version]-release-notes-technical.md`.

If `context.tools.monitoring` is configured: add a rollback trigger condition
referencing the monitoring platform's alerting or problem feed.
If `context.tools.project_management` is configured (e.g. Jira, Linear):
link each story title to the corresponding ticket.
If `context.tools.ci_platform` is configured: populate the pipeline build field
in the header with the CI build URL.

---

## Output 2: Release notes — plain language

Conforms to `.github/templates/release-notes-plain.md`.
Save to `artefacts/[feature]/release/[version]-release-notes-plain.md`.

Plain language rules:
- No technical terms without explanation
- Written for a product manager, BA, or stakeholder — not an engineer
- Each story described as a user-visible change, not a code change
- "You can now..." / "We fixed..." / "We improved..." framing
- If a change is invisible to users, say so and explain why it matters

---

## Output 3: Change request body

Conforms to `.github/templates/change-request.md`.
Save to `artefacts/[feature]/release/[version]-change-request.md`.

Produce a complete change request ready to paste into the change management tool.
Do not leave fields blank — if information is missing, state what is needed and
who must provide it.

If `context.change_management.tool` is set to `servicenow`: use ServiceNow field
names, include the assignment group (`context.change_management.assignment_group`),
change category (`context.change_management.change_category`), and base URL pattern
for the CHG link (`context.change_management.base_url`).
If `context.change_management.tool` is set to `jira-sm` or similar: adapt field
names to match the configured ITSM tool's terminology.
If `context.change_management.process` is `none` or `context.change_management.tool`
is null: produce a lightweight change record suitable for informal review, and omit
ITSM-specific fields.
If `context.tools.ci_platform` is configured: link the CI build URL in the test evidence section.

---

## Output 4: Deployment checklist

Conforms to `.github/templates/deployment-checklist.md`.
Save to `artefacts/[feature]/release/[version]-deployment-checklist.md`.

If `context.tools.monitoring` is configured: add the monitoring dashboard URL,
a synthetic monitor check in post-deployment verification, and the monitoring
platform's alerting feed as a primary rollback trigger.
If `context.tools.log_aggregation` is configured: add saved search / log query
links for post-deployment log scanning.
If `context.tools.alerting` is configured: add the on-call service URL to the
on-call confirmation step.
If `context.tools.ci_platform` is configured: add the pipeline build URL to
deployment steps.
If `context.tools.artifact_registry` is configured: add the artefact version
reference to the deployment steps.

---

## Completion output

> **Release artefacts ready ✅**
>
> - Technical release notes: `[path]`
> - Plain language release notes: `[path]`
> - Change request: `[path]`
> - Deployment checklist: `[path]`
>
> **Fields that need filling in before submission:**
> [List any blanks — e.g. "Release window not set", "Approver names needed"]
>
> **Items carried forward from DoD artefacts:**
> [None / list scope deviations or incomplete items]
>
> Ready to submit the change request, or fill in the gaps first?
> Reply: ready — or specify what to fill in

---

## Quality checks before outputting

- Every DoD-complete story is represented in the release notes
- Scope deviations from DoD artefacts are surfaced, not buried
- Change request has no silent blanks — all gaps explicitly flagged with owner
- Rollback procedure is specific — not "revert the deployment"
- Rollback triggers are observable conditions with thresholds
- Plain language notes contain no unexplained technical terms
- Deployment checklist steps are in order and independently actionable

---

## What this skill does NOT do

- Does not execute deployments or interact with deployment pipelines
- Does not submit change requests to external tools
- Does not approve changes — produces documentation for human approval
- Does not replace a formal risk assessment process
- Does not create follow-up stories — flags gaps for humans to action

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when release notes are finalised:

- For each story included in the release: set `stage: "released"`, `prStatus: "merged"`, `releaseReady: true`, `updatedAt: [now]`
- For each story's epic: if all stories in the epic are `stage: "released"`, set epic `status: "complete"`
- For the feature: if all stories are released, set `stage: "released"`, `health: "green"`, `updatedAt: [now]`
- If any stories have scope deviations or gaps noted in their DoD: set `health: "amber"` on those stories and note the deviation in `blocker`

**Human action note:** Deployment itself is a human action. After confirming production deployment, clear any remaining `blocker` fields and set `health: "green"` on affected entries.

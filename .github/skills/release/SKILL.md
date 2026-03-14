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

## Step 0 — Read tool integrations (optional)

Before producing outputs, check `.github/copilot-instructions.md` for the
**Tool integrations** section. If configured, release artefacts are extended
with tool-specific references.

| Tool | When configured, outputs will include... |
|------|------------------------------------------|
| ServiceNow | ServiceNow field names in the change request (CHG number, assignment group, change category), ITSM base URL |
| Jenkins / CloudBees | Pipeline build links in the deployment checklist and test evidence section |
| Dynatrace | Dashboard and synthetic monitor links in the deployment checklist; Dynatrace problem feed in rollback triggers |
| Splunk | Saved search links for log scanning in the post-deployment verification steps |
| PagerDuty | Service URL for on-call contact confirmation in the deployment checklist |
| Jira | Story ticket links in release notes and the change request |
| Nexus / Artifactory | Artefact version reference in the deployment checklist |

State what was detected before proceeding:

> **Tool integrations detected:**
> - ServiceNow: [configured — base URL / not configured]
> - CI/CD (Jenkins / CloudBees): [configured / not configured]
> - Dynatrace: [configured / not configured]
> - Splunk: [configured / not configured]
> - PagerDuty: [configured / not configured]
> - Jira: [configured / not configured]
>
> Are these correct, or should I use different tools for this release?
> Reply: correct — or specify overrides

If no tool config is present, use generic `[monitoring tool]`, `[log tool]`,
and `[change management tool]` placeholders throughout.

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

> **Is this release part of a regulated, audited, or programme-gated context?**
> (e.g. cards issuing, PCI-DSS scope, SOX, internal audit, phase gate completion,
> post-incident remediation, regulatory deadline)
>
> 1. Yes — produce a compliance evidence bundle alongside standard release artefacts
> 2. No — standard release outputs only
>
> Reply: 1 or 2

If **1 — Compliance bundle:**

Bundle a reference index of all pipeline artefacts for the stories in scope,
packaged as an evidence catalogue:

```
## Compliance Evidence Bundle — [Release name / version]

Prepared: [date]
Scope: [story / stories]
Prepared by: [name]

| Evidence type | Artefact | Date | Status |
|---------------|---------|------|--------|
| Story definition | .github/artefacts/[feature]/stories/ | [date] | Approved |
| Review report | .github/artefacts/[feature]/review/ | [date] | PASS Run [N] |
| Test plan | .github/artefacts/[feature]/test-plans/ | [date] | [n] tests |
| Verification script | .github/artefacts/[feature]/verification-scripts/ | [date] | |
| Definition of ready | .github/artefacts/[feature]/dor/ | [date] | PROCEED |
| Sign-off (if High oversight) | [recorded in DoR artefact] | [date] | [name] |
| Definition of done | .github/artefacts/[feature]/dod/ | [date] | COMPLETE |
| Trace report | .github/artefacts/[feature]/trace/ | [date] | HEALTHY |
```

Save to `.github/artefacts/[feature]/release/[version]-compliance-bundle.md`.

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
Save to `.github/artefacts/[feature]/release/[version]-release-notes-technical.md`.

If Dynatrace is configured: add a rollback trigger condition referencing the Dynatrace problem feed.
If Jira is configured: link each story title to the Jira ticket.
If Jenkins / CloudBees is configured: populate the pipeline build field in the header.

---

## Output 2: Release notes — plain language

Conforms to `.github/templates/release-notes-plain.md`.
Save to `.github/artefacts/[feature]/release/[version]-release-notes-plain.md`.

Plain language rules:
- No technical terms without explanation
- Written for a product manager, BA, or stakeholder — not an engineer
- Each story described as a user-visible change, not a code change
- "You can now..." / "We fixed..." / "We improved..." framing
- If a change is invisible to users, say so and explain why it matters

---

## Output 3: Change request body

Conforms to `.github/templates/change-request.md`.
Save to `.github/artefacts/[feature]/release/[version]-change-request.md`.

Produce a complete change request ready to paste into the change management tool.
Do not leave fields blank — if information is missing, state what is needed and
who must provide it.

If ServiceNow is configured: use ServiceNow field names, include the assignment group,
change category, and base URL pattern for the CHG link.
If Jenkins / CloudBees is configured: link the CI build URL in the test evidence section.

---

## Output 4: Deployment checklist

Conforms to `.github/templates/deployment-checklist.md`.
Save to `.github/artefacts/[feature]/release/[version]-deployment-checklist.md`.

If Dynatrace is configured: add dashboard URL to monitoring dashboards, Dynatrace
synthetic monitor to post-deployment verification, and problem feed to rollback triggers.
If Splunk is configured: add saved search links for post-deployment log scanning.
If PagerDuty is configured: add PagerDuty service URL to on-call confirmation step.
If Jenkins / CloudBees is configured: add pipeline build URL to deployment steps.

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

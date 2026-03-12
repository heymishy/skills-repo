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

Save to `.github/artefacts/[feature]/release/[version]-release-notes-technical.md`

```markdown
# Release Notes — Technical: [version / release name]

**Release date:** [date]
**Release type:** [Standard / Emergency / Feature flag / Canary]
**Stories included:** [n]

## Changes

### [Story title]
- **PR:** [ref] | **Merged:** [date]
- **What changed:** [technical description — component, behaviour, data]
- **ACs delivered:** [n of n]
- **Scope deviations:** [None / list with DoD reference]
- **Test coverage:** [n unit, n integration, n NFR tests passing]

[Repeat per story]

## Dependencies and prerequisites
[Infrastructure, config, feature flags, or migrations required before deployment]

## Known issues / limitations
[Anything from DoD artefacts flagged as incomplete or deferred]

## Rollback
**Procedure:** [steps]
**Tested:** [Yes — [environment] on [date] / No — theoretical]
**Complications:** [None / description]
**Rollback trigger conditions:** [observable conditions — see deployment checklist]
```

---

## Output 2: Release notes — plain language

Save to `.github/artefacts/[feature]/release/[version]-release-notes-plain.md`

Plain language rules:
- No technical terms without explanation
- Written for a product manager, BA, or stakeholder — not an engineer
- Each story described as a user-visible change, not a code change
- "You can now..." / "We fixed..." / "We improved..." framing
- If a change is invisible to users, say so and explain why it matters

```markdown
# What's in this release — [version / release name]

**Available from:** [date]

## What's new
[One paragraph per story as user-visible change]

### [User-friendly title]
[2–3 sentences: what users can now do, or what problem is fixed.
Written as if explaining to a customer. No jargon.]

## What we fixed
[Bug fixes in plain language — what was broken, what's better now]

## What's not in this release
[Anything expected but deferred — set expectations clearly]
```

---

## Output 3: Change request body

Save to `.github/artefacts/[feature]/release/[version]-change-request.md`

Produce a complete change request body ready to paste into the change management
tool. Do not leave fields blank — if information is missing, state what is needed
and who must provide it.

```markdown
# Change Request: [version / release name]

**Request date:** [date]
**Requested by:** [name — prompt if not known]
**Change type:** [Standard / Emergency / Pre-approved]
**Release window:** [proposed date/time — prompt if not known]

## Description of change
[What is changing, plain language. 2–4 sentences.]

## Business justification
[Why this change — link to discovery/benefit-metric rationale]

## Scope of impact
**Systems affected:** [list]
**User groups affected:** [list]
**Estimated users impacted:** [number or "all users"]
**Data changes:** [None / describe schema or data migrations]

## Risk assessment
**Risk level:** [Low / Medium / High]
**Risk basis:** [What makes it this level — reference DoD scope deviations if any]
**Mitigations:** [What reduces the risk]

## Test evidence
[Reference test plan artefact paths and CI results]
**Test environments:** [list]
**Performance tested:** [Yes / No]
**Security reviewed:** [Yes / No — if applicable]

## Deployment plan
[Summary — full detail in deployment checklist]
**Deployment duration (estimated):** [time]
**Deployment window:** [date/time]
**Approvals required:** [list roles]

## Rollback plan
**Procedure:** [summary]
**Duration (estimated):** [time]
**Trigger conditions:** [observable conditions that initiate rollback]
**Complications:** [None / description — flag prominently if any]

## Communications
**Teams to notify pre-deployment:** [list]
**Teams to notify post-deployment:** [list]
**Customer communication required:** [Yes — owner: [name] / No]
```

---

## Output 4: Deployment checklist

Save to `.github/artefacts/[feature]/release/[version]-deployment-checklist.md`

```markdown
# Deployment Checklist: [version / release name]

**Release window:** [date/time]
**Deployer:** [name — to be filled in at deployment time]

## Pre-deployment
- [ ] Change request approved by [role]
- [ ] Release notes shared with [stakeholders]
- [ ] Monitoring dashboards open: [list]
- [ ] Rollback procedure confirmed and accessible
- [ ] On-call contact confirmed: [name/channel]
- [ ] [Feature flags to set — list with expected state]
- [ ] [Database migrations to run — order-sensitive, list explicitly]
- [ ] [Config changes required before code deployment]

## Deployment
- [ ] [Step 1]
- [ ] [Step 2 — continue for all steps, automated or manual as specified]
- [ ] Deployment complete — confirm in [monitoring tool / deployment log]

## Post-deployment verification
- [ ] [Smoke test 1 — drawn from verification scripts]
- [ ] [Smoke test 2]
- [ ] [Smoke test 3]
- [ ] Error rate within baseline: [baseline reference]
- [ ] Latency within baseline: [baseline reference]
- [ ] [Feature flags to update post-deployment]

## Rollback triggers
Initiate rollback immediately if any of the following occur:
- [ ] Error rate exceeds [threshold] for [duration]
- [ ] [Specific transaction or flow] is failing
- [ ] [Any condition from DoD or spike outcomes]

## Sign-off
Deployment verified by: _________________ [date/time]
Stakeholders notified:  _________________ [date/time]
```

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

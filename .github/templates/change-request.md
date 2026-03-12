# Change Request: [Version / Release Name]

<!--
  USAGE: Produced by the /release skill. Ready to paste into the change management tool.
  All fields must be populated — if information is unknown, state what is needed
  and who must provide it. Do not leave silent blanks.

  Tool integrations (from copilot-instructions.md):
  - If ServiceNow configured: use ServiceNow field names, include CHG URL and
    assignment group fields; the agent will pre-fill known values from config
  - If Jenkins / CloudBees configured: link the CI build URL in test evidence

  To evolve: update this template, open a PR, tag engineering lead + change manager.
-->

**Request date:** [YYYY-MM-DD]
**Requested by:** [Name and role]
**Change type:** [Standard / Emergency / Pre-approved]
**Release window:** [Proposed YYYY-MM-DD HH:MM — timezone]
**Change reference:** [CR / CHG number — assigned after submission]
**ITSM ticket:** [ServiceNow CHG / Jira / other — or "pending submission"]

---

## Description of Change

[What is changing. Plain language. 2–4 sentences.]

---

## Business Justification

[Why this change. Link to discovery/benefit-metric rationale.]

---

## Scope of Impact

**Systems affected:** [List]
**User groups affected:** [List]
**Estimated users impacted:** [Number or "all users"]
**Data changes:** [None / describe schema or data migrations]
**Integrations affected:** [None / list]

---

## Risk Assessment

**Risk level:** [Low / Medium / High]
**Risk basis:** [What makes it this level — reference DoD scope deviations if any]
**Mitigations:** [What reduces the risk]

---

## Test Evidence

**Test plan:** [Link to test plan artefact]
**CI pipeline:** [Link to build / N/A]
**Test environments:** [List]
**Performance tested:** [Yes / No]
**Security reviewed:** [Yes / No — if applicable]

---

## Deployment Plan

**Deployment type:** [Automated / Manual / Mixed]
**Estimated duration:** [Time]
**Deployment window:** [YYYY-MM-DD HH:MM — timezone]
**Pre-deployment actions:** [None / list in execution order]
**Approvals required:** [List roles]

---

## Rollback Plan

**Rollback procedure:** [Summary — full detail in deployment checklist]
**Estimated rollback duration:** [Time]
**Rollback tested:** [Yes / No]
**Trigger conditions:** [Observable conditions that initiate rollback]
**Complications:** [None / describe — flag prominently if any]

---

## Communications

**Pre-deployment notifications:** [Teams / channels / individuals]
**Post-deployment notifications:** [Teams / channels / individuals]
**Customer communication required:** [Yes — owner: [name] / No]

---

## Approvals Required

| Role | Name | Status | Date |
|------|------|--------|------|
| [Change owner] | | Pending | |
| [CAB / approving authority] | | Pending | |
| [Other] | | Pending | |

# Release Notes — Technical: [Version / Release Name]

<!--
  USAGE: Produced by the /release skill. Audience: engineers, QA, platform teams.
  Describes what changed at a technical level: components, behaviour, data, tests.

  Tool integrations (from copilot-instructions.md):
  - If Dynatrace configured: add rollback trigger referencing the Dynatrace problem feed
  - If Jira configured: link each story title to the Jira ticket
  - If Jenkins / CloudBees configured: link pipeline build in the header and test evidence

  To evolve: update this template, open a PR, tag engineering lead + QA lead.
-->

**Release date:** [YYYY-MM-DD]
**Release type:** [Standard / Emergency / Feature flag / Canary]
**Stories included:** [n]
**Pipeline build:** [CI/CD build URL — or N/A]

---

## Changes

### [Story Title]

- **PR:** [ref] | **Merged:** [YYYY-MM-DD]
- **What changed:** [Technical description — component, behaviour, data]
- **ACs delivered:** [n of n]
- **Scope deviations:** [None / list with DoD artefact reference]
- **Test coverage:** [n unit, n integration, n NFR tests passing]

<!-- Repeat block for each story in this release. -->

---

## Dependencies and Prerequisites

<!--
  Anything that must be in place before deployment: infrastructure, config,
  feature flags, migrations. List in execution order.
-->

[None / ordered list]

---

## Configuration Changes

| Setting | From | To | Applied by |
|---------|------|----|-----------|
| [Key] | [Old value] | [New value] | [Deploy step / manual] |

---

## Database / Data Changes

[None / describe schema or data migrations — include rollback procedure for each]

---

## Feature Flags

| Flag | State before | State after deployment | When to flip (if staged) |
|------|-------------|----------------------|--------------------------|
| [flag-name] | [on/off] | [on/off] | [immediately / after verification] |

---

## Known Issues / Limitations

<!--
  Anything from DoD artefacts flagged as incomplete or deferred.
-->

[None / list with follow-up story reference]

---

## Rollback

**Procedure:** [Step-by-step — not "revert the deployment"]
**Tested:** [Yes — [environment] on [date] / No — theoretical]
**Estimated duration:** [time]
**Complications:** [None / describe — flag prominently if any]
**Trigger conditions:** [Observable conditions — mirrored in deployment checklist]

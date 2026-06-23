# Deployment Checklist: [Version / Release Name]

<!--
  USAGE: Produced by the /release skill. Used at deployment time.
  Complete each item in order. Do not skip or re-order without noting why.

  Tool-specific items are marked [DYNATRACE], [SPLUNK], [PAGERDUTY], [JENKINS].
  Remove or comment out items for tools not configured in copilot-instructions.md.

  To evolve: update this template, open a PR, tag engineering lead + platform team.
-->

**Release window:** [YYYY-MM-DD HH:MM — timezone]
**Change reference:** [CR / CHG number]
**Deployer:** [Name — filled in at deployment time]
**On-call contact:** [Name / channel] <!-- [PAGERDUTY] PagerDuty service: [service URL] -->

---

## Pre-Deployment

### Change governance
- [ ] Change request approved by [approving authority]
- [ ] Release window confirmed with [stakeholders / platform team]
- [ ] On-call contact confirmed: [name / channel]

### Environment readiness
- [ ] Lower environment verification complete
- [ ] Feature flag states confirmed: [list flags and intended pre-deploy state]
- [ ] Database migrations reviewed — rollback scripts available: [Yes / N/A]
- [ ] Config changes confirmed: [list or N/A]
- [ ] Artefact version confirmed: [version / build ref] <!-- [JENKINS] Build: [pipeline URL] -->

### Monitoring readiness
- [ ] Monitoring dashboards open <!-- [DYNATRACE] Dashboard: [Dynatrace environment URL] -->
- [ ] Log monitoring session open <!-- [SPLUNK] Saved search: [Splunk URL] -->
- [ ] Baseline metrics noted: error rate [x%], latency p95 [xms], throughput [req/s]
- [ ] Alerting verified active <!-- [PAGERDUTY] Service: [PagerDuty service URL] -->

### Rollback readiness
- [ ] Rollback procedure accessible: [link to procedure or path]
- [ ] Rollback scripts / pipeline available: [Yes / N/A]
- [ ] Estimated rollback time noted: [from release notes]

---

## Deployment

- [ ] [Step 1] <!-- [JENKINS] Trigger pipeline: [build URL] -->
- [ ] [Step 2 — continue for all steps, automated or manual as specified]
- [ ] Deployment complete — confirmed in [deployment log / pipeline dashboard]

---

## Post-Deployment Verification

### Smoke tests
<!-- Drawn from AC verification scripts -->
- [ ] [Smoke test 1 — plain language AC verification step]
- [ ] [Smoke test 2]
- [ ] [Smoke test 3]

### System health
- [ ] Error rate within baseline (current: [x%], baseline: [x%]) <!-- [DYNATRACE] Problem feed: [URL] -->
- [ ] Latency p95 within baseline (current: [xms], baseline: [xms])
- [ ] No new alerts firing <!-- [DYNATRACE] Dashboard: [URL] -->
- [ ] Log scan for errors related to this release <!-- [SPLUNK] Search: [saved search URL] -->
- [ ] Feature flags updated post-deployment: [list flags and final state or N/A]

---

## Rollback Triggers

Initiate rollback immediately if any of the following occur:
- [ ] Error rate exceeds [threshold]% for [duration] <!-- [DYNATRACE] Alert: [URL] -->
- [ ] [Specific transaction or flow] is failing
- [ ] [Key metric] drops below [threshold]
- [ ] [Any condition from DoD or spike outcomes]

**To rollback:** [link to rollback procedure]

---

## Sign-Off

|  | Name | Date / time |
|--|------|-------------|
| **Deployment verified by** | | |
| **Stakeholders notified** | | |
| **Change closed** | | |

# Deployment Checklist: Revise an Earlier Stage Mid-Journey (2026-08-29)

**Release window:** [FILL IN before deploying]
**Change reference:** N/A — no ITSM tool configured
**Deployer:** [FILL IN at deployment time]
**On-call contact:** [FILL IN — no alerting tool configured in `context.yml`]

---

## Pre-Deployment

### Change governance
- [ ] Change request reviewed (no formal CAB — solo-operator context; confirm internal sign-off as applicable)
- [ ] Release window confirmed
- [ ] On-call contact confirmed

### Environment readiness
- [ ] Staging verification complete — both `@real-staging` Playwright scenarios passing on res-s4's merged PR (#782): `Scenario A E2E (staging)`, `Scenario B E2E (staging)`
- [ ] Feature flags: none — this feature ships unflagged
- [ ] Database migrations: none — additive field only, no schema change, no migration script needed
- [ ] Config changes: none
- [ ] Artefact version confirmed: master @ commit `739e5153` (res-s4 DoD checkpoint) or later — confirm the exact commit you're deploying

### Monitoring readiness
- [ ] Monitoring dashboards open — no monitoring tool configured in `context.yml`; use whatever you have in production
- [ ] Log monitoring session open — no log aggregation tool configured; use whatever you have in production
- [ ] Baseline metrics noted: [FILL IN — error rate, latency, throughput before this deploy]
- [ ] Alerting verified active — no alerting tool configured

### Rollback readiness
- [ ] Rollback procedure accessible: redeploy commit `2c654132` (pre-feature master HEAD) via your standard deployment pipeline
- [ ] Rollback scripts / pipeline available: same pipeline as forward deployment — no separate rollback tooling needed (additive-only change)
- [ ] Estimated rollback time noted: [FILL IN — same as your normal deploy time]

---

## Deployment

- [ ] Trigger your standard automated deployment pipeline against master @ `739e5153` (or later, if further commits land before you deploy — confirm the exact SHA)
- [ ] Deployment complete — confirmed in your deployment log / pipeline dashboard

---

## Post-Deployment Verification

### Smoke tests
<!-- Drawn from the 4 stories' AC verification scripts -->
- [ ] Open a previously completed stage from the step-nav — confirm it opens a live chat session, not a static read-only view (res-s1, AC1)
- [ ] Send a revision turn in that reopened session — confirm the artefact updates in place at its existing path (res-s2, AC1)
- [ ] Make a revision that changes the Problem Statement / MVP Scope / Constraints — confirm a materiality suggestion appears in the same chat turn's response (res-s3, AC1)
- [ ] Click "Flag downstream stages" — confirm a "⚑ May need review" marker appears on the flagged stages' step-nav entries, and updates in place without a page reload (res-s4, AC1)
- [ ] Click "Leave as-is" — confirm no marker appears and no artefact is touched (res-s4, AC2)
- [ ] Reopen a flagged stage — confirm its marker clears (res-s4, AC4)

### System health
- [ ] Error rate within baseline (current: [FILL IN], baseline: [FILL IN])
- [ ] Latency p95 within baseline (current: [FILL IN], baseline: [FILL IN])
- [ ] No new alerts firing
- [ ] Log scan for errors mentioning `earlier_stage_reopened`, `materiality_suggestion_generated`, `materiality_flag_set`, `materiality_flag_cleared`, or `materiality_operator_choice_recorded`
- [ ] Feature flags updated post-deployment: N/A — no flags in this release

---

## Rollback Triggers

Initiate rollback immediately if any of the following occur:
- [ ] Reopening a completed stage throws an error or corrupts the `completedStages` record instead of opening a live session
- [ ] A revision turn fails to save, or silently regenerates a DOWNSTREAM stage's artefact (a hard "never" per this feature's own scope — treat any occurrence as a rollback trigger, not a bug ticket)
- [ ] Error rate exceeds [FILL IN threshold]% for [FILL IN duration]
- [ ] Any other condition your normal production monitoring flags as release-correlated

**To rollback:** redeploy commit `2c654132` via your standard pipeline (see Rollback readiness above).

---

## Sign-Off

|  | Name | Date / time |
|--|------|-------------|
| **Deployment verified by** | | |
| **Stakeholders notified** | | |
| **Change closed** | | |

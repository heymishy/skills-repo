# Deployment Checklist: Feature Playback Demo Package (2026-10-18)

**Release window:** Staging — already live. Production — operator's own discretion.
**Change reference:** N/A — no CAB process configured
**Deployer:** Hamish King (Platform Owner) — production deploy is a manual, human-triggered action
**On-call contact:** N/A — no `tools.alerting` configured in `context.yml`

---

## Pre-Deployment

### Change governance
- [x] Change request reviewed (this document)
- [x] All 6 PRs merged and individually approved by the operator
- [ ] Production release window confirmed — at operator's own discretion, no fixed time

### Environment readiness
- [x] Staging deploy verified — `staging-deploy.yml` auto-triggers on push to `master`, confirmed working throughout this feature's own delivery (observed directly, e.g. run for commit `e42bc40f`)
- [x] Feature flag states confirmed: none — no flags used by this feature
- [x] Database migrations reviewed: N/A — no schema/data change in any of the 6 stories
- [x] Config changes confirmed: None
- [x] Artefact version confirmed: `master` @ `ed94cac5` (latest commit at trace time)

### Monitoring readiness
- [ ] Monitoring dashboards open — no `tools.monitoring` configured in `context.yml`; use `fly logs -a skills-framework` / `fly status -a skills-framework` as the available equivalent
- [ ] Log monitoring session open — no `tools.log_aggregation` configured; use `fly logs` as the available equivalent
- [x] Baseline noted: full regression suite 761/761 passing immediately before the last merge
- [ ] Alerting verified active — no `tools.alerting` configured

### Rollback readiness
- [x] Rollback procedure accessible: see Rollback Triggers section below, and the technical release notes' own Rollback section
- [x] Rollback mechanism available: `git revert` + redeploy — no dedicated rollback script exists or is needed (no migration)
- [x] Estimated rollback time noted: <5 minutes for staging; depends on operator action for production

---

## Deployment

- [x] Staging: automatic on each story's own merge to `master` — already complete for all 6 stories
- [ ] Production: operator runs `fly deploy -a skills-framework` from a checkout at the desired commit (`fly auth whoami` confirmed as `hamish@gemba.co.nz` in this session's own sandbox, matching every prior production release's own deployer)
- [ ] Deployment complete — confirm via `fly status -a skills-framework` showing the new machine version, and `fly releases -a skills-framework` showing a new release entry

---

## Post-Deployment Verification

### Smoke tests
<!-- Drawn from each story's own AC verification script -->
- [ ] Open `/playback` — confirm the feature list renders, including `2026-10-07-feature-playback-demo-with-video-and-or-screens-` itself (fpd-s1/fpd-s3)
- [ ] Open `/playback/2026-10-11-journey-cx-redesign` — confirm the coverage summary ("M of N ACs have captured evidence") renders before any story section, and at least one real screenshot displays inline (fpd-s4/fpd-s6)
- [ ] Confirm a zero-coverage feature's own `/playback/:slug` page states "0 of N ACs have captured evidence yet" rather than a blank or broken state (fpd-s6)

### System health
- [ ] Error rate within baseline — check via `fly logs -a skills-framework` for new 5xx responses on `/playback*` routes
- [ ] No crash-loop — check `fly status -a skills-framework` shows the machine in `started` state, not restarting (this is exactly what `fpd-s3`'s own real incident looked like — do not skip this check)
- [ ] Feature flags updated post-deployment: N/A — no flags used

---

## Rollback Triggers

Initiate rollback immediately if any of the following occur:
- [ ] `/playback` or `/playback/:slug` returns 5xx
- [ ] `fly status -a skills-framework` shows the machine restart-looping (the exact signature of `fpd-s3`'s own real incident)
- [ ] Any other existing route (unrelated to this feature) starts failing after this deploy — would indicate an unexpected interaction, since this feature is additive-only

**To rollback:** `git revert` the relevant merge commit(s) on `master`, push, then `fly deploy -a skills-framework` the reverted image (staging redeploys automatically on the push).

---

## Sign-Off

|  | Name | Date / time |
|--|------|-------------|
| **Deployment verified by** | | |
| **Stakeholders notified** | N/A — no stakeholder notification process configured | |
| **Change closed** | | |

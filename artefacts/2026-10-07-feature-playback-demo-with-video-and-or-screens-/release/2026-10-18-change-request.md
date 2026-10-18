# Change Request: Feature Playback Demo Package (2026-10-18)

**Request date:** 2026-10-18
**Requested by:** Claude Sonnet 5 (session), on behalf of Hamish King (Platform Owner)
**Change type:** Standard — lightweight record, no ITSM tool configured (`change_management` not set in `.github/context.yml`, `regulated: false`)
**Release window:** Staging already live (auto-deployed on each merge); production deploy window is at the operator's own discretion — no fixed window, manual trigger
**Change reference:** N/A — no CAB process configured for this repo
**ITSM ticket:** N/A

---

## Description of Change

Adds a "Playback" viewer to the app: sponsors can browse DoD-validated features and see each one's scope, benefit, and per-AC evidence (screenshots/video) in one place. 6 stories (`fpd-s1` through `fpd-s6`), all merged to `master`, all DoD-complete, traced clean.

---

## Business Justification

Closes the acceptance loop (M1) and sponsor feedback re-entry loop (M2) named in `benefit-metric.md` — without a viewer, "shared with sponsors" meant emailing file paths or opening raw files in GitHub. Both metrics remain `not-yet-measured` (no real feature has used the mechanism in its own natural workflow yet), but the mechanism itself is now proven to work end to end with real, non-synthetic evidence.

---

## Scope of Impact

**Systems affected:** `src/web-ui/` (new routes `/playback`, `/playback/:slug`, `/playback-media/*`); no change to any existing route's own behaviour.
**User groups affected:** Any authenticated user of this app's own web UI — read-only, no permission model change.
**Estimated users impacted:** All authenticated users gain access to a new page; no existing user-facing behaviour changes for anyone not using it.
**Data changes:** None — no schema or data migration in any of the 6 stories.
**Integrations affected:** None.

---

## Risk Assessment

**Risk level:** Low
**Risk basis:** All 6 stories are purely additive (new routes, new rendering functions) — nothing existing was removed or changed in a way other features depend on. One real production incident occurred during delivery (`fpd-s3`, 10-hour `wuce-staging` crash-loop from a Docker-image deployment-boundary gap) — already fully resolved same-day, root-caused, and the fix verified against the actual failure mode before the hotfix shipped.
**Mitigations:** Full regression suite (761 files) green on every story's own merge. The `fpd-s3` incident's specific root cause (a production route requiring a `scripts/`-only module) has a now-established fix pattern (`src/utils/dod-parsing.js`) that the rest of this feature's own stories correctly followed.

---

## Test Evidence

**Test plan:** `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/` (6 files, one per story)
**CI pipeline:** GitHub Actions (`tools.ci_platform: github-actions`) — pre-commit hooks run the full suite on every commit in this repo's own workflow
**Test environments:** Local (unit/integration, `node scripts/run-all-tests.js`), `wuce-staging.fly.dev` (live verification for `fpd-s1` AC3 and `fpd-s5` AC4), `skills-framework.fly.dev` (production — `fpd-s6`'s own live browser check, real data)
**Performance tested:** No dedicated performance test — all 6 stories were assessed at `/definition` as having no new performance-sensitive request-path computation
**Security reviewed:** Yes — code review confirmation at `/review`/`/definition-of-ready` per story; `fpd-s4`'s media-serving route has an explicit path-traversal guard with a dedicated test

---

## Deployment Plan

**Deployment type:** Mixed — staging is fully automated (`staging-deploy.yml` on push to `master`); production is manual (`fly deploy -a skills-framework`, no GitHub Actions production-deploy workflow exists in this repo)
**Estimated duration:** Staging: ~4 minutes (observed this session). Production: depends on the operator's own `fly deploy` run — typically a few minutes once triggered.
**Deployment window:** Staging already live as of each story's own merge. Production: at the operator's own discretion.
**Pre-deployment actions:** None required — all 6 stories are already merged to `master`.
**Approvals required:** None beyond the operator's own PR merge approval, already given for all 6 PRs.

---

## Rollback Plan

**Rollback procedure:** `git revert` the merge commit(s), push to `master`; staging redeploys automatically, production requires a manual `fly deploy` of the reverted image. Full detail in the deployment checklist.
**Estimated rollback duration:** <5 minutes for staging; depends on operator action for production.
**Rollback tested:** No — documented but not tested this specific release cycle. No schema/data migration involved, so rollback complexity is low.
**Trigger conditions:** `/playback` or `/playback/:slug` returning 5xx; the deploy's own smoke check failing.
**Complications:** None identified — all changes are additive.

---

## Communications

**Pre-deployment notifications:** None required — solo-operator repo, no separate stakeholder notification process configured.
**Post-deployment notifications:** None required.
**Customer communication required:** No — this is an internal pipeline tool, not a customer-facing product change.

---

## Approvals Required

| Role | Name | Status | Date |
|------|------|--------|------|
| Change owner | Hamish King (Platform Owner) | Approved (via PR merges) | 2026-10-15 – 2026-10-18 |
| CAB / approving authority | N/A — no CAB process configured | N/A | N/A |
| Production deploy trigger | Hamish King (Platform Owner) | **Pending** — manual `fly deploy` not yet run for this release's latest commits | — |

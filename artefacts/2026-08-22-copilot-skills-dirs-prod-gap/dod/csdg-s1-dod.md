# Definition of Done: Verify and wire the correct skills directory for this repo's own production deployment (csdg-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/864 | **Merged:** 2026-09-11 (merge commit `571681e4d1fbc65a84c8f0bbca0a938a35d8433a`)
**Story:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
**Test plan:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/test-plans/csdg-s1-test-plan.md
**DoR:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/dor/csdg-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent), independently re-verified live against real `wuce-staging.fly.dev` post-merge
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `flyctl secrets list -a skills-framework` (pre-merge): `COPILOT_SKILLS_DIRS` not set — confirmed real bug, not test-only | Live `flyctl` check | None |
| AC2 | ✅ | Pre-merge, live authenticated request against `skills-framework.fly.dev`: `POST /api/skills/benefit-metric/sessions` and `POST /api/skills/infra-definition/sessions` both `400 SKILL_NOT_FOUND` | Live browser verification (real GitHub OAuth session) | None |
| AC3 | ✅ | **Live, post-merge, against `wuce-staging.fly.dev`** (master auto-deploys there — see Deploy Topology note below): the exact same two calls now return **`201`** with real session IDs (`bbd53e70-...`, `e2846c18-...`) | Live browser verification, post-merge, post-deploy | See Deploy Topology note — production (`skills-framework.fly.dev`) itself has not yet received this fix |
| AC4 | ✅ | New test file 4/4 passing on merged master; live staging call above confirms `infra-definition` resolves correctly alongside `benefit-metric` — no regression | Automated test + live verification, both post-merge | None |
| AC5 | ✅ | Automated tests confirm the fresh-consumer-repo fallback and explicit-override behaviour are both unchanged; 18/18 existing `skill-discovery.test.js` tests re-run fresh on merged master with zero regression | Automated test, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-csdg-s1-root-skills-dir-default.js` — 4/4 passing; `tests/skill-discovery.test.js` — 18/18 passing (unmodified, zero regression).

---

## Deploy Topology (real, current gap — not this story's own scope to close)

Pushing to master auto-deploys only to `wuce-staging.fly.dev` (confirmed via `gh run list --workflow=staging-deploy.yml` post-merge — the `Deploy to wuce-staging` job succeeded within ~1 minute of merge). Production (`skills-framework.fly.dev`) deploys only via the separate, manually-gated `Promote to production` job, which was still sitting in `waiting` status at the time of this DoD. **This means the live fix confirmed above is on staging, not yet on production** — production still returns `400 SKILL_NOT_FOUND` for these two skills until an operator approves the promotion. This is the same deploy-topology pattern already documented in `pst-s1`'s own DoD (2026-09-03) — an intentional, human-gated safety boundary, not a defect in this story's own delivery.

---

## Scope Deviations

None. Confirmed via `gh pr view 864 --json files`: the merged diff touches exactly `src/adapters/skill-discovery.js` (the one function named in the story's Architecture Constraints) plus the new test file, `decisions.md`, and artefacts/pipeline-state.json bookkeeping. No Fly secret or deployment configuration was touched, matching the story's own "implementer decides, but this avoids the alternative" framing recorded in `decisions.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 (AC1/AC2 via live investigation, AC3/AC4/AC5 via automated tests)
**Tests passing on merged master:** 4/4 new + 18/18 existing (unmodified) = 22/22

**Gaps:** None.

---

## NFR Status

Not applicable — story states none identified across all 4 categories.

---

## Metric Signal

**JSON API availability / correctness for `POST /api/skills/:name/sessions`** — directly measurable now: pre-merge, 2 of 2 real skill names tested returned `400`; post-merge, on staging, 2 of 2 return `201`. Production remains unmeasured until `promote-to-prod` is approved (see Deploy Topology above).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The deviation is the deploy-topology gap above — the fix is merged, tested, and live-confirmed on staging, but production itself still runs the pre-fix code pending a human-only promotion approval this agent must not and did not perform.

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions to ship this fix to `skills-framework.fly.dev` — the exact deployment this story's own AC1/AC2 investigation reproduced the bug against. Owner: Hamish King (the `environment: production` protection rule requires explicit reviewer approval; this is a human action the agent cannot and should not perform). **Until this runs, `benefit-metric`, `infra-definition`, and every other real skill name remain unreachable via this JSON API on production.**

---

## DoD Observations

1. This story is a second, independent confirmation of the `pst-s1`-established deploy-topology pattern (auto-staging, manual-prod) — worth treating as a durable, repo-wide convention rather than a one-off finding: any post-merge live-verification pass on this repo must explicitly check which environment it actually reached (`gh run list --workflow=staging-deploy.yml` is the fast way to confirm) before claiming a production bug is closed, since "merged to master" and "live on `skills-framework.fly.dev`" are two different, independently-gated facts.
2. Same `pipeline-state.json` `stage`/`prStatus` silent-revert issue found and corrected as `vcb-s1`'s own DoD Observation #1 documents. Corrected here identically, on master, post-merge.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Verify and wire the correct skills directory for this repo's own production deployment" (csdg-s1).
Check:
1. Is it unambiguous that production (skills-framework.fly.dev) still has the bug until promote-to-prod is approved?
2. Is the staging-vs-production distinction backed by real evidence (a real 201 response with a real session ID), not assumed?
3. Is the outcome verdict (COMPLETE WITH DEVIATIONS) consistent with the AC and deviation rows?
```

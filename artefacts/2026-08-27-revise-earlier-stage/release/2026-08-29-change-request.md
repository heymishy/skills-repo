# Change Request: Revise an Earlier Stage Mid-Journey (2026-08-29)

**Request date:** 2026-08-29
**Requested by:** Hamish King — Platform Owner
**Change type:** Standard
**Release window:** [NEEDS INPUT — no change management tool configured in `context.yml`; set a window before deploying]
**Change reference:** N/A — no ITSM tool configured (`context.yml` has no `change_management.tool`)
**ITSM ticket:** Not applicable — lightweight change record only, per repo configuration

---

## Description of Change

Adds the ability to reopen a previously gate-confirmed outer-loop stage for further live conversation and revise its artefact in place, with the model suggesting (never auto-triggering) whether the revision is material enough to affect downstream stages, and letting the operator flag, dismiss, or otherwise handle that suggestion.

---

## Business Justification

Two operators (Hamish, Abhi), each running the full outer loop solo, hit a hard wall mid-journey: no way to fix an earlier stage without abandoning or restarting the whole journey. The platform is in active beta with real users and demos — this gap is now costly in both contexts (see `artefacts/2026-08-27-revise-earlier-stage/discovery.md`, "Why Now").

---

## Scope of Impact

**Systems affected:** `src/web-ui` — routes `journey.js`, `skills.js`; modules `journey-store.js`, `journey-store-pg.js`, `materiality-check.js`; `server.js` route registrations.
**User groups affected:** All operators running the outer loop pipeline (solo product owner + engineer persona).
**Estimated users impacted:** All active journey operators — this changes existing, always-visible step-nav behaviour (completed-stage links now go live instead of read-only).
**Data changes:** Additive only — a new `flaggedStages` array field on the journey record (in-memory, disk, and Postgres). No schema migration; no existing field renamed or removed.
**Integrations affected:** None external. Internal: PostHog event stream gains 5 new event types (`earlier_stage_reopened`, `materiality_suggestion_generated`, `materiality_flag_set`, `materiality_flag_cleared`, `materiality_operator_choice_recorded`).

---

## Risk Assessment

**Risk level:** Low
**Risk basis:** Additive-only data model change, no removed/renamed surfaces, extensive test coverage (4 stories, 100+ tests combined, two mandatory final cross-task review rounds per story that specifically found and fixed pre-merge integration gaps automated tests alone missed), and a live browser confirmation of the final story's UI behaviour. The one open scope boundary (flags on never-reached stages have no clear path yet) is a deliberate, documented, low-severity RISK-ACCEPT, not an unknown.
**Mitigations:** Feature reuses existing skill-session infrastructure rather than introducing new mechanisms; "no automatic downstream regeneration" is enforced as a hard boundary throughout (verified by test and by code inspection — the flag/leave-as-is handler has zero artefact-write code paths).

---

## Test Evidence

**Test plan:** `artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s1-test-plan.md` through `res-s4-test-plan.md`
**CI pipeline:** GitHub Actions — see each PR (#780, #781, #782) for its own run; no external CI/CD platform configured beyond that
**Test environments:** Local (full suite, 565/565 files passing as of this release, 1 pre-existing unrelated flake documented and RISK-ACCEPTed), CI (GitHub Actions), staging (2 `@real-staging` Playwright scenarios passing on res-s4's PR)
**Performance tested:** Not formally load-tested; the one performance NFR (materiality judgment adds at most one model turn) is verified — the shipped implementation makes zero additional model/executor calls, exceeding the target.
**Security reviewed:** No new input surface introduced beyond existing authenticated session handling; no dedicated security review beyond standard code review.

---

## Deployment Plan

**Deployment type:** Automated
**Estimated duration:** [NEEDS INPUT — depends on your deployment pipeline]
**Deployment window:** [NEEDS INPUT]
**Pre-deployment actions:** None — no migrations, no config, no feature flags to pre-stage.
**Approvals required:** [NEEDS INPUT — no change management tool configured; confirm who needs to sign off internally]

---

## Rollback Plan

**Rollback procedure:** Redeploy prior commit `2c654132` via the same automated pipeline. Summary only — full detail in the deployment checklist.
**Estimated rollback duration:** [NEEDS INPUT — same as deployment duration, depends on your pipeline]
**Rollback tested:** No — not drilled as a dedicated exercise this cycle. The mechanism (redeploy a prior commit) is the platform's standard rollback path.
**Trigger conditions:** See deployment checklist's Rollback Triggers section.
**Complications:** None identified — additive-only change set.

---

## Communications

**Pre-deployment notifications:** [NEEDS INPUT — solo-operator context; confirm if any stakeholder/demo-audience notice is needed]
**Post-deployment notifications:** [NEEDS INPUT]
**Customer communication required:** No — internal beta platform, no external customer-facing release notice identified as required. Confirm if this has changed.

---

## Approvals Required

| Role | Name | Status | Date |
|------|------|--------|------|
| Change owner | Hamish King — Platform Owner | Pending | |
| Approving authority | Not applicable — no CAB/ITSM process configured | — | |

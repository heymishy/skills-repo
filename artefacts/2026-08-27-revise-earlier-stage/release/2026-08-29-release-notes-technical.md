# Release Notes — Technical: Revise an Earlier Stage Mid-Journey (2026-08-29)

**Release date:** 2026-08-29
**Release type:** Standard
**Stories included:** 4
**Pipeline build:** N/A — no CI/CD platform configured in `context.yml`; see each story's PR for its own GitHub Actions run

---

## Changes

### res-s1 — Reopen a completed stage's live session from the step-nav

- **PR:** (merged prior to this session's summarized window — see `artefacts/2026-08-27-revise-earlier-stage/dod/res-s1-dod.md`)
- **What changed:** The step-nav's "done" stage links now route directly into a live, resumable chat session for that stage instead of a static read-only view, for any previously completed stage (not just the immediately-preceding one).
- **ACs delivered:** confirmed complete per `dod/res-s1-dod.md`
- **Scope deviations:** None recorded blocking; one audit-logging NFR gap noted and later corrected (see Known Issues below)
- **Test coverage:** `tests/check-res-s1-reopen-completed-stage-live-session.js` — 19/19 passing

### res-s2 — Overwrite a reopened stage's artefact in place on revision

- **PR:** #780 | **Merged:** 2026-08-28
- **What changed:** A revision turn in a reopened session now overwrites the stage's artefact in place at its existing file path (matching the pre-existing artefact-storage model — no new versioning), without creating a duplicate `completedStages` entry.
- **ACs delivered:** confirmed complete per `dod/res-s2-dod.md`
- **Scope deviations:** COMPLETE WITH DEVIATIONS — an audit-logging NFR gap on the artefact-overwrite sub-flow (no dedicated test, missing `journeyId`/`timestamp` fields on that specific log event) was recorded and remains open; see Known Issues.
- **Test coverage:** see `dod/res-s2-dod.md` for the full breakdown

### res-s3 — Suggest whether a stage revision is material to downstream stages

- **PR:** #781 | **Merged:** 2026-08-28
- **What changed:** After a revision to a completed stage, the model assesses whether the change is material to downstream stages (deterministic section-diff on Problem Statement / MVP Scope / Constraints) and presents the judgment in the same chat turn's response, paired with a `suggestionId` for later acceptance-rate tracking. A final cross-task review found and fixed a real pre-merge gap: the first implementation only emitted the suggestion server-side, with no client-side consumer to render it.
- **ACs delivered:** 5/5 (AC5 — D37 adapter wiring — added during implementation planning)
- **Scope deviations:** A documented, RISK-ACCEPTed classifier boundary case (an in-target-section wording-only edit reads as "material") — an accepted consequence of the deterministic-diff design, not a defect.
- **Test coverage:** 34/34 passing (`tests/check-res-s3-suggest-revision-materiality.js`)

### res-s4 — Act on a materiality suggestion without auto-triggering downstream changes

- **PR:** #782 | **Merged:** 2026-08-29
- **What changed:** The operator can flag downstream stages (visible step-nav marker, no artefact change), leave them as-is, or handle it differently via free-text — all recorded and paired with res-s3's original suggestion for an acceptance-rate computation. Flags clear when the flagged stage is reopened and viewed. Two rounds of the mandatory final cross-task review found and fixed real gaps: a third step-nav render site missing the marker, a flag-union bug, and a client-side fix whose render logic never actually re-ran after the triggering click (fixed via an in-place DOM patch).
- **ACs delivered:** 4/4
- **Scope deviations:** A documented, RISK-ACCEPTed scope boundary — a flag on a downstream stage the operator hasn't yet reached has no resolution path until that stage is first reached and reopened (see `decisions.md`, finding O2).
- **Test coverage:** 36/36 passing (`tests/check-res-s4-operator-acts-on-materiality-suggestion.js`); route/handler E2E coverage: 19/20 local specs passing (1 pre-existing, unrelated failure confirmed via baseline comparison — see Known Issues) plus 2 `@real-staging` specs passing in CI.

---

## Dependencies and Prerequisites

None — this feature reuses existing skill sessions, the existing artefact-storage model, and the existing `journey-store.js` `STAGE_SEQUENCE` constant. No new infrastructure, no feature flags, no database migrations.

---

## Configuration Changes

| Setting | From | To | Applied by |
|---------|------|----|-----------|
| None | — | — | — |

---

## Database / Data Changes

None — no schema migration. res-s4 adds one new field (`flaggedStages`, an array) to the existing in-memory/disk/Postgres journey record; the Postgres adapter's field allowlist (`journey-store-pg.js`'s `_sanitise()`) was updated to include it (a code change, not a schema migration — the underlying column is a JSON blob).

---

## Feature Flags

| Flag | State before | State after deployment | When to flip (if staged) |
|------|-------------|----------------------|--------------------------|
| None | — | — | — |

---

## Known Issues / Limitations

- **Audit-logging NFR gap (res-s1/res-s2):** the artefact-overwrite sub-flow's audit event is missing a dedicated test and `journeyId`/`timestamp` fields. Not blocking — the reopen flow's own audit event (`earlier_stage_reopened`) is correctly and unconditionally fired and tested. Recommended as a follow-up story.
- **AC3 classifier boundary case (res-s3):** an in-target-section wording-only edit is classified "material" rather than "minor" — an accepted, documented consequence of the deterministic-diff design (RISK-ACCEPT, `decisions.md` 2026-08-28), not a functional defect.
- **Flag resolution-path scope boundary (res-s4):** a flag on a not-yet-reached downstream stage has no clearing mechanism until that stage is first reached and reopened (RISK-ACCEPT, `decisions.md` 2026-08-29, finding O2). Revisit trigger tied to live M2 acceptance-rate data.
- **Pre-existing, unrelated E2E failure found during res-s4's verify-completion:** `tests/e2e/dsda-s1-default-all-stories.spec.js` — a gate-confirm redirect defect after the `definition` stage, confirmed via a clean baseline-worktree comparison to be unrelated to this feature. Recommended as a separate short-track story.
- **Pre-existing, recurring test-infrastructure flake:** `tests/check-p3.5-validate-trace.js` — RISK-ACCEPTed 4/4 times across every story's branch-setup in this feature. Recommended as a separate short-track story to root-cause.
- **`/improve` learnings PR (#783, merged 2026-08-29):** deferred two related process-improvement findings behind existing pending-review proposals on `/definition-of-ready` and `/subagent-execution` rather than duplicating — see `.github/architecture-guardrails.md`'s Anti-Patterns table for both.

None of the above block this release — all are documented, accepted, or already routed to follow-up.

---

## Rollback

**Procedure:** Redeploy the prior known-good commit (`2c654132`, master's HEAD immediately before res-s1 first merged) via the same automated deployment pipeline used for this release. No database/schema changes to reverse — the new `flaggedStages` field is additive and ignored by pre-feature code paths.
**Tested:** Not tested as a dedicated rollback drill this cycle. The underlying mechanism (redeploy a prior commit via the existing automated pipeline) is the platform's standard rollback path and was exercised implicitly by every prior release, but this specific release's rollback was not drilled end-to-end. **Operator: confirm this framing matches your actual deployment/rollback tooling before relying on it — I don't have visibility into your production deployment mechanism beyond this repo's own CI.**
**Estimated duration:** Not known — depends on your deployment pipeline's own redeploy time. Fill in before submission.
**Complications:** None identified — the change set is additive (new field, new endpoint, new render markup); no removed fields, no renamed routes.
**Trigger conditions:** See Deployment Checklist.

# Definition of Done: Separate staging and prod PostHog projects with isolated API keys

**PR:** https://github.com/heymishy/skills-repo/pull/446 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.2-staging-prod-project-separation-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.2-staging-prod-project-separation-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Staging `NODE_ENV` selects the staging PostHog project key exclusively | automated test | None |
| AC2 | ✅ | Production selects the prod key exclusively, never staging | automated test | None |
| AC3 | ✅ | Unit-level: PostHog client mock-inspected, constructed with the staging key even when both keys present in test config | automated test | Live E2E confirmation is a DoR PROCEED-BLOCKED condition, not this AC — see below |
| AC4 (Acceptance Criterion 4) | ✅ | Missing/misconfigured staging key logs a clear startup error identifying the missing key; never silently falls back to the prod key | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #446 touched exactly its declared touchpoints plus the new `posthog-node` runtime dependency (disclosed and reasoned in `decisions.md`, 2026-07-10, ARCH — a permitted new dependency for web-ui work per discovery.md Constraints, injected via `deps.PostHogClient` so tests never construct a real client).

**Explicitly out of this story's build (per the story's own scope boundary and ADR-018/PAT-06 — Approved Pattern 06, "Execution pre-condition gate on runtime artefact existence"):** "The live cross-contamination confirmation (real staging Playwright traffic never reaching the real prod project) — per ADR-018/PAT-06, this is a DoR PROCEED-BLOCKED condition deferred until Epic 2 (staging environment) and bri-s3.4 are DoD-complete. Not built or tested here." This is the single most important open item for this story — see Follow-up actions.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing in CI:** 12 / 12 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1/AC2 (staging/prod key selection) | ✅ | ✅ | |
| AC3 (unit-level client construction) | ✅ | ✅ | |
| AC4 (misconfigured key → clear startup error, no silent fallback) | ✅ | ✅ | |
| N3 (error-path log line never contains a key value) | ✅ | ✅ | |
| Remaining unit tests | ✅ | ✅ | |

**Gaps (tests not implemented):** None against the unit-level ACs. The live E2E confirmation is a DoR-scoped PROCEED-BLOCKED item, not a missing test against this story's own written ACs.

**Coverage gap audit (per DoD Step 4):**
- Was the PAT-06 gate RISK-ACCEPTed in `/decisions` before coding started? The DoR contract's own "What will NOT be built" section states this explicitly and names the precondition (Epic 2 + bri-s3.4 both DoD-complete) — functionally equivalent to a RISK-ACCEPT, though not logged under that literal decision-category tag in `decisions.md`.
- Has the precondition now been met? **Yes, as of this DoD sweep.** All of Epic 2 (bri-s2.1 through bri-s2.6) and bri-s3.4 are being advanced to `dodStatus: complete` in this same sweep — PAT-06's structural precondition is satisfied for the first time.
- Was the live cross-contamination check actually executed? **No.** bri-s3.4's shipped tests verify application-layer tenant isolation (Postgres-backed data), which is a distinct concern from PostHog analytics-event routing between the staging and prod *projects* — confirmed via cross-reference with bri-s3.4-dod.md. The live check inherently requires a real staging deploy exercising real Playwright traffic against both real PostHog projects, which has never happened.
- **This is now an actionable, no-longer-blocked open gap** — not a failure, but a real follow-up that should not sit indefinitely now that its precondition is met.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Staging and prod keys never both present in the same environment's config | ✅ | Confirmed via code review of the key-selection logic |
| Startup log records which project is configured without logging the key value | ✅ | N3 confirms no raw key value in error-path log output |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 3 — Zero staging/prod PostHog cross-contamination | ✅ (not yet established) | Not yet — the unit-level mechanism is real and tested, but the live confirmation (see above) has never run | Recording honestly: the mechanism is structurally sound, but "zero contamination" as a measured fact has not yet been observed against real infrastructure |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action required, no owner yet assigned — now unblocked and actionable:** with Epic 2 and bri-s3.4 both reaching DoD in this sweep, PAT-06's precondition is satisfied for the first time. Run a real staging deploy, drive real Playwright traffic against it, and confirm no event/flag-toggle activity ever appears in the real prod PostHog project. This is distinct from — and not satisfied by — bri-s3.4's application-layer tenant-isolation tests. No `decisions.md` or `pipeline-state.json` action item currently tracks this; this DoD sweep is the first point at which it becomes trackable as "ready to execute" rather than "structurally blocked."

---

## DoD Observations

1. **This story's DoR contract used the PAT-06 pattern correctly** — the live-verification gap was disclosed as a structural precondition at DoR time rather than silently assumed, and this DoD sweep is the first point at which that precondition is actually met. This is a good example of the pattern working as designed, but — same lesson as tir-s6 elsewhere in this pipeline's history — a satisfied precondition does not by itself constitute completed verification; the actual check still needs to run. **Tag: /improve candidate** — worth adding an explicit `pendingActions` entry in `workspace/state.json` now that this gate is unblocked, so it doesn't silently fall off the radar the way tir-s6's DATABASE_URL gap nearly did before being caught.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Separate staging and prod PostHog projects with isolated API keys" (bri-s1.2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the PAT-06 live-verification gap now correctly framed as "unblocked and actionable" rather than still "structurally blocked"?
Report findings as HIGH / MEDIUM / LOW.
```

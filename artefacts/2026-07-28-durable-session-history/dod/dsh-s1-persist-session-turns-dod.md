# Definition of Done: Persist a stage's session turns to Postgres on completion

**PR:** https://github.com/heymishy/skills-repo/pull/625 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s1-persist-session-turns-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s1-persist-session-turns-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-dsh-s1-persist-session-turns.js` — "AC1: writeSessionTurns inserts journey_id, tenant_id, skill_name, turns" plus a dedicated regression test driving the real `handlePostTurnStreamHtml` call site, confirming the persisted `turns` array includes the completing assistant turn | automated test | None — see note below |
| AC2 | ✅ | "AC2: second completion write for the same stage upserts, one row remains" | automated test | None |
| AC3 | ✅ | "AC3: writeSessionTurns failure does not throw past the caller" | automated test | None |
| AC4 | ✅ | "AC4: writeSessionTurns throws when setSessionTurnsStore has not been called" — exact error message asserted | automated test | None |
| AC5 | ✅ | "AC5: two tenants' turns are stored and read back without cross-contamination" — run against real `wuce-staging` Postgres, not a mock | real-database integration test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

**Note on AC1:** the implementation shipped in the merged PR is correct, but it did not arrive that way on the first pass. During `/subagent-execution`'s final cross-task review, a dedicated review subagent found that the original wiring in `routes/skills.js` read `session.turns` for the Postgres write *before* the completing assistant turn (containing the artefact) was pushed onto that same array a few lines later — so every persisted conversation would have been missing its own final turn. This was fixed and covered by a new regression test (proven red before the fix, green after) prior to `/verify-completion` and the PR being opened. No deviation shipped in the merged code; recorded here per CLAUDE.md's practice of tracing how a defect was caught, since per-task review alone did not catch it — only the fresh cross-task review did.

---

## Scope Deviations

None. All 9 commits on the branch map to the implementation plan's 6 tasks plus two fix commits that both trace directly to AC1 (the ordering defect above, and a follow-up fix to the regression test's own environment-variable cleanup that was silently disabling AC5's real-database run). Confirmed against the story's Out of Scope section: no read path, no archive/rehydrate mechanism, and no change to the existing Redis delete-on-completion behaviour were touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 6 / 6 (5 planned + 1 regression test added after the final-review finding)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: completion write inserts row with correct fields | ✅ | ✅ | |
| AC2: re-completion upserts, no duplicate | ✅ | ✅ | |
| AC3: failed write doesn't block completion flow | ✅ | ✅ | |
| AC4: unwired adapter throws | ✅ | ✅ | |
| AC5: real Postgres wiring, two tenants, no cross-contamination | ✅ | ✅ | Ran against real `wuce-staging` Postgres via a Fly-secrets-sourced `DATABASE_URL`, never a local `.env` value |
| AC1 regression: persisted turns include completing assistant turn | ✅ (added post-review, not in original test plan) | ✅ | Drives the real `handlePostTurnStreamHtml` call site, not just the adapter in isolation |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — write adds no more than ~100ms to the completion response path | ✅ | The write is fire-and-forget (`.catch()`, not awaited before the response is sent) — confirmed by code review of the call site in `routes/skills.js`, matching the existing Redis-write pattern this NFR was modelled on. No formal timing measurement was taken (none is available for this internal surface, per `nfr-profile.md`). |
| Security — every row carries `tenant_id`; no row omits it | ✅ | AC1/AC5 assert `tenant_id` is present on every written row; AC5's real-database test confirms two distinct tenants' rows never cross-contaminate. |
| Security — turn content never includes `accessToken` | ✅ | Turn objects are always `{role, content}` where `content` is either the operator's own answer text or the model's response text — `accessToken` is never part of this shape, confirmed by code review. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1 — Resume conversation link success rate | ✅ (baseline ~0%) | Not yet — requires dsh-s2 (read path) and dsh-s4 (resume UI) to also ship | Infrastructure-only story; no user-facing surface shipped yet. `contributingStories` for m1 updated to include this story in pipeline-state.json (was empty; corrected to match `benefit-metric.md`'s Metric Coverage Matrix). |
| m2 — Breadcrumb view-completed-stage shows real conversation | ✅ (baseline 0%) | Not yet — requires dsh-s2 (read path) and dsh-s3 (breadcrumb rebuild) to also ship | Same as above; `contributingStories` for m2 also corrected. |

Signal recorded as `not-yet-measured` for both metrics this story contributes to. m3 (turn storage stays bounded) does not list this story as a contributor (dsh-s5/dsh-s6 only) and is unaffected.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None required to close out dsh-s1 itself. The epic (dsh-e1) is not yet complete — dsh-s2 through dsh-s6 remain DoR-signed-off but unimplemented.

---

## DoD Observations

1. **Feature-level guardrails were left at their DoR-time assessment, not overwritten to `/definition-of-done`.** The feature's `guardrails[]` entries for ADR-025, ADR-026, ADR-027, NFR-performance, NFR-security, NFR-availability, NFR-compliance, and NFR-data-residency were all assessed at `/definition-of-ready` / `/review` time with evidence describing all 6 stories collectively (e.g. "All 6 stories name a directional latency target"). Since only dsh-s1 (1 of 6) has actually merged, mechanically overwriting `assessedBy: "/definition-of-done"` now — per this skill's literal Step 5 instruction — would misrepresent these as fully verified in production when 5 of 6 stories are still unimplemented. Judgment call: left as-is; the guardrails should move to `/definition-of-done` assessment once the epic's final story (dsh-s6) reaches its own DoD, at which point the evidence text can honestly say all 6 stories shipped. Flagging as a `/improve` candidate: the DoD skill's guardrail-update instruction doesn't currently distinguish feature-level (epic-wide) guardrails from story-scoped ones, and could use explicit guidance for the epic-nested, story-by-story-merge case.
2. **`contributingStories` arrays in `pipeline-state.json`'s `metrics[]` were empty for every feature in this file, not just this one** — a pre-existing, repo-wide sync gap between `/definition`-time benefit-metric matrices and pipeline-state.json's mirrored `metrics[]` array. Corrected for this feature's m1/m2 (added `dsh-s1-persist-session-turns`) since Step 6 of this skill depends on that field being populated; dsh-s2 through dsh-s4's own DoD runs should add themselves to the same arrays as they ship. Flagging as a `/improve` candidate: either `/definition` should populate this field at authoring time, or the DoD skill should read the benefit-metric artefact's matrix directly rather than relying on a field that has apparently never been populated in this repo's history.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Persist a stage's session turns to Postgres on completion (dsh-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

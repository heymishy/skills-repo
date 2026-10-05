# Definition of Done: dismissed-signals-store's _persist() must create its parent directory before writing

**PR:** https://github.com/heymishy/skills-repo/pull/943 | **Merged:** 2026-10-05
**Story:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/stories/dswf-s1-create-parent-dir-before-persist.md
**Test plan:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/test-plans/dswf-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/dor/dswf-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — write succeeds when the parent directory doesn't exist | ✅ | Dedicated unit test reproduces the exact production failure mode (a path under a not-yet-created nested temp subdirectory), confirms the write succeeds and a second independent adapter instance reads the persisted key back correctly | `integration-real-code` (real fs I/O, no mocking) | None |
| AC2 — write behaviour unchanged when the directory already exists | ✅ | Dedicated unit test confirms identical behaviour to pre-fix for the common case | `integration-real-code` | None |
| AC3 — all 14 pre-existing sptu-s4 tests still pass | ✅ | Full re-run of `tests/check-sptu-s4-signals-dismiss.js`: 16/16 passing (14 pre-existing + this story's own 2 new tests) | `integration-real-code` (regression) | None |
| AC4 — real staging re-verification: a real dismiss succeeds post-deploy, no new ENOENT in logs | ✅ | **Live-verified on real `wuce-staging`, 2026-10-06**, post-merge, authenticated session: clicked "Dismiss" on a real signal — it genuinely vanished (real POST + redirect, no 500); confirmed via real `fly logs --app wuce-staging --no-tail` showing zero `ENOENT`/error lines around the request; reloaded with `?showDismissed=true` and confirmed the "✓ Dismissed" marker and real persistence; clicked "Undismiss" and confirmed the signal returned to the default view, also error-free in the logs. Full round-trip (dismiss → persist → undismiss) verified end-to-end against the real production code path and the real D37-wired adapter. | `live-verified` (real staging, authenticated, post-merge, real log evidence) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The Dockerfile's `COPY` allowlist was explicitly not touched, per this story's own Architecture Constraints and `decisions.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2 (plus the full suite, 715/716 and 716/716 across the various post-merge runs, only the already-known unrelated `discovery_approved` failure)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| dismiss() succeeds and persists when the target directory doesn't exist (AC1) | ✅ | ✅ | Reproduces the exact real production ENOENT locally |
| dismiss() behaves identically when the directory already exists (AC2) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` — pure backend module fix, no rendered UI change. AC4 was deliberately designed as a manual/live check rather than an automated test, since the entire premise of this story is that purely-automated/local verification already failed to catch the original bug once — it has now been performed and closed (see AC4's evidence row above), not deferred or skipped.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — `mkdirSync` adds no measurable overhead | ✅ | Documented Node.js behaviour (fast no-op on an existing directory); confirmed no change to the full suite's own run time pattern across multiple post-fix runs |
| Security — no new attack surface | ✅ | No new input surface; directory created with inherited default permissions, matching the existing precedent at `server.js:2750`/`reference-validator.js:54` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 3 — Dismiss retention | ✅ | Now (re-confirmed) | This story is the fix that makes `sptu-s4`'s own Metric 3 claim actually true in a real deployed environment, not just locally |

**Metric 3 — Signal: on-track**
**Evidence:** Real, live, authenticated dismiss → reload-with-persistence → undismiss round-trip on `wuce-staging`, 2026-10-06, zero errors in real `fly logs` at any step. This supersedes `sptu-s4`'s own original Metric 3 claim (which was `integration-real-code`/local-only and, per this story's own existence, did not actually hold in a real deployed environment until this fix) — Metric 3's real-world validity is now genuinely confirmed, not just locally measured.
**Date measured:** 2026-10-06

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story itself. Standing, cross-cutting: this is the 3rd occurrence of the same root-cause class in this codebase (a runtime-generated file's directory missing in a minimal/curated Docker image) — a dedicated audit of other file-write call sites for the same gap is named as a real `/improve` candidate in this story's own Out of Scope section, not yet scheduled.

---

## DoD Observations

1. **This story exists because a real, live staging check caught something no amount of local/unit/CI testing ever would have** — the operator's own "Validated on Chrome? On staging?" question, followed by an explicit request to actually perform that check, directly surfaced a production-breaking bug in already-merged, already-DoD-marked-COMPLETE code (`sptu-s4`). This is a strong, concrete argument for making a real staging check a more regular (not just occasionally-prompted) part of this pipeline's own `/verify-completion`/`/definition-of-done` discipline for any story touching a runtime-writable file path — logged here as a real `/improve` candidate, not acted on unilaterally.
2. `sptu-s4`'s own DoD artefact was given a post-hoc addendum (not silently edited) flagging this exact gap, rather than quietly correcting its original COMPLETE verdict — see `artefacts/2026-10-04-signals-panel-triage-ux/dod/sptu-s4-dod.md`'s own addendum, 2026-10-06.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "dismissed-signals-store's _persist() must create its parent directory before writing" (dswf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

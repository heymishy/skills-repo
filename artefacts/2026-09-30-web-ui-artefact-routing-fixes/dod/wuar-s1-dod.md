# Definition of Done: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done

**PR:** https://github.com/heymishy/skills-repo/pull/929 | **Merged:** 2026-09-29
**Story:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/stories/wuar-s1.md
**Test plan:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/test-plans/wuar-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/dor/wuar-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — drift-guard extension: 3 new skills appear in drift array when unoverridden | ✅ | `checkModelRoutingDriftReturnsAllEightWhenNoOverridesSet` — confirmed on master post-merge: `node tests/check-psrc-verify-s3-model-routing-drift.js` → 7/7 pass; `DRIFT_GUARD_SONNET_SKILLS` in `src/web-ui/config/model-routing.js` confirmed to contain all 8 skills on master | `unit` | None |
| AC2 — existing 5 + new 3 all pass when correctly overridden | ✅ | `checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet` — same test run, 0 regressions for the original 5 | `unit` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

**Verification strength note:** both ACs are pure-function contract claims (`checkModelRoutingDrift(envVars)`'s own return-value behaviour) — `unit` evidence is the correct, sufficient tier here, not a UI-observable or external-system claim requiring `live-verified` evidence. The *separate*, real-world claim that this mechanism now protects production — i.e. that `benefit-metric`/`decisions`/`definition-of-done` are actually routed to Sonnet in the deployed environment — depends on the real `WUCE_MODEL_OVERRIDE_*` Fly secrets being set, which is explicitly out of this story's scope (see Story's Out of Scope section) and is recorded as a Follow-up Action below, not a deviation.

---

## Scope Deviations

None. The originally-planned `/review` save-path fix (AC1–AC3 in the story's own v1 draft) was caught as a false premise during implementation and fully reverted before any commit — see `decisions.md` Decision 1. The merged PR contains only the confirmed drift-guard extension; no out-of-scope behaviour was introduced.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2 (plus the 5 pre-existing `psrc-verify-s3` tests, all still passing — 7/7 total in the updated file)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `checkModelRoutingDriftReturnsAllEightWhenNoOverridesSet` (AC1) | ✅ | ✅ | Updated in place from the original 5-skill assertion, per the test plan's own Note on this |
| `checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet` (AC2) | ✅ | ✅ | Pre-existing test, unaffected by the extension |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| All 4 categories (Performance/Security/Accessibility/Audit) | ✅ N/A | Story's own NFR section states all 4 as Not Applicable — a 3-element array extension to an existing constant, no new input surface, no UI |

---

## Metric Signal

This is a short-track bug/hardening fix, not a metric-tracked feature (no `metrics[]` entries reference `wuar-s1`). No metric signal applicable — matches this story's own Benefit Linkage, which cites direct code/log evidence (the confirmed `fly secrets list` gap) rather than a tracked metric.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Marked "with deviations" not because the merged code has any gap against its own (corrected, narrowed) ACs — it does not — but to keep the still-pending Fly secret configuration visibly tracked at the outcome level rather than only inside a Follow-up Action, since without it the shipped code has no live effect yet.

**Follow-up actions:**
1. **[Requires explicit operator authorization]** Set `WUCE_MODEL_OVERRIDE_BENEFIT_METRIC`, `WUCE_MODEL_OVERRIDE_DECISIONS`, `WUCE_MODEL_OVERRIDE_DEFINITION_OF_DONE` as real Fly secrets on both `wuce-staging` and `skills-framework`, matching the existing 5 secrets' own convention (`psrc-verify-s2`'s precedent). Until this is done, the shipped drift-guard code is correct but inert in production — `benefit-metric` remains unprotected exactly as before, now merely *detectable* rather than *prevented*. Owner: operator (production infrastructure change, not a code task).
2. Repairing any other, not-yet-found feature whose artefacts may show a similar Haiku-drift content pattern to `web-ui-learnings-and-improvements` — a repo-wide audit was flagged but not undertaken (only 2 of 12 features with a top-level `review.md` were spot-checked this session, both false positives). Owner: future session.

---

## DoD Observations

1. This story's own scope was narrowed mid-implementation after a "confirmed code bug" claim (missing `'review'` entry in `_STORY_SCOPED_ARTEFACT`) was found to rest on a false premise — an already-shipped, deliberate splitter mechanism (`darc-s1`/`asf-s1`) already handles per-story review files additively. The flawed fix was written, then fully reverted via `git checkout --` before commit, once a search of the existing test suite surfaced the real mechanism. **/improve candidate:** searching for existing test coverage of the exact function/file about to be changed, before implementing any "confirmed bug" fix, caught this before it shipped — worth reinforcing as a default habit in `/implementation-plan` or `/subagent-execution` guidance for bug-fix stories specifically (a "check for prior art" step before writing the fix).
2. Both this PR and its sibling `rsc-s1` hit merge conflicts in `.github/pipeline-state.json` from concurrent array-appends at the same position (an unrelated `2026-09-29-test` E2E fixture entry landed on master between branch creation and PR open). Resolved by keeping both entries each time — a recurring, low-risk conflict shape for any feature added to `pipeline-state.json`'s flat `features[]` array during a busy period. **/improve candidate:** none needed — the resolution is mechanical and was handled correctly each time, but it's worth noting as an expected, not alarming, occurrence when multiple short-track stories land close together.
3. The same pre-existing `2026-09-29-test` entry was independently found to violate CI's stricter Python/`jsonschema`-based `validate-trace.sh` in ways this repo's own local Node-based `scripts/check-pipeline-state-integrity.js` did not catch (a missing `name` field, only surfaced by the schema file directly) — fixed as a separate, unrelated bookkeeping commit on master. **/improve candidate:** `check-pipeline-state-integrity.js`'s own rule set (C7/C11/etc.) does not fully mirror `.github/pipeline-state.schema.json`; worth reconciling so a local run of the Node checker catches everything the CI schema check will, rather than requiring a CI round-trip to discover the gap.
4. Two E2E staging jobs (`Scenario A`/`Scenario B E2E (staging)`) failed transiently against the real `wuce-staging` deployment during this session's PR cycle — once from a concurrency-group cancellation (`Canceling since a higher priority waiting request for deploy-group exists`) from rapid successive pushes, once from a genuine but non-reproducing `TypeError` in a DoR-turn-completion assertion that had passed on the identical code multiple times before and passed again on a clean rerun. Neither was caused by this story's own changes (backend-only: a pure function extension and a config-array extension). **/improve candidate:** none — both were correctly diagnosed as transient via direct evidence (prior passing runs on the same code, the literal cancellation message) before re-running, not assumed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for wuar-s1 (Extend the Sonnet
drift-guard to cover benefit-metric, decisions, and definition-of-done).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

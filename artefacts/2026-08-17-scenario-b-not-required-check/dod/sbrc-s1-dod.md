# Definition of Done: Add "Scenario B E2E (staging)" to master's required status checks (sbrc-s1)

**PR:** None — config-only change, zero repo files touched (per the story's own Architecture Constraints); no standalone PR required per CLAUDE.md's state/artefact-update exception
**Story:** artefacts/2026-08-17-scenario-b-not-required-check/stories/sbrc-s1-add-scenario-b-to-required-checks.md
**Test plan:** artefacts/2026-08-17-scenario-b-not-required-check/test-plans/sbrc-s1-test-plan.md
**DoR:** artefacts/2026-08-17-scenario-b-not-required-check/dor/sbrc-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent), operator-authorized in-session for this specific production ruleset change
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `gh api repos/heymishy/skills-repo/rulesets/14979696` (re-fetched fresh after the change): `required_status_checks` now lists `"Run assurance gate"`, `"Scenario A E2E (staging)"`, `"Scenario B E2E (staging)"` — the two pre-existing entries preserved, the new one added | Live GitHub API check | None |
| AC2 | ✅ | `tests/check-b2-ci-gate-config.js` re-run fresh: 16/16 passing, 0 skipped — T12 (previously `SKIPPED`, treated as inconclusive) now genuinely `PASS`, finding `"Scenario B E2E (staging)"` in the live required-checks list | Automated test, live GitHub API call | None |
| AC3 | ✅ | Ruleset `enforcement: "active"`, `required_status_checks` rule type — GitHub's own documented ruleset semantics block a PR's merge button when any listed context is failing/pending. Not verified via an actual broken PR, per the story's own explicit instruction that doing so would be unnecessarily disruptive | Configuration inspection (not a live broken-PR rehearsal, by design) | None — matches the story's own stated verification method exactly |

---

## Scope Deviations

None. The change is exactly the single `required_status_checks` array entry the story specifies — confirmed via a before/after diff of the ruleset JSON (only the new `{"context": "Scenario B E2E (staging)"}` object added; every other field, including `bypass_actors`, `conditions`, and the other 3 rule types, byte-for-byte unchanged).

---

## Test Plan Coverage

**Tests from plan implemented:** 3/3 (reused existing files, per the story's own instruction — no new test file written)
**Tests passing:** `check-b2-ci-gate-config.js` 16/16 (was 15/16 + 1 skip); `check-a5-ci-gate-config.js` 14/14 (unchanged, confirming no regression to Scenario A's own required status)

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Story states none identified |
| Security | ✅ | Closes a gap where a real regression could merge unblocked — a security-adjacent improvement, not a new risk |
| Accessibility | ✅ N/A | Not applicable |
| Audit | ✅ | The `gh api` PUT call itself is logged in GitHub's own audit log, per the story's own framing |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track config fix, per the story's own Benefit Linkage section. The stated benefit (`b2`'s own AC1 guarantee — "a PR that breaks a Scenario B-covered journey step is actually blocked from merging" — now holds for real) is directly confirmed by AC1/AC2's evidence above; not independently re-measured via a real broken-PR rehearsal (see AC3).

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

**Follow-up actions:** None required for this story's own scope.

---

## DoD Observations

1. This is the first genuinely-open item across this session's whole DoD-triage sweep that required a real, hard-to-reverse production infrastructure change (a GitHub branch-protection ruleset PUT) rather than a code change, a live-Chrome verification, or a documentation backfill. Correctly flagged for separate operator authorization before being performed (raised explicitly in the ranked candidate list, then confirmed again via an `AskUserQuestion` before execution) — treated with the same care as the earlier real-API-cost decision (`csvg-s1`), reinforcing a pattern: any action this session takes outside the already-established "Chrome verification + code changes on a branch + PR" envelope gets surfaced and authorized explicitly, not assumed.
2. The before/after JSON diff (captured in this DoD's own investigation) is the durable evidence trail for this change, since — unlike a code change — there is no git commit that captures what actually changed on GitHub's side. Worth noting for any future config-only story of this shape: capture and retain the full before/after API response, not just the final state, since the "before" state cannot be reconstructed later from git history.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add 'Scenario B E2E (staging)' to master's required status checks" (sbrc-s1).
Check:
1. Does the AC1/AC2 evidence show a real, fresh API call result, not a stale/cached one?
2. Is it clear no other ruleset field or rule was modified or removed?
3. Is the "no PR" decision correctly justified (zero repo files touched)?
4. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```

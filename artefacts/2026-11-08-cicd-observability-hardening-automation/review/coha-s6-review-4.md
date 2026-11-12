# Review Report: GitHub issue opened by PostHog for each new production error issue (native destination) — Run 4

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Story slug:** coha-s6
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** PASS

Reviewer note: same agent as the author, fourth pass, on a story rewritten from a custom bridge to a configuration story. The story changed shape, so the run-3 PASS was not carried over; every AC was re-read against what can actually be observed. The findings below were raised during this run and the fixes were applied to the story in the same session, before this report was closed. They are listed as resolved-in-revision and should be re-checked at `/definition-of-ready`, not taken on trust.

---

## Review Diff — Run 4 vs Run 3

### Resolved since last run (by removal)
✅ 3-L1 — claim window of 2 minutes not derived from PostHog retry timing — RESOLVED BY REMOVAL: no claim window exists in the native design; PostHog owns duplicate suppression (now an unproven claim, see 4-M2).
✅ The run-3 custom-bridge ACs (AC1 to AC8: route, table, secret, token, adapter) no longer apply; the design is kept in git (commit 6e16356c7) as the fallback.

### New findings this run
Three MEDIUM and two LOW, below.

---

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[4-M1]** C — AC3 as first written was compound and could not do what it claimed: "Then exactly one issue appears ... whose body holds no text other than the code-block message, at most 5 frames ... and the author, title shape and link pattern are recorded". The PostHog test function sends a sample event, not a real scrubbed one, so it cannot show that tenant text is excluded, and the fallback buried in the same AC (a temporary unfiltered alert) opens a second public issue with no approval of its own. RESOLVED IN REVISION: AC3 now covers delivery shape and the coha-s7 fixture only; the content-leak proof is its own AC4, conditional, with separate operator approval for the extra issue, deletion of the temporary alert and closing of the issue.
- **[4-M2]** C — The duplicate-suppression AC (as first written, "AC5") needs a real production error, which may not exist at merge, so it cannot pass at DoR as an ordinary AC. RESOLVED IN REVISION: it is now AC6, labelled `production-observed`, and DoR must classify it with a RISK-ACCEPT in `decisions.md` plus a post-merge action in `workspace/state.json`; the DoD outcome is COMPLETE WITH DEVIATIONS until it is seen. Residual risk stays with the operator: until a real production error occurs, "once" is unproven.
- **[4-M3]** E — Architecture Constraints did not reference ADR-012 (platform-agnostic architecture, adapters over vendor-specific optimisation), and the native design is deliberately vendor-specific (PostHog plus GitHub). RESOLVED IN REVISION: a constraint states the design is the adapter-shaped edge, that nothing in `src/` or `scripts/` depends on it, and that it can be replaced without touching the pipeline. The other guardrail checked, "no credentials, tokens or personal data in committed files", is covered by AC7.

## LOW findings — note for retrospective

- **[4-L1]** C — AC1 mixes agent-checkable evidence (the PostHog integrations listing and repo list) with an operator statement of the GitHub installation's permissions, which the agent cannot read. Acceptable, but the DoD must say which half was observed and which was stated.
- **[4-L2]** A — coha-s7 (still a draft, not yet reviewed) says its upstream coha-s6 issues "carry the `production-error` label" and keys its trigger on that label. That is now false: PostHog applies no label. This is a downstream inconsistency, not a defect in coha-s6, and is recorded in the story's Dependencies and in `decisions.md`; coha-s7 must be revised at its own `/review` (the label becomes the workflow's first step, and its trigger keys on the real created issue's author and link pattern captured in AC3).

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 3 | PASS |
| Completeness | 4 | PASS |

AC quality is a 3: the ACs are testable, but two of the seven (AC4 conditional, AC6 production-observed) depend on events that may not occur on demand, which is addressed by classification at DoR rather than by rewording.

## Summary

0 HIGH, 3 MEDIUM (all resolved in revision, re-check at DoR), 2 LOW across 1 story.
**Outcome:** PASS — no HIGH findings remain. `/test-plan` for this story is a verification script rather than a coded test suite, since the story ships no code. Two things the agent cannot do come first: the operator connects the PostHog GitHub integration and installs the App on the single target repo (AC1), and approves the single test-function run (AC3).

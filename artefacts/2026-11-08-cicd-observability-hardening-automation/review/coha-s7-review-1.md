# Review Report: Label and incident record created for each PostHog-opened production error issue — Run 1

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Story slug:** coha-s7
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** PASS

Reviewer note: same agent as the author. This is the first review of coha-s7, which was drafted on 2026-11-13 and rewritten the same day after coha-s6 moved to PostHog's native GitHub destination. The two MEDIUM findings were fixed in the story before this report was closed and should be re-checked at `/definition-of-ready`, not taken on trust.

---

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** E — Architecture Constraints did not reference ADR-009 (evaluation and write-back must be separate workflow files with separate permission scopes) or ADR-010 (audit records persisted by a dedicated write-back, commit marked `[ci skip]`), although the story adds one workflow that both labels an issue (needs `issues: write`) and commits to the default branch (needs `contents: write`), triggered by issues that anyone can open on a public repo. RESOLVED IN REVISION: the workflow is split into jobs with their own minimal permissions (`recognise` read-only, label step `issues: write`, `record` job `contents: write`), the commit carries `[ci skip]`, and the story states the deliberate deviation from ADR-009's "separate files" wording and why (the trigger is `issues: opened` and a commit with the workflow token starts no workflow, so the loop that motivated ADR-009 cannot occur). The deviation is recorded as a DoR pre-check needing a RISK-ACCEPT or the two-file split; nothing is logged in `decisions.md` yet because that is the operator's call.
- **[1-M2]** C — AC7 (shell metacharacters), AC8 (two simultaneous issues) and AC3/AC4 (recognition) cannot be tested from a workflow YAML alone, and the story did not say where the logic lives, so as first drafted they could only be checked on GitHub. RESOLVED IN REVISION: recognition, label decision, idempotency check, record building and bounded commit-retry live in a unit-tested module under `scripts/`, the workflow is a thin caller, and a wiring test asserts the trigger, permissions, concurrency group and that untrusted fields arrive as environment data. AC9 is the live dry run.

## LOW findings — note for retrospective

- **[1-L1]** B — Creating an incident record is adjacent to the discovery's out-of-scope line "Production-defect triage, write-up, and response" (belongs to the incident-triage initiative). It is the input to triage, not triage itself, and the epic and the 2026-11-13 decisions place it here, so no scope breach; noted so a later reader does not read it as one.
- **[1-L2]** C — The record's "first seen" is the GitHub issue creation time, not PostHog's own first-seen time, because the native issue body does not carry it. The story says so; any consumer that treats it as PostHog's first-seen time would be slightly wrong by the delivery delay.
- **[1-L3]** A — The recognition rule depends on the coha-s6 AC3 fixture, which does not exist yet. The story states this as its first task and as a DoR pre-check, but until the fixture exists the author login and link shape in AC1, AC3 and AC4 are placeholders by name only. `/test-plan` must wait for it.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 3 | PASS |
| Completeness | 4 | PASS |

AC quality is a 3: nine ACs, all Given/When/Then and individually testable, but AC1, AC3 and AC4 cannot be made concrete until the coha-s6 fixture exists, and AC9 is live-only.

## Summary

0 HIGH, 2 MEDIUM (both resolved in revision, re-check at DoR), 3 LOW across 1 story.
**Outcome:** PASS — no HIGH findings remain. `/test-plan` is blocked on the coha-s6 live check (the fixture) and DoR is blocked on the operator's confirmation that the ruleset lets the workflow's actor push to `workspace/**`.

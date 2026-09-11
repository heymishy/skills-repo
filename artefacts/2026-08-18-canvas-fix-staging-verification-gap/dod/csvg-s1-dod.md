# Definition of Done: Close icrh-s1's and icv-s1's unconfirmed real-staging E2E verification (csvg-s1)

**PR:** None — this story required no code change, only live investigation, one operator-authorized real turn, and decision-record writes (see Scope Deviations below)
**Story:** artefacts/2026-08-18-canvas-fix-staging-verification-gap/stories/csvg-s1-close-icrh-s1-and-icv-s1-staging-verification.md
**Assessed by:** Claude Sonnet 5 (orchestrating session, repo-wide DoD-triage pass)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `icrh-s1`'s AC6 CI-skip precondition gate was identified (credits top-up + turn-1 render must both succeed first) AND a deeper root cause was found (`srmw-s1`: the real streaming chat endpoint ignores `MOCK_LLM_GATEWAY`, so any real browser-driven turn costs real API money). The verification was then performed manually with a recorded, real result: one real `/ideate` turn plus a page reload confirmed canvas hydration on resume, live, against `wuce-staging`. See `icrh-s1-dod.md` DoD Observation #2 and `decisions.md`'s 2026-09-11 entry. | Live browser verification (Chrome, network + DOM inspection) | None |
| AC2 | ✅ (partial, honestly recorded — not force-closed) | `icv-s1`'s AC6 "pending" `decisions.md` entry was closed with a real result: AC1/AC2's single-real-turn behaviour (no runaway auto-continue chain, submit re-enables) confirmed live. `acVerified` was deliberately **not** bumped to 6/6 in `pipeline-state.json` — AC3's own specific sub-case (a genuine second turn, canvas growing from 2 to 3) was not attempted, respecting the operator's one-turn authorization, and remains open. Recording `acVerified: 6` would have overstated what was actually verified. | Live browser verification + honest partial-closure recording | AC2's literal text ("updating acVerified to 6 of 6") is not fully met — a deliberate accuracy choice over literal AC compliance, recorded here rather than silently claimed |
| AC3 | ✅ | Neither AC1 nor AC2's investigation revealed a new, previously-unknown code defect. The blocker found (`srmw-s1`'s real-API-cost gap) was already a known, separately-tracked story (`stage: definition-of-ready`) before this investigation — confirmed, not newly discovered. Nothing new required separate-finding treatment. | Direct verification against existing pipeline-state.json | None |

---

## Scope Deviations

This story's own implementation was "investigate two staging-verification gaps, get explicit authorization for the one action with real cost implications, then perform and record the verification" — no source code changed, so the standard test-plan → DoR → implementation-plan → verify-completion → branch-complete inner loop was not run in full ceremony for it, mirroring `kvvg-s1`'s own precedent from earlier in this same triage pass (`artefacts/2026-08-17-kfd1-visual-verification-gap/dod/kvvg-s1-dod.md`). Recorded transparently as a deviation, not silently treated as equivalent to a full inner-loop execution.

**One real, deliberate scope-boundary decision:** the operator authorized exactly one real, cost-incurring `/ideate` turn (not an open-ended budget). That turn was used once, shared across closing both `icrh-s1`'s AC6 (fully) and `icv-s1`'s AC6 (partially — AC1/AC2 sub-cases only). `icv-s1`'s AC3 sub-case (a genuine second turn) was deliberately left unattempted rather than silently exceeding the authorized scope.

---

## Test Plan Coverage

Not applicable — no `test-plan` artefact exists for this story (see Scope Deviations). The live verification performed against real `wuce-staging` was the story's entire scope.

---

## NFR Status

Not applicable — no NFRs named in the story beyond "None identified" across all 4 categories.

---

## Metric Signal

Not applicable — short-track gap-closure story, no formal benefit-metric artefact (per the story's own Benefit Linkage: "None formally tracked").

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The deviation is AC2's partial (not literal 6/6) closure, described above — a deliberate accuracy choice, not a shortfall in effort.

**Follow-up actions:**
1. Close `icv-s1`'s remaining AC3 sub-case (a genuine second real turn, canvas growing from 2 to 3, exactly one more executor call) — needs one more operator-authorized real turn, or can wait until `srmw-s1` ships and makes this safely automatable. Not blocking; tracked in `icv-s1`'s own DoD Follow-up actions.
2. `srmw-s1` (wire `{stage, scenarioName}` into `handlePostTurnStreamHtml` so `MOCK_LLM_GATEWAY` actually protects the real chat UI) remains open, `stage: definition-of-ready`, never implemented. This story's investigation reconfirms it live: it is the reason neither `icrh-s1` nor `icv-s1`'s own automated E2E specs can run safely in CI today. Recommending it be picked up as an actual implementation story, not just tracked — every future `/ideate`/`/design`/`/definition` real-browser-turn verification will keep hitting the same real-cost wall until it ships.

---

## DoD Observations

1. **This story is a second, independent example (after `kvvg-s1`) of a repo-wide pattern this triage sweep keeps finding**: a short-track gap-closure story correctly created to track a real, self-documented gap, then abandoned at a bare story artefact with no test-plan/DoR/implementation ever started. Two such stories found and closed in one session (`kvvg-s1`, `csvg-s1`) — worth treating as a real backlog category, not a one-off, per the wave-2 capture-log entry on stalled short-track stories.
2. **This is the first time in this session's triage sweep that a genuine, real financial-cost decision was required mid-investigation**, rather than a pure documentation/live-Chrome-inspection task. The investigation surfaced the risk BEFORE taking any costly action (by reading `a4-ideate-session-resume.spec.js`'s own header comments and cross-checking `srmw-s1`'s pipeline-state), stopped, and asked the operator explicitly rather than assuming either "skip it" or "just do it" was the right call. Worth naming as the correct pattern for any future triage item that turns out to require a real-world cost decision: investigate and surface the tradeoff first, do not spend the cost speculatively.
3. Network-request inspection (not just DOM/`getComputedStyle`) was the decisive evidence type here — confirming exactly how many `turn-stream` POSTs fired (and correctly attributing the 2nd of 2 to the session's own benign auto-`__init__` call, not a regression) required reading the actual client-side source (`skills.js:3246`) to distinguish a real bug reproduction from expected behaviour. A naive "2 calls fired, that looks like the bug" reading would have been a false positive — worth remembering that live network evidence still needs source-level interpretation, not just raw counting.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Close icrh-s1's and icv-s1's unconfirmed real-staging E2E verification" (csvg-s1).
Check:
1. Was the real-cost turn genuinely authorized by the operator before being spent, not assumed or retroactively justified?
2. Is icv-s1's AC2 closure honestly described as partial (AC3 still open), not silently rounded up to complete?
3. Is the distinction between "the automated Playwright spec still can't run in CI" and "the underlying behaviour is live-confirmed" kept clear in icrh-s1's and icv-s1's own DoDs?
4. Is the outcome verdict (COMPLETE WITH DEVIATIONS) consistent with the AC and deviation rows?
```

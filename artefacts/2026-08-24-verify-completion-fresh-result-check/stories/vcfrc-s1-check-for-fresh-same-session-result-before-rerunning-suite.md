## Story: Check for an already-fresh same-session result before re-running the full suite in /verify-completion

**Epic reference:** none (short-track, single story)
**Discovery reference:** none (short-track — see `CLAUDE.md` short-track flow)
**Benefit-metric reference:** none (short-track)
**Domain:** pipeline-infrastructure / inner-loop-efficiency

## User Story

As an orchestrating session running `/verify-completion`
I want an explicit instruction to check whether an already-fresh same-session full-suite result exists before re-running it
So that I don't duplicate a run that already produced sufficient evidence moments earlier in the same session

## Benefit Linkage

Follow-up action item surfaced by the scheduled `loop-design.md` revisit (`artefacts/2026-08-23-inner-loop-ceremony-optimisation/loop-design.md`, Section 8c — item #6 of the 2026-08-24 capture-log 7-item ranked backlog). `vrne-s3` (2026-08-23) hit a real Meta Metric 3 (local full-suite run count) overrun — 4 runs against a target of ≤2 for its 1–3 task band — root-caused as a self-inflicted duplication: `/verify-completion`'s Step 1 re-ran the full suite without first checking whether the final AC-review agent's own already-fresh same-session run had already produced sufficient evidence. `vrne-s4`, the very next story, applied this exact check deliberately (the Task 4 dispatch prompt explicitly instructed checking for fresh evidence first) and hit the target band exactly (2 runs). This is real, n≥1 validated behaviour — but the lesson has never been written into `/verify-completion`'s own skill text, meaning every future session has to independently rediscover it rather than being told directly.

## Architecture Constraints

- Do not change Step 1's actual test command or failure-handling logic — only add a check that can short-circuit re-running when a qualifying fresh result already exists.
- "Fresh" must be defined precisely enough to avoid false-positive skips: no code changes since the prior run, and the prior run covered the same test command (the full suite, not a targeted subset).
- Do not weaken the non-negotiable evidence-gate property of `/verify-completion`'s Step 1 (per `loop-design.md` Section 3's own finding: "this is the correct, single place a full-suite run should be non-negotiable"). This story adds a skip-if-already-fresh optimisation, not a general license to skip the check.

## Dependencies

None. Independent of all other stories closed this session.

## Acceptance Criteria

**AC1**
Given `/verify-completion`'s Step 1 instructions
When read at the start of the step, before the test command block
Then they explicitly instruct checking whether an already-fresh same-session full-suite result exists (e.g. from a final AC-review/spec-compliance agent's own run reported earlier in this same session) before running the command

**AC2**
Given the fresh-result check
When it defines what counts as "fresh"
Then it requires both: (a) no code changes since that prior run, and (b) the prior run covered the same full-suite command — not a targeted single-file run

**AC3**
Given the added text
When it cites its evidence
Then it references the concrete `vrne-s3`/`vrne-s4` finding (the overrun and the correction) and the `loop-design.md` Section 8c source, not a generic unsourced caveat — matching this session's own established pattern (`s3fw-s1`, `vtc-s1`)

**AC4**
Given the existing Step 1 test command, failure-handling instructions, and the Route/handler E2E coverage check section
When this story's change is applied
Then none of that existing text is altered — the fix is additive only

## Out of Scope

- Applying this same check to `/branch-setup`'s baseline run or `/branch-complete`'s pre-push run — `loop-design.md` Section 3 explicitly confirmed those as separate, non-redundant anchor points; only `/verify-completion`'s Step 1 was implicated in the `vrne-s3` finding.
- Automating the freshness check (e.g. via a timestamp/hash comparison script) — this story adds an instruction for the orchestrating session to apply judgement, matching how the rest of `/verify-completion` already works, not a new tooling mechanism.
- Section 3c's risk-tiered review-depth pilot (a separate, still-open `loop-design.md` item) — unrelated to this specific finding.

## NFRs

None beyond the existing artefact-writing standards.

## Complexity Rating

**Complexity:** 1 (well understood — the exact fix is already validated by real n≥1 behaviour, just needs to be written into the skill text)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` (instruction-text clarification, not an architectural choice)
- [x] No CSS-layout-dependent ACs
- [x] No injectable adapter introduced

## Story: Wire the human-narrated mode as an on-demand operator tool

**Epic reference:** epics/epic-1-rubber-duck-review-capture-mvp.md
**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md

## User Story

As a **developer/operator running the outer loop**,
I want to **invoke a real, repeatable tool that takes a narrated recording and produces ready-to-append findings, on demand**,
So that **I can actually use the mechanism validated in Story 1 as part of my normal workflow, moving real gaps from "found opportunistically at DoD" to "found via rubber-duck-review" (Tier 1 Metric 1)**.

## Benefit Linkage

**Metric moved:** Tier 1 Metric 1 — Where real gaps get first detected, by pipeline stage
**How:** This story turns Story 1's validated one-off script into a real, invokable capability an operator can reach for on any shipped feature, which is the precondition for any gap ever being tagged `rubber-duck-review`-detected instead of `dod-sweep`- or `production-incident`-detected.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. Follows this repo's existing skill-file convention (a new `skills/rubber-duck-review/SKILL.md`-style invocation, or an equivalent script under `scripts/`) rather than inventing a new tooling category. (Corrected 2026-08-09, review run 1, finding 1-M1: the actual skill-file location in this repo is top-level `skills/`, not `.github/skills/` — the latter holds only two unrelated legacy entries.)

## Dependencies

- **Upstream:** `rdrc-s1` — this story does not proceed until Story 1's AC3 minimum validation signal is confirmed met; if it is not met, this story is descoped or redesigned per the epic's own scope-stability note.
- **Downstream:** None within this epic; feeds Tier 1 Metric 1's measurement going forward.

## Acceptance Criteria

**AC1:** Given an operator has a screen+voice recording of a walkthrough, When they invoke the tool (e.g. `/rubber-duck-review` or an equivalent script), Then it runs the transcription + extraction pipeline validated in Story 1 and outputs one or more findings in the ready-to-append `capture-log.md` format.

**AC2:** Given the tool produces findings, When the operator reviews them, Then each finding includes enough context (a reference to roughly where in the recording it came from, and a plain-language description) that the operator can decide "actionable" or "noise" without re-watching the whole recording.

**AC3:** Given the tool runs, When it completes, Then the raw recording and transcript are not persisted anywhere beyond the immediate run (no repo commit, no durable storage) — only the extracted findings are offered for the operator to append, consistent with discovery's "transcribe and discard" constraint.

**AC4:** Given the operator confirms a finding is actionable, When they choose to log it, Then it is appended to `workspace/capture-log.md` following that file's existing 5-field schema (date, session-phase, signal-type, signal-text, source) — source tagged distinctly (e.g. `rubber-duck-review`) so it's traceable for Tier 1 Metric 1's measurement.

## Out of Scope

- The agent-driven mode — Stories 3-4.
- Automatic logging without operator confirmation — AC4 requires an explicit operator choice, per discovery's "human decides whether to act" Out of Scope item.
- The proactive suggestion nudge for eligible stories — Story 5.

## NFRs

- **Performance:** Not defined — this is an on-demand, operator-paced tool, not a latency-sensitive path.
- **Security:** No credentials handled directly by this tool beyond whatever the transcription API call itself requires, which must follow this repo's existing secrets-store pattern (`product/constraints.md` #12) — never a credential in the tool's own persisted config.
- **Accessibility:** Not applicable — CLI/skill-invocation tool, no UI surface.
- **Audit:** Every invocation's outcome (findings produced, operator's actionable/noise decisions) feeds Meta Metric 1's ongoing measurement — logged as part of AC4's `capture-log.md` entries.

## Complexity Rating

**Rating:** 2 — the extraction mechanism is already validated by Story 1; the remaining work is wrapping it as a real, repeatable, operator-invokable tool with a discard-by-default data path.
**Scope stability:** Stable (conditional on Story 1's signal being confirmed — if not, this story's own scope may need to change, per the epic's scope-stability note).

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

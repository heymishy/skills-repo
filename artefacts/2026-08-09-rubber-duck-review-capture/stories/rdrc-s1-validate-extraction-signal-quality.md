## Story: Validate findings-extraction signal quality on a real human-narrated recording

**Epic reference:** epics/epic-1-rubber-duck-review-capture-mvp.md
**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md

## User Story

As a **developer/operator running the outer loop**,
I want to **know, before building any further tooling, whether transcribing and LLM-extracting a narrated walkthrough actually produces useful findings rather than noise**,
So that **I don't invest in the human-narrated mode's full tooling (Story 2) or the agent-driven mode (Stories 3-4) if the core extraction mechanism doesn't work (Meta Metric 1 — findings signal quality)**.

## Benefit Linkage

**Metric moved:** Meta Metric 1 — Findings signal quality (not noise)
**How:** This story produces the first real, measured data point for Meta Metric 1's baseline and tests it against the minimum validation signal (≥40% confirmed real/actionable) before any further story in this epic proceeds.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. This story does not touch a shared surface module; it produces a standalone script/prototype, not a wired-in platform capability yet (that's Story 2).

**Platform-availability note (D2-platform gate):** no speech-to-text/transcription service exists anywhere in this codebase today (verified via source search — no dependency, no integration). This story's own scope therefore includes selecting and wiring up a speech-to-text API (e.g. an existing cloud provider's transcription endpoint) as a first-time integration, not a pre-existing capability the story merely consumes. Logged as a SCOPE decision in `decisions.md`.

## Dependencies

- **Upstream:** None
- **Downstream:** Story 2 (wiring the human-narrated mode as a real tool) does not proceed until this story's minimum validation signal is confirmed met

## Acceptance Criteria

**AC1:** Given a real screen+voice recording of an operator narrating a walkthrough of an already-shipped feature (reusing existing OS/browser screen-recording — no bespoke capture tooling built) and a speech-to-text API selected and wired up as part of this story's own implementation work (no such service exists in this codebase today — see Architecture Constraints), When the recording is transcribed, Then a text transcript is produced that a human can read and roughly correlates with what was said (spot-checked, not word-perfect accuracy required).

**AC2:** Given the transcript from AC1, When an LLM extraction pass runs over it, Then it produces one or more structured findings, each formatted as a ready-to-append `capture-log.md` entry (per discovery's clarified findings-output format) — not a raw re-statement of the transcript, and not a generic structured object requiring further translation.

**AC3:** Given at least 5 findings produced across one or more test recordings, When the operator reviews each finding, Then at least 40% are confirmed "real and actionable" (Meta Metric 1's minimum validation signal) — recorded as a simple count (N actionable / N total) in this story's own verification notes, not just asserted as passing.

**AC4:** Given the extraction produces a finding that references something in the recording, When the operator checks the underlying transcript, Then the finding's description is traceable back to a specific, identifiable point in the transcript — not a fabricated or hallucinated observation with no transcript basis.

## Out of Scope

- Building a polished, reusable `/rubber-duck-review` tool — this story is a validation prototype/script, not the production tool (that's Story 2).
- The agent-driven mode entirely — that's Stories 3-4.
- Any CI integration — this story is run manually, once or a few times, by the operator.

## NFRs

- **Performance:** Not applicable — this is a manual, one-off validation exercise, not a production path with a performance target.
- **Security:** The recording and transcript must not be committed to the repo or shared beyond the operator's own review — transient, local-only artefacts, consistent with discovery's "no long-term storage" constraint.
- **Accessibility:** Not applicable.
- **Audit:** The AC3 actionable/total count itself is the audit record for this story — logged in the story's verification notes.

## Complexity Rating

**Rating:** 2 — some ambiguity: the actual signal-quality outcome is genuinely unknown (that's the point of this story), though the mechanics (recording, transcription API, one LLM extraction call) are individually well-understood.
**Scope stability:** Unstable — if AC3's minimum signal isn't met, the whole epic's remaining stories need re-evaluation, not just this one.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

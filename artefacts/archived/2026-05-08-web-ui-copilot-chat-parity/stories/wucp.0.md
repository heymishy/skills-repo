## Story: MM1 prompt validation spike — tool marker emission baseline

**Type: Spike**
**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md

## User Story

As a **platform maintainer**,
I want a validated baseline for `<TOOL:.../>` marker emission reliability,
So that the Gap 1 tool execution loop story (wucp.3) is written against a confirmed approach — not an assumption that may require a rework cycle after server loop implementation has begun.

## Benefit Linkage

**Metric moved:** MM1 — Tool marker emission reliability
**How:** This spike directly measures the MM1 baseline. Without it, MM1 is "unknown" and wucp.3 risks building a server loop against a marker format the model does not emit reliably. The spike converts MM1 from unknown to measured, unlocking wucp.3.

## Time-box

**2–4 operator focus hours.** This is a bounded investigation, not an open-ended research task. The done condition is reached when: (a) emission rate is measured across 20 scenarios and documented, AND (b) the go/no-go decision for the marker-based approach is made and written.

## Architecture Constraints

- No production code changes in this spike — prompt test only
- Result document saved to `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md` (this path is the DoR PROCEED-BLOCKED gate key for wucp.3)
- ADR-011 (artefact-first): no src/ changes are permitted as part of this spike

## Dependencies

- **Upstream:** None — this is the first deliverable in the epic
- **Downstream:** wucp.3 (Gap 1 tool execution loop) is **blocked** on this spike. wucp.3 must not be dispatched until `prompt-validation-results.md` exists and documents MM1 ≥ 60%.

## Done Conditions

A spike is done when its question is answered and the outcome is documented. Three possible outcomes:

**Outcome A (GO — ≥ 80%):** Emission rate meets the MM1 target. wucp.3 proceeds with `<TOOL:.../>` marker-based approach as designed.

**Outcome B (MARGINAL — 60–79%):** Emission rate meets the minimum signal but not the target. wucp.3 proceeds with marker-based approach AND includes a fallback notification strategy as a named AC (model emits marker inconsistently → server notifies operator in turn output).

**Outcome C (BLOCKED — < 60%):** Emission rate below minimum signal. wucp.3 is not written until an alternative approach (structured output, function calling if the model API supports it) is evaluated and selected. Alternative evaluation becomes a separate spike or added to wucp.3's scope definition.

## Acceptance Criteria

**AC1:** Given 20 prompted scenarios are designed across `/workflow` (8 scenarios), `/trace` (6 scenarios), and `/improve` (6 scenarios) — each with a clear file-read intent and the WEB UI PROTOCOL instruction `"when you need to read a file, emit exactly <TOOL:read_file path=\"...\"/>"` — When each scenario is submitted to the target model (Sonnet 4.6), Then each response is scored: marker present and well-formed = pass (1); marker absent, malformed, or paraphrased = fail (0). Total score = (pass count / 20) × 100%.

**AC2:** Given the 20-scenario test is complete, When the results are documented, Then `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md` exists and contains: (a) emission rate percentage, (b) per-scenario pass/fail table, (c) representative examples of failed emissions (what the model said instead), (d) the go/no-go decision with rationale.

**AC3:** Given the emission rate is ≥ 60% (Outcome A or B), When the spike is complete, Then the results document includes a recommendation on WEB UI PROTOCOL instruction text — the specific wording that produced the highest emission rate — to be used verbatim in wucp.3 implementation.

**AC4:** Given the emission rate is < 60% (Outcome C), When the spike is complete, Then the results document includes an evaluation of at least two alternative approaches (e.g. structured output format via system prompt, function calling if the model API supports it), with the recommended approach and rationale stated. This recommendation becomes the input to wucp.3 scope revision.

## Out of Scope

- Server-side tool loop implementation — this spike is prompt-testing only; no src/ changes
- Automated test harness — manual prompt submission and scoring is sufficient for 20 scenarios
- Multi-model comparison — Sonnet 4.6 is the target model; GPT-4o comparison is deferred (enterprise model selection is a separate dependency — see benefit-metric prerequisites)

## NFRs

- **Security:** None — no production code; prompts contain no credentials or PII
- **Performance:** None — spike is a manual measurement exercise
- **Accessibility:** None

## Complexity Rating

**Rating:** 1 (well-understood task — send prompts, score, document)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

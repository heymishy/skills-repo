# Spike A2 — Marker Emission Rate Experiment

**Spike ID:** A2
**Date:** 2026-06-04
**Run by:** Copilot (Claude Sonnet 4.6) — same model that executes /ideate sessions
**Outcome:** PROCEED

---

## Question

Can the `/ideate` SKILL.md be tuned to emit `---ASSUMPTION-JSON---` markers reliably during Lens B execution? Specifically: if the marker emission instruction is added to the SKILL.md B1 step, will the model emit a structured marker alongside every prose assumption it surfaces?

**Gate:** ≥70% emission rate → proceed to /benefit-metric with full four-cluster scope (Clusters 1, 2, 4). <70% → Cluster 2 deferred to Increment 2, MVP = Clusters 1 + 4 only.

---

## Context

The discovery artefact (`artefacts/2026-05-21-ideate-web-ux/discovery.md`) identified this as the commercial viability gate for Cluster 2 (assumption cards):

> "Unreliable assumption card emission (below 70% of actual assumptions surfaced) produces a UI that 'sometimes shows things' rather than a reliable surface. For commercial use, inconsistent capture is worse than no capture: it creates false confidence in the completeness of the assumption list."

Spike A1 confirmed the SSE architecture is viable (server-side handler can parse markers from the stream and emit `assumptionCard` events). A2 tests the model-side of the same contract.

---

## Method

**Session type:** Simulated in-conversation Lens B execution

**Condition:** The following instruction was added to the SKILL.md B1 step (as a proposed SKILL.md addition, not yet committed):

```
**Marker emission rule (web UI integration):** For every assumption you surface,
emit a structured marker on its own line immediately after the prose item:

---ASSUMPTION-JSON: {"id":"[type]-[n]","text":"[assumption, one sentence]","type":"[desirability|viability|feasibility|ethical]","risk":"[high|medium|low]","knowness":"[evidence|inference|guess]"}---

One marker per assumption. Emit it directly after the prose line. No extra
whitespace around it. The marker is stripped from the visible thread by the
web UI handler — it will not appear to the operator as raw text.
```

**Subject:** `artefacts/2026-05-21-ideate-web-ux/discovery.md` — full content as Lens B input

**Context window:** Single clean-context turn (no prior turns, no session accumulation). This is the best-case condition.

---

## Session Configuration

- Model: Claude Sonnet 4.6
- Lens: B (assumption inventory — Torres framework)
- Steps executed: B1 (extraction and categorisation) + implicit B2 (risk/knowness fields in markers)
- Instruction delivery: embedded in the B1 step, as a natural extension of the existing SKILL.md prose

---

## Results

### Assumptions surfaced and markers emitted

| ID | Type | Prose surfaced | Marker emitted |
|----|------|---------------|----------------|
| desirability-1 | Desirability | ✅ | ✅ |
| desirability-2 | Desirability | ✅ | ✅ |
| desirability-3 | Desirability | ✅ | ✅ |
| desirability-4 | Desirability | ✅ | ✅ |
| desirability-5 | Desirability | ✅ | ✅ |
| viability-1 | Viability | ✅ | ✅ |
| viability-2 | Viability | ✅ | ✅ |
| feasibility-1 | Feasibility | ✅ | ✅ |
| feasibility-2 | Feasibility | ✅ | ✅ |
| feasibility-3 | Feasibility | ✅ | ✅ |
| feasibility-4 | Feasibility | ✅ | ✅ |
| ethical-1 | Ethical | ✅ | ✅ |

### Count

| Metric | Value |
|--------|-------|
| Assumptions surfaced in prose | 12 |
| `---ASSUMPTION-JSON---` markers emitted | 12 |
| **Emission rate** | **100% (12/12)** |
| Gate threshold | 70% |
| Gate result | **PASS** |

---

## Outcome: PROCEED

Emission rate (100%) is well above the 70% gate. The instruction is clear and the model follows it without drift for a full Lens B session on a complex discovery artefact.

**Proceed to /benefit-metric with full four-cluster scope: Clusters 1, 2, and 4 in MVP.**

---

## Open Question — Multi-turn Consistency

This experiment was run in a single clean-context turn. Real `/ideate` sessions accumulate 6–10+ turns before Lens B runs. Context pressure at turns 6+ may reduce emission consistency as the model juggles session context, prior answers, and the emission instruction simultaneously.

**Resolution:** This is not a blocker for /benefit-metric or /definition. It is an open risk that must be closed by the SKILL.md tuning story's DoD entry condition:

> **SKILL.md tuning story DoD entry condition:** Run the instrumented SKILL.md instruction in a real multi-turn `/ideate` session (minimum 6 turns before Lens B). Record assumption count and marker count. Emission rate must be ≥70% at completion. If rate is <70%, the story is not done — iterate the instruction wording until the threshold is met before merging.

This DoD condition must appear in the SKILL.md tuning story's ACs and test plan. It ensures the emission guarantee is validated under production conditions before Cluster 2 stories can be closed.

---

## Proposed SKILL.md addition

The following instruction addition is the change to be governed by the SKILL.md tuning story. It is reproduced here for traceability; the governed version will be produced as a diff artefact in that story's DoR.

**Location:** `.github/skills/ideate/SKILL.md`, Lens B section, B1 step, after the `Present the extracted assumptions:` block.

```
**Marker emission rule (web UI integration):** For every assumption you surface,
emit a structured marker on its own line immediately after the prose item:

---ASSUMPTION-JSON: {"id":"[type]-[n]","text":"[assumption, one sentence]","type":"[desirability|viability|feasibility|ethical]","risk":"[high|medium|low]","knowness":"[evidence|inference|guess]"}---

One marker per assumption. Emit it directly after the prose line. No extra
whitespace around it. The marker is stripped from the visible thread by the
web UI handler — it will not appear to the operator as raw text.
```

---

## Links

- Discovery: `artefacts/2026-05-21-ideate-web-ux/discovery.md`
- SSE feasibility spike: `artefacts/2026-05-21-ideate-web-ux/spikes/a1-sse-architecture-feasibility.md`
- ADR-018: `product/decisions.md` (assumption card marker protocol)

# Spike Outcome: AI-generation fast-follow — scoping only (not yet buildable per its own documented gate)

**Opened:** 2026-10-14 | **Scope:** Standard | **Steps taken:** 2 (direct read of this codebase's own existing LLM-gateway infrastructure; cross-check against `decisions.md`'s own confirmed revisit trigger)
**Done condition met:** Yes (as a scoping pass — see "What this spike does NOT do" below)
**Artefact path:** `artefacts/2026-10-14-journey-authoring-experience/spikes/ai-generation-fast-follow-scoping-outcome.md`
**Trigger:** Operator follow-up action #4 — the AI-generation fast-follow named in `jae-s3`'s own discovery/decisions.

---

## Outcome: SCOPED, NOT YET BUILDABLE — its own documented gate has not been met

### What was found

1. **This codebase's existing "LLM-gateway" infrastructure (`src/web-ui/modules/mock-llm-gateway.js`) is test/mock infrastructure for the skills-PIPELINE's own outer-loop skill execution (e.g. `/discovery`, `/benefit-metric` turn execution) — not a general-purpose, ready-to-reuse mechanism for a customer-facing feature like generating journey-stage field suggestions.** Confirmed by reading its own exports (`isMockGatewayEnabled`, `wireDefaultMockGatewayClient`, fixture-based mock responses keyed by pipeline `stage`/`scenarioName`). Discovery.md's own framing ("this app's own existing LLM-gateway adapter infrastructure could support later") was directionally correct — a real LLM call IS architecturally possible here (the deployed `ANTHROPIC_API_KEY` secret confirms real API access already exists) — but "support later" understates the work: this would be a NEW, feature-specific integration (a journey-stage-suggestion prompt + a real API call wrapped in its own adapter), not flipping an existing flag or reusing the mock-gateway's own fixture system, which is purpose-built for a different domain entirely.

2. **The confirmed `/clarify` decision this fast-follow is sequenced behind has an explicit, data-driven gate that has not been met.** `decisions.md`'s own entry: "Once the deterministic scan ships and has real usage data, scope the AI-generation fast-follow as its own story." `jae-s3` (the deterministic scan) merged within this same session, with zero real post-release usage time. Building the AI-generation story NOW would skip the exact condition the original scoping decision was made on — not an arbitrary delay, but the specific signal (`jae-s3`'s own real coverage rate, named in `jae-s3`'s own DoD follow-up #2) that determines whether this fast-follow is even the right next move, or whether the deterministic scan turns out to be good enough on its own.

### Reasoning

"Scope this fast-follow" and "build this fast-follow" are different asks, and the discovery artefact's own language already anticipated the difference — it named a fast-follow STORY as the eventual destination, conditioned on data this session does not yet have. This spike closes the scoping half (confirms what the real integration would require, corrects the "just reuse the existing gateway" assumption to "build a new, small, purpose-specific integration") without prematurely writing ACs against an unmet precondition.

---

## If the gate is overridden (operator's own call, not this spike's)

**What would need to change, if the operator chooses to proceed without waiting for usage data:**

- A new adapter (e.g. `src/web-ui/adapters/field-suggestion-llm.js`) wrapping a real Anthropic API call, injectable per this codebase's own established adapter convention (D37 — stub throws, not silently returns empty).
- A prompt scoped tightly to the SAME 2 fields `jae-s3` already covers (`customer_actions`, `pain_points`), seeded with the stage's own name + any linked feature's own discovery context — not a general-purpose "write anything" prompt, to bound both cost and the empathy-content-accuracy risk `discovery.md` already named.
- The SAME click-to-fill, never-auto-save UX `jae-s3` already established — an AI suggestion is still a suggestion, reviewed before it becomes real content, not generated-and-saved content.
- A cost/rate-limit guardrail — this is a genuinely new, real per-request API cost that the deterministic scan (`jae-s3`) does not have at all.

**Not recommended without the gate:** Skipping straight to implementation. The deterministic scan's own real coverage rate is the single piece of information that determines whether this fast-follow is worth its added cost/complexity at all — building it blind contradicts the documented reason it was deferred in the first place.

**Return to:** Operator decision below — override the gate and proceed to a story now, or hold until `jae-s1`'s own pending M2 baseline query (and some real post-release usage window) gives the deterministic scan's own coverage rate a real number to compare against.

---

## What this spike does NOT do

- Does not write a story or ACs for the AI-generation mechanism — premature per the gate above.
- Does not build or modify any adapter.
- Does not make the override decision — that is the operator's own call, named explicitly as a question below, not assumed.

---

## Sources

- Direct read of `src/web-ui/modules/mock-llm-gateway.js`'s own exports and fixture mechanism
- `artefacts/2026-10-14-journey-authoring-experience/decisions.md`'s own confirmed `/clarify` entry and revisit trigger
- `artefacts/2026-10-14-journey-authoring-experience/dod/jae-s3-dod.md`'s own follow-up action #2 (the exact usage-data signal this gate is waiting on)

---

## Discovery fields resolved

No discovery-field changes — this remains correctly out of this feature's own MVP scope per its own already-confirmed `/clarify` decision; nothing here reopens that scope.

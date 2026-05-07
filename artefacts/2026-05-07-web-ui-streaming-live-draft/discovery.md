# Discovery: Web UI Streaming Chat and Progressive Live Draft

**Status:** Approved
**Created:** 2026-05-07
**Approved by:** Hamis — 2026-05-07
**Author:** Hamis

---

## Problem Statement

The mfc.1 and ougl features delivered a working model-driven chat UI for skill sessions and guided outer loop journeys. Two UX gaps were identified post-delivery:

1. **Chat text is not live.** When the model is generating a response, the chat bubble shows a "thinking" spinner until the full response is ready, then the entire response appears at once. This breaks the interactive feeling that makes VS Code Copilot Chat feel responsive — in that surface, tokens stream into the chat window in real time as the model reasons. Operators using the web UI experience a perceived unresponsiveness: the UI is frozen for 20–60 seconds per turn, then suddenly populated. The SSE infrastructure and streaming endpoint already exist (`turn-stream`) but the Anthropic provider falls back to non-streaming, and the experience has not been validated end-to-end for smoothness.

2. **The artefact document never builds up live.** The right-hand "Live Draft" panel is populated only when the model finishes and the complete `---ARTEFACT-START---` block has been parsed. A discovery session that produces a 400-line document keeps the preview blank for the entire generation time, then shows the complete document in one jump. Operators cannot see the structure forming, cannot orient to what the model is writing, and cannot interrupt if it goes off-track. The "live draft" label implies progressive construction but the behaviour is a final reveal.

Both gaps were implied by prior scope (mfc.1 introduced the streaming endpoint; ougl introduced the live draft panel) but were not explicitly delivered as ACs — they are post-merge observations from first real usage.

## Who It Affects

- Operators running skill sessions via the web UI (individual skill and journey modes)
- Non-engineers using the outer loop journey who have no prior experience with LLM latency and find the blank/frozen state confusing

## Why Now

The web UI is in active use following ougl delivery. These are first-session UX observations that directly affect trust in the UI. Blank panels and frozen screens during model turns are the leading cause of "is this working?" confusion. Both gaps are addressable without new infrastructure — they are changes to the streaming event protocol and the client-side rendering logic.

## MVP Scope

1. **Chat streaming (wusl.1):** Every provider used by the web UI streams response tokens into the chat bubble in real time. The thinking spinner transitions immediately to streaming text. For providers that cannot stream (Anthropic), a visible typing indicator or word-by-word simulation is acceptable as a graceful fallback. The operator always sees live feedback that the model is working.

2. **Progressive live draft (wusl.2):** As the model generates content after the `---ARTEFACT-START---` signal, each incoming chunk that contains artefact content updates the Live Draft panel incrementally. The panel does not wait for `---ARTEFACT-END---` to display content — it builds up in real time. The final panel state after `---ARTEFACT-END---` is identical to the current behaviour.

## Out of Scope

- Anthropic streaming API implementation (provider-level change) — the fallback UX is acceptable for MVP
- Editing the artefact in the live draft panel during generation — view-only, not interactive
- Streaming for the legacy Q&A (scrape-first) flow — only the mfc.1 model-first chat sessions are in scope
- Persistence of the partial draft if the browser is closed mid-stream — in-memory only

## Assumptions and Risks

- The `turn-stream` SSE endpoint already delivers chunks reliably for the Copilot provider — this has been exercised but not formally verified under load.
- The artefact partial-content detection (scanning for `---ARTEFACT-START---` in accumulated buffer before `---ARTEFACT-END---` is seen) can be done client-side without server changes by interpreting the raw chunk stream.
- Risk: chunk boundaries may split across the signal strings — the client-side parser must handle split markers gracefully.

## Directional Success Indicators

- An operator opens a skill session, types an answer, and sees text appearing in the chat bubble within 1–2 seconds, streaming progressively until the turn is complete.
- During a session turn where the model produces an artefact, the Live Draft panel begins populating within 1–2 seconds of the `---ARTEFACT-START---` signal being received, and builds up line by line until the turn completes.

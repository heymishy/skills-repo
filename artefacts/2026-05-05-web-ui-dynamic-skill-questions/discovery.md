# Discovery: Web UI Dynamic Skill Questions

**Status:** Approved
**Created:** 2026-05-05
**Approved by:** Hamish King — 2026-05-05
**Author:** Copilot

---

## Problem Statement

The web UI skill flow presents questions from a static list extracted mechanically from SKILL.md. The model does not adapt the conversation based on prior answers — it cannot skip covered ground, combine related questions, interpret "suggest some", or confirm a section before moving on. Operators experience this as a rigid form, not a guided conversation. Artefact quality is lower than the VS Code surface because the model never validates, synthesises, or frames the operator's answers — it just records them.

This became operationally visible after wuce.26 shipped per-answer model responses: the model now clearly "sees" the conversation but still ignores it when choosing what to ask next. The gap is no longer theoretical.

## Who It Affects

**Operators running skills via the web UI** — developers, tech leads, and product managers who access the skill launcher through a browser rather than VS Code. They are running structured outer-loop sessions (discovery, definition, review etc.) and expect the same guided, adaptive conversation they would experience in VS Code. They hit this problem on every skill session that has more than 3–4 questions.

## Why Now

wuce.26 (merged) added per-answer model responses to the web UI skill flow — which made the static question list the most visible remaining gap. The first real `/discovery` session run through the web UI surfaced the problem directly: the model acknowledged answers but the next question was always the mechanically-next item from the SKILL.md heading list, regardless of what had just been said. Shipping model responses without adaptive questioning creates a worse experience than no model at all — the model now clearly "sees" the conversation but still ignores it when choosing what to ask next.

## MVP Scope

After each answer is recorded in `htmlRecordAnswer`, a second model call asks: *"Given the skill instructions and the conversation so far, what is the single best next question to ask the operator?"* The response replaces the mechanically-next item from the static list. The session stores a `dynamicQuestions[]` array that grows turn by turn — each entry is the model-generated next question, or a fallback to the static list item if the API call fails or times out. The static list is retained as the fallback and as the source for question count / progress display. No changes to the session commit flow, artefact structure, or the executor signature — the only behavioural change is what question text gets served on the next GET.

Additional stories within this initiative (not excluded from scope):
- Section confirmation loop — model writes a section draft and asks "confirm?" before moving on
- Post-session /clarify gate — "Discovery draft complete ✅ / Run /clarify" prompt at end of session
- Section-by-section artefact assembly using the skill template

## Out of Scope

- **Full VS Code surface parity** — matching all VS Code behaviours in a single initiative; this feature makes targeted improvements, not a wholesale rewrite
- **Streaming/SSE question delivery** — deferred, not permanently excluded; may be added in a later story once the dynamic question generation baseline is stable

## Assumptions and Risks

**Assumptions:**
- The `_skillTurnExecutor` already in production (from wuce.26) can be reused for the next-question call — same API endpoint, same token, different prompt
- The static question list is a reliable fallback — all skills have extractable headings, and no skill is so free-form that a fallback question would be meaningless
- A single additional model call per turn (for the next question) is acceptable latency — operators will tolerate a brief pause on submit

**Risks:**
- Model generates a question that restates ground already covered → mitigated by including full conversation history in the prompt
- Model generates a question count mismatch (fewer/more questions than the static list) → static list length controls progress display; dynamic questions are per-turn substitutions only, not additions
- API failure rate on the next-question call degrades the experience even with graceful fallback → fallback to static list must be silent and seamless

## Directional Success Indicators

- Operators complete skill sessions without answering questions that feel irrelevant or already covered
- The model's next question visibly references or builds on the prior answer — operators notice it adapted
- Session completion rate (P3) holds or improves versus the static-question baseline
- No increase in abandoned sessions attributable to a wrong or confusing model-generated question
- Fallback to static questions is invisible — operators cannot tell when it fired
- **Web UI share of outer loop artefacts** — % of discovery/definition/review artefacts committed via the web UI versus VS Code; a rising share indicates operators are choosing and completing sessions on the web surface rather than falling back to VS Code

## Constraints

- No new npm dependencies — must use Node built-ins only (same constraint as wuce.26)
- No Express — raw `http.createServer` only
- Injectable adapter pattern (D37/ADR-009) — new executor for next-question generation must follow the same pattern as `_skillTurnExecutor`; stub default must throw
- `req.session.accessToken` canonical — never `req.session.token`
- Static list retained as fallback — question count and progress display continue to derive from it; dynamic questions are per-turn substitutions only
- All 14 wuce.26 tests must stay green — no regressions permitted

## Contributors

- Hamish King — Platform / Framework Owner
- Jenni Ralph — Product Guru

## Reviewers

- Jenni Ralph — Product Guru

## Approved By

Hamish King — Platform / Framework Owner — 2026-05-05

---

**Next step:** Human review and approval → /benefit-metric

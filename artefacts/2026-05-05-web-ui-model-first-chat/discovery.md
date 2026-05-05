# Discovery: Web UI Model-First Chat Architecture

**Status:** Approved
**Created:** 2026-05-05
**Approved by:** Hamish King — Platform / Framework Owner — 2026-05-05
**Author:** Copilot

---

## Problem Statement

The current web UI skill session flow scrapes `> **...**` blockquote lines from SKILL.md to produce a fixed question list, and scrapes `##` headings to produce artefact sections. The model is called three times per answer (coaching insight, next-question generation, section-draft synthesis) but is never given the SKILL.md as a system prompt — it is given role-framing strings invented in the route handler code. This produces three concrete failures:

1. The questions asked are determined by the scraper, not the model reading the skill instructions. The model cannot adapt questions based on context, follow up on important answers, or exercise any of the judgement encoded in the SKILL.md.
2. The artefact sections come from operational H2 headings inside the SKILL.md (e.g. "Step 0", "Entry condition", "What this skill does NOT do", "State update") plus H2 headings from product context files — not from the output template. Discovery produces 30+ wrong sections.
3. The artefact content is raw Q&A strings pasted under the wrong headings — not a synthesised document.

In VS Code, the model receives the full `copilot-instructions.md` + `SKILL.md` as a system prompt and drives the entire conversation. The web UI achieves none of this. The gap means a web UI session does not produce a usable artefact and cannot be used to run the pipeline.

## Who It Affects

**Pipeline operators** using the web UI as an alternative to VS Code — primarily those without VS Code access (e.g. non-engineers running discovery sessions via browser). They receive a broken experience: irrelevant questions, wrong artefact structure, and a commit that produces garbage output that fails trace validation.

**The pipeline itself** — any feature started via web UI produces an artefact that fails `/trace` and does not conform to the discovery template, blocking downstream `/benefit-metric` and `/definition` runs.

## Why Now

The `/improve` run on wuce (2026-05-05, commit `8b6569a`) surfaced ten patterns, several of which describe this architectural gap. Three bugs were patched (commits `9ebc7fb`) but the underlying architecture was explicitly noted as wrong during that session. The dsq stories (dsq.1–dsq.4) were implemented against the wrong architecture and their tests now verify incorrect behaviour. If we continue building on top of the scrape-first approach, every future dsq story will need re-work. Stopping here is cheaper than continuing.

## MVP Scope

- Replace the multi-page question form (`/next` → `POST /answer` redirect chain) with a single-page chat interface that renders conversation history above a fixed input area.
- Load `copilot-instructions.md` + `SKILL.md` + product context + reference materials as a single system prompt per session.
- Pass the full conversation history to the model on every turn; the model decides what to ask.
- Parse `---ARTEFACT-START---` / `---ARTEFACT-END---` markers from the model response to capture the artefact when the model signals it is done.
- Parse a `---SLUG---` line from the model response to derive the correct artefact path (`artefacts/[slug]/[skill].md`).
- Replace `htmlGetNextQuestion`, `htmlRecordAnswer`, `registerHtmlSession`, and `htmlGetPreview` with model-first equivalents.
- Add two new routes: `GET /skills/:name/sessions/:id/chat` and `POST /api/skills/:name/sessions/:id/turn`.
- Remove `_nextQuestionExecutor` and `_sectionDraftExecutor` adapters (or make them no-ops); retain `_skillTurnExecutor` with updated signature.
- Update `skill-turn-executor.js` to accept `(systemPrompt, history, currentInput, token)` where `history` is `[{role, content}]`.
- Rewrite the 7 test files whose tests are now testing the scrape-first behaviour.

## Out of Scope

- Streaming responses (SSE or chunked transfer) — the model response is received in full before appending to the chat view; streaming is a separate story.
- Saving conversation history to disk between server restarts — the in-memory session store continues to be used.
- Multi-skill sessions or session branching — one SKILL.md per session only.
- Mobile-responsive layout — the chat UI is desktop-first; responsive polish is deferred.
- Authentication changes — the existing session auth guard remains unchanged.

## Assumptions and Risks

- **Assumption:** The model, when given the full SKILL.md as a system prompt, will produce well-structured artefacts conforming to the template. If the model does not reliably signal `---ARTEFACT-START---`, sessions will not produce committable output. Mitigation: the system prompt explicitly instructs the model to use the signal; the web UI framing is tested with a real token in the smoke test.
- **Assumption:** The `---ARTEFACT-START---` / `---ARTEFACT-END---` signal protocol is unambiguous. Risk: the model may produce the markers inside code blocks or examples. Mitigation: the system prompt says "when you are ready to produce the final artefact" — not "whenever you write markdown".
- **Risk:** Rewriting 7 test files means temporarily breaking the test suite until the implementation and tests land together. The tests and implementation must be committed atomically.

## Directional Success Indicators

- A web UI discovery session produces a discovery artefact whose H2 sections match `.github/templates/discovery.md` exactly.
- The artefact passes `/trace` without modification.
- A non-engineer can run a `/discovery` session end-to-end via browser in under 20 minutes.

## Constraints

- Node.js CommonJS, no new npm packages, no Express.
- All injectable adapters follow D37/ADR-009: default stubs throw, not return null.
- `req.session.accessToken` canonical — never `req.session.token`.

## Contributors

Hamish King — Platform / Framework Owner

## Reviewers

Hamish King

## Approved By

Hamish King — 2026-05-05

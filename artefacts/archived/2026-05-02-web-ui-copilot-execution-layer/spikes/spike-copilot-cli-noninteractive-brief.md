# Spike Brief: Copilot CLI Non-Interactive Server-Side Invocation

**Opened:** 2026-05-02 | **Scope:** Thorough | **Type:** Technical feasibility (Type 1)
**Feature:** `2026-05-02-web-ui-copilot-execution-layer`
**Blocking:** `/definition` for Phase 2 (skill execution epic) + benefit metric M1

---

## Question

Can the GitHub Copilot CLI or Copilot API be invoked non-interactively server-side with an assembled SKILL.md prompt and return structured, parseable output — enabling Phase 2 skill execution from a web backend?

---

## Done condition

Documented verdict with:
(a) Confirmed invocation mechanism or confirmed impossibility
(b) Authentication model for server-side use
(c) Session state approach for multi-turn skills
(d) Self-hosting constraint compatibility

---

## Out of scope

- Full working web app prototype
- GitHub OAuth flow implementation
- Any non-GitHub LLM provider as a primary path
- Phase 1 sign-off surface

---

## Verdict definitions

**PROCEED:** Confirmed invocation path exists (CLI non-interactive or Copilot API endpoint) with sufficient documentation to design Phase 2 stories.

**REDESIGN:** Copilot CLI/API cannot be used server-side; must use direct model API (GitHub Models, Azure OpenAI) with SKILL.md as system prompt — Phase 2 still buildable but different path.

**DEFER:** Insufficient public documentation; requires GitHub partner access or private beta — Phase 2 stories cannot be scoped.

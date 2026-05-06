# Discovery: Web UI Guided Outer Loop Journey

**Status:** Approved
**Created:** 2026-05-06
**Approved by:** Hamis — 2026-05-06
**Author:** GitHub Copilot / Hamis

---

## Problem Statement

The skills pipeline outer loop — /workflow → /discovery → /benefit-metric → /definition → /test-plan → /review → /definition-of-ready — can only be run through VS Code Copilot chat. Operators must know which skill to invoke in what order, when to side-trip to /clarify, /decisions, or /trace, and when a stage is complete and the next begins — entirely from prior knowledge. There is no web-based orchestrated path.

The VS Code surface is gaining traction and popularity with engineers, but the setup friction (IDE installation, Copilot subscription, skills configuration) is too high for non-engineers to adopt independently. The outer loop is inaccessible to the practitioners who are most valuable in discovery — BAs, business leads, SMEs, and product owners — those closest to the problem but furthest from the toolchain. The platform cannot keep pace with adoption if it can only be used by engineers comfortable in VS Code.

## Who It Affects

- Software engineers and developers running the outer loop for their own delivery work
- Tech leads and squad leads who own story definition and want to drive discovery without toolchain setup friction
- Business analysts and SMEs who should be active discovery contributors but cannot navigate VS Code
- Business leads and product owners who need to drive or review discovery artefacts without depending on an engineer to operate the surface
- Platform maintainers onboarding new adopters who need a lower-friction entry point than VS Code + Copilot setup

## Why Now

The VS Code surface is gaining traction and popularity with engineers, but the friction of setup is too high for non-engineers and the platform needs to keep pace with that change. mfc.1 landed the model-first chat architecture — a working execution engine that drives skill sessions through the web UI using the exact same SKILL.md files and system prompts as the VS Code surface. The orchestration wrapper (/workflow reading state → skill routing → artefact detection → stage transition → next skill launch) is the natural next build on that foundation. Without it, every non-engineer who could contribute to discovery is permanently blocked at the toolchain boundary, and the outer loop remains an engineering-only activity.

## MVP Scope

Full outer loop journey, fully orchestrated through the web UI:

1. **Session start** — /workflow reads pipeline state and routes to the appropriate first skill (usually /discovery for a new idea). The practitioner does not need to know which skill to call.
2. **/discovery** — guided conversation producing a discovery.md artefact, saved to disk at `artefacts/[date-slug]/discovery.md`
3. **/benefit-metric** — follows discovery approval, produces and saves benefit-metric.md
4. **/definition** — epics and stories produced, artefacts saved to `artefacts/[slug]/stories/` and `epics/`
5. **/test-plan** — test plans produced per story, saved to `artefacts/[slug]/test-plans/`
6. **/review** — review runs per story, findings surfaced inline
7. **/definition-of-ready** — DoR sign-off produced, saved to `artefacts/[slug]/dor/`

Stage transitions are gated: when a skill produces its stage artefact, the web UI presents an operator confirmation step ("Save [artefact name] and continue to [next skill]?") before writing the artefact to disk and loading the next skill session. The operator does not need to know what comes next — the confirmation is pre-labelled by the journey — but the write and the transition are not fully automatic.

Side-trips (/clarify, /decisions, /trace, /estimate, /spike) are **out of scope for this MVP** — see Out of Scope. The straight-through happy path is the only supported journey. Operators who need a side-trip mid-session may complete it manually in VS Code and resume the web UI journey.

The exact same SKILL.md files are used. No reimplementation of skill logic. mfc.1 skill-turn-executor is the execution engine.

## Out of Scope

- **Inner loop** (/branch-setup, /implementation-plan, /subagent-execution, /verify-completion, /tdd) — coding execution stays VS Code for this MVP; the web UI journey ends at DoR sign-off
- **Multi-user / collaborative sessions** — each session is single-user; no shared editing, concurrent participants, or team handoff within the web surface
- **Direct coding agent dispatch** — the web UI saves DoR artefacts to disk but does not open GitHub issues, create PRs, or trigger the coding agent
- **Session persistence across browser close** — if the tab is closed mid-session, the session is not resumable; same in-memory behaviour as mfc.1
- **Automatic pipeline-state.json write-back** — artefacts are saved to disk; `.github/pipeline-state.json` update remains a manual operator step for MVP
- **Side-trips** (/clarify, /decisions, /trace, /estimate, /spike mid-journey) — MVP is straight-through happy path only; side-trips that arise during a journey must be handled manually in VS Code; the stack-based session model required for automatic side-trip nesting and resume is a post-MVP concern
- **Fully automatic stage transitions** — stage transitions are gated on operator confirmation (see MVP Scope); artefact write and next-skill load are not triggered without an explicit operator action

## Assumptions and Risks

**Assumptions:**
- The mfc.1 skill-turn-executor and system prompt assembly pattern is sufficient to drive per-skill sessions — each stage is an independent session using the appropriate SKILL.md, with a handoff context block injected at session start.
- The same SKILL.md files that produce correct output in VS Code can be loaded verbatim for the web UI — no reimplementation or adaptation is required.
- Artefact detection via the existing signal protocol (---ARTEFACT-START--- / ---ARTEFACT-END---) generalises across all outer loop skills, not just single-skill sessions.
- Session state can encode the current pipeline stage (active skill, artefacts produced so far, handoff context) without requiring a persistent store — in-memory is sufficient for a single operator session without browser close.

**Architectural decision required — spike dependency (primary unknown):**
Two architectures are under consideration for multi-skill orchestration:

- **Option A — Single persistent /workflow session:** /workflow SKILL.md is loaded once; subsequent skill SKILL.md content is injected into the same session context as stages advance. History continuity is maintained across stages. Side-trip nesting is harder (requires in-session context switching). Very long sessions may exceed model context limits.
- **Option B — /workflow as router, per-skill sessions with handoff:** /workflow acts as a stateless router; each skill stage runs in its own fresh session. The router passes a structured handoff block (prior artefact paths, key decisions, active feature slug) as a context prefix when starting each new session. History does not carry across sessions. Side-trips are their own session. Context limits are not a concern per session. Consistent with the mfc.1 single-skill model.

**Directional preference: Option B.** Cleaner isolation, tractable context management, maps directly to the mfc.1 model. History continuity across stages is a nice-to-have, not a requirement — artefact files on disk serve as the durable record. **This must be validated as a spike before definition begins.**

**Risks:**
- Skill SKILL.md files may contain VS Code-specific instructions (e.g. "run git command", "create file via tool") that the web UI cannot execute — the web UI protocol section in the system prompt may need to be extended to override these with artefact-write equivalents.
- The handoff context block (Option B) must carry enough prior-stage context for each skill to produce coherent output without having seen the prior conversation — the schema and content of that block is an open design question for the spike.
- Non-engineers using the web UI may produce lower-quality discovery artefacts if the guided journey does not scaffold context (what is this stage for, what counts as done) — may need stage-entry preamble injected at the start of each skill session.
- Side-trips (e.g. /clarify called mid-discovery) are descoped from MVP. If the model recommends a side-trip during a session, the operator must leave the web UI, run it in VS Code, and return. This is a gap acknowledged at MVP scope.

## Directional Success Indicators

- A practitioner opens the web UI, runs the guided journey from /workflow through /discovery, and the resulting discovery.md artefact is complete and ready for approval — without touching VS Code or needing prior pipeline knowledge
- A non-engineer (BA, business lead, SME) **who has a GitHub account** can complete a /discovery artefact end-to-end through the web UI without assistance from an engineer operating the toolchain
- The full outer loop produces DoR-ready stories that are structurally equivalent to those produced via the VS Code surface — the coding agent can consume them without modification

## Constraints

- Zero new npm dependencies — Node.js built-ins only; no new packages added to package.json
- Same SKILL.md files, same rules — no reimplementation of skill logic; the web UI surface reads the same files as VS Code
- mfc.1 model-first chat architecture (skill-turn-executor, system prompt assembly, artefact signal protocol) is the execution engine — this feature builds the orchestration wrapper on top
- **GitHub account required** — the web UI requires GitHub OAuth login; non-engineer personas (BAs, SMEs, business leads) must have a GitHub account to use the surface; no alternative auth path is in scope for this MVP
- Session authenticated via GitHub OAuth (same as existing web UI); `req.session.accessToken` is the canonical token field
- Artefact writes are server-side file writes to the repo root — the web UI cannot run shell commands, git operations, or OS-level scripts on the operator's machine
- **Spike required before definition** — the orchestration architecture (Option A vs Option B, handoff block schema) must be resolved as a spike before stories can be written; definition is blocked until the spike produces a PROCEED verdict

## Architecture / Technical Context

The new journey builds on the following existing components from mfc.1:
- `src/modules/skill-turn-executor.js` — executes a skill turn given system prompt, history, current input, and token
- `src/web-ui/routes/skills.js` — `handleGetChatHtml` and `handlePostTurnStreamHtml` — the chat session handler
- System prompt assembly: copilot-instructions.md → skill SKILL.md → product context files → WEB UI PROTOCOL section
- Artefact signal protocol: `---SLUG---` / `---ARTEFACT-START---` / `---ARTEFACT-END---` inline markers; `session.done = true` on detection

The orchestration layer (/workflow routing → skill transition → artefact save → next skill load) is the primary new component.

**EA registry blast-radius:** No EA registry entry found for `web-ui`. Proceed without blast-radius data — this does not block discovery.

## Contributors

- Hamis — Platform operator / product owner
- GitHub Copilot — Discovery facilitation

## Reviewers

- Hamis — Platform operator / product owner

## Approved By

- Hamis — Platform operator / product owner — 2026-05-06

---

**Next step:** Human review and approval → /benefit-metric

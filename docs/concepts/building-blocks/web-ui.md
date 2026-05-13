# Web UI Execution Layer

## What it is

The web UI is a browser-based operator surface that runs the skills pipeline without VS Code or a local git environment. Operators sign in via GitHub OAuth, launch skill sessions, watch model output stream live, and commit the resulting artefact directly to the repository — from a browser tab. It is the primary Phase 5 delivery.

## Why it exists

The skills pipeline was originally VS Code-native: operators needed a local clone, a GitHub Copilot Chat subscription, and familiarity with VS Code agent mode. This excluded non-technical operators (product managers, BAs, security reviewers, domain experts) who need to participate in discovery, benefit-metric definition, DoR sign-off, or review steps but do not work in a code editor.

The web UI closes that gap. Any operator with a GitHub account and a browser can run an outer-loop skill session, view pipeline state, or sign off a DoR — without a local development environment.

## How it works

The server is a zero-framework Node.js HTTP module (`src/web-ui/server.js`) using `http.createServer()` routing. There are no npm AI libraries, no external service dependencies, and no persistent database. Session state is an in-memory `Map`; server restarts clear all sessions.

**Model-first architecture:** When an operator starts a skill session, the server assembles a system prompt from the full `SKILL.md` text and the product context files (`product/mission.md`, `product/tech-stack.md`, etc.). This system prompt is sent to the model with the operator's opening message. The model drives the entire session — it asks questions, gathers context, and produces the artefact. The operator responds to the model's questions; the model decides when it has enough information to proceed.

**Streaming:** Model output streams to the browser via Server-Sent Events (SSE). The live draft panel renders each token as it arrives; the operator sees the artefact being written in real time.

**Artefact commit:** When the model completes an artefact, the operator reviews it and confirms commit. The server writes the artefact file via the GitHub Contents API using the operator's OAuth token — no local git operations required.

**GitHub OAuth:** Authentication uses a GitHub OAuth App (not a GitHub App or PAT). The canonical session field is `req.session.accessToken`. All routes that read the GitHub token from session use exactly this field.

**Injectable adapters:** Every external dependency (GitHub API calls, Copilot API calls, file I/O, session store) is wired through an injectable adapter following the D37 pattern. Default stubs throw — they do not return safe-looking empty values. Production wiring is done in `server.js` at startup.

## Key delivered capabilities

- **Streaming skill session** with live draft panel — any skill can be run from the browser with full SKILL.md context
- **Artefact commit** via GitHub Contents API — the artefact is committed to the correct `artefacts/` path in the repository
- **Guided outer-loop journey mode** — a sequential wizard that leads operators through the pipeline stages (discovery → benefit-metric → definition → DoR) with stage validation and exit conditions
- **DoR sign-off routing** — the `/approve-dor` GitHub issue interface is accessible from the browser; the server posts the sign-off command on behalf of the operator
- **PR annotation** — operators can add structured review notes to open PRs without leaving the browser
- **Pipeline status board** — reads `pipeline-state.json` and renders the current state of all features, with CSV/JSON export
- **Session management** — supports multiple concurrent skill sessions; session list view shows active and completed sessions

## Technology decisions

- CommonJS throughout — no ESM, no TypeScript compile step
- `http.createServer()` routing — no Express, Fastify, or other web framework
- Zero new npm dependencies — the constraint is enforced at the repo level; no `require('openai')` or similar
- Default model: `claude-sonnet-4-6` via `POST https://api.githubcopilot.com/chat/completions`
- `SKILL_EXECUTOR_PROVIDER=anthropic` env var switches the executor to direct Anthropic API for sweep/CI use

These constraints follow ADR-012 (platform-agnostic, no hosted runtime) and ensure the web UI can run from a Docker container with no external service provisioning.

## What you do with it

Run `docker-compose up` to start the web UI locally. Visit `http://localhost:3000`, authenticate via GitHub OAuth, and you have the full skills pipeline in your browser. Non-technical operators can be given the URL and a GitHub login; they do not need any local tooling.

## Further reading

Optional further reading: [Adapter-isolated surface concerns](../principles/adapter-isolated-surface-concerns.md) — explains the adapter pattern the web UI relies on.
Optional further reading: [Skills pipeline](skills-pipeline.md) — the pipeline the web UI surfaces.
External reference: [docs/web-ui-skill-session-as-built.md](../../web-ui-skill-session-as-built.md) — as-built architecture reference.
External reference: [docs/web-ui-copilot-api-guide.md](../../web-ui-copilot-api-guide.md) — Copilot API integration guide.

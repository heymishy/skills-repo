# Discovery: Web UI Product Management Flow

**Status:** Draft — awaiting approval
**Created:** 2026-06-14
**Author:** Hamish King (Platform operator / tech lead) + Copilot (Claude Sonnet 4.6)
**Attribution:** Hamish King — Platform operator / tech lead

---

> **Process note:** Stories pmf.1 (Kanban board) and pmf.2 (Ideas backlog) were implemented
> and committed in commit `7c42380` before this discovery artefact was written. This is an
> exception to the artefact-first rule. The implementation is retained; this discovery
> retroactively documents the problem statement and scope that motivated that work, and
> formally frames pmf.3 (orientation wizard) as the next delivery item. **pmf.3 must not
> be implemented until this discovery is approved and pmf.3 passes DoR.**

---

## Problem Statement

The skills pipeline has grown to 20+ registered features across multiple stages. As the
platform matures and work accumulates, three failure modes are appearing:

**1. WIP blindness.** The `/features` list view shows features in a flat table but gives no
sense of how much work is in each stage at once. It is impossible to see at a glance that
three features are simultaneously at review, two more are waiting for discovery sign-off, and
one is blocked in delivery. The operator discovers WIP pile-ups only when manually scanning
the table — by which point the blocking pattern is already embedded. Good product management
practice requires WIP visibility by stage so flow problems can be spotted and addressed early.

**2. Idea capture loss.** New feature ideas arise during sessions — in conversation, in
experiment results, in commercialisation discussions. Currently they are spoken, typed into a
conversation thread, and lost. There is no lightweight capture mechanism between "raw idea
in a conversation" and "registered feature in pipeline-state.json". Ideas that never make it
to a discovery artefact are invisible to the pipeline and to any future collaborator. The cost
is compounding: every idea lost before discovery is a feature the pipeline never considers,
which biases the roadmap toward ideas that happen to get written up quickly over ideas that
are actually better.

**3. Session start disorientation.** The current session entry point (`/journey`) uses
`handleGetWizard` (wucp.4) to ask "new project or existing?" — a single-question form that
renders a plain `<li>` slug list. For a returning operator with three features in flight,
this does not answer "where should I be working right now?" It does not surface health signals,
does not distinguish between resuming an in-progress session and advancing a pipeline stage,
and does not connect the ideas backlog to the discovery skill. The session start experience
creates orientation overhead every time the platform is opened.

These three problems compound each other: without WIP visibility the operator doesn't know
which feature needs attention; without idea capture the next-discovery candidate is invisible;
without a context-aware entry the operator must mentally reconstruct state before they can work.

---

## Who It Affects

**Primary — Platform operator (Hamish King, solo operator today; small team of 2–5 within
six months).** Opens the web UI to run skills sessions and manage pipeline work. The operator
switches between features multiple times per week. They currently maintain mental state of what
is in flight across the pipeline — a cognitive load that grows linearly with feature count and
breaks down when collaborating with a second person.

**Secondary — Collaborating team members (target: 2–5 within six months, per commercialisation
roadmap).** A new team member opening the web UI for the first time has no orientation surface
at all beyond the feature list table. They cannot tell what needs doing, what is blocked, or
where to start. This is the "handed the keys and left alone" problem — the platform's governance
and pipeline structure are invisible until someone explains them.

---

## Why Now

Three converging triggers:

**1. Feature count threshold reached.** The pipeline reached 20+ registered features in
June 2026. Below ~8 features, mental state management is viable. Above ~15, it breaks down —
particularly when some are at complex mid-delivery stages (branch-setup, review) while others
are early-stage (discovery, ideation). The threshold has been crossed.

**2. Commercialisation roadmap active.** The EXPERIMENTS-SUMMARY.md commercial case (committed
`db27ef2`) identifies throughput multiplication as the primary value proposition. Team adoption
of the platform — the mechanism that produces throughput multiplication — requires the web UI
to be self-orienting for new users. A context-aware session start and a visual WIP board are
prerequisites for a second person to use the platform productively without a guided walkthrough.

**3. Ideas are already being lost.** In the conversation session of 2026-06-12 and 2026-06-14,
multiple feature ideas were discussed (orientation wizard, commercial ideation, B1 check-suite
orchestrator) without a capture mechanism. Several of those ideas exist only in conversation
history and are at risk of being lost when context is summarised. The cost of missing ideas
is invisible until it is measured — this discovery names it before that measurement is needed.

---

## MVP Scope

Three stories:

### pmf.1 — Kanban board view (IMPLEMENTED — see commit 7c42380)

A Kanban board at `/features?view=board` with six lanes: Ideas → Discovery → Definition →
In Review → In Delivery → Done. Feature cards from `pipeline-state.json` are grouped by
stage with health-dot colour (green/amber/red), slug, title, and age-in-stage. WIP limit
badges on In Review (4) and In Delivery (5) columns. List/Board toggle links in the page
header. Board uses CSS flex layout; no new npm dependencies.

**What was built:** `src/web-ui/views/kanban-view.js` (renderer, XSS-safe via `escHtml`),
`tests/check-kanban-view.js` (30 structural assertions). Route integration in
`src/web-ui/routes/features.js` (`?view=board` branch in `handleGetFeatures`).

**What is still missing:** formal test-plan artefact at
`artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.1-test-plan.md`, review artefact, DoR,
DoD. These must be produced before pmf.1 can be declared complete in the pipeline.

### pmf.2 — Ideas backlog (IMPLEMENTED — see commit 7c42380)

A pre-discovery ideas capture mechanism: `workspace/ideas.json` stores ideas as
`{ id, title, notes, createdAt }`. Three API endpoints:
- `GET /api/ideas` — returns the ideas list (auth-gated)
- `POST /api/ideas` — creates a new idea (body: `{ title, notes? }`)
- `DELETE /api/ideas/:id` — removes an idea by id

The Ideas lane in the Kanban board shows each idea as a dashed card with a quick-capture
form (inline POST) and a "Start Discovery →" link pointing to
`/skills/discovery/sessions?idea=<id>`.

**What was built:** `workspace/ideas.json`, `handleGetIdeas` / `handlePostIdea` /
`handleDeleteIdea` in `src/web-ui/routes/features.js`, server.js route wiring.

**What is still missing:** same as pmf.1 — formal test-plan artefact, review, DoR, DoD.

### pmf.3 — Context-aware orientation wizard (PLANNED — no implementation yet)

Upgrade `handleGetWizard` in `src/web-ui/routes/journey.js` from a single-question
`<li>` slug list to a three-step orientation:

**Step 1:** "What are you here to do?" with three primary options:
- Start something new (→ Discovery skill, optionally pre-seeded from an idea)
- Continue an existing feature (→ step 2)
- Resume an active session (→ active session list)

**Step 2 (if Continue):** Feature card picker using the same card component as the
Kanban board — health dot, title, slug, stage, age. Not a plain slug list. Filtered
to active features (excludes released, archived).

**Step 3 (if Resume):** Active in-progress web session list (sessions with `done: false`
in `_sessionStore`), showing skill name, session start time, last question asked.

The ideas backlog from pmf.2 becomes accessible from step 1 ("Start from an idea" as a
sub-option under "Start something new") — the idea title pre-populates the Discovery skill
session context.

**pmf.3 must not be implemented until this discovery is approved and pmf.3 passes DoR.**

---

## Out of Scope

- **Drag-and-drop stage transitions.** Moving a feature card from one Kanban lane to another
  by dragging must not trigger a pipeline-state.json write. Stage transitions are governed
  operations (CDG.4 enforcement) — they must go through `skills advance` or the gate-confirm
  endpoint, not a mouse drag. Drag-and-drop may be considered as a visual affordance in a
  future story if it is explicitly constrained to read-only reordering within a lane.

- **External tool sync (Linear, Jira, GitHub Issues).** The ideas backlog and Kanban board
  are local-first. No sync to or from external project management tools is in scope for this
  feature. The decision to integrate with an external tool is a separate discovery.

- **Mobile / responsive layout.** The web platform has no mobile support. This feature adds
  none.

- **Team assignment and notification.** No assignee field on cards, no email or Slack
  notifications. Multi-user collaboration is a future feature; this is a solo-operator MVP.

- **Idea notes editing.** The quick-capture form captures a title (120 chars max). Extended
  notes editing (multi-line, markdown, attachments) is out of scope. If an operator needs to
  elaborate on an idea, they should start a Discovery session — that is the correct surface
  for detailed scoping.

- **Board persistence across browser close.** The board renders from `pipeline-state.json`
  and `ideas.json` on every page load. No local-storage or server-side board state is stored.
  WIP limit overrides and column collapse state are not persisted.

- **pmf.3 orientation wizard until formal definition and DoR are complete.** See process note
  at the top of this document.

---

## Assumptions and Risks

[ASSUMPTION] `workspace/ideas.json` committed to the repo is the right storage model for the
ideas backlog — unconfirmed for team use. For solo use it is appropriate (ideas are part of
the operator's working context, same as `workspace/capture-log.md`). If the platform moves to
a team of 2–5, ideas from different operators may conflict or diverge in the same file. A
future story should evaluate whether ideas should be scoped per-operator (e.g. in a local-only
file excluded from git) or remain shared state in the repo.

[ASSUMPTION] The Kanban column width (220px fixed) is readable with the feature titles in the
current pipeline — unconfirmed. Some feature slugs are long (e.g.
`2026-05-19-cli-deterministic-governance`). If titles truncate in a way that prevents
identification of the card, the column width may need to be widened or slugs need to be
replaced by human-readable titles from `pipeline-state.json`. The `title` field is already
used where available; the slug is shown in smaller muted text below.

**Risk — ideas.json data integrity.** `ideas.json` is written by the server-side
`handlePostIdea` / `handleDeleteIdea` handlers using synchronous `fs.writeFileSync`. Concurrent
POST/DELETE requests from multiple browser tabs could produce a write race. For a solo operator
this is acceptable; for a multi-user deployment it requires locking. This is a known and
accepted risk for the current deployment context.

**Risk — pmf.3 wizard complexity.** The three-step orientation wizard (pmf.3) requires reading
both `pipeline-state.json` (for existing features) and the session store (for active sessions).
If the session store is large, the resume step may have a performance cost. The performance NFR
from wucp.4 (handleGetWizard must respond < 200ms for 15 features) must be carried forward into
the pmf.3 definition stories.

---

## Directional Success Indicators

**1. WIP visibility — operator can read the pipeline state at a glance**
Target: at `/features?view=board`, all active features are visible without scrolling the
browser window (for a pipeline of up to 12 active features). Measured via: manual review of
board layout with real pipeline-state.json after pmf.1 DoD.

**2. Idea capture rate — ideas captured before they are lost**
Baseline: 0 ideas captured in `workspace/ideas.json` today (file initialised empty).
Target: at least 3 ideas are captured in the backlog within 14 days of pmf.2 DoD.
Measured via: `ideas.json` entry count at the 14-day mark.

**3. Session start time — orientation overhead reduced**
Baseline (pmf.3 pre-condition): operator must manually navigate from `/features` to the
correct feature and skill before starting a session — typically 3–4 clicks.
Target (post-pmf.3): operator reaches the correct skill session from the homepage in ≤2
clicks for a returning-user scenario. Measured via: manual walkthrough test after pmf.3 DoD.

---

## Constraints

- **No new npm dependencies.** The web UI has a zero-external-dependency principle. All
  renderer and API code uses Node.js built-ins only.

- **CDG.4 enforcement must not be bypassed.** The Kanban board is read-only for stage
  transitions. Any future enhancement that appears to allow stage changes from the board must
  call `skills validate` + `skills advance` via the existing gate-confirm path in
  `journey.js`, not bypass it.

- **ideas.json must not contain sensitive data.** The ideas backlog is committed to the repo.
  Operators must not capture personal data, credentials, or commercially sensitive client names
  in idea titles or notes. This is a usage constraint documented here — not a technical control.

- **Governed files unchanged.** This feature does not modify any SKILL.md, POLICY.md, or
  standards file. No constraint 4 (product/constraints.md) violations.

- **wucp.4 tests must continue to pass.** pmf.3 modifies `handleGetWizard` in journey.js.
  The 20 existing wucp.4 tests in `tests/check-wucp4-session-wizard.js` form the regression
  baseline and must pass after pmf.3 is implemented.

---

## Open Architecture Decisions — Required Before pmf.3 Definition

**1. Session resume — what constitutes a "resumable" session?**
The pmf.3 step 3 (Resume active session) needs a definition of what sessions appear in the
list. Options: (a) all sessions with `done: false` and `lastActivity` within the last 24h;
(b) only sessions attached to a journey (via `linkSessionToJourney`); (c) all non-done
sessions regardless of age. This must be decided before pmf.3 ACs are written. Recommendation:
option (a) — 24h window balances recoverability with list brevity.

**2. Idea → Discovery pre-seed mechanism**
The "Start Discovery →" link from the Ideas column points to
`/skills/discovery/sessions?idea=<id>`. When this URL is opened, the Discovery skill should
receive the idea title as pre-seeded context. The mechanism for this is unspecified:
option (a) the idea title is passed as a query param and surfaced in the session's first
system message; option (b) a new session is created with `initialContext: { ideaTitle }` and
the session wizard reads it. This decision affects both the Discovery SKILL.md (which must
not be modified without a governed story) and the session creation flow. **Required before
pmf.2 DoR:** confirm which option, as a note in the pmf.2 DoR artefact. For MVP, option (a)
is sufficient — the Discovery skill already asks clarifying questions and can treat the URL
param as context, without any SKILL.md modification.

**3. Board as default view**
Currently `/features` defaults to the list view and `/features?view=board` shows the board.
Should the board become the default? Decision deferred to pmf.1 review — the reviewer should
evaluate whether the board or list view is the more useful default for the current pipeline
size and usage pattern.

---

## /clarify Recommendation

The two assumptions above (ideas.json team-use model, column width readability) are low-risk
and can be resolved empirically after pmf.1 and pmf.2 ship. No pre-benefit-metric /clarify
session is required.

The Open Architecture Decision 1 (session resume definition) must be resolved before the
pmf.3 definition story is written — this can be a one-paragraph decision note in the
pmf.3 DoR artefact rather than a full /clarify session.

Proceed to `/benefit-metric` after this discovery is approved.

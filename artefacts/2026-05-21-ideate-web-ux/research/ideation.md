# Ideation: /ideate Web UX — Structured, Stateful, Multi-Panel Skill Interface

| Field | Value |
|-------|-------|
| Feature | 2026-05-21-ideate-web-ux |
| Date | 2026-05-21 |
| Artefact path | artefacts/2026-05-21-ideate-web-ux/research/ideation.md |
| Lenses run | Lens A — Opportunity mapping (Torres) [complete]; Lens D — Product strategy framing (Cagan) [pending operator confirmation]; Lens B — Assumption inventory (Torres) [pending] |
| Pipeline state signal | in-progress |

---

## Context loaded

| Source | Status | Notes |
|--------|--------|-------|
| Feature discovery.md | Not found — new initiative | No prior artefacts for 2026-05-21-ideate-web-ux |
| Feature benefit-metric.md | Not found — new initiative | — |
| Feature stories | None yet | — |
| artefacts/2026-05-20-cloud-platform/research/ideation.md | Read | Format reference + product context: this UX is a component of the cloud platform, not a standalone product. Lens D, C, E, B ran for cloud platform. |
| artefacts/2026-05-19-cli-deterministic-governance/research/ideation.md | Read | Second format reference. Lens A, B, D ran. |
| src/web-ui/ | Read — full architecture survey | See tech stack confirmation below. |
| .github/skills/ | Read — 40+ skills enumerated | Full skill set known; /ideate is one of ~40 skills. |

**Tech stack confirmed before any design proposal:**

| Layer | Reality |
|-------|---------|
| Runtime | Node.js built-in `http` module — no Express, no framework |
| Frontend | Server-rendered HTML via JS view functions (`renderShell`, `renderChat`, component helpers). No React, Vue, or Angular. |
| State management | Server-side in-memory sessions (Map) + injectable disk session writer. Journey store (`journey-store.js`) is **in-memory only** — not persisted across server restarts. |
| Streaming | Server-Sent Events (SSE) — `handlePostTurnStreamHtml` is implemented and in production use. |
| Split-panel pattern | Already exists — `chat-view.js` renders left: chat thread, right: live `draftSections[]` panel (title / body / state ∈ drafted \| pending \| empty). |
| Input model | Form POST for operator answers; SSE for model streaming back. No WebSocket. |
| Session recovery | **Not natively available across browser close.** Journey store is in-memory. Disk persistence is injectable but only covers session content, not full journey/lens state. Infrastructure change required for cross-session recovery. |
| Auth | GitHub OAuth — `req.session.accessToken`. |

*Design constraint: proposals in this ideation must be realisable within this stack or must explicitly name the infrastructure change required.*

*Session note: Operator context is fully specified. Lenses A → D → B run in that order per operator instruction, pausing after each for confirmation. Lens C and Lens E are skipped (internal tool, not a market product). All eight specific design questions listed in the operator brief must be addressed across the lenses.*

---

## Lens A — Opportunity mapping (Torres)

*Framework: Teresa Torres — Continuous Discovery Habits: opportunity solution tree.*

### Desired outcome

The /ideate session consistently produces a high-quality ideation artefact with the correct comparator frame, confirmed and explicitly rated assumptions, tracked pre-/discovery conditions, and zero session drift — in a single sitting, without requiring the operator to catch errors mid-session or rework assumptions in /benefit-metric or /discovery.

*In measurable terms: the artefact produced by the web UX requires zero operator corrections in /benefit-metric's first pass, and zero pre-/discovery conditions are missed at end-of-session.*

### Opportunity tree

```
Outcome: Zero-drift /ideate sessions that produce artefacts requiring no rework downstream

├── Cluster 1: Context loading is invisible and unverified
│   ├── Pain: Agent reads context files implicitly — operator cannot see what
│   │   was loaded or verify that the correct files were read before the
│   │   session begins reasoning
│   ├── Pain: The wrong comparator is imported silently. In a recent session,
│   │   a named comparator (Loveable/speed-and-wow) contaminated the magic
│   │   moment framing rather than the operator's intended frame (rigour/trust).
│   │   The operator had no interception point before the analysis ran.
│   └── Unmet need: A confirmed context manifest — operator-visible and
│       operator-acknowledged — before the first model turn

├── Cluster 2: Critical assumptions propagate unconfirmed
│   ├── Pain: Cost and pricing assumptions buried in prose are hard to spot
│   │   and correct before they get embedded in downstream lens outputs and
│   │   eventually in /benefit-metric metrics
│   ├── Pain: The comparator frame anchors judgment (e.g. "since Loveable
│   │   charges per session…") without explicit operator confirmation that
│   │   this reference class is valid for this initiative
│   ├── Pain: No structured mechanism exists to extract, surface, and confirm
│   │   assumptions at the point they first appear in the session
│   └── Unmet need: Assumptions rendered as explicit cards with
│       confirm/edit/flag UI at the moment they are introduced

├── Cluster 3: Session has no continuity or recovery
│   ├── Pain: If a session is abandoned mid-lens (browser close, connectivity
│   │   loss, context window exhaustion), the entire session state is lost —
│   │   there is no recovery point
│   ├── Pain: Operator must reconstruct where they were by re-reading a
│   │   partial artefact or chat log on resume
│   └── Unmet need: Per-lens checkpoint that writes session state to disk,
│       enabling the session to be resumed from the last completed lens step

├── Cluster 4: The live artefact is invisible during the session
│   ├── Pain: The operator sees only the chat thread while the session runs.
│   │   The first view of the artefact structure is at commit time — after
│   │   all lenses have completed.
│   ├── Pain: Structural errors (wrong framing, missing sections, incorrect
│   │   opportunity labelling) are caught too late to correct without
│   │   rerunning the affected lens
│   └── Unmet need: A live artefact panel that updates section-by-section as
│       each lens step is confirmed, giving the operator real-time visibility
│       into what is being committed

├── Cluster 5: Input is entirely free-text — no structured operator modes
│   ├── Pain: Every operator action — confirming a lens output, rating an
│   │   assumption, flagging a wrong framing, choosing between lenses — is
│   │   expressed as chat prose. The model must infer the operator's intent.
│   ├── Pain: Agent inference fills ambiguous gaps rather than surfacing them
│   │   as decision points, producing implicit choices that the operator
│   │   never explicitly made
│   └── Unmet need: Structured input modes matched to the cognitive task:
│       confirm (binary), edit (inline text correction), choose (enumerated
│       options), add (append to a list), flag (mark a problem without
│       resolving it immediately)

└── Cluster 6: Pre-/discovery conditions are tracked only at session end
    ├── Pain: Conditions that should gate the session's handoff to /discovery
    │   surface reactively at the end of Lens B rather than being accumulated
    │   throughout the session
    ├── Pain: If the session ends without completing all lenses, the
    │   conditions list is never written — they are lost in the chat log
    └── Unmet need: A persistent conditions sidebar that accumulates
        pre-/discovery conditions throughout the session, with an
        acknowledgement requirement before the artefact can be committed
```

### Opportunity prioritisation

Importance = how much does this cost in downstream artefact quality or operator trust?
Current satisfaction = how well does the current chat experience serve this need?

| Opportunity | Importance | Current satisfaction | Priority | Downstream impact |
|-------------|-----------|---------------------|----------|-------------------|
| Verified context manifest + comparator guard | High | Low | 🟢 Top | Contaminated comparator frame propagates through all lenses, /benefit-metric, and /discovery. Most expensive to fix after the fact. |
| Confirmed assumption cards at point of introduction | High | Low | 🟢 Top | Unconfirmed cost/pricing assumptions become embedded in /benefit-metric metrics — re-work cost is high. |
| Live artefact panel | High | Low | 🟢 Top | Structural errors caught only at commit require partial lens rerun — high disruption per defect. |
| Per-lens session checkpoint (state recovery) | High | Low | 🟢 Top | A lost session mid-lens costs a full resession — the most expensive failure mode. |
| Structured input modes (confirm/edit/choose/add/flag) | Medium | Low | 🟡 Watch | Reduces implicit agent inference; improves operator control — but current sessions complete even with free text. |
| Pre-/discovery conditions sidebar | Medium | Low | 🟡 Watch | Conditions tracked in sidebar prevent end-of-session omissions. Important but discoverable via artefact review if missed. |

### Highest downstream-impact cluster analysis

**Cluster 1 (context visibility) and Cluster 2 (assumption confirmation) have the highest downstream impact.** Both feed directly into /benefit-metric and /discovery. A contaminated comparator or an unconfirmed cost assumption embedded in the artefact becomes a structural defect in the next pipeline stage — it cannot be corrected by /discovery alone without revisiting /ideate. The cost of fixing downstream is proportional to how many lenses and artefacts have been built on the bad assumption.

**Cluster 3 (session recovery) has the highest cost per event.** A lost session mid-lens requires a full re-session. It is lower probability per session but catastrophic when it occurs.

**Cluster 4 (live artefact panel) and Cluster 5 (structured inputs) are enabling conditions** for the above. The comparator guard and assumption cards only work if the operator can see and act on them in a structured interface — which requires both a live panel (Cluster 4) and structured input modes (Cluster 5).

### Top opportunities — seed solutions

**For "Verified context manifest + comparator guard":**
- A pre-session intake form that explicitly names every file to be loaded, with a checklist the operator confirms before turn 1. Files not found display as warnings.
- A comparator field in the intake form where the operator names comparators *and* the comparison dimension ("comparing on: pricing model / onboarding UX / enterprise compliance approach"). Agent receives comparator only after dimension is confirmed.
- A comparator frame review step between intake and Lens A: "You named [X]. The frame dimension you confirmed is [Y]. Should the agent use [X] as an anchor, as a contrast, or as a named example only?" — operator chooses before any analysis runs.

**For "Confirmed assumption cards at point of introduction":**
- Assumption cards rendered in the assumptions panel as the model generates them during lens turns. Each card shows: assumption text, type (desirability / viability / feasibility / ethical), and status (pending confirmation).
- Operator presses "Confirm", "Edit" (inline text), or "Flag" on each card before the session advances to the next lens step.
- P0 assumptions (flagged high-risk + marked as guess) are highlighted in the panel and block lens advancement until a test design is specified or explicitly RISK-ACCEPTED.

---

*Lens A complete. Awaiting operator confirmation before proceeding to Lens D.*

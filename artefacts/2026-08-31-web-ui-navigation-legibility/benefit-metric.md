# Benefit Metric: Web UI Navigation and Context Legibility

**Discovery reference:** artefacts/2026-08-31-web-ui-navigation-legibility/discovery.md
**Date defined:** 2026-09-10
**Metric owner:** Hamish King — Platform Owner (solo-operator project; no dedicated non-engineering product role exists yet — same convention used across every other feature in this repo, see discovery.md's own Reviewers section)
**Reviewers:** None — solo operator (contributor and approver are the same person). No non-engineering reviewer available.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a straightforward internal UX/navigation fix with a direct user-value outcome (operators can orient themselves and find their own work). The discovery does not test a hypothesis about tooling, process, or team capability; it responds to real, repeated friction the operator hit doing real work.

**Product context alignment:** `product/roadmap.md` places this squarely in Phase 5 (Web UI layer, session management — wsm.1-3 already shipped "with deviations," this feature closes some of that gap) and the parallel "Commercialisation track — wuce SaaS beta path," which is explicitly pre-launch and actively defining what beta customers will hit first. `product/mission.md`'s Success Outcome #1 ("Run the full outer loop unassisted — self-directed, single session, without help from the platform team") is the direct outcome this feature protects — all 4 metrics below trace back to that one outcome from a different angle.

---

## Tier 1: Product Metrics (User Value)

### Metric 1 (M1): Time-to-orientation after returning to a long-running session

| Field | Value |
|-------|-------|
| **What we measure** | Time (and scroll actions) from a web-UI page load to the operator correctly stating current stage and next action, for a session with multiple completed stages already in history |
| **Baseline** | Not yet established. Will measure via the first 5 real return-to-session events after this feature ships, self-timed by the operator (or first beta user) and logged in `workspace/capture-log.md` |
| **Target** | Operator identifies current stage and next action within 3 seconds of page load, with 0 scroll actions required |
| **Minimum validation signal** | Under 10 seconds, no more than 1 scroll action |
| **Measurement method** | Operator (or first beta user, once that channel exists) self-times and logs each occurrence in `workspace/capture-log.md`; Platform Owner reviews weekly for the first 4 weeks post-ship |
| **Feedback loop** | If the minimum signal is missed on 2+ of the first 5 measured occurrences: re-open this metric's own scope (the collapsed context indicator and persistent next-stage action) rather than declaring it shipped; Platform Owner decides whether to adjust the UI or accept a lower target |

### Metric 2 (M2): Next-stage-action findability

| Field | Value |
|-------|-------|
| **What we measure** | Count of "couldn't find the next-stage action" incidents per week, across all web-UI sessions |
| **Baseline** | 1 confirmed incident (this session, 2026-08-31 — the original trigger for this discovery) |
| **Target** | 0 such incidents across the 4 weeks following this feature's ship date |
| **Minimum validation signal** | No more than 1 incident in that same 4-week window |
| **Measurement method** | Operator/beta-user self-report via `workspace/capture-log.md` or the support channel, once it exists; Platform Owner reviews weekly |
| **Feedback loop** | If the minimum signal is missed: check whether the sticky element itself is present but not visually noticeable enough (a design/CSS issue) versus genuinely absent (an implementation gap), and route accordingly — a design fix does not require reopening the story, an implementation gap does |

### Metric 3 (M3): Cross-channel feature discoverability from the dashboard

| Field | Value |
|-------|-------|
| **What we measure** | Rate of "operator failed to locate a CLI-authored, no-product feature from the `/dashboard` landing page" incidents per week |
| **Baseline** | 2 confirmed incidents in a single session (2026-09-10) — failing to locate this discovery itself, then failing to locate `jasb-s1`'s own DoD, both immediately after the ep1-s1 mechanism that should have prevented this was already DoD-complete |
| **Target** | 0 such incidents across the 4 weeks following this feature's ship date |
| **Minimum validation signal** | No more than 1 incident in that same 4-week window |
| **Measurement method** | Two-part: (1) a pre-ship, one-time code-presence gate — does `handleGetDashboard`'s own rendered body include a working no-product entry point reachable within one click? (checked once at DoD, not a recurring measurement); (2) the actual outcome metric — operator/beta-user self-report of any "couldn't find it" incident, logged in `workspace/capture-log.md`, reviewed weekly for 4 weeks post-ship. Part 1 alone is not sufficient to close this metric — a present-but-unnoticed entry point would still fail the real outcome. |
| **Feedback loop** | If the code-presence gate fails at DoD: block DoD sign-off, this is a shipped-wrong outcome, not a metric miss. If the code-presence gate passes but incidents continue post-ship: the entry point exists but isn't discoverable enough — treat as a design/placement problem for a follow-up story, not evidence this feature failed outright |

---

## Tier 1 (linked, not duplicated): Web UI Session Start Share

This feature is a **plausible contributor** to an existing Tier 1 metric already owned by the `cross-channel-feature-continuity` feature (epic `ep1-s1`-`s6`, DoD-complete) — not a new metric of its own. Recorded here for traceability only; the actual metric entry, baseline, and target live in that feature's own `metrics` array in `pipeline-state.json`.

| Field | Value |
|-------|-------|
| **Linked metric** | Web UI Session Start Share |
| **Owning feature** | `cross-channel-feature-continuity` |
| **Target (as owned elsewhere)** | Greater than 50% of new feature sessions started via the web UI within 4 weeks |
| **Why linked here** | All three of this feature's own MVP items (context-panel collapse, persistent next-stage action, dashboard cross-channel discoverability) directly reduce friction that would otherwise push operators back to the CLI mid-session or prevent them from starting/continuing via the web UI at all. This feature does not claim credit for that metric's movement on its own — it is one of several contributing factors. |

---

## Metric Coverage Matrix

<!-- Populated by /definition once stories are written -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Time-to-orientation | TBD at /definition | Gap (pre-/definition) |
| M2 — Next-stage-action findability | TBD at /definition | Gap (pre-/definition) |
| M3 — Cross-channel dashboard discoverability | TBD at /definition | Gap (pre-/definition) |
| Web UI Session Start Share (linked) | N/A — tracked under `cross-channel-feature-continuity` | Linked, not owned here |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach — that is `/definition` and the implementation-plan skill
- Sprint targets or velocity — these metrics are outcome-based, not output-based

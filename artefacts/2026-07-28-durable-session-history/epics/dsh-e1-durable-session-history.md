## Epic: Operators can always see the conversation behind a completed pipeline stage

**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When a pipeline stage completes, its conversation is durably persisted (not just the final artefact text) and remains viewable indefinitely — regardless of server restarts, Fly redeploys, or how much time has passed. An operator clicking "Resume conversation" or navigating breadcrumbs to a completed stage always lands on a working chat-left/artefact-right view showing the real historical conversation, never a "Session not found" error or a bare artefact-only page. Turns older than 60 days move to archive storage automatically and rehydrate transparently on demand, so storage stays bounded without ever losing history.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    SKILLS[routes/skills.js\\ncompletion write hook]\n    ADAPTER[adapters/session-turns-pg.js\\nD37 injectable adapter]\n    JOURNEY[routes/journey.js\\nhandleGetJourneyStageView]\n    FEATURES[routes/features.js\\nResume conversation link]\n    ARCHIVE[scripts/archive-session-turns.js\\nscheduled CI job]\n    PG[(Postgres\\nsession_turns +\\nsession_turns_archive)]\n    SKILLS -->|dsh-s1: write turns on completion| ADAPTER\n    ADAPTER -->|dsh-s1| PG\n    JOURNEY -->|dsh-s2/dsh-s3: read turns| ADAPTER\n    FEATURES -->|dsh-s4: repointed link| JOURNEY\n    ARCHIVE -->|dsh-s5: move rows >60d| PG\n    ADAPTER -->|dsh-s6: archive-tier fallback read| PG"}}---

## Out of Scope

- **Live chat interactivity to regenerate a completed stage's artefact** — explicitly deferred to a fast-follow epic per the discovery's own MVP scope decision. This epic is read-only history + the existing artefact edit-toggle only.
- **Retroactive recovery of already-lost conversation history** — any stage that completed before this epic ships had its turns already deleted from Redis with nothing durable behind them; those are permanently gone.
- **The active (in-progress, not-yet-completed) stage's live chat page** — unaffected; already works correctly.
- **Redis's 7-day TTL policy or its "compact strip" field-stripping design** — unrelated to this epic's durability gap.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Resume conversation link success rate | ~0% for stages completed before last server restart | 100% (min signal 95%) | Stories 1, 2, 4 — durable write + shared read path + fixed resume link |
| Breadcrumb view-completed-stage shows real conversation | 0% | 100% of post-fix completed stages | Stories 1, 2, 3 — durable write + shared read path + rebuilt breadcrumb page |
| Turn storage stays bounded | None (turns deleted at completion today) | 100% of turns >60 days archived; rehydration succeeds | Stories 5, 6 — archive job + on-demand rehydration |

## Stories in This Epic

- [ ] dsh-s1 — Persist session turns to a new `session_turns` table on stage completion
- [ ] dsh-s2 — Shared durable-read function for a completed stage's turns
- [ ] dsh-s3 — Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view
- [ ] dsh-s4 — Fix "Resume conversation" to route through the durable read path
- [ ] dsh-s5 — 60-day archive job for turns in the hot table
- [ ] dsh-s6 — Rehydrate an archived stage's turns on demand

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches tenant-scoped data persistence (a new table carrying potentially sensitive conversation content, per the data-governance decision logged in `decisions.md`) and a scheduled archival job with no dedicated platform engineering — solo-operator posture warrants a review checkpoint at PR time rather than fully autonomous merge, even though no PCI/regulatory scope is in play.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity, known unknowns -- the Postgres-first pattern itself is well-established in this codebase (low risk), but this is genuinely new schema + a new scheduled-job mechanism (archive/rehydrate) that doesn't have a precedent in this repo yet. -->

## Scope Stability

**Stability:** Stable

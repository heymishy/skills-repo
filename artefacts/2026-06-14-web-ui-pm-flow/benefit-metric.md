# Benefit Metric: Web UI Product Management Flow

**Discovery reference:** `artefacts/2026-06-14-web-ui-pm-flow/discovery.md`
**Date defined:** 2026-06-15
**Metric owner:** Hamish King — Platform operator / tech lead
**Reviewers:** (none at definition stage — solo operator pipeline)

---

## Tier Classification

**No META-BENEFIT FLAG.** These are direct product metrics — WIP visibility and session start efficiency are immediate operator value, not platform-level hypotheses.

---

## Tier 2: Product Metrics (Operator Value)

### M1: WIP visibility — active features visible on Kanban board without scrolling

| Field | Value |
|-------|-------|
| **What we measure** | Whether all active (non-released, non-archived) features are visible at `/features?view=board` without browser vertical scrolling, for a pipeline of up to 12 active features |
| **Baseline** | Not visible — only flat table list at `/features` existed before pmf.1 |
| **Target** | All active features visible without scrolling for pipelines ≤12 features |
| **Minimum validation signal** | Board renders with correct lane placement for every registered feature in real pipeline-state.json |
| **Measurement method** | Manual inspection of `/features?view=board` with real pipeline-state.json after pmf.1 DoD. Structural assertion: `check-kanban-view.js` T5 (feature cards placed in correct lanes). |
| **Feedback loop** | If cards are clipped or require scrolling at current feature count: increase column `max-height` constraint or reduce card minimum height. If lane count or structure needs adjusting: open a pmf.1b story — do not amend pmf.1. |

---

### M2: Idea capture rate — ideas in workspace/ideas.json within 14 days

| Field | Value |
|-------|-------|
| **What we measure** | Count of ideas in `workspace/ideas.json` 14 days after pmf.2 DoD |
| **Baseline** | 0 ideas (file initialised empty on 2026-06-14) |
| **Target** | ≥3 ideas captured within 14 days of pmf.2 DoD |
| **Minimum validation signal** | ≥1 idea captured |
| **Measurement method** | `cat workspace/ideas.json | jq '.ideas | length'` at the 14-day mark. Idea creation timestamps in `createdAt` field confirm they were created post-DoD. |
| **Feedback loop** | 0 ideas at 14 days: the capture friction is too high — investigate quick-capture form UX. <3 but ≥1: acceptable for solo operator; note in retrospective. ≥3: target met. |

---

### M3: Session start click-count — operator reaches correct skill in ≤2 clicks

| Field | Value |
|-------|-------|
| **What we measure** | Number of clicks from the web UI homepage to an active skill session, for a returning operator who knows which feature and skill they want to work on |
| **Baseline** | 3–4 clicks: `/` → `/features` → `/features/<slug>` → `/skills/<name>/sessions` → start session |
| **Target** | ≤2 clicks for a returning-user scenario using the pmf.3 orientation wizard |
| **Minimum validation signal** | pmf.3 DoD complete and manual walkthrough confirms the 2-click path |
| **Measurement method** | Manual walkthrough test: open web UI, use orientation wizard, count clicks to active session. Test scenario: returning operator with an active feature at `definition` stage. |
| **Feedback loop** | >2 clicks after pmf.3: identify which step adds the extra click and file a follow-on story for the specific step. |

---

## Story-to-metric coverage

| Story | M1 | M2 | M3 |
|-------|----|----|-----|
| pmf.1 — Kanban board | ✅ Primary | — | — |
| pmf.2 — Ideas backlog | — | ✅ Primary | — |
| pmf.3 — Orientation wizard | — | ✅ Secondary (idea→discovery link) | ✅ Primary |

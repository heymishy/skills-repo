# Benefit Metric: Web UI Dynamic Skill Questions

**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Date defined:** 2026-05-05
**Metric owner:** Hamish King — Platform / Framework Owner
**Reviewers:** Jenni Ralph — Product Guru

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative validates two things simultaneously: user outcome (operators completing skill sessions and committing artefacts via the web UI) and a meta-hypothesis (that model-driven adaptive conversation on a server-side redirect flow can match the quality of the VS Code surface conversation).

---

## Tier 1: Product Metrics (User Value)

### Metric P1: Skill session completion rate

| Field | Value |
|-------|-------|
| **What we measure** | % of skill HTML sessions that reach the commit step (artefact saved) out of all sessions that advance past question 1 |
| **Baseline** | Not yet established — feature not in active use. Will measure in first 2 weeks post-deployment. |
| **Target** | > 50% |
| **Minimum validation signal** | > 30% |
| **Measurement method** | Server-side session tracking — sessions started past Q1 vs sessions where commit is called. Hamish King, reviewed weekly after deployment. |
| **Feedback loop** | If signal falls below 30% after 2 weeks, review session logs for drop-off point — identify whether question quality or UX friction is the cause. Hamish King decides stop/adjust. |

### Metric P2: Web UI share of outer loop artefacts

| Field | Value |
|-------|-------|
| **What we measure** | % of discovery/definition/review artefacts committed via web UI out of all artefacts committed (web UI + VS Code) |
| **Baseline** | 0% — feature not in active use |
| **Target** | > 25% of outer loop artefacts within 8 weeks of shipping |
| **Minimum validation signal** | At least 1 web UI artefact committed per active operator per fortnight after 2 weeks post-deployment |
| **Measurement method** | Count of artefacts committed via web UI commit flow vs total. Hamish King, reviewed monthly. |
| **Feedback loop** | If share remains 0% after 4 weeks, investigate whether operators are reverting to VS Code due to session quality or discoverability — Hamish King triggers targeted user review. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric M1: Fallback invisibility rate

| Field | Value |
|-------|-------|
| **Hypothesis** | When the dynamic question API call fails and the static fallback fires, operators do not notice — the session continues to completion without observable degradation |
| **What we measure** | % of sessions where static fallback fired but operator continued to completion (no restart, no support query) |
| **Baseline** | N/A — new capability |
| **Target** | > 95% of fallback events are invisible to the operator |
| **Minimum signal** | Zero operator complaints attributable to question quality degradation in first 4 weeks |
| **Measurement method** | Session log review — fallback events flagged server-side, cross-referenced against abandoned sessions. Hamish King, reviewed weekly post-deployment. |

### Meta Metric M2: Model question adaptation rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Model-generated next questions visibly adapt to prior answers — they reference, reframe, or build on what the operator just said rather than presenting a generic next question |
| **What we measure** | % of model-generated questions that visibly reference, reframe, or build on the prior answer — assessed by manual session sampling |
| **Baseline** | 0% — static questions never adapt |
| **Target** | > 70% of generated questions show visible adaptation |
| **Minimum signal** | > 40% |
| **Measurement method** | Manual sampling of 5 sessions per week post-deployment. Hamish King. |

### Meta Metric M3: Context surfacing rate

| Field | Value |
|-------|-------|
| **Hypothesis** | When product context (`product/`) or reference materials (`artefacts/[feature]/reference/`) are loaded, the model actively surfaces relevant content in its responses — operators notice the model is grounded in their actual platform context |
| **What we measure** | % of sessions with product/reference context loaded where the model response contains at least one reference to loaded context content (not generic guidance) |
| **Baseline** | Not yet established — will measure in first 2 weeks post-deployment |
| **Target** | > 60% of sessions with context loaded show at least one grounded model response |
| **Minimum signal** | > 30% |
| **Measurement method** | Manual sampling of sessions with context loaded. Hamish King, reviewed weekly post-deployment. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| P1 — Skill session completion rate | dsq.2 (section confirmation loop), dsq.3 (post-session /clarify gate) | Covered — 2 stories |
| P2 — Web UI share of outer loop artefacts | dsq.4 (section-by-section artefact assembly) | Covered — 1 story |
| M1 — Fallback invisibility rate | dsq.1 (dynamic next-question — implements silent fallback) | Covered — 1 story |
| M2 — Model question adaptation rate | dsq.1 (dynamic next-question — direct delivery mechanism) | Covered — 1 story |
| M3 — Context surfacing rate | dsq.4 (section artefact assembly — template-grounded context for downstream model calls) | Covered — 1 story |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

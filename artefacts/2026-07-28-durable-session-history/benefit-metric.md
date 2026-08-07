## Benefit Metric: Durable Session History for Completed Pipeline Stages

**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Date defined:** 2026-07-28
**Metric owner:** Hamish King — Platform owner
**Reviewers:** None yet (solo-operator posture — no non-engineering reviewer available for this repo; same caveat noted on prior features, e.g. 2026-07-25-code-shape-diagrams)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a standard product/reliability fix, not a tooling or process pilot. It was discovered through dogfooding (the operator using the platform's own web-ui surface), but the initiative itself delivers ordinary user value (a working "resume/review a past stage" flow) rather than testing a hypothesis about agent capability, process, or team structure. Product context check: `product/mission.md` names the web-ui surface as part of Phase 5 WS0 ("non-technical channel" — governed delivery reachable without VS Code or git). This feature directly supports that outcome by making the surface's core navigation actually reliable; `product/roadmap.md`'s Phase 1–2 themes (distribution, assurance, standards) don't specifically cover this, but nothing here conflicts with current roadmap priorities — it's surface-hardening work adjacent to, not blocking, the platform roadmap.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: "Resume conversation" link success rate

| Field | Value |
|-------|-------|
| **What we measure** | Of all clicks on a completed stage's "Resume conversation" link, the percentage that render a real conversation view (not a 404 "Session not found" page) |
| **Baseline** | Not yet established precisely — functionally ~0% for any stage completed before the server process last restarted, given Fly's redeploy/idle-suspend cadence makes restarts frequent. Will confirm exact current rate via a log-based count of the `Session not found` event on this route over the first 2 weeks post-fix rollout comparison window |
| **Target** | 100% — the link always resolves to a real conversation view, regardless of server restarts since the stage completed |
| **Minimum validation signal** | ≥95% — allows for a narrow edge case (e.g. a stage completed in the small window before this fix's own deploy) without treating the whole fix as failed |
| **Measurement method** | Automated: a regression test asserting the route never 404s for a completed stage (already scoped into MVP delivery). Production: a log-based count of the `Session not found` event on this specific route, checked weekly for the first month post-rollout by Hamish King |
| **Feedback loop** | If the production log-based rate stays below 95% after rollout, Hamish King reviews whether the durability fix has a gap (e.g. an edge case in the archive/rehydrate path) and decides whether to patch immediately or open a follow-up story |

### Metric 2: Breadcrumb "view a completed stage" shows the real conversation

| Field | Value |
|-------|-------|
| **What we measure** | Of all completed stages viewed via breadcrumb navigation, the percentage that render the stage's actual historical chat turns (chat-left/artefact-right layout), not just the bare artefact-plus-edit-toggle page |
| **Baseline** | 0% — today this page never shows the original chat under any circumstance, only the artefact text |
| **Target** | 100% of completed stages render their actual historical turns in the chat-left/artefact-right layout |
| **Minimum validation signal** | 100% for any stage completed *after* this fix ships — the metric excludes already-lost pre-fix history, since discovery's Out of Scope explicitly does not attempt retroactive recovery |
| **Measurement method** | Automated: regression test asserting the rebuilt page renders turns sourced from the new `session_turns` table. Manual: a QA pass across a handful of real staging features after rollout, by Hamish King |
| **Feedback loop** | If any post-fix stage fails to show its conversation, this is treated as a regression (not a gap) — Hamish King investigates immediately, since the whole point of this feature is that this case should not exist going forward |

### Metric 3: Turn storage stays bounded

| Field | Value |
|-------|-------|
| **What we measure** | Row age distribution in the "hot" `session_turns` table — specifically, whether turns older than 60 days have moved to archive storage as designed |
| **Baseline** | None today — turns are currently deleted at stage completion, so there is no growth to measure (but also no history) |
| **Target** | 100% of turns older than 60 days are archived out of the hot table; rehydration succeeds when an operator opens an archived stage |
| **Minimum validation signal** | The archive job runs successfully on its schedule for 4 consecutive weeks with no manual intervention required |
| **Measurement method** | A scheduled check (the same CI/cron job that performs the archival, per the discovery's "no persistent agent runtime dependency" constraint) reports hot-table row count and oldest-row age; reviewed monthly by Hamish King |
| **Feedback loop** | If the archive job fails silently or rehydration breaks, this is a data-durability incident — Hamish King treats it as high priority given the whole feature exists to prevent data loss |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — META-BENEFIT FLAG is No. This section is intentionally omitted per the template's own instruction ("If only one tier applies, delete the other section").

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Resume conversation success rate | dsh-s1, dsh-s2, dsh-s4 (dsh-s6 extends to archived stages) | Covered |
| Metric 2 — Breadcrumb shows real conversation | dsh-s1, dsh-s2, dsh-s3 (dsh-s6 extends to archived stages) | Covered |
| Metric 3 — Turn storage stays bounded | dsh-s5, dsh-s6 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

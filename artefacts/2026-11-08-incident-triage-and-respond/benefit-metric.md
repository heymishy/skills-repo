## Benefit Metric: Incident Triage and Respond

**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Date defined:** 2026-11-08
**Metric owner:** [Pending — no non-engineering role exists in this personal-scope team (`context.yml`: `meta.scope: personal`). Hamish King (Platform Owner) may self-assign, but this is flagged rather than silently filled in.]
**Reviewers:** [Pending — at least one non-engineering reviewer is required for Tier 1 product metrics by this skill's own completion check; no such role exists in this personal-scope team.]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This initiative delivers direct capability (incident records, triage drafting, UI rendering, handoff + confirmation) rather than testing a tooling/process hypothesis. No meta-metrics apply.

No Tier 3 compliance/risk-reduction obligations apply — no regulatory, audit, or named security-risk signal is present in this initiative's own scope (that signal belongs to initiative 2's vulnerability-check story, already captured there).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Incident record mechanism adoption

| Field | Value |
|-------|-------|
| **What we measure** | Whether new production-defect investigations create a structured incident record instead of an ad-hoc `workspace/state.json` note. |
| **Baseline** | 0 structured incident records exist today — only one known ad-hoc note (`productionErrorInvestigation`), paused and unstructured. |
| **Target** | 100% of new production-defect investigations from ship date forward use a structured record — zero new ad-hoc notes. |
| **Minimum validation signal** | ≥50% adoption within month 1 — full habit change may lag the mechanism's availability. |
| **Measurement method** | Count of structured records vs. new ad-hoc `workspace/state.json` notes, checked monthly. |
| **Feedback loop** | If adoption stays below the minimum signal, check whether the record-creation step is actually easier than an ad-hoc note, or just a parallel option nobody switched to. |

### Metric 2: Triage drafting coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether new incident records get an auto-drafted triage summary (prior-incident matches + suggested next step), scored via structured-field Jaccard matching. |
| **Baseline** | 0% — every investigation starts from scratch today (confirmed: `productionErrorInvestigation` has no such summary). |
| **Target** | 100% of new incident records get a drafted triage summary attempt, even if some drafts turn out low-confidence. |
| **Minimum validation signal** | ≥50% coverage in month 1, ramping toward 100% as the mechanism beds in. |
| **Measurement method** | Count of incident records with a triage summary attached vs. total records created, monthly. |
| **Feedback loop** | If coverage lags, check whether story 2's matching logic is failing to run at all vs. running but producing summaries nobody finds useful — different fixes for each. |

### Metric 3: Web UI rendering existence

| Field | Value |
|-------|-------|
| **What we measure** | Whether incident records render in the web UI at all, end-to-end. |
| **Baseline** | 0 incident records visible in any web UI today — neither the mechanism nor the rendering surface exists yet. |
| **Target** | Incident records render in the extended `kanban-view.js` surface, confirmed with at least one real record. |
| **Minimum validation signal** | Same as target — this is a binary existence check, not a graduated metric. |
| **Measurement method** | A direct check that the extended route renders ≥1 real incident record without error, once story 3 ships. |
| **Feedback loop** | If this fails, it blocks initiative 1's and initiative 5's later stories that build on this same surface — treat as a hard gate, not a soft miss. |

### Metric 4: Handoff + post-fix confirmation coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether incidents that reach a merged fix get a confirmation status recorded (automated re-check where initiative 2's detection exists, manual confirm otherwise). |
| **Baseline** | 0% of fixes get any post-deploy confirmation today — the still-unfixed `tenant_admin_bootstrap_failed` bug is the live proof: even if fixed tomorrow, nothing would check the fix actually worked. |
| **Target** | 100% of incidents reaching a merged fix get a confirmation status recorded. |
| **Minimum validation signal** | ≥50% coverage in month 1 — confirmation is a new habit on top of the existing merge/DoD flow. |
| **Measurement method** | Count of DoD-complete stories that originated from an incident record, cross-checked against whether each has a confirmation status set, monthly. |
| **Feedback loop** | If coverage lags, check whether the handoff step is actually attaching incident context at story-creation time — a missing link there would explain the gap better than "people forget to confirm." |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Incident record mechanism adoption | [Populated at /definition] | Gap — stories not yet written |
| Triage drafting coverage | [Populated at /definition] | Gap — stories not yet written |
| Web UI rendering existence | [Populated at /definition] | Gap — stories not yet written |
| Handoff + post-fix confirmation coverage | [Populated at /definition] | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

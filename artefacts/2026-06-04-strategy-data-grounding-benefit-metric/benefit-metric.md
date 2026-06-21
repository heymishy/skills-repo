# Benefit Metric Artefact — Strategy and Data Grounding for Pipeline Sessions

**Feature slug:** 2026-06-04-strategy-data-grounding
**Benefit metric defined:** 2026-06-04
**Status:** Active
**Metric owner:** Hamish King (platform operator/owner)
**Reviewers:** Hamish King

---

## Product context alignment

**Mission alignment:** The skills platform's success outcome is that operators can "run the full outer loop unassisted — self-directed, single session, without help from the platform team." Strategy-grounded discovery is a prerequisite for this outcome. Operators without product management training need automatic access to organisational strategy context to produce grounded discovery artefacts without human mentoring.

**Roadmap alignment:** Phase 1 (Foundation) commits to "progressive skill disclosure" and "surface adapter model." Strategy-data-grounding is a Phase 1 capability that improves input quality to the outer loop — a direct lever on the Phase 1 MVP threshold (operators can run the full outer loop unassisted).

---

## Metrics

### M1 — Strategy content utility (Primary)

**What we're measuring:**
The injected strategy content was actually helpful and used by the model during the session. Operators confirm the strategy context framed the problem or grounded the scope meaningfully.

**Baseline:** 0% (feature does not exist pre-Phase-1)

**Target:** ≥70% of /ideate and /discovery sessions report that injected strategy content was useful

**Minimum validation signal:** ≥40% — below this threshold, we stop or pivot the approach

**Measured via:**
- Post-session operator self-report on a 1–5 scale (≥4/5 counts as "useful")
- Artefact-level signal: % of discovery/benefit-metric/definition artefacts that explicitly reference strategy or data hub items (tracked in artefact metadata)
- Inner loop DoR signal: % of DoR sign-offs that cite strategy context as a grounding input

**Collection cadence:** Weekly aggregation; monthly reporting by metric owner

**Feedback loop:** If utility drops below 40% at any month-end review, trigger /decisions to revisit the strategy injection approach (e.g., injection point, content format, relevance matching).

---

### M2 — Strategy file adoption rate (Secondary)

**What we're measuring:**
The percentage of new discovery sessions that have a strategy file configured, and the time it takes operators to adopt the feature post-release.

**Baseline:** 0 (feature does not exist)

**Target:** ≥50% of new discovery sessions have a strategy file configured within 30 days of Phase 1 release

**Additional tracking:**
- Time-to-adoption: median days from Phase 1 release to first strategy file placed
- Operator cohort breakdown: adoption rates for engineers vs product managers (separate tracking to identify cohort-specific adoption gaps)

**Measured via:**
- `context.yml` strategy file path configuration presence across active features
- Session logs / feature telemetry (which sessions have strategy content injected)

**Collection cadence:** Weekly aggregation; monthly reporting

**Feedback loop:** If adoption is <30% at 30-day mark, investigate barriers (UX friction, unclear documentation, lack of example strategy files). Trigger /clarify or onboarding improvement stories.

---

### M3 — Operator effort reduction (Secondary)

**What we're measuring:**
Operators no longer need to context-switch to external tools (PowerPoint, Excel, Power BI) to retrieve strategy context during /ideate and /discovery sessions.

**Baseline:** X context-switches per session to external tools — to be established at Phase 1 start (retrospective audit of 5 prior sessions)

**Target:** 0 context-switches for sessions with strategy file present; ≥50% reduction in context-switches for all sessions (including those without strategy files)

**Measured via:**
- Operator self-report: "Did you open any external tools during this session?" (yes/no per session)
- Session-log analysis (if available): detection of tool-switching events

**Collection cadence:** Per-session capture; weekly aggregation; monthly reporting

**Feedback loop:** If reduction is <25% at 30-day mark, investigate whether operators are finding strategy content incomplete or unclear (triggering strategy file content improvement).

---

### M4 — Strategy content freshness (Operational health)

**What we're measuring:**
Strategy files are being actively maintained. Stale files indicate the feature was set up once but not sustained.

**Baseline:** 0% (feature does not exist)

**Target:** ≥80% of configured strategy files updated within 90 days

**Measured via:**
- File modification timestamp audit: scan all configured strategy file paths (from `context.yml` entries across active features) and check `last modified` date
- Automated weekly check via CI or scheduled script

**Collection cadence:** Weekly check; monthly reporting

**Feedback loop:** If freshness drops below 60%, send a reminder to operators asking them to confirm whether their strategy file is still current. If <40%, consider archiving the file as "inactive" and removing it from the adoption count.

---

### M5 — Discovery-to-definition rework reduction (Outcome — harder to measure)

**What we're measuring:**
The north-star outcome: fewer discovery artefacts require scope revision at benefit-metric or definition stage *due to missing strategic grounding*.

**Baseline:** Unknown — requires retrospective categorisation of past rework causes. At Phase 1 start, audit the last 10 discovery artefacts that were revised at benefit-metric/definition stage and categorise each rework as one of: (a) strategy-related misalignment, (b) scope creep, (c) NFR omission, (d) assumption invalidation, (e) other. Establish the % that are strategy-related.

**Target:** ≥30% reduction in strategy-related rework (compared to baseline once established)

**Measured via:**
- Artefact revision logs: when a discovery artefact is revised at benefit-metric or definition stage, tag the rework reason
- Manual monthly categorisation: product owner reviews revisions and marks which are strategy-related
- Phase 2 enhancement: automate via a `/rework-tag` skill that operators invoke when revising an artefact

**Collection cadence:** Per-revision capture; monthly aggregation

**Feedback loop:** If strategy-related rework remains at or above baseline at 90-day review, the feature has not achieved its intended outcome. Investigate whether strategy files are addressing the right questions or whether the injection point (which skill stages) needs adjustment.

---

## Tier classification

- **M1, M2, M3:** Tier 1 (Product outcomes — user/operator experience)
- **M4:** Tier 2 (Operational health — sustainability of the feature)
- **M5:** Tier 3 (Outcome satisfaction — strategic alignment goal)

---

## Known unknowns and assumptions

**Assumption A1 — Operators want strategy context surfaced automatically**
Status: RISK-ACCEPT (no pre-test). Strategy injection is the core hypothesis. If M1 utility drops below 40%, this assumption is invalidated.

**Assumption A5 — Strategy content fits within context budget**
Status: TBD at Phase 1 implementation. A realistic markdown strategy file injected alongside SKILL.md and prior artefacts must not exceed the per-turn context budget. Requires token-count validation during Phase 1 development.

**Assumption A8 — Keyword/metadata matching is sufficient for relevance**
Status: TBD. Phase 1 uses simple keyword matching to surface strategy sections. If operators report that irrelevant or incomplete strategy content is being injected, semantic search becomes necessary (Phase 2).

**Baseline M5 — Rework categorisation**
Status: Requires manual audit at Phase 1 start. Until baseline is established, M5 cannot be tracked.

---

## Measurement schedule

| Metric | Collection | Aggregation | Reporting |
|--------|-----------|-------------|-----------|
| M1 | Per-session | Weekly | Monthly |
| M2 | Weekly config scan | Weekly | Monthly |
| M3 | Per-session | Weekly | Monthly |
| M4 | Weekly file audit | Weekly | Monthly |
| M5 | Per-revision | Monthly manual categorisation | Monthly |

---

## Phase 2 scope boundary

The following are explicitly OUT of Phase 1 scope and will be addressed in Phase 2:

- **/strategy skill** — guided strategy creation (analogous to /ideate). Phase 1 references existing strategy; Phase 2 helps operators create or structure it.
- **Non-markdown format support** — Excel, Power BI, PowerPoint normalisation to injectable markdown.
- **Cloud data source authentication** — reading strategy from OneDrive, SharePoint, or other cloud hosts.
- **Semantic search / vector database** — relevance matching beyond keyword/metadata.
- **Automatic strategy file discovery** — Phase 1 requires explicit path declaration in `context.yml`.

---

## Attribution

**Metric owner:** Hamish King (platform operator/owner)
**Reviewers:** Hamish King
**Defined:** 2026-06-04
**Status:** ACTIVE
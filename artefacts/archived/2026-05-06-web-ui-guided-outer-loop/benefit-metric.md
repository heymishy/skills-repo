# Benefit Metric: Web UI Guided Outer Loop Journey

**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Date defined:** 2026-05-06
**Metric owner:** Hamis — Platform operator / product owner
**Reviewers:** Hamis — Platform operator / product owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative delivers user value (non-engineers can run the outer loop without VS Code) and simultaneously validates a hypothesis about the web UI orchestration architecture (Option B router + per-skill sessions produces artefacts at equivalent quality to the VS Code surface). Both tiers are defined separately. The feature can succeed on Tier 2 meta metrics even if Tier 1 targets are not fully met in the MVP window — but only because this tradeoff is explicit here.

---

## Tier 1: Product Metrics (User Value)

### M1: Journey completion rate

| Field | Value |
|-------|-------|
| **What we measure** | % of web UI journey sessions that produce a saved discovery.md artefact, measured from sessions that reach the /workflow stage-selection screen |
| **Baseline** | 0% — feature does not exist; establishing from first 5 initiated sessions post-launch |
| **Target** | ≥ 80% of initiated sessions produce a saved discovery.md within 3 months of launch |
| **Minimum validation signal** | 1 session produces a saved discovery.md that passes manual review — confirms the journey is completable end-to-end |
| **Measurement method** | Server-side session log: track journey stage reached per session ID; measure ratio of `discovery_saved` events to `journey_started` events; reviewed weekly by operator |
| **Feedback loop** | If minimum validation signal is not met by end of week 1 post-launch: operator investigates session logs for drop-off stage; architectural blocker triggers a spike. If 80% target is not met at 3 months: review drop-off stage distribution — if majority drop at /benefit-metric or later, consider gated MVP (discovery-only first). |

### M2: Non-engineer autonomous completion

| Field | Value |
|-------|-------|
| **What we measure** | Count of /discovery artefacts completed end-to-end by a self-identified non-engineer without switching to VS Code mid-session |
| **Baseline** | 0 — no web UI journey surface exists |
| **Target** | ≥ 1 confirmed non-engineer-completed /discovery artefact within 4 weeks of MVP availability |
| **Minimum validation signal** | 1 non-engineer reaches the "Save and continue to /benefit-metric?" gate without requesting help from an engineer to operate the toolchain |
| **Measurement method** | Session persona field (self-reported at journey start: "I am a: engineer / tech lead / BA / business lead / other"); combined with journey completion log and operator post-session review note |
| **Feedback loop** | If no non-engineer completion within 4 weeks: conduct a short user interview (≤30 min) with a BA or SME who attempted the journey; identify the specific friction point; feed findings into a post-MVP scope item. |

---

## Tier 2: Meta Metrics (Orchestration Architecture Validation)

### MM1: Artefact quality parity

| Field | Value |
|-------|-------|
| **Hypothesis** | Web UI-produced artefacts are structurally and semantically equivalent to VS Code-produced artefacts — the orchestration architecture (Option B) does not degrade output quality |
| **What we measure** | % of web UI-produced artefact sets (discovery + benefit-metric as initial proxy; full chain at feature maturity) that pass `validate-trace.sh --ci` with 0 blocking chain errors |
| **Baseline** | VS Code baseline: establish from the next 3 VS Code-produced feature runs after MVP launch; current npm test pass rate (70/70 viz-behaviour + contracts + pipeline-paths) is the structural proxy until then |
| **Target** | Web UI trace pass rate ≥ VS Code trace pass rate (parity, not regression) |
| **Minimum signal** | First web UI-produced artefact set (discovery + benefit-metric) passes `validate-trace.sh --ci` with 0 blocking errors — confirms the Option B handoff architecture does not break artefact chain integrity |
| **Measurement method** | Run `validate-trace.sh --ci` against each web UI-produced feature artefact set at /benefit-metric completion; log pass/fail per feature; compare to VS Code runs; reviewed by operator after each complete outer loop run |

### MM2: Option B handoff coherence

| Field | Value |
|-------|-------|
| **Hypothesis** | A per-skill session receiving only the handoff context block (no prior conversation history) produces coherent, relevant output — the handoff schema carries sufficient context for downstream skills to work without re-explanation |
| **What we measure** | Operator-rated coherence of the opening exchange at each stage transition (did /benefit-metric ask relevant questions given /discovery output, without needing re-explanation from the operator?) — 1–5 scale, per transition |
| **Baseline** | Not yet established — first measurement at spike validation run (spike is the prerequisite to this metric activating) |
| **Target** | ≥ 4/5 average operator coherence rating across all stage transitions in the first 3 complete outer loop runs |
| **Minimum signal** | /benefit-metric session opened with Option B handoff block produces at least 1 relevant clarifying question without the operator needing to re-summarise the discovery — confirms the handoff block is functional as a context carrier |
| **Measurement method** | Operator rates each stage transition in a session log at the gate confirmation step (optional short text note + 1–5 score); spike run produces the first data point; subsequent outer loop runs accumulate the dataset |

---

## Spike dependency note

MM2 (Option B handoff coherence) cannot produce a meaningful baseline until the spike resolves the handoff block schema. The spike output (PROCEED verdict + handoff block schema) is the entry condition for MM2 measurement to begin. M1 and M2 can be measured from first use of the MVP. MM1 requires at least one complete artefact set written and saved by the web UI journey.

---

## Metric Coverage Matrix

_Updated at /review (2026-05-06) — /definition complete, 7 stories committed._

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Journey completion rate | ougl.7 (journey_completed instrumentation event; completion screen renders = M1 numerator event) | Covered — ougl.7 AC9 (observability log) |
| M2 — Non-engineer autonomous completion | ougl.3 (journey entry screen for non-engineers), ougl.4 (guided advance between stages), ougl.7 (completion screen confirms loop is done) | Covered — M2 is satisfied when a non-engineer reaches ougl.7 completion screen unaided |
| MM1 — Artefact quality parity | ougl.1 (priorArtefacts handoff injection), ougl.5 (gate-confirm write-then-read), ougl.6 (per-story handoff), ougl.7 (DoR handoff) | Covered — handoff mechanism delivered across all stage transitions; measured by validate-trace.sh on web UI-produced artefacts |
| MM2 — Option B handoff coherence | ougl.1 (buildSystemPrompt handoff block format), ougl.5 (disk-canonical write-then-read pattern) | Covered — handoff schema B-iii implemented in ougl.1 + ougl.5; coherence rated by operator at each gate-confirm step |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the spike and definition skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

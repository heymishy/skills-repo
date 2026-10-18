## Benefit Metric: Feature Playback Demo Package

**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Date defined:** 2026-10-15
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner (single-operator repo; matches this repo's own established convention across every other feature's benefit-metric.md this cycle)

**Product context read:** `product/mission.md` — the platform's own stated mission names an "empirical improvement cycle" where "real production outcomes and delivery actuals feed back into the pipeline"; this feature is the missing link between DoD (engineering-side completeness) and that feedback loop (stakeholder-side acceptance), consistent with the mission, not a new direction. `product/roadmap.md` — no explicit "playback"/"acceptance loop" deliverable is named in the current phase list; this is a natural, consistent extension of the traceability goal already stated in the mission, not a roadmap-mandated item. Flagged honestly rather than overstated.

**Meta-benefit check:** No. Discovery shows no signal of testing a tooling/process/capability hypothesis — this is a straightforward product feature (a playback package + an in-app viewer). Tier 2 (meta metrics) does not apply.

**Tier 3 (compliance/risk) check:** No *current* obligation. The discovery names a conditional future risk ("needs named compliance sign-off if a regulated tenant adopts this skill" — Assumptions and risks) — not a present regulatory obligation this feature exists to satisfy. Tier 3 does not apply now; revisit if/when a regulated tenant actually adopts this skill.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Acceptance loop closure rate

| Field | Value |
|-------|-------|
| **What we measure** | % of DoD-validated features (`dodStatus: "complete"` in `pipeline-state.json`) that have a complete playback package (walkthrough document + screenshots + video, all three present under `artefacts/[feature-slug]/playback/`) produced and shared with sponsors within 5 business days of DoD completion |
| **Baseline** | 0% — confirmed directly: no feature in this repo's delivery history has ever produced a playback package; the mechanism does not exist yet |
| **Target** | ≥80% of DoD-validated features reach this within 5 business days, measured over a rolling 90-day window once the skill is live |
| **Minimum validation signal** | ≥40% — meaningfully above 0%, proving the skill is actually being invoked and adopted, not just built and ignored |
| **Measurement method** | `artefacts/[feature-slug]/playback/` existence-and-completeness check, cross-referenced against each feature's DoD date in `pipeline-state.json` — checked weekly by the Platform Owner |
| **Feedback loop** | If the minimum signal isn't met, the skill isn't being adopted — investigate whether it's a discoverability gap (engineers don't know to run it) or a friction gap (still too manual despite automation) before iterating on scope |

### Metric 2: Sponsor feedback re-entry rate

| Field | Value |
|-------|-------|
| **What we measure** | Of playback packages shared with sponsors, % where feedback meeting a "change requested" threshold is formalised as a new discovery artefact (`triggeredBy: playback-feedback` tag in pipeline state) within 10 business days of the package being shared |
| **Baseline** | Not yet established — this mechanism doesn't exist today, so there is no current re-entry rate; will establish from the first 90 days of live usage, not fabricated now |
| **Target** | 100% of "change requested" feedback is formalised as a new discovery within 10 business days — a process-completeness guarantee, not a volume target |
| **Minimum validation signal** | Any single real instance of sponsor feedback being formalised as a traced new discovery artefact — proves the re-entry path works end to end at all, even once |
| **Measurement method** | Discovery artefacts carrying the `triggeredBy: playback-feedback` tag, cross-referenced against a manual log of playback-sharing events (sponsor feedback collection tooling is explicitly out of scope per discovery, so this stays manual until a later feature closes that gap) |
| **Feedback loop** | If zero instances occur in 90 days, the Platform Owner reviews actual playback-sharing events directly to distinguish "no sponsor requested a change" (a genuinely positive signal) from "feedback arose but wasn't captured/formalised" (a real process gap) before concluding the metric has failed |

### Metric 3: Demo preparation time

| Field | Value |
|-------|-------|
| **What we measure** | Engineer *active input time* (not total wall-clock, since Playwright's own capture runs unattended) from invoking the Feature Playback Package skill to a complete, editorially-reviewed package being ready to share |
| **Baseline** | Ad hoc today, estimated 2–4 hours of engineer time per feature — the operator's own estimate; no instrumented data exists since no consistent practice exists today. This estimate will be replaced with a real measured baseline from the first 2–3 manually-timed packages produced before full automation lands, per this skill's own baseline discipline — not fabricated precision now |
| **Target** | ≤45 minutes of engineer input time per package |
| **Minimum validation signal** | ≤90 minutes — roughly half the current ad hoc estimate, proving a meaningful reduction even before the full target is hit |
| **Measurement method** | Session timing signal from the playback skill itself (session start to final "package complete" confirmation) — requires the skill to be instrumented for this at `/definition` time; self-reported engineer time logged per use until then |
| **Feedback loop** | If the minimum signal isn't met, identify which step dominates engineer time (screenshot review, video scripting, caption review) and prioritise automating/streamlining that specific step rather than the whole package uniformly |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Acceptance loop closure rate | `fpd-s1` (produces the package), `fpd-s2` (completes it — video is required), `fpd-s3`/`fpd-s4` (makes it genuinely shareable/reviewable, not just produced), `fpd-s5` (fixes the two gaps blocking real-feature use and runs the first real capture) | Covered |
| M2 — Sponsor feedback re-entry rate | `fpd-s3`, `fpd-s4` (a traceable, evidence-visible package is what makes specific feedback likely), `fpd-s5` (same real-capture gap applies — nothing to give feedback on until it's fixed) | Covered |
| M3 — Demo preparation time | `fpd-s1` (DoD-sourced script + automated screenshots), `fpd-s2` (automated recording + auto-transcription) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach — that is `/definition` and `/design`
- Sprint targets or velocity — these metrics are outcome-based, not output-based

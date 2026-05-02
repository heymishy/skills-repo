# Benefit Metric: Web UI + Copilot Execution Layer — Non-Technical Outer Loop Surface

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Date defined:** 2026-05-02
**Metric owner:** Hamish King — Chief Product Guru (interim owner until Jenni Ralph can own metrics directly via the web surface this feature delivers)
**Reviewers:** Jenni Ralph — Chief Product Guru

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative delivers user value (Phase 1: read + sign-off surface; Phase 2: skill execution surface) and simultaneously validates two high-risk technical and adoption hypotheses. The meta metrics track whether the platform bets underlying the feature are sound. Phase 1 stories can proceed regardless of M1 (Copilot CLI feasibility). Phase 2 stories are gated on M1 PROCEED verdict.

---

## Tier 1: Product Metrics (User Value)

### P1: Non-engineer self-service sign-off rate

> **Phase 1 — no Copilot licence required. GitHub OAuth only.**

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of sign-off events on features with a named non-technical stakeholder that are performed via the web UI without engineer assistance |
| **Baseline** | 0% — no web surface exists; all sign-offs are informal (meetings, Teams, email) or engineer-mediated |
| **Target** | ≥80% of eligible sign-off events within 3 months of Phase 1 launch |
| **Minimum validation signal** | ≥1 successful unassisted sign-off performed by a non-technical stakeholder within first 2 weeks of Phase 1 launch |
| **Measurement method** | Automated: pipeline-state.json sign-off records + Attribution field population; monthly review by Hamish King |
| **Feedback loop** | If minimum signal is not met in first 2 weeks: interview the first cohort to identify the blocker (friction, awareness, accountability anxiety) before investing in Phase 2 stories |

---

### P2: Unassisted /discovery completion rate

> **Phase 2 — requires Copilot licence for skill execution. Gated on M1 PROCEED verdict.**

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of /discovery runs initiated in the web UI that produce a structurally valid artefact passing the DoR gate on the first attempt, without the user switching to VS Code or CLI at any point |
| **Baseline** | 0% — web UI skill execution does not exist |
| **Target** | ≥70% of Phase 2 /discovery sessions produce a valid artefact on first attempt |
| **Minimum validation signal** | ≥1 complete end-to-end /discovery run in the Phase 2 pilot that produces a DoR-valid artefact |
| **Measurement method** | Artefact DoR gate result + session log (no VS Code/CLI switch); reviewed by Hamish King after each pilot session |
| **Feedback loop** | If first 3 pilot sessions fail to produce valid artefacts: inspect the skill translation layer — SKILL.md vocabulary may not be rendering correctly in the web question flow; pause and redesign before expanding pilot |

---

### P3: Non-technical attribution rate

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of discovery artefacts approved after Phase 1 launch that have ≥1 non-engineering role named in the Attribution / Contributors section |
| **Baseline** | Establishing baseline in first 2 weeks of Phase 1 by auditing pipeline-state.json artefact history |
| **Target** | ≥90% of discovery artefacts approved after Phase 1 launch |
| **Minimum validation signal** | ≥50% of discovery artefacts have non-engineering attribution within the first month of Phase 1 |
| **Measurement method** | Automated scan of Attribution sections in approved discovery.md files; monthly review by Hamish King |
| **Feedback loop** | If <50% in first month: re-examine onboarding prompt — non-technical stakeholders may not be being surfaced the attribution step; address in the web UI UX before expanding |

---

### P4: Status self-service rate

> **Phase 1 — no Copilot licence required. Read-only pipeline view, GitHub OAuth only.**

| Field | Value |
|-------|-------|
| **What we measure** | Rate at which programme managers and business leads can answer "what phase is feature X in, and what is currently blocking it?" from the web UI without asking an engineer — self-reported |
| **Baseline** | 0% — requires git / VS Code access or direct engineer query; no web view exists |
| **Target** | ≥9 of 10 status questions self-serviced from web UI, self-reported at 90-day mark |
| **Minimum validation signal** | ≥2 programme managers or business leads confirm they used the web UI to get a status answer without asking an engineer, within first month |
| **Measurement method** | Lightweight self-report survey at 30 and 90 days post Phase 1 launch; supplemented by web UI page visit logs |
| **Feedback loop** | If minimum signal not met at 30 days: investigate whether the pipeline state view is comprehensible to non-technical readers — terminology, layout, or lack of awareness may be the blocker |

---

### P5: Sign-off wait time

| Field | Value |
|-------|-------|
| **What we measure** | Calendar days from artefact marked ready-for-review to attributed sign-off received, averaged across features |
| **Baseline** | Establishing from pipeline-state.json `updatedAt` timestamp deltas in first 2 weeks of Phase 1 |
| **Target** | Reduce baseline by ≥30% |
| **Minimum validation signal** | Reduction in wait time visible on ≥3 features in the first month after Phase 1 launch |
| **Measurement method** | Automated from pipeline-state.json stage transition timestamps; monthly review by Hamish King |
| **Feedback loop** | If no reduction after 3 features: the bottleneck may be calendar scheduling (meeting dependency) not tool access — interview the stakeholders before concluding the web surface has fixed the problem |

---

## Tier 2: Meta Metrics (Learning / Validation)

### M1: Copilot CLI/API non-interactive feasibility

| Field | Value |
|-------|-------|
| **Hypothesis** | The GitHub Copilot CLI or Copilot API can be invoked non-interactively server-side with an assembled SKILL.md prompt and return structured, parseable output — enabling Phase 2 skill execution in the web UI |
| **What we measure** | Spike outcome verdict: PROCEED (working proof of concept within timebox), REDESIGN (alternative architecture required), or DEFER |
| **Baseline** | Unknown — not yet a publicly documented supported use case |
| **Target** | PROCEED verdict with a working proof of concept that executes ≥1 skill step and returns parseable output |
| **Minimum signal** | A documented verdict — PROCEED or REDESIGN — is a valid signal either way; REDESIGN triggers Phase 2 architecture redesign before any stories are written |
| **Measurement method** | Spike artefact verdict; reviewed by Hamish King; must be complete before Phase 2 stories are scoped in /definition |

---

### M2: Phase 1 stakeholder activation rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Non-technical stakeholders will adopt a web sign-off surface even when it makes their governance accountability more explicit; accountability anxiety (identified in prior four-forces ideation) will not block adoption at Phase 1 scale |
| **What we measure** | Percentage of invited non-technical users who perform ≥1 attributable action (read an artefact, add a comment, or perform a sign-off) in the web UI within 30 days of onboarding |
| **Baseline** | 0% — no web surface exists |
| **Target** | ≥60% activation rate within 30 days of first cohort onboarding |
| **Minimum signal** | ≥40% activation — OR — qualitative evidence that accountability anxiety is the primary blocker, which is an actionable redesign signal regardless of the activation rate |
| **Measurement method** | GitHub OAuth activity log + pipeline-state.json attribution records; 30-day cohort review by Hamish King; short structured interview with non-activating cohort members |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| P1 — Non-engineer sign-off rate | TBD at /definition | Gap — pending stories |
| P2 — Unassisted /discovery completion rate | TBD at /definition | Gap — pending stories |
| P3 — Non-technical attribution rate | TBD at /definition | Gap — pending stories |
| P4 — Status self-service rate | TBD at /definition | Gap — pending stories |
| P5 — Sign-off wait time | TBD at /definition | Gap — pending stories |
| M1 — CLI/API feasibility | Spike story (pre-Phase 2) | Gap — pending spike story |
| M2 — Stakeholder activation rate | TBD at /definition | Gap — pending stories |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

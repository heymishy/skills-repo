# Benefit Metric: /prioritise — Multi-Framework Prioritisation Skill

**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Date defined:** 2026-04-27
**Metric owner:** Operator (solo — this is a personal skills library repo)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative delivers a new library skill (product value) and simultaneously validates whether a conversational scoring workflow can produce trustworthy, stakeholder-shareable prioritisation output from both engineer and non-engineer users (meta value). Both tiers are defined below. The skill can be considered successful on meta-metric grounds even if the full non-engineer adoption signal takes time to materialise — but M1 and M2 must pass before the skill is considered shippable.

---

## Tier 1: Product Metrics (User Value)

### M1: Session Completion Rate

| Field | Value |
|-------|-------|
| **What we measure** | Proportion of `/prioritise` sessions that start and result in a saved prioritisation artefact in the same session, without abandonment mid-scoring |
| **Baseline** | 0 — skill does not exist; no sessions have been completed |
| **Target** | ≥ 80% of sessions started result in a saved artefact (assessed across the first 5 real uses after ship) |
| **Minimum validation signal** | 3 of the first 5 sessions produce a saved artefact (60%). Below this, the conversational UX has a friction problem that must be resolved before broader use |
| **Measurement method** | Artefact written to disk = completed (objective). Sessions *started* = honour-system self-count for v1 — there is no session-start log. **Measurement gap:** the 80% target requires a denominator that is currently untracked. Accept this for v1 (operator self-counts on a tally), or add a `## Session started` log line at the top of the skill's opening output as a lightweight counter. This gap must be acknowledged at DoD. |
| **Feedback loop** | If minimum signal not met after 5 sessions: pause and review the conversational flow for the step where operators are abandoning. Revise the relevant SKILL.md section and re-test. Operator decides whether to continue or pivot. |

### M2: Input Quality — Rationale Completeness

| Field | Value |
|-------|-------|
| **What we measure** | Whether completed artefacts contain at least one written rationale sentence per framework pass — not just a numeric score. A score with no rationale is not a quality artefact regardless of formatting. |
| **Baseline** | 0 — no prior sessions exist; artefact format doesn't exist yet |
| **Target** | 100% of completed artefacts contain at least one rationale sentence per framework used. This is a hard quality floor, not a stretch target. |
| **Minimum validation signal** | First completed artefact contains rationale for all framework passes. If it does not, the skill's conversational prompts are failing to elicit reasoning and must be revised before further sessions. |
| **Measurement method** | Operator reviews saved artefact before sharing. The output format enforces a rationale field per item per framework — absence is visible. Reviewed at DoD. |
| **Feedback loop** | If first artefact has no rationale: identify which scoring prompt failed to elicit reasoning. Rewrite that prompt. M2 gates M1 — a completed but rationale-free artefact is not a passing M1. |

### M3: Non-Engineer Unassisted Completion

| Field | Value |
|-------|-------|
| **What we measure** | A person with no prior pipeline knowledge runs `/prioritise` and produces a ranked output without needing to ask what any of the three frameworks mean. The skill's in-session explanations are sufficient — no out-of-band lookup or operator hand-holding required. |
| **Baseline** | Not yet established — no non-engineer sessions exist. Will measure in the first real PM/business-lead use after ship. |
| **Target** | First non-engineer user completes a session unassisted, with no mid-session framework explanation requests that the skill failed to pre-empt |
| **Minimum validation signal** | One successful cold-start non-engineer run. Binary: completed unassisted yes/no. Failure means the framework introductions inside the skill need rewriting before broader use. |
| **Measurement method** | Observed or self-reported by the non-engineer participant after the session. Test question: **"Did the skill fail to explain something you needed explained?"** No = pass. Curiosity-driven external lookups (e.g. googling a term for deeper context) do not constitute skill failure — the metric tests whether the skill's guidance was sufficient, not whether the user was incurious. |
| **Feedback loop** | If first non-engineer run fails: review which framework explanation was insufficient. Revise the skill's opening framework description for that pass. Re-test with the same or another non-engineer user. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM1: Skill Self-Sufficiency (Cold-Start Replication)

| Field | Value |
|-------|-------|
| **Hypothesis** | The conversational guidance inside `/prioritise` is sufficient for a second operator — one who was not part of this design session — to run the skill on a real candidate list and produce a usable ranked artefact without reading the SKILL.md source or asking the original author for help |
| **What we measure** | Whether a cold-start operator (no prior involvement in this feature) completes a session and produces a saved artefact with rationale present, without out-of-band help |
| **Baseline** | Not yet established — skill does not exist |
| **Target** | First cold-start operator run produces a saved artefact passing the M1 + M2 bars without author assistance |
| **Minimum signal** | One successful cold-start run. If it fails, the skill's opening guidance and framework introductions require revision before it can be considered library-grade. A skill that requires tribal knowledge to operate is not a skill — it is a script with documentation debt. |
| **Measurement method** | Self-reported by the cold-start operator. Test question: "Did you need to ask anyone for help or look at the SKILL.md source?" No = pass. |

---

## Metric Coverage Matrix

*Populated by the /definition skill after stories are created. Every metric must have at least one story. Every story must reference at least one metric.*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Session completion rate | TBD at /definition | Gap — awaiting story definition |
| M2 — Rationale completeness | TBD at /definition | Gap — awaiting story definition |
| M3 — Non-engineer unassisted completion | TBD at /definition | Gap — awaiting story definition |
| MM1 — Cold-start replication | TBD at /definition | Gap — awaiting story definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and /test-plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based

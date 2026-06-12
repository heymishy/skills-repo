# Corpus Reuse Matrix — S2–S13 Across Pipeline Skills
**Generated:** 2026-06-12
**Purpose:** Determine how each S-series scenario can be reused across pipeline skills, and what the input format must be at each stage.

---

## Key: Cell Values

- **EXISTING** — already in the skill's corpus
- **DIRECT** — can reuse the scenario brief as-is (discovery only takes raw briefs)
- **ADAPT** — input must be transformed to a realistic upstream artefact before use
- **SKIP** — scenario does not provide meaningful signal for this skill

**Critical pipeline input realism rule:** /definition, /definition-of-ready, /definition-of-done, and /review must receive realistic upstream artefacts (a discovery output for /definition, a definition output for /dor, etc.) — never the raw S-series scenario brief. Passing a raw brief to /definition produces misleading signal: the model is doing discovery work, not definition work.

---

## Reuse Matrix

| Scenario | discovery | definition | dor | dod | ideate | review |
|----------|-----------|------------|-----|-----|--------|--------|
| S2 — Lending origination | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S3 — RTP integration | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S4 — Experience API card | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S5 — CRM transcription | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S7 — Event registration | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S8 — Regulatory reporting | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S9 — KiwiSaver switching | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S10 — Core banking migration | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S11 — CDR consent API | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S12 — AI credit model | EXISTING | ADAPT | ADAPT | SKIP | ADAPT | ADAPT |
| S13 — Trans-Tasman payments | EXISTING | ADAPT | ADAPT | ADAPT | ADAPT | ADAPT |
| S6a — Thin brief | EXISTING | SKIP | SKIP | SKIP | ADAPT | SKIP |
| S6b — Contradictory constraints | EXISTING | SKIP | SKIP | SKIP | SKIP | SKIP |
| S6c — Scope creep | EXISTING | SKIP | SKIP | SKIP | SKIP | SKIP |

*Note: S6a/S6b/S6c are failure-scenario briefs designed to test discovery behaviour, not full pipeline scenarios. They do not produce stable discovery artefacts and cannot be used as inputs for downstream pipeline skills.*

---

## Input Transformation Requirements by Skill

### /definition input format
Input must be: a realistic approved discovery artefact + benefit-metric artefact bundle, matching the format of the existing T1–T4 definition corpus cases (see `.github/skills/definition/corpus/T1-explicit-regulated.md`). The bundle must contain:
- Discovery artefact with PROBLEM, PERSONAS, MVP SCOPE, OUT OF SCOPE, ASSUMPTIONS, CONSTRAINTS, SUCCESS INDICATORS sections
- Status: Approved with named approver
- Benefit metric artefact with named metrics, targets, and measurement method

Do NOT pass the S-series operator brief directly. The model is being asked to decompose an approved artefact, not run discovery.

### /definition-of-ready input format
Input must be: a realistic story artefact bundle from a hypothetical /definition output, including:
- Story artefact (As/Want/So format, ACs, NFRs, architecture constraints, metric linkage)
- Parent epic artefact reference
- Test plan artefact reference
- Review report artefact (or absence of review — to test H2/H3 hard block detection)

The story must reflect the scenario's constraints (e.g., for S2 lending origination: PCI DSS, CCCFA, Centrix integration stories). The story is not written from the scenario brief — it is a representative story that a /definition run would have produced.

### /definition-of-done input format
Input must be: a realistic story artefact bundle + a hypothetical PR description, including:
- Story artefact with ACs (the benchmark)
- PR description with implementation summary, test evidence, and any deviations
- Test plan (optional — for NFR gap testing)

The PR must reflect partial or complete evidence of AC satisfaction. Planted defects (an AC with no evidence, an out-of-scope implementation) must be designed into the PR description, not the story.

### /ideate input format
Input can be the S-series scenario description (as a starting point for ideation) OR a partially-formed discovery artefact (for assumption inventory). Ideate can run before /discovery, so the raw brief is an acceptable input. The judge evaluates whether the ideation output produces a useful opportunity map or assumption inventory — not whether it correctly propagates constraints.

### /review input format
Input must be: realistic story artefact(s) from a hypothetical /definition run, with planted defects. Each story must be plausible and well-formed except for the specific planted defect (HIGH, MEDIUM, or LOW severity). Planted defect categories follow the /review SKILL.md category system (A=Traceability, B=Scope, C=AC quality, D=Completeness, E=Architecture compliance).

---

## Per-Scenario Analysis

### S2 — Lending origination (CCCFA, FMA bias, hidden FMA disclosure gap)
**High value for all pipeline skills.** The FMA algorithmic fairness constraint (C2) and the hidden demographic disparity disclosure gap (C5) create a chain of constraint propagation tests that works at every pipeline stage. For /definition: does the model propagate the CCCFA reasonable inquiry obligation into story ACs? For /dor: does the DoR gate catch a story where the CCCFA AML obligation is missing from ACs? For /review: planted scope violation (story implements automated decision above $30k threshold that the discovery scoped to manual review). Highest priority S-series scenario for definition and DoR corpus.

### S3 — RTP integration (scheme obligation, AML/CFT, hidden checklist gap)
**High value for definition and review.** The 10-second acknowledgement window (C3) is an architectural forcing constraint that must propagate into every technical story's NFR. The unreviewed 16/47 Payments NZ checklist items (C5 hidden) are a go-live blocker. For /definition: does the model write a story for scheme certification validation? For /review: planted NFR gap (story lacks the 10-second processing constraint). Medium priority — strong regulatory signal but less domain-specific than S2.

### S4 — Experience API card (PCI DSS QSA, open banking consent, hidden Redis gap)
**High value for definition, DoR, and review.** Three regulated constraints (QSA process gate, CDR consent, PAN caching prohibition) test multi-constraint propagation. For /definition: does the model propagate all three C-series constraints into separate story ACs? Analogous to T2 (dual-constraint) but with three constraints. For /review: planted architecture compliance violation (story caches raw PAN fields in Redis, violating C4). High priority.

### S5 — CRM transcription (Privacy Act, Azure DPA, hidden assessment backlog)
**Medium value for definition and review.** Privacy Act obligation (C1) and the firm no-automated-vulnerability-detection constraint (C2) create clear AC-level tests. For /definition: does the model write a story that correctly excludes any vulnerability flag suggestion? For /review: planted scope violation (story adds a "low risk" confidence indicator to vulnerability flag, violating C2). Medium priority.

### S7 — Event registration (Privacy Act partial, hidden retention gap)
**Lower value as a regulated test — higher value as a no-over-engineering test.** The brief is low-regulation intentionally. For /definition: does the model write clean Azure deployment stories without fabricating compliance gates (analogous to T4 negative control)? For /review: clean baseline story with at most one genuine LOW finding. Good calibration anchor.

### S8 — Regulatory reporting (RBNZ, FMA audit trail, hidden change-control gap)
**High value for definition and DoR.** The normalisation transformation change-control gap (C5) requires the model to treat a presented-as-neutral technical step as a regulated constraint requiring governance before encoding. For /definition: does the model write a "normalisation governance" story before the pipeline story? For /dor: does the DoR gate catch a pipeline story that lacks the normalisation change-control AC? High priority.

### S9 — KiwiSaver switching (FMA SEN, false urgency, hidden hardship fee waiver)
**High value for definition and review.** The KiwiSaver Act hardship fee waiver obligation (C5) is the most consequential hidden constraint — it is a statutory breach to implement the fee without the waiver. For /definition: does the model write a hardship fee waiver story or flag the gap? For /review: planted completeness failure (switching fee story has no hardship cohort exemption AC). High priority.

### S10 — Core banking migration (RBNZ BS11, zero data loss, hidden notification timing)
**High value for definition and DoR.** The RBNZ BS11 30-business-day pre-project notification (C5 hidden) requires migration story ACs to carry the notification as a project precondition. For /definition: does the model write an RBNZ notification story as a dependency? For /dor: does the DoR gate correctly block a migration execution story whose dependency on the RBNZ notification story is unresolved? Medium-high priority.

### S11 — CDR consent API (Privacy Act granular consent, revocation, hidden derived-data gap)
**High value for definition and review.** The derived-data consent boundary (C5) is a subtle Privacy Act question that a weak model will miss. For /definition: does the model defer enriched insights from the MVP scope or write a consent-scope validation story? For /review: planted scope violation (story implements enriched insights API endpoint when the discovery explicitly deferred enriched insights pending Privacy Act advice). High priority.

### S12 — AI credit model (FMA fairness, MRM gate, hidden policy version mismatch)
**High value for definition.** The MRM policy version mismatch (C5) invalidates the team's 12-week timeline assumption. For /definition: does the model write an independent validation engagement story (required by 2023 MRM policy) as a dependency on the deployment story? DoD skip — ML model retraining does not produce story-level PR artefacts in the same way. Ideation value: the assumption inventory (Lens B) is directly applicable — the team has multiple unvalidated assumptions about the MRM process. High priority for definition.

### S13 — Trans-Tasman payments (RBNZ AML/CFT, AUSTRAC, hidden correspondent agreement)
**Highest difficulty for definition.** The SWIFT correspondent bank agreement clause (C5) requires specialist domain knowledge. Multi-jurisdiction scope (NZ + AU regulations). For /definition: does the model write a correspondent bank notification story as a prerequisite for channel activation? For /review: planted traceability failure (the AU-side AUSTRAC obligation is missing from all story ACs). VERY-HIGH difficulty — the signal value is exceptional but calibration ceiling will be low. High priority as a hard case.

---

## Highest-Value Scenarios for Next Eval Corpus Build

Priority ranking for building definition and review corpus first:

1. **S2** — Lending origination: broadest regulated constraint set, CCCFA + FMA bias, hidden FMA disclosure. Highest signal density.
2. **S4** — Experience API: three regulated constraints including PCI DSS, tests multi-constraint propagation without duplication of S2 domain.
3. **S9** — KiwiSaver: statutory breach risk from hidden hardship waiver obligation. Very high difficulty.
4. **S11** — CDR consent API: derived-data consent boundary is a subtle privacy law question. Tests API schema-level constraint propagation.
5. **S8** — Regulatory reporting: change-control gap for normalisation logic. Tests whether model treats a presented-as-neutral step as requiring governance.
6. **S13** — Trans-Tasman payments: multi-jurisdiction, hidden contractual constraint. Hardest in corpus.

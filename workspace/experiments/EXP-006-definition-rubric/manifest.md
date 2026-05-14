# EXP-006 — /definition skill rubric experiment (C2-type constraint propagation)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-006-definition-rubric |
| experiment_type | skill-rubric-cpf |
| created | 2026-05-15 |
| operator | heymishy |
| status | planned |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual, VS Code model selector) |
| trigger | EXP-003 finding F1 — Haiku dropped C2 (PCI DSS QSA) at definition stage; isolation run required |
| skills_swept | definition |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4 |

## Hypothesis

Haiku (0.33× cost) maintains regulated CPF ≥ 0.80 on C2-type (process gate) constraints at the definition stage. If confirmed, Haiku is safe for /definition on regulated-input stories and Config C routing remains viable for this stage. If Haiku regulated CPF falls below 0.80 on C2-type constraints, Sonnet becomes the mandatory model for /definition on any story where the discovery artefact contains a process gate constraint — regardless of cost savings.

**Motivation:** EXP-003 Config C run (Sonnet for /discovery, Haiku for /definition onward) dropped C2 (PCI DSS QSA sign-off before go-live) at the definition stage. The constraint was absent from definition story ACs, recovered only by /review at a later stage (regulated at-source CPF: 0.33). EXP-005 isolates /definition to determine whether the drop is a Haiku-specific behaviour or a structural issue with the skill. A Haiku-specific drop confirms Sonnet is required for /definition on regulated inputs; a skill-level finding reopens the question of whether a SKILL.md intervention (explicit constraint scan step) would allow Haiku to be reinstated.

## Corpus design

The four cases are designed to stress C2 constraint propagation at different extraction difficulty levels. C2-type constraints are **process gate** obligations — requirements that a named external approval, certification, or sign-off must occur before a story or feature can go live. Unlike technical NFRs (RTO, retention periods), process gates are action-dependencies rather than quality thresholds.

| Case | Label | C2 present? | Source location | Expected propagation | Additional regulated constraint |
|------|-------|-------------|-----------------|---------------------|--------------------------------|
| T1 | Payment card tokenisation — explicit C2 | Yes (single) | Explicit Constraints section entry | C2 → dedicated story AC and/or explicit NFR | None |
| T2 | AML transaction monitoring — C2 + C3 competing | Yes (process gate + retention) | Both in Constraints section | Both C2 and C3 → separate story ACs without either eclipsing the other | C3 (AML/CFT 5-year retention) |
| T3 | Cross-border payment routing — C2 implicit | Yes (narrative-only) | Discovery narrative body; absent from Constraints section | Model must extract from narrative and surface as explicit story AC or constraint | None |
| T4 | Internal developer tooling — no regulated constraints | No | Not present | Model must NOT fabricate a C2 process gate | None |

**Corpus location:** `.github/skills/definition/corpus/` *(to be populated before first run — seed from the case descriptions below)*

### Case detail — T1: Payment card tokenisation

**Setup:** Discovery artefact for a payment card tokenisation feature at a regulated bank. The Constraints section explicitly lists: *"PCI DSS QSA sign-off required before production go-live — tokenisation system must achieve SAQ D compliance and pass external QSA assessment."* Benefit-metric artefact active with a cost-reduction metric.

**What the model must do:** Break the feature into epics and stories. The QSA gate must appear as an explicit AC in at least one story (e.g. the deployment or hardening story). It must not be silently dropped or paraphrased into a vague "must be compliant" note.

**Pass condition:** At least one story AC contains the QSA gate with named standard (PCI DSS), named gate type (external QSA assessment), and go-live dependency. Paraphrase acceptable; omission is not.

**Fail condition:** All story ACs are technical only; the QSA gate is absent from the output or mentioned only in an architecture note without becoming an AC.

### Case detail — T2: AML transaction monitoring

**Setup:** Discovery for an AML transaction monitoring module. Constraints section contains two regulated constraints: (C2) *"Regulatory sign-off from AML Compliance Officer required before activation — model must be validated per FMA Model Risk Policy."* and (C3) *"All transaction records must be retained at a geographically separate location for a minimum 5 years per AML/CFT Act s.24."*

**What the model must do:** Both constraints must survive into story ACs. The test is whether the process gate (C2) is dropped when a concrete technical constraint (C3) is also present — a known failure mode where models prioritise implementable NFRs over approval-dependency constraints.

**Pass condition:** Separate story ACs (or stories) cover both C2 (compliance sign-off gate) and C3 (retention). Neither may eclipse the other.

**Fail condition:** C3 is propagated but C2 is absent or merged into a vague "regulatory approval" note without the named gate (Model Risk Policy / FMA sign-off).

### Case detail — T3: Cross-border payment routing

**Setup:** Discovery for a cross-border payment routing feature. The Constraints section lists only technical constraints (latency SLA, currency handling). The discovery narrative body contains: *"Our FX settlement agreement with the scheme requires scheme certification before we can route live volume through the new path — this is a contractual obligation, not a technical preference."* This C2 (scheme certification) is not elevated to the Constraints section.

**What the model must do:** Apply Step 1.5 of the SKILL.md (architecture constraints scan). Identify the implied process gate in the narrative and either: (a) surface it as a named constraint before decomposing, or (b) directly propagate it into a story AC.

**Pass condition:** Scheme certification gate appears as an explicit story AC or the model surfaces it as an extracted constraint before proceeding to decomposition.

**Fail condition:** Model proceeds to decomposition using only the Constraints section; scheme certification gate is absent from all story ACs.

### Case detail — T4: Internal developer tooling (negative control)

**Setup:** Discovery for an internal CI/CD pipeline enhancement — no regulated constraints, no process gates. The Constraints section lists only: infrastructure sizing limits, pipeline execution time budget. Benefit-metric is an internal efficiency metric.

**What the model must do:** Decompose the feature correctly and produce story ACs that reflect only the stated technical constraints. The model must NOT fabricate a process gate or compliance step.

**Pass condition:** No C2 process gate appears in any story AC. Story ACs reference only the stated technical constraints.

**Fail condition:** Model invents a compliance gate, sign-off step, or regulatory approval AC that is not grounded in the discovery input (false positive C2 fabrication).

## Primary metric: regulated CPF at definition stage (C2-type)

$$CPF_{def}^{C2} = \frac{\text{C2 constraints correctly propagated to story ACs or named stories}}{\text{total C2 constraints in discovery input}}$$

A C2 constraint is **correctly propagated** if:
1. It appears as a named, explicit acceptance criterion in at least one story, OR
2. It is elevated as a named constraint in the decomposition output before story ACs are written (Step 1.5 surface), AND subsequently referenced in a story.

Paraphrase with no material omission counts as propagated. Paraphrase that removes the named approval gate, the named regulation, or the go-live dependency counts as dropped.

### Thresholds (C2-specific)

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Pass | CPF ≥ 0.80 | Model propagates ≥ 80% of C2 constraints correctly — safe for regulated inputs |
| Warning | 0.60 ≤ CPF < 0.80 | Model occasionally drops C2 — operator review required for each run |
| Failure | CPF < 0.60 | Model regularly drops C2 — **prohibited for regulated-input stories** |

**T4 pass condition (negative control):** Zero C2 ACs fabricated. Any fabricated process gate = categorical fail on T4 regardless of D4 rubric score.

**Secondary metric:** Weighted rubric score (from judge, averaged across all 4 cases). Pass threshold: ≥ 0.80 weighted, zero categorical fails.

## Grading dimensions (for judge)

### D1 — C2 constraint identification accuracy
**Weight:** 0.30
**What it measures:** Does the model correctly identify the C2 process gate constraint(s) in the input? For T3 this requires extraction from narrative; for T1/T2 it requires recognition from the Constraints section; for T4 it requires not identifying one where none exists.

| Score | Meaning |
|-------|---------|
| 1.0 | All C2 constraints correctly identified (or correctly absent for T4); no false positives |
| 0.7 | C2 correctly identified but framing is ambiguous (e.g. described as a "recommendation" rather than a hard gate) |
| 0.4 | C2 partially identified — named constraint present but approval gate dependency omitted |
| 0.0 | C2 absent from output (T1/T2/T3) or C2 fabricated (T4) |

**Categorical fail:** C2 missing entirely when present in input (T1/T2/T3) → D1 = 0.0 and `compliant = false`. C2 fabricated when not in input (T4) → D1 = 0.0 and `compliant = false`.

### D2 — C2 propagation to story ACs
**Weight:** 0.30
**What it measures:** Does the identified C2 constraint become an explicit acceptance criterion or dedicated story in the decomposition output? Identification without propagation does not count as CPF propagated.

| Score | Meaning |
|-------|---------|
| 1.0 | C2 appears as an explicit, named AC in at least one story with go-live dependency stated |
| 0.7 | C2 referenced in a story's Architecture Constraints or NFR section but not as an AC (testability gap) |
| 0.4 | C2 mentioned in a general note or story description but not as an enumerated AC |
| 0.0 | C2 absent from all story ACs, NFRs, and architecture constraints |

### D3 — C2 specificity and actionability
**Weight:** 0.20
**What it measures:** When C2 is propagated, is the resulting AC specific enough for a coding agent to implement a corresponding test? A vague AC ("must comply with regulations before go-live") is insufficient; a specific AC names the regulation, the approving body, and the gate condition.

| Score | Meaning |
|-------|---------|
| 1.0 | AC names: (a) the specific regulation or contractual obligation, (b) the approving body or role, (c) the go-live gate condition |
| 0.7 | AC names two of three required elements |
| 0.4 | AC names one of three (typically just the regulation); approval body and gate condition absent |
| 0.0 | AC present but entirely vague — no named regulation, body, or gate condition |

**Note:** D3 is scored N/A for T4 (no C2 should be propagated). Weight redistributed proportionally when N/A.

### D4 — No-fabrication accuracy
**Weight:** 0.10
**What it measures:** Does the model avoid fabricating C2 process gates not present in the discovery input? Measured primarily on T4 (negative control) but applies to T1–T3 as well — model must not add additional process gates beyond those in the discovery.

| Score | Meaning |
|-------|---------|
| 1.0 | No fabricated C2 process gates in any story AC |
| 0.5 | One fabricated or unsupported C2 process gate present (minor — e.g. added "security sign-off" for an internal tool) |
| 0.0 | C2 process gate fabricated for T4, or additional unsupported gates added to T1–T3 that contradict the discovery scope |

### D5 — Story decomposition completeness (non-C2)
**Weight:** 0.10
**What it measures:** Are the non-C2 aspects of the discovery correctly decomposed into stories? This dimension ensures C2 propagation is not achieved at the expense of overall decomposition quality.

| Score | Meaning |
|-------|---------|
| 1.0 | All discovery MVP scope items are reflected in at least one story; scope accumulator check completed |
| 0.7 | One scope item missing or one story substantially over/under-scoped |
| 0.4 | Multiple scope items missing, or decomposition produces only one story for a multi-story feature |
| 0.0 | Decomposition is incomplete to the point the output is not usable |

## Token and cost estimate (Layer 1 — AI Credits)

| Component | Cases | Models | Trials | Multiplier | Est. credits |
|-----------|-------|--------|--------|------------|--------------|
| Candidate runs: haiku-4-5 | 4 | 1 | 2 | 0.33× | ~5 credits |
| Candidate runs: sonnet-4-6 | 4 | 1 | 2 | 1× | ~16 credits |
| Judge calls: sonnet-4-6 | 16 total | 1 | 1 | 1× | ~16 credits |
| **Total** | | | | | **~37 credits** |

Estimates assume /definition inputs are medium-size (~1.5–2k tokens: discovery + benefit-metric). Judge runs against full decomposition output (~2–3k tokens per run).

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| definition | T1, T2, T3, T4 | haiku-4-5, sonnet-4-6 | 2 each |

Total cells: 4 cases × 2 models × 2 trials = 16 runs.

## How to run (Layer 1)

1. Select the target model in the VS Code GitHub Copilot model picker.
2. Start a new chat. Paste the SKILL.md prompt header (the role/context block from the top of `.github/skills/definition/SKILL.md`).
3. Paste the corpus case bundle from `.github/skills/definition/corpus/T[N]-[label]/bundle.md`. Each bundle contains a discovery artefact and benefit-metric artefact.
4. Record the full model output (epics, stories, ACs) in the run file (see runs directory).
5. Switch to sonnet-4-6. Paste the judge prompt, substituting `{DISCOVERY}`, `{BENEFIT_METRIC}`, and `{OUTPUT}` with the relevant bundle sections and the model output. Score D1–D5.
6. Record the judge JSON result in the run file.
7. Repeat for each case and model.

**Run file naming:** `workspace/experiments/EXP-005-definition-rubric/runs/[model]/[case]-trial[N].md`

**CPF measurement procedure (per run):**
1. Identify all C2 constraints in the discovery input (Constraints section + narrative)
2. Label them C2a, C2b, … for that case
3. Check each story AC and architecture constraint in the model output
4. Record: propagated (P), dropped (D), or ambiguous (A — resolve conservatively as dropped for regulated constraints)
5. Calculate `CPF_def^C2 = P / (P + D)`

## Runs log

| Run | Case | Model | Trial | Date | Run file | D1 | D2 | D3 | D4 | D5 | Weighted | Pass | CPF correct |
|-----|------|-------|-------|------|----------|----|----|----|----|----|---------|------|------------|
| 1 | T1 | haiku-4-5 | 1 | | runs/haiku/T1-trial-1.md | | | | | | | | |
| 2 | T1 | haiku-4-5 | 2 | | runs/haiku/T1-trial-2.md | | | | | | | | |
| 3 | T1 | sonnet-4-6 | 1 | | runs/sonnet/T1-trial-1.md | | | | | | | | |
| 4 | T1 | sonnet-4-6 | 2 | | runs/sonnet/T1-trial-2.md | | | | | | | | |
| 5 | T2 | haiku-4-5 | 1 | | runs/haiku/T2-trial-1.md | | | | | | | | |
| 6 | T2 | haiku-4-5 | 2 | | runs/haiku/T2-trial-2.md | | | | | | | | |
| 7 | T2 | sonnet-4-6 | 1 | | runs/sonnet/T2-trial-1.md | | | | | | | | |
| 8 | T2 | sonnet-4-6 | 2 | | runs/sonnet/T2-trial-2.md | | | | | | | | |
| 9 | T3 | haiku-4-5 | 1 | | runs/haiku/T3-trial-1.md | | | | | | | | |
| 10 | T3 | haiku-4-5 | 2 | | runs/haiku/T3-trial-2.md | | | | | | | | |
| 11 | T3 | sonnet-4-6 | 1 | | runs/sonnet/T3-trial-1.md | | | | | | | | |
| 12 | T3 | sonnet-4-6 | 2 | | runs/sonnet/T3-trial-2.md | | | | | | | | |
| 13 | T4 | haiku-4-5 | 1 | | runs/haiku/T4-trial-1.md | | | | | | | | |
| 14 | T4 | haiku-4-5 | 2 | | runs/haiku/T4-trial-2.md | | | | | | | | |
| 15 | T4 | sonnet-4-6 | 1 | | runs/sonnet/T4-trial-1.md | | | | | | | | |
| 16 | T4 | sonnet-4-6 | 2 | | runs/sonnet/T4-trial-2.md | | | | | | | | |

## Scorecard summary

*Populated after all runs complete.*

| Model | T1 CPF | T2 CPF | T3 CPF | T4 CPF | Overall C2 CPF | Avg weighted | Pass rate | Compliant | Verdict |
|-------|-------|-------|-------|-------|---------------|-------------|-----------|-----------|---------|
| haiku-4-5 | | | | | | | | | |
| sonnet-4-6 | | | | | | | | | |

## Findings

*Populated after all runs complete.*

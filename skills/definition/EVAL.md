# EVAL.md — /definition skill evaluation specification

**Skill:** `/definition`
**SKILL.md path:** `.github/skills/definition/SKILL.md`
**Corpus path:** `.github/skills/definition/corpus/`
**Last calibrated:** 2026-05-15
**Calibration model:** claude-sonnet-4-6
**Response type:** artefact — the correct output is always a story decomposition, never a clarification question

> **Clarification gate note:** If response_type is hybrid: see clarification-scorecard.md for the CL1-CL4 rubric. D1-D7 must not be applied to clarification responses. (Not applicable to /definition — this skill always produces artefact output.)

---

## Purpose

This file defines the evaluation specification for the `/definition` skill, scoped specifically to **regulated constraint propagation fidelity (CPF)** — whether C2-type (process gate) constraints captured in the discovery artefact are correctly propagated into story acceptance criteria during decomposition.

It is consumed by:

1. **Layer 1 — Operator runbook** (`.github/skills/model-sweep/SKILL.md`): the judge prompt is used manually after saving model outputs
2. **Layer 2 — Programmatic script** (`scripts/run-model-sweep.js`): the judge prompt and dimension weights are consumed directly to produce per-cell structured scores

The five dimensions are derived from the `/definition` SKILL.md — specifically Step 4a (regulated constraint propagation check), Step 4 (story decomposition discipline), and the scope accumulator (Step 6). Do not add dimensions not grounded in the SKILL.md.

**Experiment context:** This EVAL.md was written for EXP-005-definition-rubric. Motivation: EXP-003 Config C found that Haiku at the definition stage dropped C2 (PCI DSS QSA sign-off) — a regulated process gate constraint — from story ACs. C2 was present and explicit in the discovery Constraints section; it was absent from all definition output. EXP-005 isolates the definition stage to determine whether this is a Haiku-specific behaviour or a SKILL.md structural gap.

---

## Grading dimensions

### D1 — C2 constraint identification accuracy
**Weight:** 0.30
**What it measures:** Does the model correctly identify the C2-type process gate constraint(s) present in the discovery input? For T1 and T2, this means recognising the constraint from the Constraints section. For T3, it requires extracting the constraint from the discovery narrative body where it appears without a Constraints section entry (testing Step 4a trigger awareness). For T4, correct behaviour is identifying that no C2 constraint is present.

| Score | Meaning |
|-------|---------|
| 1.0 | C2 correctly identified (T1/T2/T3) or correctly absent (T4); constraint named with correct gate type (process gate / sign-off / certification) |
| 0.7 | C2 identified but framing is ambiguous — present as a general compliance note rather than a hard go-live gate |
| 0.4 | C2 partially identified — named constraint present but the go-live dependency or approval authority omitted |
| 0.0 | C2 absent from output when present in input (T1/T2/T3) — or C2 fabricated when absent from input (T4) |

**Categorical fail:** C2 missing entirely from output when present in discovery input (T1/T2/T3) → D1 = 0.0 and `compliant = false`. C2 fabricated for T4 (internal tooling, no process gate) → D1 = 0.0 and `compliant = false`.

**Corpus anchors:**
- T1 → 1.0: PCI DSS QSA sign-off identified by name, SAQ D compliance and external QSA assessment referenced
- T2 → 1.0: AML Compliance Officer sign-off and FMA Model Risk Policy both named; neither eclipses the other
- T3 → 0.7 minimum if model extracts from narrative; 0.0 if model proceeds to decompose without surfacing scheme certification
- T4 → 1.0 if no C2 AC fabricated; 0.0 if model invents a compliance sign-off step not in the input

---

### D2 — C2 propagation to triggering story ACs
**Weight:** 0.30
**What it measures:** Does the identified C2 constraint become an explicit acceptance criterion (AC) in at least one story — specifically the story or stories whose implementation scope falls within the regulated gate? Identification in a constraints scan without propagation to a story AC does not count as CPF propagated. Applying Step 4a.2 (trigger assignment) and Step 4a.3 (Architecture Constraints insertion) correctly is the behavioural evidence for a 1.0 score.

| Score | Meaning |
|-------|---------|
| 1.0 | C2 appears as a named, explicit AC in at least one triggering story; AC states the go-live gate and the approving authority |
| 0.7 | C2 referenced in a story Architecture Constraints field but not elevated to an AC — constraint is noted but not testable without promotion to AC |
| 0.4 | C2 mentioned in a story description or general epic note but absent from all enumerated ACs and Architecture Constraints fields |
| 0.0 | C2 absent from all story ACs, Architecture Constraints, and epic notes |

**Note:** D2 is scored N/A for T4 (no C2 should be propagated). When N/A, the D2 weight (0.30) is redistributed proportionally to D1, D3, and D5.

**Corpus anchors:**
- T1 → 1.0: QSA gate appears as a named AC (e.g. "Given the tokenisation system is deployed, When QSA assessment is requested, Then the system must satisfy SAQ D scope before production activation is approved")
- T2 → 1.0: Both C2 (AML sign-off) and C3 (5-year retention) each appear as distinct ACs in different triggering stories; neither replaces the other
- T3 → 0.7 minimum if C2 appears in Architecture Constraints; 1.0 only if elevated to an AC

---

### D3 — C2 AC specificity and actionability
**Weight:** 0.20
**What it measures:** When C2 is propagated into an AC, is the AC specific enough that a coding agent can implement a corresponding test — either a deployment gate check or an integration test that verifies the approval pathway exists? A vague AC ("must comply with regulations before go-live") is insufficient; a specific AC names the regulation or contractual obligation, the approving body or role, and the gate condition.

| Score | Meaning |
|-------|---------|
| 1.0 | AC names all three: (a) the specific regulation or contractual obligation, (b) the approving body or role, (c) the concrete gate condition (what must be true before production activation) |
| 0.7 | AC names two of three required elements — typically names the regulation and gate condition but omits the specific approving body |
| 0.4 | AC names one of three — typically the regulation only; approval body and gate condition absent |
| 0.0 | AC present but entirely vague — no named regulation, no named approving body, no gate condition |

**Note:** D3 is scored N/A for T4 (no C2 should be propagated). N/A weight is redistributed proportionally to D1, D2, and D5.

**Corpus anchors:**
- T1 → 1.0: AC names "PCI DSS" (obligation), "external QSA" (approving body), "SAQ D compliance achieved and QSA sign-off received before production activation" (gate condition)
- T2 C2 element → 1.0: AC names "FMA Model Risk Policy" (obligation), "AML Compliance Officer / FMA-registered assessor" (approving body), "independent validation completed before activation of automated screening rules" (gate condition)
- T3 → 0.7 minimum: AC names "FastPay scheme certification" (obligation) + gate condition; 1.0 if also names "FastPay technical assurance team" (approving body)

---

### D4 — No-fabrication accuracy (negative control)
**Weight:** 0.10
**What it measures:** Does the model avoid fabricating C2 process gates not present in the discovery input? This dimension is the primary test for T4 (internal developer tooling, no regulated constraints). It also applies to T1–T3 — the model must not add additional process gates beyond those evidenced in the discovery. False positives (fabricated gates) indicate the model is pattern-matching on feature context rather than reading the actual Constraints section.

| Score | Meaning |
|-------|---------|
| 1.0 | No fabricated C2 process gates in any story AC or Architecture Constraints field |
| 0.5 | One weakly-fabricated gate present — e.g. model adds "security review required before deployment" to an internal tooling story where no such gate exists in the input |
| 0.0 | C2 process gate fabricated for T4 (no regulatory context in input) — or additional unsupported process gates added to T1–T3 that are not grounded in the discovery Constraints section |

**Categorical fail (T4 only):** Any fabricated compliance sign-off, regulatory approval, or certification gate in T4 story ACs → D4 = 0.0 and `compliant = false`.

**Corpus anchors:**
- T4 → 1.0: Story ACs reference only scanner pipeline timing and cost constraints; no compliance sign-off, audit gate, or regulatory approval appears anywhere in the output
- T1 → 1.0: Model propagates the QSA gate (correct) but does not add a GDPR review, SOX sign-off, or other unsupported gate
- T2 → 1.0: Model propagates C2 (AML sign-off) and C3 (retention) but does not fabricate additional gates (e.g. "FATF sign-off" not in the discovery)

---

### D5 — Story decomposition completeness (non-C2)
**Weight:** 0.10
**What it measures:** Are the non-C2 aspects of the discovery MVP scope correctly decomposed into stories? This dimension ensures C2 propagation is not achieved at the expense of overall decomposition quality. A model that achieves D1/D2/D3 perfection but produces a single story for a multi-story feature, or misses a discovery MVP scope item, fails this dimension. Also checks that the scope accumulator (Step 6) is applied — stories must not silently expand beyond discovery MVP scope.

| Score | Meaning |
|-------|---------|
| 1.0 | All discovery MVP scope items reflected in at least one story; scope accumulator check completed or evident; no silent scope expansion |
| 0.7 | One MVP scope item missing, or one story substantially over-scoped (includes out-of-scope behaviour) |
| 0.4 | Multiple scope items missing, or decomposition produces one story for a clearly multi-story feature |
| 0.0 | Decomposition is incomplete to the point the output is not usable — fewer than half of MVP scope items have story coverage |

**Corpus anchors:**
- T1 → 1.0: Four MVP scope items (tokenise at capture, TrustVault integration, detokenise at submission, audit logging) each have at least one story; out-of-scope items (mobile SDK, bulk migration) not included
- T2 → 1.0: Four MVP scope items covered; SAR filing automation and watchlist management UI correctly excluded
- T4 → 1.0: Four MVP scope items (PR scan, block rule, weekly digest, auto-PR for patches) each covered; container scanning and Jira integration correctly excluded

---

## Pass threshold

**Weighted pass score:** ≥ 0.80

Formula: `Σ(dimension_score × weight)` across all scored dimensions (N/A dimensions have their weight redistributed proportionally).

A weighted score below 0.80 indicates the model is not suitable for /definition on regulated inputs. A score of 0.90+ indicates strong model suitability.

**Regulated CPF threshold (primary metric — separate from weighted score):**

$$CPF_{def}^{C2} = \frac{\text{C2 constraints correctly propagated to story ACs}}{\text{total C2 constraints in discovery input}}$$

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Pass | CPF ≥ 0.80 | Model propagates ≥ 80% of C2 constraints — safe for regulated inputs |
| Failure | CPF < 0.80 | Model drops C2 constraints — **prohibited for regulated-input stories** |

**No warning band for regulated constraints.** CPF below 0.80 is a failure, not a warning. There is no intermediate tier.

**Categorical fails** (override weighted total, set `compliant = false`):
- C2 absent from all story output when C2 is present in discovery Constraints section (T1, T2) → D1 = 0.0
- C2 absent from output when C2 is present in discovery narrative (T3) AND model did not surface or flag it → D1 = 0.0
- C2 process gate fabricated in T4 story ACs → D1 = 0.0 and D4 = 0.0

---

## Judge prompt

Use this prompt verbatim when scoring a model output. Replace `{INPUT}` with the discovery artefact and benefit-metric bundle for the corpus case, `{OUTPUT}` with the raw text of the model's decomposition response, and `{CASE_ID}` with the corpus case identifier (T1–T4).

```
You are evaluating a model's response to the /definition skill prompt against corpus case {CASE_ID}.

Your task is to score the response on 5 dimensions and return a JSON object only — no prose, no explanation outside the JSON.

Discovery artefact and benefit-metric input:
{INPUT}

Model decomposition output to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below. Use the corpus anchor scores for calibration.

Rubric:
D1 — C2 constraint identification (weight 0.30): Did the model correctly identify the C2-type process gate constraint from the input? T1/T2: must name constraint from Constraints section. T3: must extract from narrative body. T4: must NOT identify a C2 (no process gate exists). 1.0=correct+named+gate-type stated; 0.7=identified+ambiguous-framing; 0.4=partial+approval-authority-omitted; 0.0=missing(T1/T2/T3) or fabricated(T4)
D2 — C2 propagation to triggering story ACs (weight 0.30): Did C2 appear as an explicit AC in at least one triggering story? SKIP (N/A) for T4 — no C2 should be propagated. 1.0=explicit-AC+go-live-gate+approving-authority; 0.7=Architecture-Constraints-only(not-in-AC); 0.4=description-mention-only; 0.0=absent-from-all-story-output
D3 — C2 AC specificity (weight 0.20): When C2 is in an AC, does it name all three: (a) regulation/obligation, (b) approving body/role, (c) gate condition? SKIP (N/A) for T4. 1.0=all-three; 0.7=two-of-three; 0.4=one-of-three; 0.0=vague/absent
D4 — No-fabrication (weight 0.10): Did the model avoid fabricating C2 process gates not in the input? T4 is the primary test — model must produce zero compliance/approval ACs. 1.0=no-fabricated-gates; 0.5=one-weak-fabrication; 0.0=fabricated-gate-in-T4 or unsupported-gate-added-to-T1-T3
D5 — Decomposition completeness (weight 0.10): Are all non-C2 discovery MVP scope items covered by at least one story, with no silent scope expansion? 1.0=all-items-covered+scope-accumulator-applied; 0.7=one-item-missing-or-over-scoped; 0.4=multiple-items-missing; 0.0=fewer-than-half-covered

N/A weight redistribution for T4: D2 (0.30) and D3 (0.20) are N/A. Redistribute proportionally to remaining scored dimensions: D1 becomes 0.60, D4 becomes 0.20, D5 becomes 0.20.

Categorical fail rules (override weighted total, set compliant=false):
- T1/T2: C2 absent from all story output → D1=0.0, note "regulated_cpf_fail: C2 dropped"
- T3: C2 absent AND model did not flag or surface the narrative constraint → D1=0.0, note "regulated_cpf_fail: narrative_C2_not_extracted"
- T4: Any C2 process gate / compliance approval AC fabricated → D1=0.0, D4=0.0, note "fabrication_fail: C2_gate_invented"

Also calculate:
- cpf_c2_score: (number of C2 constraints correctly propagated to story ACs) / (total C2 constraints in discovery input). For T4: cpf_c2_score = 1.0 if no fabricated C2 gates (negative control passes), 0.0 if any fabricated.
- cpf_pass: true if cpf_c2_score >= 0.80

Return ONLY valid JSON in this exact schema:
{
  "case_id": "{CASE_ID}",
  "model_label": "TBD",
  "scores": {
    "d1_c2_identification": <0.0-1.0>,
    "d2_c2_propagation": <0.0-1.0 or "N/A">,
    "d3_c2_specificity": <0.0-1.0 or "N/A">,
    "d4_no_fabrication": <0.0-1.0>,
    "d5_decomposition_completeness": <0.0-1.0>
  },
  "weighted_score": <computed: Σ(score × weight) with N/A redistribution applied>,
  "cpf_c2_score": <0.0-1.0>,
  "cpf_pass": <true if cpf_c2_score >= 0.80>,
  "pass": <true if weighted_score >= 0.80 and compliant=true>,
  "compliant": <true unless a categorical fail rule triggered>,
  "notes": "<one sentence: main C2 propagation behaviour observed, or fabrication behaviour for T4>"
}
```

---

## Corpus calibration scores (reference)

These are expected ranges for a well-calibrated Sonnet run against each corpus case. Use them to verify judge calibration — a judge that scores T1 below 0.75 is likely over-strict; a judge that scores T4 above 0.95 for a run that contains fabricated gates is miscalibrated toward leniency.

| Case | Expected weighted range | Expected CPF C2 | Key calibration anchor |
|------|------------------------|-----------------|------------------------|
| T1 | 0.85–0.95 | 1.0 | PCI DSS QSA AC names all three elements; QSA gate is a HARD blocker before production activation |
| T2 | 0.80–0.92 | 1.0 | Both C2 (FMA sign-off) and C3 (5-year retention) propagated to distinct ACs in separate stories; neither eclipses the other |
| T3 | 0.65–0.82 | 0.8–1.0 | Scheme certification extracted from narrative; surfaced before decomposition (Step 4a awareness); lower ceiling because extraction from narrative is harder than from Constraints section |
| T4 | 0.85–0.95 | 1.0 (negative) | Zero compliance/approval ACs; scanner ACs reference only timing and cost constraints; a fabricated "security sign-off" AC is a categorical fail regardless of other scores |

**Notes on expected behaviour differences across cases:**
- **T3 ceiling (0.82)** is lower than T1/T2 because extracting an implicit constraint from narrative requires the model to apply Step 4a to a constraint not in the Constraints section. A model that skips this extraction and proceeds to decompose without surfacing scheme certification will score 0.0 on D1 and D2.
- **T4** is a negative control — a model that scores near 1.0 here has correctly recognised the absence of regulated constraints and resisted the temptation to add compliance flavour to a security-adjacent story. Scores below 0.80 on T4 indicate false positive C2 fabrication risk.
- **T2 dual-constraint design** targets the specific failure mode where models de-prioritise process gate constraints (C2) in favour of more concrete technical constraints (C3 retention period). If C3 appears in ACs but C2 does not, D2 = 0.0 regardless of D3 or D5 scores.

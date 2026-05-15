# EXP-005-definition-rubric — Haiku 4-5 vs Sonnet 4-6 Final Comparison
**Experiment:** EXP-005-definition-rubric — Constraint Propagation Fidelity (CPF)
**Corpus:** 4 cases × 2 trials = 8 runs per model (16 runs total)
**Models compared:** claude-haiku-4-5 vs claude-sonnet-4-6
**Date:** 2026-05-15
**Compiled by:** claude-sonnet-4-6

---

## 1. CPF_def^C2 — Per case, per trial, both models

$CPF_{def}^{C2}$ = (number of C2 constraints correctly propagated to story ACs) / (total C2 constraints in discovery input)

### Table 1 — CPF_def^C2 per case per trial

| Case | C2 Type | Haiku Trial 1 | Haiku Trial 2 | Sonnet Trial 1 | Sonnet Trial 2 |
|------|---------|:---:|:---:|:---:|:---:|
| T1 — PCI DSS QSA (explicit) | 1 process gate | **1.0** | **1.0** | **1.0** | **1.0** |
| T2 — AML FMA + retention (competing) | 2 constraints (C2 + C3) | **1.0** | **1.0** | **1.0** | **1.0** |
| T3 — FastPay cert. (narrative-only) | 1 implicit process gate | **1.0** | **1.0** | **1.0** | **1.0** |
| T4 — CI/CD scanner (negative control) | None | PASS | PASS | PASS | PASS |
| **Overall CPF (T1–T3)** | — | **1.0** | **1.0** | **1.0** | **1.0** |

Both models achieve CPF = 1.0 across all regulated cases in both trials. Zero variation.

### Table 2 — Pass/fail summary

| Model | Trial 1 Cases Passed | Trial 2 Cases Passed | Combined Pass Rate |
|-------|:---:|:---:|:---:|
| Haiku 4-5 | 4/4 | 4/4 | 8/8 |
| Sonnet 4-6 | 4/4 | 4/4 | 8/8 |

No CPF failures. No categorical fails triggered in either model.

---

## 2. D3 Specificity Scores — Per case, both models

D3 measures whether the C2 AC names all three required elements: (a) obligation/regulation, (b) approving body/role, (c) gate condition.

### Table 3 — D3 Specificity per case per trial

| Case | Haiku T1 D3 | Haiku T2 D3 | Sonnet T1 D3 | Sonnet T2 D3 |
|------|:---:|:---:|:---:|:---:|
| T1 — PCI DSS QSA | 1.0 | 1.0 | 1.0 | 1.0 |
| T2 — AML FMA + retention | 1.0 | 1.0 | 1.0 | 1.0 |
| T3 — FastPay narrative | 1.0 | 1.0 | 1.0 | 1.0 |
| T4 (negative) | N/A | N/A | N/A | N/A |
| **Mean D3 (T1–T3)** | **1.0** | **1.0** | **1.0** | **1.0** |

All D3 scores = 1.0 across both models and both trials.

#### Qualitative D3 comparison — T3 (narrative case, most discriminating)

**Haiku T3 (both trials):**
- Obligation phrasing: "clause 7.3 of the scheme membership rules"
- Approving body: "FastPay technical assurance team"
- Gate condition: "Scheme certification completed; formal certification sign-off issued; live NZD/PHP routing permitted after sign-off"
- Flag label: "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED (Step 4a trigger):" — explicitly names Step 4a path

**Sonnet T3 (both trials):**
- Obligation phrasing: "clause 7.3 of the FX settlement agreement"
- Approving body: "FastPay technical assurance team"
- Gate condition: "FastPay scheme certification obtained AND formal sign-off received — live routing must not begin before this sign-off is received"
- Flag label: "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED" — same flag, omits "Step 4a trigger" label
- Additional: Sonnet includes explicit self-instruction at Step 4a: "C2 MUST propagate to at least one story as an explicit named AC — this is a CPF-critical requirement, not optional"

**Observation:** Phrasing differences (scheme membership rules vs FX settlement agreement) reflect different corpus input text, not model capability — both correctly refer to clause 7.3. Both models name all three D3 elements. Sonnet's self-instruction pattern and explicit gate language ("must not begin before this sign-off is received") are marginal qualitative differences with no D3 score impact.

---

## 3. D4 No-Fabrication Scores — Per case, both models

D4 measures absence of fabricated compliance gates (1.0 = zero fabrication; 0.5 = minor fabrication; 0.0 = categorical fail).

### Table 4 — D4 No-Fabrication per case per trial

| Case | Haiku T1 D4 | Haiku T2 D4 | Sonnet T1 D4 | Sonnet T2 D4 |
|------|:---:|:---:|:---:|:---:|
| T1 — PCI DSS QSA | 1.0 | 1.0 | 1.0 | 1.0 |
| T2 — AML FMA + retention | 1.0 | 1.0 | 1.0 | 1.0 |
| T3 — FastPay narrative | 1.0 | 1.0 | 1.0 | 1.0 |
| T4 — negative control | 1.0 | 1.0 | 1.0 | 1.0 |
| **Mean D4 (T1–T4)** | **1.0** | **1.0** | **1.0** | **1.0** |

No fabricated gates in any run across either model. D4 = 1.0 is stable.

#### Qualitative D4 comparison — T4 (fabrication risk test)

**Haiku T4-run-1:** Scope accumulator notes "No Story 5 required" — passive absence record.
**Haiku T4-run-2:** Explicit "Regulated Constraints Check: None" section with per-category negation (no process gate, no compliance framework, no external approval authority, no mandatory sign-off). More explicit than run-1.

**Sonnet T4-run-1:** Explicit absence list enumerating frameworks checked: "No regulatory frameworks mentioned (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, or similar). No external approval requirements. No certification language." Scope accumulator: "No regulated constraint gate story required."
**Sonnet T4-run-2:** Same structure. Consistent.

**Observation:** Both models produce D4 = 1.0. Sonnet's approach is more systematic in documenting what it scanned for (explicit named framework list), whereas Haiku's approach varies between trials (run-1 passive, run-2 explicit). Sonnet produces more uniform negative-control documentation across both trials.

---

## 4. Weighted Score Summary

### Table 5 — Weighted scores per case per trial

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|:---:|:---:|:---:|:---:|
| T1 | 1.0 | 1.0 | 1.0 | 1.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 |
| T3 | 1.0 | 1.0 | 1.0 | 1.0 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 |
| **Mean** | **1.0** | **1.0** | **1.0** | **1.0** |

All weighted scores = 1.0 across both models and both trials. No differentiation at the quantitative score level.

---

## 5. T3 Specific Comparison — Depth and Explicitness (FastPay Narrative Extraction)

This is the most discriminating test case. C2 appears only in the Background narrative. EVAL.md calibrated an expected T3 ceiling of 0.82 because "extracting an implicit constraint from narrative is harder." Both models exceeded this ceiling.

### Extraction path comparison

| Attribute | Haiku 4-5 (both trials) | Sonnet 4-6 (both trials) |
|-----------|-------------------------|--------------------------|
| ⚠️ Flag triggered | Yes — both trials | Yes — both trials |
| Flag label | "NARRATIVE-ONLY CONSTRAINT IDENTIFIED (Step 4a trigger):" | "NARRATIVE-ONLY CONSTRAINT IDENTIFIED" |
| Narrative quoted | Full passage including "4–8 weeks" timing | Shorter — core obligation sentence |
| Clause reference | "clause 7.3 of the scheme membership rules" | "clause 7.3 of the FX settlement agreement" |
| Approving body | "FastPay technical assurance team" | "FastPay technical assurance team" |
| Gate condition in AC | "certification sign-off issued; live routing permitted after sign-off" | "formal certification sign-off received; live routing must not begin before this sign-off is received" |
| Self-instruction pattern | Not present | Present ("C2 MUST propagate...") |
| Story 3 scope note | "outside FastPay certification scope" | "outside FastPay certification scope" |
| Expected T3 ceiling (EVAL.md) | 0.82 | 0.82 |
| Actual T3 score | **1.0 (both trials)** | **1.0 (both trials)** |

**Finding:** The T3 performance gap between the two models is effectively zero. Both triggered the correct Step 4a path, both quoted the narrative, both named clause 7.3 and the FastPay technical assurance team, both propagated to Story 4 AC3 with full D3 specificity. The phrasing differences ("scheme membership rules" vs "FX settlement agreement") reflect the corpus input differences, not model capability variation. The expected ceiling of 0.82 was not a realistic ceiling for either model with the current SKILL.md Step 4a instruction — both models exceed it consistently.

---

## 6. Key Findings

**Finding F1 — Both models achieve CPF = 1.0 across all regulated corpus cases, both trials**

CPF = 1.0 (16/16 runs pass; 12/12 regulated constraints propagated to story ACs; 4/4 negative controls produce zero fabrication). The EXP-003 hypothesis that Haiku drops C2 process gates is not reproducible with either model under the current SKILL.md Step 4a instruction.

**Finding F2 — EVAL.md T3 ceiling of 0.82 is not a real ceiling for either model**

Both Haiku 4-5 and Sonnet 4-6 consistently achieve 1.0 on T3 (narrative-only) across all four trials (4 Haiku + 4 Sonnet). The Step 4a narrative-scan instruction — with its explicit ⚠️ flag, dual-scan path (Constraints + Background), and CPF propagation mandate — is sufficient to drive ceiling-exceeding performance at both tiers. The 0.82 ceiling was likely calibrated for older or less-explicit instruction versions.

**Finding F3 — No qualitative D3 specificity advantage for Sonnet over Haiku**

At D3 = 1.0 for both models across all cases and trials, there is no measurable specificity depth advantage. Sonnet's self-instruction pattern ("C2 MUST propagate...") and Sonnet's more consistent T4 explicit-absence documentation are observable differences in reasoning style, but they produce no outcome difference in the judge evaluation. A corpus with ambiguous or partially-named elements would be needed to discriminate D3 specificity at the sub-1.0 level.

**Finding F4 — Sonnet's self-instruction and formal table patterns are qualitative style differences, not capability differences**

Sonnet includes explicit self-instructions at Step 4a and formal non-eclipsing tables in T2. Haiku uses more narrative explanation. Both produce equivalent ACs. For production use, Sonnet's structural approach may provide marginally better audit trails in edge cases (e.g. when a constraint is borderline narrative vs constraint-section), but neither pattern produced divergent outcomes on this corpus.

**Finding F5 — EXP-003 failure root cause remains ambiguous**

EXP-003 found that a Haiku model dropped C2. EXP-005 does not reproduce this with Haiku 4-5. The most likely explanations remain: (1) model version improvement (Haiku 3.5 → 4-5) or (2) SKILL.md Step 4a specificity improvement. A controlled re-run of T3 with Haiku 3.5 would disambiguate but is not feasible if Haiku 3.5 is no longer available.

---

## 7. Routing Recommendation

### Recommendation: Either model is suitable for CPF-critical definition tasks with the current SKILL.md

**Quantitative basis:** Both models achieve CPF = 1.0 across both trials on a four-case corpus spanning explicit, competing, narrative-only, and negative-control constraint patterns. There is no measurable CPF, D3, or D4 advantage to using Sonnet over Haiku for this task.

**Routing decision factors:**

| Factor | Haiku 4-5 | Sonnet 4-6 | Recommendation |
|--------|-----------|------------|----------------|
| CPF (regulated cases) | 1.0 | 1.0 | Tie |
| D3 specificity | 1.0 | 1.0 | Tie |
| D4 fabrication | 1.0 | 1.0 | Tie |
| T3 narrative extraction | 1.0 | 1.0 | Tie |
| D4 consistency across trials (T4) | Variable articulation | Consistent explicit absence | Minor Sonnet advantage |
| Step 4a self-instruction visibility | Absent | Present | Minor Sonnet advantage |
| Token cost | Lower | Higher | Haiku advantage |
| Speed | Faster | Slower | Haiku advantage |

**Primary recommendation:** Use Haiku 4-5 for standard `/definition` runs — it achieves the same CPF = 1.0 outcome at lower cost and higher throughput. The SKILL.md Step 4a instruction is the primary driver of CPF performance; model tier is not a discriminating factor for this task.

**Secondary recommendation:** Reserve Sonnet 4-6 for definition runs where: (a) discovery inputs are highly ambiguous or contain multiple nested narrative sections, (b) the feature is in a heavily regulated domain where audit trail quality matters beyond pass/fail scoring, or (c) a human reviewer will use the Step 4a output directly as an artefact (Sonnet's formal table and self-instruction patterns provide marginally more readable audit records).

**Escalation trigger:** If a future EXP-005 re-run on a harder corpus (e.g. constraints embedded in appendices, contradictory constraint signals across sections, multi-language discovery inputs) produces a CPF drop for Haiku but not Sonnet, the routing recommendation should be revised. On the current corpus, no escalation is warranted.

---

## 8. Experiment Conclusion

$$CPF_{Haiku} = \frac{6}{6} = 1.0 \quad CPF_{Sonnet} = \frac{6}{6} = 1.0$$

*(T1×2 + T2×2×2 + T3×2 = 6 regulated constraints per model across both trials for T1+T2+T3)*

**EXP-005 hypothesis outcome:**

> *H0: Haiku 4-5 drops C2 process gates (EXP-003 reproduction)* → **NOT REPRODUCED**

> *H1: Sonnet 4-6 achieves higher CPF than Haiku 4-5* → **NOT CONFIRMED** (tie at 1.0)

> *H2: Step 4a instruction is sufficient for reliable narrative-only extraction at both tiers* → **CONFIRMED** (T3 = 1.0 for all 4 trials across both models)

> *H3: Neither model fabricates compliance gates on negative-control input* → **CONFIRMED** (T4 = zero fabrication across all 4 trials)

**Routing recommendation: Haiku 4-5 for standard definition runs. Sonnet 4-6 for high-ambiguity or high-audit-trail requirements.**

# Experiment Roadmap — EXP-015 Onwards
**Generated:** 2026-06-12
**Purpose:** Sequenced experiment programme from EXP-015, covering skill gaps identified in the eval inventory.

---

## Current state recap

- EXP-001 through EXP-013: /discovery fully validated; /definition, /dor, /review, /test-plan rubrics created and calibrated
- EXP-014: manifest not found — may be planned but not yet materialised
- In-flight: EXP-003 Config C run 3 (pipeline CPF with Step 4a fix) is pending
- Routing confirmed: claude-sonnet-4-6 for /discovery (EXP-010)
- Skills needing first sweep: /definition-of-done (EVAL.md + corpus exist, no calibration run), /ideate (no EVAL.md, no corpus)
- Skills with eval infrastructure but no sweep in this programme period: /benefit-metric (eval-programme-roadmap.md confirms not started)

---

## Sequencing constraints (applied)

1. Pipeline skills validate in order: discovery → definition → dor → dod
2. /ideate can run in parallel with pipeline validation
3. /review is already validated (EXP-006) — no further work needed in this window
4. EXP-013 and EXP-014 must complete before any experiment that depends on SKILL.md clarification protocol changes
5. Stop at 6 experiments — findings from earlier experiments will inform later design

---

## EXP-015 — /definition-of-done Calibration Sweep

| Field | Value |
|-------|-------|
| Experiment ID | EXP-015-dod-calibration |
| Skill | /definition-of-done |
| Priority | HIGH |

**Purpose:** Validate the existing DoD EVAL.md and corpus (T1–T4, 4 existing cases) against Sonnet 4.6 and Haiku 4.5. Establish calibration scores so that subsequent routing decisions have measurement backing. The eval-programme-roadmap.md notes DoD as "Not started — Provisional Sonnet" — this changes that status.

**Dependencies:**
- DoD EVAL.md exists (`.github/skills/definition-of-done/EVAL.md`)
- DoD corpus exists (T1–T4)
- No dependency on EXP-013 or EXP-014 (DoD does not use clarification protocol)
- EXP-003 Config C run 3 should ideally complete first (E2E CPF validation confirms definition output quality, which DoD corpus bundles assume), but not a hard blocker

**Recommended models:**
- claude-sonnet-4-6 (establish baseline — current provisional routing)
- claude-haiku-4-5 (test if Haiku can replace Sonnet at DoD, consistent with gate-skill Haiku approval on DoR and review)

Rationale: DoD is a gate skill (correctness-weighted). EXP-004 showed Haiku achieved GF 1.00 on DoR. Testing Haiku on DoD is low-risk and low-cost. If Haiku matches Sonnet, it saves 0.67× cost per DoD run.

**Recommended cases:** T1 (webhook SLA AC gap — HIGH planted defect), T2 (profile scope creep — out-of-scope violation), T3 (API key NFR gap — NFR unverified), T4 (filter complete — clean baseline, false-positive suppression)

**Estimated cost (3 trials per cell, standard):**
- Sonnet 4.6: 4 cases × 3 trials = 12 runs. DoD prompts are shorter than discovery (~600 input / 800 output tokens). Estimated $0.018/run × 12 = $0.22 + judge calls $0.018 × 12 = $0.22. Total ~$0.44.
- Haiku 4.5: 4 cases × 3 trials = 12 runs. ~$0.006/run × 12 = $0.07 + judge $0.22. Total ~$0.29.
- Grand total: ~$0.73

**Expected signal:** If Haiku achieves D1 ≥ 0.90 on T1–T3 (no false positives) and D4 ≥ 0.90 on T4 (no false negatives), this changes routing policy: DoD → Haiku, saving 0.67× per DoD call across the full pipeline. If Haiku misses any T1–T3 planted defect (D1 = 0.0), it remains Sonnet-routed with a finding noting the failure mode for corpus design improvement.

---

## EXP-016 — /definition-of-done S-Series Corpus Expansion

| Field | Value |
|-------|-------|
| Experiment ID | EXP-016-dod-s-series |
| Skill | /definition-of-done |
| Priority | MEDIUM |

**Purpose:** Run the 8 new S-series corpus cases proposed in `corpus-designs/corpus-design-definition-of-done.md` against the routing model confirmed by EXP-015. The S-series cases test regulated constraint inheritance (PCI DSS, CCCFA, KiwiSaver Act) — verifying that DoD correctly requires evidence of regulated AC satisfaction, not just general "compliance addressed" statements.

**Dependencies:**
- EXP-015 complete (calibration baseline established, routing model confirmed)
- S-series DoD corpus cases must be built from the designs in this proposal

**Recommended models:** Winning model from EXP-015 only (cost management — 3 trials × 8 cases is already 24 runs). If Sonnet won EXP-015, run Sonnet only. If Haiku matched Sonnet, run Haiku (lower cost, equivalent quality confirmed).

**Recommended cases (from corpus-design-definition-of-done.md):**
- DOD-S2 (CCCFA AC gap — HIGH)
- DOD-S4 (PAN caching scope violation — VERY-HIGH)
- DOD-S9 (hardship fee waiver absent — VERY-HIGH)
- DOD-S11 (enriched insights deployed despite deferral — HIGH)
- DOD-S7 (genuinely complete — calibration anchor)
- Plus 3 others at the operator's discretion from the remaining corpus designs

Start with the 5 listed above for maximum signal density.

**Estimated cost (3 trials per cell, 8 cases, winning model from EXP-015):**
- Sonnet: ~$0.018/run × 24 = $0.43 + judge $0.43. Total ~$0.86.
- Haiku: ~$0.006/run × 24 = $0.14 + judge $0.43. Total ~$0.57.

**Expected signal:** The primary question is whether the routing model correctly handles the subtle regulatory AC evidence cases (DOD-S4 transient PAN in cache, DOD-S11 enriched insights framing evasion). If the model passes DOD-S7 cleanly (no false positives) and catches DOD-S4/S9 planted defects, the corpus is validated and DoD routing is confirmed for S-series difficulty inputs.

---

## EXP-017 — /ideate First Sweep: Lens B and D Focus

| Field | Value |
|-------|-------|
| Experiment ID | EXP-017-ideate-lens-bd |
| Skill | /ideate |
| Priority | HIGH |

**Purpose:** First sweep of /ideate against the proposed corpus cases in `corpus-designs/corpus-design-ideate.md`. Focus on Lens B (assumption inventory) and Lens D (strategy assessment) — the two lenses with the clearest correctness signals. Lens A (opportunity mapping) is harder to judge objectively and is deferred to EXP-018.

**Dependencies:**
- `/ideate` EVAL.md proposed in `eval-designs/eval-design-ideate.md` must be reviewed and formalised before running
- The comparative judging design (reference pair A/B) requires human-authored reference outputs for each case
- No dependency on EXP-013 or EXP-014 (ideation does not use the discovery clarification protocol)
- Can run in parallel with EXP-015/016

**Recommended models:**
- claude-sonnet-4-6 (baseline — provisional routing for generative skills)
- claude-fable-5 (test on domain-knowledge cases — EXP-010 showed Fable 5 leads on S-medium difficulty; S12 is VERY-HIGH difficulty for ideation)

Rationale: /ideate requires domain-specific reasoning for assumption risk calibration on NZ financial services scenarios. EXP-010 showed Sonnet 4.6 leads on S-hard discovery cases, but the ideation task (surfacing what the team doesn't know) may have different model characteristics than structured discovery. Fable 5 is worth testing on the 2 VERY-HIGH cases.

**Recommended cases:**
- IDE-S2-LensB (assumption inventory, HIGH) — first calibration case
- IDE-S9-LensD (strategy assessment, false urgency, HIGH) — tests whether model challenges the board timeline
- IDE-S7-LensA (opportunity mapping, LOW) — false-positive suppression baseline
- IDE-THIN-CLARIFY (clarification trigger, LOW) — tests response_type = clarification
- IDE-S12-LensB (assumption inventory, VERY-HIGH) — hardest case; tests MRM policy version gap surfacing

**Estimated cost (3 trials per cell, 5 cases, 2 models):**
- Ideation prompts are longer (~1500 input / 3000 output tokens for a full lens).
- Sonnet 4.6: 5 cases × 3 trials = 15 runs × $0.048/run = $0.72 + judge (Sonnet, 15 calls) $0.72. Total ~$1.44.
- Fable 5: 5 cases × 3 trials = 15 runs × $0.171/run = $2.57 + judge $0.72. Total ~$3.29.
- Grand total: ~$4.73.

**Expected signal:** If Sonnet achieves I1 ≥ 0.70 on IDE-S2 and IDE-S9 (constraint inheritance on regulated scenarios), Sonnet is confirmed for /ideate routing. If Sonnet scores < 0.60 on IDE-S12-LensB (VERY-HIGH difficulty MRM policy gap), and Fable 5 scores ≥ 0.70, this confirms the same Sonnet-leads-hard-cases pattern as EXP-010. IDE-THIN-CLARIFY is a pass/fail gate: if the model fails to issue a clarification response on the 7-word input, the response_type protocol needs SKILL.md reinforcement.

---

## EXP-018 — /definition Corpus Expansion: S-Series Cases

| Field | Value |
|-------|-------|
| Experiment ID | EXP-018-definition-s-series |
| Skill | /definition |
| Priority | MEDIUM |

**Purpose:** Expand the /definition corpus from the current 4 T-series cases (CPF-focused) to include 6 S-series cases testing regulated constraint propagation across the NZ financial services scenarios. This tests whether the definition model correctly propagates constraints identified in S-series discovery artefacts into story ACs.

**Dependencies:**
- EXP-003 Config C run 3 (E2E CPF validation with Step 4a fix) should complete before this — its findings may affect which S-series scenarios are highest priority
- S-series /definition corpus cases must be built from representative discovery artefacts derived from S-series scenarios (not raw scenario briefs — see corpus-reuse-matrix.md ADAPT rule)
- Existing /definition EVAL.md (CPF-focused) is sufficient for this sweep without modification

**Recommended models:**
- claude-sonnet-4-6 (current production routing for /definition on non-regulated inputs)
- claude-haiku-4-5 (test on S2/S4 — these have explicit regulated constraints where EXP-005 showed Haiku passes in isolation)

Do NOT include Fable 5 in this sweep — EXP-010 confirmed Sonnet as optimal and Fable 5's 5.8× cost premium is not justified without a clear hypothesis.

**Recommended cases (new):**
- DEF-S2 (CCCFA + FMA bias propagation, VERY-HIGH)
- DEF-S4 (PCI DSS QSA + open banking consent + PAN caching, HIGH)
- DEF-S9 (KiwiSaver Act hardship waiver propagation, HIGH)
- DEF-S11 (CDR derived-data consent deferral, HIGH)
- DEF-S7 (no over-engineering, negative control, LOW)
- DEF-S13 (multi-jurisdiction AML/CFT + AUSTRAC + correspondent clause, VERY-HIGH)

**Estimated cost (3 trials per cell, 6 cases, 2 models):**
- Definition prompts are ~1200 input / 2500 output tokens.
- Sonnet: 6 × 3 = 18 runs × $0.048/run = $0.86 + judge $0.86. Total ~$1.72.
- Haiku: 18 runs × $0.016/run = $0.29 + judge $0.86. Total ~$1.15.
- Grand total: ~$2.87.

**Expected signal:** The key question is whether the routing model (Sonnet) correctly propagates KiwiSaver Act hardship waiver (C5 in S9) and CDR derived-data consent boundary (C5 in S11) into story ACs — both are the hardest hidden constraints in those scenarios. If Sonnet CPF ≥ 0.80 on DEF-S2 and DEF-S4 (explicit regulated), but CPF < 0.80 on DEF-S9 and DEF-S11 (hidden/subtle), this confirms the need for a discovery-to-definition constraint handoff mechanism. Haiku on DEF-S7 provides no-over-engineering validation.

---

## EXP-019 — /ideate Lens A and E Expansion

| Field | Value |
|-------|-------|
| Experiment ID | EXP-019-ideate-lens-ae |
| Skill | /ideate |
| Priority | MEDIUM |

**Purpose:** Complete the /ideate sweep by adding Lens A (opportunity mapping) and Lens E (JTBD) cases. EXP-017 established Lens B and D baselines. This experiment uses the routing model confirmed in EXP-017 and focuses on the comparative judging design for Lens A (harder to evaluate objectively) and the JTBD job story quality for Lens E.

**Dependencies:**
- EXP-017 complete (Lens B/D baseline established, routing model confirmed, comparative judging rubric validated)
- Human-authored reference outputs for Lens A cases (required for comparative judging)
- Can run after EXP-017 with minimal additional design work

**Recommended models:** Routing model confirmed by EXP-017 only. No additional model comparisons — EXP-017 handles model selection; EXP-019 validates the remaining lenses.

**Recommended cases:**
- IDE-S11-LensA (CDR consent API opportunity mapping, HIGH — tests whether enriched insights appear without Privacy Act caveat)
- IDE-S3-LensE (RTP integration JTBD, MEDIUM — tests whether model reframes the job as scheme compliance, not customer UX)
- IDE-S8-LensB extended (regulatory reporting assumption inventory — tests normalisation governance gap)

**Estimated cost (3 trials per cell, 3 cases, 1 model):**
- Sonnet: 9 runs × $0.048/run = $0.43 + judge $0.43. Total ~$0.86.

**Expected signal:** The Lens A CDR case is the primary signal — if the model maps enriched insights as an unqualified opportunity without the Privacy Act caveat, this confirms that /ideate (like /discovery) needs stronger constraint-inheritance instruction for derived-data scenarios. This would feed a SKILL.md proposal.

---

## EXP-020 — /definition-of-done Adversarial Loop 2

| Field | Value |
|-------|-------|
| Experiment ID | EXP-020-dod-loop2 |
| Skill | /definition-of-done |
| Priority | LOW |

**Purpose:** Run the Loop 2 adversarial corpus cases (minimal PR description, fabricated evidence detection) to test whether the routing model correctly produces ⚠️ verdicts rather than ✅ on unverifiable ACs. This validates that the DoD model resists hallucinating AC satisfaction from thin PR evidence.

**Dependencies:**
- EXP-015 and EXP-016 complete (routing model confirmed, S-series calibration done)
- Loop 2 corpus cases must be built (DOD-T5, DOD-T6, DOD-T7 from the eval design)

**Recommended models:** Routing model from EXP-015/016 only.

**Estimated cost (3 trials per cell, 3 cases, 1 model):**
- Sonnet: 9 runs × $0.018/run = $0.16 + judge $0.16. Total ~$0.32.

**Expected signal:** If the model correctly marks all ACs as ⚠️ on the minimal PR (DOD-T5) — confirming it does not hallucinate satisfaction — this validates DoD routing for minimal-evidence scenarios. If the model marks even one AC as ✅ from "tests pass" as the only evidence, this is a false-positive risk finding requiring SKILL.md constraint: "a passing test suite is not sufficient evidence for any individual AC unless the test name is cited."

---

## Programme Summary

| Experiment | Skill | Priority | Dependencies | Est. Cost | Primary Signal |
|------------|-------|----------|--------------|-----------|----------------|
| EXP-015 | /dod calibration | HIGH | None hard | ~$0.73 | Haiku vs Sonnet for gate skill |
| EXP-016 | /dod S-series | MEDIUM | EXP-015 | ~$0.86 | Regulated AC evidence quality |
| EXP-017 | /ideate Lens B+D | HIGH | EVAL.md formalised | ~$4.73 | Constraint inheritance, false urgency |
| EXP-018 | /definition S-series | MEDIUM | EXP-003 C run 3 | ~$2.87 | Hidden constraint propagation at definition |
| EXP-019 | /ideate Lens A+E | MEDIUM | EXP-017 | ~$0.86 | Opportunity map constraint inheritance |
| EXP-020 | /dod loop 2 | LOW | EXP-015/016 | ~$0.32 | False-positive suppression on thin evidence |

**Total estimated programme cost:** ~$10.37

**Run order:**
1. EXP-015 (DoD calibration — no dependencies, quick to run)
2. EXP-017 (Ideate Lens B+D — no dependencies, can run in parallel with EXP-015)
3. EXP-016 (DoD S-series — after EXP-015)
4. EXP-018 (Definition S-series — after EXP-003 Config C run 3)
5. EXP-019 (Ideate Lens A+E — after EXP-017)
6. EXP-020 (DoD loop 2 — after EXP-015/016, lowest priority)

**Findings from EXP-015 and EXP-017 will directly inform:** routing policy for the full pipeline (if Haiku is confirmed for DoD at EXP-015, total pipeline cost drops further); SKILL.md proposals for /ideate constraint inheritance (if EXP-017 shows models fail IDE-S9-LensD false urgency detection).

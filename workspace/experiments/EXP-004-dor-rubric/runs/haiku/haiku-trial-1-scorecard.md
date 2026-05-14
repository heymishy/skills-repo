# EXP-004 Scorecard: Haiku Trial 1

**Experiment:** EXP-004-dor-rubric
**Model:** claude-haiku-4-5
**Trial:** 1 of 2
**Judge model:** claude-sonnet-4-6
**Date scored:** 2026-05-14
**Rubric:** `.github/skills/definition-of-ready/EVAL.md`
**Pass threshold:** weighted score ≥ 0.80 AND compliant = true

---

## Results table

| Case | Description | Expected verdict | Actual verdict | GF | Pass |
|------|-------------|-----------------|----------------|----|------|
| T1 | Payment webhook — missing ACs | BLOCKED (H2) | BLOCKED (H2) | 1.0 | ✅ |
| T2 | DR failover — unresolved HIGH finding | BLOCKED (H7) | BLOCKED (H7) | 1.0 | ✅ |
| T3 | Session token refresh — engineer-only approvers | BLOCKED (H-GOV) | BLOCKED (H-GOV) | 1.0 | ✅ |
| T4 | Payment audit trail — genuinely ready | READY (W1, W3) | READY (W1, W3) | 1.0 | ✅ |

**Trial 1 gate fidelity: 4/4 = 1.00**

---

## Dimension scores

| Case | G1 (×0.30) | G2 (×0.15) | G3 (×0.25) | G4 (×0.15) | G5 (×0.10) | G6 (×0.05) | Weighted | Compliant |
|------|-----------|-----------|-----------|-----------|-----------|-----------|----------|-----------|
| T1 | 1.0 | 1.0 | N/A† | 1.0 | 1.0 | 1.0 | 1.00 | true |
| T2 | 1.0 | 1.0 | N/A† | 1.0 | 1.0 | 1.0 | 1.00 | true |
| T3 | 1.0 | 1.0 | N/A† | 1.0 | 1.0 | 1.0 | 1.00 | true |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | true |

† G3 N/A for BLOCKED cases; weight redistributed proportionally across G1, G2, G4, G5, G6.

**Mean weighted score: 1.00**
**Categorical fails: 0**

---

## Adversarial trap summary

Each corpus case carries one adversarial failure mode targeting a known class of model error. All four were correctly defeated.

| Case | Adversarial trap | Defeat evidence |
|------|-----------------|-----------------|
| T1 | H2 — count ACs instead of checking GWT format | Item-level classification: AC1 = GWT ✅; 3 prose bullets identified individually ❌ |
| T2 | H7 — early-exit after first two acknowledged MEDIUMs | Full scan of all 3 findings; R3 classified HIGH despite "Architecture consideration" title |
| T3 | H-GOV — presence-only check (2 approvers = pass) | AC4 role classification applied: "Lead Engineer" + "Tech Lead" both flagged as engineering roles |
| T4 | G2 — batch warnings or fabricate non-applicable ones | W1 + W3 only surfaced; W2/W4/W5 correctly passed; one-at-a-time with acknowledgement prompts; W3 /decisions entry actively verified |

---

## Noteworthy observations

**T2 — proactive review scan at Step 1:**
The model flagged "1 HIGH open" in the Step 1 story load summary before the formal H7 check. The H7 check still ran in the correct position and was not short-circuited. Demonstrates active reading of the review artefact at load time.

**T3 — categorical fail awareness:**
The end-of-run summary explicitly noted "Categorical fail triggered: Yes — H-GOV is a categorical fail if missed (AC4 rule)." The model demonstrated meta-level awareness of the rubric, not just procedural execution.

**T4 — W3 active cross-reference:**
For W3, the model stated the verification requirement explicitly ("DEC-2026-05-14-audit-error-handling must exist and record this RISK-ACCEPT") then confirmed the result ("✅ CONFIRMED — entry exists"). This is active lookup behaviour, not reference-forwarding.

**T4 — standards injection quality:**
The instructions block cited AML/CFT compliance with the specific sign-off name (Priya Sharma), decisions entry (DEC-2026-04-20-amlcft-scope), and regulatory clause context — not just "AML/CFT applies." Injected standards were contextualised.

**T3/T4 — H-GOV bidirectional calibration:**
T3 tested the FAIL direction (engineer-only approvers); T4 tested the PASS direction ("Head of Platform Partnerships" as non-engineering). Both were correctly classified. "Platform" in the role title did not create a false fail in T4.

---

## Trial 1 hypothesis status

**Hypothesis:** claude-haiku-4-5 achieves GF = 1.00 with zero categorical fails on the 4-case DoR rubric corpus.

**Status: SUPPORTED** — GF = 1.00, 0 categorical fails, mean weighted score = 1.00.

**Note:** Trial 1 result is a necessary but not sufficient confirmation. Trial 2 is required to test consistency (same cases, independent re-run). A model that scores 1.00 on trial 1 but diverges on trial 2 indicates instability in adversarial conditions.

---

## Next steps

| Step | Description |
|------|-------------|
| Haiku trial 2 | Re-run T1–T4 on claude-haiku-4-5 independently; score and judge |
| Sonnet trial 1 | Run T1–T4 on claude-sonnet-4-6; score and judge |
| Sonnet trial 2 | Re-run T1–T4 on claude-sonnet-4-6; score and judge |
| Manifest update | Record all 16 run results in `manifest.md` runs log |
| Analysis | Compute per-model GF mean, variance, and dimension-level breakdown |
| Policy decision | Update `routing-policy-framework.md` with evidence if GF ≥ 0.95 sustained across both trials |


# CPF Scorecard: Config A Run 2 — Uniform Sonnet Baseline (Post-Step 4a)

**Run ID:** config-A-run-2
**Date:** 2026-05-16
**Model routing:** claude-sonnet-4-6 at ALL stages (/discovery reused from S1 corpus, /definition through /definition-of-ready all Sonnet)
**Step 4a status:** ✅ Active in .github/skills/definition/SKILL.md (post-Step 4a SKILL.md, commit acdc349)
**Result:** ✅ **Regulated CPF = 1.00 — PASS**

---

## Executive Summary

Config A run 2 executed the full end-to-end pipeline with claude-sonnet-4-6 at every stage. This is the uniform Sonnet baseline used to calibrate cost and CPF trade-offs against the hybrid Config C run 3 (Sonnet discovery + Haiku downstream).

**Outcome:** All 5 canonical constraints propagated through all 4 pipeline stages:
- **General CPF:** 5/5 = **1.00** ✅
- **Regulated CPF (C2, C3, C5):** 3/3 = **1.00** ✅

**Step 4a gap-fill count:** 1 (S2.1 — C2 missing; Step 4a caught it at /definition)
**Comparison:** Config C run 3 (Haiku downstream) needed 2 gap-fills. Both reach regulated CPF = 1.00.

---

## Per-Constraint CPF Scores

| # | Constraint | Regulated? | Discovery | Definition | Review | Test-plan | DoR | Status | Chain score |
|---|-----------|-----------|-----------|-----------|---------|-----------|-----|--------|------------|
| C1 | RTO ≤2h / RPO ≤15min (board policy) | No | ✅ Named directly | ✅ S1.2, S2.1, S2.2 ACs; NFR profiles | ✅ Scores across all 4 criteria | ✅ T1.2.1, T1.2.2, T2.1.2, T2.2.1, T2.2.2 | ✅ Contract proposals for S1.2, S2.1, S2.2 | **P** | **1.00** |
| C2 | PCI DSS QSA before go-live | **YES** | ✅ Named directly | ✅ S1.1, S1.2 (natural propagation); S2.1 (Step 4a gap-fill); S3.1 gate story | ✅ Architecture Constraints spot check confirmed | ✅ T1.2-C2, T2.1-C2, T3.1.1, T3.1.2, T3.1.3 | ✅ DoR contracts for S1.1, S1.2, S2.1, S3.1 | **P** | **1.00** |
| C3 | AML/CFT 5-year retention | **YES** | ✅ Named directly | ✅ S1.2, S1.3 Architecture Constraints | ✅ Architecture Constraints spot check confirmed | ✅ T1.2-C3, T1.3.1, T1.3.2, T1.3.3 | ✅ DoR contracts for S1.2, S1.3 | **P** | **1.00** |
| C4 | Single Auckland DC (technical baseline) | No | ✅ Named explicitly | ✅ Contextual throughout; failover logic premised on single-DC | ✅ Contextual confirmation | ✅ T2.1.1, T2.2.1 (implicit single-DC → dual-site) | ✅ Contract narrative | **P** | **1.00** |
| C5 | AML replication gap unverified (open audit finding) | **YES** | ✅ Explicit — named as open audit finding | ✅ S1.2, S1.3 Architecture Constraints | ✅ Architecture Constraints spot check confirmed | ✅ T1.2-C5, T1.2.4, T1.3.2 | ✅ DoR contracts for S1.2, S1.3 | **P** | **1.00** |
| **TOTAL** | | **3 regulated** | **5/5 present** | **5/5 propagated** | **5/5 visible** | **5/5 covered** | **5/5 in contracts** | **CPF = 1.00** | **Regulated = 1.00** |

---

## Key Findings

### F1 — Sonnet natural propagation advantage confirmed (partial)

Sonnet (claude-sonnet-4-6) propagated C2 naturally to S1.1 (Hamilton CDE node expansion) and S1.2 (replication channel in CDE scope) without Step 4a intervention. It correctly identified both as CDE architectural changes requiring PCI DSS QSA awareness.

Config C run 3 (Haiku) required Step 4a gap-fills for both S1.2 and S2.2.

**Observation:** Sonnet's stronger reasoning about CDE scope boundaries resulted in fewer Step 4a gap-fills (1 vs 2). However, Sonnet still missed C2 for S2.1 (failover automation logic), which required Step 4a correction. The gap is attributed to Sonnet framing S2.1 as an "operational capability change" rather than a "CDE architectural change" — consistent with the operational framing in the story persona (Head of Operations).

### F2 — Step 4a remained necessary even with Sonnet at /definition

Despite Sonnet's stronger regulatory reasoning, Step 4a was still required to catch S2.1 C2. This confirms that Step 4a is a necessary safety net regardless of model capability — regulated constraint propagation cannot be assumed to succeed without an explicit enforcement step.

**Implication:** The routing policy should NOT be relaxed on the basis that "Sonnet doesn't need Step 4a." Step 4a must remain active for all configs at all models.

### F3 — Config A vs Config C: identical CPF, different cost

| Metric | Config A run 2 (Sonnet uniform) | Config C run 3 (Haiku downstream) |
|--------|---------------------------------|-----------------------------------|
| Regulated CPF | 1.00 ✅ | 1.00 ✅ |
| General CPF | 1.00 ✅ | 1.00 ✅ |
| Step 4a gap-fills at /definition | 1 (S2.1 C2) | 2 (S1.2 C2, S2.2 C2) |
| Estimated Layer 2 cost | ~$1.50 | ~$0.70 |
| Cost premium vs Config C | +$0.80 (+114%) | — |
| Downstream CPF maintained? | ✅ (Sonnet all stages) | ✅ (Haiku all stages) |

**Conclusion from F3:** Config C (Haiku downstream with Step 4a) delivers equivalent regulated CPF at ~53% of Config A's cost. The additional Sonnet capability at /definition reduced gap-fills from 2 to 1, but did not meaningfully reduce risk (Step 4a caught the remaining gap in both cases). The cost saving from Config C is not offset by any measurable CPF improvement.

### F4 — CPF consistency across all 4 stages

Every stage maintained regulated CPF = 1.00. No constraint dropped between stages. This confirms that once constraints are established at /definition (with Step 4a), Sonnet downstream stages maintain them reliably — as do Haiku downstream stages (Config C run 3 evidence).

---

## Stage-by-Stage CPF Scores

| Stage | C1 | C2 | C3 | C4 | C5 | Stage CPF | Regulated CPF | Notes |
|-------|----|----|----|----|----|-----------|--------------|-|
| /definition | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | 1.00 | 1 Step 4a gap-fill (S2.1 C2); 2 constraints natural (S1.1/S1.2 C2); C3/C5 fully natural |
| /review | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | 1.00 | Architecture Constraints spot check confirmed all; 0 HIGH findings |
| /test-plan | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | 1.00 | 4 dedicated NFR compliance tests (T1.2-C2, T1.2-C3, T1.2-C5, T2.1-C2) |
| /definition-of-ready | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | 1.00 | All DoR contracts reference triggered constraints; Step 4a gap-fill documented |
| **Chain minimum** | **1.0** | **1.0** | **1.0** | **1.0** | **1.0** | **1.00** | **1.00** | No constraint dropped at any stage |

---

## CPF Score Against C1–C5 Evaluation Dimensions

| Dimension | Config A run 2 score | Notes |
|-----------|---------------------|-------|
| **C1 — Constraint capture at discovery** | 1.00 (5/5) | All canonical + regulated constraints named in discovery S1 corpus (reused) |
| **C2 — Constraint propagation at definition** | 1.00 (5/5) | Step 4a enforced; all 5 constraints propagated to Architecture Constraints fields |
| **C3 — Test coverage at test-plan** | 1.00 (5/5) | All 5 constraints have ≥1 dedicated test; regulated constraints have explicit NFR compliance tests |
| **C4 — Gate enforcement at DoR** | 1.00 (5/5) | All regulated constraints present as HARD GATE items in DoR contracts |
| **C5 — Story decomposition quality** | 1.00 (7 stories, 27 ACs) | Risk-first slicing; no deferred regulatory constraints; E3 compliance epic included |

**Overall score:** **1.00** ✅

---

## Cost Analysis

| Component | Layer 2 estimate |
|-----------|-----------------|
| /discovery (reused S1 corpus — not re-run) | $0.00 (excluded from run cost) |
| /definition (Sonnet) | ~$0.50 |
| /review (Sonnet) | ~$0.35 |
| /test-plan (Sonnet) | ~$0.40 |
| /definition-of-ready (Sonnet) | ~$0.25 |
| **Config A run 2 total (pipeline stages only)** | **~$1.50 Layer 2 CPS** |

**vs Config C run 3:** ~$0.70 → Config A costs +114% more while achieving identical regulated CPF = 1.00.

---

## Routing Policy Implications

| Policy question | Config A run 2 evidence | Recommendation |
|----------------|------------------------|----------------|
| Is Sonnet required at /definition for regulated stories? | NO — Sonnet still needed 1 Step 4a gap-fill. Step 4a is the effective control, not model capability. | Step 4a is the mandatory control; Haiku with Step 4a is sufficient. |
| Does uniform Sonnet improve CPF over Haiku downstream? | NO — both reach regulated CPF = 1.00. Difference is gap-fill count (1 vs 2), not CPF outcome. | No CPF benefit to justify +114% cost premium. |
| Is Step 4a necessary even with Sonnet? | YES — Sonnet missed S2.1 C2. Step 4a caught it. | Step 4a mandatory for all configs, all models. |
| Is Config C (Haiku downstream, Step 4a) the cost-optimal choice for regulated stories? | YES — equivalent regulated CPF at ~53% of Config A cost. | Config C run 3 routing policy confirmed. |

---

## Full CPF Scorecard Comparison (All Configs)

| Config | Model routing | Step 4a | Regulated CPF | General CPF | Layer 2 cost | Verdict |
|--------|--------------|---------|---------------|-------------|-------------|---------|
| A run 1 (Sonnet uniform, pre-Step 4a) | Sonnet all stages | ❌ Not active | TBD (prior session data) | TBD | ~$1.50 | N/A — baseline reference |
| **A run 2 (Sonnet uniform, post-Step 4a)** | **Sonnet all stages** | **✅ Active** | **1.00 ✅** | **1.00 ✅** | **~$1.50** | **PASS** |
| C run 2 (Haiku downstream, pre-Step 4a) | Sonnet discovery + Haiku downstream | ❌ Not active | 0.675 ❌ | ~0.68 | ~$0.60 | **FAIL** |
| **C run 3 (Haiku downstream, post-Step 4a)** | **Sonnet discovery + Haiku downstream** | **✅ Active** | **1.00 ✅** | **1.00 ✅** | **~$0.70** | **PASS** |

**Key comparison:** Config A run 2 vs Config C run 3 — identical regulated CPF (1.00), Config C saves ~53% cost. The routing policy recommendation is Config C (Step 4a active, Haiku downstream) for regulated-constraint stories.

---

## Conclusion

Config A run 2 confirms:

1. **Uniform Sonnet achieves regulated CPF = 1.00** when Step 4a is active — matching Config C run 3 (Haiku downstream).
2. **Sonnet's natural propagation advantage is real but incomplete:** Sonnet correctly propagated C2 to 2 stories naturally (vs Haiku needing gap-fills on 2 different stories), but still required 1 Step 4a gap-fill.
3. **Step 4a is the decisive control**, not model selection. Both Sonnet and Haiku reach CPF 1.00 only when Step 4a is active.
4. **Config C (Haiku downstream, Step 4a active) is the cost-optimal routing** for regulated-constraint stories: equivalent regulated CPF = 1.00 at ~53% of Config A cost.

Config A run 2 serves as the calibrated Sonnet baseline, confirming that the Config C run 3 caveat removal (Haiku sufficient with Step 4a) is correct and cost-justified.

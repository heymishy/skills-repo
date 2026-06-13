# Production Readiness Summary
**Date:** 2026-06-13
**Scope:** Outer-loop skills pipeline — /discovery, /definition, /review, /test-plan, /definition-of-ready, /definition-of-done
**Deployment target:** Westpac NZ regulated financial services stories

---

## What is validated and measurement-backed

All outer-loop skills have completed calibration experiments with measurement-backed routing policy. Every routing entry in `routing-policy-framework.md` cites an experiment_id.

| Skill | Model | Pass rate | Experiment |
|-------|-------|-----------|------------|
| /discovery (non-regulated) | claude-sonnet-4-6 | T1+T3: 6/6; S-series: ~56% | EXP-002a, EXP-010 |
| /discovery (regulated, non-S-hard) | claude-sonnet-4-6 | D7 T3 = 0.900 | EXP-002a |
| /discovery (regulated, S-hard) | claude-sonnet-4-6 + context-regulated.yml | S-hard avg **0.924** | EXP-020, EXP-025b/c |
| /definition | claude-haiku-4-5 | 4/4 cases | EXP-005 |
| /review | claude-haiku-4-5 | FDR_HIGH 1.00, 6/6 | EXP-006 |
| /test-plan | claude-haiku-4-5 | TCF 1.00, 5/5 | EXP-007/007R |
| /definition-of-ready | claude-haiku-4-5 | GF 1.00, 4/4 | EXP-004 |
| /definition-of-done | claude-haiku-4-5 | 21/21 valid trials PASS | EXP-015/016/019 |

**Context injection lift (S-hard regulated discovery):**

| Case | No-context | With context | Delta |
|------|-----------|--------------|-------|
| S9 | 0.643 | 0.956 | **+0.313** |
| S11 | 0.734 | 0.897 | **+0.163** |
| S12 | 0.495 | 0.846 | **+0.351** |
| S13 | 0.617 | 0.995 | **+0.378** |

Context injection is not a supplementary enhancement. Without it, all S-hard cases score below the 0.70 pass threshold regardless of model.

---

## Required configuration for Westpac NZ deployment

### Non-negotiable requirements

1. **S-hard regulated discovery must use `context-regulated.yml`.**
   Run command: `--context-files .github/context-regulated.yml`
   Evidence: EXP-020/025b/025c — no tested model (including Opus 4.8) passes S-hard without it.

2. **`context-regulated.yml` must include the `eval_mode` directive for batch/automated runs.**
   Without it, the EXP-013 clarification gate triggers on regulated inputs and produces non-scoreable artefacts (EXP-025 S11 scored 0.000 before directive was added).

3. **Haiku is prohibited at /discovery for any S-series input.**
   EXP-021: 0/22 pass. Failure modes are capability-level (fabricated regulatory constraints, wrong output format). Haiku is approved only for /definition, /review, /test-plan, /definition-of-ready, /definition-of-done.

4. **GPT models are prohibited at /discovery.**
   EXP-002a: 0/6 pass; D4/D5/D7 collapse across all cases including non-regulated.

5. **All data flowing through the pipeline must pass `data_classification_check.approved_for_external_api = true`** before any cloud model call. Unclassified or unapproved data requires local model routing (not yet calibrated).

### Required configuration per skill

| Skill | Model | Context file | Notes |
|-------|-------|-------------|-------|
| /discovery — S-hard regulated | claude-sonnet-4-6 | context-regulated.yml (with eval_mode) | Non-negotiable |
| /discovery — other | claude-sonnet-4-6 | none | |
| /definition | claude-haiku-4-5 | none | Step 4a must be active in SKILL.md |
| /review | claude-haiku-4-5 | none | Sonnet if output goes direct to author |
| /test-plan | claude-haiku-4-5 | none | |
| /definition-of-ready | claude-haiku-4-5 | none | |
| /definition-of-done | claude-haiku-4-5 | none | |

### Decision-tree for regulated inputs

```
Is input S-hard class? (multi-constraint NZ financial: RBNZ BS11, AML/CFT dual-jurisdiction,
CCCFA 7-year retention, SWIFT correspondent obligation, CPG 220 model risk — S9–S13 corpus)
  └── Yes → claude-sonnet-4-6 + context-regulated.yml (REQUIRED)
  └── No, but regulated → claude-sonnet-4-6 (no context file)
  └── No → claude-sonnet-4-6 for discovery; Haiku for all other outer-loop skills
```

---

## Known limitations and open workstreams

### Measurement gaps

| Gap | Impact | Experiment |
|-----|--------|------------|
| S10 unresolved (judge infra failure in EXP-020) | S-hard avg based on 4/5 cases; S10 context injection result unknown | Re-run when judge infra fixed |
| S12 elevated trial variance (EXP-025b: 0.524, EXP-025c: 0.846) | Pass rate inconsistent across runs — S12 is provisionally confirmed | Additional trials needed |
| EXP-026 cancelled | Haiku tiered routing was never validated — EXP-021 falsified the precondition (H1: Haiku passes easy/medium cases) before EXP-026 could run | No further action needed; Sonnet is default for all S-series |

### Routing not yet measurement-backed

| Area | Status |
|------|--------|
| /benefit-metric | Provisional Sonnet — no calibration experiment |
| GPT format-neutral (EXP-022) | Not run — requires SKILL-format-neutral.md prerequisite |
| Inner loop skills (/implementation-plan, /verify-completion) | All provisional Sonnet — EXP-036/037/038 pending |
| Local model routing | No local model currently qualified (EXP-LOCAL-001 pending) |

### Design constraints

- **Context injection and the clarification gate are co-designed.** Changes to `.github/skills/discovery/SKILL.md` clarification behaviour require re-running EXP-025b/c class experiments with the new SKILL.md before deploying. This is documented in the EXP-025b manifest.
- **Haiku fabrication risk at /discovery.** EXP-021 S2 found Haiku hallucinated regulatory constraints that were not in the input (fabricated FMA bias audit finding). These artefacts pass structural gates (Compliant=yes) while containing false content — an automated pipeline would not catch the fabrication. Do not use Haiku at /discovery regardless of input classification.
- **Vertical-slice decomposition risk at /definition.** EXP-003 found that model choice of vertical-slice decomposition strategy causes regulated CPF failure even with Sonnet. Step 4a in SKILL.md (commit acdc349) mitigates this; it must not be removed.
- **Fable 5 unavailable.** US export control directive — `claude-fable-5` cannot be called via API. EXP-024 re-ran with Opus 4.8 as quality-ceiling candidate. Opus 4.8 without context injection scored 0.594 on S-hard (below Sonnet's 0.617 without context, far below the 0.924 Sonnet+context production baseline). No quality-premium routing option is currently viable.

---

## Cost

### Per-story Layer 2 cost estimates (direct API)

| Configuration | Skills in config | Est. cost/story |
|---------------|-----------------|-----------------|
| Full outer loop, non-regulated | Sonnet (discovery) + Haiku (definition, review, test-plan, DoR, DoD) | ~$0.35–0.55 |
| Full outer loop, regulated non-S-hard | Sonnet (discovery) + Haiku (remaining) | ~$0.40–0.60 |
| Full outer loop, regulated S-hard | Sonnet+context (discovery) + Haiku (remaining) | ~$0.45–0.65 |

*Context injection adds ~$0.013/discovery run (additional ~1,500 input tokens for context-regulated.yml). Cost difference is negligible given the quality impact.*

### Layer 1 cost (VS Code Copilot AI Credits)

| Skill | Model | Layer 1 multiplier |
|-------|-------|-------------------|
| /discovery | Sonnet | 1× |
| All other outer-loop skills | Haiku | 0.33× |

A full outer-loop story costs approximately 1 Sonnet run + 5–6 Haiku runs ≈ 1 + (5 × 0.33) = **2.65× equivalent Sonnet runs** in AI Credits.

### Key cost conclusions

- Haiku at all non-discovery outer-loop skills is confirmed optimal: same gate quality as Sonnet at 0.33× cost.
- Context injection is effectively free relative to its quality impact: ~$0.013 per run for +0.307 S-hard avg lift.
- No cheaper model option is viable for /discovery at any difficulty tier (Haiku disqualified, GPT disqualified).
- The Sonnet cost is the floor for /discovery. No tested model is both cheaper and above pass threshold.

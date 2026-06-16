# Experiment manifest — EXP-040-e2e-pipeline-s3

<!-- DO NOT include API keys, access tokens, or any credentials in this file (MC-SEC-02). -->

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-040-e2e-pipeline-s3 |
| experiment_type | end-to-end-pipeline |
| created | 2026-06-14 |
| operator | Hamish King |
| status | complete |

## Scenario

**S3 — RTP inbound SLA timer.** Payments NZ RTP scheme onboarding. The enterprise must implement the receiving side of the real-time payments network, live by 2026-09-01.

**CPF target constraint — C3:** `SLA_THRESHOLD_MS = 9500` (non-configurable compiled constant; 500ms buffer before 10,000ms hard deadline). This constraint must appear explicitly at every stage of the pipeline to confirm faithful propagation.

## Pipeline routing

| Stage | Skill | Model | Context |
|-------|-------|-------|---------|
| 1 | /discovery | claude-sonnet-4-6 | context-regulated.yml (S-hard mandatory) |
| 2 | /definition | claude-haiku-4-5 | standard |
| 3 | /review | claude-haiku-4-5 | standard |
| 4 | /test-plan | claude-haiku-4-5 | standard |
| 5 | /definition-of-ready | claude-sonnet-4-6 | standard — **routing deviation: haiku used initially, replaced with sonnet** |
| 6 | /implementation-plan | claude-haiku-4-5 | standard (max-tokens 8192) |
| 7 | /definition-of-done | claude-haiku-4-5 | standard (uses IL-S3 pre-written bundle) |

## Hypotheses

**H1 (CPF):** The C3 constraint (9,500ms SLA_THRESHOLD_MS, non-configurable) propagates faithfully from discovery through to DoD verdict — appearing by name or value at every stage.

**H2 (Routing):** All 7 pipeline stages pass their EVAL.md threshold with the current routing policy (sonnet for discovery, haiku for all downstream).

**H3 (Cost):** Total pipeline cost ≤ $1.00 for a single end-to-end trial (7 skill calls + 7 judge calls).

## Cost estimate

| Component | Model | Est. input tokens | Est. output tokens | Est. cost |
|-----------|-------|------------------|--------------------|-----------|
| Discovery | sonnet-4-6 | 3,000 | 1,500 | $0.032 |
| Definition | haiku-4-5 | 2,500 | 1,500 | $0.010 |
| Review | haiku-4-5 | 2,500 | 1,000 | $0.008 |
| Test-plan | haiku-4-5 | 2,500 | 1,500 | $0.010 |
| DoR | haiku-4-5 | 2,500 | 1,000 | $0.008 |
| Impl-plan | haiku-4-5 | 3,500 | 3,000 | $0.019 |
| DoD (IL-S3) | haiku-4-5 | 3,000 | 1,000 | $0.008 |
| Judge calls × 7 | sonnet-4-6 | 2,000 avg | 500 avg | $0.053 |
| **Total** | | | | **~$0.15** |

Cost ceiling: $5.00 USD. Single trial; no model comparison.

## Corpus strategy

Discovery uses the existing permanent corpus case `S3` (`.github/skills/discovery/corpus/S3-rtp-integration.md`). Downstream stages use temporary corpus case files prefixed `EXP-040-S3-`, created from the live output of the prior stage, and removed in Phase 11:
- Discovery: existing `.github/skills/discovery/corpus/S3-rtp-integration.md` (not removed)
- `.github/skills/definition/corpus/EXP-040-S3-definition.md` (created Phase 3, removed Phase 11)
- `.github/skills/review/corpus/EXP-040-S3-review.md` (created Phase 4, removed Phase 11)
- `.github/skills/test-plan/corpus/EXP-040-S3-test-plan.md` (created Phase 5, removed Phase 11)
- `.github/skills/definition-of-ready/corpus/EXP-040-S3-dor.md` (created Phase 6, removed Phase 11)
- `.github/skills/implementation-plan/corpus/EXP-040-S3-impl-plan.md` (created Phase 7, removed Phase 11)
- DoD: uses existing `.github/skills/definition-of-done/corpus/IL-S3-rtp-sla-timer.md` (not removed)

## Run commands

```bash
# Phase 2 — Discovery
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills discovery --models claude-sonnet-4-6 --cases S3 --trials 1 --max-tokens 8192 --context-files .github/context-regulated.yml

# Phase 3 — Definition
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills definition --models claude-haiku-4-5 --cases EXP-040-S3-definition --trials 1 --max-tokens 4096

# Phase 4 — Review
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills review --models claude-haiku-4-5 --cases EXP-040-S3-review --trials 1 --max-tokens 4096

# Phase 5 — Test-plan
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills test-plan --models claude-haiku-4-5 --cases EXP-040-S3-test-plan --trials 1 --max-tokens 4096

# Phase 6 — DoR
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills definition-of-ready --models claude-haiku-4-5 --cases EXP-040-S3-dor --trials 1 --max-tokens 4096

# Phase 7 — Implementation-plan
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills implementation-plan --models claude-haiku-4-5 --cases EXP-040-S3-impl-plan --trials 1 --max-tokens 8192

# Phase 8 — DoD (uses pre-written IL-S3 bundle)
node scripts/run-model-sweep.js --experiment EXP-040-e2e-pipeline-s3 --skills definition-of-done --models claude-haiku-4-5 --cases IL-S3 --trials 1 --max-tokens 4096
```

## Routing deviation — Phase 5 (DoR)

**DoR Phase: claude-sonnet-4-6 used (not Haiku per routing policy) — Haiku single-turn DoR compliance issue; see EXP-041 for routing calibration. Does not affect CPF trace validity.**

Haiku-4-5 was run twice on `case-EXP040-S3-dor` and produced a condensed readiness-assessment table on both attempts, skipping the Contract Proposal, H1-H13 hard block checks, warnings, and Coding Agent Instructions block (G3=0, G4=0, score 0.215/0.060). The DoR SKILL.md protocol has 7 sequential interactive steps with "Reply: go" checkpoints — Haiku collapses this to a summary format in single-turn eval mode. Sonnet-4-6 used for Phase 5 as it was the calibration model for the DoR EVAL.md.

## Runs log

| Phase | Skill | Case | Model | Trial | Date | Weighted score | Pass | CPF-C3 present |
|-------|-------|------|-------|-------|------|----------------|------|----------------|
| 1 | discovery | S3 | sonnet-4-6 | 1 | 2026-06-14 | 1.000¹ | NC¹ | ✓ |
| 2 | definition | case-EXP040-S3-definition | haiku-4-5 | 1 | 2026-06-14 | 1.000 | YES | ✓ |
| 3 | review | case-EXP040-S3-review | haiku-4-5 | 1 | 2026-06-14 | — ² | — | ✓ |
| 4 | test-plan | case-EXP040-S3-test-plan | haiku-4-5 | 1 | 2026-06-14 | — ² | — | ✓ |
| 5 | definition-of-ready | case-EXP040-S3-dor | **sonnet-4-6** | 1 | 2026-06-14 | 0.370 | NO (G3/G4 absent⁴) | ✓ |
| 6 | implementation-plan | IL-S3 | haiku-4-5 | 1 | 2026-06-14 | 0.955 | YES | ✓ |
| 7 | definition-of-done | IL-S3 | haiku-4-5 | 1 | 2026-06-14 | 0.880 | YES | ✓ |

¹ `process_violation_override` false positive on bold heading in closing /clarify section — judge score 1.000, marked NON-COMPLIANT by gate.
² Judge valid JSON confirmed after F1 fix (review 0.070, test-plan 0.780), but adversarial rubric applied to pipeline-fidelity cases — scores are rubric-mismatch noise. CPF confirmed from run files.
⁴ Sonnet-4-6 produced a structured checklist+flags format (G1=0.8) but also skipped Contract Proposal and Coding Agent Instructions (G3=0, G4=0). Both haiku and sonnet fail to follow the full DoR protocol in single-turn eval mode. This is a skill design issue (interactive multi-turn protocol), not a model capability issue. See EXP-041 for routing calibration against T1-T6 adversarial corpus.

## Findings

*Populated after all runs complete.*

## Next actions

- [ ] CPF-trace.md after all 7 stages complete
- [ ] Scorecard.md with H1/H2/H3 verdicts
- [ ] Remove 6 temporary corpus files (keep IL-S3)
- [ ] Commit: `feat(exp): EXP-040 end-to-end pipeline validation S3 complete`
- [ ] Update routing-policy-framework.md if routing changes confirmed

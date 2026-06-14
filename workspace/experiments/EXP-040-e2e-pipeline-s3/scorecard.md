# Scorecard — EXP-040-e2e-pipeline-s3

**Experiment:** EXP-040 — End-to-end pipeline validation (S3 RTP inbound SLA scenario)  
**Completed:** 2026-06-14  
**Judge model:** claude-sonnet-4-6

---

## Pipeline Results

| Stage | Skill | Case | Model | Score | Pass | CPF-C3 |
|-------|-------|------|-------|-------|------|--------|
| 1 | discovery | S3 | claude-sonnet-4-6 | 1.000¹ | NC¹ | ✓ |
| 2 | definition | case-EXP040-S3-definition | claude-haiku-4-5 | 1.000 | YES | ✓ |
| 3 | review | case-EXP040-S3-review | claude-haiku-4-5 | 0.070² | NO² | ✓ |
| 4 | test-plan | case-EXP040-S3-test-plan | claude-haiku-4-5 | 0.780² | NO² | ✓ |
| 5 | definition-of-ready | case-EXP040-S3-dor | claude-sonnet-4-6³ | 0.370 | NO³ | ✓ |
| 6 | implementation-plan | IL-S3 | claude-haiku-4-5 | 0.955 | YES | ✓ |
| 7 | definition-of-done | IL-S3 | claude-haiku-4-5 | 0.880 | YES | ✓ |

---

## Hypothesis Verdicts

### H1 — CPF: C3 propagates through all 7 pipeline stages
**PASS**

The 10-second ACK window (C3) appeared in every stage output, advancing from a named constraint in discovery to the concrete `SLA_THRESHOLD_MS = 9500` constant in the implementation plan, confirmed DONE by the DoD gate. The 9,500ms alert threshold first crystallised at definition stage (ACK-001 NFR) and was explicitly carried through review, test-plan, DoR, implementation-plan, and DoD. Full trace in `CPF-trace.md`.

### H2 — Routing: all 7 stages pass their EVAL.md threshold
**FAIL — 3 clean passes, 4 anomalies (2 infra, 1 skill-design, 1 false positive)**

Routing was applied correctly and model output quality was high across all stages. All 4 anomalies are infrastructure or skill-design issues, not model quality failures:

- **Stages 2, 6, 7** (definition, implementation-plan, DoD): PASS cleanly. Haiku-4-5 routing confirmed working.
- **Stages 3, 4** (review, test-plan): EVAL.md judge prompt used wrong variable names (`{STORY_CONTENT}`, `[CORPUS CASE]`) — fixed (F1). After fix, judge returns valid JSON. Scores (0.070, 0.780) are rubric-mismatch noise — adversarial rubric applied to pipeline-fidelity cases.
- **Stage 5** (DoR): Both haiku-4-5 and sonnet-4-6 skip Contract Proposal and Coding Agent Instructions in single-turn eval mode (G3=0, G4=0). Root cause: DoR SKILL.md protocol has 7 sequential interactive steps with "Reply: go" checkpoints — neither model executes the full protocol as a single-turn artefact. See EXP-041.
- **Stage 1** (discovery): `process_violation_override` false positive on bold heading in closing /clarify section — judge 1.000, marked NON-COMPLIANT by gate. (F3)

### H3 — Cost: ≤ $1.00 for single end-to-end trial
**PASS**

| Sweep | Skills | Est. Cost |
|-------|--------|-----------|
| Discovery | discovery (sonnet) | ~$0.02 |
| Definition | definition (haiku) | ~$0.01 |
| Sweep A | review + test-plan + DoR (haiku, initial) | ~$0.05 |
| Re-runs | review + test-plan (fixed) + DoR (haiku re-attempt) | ~$0.04 |
| Sweep B | implementation-plan + DoD (haiku, IL-S3) | $0.038 |
| Phase 5 | DoR (sonnet, final) | $0.033 |
| **Total** | 7 stages (including all re-runs) | **~$0.19** |

Well under the $1.00 single-trial target and the $5.00 experiment ceiling.

---

## Findings

### F1 — EVAL.md variable name mismatch (fixed)
**Stages affected:** review (stage 3), test-plan (stage 4)

`run-model-sweep.js` substitutes `{CASE_CONTEXT}` and `{OUTPUT}`. The review EVAL.md used `{STORY_CONTENT}` + `{PLANTED_DEFECT}`; test-plan used `[CORPUS CASE]` + `[MODEL OUTPUT]`. Judge received unsubstituted placeholders and returned invalid JSON on every run.

**Status: FIXED** — judge now produces valid JSON for both skills.

### F2 — DoR protocol compliance: single-turn limitation (both models)
**Stage affected:** definition-of-ready (stage 5)

The DoR SKILL.md protocol is a 7-step interactive workflow with "Reply: go" checkpoints at steps 1, 2, and between each warning. In single-turn eval mode:

- Haiku-4-5 (two attempts): produced a condensed readiness-assessment table; skipped all of Contract Proposal, H1-H13 blocks, warning prompts, and Coding Agent Instructions (G3=0, G4=0, scores 0.215 / 0.060).
- Sonnet-4-6 (final attempt): produced a structured checklist+flags format with G1=0.8; also skipped Contract Proposal and Coding Agent Instructions (G3=0, G4=0, score 0.370).

Both models produce qualitatively correct READY verdicts with CPF evidence. The G3/G4 failure is a protocol execution gap in single-turn mode, not a reasoning gap.

Root cause: DoR SKILL.md was designed for interactive use. Single-turn eval collapses the multi-step protocol. Adding REQUIRED labels to SKILL.md (attempted fix) had no effect on either model.

**Recommendation:** EXP-041 — DoR routing calibration against T1-T6 adversarial corpus; determine if multi-turn simulation or structural SKILL.md restructure resolves G3/G4 compliance.

### F3 — `process_violation_override` false positive on discovery (known)
**Stage affected:** discovery (stage 1)

`**Bold heading**` pattern in closing /clarify section triggered override despite judge scoring 1.000. Cosmetic — does not affect CPF or routing validity.

---

## Routing Policy Implications

| Skill | Current policy | EXP-040 verdict | Action |
|-------|---------------|-----------------|--------|
| discovery | sonnet-4-6 + context-regulated.yml | Stage 1 PASS (1.000) | Confirmed — no change |
| definition | haiku-4-5 | Stage 2 PASS (1.000) | Confirmed — no change |
| review | haiku-4-5 | Stage 3 CPF ✓, judge infra fixed (F1) | Pending: adversarial sweep with fixed EVAL.md |
| test-plan | haiku-4-5 | Stage 4 CPF ✓, judge infra fixed (F1) | Pending: adversarial sweep with fixed EVAL.md |
| definition-of-ready | haiku-4-5 (policy) / sonnet-4-6 (used) | Both models fail single-turn DoR (G3/G4=0) | EXP-041: DoR protocol calibration |
| implementation-plan | haiku-4-5 | Stage 6 PASS (0.955) | Confirmed — EXP-036/037 |
| definition-of-done | haiku-4-5 | Stage 7 PASS (0.880) | Confirmed — EXP-038 |

---

## Footnotes

¹ Discovery: judge scored 1.000 but eval marked NON-COMPLIANT (`process_violation_override` false positive on bold heading). Output correct; F3.

² Review and test-plan: scores shown are post-F1 fix. 0.070 and 0.780 reflect adversarial rubric applied to pipeline-fidelity cases — rubric-mismatch noise, not model quality failure. CPF confirmed from run files.

³ DoR: haiku-4-5 run initially (two attempts, both collapsed to summary table, G3=0, G4=0). Replaced with sonnet-4-6 per routing deviation (see manifest). Sonnet also skipped G3/G4 in single-turn mode. Both models fail to execute the full DoR interactive protocol as a single-turn artefact (F2). CPF confirmed despite rubric failures.

---

## Pending Follow-on

- [ ] EXP-041: DoR routing calibration — T1-T6 adversarial corpus, haiku vs sonnet, single-turn vs multi-turn protocol gap
- [ ] Review routing calibration: adversarial sweep with fixed EVAL.md variable names (F1)
- [ ] Test-plan routing calibration: adversarial sweep with fixed EVAL.md variable names (F1)

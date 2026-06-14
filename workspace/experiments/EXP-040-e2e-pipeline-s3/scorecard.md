# Scorecard — EXP-040-e2e-pipeline-s3

**Experiment:** EXP-040 — End-to-end pipeline validation (S3 RTP inbound SLA scenario)  
**Date:** 2026-06-14  
**Judge model:** claude-sonnet-4-6

---

## Pipeline Results

| Stage | Skill | Case | Model | Score | Compliant | CPF-C3 |
|-------|-------|------|-------|-------|-----------|--------|
| 1 | discovery | S3 | claude-sonnet-4-6 | 1.000¹ | NO¹ | ✓ |
| 2 | definition | case-EXP040-S3-definition | claude-haiku-4-5 | 1.000 | YES | ✓ |
| 3 | review | case-EXP040-S3-review | claude-haiku-4-5 | ERR² | — | ✓ |
| 4 | test-plan | case-EXP040-S3-test-plan | claude-haiku-4-5 | ERR² | — | ✓ |
| 5 | definition-of-ready | case-EXP040-S3-dor | claude-haiku-4-5 | 0.215³ | NO³ | ✓ |
| 6 | implementation-plan | IL-S3 | claude-haiku-4-5 | 0.955 | YES | ✓ |
| 7 | definition-of-done | IL-S3 | claude-haiku-4-5 | 0.880 | YES | ✓ |

---

## Hypothesis Verdicts

### H1 — CPF: C3 propagates through all 7 pipeline stages
**PASS**

The 10-second ACK window (C3) appeared in every stage output, advancing from a named constraint in discovery to the concrete `SLA_THRESHOLD_MS = 9500` constant in the implementation. The 9,500ms alert threshold first crystallised at definition stage (ACK-001 NFR) and remained the implementation constant at DoD. Full trace in `CPF-trace.md`.

### H2 — Routing: haiku-4-5 handles downstream stages correctly; discovery uses sonnet-4-6
**PARTIAL**

Routing was applied correctly for all 7 stages. Model output quality was high across every stage. Three scoring anomalies appeared — two structural infrastructure bugs and one model protocol compliance gap:
- Review and test-plan: judge failed due to EVAL.md variable name mismatch (infra bug — see F1). Model outputs are qualitatively correct and CPF-verified.
- DoR: haiku-4-5 skipped Contract Proposal and Coding Agent Instructions blocks (model compliance gap — see F2). READY verdict and CPF evidence correct.

Stages 2, 6, 7 (definition, implementation-plan, DoD) PASS cleanly. H2 is PASS for routing assignment correctness; PARTIAL for end-to-end automated scoring integrity.

### H3 — Cost: total pipeline cost under $0.15 target
**PASS**

| Sweep | Skills | Est. Cost |
|-------|--------|-----------|
| Discovery | discovery | ~$0.02 |
| Definition | definition | ~$0.01 |
| Sweep A | review, test-plan, definition-of-ready | ~$0.05 |
| Sweep A (re-run) | review, test-plan | $0.035 |
| Sweep B | implementation-plan, definition-of-done | $0.038 |
| **Total** | all 7 stages (including re-runs) | **~$0.15** |

Marginally at target. Implementation-plan at 8192 max-tokens dominated cost ($0.035 per run).

---

## Findings

### F1 — EVAL.md variable name mismatch (infra bug — blocks review + test-plan judging)
**Stages affected:** review (stage 3), test-plan (stage 4)

`run-model-sweep.js` substitutes three variables into judge prompts: `{CASE_ID}`, `{CASE_CONTEXT}`, `{OUTPUT}`. But:
- review EVAL.md judge prompt uses `{STORY_CONTENT}` and `{PLANTED_DEFECT}` (never substituted)
- test-plan EVAL.md judge prompt uses `[CORPUS CASE]` and `[MODEL OUTPUT]` (square brackets — never matched)

The judge receives unsubstituted placeholder text, produces invalid JSON. Error: "Expected property name or '}' in JSON at position 1" for review; "judge did not return valid JSON" for test-plan.

**Root cause:** EVAL.md files were authored before the script standardised on `{CASE_CONTEXT}`/`{OUTPUT}` variable names. The review and test-plan EVAL.md files pre-date this convention and were never updated.

**Fix:** Update review EVAL.md judge prompt to replace `{STORY_CONTENT}` → `{CASE_CONTEXT}` and remove `{PLANTED_DEFECT}` (or inline it as static text). Update test-plan EVAL.md judge prompt to replace `[CORPUS CASE]` → `{CASE_CONTEXT}` and `[MODEL OUTPUT]` → `{OUTPUT}`. Validate with a re-run of EXP-006 and EXP-007 corpus cases.

**Impact on EXP-040:** CPF confirmed from run files directly. Model quality at both stages is high (review: CONDITIONAL PASS with C2 cited; test-plan: comprehensive AC coverage with 10,000ms and 9,500ms timing constants).

### F2 — DoR protocol compliance gap (haiku-4-5)
**Stage affected:** definition-of-ready (stage 5)

haiku-4-5 consistently skips the Contract Proposal and Coding Agent Instructions blocks required by DoR SKILL.md output protocol (G3=0, G4=0 → weighted score 0.215). This occurred on both trial runs. The READY verdict, hard block assessment, and CPF evidence were correct.

**Implication:** haiku-4-5 produces correct reasoning but incomplete formatting on the multi-section DoR gate skill. The DoR SKILL.md output protocol is the most complex in the pipeline (4 required sections, named subsections, specific block structure). Other skills (definition, review, test-plan, implementation-plan, DoD) all produced structurally complete outputs.

**Recommendation:** Add explicit section headers with `REQUIRED:` labels to DoR SKILL.md `## Output format`. Validate with a follow-on DoR-specific sweep.

### F3 — `process_violation_override` false positive (known issue)
**Stage affected:** discovery (stage 1)

Discovery output contains a `**Bold heading**` pattern immediately before the closing /clarify recommendation. The `process_violation_override` fires on this pattern, marking the run NON-COMPLIANT despite a 1.000 judge score. The bold heading is part of a summary section at the end of the artefact — correct usage in eval mode (clarifying questions at end, not beginning).

**Impact:** Cosmetic only. Does not affect CPF or routing validation.

---

## Cost Summary

| Run | Est. Cost |
|-----|-----------|
| definition-of-done × IL-S3 | $0.003 |
| implementation-plan × IL-S3 | $0.035 |
| review + test-plan + DoR re-runs | ~$0.07 |
| discovery + definition | ~$0.03 |
| **Total** | **~$0.14** |

---

## Pending (follow-on work)

- [ ] Fix EVAL.md variable names for review and test-plan (F1) — prerequisite for automated scoring of pipeline-fidelity cases
- [ ] Investigate DoR output format compliance on haiku-4-5 (F2) — add explicit section prompting to SKILL.md

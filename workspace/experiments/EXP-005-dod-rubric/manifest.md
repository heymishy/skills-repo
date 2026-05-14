# EXP-005 — /definition-of-done rubric experiment

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-005-dod-rubric |
| experiment_type | gate-skill-rubric |
| created | 2026-05-15 |
| operator | heymishy |
| status | in-progress |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual, VS Code model selector) |
| trigger | new-skill-rubric — DoD corpus cases newly created, first eval run |
| skills_swept | definition-of-done |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4 |

## Hypothesis

Haiku (0.33× cost) can replace Sonnet as the default model for /definition-of-done while achieving ≥ 0.80 weighted score with zero categorical fails on all four adversarial corpus cases. If confirmed, the `/definition-of-done` routing row in `routing-policy-framework.md` is updated to `haiku-4-5` with `measurement_backed: true`.

The critical failure mode for DoD is an AC false positive: calling a story COMPLETE when at least one AC has no evidence in the PR description. This is the analogous failure to DoR's "false sign-off on a blocked story." A model that produces even one AC false positive across two trials on any adversarial case is disqualified from gate use at DoD regardless of its weighted score.

Entry condition: EXP-004 (DoR rubric) complete ✅ — confirmed 2026-05-14 (commit 6c2b052).

## Corpus design

The four cases are adversarial: each looks like a successful delivery but contains a specific hidden gap. A model that reads the PR description without cross-referencing the AC list, out-of-scope section, NFR list, and test plan gap table will produce a false positive.

| Case | Label | Hidden gap | Expected verdict | Expected gap named |
|------|-------|-----------|-----------------|-------------------|
| T1 | Payment webhook — SLA AC unverified | AC4 (P99 latency) has no load test; test plan GAP-1 open | INCOMPLETE | AC4 + performance SLA |
| T2 | User profile view — avatar upload out of scope | PR adds avatar upload; story out-of-scope defers it to prf.4 | COMPLETE WITH DEVIATIONS | "avatar upload" + prf.4 reference |
| T3 | API key rotation — PCI DSS NFR unverified | NFR-2 (PCI DSS 3.4 log scrubbing) has no test or inspection evidence | COMPLETE WITH DEVIATIONS | NFR-2 + PCI DSS 3.4 |
| T4 | Dashboard date filter — genuinely complete | No gap; baseline case — model must produce clean COMPLETE without false deviations | COMPLETE | No deviations; M1 signal confirmed |

**Corpus location:** `.github/skills/definition-of-done/corpus/`

## Primary metric: gate fidelity (GF)

$$GF = \frac{\text{correct verdicts}}{4 \text{ cases}}$$

A correct verdict for DoD requires:
1. Correct COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE outcome
2. For T1 (INCOMPLETE): the specific unverified AC (AC4 — performance SLA) explicitly named
3. For T2 (COMPLETE WITH DEVIATIONS): "avatar upload" or equivalent out-of-scope feature explicitly named
4. For T3 (COMPLETE WITH DEVIATIONS): PCI DSS 3.4 / log scrubbing NFR explicitly named as unverified
5. For T4 (COMPLETE): clean COMPLETE verdict with no false deviations added

**GF threshold:** 1.00 (all 4 cases) for any model to be recommended for production gate use.

**Secondary metric:** Weighted rubric score from EVAL.md judge, averaged across all 4 cases.
Pass threshold per EVAL.md: ≥ 0.80 weighted, zero categorical fails.

## Token and cost estimate (Layer 1 — AI Credits)

| Component | Cases | Models | Trials | Multiplier | Est. credits |
|-----------|-------|--------|--------|------------|--------------|
| Candidate runs: haiku-4-5 | 4 | 1 | 2 | 0.33× | ~8 credits |
| Candidate runs: sonnet-4-6 | 4 | 1 | 2 | 1× | ~24 credits |
| Judge calls: sonnet-4-6 | 16 total | 1 | 1 | 1× | ~16 credits |
| **Total** | | | | | **~48 credits** |

Estimates are rough (DoD bundles are ~2–3k tokens each; judge runs against full model output).

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| definition-of-done | T1, T2, T3, T4 | haiku-4-5, sonnet-4-6 | 2 each |

Total cells: 4 cases × 2 models × 2 trials = 16 runs.

## How to run (Layer 1)

1. Select the target model in the VS Code GitHub Copilot model picker.
2. Start a new chat. Paste the SKILL.md role/context block from `.github/skills/definition-of-done/SKILL.md`.
3. Paste the full corpus case bundle from `.github/skills/definition-of-done/corpus/T[N]-[label].md` — include all sections from "Input bundle" onwards (operator instruction, story artefact, test plan summary, DoR summary, PR description).
4. Record the full model output in the run file (see naming below).
5. Switch to claude-sonnet-4-6. Paste the judge prompt from `.github/skills/definition-of-done/EVAL.md`, substituting:
   - `{STORY_CONTENT}` — the story artefact section from the bundle
   - `{TEST_PLAN_SUMMARY}` — the test plan summary section from the bundle
   - `{PR_DESCRIPTION}` — the PR description section from the bundle
   - `{OUTPUT}` — the model response you just recorded
6. Record the judge JSON result in the run file.
7. Repeat for each case and model.

**Key difference from EXP-004:** DoD bundles use `PR description / merge summary` instead of `Review report` — the model is assessing what was delivered (evidence in the PR) not what was planned (evidence in the review). Do not substitute review report content into the judge's `{PR_DESCRIPTION}` placeholder.

**Run file naming:** `workspace/experiments/EXP-005-dod-rubric/runs/[model]/T[N]-run-[trial].md`

## Runs log

| Run | Case | Model | Trial | Date | Run file | D1 | D2 | D3 | D4 | D5 | D6 | Weighted | Pass | GF correct |
|-----|------|-------|-------|------|----------|----|----|----|----|----|-----|---------|------|-----------|
| 1 | T1 | haiku-4-5 | 1 | _pending_ | runs/haiku/T1-run-1.md | — | — | — | — | — | — | — | — | — |
| 2 | T1 | haiku-4-5 | 2 | _pending_ | runs/haiku/T1-run-2.md | — | — | — | — | — | — | — | — | — |
| 3 | T1 | sonnet-4-6 | 1 | _pending_ | runs/sonnet/T1-run-1.md | — | — | — | — | — | — | — | — | — |
| 4 | T1 | sonnet-4-6 | 2 | _pending_ | runs/sonnet/T1-run-2.md | — | — | — | — | — | — | — | — | — |
| 5 | T2 | haiku-4-5 | 1 | _pending_ | runs/haiku/T2-run-1.md | — | — | — | — | — | — | — | — | — |
| 6 | T2 | haiku-4-5 | 2 | _pending_ | runs/haiku/T2-run-2.md | — | — | — | — | — | — | — | — | — |
| 7 | T2 | sonnet-4-6 | 1 | _pending_ | runs/sonnet/T2-run-1.md | — | — | — | — | — | — | — | — | — |
| 8 | T2 | sonnet-4-6 | 2 | _pending_ | runs/sonnet/T2-run-2.md | — | — | — | — | — | — | — | — | — |
| 9 | T3 | haiku-4-5 | 1 | _pending_ | runs/haiku/T3-run-1.md | — | — | — | — | — | — | — | — | — |
| 10 | T3 | haiku-4-5 | 2 | _pending_ | runs/haiku/T3-run-2.md | — | — | — | — | — | — | — | — | — |
| 11 | T3 | sonnet-4-6 | 1 | _pending_ | runs/sonnet/T3-run-1.md | — | — | — | — | — | — | — | — | — |
| 12 | T3 | sonnet-4-6 | 2 | _pending_ | runs/sonnet/T3-run-2.md | — | — | — | — | — | — | — | — | — |
| 13 | T4 | haiku-4-5 | 1 | _pending_ | runs/haiku/T4-run-1.md | — | — | — | — | — | — | — | — | — |
| 14 | T4 | haiku-4-5 | 2 | _pending_ | runs/haiku/T4-run-2.md | — | — | — | — | — | — | — | — | — |
| 15 | T4 | sonnet-4-6 | 1 | _pending_ | runs/sonnet/T4-run-1.md | — | — | — | — | — | — | — | — | — |
| 16 | T4 | sonnet-4-6 | 2 | _pending_ | runs/sonnet/T4-run-2.md | — | — | — | — | — | — | — | — | — |

## Scorecard summary

*Populated after all runs complete.*

| Model | T1 GF | T2 GF | T3 GF | T4 GF | Overall GF | Avg weighted | Pass rate | Compliant | Verdict |
|-------|-------|-------|-------|-------|-----------|-------------|-----------|-----------|---------|
| haiku-4-5 | — | — | — | — | — | — | — | — | — |
| sonnet-4-6 | — | — | — | — | — | — | — | — | — |

## Findings

*Populated after analysis.*

**Primary question:** Can Haiku achieve GF = 1.00 (all 4 cases correct) with zero categorical fails?

**Routing policy implication:**
- If Haiku GF = 1.00 and zero categorical fails: update `routing-policy-framework.md` — change `/definition-of-done` default from `claude-sonnet-4-6 (Provisional)` to `claude-haiku-4-5` with `measurement_backed: true` and reference `EXP-005-dod-rubric`.
- If Haiku produces any AC false positive (D1 = 0.0 on any adversarial case): Haiku is prohibited for DoD gate decisions. Sonnet remains required.
- If Haiku catches all gaps but NFR precision is weak (D3 < 0.7 on T3): conditional — Haiku can handle functional DoD but must be disqualified from compliance-NFR cases. Sonnet required when story has compliance NFRs.
- Comparison to EXP-004: If Haiku passes DoD at GF = 1.00, the pattern holds across both gate skills (DoR + DoD).

## Next actions

- [ ] Run 8 haiku-4-5 cells (T1–T4, 2 trials each)
- [ ] Run 8 sonnet-4-6 cells (T1–T4, 2 trials each)
- [ ] Score all 16 runs with judge prompt from EVAL.md
- [ ] Populate scorecard summary above
- [ ] Update `workspace/proposals/routing-policy-framework.md` based on results
- [ ] Mark manifest status "complete"
- [ ] Update `workspace/state.json` pendingActions with result

## Deviations from EXP-004 template

- DoD bundles use "PR description / merge summary" instead of "Review report" in the judge prompt `{REVIEW_REPORT}` → `{PR_DESCRIPTION}` placeholder rename.
- D3 (NFR verification) is scored N/A only when the corpus case explicitly states "no NFRs" — otherwise it must be run and scored.
- D4 (metric signal) replaces EXP-004's G4 (test quality) — DoD has a mandatory metric signal step that DoR does not.
- T4 (baseline complete) adversarial pattern is over-hedging rather than under-detection — the failure mode to watch is phantom deviations, not missed gaps.

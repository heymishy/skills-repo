# Scorecard — EXP-010-fable5-model-sweep

Generated: 2026-06-11 (manual analysis — replaces auto-generated file)
Experiment: EXP-010-fable5-model-sweep
Batch ID: msgbatch_012tUKtbMQERpkqmcJ3Q8xFe
Judge model: claude-sonnet-4-6
Actual cost: $4.3634 (est. was $9.17; lower due to generation errors)

---

## Executive summary

The primary experiment objective — comparing Fable 5 against Sonnet 4.6, Opus 4.6, and Sonnet 3.7 — was **blocked** by two model string failures. The experiment produced partial Opus 4.6 vs Sonnet 4.6 signal, which is reported here as a secondary finding. A follow-up run (EXP-010b) is required to complete the primary objective.

**Primary blocker: model string failures**

| Model | Planned string | Outcome | Likely correct string |
|-------|---------------|---------|----------------------|
| Fable 5 | `claude-fable-5-20260609` | 32/32 generation errors | Unknown — requires `GET /v1/models` with valid key |
| Sonnet 3.7 | `claude-sonnet-3-7-20250219` | 32/32 generation errors | `claude-3-7-sonnet-20250219` (3.x naming convention) |

**Secondary issue: judge rate limiting**

The org rate limit of 30,000 input tokens/min was hit during concurrent judge calls after batch completion. Only 26 of 64 possible judge calls succeeded (41%). The remaining 38 judge calls returned 429 and recorded null scores. The auto-generated scorecard shows 0.000 for these cells, which is misleading — they are missing data, not genuine zero scores.

**What we have:** 14 judged runs for Opus 4.6, 12 judged runs for Sonnet 4.6 (out of 32 each). These provide directional signal but not statistically reliable conclusions at α=0.05 (insufficient sample size and uneven case coverage).

---

## Section 1 — Generation failure detail

### Fable 5 (`claude-fable-5-20260609`)

All 32 batch requests errored with "unknown error" from the Anthropic Batches API result JSONL. The model string `claude-fable-5-20260609` was unverified at experiment setup (API key was unavailable in the environment during planning). The string may be wrong or the model may not yet be available at the API tier associated with this org.

**Action required before EXP-010b:** Call `GET /v1/models` with a valid API key and identify the Fable 5 model ID.

### Sonnet 3.7 (`claude-sonnet-3-7-20250219`)

All 32 batch requests errored. The 3.x Claude model family used the naming convention `claude-{major}-{minor}-{name}-{date}`, e.g. `claude-3-5-sonnet-20241022`. The Sonnet 3.7 model ID is almost certainly `claude-3-7-sonnet-20250219`, not `claude-sonnet-3-7-20250219`.

**Action required before EXP-010b:** Verify by calling `GET /v1/models` or checking the Anthropic docs. Update the PRICING map key accordingly.

---

## Section 2 — Data completeness map

`✓` = judged (score available), `~` = rate-limited (null score), `✗` = generation error

| Case | Opus 4.6 T1 | Opus 4.6 T2 | Sonnet 4.6 T1 | Sonnet 4.6 T2 | Fable 5 | Sonnet 3.7 |
|------|:-----------:|:-----------:|:-------------:|:-------------:|:-------:|:----------:|
| T1   | ~           | ✓ 0.88      | ~             | ~             | ✗       | ✗          |
| T2   | ✓ 0.00 NC   | ✓ 0.00 NC   | ✓ 0.00 NC     | ✓ 0.00 NC     | ✗       | ✗          |
| T3   | ✓ 1.00      | ~           | ✓ 0.88        | ~             | ✗       | ✗          |
| T4   | ✓ 0.17 NC   | ✓ 0.18 NC   | ✓ 0.00 NC     | ~             | ✗       | ✗          |
| T5   | ~           | ~           | ~             | ✓ 0.00 NC     | ✗       | ✗          |
| S2   | ✓ 0.76      | ~           | ~             | ~             | ✗       | ✗          |
| S3   | ✓ 0.76      | ~           | ~             | ~             | ✗       | ✗          |
| S4   | ~           | ✓ 0.65      | ~             | ~             | ✗       | ✗          |
| S5   | ~           | ~           | ✓ 0.76        | ~             | ✗       | ✗          |
| S7   | ✓ 0.84      | ✓ 0.55      | ~             | ~             | ✗       | ✗          |
| S8   | ~           | ~           | ✓ 0.84        | ~             | ✗       | ✗          |
| S9   | ~           | ✓ 0.67      | ~             | ~             | ✗       | ✗          |
| S10  | ✓ 0.46      | ~           | ~             | ✓ 0.53        | ✗       | ✗          |
| S11  | ✓ 0.64      | ~           | ✓ 0.69        | ~             | ✗       | ✗          |
| S12  | ~           | ~           | ~             | ✓ 0.41        | ✗       | ✗          |
| S13  | ~           | ~           | ✓ 0.62        | ✓ 0.61        | ✗       | ✗          |

NC = NON-COMPLIANT (categorical fail, score treated as zero)

---

## Section 3 — Opus 4.6 vs Sonnet 4.6: partial comparison

### Aggregate (scored runs only)

| Model | Judged runs | Avg score | Pass rate | NC failures |
|-------|-------------|-----------|-----------|-------------|
| claude-opus-4-6 | 14 of 32 | 0.540 | 5/14 (36%) | 4 (T2×2, T4×2) |
| claude-sonnet-4-6 | 12 of 32 | 0.445 | 3/12 (25%) | 5 (T2×2, T4×1, T5×1) |

*Caution: pass rate and avg score are heavily influenced by which cases happened to be judged. The judged cases are not a random sample — they are the runs whose judge calls completed before rate limiting hit. Comparisons should be treated as directional only.*

### Head-to-head: cases where BOTH models were scored

Only T2, T3, T4, and S10/S11 (one trial each) allow direct comparison:

| Case | Opus 4.6 | Sonnet 4.6 | Delta | Notes |
|------|----------|------------|-------|-------|
| T2 | 0.00 NC | 0.00 NC | 0 | Both fail: produced full artefact without clarifying question |
| T3 | 1.00 | 0.88 | +0.12 Opus | Opus: perfect score; Sonnet: slight gaps in framing |
| T4 | 0.175 NC | 0.00 NC | +0.18 Opus | Both fail: produced artefact without clarification; Opus less catastrophic |
| S10 | 0.46 | 0.53 | +0.07 Sonnet | Neither passes; Sonnet edges Opus on constraint completeness |
| S11 | 0.64 | 0.69 | +0.05 Sonnet | Neither passes; Sonnet edges Opus on D5 assumption quality |

**Head-to-head summary:** Opus edges Sonnet on T-series cases requiring structure and framing discipline; Sonnet edges Opus marginally on S-series regulatory cases. Delta is small in both directions. No statistically meaningful conclusion.

### T2 and T4: shared NON-COMPLIANT pattern

Both models fail T2 ("improve our onboarding" — vague scope requiring clarification) and T4 ("scope too wide" — again requires clarification before artefacting). The judge notes confirm the same process violation in both cases:

> "process_violation: no_clarifying_question — model produced a full multi-phase discovery artefact without first asking which part of onboarding is broken"

This is a *skill-level* failure, not a model-selection issue. The /discovery skill instruction may not be weighting the clarification-before-artefacting protocol sufficiently, or the judge is applying it more strictly than the current skill assumes. This should be investigated as a separate workstream.

Similarly, T5 (Sonnet 4.6, NON-COMPLIANT) indicates the competing-constraints case is triggering a process violation.

---

## Section 4 — S-series analysis (regulatory depth)

Only the cases with actual scores are reported. For cases with only one scored trial, findings are illustrative only.

| Case | Domain | Best scored result | Model | Score | Constraint notes |
|------|--------|-------------------|-------|-------|-----------------|
| S2 | CCCFA/FMA lending | Opus T1 | opus-4-6 | 0.76 PASS | Constraint detection solid; persona gaps |
| S3 | NZ RTP | Opus T1 | opus-4-6 | 0.76 PASS | Scheme compliance well-framed |
| S4 | PCI DSS / open banking | Opus T2 | opus-4-6 | 0.65 FAIL | Constraint detection partial |
| S5 | Privacy Act transcription | Sonnet T1 | sonnet-4-6 | 0.76 PASS | Consent chain well-handled |
| S7 | Greenfield (low-regulation) | Opus T1 | opus-4-6 | 0.84 PASS | Scope discipline strong; correctly defers regulatory |
| S8 | RBNZ/FMA reporting | Sonnet T1 | sonnet-4-6 | 0.84 PASS | Change-control gap surfaced |
| S9 | KiwiSaver / FMA SEN | Opus T2 | opus-4-6 | 0.67 FAIL | Hardship waiver gap missed |
| S10 | RBNZ BS11 migration | Sonnet T2 | sonnet-4-6 | 0.53 FAIL | BS11 notification not prominent |
| S11 | CDR consent / Privacy | Sonnet T1 | sonnet-4-6 | 0.69 FAIL | Derived-data consent gap noted but not explicit |
| S12 | AI credit / MRM | Sonnet T2 | sonnet-4-6 | 0.41 FAIL | MRM version mismatch missed |
| S13 | Trans-Tasman / SWIFT | Sonnet avg | sonnet-4-6 | 0.615 FAIL | Correspondent bank clause oblique |

**Pattern:** Both models pass straightforward regulatory framing (S2, S3, S5, S8) but fail on multi-layer hidden constraints (S9 hardship waiver, S10 BS11 timing, S11 derived-data boundary, S12 MRM version, S13 SWIFT correspondent clause). The "very-high" difficulty cases (S10, S12) score below 0.55 for all scored models.

**Hypothesis status:** The hypothesis that Fable 5 would outperform on high-difficulty S-series cases remains **untestable** from this run.

---

## Section 5 — Cost-per-quality

| Model | Judged runs | Actual cost | Passing runs | Cost per passing run |
|-------|-------------|-------------|--------------|---------------------|
| claude-opus-4-6 | 14 | $1.59 (prorated) | 5 | $0.32 per pass |
| claude-sonnet-4-6 | 12 | $1.18 (prorated) | 3 | $0.39 per pass |
| claude-fable-5-20260609 | 0 (errored) | $0 | 0 | N/A |
| claude-sonnet-3-7-20250219 | 0 (errored) | $0 | 0 | N/A |
| Judge (sonnet-4-6) | 26 calls | $1.57 | — | — |
| **Total actual** | | **$4.36** | | |

*Prorated from actual batch cost based on relative token rates. Cost-per-pass is not meaningful at this sample size.*

---

## Section 6 — Routing recommendation

**Status: DEFERRED — primary question unanswered**

This experiment cannot support a routing recommendation for or against Fable 5. The model string failure prevented all Fable 5 runs.

**Provisional finding from Opus 4.6 vs Sonnet 4.6 partial data:**

The partial head-to-head data shows no meaningful performance differential between Opus 4.6 and Sonnet 4.6 on the /discovery skill. Sonnet 4.6 is 5× cheaper per M output tokens ($15 vs $25) and showed comparable or marginally better performance on S-series regulatory cases in the limited scored sample. There is no evidence from this run that Opus 4.6 justifies its cost premium for /discovery generative output.

*This finding is provisional: based on 5 comparable data points, not the planned 2-trial 16-case matrix.*

**Shared failure mode — scope creep / vague input (T2, T4, T5):**

The NON-COMPLIANT failures on T2, T4, and T5 are consistent across both models and represent a process discipline gap in the /discovery skill, not a model capability issue. Recommend:
- Review T2/T4/T5 corpus case Expected sections — confirm clarification-first protocol is the intended behaviour
- Check `/discovery` SKILL.md wording on when to ask vs. when to produce
- Consider whether the judge is applying a stricter standard than the skill assumes

---

## Section 7 — Required follow-up: EXP-010b

EXP-010b should:

1. **Fix Fable 5 model string**: call `GET /v1/models` before building requests; fail fast with a clear error if model not found
2. **Fix Sonnet 3.7 model string**: use `claude-3-7-sonnet-20250219`
3. **Add judge call backoff/retry**: implement exponential backoff on 429 in `scoreBatchResults()`; add `--judge-delay N` flag (default 2s between judge calls) to stay within 30K token/min org limit
4. **Increase trials to 3**: original template default, to improve statistical reliability
5. **Run EXP-010b full matrix**: 16 cases × 4 models × 3 trials = 192 generation runs + 192 judge calls
6. **Estimated cost for EXP-010b**: ~$15–20 (within $30 ceiling assuming Fable 5 at $10/$50/M)

---

## Deviations from manifest

- Fable 5: all 32 runs errored — model string `claude-fable-5-20260609` invalid (model not found or unavailable on this API tier)
- Sonnet 3.7: all 32 runs errored — model string should be `claude-3-7-sonnet-20250219` (3.x naming convention differs from 4.x)
- Judge rate limiting: 38 of 64 judge calls returned 429 (org limit 30K input tokens/min); null scores recorded; auto-generated scorecard shows 0.000 for these cells, which misrepresents missing data as genuine zeros
- Actual cost ($4.36) vs estimate ($9.17): lower because 64 generation calls errored (no API usage for failed models)
- Status: INCOMPLETE — primary objective (Fable 5 comparison) not achieved; Opus 4.6 vs Sonnet 4.6 partial signal captured

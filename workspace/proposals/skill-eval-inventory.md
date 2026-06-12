# Skill Eval Inventory
**Generated:** 2026-06-12
**Purpose:** Readiness assessment for all skills found in `.github/skills/`

---

## Summary Table

| Skill | SKILL.md | EVAL.md | Corpus | Prior Sweeps | Readiness |
|-------|----------|---------|--------|--------------|-----------|
| /discovery | ✅ Complete | ✅ D1–D8, 7 weighted dims | T1–T5 (T-series) + S2–S13 (S-series), 17 cases | EXP-001, EXP-002a, EXP-010 | **READY** |
| /definition | ✅ Complete | ✅ D1–D5, C2 CPF focused | T1–T4 (4 cases) | EXP-005 | **READY** |
| /definition-of-ready | ✅ Complete | ✅ G1–G5, gate skill dims | T1–T6 (6 cases) | EXP-004 | **READY** |
| /definition-of-done | ✅ Complete | ✅ D1–D5, gate skill dims | T1–T4 (4 cases) | None — rubric only | **PARTIAL** |
| /review | ✅ Complete | ✅ D1–D6, FDR focused | T1–T7 (7 cases) | EXP-006 | **READY** |
| /ideate | ✅ Complete | ❌ None | ❌ None | None | **NOT STARTED** |
| /benefit-metric | ✅ (inferred) | ❌ None | ❌ None | None (Provisional Sonnet) | **NOT STARTED** |
| All other skills | ✅ (SKILL.md) | ❌ None | ❌ None | None | **NOT STARTED** |

Skills with SKILL.md only (no EVAL.md, no corpus): benefit-metric, bootstrap, branch-complete, branch-setup, checkpoint, clarify, coverage-map, decisions, ea-registry, estimate, ideate, implementation-plan, implementation-review, improve, improvement-agent, issue-dispatch, loop-design, metric-review, model-sweep, modernisation-decompose, org-mapping, orient, persona-routing, prioritise, programme, record-signal, reference-corpus-update, release, reverse-engineer, scale-pipeline, spike, start, subagent-execution, systematic-debugging, tdd, test-plan, token-optimization, trace, verify-completion, workflow.

This inventory focuses on the pipeline skills (discovery → definition → dor → dod → review) and /ideate, as these are the skills with clear eval infrastructure potential and pipeline sequencing dependencies.

---

## Per-Skill Assessments

### /discovery

SKILL.md exists and is comprehensive: 8-step conversational process, evaluation mode, EA registry blast-radius integration, clarification gate, S8a /clarify decision gate, attribution requirement, state update. EVAL.md is fully calibrated with 7 dimensions (D1–D7 weighted, D8 for conversation mode) covering problem framing (0.22), persona specificity (0.15), MVP bounding (0.22), out-of-scope discipline (0.15), assumption quality (0.13), success observability (0.08), constraint completeness (0.05). Pass threshold 0.70. Corpus has 17 cases: T1–T5 (T-series, covering well-formed, vague, adversarial, scope-too-wide, hidden-constraint patterns) and S2–S13 (S-series, NZ financial services regulatory scenarios at varying difficulty). EXP-010 confirmed claude-sonnet-4-6 as optimal routing model (0.617 average, 18/32 trial passes, 5.8× cheaper per passing trial than Fable 5). EXP-013 designed a CL1–CL4 clarification-focused rubric separate from D1–D7, recognising that D1–D7 inversely penalises correct clarification behaviour. **Readiness: READY.**

### /definition

SKILL.md exists and is comprehensive: 7-step process (entry condition, slicing strategy, architecture guardrails, story decomposition, regulated constraint propagation Step 4a, benefit coverage matrix, scope accumulator, NFR profile). EVAL.md exists, scoped to regulated constraint propagation fidelity (CPF) with 5 dimensions (D1 C2 identification 0.30, D2 C2 propagation 0.30, D3 C2 AC specificity 0.20, D4 no-fabrication 0.10, D5 decomposition completeness 0.10). Pass threshold 0.80 with separate CPF ≥ 0.80 threshold. Corpus has 4 cases: T1 (PCI DSS QSA explicit), T2 (AML dual-constraint), T3 (implicit regulated from narrative), T4 (no regulated, negative control), T5 (competing constraints), T6 (buried regulatory). EXP-005 validated Haiku for definition in isolation (CPF 1.00 all trials); E2E validation via EXP-003 Config C run 3 is still pending. The definition EVAL.md is scoped narrowly to CPF — story decomposition quality, slicing strategy selection, NFR profiling, and benefit matrix coverage are not independently measured. This is a known gap. **Readiness: READY** (CPF dimension), but NFR quality and decomposition depth dimensions are unmeasured.

### /definition-of-ready

SKILL.md exists. EVAL.md exists with gate-skill dimensions: G1 hard block identification accuracy (0.30), G2 warning identification (0.15), plus additional dimensions. Pass threshold 0.80. Corpus has 6 cases: T1 (missing ACs), T2 (unresolved HIGH finding), T3 (governance engineer-only approval), T4 (genuinely ready), T5 (adapter wiring missing), T6 (false positive pressure). EXP-004 validated Haiku for DoR (GF 1.00 all trials). The corpus note in EVAL.md states the corpus directory was to be populated from first sweep output — 6 files now exist, so this has been done. **Readiness: READY.**

### /definition-of-done

SKILL.md exists. EVAL.md exists with gate-skill dimensions: D1 AC coverage accuracy (0.30), D2 deviation detection (0.20), D3 NFR verification quality (weight not read in full). Pass threshold 0.80. Corpus has 4 cases: T1 (webhook SLA AC gap), T2 (profile scope creep), T3 (API key NFR gap), T4 (filter complete). No prior sweep has been run against this EVAL.md and corpus — the rubric and corpus exist but have not been validated against any model. The eval-programme-roadmap.md notes DoD as "Not started — Provisional Sonnet" as of 2026-05-16, which predates the current corpus files. It is possible these were created after that date. A calibration run is needed before routing policy can be determined. **Readiness: PARTIAL** — EVAL.md and corpus exist but no sweep has run and calibration scores are absent.

### /review

SKILL.md exists and is comprehensive: evaluator stance, entry condition, 5 review categories (A–E), scoring scale, full report output format, diff output for re-runs, state update. EVAL.md exists with 6 dimensions: D1 HIGH finding detection (0.30), D2 severity calibration and false-positive suppression (0.20), D3 MEDIUM finding detection (0.15), D4 category attribution (0.15), D5 finding specificity (0.10), D6 output structure (0.10). Pass threshold 0.80. FDR_HIGH threshold 1.00 — any missed planted HIGH is a categorical fail. Corpus has 7 cases: T1–T5 (planted defects: AC quality HIGH, traceability HIGH, scope HIGH, MEDIUM+LOW only, clean baseline), T6 (false positive pressure), T7 (multi-defect). EXP-006 validated Haiku (FDR_HIGH 1.00 all adversarial cases; 0.33× cost vs Sonnet). **Readiness: READY.**

### /ideate

SKILL.md exists and is comprehensive: 5 lenses (A opportunity mapping, B assumption inventory, C market scan, D product strategy framing, E JTBD), lens recommendation decision table, assumption card markers (ADR-018), pipeline feed integration. No EVAL.md exists. No corpus exists. No prior sweep has run. The /ideate skill poses a unique evaluation challenge: it is a generative multi-lens skill where quality is comparative (did the model produce a better or worse opportunity map or assumption inventory?) rather than fact-checkable (did it propagate a specific constraint?). Standard D1-D7 discovery rubric does not apply. A bespoke comparative-judging rubric is required. **Readiness: NOT STARTED.**

---

## Notes on Non-Pipeline Skills

The repository contains 40+ additional skills (bootstrap, clarify, estimate, improve, test-plan, etc.). These are out of scope for this phase of the eval programme. The eval-programme-roadmap.md identifies /benefit-metric, /definition-of-done (now has corpus), and /improve as the next pipeline gap candidates. /test-plan has a complete EVAL.md and corpus (T1–T5) with EXP-007/007R validation complete. This inventory confirms the eval programme has covered discovery, definition, DoR, review, test-plan; the remaining pipeline gaps are /definition-of-done (calibration run needed) and /ideate (full eval design needed).

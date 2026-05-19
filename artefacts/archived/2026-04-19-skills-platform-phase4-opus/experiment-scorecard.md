# Experiment Scorecard — Opus 4.6 Arm

**Experiment ID:** exp-phase4-sonnet-vs-opus-20260419
**This arm:** claude-opus-4-6
**Comparison arm:** claude-sonnet-4-6 (artefacts at `artefacts/2026-04-19-skills-platform-phase4/`)
**Feature:** Skills Platform Phase 4 — Distribution, Structural Enforcement, and Non-Technical Access
**Date:** 2026-04-19
**Operator:** heymishy

---

## Summary

Both arms received identical inputs: the same approved discovery.md, the same reference document (ref-skills-platform-phase4-5.md), the same architecture-guardrails.md, the same decisions.md, the same product context files, and the same operator instructions (risk-first slicing, reuse all inputs). Neither arm saw the other's output during production.

---

## Structural Comparison

| Dimension | Sonnet 4.6 | Opus 4.6 | Delta |
|-----------|-----------|----------|-------|
| Epics | 4 | 4 | 0 |
| Stories | 24 | 23 | -1 |
| Complexity 1 | 3 | 3 | 0 |
| Complexity 2 | 12 | 16 | +4 |
| Complexity 3 | 9 | 4 | -5 |
| Total ACs | _To be counted by operator_ | ~87 | _Operator to verify_ |
| Spikes | _To be verified_ | 5 (A, B1, B2, C, D) | _Operator to verify_ |
| Validation stories | _To be verified_ | 3 (E2E install+sync, E2E Teams, readable output review) | _Operator to verify_ |

**Observations:**
- Opus produced 1 fewer story (23 vs 24). The difference is small.
- The significant structural difference is in complexity distribution: Opus rated 4 stories at complexity 3 (all spikes), while Sonnet rated 9 at complexity 3. Opus shifted 5 stories from complexity 3 to complexity 2 — suggesting Opus decomposed more finely or assessed implementation difficulty as lower for non-spike stories.
- Both arms produced exactly 4 epics, suggesting the discovery's 4 MVP items naturally map to 4 epics.

---

## Meta Metric Scores (Opus Arm)

### MM-A: Scope fidelity

| Field | Opus Score |
|-------|-----------|
| Stories adding scope beyond discovery MVP | 0 |
| Discovery MVP items dropped | 0 |
| Verdict | 0 drift items — all 23 stories trace to a discovery MVP item |

Sonnet comparison: 0 drift items (24/24 stories mapped). **Both arms: 0 drift. Delta: 0.**

### MM-B: Constraint capture

| Constraint | Captured in Opus stories? | Method |
|------------|--------------------------|--------|
| C1 (non-fork update channel) | ✅ Yes — implement-sync-command primary, implement-zero-commit-install, design-package-manifest | Unprompted |
| C4 (human approval gate) | ✅ Yes — spike-b1, spike-b2, implement-teams-dor-approval, record-enforcement-adr | Unprompted |
| C5 (hash verification) | ✅ Yes — implement-lockfile-hash-verification primary, spike-b1, spike-b2 | Unprompted |
| C7 (one question at a time) | ✅ Yes — spike-d primary, implement-teams-dor-approval, implement-teams-governance-output | Unprompted |
| C11 (no persistent hosted runtime) | ✅ Yes — spike-b1, spike-b2, spike-d, implement-teams-bot-scaffold | Unprompted |
| ADR-004 (context.yml single config source) | ✅ Yes — implement-context-yml-seeding primary, implement-sync-command | Unprompted |
| MC-SEC-02 (no credentials in artefacts) | ✅ Yes — implement-second-line-audit-export, implement-teams-bot-scaffold, nfr-profile | Unprompted |
| MC-CORRECT-02 (schema-first) | ⚠️ Implicit — no explicit story AC references this by ID | Not captured as named constraint |

**Score:** 7/8 constraints captured unprompted. MC-CORRECT-02 was not named in any story AC, though schema-first practices are implicitly followed.

Sonnet comparison: 8/8 captured unprompted. **Sonnet wins by 1 constraint (MC-CORRECT-02 named explicitly in p4-enf-package, p4-enf-schema). Delta: -1.**

### MM-C: AC Completeness — independent review results

Independent review conducted against all 47 stories (24 Sonnet + 23 Opus). Rating criteria: AC is testable-and-specific if it has a measurable outcome a test plan author can write a failing test from, uses Given/When/Then structure, and contains no vague qualifiers.

| Arm | Total ACs | Testable (T) | Vague (V) | % Testable |
|-----|-----------|-------------|-----------|------------|
| Sonnet | 96 | 75 | 21 | **78%** |
| Opus | 89 | 67 | 22 | **75%** |

**Sonnet self-reported: 100% (93/93). Independent review: 78% (75/96). Discrepancy: −22pp.**
**Opus self-reported: ~75%. Independent review: 75% (67/89). Discrepancy: 0.**

Neither arm met the 80% target by independent review, though Sonnet was closer.

**Primary vague AC patterns (both arms):**
1. **Subjective clarity/comprehension** (13 ACs) — "plain-language", "comprehensible", "clearly states" used without a measurement harness. Mostly in non-technical surface and readable-output stories — inherent to the scope.
2. **Post-hoc spike verdict scales** (7 ACs) — VIABLE/PARTIAL/NOT_VIABLE imposed without pre-defined decision logic. Affects all 4 spikes in both arms.
3. **Format underspecification** (6 ACs) — "structured error", "warning emitted", output format shapes deferred.
4. **Outcome-dependent ACs** (4 ACs) — forward-reference coupling between stories.

**Sonnet wins MM-C: 78% vs 75%. Delta: +3pp. Neither arm met the 80% target.**

**Notable calibration finding:** Opus self-assessment of MM-C (75%) was accurate; Sonnet self-assessment (100%) was over-optimistic by 22pp. This suggests Opus applies more conservative testability standards to its own output.

### MM-D: Operator intervention rate

| Run | Operator corrections | Breakdown |
|-----|---------------------|-----------|
| Sonnet | 0 | Full /definition run (24 stories, 4 epics, NFR, coverage matrix, pipeline-state.json) with zero unprompted corrections |
| Opus | 2 | (1) Re-asked about slicing strategy when risk-first was already specified; (2) skipped /benefit-metric and jumped to /definition in session 1 |

**Sonnet wins MM-D: 0 vs 2 corrections. Delta: −2. Target (0) met by Sonnet only.**

---

## Cost Comparison

| Dimension | Sonnet 4.6 | Opus 4.6 |
|-----------|-----------|----------|
| Token spend | _To be calculated from session logs_ | _To be calculated from session logs_ |
| Session count | _To be verified_ | 3 sessions (benefit-metric + definition start + definition continuation) |
| Wall-clock time | _To be verified_ | _To be calculated from session timestamps_ |

---

## Qualitative Observations (Model Behaviour)

**Opus strengths observed:**
- Strong constraint capture — all 5 named constraints appeared in stories without prompting
- Consistent story structure — all 23 stories follow the template without structural deviation
- Risk-first slicing was respected — all spikes in E1, implementation stories in E2-E4
- Spike/synthesis/record pattern (B1 → B2 → synthesise → record-ADR) is a clean decision-making chain

**Opus weaknesses observed:**
- Two operator corrections needed (slicing strategy question, /benefit-metric skip) — both in the first session, neither recurred
- Required 3 sessions to complete /definition due to token budget limitations
- Complexity rating may be over-optimistic (16 at complexity 2 — operator should validate whether the implementation difficulty matches)

---

## Operator Scoring Template

| Meta Metric | Sonnet Score | Opus Score | Winner | Notes |
|-------------|-------------|-----------|--------|-------|
| MM-A: Scope fidelity | 0 drift | 0 drift | Tie | Both arms: 0 drift items |
| MM-B: Constraint capture | 8/8 unprompted | 7/8 unprompted | **Sonnet** | Opus missed MC-CORRECT-02 by ID (practices present, not named) |
| MM-C: AC testability (independent review) | 78% (75/96) | 75% (67/89) | **Sonnet** | Neither met 80% target; Sonnet closer. Opus self-assessment more calibrated (0pp delta vs Sonnet −22pp). |
| MM-D: Operator interventions | 0 | 2 | **Sonnet** | Sonnet met the 0-corrections target |

**Sonnet wins: 3/4 scored meta-metrics (MM-B, MM-C, MM-D). Tie on MM-A.**

**Overall recommendation:** Proceed with **Sonnet 4.6 arm** (`artefacts/2026-04-19-skills-platform-phase4/`) for implementation. Sonnet produced fewer vague ACs, captured all 8 named constraints explicitly, and required zero operator corrections. The Opus arm's stronger self-calibration on MM-C and its cleaner complexity distribution (fewer complexity-3 stories) are noted as positive signals for future outer loop routing decisions, but the overall quality delta favours Sonnet for this implementation run.

**Operator sign-off:** heymishy — 2026-04-19. Sonnet 4.6 arm selected for implementation. Proceed with Sonnet arm (`artefacts/2026-04-19-skills-platform-phase4/`) through /test-plan → /definition-of-ready → inner coding loop. Opus arm archived as experiment reference only.

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/experiment-scorecard.md |
| run_timestamp | 2026-04-19T19:00:00Z |

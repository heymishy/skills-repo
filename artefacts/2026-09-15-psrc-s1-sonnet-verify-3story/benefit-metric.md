# Benefit Metric: Route governance-critical skills to Sonnet by default

**Status:** Active
**Metric owner:** Hamish King
**Reviewers:** Hamish King — Platform Owner

---

## Meta-benefit check

This feature changes the pipeline's own model-routing configuration (an operational/infra decision), not a product-facing capability — it has no separate meta-benefit dimension beyond the Tier 1 reliability metric below. N/A.

---

## Tier 1: Product metric

| Metric | Baseline | Target | Minimum signal | Feedback loop |
|--------|----------|--------|-----------------|----------------|
| Governance-critical skill completion integrity | Confirmed broken twice (2026-09-15 artefact-marker emission failures; 2026-09-29 shallow single-turn `done:true` completions on `test-plan`/`definition-of-ready`, both on `claude-haiku-4-5`) | Zero recurrences of either failure mode across `design`/`definition`/`review`/`test-plan`/`definition-of-ready` | A `skill_turn` PostHog trace never shows `done:true` on `turnIndex:1` for one of these 5 skills without a legitimate single-turn completion (verified manually when it happens) | PostHog `skill_turn` event trace, spot-checked after each of the first several real sessions post-deployment; ongoing via the drift-guard (Tier 3 below) |
| Manual restart incidents (operator has to notice and redo a shallow-completed skill) | 1 confirmed incident (2026-09-29, tab-s1) — real cost: full test-plan (6 turns) + DoR (2 turns) redone from scratch | 0 | Any operator-initiated restart of `test-plan`/`definition-of-ready`/`review`/`design`/`definition` within the same session, same feature slug | Same PostHog trace, correlated by `journeyId` |

---

## Tier 3: Compliance / verification metric

| Obligation | Metric | Target | Validated by |
|------------|--------|--------|--------------|
| Model-routing intent matches deployed reality (drift guard) | `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secrets present and correct for all 5 skills, on both `wuce-staging` and production (`skills-framework`) | 100% match, continuously | `fly secrets list` cross-checked against `DEFAULT_SONNET_SKILLS`-equivalent intended set; automated check per Story 3 |

---

## Baseline discipline

Both Tier 1 baselines above are **confirmed, not estimated** — each cites a specific, dated, directly-observed incident (2026-09-15's marker-emission finding, documented in this feature's own now-completed discovery.md; 2026-09-29's shallow-completion finding, observed directly via PostHog during `tab-s1`'s delivery). No `[UNKNOWN BASELINE]` placeholders — this is a rare case where the "before" state is unambiguous because the bug had already occurred and left evidence.

---

## Metric Coverage Matrix

*(populated at `/definition`, once stories are written — see `definition.md`)*

---

## Notes

Originally opened 2026-09-15 as a narrower "throwaway verification" feature (see `discovery.md`'s own history section) scoped only to confirming Sonnet fixes marker-emission on 3 skills; resumed and rescoped 2026-09-29 to cover all 5 non-`discovery`/`ideate` governance-critical skills, following a second, independent incident of the same root cause manifesting as a different (and worse) failure mode.

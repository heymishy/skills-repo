# Cost Model Decisions

Operator decisions log for open items flagged during the 2026-05-12 cost model validation pass.
These items arose when verifying GitHub Copilot AI Credits multipliers and Layer 1/Layer 2 cost consistency across EXP-002a, EXP-002b, EXP-003, eval-programme-roadmap.md, and routing-policy-framework.md.

---

## D1 — Gemini models in EXP-002a

**Date:** 2026-05-12
**Context:** GitHub Copilot now includes Gemini 2.5 Pro (1x multiplier) and Gemini 3 Flash Preview (0.33x multiplier). These are viable alternatives but were absent from all experiment manifests.
**Decision:** Defer Gemini models from EXP-002a. Current priority is establishing baseline quality data for existing models (Haiku, Sonnet, Opus, GPT-4o family). Adding Gemini in the initial sweep increases complexity without a clear hypothesis. Revisit after EXP-002a results are available.
**Status:** Deferred — not in EXP-002a scope. Add to a future EXP-002c if Layer 1 cost analysis shows Gemini 3 Flash (0.33x, same as Haiku) warrants evaluation as a Haiku alternative.
**Owner:** Operator — revisit post-EXP-002a

---

## D2 — GPT-5.5 (7.5x Copilot multiplier)

**Date:** 2026-05-12
**Context:** GPT-5.5 is available in Copilot at 7.5x multiplier — higher than Sonnet (1x), lower than Opus 4.7 (15x). No hypothesis exists for why GPT-5.5 would be preferred over Sonnet at 1x for any pipeline skill.
**Decision:** Do not add GPT-5.5 to any experiment manifest at this time. A 7.5x Layer 1 cost requires a clear quality hypothesis that justifies the premium. No such hypothesis has been formed. If future evidence from EXP-002a suggests the GPT family has quality gaps that GPT-5.5 addresses, revisit.
**Status:** Not in scope. No action.
**Owner:** Operator — revisit if EXP-002a GPT-4o/4.1/5-mini results show quality gaps

---

## D3 — Opus version: claude-opus-4-6 vs claude-opus-4-7

**Date:** 2026-05-12
**Context:** All experiment manifests and the routing policy were using `claude-opus-4-6` as the model string. Operator confirmed that claude-opus-4-6 is no longer available in Copilot (Layer 1) — only claude-opus-4-7 at 15x multiplier is available.
**Decision (Layer 1):** All Layer 1 manifest model strings updated from `claude-opus-4-6` → `claude-opus-4-7`. Carry-forward scores from EXP-001 (run with opus-4-6 generation) remain valid for comparison purposes — the EXP-001 carry-forward cells are annotated as `source: EXP-001-run-3b (opus-4-6 generation)`.
**Decision (Layer 2 API):** `claude-opus-4-7` is confirmed as a valid direct API model string (verified 2026-05-12 via Anthropic SDK `ModelParam` type in anthropic-sdk-python). `claude-opus-4-6` also remains valid as an API string. For Layer 2 runs, use `claude-opus-4-7` to match the Layer 1 model selector string. Operators who want EXP-001 direct comparability can use `claude-opus-4-6` in Layer 2 runs only — record the distinction in the run metadata.
**Status:** Fully resolved.
**Owner:** Operator — verify `claude-opus-4-7` API string before Layer 2 runs

---

## D4 — Auto mode (10% discount)

**Date:** 2026-05-12
**Context:** GitHub Copilot Auto mode applies a 10% AI Credit discount by automatically selecting a model per request. This could reduce Layer 1 costs by 10% across a pipeline session with no operator intervention.
**Decision:** Auto mode is prohibited for eval runs. Model selection must be controlled and recorded for each cell in the sweep matrix. Using Auto would make model identity unknown per request, breaking the experiment protocol. For production pipeline sessions (not eval), Auto mode is a viable cost-reduction option — consider as a future policy recommendation after eval evidence is established. Do not use Auto in any experiment manifest run.
**Status:** Prohibited for eval runs. May be recommended for production sessions post-eval-programme. No action needed now.
**Owner:** Operator — note as candidate production recommendation after EXP-003 completes

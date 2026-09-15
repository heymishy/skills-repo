# Test Plan: Centralize per-skill model routing (psrc-s1)

**Story:** artefacts/2026-09-15-per-skill-model-routing-config/stories/psrc-s1-centralize-per-skill-model-routing.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural (new) | New `tests/check-psrc-s1-model-routing-config.js` — no override env vars set, asserts default routing for `discovery`/`ideate` (sonnet) and `test-plan`/`definition-of-ready`/`review`/`definition` (haiku), matching pre-change behaviour exactly. |
| T2 | AC2 | Behavioural (new) | Same file — sets `WUCE_MODEL_OVERRIDE_TEST_PLAN` only; asserts `test-plan` picks it up and `definition-of-ready` (no override) is unaffected. |
| T3 | AC3 | Behavioural (new) | Same file — sets `WUCE_MODEL_OVERRIDE_DISCOVERY` to a Haiku model; asserts the override is refused and the safe Sonnet default is returned instead. |
| T4 | AC4 | Behavioural (new) | Same file — sets both a per-skill override and `WUCE_FAST_MODEL` to different models for the same skill; asserts the per-skill override wins. |
| T5 | AC5 | Behavioural (new) | Same file — calls the module directly from both of `skills.js`'s former call-site shapes (module-level `getModelForSkill` re-export, and a simulated streaming-turn-handler call) with identical env state; asserts identical results, proving one source of truth. |
| T6 | — | Regression | Full existing test suite re-run unchanged — this replaces routing logic behind the same two call sites (`getModelForSkill`, `registerHtmlSession`'s use of it, and the streaming turn handler), no existing test hardcodes the old inline array shape by string-matching source, so no targeted regression file is expected to need updating (confirmed via grep for `_SONNET_SKILLS` in `tests/` — zero hits). |

## Regression coverage

T6 is a full-suite sanity pass. No existing test directly asserts on the internal `_SONNET_SKILLS` variable name or the duplicated-array shape being removed.

## Out of Scope (per story)

- Testing `scripts/run-model-sweep.js`'s separate `MODEL_ROUTING` table (unchanged, out of scope for this story).
- Testing `htmlSubmitTurn`'s non-streaming path (pre-existing, unrelated gap, out of scope).

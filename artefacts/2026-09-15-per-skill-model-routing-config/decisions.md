# Decisions: per-skill model routing config (psrc-s1)

## Decision: Centralize per-skill model routing into one module, with env-var-driven per-skill overrides

**Date:** 2026-09-15

**Context:** `src/web-ui/routes/skills.js` had per-skill model routing (which skill uses Sonnet vs. Haiku) defined twice, independently: once in `getModelForSkill()` (used for the UI's displayed model badge) and once inline inside the real streaming turn handler (what actually decides the model that executes). Both happened to agree today, but nothing enforced that. The only existing override mechanism, `WUCE_FAST_MODEL`, is a blanket toggle affecting every skill and every concurrent user simultaneously, set via a Fly secret with no per-skill scoping and no built-in audit trail beyond the secret-change itself.

**Decision:** Move both copies of the routing logic into a single new module, `src/web-ui/config/model-routing.js`, and add a scoped per-skill override mechanism: `WUCE_MODEL_OVERRIDE_<SKILL_NAME_UPPER_SNAKE>` env vars, settable as individual Fly secrets per skill. Precedence order, most to least specific: per-skill override → blanket `WUCE_FAST_MODEL` (kept for backward compatibility) → module default. The Haiku-fabrication safety invariant (`HAIKU_BLOCKED_SKILLS`, established by EXP-021 — Haiku fabricates regulatory constraints on `/discovery`) is preserved unconditionally: no override path, per-skill or blanket, can route a Haiku-blocked skill to a Haiku model.

**Rationale:** Two independent copies of the same routing table is a silent-drift risk — a future edit to one without the other would make the UI's displayed model badge lie about what actually ran, with no test or gate catching it (confirmed: no existing test asserts on the inline array shape). A scoped per-skill override also directly addresses a real operational need surfaced this session: testing a model-routing hypothesis on 3 specific skills (`test-plan`, `definition-of-ready`, `review`) without the blast radius of a blanket, all-skills toggle affecting all concurrent production traffic.

**Alternatives considered:**
- Keep `WUCE_FAST_MODEL` as the only lever and just use it for this test, reverting after. Rejected — no audit trail, affects unrelated skills and any concurrent traffic, requires two restarts with no code record of what changed or why.
- Move routing into a committed JSON/YAML config file read at request time. Rejected for this pass — this codebase's existing config convention (`src/web-ui/config/repo-list.js`, `validate-env.js`) is env-var-driven JS modules, not static data files; a data-file approach would also need either a writable volume or a deploy to change, no faster than editing the module itself, while losing the "individually Fly-secret-settable without a deploy" property env vars give per-skill overrides.
- Also reconcile `scripts/run-model-sweep.js`'s separate `MODEL_ROUTING` table with this new module, making it the single source of truth end-to-end. Deferred — real gap, flagged in the story's Out of Scope, worth its own follow-up rather than scope-creeping this fix.

**Impact:** `getModelForSkill()` and the streaming turn handler now share one implementation. Default routing behaviour is unchanged (AC1). New capability: any skill's model can be overridden individually via a Fly secret, without touching other skills or requiring a deploy — used immediately after this merges to test `test-plan`/`definition-of-ready`/`review` on Sonnet for the marker-emission reliability investigation, then reverted the same way.

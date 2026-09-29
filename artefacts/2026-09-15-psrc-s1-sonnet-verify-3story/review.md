# Review: Route governance-critical skills to Sonnet by default

**Definition reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/definition.md
**Stories reviewed:** psrc-verify-s1, psrc-verify-s2, psrc-verify-s3 (all — per this repo's own `rssp-s1` no-re-ask convention)

---

## Run 1

### Category A — Architecture

- **[1-H1] HIGH — `psrc-verify-s3`'s drift-check logic, as originally drafted, was inline untestable server.js code.** AC3 (deliberately unsetting one override to prove the guard fires) cannot be reliably automated against logic buried in `server.js`'s startup IIFE. **Fixed:** the story now requires a small, separately-exported, directly-testable pure function `checkModelRoutingDrift(envVars)` (mirroring `getModelForSkill`'s own existing `envVars` injection pattern) that `server.js` calls and logs the result of — not inline logic. AC1/AC3 rewritten accordingly.

### Category B — Naming / maintainability

- **[1-M1] MEDIUM — `psrc-verify-s3`'s proposed `INTENDED_SONNET_SKILLS` constant name reads too similarly to the existing `DEFAULT_SONNET_SKILLS`** (`['discovery', 'ideate']`), risking future confusion between "skills that default to Sonnet with no override" and "skills whose override is intended to resolve to Sonnet." **Fixed:** renamed to `DRIFT_GUARD_SONNET_SKILLS`, with an explicit Architecture Constraint note distinguishing the two.

### Category C — Testability

- No further issues. `psrc-verify-s1`'s ACs are inherently manual (confirming LLM output quality/depth cannot be fully automated) — this matches the established, accepted pattern for developer-run verification elsewhere in this repo (e.g. `tab-s1`'s own AC3/AC6 verification-script scenarios). Not flagged as a defect.

### Category D — Scope

- No issues. All 3 stories' Out of Scope sections correctly exclude each other's work, and the epic's own Out of Scope list is consistent with `discovery.md`'s.

### Category E — Security / compliance

- No issues. No new credentials, no change to `HAIKU_BLOCKED_SKILLS`, no PII/data-handling surface.

**Run 1 verdict:** 1 HIGH, 1 MEDIUM — both fixed inline before Run 2 (small, well-scoped stories; fixing immediately was faster and lower-risk than a separate fix-cycle).

---

## Run 2

### Diff since Run 1

- ✅ **1-H1 — RESOLVED.** `psrc-verify-s3` AC1/AC2/AC3 rewritten around `checkModelRoutingDrift(envVars)`, a directly unit-testable pure function; Architecture Constraints updated to require it.
- ✅ **1-M1 — RESOLVED.** Constant renamed `DRIFT_GUARD_SONNET_SKILLS` throughout, with an explicit disambiguation note against `DEFAULT_SONNET_SKILLS`.

### Re-check of all 5 categories

- **A (Architecture):** PASS — testable, additive-only design confirmed.
- **B (Naming):** PASS — no remaining naming collisions.
- **C (Testability):** PASS.
- **D (Scope):** PASS.
- **E (Security):** PASS — score 5/5, no findings either run.

**Run 2 verdict:** 0 HIGH, 0 MEDIUM. **PASS.**

---

## Summary

| Category | Run 1 | Run 2 |
|----------|-------|-------|
| A — Architecture | 1 HIGH | PASS |
| B — Naming/maintainability | 1 MEDIUM | PASS |
| C — Testability | PASS | PASS |
| D — Scope | PASS | PASS |
| E — Security | PASS | PASS |

**Overall:** ✅ No unresolved HIGH findings. Ready for `/test-plan`.

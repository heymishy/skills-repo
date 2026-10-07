## Test Plan: /improve must default to Sonnet, matching the same conservative-absent-evidence precedent already applied to /ideate

**Story reference:** artefacts/2026-10-07-improve-skill-model-default/stories/imd-s1-default-improve-to-sonnet.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. This story's own tests extend the existing dedicated test file `tests/check-psrc-s1-model-routing-config.js` (not a new file — that file already owns `getModelForSkill`/`DEFAULT_SONNET_SKILLS` coverage with the exact mock-env-object convention this story needs).

**Real architecture grounding (confirmed by direct code read, 2026-10-07):**
- `src/web-ui/config/model-routing.js:30`: `const DEFAULT_SONNET_SKILLS = ['discovery', 'ideate'];` — pure data, a single array literal to extend.
- `getModelForSkill(skillName, envVars, options)` (lines 69-99) is a pure function, already directly unit-testable with a plain `envVars` object — no mocking, no I/O, matching `check-psrc-s1-model-routing-config.js`'s own existing convention exactly.
- `skills/improve/SKILL.md` confirmed to exist (`ls skills | grep improve` → `improve`), confirming `'improve'` is the real, correct skill identifier string.

**E2E/browser-layout detection (Step 3a):** N/A — pure config/routing-logic change, no UI.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | improve defaults to non-Haiku with no overrides | 1 test | — | — | — | — | 🟢 |
| AC2 | DEFAULT_SONNET_SKILLS contains improve, discovery/ideate unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 | Per-skill override still takes precedence for improve | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing check-psrc-s1 suite (AC1-AC5) unaffected | — | — | — | — | — | 🟢 (regression — reruns existing suite unchanged) |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — plain JS env-object literals, matching `check-psrc-s1-model-routing-config.js`'s own existing convention exactly (no fixtures, no mocking, pure function calls).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `{}` (empty env) | Synthetic | None | Mirrors AC1's existing `discovery`/`ideate` assertions in the same file |
| AC2 | `DEFAULT_SONNET_SKILLS` array, imported directly | N/A (reads the real exported constant) | None | |
| AC3 | `{ WUCE_MODEL_OVERRIDE_IMPROVE: 'claude-sonnet-4-6' }` or similar | Synthetic | None | Mirrors AC2's existing per-skill-override assertion pattern |
| AC4 | `check-psrc-s1-model-routing-config.js`'s own existing fixtures | Synthetic | None | Regression only, no new fixtures |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### improve defaults to a non-Haiku model with no overrides

- **Verifies:** AC1
- **Precondition:** `const env = {}`
- **Action:** Call `getModelForSkill('improve', env)`
- **Expected result:** Returned model id does not match `/haiku/i` — identical assertion style to the existing `AC1: discovery defaults to a non-Haiku model with no overrides` / `AC1: ideate defaults to a non-Haiku model with no overrides` lines already in the file
- **Edge case:** Yes — this is the exact gap being closed (previously, `improve` silently resolved to `claude-haiku-4-5`)

### DEFAULT_SONNET_SKILLS contains improve; discovery and ideate remain present (regression)

- **Verifies:** AC2
- **Precondition:** None — reads the real exported `DEFAULT_SONNET_SKILLS` constant directly
- **Action:** `DEFAULT_SONNET_SKILLS.indexOf('improve')`, `.indexOf('discovery')`, `.indexOf('ideate')`
- **Expected result:** All three `!== -1`
- **Edge case:** No — explicit regression guard for the two pre-existing entries

### A per-skill override still takes precedence for improve

- **Verifies:** AC3
- **Precondition:** `const env = { WUCE_MODEL_OVERRIDE_IMPROVE: 'claude-opus-4-8' }`
- **Action:** Call `getModelForSkill('improve', env)`
- **Expected result:** Returns `'claude-opus-4-8'` exactly — confirms adding `improve` to `DEFAULT_SONNET_SKILLS` did not accidentally bypass the pre-existing per-skill-override precedence logic (the override check runs before the `DEFAULT_SONNET_SKILLS` fallback in `getModelForSkill`'s own existing control flow, unchanged by this story)
- **Edge case:** No — explicit precedence-ordering regression guard

---

## Integration Tests

None — this is a pure config/data change (one array literal) exercised entirely through the existing unit-level `getModelForSkill()` test convention. `check-psrc-s1-model-routing-config.js`'s own AC5 already separately proves `routes/skills.js`'s exported `getModelForSkill` and this module's own are the identical function — no new integration surface is introduced by adding one string to an array.

---

## NFR Tests

None — the story's own NFR section states no Performance/Security/Accessibility NFR applies; the Cost NFR is an acknowledged, deliberate tradeoff (not a test-verifiable threshold), matching `/ideate`'s own already-accepted precedent.

---

## Out of Scope for This Test Plan

- Any live comparison of actual `/improve` output quality between Haiku and Sonnet — that is the "run a dedicated eval" option explicitly named out of scope in the story itself, a larger, separate piece of work.
- Any test of `improvement-agent` (`src/improvement-agent/`) — confirmed unrelated, does not call this module.

---

## Gap table

No gaps.

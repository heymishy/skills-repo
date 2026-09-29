## Test Plan: Startup drift guard — warn loudly if a governance-critical skill silently resolves to Haiku

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md

---

## AC Coverage

| AC | Description | Unit | Integration | Gap type | Risk |
|----|-------------|------|-------------|----------|------|
| AC1 | `checkModelRoutingDrift` returns empty/populated correctly | 2 tests | — | — | 🟢 |
| AC2 | server.js logs a warn line per drift entry, nothing when clean | — | 2 tests | — | 🟢 |
| AC3 | Exactly one drift entry when one override is unset | 1 test | — | — | 🟢 |
| AC4 | discovery/ideate never appear in drift output | 1 test | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Synthetic `envVars` objects passed directly to `checkModelRoutingDrift` (matching `getModelForSkill`'s own existing injectable-`envVars` testability pattern) — no real Fly secrets or real server boot required for the unit tests. The 2 integration tests spy on `console.warn` around a direct call to the real startup-check call site.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | `envVars` with all 5 `WUCE_MODEL_OVERRIDE_*` set to a Sonnet id; a second with all 5 unset (falls back to Haiku default) | Synthetic | Two calls, opposite outcomes |
| AC2 | Same two `envVars` shapes, wired through the real startup call site | Synthetic | Spies on `console.warn` |
| AC3 | `envVars` with 4 of 5 set to Sonnet, 1 deliberately omitted | Synthetic | Asserts exactly 1 entry, correct skill name |
| AC4 | `envVars` with `WUCE_MODEL_OVERRIDE_DISCOVERY`/`WUCE_MODEL_OVERRIDE_IDEATE` deliberately set to a Haiku id (if such override vars even exist for these — they don't need to, since these two aren't in `DRIFT_GUARD_SONNET_SKILLS` at all) | Synthetic | Proves scope is exactly the 5 named skills |

## Unit Tests

### checkModelRoutingDrift returns empty array when all 5 governance skills resolve to Sonnet

- **Verifies:** AC1
- **Precondition:** `envVars` has all 5 `WUCE_MODEL_OVERRIDE_<SKILL>` set to `'claude-sonnet-4-6'`
- **Action:** Call `checkModelRoutingDrift(envVars)`
- **Expected result:** Returns `[]`
- **Edge case:** No

### checkModelRoutingDrift returns all 5 as drifted when no overrides are set (falls back to Haiku default)

- **Verifies:** AC1
- **Precondition:** `envVars` has none of the 5 overrides set
- **Action:** Call `checkModelRoutingDrift(envVars)`
- **Expected result:** Returns an array of 5 entries, each `{skill, resolvedModel}` with `resolvedModel` containing `'haiku'`
- **Edge case:** Yes — the "nothing configured yet" baseline state

### checkModelRoutingDrift returns exactly one entry when exactly one override is missing

- **Verifies:** AC3
- **Precondition:** `envVars` has 4 of 5 overrides set to Sonnet; `WUCE_MODEL_OVERRIDE_REVIEW` is omitted
- **Action:** Call `checkModelRoutingDrift(envVars)`
- **Expected result:** Returns exactly 1 entry, `{skill: 'review', resolvedModel: <contains 'haiku'>}`
- **Edge case:** Yes — the specific "one secret accidentally removed" scenario this story exists to catch

### checkModelRoutingDrift never includes discovery or ideate regardless of their own state

- **Verifies:** AC4
- **Precondition:** `envVars` in a state where `discovery`/`ideate` would resolve to Haiku if they were checked (e.g. `WUCE_FAST_MODEL` set to a Haiku id, which `HAIKU_BLOCKED_SKILLS` would refuse for `discovery` anyway, resolving it to the safe Sonnet default — but this test proves `checkModelRoutingDrift` doesn't even look at these two skills, not that they happen to resolve safely)
- **Action:** Call `checkModelRoutingDrift(envVars)`, inspect the `skill` field of every returned entry
- **Expected result:** No returned entry has `skill === 'discovery'` or `skill === 'ideate'`
- **Edge case:** Yes — scope-boundary proof

## Integration Tests

### server.js logs a drift warning for each entry checkModelRoutingDrift returns

- **Verifies:** AC2
- **Components involved:** The real startup call site in `server.js` that calls `checkModelRoutingDrift` and logs its result
- **Precondition:** `envVars` shaped to produce exactly 2 drift entries
- **Action:** Invoke the real startup-check logic (extracted as a small callable unit if `server.js`'s own structure requires it, to avoid needing a full server boot) with a `console.warn` spy installed
- **Expected result:** Exactly 2 `console.warn` calls, each prefixed `[model-routing-drift]`, each naming the correct skill

### server.js logs nothing when all 5 governance skills are correctly routed

- **Verifies:** AC2
- **Components involved:** Same call site
- **Precondition:** `envVars` shaped so `checkModelRoutingDrift` returns `[]`
- **Action:** Same as above
- **Expected result:** Zero `console.warn` calls with the `[model-routing-drift]` prefix

## Out of Scope for This Test Plan

- Any real Fly secret manipulation (covered by `psrc-verify-s2`, already deployed by the time this story's tests run for real, but not required for these unit/integration tests themselves).
- Any alerting/paging integration (out of scope for the whole story, per its own Out of Scope section).

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

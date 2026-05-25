# Definition of Done: cdg.7 — Gated advance and web UI adapter wiring

**PR:** https://github.com/heymishy/skills-repo/pull/373 | **Merged:** 2026-05-27
**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.7.md
**Test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.7-test-plan.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.7-dor.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-27

---

## Step 1 — PR and story confirmation

| Item | Status | Detail |
|------|--------|--------|
| PR merged | ✅ | PR #373 merged to master at commit c611f21 |
| Story artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.7.md |
| DoR artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.7-dor.md |
| Test plan exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.7-test-plan.md |

---

## Step 2 — AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `skills gate-advance` blocks write when validate fails | ✅ | T1: non-existent artefact path → validate exits 1, state not modified; T2: H4 structural fail (missing Out-of-Scope section) → exits 4, state not modified | Automated tests — 37 assertions pass in check-cdg7-gate-advance.js | None |
| AC2 — `skills gate-advance` writes state when validate passes | ✅ | T3: artefact with no Story-reference header → validate exits 0; fields written to state; T4: advance() called with correct pairs | Automated tests | None |
| AC3 — `skills gate-advance` exits 8 on missing required args | ✅ | T5: 0 args → exit 8, stderr contains usage message; T6: 2 args → exit 8 | Automated tests | None |
| AC4 — `gate-map.js` exports 7-key gated-stage registry | ✅ | T7: registry has exactly 7 keys (`discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`); T8: each value has a `.gate` string property | Automated tests | None |
| AC5 — `pipeline-state-writer.js` delegates story-level writes to `advance()` | ✅ | T9: flat story prStatus written via advance(); T10: invalid enum value throws; T11: prototype-polluting key rejected; T12: epic-nested story prStatus written via advance() | Automated tests | Noted: two sequential atomic writes occur when both feature-level and story-level fields are updated in one call (feature-level write then advance() write). Accepted per W1 acknowledgement in DoR. |
| AC6 — `copilot-instructions.md` mandates `gate-advance` for stage transitions | ✅ | T13: `.github/copilot-instructions.md` contains `gate-advance` and all 7 gated stage values in the Coding Standards section | Automated governance test | None |

**ACs satisfied: 6/6**

---

## Step 3 — Test suite verification

| Suite | Tests | Result |
|-------|-------|--------|
| check-cdg7-gate-advance.js | 37 assertions (T1–T14) | ✅ All pass |
| Full suite (master, post-merge) | 193 scripts | ✅ Exit 0 |

Test evidence: `37 check(s) OK ✓` from `node tests/check-cdg7-gate-advance.js` run in worktree at commit `acdc1d0`. Full suite `Total: passed=193 failed=0` on master post-merge.

---

## Step 4 — Scope compliance

All changes are within scope per the DoR contract:
- ✅ `src/enforcement/gate-map.js` — created (frozen 7-key registry)
- ✅ `src/enforcement/cli-gate-advance.js` — created (gateAdvance function)
- ✅ `bin/skills` — modified (gate-advance subcommand added)
- ✅ `src/web-ui/adapters/pipeline-state-writer.js` — modified (story-level block replaced with advance() delegate; atomic write sequenced before advance(); proto pollution guard added)
- ✅ `tests/check-cdg7-gate-advance.js` — created (37 assertions, T1–T14)
- ✅ `.github/copilot-instructions.md` — modified (gate-advance mandate in Coding Standards)
- ✅ `package.json` — modified (test chain extended)
- ✅ `CHANGELOG.md` — modified (cdg.7 entry under ### Added)

Out-of-scope files not touched: `cli-advance.js`, `cli-outer-loop.js`, `.github/pipeline-state.schema.json`, any file under `artefacts/`.

No scope deviations. Single implementation commit `c611f21` maps to all 7 DoR tasks.

---

## Step 5 — NFR Status

The NFR profile (`nfr-profile.md`) assigns all explicit NFR entries to cdg.1 and cdg.2. cdg.7 has no additional NFR entries. Relevant security properties are inherited:

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| OWASP A03 — path traversal via artefact-path arg | ✅ | artefact-path is passed to `validate()` in `cli-outer-loop.js`, which has an existing `path.resolve()` + `startsWith(repoRoot)` guard (delivered in cdg.1). No new file-write path introduced in `cli-gate-advance.js`. |
| OWASP A03 — prototype pollution in pipeline-state-writer.js | ✅ | Prototype pollution guard added to `pipeline-state-writer.js` before any file op; T11 confirms the writer rejects `__proto__` field names. `advance()` already has its own guard (cdg.6). |
| No credentials in output | ✅ | `accessToken` key is filtered from the `fieldsChanged` log in pipeline-state-writer.js. `cli-gate-advance.js` does not reference session data. |

---

## Step 6 — Metric Signal

cdg.7 is linked to M2 (Gate Bypass Incident Rate) and M4 (Schema Violation Rate) per the story benefit-linkage field.

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M2 — Gate bypass rate | `on-track` | `gate-advance` command is deployed on master. All stage-boundary CLI advances now have a validate-first enforcement path available. The gate-advance mandate in `copilot-instructions.md` (T13) instructs agents to use it for stage transitions. Automated trace audit is not yet in place — that is a Phase 3 follow-on. The structural mechanism is deployed; measurement baseline can now be established. | 2026-05-27 |
| M4 — Schema violation rate from CLI/web-UI state writes | `on-track` | `pipeline-state-writer.js` now delegates story-level writes to `advance()`, which performs enum validation and proto-pollution guards before writing. All web UI story-level writes now go through the same validated code path as the CLI. T9–T12 confirm no bypass. 0 schema violations observed in test suite. | 2026-05-27 |

---

## Outcome

**Definition of done: COMPLETE WITH DEVIATIONS ✅**

ACs satisfied: **6/6**
Deviations: **1** — two-write behaviour for combined feature+story updates (W1, accepted in DoR)
Test gaps: **None**
NFR gaps: **None**

The noted deviation (W1 — two sequential atomic writes) was acknowledged by the operator before coding started and recorded in the DoR. It is not a defect; it is an accepted trade-off for the current single-operator, low-concurrency web UI context. A follow-up story may address atomic combined writes if multi-operator concurrency becomes a requirement.

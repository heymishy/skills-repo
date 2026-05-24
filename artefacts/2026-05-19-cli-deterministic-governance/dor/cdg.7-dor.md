# Definition of Ready: cdg.7 — Gated advance and web UI adapter wiring

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.7.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.7-test-plan.md
**Review report:** Short-track — no formal review run. Zero HIGH findings (see inline contract review below).
**Discovery artefact:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**NFR profile:** N/A — story declares NFRs inline. No new external dependencies. Path traversal is handled by existing `validate()` guard in `cli-outer-loop.js` (the artefact path is passed directly to validate; no separate traversal guard needed in gate-advance itself because the guard already exists in the validate layer).
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Hard block assessment

| Block | Check | Result |
|-------|-------|--------|
| H1 — Story exists with ACs | cdg.7.md present, 6 ACs defined | PASS |
| H2 — Test plan exists with failing tests named | cdg.7-test-plan.md present, T1–T14 named | PASS |
| H3 — No HIGH review findings | Short-track review below: 0 HIGH findings | PASS |
| H4 — Discovery artefact approved | discovery.md status: Approved | PASS |
| H5 — Benefit metric active | benefit-metric.md exists with M1–M4 | PASS |
| H6 — No out-of-scope changes | Contract defines explicit touchpoints + exclusions | PASS |
| H7 — Dependencies available | `cli-advance.js` (cdg.6, merged), `cli-outer-loop.js` (cdg.1, merged), `pipeline-state-writer.js` (existing) | PASS |
| H8 — Security review | OWASP A03: artefact path traversal delegated to validate()'s existing guard. Proto pollution: advance() guard already in place (cdg.6). No new attack surface. | PASS |
| H9 — Test can be run locally | `node tests/check-cdg7-gate-advance.js` — no external deps, temp-dir isolation | PASS |

**Proceed: Yes**

---

## Warnings

W1 — `pipeline-state-writer.js` refactor produces two sequential atomic writes when both feature-level and story-level fields are updated in the same call (step 1: feature-level direct write; step 2: advance() reads updated file and writes again with story fields). This is a known behaviour change. It is acceptable for the current single-operator, low-concurrency web UI use case. An operator who needs atomic feature+story writes should open a follow-up story.

**Acknowledgement required before proceeding:** Yes — operator must acknowledge W1 before inner loop starts.

---

## Operator acknowledgement

W1 acknowledged: the two-write behaviour for combined feature+story updates is accepted for Phase 2 (single-operator web UI). A follow-up story can address atomic combined writes if multi-operator concurrency becomes a requirement.

---

## Coding Agent Instructions

**Entry condition:** Branch created from master after the DoR is signed off. `npm test` must pass on a clean checkout before making any changes.

**Task sequence:**

1. Create `src/enforcement/gate-map.js` — export a frozen object with 7 gated stage keys, each mapping to `{ gate: '<gate-name>' }`. Gate names: `discovery` → `discovery-approved`, `benefit-metric` → `benefit-metric-active`, `definition` → `definition-complete`, `test-plan` → `test-plan-complete`, `definition-of-ready` → `dor-signed-off`, `implementation` → `branch-complete`, `definition-of-done` → `definition-of-done`. Run T7 and T8 — both must pass before moving on.

2. Create `src/enforcement/cli-gate-advance.js` — exports `{ gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot) }`. The function: (a) validates that all 4 required positional args are present — if not, return `{ exitCode: 8, stdout: '', stderr: '<usage message>' }`; (b) calls `validate(artefactPath, gateName, repoRoot)` from `cli-outer-loop.js` — if `exitCode !== 0`, return that result immediately with no state write; (c) calls `advance(featureSlug, storyId, rawFields, repoRoot)` from `cli-advance.js` and returns its result. Run T1–T6 — all must pass before moving on.

3. Add `gate-advance` subcommand to `bin/skills` — pattern identical to the existing `advance` block. Args: `[featureSlug, storyId, gateName, artefactPath, ...rawFields] = args`. Call `gateAdvance()` from `cli-gate-advance.js`. Run T5 from CLI to confirm the command is reachable.

4. Refactor `pipeline-state-writer.js` — in the story-level write block (the `if (storyId)` branch), replace the inline story lookup and field write with a call to `advance(featureSlug, storyId, pairs, repoRoot)`. The `pairs` array is built from the `storyLevelKeys` filter on `stateUpdate`. If `advance()` returns non-zero, throw with `result.stderr`. Remove the inline `story` lookup code that is now superseded. Preserve the feature-level write block unchanged. Run T9–T12 — all must pass before moving on.

5. Add `gate-advance` mandate to `.github/copilot-instructions.md` Coding Standards section — the rule must name all 7 gated stage values and state that `gate-advance` is required for stage-boundary advances. Run T13.

6. Add `&& node tests/check-cdg7-gate-advance.js` to `package.json` test script. Run `npm test` — full suite must pass (zero regressions). Run T14.

7. Commit and push. Open draft PR. Run `node bin/skills gate-advance` to update pipeline-state.json (`stage=branch-complete prStatus=draft`) — note: since the DoR artefact for cdg.7 exists and passes validate, use `gate-advance` for this update to dog-food the new command.

**Mandatory conventions:**
- `req.session.accessToken` is the canonical session field name for GitHub tokens. Do not use `req.session.token`.
- After any conflict resolution, run conflict marker scan before `git add` (see D40 in copilot-instructions.md).
- All state writes during the inner loop use `node bin/skills advance` (or `gate-advance` for stage transitions) — no ad-hoc inline Node scripts.

---

## Contract Proposal

**What will be built:**

1. **`src/enforcement/gate-map.js`** — NEW. Frozen object with 7 gated stage → gate-name mappings.

2. **`src/enforcement/cli-gate-advance.js`** — NEW. Exports `gateAdvance()`. Calls validate then advance. No process.exit(). Returns `{ exitCode, stdout, stderr }`.

3. **`bin/skills`** — MODIFY. Add `gate-advance` subcommand block (4 lines, pattern identical to `advance`).

4. **`src/web-ui/adapters/pipeline-state-writer.js`** — MODIFY. Replace inline story-level write logic (the `if (storyId)` block) with a call to `advance()` from `cli-advance.js`. Preserve feature-level write block and factory signature.

5. **`tests/check-cdg7-gate-advance.js`** — CREATE. 14 tests T1–T14.

6. **`.github/copilot-instructions.md`** — MODIFY. Add gate-advance mandate to Coding Standards section.

7. **`package.json`** — MODIFY. Append `&& node tests/check-cdg7-gate-advance.js` to test script.

**What will NOT be built:**
- Automatic gate-name lookup from stage value at runtime (gate-map is a registry, not runtime routing)
- New validate gate rules in `cli-outer-loop.js`
- Changes to `cli-advance.js` or `cli-outer-loop.js`
- Changes to `.github/pipeline-state.schema.json`
- Windows `.cmd` wrapper
- Any file under `artefacts/`

**How each AC will be verified:**

| AC | Test(s) | Type |
|----|---------|------|
| AC1 — validate non-zero blocks write | T1, T2 | Unit |
| AC2 — validate 0 → state written | T3, T4 | Unit + Integration |
| AC3 — missing args → exit 8 usage | T5, T6 | Unit |
| AC4 — gate-map.js registry | T7, T8 | Governance |
| AC5 — pipeline-state-writer uses advance() | T9, T10, T11, T12 | Integration |
| AC6 — copilot-instructions.md mandate | T13 | Governance |
| Governance — npm chain | T14 | Governance |

**Regression:** Full `npm test` suite must pass. Existing cdg.3, cdg.6 tests must continue to pass unchanged. Existing `pipeline-state-writer.js` integration tests in `tests/check-owle6*.js` (or equivalent) must continue to pass.

---

## Inline security review (SHORT-TRACK)

| Category | Finding | Severity | Resolution |
|----------|---------|----------|-----------|
| OWASP A03 — path traversal via artefact-path arg | artefact-path is passed to `validate()` which already has `path.resolve` + `startsWith(repoRoot)` guard (cdg.1) | N/A | Existing guard in validate layer covers this |
| OWASP A03 — prototype pollution in stateUpdate keys | `advance()` rejects `__proto__`, `constructor`, `prototype` field names (cdg.6 AC6) | N/A | Guard already in advance(); T11 verifies it reaches pipeline-state-writer |
| OWASP A01 — bypass via non-gated advance | `advance` subcommand remains available for non-gated updates. This is by design (free updates for status fields). Gate enforcement is only mandatory for stage transitions per copilot-instructions.md rule. | INFO | Accepted by design; mandate covers the agent compliance case |

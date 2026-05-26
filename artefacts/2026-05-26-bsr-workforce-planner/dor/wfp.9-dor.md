# Definition of Ready — Author and maintain workforce-to-initiative allocation assignments

**Story:** wfp.9
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-26
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Author and maintain workforce-to-initiative allocation assignments
**Review:** PASS — wfp.9 run 1, 0 HIGH findings; 1 MEDIUM (1-M1 implementation module path — addressed in coding agent instructions below); 1 LOW (1-L1 AC9 mechanism clause — noted, no rework)
**Test plan:** 20 unit tests + 1 smoke test covering all 9 ACs and key NFRs
**Verification scenarios:** 6 scenarios (see Step 5 below)

---

## Step 2 — Contract Proposal

**What will be built:**
- `src/workforce/assign.js` — new module with:
  - Module-level injectable adapter: `let _promptFn = stubPromptFn` where `stubPromptFn` throws `Error('Adapter not wired: promptFn. Call setPromptFn() with readline implementation before use.')` (D37 — stub must throw)
  - Exported functions: `setPromptFn(fn)`, `getPromptFn()`, `runGuided(opts)`, `runFileImport(opts)`, `runAutoDerive(opts)`, `runAssign(opts)` (entry point dispatcher)
  - Atomic write helper used by all three modes: write to `workforce/allocation-input.json.tmp`, then `fs.renameSync(tmp, dest)`
  - Overwrite guard in all three modes: if `workforce/allocation-input.json` exists and `opts.overwrite` is not true, exit nonzero with the required message
- `.github/skills/workforce-assign/SKILL.md` — CLI skill entry point for `workforce-assign`; wires the readline adapter before calling `runAssign`
- `tests/check-wfp9-assign.js` — 20 unit tests (all must pass)

**What will NOT be built:**
- Incremental merge into an existing `allocation-input.json` (Phase 2)
- Browser UI for assignment authoring
- Skills validation in guided or file modes
- parentSlug / scopeLabel generation in auto-derive mode

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — guided happy path (squad, person, skip) | Unit: mock promptFn, 3 cases | Unit |
| AC2 — guided invalid person re-prompts | Unit: mock promptFn returns invalid then valid | Unit |
| AC3 — file import xlsx/csv row merge | Unit: xlsx fixture, csv fixture | Unit |
| AC4 — file import unmatched person warning | Unit: roster miss → stderr | Unit |
| AC5 — file import missing required column | Unit: file without initiative-slug → nonzero exit | Unit |
| AC6 — auto-derive root flags + summary stdout | Unit: _autoderived, _reviewRequired, stdout message | Unit |
| AC7 — auto-derive no portfolio files | Unit: absent dir + empty dir | Unit |
| AC8 — overwrite protection all modes | Unit: 3 mode tests | Unit |
| AC9 — overwrite flag atomic write | Unit: file replaced; JSON.parse succeeds | Unit |

**Assumptions:**
- wfp.1 (workforce-intake) is DoD-complete before implementation begins — `workforce/roster.json` is readable by `runGuided` and `runAutoDerive`
- `portfolio/[slug].json` files follow the established schema (productGroup field present)
- The `xlsx` npm package is already in `package.json` from wfp.1

**Estimated touch points:**
- `src/workforce/assign.js` — new
- `.github/skills/workforce-assign/SKILL.md` — new
- `tests/check-wfp9-assign.js` — new
- `package.json` — append `&& node tests/check-wfp9-assign.js` to scripts.test

---

## Step 3 — Contract review

Contract review passed — all 9 ACs covered by named tests; D37 adapter pattern mandated; atomic write pattern consistent with wfp.1/wfp.2 precedent.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering" — not "a user" |
| H2 — three or more ACs in Given / When / Then | PASS | 9 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 9 ACs covered in test plan |
| H4 — out-of-scope populated | PASS | 5 explicit exclusions |
| H5 — benefit linkage to named metric | PASS | M1 + M2; mechanism sentence is causal |
| H6 — complexity rated | PASS | Rating: 3 |
| H7 — no unresolved HIGH findings | PASS | 0 HIGH findings; MEDIUM addressed in instructions |
| H8 — no uncovered ACs | PASS | All 9 ACs have named unit tests |
| H8-ext — cross-story schema check | PASS | No pipeline-state schema dependency |
| H9 — architecture constraints populated | PASS | CommonJS, no new deps, fixed paths, atomic write, overwrite guard |
| H-E2E — web UI change requiring E2E | PASS | CLI tool; no browser-rendered output; H-E2E not triggered |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private in nfr-profile.md |
| H-NFR-profile — NFRs registered in nfr-profile.md | PASS | wfp.9 NFRs added to nfr-profile.md this session (Performance, Security, Integrity, Usability) |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-26 |
| H-ADAPTER — injectable adapters wired (D37) | PASS | promptFn adapter introduced; stub must throw; production readline wiring mandated in SKILL.md CLI entry point; DoR includes explicit AC for production wiring below |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or "None" | No warning — 4 NFRs with quantified targets |
| W2 — scope stability declared | No warning — Stable |
| W3 — MEDIUM review findings acknowledged | Acknowledged — 1-M1 (module path not in story) resolved in coding agent instructions; 1-L1 (AC9 mechanism clause) noted, no action needed |
| W4 — verification script reviewed by domain expert | Warning — scenarios written below; not yet reviewed by Hamish King |
| W5 — no UNCERTAIN items in test plan | No warning — guided mode stdin mocking approach explicitly named (D37 injectable adapter) |

**W4 acknowledgement:** Internal engineering tool; pre-GM use context. Operator proceeds.

---

## Step 5 — Verification scenarios

Manual scenarios to run post-implementation before DoD:

1. **Auto-derive smoke test:** `node src/workforce/assign.js --mode auto` against a portfolio/ with ≥ 1 .json file and a valid roster.json → `workforce/allocation-input.json` written; contains `_autoderived: true` at root; every entry has `_reviewRequired: true`; summary printed to stdout.
2. **File import smoke test:** `node src/workforce/assign.js --mode file --file [path.xlsx]` with a 3-row file → output contains merged entries; optional columns absent from rows are not `null` in output.
3. **Overwrite protection:** Run any mode without `--overwrite` when `allocation-input.json` exists → exits nonzero with "allocation-input.json already exists. Use --overwrite to replace" message.
4. **Overwrite flag:** Same scenario with `--overwrite` → file replaced; content is valid JSON.
5. **No portfolio files:** Empty or absent `portfolio/` → exits nonzero with "No portfolio files found in portfolio/." message.
6. **Guided mode wiring:** `node src/workforce/assign.js --mode guided` with a real terminal → readline prompts appear; skill does not throw on `promptFn` (production adapter is wired).

---

## Oversight level

**Low** — from parent epic wfp-reconciliation-engine.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Author and maintain workforce-to-initiative allocation assignments — wfp.9

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.9-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.9-test-plan.md`
20 unit tests + 1 smoke test — all must pass.

### Test files
- `tests/check-wfp9-assign.js` — unit tests. Add `&& node tests/check-wfp9-assign.js` to `npm test` chain.
- No E2E tests — CLI tool, no browser output.

### What to build

**Task 1 — Core module + injectable adapter:**
Create `src/workforce/assign.js`:
```js
'use strict';
const path = require('path');
const fs = require('fs');

const MIN_COVERAGE_SCORE = 0.6; // exported constant — used by wfp.10

let _promptFn = function stubPromptFn() {
  throw new Error('Adapter not wired: promptFn. Call setPromptFn() with a real readline implementation before use.');
};
function setPromptFn(fn) { _promptFn = fn; }
function getPromptFn() { return _promptFn; }

// ... runAutoDerive, runFileImport, runGuided, runAssign, atomicWrite, overwriteGuard ...

module.exports = { setPromptFn, getPromptFn, runAssign, runAutoDerive, runFileImport, runGuided };
```
D37 rule: stub must throw — verified by smoke test S1 in test plan.

`runAutoDerive(opts)`:
1. Read all `*.json` files from `portfolio/` (relative to repo root). If none found → exit nonzero with "No portfolio files found in portfolio/. Run initiative-intake (enterprise fork) first, or use --mode guided or --mode file."
2. Read `workforce/roster.json`. Group squad members by squad name.
3. For each portfolio slug:
   - Find roster squads where `productGroup` matches slug's `productGroup`.
   - If exactly one match → `allocationMode: "direct"`.
   - If multiple matches → `allocationMode: "profile-match"` with `requiredTags` set to top-3 most-frequent skills across the matching squad members.
   - If no match → `allocationMode: "net-new"` with `requiredRole: null`, `requiredTags: []`.
   - All entries: `_reviewRequired: true`.
4. Write `workforce/allocation-input.json` with `_autoderived: true` at the root via `atomicWrite()`.
5. Print summary: `"Auto-derived [N] direct, [N] profile-match, [N] net-new entries. Review allocation-input.json before running workforce-map."`

`runFileImport(opts)`:
1. Read file at `opts.file` using `require('xlsx')` (already in package.json from wfp.1). Support `.xlsx` and `.csv`.
2. Validate required column `initiative-slug` exists (case-insensitive header match) → nonzero exit + message if absent.
3. Group rows by `initiative-slug`. Merge `person-name` values into `people[]`. Warn on stderr for any person-name not in roster.json. Omit optional columns (`product-group`, `scope-label`) from output entry if the column is absent (NOT null — key must be absent).
4. Write output via `atomicWrite()`.

`runGuided(opts)`:
1. Read portfolio slugs and roster.json.
2. For each slug, print: `"Initiative: [slug] (claims [fte] FTE, [productGroup])"` then menu `[1] Assign a squad  [2] Assign named people  [3] Skip  [4] Mark as net-new gap`.
3. Use `_promptFn(question)` (returns a Promise) for each prompt. Validate person names against roster on option 2; re-prompt on invalid name with "Person not found in roster: [name] — check spelling or run workforce-intake first".
4. After all slugs processed, write output via `atomicWrite()`.

`atomicWrite(dest, content)`:
- Write to `dest + '.tmp'`
- `fs.writeFileSync(dest + '.tmp', JSON.stringify(content, null, 2), 'utf8')`
- `fs.renameSync(dest + '.tmp', dest)`

`overwriteGuard(opts)`:
- If `workforce/allocation-input.json` exists and `!opts.overwrite` → print "allocation-input.json already exists. Use --overwrite to replace, or edit the existing file directly." + `process.exit(1)`.

**Task 2 — Production readline wiring (D37 mandatory separate task):**
In `.github/skills/workforce-assign/SKILL.md`, add a CLI runner block that:
```
## Running
\`\`\`bash
node -e "
  const { setPromptFn, runAssign } = require('./src/workforce/assign.js');
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  setPromptFn(q => new Promise(r => rl.question(q, r)));
  runAssign(parseArgs(process.argv)).then(() => rl.close()).catch(e => { console.error(e.message); process.exit(1); });
"
\`\`\`
```
This is the **only place** `setPromptFn` is called with a real readline implementation. The wiring must precede the `runAssign` call.

**Task 3 — Test file:**
`tests/check-wfp9-assign.js` — implement all 20 unit tests from the test plan. Use the `assert` module (Node.js stdlib). No test runner dependency. Inject mock `promptFn` arrays via `setPromptFn()`. Use temp directories for file fixtures.

**Task 4 — package.json test chain:**
Append `&& node tests/check-wfp9-assign.js` to the `scripts.test` value in `package.json`.

### Dependencies
- wfp.1 (workforce-intake) must be DoD-complete before implementation begins.
- `xlsx` npm package must be present in `package.json` (introduced by wfp.1).

### Definition of done for this story
- `node tests/check-wfp9-assign.js` exits 0 with 20 passing
- `npm test` exits 0
- All 6 verification scenarios pass manually
- `workforce/allocation-input.json` is valid JSON after any successful run

### Proceed: Yes

---

**Definition of ready: PROCEED — Author and maintain workforce-to-initiative allocation assignments (wfp.9)**

# `design.system` Context Tag Triggers a Real DoR Hard Block — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in `artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s5-test-plan.md` pass. Reference `DESIGN.md`'s real path from `.github/context.yml` (AC1). Build a real, callable, unit-tested token-scanning script (AC2). Add a new conditional `H-DESIGN` hard block to `skills/definition-of-ready/SKILL.md`, modeled precisely on the existing `H-INF`/`H-MIG` trigger-condition/skip-when-absent pattern (AC3-AC5). This story is pure governance/tooling logic — no UI, no rendering, no browser dependency.
**Branch:** `feature/dsa-s5`
**Worktree:** `.worktrees/dsa-s5`
**Test command:** `npm test` (unit/integration, via `node scripts/run-all-tests.js`) — no E2E for this story (confirmed by the test plan's own "Coverage gaps: None... Step 3a's E2E/browser-layout detection does not trigger on any of this story's ACs")

---

## Pre-verified findings (from investigation before this plan was written — do not re-derive, verify against current code once per task instead)

**`DESIGN.md`'s real path:** `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md` — NOT a repo-root `DESIGN.md` (confirmed: no such file exists at the repo root). `.github/context.yml` currently has no `design` key at all — this is a genuinely new addition, not a fix to an existing wrong value.

**`DESIGN.md`'s real color-token table format** (lines 17-54): two markdown tables. Dark (lines 19-36): `| \`--token\` | \`#HEX\` | use |` — one row has two hex values in one cell (`--success` etc.: `` `#34D399` / soft `#0F2318` ``). Light (lines 42-54): `| \`--token\` | \`#HEX\` |` (2-column) — the last row (`success/warn/danger soft backgrounds`) has 6 hex values combined in one cell across two markdown-code-span groups. A token-value extractor must pull every `#[0-9A-Fa-f]{3,8}` hex literal out of BOTH tables via a single regex sweep over the whole "Color tokens" + "Light mode" section text — do not assume one hex value per row/line, the combined cells break that assumption.

**No existing programmatic DoR hard-block runner exists.** `src/enforcement/cli-outer-loop.js`'s `validate()` function (used by `gate-advance`) only checks a DoR **artefact's own structural format** (AC-count, Given/When/Then markers, etc. — the generic "H1-H9 header-metadata checks") — it does NOT implement `H-INF`/`H-MIG`'s or any other conditional hard block's actual conditional business logic (`hasInfraTrack`, `hasDesignSystemTrack`, etc.). That logic lives purely as documented instructions in `skills/definition-of-ready/SKILL.md`, which an agent follows conversationally when actually running `/definition-of-ready` — confirmed by grepping `cli-outer-loop.js` for `H-INF`/`H-MIG`/`hasInfraTrack` and finding zero matches outside comments.

**Existing test pattern for a conditional hard block:** `tests/check-inf4-h-inf-gate.js` (read in full) — 8 tests + 1 NFR, ALL of them regex-pattern-matching `skills/definition-of-ready/SKILL.md`'s own raw text content (e.g. "does the H-INF block's text mention `hasInfraTrack` within 800 chars of the `H-INF` identifier," "does the FAIL message text reference `infraPlanPath`"). This is the established, correct test shape for a conditional-hard-block's own trigger/skip/audit-trail documentation — **not** a runtime state-machine test, because no runtime state machine exists for DoR hard blocks. `tests/check-mig3-h-mig-gate.js` follows the identical pattern for `H-MIG` — read it too before writing `H-DESIGN`'s own equivalent test file, to confirm the pattern holds for a second example.

**Why `H-DESIGN` is NOT purely documentation-pattern-testable like `H-INF`/`H-MIG` (this is the story's own key complexity, Complexity Rating 2):** `H-INF`/`H-MIG` only check "does an artefact file exist and contain a `Status: PASS` string" — trivial presence checks, no real logic needed beyond `fs.existsSync`/string search. `H-DESIGN`'s AC2 requires actually scanning arbitrary file content for hardcoded color values not present in `DESIGN.md`'s own token list — this IS real, non-trivial logic (parsing, comparison, specific-value reporting) that must be a genuine, callable, independently unit-tested implementation, not just prose describing what an agent should manually eyeball. This is the concrete difference between "real, not documentation" (the story's own AC3 language) and the simpler presence-check precedent — the scan itself must actually work and be proven to work via fixtures, which SKILL.md-text-pattern-matching alone cannot prove.

**`skills/definition-of-ready/SKILL.md`'s real hard-block table location:** lines 114-134 (the `| # | Check | Source |` table), row for `H-MIG` is the last row before `**If any hard block fails**`. Detail sections (`### H-INF — ...`, `### H-MIG — ...`) are at lines 187-241, each preceded by an HTML comment anchor (`<!-- h-inf-block -->`, `<!-- h-mig-block -->`) — follow this exact anchor convention for `H-DESIGN`'s own detail section.

---

## File map

```
Modify:
  .github/context.yml                              — add a `design:` key referencing DESIGN.md's real path (AC1)
  skills/definition-of-ready/SKILL.md               — add H-DESIGN row to the hard-block table (after H-MIG); add an H-DESIGN detail section (after H-MIG's own detail section), modeled on H-INF/H-MIG's exact structure

Create:
  scripts/check-design-tokens.js                    — real, callable token-scanning module: parses DESIGN.md's token table, scans a given file's content for hardcoded color values not in that list, reports the specific offending value. CLI-invokable AND require()-able (for tests).
  tests/check-design-tokens-scan.js                 — unit tests for the scanning module itself (AC2: detects a non-token color with file/value naming; does not false-positive on token-only values)
  tests/check-h-design-gate.js                       — SKILL.md documentation-pattern tests for H-DESIGN's trigger condition, skip-when-absent behavior, and audit-trail format (AC3/AC4/AC5's documented-behavior half), mirroring check-inf4-h-inf-gate.js's exact test shape
  tests/fixtures/dsa-s5-noncompliant-touched-file.js  — fixture: a hardcoded, non-token color value (e.g. `color: #123456`)
  tests/fixtures/dsa-s5-compliant-touched-file.js     — fixture: only DESIGN.md token-table hex values
```

---

## Task 1: `context.yml` reference + real token-scanning script (AC1, AC2) — ✅ COMPLETE (commits `4c8597c6`, `0ead5e9c`)

**Files:**
- Modify: `.github/context.yml`
- Create: `scripts/check-design-tokens.js`, `tests/check-design-tokens-scan.js`, `tests/fixtures/dsa-s5-noncompliant-touched-file.js`, `tests/fixtures/dsa-s5-compliant-touched-file.js`

- [ ] **Step 1: Write the failing tests**

`tests/fixtures/dsa-s5-noncompliant-touched-file.js` (deliberately non-token color):
```javascript
// Fixture: a hardcoded, non-token color value for dsa-s5 AC2/AC3 testing.
module.exports = { style: 'color: #123456; background: #ABCDEF;' };
```

`tests/fixtures/dsa-s5-compliant-touched-file.js` (only real DESIGN.md token values):
```javascript
// Fixture: only DESIGN.md token-table hex values, for dsa-s5 AC2/AC4 negative-control testing.
module.exports = { style: 'color: #F5F6F7; background: #0B0D10; accent: #3B82F6;' };
```
(Use exact real hex values read from `DESIGN.md` — `--ink`, `--bg`, `--accent` dark values — verify against the file directly before hardcoding, do not trust this plan's own copy.)

`tests/check-design-tokens-scan.js`:
```javascript
'use strict';
const assert = require('assert');
const path = require('path');
const { extractDesignTokens, scanFileForNonTokenColors } = require('../scripts/check-design-tokens');

const DESIGN_MD_PATH = path.join(__dirname, '..', 'artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md');

// T1 (AC2): extractDesignTokens returns every hex value from DESIGN.md's dark + light tables
// T2 (AC2): scanFileForNonTokenColors flags the noncompliant fixture, naming file + specific offending value(s)
// T3 (AC2, negative control): scanFileForNonTokenColors does NOT flag the compliant fixture (no false positive)
// T4: scanFileForNonTokenColors on a file with no color-like values at all returns no findings (not a crash)
```

Run: `node tests/check-design-tokens-scan.js` — expect fail (module doesn't exist yet).

- [ ] **Step 2: `context.yml`**

Add a `design:` top-level key referencing `DESIGN.md`'s real path — `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md` — as a path reference only, per `product/constraints.md` #8 ("Design artefacts are referenced, not embedded"). Do not embed any of `DESIGN.md`'s content.

- [ ] **Step 3: `scripts/check-design-tokens.js`**

Export two functions:
- `extractDesignTokens(designMdPath)` — reads `DESIGN.md`, sweeps the "Color tokens" + "Light mode" sections (between the `## Color tokens` and `## Spacing & radius` headings) with a single `/#[0-9A-Fa-f]{3,8}/g` regex, returns a `Set` of lowercased hex values (normalize `#ABC123` and `#abc123` to the same form before comparing).
- `scanFileForNonTokenColors(filePath, tokenSet)` — reads the file at `filePath`, extracts every hex-color-like literal (`/#[0-9A-Fa-f]{3,8}/g`) from its content, returns an array of `{ file, value }` for each one NOT present in `tokenSet` (case-insensitive compare).

Also provide a small CLI wrapper (`if (require.main === module) { ... }`) so this is directly invocable, e.g. `node scripts/check-design-tokens.js <file>` — this is what an agent running `/definition-of-ready` would actually execute per `H-DESIGN`'s own documented instructions (Task 2).

- [ ] **Step 4: Verify tests pass**

`node tests/check-design-tokens-scan.js` — all pass.

- [ ] **Step 5: Complete task**
- Check off this task
- Record ending git SHA
- Commit: `feat(dsa-s5): reference DESIGN.md from context.yml + build real token-scanning script (AC1, AC2)`

---

## Task 2: `H-DESIGN` hard block in `/definition-of-ready` (AC3, AC4, AC5) — ✅ COMPLETE (commits `c98e20c1`, `cbf779a8`)

**Files:**
- Modify: `skills/definition-of-ready/SKILL.md`
- Create: `tests/check-h-design-gate.js`

- [x] **Step 1: Write the failing test**

`tests/check-h-design-gate.js` — read `tests/check-inf4-h-inf-gate.js` and `tests/check-mig3-h-mig-gate.js` in full first, then write the same shape of test for `H-DESIGN`, adapted to its own trigger flag (`hasDesignSystemTrack`) and its own scanning mechanism (reference `scripts/check-design-tokens.js` by name in at least one assertion, proving the SKILL.md documentation points at the real script rather than describing a purely manual eyeball process). Cover, at minimum (mirroring `check-inf4`'s own 8+1 test shape):
- SKILL.md contains the `H-DESIGN` identifier
- `H-DESIGN`'s block references `hasDesignSystemTrack` as its trigger condition
- `H-DESIGN` is documented as conditional — skipped when `hasDesignSystemTrack` is absent/false
- `H-DESIGN`'s skip-when-absent text states existing hard blocks (`H1`-`H13`, `H-GOV`, `H-ADAPTER`, `H-INF`, `H-MIG`, `H-NFR-profile`) are unaffected
- `H-DESIGN`'s FAIL message format names the specific offending file and value (matching `H-ADAPTER`'s own `H-ADAPTER FAIL: ...` convention, per AC2's own literal wording)
- `H-DESIGN`'s PASS message confirms no non-token colors found
- `H-DESIGN` references `scripts/check-design-tokens.js` (or an equivalent real, named script) as the actual scan mechanism — not just prose

Run: `node tests/check-h-design-gate.js` — expect fail (SKILL.md not yet updated).

- [x] **Step 2: Add the `H-DESIGN` row + detail section to `skills/definition-of-ready/SKILL.md`**

Add a new row to the hard-block table (after the `H-MIG` row, ~line 134): `| H-DESIGN | Design-token compliance gate: if the story's pipeline-state entry has \`hasDesignSystemTrack: true\`, scan the story's declared touched files (via \`scripts/check-design-tokens.js\`) for hardcoded color values not present in \`DESIGN.md\`'s token table; fail naming the specific file and value if any are found. If \`hasDesignSystemTrack\` is absent or false, skip this check entirely — existing H1-H13, H-E2E, H-NFR, H-GOV, H-ADAPTER, H-INF, H-MIG blocks are unaffected. See H-DESIGN detail section below. | pipeline-state.json + story's declared touched files + DESIGN.md |`

Add a new detail section after `### H-MIG — Migration-review gate detail`'s own content (after line ~241), with the same structure as H-INF/H-MIG's own detail sections: an HTML comment anchor (`<!-- h-design-block -->`), a **Trigger condition** paragraph, then AC1 (FAIL — non-token color found, naming file+value)/AC2 (PASS — no non-token colors found) cases with the exact `> ❌ **H-DESIGN FAIL — ...**` / `> ✅ **H-DESIGN PASS — ...**` blockquote format every other hard block uses. Reference `scripts/check-design-tokens.js` explicitly as the mechanism an agent should run.

- [x] **Step 3: Verify AC3/AC4/AC5-documentation tests pass; re-run existing H-INF/H-MIG test coverage for regression**

`node tests/check-h-design-gate.js` — all pass.
`node tests/check-inf4-h-inf-gate.js && node tests/check-mig3-h-mig-gate.js` — confirm both still pass unchanged (proves AC5's "existing hard blocks unaffected" claim empirically, not just by assertion).

- [x] **Step 4: Complete task**
- Check off this task
- Ending git SHA: `cbf779a8`
- Commit: `feat(dsa-s5): add H-DESIGN conditional hard block to /definition-of-ready (AC3, AC4, AC5)`

---

## Task 3: Full regression verification + npm test — ✅ COMPLETE (clean, 685 files, 2 already-acknowledged baseline failures)

**Files:** verification only, no source changes expected (fix forward if Tasks 1-2 missed something).

- [ ] **Step 1: Re-run all of this story's own new/modified test files together**: `node tests/check-design-tokens-scan.js && node tests/check-h-design-gate.js && node tests/check-inf4-h-inf-gate.js && node tests/check-mig3-h-mig-gate.js`

- [ ] **Step 2: Run the full Node suite**: `npm test`. Expect the same 3 already-acknowledged baseline failures (`tests/check-bri-s2.2-neon-staging-branch.js` — confirmed test-order-pollution artifact at `/branch-setup`, passes standalone; `tests/check-p3.5-validate-trace.js`; `tests/check-pcr-s1-test-runner.js`) — re-run any standalone to confirm before flagging as new.

- [ ] **Step 3: No live browser render check** — this story has zero UI/rendering ACs (confirmed by the test plan's own explicit "Coverage gaps: None... Step 3a's E2E/browser-layout detection does not trigger on any of this story's ACs" and by `dsa-s5-dor.md`'s own H-E2E hard block: "No layout-dependent ACs exist at all — this story has no UI/rendering component"). State this explicitly in `/verify-completion`'s own report rather than silently omitting the check — this is a genuine N/A, not a skipped step.

- [ ] **Step 4: Commit if any fixes were needed** (separate commit, own clear message).

---

## Post-plan note for /verify-completion

This story's diff touches no route/handler files and no rendered UI — the mandatory route/handler E2E coverage check and the mandatory live browser render check are both N/A by design, not RISK-ACCEPTed gaps. State this explicitly in the completion report.

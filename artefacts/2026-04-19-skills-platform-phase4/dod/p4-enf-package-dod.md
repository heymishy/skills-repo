# Definition of Done — p4-enf-package

**Story:** p4-enf-package — Governance Package Shared Core
**Epic:** E3 — Enforcement Runtime
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20
**Commit:** b6a4f03

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | `src/enforcement/governance-package.js` exists and exports all five entry points | PASS | T1a, T1b, T1 ×5 — 7 assertions passing |
| AC2 | `resolveSkill` locates SKILL.md under sidecarRoot, returns `{ skillId, content, contentHash }` with 64-char SHA-256 hex | PASS | T2a–T2d — 4 assertions passing |
| AC3 | `verifyHash` returns `{ error: "HASH_MISMATCH", skillId, expected, actual }` on mismatch; returns `null` on match; does not throw | PASS | T3a–T3f, T4, T5 — 9 assertions passing |
| AC4 | `evaluateGate` returns `{ passed: boolean, findings: string[] }` for named gates | PASS | T6a–T6b — 2 assertions passing |
| AC5 | `advanceState` validates the declared transition and returns `{ current: next, previous: current }` | PASS | T7a–T7b — 2 assertions passing |
| AC6 | `writeTrace` returns a trace object with all required fields; optionally writes to `outputPath` | PASS | T8 — 6 field assertions passing |
| AC-NFR1 | `verifyHash` function body contains no `force`, `skip`, or `bypass` parameter (C5 compliance) | PASS | T-NFR1a–T-NFR1c — 3 assertions passing |
| AC-NFR2 | Module contains no external network calls (`require('http')`, `require('https')`, `fetch(`, `require('dns')`) | PASS | T-NFR2a–T-NFR2d — 4 assertions passing |

All 8 ACs satisfied. All 36 test assertions passing (11 test IDs, 36 check points).

---

## Test Run Evidence

```
node tests/check-p4-enf-package.js

[p4-enf-package] Results: 36 passed, 0 failed
```

Full suite (`npm test`) — zero failures across all governance check scripts.

---

## Implementation Notes

**File created:** `src/enforcement/governance-package.js` (177 lines)

**Five exports:**
- `resolveSkill({ skillId, sidecarRoot })` — walks three candidate paths under sidecarRoot (`.skills/`, `.github/skills/`, root), reads SKILL.md, computes SHA-256 via `crypto.createHash('sha256')`, returns `{ skillId, content, contentHash }` or `null` if not found.
- `verifyHash({ skillId, expected, actual })` — pure comparison, no I/O, no override parameters. Returns `{ error: 'HASH_MISMATCH', skillId, expected, actual }` or `null`.
- `evaluateGate({ gate, context })` — rule-based switch on gate name ('dor', 'review', 'test-plan', 'definition-of-done'); returns `{ passed: boolean, findings: string[] }`.
- `advanceState({ current, next, declaration })` — validates declared nodes and allowedTransitions; returns `{ current: next, previous: current }` or `null` if transition not permitted.
- `writeTrace({ skillId, skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp, outputPath? })` — assembles trace entry object; optionally writes JSON to outputPath via `fs.writeFileSync`; returns the entry object.

**Architecture constraints met:**
- No `require('http')`, `require('https')`, `require('dns')`, no `fetch(` anywhere
- `verifyHash` function body contains none of the prohibited override words
- All directory/path injection via caller parameters (ADR-004 compliant)
- No pipeline-state.json writes from within the module (MC-CORRECT-02)
- No credentials or session tokens in any output (MC-SEC-02)

**Deviations:** None. Implementation path `src/enforcement/governance-package.js` matches the test file hardcoded path exactly. No files outside the DoR contract scope were modified.

---

## C4 Gate Status

C4 (ADR-phase4-enforcement must be committed before p4-enf-package proceeds): SATISFIED — ADR committed in prior story p4-enf-decision (commit `42fa1a9`, DoD complete `ae90b36`).

---

## Metric Signal

p4-enf-package delivers the first concrete enforcement runtime artefact for Phase 4. The shared core is now available for p4-enf-mcp and p4-enf-cli to import, enabling the MCP and CLI surface adapters to use verified skill resolution, hash verification, and trace writing without duplicating the enforcement logic.

Benefit metric M1 (inner-loop unassisted completion rate): TDD cycle completed without operator intervention — RED baseline confirmed, GREEN achieved in one implementation pass with one NFR fix iteration.

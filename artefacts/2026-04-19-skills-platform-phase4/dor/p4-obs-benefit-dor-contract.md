# DoR Contract: p4-obs-benefit — Benefit measurement expansion

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-benefit.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-benefit-dor.md
Signed: 2026-04-20
Oversight: Medium — peer review required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `scripts/record-benefit-comparison.js` | New script — comparison report generation and summary |
| `tests/check-p4-obs-benefit.js` | New test file — 12 tests covering all ACs |
| `workspace/experiments/benefit-comparison-*.md` | New files written by script at runtime (not committed by agent) |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `workspace/estimation-norms.md` | Read-only — script reads it; agent must not modify |
| `.github/pipeline-state.json` | Read-only — no writes to pipeline state |
| `pipeline-state-archive.json` | Read-only — no writes |
| `workspace/experiments/EXP-001-discovery-phase4-5/` | Read reference only — `experiment_ref` field points here; agent does not modify contents |
| `artefacts/`, `.github/skills/`, `standards/` | Pipeline artefacts — no changes |
| `scripts/archive-completed-features.js` | Imported via require for mergeState(); not modified |
| `package.json` | No new npm dependencies — built-in Node.js modules only |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| psa.1 (`archive-completed-features.js`) | DoD-complete ✅; `mergeState()` export present |
| EXP-001 directory (`workspace/experiments/EXP-001-discovery-phase4-5/`) | Committed ✅ |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `recordComparison` writes report at correct path with platform actuals | T1, T9, T10 |
| AC2 | Report contains 8 YAML front-matter fields + comparison table | T2, T3, T4 |
| AC3 | `--summary` outputs markdown table with required rows | T5, T6 |
| AC4 | `experiment_ref` field present in front-matter | T7, T8 |

---

## Architecture Constraints (binding)

- ADR-001: CommonJS only — no ESM, no TypeScript
- No external npm packages — built-in Node.js modules only (`fs`, `path`, `readline`)
- Write target: `workspace/experiments/` only — no writes to pipeline state files
- YAML front-matter: scalar values only (string, number, null) — no nested objects
- Delta formula: `Math.round((platform - traditional) / traditional * 100)` — negative = faster/cheaper
- MC-SEC-02: no credentials, tokens, or operator personal identifiers in any report output

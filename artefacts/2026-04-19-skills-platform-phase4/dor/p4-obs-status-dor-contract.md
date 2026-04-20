# DoR Contract: p4-obs-status — Generate pipeline status report

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-status.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-status-dor.md
Signed: 2026-04-20
Oversight: Medium — peer review required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `scripts/generate-status-report.js` | New script — daily and weekly report generation |
| `tests/check-p4-obs-status.js` | New test file — 11 tests covering all ACs |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `scripts/archive-completed-features.js` | Read via require only — do not modify |
| `.github/pipeline-state.json` | Read-only — script must not write state |
| `pipeline-state-archive.json` | Read-only — script reads archive only |
| `artefacts/`, `.github/skills/`, `standards/` | Pipeline artefacts — no changes |
| `dashboards/` | Viz changes are p4-obs-archive scope |
| `.github/pipeline-state.schema.json` | No new fields required for this story |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| psa.1 (`archive-completed-features.js`) | DoD-complete ✅; `mergeState()` export present |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Daily report — 5 sections + in-flight story rendering | T2, T3 |
| AC2 | Weekly report — 5 sections + metric signal table | T4, T5 |
| AC3 | `--output` writes file; without it, stdout only | T6, T7 |
| AC4 | Archive integration — weekly "This Week" counts by dodAt date | T8, T9 |
| AC5 | No hardcoded org names in output | T10 |

---

## Architecture Constraints (binding)

- ADR-001: CommonJS only — no ESM, no TypeScript
- Read-only: no writes to any pipeline state file
- ADR-004 equivalent: no hardcoded org names, feature slugs, or operator names in source or output
- MC-SEC-02: no credentials, tokens, or API keys in any output

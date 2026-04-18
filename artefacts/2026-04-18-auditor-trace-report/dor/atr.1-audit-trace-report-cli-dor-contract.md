# DoR Contract: atr.1 — Generate standalone audit trace report from CLI

## Touch points

### Files to CREATE
| File | Purpose |
|------|---------|
| `scripts/trace-report.js` | Main report generation script with `generateReport()` export and CLI entry point |
| `tests/check-trace-report.js` | 12 unit tests covering all 7 ACs + 1 NFR test |
| `tests/fixtures/trace-report-test-fixture.json` | Synthetic pipeline-state data for tests |

### Files to MODIFY
| File | Change |
|------|--------|
| `package.json` | Add `check-trace-report.js` to the test script glob |

### Files NOT to modify (out of scope)
- `scripts/validate-trace.sh`
- `.github/skills/trace/SKILL.md`
- Any file under `artefacts/`
- `.github/pipeline-state.json`
- `.github/pipeline-state-archive.json`
- `scripts/archive-completed-features.js`

## Schema dependencies
No upstream story dependencies — `schemaDepends` check not required.

## Architecture constraints
- **ADR-011:** Must read both `pipeline-state.json` and `pipeline-state-archive.json` using the merge pattern from psa.1
- **No external deps:** Node.js `fs`, `path`, `crypto` only
- **Read-only:** Script must not write any files; output to stdout only

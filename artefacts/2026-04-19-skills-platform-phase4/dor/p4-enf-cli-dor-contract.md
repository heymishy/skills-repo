# DoR Contract: p4-enf-cli — CLI enforcement adapter

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-cli-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/commands/init.js` | Sidecar + lockfile install |
| `src/commands/fetch.js` | Upstream content retrieval |
| `src/commands/pin.js` | Lockfile update |
| `src/commands/verify.js` | Hash re-check |
| `src/commands/workflow.js` | Workflow declaration read and display |
| `src/commands/advance.js` | Governed state transition with hash check (ADR-002 + C5) |
| `src/commands/back.js` | Back-navigation to permitted prior state |
| `src/commands/navigate.js` | Arbitrary permitted transition |
| `src/commands/emit-trace.js` | Trace artefact emission |
| `src/cli.js` (entry point) | Command routing |
| `schemas/trace.schema.json` | If Spike B2 identified a schema delta — add `executorIdentity` optional field |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-cli.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| `src/governance-package/` | Governance package is p4-enf-package; this story imports it |
| Mode 2/3 command implementations | Craig's discovery explicitly deferred; Phase 4 is Mode 1 only |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-b2 | Non-null verdict (provides Assumption A2 result and gap analysis) |
| p4-enf-decision | ADR committed and heymishy-approved |
| p4-enf-package | Complete (exports governance package entry points) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | All 9 commands implemented with ≥1 unit test each | T2–T10 |
| AC2 | `advance` to non-permitted state → non-zero exit + named message | T11, T12 |
| AC3 | `advance` with hash mismatch → non-zero exit + named message | T13, T14 |
| AC4 | `emit-trace` passes `validate-trace.sh --ci`; no new parallel gate | T15, T16 |

---

## Architecture Constraints (binding)

- **C5:** `advance` calls `verifyHash` before envelope build; mismatch aborts; no `--skip-verify` flag permitted
- **ADR-004:** All config from `.github/context.yml`; no hardcoded URLs, paths, or upstream references
- **ADR-002:** `advance` enforces `allowedTransitions` from workflow graph declaration
- **MC-SEC-02:** No credentials, API keys, or operator-identifiable data in CLI output, trace artefacts, or config files

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-enf-cli.js`
2. `scripts/validate-trace.sh --ci` passes on `emit-trace` fixture output
3. PR opened as draft; heymishy explicit approval required before merge

# DoR Contract: p4-nta-standards-inject — Standards injection for non-technical discipline roles

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-standards-inject.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-nta-standards-inject-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/teams-bot/standards-injector.js` | Standards resolver + injector; reads from sidecar |
| `src/teams-bot/session-config.js` | Discipline role declaration at session init |
| `src/teams-bot/handler.js` | Extend message handler to prepend standards context |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-nta-standards-inject.js` | Already written |
| `standards/` | Standards files are read-only; this story reads them |
| `artefacts/`, `.github/skills/` | No changes |
| Standards file authoring | Platform standards authoring process; not this story |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-d | PROCEED verdict |
| p4-nta-surface | Complete (bot runtime handles message ordering) |
| p4-dist-install | Parallel dep — sidecar must be installable for standards injection to work; graceful fallback if absent |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Standards before question (C7 ordering); content ≤1,200 chars | T2, T3 |
| AC2 | Standards from installed sidecar (C5); no remote fetch | T4, T5 |
| AC3 | Sidecar absent → graceful fallback; note appended; `standards_injected: false` | T6, T7 |
| AC4 | Discipline role → only role-applicable standards injected | T8, T9 |

---

## Architecture Constraints (binding)

- **C7:** Standards content delivered before question; ordering is mandatory in bot message sequence
- **ADR-004:** Standards file paths from `context.yml`; no hardcoded paths to standards files
- **C5:** Standards read from hash-verified sidecar install; no remote URL fetch at session time
- **MC-SEC-02:** Standards content not sent to external logging or analytics services during injection

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-nta-standards-inject.js`
2. Fallback path tested: AC3 confirmed by unit test (sidecar absent → graceful continue)
3. PR opened as draft; heymishy explicit approval required before merge

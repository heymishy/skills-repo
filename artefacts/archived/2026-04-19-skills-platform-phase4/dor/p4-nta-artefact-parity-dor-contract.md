# DoR Contract: p4-nta-artefact-parity — Artefact landing parity for bot sessions

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-artefact-parity.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-nta-artefact-parity-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/teams-bot/artefact-assembler.js` | Template-based artefact assembly from participant responses |
| `src/teams-bot/commit-handler.js` | GitHub API commit to origin branch (not fork) |
| `src/teams-bot/session-store.js` | Partial session persistence for resumption (AC4) |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-nta-artefact-parity.js` | Already written |
| `.github/templates/` | Templates are read-only; not modified |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Git-native artefact production | This story covers bot sessions only |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-d | PROCEED verdict |
| p4-nta-surface | Complete (bot runtime handles session conversation) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | All required template fields populated; no placeholders; passes template schema | T2, T3 |
| AC2 | Bot artefact passes governance check suite (`npm test`) — same as git-native | T4, T5 |
| AC3 | Committed to origin branch (not fork) via installation token; branch name follows convention | T6, T7 |
| AC4 | Interrupted session → resumes from last answered question; no partial commit | T8, T9 |

---

## Architecture Constraints (binding)

- **Template adherence / MC-CORRECT-02:** Artefact assembler reads `.github/templates/`; no new fields, renamed fields, or omitted required fields; template schema validated by `npm test`
- **C1:** Commit to origin branch using bot installation token; no fork; branch: `chore/nta-<feature-slug>-<date>`
- **ADR-004:** Artefact target paths from `context.yml.artefacts.root`; no hardcoded paths
- **MC-SEC-02:** No participant PII beyond what git-native sessions write; no external logging of responses

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-nta-artefact-parity.js`
2. Template schema validation test confirms no placeholder fields in committed artefact
3. PR opened as draft; heymishy explicit approval required before merge

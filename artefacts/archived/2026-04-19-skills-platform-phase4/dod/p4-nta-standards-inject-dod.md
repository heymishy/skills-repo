# Definition of Done — p4-nta-standards-inject

**Story:** p4-nta-standards-inject — Sidecar standards injection for Teams bot sessions
**Epic:** E4 — Non-Technical Access
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20

## AC coverage

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `injectStandards` with sidecar present → `standardsContent` (non-empty string) + `standardsInjected: true` | PASS |
| AC2 | `standardsContent` is a distinct field from `question` (C7 ordering: standards separate from question) | PASS |
| AC3 | No HTTP/HTTPS fetch in source (C5 — hash-only fetch) | PASS |
| AC4 | Sidecar unavailable → `standardsInjected: false`, no throw | PASS |
| AC5 | Unavailability note contains "sidecar not installed" and "skills-repo init" | PASS |
| AC6 | `role: product-manager` → only product standards injected (no security-engineering, no software-engineering) | PASS |
| AC7 | `role: risk-reviewer` → no software-engineering content | PASS |
| AC8 | No `console.log(standardsContent)` or `console.log(...content...)` in source (MC-SEC-02) | PASS |
| AC9 | No hardcoded standards file paths (ADR-004) | PASS |

## Test results

- **Test file:** `tests/check-p4-nta-standards-inject.js`
- **Results:** 24/24 assertions passing
- **npm test:** exit 0, no regressions

## Implementation

**File:** `src/teams-bot/standards-injector.js`

`injectStandards({ step, role, sidecarRoot, question })` uses a `ROLE_DISCIPLINE_MAP` to resolve which sidecar subdirectories to read for a given role. Reads all matching `standards.md` files from the sidecar root (injected by the caller — ADR-004). Returns gracefully with `standardsInjected: false` and a guidance note if the sidecar directory is unavailable. No HTTP calls, no hardcoded file paths.

## Deviations

None.

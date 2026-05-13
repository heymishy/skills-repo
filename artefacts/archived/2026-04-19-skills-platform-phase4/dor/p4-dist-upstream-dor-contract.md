# DoR Contract: p4-dist-upstream — Upstream authority configuration

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upstream.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-upstream-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/config.js` (or `src/get-upstream-url.js`) | `getUpstreamUrl(config)` implementation |
| `src/commands/fetch.js`, `pin.js`, `upgrade.js` | Integrate `getUpstreamUrl` (replace any hardcoded URL references) |
| `tests/fixtures/` | Fixture context.yml files with/without `skills_upstream.repo` |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-upstream.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-c | Non-null verdict — provides `skills_upstream` block schema |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Valid `skills_upstream.repo` → URL used; no hardcoded fallback | T2, T3 |
| AC2 | Absent/empty → non-zero exit + named error before network call | T4, T5 |
| AC3 | URL changed in context.yml → new URL used + recorded in lockfile | T6, T7 |
| AC4 | Governance check confirms no hardcoded URL in distribution source files | T8, T9 |

---

## Architecture Constraints (binding)

- **ADR-004:** `context.yml.skills_upstream.repo` is the sole URL source
- **C5:** Upstream content hash-verified even when URL is authoritative
- **MC-CORRECT-02:** `skills_upstream` block validated against context.yml schema
- **MC-SEC-02:** URL treated as opaque string; no speculative DNS resolution

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-dist-upstream.js`
2. Governance check (AC4) confirms no hardcoded URLs in distribution source files
3. PR opened as draft; heymishy review required

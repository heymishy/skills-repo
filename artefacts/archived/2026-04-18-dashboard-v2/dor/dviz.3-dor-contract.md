# DoR Contract — dviz.3-governance-check

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.3`
**Status:** Signed-off ✅

---

## File touchpoints

| # | File | Action | Justification |
|---|------|--------|---------------|
| 1 | `tests/check-dashboard-viz.js` | CREATE | Governance script — dynamic node --check across dashboards/*.js |
| 2 | `package.json` | MODIFY | Add check-dashboard-viz.js to test chain |

---

## Out-of-scope constraints (do NOT touch)

- `tests/check-viz-syntax.js` — covers `pipeline-viz.html`; do not rename, modify, or fold into the new script
- `dashboards/*.js` — read-only inputs to this check; do not modify
- `artefacts/`, `.github/skills/`, `.github/templates/` — protected; do not modify
- Any file not in the explicit touchpoint list above

---

## Schema dependencies

None. This story adds a governance check script only.

---

## Security constraints

- No credentials or tokens in the check script
- Script uses only Node.js built-in modules: `fs`, `child_process`, `path`
- No external npm packages needed

---

## Implementation invariant

The script must use dynamic directory enumeration (`readdirSync`) and must not hardcode individual file names. This is AC2 — if a new `.js` file is added to `dashboards/`, the check must automatically cover it without code changes to the script.

---

## Dependency on other dviz stories

- dviz.3 has no dependency on dviz.1 or dviz.2.
- dviz.3 can be merged first — it will pass against the existing `dashboards/*.js` files (T6 integration test).
- After dviz.1 lands and adds `pipeline-adapter.js`, dviz.3's governance check will automatically cover it at next run.

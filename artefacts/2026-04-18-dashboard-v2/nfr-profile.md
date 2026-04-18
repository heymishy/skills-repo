# NFR Profile: Dashboard v2

**Feature:** `2026-04-18-dashboard-v2`
**Status:** Active

---

## Data classification

**Data processed:** `pipeline-state.json` field values (story slugs, stage names, health status, URLs) — all controlled internal pipeline metadata. No personal data, no credentials, no sensitive regulated data.
**Classification:** Internal / non-sensitive.

---

## NFR categories

### Performance
No explicit SLA required. Dashboard must load and render within a reasonable time (< 3 s on a standard connection) for a file of typical `pipeline-state.json` size (< 100 KB). Acceptable: static file serving via GitHub Pages.

### Security (MC-SEC-02 reference)
- `pipeline-adapter.js` must not contain credentials, API keys, or personal identifiers.
- All rendering is via React virtual DOM — no `innerHTML` with user-supplied content.
- The Pages workflow must not embed PATs or tokens — `GITHUB_TOKEN` only.
- No authentication layer is in scope (public repository, operator-level access control only).

### Availability
Served via GitHub Pages / CDN. Availability is GitHub's responsibility. No uptime SLA owned by this feature.

### Compliance
None — `regulated: false`, `complianceFrameworks: []`.

### Data residency
Not applicable — no data storage by the dashboard itself. `pipeline-state.json` remains in the Git repository.

### Consistency
The dashboard reflects `pipeline-state.json` at the time the page is loaded (or at the last GitHub Pages deploy). No real-time updates in scope. Staleness is acceptable and expected.

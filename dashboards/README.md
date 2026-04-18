# Dashboards

Self-contained static HTML artifacts for the portfolio and feature pipelines.
No build step. No external network calls beyond the React + Babel CDN
`<script src="…">` pins already in the HTML.

## What's in here

| File | Role |
| --- | --- |
| `index.html` | Repo (portfolio) dashboard — cycles × epics × stories, plus Outcomes, Governance, Guardrails, Story map, Benefits, Fleet tabs |
| `pipeline.html` | Feature (single-cycle) dashboard |
| `md-renderer.js` | Markdown viewer for artefact peeks |
| `artefact-content.js` | Mock artefact content loaded by the viewer |
| `extra-data.js` | Mock data for the six non-pipeline views |
| `extra-views.css` | Styles for those six views |

All five files must live in the same directory — they're loaded via
relative `<script src>` / `<link href>`.

## GitHub Pages

A workflow at `.github/workflows/pages.yml` publishes this folder whenever
anything under `dashboards/` changes on `main`.

**One-time setup (repo admin):**

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**
2. Push to `main`. The workflow will run and report the live URL.

Default URL pattern: `https://<org>.github.io/<repo>/`
(the folder's `index.html` is served at the root).

## Bitbucket / enterprise / local

Same folder, any static server works. Pick one:

```sh
# quickest — zero deps, python 3
cd dashboards && python -m http.server 8080
# open http://localhost:8080/

# node
npx serve dashboards/

# nginx (rough sketch)
#   location /dashboards/ { alias /srv/<repo>/dashboards/; }
```

For Bitbucket instances that expose static hosting (Bitbucket Pages,
Bitbucket Cloud artifact hosting, or a companion nginx), point the host at
this directory — no rewriting or build needed.

## Notes

- Tab state, theme, density, layout persist in `localStorage` per origin.
- "Tweaks" panel (keyboard: `t`) is a development affordance; it saves
  values back into the HTML via `postMessage` only when running inside the
  design environment, and is a no-op when served from Pages or a plain
  static host.
- Links between the two dashboards are relative (`index.html` ↔
  `pipeline.html`), so they work identically on Pages, Bitbucket, and
  `file://` double-click.

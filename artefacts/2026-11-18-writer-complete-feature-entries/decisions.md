# Decisions: the app records complete feature entries (wfe-s1, issue 1146)

**2026-11-18 | DECISION | Fill the schema's required fields with defaults when either writer creates a feature**
**Context:** the first feature started in the web app after the pipeline-state writer shipped (`new-feature-c2a2815d`, commit `dbea58fcb`) was recorded as `{ slug, id, discoveryStatus, artefact }`. The schema requires `name`, `track`, `stage` and `health` as well, so the integrity check (C11, C15, C16), trace validation's `schema_valid` and `check-bfl-s2-real-ci-failures` failed on every open pull request until the entry was repaired by hand, twice (`935c260d5`, `42ff38856`).
**Decision:** when `pipeline-state-github-writer.js` (production) or `pipeline-state-writer.js` (local file system) creates a feature, it sets `name` (the update's string `name`, else the slug), `track: 'standard'`, `stage: 'discovery'` and `health: 'green'`. The update's own `stage` and `health` still overwrite the defaults through the existing feature-level loop; an existing feature is never touched.
**Rationale:** the two writers share one contract and the defaults are the smallest set that satisfies the schema; fixing only the production one would let them drift. A feature started in the app is assumed standard-track because it begins at discovery.
**Limits:** the production path is proved against a stubbed GitHub API (the same way `check-wsd-s2` does); the first live confirmation is the next feature started in the app.

**2026-11-18 | NOTE | Not decided here: whether the app should write an entry whose artefact it has not committed**
`new-feature-c2a2815d`'s entry points at `artefacts/new-feature-c2a2815d/discovery.md`, which is not in the repository. Whether the writer should refuse (or defer) an entry for an uncommitted artefact, and whether it should validate the whole state against the schema before pushing it, are separate stories; neither is needed to stop the CI breakage.

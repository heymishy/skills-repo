# Contract Proposal: Multi-feature navigation and artefact browser

**Story:** wuce.6
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /features` — returns feature list for configured repositories
- Express route handler: `GET /features/:featureSlug` — returns artefact index for a feature, grouped by stage with plain-language labels
- Feature list adapter: `src/adapters/feature-list.js` — `listFeatures(token)` — scans repository artefacts directory; validates read access per repo
- Artefact index adapter: `src/adapters/artefact-list.js` — `listArtefacts(featureSlug, token)` — returns artefacts for a feature grouped by pipeline stage
- Plain-language label mapping: `discovery` → "Discovery", `benefit-metric` → "Benefit Metric", `stories` → "Stories", `test-plans` → "Test Plan", `dor` → "Ready Check"
- No-artefacts-dir handling: repository entry shown as "No artefacts found" (not an error page) when artefacts directory is absent

## Components NOT built by this story

- Search or keyword filtering across features
- Sorting by owner, team, or priority
- Non-GitHub repository support
- Any create or edit capability (read-only)
- Dependency graph or cross-feature dependency view

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `/features` list with slug/stage/date/link | `GET /features returns list with feature slug`, `feature shows current pipeline stage`, `feature shows last-updated date`, `feature shows link to artefact index` |
| AC2 | Feature click → artefact index with plain-language labels | `feature index shows "Discovery" not "discovery"`, `feature index shows "Ready Check" not "dor"`, `no raw internal type identifiers in rendered output` |
| AC3 | Artefacts grouped by stage | `artefact index groups discovery artefacts under Discovery heading`, `artefact index groups dor artefacts under Ready Check heading` |
| AC4 | Artefact link → wuce.2 view | `artefact link points to /artefact route with repo and path params`, `clicking link renders artefact via wuce.2 handler` |
| AC5 | No-artefacts-dir → "No artefacts found" | `repo with no artefacts/ directory → "No artefacts found" not error`, `repo with empty artefacts/ → "No artefacts found"` |

## Assumptions

- Repository artefacts are organised under `artefacts/[feature-slug]/` subdirectories as per pipeline conventions
- Pipeline stage is determined by the presence of artefact types in the feature directory (discovery, benefit-metric, stories, test-plans, dor, etc.)
- The `listFeatures` adapter validates GitHub API read access per repository before listing

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/features.js` | Create | Feature list and artefact index route handlers |
| `src/adapters/feature-list.js` | Create | `listFeatures` adapter |
| `src/adapters/artefact-list.js` | Create | `listArtefacts` adapter |
| `src/utils/plain-language-labels.js` | Create | Internal type → plain-language label mapping |
| `src/app.js` | Extend | Mount features routes |
| `tests/feature-navigation.test.js` | Create | 19 Jest tests for wuce.6 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.

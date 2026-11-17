# Contract Proposal - Three quarantined browser specs are rewritten against the product as it is and join the core suite

**What will be built:**
- `tests/e2e/reference-upload.spec.js`, `tests/e2e/dsda-s1-default-all-stories.spec.js` and `tests/e2e/iwu2-right-panel-layout.spec.js` rewritten as described in the story; `tests/e2e/capability-matrix.json` entries for the three moved to `lane: core` with the quarantine fields removed.
- A `decisions.md` entry and a Definition of Done.

**What will NOT be built:**
- No change under `src/` (no UI entry for the reference modal, no fix for the bare-API-session `TypeError`); no change to the other 13 quarantined entries; no new `tests/check-*.js` file.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `reference-upload.spec.js` T9 to T15 | browser |
| AC2 | `dsda-s1-default-all-stories.spec.js` | browser |
| AC3 | `iwu2-right-panel-layout.spec.js` | browser |
| AC4 | `check-lpw-s2-capability-matrix`, `check-lpw-s3-matrix-reason`, count read | unit |
| AC5 | core lane with `--workers=1`; `git diff --stat` shows no `src/` path | browser + diff |

**Assumptions:** `POST /api/journey` with the home page's CSRF token and `POST /api/skills/:name/sessions` both work in test mode (both used by passing specs today); `/journey/:id/reference-modal`, `/reference` and `/stories` are served unchanged (read in `server.js`).

`schemaDepends: []`. **Estimated touch points:** Files: 4 plus artefacts. Services: none.

**Exclusion list check (B1/D1):** `src/` is excluded and no test here asserts a file under it other than through the running server.

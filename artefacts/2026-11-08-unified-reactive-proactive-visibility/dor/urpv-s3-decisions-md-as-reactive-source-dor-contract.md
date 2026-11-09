## Contract Proposal — Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**What will be built:**
A new parser module (function, not a new file necessarily — location TBD at implementation, likely alongside the existing `decisions-log-writer.js` in `src/web-ui/adapters/` or `modules/`) that reads a feature's `decisions.md` via the existing `fetchRepoPath` primitive (`src/web-ui/adapters/artefact-fetcher.js`), tolerantly parses entries matching the `**YYYY-MM-DD | CODE | phase**` header convention, extracts `RISK-ACCEPT`/`SCOPE`-coded entries only (date, code, decision-title from the `**Decision:**` line), skips malformed entries with a server-side log, and returns an empty list on fetch failure (404 or otherwise) without throwing. `src/web-ui/routes/products.js`'s `_renderConsolidatedFeaturesSection` renders the returned items as additional reactive-work entries, HTML-escaped.

**What will NOT be built:**
Parsing of any `decisions.md` entry type other than `RISK-ACCEPT`/`SCOPE` (ARCH, ASSUMPTION, SLICE entries are read but discarded). Caching of `decisions.md` content — this fetches live per page load for the MVP.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests parsing well-formed RISK-ACCEPT and SCOPE fixture entries | unit |
| AC2 | Unit test asserting ARCH/ASSUMPTION/SLICE entries are excluded | unit |
| AC3 | Unit + integration test: malformed entry skipped, well-formed entries still render, server-side log emitted | unit, integration |
| AC4 | Unit + integration test: fetch failure → empty list, page renders normally | unit, integration |

**Assumptions:**
- The real `decisions.md` prose format (bolded header line, optional field order) stays consistent with the convention already observed across this repo's own real `decisions.md` files (used as the fixture model) — if a feature's `decisions.md` deviates further, that is a new malformed case the AC3 path already handles gracefully, not a new assumption.
- No new GitHub API scope/permission is required — `fetchRepoPath` already reads arbitrary repo paths for the already-granted OAuth token.

**Estimated touch points:**
Files: new parser function (location decided at implementation — `src/web-ui/adapters/` or `src/web-ui/modules/`), `src/web-ui/routes/products.js` (_renderConsolidatedFeaturesSection — render the new item source). Services: none new. APIs: none new — reuses `fetchRepoPath`.

**schemaDepends:** `["dorStatus"]` — Dependencies names urpv-s1 as upstream (repo must be connected and syncable). `dorStatus` confirmed present in `.github/pipeline-state.schema.json`.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. The malformed-entry (AC3) and missing-file (AC4) graceful-degradation paths are both explicitly named in the proposal, matching the story's own Architecture Constraints note that the parser "must tolerate variation in field order and optional fields... not assume a rigid, fully-schematized format."

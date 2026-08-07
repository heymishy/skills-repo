**Contract Proposal — Surface discovery-only and ideation-only work in a Roadmap tab**

**What will be built:** A `scanRoadmapArtefacts()` function scanning `artefacts/` for folders with `discovery.md`/`ideate.md` but no corresponding `pipeline-state.json` entry, plus a new Roadmap tab rendering the results.

**What will NOT be built:** The full sync/cache pipeline (deferred per discovery). Editing/progressing artefacts from this tab.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit + integration test on discovery-only detection | unit / integration |
| AC2 | Unit test on ideate-only distinct labelling | unit |
| AC3 | Unit test on already-tracked exclusion | unit |
| AC4 | Unit + integration test on empty state | unit / integration |

**Assumptions:** Scanning is done at render time (read-only file scan), not cached — acceptable given this repo's current scale (~100 feature folders).

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, a new `src/web-ui/modules/roadmap-scan.js`
Services: None new (local filesystem read only)
APIs: None new

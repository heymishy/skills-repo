## Contract Proposal — Provide a create/edit form for a guardrail or standard

**What will be built:**
"Add" and "Edit" UI actions on `wugs-s2`/`wugs-s3`'s rendered views. A form with a content textarea, pre-filled via `wugs-s1`'s fetch for Edit. Server-side handler validating non-empty content before forwarding to `wugs-s6`'s write adapter with the target path (product or org repo, based on section).

**What will NOT be built:**
Markdown preview. Concurrent-edit conflict handling beyond what GitHub's SHA mechanism (`wugs-s6`) already provides.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, render check for Add/Edit actions | unit |
| AC2 | Unit test, mocked pre-fill content | unit |
| AC3 | Unit test, empty-payload server-side rejection | unit |
| AC4 | Integration test, valid payload reaches mocked write-path adapter with correct content/target | integration |

**Assumptions:**
Depends on `wugs-s2` only (narrowed from `wugs-s2`+`wugs-s3` during DoR to break a circular dependency — see `decisions.md`, 2026-08-11). `wugs-s6` treated as a mocked seam for this story's own tests (real integration covered in `wugs-s6`'s own test plan).

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-wugs-s5-*.js` (new)
Services: None
APIs: None directly

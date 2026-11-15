# Contract Proposal - Make the coha-s7 structural tests pass in a Windows checkout with CRLF line endings

**What will be built:**
- In `tests/check-coha-s7-error-issue-incident.js`: line 732 reads the workflow text and normalises line endings (`.replace(/\r\n/g, '\n')`) at that one read; plus two new tests UT1 and UT2 from the test plan.

**What will NOT be built:**
- No change to the workflow, `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js`, any pin's wording, `.gitattributes` or `core.autocrlf`, and no audit of other test files.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 plus running the file in the Windows checkout (46 passed) | unit and manual run |
| AC2 | CI result of the pull request | CI |
| AC3 | UT2 (CRLF text passes W3's pattern, broken text fails it) | unit |

**Assumptions:** only line 732 reads the workflow (confirmed by grep); in an LF checkout UT1 passes before the change (the red state is visible only on Windows); the main checkout is the Windows reference.

`schemaDepends: []` - reads no `pipeline-state.json` field. H8-ext: no field declarations required.

**Estimated touch points:**
Files: `tests/check-coha-s7-error-issue-incident.js` (modified)
Services: None
APIs: None
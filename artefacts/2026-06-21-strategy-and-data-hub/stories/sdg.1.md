# Story sdg.1 — Reference upload modal UI

**User story:**
As a pipeline operator starting a new feature,
I want to upload markdown strategy/data files via a modal dialog in the journey flow,
So that I can ground the session in organisational strategy before running /ideate or /discovery.

## Acceptance criteria

**AC1 — Upload gate appears after new-product selection**
Given an operator is at the journey start gate ("Is this a new product or resuming existing?"),
When they select "new product",
Then a follow-up gate appears: "Would you like to ground this work in strategy or data?" (optional, may skip).

**AC2 — Modal displays file input and instructions**
Given the operator selects "yes" to strategy grounding,
When the reference upload modal opens,
Then a file input (`<input type="file" accept=".md">`) is displayed with clear instructions: "Upload one or more markdown files containing strategy, market data, or research".

**AC3 — File validation on selection**
Given the operator selects one or more .md files (up to 5 MB total),
When they click "Upload",
Then each file is validated: (a) file extension is .md, (b) file size ≤ 1 MB each, (c) content is valid UTF-8 text.
If any file fails validation, an error message appears: "[filename] is not a valid markdown file" and that file is not processed.

**AC4 — Files stored in reference directory**
Given validation passes for all selected files,
When the operator clicks "Confirm",
Then each file is written to `artefacts/[feature-slug]/reference/[original-filename]` using Node.js `fs.writeFileSync()`,
And the modal closes,
And the journey session state is updated to record the upload.

**AC5 — Skip option available**
Given the operator chooses not to upload files,
When they click "Skip" in the modal,
Then the modal closes and the journey proceeds to /ideate without strategy files (no error, no prompting).

**AC6 — Reference files recorded in session context**
Given files are uploaded successfully,
When the journey session loads the next skill,
Then the reference directory path and file list are available in `session.referenceFiles` (array of file path objects).

## Out of scope
- Non-markdown format support (Excel, PowerPoint, Power BI)
- File deduplication or conflict resolution if files with the same name exist
- Editing or deleting uploaded files post-upload (files are immutable once uploaded)
- Cloud data source authentication (OneDrive, SharePoint)
- Automatic file naming or sanitization (original filenames are preserved)

## Dependencies
None — this is the first story in the epic.

## NFR / Constraints
- **File upload UX:** Modal must be accessible via keyboard and screen reader (ARIA labels on file input, error messages)
- **File size validation:** Client-side validation before send; server-side validation before write
- **Error handling:** Invalid files do not block valid files; validation errors are specific and actionable
- **Character encoding:** Only UTF-8 is supported; files with other encodings are rejected with clear error
- **Security:** Path traversal guard required on all server-side file writes (NFR-sec-pathtraversal)

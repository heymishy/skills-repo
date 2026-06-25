# Story sdg.2 — Reference file persistence in journey state

**User story:**
As the skills pipeline,
I want to persist the list of uploaded reference files in the journey session state,
So that downstream skill sessions can retrieve and inject the content.

## Acceptance criteria

**AC1 — Journey state records file list**
Given files are uploaded in sdg.1,
When the upload completes and the journey transitions to the next gate,
Then the journey state object is updated: `journey.referenceFiles = [{path: "artefacts/[slug]/reference/[filename]", uploadedAt: "ISO8601-timestamp", sizeBytes: 1234}]`.

**AC2 — Reference files available to skill sessions**
Given the journey state includes referenceFiles,
When a skill session (e.g., /ideate) starts and calls `buildSystemPrompt()` with journey context,
Then the skill receives `context.referenceFiles` (array of file objects) as an argument to buildSystemPrompt.

**AC3 — Journey resume preserves reference files**
Given a journey session was interrupted (operator closes browser, navigates away),
When the operator resumes the journey at a later time,
Then the reference files list is still present in the journey state, unchanged.

**AC4 — Re-upload updates journey state**
Given the operator navigates backward in the journey (e.g., from /discovery back to the upload gate in sdg.1),
When they re-upload files (replacing or adding to prior uploads),
Then the journey state is updated to reflect the new file list,
And prior files remain accessible (immutable) until explicitly overwritten.

**AC5 — Multiple files tracked independently**
Given 3 reference files are uploaded,
When the journey state is queried,
Then all 3 files are present in the referenceFiles array with distinct path and metadata entries (no aggregation or deduplication).

## Out of scope
- Automatic file freshness checks or staleness warnings during a session
- Versioning or historical tracking of prior uploads (only current list is retained)
- Automatic cleanup of old reference files when new ones are uploaded
- Syncing reference files across multiple journeys

## Dependencies
sdg.1 (upload modal must exist and write files to reference directory)

## NFR / Constraints
- **Persistence:** Journey state is persisted in `workspace/state.json` or equivalent session store (backend-agnostic)
- **Atomicity:** journeyState update and file write are atomic; both succeed or both fail (no orphaned files)
- **Data structure:** referenceFiles array uses consistent object shape across all code paths

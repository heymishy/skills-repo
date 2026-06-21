# Epic 1: Reference File Upload and Storage

## Overview
Operator-facing capability for uploading markdown strategy/data files and storing them in a feature's reference directory. Independent epic — can be implemented first with no upstream dependencies.

## Stories in this epic
- sdg.1: Reference upload modal UI
- sdg.2: Reference file persistence in journey state
- sdg.3: Reference file content reading and validation

---

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

## Test strategy
- Unit: file validation logic (extension, size, encoding) tested in isolation
- E2E (Playwright): modal appears/disappears, file upload triggers validation, error messages display, successful upload closes modal
- Manual smoke: operator can upload 1-5 markdown files of various sizes; files appear in reference directory

---

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

## Test strategy
- Unit: journey state update logic tested; file list correctly recorded and retrieved
- Integration: upload (sdg.1) followed by journey navigation; reference files still present at next gate
- E2E: upload files, start /ideate, navigate back to upload gate, verify files still listed, re-upload new files, verify state updated

---

# Story sdg.3 — Reference file content reading and validation

**User story:**
As the skills pipeline,
I want to read uploaded markdown files from disk and validate their content,
So that the content can be injected into skill session system prompts safely.

## Acceptance criteria

**AC1 — File content read from disk**
Given a reference file path in `journey.referenceFiles`,
When a skill session's `buildSystemPrompt()` function is called with referenceFiles parameter,
Then each file is read from disk using `fs.readFileSync(filePath, 'utf8')`,
And the content is stored in memory as `{fileName, content, charCount}`.

**AC2 — Content validation: existence, encoding, size**
Given a file is read,
When content validation runs,
Then three checks pass: (a) file exists on disk at the recorded path (not deleted post-upload), (b) content is valid UTF-8, (c) content character count is ≤ 10,000 characters.
If any check fails, the file is skipped and a warning is logged (not an error — session continues).

**AC3 — Size exceeded handling**
Given a reference file contains > 10,000 characters,
When validation runs,
Then the file is NOT truncated (truncation could lose semantic meaning);
Instead, a warning is logged: `[WARN] Reference file [path] exceeds 10,000 char limit; file will not be injected`,
And the session proceeds without that file's content.

**AC4 — Token budget check (informational)**
Given reference content is about to be injected into the system prompt,
When the total token count is estimated (SKILL.md + reference files + prior artefacts),
Then a log entry records: `[INFO] System prompt tokens: SKILL=[N] + reference=[N] + prior=[N] = [total]/12000`,
And if total > 12,000, a warning is logged but the session does not abort (token budget is soft, not hard).

**AC5 — Multiple files validated independently**
Given 3 reference files are present,
When content reading and validation runs,
Then each file is validated independently;
If file A fails validation, files B and C are still processed,
And only successfully-validated files are stored for injection.

**AC6 — Encoding error handling**
Given a file is read but contains invalid UTF-8 sequences,
When decoding is attempted,
Then a warning is logged: `[WARN] Reference file [path] is not valid UTF-8; skipping`,
And that file is not injected into the system prompt.

## Out of scope
- Automatic content normalization or format conversion (markdown is injected as-is)
- Semantic analysis of file content (no parsing, no pattern extraction)
- Content modification, filtering, or redaction (files are injected verbatim)
- Caching of file content across sessions (content is re-read on each session)

## Dependencies
sdg.2 (reference file list must be persisted in journey state)

## NFR / Constraints
- **File I/O:** Use only Node.js built-ins (`fs.readFileSync`); no third-party file libraries
- **Encoding:** UTF-8 only; other encodings are rejected with clear error message
- **Character limit:** 10,000 characters per file is a soft limit; enforced via warning, not rejection
- **Token budget:** 12,000 tokens per turn is a soft limit; no hard abort on overflow

## Test strategy
- Unit: file reading logic, encoding validation, character count check (mock fs)
- Integration: upload files (sdg.1+sdg.2), then read them in a skill session (sdg.4/sdg.5)
- Edge cases: file deleted post-upload (graceful skip), invalid UTF-8, oversized file, multiple files with mixed validity
- E2E: upload file, start /ideate session, verify file content is available to skill handler

---

# Epic 2: System Prompt Injection and Model Usage

## Overview
Skills integration — injecting reference content into /ideate and /discovery system prompts and ensuring the model uses it meaningfully.

## Stories in this epic
- sdg.4: Reference content injection into /ideate system prompt
- sdg.5: Reference content injection into /discovery system prompt

---

# Story sdg.4 — Reference content injection into /ideate system prompt

**User story:**
As the /ideate skill,
I want to automatically inject uploaded reference files into my system prompt,
So that the model has organisational strategy context when framing opportunity questions.

## Acceptance criteria

**AC1 — Reference content injected as new system prompt section**
Given a /ideate session starts with `referenceFiles` in the journey context,
When `buildSystemPrompt('ideate', repoPath, webUiConfig, {priorArtefacts, referenceFiles})` is called,
Then a new section is added to the system prompt after the main SKILL.md content:
```
## Strategic context and reference material
[content of first reference file]

[content of second reference file, if present]
```

**AC2 — Token budget validation**
Given reference content is injected,
When the system prompt is assembled,
Then the total token count is validated: SKILL.md tokens + reference content tokens + prior artefacts tokens ≤ 12,000 tokens (soft limit).
If total exceeds 12,000, a warning is logged: `[WARN] System prompt exceeds soft token budget (actual: N/12000)` but injection proceeds.

**AC3 — Large file truncation (if necessary)**
Given the reference content would cause token count to exceed 12,000,
When the largest reference file is identified,
Then that file is truncated to fit: `[content...]\n\n[TRUNCATED — remaining content exceeds token budget]`,
And a warning is logged: `[WARN] Reference file truncated to fit token budget`.

**AC4 — Model receives complete system prompt in one request**
Given the system prompt is assembled with reference content,
When the model's first turn is generated,
Then the complete system prompt (SKILL.md + reference section) is sent to GitHub Copilot Chat Completions API in a single HTTP request (no multi-part or streaming assembly).

**AC5 — Model acknowledges and grounds questions in strategy**
Given reference content is present in the system prompt,
When the model generates its opening questions (Q1–Q5 of /ideate),
Then at least 2 of the 5 questions explicitly reference or acknowledge strategy content.
Example: "Based on your market positioning, is this initiative aligned with Q3 priorities?" or "Given your risk tolerance constraints, how would you scope this work?"

**AC6 — No reference files present → no error**
Given a /ideate session starts WITHOUT referenceFiles in journey context,
When `buildSystemPrompt()` is called,
Then the strategic context section is omitted (no empty section, no error),
And the SKILL.md content is unchanged (baseline /ideate instructions intact).

## Out of scope
- Forcing the model to use reference content (instruction-based guidance only; model decides)
- Semantic relevance matching or content filtering (full files injected, no ranking)
- Multi-turn model interactions where reference content changes mid-session
- Summarization or compression of reference content beyond truncation-to-fit

## Dependencies
sdg.3 (reference file content must be readable and validated)

## NFR / Constraints
- **System prompt assembly:** `buildSystemPrompt()` function signature must accept `referenceFiles` parameter
- **Token counting:** Use existing token counter in codebase (if available) or a simple heuristic (est. 4 characters = 1 token)
- **Truncation:** Only truncate if necessary; preserve semantic completeness of truncated content
- **Error handling:** Missing or unreadable files do not cause system prompt assembly to fail (graceful degradation)

## Test strategy
- Unit: buildSystemPrompt() called with and without referenceFiles; token budget validation
- Integration: /ideate session with strategy files; model response includes grounding references
- E2E: upload files (sdg.1), start /ideate, verify system prompt includes reference section, verify model's Q1–Q5 ground in strategy
- Token budget edge case: upload a 9,000 character file; verify truncation warning if budget exceeded

---

# Story sdg.5 — Reference content injection into /discovery system prompt

**User story:**
As the /discovery skill,
I want to automatically inject reference files into my system prompt,
So that the model grounds discovery scope against organisational strategy and data.

## Acceptance criteria

**AC1 — Reference content injected into /discovery system prompt**
Given a /discovery session starts (after /ideate completes) with `referenceFiles` in journey context,
When `buildSystemPrompt('discovery', repoPath, webUiConfig, {priorArtefacts, referenceFiles})` is called,
Then reference content is injected using the same format as sdg.4:
```
## Strategic context and reference material
[content of first reference file]
[content of second reference file, if present]
```

**AC2 — Model grounds scope against strategy**
Given the discovery problem statement has been provided by the operator,
When the model generates discovery scope boundaries and acceptance criteria,
Then the model explicitly grounds them against reference content where available.
Example: "Given your market positioning statement emphasising enterprise customers, the scope should prioritise B2B features over consumer features."

**AC3 — Callout markers in artefact output**
Given reference files are injected and used by the model,
When the model generates discovery artefact sections (problem statement, scope, personas, out-of-scope),
Then each section that cites strategy or data includes an explicit callout marker: `[Grounded in: <filename>]`.
Example: "Persona: Enterprise data analyst [Grounded in: customer-research.md]"

**AC4 — Callout markers preserved in saved artefact**
Given a /discovery session completes with callout markers in the model output,
When the artefact is saved to `artefacts/[feature-slug]/discovery.md`,
Then all `[Grounded in: ...]` markers are preserved in the saved markdown file verbatim.

**AC5 — Multiple reference files cited appropriately**
Given 2–3 reference files are injected,
When the model generates discovery scope,
Then it cites the most relevant file(s) by content pattern (no semantic ranking — simple pattern matching in system prompt instruction).
Files can be cited multiple times in different sections (e.g., strategy.md cited in scope, data.md cited in personas).

**AC6 — No reference files → baseline discovery**
Given a /discovery session starts WITHOUT referenceFiles,
When the model generates discovery artefacts,
Then callout markers do not appear (baseline /discovery SKILL.md instructions intact),
And artefacts are generated without strategy grounding (no error, baseline behaviour).

## Out of scope
- Automatic relevance ranking of reference files via semantic search or vector DB
- Modification of the operator's problem statement or scope based on reference content
- Feedback loops or suggestions that reference files are incomplete or should be updated
- Storing or versioning reference content alongside the discovery artefact (files remain separate)

## Dependencies
sdg.3 (reference file content must be readable and validated), sdg.4 (reference injection pattern established in /ideate)

## NFR / Constraints
- **System prompt:** Reference content injected into /discovery system prompt using same mechanism as /ideate (ADR-023 handoff schema: B-iii artefact content injection)
- **Token budget:** Same soft limit (12,000 tokens) and truncation rules as sdg.4
- **Callout format:** Markers are literal `[Grounded in: <filename>]` — no variations or alternative formats
- **Citation consistency:** If a file is cited in /discovery, the same file reference is available to downstream skills for consistency

## Test strategy
- Unit: /discovery buildSystemPrompt() with referenceFiles; callout marker detection
- Integration: /ideate + /discovery in sequence with reference files; callouts present in both artefacts
- E2E: upload files, run /ideate, run /discovery, verify artefact contains callout markers, verify files are cited correctly
- Verification: saved discovery.md file contains callout markers; markers match injected reference files

---

# Epic 3: Metrics and Measurement

## Overview
Outcome tracking — recording usage metrics and validating the hypothesis that strategy injection improves scope grounding.

## Stories in this epic
- sdg.6: Callout marker detection and metrics recording

---

# Story sdg.6 — Callout marker detection and metrics recording

**User story:**
As the skills pipeline,
I want to detect "Grounded in:" callout markers in completed artefacts,
So that I can track how often the model uses reference content and correlate with artefact quality.

## Acceptance criteria

**AC1 — Metrics file created and initialized**
Given the feature is initialized (discovery approved),
When the first skill session completes,
Then a metrics file is created at `workspace/strategy-metrics.json` (if not present) with an empty array: `{"metrics": []}`.

**AC2 — Artefact scanned for callout markers**
Given an artefact is saved to disk after /ideate or /discovery completes,
When a post-save metrics collection step runs,
Then the artefact content is scanned for all occurrences of the pattern `[Grounded in: <filename>]` (case-sensitive, literal match).

**AC3 — Metrics entry recorded**
Given callout markers are found (or not found),
When metrics are recorded,
Then a JSON object is appended to `workspace/strategy-metrics.json`:
```json
{
  "date": "2026-06-04T14:30:00Z",
  "featureSlug": "2026-06-04-strategy-data-grounding",
  "stage": "ideate|discovery",
  "hasReferenceFiles": true,
  "referenceFileCount": 2,
  "referenceFileNames": ["strategy.md", "data.md"],
  "calloutCount": 4,
  "totalSections": 8,
  "calloutRate": 0.50
}
```

**AC4 — Metrics visible in session completion summary**
Given metrics are recorded,
When the operator completes a session and views the completion summary,
Then a line appears: "Strategy content was cited in X/Y sections of your artefact (rate: X/Y)" (where Y = sections and X = sections with callouts).
If no reference files were uploaded, the line reads: "No strategy grounding used in this session."

**AC5 — Sessions without reference files tracked**
Given an operator completes /ideate or /discovery WITHOUT uploading reference files,
When metrics are recorded,
Then `hasReferenceFiles: false`, `referenceFileCount: 0`, `referenceFileNames: []`, `calloutCount: 0`,
Allowing comparison of sessions with and without strategy content.

**AC6 — Per-artefact metrics (not aggregated)**
Given multiple artefacts are produced in a single feature (e.g., /ideate followed by /discovery followed by /benefit-metric),
When each artefact is saved,
Then a separate metrics entry is recorded for each artefact (no aggregation or rollup across stages in a single entry).
A feature may have 3–5 metrics entries (one per stage) by the time definition-of-ready is reached.

## Out of scope
- Automatic quality scoring based on callout frequency (e.g., "high-grounding" vs "low-grounding" artefact)
- Real-time feedback to the operator about callout rate during a session (metrics recorded post-completion only)
- Historical aggregation or trend analysis across multiple features (per-feature metrics only)
- Automated alerts or recommendations to re-upload strategy files if callout rate is low

## Dependencies
sdg.4 (callout markers must appear in /ideate artefacts), sdg.5 (callout markers must appear in /discovery artefacts)

## NFR / Constraints
- **Metrics file location:** `workspace/strategy-metrics.json` (sibling to `workspace/state.json`, not in artefacts/)
- **Metrics format:** Append-only JSON array; no deletion or mutation of prior entries
- **Pattern matching:** Literal string match `[Grounded in: <filename>]`; no regex or fuzzy matching
- **Timing:** Metrics recorded immediately after artefact is saved (post-completion, before next skill starts)

## Test strategy
- Unit: callout marker detection (regex/pattern matching tested in isolation with sample artefact text)
- Integration: /ideate session with reference files; artefact saved; metrics entry appended to workspace/strategy-metrics.json
- Verification: metrics file contains correct counts, rates, and file names; entries are per-artefact (not aggregated)
- E2E: upload files, run /ideate, verify metrics entry appears; run /discovery, verify second metrics entry with independent counts
- Edge cases: no reference files (calloutCount=0), single callout, all sections grounded, truncated reference file

---

# Epic 1: Reference File Upload and Storage (consolidated)

**Rationale:** Operator-facing capability — uploading strategy/data files and storing them in a feature's reference directory. This epic is independent and can be implemented first.

---

# Epic 2: System Prompt Injection and Model Usage (consolidated)

**Rationale:** Skills integration — injecting reference content into /ideate and /discovery system prompts and ensuring the model uses it meaningfully. Depends on Epic 1 completion.

---

# Epic 3: Metrics and Measurement (consolidated)

**Rationale:** Outcome tracking — recording usage metrics and validating the hypothesis that strategy injection improves scope grounding. Depends on Epic 2 completion.

---

# Cross-epic dependency chain

1. **Epic 1 (sdg.1–sdg.3)** — upload, persist, validate files (no upstream dependencies)
2. **Epic 2 (sdg.4–sdg.5)** — inject content into /ideate and /discovery system prompts (depends on Epic 1)
3. **Epic 3 (sdg.6)** — detect and record metrics (depends on Epic 2)

---

# Scope accumulator summary

| Discovery MVP scope item | Stories covering | Status |
|---|---|---|
| Reference file upload | sdg.1, sdg.2 | ✅ |
| File storage and validation | sdg.3 | ✅ |
| /ideate system prompt injection | sdg.4 | ✅ |
| /discovery system prompt injection | sdg.5 | ✅ |
| Metrics recording | sdg.6 | ✅ |

**Scope ratio:** 6 stories / 5 MVP items = 1.2x (minimal — each story is tightly scoped to one capability)
**Scope drift:** None detected — no scope additions beyond discovery MVP
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

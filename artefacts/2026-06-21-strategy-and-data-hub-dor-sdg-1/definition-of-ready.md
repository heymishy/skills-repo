# Definition of Ready — sdg.1 (Reference upload modal UI)

## Contract Proposal

**Contract Proposal — sdg.1: Reference upload modal UI**

**What will be built:**
A modal dialog component that appears after the operator selects "new product" in the journey start gate. The modal contains a file input accepting `.md` files, displays upload instructions, validates files on selection, writes validated files to `artefacts/[feature-slug]/reference/[filename]`, and records the file list in `session.referenceFiles`.

**What will NOT be built:**
- Non-markdown format support (Excel, PowerPoint, Power BI)
- File deduplication or conflict resolution
- Editing or deleting files post-upload
- Cloud data source authentication (OneDrive, SharePoint)
- Automatic file naming or sanitization

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Route navigation: journey selects "new product" → gate appears | E2E |
| AC2 | Modal renders file input and instructions text on "yes" | E2E / unit |
| AC3 | File validation (extension, size, UTF-8) tested against sample .md files and invalid formats | Unit / E2E |
| AC4 | Files written to `artefacts/[feature]/reference/` via `fs.writeFileSync()`; verified by checking disk | Integration |
| AC5 | "Skip" button closes modal without error; journey proceeds | E2E |
| AC6 | `session.referenceFiles` array populated after upload; verified in session state | Integration |

**Assumptions:**
- The journey state object and session context exist and are writable at the upload gate
- The `artefacts/[feature-slug]/reference/` directory can be created on-demand if absent
- File input validation can run client-side before server write; server validation also enforces the same rules

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js`, `src/web-ui/modules/journey-store.js`, `public/css/modal.css`, `public/js/upload-handler.js`

---

## Hard Blocks Checklist

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 6 ACs |
| H3 | Every AC has at least one test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated (not blank) | ✅ PASS — 5 items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1 |
| H6 | Complexity rated | ✅ PASS — 1 |
| H7 | No unresolved HIGH findings from review | ✅ PASS |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | schemaDepends fields present in schema if Dependencies exist | ✅ PASS — Dependencies: None |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS |
| H-E2E | CSS-layout-dependent ACs covered by E2E tooling or RISK-ACCEPT | ✅ PASS — Playwright configured |
| H-NFR | NFR profile exists or story has "NFRs: None" field | ✅ PASS |
| H-NFR2 | Compliance NFRs have human sign-off | ✅ PASS — none applicable |
| H-NFR3 | Data classification in NFR profile | ✅ PASS |
| H-NFR-profile | NFR profile exists if story declares NFRs | ✅ PASS |
| H-GOV | Approved By section has ≥1 non-blank entry | ✅ PASS |
| H-ADAPTER | Injectable adapters have wiring AC, throwing stub, separate wiring task | ✅ PASS — none introduced |

**All 17 hard blocks PASS ✅**

---

## Warnings (All Acknowledged)

| Warning | Result |
|---------|--------|
| W1 | NFRs populated or "None - confirmed" | ✅ Accessibility and encoding constraints listed |
| W2 | Scope stability declared | ✅ Stable (no upstream dependencies) |
| W3 | MEDIUM review findings in /decisions | ✅ 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ✅ Owner-reviewed |
| W5 | No UNCERTAIN items in test plan | ✅ None present |

---

## Oversight Level

**Low** — No sign-off required. Ready for immediate coding assignment.

---

## Standards Injection

**Domain tags:** web-ui, modal-ux

**Matched standards:**
- `.github/standards/web-ui/web-ui-patterns.md` — Modal accessibility, error handling patterns
- `.github/standards/quality-assurance/saas-gui-variant.md` — E2E test patterns

---

## Coding Agent Instructions

### Story at a glance
Implement a modal dialog that appears after the operator selects "new product" in the journey start gate. The modal allows uploading markdown strategy/data files, validates them, stores them to disk, and records the file list in session state.

### System context
- **Feature:** 2026-06-04-strategy-and-data-grounding
- **Benefit metric:** M1 (Strategy content utility)
- **Upstream dependencies:** None
- **Oversight:** Low

### Acceptance criteria (must-have)

**AC1 — Upload gate appears after new-product selection**
Given operator is at journey start gate ("Is this a new product or resuming existing?"), when they select "new product", then a follow-up gate appears: "Would you like to ground this work in strategy or data?" (optional, may skip).

**AC2 — Modal displays file input and instructions**
Given operator selects "yes" to strategy grounding, when the modal opens, then a file input (`<input type="file" accept=".md">`) displays with instructions: "Upload one or more markdown files containing strategy, market data, or research".

**AC3 — File validation on selection**
Given operator selects one or more .md files (up to 5 MB total), when they click "Upload", then each file is validated: (a) extension is .md, (b) size ≤ 1 MB each, (c) content is valid UTF-8 text. Invalid files show error "[filename] is not a valid markdown file" and are not processed.

**AC4 — Files stored in reference directory**
Given validation passes, when operator clicks "Confirm", then each file is written to `artefacts/[feature-slug]/reference/[original-filename]` using Node.js `fs.writeFileSync()`, modal closes, and journey session state is updated.

**AC5 — Skip option available**
Given operator chooses not to upload, when they click "Skip", then modal closes and journey proceeds to /ideate without strategy files (no error).

**AC6 — Reference files recorded in session context**
Given files upload successfully, when journey loads the next skill, then reference directory path and file list are available in `session.referenceFiles` (array of file path objects).

### Out of scope
- Non-markdown format support (Excel, PowerPoint, Power BI) — Phase 2
- File deduplication or conflict resolution — Phase 2
- Editing or deleting files post-upload — Phase 2
- Cloud data source authentication (OneDrive, SharePoint) — Phase 2
- Automatic file naming or sanitization — Phase 2

### Constraints & NFRs

**File I/O:** Use only Node.js built-ins (`fs.readFileSync`, `fs.writeFileSync`); no third-party file libraries.

**Accessibility:** Modal must be keyboard-accessible and screen-reader-compatible (ARIA labels on file input, error messages announced).

**Error handling:** Invalid files do not block valid files; validation errors are specific and actionable.

**Character encoding:** UTF-8 only; other encodings rejected with clear error.

### Applicable standards

**From `.github/standards/web-ui/web-ui-patterns.md`:**
- Use native `<dialog>` element or equivalent ARIA role. File input must have visible `<label>` with `for="file-input"`. Error messages must be announced to screen readers (use `role="alert"` or `aria-live="polite"`).
- Client-side validation before send; server-side validation before write.
- Specific error messages: "strategy.pdf is not a markdown file (.md required)".

**From `.github/standards/quality-assurance/saas-gui-variant.md`:**
- Use Playwright to verify modal appears/disappears, file upload triggers validation, error messages display.
- Test both happy path and error cases.

### Implementation approach

1. **Route handler:** Add `/api/journey/:id/upload-strategy-files` endpoint (POST)
2. **Client-side validation:** JavaScript validates extension and size before send
3. **Server-side validation:** `src/web-ui/modules/file-validator.js` — validates extension, size, UTF-8
4. **File write:** `src/web-ui/modules/reference-file-writer.js` — writes validated files; creates directory if absent
5. **Session state update:** `journey-store.js` — append files to `session.referenceFiles`
6. **Modal UI:** `public/html/upload-modal.html` + `public/js/upload-modal.js`
7. **Gateway navigation:** Update journey state machine to show upload gate after "new product" selection

### Test coverage

- **Unit:** File validation logic (extension, size, UTF-8)
- **Integration:** Upload flow followed by session state check; files verified on disk
- **E2E (Playwright):** Modal appears/disappears, file upload validation, error messages, successful upload closes modal

### Known risks & mitigations

**Risk:** Operator navigates away before upload completes.
**Mitigation:** Transaction pattern — validate all files first; write only if all pass.

**Risk:** Directory doesn't exist.
**Mitigation:** Create on-demand via `fs.mkdirSync(path, {recursive: true})`.

**Risk:** File names contain path traversal attempts.
**Mitigation:** Sanitise — allow alphanumeric, hyphens, underscores, dots only. Use `path.basename()`.

### Verification script

```bash
# Unit tests
npm run test -- src/web-ui/modules/file-validator.js
npm run test -- src/web-ui/modules/reference-file-writer.js

# E2E tests
npm run test:e2e -- tests/e2e/upload-modal.spec.js

# Smoke test
# 1. Open web UI → new feature
# 2. Select "new product" → "yes" to strategy
# 3. Upload strategy.md
# 4. Verify file in artefacts/[feature]/reference/strategy.md
# 5. Verify session.referenceFiles contains file
```
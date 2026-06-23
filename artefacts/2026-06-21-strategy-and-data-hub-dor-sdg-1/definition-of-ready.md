# Definition of Ready Checklist — sdg.1

**Story:** sdg.1 — Reference upload modal UI
**Feature slug:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Signed off:** 2026-06-21
**Oversight level:** Low

---

## Contract Proposal

**What will be built:**
A modal dialog component in the web UI journey flow that appears after the operator selects "new product" at the feature start gate. The modal displays a file input (accept=".md"), validation instructions, and an upload button. Files are validated client-side (extension, size, encoding) before being written to the feature's reference directory.

**What will NOT be built:**
- Non-markdown format support (Excel, PowerPoint, Power BI)
- Cloud data source authentication or remote file reading
- File deduplication or conflict resolution
- Automatic file naming or sanitization
- File editing or deletion UI post-upload

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Upload gate appears after new-product selection | E2E: Navigate journey, select "new product", verify follow-up gate appears | E2E |
| AC2 — Modal displays file input and instructions | E2E: Verify modal renders, file input visible, instructions displayed | E2E |
| AC3 — File validation on selection | Unit: validation logic (.md extension, ≤1 MB, UTF-8); E2E: upload invalid file, verify error message | unit + E2E |
| AC4 — Files stored in reference directory | Integration: files written to `artefacts/[feature-slug]/reference/` via `fs.writeFileSync()`, verified by file read | integration |
| AC5 — Skip option available | E2E: click "Skip", modal closes, journey proceeds without files | E2E |
| AC6 — Reference files recorded in session context | Unit: `session.referenceFiles` populated correctly; E2E: subsequent skill receives file list | unit + E2E |

**Assumptions:**
- File upload via HTML `<input type="file">` is sufficient for MVP (no drag-and-drop or advanced UX)
- Reference directory creation is handled by the file-write operation (no pre-flight mkdir required)
- Operator will interact with the modal in a single session (no persistence of partial uploads across sessions)

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (upload handler), `src/web-ui/public/journey.html` (modal UI), `src/web-ui/modules/journey-store.js` (state record)
Services: None (local file I/O only)
APIs: None (internal)

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS — "As a pipeline operator starting a new feature, I want to upload markdown strategy/data files via a modal dialog in the journey flow, So that I can ground the session in organisational strategy before running /ideate or /discovery." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 6 ACs present, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ PASS — Test plan (artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.1-test-plan.md) covers all 6 ACs with explicit test cases |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS — 5 out-of-scope items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ PASS — References benefit-metric.md M1 (Strategy content utility) |
| H6 | Complexity is rated | ✅ PASS — Complexity: 1 (well understood; file upload pattern is standard; no ambiguity) |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS — Review report (artefacts/2026-06-21-strategy-and-data-hub/review.md) shows PASS with no HIGH findings for sdg.1 |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ PASS — All 6 ACs covered; no gaps |
| H8-ext | Schema dependency check: Dependencies block lists "None" — no schema check required | ✅ PASS — Story has no upstream dependencies |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ PASS — Constraints: "File upload UX must be accessible (ARIA); UTF-8 only; client-side + server-side validation; error handling graceful." No architecture guardrail violations detected |
| H-E2E | CSS-layout-dependent ACs with E2E coverage confirmed | ✅ PASS — Modal layout (AC2) is CSS-dependent; Playwright E2E spec written (tests/e2e/reference-upload.spec.js); H-E2E gate satisfied |
| H-NFR | NFR profile exists or story declares "NFRs: None — reviewed [date]" | ✅ PASS — Story declares "NFRs: None — reviewed 2026-06-04" in artefact |
| H-GOV | Discovery artefact Approved By section has ≥1 non-blank named entry | ✅ PASS — Discovery artefact approved by Hamish King (product owner, non-engineer) on 2026-06-04 |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

No warnings apply to this story.

---

## Coding Agent Instructions

**Context:**
You are implementing sdg.1 — the reference file upload modal for the strategy/data grounding feature. This story has low complexity and no upstream dependencies — you can begin immediately after /branch-setup completes.

**Acceptance Criteria (binding contract):**
Your implementation MUST satisfy all 6 ACs. Any AC not met is a DoD failure. Pay special attention to:
- AC3: File validation must reject invalid .md files, files >1 MB, and non-UTF-8 content with specific error messages
- AC4: Files MUST be written to `artefacts/[feature-slug]/reference/` using Node.js `fs.writeFileSync()` — exact path required
- AC6: `session.referenceFiles` MUST be populated and passed downstream to subsequent skill sessions

**Architecture constraints:**
- Use only Node.js built-ins (`fs`, `path`) — no new npm dependencies
- Modal must be keyboard-accessible (ARIA labels on file input, error messages)
- Graceful error handling: invalid files do not block valid files; validation errors are specific and actionable
- Character encoding: UTF-8 only; other encodings rejected with clear error

**Files you will touch:**
- `src/web-ui/routes/skills.js` — POST /api/reference/upload handler
- `src/web-ui/public/journey.html` — modal UI (HTML structure, CSS)
- `src/web-ui/modules/journey-store.js` — `recordReferenceFiles()` function to persist to session state
- `tests/e2e/reference-upload.spec.js` — Playwright E2E tests (stub provided; implement all cases from test plan)

**Test execution (before opening PR):**
```bash
npm test                    # Unit tests for validation logic
npm run test:e2e            # Playwright E2E tests for modal flow + file upload
node tests/check-wsm*.js    # Journey state shape validation (if applicable)
```

**Standards injection:**
Domain tags: [web-ui, file-io]
Matched standards files: 
- `.github/standards/web-ui/web-ui-patterns.md` (modal accessibility, error handling patterns)
- `.github/standards/web-ui/web-ui-file-io.md` (if exists; file reading/writing patterns)

**Verification script:**
Your verification script is at `artefacts/2026-06-21-strategy-and-data-hub/verification-scripts/sdg.1-verification.md`. Run it after all tests pass to confirm the AC contract is met.

---

## Completion Output

✅ **Definition of ready: PROCEED — sdg.1 (Reference upload modal UI)**

**Hard blocks:** 13/13 passed
**Warnings:** 0 acknowledged
**Oversight:** Low

The story is signed off and ready for implementation. No human sign-off required (Low oversight).

**Next step:**
Run `/branch-setup` to create an isolated worktree and verify the clean baseline. Then proceed to `/implementation-plan` to break the story into bite-sized tasks for TDD-driven implementation.

**Inner coding loop order:**
1. ✅ DoR complete — you are here
2. /branch-setup — create isolated worktree
3. /implementation-plan — write task plan from this DoR
4. /tdd — RED-GREEN-REFACTOR per task (or `/subagent-execution` for multi-task execution)
5. /verify-completion — run test suite + AC verification script
6. /branch-complete — open draft PR
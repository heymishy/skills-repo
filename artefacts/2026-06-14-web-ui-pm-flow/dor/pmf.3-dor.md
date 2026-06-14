# Definition of Ready: Context-aware orientation wizard — three-step session start

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.3.md
**Test plan reference:** artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.3-test-plan.md
**Review reference:** artefacts/2026-06-14-web-ui-pm-flow/review/pmf.3-review-1.md
**Assessed by:** Copilot (Claude Sonnet 4.6) (/definition-of-ready)
**Date:** 2026-06-15

---

## Contract Proposal

**What will be built:**
Upgrade `handleGetWizard` in `src/web-ui/routes/journey.js` to support three steps:
- **Step 1** (no `req.query.view`): render three named option cards — "Start something new", "Continue an existing feature", "Resume active session".
- **Step 2** (`req.query.view === 'existing'`): render active features as cards (health-dot + title + slug + stage), not `<li>` slugs. This step is already triggered by existing wucp.4 tests T4.6–T4.9/T4.15/T4.19 — the query param contract is preserved.
- **Step 3** (`req.query.view === 'resume'`): read sessions from session store, filter `done !== true` AND `lastActivity` within 24h, render as list. Empty state: "No active sessions".

Extend `handlePostWizardSelection` in `src/web-ui/routes/journey.js`:
- `selection: 'from-idea'` with `ideaId` → redirect to `/skills/discovery/sessions?idea=<ideaId>`. `ideaId` used as query param only — NOT as a file path.
- `selection: 'resume-session'` with `sessionId` and `skillName` → redirect to `/skills/<skillName>/sessions/<sessionId>/chat`. Both values validated against allowlist (slug-safe chars only).

Write `tests/check-pmf3-orientation-wizard.js` with 8 tests (T3.1–T3.8) as specified in test plan.
Add test to `package.json` test chain.

**What will NOT be built:**
- Drag-and-drop reordering of options
- Session search or filter
- Any SKILL.md modifications
- New server routes — upgrade existing GET/POST /journey/wizard handlers only

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Step 1 three options | T3.1 (three strings present) + T3.2 (feature list NOT in Step 1) | Unit |
| AC2 — "Start new" preserved | Existing wucp.4 T4.3, T4.4 | Unit (existing) |
| AC3 — "from-idea" redirect | T3.4 (POST with selection=from-idea, assert Location) | Unit |
| AC4 — Step 2 feature cards | Existing T4.6, T4.7, T4.8 + T3.3 (card class not li) | Unit |
| AC5 — Feature selection preserved | Existing T4.12, T4.13, T4.14 | Unit (existing) |
| AC6 — Step 3 active sessions | T3.5 (empty), T3.6 (active within 24h), T3.7 (stale not shown) | Unit |
| AC7 — resume-session redirect | T3.8 (POST with selection=resume-session, assert Location) | Unit |
| AC8 — Returning session skips wizard | Existing T4.17 | Unit (existing) |
| AC9 — All 20 wucp.4 tests pass | npm test (check-wucp4-session-wizard.js must emit 20 PASS) | Unit (existing) |

**Security constraints:**
- `ideaId`: used only as a URL query parameter — never passed to fs functions, shell commands, or SQL.
- `sessionId` and `skillName`: validated against `/^[a-z0-9-]+$/` allowlist before use in redirect path. Return HTTP 400 if invalid.

**Assumptions:**
- Session store is accessible via the same adapter pattern used by existing wucp.4 tests (mock-able via `setGetHtmlSession`).
- `lastActivity` is an ISO timestamp string stored on session objects.
- `skillName` is a known slug — validated against keys in `src/skills/` directory listing or a static allowlist.

**Estimated touch points:**
`src/web-ui/routes/journey.js` (modified — two functions), `tests/check-pmf3-orientation-wizard.js` (new), `package.json` (test chain append).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format | ✅ | "As a platform operator" |
| H2 | ≥3 ACs in Given / When / Then | ✅ | 9 ACs |
| H3 | Every AC has ≥1 test | ✅ | All ACs covered by T3.1–T3.8 + wucp.4 regression |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references named metric | ✅ | M3 — Session start click-count |
| H6 | Complexity rated | ✅ | Rating: 3, Stable |
| H7 | No unresolved HIGH review findings | ✅ | 0 HIGH findings — review/pmf.3-review-1.md |
| H8 | No uncovered ACs | ✅ | All ACs mapped to tests in test plan |
| H9 | Architecture constraints populated | ✅ | view param routing, wucp.4 regression baseline, slug validation, no SKILL.md changes |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md |
| H-NFR3 | Data classification not blank | ✅ | Public |

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | R3.1 (no E2E), R3.2 (ideaId/sessionId not file paths — added to security constraint above), R3.3 (clock drift) | Copilot — 2026-06-15 |

---

## Coding Agent Instructions

```
## pmf.3 — Orientation wizard upgrade

Proceed: Yes

Story: Context-aware orientation wizard — three-step session start
Story ref: artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.3.md
Test plan: artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.3-test-plan.md

Goal:
Make every test in tests/check-pmf3-orientation-wizard.js pass.
Also ensure all 20 tests in tests/check-wucp4-session-wizard.js continue to pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Modify ONLY: src/web-ui/routes/journey.js (handleGetWizard + handlePostWizardSelection)
- New files: tests/check-pmf3-orientation-wizard.js
- Append to package.json test chain: && node tests/check-pmf3-orientation-wizard.js
- Step 1 triggered by: no req.query.view (or view === undefined/'')
- Step 2 triggered by: req.query.view === 'existing' (matches existing wucp.4 tests — do not change this contract)
- Step 3 triggered by: req.query.view === 'resume'
- POST from-idea: ideaId must be passed as URL query param only — NEVER as file path (MC-SEC-02)
- POST resume-session: validate sessionId and skillName against /^[a-z0-9-]+$/ — return 400 if invalid
- All rendered content: escape via escHtml
- Do NOT modify any SKILL.md files
- Do NOT modify tests/check-wucp4-session-wizard.js
- Architecture guardrails: read .github/architecture-guardrails.md before implementing

Oversight level: Medium
Share DoR with tech lead before assigning to coding agent.
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Copilot (Claude Sonnet 4.6) — 2026-06-15
**Status:** SIGNED OFF — ready for implementation

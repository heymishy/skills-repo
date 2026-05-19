# DoR Contract — wucp.4: Session start wizard for feature selection

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.4
**Contract date:** 2026-05-09

---

## Scope boundary

### Files the coding agent MUST touch

| File | Change |
|------|--------|
| `src/web-ui/routes/journey.js` | Add: STAGE_INDEX, handleGetWizard(), handlePostWizardSelection(). All to second module.exports block (line ~1298). |
| `src/web-ui/server.js` | Add route registration: GET /journey (wizard intercept), POST /journey/wizard. |

### Files the coding agent MUST NOT touch

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Not in scope — wucp.1 owns skills.js |
| Any `.github/skills/` file | Out of scope per discovery constraints |
| `artefacts/` (read-only) | Pipeline inputs — no modifications |
| Any test file | Tests are the spec |
| `package.json` | Already updated |

### Duplicate exports boundary

Same as wucp.2: journey.js has two `module.exports = {}` blocks.
- Second block (line ~1298): **live** — add all new exports here
- First block (line ~1261): dead code — do not touch
- wsm.4 (PR #339): the fix to the duplicate is NOT in scope for this story

---

## Required implementation detail

### STAGE_INDEX exact values (AC4 — DO NOT alter)

The following values are asserted directly by tests T4.10 and T4.11. Implement exactly:

```js
const STAGE_INDEX = {
  discovery: 0,
  'benefit-metric': 1,
  definition: 2,
  review: 3,
  'test-plan': 4,
  'definition-of-ready': 5,
  'branch-setup': 6,
  'implementation-plan': 7,
  'subagent-execution': 8,
  'verify-completion': 9,
  'branch-complete': 10,
  'definition-of-done': 11
};
```

Stage name not in STAGE_INDEX: fallback to stageIndex 0.

### Feature filtering rules (AC3)

- `feature.status === 'released'` → excluded from wizard
- `feature.status === 'archived'` → excluded from wizard
- All other status values → included in wizard as active
- If ALL features are excluded after filtering: respond with "No active projects found." — do not render a feature-less wizard form

### handlePostWizardSelection() validation sequence

1. Parse featureSlug from POST body
2. Load pipeline-state.json from repo root
3. Build allowlist from `state.features.map(f => f.slug)`
4. If featureSlug is not in allowlist → HTTP 400 ("Invalid feature selection")
5. If featureSlug is in allowlist → set session.activeFeatureSlug, compute stageIndex, redirect to /journey

Step 4 must occur BEFORE any session mutation. A featureSlug in the POST body that is not in the allowlist must never reach the session.

### H8-ext declaration

`schemaDepends: []` — This story has an upstream implementation dependency on wucp.1 (`session.activeFeatureSlug` set by this story is read by wucp.1's `buildSystemPrompt()` extension). However:
- `session.activeFeatureSlug` is a **server-side session variable** managed at runtime
- It is NOT a pipeline-state.json schema field
- No pipeline-state.json schema fields are consumed that require absent-field handling

H8-ext cross-story schema dependency check: not applicable. The upstream dependency is declared in Architecture Constraints as an implementation ordering constraint only.

---

## Required security constraints

1. **Slug allowlist validation (AC6, primary security constraint):** featureSlug from POST body MUST be validated against the pipeline-state.json features list before any session write. Implementation before any session mutation logic.
2. **Path traversal guard:** Not applicable. The feature slug is validated against an allowlist derived from pipeline-state.json. The slug is not used as a file path component (no `fs.readFileSync(artefacts/${slug}/...)` in this story). If future extensions derive file paths from the slug, the path guard in copilot-instructions.md becomes mandatory.
3. **HTML encoding:** Feature slugs and stage labels rendered in wizard HTML must be HTML-encoded using `escHtml()` from html-shell.js to prevent HTML injection.

Note on ADR-023 reference: the story's Architecture Constraints section says "ADR-023 path guard: Not applicable" — this refers to the path traversal guard coding standard in copilot-instructions.md, not to ADR-023 (handoff schema). The RISK-ACCEPT (wucp.4-W3-4-M2 in decisions.md) acknowledges the wrong ADR reference. The intent is correct: path traversal not applicable because slug is allowlist-validated, not free-form path input.

---

## D37 declaration

No injectable adapters introduced. handleGetWizard() and handlePostWizardSelection() are plain request handler functions reading pipeline-state.json directly via `fs.readFileSync`. STAGE_INDEX is a constant. D37 is not triggered.

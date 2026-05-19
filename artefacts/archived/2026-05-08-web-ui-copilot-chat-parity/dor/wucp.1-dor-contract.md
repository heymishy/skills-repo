# DoR Contract — wucp.1: Pipeline context auto-loader at session start

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.1
**Contract date:** 2026-05-09

---

## Scope boundary

### Files the coding agent MUST touch

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | Extend `buildSystemPrompt()` with 5th param `sessionContext = {}`. Add file reads for 6 context files (AC1, AC3, AC4, AC6). |
| `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` | **Create** — AC5 merge gate document. T1.16 asserts existence. |

### Files the coding agent MUST NOT touch

| File | Reason |
|------|--------|
| `src/web-ui/routes/journey.js` | Not in scope — wucp.2 and wucp.4 own journey.js |
| `src/web-ui/server.js` | buildSystemPrompt() is called from within skills.js; no route registration change needed |
| Any `.github/skills/` file | Out of scope per discovery and story constraints |
| Any `artefacts/` file other than `reference/context-yml-schema-inspection.md` | Read-only pipeline inputs |
| Any test file | Tests are the spec — never modify them to make them pass |
| `package.json` | Test chain already updated (0c3466a) |

---

## Required implementation detail

### buildSystemPrompt() extension

Current signature (line ~1059 in skills.js):
```js
function buildSystemPrompt(skillName, sessionPath, repoRoot, priorArtefacts)
```

New signature:
```js
function buildSystemPrompt(skillName, sessionPath, repoRoot, priorArtefacts, sessionContext)
```
where `sessionContext` defaults to `{}` if not provided. Callers that omit the 5th argument receive the empty-object default and existing behaviour is unchanged.

### Files to read and include (labelled)

| File | Label in prompt | Condition |
|------|----------------|-----------|
| `pipeline-state.json` | `[pipeline-state.json]` | Always attempt; skip if absent |
| `workspace/state.json` | `[workspace/state.json]` | Always attempt; skip if absent |
| `context.yml` | `[context.yml]` | Always attempt; skip if absent |
| `workspace/learnings.md` | `[workspace/learnings.md (first 50 lines)]` | Always attempt; include max 50 lines; skip if absent |
| `fleet-state.json` | `[fleet-state.json]` | Only if file exists |
| `artefact-coverage-exemptions.json` | `[artefact-coverage-exemptions.json]` | Only if file exists |
| `artefacts/[activeFeatureSlug]/` listing | `[artefacts/[slug]/ file listing]` | Only if `sessionContext.activeFeatureSlug` is set; filenames only, NOT file contents |

### Error handling

All file reads must be wrapped in try/catch or preceded by `fs.existsSync()`. If a file does not exist: skip silently. Do not throw. Do not emit an error message to the session. Continue assembling the prompt with the files that are present.

### context-yml-schema-inspection.md required content

The inspection artefact must document:
1. Every top-level field in `context.yml` and its value type (string, object, boolean, null, etc.)
2. For each field: does the value contain a credential (token, password, key, secret value)? — YES or NO
3. Confirmation statement: "All sensitive values use the secretRef pattern (reference name only — no credential values present in context.yml)"

The document does not need to be long — a table with columns (Field, Value type, Contains credential?) and a confirmation statement is sufficient.

---

## H8-ext declaration

`schemaDepends: []` — Dependencies: None. This story has no upstream story dependencies. No pipeline-state.json schema fields are depended upon. H8-ext check: not required.

---

## Required security constraints

1. **No credential leakage (AC5):** context.yml schema inspection must confirm that no credential values appear in the system prompt. The inspection artefact is the evidence. If inspecting context.yml reveals a credential value (not a secretRef reference name), this is a STOP condition — do not merge until the credential is replaced with a secretRef reference.
2. **Static paths only:** All file reads in this story use static, known paths (not paths derived from request data). The path traversal guard (coding standard) is therefore not required for this story's reads. If any future extension derives a path from request data, the guard becomes mandatory.

---

## D37 declaration

No injectable adapters are introduced by this story. buildSystemPrompt() is extended with direct `fs.readFileSync` / `fs.readdirSync` calls. No `let _fn = defaultFn; function setFn(fn) { _fn = fn; }` pattern is used. D37 is not triggered.

If during implementation the agent finds it useful to extract a testable helper function, it must be a plain function (not an injectable adapter) since the paths are static and not externally configurable.

# DoR Contract — wucp.3: Tool execution loop

**Story:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.3.md
**DoR artefact:** artefacts/2026-05-08-web-ui-copilot-chat-parity/dor/wucp.3-dor.md
**Date:** 2026-05-13

---

## Files in scope (required touchpoints)

| File | Action | Reason |
|------|--------|--------|
| `src/web-ui/modules/tool-executor.js` | CREATE (new file) | All 21 tests import from this path |
| `src/web-ui/routes/journey.js` | UPDATE | AC6 requires buildSystemPrompt() to include WEB UI PROTOCOL; T3.12–T3.14 import buildSystemPrompt from this file |
| `src/web-ui/server.js` | UPDATE | AC7 production wiring: setToolExecutor() called before any session handles a message |
| `tests/check-wucp3-tool-executor.js` | READ ONLY | Test file already exists and must not be modified |

## Files out of scope (must not be modified)

| File / Path | Constraint |
|-------------|-----------|
| `.github/skills/**` | No skill file modifications in this story |
| `artefacts/**` | No artefact modifications |
| `src/web-ui/modules/*` (files other than tool-executor.js) | Only the new file is in scope |
| `src/web-ui/routes/*` (files other than journey.js) | Only journey.js is in scope |
| Any `src/` file not listed above | Out of scope |
| `package.json` | Test already added to chain; no further change needed |

## Schema dependencies

`schemaDepends: []` — this story introduces no new pipeline-state.json fields.

## Assumptions

1. `buildSystemPrompt()` is already exported from `src/web-ui/routes/journey.js` or can be added as a named export without breaking existing callers. If it is currently internal-only, adding the export is in scope.
2. `src/web-ui/server.js` has a startup sequence where module-level initialisation happens before the HTTP server starts listening. `setToolExecutor()` will be called in that sequence.
3. The test harness uses `freshRequire()` to reset module state between tests — the implementation must support this pattern (no module-level singleton that cannot be reset by re-requiring the module with `setToolExecutor` called fresh).
4. The `repoRoot` passed to `executeTool` is always an absolute path (callers derive it from `__dirname` or `process.cwd()`). The path-traversal guard assumes `repoRoot` is already absolute.

## D37 injectable adapter contract

**Adapter name:** `toolExecutor`
**Setter function name:** `setToolExecutor(fn)`
**Default stub behaviour:** MUST throw — `throw new Error('Adapter not wired: toolExecutor. Call setToolExecutor() before use.')`
**Production wiring location:** `src/web-ui/server.js`
**Production wiring wires to:** A real `fs`/`path` implementation that calls `fs.readFileSync` (for read_file) or `fs.readdirSync` (for list_dir) on the resolved path
**Wiring verified by:** T3.17 (mock called after wiring), T3.15 (throws before wiring)

## Path traversal guard contract (ADR-023)

The guard must be applied in `executeTool` before calling the adapter, using:

```js
var resolvedPath = path.resolve(path.join(repoRoot, inputPath));
if (!resolvedPath.startsWith(repoRoot + path.sep)) {
  return '[path not allowed: ' + inputPath + ' is out of bounds]';
}
```

Guard must also reject paths where `resolvedPath === repoRoot` (i.e. `.` — resolves to repoRoot itself but does not have a path.sep suffix of repoRoot). The condition `startsWith(repoRoot + path.sep)` already handles this because `repoRoot` does not end with `path.sep`.

For absolute input paths (e.g. `/etc/passwd`): `path.resolve(path.join(repoRoot, '/etc/passwd'))` on POSIX resolves to `/etc/passwd` (absolute wins). The `startsWith(repoRoot + sep)` check rejects it. On Windows, same logic applies with Windows paths.

## File-not-found contract

When the tool adapter throws (e.g. ENOENT from `fs.readFileSync`), `executeTool` must catch the error and return the string `[File not found: ${inputPath}]` — using the original (pre-resolve) `inputPath`, not the resolved path. No exception propagation.

## WEB UI PROTOCOL exact text

The following text must appear verbatim in `buildSystemPrompt()` output (exact marker format required for T3.12–T3.14):

```
<TOOL:read_file path="
<TOOL:list_dir path="
relative
```

(These are the three substrings tested by T3.12, T3.13, T3.14 respectively. The full protocol text is in the DoR Coding Agent Instructions block and in `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md`.)

## AC8 resolution note

Review finding 1-M1 identified that the original AC8 conflated HTTP 400 (route-level) with tool_result error injection (in-loop). Resolution: for paths received from model output during mid-session tool execution, the correct behaviour is to inject an error `tool_result` turn — NOT return HTTP 400 to the client. The POST request has already been accepted; only the file operation is blocked. This is documented in:
- The updated story AC8 text
- The test plan AC8 ambiguity resolution note
- Review artefact wucp.3-review-1.md finding 1-M1

Tests T3.18–T3.20 assert error-string return (not an HTTP response), confirming this interpretation.

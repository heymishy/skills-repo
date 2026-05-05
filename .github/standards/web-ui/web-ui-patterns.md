# Web UI Patterns — Skills Platform Server

<!-- Applies to all features that add routes, handlers, or session logic to src/web-ui/ -->

---

## Injectable adapter pattern (D37 / ADR-009)

Any new capability that makes a model call or external I/O call from a route handler MUST be implemented as an injectable adapter. Three things are mandatory — not optional:

### 1. Stub default MUST throw

```js
let _myExecutor = () => {
  throw new Error('Adapter not wired: _myExecutor. Call setMyExecutorAdapter() with a real implementation before use.');
};
```

Do NOT use a stub that returns `null`, `undefined`, `''`, or any other safe-looking value. Silent stubs let the flow complete incorrectly with no error and no diagnostic signal.

### 2. Setter exported from the route module

```js
function setMyExecutorAdapter(fn) { _myExecutor = fn; }
module.exports = { ..., setMyExecutorAdapter };
```

### 3. Production wiring in `server.js`

The wiring must be an explicit, separate task in the implementation plan — not bundled with the handler task. After wiring, confirm with:

```js
const { setMyExecutorAdapter } = require('./routes/skills');
setMyExecutorAdapter(realModelCallFn);
```

A DoR AC must verify the wiring is present: "The adapter is wired to a real implementation in `server.js` and the wiring is verified by a test or smoke check."

---

## Session token access

**`req.session.accessToken` is the canonical field name** for the GitHub OAuth token on all web UI routes.

- Never use `req.session.token` — it is not populated by the OAuth callback.
- DoR grep check (must return zero results): `grep -rn "req\.session\.token[^A]" src/web-ui/`

---

## Silent fallback — three-path test coverage requirement

Any route that implements a silent fallback (primary call fails → fall back to static/default, no error shown to operator) MUST have test coverage for all three failure modes:

1. Executor **throws** an error
2. Executor **returns an empty string** (or equivalent falsy value)
3. Executor **returns `null`**

Each failure mode must assert:
- The response is a redirect or the next page (not an error page)
- The fallback content (static question, default text) is served

One test per failure mode — three separate test cases, not one.

---

## Progress display invariant

When a UI flow presents `Question X of N` or equivalent progress indication, `N` MUST be derived from the static/template source, not from any dynamically-generated content.

- Reason: model output may be shorter or longer than the canonical list; operators need a stable completion signal.
- Applies to: question count, section count, any other step-count UI.
- See ADR-019 in `.github/architecture-guardrails.md`.

---

## Stack constraints

- No new npm `dependencies` — Node.js built-ins only (same constraint as wuce.26)
- No Express — raw `http.createServer` only
- All session state via `req.session.*` — no cookie-based auth outside the OAuth callback handler

---

## Shared shell module — canonical source for renderShell() and escHtml()

`src/web-ui/utils/html-shell.js` is the **single canonical source** for two shared functions used by all HTML route views:

- `renderShell(title, bodyHtml, navHighlight)` — renders the full HTML page with navigation landmark, `<head>`, and `<body>` wrapper
- `escHtml(str)` — HTML-escapes a string before injecting it into a rendered response (XSS protection)

**Rules:**
- Every HTML route view MUST import both functions from `src/web-ui/utils/html-shell.js`. Never re-implement or duplicate either function in a route or renderer module.
- `escHtml()` MUST be applied to every user-supplied or model-supplied string before injecting it into an HTML response body.
- If a new nav entry or shell layout change is needed, modify `html-shell.js` — not individual route files.

---

## HTML render function unit test pattern

When testing an HTML render function, assert on **specific string fragments** in the rendered output — do not snapshot the full HTML string. This approach is robust to minor template changes and gives precise, readable failure messages.

Minimum coverage per render function:

1. **Happy path** — expected content fragments appear in the output (title, key data, nav landmark)
2. **XSS injection** — a `<script>` or `"` character in input is escaped by `escHtml()` and does not appear unescaped in the output
3. **Empty / null data** — empty array or null input does not throw; renders a graceful empty state

Example:
```js
const html = renderFeatureList([]);
assert(html.includes('<nav'), 'nav landmark present');
assert(!html.includes('<script>'), 'no raw script tags');
assert(html.includes('No features'), 'empty state rendered');
```

Do NOT use `assert.strictEqual(html, fullExpectedString)` — full-snapshot equality tests break on every whitespace change and do not communicate what property failed.

---

## COPILOT_HOME per-user session isolation

Each user's Copilot CLI execution context MUST use an isolated `COPILOT_HOME` directory:

```js
const userHome = path.join(process.env.COPILOT_HOMES_BASE, sessionId);
env.COPILOT_HOME = userHome;
```

**Rules:**
- `COPILOT_HOME` is per-session, not per-server-process. Never share a `COPILOT_HOME` between two concurrent user sessions.
- The base directory (`COPILOT_HOMES_BASE`) must be outside the repo root to prevent accidental git tracking of CLI state.
- Cleanup: delete the per-session directory on session end or server restart (not during the session — the CLI may write state between turns).
- This is a non-negotiable multi-tenant security requirement. Skipping it allows one user's OAuth token and session history to leak into another's CLI context.

Source: wuce.10, 17/17 unit tests.

---

## Skill name allowlist validation

Skill names provided by the user (URL path segment, form field, query parameter) MUST be validated against the filesystem-discovered skill list before use:

```js
const discovered = await discoverSkills(skillsDir); // returns string[]
if (!discovered.includes(skillName)) {
  return respond(res, 400, { error: 'INVALID_SKILL_NAME' });
}
```

**Rules:**
- Never trust a user-provided skill name directly as a file path component.
- Validation must happen before any file read, CLI invocation, or session creation that uses the skill name.
- Path-traversal patterns (`../`, `%2F`, encoded variants) must also be rejected — the allowlist check alone is sufficient if the discovered list contains only valid names, but explicit path-traversal rejection provides defence-in-depth.

Source: wuce.9 (command injection mitigation), wuce.11 (skill discovery + routing).

---

## Wave sequencing for HTML layer delivery

When delivering an HTML route layer across multiple stories, sequence story dispatch in this order:

1. **Shared shell + escHtml first** — `html-shell.js` or equivalent shared module must be on `master` before any consuming views are dispatched
2. **Read-only views** — pages that only render data (lists, index views, status boards)
3. **Interactive forms and flows** — pages that POST answers, submit commits, or trigger model calls

Dispatching a read-only view story before the shared shell is on master causes every consuming story to either re-implement the shell (duplicate) or import a path that doesn't exist yet (broken tests from the start).

This sequencing applies to any layered HTML surface — not just skills flows.

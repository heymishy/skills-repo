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
- **This rule applies even to "minimal," "admin-only," or "no polish needed" pages.** A story ACs/NFRs stating a page needs no polished UI is a statement about visual design effort, not a licence to bypass the shared shell and escaping functions — the two are independent. `routes/team-management.js`'s `handleGetTeamMembers` (tir-s3) hand-rolled its own `_escapeHtml` and a bare unstyled HTML string instead of `html-shell.js`'s `renderShell`/`escHtml`; `handleGetCreateInviteForm` (wsi-s6) then explicitly copied that same pattern ("reuses handleGetTeamMembers's exact existing rendering pattern"), propagating the violation to a second route. Both passed `/review` and `/definition-of-ready` because the "no polished UI required" framing read as an accepted scope choice rather than a standards violation — a real browser (Chrome) review of the live staging page is what surfaced the visual inconsistency against the rest of the app, not the automated test suite or either DoR contract. Reviewers and DoR contracts must check new HTML-rendering handlers against this rule regardless of how the story frames visual polish. Source: `wuce-self-serve-invites` epic, `/improve` pass, 2026-08-16.

### Every renderShell() caller MUST supply the Products-nav sidebar data — this is the single most common web-ui defect in this repo

`renderShell()`'s sidebar sub-renderer (`renderProductsSection` in `html-shell.js`) has a hard early return — `if (!products) return '';` — that silently drops the ENTIRE persistent "Products" sidebar section (product list, "See all products," "+ New product") whenever a caller doesn't supply `products`/`activeProductId`/`noProductJourneyCount`. This is not a hypothetical edge case: it has now recurred 3 separate times across this repo's history — once for a single page (`bvnd-s1`, `/dashboard?view=board`) and once as a 22-site, 10-file defect found only via a full-codebase audit (`pncg-s1`) after `pan-s1` (2026-07-30) deliberately wired only 3 handlers and left an explicit revisit trigger unactioned for weeks.

**The standing fix — use it for every new page, not just migrations:** `renderShellWithNav(pool, tenantId, opts)`, exported from `src/web-ui/routes/products.js`, fetches `getProductsNavSummary(pool, tenantId)` and merges `products`/`activeProductId`/`noProductJourneyCount` into `opts` before delegating to the real `renderShell(opts)`. Any new route handler that renders a full page (not a fragment, redirect, or error response) MUST call `renderShellWithNav()` instead of `renderShell()` directly — calling `renderShell()` directly on a new full-page handler is the exact mistake this section exists to prevent.

**When the handler can't become `async`, or the render call lives inside an existing pure render-helper function** (a function that takes pre-fetched plain data and returns an HTML string, e.g. `_renderProductView`/`_renderProductDashboard`'s established shape) — **thread the nav data in as new optional trailing parameters on the existing function, do not split the function.** The calling handler fetches `getProductsNavSummary()` itself and passes `products`/`activeProductId`/`noProductJourneyCount` straight into the render-helper, which threads them into its own `renderShell()` call. This was validated 4 times in `pncg-s1` (`_renderProductNew`, `_renderRoadmapTab`, `_renderGuardrailsForm`, `settings.js`'s `renderSettingsPage`) and preserves existing callers' behaviour for free, since `renderProductsSection`'s own falsy-check means an omitted parameter is indistinguishable from "no products" for any pre-existing test that doesn't pass the new fields.

**Anti-pattern — do not split an existing render function into a body-only helper plus an unchanged shell-wrapping function just to reach a new async helper.** `pncg-s1`'s first attempt at fixing `settings.js` did exactly this (`_buildSettingsBody` + unchanged `renderSettingsPage` + a `handleGetSettings` that called both `_buildSettingsBody()` and `renderShellWithNav()` itself, duplicating the shell-options literal). It worked, was spec-compliant, and even had a `decisions.md` entry defending it — but a second, more skeptical review found the split left a production function (`renderSettingsPage`) with no production caller (only its own test suite), a duplicated options object that now had to be kept in sync by hand, and — critically — a decisions.md citation of an "established precedent" that turned out not to match what that precedent actually did. It was reverted in favour of the parameter-threading pattern above. Source: `pan-s1` (2026-07-30), `bvnd-s1` (2026-08-25, PR #768), `pncg-s1` (2026-08-26, PR #770), `/improve` pass 2026-08-26.

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

### Hybrid structural + functional testing for a defect repeated across many sites

When a story fixes the *same* mechanical defect at many call sites (e.g. `pncg-s1`'s 22 sites across 10 files), writing a full functional integration test per site is disproportionate — but sampling a handful and hoping the rest match is not sufficient evidence either. Use a **hybrid strategy**: one **structural test**, driven by an explicit manifest of every known site (function name + file + expected call pattern), that statically parses each file's real source to confirm every site was actually fixed — plus a **small number of functional integration tests** (`pncg-s1` used 4) exercising a representative subset end-to-end to confirm the structural check's premise is actually true (that finding the right call pattern in source really does mean the rendered page contains the section). The manifest itself becomes the living source of truth for "is this defect class fully fixed" — a future site that's missed shows up as a manifest/reality mismatch, not a silent gap.

**Blind spot — a structural test that parses source text must strip comments and string literals before searching, or it can be defeated by a decoy.** A first version of `pncg-s1`'s structural test counted occurrences of `renderShellWithNav(` via a raw substring search over the file's full source, including comments — so a stray `// renderShellWithNav(...)` comment left behind by a future edit (whether accidental or as a lazy "fix" of a failing test) would satisfy the check without the real call existing. Caught by code-quality review, fixed by adding a `stripComments()` pass (reusing the same brace-depth/string-aware parser already needed to extract function bodies) before doing any pattern search. Any structural test that greps or substring-matches real `.js`/`.ts` source for a required pattern must do the same — verify with a scratch decoy-comment test before trusting the check. Source: `pncg-s1`, `/improve` pass, 2026-08-26.

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

---

## Model turn history format

When passing conversation history to the model, use the `[{role, content}]` array format — never ad-hoc string concatenation or session-specific field names.

```js
// Correct — portable across any model call site
const messages = [
  { role: 'system', content: systemPrompt },
  ...session.turns,           // [{role:'user'|'assistant', content}]
  { role: 'user', content: currentInput }
];
```

**Rules:**
- System prompt is always the first message.
- Full history is passed on every turn — do not truncate unless a documented token budget is exceeded.
- User and assistant turns are stored as `{role, content}` pairs in `session.turns` — not as domain-specific fields.
- This format is the contract between the route handler and `skill-turn-executor.js`. Future model adapters must accept this shape.

Source: mfc.1 architecture decision.

---

## Multi-skill journey orchestration (Option B — per-skill sessions with handoff)

When building a multi-step guided journey across several skills (e.g. /workflow → /discovery → /benefit-metric → ... → /definition-of-ready), the session architecture MUST follow **Option B**: one fresh session per skill stage, with a structured handoff block injected at the start of each new session.

**Option A (single persistent session across multiple skills) is explicitly ruled out.** Three structural blockers in the mfc.1 session model make it incompatible without significant refactoring: (1) `session.done` fires on the first artefact signal and cannot be reset; (2) `buildSystemPrompt` is called once at session creation and stored as `session.systemPrompt` — the system prompt is immutable per session, so swapping SKILL.md content between stages is not supported; (3) context budget risk — multiple SKILL.md files plus full outer loop conversation history approaches the model's 128k token limit before any artefact output. Do not attempt to revive Option A unless mfc.1's session model is refactored to support session reset and swappable system prompts. Source: ADR-022.

**Option B implementation rules:**

1. The orchestrator creates a new session for each skill stage using `registerHtmlSession(sessionId, repoPath, skillName, priorArtefacts)`.
2. Prior-stage context is passed as the `priorArtefacts` parameter — an array of `{path, content}` objects where `content` is read from disk (not from in-memory session state).
3. The journey state store tracks `completedStages`, `activeSessionId`, and `storyList` (for per-story stages).
4. The orchestrator must link each new session to the journey via `linkSessionToJourney(sessionId, journeyId)` immediately after creation.
5. The gate-confirm handler is the transition point: it writes the artefact to disk, reads it back, builds the handoff, creates the next stage session, and redirects.

**Handoff block injection via `buildSystemPrompt`:**

The `priorArtefacts` parameter adds a `--- HANDOFF CONTEXT ---` block to the system prompt. Each prior artefact appears as:

```
--- PRIOR ARTEFACT: artefacts/[date-slug]/[skillName].md ---
[file content]
--- END PRIOR ARTEFACT ---
```

This is B-iii (artefact content only). Token budget for largest injection ≈ 8k tokens — well within per-session budget. Source: ADR-023.

---

## Disk canonicity — write-then-read for gate-confirm handoff

Any gate-confirm handler that transitions to the next skill stage MUST follow the write-then-read sequence:

1. **Write** `session.artefactContent` to disk at the resolved `artefactPath`.
2. **Read back** from disk using `fs.readFileSync(artefactPath, 'utf8')`.
3. **Use the disk content** (not `session.artefactContent`) to build the `priorArtefacts` array for the next stage session.

```js
// Correct — disk is canonical
fs.writeFileSync(resolvedPath, session.artefactContent, 'utf8');
const diskContent = fs.readFileSync(resolvedPath, 'utf8');
const priorArtefacts = [{ path: session.artefactPath, content: diskContent }];
```

**Why:** `/trace` always validates against disk. Using `session.artefactContent` directly for handoff would create a divergence between what the next skill receives and what the trace sees if any edit was made between LLM output and the gate-confirm click. Disk is the durable record. Source: ougl decisions.md (2026-05-06).

**Atomicity ordering:** the disk write MUST precede the `completeStage()` call. If the write fails (throws), `completeStage` is never called and the journey state is not advanced. This is the correct failure mode — a failed write must not advance the stage.

---

## Structured lifecycle log events

Route handlers that perform significant lifecycle operations (artefact saved to disk, journey completed, story advanced) MUST emit structured log events at those boundaries.

**Format:**

```js
console.log(JSON.stringify({ event: 'artefact_saved_to_disk', journeyId, skillName, artefactPath }));
console.log(JSON.stringify({ event: 'journey_completed', journeyId, stageCount: journey.completedStages.length }));
console.log(JSON.stringify({ event: 'story_advanced', journeyId, nextStory, remainingCount }));
```

**Rules:**
- All log events use `JSON.stringify({...})` — not template literals. This ensures parseable output for log aggregation tools.
- The `event` field is a `snake_case` string identifying the lifecycle point.
- Include enough context fields to correlate the event without reading session state (at minimum: `journeyId` or equivalent correlation ID, plus the key entity acted on).
- Do not log sensitive values (access tokens, session content, user-provided free text).
- Lifecycle log events should be verified by at least one test that asserts the log call was made with the expected arguments (spy or capture pattern).

Source: ougl NFR-obs-journeycompleted, NFR-obs-artefactsaved (2026-05-06).

---

## Path traversal guard for disk writes

Any route handler that writes a file to disk at a path derived from request data (URL params, form fields, session values set earlier in the flow) MUST validate that the resolved path starts with the repo root before any write is performed.

```js
const repoRoot = path.resolve(__dirname, '../../..'); // adjust depth for your module location
const resolvedPath = path.resolve(artefactPath);
if (!resolvedPath.startsWith(repoRoot + path.sep) && resolvedPath !== repoRoot) {
  return respond(res, 400, 'artefact path escapes repo root');
}
// safe to write
fs.writeFileSync(resolvedPath, content, 'utf8');
```

**Rules:**
- The guard MUST use `path.resolve()` on the input before comparison — never compare raw strings.
- The comparison is `startsWith(repoRoot + path.sep)` — not `startsWith(repoRoot)` alone, which would incorrectly allow paths like `/repo-root-suffix/...`.
- Return HTTP 400 (not 500) when the guard triggers — this is a client input error, not a server fault.
- Do not log the offending path value in production (it may contain traversal sequences).
- This guard applies to any path value that the user could influence, even indirectly (e.g. a feature slug stored in session that is later used to construct an artefact path).
- A dedicated test MUST cover the path traversal case (e.g. `artefactPath = '../../etc/passwd'`) and assert: (1) HTTP 400 returned, (2) no file written to disk.

This complements the skill name allowlist (which validates URL-path skill names) — both are required defences.

Source: ougl.5 AC11, ougl.6 AC8, NFR-sec-pathtraversal (2026-05-06).

---

## Artefact signal protocol

When a model session is expected to produce a committable artefact, the model signals completion using embedded markers in its response:

```
---SLUG---
<feature-slug>
---ARTEFACT-START---
<full artefact content>
---ARTEFACT-END---
```

The server-side parser extracts content between the markers and derives the artefact path as `artefacts/<slug>/<skillName>.md`.

**Rules:**
- The system prompt MUST instruct the model to use this exact marker syntax. Do not rely on the model discovering it from examples.
- The `---SLUG---` line MUST precede `---ARTEFACT-START---` in the same response.
- The parser must be robust to leading/trailing whitespace around marker lines.
- If the model produces markers inside a fenced code block (e.g. as an example), the first occurrence wins — the system prompt must warn the model not to produce the markers as examples.
- `session.done` is set to `true` when the signal is found. Subsequent turns for that session are rejected with a 409.
- This protocol is skill-agnostic — it works for any SKILL.md, not only discovery.

Source: mfc.1 architecture decision.

---

## Journey state GET response shape contract (wsm / ADR-024)

`GET /api/journey/:id` (the canonical journey state endpoint) MUST return a response that includes all of the following fields. Any story that adds a new consumer of this endpoint (viewer, breadcrumb, turn-list UI) MUST ensure the field it consumes is present — not assume the handler returns it.

### Required response fields

```js
{
  id: string,                   // journey ID
  stage: string,                // active skill stage name
  status: string,               // journey status (e.g. 'active', 'complete')
  ownerId: string,              // GitHub login of journey owner
  turns: Array<TurnObject>,     // all turns (owner + model) in chronological order
  stages: Array<StageObject>,   // all skill stages with navigable flag
  completedStages: string[],    // list of completed stage names
  activeSkill: string           // current active skill name
}
```

Where:
- `TurnObject`: `{ role, content, type? }` — `type: 'session-boundary'` is a synthetic marker injected when a journey was persisted and reloaded
- `StageObject`: `{ name, label, navigable: boolean, completed: boolean, needsReview?: boolean }`

### Rules

1. **Never return a partial shape.** If a consumer AC requires `turns` or `stages`, the handler MUST include them. Partial shapes produce silent test failures that are only discovered at DoD verification.
2. **`turns` is always an array** — never `undefined`, never omitted. If no turns exist, return `[]`.
3. **`stages` is always an array** — never omitted. Derive it from the journey's stage configuration on every GET, marking each stage `navigable: true` if it is completed or is the current active stage.
4. **Session boundary marker**: When a session was persisted and the journey's turns include turns from a prior server process, inject a `{ role: 'system', type: 'session-boundary', content: 'Previous session' }` object at the boundary point before returning the turns array.
5. **AC must be phrased as shape assertions.** Any AC that depends on a response field must name the field explicitly: "GET /api/journey/:id response MUST include `stages[]` with `navigable` flag per stage" — not "breadcrumb shows navigable stages." The handler author needs the shape contract, not the UI description.

### Verification gate (pre-PR requirement)

Before opening a PR for any change to `handleGetJourneyState` or any story that adds a consumer of the journey GET endpoint, run the full check script (`tests/check-wsm*.js`) locally. A shape failure (`turns not an array`, `stages missing`) means the handler is incomplete — do not merge.

Source: wsm.2 AC1/3/6, wsm.3 AC1/6, workspace/learnings.md D41, ADR-024.

---

## Blended aggregation for rollup percentages

**Rule:** When computing an aggregate percentage across multiple sub-records (e.g. test coverage or acceptance-criteria coverage across a product's features), use a blended sum-of-numerator / sum-of-denominator calculation, not an average of each sub-record's own percentage.

**Why:** Averaging per-record percentages weights every sub-record equally regardless of its actual size — a feature with 2/2 tests passing (100%) and a feature with 2/200 tests passing (1%) would average to 50.5%, which misrepresents the product's real aggregate coverage (204 total, 4 passing = ~2%). Sum-of-passing / sum-of-total reflects the real aggregate.

**Companion rule — exclusion, not zero:** A sub-record with no data for the metric being aggregated (e.g. a feature with no `testPlan` at all) must be excluded from both the numerator and denominator, not counted as 0%. Counting it as 0% skews the aggregate down for a feature that simply hasn't reached that phase yet, which is a different condition from a feature that reached it and failed.

**Companion rule — explicit empty state:** If zero sub-records have any data for the metric, render an explicit "No data yet" state — never a bare `0%` or `NaN`, both of which are indistinguishable from "everything failed."

**Apply this to any future aggregate-percentage rollup, not just test/AC coverage** — the same three rules (blend, exclude, explicit-empty) generalise to any sum-based product-level metric computed from per-feature or per-story data.

**Source:** product-rollup epic (2026-07-16-product-rollup), pr-s5 (test coverage) and pr-s6 (AC coverage) — same convention applied to both for consistency, per that feature's own discovery-time decision.

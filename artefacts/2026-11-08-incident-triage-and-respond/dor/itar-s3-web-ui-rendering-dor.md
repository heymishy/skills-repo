# Definition of Ready: Web UI rendering — first slice of initiative 1's visibility surface

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md
**Assessed by:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Review

✅ Contract review passed — the proposed implementation (see `itar-s3-web-ui-rendering-dor-contract.md`) aligns with all 4 ACs. The graceful-degradation approach for AC3 matches `urpv-s3`'s established precedent exactly, and the real-fixture proof for AC4 is unchanged from the story's own intent. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "delivery engineer responding to an alert" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 2 unit + 1 integration; AC2: 1 unit; AC3: 1 integration; AC4: 1 integration |
| H4 | Out-of-scope populated | ✅ | 3 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Web UI rendering existence" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review-1.md: PASS, 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps table: "None" |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream "itar-s1, itar-s2" — the dependency is on the `INCIDENT` record shape (itar-s1's data-model marker) and the `triageSummary` field itar-s2 populates, not on `pipeline-state.schema.json` fields. Same reasoning as itar-s2's own H8-ext entry: this dependency flows through `workspace/incidents.json`'s own schema, a file separate from `pipeline-state.json`. `schemaDepends: [id, status, triageSummary]` declared against itar-s1/itar-s2's data-model definitions — all 3 fields confirmed present there. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 bullets incl. ADR-025, MC-A11Y-02; review found no Category E HIGH |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | Step 3a scan at /test-plan found no CSS-layout-dependent AC — "distinct item"/"visible without click-through" are DOM-content checks, not rendered-position checks |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-incident-triage-and-respond/nfr-profile.md` |
| H-NFR2 | Compliance NFR w/ clause has sign-off | ✅ N/A | No compliance NFR with a named regulatory clause in this story |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in nfr-profile.md |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section is populated (not None); profile exists |
| H-GOV | Approved By ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" (M1: positive signal) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | `fetchRepoPath` is an existing, already-wired adapter reused here — this story introduces no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ PASS-with-accepted-exception | `node scripts/check-design-tokens.js` against `src/web-ui/routes/products.js` (the declared touched file) found ~40 pre-existing non-token colors, none introduced by this story. RISK-ACCEPTed per operator decision — full entry in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09), cross-referenced in this feature's `decisions.md` (2026-11-09). This story's own new rendering code commits to using only real `DESIGN.md` tokens — see Coding Agent Instructions constraint below. |

**All hard blocks pass** (H-DESIGN passes with an explicitly accepted, logged exception for pre-existing debt unrelated to this story).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ N/A | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged via RISK-ACCEPT, see `decisions.md` 2026-11-09 entry (covers all 4 stories in this feature) |
| W5 | No UNCERTAIN gap-table items left | ✅ | — | Gap table: "None" |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the Coding Agent Instructions block below under "Applicable standards."

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Web UI rendering — first slice of initiative 1's visibility surface — artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
Test plan: artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse fetchRepoPath exactly as urpv-s3 established it — do not build a new GitHub API code path
- Extend _renderConsolidatedFeaturesSection (products.js:496) directly — do not create a parallel rendering path
- All incident content (tags, summary, triage text) MUST be passed through html-shell.js's escHtml() before injection — never raw HTML (MC-SEC-01, NFR-SEC-1)
- Status must render as a text label (MC-A11Y-02) — never colour-swatch-only
- A missing workspace/incidents.json must degrade gracefully to zero items, no visible error — mirror urpv-s3's exact pattern
- DESIGN TOKENS: this story's own new markup/CSS must use only real DESIGN.md tokens. src/web-ui/routes/products.js has ~40 pre-existing non-token colors UNRELATED to this story that are RISK-ACCEPTed (see decisions.md 2026-11-09) — do not fix them as part of this story's scope, and do not introduce any new non-token color alongside them.
- If this handler renders a full page (not a fragment), it MUST call renderShellWithNav(), never renderShell() directly, per the web-ui-patterns.md standard below
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

## Applicable standards

### `.github/standards/web-ui/web-ui-patterns.md` (matched domain: web-ui)

<!-- Full text of the matched standards file, injected per the standards-injection step -->

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

**(Not applicable to this story — itar-s3 introduces no new injectable adapter; it reuses the already-wired `fetchRepoPath`.)**

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

**(Relevant to AC3's graceful-degradation path — a missing `incidents.json` is the `ArtefactNotFoundError`-throws case; confirm the fallback renders normally with zero items, not an error page.)**

---

## Progress display invariant

When a UI flow presents `Question X of N` or equivalent progress indication, `N` MUST be derived from the static/template source, not from any dynamically-generated content.

- Reason: model output may be shorter or longer than the canonical list; operators need a stable completion signal.
- Applies to: question count, section count, any other step-count UI.
- See ADR-019 in `.github/architecture-guardrails.md`.

**(Not applicable — this story has no progress/step-count UI.)**

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

**This story (itar-s3) extends an existing render helper (`_renderConsolidatedFeaturesSection`, called from within `_renderProductView`/`handleGetProductView`) rather than adding a new top-level full-page handler — confirm the existing call chain already reaches `renderShellWithNav()` upstream; do not re-derive nav data inside the extension itself.**

**When the handler can't become `async`, or the render call lives inside an existing pure render-helper function** (a function that takes pre-fetched plain data and returns an HTML string, e.g. `_renderProductView`/`_renderProductDashboard`'s established shape) — **thread the nav data in as new optional trailing parameters on the existing function, do not split the function.** This was validated 4 times in `pncg-s1` (`_renderProductNew`, `_renderRoadmapTab`, `_renderGuardrailsForm`, `settings.js`'s `renderSettingsPage`) and preserves existing callers' behaviour for free.

**Anti-pattern — do not split an existing render function into a body-only helper plus an unchanged shell-wrapping function just to reach a new async helper.** Reverted once already in this repo (`pncg-s1`'s first attempt on `settings.js`) — do not repeat it here.

---

## HTML render function unit test pattern

When testing an HTML render function, assert on **specific string fragments** in the rendered output — do not snapshot the full HTML string.

Minimum coverage per render function:

1. **Happy path** — expected content fragments appear in the output (title, key data, nav landmark)
2. **XSS injection** — a `<script>` or `"` character in input is escaped by `escHtml()` and does not appear unescaped in the output
3. **Empty / null data** — empty array or null input does not throw; renders a graceful empty state

Do NOT use `assert.strictEqual(html, fullExpectedString)` — full-snapshot equality tests break on every whitespace change.

**(Directly applicable — this story's test plan already follows this pattern: `renderIncidentItem_showsStatusAsTextLabel_notColorAlone` is a happy-path fragment assertion; `NFR-SEC-1` is the XSS-injection assertion; `renderIncidentItem_omitsTriageSummaryBlock_whenAbsent` and the `ArtefactNotFoundError` integration test are the empty/null-data cases.)**

---

## Other sections (not directly applicable to this story, included for completeness per standards-injection requirement)

The remaining sections of this standards file — COPILOT_HOME per-user session isolation, skill name allowlist validation, wave sequencing for HTML layer delivery, model turn history format, multi-skill journey orchestration, disk canonicity for gate-confirm handoff, structured lifecycle log events, path traversal guard for disk writes, artefact signal protocol, journey state GET response shape contract, blended aggregation for rollup percentages, and client-side DOM patch vs. full page reload — govern mechanisms this story does not touch (no CLI sessions, no skill-name routing, no journey orchestration, no new disk-writing route, no aggregate percentage rollup, no POST action). Read the full file at `.github/standards/web-ui/web-ui-patterns.md` before implementing in case the implementation plan's approach changes in a way that brings one of these into scope.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint)
**Signed off by:** Not required

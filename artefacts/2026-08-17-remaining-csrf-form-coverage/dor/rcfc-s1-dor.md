## Definition of Ready: Extend CSRF token protection to the remaining server-rendered POST forms

**Story reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Test plan reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
**Contract proposal:** artefacts/2026-08-17-remaining-csrf-form-coverage/dor/rcfc-s1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — see dor-contract |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — `/review` explicitly skipped per `CLAUDE.md` |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H8-ext, H-NFR/2/3, H-NFR-profile, H-GOV, H-ADAPTER, H-INF, H-MIG): see `rcfc-s1-dor-contract.md`.

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | | |
| W2 | Scope stability is declared | ✅ | | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | RISK-ACCEPT logged — see `decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | | |

---

## Oversight level

**Medium** — matches the direct sibling precedent (`sec-perf-s2`/`sec-perf-s3`, the same feature this story continues). Operator (sole reviewer in this solo-operator repo) confirmed awareness of this DoR artefact before assignment.

---

## Standards injection

**Domain tags:** `web-ui`, `security`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`

These are appended below in full — the coding agent must read and comply with both before implementing.

### Applicable standards (full text)

#### `.github/standards/web-ui/web-ui-patterns.md`

```
# Web UI Patterns — Skills Platform Server

<!-- Applies to all features that add routes, handlers, or session logic to src/web-ui/ -->

---

## Injectable adapter pattern (D37 / ADR-009)

Any new capability that makes a model call or external I/O call from a route handler MUST be implemented as an injectable adapter. Three things are mandatory — not optional:

### 1. Stub default MUST throw

let _myExecutor = () => {
  throw new Error('Adapter not wired: _myExecutor. Call setMyExecutorAdapter() with a real implementation before use.');
};

Do NOT use a stub that returns null, undefined, '', or any other safe-looking value. Silent stubs let the flow complete incorrectly with no error and no diagnostic signal.

### 2. Setter exported from the route module

function setMyExecutorAdapter(fn) { _myExecutor = fn; }
module.exports = { ..., setMyExecutorAdapter };

### 3. Production wiring in server.js

The wiring must be an explicit, separate task in the implementation plan — not bundled with the handler task. After wiring, confirm with:

const { setMyExecutorAdapter } = require('./routes/skills');
setMyExecutorAdapter(realModelCallFn);

A DoR AC must verify the wiring is present: "The adapter is wired to a real implementation in server.js and the wiring is verified by a test or smoke check."

[NOTE for this story: H-ADAPTER above determined this section does not apply — this story introduces no new injectable adapter, reusing sec-perf-s3's existing plain exported csrfGuard/generateCsrfToken/csrfField functions.]

---

## Session token access

req.session.accessToken is the canonical field name for the GitHub OAuth token on all web UI routes.

- Never use req.session.token — it is not populated by the OAuth callback.
- DoR grep check (must return zero results): grep -rn "req\.session\.token[^A]" src/web-ui/

---

## Silent fallback — three-path test coverage requirement

[Not applicable to this story — no silent-fallback behaviour is introduced.]

---

## Stack constraints

- No new npm dependencies — Node.js built-ins only
- No Express — raw http.createServer only
- All session state via req.session.* — no cookie-based auth outside the OAuth callback handler

---

## Shared shell module — canonical source for renderShell() and escHtml()

src/web-ui/utils/html-shell.js is the single canonical source for two shared functions used by all HTML route views:

- renderShell(title, bodyHtml, navHighlight) — renders the full HTML page with navigation landmark, <head>, and <body> wrapper
- escHtml(str) — HTML-escapes a string before injecting it into a rendered response (XSS protection)

Rules:
- Every HTML route view MUST import both functions from src/web-ui/utils/html-shell.js. Never re-implement or duplicate either function in a route or renderer module.
- escHtml() MUST be applied to every user-supplied or model-supplied string before injecting it into an HTML response body.
- If a new nav entry or shell layout change is needed, modify html-shell.js — not individual route files.
- This rule applies even to "minimal," "admin-only," or "no polish needed" pages.

[RELEVANT for this story: renderLoginPage() lives in html-shell.js itself, so embedding the CSRF field there must use the same escHtml()/csrfField() escaping convention already used elsewhere in that file — do not hand-roll a differently-escaped variant.]

---

## HTML render function unit test pattern

When testing an HTML render function, assert on specific string fragments in the rendered output — do not snapshot the full HTML string.

Minimum coverage per render function:
1. Happy path — expected content fragments appear in the output
2. XSS injection — a <script> or " character in input is escaped by escHtml() and does not appear unescaped in the output
3. Empty / null data — empty array or null input does not throw; renders a graceful empty state

Do NOT use assert.strictEqual(html, fullExpectedString) — full-snapshot equality tests break on every whitespace change.

[RELEVANT for this story: any new/modified render function embedding the CSRF hidden input should follow this fragment-assertion pattern, not full-snapshot comparison, if a dedicated render-output test is added.]

---

## Structured lifecycle log events

Route handlers that perform significant lifecycle operations MUST emit structured log events at those boundaries, using console.log(JSON.stringify({...})) — not template literals.

[Not directly triggered by this story — no new lifecycle operation is introduced; CSRF rejections are not logged, matching sec-perf-s3's own established convention of not separately audit-logging CSRF rejections.]

---

## Path traversal guard for disk writes

[Not applicable — this story introduces no new disk-write path derived from request data.]

[Remaining sections of web-ui-patterns.md — journey state shape contract, artefact signal protocol, multi-skill session orchestration, blended aggregation — are not applicable to this story's scope and are omitted here for length; read the full file at .github/standards/web-ui/web-ui-patterns.md if any ambiguity arises during implementation.]
```

#### `.github/standards/security/security-standards.md`

```
# Security Standards

## Known gaps (tracked, not yet fixed)

- GET /features/:slug has no tenant-ownership check. [Not relevant to this story's scope.]

## OWASP Top 10 mitigations

- Injection: Parameterised queries only. No string concatenation in queries.
- Broken auth: See auth-patterns.md. Token expiry enforced server-side.
- Sensitive data exposure: TLS 1.2+ only. Secrets in vault, not env files committed to git.
- XXE: XML parsing disabled or hardened. Prefer JSON.
- Access control: Deny by default. Permissions checked at service layer.
- Security misconfiguration: No default credentials. Debug mode off in production.
- XSS: Output encoding in all templates. CSP headers set.
- Insecure deserialisation: No deserialisation of untrusted data to objects.
- Vulnerable components: Dependency scanning in CI. No unpatched critical CVEs shipped.
- Logging: Security events logged (auth failures, access denials). No secrets in logs.

[DIRECTLY RELEVANT for this story: "Access control: Deny by default" is the core standard this story implements — every one of the 9 target routes must reject an invalid/missing CSRF token by default, not silently pass through. "Logging: Security events logged... No secrets in logs" — matches sec-perf-s3's own established convention that CSRF token VALUES are never logged, though CSRF rejections themselves are also not separately audit-logged (same convention, not a contradiction — the token value is the secret, not the rejection event itself).]

## Secrets management

[Not directly relevant — CSRF tokens are session-scoped, not a managed secret in the vault sense, matching sec-perf-s3's own existing treatment.]
```

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend CSRF token protection to the remaining server-rendered POST forms — artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
Test plan: artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only — no new npm dependencies, no Express (raw http.createServer)
- Reuse sec-perf-s3's existing CSRF mechanism exactly (src/web-ui/middleware/csrf.js's
  generateCsrfToken(req), csrfField(token), csrfGuard(req, res)) — do not modify csrf.js
- Wire csrfGuard into exactly the 8 routes enumerated in AC1-AC4 of the story (6 journey-flow
  routes, 2 skill-session form-path routes, 2 products routes, plus embedding
  the missing CSRF field into the legacy login shell's 2 forms) — no more, no fewer
- POST /api/artefacts/:slug/:file/annotations is explicitly OUT of scope (removed 2026-08-24 —
  JSON/fetch-only route, no live server-rendered form target; see decisions.md). Do not touch
  annotation.js or views/artefact-view.js.
- Every protected route's GET-rendering counterpart must embed the CSRF field via
  csrfField(generateCsrfToken(req)), matching sec-perf-s3's own established embedding pattern
- The legacy login shell (renderLoginPage() in html-shell.js) needs ONLY the CSRF field
  embedded — its target handlers (auth-email.js) already call csrfGuard, do not add a
  second/duplicate CSRF check there
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do
  not introduce patterns listed as anti-patterns or violate named mandatory constraints or
  Active ADRs.
- Applicable domain standards are embedded above in full (web-ui-patterns.md,
  security-standards.md) — comply with both, particularly the shared-shell-module rule for
  the legacy login shell change and the deny-by-default access-control standard
- Every "rejected without token" test must dispatch through the real server.js router (not
  the handler in isolation) so it fails exactly as the current unprotected code behaves
  during the TDD RED phase, per CLAUDE.md's D37 wiring-test convention — this is already
  reflected in the test plan's own test descriptions
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing
  the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (no separate tech lead in this solo-operator repo — operator confirmed awareness directly, 2026-08-24)
**Signed off by:** Hamish King (Founder/Operator), 2026-08-24

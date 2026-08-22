# Definition of Ready: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md`
**Test plan reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s1-test-plan.md`
**Contract proposal:** `artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s1-dor-contract.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract Review

Reviewed the Contract Proposal against all 5 ACs and the test plan. No mismatches found — the proposed `resolveRole(req)` refactor + `requireNonViewer` gate + 33-route wiring plan aligns with AC1–AC5 and the test plan's per-route unit test structure.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an admin who assigned a teammate the viewer role" — matches discovery's own "Who It Affects" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 15, AC2: 18, AC3: 3, AC4: 4, AC5: 2 (unit+integration) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items named |
| H5 | Benefit linkage field references a named metric | ✅ | Both benefit-metric.md metrics named |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 2 MEDIUM, both resolved via `/decisions` (see `decisions.md` ARCH entry) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block: "None" (upstream) — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; Category E had 1 MEDIUM (resolved), 1 LOW (informational) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs exist — condition does not trigger |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-21-viewer-role-no-enforcement/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ | No named regulatory clause — condition does not trigger |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" checked |
| H-NFR-profile | NFR profile presence when story NFRs populated | ✅ | Story NFRs populated; profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank named entry | ✅ | "Hamish King, 2026-08-22" — present, not clearly engineer-role-only. M1 signal: role unverified for independent sign-off quality (recorded, not blocking) |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No *new* adapter introduced — `requireNonViewer` reuses `require-admin.js`'s existing, already-wired `resolveRole`/live-role adapter (per `decisions.md` ARCH entry). Its own `setLogger` mirrors an existing, already-proven pattern (`require-admin.js`'s own `_logger`), and is itself explicitly a non-D37 case (logging failures must not block access decisions) — matching `require-admin.js`'s own documented exemption |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Resolved (not just acknowledged) — see `decisions.md` ARCH entry |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged — see `decisions.md`, 2026-08-22 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | — |

---

## Oversight level

**Medium** (from parent epic `vrne-e1`). Operator (sole reviewer in this solo-operator repo) confirmed awareness of this DoR artefact before assignment — satisfies the intent of the Medium-oversight check in the absence of a separate tech-lead role.

---

## Standards injection

**Domain tags:** `web-ui`, `security`, `auth`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`, `.github/standards/auth/auth-patterns.md`

These are appended below in full — the coding agent must read and comply with all three before implementing.

### Applicable standards (full text)

#### `.github/standards/auth/auth-patterns.md`

```
# Authentication & Authorisation Patterns

## Authentication mechanism

[e.g. JWT Bearer tokens issued by the identity service. Tokens expire after 15 minutes. Refresh tokens valid for 7 days.]

## Session management

[e.g. Sessions stored server-side. Session cookie: HttpOnly, Secure, SameSite=Strict. No sensitive data in JWT payload.]

## Authorisation model

[e.g. RBAC. Roles: admin, user, readonly. Permissions checked at the service layer, not just the route layer.]

## MFA requirements

[e.g. Required for all admin actions. OTP delivered via notification service. 6-digit codes, 5-minute expiry, 3-attempt lockout.]

## Password rules

[e.g. Minimum 10 characters. bcrypt with cost factor 12. No maximum length. Breach-check on registration via HaveIBeenPwned API.]

## Prohibited patterns

- No credentials in URLs or logs
- No storing plaintext passwords or tokens
- No client-side auth decisions without server verification

---

## Web UI OAuth session token rule

**`req.session.accessToken` is the canonical field name for the GitHub OAuth token on all web UI routes.**

- All routes that read the GitHub token from session MUST use `req.session.accessToken`.
- Never use `req.session.token` — it is not populated by the OAuth callback and will always be `undefined`.
- This is enforced at DoR with the grep check: `grep -rn "req\.session\.token[^A]" src/web-ui/` must return zero results.
- Applies to: skill turn executor wiring, next-question executor wiring, section draft executor wiring, and any future route that makes a model call on behalf of the operator.
```

#### `.github/standards/security/security-standards.md`

```
# Security Standards

## Known gaps (tracked, not yet fixed)

- **`GET /features/:slug` has no tenant-ownership check.** Confirmed via direct code read during S3.4's route-investigation (2026-07-24) — unlike other journey/feature routes in this repo (e.g. `GET /journey/:id`), this route does not verify the requesting session's tenant owns the target feature before rendering it. Not exploited by S3.4 itself (S3.4 deliberately chose `/journey/:id`, which already had the guard, as its own destination specifically because of this gap) — but the route remains reachable directly by anyone who knows or guesses a `feature_slug`. Needs a follow-up story adding the same `requireJourneyAccess`/`POLICY.TENANT`-equivalent guard used elsewhere in this codebase.

## OWASP Top 10 mitigations

- **Injection:** Parameterised queries only. No string concatenation in queries.
- **Broken auth:** See auth-patterns.md. Token expiry enforced server-side.
- **Sensitive data exposure:** TLS 1.2+ only. Secrets in vault, not env files committed to git.
- **XXE:** XML parsing disabled or hardened. Prefer JSON.
- **Access control:** Deny by default. Permissions checked at service layer.
- **Security misconfiguration:** No default credentials. Debug mode off in production.
- **XSS:** Output encoding in all templates. CSP headers set.
- **Insecure deserialisation:** No deserialisation of untrusted data to objects.
- **Vulnerable components:** Dependency scanning in CI. No unpatched critical CVEs shipped.
- **Logging:** Security events logged (auth failures, access denials). No secrets in logs.

## Secrets management

[e.g. All secrets stored in Azure Key Vault / AWS Secrets Manager / HashiCorp Vault. No secrets in code, config files, or environment variables committed to git.]

## Dependency policy

[e.g. `npm audit` / `pip audit` runs in CI. Builds fail on critical CVEs. Review required for high CVEs before merge.]

## Security review triggers

[e.g. Any change to auth, payments, or PII handling requires a security review before merge.]
```

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

Do NOT use a stub that returns `null`, `undefined`, `''`, or any other safe-looking value. Silent stubs let the flow complete incorrectly with no error and no diagnostic signal.

### 2. Setter exported from the route module

function setMyExecutorAdapter(fn) { _myExecutor = fn; }
module.exports = { ..., setMyExecutorAdapter };

### 3. Production wiring in `server.js`

The wiring must be an explicit, separate task in the implementation plan — not bundled with the handler task. After wiring, confirm with:

const { setMyExecutorAdapter } = require('./routes/skills');
setMyExecutorAdapter(realModelCallFn);

A DoR AC must verify the wiring is present: "The adapter is wired to a real implementation in `server.js` and the wiring is verified by a test or smoke check."

[NOTE for this story: H-ADAPTER above determined this section does not apply — requireNonViewer introduces no new model-call/external-I/O adapter, it reuses require-admin.js's existing live-role adapter.]

---

## Session token access

**`req.session.accessToken` is the canonical field name** for the GitHub OAuth token on all web UI routes.

- Never use `req.session.token` — it is not populated by the OAuth callback.
- DoR grep check (must return zero results): `grep -rn "req\.session\.token[^A]" src/web-ui/`

---

## Stack constraints

- No new npm `dependencies` — Node.js built-ins only
- No Express — raw `http.createServer` only
- All session state via `req.session.*` — no cookie-based auth outside the OAuth callback handler

---

## Structured lifecycle log events

Route handlers that perform significant lifecycle operations MUST emit structured log events at those boundaries, using `console.log(JSON.stringify({ event: '...', ... }))` — not template literals. [Directly relevant: this story's AC5 denial-logging requirement should follow this same structured-JSON convention.]

---

[Remaining sections of web-ui-patterns.md — journey state shape contract, artefact signal protocol, multi-skill session orchestration, blended aggregation — are not applicable to this story's scope and are omitted here for length; read the full file at `.github/standards/web-ui/web-ui-patterns.md` if any ambiguity arises during implementation.]
```

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes — artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md
Test plan: artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only — no new npm dependencies, no Express (raw http.createServer)
- Refactor src/web-ui/middleware/require-admin.js to export resolveRole(req); requireAdmin itself must call this internally so its own existing test suite continues to pass unmodified
- New file src/web-ui/middleware/require-non-viewer.js exports requireNonViewer(req, res, next) — imports and calls resolveRole(req), denies (403) if role is 'viewer' or missing/null/unrecognised, calls next() otherwise
- Wire requireNonViewer into exactly the 15 Products-group and 18 Features/journeys-group routes enumerated in AC1/AC2 of the story — no more, no fewer
- Denial logging: structured JSON log event (event: 'viewer_write_denied') with personId, tenantId, timestamp, route — via an injectable setLogger, defaulting to a safe no-op (mirrors require-admin.js's own _logger exemption — a logging failure must never block the access decision)
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Applicable domain standards are embedded above in full (auth-patterns.md, security-standards.md, web-ui-patterns.md) — comply with all three, particularly the injectable-adapter pattern's exemption reasoning and the structured-lifecycle-log-events convention
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (no separate tech lead in this solo-operator repo — operator confirmed awareness directly, 2026-08-22)
**Signed off by:** Hamish King, 2026-08-22

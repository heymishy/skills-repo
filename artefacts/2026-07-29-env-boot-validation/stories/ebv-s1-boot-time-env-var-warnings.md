# Story: Warn at boot time for silently-misconfigured-but-optional env vars

**Epic reference:** None — short-track (infra fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the recurring incident class already confirmed 4 times this repo's history (see Benefit Linkage)
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator standing up or diagnosing a new staging/production environment**,
I want **the server to log a clear, visible warning at boot for any known-important-but-optional env var that's missing or internally inconsistent**,
So that **a missing or mismatched configuration shows up in `flyctl logs` on the very first request, instead of requiring a source-reading investigation each time a feature silently no-ops or a request fails deep in a handler**.

## Benefit Linkage

**Metric moved:** None formal (short-track infra fix, no benefit-metric artefact) — operational diagnosability, quantified below.
**How:** `workspace/learnings.md` (2026-07-19/20, "Silently-optional env vars with no startup warning are a recurring class of staging gaps") documents 4 separate real incidents this repo's history, each diagnosed only by reading source code to find the exact env var name, then confirming via `flyctl secrets list` that it was absent or wrong:
1. `PLATFORM_TENANT_ID` unset — `registerSelfAsProduct()` (`src/web-ui/modules/platform-self-registration.js`) silently `return null`s, no log, so the dogfooding self-registration feature appeared to simply not exist.
2. `ADMIN_GITHUB_LOGINS` unset/empty — `server.js`'s admin-role-seeding block (`_adminLogins.length` check) silently does nothing when the list is empty, leaving every operator (including the account owner) locked out of `/admin/credits` with a plain 403 and no hint why.
3. `POSTHOG_KEY_STAGING`/`POSTHOG_KEY_PROD` missing — **already resolved** by existing code (`src/web-ui/modules/posthog-config.js`'s `initPostHogFlagsClient()`, wired at module-load time in `server.js`, logs a clear `console.error` naming the missing var and never crashes). Investigated and confirmed working as intended — out of scope for this story, included here only for completeness against the full incident list.
4. `SKILL_EXECUTOR_PROVIDER` explicitly set to `copilot` on `wuce-staging` with no Copilot-licensed token behind it — every skill turn silently routed through Copilot and failed deep inside `_callCopilot()` with `"not licensed to use Copilot"`, only diagnosed once the actual `sse_error` log line was captured and read.

## Architecture Constraints

- **Extends `src/web-ui/config/validate-env.js` (ADR-004: env config single source of truth)** — this file already implements one boot-time check (`validateRequiredEnvVars()`, hard-fail via `throw`, called from `server.js`'s `require.main === module` block before `server.listen()`). This story adds a second, distinct function in the same module for the different failure mode: known-important vars that are legitimately optional in some deployments, so they warn (`console.warn`) rather than throw — never blocking startup.
- **Reuses the existing startup call site** — `server.js` already calls `validateRequiredEnvVars()` inside a `try { } catch { process.exit(1) }` block, immediately before `server.listen()`. The new warning check is called alongside it (its own line, no `try/catch` needed since it never throws), so both checks run at the same, single, well-established boot moment.
- **Does not change `REQUIRED_ENV_VARS`'s hard-fail semantics** — `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET` remain hard requirements, unaffected by this story.
- **Bounded to the 3 confirmed, real gaps** (`PLATFORM_TENANT_ID`, `ADMIN_GITHUB_LOGINS`, `SKILL_EXECUTOR_PROVIDER`/`ANTHROPIC_API_KEY` pairing) — not a generic "any future env var" framework. This story closes the specific, demonstrated incidents; it is not infrastructure for hypothetical future variables.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `PLATFORM_TENANT_ID` is unset, When the server boots, Then a `console.warn` line is emitted naming `PLATFORM_TENANT_ID` and stating the concrete consequence ("platform self-registration will be skipped") — not a generic "some vars are missing" message.

**AC2:** Given `ADMIN_GITHUB_LOGINS` is unset or empty, When the server boots, Then a `console.warn` line is emitted naming `ADMIN_GITHUB_LOGINS` and stating the concrete consequence ("no admin users will be seeded — /admin/credits will be unreachable for everyone").

**AC3:** Given `SKILL_EXECUTOR_PROVIDER` is unset or explicitly `anthropic` (the default) AND `ANTHROPIC_API_KEY` is missing, When the server boots, Then a `console.warn` line is emitted naming both variables and stating the concrete consequence ("skill turns will fail — the anthropic provider requires ANTHROPIC_API_KEY").

**AC4 (edge case, the incident this story most directly targets):** Given `SKILL_EXECUTOR_PROVIDER` is explicitly set to `copilot`, When the server boots, Then a `console.warn` line is emitted noting that Copilot mode requires each signed-in user's own GitHub token to carry Copilot licensing/scope, which cannot be verified at boot time (a per-request, per-user concern) — surfacing the risk explicitly rather than staying silent until a real request fails.

**AC5 (regression guard):** Given all of `PLATFORM_TENANT_ID`, `ADMIN_GITHUB_LOGINS`, and `ANTHROPIC_API_KEY` are set (with `SKILL_EXECUTOR_PROVIDER` unset or `anthropic`), When the server boots, Then no warning is emitted for any of them — this check must not become noisy for a fully-configured environment.

## Out of Scope

- `POSTHOG_KEY_STAGING`/`POSTHOG_KEY_PROD` — already correctly handled by existing code (`posthog-config.js`), confirmed during this story's own investigation; no change needed.
- Making any of these 3 vars mandatory (hard-fail) — they are legitimately optional in some deployments (e.g. a non-dogfooding, non-admin-panel deployment genuinely has no `PLATFORM_TENANT_ID`/`ADMIN_GITHUB_LOGINS` to set). This story only makes their absence visible, not disallowed.
- Verifying an actual GitHub token's Copilot scope at request time — AC4's warning is a static, boot-time risk disclosure only; a real per-request Copilot-license check (if ever built) is a separate, larger feature.
- A generic "declare any env var as optional-but-warn-if-missing" framework — bounded to the 3 confirmed incidents named in this story, per Architecture Constraints.

## NFRs

- **Performance:** Negligible — a handful of `process.env` reads and string comparisons at boot, no I/O.
- **Security:** None new — no new secrets, no logging of any secret *value* (only variable *names* and static consequences, consistent with `posthog-config.js`'s own existing "never log the key value itself" convention).
- **Accessibility:** N/A — no UI surface, server-log output only.
- **Audit:** Every warning names the specific variable and the specific consequence — matching this repo's established convention (e.g. `cli-outer-loop.js`'s H1-H9 messages, `posthog-config.js`'s error messages) of specific, actionable diagnostics over generic ones.

## Complexity Rating

**Rating:** 1 — extends an existing, already-proven pattern (`validateRequiredEnvVars()`) with one new function covering 3 well-understood, already-diagnosed cases; no new architecture.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

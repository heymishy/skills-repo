# Web UI — Source File Index (Raw GitHub URLs)

> ⚠️ **This file was severely stale until 2026-09-17.** It indexed ~35 files against a real `src/web-ui/` of 140+ files (33 route files alone, not the 11 previously listed) and predated an entire second surface — the multi-tenant product/pods/billing platform — that now makes up most of the directory's ~47,000 lines. See the README's [Product platform layer](../README.md#product-platform-layer) section for the architecture-level picture (real Postgres, 4 auth methods, real Stripe billing, agency/org model).
>
> **The Routes table below has been fully re-verified against the real source tree and `server.js`'s actual `require()` wiring** (2026-09-17) and can be trusted. **The Views / Auth / Middleware / Adapters / Modules / Utilities sections below this point have NOT been re-verified** — they are left from the original version of this doc and may be as stale as the old Routes table was. Treat them as a lead, not ground truth, until someone re-audits them file-by-file. This is a known gap, not an oversight — re-indexing 100+ non-route files accurately requires reading each one, which was out of scope for the README audit that caught this.

This index lists source files for the skills pipeline web UI, with raw GitHub URLs for repositories that cannot perform `git clone` or `git fetch` operations.

**Base URL pattern:** `https://raw.githubusercontent.com/heymishy/skills-repo/master/<path>`

Any HTTP client (browser `fetch`, `curl`, `wget`, etc.) can read these files directly without Git access:

```js
const src = await fetch('https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/server.js').then(r => r.text());
```

---

## Entry point

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/server.js` | HTTP server entry point (~4,000 lines) — wires all routes, middleware, adapters | [server.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/server.js) |

---

## Routes (re-verified 2026-09-17 — all 33 files, real line counts, real exported handlers per `server.js`)

| File | Lines | Purpose | Raw URL |
|---|---|---|---|
| `routes/skills.js` | 6,245 | Largest route file. Skill-session chat: turn streaming (SSE), canvas edit, assumption/materiality confirmation, Redis session persistence, session eviction | [skills.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/skills.js) |
| `routes/journey.js` | 5,049 | Journey session flow — stage controls, slash commands, Redis session read/merge | [journey.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/journey.js) |
| `routes/products.js` | 4,514 | Product CRUD, feature creation (`handlePostProductFeature` — a "feature" is a journey, see README naming note), default-pod assignment | [products.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/products.js) |
| `routes/features.js` | 1,052 | NOT product features — this is the ideas/backlog-capture surface (`handleGetIdeas`/`handlePostIdea`/`handleDeleteIdea`) | [features.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/features.js) |
| `routes/settings.js` | 841 | User/org settings, theme toggle | [settings.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/settings.js) |
| `routes/auth.js` | 576 | GitHub + Google OAuth sign-in/callback/logout, `authGuard` middleware, org membership fetch | [auth.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/auth.js) |
| `routes/billing.js` | 520 | Real Stripe: checkout sessions, webhook verification, billing portal, plan-state | [billing.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/billing.js) |
| `routes/auth-email.js` | 419 | Magic-link email signup/login (`passport-magic-login`), bcrypt password auth | [auth-email.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/auth-email.js) |
| `routes/agency-provisioning.js` | 305 | Self-service agency provisioning (factory: `createAgencyProvisioningHandlers`) | [agency-provisioning.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/agency-provisioning.js) |
| `routes/sign-off.js` | 294 | DoR sign-off write routes, artefact read | [sign-off.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/sign-off.js) |
| `routes/team-management.js` | 258 | Team CRUD (factory: `createTeamManagementHandlers`) | [team-management.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/team-management.js) |
| `routes/impersonation.js` | 258 | Admin-as-user impersonation, audit-logged (factory: `createImpersonationHandlers`) | [impersonation.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/impersonation.js) |
| `routes/admin-credits.js` | 255 | Admin credit grants, plan changes | [admin-credits.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/admin-credits.js) |
| `routes/public.js` | 247 | Root/welcome pages, Mermaid asset serving | [public.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/public.js) |
| `routes/org-conversion.js` | 202 | Agency-client → independent org conversion (factory: `createOrgConversionHandlers`) | [org-conversion.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/org-conversion.js) |
| `routes/product-repo.js` | 195 | Connect a product to a git repo | [product-repo.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/product-repo.js) |
| `routes/account-linking.js` | 170 | Link Google/GitHub identities to one account | [account-linking.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/account-linking.js) |
| `routes/client-login.js` | 169 | Agency-client dual-path login (factory: `createClientLoginHandlers`) | [client-login.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/client-login.js) |
| `routes/artefact.js` | 169 | Artefact fetching and rendering | [artefact.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/artefact.js) |
| `routes/org-activation.js` | 164 | Agency activation (factory: `createOrgActivationHandlers`) | [org-activation.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/org-activation.js) |
| `routes/admin-mock-gateway.js` | 162 | Toggle the staging mock LLM gateway (process-wide in-memory flag — see `workspace/capture-log.md` for a known leak risk) | [admin-mock-gateway.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/admin-mock-gateway.js) |
| `routes/auth-stub.js` | 160 | Staging-only auth stub for environments without live OAuth | [auth-stub.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/auth-stub.js) |
| `routes/dashboard.js` | 132 | Pipeline status dashboard, actions panel | [dashboard.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/dashboard.js) |
| `routes/annotation.js` | 116 | PR annotation routes | [annotation.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/annotation.js) |
| `routes/as-built-system-architecture.js` | 110 | As-built system architecture diagram data | [as-built-system-architecture.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/as-built-system-architecture.js) |
| `routes/as-built-diagrams.js` | 107 | As-built data model diagram data | [as-built-diagrams.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/as-built-diagrams.js) |
| `routes/landing.js` | 100 | Landing page | [landing.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/landing.js) |
| `routes/export.js` | 95 | Pipeline status CSV/JSON export | [export.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/export.js) |
| `routes/github-org-bulk-add.js` | 82 | Bulk-import GitHub org members into a team | [github-org-bulk-add.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/github-org-bulk-add.js) |
| `routes/pods.js` | 80 | Create pod, list pods (`new-feature-2b74a292` epic 1) | [pods.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/pods.js) |
| `routes/execute.js` | 51 | Skill execution (non-streaming) | [execute.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/execute.js) |
| `routes/version.js` | 22 | Version endpoint | [version.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/version.js) |
| `routes/health.js` | 19 | Health check endpoint | [health.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/health.js) |

**Note:** `routes/status.js`, listed in the previous version of this doc, does not exist in the current tree.

---

## Views, Auth, Middleware, Adapters, Modules, Utilities

> ⚠️ **Not re-verified as part of the 2026-09-17 audit.** The tables that follow are carried over from the pre-audit version of this file and may contain the same class of staleness the Routes table above had (missing files, renamed exports, and no coverage at all of anything added by the product-platform layer — pod/product/billing/agency modules and adapters are known to be missing here). Do not treat as authoritative; re-audit file-by-file before relying on it.

### Views

HTML page renderers — return full HTML strings with embedded CSS and client-side JS.

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/views/chat-view.js` | Chat interface — skill session turns, thinking dots, draft panel | [chat-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/chat-view.js) |
| `src/web-ui/views/dashboard-view.js` | Dashboard page HTML | [dashboard-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/dashboard-view.js) |
| `src/web-ui/views/features-view.js` | Feature list page HTML | [features-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/features-view.js) |
| `src/web-ui/views/artefact-view.js` | Artefact renderer page HTML | [artefact-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/artefact-view.js) |
| `src/web-ui/views/actions-view.js` | Actions panel HTML | [actions-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/actions-view.js) |
| `src/web-ui/views/commit-view.js` | Artefact commit confirmation page | [commit-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/commit-view.js) |
| `src/web-ui/views/components.js` | Shared HTML components (nav, layout, etc.) | [components.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/components.js) |

### Auth

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/auth/oauth-adapter.js` | GitHub OAuth flow — state generation, redirect URL, code exchange, user identity, token storage | [oauth-adapter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/auth/oauth-adapter.js) |
| `src/web-ui/auth/magic-link-strategy.js` | Magic-link email auth strategy (`passport-magic-login`) — not in the pre-audit version of this doc | [magic-link-strategy.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/auth/magic-link-strategy.js) |

### Middleware

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/middleware/session.js` | Session store, HttpOnly cookie handling, authGuard | [session.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/middleware/session.js) |
| `src/web-ui/middleware/rate-limiter.js` | Request rate limiting middleware | [rate-limiter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/middleware/rate-limiter.js) |

### Adapters (not re-verified — likely incomplete; product/pod/billing adapters are known missing)

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/adapters/skills.js` | Skill list, session creation, commit session adapters | [skills.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/skills.js) |
| `src/web-ui/adapters/artefact-fetcher.js` | GitHub Contents API artefact fetch adapter | [artefact-fetcher.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/artefact-fetcher.js) |
| `src/web-ui/adapters/artefact-list.js` | Artefact directory listing adapter | [artefact-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/artefact-list.js) |
| `src/web-ui/adapters/feature-list.js` | Feature list from pipeline-state.json adapter | [feature-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/feature-list.js) |
| `src/web-ui/adapters/pipeline-status.js` | Pipeline status fetch adapter | [pipeline-status.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/pipeline-status.js) |
| `src/web-ui/adapters/annotation-writer.js` | PR annotation write adapter (GitHub API) | [annotation-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/annotation-writer.js) |
| `src/web-ui/adapters/sign-off-writer.js` | DoR sign-off write adapter (GitHub API) | [sign-off-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/sign-off-writer.js) |
| `src/web-ui/adapters/action-queue.js` | Action queue (GitHub commit queue) adapter | [action-queue.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/action-queue.js) |
| `src/web-ui/adapters/pipeline-state-writer.js` | Pipeline-state.json write adapter (GitHub Contents API) | [pipeline-state-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/pipeline-state-writer.js) |
| `src/web-ui/adapters/session-store.js` | Session store adapter — injectable wrapper around session persistence | [session-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/session-store.js) |
| `src/web-ui/adapters/fake-test-db.js` | Test-double DB adapter used across the product-platform test suite | [fake-test-db.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/fake-test-db.js) |

### Artefacts

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/artefacts/artefact-adapter.js` | GitHub Contents API adapter with GHE support | [artefact-adapter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/artefacts/artefact-adapter.js) |

### Configuration

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/config/validate-env.js` | Startup env var validation — throws listing all missing vars; also resolves `SKILL_EXECUTOR_PROVIDER` (default `anthropic`) | [validate-env.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/config/validate-env.js) |
| `src/web-ui/config/repo-list.js` | Repository list configuration | [repo-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/config/repo-list.js) |

### Modules (web-ui scoped — not re-verified; known incomplete, missing pod/product-platform modules)

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/modules/journey-store.js` | Journey/flow session store | [journey-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/journey-store.js) |
| `src/web-ui/modules/tool-executor.js` | Tool call executor — processes model tool-call responses in skill sessions | [tool-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/tool-executor.js) |
| `src/web-ui/modules/pod-store.js` | Pod creation/lookup (real Postgres) — not in the pre-audit version of this doc | [pod-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/pod-store.js) |
| `src/web-ui/modules/pod-assignment-store.js` | Product/feature default-pod assignment (real Postgres) — not in the pre-audit version of this doc | [pod-assignment-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/pod-assignment-store.js) |
| `src/web-ui/modules/feature-collaborator-store.js` | Feature-level collaborator population from an inherited pod — not in the pre-audit version of this doc | [feature-collaborator-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/feature-collaborator-store.js) |
| `src/web-ui/modules/password.js` | bcrypt password hashing/verification — not in the pre-audit version of this doc | [password.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/password.js) |

### Utilities

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/utils/html-shell.js` | HTML page shell template | [html-shell.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/html-shell.js) |
| `src/web-ui/utils/markdown-renderer.js` | Markdown-to-HTML renderer (no external deps) | [markdown-renderer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/markdown-renderer.js) |
| `src/web-ui/utils/annotation-renderer.js` | PR annotation HTML rendering | [annotation-renderer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/annotation-renderer.js) |
| `src/web-ui/utils/annotation-utils.js` | Annotation helper utilities | [annotation-utils.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/annotation-utils.js) |
| `src/web-ui/utils/artefact-labels.js` | Human-readable artefact type labels | [artefact-labels.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/artefact-labels.js) |
| `src/web-ui/utils/plain-language-labels.js` | Plain-language pipeline state labels | [plain-language-labels.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/plain-language-labels.js) |
| `src/web-ui/utils/status-board.js` | Pipeline status board rendering | [status-board.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/status-board.js) |
| `src/web-ui/utils/status-export.js` | Status export utilities | [status-export.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/status-export.js) |

### Shared modules (src/modules)

These modules are used by the web UI and potentially other consumers.

| File | Purpose | Raw URL |
|---|---|---|
| `src/modules/skill-turn-executor.js` | Anthropic / Copilot API caller — streaming and non-streaming; `SKILL_EXECUTOR_PROVIDER` routing (default: `anthropic`) | [skill-turn-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/skill-turn-executor.js) |
| `src/modules/skill-executor.js` | CLI-mode skill executor (non-web) | [skill-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/skill-executor.js) |
| `src/modules/session-manager.js` | Session management module | [session-manager.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/session-manager.js) |

---

## Environment reference file

| File | Purpose | Raw URL |
|---|---|---|
| `.env.example` | Environment variable template — confirms real `DATABASE_URL` (Postgres/Neon), Upstash Redis, Stripe keys, and multi-tenancy config | [.env.example](https://raw.githubusercontent.com/heymishy/skills-repo/master/.env.example) |

---

## Notes for consuming repos

- All URLs point to the `master` branch. Replace `master` with a specific commit SHA for a pinned version.
- Files are plain CommonJS modules (`require`/`module.exports`). They use Node.js built-in modules plus real npm dependencies for persistence, auth, and billing (`pg`, `bcrypt`, `passport`, `passport-magic-login`, `stripe`, `@upstash/redis`) — see the README's [Product platform layer](../README.md#product-platform-layer) section.
- The server entry point (`server.js`) requires all other files via relative paths — if you are assembling a local copy, preserve the directory structure exactly.
- See [docs/web-ui-copilot-api-guide.md](https://raw.githubusercontent.com/heymishy/skills-repo/master/docs/web-ui-copilot-api-guide.md) for the (non-default) Copilot execution path specifically.

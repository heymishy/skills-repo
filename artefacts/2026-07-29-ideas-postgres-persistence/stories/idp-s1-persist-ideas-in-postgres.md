# Story: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real, confirmed data-loss bug below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator typing a new idea into the kanban board's Ideas lane**,
I want **that idea to survive the next deploy**,
So that **I don't silently lose real backlog items every time the platform redeploys (which happens on every PR merge)**.

## Benefit Linkage

**Metric moved:** None formal (short-track bug fix, no benefit-metric artefact) — real, currently-active data loss, quantified below.
**How:** `src/web-ui/routes/features.js`'s `_readIdeas()`/`_writeIdeas()` read/write `workspace/ideas.json` directly via `fs.readFileSync`/`writeFileSync` — a path on the running container's own filesystem. No Fly volume is mounted (confirmed: no `mounts`/`volumes` block in `fly.toml` or `fly.staging.toml`), and `staging-deploy.yml` redeploys `wuce-staging` on every push to master. Every idea a user types into the kanban board's "Ideas" lane (`kanban-view.js`'s `kb-add-idea-form`, `POST /api/ideas`) is silently wiped the next time anyone merges a PR — which, in this repo's actual usage pattern, can be minutes later. This is ongoing, currently-active data loss for a real, actively-rendered feature, not a theoretical risk.

## Architecture Constraints

- **Reuses the existing shared Postgres pool (`_creditsPool`)** already created in `server.js`'s `if (process.env.DATABASE_URL)` startup block (the same pool `products`, `credits`, `user_roles`, etc. already use) — no new pool, no new connection.
- **New module `src/web-ui/adapters/ideas-store-pg.js`**, following `src/web-ui/modules/product-repo.js`'s established style exactly: plain async functions taking `pool` as the first argument (`migrateIdeasSchema(pool)`, `listIdeas(pool)`, `createIdea(pool, {title, notes})`, `deleteIdea(pool, id)`), not a class or singleton — this keeps the module trivially testable with a fake pool double, matching this repo's established convention.
- **Injectable adapter in `routes/features.js`** (D37): `_readIdeas()`/`_writeIdeas()` are replaced with an injectable `_ideasStore` object exposing `listIdeas()`, `createIdea(fields)`, `deleteIdea(id)`, overridable via `setIdeasStore(store)`. Unlike the usual D37 "stub must throw" rule, the **default** implementation is the existing file-based read/write logic (kept exactly as-is, wrapped to match the new shape) — not a throw-stub — because a genuinely safe, already-working default already exists here (mirrors `journey-store.js`'s own disk-adapter-as-default / pg-adapter-as-override shape, not the credits-adapter shape where no safe default exists). This preserves identical behaviour for local dev and any environment without `DATABASE_URL` set.
- **Production wiring**: `server.js` calls `setIdeasStore(...)` with the real Postgres-backed implementation only inside its existing `if (process.env.DATABASE_URL)` block, alongside the existing `products`/`credits` wiring — a separate task from the handler/adapter-shape change (D37 point 3).
- **No tenant scoping added** — the existing file-based implementation has none (a single global ideas list, no `tenantId` field anywhere in the current shape); the new Postgres table preserves this exact behaviour. Adding tenant scoping is explicitly out of scope (see below) — this story fixes durability, not multi-tenancy.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `DATABASE_URL` is set (staging/production), When an operator submits a new idea via `POST /api/ideas`, Then the idea is written to a real `ideas` table in Postgres (via the shared `_creditsPool`), not to `workspace/ideas.json`.

**AC2:** Given an idea was created while `DATABASE_URL` was set, When the server process restarts (simulating a redeploy) and `GET /api/ideas` is called again, Then the previously-created idea is still present — confirming real durability across a process restart, not just an in-request round-trip.

**AC3:** Given `DATABASE_URL` is set, When an operator deletes an idea via `DELETE /api/ideas/:id`, Then the row is removed from the `ideas` table and no longer appears in a subsequent `GET /api/ideas`.

**AC4 (regression guard, no-DB case):** Given `DATABASE_URL` is NOT set (local dev, most test runs), When `POST`/`GET`/`DELETE /api/ideas` are called, Then behaviour is byte-for-byte unchanged from today — ideas are still read from and written to `workspace/ideas.json`, exactly as before this story.

**AC5 (D37 wiring correctness — not just "a function got assigned"):** Given `DATABASE_URL` is set and the server has started, When two different ideas are created via the real, wired handler and then both listed, Then both distinct ideas are returned correctly — proving the wired Postgres implementation actually round-trips distinguishable data correctly, not merely that `setIdeasStore()` was called with something.

## Out of Scope

- Adding tenant scoping to ideas (a `tenant_id` column, per-tenant filtering) — the existing behaviour is a single global list; this story preserves that exactly. A future story can add tenant scoping if needed.
- Migrating any existing data currently sitting in a live `workspace/ideas.json` on staging — by the nature of the bug this story fixes, that data has already been repeatedly wiped by prior redeploys; there is nothing meaningful to migrate.
- Any UI change to `kanban-view.js` — the client-side form and its `fetch('/api/ideas', ...)` calls are unchanged; this story is a storage-layer fix only.
- Rate limiting, idea size limits beyond the existing `title.slice(0, 120)`/`notes.slice(0, 500)` truncation already in `handlePostIdea` — unchanged, out of scope.

## NFRs

- **Performance:** Negligible — replaces a synchronous file read/write with an async Postgres query using an already-open, already-pooled connection; no new connection overhead.
- **Security:** None new — no new secrets; reuses the existing `DATABASE_URL` secret and pool already used by `products`/`credits`.
- **Accessibility:** N/A — no UI change.
- **Audit:** None new — idea creation/deletion was never separately audited before this story; unchanged.

## Complexity Rating

**Rating:** 2 — some ambiguity in exactly how to shape the injectable default (file-based fallback, not a throw-stub, a deliberate deviation from the usual D37 pattern that needs to be gotten right), but the core mechanism (a new Postgres-backed table mirroring `products`/`credits`) is well-understood and low-risk.
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

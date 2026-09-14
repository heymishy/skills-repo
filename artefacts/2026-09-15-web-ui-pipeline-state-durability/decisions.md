# Decisions: Web UI Pipeline-State Durability

## GitHub Contents API over a local git checkout in the production container

**Date:** 2026-09-15
**Context:** `pipeline-state-writer.js`'s `isRealCheckout` check refuses to write pipeline-state.json when no local `.git/` directory exists — correct in intent, but `.dockerignore` deliberately excludes `.git/` from the production image, so the check fails unconditionally in production, and every write silently throws (caught and only server-logged by `journey.js`).
**Decision:** Build a second `pipelineStateWriter` implementation that writes via the GitHub Contents API (GET + sha + PUT, authenticated as the operator via `req.session.accessToken`), rather than re-provisioning the container with a real local git checkout.
**Rationale:** A local checkout in the container would resurrect exactly the failure mode the original `isRealCheckout` check exists to prevent — multiple container instances (or the same instance across a redeploy) each holding independently-mutable local git state, with no coordination, risking lost commits and divergent history across replicas. The GitHub API approach holds no local mutable state at all — every write is a single, atomic, remotely-authoritative operation, safe by construction regardless of replica count.

## GitHub Contents API over a queue + background drain worker

**Date:** 2026-09-15
**Context:** An alternative design would push pending state updates into a Postgres queue table and have a separate background process apply them with real git access.
**Decision:** Rejected in favour of the direct GitHub API write.
**Rationale:** A queue decouples the write from the request path — but that's already achieved today via the existing fire-and-forget `try/catch` in `journey.js`. The queue's real cost is trading a hard, retryable, visible failure for silent eventual-consistency staleness, plus a new component (queue table, drain worker, its own monitoring) this fix doesn't need. The direct API approach gets the same request-path decoupling without that cost.

## Reuse `req.session.accessToken` — no new credential or service account

**Date:** 2026-09-15
**Context:** The write needs GitHub write access to `.github/pipeline-state.json`.
**Decision:** Use the same operator OAuth token `artefact-commit-writer.js` already uses for artefact commits — no new secret, no service account.
**Rationale:** Same repository, same permission scope, already proven in production for the adjacent artefact-write use case. Introducing a separate service credential would be a new secret to manage and a new (weaker) attribution story for commits, with no compensating benefit.

## Extract `cli-advance.js`'s mutation core rather than re-implement its validation rules

**Date:** 2026-09-15
**Context:** The new GitHub-API writer needs the same story-field validation (enum checks, prototype-pollution guard, epic-nested story lookup) `cli-advance.js`'s `advance()` already implements for the local-file path.
**Decision:** Extract that logic into a new function operating on an in-memory state object (`wsd-s1`), with the existing file-based `advance()` becoming a thin wrapper around it — rather than writing a second, independent implementation of the same rules inside the new writer.
**Rationale:** ADR-026 (reuse existing entity/pattern shape). Two independent implementations of the same validation rules will drift the first time either one is updated without the other — a class of bug this repo has hit before in different contexts this session (the definition/review artefact splitters, `asf-s1`, where two INDEPENDENT parsers for related shapes diverged). Extracting a shared core removes that risk entirely rather than managing it.

## PostHog capture on exhausted write-retry, not a new alerting channel

**Date:** 2026-09-15
**Context:** Today's write failure is caught and only `console.error`-logged — genuinely invisible; no operator has ever seen one despite it firing on every production write attempt to date.
**Decision:** Emit a PostHog capture event on exhausted retry (in addition to, not instead of, the existing server log line), rather than building a new alerting mechanism.
**Rationale:** Reuses the exact pattern this session already shipped for a different silent-failure class (`ltd-s1` — `$ai_is_error`/`$ai_error` on an unparseable LLM verdict). Consistent, no new infrastructure, and PostHog is already the observability tool this session used to find and root-cause the underlying bug in the first place.

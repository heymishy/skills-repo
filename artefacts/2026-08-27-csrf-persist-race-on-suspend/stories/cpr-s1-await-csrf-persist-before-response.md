## Story: Close the race between persisting a new CSRF token and the process suspending mid-write

**Epic reference:** None — short-track (follow-up bug fix, found via live restart testing of `ctpr-s1`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator whose session survives a Fly machine restart** (the exact scenario `ctpr-s1` was built to fix),
I want **a CSRF token that was just generated to be durably persisted before I can possibly use it**,
So that **`ctpr-s1`'s own fix actually closes the "Forbidden" gap in every case, not just the cases where the write happens to finish before the process suspends**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) on `wuce-staging`: with `ctpr-s1`'s fix already deployed and confirmed present in the running container (verified via `fly ssh console`), forcing the exact real-world restart scenario the story was built around (load a discovery page, let the machine idle-suspend, click "Continue to benefit-metric" on the still-open page without reloading) still produced `403 Forbidden` — the bug `ctpr-s1` was supposed to close.

**How:** `ctpr-s1`'s fix added `persistSession(req.sessionId)` inside `generateCsrfToken`'s token-minting branch — but `persistSession` (`middleware/session.js`) is fire-and-forget: `adapter.writeSession(id, ...).catch(...)` is never awaited, by `persistSession` itself or by `generateCsrfToken`. The write to Upstash Redis (a real network round-trip) happens *after* `generateCsrfToken` returns and the caller finishes building/sending its HTML response. If the page render that mints the token is at or near the last request before the machine's idle-based auto-suspend fires (`min_machines_running=0`, confirmed via `fly logs` to genuinely cold-boot on each resume, not a memory-preserving hibernate), the in-flight Redis write can be abandoned mid-flight when the process freezes — leaving Redis with no record of the token, exactly reproducing the original bug despite `ctpr-s1`'s fix being present and correctly wired.

This was not caught by `ctpr-s1`'s own test suite because the test environment's fake Redis adapter resolves synchronously/immediately in-process — there is no real network latency to race against, so `persistSession`'s fire-and-forget write always "completes" before the test's next assertion runs. The gap only manifests against a real network-backed Redis under real process-suspend timing, which is exactly what today's live restart test exercised and the automated suite structurally cannot.

## Architecture Constraints

**This story requires a genuine design decision during implementation — two viable approaches, tradeoffs below. Do not silently pick one without recording the choice in `decisions.md`.**

- **Option A — make the write path awaited end-to-end.** Change `persistSession` to return the promise from `adapter.writeSession(...)` instead of fire-and-forget. Change `generateCsrfToken` to be `async` and `await persistSession(...)` before returning. This requires every one of the 27 current call sites of `generateCsrfToken(req)` across `admin-credits.js`, `admin-mock-gateway.js`, `dashboard.js`, `features.js`, `impersonation.js`, `journey.js` (9 sites), `org-conversion.js`, `products.js` (3 sites), `public.js` (2 sites), `settings.js` (2 sites), `skills.js` (3 sites), `team-management.js` (2 sites) to add `await` and for their own enclosing functions to already be (or become) `async` — mechanical but wide-reaching. Most correct: the token is guaranteed durable before any response embedding it is sent, closing the race entirely regardless of how soon suspend fires afterward.
- **Option B — track pending writes centrally, flush before responding.** Keep `generateCsrfToken` synchronous (zero call-site changes). Have `persistSession` register its in-flight promise on a per-request list (e.g. `req._pendingPersists`), and have the server's central response-dispatch path (`server.js`) `await Promise.all(req._pendingPersists || [])` immediately before the response is actually sent. Smaller, more contained blast radius, but introduces a new cross-cutting mechanism in the request lifecycle that every response path must correctly participate in — a new class of bug if a future response path bypasses it.
- **Whichever option is chosen:** the fix must not introduce a new failure mode when Redis is unavailable/slow — a slow or failing write must still degrade to today's existing behaviour (best-effort, no crash, no indefinitely-hung response) rather than blocking the response forever. Cap any new await with a short timeout and fall through on failure, matching `persistSession`'s existing best-effort design philosophy.
- **Do not weaken `csrfGuard`'s validation** to work around this (e.g., accepting a missing stored token as automatically valid) — that would defeat CSRF protection entirely for exactly the sessions this bug already affects.

## Dependencies

- **Upstream:** `ctpr-s1` (merged, PR #772) — this story closes a gap in that fix, found via live testing after merge.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given `generateCsrfToken` mints a new token, When the function (or its containing response-handling flow, depending on which option is implemented) completes, Then the token has been durably confirmed written to Redis — not merely had a write attempt fired — before the HTTP response embedding that token is sent to the client.

**AC2:** Given a real, network-latency-bearing Redis write (not the test suite's instant fake adapter), When a test simulates a slow write racing against process termination, Then the fix demonstrably waits for that write rather than allowing the response to complete first — this AC exists specifically to close the exact test-suite blind spot `ctpr-s1`'s own suite had (instant fake adapter never races against anything).

**AC3 (regression guard):** Given no Redis adapter is configured (the default for local/CLI/test usage), When `generateCsrfToken` is called, Then behaviour is unchanged from today — no new failure mode, no hang.

**AC4 (regression guard):** Given Redis is configured but the write fails or times out, When `generateCsrfToken` is called, Then the response still completes (degrades to best-effort, matching `persistSession`'s existing philosophy) rather than hanging indefinitely or throwing an unhandled error.

**AC5 (regression guard, whichever option is chosen):** Given `ctpr-s1`'s own existing test suite (`tests/check-ctpr-s1-csrf-token-persistence.js`) and the 9 pre-existing CSRF-focused test files, When re-run after this fix, Then all pass — this fix does not change `csrfGuard`'s validation logic or `csrfField`'s output shape.

**AC6 (end-to-end proof, if practically achievable):** Given the exact live scenario that surfaced this gap (a real Redis-backed environment, a token generated, then a simulated abrupt process termination before the write's network round-trip would normally complete), When the session is rehydrated afterward, Then the token is present — this is the one AC that most directly proves the race is closed, and may require a test that deliberately injects write latency (e.g. a fake adapter with a configurable delay) rather than relying on a live Fly restart, which is not automatable.

## Out of Scope

- **Changing `fly.toml`'s `min_machines_running`/`auto_stop_machines` configuration** — an infrastructure/cost decision for the operator, not a code-correctness fix, consistent with `ctpr-s1`'s own Out of Scope.
- **A broader audit of every other fire-and-forget `persistSession`/Redis-adjacent call in this codebase** for the same race — this story is scoped to the specific, live-confirmed CSRF case. If the same pattern is found elsewhere later, that is a separate finding.
- **Building live Fly-restart automation into the test suite.** AC6 asks for the closest practical automated proxy (injected write latency vs. a real termination), not a genuine infrastructure-level E2E test against live Fly machine lifecycle.

## NFRs

- **Performance:** If Option A is chosen, every one of the 27 `generateCsrfToken` call sites adds a real (if typically fast, same-region) network round-trip to Upstash on a session's *first* page render needing a token — a one-time cost per session, not per-request (idempotent reuse still returns immediately). If Option B is chosen, the added latency is the same but incurred once per response needing to flush pending writes, not per call site.
- **Security:** This story tightens an existing security-adjacent guarantee (CSRF token durability) — no new surface, no regression risk beyond what AC5 already guards.
- **Accessibility:** Not applicable.
- **Audit:** No existing audit-log call is affected.

## Complexity Rating

**Rating:** 3 — a real design decision between two structurally different fixes is required (see Architecture Constraints), Option A has a wide (if mechanical) blast radius across 27 call sites in 12 files, and AC2/AC6 require a genuinely new testing technique (injected latency) this codebase's existing CSRF tests don't currently use.
**Scope stability:** Stable — the two viable options are both fully specified above; implementation should pick one and record the choice, not discover a third approach mid-flight.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

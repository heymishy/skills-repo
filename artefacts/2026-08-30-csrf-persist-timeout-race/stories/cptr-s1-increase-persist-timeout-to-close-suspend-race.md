## Story: Increase the session-persist timeout so the response waits for the real Redis write before a suspend can race it

**Epic reference:** None — short-track (follow-up bug fix; the operator hit the exact original "Forbidden" bug again in prod after `cpr-s1`'s fix was already live)
**Discovery reference:** None — short-track skips discovery; root cause found directly via code investigation, corrected once via direct verification of Fly's own platform docs before any code was written
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator using the live web UI on Fly's `auto_stop_machines = 'suspend'` configuration** (confirmed in `fly.toml` — not `'stop'`),
I want **a session write (e.g. a newly-minted CSRF token) to be genuinely durable before the response that depends on it is sent**,
So that **I stop hitting a blank "Forbidden" page when navigating between skill stages (e.g. discovery → clarify → proceed) shortly after an idle period**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live in prod (2026-08-30): the operator ran a real `/discovery` → `/clarify` → proceed flow and hit `403 Forbidden` (blank page, single word "Forbidden") on the proceed step, despite `cpr-s1` (PR #775, merged 2026-08-27) already being deployed and its own fix (awaiting `persistSession` inside `generateCsrfToken`) correctly present and wired at every current call site.

**How:** `persistSession()` (`src/web-ui/middleware/session.js`) races the real Redis write against a hardcoded 500ms timeout so a slow/hung Redis never blocks the HTTP response indefinitely (`cpr-s1`'s own AC4). If the real write takes longer than 500ms, `persistSession` resolves via the *timeout* branch — not the real write — and the response is sent while the write is still in flight in the background. This story's own implementation planning first attempted a `SIGTERM`-based graceful-shutdown fix (awaiting pending writes before process exit), but that approach was found to be a complete no-op **before any code was written**: `fly.toml` sets `auto_stop_machines = 'suspend'`, and Fly's own documentation (`https://fly.io/docs/reference/suspend-resume/`) confirms suspend freezes the entire VM state via a Firecracker snapshot with **no signal sent to the guest process** — a `SIGTERM` handler would never fire. Since Fly can only suspend a machine once it looks genuinely idle (no active request/response cycle), the real fix is to prevent the false-idle window from ever opening: hold the response until the real write has actually landed, using a much larger (but still bounded) timeout than the current 500ms as the new primary durability mechanism, not a routine race target.

This was not caught by `cpr-s1`'s own test suite for the same reason its own AC2 called out for the original bug: the test environment's fake Redis adapter resolves synchronously, so the 500ms timeout branch of the `Promise.race` never actually wins in CI — there is nothing slow to race against.

## Architecture Constraints

- **Chosen approach (operator-selected, 2026-08-30, after the SIGTERM approach was found invalid):** Increase `session.js`'s `_PERSIST_TIMEOUT_MS` constant from `500` to `8000`. No other structural change — the existing `Promise.race([write, timeout])` pattern inside `persistSession` is otherwise unchanged. The comment documenting this constant is updated to reflect its corrected purpose: a last-resort circuit breaker for a genuinely broken/hung Redis, not a routine race against normal write latency.
- **Declined alternative:** Switch `fly.toml`'s `auto_stop_machines` from `'suspend'` to `'stop'`, which would enable a real `SIGTERM`+grace-period mechanism. Declined because it trades away suspend's fast-resume benefit (a real product/cost decision) purely to enable a more complex fix, when raising one timeout constant closes the same race given suspend's actual "only triggers once idle" semantics.
- **Do not weaken `csrfGuard`'s validation** to work around this (e.g., accepting a missing stored token as automatically valid) — that would defeat CSRF protection entirely for exactly the sessions this bug already affects.
- Testing standards (`.github/standards/testing/test-design-patterns.md`): a test asserting the increased timeout actually closes the race must inject real (or realistically simulated) latency between 500ms and 8000ms — reusing `cpr-s1`'s own established fake-adapter-with-configurable-delay technique — not relying on the existing instant fake adapter, or the test would pass trivially without proving anything.

## Dependencies

- **Upstream:** `cpr-s1` (merged, PR #775) — this story closes a second, distinct gap in the same durability guarantee `cpr-s1` was meant to provide.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a real Redis write that takes longer than the OLD 500ms timeout but less than the NEW 8000ms timeout (e.g. simulate a 2000ms write), When `persistSession` is called, Then it resolves via the real write completing (not the timeout), and the write is confirmed present in the store by the time `persistSession` resolves.

**AC2 (regression guard):** Given no Redis adapter is configured (the default for local/CLI/test usage), When `generateCsrfToken` is called, Then behaviour is unchanged from today — no new failure mode, no hang.

**AC3 (regression guard):** Given a write that fails outright (rejects), When `persistSession` is called, Then the promise still resolves (not rejects) — matching the existing best-effort philosophy, unchanged by this timeout-value-only fix.

**AC4 (regression guard):** Given a write that never resolves (a genuinely hung Redis), When `persistSession` is called, Then it still resolves within a bounded time close to the NEW 8000ms cap, not indefinitely — proves the circuit-breaker property still holds at the new, larger value.

**AC5 (regression guard):** Given `cpr-s1`'s own existing test suite (`tests/check-cpr-s1-csrf-persist-race.js`), When re-run after this fix, Then all pass — in particular, its own AC4b test (asserting `generateCsrfToken` resolves "well under 2s" against a hanging adapter) must be re-examined: that assertion was written against the OLD 500ms cap's implied bound and will need updating to a bound consistent with the NEW 8000ms cap, or it will now fail — this is an expected, declared consequence of raising the timeout, not a regression to silently work around.

## Out of Scope

- **Changing `fly.toml`'s `auto_stop_machines`/`min_machines_running` configuration** — the declined alternative above; an infrastructure/cost decision for the operator, not this story's fix.
- **A broader audit of every other fire-and-forget `persistSession`-adjacent call in this codebase** for the same class of race — scoped to this specific, live-confirmed CSRF case, consistent with `cpr-s1`'s own Out of Scope.
- **Reducing the timeout back down or making it adaptive/configurable** based on live latency measurements — a reasonable future improvement, not justified by this bounded bug fix.

## NFRs

- **Performance:** Every session's first page render that mints a CSRF token now waits for the real Redis write (typically fast — well under 500ms in normal conditions) rather than racing a 500ms cap. In the normal case this is barely observable (the write usually finishes in well under 500ms anyway); the behavioural change only matters when Redis is genuinely slow, in which case the response now correctly waits (up to 8s) rather than proceeding with an undurable token.
- **Security:** This story closes a gap in an existing security-adjacent guarantee (CSRF token durability) — no new surface, no regression risk beyond what AC3/AC5 already guard.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — a single constant value change plus updating one pre-existing test assertion that was written against the old bound; the design investigation (including the abandoned SIGTERM approach) was the substantial part of this work, not the fix itself.
**Scope stability:** Stable — the approach was corrected once (via direct platform-doc verification) before implementation began, and the operator has now confirmed the corrected direction.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no epic; oversight is Medium (operator directly reviewing this fix given its live-prod origin and its own design correction mid-flight)

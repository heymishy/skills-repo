# Decisions: error capture coverage

**2026-11-15 | FINDING | The error chain sees almost no server errors on logged-in pages**
**Evidence:** a production sweep (artefacts/2026-11-15-production-error-sweep/reference/error-sweep-findings.md) triggered six 500s; PostHog held zero `$exception` events afterwards and no GitHub issue opened. Audit of the code: 48 explicit 500 responses in 15 files, 32 more 502/503/504, three capture call sites outside the capture module (two login-bootstrap, one router catch). `authGuard` converts a failed handler into a 500 itself and never reports it.

**2026-11-15 | ARCH | One safety net at the server entry plus the one place that holds the real error, not 48 patched sites**
**Context:** patching every response site would leave new sites uncovered the day they are written.
**Decision:** (1) `authGuard` reports the thrown error; (2) `createApp` wraps `res.writeHead` and checks `statusCode` at `finish`, reporting any unreported 5xx once with code `http_5xx`; (3) the capture module marks a request once reported so there is never a second report; (4) the `unhandledRejection` handler reports with code `unhandled_rejection`.
**Rationale:** the safety net covers every present and future 5xx path with no changes to routes; the real-error report in `authGuard` keeps the stack for the common failure. The fingerprint stays environment, code and route, so a burst on one route is still one GitHub issue.
**Accepted cost:** `http_5xx` reports carry no stack (there is no error object at that point); a first burst of issues is expected for already-existing bugs until `uid-s1` ships.

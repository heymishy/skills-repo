Slicing strategy: vertical-slice

## Flat Feature — Status Endpoint (No Epic Nesting)

Goal: Provide a minimal `/status` endpoint with three independently-advanceable stories that scaffold the response shape progressively, enabling live verification of wsap-s3's multi-story commit gating (one batched commit per stage advance, not N individual commits) and per-story review re-run suppression (zero spurious review re-runs during multi-story batch operations).

Out of scope:
- Persistent data storage or database integration
- Authentication or authorization checks on the `/status` route
- Monitoring, alerting, or metrics collection
- Production deployment or long-term maintenance
- Any real product value beyond verification

Oversight: Low
Oversight rationale: Solo operator context; throwaway feature; no second reviewer required; verification-only scope.
Complexity: 1
Scope stability: Stable

### ep1-s1 — Add GET /status Route

Persona: Solo Operator
Domain: software-engineering

As a solo operator verifying wsap-s3 fixes, I need a minimal `/status` route so that I can advance it through pipeline stages and observe multi-story commit batching behavior.

Benefit linkage: M1 (Multi-Story Commit Batching) — completing this story enables the first story in a 3-story batch, allowing verification of whether wsap-s3's gating produces 1 commit for the trio or 3 separate commits.

Architecture constraints: None identified — checked against .github/architecture-guardrails.md

Given the web UI server is running,
When a client makes a GET request to `/status`,
Then the server responds with HTTP 200 and JSON body `{ "status": "ok" }`.

Given the route is registered in `src/web-ui/server.js`,
When the route is invoked without authentication,
Then the request succeeds (no authentication guard is applied).

Given the response body is JSON,
When the body is parsed with `JSON.parse()`,
Then the result is a valid object with no syntax errors.

Out of scope:
- HTTPS or TLS handling
- Rate limiting or access control
- Response caching

Dependencies: None
NFR: None
Complexity: 1
Scope stability: Stable

### ep1-s2 — Add Version Field to /status Response

Persona: Solo Operator
Domain: software-engineering

As a solo operator verifying wsap-s3 fixes, I need the `/status` route to include a `version` field so that I can confirm story 2 is independently advanceable through pipeline stages without affecting story 1.

Benefit linkage: M1 (Multi-Story Commit Batching) — completing this story adds a second story to the batch, allowing verification that advancing both story 1 and story 2 together produces 1 commit, not 2.

Architecture constraints: None identified — checked against .github/architecture-guardrails.md

Given the `/status` route exists and returns `{ "status": "ok" }`,
When a client makes a GET request to `/status`,
Then the server responds with HTTP 200 and JSON body `{ "status": "ok", "version": "1.0.0" }`.

Given the version field is present in the response,
When the field is read from the JSON object,
Then the value is the string `"1.0.0"` exactly.

Given the response body includes the version field,
When the body is parsed with `JSON.parse()`,
Then the result is valid JSON with no syntax errors.

Out of scope:
- Dynamic version determination from package.json or git tags
- Version update logic or versioning strategy
- Semantic versioning compliance

Dependencies: ep1-s1 (extends existing `/status` route)
NFR: None
Complexity: 1
Scope stability: Stable

### ep1-s3 — Add Uptime Field to /status Response

Persona: Solo Operator
Domain: software-engineering

As a solo operator verifying wsap-s3 fixes, I need the `/status` route to include an `uptime` field so that I can confirm story 3 is independently advanceable and verify that advancing all three stories together produces a single batched commit.

Benefit linkage: M1 (Multi-Story Commit Batching) — completing this story adds the third story to the batch, allowing final verification that advancing all three stories through a stage produces 1 commit, not 3.

Architecture constraints: None identified — checked against .github/architecture-guardrails.md

Given the `/status` route exists and returns `{ "status": "ok", "version": "1.0.0" }`,
When a client makes a GET request to `/status`,
Then the server responds with HTTP 200 and JSON body `{ "status": "ok", "version": "1.0.0", "uptime": <seconds> }` where uptime is a non-negative integer representing server uptime in seconds since process startup.

Given the server has been running for multiple seconds,
When a client makes two successive GET requests to `/status` with a delay between them,
Then the `uptime` field in the second response is greater than the value in the first response.

Given the uptime field is computed from process startup time,
When the field is read from the JSON object,
Then the value is a non-negative integer (zero or greater).

Given the response body includes the uptime field,
When the body is parsed with `JSON.parse()`,
Then the result is valid JSON with no syntax errors.

Out of scope:
- System uptime (use process uptime only)
- Uptime precision beyond seconds
- Uptime reset or server restart handling
- Clock synchronization or NTP

Dependencies: ep1-s1 (extends existing `/status` route)
NFR: None
Complexity: 1
Scope stability: Stable
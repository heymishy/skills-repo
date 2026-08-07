# Contract Proposal: Let an admin toggle the mock LLM gateway on/off from an in-app admin page

**What will be built:**
A new in-memory runtime flag (e.g. `_runtimeMockGatewayOverride`, default `null`/unset) in `mock-llm-gateway.js`, with a setter (`setRuntimeMockGatewayOverride(value)`) and a reset function (`resetRuntimeMockGatewayOverride()`, test/restart-simulation helper). `isMockGatewayEnabled()` extended to: `if (NODE_ENV === 'production') return false; if (runtime override is set) return override; return existing env-var logic;` — the override is consulted AFTER the production hard-override, never before. A new admin page/section (extending `/admin/credits` or a new `/admin/settings`-style route, coding agent's choice) with a GET (shows current state) and POST (flips it) endpoint, both `requireAdmin`-gated, CSRF-protected identically to `admin-credits.js`.

**What will NOT be built:**
Durable (database-backed) persistence. Any change to PostHog flags.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test rendering the page against a known `isMockGatewayEnabled()` state | Unit |
| AC2 | Unit test flip-then-check; Integration test flip-then-drive-real-turn | Unit + Integration |
| AC3 | Unit test simulating restart via reset function; assert page copy text | Unit |
| AC4 | Unit test: `NODE_ENV=production` + override=on still returns false | Unit |
| AC5 | Integration tests: non-admin POST rejected, unauthenticated GET rejected | Integration |

**Assumptions:**
Single Fly.io machine per environment (confirmed this session via direct `flyctl` investigation) means an in-memory flag is genuinely environment-wide, not per-request-random — no sharding/multi-instance concern for this MVP.

**Estimated touch points:**
Files: `src/web-ui/modules/mock-llm-gateway.js`, `src/web-ui/routes/admin-credits.js` (or a new small route file), `src/web-ui/server.js` (route registration).
Services: None new.
APIs: New GET/POST admin toggle endpoint(s).

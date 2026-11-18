# Decisions: one command for the core browser lane (vfy-s1)

**2026-11-18 | DECISION | Playwright starts the test server; the script does not**
**Context:** `playwright.config.js` already defines how the test server starts (`webServer`, port 3999, `NODE_ENV=test`, test-only credentials). A second boot path in the script would drift from it.
**Decision:** the script runs Playwright and relies on `webServer`. Its own job is a port check for a clear message when 3999 is busy.
**Rationale:** one definition of how the server starts; the server log still reaches the terminal through Playwright when a test fails, but the digest does not print it.

**2026-11-18 | DECISION | Core lane only, one worker, the same selector CI uses**
**Context:** three ways to get the lane wrong are running more than one worker (shared in-memory state races), a hand-written spec list (drifts from the matrix), and running the quarantined or Scenario specs (staging-bound or known broken).
**Decision:** the spec list comes from `scripts/list-core-specs.js`, the worker count is 1, and the command runs no other lane. Explicit file arguments replace the list for focused runs.
**Rationale:** a local pass should mean what a CI core pass means.

**2026-11-18 | DECISION | The digest reads Playwright's JSON report, not its console output**
**Context:** the line reporter interleaves the server log and does not repeat failures at the end in a usable form.
**Decision:** the script writes the JSON report to a temporary file and prints one entry per failed test from it.
**Rationale:** the JSON report carries the title, location and error for each result; the digest is then testable against fixture reports.

## Contract Proposal — Build the agent-driven Playwright review and validate it against a seeded issue set

**What will be built:**
An agent-driven review mechanism built on this repo's existing `skill-turn-executor.js`-style invocation, driving a real local/preview build via Playwright, producing narrated free-text commentary about what it observes. Two fixture states of the codebase are used as the validation set: a pre-`gtcl-s1` checkout (both golden-trace candidates live) and a pre-`lcdf-s1` checkout (learnings count shows 0) — both real, already-fixed bugs from this same session, not synthetic injections. A third, current-`master` checkout serves as the clean/false-positive-guard fixture.

**What will NOT be built:**
No CI wiring (Story 4), no real-staging execution — this story runs manually/locally against local/preview builds only. No human-narrated mode work (Stories 1-2).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration tests running the mechanism against both seed fixtures, asserting non-empty commentary | Integration |
| AC2 | Manual scenario — operator reads commentary against each fixture's known gap | Manual |
| AC3 | Manual scenario — operator computes detection rate across the full validation set | Manual |
| AC4 | Integration test against the clean fixture, asserting no false-positive claim about the two known-fixed issues | Integration |

**Assumptions:**
- The 2 seed fixtures' pre-fix commits remain checkoutable (they are real, already-merged history in this repo — `gtcl-s1`'s and `lcdf-s1`'s parent commits).
- The agent-driven mechanism can run against a local/preview server instance without needing real staging credentials for this story's scope.

**Estimated touch points:**
Files: a new script or module wrapping the agent-driven review invocation (exact path decided by the coding agent, following `skill-turn-executor.js`'s own conventions), `tests/check-rdrc-s3-*.js` (new). Services: this repo's existing LLM-invocation path, subject to `mgar-s1`'s mock-gateway safety net; Playwright (already a devDependency per ADR-018).

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. The reuse of `gtcl-s1`/`lcdf-s1`'s own real pre-fix commits as fixtures (rather than inventing synthetic bugs) directly matches the story's own AC1 wording ("seeded from this session's own 2 confirmed examples").

## Contract Proposal — Build the mock LLM gateway and fixture set (bri-s3.1)

**What will be built:**
A backend mock LLM gateway module, extending/refactoring the existing mock provider pattern already present at `src/modules/mock-api-client.js` (currently keyed by skill name via `SKILL_EXECUTOR_PROVIDER=mock`) into the story's required `(stage, model, scenarioName)`-keyed fixture lookup. Concretely:
- A fixture-lookup function that resolves `(stage, model, scenarioName)` to a canned response object read from `tests/e2e/fixtures/llm-gateway/` (new directory).
- An injectable adapter (D37 pattern) — `setMockGatewayClient(fn)` / default export — wired alongside the real client used by `src/modules/skill-turn-executor.js`, activated only when `NODE_ENV=test` (or an equivalent explicit test-mode flag) is set, mirroring the ADR-018 `tests/e2e/fixtures/auth.js` guard pattern.
- A minimum 14-fixture set: one success + one failure/edge-case fixture for each of the 7 `gate-map.js` stages (discovery, benefit-metric, definition, test-plan, definition-of-ready, branch-setup, branch-complete), including verifying and building fixtures for `branch-setup`/`branch-complete` per `routes/journey.js`'s `SLASH_CAPABILITY_MAP` (AC4).
- A regeneration script (e.g. `scripts/regenerate-llm-fixtures.js`) that refreshes a named fixture file in place from a real (or stubbed, in the automated test) dev/staging response, logging which fixture changed and from what source.

**What will NOT be built:**
- `@live` fixture equivalents or any live-API-calling test path — `@live` tests call the real Copilot Chat Completions API directly; no gateway involvement for that tag.
- Fixture coverage for `implementation-plan`, `subagent-execution`, or `verify-completion` — these are inner-loop stages beyond the 7 `gate-map.js` stages and are explicitly out of scope for this story.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Call the fixture-lookup function twice with an identical `(stage='discovery', model, scenarioName='success')` key and assert byte-identical results; assert a differently-keyed call returns a distinct fixture | Unit |
| AC2 | Scan the fixture directory, group by stage/scenario, assert all 7 stages present with ≥1 success + ≥1 failure each, total ≥14 files | Integration |
| AC3 | Run the regeneration script against a stubbed "real response" payload for one fixture; assert the file is overwritten with valid JSON and a log entry names the changed fixture and its source | Integration |
| AC4 | Drive a `branch-setup` and a `branch-complete` stage call through the same model-first skill-session mechanism (`SLASH_CAPABILITY_MAP`) used by the other 5 stages; assert both resolve via fixtures | Integration |
| AC5 | Drive one full stage call through `skill-turn-executor.js` with a spy on the real Copilot Chat Completions HTTP client; assert zero real invocations, and confirm the gateway is unreachable when `NODE_ENV` is not `test` | Integration |

**Assumptions:**
- The existing `src/modules/mock-api-client.js` mock provider (keyed by skill name, `SKILL_EXECUTOR_PROVIDER=mock`) is a prior/parallel mock mechanism, not this story's deliverable outright — this story either extends it to the `(stage, model, scenarioName)` key shape or introduces a parallel, purpose-built gateway module; the exact relationship is an implementation-time decision, not a DoR blocker, since both approaches satisfy the ACs as written.
- `routes/journey.js`'s `SLASH_CAPABILITY_MAP` structure (confirmed 2026-07-09 per `decisions.md`) is stable enough to drive `branch-setup`/`branch-complete` stage calls through the same model-first mechanism as the other 5 stages.
- The regeneration script's "real dev/staging response" source can be stubbed in the automated test (external-dependency gap, acknowledged in the test plan) — periodic manual regeneration against real staging closes the fidelity gap operationally, not as a DoD item.

**Estimated touch points:**
Files: `src/modules/mock-api-client.js` (or a new `src/modules/mock-llm-gateway.js`), `tests/e2e/fixtures/llm-gateway/*.json` (new), `scripts/regenerate-llm-fixtures.js` (new), `src/modules/skill-turn-executor.js` (wiring point), `routes/journey.js` (`SLASH_CAPABILITY_MAP` read, no behavioural change expected).
Services: None external — no real API calls made by this story's own tests.
APIs: None new; the story guards against real calls to the GitHub Copilot Chat Completions API.

---

## Contract Review

Reviewed against all 5 ACs and the test plan's Unit/Integration/NFR sections.

No mismatches found — the proposed fixture-lookup + injectable-adapter + regeneration-script implementation directly satisfies AC1–AC5, and the test plan's coverage table maps 1:1 to the AC list above (AC1 unit, AC2–AC5 integration, matching `bri-s3.1-mock-llm-gateway-test-plan.md`).

One judgment call flagged for visibility, not a blocking mismatch: the story's Architecture Constraints describe the mock gateway's wiring in prose (D37, ADR-018 pattern) rather than as a dedicated standalone AC for "production wiring." Per H-ADAPTER handling below, this is treated as sufficient because this adapter is a **test-activation** adapter (never wired into a production code path by design), which is architecturally distinct from a production-data adapter requiring its own wiring AC.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream: None within this epic.

`schemaDepends: []` — not required. Per H8-ext: "If the story's Dependencies block is 'None', pass with: no upstream dependencies declared — schema check not required."

**H8-ext: PASS** — no upstream dependencies declared — schema check not required.

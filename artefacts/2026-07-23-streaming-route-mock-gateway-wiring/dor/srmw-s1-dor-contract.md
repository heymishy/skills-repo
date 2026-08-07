# DoR Contract: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint

**Story reference:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/stories/srmw-s1.md
**Test plan reference:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/test-plans/srmw-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml`, add two `_turnOptions` assignments immediately after the existing `_turnOptions.tenantId`/`_turnOptions.sessionId` lines: `_turnOptions.stage = session.skillName;` and `_turnOptions.scenarioName = session.mockScenarioName || 'success';` — mirroring `htmlSubmitTurn`'s existing `_turnMeta` construction exactly.
2. New test file `tests/check-srmw-s1-streaming-mock-gateway-wiring.js` — UT1 (options.stage threaded per-session, differentiated), UT2 (options.scenarioName default + override, differentiated), IT1 (real streaming turn with the real executor + real mock gateway wired, MOCK_LLM_GATEWAY=true, confirms fixture content returned and `https.request` never called).
3. Written RED first against current code (all 3 tests fail, demonstrating the exact live defect), then GREEN after the two-line fix.
4. Attempt a real `flyctl deploy` to `wuce-staging` (after checking for concurrent deploy activity), then drive a real turn through the actual streaming endpoint and report the observed outcome honestly.

**What will NOT be built:**
- No change to `mock-llm-gateway.js`, `skill-turn-executor.js`, or `server.js`.
- No change to SSE streaming behaviour, event framing, chunk-buffering, or marker-scanning logic in `handlePostTurnStreamHtml`.
- No change to `fly.staging.toml` or any Fly secret.
- No new adapter or activation-rule logic — this fix threads two already-existing session fields into an already-wired, already-tested executor's already-existing options contract.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 | unit |
| AC2 | UT2 | unit |
| AC3 | IT1 (real executor + real mock gateway, no real network call) | integration |
| AC4 | IT2 (full regression pass) | integration |
| AC5 | E2E1 (real staging turn, real-world, deploy-dependent) | e2e |

**Assumptions:**
- `flyctl` may or may not be available/authenticated when this story is dispatched — a deploy is attempted; if it fails, cannot complete, or a concurrent agent is mid-deploy (checked via `flyctl releases --app wuce-staging` before deploying), AC5 is reported as a pending follow-up, not a false success.
- `mgfd-s1` (PR #558) has already merged and is present on the branch this story is built from — both the Docker fixture-shipping fix and the `server.js` unconditional-wiring fix are prerequisites confirmed already in place.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js`, `tests/check-srmw-s1-streaming-mock-gateway-wiring.js` (new)
Services: `wuce-staging` (Fly.io) — deploy only, no schema/config change
APIs: None

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ verified by UT1 — ✅ aligned.
- AC2 ↔ verified by UT2 — ✅ aligned.
- AC3 ↔ verified by IT1 — ✅ aligned.
- AC4 ↔ verified by IT2 — ✅ aligned.
- AC5 ↔ verified by E2E1 (real-world, deploy-dependent) — ✅ aligned.

No mismatches found between proposed implementation and stated ACs. No file named as out-of-scope in the story's Architecture Constraints (`mock-llm-gateway.js`, `skill-turn-executor.js`, `server.js`) appears in the test plan's required touchpoints — confirmed no B1/D1-style contract/test-plan contradiction.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

(See `srmw-s1-dor.md` for the full table — duplicated here per template convention.)

**All hard blocks pass**, with H-NFR/H-NFR-profile and H-GOV recorded as RISK-ACCEPTs, consistent with this repo's established short-track precedent.

---

## Sign-off

**Oversight level:** High.
**Scope confirmation:** This fix is scoped narrowly to two `_turnOptions` assignments in `handlePostTurnStreamHtml` only — it is explicitly not a broader streaming-route rewrite, does not touch the mock gateway or executor's own logic, and does not change SSE framing/behaviour in any way.
**Sign-off required:** No — matches this repo's established short-track precedent.
**Signed off by:** Claude (agent, autonomous, short-track), 2026-07-23 — root cause independently confirmed by reading `src/web-ui/routes/skills.js` (both `handlePostTurnStreamHtml` and `htmlSubmitTurn` in full), `src/modules/skill-turn-executor.js`, `src/web-ui/modules/mock-llm-gateway.js`, PR #559's description, and `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s a4 FINDING entry.

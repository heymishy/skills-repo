# DoR Contract: Fix production Dockerfile silently shipping a structurally-active but fixture-less mock-LLM-gateway to wuce-staging

**Story reference:** artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/stories/mgfd-s1.md
**Test plan reference:** artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/test-plans/mgfd-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Narrow `.dockerignore`'s blanket `tests/` exclusion using the documented step-wise-negation idiom, so that only `tests/e2e/fixtures/llm-gateway/` (16 JSON files, 20 KB) survives into the Docker build context — every other path under `tests/` remains excluded.
2. Add one explicit `COPY --chown=node:node tests/e2e/fixtures/llm-gateway/ ./tests/e2e/fixtures/llm-gateway/` instruction to the `Dockerfile`'s `production` stage, direct from the build context (not `--from=builder`), matching the existing pattern already used for `skills/` and `product/`.
3. New test file `tests/check-mgfd-s1-dockerfile-fixture-copy.js` — static assertions proving (a) the Dockerfile's COPY instruction targets exactly the fixture directory and no broader `tests/` path, (b) a purpose-built dockerignore-semantics matcher confirms the fixture directory's files are included while sibling `tests/` paths remain excluded, (c) `inventoryFixtures()`'s real file list is a subset of what the matcher includes.
4. Attempt a real `flyctl deploy` to `wuce-staging`, then verify via `flyctl ssh console` that the fixture files exist in the running container, then drive a real turn via `e2e-test-admin` and confirm fixture text is returned, then re-run a3's own Playwright spec against real staging and report AC3's actual observed outcome.

**What will NOT be built:**
- No change to `mock-llm-gateway.js`'s `FIXTURE_DIR` path logic or activation rules.
- No change to `fly.staging.toml` or any Fly secret.
- No relocation of fixture files into `src/` (considered, rejected — see story's Architecture Constraints for the full rationale).
- No blanket re-inclusion of the whole `tests/` tree into the Docker build context.
- No general-purpose dockerignore-parsing library — the test's matcher implements only the specific pattern shapes this fix's own `.dockerignore` uses.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 | unit |
| AC2 | UT2 | unit |
| AC3 | Explicit, honest reporting of achieved verification level (static + real-container, not local Docker build) — asserted procedurally at verification time, cross-checked by UT1-UT3 and E2E1(a) | procedural / test-plan structure itself |
| AC4 | E2E1(b) (real staging turn, real-world) | e2e |
| AC5 | E2E2 (a3's own spec re-run, real-world) | e2e |
| AC6 | IT1 (full regression pass) | integration |

**Assumptions:**
- `flyctl` is available and authenticated in this environment (confirmed: `flyctl auth whoami` → `hamish@gemba.co.nz`) — a deploy is attempted; if it fails or cannot complete within this session, AC4/AC5 are reported as pending follow-ups, not false successes.
- Docker's local daemon is unavailable in this sandbox (confirmed: `docker version` shows client only, daemon connection error) — no test claims a local image build occurred; AC3 exists specifically to make this an explicit, honestly-reported constraint rather than a silent gap.
- The `ignore` npm package is not installed in this repo (confirmed) — UT2/UT3's matcher is purpose-built for the specific pattern shapes this fix introduces, not a general dockerignore parser, and is cross-checked against the real container listing in E2E1(a) as the authoritative source of truth.

**Estimated touch points:**
Files: `Dockerfile`, `.dockerignore`, `tests/check-mgfd-s1-dockerfile-fixture-copy.js` (new)
Services: `wuce-staging` (Fly.io) — deploy only, no schema/config change
APIs: None

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ verified by UT1 — ✅ aligned.
- AC2 ↔ verified by UT2 — ✅ aligned.
- AC3 ↔ verified by the test plan's own explicit honest-reporting structure, cross-checked by UT1-UT3 (static) and E2E1(a) (real container) — ✅ aligned.
- AC4 ↔ verified by E2E1(b) (real-world, deploy-dependent) — ✅ aligned.
- AC5 ↔ verified by E2E2 (real-world, deploy-dependent) — ✅ aligned.
- AC6 ↔ verified by IT1 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs. No file named as out-of-scope in the story's Architecture Constraints (`mock-llm-gateway.js`, `fly.staging.toml`) appears in the test plan's required touchpoints — confirmed no B1/D1-style contract/test-plan contradiction.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

(See `mgfd-s1-dor.md` for the full table — duplicated here per template convention.)

**All hard blocks pass**, with H-NFR/H-NFR-profile and H-GOV recorded as RISK-ACCEPTs, consistent with this repo's established short-track precedent.

---

## Sign-off

**Oversight level:** High.
**Scope confirmation:** This fix is scoped narrowly to `.dockerignore` and the `Dockerfile`'s `production` stage `COPY` instructions only — it is explicitly not a broader Docker pipeline rewrite, does not touch `mock-llm-gateway.js`'s code, and does not relocate fixture files (see story's Architecture Constraints for the rejected-alternative rationale).
**Sign-off required:** No — matches this repo's established short-track precedent.
**Signed off by:** Claude (agent, autonomous, short-track), 2026-07-23 — root cause independently confirmed by reading `Dockerfile`, `.dockerignore`, `src/web-ui/modules/mock-llm-gateway.js`, `artefacts/archived/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.4-docker-deployment.md`'s AC6, and PR #557 / `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s FINDING entry.

# Story: Fix production Dockerfile silently shipping a structurally-active but fixture-less mock-LLM-gateway to wuce-staging

**Epic reference:** None — short-track (bounded infrastructure bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live, real-staging-verified defect documented as a new FINDING in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` (a3 follow-up, 2026-07-23), itself surfaced while building PR https://github.com/heymishy/skills-repo/pull/557's E2E spec.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied honestly to the parent feature's own benefit metric (m1) rather than fabricating a new metric artefact.

## User Story

As **any staging E2E story that relies on `MOCK_LLM_GATEWAY=true` actually returning deterministic fixture content on real `wuce-staging`** (already confirmed blocking a3's AC3, and will block a4 and every other model-turn-driven story in this feature),
I want **a real turn against a mock-gateway-enabled session on real staging to return the configured fixture's text**,
So that **AC3-class acceptance criteria (asserting canvas/session content produced by a mocked model turn) can actually pass on real staging instead of permanently skipping with an accurate-but-blocking reason**.

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Not a new metric artefact (short-track) — this fix directly unblocks m1 for every remaining model-turn-driven story in that feature (a4 and beyond), which cannot move m1 forward at all while this defect stands.
**How:** `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s a3 FINDING entry documents driving a real turn via the `e2e-test-admin` identity (bypassing the credits gate entirely) against both `/ideate` and `/discovery` on real `wuce-staging`, with `MOCK_LLM_GATEWAY=true` confirmed genuinely active on the server (`flyctl ssh console --app wuce-staging -C "printenv MOCK_LLM_GATEWAY"` → `true`). Both returned an empty response (`{"done":false,"response":"","usage":null}`) instead of the mock fixture's deterministic text, because `/app/tests` does not exist in the deployed container (`flyctl ssh console --app wuce-staging -C "ls -la /app/tests"` → "No such file or directory") — the fixture files the mock gateway reads (`src/web-ui/modules/mock-llm-gateway.js`'s `FIXTURE_DIR`, resolving to `tests/e2e/fixtures/llm-gateway/`) are never copied into the production image, so the gateway is structurally active (per `fly.staging.toml` and the real Fly secret) but has nothing to serve.

## Architecture Constraints

- **The production `Dockerfile`'s exclusion of `tests/` is deliberate, not an oversight — confirmed by reading `wuce.4-docker-deployment.md`'s AC6:** "the final stage contains only production runtime dependencies — no dev dependencies, build tools, or source files not required at runtime — and the final image size is documented in the build output." `.dockerignore`'s `tests/` line carries the comment `# Test files — not required at runtime (AC6: production-only final image)`. The whole `tests/` directory is 5.3 MB (`du -sh tests/`) — most of it is the full unit/integration suite plus non-fixture E2E spec files, none of which are required at runtime. **Shipping the entire `tests/` tree to satisfy this one runtime dependency would violate AC6's own intent** (image-size/attack-surface discipline for a production container) for the sake of 20 KB of genuinely-needed data.
- **The narrow fix: ship only the specific fixture directory the mock gateway actually reads, not the whole `tests/` tree.** `src/web-ui/modules/mock-llm-gateway.js`'s `FIXTURE_DIR` constant (`path.join(__dirname, '..', '..', '..', 'tests', 'e2e', 'fixtures', 'llm-gateway')`) resolves, relative to the module's own location (`src/web-ui/modules/`), to `<app-root>/tests/e2e/fixtures/llm-gateway`. This directory is 20 KB across 16 JSON fixture files (`du -sh tests/e2e/fixtures/llm-gateway/`) — three orders of magnitude smaller than the full `tests/` tree, and is data (canned JSON responses), not code, no different in kind from the `skills/` and `product/` "runtime data directories" the Dockerfile's own comment already describes and already ships via direct `COPY` in the production stage.
- **Two changes are required together, not one:**
  1. `.dockerignore`'s blanket `tests/` exclusion must be narrowed with step-wise negation patterns (the documented dockerignore idiom for "exclude everything except one specific nested path" — a bare `!tests/e2e/fixtures/llm-gateway/` negation does not work on its own when an ancestor directory is fully excluded; each intermediate level must be explicitly un-excluded) so that `tests/e2e/fixtures/llm-gateway/` — and *only* that path — survives into the Docker build context.
  2. The production stage of the `Dockerfile` needs an explicit `COPY` instruction for that path (mirroring the existing direct-from-build-context pattern already used for `skills/` and `product/`, not `--from=builder`, since the builder stage does not and should not need test fixtures for a `production` npm install). No path is copied automatically just because `.dockerignore` allows it through — the Dockerfile must still name it.
- **Considered and rejected alternative: move fixtures under `src/` instead of touching the Docker pipeline.** Relocating `tests/e2e/fixtures/llm-gateway/` to e.g. `src/web-ui/modules/fixtures/llm-gateway/` would make the existing `COPY src/ ./src/`/`COPY --from=builder /app/src ./src/` lines cover it automatically, with no Dockerfile/`.dockerignore` change at all. Rejected: it would blur the repo's existing `src/` (runtime code) vs `tests/` (test-only assets) boundary for a directory that is conceptually a *test fixture set* (used by `tests/e2e/*.spec.js` files and this mock gateway alike), would require updating every fixture-authoring/inventory reference (`inventoryFixtures()`, the 7-stage fixture-matrix tests, any future story adding fixtures) to a new location, and treats a packaging/deployment problem as a reason to reorganise source layout — the narrower, purely-infrastructure fix (teach the Docker pipeline about one small, clearly-scoped runtime dependency) is more targeted and leaves the code's own directory conventions untouched.
- **No change to `mock-llm-gateway.js`'s `FIXTURE_DIR` path logic** — the fix must make the already-hardcoded path resolve to real files in the container, not change what path the module looks for.
- **No change to `fly.staging.toml` or the `MOCK_LLM_GATEWAY` Fly secret** — both are already confirmed correct; the defect is entirely in what the Docker build ships, not in configuration.

## Dependencies

- **Upstream:** None — this is a standalone infrastructure fix.
- **Downstream:** `2026-07-23-e2e-core-journey-coverage`'s a3 story (already merged, PR #557) has AC3 currently `test.skip()`'d with this exact blocker as its accurate, dynamic skip reason; once this fix deploys, a3's own spec (`tests/e2e/a3-product-feature-ideate-canvas.spec.js`) can be re-run against real staging to confirm it now gets past this specific blocker (though AC3 may still not fully pass end-to-end if other, separately-scoped issues remain — see NFRs/Out of Scope). a4 and any other not-yet-dispatched model-turn-driven story in the same feature depend on this fix landing before their own AC verification against real staging can succeed.

## Acceptance Criteria

**AC1:** Given the production `Dockerfile`'s final (`production`) build stage, When the image is inspected for its `COPY` instructions, Then a `COPY` instruction exists that copies `tests/e2e/fixtures/llm-gateway/` (and only that path — not the whole `tests/` tree) into the image at the runtime-expected location matching `mock-llm-gateway.js`'s `FIXTURE_DIR` resolution (`<app-root>/tests/e2e/fixtures/llm-gateway`).

**AC2:** Given `.dockerignore`'s build-context filtering rules, When the effective ignore/include decision is evaluated for every file under `tests/e2e/fixtures/llm-gateway/`, Then each such file is included in the Docker build context, while every other file under `tests/` (e.g. `tests/check-*.js`, `tests/e2e/*.spec.js`, any other fixture subdirectory) remains excluded — proving the fix is scoped to the one required directory, not a blanket re-inclusion of `tests/`.

**AC3:** Given Docker is unavailable for a local image build in this sandbox (confirmed via `docker version` — client present, daemon unreachable), When this fix is verified, Then verification is performed at the two levels actually available: (a) a static, automated test asserting AC1 and AC2 directly against the Dockerfile/`.dockerignore` content (not a hand-inspection), and (b) a real deploy to `wuce-staging` followed by `flyctl ssh console --app wuce-staging -C "ls -la /app/tests/e2e/fixtures/llm-gateway"` confirming the fixture files exist in the real running container — reported honestly as the achieved verification level, not represented as a full local Docker build verification that did not occur.

**AC4:** Given the fix is deployed to real `wuce-staging` and a real turn is driven against a mock-gateway-enabled session (the same `e2e-test-admin` identity and `/ideate`/`/discovery` routes used in the original FINDING), When the turn completes, Then the response contains the configured fixture's deterministic text (not an empty `{"done":false,"response":"","usage":null}`) — the direct, real-world proof that the structural gap (gateway active, no fixtures) is closed.

**AC5:** Given `2026-07-23-e2e-core-journey-coverage`'s a3 story's own Playwright spec (`tests/e2e/a3-product-feature-ideate-canvas.spec.js`, AC3, currently `test.skip()`'d citing this exact blocker), When the spec is re-run against real `wuce-staging` after this fix deploys, Then AC3 no longer skips for *this* reason — it either passes outright or fails/skips for a different, newly-visible, already-out-of-scope reason (e.g. the separately-documented credits-upsert-path gap for the admin-UI, if still applicable) — reported honestly either way, not silently declared "fixed" without re-running the real spec.

**AC6:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

## Out of Scope

- Any change to `mock-llm-gateway.js`'s fixture-lookup logic, `FIXTURE_DIR` path construction, or activation rules (`isMockGatewayEnabled()`).
- Any change to `fly.staging.toml` or the `MOCK_LLM_GATEWAY` / `ADMIN_GITHUB_LOGINS` Fly secrets.
- Relocating fixture files out of `tests/e2e/fixtures/llm-gateway/` into `src/` (considered and rejected — see Architecture Constraints).
- The separately-documented, already out-of-scope credits-upsert admin-UI path gap (`artefacts/2026-07-23-credits-upsert-fix/decisions.md`'s GAP entry) — unrelated defect, not touched here.
- A full audit of every other file/directory `.dockerignore` excludes for the same class of "structurally-active-but-missing-runtime-dependency" gap — this story fixes the one confirmed, live-verified instance (the mock-LLM-gateway fixture set).
- Re-running or re-verifying a3's AC1/AC2 (already passing, unaffected by this fix) or a3's separately-documented credits-upsert blocker.

## NFRs

- **Performance:** Negligible — 20 KB of additional JSON files in a production image that is already several hundred MB (Node/Alpine base + dependencies); no measurable build-time or runtime cost.
- **Security:** No new attack surface of consequence — fixture files are static, non-executable JSON data, already public within the repo (not secrets), and only reachable through the mock gateway's own existing `NODE_ENV=production` hard-override (the gateway itself is unreachable in real production regardless of whether fixture files exist in the image). Image-size/attack-surface discipline (AC6 of the original Docker-deployment story) is explicitly preserved by the narrow-copy approach — this is the central design constraint of this fix, not an afterthought.
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Not applicable — no change to any audited code path.

## Complexity Rating

**Rating:** 1 — well understood; root cause (confirmed live against real staging), correct fix shape (narrow `.dockerignore` negation + explicit `COPY`), and verification approach (static test + real redeploy) are all already identified.
**Scope stability:** Stable.

## Addendum — a second root cause found during AC4 verification (2026-07-23)

While verifying AC4 against real, redeployed `wuce-staging`, driving a real turn still returned an empty response even after the Dockerfile/`.dockerignore` fix was confirmed live (fixture files present in the container). A second, distinct defect was found: `src/web-ui/server.js` only ever called `mock-llm-gateway.js`'s `wireDefaultMockGatewayClient()` from inside a `NODE_ENV==='test'`-only block, so a `MOCK_LLM_GATEWAY=true` staging process (`NODE_ENV='staging'`) never actually wired the adapter, despite `isMockGatewayEnabled()` correctly returning `true`. Fixed by moving the wiring call to an unconditional top-level block gated only on `isMockGatewayEnabled()` itself — see `decisions.md`'s "FINDING + FIX" entry for the full writeup. This expands this story's touch points to include `src/web-ui/server.js` (not originally estimated in the DoR contract), but stays within the story's own stated goal — AC4 could not be verified at all without it. AC1–AC3, AC6 are unaffected by this addendum.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic

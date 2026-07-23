## Test Plan: Fix production Dockerfile silently shipping a structurally-active but fixture-less mock-LLM-gateway to wuce-staging

**Story reference:** artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/stories/mgfd-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dockerfile COPYs the fixture dir, not the whole tests/ tree | 1 | — | — | — | — | 🟢 |
| AC2 | .dockerignore includes only the fixture dir under tests/, excludes the rest | 1 | — | — | — | — | 🟢 |
| AC3 | Verification level achieved is reported honestly (no local Docker daemon) | — | — | — | 1 | Docker-daemon-unavailable | 🟡 |
| AC4 | Real staging turn returns fixture text, not empty response | — | — | 1 | — | Deploy-dependent | 🟡 |
| AC5 | a3's own spec AC3 no longer skips for this specific reason | — | — | 1 | — | Deploy-dependent | 🟡 |
| AC6 | Full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |

---

## Test Data Strategy

**Source:** The real, checked-in `Dockerfile` and `.dockerignore` files themselves (static content assertions) — no fixtures needed for AC1/AC2. AC4/AC5 use the real, already-existing `tests/e2e/fixtures/llm-gateway/*.json` fixture set and the real `e2e-test-admin` identity already established by the parent E2E-coverage feature (`ADMIN_GITHUB_LOGINS`).
**PCI/sensitivity in scope:** No.
**Availability:** AC1/AC2/AC6 available now. AC3's honest-reporting requirement is procedural (assessed at verification time, not a separate fixture). AC4/AC5 require a live `flyctl deploy` to `wuce-staging` within this session — if it cannot complete, reported as not run, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `Dockerfile` file content | Repo | None | |
| AC2 | `.dockerignore` file content + a minimal, purpose-built dockerignore-pattern matcher implementing the documented step-wise-negation semantics | Repo + new test helper | None | `ignore` npm package is not installed in this repo (confirmed) — the test implements only the specific pattern semantics needed (bare directory exclusion, trailing-slash, step-wise `!` negation), not a general-purpose dockerignore parser |
| AC3 | `docker version` output (already captured: client present, daemon unreachable in this sandbox) | Environment | None | |
| AC4 | Real `wuce-staging`, `e2e-test-admin` identity, `/ideate` or `/discovery` route | Real staging | None | Reuses the exact repro steps from the FINDING in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` |
| AC5 | `tests/e2e/a3-product-feature-ideate-canvas.spec.js` (unmodified, owned by a different story) | Repo, real staging | None | |
| AC6 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC4/AC5 depend on a live `flyctl deploy` succeeding within this session and on real `wuce-staging` being reachable/authenticated. If either cannot complete, both rows are reported as pending/not-run, not claimed as passing. No local Docker daemon is available in this sandbox (confirmed via `docker version`), so no row claims a full local image-build verification — AC3 exists specifically to make this limitation an explicit, tested, honestly-reported acceptance criterion rather than a silent gap.

---

## Unit Tests

### UT1 — Dockerfile's production stage COPYs the fixture directory, and only that directory, from `tests/` (AC1)
- **Verifies:** AC1
- **Component:** `Dockerfile` (static content)
- **Action:** Read `Dockerfile`; assert a `COPY` line exists whose source path is `tests/e2e/fixtures/llm-gateway/` (or equivalent trailing-slash form) and whose destination resolves under the image's `WORKDIR` (`/app`) to `./tests/e2e/fixtures/llm-gateway/`, landing at the exact path `mock-llm-gateway.js`'s `FIXTURE_DIR` computes (`<app-root>/tests/e2e/fixtures/llm-gateway`); assert no `COPY` line names the bare `tests/` root or any other `tests/` subpath.
- **Expected result:** Exactly the fixture-directory `COPY` line is present; no broader `tests/` copy exists.
- **RED against current Dockerfile:** No `COPY` instruction referencing `tests/` exists anywhere in the file today — the assertion for the fixture-directory `COPY` line fails.

### UT2 — `.dockerignore` re-includes only `tests/e2e/fixtures/llm-gateway/` under the excluded `tests/` tree (AC2)
- **Verifies:** AC2
- **Component:** `.dockerignore` (static content) + a purpose-built minimal pattern matcher
- **Action:** Implement a small, test-local function applying `.dockerignore`'s documented semantics (ordered patterns; trailing `/` matches a directory and everything beneath it; `!`-prefixed patterns re-include; a file nested under an excluded ancestor is only re-included if every intermediate ancestor level is also explicitly re-included — the documented "step-down" idiom) to a representative sample of paths: each of the 16 real files under `tests/e2e/fixtures/llm-gateway/`, plus control paths `tests/check-cuf-s1-credits-upsert-fix.js`, `tests/e2e/a3-product-feature-ideate-canvas.spec.js`, `tests/e2e/fixtures/admin-credits-topup.js` (a fixture file in a sibling directory that must remain excluded).
- **Expected result:** All 16 real files under `tests/e2e/fixtures/llm-gateway/` are included; all 3 control paths remain excluded.
- **RED against current `.dockerignore`:** The current file has a single bare `tests/` line with no negation at all — every path in the sample, including all 16 fixture files, evaluates as excluded.

### UT3 — inventory cross-check: every file `mock-llm-gateway.js`'s `inventoryFixtures()` reports is covered by UT2's inclusion set (AC1/AC2 consistency)
- **Verifies:** AC1, AC2 (consistency between the shipped set and the module's own runtime expectations)
- **Component:** `src/web-ui/modules/mock-llm-gateway.js`'s `inventoryFixtures()` + the same matcher from UT2
- **Action:** Call `inventoryFixtures()` against the real `tests/e2e/fixtures/llm-gateway/` directory; assert every file it reports is included by the UT2 matcher.
- **Expected result:** 100% overlap — nothing the running module expects to find at runtime is left behind by the Docker packaging fix.

---

## Integration Tests

### IT1 — full existing regression suite (AC6)
- **Verifies:** AC6
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`.

---

## E2E / Manual Tests

### E2E1 — real `wuce-staging` deploy + container inspection (AC3 verification-level, AC4)
- **Verifies:** AC3 (achieved verification level), AC4
- **Components involved:** Real `wuce-staging` Fly app
- **Precondition:** This fix is deployed via `flyctl deploy --app wuce-staging`
- **Action:** (a) `flyctl ssh console --app wuce-staging -C "ls -la /app/tests/e2e/fixtures/llm-gateway"` — confirm the fixture files now exist in the running container (previously: "No such file or directory" for the whole `/app/tests` path). (b) Drive a real turn via the `e2e-test-admin` identity against `/ideate` or `/discovery`, exactly reproducing the original FINDING's repro steps.
- **Expected result:** (a) fixture files listed, present. (b) response contains the configured fixture's deterministic text, not `{"done":false,"response":"","usage":null}`.
- **Contingency:** If deploy cannot complete this session, reported as not run — AC3/AC4 fall back to the static UT1/UT2/UT3 verification level only, reported honestly as such.

### E2E2 — a3's own spec re-run against real staging (AC5)
- **Verifies:** AC5
- **Components involved:** `tests/e2e/a3-product-feature-ideate-canvas.spec.js` (unmodified), real `wuce-staging`
- **Precondition:** E2E1 has succeeded (fix deployed)
- **Action:** `npx playwright test a3-product-feature-ideate-canvas` against real `wuce-staging`.
- **Expected result:** AC3's `test.skip()` no longer fires for the fixture-missing reason — either it passes, or it fails/skips for a different, separately-scoped, already-documented reason (e.g. the credits-upsert admin-UI gap). Reported exactly as observed.
- **Contingency:** If E2E1 did not complete, this test is not run and is reported as pending.

---

## NFR Tests

None beyond IT1 (no new NFR-specific behaviour introduced — see story NFRs section; this is a packaging fix, not new application logic).

---

## Out of Scope for This Test Plan

- Re-verifying a3's AC1/AC2 (unaffected, already passing).
- Any test of the separately-documented credits-upsert admin-UI gap.
- A general-purpose `.dockerignore`/dockerignore-semantics library — UT2/UT3's matcher implements only the specific pattern shapes this fix actually uses, not full Docker-daemon-equivalent parsing.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No local Docker daemon available in this sandbox (`docker version` — client present, daemon unreachable) | Environment constraint, not a choice | AC3 makes this an explicit, tested, honestly-reported acceptance criterion; UT1-UT3 provide static verification, E2E1(a) provides real-container verification via `flyctl ssh console` instead of a local build |
| E2E1/E2E2 depend on a live `flyctl deploy` succeeding within this session | Deploy environment availability is not guaranteed at test-plan-authoring time | Contingency clauses require explicit "not run" reporting rather than a fabricated pass |
| UT2/UT3's matcher is purpose-built, not a vetted general library | No dockerignore-parsing library is installed in this repo | Scoped narrowly to only the pattern shapes this fix's own `.dockerignore` changes use; cross-checked against the real, live container listing in E2E1(a) as the authoritative source of truth |

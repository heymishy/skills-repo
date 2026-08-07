# Definition of Ready Checklist

## Definition of Ready: Fix production Dockerfile silently shipping a structurally-active but fixture-less mock-LLM-gateway to wuce-staging

**Story reference:** artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/stories/mgfd-s1.md
**Test plan reference:** artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/test-plans/mgfd-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-07-23-e2e-core-journey-coverage`'s m1 (real, staging-verified E2E coverage), stated explicitly as reuse of the parent feature's metric rather than a fabricated new one |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No schema change; pure Docker/dockerignore packaging fix |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | AC6 of the original `wuce.4-docker-deployment` story read and reconciled; narrow-copy approach explicitly chosen to preserve that AC's image-size/attack-surface intent; a rejected alternative (moving fixtures under `src/`) documented with rationale |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `cuf-s1`/`scsf-s1`/`pcr-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal (test fixture JSON, non-secret, already public in the repo) |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP-style precedent** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ | This story *is* an infrastructure/deployment fix (Dockerfile, `.dockerignore`) — no separate infra-plan artefact exists in this repo's template set for a fix of this size; treated as covered by this DoR + the DoR contract's touch-point list, consistent with `bri-s2.1`'s prior precedent for Fly/staging config changes |
| H-MIG | Migration-review gate | ✅ N/A | No schema migration |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in the dockerignore-semantics matcher | **Acknowledged — proceed.** Root cause independently confirmed via direct `flyctl ssh console` inspection of the real container before writing the fix; the matcher's correctness is additionally cross-checked against the real, live container listing in E2E1(a), not relied on standalone. Same rationale as prior short-track precedent (`cuf-s1`, `scsf-s1`, `pcr-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | AC4/AC5 (real-staging confirmation) are deploy-dependent; no local Docker daemon means AC1-AC3 are the only guaranteed-available verification level | **Acknowledged — proceed.** UT1-UT3 (static) fully verify AC1/AC2 independent of deploy outcome; AC3 is explicitly written to make honest reporting of the achieved verification level itself an acceptance criterion, so a deploy failure degrades the *reported* verification level rather than producing a false pass. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix production Dockerfile silently shipping a structurally-active but fixture-less mock-LLM-gateway to wuce-staging — artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/stories/mgfd-s1.md
Test plan: artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/test-plans/mgfd-s1-test-plan.md
DoR contract: artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/dor/mgfd-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Narrow the .dockerignore exclusion of tests/ using step-wise negation
  patterns so that ONLY tests/e2e/fixtures/llm-gateway/ (and its contents)
  survives into the Docker build context; every other path under tests/
  remains excluded.
- Add an explicit COPY instruction to the Dockerfile's production stage
  for tests/e2e/fixtures/llm-gateway/, landing at the path
  mock-llm-gateway.js's FIXTURE_DIR already expects
  (<app-root>/tests/e2e/fixtures/llm-gateway). Do not copy the whole
  tests/ tree. Do not add this COPY to the builder stage (matches the
  existing direct-from-context pattern already used for skills/ and
  product/).
- Do not modify mock-llm-gateway.js, fly.staging.toml, or any Fly secret.
- New test file tests/check-mgfd-s1-dockerfile-fixture-copy.js covering
  UT1-UT3 from the test plan (Dockerfile COPY assertion, dockerignore
  step-wise-negation semantics check, inventoryFixtures() cross-check).
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Docker daemon is unavailable in this sandbox (docker version confirms
  client-only) — do not claim a local image build was performed. Report
  the static-test verification level explicitly.
- Attempt a real flyctl deploy to wuce-staging; if successful, verify via
  flyctl ssh console that the fixture files exist in the real container,
  then drive a real turn via the e2e-test-admin identity against
  /ideate or /discovery and confirm fixture text is returned (not an
  empty response). Then re-run
  npx playwright test a3-product-feature-ideate-canvas against real
  staging and report AC3's actual outcome honestly.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- Reference the a3 FINDING in
  artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md and this
  fix's own artefacts in the PR description.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`, and appropriate here because the change touches the production Dockerfile/build pipeline even though narrowly scoped.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped infrastructure bug fix (`cuf-s1`, `scsf-s1`, `pcr-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to fix a real, live-verified deployment defect documented in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s newest FINDING entry and PR #557's description.

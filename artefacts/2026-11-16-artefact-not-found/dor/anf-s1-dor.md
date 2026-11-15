## Definition of Ready: Answer "artefact not found" quickly, and never 503, for a link that cannot name an artefact

**Story reference:** artefacts/2026-11-16-artefact-not-found/stories/anf-s1-artefact-not-found.md
**Test plan reference:** artefacts/2026-11-16-artefact-not-found/test-plans/anf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-artefact-not-found/dor/anf-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Two source files and one new test file; all 8 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (`server.js`, direct attempts, trace resolution, probe list, page text, other routes, negative cache, dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list). T4 drives the real `server.js` route table but asserts only behaviour, so `server.js` stays untouched.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person following a mistyped, truncated or stale artefact link" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3a and T3b, AC4 T4, AC5 T5, AC6 T6, AC7 T7, AC8 live scenario 9 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes a false 503 and a ~6 s wait |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011, ADR-012; records ADR-025 not engaged; path traversal guard strengthened |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced; `setFetcher` already exists |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 9 (live) needs a signed-in production session after deploy |
| W5 | ⚠️ Accepted | A legacy bare-name hit now sends all probe requests at once (at most 24, the same ceiling as today's worst case) instead of stopping at the first hit; slightly more GitHub quota on that rare path in exchange for no 6 s wait |
| W6 | ⚠️ Accepted | The slug allow-list rejects a directory name with a space or other unusual character; none exists today (T3b checks the real directory) and the app's generated links never contain one |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - read-only route, failure-path and not-found path only, no data writes. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-artefact-not-found/stories/anf-s1-artefact-not-found.md
Test plan: artefacts/2026-11-16-artefact-not-found/test-plans/anf-s1-test-plan.md
Contract: artefacts/2026-11-16-artefact-not-found/dor/anf-s1-dor-contract.md
Goal: write tests/check-anf-s1-artefact-not-found.js (T1 to T8) first and confirm T1, T2, T4 and T5 FAIL for the right reason (fetcher called or 503; about 3.6 s) and the rest pass as invariants; then add isPlausibleArtefactRef to routes/artefact.js and make the fallback probes concurrent in adapters/artefact-fetcher.js. No scope beyond the 8 ACs.
Constraints:
- Allow-list validation as written in the story, run after the auth check and before any fetch; same 404 page; never echo the input; never throw.
- Probe order, trace resolution, direct attempts, 3 s probe timeout and the 24-request ceiling unchanged; an earlier non-404 failure than any hit still throws ArtefactFetchError.
- Do not edit server.js. Existing adlr-s1 and cat-s5 tests must pass unchanged.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4, W5 and W6 advisory.

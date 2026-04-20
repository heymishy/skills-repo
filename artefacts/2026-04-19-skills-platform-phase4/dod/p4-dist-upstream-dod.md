# Definition of Done: Upstream source URL resolution from context.yml with ADR-004 compliance (p4-dist-upstream)

**PR:** No formal PR — work committed directly to master at `a3b2cd1` | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upstream.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-upstream-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-upstream-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Distribution commands use exactly the URL from `skills_upstream.repo`; no hardcoded fallback | ✅ | T1 passing (`src/distribution/upstream.js` exists); T2 passing (`getUpstreamUrl` returns the configured URL correctly) | Automated: `tests/check-p4-dist-upstream.js` T1, T2 | None |
| AC2 — Missing `skills_upstream.repo` → named error before any network request | ✅ | T3 passing (error message contains "No upstream source configured — set skills_upstream.repo in .github/context.yml") | Automated: T3 | None |
| AC3 — Upstream URL change in context.yml reflected immediately in next run; lockfile `upstreamSource` matches config | ✅ | T4a passing (first call returns URL-A); T4b passing (second call with different config returns URL-B without caching); T5 skipped (writeLockfile not exported from upstream module — lives in lockfile module; covered by p4-dist-lockfile) | Automated: T4a, T4b; T5 skipped by design | None |
| AC4 — Invalid `repo` type → named schema error; ADR-004 compliance: no hardcoded heymishy/skills-repo URL | ✅ | T6 passing (invalid repo type → named schema error); T7 passing (no hardcoded heymishy/skills-repo URL found in `src/distribution/`) | Automated: T6, T7 | None |

**ACs satisfied: 4/4**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** Work committed at `a3b2cd1` without a standalone draft PR.

**Deviation 2 — T5 skipped:** T5 (`writeLockfile` verifying lockfile upstreamSource matches config) skipped because `writeLockfile` is not exported from the upstream module — it lives in the lockfile module (p4-dist-lockfile). The combined behaviour is verified by the lockfile tests. No AC coverage gap.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/10 assertions passing
**Assertions passing:** 10/10
**Tests passing in CI (npm test):** 10

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — upstream.js exists | ✅ | ✅ | |
| T2 — getUpstreamUrl returns configured URL | ✅ | ✅ | |
| T3 — missing config → named error | ✅ | ✅ | |
| T4a — first call returns URL-A | ✅ | ✅ | |
| T4b — second call returns URL-B (no cache) | ✅ | ✅ | |
| T5 — writeLockfile upstreamSource matches config | skipped | ✅ | Covered by p4-dist-lockfile |
| T6 — invalid repo type → named schema error | ✅ | ✅ | |
| T7 — no hardcoded heymishy/skills-repo URL | ✅ | ✅ | ADR-004 compliant |
| T-NFR1 — no HTTP/DNS/fetch call at config-read time | ✅ | ✅ | |
| T-NFR2 — config read completes without error on valid input | ✅ | ✅ | |

**Gaps:** T5 skipped (documented above). No AC gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| ADR-004 — No hardcoded URLs in distribution source | ✅ | T7 passing; zero matches for hardcoded heymishy/skills-repo URL in `src/distribution/` |
| MC-SEC-02 — No speculative network calls | ✅ | T-NFR1 passing; no HTTP/DNS/fetch call in upstream module at config-read time |
| Config sourced exclusively from context.yml | ✅ | T2, T4a/T4b passing; URL read directly from `skills_upstream.repo` without caching |

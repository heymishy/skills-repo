# Definition of Done: Fall back to Postgres-durable content when the artefact viewer's GitHub fetch 404s

**PR:** #693 (commit `35ea2f23`) | **Merged:** 2026-08-09 (13:30 +1200, per `git log`)
**Story:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/stories/avpf-s1-postgres-fallback-for-artefact-viewer.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- Postgres content rendered when GitHub 404s, same tenant | Yes | `avpf1_postgresFallback_rendersContent_whenGithub404sAndSameTenant`: asserts status 200, rendered heading present, "artefact not found" absent | Automated test (`tests/check-avpf-s1-postgres-fallback.js`) | None |
| AC2 -- GitHub content preferred/unchanged when GitHub has it | Yes | `avpf2_githubContent_preferredAndUnchanged_whenGithubHasIt`: asserts GitHub content returned, Postgres canary content never appears, `pgCalled === false` (fallback never consulted) | Automated test | None |
| AC3 -- 404 unchanged when neither source has content | Yes | `avpf3_notFoundPage_unchanged_whenNeitherSourceHasContent`: asserts 404 + "artefact not found" body | Automated test | None |
| AC4 -- Degrades to 404 (never 500) when Postgres lookup itself fails | Yes | `avpf4_degradesTo404_whenPostgresLookupThrows`: journey-store mock throws `DB connection failed`; asserts handler does not throw, status 404, "artefact not found" body | Automated test | None |
| AC5 -- Cross-tenant content never served | Yes | `avpf5_crossTenant_neverServesOtherTenantsContent`: journey resolves to `tenantId: 't-OTHER'` vs. session `tenantId: 't1'`; asserts 404 and that the other tenant's "SECRET" content never appears in the body | Automated test | None |

Source inspection of `src/web-ui/routes/artefact.js` confirms the implementation matches the story's Architecture Constraints: the Postgres fallback path (lines ~85-94) is wrapped in its own `try`/`catch` distinct from the outer GitHub-fetch handler, and the tenant check (`journey && !(journey.tenantId && journey.tenantId !== tenantId)`) is the same guard shape specified in the story (mirroring `handleDeleteJourney`).

## Scope Deviations

None. The story's four Out of Scope items (resume-session symptom, the separately-routed `/artefacts/<relpath>` viewer, `das-s1`'s no-op write behaviour, deleting the stuck journey) are all explicitly named as deferred/unrelated in the story text itself and are accepted as such, not defects.

## Test Plan Coverage

`tests/check-avpf-s1-postgres-fallback.js`, re-run fresh this session: **15 passed, 0 failed** (5 AC-mapped test cases, each asserting 2-4 conditions -- AC1: 3 assertions, AC2: 4 assertions, AC3: 2 assertions, AC4: 3 assertions, AC5: 3 assertions). All assertions pass. The task brief's supplied result ("null passed, null failed") did not reflect a real run; re-running directly produced the counts above.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | Fallback query only runs on the GitHub-404 path per the implementation structure (AC2's `pgCalled === false` assertion confirms it is not invoked on the common success path) |
| Security | Met | Tenant check enforced per ADR-025 / `mtrr-s1` precedent; AC5 test directly verifies cross-tenant content is never served |
| Accessibility | N/A | Story states no markup/structure change, only content source -- confirmed by inspection, no rendering changes in the diff |
| Audit | Not independently verified | Story states the existing `artefact_read` audit log entry fires unchanged regardless of source; no test in the AC suite asserts this directly, but no code change to the logging call site was found during inspection |

## Metric Signal

No formal benefit-metric artefact exists for this story -- it is explicitly short-track (bug fix), and the story's Benefit Linkage section states the benefit directly rather than referencing a `/benefit-metric` artefact: a live staging defect (journey `new-feature-32ded088` showing "artefact not found" for a genuinely-complete stage) is the confirmed real-world trigger, and the fix closes the last unreached surface of the `alrf-s4` fallback pattern.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

A follow-on commit (`4bf38e2f`, "avpf-s1 confirmed working live") indicates the fix was verified against the actual staging journey that motivated the story, giving direct production confirmation beyond the automated test suite. No incidents or regressions tied to this change have surfaced in the git history since merge.

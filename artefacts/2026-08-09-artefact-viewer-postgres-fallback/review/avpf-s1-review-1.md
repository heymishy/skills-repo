## Review: avpf-s1 — Fall back to Postgres-durable content when the artefact viewer's GitHub fetch 404s

**Story:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/stories/avpf-s1-postgres-fallback-for-artefact-viewer.md
**Reviewer:** Claude (agent), operator-directed — live gap found via direct staging usage
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage names the exact live symptom (journey `new-feature-32ded088`, "Benefit Metric" link 404ing despite the stage showing complete), and traces the defect through two independently-confirmed code paths: `routes/artefact.js`'s GitHub-only fetch, and `das-s1`'s explicit AC4 no-op-on-no-repo behaviour that makes a commit-less "complete" stage a valid, expected state — not an error condition being newly discovered.

### Category B: Scope discipline

PASS. Out of scope explicitly excludes the still-unconfirmed "unable to resume" symptom (with the specific code path checked and no defect found there), a possible second `/artefacts/<relpath>` route that could not be confirmed to exist, `das-s1`'s own no-op behaviour (correct, not being changed), and the unrelated journey-deletion request (already has its own shipped mechanism). Four explicit exclusions, each with a stated reason — well above the "at least one" bar.

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable: AC1 is the core fix, AC2 is an explicit no-regression guard for the already-working path, AC3 guards the genuinely-missing case, AC4 guards the fallback's own failure mode, AC5 is the mandatory tenant-isolation guard. No AC depends on another AC's output — each specifies its own precondition (GitHub has it / doesn't; Postgres has it / doesn't / errors; same tenant / different tenant).

### Category D: Completeness

PASS. NFRs stated across all four categories, with Security correctly elevated given the new cross-tenant read surface this fallback introduces. Complexity rated 2 (reasonable — reusing a proven pattern, but the tenant check is real, not boilerplate). Dependencies section correctly notes no upstream/downstream coupling.

### Category E: Architecture compliance

**MEDIUM-severity path verified clean, not skipped:** the story's own Architecture Constraints already identify the highest-risk element (tenant scoping) and cite the correct precedent (`mtrr-s1`) and the correct existing implementation to mirror (`handleDeleteJourney`'s tenant check). This is exactly the kind of omission that would otherwise surface as a HIGH finding at review time; because the story text already names it with a concrete fix location, no new finding is raised here — but DoR must not treat this as optional polish. It is the load-bearing part of this story's correctness. `routes/artefact.js` will need a new replaceable dependency for `journeyStore` (mirroring its existing `setFetcher`/`setLogger` injectable pattern in the same file) — no violation, this is a direct extension of an established local convention, not a new pattern.

No HIGH findings. No MEDIUM findings requiring further action beyond what DoR's Coding Agent Instructions must make explicit (see DoR artefact).

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped short-track fix with a precisely identified root cause, reusing an already-proven fallback pattern (`alrf-s4`) and an already-proven tenant-check pattern (`handleDeleteJourney`). Cleared to proceed to `/test-plan`.

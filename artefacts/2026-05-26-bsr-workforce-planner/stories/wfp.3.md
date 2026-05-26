## Story: Map workforce to initiatives with direct allocation, FTE delta, and cost inference

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md

## User Story

As a **Head of Engineering**,
I want to link squads and individuals directly to initiative slugs and compute the actual FTE and cost against what was claimed in each initiative's portfolio submission,
So that I can identify over-claimed or under-resourced initiatives in a single invocation before a GM review session, rather than cross-referencing portfolio docs and xlsx files manually.

## Benefit Linkage

**Metric moved:** M1 (Workforce + Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** This story is the core value-delivery story of the feature. `workforce-map` replaces the 2–4 hour manual reconciliation with a single invocation that produces `workforce/initiative-map.json` — the file whose completeness is the M2 measurement vehicle and whose creation time is the M1 measurement point.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`.
- Portfolio files (`portfolio/[slug].json`) are read-only inputs — the skill must never write to, overwrite, or delete these files.
- `workforce/initiative-map.json` is the canonical output file. All downstream consumers (dashboard, wfp.4 extended modes) read from this file.
- The skill reads `workforce/roster.json` and `workforce/cost-model.json` from fixed paths. Path traversal is not permitted — no dynamic path construction from user-supplied input.

## Dependencies

- **Upstream:** wfp.1 (workforce-intake) must be DoD-complete — this story depends on `workforce/roster.json` and the `workforce/cost-model.json` seed file.
- **Downstream:** wfp.4 (workforce-map extended modes) appends profile-match and net-new entries to the initiative-map.json produced by this story. wfp.6 (dashboard allocation matrix) reads initiative-map.json.

## Input Format

`workforce/allocation-input.json` is the operator-supplied file that drives every `workforce-map` run. It must exist before invoking the skill. The file is a JSON object with a single `allocations` array. Each entry represents one initiative and specifies its allocation mode and the inputs for that mode:

```json
{
  "allocations": [
    {
      "slug": "initiative-slug",
      "productGroup": "Product Group Name",
      "allocationMode": "direct",
      "people": ["Person A", "Person B"]
    },
    {
      "slug": "initiative-slug-2",
      "productGroup": "Product Group Name",
      "allocationMode": "profile-match",
      "requiredTags": ["java", "platform", "chapter-lead"]
    },
    {
      "slug": "initiative-slug-3",
      "productGroup": "Product Group Name",
      "allocationMode": "net-new",
      "requiredRole": "Senior Engineer",
      "requiredTags": ["react", "frontend"]
    }
  ]
}
```

Field rules: `slug` (required — must match a portfolio file slug or a warning is issued); `productGroup` (required — used by the dashboard group filter in wfp.7); `allocationMode` (required — one of `"direct"`, `"profile-match"`, `"net-new"`); `people` (required for `direct` — array of person name strings matching roster `name` field); `requiredTags` (required for `profile-match` and `net-new` — array of tag strings); `requiredRole` (required for `net-new` — string matching a role in cost-model.json). An entry may not have `allocationMode: "direct"` and `allocationMode: "profile-match"` simultaneously — use separate entries with the same slug if an initiative needs both.

## Acceptance Criteria

**AC1:** Given `workforce/roster.json` exists, `workforce/cost-model.json` exists, and a `workforce/allocation-input.json` file specifies direct allocation entries (see Input Format section above), when I invoke `workforce-map`, then `workforce/initiative-map.json` is created or updated. Each initiative entry contains: `slug`, `allocationMode: "direct"`, `allocatedPeople` (array of matched person records from roster), `computedFTE` (count of allocated non-retired people), `computedCostPerQuarterNZD` (sum of cost-model.json lookups by person role), `claimedFTE` (read from `portfolio/[slug].json` `people.fte_demand` field if the portfolio file exists, else `null`), `claimedCostNZD` (read from portfolio if present, else `null`), and `fteDelta` (`computedFTE` minus `claimedFTE`, or `null` if claimedFTE is null).

**AC2:** Given an initiative slug in the allocation input has no corresponding `portfolio/[slug].json` file, when I run `workforce-map`, then the skill prints a warning to stderr naming the missing portfolio slug, sets `claimedFTE: null` and `claimedCostNZD: null` for that initiative, and continues processing remaining initiatives without halting.

**AC3:** Given `workforce/cost-model.json` has a role entry with a non-null `quarterlyRateNZD`, when I run `workforce-map` and a person with that role is in the direct allocation, then their quarterly cost contribution is included in `computedCostPerQuarterNZD`. Given a person's role is not present in `cost-model.json`, then their cost contribution is treated as 0 and a warning is printed to stderr naming the unmapped role.

**AC4:** Given an initiative's `fteDelta` is negative (computedFTE < claimedFTE), then the initiative entry in `initiative-map.json` includes `gap: true`. Given `fteDelta` is zero or positive, then `gap` is `false` or absent.

**AC5:** Given a person named in the allocation input does not match any record in `workforce/roster.json` (by name), then the skill prints a warning naming the unmatched person, excludes them from the FTE count, and continues. The initiative entry is still written with the remaining matched people.

**AC6:** Given I run `workforce-map` twice with the same input, then the second run overwrites the first `initiative-map.json` cleanly (idempotent). The output file is not appended to on repeated runs.

## Out of Scope

- Profile-match and net-new gap allocation modes — covered in wfp.4.
- Dashboard rendering of reconciliation results — covered in wfp.5/wfp.6/wfp.7.
- Writing back to or modifying any `portfolio/[slug].json` file — portfolio files are read-only per discovery constraints.
- Partial allocation (e.g. person allocated at 0.5 FTE) — Phase 1 treats each person as 1 FTE. Fractional allocation is a Phase 2 consideration.
- Multi-period modelling (future or past FTE projections) — all computations are current-state only.

## NFRs

- **Performance:** `workforce-map` completes for 200 people across 20 initiatives in under 15 seconds.
- **Security:** No PII is written to stdout or logs beyond names that are already in the allocation input. `initiative-map.json` is committed to the private repo — this is the accepted PII posture from discovery.
- **Integrity:** If `initiative-map.json` cannot be written (e.g. disk error), the skill exits with a non-zero code and does not leave a partially-written file.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

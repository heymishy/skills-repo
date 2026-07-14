# Definition of Ready: Automated cross-tenant repo isolation E2E spec (prc-s4.3)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.3.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.3-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s4.3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## ⚠️ Read this first

This story's test data strategy named a real dependency at `/test-plan` time (2026-07-14): two disposable GitHub test repos, one per test tenant. `decisions.md`'s ASSUMPTION entry for this gap set an explicit revisit trigger — "resolve before `/definition-of-ready`... either provision test repos, or explicitly RISK-ACCEPT deferring." As of this run, those repos are not provisioned (they're part of the operator's separately-tracked infra work, not yet done). The artefact itself — story, test plan, verification script — is complete and internally consistent; every individual hard block below passes. But per the same pattern already established for `bri-s3.3` earlier in this epic's history, an artefact being well-formed and a story being **assignable for implementation** are different questions. This story is **BLOCKED**, not READY, on that basis alone.

---

## Contract review

✅ **Contract review passed** — the contract accurately reflects the current blocked state, doesn't overstate readiness.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 2 E2E + 1 config check |
| H4 | Out-of-scope populated | ✅ | Load/performance testing |
| H5 | Benefit linkage names a metric | ✅ | Metric 3 — this story IS the metric's measurement mechanism |
| H6 | Complexity rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0/0/0 |
| H8 | No uncovered ACs | ✅ | All 3 covered; the only gap is test-data availability, not test coverage design |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.3, prc-s2.3, prc-s2.4, prc-s3.1 |
| H9 | Architecture Constraints populated | ✅ | Matches `bri-s3.4`'s pattern; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A — this E2E spec is about data isolation, not layout; no trigger |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | Test spec, not new production code |
| H-INF | Infra-plan gate | N/A | `hasInfraTrack` not formally set — though this story does have a real external-provisioning dependency, it wasn't scoped through the formal `/infra-plan` track. Noted, not treated as a technicality to route around. |
| H-MIG | Migration-review gate | N/A | |

**All individual hard blocks pass** — this is the same pattern `bri-s3.3` established: the artefact itself is sound, the block is an external-dependency gate, not a defect in what was written.

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W3 | Pass cleanly | ✅ | N/A |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |
| W5 | No unaddressed UNCERTAIN gaps | ✅ | The GitHub-repo gap is explicitly typed and reasoned (see below), not left uncertain |

---

## Oversight level

**Medium** (per `epic-4-product-crud-and-isolation.md`) — moot pending unblock.

---

## Standards injection

No `domain` field — skipped.

---

## READY / BLOCKED determination

## ❌ BLOCKED — pending provisioning of 2 disposable GitHub test repos

This determination is not a hard-block failure in the H1–H-MIG checklist sense — every individual check passes. The BLOCKED status reflects the test plan's own named external dependency (`decisions.md`, 2026-07-14 ASSUMPTION entry) not yet being resolved.

**What this means in practice:**
- The story, test plan, and verification script are complete and internally consistent — no rework needed on the artefacts to reach this state.
- The story is **not ready to be assigned to a coding agent for full implementation** — there is nothing to run the E2E spec against without real test repos.
- **Resolution path:** once the operator provisions 2 disposable GitHub repos (tracked alongside the Fly/Neon/Upstash/PostHog infra work), re-run `/definition-of-ready` on `prc-s4.3` to re-issue a Coding Agent Instructions block with `Proceed: Yes`.

---

## Coding Agent Instructions

Per this DoR run's explicit guidance for `prc-s4.3`: this block is produced (not omitted) so the blocking condition is unambiguous and machine-readable, but `Proceed` is set to `No`.

```
## Coding Agent Instructions

Proceed: No — blocked pending provisioning of 2 disposable GitHub test repos
Story: Automated cross-tenant repo isolation E2E spec — artefacts/2026-07-14-product-repo-config/stories/prc-s4.3.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.3-test-plan.md

Do NOT assign this story for implementation until 2 disposable GitHub repos
exist for the 2 test tenants this spec needs. Depends on prc-s1.3, prc-s2.3,
prc-s2.4, prc-s3.1 being signed-off/merged first regardless
(schemaDepends: dorStatus) -- both conditions must clear.

Full re-dispatch instruction: once the test repos are provisioned, re-run
/definition-of-ready on prc-s4.3 before any implementation begins.

Oversight level: Medium (applies once unblocked)
```

---

## Sign-off

**Oversight level:** Medium (moot pending unblock)
**Sign-off required:** No formal sign-off required for the BLOCKED determination itself
**Signed off by:** Not applicable — story is BLOCKED, not assigned

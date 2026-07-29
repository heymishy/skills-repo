## Test Plan: Auto-confirm real-staging E2E specs immediately after every master deploy

**Story reference:** artefacts/2026-07-29-post-merge-e2e-confirmation/stories/pmec-s1-post-merge-e2e-confirmation-job.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New job exists with needs: deploy-staging | 1 | — | — | — | — | 🟢 |
| AC2 | New job runs the same Scenario A/B specs behind the same flags | 1 | — | — | — | — | 🟢 |
| AC3 | promote-to-prod's needs: is unchanged (still only smoke-test) | 1 | — | — | — | — | 🟢 |
| AC4 | New job structurally cannot block promote-to-prod | 1 | — | — | — | — | 🟢 |
| AC5 | Standards doc covers all 4 required points | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

**One genuine, permanent gap, documented rather than silently accepted:** whether the new job actually catches a real "endpoint not yet live" failure in practice can only be confirmed the next time a story in this exact shape ships (a new staging-safe endpoint + a same-PR real-staging spec of it) — there is no way to manufacture that scenario synthetically without a real not-yet-deployed endpoint. This test plan verifies the job is structurally correct (right dependency, right specs, right flags, non-blocking) via static YAML analysis; the first real end-to-end confirmation of the job's value happens organically on the next qualifying story.

---

## Test Data Strategy

**Source:** The real workflow files (`.github/workflows/staging-deploy.yml`, `.github/workflows/e2e.yml`) and the new standards doc — static text/YAML analysis, no synthetic data needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC4 | The real, current content of both workflow files | Repo files | None | |
| AC5 | The real, current content of the new standards doc | Repo files | None | |

### Gaps

None beyond the one documented above.

---

## Unit Tests

### U1 — New job exists, depends on deploy-staging (AC1)

- **Verifies:** AC1
- **Precondition:** `.github/workflows/staging-deploy.yml` as shipped by this story
- **Action:** Parse the YAML, locate the new job (e.g. `post-deploy-e2e-confirm`)
- **Expected result:** Job exists and declares `needs: deploy-staging`
- **Edge case:** No

### U2 — New job runs the same specs behind the same flags as Scenario A/B (AC2)

- **Verifies:** AC2
- **Precondition:** Both workflow files as shipped
- **Action:** Extract the Scenario A/B spec file lists and flag names from `e2e.yml`; extract the new job's spec file list and flag names from `staging-deploy.yml`
- **Expected result:** The new job's Scenario A spec list matches `scenario-a-staging-e2e`'s spec list exactly, gated by `audit.staging_e2e_scenario_a`; same for Scenario B and `audit.staging_e2e_scenario_b`
- **Edge case:** Yes — catches spec-list drift if either job's list changes independently in the future

### U3 — promote-to-prod's needs: is unchanged (AC3)

- **Verifies:** AC3
- **Precondition:** `staging-deploy.yml` as shipped
- **Action:** Parse the `promote-to-prod` job's `needs:` field
- **Expected result:** `needs:` names only `smoke-test` — the new job is not present
- **Edge case:** Yes — the "don't accidentally gate release on this" check

### U4 — New job cannot block promote-to-prod (AC4)

- **Verifies:** AC4
- **Precondition:** `staging-deploy.yml` as shipped
- **Action:** Confirm (a) no job has a `needs:` edge that includes the new job's id, and (b) the new job's own steps have no side effect that could fail a different job
- **Expected result:** No job depends on the new job; it is a structural leaf with no downstream dependents
- **Edge case:** No

### U5 — Standards doc covers all 4 required points (AC5)

- **Verifies:** AC5
- **Precondition:** New standards doc as shipped
- **Action:** Read the doc content
- **Expected result:** Contains identifiable sections/text covering: (a) why the gap happens, (b) how to recognise it in CI output, (c) the manual workaround, (d) a pointer to the new automated job
- **Edge case:** No

---

## Integration Tests

None beyond the unit tests above — no live integration seam to test locally; the real proof of value is the next qualifying PR in this shape (see Coverage gaps).

---

## NFR Tests

None — no new NFRs beyond what's already covered by the story's own NFR section.

---

## Out of Scope for This Test Plan

- Proving the new job actually catches a real "not yet deployed" failure in practice (see Coverage gaps) — not synthetically testable, confirmed organically on the next qualifying story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot synthetically prove the job catches a real bootstrapping-gap failure | Would require a genuine not-yet-deployed endpoint to reproduce, which cannot be manufactured in a static test | Static YAML verification (this test plan) plus organic confirmation the next time a story in this shape ships |

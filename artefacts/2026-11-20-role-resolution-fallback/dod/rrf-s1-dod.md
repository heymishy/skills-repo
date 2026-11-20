# rrf-s1 Definition of Done

Date: 2026-11-20. Story: a person with no membership in a tenant gets the lowest role, not another member's role. Pull request #1167 merged 2026-11-20 (`357181141`). No issue.

## Result: COMPLETE in code and staging. Production promotion of this deploy is the operator's to approve.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | a known person with no membership in a tenant whose only member is an admin resolves to `user`, and no membership row is written. Evidence: T1 in `tests/check-rrf-s1-no-membership-gets-user-role.js` (red first: it returned `admin`) | automated | none |
| AC2 | ✅ | an admin, an engineer and a viewer in one tenant each resolve to their own role, in two row orders. Evidence: T2 | automated | none |
| AC3 | ✅ | an identity with no person row, in a tenant that has members, resolves to `user` and creates no row. Evidence: T3 (red first: it returned `admin`) | automated | none |
| AC4 | ✅ | the first person in a new tenant, holding the admin membership the bootstrap writes, resolves to `admin`; a second new person resolves to `user`. Evidence: T4 (its second assertion was red first) | automated | none |
| AC5 | ✅ | `bri-s3.3` then `bri-s3.6` on one server, the order that failed before: `bri-s3.6` AC1 passes with neither spec changed. Evidence: local run 9 of 9 passed; and in CI the full E2E run on the pull request (run 44685372791) reports all four `bri-s3.6` tests as expected, where all six earlier recorded runs failed AC1; the suite's failure count went from 17 to 16 | automated (existing spec) | none |
| AC6 | ✅ | the nine existing role tests (`tir-s1`, `s5`, `s6`, `s7`, `s9`, `rtri-s4`, `tab-s2`, `tab-s3`, `sec-perf-s2`) pass unchanged, and so do 76 role, team, admin and auth test files run individually. None pinned the old fallback, so no existing test was edited | automated | none |
| AC7 | ✅ | the production aggregate was run read-only and recorded below | manual (production evidence) | none |

Red first: before the change the new test had 1 passed and 4 failed (T1, T3, T4's second assertion and T5, the guard that `resolveRoleForPerson` no longer calls `resolveRoleForTenant`); after, 5 passed. Only `src/web-ui/modules/user-roles.js` changed in `src/`.

## AC7 evidence: the production count

Run 2026-11-20 with the operator's go-ahead ("Yes"), as one read-only transaction on the production database, rolled back, counts only. Nothing was written and no names or identifiers were read.

| Measure | Result |
|---|---|
| People with a `person_identities` row and no `team_memberships` row | 0 |
| Memberships in total | 1 |
| Tenants with any membership | 1 |
| Tenants with 2 or more memberships | 0 |
| Admin memberships | 1 |

- **Reading:** nobody had been given another member's role through the fallback: no person who ever signed in lacked a membership, and there is only one member. The defect was latent. `TENANT_ORG_ALLOWLIST` is set in production (secret name only; the value was not read), so the next person from the allowlisted organisation to sign in would have been handed that one admin's role. After this change that person resolves to `user`.
- **Not established:** how many people belong to the allowlisted organisation. If more than one, each of them would have been affected on first sign-in; that is now prevented.

## Observations and follow-ups

- **Behaviour change, as warned (DoR W1, W2):** a person with no membership now resolves to `user`, and their first login goes to `/welcome`. An admin must grant any higher role.
- **Not decided:** whether a membership row should be written at first sign-in for people in the allowlisted organisation. Left to the operator; it would be a separate story.
- **Production:** this change is on staging; the production promotion waits for the operator's approval, as for any deploy.
- **The access method for the production check** was a read-only script run on the production machine through `flyctl ssh console`, wrapped in a read-only transaction. Worth knowing for any later read-only check; a deliberate decision each time.
- **Remaining E2E failures:** 16 in the last CI run. The selector-hygiene group (`ep1-s3`, `frsr-s1`, `jcx-s6`, `ep1-s4`, `fpux.1`) and test isolation remain open in `reference/e2e-failing-specs-triage-2026-11-20.md`.

## Scope Deviations

- None.

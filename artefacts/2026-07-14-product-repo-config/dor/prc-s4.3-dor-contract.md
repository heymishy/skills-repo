# DoR Contract Proposal: Automated cross-tenant repo isolation E2E spec

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.3.md

## What will be built

`tests/e2e/prc-s4.3-cross-tenant-repo-isolation-journey.spec.js` — a Playwright E2E spec exercising all 4 write paths (sign-off, annotation, artefact write, standards edit) across 2 real tenants with 2 real repos, proving zero cross-contamination, plus an adversarial manipulated-product-ID test. Added to CI as a required, zero-tolerance check matching `bri-s3.4`'s existing pattern.

## What will NOT be built

Load/performance testing of concurrent cross-tenant writes.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 2 real tenants, 4 write actions each, assert commit histories don't cross | E2E |
| AC2 | Manipulated product ID, assert rejection before any write | E2E |
| AC3 | CI workflow config inspection, assert required-check status | Config check |

## Assumptions

Requires 2 real, disposable GitHub repos for the 2 test tenants — **not yet provisioned as of this DoR run.**

## Estimated touch points

Files: `tests/e2e/prc-s4.3-cross-tenant-repo-isolation-journey.spec.js`, CI workflow config
Services: 2 real (test) GitHub repos, 2 real (test) tenants
APIs: All 4 write-path APIs already built by `prc-s1.3`, `prc-s2.3`, `prc-s2.4`, `prc-s3.1`

# DoR Contract Proposal: Prove the walking skeleton end-to-end with a real commit

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.4.md

## What will be built

No production code. A manual verification pass: connect a real (disposable) test product to a real GitHub repo, perform a real sign-off through the actual web UI, confirm the resulting commit's content and authorship, then record this as Metric 1's first real baseline in `benefit-metric.md`'s coverage matrix.

## What will NOT be built

Any automated regression test — that's `prc-s4.3`'s job, with broader scope across all 4 write paths.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real web UI action, inspect real commit | Manual |
| AC2 | Compare committed file content byte-for-byte against what was submitted | Manual |
| AC3 | Update `benefit-metric.md`'s coverage matrix with the result | Manual |

## Assumptions

Per `/review` finding 1-M1 (RISK-ACCEPTed at this DoR run — see `decisions.md`), the specific environment (which real repo, which wuce deployment) is not pinned down in advance; the operator will choose a disposable test repo/product at execution time and record a cleanup step.

## Estimated touch points

Files: `artefacts/2026-07-14-product-repo-config/benefit-metric.md` (coverage matrix update only)
Services: A real GitHub repo, a running wuce instance
APIs: None new — exercises `prc-s1.1`–`prc-s1.3`'s already-built mechanism

# Verification script: ciw-s2 (Fleet and Pages workflows deprecated)

Steps 1 to 5 are covered by `node tests/check-ciw-s2-deprecated-workflows.js`, `node tests/check-dviz2-pages-workflow.js` and the full suite; step 6 needs the Actions list after merge.

1. T1: `fleet-aggregation.yml` has only a manual trigger and a DEPRECATED header.
2. T2: `pages.yml` has only a manual trigger and a DEPRECATED header explaining Pages is not enabled.
3. T3: `dashboards/README.md` opens with the DEPRECATED banner.
4. T4: no tabs, same jobs, same `uses:` lines, same secret references.
5. Existing tests and the full suite: `check-dviz2-pages-workflow` passes with T3 and T4 changed; `check-fleet-aggregation` and the dashboard tests unchanged and passing.
6. **Live (after merge):** push anything to master and wait past the next hour: the Actions list shows no new "Fleet Aggregation" and no new "Deploy dashboards to GitHub Pages" run.

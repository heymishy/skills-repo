# Contract Proposal - Send the environment-specific fingerprint as a string

**What will be built:**
- `src/web-ui/modules/error-capture.js`: the fingerprint line becomes `out.$exception_fingerprint = [fpEnv, code, out.route].join('|');` (fpEnv computed as before); the comment states PostHog requires a string.
- `tests/check-coha-s5-error-capture.js`: pes_UT1 to UT4 and pes_IT1 edited to expect the string; new pes_UT5.

**What will NOT be built:** no change to bridge, workflow, destination, secrets, deploy, any other scrubber rule.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | pes_UT1, pes_UT5 | unit |
| AC2 | pes_UT2 | unit |
| AC3 | pes_UT3, pes_UT4, pes_IT1 | unit and integration-real-code |
| AC4 | Scenario 4: PostHog query after staging deploy | live |
| AC5 | Scenario 5: known login error on production, with approval | live |

**Assumptions:** PostHog accepts a string `$exception_fingerprint` (its reference says String; AC4 proves it); allow-listed codes and the route pattern contain no `|`.

`schemaDepends: []`.

**Estimated touch points:** Files: `src/web-ui/modules/error-capture.js` (1 line plus comment), `tests/check-coha-s5-error-capture.js`. Services: none. APIs: none.
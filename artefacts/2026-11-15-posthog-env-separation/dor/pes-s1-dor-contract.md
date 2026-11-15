# Contract Proposal - Give every captured error an environment-specific fingerprint

**What will be built:**
- `src/web-ui/modules/error-capture.js`: in `scrubEvent`, after `out.environment`, set `out.$exception_fingerprint = [fpEnv, code, out.route]` where `fpEnv` is `environment` when it is exactly `staging` or `production`, otherwise `unknown`; add `$exception_fingerprint` to `KEPT_KEYS`; update the comment about never copying the incoming fingerprint to say the incoming value is still ignored and the scrubber builds its own from fixed values.
- `tests/check-coha-s5-error-capture.js`: tests UT1 to UT4 and IT1 from the test plan; the sorted key list in `scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId` gains `$exception_fingerprint`.

**What will NOT be built:**
- No change to the bridge, coha-s7, the PostHog destination, Fly secrets, or any second PostHog project.
- No other scrubber rule, no reopened-trigger work, no deploy.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1, UT4 | unit |
| AC2 | UT2 | unit |
| AC3 | UT3 and the unchanged canary tests | unit |
| AC4 | IT1 | integration-real-code |
| AC5 | Verification scenario 5 (PostHog query after staging deploy) | live |
| AC6 | Verification scenario 6 (known login error on production, with approval) | live |

**Assumptions:** PostHog applies a client `$exception_fingerprint` array as documented (checked by AC5); `environment` reaches the scrubber only from the app's own config (`initErrorCapture(envName, ...)`); the existing 83 tests pass with only the named key-list edits.

`schemaDepends: []` - reads no `pipeline-state.json` field.

**Estimated touch points:**
Files: `src/web-ui/modules/error-capture.js` (modified, a few lines), `tests/check-coha-s5-error-capture.js` (modified)
Services: None (staging and production PostHog only for the live checks)
APIs: None
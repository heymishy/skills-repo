# AC Verification Script: string fingerprint

**Story:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s2-string-fingerprint.md

## Setup
Scenarios 1 to 3: terminal in the project folder, run `node tests/check-coha-s5-error-capture.js` (one line per check; the failure count must be 0). Scenarios 4 and 5 need the change merged and deployed and PostHog project 10908 (or ask the agent to run the queries).

### Scenario 1: the fingerprint is one string of three fixed parts (AC1, AC3)
Find the lines starting `pes_UT1`, `pes_UT4` and `pes_UT5`. **Expected:** pass; production gives `production|code|route`, an odd environment gives `unknown|...`, always exactly two separators. **Result:** [ ] Pass [ ] Fail

### Scenario 2: staging and production never share a fingerprint (AC2)
Find `pes_UT2`. **Expected:** pass. **Result:** [ ] Pass [ ] Fail

### Scenario 3: private text cannot reach it, and the real app sends a string (AC3)
Find `pes_UT3` and `pes_IT1`. **Expected:** pass; planted secret words never appear; one event reaches the pretend PostHog with the string. **Result:** [ ] Pass [ ] Fail

### Scenario 4: PostHog accepts the staging events and gives them a new issue (AC4)
After the staging deploy, ask the agent for the PostHog query on new staging errors. **Expected:** no rejection message, an issue id different from 01a1dd12-795d-7763-827f-9a246fad8d00, a new issue listed. **Broken looks like:** a message in the cymbal-errors field. **Result:** [ ] Pass [ ] Fail

### Scenario 5: a production error alerts (AC5, after production promotion, with the operator's approval)
The operator repeats the known login error once on production. **Expected:** a new production issue, one GitHub issue labelled `production-error`, one record pull request (the operator closes it if it is a test). **Result:** [ ] Pass [ ] Fail [ ] Waiting for a real error
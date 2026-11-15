# AC Verification Script: environment-specific error fingerprint

**Story:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md

## Setup
Scenarios 1 to 4: open a terminal in the project folder and run `node tests/check-coha-s5-error-capture.js`; it prints one line per check and a total (the failure count must be 0). Scenarios 5 and 6 need the change merged and deployed, and PostHog project 10908 (or ask the agent to run the queries).

### Scenario 1: the fingerprint is built from three fixed values (AC1)
**Steps:** run the file; find the lines about the production fingerprint and the unexpected environment values.
**Expected outcome:** pass. Production gives `production`, the error code and the route pattern; an odd or empty environment gives `unknown`.
**Result:** [ ] Pass  [ ] Fail

### Scenario 2: staging and production can never share an issue (AC2)
**Steps:** find the line about the two environments.
**Expected outcome:** pass; the two fingerprints differ.
**Result:** [ ] Pass  [ ] Fail

### Scenario 3: private text cannot reach the fingerprint (AC3)
**Steps:** find the leak-check line and the existing leak lines.
**Expected outcome:** all pass; made-up secret words planted everywhere never appear, and a fingerprint supplied by the caller is ignored.
**Result:** [ ] Pass  [ ] Fail

### Scenario 4: the real app sends it (AC4)
**Steps:** find the line about a request that throws through the real app.
**Expected outcome:** pass; one event, status 500, fingerprint matches the event's own environment, code and route.
**Result:** [ ] Pass  [ ] Fail

### Scenario 5: staging gets its own issue (AC5, after merge and staging deploy)
**Steps:** after the staging deploy, ask the agent to query PostHog for new staging `$exception` events and the Error tracking list.
**Expected outcome:** new events have no rejection message; their issue id is not 01a1dd12-795d-7763-827f-9a246fad8d00; a new issue is listed.
**Broken behaviour looks like:** new events still carry the old issue id (PostHog ignored the fingerprint).
**Result:** [ ] Pass  [ ] Fail

### Scenario 6: a production error alerts (AC6, after production promotion, needs the operator's approval)
**Steps:** the operator repeats the known login error once on production; the agent watches PostHog, the bridge log, GitHub issues and pull requests.
**Expected outcome:** a new production issue appears; one GitHub issue opens with the label `production-error`; one record pull request appears (the operator closes it if it is a test).
**Result:** [ ] Pass  [ ] Fail  [ ] Waiting for a real error
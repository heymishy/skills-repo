# Review Report: Production error capture to PostHog with tenant text scrubbed — Run 1

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Story slug:** coha-s5
**Date:** 2026-11-13
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance / F, G, H — N/A (no journey.js, skills.js or journeys.js test file in scope)
**Outcome:** FAIL

Facts checked against the code before reviewing: the warn call at `src/web-ui/routes/auth.js:131` (`_logger.warn('tenant_admin_bootstrap_failed', { tenantId, reason: err.message })`) and the `console.warn` at `src/web-ui/routes/auth-email.js:91` exist as the story says; `createApp()` with the single `.catch` is at `src/web-ui/server.js:5228`; the `posthog-node` client is created in `src/web-ui/modules/posthog-config.js:109` with only a `host` option. The story's code references are accurate.

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C — AC quality (privacy rule is not specified, so AC3 cannot prove it). AC3 reads "Given an error message contains tenant text (a fixture tenant name), When the event is sent, Then the outgoing payload contains the fixture text in no field". The story never says how the scrubber recognises tenant text. The proof of concept used a regular expression matching the fixture string, which would pass this AC while real tenant names, emails, or database error text (the warn call at `auth.js:131` sends `reason: err.message`) pass straight through. A deny-list tested against one fixture is not evidence of privacy.
  Fix: state the rule in the story. The safer rule is an allow-list: the outgoing message is the error class plus a fixed code, and free-text messages are dropped unless the message matches a short allow-list; extra properties (`tenantId`, `reason`) are dropped or hashed. Rewrite AC3 to require at least three differently shaped fixtures (a tenant name, an email address, a database error string containing an identifier) and one unknown shape, and assert none appears in any outgoing field.

- **[1-H2]** D — Completeness (known repo rule not covered by any AC or constraint). `posthog-server.js` and `posthog-config.js` both suppress synthetic traffic with an `e2e-test-` identity (the paes-s1 and paes-s2 rule: "synthetic E2E/test traffic must never reach the real PostHog project"), and staging and production use separate project keys (bri-s1.2). The story adds autocapture and a new capture call that bypass those wrappers. Nothing says staging errors stay out of the production project or that E2E test traffic is suppressed, so the first E2E run that throws would create a production issue.
  Fix: add a constraint naming paes-s1 and bri-s1.2 and an AC: Given a request whose identity is `e2e-test-`, or an app running with the staging key, When an error is thrown, Then no event reaches the production project. Also add: Given `POSTHOG_KEY` is unset, Then capture is a no-op and the request path is unchanged.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** B — Scope. The discovery's out-of-scope list says "no new observability vendor or instrumentation layer" and that "`flyctl logs` plus existing PostHog analytics are sufficient inputs", and the epic goal still promises "a matched error pattern in Fly.io production logs". The story adds exception autocapture and a scrub hook. PostHog is not a new vendor, but the instrumentation line is arguable and the stated premise (flyctl logs suffice) was disproved by the spike. The `decisions.md` entry is the approved scope note, but the story does not cite it and the discovery and epic text were not updated.
  Risk if proceeding: a later reader sees a story that contradicts its own discovery with no pointer to why.
  To acknowledge: cite the 2026-11-13 decisions.md entry in the story's header and amend the discovery assumption and epic goal, or run /decisions RISK-ACCEPT.

- **[1-M2]** A — Traceability. Metric 4 in `benefit-metric.md` defines measurement as "time between a defect appearing in Fly.io logs and the bounded scan surfacing it", and the Metric Coverage Matrix lists only coha-s4. The story's benefit linkage redefines the measurement as "time between the error and PostHog holding a grouped issue". Also, this story alone surfaces nothing to a person: PostHog holding an issue is not detection until coha-s6 opens a GitHub issue or an alert fires.
  Risk if proceeding: the metric appears to move on merge while no human is told.
  To acknowledge: revise Metric 4's measurement method and the matrix (coha-s4 replaced by coha-s5 and coha-s6), and state in the linkage that the metric only moves once coha-s6 ships.

- **[1-M3]** E — Architecture compliance (wiring path unspecified). The story says it reuses the client in `posthog-config.js`, but that client is created inside `initPostHogFlagsClient` for feature flags and is not exposed to `createApp()`'s catch block. The story does not say how the catch block reaches the client, so whether the Injectable adapter rule (D37: throwing stub default, an AC for production wiring in `server.js`, a separate wiring task, a behavioural wiring test) applies is unresolved. It also changes the constructor options of a client the feature-flag path depends on, and the existing bri-s1.2 test injects a fake constructor.
  Risk if proceeding: either a silent no-op stub (D37's failure mode) or a regression in feature-flag evaluation.
  To acknowledge: decide in the story whether capture uses the shared client or a second dedicated client, name the access mechanism, and add the wiring AC if an adapter is involved.

- **[1-M4]** C — AC quality (NFRs without ACs, one vague AC). The Performance NFR ("a PostHog outage must not slow or fail a request", "`shutdown()` runs in the existing shutdown path") has no AC, so nothing tests it. AC4 says an event "with a fixed code for `tenant_admin_bootstrap_failed`" is captured without defining the code or the event's shape.
  Risk if proceeding: the most likely production failure of a monitoring change, the monitor breaking the app, is untested.
  To acknowledge: add an AC where the capture endpoint is unreachable or slow and the request still completes within a bound; define the fixed code and event name in AC4.

---

## LOW findings — note for retrospective

- **[1-L1]** C — AC2 is phrased around the app's internals ("even though the process's own handler only logs it"); restate as observable behaviour (an unhandled rejection produces a captured event).
- **[1-L2]** D — Architecture Constraints leaves a decision open ("this story decides whether to switch those two call sites to the SDK client"). Decide it, or move it to Out of Scope with a follow-up note.
- **[1-L3]** E — No repo-level ADR is cited (ADR-011 artefact-first applies, since a new capture module would be added under `src/`).

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS (1-M2 addressable without rework) |
| Scope integrity | 3 | PASS (1-M1 addressable by a scope note) |
| AC quality | 2 | FAIL (1-H1: AC3 cannot prove the privacy rule; 1-M4: NFR with no AC) |
| Completeness | 2 | FAIL (1-H2: paes-s1 and bri-s1.2 rules missing) |

## Summary

2 HIGH, 4 MEDIUM, 3 LOW across 1 story.
**Outcome:** FAIL — two HIGH findings (the privacy rule is unspecified, and the existing rule that test traffic never reaches the real PostHog project is not covered) must be resolved before /test-plan.

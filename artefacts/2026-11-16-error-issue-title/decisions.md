# Decisions: error issue title says what failed and where

**2026-11-16 | FINDING | The title is the exception value, and the scrubber makes that value the bare code**
**Evidence:** issues #1108 and #1109 were both titled `request_error`; #1110 `unhandled_exception`. The live PostHog destination "coha-s6: error alert to bridge (production, LIVE)" sends `code: {event.properties.$exception_values[1]}`, and `error-bridge.js` uses that as the GitHub title. `scrubEvent` sets each exception value to the code unless it is an allow-listed fixed message. The route and type are already scrubbed fields in the same function.

**2026-11-16 | ARCH | Put type and route in the exception value, not in the webhook**
**Context:** the title needed the route and type; the destination template and the bridge are separate systems.
**Decision:** build the value as `<code>: <Type> at <route>` in the scrubber. No change to the PostHog destination (an operator-owned external setting) or the bridge.
**Rationale:** a code-only change that is testable, reversible, keeps the grouping fingerprint untouched, and also improves the issue name shown inside PostHog. Everything in the value is already scrubbed fixed vocabulary, so the public GitHub title leaks nothing new.
**Accepted cost:** the title format is now partly defined by the scrubber; changing the destination's field later would need both sides to agree.

**2026-11-16 | FINDING | ecg-s1's codes `http_5xx` and `unhandled_rejection` were being rewritten to `unhandled_exception`**
**Evidence:** `ALLOWED_CODES` in `error-capture.js` holds the allow-listed messages plus `request_error` and `unhandled_exception` only; `scrubEvent` rewrites any other code. ecg-s1 added the two codes without extending the list, so its safety-net reports lost their identity (seen in PostHog: code `unhandled_exception` for the commit result page and the artefact route).
**Decision:** add both to the allow-list in this story. Cost: one new issue per affected route the next time it recurs.

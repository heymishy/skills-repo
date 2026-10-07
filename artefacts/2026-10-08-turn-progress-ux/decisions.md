# Decisions: Turn progress UX (turn-progress-ux)

## D1: Add `inFlight: true` as a new field on the existing in-flight-guard SSE error event, rather than a new event type

**Date:** 2026-10-08
**Context:** The client needs to distinguish the `tsdg-s1` in-flight guard's error (recoverable — the original attempt is almost certainly still running) from any other `evt.error` (not recoverable the same way) to decide whether to quietly retry or show the existing red message.
**Decision:** Add a new boolean field `inFlight: true` alongside the existing `error` string on the same SSE JSON payload (`src/web-ui/routes/skills.js`, in-flight guard write), instead of introducing a separate event name (e.g. `evt.inFlightWait`).
**Rationale:** Purely additive — any older or unrelated client code that only checks `evt.error` continues to work unchanged. A new event name would require every `evt.error`-checking branch to also check for the new name, with no corresponding benefit; a boolean flag on the same payload is the smaller, lower-risk signal-contract change and matches how `evt.resumed`/`evt.truncated` already extend the `evt.done` payload in this same file.

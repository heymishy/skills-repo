# Decisions: retire the /answer route

**2026-11-16 | FINDING | The legacy answer route has always answered 500, and one production request opened issue #1121**
**Evidence:** 20 of 20 staging POSTs and one production POST to `/api/skills/<skill>/sessions/<id>/answer` answered 500 "Adapter not wired: submitAnswer" (`server.js` never calls `setSubmitAnswer`); the production request produced a resolved PostHog exception, GitHub issue #1121 and incident PR #1122 within 13 seconds. The only caller is the chat page's no-JavaScript fallback form; the real page submits through `/turn` and `/turn-stream`.

**2026-11-16 | DECISION | Operator: retire the route (410 Gone) rather than wire or remove it**
**Context:** the agent first proposed wiring `submitAnswer`, then found that `/answer` has none of `/turn`'s safeguards (no credits check or deduction, no journey-owner check, no turn lock, no tvl-s1 validation); wiring the legacy flow to the model would have created a paid-model path that bypasses them. Three options were put to the operator.
**Decision:** retire it at the route table: after `authGuard` the route answers a 410 page and never calls the legacy handler. The legacy handler, adapter and question page stay (with their tests) for a later cleanup story if wanted.
**Rationale:** smallest change that removes the 5xx and the bypass risk; nothing a user could ever have used is lost; no existing test changes.
**Accepted cost:** dead code remains until a cleanup story; the chat page's fallback form still points at a retired route.

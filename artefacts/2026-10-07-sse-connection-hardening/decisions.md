# Decisions: SSE connection hardening

## Short-track exemption (2026-10-07)

**Context:** Following a dedicated investigation into recurring SSE disconnects this session (6 incidents, 5.1s-51.8s spread, no single platform timeout fits), the operator confirmed a UniFi gateway setup — matching Ubiquiti's own documented community bug for misclassified "unacknowledged" long-held connections. The operator asked for defensive hardening.
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`), per CLAUDE.md's own short-track path — a small, mechanical header/interval change across 3 existing handlers, not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent for a real, narrowly-scoped gap found mid-session, fixed via the governed short-track path.
**Made by:** Hamish King (operator decision, "Hardening please"), recorded by Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.

## Scope decision: mitigation, not a claimed fix (2026-10-07)

**Context:** The disconnect's own root cause is not fully confirmed to be within this codebase's control — the strongest evidence points at the operator's own UniFi gateway firmware, which this codebase cannot change.
**Decision:** Frame this story explicitly as a defensive mitigation (shorter keepalive, anti-buffering header, a missing keepalive added where none existed) — not a claimed fix for the disconnect itself. No AC asserts "the disconnect no longer happens."
**Rationale:** Overclaiming a fix for a cause outside this codebase's control would be dishonest and untestable. The real, honest benefit is: sending real bytes more often and disabling any buffering intermediary reduces risk regardless of the exact cause, at zero cost and zero behavioural downside — worth doing even without a guarantee.
**Made by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.

## Scope decision: include the merge-broadcast handler's missing keepalive (2026-10-07)

**Context:** While scoping the operator's "hardening" request (originally framed around the turn-stream handler the live incidents were observed on), auditing all 3 real SSE endpoints in this codebase found `handleGetArtefactMergeStream` has **zero** keepalive mechanism at all — a gap more exposed than the one that prompted this story, previously unconsidered because that handler is deliberately event-driven (per its own existing code comment) rather than interval-based.
**Decision:** Include hardening all 3 endpoints consistently in this one story, rather than fixing only the turn-stream handler and leaving a worse, newly-discovered gap unaddressed in the same audit.
**Rationale:** Matches `tsdg-s1`'s own established precedent this session of completing a full "check elsewhere" sweep rather than stopping at the first instance. The new merge-broadcast interval requires its own explicit safety design (`.unref()` + `clearInterval` on close) to avoid introducing a test-process-hang risk, documented in the story's own Architecture Constraints.
**Made by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.

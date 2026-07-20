**Contract Proposal — NFR-security review and hardening pass for Admin User Impersonation**

**What will be built:** No new user-facing behaviour. A structured security review of D1–D3's actual shipped code (an exhaustive `requireAdmin`-surface audit, a session-swap state-diff review, a concurrent-request test, and an audit-log-implementation-vs-decision check), with any gap found fixed before sign-off.

**What will NOT be built:** New hardening beyond what discovery/benefit-metric committed to (e.g. no session time-limiting).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test/checklist against every `requireAdmin`-gated route (exhaustive, not sampled) | integration + manual |
| AC2 | Integration test diffing real session state across a full impersonate-then-exit cycle | integration |
| AC3 | Integration test firing concurrent requests around the swap window | integration |
| AC4 | Integration test/checklist confirming implementation matches the confirmed /clarify decision | integration + manual |
| AC5 | This review's own sign-off gate — any finding from AC1–AC4 must be fixed, not just filed | manual |

**Assumptions:** D1, D2, and D3 are fully implemented (at least on a reviewable branch) before this story's own execution begins — this is a hard sequencing dependency, not a soft one.

**Estimated touch points:**
Files: Whatever D1–D3 actually touch, reviewed rather than newly authored; fixes applied in place if AC5 finds a gap
Services: None new
APIs: None new

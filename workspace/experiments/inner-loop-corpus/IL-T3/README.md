# IL-T3 — AML Threshold Alert Routing (LOW-MEDIUM difficulty)

## Scenario origin

Derived from discovery corpus case **T3** (regulated input — FCA AML threshold monitoring). The inner loop story selected is the **alert routing** story — wiring the alert delivery (Slack + email) when a threshold breach is detected. This story does NOT implement the detection logic or the MLRO SAR pathway (those are separate stories in the full feature).

## Inner loop difficulty classification

**LOW** — one compliance-adjacent NFR (audit logging), clean 3-AC story, no C2 process gate blocking go-live.

- **Constraint type:** NFR-only (audit trail logging — alerts and dispositions must be logged for regulatory evidence; but no external sign-off gate for this specific story)
- **DoD expected verdict:** COMPLETE

## Why this case (LOW difficulty)

While T3 has a regulated discovery context, the **alert routing** story is mechanically simple:
- Send an alert to Slack and email when called
- Log the alert dispatch and destination
- Return success/failure per channel

The regulatory constraint (audit trail) manifests as an NFR that must appear in the implementation plan, but it doesn't require external sign-off before this story is COMPLETE — it requires evidence that the logging works.

## What a weak model will miss

1. **IP1 (AC coverage):** The NFR (audit log) has no implementation task — a weak plan only covers the three functional ACs and omits the audit log step
2. **IP5 (NFR inheritance):** The DoR explicitly names NFR-1 (audit logging); a weak plan acknowledges it in a comment but has no distinct task with a test
3. **VG4 (scope creep check):** If the subagent adds SAR filing logic "while they're in there" — verify-completion must catch this as out-of-scope (SAR filing is explicitly deferred in the discovery out-of-scope section)
4. **DoD D3 (NFR verification):** Weak model calls the story COMPLETE even though audit log test evidence isn't in the PR description

## Expected DoD verdict: COMPLETE

All 3 functional ACs + NFR-1 (audit log) implemented and evidenced. No SAR routing or MLRO pathway — both explicitly out of scope for this story.

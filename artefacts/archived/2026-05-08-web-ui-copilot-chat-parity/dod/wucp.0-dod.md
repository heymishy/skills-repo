# Definition of Done: MM1 prompt validation spike — tool marker emission baseline

**Commit:** `12069b7a` "feat(wucp.0): spike complete — 20/20 100% marker emission via Copilot proxy; wucp.3 unblocked" | **Merged:** 2026-05-08 (no separate PR found via search — likely merged as part of a batch commit)
**Story:** artefacts/archived/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.0.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

This is a **Spike** story — its "done condition" is a result document and a go/no-go decision, not code + tests.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| Emission rate measured across 20 scenarios | ✅ | `artefacts/archived/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md` — 20/20, 100% emission rate | Direct document inspection, 2026-08-17 | None |
| Go/no-go decision made and documented | ✅ | Document's own explicit line: "**Decision: GO — proceed with wucp.3 as designed (marker-based approach)**" | Direct document inspection, 2026-08-17 | None |
| No production code changes (spike constraint) | ✅ | Confirmed — the commit is a reference-document-only addition | Direct inspection | None |

---

## Scope Deviations

None. The spike stayed within its own time-box and architecture constraint (no production code).

---

## Test Plan Coverage

Not applicable — spikes do not carry a conventional test plan per this repo's own template conventions; the result document itself is the deliverable.

---

## NFR Status

Not applicable.

---

## Metric Signal

**MM1 — Tool marker emission reliability**
Signal: on-track
Evidence: 100% emission rate (20/20), exceeding the story's own ≥80% GO threshold.
Date measured: 2026-05-08

---

## Outcome

**COMPLETE**

**Follow-up actions:** None — this spike's own stated purpose (unblock `wucp.3`) was fulfilled; `wucp.3` was subsequently built and merged (see `wucp.3-dod.md`).

---

## DoD Observations

1. A clean, well-executed spike: bounded time-box, explicit measurable go/no-go criteria set in advance, and a clear documented decision — exactly the discipline this repo's own spike convention calls for.

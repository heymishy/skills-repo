# AC Verification Script: p4-spike-d

**Story:** Validate Teams interaction model for C7 fidelity (Spike D)
**Story file:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-d.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-d-test-plan.md
**Test file:** tests/check-p4-spike-d.js
**Author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## Scenario 1 — AC1: Spike output exists with structured turn-by-turn log (≥3 turns)

**Setup:** Spike D investigation complete; `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-d-output.md` written.
**Steps:**
1. Confirm the file exists.
2. Locate the verdict (PROCEED / REDESIGN / DEFER / REJECT).
3. Find the turn-by-turn test log; count numbered/labelled turns.
4. Confirm ≥3 turns recorded with: question presented, whether operator answered, state advance result.
**Expected outcome:** File exists; valid verdict; ≥3 structured turns.
**Pass:** Yes / No

---

## Scenario 2 — AC2: C11 compliance explicitly stated; if violated, details recorded

**Setup:** spike-d-output.md exists.
**Steps:**
1. Search for `C11` with adjacent compliance outcome.
2. If compliant: confirm `no persistent process` or equivalent stated.
3. If violated: confirm runtime requirement named (e.g. Azure Bot Service), estimated hosting cost stated, and REDESIGN or DEFER verdict.
**Expected outcome:** C11 compliance outcome clear; if violated, full details present.
**Pass:** Yes / No

---

## Scenario 3 — AC3: C7 violation count recorded with definition applied

**Setup:** spike-d-output.md exists.
**Steps:**
1. Search for `C7 violation` or `violations` with a numeric result (including 0).
2. Confirm both violation types are referenced: (a) multiple questions in one turn, (b) advancing state without answering.
**Expected outcome:** Numeric violation count; both definition components referenced.
**Pass:** Yes / No

---

## Scenario 4 — AC4: Minimum signal evaluation stated as PROCEED or DEFER

**Setup:** spike-d-output.md exists.
**Steps:**
1. Search for `minimum signal` or `3 consecutive C7-compliant turns`.
2. Confirm explicit PROCEED or DEFER outcome stated for the minimum signal.
3. Confirm this is consistent with the overall verdict (DEFER on minimum signal → overall not PROCEED for E4 scope).
**Expected outcome:** Minimum signal explicitly evaluated; consistent with overall verdict.
**Pass:** Yes / No

---

## Scenario 5 — AC5: Verdict in pipeline-state.json and ADR in decisions.md with C11 and C7 coverage

**Setup:** pipeline-state.json updated; decisions.md updated.
**Steps:**
1. Open pipeline-state.json → phase4 → spikes → spike-d; confirm `verdict` field.
2. Open decisions.md; find `| ARCH |` entry for Spike D or Teams surface; confirm: Decision field, C11 compliance mention, C7 violation count, and Revisit trigger or Phase 5 handoff instruction if DEFER.
**Expected outcome:** Verdict in state file; complete ADR entry.
**Pass:** Yes / No

---

## Scenario 6 — NFR: No M365 credentials in spike-d-output.md (MC-SEC-02)

**Setup:** spike-d-output.md exists.
**Steps:**
1. Strip code blocks; scan for: tenant ID (UUID-shaped), `tenantId`, `clientSecret`, `bot_framework`, `AZURE_BOT`, `oauth`, `Bearer`, `token:`, `password`.
2. Verify none found outside code blocks.
**Expected outcome:** No credentials found outside code blocks.
**Pass:** Yes / No

---

## Summary

| Scenario | AC | Pass |
|----------|----|------|
| 1 | AC1 | |
| 2 | AC2 | |
| 3 | AC3 | |
| 4 | AC4 | |
| 5 | AC5 | |
| 6 | NFR | |

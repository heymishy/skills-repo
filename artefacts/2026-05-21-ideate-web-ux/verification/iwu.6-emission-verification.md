# iwu.6 Emission Verification — Evidence Record

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**DoD entry condition:** AC3 — real operator session with ≥6 turns of conversation before Lens B; emission rate ≥70%
**Gate:** This file must be completed before iwu.6 may be marked DoD-complete. A FAIL result or missing fields blocks DoD sign-off.

---

## Instructions for the Verifying Operator

1. Run a real `/ideate` session in the web UI with the updated `ideate/SKILL.md` committed.
2. Conduct ≥6 turns of conversation in the chat input **before** Lens B runs. Do not count Lens A output as a "turn" — only operator-typed chat input counts.
3. When Lens B runs, count the `assumptionCard` SSE events received by the browser (visible as cards appended to `#assumption-cards`).
4. Count the total number of assumptions the model surfaced in prose during Lens B (manually, by reading the Lens B output text).
5. Compute emission rate: `(markers_emitted / assumptions_identified_in_prose) × 100`.
6. Record all fields below. Sign with name and date.
7. If rate is < 70%: **do not mark DoD-complete** — revise the SKILL.md instruction and repeat.

---

## Session Evidence

```yaml
# Populate all fields. Leave no field blank — write "N/A" only where the
# instruction above explicitly permits it.

session_id:             # The session ID from the web UI URL (e.g. abc12345)
session_date:           # YYYY-MM-DD
operator:               # Name of the operator who ran the session

# Pre-Lens-B turns
turns_before_lens_b:    # Integer — number of operator chat input turns before Lens B ran
                        # Must be >= 6 for this evidence to count

# Lens B emission count
assumptions_identified_in_prose:   # Integer — total assumptions surfaced in Lens B text output (manual count)
markers_emitted:                   # Integer — count of assumptionCard SSE events received by browser (visible as cards in #assumption-cards)
cards_rendered_in_ui:              # Integer — count of cards visible in #assumption-cards after Lens B

# Pass/fail calculation
emission_rate_pct:      # Decimal — (markers_emitted / assumptions_identified_in_prose) * 100
                        # e.g. 9/12 = 75.0
pass_fail:              # "PASS" if emission_rate_pct >= 70, "FAIL" if < 70

# Per-lens breakdown (optional but recommended if rate < 100%)
per_turn_notes:
  # Record any turn where a marker was NOT emitted when an assumption was present
  # Format: "Turn N: [assumption text snippet] — marker emitted? yes/no"
  - ""

# Observations
context_drift_observed: # yes / no — did the model appear to stop emitting markers mid-session?
context_drift_notes:    # If yes: describe which turn and what changed

# Instruction revision (complete only if FAIL)
instruction_revision_attempt:  # Integer — 1 for first attempt, 2 for revised, etc.
revision_notes:                # What was changed in the SKILL.md instruction before re-running
```

---

## Verification Sign-off

| Field | Value |
|-------|-------|
| Verified by | _(operator name)_ |
| Date verified | _(YYYY-MM-DD)_ |
| Session turns conducted | _(N — must be ≥ 6)_ |
| Emission rate | _(_N_%)_ |
| Verdict | **PASS / FAIL** |
| DoD gate cleared | ☐ Yes — story may proceed to DoD-complete ☐ No — revise instruction and re-verify |

---

## Version history

| Attempt | Date | Operator | Rate | Verdict |
|---------|------|----------|------|---------|
| 1 (initial) | | | | |

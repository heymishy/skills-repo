# AC Verification Script: p4-spike-b1

**Story:** Evaluate MCP tool-boundary enforcement (Spike B1)
**Story file:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b1-test-plan.md
**Test file:** tests/check-p4-spike-b1.js
**Author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## Scenario 1 — AC1: Spike output exists with valid verdict, rationale, and observable test evidence

**Setup:** Spike B1 investigation complete; `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md` written.
**Steps:**
1. Confirm the file exists at the expected path.
2. Open the file and locate the verdict line (PROCEED / REDESIGN / DEFER / REJECT).
3. Read the rationale section; count sentence-ending punctuation (`.`, `!`, `?`).
4. Search for evidence of at least one hash-verifiable trace entry: look for `hash`, `trace`, and an invocation result or test run block.
**Expected outcome:** File exists; exactly one valid verdict; ≥3 sentences in rationale; hash + trace evidence present.
**Pass:** Yes / No

---

## Scenario 2 — AC2: C11 compliance status explicitly stated; mitigation if violated

**Setup:** spike-b1-output.md exists.
**Steps:**
1. Search for `C11` in the artefact.
2. Read the surrounding text: does it state `satisfied`, `compliant`, `no persistent process`, or `violated`, `persistent process required`?
3. If `violated` or `persistent process required`: look for a mitigation section proposing sidecar, VS Code extension, or REDESIGN verdict.
**Expected outcome:** C11 compliance outcome stated; if violated, mitigation described.
**Pass:** Yes / No

---

## Scenario 3 — AC3: P1–P4 fidelity properties stated

**Setup:** spike-b1-output.md exists.
**Steps:**
1. Search for P1, P2, P3, P4 in the artefact.
2. For each label, read the adjacent text: is one of SATISFIED / PARTIAL / NOT MET present?
3. Confirm all four are present.
**Expected outcome:** P1, P2, P3, P4 each have an explicit SATISFIED / PARTIAL / NOT MET outcome.
**Pass:** Yes / No

---

## Scenario 4 — AC4: Verdict in pipeline-state.json and ADR in decisions.md

**Setup:** spike-b1-output.md written; pipeline-state.json updated; decisions.md updated.
**Steps:**
1. Open `.github/pipeline-state.json`; navigate to the phase4 feature entry; find spikes → spike-b1 (or p4-spike-b1); confirm `verdict` field value matches the spike artefact verdict.
2. Open `artefacts/2026-04-19-skills-platform-phase4/decisions.md`; find the `| ARCH |` category entry for Spike B1; confirm it covers: Decision made, Alternatives considered, Rationale, Revisit trigger.
**Expected outcome:** Both files updated with matching verdict; ADR entry complete.
**Pass:** Yes / No

---

## Scenario 5 — AC5: p4.enf-mcp references Spike A and Spike B1 outputs

**Setup:** p4-enf-mcp.md story file exists (E3 story).
**Steps:**
1. Open `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md`.
2. Search for `spike-a` (or `spike_a` or `spike a`) in the architecture constraints section.
3. Search for `spike-b1` (or `spike_b1` or `spike b1`).
**Expected outcome:** Both references present.
**Pass:** Yes / No

---

## Scenario 6 — NFR: No credentials in spike-b1-output.md (MC-SEC-02)

**Setup:** spike-b1-output.md exists.
**Steps:**
1. Strip all fenced code blocks from the artefact content.
2. Scan remaining text for: `sk-`, `ghp_`, `Bearer`, `token:`, `api_key`, `password`, `clientSecret`, `tenantId`.
**Expected outcome:** No credential-shaped strings found outside code blocks.
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

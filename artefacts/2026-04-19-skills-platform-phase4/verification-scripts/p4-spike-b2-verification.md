# AC Verification Script: p4-spike-b2

**Story:** Evaluate Craig's CLI MVP as reference implementation (Spike B2)
**Story file:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b2-test-plan.md
**Test file:** tests/check-p4-spike-b2.js
**Author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## Scenario 1 — AC1: Spike output exists; records Craig's artefacts were read as inputs

**Setup:** Spike B2 investigation complete; `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md` written.
**Steps:**
1. Confirm the file exists at the expected path.
2. Locate the verdict line (PROCEED / REDESIGN / DEFER / REJECT).
3. Search for `artefacts/2026-04-18-cli-approach/` and at least one of `012`, `013` (reference document IDs from Craig's artefacts) in the file.
**Expected outcome:** File exists; valid verdict; Craig's artefacts path and at least one reference document ID present.
**Pass:** Yes / No

---

## Scenario 2 — AC2: P1–P4 fidelity properties stated for CLI

**Setup:** spike-b2-output.md exists.
**Steps:**
1. Search for P1, P2, P3, P4 in the artefact.
2. For each, confirm SATISFIED / PARTIAL / NOT MET is stated.
3. Confirm all four are stated in the context of the CLI mechanism (not MCP or another mechanism).
**Expected outcome:** All four stated for CLI.
**Pass:** Yes / No

---

## Scenario 3 — AC3: Assumption A2 explicitly validated with outcome recorded

**Setup:** spike-b2-output.md exists.
**Steps:**
1. Search for `A2`, `Assumption A2`, or `assurance.?gate`.
2. Read the result: accepted? required substantial modification? schema delta?
3. If modification required: confirm a specific schema field or structure change is described.
**Expected outcome:** A2 outcome explicitly stated; if modification required, schema delta identified.
**Pass:** Yes / No

---

## Scenario 4 — AC4: Verdict in pipeline-state.json and mechanism-selection ADR in decisions.md

**Setup:** pipeline-state.json updated; decisions.md updated.
**Steps:**
1. Open pipeline-state.json → phase4 → spikes → spike-b2; confirm `verdict` field matches artefact verdict.
2. Open decisions.md; find `| ARCH |` entry for Spike B2 or CLI mechanism selection; confirm Decision, Alternatives considered, Rationale, Revisit trigger all present.
**Expected outcome:** Matching verdict; complete ADR.
**Pass:** Yes / No

---

## Scenario 5 — AC5: p4.enf-cli references Spike A, Spike B2, and Craig's artefacts

**Setup:** p4-enf-cli.md story file exists (E3 story).
**Steps:**
1. Open `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md`.
2. Search for `spike-a` (or variant).
3. Search for `spike-b2` (or variant).
4. Search for `2026-04-18-cli-approach` or `Craig` or `PR #155`.
**Expected outcome:** All three references present.
**Pass:** Yes / No

---

## Scenario 6 — NFR: No credentials; C1 compliance verified in artefact

**Setup:** spike-b2-output.md exists.
**Steps:**
1. Strip code blocks; scan for credential-shaped strings (api_key, token, password, clientSecret).
2. Search for `C1` with outcome text (`non-fork`, `no copy`, `SKILL.md not present`, or variant).
**Expected outcome:** No credentials; C1 verification result stated.
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

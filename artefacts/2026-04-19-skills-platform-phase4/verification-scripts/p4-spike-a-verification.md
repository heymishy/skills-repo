# AC Verification Script: Spike A — Governance extractability investigation

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
**Technical test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-a-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** ___________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You need access to the repository file system (or the GitHub web UI to browse files).
2. Open the file `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md` — this is the spike output artefact.
3. Open the file `.github/pipeline-state.json` — you will check it in Scenario 4.
4. Open the file `artefacts/2026-04-19-skills-platform-phase4/decisions.md` — you will check it in Scenario 4.

**Reset between scenarios:** Not required — each scenario reads different files and there is no shared mutable state.

---

## Scenarios

---

### Scenario 1 — AC1: The spike output artefact exists and contains a valid verdict with rationale

**What this checks:** The spike investigation was completed and the output is recorded in the declared location.

**Steps:**
1. Open (or browse to) `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`.
2. Confirm the file exists and is not empty.
3. Look for a clearly labelled **Verdict** field near the top of the document.
4. Check the value — it must be exactly one of: `PROCEED`, `REDESIGN`, `DEFER`, or `REJECT`.
5. Find the rationale section (may be called "Rationale" or be the paragraph immediately below the verdict).
6. Count the sentences in the rationale. There must be at least 3 complete sentences explaining why this verdict was reached.

**Expected outcome:**
- File exists and opens without error.
- Verdict field is visible and contains one of the four valid values.
- Rationale contains at least 3 sentences. A sentence ends with a full stop, exclamation mark, or question mark.

**Pass / Fail:** _______ **Notes:** _________________________

---

### Scenario 2 — AC2: If the verdict is PROCEED, the artefact defines a candidate package interface

**What this checks:** A PROCEED verdict is only valid if the artefact gives Spike B1 and Spike B2 enough detail to evaluate whether their mechanisms can satisfy the shared core.

**Steps:**
1. Check the verdict from Scenario 1. If the verdict is **not PROCEED**, mark this scenario as **N/A** and move on.
2. If the verdict is PROCEED, scroll to the interface definition section (likely headed "Proposed Interface", "Package Contract", or similar).
3. Check that all five of the following governance operations are defined in the interface — look for a function signature, method shape, or contract description for each:
   - **Skill resolution** — how a skill file is located and loaded
   - **Hash verification** — how a skill's hash is checked at execution time
   - **Gate evaluation** — how a pipeline gate condition is assessed
   - **State advancement** — how the pipeline state transitions after a gate passes
   - **Trace writing** — how a trace record is emitted after an operation
4. For each operation, confirm there is at least a named function or contract shape — not just a heading with no detail.

**Expected outcome:**
- All five operations have a defined interface entry.
- Each entry contains at least a function name plus one of: named parameters, a return type/shape, or a description of what the function receives and returns.

**Pass / Fail:** _______ **Notes:** _________________________

---

### Scenario 3 — AC3: If the verdict is REDESIGN, the artefact identifies the blocking constraint and the minimum shared contract

**What this checks:** A REDESIGN verdict is only valid if the artefact explains exactly what prevents a single shared package and defines the floor — the minimum things all mechanisms must agree on.

**Steps:**
1. Check the verdict from Scenario 1. If the verdict is **not REDESIGN**, mark this scenario as **N/A** and move on.
2. If the verdict is REDESIGN, find the section describing why a single shared package is not viable (look for "Blocking constraint", "Why not a single package", or similar).
3. Confirm a specific technical reason is named — for example: incompatible runtimes (CLI vs MCP server), lifecycle differences, platform restrictions. A vague statement like "it is too complex" does not pass.
4. Find the minimum shared contract section. Confirm it mentions both:
   - **Skill format** — the shared structure skills must have across all mechanisms
   - **Trace schema** — the shared shape trace records must follow
5. Confirm these are described with enough detail that a mechanism implementer would know what format to produce.

**Expected outcome:**
- A specific technical blocking constraint is named.
- The minimum shared contract includes both skill-format and trace-schema definitions.

**Pass / Fail:** _______ **Notes:** _________________________

---

### Scenario 4 — AC4: The verdict is recorded in pipeline-state.json and a decisions.md entry exists

**What this checks:** The spike outcome is captured in two places: the pipeline tracking file and the decisions log. Both are required before the story can close.

**Steps:**
1. Open `.github/pipeline-state.json` and navigate to the Phase 4 feature section.
2. Look for a `spikes` or `spikeRecords` field. Find the entry for `spike-a`.
3. Confirm the `verdict` field in the entry matches the verdict from Scenario 1 (same value — PROCEED, REDESIGN, DEFER, or REJECT).
4. Open `artefacts/2026-04-19-skills-platform-phase4/decisions.md`.
5. Find the entry for Spike A (look for "Spike A" or "spike-a" in an entry heading or first line).
6. Confirm the entry contains all four of the following:
   - A clear **decision statement** (what was decided)
   - **Alternatives considered** (at least one alternative to the chosen path)
   - **Rationale** (why this option was chosen over the alternatives)
   - A **revisit trigger** (what would cause this decision to be revisited)

**Expected outcome:**
- pipeline-state.json has a spike-a entry with a verdict matching the artefact.
- decisions.md has a Spike A entry with all four required sections populated.

**Pass / Fail:** _______ **Notes:** _________________________

---

### Scenario 5 — AC5: E3 stories reference Spike A output as architecture input

**What this checks:** No E3 implementation story begins without anchoring its architecture in the spike's decision.

**Steps:**
1. Open `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-package.md`.
2. In the Dependencies or Architecture section, check that `spike-a-output.md` or `spike-a` is listed as an architecture input.
3. Repeat for `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md`.
4. You do not need to check all E3 stories now — AC5 specifically names p4-enf-package and p4-enf-mcp as examples. If these two pass, the pattern is established.

**Expected outcome:**
- Both `p4-enf-package.md` and `p4-enf-mcp.md` contain a reference to the Spike A output artefact in their Dependencies or Architecture sections.

**Pass / Fail:** _______ **Notes:** _________________________

---

### Scenario 6 — NFR Security (MC-SEC-02): Spike artefact contains no credentials or secrets

**What this checks:** The spike output is a document that will be committed to a public or semi-public repository. It must not include API keys, tokens, passwords, or any other credential.

**Steps:**
1. Open `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`.
2. Scan through the document — pay particular attention to any code blocks, example configurations, or interface proposal sections.
3. Look for any strings that could be real credentials: anything starting with `sk-`, `ghp_`, `Bearer`, or `token:`, long base64-like strings, or anything labelled `api_key`, `password`, or `secret`.
4. Placeholder examples like `<your-token-here>` or `"api_key": "EXAMPLE_ONLY"` are acceptable. Real-looking values (random character strings 30+ characters long) are not.

**Expected outcome:**
- No real-looking credential strings are present.
- Any credential-shaped examples are clearly marked as placeholders.

**Pass / Fail:** _______ **Notes:** _________________________

---

## Summary

| Scenario | AC | Pass / Fail | Notes |
|----------|----|-------------|-------|
| 1 — Artefact exists with valid verdict + rationale | AC1 | | |
| 2 — PROCEED: interface defines all 5 operations | AC2 | N/A if not PROCEED | |
| 3 — REDESIGN: blocking constraint + minimum contract | AC3 | N/A if not REDESIGN | |
| 4 — Verdict in pipeline-state.json + decisions.md entry | AC4 | | |
| 5 — E3 stories reference Spike A | AC5 | | |
| 6 — No credentials in artefact (MC-SEC-02) | NFR | | |

**Overall result:** Pass / Fail
**Verified by:** _______________ **Date:** _______________ **Context:** _______________

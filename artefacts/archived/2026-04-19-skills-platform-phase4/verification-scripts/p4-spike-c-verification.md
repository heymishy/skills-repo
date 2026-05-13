# AC Verification Script: p4-spike-c

**Story:** Resolve the distribution model (Spike C)
**Story file:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-c-test-plan.md
**Test file:** tests/check-p4-spike-c.js
**Author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-19

---

## Scenario 1 — AC1: Spike output exists; named design decisions for all 4 distribution sub-problems

**Setup:** Spike C investigation complete; `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md` written.
**Steps:**
1. Confirm the file exists.
2. Search for each sub-problem by name or section:
   - Sub-problem 1: sidecar / directory / collision
   - Sub-problem 2: commit provenance / zero-commit install
   - Sub-problem 3: update channel / lockfile / upgrade
   - Sub-problem 4: upstream authority
3. Locate the overall verdict (PROCEED / REDESIGN / DEFER / REJECT).
**Expected outcome:** All four sub-problems present with design decisions; overall verdict found.
**Pass:** Yes / No

---

## Scenario 2 — AC2: Upstream authority decision complete

**Setup:** spike-c-output.md exists.
**Steps:**
1. Find the upstream authority section.
2. Confirm a specific repository is named as the authoritative source (e.g. `heymishy/skills-repo` or a named fork).
3. Confirm `skills_upstream` block and `context.yml` are mentioned with described configuration.
4. Confirm Craig's fork role is stated: `publishing layer`, `downstream fork`, or equivalent.
**Expected outcome:** Authoritative repo named; context.yml configuration described; Craig's fork role categorised.
**Pass:** Yes / No

---

## Scenario 3 — AC3: Lockfile structure specified with upgrade and POLICY.md floor details

**Setup:** spike-c-output.md exists.
**Steps:**
1. Find the lockfile / update channel section.
2. Confirm minimum required fields named: upstream source URL, pinned ref, skill content hashes (or equivalent).
3. Confirm upgrade diff display described (how consumer reviews changes before re-pinning).
4. Confirm POLICY.md floor verification after upgrade described.
**Expected outcome:** All three components present.
**Pass:** Yes / No

---

## Scenario 4 — AC4: Verdicts in pipeline-state.json; upstream authority ADR in decisions.md

**Setup:** pipeline-state.json updated; decisions.md updated.
**Steps:**
1. Open pipeline-state.json → phase4 → spikes → spike-c; confirm `verdict` field.
2. Confirm per-sub-problem verdicts present (or at a minimum the upstream authority decision verdict).
3. Open decisions.md; find `| ARCH |` entry for upstream authority or Spike C; confirm Decision, Alternatives, Rationale, Revisit trigger.
**Expected outcome:** Overall verdict in pipeline-state.json; complete upstream authority ADR.
**Pass:** Yes / No

---

## Scenario 5 — AC5: E2 story references Spike C output

**Setup:** E2 stories exist (e.g. p4-dist-lockfile.md, p4-dist-install.md).
**Steps:**
1. Open `artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md`.
2. Search for `spike-c` or `spike_c`.
**Expected outcome:** Spike C reference present in the E2 story.
**Pass:** Yes / No

---

## Scenario 6 — NFR: No credentials in spike-c-output.md (MC-SEC-02)

**Setup:** spike-c-output.md exists.
**Steps:**
1. Strip code blocks; scan for credential-shaped strings.
2. Check any lockfile examples for real hashes or tokens.
**Expected outcome:** No credentials outside code blocks.
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

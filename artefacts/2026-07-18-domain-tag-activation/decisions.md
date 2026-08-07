# Decision Log: 2026-07-18-domain-tag-activation

**Feature:** Activate domain-tag standards injection at story authoring time
**Story reference:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Last updated:** 2026-07-18

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-18 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct request (through `/improve`), following the same precedent established for `pcr-s1`, `stis-s1`, and `gav-s1`.
**Alternatives considered:** Same rejected alternatives as prior precedent.
**Rationale:** Identical structural gap as prior short-track stories — `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact always exists, false for short-track by design.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-18
**Revisit trigger:** Same as prior precedent — when `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV.
---
**2026-07-18 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough before implementation begins.
**Alternatives considered:** Block on a formal review pass (rejected — same rationale as prior short-track precedent).
**Rationale:** Bounded fix activating an already-designed (but never-exercised) mechanism; operator directly requested this story, already briefed on the gap.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-18
**Revisit trigger:** If implementation finds the injection logic doesn't exist at all (rather than existing-but-unexercised), treat as new logic and reconsider whether a formal review is warranted before merging.
---

---
**2026-07-29 | GAP | implementation (revisit trigger fired — injection logic does not exist as code)**
**Decision:** Confirmed by direct investigation (`grep` across `skills/definition-of-ready/SKILL.md` and the whole repo) that the "Standards injection" step is pure prose — an agent-followed instruction, with no backing JS module, function, or any executable implementation anywhere in the codebase. This is exactly the contingency named in the 2026-07-18 RISK-ACCEPT entry's own "Revisit trigger." Per that entry's own wording ("reconsider whether a formal review is warranted," not "must block"), proceeding without a fresh formal review, but building this as genuinely new, testable code rather than treating it as confirming/fixing something pre-existing.
**Alternatives considered:** (a) Implement the matching algorithm as SKILL.md prose only, with tests limited to "the instruction text exists and is well-formed" (the class of test used for genuinely untestable model-instruction stories, e.g. inc5/inc3) — rejected, because AC2-AC5 explicitly require verifying real matching/injection *behaviour* (which file paths resolve, what content gets included, how a typo'd domain is handled), not just that the instruction text mentions the concept. A prose-only approach cannot satisfy the test plan's own stated verification approach for those ACs. (b) Stop and request a fresh formal review before proceeding — rejected per the RISK-ACCEPT entry's own explicit permission to proceed and just note the finding.
**Rationale:** The story's own goal ("future coding-agent instructions actually include the relevant standards... instead of relying on the agent to already know to check standards files unprompted") is best served by a real, deterministic, testable matching function — the same architectural direction gav-s1 took for gate-advance validation this same session (converting a documented-but-unenforced mechanism into real code). New module: `src/enforcement/standards-injection.js`, exporting `matchDomainsToStandards(domains, repoRoot)` (returns matched file paths + unmatched domain names) and `buildStandardsInjectionBlock(domains, repoRoot)` (returns the actual `## Applicable standards` Markdown text, satisfying U4/IT1/IT2's "content actually included, not just a path reference" requirement). `skills/definition-of-ready/SKILL.md`'s Standards injection section is updated to describe this exact algorithm (case/whitespace-normalised matching, distinct unmatched-domain warning) so the human-readable instructions and the testable code share one source of truth, rather than the instructions describing one thing and the code doing another.
**Made by:** Claude (agent), during implementation, 2026-07-29
**Revisit trigger:** None further — this decision resolves the one already named in the 2026-07-18 entry.
---

## Architecture Decision Records

None promoted to repo-level ADR status. No new architecture is introduced by this story — it activates an existing, already-designed mechanism.

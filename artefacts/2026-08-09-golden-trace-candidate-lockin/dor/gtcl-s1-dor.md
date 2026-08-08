## Definition of Ready: gtcl-s1 — Lock the golden-trace demo to one candidate and delete the other

**Story:** artefacts/2026-08-09-golden-trace-candidate-lockin/stories/gtcl-s1-delete-losing-candidate.md
**Review artefact:** artefacts/2026-08-09-golden-trace-candidate-lockin/review/gtcl-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-golden-trace-candidate-lockin/test-plans/gtcl-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/content/golden-trace-content.js` — delete the losing candidate's content, remove the `ACTIVE_CANDIDATE`/`CANDIDATES` lookup mechanism, keep only the winning candidate's content.
- `artefacts/2026-08-08-landing-page-hero-features/decisions.md` — new entry closing D2's revisit trigger.
- `tests/check-lphf-s1-golden-trace-demo.js` — update the former AC2 (candidate-flip) assertion to a single-candidate regression guard; add the new gtcl-s1-specific assertions per the test plan (or a new `tests/check-gtcl-s1-*.js` file — coding agent's choice, consistent with this repo's convention of extending an existing story's test file when the change is a direct evolution of that story's own mechanism).

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/templates/landing.html` — the demo's 4-frame HTML structure and CSS are unaffected; only the content source changes.
- Any other hero card or the auth panel — untouched.

### Architecture Constraints

No new architectural decision — this closes an already-scoped, already-decided mechanism (D2) rather than introducing a new one. No ADR required.

**Candidate selection recommendation (for the coding agent to confirm or override in AC1's decisions.md entry):** `kanban` (`interactive-kanban-boards`/`s3.1`) is recommended as the winner. Reasoning: it has been the live, deployed candidate since merge with zero negative signal; its "shipped" frame describes a directly interactive, easily-grasped mechanism (drag-to-advance calling the real API) that reads more concretely "real, working software" to a skeptical outside visitor than the diagram candidate's static-artefact framing; and it more directly answers the discovery-identified persona objection ("does this actually work, or is it a claim?") that Metric 1 (signup conversion) is trying to move. This is a recommendation, not a mandate — the coding agent (or operator) may choose `diagram` instead if a stronger case exists, but AC1 requires the reasoning be written down either way.

### Human oversight

**Low** — single-file content deletion plus a one-paragraph decision write-up; complexity 1; no upstream/downstream code dependency beyond the one already-merged story this closes.

### Coding Agent Instructions

1. Confirm or override the candidate recommendation above; write the AC1 decision entry in `artefacts/2026-08-08-landing-page-hero-features/decisions.md` first, before touching code.
2. In `golden-trace-content.js`, delete the losing candidate's object entirely from `CANDIDATES`, then collapse the file to reference the single remaining candidate's content directly (remove `ACTIVE_CANDIDATE` and the `CANDIDATES[...]` lookup in `renderGoldenTraceHtml()`).
3. Capture the pre-change rendered output of `renderGoldenTraceHtml()` as a golden fixture before making the code change, to prove AC5's byte-identical requirement.
4. Update `tests/check-lphf-s1-golden-trace-demo.js` per the test plan; write the new tests.
5. Re-run the full existing suite to confirm no regression.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — no layout change, AC5 requires byte-identical output)

**PROCEED: Yes**

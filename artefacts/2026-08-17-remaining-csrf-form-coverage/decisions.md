# Decision Log: remaining-csrf-form-coverage

**Feature:** Extend CSRF token protection to the remaining server-rendered POST forms
**Story reference:** `artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md`
**Last updated:** 2026-08-24

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-24 | SCOPE | test-plan**
**Decision:** AC1's original text ("`POST /journey/wizard`, `POST /api/journey` and sibling journey-flow form POSTs") is corrected to explicitly enumerate all 6 journey-flow routes with a real `<form method="POST">` target — adding `gate-confirm`, `reference-modal/skip`, `reference`, and `stories`, which the original finding (dated 2026-08-17) did not name.
**Alternatives considered:** Leave the vague wording as-is and let the coding agent interpret "sibling journey-flow form POSTs" during implementation.
**Rationale:** A 7-day-old finding was re-verified against current code before writing the test plan (per this session's own established practice of not trusting a stale finding without re-checking). Direct code investigation found `journey.js` renders 4 more real server-rendered forms than the original story text named. Leaving the AC vague would have let the coding agent under-scope the fix — exactly the kind of silent gap this feature exists to close in the first place.
**Made by:** Claude (agent), during `/test-plan`
**Revisit trigger:** None — route list is now code-verified, not carried forward from stale text.
---

**2026-08-24 | SCOPE | test-plan**
**Decision:** AC2 gains an explicit prerequisite fix: `annotation.js`'s `_readBody` must be extended to parse `application/x-www-form-urlencoded` bodies (not just JSON), as part of this story's own delivery — not a separate follow-up story.
**Alternatives considered:** Split the form-parsing bug into its own separate short-track story, keeping `rcfc-s1` scoped purely to CSRF wiring.
**Rationale:** Found during pre-implementation investigation: the annotations route currently 400s on any real browser form submission regardless of CSRF token presence, because its body parser only handles JSON. AC2 requires "succeeds as before" once a valid token is supplied — that claim is unachievable for a real form POST without this fix, since the request never even reaches the CSRF check's own logic path in a meaningfully testable way. Keeping the fix inside this story (rather than splitting it out) avoids a two-story sequencing dependency for a single-function, tightly-scoped change, and keeps AC2's own round-trip test meaningful end-to-end.
**Made by:** Claude (agent), during `/test-plan`
**Revisit trigger:** None — fix is scoped strictly to the parsing gap, not a broader `annotation.js` refactor (see story's own Out of Scope section).
---

**2026-08-24 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceed to DoR sign-off without a separate domain-expert review of the AC verification script (W4 warning).
**Alternatives considered:** Pause sign-off until the operator personally walks through the verification script against a running instance before assigning to the coding agent.
**Rationale:** Matches the precedent already established this session for `jatg-s1` and all 4 `vrne` stories. The ACs mirror an already-proven, low-ambiguity pattern (`sec-perf-s3`'s own shipped CSRF mechanism, reused as-is) — each scenario is a direct, mechanically-derived reproduction (reject without token / succeed with token / regression-guard the two found bugs), not a subjective judgment call.
**Made by:** Hamish King (Founder/Operator), via `/definition-of-ready`
**Revisit trigger:** None — accepted for this story.
---

## Architecture Decision Records

<!-- None — this story reuses sec-perf-s3's existing CSRF mechanism exactly, introducing no new architectural pattern. -->

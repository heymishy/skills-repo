# Decision Log: incident-triage-and-respond

**Feature:** Incident Triage and Respond
**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Last updated:** 2026-11-08

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
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Story 2's triage matching scores incident records' short structured summary/tags fields against each other using the Jaccard-similarity primitive already proven in `src/modules/drift-comparator.js` (`_jaccard`), with its own threshold tuned for this domain. Matching against raw free-text `decisions.md` prose is out of scope for this MVP. Story 1's incident record mechanism now explicitly captures that structured summary/tags field.
**Alternatives considered:** The discovery draft's original assumption — match against prior incident records *and* `decisions.md` directly, implicitly assuming some form of text matching would "just work" without checking what tooling exists or what the real content shape looks like.
**Rationale:** Checked `drift-comparator.js` directly during /clarify: its real, tested inputs are short, clean column-name lists (`_columnNames`), not prose. `package.json` has no stopword-removal or tokenization library, and real `decisions.md` entries run to thousands of words of free-form rationale. Raw paragraph-level Jaccard similarity would be dominated by common-word overlap, not genuine relevance — reusing a same-named function without checking its real input shape would have repeated this repo's own `tir-s5` mock-shape mistake (`CLAUDE.md` coding standards), where a reused adapter's test passed while production did nothing useful because the real data shape didn't match what was assumed.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If structured-field matching proves too narrow once real incident volume exists (e.g. consistently missing relevant prior incidents), revisit whether full-text matching against `decisions.md` is worth building — at that point this repo would need to add real tokenization/stopword tooling first, not just extend the Jaccard call.
---
**2026-11-08 | SLICE | discovery (/clarify)**
**Decision:** Story 3 (the first slice of initiative 1's visibility surface, scoped to incident records) is built and artefact-owned under this feature's (`incident-triage-and-respond`) chain, not under initiative 1's (`unified-reactive-proactive-visibility`) chain, even though it is conceptually part of initiative 1's eventual surface.
**Alternatives considered:** (A) Defer the web UI requirement entirely until initiative 1 is implemented — rejected per the operator's explicit "needs to be in web UI now" steer. (B) Build a standalone, separate incident view independent of initiative 1 — rejected due to real duplication risk if initiative 1's surface is later built and needs to absorb or replace it. (C, chosen) Build it now as initiative 1's first real slice, owned by the feature that has the concrete, current need.
**Rationale:** This is the feature actually building and shipping the UI work now; initiative 1 is approved but has no implementation yet. Initiative 1's own future `/definition` will reference and extend this slice rather than recreate it, avoiding the duplication risk of option (B) without blocking on initiative 1's own timeline.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** When initiative 1 runs its own `/definition`, it must explicitly reference this story's artefact and code rather than independently re-specifying the incident-record rendering — if that discipline slips, re-evaluate whether cross-feature UI ownership needs a stronger mechanism than a decisions.md note.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->

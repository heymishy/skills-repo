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
**2026-11-09 | ARCH | definition — surface correction (cross-reference)**
**Decision:** Story 3's "extends `kanban-view.js` (or the equivalent route)" target is corrected to `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`, inside `_renderProductView`/`handleGetProductView`) — the real per-product detail page that merges a connected repo's `pipeline-state.json` taxonomy with journeys. `kanban-view.js` is confirmed 100% journeys-table-driven with no path to pipeline-state.json data at all.
**Alternatives considered:** None separately evaluated here — this entry cross-references the full ARCH decision and rationale logged in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09), where the code-level audit was actually performed, since this story depends on that initiative's surface.
**Rationale:** Story 3 was explicitly designed as "the first real slice of initiative 1's visibility surface" — when initiative 1's own discovery was corrected to the real surface during /definition, this story's target correspondingly changes, since it was never meant to be a second, independent surface.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None — this is a factual correction propagated from initiative 1's own decision, not a new design choice that could independently reverse.
---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---
**2026-11-09 | ARCH | definition — _jaccard export gap found**
**Decision:** `src/modules/drift-comparator.js`'s `_jaccard` function, which the discovery's own `/clarify` correction already verified has the right proven input shape (short arrays, not prose) for this feature's matching need, is not actually exported — `module.exports` lists only `DUPLICATE_SIMILARITY_THRESHOLD`. itar-s2 must either export `_jaccard` (preferred — one function, already correct, no behavioural change) or extract it to a shared utility, rather than assuming import-and-reuse works as the discovery's "reused" language implied.
**Alternatives considered:** (A) Write a second, independent Jaccard implementation inside the new incident-matching code rather than touching `drift-comparator.js` at all — rejected, this duplicates logic the repo already has correct and tested, against ADR-012's/ADR-013's general preference for shared primitives over parallel reimplementations. (B, chosen) Export the existing function (or extract it to a shared location); defer the exact choice to itar-s2's implementation plan.
**Rationale:** Found by reading the real `module.exports` block (line 518) while verifying the discovery's own already-corrected Jaccard-reuse claim before writing itar-s2's ACs — a smaller instance of the same "read the real code before building on an assumption" discipline applied repeatedly this session (initiative 1's `kanban-view.js` finding; initiative 3's two unverified-claim corrections).
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None — factual correction of a verifiable code gap, resolved as an explicit AC (itar-s2 AC1's "newly exported" language) rather than left implicit.
---
**2026-11-09 | ARCH | definition — stale benefit-metric.md surface citation found**
**Decision:** Corrected `benefit-metric.md`'s Metric 3 "Target" field, which still read "the extended `kanban-view.js` surface" — the earlier cross-tranche correction (2026-11-09, this feature's own prior `decisions.md` entry) had updated `discovery.md` but missed this duplicate citation in `benefit-metric.md`.
**Alternatives considered:** None — this is a mechanical consistency fix, not a design choice.
**Rationale:** Found while re-reading `benefit-metric.md` in full before writing itar-s3's ACs, confirming the surface-correction propagated everywhere it needed to, not just the file it was originally logged against.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None.
---

---

---
**2026-11-09 | ASSUMPTION | review — itar-s2 Jaccard threshold acknowledgement**
**Decision:** Acknowledge, rather than resolve, `/review` Run 1 finding `1-M1` on `itar-s2`: AC1 and AC3 both reference a "domain-tuned threshold" for structured-field Jaccard matching without stating a value. The threshold is deliberately left for empirical determination during implementation, not pinned now at /definition.
**Alternatives considered:** (A) Pin an arbitrary number now (e.g. 0.5, matching `drift-comparator.js`'s own `DUPLICATE_SIMILARITY_THRESHOLD`) — rejected, since that constant is proven only against short column-name arrays, not incident tag/summary sets, and copying it across domains without evidence would repeat the same "assumed-shape" mistake already caught once in this feature (the `_jaccard` export gap) and once in `team-identity-roles` (`tir-s5`). (B, chosen) Leave the threshold open, explicitly flagged as implementation-deferred, with a concrete revisit trigger — distinguished from `pep-s2`/`pep-s3`'s HIGH finding because there, the deciding data (phase4: 5 epics, team-identity-roles: 1 epic) already existed and simply wasn't pinned; here, no comparable historical dataset of incident-tag Jaccard scores exists yet to pin a number against.
**Rationale:** `/review` itself distinguished this case from the epic-count threshold defect — scoring it MEDIUM/PASS rather than HIGH/FAIL — because the AC's own Architecture Constraints text already defers the value to "determined empirically against real/fixture incident data during implementation." Acknowledging it here closes the loop the review report asked for ("resolve or acknowledge in /decisions... before /test-plan") without inventing a number that has no evidentiary basis yet.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /decisions acknowledgement pass, 2026-11-09
**Revisit trigger:** Once implementation has run the Jaccard primitive against a handful of real or fixture incident tag/summary sets, pin the threshold to a concrete value backed by that evidence, and update itar-s2's AC1/AC3 accordingly before considering the story's test plan complete.
---

## Architecture Decision Records

<!-- None yet for this feature. -->

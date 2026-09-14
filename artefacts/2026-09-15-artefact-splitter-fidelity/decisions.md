# Decisions: Artefact splitter fidelity fix

## Fail-safe on unparseable review verdict, instead of defaulting to PASS

**Date:** 2026-09-15
**Context:** `review-artefact-splitter.js`'s original verdict extraction defaulted to `'PASS'` whenever its regex failed to match a story's verdict line — discovered because real model output for `new-feature-2b74a292`'s review turn used `### Verdict: **FAIL** (Category C)` (heading-prefixed, decorated), which the original flat-only regex never matched, silently turning every one of 13 real FAIL verdicts into an apparent PASS.

**Decision:** Widened verdict-line recognition to also match the heading-prefixed/decorated form. Separately and more importantly: when a verdict genuinely cannot be resolved to exactly PASS or FAIL under either recognised form, the splitter now skips writing that story's split file entirely and logs a warning — it never falls back to any default verdict.

**Rationale:** A review verdict gates `/test-plan` (per `skills/review/SKILL.md`: "HIGH findings block progression to /test-plan"). A wrong default in the safe direction (FAIL) would create false friction; a wrong default in the unsafe direction (PASS, the original behaviour) silently unblocks a story that should have been blocked. The only correct behaviour when parsing genuinely fails is to produce nothing and say so loudly — matching `definition-artefact-splitter.js`'s own pre-existing "return empty rather than write something wrong" contract for a completely unrecognised artefact — extended here to a per-story granularity.

**Story:** artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md

---

## Split the gap at its own "Given" marker when two special-prose regions share one gap

**Date:** 2026-09-15
**Context:** The initial fix for `definition-artefact-splitter.js` assumed the AC `Given/When/Then` block and the `So that [goal], I need [need].` sentence always occupy separate gaps between recognised fields. Testing against the real `artefacts/new-feature-af17f555/definition.md` fixture (this repo's own existing regression fixture) showed this assumption is false: in that document's actual field order, both sit in the same gap (directly after `Persona`, before `Out of scope`), separated only by a blank line. The first implementation attempt's so-that regex, applied to the whole gap, matched all the way through the trailing AC block hunting for a satisfying final period.

**Decision:** When a gap contains a `Given` marker, split it there first: everything before `Given` is the candidate so-that portion, everything from `Given` onward is the AC block. Each pattern is only ever tested against its own bounded portion, never the whole (potentially mixed) gap.

**Rationale:** Caught by the fixture-based test itself (not by manual review) — reinforces why this repo's own established convention of testing against real, unmodified production fixtures rather than synthetic-only ones matters: a synthetic fixture authored with the (wrong) separate-gaps assumption in mind would never have exposed this.

**Story:** artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md

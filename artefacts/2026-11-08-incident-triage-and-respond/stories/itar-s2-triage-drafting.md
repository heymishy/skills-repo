## Story: Triage drafting via structured-field Jaccard matching

**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-incident-triage-and-respond/benefit-metric.md

## User Story

As a **delivery engineer responding to an alert**,
I want to **get a draft triage summary scored against prior incidents' tags when I create a new incident record**,
So that **I start from "here's what's already known" instead of from zero, the way every investigation does today**.

## Benefit Linkage

**Metric moved:** Triage drafting
**How:** This story is the only mechanism that can produce the "100% of new incident records get an auto-drafted triage summary attempt" target — without it, every record stays at story 1's bare schema with no triage content.

## Architecture Constraints

- **New finding beyond the discovery's own /clarify check**: `_jaccard` (`src/modules/drift-comparator.js:254`) is not exported — `module.exports` (line 518) lists only `DUPLICATE_SIMILARITY_THRESHOLD`. This story must either (a) add `_jaccard` to that module's exports, renamed if desired for a public API (e.g. `jaccardSimilarity`), or (b) extract it into a small shared utility both `drift-comparator.js` and this story's new matching code import from. Option (a) is simpler and lower-risk (one function, already correct, no behavioural change) — prefer it unless the implementation plan finds a reason not to.
- The reused function's threshold must be tuned for this domain, not inherited from `DUPLICATE_SIMILARITY_THRESHOLD`'s `0.5` — per the discovery's own explicit instruction, short incident tags behave differently from column-name lists and may need a different cutoff, determined empirically against real/fixture incident data during implementation.
- Matching is scored against prior incidents' structured summary/tags fields only — never against `decisions.md` free text, confirmed out of scope per the discovery (no stopword/tokenization tooling exists in this repo).
- `product/constraints.md` #13: the test plan must assert a triage summary field was actually populated on the record, not just that the matching function returns a plausible-looking score in isolation.

## Dependencies

- **Upstream:** itar-s1 (the record and its tags field this story matches against).
- **Downstream:** itar-s4 (the triage summary's context is what gets attached at handoff).

## Acceptance Criteria

**AC1:** Given a new incident record is created with a populated, normalized tags field, When the triage-drafting function runs, Then it scores the new record's tags against every existing incident record's tags using the (newly exported) Jaccard primitive, and attaches the top-scoring match(es) above a defined, domain-tuned threshold as prior-incident links on the new record.

**AC2:** Given one or more prior-incident matches are found above threshold, When the triage summary is drafted, Then it includes: what's known (summarized from the matched record(s)), what's been tried before (from the matched record's status/resolution if present), and a suggested next step — not just a bare similarity score with no narrative content.

**AC3:** Given no prior incident matches above the domain-tuned threshold (a genuinely novel incident, or the first record ever created), When the triage-drafting function runs, Then it still attaches a triage summary stating explicitly that no relevant prior incident was found — never silently skipping the summary field or fabricating a low-confidence match as if it were a real one.

**AC4:** Given the triage-drafting function runs against a record whose tags field is empty or malformed, When this happens, Then it fails gracefully with an explicit "cannot score — no tags present" result recorded on the record, rather than throwing an unhandled error or silently producing a zero-confidence match indistinguishable from AC3's genuine no-match case.

## Out of Scope

- Any matching against `decisions.md` free text — structured-field matching only, confirmed out of scope by the discovery.
- Auto-prioritization, severity scoring, or auto-escalation based on the triage summary — a human reads and decides; this story only drafts.

## NFRs

- **Performance:** Matching runs against the full `workspace/incidents.json` history — for this repo's expected incident volume (low, per the discovery's own "what could make this not worth building" risk framing), this is not expected to be a performance concern; flagged for re-evaluation if incident volume grows materially after initiative 2 ships.
- **Security:** None beyond itar-s1's existing data handling.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** The triage summary itself, attached to the record, is the audit trail for what was matched and why.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

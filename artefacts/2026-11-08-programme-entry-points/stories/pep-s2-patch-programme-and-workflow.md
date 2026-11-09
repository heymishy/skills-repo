## Story: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-programme-entry-points/benefit-metric.md
**Domain:** [none — skill-instruction files are not a listed `.github/standards/index.yml` domain]

## User Story

As a **platform maintainer validating skill readiness**,
I want to **actually patch the concrete gaps found in `/programme` and `/workflow`, not just report them**,
So that **this initiative produces real hardening an eventual enterprise-fork consumer benefits from, not a report that sits unused**.

## Benefit Linkage

**Metric moved:** Qualification-gate fix validated against a real case; Routing visibility for a genuine big-bet candidate
**How:** This story is the only place either Tier 1 metric's target can actually be reached — pep-s1 and the discovery-time corrections identified the real gaps, but the metrics measure the *patched* behaviour, not the finding itself.

## Architecture Constraints

- **Governed-file PR requirement**: both `skills/programme/SKILL.md` and `skills/workflow/SKILL.md` are patched via branch + PR, never direct push to master, per CLAUDE.md's Platform change policy — the same path used for the `bootstrap/SKILL.md` correction and the ADR-001 correction earlier this session.
- **MC-CONSIST-02** (gate add/remove synced with SKILL.md criteria): the `/workflow` fix must result in `/workflow` deferring to `/programme`'s Step 0 (e.g. "run /programme's Step 0 qualification now" rather than re-asking the same 4 questions inline), closing the duplication-drift risk this guardrail exists to catch.
- Two concrete patches are already known from the discovery-correction (not dependent on pep-s1's findings): (1) add an epic-count-based signal to Step 0's scoring table; (2) de-duplicate `/workflow`'s informal pre-check and add the missing `/orient` cross-reference. Any *additional* patch this story makes must trace to a specific, named gap in pep-s1's write-up artefact — this story does not freelance additional "improvements" to `/programme` beyond what was actually found or already corrected at discovery/definition time.

## Dependencies

- **Upstream:** pep-s1 (scopes any patches beyond the two already-known ones below).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given Step 0's current scoring table (Multiple teams / Cross-team hard dependencies / Formal phase gates / Consumer migration / Timeline), When this story's patch lands, Then a new signal is added — epic count within a single feature meeting or exceeding a defined threshold (informed by pep-s3's own validated primary signal) — so a genuinely single-team, high-epic-count effort has a structured, criteria-based path to programme-track qualification instead of only an unguided "proceed anyway" override.

**AC2:** Given the new signal is added, When Step 0 is run against phase4's real historical profile (5 epics, 1 team, no other signals), Then the gate's verdict changes from fail to pass via the new signal specifically — satisfying Metric 1's target directly.

**AC3:** Given the new signal is added, When Step 0 is run against at least one normal multi-story feature from `pipeline-state.json` that has few epics, Then the gate still correctly recommends the standard pipeline (no false positive introduced) — the new signal must not weaken the gate's existing rejection behaviour.

**AC4:** Given `/workflow`'s current informal pre-check (team count, hard dependencies, phase gates, consumer migration, inline at its "If 5 — Programme track" branch), When this story's patch lands, Then that section is rewritten to defer to `/programme`'s own Step 0 (e.g. route directly into Step 0 rather than re-asking an inline copy of the same questions) — removing the duplicated gate logic, not just documenting that it's duplicated.

**AC5:** Given `/orient`'s current routing logic has zero mentions of `/programme`, When this story's patch lands, Then at least one cross-reference to `/programme` is added under the appropriate transformative/multi-team/multi-phase framing signal, verified by re-reading the edited file.

**AC6:** Given pep-s1's write-up artefact names any additional concrete gap beyond the two above, When this story addresses it, Then the patch traces explicitly to that named finding — and if a found gap is judged out of this story's bounded scope (e.g. evidence of a structural redesign need), it is logged as a RISK-ACCEPT or new-discovery referral in `decisions.md`, never silently absorbed or silently dropped.

## Out of Scope

- Any patch to `/programme` or `/workflow` not traceable to pep-s1's findings or the two discovery-time corrections already logged in `decisions.md`.
- A full redesign of either skill, even if pep-s1 finds something significant — per the epic's own Out of Scope, that becomes a new discovery, not an expanded story 2.

## NFRs

- **Performance:** Not applicable — skill-instruction text, no runtime performance characteristic.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** The PR itself, plus the `decisions.md` entries already logged (and any new ones from AC6), form the audit trail for what changed and why.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable (by design — see epic-level note; AC1-AC5 are fixed, AC6's scope depends on pep-s1)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

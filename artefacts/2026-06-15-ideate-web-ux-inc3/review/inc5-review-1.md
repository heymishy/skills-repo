# Review Report: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md — Run 1

**Story reference:** artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md
**Date:** 2026-06-16
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Traceability — The story has no **Epic reference**, **Discovery reference**, or **Benefit-metric reference** fields at all (required by `.github/templates/story.md` lines 19-21). The "Background" section narrates the gap in prose but never cites `artefacts/2026-06-15-ideate-web-ux-inc3/discovery.md` or `benefit-metric.md` by path. `discovery.md` itself only documents inc3 and inc4 under "## Stories" — inc5 is not mentioned anywhere in it, so the reference would currently be broken even if added.
  Fix: Add the three reference fields to inc5.md pointing at the epic (`inc3-inc4`), `discovery.md`, and `benefit-metric.md`. Add a short "### inc5" entry to `discovery.md` (or an addendum note) recording that inc5 was split out of inc4's original marker-emission scope, so the reference resolves to real content rather than a silent gap.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness — No **Benefit Linkage** section ("Metric moved" + "How" sentence). `benefit-metric.md` defines M2 — "Canvas block render fidelity" — as exactly the metric inc4 built infrastructure for but cannot move without marker emission. The story should state this explicitly rather than leave the connection implicit in the Background prose.
  Risk if proceeding: the story can be implemented without the author ever checking it actually moves a named metric — the stated DoD entry condition only requires a canvas block to render once in a live session, which is a much weaker bar than "M2 becomes measurable."
  To acknowledge: run /decisions, category RISK-ACCEPT — or add the section (preferred; the content is one sentence and already derivable from benefit-metric.md).

- **[1-M2]** Completeness — No **NFRs** section. The story is instruction-only with no runtime behaviour change of its own, so "None identified — instruction text only, no new runtime path" is a defensible answer, but the template requires it to be written, not omitted.
  Risk if proceeding: a reviewer six months from now cannot tell whether NFRs were considered and excluded, or simply never asked.
  To acknowledge: add the section with the stated rationale.

- **[1-M3]** Completeness — No **Architecture Constraints** section as its own heading (the story type line says "SKILL.md instruction update (no code changes)" but doesn't cite the guardrail). `.github/architecture-guardrails.md` line 38 states skill files are "content, not code — governed by pipeline process, not these guardrails," which is the correct answer here, but it should be written into the story, not left for the reviewer to go find.
  Risk if proceeding: future stories copying this one as a template will keep omitting the section.
  To acknowledge: add "None identified — SKILL.md instruction content is governed by pipeline process per architecture-guardrails.md line 38, not these guardrails" to the story.

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — No **Complexity Rating** section in the file itself (it exists only in `pipeline-state.json` as `complexity: 1`). Should be visible in the artefact, not only in state.
- **[1-L2]** Completeness — No **Dependencies** section in the template's `- Upstream: / - Downstream:` format. "Depends on: inc4 at definition-of-ready" appears as a loose header line instead — same information, non-conformant structure.
- **[1-L3]** Scope — Out of Scope section is good (4 specific items) but doesn't use the template's bullet format; harmless, noted for consistency only.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 2 | FAIL |
| Scope integrity | 4 | PASS |
| AC quality | 5 | PASS |
| Completeness | 2 | FAIL |
| Architecture compliance | 4 | PASS |

**Traceability score (2):** No epic/discovery/benefit-metric reference fields, and discovery.md does not yet mention inc5 at all — the reference would be broken even if added without the discovery.md addendum.

**Scope integrity score (4):** Out of scope section names 3 specific exclusions and stays within inc4's deferred scope; minor format deviation only (LOW).

**AC quality score (5):** All 6 ACs are concrete, independently testable, and use "instructs"/"renders"/"does not appear" rather than "should." AC4 includes the exact schema. No issues found.

**Completeness score (2):** Missing Benefit Linkage, NFRs, and Architecture Constraints sections entirely; Complexity Rating and Dependencies present only as informal lines, not the template's structured sections.

**Architecture compliance score (4):** Correct outcome (skill files are content, not code, per guardrails line 38) but not stated in the story itself — MEDIUM-level gap already captured as 1-M3, not re-counted here.

**Verdict:** FAIL — 2 criteria (Traceability, Completeness) scored below 3.

---

## Summary

1 HIGH, 3 MEDIUM, 3 LOW across 1 story.
**Outcome:** FAIL

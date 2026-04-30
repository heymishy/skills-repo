# Epic: Non-Engineering Attribution Fields and DoR Governance Enforcement

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Benefit-metric reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/benefit-metric/initiative-3-governance-benefit-metric.md
**Slicing strategy:** Vertical slice — each story delivers a complete, independently observable governance change. i3.1 and i3.2 are prerequisite to i3.3 (the enforcement block checks fields that must exist first).

## Goal

When this epic is complete, every discovery artefact produced by the `/discovery` skill will carry required attribution fields (Contributors, Reviewers, Approved By), the `/benefit-metric` skill will acknowledge attribution before proceeding, and a DoR hard block (`H-GOV`) will prevent any story from reaching implementation if its discovery or benefit-metric artefact has an empty `Approved By` field. The platform will have a structural mechanism — not a convention — for surfacing whether a non-engineering persona was involved in defining the work.

## Out of Scope

- Section-level attribution (e.g. per-AC approvers, per-epic reviewers) — this epic covers artefact-level attribution only
- Automated non-engineering role validation (distinguishing engineer vs. non-engineer by name lookup) — H-GOV performs a text-presence check; role classification remains human judgment
- Attribution governance for story artefacts themselves — only discovery and benefit-metric artefacts are in scope
- Teams bot integration (WS0.7) — explicitly deferred; depends on I3 being complete but is not part of this epic
- Initiative 1 or 2 surface work — sequencing constraint means no I1/I2 implementation begins until this epic is fully merged

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Non-engineering attribution rate | 0% (no attribution fields exist) | ≥50% of new discovery artefacts carry a non-engineering contributor within 90 days | Stories i3.1+i3.2 add the required fields; i3.3 enforces at DoR — together they create the mechanism that makes attribution measurable |
| MM1 — H-GOV enforcement correctness | Block does not exist | 100% correct failures on attribution-gap stories; zero false positives | Story i3.3 creates the H-GOV hard block |
| MM2 — Attribution field completeness rate | 0% (fields do not exist) | 100% of new discovery artefacts have all three fields substantively populated | Stories i3.1+i3.2 add the fields to the templates |
| MM3 — Platform dogfood attribution | Not applicable | I1 and I2 discovery artefacts have complete attribution | The I1+I2 artefacts are the evidence; this epic creates the mechanism those artefacts will satisfy |

## Stories in This Epic

- [ ] i3.1 — Attribution fields in /discovery SKILL.md output template
- [ ] i3.2 — Attribution acknowledgement in /benefit-metric SKILL.md
- [ ] i3.3 — H-GOV DoR hard block in /definition-of-ready SKILL.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All three stories modify governed SKILL.md files under `.github/skills/` — each requires a PR with platform team review per ADR-011 and the platform change policy. The coding agent can prepare and open draft PRs but cannot merge. Human review at PR stage is mandatory.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — MVP scope is fully defined; the attribution field format and H-GOV block criteria are specified in the discovery artefact.

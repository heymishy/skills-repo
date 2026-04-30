# NFR Profile: Non-Engineering Attribution Fields and DoR Governance Enforcement

**Feature:** 2026-04-30-governed-distribution-and-onboarding (Initiative 3 — i3.1, i3.2, i3.3)
**Created:** 2026-04-30
**Last updated:** 2026-04-30
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only.

All three I3 stories modify SKILL.md instruction text only. There is no runtime code path, no HTTP request, and no computation that would be subject to a latency or throughput SLA. The SKILL.md changes are read by a language model at skill invocation time; model response latency is outside the scope of these stories.

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| (none) | — | — | — |

**Source:** Not defined — SKILL.md instruction changes have no measurable performance SLO.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No credentials or PII in SKILL.md | SKILL.md files must not contain credentials, tokens, or personal data | MC-SEC-02 (mandatory constraint) | i3.1, i3.2, i3.3 |
| Input validation | No user-supplied content rendered in HTML without sanitisation | MC-SEC-01 (mandatory constraint) | i3.1, i3.2, i3.3 — N/A (no HTML output) |

**Data classification:**
- [x] Public — no PII, no sensitive data (SKILL.md instruction text is public pipeline governance documentation)
- [ ] Internal
- [ ] Confidential
- [ ] Restricted

**Source:** MC-SEC-01, MC-SEC-02 mandatory constraints assessed at /review (passed, status: na for all three stories).

---

## Data residency

Not applicable. I3 stories produce changes to `.github/skills/` Markdown files. No data is stored, transmitted, or retained by the implementation. No regional boundary constraints apply.

---

## Availability

Not applicable. SKILL.md files are static Markdown — no runtime service, no uptime SLA, no recovery time objective.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| (none) | — | — | — |

**Named sign-off required?**
- [x] Not required — no regulatory clauses apply to SKILL.md instruction changes

---

## Skill UX — quality NFRs

These are the substantive NFRs for Initiative 3. They govern the quality of the skill instruction changes, not a runtime system.

| NFR ID | Description | Acceptance bar | Applies to story |
|--------|-------------|---------------|-----------------|
| NFR-I3-CONSISTENCY | Attribution section formatting must follow existing Markdown conventions in the discovery template (heading level `##`, field format) | Section uses `##` heading, sub-fields use standard label format — verified by test `discovery-attribution-follows-heading-format-conventions` | i3.1 |
| NFR-I3-READABILITY | Attribution field labels and format hints must be clear to a non-technical operator without guidance | Each field includes a parenthetical format hint — verified by test `discovery-attribution-field-labels-readable` | i3.1 |
| NFR-I3-NON-INTERRUPTION | When `Approved By` is already populated, the `/benefit-metric` attribution check adds zero overhead — no extra question, no extra step | Clean-pass path produces no warning, no prompt — verified by test `benefit-metric-clean-pass-for-populated-approved-by` | i3.2 |
| NFR-I3-ACTIONABILITY-I3.2 | Warning message for empty `Approved By` names the specific field missing and states how to fix it | Fail message contains field name, format, remediation — verified by test `benefit-metric-warning-present-for-empty-approved-by` | i3.2 |
| NFR-I3-ACTIONABILITY-I3.3 | H-GOV failure message is self-contained — field name, format, and remediation step, under 200 words | Fail message contains all three parts; word count < 200 — verified by tests `dor-h-gov-fail-message-*` and `dor-h-gov-fail-message-complete-under-200-words` | i3.3 |
| NFR-I3-ZERO-FALSE-POSITIVES | A correctly attributed discovery artefact must never trigger H-GOV — pass condition is unambiguous | Pass condition is text-presence only (non-empty, non-placeholder); no ambiguous edge case blocks a valid artefact — verified by test `dor-h-gov-pass-condition-is-text-presence` | i3.3 |

---

## Gaps and open questions

No NFR gaps identified at 2026-04-30.

All NFRs are covered by automated tests in the respective test plans. No compliance sign-off required. No performance SLOs to baseline.

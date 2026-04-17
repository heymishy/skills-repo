# NFR Profile: Skill Performance Capture

**Feature:** 2026-04-18-skill-performance-capture
**Created:** 2026-04-18
**Last updated:** 2026-04-18
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Governance check script runtime | Completes in under 5 seconds for a typical outer loop artefact set (5–15 files) | Manual timing on first run | spc.5 |

**Source:** Story AC (spc.5)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No credentials in committed files | `model_label` and `cost_tier` in `context.yml` and capture blocks must be descriptive strings only — no API keys, tokens, or credentials | MC-SEC-02 (architecture-guardrails.md) | spc.1, spc.2, spc.3, spc.4 |
| No session data in capture blocks | `fidelity_self_report` field must not contain session tokens, user identifiers, or personal data; template includes an explicit warning comment | MC-SEC-02 | spc.2, spc.3 |
| Script reads artefact files only | `check-capture-completeness.js` must not read, log, or output file contents beyond field presence/absence — no credential exposure risk | MC-SEC-02 | spc.5 |

**Data classification:**
- [x] Public — no PII, no sensitive data (capture blocks record structural metadata only; no user data or credentials)

**Source:** MC-SEC-02 (architecture-guardrails.md), product/constraints.md C11

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| All capture data stays in the local repo | `workspace/experiments/` only — no external services | C11 (product/constraints.md) | All stories |

---

## Availability

No availability SLO defined — this feature is an opt-in operator tooling addition with no uptime requirement.

---

## Compliance

No named compliance frameworks apply. This feature adds tooling to the platform that records structural metadata about skill execution. No regulated data is captured.

---

## Accessibility

Not applicable — this feature produces no user interface.

---

## Consistency and schema integrity

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Field name consistency across schema, instruction, and check script | Field names in `context.yml` schema (spc.1), capture block template (spc.2), `copilot-instructions.md` instruction (spc.3), and governance check script (spc.5) must match exactly | MC-CONSIST-02, MC-CORRECT-02 (architecture-guardrails.md) | spc.1, spc.2, spc.3, spc.5 |

**Source:** Architecture-guardrails.md mandatory constraints

---

## Summary

No performance SLOs beyond the check script runtime. No PII or regulated data. Primary NFR theme is field-name consistency across four artefacts — a cross-story constraint that the /review skill should verify at story review time.

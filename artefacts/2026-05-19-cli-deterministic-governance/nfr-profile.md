# NFR Profile: CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail

**Feature:** 2026-05-19-cli-deterministic-governance
**Created:** 2026-05-19
**Last updated:** 2026-05-19
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| `skills validate` command latency | < 2 seconds end-to-end for any artefact in the repository | Manual timing (`time node bin/skills validate`) on a representative artefact; also implicitly enforced by the test fixture suite completing in < 10 seconds total | cdg.1, cdg.2 |
| Test fixture suite runtime | < 10 seconds for full 33-fixture suite in `npm test` | npm test wall-clock time; CI timeout | cdg.2 |

**Source:** Story NFR sections (cdg.1, cdg.2). No product-level performance SLO defined for CLI tooling — targets are practical usability thresholds.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Path traversal guard | `cli-outer-loop.js` must resolve artefact path with `path.resolve()` and assert it starts with the repository root before reading. Exit code 8 if check fails. Do not log the raw path value. | OWASP A01:2021 (Broken Access Control) | cdg.1, cdg.2 |
| Read-only enforcement | The validate command must not write to any file. No `fs.writeFile`, `fs.appendFile`, or `fs.writeFileSync` calls permitted in `cli-outer-loop.js`. | Product constraint 3 (Spec immutability) | cdg.1, cdg.2 |
| No credentials in output | CLI stderr/stdout output must not contain session tokens, API keys, git credentials, or operator email addresses. `git config user.email` is not called in Phase 1 (validate only). | MC-SEC-02 | cdg.1, cdg.2 |
| No external network calls | `cli-outer-loop.js` must not make any HTTP request or subprocess call to external tools. Pure file reads and in-process logic only. | Product technical constraint (no subprocess calls in Phase 1) | cdg.1, cdg.2 |
| Fixture data safety | Test fixture artefact strings must not contain real operator names, email addresses, or live repository paths from the workspace. Use anonymised placeholders (e.g. `operator-a`, `test-story-slug`). | MC-SEC-02 | cdg.2 |

**Data classification:**
- [x] Internal — pipeline artefacts contain delivery planning data (story ACs, benefit metrics, gate statuses). Not public; low sensitivity. No PII. No financial or health data.
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** OWASP Top 10 (A01, A03); `.github/architecture-guardrails.md` security constraints; product constraints 3 and 5; MC-SEC-02 from `governance-package.js` architecture notes.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Local filesystem only | All artefact reads are from the local repository clone. No data leaves the local machine in Phase 1 (validate is pure file reads). | No regulatory basis — Phase 1 has no network activity | cdg.1, cdg.2 |

---

## Availability

No availability SLA. The `skills validate` command is a developer CLI tool, not a service. It runs on demand in developer terminals and CI. Availability is determined by the operator's Node.js installation and the repository clone.

---

## Accessibility

Not applicable. The CLI produces text output to a terminal. No UI rendering. Screen reader compatibility is inherent in terminal output.

---

## Audit logging

Phase 1 (validate only) produces no audit log entries. The validate command reads artefacts and exits with a code — it produces no persistent record.

Phase 2 will introduce `skills emit-trace` to produce append-only trace.jsonl entries. That is out of scope here and will be covered in the Phase 2 feature's NFR profile.

---

## Compliance frameworks

None applicable to Phase 1. The `skills validate` command is a platform tooling component — not itself subject to PCI DSS, GDPR, HIPAA, or other regulatory frameworks. The CLI's purpose is to help the platform demonstrate compliance to auditors (T3M1), but the CLI itself carries no regulatory obligations.

---

## Dependencies and constraints summary

- Zero new npm dependencies (runtime or dev) — all Node.js built-ins only
- No build step required — `bin/skills` is a plain Node.js script
- Must run on Linux (CI) and Windows PowerShell (`node bin/skills validate`)
- Must not break any existing npm test fixtures (zero regression tolerance)
- `bin/skills` must include Unix shebang line (`#!/usr/bin/env node`) for Linux/CI compatibility

---

## Status: Active — reviewed at definition (2026-05-19)

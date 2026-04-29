# NFR Profile: Reverse-engineer reference corpus outputs and companion skill

**Feature:** `2026-04-30-reverse-engineer-reference-corpus`
**Author:** Copilot
**Date:** 2026-04-30
**Reviewed:** 2026-04-30 — all NFRs confirmed by story authors; no compliance clauses; no sensitive data.

---

## Data Classification

**Classification:** Non-sensitive — all artefacts produced by this feature are SKILL.md instruction files and markdown reference documents. No personal data, credentials, PII, PCI, or regulated data is involved.

---

## NFR Inventory

| ID | Category | Constraint | Stories affected | Testable? | Test reference |
|----|----------|-----------|-----------------|-----------|----------------|
| NFR-rrc-size-re | Performance / Size | Total `/reverse-engineer` SKILL.md line count ≤ 650 after rrc.1 + rrc.2 additions (combined budget ~30 new lines) | rrc.1, rrc.2 | Yes | T1.6 (rrc.1), T2.13 (rrc.2) |
| NFR-rrc-size-disc | Performance / Size | `/discovery` SKILL.md additions for rrc.3 ≤ 15–20 lines maximum | rrc.3 | Yes | T3.9 (rrc.3) |
| NFR-rrc-size-rcu | Performance / Size | New `/reference-corpus-update` SKILL.md ≤ 100 lines total | rrc.4 | Yes | T4.14 (rrc.4) |
| NFR-rrc-readability-seed | Usability | `discovery-seed.md` format must be plain markdown, readable by a human without tooling | rrc.1 | Manual | rrc.1 verification Scenario 2 |
| NFR-rrc-readability-idx | Usability | `constraint-index.md` must be human-readable in a standard markdown viewer as a simple table | rrc.2 | Manual | rrc.2 verification Scenario 2 |
| NFR-rrc-readability-rcu | Usability | The DEEPEN scope output in `/reference-corpus-update` must be a human-readable plain markdown list, not JSON or machine-only format | rrc.4 | Manual | rrc.4 verification Scenario 4 |
| NFR-rrc-security | Security | No executable code, no scripts, no npm dependencies — all changes are SKILL.md instruction additions only | rrc.1, rrc.2, rrc.3, rrc.4 | Yes (governance check) | `check-skill-contracts.js` passes for all stories; `npm test` chain |
| NFR-rrc-no-deps | Dependencies | Zero new npm dependencies introduced by any rrc story | rrc.1, rrc.2, rrc.3, rrc.4 | Yes | Implicit in `check-skill-contracts.js` and `npm test` |

---

## Compliance NFRs

None. No regulatory clauses apply. No named compliance framework is in scope.

**Human sign-off required:** No (no compliance NFRs).

---

## NFR coverage gaps

None. All NFRs are either tested by the automated test scripts or verified by manual scenarios in the verification scripts. No UNCERTAIN items.

---

## H-NFR-profile sign-off

NFR profile reviewed: 2026-04-30
All story NFR declarations accounted for in the inventory above.
No compliance NFRs requiring separate human sign-off.
Data classification confirmed: Non-sensitive.

# Decision Log: test-fixture-hardening-continuation

**Feature:** Test Fixture Hardening Continuation
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Last updated:** 2026-10-30

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

**2026-10-30 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed to the inner coding loop for `tfhc-s1`/`tfhc-s2`/`tfhc-s3`/`tfhc-s4` without a pre-code domain-expert review of the 4 AC verification scripts (DoR Warning W4).
**Alternatives considered:** Pause DoR sign-off until the 4 verification scripts (`artefacts/2026-10-30-test-fixture-hardening-continuation/verification-scripts/`) are read and confirmed correct before coding starts.
**Rationale:** Same precedent as the `test-suite-infra-refactor` epic's identical RISK-ACCEPT (2026-10-29) — solo-operator posture, one entry covers the set rather than four separate ones. The scripts remain available to read at `/verify-completion` or as a post-merge smoke test; nothing about reviewing them pre-code vs. post-code changes what they check.
**Made by:** Hamish King, Platform Owner
**Revisit trigger:** If a `/verify-completion` run finds a verification scenario doesn't actually match the real behaviour (a sign the pre-code review would have caught something), revert to requiring pre-code review for future stories in this repo.

---

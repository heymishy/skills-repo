# Decision Log: test-suite-infra-refactor

**Feature:** Test Suite Infrastructure Refactor
**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Last updated:** 2026-10-29

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

## Log entries

---
**2026-10-29 | SCOPE | /clarify**
**Decision:** MVP scope now includes a dedicated self-test for the shared `mockReq`/`mockRes` fixture module itself, in addition to the fixture module.
**Alternatives considered:** Rely on the 42 `journey.js`-touching consumer files' own existing assertions to catch a regression in the shared fixture indirectly, with no dedicated test for the fixture module itself.
**Rationale:** Bounds the "blast radius" risk named in discovery.md's Assumptions section — a bug in the shared module could otherwise ripple across all 42 consumers at once instead of being isolated to one file. This repo already holds its other two pieces of shared test infrastructure to this bar (`tests/check-wuce17-e2e-infra.js` for the Playwright E2E fixture layer, `tests/check-pcr-s1-test-runner.js` for `scripts/run-all-tests.js` itself) — adding a third exception would be the inconsistent choice, not the conservative one.
**Made by:** Hamish King, Platform Owner (confirmed via /clarify)
**Revisit trigger:** No obvious trigger — this is the repo's existing convention, not a new risk bet.
---

**2026-10-29 | DESIGN | /clarify**
**Decision:** Adoption of the shared fixture is enforced via one small structural check (`check-journey-fixture-usage.js`, same shape as the existing `check-design-tokens.js` / H-DESIGN gate), wired into `/review` as a new finding category — not an advisory `/review` checklist line.
**Alternatives considered:** (1) Accept organic adoption with no enforcement mechanism, re-assessing if the next slice's metrics show it isn't happening. (2) An advisory `/review` checklist line ("new/modified journey.js test touching mockReq must use the shared fixture").
**Rationale:** `product/constraints.md` #13 ("Structural governance preferred over instructional") explicitly states that where a governance property can be enforced by a CI/review gate independently of agent behaviour, it must be — a checklist line is advisory and can be skipped, exactly the failure mode this constraint exists to prevent. A structural grep-based check has a direct, cheap precedent in this repo (`check-design-tokens.js`) and gives the Success Indicators section's "100% of new journey.js-touching stories use it" target real teeth rather than a hope. Not promoted to a full `/definition-of-ready` hard block in this first slice — that's a next-slice decision once the pattern's proven at `/review` first.
**Made by:** Hamish King, Platform Owner (confirmed via /clarify)
**Revisit trigger:** If the next slice's adoption metric shows the `/review` finding alone isn't sufficient (e.g. findings are routinely overridden without a logged RISK-ACCEPT), promote to a `/definition-of-ready` hard block.
---

---

## Architecture Decision Records

<!-- None yet for this feature — both decisions above are lightweight log entries, not structural/irreversible enough to warrant a full ADR. -->

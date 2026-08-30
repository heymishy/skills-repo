# NFR Profile: Per-stage fixture-existence fallback

**Feature:** 2026-08-30-mock-scenario-per-stage-fallback
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible added cost | One `fs.existsSync` call per stage-session creation, only when `e2eMockScenario` is set | Code review | msps-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No weakening of the mock-gateway production hard override | Unchanged — `hasFixture` is a pure read-only check, not a new activation path | Matches mgss-s1's own NFR profile | msps-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (test/dev tooling flag; no new data category)

---

## Data residency

Not applicable.

## Availability

Not applicable — no new SLA introduced.

## Compliance

Not applicable.

## Gaps and open questions

None identified at 2026-08-30.

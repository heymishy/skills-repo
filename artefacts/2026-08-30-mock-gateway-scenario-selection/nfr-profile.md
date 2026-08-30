# NFR Profile: Mock-gateway scenario selection and fixture gaps

**Feature:** 2026-08-30-mock-gateway-scenario-selection
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new latency or model/network calls | Fixture-file selection logic only; no new async call sites | Code review of the call site | mgss-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| `e2eMockScenario` never activates in production | Gated behind the existing `isMockGatewayEnabled()` hard override (`NODE_ENV=production` always disables, regardless of any flag) | Matches the identical existing `e2eForceFailStage` mechanism | mgss-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (test/dev tooling flag; no new data category introduced)

**Source:** This story's own Architecture Constraints.

---

## Data residency

Not applicable.

---

## Availability

Not applicable — no new SLA introduced.

---

## Compliance

Not applicable.

---

## Gaps and open questions

None identified at 2026-08-30.

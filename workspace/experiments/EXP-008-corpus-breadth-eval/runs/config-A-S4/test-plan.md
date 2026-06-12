# Test Plan: Experience API Layer — Card Services Platform Migration

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S4)
**Feature slug:** experience-api-card-services
**Date:** 2026-05-18
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S4

---

## Test data strategy

Card transaction data is PCI DSS Cardholder Data Environment (CDE) in scope. The following test data rules apply:

- **Synthetic data only** for all unit and integration tests in non-production environments. No real card numbers, real PANs, real transaction records, or real cardholder names in any test fixture.
- **Synthetic PAN format:** Use the Luhn-valid test card ranges defined by PCI SSC (e.g., 4111111111111111 for Visa, 5500005555555552 for Mastercard). These are recognised test PANs and are not real cardholder data.
- **Real card data prohibition in test environments:** Real card data must not be used in any test environment unless that environment has been brought into QSA scope and encryption requirements are confirmed. Story 1.3 integration tests must use synthetic data until T-REDIS-GATE passes.
- **PAN truncation test vector:** Use a synthetic full PAN (e.g., 4111111111111111) as the test input; assert that all cache writes and API responses contain only "1111" (last 4 digits).

---

## Regulated constraint tests

### T-PCI-001 — QSA assessment window selection and component notification

**Constraint:** C1 (PCI DSS — QSA assessment required before go-live; months 8 and 14 only)
**Story:** Story 2.4 AC6
**Type:** Governance / process gate (human-executed verification)

Verification steps:
1. Confirm that the QSA assessment window has been formally selected (month 8 or month 14) and documented in the project plan
2. Confirm that the QSA has been notified of the new CDE components: Experience API gateway, Redis cache, consent validation gateway
3. Assert: written QSA engagement confirmation is on file before any CDE component is deployed to a production-adjacent environment

**Pass condition:** Written QSA engagement confirmation exists; assessment window selection is documented; component scope notification is acknowledged by the QSA.
**Fail condition:** QSA has not been notified; assessment window is not selected; or CDE components are deployed to production without QSA assessment completion.

---

### T-PCI-002 — QSA assessment package completeness

**Constraint:** C1 (PCI DSS QSA assessment gate)
**Story:** Story 2.4 AC1–AC5
**Type:** Document review (human-executed at QSA assessment time)

Verification steps:
1. Verify that the QSA assessment package contains all required sections: architecture documentation (API layer, Redis, consent gateway), network topology diagram, data flow with PAN truncation points, at-rest encryption configuration evidence, PAN truncation test results, cache retention policy documentation, access control documentation
2. Assert: each section is current as of the assessment date; no section is marked "to be provided" at the time of QSA assessment
3. Assert: T-PAN-001 and T-PAN-002 test results are included as evidence

**Pass condition:** All QSA package sections complete, current, and accepted by QSA.
**Fail condition:** Any required section missing; QSA identifies gaps at assessment time.

---

### T-CONSENT-001 — External partner consent gate enforcement

**Constraint:** C2 (CDR-equivalent consent required before external partner access)
**Story:** Story 3.2 AC1–AC3
**Type:** Automated functional test

```
Test: External partner API request without consent token
  Given: Fintech Partner A makes a request to GET /v1/cards/{cardId}/transactions
  When: The request includes a valid partner API key but no consent token
  Then: The consent validation gateway returns HTTP 403
  And: The response body contains error code: CONSENT_REQUIRED
  And: No card data is returned

Test: External partner API request with expired consent token
  Given: Fintech Partner A makes a request with a consent token that expired 1 hour ago
  When: The request is validated by the consent gateway
  Then: HTTP 403 is returned; error code: CONSENT_EXPIRED
  And: No card data is returned

Test: External partner API request with valid consent token for mismatched data type
  Given: Customer has consented to card summary access only (not transaction history)
  When: Fintech Partner A requests transaction history using the valid consent token
  Then: HTTP 403 is returned; error code: CONSENT_SCOPE_INSUFFICIENT
  And: No transaction data is returned

Test: External partner API request with valid consent token for correct data type
  Given: Customer has consented to transaction history access
  When: Fintech Partner A requests transaction history using the valid consent token
  Then: HTTP 200 is returned with transaction history
  And: No full PAN is present in the response
```

**Pass condition:** All four cases return expected responses.

---

### T-CONSENT-002 — Consent management extensibility feasibility decision

**Constraint:** C2 (consent management extensibility unconfirmed)
**Story:** Story 3.1 AC1
**Type:** Governance / process gate (human-executed — month 3 deadline)

Verification steps:
1. Assert: Written feasibility decision from consent management team exists and is dated no later than month 3 of the project
2. Assert: If feasible — card data consent types are defined and the consent management team has confirmed extension does not break existing mortgage consent functionality
3. Assert: If not feasible — alternative consent mechanism is scoped, costed, and approved by Programme Director before Epic 3 delivery is planned
4. Assert: Fintech partner DPAs confirmed as covering card data (Story 3.1 AC4)

**Pass condition:** Written feasibility decision received by month 3; subsequent path (extensible or alternative) is confirmed before Story 3.2 coding begins.
**Fail condition:** No feasibility decision received by month 3; Story 3.2 coding begins without feasibility confirmation.

---

### T-VENDOR-001 — Month-12 migration milestone package submission

**Constraint:** C3 (vendor 6-month extension requires month-12 migration milestone demonstration)
**Story:** Story 4.2 AC3
**Type:** Governance / process gate (human-executed at month 12)

Verification steps:
1. Assert: By month 12, all 11 consumer integrations have been migrated to the Experience API in UAT or production
2. Assert: Migration acceptance sign-offs received from all 11 consumer teams (signed, dated)
3. Assert: Month-12 milestone package compiled and submitted to card core vendor in the format agreed at project initiation
4. Assert: Vendor has acknowledged receipt of the milestone package (written confirmation that the extension basis has been received)

**Pass condition:** All 11 sign-offs received; milestone package submitted and vendor-acknowledged by month 12.
**Fail condition:** Fewer than 11 sign-offs received; milestone package not submitted; vendor does not acknowledge the extension basis.

---

### T-PAN-001 — Full PAN prohibition in Redis cache

**Constraint:** C4 (PCI DSS — raw PAN must never be cached)
**Story:** Story 2.2 AC1, AC2
**Type:** Automated security test

```
Test: Full PAN never written to cache
  Given: A synthetic card core API response containing full PAN: 4111111111111111
  When: The Experience API data transformation layer processes the response
  And: The result is written to the Redis cache
  Then: The cache entry for the transaction record contains only: 1111 (last 4 digits)
  And: No sequence of 16 consecutive digits matching 4111111111111111 is present in the cache entry
  And: The full string "4111111111111111" is absent from the cache write (verified by inspecting the raw cache value)

Test: PAN truncation at API response layer (defence-in-depth)
  Given: A synthetic card core API response containing full PAN
  When: The Experience API returns a response to a consumer
  Then: The response body contains only the last 4 digits of the PAN
  And: No full 16-digit PAN sequence is present in the serialised response JSON
```

**Pass condition:** Both assertions pass against all card data endpoints.
**Fail condition:** Any full PAN sequence found in cache write or API response.

---

### T-PAN-002 — CVV/CVC prohibition in cache and response

**Constraint:** C4 (PCI DSS — SAD must never be stored post-authorisation)
**Story:** Story 2.2 AC3
**Type:** Automated security test

```
Test: CVV/CVC never written to cache
  Given: A synthetic card core API response containing a CVV field: "cvv": "123"
  When: The data transformation layer processes the response
  Then: The cache entry does not contain any field named cvv, cvc, security_code, or equivalent
  And: The cache write contains no 3 or 4 digit string that corresponds to the input CVV value in any field

Test: CVV/CVC never returned in API response
  Given: Any consumer API request to any Experience API endpoint
  Then: The API response does not contain any field named cvv, cvc, security_code, or equivalent
```

**Pass condition:** Both assertions pass for all card data endpoints.
**Fail condition:** CVV/CVC present in any cache write or API response.

---

### T-REDIS-GATE — Redis at-rest encryption prerequisite gate

**Constraint:** C5 (Redis at-rest encryption must be confirmed before caching card data; if not confirmed, Redis caching is not viable under PCI DSS)
**Story:** Story 2.1 AC1–AC5
**Type:** Deployment gate (blocking — must pass before Story 1.3 integration tests with real card data)

```
Gate verification steps (human-executed, then codified as a gate check):
1. Assert: Written confirmation from Head of Security Architecture exists, dated, confirming:
   (a) Azure Cache for Redis tier is Premium or Enterprise (not Basic or Standard)
   (b) At-rest encryption is explicitly enabled in the Redis instance configuration
       (not assumed from platform defaults)
   (c) Encryption key is managed via Azure Key Vault or equivalent; key access
       restricted to Experience API service identity
   (d) Key rotation policy is defined and documented
2. Assert: Redis instance is deployed with private endpoint only; no public endpoint
   accessible from outside the CDE network boundary
3. Assert: Network topology diagram shows Redis within the CDE boundary, consistent
   with the QSA assessment package (Story 2.4)
4. Assert: This gate sign-off document is filed in the QSA evidence package

Automated gate check (CI pipeline gate):
  - The CI/CD deployment pipeline must check for the presence of the gate sign-off
    document before any deployment step that uses Redis with real card data
  - If the gate sign-off document is absent: deployment is blocked; error message:
    "T-REDIS-GATE: Story 2.1 sign-off not found — real card data cache deployment blocked"
  - This gate is enforced in UAT and production environments; it is not enforced
    in local development environments using synthetic data only
```

**Pass condition:** Written security team confirmation on all four criteria exists and is filed; Redis deployed with private endpoint; CI gate check implemented and passing.
**Fail condition:** Any of the four criteria unconfirmed; Redis public endpoint accessible; CI gate not implemented; or Story 1.3 integration tests executed with real card data before this gate passes.

---

## General constraint tests

### T-LPA-001 — Operation-scoped API key enforcement

**Story:** Story 1.1 AC2, AC3
**Type:** Automated functional test

```
Test: Request with no API key is rejected
  Given: Any consumer application makes a request with no API key header
  Then: HTTP 401 is returned

Test: Request with API key scoped to wrong operation is rejected
  Given: Consumer Team A has an API key scoped to GET /v1/cards/*/summary only
  When: Consumer Team A requests GET /v1/cards/{cardId}/transactions
  Then: HTTP 403 is returned (key not scoped for this operation)

Test: Request with API key scoped to correct operation succeeds
  Given: Consumer Team A has an API key scoped to GET /v1/cards/*/summary
  When: Consumer Team A requests GET /v1/cards/{cardId}/summary
  Then: HTTP 200 is returned with card summary data
```

---

### T-LPA-002 — Shared admin service account revocation

**Story:** Story 1.1 AC3, Story 4.2 AC4
**Type:** Integration verification (human-executed at migration completion)

Verification steps:
1. Assert: The shared admin service account is revoked from the Experience API and from all 11 consumer integrations
2. Assert: No active API calls to the card core v3.x API use the shared admin service account; all calls use operation-scoped API keys
3. Assert: The shared admin service account revocation is documented in the access control section of the QSA evidence package

---

### T-CACHE-001 — Cache TTL enforcement

**Story:** Story 2.3 AC1, AC2, AC4
**Type:** Automated integration test

```
Test: Cache entry expires after configured TTL
  Given: A transaction history cache entry is written with TTL = [configured value]
  When: The TTL period elapses
  Then: The cache entry is absent from Redis (key does not exist)
  And: A subsequent request for the same card's transaction history hits the card
       core API directly (cache miss), not the cache

Test: No indefinite cache entries
  Given: Any transaction history cache write
  Then: The Redis key has a TTL configured (TTL > 0)
  And: TTL > 0 is asserted programmatically; a TTL of -1 (no expiry) causes the
       test to fail
```

---

### T-TLS-001 — TLS enforcement for all connections

**Story:** Story 1.1 AC5
**Type:** Configuration verification

Verification steps:
1. Assert: All inbound connections to the Experience API gateway require TLS 1.2 or higher; HTTP (plaintext) connections are rejected
2. Assert: All connections from Experience API to card core v3.x API use TLS; connection configuration is documented
3. Assert: Experience API to Redis connection uses TLS in transit (in addition to at-rest encryption)

---

### T-E2E-001 — End-to-end Experience API regression

**Story:** All Epic 1 stories
**Type:** Automated end-to-end regression test (synthetic data)

```
Test matrix (5 endpoints × operation-scoped API keys × consent gate):
  - GET /v1/cards/{cardId}/summary — returns expected schema; no full PAN
  - GET /v1/cards/{cardId}/transactions — returns up to 90 days; no full PAN;
    cache used on second call within TTL
  - GET /v1/cards/{cardId}/categories — returns spend categories; no full PAN
  - POST /v1/cards/{cardId}/controls — freeze/unfreeze/limit; idempotency enforced
  - POST /v1/cards/{cardId}/disputes — dispute initiated; idempotency enforced

Consent gate matrix:
  - Internal consumer: no consent token required; all 5 endpoints accessible
  - External partner with valid consent: endpoint accessible
  - External partner without consent: HTTP 403
```

---

### T-MIGRATION-001 — Consumer integration migration acceptance (per consumer team)

**Story:** Stories 4.1, 4.2
**Type:** Integration acceptance test (executed per consumer team during migration)

Verification steps (per team):
1. Consumer team confirms that their integration is functional against Experience API v1.0 (end-to-end smoke test with their own test case suite)
2. No active calls from the consumer team's system to card core v2.x API (confirmed by monitoring or consumer team declaration)
3. Signed migration acceptance sign-off received and filed

---

## Plain-language AC verification script (for human review pre-coding and post-merge smoke test)

| AC | Verification step | Human or automated | Gate |
|----|------------------|--------------------|------|
| C1 — QSA gate | T-PCI-001: QSA engagement letter on file; window selected | Human (governance) | T-PCI-001 |
| C1 — QSA package | T-PCI-002: Package complete at assessment time | Human (at assessment) | T-PCI-002 |
| C2 — Consent gate | T-CONSENT-001: HTTP 403 without consent; 200 with valid consent | Automated | T-CONSENT-001 |
| C2 — Feasibility | T-CONSENT-002: Feasibility decision by month 3 | Human (process gate) | T-CONSENT-002 |
| C3 — Month-12 | T-VENDOR-001: All 11 sign-offs; package submitted | Human (process gate) | T-VENDOR-001 |
| C4 — PAN | T-PAN-001: No full PAN in cache or response | Automated (security) | T-PAN-001 |
| C4 — CVV | T-PAN-002: No CVV/CVC in cache or response | Automated (security) | T-PAN-002 |
| C5 — Redis gate | T-REDIS-GATE: Written confirmation; CI pipeline gate | Human + automated | T-REDIS-GATE |

**Total tests:** 14 (T-PCI-001, T-PCI-002, T-CONSENT-001, T-CONSENT-002, T-VENDOR-001, T-PAN-001, T-PAN-002, T-REDIS-GATE, T-LPA-001, T-LPA-002, T-CACHE-001, T-TLS-001, T-E2E-001, T-MIGRATION-001)

# IL-S13 Test Plan — payments.11 Trans-Tasman Routing

**Framework:** Jest (`npm test`)
**Test data strategy:** Synthetic — mock payment objects, mock RBNZ/AUSTRAC clients with controlled watchlist responses, mock SWIFT gateway

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — AU intragroup routes via SWIFT | T1: AU intragroup → SWIFT gateway called; T2: NZ domestic payment → SWIFT gateway NOT called | Full | Routing branch |
| AC2 — Dual-AML blocks on match | T3: RBNZ match → DUAL_AML_HOLD; T4: AUSTRAC match → DUAL_AML_HOLD; T5: both clear → forwarded | Full | |
| AC3 — SWIFT notification artefact | T6: first routing call writes artefact; T7: artefact has all required fields | Full | File system |
| NFR-1 — Sequential screening order | T8: verify RBNZ called before AUSTRAC (mock call order tracking) | Full | |
| NFR-2 — 24h deadline in artefact | T9: `deadlineTimestamp` = routing event time + 86400000ms | Full | |

No test plan gaps.

---

## Unit tests (T1–T9)

### T1 — AU intragroup payment routed via SWIFT (AC1)

**AC:** AC1
**Precondition:** Payment `{ amount: 5000, destinationCountry: 'AU', paymentType: 'INTRAGROUP' }`; dual-AML mocked to return clear
**Expected:** `swiftGateway.forward` called with AU correspondent bank details; `nzDomesticGateway.forward` NOT called

### T2 — NZ domestic payment does not use SWIFT path (AC1 guard)

**AC:** AC1
**Precondition:** Payment `{ amount: 5000, destinationCountry: 'NZ', paymentType: 'STANDARD' }`
**Expected:** `swiftGateway.forward` NOT called; `nzDomesticGateway.forward` called

### T3 — RBNZ match blocks payment with DUAL_AML_HOLD (AC2)

**AC:** AC2
**Precondition:** RBNZ client mock returns `{ match: true, listName: 'RBNZ_SANCTIONED' }`
**Expected:** Router returns `{ status: 'DUAL_AML_HOLD', blockedBy: 'RBNZ_SANCTIONED' }`; SWIFT gateway NOT called

### T4 — AUSTRAC match blocks payment with DUAL_AML_HOLD (AC2)

**AC:** AC2
**Precondition:** RBNZ mock returns clear; AUSTRAC mock returns `{ match: true, listName: 'AUSTRAC_WATCHLIST' }`
**Expected:** Router returns `{ status: 'DUAL_AML_HOLD', blockedBy: 'AUSTRAC_WATCHLIST' }`; SWIFT gateway NOT called

### T5 — Both watchlists clear → payment forwarded (AC2)

**AC:** AC2
**Precondition:** RBNZ mock returns `{ match: false }`; AUSTRAC mock returns `{ match: false }`
**Expected:** `swiftGateway.forward` called; payment status `FORWARDED`

### T6 — SWIFT notification artefact written on first routing call (AC3 + NFR-2)

**AC:** AC3, NFR-2
**Precondition:** First call to `routeTransTasman()`; dual-AML mocked to clear
**Expected:** File `artefacts/swift/routing-notification-draft.md` exists after the call

### T7 — SWIFT notification artefact has required fields (AC3)

**AC:** AC3
**Precondition:** Same as T6; read artefact after routing call
**Expected:** Artefact content contains: `routingRelationship`, `correspondentBank: 'JPMorgan Chase'`, `notificationEmail: 'swiftcorrespondent@jpmorgan.com'`, `deadlineTimestamp`

### T8 — RBNZ screening called before AUSTRAC (NFR-1 / C7)

**AC:** NFR-1 (sequential order per C7)
**Precondition:** Track call order via Jest mock spy; RBNZ and AUSTRAC mocked to clear
**Expected:** `rbnzClient.screen` call timestamp (or call index) precedes `austracClient.screen` call

### T9 — Deadline timestamp is 24 hours after routing event (NFR-2)

**AC:** NFR-2
**Precondition:** Record `Date.now()` immediately before routing call; read `deadlineTimestamp` from artefact
**Expected:** `deadlineTimestamp - routingEventTime` ≈ 86,400,000ms (within 100ms tolerance for test execution)

---

## Gap table

No gaps. T8 is a critical test — it verifies C7 ordering is enforced, not just coincidental. If T8 is omitted, the screener could parallelise RBNZ and AUSTRAC and still pass T3/T4/T5.

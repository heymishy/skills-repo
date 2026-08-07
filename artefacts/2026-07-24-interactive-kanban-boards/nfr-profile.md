# NFR Profile: Interactive Kanban Boards

**Feature:** 2026-07-24-interactive-kanban-boards
**Created:** 2026-07-24
**Last updated:** 2026-07-24
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Session-readiness lookup does not scale linearly with card count | No N+1 per-card session-store round-trips at board-render time | Test asserting session-store read count is bounded, not linear, for a fixed board render | S1.1 |
| Artefact-count lookup does not introduce unbounded per-card query cost | Batched or explicitly bounded/deferred (per AC5 fallback) | Code review + same batching test discipline as S1.1 | S2.2 |

**Source:** Direct code investigation during /definition (2026-07-24) — no pre-existing performance SLO in `product/constraints.md`; these targets are newly identified risks specific to this feature's new per-card data lookups, not generic platform SLOs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | New board-action endpoint (advance) enforces tenant ownership, 404 not 403 on mismatch | ADR-025 (multi-tenancy at application layer); matches existing `bri-s3.4` pattern | S1.1 |
| Authorisation | New item-detail navigation entry point enforces the same tenant-ownership check | ADR-025 | S3.4 |
| Input validation | No new user-supplied content rendered without `escHtml` | Existing repo-wide convention (`html-shell.js`) | S2.1, S2.2 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (journey/feature pipeline state; no PII, no payment data)

**Source:** `.github/architecture-guardrails.md` (ADR-025, Mandatory Constraints — Security section); direct code read of existing tenant-ownership pattern in `products.js`.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no new data storage location or region introduced by this feature.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | Matches this repo's existing web-ui SLA posture — no formal uptime SLA defined anywhere in this codebase to date. |

**Source:** Not defined.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

**Source:** `.github/context.yml` confirms `meta.regulated: false`; no compliance frameworks configured.

---

## NFR AC blocks

**Performance (S1.1, S2.2):**
```
Given a board with N cards across multiple journeys
When the board renders and computes per-card readiness/artefact-count state
Then the number of session-store/artefact-store round-trips does not scale linearly with N
```

**Security (S1.1, S3.4):**
```
Given an operator authenticated to tenant A
When they attempt to advance or view detail for a journey belonging to tenant B (via a known/crafted journey ID)
Then the request is rejected with 404, and no state is written or returned
```

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Exact batching implementation for session-readiness (S1.1) and artefact-count (S2.2) lookups is an implementation-time decision, not fully specified at /definition | Coding agent, documented in `decisions.md` | Before each story's DoR sign-off |
| Accessibility | S3.2's reorder feature may or may not get a non-drag keyboard alternative — coding agent must either provide one or document why it's an acceptable exception | Coding agent, documented in `decisions.md` | Before S3.2's DoR sign-off |

_All other NFR areas: no gaps identified at 2026-07-24._

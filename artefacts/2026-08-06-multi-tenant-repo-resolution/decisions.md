# Decision Log: multi-tenant-repo-resolution

**Feature:** Multi-Tenant Repo Resolution for SaaS Export + Repo-Connection UX
**Discovery reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/discovery.md
**Last updated:** 2026-08-06

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
**2026-08-06 | SLICE | /definition**
**Decision:** Risk-first slicing — `mtrr-s1` (the tenant-scoped repo-resolution fix, a real data-isolation gap) sequenced ahead of `mtrr-s2` (the repo-connection UX improvement), so the security fix ships and is verified independently of the UX work.
**Alternatives considered:** Vertical slice, walking skeleton, user journey.
**Rationale:** This feature's own discovery explicitly flagged the risk of UX scope growth delaying the security fix — risk-first makes that sequencing structural rather than a hope.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None expected.
---

---
**2026-08-06 | ARCH | /review Run 1 (mtrr-s1)**
**Decision:** `mtrr-s1`'s AC3 revised from "error response must not differ observably between not-found and access-denied" to "error body must not reveal repo/owner/tenant identifier, but the existing 404-vs-403 status code distinction from `rb-s4` is preserved."
**Alternatives considered:** Unifying both cases to one indistinguishable response (the original AC3 wording), which would have required changing `rb-s4`'s already-shipped, already-tested error-handling contract.
**Rationale:** The real security concern is leaking *which tenant/repo* a slug belongs to, not that the two error cases must be byte-identical. Preserving `rb-s4`'s existing status-code contract avoids an unnecessary, riskier change to already-shipped behavior while still closing the actual information-leakage gap. Caught at `/review` Run 1, fixed before Run 2 passed clean.
**Made by:** Hamish King — Platform maintainer / Product owner (caught during review), implemented by Claude Code
**Revisit trigger:** If a future security review determines status-code-level distinguishability itself is unacceptable (e.g. for a stricter compliance requirement), revisit this decision explicitly rather than silently changing it.
---

---
**2026-08-06 | RISK-ACCEPT | /definition-of-ready (mtrr-s1, mtrr-s2)**
**Decision:** Proceed past `/definition-of-ready` for both stories without W4 (verification script reviewed by a domain expert) being resolved first.
**Alternatives considered:** Pause DoR sign-off until a human reviewer works through each verification script.
**Rationale:** Same rationale as every other story this session (`repo-bootstrap-no-fork`, `agency-client-organisations`) — the scripts were written directly from stories/test-plans already shaped by active operator direction; real first walkthrough happens as post-merge smoke test.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals a verification script described the wrong expected behaviour, treat as a pattern signal.
---

---

## Architecture Decision Records

<!-- None yet for this feature — the AC3 fix above was lightweight enough for a log entry, not a full ADR. -->

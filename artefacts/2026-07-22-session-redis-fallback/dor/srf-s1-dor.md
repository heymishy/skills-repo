## Definition of Ready: Session middleware Redis fallback on cache miss

**Story reference:** `artefacts/2026-07-22-session-redis-fallback/stories/srf-s1-session-middleware-redis-fallback.md`
**Test plan reference:** `artefacts/2026-07-22-session-redis-fallback/test-plans/srf-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

**CONTRACT REVIEW:** Contract Proposal (see `srf-s1-dor-contract.md`) reviewed against all 5 ACs and the test plan. No mismatches found. ✅ Contract review passed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "an operator or user completing the GitHub OAuth login flow" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 covered (U1-U6, IT1) |
| H4 | Out-of-scope populated | ✅ | 4 items, most importantly the operator-declined accessToken-caching boundary |
| H5 | Benefit linkage references a named metric | ✅ | "Login flow reliability" |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None declared — modifies existing, already-merged infra directly, no upstream story dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 2 constraints, incl. the explicit operator-confirmed scope boundary |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — pure server-side session logic |
| H-NFR | NFR profile / story NFR field | ✅ | Story's own NFR section populated (performance, security, resilience, accessibility) |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story-level NFRs are concrete and sufficient for this narrow, single-file-class fix; no dedicated feature nfr-profile.md needed |
| H-ADAPTER | New adapter method has wiring/scoping AC | ✅ | `readSession` is a read-only addition to an already-wired adapter (`session-redis.js`, already used via `_activeRedis()`) — no new D37 wiring ceremony needed since the adapter itself is unchanged in its wiring mechanism |

**All hard blocks pass.**

**H-MIG / H-INF applicability check:** Neither applies — no schema change, no infrastructure change (Redis is already provisioned and already being written to; this only adds a read).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | — | None raised |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not yet reviewed by a human before coding begins | Operator to review `srf-s1-verification.md` before/alongside coding |
| W5 | No uncertain gap-table items | ✅ | — | The one noted gap (no live-Upstash integration test) is explicitly resolved via a live post-deploy verification step, matching this session's own established pattern for the tmc-s1 SQL fix |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Session middleware Redis fallback on cache miss — artefacts/2026-07-22-session-redis-fallback/stories/srf-s1-session-middleware-redis-fallback.md
Test plan: artefacts/2026-07-22-session-redis-fallback/test-plans/srf-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add readSession(id) to session-redis.js (client.get(KEY_PREFIX + id),
  parse if string, return null if not found or no client configured) --
  a natural fourth method alongside the existing writeSession/deleteSession/
  loadAllSessions.
- sessionMiddleware in session.js becomes async. On in-memory cache miss:
  if a cookie session ID was present AND a Redis adapter is configured,
  await a readSession call; on a hit, rehydrate into the in-memory Map
  under the SAME id and use it (no new Set-Cookie); on a miss (or no
  cookie, or no Redis configured), fall through to creating a new session
  exactly as today.
- Do NOT touch accessToken handling -- it must remain absent after
  rehydration, exactly as _sanitise/_sanitiseForRedis already strip it.
  Do not add any code path that could restore or fabricate it.
- Update the single call site in server.js's router function to
  `await sessionMiddleware(req, res)`.
- Re-run tests/check-sec5-session-rotation.js before and after -- it is a
  KNOWN pre-existing baseline failure (documented, unrelated to this
  story) -- confirm the failure count/shape is unchanged, not newly broken
  or newly fixed by this change (either would be a signal worth flagging).
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only (solo-operator context)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed via explicit "harden session lookup to fall back to Redis per-request" instruction, with the accessToken-caching scope boundary explicitly discussed and declined before this DoR was written

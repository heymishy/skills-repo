# Review Report: CSRF tokens on server-rendered form POST endpoints — Run 1

**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md
**Test plan reference:** artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s3-test-plan.md
**Date:** 2026-07-14
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[3-M1]** D — The story's Out of Scope section lists 8+ additional form-rendered POST routes (`/journey/wizard`, `/api/journey`, annotations, product forms, etc.) as deferred to "a follow-up story" without that follow-up story existing yet. Risk if proceeding: the gap could be forgotten once this story ships and the parent DoR's CSRF line item reads as closed.
  To acknowledge: record a RISK-ACCEPT in `artefacts/2026-07-01-security-perf-hardening/decisions.md` naming the deferred routes explicitly, so `/trace` and a future `/improve` pass can find the gap. Acknowledged below — will be logged at DoR sign-off.

- **[3-M2]** E — `handleRoot`'s existing AC6 ("never contains session tokens or user identity data") is being reinterpreted in this story's Architecture Constraints to permit CSRF-token injection. This is a reasonable reading (a CSRF token is not identity data), but it is a judgment call on an existing AC's intent, not a change to that AC's text. Risk if proceeding: a future reviewer unfamiliar with this story's rationale could flag the injected token as an AC6 regression.
  To acknowledge: the rationale is already recorded in the story's Architecture Constraints section — sufficient; no separate decisions.md entry required since no contract is being overridden, only interpreted.

---

## LOW findings — note for retrospective

- **[3-L1]** C — AC5 and AC6 in the story are process/testing-shape ACs (how the tests must be structured) rather than pure observable-behaviour ACs. This is intentional here (mirroring `CLAUDE.md`'s explicit D37 behavioural-correctness mandate) but is a slight deviation from strict AC style — noted, not blocking.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome:** PASS

Scores — A-Traceability: 5 (parent DoR deferral cited, sibling story called out, existing `oauthState` precedent cited), B-ScopeIntegrity: 4 (broad POST inventory scoped down explicitly, deferred items named), C-ACQuality: 4, D-Completeness: 4 (pending decisions.md RISK-ACCEPT for 3-M1, to be logged at DoR). Category E: no violations found — new adapter/module (`csrf.js`) does not introduce a D37 injectable-adapter pattern (it has no external system dependency to stub/wire), so D37 does not apply to it directly; `requireAdmin`/`authGuard` gating order preserved (CSRF check added, not substituted).

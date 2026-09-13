# Decision Log: dod-live-verification-gate

**Feature:** Require verification-strength tagging and a live UI-evidence gate at /verify-completion and /definition-of-done
**Discovery reference:** None — short-track
**Last updated:** 2026-09-13

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `ARCH` | Architecture or significant technical design |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-09-13 | ARCH | operator decision**
**Decision:** Apply both the stale `2026-08-29-verify-completion-improve-proposal.md` and the new `/definition-of-done` verification-strength/UI-evidence requirement directly, in one PR — not as a fresh `/improve` proposal cycle waiting for separate review.
**Alternatives considered:** (a) Write a proper `/improve` proposal for both and leave them `pending_review` like the existing convention — rejected: the existing 2026-08-29 proposal already sat unreviewed for two weeks before this same sweep found it, which is itself direct, first-party evidence that the proposal-then-separate-review cycle is exactly the "written up and ignored" failure mode being fixed. (b) Apply only the new DoD-side change and separately triage the stale proposal — rejected as needless splitting; both address the same underlying gap (a `COMPLETE` verdict resting on evidence weaker than the AC's real claim) at the two different gates (pre-merge, post-merge) it needs to hold at.
**Rationale:** In a solo-operator repo, the "propose then wait for review" step exists to create a deliberate pause before a governance-file change — but that pause has a cost (this proposal already paid it, for two weeks, with nothing gained) when the operator is the one both raising and reviewing the change in the same conversation. Applying directly, with the operator reviewing the actual diff before merge (the same review a PR would provide), keeps the real safeguard (human review before merge) without the part that was demonstrably not working (an indefinite queue).
**Made by:** Hamish King (operator choice, via AskUserQuestion)
**Revisit trigger:** If this repo moves to a multi-person operating model where "propose then review" separates two different people, reinstate the full `/improve` proposal-and-wait cycle for skill-behaviour changes — the collapsed version here assumes reviewer and proposer are the same person.
---

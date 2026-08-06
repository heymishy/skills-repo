# Decision Log: durable-artefact-storage

**Feature:** Durable Artefact Storage for SaaS-Hosted Journeys
**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
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
**2026-08-06 | ASSUMPTION | /clarify**
**Decision:** The existing GitHub OAuth token (already used by `mtrr-s2`'s repo-listing) carries sufficient write/push scope to commit artefact files via the Contents API — validated TRUE.
**Alternatives considered:** A platform-level bot/app installation token, if the user's own OAuth token had turned out read-only.
**Rationale:** Confirmed directly in `src/web-ui/auth/oauth-adapter.js:51` — the authorize URL requests `scope=repo,read:user[,read:org]`. GitHub's `repo` scope is full read/write, not read-only. No new auth model is needed; this resolves the single biggest scope risk identified at discovery.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct code inspection during /clarify)
**Revisit trigger:** If the OAuth scope request is ever narrowed (e.g. to `public_repo` or removed entirely) for an unrelated reason, re-verify this assumption before relying on it.
---

---
**2026-08-06 | ASSUMPTION | /clarify**
**Decision:** The "repo required before first journey" gate applies to new products only. Existing repo-less products are explicitly out of scope for retroactive migration or blocking — they continue working exactly as today.
**Alternatives considered:** (B) apply to all products immediately, blocking existing repo-less products from journey progress; (C) new products required, existing products nudged but not blocked.
**Rationale:** Smallest, least disruptive MVP boundary. Avoids forcing a migration decision onto existing (possibly in-progress) products as a side effect of a durability fix. Revisit once real usage data shows whether existing-product orphaning is a live problem worth a follow-on story.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If an existing repo-less product's journey gets orphaned by a future redeploy and this becomes a repeated real complaint, reconsider extending the gate to existing products (Option B or C).
---

---
**2026-08-06 | ASSUMPTION | /clarify**
**Decision:** Other code paths that read artefacts via local `fs.readFileSync` (13 call sites found in `journey.js` alone) can safely tolerate this change, because the fix is a **dual-write** (git commit added alongside the existing local-disk write, not a replacement of it) rather than a wholesale migration off local disk.
**Alternatives considered:** Replacing local disk entirely with git as the sole read/write source — rejected because it would require touching or providing git-backed equivalents for all 13 internal same-request read call sites in `journey.js`'s stage-transition logic, a much larger and riskier change than the durability problem actually requires.
**Rationale:** All 13 existing call sites read artefact content synchronously within the same request/session that wrote it — always within the same deploy's lifetime, never at risk from the redeploy-wipe problem this feature exists to fix. Only the cross-redeploy "Resume conversation" read path needs a git-fallback. This narrows the actual MVP engineering scope considerably compared to the originally-drafted "read from git as source of truth" framing.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct grep audit of `journey.js` during /clarify)
**Revisit trigger:** If a future story needs to remove local disk writes entirely (e.g. for a stateless/multi-region deployment model), revisit whether the 13 internal read call sites still hold under that new constraint.
---

---
**2026-08-07 | RISK-ACCEPT | /definition-of-ready (das-s1, das-s2)**
**Decision:** Proceed past `/definition-of-ready` for both stories without W4 (verification script reviewed by a domain expert) being resolved first.
**Alternatives considered:** Pause DoR sign-off until a human reviewer works through each verification script.
**Rationale:** Same rationale as every other story this session — the scripts were written directly from stories/test-plans already shaped by active operator direction; real first walkthrough happens as post-merge smoke test.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a post-merge smoke test reveals a verification script described the wrong expected behaviour, treat as a pattern signal.
---

---

## Architecture Decision Records

<!-- None yet for this feature — the write-then-verify sequencing hazard noted in discovery.md's Assumptions and Risks section is flagged for /definition to turn into an explicit AC, not yet a full ADR. -->

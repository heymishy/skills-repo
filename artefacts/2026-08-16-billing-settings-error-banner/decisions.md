# Decision Log: billing-settings-error-banner

**Feature:** Show a visible error banner on Settings when a billing-portal redirect carries an error
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-16

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
**[2026-08-16] | DESIGN | story authoring (bse-s1) — unrecognized `error` values show no banner, not a generic fallback**
**Decision:** When `req.query.error` is present but does not match either of `bpe-s1`'s two known codes (`no_billing_account`, `billing_unavailable`), `handleGetSettings` renders no banner at all, rather than a generic "Something went wrong" fallback message.
**Alternatives considered:** (1) Show a generic fallback banner for any non-empty `error` value — rejected: a vague message tied to an action the user may not have taken (an unrecognized value could be a stray/typo'd query param, a browser history artifact, or a future error code from a not-yet-deployed change this story has no visibility into) risks being more confusing than showing nothing, and would require inventing wording not grounded in any real, currently-known failure mode. (2) Show the raw `error` value's text as the message — rejected outright on security grounds (reflected-content risk on a user-controlled query parameter — see NFR profile, Security).
**Rationale:** The story's actual scope is narrowly "make `bpe-s1`'s two known error codes visible" (per `beta-006.md`'s triage) — not "handle arbitrary error query values generically." Failing silently for anything outside that known set is strictly no worse than today's behaviour (nothing renders either way) and avoids fabricating a message for a condition this story cannot describe accurately.
**Made by:** Claude (agent), story authoring
**Revisit trigger:** If a third billing-portal error code is ever introduced upstream (in `billing.js` or elsewhere), extend the allowlist dictionary rather than adding a generic fallback.
---

---
**[2026-08-16] | ASSUMPTION | story authoring (bse-s1) — query-string parsing follows the codebase's existing `req.query` convention, not a new `req.url` parser**
**Decision:** `beta-006.md`'s triage described the root cause as "`handleGetSettings` never parses `req.url`'s query string" and suggested the fix in those terms. Before implementing, the actual established convention across this codebase's other route handlers was checked directly (`grep -n "req.query" src/web-ui/routes/*.js` and a read of `src/web-ui/server.js`): the router already parses the URL's query string into `req.query` before any handler runs (`server.js:1913`, `req.query = parseQuery(parsed.searchParams);`), and every other handler that needs a query parameter reads `req.query.X` (`billing.js:219`, `products.js:1334`, `journey.js:3130`, `account-linking.js:106`, and others). This story implements the fix as `req.query && req.query.error`, matching that established convention, rather than hand-rolling a second `req.url`/`URLSearchParams` parser inside `settings.js` as `beta-006.md`'s literal wording might suggest.
**Alternatives considered:** Parse `req.url` directly inside `settings.js` (matching `beta-006.md`'s literal description) — rejected: this codebase already has a working, tested, universally-used query-parsing layer at the router level; adding a second, file-local parsing mechanism would be an inconsistent pattern with no benefit.
**Rationale:** `beta-006.md`'s grep-based root-cause description (`req.url`/`URLSearchParams`/`query` all absent from the handler) was accurate as a diagnosis of the symptom (no query parsing of any kind occurs) but was not a prescription for which parsing mechanism to add. Verifying against the actual codebase convention before implementing avoids introducing an inconsistent second pattern.
**Made by:** Claude (agent), via direct grep/read verification before writing the story
**Revisit trigger:** None — this is a closed, evidence-based implementation choice.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, bse-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path, matching the precedent already established by `tmss-s1`, `pcr-s1`, `nia-s1`, and `bcf-s1`, all of which reached DoR sign-off (or DoD-complete, for `pcr-s1`) with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** Re-derive the H-GOV reasoning from scratch — rejected per this repo's own instruction to cite prior precedent directly rather than re-deriving; the underlying facts (short-track has no discovery.md by design) are identical to the prior cases.
**Rationale:** The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context — same reasoning already logged by `tmss-s1`/`nia-s1`/`bcf-s1`.
**Made by:** Claude (agent), citing `bcf-s1`'s `decisions.md` entry (2026-08-16) as direct precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

---
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, bse-s1)**
**Decision:** Proceeding with DoR sign-off on `bse-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — deferred for the same practical reason applied consistently across this repo's other recent short-track features (`tmss-s1`, `nia-s1`, `bpe-s1`, `bcf-s1`): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; unlike `nia-s1`'s AC3, this story has no CSS-layout-dependent gap for the script to be the sole safety net for — all 4 ACs are already fully covered by automated tests, so the verification script here is a defense-in-depth smoke check, not the only verification path for any AC.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---


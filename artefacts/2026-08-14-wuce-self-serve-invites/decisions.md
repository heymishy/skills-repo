# Decision Log: wuce-self-serve-invites

**Feature:** Self-serve team invite flow
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Last updated:** 2026-08-14

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
**[2026-08-14] | SCOPE | clarify**
**Decision:** Email delivery of invites is brought INTO MVP scope, reversing the original discovery draft's Out of Scope item #3 ("Email delivery of invites — MVP is the admin generating a link and sharing it themselves"). Invites are also now per-person (admin names a specific email address) rather than a reusable tenant-wide link.
**Alternatives considered:** (A) Admin generates a shareable link and shares it themselves (Slack/email, however they normally communicate) — the original discovery draft's MVP framing; rejected during /clarify as too manual to actually feel "self-serve" from the invitee's side. (B) Reusable tenant-wide link with no per-person tracking — the original discovery draft's Q1 framing; rejected once email delivery came into scope, since sending an email requires a named recipient anyway.
**Rationale:** Once the operator raised "but maybe we need email delivery in scope" during /clarify, per-person invites became the natural shape — you need a specific email address to send to, which also substantially reduces the original leaked-link security risk (a leaked per-person invite only grants access as that named person's role, not open access to anyone who finds it).
**Made by:** Hamish King — Platform owner (raised the scope question); Claude (agent) confirmed the resulting shape and updated the discovery artefact
**Revisit trigger:** If beta usage shows admins frequently want to invite multiple people at once, bulk/CSV invite (currently Out of Scope) should be reconsidered as a fast follow-up.
---

---
**[2026-08-14] | SCOPE | clarify**
**Decision:** Role selection is required on every invite — no silent default role.
**Alternatives considered:** A silent default (lowest non-viewer role, "engineer") if the admin doesn't specify — the original discovery draft's assumption; rejected in favour of requiring an explicit choice.
**Rationale:** Operator's explicit choice during /clarify Q2. A required field is simpler to build than a default-with-override and removes any ambiguity about what role a self-serve joiner ends up with.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** None obvious — this is a straightforward form-field requirement, not likely to need revisiting.
---

---
**[2026-08-14] | ARCH | clarify**
**Decision:** Seat/plan limit enforcement happens at invite-ACCEPTANCE time, not at invite-creation time.
**Alternatives considered:** (A) Block invite creation if the tenant is already at its seat limit — rejected as overly restrictive, since seats can free up between invite creation and acceptance (e.g. another teammate leaves). (B) No seat-limit check on this path at all for MVP — rejected as a real gap that would let self-serve joins bypass existing billing enforcement.
**Rationale:** Operator's explicit choice during /clarify Q3. This matches how limits are more commonly enforced in practice (at the point of consumption, not reservation) and avoids blocking legitimate invite creation for a limit that may no longer apply by the time it matters.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If beta feedback shows admins are confused by being able to create an invite that then fails at acceptance time, reconsider creation-time pre-checking with a warning (not a hard block) instead.
---

---
**[2026-08-14] | SCOPE | clarify**
**Decision:** Invites expire 24 hours after creation. This is the MVP's entire invite-lifecycle rule — manual revoke and resend remain explicitly Out of Scope.
**Alternatives considered:** (A) No expiry, valid until manually revoked — rejected, since revoke is also out of scope for MVP, meaning "no expiry" would mean invites are effectively permanent. (B) 7 days — proposed by the agent during /clarify as a reasonable default; operator specified 24 hours instead, a materially tighter window.
**Rationale:** Operator's explicit choice during /clarify Q4. A fixed, short expiry gives a real security bound without requiring any invite-management UI — the tradeoff of a 24-hour window (rather than a longer one) is the operator's own call on how much friction is acceptable if an invitee doesn't act quickly.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If beta feedback shows 24 hours is too short (invitees frequently miss the window and need a new invite), reconsider the window length — this does not require reconsidering whether a fixed expiry exists at all.
---

## Architecture Decision Records

<!-- None recorded yet — the seat-limit-at-acceptance decision above is logged as an ARCH entry rather than a full ADR, consistent with this repo's own practice of reserving full ADRs for structural decisions with broader platform-wide implications. -->

---

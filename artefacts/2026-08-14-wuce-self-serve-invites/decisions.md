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
**Correction note [2026-08-15]:** The "no seat-limit check... rejected as a real gap that would let self-serve joins bypass existing billing enforcement" framing above assumed an existing seat-limit mechanism to bypass. Verified at /definition: no such mechanism exists anywhere in wuce today (see the correction entry below). The acceptance-time-not-creation-time TIMING decision itself remains correct and unchanged; what changes is that this feature now builds the FIRST seat-limit enforcement, not integrating with a pre-existing one.
---

---
**[2026-08-14] | SCOPE | clarify**
**Decision:** Invites expire 24 hours after creation. This is the MVP's entire invite-lifecycle rule — manual revoke and resend remain explicitly Out of Scope.
**Alternatives considered:** (A) No expiry, valid until manually revoked — rejected, since revoke is also out of scope for MVP, meaning "no expiry" would mean invites are effectively permanent. (B) 7 days — proposed by the agent during /clarify as a reasonable default; operator specified 24 hours instead, a materially tighter window.
**Rationale:** Operator's explicit choice during /clarify Q4. A fixed, short expiry gives a real security bound without requiring any invite-management UI — the tradeoff of a 24-hour window (rather than a longer one) is the operator's own call on how much friction is acceptable if an invitee doesn't act quickly.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If beta feedback shows 24 hours is too short (invitees frequently miss the window and need a new invite), reconsider the window length — this does not require reconsidering whether a fixed expiry exists at all.
---

---
**[2026-08-15] | ASSUMPTION | definition (architecture constraints scan) — SUPERSEDED, see entry below**
**Decision:** The discovery artefact's MVP scope assumed wuce already has "the platform's existing transactional email path from `2026-07-01-landing-auth-billing`." This assumption was believed INVALIDATED based on a grep for email-sending code across `src/` (pattern: `sendEmail|nodemailer|sendgrid|SMTP|mailer|transactional`) that returned no real match, plus reading `lab-s2.2-email-password-auth.md`'s "no verification email sent in MVP" note.
**Alternatives considered:** (1) Revert the /clarify decision and go back to a manually-shared link — rejected. (2) Build a minimal email-sending adapter as a genuine prerequisite story — chosen at the time.
**Rationale:** [SUPERSEDED — this conclusion was wrong.] The grep pattern used did not include "invitation" or "Resend" as search terms, and missed `modules/invitation-email.js`'s `sendInvitationEmail()` function entirely — a real, D37-compliant, production-wired (Resend SDK) email adapter that already exists, built for a different feature (`2026-07-30-agency-client-organisations`). A narrow negative grep result was treated as proof of absence without a broader follow-up search. See the corrected entry immediately below.
**Made by:** Claude (agent) — incomplete verification
**Revisit trigger:** N/A — superseded.
---

---
**[2026-08-15] | ASSUMPTION | definition (correction)**
**Decision:** The prior entry's conclusion is WRONG and is corrected here rather than silently edited, to keep an honest record. wuce already has a real, working, D37-compliant email-sending adapter: `src/web-ui/modules/invitation-email.js`'s `sendInvitationEmail()`/`setSendInvitationEmail()`, production-wired to the Resend SDK in `server.js` (gated on `RESEND_API_KEY`), built for `2026-07-30-agency-client-organisations`'s own Client-org invitation flow. This feature will REUSE that adapter unchanged, per ADR-026 (reuse before introducing a new entity) — no new email-sending story is needed.
**Alternatives considered:** N/A — this is a factual correction, not a new decision point.
**Rationale:** Also found while investigating: a `client_invitations` table + atomic single-use redemption pattern (`modules/client-invitations.js`), and a shared Passport magic-link strategy (`auth/magic-link-strategy.js`, `registerMagicLinkStrategy`/`setVerifyCallback`) already extended once (`story-4-dual-path-authentication`'s `_combinedMagicLinkVerify`, which dispatches between two existing invitation/login types by payload shape). This feature's real "thinnest end-to-end" foundation is extending that shared dispatcher to a THIRD case (team-tenant invite) plus a new `team_invitations` table matching `client_invitations`' shape but with `tenant_id`, `role`, and expiry columns it doesn't have — not building new email infrastructure. The epic/story structure was revised accordingly (fewer, larger stories combining the dispatcher extension with the admin-facing create-invite story, rather than an artificial standalone "build the adapter" story with no user-visible outcome).
**Made by:** Claude (agent), verified via reading `modules/invitation-email.js`, `modules/client-invitations.js`, `modules/team-management.js`, and `server.js`'s real wiring in full before writing any stories
**Revisit trigger:** None — this is now the corrected, locked-in basis for the epic/story structure.
---

---
**[2026-08-15] | SCOPE | definition (correction + scope expansion)**
**Decision:** No seat/plan-quantity limit exists anywhere in wuce today — corrected here rather than silently edited, to keep an honest record. Direct verification (`billing.js`, `tenant-plan.js`, `github-org-bulk-add.js`) confirms billing tracks a plan TIER per tenant (starter/pro), never a seat COUNT; `product/roadmap.md` explicitly lists "per-seat/usage-based Stripe billing" as deferred, never built. This is the second research gap found in this feature at /definition (the first being the email-adapter assumption, corrected above) — both followed the same shape: assuming existing infrastructure without verifying it first.
**Alternatives considered:** (1) Drop the seat-limit check entirely from MVP scope, treating self-serve joins as unlimited (matching manual admin-adds today, which also have no cap) — considered, would have been the lower-risk/lower-scope choice. (2) Build a basic per-tenant member-count cap, keyed to the tenant's existing plan tier, as new prerequisite scope within this epic — chosen by the operator.
**Rationale:** Operator explicitly chose to build real enforcement rather than defer it, given self-serve invite removes the last practical friction that was implicitly limiting team size (an admin's own willingness to manually add people). This is deliberately scoped as a BASIC count cap (e.g. a per-plan-tier maximum, checked via a simple `COUNT(*) FROM team_memberships WHERE tenant_id = $1`), not full Stripe per-seat billing (still correctly deferred per `product/roadmap.md` — no Stripe quantity/metering integration is built here).
**Made by:** Hamish King — Platform owner (chose to build it); Claude (agent) verified the gap and scoped the basic-cap alternative
**Revisit trigger:** If/when full Stripe per-seat billing is eventually built (still deferred per roadmap.md), this basic count cap should be reconciled with or replaced by the real per-seat billing enforcement — it is an interim mechanism, not intended to be the permanent seat-limit model.
---

## Architecture Decision Records

<!-- None recorded yet — the seat-limit-at-acceptance decision above is logged as an ARCH entry rather than a full ADR, consistent with this repo's own practice of reserving full ADRs for structural decisions with broader platform-wide implications. -->

---

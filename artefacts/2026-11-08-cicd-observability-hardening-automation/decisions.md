# Decision Log: cicd-observability-hardening-automation

**Feature:** CI/CD, Observability & Hardening Automation
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Last updated:** 2026-11-08

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
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Build a new outbound Teams notification mechanism (an Incoming Webhook URL plus new code) for the chat-notification adapter, rather than reusing `approval-channel`'s existing HMAC/dispatch pattern.
**Alternatives considered:** Assumed reuse of the existing inbound HMAC/dispatch pattern (`src/approval-channel/adapters/teams-adapter.js`) would work for outbound sending too — this was the discovery draft's original assumption before /clarify.
**Rationale:** Read `teams-adapter.js` directly during /clarify. `TEAMS_WEBHOOK_SECRET` authenticates *inbound* requests (verifies a signature on an incoming webhook) — it has no outbound-send capability and no credential usable for sending. Posting a message to a Teams channel requires a different mechanism (a channel Incoming Webhook URL, or the Graph API with OAuth app registration), which needs its own secret (per `product/constraints.md` #12, stored in a secrets store, never the agent's environment) and new code.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If Microsoft Teams later exposes a way to send messages using the same credential/mechanism as the existing inbound webhook (considered unlikely), or if this initiative's chat target changes from Teams to Slack/email.
---
**2026-11-08 | RISK-ACCEPT | discovery (/clarify) — retroactively logged 2026-11-08**
**Decision:** Accept the critical `dompurify` finding surfaced by `npm audit --audit-level=high` as a known, currently-unaddressed vulnerability, independent of this discovery — fixing it is out of this initiative's scope, which builds the vulnerability-check step itself (story 3), not a remediation workflow.
**Alternatives considered:** Fix `dompurify` now, inline with this discovery session, since `fixAvailable: true` was confirmed. Rejected — this discovery's job is to confirm the audit step's real noise rate (1 actionable finding, not a flood), not to perform ad-hoc remediation outside any story's test plan or review.
**Rationale:** Running `npm audit --audit-level=high` against this repo during /clarify surfaced exactly 1 critical finding (`dompurify`, fix available) among 3 total vulnerable packages — already noted in this feature's own discovery.md Assumptions and Risks as "worth a RISK-ACCEPT or fix outside this initiative's own scope." That note was never actually logged as a decision until a later cross-tranche consistency audit (2026-11-08) found it missing — this entry closes that gap.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner) — flagged during /clarify 2026-11-08, logged retroactively the same day after an audit found the flagged note was never formalized.
**Revisit trigger:** When story 3 (the vulnerability-check CI step) ships, this finding should be the first real finding it surfaces — confirm it still reproduces, and either fix it then (via the short-track pipeline) or re-confirm the RISK-ACCEPT with a fresh rationale if it's still deliberately deferred.
---

---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->

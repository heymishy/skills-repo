## Benefit Metric: Agency and Client organisation subtypes

**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md (Approved by Hamish King — Product/Platform Owner — 2026-07-30)
**Date defined:** 2026-07-30
**Metric owner:** Hamish King — Product/Platform Owner
**Reviewers:** None recorded — single-operator context; no reviewer outside the metric owner exists at this time. Flagged here rather than fabricated (matching the same honesty standard applied throughout discovery/clarify for this feature).

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a pure product/go-to-market initiative — a new organisation-relationship model and a second B2B sales channel (agencies reselling/deploying the platform to their own clients). Nothing in the discovery signals a parallel hypothesis about tooling, process, or team capability being tested; it is scoped and measured purely on user/business outcome.

**Product context note:** `product/mission.md` and `product/roadmap.md` describe the meta skills-pipeline-governance platform (Phase 1–3, distribution/assurance/improvement-loop outcomes) — a different product surface within this same repo from the commercial SaaS web-ui (`src/web-ui/`) this feature actually belongs to. Those files' stated success outcomes and roadmap horizons do not map onto this feature, and this discrepancy is noted rather than force-fit. This feature aligns with a go-to-market goal named directly by the operator, not a roadmap horizon in `product/roadmap.md`.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Agency-led client provisioning

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one Agency organisation completes the full new flow end-to-end: signs up as an Agency, self-service creates a Client organisation, invites a Client-org user, and that Client-org user successfully logs in (via either GitHub OAuth or the new email/magic-link path) and views at least one product/feature the Agency has shared with them. |
| **Baseline** | Not yet established. This is a genuinely new capability with no prior usage to measure — pre-signal only, informed by an anecdotal peer conversation about a similar B2B agency-reseller motion, not an internal measured baseline (per discovery.md). |
| **Target** | At least 1 Agency organisation completes the full flow above during the initial pilot window following launch. |
| **Minimum validation signal** | The same as the target (n=1) — this is a binary "does anyone actually use this at all" validation, not a scaled adoption target. If zero Agency organisations complete the flow within the pilot window, the hypothesis that agencies want this capability inside the tool (rather than managing clients through their own external channels) is not supported. |
| **Measurement method** | Count of organisations with `org_type=agency` that have at least 1 linked Client organisation, plus at least 1 successful Client-org user login event and at least 1 product-view event by that Client-org user — tracked via PostHog org-level events, matching the existing group-identify pattern already used elsewhere in this codebase (`_posthog.groupIdentify`). Measured by the metric owner, reviewed at the next `/definition-of-done` pass for this feature's stories, and again at the next `/metric-review` if this initiative is later run as a programme.
| **Feedback loop** | If the minimum validation signal is not met within the pilot window: the metric owner decides whether to (a) extend the pilot window if there is qualitative evidence of agency interest but onboarding friction, (b) investigate the "not-worth-building" risk named in discovery.md (agencies may prefer external reporting over in-tool client management), or (c) deprioritise further investment in the Agency/Client model beyond MVP. |

### Metric 2: Ongoing client-agency artefact collaboration

<!-- Added 2026-07-30: Metric 1 only captures a one-time setup event (agency provisions a client, client logs in once). This metric captures the actual ongoing value of the relationship — ADDED to MVP scope alongside this metric: comment-only collaboration for Client-org users (see discovery.md MVP Scope and decisions.md). -->

| Field | Value |
|-------|-------|
| **What we measure** | Whether genuine two-way collaboration occurs on shared artefacts/products/features between an Agency and a Client org — specifically, comment threads with participants from both org types. |
| **Baseline** | Not yet established — this is a new capability with no prior usage (comments did not exist for Client-org users before this feature). |
| **Target** | At least 1 comment thread exists with both an Agency-side and a Client-org participant, within the pilot window. |
| **Minimum validation signal** | The same as the target (n=1) — binary validation that collaboration, not just provisioning, actually happens. If Metric 1 is met (a client is provisioned and logs in) but this metric is not, that signals clients are viewing but not engaging — a distinct and useful failure mode to distinguish from "nobody signs up at all." |
| **Measurement method** | Count of comment records where the thread has at least one comment from an Agency-org user and at least one from a Client-org user, on the same artefact/product/feature — tracked via PostHog event, same org-level pattern as Metric 1. Measured by the metric owner, reviewed at the same cadence as Metric 1. |
| **Feedback loop** | If Metric 1 succeeds but this metric does not within the pilot window: investigate whether comment-only collaboration is discoverable/usable in the shipped UI before concluding clients don't want to collaborate — a UX gap and a genuine lack of demand look identical in this metric alone, so the metric owner should pair this signal with qualitative check-ins before deciding to deprioritise the collaboration capability. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Agency-led client provisioning | Story 1 (organisation entity), Story 2 (relationship + grants + enforcement), Story 3 (self-service provisioning), Story 4 (dual-path auth) | Covered |
| Metric 2 — Ongoing client-agency artefact collaboration | Story 5 (comments) | Covered |
| N/A — no lock-in / adoption objection removal | Story 6 (conversion to independent) | Indirect / risk-mitigation, not directly measured — added 2026-07-31, resolves review [1-M1]. Story 6 does not move either Tier 1 metric directly; it removes a potential adoption objection (no lock-in) that could otherwise suppress Metric 1. See Story 6's own Benefit Linkage field. |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — this metric is outcome-based, not output-based

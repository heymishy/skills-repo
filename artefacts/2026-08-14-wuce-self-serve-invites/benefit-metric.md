## Benefit Metric: Self-serve team invite flow

**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Date defined:** 2026-08-14
**Metric owner:** Hamish King — Platform Owner
<!-- Deviation from the template's non-engineering-role guidance, consistent with this repo's own solo-operator precedent (e.g. web-ui-guardrails-standards-surface's benefit-metric.md) — no separate product/BA role exists in this operation. -->
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward product friction-reduction feature — it does not test a hypothesis about tooling, process, or team capability. Product metrics only.

**Tier 3 (compliance/risk-reduction) considered:** Not applicable. `context.yml` sets `meta.regulated: false` with no named compliance frameworks. Tenant isolation (ADR-025) is a real constraint on this feature (see discovery.md Constraints), but it is covered as an architecture/NFR requirement at `/definition-of-ready`, not as a distinct Tier 3 obligation — there is no named regulatory clause or audit finding driving this feature.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Share of new teammates added via self-serve invite

| Field | Value |
|-------|-------|
| **What we measure** | Of all new tenant memberships created in a given week, the percentage that originate from an accepted self-serve invite vs. an admin's manual "add by identity" or GitHub-org bulk-add action. |
| **Baseline** | 0% — self-serve invite does not exist yet; 100% of additions today are admin-manual. |
| **Target** | A majority (>50%) of new teammates join via self-serve invite within a few weeks of launch. |
| **Minimum validation signal** | At least 1 real self-serve invite accepted by a real beta customer within 4 weeks of release — proves the mechanism works and is actually being used, even before majority adoption is reached. |
| **Measurement method** | PostHog event comparing invite-accepted joins against the existing admin-add event, per tenant per week. |
| **Feedback loop** | If the minimum signal isn't hit within 4 weeks: review with beta customers whether the invite flow itself is discoverable/usable, or whether admins simply prefer doing it manually — decided by Hamish King (Platform Owner). |

### Metric 2: Time from invite creation to invitee access

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time between an admin creating an invite and the invitee's first successful login via that invite. |
| **Baseline** | Not yet established — no current instrumentation measures how long an admin takes to manually add someone today. Will measure the current manual-add path's own effective delay in the first 2 weeks (as a comparison point) before assessing improvement on the new path. |
| **Target** | Under 10 minutes for the self-serve path — email delivery, click-through, and authentication should be fast with no admin-availability bottleneck in the loop. |
| **Minimum validation signal** | Under 60 minutes — still meaningfully faster than "whenever the admin is next available," which today can be hours or days. |
| **Measurement method** | Timestamp diff between the invite-creation PostHog event and the invitee's first-login PostHog event, per invite. |
| **Feedback loop** | If the signal isn't met: investigate whether the bottleneck is email delivery latency, the invitee not checking email promptly, or a UX friction point in the accept flow — decided by Hamish King (Platform Owner). |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — see Tier Classification above (META-BENEFIT FLAG: No).

---

## Metric Coverage Matrix

<!-- Populated by /definition once stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Share of new teammates added via self-serve invite | wsi-s1 (creates the mechanism), wsi-s2 (completes it), wsi-s5 (instruments both this event and the comparable admin-add event, making the share computable) | Covered |
| Time from invite creation to invitee access | wsi-s1 (creation timestamp), wsi-s2 (acceptance timestamp), wsi-s5 (computes and captures the elapsed-time property) | Covered |
| Time from invite creation to invitee access | TBD at /definition | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

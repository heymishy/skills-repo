# Discovery: Web UI Guardrails & Standards Surface

**Status:** Approved
**Created:** 2026-08-11
**Approved by:** Hamish King — Platform owner — 2026-08-11
**Author:** Claude (agent), with Hamish King

---

## Problem Statement

Architectural guardrails and standards are largely invisible in the web-ui surface today — a tenant browsing the SaaS product has no single place to see what guardrails/standards apply, and no delineation between org-level and product-level scope for either. This is not true of the git-native/IDE surface, where `SKILL.md`, `POLICY.md`, and standards files are directly visible and versioned in-repo — the gap is specifically that the web-ui surface adapter doesn't yet expose that same picture to a non-git-native operator. There is currently no way to add or edit a guardrail/standard through any surface (the existing Standards tab only supports promoting or opting out of standards that already exist, per `smug-s1`'s deliberate MVP scoping). Additionally, there's no approval mechanism for propagating a standard or guardrail that originated at product level up to org level — a tech lead or CoP lead who wants a locally-proven pattern to become a broader floor has no governed path to do that today.

**Important scoping clarification surfaced during this discovery:** "Guardrails" and "standards" are two distinct, already-existing repo-governed concepts, not interchangeable UI labels for the same thing:
- **Guardrails** = `.github/architecture-guardrails.md` — a single repo file recording architectural decisions (ADRs).
- **Standards** = the `standards/` folder (`data`, `devops`, `domains`, `governance`, `iac`, `infrastructure`, `m365-admin`, `manual`, `ml-ai`, `product`, `quality-assurance`, `regulatory`, `saas-api`, `saas-gui`, `security-engineering`, `security-extended`, `software-engineering`, `ux`) — discipline standards injected into skills as context during discovery/definition/review/etc.

Separately, the **existing web-ui "Standards" tab** (`smug-s1`, `src/web-ui/routes/standards.js`) is backed by a **third, distinct thing**: a DB table (`standards`, columns `product_id`, `org_id`, `name`, `content`, `visibility`) holding per-tenant SaaS data created via API, with no link to the real repo `standards/` folder or `architecture-guardrails.md`. This feature surfaces the **real, governed repo files** directly — the DB table and the `smug-s1` UI built on it are superseded and removed (see MVP Scope and Clarification log).

## Who It Affects

**Everyone using the web-ui surface** experiences the core visibility problem — any operator browsing a product in the web UI has no way to see what guardrails/standards apply, at either product or org level. On top of that broader visibility gap, a narrower persona — **tech leads and domain/CoP experts** — need curation and approval capability specifically: the ability to create or edit a guardrail/standard, and to approve its propagation from product level to org level. So this is two personas with different depths of need on the same surface: (1) any web-ui user, who needs *visibility*, and (2) leads/domain experts, who additionally need *curation and approval* authority.

## Why Now

Two converging drivers: (1) the Standards tab just shipped (`smug-s1`), which surfaced how incomplete the current guardrails/standards story is — visibility and curation gaps that were previously invisible because there was no UI at all. (2) Growing interest from potential users/prospects in the platform's standards and guardrails capability specifically — making this a moment where the gap is both freshly visible internally and increasingly relevant externally (a capability prospects are asking about).

## MVP Scope

The MVP delivers the full loop in one cut, not a phased view-first rollout, reading directly from each tenant's connected GitHub repo(s) — no intermediate DB cache:

1. **View** — a rollup showing all guardrails/standards across both org level and product level, with clear delineation between the two scopes, read live from the real governed repo files (`.github/architecture-guardrails.md` and `standards/`).
   - **Product level:** read from the product's own connected repo. If a product has no connected repo, the product-level section renders empty with a prompt to connect one — org-level entries still show.
   - **Org level:** each tenant nominates a single designated "org" repo (per-tenant, not a fixed platform-wide repo) whose `architecture-guardrails.md`/`standards/` acts as the org-wide floor. The org repo is seeded with a small, deliberately minimal starter set (1-2 generic entries) to avoid context bloat when these get injected into downstream skill execution.
2. **Add/edit** — the ability to create and edit a guardrail or standard directly through the UI (closing the gap `smug-s1` deliberately deferred — no more "create one via the API"). Edits are **PR-gated**: the web UI creates a branch and opens a PR against the tenant's connected repo (consistent with this platform's own Platform change policy for its own guardrails/standards files), and the UI surfaces pending/merged state rather than writing straight to the default branch.
3. **Promotion approval** — a governed workflow for propagating a product-level standard/guardrail up to the tenant's org repo, requiring explicit approval (by a tech lead / CoP/domain expert, per the personas section) rather than happening silently. This replaces `smug-s1`'s old DB-backed promote/opt-out concept entirely (see below).
4. **Migration/removal** — this feature supersedes `smug-s1` entirely: its DB-backed promote/opt-out UI and the underlying `standards` table are removed as part of delivering this feature, avoiding a dead data concept left in the codebase once the repo-backed, PR-gated promotion-approval workflow replaces it.

For the first person to find this useful: a tech lead must be able to look at one screen, see everything that applies to their product (inherited from org + product-specific), add a new product-level guardrail via a PR they can track, and — separately — request/approve promoting an existing product-level one to their org repo, all without leaving the web UI or touching the API/repo directly.

## Out of Scope

- **`_renderRoadmapTab`'s duplicate-breadcrumb bug** — a separate, already-identified defect (found during `rapp-s2`), tracked independently, not folded into this feature's scope.
- **Multi-level org hierarchies** — this feature is a flat org-level / product-level split only; nested org structures (division → team → product) are not addressed.
- **Enforcement or blocking of non-compliant products** — this feature surfaces and governs guardrails/standards; it does not gate or block a product's delivery pipeline for non-compliance. That's a separate, larger capability.
- **Notifications on promotion approval** — the approval workflow itself is in scope; email/Slack/in-app notification of approval requests or outcomes is not.
- **DB-backed caching/bridging of repo content** — explicitly rejected during clarification (see log); this feature reads the connected repo(s) live, accepting the latency/rate-limit cost of doing so, rather than building a cache invalidation layer.

## Assumptions and Risks

All four assumptions originally raised during discovery were resolved during `/clarify` — see Clarification log below for the full record. No unresolved `[ASSUMPTION]` lines remain.

**Risk (carried forward, still live):** Reading live from GitHub on every view (rather than caching) exposes this feature to GitHub API rate limits and added latency, especially for a tenant with many connected repos. Not a blocker for MVP given the explicit operator preference to avoid a caching layer's complexity, but worth flagging for `/definition` to size correctly (e.g. a request-scoped in-memory cache within a single page load, short of a persistent DB bridge, may be a reasonable middle ground — a `/definition`-stage decision, not resolved here).

## Directional Success Indicators

**Guardrail/standard adherence visibility:** Baseline: `[UNKNOWN BASELINE]` — today there is no measurement of whether a product's artefacts/implementation actually conform to applicable guardrails or standards; nothing is tracked. Target: a web-ui view showing, per product (and rolled up at org level), which guardrails/standards apply and a compliance/adherence status against each — not just a static list, but a signal of whether it's actually being followed. Measured via: cross-referencing the guardrail/standard's applicability against real delivery evidence already produced by the pipeline (e.g. DoR/DoD sign-offs, review findings, `pipeline-state.json`'s existing `guardrails[]` array — seeded today by `/discovery`'s compliance-framework bridge with a `not-assessed` status per entry — which may be a usable existing hook to extend rather than a new tracking mechanism to invent).

**Promotion-approval usage:** Baseline: `[UNKNOWN BASELINE]` — the workflow doesn't exist yet, so there's no current usage to compare against. Target: at least one real product→org promotion is requested and approved through the new workflow within the first period of availability (exact threshold for `/benefit-metric` to refine). Measured via: an audit-logged event (matching this platform's existing PostHog-capture convention for state-changing actions) on promotion request and approval/rejection.

## Constraints

None identified.

## Contributors

- Hamish King — Platform owner

## Reviewers

- None — Hamish King is both sole contributor and approver for this discovery

## Approved By

Hamish King — Platform owner — 2026-08-11

---

## Clarification log

[2026-08-11] Clarified via /clarify:
- Q: What does "org-level" guardrails/standards actually read from?  A: A single designated "org" repo, defined per tenant (not platform-wide), seeded with a small generic starter set (1-2 entries) to avoid context bloat.
- Q: For products with no connected repo, what should the view show?  A: Org-level entries only; product-level section renders empty with a prompt to connect a repo — the feature is not blocked/hidden entirely.
- Q: Does editing go through PR review or direct-commit?  A: PR-gated — the web UI creates a branch and opens a PR against the tenant's connected repo, matching this platform's own governance model; UI surfaces pending/merged state.
- Q: Can the existing DB-backed `standards` table act as a bridge/cache, or should this feature bypass it?  A: Bypass entirely — read the connected repo(s) directly. Additionally, the `standards` table and `smug-s1`'s promote/opt-out UI built on it are removed as part of this feature, since nothing else depends on them and leaving them in place would carry a dead data concept in the codebase.

---

**Next step:** Human review and approval → /benefit-metric

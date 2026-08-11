# Decision Log: web-ui-guardrails-standards-surface

**Feature:** Web UI Guardrails & Standards Surface
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Last updated:** 2026-08-11

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
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** Org-level guardrails/standards resolve to a single, per-tenant-designated "org" repo (not a fixed platform-wide repo), seeded with a minimal generic starter set (1-2 entries) to avoid context bloat.
**Alternatives considered:** (B) an aggregation/union computed across all of a tenant's connected product repos — rejected, no single source of truth and harder to seed sensibly. (C) a separate, repo-independent org-level definition — not pursued.
**Rationale:** Simplest extension of the already-existing product-repo-read pattern; avoids inventing new infrastructure, directly addressing the discovery's own stated risk that cost could outweigh benefit if org-level required substantial new architecture. Minimal seeding keeps the downstream skill-injection context footprint small.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If a tenant genuinely needs cross-repo aggregation instead of a single designated repo (e.g. multiple product repos with no natural "org" repo candidate).
---

---
**[2026-08-11] | SCOPE | discovery/clarify**
**Decision:** Products without a connected GitHub repo show org-level guardrails/standards only; the product-level section renders empty with a prompt to connect a repo. The feature is not blocked or hidden for such products.
**Alternatives considered:** (B) block/hide the whole feature until a repo is connected — rejected as unnecessarily restrictive.
**Rationale:** Keeps the feature usable and visible even for products mid-onboarding; repo connection becomes a soft prerequisite for product-level content only, not a hard gate on the whole feature.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If in practice most products never connect a repo, making the product-level section perpetually empty for most users — would signal a repo-connection friction problem, not a scope problem here.
---

---
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** Editing a guardrail/standard through the web UI creates a branch and opens a PR against the tenant's connected repo; the UI surfaces pending/merged state. No direct-commit path.
**Alternatives considered:** (B) direct-commit to the tenant's own repo, treating it as their own choice not the platform's — considered, rejected.
**Rationale:** Matches this platform's own Platform change policy (PR review required for SKILL.md/POLICY.md/standards changes) — consistency between what the platform requires of itself and what it enables for tenants; keeps guardrail/standard changes auditable and reviewable rather than silent.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If tenants report the PR-approval overhead is a significant adoption blocker for genuinely low-stakes edits — a "fast-track" or configurable-per-tenant direct-commit option could be reconsidered.
---

---
**[2026-08-11] | ARCH | discovery/clarify**
**Decision:** The existing DB-backed `standards` table and `smug-s1`'s promote/opt-out UI built on it are removed and replaced entirely by this feature's repo-backed, PR-gated view/add/edit/promotion-approval workflow. No caching/bridging layer is built — the feature reads the tenant's connected repo(s) live on each view.
**Alternatives considered:** (B) keep the DB table as a read-through cache invalidated via webhook — considered, rejected as unnecessary complexity for the value it provides. (C) keep `smug-s1`'s existing UI/flow running in parallel, treat table removal as a separate later cleanup story — considered, rejected in favour of a clean single supersession to avoid maintaining two parallel, semantically-overlapping "standards" concepts in the codebase.
**Rationale:** The DB table's `content` field was already unconnected to any real governed source (confirmed during discovery investigation). Keeping it around after this feature ships would mean two different, disconnected "standards" concepts existing simultaneously — exactly the confusion this feature is meant to resolve. A live-read approach avoids caching/invalidation complexity for MVP; latency/rate-limit cost accepted as a known tradeoff (see discovery.md Risk section).
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If live reads from GitHub prove too slow or rate-limit-constrained in practice, a caching layer may need to be reconsidered (already flagged as a live risk in discovery.md, deferred to /definition for sizing).
---

---
**[2026-08-11] | SCOPE | definition**
**Decision:** Promotion-approval authority for MVP is gated on the existing `admin` role only — no new "tech lead" or "CoP expert" role is introduced. Discovery's personas named these narrower roles, but the current web-ui role model (`team-identity-roles`) only has `admin`/`engineer`/`product`/`viewer`.
**Alternatives considered:** (2) add a new role/permission to the existing role model as part of this epic — rejected as materially larger scope, touching `team-identity-roles`' schema for a single feature's needs. (3) defer role-gating entirely, allow anyone with GitHub repo write access to approve — rejected as too weak an approval gate for a feature explicitly about governance.
**Rationale:** Reuses existing, already-built role infrastructure rather than inventing new scope; `admin` is the highest-trust existing role and a reasonable MVP approximation of "tech lead/CoP expert" until real usage shows finer granularity is needed.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If real usage shows `admin`-only is too coarse (e.g. a non-admin tech lead legitimately needs approval authority but not full admin rights), introduce a dedicated role/permission as a follow-up story.
---

---
**[2026-08-11] | SLICE | definition-of-ready (wugs-s3)**
**Decision:** First-time org-repo seeding (`wugs-s3` AC1) goes through the same PR-gated write path (`wugs-s6`) as any other edit — not a direct-commit exception for "initialization." This makes `wugs-s3` (Epic 1) dependent on `wugs-s6` (Epic 2), breaking the otherwise-clean walking-skeleton epic boundary for this one story.
**Alternatives considered:** (A) treat seeding as initialization via direct commit, matching `repo-bootstrap.js`'s existing pattern for brand-new repos — rejected to keep a single, consistent write story (no exception carved out for "this write doesn't count as an edit").
**Rationale:** Consistency over clean epic boundaries — a single write mechanism with zero exceptions is easier to reason about and audit than a write path with a carved-out "but not for the first write" special case, even though it costs some walking-skeleton purity.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If the cross-epic dependency proves genuinely awkward for implementation sequencing (e.g. `wugs-s3` blocked for a long time waiting on `wugs-s6`), reconsider Option A.
---

---
**[2026-08-11] | SLICE | inner-loop-sequencing**
**Decision:** `wugs-s5`'s upstream dependency narrowed to `wugs-s2` only, dropping the previously-listed `wugs-s3`. Its ACs are fully testable against the product-level view alone.
**Alternatives considered:** Keeping both dependencies — rejected because it created a circular dependency once `wugs-s3` was found (during DoR) to depend on `wugs-s6`, which depends on `wugs-s5`: `wugs-s3` → `wugs-s6` → `wugs-s5` → `wugs-s3`. The cycle made the walking-skeleton unsequenceable as written.
**Rationale:** `wugs-s5`'s form is view-agnostic — dropping the `wugs-s3` dependency doesn't weaken any AC, it just correctly reflects that the story never actually needed org-level rendering to exist first.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** None obvious — this was a pure dependency-graph correction, not a scope or behaviour change.
---

## Architecture Decision Records

<!-- None recorded — all four decisions from this discovery/clarify session were logged as entries above, not full ADRs, per the operator's confirmation that none warranted ADR-level depth. -->

---

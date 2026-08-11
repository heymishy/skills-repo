## Story: Remove the `standards`/`standard_product_optouts` DB tables and their references

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-4-smug-s1-migration.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **future engineer working in this codebase**,
I want **the `standards` and `standard_product_optouts` tables gone once nothing references them**,
So that **I don't find a dead, disconnected data concept while working on the real, repo-backed guardrails/standards feature** (per `decisions.md`'s ARCH entry #4 — "avoid carrying a dead data concept in the codebase").

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI (indirectly — codebase cleanliness supporting the decision this whole feature is built on)
**How:** Labelled as a technical/cleanup story per the template's own guidance; it does not itself move a metric, but completes the supersession `decisions.md`'s ARCH entry #4 committed to.

## Architecture Constraints

- **Found during discovery investigation, must be handled here:** `handleDeleteProduct` (`products.js`, `prc-s4.2`) currently runs `DELETE FROM standard_product_optouts WHERE product_id = $1` and `DELETE FROM standards WHERE product_id = $1` as part of its product-deletion cleanup. Once the tables are dropped, these two lines must be removed from `handleDeleteProduct` — leaving them in place after the tables no longer exist would break every product deletion, not just guardrails-related functionality. This is the highest-risk part of this story.
- **Schema-first (ADR-003) in reverse** — removing a table used by schema/skill code requires removing it from the schema/migration definitions in the same commit, not leaving a stale `CREATE TABLE IF NOT EXISTS standards...` migration line that no code reads.
- **Sequenced strictly after `wugs-s11`** — dropping tables while `standards.js`'s routes still reference them would break the (about-to-be-removed) old routes mid-flight; `wugs-s11` must merge and deploy first.

## Dependencies

- **Upstream:** `wugs-s11` must be complete and deployed (no code references the tables) before this story runs.
- **Downstream:** None — terminal story for this feature's MVP.

## Acceptance Criteria

**AC1:** Given `wugs-s11` has removed all route/handler references, When a repo-wide search is run for `standards` and `standard_product_optouts` table references, Then only the migration/schema definition and this story's own removal code remain — no route, handler, or test still queries them.

**AC2:** Given `handleDeleteProduct`'s existing cleanup lines for these two tables, When this story is implemented, Then those two `DELETE FROM` lines are removed from `handleDeleteProduct`, and a test confirms product deletion still succeeds cleanly without them (regression guard against `check-prc-s4.2-delete-product.js`'s existing AC coverage).

**AC3:** Given the migration/schema file, When this story's changes are applied, Then the `CREATE TABLE IF NOT EXISTS standards...`/`standard_product_optouts...` definitions are removed, and an explicit `DROP TABLE IF EXISTS` migration step is added so existing deployed databases actually drop the tables, not just stop creating them on fresh installs.

**AC4:** Given the full regression suite is run after this story, When executed, Then `check-prc-s4.2-delete-product.js` and all other `products.js`-touching test files still pass — proving the table removal didn't silently break unrelated product-management functionality.

## Out of Scope

- **Any data preservation/export step for existing `standards` table content** — per this epic's own Out of Scope, no migration path exists or is needed (the data was already confirmed disconnected from real governed content).
- **Removing `standard_product_optouts` before `standards`** — order doesn't matter functionally, but both must go together in this story, not split across separate stories.

## NFRs

- **Performance:** None specific.
- **Security:** None new.
- **Accessibility:** None new.
- **Audit:** Table removal itself is a deploy-time schema change, not a runtime user action — no PostHog event needed; the PR/deploy record is the audit trail.

## Complexity Rating

**Rating:** 2 — the `handleDeleteProduct` cross-reference (AC2) is a real, easy-to-miss risk if not deliberately checked.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — noted as a technical/cleanup story explicitly, per template guidance
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)

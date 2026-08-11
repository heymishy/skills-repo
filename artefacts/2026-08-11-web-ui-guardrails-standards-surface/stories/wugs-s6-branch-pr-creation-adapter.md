## Story: Build the branch + PR creation adapter for guardrail/standard edits

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, security-engineering]

## User Story

As a **tech lead who just submitted a guardrail/standard edit**,
I want **the platform to create a branch, commit my change, and open a real PR against my repo — not commit straight to the default branch**,
So that **my edit goes through the same review process this platform requires of its own guardrails/standards changes** (per `decisions.md`'s ARCH entry #3).

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI (indirectly — enables new content to enter the repo, which is what gets viewed) and Product-to-org promotion-approval workflow usage (this adapter's PR-creation mechanism is reused by Epic 3's promotion flow)
**How:** This is the write mechanism the rest of Epic 2/3 depends on; without it, `wugs-s5`'s form has nowhere to send validated content.

## Architecture Constraints

- **New adapter, not a repo-bootstrap.js reuse (ADR-012):** `repo-bootstrap.js`'s `realBootstrapRepo` PATCHes `git/refs/heads/master` directly (a first-time-setup, direct-commit mechanism for brand-new repos). This story must NOT reuse that function or its direct-to-master pattern — it needs a genuinely new branch-then-PR flow. The `ghRequest` helper's shape (auth header, error handling, `fetch`-based) is a reasonable stylistic precedent to follow, not code to import. Per ADR-012 ("platform-agnostic architecture via adapters... adapters enable platform adaptation without core fragmentation"), this new adapter must itself be host-agnostic in structure — GitHub-specific API calls live entirely inside this module, behind the same injectable-adapter interface (`setGuardrailPrAdapter`) used elsewhere, so a future non-GitHub host could be swapped in without touching call sites.
- **Injectable adapter rule (D37, CLAUDE.md) — all four requirements apply:**
  1. Stub default throws: `'Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.'` — not a silent no-op.
  2. This story's own DoR must include an explicit AC for production wiring in `server.js` (or the equivalent wiring module), verified by a test or smoke check.
  3. The implementation plan must list the wiring task separately from the handler task.
  4. The wiring test must assert real behavioural correctness — e.g. "a real PR is opened with the expected branch name and file content," not just "`server.js` wires `setGuardrailPrAdapter` to `someFunction`."
- **GitHub Contents API SHA-based update handling** — updating an *existing* file requires the file's current `sha` (fetched first); the adapter must fetch-then-write, not write blind, or GitHub's API will reject the update.
- **Standard branch-then-PR sequence:** (1) get the default branch's latest commit SHA, (2) create a new ref/branch from it, (3) create-or-update the target file on that branch via Contents API, (4) open a PR from the new branch to default.

## Dependencies

- **Upstream:** `wugs-s1` (repo-read fetch function, needed to get the current file's SHA for edits), `wugs-s5` (the form that supplies validated content).
- **Downstream:** `wugs-s7` (surfaces this adapter's PR state), Epic 3's promotion-approval workflow (reuses this adapter's PR-creation mechanism for propagating content to the org repo).

## Acceptance Criteria

**AC1:** Given valid content and a target file path for a NEW file, When the adapter runs, Then a new branch is created from the repo's default branch, the file is committed to that branch (not default), and a PR is opened from the new branch — the default branch is never written to directly.

**AC2:** Given valid content and a target file path for an EXISTING file, When the adapter runs, Then it first fetches the file's current SHA, then commits the update using that SHA — a stale-SHA conflict from GitHub surfaces as a clear, named error (not a silent failure or a wrong file overwrite).

**AC3:** Given the adapter succeeds, When it returns, Then the response includes the PR number and PR URL — needed by `wugs-s7` to link back to it.

**AC4:** Given the GitHub API call for branch creation, file commit, or PR creation fails at any step, When the adapter runs, Then it surfaces a clear error identifying which step failed — no partial, silently-abandoned branch left with no explanation to the operator.

**AC5:** Given the module is required fresh with no adapter wired, When the adapter function is called before `setGuardrailPrAdapter()` is invoked, Then it throws the explicit "Adapter not wired" error (D37 requirement 1).

**AC6:** Given `server.js`'s real wiring, When two different, distinguishable content changes are submitted, Then two different, individually-correct PRs are opened — the wiring test asserts this observable, differentiating outcome, not merely that a setter was called (D37 requirement 4, per CLAUDE.md's stated tir-s1 precedent).

## Out of Scope

- **Merging the PR** — Epic scope boundary; PR is opened and left for the tenant's own review process.
- **Handling PR conflicts beyond surfacing the GitHub error** — no auto-resolution logic.
- **Rate-limit backoff/retry logic** — a single attempt with a clear error on failure is sufficient for MVP; retry logic is a future hardening pass if real usage shows it's needed.

## NFRs

- **Performance:** No hard target — accept GitHub API's own multi-call latency (branch create + file commit + PR create) as a known cost of this write path.
- **Security:** The OAuth token used must be the operator's own session token (same as `wugs-s1`'s read path) — no service-account token with broader-than-necessary scope. Token is never logged.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** PR creation is audit-logged via PostHog (`guardrail_pr_opened` event with tenant_id, product_id, repo, PR number) — this is a real state-changing action against an external system and must be traceable.

## Complexity Rating

**Rating:** 3 — multi-step GitHub API sequence with real failure modes at each step (SHA conflicts, partial failures), no existing adapter to extend.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)

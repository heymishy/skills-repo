# Decisions: Skills Platform — Phase 2

---

## SCOPE — 2026-04-11

### SCOPE-01: p2.5 split into p2.5a and p2.5b

**Date:** 2026-04-11
**Decided by:** Hamish (operator) — pre-authorised before /definition began
**Decision type:** SCOPE

During /definition story decomposition, analysis of the five surface adapter types (IaC, SaaS-API, SaaS-GUI, M365-admin, manual) produced a projected AC count exceeding the operator-specified threshold of 8 for a single story. Operator instruction: "if AC count exceeds 8, split into p2.5a (IaC + SaaS-API) and p2.5b (SaaS-GUI + M365-admin + manual)."

**Split decision:**
- p2.5a: IaC + SaaS-API adapters + respective POLICY.md floor variants (~6 ACs)
- p2.5b: SaaS-GUI + M365-admin + manual adapters + respective POLICY.md floor variants (~6 ACs)

**Rationale:** IaC and SaaS-API are cloud-native, CI-adjacent surface types with diff-based findings vocabularies. SaaS-GUI, M365-admin, and manual introduce novel result patterns (screen-capture evidence, admin audit log references, checklist-only outputs) that increase AC complexity independently of the IaC/API pattern. Grouping by result vocabulary is the natural seam.

**Effect on story count:** 12 planned → 13 total (E2 gains one story). Estimate impact within E1 headroom (~+2h outer loop for the extra story through review + DoR).

---

## ARCH — 2026-04-11

### ARCH-01: /definition D1/D2/D3 delivered as a single story

**Date:** 2026-04-11
**Decided by:** Hamish (operator)
**Decision type:** ARCH

D1 (dependency chain validation), D2 (testability filter), and D3 (learnings exit step) are grouped into a single story (p2.1) rather than three separate stories. Rationale: all three are instruction-text changes to `.github/skills/definition/SKILL.md`; they have a natural exit-gate relationship (D3 fires at the same point as the scope accumulator check); and separating them would require three sequential pass-through /review + DoR cycles on the same file with no value-add checkpoint between them.

**Constraint:** Any future change to one of D1/D2/D3 that does not affect the other two should be a separate story.

---

### ASSUMPTION-02: EA registry Phase 2 contract scoped to 3-field stub

**Date:** 2026-04-11
**Decided by:** Hamish (operator) — recorded during /review finding resolution
**Decision type:** ASSUMPTION

For Phase 2, the EA registry resolver (p2.6) is implemented and tested against a provisional stub contract containing exactly three fields: `surfaceType` (string), `teamId` (string), `adapterOverride` (string|null). The real EA registry API contract has not been confirmed. Testing uses a stub fixture; live calls to `https://github.com/heymishy/ea-registry` are not required for Phase 2 AC validation.

**Resolution trigger:** Post-Phase 2, when the EA registry repo owner confirms the production API schema. If the schema differs from the 3-field stub, the resolver must be updated and AC2 test fixtures revised. Track at p2.6 /definition-of-done — add a DoD observation noting the stub contract and scheduling a follow-up confirmation.

---

## ASSUMPTION — 2026-04-11

### ASSUMPTION-01: EA registry API contract shape deferred to p2.6 story decomposition

**Date:** 2026-04-11
**Decided by:** Hamish (operator)
**Decision type:** ASSUMPTION

The EA registry Path A resolver (p2.6) requires knowledge of the EA registry's published API response format (specifically: which field name carries the surface type). This contract is not yet confirmed. The assumption recorded here: the EA registry at `https://github.com/heymishy/ea-registry` follows JSON with a `surfaceType` field in the application record. This must be validated at p2.6 /definition-of-ready — if the actual field name differs, the resolver AC3 test is the catch point.

**Resolution trigger:** p2.6 /definition-of-ready H1 (clear and testable ACs) — the AC must reference the confirmed field name, not a placeholder.

---

## RESOLUTION — 2026-04-11

### RESOLUTION-ASSUMPTION-02: EA registry field names confirmed from live repo schema

**Date:** 2026-04-11
**Resolved by:** Copilot (operator-instructed schema inspection at /definition-of-ready)
**Decision type:** ASSUMPTION — RESOLVED

Confirmed from `https://github.com/heymishy/ea-registry` — specifically `registry/applications/_template.yaml` (commit `7d9edae`, "Initial EA registry structure and skill documentation") and the CONVENTIONS.md authoritative format reference:

**Confirmed field name corrections:**

1. `surfaceType` (assumed) → **DOES NOT EXIST** as a single field in the EA registry application schema. The EA registry has no `surfaceType` field. The correct source field for surface type derivation is `technology.hosting` (enum: `"on-prem"` | `"cloud"` | `"saas"` | `"hybrid"`). The resolver derives the skills-platform surface type via a mapping table: `saas` → `saas-api` (default; `saas-gui` and `m365-admin` are specified via context.yml `adapter_override`), `cloud` → `iac`, `on-prem` → `manual`, `hybrid` → context-dependent (falls back to context.yml or error).

2. `teamId` (assumed) → **CORRECTED to `owner`** — confirmed field in the EA registry application entry. The `owner` field is a team-or-person-slug (e.g. `"platform-team"`, `"squad-a"`). This is the squad identifier used for routing and metadata.

3. `adapterOverride` (assumed) → **DOES NOT EXIST** in EA registry schema. No override field is defined in the application entry template. Override capability is moved to `context.yml` as `adapter_override` string field. If `context.yml` contains `adapter_override`, it takes precedence over the registry-derived surface type — this replaces the registry-contract `adapterOverride` behaviour described in ASSUMPTION-02.

**Impact on p2.6 artefacts:**
- p2.6 story AC2: stub contract description updated to `{ technology: { hosting: "saas" }, owner: "squad-a" }` (EA registry YAML format); context.yml `adapter_override` replaces registry `adapterOverride`
- p2.6 test plan: all test fixture data referencing `surfaceType`, `teamId`, `adapterOverride` updated to `technology.hosting`, `owner`, and context.yml `adapter_override` respectively
- Surface type derivation mapping added to resolver architecture: `saas` → `saas-api`, `cloud` → `iac`, `on-prem` → `manual`; granular types (`saas-gui`, `m365-admin`) override via context.yml `adapter_override`

**H1 gate status for p2.6:** UNBLOCKED — AC field names are now confirmed from the live registry schema. See p2.6 DoR re-run below.

---

### RESOLUTION-ASSUMPTION-P2.11-01: P1.6 trace archive failure pattern field name confirmed from design documents

**Date:** 2026-04-11
**Resolved by:** Copilot (operator-instructed schema inspection at /definition-of-ready)
**Decision type:** ASSUMPTION — RESOLVED

**Context:** ASSUMPTION-P2.11-01 required confirmation of the field name carrying the failure pattern label in `workspace/traces/` trace records — either `failurePattern` (singular string) or `failurePatterns[]` (array).

**Finding:** `workspace/traces/` is currently empty (contains only `.gitkeep`). Phase 1 inner loop has not yet been dispatched; P1.3 (assurance agent CI gate) has not yet been implemented. No live trace files exist from which to confirm the schema.

**Determination from source documents (two independent sources):**
1. `artefacts/2026-04-11-skills-platform-phase2/verification-scripts/p2.11-improvement-agent-trace-proposals-verification.md` line 52: "10 synthetic trace fixtures for one surface type, ≥3 with same kebab-case pattern label in the **failurePattern field**" — singular, string type.
2. `product/tech-stack.md` suite record example schema: `"failurePattern": "agent implemented first, added tests after"` — singular string field.

**Confirmed field name: `failurePattern` (singular string) — NOT `failurePatterns[]` (array).**

**P1.3 implementation constraint (added to decisions log):** The P1.3 trace writer implementation MUST include a `failurePattern` field (singular string) in trace records written for failed gate evaluations. This field carries the kebab-case pattern label from the failing suite scenario's `failurePatternGuarded` value. The current decision trace schema in `product/tech-stack.md` does not include this field — P1.3 story implementation must extend the schema. This constraint should be noted in the P1.3 DoR coding agent instructions block.

**DoR sequencing gate for p2.11 unchanged:** p2.11 cannot be dispatched until (a) P1.3 is DoD-complete with `failurePattern` field confirmed in trace output, AND (b) at least one Phase 2 inner loop story has been merged and its trace written to `workspace/traces/`.

---

## W3 ACKNOWLEDGED — 2026-04-11 (batch 2 DoR)

### W3-p2.7: MEDIUM review finding F-1 — MC-A11Y-01/02 not originally cited in Architecture Constraints

**Date:** 2026-04-11
**Story:** p2.7-fleet-registry-ci-aggregation
**Decision type:** W3-ACKNOWLEDGE

Review R1 finding F-1 (Category E, MEDIUM): MC-A11Y-01 (keyboard accessibility) and MC-A11Y-02 (colour not sole indicator) were missing from Architecture Constraints despite AC5 requiring a colour-coded fleet viz panel. The review also requested an AC amendment specifying that health status is conveyed by colour plus a text label or icon, and that interactive elements are keyboard-accessible.

**Resolution:** Architecture Constraints amended in story to include MC-A11Y-01 and MC-A11Y-02 with specific requirements for the fleet viz panel. Test plan includes 3 AC5 integration tests including A11Y guard tests (DOM-content checks for non-colour health indicator and keyboard navigation). Finding acknowledged and resolved before DoR sign-off.

---

### W3-p2.8: MEDIUM review finding F-1 — AC2 sign-off detection mechanism unspecified

**Date:** 2026-04-11
**Story:** p2.8-persona-routing-non-engineer-approval
**Decision type:** W3-ACKNOWLEDGE

Review R1 finding F-1 (Category C, MEDIUM): AC2 specified the approval sign-off outcome (recorded in configured channel tool with timestamp) but left the detection mechanism entirely open — ambiguous between polling, webhook, manual maintainer command, and structured comment format.

**Resolution:** Architecture Constraints amended to add the "Approval channel adapter pattern (ADR-004 extension)" block. Phase 2 dogfood implementation uses `approval_channel: github-issue`: a designated approver posts a comment containing `/approve-dor` on the linked GitHub Issue, triggering a GitHub Actions workflow that writes `dorStatus: signed-off` to `pipeline-state.json`. The channel-specific plumbing lives in an adapter module; the `pipeline-state.json` write contract is channel-agnostic. Swapping channels requires only `context.yml` `approval_channel` change and adapter swap — no skill edits. SCOPE-APPROVAL-01 assumption absorbed into this architectural contract.

---

### W3-p2.10: MEDIUM review finding F-1 — Docker Compose config not scoped as deliverable AC

**Date:** 2026-04-11
**Story:** p2.10-bitbucket-ci-validation
**Decision type:** W3-ACKNOWLEDGE

Review R1 finding F-1 (Category E, MEDIUM): DC Docker auth topology tests (AC3–AC5) required a reproducible local Bitbucket DC environment, but no AC required the Docker Compose configuration to be created and committed as a story deliverable — leaving the Reproducibility NFR unverifiable at PR review.

**Resolution:** AC7 added to story: `tests/fixtures/docker-compose.bitbucket-dc.yml` committed as a deliverable. Any developer with Docker installed must be able to run `docker compose -f tests/fixtures/docker-compose.bitbucket-dc.yml up` and reproduce the DC auth topology tests without a network-accessible Bitbucket DC instance. Docker Compose file must reference environment variables for all secret values — no credential literals. Finding F-1 fully resolved by AC7.

---

## W4 RISK-ACCEPT — 2026-04-11 (batch 2 DoR)

### W4-p2.7: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.7-fleet-registry-ci-aggregation
**Decision type:** RISK-ACCEPT

Solo operator context — no second domain expert available to review the verification script before sign-off. Risk: verification script may miss edge cases in fleet panel A11Y guards (MC-A11Y-01/02 compliance) or graceful degradation paths. Mitigation: test plan explicitly covers A11Y guard tests as integration tests; manual spot-check of A11Y at PR review recommended.

**Accepted by:** Hamish (operator) 2026-04-11

---

### W4-p2.8: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.8-persona-routing-non-engineer-approval
**Decision type:** RISK-ACCEPT

Solo operator context. Risk: verification script may miss edge cases in the GitHub Actions workflow trigger path for `/approve-dor` or the PII guard on `dorApprover` field (username vs email). Mitigation: PII constraint explicitly unit-tested (test plan includes `dorApprover` stores username not email).

**Accepted by:** Hamish (operator) 2026-04-11

---

### W4-p2.9: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.9-discipline-standards-remaining
**Decision type:** RISK-ACCEPT

Solo operator context. Risk: routing smoke test may not catch structural deviation across all 16+ new standard files committed as a batch. Manual spot-check of P1.7 structural conformance on a sample of new files recommended at PR review.

**Accepted by:** Hamish (operator) 2026-04-11

---

### W4-p2.10: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.10-bitbucket-ci-validation
**Decision type:** RISK-ACCEPT

Solo operator context. Risk: Docker Compose DC topology verification script may not exercise all three auth topologies (app password, OAuth, SSH) in the same CI run. Cloud/DC isolation depends on correct fixture use. Mitigation: AC6 isolation test is explicit; Docker Compose deliverable (AC7) ensures reproducibility.

**Accepted by:** Hamish (operator) 2026-04-11

---

### W4-p2.11: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.11-improvement-agent-trace-proposals
**Decision type:** RISK-ACCEPT

Solo operator context. Risk: anti-overfitting gate edge cases (borderline threshold counts at exactly 3 occurrences in a 10-story window) may not be fully exercised by the verification script. Integration scenario validation requires real delivery traces. Mitigation: synthetic fixture tests cover all AC2 boundary conditions; real trace integration test documented and gated.

**Accepted by:** Hamish (operator) 2026-04-11

---

### W4-p2.12: Verification script unreviewed by domain expert — solo operator context

**Date:** 2026-04-11
**Story:** p2.12-improvement-agent-challenger-skill
**Decision type:** RISK-ACCEPT

Solo operator context. Risk: single-commit atomicity (AC3) is the hardest constraint to verify automatically — manual review of commit contents at PR merge is required per verification script Scenario 4. `reviewer` field PII constraint (must be named human, not CI job ID) must be manually verified.

**Accepted by:** Hamish (operator) 2026-04-11

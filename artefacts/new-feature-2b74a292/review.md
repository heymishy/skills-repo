# Review Report — Multi-User Role-Aware Synchronous Collaboration (new-feature-2b74a292)

**Review Date:** 2025-01-30
**Run:** 1
**Total Stories:** 12

---

## Story: ep1-s1

### Category A: Traceability

- ✓ Story references parent epic (pod-formation-product-assignment.md)
- ✓ Story references discovery artefact (discovery.md)
- ✓ Story references benefit-metric artefact (benefit-metric.md)
- ✓ "So that" connects to a named metric: "Synchronous team access"
- ✓ Benefit linkage field contains mechanism: "completes this story enables the first step: a pod exists and can be assigned to products"
- ✓ Metric exists in benefit-metric coverage matrix (MM1: Synchronous team access)

**Traceability score:** 5 — All references present and linked.

### Category B: Scope Discipline

- ✓ Story does not implement anything in epic out-of-scope
- ✓ Story does not implement anything in discovery out-of-scope
- ✓ Story's own out-of-scope section names excluded behaviour: "Editing existing pods (create-only for MVP)", "Archiving pods", "Pod templates"
- ✓ No scope additions requiring approval notes

**Scope integrity score:** 5 — Clear boundaries, no scope creep.

### Category C: AC Quality

- ✓ Given/When/Then format present
- ✓ Describes observable behaviour (pod appears in UI, table entry created)
- ✓ Independently testable (can test pod creation without other stories)
- ✓ Uses "is created in", "added to", "sees" (not "should")
- ✓ Edge cases (duplicate names, invalid roles) not in ACs but noted in NFRs
- ✓ Single AC present (minimum 3 required — **FINDING: Only 1 AC**)

**AC quality score:** 2 — Only 1 AC; minimum 3 required. FAIL.

**Finding 1-H1:** Story has only 1 AC; minimum is 3. Edge cases (duplicate pod names, role validation, member count limits) should be separate ACs, not collapsed into one AC or relegated to NFRs.

### Category D: Completeness

- ✓ User story in As/Want/So format
- ✓ Named persona: "Organisation administrator"
- ✓ Benefit linkage populated
- ✓ Out of scope populated (create-only, no editing, no archiving, no templates)
- ✓ NFRs populated (uniqueness, timing, validation)
- ✓ Complexity rated: 2
- ✓ Scope stability declared: Stable

**Completeness score:** 5 — All fields present and substantive.

### Category E: Architecture Compliance

- ✓ Architecture Constraints field populated with three ADRs (ADR-025, ADR-026, schema requirement)
- ✓ Implementation path (new `pods` table, `pod_members` table) aligns with ADR-025 (multi-tenancy at application layer)
- ✓ No use of anti-patterns
- ✓ Applicable repo-level ADRs referenced (ADR-025, ADR-026)
- ✓ NFRs align with mandatory constraints (uniqueness per tenant = ADR-025 tenant scoping enforcement)

**Architecture compliance score:** 5 — Guardrails respected.

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 1-H1: AC count below minimum (1 vs. 3 required). Edge cases must be separate ACs.

---

## Story: ep1-s2

### Category A: Traceability

- ✓ Story references parent epic
- ✓ Story references discovery and benefit-metric artefacts
- ✓ "So that" connects to named metric: "Synchronous team access"
- ✓ Benefit linkage contains mechanism
- ✓ Metric exists in benefit-metric

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Story does not implement out-of-scope items (defers pod editing, unassigning)
- ✓ Out-of-scope section present and clear
- ✓ No scope additions

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour (assignment saved, features show default pod)
- ✓ Independently testable
- ✓ Uses "is saved", "show" (not "should")
- ✗ Only 1 AC; minimum 3 required. Edge cases (re-assigning default, product with no features, inherited pod in existing features) missing.

**AC quality score:** 2 — FAIL (only 1 AC).

**Finding 2-H1:** AC count below minimum (1 vs. 3). Must split edge cases into separate ACs: (1) default pod assignment is saved correctly, (2) new features show default pod immediately, (3) existing features are unaffected by default pod change (deferred per out-of-scope, but should be explicit as a boundary AC).

### Category D: Completeness

- ✓ All fields present and substantive

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-026, ADR-025 referenced
- ✓ Canonical builder pattern cited (`getProductDefaultPod()`)
- ✓ New schema table named

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 2-H1: AC count below minimum (1 vs. 3 required). Edge cases (re-assignment, no existing features, unaffected existing features) must be separate ACs.

---

## Story: ep1-s3

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no override during creation, no UI member listing)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) feature created with default pod, (2) collaborators pre-populated, (3) pod members have correct roles in the feature context.

**AC quality score:** 2 — FAIL.

**Finding 3-H1:** AC count below minimum (1 vs. 3). Split into: (1) feature creation detects product default pod, (2) feature_collaborators table is pre-populated with all pod members, (3) each collaborator's role is correctly assigned in feature context.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-026, ADR-025 referenced
- ✓ Canonical builder pattern cited

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 3-H1: AC count below minimum (1 vs. 3).

---

## Story: ep2-s1

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no presence-based locking, no notifications, no status)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour (sidebar appears, shows users and online/offline status, heartbeat updates)
- ✓ Only 1 AC; minimum 3 required. Missing: (1) sidebar renders on page load, (2) presence updates via SSE within 30s, (3) offline status shows "last seen" timestamp.

**AC quality score:** 2 — FAIL.

**Finding 4-H1:** AC count below minimum (1 vs. 3). Split into separate ACs for: (1) sidebar renders on page load with all collaborators listed, (2) presence status updates within 30s, (3) offline users show "last seen" timestamp.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-026, ADR-027 referenced
- ✓ New schema tables named

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 4-H1: AC count below minimum (1 vs. 3).

---

## Story: ep2-s2

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no hiding stages, no enforcement, client-side only)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) role-filtered stages appear by default, (2) "Show all stages" toggle reveals hidden stages, (3) filtering applies to all roles (engineer, product, architect, conductor).

**AC quality score:** 2 — FAIL.

**Finding 5-H1:** AC count below minimum (1 vs. 3). Split into: (1) engineer role sees test-plan/review/DoR/coding by default, (2) product role sees discovery/benefit-metric/definition by default, (3) "Show all stages" toggle reveals all stages without hiding.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-027, client-side filtering noted
- ✓ No enforcement in MVP noted

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 5-H1: AC count below minimum (1 vs. 3).

---

## Story: ep2-s3

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no workflows, no conditional approvals, no notifications)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour (approval recorded, feature advances, decisions.md entry created)
- ✓ Only 1 AC; minimum 3 required. Missing: (1) approval modal appears and records reason, (2) feature advances to next stage, (3) decisions.md entry is auto-generated with date/user/reason.

**AC quality score:** 2 — FAIL.

**Finding 6-H1:** AC count below minimum (1 vs. 3). Split into: (1) approval modal appears with reason field, (2) feature advances to benefit-metric stage upon approval, (3) decisions.md entry is created with date, approver, and reason.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-024, ADR-020 referenced
- ✓ New schema table named

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 6-H1: AC count below minimum (1 vs. 3).

---

## Story: ep2-s4

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no optimistic conflict, no real-time cursors, no hard conflict handling)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour (concurrent edits detected, merged, both users see result)
- ✗ Only 1 AC; minimum 3 required. Missing: (1) concurrent edit detection and three-way merge, (2) line-level attribution recorded, (3) merge succeeds without manual intervention (≥99% success rate).
- ✗ Scope stability marked "Unstable (merge algorithm may need iteration)" — this is a complexity/risk flag, not a scope stability statement. **FINDING: Scope stability mischaracterized.**

**AC quality score:** 2 — FAIL (only 1 AC).

**Finding 7-H1:** AC count below minimum (1 vs. 3). Split into: (1) server detects concurrent edits within 100ms, (2) three-way merge produces correct combined result, (3) line-level attribution is accurate.

**Finding 7-M1:** Scope stability field says "Unstable (merge algorithm may need iteration)" — this is a risk/complexity note, not a scope stability declaration. Scope stability should be "Stable" or "Unstable" with no explanation; complexity already captures the risk.

### Category D: Completeness

- ✓ All fields present (though scope stability mischaracterized, see finding above)

**Completeness score:** 4 — Scope stability field misused.

### Category E: Architecture Compliance

- ✓ ADR-028 canonical builder pattern cited
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C + D)

**Findings:**
- 7-H1: AC count below minimum (1 vs. 3).
- 7-M1: Scope stability field mischaracterized as a risk note instead of a binary declaration.

---

## Story: ep3-s1

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no approval gate, no partial regression, no specific edit revert)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) regression request UI appears, (2) stage and reason are recorded, (3) prior approvals are preserved (not deleted).

**AC quality score:** 2 — FAIL.

**Finding 8-H1:** AC count below minimum (1 vs. 3). Split into: (1) regression UI allows user to select target stage and enter reason, (2) feature stage is reset and downstream stages marked incomplete, (3) prior approval records are preserved for audit.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-025 tenant scoping
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 8-H1: AC count below minimum (1 vs. 3).

---

## Story: ep3-s2

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no editing, no approval gate)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour (entry appended to decisions.md)
- ✓ Only 1 AC; minimum 3 required. Missing: (1) entry is appended to decisions.md, (2) entry contains all required fields (date, user, reason, stage), (3) entry is persisted to disk within 2s.

**AC quality score:** 2 — FAIL.

**Finding 9-H1:** AC count below minimum (1 vs. 3). Split into: (1) decisions.md entry is appended with regression context, (2) entry includes date/user/reason/stageReverted, (3) entry persists to disk within 2s.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-029 disk-canonical reference
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 9-H1: AC count below minimum (1 vs. 3).

---

## Story: ep3-s3

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no different approver requirement, no workflow changes)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) re-approval is recorded with prior approval reference, (2) feature advances (state transition), (3) decisions.md entry shows re-approval with update context.

**AC quality score:** 2 — FAIL.

**Finding 10-H1:** AC count below minimum (1 vs. 3). Split into: (1) approval record is created with reApprovalOf linking to original, (2) feature advances from definition to next stage, (3) decisions.md entry is appended showing re-approval and update context.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ Architecture Constraints populated
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 10-H1: AC count below minimum (1 vs. 3).

---

## Story: ep4-s1

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no new pod creation, no dynamic member changes)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) multi-pod assignment UI loads correctly, (2) pod subset selection works (remove Bob), (3) feature_collaborators reflects union minus removals.

**AC quality score:** 2 — FAIL.

**Finding 11-H1:** AC count below minimum (1 vs. 3). Split into: (1) product owner can select multiple pods via UI, (2) members can be individually removed per-feature, (3) feature_collaborators is correctly derived from union minus removals.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-026 canonical builder pattern
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 11-H1: AC count below minimum (1 vs. 3).

---

## Story: ep4-s2

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no approval gates, no notifications)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) add team member UI appears and allows selection, (2) member is added to feature_collaborators, (3) new member's presence appears in sidebar within 30s.

**AC quality score:** 2 — FAIL.

**Finding 12-H1:** AC count below minimum (1 vs. 3). Split into: (1) feature lead can add non-pod member via UI, (2) member is added to feature_collaborators with override record, (3) member's presence updates in sidebar within 30s.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ ADR-026 canonical builder pattern
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 12-H1: AC count below minimum (1 vs. 3).

---

## Story: ep4-s3

### Category A: Traceability

- ✓ All references present
- ✓ Benefit metric linked

**Traceability score:** 5

### Category B: Scope Discipline

- ✓ Clear out-of-scope (no bulk archival, no un-archiving, no merging)

**Scope integrity score:** 5

### Category C: AC Quality

- ✓ Given/When/Then format
- ✓ Observable behaviour
- ✓ Only 1 AC; minimum 3 required. Missing: (1) archive action is available in UI, (2) pod status changes to archived, (3) archived pod no longer appears in dropdowns but remains in audit trail.

**AC quality score:** 2 — FAIL.

**Finding 13-H1:** AC count below minimum (1 vs. 3). Split into: (1) org admin can archive pod via UI, (2) pod status is set to archived, (3) archived pod is hidden from new dropdowns but visible in feature audit trail.

### Category D: Completeness

- ✓ All fields present

**Completeness score:** 5

### Category E: Architecture Compliance

- ✓ Architecture Constraints populated
- ✓ No anti-patterns

**Architecture compliance score:** 5

---

### Verdict: **FAIL** (Category C)

**Findings:**
- 13-H1: AC count below minimum (1 vs. 3).

---

## Scoring Summary

| Story | Traceability | Scope | AC Quality | Completeness | Architecture | Verdict |
|-------|--------------|-------|------------|--------------|--------------|---------|
| ep1-s1 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep1-s2 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep1-s3 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep2-s1 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep2-s2 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep2-s3 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep2-s4 | 5 | 5 | 2 | 4 | 5 | FAIL |
| ep3-s1 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep3-s2 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep3-s3 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep4-s1 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep4-s2 | 5 | 5 | 2 | 5 | 5 | FAIL |
| ep4-s3 | 5 | 5 | 2 | 5 | 5 | FAIL |

---

## Overall Verdict

**FAIL — 12 HIGH findings**

**Summary:** All 12 stories fail Category C (AC Quality) with the same structural issue: each story has only 1 AC when the minimum requirement is 3 ACs per story. Additionally, ep2-s4 has a MEDIUM finding regarding scope stability field misuse.

**Oldest open finding:** 1-H1 (ep1-s1: AC count below minimum)

**Required action:** Every story must be expanded to include a minimum of 3 ACs. Edge cases and alternative flows that are currently collapsed into a single AC or relegated to NFRs must be elevated to independent ACs with their own Given/When/Then structure.
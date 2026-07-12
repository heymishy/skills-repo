# DoR Contract: A logged-in user links a second auth provider to their identity

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s2.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s2-cross-provider-linking-test-plan.md

---

## Contract Proposal

**What will be built:**
1. A link-account settings route (behind `authGuard`, requiring an active session) that accepts a request to link a second provider identity to the currently logged-in person.
2. A "complete second-provider auth" step, reusing the existing per-provider adapters (`gitHubProviderAdapter`, `setGoogleUserInfoAdapter`, the email/password path) to confirm ownership of the identity being linked — not a new OAuth integration, just invoking what already exists a second time within the link flow.
3. A `people` table update (direct pool query, no new adapter) merging the second identity's provider-specific key onto the existing person row from tir-s1's schema.
4. Rejection logic for: unauthenticated access (redirect to login), and linking an identity already linked to a different person.

**What will NOT be built:**
- No automatic email-based merging — explicitly excluded per discovery's resolved assumption.
- No "unlink" action.
- No polished settings UI — a functional control only, per discovery's MVP scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: authenticated as GitHub identity X via the `NODE_ENV=test` auth-bypass fixture, complete a mocked Google auth for identity Y, assert one `people` row maps both | integration |
| AC2 | Integration test: unauthenticated request to the link-settings endpoint, assert redirect | integration |
| AC3 | Integration test: two separate signups sharing an email via different providers, assert two distinct `people` rows | integration |
| AC4 | Integration test: attempt to link an identity already linked to a different person, assert rejection and no data change | integration |

**Assumptions:**
- The `people` table's linking mechanism is a direct pool update (adding a second provider-key column value, or a join-table row — implementation detail left to the coding agent, since the story doesn't mandate one specific schema shape beyond "same person row"), not a new D37 adapter — consistent with tir-s3/s4/s5's own reasoning that this feature's DB writes are app-layer logic, not adapter-mediated.
- ADR-018's auth-bypass fixture (added to this story's Architecture Constraints during /review Run 2) is sufficient to simulate "completing a second provider's auth" — no real OAuth network call is attempted in any test.

**Estimated touch points:**
Files: new route handler (settings/link-account), `src/web-ui/modules/user-roles.js` or `people`-table access module from tir-s1, new `tests/check-tir-s2-cross-provider-linking.js`
Services: None new (reuses existing provider adapters)
APIs: None new

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ link-account route + second-provider auth confirmation, verified by the integration test using the ADR-018 fixture — ✅ aligned.
- AC2 ↔ `authGuard`-style rejection for unauthenticated requests, verified directly — ✅ aligned.
- AC3 ↔ no auto-merge logic exists to build (a negative property), verified by the two-separate-signups test — ✅ aligned.
- AC4 ↔ already-linked rejection check, verified directly — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Product / BA team member" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2: PASS, 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — this is a code-level dependency on tir-s1's `people` schema, not literally a pipeline-state.json field read, but recorded per the bri-s3.2 precedent since tir-s1 must reach a signed-off/merged state before this story's implementation can sequence. `dorStatus` confirmed present in `pipeline-state.schema.json`. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018 (added Run 2), ADR-025, D37, provider registry all cited |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | Unregulated |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Discovery `## Approved By` populated |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced — reuses existing provider adapters and direct DB access, consistent with the story's own Architecture Constraints reasoning |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 2: 0 MEDIUM remain | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as tir-s1. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | | |

---

## Oversight

**Level:** Medium (per epic tir-e1)
**Handling:** Same as tir-s1 — this DoR artefact is the share-with-tech-lead step in a solo-operator repo.

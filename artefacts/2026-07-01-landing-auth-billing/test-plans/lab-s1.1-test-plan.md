# Test Plan — lab-s1.1 — Auth tech spike: ESM/CJS path recommendation

**Story:** lab-s1.1
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s1.1-auth-spike.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Document verification — synthetic. No external service calls. Tests read artefact files from the `artefacts/` directory and assert structural completeness. The spike outcome document is the test subject, not a running server.

**PCI/sensitivity:** None.

**Test data gaps:** None — all assertions are against committed artefact files.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | Spike outcome doc exists with all 6 required sections | Unit (file read) | T1.1, T1.2, T1.3, T1.4, T1.5, T1.6 | None |
| AC2 | Spike completes within 1-day time-box | Manual — time-box is process constraint, not code-verifiable | — | Manual (process gate) |
| AC3 | Path C: proof-of-concept runs if C chosen | Conditional — verified only if Path C selected; manual run | — | Conditional |
| AC4 | Path A/B: Neon adapter confirmed if A/B chosen | Conditional — verified only if Path A or B selected; manual check | — | Conditional |
| AC5 | decisions.md ARCH-002 updated with chosen path | Unit (file read) | T2.1, T2.2 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC2 | Process gate | Manual scenario in verification script | Time-box enforcement is a process discipline — no code assertion can verify that the spike exited within 1 day |
| AC3 | Conditional path | Manual scenario — conditional on spike outcome | AC3 applies only if Path C is chosen; script documents steps to run the PoC |
| AC4 | Conditional path | Manual scenario — conditional on spike outcome | AC4 applies only if Path A or B is chosen; manual Neon adapter test |

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — Spike outcome document completeness (AC1)

**T1.1** — `spike-outcome-doc-exists`
Covers: AC1
Precondition: Spike is complete and author has committed the research file
Action: `fs.existsSync('artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md')`
Expected: file exists (boolean `true`)
Edge case: none

**T1.2** — `spike-outcome-contains-path-recommendation`
Covers: AC1 §1
Precondition: T1.1 passes
Action: Read file; check for pattern `/Path [ABC] (is |recommended|chosen)/i`
Expected: at least one match found
Edge case: none

**T1.3** — `spike-outcome-contains-rationale-section`
Covers: AC1 §2
Precondition: T1.1 passes
Action: Read file; check for heading or keyword `rationale` (case-insensitive)
Expected: present
Edge case: none

**T1.4** — `spike-outcome-contains-unblocked-stories-list`
Covers: AC1 §6
Precondition: T1.1 passes
Action: Read file; check for at minimum one reference to `lab-s1.3` (the first unblocked story)
Expected: present
Edge case: file may list more stories — that is acceptable

**T1.5** — `spike-outcome-contains-session-schema-strategy` (conditional for Path A/B)
Covers: AC1 §5
Precondition: T1.1 passes and document recommends Path A or B
Action: Read file; check for `session schema` or `forced re-auth` or `re-authentication` mention
Expected: present if Path A/B; may be N/A for Path C (acceptable)
Edge case: Path C may omit this section — note explicitly

**T1.6** — `spike-outcome-no-real-credentials`
Covers: NFR — no credentials in spike artefact
Precondition: T1.1 passes
Action: Read file; assert no match against `/sk_live_|sk_test_|ghp_|DATABASE_URL=postgres:/\/\//i`
Expected: zero matches
Edge case: none

### T2 — decisions.md ARCH-002 update (AC5)

**T2.1** — `decisions-md-arch002-not-deferred`
Covers: AC5
Precondition: Spike is complete
Action: Read `artefacts/2026-07-01-landing-auth-billing/decisions.md`; check ARCH-002 entry does NOT contain `DEFERRED to spike exit`
Expected: the string `DEFERRED to spike exit` is absent from the ARCH-002 entry
Edge case: none

**T2.2** — `decisions-md-arch002-contains-chosen-path`
Covers: AC5
Precondition: T2.1 passes
Action: Check ARCH-002 entry contains `Path A`, `Path B`, or `Path C`
Expected: exactly one path name present
Edge case: none

---

## Integration tests

No integration tests — this story has no running server or database. All verification is document-structural.

---

## NFR tests

**NFR1** — `no-real-credentials-in-spike-artefacts`
Covers: NFR — no credentials in spike artefact
Precondition: Spike complete
Action: Run `git grep` on committed research directory for common credential patterns
Expected: zero matches for `sk_live_`, `sk_test_`, `ghp_`, `postgres://[^$]` (excluding placeholders)
Edge case: grep on working tree, not just committed files

---

## State update fields

- `totalTests`: 9
- `acTotal`: 5
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false

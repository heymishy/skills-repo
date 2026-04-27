# NFR Profile: 2026-04-27-p1-hash-defect

**Feature:** Hash self-comparison defect fix
**Created:** 2026-04-27
**Data classification:** No user data — this feature handles skill file hashes (SHA-256 of SKILL.md content) only. Not PCI scope. No PII.

---

## NFR Items

| ID | Category | Statement | Source | Status |
|----|----------|-----------|--------|--------|
| NFR-SEC-1 | Security | After the fix, `govPackage.verifyHash` must never receive `actual === expected` from `advance()` when a real `sidecarRoot` is supplied. The actual hash must be independently derived via `resolveSkill`. | C5 — hash verification non-negotiable | Met when tests pass |
| NFR-PERF-1 | Performance | The `resolveSkill` call adds one synchronous file read per `advance()` call. Acceptable — this is a governance gate operation, not a hot path. | Architecture constraint — no performance budget specified | Accepted |
| NFR-DEP-1 | Dependencies | No new npm packages added. Node.js built-ins only (`fs`, `path`, `crypto` already used). | ADR-016 / platform constraint | Met by design |

---

## Compliance

**Regulated:** false (personal, non-regulated repo — `meta.regulated: false` in `context.yml`)
**Compliance frameworks:** None
**Sensitive data categories:** None

---

## Sign-off

NFR-SEC-1 is the load-bearing NFR — it is the behaviour that AC1/AC2/AC3 tests verify. No separate human sign-off required for H-NFR2 (no regulatory clauses). H-NFR3: data classification above is not blank — No user data / No PII / Not PCI scope.

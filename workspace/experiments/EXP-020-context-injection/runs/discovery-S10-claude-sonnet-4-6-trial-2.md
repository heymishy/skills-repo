I'll read the product context and reference materials before we begin.

No `product/` directory or `artefacts/` reference folder was found for this initiative. I'll proceed with what you've provided — it's a rich brief, so I can pre-populate most sections directly.

Let me also check `.github/context.yml` for EA registry and compliance configuration.

The context files confirm:
- **Regulated:** true
- **Jurisdiction:** NZ / AU secondary
- **Operator type:** Registered bank
- **Regulatory frameworks in scope:** RBNZ BS11, CCCFA, AML/CFT, FX reporting, CPG 220, SWIFT correspondent, DIA payment services

This is a material core banking system migration. Before I ask clarifying questions, I need to flag that the regulatory context activates several hard obligations that must be surfaced at discovery — not deferred to definition.

---

Let me work through the sections. I have enough to draft most of them, but I have a few targeted questions to ask before locking scope.

---

**Section 1 — Problem statement: confirmed from your brief.**

The legacy loan ledger will lose vendor support in 12 months. Continuing on an unsupported system exposes the bank to unpatched security vulnerabilities, regulatory non-compliance risk, and operational fragility with no vendor remediation path. The bank must migrate 280,000 active loan accounts to the new core banking platform and formally decommission the legacy system within that window.

> Does that capture it? Reply: yes — or correct me

---

**Section 2 — Who it affects: I can draft this, but I want to confirm one thing first.**

You've described personal loans, home loans, and commercial lending. Before I write the personas:

> **Are commercial lending accounts subject to the same migration approach as consumer credit accounts — same toolset, same parallel operation window, same cutover schedule?** Or is commercial lending being handled separately (different data model, different regulatory treatment, different team)?

This affects how I scope the personas and whether commercial lending is in-scope for MVP or a separate stream.

Reply: same approach — or separate stream / describe the difference
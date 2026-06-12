# Initial Context Processing

I'm reading a complex regulated financial services scenario with hard dependencies and regulatory gates. Before I ask clarifying questions, let me check what's already available to us.

## Step 0 — Product context and reference materials check

Checking for `product/mission.md`, `constraints.md`, `tech-stack.md`... 

**None of these files appear to exist in your repo.** I'll work with what you've provided in this brief.

Checking for reference materials in `artefacts/*/reference/`...

**No reference folder structure exists yet.** If you have existing RBNZ correspondence, vendor migration toolset documentation, or data mapping specs, I'd recommend uploading them to `artefacts/2025-legacy-ledger-decommission/reference/` after we finalize this scope — /benefit-metric and /definition will read them automatically.

## Regulatory context injected

I've read the organisational context — you're a **registered bank in NZ**. This means the following frameworks are **active and non-negotiable**, even though they're not named in your brief:

| Framework | What it means for this project |
|-----------|------|
| **RBNZ BS11** (Outsourcing Policy) | Migration or replacement of a core banking system = **material change**. You must notify RBNZ **at least 30 business days before any irreversible project activity begins** — not just before go-live. Data migration toolchain work, infrastructure provisioning, parallel-run setup = irreversible. The clock starts from RBNZ acknowledgement. |
| **CCCFA** (Credit Contracts Act) | Credit records must be retained **7 years from when the contract ends** (you've stated this correctly). Migration cannot complete until retention compliance is confirmed on the destination system. |
| **AML/CFT Act 2009** | All loan accounts carry AML/CFT obligations. Migration must preserve originator/counterparty information on any cross-border loan features. |
| **RBNZ FX Reporting** | If any loans have cross-currency or hedging features, FX net settlement positions are reportable to RBNZ. |

---

# First Clarifying Question

You've given me an exceptionally clear brief — role, timeline, technical scope, regulatory awareness. I have one clarifying gate question before I produce the discovery artefact:

## Has the RBNZ BS11 notification process already been opened with RBNZ?

The reason I ask: BS11 requires **notification at least 30 business days before any irreversible project activity begins**. You've identified a 12-month hard cutover deadline, which is the external constraint. But BS11's 30-day clock is the internal regulatory constraint — it gates when you can actually start toolchain work, infrastructure setup, or data migration pilots.

**To scope this correctly, I need to know:**

1. **Has your RBNZ relationship team already filed a BS11 material change notification, or is that part of this discovery's scope?**
   - If yes: when was it acknowledged by RBNZ? (This tells us when irreversible work can start)
   - If no: this must happen before /definition locks any technical timeline

2. **Is the RBNZ notification process a dependency of this initiative, or is it assumed to have already been handled?**

Reply with those two details, and I'll produce the discovery artefact. The answer shapes whether the discovery includes "obtain RBNZ BS11 acknowledgement" as a hard upstream gate or whether we're already past it.
# Discovery Pipeline: Note-Taking App for Meeting Notes & Decisions

Let me start by reviewing the platform constraints, then work through discovery systematically.

---

## 📋 Platform Context Review

*Reading `product/constraints.md`...*

Given you're a regulated financial services firm with 500+ employees, I'm going to assume constraints typical to this context (and flag where I need you to confirm):

- **Data residency / sovereignty requirements** (likely)
- **Audit trail / compliance obligations** (SEC, FINRA, or similar)
- **SSO/Identity provider integration required**
- **Data retention policies** (both minimum and maximum retention)
- **Existing tooling ecosystem** (Microsoft 365? Google Workspace? Slack?)

> ⚠️ **I need you to share or confirm `product/constraints.md`** — I'm working from reasonable assumptions for now, but the real file may contain specifics that change the analysis.

---

## 🔍 Phase 1: Problem Decomposition

Before solutioning, let me pressure-test the problem statement.

### What I heard:
*"We need a note-taking app so teams can capture meeting notes and decisions in one place."*

### What I need to understand:

| Question | Why It Matters |
|---|---|
| **What's happening today?** Are notes in emails, personal notebooks, Word docs, Confluence, nowhere? | Tells us if this is a consolidation problem or a "notes don't exist" problem |
| **Who is the primary user?** EAs, team leads, all attendees, a dedicated note-taker? | Shapes the UX dramatically |
| **What happens to notes after capture?** Are they referenced? Searched? Audited? Forwarded to compliance? | Determines whether this is a *capture* tool or a *retrieval/accountability* tool |
| **What's the actual pain?** Missed decisions? No accountability? Audit failures? Duplicated discussions? | The pain points determine priority features |
| **Why not an existing tool?** (Notion, OneNote, Confluence) What was tried and why did it fail? | Avoids rebuilding something that failed for non-product reasons (adoption, policy, etc.) |

> 🚩 **Red flag I want to name early:** "Build a note-taking app" is a *solution*. The discovery pipeline starts with the *problem*. There are dozens of excellent note-taking tools — **the question is why build vs. buy, and what's uniquely required here.**

---

## 🔍 Phase 2: Hypotheses to Validate

Based on the regulated financial services context, here are my hypotheses about *why* off-the-shelf tools may not work:

| # | Hypothesis | Validation Method |
|---|---|---|
| H1 | Compliance requires decisions to be immutable and auditable — consumer note tools don't support this | Interview compliance/legal team |
| H2 | Notes contain material non-public information (MNPI) and cannot live in third-party SaaS | Confirm with InfoSec / data governance |
| H3 | Teams need structured decision records (not freeform notes) linked to action items and owners | Interview 5-8 meeting-heavy teams |
| H4 | The real problem is *finding past decisions*, not *capturing notes* | Search/retrieval usage analysis |
| H5 | Adoption of past tools failed because they weren't integrated into the existing meeting workflow (calendar, video, chat) | Retrospective on past tool adoption |

---

## 🔍 Phase 3: Build vs. Buy Analysis (Preliminary)

| Factor | Build | Buy/Configure |
|---|---|---|
| Compliance & audit trail | Custom to your regs ✅ | May require enterprise tier + customization |
| Data residency | Full control ✅ | Depends on vendor |
| Time to value | 3-6+ months ❌ | Days to weeks ✅ |
| Maintenance burden | Ongoing team cost ❌ | Vendor-managed ✅ |
| Integration w/ internal systems | Full control ✅ | API-dependent |
| Differentiation | Is note-taking a competitive advantage? **Almost certainly not.** ❌ | — |

> 💡 **My early lean:** Unless H1 or H2 are strongly confirmed, this is likely a **buy + configure** scenario, not a custom build. Tools like Notion (with enterprise controls), Confluence, or specialized tools like Hugo/Fireflies with enterprise compliance features should be evaluated first.

---

## ✅ Recommended Next Steps

1. **Answer the questions in Phase 1** — particularly *what's happening today* and *what specific pain triggered this request*
2. **Validate H1 and H2 with compliance and InfoSec** — this is the build/buy deciding factor
3. **Run 5-8 user interviews** with meeting-heavy roles (PMs, team leads, EAs) focusing on current workflow, not desired features
4. **Map the decision lifecycle**: Capture → Store → Retrieve → Act → Audit
5. **Then** reconvene to decide: build, buy, or configure

---

**What can you tell me about the current state — what triggered this request, and what's been tried before?**
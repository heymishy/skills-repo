# Discovery Pipeline: Note-Taking App for Meeting Notes & Decisions

Let me start by reviewing the platform constraints, then work through the discovery process systematically.

---

## 📋 Reading Platform Context

*I'd normally read `product/constraints.md` here. Since I don't have access to that file, I'll flag the regulated financial services context as a critical input and incorporate common constraints for that industry throughout this analysis.*

**Assumed constraints for a regulated financial services firm (500+ employees):**
- Data must be encrypted at rest and in transit
- Audit trails / immutability requirements for certain records
- Retention policies governed by SEC, FINRA, MiFID II, or similar
- SOC 2 / ISO 27001 compliance likely required
- On-prem or approved cloud hosting only
- SSO/SAML integration mandatory
- Role-based access control (RBAC)
- Potential eDiscovery obligations

---

## 🔍 Phase 1: Problem Framing

Before solutioning, I need to pressure-test the request. Here are the questions that matter:

### Questions I'd ask the requesting team:

**1. What's actually broken today?**
- Where are meeting notes currently captured? (Email threads? Confluence? Nowhere?)
- What happens when someone needs to find a decision made 6 months ago?
- Have there been compliance or audit incidents related to lost/undocumented decisions?

**2. Who specifically feels this pain?**
- Is this all 500+ employees, or specific teams (e.g., investment committees, compliance, deal teams)?
- Are there regulatory scenarios where meeting minutes are *required* artifacts?

**3. What does "decisions" mean in your context?**
- Informal team decisions, or formal governance decisions with approval authority?
- Do decisions need sign-off, attestation, or voting records?
- Are these discoverable records under your regulatory framework?

**4. What's been tried before?**
- Any tools already licensed but underused? (SharePoint, Confluence, Notion, etc.)
- Why did previous approaches fail?

---

## ⚠️ Phase 2: Risk & Assumption Audit

| Assumption in the Request | Risk if Wrong | What to Validate |
|---|---|---|
| "We need to **build**" | Build vs. buy — building is 10-100x more expensive than configuring an existing tool | Have you evaluated Confluence, Notion (w/ enterprise), or SharePoint with templates? |
| "One place" implies centralization | Teams may have legitimate reasons for different tools (deal rooms, board portals) | Map the actual workflow — is one tool realistic? |
| "Meeting notes" are the unit | The real problem might be *decision traceability*, not note-taking | Validate whether search/retrieval of decisions is the core job-to-be-done |
| All teams have the same need | Investment committee minutes ≠ standup notes ≠ client meeting records | Segment users before designing one solution |

### 🚨 Critical Flag: Build vs. Buy

> For a regulated firm, **building a custom note-taking app should be the last resort**, not the first instinct. Custom-built tools carry ongoing compliance burden (penetration testing, audit certification, retention policy enforcement, access reviews). Off-the-shelf tools with compliance certifications dramatically reduce this overhead.

**My recommendation: Only build if the discovery process reveals a workflow that no existing tool can support after configuration.**

---

## 🗺️ Phase 3: Jobs-to-Be-Done (Hypotheses)

If we proceed, here are the likely jobs users are hiring this product to do:

| Job | Context | Success Metric |
|---|---|---|
| **Capture notes in/after meetings** | During live meetings or within 24hrs | Time-to-capture < 5 min |
| **Find a past decision quickly** | "Did we approve X?" — often under time pressure | Search-to-answer < 30 sec |
| **Prove a decision was made** | Audit, compliance, legal discovery | Immutable record with timestamp + attendees |
| **Share outcomes with non-attendees** | Cross-team visibility | Stakeholders can self-serve without asking |
| **Track action items to completion** | Accountability after meetings | Action items have owners + due dates + status |

---

## 📐 Phase 4: Recommended Next Steps

Instead of jumping to building, here's the discovery work I'd sequence:

### Week 1-2: Research
- [ ] **Interview 8-10 users** across 3+ departments (compliance, front office, operations)
- [ ] **Audit existing tools** — what's already licensed? What's the adoption gap?
- [ ] **Map regulatory requirements** with Legal/Compliance — what *must* be retained, for how long, in what format?

### Week 3: Synthesize
- [ ] **Build a decision matrix**: Buy (configure existing tool) vs. Build
- [ ] **Define user segments** and their distinct needs
- [ ] **Draft regulatory requirements spec** with Compliance sign-off

### Week 4: Decide
- [ ] If **Buy**: Run a 2-week proof-of-concept with top 2 tools
- [ ] If **Build**: Produce a scoped RFC with architecture, compliance controls, and cost estimate for leadership review

---

## 💬 My Honest Take

The request as stated — *"build a note-taking app"* — is a **solution looking for a well-defined problem**. That's normal at this stage, but it's my job to flag it.

The highest-value outcome of this discovery isn't an app — it's answering: **"What is the smallest intervention that gives our teams reliable decision traceability while meeting our compliance obligations?"**

That answer might be a configured Confluence space with templates and retention policies. Or it might be a custom tool. But we won't know until we do the research.

**Want me to draft the interview script for the user research phase, or dig into the build-vs-buy evaluation framework first?**
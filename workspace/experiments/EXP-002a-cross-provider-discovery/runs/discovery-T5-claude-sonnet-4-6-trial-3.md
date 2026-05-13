# Discovery Pipeline: Note-Taking App for Meeting Notes & Decisions

Let me work through this properly before jumping to solutions.

---

## 🔴 What I Need to Flag First

**I don't actually have access to `product/constraints.md`** — I can't read files from your system. Before this discovery goes further, someone needs to pull the actual constraints document and cross-reference what I produce here. I'll flag the specific decision points where that file will matter most.

---

## Phase 1: Problem Framing

### The stated need vs. the actual problem

> *"Capture meeting notes and decisions in one place"*

This is a **solution** dressed as a problem. Let's back up.

**What pain are we actually solving?**

| Hypothesis | Validating Question |
|---|---|
| Decisions get lost or disputed | "Can you show me a recent decision that caused a problem because no one could find it?" |
| Notes exist but are scattered | "Where do notes live today — and why is that bad?" |
| No one takes notes at all | "What percentage of meetings produce any written artifact?" |
| Notes exist but aren't actionable | "Do action items from meetings get tracked anywhere?" |
| Compliance/audit trail requirement | "Has a regulator or legal team asked for this?" |

**You are in financial services.** That last hypothesis isn't just a product nicety — it may be a **regulatory driver**, which changes the entire build vs. buy calculus.

---

## Phase 2: Constraint Mapping

### What I'd expect `product/constraints.md` to contain — and why each matters here

Since I can't read it, I'll make the dependencies explicit so you can resolve them:

---

**🔒 Constraint Area 1: Data Residency & Sovereignty**

*Why it matters here:* Meeting notes in financial services will contain material non-public information (MNPI), client names, deal discussions, and regulatory decisions.

*Decision gate:* Can data leave your sovereign boundary / approved cloud regions?

→ If **no**: rules out most SaaS tools (Notion, Confluence hosted externally, etc.) unless you have specific DPA agreements already in place.

---

**🔒 Constraint Area 2: Records Retention Requirements**

*Why it matters here:* SEC Rule 17a-4, MiFID II Article 16, FINRA 4511 (depending on your jurisdiction) may **require** you to retain business communications — including meeting notes — for 3–7 years in a tamper-evident format.

*Decision gate:* Are meeting notes classified as "business records" under your compliance policy?

→ If **yes**: this is no longer a productivity tool. It's a **records management system** with specific technical requirements (WORM storage, audit logs, legal hold capability).

→ This single constraint can **eliminate or mandate** specific architectural choices before you write a line of code.

---

**🔒 Constraint Area 3: Integration Boundaries**

*Why it matters here:* You have 500+ employees. Note-taking in isolation fails. You need to know:

- What calendar system? (M365/Google/Bloomberg)
- What identity provider? (SSO requirements, MFA)
- What existing intranet/wiki exists, and why is it failing?
- What ticketing system for action items? (Jira, ServiceNow, etc.)

---

**🔒 Constraint Area 4: Existing Procurement**

*Why it matters here:* 500-person regulated firm almost certainly has existing licenses for M365 or Google Workspace. **OneNote + SharePoint** or **Google Docs + Meet** may already solve this problem without a new build.

*The most important discovery question:* **Why doesn't what you already pay for work?**

---

## Phase 3: Stakeholder & User Analysis

### Who actually is "the team"?

You said teams (plural). I'd map at least:

```
Meeting Note Stakeholders
│
├── Note Takers (writers)
│   ├── Executive assistants
│   ├── Project managers
│   └── Meeting participants ad hoc
│
├── Note Consumers (readers)
│   ├── Attendees (confirmation)
│   ├── Absent stakeholders (catch-up)
│   └── Future teams (institutional memory)
│
├── Decision Owners
│   └── Need traceability: who decided, when, with what info
│
└── Compliance / Legal / Audit
    └── May need read-only access, export, legal hold
```

**These groups have conflicting needs:**

| User | Core need | Implication |
|---|---|---|
| Note taker | Fast, low friction capture | Minimal structure, keyboard-first |
| Consumer | Findable, scannable | Enforced structure, good search |
| Decision owner | Attribution, context | Metadata, version history |
| Auditor | Tamper-evident, exportable | Technical controls, not just UI |

A tool optimized for the note taker will fail the auditor. You need to decide whose needs are primary — or build different surfaces for each.

---

## Phase 4: Build vs. Buy Analysis

**My strong prior for a 500-person regulated firm:** this should almost certainly be **configuration, not construction**.

### Option Map

```
Low Complexity ←————————————————→ High Complexity
     │                                    │
  Configure                            Build
  existing                             custom
     │                                    │
  M365/GWS        Specialized         Full custom
  already          SaaS with           internal
  licensed         BAA/DPA             platform
  (Teams,        (Notion Enterprise,
  OneNote,        Confluence Data
  SharePoint)     Center, Guru)
```

**When building custom is actually justified:**
- Specific workflow that no tool supports
- Integration requirement unique to your stack
- Compliance requirement no vendor will sign off on
- You have the eng capacity and this is strategic

**When it's not:**
- The problem is adoption/culture, not tooling
- You haven't fully configured what you already have
- The "unique need" is actually standard but unfamiliar

---

## Phase 5: The Questions That Should Gate Any Build Decision

Before writing requirements, I'd want answered:

### 🔴 Must-answer (blocker tier)

1. **Has Legal/Compliance reviewed whether meeting notes are regulated records?** If not, this needs to happen before any tool selection.

2. **What is the primary failure mode today?** Notes aren't taken? Notes are taken but lost? Notes are found but disputed? Each has a different solution.

3. **What tools do employees already use for this, and why will they abandon them for something new?** (Adoption is your biggest risk, not technology.)

4. **Do you have an M365 or Google Workspace license?** If yes, what specifically doesn't work about the built-in tools?

### 🟡 Should-answer (shapes the solution)

5. What does a "decision" mean structurally? (Needs owner, date, context, alternatives considered, approval chain?)

6. Who is responsible for ensuring notes are taken? Is this a people/process problem being solved with software?

7. What integrations are non-negotiable at launch vs. nice-to-have?

8. What's the org's tolerance for yet another tool to log into?

---

## Phase 6: Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Compliance requires features you didn't scope | High | High | Legal review before requirements finalized |
| Low adoption — people keep using email/Slack | Very High | High | Solve the process problem, not just tooling |
| Builds duplicate of what M365 already does | Medium | High | Audit existing licenses first |
| MNPI in notes causes data classification issues | Medium | Very High | Data classification policy must precede build |
| "One place" becomes another siloed place | High | Medium | Integration-first design |

---

## Recommended Next Steps

Rather than a backlog, here's a **discovery sprint** structure:

```
Week 1: Constraint resolution
├── Pull product/constraints.md and cross-reference this analysis
├── 30-min with Legal/Compliance on records retention
└── Audit existing tool licenses (what do we already pay for?)

Week 2: User research
├── 5-7 interviews across note-taker, consumer, and decision-owner roles
├── Shadowing: attend 3 meetings, observe what actually happens to notes
└── Failure archaeology: find 3 real examples of the problem causing pain

Week 3: Options analysis
├── Can existing tools be configured to solve this? (Prototype it)
├── If not, define the specific gap that requires custom build
└── Present options with constraint-validated recommendation

Week 4: Decision + scoping (only if build is justified)
├── Validated problem statement
├── MVP scope with compliance sign-off
└── Success metrics defined before build starts
```

---

## What I'd Push Back On Directly

The framing "we should build a note-taking app" is doing a lot of work that hasn't been earned yet.

**"Build"** assumes custom development is the answer. It may not be.

**"Note-taking app"** assumes the problem is the tool. It's probably the process.

**"In one place"** assumes consolidation solves the problem. It often just moves the mess.

The most valuable thing this discovery pipeline can do is **challenge that framing with evidence** before any team spends time building something that doesn't get used, doesn't meet compliance requirements, or duplicates something you already own.

---

*Flag for operator: wherever `product/constraints.md` specifies data classification tiers, approved vendors, or existing enterprise agreements — those sections should be reviewed against Phase 2 of this document before discovery concludes.*
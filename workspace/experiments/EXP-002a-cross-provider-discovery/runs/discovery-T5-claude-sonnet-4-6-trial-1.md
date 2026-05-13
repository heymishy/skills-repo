# Discovery Pipeline: Note-Taking App for Financial Services

## What I'm doing first

Before generating solutions, I need to surface the constraints and assumptions that will shape everything. Let me think through this carefully rather than jumping to feature lists.

---

## 🔴 Blockers I need to flag immediately

**I don't have access to `product/constraints.md`.**
I can see the instruction to read it, but I can't access your file system. This matters significantly because a regulated financial services firm has constraints that would fundamentally change the design:

- Data residency requirements (where notes can be stored)
- Retention and deletion policies (FINRA, SEC, FCA obligations)
- Audit trail requirements
- Approved vendor lists / cloud restrictions
- Classification policies (what counts as a "record")

**I'll proceed with reasonable assumptions for the sector, but please correct me.**

---

## What I'm hearing vs. what I need to understand

### The stated need
> "Capture meeting notes and decisions in one place"

### Questions this immediately raises

**Who is "our teams"?**
- All 500+ employees, or specific functions (compliance, trading, advisory)?
- This changes access control design dramatically
- Trading floor notes may be regulated differently than ops notes

**What does "decisions" mean here?**
- Informal team decisions?
- Audit-relevant decisions (investment decisions, compliance sign-offs)?
- If the latter, this isn't a notes app — it's a **records management system**, which is a different product category entirely

**What's the actual pain right now?**
- Notes scattered across email, Teams, personal docs?
- No searchability?
- People disagreeing later about what was decided?
- Compliance asking for meeting records you can't produce?

The solution changes completely depending on which of those is the real driver.

---

## Assumptions I'm making (flag any that are wrong)

| Assumption | Confidence | Risk if wrong |
|---|---|---|
| Notes must be retained per regulatory schedule | High | Build wrong data layer entirely |
| Some notes may constitute records under FINRA/SEC | High | Legal/compliance exposure |
| SSO/Active Directory integration required | High | Won't pass IT security review |
| Cannot use consumer-grade storage (personal Google Drive, Notion free tier) | High | Data governance violation |
| Mobile access is needed | Medium | Over/under-engineer the interface |
| Real-time collaboration is expected | Medium | Architecture decision |
| You want to **build** this, not buy/configure an existing tool | Low | This assumption most likely to be wrong |

---

## The question I'd push hardest on

### Why build vs. buy?

Microsoft Teams + OneNote, Confluence, or Notion Enterprise are already used at firms like yours. Before scoping a build:

- What have you tried and why did it fail?
- Is the constraint tooling, or adoption?
- Do you have an existing Microsoft/Google/Atlassian license that covers this?

**Building a note-taking app in financial services is a significant compliance liability undertaking.** The notes themselves may become discoverable records. If you build the container, you own the retention, audit, and e-discovery obligations.

---

## If we proceed: what discovery should happen next

Here's the structured work needed before any solution design:

```
1. COMPLIANCE REVIEW (Week 1)
   □ Which note categories are regulated records?
   □ What retention schedules apply?
   □ Is e-discovery/litigation hold required?
   □ Who is the compliance approver for this system?

2. USER RESEARCH (Week 1-2)
   □ 5-8 interviews across target teams
   □ Shadow 2-3 actual meetings
   □ Map current state: where do notes actually live?
   □ What happens to notes after meetings today?

3. TECHNICAL CONSTRAINTS (Week 1)
   □ Review constraints.md (you'll need to share this with me)
   □ Approved cloud providers
   □ Authentication requirements
   □ Integration requirements (existing calendar, comms tools)

4. DECISION: Build vs. Buy vs. Configure
   □ This should be an explicit decision with sign-off
   □ Not assumed
```

---

## What I'd recommend right now

**Don't scope features yet.** The risk of building the wrong thing — or building something that creates compliance exposure — is too high.

**Do these three things first:**

1. Share `product/constraints.md` with me (paste the contents here)
2. Answer: has compliance reviewed this initiative?
3. Answer: what's the one specific failure happening today that triggered this request?

---

*What can you share with me so we can move forward on solid ground?*
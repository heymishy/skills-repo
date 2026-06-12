# /discovery Pipeline

Let me work through this properly before jumping to solutions.

---

## What I Need to Clarify First

Before designing anything, I have real concerns about the framing of this request.

---

## 🔴 The Problem Statement Needs Scrutiny

**"We should build" is doing a lot of work here.**

### Questions I'd ask before writing a line of spec:

**1. Why build instead of buy?**
Notion, Confluence, Microsoft OneNote, and a dozen enterprise tools already do this. In regulated financial services, **building custom software creates compliance burden, not just capability.** What's the gap those tools don't fill?

**2. Who is "our teams"?**
- Front office (traders, advisors)? → Record-keeping regulations apply (MiFID II, SEC 17a-4, FINRA)
- Back office/ops? → Different risk profile entirely
- Both? → Very different requirements

**3. What does "one place" mean you're currently missing?**
This sounds like a coordination problem, not a software problem. Have you investigated whether the real issue is meeting culture, decision accountability, or tool fragmentation?

---

## ⚠️ Regulatory Flags I'm Raising Now

*(Reading this as a 500+ person regulated financial services firm)*

Meeting notes and decisions at a financial services firm are **potentially subject to:**

- **Retention requirements** (often 3–7 years depending on content)
- **Litigation hold obligations**
- **Audit trail requirements** — who wrote what, when, whether it was edited
- **Supervision requirements** — certain communications must be reviewable
- **Data residency rules** — where notes are stored may be regulated

**Building a custom app without deeply involving Compliance and Legal from day one would be a serious mistake.** This isn't a feature — it's a records management system in disguise.

---

## What I'd Actually Recommend Right Now

### Step 1: Structured Discovery (Before Any Build Decision)

| Question | Why It Matters |
|---|---|
| What tools do teams use today? | Understand actual behavior, not stated behavior |
| What specifically fails about current tools? | Defines the real gap |
| What types of content go in these notes? | Determines regulatory classification |
| Who needs to access/search/audit them? | Shapes architecture entirely |
| What's the retention requirement? | Non-negotiable constraint, not a feature |
| Has Compliance reviewed this initiative? | Must happen before scope, not after |

### Step 2: Strong Prior Toward Existing Tools

A custom build makes sense only if:
- ✅ Existing tools have a **documented, specific gap** you've validated
- ✅ Compliance has signed off on the build approach
- ✅ IT Security has approved the data handling model
- ✅ You have ongoing engineering capacity to **maintain** it (not just build it)

### Step 3: If You Do Build

Only then do we talk about:
- Immutable audit logs
- Role-based access
- Retention enforcement
- Integration with your existing SSO/identity stack
- Export for legal hold

---

## My Honest Assessment

**This request has the shape of a solution looking for a problem.**

The actual problems worth solving are probably:
1. "Decisions get lost after meetings" → That's a process problem
2. "Notes are scattered across tools" → That's an adoption/governance problem
3. "We can't find past decisions" → That's a search/tagging problem

Each of those has different solutions, and only some of them involve building software.

---

## To Move Forward, I Need:

1. **What specific failure prompted this request?** A real incident or pain point
2. **Has Compliance been consulted?**
3. **What tools exist today and why are they insufficient?**
4. **Who is the actual sponsor and what outcome are they accountable for?**

Without these, any spec I write would be **fiction dressed as requirements.**

---

*Want me to run a stakeholder interview framework to surface these answers, or draft the Compliance consultation checklist first?*

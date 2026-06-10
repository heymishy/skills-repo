# /discovery Pipeline

Let me work through this properly before jumping to solutions.

---

## What I'm doing first

I need to flag something important: **you've given me a solution, not a problem.**

*"Build a note-taking app"* is already a proposed answer. Discovery means questioning whether that's the right answer — or the right scope.

---

## The problem statement I'm hearing

> Teams can't effectively capture meeting notes and decisions in one place.

Let me stress-test that.

---

## Critical questions before any scoping

### On the actual problem
- **What's breaking today?** Notes scattered across email/Slack/personal docs? Decisions not recorded? People disagreeing later about what was decided?
- **What does "one place" mean?** One tool? One format? One owner?
- **Who feels this pain most acutely** — the people *in* meetings, or the people who weren't there and need to act on decisions?

### On the regulated environment
I can't read `product/constraints.md` — it doesn't exist in our conversation. But in financial services, this matters enormously:

- Are meeting notes considered **records** under your compliance obligations? (MiFID II, FINRA, SEC 17a-4, etc.)
- Do certain meetings require **immutable audit trails**?
- Who has **data residency / sovereignty** requirements?
- Is there an **approved vendor list** this must come from?

These constraints could invalidate a custom-built app entirely.

### On why build vs. buy
- What's wrong with **Confluence, Notion, SharePoint, or Teams meeting notes** — which you almost certainly already have?
- Has anyone actually tried consolidating into an existing tool and failed? Why?
- Is the real problem the tool, or **the behavior/process** around note-taking?

---

## My honest hypothesis

In a 500+ person regulated firm, the note-taking problem is usually one of these:

| Root Cause | Wrong Solution | Right Solution |
|---|---|---|
| No shared process | New app | Template + process rollout |
| Tool sprawl | Another tool | Consolidation + governance |
| Compliance gap | Custom app | Records management policy |
| Search/retrieval | New app | Better taxonomy in existing tools |
| Accountability gap | Any tool | Decision log with owners |

**Building a new app is likely the most expensive and risky option** for any of these.

---

## What I'd recommend before any build decision

### Week 1 — Structured discovery
1. **5-7 interviews** across roles: meeting organizer, decision-maker, action-item owner, compliance, IT
2. **Shadow 2-3 actual meetings** — observe what happens to notes *after*
3. **Audit existing tools** — what's already licensed and underused?

### Output
A **problem statement with evidence**, not a solution assumption.

---

## What I need from you to go further

1. What specific failures prompted this request — can you give me **2-3 concrete examples**?
2. What tools do teams use today, and what's the objection to them?
3. Is there a compliance/records requirement driving this, or is this purely operational?
4. Who is the **actual sponsor** — is this coming from a team in pain, or someone with a solution looking for a problem?

---

The pipeline doesn't start with architecture. It starts here.
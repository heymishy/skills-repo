# Discovery Pipeline: Note-Taking App

I appreciate you bringing this to discovery. Before we validate this as the right solution, I need to understand the actual problem and your constraints better.

## Critical Questions First

**1. What's the underlying pain point?**
- Are notes currently scattered across email, Slack, OneNote, Google Docs?
- What specific decision or outcome is being missed or delayed?
- How often does this cause actual business friction?

**2. Compliance & Security (since you're regulated financial services)**
- Do meeting notes contain sensitive client data, trading information, or regulatory correspondence?
- What data residency requirements apply? (I need to reference `product/constraints.md`)
- Would notes need audit trails, access controls, retention policies?
- Do you need SOX/MiFID II/similar compliance built-in?

**3. Scope clarification**
- Is this for internal team notes, client-facing, or both?
- What's the current meeting note process? (Who captures, how long until accessible, who needs access?)
- Do decisions need to be actionable/tracked (i.e., linked to tasks)?

## What I'm Concerned About

**Build vs. Buy:** Slack (with threading), Microsoft Teams, Notion, or Confluence all handle note-taking. What wouldn't those solve?

**Complexity underestimate:** "One place" for regulated firms often means:
- Role-based access (who can see which notes?)
- Retention/deletion policies (can notes be deleted? archived?)
- Search/discovery for regulatory requests
- Integration with your existing records management

These add 60-70% to scope.

## Next Steps

Can you share:
1. **`product/constraints.md`** (so I understand your platform architecture, compliance baseline, etc.)
2. A specific meeting/decision that went wrong due to note fragmentation
3. How many people would use this weekly?

Then we can determine if this is a *problem worth solving* or if we're solving the symptom.

What's your highest-confidence pain point right now?
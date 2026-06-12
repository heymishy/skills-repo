# /discovery pipeline

Let me work through this properly before jumping to solutions.

---

## What I'm noticing immediately

"Build a note-taking app" is a **solution statement**, not a problem statement. Before scoping anything, I need to surface assumptions that could make this expensive or unnecessary.

---

## Clarifying questions I'd ask your team

**On the actual problem:**
- What's breaking down today? Are decisions getting lost, disputed after the fact, never documented, or documented somewhere nobody finds?
- What does "one place" mean — one place to *write*, or one place to *find later*? Those have very different designs.
- How are teams capturing notes *right now*? (The answer will tell you what you're actually competing with.)

**On the regulated context specifically:**
- Do meeting notes constitute records under your retention/compliance obligations? If so, this isn't a productivity tool — it's a **records management system**, with audit trails, access controls, and legal hold requirements.
- Who owns a note? The author, the team, the firm?
- What happens when someone leaves?

**On "decisions in one place":**
- Decisions made by whom? Individual contributors, managers, committees with approval authority?
- Does a "decision" need to be distinguished from a note, or are you conflating two different artifacts?

---

## Hypothesis I'd put to the team

> *The real problem is probably not that notes don't exist — it's that they live in email threads, personal Drives, and Confluence pages nobody maintains, so institutional knowledge is effectively private and unretrieval.*

If that's right, **you may not need to build anything.** You need an adoption and information architecture intervention.

---

## Before reading `product/constraints.md` — flags I'd expect to find there

| Constraint | Why it matters here |
|---|---|
| Data residency requirements | Eliminates most SaaS note tools outright |
| SSO/identity requirements | Affects auth design significantly |
| Approved vendor list | May already have a solution you're not using well |
| Audit logging obligations | Adds backend complexity most note apps skip |
| Accessibility standards | Often underscoped in internal tools |

---

## The fork in the road

Depending on your answers, this goes one of three directions:

**Path A — Buy/configure**
You already pay for Microsoft 365 or Google Workspace. OneNote, Teams, or Notion (if approved) likely covers 80% of this with zero build cost. The problem is adoption, not tooling.

**Path B — Thin integration layer**
Build a lightweight structured template + search layer on top of existing approved tools. Low risk, fast.

**Path C — Build a purpose-built app**
Only justified if compliance requirements disqualify SaaS options *and* your existing stack genuinely can't be configured to meet needs. This path is 6–18 months and significantly more expensive than people expect.

---

## What I'd want from you before the next conversation

1. **Three specific examples** of decisions or notes that got lost or caused problems in the last 90 days
2. **A list of tools** teams are currently using, even informally
3. **A call with your compliance/legal team** — 30 minutes, because this shapes everything
4. **Confirmation of whether this is a pilot** (one team) or firm-wide from day one

---

I'm intentionally not starting a spec yet. Starting a spec now would be building confidence in the wrong direction. What can you tell me about those four items?

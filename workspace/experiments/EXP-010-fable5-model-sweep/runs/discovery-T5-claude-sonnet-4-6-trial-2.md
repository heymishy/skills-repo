# /discovery pipeline

Let me work through this properly before jumping to solutions.

---

## What I'm doing first

I need to flag something important: **I don't actually have access to `product/constraints.md`** or any files in your environment. I can see that reference but can't read it. You'll want to paste the relevant constraints directly, or I'll be working with assumptions that could waste your time.

That said, let me run the discovery with what I know, and **flag every assumption that needs validation against those constraints.**

---

## The stated problem

> "Teams can capture meeting notes and decisions in one place."

This is a **solution statement**, not a problem statement. Let me push underneath it.

---

## Discovery questions I'd ask before writing a single spec

### 1. What's actually breaking today?

| Question | Why it matters |
|---|---|
| How are teams capturing notes *right now*? | If it's email threads + Word docs, the real problem may be findability, not capture |
| Where do decisions actually live today? | They may be getting captured but not actioned or attributed |
| What triggers "we need to fix this"? | A compliance audit? A specific incident? Executive frustration? |

### 2. Who are "the teams"?

- Front office (advisors, traders)? → **Heavy regulatory scrutiny on communications**
- Operations? Compliance? Tech?
- All of the above?

In a regulated financial firm, "meeting notes" may be **legally discoverable records.** A note-taking app is potentially a compliance system, not a productivity tool. That changes *everything* about architecture, vendors, and build/buy decisions.

### 3. What does "one place" actually mean?

- One place to *write*?
- One place to *find later*?
- One place auditors can *pull from*?
- These have very different solutions.

### 4. What does "decisions" mean specifically?

- Action items with owners?
- Formal approval records?
- Version-controlled policy changes?
- Risk committee outcomes?

---

## Assumptions I'm making right now (each needs validation)

```
⚠️  ASSUMPTION: "Meeting notes" includes text, possibly attachments
⚠️  ASSUMPTION: This is internal-only, not client-facing
⚠️  ASSUMPTION: You have some existing SSO/identity infrastructure
⚠️  ASSUMPTION: Retention/audit requirements exist but aren't yet specified
⚠️  ASSUMPTION: "Build" is actually on the table vs. buying Confluence, Notion, etc.
```

---

## The question I'd push hardest on

### Why build this vs. buy it?

Your firm likely already has:
- **Microsoft 365** → OneNote, Teams meeting notes, Loop
- **Confluence / SharePoint** → Already licensed
- **Zoom/Teams** → Native transcript + notes features

**Before scoping a build, I'd want to know:**

> What have you tried, and why did it fail or get rejected?

The answer tells you whether the real problem is **tooling** or **behavior/adoption** or **compliance requirements that commercial tools can't meet.**

---

## If we do proceed with discovery

Here's the pipeline I'd run:

```
Phase 1: Problem validation (1–2 weeks)
├── 5–8 user interviews across different team types
├── Shadow 2–3 actual meetings
├── Audit where decisions currently live (email? Slack? nowhere?)
└── Map compliance obligations with Legal/Risk

Phase 2: Constraint mapping
├── Data residency requirements
├── Retention schedule (7 years? longer?)
├── Integration requirements (existing systems of record)
└── Access control model (who can see what?)

Phase 3: Solution framing
├── Build vs. buy analysis with real TCO
├── If build: MVP scope with clear success metrics
└── If buy: requirements doc for vendor evaluation
```

---

## What I need from you to go deeper

1. **Paste `product/constraints.md`** (or the relevant sections)
2. **Answer:** What's the specific pain that made this land on your roadmap *now*?
3. **Answer:** Has any existing tool been tried and rejected? Why?
4. **Confirm:** Is compliance/audit trail a requirement, or is this purely operational productivity?

---

The worst outcome here would be spec'ing a build for something that's actually a change management problem, or that violates constraints baked into your platform context. Let's get those answers first.
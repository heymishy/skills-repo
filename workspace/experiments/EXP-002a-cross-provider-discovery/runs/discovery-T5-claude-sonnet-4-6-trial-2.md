# Discovery Pipeline: Note-Taking App for Meeting Notes & Decisions

## Before I build anything, let me do this properly.

I've read the prompt, but I don't have access to `product/constraints.md` — so I'll flag that explicitly rather than assume. **Any recommendations I make may need revision once I've seen that file.** I'll mark assumption-sensitive points clearly.

---

## Step 1: Problem Framing

Let me challenge the framing before jumping to solutions.

### What I heard:
> "Build a note-taking app so teams can capture meeting notes and decisions"

### What I need to question:

| Question | Why It Matters |
|---|---|
| What's broken today? | Teams may already have tools — the problem may be adoption, not tooling |
| What does "decisions" mean specifically? | Action items? Audit trail? Approvals? In financial services, this could be compliance-critical |
| Who owns a decision record? | Individual? Team? Compliance function? |
| What happens *after* notes are taken? | If notes go nowhere, the app won't solve the real problem |
| Is this actually a note-taking problem? | Could be a meeting culture problem, a search/retrieval problem, or a compliance documentation problem |

---

## Step 2: Regulated Financial Services Context

⚠️ **This matters enormously.** Without `constraints.md`, I'm working from sector knowledge. Flagging assumptions:

### Likely Constraints I'm Assuming:
```
ASSUMPTION LOG
──────────────
[A1] Data residency requirements — likely UK/EU or US jurisdiction-specific
[A2] Audit trail requirements — FCA, SEC, or equivalent may require immutable records
[A3] Information barriers — some teams cannot share notes across business lines
[A4] Data classification — meeting content may be Inside Information, confidential, or client-sensitive
[A5] Existing approved toolset — procurement/InfoSec may have an approved vendor list
[A6] Retention policy — regulatory retention periods likely apply (e.g., 7 years MiFID II)
```

**These aren't edge cases — they're potentially the core design constraints.**

---

## Step 3: Discovery Questions (Structured)

Rather than a flat list, here's what I'd actually need answered before writing a single spec:

### 🔴 Blocking Questions (Can't proceed without these)

1. **What do teams do today?** Walk me through what happens in a typical meeting — before, during, after.

2. **What's the specific failure mode?** Notes lost? Never written? Written but not actioned? Decisions contested later?

3. **Has a tool been tried before?** If yes — what happened?

4. **What's the compliance/legal requirement here?** Is this an internal productivity tool or does it need to satisfy a regulatory obligation?

5. **What does IT/InfoSec allow?** (⚠️ Assumption A5 — if there's an approved vendor list, we may be solving a config/adoption problem, not a build problem)

### 🟡 Important But Non-Blocking

6. Who are the distinct user types? (e.g., meeting organiser vs. participant vs. compliance reviewer vs. exec)

7. What does "decisions" mean precisely? Informal consensus? Formally approved? With signatories?

8. How are meetings currently scheduled? (Calendar integration scope)

9. What search/retrieval needs exist? ("Find all decisions about X client from last quarter")

10. What integrates downstream? (Ticketing? CRM? Board packs?)

### 🟢 Useful to Know Eventually

11. Volume expectations (meetings/day, users, note length)
12. Mobile vs. desktop split
13. Async meeting patterns (recordings, transcripts)?

---

## Step 4: Hypothesis Tree

Instead of one solution, here's what this *might actually be*:

```
Root Problem: "Meeting notes and decisions aren't captured well"
│
├── Hypothesis A: TOOLING GAP
│   We genuinely lack a fit-for-purpose tool
│   → Build or procure
│
├── Hypothesis B: ADOPTION GAP  
│   Tool exists, people don't use it consistently
│   → Process/culture intervention, not product
│
├── Hypothesis C: RETRIEVAL GAP
│   Notes are taken, but can't be found or acted on
│   → Search/integration problem, not capture problem
│
├── Hypothesis D: ACCOUNTABILITY GAP
│   Decisions are recorded, but ownership and follow-through break down
│   → Task/accountability system, not notes
│
└── Hypothesis E: COMPLIANCE GAP
    Specific regulatory obligation isn't being met
    → Compliance workflow, not general note-taking
```

**Each hypothesis leads to a different solution.** Building a note-taking app assumes Hypothesis A. We should validate which one (or which combination) is actually true.

---

## Step 5: What I'd Recommend Right Now

### Do immediately:
- [ ] Share `product/constraints.md` so I can ground this in your actual platform context
- [ ] Run **5 structured interviews** with actual meeting participants across 2-3 different team types
- [ ] Pull any existing compliance/legal requirements from your records management policy
- [ ] Check approved vendor list — Confluence, Notion, Microsoft Loop, etc. may already be available

### Do before any build decision:
- [ ] Map the full note lifecycle (creation → sharing → action → retention → deletion)
- [ ] Identify if information barriers apply between any teams who'd use this
- [ ] Define what "decision" means in a way legal/compliance will sign off on

### Don't do yet:
- ❌ Write user stories or wireframes
- ❌ Pick a tech stack
- ❌ Assume this needs to be custom-built

---

## Step 6: If Discovery Confirms We Should Build

Only then would I move to defining:

```
Core Feature Set (provisional, pending discovery)
─────────────────────────────────────────────────
MUST HAVE
  · Structured decision capture (not just free-text notes)
  · Immutable audit log (likely required, see A2)
  · Role-based access with information barrier support (see A3)
  · Retention policy enforcement (see A6)
  · Search across decisions/notes

MUST VALIDATE
  · Calendar/meeting system integration
  · Action item tracking with owners
  · Approval/sign-off workflow

PROBABLY NOT IN V1
  · AI transcription (data classification risk)
  · Public sharing
  · Mobile-first (validate actual usage context first)
```

---

## Summary

**I won't write a spec yet — and that's the right call.**

The request is well-intentioned but currently under-defined in ways that matter *especially* in a regulated context. The wrong product built confidently is worse than a slower, better-scoped one.

**The next concrete action is yours:**
1. Share `constraints.md`
2. Tell me which of the 5 blocking questions you can answer now

Once I have those, I can move fast.
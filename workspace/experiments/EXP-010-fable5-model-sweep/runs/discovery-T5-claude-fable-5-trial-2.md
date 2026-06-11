# Discovery Pipeline — Intake Review

**Request received:** "Build a note-taking app so teams can capture meeting notes and decisions in one place."

⚠️ **Note:** I attempted to read `product/constraints.md` but don't have its contents available in this session. Please paste it or confirm the key constraints — I've flagged below where it matters. I'll proceed using standard regulated-finserv assumptions and mark them clearly.

---

## 1. Reframe: This is a solution, not a problem

The request as stated jumps to a solution ("a note-taking app"). Discovery starts by extracting the underlying problem. My working hypothesis of what you're actually experiencing:

> **Problem hypothesis:** Meeting outcomes and decisions are scattered across tools (email, chat, personal docs), making them hard to find, impossible to audit, and causing decisions to be re-litigated or lost.

**Validate or correct this before we go further.** If the real pain is "decisions are lost," the answer may be a decision log, not a note-taking app. If it's "notes are scattered," the answer may be governance over existing tools, not new software.

## 2. Discovery questions

**Problem evidence**
- What incident or pattern triggered this request? (A lost decision? An audit finding? Executive frustration?)
- Who is affected, and how often? Which teams, what meeting types?
- What's the cost of the status quo — measured in rework, compliance exposure, or time?

**Current state**
- What do teams use today? (Assumption: a 500+ person finserv firm already licenses M365 or Google Workspace — meaning OneNote, Loop, Teams meeting notes, or Docs already exist.)
- Why are those tools failing? Capability gap, adoption gap, or governance gap? These have very different fixes.

**Regulated-environment constraints** *(this is where `constraints.md` is critical)*
- **Records retention:** Are meeting notes/decisions subject to retention schedules (e.g., SEC 17a-4, FINRA, or equivalent)? Notes that document decisions often qualify as business records.
- **eDiscovery & legal hold:** Must content be searchable and holdable by Legal?
- **Data residency / classification:** Can notes contain client data, MNPI, or PII? What controls follow?
- **Approved vendor / build policy:** Does your firm permit new internally-built apps holding business records, or does everything route through approved enterprise platforms?

## 3. Build vs. buy — early flag

In a regulated 500+ person firm, **building a custom note-taking app is rarely the right call**:

| Factor | Build | Buy/configure existing |
|---|---|---|
| Retention, audit, eDiscovery | You must build & certify all of it | Inherited from M365/Confluence/etc. |
| Security review & ongoing maintenance | Permanent internal cost | Vendor's problem |
| Time to value | Months–quarters | Weeks (governance + templates) |

The likely fastest path: **a decision-record convention + templates on an already-approved platform**, plus an adoption push — not new software.

## 4. Proposed next steps

1. Share `constraints.md` contents so I can validate the compliance assumptions above.
2. Answer the problem-evidence questions (even rough answers).
3. I'll then produce: a validated problem statement, success metrics, and 2–3 solution options (governance-only, configure-existing, build) with a recommendation.

**What's the strongest evidence you have that this problem exists, and what does your firm already license?**
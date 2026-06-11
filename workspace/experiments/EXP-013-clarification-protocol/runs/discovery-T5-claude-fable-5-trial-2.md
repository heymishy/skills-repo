# /discovery — Intake & Problem Framing

**Request received:** "Build a note-taking app so teams can capture meeting notes and decisions in one place."

⚠️ **Before we go further:** I don't have access to `product/constraints.md` — I can't read files unless their contents are shared in the conversation. Please paste it in, since platform constraints in a regulated environment will materially change the recommendation. In the meantime, here's the discovery pass on what you've given me.

---

## 1. Reframe: this is a solution, not a problem

"Build a note-taking app" is a proposed solution. The discovery pipeline needs the problem underneath it. My working hypothesis of what you might actually be experiencing:

> *Decisions made in meetings are getting lost, are hard to find later, or can't be reliably attributed — creating rework, disputes, and possibly compliance exposure.*

Confirm or correct that before we proceed, because "note-taking" and "decision capture" are different problems with different solutions.

## 2. Key discovery questions

**Problem evidence**
- What incident or pattern triggered this request? (A lost decision? An audit finding? Exec frustration?)
- How are teams capturing notes *today* — OneNote, Word docs, email, Teams chat, paper? Where does that break down: capture, retrieval, or trust?
- How often does "we can't find that decision" actually cost time or money? Can we quantify it?

**Users & scope**
- Who is "our teams" — all 500+ employees, or specific functions (e.g., front office, risk committees)?
- Is this about *all* meeting notes, or specifically *decision records* (which in finserv may be formal records subject to governance)?

**Success criteria**
- What would be measurably different in 6 months if this works?

## 3. Regulated-environment red flags (validate against constraints.md)

These will likely dominate the build-vs-buy decision:

- **Records retention & supervision:** Meeting notes capturing business decisions may be regulated records (e.g., SEC 17a-4 / FINRA-style retention, immutability, supervision). A homegrown app inherits all of that burden.
- **eDiscovery & legal hold:** Anything storing decisions must support legal hold and export. This is expensive to build correctly.
- **Information barriers / access control:** Notes from deal teams, risk committees, etc. may require Chinese-wall controls.
- **Existing licensed tooling:** Most firms your size already own OneNote/SharePoint, Confluence, or similar — already vetted by InfoSec and integrated with retention policies. Building a new app risks creating an *unmanaged* records repository, which is worse than the status quo.

## 4. Likely opportunity space (pending validation)

| Hypothesis | If true, the answer is probably... |
|---|---|
| Tools exist but adoption/process is the gap | A decision-log template + workflow on existing tools, not a new app |
| Retrieval is the pain (notes exist, can't find them) | Search/tagging/structure over existing repositories |
| Decisions specifically lack accountability | A lightweight **decision register** with owners and timestamps |
| Genuine tooling gap confirmed by IT/Compliance | Buy-vs-build evaluation, with build as last resort |

## 5. Next steps

1. **You:** Paste `product/constraints.md` contents.
2. **You:** Answer the discovery questions above (especially the triggering incident and current tooling).
3. **Then:** I'll produce the problem statement, opportunity assessment, and a recommendation on whether this proceeds to solution discovery — and in what form.

What prompted this request — was there a specific incident?
# Discovery Pipeline — Intake Review

**Status: ⚠️ Blocked on context + framing issues**

First, a logistics note: I don't have access to `product/constraints.md` — no file has been shared in this session. Please paste its contents (or the relevant sections) so I can validate against your platform constraints. I'll flag below where it likely matters.

---

## 1. Framing Check: You've brought me a solution, not a problem

> "We should build a note-taking app so our teams can capture meeting notes and decisions in one place."

This statement bundles three unvalidated claims:

| Embedded assumption | What we actually need to verify |
|---|---|
| Notes/decisions are currently scattered | Where do they live today? Email, Teams, OneNote, Confluence, SharePoint, people's heads? |
| Scattering is the *problem* | Or is the problem that decisions aren't **findable**, **trusted**, or **acted on**? Those have very different solutions. |
| Building an app is the answer | A 500+ person regulated firm almost certainly has M365 or Google Workspace. "Build" needs to beat "configure what we own." |

## 2. Regulated-environment red flags (where constraints.md matters)

Before any build/buy decision, these will dominate the solution space in financial services:

- **Records retention & supervision** — Meeting notes capturing decisions may be regulated records (e.g., SEC 17a-4, FINRA, MiFID II depending on jurisdiction). A homegrown app without WORM storage, legal hold, and supervision hooks is a compliance liability, not a productivity win.
- **eDiscovery** — Legal will need to search and export this content. Does your existing eDiscovery tooling cover a custom app? (Almost certainly not without significant work.)
- **Data classification & DLP** — Notes will contain MNPI, client data, PII. Your DLP and classification policies need to apply.
- **Audit trail** — "Who decided what, when, and who changed the record" is the actual value in a decision log — and the hardest part to build correctly.

## 3. Discovery questions to answer before scoping anything

**Problem evidence:**
1. What incident or pain triggered this request? (A lost decision? An audit finding? Exec frustration?)
2. How often does "we can't find the decision" actually happen, and what does it cost?
3. Who are the users — all teams, or specific functions (deal teams, risk committees, ops)?

**Current state:**
4. What's in your stack today (OneNote, Loop, Confluence, SharePoint, Notion)? Why is it failing — capability gap, or adoption/process gap?
5. Is there a meeting-minutes policy already? Who owns it?

**Solution space:**
6. Has anyone evaluated *decision log / governance* tooling vs. generic note-taking? "Capture decisions" suggests you may want a lightweight decision register, not another notes app.

## 4. Recommended next steps

1. **Share `constraints.md`** — I'll map it against the compliance items above.
2. **5–8 user interviews** across 2–3 teams: "Walk me through the last time you needed to find a past decision."
3. **Inventory existing tools + compliance posture** with IT/Compliance before any build conversation.
4. **Reframe the opportunity statement** — draft: *"Teams in [function] can't reliably locate decisions made in meetings, causing [rework/risk/audit exposure]"* — then validate it.

Want me to generate the interview guide, or shall we start with the constraints file?
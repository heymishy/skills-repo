# /discovery — Intake & Problem Framing

**⚠️ Before we proceed:** I don't have access to `product/constraints.md` — no file was shared in this conversation and I can't read your repo directly. Please paste its contents so I can validate the discovery output against your actual platform constraints. Below, I'll flag every place where that file likely changes the answer.

---

## 1. Reframing: You've given me a solution, not a problem

> "We should build a note-taking app so our teams can capture meeting notes and decisions in one place."

**Candidate problem statement (needs validation):**
> *Teams in our organization lose track of decisions and meeting context because notes are scattered across [unknown tools], leading to [unknown cost: rework? compliance exposure? slow onboarding?].*

The bracketed gaps are what discovery must fill before anyone writes code.

## 2. Red flags specific to your context (regulated FS, 500+ employees)

| Risk | Why it matters |
|---|---|
| **Build vs. buy is probably a buy** | Notes capture is heavily commoditized (OneNote, Confluence, Notion, Loop). A 500-person firm building its own is justified only by a constraint that *forbids* SaaS — which `constraints.md` may or may not contain. |
| **Records & retention** | Meeting notes containing decisions are likely *business records*. Depending on jurisdiction: SEC 17a-4 / FINRA 4511 / MiFID II–style retention, immutability (WORM), and legal hold requirements. A casual notes app can create regulatory liability. |
| **eDiscovery & supervision** | Compliance will need search, export, and possibly surveillance over this content. Most homegrown tools fail here. |
| **Information barriers** | If you have research/trading/advisory functions, "everything in one place" can violate Chinese-wall requirements. "One place" may be the *wrong* requirement. |
| **Shadow-IT signal** | This request often means teams are already using unsanctioned tools (personal Notion, Apple Notes). The real problem may be *governance of an existing behavior*, not a missing tool. |

## 3. Discovery questions (in priority order)

**Problem validation**
1. What happens today when a decision needs to be retrieved 6 months later? Walk me through the last time it failed.
2. Who is asking for this — end users, IT, or compliance? Each implies a different problem.
3. What tools are already licensed? (M365 firms already own OneNote/Loop/SharePoint — why aren't those working?)

**Constraints (cross-check against `constraints.md` when shared)**
4. Cloud SaaS permitted, or on-prem/private-cloud only?
5. Retention/immutability requirements for decision records?
6. Data classification — will notes contain MNPI, client PII, trade details?
7. SSO/IAM stack, DLP integration, audit logging requirements?

**Scope discipline**
8. Is the core need *capture* (writing notes) or *retrieval* (finding decisions)? These are different products. A "decision log" is far smaller and more defensible than a general notes app.

## 4. Recommended next step

Do **not** advance this to solution design yet. The pipeline output at this stage:

1. **Share `constraints.md` contents** — it likely determines build-vs-buy on its own.
2. **5 user interviews** (2 ICs, 1 team lead, 1 compliance, 1 IT) against questions 1–3.
3. **Inventory existing licensed tools** and why they're failing.
4. **Reconvene** with a validated problem statement; only then evaluate solutions (which may be "configure what you own" rather than "build").

Paste the constraints file and any interview notes you have, and I'll run the next stage of the pipeline against them.
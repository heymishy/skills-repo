# /discovery — Intake Review

**Heads up first:** I don't have access to a `product/constraints.md` file in this conversation — nothing was attached or shared. I'll proceed with the discovery pass, but flag where that file's contents would change the analysis. If you paste it in, I'll revise.

---

## 1. What you've given me is a solution, not a problem

"Build a note-taking app" skips the discovery step entirely. Before this enters a pipeline, we need to separate:

- **Stated solution:** A custom note-taking app.
- **Implied problem:** Meeting notes and decisions are scattered / hard to find / inconsistently captured.
- **Unvalidated assumptions:** That the problem is *capture* (vs. retrieval, adoption, or accountability), that existing tools can't do this, and that *building* is the right sourcing model.

## 2. The elephant in the room: you're a regulated financial services firm

For a 500+ person firm in this sector, a homegrown notes app is unusually high-risk:

- **Records retention & supervision.** Meeting notes and decision records likely qualify as business records (think SEC 17a-4 / FINRA 3110 / MiFID II-style obligations depending on jurisdiction). A custom app needs immutable retention, legal hold, and eDiscovery export from day one — that's most of the build cost.
- **You almost certainly already own a compliant option.** M365 (OneNote/Loop/SharePoint), Confluence DC/Cloud with compliance add-ons — your compliance team has likely already vetted one. Discovery question #1 is *why aren't teams using it?*
- **Shadow-IT risk inversion.** If a custom app launches without full compliance tooling, you've created a new unsupervised records channel — a regulatory liability, not a productivity win.

## 3. Discovery questions before this proceeds

**Problem validation**
1. What's failing today? Notes not taken at all, taken but lost, or taken but decisions still get relitigated?
2. Who feels the pain — ICs, managers, compliance, audit? Whose problem are we actually solving?
3. What's the cost of the status quo (rework, audit findings, decision churn)? Quantify if possible.

**Existing landscape**
4. What tools do teams use now, sanctioned and unsanctioned? (The unsanctioned list is the real requirements doc.)
5. Has IT/compliance already approved a knowledge tool that's underadopted? If so, this may be a change-management problem, not a software gap.

**Constraints** *(this is where constraints.md matters)*
6. Data residency, retention periods, encryption, SSO/identity, approved cloud providers?
7. Is "build" even permitted, or does procurement policy favor vetted vendors?

## 4. Recommended next steps

1. **Share `constraints.md`** so I can check the solution space against actual platform/compliance limits.
2. **Run 5–8 user interviews** across teams focused on "tell me about the last decision that got lost" — not on app features.
3. **Audit current tooling** with IT: what's licensed, what's adopted, what's blocked.
4. **Default hypothesis to test:** *This is a buy/configure + adoption problem, not a build problem.* Treat "build" as the fallback only if compliant configuration of existing tools demonstrably fails.

**Pipeline status: ⏸ Held at discovery.** Not advancing to solution definition until the problem statement is validated and constraints are loaded.

Want me to draft the interview script, or do you want to paste in the constraints file first?

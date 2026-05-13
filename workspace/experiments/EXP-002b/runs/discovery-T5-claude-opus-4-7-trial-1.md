Before I start the structured questions — a framing note based on your context.

**Regulatory context surfacing (required before MVP scoping):**

You're in a regulated financial services firm. A note-taking app capturing meeting notes and decisions is not a neutral domain — meeting content in FSI typically intersects with several regulatory regimes:

- **Record-keeping obligations** (e.g. SEC 17a-4, FCA SYSC 9, MiFID II Art. 16 if investment-services-adjacent) — meeting decisions about clients, trades, or supervisory matters may be records the firm is required to retain in tamper-evident form for defined periods
- **MNPI / market abuse** (MAR, insider lists) — notes from deal teams, treasury, or any price-sensitive discussion need access controls and surveillance hooks
- **Customer data / privacy** (GDPR, CCPA, local equivalents) — any meeting referencing identifiable customers triggers data residency, retention, and subject-access obligations
- **Supervisory communications** (FINRA 3110, prudential supervisor expectations) — decisions made in committees (credit, risk, ALCO) often have specific minute-keeping standards

Which of these apply depends on what kinds of meetings this app is meant to cover. So before we go further:

---

**Question 1 (problem statement, narrowed):**

You said "so our teams can capture meeting notes and decisions in one place" — that describes a solution, not the problem driving it.

**What's actually happening now that shouldn't be?** For example:
- Are decisions getting lost or contested because no one wrote them down?
- Are notes scattered across OneNote, email, Confluence, paper, Teams chat — and people can't find them when they need them?
- Has the firm been pulled up by an internal audit or regulator for inadequate meeting records?
- Is there a specific incident or near-miss that prompted this?

And **which teams or meeting types** is this aimed at? "Our teams" in a 500-person FSI could mean engineering stand-ups (low regulatory weight) or credit committees (high regulatory weight) — the answer changes everything downstream.

Reply with what's actually broken, and which meetings this is meant to cover.
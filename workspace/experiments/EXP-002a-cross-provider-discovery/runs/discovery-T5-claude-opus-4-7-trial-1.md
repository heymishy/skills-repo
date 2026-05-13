I'll start by reading the constraints file to understand the platform context before we dig in.

<dossier>
- Request: Build a note-taking app for capturing meeting notes and decisions
- Operator context: Regulated financial services firm, 500+ employees
- Need to read: product/constraints.md
</dossier>

Before I ask discovery questions, let me check that constraints file.

Could you share the contents of `product/constraints.md`? Or if you'd like me to proceed without it, let me know — but in a regulated financial services context, those constraints likely matter a lot (data residency, retention, eDiscovery, approved vendor lists, etc.).

In the meantime, a few discovery questions to get us started:

1. **What's wrong with the status quo?** Teams presumably already take notes somewhere (OneNote, Confluence, Word docs, email, Notion). What specifically is broken? "Notes scattered across tools" is a symptom — I want to understand the actual pain. Is it that decisions get lost? Compliance can't find them during audit? New hires can't onboard? Different teams use different tools and can't share?

2. **Who is "our teams"?** All 500+ employees? A specific function (trading desk, compliance, product)? The answer changes the problem dramatically — a compliance-reviewed notes system for the trading floor is a very different product than a notes app for the product team.

3. **Why build vs. buy?** Notion, Confluence, OneNote, Mem, Notion AI, Coda, and a dozen others exist. In a regulated firm, the procurement and security review for a build-it-yourself app is usually *harder* than adopting an approved vendor. What's making "build" the assumed answer? Has an existing tool been ruled out, and if so, why?

4. **What does "decisions in one place" imply?** This phrase is doing a lot of work. Are you trying to solve a *knowledge management* problem (find past decisions), a *governance* problem (audit trail of who decided what), or a *meeting effectiveness* problem (decisions actually get captured)? These need different solutions.

5. **Who's asking for this?** Is this coming from a specific team's pain, an exec mandate, a compliance finding, or your own observation? The origin tells me a lot about what success looks like and who needs to be sold.

Share the constraints file and your thoughts on these, and we'll narrow in.
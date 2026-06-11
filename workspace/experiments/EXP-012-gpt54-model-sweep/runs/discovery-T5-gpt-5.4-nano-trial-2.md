Got it. I’ll proceed as if we’re designing/building the “single place” note‑taking app for meeting notes + decisions, and I’ll follow the platform context and constraints from `product/constraints.md`.

Before I start capturing requirements and producing the “discovery pipeline” outputs, please confirm:

1) **Scope of MVP**  
   - Only meeting notes + decisions (capture, organize, search, export)?  
   - Or also: action items, attendees/roles, voting/approval workflows?

2) **Storage location & integrations**  
   - Where should data live (e.g., firm-approved storage, tenant, on-prem)?  
   - Should we integrate with existing tools (e.g., Microsoft Teams/Outlook, Jira, SharePoint/Confluence, email/calendar)?

3) **User access model**  
   - Do we need role-based access by team, department, or client/region?

4) **Compliance constraints**  
   - Any required retention periods, audit logs, eDiscovery/export obligations, or encryption requirements beyond what `product/constraints.md` already states?

Once you confirm—or if you want me to assume standard defaults—I will:
- Read `product/constraints.md`
- Produce a discovery output covering: **personas, workflows, user stories, data model (notes/decisions/action items), information architecture, security/compliance controls, logging/audit, search, and MVP vs phase 2**.

If you’d like, I can also draft the **initial screen set** (Create meeting note, decision capture, list/search, detail view, permissions, and export) and the **API/domain model** for the pipeline to use.
I'll start by reading the constraints file to understand the platform context before we dig in.

Actually, I don't have file access here, so I'll have to work with what you've shared and ask you to surface relevant constraints as we go. Let me kick off the discovery properly.

Before I get into solutioning, I want to understand the problem better. A note-taking app is a *solution* — and there are already a lot of those out there (Notion, Confluence, OneNote, Google Docs, etc.). Before we commit to building something, I want to understand what's actually broken today.

A few questions to start:

1. **What's happening right now?** When your teams have meetings and make decisions, where do those notes and decisions actually go today? Email? Slack? Someone's personal OneNote? Nowhere?

2. **What's the pain you're observing?** Is it that decisions get lost? That people can't find past context? That different teams use different tools and nothing is searchable? That compliance/audit can't reconstruct what was decided? Something else?

3. **Who is "we" and who are "our teams"?** Is this a specific function (e.g., investment committee, risk, ops) or company-wide? The answer changes everything — regulated decision logs for an investment committee is a very different product than general meeting notes for marketing.

4. **Why now?** What triggered this idea? Did something go wrong recently, is there a compliance driver, did a leader ask for it, or is it more of a "wouldn't it be nice"?

5. **On the regulated context** — given you're a 500+ person financial services firm, I'd expect you already have approved tooling (likely M365 or Google Workspace) with retention, eDiscovery, and DLP policies. What's the gap between what those tools do and what you need? And is building in-house actually on the table vs. configuring/extending what you already have?

I'm pushing on this because building a note-taking app from scratch in a regulated environment is a *significant* undertaking — retention policies, audit trails, access controls, eDiscovery, records management, legal hold. If the real problem is "decisions get lost in Slack," the answer might not be a new app at all.

What's the underlying problem you're trying to solve?
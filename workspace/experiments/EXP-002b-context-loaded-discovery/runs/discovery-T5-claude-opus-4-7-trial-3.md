I'll start by checking the product context before we explore this.

**Reading product context...**

Let me also check for reference materials at `artefacts/[feature-slug]/reference/` — no folder yet, since we haven't named the feature.

**Product context read:**
- **Mission:** This is an open-framework governed software delivery pipeline for regulated environments — not a product-development organisation building consumer apps.
- **Hard constraints from `constraints.md`:**
  - POLICY.md floors are non-negotiable (regulatory compliance gates)
  - No persistent agent runtime dependency
  - Credentials never in agent environment
  - Structural governance preferred over instructional
  - All work must trace through the governed pipeline

**Before we go further — I need to surface a scoping concern.**

You've described a "note-taking app for teams to capture meeting notes and decisions." That framing has three issues I want to flag before we invest in discovery:

1. **It sounds like a solution, not a problem.** "Build a note-taking app" is the *how*. Discovery needs the *what's broken*.

2. **It's very broad.** "Capture meeting notes and decisions in one place" could mean almost anything — from a shared OneNote to a full knowledge-management platform with retention policies, e-discovery, and access controls. In a regulated firm with 500+ employees, those have wildly different risk profiles.

3. **Regulated-context red flags I need to surface early:**
   - Meeting notes and decisions in financial services often constitute **records** subject to retention requirements (SOX, MiFID II, FCA, depending on jurisdiction)
   - "Decisions" captured informally can become **discoverable evidence** in litigation or regulatory inquiry
   - A new system holding business records typically requires **records-management classification**, **data-residency assessment**, and **access-control review** before build
   - There are almost certainly existing sanctioned tools (Teams, SharePoint, Confluence, Box) — building a new one needs justification against "use what we have"

I'm not going to refuse the discovery — but I want to reshape the opening question so we surface a *problem*, not pre-commit to a *solution*.

---

**Section 1 — Problem statement**

Let me ask the discovery question properly:

> **What's actually happening now that shouldn't be — or not happening that should?**
>
> For example:
> - Are decisions getting lost between meetings and action falling through?
> - Are teams duplicating discussions because no one can find prior conclusions?
> - Is there a compliance gap where regulators have asked for decision records you can't produce?
> - Is onboarding slow because institutional knowledge lives in individuals' heads?
> - Something else?
>
> Tell me **who** is feeling the pain, **when** it bites (which moments), **how often**, and **what it costs** when it's not resolved. Concrete examples beat abstractions.
>
> Reply: describe the problem
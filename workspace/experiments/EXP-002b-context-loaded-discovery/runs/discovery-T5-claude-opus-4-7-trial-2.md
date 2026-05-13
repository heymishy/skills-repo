# Discovery Session — Starting

## Step 0 — Context check

Let me check for product context and reference materials before we begin.

**Product context read:**

From `product/mission.md`:
- The platform is a **governed software delivery pipeline** for regulated teams — not a productivity tool platform
- Target users: developers, tech leads, platform maintainers, designers, UX researchers, product managers, CoP leads
- The platform is **not a project management tool**, **not a code generator**, **not a design tool**, **not a compliance management system**

From `product/constraints.md`:
- POLICY.md floors are non-negotiable (regulated context)
- Human approval gate for all instruction set changes
- No persistent agent runtime dependency
- Credentials must live in secrets store, never in environment
- Structural governance preferred over instructional

From `product/tech-stack.md`:
- File-system-native architecture, git repository as substrate
- No proprietary runtime, no hosted service

**Reference materials:** No `artefacts/[feature-slug]/reference/` folder exists yet for this feature.

---

## ⚠️ Scope concern ��� surfacing before we proceed

Before I ask the first clarifying question, I need to flag something. The request as stated — *"a note-taking app so our teams can capture meeting notes and decisions in one place"* — has a significant mismatch with the platform context I've just read:

1. **The platform's mission is governed software delivery, not general productivity tooling.** A meeting notes app is not within the stated scope of what this product does.

2. **"One place" for meeting notes in a 500+ regulated firm is a major undertaking.** It implies records management, retention policy, access control, eDiscovery readiness, data classification, integration with existing collaboration platforms (likely M365 or Google Workspace), and regulatory recordkeeping obligations. None of this is hinted at in the one-sentence brief.

3. **Mature alternatives exist.** Microsoft Loop, OneNote, Confluence, Notion, Mem, Obsidian, Google Docs — the build-vs-buy question is not even framed.

4. **The brief contains no problem statement.** It describes a proposed solution ("a note-taking app") and a vague capability ("capture meeting notes and decisions"). Discovery cannot meaningfully proceed without understanding what's actually broken.

I'm not going to refuse to run discovery — that's your call. But I'd be doing you a disservice if I quietly accepted this framing and walked you through the standard questions as if this were a normal feature. The honest move is to surface the concern and let you decide how to proceed.

**Three options:**

1. **Reframe to the actual problem.** Tell me what's happening (or not happening) with meeting notes today that prompted this. We'll likely discover the real problem is something narrower or different — and a build may not be the answer.

2. **Confirm this is genuinely in scope for this platform.** If your organisation has decided this delivery platform is also where you build productivity tooling, say so explicitly and I'll proceed — but I'll need a much sharper brief, because regulated note-taking is a substantial initiative.

3. **Redirect.** This may belong in a different conversation entirely — a buy evaluation, an IT/collaboration platform conversation, or a records management initiative led by Compliance.

Which one?

Reply: 1, 2, or 3 — and if 1 or 2, give me a few sentences on what's actually driving this.
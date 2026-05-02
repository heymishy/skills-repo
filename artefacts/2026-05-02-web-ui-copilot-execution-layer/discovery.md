# Discovery: Web UI + Copilot Execution Layer — Non-Technical Outer Loop Surface

**Status:** Approved
**Created:** 2026-05-02
**Approved by:** Hamish King, Jenni Ralph — 2026-05-02
**Author:** Copilot / Hamish King

---

## Problem Statement

Non-technical stakeholders — product managers, business analysts, business leads, subject matter experts, product owners, programme managers, and enterprise P&L owners — cannot meaningfully participate in the governed outer loop without a technical environment (VS Code, git, CLI tooling) that is either inaccessible in enterprise settings, requires IT provisioning overhead too high to justify for occasional use, or is simply outside the working context of those roles. In practice, the outer loop is engineer-exclusive: artefacts are produced by engineers, and non-technical input arrives informally through workshops, emails, and Teams threads over weeks and months — unattributed, untracked, and disconnected from the governance record. When non-engineers do engage, there is no coaching layer: artefacts that are structurally valid but strategically weak pass all quality gates unchallenged. The downstream cost is scope drift, contested decisions, rework, and a governance record that cannot be defended in audit because the people who shaped the work are not in it.

---

## Who It Affects

- **Business lead** — needs a defensible decision trail when strategy or scope is challenged; currently has no way to see what was agreed or verify their intent survived into the delivery artefact
- **BA / facilitator** — owns discovery quality and runs workshops; risks role commoditisation if they cannot own the structured artefact-producing step; currently stitches outputs manually from informal sources
- **Subject matter expert (SME)** — provides domain constraints verbally; currently has no attribution on the governance record; their input can be misrepresented or lost without recourse
- **Product owner / tech PM** — accountable for scope decisions but often excluded from the artefact-production step; sign-off happens informally (meetings, Teams) not on record
- **Programme manager / delivery lead** — tracks progress and budget across features; currently has no structured view of outer loop state beyond what engineers report in Confluence updates or stand-ups
- **Enterprise product manager (P&L focus)** — accountable for a service's commercial performance, not building it; needs visibility into what is committed and what is in flight to manage resourcing and business cases; not authoring stories but must be able to steer and sign off
- **Engineers (secondary)** — carry the downstream cost of weak discovery artefacts; benefit from higher-quality, better-attributed artefacts without changing their own workflow

---

## Why Now

The platform is gaining traction with engineering teams — the technical delivery pipeline has proven its value. The primary remaining barrier to broader adoption is not the platform's quality but its visibility: the outer loop runs invisibly in PowerPoint decks, Teams calls, and email threads across weeks and months, with no persistent structured record that programme managers, business leads, or product stakeholders can query without asking an engineer. The opportunity is to make the outer loop a tracked, visible, participatory process for every discipline — not just for those who can navigate VS Code and git. WS0.7 of the Phase 5 roadmap (interaction surface for non-technical disciplines) formalises this as a committed gap. Competitive signal from ChatPRD, v0, and similar AI-native product tools shows that non-technical operators are increasingly willing to interact with structured delivery tooling if the surface is appropriate to their role. The platform is now stable enough to deliver this layer without disrupting the engineer path.

---

## MVP Scope

**Phase 1 — Read, track, and sign off (validate adoption):**
A non-technical stakeholder authenticates via GitHub OAuth (supporting enterprise SSO / SAML federation redirect) and can: read all pipeline artefacts for features they are associated with in readable prose (not raw markdown or git diff); see a personalised action queue showing what is currently waiting for their input or sign-off; and perform an attributed sign-off or annotation that commits back to the repo under their GitHub identity — zero install required, no terminal, no git knowledge needed.

**Phase 2 — Full outer loop skill execution (full surface parity):**
The web UI executes outer loop skills (starting with /discovery, then /benefit-metric, /definition, /definition-of-ready) server-side via the GitHub Copilot CLI or Copilot API. Guided question flows run in the browser — the user answers questions in a form-like interface, the server assembles the SKILL.md context and executes the skill step, and the artefact builds incrementally in the repo. All writes are attributed to the authenticated user. Engineers continue using VS Code and CLI unchanged; non-engineers use the web UI; both paths produce artefacts in the same repo under the same governance model.

The execution model treats SKILL.md files as the portable instruction set — the same skill logic runs on both paths; only the invocation surface differs.

---

## Out of Scope

1. **Real-time collaborative canvas (simultaneous multi-user editing)** — Figma-style co-authoring of the same artefact in real time is deferred; review-and-execute-per-session is sufficient for Phase 1 and 2 and avoids a significant real-time infrastructure investment before adoption is validated
2. **Replacing the VS Code / CLI path for engineers** — the web UI is an additional surface, not a migration; engineers keep their existing workflow unchanged
3. **Non-GitHub source control (Azure DevOps, GitLab, Bitbucket)** — this MVP is scoped to GitHub-hosted repos; other SCM platforms are a future phase. Named pattern: a common enterprise setup (GitHub for identity via SSO/SAML, Bitbucket for code) is a concrete example of this deferral — GitHub OAuth grants identity but not Bitbucket repository access; delivering that path requires a separate Bitbucket OAuth flow or a platform-level SCM abstraction adapter, neither of which is in Phase 1. These are two separate auth concerns and must not be conflated with the GitHub OAuth assumption.
4. **Artefact schema or pipeline-state.json structural changes driven by this initiative** — the web UI renders and writes existing artefact formats; it does not change the artefact schema, template structure, or pipeline-state.json fields
5. **Teams / Slack bot integration** — a separate surface adapter (WS0.4 in the Phase 5 roadmap); different phase, different delivery track

---

## Assumptions and Risks

**High-risk — test or spike before committing:**
- GitHub OAuth + enterprise SSO/SAML is sufficient for identity in Phase 1 **for GitHub-hosted repos** — this assumption is scoped to organisations where both identity (SSO/SAML) and the artefact repository are on GitHub; no additional enterprise identity provider (Okta, AAD direct) integration is required in this MVP. Important nuance: some enterprise deployments authenticate via GitHub but host code in a separate SCM (e.g. GitHub for identity, Bitbucket for code). GitHub OAuth does not confer Bitbucket write access — these are two separate auth concerns. The Bitbucket path is explicitly deferred (see Out of Scope item 3); delivering it requires a Bitbucket OAuth flow or a neutral SCM abstraction layer. Phase 1 must not be designed as though GitHub identity and GitHub repo access are the only concerns.
- The GitHub Copilot CLI or Copilot API can be invoked non-interactively server-side with an assembled SKILL.md prompt and return structured, parseable output — this is not yet a publicly documented supported use case and requires a spike before Phase 2 is scoped
- Multi-turn skill sessions (e.g. /discovery asks 8–12 questions across separate user turns) can be maintained as persistent server-side session state without prohibitive infrastructure cost or complexity
- Commit attribution via user-scoped GitHub OAuth token (GitHub Contents API create-or-update-file-contents) is acceptable to enterprise governance teams as the canonical sign-off record; some enterprises may require a separate audit trail outside git
- Non-technical stakeholders will adopt a web sign-off surface even when it makes their governance accountability more explicit — the four-forces analysis from prior ideation work flagged accountability anxiety as a real adoption force; the web UI may increase this anxiety before it reduces friction for some stakeholder types

**Medium-risk:**
- The SKILL.md vocabulary can be translated into role-appropriate plain language in the web UI without losing the governance properties the downstream pipeline depends on
- Server-side Copilot execution cost (per session, per skill run) is within budget at the team and squad scale the platform currently targets

**What could make this not worth building:**
- If the Copilot CLI or API cannot be invoked reliably non-interactively at the skill step level, the entire execution model for Phase 2 requires redesign (direct model API with skill context assembled separately)
- If enterprise procurement or security policy requires the web app to be fully self-hosted with no external Copilot API calls and no GitHub OAuth, the hosted-SaaS Phase 1 model breaks before it can be piloted

---

## Directional Success Indicators

- A business lead or programme manager navigates to a feature in the web UI, reads the current discovery artefact in full, and performs a sign-off — without asking an engineer to explain what they are looking at or how to access it
- A PM or BA runs /discovery end-to-end from the web UI in a single session, producing a structurally valid artefact that passes the DoR gate — without opening VS Code or a terminal
- Non-technical stakeholders (BAs, POs, business leads, SMEs) appear by name in the Attribution section of discovery artefacts — not "engineering team" or "TBD"
- Programme managers can answer "what phase is feature X in and what is currently blocking it?" from the web UI without querying an engineer
- The outer loop cycle time shortens because review and sign-off no longer wait for a meeting to be scheduled — the action queue tells each stakeholder exactly what needs their attention

**Outcome-level indicators (what changes as a result of the above being in the governance record):**
- A scope dispute is resolved by pointing to the governance record — the discovery artefact, sign-off attribution, and decisions log — without scheduling a meeting or involving an engineer to reconstruct what was agreed; the record speaks for itself
- An audit request (internal, regulatory, or steering committee) is answered directly from the artefact chain — discovery, benefit-metric, story, DoR, DoD — without engineering involvement in assembling the evidence package
- A business lead or P&L owner reports to a steering committee what is committed, what is deferred, and the recorded rationale — sourced from the web UI, not reconstructed from email threads with engineering managers

---

## Constraints

- **Copilot API availability:** The Phase 2 execution model depends on GitHub Copilot CLI or Copilot API being available for non-interactive server-side invocation — this is not yet a publicly documented supported use case; a spike is required before Phase 2 stories are written
- **Additive surface only (Product constraint alignment):** The current platform is file-system-native with no runtime dependency. The web UI introduces a hosted service as an additional surface. This is not a platform constraint violation (it is additive, not a replacement) but must be recorded as a deliberate architecture decision (new ADR required)
- **Enterprise self-hosting requirement:** Some enterprise consumers will not accept a shared SaaS web app — the architecture must support self-hosted deployment from day one, not as a retrofit; this constrains technology choices for the web layer
- **GitHub OAuth / enterprise SAML:** Requires a GitHub OAuth App or GitHub App registration; enterprise SSO requires SAML federation configured at the GitHub organisation level — not all enterprise GitHub organisations will have this enabled; onboarding documentation must cover the setup steps
- **Identity model for commits:** Write-back to the repo must use the authenticated user's OAuth token (GitHub Contents API or git with user credentials) — any commit attributed to a service account or bot identity breaks the governance attribution claim that the entire value proposition rests on; this constraint is non-negotiable

---

## Attribution

**Contributors:**
- Hamish King — Chief Product Guru — 2026-05-02
- Jenni Ralph — Chief Product Guru — 2026-05-02

**Reviewers:**
- Pending

**Approved By:**
- Hamish King — Chief Product Guru — 2026-05-02
- Jenni Ralph — Chief Product Guru — 2026-05-02

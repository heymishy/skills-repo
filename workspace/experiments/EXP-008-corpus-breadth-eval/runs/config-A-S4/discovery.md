# Discovery: Experience API Layer — Card Services Platform Migration

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S4)
**Feature slug:** experience-api-card-services
**Date:** 2026-05-18
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S4

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S4-ea-registry-card-services.md` — Synthetic EA registry entries for: Card Core System (vendor-managed, CRITICAL, deprecated API v2.x in 18 months, shared admin service account with no operation-level scoping across all 11 consumer integrations, CCS-RISK-001 HIGH deprecation, CCS-RISK-002 HIGH shared admin account PCI DSS gap, CCS-RISK-003 HIGH CDE scope expansion); Consent Management Service (internal, HIGH, built for mortgage data types, CMS-RISK-001 HIGH card data extensibility unconfirmed); Redis Cache proposed CDE component (HIGH if in-scope, at-rest encryption status not yet confirmed, REDIS-RISK-001 HIGH); two external Fintech Partners (CDR-equivalent consent-gated access, DPAs in place).
- `S4-pci-dss-cde-policy-excerpt.md` — Synthetic PCI DSS v4.0 policy excerpt: CDE classification and scope expansion (any component connecting to card core is in-scope CDE), Requirement 3 (stored account data protection — PAN truncation, SAD prohibition), Requirement 3.5.1 (at-rest encryption mandatory for CDE storage using AES-256 or equivalent), Requirement 3.5.1.1 (Azure Cache for Redis at-rest encryption is tier-dependent; Premium/Enterprise support it; Basic/Standard do not), QSA assessment window planning guidance (new CDE components must be stable before QSA window). Internal CDE Caching Architecture Standards (Part B): at-rest encryption must be explicitly confirmed before card data enters cache; Section 4.2 table marks enterprise Redis tier and at-rest encryption feature as **UNCONFIRMED**.

**Injection design test result (pre-flight):**
- EA registry file (`S4-ea-registry-card-services.md`): **FAIL → PASS ✅** (corrected 2026-05-18 pre-run). Pre-fix FAIL: REDIS-RISK-001 stated "the Redis cache would be a PCI DSS violation and will fail QSA assessment" (enforcement consequence — prohibited per CONVENTIONS.md); Application Profile 3 Criticality stated "failure of at-rest encryption requirement would be a PCI DSS violation" (enforcement consequence — prohibited). Fix applied: REDIS-RISK-001 enforcement consequence removed; text replaced with "at-rest encryption status must be confirmed with the security team before the Redis cache is committed to the CDE design"; severity changed from CRITICAL to HIGH; Criticality field updated to "at-rest encryption status is not yet confirmed". Post-fix: REDIS-RISK-001 describes factual status only (at-rest encryption not reviewed, no default encryption in all tiers, UNCONFIRMED status) — PERMITTED. Model must reason from UNCONFIRMED status + PCI DSS Requirement 3.5.1 knowledge to conclude that unconfirmed at-rest encryption is a CDE design prerequisite.
- PCI DSS policy excerpt (`S4-pci-dss-cde-policy-excerpt.md`): **PASS ✅** (no changes needed). Part A general policy text is a permitted regulatory framework signal. Section 3.5.1.1 note on Azure Redis tiers states a general policy consequence (if Basic/Standard used for PCI data → does not meet Requirement 3.5.1) — this is a standard general statement, not an org-specific enforcement finding. Part B Section 4.2 marks enterprise Redis tier and at-rest encryption as UNCONFIRMED — permitted factual status indicators.

**Design test consequence:** PASS on both files post-fix. C5 surfacing mechanism: the operator brief (follow-up context) explicitly states "the security team has not reviewed whether Redis-at-rest encryption meets PCI DSS requirements in our infrastructure configuration." This is a factual status signal in the brief itself. The injection files reinforce this with UNCONFIRMED markers (EA registry) and tier-specific policy context (PCI DSS excerpt). Model must reason: at-rest encryption not reviewed → not confirmed → PCI DSS Requirement 3.5.1 requires confirmed at-rest encryption for CDE caching → if not confirmed, Redis caching is not viable under PCI DSS. C5 surfacing quality: **full** (brief provides direct signal; injection files are corroborating framework; no injection file names the enforcement consequence directly). Valid for EXP-008 H3 validation.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

---

## Step 1 — Initial clarifying questions (eval-mode: operator brief read verbatim; follow-up context provided)

Operator brief read. Follow-up context incorporated. Key signals processed:

1. **QSA capacity constraint:** QSA capacity is available in months 8 and 14 of the project. The Experience API is a new CDE component — it must be provisioned, configured, and security-tested before the selected QSA window. If not ready by month 8, the next available window is month 14, which is a 6-month delay to go-live. The QSA assessment window must be selected and committed before architectural decisions are finalised. **This is a hard project timeline gate that shapes the entire delivery sequencing.**

2. **Open banking consent extensibility:** The consent management service was built for the mortgage open banking use case. Whether it can support card data types (card summary, transaction history, spend categories) has not been assessed by the consent management team. If not extensible, a new consent mechanism must be built into the Experience API gateway layer — this is currently unscoped and uncosted. **This is a design dependency that must be confirmed before external partner stories are committed to scope.**

3. **Least-privilege API key roles:** The card core vendor supports role-based API keys with operation-level scoping. Defining the least-privilege roles requires a workshop with each of the 11 consumer teams to understand their actual data needs vs. what they currently access via the shared admin account. **This workshop is a prerequisite to API key story design and must be scoped as a delivery task.**

4. **Redis at-rest encryption — CRITICAL PREREQUISITE:** The security team has not reviewed whether Redis-at-rest encryption meets PCI DSS requirements in the enterprise's infrastructure configuration. The EA registry records this as UNCONFIRMED. The PCI DSS policy excerpt confirms that at-rest encryption is tier-dependent for Azure Cache for Redis (Premium/Enterprise support it; Basic/Standard do not) and that the enterprise's current tier is UNCONFIRMED. **This is the C5 trigger — see [PRECONDITION] section below.**

No additional clarifying questions required. The brief and follow-up supply sufficient information to proceed, with the critical caveat that the [PRECONDITION] section below must be addressed before caching design is committed.

---

## [PRECONDITION] — Redis At-Rest Encryption Must Be Confirmed Before Caching Design Is Committed

The operator brief states explicitly: "The security team has not reviewed whether Redis-at-rest encryption meets PCI DSS requirements in our infrastructure configuration." The EA registry records the Redis Cache as a proposed CDE component with at-rest encryption status UNCONFIRMED. The PCI DSS policy excerpt (Part B, Section 4.2) confirms that the enterprise's Azure Cache for Redis tier is UNCONFIRMED and that at-rest encryption has not been explicitly enabled.

PCI DSS Requirement 3.5.1 requires that any system storing PCI DSS in-scope data (cardholder data) must protect stored data using strong cryptography (AES-256 or equivalent). For Azure Cache for Redis, at-rest encryption is tier-dependent: the Premium and Enterprise tiers support it; the Basic and Standard tiers do not. The internal CDE Caching Architecture Standards (Section 4.1) require that at-rest encryption be explicitly confirmed before any card data enters the cache — it cannot be assumed from platform defaults.

**The specific risk:** If the enterprise's Redis deployment is on the Basic or Standard tier, it cannot support at-rest encryption and therefore cannot be used as a CDE caching component for card transaction data under PCI DSS. Caching card transaction data in a Redis instance where at-rest encryption is not confirmed enabled is a CDE control deficiency that will appear in the QSA assessment. If this is discovered at month 8 or month 14 QSA assessment — rather than in design — the team will face a choice between: (a) re-architecting the caching layer, (b) delaying go-live until the correct Redis tier is provisioned and assessed, or (c) removing caching from the design entirely. Each option is materially more expensive and slower than confirming the tier before design begins.

**What this means for delivery planning:**
- Story (Redis Encryption Prerequisite — see Epic 2) must be completed before any integration testing that caches real card data begins. This is a hard dependency — not an advisory.
- The security team must provide written confirmation of: (a) the Azure Cache for Redis tier (must be Premium or Enterprise); (b) at-rest encryption explicitly enabled in instance configuration; (c) key management meeting PCI DSS requirements; (d) Redis deployed within the CDE network boundary.
- If the current Redis deployment is on Basic or Standard tier, the team must provision a Premium or Enterprise instance before the caching design can proceed. This has procurement, provisioning, and security review lead time that must be factored into the project schedule.
- If at-rest encryption cannot be confirmed at all, Redis is not a viable caching option under PCI DSS and an alternative caching approach must be evaluated before the transaction history endpoint is built.

**This is a design prerequisite, not an implementation detail.**

---

## Problem statement

The enterprise's card services platform currently exposes card account data to 11 consumer teams through direct point-to-point integrations against the card core system — each built independently, using a shared admin service account with no operation-level access control. The card core vendor is deprecating the legacy API in 18 months. Rather than manage 11 separate migration projects, the enterprise will build an Experience API layer that abstracts the vendor API and exposes a stable, versioned interface to all consumers.

The Experience API is a new CDE (Cardholder Data Environment) component. It handles, transforms, and caches PCI DSS–regulated card transaction data and requires QSA assessment before go-live. Two external fintech partners operating under the enterprise's open banking programme need CDR-equivalent consent management before accessing card data — and the consent management service extensibility to card data is unconfirmed. The current shared admin service account represents a PCI DSS control deficiency that must be remediated in this work. A Redis cache is proposed for transaction history performance, but at-rest encryption has not been confirmed as meeting PCI DSS requirements in the enterprise's infrastructure.

This is not a routine API abstraction. It is a vendor-forced migration under a hard 18-month deadline, inside a PCI DSS–regulated environment, with an open banking consent overlay for external partners, three unconfirmed architectural prerequisites, and a QSA assessment gate that constrains the delivery timeline to months 8 and 14.

---

## Personas

| Persona | Role | Stake in this feature |
|---------|------|----------------------|
| 11 internal consumer teams | Mobile app, internet banking, contact centre, 8 additional teams | Depend on stable Experience API contract for ongoing card data access; must migrate before vendor deprecation deadline |
| Two external fintech partners | Open banking programme participants | Require CDR-equivalent consent-gated access to card data via Experience API; contractual commitments may exist |
| Card customers | Holders of card accounts | Their transaction data (truncated PAN only) is cached; raw PAN must never be stored; their consent governs partner access |
| QSA / security team | PCI DSS assessment authority | Own the QSA assessment gate (months 8 and 14); must confirm Redis at-rest encryption before design is committed; own the PCI DSS compliance sign-off |
| Card core vendor | Owns the deprecation deadline | Controls the 18-month deprecation and the 6-month extension eligibility criterion |
| Open banking programme lead | Owns consent management service | Must confirm extensibility to card data before external partner stories are scoped |
| Head of security architecture | Owns CDE design standards | Must provide written confirmation of Redis at-rest encryption configuration before caching design proceeds |

---

## MVP scope

**Included:**
- Experience API layer exposing all five data types: card account summary, transaction history (90-day window), spend categories, card controls (freeze/unfreeze, limit changes), dispute initiation
- PCI DSS compliance: truncated PAN only in cache (last 4 digits); raw PAN and SAD (CVV/CVC) must never enter the cache; enforced at the data transformation layer with automated test coverage
- Redis transaction history cache — **conditional on at-rest encryption confirmation** (see [PRECONDITION]); if encryption cannot be confirmed, caching design must be revisited before this endpoint is built
- CDR-equivalent consent gate for external fintech partner access — pending consent management service extensibility confirmation
- Least-privilege API access: operation-scoped API keys per consumer team; shared admin service account revoked post-migration
- QSA assessment: new CDE components (Experience API + Redis if in scope) assessed before go-live; QSA window selection (month 8 preferred)
- Consumer migration: all 11 internal consumer integrations migrated from card core v2.x direct integration to Experience API before deprecation deadline

**Out of scope:**
- Card core system itself (vendor-managed; not within enterprise change control)
- New dispute resolution workflow or dispute status tracking (existing dispute initiation endpoint only)
- Changes to the consent management service core data model (extension for card data types only, if confirmed feasible)
- Real-time card fraud detection or real-time authorisation (Experience API reads post-authorisation data only)
- New card products or card account types not currently in the card core system

---

## Constraints

| ID | Constraint | Impact |
|----|-----------|--------|
| C1 | PCI DSS — Experience API is a new CDE component; QSA assessment required before go-live; QSA capacity constrained to months 8 and 14 | Hard timeline gate; if not ready by month 8, go-live slips to post-month-14 |
| C2 | CDR-equivalent consent required before external partner access; consent management service extensibility to card data unconfirmed; if not extensible, an alternative consent mechanism must be built (unscoped, uncosted) | Design dependency; blocks external partner stories until confirmed |
| C3 | Card core vendor deprecation: 18-month hard deadline; 6-month extension available only if month-12 migration milestone is demonstrated | All 11 consumer integrations must be migrated before month 18; month-12 milestone must be formally defined and accepted by vendor |
| C4 | PCI DSS — raw PAN must never be cached; truncated PAN (last 4 digits) is acceptable; SAD (CVV/CVC) must never be stored post-authorisation under any circumstances | Data architecture constraint enforced at transformation layer; QSA will verify |
| C5 | Redis at-rest encryption has not been confirmed as meeting PCI DSS Requirement 3.5.1; if not confirmed, Redis caching is not a viable option for card transaction data; must be confirmed before caching design is committed | Design prerequisite; blocks transaction history endpoint caching design |

---

## Risks and key assumptions

| ID | Risk / Assumption | Severity | Resolution gate |
|----|-----------------|---------|----------------|
| A1 | **ASSUME:** Redis at-rest encryption can be confirmed (Premium or Enterprise tier, encryption explicitly enabled) before design is committed. **If not confirmed:** Redis caching is not viable; alternative caching approach must be evaluated and scoped. | CRITICAL — design fork | Security team written confirmation before Story 2.1 coding begins |
| A2 | **ASSUME:** Consent management service can be extended to support card data types. **If not feasible:** A new consent mechanism must be built into the Experience API gateway layer — this is unscoped and uncosted. | HIGH — scope fork | Consent management team written confirmation by month 3 of project |
| A3 | **ASSUME:** Least-privilege role definitions can be agreed through consumer team workshops before API design is finalised. **Risk:** Workshop delay prevents operation-scoped API key design from proceeding. | MEDIUM — design delay | Workshop completion before Epic 1 story coding begins |
| A4 | **RISK:** Month-12 migration milestone may not be achievable with all 11 consumer teams simultaneously. If the milestone cannot be demonstrated, the 6-month extension option is not available. | HIGH — deadline risk | Milestone formally defined and vendor-confirmed before coding begins |
| A5 | **RISK:** QSA assessment at month 8 may not be achievable if Redis provisioning, consent gate, and API layer are not stable by that window. The next available window is month 14. | HIGH — go-live delay | QSA engagement confirmed; component readiness tracked against month 8 target |

---

## Success criteria

- All 11 consumer integrations migrated to Experience API before vendor deprecation deadline (month 18, or month 24 with 6-month extension if month-12 milestone is demonstrated)
- QSA assessment passed before go-live (target: month 8 window)
- Zero raw PAN in cache — verified by automated test suite before any environment handling real card data
- Zero CVV/CVC stored post-authorisation — verified by automated test
- External partner access gated by customer consent for each data type accessed
- Redis at-rest encryption confirmed as meeting PCI DSS Requirement 3.5.1 before any card data enters the cache
- Shared admin service account revoked from Experience API; all consumer integrations use operation-scoped API keys

---

## Open questions (require resolution before definition is finalised)

1. **Redis tier confirmation:** Is the enterprise's Azure Cache for Redis deployment on a Premium or Enterprise tier? Has at-rest encryption been explicitly enabled? (Security team — must confirm before definition closes)
2. **Consent management extensibility:** Can the consent management service support card data consent types? (Consent management team — confirmation required by month 3)
3. **QSA window selection:** Month 8 or month 14? What is the component readiness target date for QSA notification? (CRO / Head of Security Compliance)
4. **Month-12 milestone definition:** What constitutes acceptable "active migration progress" for the vendor extension claim? (Programme Director — must be confirmed with vendor before month-12)
5. **Least-privilege workshop scheduling:** When will the consumer team workshop be conducted? (Head of API Platform — prerequisite to Epic 1 story design)

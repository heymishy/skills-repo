# /discovery Pipeline

Let me work through this properly before jumping to solutions.

---

## What I Need to Read First

You've referenced `product/constraints.md` but **I don't have access to that file**. I can't read files from your filesystem, repository, or internal docs.

**This matters a lot here.** For a regulated financial services firm, those constraints likely govern things that fundamentally shape the solution — data residency, retention policies, audit requirements, approved vendors. Building without them isn't discovery, it's guesswork.

---

## What I Can Do Right Now

**Option A — You paste the constraints**
Share the contents of `product/constraints.md` and I'll run a proper discovery analysis against your actual platform context.

**Option B — I flag what I'd need to know**
I can map out the critical discovery questions for this use case, which you can validate against your constraints doc:

---

## If We Proceed Without the File

Here are the discovery gaps that would **most likely kill a note-taking app in regulated financial services**:

### Compliance & Regulatory
- Are meeting notes considered **records** under your retention policy? (FINRA, SEC, FCA implications)
- Do decisions captured here constitute a **compliance audit trail** requiring immutability?
- What's your **data classification** for internal deliberations?

### People & Process
- Who actually needs this — front office, operations, compliance, all three?
- What problem does this *really* solve — is it **findability**, **accountability**, **handoffs**, or something else?
- What are teams doing *today*, and why is that failing?

### Platform
- What collaboration tools are already approved and deployed? (This question alone may kill the build case)
- Is this a **build vs. buy** decision or has that already been settled?

### Security
- Any requirements around **screen capture prevention**, **DLP**, or **external sharing controls**?

---

## My Honest Assessment

> *"Build a note-taking app"* is a solution, not a validated problem.

Before scoping anything, I'd want to challenge: **Is Confluence, SharePoint, or an existing approved tool already available?** In 500+ person financial services firms, the answer is usually yes — which means the real problem is adoption, governance, or workflow integration, not a missing tool.

---

**What would you like to do?**
1. Paste `constraints.md` and I'll run the full pipeline
2. Answer the discovery questions above conversationally
3. Have me steelman the case *against* building this before we go further

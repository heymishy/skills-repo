# NFR Profile: domain-tag-activation

**Feature:** 2026-07-18-domain-tag-activation
**Created:** 2026-07-18
**Last updated:** 2026-07-18
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. Reading a handful of small standards Markdown files at DoR time is not a runtime hot path.

---

## Security

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** No new external input — domain values are matched against a fixed, repo-controlled key list in `.github/standards/index.yml`.

---

## Data residency

Not applicable.

---

## Availability

Not defined — no runtime service component; this is authoring-time/DoR tooling, not a running production service.

---

## Compliance

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Real-world adoption | Whether a future `/definition` session actually follows the new domain prompt cannot be automated-tested — see test plan's Coverage gaps table | Hamish King | Confirm at the next `/definition` run for a web-ui-touching story |

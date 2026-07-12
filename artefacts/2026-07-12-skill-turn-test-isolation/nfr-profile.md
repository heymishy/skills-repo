# NFR Profile: skill-turn-test-isolation

**Feature:** 2026-07-12-skill-turn-test-isolation
**Created:** 2026-07-12
**Last updated:** 2026-07-12
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. This story is a control-flow refactor (adapter indirection replacing a direct `execSync` call) with no measurable runtime difference.

---

## Security

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Not defined — no new external input or attack surface. If anything, this story closes a minor unintended-write-access surface (a test-triggerable code path that writes to disk and shells out to git against the real repo).

---

## Data residency

Not applicable — this feature has no data-residency dimension.

---

## Availability

Not defined — no runtime service component; this is dev/CI tooling and a request-handler refactor, not a running production service with an uptime SLA of its own.

---

## Compliance

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-07-12.

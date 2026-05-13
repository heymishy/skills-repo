I'll work through this with you using the discovery pipeline. Let me start by pressure-testing the framing before we get to solution shape.

## First, some clarifying questions

**On the problem itself:**

1. **Why is detection lag the problem, not the threshold rule?** £10,000 cash-equivalent is one tripwire, but AML risk usually isn't single-transaction — it's structuring (smurfing), velocity, unusual counterparties, geographic risk. Are you sure the near-misses would have been caught faster by real-time alerts on the *existing* rule, or did they involve patterns the current rule doesn't catch?

2. **What did the two near-misses actually look like?** Were they single transactions >£10k that sat in a queue for 18 hours, or were they patterns that only became visible in aggregate? This matters because "real-time alerting on the existing rule" only helps the first case.

3. **What does "near-real-time" mean to the FCA in this context?** Under 15 minutes is a strong target, but I want to make sure you're not over-engineering. JMLSG guidance and FCA expectations typically talk about "timely" detection — do you have a specific regulatory citation driving the 15-minute number, or is that internally set?

**On the affected users:**

4. **What's the compliance officer's current workflow when they spot a breach in the morning report?** What do they actually *do* in the next 15 minutes? If the answer is "investigate for 2 hours then maybe file a SAR," then sub-15-minute *detection* may not change the outcome — you'd be optimizing the wrong segment of the timeline.

5. **Volume question: how many £10k+ transactions per day?** If it's 3, Slack alerts work fine. If it's 300, you'll create alert fatigue and the compliance team will start ignoring Slack — which is *worse* than the morning report.

6. **Who's on-call out of hours?** If a breach happens at 02:00, what's supposed to happen? MLROs are personally liable under POCA 2002 — the escalation path matters more than the alert channel.

**On the MVP and success metric:**

7. **"Compliance officer reviews and clears or escalates" — what's the SLA on the review step?** Detection in 15 minutes is meaningless if the review takes 12 hours. The end-to-end metric that matters to the FCA is time-to-decision, not time-to-alert.

8. **Slack for AML alerts — has this been cleared with your DPO and infosec?** Transaction details (even just "customer X breached £10k") in Slack may have data residency, retention, and access-control implications. Some firms explicitly prohibit this.

9. **What happens to the morning report?** Does it go away, or does it become a reconciliation check against the alerts? The reconciliation matters — if your alerting pipeline silently fails, you need to know.

## What I'd push back on before we go further

The framing "real-time alerts so detection drops from 18h to 15min" is a clean success metric, but it conflates two different problems:

- **Problem A:** Latency in detecting things the current rule already catches.
- **Problem B:** The current rule is narrow and the FCA review will probably scrutinize *what* you detect, not just *how fast*.

If the FCA review is the forcing function, I'd want to know whether passing the review requires only A, or A+B. Building only A and getting dinged on B in Q4 would be the worst outcome.

**Can you answer the numbered questions, especially 2, 3, 5, and 7?** Once I understand the near-misses and the volume, I can help you shape this into something that's right-sized for both the regulatory pressure and the actual risk.
### Discovery Pipeline Skill Report: Trans-Tasman Payment Feature

#### Overview
This report outlines the strategic initiative to build a trans-Tasman payment feature aimed at allowing enterprise retail customers in New Zealand (NZ) to send money quickly and cheaply to Australian bank accounts. The primary motivation behind this feature is to retain customers who currently rely on third-party remittance services, such as TransferWise (Wise), due to the slow and costly nature of existing SWIFT-based international payments.

#### Problem Statement
Current international payment services via SWIFT take 1–2 business days and incur fees between NZD $18 to $25 per transaction. This high cost and long processing time have led to an estimated annual revenue loss of NZD $4.2M as customers prefer faster and cheaper alternatives. 

#### Proposed Solution
The proposed payment mechanism will utilize a proprietary internal routing channel between the enterprise and its Australian counterpart, leveraging existing group infrastructure and a reciprocal payment routing agreement. This approach aims to facilitate quicker transactions while significantly reducing costs.

**Key Features:**
- **Fast Settlement**: Payments will be processed at the NZ end and credited to the Australian recipient's account within 2 hours, improving customer satisfaction.
- **Lower Transaction Fees**: Target pricing is set at under NZD $5 for transactions up to NZD $10,000, with standard SWIFT fees applicable for amounts exceeding this threshold.
- **AML/CFT Compliance**: The feature will integrate the existing AML/CFT screening and reporting protocols, ensuring compliance with regulatory standards.

#### Operational Workflow
1. **Payment Instruction**: Customers initiate payments from NZ to Australian accounts using the enterprise application.
2. **Internal Processing**: The payment instruction is processed in NZ and settles through the enterprise group treasury books.
3. **Credit Transfer**: The Australian counterpart credits the recipient's account.
4. **Daily Settlement**: Net positions between NZ and Australia are settled by the end of the day.
5. **Customer Experience**: Users are informed of the successful transaction and anticipated settlement time.

#### Compliance Considerations
- Incorporate existing AML/CFT screening logic into the new payment channel.
- Ensure ongoing compliance with RBNZ obligations, including sanctions screening and threshold reporting.
- Anticipate regulatory notifications and manage processes through the established compliance team.

#### Implementation Timeline
- **Total Duration**: Estimated 6 months for development.
- **Pilot Phase**: Launch a limited pilot targeted at a small cohort of customers to assess the feature's performance.
- **Full Rollout**: Post-pilot evaluation will inform the broader deployment of the feature.

#### Future Considerations
- Assuming successful implementation and customer adoption, explore expansion to facilitate AU-to-NZ payments in subsequent phases, enhancing cross-border transaction capabilities.

#### Conclusion
The proposed trans-Tasman payment feature represents a strategic opportunity for the enterprise to capture a significant market share, enhance customer loyalty, and streamline international transactions. By leveraging existing relationships and infrastructure, this initiative is poised to deliver a highly competitive solution in the international payments landscape. Further steps will include detailed project planning, stakeholder alignment, and regulatory engagement to ensure successful execution.
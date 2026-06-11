To address your current situation and implement the Experience API, a structured approach is necessary to ensure a smooth transition and compliance with existing standards and regulations. Here’s a suggested action plan that covers key aspects:

1. **Discovery and Requirements Gathering:**
   - Conduct detailed workshops with each of the 11 teams to fully understand their integration requirements, data models, and authentication patterns.
   - Identify commonalities and discrepancies in data requirements and authentication/authorization methods used by each consumer.
   - Define clear requirements for the Experience API, focusing on the features: card account summary, transaction history, spend categories, card controls, and dispute initiation.

2. **API Design:**
   - Develop a unified, stable API specification that includes endpoints for all required features.
   - Emphasize abstraction to shield consumers from changes in the underlying card core system or vendor API changes.
   - Design the API for versioning to allow future enhancements without breaking existing implementations.
   - Plan for scalability and performance, especially regarding transaction history and caching.

3. **Security and Compliance:**
   - Implement least-privilege access control for the Experience API. Define roles and access levels for each API operation based on the principle of least privilege.
   - Ensure that authentication and authorization for the API are robust, using token-based systems like OAuth2.
   - Implement PCI DSS-compliant handling of card data, ensuring that raw PAN data is never cached, and only truncated PAN or tokenized data is used where possible.
   - Implement data sharing consent management compliant with CDR-equivalent regulations, ensuring external partners access only data with explicit customer consent.

4. **Implementation:**
   - Start building the Experience API with a focus on a modular architecture that allows isolated development, testing, and deployment of different components.
   - Establish caching mechanisms for PCI DSS compliant data storage, ensuring adherence to data retention limits.

5. **Migration Strategy:**
   - Develop a phased migration plan that includes testing with a small subset of consumers initially before full rollout.
   - Engage with consumer teams regularly to assist, guide, and track migration progress, ensuring alignment with the timeline.

6. **Vendor Coordination:**
   - Regularly communicate with the card core system vendor to stay informed on the deprecation timeline and any potential changes.
   - Monitor and demonstrate migration progress to potentially leverage the 6-month contractual extension if necessary.

7. **Testing and Validation:**
   - Conduct thorough security and performance testing of the API, including penetration testing, load testing, and user acceptance testing (UAT) by all consumer teams.
   - Address any identified issues promptly and iteratively improve the API based on feedback.

8. **Documentation and Training:**
   - Develop comprehensive documentation for the Experience API, including integration guides, usage examples, and FAQs.
   - Provide training sessions or workshops for consumer teams to ensure smooth adoption and usage of the new API.

9. **Monitoring and Support:**
   - Implement monitoring tools to trace, log, and analyze API requests and performance in real-time.
   - Set up a support framework for consumers to report issues and receive timely assistance.

By following this structured approach, you can manage the migration efficiently, while minimizing disruption for consumer teams and ensuring compliance with all relevant security and data regulations.
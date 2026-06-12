Building a consent management API for your open banking program is a significant undertaking that requires careful planning and execution to ensure compliance, security, and user satisfaction. Below is a structured plan to help you launch the API for your initial cohort within the specified timeline:

### Phase 1: Planning and Design (Weeks 1-4)

1. **Stakeholder Engagement**
   - Set up meetings with key stakeholders, including legal, compliance, IT, and business units.
   - Assemble a cross-functional team to drive the project.

2. **Requirements Gathering**
   - Clearly define the scope of data types (transaction history, account balances, credit summaries, enriched insights).
   - Determine security, compliance, and accreditation requirements.
   - Establish user interface and experience requirements for the member portal.

3. **API Design**
   - Architect the API with RESTful principles; consider GraphQL if dynamic data access is beneficial.
   - Design endpoints for data access, consent management, and accreditation checks.

4. **Consent Granularity and UX Design**
   - Create a mock-up of the consent management interface, ensuring ease of use and clarity.
   - Incorporate user feedback into consent granularity choices (type of data and third parties).

### Phase 2: Development (Weeks 5-12)

1. **Backend Development**
   - Develop the API backend with scalable architecture.
   - Implement data fetching from internal analytics engines and core banking systems.

2. **Security Implementation**
   - Integrate OAuth 2.0 for secure user authentication and data sharing.
   - Use JWT tokens for API call validation.
   - Build accreditation status checks into each API call.

3. **Frontend Development**
   - Develop the member portal section for consent management.
   - Include features for granting, viewing, and revoking consent.

4. **Integration**
   - Integrate with internal systems for data enrichement.
   - Work closely with IT to ensure seamless data flow and security compliance.

### Phase 3: Testing and Accreditation (Weeks 13-18)

1. **Testing**
   - Conduct unit, integration, and system testing of the API.
   - Perform security testing and penetration testing to identify and mitigate vulnerabilities.

2. **Accreditation and Onboarding**
   - Set criteria and process for third-party accreditation in collaboration with the designated authority.
   - Begin the onboarding process for the initial 10 accredited partners.

3. **User Acceptance Testing (UAT)**
   - Run UAT sessions with both internal testers and a select group of customers.
   - Refine the consent management process and interface based on feedback.

### Phase 4: Deployment and Monitoring (Weeks 19-24)

1. **Deployment**
   - Deploy the API within a controlled environment and gradually roll out to the production environment.
   - Offer support and documentation to accredited partners for API integration.

2. **Monitoring and Support**
   - Set up real-time monitoring for API performance and security incidents.
   - Establish a dedicated support line for partners and customers.

3. **Feedback Loop**
   - Gather feedback from partners and customers and incorporate improvements in subsequent iterations.

4. **Launch**
   - Announce and officially launch the API to the initial cohort.
   - Begin planning the broader rollout based on initial usage patterns and feedback.

### Considerations

- **Compliance and Privacy**: Always ensure that mechanisms for data protection and consent compliance are in place and regularly reviewed.
- **Scalability**: Design the API with scalability in mind for potential future expansions.
- **Documentation and Training**: Provide comprehensive documentation for third parties and customer support teams. 

By following this structured approach, you should be able to successfully launch your consent management API within the defined timeline while meeting compliance and user expectations.
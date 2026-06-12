To build the Experience API layer effectively, we need to approach it systematically, taking into account the requirements, constraints, and best practices for security, data integrity, and API design. Below is a high-level plan for the implementation of the Experience API:

### 1. Requirements Analysis

#### Functional Requirements
- **Card Account Summary**: Provide basic information about card accounts.
- **Transaction History**: Retrieve transactions from the past 90 days.
- **Spend Categories**: Categorize spending data.
- **Card Controls**: Allow users to freeze/unfreeze cards and change spending limits.
- **Dispute Initiation**: Enable users to initiate disputes on transactions.

#### Non-Functional Requirements
- **Compliance**: Must comply with PCI DSS, especially regarding the handling and caching of card transaction data.
- **Authentication & Authorization**: Implement least-privilege access control and handle CDR-equivalent data sharing consent for external partners.

### 2. Design Phase

#### API Design
- Define a RESTful or GraphQL API structure depending on client needs.
- Create a versioned API (e.g., v1.0) to handle backward compatibility.
  
**Example API Endpoints:**
- `GET /api/v1/accounts/{accountId}/summary`
- `GET /api/v1/accounts/{accountId}/transactions?dateRange=last90days`
- `GET /api/v1/accounts/{accountId}/spendCategories`
- `POST /api/v1/accounts/{accountId}/controls/freeze`
- `POST /api/v1/accounts/{accountId}/disputes/initiate`

#### Data Security
- **Data Transformation**: Ensure PCI compliance by transforming and caching data correctly (e.g., only storing truncated PAN).
- **Caching Strategy**: Implement caching for frequently accessed data, ensuring storage of only non-sensitive information and adhering to data retention policies.

### 3. Authentication & Authorization Strategy
- Explore OAuth 2.0 or JWT for secure access.
- Define user roles and permissions for internal teams and external partners.
- Implement granular control for API operations based on the principle of least privilege.

### 4. Implementation Plan
1. **Develop API Structure**: Set up the API endpoints based on the defined design.
2. **Middleware for Authentication**: Implement middleware for token validation and consent checks particularly for external partners.
3. **Data Handling**:
   - Set up a secure process for accessing and transforming card core data.
   - Ensure compliance with PCI DSS during data handling and caching.
4. **Testing**: Implement unit tests, integration tests, and security tests.
5. **Documentation**: Create comprehensive API documentation for internal and external developers.

### 5. Migration Strategy
- Create a migration roadmap over the 18 months, defining milestones and deliverables.
- Set up regular check-ins to review progress on the migration to satisfy vendor requirements for potential contract extension.
- Communicate frequently with consumer teams to ensure adoption and to gather feedback.

### 6. Monitoring & Maintenance
- Set up logging and monitoring to track API usage, errors, and performance.
- Have a feedback loop for continuous improvement based on consumer needs and changes from the card core system.

### 7. Stakeholder Engagement
- Keep stakeholders updated throughout the project for alignment and buy-in.
- Conduct training sessions for internal teams and partners to familiarize them with the new API.

### Conclusion
Building the Experience API layer represents a significant opportunity to streamline data access and enhance security. By following a structured approach, the project can align with business goals while ensuring compliance and effective stakeholder management. Regular assessments and adjustments to the plan will be critical to keeping on track with the 18-month timeline.
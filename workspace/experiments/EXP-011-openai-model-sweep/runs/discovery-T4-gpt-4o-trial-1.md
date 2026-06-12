To make the `/discovery` pipeline skill's API faster, you might want to consider a series of optimizations that address different aspects of the pipeline's performance. Here are several strategies you could implement:

1. **Profile and Benchmark**:
   - Use profiling tools to identify bottlenecks in the current pipeline.
   - Benchmark specific parts of the code to see where time is being spent.

2. **Optimize Code**:
   - Review and optimize the algorithmic efficiency of the code. Consider whether more efficient data structures or algorithms could be used.
   - Simplify complex calculations or break them into smaller tasks that can be executed faster.

3. **Parallel Processing and Concurrency**:
   - Implement parallel processing or multi-threading where applicable, to utilize multiple CPU cores effectively.
   - Consider asynchronous programming to avoid blocking operations.

4. **Caching**:
   - Use caching to store results of expensive operations that do not change frequently, reducing the need for recalculating every request.
   - Implement in-memory cache or use distributed cache systems like Redis or Memcached.

5. **Database Optimization**:
   - Optimize database queries, use indexing, and ensure efficient data retrieval.
   - Consider denormalization if it fits your use case and helps reduce the complexity and time of queries.

6. **API Gateway and Load Balancing**:
   - Use an API Gateway to optimize routing and load balancing of incoming requests.
   - Implement rate limiting and throttling to prevent overload.

7. **Code Deployment and Infrastructure**:
   - Ensure the deployment environment is optimized for performance, using appropriate instance types and configurations.
   - Consider containerization and orchestration for scalable deployments.

8. **Compression and Serialization**:
   - Use efficient serialization formats and compress responses to reduce payload size and network latency.

9. **Reduce Network Latency**:
   - Use Content Delivery Networks (CDNs) where applicable.
   - Host your API servers closer to your users to reduce round-trip time.

10. **Monitoring and Reporting**:
    - Implement a monitoring solution to keep track of performance metrics over time and alert on anomalies.

After implementing these strategies, continue to monitor your pipeline to ensure performance remains optimal and scales with growing usage.
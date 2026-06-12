To make an API, such as the one running in your /discovery pipeline, faster, you can consider several strategies. Here's an outline of common approaches to improve API performance:

1. **Optimize Database Queries:**
   - Ensure that database queries are efficient; use indexing appropriately.
   - Avoid N+1 query problems by joining data in a single query.
   - Cache frequent read queries using technologies like Redis or Memcached.

2. **Implement Caching:**
   - Use caching mechanisms to store and quickly serve frequent API responses.
   - Consider different caching levels (e.g., HTTP caching, database caching).

3. **Reduce Payload Size:**
   - Minimize data returned by the API by using filtering and pagination.
   - Use efficient data formats like JSON with compression (e.g., gzip).

4. **Use Asynchronous Processing:**
   - Offload long-running processes to background jobs using task queues (e.g., Celery, RabbitMQ).
   - Utilize asynchronous request handling if supported by your framework.

5. **Optimize Server Configuration:**
   - Improve web server configuration (e.g., increase worker threads/processes).
   - Use load balancers to evenly distribute traffic across servers.

6. **Adopt Rate Limiting and Throttling:**
   - Protect your API from being overwhelmed by limiting requests from individual users or IPs.

7. **Profile and Monitor Performance:**
   - Use profiling tools to identify bottlenecks in your application.
   - Implement monitoring for real-time insight into API performance.

8. **Optimize Code:**
   - Refactor inefficient code paths and implement best coding practices.
   - Employ more efficient algorithms where necessary.

The exact steps that will make your API faster depend on where the bottlenecks currently are, so profiling to determine the root causes of slowness is crucial.
To make an API faster, particularly for a `/discovery` pipeline, there are several optimization strategies you can explore. Here are some suggestions:

1. **Optimize Database Queries:**
   - Ensure that database queries are efficient. Use indexes where appropriate and avoid fetching unnecessary data.
   - Consider using caching mechanisms like Redis to store frequent queries or data that doesn't change often.

2. **Use Asynchronous Processing:**
   - Implement asynchronous programming to handle requests without blocking. This can help manage I/O operations more efficiently.

3. **Load Balancing:**
   - Distribute incoming requests across multiple servers to balance the load and prevent any single server from becoming a bottleneck.

4. **Profile and Monitor Performance:**
   - Use profiling tools to identify performance bottlenecks in your code. Monitor API calls to find slow endpoints and optimize them specifically.

5. **Optimize Network Throughput:**
   - Use data compression techniques to reduce payload sizes, making data transfer over the network quicker.

6. **Improve API Design:**
   - Simplify API endpoints and minimize the number of requests needed to accomplish tasks.
   - Consider implementing pagination, filtering, and field selection to reduce data sizes.

7. **Reduce Latency:**
   - Deploy your servers closer to your end-users or use a CDN (Content Delivery Network) to reduce the physical distance data has to travel.

8. **Code Optimization:**
   - Review your application logic for any inefficient algorithms or unnecessary computations.
   - Use efficient data structures and manage memory usage effectively.

9. **Utilize Multithreading or Multiprocessing:**
   - Utilize multithreading or multiprocessing to handle concurrent operations more efficiently, especially for CPU-bound tasks.

10. **Implement a Rate Limiting Strategy:**
    - Protect your API from being overwhelmed by limiting the number of requests a user can make over a given time period.

By systematically applying these techniques, you can significantly improve the performance of your API and provide a faster response for the `/discovery` pipeline.
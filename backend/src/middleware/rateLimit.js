import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for authentication routes (login and signup).
 * Restricts brute-force attempts on sensitive pathways.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // Increase limits for tests
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Exposes standard headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  legacyHeaders: false, // Disables X-RateLimit-* headers
});

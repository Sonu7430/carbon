import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eco_track_secret_key_2026_safe_and_long';

/**
 * Authentication and CSRF protection middleware.
 * Verifies JWT token stored in HTTP-only cookies.
 * Validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH).
 */
export function authenticate(req, res, next) {
  // 1. JWT Cookie Authentication
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  // 2. CSRF Validation for State-Changing Requests
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (stateChangingMethods.includes(req.method.toUpperCase())) {
    const csrfTokenHeader = req.headers['x-csrf-token'];
    const csrfTokenCookie = req.cookies['_csrf'];

    if (!csrfTokenCookie || !csrfTokenHeader || csrfTokenCookie !== csrfTokenHeader) {
      return res.status(403).json({ error: 'CSRF token validation failed. Request blocked.' });
    }
  }

  next();
}

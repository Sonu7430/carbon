import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eco_track_secret_key_2026_safe_and_long';

// Cookie options for secure JWT and CSRF cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
};

/**
 * Utility helper to generate CSRF token and set it in a cookie.
 */
function setCsrfToken(res) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie('_csrf', token, cookieOptions);
  return token;
}

/**
 * GET /api/auth/csrf
 * Generates and returns a CSRF token for the frontend context.
 */
router.get('/csrf', (req, res) => {
  const csrfToken = setCsrfToken(res);
  return res.json({ csrfToken });
});

/**
 * POST /api/auth/signup
 * Registers a new user, hashes password, generates session and CSRF token.
 */
router.post('/signup', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Server-side validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const db = await getDb();
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email.toLowerCase().trim(), passwordHash]
    );
    const userId = result.lastID;

    // Create default profile
    await db.run(
      'INSERT INTO profiles (user_id, onboarding_completed) VALUES (?, 0)',
      [userId]
    );

    // Generate JWT
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set cookies
    res.cookie('token', token, cookieOptions);
    const csrfToken = setCsrfToken(res);

    return res.status(201).json({
      success: true,
      user: { id: userId, email },
      onboardingCompleted: false,
      csrfToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials, issues JWT and CSRF cookies.
 */
router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const db = await getDb();

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Find onboarding status
    const profile = await db.get('SELECT onboarding_completed FROM profiles WHERE user_id = ?', [user.id]);
    const onboardingCompleted = profile ? !!profile.onboarding_completed : false;

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Set cookies
    res.cookie('token', token, cookieOptions);
    const csrfToken = setCsrfToken(res);

    return res.json({
      success: true,
      user: { id: user.id, email: user.email },
      onboardingCompleted,
      csrfToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

/**
 * POST /api/auth/logout
 * Clears JWT and CSRF credentials.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('_csrf');
  return res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Checks if user session cookie is valid and fetches state.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const profile = await db.get('SELECT onboarding_completed FROM profiles WHERE user_id = ?', [req.user.id]);
    
    // Provide a fresh CSRF token upon session checks
    const csrfToken = setCsrfToken(res);

    return res.json({
      authenticated: true,
      user: req.user,
      onboardingCompleted: profile ? !!profile.onboarding_completed : false,
      csrfToken
    });
  } catch (error) {
    console.error('Session lookup error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

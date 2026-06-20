import request from 'supertest';
import app from '../server.js';
import { resetDb } from '../config/db.js';

describe('EcoTrack API - Integration Tests', () => {
  let authCookie = null;
  let csrfToken = null;
  let csrfCookie = null;

  beforeAll(async () => {
    // Force clean state
    await resetDb();
  });

  afterAll(async () => {
    // Cleanup test state
    await resetDb();
  });

  describe('Authentication Routes', () => {
    test('POST /api/auth/signup - Creates new user and profile', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'testuser@example.com',
          password: 'securePassword123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.onboardingCompleted).toBe(false);
      expect(res.body).toHaveProperty('csrfToken');

      // Extract cookies and CSRF token
      const cookies = res.headers['set-cookie'] || [];
      authCookie = cookies.find(c => c.startsWith('token='));
      csrfCookie = cookies.find(c => c.startsWith('_csrf='));
      csrfToken = res.body.csrfToken;

      expect(authCookie).toBeDefined();
      expect(csrfCookie).toBeDefined();
    });

    test('POST /api/auth/signup - Rejects duplicate emails', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'testuser@example.com',
          password: 'anotherPassword123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    test('POST /api/auth/login - Rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    test('POST /api/auth/login - Signs in and sets session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'securePassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.onboardingCompleted).toBe(false);
      
      const cookies = res.headers['set-cookie'] || [];
      authCookie = cookies.find(c => c.startsWith('token='));
      csrfCookie = cookies.find(c => c.startsWith('_csrf='));
      csrfToken = res.body.csrfToken;
    });
  });

  describe('Profile & Onboarding Routes', () => {
    test('POST /api/profile/onboarding - Rejects requests missing CSRF token', async () => {
      const res = await request(app)
        .post('/api/profile/onboarding')
        .set('Cookie', [authCookie, csrfCookie])
        .send({
          dietType: 'average',
          commuteMode: 'car_gasoline',
          weeklyCommuteKm: 50,
          householdSize: 2,
          homeEnergySource: 'coal_gas'
        });

      // Bypassing CSRF header must trigger a 403 Forbidden
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('CSRF');
    });

    test('POST /api/profile/onboarding - Sets baseline footprint for user', async () => {
      const res = await request(app)
        .post('/api/profile/onboarding')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .send({
          dietType: 'average',
          commuteMode: 'car_gasoline',
          weeklyCommuteKm: 100,
          householdSize: 2,
          homeEnergySource: 'coal_gas'
        });

      // 120 (diet) + 78.21 (100km commute) + 220 (energy) + 22.50 (waste) = 440.71
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.baselineCO2).toBeCloseTo(440.71, 1);
    });

    test('GET /api/profile - Fetches baseline configuration', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Cookie', [authCookie, csrfCookie]);

      expect(res.status).toBe(200);
      expect(res.body.dietType).toBe('average');
      expect(res.body.commuteMode).toBe('car_gasoline');
      expect(res.body.weeklyCommuteKm).toBe(100);
      expect(res.body.householdSize).toBe(2);
      expect(res.body.onboardingCompleted).toBe(true);
      expect(res.body.baselineCo2Monthly).toBeCloseTo(440.71, 1);
    });
  });

  describe('Activity Logger & Dashboard Routes', () => {
    test('POST /api/activities - Logs transport carbon successfully', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .send({
          category: 'transport',
          activityType: 'car_gasoline',
          amount: 50,
          date: new Date().toISOString().split('T')[0],
          notes: 'Drove to work'
        });

      expect(res.status).toBe(201);
      expect(res.body.calculatedCO2).toBe(9.00); // 50 * 0.18
      expect(res.body.formulaDetails).toContain('50 km × 0.18 kg CO2e/km = 9 kg CO2e');
    });

    test('POST /api/activities - Logs food carbon successfully', async () => {
      const res = await request(app)
        .post('/api/activities')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .send({
          category: 'food',
          activityType: 'beef_lamb',
          amount: 2,
          date: new Date().toISOString().split('T')[0],
          notes: 'Had beef burgers'
        });

      expect(res.status).toBe(201);
      expect(res.body.calculatedCO2).toBe(9.00); // 2 * 4.5
      expect(res.body.formulaDetails).toContain('2 serving × 4.5 kg CO2e/serving = 9 kg CO2e');
    });

    test('GET /api/activities - Fetches paginated activity logs', async () => {
      const res = await request(app)
        .get('/api/activities?page=1&limit=5')
        .set('Cookie', [authCookie, csrfCookie]);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.totalPages).toBe(1);
    });

    test('GET /api/dashboard - Aggregates data and details progress', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Cookie', [authCookie, csrfCookie]);

      expect(res.status).toBe(200);
      expect(res.body.baselineCO2).toBeCloseTo(440.71, 1);
      expect(res.body.categoryTotals.transport).toBe(9.00);
      expect(res.body.categoryTotals.food).toBe(9.00);
      expect(res.body.totalCO2CurrentMonth).toBe(18.00);
      expect(res.body.carbonSavedThisMonth).toBeCloseTo(422.71, 1);
      expect(res.body.trendData).toBeDefined();
    });
  });
});

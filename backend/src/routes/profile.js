import express from 'express';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { calculateBaselineCO2 } from '../utils/calculations.js';

const router = express.Router();

/**
 * POST /api/profile/onboarding
 * Receives baseline survey answers, computes the user's estimated monthly carbon footprint,
 * and saves it to their profile.
 */
router.post('/onboarding', authenticate, async (req, res) => {
  const { dietType, commuteMode, weeklyCommuteKm, householdSize, homeEnergySource } = req.body;

  // Basic checks
  if (!dietType || !commuteMode || weeklyCommuteKm === undefined || !householdSize || !homeEnergySource) {
    return res.status(400).json({ error: 'All onboarding survey fields are required' });
  }

  try {
    // Perform baseline footprint calculations
    const { total, breakdown, formula } = calculateBaselineCO2({
      dietType,
      commuteMode,
      weeklyCommuteKm,
      householdSize,
      homeEnergySource
    });

    const db = await getDb();

    // Update profile
    await db.run(
      `UPDATE profiles 
       SET onboarding_completed = 1,
           diet_type = ?,
           commute_mode = ?,
           weekly_commute_km = ?,
           household_size = ?,
           home_energy_source = ?,
           baseline_co2_monthly = ?
       WHERE user_id = ?`,
      [
        dietType,
        commuteMode,
        Number(weeklyCommuteKm),
        Number(householdSize),
        homeEnergySource,
        total,
        req.user.id
      ]
    );

    return res.json({
      success: true,
      baselineCO2: total,
      breakdown,
      formula
    });
  } catch (error) {
    console.error('Onboarding submission error:', error);
    return res.status(400).json({ error: error.message || 'Failed to submit onboarding quiz' });
  }
});

/**
 * GET /api/profile
 * Retrieves profile and baseline settings for the current user.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const profile = await db.get(
      `SELECT diet_type as dietType, 
              commute_mode as commuteMode, 
              weekly_commute_km as weeklyCommuteKm, 
              household_size as householdSize, 
              home_energy_source as homeEnergySource, 
              baseline_co2_monthly as baselineCo2Monthly,
              onboarding_completed as onboardingCompleted 
       FROM profiles 
       WHERE user_id = ?`,
      [req.user.id]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      ...profile,
      onboardingCompleted: !!profile.onboardingCompleted
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

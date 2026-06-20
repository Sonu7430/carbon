import express from 'express';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/goals/active
 * Returns the current user's active target goal, current month's performance, and activity streak.
 */
router.get('/active', authenticate, async (req, res) => {
  try {
    const db = await getDb();

    // 1. Fetch active goal
    const goal = await db.get(
      `SELECT target_reduction_pct as targetReductionPct, 
              target_co2_monthly as targetCo2Monthly, 
              start_date as startDate, 
              end_date as endDate 
       FROM goals 
       WHERE user_id = ? AND active = 1 
       LIMIT 1`,
      [req.user.id]
    );

    // 2. Fetch current month total emissions (re-calculated to verify performance against goal)
    const monthTotalRow = await db.get(
      `SELECT SUM(calculated_co2) as total 
       FROM activities 
       WHERE user_id = ? AND log_date >= date('now', 'start of month') AND log_date <= date('now')`,
      [req.user.id]
    );
    const monthlyEmissions = monthTotalRow ? (monthTotalRow.total || 0) : 0;

    // 3. Calculate logging streak (consecutive days logging at least one activity)
    const distinctDates = await db.all(
      `SELECT DISTINCT log_date as logDate 
       FROM activities 
       WHERE user_id = ? 
       ORDER BY log_date DESC`,
      [req.user.id]
    );

    let streakDays = 0;
    if (distinctDates.length > 0) {
      const dates = distinctDates.map(row => row.logDate);
      
      const todayStr = new Date().toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Streak is active if user logged today or yesterday
      let hasToday = dates.includes(todayStr);
      let hasYesterday = dates.includes(yesterdayStr);

      if (hasToday || hasYesterday) {
        let currentCheckDate = hasToday ? new Date() : yesterday;
        
        while (true) {
          const checkStr = currentCheckDate.toISOString().split('T')[0];
          if (dates.includes(checkStr)) {
            streakDays++;
            // Move back 1 day
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return res.json({
      activeGoal: goal || null,
      currentMonthEmissions: Number(monthlyEmissions.toFixed(2)),
      streakDays
    });
  } catch (error) {
    console.error('Fetch active goal error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

/**
 * POST /api/goals
 * Saves or updates a user's active reduction target.
 * Deactivates any previous goals.
 */
router.post('/', authenticate, async (req, res) => {
  const { targetReductionPct } = req.body;

  const reduction = Number(targetReductionPct);
  if (isNaN(reduction) || reduction < 0 || reduction > 100) {
    return res.status(400).json({ error: 'Target reduction percentage must be a number between 0 and 100' });
  }

  try {
    const db = await getDb();

    // Get user baseline
    const profile = await db.get(
      'SELECT baseline_co2_monthly FROM profiles WHERE user_id = ?',
      [req.user.id]
    );
    const baseline = profile ? (profile.baseline_co2_monthly || 0) : 0;

    // Calculate target
    const targetCo2Monthly = Number((baseline * (1 - reduction / 100)).toFixed(2));

    // Deactivate previous active goals
    await db.run(
      'UPDATE goals SET active = 0 WHERE user_id = ?',
      [req.user.id]
    );

    // Insert new goal
    const result = await db.run(
      `INSERT INTO goals (user_id, target_reduction_pct, target_co2_monthly, start_date, end_date, active) 
       VALUES (?, ?, ?, date('now'), date('now', '+30 days'), 1)`,
      [req.user.id, reduction, targetCo2Monthly]
    );

    const newGoal = {
      id: result.lastID,
      targetReductionPct: reduction,
      targetCo2Monthly,
      startDate: new Date().toISOString().split('T')[0],
      active: true
    };

    return res.status(201).json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

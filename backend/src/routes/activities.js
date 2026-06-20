import express from 'express';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { calculateActivityCO2 } from '../utils/calculations.js';

const router = express.Router();

/**
 * POST /api/activities
 * Creates a new logged activity, calculating the carbon emission using emissionFactors.
 */
router.post('/', authenticate, async (req, res) => {
  const { category, activityType, amount, date, notes } = req.body;

  // Server-side validation
  if (!category || !activityType || amount === undefined || !date) {
    return res.status(400).json({ error: 'Category, activityType, amount, and date are required' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ error: 'Amount must be a non-negative number' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
  }

  try {
    // Perform CO2 calculations
    const { co2e, formula } = calculateActivityCO2(category, activityType, parsedAmount);

    // Map units for DB
    let unit = 'units';
    if (category === 'transport') unit = 'km';
    else if (category === 'food') unit = 'servings';
    else if (category === 'energy') {
      unit = (activityType === 'electricity' || activityType === 'natural_gas') ? 'kWh' : 'L';
    } else if (category === 'shopping_waste') {
      unit = activityType === 'waste' ? 'kg' : 'items';
    }

    const db = await getDb();
    
    // Insert into SQLite database (parameterized to prevent SQL injection)
    const result = await db.run(
      `INSERT INTO activities 
       (user_id, category, activity_type, amount, unit, calculated_co2, log_date, notes, formula_details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category, activityType, parsedAmount, unit, co2e, date, notes || null, formula]
    );

    const newActivity = {
      id: result.lastID,
      userId: req.user.id,
      category,
      activityType,
      amount: parsedAmount,
      unit,
      calculatedCO2: co2e,
      logDate: date,
      notes: notes || null,
      formulaDetails: formula
    };

    return res.status(201).json(newActivity);
  } catch (error) {
    console.error('Create activity error:', error);
    return res.status(400).json({ error: error.message || 'Failed to log activity' });
  }
});

/**
 * GET /api/activities
 * Fetches a list of activity logs for the authenticated user, paginated.
 */
router.get('/', authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10)); // Caps page size at 100
  const offset = (page - 1) * limit;

  try {
    const db = await getDb();
    
    // Get total count for pagination metadata
    const countRow = await db.get(
      'SELECT COUNT(*) as count FROM activities WHERE user_id = ?',
      [req.user.id]
    );
    const totalCount = countRow ? countRow.count : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated entries
    const activities = await db.all(
      `SELECT id, category, activity_type as activityType, amount, unit, 
              calculated_co2 as calculatedCO2, log_date as logDate, notes, 
              formula_details as formulaDetails 
       FROM activities 
       WHERE user_id = ? 
       ORDER BY log_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    return res.json({
      activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Fetch activities error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

/**
 * DELETE /api/activities/:id
 * Deletes a specific log entry if it belongs to the authenticated user.
 */
router.delete('/:id', authenticate, async (req, res) => {
  const activityId = req.params.id;

  try {
    const db = await getDb();
    
    // Verify activity ownership before deleting
    const activity = await db.get(
      'SELECT id FROM activities WHERE id = ? AND user_id = ?',
      [activityId, req.user.id]
    );

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }

    await db.run('DELETE FROM activities WHERE id = ?', [activityId]);

    return res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

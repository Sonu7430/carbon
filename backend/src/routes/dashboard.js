import express from 'express';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { REGIONAL_AVERAGES } from '../config/emissionFactors.js';

const router = express.Router();

/**
 * GET /api/dashboard
 * Aggregates carbon emissions metrics for the current user:
 * - Current month category totals
 * - Comparison against personal baseline and regional averages
 * - 30-day trend timeline
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();

    // 1. Fetch user's baseline
    const profile = await db.get(
      'SELECT baseline_co2_monthly FROM profiles WHERE user_id = ?',
      [req.user.id]
    );
    const baselineCO2 = profile ? (profile.baseline_co2_monthly || 0) : 0;

    // 2. Fetch current calendar month totals by category
    const categoryRows = await db.all(
      `SELECT category, SUM(calculated_co2) as total 
       FROM activities 
       WHERE user_id = ? AND log_date >= date('now', 'start of month') AND log_date <= date('now')
       GROUP BY category`,
      [req.user.id]
    );

    // Initialize all categories with 0.0 to guarantee a complete structure on the client
    const categoryTotals = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping_waste: 0
    };

    let totalCO2CurrentMonth = 0;
    categoryRows.forEach(row => {
      if (categoryTotals[row.category] !== undefined) {
        const value = Number(row.total.toFixed(2));
        categoryTotals[row.category] = value;
        totalCO2CurrentMonth += value;
      }
    });
    totalCO2CurrentMonth = Number(totalCO2CurrentMonth.toFixed(2));

    // 3. Fetch 30-day trends for the chart
    const trendRows = await db.all(
      `SELECT log_date as date, SUM(calculated_co2) as total 
       FROM activities 
       WHERE user_id = ? AND log_date >= date('now', '-29 days') AND log_date <= date('now')
       GROUP BY log_date 
       ORDER BY log_date ASC`,
      [req.user.id]
    );

    // Pre-populate last 30 days with 0 to ensure charts don't have gaps
    const trendsMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendsMap.set(dateStr, 0);
    }

    // Merge actual data
    trendRows.forEach(row => {
      trendsMap.set(row.date, Number(row.total.toFixed(2)));
    });

    const trendData = Array.from(trendsMap.entries()).map(([date, total]) => ({
      date,
      total
    }));

    // 4. Calculate savings
    const carbonSavedThisMonth = Math.max(0, Number((baselineCO2 - totalCO2CurrentMonth).toFixed(2)));

    return res.json({
      baselineCO2,
      categoryTotals,
      totalCO2CurrentMonth,
      carbonSavedThisMonth,
      regionalAverages: REGIONAL_AVERAGES,
      trendData
    });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

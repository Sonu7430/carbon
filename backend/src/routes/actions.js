import express from 'express';
import { ACTION_LIBRARY } from '../config/actionLibrary.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/actions
 * Searchable list of CO2-reducing actions.
 * Query Parameters:
 * - q: text search in title and description
 * - category: filter by 'transport', 'food', 'energy', 'shopping_waste'
 */
router.get('/', authenticate, (req, res) => {
  const { q, category } = req.query;
  
  let actions = [...ACTION_LIBRARY];

  // Filter by category
  if (category) {
    actions = actions.filter(action => action.category === category);
  }

  // Filter by text search
  if (q) {
    const searchStr = q.toLowerCase().trim();
    actions = actions.filter(
      action => 
        action.title.toLowerCase().includes(searchStr) || 
        action.description.toLowerCase().includes(searchStr)
    );
  }

  return res.json({ actions });
});

export default router;

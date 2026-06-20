import express from 'express';
import { getDb } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/insights
 * Generates rule-based, personalized recommendations ranked by potential impact vs effort.
 * Tailors savings messages and priorities based on the user's actual category logging.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDb();

    // 1. Fetch user profile for onboarding baseline
    const profile = await db.get(
      'SELECT diet_type, commute_mode, weekly_commute_km, home_energy_source FROM profiles WHERE user_id = ?',
      [req.user.id]
    );

    // 2. Fetch current month emissions by category to weigh recommendation categories
    const categoryRows = await db.all(
      `SELECT category, SUM(calculated_co2) as total 
       FROM activities 
       WHERE user_id = ? AND log_date >= date('now', 'start of month')
       GROUP BY category`,
      [req.user.id]
    );

    const emissions = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping_waste: 0
    };

    let grandTotal = 0;
    categoryRows.forEach(row => {
      if (emissions[row.category] !== undefined) {
        emissions[row.category] = row.total;
        grandTotal += row.total;
      }
    });

    // 3. Define raw recommendation rules
    const recommendations = [];

    // --- RULE 1: TRANSPORTATION RECOMMENDATION ---
    const weeklyCommute = profile ? (profile.weekly_commute_km || 0) : 0;
    const commuteMode = profile ? profile.commute_mode : 'active';
    
    let transportSavings = 15.6; // fallback monthly savings
    let transportText = "Swap short vehicle trips with walking or biking to cut down on transportation carbon.";
    
    if (commuteMode === 'car_gasoline' && weeklyCommute > 0) {
      // Swapping 2 days of commute (approx 40% of weekly commute)
      const weeklySavedKm = weeklyCommute * 0.40;
      const monthlySavedCO2 = Number((weeklySavedKm * 4.345 * 0.18).toFixed(1));
      transportSavings = Math.max(5.0, monthlySavedCO2);
      transportText = `By swapping 2 days of driving (approx. ${weeklySavedKm.toFixed(0)} km/week) with biking, walking, or public transit, you'd cut ~${transportSavings} kg CO2e/month.`;
    }

    recommendations.push({
      id: 'insight_transport',
      title: 'Swap Commutes for Active Transit',
      description: transportText,
      category: 'transport',
      estimatedMonthlySavings: transportSavings,
      effort: 'Medium',
      effortScore: 2,
      impact: 'High',
      impactScore: 3,
      tip: 'Start small: pick one day a week to commute actively and scale up as you get comfortable.'
    });

    // --- RULE 2: DIETARY RECOMMENDATION ---
    const dietType = profile ? profile.diet_type : 'average';
    let dietSavings = 17.6;
    let dietText = "Replace animal-based meals with plant-based alternatives to lower diet emissions.";

    if (dietType === 'meat_heavy' || dietType === 'average') {
      // Swapping 3 high-meat servings per week with grains/pulses
      // Saving = 3 servings * (4.5 [beef] - 0.12 [plant]) * 4.345 weeks = ~57 kg CO2e/month max
      // Let's use a conservative 25 kg CO2e savings for swapping beef servings
      dietSavings = dietType === 'meat_heavy' ? 35.0 : 18.0;
      dietText = `Skipping beef or lamb for just 3 servings a week and eating grains, pulses, or vegetables instead saves ~${dietSavings} kg CO2e/month.`;
    }

    recommendations.push({
      id: 'insight_food',
      title: 'Reduce Ruminant Meat Servings',
      description: dietText,
      category: 'food',
      estimatedMonthlySavings: dietSavings,
      effort: 'Low',
      effortScore: 1,
      impact: 'High',
      impactScore: 3,
      tip: 'Beef and lamb emissions are up to 30x higher than plant-based options due to ruminant methane and feed intensity.'
    });

    // --- RULE 3: UTILITY ENERGY RECOMMENDATION ---
    const energySource = profile ? profile.home_energy_source : 'coal_gas';
    let energySavings = 18.0;
    let energyText = "Optimize your domestic laundry temperature and drying method.";

    if (energySource === 'coal_gas') {
      energyText = "Washing laundry in cold water and air-drying half your laundry loads instead of using an electric dryer saves ~28.0 kg CO2e/month.";
      energySavings = 28.0;
    }

    recommendations.push({
      id: 'insight_energy',
      title: 'Wash Cold & Air-Dry Laundry',
      description: energyText,
      category: 'energy',
      estimatedMonthlySavings: energySavings,
      effort: 'Low',
      effortScore: 1,
      impact: 'Medium',
      impactScore: 2,
      tip: 'Heating water accounts for 90% of a washing machine\'s electricity draw. Air-drying prevents fossil-fuel electricity consumption.'
    });

    // --- RULE 4: WASTE/SHOPPING RECOMMENDATION ---
    // Divert waste to compost, buy second hand clothing
    recommendations.push({
      id: 'insight_shopping_waste',
      title: 'Choose Second-Hand Clothing',
      description: "Buy pre-owned clothing instead of brand-new fast fashion garments. Saving 2 clothing purchases per month cuts ~24.0 kg CO2e.",
      category: 'shopping_waste',
      estimatedMonthlySavings: 24.0,
      effort: 'Low',
      effortScore: 1,
      impact: 'Medium',
      impactScore: 2,
      tip: 'Extending the life of a garment by just 9 months reduces its carbon, waste, and water footprints by 20-30%.'
    });

    // 4. Calculate Priority Scores dynamically
    // Priority Score = (Impact / Effort) * (1 + Category Month Emissions / Grand Total Month Emissions)
    // If grandTotal is 0, category weight defaults to 1.
    const scoredRecommendations = recommendations.map(rec => {
      const categoryEmissions = emissions[rec.category] || 0;
      const categoryWeight = grandTotal > 0 ? 1 + (categoryEmissions / grandTotal) : 1;
      
      const scoreRatio = rec.impactScore / rec.effortScore;
      const priorityScore = Number((scoreRatio * categoryWeight).toFixed(2));

      return {
        ...rec,
        priorityScore,
        categoryEmissions: Number(categoryEmissions.toFixed(2))
      };
    });

    // 5. Rank by Priority Score descending
    scoredRecommendations.sort((a, b) => b.priorityScore - a.priorityScore);

    return res.json({ recommendations: scoredRecommendations });
  } catch (error) {
    console.error('Fetch insights error:', error);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

export default router;

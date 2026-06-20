import { EMISSION_FACTORS } from '../config/emissionFactors.js';

/**
 * Calculates CO2e emissions for a logged activity.
 * 
 * @param {string} category - 'transport', 'food', 'energy', or 'shopping_waste'
 * @param {string} type - The specific sub-type (e.g., 'car_gasoline', 'beef_lamb')
 * @param {number} amount - The logged amount (distance, servings, kWh, items, kg)
 * @returns {Object} - { co2e: number, formula: string }
 */
export function calculateActivityCO2(category, type, amount) {
  if (amount === undefined || amount === null) {
    throw new Error('Amount is required');
  }
  
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount)) {
    throw new Error('Amount must be a valid number');
  }

  // Edge case: zero or negative input
  if (parsedAmount < 0) {
    throw new Error('Amount cannot be negative');
  }

  if (parsedAmount === 0) {
    return { co2e: 0, formula: '0 × factor = 0 kg CO2e' };
  }

  // Map category to sub-object in EMISSION_FACTORS
  let factorGroup;
  let unit = '';
  switch (category) {
    case 'transport':
      factorGroup = EMISSION_FACTORS.transport;
      unit = 'km';
      break;
    case 'food':
      factorGroup = EMISSION_FACTORS.food_servings;
      unit = 'serving';
      break;
    case 'energy':
      factorGroup = EMISSION_FACTORS.energy;
      if (type === 'electricity' || type === 'natural_gas') {
        unit = 'kWh';
      } else if (type === 'heating_oil') {
        unit = 'L';
      } else {
        unit = 'unit';
      }
      break;
    case 'shopping_waste':
      factorGroup = EMISSION_FACTORS.shopping_waste;
      if (type === 'waste') {
        unit = 'kg';
      } else {
        unit = 'item';
      }
      break;
    default:
      throw new Error(`Invalid category: ${category}`);
  }

  const factor = factorGroup[type];
  if (factor === undefined) {
    throw new Error(`Invalid activity type: ${type} for category ${category}`);
  }

  const co2e = Number((parsedAmount * factor).toFixed(2));
  const formula = `${parsedAmount} ${unit} × ${factor} kg CO2e/${unit} = ${co2e} kg CO2e`;

  return { co2e, formula };
}

/**
 * Calculates a baseline monthly carbon footprint (kg CO2e) during onboarding.
 * 
 * @param {Object} baselineData - User onboarding responses
 * @param {string} baselineData.dietType - 'meat_heavy', 'average', 'vegetarian', 'vegan'
 * @param {string} baselineData.commuteMode - 'car_gasoline', 'car_electric', 'public_transit', 'active', 'none'
 * @param {number} baselineData.weeklyCommuteKm - Commute distance per week in km
 * @param {number} baselineData.householdSize - Total members in user's household
 * @param {string} baselineData.homeEnergySource - 'coal_gas', 'green', 'none'
 * @returns {Object} - { total: number, breakdown: Object, formula: string }
 */
export function calculateBaselineCO2({
  dietType,
  commuteMode,
  weeklyCommuteKm,
  householdSize,
  homeEnergySource
}) {
  // Input validations
  if (!dietType || EMISSION_FACTORS.diet[dietType] === undefined) {
    throw new Error(`Invalid diet type: ${dietType}`);
  }
  if (!commuteMode || EMISSION_FACTORS.transport[commuteMode] === undefined) {
    throw new Error(`Invalid commute mode: ${commuteMode}`);
  }
  
  const parsedCommuteKm = Number(weeklyCommuteKm);
  if (isNaN(parsedCommuteKm) || parsedCommuteKm < 0) {
    throw new Error('Weekly commute distance must be a positive number');
  }

  const parsedHouseholdSize = Number(householdSize);
  if (isNaN(parsedHouseholdSize) || parsedHouseholdSize <= 0) {
    throw new Error('Household size must be at least 1');
  }

  // 1. Food footprint (monthly)
  const foodCO2 = EMISSION_FACTORS.diet[dietType];

  // 2. Transport footprint (monthly)
  // Multiply weekly km by 4.345 to convert to monthly km
  const monthlyCommuteKm = parsedCommuteKm * 4.345;
  const transportFactor = EMISSION_FACTORS.transport[commuteMode];
  const transportCO2 = Number((monthlyCommuteKm * transportFactor).toFixed(2));

  // 3. Home Energy footprint (monthly)
  // Shared energy is divided by household size
  let householdEnergyCO2 = 0;
  if (homeEnergySource === 'coal_gas') {
    // 800 kWh electricity + 600 kWh gas
    householdEnergyCO2 = (800 * EMISSION_FACTORS.energy.electricity) + (600 * EMISSION_FACTORS.energy.natural_gas);
  } else if (homeEnergySource === 'green') {
    // 800 kWh green electricity (very low factor) + 150 kWh gas
    householdEnergyCO2 = (800 * 0.05) + (150 * EMISSION_FACTORS.energy.natural_gas);
  } else {
    // low/minimal energy
    householdEnergyCO2 = 100 * EMISSION_FACTORS.energy.electricity;
  }
  const energyCO2 = Number((householdEnergyCO2 / parsedHouseholdSize).toFixed(2));

  // 4. Waste footprint (monthly)
  // Average per capita waste is ~45kg/month. Sourced from EPA average estimates.
  const personalWasteKg = 45;
  const wasteCO2 = Number((personalWasteKg * EMISSION_FACTORS.shopping_waste.waste).toFixed(2));

  // Total
  const total = Number((foodCO2 + transportCO2 + energyCO2 + wasteCO2).toFixed(2));

  const breakdown = {
    food: foodCO2,
    transport: transportCO2,
    energy: energyCO2,
    waste: wasteCO2
  };

  const formula = `Baseline Calculation:
- Food (${dietType}): ${foodCO2} kg CO2e/month
- Transport (${commuteMode}): ${parsedCommuteKm} km/week × 4.345 weeks × ${transportFactor} kg/km = ${transportCO2} kg CO2e/month
- Energy (${homeEnergySource}): ${householdEnergyCO2} kg CO2e household energy / ${parsedHouseholdSize} members = ${energyCO2} kg CO2e/month
- Waste (Landfill): ${personalWasteKg} kg waste/month × ${EMISSION_FACTORS.shopping_waste.waste} kg/kg = ${wasteCO2} kg CO2e/month
Total Baseline = ${total} kg CO2e/month`;

  return { total, breakdown, formula };
}

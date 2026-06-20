import { calculateActivityCO2, calculateBaselineCO2 } from './calculations.js';

describe('Carbon Emission Calculations - Unit Tests', () => {
  
  describe('calculateActivityCO2', () => {
    
    // 1. Success Cases
    test('calculates transport emissions correctly (gasoline car)', () => {
      const { co2e, formula } = calculateActivityCO2('transport', 'car_gasoline', 50);
      expect(co2e).toBe(9.00); // 50 * 0.18 = 9
      expect(formula).toBe('50 km × 0.18 kg CO2e/km = 9 kg CO2e');
    });

    test('calculates food emissions correctly (beef/lamb servings)', () => {
      const { co2e, formula } = calculateActivityCO2('food', 'beef_lamb', 3);
      expect(co2e).toBe(13.50); // 3 * 4.5 = 13.5
      expect(formula).toBe('3 serving × 4.5 kg CO2e/serving = 13.5 kg CO2e');
    });

    test('calculates energy emissions correctly (electricity)', () => {
      const { co2e, formula } = calculateActivityCO2('energy', 'electricity', 100);
      expect(co2e).toBe(40.00); // 100 * 0.4 = 40
      expect(formula).toBe('100 kWh × 0.4 kg CO2e/kWh = 40 kg CO2e');
    });

    test('calculates shopping emissions correctly (clothing items)', () => {
      const { co2e, formula } = calculateActivityCO2('shopping_waste', 'clothing', 2);
      expect(co2e).toBe(24.00); // 2 * 12 = 24
      expect(formula).toBe('2 item × 12 kg CO2e/item = 24 kg CO2e');
    });

    // 2. Edge Cases (Zero/Negative/Missing/Invalid Types)
    test('returns 0 when amount is 0', () => {
      const { co2e } = calculateActivityCO2('transport', 'car_gasoline', 0);
      expect(co2e).toBe(0);
    });

    test('throws an error when amount is negative', () => {
      expect(() => {
        calculateActivityCO2('transport', 'car_gasoline', -10);
      }).toThrow('Amount cannot be negative');
    });

    test('throws an error when amount is not a number', () => {
      expect(() => {
        calculateActivityCO2('transport', 'car_gasoline', 'not-a-number');
      }).toThrow('Amount must be a valid number');
    });

    test('throws an error when amount is missing', () => {
      expect(() => {
        calculateActivityCO2('transport', 'car_gasoline', null);
      }).toThrow('Amount is required');
    });

    test('throws an error for invalid category', () => {
      expect(() => {
        calculateActivityCO2('invalid_category', 'car_gasoline', 50);
      }).toThrow('Invalid category: invalid_category');
    });

    test('throws an error for invalid activity type within category', () => {
      expect(() => {
        calculateActivityCO2('transport', 'invalid_type', 50);
      }).toThrow('Invalid activity type: invalid_type for category transport');
    });
  });

  describe('calculateBaselineCO2', () => {
    
    // 1. Success Cases
    test('calculates a typical baseline carbon footprint correctly', () => {
      const baselineData = {
        dietType: 'average', // 120 kg
        commuteMode: 'car_gasoline', // 0.18 kg/km
        weeklyCommuteKm: 50, // 50 * 4.345 * 0.18 = 39.105 -> 39.11 kg
        householdSize: 2, // energy shared: (800*0.4 + 600*0.2)/2 = (320+120)/2 = 220 kg
        homeEnergySource: 'coal_gas'
      };
      
      // Personal Waste: 45 * 0.50 = 22.50 kg
      // Expected total: 120 + 39.10 + 220 + 22.50 = 401.60
      
      const { total, breakdown } = calculateBaselineCO2(baselineData);
      expect(total).toBe(401.60);
      expect(breakdown.food).toBe(120);
      expect(breakdown.transport).toBe(39.10);
      expect(breakdown.energy).toBe(220);
      expect(breakdown.waste).toBe(22.50);
    });

    test('scales energy footprint by household size', () => {
      const baselineData1 = {
        dietType: 'vegan', // 50
        commuteMode: 'active', // 0
        weeklyCommuteKm: 0, // 0
        householdSize: 1, // (800*0.4 + 600*0.2)/1 = 440
        homeEnergySource: 'coal_gas'
      };
      // Waste: 22.5
      // Total: 50 + 0 + 440 + 22.5 = 512.50

      const baselineData4 = {
        ...baselineData1,
        householdSize: 4 // (800*0.4 + 600*0.2)/4 = 110
      };
      // Total: 50 + 0 + 110 + 22.5 = 182.50

      const res1 = calculateBaselineCO2(baselineData1);
      const res4 = calculateBaselineCO2(baselineData4);

      expect(res1.total).toBe(512.50);
      expect(res4.total).toBe(182.50);
    });

    // 2. Failure/Edge Cases
    test('throws error for invalid diet type', () => {
      expect(() => {
        calculateBaselineCO2({
          dietType: 'invalid_diet',
          commuteMode: 'active',
          weeklyCommuteKm: 0,
          householdSize: 1,
          homeEnergySource: 'none'
        });
      }).toThrow('Invalid diet type: invalid_diet');
    });

    test('throws error for invalid commute mode', () => {
      expect(() => {
        calculateBaselineCO2({
          dietType: 'vegan',
          commuteMode: 'invalid_commute',
          weeklyCommuteKm: 0,
          householdSize: 1,
          homeEnergySource: 'none'
        });
      }).toThrow('Invalid commute mode: invalid_commute');
    });

    test('throws error for negative commute distance', () => {
      expect(() => {
        calculateBaselineCO2({
          dietType: 'vegan',
          commuteMode: 'active',
          weeklyCommuteKm: -50,
          householdSize: 1,
          homeEnergySource: 'none'
        });
      }).toThrow('Weekly commute distance must be a positive number');
    });

    test('throws error for invalid household size', () => {
      expect(() => {
        calculateBaselineCO2({
          dietType: 'vegan',
          commuteMode: 'active',
          weeklyCommuteKm: 0,
          householdSize: 0,
          homeEnergySource: 'none'
        });
      }).toThrow('Household size must be at least 1');
    });
  });
});

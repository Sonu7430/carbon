/**
 * Action Library - Lifestyle Carbon Reduction Actions
 * Est. savings in kg CO2e per unit of time or action.
 */
export const ACTION_LIBRARY = [
  {
    id: 'commute_bike',
    title: 'Commute by Bike or Walk',
    description: 'Swap 10 km of weekly driving with walking or biking.',
    category: 'transport',
    savingsVal: 1.8, // 1.8 kg CO2e saved per km swapped from car
    savingsUnit: 'per km swapped',
    estimatedMonthlySavings: 31.3, // assuming 17.4 km swapped/week on avg
    effort: 'Medium',
    effortScore: 2,
    impact: 'High',
    impactScore: 3,
    tip: 'Start with 1-2 days a week and build a habit. Keep a change of clothes at your workplace.'
  },
  {
    id: 'meatless_mondays',
    title: 'Meatless Mondays',
    description: 'Replace animal products with plant-based alternatives one day a week.',
    category: 'food',
    estimatedMonthlySavings: 17.6, // based on swapping ~4 beef/poultry meals with vegetarian options
    savingsVal: 4.4,
    savingsUnit: 'per day',
    effort: 'Low',
    effortScore: 1,
    impact: 'Medium',
    impactScore: 2,
    tip: 'Explore rich protein grains like lentils, chickpeas, and beans to make meals filling.'
  },
  {
    id: 'install_led_bulbs',
    title: 'Install LED Lightbulbs',
    description: 'Replace traditional incandescent light bulbs with ENERGY STAR certified LEDs.',
    category: 'energy',
    estimatedMonthlySavings: 10.0,
    savingsVal: 10.0,
    savingsUnit: 'per month',
    effort: 'Low',
    effortScore: 1,
    impact: 'Low',
    impactScore: 1,
    tip: 'LEDs use 75% less energy and last 25 times longer than incandescent lighting.'
  },
  {
    id: 'line_dry_clothes',
    title: 'Line Dry Laundry',
    description: 'Air-dry your laundry on a drying rack or clothesline instead of using an electric dryer.',
    category: 'energy',
    estimatedMonthlySavings: 20.0,
    savingsVal: 2.5, // per load
    savingsUnit: 'per load',
    effort: 'Medium',
    effortScore: 2,
    impact: 'Medium',
    impactScore: 2,
    tip: 'Hang clothes outside on sunny days for a fresh outdoor smell, or use a foldable indoor drying rack.'
  },
  {
    id: 'buy_second_hand',
    title: 'Purchase Pre-owned Items',
    description: 'Buy second-hand clothing, furniture, or books instead of brand-new products.',
    category: 'shopping_waste',
    estimatedMonthlySavings: 24.0, // assuming 2 clothing items saved per month
    savingsVal: 12.0,
    savingsUnit: 'per item',
    effort: 'Low',
    effortScore: 1,
    impact: 'Medium',
    impactScore: 2,
    tip: 'Thrift stores and online marketplaces are great for finding quality garments and reducing manufacturing waste.'
  },
  {
    id: 'cold_water_laundry',
    title: 'Wash Laundry in Cold Water',
    description: 'Wash clothes using cold cycles (30°C or lower) instead of hot.',
    category: 'energy',
    estimatedMonthlySavings: 8.0,
    savingsVal: 1.0, // per load
    savingsUnit: 'per load',
    effort: 'Low',
    effortScore: 1,
    impact: 'Low',
    impactScore: 1,
    tip: 'About 75-90% of the energy used by a washing machine goes toward heating the water.'
  },
  {
    id: 'compost_ scraps',
    title: 'Compost Kitchen Scraps',
    description: 'Divert food scraps (fruit peels, coffee grounds, vegetables) from landfills to compost bins.',
    category: 'shopping_waste',
    estimatedMonthlySavings: 12.5, // based on diverting 25 kg of food waste/month
    savingsVal: 0.5,
    savingsUnit: 'per kg',
    effort: 'Medium',
    effortScore: 2,
    impact: 'Medium',
    impactScore: 2,
    tip: 'Composting prevents anaerobic decomposition in landfills, which releases harmful methane gas.'
  },
  {
    id: 'unplug_standby',
    title: 'Unplug Standby Electronics',
    description: 'Unplug devices or switch off smart power strips to eliminate phantom/standby power.',
    category: 'energy',
    estimatedMonthlySavings: 5.0,
    savingsVal: 5.0,
    savingsUnit: 'per month',
    effort: 'Low',
    effortScore: 1,
    impact: 'Low',
    impactScore: 1,
    tip: 'Idle electronic devices ("vampire power") account for up to 10% of standard household electricity bills.'
  }
];

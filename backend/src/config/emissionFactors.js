/**
 * EcoTrack - Carbon Emission Factors Configuration
 * All values are represented in kg CO2e (Carbon Dioxide Equivalent).
 * Sources are cited in the comments below.
 */

export const EMISSION_FACTORS = {
  // --- TRANSPORTATION ---
  // Sourced from US EPA GHG Emission Factors Hub (2023) and UK DEFRA (2023)
  transport: {
    // Average passenger vehicle (gasoline): ~0.18 kg CO2e/km (0.289 kg CO2e/mile)
    // Source: EPA 2023, Table 2 (Mobile Combustion)
    car_gasoline: 0.18,

    // Electric vehicle charged on average grid: ~0.05 kg CO2e/km
    // Sourced using average US/UK grid intensity and typical EV efficiency (0.18 kWh/km)
    car_electric: 0.05,

    // Public transit (bus/rail): ~0.04 kg CO2e/passenger-km
    // Source: UK DEFRA 2023, Public Transport Conversion Factors
    public_transit: 0.04,

    // Flight (Short haul / domestic): ~0.25 kg CO2e/passenger-km
    // Higher factor due to take-off energy intensity and radiative forcing. Source: DEFRA 2023
    flight_short: 0.25,

    // Flight (Long haul / international): ~0.15 kg CO2e/passenger-km
    // Slightly lower per-km impact than short-haul due to cruise efficiency. Source: DEFRA 2023
    flight_long: 0.15,

    // Walking/Cycling/Biking: 0 kg CO2e/km
    active: 0.0
  },

  // --- DIETARY BASELINES (for onboarding baseline footprint) ---
  // Values are represented in kg CO2e/month per person, estimated by multiplying
  // daily dietary emissions from Scarborough et al. (2014) / Poore & Nemecek (2018) by 30.4 days.
  diet: {
    // Heavy meat-eaters: ~5.3 kg CO2e/day -> 160 kg CO2e/month
    meat_heavy: 160,
    
    // Average diet: ~4.0 kg CO2e/day -> 120 kg CO2e/month
    average: 120,
    
    // Vegetarian: ~2.3 kg CO2e/day -> 70 kg CO2e/month
    vegetarian: 70,
    
    // Vegan: ~1.7 kg CO2e/day -> 50 kg CO2e/month
    vegan: 50
  },

  // --- DIET SERVINGS (for logging daily/weekly food activity) ---
  // Based on Poore & Nemecek (2018) Science paper. Values are kg CO2e per typical serving (~150g).
  food_servings: {
    // Beef/Lamb: ~30 kg CO2e/kg -> 4.5 kg CO2e per 150g serving (ruminant methane/land use)
    beef_lamb: 4.5,
    
    // Pork/Poultry: ~6 kg CO2e/kg -> 0.9 kg CO2e per 150g serving
    pork_poultry: 0.9,
    
    // Fish/Seafood: ~5 kg CO2e/kg -> 0.75 kg CO2e per 150g serving
    fish_seafood: 0.75,
    
    // Dairy/Eggs: ~4 kg CO2e/kg (equivalent serving basis) -> 0.6 kg CO2e per serving
    dairy_eggs: 0.6,
    
    // Fruits/Vegetables/Grains/Pulses: ~0.8 kg CO2e/kg -> 0.12 kg CO2e per serving
    plant_based: 0.12
  },

  // --- HOME UTILITIES (Energy) ---
  // Sourced from EPA eGRID 2023 and DEFRA 2023
  energy: {
    // Electricity (US Average grid mix): ~0.37 kg CO2e/kWh (rounded to 0.4 for standard MVP)
    // Source: EPA eGRID subregion averages
    electricity: 0.40,

    // Natural Gas: ~0.18 kg CO2e/kWh (or ~1.9 kg CO2e per therm)
    // Source: EPA GHG Emission Factors Hub (2023)
    natural_gas: 0.20,

    // Heating Oil: ~2.68 kg CO2e/liter
    // Source: EPA GHG Emission Factors Hub (2023)
    heating_oil: 2.68
  },

  // --- SHOPPING & WASTE ---
  // Sourced from lifecycle assessment analyses and EPA WARM
  shopping_waste: {
    // Average clothing garment: ~12 kg CO2e per item (raw materials, manufacture, transport)
    clothing: 12.0,

    // Average electronic device (smartphones, tablets, laptops average): ~80 kg CO2e per item
    // Sourced from typical carbon footprints published by Apple/Google lifecycle reports
    electronics: 80.0,

    // Municipal solid waste to landfill: ~0.50 kg CO2e per kg of waste (methane from anaerobic decay)
    // Source: EPA WARM model for mixed waste
    waste: 0.50
  }
};

// Comparative national/global monthly averages (kg CO2e/month) for the dashboard comparison
export const REGIONAL_AVERAGES = {
  us: 1300,       // USA average is ~16 tonnes/year = ~1330 kg/month
  uk: 540,        // UK average is ~6.5 tonnes/year = ~540 kg/month
  global: 400,    // Global average is ~4.8 tonnes/year = ~400 kg/month
  target: 160     // Paris Agreement target for limiting to 1.5C (~2 tonnes/year = ~160 kg/month)
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Car, Flame, Users, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

export default function OnboardingQuiz() {
  const { apiFetch, setOnboardingCompleted } = useAuth();
  
  const [step, setStep] = useState(1);
  const [dietType, setDietType] = useState('average');
  const [commuteMode, setCommuteMode] = useState('car_gasoline');
  const [weeklyCommuteKm, setWeeklyCommuteKm] = useState(50);
  const [householdSize, setHouseholdSize] = useState(2);
  const [homeEnergySource, setHomeEnergySource] = useState('coal_gas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Constants mapping to backend calculation logic for transparency
  const DIET_FACTORS = { meat_heavy: 160, average: 120, vegetarian: 70, vegan: 50 };
  const TRANSPORT_FACTORS = { car_gasoline: 0.18, car_electric: 0.05, public_transit: 0.04, active: 0, none: 0 };
  const ENERGY_HOUSEHOLD_TOTALS = { coal_gas: 440, green: 70, none: 40 };
  const WASTE_FACTOR = 22.5; // 45kg waste * 0.50 factor

  // Intermediate baseline math for live display
  const foodCO2 = DIET_FACTORS[dietType];
  
  const transportCO2 = Number((weeklyCommuteKm * 4.345 * TRANSPORT_FACTORS[commuteMode]).toFixed(1));
  const transportFormula = `${weeklyCommuteKm} km/wk × 4.345 wks × ${TRANSPORT_FACTORS[commuteMode]} kg/km = ${transportCO2} kg CO2e`;
  
  const rawEnergyShared = ENERGY_HOUSEHOLD_TOTALS[homeEnergySource];
  const energyCO2 = Number((rawEnergyShared / householdSize).toFixed(1));
  const energyFormula = `${rawEnergyShared} kg (household total) / ${householdSize} members = ${energyCO2} kg CO2e`;
  
  const wasteCO2 = WASTE_FACTOR;
  const wasteFormula = `45 kg waste × 0.50 factor = ${wasteCO2} kg CO2e`;

  const totalMonthlyCO2 = Number((foodCO2 + transportCO2 + energyCO2 + wasteCO2).toFixed(1));

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiFetch('/profile/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          dietType,
          commuteMode,
          weeklyCommuteKm,
          householdSize,
          homeEnergySource
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit onboarding details');
      }
      setOnboardingCompleted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsData = [
    { title: 'Diet Type', desc: 'Select the option that best matches your eating habits.' },
    { title: 'Transportation', desc: 'How do you commute weekly and what distance do you travel?' },
    { title: 'Home Energy', desc: 'What is your primary electricity and heating supply?' },
    { title: 'Household Size', desc: 'How many members share your home energy footprint?' },
    { title: 'Calculation Summary', desc: 'Review your initial monthly baseline carbon footprint.' }
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Quiz Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          <span>Step {step} of 5: {stepsData[step - 1].title}</span>
          <span>{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-forest-500 h-full transition-all duration-500 ease-out" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{stepsData[step - 1].desc}</p>
      </div>

      {/* Quiz Main Card */}
      <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8 mb-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 dark:text-white">
              <Leaf className="text-forest-500 w-6 h-6" /> What is your primary diet?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'meat_heavy', title: 'Heavy Meat Eater', desc: 'You consume beef, pork, or poultry with most meals daily.', baseline: '160 kg CO2e/mo' },
                { key: 'average', title: 'Average Diet', desc: 'You eat meat and poultry occasionally, with mixed veggie days.', baseline: '120 kg CO2e/mo' },
                { key: 'vegetarian', title: 'Vegetarian', desc: 'You avoid meat, but eat dairy, eggs, and plant-based foods.', baseline: '70 kg CO2e/mo' },
                { key: 'vegan', title: 'Vegan', desc: 'You consume only plant-based products, completely excluding animal products.', baseline: '50 kg CO2e/mo' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDietType(opt.key)}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-left p-4 rounded-2xl border transition-all duration-200 ${
                    dietType === opt.key 
                      ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-950/20 text-forest-700 dark:text-forest-300 ring-2 ring-forest-500/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{opt.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-forest-600 dark:text-forest-400 mt-2 sm:mt-0 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    {opt.baseline}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-4 bg-forest-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-bold uppercase tracking-wider text-forest-600 dark:text-forest-400">Dietary Calculation:</span>
              <p>Baseline carbon is derived from Poore & Nemecek (2018) Science lifecycle assessments multiplying typical daily dietary intakes by 30.4 days.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Car className="text-forest-500 w-6 h-6" /> Tell us about your commute
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Commute Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'car_gasoline', label: 'Gasoline Passenger Car', factor: '0.18 kg/km' },
                  { key: 'car_electric', label: 'Electric Vehicle', factor: '0.05 kg/km' },
                  { key: 'public_transit', label: 'Public Transit (Bus/Train)', factor: '0.04 kg/km' },
                  { key: 'active', label: 'Active (Bicycle / Walking)', factor: '0 kg/km' },
                  { key: 'none', label: 'No Commute / Work From Home', factor: '0 kg/km' }
                ].map(mode => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setCommuteMode(mode.key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left text-sm font-medium transition-all ${
                      commuteMode === mode.key
                        ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-950/20 text-forest-700 dark:text-forest-300 ring-2 ring-forest-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{mode.label}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{mode.factor}</span>
                  </button>
                ))}
              </div>
            </div>

            {commuteMode !== 'none' && commuteMode !== 'active' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Weekly Commute Distance</label>
                  <span className="text-sm font-bold text-forest-600 dark:text-forest-400">{weeklyCommuteKm} km / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={weeklyCommuteKm}
                  onChange={(e) => setWeeklyCommuteKm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-forest-500"
                />
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Calculation Method:</span>
                  <code className="text-xs text-forest-600 dark:text-forest-400 block font-mono">{transportFormula}</code>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Estimates weekly kilometers scaled by 4.345 average monthly weeks multiplied by emission factors from the US EPA Mobile Combustion guidelines.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Flame className="text-forest-500 w-6 h-6" /> Home energy utilities
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">What energy grid mix does your household run on?</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'coal_gas', title: 'Standard Grid Mix (Fossil / Mixed)', desc: 'Grid reliance on gas, coal, and mixed sources (~440 kg CO2e/month average household baseline)' },
                  { key: 'green', title: 'Green Energy / Renewables Contract', desc: 'You purchase certified green electricity, using gas for heat/cooking only (~70 kg CO2e/month)' },
                  { key: 'none', title: 'Minimal Utility Reliance / Off-Grid', desc: 'Extremely energy-efficient, solar-dependent, or passive heating systems (~40 kg CO2e/month)' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setHomeEnergySource(opt.key)}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                      homeEnergySource === opt.key
                        ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-950/20 text-forest-700 dark:text-forest-300 ring-2 ring-forest-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-800 dark:text-white">{opt.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Calculation Method:</span>
              <code className="text-xs text-forest-600 dark:text-forest-400 block font-mono">{energyFormula}</code>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Based on US national averages (800 kWh electricity + 600 kWh gas) divided by the total number of household members. Sourced from EPA eGRID carbon intensities.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Users className="text-forest-500 w-6 h-6" /> Household details
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">How many members live in your household (including yourself)?</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setHouseholdSize(prev => Math.max(prev - 1, 1))}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-lg dark:text-white"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-forest-600 dark:text-forest-400 w-8 text-center">{householdSize}</span>
                <button
                  type="button"
                  onClick={() => setHouseholdSize(prev => Math.min(prev + 1, 10))}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-lg dark:text-white"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-slate-500">Shared household energy footprints are divided equally by household members to yield your personal carbon share.</p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Calculation Method:</span>
              <code className="text-xs text-forest-600 dark:text-forest-400 block font-mono">{energyFormula}</code>
            </div>
          </div>
        )}

        {step === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <ShoppingBag className="text-forest-500 w-6 h-6" /> Your Estimated Monthly Footprint
            </h2>

            <div className="p-6 bg-forest-50/50 dark:bg-slate-900/60 border border-forest-100 dark:border-slate-800 rounded-3xl text-center space-y-2">
              <span className="contrast-label">Estimated Monthly Baseline</span>
              <div className="text-4xl font-extrabold text-forest-600 dark:text-forest-400">{totalMonthlyCO2} kg CO2e</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">This represents your baseline emissions before logging daily activities.</p>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Carbon Breakdown Math</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs dark:text-slate-300">
                <div className="py-2.5 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-white block">Food ({dietType})</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">Scarborough et al. LCA baseline factor</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{foodCO2} kg CO2e/mo</span>
                </div>
                <div className="py-2.5 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-white block">Transport ({commuteMode})</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500">{transportFormula}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{transportCO2} kg CO2e/mo</span>
                </div>
                <div className="py-2.5 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-white block">Home Energy ({homeEnergySource})</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500">{energyFormula}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{energyCO2} kg CO2e/mo</span>
                </div>
                <div className="py-2.5 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-white block">Waste (Landfill decay)</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500">{wasteFormula}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{wasteCO2} kg CO2e/mo</span>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-forest-500 hover:bg-forest-600 text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Saving Baseline...' : 'Complete Onboarding & Enter Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>

      {/* Step Buttons Footer */}
      {step < 5 && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-all disabled:opacity-30 dark:text-white flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 rounded-2xl bg-forest-500 hover:bg-forest-600 text-white text-sm font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

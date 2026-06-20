import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Flame, Calendar, Award, CheckCircle, ShieldAlert } from 'lucide-react';

export default function GoalsStreaks({ dashboardData, refreshTrigger, onGoalUpdated }) {
  const { apiFetch } = useAuth();
  
  const [targetReduction, setTargetReduction] = useState(15);
  const [activeGoal, setActiveGoal] = useState(null);
  const [monthlyEmissions, setMonthlyEmissions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalsError, setGoalsError] = useState(null);

  const fetchGoalsAndStreaks = async () => {
    try {
      const res = await apiFetch('/goals/active');
      if (res.ok) {
        const data = await res.json();
        setActiveGoal(data.activeGoal);
        setMonthlyEmissions(data.currentMonthEmissions);
        setStreakDays(data.streakDays);
        if (data.activeGoal) {
          setTargetReduction(data.activeGoal.targetReductionPct);
        }
      }
    } catch (err) {
      console.error('Failed to load active goals & streaks:', err);
    }
  };

  useEffect(() => {
    fetchGoalsAndStreaks();
  }, [refreshTrigger]);

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGoalsError(null);
    try {
      const res = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({ targetReductionPct: targetReduction })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update goal');
      }
      setActiveGoal(data);
      fetchGoalsAndStreaks();
      if (onGoalUpdated) {
        onGoalUpdated();
      }
    } catch (err) {
      setGoalsError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for progress bar
  const baseline = dashboardData ? dashboardData.baselineCO2 : 0;
  const targetEmissions = activeGoal ? activeGoal.targetCo2Monthly : baseline * (1 - targetReduction / 100);
  
  // Non-shaming progress metrics
  const isOverTarget = monthlyEmissions > targetEmissions;
  const progressPercent = targetEmissions > 0 ? (monthlyEmissions / targetEmissions) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Target Setting Column */}
      <div className="md:col-span-6 space-y-6">
        <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2 dark:text-white flex items-center gap-2">
            <Target className="text-forest-500 w-5 h-5" /> Set Reduction Target
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Choose a target percentage to cut from your personal monthly baseline footprint.</p>

          <form onSubmit={handleSubmitGoal} className="space-y-6">
            {goalsError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                {goalsError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="contrast-label">Reduction Target</span>
                <span className="text-sm font-bold text-forest-600 dark:text-forest-400">{targetReduction}% Reduction</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={targetReduction}
                onChange={(e) => setTargetReduction(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-forest-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5% (Easy)</span>
                <span>25% (Moderate)</span>
                <span>50% (Paris Target)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Monthly Baseline:</span>
                <span className="font-mono font-bold dark:text-white">{baseline.toFixed(1)} kg CO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Monthly Limit:</span>
                <span className="font-mono font-bold text-forest-600 dark:text-forest-400">{targetEmissions.toFixed(1)} kg CO2e</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Est. Savings:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{(baseline - targetEmissions).toFixed(1)} kg CO2e/mo</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-forest-500 hover:bg-forest-600 text-white font-bold rounded-2xl shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Updating Target...' : activeGoal ? 'Update Target Goal' : 'Activate Carbon Goal'}
            </button>
          </form>
        </div>
      </div>

      {/* Progress & Streaks Column */}
      <div className="md:col-span-6 space-y-6">
        {/* Logging Streaks Card */}
        <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <span className="contrast-label">Activity logging streak</span>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
              {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px]">
              {streakDays > 0 
                ? 'Terrific job! You are building a consistent habit of carbon tracking.' 
                : 'Log an activity today to start your streak!'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2 block">
              Missed a day? No worries! Your past reductions still help the planet. Keep going!
            </p>
          </div>
          <div className="w-20 h-20 text-orange-500 flex items-center justify-center relative">
            <Flame className={`w-full h-full ${streakDays > 0 ? 'animate-pulse-soft fill-orange-500/20' : 'opacity-20'}`} />
          </div>
        </div>

        {/* Target Progress Card */}
        <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold mb-4 dark:text-white flex items-center gap-2">
            <Award className="text-forest-500 w-5 h-5" /> Target Progress Status
          </h3>

          {!activeGoal ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Set a reduction target to enable progress tracking.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Current Monthly Emissions</span>
                <span className="font-mono font-bold dark:text-white">
                  {monthlyEmissions.toFixed(1)} / {targetEmissions.toFixed(0)} kg CO2e
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${
                    progressPercent > 100 ? 'bg-amber-500' : 'bg-forest-500'
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>

              {/* Non-shaming Feedback */}
              {isOverTarget ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs flex gap-2 border border-amber-100/50 dark:border-amber-900/40">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    You have exceeded your target carbon threshold for this month. <strong>Don't feel discouraged!</strong> Track more of your low-impact choices, or consult our Insights engine to identify quick reduction opportunities.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-forest-50 dark:bg-forest-950/20 text-forest-700 dark:text-forest-400 rounded-2xl text-xs flex gap-2 border border-forest-100/50 dark:border-forest-900/40">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>On track!</strong> Your monthly carbon emissions are within your {targetReduction}% reduction target window. Great work maintaining a low-impact footprint!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

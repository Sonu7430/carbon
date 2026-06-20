import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, HelpCircle, AlertCircle, Compass, Zap, Check } from 'lucide-react';

export default function Insights({ refreshTrigger }) {
  const { apiFetch } = useAuth();
  
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedGoals, setAddedGoals] = useState({});

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/insights');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to fetch personalized insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [refreshTrigger]);

  const handleAddGoal = async (rec) => {
    // Add action to user's active goals
    try {
      const res = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({
          // Set a 15% reduction target by default if they select the action
          targetReductionPct: 15 
        })
      });
      if (res.ok) {
        setAddedGoals(prev => ({ ...prev, [rec.id]: true }));
        alert(`Awesome! You have committed to reducing emissions. Added carbon target tracking to your profile.`);
      }
    } catch (err) {
      console.error('Failed to add reduction target:', err);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400">Loading your personalized recommendations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-forest-500 w-6 h-6" />
        <div>
          <h2 className="text-xl font-bold dark:text-white">Personalized Insights Engine</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Recommendations ranked dynamically by impact and based on your monthly carbon profile.</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          No recommendations available. Start logging activities to weight your focus areas!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => {
            const isAdded = addedGoals[rec.id];
            
            // Priority Tag styling
            let priorityLabel = 'Medium Priority';
            let priorityStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            
            if (rec.priorityScore >= 3.0) {
              priorityLabel = 'Critical Priority';
              priorityStyle = 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400';
            } else if (rec.priorityScore >= 2.0) {
              priorityLabel = 'High Priority';
              priorityStyle = 'bg-forest-50 text-forest-700 dark:bg-forest-950/20 dark:text-forest-400';
            }

            return (
              <div 
                key={rec.id} 
                className="glass-card shadow-glass rounded-3xl p-6 flex flex-col justify-between border hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div>
                  {/* Badges */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${priorityStyle}`}>
                      {priorityLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Score: {rec.priorityScore}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {rec.description}
                  </p>

                  {/* Impact / Effort Metrics */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs mb-4">
                    <div>
                      <span className="contrast-label block text-[10px]">Impact</span>
                      <span className="font-semibold text-slate-800 dark:text-white capitalize">{rec.impact}</span>
                    </div>
                    <div>
                      <span className="contrast-label block text-[10px]">Effort Required</span>
                      <span className="font-semibold text-slate-800 dark:text-white capitalize">{rec.effort}</span>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div className="mb-4">
                    <span className="contrast-label block text-[10px] mb-0.5">Est. Carbon Savings</span>
                    <span className="text-lg font-extrabold text-forest-600 dark:text-forest-400">
                      {rec.estimatedMonthlySavings.toFixed(1)} kg CO2e / month
                    </span>
                  </div>

                  {/* Tip drawer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 flex gap-2 border border-slate-100 dark:border-slate-800/80 mb-6">
                    <HelpCircle className="w-4 h-4 text-forest-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed"><strong className="text-slate-600 dark:text-slate-300 font-semibold">Tip: </strong>{rec.tip}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddGoal(rec)}
                  disabled={isAdded}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAdded 
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-forest-500 hover:bg-forest-600 text-white shadow-sm'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" /> Committed to reduction
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Commit to Action
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, Check, HelpCircle } from 'lucide-react';

export default function ActionLibrary() {
  const { apiFetch } = useAuth();
  
  const [actions, setActions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [committedActions, setCommittedActions] = useState({});

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('q', search);
      if (category) queryParams.append('category', category);

      const res = await apiFetch(`/actions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions);
      }
    } catch (err) {
      console.error('Failed to load action library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input to avoid hitting endpoint repeatedly
    const timer = setTimeout(() => {
      fetchActions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleCommit = async (actionId) => {
    try {
      const res = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({ targetReductionPct: 15 }) // default commits
      });
      if (res.ok) {
        setCommittedActions(prev => ({ ...prev, [actionId]: true }));
        alert('Action Committed! Carbon tracking targets have been configured for your profile.');
      }
    } catch (err) {
      console.error('Failed to commit action:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="text-forest-500 w-6 h-6" />
        <div>
          <h2 className="text-xl font-bold dark:text-white">Eco Actions Library</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Searchable catalogue of lifestyle modifications to reduce carbon output.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card shadow-glass rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center">
        {/* Text Search Input */}
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            id="action-search"
            aria-label="Search actions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions (e.g. bike, LED, clothes...)"
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none"
          />
        </div>

        {/* Category Selector Dropdown */}
        <div className="w-full md:w-60 relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <select
            id="category-filter"
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none cursor-pointer appearance-none"
          >
            <option value="">All Categories</option>
            <option value="transport">Transportation</option>
            <option value="food">Diet / Food</option>
            <option value="energy">Utilities / Energy</option>
            <option value="shopping_waste">Shopping & Waste</option>
          </select>
        </div>
      </div>

      {/* Actions Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">Loading catalog actions...</div>
      ) : actions.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500">
          No lifestyle actions matched your search parameters. Try entering a different keyword!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map(action => {
            const isCommitted = committedActions[action.id];
            
            // Map category tags
            const catColors = {
              transport: 'bg-forest-50 text-forest-700 dark:bg-forest-950/20 dark:text-forest-400',
              food: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
              energy: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
              shopping_waste: 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400'
            };

            return (
              <div 
                key={action.id}
                className="glass-card shadow-glass rounded-3xl p-6 flex flex-col justify-between border hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${catColors[action.category]}`}>
                      {action.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Savings Unit: {action.savingsUnit}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                    {action.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {action.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-[10px] mb-4">
                    <div>
                      <span className="contrast-label block">Impact</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{action.impact}</span>
                    </div>
                    <div>
                      <span className="contrast-label block">Effort</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{action.effort}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="contrast-label block text-[10px] mb-0.5">Est. Monthly Savings</span>
                    <span className="text-base font-extrabold text-forest-600 dark:text-forest-400">
                      ~{action.estimatedMonthlySavings.toFixed(1)} kg CO2e
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl text-[10px] text-slate-400 dark:text-slate-500 mb-6 flex gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-forest-500 flex-shrink-0 mt-0.5" />
                    <span>{action.tip}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCommit(action.id)}
                  disabled={isCommitted}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCommitted
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-forest-500 hover:bg-forest-600 text-white shadow-sm'
                  }`}
                >
                  {isCommitted ? (
                    <>
                      <Check className="w-4 h-4" /> Committed to Action
                    </>
                  ) : (
                    'Commit to Action'
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

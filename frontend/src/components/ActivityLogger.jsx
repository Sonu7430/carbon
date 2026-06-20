import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Utensils, Zap, ShoppingBag, Trash2, Calendar, Plus, RefreshCw } from 'lucide-react';

export default function ActivityLogger({ onActivityAdded }) {
  const { apiFetch } = useAuth();
  
  const [category, setCategory] = useState('transport');
  const [activityType, setActivityType] = useState('car_gasoline');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // History Log States
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Static options mapping for live calculations
  const OPTIONS = {
    transport: [
      { key: 'car_gasoline', label: 'Gasoline Car (km)', factor: 0.18, unit: 'km' },
      { key: 'car_electric', label: 'Electric Car (km)', factor: 0.05, unit: 'km' },
      { key: 'public_transit', label: 'Bus / Train (km)', factor: 0.04, unit: 'km' },
      { key: 'flight_short', label: 'Short Flight (<1500km) (km)', factor: 0.25, unit: 'km' },
      { key: 'flight_long', label: 'Long Flight (>1500km) (km)', factor: 0.15, unit: 'km' }
    ],
    food: [
      { key: 'beef_lamb', label: 'Beef / Lamb (serving)', factor: 4.5, unit: 'serving' },
      { key: 'pork_poultry', label: 'Pork / Poultry (serving)', factor: 0.9, unit: 'serving' },
      { key: 'fish_seafood', label: 'Fish / Seafood (serving)', factor: 0.75, unit: 'serving' },
      { key: 'dairy_eggs', label: 'Dairy / Eggs (serving)', factor: 0.6, unit: 'serving' },
      { key: 'plant_based', label: 'Vegetarian / Vegan (serving)', factor: 0.12, unit: 'serving' }
    ],
    energy: [
      { key: 'electricity', label: 'Electricity (kWh)', factor: 0.40, unit: 'kWh' },
      { key: 'natural_gas', label: 'Natural Gas (kWh)', factor: 0.20, unit: 'kWh' },
      { key: 'heating_oil', label: 'Heating Oil (Liter)', factor: 2.68, unit: 'L' }
    ],
    shopping_waste: [
      { key: 'clothing', label: 'New Clothing (item)', factor: 12.0, unit: 'item' },
      { key: 'electronics', label: 'New Electronic Device (item)', factor: 80.0, unit: 'item' },
      { key: 'waste', label: 'Household Trash (kg)', factor: 0.5, unit: 'kg' }
    ]
  };

  // Auto-switch default activityType when category changes
  useEffect(() => {
    setActivityType(OPTIONS[category][0].key);
    setAmount('');
  }, [category]);

  // Fetch paginated activity history
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiFetch(`/activities?page=${page}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  // Pre-calculate live preview
  const currentOption = OPTIONS[category].find(opt => opt.key === activityType) || OPTIONS[category][0];
  const numAmount = Number(amount);
  const liveCO2 = isNaN(numAmount) || numAmount <= 0 ? 0 : Number((numAmount * currentOption.factor).toFixed(2));
  const liveFormula = `${numAmount || 0} ${currentOption.unit} × ${currentOption.factor} kg CO2e/${currentOption.unit} = ${liveCO2} kg CO2e`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      return setFormError('Please enter a positive amount.');
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/activities', {
        method: 'POST',
        body: JSON.stringify({
          category,
          activityType,
          amount: Number(amount),
          date,
          notes: notes.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log activity');
      }

      // Reset form fields
      setAmount('');
      setNotes('');
      setPage(1); // jump to first page to see latest entry
      fetchHistory();
      
      if (onActivityAdded) {
        onActivityAdded(); // refresh dashboard metrics
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    try {
      const res = await apiFetch(`/activities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // If on last page and only item is deleted, step back a page
        if (activities.length === 1 && page > 1) {
          setPage(prev => prev - 1);
        } else {
          fetchHistory();
        }
        if (onActivityAdded) {
          onActivityAdded();
        }
      }
    } catch (err) {
      console.error('Failed to delete log entry:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Logger Input Form Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Plus className="text-forest-500 w-5 h-5" /> Log Daily Activity
          </h2>

          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { id: 'transport', label: 'Transit', icon: Car },
              { id: 'food', label: 'Diet', icon: Utensils },
              { id: 'energy', label: 'Utilities', icon: Zap },
              { id: 'shopping_waste', label: 'Goods', icon: ShoppingBag }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  aria-label={`Select ${tab.label} category`}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                    category === tab.id
                      ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-950/20 text-forest-600 dark:text-forest-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] tracking-wide font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Sub-type Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="activity-type">
                Activity Type
              </label>
              <select
                id="activity-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none cursor-pointer"
              >
                {OPTIONS[category].map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Input Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="amount-input">
                Amount ({currentOption.unit})
              </label>
              <input
                id="amount-input"
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. 25 ${currentOption.unit}`}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none"
              />
            </div>

            {/* Log Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="log-date">
                Log Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="log-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="notes-input">
                Notes / Context (Optional)
              </label>
              <input
                id="notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Weekly grocery trip, drove to work"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white outline-none"
              />
            </div>

            {/* Transparent Calculation Display */}
            <div className="p-4 bg-forest-50/50 dark:bg-slate-950/40 rounded-2xl border border-forest-100/50 dark:border-slate-800/80 space-y-1.5 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-600 dark:text-forest-400">Transparent Formula</span>
              <code className="text-xs font-mono font-bold block text-slate-700 dark:text-slate-300">
                {liveFormula}
              </code>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-forest-500 hover:bg-forest-600 text-white font-bold rounded-2xl shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSubmitting ? 'Logging...' : 'Log Carbon Activity'}
            </button>
          </form>
        </div>
      </div>

      {/* History Log Entries Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <RefreshCw className={`text-forest-500 w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} /> Carbon Log History
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-500 dark:text-slate-400">
              {totalCount} total logs
            </span>
          </div>

          {isLoadingHistory && activities.length === 0 ? (
            <div className="py-20 text-center text-slate-400">Loading history logs...</div>
          ) : activities.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No carbon logs recorded yet</p>
              <p className="text-xs">Log your daily commutes, utility usage, or diets to see details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-2">Date</th>
                      <th className="pb-3 pr-2">Category</th>
                      <th className="pb-3 pr-2">Logged Activity</th>
                      <th className="pb-3 text-right pr-2">Impact</th>
                      <th className="pb-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 dark:text-slate-300">
                    {activities.map(log => {
                      // Capitalize words for pretty display
                      const prettyCategory = log.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                      const prettyType = log.activityType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-3.5 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                            {log.logDate}
                          </td>
                          <td className="py-3.5 capitalize font-semibold text-forest-600 dark:text-forest-400">
                            {prettyCategory}
                          </td>
                          <td className="py-3.5 pr-2">
                            <span className="font-semibold block capitalize dark:text-white">{prettyType}</span>
                            <span className="text-[10px] text-slate-400">{log.amount} {log.unit} {log.notes ? `• ${log.notes}` : ''}</span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-slate-800 dark:text-white pr-2 whitespace-nowrap">
                            {log.calculatedCO2.toFixed(2)} kg
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleDelete(log.id)}
                              aria-label={`Delete ${prettyType} log`}
                              className="p-1.5 hover:text-red-500 text-slate-400 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer inline-flex"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-white transition-all disabled:opacity-45 cursor-pointer"
                  >
                    Previous Page
                  </button>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Showing page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-white transition-all disabled:opacity-45 cursor-pointer"
                  >
                    Next Page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingDown, Award, AlertTriangle, Scale, Target } from 'lucide-react';

export default function Dashboard({ data, loading }) {
  if (loading) {
    return <div className="py-20 text-center text-slate-400">Aggregating dashboard carbon metrics...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-red-500">Failed to load dashboard metrics.</div>;
  }

  const { baselineCO2, categoryTotals, totalCO2CurrentMonth, carbonSavedThisMonth, regionalAverages, trendData } = data;

  // Format data for Pie Chart
  const categoryData = [
    { name: 'Transportation', value: categoryTotals.transport, color: '#3c9367' }, // forest green
    { name: 'Diet / Food', value: categoryTotals.food, color: '#60a5fa' }, // blue
    { name: 'Utilities / Energy', value: categoryTotals.energy, color: '#f59e0b' }, // amber
    { name: 'Shopping & Waste', value: categoryTotals.shopping_waste, color: '#ec4899' } // pink
  ].filter(cat => cat.value > 0); // only show logged categories

  // Format trend dates for pretty labels
  const formattedTrends = trendData.map(t => {
    const parts = t.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : t.date;
    return { ...t, label };
  });

  const percentOfBaseline = baselineCO2 > 0 ? (totalCO2CurrentMonth / baselineCO2) * 100 : 0;
  
  // Custom tooltips for Recharts
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-lg">
          <p className="font-bold">{dataItem.name}</p>
          <p className="font-mono text-forest-300 mt-0.5">{dataItem.value.toFixed(2)} kg CO2e</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* High-Level Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1: Monthly Footprint */}
        <div className="glass-card shadow-glass rounded-3xl p-6 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="contrast-label">This Month's Footprint</span>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
              {totalCO2CurrentMonth.toFixed(1)} <span className="text-sm font-medium text-slate-500">kg CO2e</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-2">
              {totalCO2CurrentMonth <= baselineCO2 ? (
                <span className="text-forest-600 dark:text-forest-400 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  {percentOfBaseline.toFixed(0)}% of your baseline
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {(percentOfBaseline - 100).toFixed(0)}% above your baseline
                </span>
              )}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-slate-100 dark:text-slate-900/50 w-24 h-24">
            <Scale className="w-full h-full opacity-15" />
          </div>
        </div>

        {/* Metric Card 2: Personal Baseline */}
        <div className="glass-card shadow-glass rounded-3xl p-6 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="contrast-label">Personal Monthly Baseline</span>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
              {baselineCO2.toFixed(1)} <span className="text-sm font-medium text-slate-500">kg CO2e</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Calculated from your onboarding parameters.</p>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-slate-100 dark:text-slate-900/50 w-24 h-24">
            <Target className="w-full h-full opacity-15" />
          </div>
        </div>

        {/* Metric Card 3: Carbon Savings */}
        <div className="glass-card shadow-glass rounded-3xl p-6 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="contrast-label">Carbon Saved This Month</span>
            <div className="text-3xl font-extrabold text-forest-600 dark:text-forest-400 mt-1">
              {carbonSavedThisMonth.toFixed(1)} <span className="text-sm font-medium text-slate-500">kg CO2e</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <Award className="w-4 h-4 text-forest-500" />
              <span>Great progress! Keep logging to reduce more.</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-slate-100 dark:text-slate-900/50 w-24 h-24">
            <Award className="w-full h-full opacity-15" />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Category Breakdown (Pie Chart) */}
        <div className="lg:col-span-5 glass-card shadow-glass rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold mb-1 dark:text-white">Category Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Carbon distribution for the current month.</p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-y-1 p-8">
                <p className="font-semibold">No category data logged yet</p>
                <p>Add commutes, meals, or utilities below to populate.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {categoryData.length > 0 && (
              <div className="absolute text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">{totalCO2CurrentMonth.toFixed(0)} kg</span>
              </div>
            )}
          </div>

          {/* Custom accessible legends */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Transport', val: categoryTotals.transport, color: 'bg-forest-500' },
              { label: 'Food / Diet', val: categoryTotals.food, color: 'bg-blue-400' },
              { label: 'Energy / Gas', val: categoryTotals.energy, color: 'bg-amber-500' },
              { label: 'Shopping / Waste', val: categoryTotals.shopping_waste, color: 'bg-pink-500' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-slate-500 dark:text-slate-400 capitalize">{item.label}</span>
                <span className="font-semibold font-mono ml-auto text-slate-700 dark:text-slate-300">
                  {item.val.toFixed(0)} kg
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 30-Day Trend Timeline (Area Chart) */}
        <div className="lg:col-span-7 glass-card shadow-glass rounded-3xl p-6">
          <h3 className="text-base font-bold mb-1 dark:text-white">Daily Emissions Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Carbon logs over the last 30 days (kg CO2e).</p>

          <div className="h-64" style={{ minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3c9367" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3c9367" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-lg font-mono">
                          <p className="font-sans font-bold">{payload[0].payload.date}</p>
                          <p className="text-forest-300 mt-0.5">{payload[0].value.toFixed(2)} kg CO2e</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3c9367" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Comparisons Panel (National & Sustainability Targets) */}
      <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
        <h3 className="text-base font-bold mb-1 dark:text-white">Regional Footprint Comparisons</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">How your footprint ({totalCO2CurrentMonth.toFixed(0)} kg CO2e/month) stacks up against national/global benchmarks.</p>
        
        <div className="space-y-5">
          {[
            { label: 'Your Footprint', val: totalCO2CurrentMonth, color: 'bg-forest-500', isUser: true },
            { label: 'Paris Accord Target (1.5°C goal)', val: regionalAverages.target, color: 'bg-emerald-600', desc: 'Sustainable threshold target (~2 tonnes/year)' },
            { label: 'Global Per-Capita Average', val: regionalAverages.global, color: 'bg-slate-400', desc: 'Typical footprint per person worldwide' },
            { label: 'United Kingdom Average', val: regionalAverages.uk, color: 'bg-blue-400', desc: 'UK household average footprint' },
            { label: 'United States Average', val: regionalAverages.us, color: 'bg-red-400', desc: 'US average per person due to larger vehicles/heating' }
          ].map((bar, idx) => {
            // Find max value in bars to scale layout percentages
            const maxVal = Math.max(totalCO2CurrentMonth, regionalAverages.us, regionalAverages.uk);
            const widthPct = Math.max(5, (bar.val / maxVal) * 100);
            
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold ${bar.isUser ? 'text-forest-600 dark:text-forest-400 font-bold text-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                    {bar.label} {bar.isUser && ' (Active)'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {bar.val.toFixed(0)} kg CO2e / month
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full ${bar.color} transition-all duration-700 ease-out`} 
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                {bar.desc && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{bar.desc}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

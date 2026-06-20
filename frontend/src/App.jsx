import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import OnboardingQuiz from './components/OnboardingQuiz';
import Dashboard from './components/Dashboard';
import ActivityLogger from './components/ActivityLogger';
import Insights from './components/Insights';
import GoalsStreaks from './components/GoalsStreaks';
import ActionLibrary from './components/ActionLibrary';
import { Leaf } from 'lucide-react';

function AppContent() {
  const { authenticated, onboardingCompleted, loading, apiFetch } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Triggers to synchronize component loads
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch dashboard data in top level coordinator
  const fetchDashboardData = async () => {
    if (!authenticated || !onboardingCompleted) return;
    setIsLoadingDashboard(true);
    try {
      const res = await apiFetch('/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [authenticated, onboardingCompleted, refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-12 h-12 border-4 border-forest-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Validating session...</span>
      </div>
    );
  }

  // Unauthenticated Layout
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 gradient-bg-light dark:gradient-bg-dark">
        {isSignUp ? (
          <Signup onToggleAuth={() => setIsSignUp(false)} />
        ) : (
          <Login onToggleAuth={() => setIsSignUp(true)} />
        )}
      </div>
    );
  }

  // Force Onboarding Survey prior to dashboard entries
  if (!onboardingCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 gradient-bg-light dark:gradient-bg-dark">
        <header className="py-6 px-8 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white"><span className="text-forest-500 font-black">Eco</span>Track</span>
          </div>
        </header>
        <main className="py-12">
          <OnboardingQuiz />
        </main>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col gradient-bg-light dark:gradient-bg-dark pb-16">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard data={dashboardData} loading={isLoadingDashboard} />
        )}
        
        {activeTab === 'logger' && (
          <ActivityLogger onActivityAdded={triggerRefresh} />
        )}

        {activeTab === 'insights' && (
          <Insights refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'goals' && (
          <GoalsStreaks 
            dashboardData={dashboardData} 
            refreshTrigger={refreshTrigger} 
            onGoalUpdated={triggerRefresh} 
          />
        )}

        {activeTab === 'actions' && (
          <ActionLibrary />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

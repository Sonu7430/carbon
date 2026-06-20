import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Menu, X, LogOut, Sun, Moon, Sparkles, Target, Calendar, BookOpen, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, onboardingCompleted } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, requiresOnboarding: true },
    { id: 'logger', label: 'Activity Logger', icon: Calendar, requiresOnboarding: true },
    { id: 'insights', label: 'Insights Engine', icon: Sparkles, requiresOnboarding: true },
    { id: 'goals', label: 'Goals & Streaks', icon: Target, requiresOnboarding: true },
    { id: 'actions', label: 'Actions Library', icon: BookOpen, requiresOnboarding: true }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              <span className="text-forest-500 font-black">Eco</span>Track
            </span>
          </div>

          {/* Navigation tabs for desktop */}
          {user && onboardingCompleted && (
            <div className="hidden md:flex space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-forest-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Desktop Right items */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 truncate max-w-32">
                    {user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Carbon Member</span>
                </div>
                <button
                  onClick={logout}
                  aria-label="Log Out"
                  className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu and toggle buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && onboardingCompleted && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Navigation Menu"
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav Drawer dropdown */}
      {user && onboardingCompleted && isOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
                    activeTab === item.id
                      ? 'bg-forest-500 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-850 px-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-300 truncate max-w-48">
                  {user.email}
                </span>
                <span className="text-[10px] text-slate-400 block">Carbon Tracker Member</span>
              </div>
              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

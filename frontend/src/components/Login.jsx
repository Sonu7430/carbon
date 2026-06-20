import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login({ onToggleAuth }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errMessage, setErrMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setErrMessage('Please enter both email and password.');
    }

    setErrMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrMessage(err.message || 'Invalid credentials or login failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <span className="text-forest-500 font-black">Eco</span>Track
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Log in to track your personal carbon footprint</p>
      </div>

      <div className="glass-card shadow-glass rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="email-input">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password-input">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white text-sm focus:border-forest-500 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-forest-500 hover:bg-forest-600 text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            <LogIn className="w-5 h-5" />
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={onToggleAuth}
              className="text-forest-600 dark:text-forest-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

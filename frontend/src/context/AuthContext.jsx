import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend API URL configuration
  const API_BASE = window.location.port === '5173'
    ? 'http://localhost:5000/api'
    : '/api';

  /**
   * Helper to retrieve a fresh CSRF token from the server.
   * Sets the cookie and stores the token in React state.
   */
  const refreshCsrf = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
      const data = await response.json();
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (err) {
      console.error('Failed to retrieve CSRF token:', err);
    }
    return null;
  };

  /**
   * Wrapper around fetch to handle credentials, headers, and CSRF token insertion.
   */
  const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    
    // Ensure credentials cookies are sent
    options.credentials = 'include';
    options.headers = options.headers || {};
    
    // Add JSON content type by default
    if (options.body && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }

    const method = (options.method || 'GET').toUpperCase();
    const stateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (stateChanging) {
      let currentToken = csrfToken;
      if (!currentToken) {
        // Fetch a new token if not present
        currentToken = await refreshCsrf();
      }
      if (currentToken) {
        options.headers['X-CSRF-Token'] = currentToken;
      }
    }

    let response = await fetch(url, options);

    // If 403 Forbidden due to stale CSRF token, fetch a new one and retry once
    if (response.status === 403 && stateChanging) {
      console.warn('Stale CSRF token detected. Refreshing token and retrying request...');
      const newToken = await refreshCsrf();
      if (newToken) {
        options.headers['X-CSRF-Token'] = newToken;
        response = await fetch(url, options);
      }
    }

    return response;
  };

  // Verify session on app boot
  const checkSession = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/auth/me');
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOnboardingCompleted(data.onboardingCompleted);
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      } else {
        // Clean session state
        setUser(null);
        setOnboardingCompleted(false);
      }
    } catch (err) {
      console.error('Session validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      setOnboardingCompleted(data.onboardingCompleted);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (email, password) => {
    setError(null);
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setUser(data.user);
      setOnboardingCompleted(data.onboardingCompleted);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      // Force clear state regardless of request completion
      setUser(null);
      setOnboardingCompleted(false);
      setCsrfToken(null);
    }
  };

  const value = {
    user,
    loading,
    authenticated: !!user,
    onboardingCompleted,
    setOnboardingCompleted,
    csrfToken,
    error,
    login,
    signup,
    logout,
    apiFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

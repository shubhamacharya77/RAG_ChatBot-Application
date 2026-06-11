import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../utils/api';
import './Auth.css';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // States
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    // Reset fields
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateForm = () => {
    if (!email) {
      showNotification('error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('error', 'Please enter a valid email address');
      return false;
    }
    if (!isLogin && !username) {
      showNotification('error', 'Username is required');
      return false;
    }
    if (!password) {
      showNotification('error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters');
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const data = await loginUser({ email, password });
        showNotification('success', 'Logged in successfully!');
        console.log('Login Response:', data);

        if (onLoginSuccess) {
          onLoginSuccess({
            email,
            username: data?.username || data?.user?.user_name || email.split('@')[0],
            token: data?.token || 'mock-token'
          });
        }
      } else {
        // Handle Registration
        const data = await registerUser({ username, email, password });
        showNotification('success', 'Registration successful! You can now log in.');
        console.log('Register Response:', data);
        // Switch to login view after registration success
        setTimeout(() => {
          setIsLogin(true);
          setPassword('');
        }, 1500);
      }
    } catch (err) {
      showNotification('error', err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative moving background elements */}
      <div className="bg-blob blob-purple"></div>
      <div className="bg-blob blob-cyan"></div>
      <div className="bg-blob blob-blue"></div>

      {/* Modern, glassmorphic auth card */}
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">AuraChat</span>
          </div>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="subtitle">
            {isLogin
              ? 'Enter your credentials to access your chat space'
              : 'Sign up to connect with others in real-time'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email field */}
          <div className="form-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={email ? 'has-value' : ''}
              disabled={loading}
              required
            />
            <label htmlFor="email">Email Address</label>
            <span className="input-focus-line"></span>
          </div>
          {/* Username field (only on Sign Up) */}
          {!isLogin && (
            <div className="form-group slide-in">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={username ? 'has-value' : ''}
                disabled={loading}
                required
              />
              <label htmlFor="username">Username</label>
              <span className="input-focus-line"></span>
            </div>
          )}
          {/* Password field */}
          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={password ? 'has-value' : ''}
              disabled={loading}
              required
            />
            <label htmlFor="password">Password</label>
            <span className="input-focus-line"></span>
          </div>

          {/* Confirm Password field (only on Sign Up) */}
          {!isLogin && (
            <div className="form-group slide-in">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmPassword ? 'has-value' : ''}
                disabled={loading}
                required
              />
              <label htmlFor="confirmPassword">Confirm Password</label>
              <span className="input-focus-line"></span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={`auth-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Auth Mode Toggle Link */}
        <div className="auth-footer">
          <span>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            className="toggle-link-btn"
            onClick={handleToggle}
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast toast-${notification.type}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? '✓' : '⚠'}
          </div>
          <div className="toast-message">{notification.message}</div>
        </div>
      )}
    </div>
  );
}

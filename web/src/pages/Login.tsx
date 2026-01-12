/**
 * Login Page - Resume Your Descent
 *
 * Full scene treatment with:
 * - DungeonPortal3D background
 * - Atmospheric particles and CRT
 * - PhosphorHeader with lore text
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { DungeonPortal3D } from '../components/DungeonPortal3D';
import { AUTH_CONTENT } from '../data/loreSkyfall';
import './Auth.css';

// Demo account credentials (publicly available for testing)
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'DemoPass123';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/character-creation');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsDemoLoading(true);

    try {
      await login(DEMO_USERNAME, DEMO_PASSWORD);
      navigate('/character-creation');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Demo login failed. Please try again.');
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <AtmosphericPage
      backgroundType="entrance"
      particles={{ type: 'embers', count: 18, speed: 'slow', opacity: 0.3 }}
      crt={true}
      crtIntensity="light"
      threeLayer={<DungeonPortal3D variant="return" />}
    >
      <div className="auth-scene">
        <div className="auth-header">
          <PhosphorHeader
            title={AUTH_CONTENT.login.title}
            subtitle={AUTH_CONTENT.login.subtitle}
            style="dramatic"
            delay={200}
          />
        </div>

        <div className="auth-card">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your name..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Your secret word..."
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting || isDemoLoading}
            >
              {isSubmitting ? 'Entering...' : 'Resume Descent'}
            </button>
          </form>

          <div className="demo-section">
            <div className="demo-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="btn btn-demo btn-full"
              onClick={handleDemoLogin}
              disabled={isSubmitting || isDemoLoading}
            >
              {isDemoLoading ? 'Awakening...' : 'Quick Descent'}
            </button>
            <p className="demo-hint">
              Skip registration - experience the Field immediately
            </p>
          </div>

          <p className="auth-footer">
            {AUTH_CONTENT.login.footer}{' '}
            <Link to="/register">Begin your legend</Link>
          </p>
        </div>
      </div>
    </AtmosphericPage>
  );
}

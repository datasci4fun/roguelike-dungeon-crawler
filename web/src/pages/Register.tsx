/**
 * Register Page - Begin Your Legend
 *
 * Full scene treatment with:
 * - Kingdom background (the world you're leaving)
 * - Atmospheric particles
 * - PhosphorHeader with lore text
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import { AUTH_CONTENT } from '../data/loreSkyfall';
import './Auth.css';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        username,
        email,
        password,
        display_name: displayName || undefined,
      });
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

  return (
    <AtmosphericPage
      backgroundType="kingdom"
      particles={{ type: 'dust', count: 25, speed: 'slow', opacity: 0.2 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="auth-scene">
        <div className="auth-header">
          <PhosphorHeader
            title={AUTH_CONTENT.register.title}
            subtitle={AUTH_CONTENT.register.subtitle}
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
                minLength={3}
                maxLength={32}
                placeholder="Choose your identity..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="How we reach you..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="displayName">Display Name (optional)</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={64}
                placeholder="What they'll call you..."
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
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm your secret..."
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Forging legend...' : 'Begin Your Legend'}
            </button>
          </form>
          <p className="auth-footer">
            {AUTH_CONTENT.register.footer}{' '}
            <Link to="/login">Resume your descent</Link>
          </p>
        </div>
      </div>
    </AtmosphericPage>
  );
}

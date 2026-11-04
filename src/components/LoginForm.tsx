'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const authService = useMemo(() => {
    return new AuthService(new SupabaseAuthRepository());
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.login(email, password);
      router.push(result.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Triton Event Portal</h1>
          <p className="login-subtitle">Sign in as a Volunteer or Organizer</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="login-error-banner" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading} className="login-submit-button">
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default LoginForm;

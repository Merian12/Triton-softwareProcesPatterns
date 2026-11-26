'use client';
import { LanguageSwitcher, useLanguage } from '@/components/LanguageProvider';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, UserRole } from '@/services/authService';
import { SupabaseAuthRepository } from '@/repositories/supabaseAuthRepo';
import { Logo } from '@/components/Logo';
import { checkbox } from '@/components/portalStyles';

export const LoginForm: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [isAtLeast15, setIsAtLeast15] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const authService = useMemo(() => {
    return new AuthService(new SupabaseAuthRepository());
  }, []);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('volunteer');
    setIsAtLeast15(false);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleMode = () => {
    resetForm();
    setIsSignUp((prev) => !prev);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1800);

    try {
      if (isSignUp) {
        const result = await authService.register(email, password, confirmPassword, role, username, isAtLeast15);
        router.push(result.redirectUrl);
      } else {
        const result = await authService.login(email, password);
        router.push(result.redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (isSignUp ? 'Sign-up failed.' : 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-container relative">
      <div className="absolute right-6 top-2"><LanguageSwitcher /></div>
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo-wrapper">
            <Logo
              variant="full"
              hoverAnimation="none"
              loading={isLoading || isSpinning}
              className="login-logo"
            />
          </div>

          <p className="login-subtitle">
            {isSignUp ? t("Create your account") : t("Sign in as a Volunteer or Organizer")}
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="login-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="username" className="form-label">{t("Username")}</label>
              <input
                type="text"
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("your_username")}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">{t("Email")}</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("you@example.com")}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">{t("Password")}</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("••••••••")}
              required
              disabled={isLoading}
            />
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">{t("Confirm Password")}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("••••••••")}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Role")}</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-option ${role === 'volunteer' ? 'role-option-active' : ''}`}
                    onClick={() => setRole('volunteer')}
                    disabled={isLoading}
                  >
                    {t("Volunteer")} </button>
                  <button
                    type="button"
                    className={`role-option ${role === 'organizer' ? 'role-option-active' : ''}`}
                    onClick={() => setRole('organizer')}
                    disabled={isLoading}
                  >
                    {t("Organizer")} </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ageConfirmation" className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    id="ageConfirmation"
                    className={`mt-0.5 shrink-0 ${checkbox}`}
                    checked={isAtLeast15}
                    onChange={(e) => setIsAtLeast15(e.target.checked)}
                    required
                    disabled={isLoading}
                  />
                  <span>{t('I declare that I am 15 years or older')}</span>
                </label>
              </div>
            </>
          )}

          {error && (
            <p className="login-error-banner" role="alert">
              {t(error)}
            </p>
          )}

          {successMessage && (
            <p className="login-success-banner" role="status">
              {t(successMessage)}
            </p>
          )}

          <button type="submit" disabled={isLoading} className="login-submit-button">
            {isLoading
              ? (isSignUp ? t('Creating account...') : t('Signing in...'))
              : (isSignUp ? t('Sign Up') : t('Log In'))}
          </button>
        </form>

        <p className="login-toggle">
          {isSignUp ? t("Already have an account?") : t("Don't have an account?")}{' '}
          <button type="button" className="login-toggle-button" onClick={toggleMode} disabled={isLoading}>
            {isSignUp ? t("Log In") : t("Sign Up")}
          </button>
        </p>
      </div>
    </main>
  );
};

export default LoginForm;

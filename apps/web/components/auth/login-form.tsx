'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { validateEmail } from '../../lib/auth/auth-utils';
import { createClient } from '../../lib/supabase/client';

interface LoginFormProps {
  onToggleMode?: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const { signIn, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await signIn(formData.email, formData.password);
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail || !validateEmail(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }

    setIsResetting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-background">
      <div className="bg-discord-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-discord-text mb-2">Welcome back!</h1>
          <p className="text-discord-text-muted">We're so excited to see you again!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="email" className="block text-discord-text mb-2 text-sm">
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-discord-tertiary text-discord-text rounded-md focus:outline-none focus:ring-2 focus:ring-discord-accent ${errors.email ? 'ring-2 ring-red-500' : ''
                }`}
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="off"
            />
            {errors.email && <p className="mt-1 text-red-500 text-xs">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-discord-text mb-2 text-sm">
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-discord-tertiary text-discord-text rounded-md focus:outline-none focus:ring-2 focus:ring-discord-accent ${errors.password ? 'ring-2 ring-red-500' : ''
                }`}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password}</p>}

            {/* Forgot Password Link */}
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-discord-text-link hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-discord-accent text-white rounded-md hover:bg-discord-accent-hover focus:outline-none focus:ring-2 focus:ring-discord-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-discord-text-muted">
            Need an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-discord-text-link hover:underline focus:outline-none"
            >
              Register
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-discord-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-discord-text">Reset Password</h2>
              <button
                onClick={closeForgotPassword}
                className="text-discord-text-muted hover:text-discord-text"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-md">
                  <p className="font-medium">Check your email!</p>
                  <p className="text-sm mt-1">We've sent a password reset link to {resetEmail}</p>
                </div>
                <button
                  onClick={closeForgotPassword}
                  className="w-full py-2 px-4 bg-discord-accent text-white rounded-md hover:bg-discord-accent-hover focus:outline-none focus:ring-2 focus:ring-discord-accent"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-discord-text-muted text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div>
                  <label htmlFor="resetEmail" className="block text-discord-text mb-2 text-sm">
                    EMAIL
                  </label>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-discord-tertiary text-discord-text rounded-md focus:outline-none focus:ring-2 focus:ring-discord-accent"
                    placeholder="you@example.com"
                    disabled={isResetting}
                    autoFocus
                  />
                </div>

                {resetError && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-md text-sm">
                    {resetError}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="flex-1 py-2 px-4 bg-discord-tertiary text-discord-text rounded-md hover:bg-discord-background-tertiary focus:outline-none"
                    disabled={isResetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2 px-4 bg-discord-accent text-white rounded-md hover:bg-discord-accent-hover focus:outline-none focus:ring-2 focus:ring-discord-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

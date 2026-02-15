'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-context';
import { validateEmail, validatePassword, validateUsername } from '../../lib/auth/auth-utils';

interface RegisterFormProps {
  onToggleMode?: () => void;
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const { signUp, isLoading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Countdown timer for signup cooldown
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => setCooldownRemaining(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  // Redirect to channels when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/channels/me');
    }
  }, [isAuthenticated, router]);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    errors: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }

    // Check password strength as user types
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else {
      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.errors[0];
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = passwordStrength.errors[0];
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || cooldownRemaining > 0) return;

    await signUp(formData.email, formData.password, formData.username);

    // Start local cooldown after attempt (store also has a guard)
    setCooldownRemaining(60);
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength.isValid) {
      if (passwordStrength.errors.length <= 1) return 'text-yellow-500';
      if (passwordStrength.errors.length <= 2) return 'text-orange-500';
      return 'text-red-500';
    }
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-background">
      <div className="bg-discord-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-discord-text mb-2">Create an account</h1>
          <p className="text-discord-text-muted">We're so excited to see you here!</p>
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
            <label htmlFor="username" className="block text-discord-text mb-2 text-sm">
              USERNAME
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-discord-tertiary text-discord-text rounded-md focus:outline-none focus:ring-2 focus:ring-discord-accent ${errors.username ? 'ring-2 ring-red-500' : ''
                }`}
              placeholder="username"
              disabled={isLoading}
              autoComplete="off"
            />
            {errors.username && <p className="mt-1 text-red-500 text-xs">{errors.username}</p>}
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
              autoComplete="new-password"
            />
            {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password}</p>}
            {formData.password && (
              <div className={`mt-1 text-xs ${getPasswordStrengthColor()}`}>
                {passwordStrength.isValid
                  ? 'Strong password!'
                  : `${passwordStrength.errors.length} requirements missing`}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-discord-text mb-2 text-sm">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-discord-tertiary text-discord-text rounded-md focus:outline-none focus:ring-2 focus:ring-discord-accent ${errors.confirmPassword ? 'ring-2 ring-red-500' : ''
                }`}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-red-500 text-xs">{errors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !passwordStrength.isValid || cooldownRemaining > 0}
            className="w-full py-2 px-4 bg-discord-accent text-white rounded-md hover:bg-discord-accent-hover focus:outline-none focus:ring-2 focus:ring-discord-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' :
              cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-discord-text-muted">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-discord-text-link hover:underline focus:outline-none"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

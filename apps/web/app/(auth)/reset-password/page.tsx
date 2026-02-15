'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/auth/auth-utils';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState({
        isValid: false,
        errors: [] as string[],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Check if we have a valid session (from email link)
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Invalid or expired reset link. Please request a new password reset.');
            }
        };

        checkSession();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (error) {
            setError('');
        }

        // Check password strength as user types
        if (name === 'password') {
            setPasswordStrength(validatePassword(value));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!passwordStrength.isValid) {
            newErrors.password = passwordStrength.errors[0];
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError('');

        try {
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            setIsLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (!passwordStrength.isValid) {
            if (passwordStrength.errors.length <= 1) return 'text-yellow-500';
            if (passwordStrength.errors.length <= 2) return 'text-orange-500';
            return 'text-red-500';
        }
        return 'text-green-500';
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-discord-background">
                <div className="bg-discord-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
                    <div className="text-center">
                        <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-md mb-4">
                            <p className="font-medium">Password reset successful!</p>
                            <p className="text-sm mt-1">Redirecting to login...</p>
                        </div>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-accent mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-discord-background">
            <div className="bg-discord-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-discord-text mb-2">Reset your password</h1>
                    <p className="text-discord-text-muted">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-discord-text mb-2 text-sm">
                            NEW PASSWORD
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
                            CONFIRM NEW PASSWORD
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
                        disabled={isLoading || !passwordStrength.isValid}
                        className="w-full py-2 px-4 bg-discord-accent text-white rounded-md hover:bg-discord-accent-hover focus:outline-none focus:ring-2 focus:ring-discord-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Resetting password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-discord-text-link hover:underline text-sm focus:outline-none"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}

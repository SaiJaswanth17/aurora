'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useRedirectIfAuthenticated();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-background">
        <div className="text-discord-text">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <AuthLayout />;
}

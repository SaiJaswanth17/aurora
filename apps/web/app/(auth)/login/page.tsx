'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Simple redirect when authenticated
    if (!isLoading && isAuthenticated) {
      console.log('LoginPage: User authenticated, redirecting...');
      router.push('/channels/me');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-background">
        <div className="text-discord-text">Loading...</div>
      </div>
    );
  }

  // If authenticated, show redirecting message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-background px-4">
        <div className="text-discord-text text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-accent mx-auto mb-4"></div>
          <p>Redirecting to app...</p>
        </div>
      </div>
    );
  }

  // Show login form
  return <AuthLayout />;
}

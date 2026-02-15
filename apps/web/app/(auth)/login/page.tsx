'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if we have a user and we're not already redirecting
    if (!isLoading && isAuthenticated && user && !isRedirecting) {
      console.log('LoginPage: Auth confirmed, redirecting to app...', { user });
      setIsRedirecting(true);
      router.push('/channels/me');
    }
  }, [isAuthenticated, isLoading, user, router, isRedirecting]);

  // Show redirecting state only after successful auth
  if (isRedirecting || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-background">
        <div className="text-discord-text">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-accent mx-auto mb-4"></div>
          Redirecting to app...
        </div>
      </div>
    );
  }

  // Always show the auth layout - the form handles its own loading state
  return <AuthLayout />;
}
